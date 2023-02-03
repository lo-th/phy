
import {
    ShaderMaterial, Vector4, Vector2, DoubleSide, Color
} from 'three';


//https://github.com/emmelleppi/r3f-liquid-bottle
//https://www.patreon.com/posts/quick-game-art-18245226
///https://pastebin.com/TxJq8kHX


//--------------------------
//  Liquid Refraction
//--------------------------

const LiquidRefractionfrag = `
#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform sampler2D envMap;
uniform sampler2D backfaceMap;
uniform vec2 resolution;
uniform vec4 topColor;
uniform vec4 rimColor;
uniform vec4 foamColor;
uniform vec4 tint;
uniform float rim;
uniform float rimPower;

uniform float Line;
uniform float LineSmooth;

varying vec3 worldNormal;
varying vec3 viewDirection;
varying vec2 vUv;
varying vec4 worldPosition;
varying vec3 fillPosition;
//varying float fillEdge;

float ior = 1.5;
float a = 0.25;

vec3 fogColor = vec3(1.0);
vec3 reflectionColor = vec3(1.0);

float fresnelFunc(vec3 viewDirection, vec3 worldNormal) {
    return pow( 1.08 + dot( viewDirection, worldNormal), 10.0 );
}

void main() {
    // screen coordinates
    vec2 uv = gl_FragCoord.xy / resolution;

    // -------- INIT REFRACTION SHADER -------- 
    // sample backface data from texture
    //vec3 backfaceNormal = texture2D(backfaceMap, uv).rgb;

    // combine backface and frontface normal
    vec3 normal = worldNormal * (1.0 - a);// - backfaceNormal * a;

    // calculate refraction and apply to uv
    vec3 refracted = refract(viewDirection, normal, 1.0/ior);
    uv += refracted.xy;

    // sample environment texture
    vec4 tex = texture2D(envMap, uv) ;

    // calculate fresnel
    float fresnel = fresnelFunc(viewDirection, normal);

    vec4 color = tex;

    // apply fresnel
    color.rgb = mix(color.rgb, reflectionColor, fresnel);
    // -------- END REFRACTION SHADER -------

    color.a = 0.8;
    
    
    // -------- INIT LIQUID SHADER --------
    vec4 col = tint;
    float dotProduct = 1.0 - pow(dot(worldNormal, viewDirection), rimPower);
    vec4 RimResult = vec4(smoothstep(0.5, 1.0, dotProduct));
    RimResult *= rimColor;
    RimResult *= rimColor.w;


    // add movement based deform, using a sine wave
    //float wobbleIntensity =  abs(_WobbleX) + abs(_WobbleZ);            
    float wobble = 0.0;//sin((i.fillPosition.x * _Freq) + (i.fillPosition.z * _Freq ) + ( _Time.y)) * (_Amplitude *wobbleIntensity);  
    float movingfillPosition = fillPosition.y + wobble;

    // foam edge
    float cutoffTop = step(movingfillPosition, 0.5);
    float foam = cutoffTop * smoothstep(0.5 - Line - LineSmooth, 0.5 - Line , movingfillPosition);
    vec4 foamColored = foam * foamColor;

    // rest of the liquid minus the foam
    float result = cutoffTop - foam;
    vec4 resultColored = result * col;

    //vec4 foam = vec4(step(fillEdge, 0.5) - step(fillEdge, (0.5 - rim)))  ;
    //vec4 foamColored = foam * (foamColor * 0.9);

    // rest of the liquid
    //vec4 result = step(fillEdge, 0.5) - foam;
    //vec4 resultColored = result * col;
    
    // both together, with the texture
    vec4 finalResult = resultColored + foamColored;       
    finalResult.rgb += RimResult.rgb;

    finalResult.a = 0.5;

    // -------- END LIQUID SHADER -------- 

    gl_FragColor = finalResult * color;
}`;

