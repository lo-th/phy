import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'private/CodeFlask/src/CodeFlask.js',
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'src/libs/codeflask.module.js'
			}
		]
	}
];