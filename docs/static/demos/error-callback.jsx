module.exports = function() {

  return <>
      <button onClick={()=>{doUnknown()}}>
        Press to get Error!
      </button>

      <p>Notice that the onClick arrow handler body is wrapped in curly brackets. <br/><br/>

        {"<button onClick={()=>{doUnknown()}}>"}<br/><br/>

        JS runtimes currently lack a consistent reporting mechanism for errors produced in eval,
        and as Lilact runs the transpiled JSX in eval, tracing errors is very difficult.
        I implemented a tracking mechanism to overcome this, but for the sake of efficiency, 
        it is block-based and only locates the code that is in  {" {} "} blocks. As a result, the callbacks
        should be wrapped in a {" {} "} to be tracable. It works otherwise, and the error itself will still 
        be shown, but it is not possible to display the exact location of the error.</p>
    </>

}