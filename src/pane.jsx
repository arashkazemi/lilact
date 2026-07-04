import { useEffect, useLayoutEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "./hooks.jsx";
import { Children } from "./misc.jsx";

function clamp(n, min, max) {
	return Math.max(min, Math.min(max, n));
}

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
export const ResizablePane = forwardRef(function Pane(
	{
		mode = "horizontal", // "horizontal" | "vertical"
		initialPosition, // optional (alias-ish to position)
		position, // controlled position (number)
		defaultPosition = 0.5, // used if position/initialPosition not provided
		min = 0.1, // clamp in "percent of container" units: 0..1
		max = 0.9, // clamp in "percent of container" units: 0..1
		splitterSize = 8, // px thickness of the drag handle
		onSizeChange, // (newPosition: number) => void
		style,
		className,
		leftPaneStyle,
		rightPaneStyle,
		splitterStyle,
		children, // expects two children: [A, B]
	},
	ref
) {
	const [internalMode, setInternalMode] = useState(mode);
	const [pos, setPos] = useState(() => {
		const start =
			position ?? initialPosition ?? (defaultPosition != null ? defaultPosition : 0.5);
		return clamp(start, min, max);
	});

	const containerRef = useRef(null);
	const draggingRef = useRef(false);

	const panes = Children.toArray(children);
	const leftChild = panes[0] ?? null;
	const rightChild = panes[1] ?? null;

	const modeResolved = mode != null ? mode : internalMode;

	// Keep internalMode aligned if mode is provided as a prop
	useEffect(() => {
		if (mode != null) setInternalMode(mode);
	}, [mode]);

	// Controlled position: update state when prop changes
	useEffect(() => {
		if (position == null) return;
		setPos(clamp(position, min, max));
	}, [position, min, max]);

	const setPosition = (newPos) => {
		const next = clamp(newPos, min, max);
		if (position == null) setPos(next); // only update internal state if uncontrolled
		onSizeChange?.(next);
	};

	const setMode = (nextMode) => {
		const m = nextMode === "vertical" ? "vertical" : "horizontal";
		if (mode == null) setInternalMode(m);
		// If mode is controlled via prop, consumer should re-render with new prop.
	};

	useImperativeHandle(
		ref,
		() => ({
			setPosition,
			setMode,
			getPosition: () => (position == null ? pos : clamp(position, min, max)),
			getMode: () => modeResolved,
		}),
		[pos, position, min, max, modeResolved, onSizeChange, mode]
	);

	const updateFromClientXorY = (clientX, clientY) => {
		const el = containerRef.current;
		if (!el) return;

		const rect = el.getBoundingClientRect();
		let next;

		if (modeResolved === "horizontal") {
			const usable = rect.width;
			if (usable <= 0) return;
			next = (clientX - rect.left) / usable;
		} else {
			const usable = rect.height;
			if (usable <= 0) return;
			next = (clientY - rect.top) / usable;
		}
		setPosition(next);
	};

	const onPointerDown = (e) => {
		e.preventDefault();
		draggingRef.current = true;

		// Capture pointer so we still get events outside the handle area.
		try {
			e.currentTarget.setPointerCapture?.(e.pointerId);
		} catch {
			// ignore
		}

		updateFromClientXorY(e.clientX, e.clientY);
	};

	const onPointerMove = (e) => {
		if (!draggingRef.current) return;
		updateFromClientXorY(e.clientX, e.clientY);
	};

	const stopDragging = () => {
		draggingRef.current = false;
	};

	// Attach global listeners to ensure smooth dragging even if pointer capture fails
	useEffect(() => {
		const handleMove = (e) => {
			if (!draggingRef.current) return;
			updateFromClientXorY(e.clientX, e.clientY);
		};
		const handleUp = () => stopDragging();

		window.addEventListener("pointermove", handleMove, { passive: false });
		window.addEventListener("pointerup", handleUp, { passive: true });
		window.addEventListener("pointercancel", handleUp, { passive: true });

		return () => {
			window.removeEventListener("pointermove", handleMove);
			window.removeEventListener("pointerup", handleUp);
			window.removeEventListener("pointercancel", handleUp);
		};
	}, [modeResolved, min, max, position, onSizeChange]);

	const posResolved = position == null ? pos : clamp(position, min, max);

	const sizes = useMemo(() => {
		if (modeResolved === "horizontal") {
			// left width = pos, splitter width = splitterSize, right flexes
			// We set left/right as percentages and keep splitter fixed in px.
			return {
				left: `${posResolved * 100}%`,
				right: `calc(${100 - posResolved * 100}% - ${splitterSize}px)`,
			};
		}
		return {
			left: `${posResolved * 100}%`,
			right: `calc(${100 - posResolved * 100}% - ${splitterSize}px)`,
		};
	}, [modeResolved, posResolved, splitterSize]);

	// Improve keyboard accessibility (arrow keys when handle is focused)
	const onSplitterKeyDown = (e) => {
		const step = 0.02;
		let delta = 0;
		if (modeResolved === "horizontal") {
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

	// Ensure position clamps correctly if min/max change
	useLayoutEffect(() => {
		setPos((p) => clamp(p, min, max));
	}, [min, max]);

	const rootStyle = {
		display: "flex",
		width: "100%",
		height: "100%",
		overflow: "hidden",
		touchAction: "none",
		...(style || {}),
		flexDirection: modeResolved === "horizontal" ? "row" : "column",
	};

	const leftPaneComputed =
		modeResolved === "horizontal"
			? {
					width: sizes.left,
					flex: `0 0 ${sizes.left}`,
					overflow: "auto",
					...(leftPaneStyle || {}),
				}
			: {
					height: sizes.left,
					flex: `0 0 ${sizes.left}`,
					overflow: "auto",
					...(leftPaneStyle || {}),
				};

	const rightPaneComputed =
		modeResolved === "horizontal"
			? {
					width: `calc(${100 - posResolved * 100}% - ${splitterSize}px)`,
					flex: `1 1 auto`,
					overflow: "auto",
					...(rightPaneStyle || {}),
				}
			: {
					height: `calc(${100 - posResolved * 100}% - ${splitterSize}px)`,
					flex: `1 1 auto`,
					overflow: "auto",
					...(rightPaneStyle || {}),
				};

	const splitterComputed =
		modeResolved === "horizontal"
			? {
					width: `${splitterSize}px`,
					flex: `0 0 ${splitterSize}px`,
					cursor: "col-resize",
					background: "transparent",
					...(splitterStyle || {}),
				}
			: {
					height: `${splitterSize}px`,
					flex: `0 0 ${splitterSize}px`,
					cursor: "row-resize",
					background: "transparent",
					...(splitterStyle || {}),
				};

	const dividerVisualStyle =
		modeResolved === "horizontal"
			? {
					height: "100%",
					width: "100%",
					background: "rgba(0,0,0,0.08)",
				}
			: {
					width: "100%",
					height: "100%",
					background: "rgba(0,0,0,0.08)",
				};

	return (
		<div
			ref={containerRef}
			className={className}
			style={rootStyle}
			onPointerMove={onPointerMove}
		>
			<div style={leftPaneComputed}>{leftChild}</div>

			<div
				role="separator"
				aria-orientation={modeResolved === "horizontal" ? "vertical" : "horizontal"}
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={posResolved}
				tabIndex={0}
				onPointerDown={onPointerDown}
				onPointerUp={stopDragging}
				onPointerCancel={stopDragging}
				onKeyDown={onSplitterKeyDown}
				style={splitterComputed}
			>
				<div style={dividerVisualStyle} />
			</div>

			<div style={rightPaneComputed}>{rightChild}</div>
		</div>
	);
});
