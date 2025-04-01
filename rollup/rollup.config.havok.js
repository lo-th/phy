import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'src/Havok.js',
		output: [
			{
				format: 'umd',
				name: 'HAVOK',
				file: 'build/Havok.min.js',
				plugins: [terser()]
			},
			{
				format: 'esm',
				file: 'build/Havok.module.js',
				plugins: [terser()]
			}
		]
	}
];