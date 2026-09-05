/*

	Lilact
	Copyright (C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>
	All rights reserved.

	BSD-2-Clause

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	* Redistributions of source code must retain the above copyright
		notice, this list of conditions and the following disclaimer.
	* Redistributions in binary form must reproduce the above copyright
		notice, this list of conditions and the following disclaimer in the
		documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/

import Lilact from "./lilact.jsx";
import { isEmpty } from "./misc.jsx";
import { LAZY } from "./symbols.jsx";
import { injectGlobal } from "@emotion/css";

function joinPaths(basePath, relativePath) {
	const absolute = relativePath.startsWith("/");
	const parts = (absolute ? "" : basePath)
		.split("/")
		.filter(Boolean);

	if (!absolute && !basePath.endsWith("/")) {
		parts.pop();
	}

	for (const part of relativePath.split("/")) {
		if (!part || part === ".") continue;

		if (part === "..") {
			parts.pop();
		} else {
			parts.push(part);
		}
	}

	return `${absolute ? "/" : ""}${parts.join("/")}`;
}

function asError(value, fallback = "Unknown error") {
	if (value instanceof Error) return value;
	if (value?.error instanceof Error) return value.error;

	const error = new Error(
		value?.message == null ? fallback : String(value.message)
	);

	if (value && typeof value === "object") {
		if (value.name) error.name = value.name;
		if (value.stack) error.stack = value.stack;

		for (const key of Object.keys(value)) {
			if (!(key in error)) {
				error[key] = value[key];
			}
		}
	}

	return error;
}

/*
* The first module that catches an error owns its source location.
* Parent modules must never replace it.
*/
function markSource(value, path) {
	const error = asError(value);

	if (!error.lilact_source) {
		error.lilact_source = { path };
	}

	return error;
}

function report(value, path) {
	const error = markSource(value, path);

	if (error.isTraced) {
		return error;
	}

	if (typeof Lilact.traceError === "function") {
		return Lilact.traceError(error, path);
	}

	Lilact.error = error;
	return error;
}

export const required_scripts = {};

function createModule(path, {
	code = "",
	isInline = false,
	isModule = true,
} = {}) {
	const module = {
		path,
		code: String(code),
		mappings: [],
		exports: {},

		isInline,
		isModule,

		// True only after the module has been successfully evaluated.
		loaded: false,

		// The promise for the request currently loading this resource.
		// This is deliberately stored on the module to deduplicate requests.
		request: undefined,

		error: undefined,
	};

	required_scripts[path] = module;
	return module;
}

export function run(
	jsx,
	path = `InlineJSX-${++Lilact.eval_num}`,
	{
		isInline = true,
		isModule = true,
	} = {}
) {
	let module = required_scripts[path];

	/*
	* A module may already have been created by require() while its source is
	* being fetched. Reuse that module so the request and its exports remain
	* associated with the same entry.
	*/
	if (!module) {
		module = createModule(path, {
			code: jsx,
			isInline,
			isModule,
		});
	} else {
		/*
		* Preserve module.request. It may represent the request that led to this
		* run() call, and clearing it here would make retry/deduplication logic
		* fragile.
		*/
		module.path = path;
		module.code = String(jsx);
		module.mappings = [];
		module.exports = {};
		module.isInline = isInline;
		module.isModule = isModule;
		module.loaded = false;
		module.error = undefined;
	}

	let processed;

	try {
		processed = Lilact.transpileJSX(String(jsx), {
			path,
			mappings: module.mappings,
			factory: "createComponent",
			appendSourcemap: false,
			injectTraceLabels: true,
			produceCJS: true,
			blocks_info: Lilact.blocks_info,
		});
	} catch (value) {
		const error = asError(value);

		error.fileName ??= path;
		error.sourcePhase = "transpile";

		module.error = error;
		Lilact.error = error;

		throw error;
	}

	if (typeof Lilact.scanBlockLabels === "function") {
		Lilact.scanBlockLabels(processed, path);
	}

	/*
	* sourceURL helps when the browser includes eval locations in its stack.
	* It is not used as the authoritative source; the catch block below is.
	*/
	processed += `\n//# sourceURL=eval:/${path}`;

	try {
		globalThis.Lilact = Lilact;
		globalThis.createComponent = Lilact.createComponent;
		globalThis.Fragment = Lilact.Fragment;

		const result = eval(processed);

		module.loaded = true;

		return isEmpty(module.exports)
			? result
			: module.exports;
	} catch (value) {
		/*
		* This catch executes in the module whose eval failed, including
		* generated-JavaScript syntax errors. Therefore path is authoritative.
		*/
		const error = report(value, path);

		error.sourcePhase ??= "runtime";
		module.error = error;

		throw error;
	}
}

