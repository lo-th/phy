import {
    MeshPhysicalMaterial, MeshStandardMaterial, ShaderMaterial, WebGLCubeRenderTarget, CubeCamera, Scene, Mesh, RGBAFormat,
    DoubleSide, Color, Vector3, Vector4, BackSide, LinearMipmapLinearFilter, ShaderChunk
} from 'three';

import { Shader } from '../Shader.js';
//import { Main } from '../../Main.js';

export class Fluid extends MeshPhysicalMaterial {

	constructor( o = {}, extra = {} ) {

		o.metalness = 0.5
		o.roughness = 0

        o.clearcoat = 1
        //o.clearcoatRoughness = 0.25
        //o.transmission = 1
        //o.thickness = 0.02
		
		o.side = DoubleSide
		
		o.envMapIntensity = 1.2
        o.reflectivity = 1.0
        //o.ior=1.7

        o.transparent = true
        //o.depthWrite = false
        o.opacity = 0.7
		//o.premultipliedAlpha = true
        o.alphaToCoverage = true

        o.sheenColor = 0xffffff

        o.sheen = 0.5

        let fillAmount = o.fillAmount || -0.5
        delete o.fillAmount


		super( o )

        this.fillAmount = fillAmount


        this.isModif = false

        this.modif( o )

        //return

		/**/


	}


    modif( o ){

        if(this.isModif) return

        let self = this
        let fillAmount = this.fillAmount

        this.onBeforeCompile = function ( shader ) {

            let uniforms = shader.uniforms
            uniforms[ "time" ] = { value: 0 }
            uniforms[ "fillAmount" ] = { value: -0.5 }
            //uniforms[ "wobbleX" ] = { value: 0.0 }
            //uniforms[ "wobbleZ" ] = { value: 0.0 }
            uniforms[ "topColor" ] = { value: new Vector4(1,0,0, 0.7) }
            uniforms[ "rimColor" ] = { value: new Vector4(0,1,0, 0.5) }
            uniforms[ "foamColor" ] = { value: new Vector4(1,1,1, 0.9) }
            uniforms[ "tint" ] = { value: new Vector4(1,1,0,0.8) }
            uniforms[ "rim" ] = { value: 0.1 }
            uniforms[ "rimPower" ] = { value: 0.5 }
            uniforms[ "Line" ] = { value: 0.01 }
            uniforms[ "LineSmooth" ] = { value: 0.1 }

            /*uniforms[ "normalCube" ] = { value: self.normal.texture };
            uniforms[ "bDebugBounces" ] = { value: 0 };

            uniforms[ "mFresnelBias" ] = { value: 0.02 };
            uniforms[ "mFresnelScale" ] = { value: 0.1 };
            uniforms[ "mFresnelPower" ] = { value: 1 };

            uniforms[ "aberration" ] = { value: 0.012 };
            uniforms[ "refraction" ] = { value: 2.417 };

            uniforms[ "normalOffset" ] = { value: 0.0 };
            uniforms[ "squashFactor" ] = { value: 0.98 };
            uniforms[ "distanceOffset" ] = { value: 0 };
            uniforms[ "geometryFactor" ] = { value: 0.28 };

            uniforms[ "absorbption" ] = { value: new Color(0,0,0) };
            uniforms[ "correction" ] = { value: new Color( 0xFFFFFF ) };
            uniforms[ "boost" ] = { value: new Color(.892, .892, .98595025) };

            uniforms[ "radius" ] = { value: 1.5 };
            uniforms[ "centreOffset" ] = { value: new Vector3(0, 0, 0) };*/

            shader.uniforms = uniforms;

            //shader.uniforms.reflectif = this.userData.reflectif;

            var vertex = shader.vertexShader;

            vertex = vertexAdd + vertex;
            vertex = vertex.replace( '#include <color_vertex>', vertexColor  );
            vertex = vertex.replace( '#include <worldpos_vertex>', vertexWorld  );
            //vertex = vertex.replace( '#include <fog_vertex>', vertMainAdd );
            shader.vertexShader = vertex;

            //console.log(vertex)

            var fragment = shader.fragmentShader;

            fragment = fragmentAdd + fragment;

            //console.log(fragment)
            /*fragment = fragment.replace( 'void main() {', `
                #include <extra_fragment>
                void main() {` );

            //fragment = fragment.replace( 'void main() {', fragAdd );*/
            fragment = fragment.replace( '#include <color_fragment>', fragmentColor );

            shader.fragmentShader = fragment;

            self.userData.shader = shader

            Shader.modify( shader );

        }
/*
        this.customProgramCacheKey = function () {

            return fillAmount;

        };*/

        this.isModif = true
    }


