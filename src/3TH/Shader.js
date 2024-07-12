import {
    ShaderChunk, DoubleSide, SRGBColorSpace
} from 'three';

/** __
*    _)_|_|_
*   __) |_| | 2022
* @author lo.th / https://github.com/lo-th
*/

let isGL2 = true;
let isInit = false;
const EnhanceLighting = true

let renderer = null
//let mode = ''

//const mats = {}

export const materials = new Map()

//const names = new Map()

const defines = {}

const uniforms = {

	renderMode: { value: 0 },
    fogMode: { value: 1 },
    depthPacking: { value: 1 },

	time: { value: 0.0 },

	shadow: { value: 0.5 },
    shadowGamma: { value: 0.25 },//1
    shadowLuma: { value: 0 },//0.75
    shadowContrast: { value: 1 },//2.5
    
	//shadowAlpha: { value: 1.0 }

    lightSizeUV: { value: 1 },//3
    nearPlane: { value: 1 },//9.5
    rings:{ value: 4 },//11
    nSample:{ value: 16 },//17
    
    noiseIntensity:{ value: 1 },
    softness:{ value: 1.6 },

    noiseMap:{ value: null },
    useNoiseMap:{ value: 0 },

    
};


export class Shader {

    get renderer() { return renderer; }
    set renderer( r ) { renderer = r }

    static setGl2 ( b ) { isGL2 = b }
    static getGl2 ( b ) { return isGL2 }

    static setting () {
        return uniforms
    }

    static getRandomUv(){
        return randomUV;
    }

    static addParsFragment( s, adds ){
        s.fragmentShader = s.fragmentShader.replace( '#include <clipping_planes_pars_fragment>', '#include <clipping_planes_pars_fragment>' + adds );
    }

    /*static addToParsFragment( fragment, adds ){
        return fragment.replace( '#include <clipping_planes_pars_fragment>', '#include <clipping_planes_pars_fragment>' + adds );
    }*/


