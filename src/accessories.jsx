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


import { useEffect, useLayoutEffect, useMemo, useRef, useState, useImperativeHandle, useCallback } from "./hooks.jsx";
import { Children, forwardRef, isThenable } from "./misc.jsx";

import {setTimeout, clearTimeout} from "./timers.jsx"
import {Component} from "./components.jsx"
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
		if (isThenable(error)) {
			// signal to call componentDidCatch where we handle the thenable
			return null;
		}
		// non-thenable errors should bubble to nearest Error Boundary
		throw error;
	}

/** @ignore */
	componentDidCatch(error, info) {
		if (!isThenable(error)) return;
		this._attachPromise(error);
	}

/** @ignore */
	componentWillUnmount() {
		this._clearTimers();
		this._pending.clear();
	}

/** @ignore */
	_clearTimers() {
		if (this._delayTimer) {
			clearTimeout(this._delayTimer);
			this._delayTimer = null;
		}
		if (this._minShowTimer) {
			clearTimeout(this._minShowTimer);
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
				clearTimeout(this._delayTimer);
				this._delayTimer = null;
			}
			this._delayTimer = setTimeout(() => {
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
					clearTimeout(this._delayTimer);
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
						clearTimeout(this._minShowTimer);
						this._minShowTimer = null;
					}
					this._minShowTimer = setTimeout(() => {
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
 * @param {Component} [props.children] Content rendered inside the handle.
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
 		  Can also be a function that will be called with (containerWidth|containerHeight,splitterSize) as arguments
 * @param max - Maximum allowed position. Defaults to `0.9`.
 		  Can also be a function that will be called with (containerWidth|containerHeight,splitterSize) as arguments
 * @param splitterSize - Thickness of the draggable splitter in pixels. Defaults to `8`.
 * @param resizePolicy - The behavior on container resize. Its value can be `proportional`, `fixFirst` or `fixSecond`.
 * 		  Default is `proportional`.
 * @param onSizeChange - Callback invoked when the position changes. Receives the new normalized position.
 * @param style - Optional root container styles.
 * @param className - Optional root container CSS class.
 * @param leftPaneStyle - Optional styles applied to the left pane (or top pane in vertical mode).
 * @param rightPaneStyle - Optional styles applied to the right pane (or bottom pane in vertical mode).
 * @param splitterStyle - Optional styles applied to the splitter element.
 * @param splitterChild - Child to be rendered into the splitter itself.
 * @param children - Children to be rendered into the two pane containers.
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
    position,
    defaultPosition = 0.5,
    min = 0.1,
    max = 0.9,
    splitterSize = 8,
    onSizeChange,
    resizePolicy = "proportional",
    style,
    className,
    firstPaneStyle,
    secondPaneStyle,
    splitterStyle,
    splitterChild,
    children,
  },
  ref
) {
  const containerRef = useRef(null);

  // Measured container size
  const sizeRef = useRef({ w: 0, h: 0 });

  // Internal mode supports imperative setMode
  const [internalMode, setInternalMode] = useState(mode === "vertical" ? "vertical" : "horizontal");
  const internalModeRef = useRef(internalMode);

  // Internal position for uncontrolled usage
  const [internalPos, setInternalPos] = useState(defaultPosition);
  const internalPosRef = useRef(internalPos);

  // Latest effective pos (controlled or uncontrolled)
  const effectivePosRef = useRef(undefined);

  const resizePolicyRef = useRef(resizePolicy);
  useEffect(() => {
    resizePolicyRef.current = resizePolicy;
  }, [resizePolicy]);

  // Keep refs synced
  internalModeRef.current = internalMode;

  useEffect(() => {
    internalPosRef.current = internalPos;
  }, [internalPos]);

  // If mode prop changes, update internalMode synchronously
  useLayoutEffect(() => {
    setInternalMode(mode === "vertical" ? "vertical" : "horizontal");
  }, [mode]);

  const clampWithSize = (v, modeNow, w, h) => {
    const size = modeNow === "vertical" ? h : w;
    return clamp(v, min, max, size, splitterSize);
  };

  // Determine effective position (controlled vs uncontrolled) without clamping on first render
  const posResolved = useMemo(() => {
    const raw = position == null ? internalPos : position;

    // If we don't know size yet, just keep raw (no size-based min/max function evaluation)
    // to avoid “startup jump from wrong clamping”.
    const { w, h } = sizeRef.current;
    const hasSize = (mode === "vertical" ? h > 0 : w > 0);

    if (!hasSize) return raw;

    return clampWithSize(raw, internalModeRef.current, w, h);
  }, [position, internalPos, min, max, splitterSize, mode]);

  useEffect(() => {
    effectivePosRef.current = posResolved;
  }, [posResolved]);

  // setPosition for imperative usage + drag + resizePolicy
  const setPosition = (next) => {
    const modeNow = internalModeRef.current;
    const { w, h } = sizeRef.current;

    // If size unknown, just update internalPos (we'll clamp on first measure)
    if ((modeNow === "vertical" ? h <= 0 : w <= 0)) {
      if (position == null) setInternalPos(next);
      onSizeChange?.(next);
      return;
    }

    const clamped = clampWithSize(next, modeNow, w, h);
    if (position == null) setInternalPos(clamped);
    effectivePosRef.current = clamped;
    onSizeChange?.(clamped);
  };

  useImperativeHandle(ref, () => ({
    setPosition,
    setMode: (nextMode) => setInternalMode(nextMode === "vertical" ? "vertical" : "horizontal"),
    getPosition: () => (effectivePosRef.current ?? posResolved),
    getMode: () => internalModeRef.current,
  }));

  // One-time “first valid size” initialization:
  // - update clamp
  // - emit onSizeChange once so parent splitterPos becomes correct
  const didInitRef = useRef(false);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const rect = el.getBoundingClientRect();
      const prev = sizeRef.current;
      const nextSize = { w: rect.width, h: rect.height };
      sizeRef.current = nextSize;

      const modeNow = internalModeRef.current;

      const hadSize = (modeNow === "vertical" ? prev.h > 0 : prev.w > 0);
      const hasSizeNow = (modeNow === "vertical" ? nextSize.h > 0 : nextSize.w > 0);

      // First time we get meaningful size -> clamp + notify exactly once
      if (!didInitRef.current && hasSizeNow) {
        didInitRef.current = true;

        const raw = position == null ? internalPosRef.current : position;
        const clamped = clampWithSize(raw, modeNow, nextSize.w, nextSize.h);

        if (position == null) setInternalPos(clamped);
        effectivePosRef.current = clamped;
        onSizeChange?.(clamped);

        return; // don't apply resizePolicy math on the same tick as init
      }

      // Apply resizePolicy on subsequent resizes (when we have both old & new size)
      if (!hadSize || !hasSizeNow) return;

      const p = effectivePosRef.current ?? posResolved;
      const rp = resizePolicyRef.current;
      const s = splitterSize;

      if (rp === "fixFirst") {
        if (modeNow === "vertical") {
          const availOld = prev.h - s;
          const availNew = nextSize.h - s;
          if (availOld > 0 && availNew > 0) {
            const firstPx = p * availOld;
            const nextP = firstPx / availNew;
            if (Math.abs(nextP - p) > EPS) setPosition(nextP);
          }
        }
        else {
          const availOld = prev.w - s;
          const availNew = nextSize.w - s;
          if (availOld > 0 && availNew > 0) {
            const firstPx = p * availOld;
            const nextP = firstPx / availNew;
            if (Math.abs(nextP - p) > EPS) setPosition(nextP);
          }
        }
      }
      else if (rp === "fixSecond") {
        if (modeNow === "vertical") {
          const availOld = prev.h - s;
          const availNew = nextSize.h - s;
          if (availOld > 0 && availNew > 0) {
            const secondPx = (1 - p) * availOld;
            const nextP = 1 - secondPx / availNew;
            if (Math.abs(nextP - p) > EPS) setPosition(nextP);
          }
        }
        else {
          const availOld = prev.w - s;
          const availNew = nextSize.w - s;
          if (availOld > 0 && availNew > 0) {
            const secondPx = (1 - p) * availOld;
            const nextP = 1 - secondPx / availNew;
            if (Math.abs(nextP - p) > EPS) setPosition(nextP);
          }
        }
      } // proportional => derived from p; no policy adjustment needed
    });

    ro.observe(el);
    return () => ro.disconnect();
    // We intentionally do NOT include posResolved/internalPos here to avoid re-attaching observer.
    // ResizeObserver uses refs to get latest values.
  }, [min, max, splitterSize, onSizeChange, position]);

  // Drag support
  const startPosRef = useRef(posResolved);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) startPosRef.current = posResolved;
  }, [posResolved, dragging]);

  const handleStart = () => {
    setDragging(true);
    startPosRef.current = effectivePosRef.current ?? posResolved;
  };

  const handleDelta = (x, y) => {
    const modeNow = internalModeRef.current;
    const { w, h } = sizeRef.current;

    if (modeNow === "horizontal") {
      const denom = w > 0 ? w : 1;
      setPosition(startPosRef.current + x / denom);
    }
    else {
      const denom = h > 0 ? h : 1;
      setPosition(startPosRef.current + y / denom);
    }
  };

  const handleEnd = () => setDragging(false);

  const arr = Children.toArray(children);
  const firstChild = arr[0];
  const secondChild = arr[1];

  const p = posResolved;
  const { w, h } = sizeRef.current;

  const computedPane1Style = {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "auto",
    ...(firstPaneStyle || {}),
  };

  const computedPane2Style = {
    position: "absolute",
    bottom: 0,
    right: 0,
    overflow: "auto",
    ...(secondPaneStyle || {}),
  };

  const computedSplitterStyle = {
    background: "rgba(0,0,0,0.08)",
    boxShadow: "inset 0 0 2px rgba(0,0,0,0.25)",
    zIndex: 10,
    position: "absolute",
    cursor: internalMode === "horizontal" ? "col-resize" : "row-resize",
    touchAction: "none",
    pointerEvents: "auto",
    ...(splitterStyle || {}),
  };

  if (internalMode === "horizontal") {
    computedPane1Style.bottom = 0;
    computedPane2Style.top = 0;

    if (resizePolicy === "fixFirst") {
      const ww = w - splitterSize;
      const pane1W = ww > 0 ? p * ww : 0;

      computedPane1Style.width = pane1W;
      computedPane2Style.left = pane1W + splitterSize;

      Object.assign(computedSplitterStyle, {
        top: 0,
        bottom: 0,
        left: pane1W,
        width: splitterSize,
      });
    }
    else if (resizePolicy === "fixSecond") {
      const ww = w - splitterSize;
      const pane2W = ww > 0 ? (1 - p) * ww : 0;

      computedPane2Style.width = pane2W;
      computedPane1Style.right = pane2W + splitterSize;

      Object.assign(computedSplitterStyle, {
        top: 0,
        bottom: 0,
        right: pane2W,
        width: splitterSize,
      });
    } else {
      computedPane1Style.width = `calc(${p} * (100% - ${splitterSize}px))`;
      computedPane2Style.left = `calc(${p} * (100% - ${splitterSize}px) + ${splitterSize}px)`;

      Object.assign(computedSplitterStyle, {
        top: 0,
        bottom: 0,
        left: `calc(${p} * (100% - ${splitterSize}px))`,
        width: splitterSize,
      });
    }
  } else {
    // vertical
    computedPane1Style.right = 0;
    computedPane2Style.left = 0;

    if (resizePolicy === "fixFirst") {
      const hh = h - splitterSize;
      const pane1H = hh > 0 ? p * hh : 0;

      computedPane1Style.height = pane1H;
      computedPane2Style.top = pane1H + splitterSize;

      Object.assign(computedSplitterStyle, {
        left: 0,
        right: 0,
        top: pane1H,
        height: splitterSize,
      });
    } else if (resizePolicy === "fixSecond") {
      const hh = h - splitterSize;
      const pane2H = hh > 0 ? (1 - p) * hh : 0;

      computedPane2Style.height = pane2H;
      computedPane1Style.bottom = pane2H + splitterSize;

      Object.assign(computedSplitterStyle, {
        left: 0,
        right: 0,
        bottom: pane2H,
        height: splitterSize,
      });
    } else {
      computedPane1Style.height = `calc(${p} * (100% - ${splitterSize}px))`;
      computedPane2Style.top = `calc(${p} * (100% - ${splitterSize}px) + ${splitterSize}px)`;

      Object.assign(computedSplitterStyle, {
        left: 0,
        right: 0,
        top: computedPane1Style.height,
        height: splitterSize,
      });
    }
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...(style || {}),
      }}
    >
      <div style={computedPane1Style}>{firstChild}</div>
      <div style={computedPane2Style}>{secondChild}</div>

      <DragHandle
        key={internalMode}
        onStart={handleStart}
        onDelta={handleDelta}
        onEnd={handleEnd}
        style={computedSplitterStyle}
        className="splitter"
      >
        {splitterChild}
      </DragHandle>
    </div>
  );
});

const EPS = 1e-6;

const clamp = function (v, min, max, size, splitterSize) {
  let _min = min;
  let _max = max;

  // Only evaluate min/max functions when size is known (>0).
  // When size is unknown, we don't want to clamp based on a fake size (prevents startup jumps).
  if (typeof _min === "function") {
    if (size > 0) _min = _min(size, splitterSize);
    else _min = 0;
  }
  if (typeof _max === "function") {
    if (size > 0) _max = _max(size, splitterSize);
    else _max = 1;
  }

  _min = Math.max(0, Math.min(_min, 1));
  _max = Math.max(0, Math.min(_max, 1));
  return Math.max(_min, Math.min(_max, v));
};
