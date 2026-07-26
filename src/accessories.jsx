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


import { useEffect, useLayoutEffect, useMemo, useRef, useState, useImperativeHandle } from "./hooks.jsx";
import { Children, forwardRef } from "./misc.jsx";


import {isThenable} from "./misc.jsx"
import {setTimeout, clearTimeout} from "./timers.jsx"
import {Component} from "./components.jsx"
import {useCallback} from './hooks.jsx'
import {emotion} from "./lilact.jsx"
const {css,cx} = emotion;

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
 * @param {Object} props
 * @param {any} props.children - The component subtree to render and monitor for runtime errors.
 * @param {any} props.Fallback - UI to render when an error is caught. Receives two props:
 *  - `error` (the exception)
 *  - `reset` (function to clear the error)
 * @param {Function} props.onError - Callback invoked on error with arguments `(error, info)`.
 */

export class ErrorBoundary extends Component {
	displayName = 'ErrorBoundary';
	
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
 * @param {Object} props
 * @param {any} props.fallback - Element shown while descendants are loading.
 * @param {any} props.children - Suspended children.
 * @param {any} props.minDelay - A delay before showing the fallback to prevent flicker.
 * @param {any} props.minShowTime - A minimum time of fallback visibility to prevent flickers.
 */

export class Suspense extends Component 
{
	displayName = 'Suspense';

	static defaultProps = { minDelay: 200, minShowTime: 300 };

	constructor(props) {

		super(props);
/** @ignore */
		this.state = { showingFallback: false };

/** @ignore */
		this._pending = new Set();

/** @ignore */
		this._delayTimer = null;
/** @ignore */
		this._minShowTimer = null;
/** @ignore */
		this._fallbackShownAt = 0;
	}

/** @ignore */
	static getDerivedStateFromError(error) {
		if (Lilact.isThenable(error)) {
			// signal to call componentDidCatch where we handle the thenable
			return null;
		}
		// non-thenable errors should bubble to nearest Error Boundary
		throw error;
	}

/** @ignore */
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

/** @ignore */
	componentWillUnmount() {
		this._clearTimers();
		this._pending.clear();
	}

/** @ignore */
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

/** @ignore */
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

/** @ignore */
	componentDidCatch(error, info) {
		if (!Lilact.isThenable(error)) return;
		this._attachPromise(error);
	}

/** @ignore */
	render() {
		if (this.state.showingFallback) {
			return <>{this.props.fallback}</>;
		}
		return <>{this.props.children}</>;
	}
}

/**
 * DragHandle - helper component to wire up drag interactions.
 *
 * This component does not implement dragging/movement itself. Instead, it
 * listens for drag gesture events and delegates them to the provided callbacks.
 *
 * @param {object} props
 * @param {(x: number, y: number, data: any) => void} [props.onDelta]
 * Called when the drag position changes.
 *
 * @param {(data: any) => void} [props.onStart]
 * Called when the drag begins.
 *
 * @param {(event: ("up"|"cancel"), data: any) => void} [props.onEnd]
 * Called when the drag ends or is cancelled.
 *
 * @param {any} [props.data] Arbitrary user data passed through callbacks.
 * @param {object} [props.style] Optional style applied to the wrapper element.
 * @param {string} [props.className] Optional CSS class applied to the wrapper element. 
 * A `.dragging` class will be also applied when dragging.
 * 
 * @param {React.ReactNode} [props.children] Content rendered inside the handle.
 */

export function DragHandle({
	onDelta,
	onStart,
	onEnd,
	style,
	className,
	children,
	data
}) {
	const activePointerIdRef = useRef(null);
	const startClientXRef = useRef(0);
	const startClientYRef = useRef(0);
	const lastClientXRef = useRef(0);
	const lastClientYRef = useRef(0);
	const draggingRef = useRef(false);

	const [isDragging, setIsDragging] = useState(false);

	const resetDrag = useCallback(() => {
		activePointerIdRef.current = null;
		draggingRef.current = false;
		startClientXRef.current = 0;
		startClientYRef.current = 0;
		lastClientXRef.current = 0;
		lastClientYRef.current = 0;
		setIsDragging(false);
	}, []);

	const computeDeltaFromStart = useCallback((clientX, clientY) => {
		const dx = clientX - startClientXRef.current;
		const dy = clientY - startClientYRef.current;
		return { dx, dy };
	}, []);

	const endDrag = useCallback((reason = "up") => {
		if (!draggingRef.current) return;
		onEnd?.(reason);
		resetDrag();
	}, [onEnd, resetDrag]);

	const onPointerDown = useCallback((e) => {
		// todo: only left mouse / primary touch, should other buttons be supported too? 
		if (e.button != null && e.button !== 0) return;

		draggingRef.current = true;
		activePointerIdRef.current = e.pointerId;

		startClientXRef.current = e.clientX;
		startClientYRef.current = e.clientY;
		lastClientXRef.current = e.clientX;
		lastClientYRef.current = e.clientY;

		setIsDragging(true);
		onStart?.(data);

		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {
			// ignore if unsupported
		}
	}, [onStart]);

	const onPointerMove = useCallback((e) => {
		if (!draggingRef.current) return;
		if (activePointerIdRef.current !== e.pointerId) return;

		const { dx, dy } = computeDeltaFromStart(e.clientX, e.clientY);
		onDelta?.(dx, dy, data);

		lastClientXRef.current = e.clientX;
		lastClientYRef.current = e.clientY;
	}, [computeDeltaFromStart, onDelta]);

	const onPointerUp = useCallback((e) => {
		if (activePointerIdRef.current !== e.pointerId) return;
		endDrag("up", data);
	}, [endDrag]);

	const onPointerCancel = useCallback((e) => {
		if (activePointerIdRef.current !== e.pointerId) return;
		endDrag("cancel", data);
	}, [endDrag]);

	return (
		<div
			role="button"
			tabIndex={0}
			style={{ ...style, touchAction: "none" }}
			className={cx(className, isDragging?"dragging":"")}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerCancel}
		>
			{children}
		</div>
	);
}



