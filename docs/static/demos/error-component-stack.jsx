const { ErrorBoundary, useState } = Lilact;

function Demo() {
  const [mode, setMode] = useState("safe"); // "safe" | "direct" | "deep"

  return (
    <div>
      <p>
        This is the same as ErrorBoundary demo, but without boundary.
      </p>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setMode("direct")}>Direct-child throws</button>{" "}
        <button onClick={() => setMode("deep")}>Deep-child throws</button>
      </div>
      {mode === "direct" && <ExplodingChild />}
      {mode === "deep" && <DeepTree />}
    </div>
  );
}

/* Direct descendant that throws during render */
function ExplodingChild() {
  throw new Error("Direct child error");
  // return <div>won't render</div>;
}

/* Deeply nested tree where a leaf throws */
function Leaf() {
  throw new Error("Deep child error");
  // return <div>leaf</div>;
}
function Middle() {
  return <div><Leaf /></div>;
}
function DeepTree() {
  return <section><Middle /></section>;
}

module.exports = Demo;
