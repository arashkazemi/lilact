const { useReducer } = Lilact;

function createInitialState(username) {
	const initialTodos = [];
	for (let i = 0; i < 10; i++) {
		initialTodos.push({
			id: i,
			text: username + "'s task #" + (i + 1)
		});
	}
	return {
		draft: '',
		todos: initialTodos,
	};
}

function reducer(state, action) {
	switch (action.type) {
		case 'changed_draft': {
			return {
				draft: action.nextDraft,
				todos: state.todos,
			};
		}
		case 'added_todo': {
			return {
				draft: '',
				todos: [{
					id: state.todos.length,
					text: state.draft
				}, ...state.todos]
			}
		}
	}
	throw Error('Unknown action: ' + action.type);
}

function Demo({ username }) 
{
	const [state, dispatch] = useReducer(
		reducer,
		username,
		createInitialState
	);

	return <>
		<p>This is a simple to-do list using `useReducer`. Enter new entries and they will be added.</p>
		<input
			value={state.draft}
			onChange={e => {
				dispatch({
					type: 'changed_draft',
					nextDraft: e.target.value
				});
			}}
			onKeyUp={e => {
				if (e.key === 'Enter') {
					dispatch({ type: 'added_todo' });
				}
			}}
		/>
		<button onClick={() => {
			dispatch({ type: 'added_todo' });
		}}>Add</button>

		<ul>
			{state.todos.map(item => (
				<li key={item.id}>
					{item.text}
				</li>
			))}
		</ul>
	</>
}

module.exports = Demo;
