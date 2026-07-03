const { useActionState } = Lilact;

async function addToCart(prevState, queryData) {

	const itemID = queryData.get('itemID');

	if (itemID === "1") {
		return "Added to cart";
	} else {
    // Add a fake delay to make waiting noticeable.
		await new Promise(resolve => {
			setTimeout(resolve, 2000);
		});
		return "Couldn't add to cart: the item is sold out.";
	}
}

function AddToCartForm({itemID, itemTitle}) {
	const [message, formAction, isPending] = useActionState(addToCart, null);

	return (
		<form action={formAction}>
			<h2>{itemTitle}</h2>
			<input type="hidden" name="itemID" value={itemID} />
			<button type="submit">Add to Cart </button>
			{isPending ? "Loading..." : message}
		</form>
		);
}

function Demo() {
	return 	<>
				<AddToCartForm itemID="1" itemTitle="JavaScript: The Definitive Guide" />
				<AddToCartForm itemID="2" itemTitle="JavaScript: The Good Parts" />
			</>
}


module.exports = Demo;