const LiquidRefractionvert = `
uniform vec4 color;
varying vec3 worldNormal;
varying vec3 viewDirection;
varying vec2 vUv;
varying vec4 worldPosition;
//varying float fillEdge;
varying vec3 fillPosition;

uniform float fillAmount;
uniform float wobbleX;
uniform float wobbleZ;

#define PI 3.1415926538

vec4 RotateAroundYInDegrees(vec4 vertex, float degrees)
{
    float alpha = degrees * PI / 180.0;
    float sina = sin(alpha);
    float cosa = cos(alpha);
    mat2 m = mat2(cosa, sina, -sina, cosa);
    return vec4(vertex.yz , m * vertex.xz).xzyw;        
}

vec3 RotateAround(vec3 In, vec3 Axis, float degrees )
{
    float alpha = degrees * PI / 180.0;
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

void main() {
    vUv = uv;

    vec4 transformedNormal = vec4(normal, 0.);
    vec4 transformedPosition = vec4(position, 1.0);
    vec4 vColor = vec4(0.0);
    #ifdef USE_INSTANCING
        transformedNormal = instanceMatrix * transformedNormal;
        transformedPosition = instanceMatrix * transformedPosition;
        #ifdef USE_INSTANCING_COLOR
            vColor.xyz = instanceColor.xyz;
        #endif
    #endif

    vec3 filling = vec3(0.0,fillAmount,0.0);

    //vec3 filling = ( modelMatrix * vec4(0.0,fillAmount,0.0,1.0)).xyz;

    // get world position of the vertex
    worldPosition = modelMatrix * transformedPosition;//vec4(position, 1.0);
    vec3 worldPosOffset = worldPosition.xyz - filling;

    // rotate it around XY
    //vec3 worldPosX = RotateAroundYInDegrees(vec4(position, 0.0), 360.0).xyz;
    vec3 worldPosX = RotateAround( worldPosOffset, vec3(0.0,0.0,1.0), 90.0 );
    
    // rotate around XZ
    //vec3 worldPosZ = vec3(worldPosX.y, worldPosX.z, worldPosX.x);
    vec3 worldPosZ = RotateAround( worldPosOffset, vec3(1.0,0.0,0.0), 90.0 );
    
    // combine rotations with worldPos, based on sine wave from script
    vec3 worldPosAdjusted = worldPosition.xyz + (worldPosX * wobbleX) + (worldPosZ * wobbleZ); 
    
    // how high up the liquid is
    //fillEdge =  worldPosAdjusted.y + filling.y;
    fillPosition = worldPosAdjusted - filling;

    fillPosition.y -= vColor.y;



    worldNormal = normalize(modelViewMatrix * transformedNormal).xyz;
    viewDirection = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;

    //fillPosition.y = gl_Position.y;
}
`;


export const Liquid = new ShaderMaterial({
    uniforms:{
        'color':{ value: new Color(0x000000) },
        'envMap': { value: null },
        'backfaceMap': { value: null },
        'resolution':{ value: new Vector2(500, 300) },
        'fillAmount': { value: 0.01 },
        'wobbleX': { value: 0 },
        'wobbleZ': { value: 0 },
        'topColor': { value: new Vector4(1,0,0, 1) },
        'rimColor': { value: new Vector4(0,1,0, 1) },
        'foamColor': { value: new Vector4(0,0,1, 1) },
        'tint':{ value: new Vector4(1,1,1,0.2) },
        'rim': { value: 0.1 },
        'rimPower': { value: 0.5 },
        'Line': { value: 0.05 },
        'LineSmooth': { value: 0.05 },
    },
    vertexShader:LiquidRefractionvert,
    fragmentShader:LiquidRefractionfrag,
    transparent:true,
    side: DoubleSide,
})



//--------------------------
//  Backface
//--------------------------


const Backfacefrag = `
varying vec3 worldNormal;
void main() {
gl_FragColor = vec4(worldNormal, 1.0);
}`;

