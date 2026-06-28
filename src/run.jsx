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

ʔ defineSymbols ( "LILACT", [ "CORE", "COMPONENT" ] ) ʔ

import Lilact from './lilact.jsx';

/**
 * Runs a jsx script. All scripts can access Lilact namespace as a global object. 
 * 
 * Notice that `run` uses eval internally. There is no standard way of getting the error location when
 * running it with eval. Lilact has its own experimental workarounds for this.
 * When an inline script raises an exception, the original exception does not report
 * which eval has caused the error, so Lilact should guess it from some labels, and for the sake of 
 * efficiency, it is block based and not exact.
 *
 * @param jsx - The code to run.
 * @param path - The optional path to be used in reporting errors.
 * @param is_inline - To treat the code as inline. The main difference at the moment is that inline code doesn't include sourcemap.
 * 
 * @returns An array representation of the children.
 */
export function run(jsx, path=`<string input ${++Lilact.eval_num}>`, is_inline=true)
{
	if(Lilact.checkTraceErrors) Lilact.checkTraceErrors;

	const mappings = [];

	let processed;

	try {
		processed = Lilact.transpileJSX( jsx,
		{
			path,
			mappings,
			factory: "Lilact.createComponent",
			append_sourcemap: !is_inline,
			wrap_all: false
		} );
	}
	catch(e) {
		e.lilact_trace = path;
		throw e;
	}

	// the separation of module property is to create the required object even on error

	const module = {};

	Lilact.transpilerConfig.required[path] = { 	
		mappings,
		processed,
		module,
		is_inline,
		path,
		code: jsx
	};

	
	Lilact.scanFunctionLabels(processed, path);

	Lilact.transpilerConfig.func_labels[path] = {
		path,
		row: 0,
		col: 0,
		label: "<EXEC>",
		required: Lilact.transpilerConfig.required[path]
	}

	try {
		globalThis.Lilact = Lilact;

		const res = eval ( processed );
		if(module.exports) return module.exports;
		return res;
	}
	catch(e) {
		e.lilact_trace = path;
		throw e;
	}
}

// export async function importAsync(path)
// {
// 	const res = await fetch(path);
// 	const text = await res.text();

// 	return Lilact.run(text, path, false);
// }

/**
 * Loads a jsx script from a path. All scripts can access Lilact namespace as a global object. 
 * 
 * `Lilact.require` loads synchronously, as it is expected to be loaded on the next instruction.
 * 
 * As running the transpiled scripts rely on `eval`, it is not possible to use module imports 
 * and exports. So to import you should use `const {useState} = Lilact` convention. And to 
 * export, you should use `module.exports = ...`. `Lilact.require` returns `module.exports` value
 * so you can import different modules using the convention above.
 * 
 * @param path - The path to the required file.
 * @param force_update - To treat the code as inline. The main difference at the moment is that inline code doesn't include sourcemap.
 * 
 * @returns An array representation of the children.
 */
export function require(path, force_update)
{
	if(Lilact.transpilerConfig.required[path]!==undefined && !force_update) return Lilact.transpilerConfig.required[path].module;

	if(path[0]==='#') {

		const el = document.querySelector(path);

		if(el) {
			return Lilact.run(el.innerText, path);
		}

	}
	else {

		// note: this makes a sync request. this is not advised,
		// but import should be sync. for an async solution use importAsync.

		const request = new XMLHttpRequest();
		request.open("GET", path, false);
		request.send(null);

		if (request.status === 200) {
			return Lilact.run(request.responseText, path, false);
		}
	}

	throw `required resource not found (${path})`;
}


/**
 * Debug tool to get the Lilact traced location of an error. It can also produce some block based stack trace 
 * if `Lilact.transpilerConfig.enableLabelStack` is set to `true` before loading the script. This is `false`
 * by default for efficiency.
 *
 * @returns A new object that includes `path`, `row`, `col`, `msg`, `name`, and optional `stack`. 
 * The exception itself is stored as `err`.
 */
export function traceError(err)
{
	const loc = Lilact.getErrorLocation(err);

	const obj = {
		path: err.fileName,
		label: null,
		
		row: loc[0],
		col: loc[1],

		msg: err.message,
		name: err.name,

		stack: null,
		err: err
	};		


	if(err.lilact_trace!==undefined) {

		// to be able to trace, we assume that all of the scripts are running inside lilact.
		// if not, the error is returned unchanged and stack and label would remain null.

		let mps;
		let blk;
		if(typeof(err.lilact_trace)==='string') {
			blk = Lilact.func_labels[err.lilact_trace];
			mps = blk.required.mappings;
		}
		else if(typeof(err.lilact_trace)==='object') {
			blk = Lilact.func_labels[err.lilact_trace[0]];
			mps = blk.mappings;
		}

		obj.path = blk.path;
		obj.label = blk.label;

		[obj.row, obj.col] = Lilact.mapLocation(mps, obj.row,obj.col);

		//const rm = Lilact.func_labels[func_num].required;

		// Lilact.onError( err.message,
		// 				rm.path,
		// 				Lilact.func_labels[func_num].label,
		// 				...Lilact.mapLocation(...loc,mps),
		// 				Lilact.call_stack.map(
		// 					(x)=>({ path: Lilact.func_labels[x].path,
		// 							label: Lilact.func_labels[x].label,
		// 							row: Lilact.func_labels[x].row
		// 						})
		// 				),	err );

		
	}

	return obj;
	
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