const { useState, SwitchTransition } = Lilact;

Lilact.emotion.injectGlobal(`
.switch-enter,
.switch-exit {
  opacity: 0;
  transform: translateY(-10px) scale(0.98);
}

.switch-enter-active,
.switch-exit-active {
  transition: opacity 300ms ease, transform 300ms ease;
}

.switch-enter-active, .switch-enter-done {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.switch-exit-active, .switch-exit-done {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}
`);


function Demo() {
  const [on, setOn] = useState(false);

  return (
    <div>
      <button onClick={()=>setOn(v => !v) }>
        Toggle
      </button>

      <div style={{ position: "relative", height: 80 }}>
        <SwitchTransition
          activeKey={on ? "on" : "off"}
          mode="out-in"
          timeout={300}
        >
          <div key="off" style={{ padding: 12, background: "#fee", borderRadius: 5 }}>
            OFF panel (state preserved)
          </div>
          <div key="on" style={{ padding: 12, background: "#eef", borderRadius: 5 }}>
            ON panel (state preserved)
          </div>
        </SwitchTransition>
      </div>
    </div>
  );
}

module.exports = Demo;
