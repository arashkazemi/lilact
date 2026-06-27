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

// Export (CommonJS / ES module-friendly)
const EventWrapper = {
	wrapListener,
	addWrappedEventListener,
	createSyntheticEvent, // exported for advanced use
	releaseSyntheticEvent
};

export default EventWrapper;
