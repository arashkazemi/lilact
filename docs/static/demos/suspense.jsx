const { Suspense, Spinner } = Lilact;

// resource factory that throws its internal promise until resolved
function createResource(delay, value) {
  let status = "pending";
  let result;
  const p = new Promise((res) => setTimeout(() => res(value), delay)).then(
    (r) => {
      status = "success";
      result = r;
    },
    (e) => {
      status = "error";
      result = e;
    }
  );
  return {
    read() {
      if (status === "pending") throw p;
      if (status === "error") throw result;
      return result;
    },
  };
}

const r1 = createResource(1500, "First ready (1500ms)");
const r2 = createResource(3000, "Second ready (3000ms)");

function Child1() {
  const v = r1.read();
  return <div>{v}</div>;
}
function Child2() {
  const v = r2.read();
  return <div>{v}</div>;
}

function Demo() {
  return  <Suspense minDelay={200} minShowTime={400} fallback={<Spinner/>}>
            <Child1 />
            <Child2 />
          </Suspense>
}


module.exports = Demo;
