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
import { registerComponentCore, unregisterComponentCore, resolveHotEntity } from './cache.jsx';
import { ComponentCore } from './core.jsx';

import { CORE, COMPONENT, TEXT, IDX, CHILD_CLASS_ADDENDUM, MEMOIZED, CLONED_STYLE } from "./symbols.jsx"



//////////




function doUpdates()
{
	/*
	Priority:

	- Render + enqueue DOM work (runs in the same task where you schedule the update).
	- Apply DOM updates (do this synchronously before you schedule any effects that must happen before paint).
	- Insertion effects (run immediately after DOM is in place, still before paint).
	- Layout effects (run immediately after insertion effects, still before paint).
	- Passive effects (useEffect)

		schedule them for after paint using requestAnimationFrame, typically:
				run the “after paint” work in the next frame or in a callback scheduled such that it runs after the browser has performed the paint.


	Current task: render → DOM updates → insertion effects → layout effects
	Next paint timing boundary: requestAnimationFrame callback → passive effects (useEffect)
	*/


	clearTimeout(Lilact.effect_timeout);

	const _update_set = Lilact.update_set;
	const _update_cbs = Lilact.update_cbs;
	Lilact.update_set = new Set;
	Lilact.update_cbs = new Set;

	for(const u of _update_set)  u.apply();
	for(const cb of _update_cbs)  cb();

	processEffects();

}


