import {
	Color, MeshPhysicalMaterial, ShaderChunk
} from 'three';

/**
 * ------------------------------------------------------------------------------------------
 * Subsurface Scattering shader
 * Based on GDC 2011 – Approximating Translucency for a Fast, Cheap and Convincing Subsurface Scattering Look
 * https://colinbarrebrisebois.com/2011/03/07/gdc-2011-approximating-translucency-for-a-fast-cheap-and-convincing-subsurface-scattering-look/
 *------------------------------------------------------------------------------------------
 */

class MeshSssMaterial extends MeshPhysicalMaterial {

	constructor( parameters ) {

		super();

		this.defines = {

			'STANDARD': '',
			'PHYSICAL': '',
			'SUBSURFACE': '',
			'USE_UV': '',

		};

		this.extra = {};

		this.addParametre( 'sssMap', null );
		this.addParametre( 'sssColor', new Color( 0,0,0 ) );
		this.addParametre( 'sssAmbient', 0.5 );
		this.addParametre( 'sssDistortion', 0.6 );
		this.addParametre( 'sssAttenuation', 0.1 );
		this.addParametre( 'sssPower', 1.0 );
		this.addParametre( 'sssScale', 6.0 );
		
		this.setValues( parameters );

		let self = this;

        self.onBeforeCompile = function ( shader ) {
        	for(let name in self.extra ) {
				shader.uniforms[ name ] = { value: self.extra[name] };
			}

			shader.fragmentShader = shader.fragmentShader.replace( '#include <common>', shaderChange.common );
			shader.fragmentShader = shader.fragmentShader.replace( '#include <lights_fragment_begin>', 
				self.replaceAll(
					ShaderChunk[ 'lights_fragment_begin' ],
					'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
					shaderChange.light
				)
			);

			self.userData.shader = shader;
        }

	}

	addParametre( name, value ){

		this.extra[ name ] = value;

		Object.defineProperty( this, name, {
			get: () => ( this.extra[ name ] ),
			set: ( v ) => {
				this.extra[ name ] = v;
				if( this.userData.shader ) this.userData.shader.uniforms[name].value = this.extra[ name ];
			}
		});
	}

	replaceAll( string, find, replace ) {

		return string.split( find ).join( replace );

	}

	/*customProgramCacheKey(){

		return self

	} */

	/*onBeforeCompile( shader ){

		for(let name in this.extra ) {
			shader.uniforms[ name ] = { value: this.extra[name] };
		}

		shader.fragmentShader = shader.fragmentShader.replace( '#include <common>', shaderChange.common );
		shader.fragmentShader = shader.fragmentShader.replace( '#include <lights_fragment_begin>', 
			this.replaceAll(
				THREE.ShaderChunk[ 'lights_fragment_begin' ],
				'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
				shaderChange.light
			)
		);

		this.userData.shader = shader;

	}*/

}

const shaderChange = {

	common : /* glsl */`
	#include <common>
	uniform sampler2D sssMap;
	uniform float sssPower;
	uniform float sssScale;
	uniform float sssDistortion;
	uniform float sssAmbient;
	uniform float sssAttenuation;
	uniform vec3 sssColor;

	void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
		vec3 thickness = sssColor * texture2D(sssMap, uv).r;
		vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * sssDistortion));
		float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), sssPower) * sssScale;
		vec3 scatteringIllu = (scatteringDot + sssAmbient) * thickness;
		reflectedLight.directDiffuse += scatteringIllu * sssAttenuation * directLight.color;
	}
	`,
	light : /* glsl */`
	RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	#if defined( SUBSURFACE ) && defined( USE_UV )
		RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);
	#endif
	`
}

export { MeshSssMaterial };