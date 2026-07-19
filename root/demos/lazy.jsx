const {Suspense, Spinner, lazy, require} = Lilact;

const StopWatch = lazy( ()=>require('demos/stopwatch.jsx') );

function Demo({file}) 
{
	return 	<div>
				<p>This is the stopwatch demo, but loaded using lazy wrapper.</p>
				<Suspense minDelay="0" minShowTime="500" fallback={<Spinner/>}>
		      		<StopWatch/>
				</Suspense>
			</div>
}

module.exports = Demo;