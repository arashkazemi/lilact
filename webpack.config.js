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

import path from 'path'

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

import fs from 'fs';
import 'webpack';



export default (env, argv) => {
	const mode = argv.mode || 'development';
	const minify = env?.minify==='true';
	
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = dirname(__filename);

	const filename = `lilact.${mode}${minify?'.min':''}.js`;

	return {
		entry: './src/lilact.jsx',
		mode,
		devtool: 'source-map',

		optimization: {
		    concatenateModules: true,      // scope hoisting
		    moduleIds: 'deterministic',   // smaller stable ids (or 'hashed')
		    minimize: minify,
		},
		experiments: {    
			outputModule: true           // enable module output  
		},
		ignoreWarnings: [{
			module: /jsx\.js/, // to silent the warning for requiring fs in jsx.js 
			message: /Module not found/,
		}],
		output: {
			filename,
			path: path.resolve(__dirname, 'dist'),
			library: {      
				type: 'module'             // important: emit an ES module   
			},
		},
		resolve: {
			// alias: {      
			// 	"react-is": false, 
			// },
			fallback: {
				// buffer: req.resolve('buffer/'),
			}
		},
		module: {
			rules: [{
					test: /\.js$/, // for the preprocessor
					exclude: /node_modules/,
					use: [{
						loader: './src/loader.cjs',
						options: {
							mode
						}
					}]
				},
				{
					test: /\.jsx$/,
					exclude: /node_modules/,
					use: [{
						loader: './src/loader.cjs',
						options: {
							mode
						}
					}]
				},
				{
					test: /\.css$/i,
					use: [
						{
							loader: "style-loader"
						},
						{
							loader: "css-loader",
							options: {
		                		// keeps behavior simple; you can enable modules if you want
								modules: false,
								importLoaders: 0
							}
						}
					]
				}
			]
		},
		plugins: [{
			apply: (compiler) => {
				compiler.hooks.done.tap('license-plugin', (compilation) => {
					fs.readFile('./dist/' + filename, 'utf8', function(err, jssc) {

						let out =
						`/*

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

--------------------------------------------------------------------------------

Lilact also includes the following libraries accessible as members of 
the Lilact object:

@emotion/css:
Copyright (c) Emotion team and other contributors
MIT License

prop-types:
Copyright (c) 2013-present, Facebook, Inc.
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
						${jssc}`;

						fs.writeFile('./dist/' + filename, out, {}, function() {});
						fs.writeFile('./root/' + filename, out, {}, function() {});
					});

				});
			}
		},
			//new webpack.ProvidePlugin({
			//Buffer: ['buffer', 'Buffer'],
			//   })
	]
}
};