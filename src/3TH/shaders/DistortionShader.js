//import { Vector2 } from '../../../build/three.module.js';


/**
 * Distortion shader
 * based on Giliam de Carpentier's shader for lens distortion
 */

const DistortionShader = {

	uniforms: {

		'tDiffuse': { value: null },
        //'resolution': { value: new Vector2() },
		'strength': { value: 0 },
		'height': { value: 1 },
		'aspectRatio': { value: 1 },
		'cylindricalRatio': { value: 1 }

	},

	vertexShader: /* glsl */`

		uniform float strength;          // s: 0 = perspective, 1 = stereographic
        uniform float height;            // h: tan(verticalFOVInRadians / 2)
        uniform float aspectRatio;       // a: screenWidth / screenHeight
        uniform float cylindricalRatio;  // c: cylindrical distortion ratio. 1 = spherical

        varying vec3 vUV;                // output to interpolate over screen
        varying vec2 vUVDot;             // output to interpolate over screen

        void main() {

            gl_Position = projectionMatrix * (modelViewMatrix * vec4(position, 1.0));

            float scaledHeight = strength * height;
            float cylAspectRatio = aspectRatio * cylindricalRatio;
            float aspectDiagSq = aspectRatio * aspectRatio + 1.0;
            float diagSq = scaledHeight * scaledHeight * aspectDiagSq;
            vec2 signedUV = (2.0 * uv + vec2(-1.0, -1.0));

            float z = 0.5 * sqrt(diagSq + 1.0) + 0.5;
            float ny = (z - 1.0) / (cylAspectRatio * cylAspectRatio + 1.0);

            vUVDot = sqrt(ny) * vec2(cylAspectRatio, 1.0) * signedUV;
            vUV = vec3(0.5, 0.5, 1.0) * z + vec3(-0.5, -0.5, 0.0);
            vUV.xy += uv;
            
        }`,

	fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;      // sampler of rendered scene?s render target
        varying vec3 vUV;                // interpolated vertex output data
        varying vec2 vUVDot;             // interpolated vertex output data

        void main() {
            vec3 uv = dot(vUVDot, vUVDot) * vec3(-0.5, -0.5, -1.0) + vUV;
            gl_FragColor = texture2DProj(tDiffuse, uv);
        }`

};

export { DistortionShader };
