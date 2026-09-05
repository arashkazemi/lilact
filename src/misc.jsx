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


import { CORE, COMPONENT, MEMOIZED } from "./symbols.jsx"


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
export const isValidComponent = value => {
  return Boolean(
    value &&
    (value[CORE] !== undefined || value[TEXT] !== undefined)
  );
};

/**
 * Checks whether a value is a Lilact component. It is the same as `isValidComponent`.
 *
 * @param value - Value to inspect.
 * @returns True if the value is a class component; otherwise false.
 */
export const isValidElement = isValidComponent

/**
 * Utility to find the underlying DOM node for a mounted Lilact component.
 *
 * @param component - A Lilact component instance to locate its DOM node.
 * @returns The corresponding DOM element (or null if unavailable).
 */
export const findDOMNode = (component)=>{

	/*
	When a component renders to null or false, findDOMNode returns null. 
	When a component renders to a string, findDOMNode returns a text DOM node containing that value. 

	Note:

	findDOMNode only works on mounted components (that is, components that have been placed in the DOM). 
	If you try to call this on a component that has not been mounted yet (like calling findDOMNode() in 
	render() on a component that has yet to be created) an exception will be thrown.

	Unlike React, in Lilact findDOMNode can also be used on function components.
	*/
	if(!component[CORE]?.element?.parentNode) throw new Error("findDOMNode only works on mounted components.");
	return component[CORE].element;
}

/**
 * Fragment helper/utility (same behavior as an array of children).
 *
 * @param children - The nodes to group without adding an extra DOM element.
 */
export function Fragment({children}) 
{
	return children;
};
Fragment.displayName = "Fragment";

/**
 * Portal helper/utility.
 *
 * @param view - The DOM node that will receive the portal content.
 * @param children - The nodes to put in the portal element.
 */
export function Portal({children, view}) 
{
	this[CORE].portal = view;

	return children;
};
Portal.displayName = "Portal";

/**
 * Children namespace for utilities that operate on `props.children`.
 *
 * - Flattens nested arrays recursively.
 * - Omits `null` and `undefined` items (common React-like behavior).
 */
export const Children = {
  /**
   * @param {any} x
   * @returns {boolean}
   */
  _isNil(x) {
    return x === null || x === undefined;
  },

  /**
   * Recursively flattens nested arrays into `out`, omitting null/undefined.
   * @param {Array<any>} out
   * @param {any} input
   */
  _flattenInto(out, input) {
    if (this._isNil(input)) return;

    if (Array.isArray(input)) {
      for (const v of input) this._flattenInto(out, v);
      return;
    }

    out.push(input);
  },

  /**
   * Converts an iterable children collection into a flat array,
   * omitting `null`/`undefined`.
   *
   * @param {Iterable<any>} children
   * @returns {Array<any>}
   */
  toArray(children) {
    const out = [];
    // Per your rule, children is always iterable (often []), but keep it robust anyway.
    if (!children) return out;

    for (const item of children) {
      this._flattenInto(out, item);
    }
    return out;
  },

  /**
   * Returns the number of non-null/undefined children (after flattening).
   * @param {Iterable<any>} children
   * @returns {number}
   */
  count(children) {
    return this.toArray(children).length;
  },

  /**
   * Returns the single child from a children collection (after flattening & omitting nil),
   * or throws if the remaining count is not exactly 1.
   *
   * @param {Iterable<any>} children
   * @returns {any}
   */
  only(children) {
    const arr = this.toArray(children);
    if (arr.length !== 1) {
      throw new Error(
        arr.length === 0
          ? "Expected exactly one child, but received none."
          : "Expected exactly one child, but received more than one."
      );
    }
    return arr[0];
  },

  /**
   * Maps over children (after flattening & omitting nil).
   *
   * @param {Iterable<any>} children
   * @param {(child:any, index:number)=>any} fn
   * @returns {Array<any>}
   */
  map(children, fn) {
    const arr = this.toArray(children);
    const out = [];
    for (let i = 0; i < arr.length; i++) out.push(fn(arr[i], i));
    return out;
  },

  /**
   * Iterates over children (after flattening & omitting nil).
   * @param {Iterable<any>} children
   * @param {(child:any, index:number)=>void} fn
   */
  forEach(children, fn) {
    const arr = this.toArray(children);
    for (let i = 0; i < arr.length; i++) fn(arr[i], i);
  },

  /**
   * Finds the first child for which predicate returns true.
   *
   * @param {Iterable<any>} children
   * @param {(child:any, index:number)=>boolean} predicate
   * @returns {any|undefined}
   */
  find(children, predicate) {
    const arr = this.toArray(children);
    for (let i = 0; i < arr.length; i++) {
      if (predicate(arr[i], i)) return arr[i];
    }
    return undefined;
  },

  /**
   * Finds exactly one matching child.
   * Throws if matched count is not exactly 1.
   *
   * @param {Iterable<any>} children
   * @param {(child:any, index:number)=>boolean} predicate
   * @returns {any}
   */
  pickOne(children, predicate) {
    const arr = this.toArray(children);

    let found;
    let matches = 0;

    for (let i = 0; i < arr.length; i++) {
      if (predicate(arr[i], i)) {
        matches++;
        found = arr[i];
        if (matches > 1) break;
      }
    }

    if (matches !== 1) {
      throw new Error(
        matches === 0
          ? "pickOne expected exactly one matching child, but matched none."
          : "pickOne expected exactly one matching child, but matched multiple."
      );
    }

    return found;
  },

  /**
   * Returns the first non-nil child (after flattening), or undefined.
   * @param {Iterable<any>} children
   * @returns {any|undefined}
   */
  first(children) {
    const arr = this.toArray(children);
    return arr[0];
  },

  /**
   * Returns the last non-nil child (after flattening), or undefined.
   * @param {Iterable<any>} children
   * @returns {any|undefined}
   */
  last(children) {
    const arr = this.toArray(children);
    return arr.length ? arr[arr.length - 1] : undefined;
  }
};


