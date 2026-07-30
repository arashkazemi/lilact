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

const path = require("path");
const esbuild = require("esbuild");

const { createLilactJsxPlugin } = require("../scripts/esbuild-preprocessor-plugin.cjs");


const licenseBanner = `/*!
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

--------------------------------------------------------------------------------

Lilact also includes the following libraries accessible as members of 
the Lilact object:

@emotion/css:
Copyright (c) Emotion team and other contributors
MIT License

redux:
Copyright (c) 2015-present Dan Abramov
MIT License


* MIT License Notice:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

--------------------------------------------------------------------------------

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
`;


function parseArgs(argv) {
	const args = {};
	for (let i = 2; i < argv.length; i++) {
		const k = argv[i];
		if (!k || !k.startsWith("--")) continue;
		const key = k.slice(2);

		if (key === "watch" || key === "minify") {
			args[key] = true;
			continue;
		}

		args[key] = argv[++i];
	}
	return args;
}

async function run() {
	const args = parseArgs(process.argv);

	const userProjectRoot = process.cwd();
	const userEntry = args.entry ? path.resolve(userProjectRoot, args.entry) : null;

	if (!userEntry) {
		console.error(
			"Usage: lilact-bundler --watch --minify --entry ./path/to/entry.js --mode production --out ./dist --name bundle.js"
			);
		process.exit(1);
	}

	const name = args.name ?? "bundle.js";
	const mode = args.mode ?? "production";
	const watch = args?.watch === true;
	const minify = args?.minify === true;

	const userOutDir = args.out
			? path.resolve(userProjectRoot, args.out)
			: path.resolve(userProjectRoot, "dist");

	const outFile = path.join(userOutDir, name);

	const define = {
		DEBUG: JSON.stringify(mode === "development"),
	};



	const logOnBuildPlugin = {
	  name: "log-on-build",
	  setup(build) {
	    build.onStart(() => {
	      console.log(`Rebuilt: ${outFile} (${new Date().toISOString()})`);
	    });
	  },
	};

	const ctx = await esbuild.context({
		entryPoints: [userEntry],
		bundle: true,
		format: "esm",
		platform: "browser",

		outfile: outFile,
		sourcemap: true,
		target: ["es2018"],

		minify: minify,
		define,

		absWorkingDir: userProjectRoot,

		resolveExtensions: [".js", ".jsx", ".json"],

		loader: {
			".js": "js",
			".jsx": "jsx",
			".css": "css",
		},

		plugins: [
			createLilactJsxPlugin({ mode }),
			logOnBuildPlugin
		],
	});

	const shutdown = async () => {
		try {
			await ctx.dispose();
		} finally {
			process.exit(0);
		}
	};

	const buildOpts = {
		entryPoints: [userEntry],
		bundle: true,
		format: "esm",
		platform: "browser",
		outfile: outFile,
		sourcemap: true,
		target: ["es2018"],
		minify: minify,
		define,
		loader: { ".js": "js", ".jsx": "jsx", ".css": "css" },
		resolveExtensions: [".js", ".jsx", ".json"],
		absWorkingDir: userProjectRoot,
		plugins: [createLilactJsxPlugin({ mode })],
  		banner: { js: licenseBanner },
	};

	if (watch) {
		await ctx.watch();
		console.log(`Watching... output: ${outFile}`);
	} else {
		await ctx.rebuild();
		await shutdown();
	}
	

	process.on("SIGINT", shutdown);
	process.on("SIGTERM", shutdown);
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