const clamp = (n, min, max) => {
  if (!Number.isFinite(n)) return n;
  return Math.min(max, Math.max(min, n));
};

/**
 * A split-pane container with a draggable splitter, supporting both horizontal and vertical layouts.
 *
 * The pane can be either:
 * - **Controlled** via the `position` prop (number between `min` and `max`), or
 * - **Uncontrolled** via `defaultPosition` (used as the initial position).
 *
 * Layout behavior:
 * - `mode="horizontal"`: the `position` controls the width of the **left** pane.
 * - `mode="vertical"`: the `position` controls the height of the **top** pane.
 *
 * Ref API:
 * - Exposes imperative methods on `ref.current`:
 *   - `getMode()` to get the current mode
 *   - `setMode(mode)` to switch between `"horizontal"` and `"vertical"`
 *   - `getPosition()` to get the current splitter position
 *   - `setPosition(position)` to update the splitter position
 *
 * Events:
 * - Calls `onSizeChange(position)` whenever the pane size/position changes (e.g., via dragging).
 *
 * Rendering:
 * - Renders `children` into two separate containers (no portals).
 *
 * @param mode - Split direction: `"horizontal"` or `"vertical"`. Defaults to `"horizontal"`.
 * @param position - Controlled splitter position. Normalized value within `[min, max]`.
 * If provided, the component uses this value instead of internal state.
 * @param defaultPosition - Initial splitter position for uncontrolled usage. Defaults to `0.5`.
 * @param min - Minimum allowed position. Defaults to `0.1`.
 * @param max - Maximum allowed position. Defaults to `0.9`.
 * @param splitterSize - Thickness of the draggable splitter in pixels. Defaults to `8`.
 * @param onSizeChange - Callback invoked when the position changes. Receives the new normalized position.
 * @param style - Optional root container styles.
 * @param className - Optional root container CSS class.
 * @param leftPaneStyle - Optional styles applied to the left pane (or top pane in vertical mode).
 * @param rightPaneStyle - Optional styles applied to the right pane (or bottom pane in vertical mode).
 * @param splitterStyle - Optional styles applied to the splitter element.
 * @param children - React children to be rendered into the two pane containers.
 *
 * @example
 * ```tsx
 * const ref = useRef<SplitPaneHandle>(null);
 *
 * <SplitPane
 *   ref={ref}
 *   mode="horizontal"
 *   defaultPosition={0.5}
 *   min={0.1}
 *   max={0.9}
 *   onSizeChange={(pos) => console.log(pos)}
 * >
 *   <div /> <div />
 * </SplitPane>
 * ```
 */
