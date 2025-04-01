import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'src/Physx.js',
		output: [
			{
				format: 'umd',
				name: 'PHYSX',
				file: 'build/Physx.min.js',
				plugins: [terser()]
			},
			{
				format: 'esm',
				file: 'build/Physx.module.js',
				plugins: [terser()]
			}
		]
	}
];