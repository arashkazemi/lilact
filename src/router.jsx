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

ʔ defineSymbols ( "LILACT", [ "CORE", "COMPONENT" ] ) ʔ

import {createContext, useContext, useState, useCallback, useEffect} from "./hooks.jsx"
import {Children} from "./misc.jsx"

const RouterContext = createContext(null);
const RouteContext = createContext({ params: {} });

// --- HashRouter (as before) ---
const createURL = (to) => (typeof to === "string" ? to : (to.pathname || "") + (to.search || "") + (to.hash || ""));

/**
 * Hash-based router component that syncs navigation state with the URL hash (#...).
 *
 * @param props - Component props.
 * @param props.children - Route definitions and/or components to render under this router.
 * @param [props.basename=""] - Optional base path prefix applied to all route paths.
 */
export function HashRouter({ children, basename = "" }) {
	const readLocation = () => {
		const raw = window.location.hash || "#/";
		const full = raw.slice(1);
		const withoutBase = full.replace(new RegExp(`^${basename}`), "") || "/";
		const [pathAndSearch, hashPart] = withoutBase.split("#");
		const [path, search = ""] = pathAndSearch.split("?");
		return {
			pathname: path || "/",
			search: search ? "?" + search : "",
			hash: hashPart ? "#" + hashPart : "",
			state: history.state?.__state,
		};
	};

	const [location, setLocation] = useState(readLocation);
	useEffect(() => {
		const onHash = () => setLocation(readLocation());
		window.addEventListener("hashchange", onHash);
		return () => window.removeEventListener("hashchange", onHash);
	}, [basename]);

	const navigate = useCallback((to, { replace = false, state } = {}) => {
		const url = createURL(to);
		const href = "#" + (basename + url);
		if (replace) history.replaceState({ __state: state }, "", href);
		else history.pushState({ __state: state }, "", href);
		setLocation(readLocation());
	}, [basename]);

	return <RouterContext.Provider value={{ location, navigate, basename }}>{children}</RouterContext.Provider>;
}

/**
 * Hook that returns the current location object (path, search, hash, and navigation state).
 *
 * @returns The current location data for the active router context.
 */
export function useLocation() {
	const ctx = useContext(RouterContext);
	if (!ctx) throw new Error("useLocation must be used inside a Router");
	return ctx.location;
}

/**
 * Hook that returns a function used to imperatively navigate to a new location.
 *
 * @returns A navigate function for programmatic route changes (e.g., navigate(to, options)).
 */
export function useNavigate() {
	const ctx = useContext(RouterContext);
	if (!ctx) throw new Error("useNavigate must be used inside a Router");
	return ctx.navigate;
}
function useParams() {
	const ctx = useContext(RouteContext);
	return ctx.params || {};
}

/**
 * Generic Link component that renders an anchor (<a>) and forwards common navigation/link attributes.
 *
 * @param props - Component props.
 * @param props.to - Target location (route or URL) the link points to.
 * @param [props.replace=false] - If true, uses history replacement semantics instead of pushing a new entry.
 * @param [props.state] - Optional state to associate with the navigation action.
 * @param [props.onClick] - Click handler invoked when the link is activated.
 * @param [props.target] - Specifies where to open the linked document (e.g., "_blank").
 * @param [props.download] - Sets the download behavior for the link (download attribute).
 * @param [props.className] - CSS class name(s) for styling the underlying element.
 * @param [props.style] - Inline style object applied to the underlying element.
 * @param [props.children] - Content rendered inside the link (link label, icons, etc.).
 * @param [props.rest] - Additional props forwarded to the underlying <a>.
 */
export function Link({ to, replace = false, state, onClick, target, download, className, style, children, ...rest }) {
	const navigate = useNavigate();
	const href = "#" + createURL(to);
	function handleClick(e) {
		if (onClick) onClick(e);
		if (
			e.defaultPrevented ||
			e.button !== 0 ||
			(target && target !== "_self") ||
			e.metaKey || e.altKey || e.ctrlKey || e.shiftKey
		) return;
		e.preventDefault();
		navigate(to, { replace, state });
	}
	return (
		<a href={href} onClick={handleClick} target={target} download={download} className={className} style={style} {...rest}>
			{children}
		</a>
	);
}

function normalizePath(p) {
	if (!p) return "/";
	return p.replace(/\/+$/, "") || "/";
}