/** @ignore */
export function processEffects()
{
	const _insertion_effects = Lilact.insertion_effects;
	const _layout_effects = Lilact.layout_effects;
	const _passive_effects = Lilact.passive_effects;

	Lilact.insertion_effects = new Set;
	Lilact.layout_effects = new Set;
	Lilact.passive_effects = new Set;

	for(const ie of _insertion_effects) ie();
	for(const le of _layout_effects) le();

	requestAnimationFrame(()=>{
		for(const pe of _passive_effects) pe();
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
	else if(props[TEXT]!==undefined) {
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
* These user functions and members are supported:
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
*	getChildContext()
* 
*	static contextTypes
*	static getDerivedStateFromError (error) {}
*	static getDerivedStateFromProps (props, state) {}
* 
* For more details see official React documentation.
*/
export class Component
{

	/**
	* Component state used to drive rendering.
	* Update it with `setState()` to trigger a re-render.
	* @type {object}
	*/
	get state() { return this[CORE].state }
	set state(v) { 
		// todo: this should be changed, it should be only directly settable in constructor.
		if(this[CORE].state===undefined) {
			this[CORE].state = v;
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
	get context() { return this[CORE].context }
	set context(v) { throw new Error('Assigning component context this way is not allowed.') }

	/**
	* Component context value.
	* Use it to access shared data provided by an outer component/system.
	* @type {any}
	*/
	get type() { return this[CORE].entity }
	set type(v) { throw new Error('Component type is immutable.') }

	/**
	* Props passed into the component instance.
	* Use it as read-only input when rendering.
	* @type {any}
	*/
	get props() { return this[CORE].props }
	set props(v) { throw new Error('Assigning component props this way is not allowed.') }

	/**
	* A reference associated with the component to be used with useRef.
	* Can be used to expose the component instance or an underlying DOM node.
	* @type {any}
	*/
	get ref() { return this[CORE].ref }
	set ref(v) { throw new Error('Component ref is immutable.') }

	/**
	* A unique identifier for the component instance. 
	* The key is immutable and can only be set when the component is declared.
	* @type {string|number}
	*/
	get key() { return this[CORE].props.key }
	set key(v) { throw new Error('Component key is immutable.') }


	/**
	* The displayed name for the component. It is overridable.
	* It can also be set for function components.
	* @type {string}
	*/
	get displayName() {
		const entity = this[CORE].entity;

		if (entity?.displayName) {
			return entity.displayName;
		}

		if (typeof entity === "string") {
			return entity;
		}

		if (typeof entity === "function") {
			return entity.name || "Component";
		}

		return "Component";
	}
	
	constructor(props)
	{
		this[CORE] = new ComponentCore(this, props);
	}

	/**
	* Force the component to re-render even if no state/props change.
	* Useful for imperative updates.
	* @returns {void}
	*/
	forceUpdate(callback)
	{
		NATIVE_TIMERS.clearTimeout(Lilact.update_timeout);

		Lilact.update_set.add(this[CORE].container || this[CORE]);
		if(callback) Lilact.update_cbs.add(callback.bind(this));
		Lilact.update_timeout = NATIVE_TIMERS.setTimeout( doUpdates,  Lilact.update_interval_margin );
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
			this[CORE].last_snapshot = this.getSnapshotBeforeUpdate(this[CORE].props, this.state);
		}

		this[CORE].next_state = next_state;
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
	getChildContext					 ()

	static getDerivedStateFromError	 (error) {}
	static getDerivedStateFromProps	 (props, state) {}
	static contextType
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

export class HTMLComponent extends Component 
{
	constructor(entity, props)
	{
		super(props);
		this[CORE].entity = entity;
		if(entity==='svg') {
			this[CORE].is_svg = true;
		}
	}

	render()
	{	
		return this[CORE].props.children;
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

export class RootComponent extends HTMLComponent 
{
	displayName = "Root";

	constructor(element, props)
	{
		super(':root:', props);

		if(typeof this.element==='string') {
			element = document.querySelector(element);
		}

		element.innerHTML="";

		this[CORE].element = element;

		for(const ch of props.children) {
			if(ch[CORE]) ch[CORE].container = this[CORE];
			else ch.container = this[CORE];
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

export function createComponent(entity, props={}, ...children)
{
	if (typeof(entity)!=='string' && typeof(entity)!=='function' )
	{
		if(typeof(entity)!=='object' || !entity[MEMOIZED]) {
			throw new Error("Invalid entity for createComponent.");		
		}
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
			children[i] = { [TEXT]: ch };
		}
		else {
			children[i] = ch;
		}
	}

	props.key = generateComponentKey(entity, props);
	props.children = children;

	return { entity, props, [CORE]: null };
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

export function createRoot(element)
{
	let root;

	return {

		render(component) {
			if(!root) {
				root = new RootComponent( element, {children:[component]} );
				Lilact.roots.add(root[CORE]);
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
		},

		getCore() {
			return root[CORE];
		}
	}
}



/**
 * Creates a portal — a way to render children into a DOM node
 * that exists outside the current component hierarchy.
 * 
 * Note: In React, events from portals propagate according to the React tree rather 
 * than the DOM tree. For example, if you click inside a portal, and the portal is 
 * wrapped in `<div onClick>`, that onClick handler will fire. Lilact doesn't act
 * this way. In Lilact, event propagation follows DOM tree, while the ownership
 * follow the JSX structure.
 *
 * @param {Component} children - The component(s) to render into the portal.
 * @param {Element} element - The DOM node that will receive the portal content.
 * @returns {Component} A portal object that can be rendered.
 */

export function createPortal(children, element)
{
	return <Lilact.Portal view={element}>{children}</Lilact.Portal>;
}


/**
 * Creates a new component by cloning an existing component and applying a
 * partial props update.
 *
 * The original component is not mutated. Existing props are copied first,
 * then the properties in `propsPatch` are applied over them. Passing a prop
 * with the value `undefined` follows the implementation's normal prop-merging
 * behavior.
 *
 * If one or more `children` arguments are provided, they replace the cloned
 * component's existing children. If no children are provided, the original
 * children are preserved.
 *
 * @param {Component} component
 * The element to clone.
 *
 * @param {object} [propsPatch]
 * Props to apply to the cloned element. Existing props are preserved unless
 * they are overridden by a property in this object.
 *
 * @param {Array} children
 * Optional replacement children. Multiple children are supported and are
 * passed to the cloned element in the same order.
 *
 * @returns {Component}
 * A new element with the patched props and, when provided, replacement
 * children.
 *
 * @example
 * const button = (
 *   <Button variant="secondary" disabled={false}>
 *     Save
 *   </Button>
 * );
 *
 * const clonedButton = cloneComponent(
 *   button,
 *   { disabled: true, 'aria-label': 'Save changes' },
 *   'Save changes'
 * );
 *
 * @example
 * const panel = <Panel className="compact">Old content</Panel>;
 *
 * // Existing children are replaced when children are provided.
 * const updatedPanel = cloneComponent(
 *   panel,
 *   { className: 'expanded' },
 *   <Heading>New content</Heading>
 * );
 */
export function cloneComponent(component, propsPatch, ...children)
{
	const cc = { entity: component.entity, props: {...component.props, ...propsPatch }, [CORE]: null };

	if(children?.length) {
		cc.props.children = children;
	}

	return cc;
}

export const cloneElement = cloneComponent;

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

export function render(component, element)
{
	if(component[CORE] && (component[CORE].container || component[CORE].parent)) {
		throw new Error("Component is already in use");
	}
	return createRoot(element).render(component);
}

/**
 * Memoizes the given component. The memoized component will only rerender if its props or children are modified.
 * Unlike React, Lilact memo also works on class components.
 * 
 * @param {Object} component - Component instance to render.
 *
 * @returns {component} - Memoized component.
 */

export function memo(component)
{
	if(typeof(component)==='object') {
		component[MEMOIZED] = true;
	}
	else {
		component = { component, [MEMOIZED]: true, [CORE]: null };
	}
	return component;
}


/** @ignore */
export const createElement = createComponent;

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
export let insertion_effects = new Set;
/** @ignore */
export let passive_effects = new Set;


/** @ignore */
export let update_timeout = undefined;
/** @ignore */
export let effect_timeout = undefined;
/** @ignore */
export let update_interval_margin = 0;
