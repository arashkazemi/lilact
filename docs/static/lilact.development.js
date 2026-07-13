/*

Lilact
Copyright (C) 2024-2025 Arash Kazemi <contact.arash.kazemi@gmail.com>
All rights reserved.

BSD-2-Clause

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright
notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright
notice, this list of conditions and the following disclaimer in the
documentation and/or other materials provided with the distribution.

--------------------------------------------------------------------------------

Lilact also includes the following libraries accessible as members of 
the Lilact object:

@emotion/css:
Copyright (c) Emotion team and other contributors
MIT License

prop-types:
Copyright (c) 2013-present, Facebook, Inc.
MIT License

redux:
Copyright (c) 2015-present Dan Abramov
MIT License


* MIT License Notice:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

--------------------------------------------------------------------------------

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
/******/ var __webpack_modules__ = ({

/***/ 207:
/*!********************!*\
  !*** ./src/jsx.js ***!
  \********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   transpileJSX: () => (/* binding */ transpileJSX),
/* harmony export */   transpilerConfig: () => (/* binding */ transpilerConfig)
/* harmony export */ });
/* harmony import */ var _jsx_addons_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./jsx.addons.js */ 862);
/* harmony import */ var _vlq_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./vlq.js */ 919);
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

// This is a JSX transpiler that covers all the standard with some 
// additional features like a nice preprocessor. It doesn't rely on any other 
// library, even Lilact itself. It also generates sourcemap internally!
// It is not very fast, the xml look-ahead can be quite expensive, but it is not 
// slow at all.

// Check the webpack config and also the transpiler.js helper script for
// usage outside Lilact. Also make sure to check the default configuration.

// There are some situations that are solved with tricks, as some aspects of
// javascripts import a complete parser and I didn't want to get into that!
// Works almosr perfectly so far (all observed bugs except 1 are fixed), works  
// even on nasty things like the compressed version of tensorflow.js! Feel free   
// to report any bugs, and please include a testable example. Thanks! :)

// todo: injected string try catchs should be generated by a function



/** @ignore */
const transpilerConfig = {
	addons: _jsx_addons_js__WEBPACK_IMPORTED_MODULE_0__,
	setBlockLabels: true,
	enableLabelStack: false,
	injectLabels: true,
	// todo: alt+shift+7 on apple abc extended layout is better i think, 
	// but my current editor doesn't support syntax highlighting with it.
	preprocessorDelimiter: 'ʔ', // alt+shift+. on apple abc extended layout   
}


const TRANSPILER_OUTPUT = Symbol.for("LILACT:TRANSPILER_OUTPUT");



let raiseError;
let tab=0;

function lookAhead(f, code, index, ...args)
{
	const b = f(code, index, ...args);
	if(b) {
		return [b.end, b];
	}
	return [index];
}

function parseRegex(code, index, container)
{
	// previous token can only be(end with) ;=,([{}!^~&|:?*%-+/<> or directive or 
	// the slash can only be the first character
	// the backward scan automatically passes for i=0

	// if there is endline before starting /, then the previous token can also be ) and ]

	// todo: i have doubts about including preprocessorDelimiter

	let i = index;
	const dels = `;=,([{}!^~&|:?*%-+/<>${transpilerConfig.preprocessorDelimiter}`;
	while(--i>0) { 
		if( ' \t\r'.indexOf(code[i])!==-1 ) continue;
		if(code[i]==='\n' ) {
			dels+=")]";
			continue;
		}
		if( dels.indexOf(code[i])!==-1 ) break;
		return;
	}

	const b = {
		type: "regex",
		begin: index++
	};

	while(index<code.length) {
		const ch = code[index];
		switch(ch) {
		case '\n':
			return;
		case '/':
			// we proceed and try to parse the possible regexp, if it is a valid regexp, done.
			// if not, that slash can be inside a regexp so we continue, until we reach an endline
			// or a true end of a regexp.
			try {
				eval("const x="+code.slice(b.begin, index+1));
				b.end = index+1;
				if(container) container.children.push(b);
				return b;
			}
			catch(e) {}

		default:
			index++;
		}
	}	
}

function parseComment(code, index, container)
{
	const b = {
		type: "comment",
		begin: index++
	};

	if(code[index]!=='*' && code[index]!=='/') {
		return parseRegex(code, index-1, container);
	}

	const is_multiline = code[index]==='*';

	index++;

	while(index<code.length) {

		const ch = code[index];
		switch(ch) {

		case '*':
			if(is_multiline && code[index+1]==='/') {
				b.end=index+2;
				if(container) container.children.push(b);
				return b;
			}
			break;

		case '\n':
			if(!is_multiline) {
				b.end = index+1;
				if(container) container.children.push(b);
				return b;
			}
			break;

		}

		index++;
	}

	raiseError(`Unterminated comment`, b.begin);
}


function parseDirective(code, index, container)
{	
	let i=index+1;
	while(	code[i] && 
			(code[i]!=='\n' && code[i]!==transpilerConfig.preprocessorDelimiter) || 
			code[i-1]==='\\') 
	{
		i++;
	}

	const is_exp = code[i]===transpilerConfig.preprocessorDelimiter;

	if(is_exp) {
		const b = {
			type: "directive",
			begin: index,
			cbegin: index,
			end: i+1,

			expression: code.slice(index+1,i).replace(/\\(.)/gs, '$1'),
			value: ''
		};

		if(container) container.children.push(b);	
		return b;

	}
	else {
		let j=index;

		while(j-->=0 && (code[j]===' ' || code[j]==='\t'));
		const is_first = j===-1 || code[j]==='\n';

		if(is_first) {
			const b = {
				type: "directive",
				begin: index,
				cbegin: index,
				end: i+1,

				pragma: code.slice(index+1,i+1).replace(/\\(.)/gs, '$1'),
				value: ''
			};
			if(container) container.children.push(b);	
			return b;
		}
	}

	raiseError('Error in preprocessor statement', index);
}


// note: pragma blocks should begin and end in same block main trunk (not its children).
// note: preprocessor code must be JS, not JSX.

function preprocessPragmas(node, context)
{
	const all_nodes = [];

	var segments = ["const {" + Object.keys(_jsx_addons_js__WEBPACK_IMPORTED_MODULE_0__).join(', ') + "} = transpilerConfig.addons;"];

	var scope_stack = [];
	var last_block = null;

	const clone_block = (i, val)=>{ 
		last_block = typeof(all_nodes[i])==='object'? 
						structuredClone(
								{ ...all_nodes[i], children: undefined, attributes: {} }
							)
						:all_nodes[i];

		if(last_block.type==='directive') {
			last_block.value = val;
		}

		scope_stack[0].out ??= [];
		scope_stack[0].out.push(last_block);

		return last_block;
	};

	const clone_attr = (i, name)=>{ 
		last_block = typeof(all_nodes[i])==='object'? 
						structuredClone(
								{ ...all_nodes[i], children: undefined, attributes: {} }
							)
						:all_nodes[i];

		scope_stack[0].attributes[name] = last_block;

		return last_block;
	};

	const push_scope = ()=>{ scope_stack = [last_block, scope_stack]; };
	const pop_scope = ()=>{ scope_stack = scope_stack[1]; };

	const vine_traverse = (nd)=> {
		
		if(typeof(nd)!=='object') return segments;

		segments.push(`push_scope();`);

		if(nd.attributes) {
			for(const attr in nd.attributes) {
				const ch = nd.attributes[attr];

				all_nodes.push(ch);

				segments.push(`clone_attr(${all_nodes.length-1}, "${attr}");`);
				vine_traverse(ch);

			}
		}
		if(nd.children) {
			for(const ch of nd.children) {
				all_nodes.push(ch);

				if(ch.type==='directive' && ch.expression===undefined) {
					segments.push(ch.pragma);
				}
				else {
					if(ch.expression)
						segments.push(`clone_block(${all_nodes.length-1}, ${ch.expression});`);
					else
						segments.push(`clone_block(${all_nodes.length-1});`);
					vine_traverse(ch);
				}
			}
		}

		segments.push(`pop_scope();`);

		return segments;
	}


	node.out = [];
	last_block = node;
	push_scope();
	vine_traverse(node);

	const cmd = segments.join('\n');
	eval(cmd);

	return segments;
}


function parseString(code, index, q, container)
{
	const b = {
		type: "string",
		begin: index++,
		cbegin: index
	};

	while(index<code.length) {

		const ch = code[index];

		switch(ch) {

		case q:
			b.cend=index;
			b.end=index+1;
			if(container) container.children.push(b);
			return b;

		case '\n':
			if(q!=='\`') raiseError(`Unterminated string`, b.begin);
			break;

		case '$':
			if(q==='`') {
				if(code[index+1]==='{') {
					[index] = lookAhead( parseJS, code, index+1, true, container );
					index--;
				}
			}
			break;

		case '\\':
			index++;
			break;
		}

		index++;
	}

	raiseError(`Unterminated string`, b.begin);
}


function parseXMLContent(code, index, container, eols)
{
	let i = index;
	let cur = index;

	while(i<code.length) {
		switch(code[i]) {

		case '<':
			if(code[i+1]==='/') {

				i+=2;

				let j=i;

				while(j<code.length && code[j]!=='>') {
					j++;
				}

				if(j===code.length) {
					return null; //throw `ill-formed xml (slash) ${j}`;
				}

				const tag = code.substring(i,j).trim();

				if(container.tag!==tag) {
					raiseError(`Ill-formed xml (not closed properly)`, index);
				}

				container.end = j+1;

				container.cbegin = index+1; // content begin index
				container.cend = i-2; // content end index

				return j;
			}
			else {
				[i] = lookAhead( parseXML, code, i, container );

				if(i>cur) {
					cur = i;
					i--;
				}
				else cur++;
				
			}
			break;

		case '{':
			const j=i;
			[i] = lookAhead( parseJS, code, i, true, container );
			i--;
			break;

		}
		i++;
	}

	return cur;
}


function parseXML(code, index, container, look_behind=false)
{
	if(look_behind) {
		// valid tokens before start of an xml in js code (not in xml content)
		const prevs = [/*'return', 'yield', 'throw', */'=', ',', '(', '&', '|', '?', ':', '{']; 

		let i = index;

		while(--i>0) { 
			if( ' \t\r\n'.indexOf(code[i])!==-1 ) continue;
			if(prevs.indexOf(code[i])!==-1) break;
			if(i>1 && code[i-1]==='=' && code[i]==='>') break;
			if(i>=5) if(code.slice(i-5,i+1)==='return') {
				if(i>5) if( ' \t\r\n{};)'.indexOf(code[i-6])===-1 ) return;
				break;
			}
			if(i>=4) if(code.slice(i-4,i+1)==='yield' || code.slice(i-4,i+1)==='throw') {
				if(i>4) if( ' \t\r\n{};)'.indexOf(code[i-5])===-1 ) return;
				break;
			}
			return;
		}

	}
	// delimiters
	const delims =  [ ' ','\t','\n', '/','&','^','%','|','!','~','+','*','?',
					'<','>',';',',','=','{','}','(',')','[',']','\'','\"',
					'\`', '\\', '', undefined ]; 

	const skip_spaces = 
		()=> { while( code[index]===' ' || code[index]==='\t'  || code[index]==='\n' ) index++; };

	const b = { // block
		type: "xml",
		begin: index++,
		children: [],
		attributes: {},
		self_closing: false,
		js_attributes: []
	};

	skip_spaces();
	
	let i = index;

	while(i<code.length && delims.indexOf(code[i])===-1) i++;
	if(i===code.length) return;

	b.tag = code.substring(index,i);

	index = i;


	let last_attr = undefined;

	while(index<code.length) {
		i = index;

		while( i<code.length && delims.indexOf(code[i])===-1 ) {
			i++;
		}
		if(i===code.length) return;

		const tok = code.substring(index,i);
		if(tok.length) {
			last_attr = tok;
			b.attributes[tok] = true;
		}

		index = i;

		switch(code[index]) {

		case '=':

			if(last_attr) {
				index++;
				skip_spaces();

				while(code[index]==='/') {
					const res = lookAhead( parseComment, code, index );

					if(res[0]>index) index = res[0];
					else index++;
					skip_spaces();
				}

				let av;

				switch(code[index]) {
				case '\'':
				case '\"':
					//case '\`':
					[index, av] = lookAhead( parseString, code, index, code[index] );
					b.attributes[last_attr] = av;
					last_attr = undefined;
					break;

				case '{':
					[index, av] = lookAhead( parseJS, code, index, true );
					b.attributes[last_attr] = av;
					last_attr = undefined;
					break;					

				default: 
					i = index;
					while( i<code.length && delims.indexOf(code[i])===-1 ) {
						i++;
					}

					if(i===code.length) {
						return; // not xml
					}

					const tok = code.substring(index,i);
					index = i;

					b.attributes[last_attr] = tok;
					last_attr = undefined;
				}
			}
			else {
				//console.log(`ill-formed xml (attribute)`, index);
				return; // not xml
			}

			break;

		case '{':
			let jsc;
			[index, jsc] = lookAhead( parseJS, code, index, true );
			jsc.is_xml_js = true;
			b.js_attributes.push(jsc);
			break;					

		case '/':
			if(code[index+1]==='>') {
				b.end = index+2;
				b.cbegin = b.begin;
				b.cend = b.end;

				//b.children = undefined;
				b.self_closing = true;

				if(container) container.children.push(b);
				return b;
			}

			const res = lookAhead( parseComment, code, index );

			if(res[0]>index) index = res[0];
			else index++;

			break;

		case '>':
			const i = parseXMLContent(code, index, b);

			// not xml
			// todo: side effects must be checked
			if(i===null) return;

			if(i>index) index = i;
			else index++;

			if(b.end) {
				if(container) container.children.push(b);
				return b;
			}
			else {
				index++;
			}
			break;

		case ' ':
		case '\t':
		case '\n':
			skip_spaces();
			break;

		default:
			return;

		}
	}
}


function parseParanthesis(code, index, container)
{
	const b = { // block
		type: "paranthesis",
		begin: index,
		cbegin: ++index,
		children: [],
		self_closing: false
	};

	while(index<code.length) {
		const ch = code[index];

		switch(ch) {

		case '<':{
			let [i] = lookAhead( parseXML, code, index, b, true );
			if(i>index) index = i;
			else index++;
			break;
		}
		case '\"':
		case '\'':
		case '\`': 
			[index] = lookAhead( parseString, code, index, ch );
			break;

		case '{':
			[index] = lookAhead( parseJS, code, index, true, b );
			break;

		case '(':
			[index] = lookAhead( parseParanthesis, code, index, b );
			break;

		case '}':
			raiseError(`Unmatched curly bracket`, b.begin);
			break;

		case ')':
			b.end = index+1;
			b.cend = index;
			if(container) container.children.push(b);
			return b;

		case '/':
			const [i] = lookAhead( parseComment, code, index, b );
			if(i>index) index = i;
			else index++;
			break;

		case '\\':
			index++;
		default:
			index++;
			break;
		}
	}

	raiseError(`Unterminated paranthesis block`, b.begin);
}


function parseJS(code, index=0, is_block=false, container)
{
	const b = { // block
		type: "js",
		begin: index,
		cbegin: index+=(is_block?1:0),
		children: []
	};

	while(index<code.length) {
		const ch = code[index];

		switch(ch) {

		case '<': {
			let [i] = lookAhead( parseXML, code, index, b, true );

			if(i>index) index = i;
			else index++;
			break;
		}

		case '\"':
		case '\'':
		case '\`': 
			[index] = lookAhead( parseString, code, index, ch );
			break;

		case '{':  {
			const i = index;
			[index] = lookAhead( parseJS, code, index, true, b );
			break;
		}

		case '(': // this is only for function detection
			[index] = lookAhead( parseParanthesis, code, index, b );
			break;

		case ')': // this is only for function detection
			raiseError(`Unmatched paranthesis`, b.begin);
			break;

		case '}':
			if(is_block) {
				b.end = index+1;
				b.cend = index;
				if(container) container.children.push(b);
				return b;
			}
			raiseError(`Unmatched curly bracket`, b.begin);
			break;

		case '/':
			{
				let [i] = lookAhead( parseComment, code, index, b );
				if(i>index) index = i;
				else index++;
				break;
			}

		case transpilerConfig.preprocessorDelimiter:
			{
				let [i] = lookAhead( parseDirective, code, index, b );
				if(i>index) index = i;
				else index++;
				break;
			}

		case '\\':
			index++;

		default:
			index++;
		}
	}

	if(is_block) raiseError(`Unterminated JS block`, b.begin);

	b.end = index;
	b.cend = index;
	if(container) container.children.push(b);
	return b;
}


// this is for lilact internal use, it is a workaround for approximating error location
// in eval when transpiling and running jsx directly in browser.

function labelFunctions(node, eols, blocks_info)
{

	node.already_labeled = true;

	function getNext(i, step=1)
	{
		while( (i+=step) < node.children.length && i>=0) {
			const ch = node.children[i];

			if(typeof(ch)==='string') {
				const t = ch.trim();
				if(t.length) return [i, t];
			}
			if(typeof(ch)==='object' && ch.type!=='comment') {
				return [i,ch];
			}
		}
		return [null,null];
	}

	let i, nxt, prev;
	for(let chi=0; chi<node.children.length; chi++) {

		if(typeof(node.children[chi])==='object' && node.children[chi].type==='paranthesis') {

			[i, prev] = getNext(chi, -1);
			if(prev===null) continue;

			if(typeof(prev)!=='string' || ['switch', 'catch', 'try', 'class'].find((x)=>prev.trim().endsWith(x))!==undefined) continue;
			let label = prev;

			[i, prev] = getNext(i, -1);
			if(prev===null) continue;
			if(typeof(prev)==='string' && ['extern', 'class'].indexOf(prev)!==-1) continue;


			[i, nxt] = getNext(chi);

			if(nxt===null) continue;

			if(transpilerConfig.injectTraceLabels && typeof(nxt)==='object' && nxt.type==='js') {
				const begin = getRowCol(eols, chi); // begin is always the location of function args paranthesis
				nxt.children.splice(1,0, `/*LILACTBLOCK${++blocks_info.counter}:${begin}:${label}*/try{`);
				if(transpilerConfig.enableLabelStack) {
					nxt.children.splice(nxt.children.length-1, 0, `} catch(e){ if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=[${blocks_info.counter},e.lilact_trace];throw e}`);
				}
				else {
					nxt.children.splice(nxt.children.length-1, 0, `} catch(e){ if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=${blocks_info.counter};throw e}`);
				}
				chi += 2;				
			}
		}

		else if(node.children[chi]==='=>') {
			[i, prev] = getNext(chi, -1);

			if(typeof(prev)==='object' && prev.type==='paranthesis') {

				const begin = getRowCol(eols, prev.begin); // begin is always the location of function args paranthesis

				[i, nxt] = getNext(chi);

				if(typeof(nxt)==='object' && nxt.type==='js') {

					if(transpilerConfig.injectTraceLabels) {

						nxt.children.splice(1,0, 
							`/*LILACTBLOCK${++blocks_info.counter}:${begin}:<ARROW>*/try {`);

						if(transpilerConfig.enableLabelStack) {
							nxt.children.splice(nxt.children.length-1, 0, 
								`} catch(e){if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=[${blocks_info.counter},e.lilact_trace];throw e}`);
						}
						else {
							nxt.children.splice(nxt.children.length-1, 0, 
								`} catch(e){if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=${blocks_info.counter};throw e}`);
						}

					}					
					chi += 2;
				}
			}
		}

	}			

}

function scanEOLs(code)
{
	const endlines = [0];

	for(let i in code) {
		if(code[i]==='\n') {
			endlines.push(parseInt(i));
		}
	}
	endlines.push(code.length);

	return endlines;
}

function getRowCol(eols, i)
{
	if(!eols.last) eols.last=1;

	while(i>eols[eols.last]) {
		eols.last++;
		if(eols.last===eols.length) {
			eols.last=eols.length-1;
			break;
		}
	}
	while(i<eols[eols.last-1] && eols.last>1) {
		eols.last--;
	}

	return [eols.last-1, i-eols[eols.last-1]];
}


function generateSourceMap(json, path, jsx_eols, out_eols, mappings=[])
{
	let mpps = [];

	const sourcemap = {
		"version":3,
		"file":path,
		"sourceRoot":"",
		"sources":[path],
		"names":[],
		"mappings":""
	};


	const scan_leaves = (node)=>{
		//console.log("SCAN", node, node.begin, node.out_index);
		if(node.out?.length>0) {

			for(const ch of node.out) {
				scan_leaves(ch);
			}
		}
		if(node.begin!==undefined && node.out_index!==undefined) {
			mpps.push( [ ...getRowCol(out_eols,node.out_index), ...getRowCol(jsx_eols,node.begin), node ] );
		}
	}

	scan_leaves(json);

	mpps = mpps.sort( 	(a,b)=>{ 
		if (a[0] == b[0]) {
			return a[1] - b[1];
		}
		return a[0] - b[0];
	}
	);

	mappings.push(...mpps);

	let mstr = "";
	let r=0, oc=0;

	let lr = 0, lc=0;

	for(let i=0; i<mpps.length;i++) {
		const m = mpps[i];

		while(r<m[0]) {
			oc=0;
			mstr+=(";");
			r++;
		}

		mstr+=',';
		mstr+=( _vlq_js__WEBPACK_IMPORTED_MODULE_1__.encode(m[1]-oc,0,m[2]-lr,m[3]-lc) );

		oc = m[1];
		lr = m[2];
		lc = m[3];
	}
	sourcemap.mappings = mstr.substring(1).replace(/;,/g, ";"); 

	return "\n\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,"+btoa(JSON.stringify(sourcemap));

}


/**
 * This is the function that transpiles jsx code to js. It is not recommended to use directly.
 * 
 * Use `Lilact.require` instead, or `Lilact.run` available in `run`, or add a `<scirpt type="text/jsx" .../>` to your html.
 * 
 * Lilact jsx parser doesn't rely on the Lilact itself, and can be used by other engines. The easiest way
 * is using the `bin/transpile.js` script. It has its own help.
 *
 * @returns The transpiled javascript code.
 */

function transpileJSX( jsx, { 
	factory = "createComponent", 
	fragment = "Fragment", 
	path = "anonymous", 
	appendSourcemap = true,
	blocks_info = {
		labels: {},
		counter: 0
	},
	mappings = [],
	injectTraceLabels = false,
	discardComments = false
} = {} )
{

	transpilerConfig.preprocessorDelimiter ??= 'ʔ'; // alt+shift+. on apple abc extended layout  
	transpilerConfig.injectTraceLabels ??= injectTraceLabels;

	const eols = scanEOLs(jsx);

	raiseError = ((eols, msg, index)=>{
		const er = new Error(msg);
		er.name = 'JSXParseError';
		[er.lineNumber, er.columnNumber] = getRowCol(eols, index);
		er.fileName = path;
		er.lilact_trace = 'parse';
		throw er;
	}).bind(null, eols);

	const tokenize_re = /([\{\}\(\),;\[\]\n]|[\s^\n]+)/g; 

	const json = parseJS(jsx);
	json.data = jsx;

	const prepare = (node)=>{

		if(node.attributes!==undefined) {
			for(const attr in node.attributes) {
				if(typeof(node.attributes[attr])==='object') {
					prepare(node.attributes[attr]);
				}
			}
		}

		if(node.children!==undefined && !node.self_closing) {

			let i = node.type==='js'? node.begin : (node.cbegin || node.begin);
			for(let chi=0; chi<node.children.length; chi++) {
				const ch = node.children[chi];

				if(ch.begin>i) {
					let s = jsx.substring(i, ch.begin);

					if(node.type==='xml') s = s.trim();
					if(s.length) {
						if(node.type==='xml') {
							node.children.splice(chi, 0, '"'+s.replaceAll("\n", "\\\n")+'"');
						}
						else {
							node.children.splice(chi, 0, ...s.split(tokenize_re)); 
						}
						chi++;
					}
				}
				i = ch.end;

				prepare(ch);
			}

			const e = node.type==='js'? node.end : (node.cend || node.end);

			if(i<e && !node.self_closing) {
				let s = jsx.substring(i, e);
				if(node.type==='xml') s = s.trim();
				if(s.length) {
					if(node.type==='xml') {
						node.children.push( '"'+s.replace(/[\\\"\n]/g, m => ({
														  '\\': '\\\\',
														  '"': '\\"',
														  '\n': '\\\n'
														}[m]))+'"' );
					}
					else {
						node.children.push( ...s.split(tokenize_re) );
					}
				}
			}

			node.children = node.children.filter( (x)=>x!=="" );

			if(transpilerConfig.setBlockLabels && !node.already_labeled) {
				labelFunctions(node,eols, blocks_info);
			}
		}
	}

	prepare(json);

	preprocessPragmas(json);

	const codify = (outlen, node, is_attr=false, is_xml=false)=> {

		if(typeof(node)!=='object') return node;

		node.out_index = outlen;
		//console.log("CODIFY", node, node.out_index);

		if(node.type==='string') return jsx.substring(node.begin, node.end);
		if(node.type==='regex') return jsx.substring(node.begin, node.end);
		if(node.type==='comment') return (discardComments || is_attr)?'':jsx.substring(node.begin, node.end);
		if(node.type==='directive') return node.value;


		if(node.type==='paranthesis') {
			let out = "(";

			if(node.out) {
				for(const ch of node.out) {
					out+=codify(outlen+out.length-1, ch);
				}
			}
			return out + ")";
		}

		if(node.type==='js') {
			let out = "";

			if(node.out) {
				for(const ch of node.out) {
					if(is_xml && ch.type==='comment') continue;
					out+=codify( outlen + out.length - (is_attr?1:0), ch);
				}
			}

			if(is_attr) {
				return out.substring(1, out.length-1);
			}

			// todo: this is very simple, it should parse recursively
			if(node?.is_xml_js) {
				return jsx.substring(node.begin+1, node.end-1);
			}

			return out;
		}

		if(node.type==='xml') {

			if(node.tag.length===0) {
				node.tag = fragment;
			}
			else if(node.tag[0]!==node.tag[0].toUpperCase()) {
				node.tag = `"${node.tag}"`;
			}

			let out = '';


			let is_first=true;

			for(const a of node.js_attributes) {
				let oo = codify(outlen + out.length, a, false);

				out+=`${is_first?'':', '}${oo}`
				is_first=false;
			}


			if(node.attributes) {
				for(const a in node.attributes) {
					out+=`${is_first?'':', '}"${a}": ${codify(outlen + out.length, node.attributes[a], true)}`
					is_first=false;
				}
			}

			out+=" }";

			if(node.out) {
				for(const ch of node.out) {
					const o = codify(outlen + out.length, ch, true, true);
					if(o.length>0) {
						out+=`, ${o}`
						is_first=false;
					}
				}
			}

			const loc = getRowCol(eols,node.begin);
			out = ` ${factory}( ${node.tag}, { ${out} )`; //lilact_jsx_loc:["${path}", ${loc}]

			return out;
		}
	}

	let out = '';
	if(injectTraceLabels) {
		out=`/*LILACTBLOCK${++blocks_info.counter}:0,0:<EXEC>*/try{`
	}
	out+=codify(out.length, json);

	if(injectTraceLabels) {
		if(transpilerConfig.enableLabelStack) {
			out += `}catch(e){ if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=[${blocks_info.counter},e.lilact_trace];throw e}`;
		}
		else {
			out += `}catch(e){ if(typeof(e)!=='object') e=new Error(e);e.lilact_trace=${blocks_info.counter};throw e}`;
		}
	}

	const inline_sm = generateSourceMap(json, path, eols, scanEOLs(out), mappings);
	if(appendSourcemap) {
		out += inline_sm;
	}

	if(globalThis[TRANSPILER_OUTPUT]) {
		try {
			const fs = Promise.resolve().then(function webpackMissingModule() { var e = new Error("Cannot find module 'fs'"); e.code = 'MODULE_NOT_FOUND'; throw e; });
			fs.writeFileSync(globalThis[TRANSPILER_OUTPUT], out);	
		}
		catch(e) {}
		globalThis[TRANSPILER_OUTPUT] = undefined;
	}
	//console.log(out);

	return out;
}



//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9qc3guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIvVXNlcnMvYXJhc2gvRGVza3RvcC9Qcm9qZWN0cy9MaWxhY3Qvc3JjL2pzeC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4QkM7Q0FDQTtDQUNBO0NBQ0E7Q0FDQTs7Q0FFQTtDQUNBOztDQUVBO0NBQ0E7Q0FDQTtDQUNBO0NBQ0E7O0NBRUE7Ozs7Q0FJQTtpQ0FDZ0M7Ozs7O0VBSy9CO0VBQ0E7OEJBQzRCOzs7O3FDQUlPOzs7Ozs7O21CQU9sQjtDQUNsQjthQUNZO0lBQ1QsSUFBSTs7Ozs7O29CQU1ZO0NBQ25CO0VBQ0M7RUFDQTtFQUNBOztFQUVBOztFQUVBOzs7O09BSUssUUFBUTtLQUNWLGdCQUFpQjtLQUNqQixrQkFBa0I7Ozs7S0FJbEIsYUFBYzs7OztZQUlQOzs7OztPQUtMLG9CQUFvQjs7U0FFbEIsS0FBSzs7OztJQUlWO0lBQ0E7SUFDQTtRQUNJO1NBQ0MscUJBQXNCOztPQUV4QixtQ0FBbUM7OztTQUdqQyxJQUFJOzs7Ozs7OztzQkFRUztDQUNyQjtZQUNXOzs7OztJQUtSLHlDQUF5QztvQkFDekI7Ozs7Ozs7T0FPYixvQkFBb0I7OztTQUdsQixLQUFLOzs7TUFHUixzQ0FBc0M7O09BRXJDLG1DQUFtQzs7Ozs7O01BTXBDLGdCQUFnQjs7T0FFZixtQ0FBbUM7Ozs7Ozs7Ozs7WUFVOUI7Ozs7d0JBSVk7Q0FDdkI7O09BRU07R0FDSDs7RUFFRjs7Ozs7O0lBTUUsU0FBUzthQUNBOzs7Ozs7MEJBTWEsbUJBQW9CLEFBQUQ7Ozs7S0FJeEMsbUNBQW1DOzs7O09BSWpDOzs7UUFHQyxVQUFXOzs7S0FHZCxXQUFXO2NBQ0Y7Ozs7Ozt1QkFNUyxxQkFBc0IsQUFBRDs7O01BR3RDLG1DQUFtQzs7Ozs7WUFLN0I7Ozs7Q0FJWDtDQUNBOzsyQkFFMEI7Q0FDMUI7Ozt5Q0FHd0MsZ0JBQWdCOzs7OztzQkFLbkMsVUFBVTtzQkFDVjtzQkFDQTtRQUNiLG9EQUFvRDs7OztLQUl4RCxnQ0FBZ0M7Ozs7OzBCQUtYOzs7OztxQkFLTCxXQUFXO3NCQUNWO3NCQUNBO1FBQ2Isb0RBQW9EOzs7Ozs7Ozs7cUJBU3hDLElBQUk7b0JBQ0wsSUFBSTs7d0JBRUEsT0FBTzs7S0FFMUIsTUFBTzs7Z0JBRUk7O0tBRVgsZ0JBQWdCO09BQ2QsOEJBQThCOzs7bUJBR2xCOztrQkFFRDtrQkFDQTs7OztLQUliLGNBQWM7T0FDWiwwQkFBMEI7bUJBQ2Q7O09BRVoscURBQXFEO21CQUN6Qzs7VUFFVDtRQUNGO29CQUNZOztvQkFFQTttQkFDRDs7Ozs7Z0JBS0g7Ozs7Ozs7O1lBUUo7ZUFDRzs7MkJBRVk7TUFDckI7Ozs7OztxQkFNZTtDQUNwQjtZQUNXOzs7Ozs7T0FNTCxvQkFBb0I7Ozs7U0FJbEIsS0FBSzs7Ozs7TUFLUixtQ0FBbUM7Ozs7TUFJbkMscUJBQXFCOzs7O01BSXJCLFVBQVU7T0FDVCxzQkFBc0I7eUJBQ0o7Ozs7Ozs7Ozs7Ozs7O1lBY2I7Ozs7eUJBSWE7Q0FDeEI7Ozs7T0FJTSxnQkFBZ0I7U0FDZCxVQUFVOzs7TUFHYixrQkFBa0I7Ozs7OztVQU1kLGlDQUFpQzs7OztPQUlwQyxrQkFBa0I7bUJBQ047OzsrQkFHWSxVQUFVOztPQUVsQyxzQkFBc0I7Z0JBQ2I7Ozs7O2lDQUtpQjsyQkFDTjs7OztTQUlsQjtvQkFDVzs7T0FFYixRQUFROzs7Ozs7Ozs7OzttQkFXSTs7Ozs7Ozs7Ozs7O2tCQVlEO0NBQ2pCO0lBQ0csY0FBYztHQUNmO2tCQUNlOzs7O1FBSVYsUUFBUTtNQUNWLGtCQUFtQjtNQUNuQixhQUFjO01BQ2Q7TUFDQSxTQUFTLFVBQVcsdUJBQXNCO09BQ3pDLFFBQVEsc0JBQXVCOzs7TUFHaEMsU0FBUyxVQUFXLGlDQUFpQyxzQkFBcUI7T0FDekUsUUFBUSxzQkFBdUI7Ozs7Ozs7RUFPcEM7Ozs7OztHQU1DLEtBQUssT0FBTzs7WUFFSCxFQUFFOzs7O2VBSUM7Ozs7O2FBS0Y7Ozs7T0FJTiwrQkFBZ0M7SUFDbkM7O3dCQUVvQjs7Ozs7OztPQU9qQixvQkFBb0I7OztRQUduQixnQ0FBaUMsa0JBQWlCOzs7S0FHckQ7OzZCQUV3QjtLQUN4QixhQUFhOzs7Ozs7O1NBT1QsY0FBYzs7OztNQUlqQixZQUFZOztnQkFFRjs7VUFFTixvQkFBb0I7MkJBQ0g7O1FBRW5COztpQkFFUzs7Ozs7V0FLTixjQUFjOzs7TUFHbkI7NkJBQ3VCOzs7Ozs7NkJBTUE7Ozs7Ozs7V0FPbEIsZ0NBQWlDLGtCQUFpQjs7OztRQUlyRCxrQkFBa0I7ZUFDWDs7O2dDQUdpQjs7Ozs7OztTQU92QjtLQUNKO2FBQ1E7Ozs7Ozs7NEJBT2U7O3dCQUVKOzs7O01BSWxCLHNCQUFzQjs7Ozs7S0FLdkI7OztPQUdFLG1DQUFtQzs7Ozt5QkFJakI7O01BRW5COzs7Ozs7NkJBTXVCOztJQUV6QjtJQUNBO01BQ0U7O01BRUE7OztNQUdBLFFBQVE7T0FDUCxtQ0FBbUM7OztTQUdqQzs7Ozs7Ozs7ZUFRTTs7Ozs7Ozs7Ozs7MEJBV1c7Q0FDekI7WUFDVyxFQUFFOzs7Ozs7OztPQVFQLG9CQUFvQjs7O1NBR2xCLEtBQUs7O1lBRUY7dUJBQ1c7TUFDakI7Ozs7Ozs7dUJBT2lCOzs7O3VCQUlBOzs7O3VCQUlBOzs7O2NBSVQ7Ozs7OztNQU1SLG1DQUFtQzs7Ozt5QkFJaEI7TUFDbkI7Ozs7Ozs7Ozs7OztZQVlNOzs7O2lCQUlLO0NBQ2hCO1lBQ1csRUFBRTs7O2tCQUdJOzs7O09BSVgsb0JBQW9COzs7U0FHbEIsS0FBSzs7YUFFRDt1QkFDVTs7TUFFakI7Ozs7Ozs7O3VCQVFpQjs7O2NBR1Q7O3VCQUVTOzs7O2FBSVY7dUJBQ1U7OzthQUdWO2NBQ0M7Ozs7TUFJUixXQUFXOzs7T0FHVixtQ0FBbUM7OztjQUc1Qjs7OztJQUlWO3dCQUNvQjtPQUNqQjs7Ozs7O0lBTUg7d0JBQ29CO09BQ2pCOzs7Ozs7Ozs7Ozs7O0lBYUgscUJBQXFCOzs7O0lBSXJCLG1DQUFtQzs7Ozs7Q0FLdEM7Q0FDQTs7d0JBRXVCO0NBQ3ZCOzs7O2tCQUlpQjtFQUNoQjtRQUNNLENBQUUsMkNBQTBDOzs7TUFHOUMsTUFBTyxrQkFBaUI7c0JBQ1I7T0FDZjs7TUFFRCxNQUFPLHlDQUF3Qzs7Ozs7Ozs7S0FRaEQsNkNBQTZDOztLQUU3QyxNQUFPLDZFQUE0RTs7dUJBRWpFO01BQ2pCOztNQUVBLE1BQU8sNkRBQThELEFBQUQsY0FBZSxXQUFXOzs7dUJBRzdFO01BQ2pCO01BQ0EsTUFBTyxnREFBZ0Q7OztzQkFHdkM7O01BRWhCOztNQUVBLDRDQUE2QyxzQ0FBcUM7NEJBQzVELGFBQWE7d0JBQ2pCO09BQ2pCLG9DQUFvQzt5QkFDbEI7O1VBRWY7eUJBQ2U7Ozs7OztVQU1mLDRCQUE0Qjt1QkFDZjs7TUFFakIsTUFBTyxpREFBZ0Q7OzRCQUVqQyxvQkFBb0I7O3VCQUV6Qjs7T0FFaEIsTUFBTyxzQ0FBcUM7O1FBRTNDLHFDQUFxQzs7MEJBRW5COzs7U0FHakIsb0NBQW9DOzJCQUNsQjs7O1lBR2Y7MkJBQ2U7Ozs7Ozs7Ozs7Ozs7O2tCQWNUO0NBQ2pCOzs7S0FHSSxnQkFBZ0I7S0FDaEIsaUJBQWlCO2lCQUNMLFFBQVM7OztlQUdYOzs7OzttQkFLSTtDQUNsQjtJQUNHOztPQUVHLG9CQUFvQjs7S0FFdEIsMEJBQTBCOzs7OztPQUt4QixxQ0FBcUM7Ozs7Ozs7OzJCQVFqQjtDQUMxQjs7O29CQUdtQjs7Ozs7Ozs7OztzQkFVRSxRQUFRO0dBQzNCO0tBQ0UscUJBQXFCOztPQUVuQix1QkFBdUI7Z0JBQ2Q7OztLQUdYLHVEQUF1RDthQUMvQyxlQUFnQix1Q0FBdUM7Ozs7YUFJdkQ7O2tCQUVLLEVBQUcsT0FBTztLQUN0QixlQUFlOzs7Ozs7O2VBT047Ozs7Ozs7S0FPViw2QkFBNkI7OztRQUcxQixTQUFTOztVQUVQOzs7OztTQUtELFdBQVk7Ozs7OztxQ0FNZ0IsV0FBWSxBQUFEOztvRkFFb0MsY0FBZTs7Ozs7Q0FLbEc7Ozs7Ozs7Ozs7OzZCQVc0QixNQUFPOzs7OztlQUtwQjtVQUNMOzs7Ozs7SUFNTjtDQUNKOztrREFFaUQ7Ozt1QkFHM0I7O2VBRVAsQUFBRCxvQkFBcUI7c0JBQ2I7OzhDQUV3Qjs7OztTQUl0Qzs7c0JBRWE7O3NCQUVBOzs7a0JBR0osUUFBUTs7S0FFckIsOEJBQThCO09BQzVCLGdDQUFnQztPQUNoQyxNQUFPLHFDQUFvQzthQUNyQzs7Ozs7S0FLUixrREFBa0Q7OzJDQUVaO09BQ3BDLDZDQUE2Qzs7O09BRzdDLGFBQWE7MkJBQ087O1FBRW5CLDhCQUE4QjtRQUM5QixXQUFXO1NBQ1Ysb0JBQW9COzRCQUNELHdCQUF5Qjs7WUFFekM7NEJBQ2dCLGtCQUFtQjs7Ozs7OztZQU9uQzs7OzJDQUcrQjs7TUFFckMsNEJBQTRCOzBCQUNSO09BQ25CLDhCQUE4QjtPQUM5QixXQUFXO1FBQ1Ysb0JBQW9CO3lCQUNILGNBQWdCLEFBQUQsa0JBQW9CLEFBQUQ7Ozs7OztXQU1oRDt5QkFDYyxXQUFZOzs7Ozt3Q0FLRyxDQUFFOztNQUVwQywyREFBMkQ7bUJBQzlDOzs7OztTQUtWOzttQkFFVTs7aUJBRUYsOENBQThDOztLQUUxRCxNQUFPOzs7R0FHVDs7S0FFRSwyQ0FBMkM7S0FDM0MsMENBQTBDO0tBQzFDLCtCQUErQiw2Q0FBNkM7S0FDNUU7OztLQUdBLDRCQUE0Qjs7O01BRzNCLFdBQVc7UUFDVCx1QkFBdUI7aUJBQ2Q7Ozs7OztLQU1aLG1CQUFtQjs7O01BR2xCLFdBQVc7UUFDVCx1QkFBdUI7UUFDdkI7aUJBQ1MsdUJBQXdCOzs7O01BSW5DLFVBQVU7eUJBQ1M7OztJQUdyQjtNQUNFLGtCQUFrQjt5QkFDQzs7Ozs7O0tBTXBCLG9CQUFvQjs7TUFFbkIsc0JBQXNCOzs7V0FHakIscUNBQXNDLEtBQUk7Ozs7Ozs7OztPQVM5QyxnQ0FBZ0M7b0JBQ25COzs7Ozs7O01BT2Qsa0JBQWtCO1FBQ2hCLDZCQUE2Qjs7Ozs7Ozs7TUFRL0IsV0FBVztRQUNULHVCQUF1QjtzQkFDVDtRQUNkLGFBQWE7Ozs7Ozs7eUJBT0k7a0RBQ3lCOzs7Ozs7O0lBTzlDLG9CQUFvQjs7O2FBR1g7O0lBRVQsb0JBQW9CO0tBQ25CLG9DQUFvQzs7O1FBR2pDOzs7OztxQ0FLNkIsMEJBQTJCO0lBQzVELGtCQUFrQjs7OztJQUlsQixnQ0FBZ0M7T0FDN0I7cUJBQ2M7b0JBQ0Q7O1FBRVosSUFBSTs7O0VBR1YifQ==

