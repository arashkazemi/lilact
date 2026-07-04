import { useEffect, useLayoutEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "./hooks.jsx";
import { Children } from "./misc.jsx";


const clamp = (n, min, max) => {
  if (!Number.isFinite(n)) return n;
  return Math.min(max, Math.max(min, n));
};

/**
 * ResizablePane
 *
 * Features:
 * - Supports "horizontal" (left/top size affects width) and "vertical" (affects height)
 * - Initial position via props.position
 * - Methods to set mode and position via ref:
 *     ref.current.setMode(mode)
 *     ref.current.setPosition(position)
 * - Callback when size changes via onSizeChange
 * - Children are rendered in two separate containers (no portals)
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
