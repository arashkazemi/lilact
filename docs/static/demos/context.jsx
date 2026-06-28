const { createContext, useContext, useState } = Lilact;
const { css, cx } = Lilact.emotion;

const ThemeContext = createContext(null);

function Form({ children }) {
	return (
		<Panel title="Welcome">
			<Button>Sign up</Button>
			<Button>Log in</Button>
		</Panel>
		);
}

function Panel({ title, children }) {
	const theme = useContext(ThemeContext);
	const className = 'panel-' + theme;
	return (
		<section className={cx(className,css`

			&.panel-dark {
				background: #333;
				color: #eee;
			}
		`)}>
			<h1 className={css`
							&:hover {
						        color: red;
						      }

						`}>{title}
			</h1>
			{children}
		</section>
		)
}

function Button({ children }) {
	const theme = useContext(ThemeContext);
	const className = 'button-' + theme;
	return (
		<button className={className}>
			{children}
		</button>
		);
}

function Demo() {
	const [theme, setTheme] = useState('dark');

	return (
			<ThemeContext.Provider value={theme}>
				<Form />
				<label>
					<input
						type="checkbox"
						checked={theme === 'dark'}
						onchange={(e) => {
							setTheme(e.target.checked ? 'dark' : 'light')
						}}
					/>
					Use dark mode
				</label>
			</ThemeContext.Provider>
		)
}

module.exports = Demo;
