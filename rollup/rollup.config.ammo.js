import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'src/Ammo.js',
		output: [
			{
				format: 'umd',
				name: 'AMMO',
				file: 'build/Ammo.min.js',
				plugins: [terser()]
			},
			{
				format: 'esm',
				file: 'build/Ammo.module.js',
				plugins: [terser()]
			}
		]
	}
];