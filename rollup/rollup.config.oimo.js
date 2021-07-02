import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';


function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Oimo.js' ) || filePath.endsWith( 'src\\Oimo.js' ) ) {

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
		input: 'src/Oimo.js',
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'OIMO',
				file: 'build/Oimo.min.js'
			}
		]
	},
	{
		input: 'src/Oimo.js',
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'build/Oimo.module.js'
			}
		]
	}
];