	static init ( o = {} ) {

        const fogtest = true
        const activeShadowPCSS = o.shadowType === 'PCSS';

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

        

        // native three
        if(!activeShadowPCSS) return

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
            uniform int fogMode;
            uniform int depthPacking;

            varying vec2 vZW;
            varying vec3 rayDir;
            varying vec3 rayDir2;
            varying vec3 rayOri;
            //varying float fDist;

            float shadowValue = 1.0;
            float shadowTmp = 1.0;
            vec3 shadowColor = vec3(1.0);
            
            float color_distance( vec3 a, vec3 b){
                vec3 s = vec3( a - b );
                float dist = sqrt( s.r * s.r + s.g * s.g + s.b * s.b );
                return clamp(dist, 0.0, 1.0);
            }

            vec3 adjustContrast(vec3 color, float value) {
                const vec3 zero = vec3(0.);
                return max(zero, 0.5 + value * (color - 0.5));
            }

            vec3 hsv2rgb(vec3 c){
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            vec3 rgb2hsv(vec3 rgb) {
                float Cmax = max(rgb.r, max(rgb.g, rgb.b));
                float Cmin = min(rgb.r, min(rgb.g, rgb.b));
                float delta = Cmax - Cmin;
                vec3 hsv = vec3(0., 0., Cmax);
                if (Cmax > Cmin) {
                    hsv.y = delta / Cmax;
                    if (rgb.r == Cmax) hsv.x = (rgb.g - rgb.b) / delta;
                    else {
                        if (rgb.g == Cmax) hsv.x = 2. + (rgb.b - rgb.r) / delta;
                        else hsv.x = 4. + (rgb.r - rgb.g) / delta;
                    }
                    hsv.x = fract(hsv.x / 6.);
                }
                return hsv;
            }

            /*
            vec3 rgb2hsv(vec3 c){
                vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
                vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

                float d = q.x - min(q.w, q.y);
                float e = 1.0e-10;
                return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
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

        /*ShaderChunk.project_vertex = `
            vec4 mvPosition = vec4( transformed, 1.0 );

            #ifdef USE_INSTANCING
                mvPosition = instanceMatrix * mvPosition;
            #endif

            mvPosition = modelViewMatrix * mvPosition;
            gl_Position = projectionMatrix * mvPosition;
        `;*/





        /*ShaderChunk.begin_vertex = `
        vZW = gl_Position.zw;
        vec3 transformed = vec3( position );
        `;*/


        ShaderChunk.clipping_planes_vertex = `
            #if NUM_CLIPPING_PLANES > 0
                vClipPosition = - mvPosition.xyz;
            #endif
            vZW = gl_Position.zw;
        `;

        s = ShaderChunk.lights_fragment_begin;

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

        // directional
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

        if(fogtest){
            ShaderChunk.fog_vertex = FogVertex
            ShaderChunk.fog_fragment = FogFragment
        }

        
        




        s = ShaderChunk.opaque_fragment//output_fragment;

        s = s.replace( 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );', `

            gl_FragColor = vec4( outgoingLight, diffuseColor.a );

        	#if defined( USE_SHADOWMAP )

            shadowValue = (shadowValue - 0.5) * shadowContrast + 0.5 + shadowLuma;
            shadowValue = pow(abs(shadowValue), shadowGamma );
            shadowValue = clamp( shadowValue, 0.0, 1.0 );

            shadowColor = vec3( shadowValue );

            ///shadowColor = vec3( 0.0,0.0,1.0-shadowValue );

            //vec3 sColor = vec3( 0.1, 0.1, 0.8 );
            //shadowColor.b += 1.0-shadowValue ;



            // TODO find better shadow variation

            vec3 invert = vec3( 1.0 - gl_FragColor.rgb );
            vec3 dd = vec3(0.38,0.42,0.63);
            float gray = ((gl_FragColor.r + gl_FragColor.g + gl_FragColor.b) / 3.0);
            vec3 invColor = gray * dd;
            invColor = invColor * mix( invColor, invert, 1.0-gray*0.5 );




                    


            //gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * shadowColor, (1.0-shadowValue) * shadow );

            //gl_FragColor.rgb *= ((1.0-shadowValue) * (1.0-shadow)) + shadowColor;

            //gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * invColor, (1.0-shadowValue) * shadow );

            gl_FragColor.rgb = mix( gl_FragColor.rgb, invColor, (1.0-shadowValue) * shadow );

            //gl_FragColor.rgb = invColor;

            //gl_FragColor.rgb = gl_FragColor.rgb * shadowColor;

            //gl_FragColor.rgb *= ((1.0-shadowValue) * shadow) * invColor;


        	#endif
            
        `);

        //ShaderChunk.fog_fragment = s;
        ShaderChunk.opaque_fragment = s//output_fragment = s

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


        isInit = true;






		//this.shaders=[];
		//this.uniforms = {};

	}

    static add ( m, beforeCompile = null ) {

        if( !isInit ) return

        if( !m ) return

        let name = m.name;
        if ( materials.has( name ) ) { 
            console.log('already add', name)
            return 
        }

        //console.log('add', name)
        materials.set( name, true )
        
        if( m.shadowSide === null ) m.shadowSide = DoubleSide;

        //m.format = sRGBEncoding;
        /*if(!m.isEncod){
            if( m.map ) m.map.colorSpace = SRGBColorSpace
            m.color.convertSRGBToLinear()
            m.isEncod = true
        }*/

        m.onBeforeCompile = function ( shader ) {
            Shader.modify( shader );
            if(beforeCompile) beforeCompile(shader)
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

        if( !isInit ) return

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
/*THREE.ShaderChunk.fog_fragment = THREE.ShaderChunk.fog_fragment.replace(
                    'gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );',
                    `
                    vec4 CCF = vec4(fogColor, 1.0);
                    #if defined( TONE_MAPPING )
                    CCF.rgb = toneMapping( CCF.rgb );
                    CCF = linearToOutputTexel( CCF );
                    #endif
                    gl_FragColor.rgb = mix( gl_FragColor.rgb, CCF.rgb, fogFactor );
                    `
                );*/


//---------------------
//     FOG SHADER
//---------------------

// https://iquilezles.org/articles/fog/

const FogVertex = /* glsl */`

#ifdef USE_FOG

    vFogDepth = - mvPosition.z;

    rayDir2 = normalize( worldPosition.xyz - cameraPosition );
    rayDir = normalize( mvPosition.xyz );
    rayOri = cameraPosition.xyz;

    //rayOri = worldPosition.xyz; //( cameraPosition-worldPosition.xyz  );
    //vec3 tt = vec3(cameraPosition-mvPosition);
    //float fDist = sqrt(tt.x*tt.x+tt.y*tt.y+tt.z*tt.z);
    //fDist = distance(cameraPosition.xyz, mvPosition.xyz);

#endif
`

const FogFragment = /* glsl */`

#ifdef USE_FOG

    #ifdef FOG_EXP2

        float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

    #else

        float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        float fogDensity = 0.01;

    #endif

    

    /*vec4 CCF = vec4(fogColor, 1.0);
    #if defined( TONE_MAPPING )
        CCF.rgb = toneMapping( CCF.rgb );
        //CCF = linearToOutputTexel( CCF );
    #endif*/

    if( fogMode == 0 ){

        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
    } 

    if( fogMode == 1 ){

        vec3 fcolor = fogColor;

        #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

            float aa = fogDensity * fogDensity * 1.0;
            float bb = fogDensity * fogDensity * 12.0;
            //bb = pow(bb, 0.8);
            float distance = vFogDepth * vFogDepth;

            fogFactor = 1.0 - exp( -distance*bb );
            fogFactor = (aa/bb) * exp(-rayOri.y*bb) * (1.0-exp( -distance*rayDir2.y*bb ))/rayDir2.y;
            fogFactor = clamp( fogFactor, 0.0, 1.0 );

            vec3 sunDir = normalize( directionalLights[ 0 ].direction );
            vec3 sunColor = directionalLights[ 0 ].color;
            // sunColor = vec3(1,0,0);
            float sunAmount = max( dot( rayDir, sunDir ), 0.0 );
            //float sunAdd = clamp( pow(sunAmount, 60.0), 0.0, 1.0 );
            float sunAdd = pow(sunAmount, 16.0);
            fcolor = mix( fogColor, sunColor, sunAdd ); // 8.0

        #endif

        gl_FragColor.rgb = gl_FragColor.rgb * (1.0-fogFactor) + fcolor * fogFactor;

    }

#endif
`

//---------------------
//     shadow PCSS
//---------------------

const shadowPCSS = /* glsl */`

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

#define SAMPLE 16
#define RINGS 4

vec2 poissonDisk[32];

void initPoissonSamples( const in vec2 randomSeed ) {

    float ANGLE_STEP = PI2 * float(rings) / float( nSample );
    float INV_NUM_SAMPLES = 1.0 / float( nSample );

    // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
    float angle = rand( randomSeed ) * PI2;
    float radius = INV_NUM_SAMPLES;
    float radiusStep = radius;

    for( int i = 0; i < nSample; i ++ ) {
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
    float shadowMapDepth = 0.0;

    for( int i = 0; i < nSample; i++ ) {
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
    
    /*
    int numSample = nSample;
    float sum = 0.0;
    float depth;
    #pragma unroll_loop_start
    for( int i = 0; i < nSample; i ++ ) {
        depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
        if( zReceiver <= depth ) sum += 1.0;
    }
    #pragma unroll_loop_end
    #pragma unroll_loop_start
    for( int i = 0; i < nSample; i ++ ) {
        depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
        if( zReceiver <= depth ) sum += 1.0;
    }
    #pragma unroll_loop_end
    return sum / ( 2.0 * float( nSample ) );
    */

    
    float sum = 0.0;
    float top = 0.0;
    float low = 0.0;
    #pragma unroll_loop_start
    for( int i = 0; i < 16; i ++ ) {
        top = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
        low = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
        if( zReceiver <= top ) sum += 1.0;
        if( zReceiver <= low ) sum += 1.0;
    }
    #pragma unroll_loop_end
    return sum / ( 2.0 * float( nSample ) );
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
    return PCF_Filter( shadowMap, uv, zReceiver, filterRadius * softness );
}


`


//---------------------
//     random UV
//---------------------


const randomUV = /* glsl */`

uniform sampler2D noiseMap;
uniform float useNoiseMap;

float directNoise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

float sum( vec4 v ) { return v.x+v.y+v.z; }

vec4 textureNoTile( sampler2D mapper, in vec2 uv ){

    // sample variation pattern
    float k = 0.0;
    if( useNoiseMap == 1.0 ) k = texture2D( noiseMap, 0.005*uv ).x;
    else k = directNoise( uv );
    
    // compute index    
    float index = k*8.0;
    float f = fract( index );

    float ia = floor( index );
    float ib = ia + 1.0;
    // or
    //float ia = floor(index+0.5); // suslik's method (see comments)
    //float ib = floor(index);
    //f = min(f, 1.0-f)*2.0;

    // offsets for the different virtual patterns    
    vec2 offa = sin(vec2(3.0,7.0)*ia); // can replace with any other hash    
    vec2 offb = sin(vec2(3.0,7.0)*ib); // can replace with any other hash    

    // compute derivatives for mip-mapping    
    vec2 dx = dFdx(uv);
    vec2 dy = dFdy(uv);
    
    // sample the two closest virtual patterns    
    vec4 cola = textureGrad( mapper, uv + offa, dx, dy );
    vec4 colb = textureGrad( mapper, uv + offb, dx, dy );

    // interpolate between the two virtual patterns    
    return mix( cola, colb, smoothstep(0.2,0.8,f-0.1*sum(cola-colb)) );

}
`