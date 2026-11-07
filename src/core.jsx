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

import Lilact, { LOCATION } from './lilact.jsx';
import { resolveHotEntity, ComponentCache, registerComponentCore, unregisterComponentCore } from './cache.jsx';

import { CORE, COMPONENT, TEXT, CHILD_CLASS_ADDENDUM, MEMOIZED, CLONED_STYLE } from "./symbols.jsx"
import { shallowEqual, toBool, isClass } from "./misc.jsx";

import { Component, HTMLComponent, RootComponent } from './components.jsx';
import { PropTypes } from './proptypes.jsx';

const SVG_NS = "http://www.w3.org/2000/svg";





const renderErrorHandler = (c, e) =>
{
	const value =
		e?.error instanceof Error
			? e.error
			: e?.reason !== undefined
				? e.reason
				: e;

	const error = Lilact.isThenable(e)? e : Lilact.traceError(
		value,
		e?.fileName || null
	);

	const stack = [c];

	while(c && !c.component?.componentDidCatch) {
		c = c.parent;
		if(c) stack.push(c);
	}

	if(c?.component?.componentDidCatch) {
		if(c.entity?.getDerivedStateFromError) {
			c.component.setState(c.entity.getDerivedStateFromError.call(c, error));
		}
	}

	let stack_log = Array.prototype
								.map.call(stack, x => (`in  ${typeof(x.component.displayName)==='function'?
																	x.component.displayName():x.component.displayName}` ) ) 
								.join('\n');

	error.componentStack = stack;
	error.componentStackLog = stack_log;

	if(c?.component?.componentDidCatch) {
		c.component.componentDidCatch(error, {componentStack: stack, componentStackLog: stack_log});  
	}
	else throw(e); // should be e not error
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

export class ComponentCore
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
		try {

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
						PropTypes.checkPropTypes( this.entity.propTypes, next_props, 'prop', this.entity.name );
					}
					else if(this.component?.propTypes) {
						PropTypes.checkPropTypes( this.component.propTypes, next_props, 'prop', this.component.name );
					}
				}

				if(typeof(next_state)==='function') next_state = next_state(this.state);

				const defaultProps = this.entity?.defaultProps || this.component?.constructor?.defaultProps;

				if (defaultProps) {
					next_props = {
						...defaultProps,
						...(next_props || {}),
					};
				}

				if(next_props?.style && typeof next_props.style === 'object' && !next_props.style[CLONED_STYLE]) {
					next_props.style = { ...next_props.style, [CLONED_STYLE]: true };
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

				if( this.element && ! (this?.component instanceof Lilact.RootComponent) ) {
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

					this.outlet = this.component.render(next_props, {current: this.element || this.component} );

					Lilact.current_component = Lilact.current_component[1];
				}
				else {
					this.outlet = this.component.render({current: this.element || this.component});
				}

				if( this?.portal ) {
					this.element = this.portal;
				}

				if(this.outlet?.constructor?.name!=='Array') {
					this.outlet = [this.outlet];
				}
				else {
					this.outlet = [...this.outlet];
				}

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
							core.container = this.element? this : this.container;
							core.apply(item.props);
						}
						else {
							if(!core.element) {
								core.element = document.createTextNode(item[TEXT]);
							}
							else if(core[TEXT]!==item[TEXT]) {
								core.element.textContent = item[TEXT];
							}
							core[TEXT] = item[TEXT];
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
		catch(e) {
			renderErrorHandler(this, e);
		}

	}

	async cleanup()
	{
  		unregisterComponentCore(this);
  		try {
			const promises = [];
			
			if(this.props?.ref) {
				if(typeof(this.props.ref)==='function') {
					this.props.ref(null);
				}
				else {
					this.props.ref.current = null;
				}
			}

			if(this.component.componentWillUnmount) {
				this.component.componentWillUnmount();
			}

			if(this?.element?.parentElement && !this.portal) {
				this.element.remove();
			}

			if(this.outlet!==undefined) {
				for(let c of this.outlet) {
					if(c.cleanup) {
						promises.push(c.cleanup());
					}
				}
			}

			if(this.props?.children!==undefined) {
				for(let c of this.props.children) {
					if(c.cleanup) {
						promises.push(c.cleanup());
					}
				}
			}

			if(this.hooks!==undefined) {
				for(let h of this.hooks) {
					if(h.cleanup) {
						promises.push(h.cleanup());
					}
				}
			}

			await Promise.all(promises);
		}

		catch(e) {
			throw(e);
		}
	}

	updateElementProps(patch, force=false) 
	{
		// note: string.slice(0,undefined) returns the complete string. that's why
		// the slices are correct even if maxLength is not set.

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
			if(typeof(patch.value)==='string') {
			 	if(patch.value!==this.element.value) {
					this.element.value=patch.value;
				}
			}
		}
		else if(this.entity==="option") {
			if(this.container?.props?.value?.constructor?.name==='Array') {
				patch.selected = this.container.props.value.indexOf(patch.value)!==-1;
			}
			else if(typeof(this.container?.props?.value)==='string') {
				patch.selected = this.container.props.value===patch.value;
			}
		}

		// old ones that don't exist in the new one
		for(let a in this.props) {
			const al = a.toLowerCase();

			if( !patch.hasOwnProperty(a) || (  !a.startsWith('data-') && !a.startsWith('aria-') && 
						(patch[a]===undefined || patch[a]===null || patch[a]==='' || patch[a]===false )  ) ) 
			{
				if( events_set.has(al) ) {
					this.event_detachers[al]();
				}
				else {
					this.element.removeAttribute(a);
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
									if( p!==CLONED_STYLE && !patch?.style?.hasOwnProperty?.(p) ) {
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
					const v = toBool(patch[a]);
					
					if(v!==this.element[a]) {
						this.element[a] = v;
					}
				}
				else if(a==='autoFocus') { // not lower cased(al), as it is set as a js property
					this.element['autofocus'] = toBool(patch[a]);
				}
				else if(a==='htmlFor' || a==='for') { // not lower cased(al), as it is set as a js property
					this.element.setAttribute('for', patch[a]);
				}
				else if(al!=='value' || ['input', 'textarea', 'select'].indexOf(this.entity)===-1) {
					this.element.setAttribute(a, patch[a]);
				}
			}
		}


		if(patch?.action) {
			this.element.onsubmit = patch.action;
		}
		else {
			this.element.onsubmit = undefined;
		}

		this.updateElementClass(patch);
	}

	updateElementClass(patch=this.props) 
	{
		let cn = patch?.className ?? patch?.class ?? '';

		if(this?.parent?.[CHILD_CLASS_ADDENDUM]) {
			cn += ' ' + this.parent[CHILD_CLASS_ADDENDUM];
		}
		cn = cn.trim();

		for(const n of Array.from(this.element.classList)) {
			if(cn.indexOf(n)===-1) {
				this.element.classList.remove(n);
			}
		}

		if(cn.length>0) {
			cn = cn.split(/\s+/g);
			for(const n of cn) {
				if(n.length>0) {
					this.element.classList.add(n);
				}
			}
		}
	}

	appendElement(core)
	{
		if(core.portal) return;

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
					if(core.arrangeOutlet && core.outlet) core.arrangeOutlet();

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




function prepareCore(parent, core) 
{
	try {
		parent.cache ??= new ComponentCache(parent);

		const isText = core[TEXT] !== undefined;
		const isExistingCore = core instanceof ComponentCore;

		const entity = isText || isExistingCore
		? undefined
		: resolveHotEntity(core.entity);

		const hasExplicitKey =
		!isText &&
		core.props &&
		core.props.key !== undefined &&
		core.props.key !== null;

		let key;

		if (isText) {
			key = ':text:';
		}
		else if (hasExplicitKey) {
			key = core.props.key;
		}
		else if (typeof entity === "function") {
			key = getHotEntityCacheToken(entity);
		}
		else {
			key = entity;
		}

		return parent.cache.pick(
			key,
			() => (
				isText || isExistingCore
				? core
				: constructFunc(core, parent)[CORE]
			),
			entity
		);
	}
	catch (e) {
		if (core?.component?.componentDidCatch) {
			core.component.componentDidCatch(e);
		}
		else {
			throw e;
		}
	}
}



function constructFunc(core, parent) {
	let comp = core;

	if (core[TEXT] === undefined) {
		let entity = core.entity;
		let memoized = false;

		const loc = core?.props?.[LOCATION];
		if(loc) delete core.props[LOCATION];

		if (typeof entity === "object") {
			if (entity[MEMOIZED]) {
				memoized = entity[MEMOIZED];
				entity = entity.component;
			} else {
				throw new Error("Invalid component.");
			}
		}

		entity = resolveHotEntity(entity);

		if (typeof entity === "string") {
			comp = new HTMLComponent(entity, core.props);
		} 
		else if (isClass(entity)) {
			if (entity?.defaultProps) {
				core.props = {
					...entity.defaultProps,
					...core.props,
				};
			}

			comp = new entity(core.props);

			const desc = Object.getOwnPropertyDescriptor(comp, "state");

			if (desc) {
				if (
					typeof desc.get !== "function" &&
					typeof desc.set !== "function"
				) {
					comp[CORE].state = comp.state;

					Object.defineProperty(comp, "state", {
						get() {
							return this[CORE].state;
						},
						set(value) {
							if (this[CORE].state === undefined) {
								this[CORE].state = value;
							} else {
								throw new Error(
									"Assigning component state this way is not allowed."
								);
							}
						},
					});
				}
			}
		} 
		else if (typeof entity === "function") {
			if (entity?.defaultProps) {
				core.props = {
					...entity.defaultProps,
					...core.props,
				};
			}

			comp = new Component(core.props);
			comp.render = entity.bind(comp);
			comp[CORE].hooks = [];
			comp[CORE].hook_index = 0;
		}
		else {
			throw new Error("Error in constructing component.");
		}

		if(loc) comp[CORE].location = loc;

		comp[CORE].entity = entity;
		registerComponentCore(comp[CORE]);

		if (core.container) {
			comp[CORE].container = core.container;
		}

		if (memoized) {
			comp[CORE][MEMOIZED] = true;
		}
	}

	if (parent instanceof ComponentCore) {
		comp[CORE].parent = parent;
	}

	return comp;
}


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
	"onsubmit", "oncancel",
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
	Set(["disabled", "readOnly", "required", "checked", "multiple", "selected",
			 "hidden","open","loop","muted","controls","playsInline","allowFullScreen"]);


