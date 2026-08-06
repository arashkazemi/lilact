import { createPortal, useState } from "lilact";

function Modal({ open, onClose, children }) {
  if (!open) return null;

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) return null;

  return createPortal(
    
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          color: "black",
          padding: 20,
          borderRadius: 8,
          minWidth: 280,
        }}
      >
        {children}
        <br/>
        <button onClick={onClose} style={{ marginTop: 12 }}>
          Close
        </button>
      </div>
    </div>
    ,
    modalRoot
  );
}

export default function Demo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <p>This example creates a modal, but uses a portal for it.</p>
      <p>Notice that the modal close button style does not obey this container CSS rules as it is rendered outside.</p>
      <button onClick={() => setOpen(true)}>Open modal</button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <b>Hello World!</b><br/>
        From a portal!
      </Modal>
    </>
  );
}
