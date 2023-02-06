//import buble from 'rollup-plugin-buble';
//import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Phy.js' ) || filePath.endsWith( 'src\\Phy.js' ) ) {

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
		input: 'src/Phy.js',
		external: ['three'],
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'phy',
				file: 'build/Phy.min.js'
			}
		]
	},
	{
		input: 'src/Phy.js',
		external: ['three'],
		plugins: [
		],
		output: [
			{
				format: 'esm',
				file: 'build/Phy.module.js'
			}
		]
	}
];