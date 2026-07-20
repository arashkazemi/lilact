const { useState, Transition } = Lilact;

function Demo() {
  const [inProp, setInProp] = useState(false);

  const toggleVisibility = () => {
    setInProp((prev) => !prev);
  };

  return <>
          <p>This example doesn't actually change the visibility, but emits the events and
            updates a text according the transition state. See the console for logs.</p>
          <div>
            <button onClick={toggleVisibility}>
              {inProp ? 'Hide Component' : 'Show Component'}
            </button>
            <Transition
              in={inProp}
              timeout={1000}
              mountOnEnter={false} 
              onEnter={() => console.log('Enter')}
              onExit={() => console.log('Exit')}
              onEntering={() => console.log('Entering')}
              onExiting={() => console.log('Exiting')}
              onEntered={() => console.log('Entered')}
              onExited={() => console.log('Exited')}
            >
              {(state) => (
                <div>
                  {state === 'entering' && <p>Hello, World! (Entering)</p>}
                  {state === 'exiting' && <p>Hello, World! (Exiting)</p>}
                  {state === 'entered' && <p>Hello, World! (Visible)</p>}
                  {state === 'exited' && <p>Hello, World! (Hidden)</p>}
                </div>
              )}
            </Transition>
          </div>
        </>;
};

module.exports = Demo;
