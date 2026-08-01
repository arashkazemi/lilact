const { createPortal, useState } = Lilact;

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

module.exports = function Demo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open modal</button>
      <Modal open={open} onClose={() => setOpen(false)}>
        <b>Hello World!</b><br/>
        From a portal!
      </Modal>
    </>
  );
}
