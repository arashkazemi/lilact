import React from "lilact";

function FancyButton({ label, variant, onClick, children }) {
  return (
    <button
      className={`btn btn--${variant}`}
      onClick={onClick}
      style={{ marginRight: 12 }}
    >
      {label}
      {children ? <span style={{ marginLeft: 8 }}>{children}</span> : null}
    </button>
  );
}

export default function Demo() {
  const original = (
    <FancyButton
      label="Original"
      variant="primary"
      onClick={() => alert("Original clicked")}
    >
      (child)
    </FancyButton>
  );

  const cloned = React.cloneElement(original, {
    // Override props:
    label: "Cloned!",
    variant: "success",

    // You can override event handlers too:
    onClick: () => alert("Cloned clicked"),
  });

  const clonedWithNewChildren = React.cloneElement(
    original,
    {
      // Override just one prop; leave others as-is
      variant: "warning",
    },

    <span style={{ fontStyle: "italic" }}>(new child)</span>
  );

  return (
    <div style={{ padding: 16 }}>
      <h2>React.cloneElement behavior</h2>

      <p> This is a cloneElement example. But notice that Lilact is imported as React! </p>
      <p> This is to show how Lilact can be easily integrated in many React projects! In fact Lilact
          uses "Component" instead of "Element" in its names, so "cloneComponent" is its
          main cloning function. But similar to createComponent that is aliased to createElement, 
          cloneComponent is aliased to cloneElement to be compatible with the official React API.</p>

      <div style={{ marginBottom: 16 }}>
        <div>1) Original element (unchanged):</div>
        {original}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div>2) Cloned with overridden props:</div>
        {cloned}
      </div>

      <div>
        <div>3) Cloned with overridden props + replaced children:</div>
        {clonedWithNewChildren}
      </div>
    </div>
  );
}
