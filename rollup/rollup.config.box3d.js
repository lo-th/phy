import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'src/Box3d.js',
		output: [
			{
				format: 'umd',
				name: 'BOX3D',
				file: 'build/Box3d.min.js',
				plugins: [terser()]
			},
			{
				format: 'esm',
				file: 'build/Box3d.module.js',
				plugins: [terser()]
			}
		]
	}
];