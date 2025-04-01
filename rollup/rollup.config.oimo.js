import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'src/Oimo.js',
		output: [
			{
				format: 'umd',
				name: 'OIMO',
				file: 'build/Oimo.min.js',
				plugins: [terser()]
			},
			{
				format: 'esm',
				file: 'build/Oimo.module.js',
				plugins: [terser()]
			}
		]
	}
];