const Backfacevert = `
varying vec3 worldNormal;
void main() {

    vec4 transformedNormal = vec4(normal, 0.);
    vec4 transformedPosition = vec4(position, 1.0);
    #ifdef USE_INSTANCING
         transformedNormal = instanceMatrix * transformedNormal;
         transformedPosition = instanceMatrix * transformedPosition;
    #endif

    worldNormal = normalize( modelViewMatrix * transformedNormal).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
}`;

export const BackfaceMaterial = new ShaderMaterial({
    uniforms:{},
    vertexShader:Backfacevert,
    fragmentShader:Backfacefrag
})


//--------------------------
//  liquidMaterial
//--------------------------

export const liquidvert = `
varying vec3 worldNormal;
varying vec3 viewDirection;
varying vec2 vUv;
varying vec4 worldPosition;
varying float fillEdge;

uniform float fillAmount;
uniform float wobbleX;
uniform float wobbleZ;

#define PI 3.1415926538

vec4 RotateAroundYInDegrees(vec4 vertex, float degrees)
{
    float alpha = degrees * PI / 180.0;
    float sina = sin(alpha);
    float cosa = cos(alpha);
    mat2 m = mat2(cosa, sina, -sina, cosa);
    return vec4(vertex.yz , m * vertex.xz).xzyw ;        
}

void main() {
    vUv = uv;

    vec4 transformedNormal = vec4(normal, 0.);
    vec4 transformedPosition = vec4(position, 1.0);
    #ifdef USE_INSTANCING
        transformedNormal = instanceMatrix * transformedNormal;
        transformedPosition = instanceMatrix * transformedPosition;
    #endif

    // get world position of the vertex
    worldPosition = modelMatrix * vec4(position, 1.0);
    
    // rotate it around XY
    vec3 worldPosX = RotateAroundYInDegrees(vec4(position, 0.0), 360.0).xyz;
    
    // rotate around XZ
    vec3 worldPosZ = vec3(worldPosX.y, worldPosX.z, worldPosX.x);   
    
    // combine rotations with worldPos, based on sine wave from script
    vec3 worldPosAdjusted = worldPosition.xyz + (worldPosX  * wobbleX) + (worldPosZ * wobbleZ); 
    
    // how high up the liquid is
    fillEdge =  worldPosAdjusted.y + fillAmount;

    worldNormal = normalize(modelViewMatrix * transformedNormal).xyz;
    viewDirection = normalize(worldPosition.xyz - cameraPosition);
    gl_Position = projectionMatrix * modelViewMatrix * transformedPosition;
}
`;

export const liquidfrag = `
uniform vec2 resolution;
uniform vec4 topColor;
uniform vec4 rimColor;
uniform vec4 foamColor;
uniform vec4 tint;
uniform float rim;
uniform float rimPower;

varying vec3 worldNormal;
varying vec3 viewDirection;
varying vec2 vUv;
varying vec4 worldPosition;
varying float fillEdge;

void main() {
    vec2 uv = gl_FragCoord.xy / resolution;

    vec4 col = tint;

    float dotProduct = 1.0 - pow(dot(worldNormal, viewDirection), rimPower);
    vec4 RimResult = vec4(smoothstep(0.5, 1.0, dotProduct));
    RimResult *= rimColor;
    RimResult *= rimColor.w;
    
    // foam edge
    vec4 foam = vec4(step(fillEdge, 0.5) - step(fillEdge, (0.5 - rim)))  ;
    vec4 foamColored = foam * (foamColor * 0.9);

    // rest of the liquid
    vec4 result = step(fillEdge, 0.5) - foam;
    vec4 resultColored = result * col;
    
    // both together, with the texture
    vec4 finalResult = resultColored + foamColored;       
    finalResult.rgb += RimResult.rgb;

    // color of backfaces/ top
    vec4 _topColor = topColor * (foam + result);

    //gl_FrontFacing is TRUE for front facing, FALSE for backfacing
    gl_FragColor = gl_FrontFacing ? finalResult : _topColor; 
}
`;