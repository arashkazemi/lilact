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

const keywords = new Set([
  "break","case","catch","class","const","continue","debugger","default",
  "do","else","export","extends","finally","for","function","if","import","in",
  "instanceof","super","switch","this","throw","try",
  "var","while","with","yield",  "return",
  "true","false","null","undefined",
  "enum","implements","interface","let","package","private","protected",
  "public","static","yield",
  "as","from","of","async","get","set","static","super",
  "delete", "void", "typeof", "new", "await",
]);

const operators = new Set([
  "(", ")", "{", "}", "[", "]", "...", ".",
  "=>", ",", ";", ":" , "?",
  "++", "--",
  "+", "-", "*", "/", "%", "**",
  ">>", "<<", ">>>", "<<<",
  "&", "|", "^", "~",
  "==", "!=", "===", "!==",
  ">", "<", ">=", "<=",
  "&&", "||", "??", "?.", "=",
  "+=", "-=", "*=", "/=", "%=",
  "**=", "<<=", ">>=", ">>>=",
  "&=", "|=", "^=",
  "??=", "&&=", "||=",
  "!",
]);

function isNumber(s) {
  if (!/^(?:[+-]?(?:(?:\d(?:\d|_)*)(?:\.(?:\d(?:\d|_)*))?|\.(?:\d(?:\d|_)*))(?:[eE][+-]?(?:\d(?:\d|_)*))?|[+-]?Infinity|[+-]?NaN|[+-]?(?:(?:0[xX](?:[0-9a-fA-F](?:[0-9a-fA-F]|_)*))|(?:0[oO](?:[0-7](?:[0-7]|_)*))|(?:0[bB](?:[01](?:[01]|_)*))|(?:\d(?:\d|_)*))n)$/u.test(s)) return false;
  return !keywords.has(s);
}

function isUnicodeEscapeSequence(s) {
  if (!/(?:\\u\{[0-9a-fA-F]+\}|\\u[0-9a-fA-F]{4})/g.test(s)) return false;
  return !keywords.has(s);
}

function isValidIdentifierName(s) {
  if (!/^(?:[$_\p{ID_Start}][$_\u200C\u200D\p{ID_Continue}]*)$/u.test(s)) return false;
  return !keywords.has(s);
}

export function labeler(custom_words, x)
{
	if( typeof(x)==='string' ) {
		if(custom_words && custom_words.hasOwnProperty(x)) return custom_words[x];

		if(x.trim()==='') {
			if(x.indexOf('\n')!==-1) return '\n';
			return ' ';
		}
		if(keywords.has(x)) return 'K';
		if(operators.has(x)) return 'O';
		if(isValidIdentifierName(x)) return 'I';
		if(isUnicodeEscapeSequence(x)) return 'U';
		if(isNumber(x)) return 'N';
	}
	else if(typeof(x)==='object') {
		if(x.type==='comment') return 'C';
		if(x.type==='regexp') return 'R';
		if(x.type==='js') return 'J';
		if(x.type==='paranthesis') return 'P';
		if(x.type==='string') return 'S';
		if(x.type==='xml') return 'X';
	}
	return "?"
} 

export function generateSequence(arr, labeler = labeler.bind(null, null))
{
	return arr.map(labeler).join('');
}

const import_export_regexp = /(?:i[C \n]*(?:(?:I|J|(?:\*[C \n]*a[C \n]*I))[C \n]*,[C \n]*)*(?:(?:(?:I(?:[C \n]*a[C \n]*I)?)|J|(?:\*[C \n]*a[C \n]*I))[C \n]*f[C \n]*)?S)|(?:e[C \n]*(?:(?:[*J][C \n]*f[C \n]*S)|(?:d[C \n]*[IFJ])|J|(?:[VF][c \n]*I)|I))|(?:r[c \n]*P)/mg;
const props_regexp = /O[C \n]*(?:[Id](?:[C \n]*a[C \n]*I)?[C \n]*,[C \n]*)*(?:I(?:[C \n]*a[C \n]*I)?)[C \n]*O/mg;

