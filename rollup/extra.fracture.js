import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'private/Fracture/src/Fracture.js',
		external: ['three'],
		plugins: [
			terser()
		],
		output: [
			{
				format: 'esm',
				file: 'src/libs/fracture.module.js'
			}
		]
	}
];