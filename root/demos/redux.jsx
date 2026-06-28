const { Provider, useSelector, useDispatch, connect } = Lilact;
const { createStore } = Lilact.redux;

// Reducer + store
function counterReducer(state = { count: 0 }, action) {
	switch (action.type) {
		case "INCREMENT": return { count: state.count + 1 };
		case "DECREMENT": return { count: state.count - 1 };
		default: return state;
	}
}
const store = createStore(counterReducer);

// Hooks-based component
function CounterHooks() {
	const count = useSelector(state => state.count);
	const dispatch = useDispatch();
	return (
		<div>
			<h3>Hooks Counter</h3>
			<div>Count: {count}</div>
			<button onClick={() => dispatch({ type: "DECREMENT" })}>-</button>
			<button onClick={() => dispatch({ type: "INCREMENT" })}>+</button>
		</div>
	);
}

// connect-based component
function CounterView({ count, increment, decrement }) {
	return (
		<div>
			<h3>Connected Counter</h3>
			<div>Count: {count}</div>
			<button onClick={decrement}>-</button>
			<button onClick={increment}>+</button>
		</div>
	);
}
const mapState = (state) => ({ count: state.count });
const mapDispatch = (dispatch) => ({

	increment: () => { dispatch({ type: "INCREMENT" })},
	decrement: () => { dispatch({ type: "DECREMENT" })}
});
const ConnectedCounter = connect(mapState, mapDispatch)(CounterView);

function Demo({ username }) 
{
	return	<Provider store={store}>
				<div>
					<CounterHooks />
					<ConnectedCounter />
				</div>
			</Provider>;
}

module.exports = Demo;