/***/ }),

/***/ 228:
/*!*********************************************!*\
  !*** ./node_modules/object-assign/index.js ***!
  \*********************************************/
/***/ ((module) => {

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/


/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};


/***/ }),

/***/ 241:
/*!*************************************!*\
  !*** ./src/lilact.jsx + 29 modules ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {


// EXPORTS
__webpack_require__.d(__webpack_exports__, {
  Lilact: () => (/* binding */ lilact_Lilact),
  "default": () => (/* binding */ lilact)
});
// ESM COMPAT FLAG
__webpack_require__.r(__webpack_exports__);

// NAMESPACE OBJECT: ./node_modules/redux/dist/redux.mjs
var redux_namespaceObject = {};
__webpack_require__.r(redux_namespaceObject);
__webpack_require__.d(redux_namespaceObject, {
  __DO_NOT_USE__ActionTypes: () => (actionTypes_default),
  applyMiddleware: () => (applyMiddleware),
  bindActionCreators: () => (bindActionCreators),
  combineReducers: () => (combineReducers),
  compose: () => (compose),
  createStore: () => (createStore),
  isAction: () => (isAction),
  isPlainObject: () => (isPlainObject),
  legacy_createStore: () => (legacy_createStore)
});

// NAMESPACE OBJECT: ./node_modules/@emotion/css/dist/emotion-css.development.esm.js
var emotion_css_development_esm_namespaceObject = {};
__webpack_require__.r(emotion_css_development_esm_namespaceObject);
__webpack_require__.d(emotion_css_development_esm_namespaceObject, {
  cache: () => (cache),
  css: () => (css),
  cx: () => (cx),
  flush: () => (flush),
  getRegisteredStyles: () => (emotion_css_development_esm_getRegisteredStyles),
  hydrate: () => (hydrate),
  injectGlobal: () => (injectGlobal),
  keyframes: () => (keyframes),
  merge: () => (emotion_css_development_esm_merge),
  sheet: () => (sheet)
});

// NAMESPACE OBJECT: ./src/misc.jsx
var misc_namespaceObject = {};
__webpack_require__.r(misc_namespaceObject);
__webpack_require__.d(misc_namespaceObject, {
  Children: () => (Children),
  Fragment: () => (misc_Fragment),
  boolean_html_attributes_set: () => (boolean_html_attributes_set),
  classNames: () => (classNames),
  current_component: () => (current_component),
  deepEqual: () => (deepEqual),
  eval_num: () => (eval_num),
  events_set: () => (events_set),
  findDOMNode: () => (findDOMNode),
  getComponentByPointer: () => (getComponentByPointer),
  id_num: () => (id_num),
  isAsync: () => (isAsync),
  isClass: () => (isClass),
  isEmpty: () => (isEmpty),
  isError: () => (misc_isError),
  isThenable: () => (isThenable),
  isValidElement: () => (isValidElement),
  layout_effects: () => (layout_effects),
  length_css_attributes_set: () => (length_css_attributes_set),
  required_scripts: () => (required_scripts),
  roots: () => (roots),
  shallowEqual: () => (shallowEqual),
  special_attributes: () => (special_attributes),
  toBool: () => (toBool),
  update_cbs: () => (update_cbs),
  update_interval_margin: () => (update_interval_margin),
  update_set: () => (update_set),
  update_timeout: () => (update_timeout)
});

// NAMESPACE OBJECT: ./src/components.jsx
var components_namespaceObject = {};
__webpack_require__.r(components_namespaceObject);
__webpack_require__.d(components_namespaceObject, {
  Component: () => (Component),
  HTMLComponent: () => (HTMLComponent),
  RootComponent: () => (RootComponent),
  createComponent: () => (components_createComponent),
  createElement: () => (createElement),
  createRoot: () => (createRoot),
  render: () => (render)
});

// NAMESPACE OBJECT: ./src/hooks.jsx
var hooks_namespaceObject = {};
__webpack_require__.r(hooks_namespaceObject);
__webpack_require__.d(hooks_namespaceObject, {
  createContext: () => (createContext),
  forwardRef: () => (forwardRef),
  useActionState: () => (useActionState),
  useCallback: () => (useCallback),
  useContext: () => (useContext),
  useDeferredValue: () => (useDeferredValue),
  useEffect: () => (useEffect),
  useHook: () => (useHook),
  useId: () => (useId),
  useImperativeHandle: () => (useImperativeHandle),
  useLayoutEffect: () => (useLayoutEffect),
  useLocalStorage: () => (useLocalStorage),
  useMemo: () => (useMemo),
  useReducer: () => (useReducer),
  useRef: () => (useRef),
  useState: () => (useState),
  useTransition: () => (useTransition)
});

// NAMESPACE OBJECT: ./src/timers.jsx
var timers_namespaceObject = {};
__webpack_require__.r(timers_namespaceObject);
__webpack_require__.d(timers_namespaceObject, {
  animationFramePromise: () => (animationFramePromise),
  clearInterval: () => (timers_clearInterval),
  clearTimeout: () => (timers_clearTimeout),
  grabTimers: () => (grabTimers),
  pauseTimers: () => (pauseTimers),
  releaseTimers: () => (releaseTimers),
  resetTimers: () => (resetTimers),
  resumeTimers: () => (resumeTimers),
  setInterval: () => (timers_setInterval),
  setTimeout: () => (timers_setTimeout),
  timeoutPromise: () => (timeoutPromise)
});

// NAMESPACE OBJECT: ./src/transition.jsx
var transition_namespaceObject = {};
__webpack_require__.r(transition_namespaceObject);
__webpack_require__.d(transition_namespaceObject, {
  CSSTransition: () => (CSSTransition),
  Transition: () => (Transition),
  TransitionGroup: () => (TransitionGroup)
});

// NAMESPACE OBJECT: ./src/events.jsx
var events_namespaceObject = {};
__webpack_require__.r(events_namespaceObject);
__webpack_require__.d(events_namespaceObject, {
  addWrappedEventListener: () => (addWrappedEventListener),
  createSyntheticEvent: () => (createSyntheticEvent),
  releaseSyntheticEvent: () => (releaseSyntheticEvent),
  wrapListener: () => (wrapListener)
});

// NAMESPACE OBJECT: ./src/redux.jsx
var src_redux_namespaceObject = {};
__webpack_require__.r(src_redux_namespaceObject);
__webpack_require__.d(src_redux_namespaceObject, {
  Provider: () => (Provider),
  combineReducers: () => (redux_combineReducers),
  connect: () => (connect),
  useDispatch: () => (useDispatch),
  useSelector: () => (useSelector),
  useStore: () => (useStore)
});

// NAMESPACE OBJECT: ./src/errors.jsx
var errors_namespaceObject = {};
__webpack_require__.r(errors_namespaceObject);
__webpack_require__.d(errors_namespaceObject, {
  blocks_info: () => (blocks_info),
  error: () => (error),
  globalErrorHandler: () => (globalErrorHandler),
  scanBlockLabels: () => (scanBlockLabels),
  traceError: () => (traceError)
});

// NAMESPACE OBJECT: ./src/router.jsx
var router_namespaceObject = {};
__webpack_require__.r(router_namespaceObject);
__webpack_require__.d(router_namespaceObject, {
  HashRouter: () => (HashRouter),
  Link: () => (Link),
  NavLink: () => (NavLink),
  Route: () => (Route),
  Routes: () => (Routes),
  useLocation: () => (useLocation),
  useNavigate: () => (useNavigate)
});

// NAMESPACE OBJECT: ./src/accessories.jsx
var accessories_namespaceObject = {};
__webpack_require__.r(accessories_namespaceObject);
__webpack_require__.d(accessories_namespaceObject, {
  ErrorBoundary: () => (ErrorBoundary),
  Spinner: () => (Spinner),
  Suspense: () => (Suspense)
});

;// ./node_modules/redux/dist/redux.mjs
// src/utils/formatProdErrorMessage.ts
function formatProdErrorMessage(code) {
  return `Minified Redux error #${code}; visit https://redux.js.org/Errors?code=${code} for the full message or use the non-minified dev environment for full errors. `;
}

// src/utils/symbol-observable.ts
var $$observable = /* @__PURE__ */ (() => typeof Symbol === "function" && Symbol.observable || "@@observable")();
var symbol_observable_default = $$observable;

// src/utils/actionTypes.ts
var randomString = () => Math.random().toString(36).substring(7).split("").join(".");
var ActionTypes = {
  INIT: `@@redux/INIT${/* @__PURE__ */ randomString()}`,
  REPLACE: `@@redux/REPLACE${/* @__PURE__ */ randomString()}`,
  PROBE_UNKNOWN_ACTION: () => `@@redux/PROBE_UNKNOWN_ACTION${randomString()}`
};
var actionTypes_default = ActionTypes;

// src/utils/isPlainObject.ts
function isPlainObject(obj) {
  if (typeof obj !== "object" || obj === null)
    return false;
  let proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(obj) === proto || Object.getPrototypeOf(obj) === null;
}

// src/utils/kindOf.ts
function miniKindOf(val) {
  if (val === void 0)
    return "undefined";
  if (val === null)
    return "null";
  const type = typeof val;
  switch (type) {
    case "boolean":
    case "string":
    case "number":
    case "symbol":
    case "function": {
      return type;
    }
  }
  if (Array.isArray(val))
    return "array";
  if (isDate(val))
    return "date";
  if (isError(val))
    return "error";
  const constructorName = ctorName(val);
  switch (constructorName) {
    case "Symbol":
    case "Promise":
    case "WeakMap":
    case "WeakSet":
    case "Map":
    case "Set":
      return constructorName;
  }
  return Object.prototype.toString.call(val).slice(8, -1).toLowerCase().replace(/\s/g, "");
}
function ctorName(val) {
  return typeof val.constructor === "function" ? val.constructor.name : null;
}
function isError(val) {
  return val instanceof Error || typeof val.message === "string" && val.constructor && typeof val.constructor.stackTraceLimit === "number";
}
function isDate(val) {
  if (val instanceof Date)
    return true;
  return typeof val.toDateString === "function" && typeof val.getDate === "function" && typeof val.setDate === "function";
}
function kindOf(val) {
  let typeOfVal = typeof val;
  if (true) {
    typeOfVal = miniKindOf(val);
  }
  return typeOfVal;
}

// src/createStore.ts
function createStore(reducer, preloadedState, enhancer) {
  if (typeof reducer !== "function") {
    throw new Error( false ? 0 : `Expected the root reducer to be a function. Instead, received: '${kindOf(reducer)}'`);
  }
  if (typeof preloadedState === "function" && typeof enhancer === "function" || typeof enhancer === "function" && typeof arguments[3] === "function") {
    throw new Error( false ? 0 : "It looks like you are passing several store enhancers to createStore(). This is not supported. Instead, compose them together to a single function. See https://redux.js.org/tutorials/fundamentals/part-4-store#creating-a-store-with-enhancers for an example.");
  }
  if (typeof preloadedState === "function" && typeof enhancer === "undefined") {
    enhancer = preloadedState;
    preloadedState = void 0;
  }
  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      throw new Error( false ? 0 : `Expected the enhancer to be a function. Instead, received: '${kindOf(enhancer)}'`);
    }
    return enhancer(createStore)(reducer, preloadedState);
  }
  let currentReducer = reducer;
  let currentState = preloadedState;
  let currentListeners = /* @__PURE__ */ new Map();
  let nextListeners = currentListeners;
  let listenerIdCounter = 0;
  let isDispatching = false;
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = /* @__PURE__ */ new Map();
      currentListeners.forEach((listener, key) => {
        nextListeners.set(key, listener);
      });
    }
  }
  function getState() {
    if (isDispatching) {
      throw new Error( false ? 0 : "You may not call store.getState() while the reducer is executing. The reducer has already received the state as an argument. Pass it down from the top reducer instead of reading it from the store.");
    }
    return currentState;
  }
  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error( false ? 0 : `Expected the listener to be a function. Instead, received: '${kindOf(listener)}'`);
    }
    if (isDispatching) {
      throw new Error( false ? 0 : "You may not call store.subscribe() while the reducer is executing. If you would like to be notified after the store has been updated, subscribe from a component and invoke store.getState() in the callback to access the latest state. See https://redux.js.org/api/store#subscribelistener for more details.");
    }
    let isSubscribed = true;
    ensureCanMutateNextListeners();
    const listenerId = listenerIdCounter++;
    nextListeners.set(listenerId, listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }
      if (isDispatching) {
        throw new Error( false ? 0 : "You may not unsubscribe from a store listener while the reducer is executing. See https://redux.js.org/api/store#subscribelistener for more details.");
      }
      isSubscribed = false;
      ensureCanMutateNextListeners();
      nextListeners.delete(listenerId);
      currentListeners = null;
    };
  }
  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error( false ? 0 : `Actions must be plain objects. Instead, the actual type was: '${kindOf(action)}'. You may need to add middleware to your store setup to handle dispatching other values, such as 'redux-thunk' to handle dispatching functions. See https://redux.js.org/tutorials/fundamentals/part-4-store#middleware and https://redux.js.org/tutorials/fundamentals/part-6-async-logic#using-the-redux-thunk-middleware for examples.`);
    }
    if (typeof action.type === "undefined") {
      throw new Error( false ? 0 : 'Actions may not have an undefined "type" property. You may have misspelled an action type string constant.');
    }
    if (typeof action.type !== "string") {
      throw new Error( false ? 0 : `Action "type" property must be a string. Instead, the actual type was: '${kindOf(action.type)}'. Value was: '${action.type}' (stringified)`);
    }
    if (isDispatching) {
      throw new Error( false ? 0 : "Reducers may not dispatch actions.");
    }
    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }
    const listeners = currentListeners = nextListeners;
    listeners.forEach((listener) => {
      listener();
    });
    return action;
  }
  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== "function") {
      throw new Error( false ? 0 : `Expected the nextReducer to be a function. Instead, received: '${kindOf(nextReducer)}`);
    }
    currentReducer = nextReducer;
    dispatch({
      type: actionTypes_default.REPLACE
    });
  }
  function observable() {
    const outerSubscribe = subscribe;
    return {
      /**
       * The minimal observable subscription method.
       * @param observer Any object that can be used as an observer.
       * The observer object should have a `next` method.
       * @returns An object with an `unsubscribe` method that can
       * be used to unsubscribe the observable from the store, and prevent further
       * emission of values from the observable.
       */
      subscribe(observer) {
        if (typeof observer !== "object" || observer === null) {
          throw new Error( false ? 0 : `Expected the observer to be an object. Instead, received: '${kindOf(observer)}'`);
        }
        function observeState() {
          const observerAsObserver = observer;
          if (observerAsObserver.next) {
            observerAsObserver.next(getState());
          }
        }
        observeState();
        const unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe
        };
      },
      [symbol_observable_default]() {
        return this;
      }
    };
  }
  dispatch({
    type: actionTypes_default.INIT
  });
  const store = {
    dispatch,
    subscribe,
    getState,
    replaceReducer,
    [symbol_observable_default]: observable
  };
  return store;
}
function legacy_createStore(reducer, preloadedState, enhancer) {
  return createStore(reducer, preloadedState, enhancer);
}

// src/utils/warning.ts
function warning(message) {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error(message);
  }
  try {
    throw new Error(message);
  } catch (e) {
  }
}

// src/combineReducers.ts
function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  const reducerKeys = Object.keys(reducers);
  const argumentName = action && action.type === actionTypes_default.INIT ? "preloadedState argument passed to createStore" : "previous state received by the reducer";
  if (reducerKeys.length === 0) {
    return "Store does not have a valid reducer. Make sure the argument passed to combineReducers is an object whose values are reducers.";
  }
  if (!isPlainObject(inputState)) {
    return `The ${argumentName} has unexpected type of "${kindOf(inputState)}". Expected argument to be an object with the following keys: "${reducerKeys.join('", "')}"`;
  }
  const unexpectedKeys = Object.keys(inputState).filter((key) => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]);
  unexpectedKeys.forEach((key) => {
    unexpectedKeyCache[key] = true;
  });
  if (action && action.type === actionTypes_default.REPLACE)
    return;
  if (unexpectedKeys.length > 0) {
    return `Unexpected ${unexpectedKeys.length > 1 ? "keys" : "key"} "${unexpectedKeys.join('", "')}" found in ${argumentName}. Expected to find one of the known reducer keys instead: "${reducerKeys.join('", "')}". Unexpected keys will be ignored.`;
  }
}
function assertReducerShape(reducers) {
  Object.keys(reducers).forEach((key) => {
    const reducer = reducers[key];
    const initialState = reducer(void 0, {
      type: actionTypes_default.INIT
    });
    if (typeof initialState === "undefined") {
      throw new Error( false ? 0 : `The slice reducer for key "${key}" returned undefined during initialization. If the state passed to the reducer is undefined, you must explicitly return the initial state. The initial state may not be undefined. If you don't want to set a value for this reducer, you can use null instead of undefined.`);
    }
    if (typeof reducer(void 0, {
      type: actionTypes_default.PROBE_UNKNOWN_ACTION()
    }) === "undefined") {
      throw new Error( false ? 0 : `The slice reducer for key "${key}" returned undefined when probed with a random type. Don't try to handle '${actionTypes_default.INIT}' or other actions in "redux/*" namespace. They are considered private. Instead, you must return the current state for any unknown actions, unless it is undefined, in which case you must return the initial state, regardless of the action type. The initial state may not be undefined, but can be null.`);
    }
  });
}
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);
  const finalReducers = {};
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];
    if (true) {
      if (typeof reducers[key] === "undefined") {
        warning(`No reducer provided for key "${key}"`);
      }
    }
    if (typeof reducers[key] === "function") {
      finalReducers[key] = reducers[key];
    }
  }
  const finalReducerKeys = Object.keys(finalReducers);
  let unexpectedKeyCache;
  if (true) {
    unexpectedKeyCache = {};
  }
  let shapeAssertionError;
  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }
  return function combination(state = {}, action) {
    if (shapeAssertionError) {
      throw shapeAssertionError;
    }
    if (true) {
      const warningMessage = getUnexpectedStateShapeWarningMessage(state, finalReducers, action, unexpectedKeyCache);
      if (warningMessage) {
        warning(warningMessage);
      }
    }
    let hasChanged = false;
    const nextState = {};
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      if (typeof nextStateForKey === "undefined") {
        const actionType = action && action.type;
        throw new Error( false ? 0 : `When called with an action of type ${actionType ? `"${String(actionType)}"` : "(unknown type)"}, the slice reducer for key "${key}" returned undefined. To ignore an action, you must explicitly return the previous state. If you want this reducer to hold no value, you can return null instead of undefined.`);
      }
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}

// src/bindActionCreators.ts
function bindActionCreator(actionCreator, dispatch) {
  return function(...args) {
    return dispatch(actionCreator.apply(this, args));
  };
}
function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === "function") {
    return bindActionCreator(actionCreators, dispatch);
  }
  if (typeof actionCreators !== "object" || actionCreators === null) {
    throw new Error( false ? 0 : `bindActionCreators expected an object or a function, but instead received: '${kindOf(actionCreators)}'. Did you write "import ActionCreators from" instead of "import * as ActionCreators from"?`);
  }
  const boundActionCreators = {};
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    if (typeof actionCreator === "function") {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }
  return boundActionCreators;
}

// src/compose.ts
function compose(...funcs) {
  if (funcs.length === 0) {
    return (arg) => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

// src/applyMiddleware.ts
function applyMiddleware(...middlewares) {
  return (createStore2) => (reducer, preloadedState) => {
    const store = createStore2(reducer, preloadedState);
    let dispatch = () => {
      throw new Error( false ? 0 : "Dispatching while constructing your middleware is not allowed. Other middleware would not be applied to this dispatch.");
    };
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    };
    const chain = middlewares.map((middleware) => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);
    return {
      ...store,
      dispatch
    };
  };
}

// src/utils/isAction.ts
function isAction(action) {
  return isPlainObject(action) && "type" in action && typeof action.type === "string";
}

//# sourceMappingURL=redux.mjs.map
;// ./node_modules/@emotion/sheet/dist/emotion-sheet.development.esm.js
var isDevelopment = true;

/*

Based off glamor's StyleSheet, thanks Sunil ❤️

high performance StyleSheet for css-in-js systems

- uses multiple style tags behind the scenes for millions of rules
- uses `insertRule` for appending in production for *much* faster performance

// usage

import { StyleSheet } from '@emotion/sheet'

let styleSheet = new StyleSheet({ key: '', container: document.head })

styleSheet.insert('#box { border: 1px solid red; }')
- appends a css rule into the stylesheet

styleSheet.flush()
- empties the stylesheet of all its contents

*/

function sheetForTag(tag) {
  if (tag.sheet) {
    return tag.sheet;
  } // this weirdness brought to you by firefox

  /* istanbul ignore next */


  for (var i = 0; i < document.styleSheets.length; i++) {
    if (document.styleSheets[i].ownerNode === tag) {
      return document.styleSheets[i];
    }
  } // this function should always return with a value
  // TS can't understand it though so we make it stop complaining here


  return undefined;
}

function createStyleElement(options) {
  var tag = document.createElement('style');
  tag.setAttribute('data-emotion', options.key);

  if (options.nonce !== undefined) {
    tag.setAttribute('nonce', options.nonce);
  }

  tag.appendChild(document.createTextNode(''));
  tag.setAttribute('data-s', '');
  return tag;
}

var StyleSheet = /*#__PURE__*/function () {
  // Using Node instead of HTMLElement since container may be a ShadowRoot
  function StyleSheet(options) {
    var _this = this;

    this._insertTag = function (tag) {
      var before;

      if (_this.tags.length === 0) {
        if (_this.insertionPoint) {
          before = _this.insertionPoint.nextSibling;
        } else if (_this.prepend) {
          before = _this.container.firstChild;
        } else {
          before = _this.before;
        }
      } else {
        before = _this.tags[_this.tags.length - 1].nextSibling;
      }

      _this.container.insertBefore(tag, before);

      _this.tags.push(tag);
    };

    this.isSpeedy = options.speedy === undefined ? !isDevelopment : options.speedy;
    this.tags = [];
    this.ctr = 0;
    this.nonce = options.nonce; // key is the value of the data-emotion attribute, it's used to identify different sheets

    this.key = options.key;
    this.container = options.container;
    this.prepend = options.prepend;
    this.insertionPoint = options.insertionPoint;
    this.before = null;
  }

  var _proto = StyleSheet.prototype;

  _proto.hydrate = function hydrate(nodes) {
    nodes.forEach(this._insertTag);
  };

  _proto.insert = function insert(rule) {
    // the max length is how many rules we have per style tag, it's 65000 in speedy mode
    // it's 1 in dev because we insert source maps that map a single rule to a location
    // and you can only have one source map per style tag
    if (this.ctr % (this.isSpeedy ? 65000 : 1) === 0) {
      this._insertTag(createStyleElement(this));
    }

    var tag = this.tags[this.tags.length - 1];

    {
      var isImportRule = rule.charCodeAt(0) === 64 && rule.charCodeAt(1) === 105;

      if (isImportRule && this._alreadyInsertedOrderInsensitiveRule) {
        // this would only cause problem in speedy mode
        // but we don't want enabling speedy to affect the observable behavior
        // so we report this error at all times
        console.error("You're attempting to insert the following rule:\n" + rule + '\n\n`@import` rules must be before all other types of rules in a stylesheet but other rules have already been inserted. Please ensure that `@import` rules are before all other rules.');
      }

      this._alreadyInsertedOrderInsensitiveRule = this._alreadyInsertedOrderInsensitiveRule || !isImportRule;
    }

    if (this.isSpeedy) {
      var sheet = sheetForTag(tag);

      try {
        // this is the ultrafast version, works across browsers
        // the big drawback is that the css won't be editable in devtools
        sheet.insertRule(rule, sheet.cssRules.length);
      } catch (e) {
        if (!/:(-moz-placeholder|-moz-focus-inner|-moz-focusring|-ms-input-placeholder|-moz-read-write|-moz-read-only|-ms-clear|-ms-expand|-ms-reveal){/.test(rule)) {
          console.error("There was a problem inserting the following rule: \"" + rule + "\"", e);
        }
      }
    } else {
      tag.appendChild(document.createTextNode(rule));
    }

    this.ctr++;
  };

  _proto.flush = function flush() {
    this.tags.forEach(function (tag) {
      var _tag$parentNode;

      return (_tag$parentNode = tag.parentNode) == null ? void 0 : _tag$parentNode.removeChild(tag);
    });
    this.tags = [];
    this.ctr = 0;

    {
      this._alreadyInsertedOrderInsensitiveRule = false;
    }
  };

  return StyleSheet;
}();



;// ./node_modules/stylis/src/Utility.js
/**
 * @param {number}
 * @return {number}
 */
var abs = Math.abs

/**
 * @param {number}
 * @return {string}
 */
var from = String.fromCharCode

/**
 * @param {object}
 * @return {object}
 */
var Utility_assign = Object.assign

/**
 * @param {string} value
 * @param {number} length
 * @return {number}
 */
function hash (value, length) {
	return charat(value, 0) ^ 45 ? (((((((length << 2) ^ charat(value, 0)) << 2) ^ charat(value, 1)) << 2) ^ charat(value, 2)) << 2) ^ charat(value, 3) : 0
}

/**
 * @param {string} value
 * @return {string}
 */
function trim (value) {
	return value.trim()
}

/**
 * @param {string} value
 * @param {RegExp} pattern
 * @return {string?}
 */
function match (value, pattern) {
	return (value = pattern.exec(value)) ? value[0] : value
}

/**
 * @param {string} value
 * @param {(string|RegExp)} pattern
 * @param {string} replacement
 * @return {string}
 */
function replace (value, pattern, replacement) {
	return value.replace(pattern, replacement)
}

/**
 * @param {string} value
 * @param {string} search
 * @return {number}
 */
function indexof (value, search) {
	return value.indexOf(search)
}

/**
 * @param {string} value
 * @param {number} index
 * @return {number}
 */
function charat (value, index) {
	return value.charCodeAt(index) | 0
}

/**
 * @param {string} value
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function substr (value, begin, end) {
	return value.slice(begin, end)
}

/**
 * @param {string} value
 * @return {number}
 */
function strlen (value) {
	return value.length
}

/**
 * @param {any[]} value
 * @return {number}
 */
function sizeof (value) {
	return value.length
}

/**
 * @param {any} value
 * @param {any[]} array
 * @return {any}
 */
function append (value, array) {
	return array.push(value), value
}

/**
 * @param {string[]} array
 * @param {function} callback
 * @return {string}
 */
function combine (array, callback) {
	return array.map(callback).join('')
}

;// ./node_modules/stylis/src/Tokenizer.js


var line = 1
var column = 1
var Tokenizer_length = 0
var position = 0
var character = 0
var characters = ''

/**
 * @param {string} value
 * @param {object | null} root
 * @param {object | null} parent
 * @param {string} type
 * @param {string[] | string} props
 * @param {object[] | string} children
 * @param {number} length
 */
function node (value, root, parent, type, props, children, length) {
	return {value: value, root: root, parent: parent, type: type, props: props, children: children, line: line, column: column, length: length, return: ''}
}

/**
 * @param {object} root
 * @param {object} props
 * @return {object}
 */
function copy (root, props) {
	return Utility_assign(node('', null, null, '', null, null, 0), root, {length: -root.length}, props)
}

/**
 * @return {number}
 */
function Tokenizer_char () {
	return character
}

/**
 * @return {number}
 */
function prev () {
	character = position > 0 ? charat(characters, --position) : 0

	if (column--, character === 10)
		column = 1, line--

	return character
}

/**
 * @return {number}
 */
function next () {
	character = position < Tokenizer_length ? charat(characters, position++) : 0

	if (column++, character === 10)
		column = 1, line++

	return character
}

/**
 * @return {number}
 */
function peek () {
	return charat(characters, position)
}

/**
 * @return {number}
 */
function caret () {
	return position
}

/**
 * @param {number} begin
 * @param {number} end
 * @return {string}
 */
function slice (begin, end) {
	return substr(characters, begin, end)
}

/**
 * @param {number} type
 * @return {number}
 */
function token (type) {
	switch (type) {
		// \0 \t \n \r \s whitespace token
		case 0: case 9: case 10: case 13: case 32:
			return 5
		// ! + , / > @ ~ isolate token
		case 33: case 43: case 44: case 47: case 62: case 64: case 126:
		// ; { } breakpoint token
		case 59: case 123: case 125:
			return 4
		// : accompanied token
		case 58:
			return 3
		// " ' ( [ opening delimit token
		case 34: case 39: case 40: case 91:
			return 2
		// ) ] closing delimit token
		case 41: case 93:
			return 1
	}

	return 0
}

/**
 * @param {string} value
 * @return {any[]}
 */
function alloc (value) {
	return line = column = 1, Tokenizer_length = strlen(characters = value), position = 0, []
}

/**
 * @param {any} value
 * @return {any}
 */
function dealloc (value) {
	return characters = '', value
}

/**
 * @param {number} type
 * @return {string}
 */
function delimit (type) {
	return trim(slice(position - 1, delimiter(type === 91 ? type + 2 : type === 40 ? type + 1 : type)))
}

/**
 * @param {string} value
 * @return {string[]}
 */
function tokenize (value) {
	return dealloc(tokenizer(alloc(value)))
}

/**
 * @param {number} type
 * @return {string}
 */
function whitespace (type) {
	while (character = peek())
		if (character < 33)
			next()
		else
			break

	return token(type) > 2 || token(character) > 3 ? '' : ' '
}

/**
 * @param {string[]} children
 * @return {string[]}
 */
function tokenizer (children) {
	while (next())
		switch (token(character)) {
			case 0: append(identifier(position - 1), children)
				break
			case 2: append(delimit(character), children)
				break
			default: append(from(character), children)
		}

	return children
}

/**
 * @param {number} index
 * @param {number} count
 * @return {string}
 */
function escaping (index, count) {
	while (--count && next())
		// not 0-9 A-F a-f
		if (character < 48 || character > 102 || (character > 57 && character < 65) || (character > 70 && character < 97))
			break

	return slice(index, caret() + (count < 6 && peek() == 32 && next() == 32))
}

/**
 * @param {number} type
 * @return {number}
 */
function delimiter (type) {
	while (next())
		switch (character) {
			// ] ) " '
			case type:
				return position
			// " '
			case 34: case 39:
				if (type !== 34 && type !== 39)
					delimiter(character)
				break
			// (
			case 40:
				if (type === 41)
					delimiter(type)
				break
			// \
			case 92:
				next()
				break
		}

	return position
}

/**
 * @param {number} type
 * @param {number} index
 * @return {number}
 */
function commenter (type, index) {
	while (next())
		// //
		if (type + character === 47 + 10)
			break
		// /*
		else if (type + character === 42 + 42 && peek() === 47)
			break

	return '/*' + slice(index, position - 1) + '*' + from(type === 47 ? type : next())
}

/**
 * @param {number} index
 * @return {string}
 */
function identifier (index) {
	while (!token(peek()))
		next()

	return slice(index, position)
}

;// ./node_modules/stylis/src/Enum.js
var MS = '-ms-'
var MOZ = '-moz-'
var WEBKIT = '-webkit-'

var COMMENT = 'comm'
var RULESET = 'rule'
var DECLARATION = 'decl'

var PAGE = '@page'
var MEDIA = '@media'
var IMPORT = '@import'
var CHARSET = '@charset'
var VIEWPORT = '@viewport'
var SUPPORTS = '@supports'
var DOCUMENT = '@document'
var NAMESPACE = '@namespace'
var KEYFRAMES = '@keyframes'
var FONT_FACE = '@font-face'
var COUNTER_STYLE = '@counter-style'
var FONT_FEATURE_VALUES = '@font-feature-values'
var LAYER = '@layer'

;// ./node_modules/stylis/src/Serializer.js



/**
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function serialize (children, callback) {
	var output = ''
	var length = sizeof(children)

	for (var i = 0; i < length; i++)
		output += callback(children[i], i, children, callback) || ''

	return output
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 * @param {function} callback
 * @return {string}
 */
function stringify (element, index, children, callback) {
	switch (element.type) {
		case LAYER: if (element.children.length) break
		case IMPORT: case DECLARATION: return element.return = element.return || element.value
		case COMMENT: return ''
		case KEYFRAMES: return element.return = element.value + '{' + serialize(element.children, callback) + '}'
		case RULESET: element.value = element.props.join(',')
	}

	return strlen(children = serialize(element.children, callback)) ? element.return = element.value + '{' + children + '}' : ''
}

;// ./node_modules/stylis/src/Prefixer.js



/**
 * @param {string} value
 * @param {number} length
 * @param {object[]} children
 * @return {string}
 */
function prefix (value, length, children) {
	switch (hash(value, length)) {
		// color-adjust
		case 5103:
			return WEBKIT + 'print-' + value + value
		// animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)
		case 5737: case 4201: case 3177: case 3433: case 1641: case 4457: case 2921:
		// text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break
		case 5572: case 6356: case 5844: case 3191: case 6645: case 3005:
		// mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,
		case 6391: case 5879: case 5623: case 6135: case 4599: case 4855:
		// background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)
		case 4215: case 6389: case 5109: case 5365: case 5621: case 3829:
			return WEBKIT + value + value
		// tab-size
		case 4789:
			return MOZ + value + value
		// appearance, user-select, transform, hyphens, text-size-adjust
		case 5349: case 4246: case 4810: case 6968: case 2756:
			return WEBKIT + value + MOZ + value + MS + value + value
		// writing-mode
		case 5936:
			switch (charat(value, length + 11)) {
				// vertical-l(r)
				case 114:
					return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'tb') + value
				// vertical-r(l)
				case 108:
					return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'tb-rl') + value
				// horizontal(-)tb
				case 45:
					return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'lr') + value
				// default: fallthrough to below
			}
		// flex, flex-direction, scroll-snap-type, writing-mode
		case 6828: case 4268: case 2903:
			return WEBKIT + value + MS + value + value
		// order
		case 6165:
			return WEBKIT + value + MS + 'flex-' + value + value
		// align-items
		case 5187:
			return WEBKIT + value + replace(value, /(\w+).+(:[^]+)/, WEBKIT + 'box-$1$2' + MS + 'flex-$1$2') + value
		// align-self
		case 5443:
			return WEBKIT + value + MS + 'flex-item-' + replace(value, /flex-|-self/g, '') + (!match(value, /flex-|baseline/) ? MS + 'grid-row-' + replace(value, /flex-|-self/g, '') : '') + value
		// align-content
		case 4675:
			return WEBKIT + value + MS + 'flex-line-pack' + replace(value, /align-content|flex-|-self/g, '') + value
		// flex-shrink
		case 5548:
			return WEBKIT + value + MS + replace(value, 'shrink', 'negative') + value
		// flex-basis
		case 5292:
			return WEBKIT + value + MS + replace(value, 'basis', 'preferred-size') + value
		// flex-grow
		case 6060:
			return WEBKIT + 'box-' + replace(value, '-grow', '') + WEBKIT + value + MS + replace(value, 'grow', 'positive') + value
		// transition
		case 4554:
			return WEBKIT + replace(value, /([^-])(transform)/g, '$1' + WEBKIT + '$2') + value
		// cursor
		case 6187:
			return replace(replace(replace(value, /(zoom-|grab)/, WEBKIT + '$1'), /(image-set)/, WEBKIT + '$1'), value, '') + value
		// background, background-image
		case 5495: case 3959:
			return replace(value, /(image-set\([^]*)/, WEBKIT + '$1' + '$`$1')
		// justify-content
		case 4968:
			return replace(replace(value, /(.+:)(flex-)?(.*)/, WEBKIT + 'box-pack:$3' + MS + 'flex-pack:$3'), /s.+-b[^;]+/, 'justify') + WEBKIT + value + value
		// justify-self
		case 4200:
			if (!match(value, /flex-|baseline/)) return MS + 'grid-column-align' + substr(value, length) + value
			break
		// grid-template-(columns|rows)
		case 2592: case 3360:
			return MS + replace(value, 'template-', '') + value
		// grid-(row|column)-start
		case 4384: case 3616:
			if (children && children.some(function (element, index) { return length = index, match(element.props, /grid-\w+-end/) })) {
				return ~indexof(value + (children = children[length].value), 'span') ? value : (MS + replace(value, '-start', '') + value + MS + 'grid-row-span:' + (~indexof(children, 'span') ? match(children, /\d+/) : +match(children, /\d+/) - +match(value, /\d+/)) + ';')
			}
			return MS + replace(value, '-start', '') + value
		// grid-(row|column)-end
		case 4896: case 4128:
			return (children && children.some(function (element) { return match(element.props, /grid-\w+-start/) })) ? value : MS + replace(replace(value, '-end', '-span'), 'span ', '') + value
		// (margin|padding)-inline-(start|end)
		case 4095: case 3583: case 4068: case 2532:
			return replace(value, /(.+)-inline(.+)/, WEBKIT + '$1$2') + value
		// (min|max)?(width|height|inline-size|block-size)
		case 8116: case 7059: case 5753: case 5535:
		case 5445: case 5701: case 4933: case 4677:
		case 5533: case 5789: case 5021: case 4765:
			// stretch, max-content, min-content, fill-available
			if (strlen(value) - 1 - length > 6)
				switch (charat(value, length + 1)) {
					// (m)ax-content, (m)in-content
					case 109:
						// -
						if (charat(value, length + 4) !== 45)
							break
					// (f)ill-available, (f)it-content
					case 102:
						return replace(value, /(.+:)(.+)-([^]+)/, '$1' + WEBKIT + '$2-$3' + '$1' + MOZ + (charat(value, length + 3) == 108 ? '$3' : '$2-$3')) + value
					// (s)tretch
					case 115:
						return ~indexof(value, 'stretch') ? prefix(replace(value, 'stretch', 'fill-available'), length, children) + value : value
				}
			break
		// grid-(column|row)
		case 5152: case 5920:
			return replace(value, /(.+?):(\d+)(\s*\/\s*(span)?\s*(\d+))?(.*)/, function (_, a, b, c, d, e, f) { return (MS + a + ':' + b + f) + (c ? (MS + a + '-span:' + (d ? e : +e - +b)) + f : '') + value })
		// position: sticky
		case 4949:
			// stick(y)?
			if (charat(value, length + 6) === 121)
				return replace(value, ':', ':' + WEBKIT) + value
			break
		// display: (flex|inline-flex|grid|inline-grid)
		case 6444:
			switch (charat(value, charat(value, 14) === 45 ? 18 : 11)) {
				// (inline-)?fle(x)
				case 120:
					return replace(value, /(.+:)([^;\s!]+)(;|(\s+)?!.+)?/, '$1' + WEBKIT + (charat(value, 14) === 45 ? 'inline-' : '') + 'box$3' + '$1' + WEBKIT + '$2$3' + '$1' + MS + '$2box$3') + value
				// (inline-)?gri(d)
				case 100:
					return replace(value, ':', ':' + MS) + value
			}
			break
		// scroll-margin, scroll-margin-(top|right|bottom|left)
		case 5719: case 2647: case 2135: case 3927: case 2391:
			return replace(value, 'scroll-', 'scroll-snap-') + value
	}

	return value
}

