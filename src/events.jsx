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


export class SyntheticEvent {
	constructor(nativeEvent, currentTarget) {
		this.nativeEvent = nativeEvent;
		this.type = nativeEvent.type;
		this.target = nativeEvent.target || nativeEvent.srcElement || null;
		this.currentTarget = currentTarget || nativeEvent.currentTarget || null;
		this.timeStamp = nativeEvent.timeStamp ?? Date.now();
		this.defaultPrevented = !!nativeEvent.defaultPrevented;

		let propagationStopped = false;

		this.isDefaultPrevented = () => this.defaultPrevented;
		this.isPropagationStopped = () => propagationStopped;
		this.preventDefault = () => {
			nativeEvent.preventDefault?.();
			this.defaultPrevented = true;
		};
		this.stopPropagation = () => {
			nativeEvent.stopPropagation?.();
			propagationStopped = true;
		};

		// Modern React doesn't pool events, so persist is a no-op.
		this.persist = () => {};
		this.isPersistent = () => true;

		for (
			let source = nativeEvent;
			source && source !== Object.prototype;
			source = Object.getPrototypeOf(source)
		) {
			for (const key of Object.getOwnPropertyNames(source)) {
				if (key === "constructor" || key in this) continue;

				Object.defineProperty(this, key, {
					configurable: true,
					enumerable: true,
					get() {
						const value = nativeEvent[key];
						return typeof value === "function"
							? value.bind(nativeEvent)
							: value;
					},
				});
			}
		}
	}
}

export function createSyntheticEvent(nativeEvent, currentTarget) {
	return new SyntheticEvent(nativeEvent, currentTarget);
}

export function releaseSyntheticEvent(event) {
	if (event) event.currentTarget = null;
}

export function wrapListener(fn, opts = {}) {
	const { stopPropagationOnTrueReturn = false } = opts;

	return function handler(nativeEvent) {
		const event = createSyntheticEvent(
			nativeEvent,
			this || nativeEvent.currentTarget || null
		);

		try {
			const result = fn(event);
			if (stopPropagationOnTrueReturn && result === true) {
				event.stopPropagation();
			}
		} finally {
			releaseSyntheticEvent(event);
		}
	};
}

export function addWrappedEventListener(target, type, fn, options = {}) {
	const handler = wrapListener(fn, options);
	target.addEventListener(type, handler, options);

	return () => target.removeEventListener(type, handler, options);
}
