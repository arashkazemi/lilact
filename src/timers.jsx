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

// note: lilact timers can be used without lilact. uncomment the directive below to
// get the transpiled version in dist directory.
//ʔ outputJS('./dist/timers.js');


ʔ defineSymbols("LILACT:TIMERS", ["CORE", "IDX", "DUE", "REPEAT", "CLEARED", "INTERVAL", "CALLBACK", "ARGS"] ) ʔ

/**
 * Timer helpers for a promise-friendly timer framework.
 *
 * These functions keep the same call signatures as the standard JavaScript timer APIs where applicable (`setTimeout`/`setInterval`/`clearTimeout`/`clearInterval`), but add extra capabilities for promise-friendly control and lifecycle management. This module can “grab” timers and later pause/resume/reset/release them, plus provide promise wrappers like `timeoutPromise` and `animationFramePromise`.
 *
 * - `setTimeout` / `setInterval`: schedule callbacks (same interface as the built-ins).
 * - `clearTimeout` / `clearInterval`: cancel scheduled timers (same interface as the built-ins).
 * - `grabTimers` / `pauseTimers` / `resumeTimers` / `resetTimers` / `releaseTimers`: manage tracked timers (implementation-dependent behavior).
 * - `timeoutPromise` / `animationFramePromise`: promise-based convenience wrappers.
 */


let timer_pause_time = undefined;
let current_timer_idx = -1;
let timer_list = [];
let timer_timeout = -1;
let all_timers = {};


// original functions
const _setTimeout = window.setTimeout,
_setInterval = window.setInterval,
_clearTimeout = window.clearTimeout,
_clearInterval = window.clearInterval;


function get_bucket(target) 
{
	let left = 0;
	let right = timer_list.length - 1;

	while (left <= right) {
		const mid = Math.floor((left + right) / 2);
		const mid_val = timer_list[mid][DUE];

		if (mid_val === target) {
			return [mid, timer_list[mid]];
		} 
		else if (mid_val < target) {
			left = mid + 1;
		} 
		else {
			right = mid - 1;
		}
	}

	const bucket = [];
	bucket[DUE] = target;

	timer_list.splice(left, 0, bucket); 
	return [left, bucket];
}

function add_timer(t, is_repeat=false)
{
	const [i,bucket] = get_bucket(t[DUE]);

	if(!is_repeat) {
		current_timer_idx++;
		all_timers[current_timer_idx]=t;
		t[IDX] = current_timer_idx;
	}

	bucket.push(t);

	if(timer_list[0][0]===t) {
		_clearTimeout( timer_timeout );
		timer_timeout = _setTimeout( run_timer, t[INTERVAL] );
	}

	return current_timer_idx;
}

function run_timer()
{
	const now = Date.now();

	let i = 0;
	let buck = timer_list[i];

	while( buck && buck[DUE]-now <= 0 ) {
		for(const t of buck) {

			if(!t[CLEARED]) {
				t[CALLBACK](...t[ARGS]);			
				if(t[REPEAT]) {
					t[DUE] = Date.now()+t[INTERVAL];
					add_timer(t, true);
				}
				else {
					delete all_timers[t[IDX]];
				}
			}
			else {
				delete all_timers[t[IDX]];
			}
		}
		i++;
		buck = timer_list[i];
	}

	timer_list.splice(0,i);

	if(timer_list.length>0) {
		_clearTimeout( timer_timeout );
		timer_timeout = _setTimeout( run_timer, timer_list[0][DUE] - now);
	}

}

//---

/**
 * Resets managed timers back to their initial scheduled state.
 * @returns {void}
 */
export function  resetTimers()
{
	_clearTimeout(timer_timeout);
	timer_pause_time = undefined;
	current_timer_idx = -1;
	timer_list = [];
	timer_timeout = -1;
	all_timers = {};
}

/**
 * Pauses all grabbed timers.
 * @returns {void}
 */