;// ./node_modules/stylis/src/Middleware.js






/**
 * @param {function[]} collection
 * @return {function}
 */
function middleware (collection) {
	var length = sizeof(collection)

	return function (element, index, children, callback) {
		var output = ''

		for (var i = 0; i < length; i++)
			output += collection[i](element, index, children, callback) || ''

		return output
	}
}

/**
 * @param {function} callback
 * @return {function}
 */
function rulesheet (callback) {
	return function (element) {
		if (!element.root)
			if (element = element.return)
				callback(element)
	}
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 * @param {function} callback
 */
function prefixer (element, index, children, callback) {
	if (element.length > -1)
		if (!element.return)
			switch (element.type) {
				case DECLARATION: element.return = prefix(element.value, element.length, children)
					return
				case KEYFRAMES:
					return serialize([copy(element, {value: replace(element.value, '@', '@' + WEBKIT)})], callback)
				case RULESET:
					if (element.length)
						return combine(element.props, function (value) {
							switch (match(value, /(::plac\w+|:read-\w+)/)) {
								// :read-(only|write)
								case ':read-only': case ':read-write':
									return serialize([copy(element, {props: [replace(value, /:(read-\w+)/, ':' + MOZ + '$1')]})], callback)
								// :placeholder
								case '::placeholder':
									return serialize([
										copy(element, {props: [replace(value, /:(plac\w+)/, ':' + WEBKIT + 'input-$1')]}),
										copy(element, {props: [replace(value, /:(plac\w+)/, ':' + MOZ + '$1')]}),
										copy(element, {props: [replace(value, /:(plac\w+)/, MS + 'input-$1')]})
									], callback)
							}

							return ''
						})
			}
}

/**
 * @param {object} element
 * @param {number} index
 * @param {object[]} children
 */
function namespace (element) {
	switch (element.type) {
		case RULESET:
			element.props = element.props.map(function (value) {
				return combine(tokenize(value), function (value, index, children) {
					switch (charat(value, 0)) {
						// \f
						case 12:
							return substr(value, 1, strlen(value))
						// \0 ( + > ~
						case 0: case 40: case 43: case 62: case 126:
							return value
						// :
						case 58:
							if (children[++index] === 'global')
								children[index] = '', children[++index] = '\f' + substr(children[index], index = 1, -1)
						// \s
						case 32:
							return index === 1 ? '' : value
						default:
							switch (index) {
								case 0: element = value
									return sizeof(children) > 1 ? '' : value
								case index = sizeof(children) - 1: case 2:
									return index === 2 ? value + element + element : value + element
								default:
									return value
							}
					}
				})
			})
	}
}

;// ./node_modules/stylis/src/Parser.js




/**
 * @param {string} value
 * @return {object[]}
 */
function compile (value) {
	return dealloc(parse('', null, null, null, [''], value = alloc(value), 0, [0], value))
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {string[]} rule
 * @param {string[]} rules
 * @param {string[]} rulesets
 * @param {number[]} pseudo
 * @param {number[]} points
 * @param {string[]} declarations
 * @return {object}
 */
function parse (value, root, parent, rule, rules, rulesets, pseudo, points, declarations) {
	var index = 0
	var offset = 0
	var length = pseudo
	var atrule = 0
	var property = 0
	var previous = 0
	var variable = 1
	var scanning = 1
	var ampersand = 1
	var character = 0
	var type = ''
	var props = rules
	var children = rulesets
	var reference = rule
	var characters = type

	while (scanning)
		switch (previous = character, character = next()) {
			// (
			case 40:
				if (previous != 108 && charat(characters, length - 1) == 58) {
					if (indexof(characters += replace(delimit(character), '&', '&\f'), '&\f') != -1)
						ampersand = -1
					break
				}
			// " ' [
			case 34: case 39: case 91:
				characters += delimit(character)
				break
			// \t \n \r \s
			case 9: case 10: case 13: case 32:
				characters += whitespace(previous)
				break
			// \
			case 92:
				characters += escaping(caret() - 1, 7)
				continue
			// /
			case 47:
				switch (peek()) {
					case 42: case 47:
						append(comment(commenter(next(), caret()), root, parent), declarations)
						break
					default:
						characters += '/'
				}
				break
			// {
			case 123 * variable:
				points[index++] = strlen(characters) * ampersand
			// } ; \0
			case 125 * variable: case 59: case 0:
				switch (character) {
					// \0 }
					case 0: case 125: scanning = 0
					// ;
					case 59 + offset: if (ampersand == -1) characters = replace(characters, /\f/g, '')
						if (property > 0 && (strlen(characters) - length))
							append(property > 32 ? declaration(characters + ';', rule, parent, length - 1) : declaration(replace(characters, ' ', '') + ';', rule, parent, length - 2), declarations)
						break
					// @ ;
					case 59: characters += ';'
					// { rule/at-rule
					default:
						append(reference = ruleset(characters, root, parent, index, offset, rules, points, type, props = [], children = [], length), rulesets)

						if (character === 123)
							if (offset === 0)
								parse(characters, root, reference, reference, props, rulesets, length, points, children)
							else
								switch (atrule === 99 && charat(characters, 3) === 110 ? 100 : atrule) {
									// d l m s
									case 100: case 108: case 109: case 115:
										parse(value, reference, reference, rule && append(ruleset(value, reference, reference, 0, 0, rules, points, type, rules, props = [], length), children), rules, children, length, points, rule ? props : children)
										break
									default:
										parse(characters, reference, reference, reference, [''], children, 0, points, children)
								}
				}

				index = offset = property = 0, variable = ampersand = 1, type = characters = '', length = pseudo
				break
			// :
			case 58:
				length = 1 + strlen(characters), property = previous
			default:
				if (variable < 1)
					if (character == 123)
						--variable
					else if (character == 125 && variable++ == 0 && prev() == 125)
						continue

				switch (characters += from(character), character * variable) {
					// &
					case 38:
						ampersand = offset > 0 ? 1 : (characters += '\f', -1)
						break
					// ,
					case 44:
						points[index++] = (strlen(characters) - 1) * ampersand, ampersand = 1
						break
					// @
					case 64:
						// -
						if (peek() === 45)
							characters += delimit(next())

						atrule = peek(), offset = length = strlen(type = characters += identifier(caret())), character++
						break
					// -
					case 45:
						if (previous === 45 && strlen(characters) == 2)
							variable = 0
				}
		}

	return rulesets
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} index
 * @param {number} offset
 * @param {string[]} rules
 * @param {number[]} points
 * @param {string} type
 * @param {string[]} props
 * @param {string[]} children
 * @param {number} length
 * @return {object}
 */
function ruleset (value, root, parent, index, offset, rules, points, type, props, children, length) {
	var post = offset - 1
	var rule = offset === 0 ? rules : ['']
	var size = sizeof(rule)

	for (var i = 0, j = 0, k = 0; i < index; ++i)
		for (var x = 0, y = substr(value, post + 1, post = abs(j = points[i])), z = value; x < size; ++x)
			if (z = trim(j > 0 ? rule[x] + ' ' + y : replace(y, /&\f/g, rule[x])))
				props[k++] = z

	return node(value, root, parent, offset === 0 ? RULESET : type, props, children, length)
}

/**
 * @param {number} value
 * @param {object} root
 * @param {object?} parent
 * @return {object}
 */
function comment (value, root, parent) {
	return node(value, root, parent, COMMENT, from(Tokenizer_char()), substr(value, 2, -2), 0)
}

/**
 * @param {string} value
 * @param {object} root
 * @param {object?} parent
 * @param {number} length
 * @return {object}
 */
function declaration (value, root, parent, length) {
	return node(value, root, parent, DECLARATION, substr(value, 0, length), substr(value, length + 1, -1), length)
}

;// ./node_modules/@emotion/weak-memoize/dist/emotion-weak-memoize.esm.js
var weakMemoize = function weakMemoize(func) {
  var cache = new WeakMap();
  return function (arg) {
    if (cache.has(arg)) {
      // Use non-null assertion because we just checked that the cache `has` it
      // This allows us to remove `undefined` from the return value
      return cache.get(arg);
    }

    var ret = func(arg);
    cache.set(arg, ret);
    return ret;
  };
};



;// ./node_modules/@emotion/memoize/dist/emotion-memoize.esm.js
function memoize(fn) {
  var cache = Object.create(null);
  return function (arg) {
    if (cache[arg] === undefined) cache[arg] = fn(arg);
    return cache[arg];
  };
}



;// ./node_modules/@emotion/cache/dist/emotion-cache.browser.development.esm.js





var identifierWithPointTracking = function identifierWithPointTracking(begin, points, index) {
  var previous = 0;
  var character = 0;

  while (true) {
    previous = character;
    character = peek(); // &\f

    if (previous === 38 && character === 12) {
      points[index] = 1;
    }

    if (token(character)) {
      break;
    }

    next();
  }

  return slice(begin, position);
};

var toRules = function toRules(parsed, points) {
  // pretend we've started with a comma
  var index = -1;
  var character = 44;

  do {
    switch (token(character)) {
      case 0:
        // &\f
        if (character === 38 && peek() === 12) {
          // this is not 100% correct, we don't account for literal sequences here - like for example quoted strings
          // stylis inserts \f after & to know when & where it should replace this sequence with the context selector
          // and when it should just concatenate the outer and inner selectors
          // it's very unlikely for this sequence to actually appear in a different context, so we just leverage this fact here
          points[index] = 1;
        }

        parsed[index] += identifierWithPointTracking(position - 1, points, index);
        break;

      case 2:
        parsed[index] += delimit(character);
        break;

      case 4:
        // comma
        if (character === 44) {
          // colon
          parsed[++index] = peek() === 58 ? '&\f' : '';
          points[index] = parsed[index].length;
          break;
        }

      // fallthrough

      default:
        parsed[index] += from(character);
    }
  } while (character = next());

  return parsed;
};

var getRules = function getRules(value, points) {
  return dealloc(toRules(alloc(value), points));
}; // WeakSet would be more appropriate, but only WeakMap is supported in IE11


var fixedElements = /* #__PURE__ */new WeakMap();
var compat = function compat(element) {
  if (element.type !== 'rule' || !element.parent || // positive .length indicates that this rule contains pseudo
  // negative .length indicates that this rule has been already prefixed
  element.length < 1) {
    return;
  }

  var value = element.value;
  var parent = element.parent;
  var isImplicitRule = element.column === parent.column && element.line === parent.line;

  while (parent.type !== 'rule') {
    parent = parent.parent;
    if (!parent) return;
  } // short-circuit for the simplest case


  if (element.props.length === 1 && value.charCodeAt(0) !== 58
  /* colon */
  && !fixedElements.get(parent)) {
    return;
  } // if this is an implicitly inserted rule (the one eagerly inserted at the each new nested level)
  // then the props has already been manipulated beforehand as they that array is shared between it and its "rule parent"


  if (isImplicitRule) {
    return;
  }

  fixedElements.set(element, true);
  var points = [];
  var rules = getRules(value, points);
  var parentRules = parent.props;

  for (var i = 0, k = 0; i < rules.length; i++) {
    for (var j = 0; j < parentRules.length; j++, k++) {
      element.props[k] = points[i] ? rules[i].replace(/&\f/g, parentRules[j]) : parentRules[j] + " " + rules[i];
    }
  }
};
var removeLabel = function removeLabel(element) {
  if (element.type === 'decl') {
    var value = element.value;

    if ( // charcode for l
    value.charCodeAt(0) === 108 && // charcode for b
    value.charCodeAt(2) === 98) {
      // this ignores label
      element["return"] = '';
      element.value = '';
    }
  }
};
var ignoreFlag = 'emotion-disable-server-rendering-unsafe-selector-warning-please-do-not-use-this-the-warning-exists-for-a-reason';

var isIgnoringComment = function isIgnoringComment(element) {
  return element.type === 'comm' && element.children.indexOf(ignoreFlag) > -1;
};

var createUnsafeSelectorsAlarm = function createUnsafeSelectorsAlarm(cache) {
  return function (element, index, children) {
    if (element.type !== 'rule' || cache.compat) return;
    var unsafePseudoClasses = element.value.match(/(:first|:nth|:nth-last)-child/g);

    if (unsafePseudoClasses) {
      var isNested = !!element.parent; // in nested rules comments become children of the "auto-inserted" rule and that's always the `element.parent`
      //
      // considering this input:
      // .a {
      //   .b /* comm */ {}
      //   color: hotpink;
      // }
      // we get output corresponding to this:
      // .a {
      //   & {
      //     /* comm */
      //     color: hotpink;
      //   }
      //   .b {}
      // }

      var commentContainer = isNested ? element.parent.children : // global rule at the root level
      children;

      for (var i = commentContainer.length - 1; i >= 0; i--) {
        var node = commentContainer[i];

        if (node.line < element.line) {
          break;
        } // it is quite weird but comments are *usually* put at `column: element.column - 1`
        // so we seek *from the end* for the node that is earlier than the rule's `element` and check that
        // this will also match inputs like this:
        // .a {
        //   /* comm */
        //   .b {}
        // }
        //
        // but that is fine
        //
        // it would be the easiest to change the placement of the comment to be the first child of the rule:
        // .a {
        //   .b { /* comm */ }
        // }
        // with such inputs we wouldn't have to search for the comment at all
        // TODO: consider changing this comment placement in the next major version


        if (node.column < element.column) {
          if (isIgnoringComment(node)) {
            return;
          }

          break;
        }
      }

      unsafePseudoClasses.forEach(function (unsafePseudoClass) {
        console.error("The pseudo class \"" + unsafePseudoClass + "\" is potentially unsafe when doing server-side rendering. Try changing it to \"" + unsafePseudoClass.split('-child')[0] + "-of-type\".");
      });
    }
  };
};

var isImportRule = function isImportRule(element) {
  return element.type.charCodeAt(1) === 105 && element.type.charCodeAt(0) === 64;
};

var isPrependedWithRegularRules = function isPrependedWithRegularRules(index, children) {
  for (var i = index - 1; i >= 0; i--) {
    if (!isImportRule(children[i])) {
      return true;
    }
  }

  return false;
}; // use this to remove incorrect elements from further processing
// so they don't get handed to the `sheet` (or anything else)
// as that could potentially lead to additional logs which in turn could be overhelming to the user


var nullifyElement = function nullifyElement(element) {
  element.type = '';
  element.value = '';
  element["return"] = '';
  element.children = '';
  element.props = '';
};

var incorrectImportAlarm = function incorrectImportAlarm(element, index, children) {
  if (!isImportRule(element)) {
    return;
  }

  if (element.parent) {
    console.error("`@import` rules can't be nested inside other rules. Please move it to the top level and put it before regular rules. Keep in mind that they can only be used within global styles.");
    nullifyElement(element);
  } else if (isPrependedWithRegularRules(index, children)) {
    console.error("`@import` rules can't be after other rules. Please put your `@import` rules before your other rules.");
    nullifyElement(element);
  }
};

/* eslint-disable no-fallthrough */

function emotion_cache_browser_development_esm_prefix(value, length) {
  switch (hash(value, length)) {
    // color-adjust
    case 5103:
      return WEBKIT + 'print-' + value + value;
    // animation, animation-(delay|direction|duration|fill-mode|iteration-count|name|play-state|timing-function)

    case 5737:
    case 4201:
    case 3177:
    case 3433:
    case 1641:
    case 4457:
    case 2921: // text-decoration, filter, clip-path, backface-visibility, column, box-decoration-break

    case 5572:
    case 6356:
    case 5844:
    case 3191:
    case 6645:
    case 3005: // mask, mask-image, mask-(mode|clip|size), mask-(repeat|origin), mask-position, mask-composite,

    case 6391:
    case 5879:
    case 5623:
    case 6135:
    case 4599:
    case 4855: // background-clip, columns, column-(count|fill|gap|rule|rule-color|rule-style|rule-width|span|width)

    case 4215:
    case 6389:
    case 5109:
    case 5365:
    case 5621:
    case 3829:
      return WEBKIT + value + value;
    // appearance, user-select, transform, hyphens, text-size-adjust

    case 5349:
    case 4246:
    case 4810:
    case 6968:
    case 2756:
      return WEBKIT + value + MOZ + value + MS + value + value;
    // flex, flex-direction

    case 6828:
    case 4268:
      return WEBKIT + value + MS + value + value;
    // order

    case 6165:
      return WEBKIT + value + MS + 'flex-' + value + value;
    // align-items

    case 5187:
      return WEBKIT + value + replace(value, /(\w+).+(:[^]+)/, WEBKIT + 'box-$1$2' + MS + 'flex-$1$2') + value;
    // align-self

    case 5443:
      return WEBKIT + value + MS + 'flex-item-' + replace(value, /flex-|-self/, '') + value;
    // align-content

    case 4675:
      return WEBKIT + value + MS + 'flex-line-pack' + replace(value, /align-content|flex-|-self/, '') + value;
    // flex-shrink

    case 5548:
      return WEBKIT + value + MS + replace(value, 'shrink', 'negative') + value;
    // flex-basis

    case 5292:
      return WEBKIT + value + MS + replace(value, 'basis', 'preferred-size') + value;
    // flex-grow

    case 6060:
      return WEBKIT + 'box-' + replace(value, '-grow', '') + WEBKIT + value + MS + replace(value, 'grow', 'positive') + value;
    // transition

    case 4554:
      return WEBKIT + replace(value, /([^-])(transform)/g, '$1' + WEBKIT + '$2') + value;
    // cursor

    case 6187:
      return replace(replace(replace(value, /(zoom-|grab)/, WEBKIT + '$1'), /(image-set)/, WEBKIT + '$1'), value, '') + value;
    // background, background-image

    case 5495:
    case 3959:
      return replace(value, /(image-set\([^]*)/, WEBKIT + '$1' + '$`$1');
    // justify-content

    case 4968:
      return replace(replace(value, /(.+:)(flex-)?(.*)/, WEBKIT + 'box-pack:$3' + MS + 'flex-pack:$3'), /s.+-b[^;]+/, 'justify') + WEBKIT + value + value;
    // (margin|padding)-inline-(start|end)

    case 4095:
    case 3583:
    case 4068:
    case 2532:
      return replace(value, /(.+)-inline(.+)/, WEBKIT + '$1$2') + value;
    // (min|max)?(width|height|inline-size|block-size)

    case 8116:
    case 7059:
    case 5753:
    case 5535:
    case 5445:
    case 5701:
    case 4933:
    case 4677:
    case 5533:
    case 5789:
    case 5021:
    case 4765:
      // stretch, max-content, min-content, fill-available
      if (strlen(value) - 1 - length > 6) switch (charat(value, length + 1)) {
        // (m)ax-content, (m)in-content
        case 109:
          // -
          if (charat(value, length + 4) !== 45) break;
        // (f)ill-available, (f)it-content

        case 102:
          return replace(value, /(.+:)(.+)-([^]+)/, '$1' + WEBKIT + '$2-$3' + '$1' + MOZ + (charat(value, length + 3) == 108 ? '$3' : '$2-$3')) + value;
        // (s)tretch

        case 115:
          return ~indexof(value, 'stretch') ? emotion_cache_browser_development_esm_prefix(replace(value, 'stretch', 'fill-available'), length) + value : value;
      }
      break;
    // position: sticky

    case 4949:
      // (s)ticky?
      if (charat(value, length + 1) !== 115) break;
    // display: (flex|inline-flex)

    case 6444:
      switch (charat(value, strlen(value) - 3 - (~indexof(value, '!important') && 10))) {
        // stic(k)y
        case 107:
          return replace(value, ':', ':' + WEBKIT) + value;
        // (inline-)?fl(e)x

        case 101:
          return replace(value, /(.+:)([^;!]+)(;|!.+)?/, '$1' + WEBKIT + (charat(value, 14) === 45 ? 'inline-' : '') + 'box$3' + '$1' + WEBKIT + '$2$3' + '$1' + MS + '$2box$3') + value;
      }

      break;
    // writing-mode

    case 5936:
      switch (charat(value, length + 11)) {
        // vertical-l(r)
        case 114:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'tb') + value;
        // vertical-r(l)

        case 108:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'tb-rl') + value;
        // horizontal(-)tb

        case 45:
          return WEBKIT + value + MS + replace(value, /[svh]\w+-[tblr]{2}/, 'lr') + value;
      }

      return WEBKIT + value + MS + value + value;
  }

  return value;
}

var emotion_cache_browser_development_esm_prefixer = function prefixer(element, index, children, callback) {
  if (element.length > -1) if (!element["return"]) switch (element.type) {
    case DECLARATION:
      element["return"] = emotion_cache_browser_development_esm_prefix(element.value, element.length);
      break;

    case KEYFRAMES:
      return serialize([copy(element, {
        value: replace(element.value, '@', '@' + WEBKIT)
      })], callback);

    case RULESET:
      if (element.length) return combine(element.props, function (value) {
        switch (match(value, /(::plac\w+|:read-\w+)/)) {
          // :read-(only|write)
          case ':read-only':
          case ':read-write':
            return serialize([copy(element, {
              props: [replace(value, /:(read-\w+)/, ':' + MOZ + '$1')]
            })], callback);
          // :placeholder

          case '::placeholder':
            return serialize([copy(element, {
              props: [replace(value, /:(plac\w+)/, ':' + WEBKIT + 'input-$1')]
            }), copy(element, {
              props: [replace(value, /:(plac\w+)/, ':' + MOZ + '$1')]
            }), copy(element, {
              props: [replace(value, /:(plac\w+)/, MS + 'input-$1')]
            })], callback);
        }

        return '';
      });
  }
};

var defaultStylisPlugins = [emotion_cache_browser_development_esm_prefixer];
var getSourceMap;

{
  var sourceMapPattern = /\/\*#\ssourceMappingURL=data:application\/json;\S+\s+\*\//g;

  getSourceMap = function getSourceMap(styles) {
    var matches = styles.match(sourceMapPattern);
    if (!matches) return;
    return matches[matches.length - 1];
  };
}

var createCache = function createCache(options) {
  var key = options.key;

  if (!key) {
    throw new Error("You have to configure `key` for your cache. Please make sure it's unique (and not equal to 'css') as it's used for linking styles to your cache.\n" + "If multiple caches share the same key they might \"fight\" for each other's style elements.");
  }

  if (key === 'css') {
    var ssrStyles = document.querySelectorAll("style[data-emotion]:not([data-s])"); // get SSRed styles out of the way of React's hydration
    // document.head is a safe place to move them to(though note document.head is not necessarily the last place they will be)
    // note this very very intentionally targets all style elements regardless of the key to ensure
    // that creating a cache works inside of render of a React component

    Array.prototype.forEach.call(ssrStyles, function (node) {
      // we want to only move elements which have a space in the data-emotion attribute value
      // because that indicates that it is an Emotion 11 server-side rendered style elements
      // while we will already ignore Emotion 11 client-side inserted styles because of the :not([data-s]) part in the selector
      // Emotion 10 client-side inserted styles did not have data-s (but importantly did not have a space in their data-emotion attributes)
      // so checking for the space ensures that loading Emotion 11 after Emotion 10 has inserted some styles
      // will not result in the Emotion 10 styles being destroyed
      var dataEmotionAttribute = node.getAttribute('data-emotion');

      if (dataEmotionAttribute.indexOf(' ') === -1) {
        return;
      }

      document.head.appendChild(node);
      node.setAttribute('data-s', '');
    });
  }

  var stylisPlugins = options.stylisPlugins || defaultStylisPlugins;

  {
    if (/[^a-z-]/.test(key)) {
      throw new Error("Emotion key must only contain lower case alphabetical characters and - but \"" + key + "\" was passed");
    }
  }

  var inserted = {};
  var container;
  var nodesToHydrate = [];

  {
    container = options.container || document.head;
    Array.prototype.forEach.call( // this means we will ignore elements which don't have a space in them which
    // means that the style elements we're looking at are only Emotion 11 server-rendered style elements
    document.querySelectorAll("style[data-emotion^=\"" + key + " \"]"), function (node) {
      var attrib = node.getAttribute("data-emotion").split(' ');

      for (var i = 1; i < attrib.length; i++) {
        inserted[attrib[i]] = true;
      }

      nodesToHydrate.push(node);
    });
  }

  var _insert;

  var omnipresentPlugins = [compat, removeLabel];

  {
    omnipresentPlugins.push(createUnsafeSelectorsAlarm({
      get compat() {
        return cache.compat;
      }

    }), incorrectImportAlarm);
  }

  {
    var currentSheet;
    var finalizingPlugins = [stringify, function (element) {
      if (!element.root) {
        if (element["return"]) {
          currentSheet.insert(element["return"]);
        } else if (element.value && element.type !== COMMENT) {
          // insert empty rule in non-production environments
          // so @emotion/jest can grab `key` from the (JS)DOM for caches without any rules inserted yet
          currentSheet.insert(element.value + "{}");
        }
      }
    } ];
    var serializer = middleware(omnipresentPlugins.concat(stylisPlugins, finalizingPlugins));

    var stylis = function stylis(styles) {
      return serialize(compile(styles), serializer);
    };

    _insert = function insert(selector, serialized, sheet, shouldCache) {
      currentSheet = sheet;

      if (getSourceMap) {
        var sourceMap = getSourceMap(serialized.styles);

        if (sourceMap) {
          currentSheet = {
            insert: function insert(rule) {
              sheet.insert(rule + sourceMap);
            }
          };
        }
      }

      stylis(selector ? selector + "{" + serialized.styles + "}" : serialized.styles);

      if (shouldCache) {
        cache.inserted[serialized.name] = true;
      }
    };
  }

  var cache = {
    key: key,
    sheet: new StyleSheet({
      key: key,
      container: container,
      nonce: options.nonce,
      speedy: options.speedy,
      prepend: options.prepend,
      insertionPoint: options.insertionPoint
    }),
    nonce: options.nonce,
    inserted: inserted,
    registered: {},
    insert: _insert
  };
  cache.sheet.hydrate(nodesToHydrate);
  return cache;
};



;// ./node_modules/@emotion/hash/dist/emotion-hash.esm.js
/* eslint-disable */
// Inspired by https://github.com/garycourt/murmurhash-js
// Ported from https://github.com/aappleby/smhasher/blob/61a0530f28277f2e850bfc39600ce61d02b518de/src/MurmurHash2.cpp#L37-L86
function murmur2(str) {
  // 'm' and 'r' are mixing constants generated offline.
  // They're not really 'magic', they just happen to work well.
  // const m = 0x5bd1e995;
  // const r = 24;
  // Initialize the hash
  var h = 0; // Mix 4 bytes at a time into the hash

  var k,
      i = 0,
      len = str.length;

  for (; len >= 4; ++i, len -= 4) {
    k = str.charCodeAt(i) & 0xff | (str.charCodeAt(++i) & 0xff) << 8 | (str.charCodeAt(++i) & 0xff) << 16 | (str.charCodeAt(++i) & 0xff) << 24;
    k =
    /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16);
    k ^=
    /* k >>> r: */
    k >>> 24;
    h =
    /* Math.imul(k, m): */
    (k & 0xffff) * 0x5bd1e995 + ((k >>> 16) * 0xe995 << 16) ^
    /* Math.imul(h, m): */
    (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Handle the last few bytes of the input array


  switch (len) {
    case 3:
      h ^= (str.charCodeAt(i + 2) & 0xff) << 16;

    case 2:
      h ^= (str.charCodeAt(i + 1) & 0xff) << 8;

    case 1:
      h ^= str.charCodeAt(i) & 0xff;
      h =
      /* Math.imul(h, m): */
      (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  } // Do a few final mixes of the hash to ensure the last few
  // bytes are well-incorporated.


  h ^= h >>> 13;
  h =
  /* Math.imul(h, m): */
  (h & 0xffff) * 0x5bd1e995 + ((h >>> 16) * 0xe995 << 16);
  return ((h ^ h >>> 15) >>> 0).toString(36);
}



;// ./node_modules/@emotion/unitless/dist/emotion-unitless.esm.js
var unitlessKeys = {
  animationIterationCount: 1,
  aspectRatio: 1,
  borderImageOutset: 1,
  borderImageSlice: 1,
  borderImageWidth: 1,
  boxFlex: 1,
  boxFlexGroup: 1,
  boxOrdinalGroup: 1,
  columnCount: 1,
  columns: 1,
  flex: 1,
  flexGrow: 1,
  flexPositive: 1,
  flexShrink: 1,
  flexNegative: 1,
  flexOrder: 1,
  gridRow: 1,
  gridRowEnd: 1,
  gridRowSpan: 1,
  gridRowStart: 1,
  gridColumn: 1,
  gridColumnEnd: 1,
  gridColumnSpan: 1,
  gridColumnStart: 1,
  msGridRow: 1,
  msGridRowSpan: 1,
  msGridColumn: 1,
  msGridColumnSpan: 1,
  fontWeight: 1,
  lineHeight: 1,
  opacity: 1,
  order: 1,
  orphans: 1,
  scale: 1,
  tabSize: 1,
  widows: 1,
  zIndex: 1,
  zoom: 1,
  WebkitLineClamp: 1,
  // SVG-related properties
  fillOpacity: 1,
  floodOpacity: 1,
  stopOpacity: 1,
  strokeDasharray: 1,
  strokeDashoffset: 1,
  strokeMiterlimit: 1,
  strokeOpacity: 1,
  strokeWidth: 1
};



;// ./node_modules/@emotion/serialize/dist/emotion-serialize.development.esm.js




var emotion_serialize_development_esm_isDevelopment = true;

var ILLEGAL_ESCAPE_SEQUENCE_ERROR = "You have illegal escape sequence in your template literal, most likely inside content's property value.\nBecause you write your CSS inside a JavaScript string you actually have to do double escaping, so for example \"content: '\\00d7';\" should become \"content: '\\\\00d7';\".\nYou can read more about this here:\nhttps://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals#ES2018_revision_of_illegal_escape_sequences";
var UNDEFINED_AS_OBJECT_KEY_ERROR = "You have passed in falsy value as style object's key (can happen when in example you pass unexported component as computed key).";
var hyphenateRegex = /[A-Z]|^ms/g;
var animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g;

var isCustomProperty = function isCustomProperty(property) {
  return property.charCodeAt(1) === 45;
};

var isProcessableValue = function isProcessableValue(value) {
  return value != null && typeof value !== 'boolean';
};

var processStyleName = /* #__PURE__ */memoize(function (styleName) {
  return isCustomProperty(styleName) ? styleName : styleName.replace(hyphenateRegex, '-$&').toLowerCase();
});

var processStyleValue = function processStyleValue(key, value) {
  switch (key) {
    case 'animation':
    case 'animationName':
      {
        if (typeof value === 'string') {
          return value.replace(animationRegex, function (match, p1, p2) {
            cursor = {
              name: p1,
              styles: p2,
              next: cursor
            };
            return p1;
          });
        }
      }
  }

  if (unitlessKeys[key] !== 1 && !isCustomProperty(key) && typeof value === 'number' && value !== 0) {
    return value + 'px';
  }

  return value;
};

{
  var contentValuePattern = /(var|attr|counters?|url|element|(((repeating-)?(linear|radial))|conic)-gradient)\(|(no-)?(open|close)-quote/;
  var contentValues = ['normal', 'none', 'initial', 'inherit', 'unset'];
  var oldProcessStyleValue = processStyleValue;
  var msPattern = /^-ms-/;
  var hyphenPattern = /-(.)/g;
  var hyphenatedCache = {};

  processStyleValue = function processStyleValue(key, value) {
    if (key === 'content') {
      if (typeof value !== 'string' || contentValues.indexOf(value) === -1 && !contentValuePattern.test(value) && (value.charAt(0) !== value.charAt(value.length - 1) || value.charAt(0) !== '"' && value.charAt(0) !== "'")) {
        throw new Error("You seem to be using a value for 'content' without quotes, try replacing it with `content: '\"" + value + "\"'`");
      }
    }

    var processed = oldProcessStyleValue(key, value);

    if (processed !== '' && !isCustomProperty(key) && key.indexOf('-') !== -1 && hyphenatedCache[key] === undefined) {
      hyphenatedCache[key] = true;
      console.error("Using kebab-case for css properties in objects is not supported. Did you mean " + key.replace(msPattern, 'ms-').replace(hyphenPattern, function (str, _char) {
        return _char.toUpperCase();
      }) + "?");
    }

    return processed;
  };
}

var noComponentSelectorMessage = 'Component selectors can only be used in conjunction with ' + '@emotion/babel-plugin, the swc Emotion plugin, or another Emotion-aware ' + 'compiler transform.';

function handleInterpolation(mergedProps, registered, interpolation) {
  if (interpolation == null) {
    return '';
  }

  var componentSelector = interpolation;

  if (componentSelector.__emotion_styles !== undefined) {
    if (String(componentSelector) === 'NO_COMPONENT_SELECTOR') {
      throw new Error(noComponentSelectorMessage);
    }

    return componentSelector;
  }

  switch (typeof interpolation) {
    case 'boolean':
      {
        return '';
      }

    case 'object':
      {
        var keyframes = interpolation;

        if (keyframes.anim === 1) {
          cursor = {
            name: keyframes.name,
            styles: keyframes.styles,
            next: cursor
          };
          return keyframes.name;
        }

        var serializedStyles = interpolation;

        if (serializedStyles.styles !== undefined) {
          var next = serializedStyles.next;

          if (next !== undefined) {
            // not the most efficient thing ever but this is a pretty rare case
            // and there will be very few iterations of this generally
            while (next !== undefined) {
              cursor = {
                name: next.name,
                styles: next.styles,
                next: cursor
              };
              next = next.next;
            }
          }

          var styles = serializedStyles.styles + ";";
          return styles;
        }

        return createStringFromObject(mergedProps, registered, interpolation);
      }

    case 'function':
      {
        if (mergedProps !== undefined) {
          var previousCursor = cursor;
          var result = interpolation(mergedProps);
          cursor = previousCursor;
          return handleInterpolation(mergedProps, registered, result);
        } else {
          console.error('Functions that are interpolated in css calls will be stringified.\n' + 'If you want to have a css call based on props, create a function that returns a css call like this\n' + 'let dynamicStyle = (props) => css`color: ${props.color}`\n' + 'It can be called directly with props or interpolated in a styled call like this\n' + "let SomeComponent = styled('div')`${dynamicStyle}`");
        }

        break;
      }

    case 'string':
      {
        var matched = [];
        var replaced = interpolation.replace(animationRegex, function (_match, _p1, p2) {
          var fakeVarName = "animation" + matched.length;
          matched.push("const " + fakeVarName + " = keyframes`" + p2.replace(/^@keyframes animation-\w+/, '') + "`");
          return "${" + fakeVarName + "}";
        });

        if (matched.length) {
          console.error("`keyframes` output got interpolated into plain string, please wrap it with `css`.\n\nInstead of doing this:\n\n" + [].concat(matched, ["`" + replaced + "`"]).join('\n') + "\n\nYou should wrap it with `css` like this:\n\ncss`" + replaced + "`");
        }
      }

      break;
  } // finalize string values (regular strings and functions interpolated into css calls)


  var asString = interpolation;

  if (registered == null) {
    return asString;
  }

  var cached = registered[asString];
  return cached !== undefined ? cached : asString;
}

function createStringFromObject(mergedProps, registered, obj) {
  var string = '';

  if (Array.isArray(obj)) {
    for (var i = 0; i < obj.length; i++) {
      string += handleInterpolation(mergedProps, registered, obj[i]) + ";";
    }
  } else {
    for (var key in obj) {
      var value = obj[key];

      if (typeof value !== 'object') {
        var asString = value;

        if (registered != null && registered[asString] !== undefined) {
          string += key + "{" + registered[asString] + "}";
        } else if (isProcessableValue(asString)) {
          string += processStyleName(key) + ":" + processStyleValue(key, asString) + ";";
        }
      } else {
        if (key === 'NO_COMPONENT_SELECTOR' && emotion_serialize_development_esm_isDevelopment) {
          throw new Error(noComponentSelectorMessage);
        }

        if (Array.isArray(value) && typeof value[0] === 'string' && (registered == null || registered[value[0]] === undefined)) {
          for (var _i = 0; _i < value.length; _i++) {
            if (isProcessableValue(value[_i])) {
              string += processStyleName(key) + ":" + processStyleValue(key, value[_i]) + ";";
            }
          }
        } else {
          var interpolated = handleInterpolation(mergedProps, registered, value);

          switch (key) {
            case 'animation':
            case 'animationName':
              {
                string += processStyleName(key) + ":" + interpolated + ";";
                break;
              }

            default:
              {
                if (key === 'undefined') {
                  console.error(UNDEFINED_AS_OBJECT_KEY_ERROR);
                }

                string += key + "{" + interpolated + "}";
              }
          }
        }
      }
    }
  }

  return string;
}

var labelPattern = /label:\s*([^\s;{]+)\s*(;|$)/g; // this is the cursor for keyframes
// keyframes are stored on the SerializedStyles object as a linked list

var cursor;
function serializeStyles(args, registered, mergedProps) {
  if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && args[0].styles !== undefined) {
    return args[0];
  }

  var stringMode = true;
  var styles = '';
  cursor = undefined;
  var strings = args[0];

  if (strings == null || strings.raw === undefined) {
    stringMode = false;
    styles += handleInterpolation(mergedProps, registered, strings);
  } else {
    var asTemplateStringsArr = strings;

    if (asTemplateStringsArr[0] === undefined) {
      console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
    }

    styles += asTemplateStringsArr[0];
  } // we start at 1 since we've already handled the first arg


  for (var i = 1; i < args.length; i++) {
    styles += handleInterpolation(mergedProps, registered, args[i]);

    if (stringMode) {
      var templateStringsArr = strings;

      if (templateStringsArr[i] === undefined) {
        console.error(ILLEGAL_ESCAPE_SEQUENCE_ERROR);
      }

      styles += templateStringsArr[i];
    }
  } // using a global regex with .exec is stateful so lastIndex has to be reset each time


  labelPattern.lastIndex = 0;
  var identifierName = '';
  var match; // https://esbench.com/bench/5b809c2cf2949800a0f61fb5

  while ((match = labelPattern.exec(styles)) !== null) {
    identifierName += '-' + match[1];
  }

  var name = murmur2(styles) + identifierName;

  {
    var devStyles = {
      name: name,
      styles: styles,
      next: cursor,
      toString: function toString() {
        return "You have tried to stringify object returned from `css` function. It isn't supposed to be used directly (e.g. as value of the `className` prop), but rather handed to emotion so it can handle it (e.g. as value of `css` prop).";
      }
    };
    return devStyles;
  }
}



;// ./node_modules/@emotion/utils/dist/emotion-utils.browser.esm.js
var isBrowser = true;

function getRegisteredStyles(registered, registeredStyles, classNames) {
  var rawClassName = '';
  classNames.split(' ').forEach(function (className) {
    if (registered[className] !== undefined) {
      registeredStyles.push(registered[className] + ";");
    } else if (className) {
      rawClassName += className + " ";
    }
  });
  return rawClassName;
}
var registerStyles = function registerStyles(cache, serialized, isStringTag) {
  var className = cache.key + "-" + serialized.name;

  if ( // we only need to add the styles to the registered cache if the
  // class name could be used further down
  // the tree but if it's a string tag, we know it won't
  // so we don't have to add it to registered cache.
  // this improves memory usage since we can avoid storing the whole style string
  (isStringTag === false || // we need to always store it if we're in compat mode and
  // in node since emotion-server relies on whether a style is in
  // the registered cache to know whether a style is global or not
  // also, note that this check will be dead code eliminated in the browser
  isBrowser === false ) && cache.registered[className] === undefined) {
    cache.registered[className] = serialized.styles;
  }
};
var insertStyles = function insertStyles(cache, serialized, isStringTag) {
  registerStyles(cache, serialized, isStringTag);
  var className = cache.key + "-" + serialized.name;

  if (cache.inserted[serialized.name] === undefined) {
    var current = serialized;

    do {
      cache.insert(serialized === current ? "." + className : '', current, cache.sheet, true);

      current = current.next;
    } while (current !== undefined);
  }
};



;// ./node_modules/@emotion/css/create-instance/dist/emotion-css-create-instance.development.esm.js




function insertWithoutScoping(cache, serialized) {
  if (cache.inserted[serialized.name] === undefined) {
    return cache.insert('', serialized, cache.sheet, true);
  }
}

function merge(registered, css, className) {
  var registeredStyles = [];
  var rawClassName = getRegisteredStyles(registered, registeredStyles, className);

  if (registeredStyles.length < 2) {
    return className;
  }

  return rawClassName + css(registeredStyles);
}

var createEmotion = function createEmotion(options) {
  var cache = createCache(options);

  cache.sheet.speedy = function (value) {
    if (this.ctr !== 0) {
      throw new Error('speedy must be changed before any rules are inserted');
    }

    this.isSpeedy = value;
  };

  cache.compat = true;

  var css = function css() {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var serialized = serializeStyles(args, cache.registered, undefined);
    insertStyles(cache, serialized, false);
    return cache.key + "-" + serialized.name;
  };

  var keyframes = function keyframes() {
    for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      args[_key2] = arguments[_key2];
    }

    var serialized = serializeStyles(args, cache.registered);
    var animation = "animation-" + serialized.name;
    insertWithoutScoping(cache, {
      name: serialized.name,
      styles: "@keyframes " + animation + "{" + serialized.styles + "}"
    });
    return animation;
  };

  var injectGlobal = function injectGlobal() {
    for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      args[_key3] = arguments[_key3];
    }

    var serialized = serializeStyles(args, cache.registered);
    insertWithoutScoping(cache, serialized);
  };

  var cx = function cx() {
    for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      args[_key4] = arguments[_key4];
    }

    return merge(cache.registered, css, classnames(args));
  };

  return {
    css: css,
    cx: cx,
    injectGlobal: injectGlobal,
    keyframes: keyframes,
    hydrate: function hydrate(ids) {
      ids.forEach(function (key) {
        cache.inserted[key] = true;
      });
    },
    flush: function flush() {
      cache.registered = {};
      cache.inserted = {};
      cache.sheet.flush();
    },
    sheet: cache.sheet,
    cache: cache,
    getRegisteredStyles: getRegisteredStyles.bind(null, cache.registered),
    merge: merge.bind(null, cache.registered, css)
  };
};

var classnames = function classnames(args) {
  var cls = '';

  for (var i = 0; i < args.length; i++) {
    var arg = args[i];
    if (arg == null) continue;
    var toAdd = void 0;

    switch (typeof arg) {
      case 'boolean':
        break;

      case 'object':
        {
          if (Array.isArray(arg)) {
            toAdd = classnames(arg);
          } else {
            toAdd = '';

            for (var k in arg) {
              if (arg[k] && k) {
                toAdd && (toAdd += ' ');
                toAdd += k;
              }
            }
          }

          break;
        }

      default:
        {
          toAdd = arg;
        }
    }

    if (toAdd) {
      cls && (cls += ' ');
      cls += toAdd;
    }
  }

  return cls;
};



;// ./node_modules/@emotion/css/dist/emotion-css.development.esm.js





var _createEmotion = createEmotion({
  key: 'css'
}),
    flush = _createEmotion.flush,
    hydrate = _createEmotion.hydrate,
    cx = _createEmotion.cx,
    emotion_css_development_esm_merge = _createEmotion.merge,
    emotion_css_development_esm_getRegisteredStyles = _createEmotion.getRegisteredStyles,
    injectGlobal = _createEmotion.injectGlobal,
    keyframes = _createEmotion.keyframes,
    css = _createEmotion.css,
    sheet = _createEmotion.sheet,
    cache = _createEmotion.cache;



// EXTERNAL MODULE: ./node_modules/prop-types/index.js
var prop_types = __webpack_require__(556);
var prop_types_default = /*#__PURE__*/__webpack_require__.n(prop_types);
;// ./src/misc.jsx
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




const [CORE,COMPONENT,MEMOIZED]=[Symbol.for('LILACT:CORE'),Symbol.for('LILACT:COMPONENT'),Symbol.for('LILACT:MEMOIZED')];


const typeOf = (input) => {
	// used for object comparison functions
	// https://monsterlessons-academy.com/posts/shallow-comparison-vs-deep-comparison-in-javascript

	const rawObject = Object.prototype.toString.call(input).toLowerCase();
	const typeOfRegex = /\[object (.*)]/g;
	const type = typeOfRegex.exec(rawObject)[1];
	return type;
};



// React API

/**
 * Checks whether a value is a Lilact component.
 *
 * @param value - Value to inspect.
 * @returns True if the value is a class component; otherwise false.
 */
const isValidElement = (o) => {
	return o[CORE]!==undefined || o[TEXT]!==undefined;
}

/**
 * Utility to find the underlying DOM node for a mounted Lilact component.
 *
 * @param element - A Lilact component instance to locate its DOM node.
 * @returns The corresponding DOM element (or null if unavailable).
 */
const findDOMNode = (comp)=>{

	/*
	When a component renders to null or false, findDOMNode returns null. 
	When a component renders to a string, findDOMNode returns a text DOM node containing that value. 

	Note:

	findDOMNode only works on mounted components (that is, components that have been placed in the DOM). 
	If you try to call this on a component that has not been mounted yet (like calling findDOMNode() in 
	render() on a component that has yet to be created) an exception will be thrown.

	Unlike React, in Lilact findDOMNode can also be used on function components.
	*/
	if(!comp[CORE]?.element?.parentNode) throw new Error("findDOMNode only works on mounted components.");
	return comp[CORE].element;
}

/**
 * Fragment helper/utility (same behavior as an array of children).
 *
 * @param children - The nodes to group without adding an extra DOM element.
 */
const misc_Fragment = function ({children}) { return children };
misc_Fragment.displayName = "Fragment";

/**
 * Children namespace for utilities that operate on `props.children`. `Children` is deprecated
 * and not recommended by React documentation itself. But `only` and `toArray` are used 
 * extensively everywhere, so I included them.
 *
 * @property only - Filters to the single child (or returns null/throws based on count).
 * @property toArray - Converts children to a flat array.
 */
const Children = {
	
/**
 * Returns the only child from a children collection.
 *
 * @param children - The children to read.
 * @returns The single child (or null/exception based on the number of children).
 */
	only(children) {
		children = [...children];
		let i=0;
		while(i<children.length) {
			if(children[i]?.constructor?.name==='Array') {
				children.splice(i, 1, ...children[i]);
				i--;
			}
			else if(children[i]===null || children[i]===undefined) {
				children.splice(i, 1);
				i--;
			}
			if(i>1) {
				throw new Error("No child or child is not the only one");
			}
			i++;
		}
		if(children.length===1) return children[0];

	},

/**
 * Converts component children into a flat array.
 *
 * @param children - The children to convert.
 * @returns An array representation of the children.
 */
	toArray(children) {
		if(children) {
			if(children?.constructor?.name==='Array') return [...children];
			return [children];
		}
		return [];
	}
};


/**
 * Debug tool to detect the component visible at a point on screen.
 *
 * @returns A promise that is resolved when the user clicks on screen and its value will be the component if any.
 */
function getComponentByPointer()
{
	let resolve_func;

	const pr = new Promise( (res, rej)=> {
		resolve_func = res;
	});

	function click_handler(event) {

		event.stopImmediatePropagation();
		window.removeEventListener('click', click_handler, true);

		let t = event.target;

		while( !t[COMPONENT] && t.parentNode ) {
			t = t.parentNode;
		}

		resolve_func( t[COMPONENT] );

		return false;
	}

	window.addEventListener('click', click_handler, true);

	return pr;
}


/**
 * Utility for applying one or more class names to an element.
 *
 * @param classNames - One or more class name values to combine.
 */
function classNames(classes) {
	return Object.entries(classes)
	.filter(([key, value]) => value)
	.map(([key, value]) => key)
	.join(' ');
}


/**
 * Checks whether a collection/set/array is empty.
 *
 * @param value - Value to check for emptiness.
 * @returns True if empty; otherwise false.
 */
function isEmpty(o)  {
	for(let i in o) return false;
		return true;
}


/**
 * Determines whether two values are shallowly equal.
 *
 * @param objA - First object to compare.
 * @param objB - Second object to compare.
 * @returns True if shallowly equal; otherwise false.
 */
const shallowEqual = (source, target) => {
	if (typeOf(source) !== typeOf(target)) {
		return false;
	}

	if (typeOf(source) === "array") {
		if (source.length !== target.length) {
			return false;
		}
		return source.every((el, index) => el === target[index]);
	} else if (typeOf(source) === "object") {
		return Object.keys(source).every((key) => source[key] === target[key]);
	} else if (typeOf(source) === "date") {
		return source.getTime() === target.getTime();
	}

	return source === target;
}


/**
 * Determines whether two values are deeply equal.
 *
 * @param objA - First object to compare.
 * @param objB - Second object to compare.
 * @returns True if deeply equal; otherwise false.
 */
function deepEqual(source, target) {
	if (typeOf(source) !== typeOf(target)) {
		return false;
	}

	if (typeOf(source) === "array") {
		if (source.length !== target.length) {
			return false;
		}

		return source.every((entry, index) => deepEqual(entry, target[index]));
	} else if (typeOf(source) === "object") {
		if (Object.keys(source).length !== Object.keys(target).length) {
			return false;
		}

		return Object.keys(source).every((key) =>
			deepEqual(source[key], target[key])
			);
	} else if (typeOf(source) === "date") {
		return source.getTime() === target.getTime();
	}

	return source === target;
}



/**
 * Checks whether a value is a js class.
 *
 * @param value - Value to inspect.
 * @returns True if the value is a js class; otherwise false.
 */
function isClass(func) {
	// from https://stackoverflow.com/a/66120819
	if(!(func && func.constructor === Function) || func.prototype === undefined)
		return false;
	if(Function.prototype !== Object.getPrototypeOf(func))
		return true;
	return Object.getOwnPropertyNames(func.prototype).length > 1;
}

/**
 * Checks whether a value is an async function.
 *
 * @param value - Value to inspect.
 * @returns True if the value is an async function; otherwise false.
 */
function isAsync(fn) {
	return typeof fn === 'function' && fn.constructor && fn.constructor.name === 'AsyncFunction';
}

/**
 * Checks whether a value is thenable (supports `.then` like a Promise).
 *
 * @param value - Value to inspect.
 * @returns True if thenable; otherwise false.
 */
function isThenable(x) {
	return x && (typeof x === "object" || typeof x === "function") && typeof x.then === "function";
}

/**
 * Checks whether a value is an error.
 *
 * @param value - Value to inspect.
 * @returns True if thenable; otherwise false.
 */
function misc_isError(x) {  
	return x instanceof Error || Object.prototype.toString.call(x) === '[object Error]';
}

/**
 * Converts the input to a boolean value
 *
 * @param value - Value to inspect.
 * @returns boolean value
 */
function toBool(x) {
	if (typeof x === "boolean") return x;

	if (typeof x === "number") return x !== 0;

	if (typeof x === "string") {
		x = x.trim().toLowerCase();
		if (x === "true") return true;
		if (x === "false") return false;
	}

	return Boolean(x);
}


// Internals

/** @ignore */
const required_scripts = {};

/** @ignore */
let update_timeout = undefined;
/** @ignore */
let update_interval_margin = 0;
/** @ignore */
let id_num = Math.floor(Math.random()*10000);
/** @ignore */
let eval_num = 0;//Math.floor(Math.random()*10000);


// todo =improve these stacks
/** @ignore */
let current_component = [];
/** @ignore */
let update_set  = new Set;
/** @ignore */
let update_cbs  = new Set;
/** @ignore */
let roots  = new Set;
/** @ignore */
let layout_effects = new Set;

/** @ignore */
const special_attributes = new Set([
		"classname", "classname", "ref", "action", "lilact_jsx_loc", "children", "key",
		"defaultvalue", "defaultchecked"
	]);

/** @ignore */
const events_set = new Set([
	"onafterprint","onbeforeprint","onbeforeunload","onerror","onhashchange","onload","onmessage",
	"onoffline","ononline","onpagehide","onpageshow","onpopstate","onresize","onstorage","onunload",
	"onblur","onchange","oncontextmenu","onfocus","oninput","oninvalid","onreset","onsearch","onselect",
	"onsubmit",
	"onkeydown","onkeypress","onkeyup",
	"onclick","ondblclick","onmousedown","onmousemove","onmouseout","onmouseover","onmouseup","onmousewheel",
	"onwheel",
	"ondrag","ondragend","ondragenter","ondragleave","ondragover","ondragstart","ondrop","onscroll",
	"oncopy","oncut","onpaste",
	"onabort","oncanplay","oncanplaythrough","oncuechange","ondurationchange","onemptied","onended","onerror",
	"onloadeddata","onloadedmetadata","onloadstart","onpause","onplay","onplaying","onprogress","onratechange",
	"onseeked","onseeking","onstalled","onsuspend","ontimeupdate","onvolumechange","onwaiting",
	"ontoggle",

	"onpointerdown", "onpointerup", "onpointermove", "onpointercancel", "onpointerover", "onpointerout", 
	"onpointerenter", "onpointerleave"
]);

/** @ignore */
const length_css_attributes_set = new Set([
	"width","height","minWidth","minHeight","maxWidth","maxHeight","top","right","bottom","left","margin",
	"marginTop","marginRight","marginBottom","marginLeft","padding","paddingTop","paddingRight","paddingBottom",
	"paddingLeft","borderWidth","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth",
	"outlineWidth","fontSize","lineHeight","letterSpacing","wordSpacing","textIndent","borderRadius",
	"borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius",
	"columnGap","rowGap","gap"
]);

/** @ignore */
const boolean_html_attributes_set = new 
	Set(["disabled", "readOnly", "required", "checked", "multiple",
			 "hidden","open","loop","muted","controls","playsInline","allowFullScreen"]);


//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9taXNjLmpzeCIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hcmFzaC9EZXNrdG9wL1Byb2plY3RzL0xpbGFjdC9zcmMvbWlzYy5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBaUNDOzs7Z0JBR2UsV0FBVztFQUN6QjtFQUNBOztrREFFZ0QsbUJBQW1CO3NCQUMvQzsrQkFDUzs7Ozs7O0NBTTlCOztDQUVBOzs7Ozs7K0JBTThCLE9BQU87Ozs7Q0FJckM7Ozs7Ozs0QkFNMkIsUUFBUTs7RUFFbEM7Ozs7Ozs7Ozs7OztJQVlFLGtEQUFrRDs7OztDQUlyRDs7Ozs7a0NBS2tDLEFBQUQsYUFBYTs7O0NBRzlDOzs7Ozs7Ozt5QkFRd0I7O0NBRXhCOzs7Ozs7TUFNSyxXQUFXOzs7UUFHVCxvQkFBb0I7TUFDdEIsMkNBQTJDO29CQUM3Qjs7O1dBR1QsZ0RBQWdEO29CQUN2Qzs7O01BR2QsTUFBTTtvQkFDUTs7OztLQUlmOzs7O0NBSUo7Ozs7OztTQU1RLFdBQVc7S0FDZixXQUFXO01BQ1Y7Ozs7Ozs7O0NBUUw7Ozs7O3NDQUtxQztDQUNyQzs7O3dCQUd1QixDQUFFLGFBQWE7Ozs7d0JBSWYsUUFBUTs7aUNBRUM7NkJBQ0o7Ozs7UUFJckIsa0NBQWtDOzs7O2VBSTNCOzs7Ozt5QkFLVTs7Ozs7O0NBTXhCOzs7OzsyQkFLMEIsVUFBVTt1QkFDZDtTQUNiLEFBQUQ7TUFDRixBQUFEO09BQ0M7Ozs7Q0FJTjs7Ozs7O3dCQU11QixLQUFLO0tBQ3hCOzs7OztDQUtKOzs7Ozs7OzZCQU80QixvQkFBb0I7S0FDNUMsTUFBTyxtQkFBbUIsV0FBVTs7OztLQUlwQyxNQUFPLHVCQUFzQjtNQUM1QixrQ0FBa0M7OztzQkFHakIsQUFBRDtZQUNWLE1BQU8sd0JBQXVCO3FCQUNyQixjQUFlLEFBQUQ7WUFDdkIsTUFBTyxzQkFBcUI7d0JBQ2hCLHFCQUFxQjs7Ozs7OztDQU81Qzs7Ozs7OzswQkFPeUIsaUJBQWlCO0tBQ3RDLE1BQU8sbUJBQW1CLFdBQVU7Ozs7S0FJcEMsTUFBTyx1QkFBc0I7TUFDNUIsa0NBQWtDOzs7O3NCQUlqQixBQUFELDJCQUE0QjtZQUN0QyxNQUFPLHdCQUF1QjtNQUNwQyxXQUFZLCtCQUErQixrQkFBaUI7Ozs7cUJBSTdDLGNBQWUsQUFBRDtZQUN0Qjs7WUFFRCxNQUFPLHNCQUFxQjt3QkFDaEIscUJBQXFCOzs7Ozs7OztDQVE1Qzs7Ozs7O3dCQU11QixPQUFPO0VBQzdCO0lBQ0UsQ0FBRTs7SUFFRiw0Q0FBNkM7O21DQUVkOzs7Q0FHbEM7Ozs7Ozt3QkFNdUIsS0FBSzs7OztDQUk1Qjs7Ozs7OzJCQU0wQixJQUFJO2NBQ2pCOzs7Q0FHYjs7Ozs7O3dCQU11QixJQUFJOzZEQUNpQzs7O0NBRzVEOzs7Ozs7dUJBTXNCLElBQUk7S0FDdEI7O0tBRUE7O0tBRUEsd0JBQXdCO2FBQ2hCLGNBQWM7TUFDckI7TUFDQTs7O2dCQUdVOzs7O0NBSWY7O0NBRUE7aUNBQ2dDOztDQUVoQzs7Q0FFQTs7Q0FFQTsrQkFDOEIsV0FBWTtDQUMxQzt5QkFDd0I7OztDQUd4QjtDQUNBOztDQUVBOztDQUVBOztDQUVBOztDQUVBOzs7Q0FHQTswQ0FDeUM7Ozs7O0NBS3pDO2tDQUNpQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CakM7aURBQ2dEOzs7Ozs7Ozs7Q0FTaEQ7O0tBRUkifQ==
;// ./src/components.jsx
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

const [components_CORE,components_COMPONENT,components_TEXT,IS_ZOMBIE,IDX,CHILD_CLASS_ADDENDUM,components_MEMOIZED]=[Symbol.for('LILACT:CORE'),Symbol.for('LILACT:COMPONENT'),Symbol.for('LILACT:TEXT'),Symbol.for('LILACT:IS_ZOMBIE'),Symbol.for('LILACT:IDX'),Symbol.for('LILACT:CHILD_CLASS_ADDENDUM'),Symbol.for('LILACT:MEMOIZED')];



/* 
ComponentCache is for internal use. It is the heart of the JSX runtime,
it holds child components and detects which one is being rendered or updated.
*/

class ComponentCache 
{
	owner;
	current_map = new Map;
	new_map = new Map;
	pick_index = 0;

	constructor(owner)
	{
		this.owner = owner;
	}

	pick(key, construct_func)
	{
		let comp;
		let buck = this.current_map.get(key);

		if(buck && buck.length>buck[IDX]) {
			comp = buck[buck[IDX]];
			buck[IDX]++;

			buck = this.new_map.get(key);
			if(buck!==undefined) {
				buck.push( comp );
			}
			else {
				buck = [ comp ];
				this.new_map.set(key, buck);
				buck[IDX]=0;
			}
		}
		else {
			comp = construct_func();

			buck = this.new_map.get(key);
			if(buck!==undefined) {
				buck.push( comp );
			}
			else {
				buck = [ comp ];
				this.new_map.set(key, buck);
				buck[IDX]=0;
			}

			if(comp[components_CORE]) comp[components_CORE].parent ??= this.owner;
		}

		return comp;
	}

	commit() 
	{
		this.current_map.forEach( (arr)=>{
			arr.slice(arr[IDX]).forEach((ex)=>{
				if(ex.cleanup) ex.cleanup();
			});
		});

		this.current_map = this.new_map; 
		this.new_map = new Map;
	}

}

/** ComponentCore - Mostly for internal use. This is where all the component data and methods
*  used by lilact are kept. The Component class uses it under the hood, so there is a separation
*  and user can set whatever property they want in the component. Each Lilact.Component 
*  has a core that is accessible via lilact symbol CORE, i.e. component[CORE]. Note
*  that you should either define a LILACT:CORE symbol or use the lilact preprocessor
*  tools which is a wiser choice.
* 
*  ComponentCore methods are not to be called by the user. But it can also be used
*  to store data more efficiently, and I have used it extensively. But it is
*  better for the user to work according react paradigms instead if memory
*  efficiency is not a high priority. It is not compatible with React API. So if
*  you want to do so, check the code to prevent accidental shadowing of the methods
*  and properties.
*
*	@class ComponentCore
*/

class ComponentCore
{ 
	/* 

	// these are commented so they are not allocated by default. i just wanted to keep a list.

	entity = undefined

	ref = undefined;

	context = undefined;
	state = undefined;

	container = null;
	outlet = null;

	depo = new ComponentCache;

	element = undefined;
	mount_state

	insert_index
	loader_args

	*/

	component;
	props;

	constructor(comp, props)
	{
		this.component = comp;
		this.props = props || {};
	}

	apply(next_props = this.props, next_state = this.next_state || this.state)
	{
		//let do_rerender = true;

		// if(this.outlet && this.entity[MEMOIZED]) {
		// 	if(shallowEqual(this.props, next_props)) do_rerender=false;
		// 	delete this.entity[MEMOIZED];
		// }

		/*if(do_rerender)*/ {

			if(this.entity?.propTypes) {
				Lilact.PropTypes.checkPropTypes(this.entity.propTypes, this.props, 'prop', this.entity.name);
			}
			else if(this.component?.propTypes) {
				Lilact.PropTypes.checkPropTypes(this.component.propTypes, this.props, 'prop', this.component.name);
			}

			if(typeof(next_state)==='function') next_state = next_state(this.state);

			if(this.component.constructor.defaultProps) {
				next_props = {...this.component.constructor.defaultProps, ...next_props};
			}

			if( this.component.shouldComponentUpdate && 
				!this.component.shouldComponentUpdate
					(next_state, next_props, this.context) ) return;


			if( typeof(this.entity)==='string' ) {
				if(!(this.element instanceof Element)) {
					this.element = document.createElement(this.entity);
					if(next_props?.defaultValue) this.element.value = String(next_props.defaultValue).slice(0, next_props?.maxLength);
					if(next_props?.defaultChecked) this.element.checked = next_props.defaultChecked;
				}
				this.element[components_COMPONENT] = this.component;
			}


			if(next_props.ref) {
				if(this.element) {
					next_props.ref.current = this.element;
				}
				else {
					next_props.ref.current = this.component;
				}
			}

			if(next_props!==undefined && this.component.componentWillReceiveProps) {
				this.component.componentWillReceiveProps(next_props);
			}

			if(this.component.componentWillUpdate) {
				this.component.componentWillUpdate(next_props, next_state);
			}

			const prev_state = this.state, prev_props=this.props;

			if(this.element) {
				this.updateElementProps(next_props);
			}
			this.props = next_props;

			if(typeof this.next_state==='object') {
				if(!this.state) this.state = {...next_state};
				else Object.assign( this.state, next_state );
			}
			else if(this.next_state!==undefined) throw new Error('Component.setState only accepts objects or functions is new state.');


			if(this.next_state) delete this.next_state;


			if(this.hooks!==undefined) {
				this.hook_index = 0;
				Lilact.current_component = [this, Lilact.current_component];

				try {
					this.outlet = this.component.render(next_props);
				}
				catch(e) {
					renderErrorHandler(this, e);
				}

				Lilact.current_component = Lilact.current_component[1];
			}
			else {
				try {
					this.outlet = this.component.render();
				}
				catch(e) {
					renderErrorHandler(this, e);
				}
			}

			if(this.outlet?.constructor?.name!=='Array') {
				this.outlet = [this.outlet];
			}

			this.outlet = [...this.outlet];			

			for (let i=0;i<this.outlet.length;i++) {
				let item = this.outlet[i];			

				if(item===undefined || item===null || typeof(item)==='boolean') {
					this.outlet.splice(i, 1);
					i--;
				}
				else if(typeof item==='function') {
					const res = this.childFunctionHandler(item);
					this.outlet.splice(i, 1, res);
					i--;
				} 
				else if(item.constructor.name === 'Array') {
					this.outlet.splice(i, 1, ...item);
					i--;
				}
				else {
					const core = prepareCore(this, item);
					this.outlet[i] = core;

					if(core[components_TEXT]===undefined) {
						core.container= this.element? this : this.container;
						core.apply(item.props);
					}
					else {
						if(!core.element) {
							core.element = document.createTextNode(item[components_TEXT]);
							core[components_TEXT] = item[components_TEXT];
						}
						else if(core[components_TEXT]!==item[components_TEXT]) {
							core.element.textContent = item[components_TEXT];
							core[components_TEXT] = item[components_TEXT];
						}
					}
				}
			}

			if(this.cache) this.cache.commit();

		}
		if(this.element) this.arrangeOutlet();

		// TODO: should componentDidUpdate be called after arranging/appending the outlet or before?
		if(this.component.componentDidUpdate) {
			this.component.componentDidUpdate(prev_props, prev_state, this.last_snapshot);
		}

		if(this.last_snapshot) delete this.last_snapshot;

	}

	async cleanup()
	{
		try {
			const promises = [];
	
			if(this.component.componentWillUnmount) {
				this.component.componentWillUnmount();
			}

			if(this?.element?.parentElement) {
				this.element.parentElement.removeChild( this.element );
			}

			if(this.outlet!==undefined) {
				for(let c of this.outlet) {
					if(c.cleanup) {
						c.cleanup();
					}
				}
			}

			if(this.props?.children!==undefined) {
				for(let c of this.props.children) {
					if(c.cleanup) {
						c.cleanup();
					}
				}
			}

			if(this.hooks!==undefined) {
				for(let h of this.hooks) {
					if(h.cleanup) {
						h.cleanup();
					}
				}
			}
		}

		catch(e) {
			// todo: should did catch be called? and state be modified?
			/*if(this.component.componentDidCatch) {
				this.component.componentDidCatch(e);
			}
			else */
			throw(e);
		}
	}

	updateElementProps(patch, force=false) 
	{
		if(this.entity==="input") {
			if(!patch?.type) patch.type = 'text';
			if(patch.type!==this.element.type) {
				this.element.type=patch.type;
			}
			
			if(patch?.value!==undefined && patch?.value!==this.element.value) {
				if(patch.value===undefined) patch.value='';
				this.element.value=String(patch.value).slice(0, patch?.maxLength);
			}
		}
		else if(this.entity==="textarea") {
			if(patch?.value!==this.element.value) {
				this.element.value=String(patch.value).slice(0, patch?.maxLength);
			}
		}
		else if(this.entity==="select") {
			if(patch?.value!==this.element.value) {
				Lilact.setTimeout(()=>this.element.value=String(patch.value), 0);
			}
		}

		// old ones that don't exist in the new one
		for(let a in this.props) {
			const al = a.toLowerCase();

			if( !patch.hasOwnProperty(a) ) {

				if( Lilact.events_set.has(al) ) {
					this.event_detachers[al]();
				}
				else {
					this.element.setAttribute(a, undefined);
				}
			}
		}

		for(let a in patch) {
			const al = a.toLowerCase();

			if( Lilact.special_attributes.has(al) ) continue;

			if( patch===this.props || !Lilact.defaultIsEqual(patch[a], this.props[a]) || force  ) {

				if( Lilact.events_set.has(al) ) {
					this.event_detachers ??= {};
					this.event_detachers[al]?.();
					this.event_detachers[al] = Lilact.addWrappedEventListener(this.element, al.substring(2), patch[a]);
				}
				else if(al==='style') {
					for(const x in patch[a]) {
						if(isFinite(patch[a][x])) patch[a][x]+='px';
					}
					Object.assign(this.element.style, patch[a]);
				}
				else if(Lilact.boolean_html_attributes_set.has(a)) { // not lower cased(al), as it is set as a js property
					this.element[a] = Lilact.toBool(patch[a]);
				}
				else if(a==='autoFocus') { // not lower cased(al), as it is set as a js property
					this.element['autofocus'] = Lilact.toBool(patch[a]);
				}
				else if(a==='htmlFor') { // not lower cased(al), as it is set as a js property
					this.element.setAttribute('for', patch[a]);
				}
				else {
					if(al!=='value' || ['input', 'textarea', 'select'].indexOf(this.entity)===-1) {
						this.element.setAttribute(al, patch[a]);
					}
				}
			}
		}


		if(patch?.action) {
			this.element.onsubmit = patch.action;
		}
		else {
			this.element.onsubmit = undefined;
		}

		//this.element.setAttribute('key', this.props.key);

		this.updateElementClass(patch);
	}

	updateElementClass(patch=this.props) 
	{
		let cn = patch?.className;
		cn ??= patch?.class ? patch.class : '';

		if(this?.parent?.[CHILD_CLASS_ADDENDUM]) {
			cn += ' ' + this?.parent?.[CHILD_CLASS_ADDENDUM];
		}
		
		if(cn.length>0) {
			cn = cn.split(/\s+/g);
			for(const n of Array.from(this.element.classList)) {
				if(cn.indexOf(n)===-1) {
					this.element.classList.remove(n);
				}
			}
			for(const n of cn) {
				if(n.length>0) {
					this.element.classList.add(n);
				}
			}
		}
		else {
			delete this.element.className;
		}
	}


	scanZombies(container, next_element) 
	{
		const chs = container.element.childNodes;
		while( 	chs[container.insert_index] && 
				chs[container.insert_index][IS_ZOMBIE] && 
				chs[container.insert_index]!==next_element ) 
		{
			container.insert_index++;
		}
	}

	appendElement(core)
	{
		this.scanZombies(core.container, core.element);

		if(core?.element.parentNode===null) {
			core.container.element.insertBefore(
						core.element, 
						core.container.element.childNodes[core.container.insert_index] || null 
					);			

			if(core?.component?.componentDidMount) {
				core.component.componentDidMount();
			}

		}
		else {
			if(core.container.element.childNodes[core.container.insert_index]!==core.element) {
				core.container.element.insertBefore(
						core.element, 
						core.container.element.childNodes[core.container.insert_index] || null
					);						
			}
		}
		core.container.insert_index++;
	}
	
	arrangeOutlet()
	{
		this.insert_index = 0;
		
		for(const core of this.outlet) {
			if(core) {
				if(core.element) {
					core.container = this.element?this:this.container;
					core.container.appendElement(core);
				}
				else {
					if(core.arrangeOutlet) core.arrangeOutlet();

					// todo: is there a way to remove this useless flag?
					if(!core?.mounted) {
						core.mounted = true;
						if(core?.component?.componentDidMount) {
							core.component.componentDidMount();
						}

					}

				}
			}
		}

	}

	// note: override this to tailor function children like <Transition>{(state)=>{...}}</Transition>
	childFunctionHandler(func) {
		return func(this.state); 
	}

}



const renderErrorHandler = (c, e) =>
{
	const stack = [c];
	while(c && !c.component?.componentDidCatch) {
		c = c.parent;
		if(c) stack.push(c);
	}
	if(c?.component?.componentDidCatch) {
		if(c.entity?.getDerivedStateFromError) {
			c.component.setState(c.entity.getDerivedStateFromError.call(c, e));
		}
	}

	let stack_log = Array.prototype
			          .map.call(stack, x => (`in  ${typeof(x.component.displayName)==='function'?
			          									x.component.displayName():x.component.displayName}` ) ) 
			          .join('\n');

	e.componentStack = stack;
	e.componentStackLog = stack_log;

	if(c?.component?.componentDidCatch) {
		c.component.componentDidCatch(e, {componentStack: stack, componentStackLog: stack_log});  
	}
	else throw(e);

}


//////////



function constructFunc(core, parent) // returns {text} or component, and not component core.
{
	let comp = core;

	if( core[components_TEXT]!==undefined ) {
		// do nothing...
	}
	else {
		if(typeof(core.entity)==='string') {
			comp = new HTMLComponent(core.entity, core.props);
		}
		else {

			if( Lilact.isClass(core.entity) ) {
				if(core.entity?.defaultProps) {
					core.props = { ...core.entity.defaultProps, ...core.props };
				}

				comp = new core.entity(core.props);

				const desc = Object.getOwnPropertyDescriptor(comp, "state");
				if(desc) {
					if (typeof desc.get !== "function" && typeof desc.set !== "function") {
						comp[components_CORE].state = comp.state;

						Object.defineProperty(comp, "state", {
							get() { return this[components_CORE].state },
							set(v) { 
								// todo: this should be changed, it should be only directly settable in constructor.
								if(this[components_CORE].state===undefined) {
									this[components_CORE].state = v;
								}
								else {
									throw new Error('Assigning component state this way is not allowed.');
								}
							}
						});
					}
				}
			}
			else if(typeof(core.entity)==='function') {

				if(core.entity?.defaultProps) {
					core.props = { ...core.entity.defaultProps, ...core.props };
				}

				comp = new Component(core.props);

				// the binding is not necessary and is not according to the specs, 
				// probably not even recommended! but helpful.
				comp.render = core.entity.bind(comp); 
				comp[components_CORE].hooks = [];
				comp[components_CORE].hook_index = 0;
			}
			else {
				throw new Error("Invalid entity for createComponent.");
			}

			comp[components_CORE].entity = core.entity;

			if(core.container) {
				comp[components_CORE].container = core.container;
			}
		}

	}

	if(parent instanceof ComponentCore) comp[components_CORE].parent = parent;

	return comp;
}


function prepareCore(parent, core)
{
	try {
		parent.cache ??= new ComponentCache(parent);
		core =  parent.cache.pick( 	core[components_TEXT]===undefined?core?.props?.key:':text:', 
									()=>(  (core[components_TEXT]!==undefined || core instanceof ComponentCore) ?   
											 core : constructFunc(core, parent)[components_CORE]  ) 
								);
		return core;
	}
	catch(e) {
		if(core?.component?.componentDidCatch) {
			core.component.componentDidCatch(e);
		}
		else throw(e);
	}
}


function doUpdates()
{
	requestAnimationFrame(()=>{
		let layout_effects = Lilact.layout_effects;
		let update_cbs = Lilact.update_cbs;
		let update_set = Lilact.update_set;

		Lilact.layout_effects = new Set;
		Lilact.update_cbs = new Set;
		Lilact.update_set = new Set;

		for(const le of layout_effects) le();

		for(const u of update_set)  u.apply();
		for(const cb of update_cbs) cb();

	});
}


function decode(html) 
{
	decode.parser ??= new DOMParser;
	return decode.parser.parseFromString(html, 'text/html').body.textContent;
}


function escapeHtml(str) {  
	escapeHtml.div ??= document.createElement('div');  
	div.textContent = String(str);  
	return div.innerHTML;
}

const generateComponentKey = (entity, props)=> {
	let key;

	if(props.key!==undefined) {
		key = /*':k:'+*/ props.key;
	}
	else if(props.id!==undefined) {
		key = ':i:'+props.id;
	}
	else if(props.path!==undefined) {
		key = ':p:'+props.path;
	}
	else if(props[components_TEXT]!==undefined) {
		key = ':text:';
	}
	else {

		if(typeof(entity)==='string') { 
			key = ':t:'+entity;
		}
		else if(entity?.name) {
			key = entity.name;
		}
		else {
			key = "::";
		}

		if(props.name!==undefined) {
			key = key+":"+props.name;
		}
		else if(props.path!==undefined) {
			key = key+":"+props.path;
		}
		// else if(props.className!==undefined) {
		// 	key = key+"."+props.className;
		// }
	}

	return key;
}




// API



/**
* @class
* Base class that mimics `React.Component` (stateful component with lifecycle hooks).
* Extend this class to implement `render()` and (optionally) override lifecycle methods.
* 
* This user functions and members are supported:
*
*	static defaultProps
*
*	render() {}
*
*	componentWillReceiveProps (nextProps)
*	componentWillUpdate (nextProps, nextState)
*	componentDidCatch (error, info) 	
*	componentDidMount () 			
*	componentDidUpdate (prevProps, prevState, lastSnapshot) 
*	componentWillUnmount () 
*	getSnapshotBeforeUpdate (prevProps, prevState) 
*	shouldComponentUpdate (nextProps, nextState) 
*
*	static getDerivedStateFromError (error) {}
*	static getDerivedStateFromProps (props, state) {}
* 
* For more details see official React documentation.
*/
class Component
{

	/**
	* Component state used to drive rendering.
	* Update it with `setState()` to trigger a re-render.
	* @type {object}
	*/
	get state() { return this[components_CORE].state }
	set state(v) { 
		// todo: this should be changed, it should be only directly settable in constructor.
		if(this[components_CORE].state===undefined) {
			this[components_CORE].state = v;
		}
		else {
			throw new Error('Assigning component state this way is not allowed.');
		}
	}
		
	/**
	* Component context.
	* @type {any}
	* @protected
	*/
	get context() { return this[components_CORE].context }
	set context(v) { throw new Error('Assigning component context this way is not allowed.') }

	/**
	* Component context value.
	* Use it to access shared data provided by an outer component/system.
	* @type {any}
	*/
	get type() { return this[components_CORE].entity }
	set type(v) { throw new Error('Component type is immutable.') }

	/**
	* Props passed into the component instance.
	* Use it as read-only input when rendering.
	* @type {any}
	*/
	get props() { return this[components_CORE].props }
	set props(v) { throw new Error('Assigning component props this way is not allowed.') }

	/**
	* A reference associated with the component to be used with useRef.
	* Can be used to expose the component instance or an underlying DOM node.
	* @type {any}
	*/
	get ref() { return this[components_CORE].ref }
	set ref(v) { throw new Error('Component ref is immutable.') }

	/**
	* A unique identifier for the component instance. 
	* The key is immutable and can only be set when the component is declared.
	* @type {string|number}
	*/
	get key() { return this[components_CORE].props.key }
	set key(v) { throw new Error('Component key is immutable.') }


	/**
	* The displayed name for the component. It is overridable.
	* It can also be set for function components.
	* @type {string}
	*/
	displayName()
	{
		if(this[components_CORE].entity?.displayName) return this[components_CORE].entity?.displayName;
		if(typeof(this[components_CORE].entity)==='string') return this[components_CORE].entity;
		if( Lilact.isClass(this[components_CORE].entity) ) this[components_CORE].entity.constructor.name;
		if( typeof(this[components_CORE].entity)==='function' ) return this[components_CORE].entity.name;
		return "Component";
	}

	constructor(props)
	{
		this[components_CORE] = new ComponentCore(this, props);
	}

	/**
	* Force the component to re-render even if no state/props change.
	* Useful for imperative updates.
	* @returns {void}
	*/
	forceUpdate(callback)
	{
		Lilact.clearTimeout(Lilact.update_timeout);

		Lilact.update_set.add(this[components_CORE].container || this[components_CORE]);
		if(callback) Lilact.update_cbs.add(callback.bind(this));
		Lilact.update_timeout = Lilact.setTimeout( doUpdates,  Lilact.update_interval_margin );
	}

	/**
	* Update component state.
	* Accepts a partial state (or a function returning partial state) and schedules a re-render.
	* @param {any} new state
	* @param {any} callback to called after updates.
	* @returns {void}
	*/
	setState(next_state, callback)
	{
		if(this.getSnapshotBeforeUpdate!==undefined) {
			this[components_CORE].last_snapshot = this.getSnapshotBeforeUpdate(this[components_CORE].props, this.state);
		}

		this[components_CORE].next_state = next_state;
		this.forceUpdate(callback?callback.bind(this):undefined);
	}

	/* User Functions
	
	static defaultProps

	render							 () {}

	componentWillReceiveProps		 (next_props)
	componentWillUpdate				 (next_props, next_state)
	componentDidCatch				 (error, info) 	{}
	componentDidMount				 () 			{}
	componentDidUpdate				 (prevProps, prevState, last_snapshot) {}
	componentWillUnmount			 () {}
	getSnapshotBeforeUpdate			 (prevProps, prevState) {}
	shouldComponentUpdate			 (nextProps, nextState) {}

	static getDerivedStateFromError	 (error) {}
	static getDerivedStateFromProps	 (props, state) {}


	*/	
	/* // todo: maybe 
	static get contextType() {  }
	static set contextType(ctxt) {  } 

	static get childContextTypes()  {}
	static set childContextTypes(ctxt) {  } 

	getChildContext()
	*/
}

/**
 * @class HTMLComponent
 * @extends Component
 *
 * Lightweight React-like component that creates and manages a single HTML element.
 * It renders an HTML element of the given tag/type (`entity`) and applies the provided `props`.
 *
 * @example
 * <div {...props}>...</div>
 * or
 * const el = new HTMLComponent('div', { className: 'box' });
 *
 * @param {string} entity - The HTML tag/type to create (e.g., 'div', 'span', 'button').
 * @param {Object} props - Props to apply to the created element.
 */

class HTMLComponent extends Component 
{
	constructor(entity, props)
	{
		super(props);
		this[components_CORE].entity = entity;
	}

	render()
	{	
		return this[components_CORE].props.children;
	}
}


/**
 * @class RootComponent
 * @extends HTMLComponent
 *
 * Root-level component that receives a pre-existing root HTML element and builds/receives its children using `props`.
 * It uses `props.children` (and related conventions) as the primary input for what to render inside the root.
 *
 * @example
 * // Accept an element reference
 * const root = document.getElementById('app')
 * const app = new RootComponent(root, { children: [...] })
 *
 * // Or accept a selector string
 * const app2 = new RootComponent('#app', { children: [...] })
 *
 * @param {HTMLElement|string} rootElement - Root HTML element (or a selector string resolved via `document.querySelector`).
 * @param {Object} props - Root props used to configure how children are provided and attached (typically includes `props.children`).
 *
 * @property {HTMLElement|string} rootElement - The root element reference (or tag/type/selector depending on how you pass it in).
 * @property {Object} props - Root props used to build/receive children.
 */

class RootComponent extends HTMLComponent 
{
	displayName = "Root";

	constructor(element, props)
	{
		super(':root', props);

		if(typeof this.element==='string') {
			element = document.querySelector(element);
		}

		this[components_CORE].element = element;

		for(const ch of props.children) {
			if(ch[components_CORE]) ch[components_CORE].container = this[components_CORE];
			else ch.container = this[components_CORE];
		}
	}
}


/**
 * Creates an HTML/React-like component instance.
 * This is what the JSX transpiler uses internally for `<Component>...</Component>`-style expressions.
 * It is also aliased to `createElement` for compatibility with the React API.
 *
 * @param {string} entity - The HTML tag/type to create (e.g., 'div', 'span', 'button').
 * @param {Object} [props={}] - Props/attributes to apply to the created element.
 * @param {...any} children - Child nodes or values to attach (e.g., strings, HTMLElements, component instances, or arrays).
 *
 * @returns {HTMLComponent} The created component instance.
 */

function components_createComponent(entity, props={}, ...children)
{
	if(entity!==undefined && typeof(entity)!=='string' && typeof(entity)!=='function') {
		throw new Error("Invalid entity for createComponent.");		
	}

	for(let i=0; i<children.length; i++) {
		let ch = children[i];

		if(ch===undefined || ch===null || typeof(ch)==='boolean') {
			children.splice(i, 1);
			i--;
			continue;
		}

		if( ["number", "bigint"].indexOf(typeof(ch))!==-1 ) {
			ch = ch.toString();
		}

		if( typeof(ch)==='string' ) {
			children[i] = { [components_TEXT]: ch };
		}
		else {
			children[i] = ch;
		}
	}

	//if(entity===null) return children; // <> style fragment

	props.key = generateComponentKey(entity, props);
	props.children = children;

	return { entity, props };
}

/**
 * Creates a root controller bound to a specific DOM element.
 * The returned object manages mounting/updating and removal of component trees.
 *
 * @param {HTMLElement|string} element
 *   Root HTML element to use. If a string is provided, it is resolved via `document.querySelector`.
 *
 * @returns {Object} Root controller.
 * @returns {Object.render} controller.render(component)
 *   Mounts (or updates) the provided component into the root element.
 * @returns {Object.unmount} controller.unmount()
 *   Removes/unmounts the currently rendered component tree from the root element.
 */

function createRoot(element)
{
	let root;

	return {
		render(component) {
			if(!root) {
				root = new RootComponent( element, {children:[component]} );
				Lilact.roots.add(root[components_CORE]);
				root.forceUpdate();
				return root;
			}
			else {
				throw new Error("root already rendered!");
			}
		},

		unmount() {
			if(root) {
				root.cleanup();
				element.innerHTML="";
			}
		}
	}
}

/**
 * Renders a component into a target DOM element.
 * If the component maintains internal state, this typically mounts it (or updates the existing tree) under `element`.
 *
 * @param {Object} component - Component instance to render.
 * @param {HTMLElement|string} element
 *   Target element to render into. If a string is provided, it is resolved via `document.querySelector`.
 *
 * @returns {void}
 */

function render(component, element)
{
	if(component[components_CORE] && (component[components_CORE].container || component[components_CORE].parent)) {
		throw new Error("Component is already in use");
	}
	return createRoot(element).render(component);
}

/** @ignore */
const createElement = components_createComponent;

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9jb21wb25lbnRzLmpzeCIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hcmFzaC9EZXNrdG9wL1Byb2plY3RzL0xpbGFjdC9zcmMvY29tcG9uZW50cy5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOEJDOztRQUVPOztDQUVQOzs7Ozs7Q0FNQTs7Ozs7O2FBTVk7RUFDWDs7OztNQUlJO0VBQ0o7O2tDQUVnQzs7S0FFN0IsZ0NBQWdDOzs7OzJCQUlWO01BQ3JCLG1CQUFtQjtjQUNYOztTQUVMOztxQkFFWTs7OztRQUliO3lCQUNpQjs7MkJBRUU7TUFDckIsbUJBQW1CO2NBQ1g7O1NBRUw7O3FCQUVZOzs7O01BSWY7Ozs7OztRQU1FO0VBQ047MkJBQ3lCLENBQUUsT0FBTztZQUN2QixrQkFBbUIsQUFBRCxNQUFPO0tBQy9CLHVCQUF1Qjs7Ozs7Ozs7OztDQVU3Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBa0JBO0VBQ0M7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzthQTJCVztFQUNYOzt5QkFFdUI7OztPQUdsQjtFQUNMO0dBQ0M7O0dBRUE7R0FDQTtHQUNBO0dBQ0E7O0dBRUEsb0JBQW9COztNQUdqQix5QkFBeUI7b0NBQ0s7O1dBRXpCLDRCQUE0QjtvQ0FDSDs7O01BSTlCLE1BQU8sbURBQWtEOztNQUV6RCwwQ0FBMEM7a0JBQzlCOzs7TUFHWjs7S0FFQTs7O01BR0EsT0FBUSw0QkFBMkI7T0FDbEMsQ0FBRSxvQ0FBbUM7MkNBQ0Q7UUFDbkMsc0RBQXNELCtCQUErQjtRQUNyRjs7Ozs7O01BTUYsaUJBQWlCO09BQ2hCLGVBQWU7OztVQUdaOzs7OztNQUtKLHFFQUFxRTs2Q0FDOUI7OztNQUd2QyxxQ0FBcUM7dUNBQ0o7Ozs7O01BS2pDLGVBQWU7NEJBQ087Ozs7TUFJdEIsb0NBQW9DO09BQ25DLDJCQUEyQjt1QkFDWDs7V0FFWiw2Q0FBNkM7OztNQUdsRDs7O01BR0EseUJBQXlCOzs7O1NBSXRCO3lDQUNnQzs7VUFFL0IsSUFBSTt3QkFDVTs7Ozs7U0FLZjtTQUNBO3lDQUNnQzs7VUFFL0IsSUFBSTt3QkFDVTs7OztNQUlsQiwyQ0FBMkM7Ozs7OztRQU16QyxtQ0FBbUM7OztPQUdwQyx5Q0FBMEMscUJBQW9CO3dCQUM3Qzs7O1lBR1osMkJBQTJCOzJDQUNJO3dCQUNuQjs7O1lBR1osb0NBQW9DO3dCQUN4Qjs7O1VBR2Q7OEJBQ29COzs7UUFHdEIseUJBQXlCOztpQkFFaEI7O1dBRU47U0FDRixnQkFBZ0I7OENBQ3FCOzs7Y0FHaEMsMEJBQTBCOzs7Ozs7OztNQVFsQyw4QkFBOEI7OztLQUcvQixpQ0FBaUM7O0dBRW5DO0tBQ0Usb0NBQW9DO3FDQUNKOzs7S0FHaEM7Ozs7ZUFJVTtFQUNiO09BQ0s7OztNQUdELHNDQUFzQzt3Q0FDSjs7O01BR2xDLCtCQUErQjsyQ0FDTTs7O01BR3JDLDBCQUEwQjtRQUN4Qix1QkFBdUI7UUFDdkIsWUFBWTtnQkFDSjs7Ozs7TUFLVixtQ0FBbUM7UUFDakMsK0JBQStCO1FBQy9CLFlBQVk7Z0JBQ0o7Ozs7O01BS1YseUJBQXlCO1FBQ3ZCLHNCQUFzQjtRQUN0QixZQUFZO2dCQUNKOzs7Ozs7UUFNUixJQUFJO0lBQ1I7SUFDQTs7OztTQUlLOzs7O29CQUlXO0VBQ2xCO0tBQ0csd0JBQXdCO01BQ3ZCO01BQ0EsaUNBQWlDOzs7O01BSWpDLGdFQUFnRTtPQUMvRDs4QkFDdUIsbUJBQW1COzs7VUFHdkMsMkJBQTJCO01BQy9CLG9DQUFvQzs4QkFDWixtQkFBbUI7OztVQUd2Qyx5QkFBeUI7TUFDN0Isb0NBQW9DO3NCQUNuQixBQUFELDZCQUE4Qjs7OztHQUlqRDtNQUNHLHNCQUFzQjs0QkFDQTs7TUFFdEIsc0JBQXVCLE9BQU07O09BRTVCLHNCQUF1QixRQUFPOzhCQUNQOztVQUVwQjsrQkFDcUI7Ozs7O01BS3pCLGlCQUFpQjs0QkFDSzs7TUFFdEIsOEJBQStCOztNQUUvQiw2Q0FBOEMsdUNBQXNDOztPQUVuRixzQkFBdUIsUUFBTzsrQkFDTjtnQ0FDQzsrREFDK0IsMEJBQTJCOztZQUU5RSxlQUFlO1NBQ2xCLHNCQUFzQjtTQUN0QixRQUFTOzttQkFFQzs7WUFFUCxzQ0FBdUMsTUFBSyxFQUFFO3FDQUNyQjs7WUFFekIsa0JBQWtCLEVBQUU7K0NBQ2U7O1lBRW5DLGdCQUFnQixFQUFFOytCQUNDOztVQUVyQjtRQUNGLHVEQUF3RCxxQkFBb0I7Z0NBQ3BEOzs7Ozs7O0tBTzNCLGdCQUFnQjs7O1FBR2I7Ozs7R0FLTDs7MEJBR3VCOzs7b0JBR047RUFDbEI7Ozs7S0FJRyx1Q0FBdUM7Ozs7S0FJdkMsY0FBYztpQkFDRCxBQUFEO09BQ1YscUJBQXNCLDJCQUEwQjtPQUNoRCxVQUFXLFdBQVU7bUNBQ087OztPQUc1QixnQkFBZ0I7T0FDaEIsYUFBYTtnQ0FDWTs7OztRQUl4Qjs7Ozs7O2FBTUs7RUFDWDs7UUFFTTs7O0dBR0w7Ozs7O2VBS1k7RUFDYjttQkFDaUI7O0tBRWQsa0NBQWtDO3VDQUNBOzs7OztNQUtqQyxxQ0FBcUM7cUNBQ047Ozs7UUFJN0I7TUFDRixnRkFBZ0Y7d0NBQzlDOzs7Ozs7Ozs7ZUFTekI7RUFDYjs7O01BR0ksNEJBQTRCO01BQzVCLE9BQU87T0FDTixlQUFlOztrQ0FFWTs7VUFFeEI7UUFDRix1Q0FBdUM7O01BRXpDO1FBQ0UsaUJBQWlCOztTQUVoQixxQ0FBcUM7d0NBQ047Ozs7Ozs7Ozs7O0VBV3RDO3NCQUNvQixPQUFPO2NBQ2Y7Ozs7Ozs7NEJBT2M7Q0FDM0I7O09BRU0sdUNBQXVDOztLQUV6QyxjQUFjOztJQUVmLGtDQUFrQztLQUNqQyxxQ0FBcUM7d0JBQ2xCLHNDQUF1Qzs7Ozs7dUJBS3hDLFlBQWE7O21CQUVqQjs7Ozs7SUFLZixrQ0FBa0M7Z0NBQ04sR0FBSTs7WUFFeEI7Ozs7O0NBS1g7Ozs7dUJBSXNCLGVBQWU7Q0FDckM7OztJQUdHLDJCQUEyQjtHQUM1Qjs7T0FFSTtLQUNGLE1BQU8sMkJBQTBCOzRCQUNWOztRQUVwQjs7TUFFRixlQUFnQixpQkFBZ0I7T0FDL0IsNEJBQTRCO21CQUNoQjs7OzJCQUdROztpREFFc0I7T0FDMUMsT0FBTztTQUNMLG1FQUFtRTs7OzRCQUdoRCxlQUFnQjtVQUNqQyxHQUFHO1VBQ0gsSUFBSTtRQUNOO1VBQ0UsK0JBQStCOzs7YUFHNUI7d0JBQ1c7Ozs7Ozs7V0FPZCxNQUFPLDZCQUE0Qjs7T0FFdkMsNEJBQTRCO21CQUNoQjs7O3lCQUdNOztLQUVwQjtLQUNBO21DQUM4Qjs7OztTQUkxQjtvQkFDVzs7Ozs7TUFLZCxpQkFBaUI7Ozs7Ozs7SUFPbkI7Ozs7OztxQkFNaUI7Q0FDcEI7TUFDSztzQ0FDZ0M7NEJBQ1Y7U0FDbEIsSUFBSSxFQUFHOytCQUNnQjs7OztPQUkxQixJQUFJO0tBQ04scUNBQXFDO29DQUNOOzthQUV2Qjs7Ozs7bUJBS007Q0FDbEI7dUJBQ3VCLEFBQUQsSUFBSzs7Ozs7Ozs7O0tBU3RCLCtCQUErQjs7S0FFL0IsZ0NBQWdDO0tBQ2hDLDJCQUEyQjs7Ozs7O2dCQU1qQjtDQUNmOztzQ0FFcUM7Ozs7b0JBSWxCLE1BQU07MkNBQ2lCOzBCQUNqQjs7Ozs4QkFJSSxrQkFBa0I7OztJQUc1Qyx3QkFBd0I7U0FDbkI7O1NBRUEsdUJBQXVCOzs7U0FHdkIseUJBQXlCOzs7U0FHekIsMEJBQTBCOzs7T0FHNUI7O0tBRUYsTUFBTyxzQkFBcUI7OztVQUd2QixlQUFlOzs7UUFHakI7Ozs7S0FJSCx5QkFBeUI7OztVQUdwQix5QkFBeUI7OztHQUdoQztHQUNBO0dBQ0E7Ozs7Ozs7OztDQVNGOzs7O0NBSUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMEJBOztFQUVDOzs7OztXQUtTLEdBQUc7V0FDSCxJQUFJO0dBQ1o7S0FDRSwrQkFBK0I7OztRQUc1QjttQkFDVzs7OztFQUlqQjs7Ozs7YUFLVyxHQUFHO2FBQ0gsSUFBSSxpQkFBaUI7O0VBRWhDOzs7OztVQUtRLEdBQUc7VUFDSCxJQUFJLGlCQUFpQjs7RUFFN0I7Ozs7O1dBS1MsR0FBRztXQUNILElBQUksaUJBQWlCOztFQUU5Qjs7Ozs7U0FLTyxHQUFHO1NBQ0gsSUFBSSxpQkFBaUI7O0VBRTVCOzs7OztTQUtPLEdBQUc7U0FDSCxJQUFJLGlCQUFpQjs7O0VBRzVCOzs7OzthQUtXO0VBQ1g7S0FDRztLQUNBLE1BQU87S0FDUCxlQUFnQjtLQUNoQixPQUFROzs7O2FBSUE7RUFDWDtpQ0FDK0I7OztFQUcvQjs7Ozs7YUFLVztFQUNYO3NCQUNvQjs7d0JBRUU7S0FDbkIsZ0NBQWdDLGFBQWM7NENBQ1A7OztFQUcxQzs7Ozs7OztVQU9RO0VBQ1I7S0FDRywyQ0FBMkM7MkRBQ1c7Ozs7bUJBSXhDLHNCQUF1Qjs7O0VBR3hDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQW9CQTs7Ozs7Ozs7Ozs7Q0FXRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQkE7YUFDWTtFQUNYO1FBQ007Ozs7UUFJQTtFQUNOOzs7Ozs7Q0FNRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F1QkE7OzthQUdZO0VBQ1g7UUFDTTs7S0FFSCxpQ0FBaUM7b0NBQ0Y7Ozs7O01BSzlCLDZCQUE2QjtNQUM3Qjs7Ozs7OztDQU9MOzs7Ozs7Ozs7Ozs7Z0NBWStCLGNBQWU7Q0FDOUM7SUFDRyw0QkFBNkIsNkJBQTZCLHdCQUF1QjtrQkFDbkU7OztLQUdiLGtDQUFrQzs7O0tBR2xDLHFDQUFzQyxtQkFBa0I7bUJBQzFDOzs7OztLQUtkLDZCQUE4QixNQUFPLGVBQWE7b0JBQ25DOzs7S0FHZixPQUFRLG1CQUFrQjtrQkFDYjs7UUFFVjs7Ozs7RUFLTjs7a0NBRWdDOzs7U0FHekI7OztDQUdSOzs7Ozs7Ozs7Ozs7OzsyQkFjMEI7Q0FDMUI7OztTQUdRO1NBQ0EsWUFBWTtNQUNmLFFBQVE7NkJBQ2UsVUFBVztxQkFDbkI7cUJBQ0E7OztTQUdaO29CQUNXOzs7O1VBSVYsR0FBRztNQUNQLE9BQU87aUJBQ0k7Ozs7Ozs7Q0FPaEI7Ozs7Ozs7Ozs7O3VCQVdzQjtDQUN0QjtJQUNHLG1CQUFvQix3REFBdUQ7a0JBQzdEOzttQkFFQyxnQkFBZ0I7OztDQUdsQyJ9
;// ./src/hooks.jsx
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

const [hooks_CORE,hooks_COMPONENT]=[Symbol.for('LILACT:CORE'),Symbol.for('LILACT:COMPONENT')];


/**
 * Hook wrapper/primitive used to implement custom hooks.
 * Can be used by the user, but not encouraged. Only use after you
 * study how Lilact itself uses it.
 *
 * @returns {hook} Hook result.
 */
function useHook()
{
	const core = Lilact.current_component[0];
	
	if(core.hooks[core.hook_index]===undefined) {
		core.hooks.push({});
	}

	return core.hooks[core.hook_index++];
}

/**
 * Adds state to a component using a [value, setter] pattern.
 *
 * @param {any} initialValue - Initial state value.
 * @returns {any} Hook result `[state, setState]`.
 */
function useState(val)
{
	const hk = Lilact.useHook();

	if( Lilact.isEmpty(hk) ) {
		if(typeof(val)==='function') hk.value = val();
		else hk.value = val;
		
		hk.set_func = function(core, hk, val) {
			if(typeof(val)==='function') hk.value = val(hk.value);
			else hk.value = val;

			core.component.forceUpdate();
		}.bind(undefined, Lilact.current_component[0], hk);

	}

	return [hk.value, hk.set_func];
}

/**
 * Returns a memoized callback function whose identity stays stable until dependencies change.
 *
 * @param {Function} callback - Function to memoize.
 * @param {Array<any>} deps - Dependency list.
 * @returns {Function} Memoized callback.
 */
function useCallback(callback, deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' || deps.constructor.name!=='Array') ) {
		throw new Error("Callback dependencies must be an array or omitted.");
	}

	const hk = Lilact.useHook();

	if( Lilact.isEmpty(hk) ) {
		hk.callback = callback;
	}
	else {
		if(deps!==undefined && hk?.deps!==undefined && Lilact.shallowEqual(deps, hk.deps)) return hk.callback;
	}

	if(hk?.cleanup) {
		hk.cleanup();
	}

	hk.deps = deps;

	return hk.callback;
}

