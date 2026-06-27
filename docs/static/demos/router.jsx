const { createRoot,HashRouter,
  NavLink,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useState
} = Lilact;

/* Simple pages */
function Home() {
  const loc = useLocation();
  return (
    <div>
      <h2>Home</h2>
      <p>Welcome to the home page.</p>
      {loc.state?.from && (
        <p>
          <strong>Arrived from:</strong> {loc.state.from}
        </p>
      )}
    </div>
  );
}

function About() {
  const loc = useLocation();
  return (
    <div>
      <h2>About</h2>
      <p>This is the about page.</p>
      {loc.state?.message && (
        <p>
          <strong>Message:</strong> {loc.state.message}
        </p>
      )}
    </div>
  );
}

function Profile({ name = "Guest" }) {
  const loc = useLocation();
  return (
    <div>
      <h2>Profile</h2>
      <p>Signed in as: {name}</p>
      {loc.state?.note && (
        <p>
          <strong>Note:</strong> {loc.state.note}
        </p>
      )}
    </div>
  );
}

function NotFound() {
  const loc = useLocation();
  return (
    <div>
      <h2>404</h2>
      <p>No match for <code>{loc.pathname}</code></p>
    </div>
  );
}

/* Component demonstrating useNavigate and NavLink state */
function NavControls() {
  const navigate = useNavigate();

  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => navigate("/", { state: { from: "NavControls button" } })}>
        Go Home (with state)
      </button>
      <button
        onClick={() =>
          navigate("/about", { state: { message: "Hello from NavControls" } })
        }
        style={{ marginLeft: 8 }}
      >
        Go About (with state)
      </button>
      <button
        onClick={() =>
          navigate("/profile", { replace: true, state: { note: "Profile via replace" } })
        }
        style={{ marginLeft: 8 }}
      >
        Go Profile (replace + state)
      </button>
      <button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>
        Back
      </button>
    </div>
  );
}

/* App with nav and routes; NavLink uses 'to' as object with pathname + state */
function Demo() {
  const navStyle = {
    padding: 12,
    borderBottom: "1px solid #ddd",
    marginBottom: 12,
  };

  const linkStyle = ({ isActive }) => ({
    marginRight: 12,
    padding: "6px 8px",
    borderRadius: 4,
    textDecoration: "none",
    color: isActive ? "#fff" : "#0366d6",
    background: isActive ? "#0366d6" : "transparent",
  });

  return (
    <HashRouter>
      <nav style={navStyle}>
        <NavLink to={{ pathname: "/" }} end style={linkStyle} state={{ from: "NavLink Home" }}>
          Home
        </NavLink>

        <NavLink
          to={{ pathname: "/about" }}
          style={linkStyle}
          state={{ message: "Hello from NavLink About" }}
        >
          About
        </NavLink>

        <NavLink
          to={{ pathname: "/profile" }}
          style={linkStyle}
          state={{ note: "Visited via NavLink" }}
        >
          Profile
        </NavLink>
      </nav>

      <main style={{ padding: 12 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/profile" element={<Profile name="Alice" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>

        <NavControls />
      </main>
    </HashRouter>
  );
}

module.exports = Demo;
