import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'private/BvhLab/src/BvhLab.js',
		external: ['three'],
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'src/libs/bvhlab.module.js'
			}
		]
	}
];