    dispose() {
        //this.normal.dispose()
        this.dispatchEvent( { type: 'dispose' } );

    }

}

const vertexAdd = `
uniform float time;
uniform float fillAmount;

#define PII 3.1415926538

varying vec3 fillPosition;
varying vec4 vvWorldPosition;

vec4 RotateAroundYInDegrees(vec4 vertex, float degrees)
{
   float alpha = degrees * PII / 180.0;
   float sina = sin(alpha);
   float cosa = cos(alpha);
   mat2 m = mat2(cosa, sina, -sina, cosa);
   return vec4(vertex.yz , m * vertex.xz).xzyw ;                
}

vec3 RotateAround(vec3 In, vec3 Axis, float degrees )
{
    float alpha = degrees * PII / 180.0;
    float s = sin(alpha);
    float c = cos(alpha);
    float one_minus_c = 1.0 - c;
            
    mat3 rot_mat = mat3(
        one_minus_c * Axis.x * Axis.x + c, one_minus_c * Axis.x * Axis.y - Axis.z * s, one_minus_c * Axis.z * Axis.x + Axis.y * s,
        one_minus_c * Axis.x * Axis.y + Axis.z * s, one_minus_c * Axis.y * Axis.y + c, one_minus_c * Axis.y * Axis.z - Axis.x * s,
        one_minus_c * Axis.z * Axis.x - Axis.y * s, one_minus_c * Axis.y * Axis.z + Axis.x * s, one_minus_c * Axis.z * Axis.z + c
    );

    vec3 Out = In * rot_mat;
    return Out;

}
`
const vertexColor = `
#ifdef USE_COLOR
    vColor = color;
#endif
#ifdef USE_INSTANCING_COLOR
    vColor.xyz = instanceColor.xyz;
#endif
`

const vertexWorld = `
vec4 worldPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
    worldPosition = instanceMatrix * worldPosition;
#endif
worldPosition = modelMatrix * worldPosition;

vec3 filling = vec3(0.0,fillAmount,0.0);
vec3 worldPosOffset = worldPosition.xyz - filling;
// rotate it around XY
//vec3 worldPosX = RotateAroundYInDegrees(vec4(transformed, 0.0), 360.0).xyz;
vec3 worldPosX = RotateAround( worldPosOffset, vec3(0.0,0.0,1.0), 90.0 );
// rotate around XZ
//vec3 worldPosZ = vec3(worldPosX.y, worldPosX.z, worldPosX.x);
vec3 worldPosZ = RotateAround( worldPosOffset, vec3(1.0,0.0,0.0), 90.0 );
// combine rotations with worldPos, based on sine wave from script
#ifdef USE_INSTANCING_COLOR
vec3 worldPosAdjusted = worldPosition.xyz + (worldPosX * vColor.x) + (worldPosZ * vColor.z);
// how high up the liquid is
fillPosition = worldPosAdjusted - filling;
fillPosition.y -= vColor.y;
#endif
vvWorldPosition = worldPosition;
`


const fragmentAdd = `
uniform vec4 topColor;
uniform vec4 rimColor;
uniform vec4 foamColor;
uniform vec4 tint;
uniform float rim;
uniform float rimPower;
uniform float Line;
uniform float LineSmooth;

varying vec3 fillPosition;
varying vec4 vvWorldPosition;

`
const fragmentColor = `
// -------- INIT LIQUID SHADER --------
vec4 col = tint;
//float dotProduct = 1.0 - pow(dot(worldNormal, viewDirection), rimPower);
//vec4 RimResult = vec4(smoothstep(0.5, 1.0, dotProduct));
//RimResult *= rimColor;
//RimResult *= rimColor.w;

float wobble = 0.0;//sin((i.fillPosition.x * _Freq) + (i.fillPosition.z * _Freq ) + ( _Time.y)) * (_Amplitude *wobbleIntensity);  
float movingfillPosition = fillPosition.y + wobble;

// foam edge
float cutoffTop = step(movingfillPosition, 0.5);
float foam = cutoffTop * smoothstep(0.5 - Line - LineSmooth, 0.5 - Line , movingfillPosition);
vec4 foamColored = foam * foamColor;

// rest of the liquid minus the foam
float result = cutoffTop - foam;
vec4 resultColored = result * col;


// both together, with the texture
vec4 finalResult = resultColored + foamColored;
vec4 _topColor = topColor * (foam + result);
//finalResult.rgb += RimResult.rgb;
//finalResult *= _topColor;

diffuseColor.rgb *= finalResult.rgb;
//diffuseColor *= gl_FrontFacing ? finalResult : _topColor;//_topColor;
//diffuseColor = finalResult;
`