/**
 * React navigation link component (like a typed NavLink) that forwards props and supports common link attributes.
 *
 * @param props - Component props.
 * @param props.to - Target location (route) to navigate to.
 * @param [props.replace=false] - If true, replaces the current history entry instead of pushing a new one.
 * @param [props.state] - Optional navigation state passed along with the route transition.
 * @param [props.onClick] - Click handler invoked when the link is activated.
 * @param [props.target] - Sets the link target attribute (e.g., "_blank").
 * @param [props.download] - Enables download behavior for the link (sets the download attribute).
 * @param [props.className] - CSS class name(s) applied to the underlying element.
 * @param [props.style] - Inline styles applied to the underlying element.
 * @param [props.children] - Content rendered inside the link.
 * @param [props.rest] - Additional props forwarded to the underlying element.
 */
export function NavLink({
	to,
	end = false,
	activeClassName = "active",
	className,
	activeStyle,
	style,
	replace = false,
	state,
	children,
	onClick,
	...rest
}) {
	const navigate = useNavigate();
	const location = useLocation();
	const targetPath = typeof to === "string" ? to.split("?")[0].split("#")[0] : (to.pathname || "/");
	const currentPath = location.pathname || "/";
	const isActive = end ? normalizePath(currentPath) === normalizePath(targetPath) : normalizePath(currentPath).startsWith(normalizePath(targetPath));
	const resolvedClassName = typeof className === "function" ? className({ isActive }) : className;
	const finalClassName = [resolvedClassName, isActive ? activeClassName : null].filter(Boolean).join(" ") || undefined;
	const resolvedStyle = typeof style === "function" ? style({ isActive }) : style;
	const mergedStyle = isActive ? { ...(resolvedStyle || {}), ...(activeStyle || {}) } : resolvedStyle;
	const href = "#" + createURL(to);

	function handleClick(e) {
		if (onClick) onClick(e);
		if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
		e.preventDefault();
		navigate(to, { replace, state });
	}

	return (
		<a href={href} onClick={handleClick} className={finalClassName} style={mergedStyle} aria-current={isActive ? "page" : undefined} {...rest}>
			{typeof children === "function" ? children({ isActive }) : children}
		</a>
	);
}

// --- Simple route matching utility ---
// supports params like /users/:id and wildcard * at end (e.g., /files/*)
function compilePath(pattern) {
	const paramNames = [];
	// escape regex and replace :param and * 
	let regexSource = "^" + pattern.replace(/\/+$/,"").replace(/([.+?^=!:${}()|[\]\/\\])/g, "\\$1")
		.replace(/\\\:([A-Za-z0-9_]+)/g, (_, name) => {
			paramNames.push(name);
			return "([^/]+)";
		})
		.replace(/\\\*$/g, "(.+?)?"); // trailing * -> capture rest optional
	regexSource += "/?$";
	const regex = new RegExp(regexSource);
	return { regex, paramNames };
}

function matchPath(pattern, pathname) {
	if (pattern == null) return { matched: true, params: {} }; // <Route index> like
	const { regex, paramNames } = compilePath(pattern);
	const m = regex.exec(pathname);
	if (!m) return { matched: false };
	const params = {};
	paramNames.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1] || "")));
	// if wildcard captured as last group without a name, include as splat
	if (m.length > paramNames.length + 1) {
		params["*"] = m[paramNames.length + 1] ? decodeURIComponent(m[paramNames.length + 1]) : undefined;
	}
	return { matched: true, params };
}

// --- Route and Routes components ---
/**
 * Route configuration component that maps a URL path to a rendered element.
 *
 * @param props - Component props.
 * @param props.path - The path pattern this route should match (e.g., "/users/:id").
 * @param [props.element=null] - The React element to render when the route matches.
 * @param [props.children] - Optional nested route definitions or additional content under this route.
 */
export function Route({ path, element = null, children }) {
	// Route is used as a descriptor only inside <Routes>
	return null;
}
/**
 * Route container component that groups multiple <Route> definitions.
 *
 * @param props - Component props.
 * @param props.children - One or more route elements to register under the router.
 */
export function Routes({ children }) {
	const location = useLocation();
	const pathname = location.pathname || "/";
	// flatten children (React elements)
	const routes = Children.toArray(children);

	for (let i = 0; i < routes.length; i++) {
		const route = routes[i];
		// accept <Route path="..." element={<.../>} />
		const path = route.props.path === undefined ? null : route.props.path;
		const element = route.props.element ?? null;
		const childRoutes = route.props.children;

		const { matched, params } = matchPath(path, pathname);
		if (matched) {
			// if element is null but has children (nested routes), attempt to render nested Routes
			if (element) {
				return <RouteContext.Provider value={{ params }}>{element}</RouteContext.Provider>;
			} else if (childRoutes) {
				// render nested Routes within same params
				return <RouteContext.Provider value={{ params }}><Routes>{childRoutes}</Routes></RouteContext.Provider>;
			} else {
				return <RouteContext.Provider value={{ params }}><div /></RouteContext.Provider>;
			}
		}
	}

	// no match -> null
	return null;
}

