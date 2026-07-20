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

ʔ defineSymbols ( "LILACT", [ "CORE", "COMPONENT", "CHILD_CLASS_ADDENDUM" ] ) ʔ

/* States */
const UNMOUNTED = "unmounted";
const EXITED = 	  "exited";
const ENTERING =  "entering";
const ENTERED =   "entered";
const EXITING =   "exiting";

import { setTimeout, clearTimeout} from "./timers.jsx"
import { Children } from "./misc.jsx"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "./hooks.jsx"

/**
 * Transition component that manages enter/exit lifecycle and calls callbacks based on state changes.
 *
 * @param props - Component props.
 * @param props.in - Boolean/flag indicating whether the component should be entered/shown.
 * @param [props.timeout=defaultTransitionTimeout] - Duration (or durations) for the transition.
 * @param [props.mountOnEnter=false] - If true, mount the child only when entering.
 * @param [props.unmountOnExit=false] - If true, unmount the child after exiting.
 * @param [props.appear=false] - If true, run the enter transition on initial mount.
 * @param props.onEnter - Called when entering begins.
 * @param props.onEntering - Called while the component is entering.
 * @param props.onEntered - Called when entering completes.
 * @param props.onExit - Called when exiting begins.
 * @param props.onExiting - Called while the component is exiting.
 * @param props.onExited - Called when exiting completes.
 * @param props.children - Render prop receiving transition state/props.
 */
export function Transition({
	in: inProp,
	timeout = Lilact.defaultTransitionTimeout,
	mountOnEnter = false,
	unmountOnExit = false,
	appear = false,
	onEnter,
	onEntering,
	onEntered,
	onExit,
	onExiting,
	onExited,
	children,

	// this is underscored to prevent accidental setting by the user.
	// i added it to the Transition itself to simplify the implementation,
	// but the user should use CSSTransition itself.
	_classNames: classNames
}) {
	this[CORE].is_mounted ??= !mountOnEnter || inProp || appear;
	this[CORE].is_appeared ??= inProp;
	this[CORE].timer ??= null;

	this[CORE].childFunctionHandler = (func)=>{
		return func(this[CORE].mount_state); 
	}

	if(!this[CORE].mount_state) {
		if (!this[CORE].is_mounted) this[CORE].mount_state = UNMOUNTED;
		if (inProp) {
			this[CORE].mount_state = appear && !this[CORE].is_appeared ? ENTERING : ENTERED;
		}
		else this[CORE].mount_state = EXITED;
	}

	useEffect(() => {
		return () => clearTimeout(this[CORE].timer);
	}, []);

	useEffect(() => {
		if (!this[CORE].is_appeared && appear && this[CORE].mount_state === ENTERING && inProp) {
			onEnter?.();
			requestAnimationFrame(() => {
				onEntering?.(!this[CORE].is_appeared);
				clearTimeout(this[CORE].timer);
				this[CORE].timer = setTimeout(() => {
					this[CORE].mount_state = ENTERED;
					this.forceUpdate();
					this[CORE].is_appeared = true;
					onEntered?.(!this[CORE].is_appeared);
				}, timeout);
			});
		}
	}, []);

	useEffect(() => {
		if (inProp) {
			this[CORE].is_mounted = true;
			// If we are already entering/entered, no-op
			if (this[CORE].mount_state === ENTERING || this[CORE].mount_state === ENTERED) return;

			onEnter?.(!this[CORE].is_appeared);
			this[CORE].mount_state = ENTERING;
			this.forceUpdate(() => {
				onEntering?.(!this[CORE].is_appeared);
				clearTimeout(this[CORE].timer);

				this[CORE].timer = setTimeout(() => {
					this[CORE].mount_state = ENTERED;
					this.forceUpdate();
					this[CORE].is_appeared = true;
					onEntered?.();
				}, timeout);
			});
		} 
		else {
			if (this[CORE].mount_state === UNMOUNTED || this[CORE].mount_state === EXITING || this[CORE].mount_state === EXITED) return;

			onExit?.();
			this[CORE].mount_state = EXITING;
			this.forceUpdate( () => {
				onExiting?.();
				clearTimeout(this[CORE].timer);
				this[CORE].timer = setTimeout(() => {
					this[CORE].mount_state = EXITED;
					this.forceUpdate();
					onExited?.();
					if (unmountOnExit) {
						this[CORE].is_mounted = false;
						this[CORE].mount_state = UNMOUNTED;
						this.forceUpdate();
					}
				}, timeout);
			});
		}
	}, [inProp, timeout]);

	if (!this[CORE].is_mounted) return null;

	if(classNames) {
		if (this[CORE].mount_state === ENTERING) {
			if(this[CORE].is_appeared)
				this[CORE][CHILD_CLASS_ADDENDUM] = classNames.appearActive;
			else
				this[CORE][CHILD_CLASS_ADDENDUM] = classNames.enterActive;
		}
		else if (this[CORE].mount_state === ENTERED) {
			if(this[CORE].is_appeared)
				this[CORE][CHILD_CLASS_ADDENDUM] = classNames.appearDone;
			else
				this[CORE][CHILD_CLASS_ADDENDUM] = classNames.enterDone;
		}
		else if (this[CORE].mount_state === EXITING) this[CORE][CHILD_CLASS_ADDENDUM] = classNames.exitActive;
		else if (this[CORE].mount_state === EXITED) this[CORE][CHILD_CLASS_ADDENDUM] = classNames.exitDone;
	}
	return children;
}


