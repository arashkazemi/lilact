const { useEffect, useRef, useState } = Lilact;

function ModalDialog({ isOpen, children }) {
	const ref = useRef();
	useEffect(() => {
		
		if (!isOpen) {
			return;
		}
		const dialog = ref.current;

		dialog.showModal();

		return () => {
			dialog.close();
		};
	}, [isOpen]);

	return <dialog ref={ref} style={{padding: 20, borderRadius: 10, border: "none", boxShadow: "0 5px 20px #000"}}>{children}</dialog>;
}

function Demo() {
	const [show, setShow] = useState(false);

	return 	<>
				<button onClick={() => setShow(true)}>
					Open dialog
				</button>
				<ModalDialog isOpen={show}>
					Hello there!
					<br />
					<br />
					<button onClick={() => {
						setShow(false);
					}}>Close</button>
				</ModalDialog>
			</>;
}

module.exports = Demo;
