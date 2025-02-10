import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';


function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Cannon.js' ) || filePath.endsWith( 'src\\Cannon.js' ) ) {

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
		input: 'src/Cannon.js',
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'CANNON3D',
				file: 'build/Cannon.min.js'
			}
		]
	},
	{
		input: 'src/Cannon.js',
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'build/Cannon.module.js'
			}
		]
	}
];