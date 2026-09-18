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
import {
    IDX,
    DUE,
    REPEAT,
    CLEARED,
    INTERVAL,
    CALLBACK,
    ARGS
} from "./symbols.jsx";

/**
 * Timer helpers for a promise-friendly timer framework.
 *
 * These functions preserve the usual call signatures of the native
 * `setTimeout`, `setInterval`, `clearTimeout`, and `clearInterval` APIs
 * while adding timer tracking and lifecycle management.
 *
 * Managed timers can be paused, resumed, reset, or released. Promise-based
 * helpers are also provided through `timeoutPromise` and
 * `animationFramePromise`.
 *
 * The `Lilact._setTimeout`, `Lilact._setInterval`, `Lilact._clearTimeout`,
 * and `Lilact._clearInterval` properties must reference the original native
 * timer functions.
 */

let timer_pause_time;
let current_timer_idx = 0;
let timer_list = [];
let timer_timeout = 0;
let all_timers = new Map();

/**
 * Returns the timer bucket whose due time matches `target`, or creates a new
 * bucket in sorted order.
 *
 * Each bucket is an array containing timers and has its due time stored under
 * the `DUE` symbol.
 *
 * @param {number} target - Due time as a Unix timestamp in milliseconds.
 * @returns {[number, Array]} The bucket index and bucket.
 * @private
 */
function get_bucket(target) {
    let left = 0;
    let right = timer_list.length - 1;

    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const mid_value = timer_list[mid][DUE];

        if (mid_value === target) {
            return [mid, timer_list[mid]];
        }

        if (mid_value < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }

    const bucket = [];
    bucket[DUE] = target;

    timer_list.splice(left, 0, bucket);

    return [left, bucket];
}

function schedule_next_timer() {
    if (
        timer_pause_time !== undefined ||
        timer_list.length === 0
    ) {
        return;
    }

    Lilact._clearTimeout(timer_timeout);

    const delay = Math.max(
        0,
        timer_list[0][DUE] - Date.now()
    );

    timer_timeout = Lilact._setTimeout(run_timer, delay);
}

function add_timer(timer, is_repeat = false) {
    const [bucket_index, bucket] = get_bucket(timer[DUE]);

    if (!is_repeat) {
        current_timer_idx += 1;

        timer[IDX] = current_timer_idx;
        all_timers.set(timer[IDX], timer);
    }

    bucket.push(timer);

    /*
     * If this timer became the earliest timer, update the dispatcher.
     * Do not schedule anything while paused.
     */
    if (
        bucket_index === 0 &&
        timer_pause_time === undefined
    ) {
        schedule_next_timer();
    }

    return timer[IDX];
}

function run_timer() {
    /*
     * The native dispatcher has already fired. Its handle is no longer
     * pending.
     */
    timer_timeout = -1;

    const now = Date.now();
    const due_buckets = [];

    /*
     * Detach all due buckets before executing any callback.

     * This preserves the bucket design: all timers due at this point are
     * processed during this dispatcher turn, but callbacks can no longer
     * mutate the buckets currently being iterated.
     */
    while (
        timer_list.length > 0 &&
        timer_list[0][DUE] - now <= 0
    ) {
        due_buckets.push(timer_list.shift());
    }

    const due_timers = [];

    for (const bucket of due_buckets) {
        for (const timer of bucket) {
            due_timers.push(timer);
        }
    }

    let first_error;

    for (const timer of due_timers) {
        if (
            timer[CLEARED] ||
            all_timers.get(timer[IDX]) !== timer
        ) {
            all_timers.delete(timer[IDX]);
            continue;
        }

        try {
            timer[CALLBACK](...timer[ARGS]);
        } catch (error) {
            /*
             * One callback should not prevent the other callbacks from being
             * processed or prevent the dispatcher from being rescheduled.
             */
            first_error ??= error;
        }

        /*
         * The callback may have called clearTimeout() or clearInterval().
         * Check again after invoking it.
         */
        if (timer[CLEARED]) {
            all_timers.delete(timer[IDX]);
            continue;
        }

        /*
         * resetTimers() may have removed this timer from all_timers.
         * Do not resurrect it.
         */
        if (all_timers.get(timer[IDX]) !== timer) {
            continue;
        }

        if (timer[REPEAT]) {
            timer[DUE] = Date.now() + timer[INTERVAL];
            add_timer(timer, true);
        } else {
            all_timers.delete(timer[IDX]);
        }
    }

    /*
     * Use a fresh timestamp because callbacks may have taken time to run.
     */
    schedule_next_timer();

    /*
     * Report callback errors asynchronously, after timer bookkeeping has
     * completed.
     */
    if (first_error !== undefined) {
        Lilact._setTimeout(() => {
            throw first_error;
        }, 0);
    }
}


/**
 * Resets all managed timers and removes them from the framework.
 *
 * Existing native timers are canceled, all managed timer registrations are
 * discarded, and the next managed timer ID starts at zero.
 *
 * @returns {void}
 */
export function resetTimers() {
    Lilact._clearTimeout(timer_timeout);

    for (const timer of all_timers.values()) {
        timer[CLEARED] = true;
    }

    timer_pause_time = undefined;
    current_timer_idx = -1;
    timer_list = [];
    timer_timeout = -1;
    all_timers = new Map();
}


/**
 * Pauses all currently managed timers.
 *
 * Timers created while the framework is paused are also held until
 * `resumeTimers()` is called.
 *
 * Calling this function more than once while already paused has no effect.
 *
 * @returns {void}
 */
