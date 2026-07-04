const { useRef, useState, ResizablePane } = Lilact;

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

      <div  style={{ height: "calc(100% - 2em)", width: "100% - 2em", border: "1px solid" }}>
        <ResizablePane
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
        </ResizablePane>
      </div>
    </>
  );
}
