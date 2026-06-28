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

	return <dialog ref={ref}>{children}</dialog>;
}

function Demo() {
	const [show, setShow] = useState(false);
	console.log(show);
	return (
		<>
			<button onClick={() => setShow(true)}>
				Open dialog
			</button>
			<ModalDialog isOpen={show}>
				Hello there!
				<br />
				<button onClick={() => {
					setShow(false);
				}}>Close</button>
			</ModalDialog>
		</>
		);
}

module.exports = Demo;
