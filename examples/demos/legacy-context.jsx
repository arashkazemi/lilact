// Legacy context merge/override test (JSX + your fiber)
// - static childContextTypes
// - getChildContext()
// - static contextTypes
// - instance.context available during render

const { Component, PropTypes, render } = Lilact;


// ----- Consumer -----
class Consumer extends Component {
  static contextTypes = {
    a: PropTypes.string,
    b: PropTypes.string,
    d: PropTypes.string.isRequired,
  };

  render() {
    const expected = { a: 'fromP2', b: 'fromP1', c: 'fromP2' };

    if (
      JSON.stringify(this.context) !== JSON.stringify(expected)
    ) {
      throw new Error(
        `Legacy context merge failed.\nExpected ${JSON.stringify(
          expected
        )}\nGot ${JSON.stringify(this.context)}`
      );
    }

    return <p>Consumer Context:<br/>
              <pre>{JSON.stringify(this.context, null, 4)}</pre>
            </p>;
  }
}

// ----- Provider1 -----
class Provider1 extends Component {
  static childContextTypes = {
    a: PropTypes.string,
    b: PropTypes.string,
  };

  getChildContext() {
    return { a: 'fromP1', b: 'fromP1' };
  }

  render() {
    return <Provider2 />;
  }
}

// ----- Provider2 overrides + adds -----
class Provider2 extends Component {
  static childContextTypes = {
    a: PropTypes.string,
    c: PropTypes.string,
  };

  getChildContext() {
    return { a: 'fromP2', c: 'fromP2' };
  }

  render() {
    return <Consumer />;
  }
}

// ----- App -----
function Demo() {
  return <>
            <p>See console for PropTypes warning.</p>
            <Provider1 />
         </>
}

module.exports = Demo;


