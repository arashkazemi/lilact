import { useEffect, useLayoutEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "./hooks.jsx";
import { Children } from "./misc.jsx";


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
 * const ref = useRef<ResizablePaneHandle>(null);
 *
 * <ResizablePane
 *   ref={ref}
 *   mode="horizontal"
 *   defaultPosition={0.5}
 *   min={0.1}
 *   max={0.9}
 *   onSizeChange={(pos) => console.log(pos)}
 * >
 *   <div /> <div />
 * </ResizablePane>
 * ```
 */
export const ResizablePane = forwardRef(function ResizablePane(
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
      ? { width: `${splitterSize}px`, height: '100%', flex: `0 0 ${splitterSize}px`, background: "rgba(0,0,0,0.08)", cursor: "col-resize", ...(splitterStyle || {}) }
      : { height: `${splitterSize}px`, width: '100%', flex: `0 0 ${splitterSize}px`, background: "rgba(0,0,0,0.08)", cursor: "row-resize", ...(splitterStyle || {}) };

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


