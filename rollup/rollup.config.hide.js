import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Hide.js' ) || filePath.endsWith( 'src\\Hide.js' ) ) {

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
		input: 'src/Hide.js',
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'HIDE',
				file: 'build/Hide.min.js'
			}
		]
	},
	{
		input: 'src/Hide.js',
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'build/Hide.module.js'
			}
		]
	}
];