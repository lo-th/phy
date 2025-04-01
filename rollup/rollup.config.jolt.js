import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'src/Jolt.js',
		output: [
			{
				format: 'umd',
				name: 'JOLT',
				file: 'build/Jolt.min.js',
				plugins: [terser()]
			},
			{
				format: 'esm',
				file: 'build/Jolt.module.js',
				plugins: [terser()]
			}
		]
	}
];
