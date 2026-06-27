const { useState, useDeferredValue, render } = Lilact;

function ExpensiveList({ query }) {
  const items = Array.from({ length: 5000 }, (_, i) => `${query} item ${i}`);
  return (
    <ul>
      {items.map((it) => (
        <li key={it}>{it}</li>
      ))}
    </ul>
  );
}

function Demo() {
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q, "loading...");

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type to search..." />
      <p>Live: {q}</p>
      <p>Deferred: {deferredQ}</p>
      <div style={{ height: 300, overflow: "auto", border: "1px solid #ccc" }}>
        <ExpensiveList query={deferredQ} />
      </div>
    </div>
  );
}

module.exports = Demo;
