import { useTransition, useState, useCallback, useId } from "lilact";
import { css, cx } from "@emotion/css";

const Demo = ()=>{

	const [isPending, startTrans] = useTransition();
	const [bg,setBg] = useState("yellow");

	const id = useId();

	const startCB = useCallback ( ()=>{
						
						setBg("pink");

						startTrans( async ()=>{
							
							await new Promise( (res,rej)=>{setTimeout(res, 1000)} ); 
							
							setBg("lightgreen");

							startTrans( async()=> {
								await new Promise( (res,rej)=>{setTimeout(res, 1000)} ); 
							});
						} )
					} );
	return (
		<div className={css({background:bg})}>
			<h4>{id}</h4>
			{isPending? <b>PENDING...</b> : <i>NOT PENDING</i>}
			<button onclick={startCB}>START CB</button>
		</div>
	);
};

export default Demo;
