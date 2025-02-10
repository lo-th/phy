import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Ammo.js' ) || filePath.endsWith( 'src\\Ammo.js' ) ) {

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
		input: 'src/Ammo.js',
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'AMMO',
				file: 'build/Ammo.min.js'
			}
		]
	},
	{
		input: 'src/Ammo.js',
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'build/Ammo.module.js'
			}
		]
	}
];