export function pauseTimers() {
    if (timer_pause_time !== undefined) {
        return;
    }

    Lilact._clearTimeout(timer_timeout);
    timer_timeout = -1;
    timer_pause_time = Date.now();
}

/**
 * Resumes managed timers that were paused with `pauseTimers()`.
 *
 * Each pending timer is shifted forward by the amount of time spent paused,
 * preserving the remaining delay it had when the pause began.
 *
 * @returns {void}
 */
export function resumeTimers() {
    if (timer_pause_time === undefined) {
        return;
    }

    const elapsed = Date.now() - timer_pause_time;

    for (const bucket of timer_list) {
        bucket[DUE] += elapsed;
    }

    timer_pause_time = undefined;

    schedule_next_timer();
}


/**
 * Creates a managed timeout timer.
 *
 * The signature matches the native `setTimeout` API. Additional arguments are
 * passed to the callback when it executes.
 *
 * @param {Function} callback - Function to execute after the delay.
 * @param {number} [delay=0] - Delay in milliseconds.
 * @param {...any} args - Arguments passed to `callback`.
 * @returns {number} Managed timeout ID.
 */
export function setTimeout(callback, delay = 0, ...args) {
    const milliseconds = Math.max(0, Number(delay) || 0);

    return add_timer({
        [CALLBACK]: callback,
        [INTERVAL]: milliseconds,
        [DUE]: Date.now() + milliseconds,
        [REPEAT]: false,
        [CLEARED]: false,
        [ARGS]: args
    });
}

/**
 * Creates a managed interval timer.
 *
 * The signature matches the native `setInterval` API. Additional arguments are
 * passed to the callback on every execution.
 *
 * @param {Function} callback - Function to execute repeatedly.
 * @param {number} [interval=0] - Interval in milliseconds.
 * @param {...any} args - Arguments passed to `callback`.
 * @returns {number} Managed interval ID.
 */
export function setInterval(callback, interval = 0, ...args) {
    const milliseconds = Math.max(0, Number(interval) || 0);

    return add_timer({
        [CALLBACK]: callback,
        [INTERVAL]: milliseconds,
        [DUE]: Date.now() + milliseconds,
        [REPEAT]: true,
        [CLEARED]: false,
        [ARGS]: args
    });
}

/**
 * Clears a managed timeout.
 *
 * If `id` does not belong to a managed timer, it is passed to the original
 * native `clearTimeout` function.
 *
 * @param {number} id - Timeout ID returned by `setTimeout`.
 * @returns {void}
 */
export function clearTimeout(id) {
    const timer = all_timers.get(id);

    if (timer !== undefined) {
        timer[CLEARED] = true;
    } else {
        Lilact._clearTimeout(id);
    }
}


/**
 * Clears a managed interval.
 *
 * If `id` does not belong to a managed timer, it is passed to the original
 * native `clearInterval` function.
 *
 * @param {number} id - Interval ID returned by `setInterval`.
 * @returns {void}
 */
export function clearInterval(id) {
    const timer = all_timers.get(id);

    if (timer !== undefined) {
        timer[CLEARED] = true;
    } else {
        Lilact._clearInterval(id);
    }
}


/**
 * Captures global timer functions through this framework.
 *
 * After calling this function, global calls to `setTimeout`, `setInterval`,
 * `clearTimeout`, and `clearInterval` use the managed implementations.
 *
 * @returns {void}
 */
export function grabTimers() {
    globalThis.setTimeout = Lilact.setTimeout;
    globalThis.setInterval = Lilact.setInterval;
    globalThis.clearTimeout = Lilact.clearTimeout;
    globalThis.clearInterval = Lilact.clearInterval;
}

/**
 * Releases global timer functions from this framework.
 *
 * After calling this function, global timer calls use the original native
 * timer implementations.
 *
 * @returns {void}
 */
export function releaseTimers() {
    globalThis.setTimeout = Lilact._setTimeout;
    globalThis.setInterval = Lilact._setInterval;
    globalThis.clearTimeout = Lilact._clearTimeout;
    globalThis.clearInterval = Lilact._clearInterval;
}

/**
 * Creates a Promise that resolves after a managed timeout.
 *
 * The returned Promise has two additional methods:
 *
 * - `proceed()` clears the timer and resolves the Promise.
 * - `cancel()` clears the timer and rejects the Promise.
 *
 * @param {number} [duration=0] - Delay in milliseconds.
 * @param {Object} [timerSource=Lilact] - Object providing timer functions.
 * @returns {Promise} Promise that resolves after the timeout.
 */
export function timeoutPromise(duration = 0, timerSource = Lilact) {
    let id;
    let resolve_promise;
    let reject_promise;

    const promise = new Promise((resolve, reject) => {
        resolve_promise = resolve;
        reject_promise = reject;

        id = timerSource.setTimeout(() => {
            resolve();
        }, duration);
    });

    /**
     * Clears the timer and resolves the Promise immediately.
     *
     * @returns {void}
     */
    promise.proceed = () => {
        timerSource.clearTimeout(id);
        resolve_promise();
    };

    /**
     * Clears the timer and rejects the Promise immediately.
     *
     * @returns {void}
     */
    promise.cancel = () => {
        timerSource.clearTimeout(id);
        reject_promise();
    };

    return promise;
}

/**
 * Creates a Promise that resolves on the next animation frame.
 *
 * @returns {Promise} Promise resolved when the next animation frame runs.
 */
export function animationFramePromise() {
    return new Promise((resolve) => {
        requestAnimationFrame(() => {
            resolve();
        });
    });
}
