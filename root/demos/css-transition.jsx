const { CSSTransition, useState, useRef } = Lilact;


Lilact.emotion.injectGlobal(`
.test {
  -position: absolute;
  transition: opacity 1000ms, transform 1000ms;
}

.test-appear  {
  opacity: 0;
}
.test-enter-active, .test-enter-done  {
  opacity: 1;
  -transform: scale(1);
}
.test-exit-active, .test-exit-done {
  opacity: 0.2;
  -transform: scale(0.9);
}

`);


function Demo() 
{
  const [inProp, setInProp] = useState(false);
  const nodeRef = useRef(null);

  const chs = [];

  for(let i=0; i<10;i++) chs.push( <div className='test'>{i}</div> );

  return (
    <div>

      <CSSTransition in={inProp} classNames='test'
      
      onEnter={function(){console.log('onEnter', arguments)}}
      onEntering={function(){console.log('onEntering', arguments)}}
      onEntered={function(){console.log('onEntered', arguments)}}
      onExit={function(){console.log('onExit', arguments)}}
      onExiting={function(){console.log('onExiting', arguments)}}
      onExited={function(){console.log('onExited', arguments)}}

      timeout={1000}

      unmountOnExit={false}
      mountOnEnter={false}
      >
        {chs}
      </CSSTransition>

      <button ref={nodeRef} className="test" onClick={() => setInProp(!inProp)}>
        Click to {inProp?" OUT":" IN"}
      </button>

     <br/>
      <br/>

    </div>
  );
}

module.exports = Demo;