/**
 * CSSTransition component that extends Transition by applying CSS class names during enter/exit phases.
 *
 * Lilact accepts multiple children for CSSTransition. This has the benefit
 * of receiving single events on multiple animated components.
 *
 * @param props - Component props.
 * @param props.in - Boolean/flag indicating whether the component should be entered/shown.
 * @param [props.timeout=defaultTransitionTimeout] - Duration (or durations) for the transition.
 * @param [props.classNames="fade"] - Base CSS class name(s) used for the transition states.
 * @param [props.mountOnEnter=false] - If true, mount the child only when entering.
 * @param [props.unmountOnExit=false] - If true, unmount the child after exiting.
 * @param [props.appear=false] - If true, run the enter transition on initial mount.
 * @param props.children - Render prop receiving transition state/props.
 * @param props.onEnter - Called when entering begins.
 * @param props.onEntering - Called while the component is entering.
 * @param props.onEntered - Called when entering completes.
 * @param props.onExit - Called when exiting begins.
 * @param props.onExiting - Called while the component is exiting.
 * @param props.onExited - Called when exiting completes.
 */
export function CSSTransition({
	in: inProp,
	timeout = Lilact.defaultTransitionTimeout,
	classNames = "fade",
	mountOnEnter = false,
	unmountOnExit = false,
	appear = false,
	children,
	onEnter, onEntering, onEntered, 
	onExit, onExiting, onExited,
}) {

	if(typeof(classNames)==='string') {
		classNames = {
			appear: `${classNames}-enter ${classNames}-appear`,
			appearActive: `${classNames}-enter-active ${classNames}-appear-active`,
			appearDone: `${classNames}-enter-done ${classNames}-appear-done`,
			enter: `${classNames}-enter`,
			enterActive: `${classNames}-enter-active`,
			enterDone: `${classNames}-enter-done`,
			exit: `${classNames}-exit`,
			exitActive: `${classNames}-exit-active`,
			exitDone: `${classNames}-exit-done`,
		};
	}		
	return (
		<Transition
			in={inProp}
			timeout={timeout}
			mountOnEnter={mountOnEnter}
			unmountOnExit={unmountOnExit}
			appear={appear}
			onEnter={onEnter}
			onEntering={onEntering}
			onEntered={onEntered}
			onExit={onExit}
			onExiting={onExiting}
			onExited={onExited}
			_classNames={classNames}
		>
			{children}
		</Transition>
		);
}



/**
 * Switches between keyed children with `CSSTransition`.
 * Ensures each child key gets its own `CSSTransition` instance to avoid state loss.
 *
 * @param {object} props
 * @param {Array} props.children
 *   The set of children to switch between. Each child should have a stable `key`
 *   (or your `key` will fall back to its index).
 * @param {*} props.activeKey
 *   The key of the currently active child.
 * @param {"out-in" | "in-out"} [props.mode="out-in"]
 *   Controls sequencing when `activeKey` changes:
 *   - `"out-in"`: outgoing transitions out first, incoming transitions in after exit completes.
 *   - `"in-out"`: incoming transitions in first, outgoing transitions out after the incoming finishes entering
 *     (relies on `onEntered`).
 * @param {number} [props.timeout=Lilact.defaultTransitionTimeout]
 *   Transition timeout passed to each `CSSTransition`.
 * @param {string} [props.classNames="switch"]
 *   Base className(s) used by `CSSTransition` to apply enter/exit classes.
 * @param {boolean} [props.mountOnEnter=false]
 *   Whether to mount the transitioning child only when it begins entering.
 * @param {boolean} [props.unmountOnExit=false]
 *   Whether to unmount the child after it finishes exiting.
 * @param {boolean} [props.appear=false]
 *   Whether to run the initial transition on first mount.
 *
 * @param {(isAppearing: boolean) => void} [props.onExited]
 *   Called when the outgoing child finishes exiting.
 * @param {(isAppearing: boolean) => void} [props.onEnter]
 *   Called when a child begins entering.
 * @param {(isAppearing: boolean) => void} [props.onExiting]
 *   Called when a child begins exiting.
 * @param {(isAppearing: boolean) => void} [props.onEntered]
 *   Called when a child finishes entering. Used to implement `"in-out"` sequencing.
 *
 * @param {object} [props.csstProps]
 *   Any additional props are forwarded to each `CSSTransition` instance.
 */


