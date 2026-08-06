import { CSSTransition, useState, useRef } from "lilact";


Lilact.emotion.injectGlobal(`
.test {
  transition: opacity 1000ms, transform 1000ms;
  height: 2rem;
}

.test-appear  {
  opacity: 0;
}
.test-enter-active, .test-enter-done  {
  opacity: 1;
  transform: scale(2);
}
.test-exit-active, .test-exit-done {
  opacity: 0.2;
  transform: scale(1);
}

`);


function Demo() 
{
  const [inProp, setInProp] = useState(false);
  const nodeRef = useRef(null);

  const chs = [];

  for(let i=1; i<10;i++) chs.push( <div className='test'>{i}</div> );

  return (
    <div style={{overflow:"hidden", textAlign: "center"}}>
      <p> Notice that Lilact CSSTransition accepts multiple children too. </p>
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

      <button ref={nodeRef} onClick={() => setInProp(!inProp)}>
        Click to {inProp?" OUT":" IN"}
      </button>

     <br/>
      <br/>

    </div>
  );
}

export default Demo;
