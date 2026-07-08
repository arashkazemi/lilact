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


ʔ defineSymbols ( "LILACT", [ "CORE", "COMPONENT", "MEMOIZED"] ) ʔ


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
export const isValidElement = (o) => {
	return o[CORE]!==undefined || o[TEXT]!==undefined;
}

/**
 * Utility to find the underlying DOM node for a mounted Lilact component.
 *
 * @param element - A Lilact component instance to locate its DOM node.
 * @returns The corresponding DOM element (or null if unavailable).
 */
export const findDOMNode = (comp)=>{

	/*
	When a component renders to null or false, findDOMNode returns null. 
	When a component renders to a string, findDOMNode returns a text DOM node containing that value. 

	Note:

	findDOMNode only works on mounted components (that is, components that have been placed in the DOM). 
	If you try to call this on a component that has not been mounted yet (like calling findDOMNode() in 
	render() on a component that has yet to be created) an exception will be thrown.

	Unlike React, in Lilact findDOMNode can also be used on function components.
	*/
	if(!comp[CORE]?.element?.parentNode) throw "findDOMNode only works on mounted components.";
	return comp[CORE].element;
}

/**
 * Fragment helper/utility (same behavior as an array of children).
 *
 * @param children - The nodes to group without adding an extra DOM element.
 */
export const Fragment = ({children})=>children;


/**
 * Children namespace for utilities that operate on `props.children`. `Children` is deprecated
 * and not recommended by React documentation itself. But `only` and `toArray` are used 
 * extensively everywhere, so I included them.
 *
 * @property only - Filters to the single child (or returns null/throws based on count).
 * @property toArray - Converts children to a flat array.
 */
export const Children = {
	
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
				throw "no child or child is not the only one";
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
export function getComponentByPointer()
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
export function classNames(classes) {
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
export function isEmpty(o)  {
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
export const shallowEqual = (source, target) => {
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
export function deepEqual(source, target) {
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
export function isClass(func) {
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
export function isAsync(fn) {
	return typeof fn === 'function' && fn.constructor && fn.constructor.name === 'AsyncFunction';
}

/**
 * Checks whether a value is thenable (supports `.then` like a Promise).
 *
 * @param value - Value to inspect.
 * @returns True if thenable; otherwise false.
 */
export function isThenable(x) {
	return x && (typeof x === "object" || typeof x === "function") && typeof x.then === "function";
}

/**
 * Checks whether a value is an error.
 *
 * @param value - Value to inspect.
 * @returns True if thenable; otherwise false.
 */
export function isError(x) {  
	return x instanceof Error || Object.prototype.toString.call(x) === '[object Error]';
}

/**
 * Converts the input to a boolean value
 *
 * @param value - Value to inspect.
 * @returns boolean value
 */
export function toBool(x) {
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
export const required_scripts = {};

/** @ignore */
export let update_timeout = undefined;
/** @ignore */
export let update_interval_margin = 0;
/** @ignore */
export let id_num = Math.floor(Math.random()*10000);
/** @ignore */
export let eval_num = Math.floor(Math.random()*10000);


// todo =improve these stacks
/** @ignore */
export let current_component = [];
/** @ignore */
export let update_set  = new Set;
/** @ignore */
export let update_cbs  = new Set;
/** @ignore */
export let roots  = new Set;
/** @ignore */
export let layout_effects = new Set;

/** @ignore */
export const special_attributes = new Set([
		"classname", "classname", "ref", "action", "lilact_jsx_loc", "children", "key",
		"defaultvalue", "defaultchecked"
	]);

/** @ignore */
export const events_set = new Set([
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
export const length_css_attributes_set = new Set([
	"width","height","minWidth","minHeight","maxWidth","maxHeight","top","right","bottom","left","margin",
	"marginTop","marginRight","marginBottom","marginLeft","padding","paddingTop","paddingRight","paddingBottom",
	"paddingLeft","borderWidth","borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth",
	"outlineWidth","fontSize","lineHeight","letterSpacing","wordSpacing","textIndent","borderRadius",
	"borderTopLeftRadius","borderTopRightRadius","borderBottomLeftRadius","borderBottomRightRadius",
	"columnGap","rowGap","gap"
]);

/** @ignore */
export const boolean_html_attributes_set = new 
	Set(["disabled", "readOnly", "required", "checked", "multiple",
			 "hidden","open","loop","muted","controls","playsInline","allowFullScreen"]);