export function SwitchTransition({
  children,
  activeKey,
  mode = "out-in", // "out-in" | "in-out"

  timeout = Lilact.defaultTransitionTimeout,
  classNames = "switch",

  mountOnEnter = false,
  unmountOnExit = false,
  appear = false,

  // callbacks (optional)
  onExited,
  onEnter,
  onExiting,
  onEntered,

  ...csstProps
}) {
  const childArray = useMemo(() => Children.toArray(children), [children]);

  // Outgoing key (the one that should exit) and phase flags
  const [exitingKey, setExitingKey] = useState(null);
  const [exitStarted, setExitStarted] = useState(false);

  // Controls whether the incoming (activeKey) is currently "in"
  const [enterAllowed, setEnterAllowed] = useState(true);

  // Refs to avoid stale closures in callbacks
  const prevKeyRef = useRef(activeKey);
  const activeKeyRef = useRef(activeKey);
  const exitingKeyRef = useRef(exitingKey);

  useLayoutEffect(() => {
    activeKeyRef.current = activeKey;
  }, [activeKey]);

  useLayoutEffect(() => {
    exitingKeyRef.current = exitingKey;
  }, [exitingKey]);

  useLayoutEffect(() => {
    const prevKey = prevKeyRef.current;
    if (prevKey === activeKey) return;

    prevKeyRef.current = activeKey;

    // Start a new switch
    setExitingKey(prevKey);

    if (mode === "out-in") {
      // Incoming blocked; outgoing should exit immediately.
      setEnterAllowed(false);
      setExitStarted(true); // outgoing in: true -> false => triggers exit
    } else {
      // Incoming allowed immediately; outgoing should exit only after incoming has entered.
      setEnterAllowed(true);
      setExitStarted(false); // outgoing stays in:true until we flip it later
    }
  }, [activeKey, mode]);

  const handleExited = (key) => (node, isAppearing) => {
    if (typeof onExited === "function") onExited(node, isAppearing);

    if (key === exitingKeyRef.current) {
      setExitingKey(null);

      // out-in: once outgoing is fully exited, allow incoming to start
      if (mode === "out-in") {
        setExitStarted(false);
        setEnterAllowed(true);
      }
      // in-out: incoming already entered; just clean up outgoing
      if (mode === "in-out") {
        setExitStarted(false);
      }
    }
  };

  const handleEntered = (key) => (node, isAppearing) => {
    if (typeof onEntered === "function") onEntered(node, isAppearing);

    if (mode === "in-out") {
      // Only start outgoing exit when the CURRENT incoming (activeKey) finishes entering.
      if (key === activeKeyRef.current && exitingKeyRef.current != null) {
        setExitStarted(true); // outgoing in:true -> false => triggers exit
      }
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {childArray.map((child, index) => {
        const key = child?.props?.key || index;

        const isIncoming = key === activeKey;
        const isOutgoing = key === exitingKey;

        // Core rule:
        // - Incoming: in = enterAllowed
        // - Outgoing: in = !exitStarted
        // - Others: in = false
        const inProp = isIncoming
          ? enterAllowed
          : isOutgoing
            ? !exitStarted
            : false;

        return (
          <CSSTransition
            key={key}
            in={inProp}
            timeout={timeout}
            classNames={classNames}
            mountOnEnter={mountOnEnter}
            unmountOnExit={unmountOnExit}
            appear={appear}
            onEnter={onEnter}
            onExiting={onExiting}
            onEntered={handleEntered(key)}
            onExited={handleExited(key)}
            {...csstProps}
          >
            <div style={{ position: "absolute", inset: 0 }}>
              {child}
            </div>
          </CSSTransition>
        );
      })}
    </div>
  );
}


/**
 * Lilact doesn't need TransitionGroup, so it is the same as a fragment.
 * In Lilact all the transitions and timeouts are automatically grouped.
 * 
 * The only missing feature here is the childFactory. I may add it in
 * the future, but there are simple workarounds for that. 
 */
export function TransitionGroup({ children }) {
	return children;
}
