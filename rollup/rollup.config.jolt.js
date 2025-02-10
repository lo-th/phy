import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Jolt.js' ) || filePath.endsWith( 'src\\Jolt.js' ) ) {

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
		input: 'src/Jolt.js',
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'JOLT',
				file: 'build/Jolt.min.js'
			}
		]
	},
	{
		input: 'src/Jolt.js',
		plugins: [
		polyfills(),
		nodeResolve(),
		terser()
		],
		output: [
			{
				format: 'esm',
				file: 'build/Jolt.module.js'
			}
		]
	}
];