/**
 * Creates a context object for sharing a value through the component tree.
 *
 * @param {any} [defaultValue] - Initial context value when no Provider is present.
 * @returns {any} A context object
 */
function createContext(val)
{
	const prov = function({value, children}) {
		return children;
	};

	return {
		default: val,
		Provider: prov
	}
}

/**
 * Reads the current value from a context.
 *
 * @param {any} context - Context object created by `createContext`.
 * @returns {any} Current context value.
 */
function useContext(ctx)
{
	let core = Lilact.current_component[0].parent;

	while(core.entity!==ctx.Provider && core.parent) {
		core = core.parent;
	}

	if(core.parent) {
		let v = core.props?.value;
		return v??=ctx.default;
	}

	return ctx.default;
}

/**
 * Returns a stable, unique ID that is consistent across renders.
 *
 * @param {string} [prefix] - Optional id prefix.
 * @returns {string} Stable unique id.
 */
function useId(prefix="N")
{
	const hk = Lilact.useHook();

	if( Lilact.isEmpty(hk) ) {
		hk.id = prefix+Lilact.id_num++;
	}

	return hk.id;
}

/**
 * Starts a transition and returns helpers for pending updates vs immediate ones.
 *
 * @returns {any} `[isPending, startTransition]`
 */
function useTransition()
{
	const hk = Lilact.useHook();

	if( Lilact.isEmpty(hk) ) {
		hk.count=0;

		hk.func =

		(async function(core, hk, fn) {

			hk.count++;

			if(hk.count===1) {
				core.component.forceUpdate();
			}

			await fn();

			hk.count--;

			if(hk.count===0) {
				core.component.forceUpdate();
			}
		}

		).bind(undefined, Lilact.current_component[0], hk);
	}

	return [ hk.count!=0, hk.func ];
}

