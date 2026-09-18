import { Suspense, Spinner, lazy } from "lilact";
import Demo from "./error-init.jsx"


function NestedError({file}) 
{
	return 	<center>
		      		<Demo/>
			</center>
}

export default NestedError;