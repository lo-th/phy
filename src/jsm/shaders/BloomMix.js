/**
 * BloomMix shader
 */

const BloomMix = {

	uniforms: {

		'tDiffuse': { value: null },
		'bloomTexture': { value: null }

	},

	vertexShader: /* glsl */`

        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }`,

	fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;

        void main() {
            gl_FragColor = ( texture2D( tDiffuse, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
        }`

};

export { BloomMix };
