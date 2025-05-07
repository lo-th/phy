import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'private/Wiggle/src/Wiggle.js',
		external: ['three'],
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'src/libs/wiggle.module.js'
			}
		]
	}
];