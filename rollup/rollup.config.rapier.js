import { nodeResolve } from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Rapier.js' ) || filePath.endsWith( 'src\\Rapier.js' ) ) {

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
		input: 'src/Rapier.js',
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'RAPIER3D',
				file: 'build/Rapier.min.js'
			}
		]
	},
	{
		input: 'src/Rapier.js',
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'build/Rapier.module.js'
			}
		]
	}
];