export const SplitPane = forwardRef(function SplitPane(
  {
    mode = "horizontal",
    position, // controlled: number | undefined/null
    defaultPosition = 0.5,
    min = 0.1,
    max = 0.9,
    splitterSize = 8,
    onSizeChange,
    style,
    className,
    leftPaneStyle,
    rightPaneStyle,
    splitterStyle,
    children,
  },
  ref
) {
  const containerRef = useRef(null);
  const panes = Children.toArray(children);
  const leftChild = panes[0] ?? null;
  const rightChild = panes[1] ?? null;

  const isControlled = position != null;

  const [internalMode, setInternalMode] = useState(mode);

  const [posUncontrolled, setPosUncontrolled] = useState(() =>
    clamp(
      position ?? defaultPosition,
      min,
      max
    )
  );

  useEffect(() => {
    if (mode != null) setInternalMode(mode);
  }, [mode]);

  // keep internal position clamped if min/max change (uncontrolled only)
  useLayoutEffect(() => {
    if (isControlled) return;
    setPosUncontrolled((p) => clamp(p, min, max));
  }, [min, max, isControlled]);

  const posResolved = isControlled ? clamp(position, min, max) : posUncontrolled;

  const setPosition = (next) => {
    const clamped = clamp(next, min, max);
    if (!isControlled) setPosUncontrolled(clamped);
    onSizeChange?.(clamped);
  };

  const draggingRef = useRef(false);
  const pointerIdRef = useRef(null);

  const updateFromClient = (clientX, clientY) => {
    const el = containerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    if (internalMode === "horizontal") {
      const usable = rect.width;
      if (!Number.isFinite(usable) || usable <= 0) return; // no jump on init
      const raw = (clientX - rect.left) / usable;
      if (!Number.isFinite(raw)) return;
      setPosition(raw);
    } else {
      const usable = rect.height;
      if (!Number.isFinite(usable) || usable <= 0) return; // no jump on init
      const raw = (clientY - rect.top) / usable;
      if (!Number.isFinite(raw)) return;
      setPosition(raw);
    }
  };

  // stable global listeners: only act while draggingRef.current === true
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return;
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) return;
      updateFromClient(e.clientX, e.clientY);
    };

    const stop = (e) => {
      if (!draggingRef.current) return;
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current) return;
      draggingRef.current = false;
      pointerIdRef.current = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", stop, { passive: true });
    window.addEventListener("pointercancel", stop, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  }, [internalMode]); // updateFromClient uses internalMode

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();

    draggingRef.current = true;
    pointerIdRef.current = e.pointerId;

    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {}

    updateFromClient(e.clientX, e.clientY); // first update only if rect is sane
  };

  const onKeyDown = (e) => {
    const step = 0.02;
    let delta = 0;

    if (internalMode === "horizontal") {
      if (e.key === "ArrowLeft") delta = -step;
      if (e.key === "ArrowRight") delta = step;
    } else {
      if (e.key === "ArrowUp") delta = -step;
      if (e.key === "ArrowDown") delta = step;
    }

    if (delta !== 0) {
      e.preventDefault();
      setPosition(posResolved + delta);
    }
  };

  const sizes = useMemo(() => {
    const leftPct = `${posResolved * 100}%`;
    const rightCalc = `calc(${100 - posResolved * 100}% - ${splitterSize}px)`;
    return { leftPct, rightCalc };
  }, [posResolved, splitterSize]);

  const rootStyle = {
    display: "flex",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    touchAction: "none",
    ...(style || {}),
    flexDirection: internalMode === "horizontal" ? "row" : "column",
  };

  const leftPaneComputed =
    internalMode === "horizontal"
      ? { width: sizes.leftPct, flex: `0 0 ${sizes.leftPct}`, overflow: "auto", ...(leftPaneStyle || {}) }
      : { height: sizes.leftPct, flex: `0 0 ${sizes.leftPct}`, overflow: "auto", ...(leftPaneStyle || {}) };

  const rightPaneComputed =
    internalMode === "horizontal"
      ? { width: sizes.rightCalc, flex: "1 1 auto", overflow: "auto", ...(rightPaneStyle || {}) }
      : { height: sizes.rightCalc, flex: "1 1 auto", overflow: "auto", ...(rightPaneStyle || {}) };

  const splitterComputed =
    internalMode === "horizontal"
      ? { width: `${splitterSize}px`, transform: "translateX(-50%)", height: '100%', flex: `0 0 ${splitterSize}px`, background: "rgba(0,0,0,0.08)", cursor: "col-resize", ...(splitterStyle || {}) }
      : { height: `${splitterSize}px`, transform: "translateY(-50%)", width: '100%', flex: `0 0 ${splitterSize}px`, background: "rgba(0,0,0,0.08)", cursor: "row-resize", ...(splitterStyle || {}) };

  const dividerVisualStyle =
    internalMode === "horizontal"
      ? { height: "100%", width: "100%" }
      : { width: "100%", height: "100%" };

  useImperativeHandle(ref, () => ({
    setPosition,
    setMode: (nextMode) => setInternalMode(nextMode === "vertical" ? "vertical" : "horizontal"),
    getPosition: () => posResolved,
    getMode: () => internalMode,
  }));

  return (
    <div ref={containerRef} className={className} style={rootStyle}>
      <div style={leftPaneComputed}>{leftChild}</div>

      <div
        role="separator"
        aria-orientation={internalMode === "horizontal" ? "vertical" : "horizontal"}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={posResolved}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerCancel={() => {
          draggingRef.current = false;
          pointerIdRef.current = null;
        }}
        onKeyDown={onKeyDown}
        style={splitterComputed}
      >
        <div style={dividerVisualStyle} />
      </div>

      <div style={rightPaneComputed}>{rightChild}</div>
    </div>
  );
});


