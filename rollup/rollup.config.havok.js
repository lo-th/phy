import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

function polyfills() {

	return {

		transform( code, filePath ) {

			if ( filePath.endsWith( 'src/Havok.js' ) || filePath.endsWith( 'src\\Havok.js' ) ) {

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
		input: 'src/Havok.js',
		plugins: [
			polyfills(),
			nodeResolve(),
			terser()
		],
		output: [
			{
				format: 'umd',
				name: 'HAVOK',
				file: 'build/Havok.min.js'
			}
		]
	},
	{
		input: 'src/Havok.js',
		plugins: [
		    terser()
		],
		output: [
			{
				format: 'esm',
				file: 'build/Havok.module.js'
			}
		]
	}
];