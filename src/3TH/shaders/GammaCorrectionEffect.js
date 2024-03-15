import { Uniform } from "three"
import { BlendFunction, Effect } from "../../libs/postprocessing.js"

const fragmentShader = /* glsl */ `
uniform float gamma;

vec4 GammaCorrectionEffect_LinearToGamma( in vec4 value, in float gammaFactor ) {
    return vec4( pow( value.rgb, vec3( 1.0 / gammaFactor ) ), value.a );
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

	outputColor = GammaCorrectionEffect_LinearToGamma(max(inputColor, 0.0), gamma);

}
`

export class GammaCorrectionEffect extends Effect {
	/**
	 * Constructs a new gamma correction effect.
	 *
	 * @param {Object} [options] - The options.
	 * @param {BlendFunction} [options.blendFunction=BlendFunction.NORMAL] - The blend function of this effect.
	 * @param {Number} [options.gamma=2.0] - The gamma factor.
	 */

	constructor({ blendFunction = BlendFunction.NORMAL, gamma = 2.0 } = {}) {
		super("GammaCorrectionEffect", fragmentShader, {
			blendFunction,
			uniforms: new Map([["gamma", new Uniform(gamma)]])
		})
	}
}
