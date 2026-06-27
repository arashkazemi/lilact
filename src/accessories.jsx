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

import {isThenable} from "./misc.jsx"
import {setTimeout, clearTimeout} from "./timers.jsx"
import {Component} from "./components.jsx"

/*
type SpinnerProps = {
	size?: number; // px
	className?: string;
	style?: React.CSSProperties;
	color?: string; // stroke/fill color
	strokeWidth?: number; // px
	"aria-label"?: string;
};
*/

/**
 * A CSS-only loading spinner component.
 * 
 * @param props Component props
 * @param props.size Spinner size in pixels (spinner element width/height). Default: `48`.
 * @param props.className Optional class applied to the outer container.
 * @param props.style Optional inline styles applied to the outer container.
 * @param props.color Color used for the animated segment (defaults to `currentColor`).
 * @param props.strokeWidth Ring/border thickness in pixels. Default: `3`.
 * @param props["aria-label"] Screen-reader label. Default: `"Loading"`.
 * @returns A centered spinner filling its parent container.
 */

export function Spinner({
  size = 48,
  className,
  style,
  color = "currentColor",
  strokeWidth = 3,
  "aria-label": ariaLabel = "Loading",
}) {
  const s = Math.max(1, size)+"px";

  return (
    <div
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        placeItems: "center",
        ...style,
      }}
      aria-label={ariaLabel}
      role="status"
    >
      <div
        style={{
          width: s,
          height: s,
          borderRadius: "50%",
          border: `${strokeWidth}px solid rgba(0,0,0,0.15)`,
          borderTopColor: color,
          animation: "ddSpinnerSpin 0.9s linear infinite",
          boxSizing: "border-box",
        }}
      />
      <style>{`
        @keyframes ddSpinnerSpin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}



/**
 * ErrorBoundary component that catches errors in its child component tree and renders a fallback UI.
 *
 * @component
 *
 * @param {Object} props
 * @param {any} props.children - The component subtree to render and monitor for runtime errors.
 * @param {any} props.Fallback - UI to render when an error is caught. Receives two props:
 *  - `error` (the exception)
 *  - `reset` (function to clear the error)
 * @param {Function} props.onError - Callback invoked on error with arguments `(error, info)`.
 */

export class ErrorBoundary extends Component {
	
	state = { hasError: false, error: null };

	static getDerivedStateFromError(error) {
		return { hasError: true, error };
	}

	componentDidCatch(error, info) {
		const { onError } = this.props;
		try { if (onError) onError(error, info); } catch (e) { console.error("onError threw", e); }
	}

	reset = () => this.setState({ hasError: false, error: null });

	render() {
		const { Fallback, children } = this.props;
		if (this.state.hasError) return <Fallback error={this.state.error} reset={this.reset} />;
		return children;
	}
}


/**
 * Suspense - boundary for asynchronous loading.
 * Shows a fallback UI while descendant thrown promises are pending, and renders real content once resolved.
 *
 * @component Suspense
 *
 * @param {Object} props
 * @param {any} props.fallback - Element shown while descendants are loading.
 * @param {any} props.children - Suspended children.
 * @param {any} props.minDelay - A delay before showing the fallback to prevent flicker.
 * @param {any} props.minShowTime - A minimum time of fallback visibility to prevent flickers.
 */

export class Suspense extends Component 
{

	static defaultProps = { minDelay: 200, minShowTime: 300 };

	constructor(props) {

		super(props);
		this.state = { showingFallback: false };

		this._pending = new Set();

		this._delayTimer = null;
		this._minShowTimer = null;
		this._fallbackShownAt = 0;
	}

	static getDerivedStateFromError(error) {
		if (Lilact.isThenable(error)) {
			// signal to call componentDidCatch where we handle the thenable
			return null;
		}
		// non-thenable errors should bubble to nearest Error Boundary
		throw error;
	}

	componentDidCatch(error) {
		if (!Lilact.isThenable(error)) return;

		const promise = error;

		if (this._pending.has(promise)) return;

		// Add to set of pending promises
		this._pending.add(promise);

		// Start delay timer only when this is the first pending promise
		if (this._pending.size === 1) {
			const delay = Math.max(0, this.props.minDelay);
			// Ensure no leftover timers
			if (this._delayTimer) {
				Lilact.clearTimeout(this._delayTimer);
				this._delayTimer = null;
			}
			this._delayTimer = Lilact.setTimeout(() => {
				this._delayTimer = null;
				this._fallbackShownAt = Date.now();
				this.setState({ showingFallback: true });
			}, delay);
		}
	}

	componentWillUnmount() {
		this._clearTimers();
		this._pending.clear();
	}

	_clearTimers() {
		if (this._delayTimer) {
			Lilact.clearTimeout(this._delayTimer);
			this._delayTimer = null;
		}
		if (this._minShowTimer) {
			Lilact.clearTimeout(this._minShowTimer);
			this._minShowTimer = null;
		}
	}

	_attachPromise(promise) {
		if (this._pending.has(promise)) return;
		this._pending.add(promise);

		if (this._pending.size === 1) {
			const delay = Math.max(0, this.props.minDelay);
			if (this._delayTimer) {
				Lilact.clearTimeout(this._delayTimer);
				this._delayTimer = null;
			}
			this._delayTimer = Lilact.setTimeout(() => {
				this._delayTimer = null;
				this._fallbackShownAt = Date.now();
				this.setState({ showingFallback: true });
			}, delay);
		}

		// use a wrapper so we can remove exactly this promise identity when settled
		const onSettled = () => {
			if (this._pending.has(promise)) {
				this._pending.delete(promise);
			}
			// If none left, hide fallback respecting minShowTime
			if (this._pending.size === 0) {
				// cancel delay if fallback hasn't shown yet
				if (this._delayTimer) {
					Lilact.clearTimeout(this._delayTimer);
					this._delayTimer = null;
					// fallback never shown; just ensure state is not showing
					this.setState({ showingFallback: false });
					return;
				}

				// If fallback is showing, ensure minShowTime
				const elapsed = Date.now() - (this._fallbackShownAt || 0);
				const remaining = Math.max(0, this.props.minShowTime - elapsed);

				if (remaining === 0) {
					this.setState({ showingFallback: false });
				} else {
					if (this._minShowTimer) {
						Lilact.clearTimeout(this._minShowTimer);
						this._minShowTimer = null;
					}
					this._minShowTimer = Lilact.setTimeout(() => {
						this._minShowTimer = null;
						this.setState({ showingFallback: false });
					}, remaining);
				}
			}
		};

		// attach handlers
		promise.then(onSettled, onSettled);
	}

	componentDidCatch(error, info) {
		if (!Lilact.isThenable(error)) return;
		this._attachPromise(error);
	}

	render() {
		if (this.state.showingFallback) {
			return <>{this.props.fallback}</>;
		}
		return <>{this.props.children}</>;
	}
}

