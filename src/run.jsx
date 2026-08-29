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
import Lilact from './lilact.jsx';
import {isEmpty} from './misc.jsx';

import { CORE, COMPONENT, LAZY } from "./symbols.jsx"
import { injectGlobal } from "@emotion/css"

function joinPaths(basePath, relativePath) {
	const isAbs = relativePath.startsWith("/");
	const stack = [];

	const parts = (isAbs ? "" : basePath).split("/").filter(Boolean);
	for (const p of parts) stack.push(p);

	if(!basePath.endsWith("/")) stack.pop();

	const relParts = relativePath.split("/");

	for (const p of relParts) {
		if (p === "" || p === ".") continue;
		if (p === "..") {
			if (stack.length > 0) stack.pop();
		} else {
			stack.push(p);
		}
	}

	return (isAbs ? "/" : "") + stack.join("/");
}

// Examples:
//console.log(joinPaths("a/b/c", "./../d")); // a/b/d
//console.log(joinPaths("a/b/c", "../../d")); // a/d

/** @ignore */
export const required_scripts = {};


/**
 * Runs a jsx script. All scripts can access Lilact namespace as a global object. 
 *
 * @param jsx - The code to run.
 * @param path - The optional path to be used in reporting errors.
 * 
 * @returns An array representation of the children.
 */
export function run(jsx, path=`InlineJSX-${++Lilact.eval_num}`, {isInline, isModule}={isInline:true, isModule:true})
{
	const mappings = [];
	const module = { 	
		mappings,
		isInline,
		path,
		code: jsx,
		exports: {}
	};

	let processed;


	required_scripts[path] = module;

	try {
		processed = Lilact.transpileJSX( jsx,
		{
			path,
			mappings,
			factory: "createComponent",
			appendSourcemap: false,

			injectTraceLabels: true,
			produceCJS: true,

			blocks_info: Lilact.blocks_info,
		} );
	}
	catch(e) {
		//e = Lilact.traceError(e);
		Lilact.error = e;
		throw e;
	}

if(DEBUG) {
	required_scripts[path].processed = processed;
}		
	
	processed += "\n//# sourceURL=eval:/" + path;

	// todo: this seems to be only useful in safari, should be assessed later
	Lilact.scanBlockLabels(processed, path);

	try {
		globalThis.Lilact = Lilact;
		globalThis.createComponent = Lilact.createComponent;
		globalThis.Fragment = Lilact.Fragment;

		//const res = new Function( "module", processed )(module);
		const res = eval(processed);

		if( !isEmpty(module.exports) ) return module.exports;
		return res;
	}
	catch(e) {
		e = Lilact.traceError(e);
		throw e;
	}
}


/**
 * Loads a jsx script from a path. `require` loads synchronously, as it is expected to be loaded on the next instruction.
 * 
 * If the path is in the format #id, it will query the document for a script element with the given 
 * id and run its contents.
 * 
 * If require is called inside the function given to lazy, it will run async. See `lazy`.
 * 
 * All required scripts can access Lilact namespace as a global object. 
 * 
 * @param path - The path to the required file. Must be either absolute path or relative to the current 
 * module or document’s URL (the page/location that initiated the request).
 * 
 * @returns An array representation of the children.
 */
export function require(path)
{
	let forceUpdate, checkExport, requirer, isLazy;

	// note: instead of named props, just to bypass typedoc.
	if(arguments.length===2 && typeof(arguments[1]==='object')) {
		forceUpdate = arguments[1]?.forceUpdate;
		checkExport = arguments[1]?.checkExport;
		requirer = arguments[1]?.requirer;
		isLazy = arguments[1]?.isLazy;
	}

	if(Lilact.importObjectPaths?.[path]) return Lilact.importObjectPaths[path];
	if(required_scripts[path] && !forceUpdate) return required_scripts[path].exports;
	

	if(path[0]==='#') {
		const el = document.getElementById(path);

		if(el) {
			return run(el.innerText, path);
		}

		throw new Error(`Required element not found (${path})`);
	}
	else {
		if(requirer && requirer.path) {
			path = joinPaths(requirer.path, path);
		}

		if(Lilact?.[LAZY] || isLazy) {
			Lilact[LAZY]=false;

			let p = Lilact.resolver?.(path);

			if(p) {
				p = Promise.resolve(p);
			}
			else {
				p = fetch(path).then(res => {
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					return res.text();
				});
			}
			return  p.then(res => {
						if(path.endsWith(".css")) {
							injectGlobal(res);
							return;
						}
						res = run(res, path, {isInline:false});
						return res?.default ?? res;
					})
					.catch(err => {
						throw err;
					});
		}
		else {
			const p = Lilact.resolver?.(path);
			if(p) {
				if(path.endsWith(".css")) {
					injectGlobal(p);
					return;
				}
				return run(p, path, {isInline:false});
			}
			else {
				const request = new XMLHttpRequest();
				request.open("GET", path, false);
				request.send(null);
				if (request.status === 200) {
					if(path.endsWith(".css")) {
						injectGlobal(res);
						return;
					}
					return run(request.responseText, path, {isInline:false});
				}
			}
		}
	}

	throw new Error(`Required resource not found (${path})`);
}


/**
 * Wrapper that enables async, code-split component loading. `lazy` should be used
 * outside the component definintion or it will produce new components on each rerender.
 * 
 * Note that in factory function you should use require instead of `import`. Dynamic `import` 
 * would work, but it will not be wired correctly to the `Lilact` runtime.
 * 
 * Example: 
 * ``` 
 * const StopWatch = lazy( () => require('./stopwatch.jsx') );
 * ```
 * 
 * @param factory - A function with **no arguments** that returns a `Promise`.
 * The promise must resolve to a module whose module.exports.default is a Lilact component
 * or otherwise it will be whatever the module.exports is set to.
 * 
 * @returns A Lilact component that should be rendered inside a `Suspense` boundary.
 */
export function lazy(factory) {
	let status = "pending"; // pending | success | error
	let result;             // component | error

	Lilact[LAZY] = true;
	result = factory();

	if(Lilact.isThenable(result)) {
		result.then(
			(mod) => {
				status = "success";
				result = mod;
				return result;
			},
			(err) => {
				status = "error";
				result = err;
				throw err;
			}
		);
	}
	else {
		status = "success";
	}

	function LazyComponent(props) {
		if (status === "pending") throw result;
		if (status === "error") throw result;   
		const Component = result;
		return <Component {...props} />;
	}

	return LazyComponent;
}

function scanScriptTagsWithType() {
	const scripts = Array.from(
		document.querySelectorAll('script[type="text/jsx"]')
	);

	return scripts.map((el) => ({
		src: el.getAttribute("src") ?? null,
		content: el.textContent ?? ""
	}));
}

/**
 * Scans the whole documents and runs all the script elements with type `text/jsx`.
 * It is automatically attached to document.onload when Lilact is loaded.
 * 
 * If element src is set, it will be loaded via `require`.
 * If element has inner content, it will be executed via `run`.
 * 
 * If both are present, first the src is loaded and then the inner content is executed.
 *
 * Note that it won't detect such elements that are added after document.onload.
 * @returns {void}
 */

export function runScripts()
{
	const scripts = scanScriptTagsWithType();

	for(const s of scripts) {
		if(s.src) require(s.src);
		if(s.content) run(s.content);
	}
}

