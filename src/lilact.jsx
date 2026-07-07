/*

	Lilact
	Copyright (C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>
	All rights reserved.

	BSD-2-Clause

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:

	* Redistributions of source code must retain the above copyright
	  notice, this list of conditions and the following disclaimer.
	* Redistributions in binary form must reproduce the above copyright
	  notice, this list of conditions and the following disclaimer in the
	  documentation and/or other materials provided with the distribution.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
	AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
	IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
	ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
	THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

*/



import * as redux from "redux";
import * as emotion from "@emotion/css";

import PropTypes from 'prop-types';

import * as components from './components.jsx';
import * as hooks from './hooks.jsx';
import * as run from './run.jsx';
import * as transition from './transition.jsx';
import * as events from './events.jsx';
import * as redux_wrapper from './redux.jsx';
import * as timers from './timers.jsx';
import * as misc from './misc.jsx';
import * as errors from './errors.jsx';


import * as router from './router.jsx';
import * as accessories from './accessories.jsx';
import {ResizablePane} from './pane.jsx';

import {transpileJSX, transpilerConfig} from "./jsx";



/**
 * @namespace Lilact
 * 
 * @property PropTypes - Handle to the PropTypes runtime type-checking library (https://github.com/facebook/prop-types).
 * @property Redux - Handle to Redux’s public API (https://github.com/reduxjs/redux).
 * @property emotion - Handle to Emotion’s CSS-in-JS package for styling (https://github.com/emotion-js/emotion).
 */
export const Lilact = 
{	

	VERSION: "beta.5",
	
	// Configuration

	defaultTransitionTimeout: 300,
	defaultIsEqual: Object.is, // note: `Lilact.shallowEqual` and `Lilact.deepEqual` are also available, 
								  					 // user can set it in your initializer code, and can be changed later too.
	
	// Units 

	...misc,
	...run,
	...components,
	...hooks,
	...transition,
	...redux_wrapper,
	...timers,
	...events,
	...errors,

	...router,
	...accessories,

	ResizablePane,

	transpileJSX,
	transpilerConfig,

	// Dependencies
	PropTypes,
	redux,
	emotion,

}

globalThis.Lilact = Lilact;

document.addEventListener('DOMContentLoaded', () => {
  Lilact.runScripts();
});

window.addEventListener('error', (e) => {
	Lilact.globalErrorHandler(e);
});

ʔ if(DEBUG) {
	console.log(`Lilact (Version: ${Lilact.VERSION}) - Debug Mode`);
	console.log(`Copyright(C) 2024-2026 Arash Kazemi <contact.arash.kazemi@gmail.com>`);
ʔ }

export default Lilact;