function getOrCreateModule(path, options = {}) {
	return required_scripts[path] || createModule(path, options);
}

function loadAsyncResource(path, module) {
	let source;

	try {
		const resolved = Lilact.resolver?.(path);

		if (resolved == null) {
			if (module.code && !module.loaded) {
				source = Promise.resolve(module.code);
			} else {
				source = fetch(path).then(response => {
					if (!response.ok) {
						throw report(
							new Error(
								`Unable to load ${path}: HTTP ${response.status}`
							),
							path
						);
					}

					return response.text();
				});
			}
		} else {
			source = Promise.resolve(resolved);
		}
	} catch (value) {
		source = Promise.reject(report(value, path));
	}

	/*
	* Always convert the source to a promise. The promise is assigned to the
	* module before any caller can make another require() call.
	*/
	let request;

	request = Promise.resolve(source)
		.then(sourceText => {
			module.code = String(sourceText);

			if (path.endsWith(".css")) {
				injectGlobal(module.code);
				module.loaded = true;
				return undefined;
			}

			return run(module.code, path, {
				isInline: false,
				isModule: true,
			});
		})
		.then(result => result?.default ?? result)
		.catch(error => {
			module.error = report(error, path);
			throw module.error;
		})
		.finally(() => {
			/*
			* Do not remove a newer request accidentally if a future forceUpdate
			* request replaced this one.
			*/
			if (module.request === request) {
				module.request = undefined;
			}
		});

	module.request = request;
	return request;
}

export function require(path) {
	let options = {};

	if (
		arguments.length === 2 &&
		arguments[1] &&
		typeof arguments[1] === "object"
	) {
		options = arguments[1];
	}

	if (Lilact.importObjectPaths?.[path]) {
		return Lilact.importObjectPaths[path];
	}

	if (options.requirer?.path) {
		path = joinPaths(options.requirer.path, path);
	}

	const loadAsync =
		Boolean(Lilact[LAZY]) ||
		Boolean(options.isLazy);


	const module = getOrCreateModule(path, {
		isInline: false,
		isModule: true,
	});

	/*
	* A completed module can be returned synchronously unless the caller
	* explicitly requests lazy loading.
	*/
	if (module.loaded && !options.forceUpdate && !loadAsync) {
		return module.exports;
	}

	if (path.startsWith("#")) {
		const element = document.getElementById(path.slice(1));

		if (!element) {
			throw report(
				new Error(`Required element not found (${path})`),
				path
			);
		}

		return run(element.textContent || "", path);
	}

	if (loadAsync) {
		Lilact[LAZY] = false;

		/*
		* Every subsequent lazy require() receives the first request promise.
		* This applies even when the module is still being fetched and even when
		* the first caller used forceUpdate.
		*/
		if (module.request) {
			return module.request;
		}

		return loadAsyncResource(path, module);
	}

	const resolved = Lilact.resolver?.(path);

	if (resolved != null) {
		if (path.endsWith(".css")) {
			injectGlobal(String(resolved));
			module.code = String(resolved);
			module.loaded = true;
			return undefined;
		}

		return run(String(resolved), path, {
			isInline: false,
			isModule: true,
		});
	}

	const request = new XMLHttpRequest();

	try {
		request.open("GET", path, false);
		request.send(null);
	} catch (value) {
		throw report(value, path);
	}

	if (request.status >= 200 && request.status < 300) {
		if (path.endsWith(".css")) {
			module.code = request.responseText;
			injectGlobal(module.code);
			module.loaded = true;
			return undefined;
		}

		return run(request.responseText, path, {
			isInline: false,
			isModule: true,
		});
	}

	throw report(
		new Error(
			`Unable to load ${path}: HTTP ${request.status || 0}`
		),
		path
	);
}

export function lazy(factory) {
	let status = "pending";
	let result;

	Lilact[LAZY] = true;

	try {
		result = factory();
	} catch (error) {
		status = "error";
		result = error;
	}

	if (Lilact.isThenable(result)) {
		result.then(
			value => {
				status = "success";
				result = value;
			},
			error => {
				status = "error";
				result = error;
			}
		);
	} else if (status !== "error") {
		status = "success";
	}

	function LazyComponent(props) {
		if (status === "pending") {
			throw result;
		}

		if (status === "error") {
			throw result;
		}

		const Component = result;
		return <Component {...props} />;
	}

	return LazyComponent;
}

function scriptTags() {
	return Array.from(
		document.querySelectorAll('script[type="text/jsx"]')
	).map(element => ({
		src: element.getAttribute("src"),
		content: element.textContent || "",
	}));
}

export async function runScripts() {
  for (const script of scriptTags()) {
    if (script.src) {
      await require(script.src);
    } else if (script.content) {
      run(script.content);
    }
  }
}