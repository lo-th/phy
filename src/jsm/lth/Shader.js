import {
    ShaderChunk,DoubleSide,RGBAFormat
} from '../../../build/three.module.js';


const shaders = [];

let isGL2 = true;

const uniforms = {

	renderMode: { value: 2 },
    depthPacking: { value: 0 },

	time: { value: 0.0 },

	Shadow: { value: 0.25 },
    ShadowLuma: { value: 0 },
    ShadowContrast: { value: 1 },
    ShadowGamma: { value: 0.25 },
	//shadowAlpha: { value: 1.0 }
};


export class Shader {

    static setGl2 ( b ) { isGL2 = b; }
    static getGl2 ( b ) { return isGL2; }

	static init ( o = {} ) {

        this.up( o );

        //if( o.shadow ) uniforms.Shadow.value = o.shadow;

		//return;

		let s = ShaderChunk.common;
        s = s.replace( '#define EPSILON 1e-6', `
        	#define EPSILON 1e-6
        	uniform float Shadow;
            uniform float ShadowLuma;
            uniform float ShadowContrast;
            uniform float ShadowGamma;

            uniform int renderMode;
            uniform int depthPacking;

            varying vec2 vZW;


            vec3 brightnessContrastCorrection(vec3 value, float brightness, float contrast){
                return (value - 0.5) * contrast + 0.5 + brightness;
            }

            vec3 GammaCorrection(vec3 value, float param){
                return vec3(pow(abs(value.r), param),pow(abs(value.g), param),pow(abs(value.b), param));
            }

        `);

        ShaderChunk.common = s;


        /**/

        s = ShaderChunk.fog_vertex;

        s = s.replace( '#ifdef USE_FOG', `
            vZW = gl_Position.zw;
            #ifdef USE_FOG
        `);

        ShaderChunk.fog_vertex = s;


        

        //THREE.ShaderChunk.lights_fragment_begin = s;


        s = ShaderChunk.clipping_planes_fragment;

        s = s.replace( '#if NUM_CLIPPING_PLANES > 0', `
        	vec3 shadowR = vec3(1.0);
            vec3 shadowF = vec3(1.0);


        	#if NUM_CLIPPING_PLANES > 0
        `);

        ShaderChunk.clipping_planes_fragment = s;




        

        s = ShaderChunk.lights_fragment_begin;

        s = s.replace( 'IncidentLight directLight;', `
        	
            //vec3 shadowR = vec3(1.0);

        	IncidentLight directLight;
        `);

        // point
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;', `
        	shadowR = vec3(1.0);
        	shadowR *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
        	directLight.color *= shadowR;
            shadowF *= shadowR;
        `);

        // spot
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;', `
            shadowR = vec3(1.0);
        	shadowR *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
        	directLight.color *= shadowR;
            shadowF *= shadowR;
        `);

        // direct
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;', `
            shadowR = vec3(1.0);
        	shadowR *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
        	directLight.color *= shadowR;
            shadowF *= shadowR;
        `);

        

        ShaderChunk.lights_fragment_begin = s;

       /* s = THREE.ShaderChunk.tonemapping_fragment;

        s = s.replace( '#if defined( TONE_MAPPING )', `
            #if defined( USE_SHADOWMAP )
            gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * shadowR, Shadow);
            #endif

            #if defined( TONE_MAPPING )
        `);

        THREE.ShaderChunk.tonemapping_fragment = s;*/


        s = ShaderChunk.fog_fragment;

        s = s.replace( '#ifdef USE_FOG', `

        	#if defined( USE_SHADOWMAP )
            shadowF = brightnessContrastCorrection( shadowF, ShadowLuma, ShadowContrast );
            shadowF = GammaCorrection( shadowF, ShadowGamma );

            shadowF = clamp( shadowF, 0.0, 1.0 );

            //gl_FragColor *= vec4( shad, Shadow );
        	gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * shadowF.rgb, Shadow );
        	#endif

        	#ifdef USE_FOG
        `);

        ShaderChunk.fog_fragment = s;


        //console.log('shadow modif on')

        s = THREE.ShaderChunk.dithering_fragment;

        s = s.replace( '#endif', `

            #endif

            #ifdef STANDARD

            if( renderMode == 1 ){ 
                float fz = 0.5 * vZW[0] / vZW[1] + 0.5;
                gl_FragColor = depthPacking == 1 ? packDepthToRGBA( fz ) : vec4( vec3( 1.0 - fz ), opacity );// depth render
            }
            if( renderMode == 2 ) gl_FragColor = vec4(  packNormalToRGB( normal ), opacity );// normal render
            if( renderMode == 3 ) gl_FragColor = vec4(  shadowF, opacity );// normal render

            #else

            if( renderMode != 0 ) discard;

            #endif

        `);

        THREE.ShaderChunk.dithering_fragment = s;






		//this.shaders=[];
		//this.uniforms = {};

	}

    static add ( m ) {
        
        m.shadowSide = DoubleSide;

        m.onBeforeCompile = function ( shader ) {
            Shader.modify( shader );
        }// Shader.modify;

        //console.log(m)
    }


    static modify ( s ) {

       shaders.push( s );
       // apply global uniform
       for( let n in uniforms ){

       	    s.uniforms[n] = uniforms[n];

       }

       // start add

       /*let fragment = s.fragmentShader;

        fragment.replace( 'vec4 diffuseColor = vec4( diffuse, opacity );', `
            vec4 diffuseColor = vec4( diffuse, opacity );
            vec3 shadowR = vec3(1.0);
        `);
        s.fragmentShader = fragment;*/

    }

    static up ( o ) {

        for( let n in o ){

            if( uniforms[n] ){ 
                if( uniforms[n].value.isColor ) uniforms[n].value.setHex( o[n] );
                else uniforms[n].value = o[n];

            }
        }

    	/*for ( let s of shaders ){

    		for( let n in o ){

    			if( s.uniforms[n] ){ 
                    if( s.uniforms[n].value.isColor ) s.uniforms[n].value.setHex( o[n] );
                    else s.uniforms[n].value = o[n];

                }
    		}

    	}*/

    }

}



