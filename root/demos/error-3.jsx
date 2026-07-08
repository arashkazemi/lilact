module.exports = function() {

  return <>
      <p>Notice that the onClick arrow handler body is wrapped in brackets. <br/><br/>

        {"<button onClick={()=>{doUnknown()}}>"}<br/><br/>

        JS runtimes currently lack a consistent error reporting in eval produced errors,
        and as Lilact runs the transpiled JSX in eval, tracing errors is very difficult.
        I implemented a tracking mechanism to overcome this, but for the sake of efficiency, 
        it is block-based and locates the code that is in blocks. As a result, the callbacks
        should be wrapped in a {" {} "} or it is not possible to display the exact location 
        of the error although the error itself will still be shown.</p>

      <button onClick={()=>{doUnknown()}}>
        Press to get Error!
      </button>
    </>

}