/**
 * Persists state in localStorage and keeps it in sync with the app.
 *
 * @param {string} key - localStorage key.
 * @param {any} initialValue - Initial value used if nothing exists in localStorage.
 * @returns {any} Stored state/result.
 */
function useLocalStorage(key, initialValue)
{

	const hk = Lilact.useHook();
	let val;

	try {
		val = JSON.parse(localStorage[key]);
	}
	catch(e) {
	}

	if(val===undefined) {
		if(typeof(initialValue)==='function') initialValue = initialValue();
		val = initialValue;
		localStorage[key] = JSON.stringify(val);
	}

	if( Lilact.isEmpty(hk) ) {
		hk.value = val;
		hk.set_func = function(core, hk, val) {

			if(typeof(val)==='function') val = val(hk.value);

			if(val===hk.value) return;

			localStorage[key] = JSON.stringify(val);

			hk.value = val;
			core.component.forceUpdate();

		}.bind(undefined, Lilact.current_component[0], hk);
	}

	return [hk.value, hk.set_func];
}

/**
 * Creates a mutable ref object with a stable identity across renders.
 * The `.current` property holds the latest value.
 *
 * @param {any} initialValue - Initial ref value.
 * @returns {Object} Ref object with `.current`.
 */
function useRef(initialValue = null)
{
	const hk = Lilact.useHook();

	if( Lilact.isEmpty(hk) ) {
		hk.current = initialValue;
	}

	return hk;
}

/**
 * Runs an effect synchronously after all DOM mutations but before the browser paints.
 *
 * @param {Function} effect - Effect callback.
 * @param {Array<any>} [deps] - Dependency list.
 * @returns {void}
 */
function useLayoutEffect(effect, deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' || deps.constructor.name!=='Array') ) {
		throw new Error("Layout effect dependencies must be an array or omitted.");
	}

	const hk = Lilact.useHook();

	if( !Lilact.isEmpty(hk) ) {
		if(deps!==undefined && hk?.deps!==undefined && Lilact.shallowEqual(deps, hk.deps)) return;
	}

	if(hk?.cleanup) {
		hk.cleanup();
	}

	hk.deps = deps;
	Lilact.layout_effects.add( ()=>{ hk.cleanup = effect(); });
	Lilact.current_component[0].component.forceUpdate();
}

/**
 * Runs a side effect after render commits.
 *
 * @param {Function} effect - Effect callback.
 * @param {Array<any>} [deps] - Dependency list.
 * @returns {void}
 */
function useEffect(effect, deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' || deps.constructor.name!=='Array') ) {
		throw new Error("Effect dependencies must be an array or omitted.");
	}

	const hk = Lilact.useHook();

	if( !Lilact.isEmpty(hk) ) {
		if(deps!==undefined && hk?.deps!==undefined && Lilact.shallowEqual(deps, hk.deps)) return;
	}

	if(hk?.cleanup) {
		hk.cleanup();
	}

	hk.deps = deps;
	Lilact.setTimeout( ()=>{ hk.cleanup = effect(); }, 0 );

}

/**
 * Memoizes a computed value until dependencies change.
 *
 * @param {Function} factory - Function that creates the value.
 * @param {Array<any>} deps - Dependency list.
 * @returns {any} Memoized value.
 */
function useMemo(factory,deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' || deps.constructor.name!=='Array') ) {
		throw new Error("Memo dependencies must be an array or omitted.");
	}

	const hk = Lilact.useHook();

	if( !Lilact.isEmpty(hk) ) {
		if(deps!==undefined && hk?.deps!==undefined && Lilact.shallowEqual(deps, hk.deps)) return hk.value;
	}

	hk.deps = deps;
	hk.value = factory(hk.value);

	return hk.value;
}

/**
 * React-compatible hook for managing an async/queued action and deriving state from it.
 *
 * @param {Function} action - The async/queued action function.
 * @param {any} initialState - Initial state for the hook.
 * @returns {any} Hook result
 */
function useActionState(fn, initialState)
{
	const hk = Lilact.useHook();
	const [is_pending, tran_start_func] = Lilact.useTransition();

	if( Lilact.isEmpty(hk) ) {

		hk.state = initialState;

		hk.form_action = (sub)=>{
			event.preventDefault();

			tran_start_func(
					async ()=> {
						const form_data = new FormData(sub.target, sub.submitter);
						hk.state = await fn(hk.state, form_data);
					},
					[]
				);

			return false;
		}
	}

	return [hk.state, hk.form_action, is_pending];
}

/**
 * Manages state via a reducer function and exposes dispatch to trigger state transitions.
 *
 * @param {Function} reducer - Reducer function.
 * @param {any} initialArg - Initial state value (or initializer arg).
 * @param {Function} [init] - Optional initializer function for lazy initial state.
 * @returns {any} Hook result `[state, dispatch]`.
 */
function useReducer(reducer, initialArg, init)
{
	const hk = Lilact.useHook();

	if( Lilact.isEmpty(hk) ) {
		hk.reducer = reducer;
		hk.state = init?init(initialArg):initialArg;
		hk.dispatch = function(core, hk, action) {
			const newst = hk.reducer(hk.state, action);
			if(!Lilact.defaultIsEqual(newst,hk.state)) {
				hk.state = newst;
				core.component.forceUpdate();
			}

		}.bind(undefined, Lilact.current_component[0], hk);
	}

	return [hk.state, hk.dispatch];
}



// todo: very simple implementation. and not lilactish at all! must be modified

/**
 * Returns a deferred value that updates later than the provided input.
 *
 * @param {any} value - Value to defer.
 * @returns {any} Deferred value.
 */
function useDeferredValue(value, initialValue)
{
	const { useEffect, useRef, useState } = Lilact;

	const [deferred, setDeferred] = useState(
		typeof initialValue !== "undefined" ? initialValue : value
	);
	const lastValueRef = useRef(value);
	const pendingRef = useRef(null);

	useEffect(() => {
		if (lastValueRef.current === value) return;
		lastValueRef.current = value;

		// Cancel any previously scheduled update
		if (pendingRef.current != null) {
			pendingRef.current.cancelled = true;
			pendingRef.current = null;
		}

		// Schedule update asynchronously using a microtask (Promise.resolve)
		const job = { cancelled: false };
		pendingRef.current = job;

		Promise.resolve().then(() => {
			if (job.cancelled) return;
			// Batch state update into next event loop tick so current render finishes first.
			setDeferred(value);
			pendingRef.current = null;
		});

		return () => {
			if (pendingRef.current) {
				pendingRef.current.cancelled = true;
				pendingRef.current = null;
			}
		};
	}, [value]);

	return deferred;
}


/**
 * Wraps a render function so that a parent can pass a `ref` into it.
 * The forwarded `ref` is provided as the second argument to the render function: `(props, ref)`.
 *
 * @param {function(props: any, ref: any)} render
 *   The component render function that receives the props and the forwarded ref.
 * @returns {}
 */
function forwardRef(render)
{
	return (props)=>render({...props, ref: undefined}, props.ref);
}


/**
 * Customizes the value that is exposed to the parent when it uses a `ref` on a component created with `forwardRef`.
 * The object returned by `factory` becomes the value of `ref.current` for object refs.
 *
 * @param {Ref<any>} ref
 *   The ref that was received in your component (typically via `forwardRef` as the second argument).
 * @param {function(): any} factory
 *   Function that returns the value to expose to the parent. Commonly an object with methods,
 *   or a DOM node reference.
 * @param {Array<any>} [deps]
 *   Dependency list that controls when the exposed value is recalculated.
 * @returns {void}
 */
function useImperativeHandle(ref, factory, deps=undefined)
{
	if(deps!==undefined && ref?.deps!==undefined && Lilact.shallowEqual(deps, ref.deps)) return;

	ref.deps = deps;

	Lilact.setTimeout( ()=>{ 
		if(typeof ref?.current !== 'object') {
			ref.current = {};
		}
		Object.assign( ref.current, factory(), 0 );	
	}, 0);
}



//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9ob29rcy5qc3giLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIvVXNlcnMvYXJhc2gvRGVza3RvcC9Qcm9qZWN0cy9MaWxhY3Qvc3JjL2hvb2tzLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0E4QkM7OztDQUdBOzs7Ozs7O3dCQU91QjtDQUN2Qjs7O0lBR0csMENBQTBDO2tCQUMzQixBQUFEOzs7Ozs7Q0FNakI7Ozs7Ozt5QkFNd0I7Q0FDeEI7MkJBQzBCOztJQUV2QixlQUFnQixRQUFPO0tBQ3RCLE1BQU8sbUNBQWtDOzs7eUJBR3JCLGdCQUFnQjtNQUNuQyxNQUFPLG1DQUFrQzs7OzhCQUdqQjtTQUNyQjs7Ozs7OztDQU9SOzs7Ozs7OzRCQU8yQjtDQUMzQjtJQUNHLHFCQUFzQixNQUFPLDBEQUF3RDtrQkFDdkU7OzsyQkFHUzs7SUFFdkIsZUFBZ0IsUUFBTzs7O09BR3BCO0tBQ0YsK0RBQWdFOzs7SUFHakUsY0FBYzthQUNMOzs7Ozs7OztDQVFaOzs7Ozs7OEJBTTZCO0NBQzdCO3VCQUN1QixBQUFELG9CQUFvQjs7OztTQUlsQzs7Ozs7O0NBTVI7Ozs7OzsyQkFNMEI7Q0FDMUI7OztPQUdNLDRDQUE0Qzs7OztJQUkvQyxjQUFjOzs7Ozs7OztDQVFqQjs7Ozs7O3NCQU1xQjtDQUNyQjsyQkFDMEI7O0lBRXZCLGVBQWdCLFFBQU87Ozs7Ozs7Q0FPMUI7Ozs7OzhCQUs2QjtDQUM3QjsyQkFDMEI7O0lBRXZCLGVBQWdCLFFBQU87Ozs7O0dBS3hCLGNBQWUsZUFBZTs7OztLQUkzQixlQUFlOzhCQUNVOzs7V0FHbkI7Ozs7S0FJTixlQUFlOzhCQUNVOzs7O1NBSXRCOzs7Ozs7Q0FNUjs7Ozs7OztnQ0FPK0I7Q0FDL0I7OzJCQUUwQjs7O01BR3JCO21CQUNhOztPQUVaLElBQUk7OztJQUdQLGtCQUFrQjtLQUNqQixNQUFPLHlEQUF3RDs7cUNBRS9COzs7SUFHakMsZUFBZ0IsUUFBTzs7eUJBRUYsZ0JBQWdCOztNQUVuQyxNQUFPLDhCQUE2Qjs7TUFFcEM7O3NDQUVnQzs7OzhCQUdSOztTQUVyQjs7Ozs7O0NBTVI7Ozs7Ozs7dUJBT3NCO0NBQ3RCOzJCQUMwQjs7SUFFdkIsZUFBZ0IsUUFBTzs7Ozs7OztDQU8xQjs7Ozs7OztnQ0FPK0I7Q0FDL0I7SUFDRyxxQkFBc0IsTUFBTywwREFBd0Q7a0JBQ3ZFOzs7MkJBR1M7O0lBRXZCLGdCQUFpQixRQUFPO0tBQ3ZCLCtEQUFnRTs7O0lBR2pFLGNBQWM7YUFDTDs7OzsyQkFJYyxDQUFFLElBQUkscUJBQXFCO21EQUNIOzs7Q0FHbEQ7Ozs7Ozs7MEJBT3lCO0NBQ3pCO0lBQ0cscUJBQXNCLE1BQU8sMERBQXdEO2tCQUN2RTs7OzJCQUdTOztJQUV2QixnQkFBaUIsUUFBTztLQUN2QiwrREFBZ0U7OztJQUdqRSxjQUFjO2FBQ0w7Ozs7bUJBSU0sQ0FBRSxJQUFJLHFCQUFxQjs7OztDQUk3Qzs7Ozs7Ozt3QkFPdUI7Q0FDdkI7SUFDRyxxQkFBc0IsTUFBTywwREFBd0Q7a0JBQ3ZFOzs7MkJBR1M7O0lBRXZCLGdCQUFpQixRQUFPO0tBQ3ZCLCtEQUFnRTs7OztvQkFJakQ7Ozs7O0NBS25COzs7Ozs7OytCQU84QjtDQUM5QjsyQkFDMEI7NERBQ2lDOztJQUV4RCxlQUFnQixRQUFPOzs7O29CQUlQLE9BQU87d0JBQ0g7O21CQUVMO1dBQ1AsS0FBSztvQ0FDb0I7eUJBQ1g7Ozs7Ozs7Ozs7OztDQVl6Qjs7Ozs7Ozs7MkJBUTBCO0NBQzFCOzJCQUMwQjs7SUFFdkIsZUFBZ0IsUUFBTzs7dUJBRUo7eUJBQ0UsbUJBQW1COzRCQUNoQjtNQUN0QixzQkFBdUIsbUJBQWtCOzsrQkFFaEI7OztTQUd0Qjs7Ozs7Ozs7Q0FRUjs7Q0FFQTs7Ozs7O2lDQU1nQztDQUNoQztRQUNPOzswQ0FFa0M7Ozs2QkFHYjsyQkFDRjs7V0FFZixBQUFELE1BQU87S0FDWjs7O0VBR0g7S0FDRyw2QkFBNkI7Ozs7O0VBS2hDO2NBQ1k7OztpQkFHRyxPQUFRLEFBQUQsTUFBTztLQUN6QjtFQUNIO2FBQ1c7Ozs7U0FJTCxNQUFNO01BQ1QscUJBQXFCOzs7Ozs7Ozs7OztDQVczQjs7Ozs7Ozs7MkJBUTBCO0NBQzFCO1NBQ1EsZUFBZ0IsQUFBRDs7OztDQUl2Qjs7Ozs7Ozs7Ozs7OztvQ0FhbUM7Q0FDbkM7SUFDRyxnRUFBaUU7Ozs7bUJBSWxELENBQUUsSUFBSTtJQUNwQixtQ0FBbUM7aUJBQ3RCOztlQUVGLHFCQUFzQiJ9
// EXTERNAL MODULE: ./src/run.jsx
var run = __webpack_require__(861);
;// ./src/timers.jsx
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

// note: lilact timers can be used without lilact. uncomment the directive below to
// get the transpiled version in dist directory.
//ʔ outputJS('./dist/timers.js');


