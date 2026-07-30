const { useEffect } = Lilact;

module.exports = function Demo() {
  useEffect(() => {
    // Just to make it obvious in the console that this is running once
    console.log("mount");
  }, []);

  return <>
    <p>See console for the logs.</p>
    <div
      style={{ padding: 20, border: "2px solid black" }}
      onClick={() => console.log("div bubble")}
      onClickCapture={() => console.log("div capture")}
    >
      Div
      <button
        style={{ marginLeft: 20 }}
        onClick={() => console.log("button bubble")}
        onClickCapture={() => console.log("button capture")}
      >
        Button
      </button>
    </div>
  </>;
}
