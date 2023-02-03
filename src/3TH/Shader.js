import {
    ShaderChunk, DoubleSide, RGBAFormat, sRGBEncoding
} from 'three';

/** __
*    _)_|_|_
*   __) |_| | 2022
* @author lo.th / https://github.com/lo-th
*/

let isGL2 = true;
//let mode = ''

//const mats = {}

export const materials = new Map()

//const names = new Map()

const defines = {}

const uniforms = {

	renderMode: { value: 2 },
    depthPacking: { value: 1 },

	time: { value: 0.0 },

	shadow: { value: 0.25 },
    shadowLuma: { value: 0 },
    shadowContrast: { value: 1 },
    shadowGamma: { value: 0.25 },
	//shadowAlpha: { value: 1.0 }

    lightSizeUV: { value: 1.3 },
    nearPlane: { value: 9.5 },
    rings:{ value: 11 },
    nSample:{ value: 17 },
    noiseIntensity:{ value: 1 },
    softness:{ value: 3 },
    
};


export class Shader {

    static setGl2 ( b ) { isGL2 = b }
    static getGl2 ( b ) { return isGL2 }

	static init ( o = {} ) {

        // Set CustomToneMapping to Uncharted2
        // source: http://filmicworlds.com/blog/filmic-tonemapping-operators/

        ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
            'vec3 CustomToneMapping( vec3 color ) { return color; }',
            `#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )
            float toneMappingWhitePoint = 1.0;
            vec3 CustomToneMapping( vec3 color ) {
                color *= toneMappingExposure;
                return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );
            }`
        );

        let activeShadowPCSS = true

        //mode = o.mode

        //if( mode === 'LOW' ) return

        let s

        this.up( o )

        if( activeShadowPCSS ) {

            //defines['NUM_SAMPLES'] = 17
            //defines['NUM_RINGS'] = 11

            s = ShaderChunk.shadowmap_pars_fragment

            s = s.replace(
                '#ifdef USE_SHADOWMAP', shadowPCSS
            )

            s = s.replace(//BasicShadowMap
                'shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );',`
                return PCSS( shadowMap, shadowCoord );
            `)

            /*s = s.replace(
                '#if defined( SHADOWMAP_TYPE_PCF )',`
                return PCSS( shadowMap, shadowCoord );
                #if defined( SHADOWMAP_TYPE_PCF )
            `)*/

            ShaderChunk.shadowmap_pars_fragment = s

        }

		//return;

		s = ShaderChunk.common;
        s = s.replace( '#define EPSILON 1e-6', `
        	#define EPSILON 1e-6
        	uniform float shadow;
            uniform float shadowLuma;
            uniform float shadowContrast;
            uniform float shadowGamma;

            uniform int renderMode;
            uniform int depthPacking;

            varying vec2 vZW;

            float shadowValue = 1.0;
            float shadowTmp = 1.0;
            vec3 shadowColor = vec3(1.0);

            
            /*
            float color_distance( vec3 a, vec3 b){
                vec3 s = vec3( a - b );
                float dist = sqrt( s.r * s.r + s.g * s.g + s.b * s.b );
                return clamp(dist, 0.0, 1.0);
            }

            vec3 rgb2hsv(vec3 c){
                vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
                vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

                float d = q.x - min(q.w, q.y);
                float e = 1.0e-10;
                return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            }

            vec3 hsv2rgb(vec3 c){
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            vec3 brightnessContrastCorrection(vec3 value, float brightness, float contrast){
                return (value - 0.5) * contrast + 0.5 + brightness;
            }

            vec3 GammaCorrection(vec3 value, float param){
                return vec3(pow(abs(value.r), param),pow(abs(value.g), param),pow(abs(value.b), param));
            }
            */

        `);

        ShaderChunk.common = s;


        /**/

        s = ShaderChunk.fog_vertex;

        s = s.replace( '#ifdef USE_FOG', `
            vZW = gl_Position.zw;
            #ifdef USE_FOG
        `);

        ShaderChunk.fog_vertex = s;


        

        

        s = ShaderChunk.lights_fragment_begin;
/*
        // point
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;', `
        	shadowTmp = 1.0;
        	shadowTmp *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
        	//directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)

        // spot
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;', `
            shadowTmp = 1.0;
        	shadowTmp *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
        	//directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)

        // direct
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;', `
            shadowTmp = 1.0;
            shadowTmp *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
            //directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)*/

