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


ʔ defineSymbols ( "LILACT", [ "CORE" ] ) ʔ

let ReduxContext;

/**
 * Provider component that supplies the store instance to the component tree.
 *
 * @param props - Component props.
 * @param props.store - Store instance to make available to descendants.
 * @param props.children - Components that can access the store via hooks.
 */
export function Provider({ store, children }) 
{
	ReduxContext ??= Lilact.createContext(null);
	return (
		<ReduxContext.Provider value={store}>{children}</ReduxContext.Provider>
	);
}

/**
 * Hook that returns the current store instance from the nearest Provider.
 *
 * @returns The store object from the Provider context.
 */
export function useStore() 
{
	const store = Lilact.useContext(ReduxContext);
	if (!store) {
		throw new Error("Could not find Redux store in context. <Provider> is missing.");
	}
	return store;
}


/**
 * Hook that returns the store's dispatch function from the nearest Provider.
 *
 * @returns The dispatch function used to send actions to the store.
 */
export function useDispatch() 
{
	const store = Lilact.useStore();
	return store.dispatch;
}

/**
 * Hook that returns selected data from the store using a selector.
 *
 * @param selector - Function that derives a value from the store state.
 * @param [equalityFn=(a, b) => a === b] - Determines when the selected value should update.
 * @returns The selected slice of state.
 */
export function useSelector(selector, equalityFn = (a, b) => a === b) 
{
	const store = Lilact.useStore();
	const latestSelectedRef = Lilact.useRef();
	const latestSelectorRef = Lilact.useRef();
	const [, forceRender] = Lilact.useState(0);

	if (!latestSelectorRef.current) {
		latestSelectorRef.current = selector;
	}
	latestSelectorRef.current = selector;

	let selected = selector(store.getState()); // todo: should exception be covered?

	if (latestSelectedRef.current === undefined) {
		latestSelectedRef.current = selected;
	}

	Lilact.useLayoutEffect(() => {
		// keep latestSelectedRef in sync after render (in case selector used props or similar)
		latestSelectedRef.current = selected;
	}, [selected]);

	Lilact.useEffect(() => {

		let didUnsubscribe = false;

		function checkForUpdates() {
			if (didUnsubscribe) return;
			try {
				const newSelected = latestSelectorRef.current(store.getState());
				const oldSelected = latestSelectedRef.current;
				if (!equalityFn(oldSelected, newSelected)) {
					latestSelectedRef.current = newSelected;

					forceRender((n) => n + 1);
				}
			} catch (err) {

ʔ if(DEBUG) {
				// todo: which is better? cover the error or throw?

				// If selector throws during subscription notifications, re-render to surface error
				// (could instead log or ignore)
				// throw err;
				console.warn(err);
ʔ }
			}
		}

		const unsubscribe = store.subscribe(checkForUpdates);

		// run check once in case state changed between render and effect
		checkForUpdates();

		return () => {
			didUnsubscribe = true;
			unsubscribe();
		};
	}, [store, equalityFn]);

	return latestSelectedRef.current;
}


/**
 * Higher-order component that connects a component to store state and dispatch.
 *
 * @param mapStateToProps - Maps store state to the wrapped component's props.
 * @param mapDispatchToProps - Maps dispatch (or action creators) to the wrapped component's props.
 * @returns A connected component that receives store-derived props.
 */
export function connect(mapStateToProps, mapDispatchToProps) 
{
	const shouldSubscribe = Boolean(mapStateToProps);

	return function wrapWithConnect(WrappedComponent) {

		function ConnectedComponent(props) {
			const store = Lilact.useStore();

			let dispatchProps = { dispatch: store.dispatch };

			if (typeof mapDispatchToProps === "function") {
				dispatchProps = mapDispatchToProps(store.dispatch, props);
			} 
			else if (typeof mapDispatchToProps === "object" && mapDispatchToProps !== null) {
				dispatchProps = {};
				const dispatch = store.dispatch;
				for (const key in mapDispatchToProps) {
					const actionCreator = mapDispatchToProps[key];
					dispatchProps[key] = (...args) => dispatch(actionCreator(...args));
				}
			}

			let stateProps = {};
			if (mapStateToProps) {
				const selector = (state) => mapStateToProps(state, props);

				// todo: is shallowEqual enough?
				stateProps = Lilact.useSelector(selector, Lilact.shallowEqual) || {};
			}

			const mergedProps = { ...props, ...stateProps, ...dispatchProps };

			return <WrappedComponent {...mergedProps} />;
		}

		// todo: memoize to avoid unnecessary re-renders if parent props are same?
		//return memo(ConnectedComponent);

		return ConnectedComponent;
	};
}

