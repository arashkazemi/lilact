import { Suspense, Spinner, lazy } from "lilact";
import "./error-parser.jsx"

function NestedError({file}) 
{
	return 	<center>
				Parser Error example will throw an error upon import.
			</center>
}

export default NestedError;