/**
 * Wraps a render function so that a parent can pass a `ref` into it.
 * The forwarded `ref` is provided as the second argument to the render function: `(props, ref)`.
 *
 * @param {function(props: any, ref: any)} render
 *   The component render function that receives the props and the forwarded ref.
 * @returns {}
 */
export const forwardRef = (render)=>
{
	const forwarded = function(props, ref) { return render({ ...props, ref: undefined }, ref); }
	forwarded.displayName = "Forwarded " + render.displayName;

	return forwarded;
}


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
 * Checks whether a collection/set/array is empty.
 *
 * @param value - Value to check for emptiness.
 * @returns True if empty; otherwise false.
 */
export function isEmpty(value)  {
	for(let i in value) return false;
		return true;
}


/**
 * Determines whether two values are shallowly equal.
 *
 * @param source - First object to compare.
 * @param target - Second object to compare.
 * @param ignore - specific property/index to be ignored in comparison.
 * @returns True if shallowly equal; otherwise false.
 */
export const shallowEqual = (source, target, ignore) => {
  if (Object.is(source, target)) {
    return true;
  }

  if (typeOf(source) !== typeOf(target)) {
    return false;
  }

  if (typeOf(source) === "array") {
    if (source.length !== target.length) {
      return false;
    }

    return source.every(
      (value, index) =>
        index === ignore || Object.is(value, target[index])
    );
  }

  if (typeOf(source) === "object") {
    const sourceKeys = Object.keys(source)
      .filter(key => key !== ignore);

    const targetKeys = Object.keys(target)
      .filter(key => key !== ignore);

    if (sourceKeys.length !== targetKeys.length) {
      return false;
    }

    return sourceKeys.every(key =>
      Object.prototype.hasOwnProperty.call(target, key) &&
      Object.is(source[key], target[key])
    );
  }

  if (typeOf(source) === "date") {
    return source.getTime() === target.getTime();
  }

  return Object.is(source, target);
};


/**
 * Determines whether two values are deeply equal.
 *
 * @param source - First object to compare.
 * @param target - Second object to compare.
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
export function isClass(value) {
	// from https://stackoverflow.com/a/66120819
	if(!(value && value.constructor === Function) || value.prototype === undefined)
		return false;
	if(Function.prototype !== Object.getPrototypeOf(value))
		return true;
	return Object.getOwnPropertyNames(value.prototype).length > 1;
}

/**
 * Checks whether a value is an async function.
 *
 * @param value - Value to inspect.
 * @returns True if the value is an async function; otherwise false.
 */
export function isAsync(value) {
	return typeof value === 'function' && value.constructor && value.constructor.name === 'AsyncFunction';
}

/**
 * Checks whether a value is thenable (supports `.then` like a Promise).
 *
 * @param value - Value to inspect.
 * @returns True if thenable; otherwise false.
 */
export function isThenable(value) {
	return value && (typeof value === "object" || typeof value === "function") && typeof value.then === "function";
}

/**
 * Checks whether a value is an error.
 *
 * @param value - Value to inspect.
 * @returns True if thenable; otherwise false.
 */
export function isError(value) {  
	return value instanceof Error || Object.prototype.toString.call(value) === '[object Error]';
}

/**
 * Converts the input to a boolean value
 *
 * @param value - Value to inspect.
 * @returns boolean value
 */
export function toBool(value) {
	if (typeof value === "boolean") return value;

	if (typeof value === "number") return value !== 0;

	if (typeof value === "string") {
		value = value.trim().toLowerCase();
		if (value === "true") return true;
		if (value === "false") return false;
	}

	return Boolean(value);
}


// Internals

/** @ignore */
export let id_num = Math.floor(Math.random()*10000);
/** @ignore */
export let eval_num = 0;//Math.floor(Math.random()*10000);


// todo =improve these stacks
