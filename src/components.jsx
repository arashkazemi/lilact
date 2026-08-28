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

import { CORE, COMPONENT, TEXT, IS_ZOMBIE, IDX, CHILD_CLASS_ADDENDUM, MEMOIZED } from "./symbols.jsx"
import { shallowEqual, toBool, isClass } from "./misc.jsx";

import { PropTypes } from './proptypes.jsx';

const SVG_NS = "http://www.w3.org/2000/svg";

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
				if(ex.cleanup) {
					ex.cleanup();
				}
				else if(ex.element && !ex.portal) {
					ex.element.parentElement.removeChild(ex.element);
				}
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
*  that you should define a LILACT:CORE symbol.
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

	is_svg

	*/

	component;
	props;

	constructor(comp, props)
	{
		this.component = comp;
		this.props = props || {};
	}

	/*
	*/
	// TODO: should componentDidUpdate be called after arranging/appending the outlet or before?
	apply(next_props = this.props, next_state = this.next_state || this.state)
	{

		let do_rerender = true;

		if(this.outlet && this?.[MEMOIZED]) {

			if( shallowEqual(this.props, next_props, "children") && 
				shallowEqual(this.props?.children, next_props?.children) ) {
					do_rerender=false;
			}
		}

		if(do_rerender) {

if(DEBUG) {

			if(this.entity?.propTypes) {
				PropTypes.checkPropTypes(this.entity.propTypes, this.props, 'prop', this.entity.name);
			}
			else if(this.component?.propTypes) {
				PropTypes.checkPropTypes(this.component.propTypes, this.props, 'prop', this.component.name);
			}

}	
			if(typeof(next_state)==='function') next_state = next_state(this.state);

			if(this.component.constructor.defaultProps) {
				next_props = {...this.component.constructor.defaultProps, ...next_props};
			}

			if(this?.parent?.component?.context || this?.parent?.component?.getChildContext ) {
				this.context = { ...this.parent.component.context, ...this.parent.component.getChildContext?.() };

				if(DEBUG && this.component.constructor.contextTypes) {
					PropTypes.checkPropTypes(this.component.constructor.contextTypes, this.context, 'context', this.entity.name);
				}
			}

			if( this.component.shouldComponentUpdate && 
				!this.component.shouldComponentUpdate
					(next_state, next_props, this.context) ) return;


			if( typeof(this.entity)==='string' ) {
				if(!(this.element instanceof Element)) {

					if(this.is_svg || this.container.is_svg) {
						this.is_svg = true;
						this.element = document.createElementNS(SVG_NS, this.entity);
					}
					else {
						this.element = document.createElement(this.entity);
					}
					if(next_props?.defaultValue) this.element.value = String(next_props.defaultValue).slice(0, next_props?.maxLength);
					if(next_props?.defaultChecked) this.element.checked = next_props.defaultChecked;
				}
				this.element[COMPONENT] = this.component;
			}

			if(next_props.ref) {
				if(typeof(next_props.ref)==='function') {
					next_props.ref(this.element || this.component);
				}
				else {
					next_props.ref.current = this.element || this.component;
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
					this.outlet = this.component.render(next_props, {current: this.element || this.component} );
				}
				catch(e) {
					renderErrorHandler(this, e);
				}

				Lilact.current_component = Lilact.current_component[1];
			}
			else {
				try {
					this.outlet = this.component.render({current: this.element || this.component});
				}
				catch(e) {
					renderErrorHandler(this, e);
				}
			}


			if( this?.portal ) {
				this.element = this.portal;
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


			if(this.element) this.arrangeOutlet();

			if(this.component.componentDidUpdate) {
				this.component.componentDidUpdate(prev_props, prev_state, this.last_snapshot);
			}

			if(this.last_snapshot) delete this.last_snapshot;
		}

	}

	async cleanup()
	{
		try {
			const promises = [];
			
			if(this.props?.ref) {
				if(typeof(this.props.ref)==='function') {
					this.props.ref(null);
				}
				else {
					this.props.current = null;
				}
			}

			if(this.component.componentWillUnmount) {
				this.component.componentWillUnmount();
			}

			if(this?.element?.parentElement && !this.portal) {
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

				if( events_set.has(al) ) {
					this.event_detachers[al]();
				}
				else {
					this.element.setAttribute(a, undefined);
				}
			}
		}

		for(let a in patch) {
			const al = a.toLowerCase();

			if( special_attributes.has(al) ) continue;

			if( patch===this.props || !Lilact.defaultIsEqual(patch[a], this.props[a]) || force  ) {

				if( events_set.has(al) ) {
					this.event_detachers ??= {};
					this.event_detachers[al]?.();
					this.event_detachers[al] = Lilact.addWrappedEventListener(this.element, al.substring(2), patch[a]);
				}
				else if( capture_events_set.hasOwnProperty(al) ) {
					const alc = capture_events_set[al];
					this.event_detachers ??= {};
					this.event_detachers[al]?.();
					this.event_detachers[al] = 
						Lilact.addWrappedEventListener(this.element, alc.substring(2), patch[a], {capture: true});
				}
				else if(a==='style') {
					if(typeof(patch.style)==='string') {
						this.element.style = patch.style;
					}
					else {
						if(this.props?.style) {
							if(typeof(this.props.style)==='string') {
								this.element.style = "";
							}
							else {
								for(let p in this.props.style) {
									if( !patch.style.hasOwnProperty(p) ) {
										this.element.style[p] = "";
									}
								}
							}
						}						
						for(const x in patch.style) {
							if( length_css_attributes_set.has(x) ) {
								if(isFinite(patch.style[x])) {
									patch.style[x]+='px';
								}
							}
						}
						Object.assign(this.element.style, patch.style);
					}
				}
				else if(boolean_html_attributes_set.has(a)) { // not lower cased(al), as it is set as a js property
					this.element[a] = toBool(patch[a]);
				}
				else if(a==='autoFocus') { // not lower cased(al), as it is set as a js property
					this.element['autofocus'] = toBool(patch[a]);
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

if(DEBUG) {
		//this.element.setAttribute('key', this.props.key);
}		

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
		if(core.portal) return;

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

	if( core[TEXT]!==undefined ) {
		// do nothing...
	}
	else {
		let entity = core.entity;
		let memoized = false;

		if(typeof(entity)==='object') {
			if( entity[MEMOIZED] )  {
				memoized = entity[MEMOIZED];
				entity = entity.component;
			}
			else {
				throw new Error("Invalid component.");
			}
		}

		if(typeof(entity)==='string') {
			comp = new HTMLComponent(entity, core.props);
		}
		else {

			if( isClass(entity) ) {
				if(entity?.defaultProps) {
					core.props = { ...entity.defaultProps, ...core.props };
				}

				comp = new entity(core.props);

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
									throw new Error('Assigning component state this way is not allowed.');
								}
							}
						});
					}
				}
			}
			else if(typeof(entity)==='function') {

				if(entity?.defaultProps) {
					core.props = { ...entity.defaultProps, ...core.props };
				}

				comp = new Component(core.props);

				// the binding is not necessary and is not according to the specs, 
				// probably not even recommended! but helpful.
				comp.render = entity.bind(comp); 
				comp[CORE].hooks = [];
				comp[CORE].hook_index = 0;
			}
			else {
				throw new Error("Error in constructing component.");
			}

			comp[CORE].entity = entity;

			if(core.container) {
				comp[CORE].container = core.container;
			}
		}

		if(memoized) comp[CORE][MEMOIZED] = true;
	}

	if(parent instanceof ComponentCore) comp[CORE].parent = parent;
	return comp;
}


function prepareCore(parent, core)
{
	try {
		parent.cache ??= new ComponentCache(parent);
		core =  parent.cache.pick( 	core[TEXT]===undefined?core?.props?.key:':text:', 
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
	displayName()
	{
		if(this[CORE].entity?.displayName) return this[CORE].entity?.displayName;
		if(typeof(this[CORE].entity)==='string') return this[CORE].entity;
		if( isClass(this[CORE].entity) ) this[CORE].entity.constructor.name;
		if( typeof(this[CORE].entity)==='function' ) return this[CORE].entity.name;
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

/** @ignore */
export const special_attributes = new Set([
		"classname", "ref", "action", "lilact_jsx_loc", "children", "key",
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
export const capture_events_set = {};
for (const x of events_set) {
  capture_events_set[x+"capture"] = x;
}

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