const [timers_CORE,timers_IDX,DUE,REPEAT,CLEARED,INTERVAL,CALLBACK,ARGS]=[Symbol.for('LILACT:TIMERS:CORE'),Symbol.for('LILACT:TIMERS:IDX'),Symbol.for('LILACT:TIMERS:DUE'),Symbol.for('LILACT:TIMERS:REPEAT'),Symbol.for('LILACT:TIMERS:CLEARED'),Symbol.for('LILACT:TIMERS:INTERVAL'),Symbol.for('LILACT:TIMERS:CALLBACK'),Symbol.for('LILACT:TIMERS:ARGS')];

/**
 * Timer helpers for a promise-friendly timer framework.
 *
 * These functions keep the same call signatures as the standard JavaScript timer APIs where applicable 
 * (`setTimeout`/`setInterval`/`clearTimeout`/`clearInterval`), 
 * but add extra capabilities for promise-friendly control and lifecycle management. 
 * 
 * This module can “grab” timers and later pause/resume/reset/release them, plus provide promise wrappers 
 * like `timeoutPromise` and `animationFramePromise`.
 *
 * - `setTimeout` / `setInterval`: schedule callbacks (same interface as the built-ins).
 * - `clearTimeout` / `clearInterval`: cancel scheduled timers (same interface as the built-ins).
 * - `grabTimers` / `pauseTimers` / `resumeTimers` / `resetTimers` / `releaseTimers`: manage tracked timers.
 * - `timeoutPromise` / `animationFramePromise`: promise-based convenience wrappers.
 */


let timer_pause_time = undefined;
let current_timer_idx = -1;
let timer_list = [];
let timer_timeout = -1;
let all_timers = {};


// original functions
const _setTimeout = window.setTimeout,
_setInterval = window.setInterval,
_clearTimeout = window.clearTimeout,
_clearInterval = window.clearInterval;


function get_bucket(target) 
{
	let left = 0;
	let right = timer_list.length - 1;

	while (left <= right) {
		const mid = Math.floor((left + right) / 2);
		const mid_val = timer_list[mid][DUE];

		if (mid_val === target) {
			return [mid, timer_list[mid]];
		} 
		else if (mid_val < target) {
			left = mid + 1;
		} 
		else {
			right = mid - 1;
		}
	}

	const bucket = [];
	bucket[DUE] = target;

	timer_list.splice(left, 0, bucket); 
	return [left, bucket];
}

function add_timer(t, is_repeat=false)
{
	const [i,bucket] = get_bucket(t[DUE]);

	if(!is_repeat) {
		current_timer_idx++;
		all_timers[current_timer_idx]=t;
		t[timers_IDX] = current_timer_idx;
	}

	bucket.push(t);

	if(timer_list[0][0]===t) {
		_clearTimeout( timer_timeout );
		timer_timeout = _setTimeout( run_timer, t[INTERVAL] );
	}

	return current_timer_idx;
}

function run_timer()
{
	const now = Date.now();

	let i = 0;
	let buck = timer_list[i];

	while( buck && buck[DUE]-now <= 0 ) {
		for(const t of buck) {

			if(!t[CLEARED]) {
				t[CALLBACK](...t[ARGS]);			
				if(t[REPEAT]) {
					t[DUE] = Date.now()+t[INTERVAL];
					add_timer(t, true);
				}
				else {
					delete all_timers[t[timers_IDX]];
				}
			}
			else {
				delete all_timers[t[timers_IDX]];
			}
		}
		i++;
		buck = timer_list[i];
	}

	timer_list.splice(0,i);

	if(timer_list.length>0) {
		_clearTimeout( timer_timeout );
		timer_timeout = _setTimeout( run_timer, timer_list[0][DUE] - now);
	}

}

//---

/**
 * Resets managed timers back to their initial scheduled state.
 * @returns {void}
 */
function  resetTimers()
{
	_clearTimeout(timer_timeout);
	timer_pause_time = undefined;
	current_timer_idx = -1;
	timer_list = [];
	timer_timeout = -1;
	all_timers = {};
}

/**
 * Pauses all grabbed timers.
 * @returns {void}
 */
function  pauseTimers()
{
	_clearTimeout( timer_timeout );
	timer_pause_time = Date.now();
}

/**
 * Resumes paused timers.
 * @returns {void}
 */
function resumeTimers()
{
	if(!timer_pause_time) return;

	if(timer_list.length>0) {
		const now = Date.now();

		timer_pause_time -= now;

		for( const t of timer_list ) {
			t[DUE] -= timer_pause_time;
		}

		timer_timeout = _setTimeout( run_timer, timer_list[0][DUE] - now);
	}

	timer_pause_time = undefined;
}


/**
 * Creates a timeout timer (same interface as JS `setTimeout`).
 * @param {Function} callback - Function to run after the delay.
 * @param {number} delay - Delay in milliseconds.
 * @param {...any} [args] - Optional arguments passed to `callback`.
 * @returns {any} Timeout id.
 */


function timers_setTimeout(func, interval, ...args)
{
	return add_timer( { [CALLBACK]: func, [INTERVAL]: interval, [DUE]: Date.now()+interval, [REPEAT]: false, [ARGS]: args } );
}

/**
 * Creates an interval timer (same interface as JS `setInterval`).
 * @param {Function} callback - Function to run repeatedly.
 * @param {number} interval - Delay in milliseconds between executions.
 * @param {...any} [args] - Optional arguments passed to `callback`.
 * @returns {any} Interval id.
 */

function timers_setInterval(func, interval, ...args)
{
	return add_timer( { [CALLBACK]: func, [INTERVAL]: interval, [DUE]: Date.now()+interval, [REPEAT]: true, [ARGS]: args } );
}

/**
 * Clears a timeout created via this framework’s `setTimeout`.
 * @param {any} id - Timeout id returned by `setTimeout`.
 * @returns {void}
 */
function timers_clearTimeout(t)
{
	if(all_timers[t]) all_timers[t][CLEARED] = true;
}

/**
 * Clears an interval created via this framework’s `setInterval`.
 * @param {any} id - Interval id returned by `setInterval`.
 * @returns {void}
 */
function timers_clearInterval(t)
{
	if(all_timers[t]) all_timers[t][CLEARED] = true;
}

/**
 * Captures/associates all timers with the framework so they can be managed. Calling this will
 * shadow the global setTimeout and setInterval functions and channel them through Lilact.
 * @returns {void}
 */
function grabTimers()
{
	globalThis.setTimeout = this.setTimeout;
	globalThis.setInterval = this.setInterval;
	globalThis.clearTimeout = this.clearTimeout;
	globalThis.clearInterval = this.clearInterval;
}

/**
 * Releases timers from framework control.
 * @returns {void}
 */
function releaseTimers()
{
	globalThis.setTimeout = _setTimeout;
	globalThis.setInterval = _setInterval;
	globalThis.clearTimeout = _clearTimeout;
	globalThis.clearInterval = _clearInterval;
}

/**
 * Returns a Promise that resolves after a timeout (framework-managed) using the same delay semantics as `setTimeout`.
 * @param {number} duration - Delay in milliseconds.
 * @returns {Promise} Promise that resolves after the delay.
 */
function timeoutPromise(duration=0, timer_source=this) 
{	
	let id, resolve, reject;

	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
		id = timer_source.setTimeout(() => {
			resolve();
		}, duration);
	});

	// note: proceed interrupts the timer, and continues the flow if used with await.
	promise.proceed = () => {
		timer_source.clearTimeout(id);
		resolve();
	};

	// note: cancel rejects so it throws exception when using with await, this allows handling it differently.
	promise.cancel = () => {
		timer_source.clearTimeout(id);
		reject();
	};

	return promise;
}

/**
 * Schedules a callback on the next animation frame and returns a Promise that resolves on that frame.
 * @returns {Promise} Promise that resolves when the animation frame runs.
 */
function animationFramePromise() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}	



//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy90aW1lcnMuanN4Iiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy90aW1lcnMuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQThCQztDQUNBO0NBQ0E7OztDQUdBOztDQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7a0JBcUJpQjs7O0NBR2pCOzs7Ozs7O29CQU9tQjtDQUNuQjs7OztRQUlPLGdCQUFnQjt5QkFDRSxBQUFEOzs7TUFHbkIscUJBQXFCOzs7V0FHaEIsbUJBQW1COzs7UUFHdEI7Ozs7Ozs7O21CQVFXOzs7O21CQUlBO0NBQ2xCOytCQUM4Qjs7SUFFM0IsYUFBYTs7Ozs7O2FBTUo7O0lBRVQsdUJBQXVCO2dCQUNYOzhCQUNjOzs7Ozs7bUJBTVg7Q0FDbEI7c0JBQ3FCOzs7OztPQUtmLCtCQUErQjtNQUNoQyxrQkFBa0I7O01BRWxCLGNBQWM7Z0JBQ0o7T0FDVCxZQUFZO3VCQUNJO2VBQ1I7O1VBRUw7Ozs7U0FJRDs7Ozs7Ozs7bUJBUVU7O0lBRWYsc0JBQXNCO2dCQUNWOzhCQUNjOzs7OztDQUs3Qjs7Q0FFQTs7Ozs2QkFJNEI7Q0FDNUI7ZUFDYzs7Ozs7ZUFLQTs7O0NBR2Q7Ozs7NkJBSTRCO0NBQzVCO2VBQ2M7NkJBQ2M7OztDQUc1Qjs7Ozs2QkFJNEI7Q0FDNUI7SUFDRzs7SUFFQSxzQkFBc0I7dUJBQ0g7Ozs7TUFJakIsMEJBQTBCOzs7OzhCQUlGOzs7Ozs7O0NBTzdCOzs7Ozs7Ozs7MkJBUzBCO0NBQzFCO2tCQUNpQixDQUFFLHlEQUF5RDs7O0NBRzVFOzs7Ozs7Ozs0QkFRMkI7Q0FDM0I7a0JBQ2lCLENBQUUseURBQXlEOzs7Q0FHNUU7Ozs7OzZCQUs0QjtDQUM1QjtJQUNHOzs7Q0FHSDs7Ozs7OEJBSzZCO0NBQzdCO0lBQ0c7OztDQUdIOzs7OzsyQkFLMEI7Q0FDMUI7Ozs7Ozs7Q0FPQTs7Ozs4QkFJNkI7Q0FDN0I7Ozs7Ozs7Q0FPQTs7Ozs7K0JBSzhCO0NBQzlCOzs7NkJBRzZCLEFBQUQsY0FBZTs7OzhCQUdaLEFBQUQsTUFBTztTQUMzQjs7OztFQUlUO29CQUNrQixNQUFNOzRCQUNFO1VBQ2xCOzs7RUFHUjttQkFDaUIsTUFBTTs0QkFDRztTQUNuQjs7Ozs7O0NBTVI7Ozs7c0NBSXFDLEdBQUc7dUJBQ2pCLEFBQUQsYUFBYzs2QkFDTixBQUFELE1BQU87a0JBQ2pCIn0=
;// ./src/transition.jsx
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

const [transition_CORE,transition_COMPONENT,transition_CHILD_CLASS_ADDENDUM]=[Symbol.for('LILACT:CORE'),Symbol.for('LILACT:COMPONENT'),Symbol.for('LILACT:CHILD_CLASS_ADDENDUM')];

/* States */
const UNMOUNTED = "unmounted";
const EXITED = 	  "exited";
const ENTERING =  "entering";
const ENTERED =   "entered";
const EXITING =   "exiting";





/**
 * Transition component that manages enter/exit lifecycle and calls callbacks based on state changes.
 *
 * @param props - Component props.
 * @param props.in - Boolean/flag indicating whether the component should be entered/shown.
 * @param [props.timeout=defaultTransitionTimeout] - Duration (or durations) for the transition.
 * @param [props.mountOnEnter=false] - If true, mount the child only when entering.
 * @param [props.unmountOnExit=false] - If true, unmount the child after exiting.
 * @param [props.appear=false] - If true, run the enter transition on initial mount.
 * @param props.onEnter - Called when entering begins.
 * @param props.onEntering - Called while the component is entering.
 * @param props.onEntered - Called when entering completes.
 * @param props.onExit - Called when exiting begins.
 * @param props.onExiting - Called while the component is exiting.
 * @param props.onExited - Called when exiting completes.
 * @param props.children - Render prop receiving transition state/props.
 */
function Transition({
	in: inProp,
	timeout = Lilact.defaultTransitionTimeout,
	mountOnEnter = false,
	unmountOnExit = false,
	appear = false,
	onEnter,
	onEntering,
	onEntered,
	onExit,
	onExiting,
	onExited,
	children,

	// this is underscored to prevent accidental setting by the user.
	// i added it to the Transition itself to simplify the implementation,
	// but the user should use CSSTransition itself.
	_classNames: classNames
}) {
	this[transition_CORE].is_mounted ??= !mountOnEnter || inProp || appear;
	this[transition_CORE].is_appeared ??= inProp;
	this[transition_CORE].timer ??= null;

	this[transition_CORE].childFunctionHandler = (func)=>{
		return func(this[transition_CORE].mount_state); 
	}

	if(!this[transition_CORE].mount_state) {
		if (!this[transition_CORE].is_mounted) this[transition_CORE].mount_state = UNMOUNTED;
		if (inProp) {
			this[transition_CORE].mount_state = appear && !this[transition_CORE].is_appeared ? ENTERING : ENTERED;
		}
		else this[transition_CORE].mount_state = EXITED;
	}

	useEffect(() => {
		return () => timers_clearTimeout(this[transition_CORE].timer);
	}, []);

	useEffect(() => {
		if (!this[transition_CORE].is_appeared && appear && this[transition_CORE].mount_state === ENTERING && inProp) {
			onEnter?.();
			requestAnimationFrame(() => {
				onEntering?.(!this[transition_CORE].is_appeared);
				timers_clearTimeout(this[transition_CORE].timer);
				this[transition_CORE].timer = timers_setTimeout(() => {
					this[transition_CORE].mount_state = ENTERED;
					this.forceUpdate();
					this[transition_CORE].is_appeared = true;
					onEntered?.(!this[transition_CORE].is_appeared);
				}, timeout);
			});
		}
	}, []);

	useEffect(() => {
		if (inProp) {
			this[transition_CORE].is_mounted = true;
			// If we are already entering/entered, no-op
			if (this[transition_CORE].mount_state === ENTERING || this[transition_CORE].mount_state === ENTERED) return;

			onEnter?.(!this[transition_CORE].is_appeared);
			this[transition_CORE].mount_state = ENTERING;
			this.forceUpdate(() => {
				onEntering?.(!this[transition_CORE].is_appeared);
				timers_clearTimeout(this[transition_CORE].timer);

				this[transition_CORE].timer = timers_setTimeout(() => {
					this[transition_CORE].mount_state = ENTERED;
					this.forceUpdate();
					this[transition_CORE].is_appeared = true;
					onEntered?.();
				}, timeout);
			});
		} 
		else {
			if (this[transition_CORE].mount_state === UNMOUNTED || this[transition_CORE].mount_state === EXITING || this[transition_CORE].mount_state === EXITED) return;

			onExit?.();
			this[transition_CORE].mount_state = EXITING;
			this.forceUpdate( () => {
				onExiting?.();
				timers_clearTimeout(this[transition_CORE].timer);
				this[transition_CORE].timer = timers_setTimeout(() => {
					this[transition_CORE].mount_state = EXITED;
					this.forceUpdate();
					onExited?.();
					if (unmountOnExit) {
						this[transition_CORE].is_mounted = false;
						this[transition_CORE].mount_state = UNMOUNTED;
						this.forceUpdate();
					}
				}, timeout);
			});
		}
	}, [inProp, timeout]);

	if (!this[transition_CORE].is_mounted) return null;

	if(classNames) {
		if (this[transition_CORE].mount_state === ENTERING) {
			if(this[transition_CORE].is_appeared)
				this[transition_CORE][transition_CHILD_CLASS_ADDENDUM] = classNames.appearActive;
			else
				this[transition_CORE][transition_CHILD_CLASS_ADDENDUM] = classNames.enterActive;
		}
		else if (this[transition_CORE].mount_state === ENTERED) {
			if(this[transition_CORE].is_appeared)
				this[transition_CORE][transition_CHILD_CLASS_ADDENDUM] = classNames.appearDone;
			else
				this[transition_CORE][transition_CHILD_CLASS_ADDENDUM] = classNames.enterDone;
		}
		else if (this[transition_CORE].mount_state === EXITING) this[transition_CORE][transition_CHILD_CLASS_ADDENDUM] = classNames.exitActive;
		else if (this[transition_CORE].mount_state === EXITED) this[transition_CORE][transition_CHILD_CLASS_ADDENDUM] = classNames.exitDone;
	}
	return children;
}


/**
 * CSSTransition component that extends Transition by applying CSS class names during enter/exit phases.
 *
 * Lilact accepts multiple children for CSSTransition. This has the benefit
 * of receiving single events on multiple animated components.
 *
 * @param props - Component props.
 * @param props.in - Boolean/flag indicating whether the component should be entered/shown.
 * @param [props.timeout=defaultTransitionTimeout] - Duration (or durations) for the transition.
 * @param [props.classNames="fade"] - Base CSS class name(s) used for the transition states.
 * @param [props.mountOnEnter=false] - If true, mount the child only when entering.
 * @param [props.unmountOnExit=false] - If true, unmount the child after exiting.
 * @param [props.appear=false] - If true, run the enter transition on initial mount.
 * @param props.children - Render prop receiving transition state/props.
 * @param props.onEnter - Called when entering begins.
 * @param props.onEntering - Called while the component is entering.
 * @param props.onEntered - Called when entering completes.
 * @param props.onExit - Called when exiting begins.
 * @param props.onExiting - Called while the component is exiting.
 * @param props.onExited - Called when exiting completes.
 */
function CSSTransition({
	in: inProp,
	timeout = defaultTransitionTimeout,
	classNames = "fade",
	mountOnEnter = false,
	unmountOnExit = false,
	appear = false,
	children,
	onEnter, onEntering, onEntered, 
	onExit, onExiting, onExited,
}) {

	if(typeof(classNames)==='string') {
		classNames = {
			appear: `${classNames}-enter ${classNames}-appear`,
			appearActive: `${classNames}-enter-active ${classNames}-appear-active`,
			appearDone: `${classNames}-enter-done ${classNames}-appear-done`,
			enter: `${classNames}-enter`,
			enterActive: `${classNames}-enter-active`,
			enterDone: `${classNames}-enter-done`,
			exit: `${classNames}-exit`,
			exitActive: `${classNames}-exit-active`,
			exitDone: `${classNames}-exit-done`,
		};
	}		
	return (
		 createComponent( Transition, { "in": inProp, "timeout": timeout, "mountOnEnter": mountOnEnter, "unmountOnExit": unmountOnExit, "appear": appear, "onEnter": onEnter, "onEntering": onEntering, "onEntered": onEntered, "onExit": onExit, "onExiting": onExiting, "onExited": onExited, "_classNames": classNames }, children )
		);
}


/**
 * Lilact doesn't need TransitionGroup, so it is the same as a fragment.
 * In Lilact all the transitions and timeouts are automatically grouped.
 * 
 * The only missing feature here is the childFactory. I may add it in
 * the future, but there are simple workarounds for that. 
 */
function TransitionGroup({ children }) {
	return children;
}


//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy90cmFuc2l0aW9uLmpzeCIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hcmFzaC9EZXNrdG9wL1Byb2plY3RzL0xpbGFjdC9zcmMvdHJhbnNpdGlvbi5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsQUFBQTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBOEJDOztDQUVBOzs7Ozs7O1FBT087UUFDQTtRQUNBOztDQUVQOzs7Ozs7Ozs7Ozs7Ozs7OzsyQkFpQjJCLEFBQUQ7Ozs7Ozs7Ozs7Ozs7O0NBY3pCO0NBQ0E7Q0FDQTs7SUFFRTs7Ozs7b0NBS2dDLFFBQVE7Y0FDOUI7OztJQUdWLDBCQUEwQjtNQUN4QjtNQUNBLFNBQVM7Ozs7OztXQU1ILEFBQUQsTUFBTztTQUNSLGtCQUFrQjs7O1dBR2hCLEFBQUQsTUFBTztLQUNaLHFGQUFxRjtZQUM5RTt3QkFDYSxBQUFELE1BQU87ZUFDZjtlQUNBO2dDQUNrQixBQUFELE1BQU87O21CQUVuQjs7Y0FFTDs7Ozs7O1dBTUwsQUFBRCxNQUFPO0tBQ1osU0FBUzs7R0FFWDtNQUNHOztZQUVNOzttQkFFUSxBQUFELE1BQU87ZUFDVjtlQUNBOztnQ0FFa0IsQUFBRCxNQUFPOzttQkFFbkI7O2NBRUw7Ozs7T0FJVDtNQUNEOztXQUVLOzttQkFFUSxDQUFFLE1BQU07Y0FDWjtlQUNDO2dDQUNrQixBQUFELE1BQU87O21CQUVuQjthQUNOO01BQ1AsZ0JBQWdCOzs7b0JBR0Y7Ozs7Ozs7S0FPbEI7O0lBRUQsYUFBYTtNQUNYLHNDQUFzQztNQUN0Qzs7Ozs7V0FLSyxxQ0FBcUM7TUFDMUM7Ozs7O1dBS0s7V0FDQTs7Ozs7O0NBTVY7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs4QkFxQjhCLEFBQUQ7Ozs7Ozs7Ozs7SUFVMUI7O0lBRUEsTUFBTywwQkFBeUI7Z0JBQ3BCOzs7Ozs7Ozs7Ozs7U0FZUDtFQUNOLG1SQWNDOzs7OztDQU1IOzs7Ozs7O2dDQU9nQyxBQUFELGVBQWUifQ==
;// ./src/events.jsx
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


// Minimal shims (small and explicit)
if (typeof Element !== 'undefined' && !Element.prototype.matches) {
	Element.prototype.matches = Element.prototype.msMatchesSelector ||
															Element.prototype.webkitMatchesSelector ||
															function(s) {
																var matches = (this.document || this.ownerDocument).querySelectorAll(s);
																var i = matches.length;
																while (--i >= 0 && matches.item(i) !== this) {}
																return i > -1;
															};
}

if (typeof Event !== 'undefined' && !Event.prototype.composedPath) {
	Event.prototype.composedPath = function() {
		var path = [];
		var el = this.target;
		while (el) {
			path.push(el);
			el = el.parentElement;
		}
		path.push(window);
		return path;
	};
}

// Event pool for reuse
const _pool = [];
const MAX_POOL_SIZE = 10;

function createSyntheticEvent(nativeEvent, currentTarget) {
	// Reuse object from pool if available
	const e = _pool.length ? _pool.pop() : {};

	e.nativeEvent = nativeEvent;
	e.type = nativeEvent.type;
	e.target = nativeEvent.target || nativeEvent.srcElement || null;
	e.currentTarget = currentTarget || nativeEvent.currentTarget || null;
	e.timeStamp = nativeEvent.timeStamp || Date.now();
	e.defaultPrevented = !!(nativeEvent.defaultPrevented);
	e.isPropagationStopped = false;
	e.isPersistent = false;

	e.isDefaultPrevented = () => e.defaultPrevented;
	e.preventDefault = () => {
		if (nativeEvent.preventDefault) nativeEvent.preventDefault();
		e.defaultPrevented = true;
	};
	e.stopPropagation = () => {
		if (nativeEvent.stopPropagation) nativeEvent.stopPropagation();
		e.isPropagationStopped = true;
	};
	e.persist = () => { e.isPersistent = true; };

	// Convenience: normalized values for common props (touch, key, target value)
	e.nativeEvent = nativeEvent;
	e.key = nativeEvent.key || null;
	e.code = nativeEvent.code || null;
	e.which = nativeEvent.which || nativeEvent.keyCode || null;

	// For input-like events normalize value and checked
	try {
		const tgt = e.target;
		e.value = tgt && ('value' in tgt) ? tgt.value : undefined;
		e.checked = tgt && ('checked' in tgt) ? tgt.checked : undefined;
	} catch (err) {
		e.value = undefined;
		e.checked = undefined;
	}

	// composedPath helper
	e.path = typeof nativeEvent.composedPath === 'function' ? nativeEvent.composedPath() : [e.target];

	return e;
}

function releaseSyntheticEvent(e) {
	if (e && !e.isPersistent) {
		// Clean up references to avoid leaks
		e.nativeEvent = null;
		e.type = null;
		e.target = null;
		e.currentTarget = null;
		e.timeStamp = 0;
		e.defaultPrevented = false;
		e.isPropagationStopped = false;
		e.isPersistent = false;
		e.isDefaultPrevented = null;
		e.preventDefault = null;
		e.stopPropagation = null;
		e.persist = null;
		e.key = null;
		e.code = null;
		e.which = null;
		e.value = undefined;
		e.checked = undefined;
		e.path = null;

		if (_pool.length < MAX_POOL_SIZE) _pool.push(e);
	}
}

// Main wrapper factory
// fn: function(syntheticEvent) { ... }
// opts: { capture: bool, passive: bool, once: bool, stopPropagationOnTrueReturn: bool }
function wrapListener(fn, opts = {}) {
	const { stopPropagationOnTrueReturn = false } = opts;

	return function handler(nativeEvent) {

		const currentTarget = this || nativeEvent.currentTarget || null;
		const sEvent = createSyntheticEvent(nativeEvent, currentTarget);

		try {
			const result = fn(sEvent);

			// If user returns true and opted in, stop propagation
			if (stopPropagationOnTrueReturn && result === true) {
				sEvent.stopPropagation();
			}
		} finally {
			// Release back to pool unless persisted
			releaseSyntheticEvent(sEvent);
		}
	};
}

// Convenience: add/remove wrapper-managed listener
function addWrappedEventListener(target, type, fn, options = {}) {
	const handler = wrapListener(fn, options);

	target.addEventListener(type, handler, options);
	// Return a remover
	return () => target.removeEventListener(type, handler, options);
}


//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9ldmVudHMuanN4Iiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9ldmVudHMuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0ErQkM7SUFDRywrREFBK0Q7Ozt3QkFHM0MsSUFBSTsrQkFDRyxzREFBc0Q7O3VCQUU5RCx3QkFBeUIsZUFBYzs7Ozs7SUFLMUQsZ0VBQWdFO3lDQUMzQixHQUFHOzs7U0FHbkMsS0FBSzthQUNEOzs7WUFHRDs7Ozs7Q0FLWDs7OztxQ0FJb0MsNkJBQTZCO0VBQ2hFO29DQUNrQyxLQUFLOzs7Ozs7aURBTVE7eUJBQ3hCOzs7O3lCQUlBO3FCQUNKLE1BQU07TUFDckIsdURBQXVEOzs7c0JBR3ZDLE1BQU07TUFDdEIseURBQXlEOzs7Y0FHakQsTUFBTTs7RUFFbEI7Ozs7OztFQU1BO01BQ0k7O29CQUVjO3NCQUNFO1VBQ1osTUFBTTs7Ozs7RUFLZDtvRkFDa0Y7Ozs7O3NDQUs5QyxJQUFJO0tBQ3JDLHVCQUF1QjtHQUN6Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7TUFvQkcseUNBQXlDOzs7O0NBSTlDO0NBQ0E7Q0FDQTs2QkFDNEIsV0FBWSxLQUFJO1FBQ3JDOzt5QkFFaUIsY0FBYzs7O3NDQUdEOztPQUUvQjtxQkFDYzs7SUFFakI7T0FDRyxpREFBaUQ7MkJBQzdCOzthQUVkO0lBQ1Q7eUJBQ3FCOzs7OztDQUt4Qjt3Q0FDdUMsNEJBQTZCLEtBQUk7OEJBQzNDOzt5QkFFTDtFQUN2QjtTQUNPLGdDQUFnQyJ9
;// ./src/redux.jsx
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


const [redux_CORE]=[Symbol.for('LILACT:CORE')];

let ReduxContext;

/**
 * Provider component that supplies the store instance to the component tree.
 *
 * @param props - Component props.
 * @param props.store - Store instance to make available to descendants.
 * @param props.children - Components that can access the store via hooks.
 */
function Provider({ store, children }) 
{
	ReduxContext ??= Lilact.createContext(null);
	return (
		 createComponent( ReduxContext.Provider, { "value": store }, children )
	);
}

/**
 * Hook that returns the current store instance from the nearest Provider.
 *
 * @returns The store object from the Provider context.
 */
function useStore() 
{
	const store = Lilact.useContext(ReduxContext);
	if (!store) {
		throw new Error("Could not find Redux store in context. <Provider> is missing.");
	}
	return store;
}


/**
 * Hook that returns the store's dispatch function from the nearest Provider.
 *
 * @returns The dispatch function used to send actions to the store.
 */
function useDispatch() 
{
	const store = Lilact.useStore();
	return store.dispatch;
}

/**
 * Hook that returns selected data from the store using a selector.
 *
 * @param selector - Function that derives a value from the store state.
 * @param [equalityFn=(a, b) => a === b] - Determines when the selected value should update.
 * @returns The selected slice of state.
 */
function useSelector(selector, equalityFn = (a, b) => a === b) {
  const store = Lilact.useStore();
  const latestSelected = Lilact.useRef();
  const selectorRef = Lilact.useRef(selector);
  selectorRef.current = selector;

  const [selected, setSelected] = Lilact.useState(() => selector(store.getState()));

  // Keep ref in sync for the subscription callback
  latestSelected.current = selected;

  Lilact.useEffect(() => {
    function checkForUpdates() {
      const nextSelected = selectorRef.current(store.getState());
      if (!equalityFn(latestSelected.current, nextSelected)) {
        latestSelected.current = nextSelected;
        setSelected(nextSelected);
      }
    }

    const unsubscribe = store.subscribe(checkForUpdates);

    // In case state changed between render and effect
    checkForUpdates();

    return unsubscribe;
  }, [store, equalityFn]);

  return selected;
}


/**
 * Higher-order component that connects a component to store state and dispatch.
 *
 * @param mapStateToProps - Maps store state to the wrapped component's props.
 * @param mapDispatchToProps - Maps dispatch (or action creators) to the wrapped component's props.
 * @returns A connected component that receives store-derived props.
 */
function connect(mapStateToProps, mapDispatchToProps) 
{
	const shouldSubscribe = Boolean(mapStateToProps);

	return function wrapWithConnect(WrappedComponent) {

		function ConnectedComponent(props) {
			const store = Lilact.useStore();

			let dispatchProps = { dispatch: store.dispatch };

			if (typeof mapDispatchToProps === "function") {
				dispatchProps = mapDispatchToProps(store.dispatch, props);
			} 
			else if (typeof mapDispatchToProps === "object" && mapDispatchToProps !== null) {
				dispatchProps = {};
				const dispatch = store.dispatch;
				for (const key in mapDispatchToProps) {
					const actionCreator = mapDispatchToProps[key];
					dispatchProps[key] = (...args) => dispatch(actionCreator(...args));
				}
			}

			let stateProps = {};
			if (mapStateToProps) {
				const selector = (state) => mapStateToProps(state, props);

				// todo: is shallowEqual enough?
				stateProps = Lilact.useSelector(selector, Lilact.shallowEqual) || {};
			}

			const mergedProps = { ...props, ...stateProps, ...dispatchProps };

			return  createComponent( WrappedComponent, { ...mergedProps } );
		}

		// todo: memoize to avoid unnecessary re-renders if parent props are same?
		//return memo(ConnectedComponent);

		return ConnectedComponent;
	};
}

/**
 * Creates a root reducer by mapping keys to slice reducers.
 *
 * Each slice reducer is called with:
 *   - the previous slice state at `state[key]` (or `undefined` initially)
 *   - the dispatched action
 *
 * The returned reducer builds the next state object using all reducer keys.
 * If none of the slice reducers produce a change (reference equality),
 * the previous `state` object is returned to avoid unnecessary updates.
 *
 * @param {object} reducers - An object whose values are reducers.
 * @returns {function} A root reducer function compatible with your createStore.
 */
