const { useState, memo } = Lilact;

const Child = memo(function Child({ count }) {
  console.log("Child render. count =", count);
  return <div>Child count: {count}</div>;
});

module.exports = function Demo() {
  const [tick, setTick] = useState(0);
  const [count] = useState(5); // never changes

  return (
    <div>
      <p>This is a demonstration of `memo`. When the button is pressed the parent div is updated but as the count
        is not changed the Child does not update, so its render is only logged once.
      </p>
      <center>
        <button onClick={() => setTick(tick + 1)}>Parent re-render</button>
        <div>Tick: {tick}</div>

        {/* Parent updates, but count prop stays 5 */}
        <Child count={count} />
      </center>
    </div>
  );
}
