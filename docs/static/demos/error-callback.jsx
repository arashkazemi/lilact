module.exports = function() {

  return <center>
          <button onClick={()=>{doUnknown()}}>
            Press to get Error with Curly Brackets!
          </button>
          <br/><br/>
          <button onClick={()=>doUnknown()}>
            Press to get Error without Curly Brackets!
          </button>

          <p>The first button's onClick arrow handler body is wrapped in curly brackets. <br/><br/>

            {"<button onClick={()=>{doUnknown()}}>"}<br/><br/>

            JS runtimes currently lack a consistent reporting mechanism for errors produced in eval,
            and as Lilact runs the transpiled JSX in eval, tracing errors has its own difficulties.
            <br/><br/>
            At the moment things work pretty nice and errors are tracked to the JSX scripts very nicely and
            {" "}<b>Firefox</b>{" "}and{" "}<b>Chrome</b>{" "}work flawlessly, but{" "}<b>Safari</b>{" "}
            has problems sometimes, as it drops the eval frame data on async or deferred calls.
            <br/><br/>
            I implemented a tracking mechanism to overcome this, but for the sake of efficiency, 
            it is block-based and only locates the code that is in  {" {} "} blocks. As a result, the callbacks
            should be wrapped in a {" {} "} to be tracable in Safari. If not, it works in all major browsers, 
            but the error it is not possible to display the exact location of the error in Safari.</p>
          </center>

}