        // point
        s = s.replace( 'directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;', `
            shadowTmp = 1.0;
            shadowTmp *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;;
            //directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)

        // spot
        s = s.replace( 'directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;', `
            shadowTmp = 1.0;
            shadowTmp *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
            //directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)

        s = s.replace( 'directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;', `
            shadowTmp = 1.0;
            shadowTmp *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
            //directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)

        ShaderChunk.lights_fragment_begin = s;

       /* s = ShaderChunk.tonemapping_fragment;

        s = s.replace( '#if defined( TONE_MAPPING )', `
            #if defined( USE_SHADOWMAP )
            gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * shadowR, Shadow);
            #endif

            #if defined( TONE_MAPPING )
        `);

        ShaderChunk.tonemapping_fragment = s;*/


        //s = ShaderChunk.fog_fragment;
        s = ShaderChunk.output_fragment;



        //s = s.replace( '#ifndef saturate', `
        //s = ShaderChunk.tonemapping_fragment;

        s = s.replace( 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );', `

            gl_FragColor = vec4( outgoingLight, diffuseColor.a );

        	#if defined( USE_SHADOWMAP )

            shadowValue = (shadowValue - 0.5) * shadowContrast + 0.5 + shadowLuma;
            shadowValue = pow(abs(shadowValue), shadowGamma );
            shadowValue = clamp( shadowValue, 0.0, 1.0 );

            shadowColor = vec3( shadowValue );




            
            /*
            vec3 invColor = vec3(1.0 - gl_FragColor.rgb);
            vec3 cc = rgb2hsv( invColor );
            cc.r += 0.1; // teint
            cc.g *= 1.0; // saturation
            cc.b *= 0.5; // luma
            invColor = hsv2rgb( cc );

            shadowColor = shadowColor + invColor;
            shadowColor = clamp( shadowColor, 0.0, 1.0 );
            */
            


            //gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * shadowColor, (1.0-shadowValue) * shadow );

            gl_FragColor.rgb *= ((1.0-shadowValue) * (1.0-shadow)) + shadowColor;


        	#endif
            
        `);

        //ShaderChunk.fog_fragment = s;
        ShaderChunk.output_fragment = s

      //  ShaderChunk.tonemapping_fragment = s;


        //console.log('shadow modif on')

        s = ShaderChunk.dithering_fragment;

        s = s.replace( '#endif', `

            #endif

            #ifdef STANDARD

            if( renderMode == 1 ){ 
                float fz = 0.5 * vZW[0] / vZW[1] + 0.5;
                gl_FragColor = depthPacking == 1 ? packDepthToRGBA( fz ) : vec4( vec3( 1.0 - fz ), opacity );// depth render
            }
            if( renderMode == 2 ) gl_FragColor = vec4(  packNormalToRGB( normal ), opacity );// normal render
            if( renderMode == 3 ) gl_FragColor = vec4(  shadowColor, opacity );// normal render

            #else

            if( renderMode != 0 ) discard;

            #endif

        `);

        ShaderChunk.dithering_fragment = s;



        s = ShaderChunk.color_vertex;
        s = s.replace( 'vColor.xyz *= instanceColor.xyz;', `vColor.xyz = instanceColor.xyz;`);
        ShaderChunk.color_vertex = s;






		//this.shaders=[];
		//this.uniforms = {};

	}

    static add ( m ) {

        //mats[m.name] = m
        let name = m.name;
        if ( materials.has( name ) ) { 
            //console.log('already add', name)
            return 
        }
       // else console.log('add', name)
        materials.set( name, true )
        
        m.shadowSide = DoubleSide;


        //m.format = sRGBEncoding;
        if(!m.isEncod){
            if( m.map ) m.map.encoding = sRGBEncoding
            m.color.convertSRGBToLinear()
            m.isEncod = true
        }

        m.onBeforeCompile = function ( shader ) {
            Shader.modify( shader );
        }

        /*if(!m.defines){ 
            m.defines = defines
        } else {
            Shader.setDefines( m )
        }*/
         //

    } 

    static refresh () {

      /* console.log( 'refresh', materials )

        materials.forEach( (value, key)=>{


            //console.log( value, key )



            value.needsUpdate = true 

        })*/
    }

    static setDefines ( m ) {
        
        //for( var o in defines ) m.defines[o] = defines[o]

        //if(!mats[m.name]) mats[m.name] = m

       // console.log(m.name)

    }


    static modify ( s ) {

       // if( mode === 'LOW' ) return

       //shaders.push( s );
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

        //if( mode === 'LOW' ) return

        for( let n in o ){

            if( uniforms[n] ){ 
                if( uniforms[n].value.isColor ) uniforms[n].value.setHex( o[n] );
                else uniforms[n].value = o[n];

            }

            /*if( defines[n] ){

                for( let m in mats ){ 
                    console.log(m)
                    mats[m].defines[n] = o[n]
                }

            }*/
            

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

    static reset (){
        materials.clear()
    }

}



const shadowPCSS = `
#ifdef USE_SHADOWMAP

uniform float lightSizeUV;
uniform float nearPlane;
uniform float rings;
uniform int nSample;
uniform float noiseIntensity;
uniform float softness;

//#define LIGHT_WORLD_SIZE 0.005
//#define LIGHT_FRUSTUM_WIDTH 3.75
//#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
//#define NEAR_PLANE 9.5

#define NUM_SAMPLES 17

vec2 poissonDisk[32];

void initPoissonSamples( const in vec2 randomSeed ) {

    int numSample = nSample;

    float ANGLE_STEP = PI2 * rings / float( numSample );
    float INV_NUM_SAMPLES = 1.0 / float( numSample );

    // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
    float angle = rand( randomSeed ) * PI2 * noiseIntensity;
    float radius = INV_NUM_SAMPLES;
    float radiusStep = radius;

    for( int i = 0; i < numSample; i ++ ) {
        poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
        radius += radiusStep;
        angle += ANGLE_STEP;
    }
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
    return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver, float ls ) {

    // This uses similar triangles to compute what
    // area of the shadow map we should search
    float searchRadius = ls * ( zReceiver - nearPlane ) / zReceiver;
    float blockerDepthSum = 0.0;
    int numBlockers = 0;
    int numSample = nSample;
    float shadowMapDepth = 0.0;

    for( int i = 0; i < numSample; i++ ) {
        shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
        if ( shadowMapDepth < zReceiver ) {
            blockerDepthSum += shadowMapDepth;
            numBlockers ++;
        }
    }

    if( numBlockers == 0 ) return -1.0;

    return blockerDepthSum / float( numBlockers );

}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {
    
    /*int numSample = nSample;
    float sum = 0.0;
    float depth;
    #pragma unroll_loop_start
    for( int i = 0; i < 17; i ++ ) {
        depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
        if( zReceiver <= depth ) sum += 1.0;
    }
    #pragma unroll_loop_end
    #pragma unroll_loop_start
    for( int i = 0; i < 17; i ++ ) {
        depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
        if( zReceiver <= depth ) sum += 1.0;
    }
    #pragma unroll_loop_end
    return sum / ( 2.0 * float( 17 ) );*/

    int numSample = nSample;
    float sum = 0.0;
    float top = 0.0;
    float low = 0.0;
    #pragma unroll_loop_start
    for( int i = 0; i < 17; i ++ ) {
        top = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
        low = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
        if( zReceiver <= top ) sum += 1.0;
        if( zReceiver <= low ) sum += 1.0;
    }
    #pragma unroll_loop_end
    return sum / ( 2.0 * float( 17 ) );
}

float PCSS ( sampler2D shadowMap, vec4 coords ) {

    vec2 uv = coords.xy;
    float zReceiver = coords.z; // Assumed to be eye-space z in this code
    //float lightSizeUV = LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH;

    float ls = lightSizeUV * 0.001;

    initPoissonSamples( uv );
    // STEP 1: blocker search
    float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver, ls );

    //There are no occluders so early out (this saves filtering)
    if( avgBlockerDepth == -1.0 ) return 1.0;

    // STEP 2: penumbra size
    float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );
    float filterRadius = penumbraRatio * ls * nearPlane / zReceiver;

    // STEP 3: filtering
    //return avgBlockerDepth;
    return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );
}
`