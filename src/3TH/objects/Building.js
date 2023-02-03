import {
	MeshStandardMaterial, ShaderMaterial, WebGLCubeRenderTarget, CubeCamera, Scene, Mesh, RGBAFormat,
	DoubleSide, Color, Vector3, BackSide, LinearMipmapLinearFilter, Vector2
} from 'three';

import { Shader } from '../Shader.js';


export class Building extends MeshStandardMaterial {

	constructor( o = {}, extra = {} ) {

		o.metalness = 1;
		o.roughness = 0.2;
		o.side = DoubleSide;
		//o.opacity = 0.9;
		//o.side = DoubleSide;
		//o.transparent = true;
		o.envMapIntensity = 1;
		//o.premultipliedAlpha = true;
		o.normalScale = new Vector2(2,2)
		//o.opacity = 1.0;

		super( o );

		this.onBeforeCompile = function ( shader ) {

			var uniforms = shader.uniforms;

			uniforms[ "insideMap" ] = { value: extra.insideMap || null };
			uniforms[ "wallFreq" ] = { value: new Vector3().fromArray( extra.freq || [1,1,1])  };
			uniforms[ "wallsBias" ] = { value: extra.bias || 0.01 };

			uniforms[ "time" ] = { value: extra.time || 1 };
			uniforms[ "lightning" ] = { value: 1 };
			uniforms[ "isNoise" ] = { value: 1 };
			uniforms[ "isNoSection" ] = { value: 0 };

			shader.uniforms = uniforms;

			var vertex = shader.vertexShader;
			vertex = vertex.replace( 'varying vec3 vViewPosition;', Shader.getGl2() ? vertAdd : inverse+vertAdd  );
			vertex = vertex.replace( '#include <fog_vertex>', vertMainAdd );
			shader.vertexShader = vertex;

			//console.log(vertex)

			var fragment = shader.fragmentShader;
			fragment = fragment.replace( 'void main() {', fragAdd );
			//fragment = fragment.replace( 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );', fragMainAdd );

			fragment = fragment.replace( '#include <map_fragment>', fragMap );
			fragment = fragment.replace( '#include <normal_fragment_maps>', fragNormal );
			fragment = fragment.replace( '#include <emissivemap_fragment>', fragLuma );

			shader.fragmentShader = fragment;

			Shader.modify( shader );

		}
	}
}



const inverse =/* glsl */`

mat4 inverse(mat4 m) {

    float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2], a03 = m[0][3], a10 = m[1][0], a11 = m[1][1], a12 = m[1][2], a13 = m[1][3], a20 = m[2][0], a21 = m[2][1], a22 = m[2][2], a23 = m[2][3], a30 = m[3][0], a31 = m[3][1], a32 = m[3][2], a33 = m[3][3],

    b00 = a00 * a11 - a01 * a10,
    b01 = a00 * a12 - a02 * a10,
    b02 = a00 * a13 - a03 * a10,
    b03 = a01 * a12 - a02 * a11,
    b04 = a01 * a13 - a03 * a11,
    b05 = a02 * a13 - a03 * a12,
    b06 = a20 * a31 - a21 * a30,
    b07 = a20 * a32 - a22 * a30,
    b08 = a20 * a33 - a23 * a30,
    b09 = a21 * a32 - a22 * a31,
    b10 = a21 * a33 - a23 * a31,
    b11 = a22 * a33 - a23 * a32,

  det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

  return mat4( a11 * b11 - a12 * b10 + a13 * b09, a02 * b10 - a01 * b11 - a03 * b09, a31 * b05 - a32 * b04 + a33 * b03, a22 * b04 - a21 * b05 - a23 * b03, a12 * b08 - a10 * b11 - a13 * b07,
      a00 * b11 - a02 * b08 + a03 * b07, a32 * b02 - a30 * b05 - a33 * b01, a20 * b05 - a22 * b02 + a23 * b01, a10 * b10 - a11 * b08 + a13 * b06, a01 * b08 - a00 * b10 - a03 * b06,
      a30 * b04 - a31 * b02 + a33 * b00, a21 * b02 - a20 * b04 - a23 * b00, a11 * b07 - a10 * b09 - a12 * b06, a00 * b09 - a01 * b07 + a02 * b06, a31 * b01 - a30 * b03 - a32 * b00,
      a20 * b03 - a21 * b01 + a22 * b00) / det;
}
`;

const vertAdd =/* glsl */`
varying vec3 vViewPosition;

varying mat4 invMat;
varying mat4 modelMatrixOn;

varying vec3 oP; // surface position in object space
varying vec3 oE; // position of the eye in object space
varying vec3 oI; // incident ray direction in object space
varying vec3 oN; // surface normal

`;

const vertMainAdd =/* glsl */`
#include <fog_vertex>

mat4 modelViewMatrixInverse = inverse( modelViewMatrix );

// surface position in object space
oP = position;

// position of the eye in object space
oE = modelViewMatrixInverse[3].xyz;

// incident ray direction in object space
oI = oP - oE;

// surface normal
oN = normalize( vec3( normal ) );

`;



