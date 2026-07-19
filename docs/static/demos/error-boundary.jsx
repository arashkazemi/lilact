const { ErrorBoundary, useState } = Lilact;

function Demo() {
  const [mode, setMode] = useState("safe"); // "safe" | "direct" | "deep"

  return (
    <div>
      <p>
        In this example an ErrorBoundary shows a fallback on error that contains the error message.
        <br/><br/>
        The "Try Again" button resets the error. But the erronous state persists, 
        unless you get to a safe state by pressing the "Safe" button and then try again.
        <br/><br/>
        Check the console for component stack.
      </p>
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setMode("safe")}>Safe</button>{" "}
        <button onClick={() => setMode("direct")}>Direct-child throws</button>{" "}
        <button onClick={() => setMode("deep")}>Deep-child throws</button>
      </div>

      <ErrorBoundary Fallback={MyFallback} onError={(e, info) => console.log("reported", info.componentStackLog)}>
        {mode === "safe" && <p>All good — no errors.</p>}
        {mode === "direct" && <ExplodingChild />}
        {mode === "deep" && <DeepTree />}
      </ErrorBoundary>
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

/* Fallback component received via Fallback prop */
function MyFallback({ error, reset }) {
  return (
    <div role="alert" style={{ border: "1px solid #f00", padding: 12 }}>
      <p><strong>Something went wrong:</strong> {error?.message}</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

module.exports = Demo;
