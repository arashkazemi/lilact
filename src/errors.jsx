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



// Lilact API

function getErrorLocation(err) // works for both error and error-event, and also in node env
{
	if(err.lineno!==undefined || err.line!==undefined || err.lineNumber!==undefined) {
		const l = err.lineNumber || err.lineno || err.line;
		const c = err.columnNumber || err.colno || err.column;

		return {line: l, col: c};
	}

	let match = /:(\d+):(\d+)[\n].*/m.exec(err.stack);
	if(match===null) {
		match = /:(\d+):(\d+)\)\s+at .*/m.exec(err.stack);
	}

	if(match) {
		return {line: parseInt(match[1]), col: parseInt(match[2])}
	}

	return null;
}

// Extract { url, line, col } from an Error.stack.
// Works with common formats like:
// Chrome/Edge:   at fn (eval:xxx:LINE:COL)
// Firefox:       fn@eval:xxx:LINE:COL
// Safari:        @eval:xxx:LINE:COL   (sometimes)
/** @ignore */
function parseEvalLocationFromStack(stack, urlPrefix = "eval:/") {
  const raw = typeof stack === "string" ? stack : String(stack || "");
  const lines = raw.split(/\r?\n/);

  // Match "... (eval:path:LINE:COL)" or "... eval:path:LINE:COL"
  // Group 1: url, group 2: line, group 3: col (col optional in some formats)
  const re = new RegExp(`\\(?((?:${escapeRegExp(urlPrefix)})[^\\s):]+):(\\d+):(?:(\\d+))?\\)?$`);

  for (const l of lines) {
    const line = l.trim();
    if (!line.includes(urlPrefix)) continue;

    const m = line.match(re);
    if (!m) continue;

    const url = m[1];
    const parsedLine = Number(m[2]);
    const parsedCol = m[3] == null ? null : Number(m[3]);

    if (Number.isFinite(parsedLine) && (parsedCol === null || Number.isFinite(parsedCol))) {
      return { url, line: parsedLine, col: parsedCol, matched: line };
    }
  }

  return { url: null, line: null, col: null, matched: null, stackPreview: lines.slice(0, 6).join("\n") };
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function mapLocation(mps, r,c)
{
	let map = null;

	for(const i in mps) {
		if(mps[i][0]<r) continue;
		if(mps[i][0]>r || (mps[i][0]===r && mps[i][1]>=c)) {
			map = mps[i-1];
			break;
		}
	}
	if(!map) map = mps[mps.length-1];
	return {line: r-map[0]+map[2], col: ((r-map[0]===0)?map[3]:0) };
}


/** @ignore */
export function scanBlockLabels(code, path)
{
	const ls = Array.from( code.matchAll(/LILACTBLOCK(\d+):(\d+),(\d+):([^*]+)\*\//mg) );

	// todo: this is not memory efficient, the structure should be upside-down
	ls.forEach(
		(x) => {
			Lilact.blocks_info.labels[x[1]] = {
				path,
				desc: x[4]
			}
		} );
}


/**
 * Debug tool to get the Lilact traced location of an error. It can also produce some block based stack trace 
 * if `Lilact.transpilerConfig.enableLabelStack` is set to `true` before loading the script. This is `false`
 * by default for efficiency.
 * 
 * @param error - The error object 
 *
 * @returns A new object that includes `path`, `row`, `col`, `msg`, `name`, and optional `stack`. 
 * The exception itself is stored as `err`.
 */
export function traceError(error)
{
	if(error?.is_traced) {
		return error;
	}

	const loc = parseEvalLocationFromStack(error.stack);

	const obj = {
		fileName: loc.url?.slice(6) || error.fileName,
		
		lineNumber: loc.line,
		columnNumber: loc.col,

		message: error.message,
		name: error.name,

		stack: error.stack,
		_error: error,

		is_traced: true
	};		

	if( error.name!=='JSXParseError' ) {

		let mps;

		if(loc.url) {
			const rm = Lilact.required_scripts[obj.fileName];
			mps = rm.mappings;
			
			const mloc = mapLocation(mps, obj.lineNumber-1, obj.columnNumber-1);

			obj.lineNumber = mloc.line;
			obj.columnNumber = mloc.col;
		}
		else if( error.lilact_trace!==undefined) {

			let loc = getErrorLocation(error);

			let mps;
			let blk;

			if(typeof(error.lilact_trace)==='object') {
				blk = Lilact.blocks_info.labels[error.lilact_trace[0]];
			}
			else {
				blk = Lilact.blocks_info.labels[error.lilact_trace];
			}

			if(blk) {
				obj.fileName = blk.path;
				obj.label = blk.label;

				mps = Lilact.required_scripts[blk.path].mappings;

				loc = mapLocation(mps, loc.line-1, loc.col-1);

				obj.lineNumber = loc.line;
				obj.columnNumber = loc.col;
			}
		}
		
	}
	else {
		const loc = getErrorLocation(error);
		if(error.fileName) obj.fileName = error.fileName;
		obj.lineNumber = loc.line;
		obj.columnNumber = loc.col;
	}

	Lilact.error = obj;
	return obj;
	
}

/**
 * The global Lilact error handler that shows a modal containing information 
 * when an exception is not handled. 
 * 
 * It is  by default attached to the `window.onerror` when using the development 
 * bundle. It is not attached in the production mode, but it is available in the 
 * bundle and can be attached.
 *
 * 
 * `
 * window.addEventListener('error', (e) => {
 *	Lilact.globalErrorHandler(e);
 * });
 * `
 * @param error - The error object 
 * 
 */
export function globalErrorHandler(error)
{
	Lilact.pauseTimers();
	if(error.error) error = error.error;

	error = Lilact.traceError(error);

	const cls = Lilact.emotion.css(`
			background: linear-gradient(135deg, #fff2f2d4, #ffffffd4);
			backdrop-filter: blur(10px);
			border: 1px solid rgba(255,255,255,.25);
			border-radius: 5px;
			box-shadow: 0 10px 30px rgba(0,0,0,.35);
			overflow:hidden;
			min-width: 400px;
			width: 66%;
			red {
				color:#d00;
			}
			code {
				border: 1px solid #0003;
				overflow: auto;
				padding: 10px;
				display: block;
			}
		`);

	const el = document.createElement('dialog');

	el.className=cls;
	//<b>⚠</b> 
	el.innerHTML = 
		`<h3 style=""><red>Error!</red></h3>
		<b>${error.fileName?'At '+error.fileName:''}
		${Number.isFinite(error.lineNumber)?": Line "+(error.lineNumber+1):""}</b><br><br>
		<b>${error.name}</b>:&nbsp;<span>${error.message}</span><br><br>
		${Lilact.required_scripts[error.fileName]?'<code><pre></pre><pre><red></red></pre><pre></pre></code>':''}
		${error._error.componentStackLog?'<br>Component Stack:<br><code><pre>'+error._error.componentStackLog+'</pre></code>':''}
		`;


	document.body.appendChild(el);

	const pres = el.querySelectorAll('pre');

	if(Lilact.required_scripts[error.fileName]) {
		const lines = Lilact.required_scripts[error.fileName].code.split("\n");

		if(lines?.[error.lineNumber-1])
			pres[0].innerText = lines[error.lineNumber-1];

		if(lines?.[error.lineNumber]) el.querySelector('pre red').innerText = lines[error.lineNumber];

		if(lines?.[error.lineNumber+1])
			pres[2].innerText = lines[error.lineNumber+1];
	}

	el.showModal();
}

/** @ignore */
export const blocks_info = { counter: 0, labels: {} };

/** @ignore */
export let error = null; // this is only to ease debuggin,