const fragAdd =/* glsl */`

varying vec3 oP; // surface position in object space
varying vec3 oE; // position of the eye in object space
varying vec3 oI; // incident ray direction in object space
varying vec3 oN; // surface normal

uniform sampler2D insideMap;
uniform vec3 wallFreq;
uniform float wallsBias;

uniform float time;
uniform float lightning;
uniform bool isNoise;
uniform bool isNoSection;

float randomized( vec2 co ){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

vec2 tileUV( vec2 uv, vec2 pos, vec2 ntile ){

	pos.y = ntile.y-pos.y-1.0;
	vec2 div = 1.0/ntile;
	vec2 v = vec2(uv*div)+(pos*div);
	return v;
	
}

void main() {

`;



const fragMainAdd =/* glsl */`
gl_FragColor = vec4( outgoingLight, diffuseColor.a );


`;


const fragMap =/* glsl */`

#ifdef USE_MAP

	//vec4 texelColor = texture2D( map, vUv );

	//texelColor = mapTexelToLinear( texelColor );
	//diffuseColor *= texelColor;


vec3 wallFrequencies = wallFreq - wallsBias;

// calculate wall locations
vec3 wallFrame = floor( oP * wallFrequencies);
vec3 walls = ( wallFrame + step( vec3( 0.0 ), oI )) / wallFrequencies;

// how much of the ray is needed to get from the oE to each of the walls

vec3 rayFractions = ( walls - oE ) / oI;

// texture-coordinates of intersections
vec2 uvXY = fract((oE + rayFractions.z * oI).xy * wallFrequencies.xy);
vec2 uvXZ = fract((oE + rayFractions.y * oI).xz * wallFrequencies.xz);
vec2 uvZY = fract((oE + rayFractions.x * oI).zy * wallFrequencies.zy);

vec2 nuv = vec2( 2.0, 4.0 );

// floor / ceiling  

vec4 tmp_color_1 = texture2D( insideMap, tileUV( uvXZ, vec2(1.0,0.0), nuv ) );// floor
vec4 tmp_color_2 = texture2D( insideMap, tileUV( uvXZ, vec2(0.0,0.0), nuv ) );// ceilling
vec4 verticalColour = mix( tmp_color_1, tmp_color_2, step(0.0, oI.y));

tmp_color_1 = texture2D( insideMap, tileUV( uvXY, vec2(0.0,2.0), nuv ) ); // back
tmp_color_2 = texture2D( insideMap, tileUV( uvXY, vec2(1.0,2.0), nuv ) ); // front
vec4 wallXYColour = mix( tmp_color_1, tmp_color_2, step(oI.z, 0.0));

tmp_color_1 = texture2D( insideMap, tileUV( uvZY, vec2(0.0,3.0), nuv ) ); // left
tmp_color_2 = texture2D( insideMap, tileUV( uvZY, vec2(1.0,3.0), nuv ) ); // right
vec4 wallZYColour = mix( tmp_color_1, tmp_color_2, step(oI.x, 0.0) );

// add some noise

vec4 noiseColor = vec4( 0.0 );

if( isNoise ){
	float t = time*0.00000001;
	noiseColor.xyz = vec3( vec3( randomized(wallFrame.xy+t) ) + vec3( randomized(wallFrame.zy) ) + vec3( randomized(wallFrame.xz+t)) ) / 3.0;
	wallXYColour *= noiseColor;
    wallZYColour *= noiseColor;
    verticalColour *= noiseColor;
}

// intersect walls

vec4 insideColor = vec4(0.0);
if( isNoSection ){
	//insideColor = ( wallXYColour + wallZYColour + verticalColour ) / 3.0;
	///insideColor.a = alph;

	insideColor = mix( wallXYColour, wallZYColour, step(wallXYColour.a, wallZYColour.a) );
	insideColor = mix( insideColor, verticalColour, step(insideColor.a, verticalColour.a)  );
	//insideColor = verticalColour;
	//insideColor = mix( insideColor, verticalColour, insideColor.a );

} else {

    float xVSz = step( rayFractions.x, rayFractions.z );
	insideColor = mix( wallXYColour, wallZYColour, xVSz );

	float rayFraction_xVSz = mix( rayFractions.z, rayFractions.x, xVSz );
	float xzVSy = step( rayFraction_xVSz, rayFractions.y );
	insideColor = mix( verticalColour, insideColor, xzVSy );

}



// exterior

vec2 nuvo = vec2( 2.0, 4.0 );// texture reapeat

vec4 Ftop = texture2D( map, tileUV( fract( oP.xz * wallFrequencies.xz ) , vec2(1.0,2.0), nuv ) );
vec4 Fleft = texture2D( map, tileUV( fract( oP.zy * wallFrequencies.zy ) , vec2(1.0,1.0), nuv ) );
vec4 Ffront = texture2D( map, tileUV( fract( oP.xy * wallFrequencies.xy ) , vec2(0.0,0.0), nuv ) );

float n = abs(oN.z) > abs(oN.x) ? 1.0 : 0.0;
float ny = abs(oN.y) > ( abs(oN.x) + abs(oN.z) * 0.5 ) ? 1.0 : 0.0;

vec4 outsideColor =  mix( Fleft, Ffront, n );
//outsideColor =  mix( outsideColor, Ftop, ny );


//vec4 building_color = mapTexelToLinear(vec4( mix( insideColor, outsideColor, outsideColor.a ).xyz, 1.0));
vec4 building_color = mapTexelToLinear( mix( insideColor, outsideColor, outsideColor.a ));

//if(building_color.a < 0.01) discard;

diffuseColor *= building_color;

#endif


`;


