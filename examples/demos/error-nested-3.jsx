import { Suspense, Spinner, lazy } from "lilact";
import Demo from "./error-component-stack.jsx"


function NestedError({file}) 
{
	return 	<center>
		      		<Demo/>
			</center>
}

export default NestedError;