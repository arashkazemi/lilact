const { useState, SwitchTransition } = Lilact;

Lilact.emotion.injectGlobal(`
  .switchItem {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 140px;
    padding: 10px 14px;
    border-radius: 999px;
    font-family: system-ui, sans-serif;
    font-weight: 600;
    border: 1px solid #ddd;
  }

  .fadeSlide-enter { opacity: 0; transform: translateY(6px); }
  .fadeSlide-enter-active { opacity: 1; transform: translateY(0); transition: opacity 300ms ease, transform 300ms ease; }
  .fadeSlide-exit { opacity: 1; transform: translateY(0); }
  .fadeSlide-exit-active { opacity: 0; transform: translateY(-6px); transition: opacity 300ms ease, transform 300ms ease; }

  .on { background: #e8fff0; color: #0a7a2f; border-color: #a6efbb; }
  .off { background: #fff1f1; color: #8a1f1f; border-color: #ffd0d0; }

`);

module.exports = function SwitchButton() {
  const [on, setOn] = useState(false);

  return (
    <div style={{ padding: 16 }}>
      <button
        onClick={() => setOn((v) => !v)}
        style={{ cursor: "pointer", marginBottom: 12 }}
      >
        Toggle
      </button>

      <SwitchTransition in={on} mode="out-in" timeout={300} classNames="fadeSlide">
        {(inState) => (
          <div
            key={inState ? "on" : "off"}
            className={`switchItem ${inState ? "on" : "off"}`}
          >
            {inState ? "ON" : "OFF"}
          </div>
        )}
      </SwitchTransition>
    </div>
  );
}
