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
const webpack = require("webpack");


function parseArgs(argv) {
	// Simple args:
	// bundler --entry ./src/index.js --out ./dist/bundle
	const args = {};
	for (let i = 2; i < argv.length; i++) {
		const k = argv[i];
		if (!k.startsWith("--")) continue;
		const key = k.slice(2);
		const v = argv[i + 1];
		i++;
		args[key] = v;
	}
	return args;
}

async function run() {
	const args = parseArgs(process.argv);

	const userProjectRoot = process.cwd(); // MUST be user's project root
	const userEntry = args.entry
		? path.resolve(userProjectRoot, args.entry)
		: null;

	if (!userEntry) {
		console.error("Usage: lilact-bundler --entry ./path/to/entry.js --mode production --out ./dist/out --name bundle.js");
		process.exit(1);
	}

	const name = args.name ?? "bundle.js";
	const mode = args.mode ?? "production";

	// Locate lilact root reliably (where this CLI is installed)
	const lilactRoot = path.dirname(require.resolve("lilact/package.json"));

	// Load config factory from your package
	const configFactoryPath = path.join(lilactRoot, "webpack.config.factory.cjs");
	const configFactory = require(configFactoryPath);

	const userOutDir = args.out
		? path.resolve(userProjectRoot, args.out)
		: path.resolve(userProjectRoot, "dist");

	// Build config using a factory, then override resolution for user's project
	const baseConfig = configFactory({
		entry: userEntry,
		outputPath: userOutDir,
		userProjectRoot,
		mode, name
	});

	// ---- Critical: ensure resolution happens from user's project ----
	baseConfig.context = userProjectRoot;
	baseConfig.resolve = baseConfig.resolve || {};
	baseConfig.resolve.modules = [
		path.join(userProjectRoot, "node_modules"),
		"node_modules"
	];

	const compiler = webpack(baseConfig);

	compiler.run((err, stats) => {
		// webpack keeps resources; close when available
		compiler.close(() => {});

		if (err) {
			console.error(err);
			process.exit(1);
		}

		if (stats?.hasErrors?.()) {
			console.error(stats.toString("errors-only"));
			process.exit(1);
		}

		console.log(
			stats?.toString?.({
				colors: true,
				chunks: false
			}) || "Build finished."
		);
	});
}

run().catch((e) => {
	console.error(e);
	process.exit(1);
});
