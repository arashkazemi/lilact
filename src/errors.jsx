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
/** @ignore */
export function getErrorLocation(err) // works for both error and error-event, and also in node env
{
	if(err.lineno!==undefined || err.line!==undefined || err.lineNumber!==undefined) {
		const l = err.lineNumber || err.lineno || err.line;
		const c = err.columnNumber || err.colno || err.column;

		return [l, c];
	}

	let match = /:(\d+):(\d+)[\n].*/m.exec(err.stack);
	if(match===null) {
		match = /:(\d+):(\d+)\)\s+at .*/m.exec(err.stack);
	}

	if(match) {
		return [parseInt(match[1]), parseInt(match[2])]
	}

	return null;
}

/** @ignore */
export function mapLocation(mps, r,c)
{
	let map = null;

	for(const i in mps) {
		if(mps[i][0]<r) continue;
		if(mps[i][0]>r || mps[i][1]>=c) {
			map = mps[i-1];
			break;
		}
	}
	if(!map) map = mps[mps.length-1];
	return [r-map[0]+map[2], ((r-map[0]===0)?map[3]:0)];
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
 * @returns A new object that includes `path`, `row`, `col`, `msg`, `name`, and optional `stack`. 
 * The exception itself is stored as `err`.
 */
export function traceError(err)
{
	if(err?.is_traced) {
		return err;
	}

	const loc = Lilact.getErrorLocation(err);

	const obj = {
		fileName: err.fileName,
		label: null,
		
		lineNumber: loc[0],
		columnNumber: loc[1],

		message: err.message,
		name: err.name,

		stack: null,
		_error: err,

		is_traced: true
	};		

	if( err.name!=='JSXParseError' && err.lilact_trace!==undefined ) {

		// to be able to trace, we assume that all of the scripts are running inside lilact.
		// if not, the error is returned unchanged and stack and label would remain null.

		let mps;
		let blk;

		if(typeof(err.lilact_trace)==='object') {
			blk = Lilact.blocks_info.labels[err.lilact_trace[0]];
		}
		else {
			blk = Lilact.blocks_info.labels[err.lilact_trace];
		}

		if(blk) {
			obj.fileName = blk.path;
			obj.label = blk.label;

			mps = Lilact.required_scripts[blk.path].mappings;

			[obj.lineNumber, obj.columnNumber] = Lilact.mapLocation(mps, obj.lineNumber-1,obj.columnNumber-1);

			//const rm = Lilact.block_labels[block_num].required;

			// Lilact.onError( err.message,
			// 				rm.path,
			// 				Lilact.block_labels[block_num].label,
			// 				...Lilact.mapLocation(...loc,mps),
			// 				Lilact.call_stack.map(
			// 					(x)=>({ path: Lilact.block_labels[x].path,
			// 							label: Lilact.block_labels[x].label,
			// 							lineNumber: Lilact.block_labels[x].lineNumber
			// 						})
			// 				),	err );
		}
		
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
 * 
 */
export function globalErrorHandler(err)
{
	if(err.error) err = err.error;

	err = Lilact.traceError(err);
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
			}
		`);

	const el = document.createElement('dialog');

	el.className=cls;
	//<b>⚠</b> 
	el.innerHTML = 
		`<h3 style=""><red>Error!</red></h3>
		At <b>${err.fileName}: Line ${err.lineNumber+1}</b><br><br>
		<b>${err.name}</b>:&nbsp;<span>${err.message}</span><br><br>
		<code><pre></pre><pre><red></red></pre><pre></pre></code>
		${err._error.componentStackLog?'<br>Component Stack:<br><code><pre>'+err._error.componentStackLog+'</pre></code>':''}
		`;


	document.body.appendChild(el);


	if(Lilact.required_scripts[err.fileName]) {
		const lines = Lilact.required_scripts[err.fileName].code.split("\n");
		if(err.lineNumber>0)
			el.querySelectorAll('pre')[0].innerText = lines[err.lineNumber-1];

		el.querySelector('pre red').innerText = lines[err.lineNumber];

		if(err.lineNumber<lines.length-1)
			el.querySelectorAll('pre')[2].innerText = lines[err.lineNumber+1];
	}

	el.showModal();
}

/** @ignore */
export const blocks_info = { counter: 0, labels: {} };

/** @ignore */
export let error = null; // this is only to ease debuggin,