function redux_combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  for (const key of reducerKeys) {
    if (typeof reducers[key] !== "function") {
      throw new Error(`combineReducers: reducer for key "${key}" is not a function`);
    }
  }

  return function rootReducer(state = {}, action) {
    let hasChanged = false;
    const nextState = {};

    for (const key of reducerKeys) {
      const reducer = reducers[key];
      const prevSlice = state[key];
      const nextSlice = reducer(prevSlice, action);
      nextState[key] = nextSlice;
      hasChanged = hasChanged || nextSlice !== prevSlice;
    }

    return hasChanged ? nextState : state;
  };
}

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9yZWR1eC5qc3giLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIvVXNlcnMvYXJhc2gvRGVza3RvcC9Qcm9qZWN0cy9MaWxhY3Qvc3JjL3JlZHV4LmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBK0JDOzs7O0NBSUE7Ozs7Ozs7eUJBT3lCLEFBQUQ7Q0FDeEI7dUNBQ3NDO1NBQzlCO0VBQ04sZ0JBQXFDOzs7O0NBSXZDOzs7Ozt5QkFLd0I7Q0FDeEI7aUNBQ2dDO0tBQzVCLFNBQVM7a0JBQ0k7Ozs7OztDQU1qQjs7Ozs7NEJBSzJCO0NBQzNCOytCQUM4Qjs7OztDQUk5Qjs7Ozs7Ozs0QkFPMkIsdUJBQXdCLG9CQUFtQjtnQ0FDdkM7dUNBQ087b0NBQ0g7OztrREFHZSxBQUFELGNBQWUsY0FBZTs7R0FFN0U7OzttQkFHaUIsQUFBRCxNQUFPOzRCQUNHLEdBQUc7OENBQ2UsY0FBZTtTQUNwRCxXQUFZLHlDQUF3Qzs7bUJBRTFDOzs7O3VDQUlvQjs7SUFFbkM7bUJBQ2U7Ozs7Ozs7OztDQVNuQjs7Ozs7Ozt3QkFPdUI7Q0FDdkI7aUNBQ2dDOztpQ0FFQSxtQkFBbUI7OzhCQUV0QixRQUFRO2lDQUNMOzt3QkFFVDs7T0FFakIsMkNBQTJDO3VDQUNYOztZQUUzQix3RUFBd0U7cUJBQy9EOztTQUVaLGtDQUFrQzs7MkJBRWhCLHFCQUFxQixhQUFjOzs7O3FCQUl6QztPQUNkLGtCQUFrQjtzQkFDSCwwQkFBMEI7O0tBRTNDO29DQUMrQixtQ0FBbUM7Ozt3QkFHL0M7O1dBRWI7OztHQUdSO0dBQ0E7Ozs7OztDQU1GOzs7Ozs7Ozs7Ozs7OztnQ0FjK0IsV0FBVztrQ0FDVDs7T0FFM0IsMkJBQTJCO1FBQzFCLHNDQUFzQztzQkFDeEI7Ozs7OEJBSVEsUUFBUyxhQUFZOzt1QkFFNUI7O1NBRWQsMkJBQTJCOzs7Z0NBR0oifQ==
;// ./src/errors.jsx
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
function scanBlockLabels(code, path)
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
function traceError(err)
{
	if(err?.is_traced) {
		return err;
	}

	const loc = parseEvalLocationFromStack(err.stack);

	const obj = {
		fileName: loc.url?.slice(6) || err.fileName,
		
		lineNumber: loc.line,
		columnNumber: loc.col,

		message: err.message,
		name: err.name,

		stack: err.stack,
		_error: err,

		is_traced: true
	};		

	if( err.name!=='JSXParseError' ) {

		let mps;

		if(loc.url) {
			const rm = Lilact.required_scripts[obj.fileName];
			mps = rm.mappings;
			
			const mloc = mapLocation(mps, obj.lineNumber-1, obj.columnNumber-1);

			obj.lineNumber = mloc.line;
			obj.columnNumber = mloc.col;
		}
		else if( err.lilact_trace!==undefined) {

			let loc = getErrorLocation(err);

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

				loc = mapLocation(mps, loc.line-1, loc.col-1);

				obj.lineNumber = loc.line;
				obj.columnNumber = loc.col;
			}
		}
		
	}
	else {
		const loc = getErrorLocation(err);
		if(err.fileName) obj.fileName = err.fileName;
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
 * 
 */
function globalErrorHandler(err)
{
	Lilact.pauseTimers();
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
				display: block;
			}
		`);

	const el = document.createElement('dialog');

	el.className=cls;
	//<b>⚠</b> 
	el.innerHTML = 
		`<h3 style=""><red>Error!</red></h3>
		<b>${err.fileName?'At '+err.fileName:''}
		${Number.isFinite(err.lineNumber)?": Line "+(err.lineNumber+1):""}</b><br><br>
		<b>${err.name}</b>:&nbsp;<span>${err.message}</span><br><br>
		${Lilact.required_scripts[err.fileName]?'<code><pre></pre><pre><red></red></pre><pre></pre></code>':''}
		${err._error.componentStackLog?'<br>Component Stack:<br><code><pre>'+err._error.componentStackLog+'</pre></code>':''}
		`;


	document.body.appendChild(el);

	const pres = el.querySelectorAll('pre');

	if(Lilact.required_scripts[err.fileName]) {
		const lines = Lilact.required_scripts[err.fileName].code.split("\n");

		if(lines?.[err.lineNumber-1])
			pres[0].innerText = lines[err.lineNumber-1];

		if(lines?.[err.lineNumber]) el.querySelector('pre red').innerText = lines[err.lineNumber];

		if(lines?.[err.lineNumber+1])
			pres[2].innerText = lines[err.lineNumber+1];
	}

	el.showModal();
}

/** @ignore */
const blocks_info = { counter: 0, labels: {} };

/** @ignore */
let error = null; // this is only to ease debuggin,


//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9lcnJvcnMuanN4Iiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9lcnJvcnMuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBZ0NDOzswQkFFeUIsTUFBTTtDQUMvQjtJQUNHLCtFQUErRTs7OztVQUl6RTs7O2NBR0ksMEJBQTBCO0lBQ3BDLGVBQWU7V0FDUiw4QkFBOEI7OztJQUdyQyxRQUFRO1VBQ0YsZUFBZSx5QkFBeUI7Ozs7OztDQU1qRDtDQUNBO0NBQ0E7Q0FDQTtDQUNBO29DQUNtQyw4QkFBOEI7eURBQ1Q7MEJBQzlCLEFBQUQ7O0dBRXZCO0dBQ0E7d0JBQ3FCOztPQUVqQixtQkFBbUI7d0JBQ0Y7UUFDaEIsY0FBZTs7eUJBRUU7UUFDakI7Ozs4QkFHc0I7bURBQ3FCOztRQUUzQyxlQUFnQixnQkFBZ0IscUNBQXNDLGdCQUFjO2NBQzlFOzs7O1VBSUosNEVBQTRFLFdBQVc7OztzQkFHM0UsSUFBSTtnQkFDVixXQUFZLEFBQUQ7OztxQkFHTjtDQUNwQjs7O0tBR0ksaUJBQWlCO0tBQ2pCO0tBQ0EsZUFBZ0Isa0NBQWlDOzs7OztJQUtsRDtTQUNLLDZCQUE4QixBQUFEOzs7O0NBSXJDO2dDQUMrQjtDQUMvQjt1QkFDc0IsY0FBZ0IsQUFBRDs7RUFFcEM7WUFDVTtFQUNULE9BQU87cUNBQzRCOzs7Ozs7OztDQVFyQzs7Ozs7Ozs7MkJBUTBCO0NBQzFCO0lBQ0csaUJBQWlCOzs7O3dDQUltQjs7Y0FFMUI7MkJBQ2E7Ozs7Ozs7Ozs7Ozs7O0lBY3ZCLCtCQUErQjs7OztLQUk5QixVQUFVOzs7OzRCQUlhOzs7OztVQUtsQixnQ0FBZ0M7OzhCQUVaOzs7OztNQUt4QixNQUFPLGdDQUErQjs7O1NBR25DOzs7O01BSUgsTUFBTTs7Ozs7O3NCQU1VOzs7Ozs7OztPQVFmOytCQUN3QjtLQUMxQjs7Ozs7Ozs7OztDQVVKOzs7Ozs7Ozs7Ozs7Ozs7O21DQWdCa0M7Q0FDbEM7b0JBQ21CO0lBQ2hCOzt5QkFFcUI7O2dDQUVPOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OzttQ0FvQkc7OztFQUdqQzs7Ozs7Ozs7Ozs7MkJBV3lCOztrQ0FFTzs7SUFFOUIsd0NBQXdDO2lFQUNxQjs7S0FFNUQ7OztLQUdBLDBDQUEwQzs7S0FFMUM7Ozs7Y0FJUzs7O0NBR2I7NEJBQzJCLHNCQUFzQjs7Q0FFakQ7MEJBQ3lCIn0=
;// ./src/router.jsx
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

const [router_CORE,router_COMPONENT]=[Symbol.for('LILACT:CORE'),Symbol.for('LILACT:COMPONENT')];




const RouterContext = createContext(null);
const RouteContext = createContext({ params: {} });

// --- HashRouter (as before) ---
const createURL = (to) => (typeof to === "string" ? to : (to.pathname || "") + (to.search || "") + (to.hash || ""));

/**
 * Hash-based router component that syncs navigation state with the URL hash (#...).
 *
 * @param props - Component props.
 * @param props.children - Route definitions and/or components to render under this router.
 * @param [props.basename=""] - Optional base path prefix applied to all route paths.
 */
function HashRouter({ children, basename = "" }) {
	const readLocation = () => {
		const raw = window.location.hash || "#/";
		const full = raw.slice(1);
		const withoutBase = full.replace(new RegExp(`^${basename}`), "") || "/";
		const [pathAndSearch, hashPart] = withoutBase.split("#");
		const [path, search = ""] = pathAndSearch.split("?");
		return {
			pathname: path || "/",
			search: search ? "?" + search : "",
			hash: hashPart ? "#" + hashPart : "",
			state: history.state?.__state,
		};
	};

	const [location, setLocation] = useState(readLocation);
	useEffect(() => {
		const onHash = () => setLocation(readLocation());
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, [basename]);

	const navigate = useCallback((to, { replace = false, state } = {}) => {
		const url = createURL(to);
		const href = "#" + (basename + url);
		if (replace) history.replaceState({ __state: state }, "", href);
		else history.pushState({ __state: state }, "", href);
		setLocation(readLocation());
	}, [basename]);

	return  createComponent( RouterContext.Provider, { "value": { location, navigate, basename } }, children );
}

/**
 * Hook that returns the current location object (path, search, hash, and navigation state).
 *
 * @returns The current location data for the active router context.
 */
function useLocation() {
	const ctx = useContext(RouterContext);
	if (!ctx) throw new Error("useLocation must be used inside a Router");
	return ctx.location;
}

/**
 * Hook that returns a function used to imperatively navigate to a new location.
 *
 * @returns A navigate function for programmatic route changes (e.g., navigate(to, options)).
 */
function useNavigate() {
	const ctx = useContext(RouterContext);
	if (!ctx) throw new Error("useNavigate must be used inside a Router");
	return ctx.navigate;
}
function useParams() {
	const ctx = useContext(RouteContext);
	return ctx.params || {};
}

/**
 * Generic Link component that renders an anchor (<a>) and forwards common navigation/link attributes.
 *
 * @param props - Component props.
 * @param props.to - Target location (route or URL) the link points to.
 * @param [props.replace=false] - If true, uses history replacement semantics instead of pushing a new entry.
 * @param [props.state] - Optional state to associate with the navigation action.
 * @param [props.onClick] - Click handler invoked when the link is activated.
 * @param [props.target] - Specifies where to open the linked document (e.g., "_blank").
 * @param [props.download] - Sets the download behavior for the link (download attribute).
 * @param [props.className] - CSS class name(s) for styling the underlying element.
 * @param [props.style] - Inline style object applied to the underlying element.
 * @param [props.children] - Content rendered inside the link (link label, icons, etc.).
 * @param [props.rest] - Additional props forwarded to the underlying <a>.
 */
function Link({ to, replace = false, state, onClick, target, download, className, style, children, ...rest }) {
	const navigate = useNavigate();
	const href = "#" + createURL(to);
	function handleClick(e) {
		if (onClick) onClick(e);
		if (
			e.defaultPrevented ||
			e.button !== 0 ||
			(target && target !== "_self") ||
			e.metaKey || e.altKey || e.ctrlKey || e.shiftKey
		) return;
		e.preventDefault();
		navigate(to, { replace, state });
	}
	return (
		 createComponent( "a", { ...rest, "href": href, "onClick": handleClick, "target": target, "download": download, "className": className, "style": style }, children )
	);
}

function normalizePath(p) {
	if (!p) return "/";
	return p.replace(/\/+$/, "") || "/";
}


/**
 * React navigation link component (like a typed NavLink) that forwards props and supports common link attributes.
 *
 * @param props - Component props.
 * @param props.to - Target location (route) to navigate to.
 * @param [props.replace=false] - If true, replaces the current history entry instead of pushing a new one.
 * @param [props.state] - Optional navigation state passed along with the route transition.
 * @param [props.onClick] - Click handler invoked when the link is activated.
 * @param [props.target] - Sets the link target attribute (e.g., "_blank").
 * @param [props.download] - Enables download behavior for the link (sets the download attribute).
 * @param [props.className] - CSS class name(s) applied to the underlying element.
 * @param [props.style] - Inline styles applied to the underlying element.
 * @param [props.children] - Content rendered inside the link.
 * @param [props.rest] - Additional props forwarded to the underlying element.
 */
function NavLink({
	to,
	end = false,
	activeClassName = "active",
	className,
	activeStyle,
	style,
	replace = false,
	state,
	children,
	onClick,
	...rest
}) {
	const navigate = useNavigate();
	const location = useLocation();
	const targetPath = typeof to === "string" ? to.split("?")[0].split("#")[0] : (to.pathname || "/");
	const currentPath = location.pathname || "/";
	const isActive = end ? normalizePath(currentPath) === normalizePath(targetPath) : normalizePath(currentPath).startsWith(normalizePath(targetPath));
	const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;
	const finalClassName = [resolvedClassName, isActive ? activeClassName : null].filter(Boolean).join(" ") || undefined;
	const resolvedStyle = typeof style === "function" ? style({ isActive }) : style;
	const mergedStyle = isActive ? { ...(resolvedStyle || {}), ...(activeStyle || {}) } : resolvedStyle;
	const href = "#" + createURL(to);

	function handleClick(e) {
		if (onClick) onClick(e);
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
		e.preventDefault();
		navigate(to, { replace, state });
	}

	return (
		 createComponent( "a", { ...rest, "href": href, "onClick": handleClick, "className": finalClassName, "style": mergedStyle, "aria-current": isActive ? "page" : undefined }, typeof children === "function" ? children({ isActive }) : children )
	);
}

// --- Simple route matching utility ---
// supports params like /users/:id and wildcard * at end (e.g., /files/*)
function compilePath(pattern) {
	const paramNames = [];
	// escape regex and replace :param and * 
	let regexSource = "^" + pattern.replace(/\/+$/,"").replace(/([.+?^=!:${}()|[\]/\\])/g, "\\$1")
		.replace(/\\\:([A-Za-z0-9_]+)/g, (_, name) => {
			paramNames.push(name);
			return "([^/]+)";
		})
		.replace(/\\\*$/g, "(.+?)?"); // trailing * -> capture rest optional
	regexSource += "/?$";
	const regex = new RegExp(regexSource);
	return { regex, paramNames };
}

function matchPath(pattern, pathname) {
	if (pattern == null) return { matched: true, params: {} }; // <Route index> like
	const { regex, paramNames } = compilePath(pattern);
	const m = regex.exec(pathname);
	if (!m) return { matched: false };
	const params = {};
	paramNames.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1] || "")));
	// if wildcard captured as last group without a name, include as splat
	if (m.length > paramNames.length + 1) {
		params["*"] = m[paramNames.length + 1] ? decodeURIComponent(m[paramNames.length + 1]) : undefined;
	}
	return { matched: true, params };
}

// --- Route and Routes components ---
/**
 * Route configuration component that maps a URL path to a rendered element.
 *
 * @param props - Component props.
 * @param props.path - The path pattern this route should match (e.g., "/users/:id").
 * @param [props.element=null] - The React element to render when the route matches.
 * @param [props.children] - Optional nested route definitions or additional content under this route.
 */
function Route({ path, element = null, children }) {
	// Route is used as a descriptor only inside <Routes>
	return null;
}
/**
 * Route container component that groups multiple <Route> definitions.
 *
 * @param props - Component props.
 * @param props.children - One or more route elements to register under the router.
 */
function Routes({ children }) {
	const location = useLocation();
	const pathname = location.pathname || "/";
	// flatten children (React elements)
	const routes = Children.toArray(children);

	for (let i = 0; i < routes.length; i++) {
		const route = routes[i];
		// accept <Route path="..." element={<.../>} />
		const path = route.props.path === undefined ? null : route.props.path;
		const element = route.props.element ?? null;
		const childRoutes = route.props.children;

		const { matched, params } = matchPath(path, pathname);
		if (matched) {
			// if element is null but has children (nested routes), attempt to render nested Routes
			if (element) {
				return  createComponent( RouteContext.Provider, { "value": { params } }, element );
			} else if (childRoutes) {
				// render nested Routes within same params
				return  createComponent( RouteContext.Provider, { "value": { params } },  createComponent( Routes, {  }, childRoutes ) );
			} else {
				return  createComponent( RouteContext.Provider, { "value": { params } },  createComponent( "div", {  } ) );
			}
		}
	}

	// no match -> null
	return null;
}



//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9yb3V0ZXIuanN4Iiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9yb3V0ZXIuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQThCQzs7UUFFTztRQUNBOztvQ0FFNEI7bUNBQ0EsQUFBRCxVQUFXOztDQUU3QzttQkFDa0IsUUFBUSw4QkFBK0Isc0JBQXNCLG9CQUFvQjs7Q0FFbkc7Ozs7Ozs7MkJBTzJCLEFBQUQsOEJBQThCO3VCQUNsQyxNQUFNOzt5QkFFSjttQ0FDVSxVQUFXO3NEQUNRO2tEQUNKO1VBQ3hDOzs7Ozs7OzswQ0FRZ0M7V0FDOUIsQUFBRCxNQUFPO2lCQUNBLGlCQUFpQixZQUFhO3lCQUN0QjtTQUNoQixnQ0FBZ0M7Ozs4QkFHWCxBQUFELElBQU0sNkJBQTZCLFFBQU87dUJBQ2hEO3FCQUNGO0tBQ2hCLDhCQUErQixBQUFEO3dCQUNWLEFBQUQ7YUFDWCxZQUFhOzs7U0FHbEIsMkNBQWlFOzs7Q0FHekU7Ozs7OzRCQUsyQixHQUFHO3dCQUNQO0tBQ25CLHNCQUFzQjs7OztDQUkxQjs7Ozs7NEJBSzJCLEdBQUc7d0JBQ1A7S0FDbkIsc0JBQXNCOzs7bUJBR1IsR0FBRzt3QkFDRTt1QkFDRDs7O0NBR3RCOzs7Ozs7Ozs7Ozs7Ozs7cUJBZXFCLEFBQUQsaUdBQWlHOzhCQUN4Rjs4QkFDQTtzQkFDUixJQUFJO01BQ3BCLGlCQUFpQjtNQUNqQjs7O0dBR0Y7OzttQkFHZTtXQUNSLElBQUs7O1NBRVA7RUFDTiwrSEFDQzs7Ozt1QkFLbUIsSUFBSTtLQUN0QjtrQkFDYyxBQUFEOzs7O0NBSWpCOzs7Ozs7Ozs7Ozs7Ozs7d0JBZXdCLEFBQUQ7Ozs7Ozs7Ozs7OztJQVlwQjs4QkFDMEI7OEJBQ0E7c0RBQ3dCLGNBQWMsV0FBVzs7c0NBRXpDLCtCQUErQiw0QkFBNEIsd0JBQXdCLGFBQWM7dUVBQy9ELEFBQUQ7c0ZBQ2UsY0FBYzsyREFDeEMsQUFBRDtpQ0FDMUIsS0FBSyxpQkFBa0IsU0FBUSxlQUFnQjs4QkFDbEQ7O3NCQUVSLElBQUk7TUFDcEIsaUJBQWlCO01BQ2pCO21CQUNhO1dBQ1IsSUFBSzs7O1NBR1A7RUFDTixpSkFDQyx5Q0FBMkMsQUFBRDs7OztDQUs3QztDQUNBO3FCQUNvQixVQUFVOztFQUU3Qjt5Q0FDd0MsQUFBRCxtQkFBb0IsQUFBRDtXQUNoRCxBQUFELHdCQUF5QixhQUFhO2tCQUM5Qjs7O1dBR1AsQUFBRCxzQkFBc0I7OzBCQUVQO1NBQ2pCOzs7bUJBR1Usb0JBQW9CO0tBQ2xDLHlCQUF5Qix5QkFBeUIsTUFBTTtRQUNyRCxtQ0FBbUM7c0JBQ3JCO0tBQ2pCLFlBQVk7aUJBQ0E7b0JBQ0ksQUFBRCxVQUFXLDhCQUErQjtFQUM1RDtLQUNHLG1DQUFtQzs4REFDc0I7O1NBRXJEOzs7Q0FHUjtDQUNBOzs7Ozs7OztzQkFRc0IsQUFBRCxxQ0FBcUM7RUFDekQ7OztDQUdEOzs7Ozs7dUJBTXVCLEFBQUQsZUFBZTs4QkFDUjs7RUFFNUI7aUNBQytCOztNQUUzQixvQ0FBb0M7O0dBRXZDOzs7OztTQUtNLCtCQUErQjtNQUNsQyxVQUFVO0lBQ1o7T0FDRyxVQUFVO1lBQ0wscUJBQTBDO2NBQ3hDLGNBQWM7S0FDdkI7WUFDTyxxQkFBMEMsRUFBUTtXQUNuRDtZQUNDLHFCQUEwQzs7Ozs7RUFLcEQifQ==
;// ./src/accessories.jsx
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





/**
 * A CSS-only loading spinner component.
 * 
 * @param props Component props
 * @param props.size Spinner size in pixels (spinner element width/height). Default: `48`.
 * @param props.className Optional class applied to the outer container.
 * @param props.style Optional inline styles applied to the outer container.
 * @param props.color Color used for the animated segment (defaults to `currentColor`).
 * @param props.strokeWidth Ring/border thickness in pixels. Default: `3`.
 * @param props["aria-label"] Screen-reader label. Default: `"Loading"`.
 * @returns A centered spinner filling its parent container.
 */

function Spinner({
  size = 48,
  className,
  style,
  color = "currentColor",
  strokeWidth = 3,
  "aria-label": ariaLabel = "Loading",
}) {
  const s = Math.max(1, size)+"px";

  return (
     createComponent( "div", { "className": className, "style": {
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        ...style,
      }, "aria-label": ariaLabel, "role": "status" },  createComponent( "div", { "style": {
          width: s,
          height: s,
          borderRadius: "50%",
          border: `${strokeWidth}px solid rgba(0,0,0,0.15)`,
          borderTopColor: color,
          animation: "ddSpinnerSpin 0.9s linear infinite",
          boxSizing: "border-box",
        } } ),  createComponent( "style", {  }, `
        @keyframes ddSpinnerSpin { to { transform: rotate(360deg); } }
      ` ) )
  );
}



/**
 * ErrorBoundary component that catches errors in its child component tree and renders a fallback UI.
 *
 * @component
 *
 * @param {Object} props
 * @param {any} props.children - The component subtree to render and monitor for runtime errors.
 * @param {any} props.Fallback - UI to render when an error is caught. Receives two props:
 *  - `error` (the exception)
 *  - `reset` (function to clear the error)
 * @param {Function} props.onError - Callback invoked on error with arguments `(error, info)`.
 */

class ErrorBoundary extends Component {
	displayName = 'ErrorBoundary';
	
	state = { hasError: false, error: null };

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, info) {
		const { onError } = this.props;
		try { if (onError) onError(error, info); } catch (e) { console.error("onError threw", e); }
	}

	reset = () => this.setState({ hasError: false, error: null });

	render() {
		const { Fallback, children } = this.props;
		if (this.state.hasError) return  createComponent( Fallback, { "error": this.state.error, "reset": this.reset } );
		return children;
	}
}


/**
 * Suspense - boundary for asynchronous loading.
 * Shows a fallback UI while descendant thrown promises are pending, and renders real content once resolved.
 *
 * @component Suspense
 *
 * @param {Object} props
 * @param {any} props.fallback - Element shown while descendants are loading.
 * @param {any} props.children - Suspended children.
 * @param {any} props.minDelay - A delay before showing the fallback to prevent flicker.
 * @param {any} props.minShowTime - A minimum time of fallback visibility to prevent flickers.
 */

class Suspense extends Component 
{
	displayName = 'Suspense';

	static defaultProps = { minDelay: 200, minShowTime: 300 };

	constructor(props) {

		super(props);
/** @ignore */
		this.state = { showingFallback: false };

/** @ignore */
		this._pending = new Set();

/** @ignore */
		this._delayTimer = null;
/** @ignore */
		this._minShowTimer = null;
/** @ignore */
		this._fallbackShownAt = 0;
	}

/** @ignore */
	static getDerivedStateFromError(error) {
		if (Lilact.isThenable(error)) {
			// signal to call componentDidCatch where we handle the thenable
			return null;
		}
		// non-thenable errors should bubble to nearest Error Boundary
		throw error;
	}

/** @ignore */
	componentDidCatch(error) {
		if (!Lilact.isThenable(error)) return;

		const promise = error;

		if (this._pending.has(promise)) return;

		// Add to set of pending promises
		this._pending.add(promise);

		// Start delay timer only when this is the first pending promise
		if (this._pending.size === 1) {
			const delay = Math.max(0, this.props.minDelay);
			// Ensure no leftover timers
			if (this._delayTimer) {
				Lilact.clearTimeout(this._delayTimer);
				this._delayTimer = null;
			}
			this._delayTimer = Lilact.setTimeout(() => {
				this._delayTimer = null;
				this._fallbackShownAt = Date.now();
				this.setState({ showingFallback: true });
			}, delay);
		}
	}

/** @ignore */
	componentWillUnmount() {
		this._clearTimers();
		this._pending.clear();
	}

/** @ignore */
	_clearTimers() {
		if (this._delayTimer) {
			Lilact.clearTimeout(this._delayTimer);
			this._delayTimer = null;
		}
		if (this._minShowTimer) {
			Lilact.clearTimeout(this._minShowTimer);
			this._minShowTimer = null;
		}
	}

/** @ignore */
	_attachPromise(promise) {
		if (this._pending.has(promise)) return;
		this._pending.add(promise);

		if (this._pending.size === 1) {
			const delay = Math.max(0, this.props.minDelay);
			if (this._delayTimer) {
				Lilact.clearTimeout(this._delayTimer);
				this._delayTimer = null;
			}
			this._delayTimer = Lilact.setTimeout(() => {
				this._delayTimer = null;
				this._fallbackShownAt = Date.now();
				this.setState({ showingFallback: true });
			}, delay);
		}

		// use a wrapper so we can remove exactly this promise identity when settled
		const onSettled = () => {
			if (this._pending.has(promise)) {
				this._pending.delete(promise);
			}
			// If none left, hide fallback respecting minShowTime
			if (this._pending.size === 0) {
				// cancel delay if fallback hasn't shown yet
				if (this._delayTimer) {
					Lilact.clearTimeout(this._delayTimer);
					this._delayTimer = null;
					// fallback never shown; just ensure state is not showing
					this.setState({ showingFallback: false });
					return;
				}

				// If fallback is showing, ensure minShowTime
				const elapsed = Date.now() - (this._fallbackShownAt || 0);
				const remaining = Math.max(0, this.props.minShowTime - elapsed);

				if (remaining === 0) {
					this.setState({ showingFallback: false });
				} else {
					if (this._minShowTimer) {
						Lilact.clearTimeout(this._minShowTimer);
						this._minShowTimer = null;
					}
					this._minShowTimer = Lilact.setTimeout(() => {
						this._minShowTimer = null;
						this.setState({ showingFallback: false });
					}, remaining);
				}
			}
		};

		// attach handlers
		promise.then(onSettled, onSettled);
	}

/** @ignore */
	componentDidCatch(error, info) {
		if (!Lilact.isThenable(error)) return;
		this._attachPromise(error);
	}

/** @ignore */
	render() {
		if (this.state.showingFallback) {
			return  createComponent( Fragment, {  }, this.props.fallback );
		}
		return  createComponent( Fragment, {  }, this.props.children );
	}
}



//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9hY2Nlc3Nvcmllcy5qc3giLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIvVXNlcnMvYXJhc2gvRGVza3RvcC9Qcm9qZWN0cy9MaWxhY3Qvc3JjL2FjY2Vzc29yaWVzLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7UUE4QlE7UUFDQTtRQUNBOztDQUVQOzs7Ozs7Ozs7Ozs7O3dCQWF3QixBQUFEOzs7Ozs7O0lBT3BCO3FCQUNpQjs7VUFFWDtJQUNMOzs7Ozs7eUJBWUU7Ozs7Ozs7cUJBV0EsRUFBTzs7Ozs7Ozs7O0NBU2I7Ozs7Ozs7Ozs7Ozs7OENBYTZDOzs7VUFHcEM7O2lDQUV1QixRQUFRO1VBQy9COzs7bUJBR1MsY0FBYztTQUN4QjtPQUNGLEtBQUssaUJBQWlCLHVCQUF1QixJQUFJLGVBQWU7OztVQUc3RCxtQkFBb0IsQUFBRDs7UUFFckIsR0FBRztTQUNGO01BQ0gsNkJBQTZCOzs7Ozs7Q0FNbEM7Ozs7Ozs7Ozs7Ozs7O0NBY0E7Ozt3QkFHdUI7O2FBRVgsUUFBUTs7UUFFYjtDQUNQO2dCQUNlOztDQUVmOzBCQUN5Qjs7Q0FFekI7O0NBRUE7O0NBRUE7Ozs7Q0FJQTtpQ0FDZ0MsUUFBUTtNQUNuQyxpQkFBa0IsVUFBUztJQUM3Qjs7O0dBR0Q7Ozs7Q0FJRjttQkFDa0IsUUFBUTtNQUNyQixrQkFBbUI7Ozs7TUFJbkIsaUJBQWtCOztHQUVyQjtvQkFDaUI7O0dBRWpCO01BQ0csMkJBQTJCOzBCQUNQO0lBQ3RCO09BQ0csbUJBQW1CO3dCQUNGOzs7d0NBR2lCLEFBQUQsTUFBTzs7b0NBRVY7aUJBQ2xCLEFBQUQ7Ozs7O0NBS2pCO3NCQUNxQixHQUFHO29CQUNMO3NCQUNFOzs7Q0FHckI7Y0FDYSxHQUFHO01BQ1gsbUJBQW1CO3VCQUNGOzs7TUFHakIscUJBQXFCO3VCQUNKOzs7OztDQUt0QjtnQkFDZSxVQUFVO01BQ3BCLGlCQUFrQjtvQkFDSjs7TUFFZCwyQkFBMkI7MEJBQ1A7T0FDbkIsbUJBQW1CO3dCQUNGOzs7d0NBR2lCLEFBQUQsTUFBTzs7b0NBRVY7aUJBQ2xCLEFBQUQ7Ozs7R0FJZjtxQkFDa0IsTUFBTTtPQUNwQixpQkFBa0IsWUFBVzt5QkFDWDs7SUFFckI7T0FDRywyQkFBMkI7S0FDN0I7UUFDRyxtQkFBbUI7eUJBQ0Y7O01BRW5CO21CQUNjLEFBQUQ7Ozs7S0FJZDs2QkFDd0IsS0FBSzsrQkFDSDs7UUFFdkIsa0JBQWtCO21CQUNOLEFBQUQ7WUFDUDtTQUNILHFCQUFxQjswQkFDSjs7OzRDQUdtQixBQUFELE1BQU87O21CQUU5QixBQUFEOzs7Ozs7R0FNakI7ZUFDWTs7O0NBR2Q7bUJBQ2tCLGNBQWM7TUFDM0Isa0JBQW1CO3NCQUNIOzs7Q0FHckI7UUFDTyxHQUFHO01BQ0wsNkJBQTZCO1dBQ3hCLEVBQUU7O1VBRUgsRUFBRSJ9
;// ./src/pane.jsx




const clamp = (n, min, max) => {
  if (!Number.isFinite(n)) return n;
  return Math.min(max, Math.max(min, n));
};

/**
 * A split-pane container with a draggable splitter, supporting both horizontal and vertical layouts.
 *
 * The pane can be either:
 * - **Controlled** via the `position` prop (number between `min` and `max`), or
 * - **Uncontrolled** via `defaultPosition` (used as the initial position).
 *
 * Layout behavior:
 * - `mode="horizontal"`: the `position` controls the width of the **left** pane.
 * - `mode="vertical"`: the `position` controls the height of the **top** pane.
 *
 * Ref API:
 * - Exposes imperative methods on `ref.current`:
 *   - `getMode()` to get the current mode
 *   - `setMode(mode)` to switch between `"horizontal"` and `"vertical"`
 *   - `getPosition()` to get the current splitter position
 *   - `setPosition(position)` to update the splitter position
 *
 * Events:
 * - Calls `onSizeChange(position)` whenever the pane size/position changes (e.g., via dragging).
 *
 * Rendering:
 * - Renders `children` into two separate containers (no portals).
 *
 * @param mode - Split direction: `"horizontal"` or `"vertical"`. Defaults to `"horizontal"`.
 * @param position - Controlled splitter position. Normalized value within `[min, max]`.
 * If provided, the component uses this value instead of internal state.
 * @param defaultPosition - Initial splitter position for uncontrolled usage. Defaults to `0.5`.
 * @param min - Minimum allowed position. Defaults to `0.1`.
 * @param max - Maximum allowed position. Defaults to `0.9`.
 * @param splitterSize - Thickness of the draggable splitter in pixels. Defaults to `8`.
 * @param onSizeChange - Callback invoked when the position changes. Receives the new normalized position.
 * @param style - Optional root container styles.
 * @param className - Optional root container CSS class.
 * @param leftPaneStyle - Optional styles applied to the left pane (or top pane in vertical mode).
 * @param rightPaneStyle - Optional styles applied to the right pane (or bottom pane in vertical mode).
 * @param splitterStyle - Optional styles applied to the splitter element.
 * @param children - React children to be rendered into the two pane containers.
 *
 * @example
 * ```tsx
 * const ref = useRef<ResizablePaneHandle>(null);
 *
 * <ResizablePane
 *   ref={ref}
 *   mode="horizontal"
 *   defaultPosition={0.5}
 *   min={0.1}
 *   max={0.9}
 *   onSizeChange={(pos) => console.log(pos)}
 * >
 *   <div /> <div />
 * </ResizablePane>
 * ```
 */
const ResizablePane = forwardRef(function ResizablePane(
  {
    mode = "horizontal",
    position, // controlled: number | undefined/null
    defaultPosition = 0.5,
    min = 0.1,
    max = 0.9,
    splitterSize = 8,
    onSizeChange,
    style,
    className,
    leftPaneStyle,
    rightPaneStyle,
    splitterStyle,
    children,
  },
  ref
) {
  const containerRef = useRef(null);
  const panes = Children.toArray(children);
  const leftChild = panes[0] ?? null;
  const rightChild = panes[1] ?? null;

  const isControlled = position != null;

  const [internalMode, setInternalMode] = useState(mode);

  const [posUncontrolled, setPosUncontrolled] = useState(() =>
    clamp(
      position ?? defaultPosition,
      min,
      max
    )
  );

  useEffect(() => {
    if (mode != null) setInternalMode(mode);
  }, [mode]);

  // keep internal position clamped if min/max change (uncontrolled only)
  useLayoutEffect(() => {
    if (isControlled) return;
    setPosUncontrolled((p) => clamp(p, min, max));
  }, [min, max, isControlled]);

  const posResolved = isControlled ? clamp(position, min, max) : posUncontrolled;

  const setPosition = (next) => {
    const clamped = clamp(next, min, max);
    if (!isControlled) setPosUncontrolled(clamped);
    onSizeChange?.(clamped);
  };

  const draggingRef = useRef(false);
  const pointerIdRef = useRef(null);

  const updateFromClient = (clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    if (internalMode === "horizontal") {
      const usable = rect.width;
      if (!Number.isFinite(usable) || usable <= 0) return; // no jump on init
      const raw = (clientX - rect.left) / usable;
      if (!Number.isFinite(raw)) return;
      setPosition(raw);
    } else {
      const usable = rect.height;
      if (!Number.isFinite(usable) || usable <= 0) return; // no jump on init
      const raw = (clientY - rect.top) / usable;
      if (!Number.isFinite(raw)) return;
      setPosition(raw);
    }
  };

  // stable global listeners: only act while draggingRef.current === true
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) return;
      updateFromClient(e.clientX, e.clientY);
    };

    const stop = (e) => {
      if (!draggingRef.current) return;
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) return;
      draggingRef.current = false;
      pointerIdRef.current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", stop, { passive: true });
    window.addEventListener("pointercancel", stop, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [internalMode]); // updateFromClient uses internalMode

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();

    draggingRef.current = true;
    pointerIdRef.current = e.pointerId;

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}

    updateFromClient(e.clientX, e.clientY); // first update only if rect is sane
  };

  const onKeyDown = (e) => {
    const step = 0.02;
    let delta = 0;

    if (internalMode === "horizontal") {
      if (e.key === "ArrowLeft") delta = -step;
      if (e.key === "ArrowRight") delta = step;
    } else {
      if (e.key === "ArrowUp") delta = -step;
      if (e.key === "ArrowDown") delta = step;
    }

    if (delta !== 0) {
      e.preventDefault();
      setPosition(posResolved + delta);
    }
  };

  const sizes = useMemo(() => {
    const leftPct = `${posResolved * 100}%`;
    const rightCalc = `calc(${100 - posResolved * 100}% - ${splitterSize}px)`;
    return { leftPct, rightCalc };
  }, [posResolved, splitterSize]);

  const rootStyle = {
    display: "flex",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    touchAction: "none",
    ...(style || {}),
    flexDirection: internalMode === "horizontal" ? "row" : "column",
  };

  const leftPaneComputed =
    internalMode === "horizontal"
      ? { width: sizes.leftPct, flex: `0 0 ${sizes.leftPct}`, overflow: "auto", ...(leftPaneStyle || {}) }
      : { height: sizes.leftPct, flex: `0 0 ${sizes.leftPct}`, overflow: "auto", ...(leftPaneStyle || {}) };

  const rightPaneComputed =
    internalMode === "horizontal"
      ? { width: sizes.rightCalc, flex: "1 1 auto", overflow: "auto", ...(rightPaneStyle || {}) }
      : { height: sizes.rightCalc, flex: "1 1 auto", overflow: "auto", ...(rightPaneStyle || {}) };

  const splitterComputed =
    internalMode === "horizontal"
      ? { width: `${splitterSize}px`, height: '100%', flex: `0 0 ${splitterSize}px`, background: "rgba(0,0,0,0.08)", cursor: "col-resize", ...(splitterStyle || {}) }
      : { height: `${splitterSize}px`, width: '100%', flex: `0 0 ${splitterSize}px`, background: "rgba(0,0,0,0.08)", cursor: "row-resize", ...(splitterStyle || {}) };

  const dividerVisualStyle =
    internalMode === "horizontal"
      ? { height: "100%", width: "100%" }
      : { width: "100%", height: "100%" };

  useImperativeHandle(ref, () => ({
    setPosition,
    setMode: (nextMode) => setInternalMode(nextMode === "vertical" ? "vertical" : "horizontal"),
    getPosition: () => posResolved,
    getMode: () => internalMode,
  }));

  return (
     createComponent( "div", { "ref": containerRef, "className": className, "style": rootStyle },  createComponent( "div", { "style": leftPaneComputed }, leftChild ),  createComponent( "div", { "role": "separator", "aria-orientation": internalMode === "horizontal" ? "vertical" : "horizontal", "aria-valuemin": min, "aria-valuemax": max, "aria-valuenow": posResolved, "tabIndex": 0, "onPointerDown": onPointerDown, "onPointerCancel": () => {
          draggingRef.current = false;
          pointerIdRef.current = null;
        }, "onKeyDown": onKeyDown, "style": splitterComputed },  createComponent( "div", { "style": dividerVisualStyle } ) ),  createComponent( "div", { "style": rightPaneComputed }, rightChild ) )
  );
});




//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9wYW5lLmpzeCIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi9Vc2Vycy9hcmFzaC9EZXNrdG9wL1Byb2plY3RzL0xpbGFjdC9zcmMvcGFuZS5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTztRQUNDOzs7ZUFHTyxpQkFBaUI7TUFDMUIsZ0JBQWlCO2tCQUNMLGFBQWM7OztDQUcvQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3Q0F1RHVDLHNCQUF1QjtDQUM1RDs7YUFFWTs7Ozs7Ozs7Ozs7Ozs7RUFjWjs2QkFDMkI7Z0NBQ0c7Ozs7OztrREFNa0I7O3dEQUVPLEFBQUQ7UUFDL0M7Ozs7Ozs7V0FPRyxBQUFELE1BQU87TUFDWCw4QkFBOEI7OztFQUduQztpQkFDZ0IsQUFBRCxNQUFPO01BQ2pCO3FCQUNnQixBQUFELFlBQWE7OzswQ0FHTzs7c0JBRXBCLFVBQVU7eUJBQ1A7T0FDbEIsa0NBQWtDO2tCQUN2Qjs7OzRCQUdVOzZCQUNDOzsyQkFFRixzQkFBc0I7O09BRTFDOzt5Q0FFa0M7O09BRWxDLGdDQUFnQzs7U0FFOUIsZ0JBQWlCLGtDQUFpQztrQkFDekM7U0FDVCxnQkFBaUI7aUJBQ1Q7V0FDTjs7U0FFRixnQkFBaUIsa0NBQWlDO2tCQUN6QztTQUNULGdCQUFpQjtpQkFDVDs7OztFQUlmO1dBQ1UsQUFBRCxNQUFPO2tCQUNDLE9BQU87UUFDakI7UUFDQTtxQkFDYTs7O2dCQUdMLE9BQU87UUFDZjtRQUNBOzs7OzswQkFLa0IsdUJBQXdCOzBCQUN4QixtQkFBb0I7MEJBQ3BCLHVCQUF3Qjs7VUFFeEMsTUFBTTsrQkFDZTsrQkFDQTsrQkFDQTs7c0JBRVY7O3dCQUVFLE9BQU87T0FDeEI7b0JBQ2E7Ozs7O1FBS1o7eUNBQ2lDO1lBQzdCOztvQkFFUSx3QkFBd0I7OztvQkFHeEIsT0FBTzs7OztPQUlwQixnQ0FBZ0M7U0FDOUI7U0FDQTtXQUNFO1NBQ0Y7U0FDQTs7O09BR0YsY0FBYztzQkFDQztpQkFDTDs7Ozt1QkFJTyxBQUFELE1BQU87OztVQUduQjs7O29CQUdTOzs7Ozs7T0FNYixTQUFVOzs7Ozs7UUFNVCwyRUFBMkUsaUJBQWtCO1FBQzdGLDRFQUE0RSxpQkFBa0I7Ozs7UUFJOUYsaUVBQWlFLGtCQUFtQjtRQUNwRixrRUFBa0Usa0JBQW1COzs7O1FBSXJGLHNJQUFzSSxpQkFBa0I7UUFDeEosc0lBQXNJLGlCQUFrQjs7OztRQUl4SjtRQUNBOztxQkFFYSxLQUFNLE1BQU8sQUFBRDs7V0FFcEIsNkJBQTZCO2VBQ3pCO1dBQ0o7OztTQUdKO0dBQ0wsaUVBQ0UsMkJBQThCLDBDQUU5Qjs7O0tBZUUsMkZBR0YsNEJBQStCIn0=
// EXTERNAL MODULE: ./src/jsx.js
var jsx = __webpack_require__(207);
;// ./src/lilact.jsx
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



























/**
 * @namespace Lilact
 * 
 * @property PropTypes - Handle to the PropTypes runtime type-checking library (https://github.com/facebook/prop-types).
 * @property Redux - Handle to Redux’s public API (https://github.com/reduxjs/redux).
 * @property emotion - Handle to Emotion’s CSS-in-JS package for styling (https://github.com/emotion-js/emotion).
 */
const lilact_Lilact = 
{	

	VERSION: "beta.8",
	
	// Configuration

	defaultTransitionTimeout: 300,
	defaultIsEqual: Object.is, // note: `Lilact.shallowEqual` and `Lilact.deepEqual` are also available, 
								  					 // user can set it in your initializer code, and can be changed later too.
	
	// Units 

	...misc_namespaceObject,
	...run,
	...components_namespaceObject,
	...hooks_namespaceObject,
	...transition_namespaceObject,
	...src_redux_namespaceObject,
	...timers_namespaceObject,
	...events_namespaceObject,
	...errors_namespaceObject,

	...router_namespaceObject,
	...accessories_namespaceObject,

	ResizablePane: ResizablePane,

	transpileJSX: jsx.transpileJSX,
	transpilerConfig: jsx.transpilerConfig,

	// Dependencies
	PropTypes: (prop_types_default()),
	redux: redux_namespaceObject,
	emotion: emotion_css_development_esm_namespaceObject,

}

globalThis.Lilact = lilact_Lilact;

document.addEventListener('DOMContentLoaded', () => {
  lilact_Lilact.runScripts();
});

window.addEventListener('error', (e) => {
	lilact_Lilact.globalErrorHandler(e);
});

	console.log(`Lilact (Version: ${lilact_Lilact.VERSION}) - Debug Mode`);
	console.log(`Copyright(C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>`);

/* harmony default export */ const lilact = (lilact_Lilact);

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9saWxhY3QuanN4Iiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9saWxhY3QuanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FBa0RROztRQUVBOzs7O0NBSVA7Ozs7Ozs7O0NBUUE7Ozs7RUFJQzs7OzZCQUcyQjtpQkFDWjs7RUFFZjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7RUFvQkE7Ozs7Ozs7OzswQkFTd0Isb0JBQXFCLE1BQU07bUJBQ2pDOzs7d0JBSUksU0FBVSxPQUFPOzBCQUNkOzs7YUFLZDthQUNBIn0=

/***/ }),

/***/ 363:
/*!****************************************!*\
  !*** ./node_modules/react-is/index.js ***!
  \****************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {



if (false) // removed by dead control flow
{} else {
  module.exports = __webpack_require__(/*! ./cjs/react-is.development.js */ 413);
}


/***/ }),

/***/ 376:
/*!********************************************!*\
  !*** ./node_modules/prop-types/lib/has.js ***!
  \********************************************/
/***/ ((module) => {

module.exports = Function.call.bind(Object.prototype.hasOwnProperty);


/***/ }),

/***/ 413:
/*!***********************************************************!*\
  !*** ./node_modules/react-is/cjs/react-is.development.js ***!
  \***********************************************************/
/***/ ((__unused_webpack_module, exports) => {

/** @license React v16.13.1
 * react-is.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */





if (true) {
  (function() {
'use strict';

// The Symbol used to tag the ReactElement-like types. If there is no native Symbol
// nor polyfill, then a plain number is used for performance.
var hasSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = hasSymbol ? Symbol.for('react.element') : 0xeac7;
var REACT_PORTAL_TYPE = hasSymbol ? Symbol.for('react.portal') : 0xeaca;
var REACT_FRAGMENT_TYPE = hasSymbol ? Symbol.for('react.fragment') : 0xeacb;
var REACT_STRICT_MODE_TYPE = hasSymbol ? Symbol.for('react.strict_mode') : 0xeacc;
var REACT_PROFILER_TYPE = hasSymbol ? Symbol.for('react.profiler') : 0xead2;
var REACT_PROVIDER_TYPE = hasSymbol ? Symbol.for('react.provider') : 0xeacd;
var REACT_CONTEXT_TYPE = hasSymbol ? Symbol.for('react.context') : 0xeace; // TODO: We don't use AsyncMode or ConcurrentMode anymore. They were temporary
// (unstable) APIs that have been removed. Can we remove the symbols?

var REACT_ASYNC_MODE_TYPE = hasSymbol ? Symbol.for('react.async_mode') : 0xeacf;
var REACT_CONCURRENT_MODE_TYPE = hasSymbol ? Symbol.for('react.concurrent_mode') : 0xeacf;
var REACT_FORWARD_REF_TYPE = hasSymbol ? Symbol.for('react.forward_ref') : 0xead0;
var REACT_SUSPENSE_TYPE = hasSymbol ? Symbol.for('react.suspense') : 0xead1;
var REACT_SUSPENSE_LIST_TYPE = hasSymbol ? Symbol.for('react.suspense_list') : 0xead8;
var REACT_MEMO_TYPE = hasSymbol ? Symbol.for('react.memo') : 0xead3;
var REACT_LAZY_TYPE = hasSymbol ? Symbol.for('react.lazy') : 0xead4;
var REACT_BLOCK_TYPE = hasSymbol ? Symbol.for('react.block') : 0xead9;
var REACT_FUNDAMENTAL_TYPE = hasSymbol ? Symbol.for('react.fundamental') : 0xead5;
var REACT_RESPONDER_TYPE = hasSymbol ? Symbol.for('react.responder') : 0xead6;
var REACT_SCOPE_TYPE = hasSymbol ? Symbol.for('react.scope') : 0xead7;

function isValidElementType(type) {
  return typeof type === 'string' || typeof type === 'function' || // Note: its typeof might be other than 'symbol' or 'number' if it's a polyfill.
  type === REACT_FRAGMENT_TYPE || type === REACT_CONCURRENT_MODE_TYPE || type === REACT_PROFILER_TYPE || type === REACT_STRICT_MODE_TYPE || type === REACT_SUSPENSE_TYPE || type === REACT_SUSPENSE_LIST_TYPE || typeof type === 'object' && type !== null && (type.$$typeof === REACT_LAZY_TYPE || type.$$typeof === REACT_MEMO_TYPE || type.$$typeof === REACT_PROVIDER_TYPE || type.$$typeof === REACT_CONTEXT_TYPE || type.$$typeof === REACT_FORWARD_REF_TYPE || type.$$typeof === REACT_FUNDAMENTAL_TYPE || type.$$typeof === REACT_RESPONDER_TYPE || type.$$typeof === REACT_SCOPE_TYPE || type.$$typeof === REACT_BLOCK_TYPE);
}

function typeOf(object) {
  if (typeof object === 'object' && object !== null) {
    var $$typeof = object.$$typeof;

    switch ($$typeof) {
      case REACT_ELEMENT_TYPE:
        var type = object.type;

        switch (type) {
          case REACT_ASYNC_MODE_TYPE:
          case REACT_CONCURRENT_MODE_TYPE:
          case REACT_FRAGMENT_TYPE:
          case REACT_PROFILER_TYPE:
          case REACT_STRICT_MODE_TYPE:
          case REACT_SUSPENSE_TYPE:
            return type;

          default:
            var $$typeofType = type && type.$$typeof;

            switch ($$typeofType) {
              case REACT_CONTEXT_TYPE:
              case REACT_FORWARD_REF_TYPE:
              case REACT_LAZY_TYPE:
              case REACT_MEMO_TYPE:
              case REACT_PROVIDER_TYPE:
                return $$typeofType;

              default:
                return $$typeof;
            }

        }

      case REACT_PORTAL_TYPE:
        return $$typeof;
    }
  }

  return undefined;
} // AsyncMode is deprecated along with isAsyncMode

var AsyncMode = REACT_ASYNC_MODE_TYPE;
var ConcurrentMode = REACT_CONCURRENT_MODE_TYPE;
var ContextConsumer = REACT_CONTEXT_TYPE;
var ContextProvider = REACT_PROVIDER_TYPE;
var Element = REACT_ELEMENT_TYPE;
var ForwardRef = REACT_FORWARD_REF_TYPE;
var Fragment = REACT_FRAGMENT_TYPE;
var Lazy = REACT_LAZY_TYPE;
var Memo = REACT_MEMO_TYPE;
var Portal = REACT_PORTAL_TYPE;
var Profiler = REACT_PROFILER_TYPE;
var StrictMode = REACT_STRICT_MODE_TYPE;
var Suspense = REACT_SUSPENSE_TYPE;
var hasWarnedAboutDeprecatedIsAsyncMode = false; // AsyncMode should be deprecated

function isAsyncMode(object) {
  {
    if (!hasWarnedAboutDeprecatedIsAsyncMode) {
      hasWarnedAboutDeprecatedIsAsyncMode = true; // Using console['warn'] to evade Babel and ESLint

      console['warn']('The ReactIs.isAsyncMode() alias has been deprecated, ' + 'and will be removed in React 17+. Update your code to use ' + 'ReactIs.isConcurrentMode() instead. It has the exact same API.');
    }
  }

  return isConcurrentMode(object) || typeOf(object) === REACT_ASYNC_MODE_TYPE;
}
function isConcurrentMode(object) {
  return typeOf(object) === REACT_CONCURRENT_MODE_TYPE;
}
function isContextConsumer(object) {
  return typeOf(object) === REACT_CONTEXT_TYPE;
}
function isContextProvider(object) {
  return typeOf(object) === REACT_PROVIDER_TYPE;
}
function isElement(object) {
  return typeof object === 'object' && object !== null && object.$$typeof === REACT_ELEMENT_TYPE;
}
function isForwardRef(object) {
  return typeOf(object) === REACT_FORWARD_REF_TYPE;
}
function isFragment(object) {
  return typeOf(object) === REACT_FRAGMENT_TYPE;
}
function isLazy(object) {
  return typeOf(object) === REACT_LAZY_TYPE;
}
function isMemo(object) {
  return typeOf(object) === REACT_MEMO_TYPE;
}
function isPortal(object) {
  return typeOf(object) === REACT_PORTAL_TYPE;
}
function isProfiler(object) {
  return typeOf(object) === REACT_PROFILER_TYPE;
}
function isStrictMode(object) {
  return typeOf(object) === REACT_STRICT_MODE_TYPE;
}
function isSuspense(object) {
  return typeOf(object) === REACT_SUSPENSE_TYPE;
}

exports.AsyncMode = AsyncMode;
exports.ConcurrentMode = ConcurrentMode;
exports.ContextConsumer = ContextConsumer;
exports.ContextProvider = ContextProvider;
exports.Element = Element;
exports.ForwardRef = ForwardRef;
exports.Fragment = Fragment;
exports.Lazy = Lazy;
exports.Memo = Memo;
exports.Portal = Portal;
exports.Profiler = Profiler;
exports.StrictMode = StrictMode;
exports.Suspense = Suspense;
exports.isAsyncMode = isAsyncMode;
exports.isConcurrentMode = isConcurrentMode;
exports.isContextConsumer = isContextConsumer;
exports.isContextProvider = isContextProvider;
exports.isElement = isElement;
exports.isForwardRef = isForwardRef;
exports.isFragment = isFragment;
exports.isLazy = isLazy;
exports.isMemo = isMemo;
exports.isPortal = isPortal;
exports.isProfiler = isProfiler;
exports.isStrictMode = isStrictMode;
exports.isSuspense = isSuspense;
exports.isValidElementType = isValidElementType;
exports.typeOf = typeOf;
  })();
}


/***/ }),

/***/ 556:
/*!******************************************!*\
  !*** ./node_modules/prop-types/index.js ***!
  \******************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

if (true) {
  var ReactIs = __webpack_require__(/*! react-is */ 363);

  // By explicitly using `prop-types` you are opting into new development behavior.
  // http://fb.me/prop-types-in-prod
  var throwOnDirectAccess = true;
  module.exports = __webpack_require__(/*! ./factoryWithTypeCheckers */ 574)(ReactIs.isElement, throwOnDirectAccess);
} else // removed by dead control flow
{}


/***/ }),

/***/ 574:
/*!************************************************************!*\
  !*** ./node_modules/prop-types/factoryWithTypeCheckers.js ***!
  \************************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var ReactIs = __webpack_require__(/*! react-is */ 363);
var assign = __webpack_require__(/*! object-assign */ 228);

var ReactPropTypesSecret = __webpack_require__(/*! ./lib/ReactPropTypesSecret */ 925);
var has = __webpack_require__(/*! ./lib/has */ 376);
var checkPropTypes = __webpack_require__(/*! ./checkPropTypes */ 847);

var printWarning = function() {};

if (true) {
  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) {}
  };
}

function emptyFunctionThatReturnsNull() {
  return null;
}

module.exports = function(isValidElement, throwOnDirectAccess) {
  /* global Symbol */
  var ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator'; // Before Symbol spec.

  /**
   * Returns the iterator method function contained on the iterable object.
   *
   * Be sure to invoke the function with the iterable as context:
   *
   *     var iteratorFn = getIteratorFn(myIterable);
   *     if (iteratorFn) {
   *       var iterator = iteratorFn.call(myIterable);
   *       ...
   *     }
   *
   * @param {?object} maybeIterable
   * @return {?function}
   */
  function getIteratorFn(maybeIterable) {
    var iteratorFn = maybeIterable && (ITERATOR_SYMBOL && maybeIterable[ITERATOR_SYMBOL] || maybeIterable[FAUX_ITERATOR_SYMBOL]);
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  /**
   * Collection of methods that allow declaration and validation of props that are
   * supplied to React components. Example usage:
   *
   *   var Props = require('ReactPropTypes');
   *   var MyArticle = React.createClass({
   *     propTypes: {
   *       // An optional string prop named "description".
   *       description: Props.string,
   *
   *       // A required enum prop named "category".
   *       category: Props.oneOf(['News','Photos']).isRequired,
   *
   *       // A prop named "dialog" that requires an instance of Dialog.
   *       dialog: Props.instanceOf(Dialog).isRequired
   *     },
   *     render: function() { ... }
   *   });
   *
   * A more formal specification of how these methods are used:
   *
   *   type := array|bool|func|object|number|string|oneOf([...])|instanceOf(...)
   *   decl := ReactPropTypes.{type}(.isRequired)?
   *
   * Each and every declaration produces a function with the same signature. This
   * allows the creation of custom validation functions. For example:
   *
   *  var MyLink = React.createClass({
   *    propTypes: {
   *      // An optional string or URI prop named "href".
   *      href: function(props, propName, componentName) {
   *        var propValue = props[propName];
   *        if (propValue != null && typeof propValue !== 'string' &&
   *            !(propValue instanceof URI)) {
   *          return new Error(
   *            'Expected a string or an URI for ' + propName + ' in ' +
   *            componentName
   *          );
   *        }
   *      }
   *    },
   *    render: function() {...}
   *  });
   *
   * @internal
   */

  var ANONYMOUS = '<<anonymous>>';

  // Important!
  // Keep this list in sync with production version in `./factoryWithThrowingShims.js`.
  var ReactPropTypes = {
    array: createPrimitiveTypeChecker('array'),
    bigint: createPrimitiveTypeChecker('bigint'),
    bool: createPrimitiveTypeChecker('boolean'),
    func: createPrimitiveTypeChecker('function'),
    number: createPrimitiveTypeChecker('number'),
    object: createPrimitiveTypeChecker('object'),
    string: createPrimitiveTypeChecker('string'),
    symbol: createPrimitiveTypeChecker('symbol'),

    any: createAnyTypeChecker(),
    arrayOf: createArrayOfTypeChecker,
    element: createElementTypeChecker(),
    elementType: createElementTypeTypeChecker(),
    instanceOf: createInstanceTypeChecker,
    node: createNodeChecker(),
    objectOf: createObjectOfTypeChecker,
    oneOf: createEnumTypeChecker,
    oneOfType: createUnionTypeChecker,
    shape: createShapeTypeChecker,
    exact: createStrictShapeTypeChecker,
  };

  /**
   * inlined Object.is polyfill to avoid requiring consumers ship their own
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is
   */
  /*eslint-disable no-self-compare*/
  function is(x, y) {
    // SameValue algorithm
    if (x === y) {
      // Steps 1-5, 7-10
      // Steps 6.b-6.e: +0 != -0
      return x !== 0 || 1 / x === 1 / y;
    } else {
      // Step 6.a: NaN == NaN
      return x !== x && y !== y;
    }
  }
  /*eslint-enable no-self-compare*/

  /**
   * We use an Error-like object for backward compatibility as people may call
   * PropTypes directly and inspect their output. However, we don't use real
   * Errors anymore. We don't inspect their stack anyway, and creating them
   * is prohibitively expensive if they are created too often, such as what
   * happens in oneOfType() for any type before the one that matched.
   */
  function PropTypeError(message, data) {
    this.message = message;
    this.data = data && typeof data === 'object' ? data: {};
    this.stack = '';
  }
  // Make `instanceof Error` still work for returned errors.
  PropTypeError.prototype = Error.prototype;

  function createChainableTypeChecker(validate) {
    if (true) {
      var manualPropTypeCallCache = {};
      var manualPropTypeWarningCount = 0;
    }
    function checkType(isRequired, props, propName, componentName, location, propFullName, secret) {
      componentName = componentName || ANONYMOUS;
      propFullName = propFullName || propName;

      if (secret !== ReactPropTypesSecret) {
        if (throwOnDirectAccess) {
          // New behavior only for users of `prop-types` package
          var err = new Error(
            'Calling PropTypes validators directly is not supported by the `prop-types` package. ' +
            'Use `PropTypes.checkPropTypes()` to call them. ' +
            'Read more at http://fb.me/use-check-prop-types'
          );
          err.name = 'Invariant Violation';
          throw err;
        } else if ( true && typeof console !== 'undefined') {
          // Old behavior for people using React.PropTypes
          var cacheKey = componentName + ':' + propName;
          if (
            !manualPropTypeCallCache[cacheKey] &&
            // Avoid spamming the console because they are often not actionable except for lib authors
            manualPropTypeWarningCount < 3
          ) {
            printWarning(
              'You are manually calling a React.PropTypes validation ' +
              'function for the `' + propFullName + '` prop on `' + componentName + '`. This is deprecated ' +
              'and will throw in the standalone `prop-types` package. ' +
              'You may be seeing this warning due to a third-party PropTypes ' +
              'library. See https://fb.me/react-warning-dont-call-proptypes ' + 'for details.'
            );
            manualPropTypeCallCache[cacheKey] = true;
            manualPropTypeWarningCount++;
          }
        }
      }
      if (props[propName] == null) {
        if (isRequired) {
          if (props[propName] === null) {
            return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required ' + ('in `' + componentName + '`, but its value is `null`.'));
          }
          return new PropTypeError('The ' + location + ' `' + propFullName + '` is marked as required in ' + ('`' + componentName + '`, but its value is `undefined`.'));
        }
        return null;
      } else {
        return validate(props, propName, componentName, location, propFullName);
      }
    }

    var chainedCheckType = checkType.bind(null, false);
    chainedCheckType.isRequired = checkType.bind(null, true);

    return chainedCheckType;
  }

  function createPrimitiveTypeChecker(expectedType) {
    function validate(props, propName, componentName, location, propFullName, secret) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== expectedType) {
        // `propValue` being instance of, say, date/regexp, pass the 'object'
        // check, but we can offer a more precise error message here rather than
        // 'of type `object`'.
        var preciseType = getPreciseType(propValue);

        return new PropTypeError(
          'Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + preciseType + '` supplied to `' + componentName + '`, expected ') + ('`' + expectedType + '`.'),
          {expectedType: expectedType}
        );
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createAnyTypeChecker() {
    return createChainableTypeChecker(emptyFunctionThatReturnsNull);
  }

  function createArrayOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside arrayOf.');
      }
      var propValue = props[propName];
      if (!Array.isArray(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an array.'));
      }
      for (var i = 0; i < propValue.length; i++) {
        var error = typeChecker(propValue, i, componentName, location, propFullName + '[' + i + ']', ReactPropTypesSecret);
        if (error instanceof Error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!isValidElement(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createElementTypeTypeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      if (!ReactIs.isValidElementType(propValue)) {
        var propType = getPropType(propValue);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected a single ReactElement type.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createInstanceTypeChecker(expectedClass) {
    function validate(props, propName, componentName, location, propFullName) {
      if (!(props[propName] instanceof expectedClass)) {
        var expectedClassName = expectedClass.name || ANONYMOUS;
        var actualClassName = getClassName(props[propName]);
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + actualClassName + '` supplied to `' + componentName + '`, expected ') + ('instance of `' + expectedClassName + '`.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createEnumTypeChecker(expectedValues) {
    if (!Array.isArray(expectedValues)) {
      if (true) {
        if (arguments.length > 1) {
          printWarning(
            'Invalid arguments supplied to oneOf, expected an array, got ' + arguments.length + ' arguments. ' +
            'A common mistake is to write oneOf(x, y, z) instead of oneOf([x, y, z]).'
          );
        } else {
          printWarning('Invalid argument supplied to oneOf, expected an array.');
        }
      }
      return emptyFunctionThatReturnsNull;
    }

    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      for (var i = 0; i < expectedValues.length; i++) {
        if (is(propValue, expectedValues[i])) {
          return null;
        }
      }

      var valuesString = JSON.stringify(expectedValues, function replacer(key, value) {
        var type = getPreciseType(value);
        if (type === 'symbol') {
          return String(value);
        }
        return value;
      });
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of value `' + String(propValue) + '` ' + ('supplied to `' + componentName + '`, expected one of ' + valuesString + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createObjectOfTypeChecker(typeChecker) {
    function validate(props, propName, componentName, location, propFullName) {
      if (typeof typeChecker !== 'function') {
        return new PropTypeError('Property `' + propFullName + '` of component `' + componentName + '` has invalid PropType notation inside objectOf.');
      }
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type ' + ('`' + propType + '` supplied to `' + componentName + '`, expected an object.'));
      }
      for (var key in propValue) {
        if (has(propValue, key)) {
          var error = typeChecker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
          if (error instanceof Error) {
            return error;
          }
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createUnionTypeChecker(arrayOfTypeCheckers) {
    if (!Array.isArray(arrayOfTypeCheckers)) {
       true ? printWarning('Invalid argument supplied to oneOfType, expected an instance of array.') : 0;
      return emptyFunctionThatReturnsNull;
    }

    for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
      var checker = arrayOfTypeCheckers[i];
      if (typeof checker !== 'function') {
        printWarning(
          'Invalid argument supplied to oneOfType. Expected an array of check functions, but ' +
          'received ' + getPostfixForTypeWarning(checker) + ' at index ' + i + '.'
        );
        return emptyFunctionThatReturnsNull;
      }
    }

    function validate(props, propName, componentName, location, propFullName) {
      var expectedTypes = [];
      for (var i = 0; i < arrayOfTypeCheckers.length; i++) {
        var checker = arrayOfTypeCheckers[i];
        var checkerResult = checker(props, propName, componentName, location, propFullName, ReactPropTypesSecret);
        if (checkerResult == null) {
          return null;
        }
        if (checkerResult.data && has(checkerResult.data, 'expectedType')) {
          expectedTypes.push(checkerResult.data.expectedType);
        }
      }
      var expectedTypesMessage = (expectedTypes.length > 0) ? ', expected one of type [' + expectedTypes.join(', ') + ']': '';
      return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`' + expectedTypesMessage + '.'));
    }
    return createChainableTypeChecker(validate);
  }

  function createNodeChecker() {
    function validate(props, propName, componentName, location, propFullName) {
      if (!isNode(props[propName])) {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` supplied to ' + ('`' + componentName + '`, expected a ReactNode.'));
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function invalidValidatorError(componentName, location, propFullName, key, type) {
    return new PropTypeError(
      (componentName || 'React class') + ': ' + location + ' type `' + propFullName + '.' + key + '` is invalid; ' +
      'it must be a function, usually from the `prop-types` package, but received `' + type + '`.'
    );
  }

  function createShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      for (var key in shapeTypes) {
        var checker = shapeTypes[key];
        if (typeof checker !== 'function') {
          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }
    return createChainableTypeChecker(validate);
  }

  function createStrictShapeTypeChecker(shapeTypes) {
    function validate(props, propName, componentName, location, propFullName) {
      var propValue = props[propName];
      var propType = getPropType(propValue);
      if (propType !== 'object') {
        return new PropTypeError('Invalid ' + location + ' `' + propFullName + '` of type `' + propType + '` ' + ('supplied to `' + componentName + '`, expected `object`.'));
      }
      // We need to check all keys in case some are required but missing from props.
      var allKeys = assign({}, props[propName], shapeTypes);
      for (var key in allKeys) {
        var checker = shapeTypes[key];
        if (has(shapeTypes, key) && typeof checker !== 'function') {
          return invalidValidatorError(componentName, location, propFullName, key, getPreciseType(checker));
        }
        if (!checker) {
          return new PropTypeError(
            'Invalid ' + location + ' `' + propFullName + '` key `' + key + '` supplied to `' + componentName + '`.' +
            '\nBad object: ' + JSON.stringify(props[propName], null, '  ') +
            '\nValid keys: ' + JSON.stringify(Object.keys(shapeTypes), null, '  ')
          );
        }
        var error = checker(propValue, key, componentName, location, propFullName + '.' + key, ReactPropTypesSecret);
        if (error) {
          return error;
        }
      }
      return null;
    }

    return createChainableTypeChecker(validate);
  }

  function isNode(propValue) {
    switch (typeof propValue) {
      case 'number':
      case 'string':
      case 'undefined':
        return true;
      case 'boolean':
        return !propValue;
      case 'object':
        if (Array.isArray(propValue)) {
          return propValue.every(isNode);
        }
        if (propValue === null || isValidElement(propValue)) {
          return true;
        }

        var iteratorFn = getIteratorFn(propValue);
        if (iteratorFn) {
          var iterator = iteratorFn.call(propValue);
          var step;
          if (iteratorFn !== propValue.entries) {
            while (!(step = iterator.next()).done) {
              if (!isNode(step.value)) {
                return false;
              }
            }
          } else {
            // Iterator will provide entry [k,v] tuples rather than values.
            while (!(step = iterator.next()).done) {
              var entry = step.value;
              if (entry) {
                if (!isNode(entry[1])) {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }

        return true;
      default:
        return false;
    }
  }

  function isSymbol(propType, propValue) {
    // Native Symbol.
    if (propType === 'symbol') {
      return true;
    }

    // falsy value can't be a Symbol
    if (!propValue) {
      return false;
    }

    // 19.4.3.5 Symbol.prototype[@@toStringTag] === 'Symbol'
    if (propValue['@@toStringTag'] === 'Symbol') {
      return true;
    }

    // Fallback for non-spec compliant Symbols which are polyfilled.
    if (typeof Symbol === 'function' && propValue instanceof Symbol) {
      return true;
    }

    return false;
  }

  // Equivalent of `typeof` but with special handling for array and regexp.
  function getPropType(propValue) {
    var propType = typeof propValue;
    if (Array.isArray(propValue)) {
      return 'array';
    }
    if (propValue instanceof RegExp) {
      // Old webkits (at least until Android 4.0) return 'function' rather than
      // 'object' for typeof a RegExp. We'll normalize this here so that /bla/
      // passes PropTypes.object.
      return 'object';
    }
    if (isSymbol(propType, propValue)) {
      return 'symbol';
    }
    return propType;
  }

  // This handles more types than `getPropType`. Only used for error messages.
  // See `createPrimitiveTypeChecker`.
  function getPreciseType(propValue) {
    if (typeof propValue === 'undefined' || propValue === null) {
      return '' + propValue;
    }
    var propType = getPropType(propValue);
    if (propType === 'object') {
      if (propValue instanceof Date) {
        return 'date';
      } else if (propValue instanceof RegExp) {
        return 'regexp';
      }
    }
    return propType;
  }

  // Returns a string that is postfixed to a warning about an invalid type.
  // For example, "undefined" or "of type array"
  function getPostfixForTypeWarning(value) {
    var type = getPreciseType(value);
    switch (type) {
      case 'array':
      case 'object':
        return 'an ' + type;
      case 'boolean':
      case 'date':
      case 'regexp':
        return 'a ' + type;
      default:
        return type;
    }
  }

  // Returns class name of the object, if any.
  function getClassName(propValue) {
    if (!propValue.constructor || !propValue.constructor.name) {
      return ANONYMOUS;
    }
    return propValue.constructor.name;
  }

  ReactPropTypes.checkPropTypes = checkPropTypes;
  ReactPropTypes.resetWarningCache = checkPropTypes.resetWarningCache;
  ReactPropTypes.PropTypes = ReactPropTypes;

  return ReactPropTypes;
};


/***/ }),

/***/ 847:
/*!***************************************************!*\
  !*** ./node_modules/prop-types/checkPropTypes.js ***!
  \***************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var printWarning = function() {};

if (true) {
  var ReactPropTypesSecret = __webpack_require__(/*! ./lib/ReactPropTypesSecret */ 925);
  var loggedTypeFailures = {};
  var has = __webpack_require__(/*! ./lib/has */ 376);

  printWarning = function(text) {
    var message = 'Warning: ' + text;
    if (typeof console !== 'undefined') {
      console.error(message);
    }
    try {
      // --- Welcome to debugging React ---
      // This error was thrown as a convenience so that you can use this stack
      // to find the callsite that caused this warning to fire.
      throw new Error(message);
    } catch (x) { /**/ }
  };
}

/**
 * Assert that the values match with the type specs.
 * Error messages are memorized and will only be shown once.
 *
 * @param {object} typeSpecs Map of name to a ReactPropType
 * @param {object} values Runtime values that need to be type-checked
 * @param {string} location e.g. "prop", "context", "child context"
 * @param {string} componentName Name of the component for error messages.
 * @param {?Function} getStack Returns the component stack.
 * @private
 */
function checkPropTypes(typeSpecs, values, location, componentName, getStack) {
  if (true) {
    for (var typeSpecName in typeSpecs) {
      if (has(typeSpecs, typeSpecName)) {
        var error;
        // Prop type validation may throw. In case they do, we don't want to
        // fail the render phase where it didn't fail before. So we log it.
        // After these have been cleaned up, we'll let them throw.
        try {
          // This is intentionally an invariant that gets caught. It's the same
          // behavior as without this statement except with a better message.
          if (typeof typeSpecs[typeSpecName] !== 'function') {
            var err = Error(
              (componentName || 'React class') + ': ' + location + ' type `' + typeSpecName + '` is invalid; ' +
              'it must be a function, usually from the `prop-types` package, but received `' + typeof typeSpecs[typeSpecName] + '`.' +
              'This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.'
            );
            err.name = 'Invariant Violation';
            throw err;
          }
          error = typeSpecs[typeSpecName](values, typeSpecName, componentName, location, null, ReactPropTypesSecret);
        } catch (ex) {
          error = ex;
        }
        if (error && !(error instanceof Error)) {
          printWarning(
            (componentName || 'React class') + ': type specification of ' +
            location + ' `' + typeSpecName + '` is invalid; the type checker ' +
            'function must return `null` or an `Error` but returned a ' + typeof error + '. ' +
            'You may have forgotten to pass an argument to the type checker ' +
            'creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and ' +
            'shape all require an argument).'
          );
        }
        if (error instanceof Error && !(error.message in loggedTypeFailures)) {
          // Only monitor this failure once because there tends to be a lot of the
          // same error.
          loggedTypeFailures[error.message] = true;

          var stack = getStack ? getStack() : '';

          printWarning(
            'Failed ' + location + ' type: ' + error.message + (stack != null ? stack : '')
          );
        }
      }
    }
  }
}

/**
 * Resets warning cache when testing.
 *
 * @private
 */
checkPropTypes.resetWarningCache = function() {
  if (true) {
    loggedTypeFailures = {};
  }
}

module.exports = checkPropTypes;


/***/ }),

/***/ 861:
/*!*********************!*\
  !*** ./src/run.jsx ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   lazy: () => (/* binding */ lazy),
/* harmony export */   require: () => (/* binding */ require),
/* harmony export */   run: () => (/* binding */ run),
/* harmony export */   runScripts: () => (/* binding */ runScripts)
/* harmony export */ });
/* harmony import */ var _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./lilact.jsx */ 241);
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

const [CORE,COMPONENT,LAZY]=[Symbol.for('LILACT:CORE'),Symbol.for('LILACT:COMPONENT'),Symbol.for('LILACT:LAZY')];




/**
 * Runs a jsx script. All scripts can access Lilact namespace as a global object. 
 *
 * @param jsx - The code to run.
 * @param path - The optional path to be used in reporting errors.
 * @param is_inline - To treat the code as inline. The main difference at the moment is that inline code doesn't include sourcemap.
 * 
 * @returns An array representation of the children.
 */
function run(jsx, path=`InlineJSX-${++_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].eval_num}`, is_inline=true)
{
	const mappings = [];
	const module = {exports: {}};
	let processed;


	_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].required_scripts[path] = { 	
		mappings,
		module,
		is_inline,
		path,
		code: jsx,
	};


	try {
		processed = _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].transpileJSX( jsx,
		{
			path,
			mappings,
			factory: "createComponent",
			appendSourcemap: false,
			blocks_info: _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].blocks_info,

			injectTraceLabels: true,
		} );
	}
	catch(e) {
		//e = Lilact.traceError(e);
		_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].error = e;
		throw e;
	}

		_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].required_scripts[path].processed = processed;
	
	processed += "\n//# sourceURL=eval:/" + path;

	// todo: this seems to be only useful in safari, should be assessed latera
	_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].scanBlockLabels(processed, path);

	try {
		globalThis.Lilact = _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"];
		globalThis.createComponent = _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].createComponent;
		globalThis.Fragment = _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].Fragment;

		//const res = new Function( "module", processed )(module);
		const res = eval(processed);
		if(module.exports) return module.exports;
		return res;
	}
	catch(e) {
		e = _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].traceError(e);
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
function require(path, force_update)
{
	if(_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].required_scripts[path] && !force_update) return _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].required_scripts[path].module.exports;
	
	if(path[0]==='#') {

		const el = document.getElementById(path);

		if(el) {
			return _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].run(el.innerText, path);
		}

	}
	else if(_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"]?.[LAZY]) {
		_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"][LAZY]=false;

		return fetch(path)
			.then(res => {
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return res.text();
			})
			.then(res => {
				res = _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].run(res, path, false);
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
			return _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].run(request.responseText, path, false);
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
function lazy(factory) {
	let status = "pending"; // pending | success | error
	let result;             // component | error

	_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"][LAZY] = true;
	result = factory();

	if(_lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].isThenable(result)) {
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
		return  createComponent( Component, { ...props } );
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

function runScripts()
{
	const scripts = scanScriptTagsWithType();

	for(const s of scripts) {
		if(s.src) _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].require(s.src);
		if(s.content) _lilact_jsx__WEBPACK_IMPORTED_MODULE_0__["default"].run(s.content);
	}
}



//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9ydW4uanN4Iiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9ydW4uanN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQThCQzs7Ozs7Q0FLQTs7Ozs7Ozs7O29CQVNtQjtDQUNuQjs7aUJBRWdCLFVBQVU7Ozs7a0NBSU87Ozs7Ozs7OztNQVM1QjtrQ0FDNEI7RUFDL0I7Ozs7Ozs7Ozs7T0FVSSxJQUFJO0dBQ1I7Ozs7Ozs7OztFQVdEO3dCQUNzQjs7TUFFbEI7Ozs7O0dBS0g7bUJBQ2dCO0tBQ2Q7OztPQUdFLElBQUk7d0JBQ2E7Ozs7OztDQU12Qjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozt3QkFzQnVCO0NBQ3ZCO0lBQ0c7O0lBRUEsZ0JBQWdCOztxQ0FFaUI7O0tBRWhDLEtBQUs7cUJBQ1c7Ozs7U0FJWixpQkFBaUI7OztlQUdYO1NBQ04sT0FBUTtPQUNULHlCQUF5QjttQkFDYjs7U0FFWCxPQUFRO29CQUNJO0lBQ2hCOzs7VUFHSyxPQUFROzs7O09BSVg7R0FDSjtHQUNBOztxQ0FFa0M7ZUFDdEI7ZUFDQTtNQUNULHlCQUF5QjtxQkFDVjs7OztpQkFJSjs7OztDQUloQjs7Ozs7Ozs7OztxQkFVb0IsVUFBVTswQkFDTDswQkFDQTs7O2tCQUdSOztJQUVkLGlCQUFrQixXQUFVO2NBQ2xCO0dBQ1YsU0FBUzs7Ozs7R0FLVCxTQUFTOzs7Ozs7O09BT047Ozs7d0JBSWlCLFFBQVE7TUFDMUI7TUFDQTs7VUFFSTs7Ozs7O2dDQU1zQixHQUFHOzRCQUNQOzJCQUNBOzs7b0JBR1AsQUFBRCxRQUFVLEFBQUQ7cUJBQ047Ozs7O0NBS3RCOzs7Ozs7Ozs7Ozs7OzJCQWEwQjtDQUMxQjt3Q0FDdUM7O0tBRW5DLHFCQUFxQjtLQUNyQixzQkFBc0I7S0FDdEIsc0JBQXNCIn0=

/***/ }),

