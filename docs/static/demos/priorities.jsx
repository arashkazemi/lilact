import {useEffect, useLayoutEffect, useInsertionEffect, useState, startTransition} from "lilact";

function Demo() {
  const [n, setN] = useState(0);

  // Runs during render-triggered commit, before layout effects, before paint
  useInsertionEffect(() => {
    console.log("insertionEffect", n);
  }, [n]);

  // Runs after insertion effects, before paint
  useLayoutEffect(() => {
    console.log("layoutEffect", n);
  }, [n]);

  // Runs after paint (passive)
  useEffect(() => {
    console.log("passiveEffect", n);
  }, [n]);

  console.log("render", n);

  return (<>
    <button
      onClick={() => {
        console.log("click handler: start");
        startTransition(() => {
          console.log("startTransition callback: before setN");
          setN(x => x + 1);
          console.log("startTransition callback: after setN");
        });
        console.log("click handler: end");
      }}
    >
      Trigger
    </button>
    <p>
      Expected console output (typical behavior)<br/>
      <br/>
      When you click the button once, you should see this pattern (note the “render”/commit/effects ordering):<br/>
      <br/>
      Initial mount (before any click)<br/>
      <br/>
          render 0<br/>
          insertionEffect 0<br/>
          layoutEffect 0<br/>
          (after paint) passiveEffect 0<br/>
      <br/>
      After the click (startTransition schedules the update)<br/>
      <br/>
          click handler: start<br/>
          startTransition callback: before setN<br/>
          startTransition callback: after setN<br/>
          click handler: end<br/>
      <br/>
      Commit for the transition update (n becomes 1)<br/>
      <br/>
          render 1<br/>
          insertionEffect 1<br/>
          layoutEffect 1<br/>
          (after paint) passiveEffect 1<br/>
      <br/>
    </p>

  </>);
}

export default Demo;
