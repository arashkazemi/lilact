const { useRef, useState, SplitPane } = Lilact;

module.exports = function Demo() {
  const ref = useRef(null);
  const [mode, setMode] = useState("horizontal");
  const [position, setPosition] = useState(0.35);

  return (
    <>
      <button onClick={() => ref.current?.setMode(ref.current?.getMode() === "horizontal" ? "vertical" : "horizontal")}>
        Toggle mode
      </button>
      <button onClick={() => ref.current?.setPosition(0.5)}>Center</button>
      <span>Position:{" "}{position.toFixed(2)}</span>

      <div  style={{ height: "calc(100% - 4em)", width: "calc(100% - 1rem)", margin: "10px auto 0", border: "1px solid"}}>
        <SplitPane
          ref={ref}
          mode={mode}
          position={position}
          min={0.2}
          max={0.8}
          splitterSize={10}
          onSizeChange={(p) => setPosition(p)}
        >
          <div style={{ padding: 12 }}>Left/Top</div>
          <div style={{ padding: 12 }}>Right/Bottom</div>
        </SplitPane>
      </div>
    </>
  );
}
