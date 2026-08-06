import { forwardRef, useImperativeHandle, useRef } from "lilact";

const Child = forwardRef(function Child({ id }, ref) {
  // Each child exposes a custom imperative API on its *own* ref
  useImperativeHandle(ref, () => ({
    x() {
      console.log(`child ${id}: x() called`);
    },
  }), [id]);

  return <div>Child {id}</div>;
});

export default function Demo() {
  const childRefs = useRef([]);

  // helper: store the function ref for each child index
  const setChildRef = (i) => (handle) => {
    // handle is the object returned by the child's useImperativeHandle factory
    childRefs.current[i] = handle;
  };

  const components = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return <center>
          <p>This is an example of using forwardRef in combination with 
             function refs. See the console for logs.
           </p>

          <div>
            {components.map((id, i) => (
              <Child key={id} id={id} ref={ setChildRef(i) } />
            ))}

            <button
              onClick={() => {
                // Parent calls the method "x" on each child's handle object
                childRefs.current.forEach((handle) => handle?.x());
              }}
            >
              Call x on all
            </button>
          </div>
        </center>
}