import { Suspense, Spinner, lazy } from "lilact";
import Demo from "./error-callback.jsx"


function NestedError({file}) 
{
	return 	<center>
		      		<Demo/>
			</center>
}

export default NestedError;