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

import Lilact, {isClass} from './lilact.jsx';

import { IDX, MEMOIZED } from "./symbols.jsx"


function getComponentEntity(entity) {
	return entity?.[MEMOIZED] ? entity.component : entity;
}

const hotEntityAliases = new Map();
const hotEntityCacheTokens = new WeakMap();

function getHotEntityCacheToken(entity) {
	entity = getComponentEntity(entity);

	if (typeof entity !== "function") {
		return entity;
	}

	let token = hotEntityCacheTokens.get(entity);

	if (!token) {
		const resolved = resolveHotEntity(entity);
		token = hotEntityCacheTokens.get(resolved) || {};
		hotEntityCacheTokens.set(entity, token);
		hotEntityCacheTokens.set(resolved, token);
	}

	return token;
}

export function resolveHotEntity(entity) {
	entity = getComponentEntity(entity);

	const visited = new Set();

	while (
		typeof entity === "function" &&
		hotEntityAliases.has(entity) &&
		!visited.has(entity)
	) {
		visited.add(entity);
		entity = hotEntityAliases.get(entity);
	}

	return entity;
}

const componentInstances = new Map();

export function registerComponentCore(core) {
	const entity = getComponentEntity(core.entity);

	if (typeof entity !== "function") return;

	let instances = componentInstances.get(entity);

	if (!instances) {
		instances = new Set();
		componentInstances.set(entity, instances);
	}

	instances.add(core);
	core.registered_entity = entity;
}

export function unregisterComponentCore(core) {
	const entity = core.registered_entity;
	if (!entity) return;

	const instances = componentInstances.get(entity);

	if (instances) {
		instances.delete(core);

		if (instances.size === 0) {
			componentInstances.delete(entity);
		}
	}

	delete core.registered_entity;
}

function moveComponentCore(core, oldEntity, newEntity) {
	const oldInstances = componentInstances.get(oldEntity);

	if (oldInstances) {
		oldInstances.delete(core);

		if (oldInstances.size === 0) {
			componentInstances.delete(oldEntity);
		}
	}

	let newInstances = componentInstances.get(newEntity);

	if (!newInstances) {
		newInstances = new Set();
		componentInstances.set(newEntity, newInstances);
	}

	newInstances.add(core);
	core.registered_entity = newEntity;
}

function replaceComponentEntity(componentCore, nextEntity) {
	if (!componentCore || typeof nextEntity !== "function") {
		return false;
	}

	const oldEntity = getComponentEntity(componentCore.entity);
	const newEntity = resolveHotEntity(nextEntity);

	const cacheToken = hotEntityCacheTokens.get(oldEntity) || hotEntityCacheTokens.get(newEntity) || {};

	hotEntityCacheTokens.set(oldEntity, cacheToken);
	hotEntityCacheTokens.set(newEntity, cacheToken);

	if (oldEntity === newEntity) {
		return true;
	}

	const component = componentCore.component;

	if (!component) {
		return false;
	}

	if (
		typeof oldEntity !== "function" ||
		typeof newEntity !== "function" ||
		isClass(oldEntity) !== isClass(newEntity)
	) {
		return false;
	}

	if (isClass(newEntity)) {
		Object.setPrototypeOf(component, newEntity.prototype);
	} else {
		component.render = newEntity.bind(component);
	}

	componentCore.entity = newEntity;
	moveComponentCore(componentCore, oldEntity, newEntity);

	return true;
}

export function replaceAllComponentInstances(oldEntity, newEntity) 
{
	oldEntity = getComponentEntity(oldEntity);
	newEntity = getComponentEntity(newEntity);

	if (
		typeof oldEntity !== "function" ||
		typeof newEntity !== "function"
	) {
		return 0;
	}

	newEntity = resolveHotEntity(newEntity);

	if (oldEntity === newEntity) {
		return 0;
	}

	const cacheToken = hotEntityCacheTokens.get(oldEntity) || hotEntityCacheTokens.get(newEntity) || {};

	hotEntityCacheTokens.set(oldEntity, cacheToken);
	hotEntityCacheTokens.set(newEntity, cacheToken);

	hotEntityAliases.set(oldEntity, newEntity);

	const instances = componentInstances.get(oldEntity);

	if (!instances) {
		return 0;
	}

	let count = 0;

	for (const core of [...instances]) {
		if (!replaceComponentEntity(core, newEntity)) {
			continue;
		}

		core.apply(core.props, core.state);
		count++;
	}

	return count;
}



export class ComponentCache 
{
	owner;
	current_map = new Map;
	new_map = new Map;
	pick_index = 0;

	constructor(owner)
	{
		this.owner = owner;
	}

	pick(key, construct_func, nextEntity) {
		let componentCore;
		let bucket = this.current_map.get(key);

		if (bucket && bucket.length > bucket[IDX]) {
			componentCore = bucket[bucket[IDX]];
			bucket[IDX]++;

			const oldEntity = getComponentEntity(componentCore.entity);
			const newEntity = resolveHotEntity(nextEntity);

			const incompatible =
			typeof oldEntity !== typeof newEntity ||
			(
				typeof oldEntity === "function" &&
				isClass(oldEntity) !== isClass(newEntity)
			);

			if (incompatible) {
				componentCore = construct_func();
			} else if (newEntity) {
				replaceComponentEntity(componentCore, newEntity);
			}
		} else {
			componentCore = construct_func();
		}

		bucket = this.new_map.get(key);

		if (bucket) {
			bucket.push(componentCore);
		} else {
			bucket = [componentCore];
			this.new_map.set(key, bucket);
			bucket[IDX] = 0;
		}

		if (componentCore) {
			componentCore.parent ??= this.owner;
		}

		return componentCore;
	}

	commit() 
	{
		this.current_map.forEach( (arr)=>{
			arr.slice(arr[IDX]).forEach((ex)=>{
				if(ex.cleanup) {
					ex.cleanup();
				}
				if(ex.element && !ex.portal) {
					ex.element?.remove?.();
				}
			});
		});

		this.current_map = this.new_map; 
		this.new_map = new Map;
	}

}