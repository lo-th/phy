import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Smoke.js' ) || filePath.endsWith( 'src\\Smoke.js' ) ) {

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
		input: 'src/Smoke.js',
		external: ['three'],
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'Smoke',
				file: 'build/smoke.min.js'
			}
		]
	},
	{
		input: 'src/Smoke.js',
		external: ['three'],
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'build/smoke.module.js'
			}
		]
	}
];