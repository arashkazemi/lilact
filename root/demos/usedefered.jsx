const { useState, useDeferredValue } = Lilact;

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
  const deferredQ = useDeferredValue(q, "Item");

  return (<>
            <p>This is only a showcase of useDeferredValue. No search actually takes place, just 
              a long list of items is loaded as you type.</p>
            <div>
              <input value={q} onKeyUp={(e) => setQ(e.target.value)} placeholder="Type to search..." />
              <p>Live: {q}</p>
              <p>Deferred: {deferredQ}</p>
              <div style={{ height: 300, overflow: "auto", border: "1px solid #ccc" }}>
                <ExpensiveList query={deferredQ} />
              </div>
            </div>
    </>
  );
}

module.exports = Demo;
