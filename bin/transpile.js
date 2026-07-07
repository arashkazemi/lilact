#!/usr/bin/env node

/*

	Lilact
	Copyright (C) 2024-2025 Arash Kazemi <contact.arash.kazemi@gmail.com>
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

import fs from "fs";
import path from "path";

import {transpileJSX} from "../src/jsx.js";



function usage() 
{
	console.error(
		"Usage:\n" +
			"  transpile <entries...> [Options] \n\n" +
			"Options:\n" +
			"  --out <filepath>      Output filepath for transpiled files. Multiple inputs will be concatenated. If not given, each file will have a separate output with an additinoal .transpiled.js in its name.\n" +
			"  --isDebug             Add debug labels \n\n" +
			"  --discardComments     Discard comments \n\n" +
//			"  --injectTraceLabels   Inject trace labels needed by Lilact only \n\n" +
			"  --factory <func>      The factory function (default: createComponent)\n\n" +
			"  -h, --help            Show help\n\n" +
			"Example:\n" +
			"  transpile src/test.jsx dist/test.js"
	);
	process.exit(1);
}



const argv = process.argv.slice(2);
if (argv.length === 0) usage();

let out = null;

let factory = "createComponent";
let discardComments = false;
let injectTraceLabels = false;

const entries = [];

globalThis.DEBUG = false;

for (let i = 0; i < argv.length; i++) {
	const a = argv[i];
	if (a === "--out") {
		out = argv[++i];
		if (!out) usage();
		out = path.resolve(out);
	} 
	else if (a === "--isDebug") {
		globalThis.DEBUG = true;
	} 
	else if (a === "--discardComments") {
		discardComments = true;
	} 
	// else if (a === "--injectTraceLabels") {
	// 	injectTraceLabels = true;
	// } 
	else if (a === "--factory") {
		factory = argv[++i];
	} 
	else if (a === "-h" || a === "--help") {
		usage();
	} 
	else {
		entries.push(a);
	}
}


if (entries.length === 0) usage();

if (out) {
	let p = path.dirname(out);
	if(p!==".") {
		fs.mkdirSync(p, { recursive: true });
	}
}


for (const entry of entries) {
	const inputPath = path.resolve(entry);
	const code = fs.readFileSync(inputPath, "utf8");

	const result = transpileJSX(code,
								{ 
									path: inputPath,
									appendSourcemap: globalThis.DEBUG,
									factory, 
									//mappings: [], 
									//injectTraceLabels: injectTraceLabels,
									discardComments: discardComments
								}
	);

	let outFile;
	
	if (out) {
		outFile = out;
		fs.appendFileSync(outFile, result, "utf8");
	}
	else {
		outFile = inputPath + ".transpiled.js";
		fs.writeFileSync(outFile, result, "utf8");
	}

	console.log(`Preprocessed: ${inputPath} -> ${outFile}`);
}