export function  pauseTimers()
{
	_clearTimeout( timer_timeout );
	timer_pause_time = Date.now();
}

/**
 * Resumes paused timers.
 * @returns {void}
 */
export function resumeTimers()
{
	if(!timer_pause_time) return;

	if(timer_list.length>0) {
		const now = Date.now();

		timer_pause_time -= now;

		for( const t of timer_list ) {
			t[DUE] -= timer_pause_time;
		}

		timer_timeout = _setTimeout( run_timer, timer_list[0][DUE] - now);
	}

	timer_pause_time = undefined;
}


/**
 * Creates a timeout timer (same interface as JS `setTimeout`).
 * @param {Function} callback - Function to run after the delay.
 * @param {number} delay - Delay in milliseconds.
 * @param {...any} [args] - Optional arguments passed to `callback`.
 * @returns {any} Timeout id.
 */


export function setTimeout(func, interval, ...args)
{
	return add_timer( { [CALLBACK]: func, [INTERVAL]: interval, [DUE]: Date.now()+interval, [REPEAT]: false, [ARGS]: args } );
}

/**
 * Creates an interval timer (same interface as JS `setInterval`).
 * @param {Function} callback - Function to run repeatedly.
 * @param {number} interval - Delay in milliseconds between executions.
 * @param {...any} [args] - Optional arguments passed to `callback`.
 * @returns {any} Interval id.
 */

export function setInterval(func, interval, ...args)
{
	return add_timer( { [CALLBACK]: func, [INTERVAL]: interval, [DUE]: Date.now()+interval, [REPEAT]: true, [ARGS]: args } );
}

/**
 * Clears a timeout created via this framework’s `setTimeout`.
 * @param {any} id - Timeout id returned by `setTimeout`.
 * @returns {void}
 */
export function clearTimeout(t)
{
	if(all_timers[t]) all_timers[t][CLEARED] = true;
}

/**
 * Clears an interval created via this framework’s `setInterval`.
 * @param {any} id - Interval id returned by `setInterval`.
 * @returns {void}
 */
export function clearInterval(t)
{
	if(all_timers[t]) all_timers[t][CLEARED] = true;
}

/**
 * Captures/associates all timers with the framework so they can be managed. Calling this will
 * shadow the global setTimeout and setInterval functions and channel them through Lilact.
 * @returns {void}
 */
export function grabTimers()
{
	globalThis.setTimeout = this.setTimeout;
	globalThis.setInterval = this.setInterval;
	globalThis.clearTimeout = this.clearTimeout;
	globalThis.clearInterval = this.clearInterval;
}

/**
 * Releases timers from framework control.
 * @returns {void}
 */
export function releaseTimers()
{
	globalThis.setTimeout = _setTimeout;
	globalThis.setInterval = _setInterval;
	globalThis.clearTimeout = _clearTimeout;
	globalThis.clearInterval = _clearInterval;
}

/**
 * Returns a Promise that resolves after a timeout (framework-managed) using the same delay semantics as `setTimeout`.
 * @param {number} duration - Delay in milliseconds.
 * @returns {Promise} Promise that resolves after the delay.
 */
export function timeoutPromise(duration=0, timer_source=this) 
{	
	let id, resolve, reject;

	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
		id = timer_source.setTimeout(() => {
			resolve();
		}, duration);
	});

	// note: proceed interrupts the timer, and continues the flow if used with await.
	promise.proceed = () => {
		timer_source.clearTimeout(id);
		resolve();
	};

	// note: cancel rejects so it throws exception when using with await, this allows handling it differently.
	promise.cancel = () => {
		timer_source.clearTimeout(id);
		reject();
	};

	return promise;
}

/**
 * Schedules a callback on the next animation frame and returns a Promise that resolves on that frame.
 * @returns {Promise} Promise that resolves when the animation frame runs.
 */
export function animationFramePromise() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}	