export function processImportExports(node, jsx)
{
	const s = generateSequence(node.out, 
					labeler.bind(null, 
						{'import': 'i', 'export': 'e', 'as': 'a', 'from': 'f', 
									',': ',', '.': '.', '*': '*', ';': ';', 
									'var': 'V', 'let': 'V', 'const': 'V',
									'function': 'F', 'class': 'F', '=':'=', 'default': 'd',
									'require': 'r'
								})
			  );

	// todo: should detect illegal imports too: "i"s that are not matched. 
	// but it may cause problems. x.import = ... is correct, but it will raise error this way.

	let i;
	const skip_spaces = (dir=1) => { 
										while(s[i]===' ' || s[i]==='\n' || s[i]==='C') {
											if(dir===1) node.out[i]=null;
											i+=dir 
										}
									};


	// Parse Imports

	let begin = node.begin;
	
	const begins = [];

	for(i=0;i<node.out.length;i++) {
		if(i==0) begins.push(node.begin);
		else {
			if( typeof(node.out[i-1]) === 'string' ) {
				begins.push(begins[i-1]+node.out[i-1].length);
			}
			else {
				begins.push(node.out[i-1].end);
			}
		}
	}

	begins.push(node.end);
	
	for (const m of s.matchAll(import_export_regexp)) {

		// Require (to inject requirer argument)
		// todo: should also check for . before require, but this is more complex than import
		// and export, and also much less likely to collide with user space.
		if(m[0].startsWith('r')) {
			const req = m[0];
			const args = node.out[m.index+req.length-1].out;
			if(args.length===1) {
				args.push(', {requirer:module}');
			}
		}
		// Import
		else if(m[0].startsWith('i')) {

			const imp = m[0];

			i = m.index-1;

			skip_spaces(-1); // check if this is a member (x.import)
			if(s[i]==='.') continue;

			const src = jsx.substring(node.out[m.index+imp.length-1].begin, node.out[m.index+imp.length-1].end);
			const imports = {};
			let star_imports = [];
			let import_alls = [];

			for(i = m.index+1;i<m.index+imp.length-1;i++) {

				node.out.splice(m.index, 1, {
							type: "import",
							begin: begins[m.index],
							end: begins[m.index+imp.length],
							cjs: ''
						});

				skip_spaces();

				switch(s[i]) {
				case ',':
					break;
				case 'I': {
					import_alls.push(node.out[i]);
					continue;
				}
				case 'J': {
					let sj = generateSequence(node.out[i].out, 
									labeler.bind(null, 
										{'as': 'a', ',': ','})
							  );

					props_regexp.lastIndex=-1;
					if(!props_regexp.test(sj)) throw "incorrect import properties definition."

					const ps = node.out[i].out;

					for(let j=1; j<sj.length-1; j++) {
						while(sj[j]===' ' || sj[j]==='\n' || sj[j]==='C' || sj[j]===',') j++;
						const prop = ps[j];
						j++;
						while(sj[j]===' ' || sj[j]==='\n' || sj[j]==='C') j++;
						if(sj[j]==='a') {
							j++;
							while(sj[j]===' ' || sj[j]==='\n' || sj[j]==='C') j++;
							imports[ps[j]] = prop;
							j++;
						}
						else {
							imports[prop] = prop; 
						}
					}
					continue;

				}
				case '*': {
					i++;
					skip_spaces();
					i++;
					skip_spaces();

					star_imports.push(node.out[i]); 
					continue;
				}
				case 'S':
					// 1. mark unnecessary nodes to be removed
					for(i = m.index+1;i<m.index+imp.length;i++) {
						node.out[i]=null;
					}

					let cjs = '';
					for(const s of import_alls) {
						cjs+=`const ${s} = require(${src},{requirer:module});\n`;
					}
					for(const s of star_imports) {
						cjs+=`const ${s} = require(${src},{requirer:module, checkExport: ['default']}).default;\n`;
					}
					if(Object.keys(imports).length) {
						let o = '{';
						let ls = '[';

						for(const p in imports) {
							if(o.length>1) {
								o+=',';
								ls+=',';
							}
							if(p===imports[p]) {
								o+=p;
								ls+=`'${p}'`;
							}
							else {
								o+=p+":"+imports[p];
								ls+=`'${imports[p]}'`;
							}

						}
						o+='}';
						ls+=']';

						cjs+=`const ${o} = require(${src}, {checkExport: ${ls},requirer:module})`;
					}
					else {
						cjs+=`require(${src},{requirer:module})`;
					}

					// 2. add nodes
					node.out[m.index].cjs = cjs;
					continue;
				}
			}
		}
		// Export
		else {
			const exp = m[0];

			node.out.splice(m.index, 1, {
						type: "export",
						begin: begins[m.index],
						end: begins[m.index+1],
					});

			i = m.index-1;

			skip_spaces(-1); // check if this is a member (x.export)
			if(s[i]==='.') continue;

			i = m.index+1;
			skip_spaces();

			switch(s[i]) {
				case 'd':
					node.out[i] = null;
					node.out[m.index].cjs = 'module.exports.default =';
					continue;

				case 'V':{
									const tp = node.out[i];
									node.out[i] = null;
									i++;
									skip_spaces();
									const name = node.out[i];
				
									node.out[i] = null;
									i++;
				
									skip_spaces();				
									node.out[m.index].cjs = `${tp} ${name} = module.exports.${name} `;
									continue;
				}
				case 'F':{
									const tp = node.out[i];
									node.out[i] = null;
									i++;
									skip_spaces();
									const name = node.out[i];
				
									// node.out[i] = null;
									// i++;
									// skip_spaces();				
				
									node.out[m.index].cjs = `module.exports.${name} = ${tp} `;
									continue;
				}
				case '*':
					node.out[i] = null;
					i++;
					skip_spaces();
					node.out[i] = null;
					i++;
					skip_spaces();
					const src = jsx.substring(node.out[i].begin, node.out[i].end);
					node.out[i] = null;
					node.out[m.index].cjs = `Object.assign(module.exports, require(${src},{requirer:module}))`;
					continue;

				case 'I':
					node.out[m.index].cjs = `module.exports.${node.out[i]} = `;
					continue;

				case 'J': {
					const exports = {};
					let sj = generateSequence(node.out[i].out, 
									labeler.bind(null, 
										{'as': 'a', ',': ',', 'default': 'I'})
							  );

					props_regexp.lastIndex=-1;
					if(!props_regexp.test(sj)) throw "incorrect export properties definition."

					const ps = node.out[i].out;
					for(let j=1; j<sj.length-1; j++) {
						while(sj[j]===' ' || sj[j]==='\n' || sj[j]==='C' || sj[j]===',') j++;
						const prop = ps[j];
						j++;
						while(sj[j]===' ' || sj[j]==='\n' || sj[j]==='C') j++;
						if(sj[j]==='a') {
							j++;
							while(sj[j]===' ' || sj[j]==='\n' || sj[j]==='C') j++;
							exports[ps[j]] = prop; 
							j++;
						}
						else {
							exports[prop] = prop; 
						}
					}

					let o = '{';
					let ls = '{';

					for(const p in exports) {
						if(o.length>1) {
							o+=',';
							ls+=',';
						}
						if(p===exports[p]) {
							o+=p;
							ls+=p;
						}
						else {
							o+=p+":"+exports[p];
							ls+=exports[p];
						}

					}
					o+='}';
					ls+='}';

					node.out[i] = null;
					i++;
					skip_spaces();

					if(node.out[i]==='from') {
						node.out[i] = null;
						i++;
						skip_spaces();

						const src = jsx.substring(node.out[i].begin, node.out[i].end);
						node.out[i]=null;

						node.out[m.index].cjs = `{ const ${o} = require(${src},{requirer:module}); Object.assign(module.exports, ${ls}); }`;
					}
					else {
						node.out[m.index].cjs = `Object.assign(module.exports, ${o})`;
					}
					continue;
				}
			}
		}
	}
}
