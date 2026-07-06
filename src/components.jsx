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

ʔ defineSymbols ( "LILACT", [ "CORE", "COMPONENT", "TEXT", "IS_ZOMBIE", "IDX", "CHILD_CLASS_ADDENDUM", "MEMOIZED"] ) ʔ

import {shallowEqual} from "./misc.jsx";

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

			if(comp[CORE]) comp[CORE].parent ??= this.owner;
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
ʔ if(DEBUG) {

			if(this.entity?.propTypes) {
				Lilact.PropTypes.checkPropTypes(this.entity.propTypes, this.props, 'prop', this.entity.name);
			}
			else if(this.component?.propTypes) {
				Lilact.PropTypes.checkPropTypes(this.component.propTypes, this.props, 'prop', this.component.name);
			}

ʔ }	
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
				this.element[COMPONENT] = this.component;
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
			else if(this.next_state!==undefined) throw 'Component.setState only accepts objects or functions is new state.';


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

					if(core[TEXT]===undefined) {
						core.container= this.element? this : this.container;
						core.apply(item.props);
					}
					else {
						if(!core.element) {
							core.element = document.createTextNode(item[TEXT]);
							core[TEXT] = item[TEXT];
						}
						else if(core[TEXT]!==item[TEXT]) {
							core.element.textContent = item[TEXT];
							core[TEXT] = item[TEXT];
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

ʔ if(DEBUG) {
		//this.element.setAttribute('key', this.props.key);
ʔ }		

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

	while(c && !c?.component?.componentDidCatch) {
		c = c.parent;
		if(c) stack.push(c);
	}
	if(c?.component?.componentDidCatch) {
		if(c.entity?.getDerivedStateFromError) {
			c.component.setState(c.entity.getDerivedStateFromError.call(c, e));
		}

		if(Lilact.isError(e)) {
			e = Lilact.traceError(e);
		}

		let stack_log = Array.prototype
				          .map.call(stack, x => ("in " + 
				          		( (typeof x.entity==='string'? x.entity:x.entity?.name) || 
				          			x.component?.name || 
				          			x.constructor?.name
				          		) ?? 'undefined') ) 
				          .join('\n');

		c.component.componentDidCatch(e, {componentStack: stack, componentStackLog: stack_log});  
	}
	else throw(e);

}


//////////



function constructFunc(core, parent) // returns {text} or component, and not component core.
{
	let comp = core;

	if( core[TEXT]!==undefined ) {
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
						comp[CORE].state = comp.state;

						Object.defineProperty(comp, "state", {
							get() { return this[CORE].state },
							set(v) { 
								// todo: this should be changed, it should be only directly settable in constructor.
								if(this[CORE].state===undefined) {
									this[CORE].state = v;
								}
								else {
									throw 'assigning component state this way is not allowed.';
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
				comp[CORE].hooks = [];
				comp[CORE].hook_index = 0;
			}
			else {
ʔ if(DEBUG) {
				console.error(core);
ʔ }
				throw "createComponent accepts a component class or a function or undefined for the first argument.";
			}

			comp[CORE].entity = core.entity;

			if(core.container) {
				comp[CORE].container = core.container;
			}
		}

	}

	if(parent instanceof ComponentCore) comp[CORE].parent = parent;

	return comp;
}


function prepareCore(parent, core)
{
	try {
		parent.cache ??= new ComponentCache(parent);
		core =  parent.cache.pick( 	core[TEXT]===undefined?core?.props?.key:':text', 
									()=>(  (core[TEXT]!==undefined || core instanceof ComponentCore) ?   
											 core : constructFunc(core, parent)[CORE]  ) 
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
	else if(props[TEXT]!==undefined) {
		key = ':text';
	}
	else {

		if(typeof(entity)==='string') { 
			key = ':t:'+entity;
		}
		else if(!entity) {
			key = "::";
		}
		else {
			key = entity.name;
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
			throw 'assigning component state this way is not allowed.';
		}
	}
		
	/**
	* Component context.
	* @type {any}
	* @protected
	*/
	get context() { return this[CORE].context }
	set context(v) { throw 'assigning component context this way is not allowed.' }

	/**
	* Component context value.
	* Use it to access shared data provided by an outer component/system.
	* @type {any}
	*/
	get type() { return this[CORE].entity }
	set type(v) { throw 'component type is immutable.' }

	/**
	* Props passed into the component instance.
	* Use it as read-only input when rendering.
	* @type {any}
	*/
	get props() { return this[CORE].props }
	set props(v) { throw 'assigning component props this way is not allowed.' }

	/**
	* A reference associated with the component to be used with useRef.
	* Can be used to expose the component instance or an underlying DOM node.
	* @type {any}
	*/
	get ref() { return this[CORE].ref }
	set ref(v) { throw 'component ref is immutable.' }

	/**
	* A unique identifier for the component instance. 
	* The key is immutable and can only be set when the component is declared.
	* @type {string|number}
	*/
	get key() { return this[CORE].props.key }
	set key(v) { throw 'component key is immutable.' }

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
		Lilact.clearTimeout(Lilact.update_timeout);

		Lilact.update_set.add(this[CORE].container || this[CORE]);
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

export class HTMLComponent extends Component 
{
	constructor(entity, props)
	{
		super(props);
		this[CORE].entity = entity;
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
	constructor(element, props)
	{
		super(':root', props);

		if(typeof this.element==='string') {
			element = document.querySelector(element);
		}

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

	if(entity===null) return children; // <> style fragment

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
				throw "root already initialized!";
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

export function render(component, element)
{
	if(component[CORE] && (component[CORE].container || component[CORE].parent)) {
		throw "component is already in use";
	}
	return createRoot(element).render(component);
}

/** @ignore */
export const createElement = createComponent;