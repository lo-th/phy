//import buble from 'rollup-plugin-buble';
//import babel from '@rollup/plugin-babel';
//import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import MagicString from 'magic-string';

function header() {

	return {

		renderChunk( code ) {

			code = new MagicString( code );

			code.prepend( `/**
 * @license
 * Copyright 2010-2025 Phy.js Authors
 * SPDX-License-Identifier: MIT
 */\n` );

			return {
				code: code.toString(),
				map: code.generateMap()
			};

		}

	};

}


export default [
	{
		input: 'src/Phy.js',
		plugins: [
			header()
		],
		preserveEntrySignatures: 'allow-extension',
		external: ['three'],
		output: [
			{
				format: 'umd',
				globals: {
		          three: 'THREE'
		        },
				name: 'PHY',
				file: 'build/Phy.min.js',
				plugins: [terser()]
			},
			{
				format: 'esm',
				file: 'build/Phy.module.js'
			},
			{
				format: 'esm',
				file: 'build/Phy.module.min.js',
				plugins: [terser()]
			},
			{
				format: 'cjs',
				name: 'PHY',
				file: 'build/Phy.cjs',
				indent: '\t'
			}
		]
	}
];