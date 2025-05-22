import {
	Vector3
} from 'three';

/**
 * @module ColorCorrectionShader
 * @three_import import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
 */

/**
 * Color correction shader.
 *
 * @constant
 * @type {ShaderMaterial~Shader}
 *  Brightness: -1 to 1 (-1 is solid black, 0 is no change, and 1 is solid white)
 * Contrast: -1 to 1 (-1 is solid gray, 0 is no change, and 1 is maximum contrast)
 */
const CorrectionShader = {

	name: 'CorrectionShader',

	uniforms: {

		'tDiffuse': { value: null },
		'powRGB': { value: new Vector3( 2, 2, 2 ) },
		'mulRGB': { value: new Vector3( 1, 1, 1 ) },
		'addRGB': { value: new Vector3( 0, 0, 0 ) },
		'brightness': { value: 0 },
		'contrast': { value: 0 },
		'exposure': { value: 1.0 }

	},

	vertexShader: /* glsl */`

		varying vec2 vUv;

		void main() {

			vUv = uv;
			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

		}`,

	fragmentShader: /* glsl */`

		uniform sampler2D tDiffuse;
		uniform vec3 powRGB;
		uniform vec3 mulRGB;
		uniform vec3 addRGB;
		uniform float brightness;
		uniform float contrast;

		varying vec2 vUv;

		const float LuminancePreservationFactor = 1.0;
		const float PI2 = 6.2831853071;

		// Valid from 1000 to 40000 K (and additionally 0 for pure full white)https://www.shadertoy.com/view/4sc3D7
		/*vec3 colorTemperatureToRGB(const in float temperature){
		    // Values from: http://blenderartists.org/forum/showthread.php?270332-OSL-Goodness&p=2268693&viewfull=1#post2268693   
		    mat3 m = (temperature <= 6500.0) ? 
		        mat3(vec3(0.0, -2902.1955373783176, -8257.7997278925690),vec3(0.0, 1669.5803561666639, 2575.2827530017594),vec3(1.0, 1.3302673723350029, 1.8993753891711275)) : 
			 	mat3(vec3(1745.0425298314172, 1216.6168361476490, -8257.7997278925690),vec3(-2666.3474220535695, -2173.1012343082230, 2575.2827530017594),vec3(0.55995389139931482, 0.70381203140554553, 1.8993753891711275)); 
		    return mix(clamp(vec3(m[0] / (vec3(clamp(temperature, 1000.0, 40000.0)) + m[1]) + m[2]), vec3(0.0), vec3(1.0)), vec3(1.0), smoothstep(1000.0, 0.0, temperature));
		}*/

		void main() {

			gl_FragColor = texture2D( tDiffuse, vUv );

			// color correction
			gl_FragColor.rgb = mulRGB * pow( ( gl_FragColor.rgb + addRGB ), powRGB );

			// saturation / brightness
			gl_FragColor.rgb += brightness;
			if (contrast > 0.0) {
				gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) / (1.0 - contrast) + 0.5;
			} else {
				gl_FragColor.rgb = (gl_FragColor.rgb - 0.5) * (1.0 + contrast) + 0.5;
			}

			// exposure
			gl_FragColor.rgb *= exposure;

			// gamma correction
			gl_FragColor = sRGBTransferOETF( tex );

		}`

};

export { ColorCorrectionShader };