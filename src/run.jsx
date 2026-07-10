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

ʔ defineSymbols ( "LILACT", [ "CORE", "COMPONENT", "LAZY" ] ) ʔ

import Lilact from './lilact.jsx';


/**
 * Runs a jsx script. All scripts can access Lilact namespace as a global object. 
 *
 * @param jsx - The code to run.
 * @param path - The optional path to be used in reporting errors.
 * @param is_inline - To treat the code as inline. The main difference at the moment is that inline code doesn't include sourcemap.
 * 
 * @returns An array representation of the children.
 */
export function run(jsx, path=`InlineJSX-${++Lilact.eval_num}`, is_inline=true)
{
	const mappings = [];
	const module = {exports: {}};
	let processed;


	Lilact.required_scripts[path] = { 	
		mappings,
		module,
		is_inline,
		path,
		code: jsx,
	};


	try {
		processed = Lilact.transpileJSX( jsx,
		{
			path,
			mappings,
			factory: "createComponent",
			appendSourcemap: false,
			blocks_info: Lilact.blocks_info,

			injectTraceLabels: true,
		} );
	}
	catch(e) {
		//e = Lilact.traceError(e);
		Lilact.error = e;
		throw e;
	}

ʔ if(DEBUG) {
		Lilact.required_scripts[path].processed = processed;
ʔ }		
	
	processed += "\n//# sourceURL=eval:/" + path;

	// todo: this seems to be only useful in safari, should be assessed latera
	Lilact.scanBlockLabels(processed, path);

	try {
		globalThis.Lilact = Lilact;
		globalThis.createComponent = Lilact.createComponent;
		globalThis.Fragment = Lilact.Fragment;

		//const res = new Function( "module", processed )(module);
		const res = eval(processed);
		if(module.exports) return module.exports;
		return res;
	}
	catch(e) {
		e = Lilact.traceError(e);
		throw e;
	}
}


/**
 * Loads a jsx script from a path. All scripts can access Lilact namespace as a global object. 
 * 
 * `Lilact.require` loads synchronously, as it is expected to be loaded on the next instruction.
 * 
 * As running the transpiled scripts rely on `new Function`, it is not possible to use module imports 
 * and exports. So to import you should use `const {useState} = Lilact` convention. And to 
 * export, you should use `module.exports = ...`. `Lilact.require` returns `module.exports` value
 * so you can import different modules using the convention above.
 * 
 * If the path is in the format #id, it will query the document for a script element with the given 
 * id and run its contents.
 * 
 * If require is called inside the function given to lazy, it will run async. See `lazy`.
 * 
 * @param path - The path to the required file. Must be either absolute path or relative to the current 
 * document’s URL (the page/location that initiated the request).
 * 
 * @param force_update - To treat the code as inline. The main difference at the moment is that inline code doesn't include sourcemap.
 * 
 * @returns An array representation of the children.
 */
export function require(path, force_update)
{
	if(Lilact.required_scripts[path] && !force_update) return Lilact.required_scripts[path].module;
	
	if(path[0]==='#') {

		const el = document.getElementById(path);

		if(el) {
			return Lilact.run(el.innerText, path);
		}

	}
	else if(Lilact?.[LAZY]) {
		Lilact[LAZY]=false;

		return fetch(path)
			.then(res => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return res.text();
			})
			.then(res => {
				res = Lilact.run(res, path, false);
				// todo: this is for the lazy, so we detect default, should we do it in sync mode too?
				return res?.default ?? res;
			})
			.catch(err => {
				throw err;
			});
	}
	else {
		// note: this makes a sync request. this is not advised,
		// but import should be sync. for an async solution use lazy and suspense.

		const request = new XMLHttpRequest();
		request.open("GET", path, false);
		request.send(null);
		if (request.status === 200) {
			return Lilact.run(request.responseText, path, false);
		}
	}

	throw new Error(`Required resource not found (${path})`);
}


/**
 * Wrapper that enables async, code-split component loading. `lazy` should be used
 * outside the component definintion or it will produce new components on each rerender.
 *
 * @param factory - A function with **no arguments** that returns a `Promise`.
 * The promise must resolve to a module whose module.exports.default is a Lilact component
 * or otherwise it will be whatever the module.exports is set to.
 * 
 * @returns A Lilact component that should be rendered inside a {@link Suspense} boundary.
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
 * If element src is set, it will be loaded via `Lilact.require`.
 * If element has inner content, it will be executed via `Lilact.run`.
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
		if(s.src) Lilact.require(s.src);
		if(s.content) Lilact.run(s.content);
	}
}