/***/ 862:
/*!***************************!*\
  !*** ./src/jsx.addons.js ***!
  \***************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   defineSymbols: () => (/* binding */ defineSymbols),
/* harmony export */   outputJS: () => (/* binding */ outputJS),
/* harmony export */   quote: () => (/* binding */ quote)
/* harmony export */ });
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


function defineSymbols(ns, defs) {

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

const quote = (x)=>`"${String(x).replace(/(["\n])/g, '\\$1')}"`;


// note: this directive is used for files that can be used separatly (i.e. timers.jsx)
// 		 or in case  you want to check the preprocessors output. 

function outputJS(filepath) {
	globalThis[TRANSPILER_OUTPUT] = filepath;
}


//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9qc3guYWRkb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy9qc3guYWRkb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEFBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztxQ0E4QnFDOzs7OEJBR1AsV0FBVzs7SUFFckMsbUJBQW1COzs7Ozs7OztJQVFuQix3QkFBd0I7S0FDdkIsVUFBVTtNQUNULE1BQU87T0FDTixnQkFBZ0I7Y0FDVDthQUNEOzs7UUFHTDtPQUNELGtCQUFrQjtjQUNYO2FBQ0Q7Ozs7Ozs7c0JBT1M7OztDQUdyQjtDQUNBOzt5QkFFd0IsV0FBVyJ9

/***/ }),

/***/ 919:
/*!********************!*\
  !*** ./src/vlq.js ***!
  \********************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   decode: () => (/* binding */ decode),
/* harmony export */   encode: () => (/* binding */ encode)
/* harmony export */ });
// Fork of https://github.com/Rich-Harris/vlq
// Adapted from murzwin.com/base64vlq.html by Alexander Pavlov.
// License: MIT

/** @type {Record<string, number>} */
let char_to_integer = {};

/** @type {Record<number, string>} */
let integer_to_char = {};

'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
	.split('')
	.forEach(function (char, i) {
		char_to_integer[char] = i;
		integer_to_char[i] = char;
	});

/** @param {string} string */
function decode(string) {
	/** @type {number[]} */
	let result = [];

	let shift = 0;
	let value = 0;

	for (let i = 0; i < string.length; i += 1) {
		let integer = char_to_integer[string[i]];

		if (integer === undefined) {
			throw new Error('Invalid character (' + string[i] + ')');
		}

		const has_continuation_bit = integer & 32;

		integer &= 31;
		value += integer << shift;

		if (has_continuation_bit) {
			shift += 5;
		} else {
			const should_negate = value & 1;
			value >>>= 1;

			if (should_negate) {
				result.push(value === 0 ? -0x80000000 : -value);
			} else {
				result.push(value);
			}

			// reset
			value = shift = 0;
		}
	}

	return result;
}

/** @param {number | number[]} value */
function encode(...value) {
	if (typeof value === 'number') {
		return encode_integer(value);
	}

	let result = '';
	for (let i = 0; i < value.length; i += 1) {
		result += encode_integer(value[i]);
	}

	return result;
}

/** @param {number} num */
function encode_integer(num) {
	let result = '';

	if (num < 0) {
		num = (-num << 1) | 1;
	} else {
		num <<= 1;
	}

	do {
		let clamped = num & 31;
		num >>>= 5;

		if (num > 0) {
			clamped |= 32;
		}

		result += integer_to_char[clamped];
	} while (num > 0);

	return result;
}


//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiL1VzZXJzL2FyYXNoL0Rlc2t0b3AvUHJvamVjdHMvTGlsYWN0L3NyYy92bHEuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIvVXNlcnMvYXJhc2gvRGVza3RvcC9Qcm9qZWN0cy9MaWxhY3Qvc3JjL3ZscS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxBQUFBO0NBQ0M7Q0FDQTs7Q0FFQTt1QkFDc0I7O0NBRXRCO3VCQUNzQjs7O1FBR2Y7VUFDRSxTQUFVLFVBQVU7Ozs7O0NBSzdCO3VCQUNzQixTQUFTO0VBQzlCOzs7Ozs7TUFNSSx1Q0FBdUM7OztNQUd2Qyx3QkFBd0I7bUJBQ1g7Ozs7Ozs7O01BUWIsdUJBQXVCOztVQUVuQjs7OztPQUlILGdCQUFnQjtnQkFDUDtXQUNMO2dCQUNLOzs7SUFHWjs7Ozs7Ozs7Q0FRSDt1QkFDc0IsV0FBVztLQUM3Qiw0QkFBNEI7d0JBQ1Q7Ozs7TUFJbEIsc0NBQXNDOzJCQUNqQjs7Ozs7O0NBTTFCO3dCQUN1QixNQUFNOzs7S0FHekIsVUFBVTtTQUNOO1NBQ0E7Ozs7S0FJSjs7OztNQUlDLFVBQVU7Ozs7O1VBS04ifQ==

/***/ }),

/***/ 925:
/*!*************************************************************!*\
  !*** ./node_modules/prop-types/lib/ReactPropTypesSecret.js ***!
  \*************************************************************/
/***/ ((module) => {

/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */



var ReactPropTypesSecret = 'SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED';

module.exports = ReactPropTypesSecret;


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/compat get default export */
/******/ (() => {
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = (module) => {
/******/ 		var getter = module && module.__esModule ?
/******/ 			() => (module['default']) :
/******/ 			() => (module);
/******/ 		__webpack_require__.d(getter, { a: getter });
/******/ 		return getter;
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
/******/ 
/******/ // startup
/******/ // Load entry module and return exports
/******/ // This entry module is referenced by other modules so it can't be inlined
/******/ var __webpack_exports__ = __webpack_require__(241);
/******/ const __webpack_exports__Lilact = __webpack_exports__.Lilact;
/******/ const __webpack_exports__default = __webpack_exports__["default"];
/******/ export { __webpack_exports__Lilact as Lilact, __webpack_exports__default as default };
/******/ 

//# sourceMappingURL=lilact.development.js.map