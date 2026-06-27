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

const TRANSPILER_OUTPUT = Symbol.for("LILACT:TRANSPILER_OUTPUT");


export function defineSymbols(ns, defs) {

	if(defs===undefined) {
		defs=ns;
		ns='';
	}
	else ns+=':';

	const out = [];
	const lbls = [];
	if(defs instanceof Array) {
		if(ns!=='') {
			if(typeof(ns)!=='string') ns='';
			for(let d of defs) {
				lbls.push(d);
				out.push(`Symbol.for('${ns}${d}')`);
			}
		}
		else {
			for(const d of defs) {
				lbls.push(d);
				out.push(`Symbol()`);
			}
		}
		return `const [${lbls.join(',')}]=[${out.join(',')}];`;
	}
}

export const quote = (x)=>`"${String(x).replace(/(["\n])/g, '\\$1')}"`;


// note: this directive is used for files that can be used separatly (i.e. timers.jsx)
// 		 or in case  you want to check the preprocessors output. 

export function outputJS(filepath) {
	globalThis[TRANSPILER_OUTPUT] = filepath;
}
