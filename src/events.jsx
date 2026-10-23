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


export function createSyntheticEvent(nativeEvent, currentTarget) {
  let propagationStopped = false;

  const event = {
    nativeEvent,
    type: nativeEvent.type,
    target: nativeEvent.target || nativeEvent.srcElement || null,
    currentTarget: currentTarget || nativeEvent.currentTarget || null,
    timeStamp: nativeEvent.timeStamp ?? Date.now(),
    defaultPrevented: !!nativeEvent.defaultPrevented,

    isDefaultPrevented() {
      return event.defaultPrevented;
    },

    isPropagationStopped() {
      return propagationStopped;
    },

    preventDefault() {
      nativeEvent.preventDefault?.();
      event.defaultPrevented = true;
    },

    stopPropagation() {
      nativeEvent.stopPropagation?.();
      propagationStopped = true;
    },

    // Like React 17+ web SyntheticEvents: no pooling, persist is a no-op.
    persist() {},

    isPersistent() {
      return true;
    },
  };

  // Forward event-specific properties (such as WheelEvent.deltaX/deltaY)
  // and native methods that are not explicitly defined above.
  return new Proxy(event, {
    get(target, property, receiver) {
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver);
      }

      const value = Reflect.get(nativeEvent, property, nativeEvent);
      return typeof value === "function" ? value.bind(nativeEvent) : value;
    },

    has(target, property) {
      return Reflect.has(target, property) || property in nativeEvent;
    },
  });
}

export function releaseSyntheticEvent(event) {
  // Clear currentTarget after dispatch, but don't invalidate the event.
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
