import terser from '@rollup/plugin-terser';

export default [
	{
		input: 'src/Rapier.js',
		output: [
			{
				format: 'es',
				name: 'RAPIER',
				file: 'build/Rapier.min.js',
				plugins: [terser()]
			},
			{
				format: 'esm',
				file: 'build/Rapier.module.js',
				plugins: [terser()]
			}
		]
	}
];