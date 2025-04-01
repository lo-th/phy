//import buble from 'rollup-plugin-buble';
//import babel from '@rollup/plugin-babel';
//import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';


export default [
	{
		input: 'src/Phy.js',
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