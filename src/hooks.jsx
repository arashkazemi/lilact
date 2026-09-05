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
import { isEmpty, shallowEqual } from "./misc.jsx"

import { CORE, COMPONENT } from "./symbols.jsx"


/**
 * Hook wrapper/primitive used to implement custom hooks.
 * Can be used by the user, but not encouraged. Only use after you
 * study how Lilact itself uses it.
 *
 * @returns {hook} Hook result.
 */
export function useHook()
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
export function useState(initialValue)
{
	const hk = useHook();

	if( isEmpty(hk) ) {
		if(typeof(initialValue)==='function') hk.value = initialValue();
		else hk.value = initialValue;
		
		hk.set_func = function(core, hk, value) {
			if(typeof(value)==='function') hk.value = value(hk.value);
			else hk.value = value;

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
export function useCallback(callback, deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' || deps.constructor.name!=='Array') ) {
		throw new Error("Callback dependencies must be an array or omitted.");
	}

	const hk = useHook();

	if( !isEmpty(hk) ) {
		if(deps!==undefined && hk?.deps!==undefined && shallowEqual(deps, hk.deps)) {
			return hk.callback;
		}
	}

	if(hk?.cleanup) {
		hk.cleanup();
	}

	hk.deps = deps;
	hk.callback = callback;

	return hk.callback;
}

/**
 * Creates a context object for sharing a value through the component tree.
 *
 * @param {any} [defaultValue] - Initial context value when no Provider is present.
 * @returns {any} A context object
 */
export function createContext(defaultValue)
{
	const prov = function({value, children}) {
		return children;
	};

	return {
		default: defaultValue,
		Provider: prov
	}
}

/**
 * Reads the current value from a context.
 *
 * @param {any} context - Context object created by `createContext`.
 * @returns {any} Current context value.
 */
export function useContext(context)
{
	let core = Lilact.current_component[0].parent;

	while(core.entity!==context.Provider && core.parent) {
		core = core.parent;
	}

	if(core.parent) {
		let v = core.props?.value;
		return v??=context.default;
	}

	return context.default;
}

/**
 * Returns a stable, unique ID that is consistent across renders.
 *
 * @param {string} [prefix] - Optional id prefix.
 * @returns {string} Stable unique id.
 */
export function useId(prefix="N")
{
	const hk = useHook();

	if( isEmpty(hk) ) {
		hk.id = prefix+Lilact.id_num++;
	}

	return hk.id;
}

/**
 * Starts a transition and returns helpers for pending updates vs immediate ones.
 *
 * @returns {any} `[isPending, startTransition]`
 */
export function useTransition()
{
	const hk = useHook();

	if( isEmpty(hk) ) {
		hk.count=0;

		hk.func =

		(async function(core, hk, fn) {

			if(hk.count===0) {
				core.component.forceUpdate();
			}

			hk.count++;

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
export function useLocalStorage(key, initialValue)
{

	const hk = useHook();
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

	if( isEmpty(hk) ) {
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
export function useRef(initialValue = null)
{
	const hk = useHook();

	if( isEmpty(hk) ) {
		hk.current = initialValue;
	}

	return hk;
}

/**
 * Runs an effect synchronously after all DOM mutations but before the browser paints.
 *
 * @param {Function} effect - Effect callback.
 * @param {Array<any>} [deps] Optional dependency list (or an object for shallow comparison)
 * 						used to determine when to re-run the effect.
 * @returns {void}
 */
export async function useLayoutEffect(effect, deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' && deps.constructor.name!=='Array') ) {
		throw new Error("Layout effect dependencies must be an array, object or omitted.");
	}

	const hk = useHook();

	if( !isEmpty(hk) ) {
		if(deps!==undefined && hk?.deps!==undefined && shallowEqual(deps, hk.deps)) return;
	}

	if(hk?.cleanup) {
		await hk.cleanup();
  		hk.cleanup = undefined;
  	}

	hk.deps = deps;
	Lilact.layout_effects.add( async ()=>{ hk.cleanup = await effect(); });
	
	Lilact.clearTimeout( Lilact.effect_timeout );
	Lilact.setTimeout( Lilact.processEffects, 0 );
}

/**
 * Runs a side effect after render commits.
 *
 * @param effect - Callback invoked.
 * @param {Array<any>} [deps] Optional dependency list (or an object for shallow comparison)
 * 						used to determine when to re-run the effect.
 * @returns {void}
 */
export async function useEffect(effect, deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' && deps.constructor.name!=='Array') ) {
		throw new Error("Effect dependencies must be an array, object or omitted.");
	}

	const hk = useHook();

	if( !isEmpty(hk) ) {
		if(deps!==undefined && hk?.deps!==undefined && shallowEqual(deps, hk.deps)) return;
	}

	if(hk?.cleanup) {
		await hk.cleanup();
  		hk.cleanup = undefined;
	}

	hk.deps = deps;
	Lilact.passive_effects.add( async ()=>{ hk.cleanup = await effect(); });

	Lilact.clearTimeout( Lilact.effect_timeout );
	Lilact.setTimeout( Lilact.processEffects, 0 );
}


/**
 * Executes a side effect after the DOM updates have been committed.
 *
 * @param effect - Callback invoked after render commit.
 * @param {Array<any>} [deps] Optional dependency list (or an object for shallow comparison)
 * 						used to determine when to re-run the effect.
 * @returns void
 */
export async function useInsertionEffect(effect, deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' && deps.constructor.name!=='Array') ) {
		throw new Error("Insertion effect dependencies must be an array, object, or omitted.");
	}

	const hk = useHook();

	if( !isEmpty(hk) ) {
		if(deps!==undefined && hk?.deps!==undefined && shallowEqual(deps, hk.deps)) return;
	}

	if(hk?.cleanup) {
		await hk.cleanup();
  		hk.cleanup = undefined;
	}

	hk.deps = deps;
	Lilact.insertion_effects.add( async ()=>{ hk.cleanup = await effect(); });

	Lilact.clearTimeout( Lilact.effect_timeout );
	Lilact.setTimeout( Lilact.processEffects, 0 );
}


/**
 * Memoizes a computed value until dependencies change.
 *
 * @param {Function} factory - Function that creates the value.
 * @param {Array<any>} [deps] Optional dependency list (or an object for shallow comparison)
 * 						used to determine when to recompute the value.
 * @returns {any} Memoized value.
 */
export function useMemo(factory,deps=undefined)
{
	if( deps!==undefined && (typeof(deps)!=='object' && deps.constructor.name!=='Array') ) {
		throw new Error("Memo dependencies must be an array or omitted.");
	}

	const hk = useHook();

	if( !isEmpty(hk) ) {
		if(deps!==undefined && hk?.deps!==undefined && shallowEqual(deps, hk.deps)) {
			return hk.value;
		}
	}

	hk.deps = deps;
	hk.value = factory();

	return hk.value;
}

/**
 * React-compatible hook for managing an async/queued action and deriving state from it.
 *
 * @param {Function} action - The async/queued action function.
 * @param {any} initialState - Initial state for the hook.
 * @returns {any} Hook result
 */
export function useActionState(action, initialState)
{
	const hk = useHook();
	const [is_pending, tran_start_func] = useTransition();

	if( isEmpty(hk) ) {

		hk.state = initialState;

		hk.form_action = (sub)=>{
			event.preventDefault();

			tran_start_func(
					async ()=> {
						const form_data = new FormData(sub.target, sub.submitter);
						hk.state = await action(hk.state, form_data);
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
export function useReducer(reducer, initialArg, init)
{
	const hk = useHook();

	if( isEmpty(hk) ) {
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
export function useDeferredValue(value, initialValue)
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
export function useImperativeHandle(ref, factory, deps=undefined)
{
	if(deps!==undefined && ref?.deps!==undefined && shallowEqual(deps, ref.deps)) return;

	ref.deps = deps;

	if(typeof ref?.current !== 'object') {
		ref.current = {};
	}
	Object.assign( ref.current, factory(), 0 );	

}


/**
 * A hook for debug purposes. By default it only logs the output to console, but it can be overrided
 * for the development environment.
 *
 * @param {any} val
 *   The debug value.
 * @param {function(): any} formatter
 *   Function that creates a representation of the value.
 * @returns {void}
 */
export function useDebugValue(val, formatter=(x)=>x)
{
	if(DEBUG) {	
		console.log(formatter(val));
	}
}


/**
 * Schedule a state update as a low-priority transition.
 *
 * Updates triggered inside the transition callback are treated as lower priority than
 * updates outside of it.
 *
 * @param transition - Function that performs the state updates for the transition.
 * @returns void
 */
export function startTransition(transition)
{
	transition();
}

