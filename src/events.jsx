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
const POINTER_TYPES = ["mouse", "pen", "touch"];

export function createSyntheticEvent(nativeEvent, currentTarget) {
  const e = _pool.length ? _pool.pop() : {};

  e.nativeEvent = nativeEvent;
  e.type = nativeEvent.type;
  e.target = nativeEvent.target || nativeEvent.srcElement || null;
  e.currentTarget = currentTarget || nativeEvent.currentTarget || null;
  e.timeStamp = nativeEvent.timeStamp || Date.now();

  // Standard flags
  e.defaultPrevented = !!nativeEvent.defaultPrevented;
  e.isPropagationStopped = false;
  e.isPersistent = false;

  // Common DOM meta when present
  e.bubbles = !!nativeEvent.bubbles;
  e.cancelable = !!nativeEvent.cancelable;
  e.composed = !!nativeEvent.composed;
  e.detail = nativeEvent.detail;

  e.relatedTarget =
    nativeEvent.relatedTarget ||
    (nativeEvent.fromElement ? nativeEvent.fromElement : null) ||
    (nativeEvent.toElement ? nativeEvent.toElement : null) ||
    null;

  // Modifier keys
  e.altKey = !!nativeEvent.altKey;
  e.ctrlKey = !!nativeEvent.ctrlKey;
  e.metaKey = !!nativeEvent.metaKey;
  e.shiftKey = !!nativeEvent.shiftKey;

  // preventDefault / stopPropagation
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

  // Key/mouse/pointer related
  e.key = nativeEvent.key || null;
  e.code = nativeEvent.code || null;
  e.which = nativeEvent.which ?? nativeEvent.keyCode ?? null;

  // Mouse / Pointer button state normalization
  // - "button" often is 0/1/2 for mouse; for pointer events it's also present.
  // - "buttons" is a bitmask of which buttons are down (often important for drag).
  e.button = nativeEvent.button ?? null;
  e.buttons = nativeEvent.buttons ?? null;

  // Pointer identity + type (critical for multi-touch / pointer capture)
  e.pointerId = nativeEvent.pointerId ?? null;
  e.pointerType = nativeEvent.pointerType ?? null;
  e.isPrimary = nativeEvent.isPrimary ?? null;

  // Coordinates: React/SyntheticEvent uses these directly (React provides them too)
  e.clientX = nativeEvent.clientX ?? 0;
  e.clientY = nativeEvent.clientY ?? 0;
  e.screenX = nativeEvent.screenX ?? 0;
  e.screenY = nativeEvent.screenY ?? 0;

  // pageX/pageY might be derived; keep if present
  // (Using pageX/pageY only if you need it; most drag uses clientX/Y.)
  e.pageX = nativeEvent.pageX ?? null;
  e.pageY = nativeEvent.pageY ?? null;

  // movementX/movementY exist on some mouse events; harmless if absent
  e.movementX = nativeEvent.movementX ?? 0;
  e.movementY = nativeEvent.movementY ?? 0;

  // Pressure/tilt (Pointer Events)
  e.pressure = nativeEvent.pressure ?? null;
  e.tiltX = nativeEvent.tiltX ?? null;
  e.tiltY = nativeEvent.tiltY ?? null;
  e.width = nativeEvent.width ?? null;
  e.height = nativeEvent.height ?? null;

  // If the native event has a pointer capture API, you can forward bind/capture calls.
  // (These are methods on the EventTarget, not on the event, but keeping fields is enough.)
  e.pointerEventsSupported = POINTER_TYPES.includes(e.pointerType);

  // For input-like events normalize value and checked
  try {
    const tgt = e.target;
    e.value = tgt && ("value" in tgt) ? tgt.value : undefined;
    e.checked = tgt && ("checked" in tgt) ? tgt.checked : undefined;

    // Some input events have selectionStart/selectionEnd etc.
    e.selectionStart = tgt && ("selectionStart" in tgt) ? tgt.selectionStart : undefined;
    e.selectionEnd = tgt && ("selectionEnd" in tgt) ? tgt.selectionEnd : undefined;
  } catch (err) {
    e.value = undefined;
    e.checked = undefined;
    e.selectionStart = undefined;
    e.selectionEnd = undefined;
  }

  // Touch lists (useful for touch events; sometimes pointerType === "touch" uses pointer events instead)
  // Keep references only if they exist.
  e.touches = nativeEvent.touches || null;
  e.targetTouches = nativeEvent.targetTouches || null;
  e.changedTouches = nativeEvent.changedTouches || null;

  // composedPath helper
  e.path = typeof nativeEvent.composedPath === "function"
    ? nativeEvent.composedPath()
    : [e.target];

  // Additional keyboard extras when present
  e.repeat = nativeEvent.repeat ?? false;
  e.location = nativeEvent.location ?? 0;

  return e;
}

export function releaseSyntheticEvent(e) {
  if (e && !e.isPersistent) {
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

    e.bubbles = false;
    e.cancelable = false;
    e.composed = false;
    e.detail = undefined;
    e.relatedTarget = null;

    // modifier keys
    e.altKey = false;
    e.ctrlKey = false;
    e.metaKey = false;
    e.shiftKey = false;

    // pointer/mouse fields
    e.key = null;
    e.code = null;
    e.which = null;

    e.button = null;
    e.buttons = null;
    e.pointerId = null;
    e.pointerType = null;
    e.isPrimary = null;

    e.clientX = 0;
    e.clientY = 0;
    e.screenX = 0;
    e.screenY = 0;
    e.pageX = null;
    e.pageY = null;

    e.movementX = 0;
    e.movementY = 0;

    e.pressure = null;
    e.tiltX = null;
    e.tiltY = null;
    e.width = null;
    e.height = null;

    // input-like
    e.value = undefined;
    e.checked = undefined;
    e.selectionStart = undefined;
    e.selectionEnd = undefined;

    // touch lists
    e.touches = null;
    e.targetTouches = null;
    e.changedTouches = null;

    e.path = null;
    e.repeat = false;
    e.location = 0;

    if (_pool.length < MAX_POOL_SIZE) _pool.push(e);
  }
}


// Main wrapper factory
// fn: function(syntheticEvent) { ... }
// opts: { capture: bool, passive: bool, once: bool, stopPropagationOnTrueReturn: bool }
export function wrapListener(fn, opts = {}) {
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
export function addWrappedEventListener(target, type, fn, options = {}) {
	const handler = wrapListener(fn, options);

	target.addEventListener(type, handler, options);
	// Return a remover
	return () => target.removeEventListener(type, handler, options);
}
