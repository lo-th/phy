//import buble from 'rollup-plugin-buble';
//import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Main.js' ) || filePath.endsWith( 'src\\Main.js' ) ) {

				code = 'import \'regenerator-runtime\';\n' + code;

			}

			return {
				code: code,
				map: null
			};

		}

	};

}

export default [
	{
		input: 'src/Main.js',
		external: ['three'],
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'Main',
				file: 'build/Main.min.js'
			}
		]
	},
	{
		input: 'src/Main.js',
		external: ['three'],
		plugins: [
		],
		output: [
			{
				format: 'esm',
				file: 'build/Main.module.js'
			}
		]
	}
];