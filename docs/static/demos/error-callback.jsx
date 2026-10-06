export default function() {

  return <center>
          <button onClick={()=>{doUnknown()}}>
            Press to get Error! (With Curly Brackets)
          </button>
          <br/><br/>
          <button onClick={  ()   =>     doUnknown    ()    }>
            Press to get Error! (Without Curly Brackets)
          </button>

          <p>The first button's onClick arrow handler body is wrapped in curly brackets. <br/><br/>

            {"<button onClick={()=>{doUnknown()}}>"}<br/><br/>

            JS runtimes currently lack a consistent reporting mechanism for errors produced in eval,
            and as Lilact runs the transpiled JSX in eval, tracing errors has its own difficulties.
            <br/><br/>
            Lilact has a tracing mechanism to overcome this, but for the sake of efficiency, 
            it is block-based and only locates the code that is in  {" {} "} blocks. As a result, the 
            arrow callbacks should be wrapped in a {" {} "} (and return result if any) or be defined 
            somewhere else in the code (like useCallback) and only referenced from XML to be traceable 
            in all situations. If not, it works, but it is not possible to display the exact location 
            of some errors.</p>
          </center>

}