const fragNormal22 =/* glsl */`



#ifdef OBJECTSPACE_NORMALMAP
	
	normal = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

	#ifdef FLIP_SIDED

		normal = - normal;

	#endif

	#ifdef DOUBLE_SIDED

		normal = normal * faceDirection;

	#endif

	normal = normalize( normalMatrix * normal );

   #elif defined( TANGENTSPACE_NORMALMAP )

    vec3 nWallFrequencies = wallFreq - wallsBias;
	vec2 nuvn = vec2( 2.0, 4.0 );
	vec3 Ntop = texture2D( normalMap, tileUV( fract( oP.xz * nWallFrequencies.xz ) , vec2(1.0,2.0), nuvn ) ).rgb;
	vec3 Nleft = texture2D( normalMap, tileUV( fract( oP.zy * nWallFrequencies.zy ) , vec2(1.0,1.0), nuvn ) ).rgb;
	vec3 Nfront = texture2D( normalMap, tileUV( fract( oP.xy * nWallFrequencies.xy ) , vec2(0.0,0.0), nuvn ) ).rgb;

	float nn = abs(oN.z) > abs(oN.x) ? 1.0 : 0.0;
	float nny = abs(oN.y) > ( abs(oN.x) + abs(oN.z) * 0.5 ) ? 1.0 : 0.0;

	vec3 mapN = mix( Nleft, Nfront, nn );
	mapN = mix( mapN, Ntop, nny );
	mapN = mapN * 2.0 - 1.0;

	//vec3 mapN = NORM;//texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;

	#ifdef USE_TANGENT

		normal = normalize( vTBN * mapN );

	#else

		normal = perturbNormal2Arb( -vViewPosition, normal, mapN, faceDirection );

	#endif


#endif

`;
const fragLuma =/* glsl */`
vec4 emissiveColor = vec4( mix( insideColor, vec4(0.0, 0.0, 0.0, 1.0), outsideColor.a ).xyz, 1.0);
//emissiveColor.rgb = emissiveMapTexelToLinear( emissiveColor.rgb );
totalEmissiveRadiance = emissiveColor.xyz*lightning*noiseColor.xyz;
`;


const fragNormal =/* glsl */`
#ifdef USE_NORMALMAP

vec3 nWallFrequencies = wallFreq - wallsBias;
vec2 nuvn = vec2( 2.0, 4.0 );
vec3 Ntop = texture2D( normalMap, tileUV( fract( oP.xz * nWallFrequencies.xz ) , vec2(1.0,2.0), nuvn ) ).rgb;
vec3 Nleft = texture2D( normalMap, tileUV( fract( oP.zy * nWallFrequencies.zy ) , vec2(1.0,1.0), nuvn ) ).rgb;
vec3 Nfront = texture2D( normalMap, tileUV( fract( oP.xy * nWallFrequencies.xy ) , vec2(0.0,0.0), nuvn ) ).rgb;

float nn = abs(oN.z) > abs(oN.x) ? 1.0 : 0.0;
float nny = abs(oN.y) > ( abs(oN.x) + abs(oN.z) * 0.5 ) ? 1.0 : 0.0;

vec3 tmpNormal =  mix( Nleft, Nfront, nn );
//tmpNormal =  mix( tmpNormal, Ntop, nny );
tmpNormal = tmpNormal * 2.0 - 1.0;


vec3 eye_pos = -vViewPosition;
vec3 surf_norm = normal;

vec3 q0 = vec3( dFdx( eye_pos.x ), dFdx( eye_pos.y ), dFdx( eye_pos.z ) );
vec3 q1 = vec3( dFdy( eye_pos.x ), dFdy( eye_pos.y ), dFdy( eye_pos.z ) );
vec2 st0 = dFdx( vUv.st );
vec2 st1 = dFdy( vUv.st );

float scale = sign( st1.t * st0.s - st0.t * st1.s ); // we do not care about the magnitude

vec3 S = normalize( ( q0 * st1.t - q1 * st0.t ) * scale );
vec3 T = normalize( ( - q0 * st1.s + q1 * st0.s ) * scale );
vec3 N = normalize( surf_norm );
mat3 tsn = mat3( S, T, N );

vec3 mapN = tmpNormal;//texture2D( normalMap, vUv ).xyz * 2.0 - 1.0;

mapN.xy *= normalScale;
mapN.xy *= ( float( gl_FrontFacing ) * 2.0 - 1.0 );

normal = normalize( tsn * mapN );

#endif
`;
