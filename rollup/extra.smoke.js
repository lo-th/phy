import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'private/Smoke/src/Smoke.js',
		external: ['three'],
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'src/libs/smoke.module.js'
			}
		]
	}
];