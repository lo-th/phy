import { Pass, Effect, RenderPass, Selection } from './postprocessing.js';
import { ShaderChunk, ShaderLib, UniformsUtils, ShaderMaterial, Uniform, Vector2, Matrix4, Vector3, NoBlending, GLSL3, Clock, Quaternion, NearestFilter, FramebufferTexture, LinearFilter, WebGLRenderTarget, FloatType, DataTexture, RGBAFormat, ClampToEdgeWrapping, LinearMipMapLinearFilter, EquirectangularReflectionMapping, TextureLoader, RepeatWrapping, NoColorSpace, MeshPhysicalMaterial, Color, DepthTexture, RedFormat, Matrix3, HalfFloatType, SRGBColorSpace } from 'three';

// from: https://news.ycombinator.com/item?id=17876741

const g = 1.32471795724474602596090885447809; // Plastic number

const a1 = 1.0 / g;
const a2 = 1.0 / (g * g);
const base = 1.1127756842787055; // harmoniousNumber(7), yields better coverage compared to using 0.5

const generateR2 = count => {
  const points = [];

  for (let n = 0; n < count; n++) {
    points.push([(base + a1 * n) % 1, (base + a2 * n) % 1]);
  }

  return points;
};

const r2Sequence = generateR2(256).map(([a, b]) => [a - 0.5, b - 0.5]);
function jitter(width, height, camera, frame, jitterScale = 1) {
  const [x, y] = r2Sequence[frame % r2Sequence.length];

  if (camera.setViewOffset) {
    camera.setViewOffset(width, height, x * jitterScale, y * jitterScale, width, height);
  }
}

var vertexShader = "#define GLSLIFY 1\nvarying vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,1.0,1.0);}"; // eslint-disable-line

var fragmentShader$7 = "#define GLSLIFY 1\nvarying vec2 vUv;uniform highp sampler2D inputTexture;uniform highp sampler2D velocityTexture;uniform highp sampler2D depthTexture;uniform highp sampler2D lastVelocityTexture;uniform float maxBlend;uniform float neighborhoodClampIntensity;uniform bool fullAccumulate;uniform vec2 invTexSize;uniform float cameraNear;uniform float cameraFar;uniform mat4 projectionMatrix;uniform mat4 projectionMatrixInverse;uniform mat4 cameraMatrixWorld;uniform vec3 cameraPos;uniform vec3 prevCameraPos;uniform mat4 prevViewMatrix;uniform mat4 prevCameraMatrixWorld;uniform mat4 prevProjectionMatrix;uniform mat4 prevProjectionMatrixInverse;uniform float keepData;\n#define EPSILON 0.00001\n#define DIFFUSE_SPECULAR 0\n#define DIFFUSE 1\n#define SPECULAR 2\n#include <gbuffer_packing>\n#include <packing>\n#include <reproject>\nvec3 reprojectedUvDiffuse=vec3(-1.0),reprojectedUvSpecular=vec3(-1.0);void accumulate(inout vec4 outputColor,inout vec4 inp,inout vec4 acc,inout float roughness,inout float moveFactor,bool doReprojectSpecular){vec3 reprojectedUvConfidence=doReprojectSpecular ? reprojectedUvSpecular : reprojectedUvDiffuse;vec2 reprojectedUv=reprojectedUvConfidence.xy;float confidence=reprojectedUvConfidence.z;confidence=pow(confidence,confidencePower);float accumBlend=1.-1./(acc.a+1.0);accumBlend=mix(0.,accumBlend,confidence);float maxValue=(fullAccumulate ? 1. : maxBlend)*keepData;\n#if inputType != DIFFUSE\nconst float roughnessMaximum=0.1;if(doReprojectSpecular&&roughness>=0.0&&roughness<roughnessMaximum){float maxRoughnessValue=mix(0.,maxValue,roughness/roughnessMaximum);maxValue=mix(maxValue,maxRoughnessValue,min(100.*moveFactor,1.));}\n#endif\nfloat temporalReprojectMix=min(accumBlend,maxValue);acc.a=1./(1.-temporalReprojectMix)-1.;acc.a=min(65536.,acc.a);outputColor.rgb=mix(inp.rgb,acc.rgb,temporalReprojectMix);outputColor.a=acc.a;undoColorTransform(outputColor.rgb);}void reproject(inout vec4 inp,inout vec4 acc,sampler2D accumulatedTexture,inout bool wasSampled,bool doNeighborhoodClamp,bool doReprojectSpecular){vec3 uvc=doReprojectSpecular ? reprojectedUvSpecular : reprojectedUvDiffuse;vec2 uv=uvc.xy;acc=sampleReprojectedTexture(accumulatedTexture,uv);transformColor(acc.rgb);if(!wasSampled){inp.rgb=acc.rgb;return;}acc.a++;vec3 clampedColor=acc.rgb;int clampRadius=doReprojectSpecular&&roughness<0.25 ? 1 : 2;clampNeighborhood(inputTexture,clampedColor,inp.rgb,clampRadius,doReprojectSpecular);float r=doReprojectSpecular ? roughness : 1.0;float clampAggressiveness=min(1.,uvc.z*r);float clampIntensity=mix(0.,min(1.,moveFactor*50.+neighborhoodClampIntensity),clampAggressiveness);vec3 newColor=mix(acc.rgb,clampedColor,clampIntensity);float colorDiff=min(length(newColor-acc.rgb),1.);acc.a*=1.-colorDiff;acc.rgb=newColor;}void preprocessInput(inout highp vec4 texel,inout bool sampledThisFrame){sampledThisFrame=texel.r>=0.;texel.rgb=max(texel.rgb,vec3(0.));transformColor(texel.rgb);}void getTexels(inout highp vec4 inputTexel[textureCount],inout bool sampledThisFrame[textureCount]){\n#if inputType == DIFFUSE_SPECULAR\nhighp vec4 tex=textureLod(inputTexture,vUv,0.);unpackTwoVec4(tex,inputTexel[0],inputTexel[1]);preprocessInput(inputTexel[0],sampledThisFrame[0]);preprocessInput(inputTexel[1],sampledThisFrame[1]);\n#else\ninputTexel[0]=textureLod(inputTexture,vUv,0.0);preprocessInput(inputTexel[0],sampledThisFrame[0]);\n#endif\n}void computeGVariables(vec2 dilatedUv,float depth){worldPos=screenSpaceToWorldSpace(dilatedUv,depth,cameraMatrixWorld,projectionMatrixInverse);vec3 viewPos=(viewMatrix*vec4(worldPos,1.0)).xyz;viewDir=normalize(viewPos);vec3 viewNormal=(vec4(worldNormal,0.0)*viewMatrix).xyz;viewAngle=dot(-viewDir,viewNormal);}void computeReprojectedUv(float depth,vec3 worldPos,vec3 worldNormal){reprojectedUvDiffuse=getReprojectedUV(false,depth,worldPos,worldNormal);\n#if inputType == DIFFUSE_SPECULAR || inputType == SPECULAR\nreprojectedUvSpecular=getReprojectedUV(true,depth,worldPos,worldNormal);if(reprojectedUvSpecular.x==-1.0){reprojectedUvSpecular=reprojectedUvDiffuse;}\n#endif\n}void getRoughnessRayLength(inout highp vec4 inputTexel[textureCount]){\n#if inputType == DIFFUSE_SPECULAR\nrayLength=inputTexel[1].a;roughness=clamp(inputTexel[0].a,0.,1.);\n#elif inputType == SPECULAR\nvec2 data=unpackHalf2x16(floatBitsToUint(inputTexel[0].a));rayLength=data.r;roughness=clamp(data.g,0.,1.);\n#endif\n}void main(){vec2 dilatedUv=vUv;getVelocityNormalDepth(dilatedUv,velocity,worldNormal,depth);highp vec4 inputTexel[textureCount],accumulatedTexel[textureCount];bool textureSampledThisFrame[textureCount];getTexels(inputTexel,textureSampledThisFrame);\n#if inputType != DIFFUSE\nif(depth==1.0&&fwidth(depth)==0.0){discard;return;}\n#endif\ncurvature=getCurvature(worldNormal);computeGVariables(dilatedUv,depth);getRoughnessRayLength(inputTexel);computeReprojectedUv(depth,worldPos,worldNormal);moveFactor=min(dot(velocity,velocity)*10000.,1.);\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){reproject(inputTexel[i],accumulatedTexel[i],accumulatedTexture[i],textureSampledThisFrame[i],neighborhoodClamp[i],reprojectSpecular[i]);accumulate(gOutput[i],inputTexel[i],accumulatedTexel[i],roughness,moveFactor,reprojectSpecular[i]);}\n#pragma unroll_loop_end\n}"; // eslint-disable-line

var reproject = "#define GLSLIFY 1\nvec2 dilatedUv,velocity;vec3 worldNormal,worldPos,viewDir;float depth,curvature,viewAngle,rayLength,angleMix;float roughness=1.;float moveFactor=0.;\n#define luminance(a) dot(vec3(0.2125, 0.7154, 0.0721), a)\nfloat getViewZ(const in float depth){\n#ifdef PERSPECTIVE_CAMERA\nreturn perspectiveDepthToViewZ(depth,cameraNear,cameraFar);\n#else\nreturn orthographicDepthToViewZ(depth,cameraNear,cameraFar);\n#endif\n}vec3 screenSpaceToWorldSpace(const vec2 uv,const float depth,mat4 curMatrixWorld,const mat4 projMatrixInverse){vec4 ndc=vec4((uv.x-0.5)*2.0,(uv.y-0.5)*2.0,(depth-0.5)*2.0,1.0);vec4 clip=projMatrixInverse*ndc;vec4 view=curMatrixWorld*(clip/clip.w);return view.xyz;}vec2 viewSpaceToScreenSpace(const vec3 position,const mat4 projMatrix){vec4 projectedCoord=projMatrix*vec4(position,1.0);projectedCoord.xy/=projectedCoord.w;projectedCoord.xy=projectedCoord.xy*0.5+0.5;return projectedCoord.xy;}\n#ifdef logTransform\nvoid transformColor(inout vec3 color){color=log(color+1.);}void undoColorTransform(inout vec3 color){color=exp(color)-1.;}\n#else\n#define transformColor\n#define undoColorTransform\n#endif\nvoid getNeighborhoodAABB(const sampler2D tex,const int clampRadius,inout vec3 minNeighborColor,inout vec3 maxNeighborColor,const bool isSpecular){for(int x=-clampRadius;x<=clampRadius;x++){for(int y=-clampRadius;y<=clampRadius;y++){vec2 offset=vec2(x,y)*invTexSize;vec2 neighborUv=vUv+offset;\n#if inputType == DIFFUSE_SPECULAR\nvec4 t1,t2;vec4 packedNeighborTexel=textureLod(inputTexture,neighborUv,0.0);unpackTwoVec4(packedNeighborTexel,t1,t2);vec4 neighborTexel=isSpecular ? t2 : t1;\n#else\nvec4 neighborTexel=textureLod(inputTexture,neighborUv,0.0);\n#endif\nif(neighborTexel.r>=0.){minNeighborColor=min(neighborTexel.rgb,minNeighborColor);maxNeighborColor=max(neighborTexel.rgb,maxNeighborColor);}}}}void clampNeighborhood(const sampler2D tex,inout vec3 color,vec3 inputColor,const int clampRadius,const bool isSpecular){undoColorTransform(inputColor);vec3 minNeighborColor=inputColor;vec3 maxNeighborColor=inputColor;getNeighborhoodAABB(tex,clampRadius,minNeighborColor,maxNeighborColor,isSpecular);transformColor(minNeighborColor);transformColor(maxNeighborColor);color=clamp(color,minNeighborColor,maxNeighborColor);}void getVelocityNormalDepth(inout vec2 dilatedUv,out vec2 vel,out vec3 normal,out float depth){vec2 centerUv=dilatedUv;vec4 velocityTexel=textureLod(velocityTexture,centerUv,0.0);vel=velocityTexel.rg;normal=unpackNormal(velocityTexel.b);depth=velocityTexel.a;}\n#define PLANE_DISTANCE 20.\n#define WORLD_DISTANCE 20.\n#define NORMAL_DISTANCE 15.\nfloat planeDistanceDisocclusionCheck(const vec3 worldPos,const vec3 lastWorldPos,const vec3 worldNormal,const float distFactor){vec3 toCurrent=worldPos-lastWorldPos;float distToPlane=abs(dot(toCurrent,worldNormal));return distToPlane/PLANE_DISTANCE*distFactor;}float worldDistanceDisocclusionCheck(const vec3 worldPos,const vec3 lastWorldPos,const float distFactor){return length(worldPos-lastWorldPos)/WORLD_DISTANCE*distFactor;}float normalDisocclusionCheck(const vec3 worldNormal,const vec3 lastWorldNormal,const float distFactor){return min(1.-dot(worldNormal,lastWorldNormal),1.)/NORMAL_DISTANCE*distFactor;}float validateReprojectedUV(const vec2 reprojectedUv,const vec3 worldPos,const vec3 worldNormal,const bool isHitPoint){if(reprojectedUv.x>1.0||reprojectedUv.x<0.0||reprojectedUv.y>1.0||reprojectedUv.y<0.0)return 0.;vec2 dilatedReprojectedUv=reprojectedUv;vec2 lastVelocity=vec2(0.0);vec3 lastWorldNormal=vec3(0.0);float lastDepth=0.0;getVelocityNormalDepth(dilatedReprojectedUv,lastVelocity,lastWorldNormal,lastDepth);vec3 lastWorldPos=screenSpaceToWorldSpace(dilatedReprojectedUv,lastDepth,prevCameraMatrixWorld,prevProjectionMatrixInverse);vec3 lastViewPos=(prevViewMatrix*vec4(lastWorldPos,1.0)).xyz;vec3 lastViewDir=normalize(lastViewPos);vec3 lastViewNormal=(vec4(lastWorldNormal,0.0)*prevViewMatrix).xyz;float lastViewAngle=dot(-lastViewDir,lastViewNormal);angleMix=abs(lastViewAngle-viewAngle);float viewZ=abs(getViewZ(depth));float distFactor=1.+1./(viewZ+1.0);float disoccl=0.;disoccl+=worldDistanceDisocclusionCheck(worldPos,lastWorldPos,distFactor);disoccl+=planeDistanceDisocclusionCheck(worldPos,lastWorldPos,worldNormal,distFactor);float confidence=1.-min(disoccl,1.);confidence=max(confidence,0.);confidence=pow(confidence,confidencePower);return confidence;}vec2 reprojectHitPoint(const vec3 rayOrig,const float rayLength){if(curvature>0.05||rayLength<0.01){return vec2(-1.);}vec3 cameraRay=normalize(rayOrig-cameraPos);vec3 parallaxHitPoint=cameraPos+cameraRay*rayLength;vec4 reprojectedHitPoint=prevProjectionMatrix*prevViewMatrix*vec4(parallaxHitPoint,1.0);reprojectedHitPoint.xyz/=reprojectedHitPoint.w;reprojectedHitPoint.xy=reprojectedHitPoint.xy*0.5+0.5;vec2 diffuseUv=vUv-velocity.xy;float m=min(max(0.,roughness-0.25)/0.25,1.);return reprojectedHitPoint.xy;}vec3 getReprojectedUV(const bool doReprojectSpecular,const float depth,const vec3 worldPos,const vec3 worldNormal){if(doReprojectSpecular){vec2 reprojectedUv=reprojectHitPoint(worldPos,rayLength);float confidence=validateReprojectedUV(reprojectedUv,worldPos,worldNormal,true);return vec3(reprojectedUv,confidence);}else{vec2 reprojectedUv=vUv-velocity;float confidence=validateReprojectedUV(reprojectedUv,worldPos,worldNormal,false);return vec3(reprojectedUv,confidence);}}vec4 BiCubicCatmullRom5Tap(sampler2D tex,vec2 P){vec2 Weight[3];vec2 Sample[3];vec2 UV=P/invTexSize;vec2 tc=floor(UV-0.5)+0.5;vec2 f=UV-tc;vec2 f2=f*f;vec2 f3=f2*f;vec2 w0=f2-0.5*(f3+f);vec2 w1=1.5*f3-2.5*f2+vec2(1.);vec2 w3=0.5*(f3-f2);vec2 w2=vec2(1.)-w0-w1-w3;Weight[0]=w0;Weight[1]=w1+w2;Weight[2]=w3;Sample[0]=tc-vec2(1.);Sample[1]=tc+w2/Weight[1];Sample[2]=tc+vec2(2.);Sample[0]*=invTexSize;Sample[1]*=invTexSize;Sample[2]*=invTexSize;float sampleWeight[5];sampleWeight[0]=Weight[1].x*Weight[0].y;sampleWeight[1]=Weight[0].x*Weight[1].y;sampleWeight[2]=Weight[1].x*Weight[1].y;sampleWeight[3]=Weight[2].x*Weight[1].y;sampleWeight[4]=Weight[1].x*Weight[2].y;vec4 Ct=textureLod(tex,vec2(Sample[1].x,Sample[0].y),0.)*sampleWeight[0];vec4 Cl=textureLod(tex,vec2(Sample[0].x,Sample[1].y),0.)*sampleWeight[1];vec4 Cc=textureLod(tex,vec2(Sample[1].x,Sample[1].y),0.)*sampleWeight[2];vec4 Cr=textureLod(tex,vec2(Sample[2].x,Sample[1].y),0.)*sampleWeight[3];vec4 Cb=textureLod(tex,vec2(Sample[1].x,Sample[2].y),0.)*sampleWeight[4];float WeightMultiplier=1./(sampleWeight[0]+sampleWeight[1]+sampleWeight[2]+sampleWeight[3]+sampleWeight[4]);return max((Ct+Cl+Cc+Cr+Cb)*WeightMultiplier,vec4(0.));}vec4 sampleReprojectedTexture(const sampler2D tex,const vec2 reprojectedUv){vec4 catmull=BiCubicCatmullRom5Tap(tex,reprojectedUv);return catmull;}float getCurvature(vec3 n){float curvature=length(fwidth(n));return curvature;}"; // eslint-disable-line

var gbuffer_packing = "#define GLSLIFY 1\nuniform highp sampler2D gBufferTexture;struct Material{highp vec4 diffuse;highp vec3 normal;highp float roughness;highp float metalness;highp vec3 emissive;};\n#define ONE_SAFE 0.999999\n#define NON_ZERO_OFFSET 0.0001\nconst highp float c_precision=256.0;const highp float c_precisionp1=c_precision+1.0;highp float color2float(in highp vec3 color){color=min(color+NON_ZERO_OFFSET,vec3(ONE_SAFE));return floor(color.r*c_precision+0.5)+floor(color.b*c_precision+0.5)*c_precisionp1+floor(color.g*c_precision+0.5)*c_precisionp1*c_precisionp1;}highp vec3 float2color(in highp float value){highp vec3 color;color.r=mod(value,c_precisionp1)/c_precision;color.b=mod(floor(value/c_precisionp1),c_precisionp1)/c_precision;color.g=floor(value/(c_precisionp1*c_precisionp1))/c_precision;color-=NON_ZERO_OFFSET;color=max(color,vec3(0.0));return color;}highp vec2 OctWrap(highp vec2 v){highp vec2 w=1.0-abs(v.yx);if(v.x<0.0)w.x=-w.x;if(v.y<0.0)w.y=-w.y;return w;}highp vec2 encodeOctWrap(highp vec3 n){n/=(abs(n.x)+abs(n.y)+abs(n.z));n.xy=n.z>0.0 ? n.xy : OctWrap(n.xy);n.xy=n.xy*0.5+0.5;return n.xy;}highp vec3 decodeOctWrap(highp vec2 f){f=f*2.0-1.0;highp vec3 n=vec3(f.x,f.y,1.0-abs(f.x)-abs(f.y));highp float t=max(-n.z,0.0);n.x+=n.x>=0.0 ?-t : t;n.y+=n.y>=0.0 ?-t : t;return normalize(n);}highp float packNormal(highp vec3 normal){return uintBitsToFloat(packUnorm2x16(encodeOctWrap(normal)));}highp vec3 unpackNormal(highp float packedNormal){return decodeOctWrap(unpackUnorm2x16(floatBitsToUint(packedNormal)));}highp vec4 packTwoVec4(highp vec4 v1,highp vec4 v2){highp vec4 encoded=vec4(0.0);v1+=NON_ZERO_OFFSET;v2+=NON_ZERO_OFFSET;highp uint v1r=packHalf2x16(v1.rg);highp uint v1g=packHalf2x16(v1.ba);highp uint v2r=packHalf2x16(v2.rg);highp uint v2g=packHalf2x16(v2.ba);encoded.r=uintBitsToFloat(v1r);encoded.g=uintBitsToFloat(v1g);encoded.b=uintBitsToFloat(v2r);encoded.a=uintBitsToFloat(v2g);return encoded;}void unpackTwoVec4(highp vec4 encoded,out highp vec4 v1,out highp vec4 v2){highp uint r=floatBitsToUint(encoded.r);highp uint g=floatBitsToUint(encoded.g);highp uint b=floatBitsToUint(encoded.b);highp uint a=floatBitsToUint(encoded.a);v1.rg=unpackHalf2x16(r);v1.ba=unpackHalf2x16(g);v2.rg=unpackHalf2x16(b);v2.ba=unpackHalf2x16(a);v1-=NON_ZERO_OFFSET;v2-=NON_ZERO_OFFSET;v1=max(v1,vec4(0.0));v2=max(v2,vec4(0.0));}vec4 unpackTwoVec4(highp vec4 encoded,const int index){highp uint r=floatBitsToUint(index==0 ? encoded.r : encoded.b);highp uint g=floatBitsToUint(index==0 ? encoded.g : encoded.a);vec4 v;v.rg=unpackHalf2x16(r);v.ba=unpackHalf2x16(g);v-=NON_ZERO_OFFSET;v=max(v,vec4(0.0));return v;}highp float packVec2(highp vec2 value){value=min(value+NON_ZERO_OFFSET,vec2(ONE_SAFE));return uintBitsToFloat(packUnorm2x16(value));}highp vec2 unpackVec2(highp float packedValue){vec2 v=unpackUnorm2x16(floatBitsToUint(packedValue));v=max(v-NON_ZERO_OFFSET,vec2(0.0));return v;}highp vec4 encodeRGBE8(highp vec3 rgb){highp vec4 vEncoded;highp float maxComponent=max(max(rgb.r,rgb.g),rgb.b);highp float fExp=ceil(log2(maxComponent));vEncoded.rgb=rgb/exp2(fExp);vEncoded.a=(fExp+128.0)/255.0;return vEncoded;}highp vec3 decodeRGBE8(highp vec4 rgbe){highp vec3 vDecoded;highp float fExp=rgbe.a*255.0-128.0;vDecoded=rgbe.rgb*exp2(fExp);return vDecoded;}highp float vec4ToFloat(highp vec4 vec){vec=min(vec+NON_ZERO_OFFSET,vec4(ONE_SAFE));highp uvec4 v=uvec4(vec*255.0);highp uint value=(v.a<<24u)|(v.b<<16u)|(v.g<<8u)|(v.r);return uintBitsToFloat(value);}highp vec4 floatToVec4(highp float f){highp uint value=floatBitsToUint(f);highp vec4 v;v.r=float(value&0xFFu)/255.0;v.g=float((value>>8u)&0xFFu)/255.0;v.b=float((value>>16u)&0xFFu)/255.0;v.a=float((value>>24u)&0xFFu)/255.0;v-=NON_ZERO_OFFSET;v=max(v,vec4(0.0));return v;}highp vec4 packGBuffer(highp vec4 diffuse,highp vec3 normal,highp float roughness,highp float metalness,highp vec3 emissive){highp vec4 gBuffer;gBuffer.r=vec4ToFloat(diffuse);gBuffer.g=packNormal(normal);gBuffer.b=packVec2(vec2(roughness,metalness));gBuffer.a=vec4ToFloat(encodeRGBE8(emissive));return gBuffer;}Material getMaterial(highp sampler2D gBufferTexture,highp vec2 uv){highp vec4 gBuffer=textureLod(gBufferTexture,uv,0.0);highp vec4 diffuse=floatToVec4(gBuffer.r);highp vec3 normal=unpackNormal(gBuffer.g);highp vec2 roughnessMetalness=unpackVec2(gBuffer.b);highp float roughness=roughnessMetalness.r;highp float metalness=roughnessMetalness.g;highp vec3 emissive=decodeRGBE8(floatToVec4(gBuffer.a));return Material(diffuse,normal,roughness,metalness,emissive);}Material getMaterial(highp vec2 uv){return getMaterial(gBufferTexture,uv);}highp vec3 getNormal(highp sampler2D gBufferTexture,highp vec2 uv){return unpackNormal(textureLod(gBufferTexture,uv,0.0).g);}"; // eslint-disable-line

const getMaxMipLevel = texture => {
  const {
    width,
    height
  } = texture.image;
  return Math.floor(Math.log2(Math.max(width, height))) + 1;
};
const createGlobalDisableIblRadianceUniform = () => {
  if (!ShaderChunk.envmap_physical_pars_fragment.includes("iblRadianceDisabled")) {
    ShaderChunk.envmap_physical_pars_fragment = ShaderChunk.envmap_physical_pars_fragment.replace("vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {",
    /* glsl */
    `
		uniform bool iblRadianceDisabled;
	
		vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		 if(iblRadianceDisabled) return vec3(0.);
		`);
  }

  if ("iblRadianceDisabled" in ShaderLib.physical.uniforms) return ShaderLib.physical.uniforms["iblRadianceDisabled"];
  const globalIblRadianceDisabledUniform = {
    value: false
  };
  ShaderLib.physical.uniforms.iblRadianceDisabled = globalIblRadianceDisabledUniform;
  const {
    clone
  } = UniformsUtils;

  UniformsUtils.clone = uniforms => {
    const result = clone(uniforms);

    if ("iblRadianceDisabled" in uniforms) {
      result.iblRadianceDisabled = globalIblRadianceDisabledUniform;
    }

    return result;
  };

  return globalIblRadianceDisabledUniform;
}; // source: https://github.com/mrdoob/three.js/blob/b9bc47ab1978022ab0947a9bce1b1209769b8d91/src/renderers/webgl/WebGLProgram.js#L228
// Unroll Loops

const unrollLoopPattern = /#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;
function unrollLoops(string) {
  return string.replace(unrollLoopPattern, loopReplacer);
}

function loopReplacer(match, start, end, snippet) {
  let string = "";

  for (let i = parseInt(start); i < parseInt(end); i++) {
    string += snippet.replace(/\[\s*i\s*\]/g, "[ " + i + " ]").replace(/UNROLLED_LOOP_INDEX/g, i);
  }

  return string;
} //

/* eslint-disable camelcase */
class TemporalReprojectMaterial extends ShaderMaterial {
  constructor(textureCount = 1) {
    let finalFragmentShader = fragmentShader$7.replace("#include <reproject>", reproject).replace("#include <gbuffer_packing>", gbuffer_packing);
    let definitions = "";

    for (let i = 0; i < textureCount; i++) {
      definitions +=
      /* glsl */
      `
				uniform sampler2D accumulatedTexture${i};

				layout(location = ${i}) out vec4 gOutput${i};
			`;
    }

    finalFragmentShader = definitions + finalFragmentShader.replaceAll("textureCount", textureCount);
    finalFragmentShader = unrollLoops(finalFragmentShader);
    const matches2 = finalFragmentShader.matchAll(/accumulatedTexture\[\s*[0-9]+\s*]/g);

    for (const [key] of matches2) {
      const number = key.replace(/[^0-9]/g, "");
      finalFragmentShader = finalFragmentShader.replace(key, "accumulatedTexture" + number);
    }

    const matches3 = finalFragmentShader.matchAll(/gOutput\[\s*[0-9]+\s*]/g);

    for (const [key] of matches3) {
      const number = key.replace(/[^0-9]/g, "");
      finalFragmentShader = finalFragmentShader.replace(key, "gOutput" + number);
    }

    super({
      type: "TemporalReprojectMaterial",
      uniforms: {
        inputTexture: new Uniform(null),
        velocityTexture: new Uniform(null),
        depthTexture: new Uniform(null),
        lastVelocityTexture: new Uniform(null),
        neighborhoodClampIntensity: new Uniform(0),
        fullAccumulate: new Uniform(false),
        keepData: new Uniform(1),
        delta: new Uniform(0),
        invTexSize: new Uniform(new Vector2()),
        projectionMatrix: new Uniform(new Matrix4()),
        projectionMatrixInverse: new Uniform(new Matrix4()),
        cameraMatrixWorld: new Uniform(new Matrix4()),
        viewMatrix: new Uniform(new Matrix4()),
        prevViewMatrix: new Uniform(new Matrix4()),
        prevCameraMatrixWorld: new Uniform(new Matrix4()),
        prevProjectionMatrix: new Uniform(new Matrix4()),
        prevProjectionMatrixInverse: new Uniform(new Matrix4()),
        cameraPos: new Uniform(new Vector3()),
        prevCameraPos: new Uniform(new Vector3()),
        cameraNear: new Uniform(0),
        cameraFar: new Uniform(0),
        maxBlend: new Uniform(0)
      },
      vertexShader,
      fragmentShader: finalFragmentShader,
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
      glslVersion: GLSL3
    });

    for (let i = 0; i < textureCount; i++) {
      this.uniforms["inputTexture" + i] = new Uniform(null);
      this.uniforms["accumulatedTexture" + i] = new Uniform(null);
    }
  }

}

const isGroundProjectedEnv = c => {
  var _c$material$fragmentS;

  return (_c$material$fragmentS = c.material.fragmentShader) == null ? void 0 : _c$material$fragmentS.includes("float intersection2 = diskIntersectWithBackFaceCulling( camPos, p, h, vec3( 0.0, 1.0, 0.0 ), radius );");
};
const isChildMaterialRenderable = (c, material = c.material) => {
  return material.visible && material.depthWrite && material.depthTest && (!material.transparent || material.opacity > 0) && !isGroundProjectedEnv(c);
};
const didCameraMove = (camera, lastCameraPosition, lastCameraQuaternion) => {
  if (camera.position.distanceToSquared(lastCameraPosition) > 0.000001) {
    return true;
  }

  if (camera.quaternion.angleTo(lastCameraQuaternion) > 0.001) {
    return true;
  }

  return false;
};
const getVisibleChildren$1 = object => {
  const queue = [object];
  const objects = [];

  while (queue.length !== 0) {
    const mesh = queue.shift();
    if (mesh.material) objects.push(mesh);

    for (const c of mesh.children) {
      if (c.visible) queue.push(c);
    }
  }

  return objects;
};

const defaultTemporalReprojectPassOptions = {
  dilation: false,
  fullAccumulate: false,
  neighborhoodClamp: false,
  neighborhoodClampRadius: 1,
  neighborhoodClampIntensity: 1,
  maxBlend: 1,
  logTransform: false,
  depthDistance: 2,
  worldDistance: 4,
  reprojectSpecular: false,
  renderTarget: null,
  copyTextures: true,
  confidencePower: 1,
  inputType: "diffuse"
};
const tmpProjectionMatrix$1 = new Matrix4();
const tmpProjectionMatrixInverse$1 = new Matrix4();
const tmpVec2 = new Vector2();
class TemporalReprojectPass extends Pass {
  constructor(scene, camera, velocityDepthNormalPass, texture, textureCount, options = defaultTemporalReprojectPassOptions) {
    var _indexOf;

    super("TemporalReprojectPass");
    this.needsSwap = false;
    this.overrideAccumulatedTextures = [];
    this.clock = new Clock();
    this.r2Sequence = [];
    this.frame = 0;
    this.lastCameraTransform = {
      position: new Vector3(),
      quaternion: new Quaternion()
    };
    this._scene = scene;
    this._camera = camera;
    this.textureCount = textureCount;
    options = { ...defaultTemporalReprojectPassOptions,
      ...options
    };
    this.renderTarget = new WebGLRenderTarget(1, 1, textureCount, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      type: texture.type,
      depthBuffer: false
    });
    this.renderTarget.texture.forEach((texture, index) => texture.name = "TemporalReprojectPass.accumulatedTexture" + index);
    this.fullscreenMaterial = new TemporalReprojectMaterial(textureCount);
    this.fullscreenMaterial.defines.textureCount = textureCount;
    if (options.dilation) this.fullscreenMaterial.defines.dilation = "";
    if (options.neighborhoodClamp) this.fullscreenMaterial.defines.neighborhoodClamp = "";
    if (options.logTransform) this.fullscreenMaterial.defines.logTransform = "";
    if (camera.isPerspectiveCamera) this.fullscreenMaterial.defines.PERSPECTIVE_CAMERA = "";
    this.fullscreenMaterial.defines.neighborhoodClampRadius = parseInt(options.neighborhoodClampRadius);
    this.fullscreenMaterial.defines.depthDistance = options.depthDistance.toPrecision(5);
    this.fullscreenMaterial.defines.worldDistance = options.worldDistance.toPrecision(5);
    this.fullscreenMaterial.uniforms.fullAccumulate.value = options.fullAccumulate;
    this.fullscreenMaterial.uniforms.neighborhoodClampIntensity.value = options.neighborhoodClampIntensity;
    this.fullscreenMaterial.uniforms.maxBlend.value = options.maxBlend;
    this.fullscreenMaterial.uniforms.projectionMatrix.value = camera.projectionMatrix.clone();
    this.fullscreenMaterial.uniforms.projectionMatrixInverse.value = camera.projectionMatrixInverse.clone();
    this.fullscreenMaterial.uniforms.cameraMatrixWorld.value = camera.matrixWorld;
    this.fullscreenMaterial.uniforms.viewMatrix.value = camera.matrixWorldInverse;
    this.fullscreenMaterial.uniforms.cameraPos.value = camera.position;
    this.fullscreenMaterial.uniforms.prevViewMatrix.value = camera.matrixWorldInverse.clone();
    this.fullscreenMaterial.uniforms.prevCameraMatrixWorld.value = camera.matrixWorld.clone();
    this.fullscreenMaterial.uniforms.prevProjectionMatrix.value = camera.projectionMatrix.clone();
    this.fullscreenMaterial.uniforms.prevProjectionMatrixInverse.value = camera.projectionMatrixInverse.clone();
    this.fullscreenMaterial.uniforms.velocityTexture.value = velocityDepthNormalPass.renderTarget.texture;
    this.fullscreenMaterial.uniforms.depthTexture.value = velocityDepthNormalPass.depthTexture;
    this.fullscreenMaterial.defines.inputType = (_indexOf = ["diffuseSpecular", "diffuse", "specular"].indexOf(options.inputType)) !== null && _indexOf !== void 0 ? _indexOf : 1;

    for (const opt of ["reprojectSpecular", "neighborhoodClamp"]) {
      let value = options[opt];
      if (typeof value !== "array") value = Array(textureCount).fill(value);
      this.fullscreenMaterial.defines[opt] =
      /* glsl */
      `bool[](${value.join(", ")})`;
    }

    this.fullscreenMaterial.defines.confidencePower = options.confidencePower.toPrecision(5);
    this.options = options;
    this.velocityDepthNormalPass = velocityDepthNormalPass;
    this.fullscreenMaterial.uniforms.inputTexture.value = texture;
  }

  dispose() {
    super.dispose();
    this.renderTarget.dispose();
    this.fullscreenMaterial.dispose();
  }

  setSize(width, height) {
    var _this$framebufferText;

    this.renderTarget.setSize(width, height);
    this.fullscreenMaterial.uniforms.invTexSize.value.set(1 / width, 1 / height);
    (_this$framebufferText = this.framebufferTexture) == null ? void 0 : _this$framebufferText.dispose();
    const inputTexture = this.fullscreenMaterial.uniforms.inputTexture.value;
    this.framebufferTexture = new FramebufferTexture(width, height, inputTexture.format);
    this.framebufferTexture.type = inputTexture.type;
    this.framebufferTexture.minFilter = LinearFilter;
    this.framebufferTexture.magFilter = LinearFilter;
    this.framebufferTexture.needsUpdate = true;

    for (let i = 0; i < this.textureCount; i++) {
      var _this$overrideAccumul;

      const accumulatedTexture = (_this$overrideAccumul = this.overrideAccumulatedTextures[i]) !== null && _this$overrideAccumul !== void 0 ? _this$overrideAccumul : this.framebufferTexture;
      this.fullscreenMaterial.uniforms["accumulatedTexture" + i].value = accumulatedTexture;
    }
  }

  get texture() {
    return this.renderTarget.texture[0];
  }

  reset() {
    this.fullscreenMaterial.uniforms.keepData.value = 0;
  }

  render(renderer) {
    this.frame = (this.frame + 1) % 4096;
    const delta = Math.min(1 / 10, this.clock.getDelta());
    this.fullscreenMaterial.uniforms.delta.value = delta;
    tmpProjectionMatrix$1.copy(this._camera.projectionMatrix);
    tmpProjectionMatrixInverse$1.copy(this._camera.projectionMatrixInverse);
    if (this._camera.view) this._camera.view.enabled = false;

    this._camera.updateProjectionMatrix();

    this.fullscreenMaterial.uniforms.projectionMatrix.value.copy(this._camera.projectionMatrix);
    this.fullscreenMaterial.uniforms.projectionMatrixInverse.value.copy(this._camera.projectionMatrixInverse);
    this.fullscreenMaterial.uniforms.lastVelocityTexture.value = this.velocityDepthNormalPass.lastVelocityTexture;
    this.fullscreenMaterial.uniforms.fullAccumulate.value = this.options.fullAccumulate && !didCameraMove(this._camera, this.lastCameraTransform.position, this.lastCameraTransform.quaternion);
    this.lastCameraTransform.position.copy(this._camera.position);
    this.lastCameraTransform.quaternion.copy(this._camera.quaternion);
    if (this._camera.view) this._camera.view.enabled = true;

    this._camera.projectionMatrix.copy(tmpProjectionMatrix$1);

    this._camera.projectionMatrixInverse.copy(tmpProjectionMatrixInverse$1);

    this.fullscreenMaterial.uniforms.cameraNear.value = this._camera.near;
    this.fullscreenMaterial.uniforms.cameraFar.value = this._camera.far;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
    this.fullscreenMaterial.uniforms.keepData.value = 1;

    if (this.overrideAccumulatedTextures.length === 0) {
      this.framebufferTexture.needsUpdate = true;
      renderer.copyFramebufferToTexture(tmpVec2, this.framebufferTexture);
    } // save last transformations


    this.fullscreenMaterial.uniforms.prevCameraMatrixWorld.value.copy(this._camera.matrixWorld);
    this.fullscreenMaterial.uniforms.prevViewMatrix.value.copy(this._camera.matrixWorldInverse);
    this.fullscreenMaterial.uniforms.prevProjectionMatrix.value.copy(this.fullscreenMaterial.uniforms.projectionMatrix.value);
    this.fullscreenMaterial.uniforms.prevProjectionMatrixInverse.value.copy(this.fullscreenMaterial.uniforms.projectionMatrixInverse.value);
    this.fullscreenMaterial.uniforms.prevCameraPos.value.copy(this._camera.position);
  }

  jitter(jitterScale = 1) {
    this.unjitter();
    jitter(this.renderTarget.width, this.renderTarget.height, this._camera, this.frame, jitterScale);
  }

  unjitter() {
    if (this._camera.clearViewOffset) this._camera.clearViewOffset();
  }

}

var traa_compose = "#define GLSLIFY 1\nuniform sampler2D accumulatedTexture;void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){vec4 accumulatedTexel=textureLod(accumulatedTexture,uv,0.);outputColor=vec4(accumulatedTexel.rgb,1.);}"; // eslint-disable-line

class TRAAEffect extends Effect {
  constructor(scene, camera, velocityDepthNormalPass, options = defaultTemporalReprojectPassOptions) {
    super("TRAAEffect", traa_compose, {
      type: "FinalTRAAEffectMaterial",
      uniforms: new Map([["accumulatedTexture", new Uniform(null)]])
    });
    this._scene = scene;
    this._camera = camera;
    this.velocityDepthNormalPass = velocityDepthNormalPass;
    options = { ...options,
      ...{
        maxBlend: 0.9,
        neighborhoodClamp: true,
        neighborhoodClampIntensity: 1,
        neighborhoodClampRadius: 1,
        logTransform: true,
        confidencePower: 4
      }
    };
    this.options = { ...defaultTemporalReprojectPassOptions,
      ...options
    };
    this.setSize(options.width, options.height);
  }

  setSize(width, height) {
    var _this$temporalReproje;

    (_this$temporalReproje = this.temporalReprojectPass) == null ? void 0 : _this$temporalReproje.setSize(width, height);
  }

  dispose() {
    super.dispose();
    this.temporalReprojectPass.dispose();
  }

  reset() {
    this.temporalReprojectPass.reset();
  }

  update(renderer, inputBuffer) {
    if (!this.temporalReprojectPass) {
      this.temporalReprojectPass = new TemporalReprojectPass(this._scene, this._camera, this.velocityDepthNormalPass, inputBuffer.texture, 1, this.options);
      this.temporalReprojectPass.setSize(inputBuffer.width, inputBuffer.height);
      this.uniforms.get("accumulatedTexture").value = this.temporalReprojectPass.texture;
    }

    this.temporalReprojectPass.unjitter();
    this.unjitteredProjectionMatrix = this._camera.projectionMatrix.clone();

    this._camera.projectionMatrix.copy(this.unjitteredProjectionMatrix);

    this.temporalReprojectPass.jitter();
    this.temporalReprojectPass.render(renderer);
  }

}
TRAAEffect.DefaultOptions = defaultTemporalReprojectPassOptions;

class CubeToEquirectEnvPass extends Pass {
  constructor() {
    super("CubeToEquirectEnvPass");
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      type: FloatType
    });
    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader:
      /* glsl */
      `
            varying vec2 vUv;
			uniform samplerCube cubeMap;

			#define M_PI 3.1415926535897932384626433832795
			
			// source: https://github.com/spite/CubemapToEquirectangular/blob/master/src/CubemapToEquirectangular.js
            void main() {
				float longitude = vUv.x * 2. * M_PI - M_PI + M_PI / 2.;
				float latitude = vUv.y * M_PI;

				vec3 dir = vec3(
					- sin( longitude ) * sin( latitude ),
					cos( latitude ),
					- cos( longitude ) * sin( latitude )
				);

				dir.y = -dir.y;

				gl_FragColor = textureCube( cubeMap, dir );
            }
            `,
      vertexShader: vertexShader,
      uniforms: {
        cubeMap: {
          value: null
        }
      },
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false
    });
  }

  dispose() {
    this.renderTarget.dispose();
  }

  generateEquirectEnvMap(renderer, cubeMap, width = null, height = null, maxWidth = 4096) {
    if (width === null && height === null) {
      const w = cubeMap.source.data[0].width;
      const widthEquirect = 2 ** Math.ceil(Math.log2(2 * w * 3 ** 0.5));
      const heightEquirect = 2 ** Math.ceil(Math.log2(w * 3 ** 0.5));
      width = widthEquirect;
      height = heightEquirect;
    }

    if (width > maxWidth) {
      width = maxWidth;
      height = maxWidth / 2;
    }

    this.renderTarget.setSize(width, height);
    this.fullscreenMaterial.uniforms.cubeMap.value = cubeMap;
    const {
      renderTarget
    } = this;
    renderer.setRenderTarget(renderTarget);
    renderer.render(this.scene, this.camera); // Create a new Float32Array to store the pixel data

    const pixelBuffer = new Float32Array(width * height * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, pixelBuffer); // Create a new data texture

    const equirectEnvMap = new DataTexture(pixelBuffer, width, height, RGBAFormat, FloatType); // Set texture options

    equirectEnvMap.wrapS = ClampToEdgeWrapping;
    equirectEnvMap.wrapT = ClampToEdgeWrapping;
    equirectEnvMap.minFilter = LinearMipMapLinearFilter;
    equirectEnvMap.magFilter = LinearMipMapLinearFilter;
    equirectEnvMap.needsUpdate = true;
    equirectEnvMap.mapping = EquirectangularReflectionMapping;
    return equirectEnvMap;
  }

}

var img = "data:image/png;base64,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";
  var blueNoiseImage = img;

var blue_noise = "#define GLSLIFY 1\nuniform sampler2D blueNoiseTexture;uniform vec2 blueNoiseSize;uniform int blueNoiseIndex;uvec4 s1;ivec2 pixel;void rng_initialize(vec2 p,int index){pixel=ivec2(p);s1=uvec4(index,index*15843,index*31+4566,index*2345+58585);}void pcg4d(inout uvec4 v){v=v*1664525u+1013904223u;v.x+=v.y*v.w;v.y+=v.z*v.x;v.z+=v.x*v.y;v.w+=v.y*v.z;v=v ^(v>>16u);v.x+=v.y*v.w;v.y+=v.z*v.x;v.z+=v.x*v.y;v.w+=v.y*v.z;}ivec2 shift2(ivec2 size){pcg4d(s1);return(pixel+ivec2(s1.xy % 0x0fffffffu))% size;}vec4 blueNoise(vec2 uv,int index){if(index==0)return textureLod(blueNoiseTexture,uv*resolution/blueNoiseSize,0.0);rng_initialize(vUv*resolution,index);vec4 blueNoise=texelFetch(blueNoiseTexture,shift2(ivec2(blueNoiseSize)),0);return blueNoise;}vec4 blueNoise(){return blueNoise(vUv,int(blueNoiseIndex));}vec4 blueNoise(vec2 uv){return blueNoise(uv,int(blueNoiseIndex));}"; // eslint-disable-line

/* eslint-disable camelcase */
const blueNoiseSize = 128;
const highestSignedInt = 0x7fffffff;
const blueNoiseTexture = new TextureLoader().load(blueNoiseImage, () => {
  blueNoiseTexture.minFilter = NearestFilter;
  blueNoiseTexture.magFilter = NearestFilter;
  blueNoiseTexture.wrapS = RepeatWrapping;
  blueNoiseTexture.wrapT = RepeatWrapping;
  blueNoiseTexture.colorSpace = NoColorSpace;
});
const setupBlueNoise = fragmentShader => {
  let blueNoiseIndex = 0;
  const startIndex = Math.floor(Math.random() * highestSignedInt);
  const uniforms = {
    blueNoiseTexture: {
      value: blueNoiseTexture
    },
    blueNoiseSize: {
      value: new Vector2(blueNoiseSize, blueNoiseSize)
    },
    blueNoiseIndex: {
      get value() {
        blueNoiseIndex = (startIndex + blueNoiseIndex + 1) % highestSignedInt;
        return blueNoiseIndex;
      },

      set value(v) {
        blueNoiseIndex = v;
      }

    }
  };
  fragmentShader = fragmentShader.replace("uniform vec2 resolution;", "uniform vec2 resolution;\n" + blue_noise);
  return {
    uniforms,
    fragmentShader
  };
};
const useBlueNoise = material => {
  const {
    fragmentShader,
    uniforms
  } = setupBlueNoise(material.fragmentShader);
  material.fragmentShader = fragmentShader;
  material.uniforms = { ...material.uniforms,
    ...uniforms
  };
  material.needsUpdate = true;
};

/* eslint-disable camelcase */

class GBufferMaterial extends MeshPhysicalMaterial {
  onBeforeCompile(shader) {
    this.uniforms = shader.uniforms;
    shader.uniforms.resolution = {
      value: new Vector2(1, 1)
    };
    shader.uniforms.cameraNotMovedFrames = {
      value: 0
    }; // delete all includes that have the pattern "#include <lights_something>"

    shader.vertexShader = shader.vertexShader.replace(/#include <lights_.*>/g, "");
    shader.fragmentShader = shader.fragmentShader.replace(/#include <lights_.*>/g, ""); // delete all includes that have the pattern "#include <alpha...>"

    shader.vertexShader = shader.vertexShader.replace(/#include <alpha.*>/g, "");
    shader.fragmentShader = shader.fragmentShader.replace(/#include <alpha.*>/g, ""); // delete all includes that have the pattern "#include <aomap...>"

    shader.vertexShader = shader.vertexShader.replace(/#include <aomap.*>/g, "");
    shader.fragmentShader = shader.fragmentShader.replace(/#include <aomap.*>/g, ""); // delete all includes that have the pattern "#include <lightmap...>"

    shader.vertexShader = shader.vertexShader.replace(/#include <lightmap.*>/g, "");
    shader.fragmentShader = shader.fragmentShader.replace(/#include <lightmap.*>/g, ""); // delete all includes that have the pattern "#include <alphahash...>"

    shader.vertexShader = shader.vertexShader.replace(/#include <alphahash.*>/g, "");
    shader.fragmentShader = shader.fragmentShader.replace(/#include <alphahash.*>/g, ""); // delete all includes that have the pattern "#include <alphatest...>"

    shader.vertexShader = shader.vertexShader.replace(/#include <alphatest.*>/g, "");
    shader.fragmentShader = shader.fragmentShader.replace(/#include <alphatest.*>/g, ""); // remove opaque_fragment include

    shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", ""); // remove colorspace_fragment include

    shader.fragmentShader = shader.fragmentShader.replace("#include <colorspace_fragment>", ""); // delete the fog_fragment include

    shader.fragmentShader = shader.fragmentShader.replace("#include <fog_fragment>", "");
    shader.fragmentShader = shader.fragmentShader.replace("void main() {",
    /* glsl */
    `
			#define vUv gl_FragCoord.xy
            uniform vec2 resolution;
            uniform float cameraNotMovedFrames;

            ${gbuffer_packing}

            void main() {
					float a = opacity;

					#ifdef USE_ALPHAMAP
						a *= texture2D( alphaMap, vAlphaMapUv ).g;
					#endif

					if (cameraNotMovedFrames == 0.) {
						if(a < 0.5) {
							discard;
							return;
						}

						a = 1.;
					} else if (a != 1.) {
						float aStep = a > 0.5 ? 1. : 0.;
						a = mix(a, aStep, (1. / (cameraNotMovedFrames * 0.1 + 1.)));

						vec4 noise = blueNoise();
						if (noise.x > a) {
							discard;
							return;
						}
					}
        `).replace("#include <dithering_fragment>",
    /* glsl */
    `
            #include <dithering_fragment>

            vec3 worldNormal = normalize((vec4(normal, 1.) * viewMatrix).xyz);

            vec4 gBuffer = packGBuffer(diffuseColor, worldNormal, roughnessFactor, metalnessFactor, totalEmissiveRadiance);

            gl_FragColor = gBuffer;`);
    const {
      uniforms,
      fragmentShader
    } = setupBlueNoise(shader.fragmentShader);
    shader.uniforms = { ...shader.uniforms,
      ...uniforms
    };
    shader.fragmentShader = fragmentShader;
  }

}

const gBufferMaterial = new GBufferMaterial();
function createGBufferMaterial(originalMaterial) {
  const material = gBufferMaterial.clone();
  copyAllPropsToGBufferMaterial(originalMaterial, material);
  return material;
}
let props = Object.keys(gBufferMaterial); // delete the ones that start with "_"

props = props.filter(key => !key.startsWith("_") && !key.startsWith("is") && key !== "uuid" && key !== "type" && key !== "transparent"); // this function attempts to copy all the props from the original material to the new GBufferMaterial

function copyAllPropsToGBufferMaterial(originalMaterial, gBufferMaterial) {
  for (const key of props) {
    if (originalMaterial[key] !== undefined) {
      gBufferMaterial[key] = originalMaterial[key];
    }
  }
}

const propsPrimitive = props.filter(key => typeof gBufferMaterial[key] === "string" || typeof gBufferMaterial[key] === "number");
function copyPropsToGBufferMaterial(originalMaterial, gBufferMaterial) {
  for (const prop of propsPrimitive) {
    gBufferMaterial[prop] = originalMaterial[prop];
  }
}

const backgroundColor$1 = new Color(0);
class GBufferPass extends Pass {
  constructor(scene, camera) {
    super("GBufferPass");
    this.frame = 21483;
    this.cachedMaterials = new WeakMap();
    this.visibleMeshes = [];
    this.lastCameraPosition = new Vector3();
    this.lastCameraQuaternion = new Quaternion();
    this._scene = scene;
    this._camera = camera;
    this.initGBufferRenderTarget();
  }

  get texture() {
    return this.renderTarget.texture;
  }

  get depthTexture() {
    return this.renderTarget.depthTexture;
  }

  initGBufferRenderTarget() {
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      type: FloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: true
    });
    this.renderTarget.texture.name = "GBufferPass.Texture";
    this.renderTarget.depthTexture = new DepthTexture(1, 1);
    this.renderTarget.depthTexture.type = FloatType;
    this.renderTarget.depthTexture.name = "GBufferPass.DepthTexture";
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);
  }

  dispose() {
    super.dispose();
    this.renderTarget.dispose();
  }

  setGBufferMaterialInScene() {
    this.visibleMeshes = getVisibleChildren$1(this._scene);
    const cameraMoved = didCameraMove(this._camera, this.lastCameraPosition, this.lastCameraQuaternion);

    for (const c of this.visibleMeshes) {
      const originalMaterial = c.material;
      let [cachedOriginalMaterial, gBufferMaterial] = this.cachedMaterials.get(c) || []; // init a new material if the original material changed or if the cached material is missing

      if (originalMaterial !== cachedOriginalMaterial) {
        if (gBufferMaterial) gBufferMaterial.dispose();
        gBufferMaterial = createGBufferMaterial(originalMaterial);
        this.cachedMaterials.set(c, [originalMaterial, gBufferMaterial]);
      } // gBufferMaterial.uniforms.resolution.value.set(this.renderTarget.width, this.renderTarget.height)
      // gBufferMaterial.uniforms.frame.value = this.frame


      if (gBufferMaterial.uniforms) {
        gBufferMaterial.uniforms.cameraNotMovedFrames.value = cameraMoved ? 0 : (gBufferMaterial.uniforms.cameraNotMovedFrames.value + 1) % 0xffff;
      }

      c.visible = isChildMaterialRenderable(c, originalMaterial);
      copyPropsToGBufferMaterial(originalMaterial, gBufferMaterial);
      c.material = gBufferMaterial;
    }
  }

  unsetGBufferMaterialInScene() {
    for (const c of this.visibleMeshes) {
      const [originalMaterial] = this.cachedMaterials.get(c);
      c.material = originalMaterial;
    }
  }

  render(renderer) {
    this.frame = (this.frame + 1) % 4096;
    const {
      background
    } = this._scene;
    this._scene.background = backgroundColor$1;
    this.setGBufferMaterialInScene();
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this._scene, this._camera);
    this.unsetGBufferMaterialInScene(); // reset state

    this.lastCameraPosition.copy(this._camera.position);
    this.lastCameraQuaternion.copy(this._camera.quaternion);
    this._scene.background = background;
  }

}

var fragmentShader$6 = "#define GLSLIFY 1\nvarying vec2 vUv;uniform sampler2D accumulatedTexture;uniform highp sampler2D depthTexture;uniform highp sampler2D velocityTexture;uniform sampler2D directLightTexture;uniform vec3 backgroundColor;uniform mat4 projectionMatrix;uniform mat4 projectionMatrixInverse;uniform mat4 cameraMatrixWorld;uniform float maxEnvMapMipLevel;uniform float rayDistance;uniform float thickness;uniform float envBlur;uniform vec2 resolution;uniform float cameraNear;uniform float cameraFar;uniform float nearMinusFar;uniform float nearMulFar;uniform float farMinusNear;struct EquirectHdrInfo{sampler2D marginalWeights;sampler2D conditionalWeights;sampler2D map;vec2 size;float totalSumWhole;float totalSumDecimal;};uniform EquirectHdrInfo envMapInfo;\n#define INVALID_RAY_COORDS vec2(-1.0);\n#define EPSILON 0.00001\n#define ONE_MINUS_EPSILON 1.0 - EPSILON\nvec2 invTexSize;\n#define MODE_SSGI 0\n#define MODE_SSR 1\n#include <packing>\n#include <gbuffer_packing>\n#include <ssgi_utils>\nvec2 RayMarch(inout vec3 dir,inout vec3 hitPos,vec4 random);vec2 BinarySearch(inout vec3 dir,inout vec3 hitPos);struct RayTracingInfo{float NoV;float NoL;float NoH;float LoH;float VoH;bool isDiffuseSample;bool isEnvSample;};struct RayTracingResult{vec3 gi;vec3 l;vec3 hitPos;bool isMissedRay;vec3 brdf;float pdf;};struct EnvMisSample{float pdf;float probability;bool isEnvSample;};vec3 worldNormal;vec3 doSample(const vec3 viewPos,const vec3 viewDir,const vec3 viewNormal,const vec3 worldPos,const float metalness,const float roughness,const bool isDiffuseSample,const bool isEnvSample,const float NoV,const float NoL,const float NoH,const float LoH,const float VoH,const vec4 random,inout vec3 l,inout vec3 hitPos,out bool isMissedRay,out vec3 brdf,out float pdf);void calculateAngles(inout vec3 h,inout vec3 l,inout vec3 v,inout vec3 n,inout float NoL,inout float NoH,inout float LoH,inout float VoH){h=normalize(v+l);NoL=clamp(dot(n,l),EPSILON,ONE_MINUS_EPSILON);NoH=clamp(dot(n,h),EPSILON,ONE_MINUS_EPSILON);LoH=clamp(dot(l,h),EPSILON,ONE_MINUS_EPSILON);VoH=clamp(dot(v,h),EPSILON,ONE_MINUS_EPSILON);}vec3 worldPos;Material mat;void main(){float unpackedDepth=textureLod(depthTexture,vUv,0.0).r;if(unpackedDepth==1.0){vec4 directLight=textureLod(directLightTexture,vUv,0.0);gl_FragColor=packTwoVec4(directLight,directLight);return;}mat=getMaterial(gBufferTexture,vUv);float roughnessSq=clamp(mat.roughness*mat.roughness,0.000001,1.0);invTexSize=1./resolution;float viewZ=getViewZ(unpackedDepth);vec3 viewPos=getViewPosition(viewZ);vec3 viewDir=normalize(viewPos);worldNormal=mat.normal;vec3 viewNormal=normalize((vec4(worldNormal,0.)*cameraMatrixWorld).xyz);worldPos=(cameraMatrixWorld*vec4(viewPos,1.)).xyz;vec3 n=viewNormal;vec3 v=-viewDir;float NoV=max(EPSILON,dot(n,v));vec3 V=(vec4(v,0.)*viewMatrix).xyz;vec3 N=worldNormal;vec4 random;vec3 H,l,h,F,T,B,envMisDir,gi;highp vec3 diffuseGI,specularGI,brdf,hitPos,specularHitPos;Onb(N,T,B);V=ToLocal(T,B,N,V);vec3 f0=mix(vec3(0.04),mat.diffuse.rgb,mat.metalness);float NoL,NoH,LoH,VoH,diffW,specW,invW,pdf,envPdf,diffuseSamples,specularSamples;bool isDiffuseSample,isEnvSample,isMissedRay;random=blueNoise();H=SampleGGXVNDF(V,roughnessSq,roughnessSq,random.r,random.g);if(H.z<0.0)H=-H;l=normalize(reflect(-V,H));l=ToWorld(T,B,N,l);l=(vec4(l,0.)*cameraMatrixWorld).xyz;l=normalize(l);calculateAngles(h,l,v,n,NoL,NoH,LoH,VoH);\n#if mode == MODE_SSGI\nF=F_Schlick(f0,VoH);diffW=(1.-mat.metalness)*luminance(mat.diffuse.rgb);specW=luminance(F);diffW=max(diffW,EPSILON);specW=max(specW,EPSILON);invW=1./(diffW+specW);diffW*=invW;isDiffuseSample=random.b<diffW;\n#else\nisDiffuseSample=false;\n#endif\nEnvMisSample ems;ems.pdf=1.;envMisDir=vec3(0.0);envPdf=1.;\n#ifdef importanceSampling\nems.pdf=sampleEquirectProbability(envMapInfo,random.rg,envMisDir);envMisDir=normalize((vec4(envMisDir,0.)*cameraMatrixWorld).xyz);ems.probability=dot(envMisDir,viewNormal);ems.probability*=mat.roughness;ems.probability=min(ONE_MINUS_EPSILON,ems.probability);ems.isEnvSample=random.a<ems.probability;if(ems.isEnvSample){ems.pdf/=1.-ems.probability;l=envMisDir;calculateAngles(h,l,v,n,NoL,NoH,LoH,VoH);}else{ems.pdf=1.-ems.probability;}\n#endif\nvec3 diffuseRay=ems.isEnvSample ? envMisDir : cosineSampleHemisphere(viewNormal,random.rg);vec3 specularRay=ems.isEnvSample ? envMisDir : l;\n#if mode == MODE_SSGI\nif(isDiffuseSample){l=diffuseRay;calculateAngles(h,l,v,n,NoL,NoH,LoH,VoH);gi=doSample(viewPos,viewDir,viewNormal,worldPos,mat.metalness,roughnessSq,isDiffuseSample,ems.isEnvSample,NoV,NoL,NoH,LoH,VoH,random,l,hitPos,isMissedRay,brdf,pdf);gi*=brdf;if(ems.isEnvSample){gi*=misHeuristic(ems.pdf,pdf);}else{gi/=pdf;}gi/=ems.pdf;diffuseSamples++;diffuseGI=mix(diffuseGI,gi,1./diffuseSamples);}\n#endif\nl=specularRay;calculateAngles(h,l,v,n,NoL,NoH,LoH,VoH);gi=doSample(viewPos,viewDir,viewNormal,worldPos,mat.metalness,roughnessSq,isDiffuseSample,ems.isEnvSample,NoV,NoL,NoH,LoH,VoH,random,l,hitPos,isMissedRay,brdf,pdf);gi*=brdf;if(ems.isEnvSample){gi*=misHeuristic(ems.pdf,pdf);}else{gi/=pdf;}gi/=ems.pdf;specularHitPos=hitPos;specularSamples++;specularGI=mix(specularGI,gi,1./specularSamples);\n#ifdef useDirectLight\nvec3 directLight=textureLod(directLightTexture,vUv,0.).rgb;diffuseGI+=directLight;specularGI+=directLight;\n#endif\nhighp vec4 gDiffuse,gSpecular;\n#if mode == MODE_SSGI\nif(diffuseSamples==0.0)diffuseGI=vec3(-1.0);gDiffuse=vec4(diffuseGI,mat.roughness);\n#endif\nhighp float rayLength=0.0;vec4 hitPosWS;vec3 cameraPosWS=cameraMatrixWorld[3].xyz;isMissedRay=hitPos.x>10.0e8;if(!isMissedRay){hitPosWS=cameraMatrixWorld*vec4(specularHitPos,1.0);rayLength=distance(cameraPosWS,hitPosWS.xyz);}highp uint packedRoughnessRayLength=packHalf2x16(vec2(rayLength,mat.roughness));highp float a=uintBitsToFloat(packedRoughnessRayLength);\n#if mode == MODE_SSGI\ngSpecular=vec4(specularGI,rayLength);gDiffuse.rgb=max(gDiffuse.rgb,vec3(0.));gl_FragColor=packTwoVec4(gDiffuse,gSpecular);\n#else\ngSpecular=vec4(specularGI,a);gl_FragColor=gSpecular;\n#endif\n}vec3 getEnvColor(vec3 l,vec3 worldPos,float roughness,bool isDiffuseSample,bool isEnvSample){vec3 envMapSample;\n#ifdef USE_ENVMAP\nvec3 reflectedWS=normalize((vec4(l,0.)*viewMatrix).xyz);\n#ifdef BOX_PROJECTED_ENV_MAP\nreflectedWS=parallaxCorrectNormal(reflectedWS.xyz,envMapSize,envMapPosition,worldPos);reflectedWS=normalize(reflectedWS.xyz);\n#endif\nfloat mip=envBlur*maxEnvMapMipLevel;envMapSample=sampleEquirectEnvMapColor(reflectedWS,envMapInfo.map,mip);float maxEnvLum=isEnvSample ? 100.0 : 25.0;if(maxEnvLum!=0.0){float envLum=luminance(envMapSample);if(envLum>maxEnvLum){envMapSample*=maxEnvLum/envLum;}}return envMapSample;\n#else\nreturn vec3(0.0);\n#endif\n}float getSaturation(vec3 c){float maxComponent=max(max(c.r,c.g),c.b);float minComponent=min(min(c.r,c.g),c.b);float delta=maxComponent-minComponent;if(maxComponent==minComponent){return 0.0;}else{return delta/maxComponent;}}vec3 doSample(const vec3 viewPos,const vec3 viewDir,const vec3 viewNormal,const vec3 worldPos,const float metalness,const float roughness,const bool isDiffuseSample,const bool isEnvSample,const float NoV,const float NoL,const float NoH,const float LoH,const float VoH,const vec4 random,inout vec3 l,inout vec3 hitPos,out bool isMissedRay,out vec3 brdf,out float pdf){float cosTheta=max(0.0,dot(viewNormal,l));if(isDiffuseSample){vec3 diffuseBrdf=evalDisneyDiffuse(NoL,NoV,LoH,roughness,metalness);pdf=NoL/M_PI;brdf=diffuseBrdf;}else{vec3 specularBrdf=evalDisneySpecular(roughness,NoH,NoV,NoL);pdf=GGXVNDFPdf(NoH,NoV,roughness);brdf=specularBrdf;}brdf*=cosTheta;pdf=max(EPSILON,pdf);hitPos=viewPos;vec2 coords=RayMarch(l,hitPos,random);bool allowMissedRays=false;\n#ifdef missedRays\nallowMissedRays=true;\n#endif\nisMissedRay=hitPos.x==10.0e9;vec3 envMapSample=vec3(0.);if(isMissedRay&&!allowMissedRays)return getEnvColor(l,worldPos,roughness,isDiffuseSample,isEnvSample);vec4 velocity=textureLod(velocityTexture,coords.xy,0.0);vec2 reprojectedUv=coords.xy-velocity.xy;vec3 SSGI;vec3 envColor=getEnvColor(l,worldPos,roughness,isDiffuseSample,isEnvSample);if(reprojectedUv.x>=0.0&&reprojectedUv.x<=1.0&&reprojectedUv.y>=0.0&&reprojectedUv.y<=1.0){vec4 reprojectedGI=textureLod(accumulatedTexture,reprojectedUv,0.);float saturation=getSaturation(mat.diffuse.rgb);reprojectedGI.rgb=mix(reprojectedGI.rgb,vec3(luminance(reprojectedGI.rgb)),(1.-roughness)*saturation*0.4);SSGI=reprojectedGI.rgb;float aspect=resolution.x/resolution.y;float border=0.15;float borderFactor=smoothstep(0.0,border,coords.x)*smoothstep(1.0,1.0-border,coords.x)*smoothstep(0.0,border,coords.y)*smoothstep(1.0,1.0-border,coords.y);borderFactor=sqrt(borderFactor);SSGI=mix(envColor,SSGI,borderFactor);}else{return envColor;}if(allowMissedRays){float ssgiLum=luminance(SSGI);float envLum=luminance(envMapSample);if(envLum>ssgiLum)SSGI=envMapSample;}return SSGI;}vec2 RayMarch(inout vec3 dir,inout vec3 hitPos,vec4 random){float rayHitDepthDifference;hitPos+=dir*0.05;dir*=rayDistance/float(steps);vec2 uv;for(int i=1;i<steps;i++){float cs=1.-exp(-0.25*pow(float(i)+random.b-0.5,2.));hitPos+=dir*cs;uv=viewSpaceToScreenSpace(hitPos);float unpackedDepth=textureLod(depthTexture,uv,0.0).r;float z=getViewZ(unpackedDepth);rayHitDepthDifference=z-hitPos.z;if(rayHitDepthDifference>=0.0&&rayHitDepthDifference<thickness){if(refineSteps==0){return uv;}else{return BinarySearch(dir,hitPos);}}}hitPos.xyz=vec3(10.0e9);return uv;}vec2 BinarySearch(inout vec3 dir,inout vec3 hitPos){float rayHitDepthDifference;vec2 uv;dir*=0.5;hitPos-=dir;for(int i=0;i<refineSteps;i++){uv=viewSpaceToScreenSpace(hitPos);float unpackedDepth=textureLod(depthTexture,uv,0.0).r;float z=getViewZ(unpackedDepth);rayHitDepthDifference=z-hitPos.z;dir*=0.5;if(rayHitDepthDifference>=0.0){hitPos-=dir;}else{hitPos+=dir;}}uv=viewSpaceToScreenSpace(hitPos);return uv;}"; // eslint-disable-line

var ssgi_utils = "#define GLSLIFY 1\n#define PI M_PI\n#define luminance(a) dot(vec3(0.2125, 0.7154, 0.0721), a)\nfloat getViewZ(const in float depth){\n#ifdef PERSPECTIVE_CAMERA\nreturn nearMulFar/(farMinusNear*depth-cameraFar);\n#else\nreturn depth*nearMinusFar-cameraNear;\n#endif\n}vec3 getViewPosition(float viewZ){float clipW=projectionMatrix[2][3]*viewZ+projectionMatrix[3][3];vec4 clipPosition=vec4((vec3(vUv,viewZ)-0.5)*2.0,1.0);clipPosition*=clipW;vec3 p=(projectionMatrixInverse*clipPosition).xyz;p.z=viewZ;return p;}vec2 viewSpaceToScreenSpace(const vec3 position){vec4 projectedCoord=projectionMatrix*vec4(position,1.0);projectedCoord.xy/=projectedCoord.w;projectedCoord.xy=projectedCoord.xy*0.5+0.5;return projectedCoord.xy;}vec3 worldSpaceToViewSpace(vec3 worldPosition){vec4 viewPosition=viewMatrix*vec4(worldPosition,1.0);return viewPosition.xyz/viewPosition.w;}\n#ifdef BOX_PROJECTED_ENV_MAP\nuniform vec3 envMapSize;uniform vec3 envMapPosition;vec3 parallaxCorrectNormal(const vec3 v,const vec3 cubeSize,const vec3 cubePos,const vec3 worldPosition){vec3 nDir=normalize(v);vec3 rbmax=(.5*cubeSize+cubePos-worldPosition)/nDir;vec3 rbmin=(-.5*cubeSize+cubePos-worldPosition)/nDir;vec3 rbminmax;rbminmax.x=(nDir.x>0.)? rbmax.x : rbmin.x;rbminmax.y=(nDir.y>0.)? rbmax.y : rbmin.y;rbminmax.z=(nDir.z>0.)? rbmax.z : rbmin.z;float correction=min(min(rbminmax.x,rbminmax.y),rbminmax.z);vec3 boxIntersection=worldPosition+nDir*correction;return boxIntersection-cubePos;}\n#endif\n#define M_PI 3.1415926535897932384626433832795\nvec2 equirectDirectionToUv(const vec3 direction){vec2 uv=vec2(atan(direction.z,direction.x),acos(direction.y));uv/=vec2(2.0*M_PI,M_PI);uv.x+=0.5;uv.y=1.0-uv.y;return uv;}vec3 equirectUvToDirection(vec2 uv){uv.x-=0.5;uv.y=1.0-uv.y;float theta=uv.x*2.0*PI;float phi=uv.y*PI;float sinPhi=sin(phi);return vec3(sinPhi*cos(theta),cos(phi),sinPhi*sin(theta));}vec3 sampleEquirectEnvMapColor(const vec3 direction,const sampler2D map,const float lod){return textureLod(map,equirectDirectionToUv(direction),lod).rgb;}mat3 getBasisFromNormal(const vec3 normal){vec3 other;if(abs(normal.x)>0.5){other=vec3(0.0,1.0,0.0);}else{other=vec3(1.0,0.0,0.0);}vec3 ortho=normalize(cross(normal,other));vec3 ortho2=normalize(cross(normal,ortho));return mat3(ortho2,ortho,normal);}vec3 F_Schlick(const vec3 f0,const float theta){return f0+(1.-f0)*pow(1.0-theta,5.);}float F_Schlick(const float f0,const float f90,const float theta){return f0+(f90-f0)*pow(1.0-theta,5.0);}float D_GTR(const float roughness,const float NoH,const float k){float a2=pow(roughness,2.);return a2/(PI*pow((NoH*NoH)*(a2*a2-1.)+1.,k));}float SmithG(const float NDotV,const float alphaG){float a=alphaG*alphaG;float b=NDotV*NDotV;return(2.0*NDotV)/(NDotV+sqrt(a+b-a*b));}float GGXVNDFPdf(const float NoH,const float NoV,const float roughness){float D=D_GTR(roughness,NoH,2.);float G1=SmithG(NoV,roughness*roughness);return(D*G1)/max(0.00001,4.0*NoV);}float GeometryTerm(const float NoL,const float NoV,const float roughness){float a2=roughness*roughness;float G1=SmithG(NoV,a2);float G2=SmithG(NoL,a2);return G1*G2;}vec3 evalDisneyDiffuse(const float NoL,const float NoV,const float LoH,const float roughness,const float metalness){float FD90=0.5+2.*roughness*pow(LoH,2.);float a=F_Schlick(1.,FD90,NoL);float b=F_Schlick(1.,FD90,NoV);return vec3((a*b/PI)*(1.-metalness));}vec3 evalDisneySpecular(const float roughness,const float NoH,const float NoV,const float NoL){float D=D_GTR(roughness,NoH,2.);float G=GeometryTerm(NoL,NoV,pow(0.5+roughness*.5,2.));vec3 spec=vec3(D*G/(4.*NoL*NoV));return spec;}vec3 SampleGGXVNDF(const vec3 V,const float ax,const float ay,const float r1,const float r2){vec3 Vh=normalize(vec3(ax*V.x,ay*V.y,V.z));float lensq=Vh.x*Vh.x+Vh.y*Vh.y;vec3 T1=lensq>0. ? vec3(-Vh.y,Vh.x,0.)*inversesqrt(lensq): vec3(1.,0.,0.);vec3 T2=cross(Vh,T1);float r=sqrt(r1);float phi=2.0*PI*r2;float t1=r*cos(phi);float t2=r*sin(phi);float s=0.5*(1.0+Vh.z);t2=(1.0-s)*sqrt(1.0-t1*t1)+s*t2;vec3 Nh=t1*T1+t2*T2+sqrt(max(0.0,1.0-t1*t1-t2*t2))*Vh;return normalize(vec3(ax*Nh.x,ay*Nh.y,max(0.0,Nh.z)));}void Onb(const vec3 N,inout vec3 T,inout vec3 B){vec3 up=abs(N.z)<0.9999999 ? vec3(0,0,1): vec3(1,0,0);T=normalize(cross(up,N));B=cross(N,T);}vec3 ToLocal(const vec3 X,const vec3 Y,const vec3 Z,const vec3 V){return vec3(dot(V,X),dot(V,Y),dot(V,Z));}vec3 ToWorld(const vec3 X,const vec3 Y,const vec3 Z,const vec3 V){return V.x*X+V.y*Y+V.z*Z;}vec3 cosineSampleHemisphere(const vec3 n,const vec2 u){float r=sqrt(u.x);float theta=2.0*PI*u.y;vec3 b=normalize(cross(n,vec3(0.0,1.0,1.0)));vec3 t=cross(b,n);return normalize(r*sin(theta)*b+sqrt(1.0-u.x)*n+r*cos(theta)*t);}float equirectDirectionPdf(vec3 direction){vec2 uv=equirectDirectionToUv(direction);float theta=uv.y*PI;float sinTheta=sin(theta);if(sinTheta==0.0){return 0.0;}return 1.0/(2.0*PI*PI*sinTheta);}float sampleEquirectProbability(EquirectHdrInfo info,vec2 blueNoise,out vec3 direction){float v=textureLod(info.marginalWeights,vec2(blueNoise.x,0.0),0.).x;float u=textureLod(info.conditionalWeights,vec2(blueNoise.y,v),0.).x;vec2 uv=vec2(u,v);vec3 derivedDirection=equirectUvToDirection(uv);direction=derivedDirection;vec3 color=texture(info.map,uv).rgb;float totalSum=info.totalSumWhole+info.totalSumDecimal;float lum=luminance(color);float pdf=lum/totalSum;return info.size.x*info.size.y*pdf;}float misHeuristic(float a,float b){float aa=a*a;float bb=b*b;return aa/(aa+bb);}vec3 alignToNormal(const vec3 normal,const vec3 direction){vec3 tangent;vec3 bitangent;Onb(normal,tangent,bitangent);vec3 localDir=ToLocal(tangent,bitangent,normal,direction);vec3 localDirAligned=vec3(localDir.x,localDir.y,abs(localDir.z));vec3 alignedDir=ToWorld(tangent,bitangent,normal,localDirAligned);return alignedDir;}float getFlatness(vec3 g,vec3 rp){vec3 gw=fwidth(g);vec3 pw=fwidth(rp);float wfcurvature=length(gw)/length(pw);wfcurvature=smoothstep(0.0,30.,wfcurvature);return clamp(wfcurvature,0.,1.);}"; // eslint-disable-line

// source: https://github.com/gkjohnson/three-gpu-pathtracer/blob/main/src/uniforms/EquirectHdrInfoUniform.js

const workerOnMessage = ({
  data: {
    width,
    height,
    isFloatType,
    flipY,
    data
  }
}) => {
  // from: https://github.com/mrdoob/three.js/blob/dev/src/extras/DataUtils.js
  // importing modules doesn't seem to work for workers that were generated through createObjectURL() for some reason
  const _tables = /* @__PURE__*/_generateTables();

  function _generateTables() {
    // float32 to float16 helpers
    const buffer = new ArrayBuffer(4);
    const floatView = new Float32Array(buffer);
    const uint32View = new Uint32Array(buffer);
    const baseTable = new Uint32Array(512);
    const shiftTable = new Uint32Array(512);

    for (let i = 0; i < 256; ++i) {
      const e = i - 127; // very small number (0, -0)

      if (e < -27) {
        baseTable[i] = 0x0000;
        baseTable[i | 0x100] = 0x8000;
        shiftTable[i] = 24;
        shiftTable[i | 0x100] = 24; // small number (denorm)
      } else if (e < -14) {
        baseTable[i] = 0x0400 >> -e - 14;
        baseTable[i | 0x100] = 0x0400 >> -e - 14 | 0x8000;
        shiftTable[i] = -e - 1;
        shiftTable[i | 0x100] = -e - 1; // normal number
      } else if (e <= 15) {
        baseTable[i] = e + 15 << 10;
        baseTable[i | 0x100] = e + 15 << 10 | 0x8000;
        shiftTable[i] = 13;
        shiftTable[i | 0x100] = 13; // large number (Infinity, -Infinity)
      } else if (e < 128) {
        baseTable[i] = 0x7c00;
        baseTable[i | 0x100] = 0xfc00;
        shiftTable[i] = 24;
        shiftTable[i | 0x100] = 24; // stay (NaN, Infinity, -Infinity)
      } else {
        baseTable[i] = 0x7c00;
        baseTable[i | 0x100] = 0xfc00;
        shiftTable[i] = 13;
        shiftTable[i | 0x100] = 13;
      }
    } // float16 to float32 helpers


    const mantissaTable = new Uint32Array(2048);
    const exponentTable = new Uint32Array(64);
    const offsetTable = new Uint32Array(64);

    for (let i = 1; i < 1024; ++i) {
      let m = i << 13; // zero pad mantissa bits

      let e = 0; // zero exponent
      // normalized

      while ((m & 0x00800000) === 0) {
        m <<= 1;
        e -= 0x00800000; // decrement exponent
      }

      m &= ~0x00800000; // clear leading 1 bit

      e += 0x38800000; // adjust bias

      mantissaTable[i] = m | e;
    }

    for (let i = 1024; i < 2048; ++i) {
      mantissaTable[i] = 0x38000000 + (i - 1024 << 13);
    }

    for (let i = 1; i < 31; ++i) {
      exponentTable[i] = i << 23;
    }

    exponentTable[31] = 0x47800000;
    exponentTable[32] = 0x80000000;

    for (let i = 33; i < 63; ++i) {
      exponentTable[i] = 0x80000000 + (i - 32 << 23);
    }

    exponentTable[63] = 0xc7800000;

    for (let i = 1; i < 64; ++i) {
      if (i !== 32) {
        offsetTable[i] = 1024;
      }
    }

    return {
      floatView: floatView,
      uint32View: uint32View,
      baseTable: baseTable,
      shiftTable: shiftTable,
      mantissaTable: mantissaTable,
      exponentTable: exponentTable,
      offsetTable: offsetTable
    };
  }

  function fromHalfFloat(val) {
    const m = val >> 10;
    _tables.uint32View[0] = _tables.mantissaTable[_tables.offsetTable[m] + (val & 0x3ff)] + _tables.exponentTable[m];
    return _tables.floatView[0];
  }

  function colorToLuminance(r, g, b) {
    // https://en.wikipedia.org/wiki/Relative_luminance
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const binarySearchFindClosestIndexOf = (array, targetValue, offset = 0, count = array.length) => {
    let lower = offset;
    let upper = offset + count - 1;

    while (lower < upper) {
      const mid = lower + upper >> 1; // check if the middle array value is above or below the target and shift
      // which half of the array we're looking at

      if (array[mid] < targetValue) {
        lower = mid + 1;
      } else {
        upper = mid;
      }
    }

    return lower - offset;
  };

  const gatherData = (data, width, height, flipY, marginalDataArray, conditionalDataArray) => {
    // "conditional" = "pixel relative to row pixels sum"
    // "marginal" = "row relative to row sum"
    // remove any y flipping for cdf computation
    if (flipY) {
      for (let y = 0, h = height - 1; y <= h; y++) {
        for (let x = 0, w = width * 4; x < w; x += 4) {
          const newY = h - y;
          const ogIndex = y * w + x;
          const newIndex = newY * w + x;
          data[newIndex] = data[ogIndex];
          data[newIndex + 1] = data[ogIndex + 1];
          data[newIndex + 2] = data[ogIndex + 2];
          data[newIndex + 3] = data[ogIndex + 3];
        }
      }
    } // track the importance of any given pixel in the image by tracking its weight relative to other pixels in the image


    const pdfConditional = new Float32Array(width * height);
    const cdfConditional = new Float32Array(width * height);
    const pdfMarginal = new Float32Array(height);
    const cdfMarginal = new Float32Array(height);
    let totalSumValue = 0.0;
    let cumulativeWeightMarginal = 0.0;

    for (let y = 0; y < height; y++) {
      let cumulativeRowWeight = 0.0;

      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const r = data[4 * i + 0];
        const g = data[4 * i + 1];
        const b = data[4 * i + 2]; // the probability of the pixel being selected in this row is the
        // scale of the luminance relative to the rest of the pixels.
        // TODO: this should also account for the solid angle of the pixel when sampling

        const weight = colorToLuminance(r, g, b);
        cumulativeRowWeight += weight;
        totalSumValue += weight;
        pdfConditional[i] = weight;
        cdfConditional[i] = cumulativeRowWeight;
      } // can happen if the row is all black


      if (cumulativeRowWeight !== 0) {
        // scale the pdf and cdf to [0.0, 1.0]
        for (let i = y * width, l = y * width + width; i < l; i++) {
          pdfConditional[i] /= cumulativeRowWeight;
          cdfConditional[i] /= cumulativeRowWeight;
        }
      }

      cumulativeWeightMarginal += cumulativeRowWeight; // compute the marginal pdf and cdf along the height of the map.

      pdfMarginal[y] = cumulativeRowWeight;
      cdfMarginal[y] = cumulativeWeightMarginal;
    } // can happen if the texture is all black


    if (cumulativeWeightMarginal !== 0) {
      // scale the marginal pdf and cdf to [0.0, 1.0]
      for (let i = 0, l = pdfMarginal.length; i < l; i++) {
        pdfMarginal[i] /= cumulativeWeightMarginal;
        cdfMarginal[i] /= cumulativeWeightMarginal;
      }
    } // compute a sorted index of distributions and the probabilities along them for both
    // the marginal and conditional data. These will be used to sample with a random number
    // to retrieve a uv value to sample in the environment map.
    // These values continually increase so it's okay to interpolate between them.
    // we add a half texel offset so we're sampling the center of the pixel


    for (let i = 0; i < height; i++) {
      const dist = (i + 1) / height;
      const row = binarySearchFindClosestIndexOf(cdfMarginal, dist);
      marginalDataArray[i] = (row + 0.5) / height;
    }

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        const dist = (x + 1) / width;
        const col = binarySearchFindClosestIndexOf(cdfConditional, dist, y * width, width);
        conditionalDataArray[i] = (col + 0.5) / width;
      }
    }

    return totalSumValue;
  };

  if (!isFloatType) {
    const newData = new Float32Array(data.length); // eslint-disable-next-line guard-for-in

    for (let i = 0; i < data.length; i++) {
      newData[i] = fromHalfFloat(data[i]);
    }

    data = newData;
  }

  const marginalDataArray = new Float32Array(height);
  const conditionalDataArray = new Float32Array(width * height);
  const totalSumValue = gatherData(data, width, height, flipY, marginalDataArray, conditionalDataArray);
  postMessage({
    totalSumValue,
    marginalDataArray,
    conditionalDataArray
  });
};

const blob = new Blob(["onmessage = " + workerOnMessage], {
  type: "application/javascript"
});
const workerUrl = URL.createObjectURL(blob);
class EquirectHdrInfoUniform {
  constructor() {
    // we use NearestFilter instead of LinearFilter because on many recent Apple devices filtering from such a texture does not work
    // Default to a white texture and associated weights so we don't
    // just render black initially.
    const whiteTex = new DataTexture(new Float32Array([1, 1, 1, 1]), 1, 1);
    whiteTex.type = FloatType;
    whiteTex.format = RGBAFormat;
    whiteTex.minFilter = NearestFilter;
    whiteTex.magFilter = NearestFilter;
    whiteTex.wrapS = RepeatWrapping;
    whiteTex.wrapT = RepeatWrapping;
    whiteTex.generateMipmaps = false;
    whiteTex.needsUpdate = true; // Stores a map of [0, 1] value -> cumulative importance row & pdf
    // used to sampling a random value to a relevant row to sample from

    const marginalWeights = new DataTexture(new Float32Array([0, 1]), 1, 2);
    marginalWeights.type = FloatType;
    marginalWeights.format = RedFormat;
    marginalWeights.minFilter = NearestFilter;
    marginalWeights.magFilter = NearestFilter;
    marginalWeights.generateMipmaps = false;
    marginalWeights.needsUpdate = true; // Stores a map of [0, 1] value -> cumulative importance column & pdf
    // used to sampling a random value to a relevant pixel to sample from

    const conditionalWeights = new DataTexture(new Float32Array([0, 0, 1, 1]), 2, 2);
    conditionalWeights.type = FloatType;
    conditionalWeights.format = RedFormat;
    conditionalWeights.minFilter = NearestFilter;
    conditionalWeights.magFilter = NearestFilter;
    conditionalWeights.generateMipmaps = false;
    conditionalWeights.needsUpdate = true;
    this.map = whiteTex;
    this.marginalWeights = marginalWeights;
    this.conditionalWeights = conditionalWeights; // the total sum value is separated into two values to work around low precision
    // storage of floating values in structs

    this.totalSumWhole = 1;
    this.totalSumDecimal = 0;
    this.size = new Vector2();
  }

  dispose() {
    this.marginalWeights.dispose();
    this.conditionalWeights.dispose();
    this.map.dispose();
  }

  updateFrom(map) {
    map = map.clone();
    const {
      width,
      height,
      data
    } = map.image;
    const {
      type
    } = map;
    this.size.set(width, height);
    return new Promise(resolve => {
      var _this$worker;

      (_this$worker = this.worker) == null ? void 0 : _this$worker.terminate();
      this.worker = new Worker(workerUrl);
      this.worker.postMessage({
        width,
        height,
        isFloatType: type === FloatType,
        flipY: map.flipY,
        data
      });

      this.worker.onmessage = ({
        data: {
          totalSumValue,
          marginalDataArray,
          conditionalDataArray
        }
      }) => {
        this.dispose();
        const {
          marginalWeights,
          conditionalWeights
        } = this;
        marginalWeights.image = {
          width: height,
          height: 1,
          data: marginalDataArray
        };
        marginalWeights.needsUpdate = true;
        conditionalWeights.image = {
          width,
          height,
          data: conditionalDataArray
        };
        conditionalWeights.needsUpdate = true;
        const totalSumWhole = ~~totalSumValue;
        const totalSumDecimal = totalSumValue - totalSumWhole;
        this.totalSumWhole = totalSumWhole;
        this.totalSumDecimal = totalSumDecimal;
        this.map = map;
        this.worker = null;
        resolve(map);
      };
    });
  }

}

/* eslint-disable camelcase */
class SSGIMaterial extends ShaderMaterial {
  constructor() {
    super({
      type: "SSGIMaterial",
      uniforms: {
        accumulatedTexture: new Uniform(null),
        gBufferTexture: new Uniform(null),
        depthTexture: new Uniform(null),
        velocityTexture: new Uniform(null),
        directLightTexture: new Uniform(null),
        blueNoiseTexture: new Uniform(null),
        projectionMatrix: new Uniform(new Matrix4()),
        projectionMatrixInverse: new Uniform(new Matrix4()),
        cameraMatrixWorld: new Uniform(new Matrix4()),
        viewMatrix: new Uniform(new Matrix4()),
        cameraNear: new Uniform(0),
        cameraFar: new Uniform(0),
        nearMulFar: new Uniform(0),
        nearMinusFar: new Uniform(0),
        farMinusNear: new Uniform(0),
        rayDistance: new Uniform(0),
        thickness: new Uniform(0),
        frame: new Uniform(0),
        envBlur: new Uniform(0),
        maxEnvMapMipLevel: new Uniform(0),
        envMapInfo: {
          value: new EquirectHdrInfoUniform()
        },
        envMapPosition: new Uniform(new Vector3()),
        envMapSize: new Uniform(new Vector3()),
        backgroundColor: new Uniform(new Color()),
        resolution: new Uniform(new Vector2()),
        blueNoiseRepeat: new Uniform(new Vector2())
      },
      defines: {
        steps: 20,
        refineSteps: 5,
        CUBEUV_TEXEL_WIDTH: 0,
        CUBEUV_TEXEL_HEIGHT: 0,
        CUBEUV_MAX_MIP: 0,
        vWorldPosition: "worldPos"
      },
      fragmentShader: fragmentShader$6.replace("#include <ssgi_utils>", ssgi_utils).replace("#include <gbuffer_packing>", gbuffer_packing),
      vertexShader,
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false
    });
    useBlueNoise(this);
  }

}

const blackColor = new Color(0);
class SSGIPass extends Pass {
  constructor(ssgiEffect, options) {
    super("SSGIPass");
    this.defaultFragmentShader = "";
    this.frame = 21483;
    this.ssgiEffect = ssgiEffect;
    this._scene = ssgiEffect._scene;
    this._camera = ssgiEffect._camera;
    this.fullscreenMaterial = new SSGIMaterial();
    this.defaultFragmentShader = this.fullscreenMaterial.fragmentShader; // const { mode } = options

    this.renderTarget = new WebGLRenderTarget(1, 1, {
      type: FloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false
    });
    this.renderTarget.texture.name = "SSGIPass.Texture"; // set up basic uniforms that we don't have to update

    this.fullscreenMaterial.uniforms.cameraMatrixWorld.value = this._camera.matrixWorld;
    this.fullscreenMaterial.uniforms.viewMatrix.value = this._camera.matrixWorldInverse;
    this.fullscreenMaterial.uniforms.projectionMatrix.value = this._camera.projectionMatrix;
    this.fullscreenMaterial.uniforms.projectionMatrixInverse.value = this._camera.projectionMatrixInverse;
    if (ssgiEffect._camera.isPerspectiveCamera) this.fullscreenMaterial.defines.PERSPECTIVE_CAMERA = "";
    this.fullscreenMaterial.defines.mode = ["ssgi", "ssr"].indexOf(options.mode);
    this.gBufferPass = new GBufferPass(this._scene, this._camera);
    this.fullscreenMaterial.uniforms.gBufferTexture.value = this.gBufferPass.texture;
    this.fullscreenMaterial.uniforms.depthTexture.value = this.gBufferPass.depthTexture;
  }

  get texture() {
    return this.renderTarget.texture;
  }

  setSize(width, height) {
    this.renderTarget.setSize(width * this.ssgiEffect.resolutionScale, height * this.ssgiEffect.resolutionScale);
    this.gBufferPass.setSize(width, height);
    this.fullscreenMaterial.uniforms.resolution.value.set(this.renderTarget.width, this.renderTarget.height);
  }

  dispose() {
    super.dispose();
    this.renderTarget.dispose();
    this.renderTarget.dispose();
    this.fullscreenMaterial.dispose();
  }

  render(renderer) {
    this.frame = (this.frame + 1) % 4096;
    const {
      mask
    } = this._camera.layers;
    const hasSelection = this.ssgiEffect.selection.size > 0;

    this._camera.layers.set(hasSelection ? this.ssgiEffect.selection.layer : 0); // render G-Buffers


    this.gBufferPass.render(renderer);
    this._camera.layers.mask = mask; // update uniforms

    this.fullscreenMaterial.uniforms.frame.value = this.frame;
    this.fullscreenMaterial.uniforms.cameraNear.value = this._camera.near;
    this.fullscreenMaterial.uniforms.cameraFar.value = this._camera.far;
    this.fullscreenMaterial.uniforms.nearMinusFar.value = this._camera.near - this._camera.far;
    this.fullscreenMaterial.uniforms.farMinusNear.value = this._camera.far - this._camera.near;
    this.fullscreenMaterial.uniforms.nearMulFar.value = this._camera.near * this._camera.far;
    this.fullscreenMaterial.uniforms.accumulatedTexture.value = this.ssgiEffect.denoiser.texture;
    this.fullscreenMaterial.uniforms.velocityTexture.value = this.ssgiEffect.velocityTexture;
    const bgColor = this._scene.background instanceof Color ? this._scene.background : blackColor;
    this.fullscreenMaterial.uniforms.backgroundColor.value.copy(bgColor);
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }

}

// this shader is from: https://github.com/gkjohnson/threejs-sandbox
// a second set of bone information from the previous frame

const prev_skinning_pars_vertex =
/* glsl */
`
		#ifdef USE_SKINNING
		#ifdef BONE_TEXTURE
			uniform sampler2D prevBoneTexture;
			mat4 getPrevBoneMatrix( const in float i ) {
				float j = i * 4.0;
				float x = mod( j, float( boneTextureSize ) );
				float y = floor( j / float( boneTextureSize ) );
				float dx = 1.0 / float( boneTextureSize );
				float dy = 1.0 / float( boneTextureSize );
				y = dy * ( y + 0.5 );
				vec4 v1 = textureLod( prevBoneTexture, vec2( dx * ( x + 0.5 ), y ), 0. );
				vec4 v2 = textureLod( prevBoneTexture, vec2( dx * ( x + 1.5 ), y ), 0. );
				vec4 v3 = textureLod( prevBoneTexture, vec2( dx * ( x + 2.5 ), y ), 0. );
				vec4 v4 = textureLod( prevBoneTexture, vec2( dx * ( x + 3.5 ), y ), 0. );
				mat4 bone = mat4( v1, v2, v3, v4 );
				return bone;
			}
		#else
			uniform mat4 prevBoneMatrices[ MAX_BONES ];
			mat4 getPrevBoneMatrix( const in float i ) {
				mat4 bone = prevBoneMatrices[ int(i) ];
				return bone;
			}
		#endif
		#endif
`;
const velocity_vertex_pars =
/* glsl */
`
#define MAX_BONES 64
                    
${ShaderChunk.skinning_pars_vertex}
${prev_skinning_pars_vertex}

uniform mat4 velocityMatrix;
uniform mat4 prevVelocityMatrix;
varying vec4 prevPosition;
varying vec4 newPosition;

varying vec2 vHighPrecisionZW;
`; // Returns the body of the vertex shader for the velocity buffer

const velocity_vertex_main =
/* glsl */
`
// Get the current vertex position
transformed = vec3( position );
${ShaderChunk.skinning_vertex}
newPosition = velocityMatrix * vec4( transformed, 1.0 );

// Get the previous vertex position
transformed = vec3( position );
${ShaderChunk.skinbase_vertex.replace(/mat4 /g, "").replace(/getBoneMatrix/g, "getPrevBoneMatrix")}
${ShaderChunk.skinning_vertex.replace(/vec4 /g, "")}
prevPosition = prevVelocityMatrix * vec4( transformed, 1.0 );

gl_Position = newPosition;

vHighPrecisionZW = gl_Position.zw;
`;
const velocity_fragment_pars =
/* glsl */
`
varying vec4 prevPosition;
varying vec4 newPosition;

varying vec2 vHighPrecisionZW;
`;
const velocity_fragment_main =
/* glsl */
`
vec2 pos0 = (prevPosition.xy / prevPosition.w) * 0.5 + 0.5;
vec2 pos1 = (newPosition.xy / newPosition.w) * 0.5 + 0.5;

vec2 vel = pos1 - pos0;

float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

gl_FragColor = vec4(vel.x, vel.y, 0., 0.);
`;
const velocity_uniforms = {
  prevVelocityMatrix: {
    value: new Matrix4()
  },
  velocityMatrix: {
    value: new Matrix4()
  },
  prevBoneTexture: {
    value: null
  },
  boneTexture: {
    value: null
  },
  normalMap: {
    value: null
  },
  normalScale: {
    value: new Vector2(1, 1)
  },
  uvTransform: {
    value: new Matrix3()
  }
};
class VelocityDepthNormalMaterial extends ShaderMaterial {
  constructor(camera) {
    super({
      uniforms: { ...UniformsUtils.clone(velocity_uniforms),
        ...{
          cameraMatrixWorld: {
            value: camera.matrixWorld
          }
        }
      },
      vertexShader:
      /* glsl */
      `
					#include <common>
					#include <uv_pars_vertex>
					#include <displacementmap_pars_vertex>
					#include <normal_pars_vertex>
					#include <morphtarget_pars_vertex>
					#include <logdepthbuf_pars_vertex>
					#include <clipping_planes_pars_vertex>

					varying vec2 vUv;

					varying vec3 vViewPosition;
					
                    ${velocity_vertex_pars}
        
                    void main() {
						vec3 transformed;

						#include <uv_vertex>

						#include <skinbase_vertex>
						#include <beginnormal_vertex>
						#include <skinnormal_vertex>
						#include <defaultnormal_vertex>

						#include <morphnormal_vertex>
						#include <normal_vertex>
						#include <morphtarget_vertex>
						#include <displacementmap_vertex>
						#include <project_vertex>
						#include <logdepthbuf_vertex>
						#include <clipping_planes_vertex>

						${velocity_vertex_main}

						vViewPosition = - mvPosition.xyz;

						vUv = uv;

                    }`,
      fragmentShader:
      /* glsl */
      `
					precision highp float;
					uniform mat4 cameraMatrixWorld;

					varying vec3 vViewPosition;

					${velocity_fragment_pars}
					#include <packing>

					#include <uv_pars_fragment>
					#include <normal_pars_fragment>
					#include <normalmap_pars_fragment>

					varying vec2 vUv;

					// source: https://knarkowicz.wordpress.com/2014/04/16/octahedron-normal-vector-encoding/
					vec2 OctWrap( vec2 v ) {
						vec2 w = 1.0 - abs( v.yx );
						if (v.x < 0.0) w.x = -w.x;
						if (v.y < 0.0) w.y = -w.y;
						return w;
					}

					vec2 encodeOctWrap(vec3 n) {
						n /= (abs(n.x) + abs(n.y) + abs(n.z));
						n.xy = n.z > 0.0 ? n.xy : OctWrap(n.xy);
						n.xy = n.xy * 0.5 + 0.5;
						return n.xy;
					}

					float packNormal(vec3 normal) {
						return uintBitsToFloat(packHalf2x16(encodeOctWrap(normal)));
					}

                    void main() {
						#define vNormalMapUv vUv

						#include <normal_fragment_begin>
                    	#include <normal_fragment_maps>

						${velocity_fragment_main}
						vec3 worldNormal = normalize((cameraMatrixWorld * vec4(normal, 0.)).xyz);
						gl_FragColor.b = packNormal(worldNormal);
						gl_FragColor.a = fragCoordZ;
                    }`
    });
  }

}

const materialProps = ["vertexTangent", "vertexColors", "vertexAlphas", "vertexUvs", "uvsVertexOnly", "supportsVertexTextures", "instancing", "instancingColor", "side", "flatShading", "skinning", "doubleSided", "flipSided"];
const copyNecessaryProps = (originalMaterial, newMaterial) => {
  for (const props of materialProps) newMaterial[props] = originalMaterial[props];
};
const keepMaterialMapUpdated = (mrtMaterial, originalMaterial, prop, define, useKey) => {
  if (useKey) {
    if (originalMaterial[prop] !== mrtMaterial[prop]) {
      mrtMaterial[prop] = originalMaterial[prop];
      mrtMaterial.uniforms[prop].value = originalMaterial[prop];

      if (originalMaterial[prop]) {
        mrtMaterial.defines[define] = "";
      } else {
        delete mrtMaterial.defines[define];
      }

      mrtMaterial.needsUpdate = true;
    }
  } else if (mrtMaterial[prop] !== undefined) {
    mrtMaterial[prop] = undefined;
    mrtMaterial.uniforms[prop].value = undefined;
    delete mrtMaterial.defines[define];
    mrtMaterial.needsUpdate = true;
  }
};
const getVisibleChildren = object => {
  const queue = [object];
  const objects = [];

  while (queue.length !== 0) {
    const mesh = queue.shift();
    if (mesh.material) objects.push(mesh);

    for (const c of mesh.children) {
      if (c.visible) queue.push(c);
    }
  }

  return objects;
};

const backgroundColor = new Color(0);
const zeroVec2 = new Vector2();
const tmpProjectionMatrix = new Matrix4();
const tmpProjectionMatrixInverse = new Matrix4();

const saveBoneTexture = object => {
  let boneTexture = object.material.uniforms.prevBoneTexture.value;

  if (boneTexture && boneTexture.image.width === object.skeleton.boneTexture.width) {
    boneTexture = object.material.uniforms.prevBoneTexture.value;
    boneTexture.image.data.set(object.skeleton.boneTexture.image.data);
  } else {
    var _boneTexture;

    (_boneTexture = boneTexture) == null ? void 0 : _boneTexture.dispose();
    const boneMatrices = object.skeleton.boneTexture.image.data.slice();
    const size = object.skeleton.boneTexture.image.width;
    boneTexture = new DataTexture(boneMatrices, size, size, RGBAFormat, FloatType);
    object.material.uniforms.prevBoneTexture.value = boneTexture;
    boneTexture.needsUpdate = true;
  }
};

const updateVelocityDepthNormalMaterialBeforeRender = (c, camera) => {
  var _c$skeleton;

  if ((_c$skeleton = c.skeleton) != null && _c$skeleton.boneTexture) {
    c.material.uniforms.boneTexture.value = c.skeleton.boneTexture;

    if (!("USE_SKINNING" in c.material.defines)) {
      c.material.defines.USE_SKINNING = "";
      c.material.defines.BONE_TEXTURE = "";
      c.material.needsUpdate = true;
    }
  }

  c.modelViewMatrix.multiplyMatrices(camera.matrixWorldInverse, c.matrixWorld);
  c.material.uniforms.velocityMatrix.value.multiplyMatrices(camera.projectionMatrix, c.modelViewMatrix);
};

const updateVelocityDepthNormalMaterialAfterRender = (c, camera) => {
  var _c$skeleton2;

  c.material.uniforms.prevVelocityMatrix.value.multiplyMatrices(camera.projectionMatrix, c.modelViewMatrix);
  if ((_c$skeleton2 = c.skeleton) != null && _c$skeleton2.boneTexture) saveBoneTexture(c);
};

class VelocityDepthNormalPass extends Pass {
  constructor(scene, camera) {
    super("VelocityDepthNormalPass");
    this.cachedMaterials = new WeakMap();
    this.visibleMeshes = [];
    this.needsSwap = false;
    this._scene = scene;
    this._camera = camera;
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      type: FloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter
    });
    this.renderTarget.texture.name = "VelocityDepthNormalPass.Texture";
    this.renderTarget.depthTexture = new DepthTexture(1, 1);
    this.renderTarget.depthTexture.type = FloatType;
  }

  get texture() {
    return this.renderTarget.texture;
  }

  setVelocityDepthNormalMaterialInScene() {
    this.visibleMeshes = getVisibleChildren$1(this._scene);

    for (const c of this.visibleMeshes) {
      const originalMaterial = c.material;
      let [cachedOriginalMaterial, velocityDepthNormalMaterial] = this.cachedMaterials.get(c) || [];

      if (originalMaterial !== cachedOriginalMaterial) {
        var _c$skeleton3;

        velocityDepthNormalMaterial = new VelocityDepthNormalMaterial(this._camera);
        copyNecessaryProps(originalMaterial, velocityDepthNormalMaterial);
        c.material = velocityDepthNormalMaterial;
        if ((_c$skeleton3 = c.skeleton) != null && _c$skeleton3.boneTexture) saveBoneTexture(c);
        this.cachedMaterials.set(c, [originalMaterial, velocityDepthNormalMaterial]);
      }

      c.material = velocityDepthNormalMaterial;
      c.visible = isChildMaterialRenderable(c, originalMaterial);
      keepMaterialMapUpdated(velocityDepthNormalMaterial, originalMaterial, "normalMap", "USE_NORMALMAP_TANGENTSPACE", true);
      velocityDepthNormalMaterial.uniforms.normalMap.value = originalMaterial.normalMap;
      const map = originalMaterial.map || originalMaterial.normalMap || originalMaterial.roughnessMap || originalMaterial.metalnessMap;
      if (map) velocityDepthNormalMaterial.uniforms.uvTransform.value = map.matrix;
      updateVelocityDepthNormalMaterialBeforeRender(c, this._camera);
    }
  }

  unsetVelocityDepthNormalMaterialInScene() {
    for (const c of this.visibleMeshes) {
      c.visible = true;
      updateVelocityDepthNormalMaterialAfterRender(c, this._camera);
      c.material = this.cachedMaterials.get(c)[0];
    }
  }

  setSize(width, height) {
    var _this$lastVelocityTex;

    this.renderTarget.setSize(width, height);
    (_this$lastVelocityTex = this.lastVelocityTexture) == null ? void 0 : _this$lastVelocityTex.dispose();
    this.lastVelocityTexture = new FramebufferTexture(width, height, RGBAFormat);
    this.lastVelocityTexture.type = FloatType;
    this.lastVelocityTexture.minFilter = NearestFilter;
    this.lastVelocityTexture.magFilter = NearestFilter;
  }

  dispose() {
    super.dispose();
    this.renderTarget.dispose();
  }

  render(renderer) {
    tmpProjectionMatrix.copy(this._camera.projectionMatrix);
    tmpProjectionMatrixInverse.copy(this._camera.projectionMatrixInverse);
    if (this._camera.view) this._camera.view.enabled = false;

    this._camera.updateProjectionMatrix(); // in case a RenderPass is not being used, so we need to update the camera's world matrix manually


    this._camera.updateMatrixWorld();

    this.setVelocityDepthNormalMaterialInScene();
    const {
      background
    } = this._scene;
    this._scene.background = backgroundColor;
    renderer.setRenderTarget(this.renderTarget);
    renderer.copyFramebufferToTexture(zeroVec2, this.lastVelocityTexture);
    renderer.render(this._scene, this._camera);
    this._scene.background = background;
    this.unsetVelocityDepthNormalMaterialInScene();
    if (this._camera.view) this._camera.view.enabled = true;

    this._camera.projectionMatrix.copy(tmpProjectionMatrix);

    this._camera.projectionMatrixInverse.copy(tmpProjectionMatrixInverse);
  }

}

var ssgi_poisson_compose_functions = "#define GLSLIFY 1\nfloat getViewZ(const in float depth){\n#ifdef PERSPECTIVE_CAMERA\nreturn perspectiveDepthToViewZ(depth,cameraNear,cameraFar);\n#else\nreturn orthographicDepthToViewZ(depth,cameraNear,cameraFar);\n#endif\n}vec3 getViewPosition(float viewZ){float clipW=projectionMatrix[2][3]*viewZ+projectionMatrix[3][3];vec4 clipPosition=vec4((vec3(vUv,viewZ)-0.5)*2.0,1.0);clipPosition*=clipW;vec3 p=(projectionMatrixInverse*clipPosition).xyz;p.z=-viewZ;return p;}vec3 F_Schlick(const vec3 f0,const float theta){return f0+(1.-f0)*pow(1.0-theta,5.);}vec3 SampleGGXVNDF(const vec3 V,const float ax,const float ay,const float r1,const float r2){vec3 Vh=normalize(vec3(ax*V.x,ay*V.y,V.z));float lensq=Vh.x*Vh.x+Vh.y*Vh.y;vec3 T1=lensq>0. ? vec3(-Vh.y,Vh.x,0.)*inversesqrt(lensq): vec3(1.,0.,0.);vec3 T2=cross(Vh,T1);float r=sqrt(r1);float phi=2.0*PI*r2;float t1=r*cos(phi);float t2=r*sin(phi);float s=0.5*(1.0+Vh.z);t2=(1.0-s)*sqrt(1.0-t1*t1)+s*t2;vec3 Nh=t1*T1+t2*T2+sqrt(max(0.0,1.0-t1*t1-t2*t2))*Vh;return normalize(vec3(ax*Nh.x,ay*Nh.y,max(0.0,Nh.z)));}void Onb(const vec3 N,inout vec3 T,inout vec3 B){vec3 up=abs(N.z)<0.9999999 ? vec3(0,0,1): vec3(1,0,0);T=normalize(cross(up,N));B=cross(N,T);}vec3 ToLocal(const vec3 X,const vec3 Y,const vec3 Z,const vec3 V){return vec3(dot(V,X),dot(V,Y),dot(V,Z));}vec3 ToWorld(const vec3 X,const vec3 Y,const vec3 Z,const vec3 V){return V.x*X+V.y*Y+V.z*Z;}vec3 constructGlobalIllumination(vec3 diffuseGi,vec3 specularGi,vec3 cameraRay,vec3 viewNormal,vec3 diffuse,vec3 emissive,float roughness,float metalness){roughness*=roughness;vec3 normal=(vec4(viewNormal,0.)*viewMatrix).xyz;vec3 T,B;vec3 v=-cameraRay;vec3 V=(vec4(v,0.)*viewMatrix).xyz;vec3 N=normal;Onb(N,T,B);V=ToLocal(T,B,N,V);vec3 H=SampleGGXVNDF(V,roughness,roughness,0.25,0.25);if(H.z<0.0)H=-H;vec3 l=normalize(reflect(-V,H));l=ToWorld(T,B,N,l);l=(vec4(l,1.)*cameraMatrixWorld).xyz;l=normalize(l);if(dot(viewNormal,l)<0.)l=-l;vec3 h=normalize(v+l);float VoH=max(EPSILON,dot(v,h));vec3 f0=mix(vec3(0.04),diffuse,metalness);vec3 F=F_Schlick(f0,VoH);\n#if inputType != TYPE_SPECULAR\nvec3 diffuseComponent=diffuse*(1.-metalness)*(1.-F)*diffuseGi;\n#else\nvec3 diffuseComponent=textureLod(sceneTexture,vUv,0.).rgb;\n#endif\nvec3 specularComponent=specularGi*F;vec3 globalIllumination=diffuseComponent+specularComponent+emissive;return globalIllumination;}"; // eslint-disable-line

/* eslint-disable camelcase */
class DenoiserComposePass extends Pass {
  constructor(camera, textures, gBufferTexture, depthTexture, options = {}) {
    var _indexOf;

    super("DenoiserComposePass");
    this._camera = camera;
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      type: FloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter
    });
    this.renderTarget.texture.name = "DenoiserComposePass.Texture";
    let diffuseGiTexture;
    let specularGiTexture;

    if (options.inputType === "diffuseSpecular") {
      diffuseGiTexture = textures[0];
      specularGiTexture = textures[1];
    } else if (options.inputType === "diffuse") {
      diffuseGiTexture = textures[0];
    } else if (options.inputType === "specular") {
      specularGiTexture = textures[0];
    }

    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader:
      /* glsl */
      `
            varying vec2 vUv;
            uniform sampler2D sceneTexture;
            uniform highp sampler2D depthTexture;
            uniform sampler2D diffuseGiTexture;
            uniform sampler2D specularGiTexture;
            uniform mat4 cameraMatrixWorld;
            uniform mat4 projectionMatrix;
            uniform mat4 projectionMatrixInverse;
			uniform float cameraNear;
			uniform float cameraFar;

            #include <common>
            #include <packing>

			#define TYPE_DIFFUSE_SPECULAR 0
			#define TYPE_DIFFUSE 1
			#define TYPE_SPECULAR 2

            ${gbuffer_packing}
            ${ssgi_poisson_compose_functions}

            void main() {
                float depth = textureLod(depthTexture, vUv, 0.).r;

				if(depth == 1.){
					discard;
					return;
				}

				// on Android there's a bug where using "vec3 normal = unpackNormal(textureLod(velocityTexture, vUv, 0.).b);" instead of
				// "vec3 normal = unpackNormal(velocity.b);" causes the normal to be distorted (possibly due to packHalf2x16 function)

                Material mat = getMaterial(gBufferTexture, vUv);

                vec3 viewNormal = (vec4(mat.normal, 0.) * cameraMatrixWorld).xyz;

				float viewZ = -getViewZ(depth);

                // view-space position of the current texel
				vec3 viewPos = getViewPosition(viewZ);
                vec3 viewDir = normalize(viewPos);

                vec4 diffuseGi = textureLod(diffuseGiTexture, vUv, 0.);
                vec4 specularGi = textureLod(specularGiTexture, vUv, 0.);

                vec3 gi = constructGlobalIllumination(diffuseGi.rgb, specularGi.rgb, viewDir, viewNormal, mat.diffuse.rgb, mat.emissive, mat.roughness, mat.metalness);

				gl_FragColor = vec4(gi, 1.);
            }
            `,
      vertexShader: vertexShader,
      uniforms: {
        sceneTexture: {
          value: null
        },
        viewMatrix: {
          value: camera.matrixWorldInverse
        },
        cameraMatrixWorld: {
          value: camera.matrixWorld
        },
        projectionMatrix: {
          value: camera.projectionMatrix
        },
        projectionMatrixInverse: {
          value: camera.projectionMatrixInverse
        },
        cameraNear: {
          value: camera.near
        },
        cameraFar: {
          value: camera.far
        },
        gBufferTexture: {
          value: gBufferTexture
        },
        depthTexture: {
          value: depthTexture
        },
        diffuseGiTexture: {
          value: diffuseGiTexture
        },
        specularGiTexture: {
          value: specularGiTexture
        }
      },
      defines: {
        inputType: (_indexOf = ["diffuseSpecular", "diffuse", "specular"].indexOf(options.inputType)) !== null && _indexOf !== void 0 ? _indexOf : 0
      },
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false
    });
    if (camera.isPerspectiveCamera) this.fullscreenMaterial.defines.PERSPECTIVE_CAMERA = "";
  }

  get texture() {
    return this.renderTarget.texture;
  }

  dispose() {
    this.renderTarget.dispose();
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);
  }

  setSceneTexture(texture) {
    this.fullscreenMaterial.uniforms.sceneTexture.value = texture;
  }

  render(renderer) {
    this.fullscreenMaterial.uniforms.cameraNear.value = this._camera.near;
    this.fullscreenMaterial.uniforms.cameraFar.value = this._camera.far;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }

}

var fragmentShader$5 = "#define GLSLIFY 1\nvarying vec2 vUv;uniform sampler2D inputTexture;uniform highp sampler2D depthTexture;uniform sampler2D normalTexture;uniform mat4 projectionMatrix;uniform mat4 projectionMatrixInverse;uniform mat4 cameraMatrixWorld;uniform float radius;uniform float phi;uniform float lumaPhi;uniform float depthPhi;uniform float normalPhi;uniform float roughnessPhi;uniform float specularPhi;uniform vec2 resolution;layout(location=0)out vec4 gOutput0;\n#if textureCount == 2\nuniform sampler2D inputTexture2;layout(location=1)out vec4 gOutput1;\n#endif\n#include <common>\n#include <gbuffer_packing>\n#define luminance(a) pow(dot(vec3(0.2125, 0.7154, 0.0721), a), 0.125)\n#if textureCount == 1\n#define inputTexture2 inputTexture\n#endif\nMaterial mat;vec3 normal;float depth;float specularFactor;struct InputTexel{vec3 rgb;float a;float luminance;float w;float totalWeight;bool isSpecular;};void toDenoiseSpace(inout vec3 color){color=log(color+1.);}void toLinearSpace(inout vec3 color){color=exp(color)-1.;}float getBasicNeighborWeight(inout vec2 neighborUv,inout float wBasic,inout float wDisoccl){\n#ifdef GBUFFER_TEXTURE\nMaterial neighborMat=getMaterial(gBufferTexture,neighborUv);vec3 neighborNormal=neighborMat.normal;float neighborDepth=textureLod(depthTexture,neighborUv,0.0).r;\n#else\nvec3 neighborDepthVelocityTexel=textureLod(normalTexture,neighborUv,0.).xyz;vec3 neighborNormal=unpackNormal(neighborDepthVelocityTexel.b);float neighborDepth=neighborDepthVelocityTexel.a;\n#endif\nif(neighborDepth==1.0)return 0.;float normalDiff=1.-max(dot(normal,neighborNormal),0.);float depthDiff=10000.*abs(depth-neighborDepth);\n#ifdef GBUFFER_TEXTURE\nfloat roughnessDiff=abs(mat.roughness-neighborMat.roughness);wBasic=exp(-normalDiff*normalPhi-depthDiff*depthPhi-roughnessDiff*roughnessPhi);\n#else\nwBasic=exp(-normalDiff*normalPhi-depthDiff*depthPhi);\n#endif\nwDisoccl=pow(wBasic,0.1)*exp(-normalDiff*5.);}vec3 getNormal(Material mat){\n#ifdef GBUFFER_TEXTURE\nreturn mat.normal;\n#else\nvec3 depthVelocityTexel=textureLod(normalTexture,vUv,0.).xyz;return unpackNormal(depthVelocityTexel.b);\n#endif\n}void outputTexel(inout vec4 outputFrag,InputTexel inp){inp.rgb/=inp.totalWeight;outputFrag.rgb=inp.rgb;toLinearSpace(outputFrag.rgb);outputFrag.a=inp.a;}void applyWeight(inout InputTexel inp,vec2 neighborUv,float wBasic,float wDisoccl){float w=wBasic;vec4 t;if(inp.isSpecular){t=textureLod(inputTexture2,neighborUv,0.);w*=specularFactor;wDisoccl*=specularFactor;}else{t=textureLod(inputTexture,neighborUv,0.);}float lumaDiff=abs(inp.luminance-luminance(t.rgb));float lumaFactor=exp(-lumaDiff*lumaPhi);w=mix(w*lumaFactor,wDisoccl*exp(-lumaDiff),pow(inp.w,3.))*inp.w;w*=step(0.01,w);toDenoiseSpace(t.rgb);inp.rgb+=w*t.rgb;inp.totalWeight+=w;}void main(){depth=textureLod(depthTexture,vUv,0.).r;if(depth==1.0&&fwidth(depth)==0.){discard;return;}InputTexel[textureCount]inputs;float maxAlpha=0.;\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){{vec4 t;if(isTextureSpecular[i]){t=textureLod(inputTexture2,vUv,0.);}else{t=textureLod(inputTexture,vUv,0.);}float age=1./log(exp(t.a*phi)+1.718281828459045);InputTexel inp=InputTexel(t.rgb,t.a,luminance(t.rgb),age,1.,isTextureSpecular[i]);maxAlpha=max(maxAlpha,inp.a);toDenoiseSpace(inp.rgb);inputs[i]=inp;}}\n#pragma unroll_loop_end\nmat=getMaterial(gBufferTexture,vUv);normal=getNormal(mat);float flatness=1.-min(length(fwidth(normal)),1.);flatness*=flatness;flatness*=flatness;flatness=flatness*0.9+0.1;glossiness=1.-mat.roughness;glossiness*=glossiness;specularFactor=exp(-glossiness*specularPhi);float roughnessRadius=mix(mat.roughness*mat.roughness,1.,specularPhi);float r=flatness*radius;for(int i=0;i<8;i++){{vec4 rand=blueNoise(vUv,blueNoiseIndex*8+i);vec2 u=r*(rand.xy*2.-1.)/resolution;float rRoughness=rand.b<mat.metalness ? roughnessRadius : 1.;vec2 neighborUv=vUv+rRoughness*u;float wBasic,wDisoccl;getBasicNeighborWeight(neighborUv,wBasic,wDisoccl);applyWeight(inputs[0],neighborUv,wBasic,wDisoccl);\n#if textureCount == 2\napplyWeight(inputs[1],neighborUv,wBasic,wDisoccl);\n#endif\n}}outputTexel(gOutput0,inputs[0]);\n#if textureCount == 2\noutputTexel(gOutput1,inputs[1]);\n#endif\n}"; // eslint-disable-line

/* eslint-disable camelcase */
const finalFragmentShader$1 = fragmentShader$5.replace("#include <gbuffer_packing>", gbuffer_packing);
const defaultPoissonBlurOptions = {
  iterations: 1,
  radius: 3,
  phi: 0.5,
  lumaPhi: 5,
  depthPhi: 2,
  normalPhi: 3.25,
  inputType: "diffuseSpecular" // can be "diffuseSpecular", "diffuse" or "specular"

};
class PoissonDenoisePass extends Pass {
  constructor(camera, textures, options = defaultPoissonBlurOptions) {
    super("PoissonBlurPass");
    this.iterations = defaultPoissonBlurOptions.iterations;
    this.index = 0;
    options = { ...defaultPoissonBlurOptions,
      ...options
    };
    this.textures = textures;
    let isTextureSpecular = [false, true];
    if (options.inputType === "diffuse") isTextureSpecular = [false, false];
    if (options.inputType === "specular") isTextureSpecular = [true, true];
    const textureCount = options.inputType === "diffuseSpecular" ? 2 : 1;
    const fragmentShader = unrollLoops(finalFragmentShader$1.replaceAll("textureCount", textureCount));
    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader,
      vertexShader,
      uniforms: {
        depthTexture: {
          value: null
        },
        inputTexture: {
          value: textures[0]
        },
        inputTexture2: {
          value: textures[1]
        },
        gBufferTexture: {
          value: null
        },
        normalTexture: {
          value: null
        },
        projectionMatrix: {
          value: camera.projectionMatrix
        },
        projectionMatrixInverse: {
          value: camera.projectionMatrixInverse
        },
        cameraMatrixWorld: {
          value: camera.matrixWorld
        },
        viewMatrix: {
          value: camera.matrixWorldInverse
        },
        radius: {
          value: defaultPoissonBlurOptions.radius
        },
        phi: {
          value: defaultPoissonBlurOptions.phi
        },
        lumaPhi: {
          value: defaultPoissonBlurOptions.lumaPhi
        },
        depthPhi: {
          value: defaultPoissonBlurOptions.depthPhi
        },
        normalPhi: {
          value: defaultPoissonBlurOptions.normalPhi
        },
        roughnessPhi: {
          value: defaultPoissonBlurOptions.roughnessPhi
        },
        specularPhi: {
          value: defaultPoissonBlurOptions.specularPhi
        },
        resolution: {
          value: new Vector2()
        }
      },
      defines: {
        isTextureSpecular: "bool[2](" + isTextureSpecular.join(",") + ")"
      },
      glslVersion: GLSL3
    });
    useBlueNoise(this.fullscreenMaterial);
    const renderTargetOptions = {
      type: HalfFloatType,
      // using HalfFloatType as FloatType with bilinear filtering isn't supported on some Apple devices
      depthBuffer: false
    };
    this.renderTargetA = new WebGLRenderTarget(1, 1, textureCount, renderTargetOptions);
    this.renderTargetB = new WebGLRenderTarget(1, 1, textureCount, renderTargetOptions); // give the textures of renderTargetA and renderTargetB names

    this.renderTargetB.texture[0].name = "PoissonDenoisePass." + (isTextureSpecular[0] ? "specular" : "diffuse");

    if (textureCount > 1) {
      this.renderTargetB.texture[1].name = "PoissonDenoisePass." + (isTextureSpecular[1] ? "specular" : "diffuse");
    }

    const {
      uniforms
    } = this.fullscreenMaterial;
    uniforms["depthPhi"].value = options.depthPhi;
    uniforms["normalPhi"].value = options.normalPhi;
  }

  setSize(width, height) {
    this.renderTargetA.setSize(width, height);
    this.renderTargetB.setSize(width, height);
    this.fullscreenMaterial.uniforms.resolution.value.set(width, height);
  }

  get texture() {
    return this.renderTargetB.texture;
  } // can either be a GBufferPass or a VelocityDepthNormalPass


  setGBufferPass(gBufferPass) {
    if (gBufferPass instanceof GBufferPass) {
      this.fullscreenMaterial.uniforms.gBufferTexture.value = gBufferPass.texture;
      this.fullscreenMaterial.defines.GBUFFER_TEXTURE = "";
    } else {
      this.fullscreenMaterial.uniforms.normalTexture.value = gBufferPass.texture;
    }

    this.fullscreenMaterial.uniforms.depthTexture.value = gBufferPass.renderTarget.depthTexture;
  }

  setnNormalTexture(texture) {
    this.fullscreenMaterial.uniforms.normalTexture.value = texture;
  }

  setDepthTexture(texture) {
    this.fullscreenMaterial.uniforms.depthTexture.value = texture;
  }

  dispose() {
    super.dispose();
    this.renderTargetA.dispose();
    this.renderTargetB.dispose();
    this.fullscreenMaterial.dispose();
  }

  render(renderer) {
    for (let i = 0; i < 2 * this.iterations; i++) {
      const horizontal = i % 2 === 0;
      const inputRenderTarget = horizontal ? this.renderTargetB : this.renderTargetA;
      this.fullscreenMaterial.uniforms["inputTexture"].value = i === 0 ? this.textures[0] : inputRenderTarget.texture[0];
      this.fullscreenMaterial.uniforms["inputTexture2"].value = i === 0 ? this.textures[1] : inputRenderTarget.texture[1];
      const renderTarget = horizontal ? this.renderTargetA : this.renderTargetB;
      renderer.setRenderTarget(renderTarget);
      renderer.render(this.scene, this.camera);
    }
  }

}
PoissonDenoisePass.DefaultOptions = defaultPoissonBlurOptions;

const defaultDenosierOptions = {
  denoiseMode: "full",
  // can be "full" | "full_temporal" | "denoised" | "temporal"
  inputType: "diffuseSpecular",
  // can be "diffuseSpecular" | "diffuse" | "specular"
  gBufferPass: null,
  velocityDepthNormalPass: null
}; // a spatio-temporal denoiser
// temporal: temporal reprojection to reproject previous frames
// spatial: poisson denoiser to denoise the current frame recurrently

class Denoiser {
  constructor(scene, camera, texture, options = defaultDenosierOptions) {
    var _options$velocityDept, _this$denoisePass$tex, _this$denoisePass;

    options = { ...defaultDenosierOptions,
      ...options
    };
    this.options = options;
    this.velocityDepthNormalPass = (_options$velocityDept = options.velocityDepthNormalPass) !== null && _options$velocityDept !== void 0 ? _options$velocityDept : new VelocityDepthNormalPass(scene, camera);
    this.isOwnVelocityDepthNormalPass = !options.velocityDepthNormalPass;
    const textureCount = options.inputType === "diffuseSpecular" ? 2 : 1;
    this.temporalReprojectPass = new TemporalReprojectPass(scene, camera, this.velocityDepthNormalPass, texture, textureCount, {
      fullAccumulate: true,
      logTransform: true,
      copyTextures: !options.denoise,
      reprojectSpecular: [false, true],
      neighborhoodClamp: [true, true],
      neighborhoodClampRadius: 2,
      neighborhoodClampIntensity: 0.5,
      ...options
    });
    const textures = this.temporalReprojectPass.renderTarget.texture.slice(0, textureCount);

    if (this.options.denoiseMode === "full" || this.options.denoiseMode === "denoised") {
      var _options$gBufferPass;

      this.denoisePass = new PoissonDenoisePass(camera, textures, options);
      this.denoisePass.setGBufferPass((_options$gBufferPass = options.gBufferPass) !== null && _options$gBufferPass !== void 0 ? _options$gBufferPass : this.velocityDepthNormalPass);
      this.temporalReprojectPass.overrideAccumulatedTextures = this.denoisePass.renderTargetB.texture;
    }

    const composerInputTextures = (_this$denoisePass$tex = (_this$denoisePass = this.denoisePass) == null ? void 0 : _this$denoisePass.texture) !== null && _this$denoisePass$tex !== void 0 ? _this$denoisePass$tex : textures;

    if (options.denoiseMode.startsWith("full")) {
      this.denoiserComposePass = new DenoiserComposePass(camera, composerInputTextures, options.gBufferPass.texture, options.gBufferPass.renderTarget.depthTexture, options);
    }
  }

  get texture() {
    switch (this.options.denoiseMode) {
      case "full":
      case "full_temporal":
        return this.denoiserComposePass.texture;

      case "denoised":
        return this.denoisePass.texture;

      case "temporal":
        return this.temporalReprojectPass.texture;
    }
  }

  reset() {
    this.temporalReprojectPass.reset();
  }

  setSize(width, height) {
    var _this$denoisePass2, _this$denoiserCompose;

    this.velocityDepthNormalPass.setSize(width, height);
    this.temporalReprojectPass.setSize(width, height);
    (_this$denoisePass2 = this.denoisePass) == null ? void 0 : _this$denoisePass2.setSize(width, height);
    (_this$denoiserCompose = this.denoiserComposePass) == null ? void 0 : _this$denoiserCompose.setSize(width, height);
  }

  dispose() {
    var _this$denoisePass3, _this$denoiserCompose2;

    this.velocityDepthNormalPass.dispose();
    this.temporalReprojectPass.dispose();
    (_this$denoisePass3 = this.denoisePass) == null ? void 0 : _this$denoisePass3.dispose();
    (_this$denoiserCompose2 = this.denoiserComposePass) == null ? void 0 : _this$denoiserCompose2.dispose();
  }

  render(renderer, inputBuffer = null) {
    var _this$denoisePass4, _this$denoiserCompose4;

    if (this.isOwnVelocityDepthNormalPass) this.velocityDepthNormalPass.render(renderer);
    this.temporalReprojectPass.render(renderer);

    if (this.options.inputType !== "diffuseSpecular") {
      var _this$denoiserCompose3;

      (_this$denoiserCompose3 = this.denoiserComposePass) == null ? void 0 : _this$denoiserCompose3.setSceneTexture(inputBuffer.texture);
    }

    (_this$denoisePass4 = this.denoisePass) == null ? void 0 : _this$denoisePass4.render(renderer);
    (_this$denoiserCompose4 = this.denoiserComposePass) == null ? void 0 : _this$denoiserCompose4.render(renderer);
  }

}

/* eslint-disable camelcase */
class GBufferDebugPass extends Pass {
  constructor(gBufferTexture) {
    super("GBufferDebugPass");
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      depthBuffer: false,
      type: FloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter
    });
    this.renderTarget.texture.name = "GBufferDebugPass.Texture";
    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader:
      /* glsl */
      `
            varying vec2 vUv;
            uniform highp sampler2D depthTexture;
			uniform int mode;

            #include <common>
            #include <packing>

            ${gbuffer_packing}

            void main() {
                highp float depth = textureLod(depthTexture, vUv, 0.).r;

				if(depth == 0.){
					gl_FragColor = vec4(0.);
					return;
				}

                Material mat = getMaterial(gBufferTexture, vUv);

                if (mode == 0) {
                    gl_FragColor = vec4(mat.diffuse.rgb, 1.);
                } else if (mode == 1) {
                    gl_FragColor = vec4(mat.diffuse.aaa, 1.);
                } else if (mode == 2) {
                    gl_FragColor = vec4(mat.normal, 1.);
                } else if (mode == 3) {
                    gl_FragColor = vec4(vec3(mat.roughness), 1.);
                } else if (mode == 4) {
                    gl_FragColor = vec4(vec3(mat.metalness), 1.);
                } else {
                    gl_FragColor = vec4(mat.emissive, 1.);
                }
            }
            `,
      vertexShader: vertexShader,
      uniforms: {
        gBufferTexture: {
          value: gBufferTexture
        },
        mode: {
          value: 0
        }
      },
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false
    });
  }

  get texture() {
    return this.renderTarget.texture;
  }

  dispose() {
    this.renderTarget.dispose();
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);
  }

  render(renderer) {
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }

}

/* eslint-disable max-len */

/**
 * Options of the SSGI effect
 * @typedef {Object} SSGIOptions
 * @property {Number} [distance] maximum distance a SSGI ray can travel to find what it reflects
 * @property {Number} [thickness] maximum depth difference between a ray and the particular depth at its screen position before refining with binary search; higher values will result in better performance
 * @property {Number} [envBlur] higher values will result in lower mipmaps being sampled which will cause less noise but also less detail regarding environment lighting
 * @property {Number} [importanceSampling] whether to use importance sampling for the environment map
 * @property {Number} [denoiseIterations] how many times the denoise filter runs, more iterations will denoise the frame better but need more performance
 * @property {Number} [radius] the radius of the denoiser, higher values will result in less noise on less detailled surfaces but more noise on detailled surfaces
 * @property {Number} [depthPhi] depth factor of the denoiser, higher values will use neighboring areas with different depth values more resulting in less noise but loss of details
 * @property {Number} [normalPhi] normals factor of the denoiser, higher values will use neighboring areas with different normals more resulting in less noise but loss of details and sharpness
 * @property {Number} [roughnessPhi] roughness factor of the denoiser setting how much the denoiser should only apply the blur to rougher surfaces, a value of 0 means the denoiser will blur mirror-like surfaces the same as rough surfaces
 * @property {Number} [specularPhi] specular factor of the denoiser setting how much the denoiser will blur specular reflections
 * @property {Number} [lumaPhi] luminance factor of the denoiser setting how aggressive the denoiser is on areas with different luminance
 * @property {Number} [steps] number of steps a SSGI ray can maximally do to find an object it intersected (and thus reflects)
 * @property {Number} [refineSteps] once we had our ray intersect something, we need to find the exact point in space it intersected and thus it reflects; this can be done through binary search with the given number of maximum steps
 * @property {boolean} [missedRays] if there should still be SSGI for rays for which a reflecting point couldn't be found; enabling this will result in stretched looking SSGI which can look good or bad depending on the angle
 * @property {Number} [resolutionScale] resolution of the SSGI effect, a resolution of 0.5 means the effect will be rendered at half resolution
 */

/**
 * The options of the SSGI effect
 * @type {SSGIOptions}
 */
const defaultSSGIOptions = {
  mode: "ssgi",
  distance: 10,
  thickness: 10,
  denoiseIterations: 1,
  denoiseKernel: 2,
  denoiseDiffuse: 10,
  denoiseSpecular: 10,
  radius: 3,
  phi: 0.5,
  lumaPhi: 5,
  depthPhi: 2,
  normalPhi: 50,
  roughnessPhi: 50,
  specularPhi: 50,
  envBlur: 0.5,
  importanceSampling: true,
  steps: 20,
  refineSteps: 5,
  resolutionScale: 1,
  missedRays: false,
  outputTexture: null
};

var ssgi_compose = "#define GLSLIFY 1\nuniform sampler2D inputTexture;uniform sampler2D sceneTexture;uniform highp sampler2D depthTexture;uniform bool isDebug;uniform float cameraNear;uniform float cameraFar;\n#include <fog_pars_fragment>\nfloat getViewZ(const in float depth){\n#if PERSPECTIVE_CAMERA == 1\nreturn perspectiveDepthToViewZ(depth,cameraNear,cameraFar);\n#else\nreturn orthographicDepthToViewZ(depth,cameraNear,cameraFar);\n#endif\n}void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){if(isDebug){outputColor=textureLod(inputTexture,uv,0.);return;}float depth=textureLod(depthTexture,uv,0.).r;vec3 ssgiClr;if(depth==1.0){ssgiClr=textureLod(sceneTexture,uv,0.).rgb;}else{ssgiClr=textureLod(inputTexture,uv,0.).rgb;\n#ifdef USE_FOG\nfloat viewZ=getViewZ(depth)*0.4;vFogDepth=-viewZ;\n#include <fog_fragment>\nssgiClr=mix(ssgiClr,fogColor,fogFactor);\n#endif\n}outputColor=vec4(ssgiClr,1.0);}"; // eslint-disable-line

const {
  render
} = RenderPass.prototype;
const globalIblRadianceDisabledUniform = createGlobalDisableIblRadianceUniform();
class SSGIEffect extends Effect {
  constructor(composer, scene, camera, options) {
    var _scene$fog;

    options = { ...defaultSSGIOptions,
      ...options
    };
    let fragmentShader = ssgi_compose.replace("#include <fog_pars_fragment>", ShaderChunk.fog_pars_fragment.replace("varying", "")); // delete the line starting with gl_FragColor using a regex

    fragmentShader = fragmentShader.replace("#include <fog_fragment>", ShaderChunk.fog_fragment.replace(/.*gl_FragColor.*/g, ""));
    const defines = new Map();
    if (scene.fog) defines.set("USE_FOG", "");
    if ((_scene$fog = scene.fog) != null && _scene$fog.isFogExp2) defines.set("FOG_EXP2", "");
    super("SSGIEffect", fragmentShader, {
      type: "FinalSSGIMaterial",
      uniforms: new Map([["inputTexture", new Uniform(null)], ["sceneTexture", new Uniform(null)], ["depthTexture", new Uniform(null)], ["isDebug", new Uniform(false)], ["fogColor", new Uniform(new Color())], ["fogNear", new Uniform(0)], ["fogFar", new Uniform(0)], ["fogDensity", new Uniform(0)], ["cameraNear", new Uniform(0)], ["cameraFar", new Uniform(0)]]),
      defines: new Map([["PERSPECTIVE_CAMERA", camera.isPerspectiveCamera ? "1" : "0"], ...defines])
    });
    this.selection = new Selection();
    this.isUsingRenderPass = true;
    this._scene = scene;
    this._camera = camera;
    this.composer = composer;

    if (options.mode === "ssr") {
      options.reprojectSpecular = true;
      options.neighborhoodClamp = true;
      options.inputType = "specular";
    } else if (options.mode === "ssgi") {
      options.reprojectSpecular = [false, true];
      options.neighborhoodClamp = [false, true];
    }

    if (typeof options.preset === "string") {
      switch (options.preset) {
        case "low":
          options.steps = 10;
          options.refineSteps = 2;
          options.denoiseMode = "full_temporal";
          break;

        case "medium":
          options.steps = 20;
          options.refineSteps = 4;
          options.denoiseMode = "full";
          break;

        case "medium":
          options.steps = 40;
          options.refineSteps = 4;
          options.denoiseMode = "full";
          break;
      }
    }

    this.ssgiPass = new SSGIPass(this, options);
    this.denoiser = new Denoiser(scene, camera, this.ssgiPass.texture, {
      gBufferPass: this.ssgiPass.gBufferPass,
      velocityDepthNormalPass: options.velocityDepthNormalPass,
      ...options
    });
    this.lastSize = {
      width: options.width,
      height: options.height,
      resolutionScale: options.resolutionScale
    };
    this.sceneRenderTarget = new WebGLRenderTarget(1, 1, {
      colorSpace: SRGBColorSpace
    });
    this.renderPass = new RenderPass(this._scene, this._camera);
    this.renderPass.renderToScreen = false;
    this.setSize(options.width, options.height);
    const th = this;
    const ssgiRenderPass = this.renderPass; // eslint-disable-next-line space-before-function-paren

    RenderPass.prototype.render = function (...args) {
      if (this !== ssgiRenderPass) {
        const wasUsingRenderPass = th.isUsingRenderPass;
        th.isUsingRenderPass = true;
        if (wasUsingRenderPass != th.isUsingRenderPass) th.updateUsingRenderPass();
      }

      render.call(this, ...args);
    };

    this.makeOptionsReactive(options);
    this.outputTexture = this.denoiser.texture; // this.outputTexture = this.denoiser.denoisePass.textures[1]
  }

  updateUsingRenderPass() {
    if (this.isUsingRenderPass) {
      this.ssgiPass.fullscreenMaterial.defines.useDirectLight = "";
    } else {
      delete this.ssgiPass.fullscreenMaterial.defines.useDirectLight;
    }

    this.ssgiPass.fullscreenMaterial.needsUpdate = true;
  }

  reset() {
    this.denoiser.reset();
  }

  makeOptionsReactive(options) {
    let needsUpdate = false;
    const ssgiPassFullscreenMaterialUniforms = this.ssgiPass.fullscreenMaterial.uniforms;
    const ssgiPassFullscreenMaterialUniformsKeys = Object.keys(ssgiPassFullscreenMaterialUniforms);

    for (const key of Object.keys(options)) {
      Object.defineProperty(this, key, {
        get() {
          return options[key];
        },

        set(value) {
          var _this$denoiser$denois;

          if (options[key] === value && needsUpdate) return;
          options[key] = value;

          switch (key) {
            // denoiser
            case "denoiseIterations":
              if (this.denoiser.denoisePass) this.denoiser.denoisePass.iterations = value;
              break;

            case "radius":
            case "phi":
            case "lumaPhi":
            case "depthPhi":
            case "normalPhi":
            case "roughnessPhi":
            case "specularPhi":
              if ((_this$denoiser$denois = this.denoiser.denoisePass) != null && _this$denoiser$denois.fullscreenMaterial.uniforms[key]) {
                this.denoiser.denoisePass.fullscreenMaterial.uniforms[key].value = value;
                this.reset();
              }

              break;

            case "denoiseIterations":
            case "radius":
              if (this.denoiser.denoisePass) this.denoiser.denoisePass[key] = value;
              break;
            // SSGI

            case "resolutionScale":
              this.setSize(this.lastSize.width, this.lastSize.height);
              this.reset();
              break;

            case "steps":
            case "refineSteps":
              this.ssgiPass.fullscreenMaterial.defines[key] = parseInt(value);
              this.ssgiPass.fullscreenMaterial.needsUpdate = needsUpdate;
              this.reset();
              break;

            case "importanceSampling":
            case "missedRays":
              if (value) {
                this.ssgiPass.fullscreenMaterial.defines[key] = "";
              } else {
                delete this.ssgiPass.fullscreenMaterial.defines[key];
              }

              this.ssgiPass.fullscreenMaterial.needsUpdate = needsUpdate;
              this.reset();
              break;

            case "distance":
              ssgiPassFullscreenMaterialUniforms.rayDistance.value = value;
              this.reset();
              break;

            case "outputTexture":
              if (!this.outputTexture) {
                return;
              }

              if (typeof value === "string") {
                if (this.gBufferDebugPass === undefined) {
                  this.gBufferDebugPass = new GBufferDebugPass(this.ssgiPass.gBufferPass.texture);
                  this.gBufferDebugPass.setSize(this.lastSize.width, this.lastSize.height);
                }

                const modes = ["diffuse", "alpha", "normal", "roughness", "metalness", "emissive"];
                const mode = modes.indexOf(value);
                this.gBufferDebugPass.fullscreenMaterial.uniforms.mode.value = mode;
                this.outputTexture = this.gBufferDebugPass.texture;
              } else if (this.gBufferDebugPass !== undefined && this.outputTexture !== this.gBufferDebugPass.texture) {
                this.gBufferDebugPass.dispose();
                delete this.gBufferDebugPass;
              }

              this.uniforms.get("isDebug").value = this.outputTexture !== this.denoiser.texture;
              break;
            // must be a uniform

            default:
              if (ssgiPassFullscreenMaterialUniformsKeys.includes(key)) {
                ssgiPassFullscreenMaterialUniforms[key].value = value;
                this.reset();
              }

          }
        }

      }); // apply all uniforms and defines

      this[key] = options[key];
    }

    needsUpdate = true;
  }

  initialize(renderer, ...args) {
    super.initialize(renderer, ...args);
    this.ssgiPass.initialize(renderer, ...args);
  }

  setSize(width, height, force = false) {
    var _this$gBufferDebugPas, _this$cubeToEquirectE;

    if (width === undefined && height === undefined) return;

    if (!force && width === this.lastSize.width && height === this.lastSize.height && this.resolutionScale === this.lastSize.resolutionScale) {
      return;
    }

    this.ssgiPass.setSize(width, height);
    this.denoiser.setSize(width, height);
    (_this$gBufferDebugPas = this.gBufferDebugPass) == null ? void 0 : _this$gBufferDebugPas.setSize(width, height);
    this.sceneRenderTarget.setSize(width, height);
    (_this$cubeToEquirectE = this.cubeToEquirectEnvPass) == null ? void 0 : _this$cubeToEquirectE.setSize(width, height);
    this.lastSize = {
      width,
      height,
      resolutionScale: this.resolutionScale
    };
  }

  dispose() {
    var _this$cubeToEquirectE2;

    super.dispose();
    this.ssgiPass.dispose();
    this.denoiser.dispose();
    (_this$cubeToEquirectE2 = this.cubeToEquirectEnvPass) == null ? void 0 : _this$cubeToEquirectE2.dispose();
    RenderPass.prototype.render = render;
  }

  keepEnvMapUpdated(renderer) {
    const ssgiMaterial = this.ssgiPass.fullscreenMaterial;
    let environment = this._scene.environment;

    if (environment) {
      if (ssgiMaterial.uniforms.envMapInfo.value.mapUuid !== environment.uuid) {
        // if the environment is a cube texture, convert it to an equirectangular texture so we can sample it in the SSGI pass and use MIS
        if (environment.isCubeTexture) {
          if (!this.cubeToEquirectEnvPass) this.cubeToEquirectEnvPass = new CubeToEquirectEnvPass();
          environment = this.cubeToEquirectEnvPass.generateEquirectEnvMap(renderer, environment);
          environment.uuid = this._scene.environment.uuid;
        }

        if (!environment.generateMipmaps) {
          environment.generateMipmaps = true;
          environment.minFilter = LinearMipMapLinearFilter;
          environment.magFilter = LinearFilter;
          environment.needsUpdate = true;
        }

        if (environment.type === FloatType) {
          console.warn("SSGI: Environment map is FloatType, this causes the environment map to be black in the SSGI pass for many modern Apple devices. Please use HalfFloatType instead.");
        }

        ssgiMaterial.uniforms.envMapInfo.value.mapUuid = environment.uuid;
        const maxEnvMapMipLevel = getMaxMipLevel(environment);
        ssgiMaterial.uniforms.maxEnvMapMipLevel.value = maxEnvMapMipLevel;
        ssgiMaterial.uniforms.envMapInfo.value.map = environment;
        ssgiMaterial.defines.USE_ENVMAP = "";
        delete ssgiMaterial.defines.importanceSampling;

        if (this.importanceSampling) {
          ssgiMaterial.uniforms.envMapInfo.value.updateFrom(environment, renderer).then(() => {
            ssgiMaterial.defines.importanceSampling = "";
            ssgiMaterial.needsUpdate = true;
          });
        } else {
          ssgiMaterial.uniforms.envMapInfo.value.map = environment;
        }

        this.reset();
        ssgiMaterial.needsUpdate = true;
      }
    } else if ("USE_ENVMAP" in ssgiMaterial.defines) {
      delete ssgiMaterial.defines.USE_ENVMAP;
      delete ssgiMaterial.defines.importanceSampling;
      ssgiMaterial.needsUpdate = true;
    }
  }

  get depthTexture() {
    return this.ssgiPass.gBufferPass.depthTexture;
  }

  update(renderer, inputBuffer) {
    var _this$gBufferDebugPas2, _this$outputTexture$;

    this.keepEnvMapUpdated(renderer);
    const sceneBuffer = this.isUsingRenderPass ? inputBuffer : this.sceneRenderTarget;
    const hideMeshes = [];

    if (!this.isUsingRenderPass) {
      const children = [];

      for (const c of getVisibleChildren(this._scene)) {
        if (c.isScene) return;
        c.visible = !isChildMaterialRenderable(c);
        c.visible ? hideMeshes.push(c) : children.push(c);
      }

      this.renderPass.render(renderer, this.sceneRenderTarget);

      for (const c of children) c.visible = true;

      for (const c of hideMeshes) c.visible = false;
    }

    this.ssgiPass.fullscreenMaterial.uniforms.directLightTexture.value = sceneBuffer.texture;
    this.ssgiPass.render(renderer);
    (_this$gBufferDebugPas2 = this.gBufferDebugPass) == null ? void 0 : _this$gBufferDebugPas2.render(renderer);
    this.denoiser.render(renderer, inputBuffer);
    this.uniforms.get("inputTexture").value = (_this$outputTexture$ = this.outputTexture[0]) !== null && _this$outputTexture$ !== void 0 ? _this$outputTexture$ : this.outputTexture;
    this.uniforms.get("sceneTexture").value = sceneBuffer.texture;
    this.uniforms.get("depthTexture").value = this.ssgiPass.gBufferPass.depthTexture; // update the fog uniforms

    if (this._scene.fog) {
      this.uniforms.get("fogColor").value = this._scene.fog.color;
      this.uniforms.get("fogNear").value = this._scene.fog.near;
      this.uniforms.get("fogFar").value = this._scene.fog.far;
      this.uniforms.get("fogDensity").value = this._scene.fog.density;
      this.uniforms.get("cameraNear").value = this._camera.near;
      this.uniforms.get("cameraFar").value = this._camera.far;
    }

    for (const c of hideMeshes) c.visible = true;

    globalIblRadianceDisabledUniform.value = true;
    cancelAnimationFrame(this.rAF2);
    cancelAnimationFrame(this.rAF);
    cancelAnimationFrame(this.usingRenderPassRAF);
    this.rAF = requestAnimationFrame(() => {
      this.rAF2 = requestAnimationFrame(() => {
        globalIblRadianceDisabledUniform.value = false;
      });
    });
    this.usingRenderPassRAF = requestAnimationFrame(() => {
      const wasUsingRenderPass = this.isUsingRenderPass;
      this.isUsingRenderPass = false;
      if (wasUsingRenderPass != this.isUsingRenderPass) this.updateUsingRenderPass();
    });
  }

}
SSGIEffect.DefaultOptions = defaultSSGIOptions;

class SSREffect extends SSGIEffect {
  constructor(composer, scene, camera, options = {}) {
    options.mode = "ssr";
    super(composer, scene, camera, options);
  }

}

var motion_blur = "#define GLSLIFY 1\nuniform sampler2D inputTexture;uniform highp sampler2D velocityTexture;uniform vec2 resolution;uniform float intensity;uniform float jitter;uniform float deltaTime;uniform int frame;uniform vec2 texSize;void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){vec2 velocity=textureLod(velocityTexture,vUv,0.0).xy;bool didMove=dot(velocity,velocity)>0.000000001;if(!didMove){outputColor=inputColor;return;}velocity*=intensity;vec4 blueNoise=blueNoise(vUv,frame);vec2 jitterOffset=jitter*velocity*blueNoise.xy;float frameSpeed=(1./100.)/deltaTime;vec2 startUv=vUv+(jitterOffset-velocity*0.5)*frameSpeed;vec2 endUv=vUv+(jitterOffset+velocity*0.5)*frameSpeed;startUv=max(vec2(0.),startUv);endUv=min(vec2(1.),endUv);vec3 motionBlurredColor=inputColor.rgb;for(float i=0.0;i<=samplesFloat;i++){vec2 reprojectedUv=mix(startUv,endUv,i/samplesFloat);vec3 neighborColor=textureLod(inputTexture,reprojectedUv,0.0).rgb;motionBlurredColor+=neighborColor;}motionBlurredColor/=samplesFloat+2.;outputColor=vec4(motionBlurredColor,inputColor.a);}"; // eslint-disable-line

/* eslint-disable camelcase */
// http://john-chapman-graphics.blogspot.com/2013/01/per-object-motion-blur.html
// reference code: https://github.com/gkjohnson/threejs-sandbox/blob/master/motionBlurPass/src/CompositeShader.js

const defaultOptions$1 = {
  intensity: 1,
  jitter: 1,
  samples: 16
};
class MotionBlurEffect extends Effect {
  constructor(velocityPass, options = defaultOptions$1) {
    options = { ...defaultOptions$1,
      ...options
    };
    const {
      fragmentShader,
      uniforms
    } = setupBlueNoise(motion_blur); // convert the uniforms from type { uniform: value,... } to type ["uniform", value,...]

    const formattedUniforms = [];

    for (const key of Object.keys(uniforms)) {
      formattedUniforms.push([key, uniforms[key]]);
    }

    super("MotionBlurEffect", fragmentShader, {
      type: "MotionBlurMaterial",
      uniforms: new Map([...formattedUniforms, ["inputTexture", new Uniform(null)], ["velocityTexture", new Uniform(velocityPass.texture)], ["resolution", new Uniform(new Vector2())], ["intensity", new Uniform(1)], ["jitter", new Uniform(1)], ["frame", new Uniform(0)], ["deltaTime", new Uniform(0)]]),
      defines: new Map([["samples", options.samples.toFixed(0)], ["samplesFloat", options.samples.toFixed(0) + ".0"]])
    });
    this.pointsIndex = 0;
    this.makeOptionsReactive(options);
  }

  makeOptionsReactive(options) {
    for (const key of Object.keys(options)) {
      Object.defineProperty(this, key, {
        get() {
          return options[key];
        },

        set(value) {
          options[key] = value;

          switch (key) {
            case "intensity":
            case "jitter":
              this.uniforms.get(key).value = value;
              break;
          }
        }

      });
      this[key] = options[key];
    }
  }

  initialize(renderer, ...args) {
    super.initialize(renderer, ...args);
    new TextureLoader().load(blueNoiseImage, blueNoiseTexture => {
      blueNoiseTexture.minFilter = NearestFilter;
      blueNoiseTexture.magFilter = NearestFilter;
      blueNoiseTexture.wrapS = RepeatWrapping;
      blueNoiseTexture.wrapT = RepeatWrapping;
      blueNoiseTexture.colorSpace = NoColorSpace;
      this.uniforms.get("blueNoiseTexture").value = blueNoiseTexture;
    });
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get("inputTexture").value = inputBuffer.texture;
    this.uniforms.get("deltaTime").value = Math.max(1 / 1000, deltaTime);
    const frame = renderer.info.render.frame % 4096;
    this.uniforms.get("frame").value = frame;
    this.uniforms.get("resolution").value.set(window.innerWidth, window.innerHeight);
    const noiseTexture = this.uniforms.get("blueNoiseTexture").value;

    if (noiseTexture) {
      const {
        width,
        height
      } = noiseTexture.source.data;
      this.uniforms.get("blueNoiseSize").value.set(width, height);
    }
  }

}

class VelocityPass extends VelocityDepthNormalPass {
  constructor(scene, camera) {
    super(scene, camera, false);
  }

}

class AOPass extends Pass {
  constructor(camera, scene, depthTexture, fragmentShader) {
    super();
    this._camera = camera;
    this._scene = scene;
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      colorSpace: SRGBColorSpace,
      depthBuffer: false
    });
    console.log(depthTexture);
    const finalFragmentShader = fragmentShader;
    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader: finalFragmentShader,
      vertexShader,
      uniforms: {
        depthTexture: {
          value: depthTexture
        },
        normalTexture: {
          value: null
        },
        cameraNear: {
          value: 0
        },
        cameraFar: {
          value: 0
        },
        viewMatrix: {
          value: this._camera.matrixWorldInverse
        },
        projectionViewMatrix: {
          value: new Matrix4()
        },
        projectionMatrix: {
          value: this._camera.projectionMatrix
        },
        projectionMatrixInverse: {
          value: this._camera.projectionMatrixInverse
        },
        cameraMatrixWorld: {
          value: this._camera.matrixWorld
        },
        resolution: {
          value: new Vector2()
        },
        blueNoiseTexture: {
          value: null
        },
        blueNoiseRepeat: {
          value: new Vector2()
        },
        aoDistance: {
          value: 0
        },
        distancePower: {
          value: 0
        },
        bias: {
          value: 0
        },
        thickness: {
          value: 0
        },
        power: {
          value: 0
        }
      },
      blending: NoBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false
    });
    useBlueNoise(this.fullscreenMaterial);
  }

  get texture() {
    return this.renderTarget.texture;
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);
    this.fullscreenMaterial.uniforms.resolution.value.set(this.renderTarget.width, this.renderTarget.height);
  }

  render(renderer) {
    this.fullscreenMaterial.uniforms.cameraNear.value = this._camera.near;
    this.fullscreenMaterial.uniforms.cameraFar.value = this._camera.far;
    this.fullscreenMaterial.uniforms.projectionViewMatrix.value.multiplyMatrices(this._camera.projectionMatrix, this._camera.matrixWorldInverse);
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }

}

var hbao_utils = "#define GLSLIFY 1\nuniform sampler2D normalTexture;uniform float cameraNear;uniform float cameraFar;uniform mat4 projectionMatrixInverse;uniform mat4 cameraMatrixWorld;float getViewZ(const float depth){\n#ifdef PERSPECTIVE_CAMERA\nreturn perspectiveDepthToViewZ(depth,cameraNear,cameraFar);\n#else\nreturn orthographicDepthToViewZ(depth,cameraNear,cameraFar);\n#endif\n}vec3 getWorldPos(const float depth,const vec2 coord){float z=depth*2.0-1.0;vec4 clipSpacePosition=vec4(coord*2.0-1.0,z,1.0);vec4 viewSpacePosition=projectionMatrixInverse*clipSpacePosition;vec4 worldSpacePosition=cameraMatrixWorld*viewSpacePosition;worldSpacePosition.xyz/=worldSpacePosition.w;return worldSpacePosition.xyz;}vec3 slerp(const vec3 a,const vec3 b,const float t){float cosAngle=dot(a,b);float angle=acos(cosAngle);if(abs(angle)<0.001){return mix(a,b,t);}float sinAngle=sin(angle);float t1=sin((1.0-t)*angle)/sinAngle;float t2=sin(t*angle)/sinAngle;return(a*t1)+(b*t2);}vec3 computeWorldNormal(){vec2 size=vec2(textureSize(depthTexture,0));ivec2 p=ivec2(vUv*size);float c0=texelFetch(depthTexture,p,0).x;float l2=texelFetch(depthTexture,p-ivec2(2,0),0).x;float l1=texelFetch(depthTexture,p-ivec2(1,0),0).x;float r1=texelFetch(depthTexture,p+ivec2(1,0),0).x;float r2=texelFetch(depthTexture,p+ivec2(2,0),0).x;float b2=texelFetch(depthTexture,p-ivec2(0,2),0).x;float b1=texelFetch(depthTexture,p-ivec2(0,1),0).x;float t1=texelFetch(depthTexture,p+ivec2(0,1),0).x;float t2=texelFetch(depthTexture,p+ivec2(0,2),0).x;float dl=abs((2.0*l1-l2)-c0);float dr=abs((2.0*r1-r2)-c0);float db=abs((2.0*b1-b2)-c0);float dt=abs((2.0*t1-t2)-c0);vec3 ce=getWorldPos(c0,vUv).xyz;vec3 dpdx=(dl<dr)? ce-getWorldPos(l1,(vUv-vec2(1.0/size.x,0.0))).xyz :-ce+getWorldPos(r1,(vUv+vec2(1.0/size.x,0.0))).xyz;vec3 dpdy=(db<dt)? ce-getWorldPos(b1,(vUv-vec2(0.0,1.0/size.y))).xyz :-ce+getWorldPos(t1,(vUv+vec2(0.0,1.0/size.y))).xyz;return normalize(cross(dpdx,dpdy));}vec3 getWorldNormal(const vec2 uv){\n#ifdef useNormalTexture\nvec3 worldNormal=unpackRGBToNormal(textureLod(normalTexture,uv,0.).rgb);worldNormal=(vec4(worldNormal,1.)*viewMatrix).xyz;return normalize(worldNormal);\n#else\nreturn computeWorldNormal();\n#endif\n}\n#define PI 3.14159265358979323846264338327950288\nvec3 cosineSampleHemisphere(const vec3 n,const vec2 u){float r=sqrt(u.x);float theta=2.0*PI*u.y;vec3 b=normalize(cross(n,vec3(0.0,1.0,1.0)));vec3 t=cross(b,n);return normalize(r*sin(theta)*b+sqrt(1.0-u.x)*n+r*cos(theta)*t);}"; // eslint-disable-line

var fragmentShader$4 = "#define GLSLIFY 1\nvarying vec2 vUv;uniform highp sampler2D depthTexture;uniform mat4 projectionViewMatrix;uniform int frame;uniform vec2 resolution;uniform float aoDistance;uniform float distancePower;uniform float bias;uniform float thickness;\n#include <packing>\n#include <hbao_utils>\nconst vec3 samples[]=vec3[](vec3(0.176085,0.000000,0.984375),vec3(-0.223111,0.204388,0.953125),vec3(0.033876,-0.386004,0.921875),vec3(0.276681,0.360881,0.890625),vec3(-0.503529,-0.089067,0.859375),vec3(0.472962,-0.300859,0.828125),vec3(-0.156838,0.583431,0.796875),vec3(-0.296496,-0.570884,0.765625),vec3(0.637559,0.232835,0.734375),vec3(-0.657271,0.271312,0.703125),vec3(0.313928,-0.670845,0.671875),vec3(0.229806,0.732659,0.640625),vec3(-0.686011,-0.397557,0.609375),vec3(0.796917,-0.175200,0.578125),vec3(-0.481507,0.684894,0.546875),vec3(-0.110110,-0.849710,0.515625),vec3(0.668961,0.563801,0.484375),vec3(-0.890686,0.036833,0.453125),vec3(0.642663,-0.639536,0.421875),vec3(-0.042522,0.919567,0.390625),vec3(-0.597905,-0.716491,0.359375),vec3(0.936198,0.125964,0.328125),vec3(-0.783851,0.545383,0.296875),vec3(0.211597,-0.940569,0.265625),vec3(0.483333,0.843480,0.234375),vec3(-0.932832,-0.297599,0.203125),vec3(0.894282,-0.413181,0.171875),vec3(-0.382225,0.913307,0.140625),vec3(-0.336422,-0.935338,0.109375),vec3(0.882484,0.463809,0.078125),vec3(-0.965907,0.254610,0.046875),vec3(0.540772,-0.841024,0.015625),vec3(0.169355,0.985431,-0.015625),vec3(-0.789754,-0.611630,-0.046875),vec3(0.993540,-0.082313,-0.078125),vec3(-0.675005,0.729661,-0.109375),vec3(0.004830,-0.990051,-0.140625),vec3(0.661887,0.729633,-0.171875),vec3(-0.974974,-0.090360,-0.203125),vec3(0.774372,-0.587721,-0.234375),vec3(-0.172554,0.948509,-0.265625),vec3(-0.508594,-0.808206,-0.296875),vec3(0.911040,0.249678,-0.328125),vec3(-0.830249,0.426070,-0.359375),vec3(0.319999,-0.863141,-0.390625),vec3(0.341847,0.839739,-0.421875),vec3(-0.805561,-0.381771,-0.453125),vec3(0.836028,-0.257756,-0.484375),vec3(-0.433224,0.739221,-0.515625),vec3(-0.175775,-0.818554,-0.546875),vec3(0.665199,0.472526,-0.578125),vec3(-0.786795,0.098057,-0.609375),vec3(0.497699,-0.584718,-0.640625),vec3(0.026992,0.740173,-0.671875),vec3(-0.499107,-0.506465,-0.703125),vec3(0.677858,0.034659,-0.734375),vec3(-0.495910,0.409746,-0.765625),vec3(0.083481,-0.598349,-0.796875),vec3(0.317896,0.461683,-0.828125),vec3(-0.498324,-0.114663,-0.859375),vec3(0.395651,-0.224160,-0.890625),vec3(-0.119570,0.368578,-0.921875),vec3(-0.125566,-0.275292,-0.953125),vec3(0.162100,0.068771,-0.984375));float getOcclusion(const vec3 cameraPosition,const vec3 worldPos,const vec3 worldNormal,const float depth,const int seed,inout float totalWeight){vec4 blueNoise=blueNoise(vUv,seed);vec3 sampleWorldDir=cosineSampleHemisphere(worldNormal,blueNoise.rg);vec3 sampleWorldPos=worldPos+aoDistance*pow(blueNoise.b,distancePower+1.0)*sampleWorldDir;vec4 sampleUv=projectionViewMatrix*vec4(sampleWorldPos,1.);sampleUv.xy/=sampleUv.w;sampleUv.xy=sampleUv.xy*0.5+0.5;float sampleDepth=textureLod(depthTexture,sampleUv.xy,0.0).r;float deltaDepth=depth-sampleDepth;float d=distance(sampleWorldPos,cameraPosition);deltaDepth*=0.001*d*d;float th=thickness*0.01;float theta=dot(worldNormal,sampleWorldDir);totalWeight+=theta;if(deltaDepth<th){float horizon=sampleDepth+deltaDepth*bias*1000.;float occlusion=max(0.0,horizon-depth)*theta;float m=max(0.,1.-deltaDepth/th);occlusion=10.*occlusion*m/d;occlusion=pow(occlusion,0.1);return occlusion;}return 0.;}void main(){float depth=textureLod(depthTexture,vUv,0.0).r;if(depth==1.0){discard;return;}vec4 cameraPosition=cameraMatrixWorld*vec4(0.0,0.0,0.0,1.0);vec3 worldPos=getWorldPos(depth,vUv);vec3 worldNormal=getWorldNormal(vUv);float ao=0.0,totalWeight=0.0;for(int i=0;i<spp;i++){int seed=blueNoiseIndex*spp+i;float occlusion=getOcclusion(cameraPosition.xyz,worldPos,worldNormal,depth,seed,totalWeight);ao+=occlusion;}if(totalWeight>0.)ao/=totalWeight;ao=clamp(1.-ao,0.,1.);gl_FragColor=vec4(worldNormal,ao);}"; // eslint-disable-line

const finalFragmentShader = fragmentShader$4.replace("#include <hbao_utils>", hbao_utils);

class HBAOPass extends AOPass {
  constructor(camera, scene, depthTexture) {
    super(camera, scene, depthTexture, finalFragmentShader);
  }

}

var ao_compose = "#define GLSLIFY 1\nuniform sampler2D inputTexture;uniform highp sampler2D depthTexture;uniform float power;uniform vec3 color;void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){float unpackedDepth=textureLod(depthTexture,uv,0.).r;float ao=unpackedDepth>0.9999 ? 1.0 : textureLod(inputTexture,uv,0.0).a;ao=pow(ao,power);vec3 aoColor=mix(color,vec3(1.),ao);aoColor*=inputColor.rgb;outputColor=vec4(vec3(ao),inputColor.a);}"; // eslint-disable-line

const defaultAOOptions = {
  resolutionScale: 1,
  spp: 8,
  distance: 2,
  distancePower: 1,
  power: 2,
  bias: 40,
  thickness: 0.075,
  color: new Color("black"),
  velocityDepthNormalPass: null,
  normalTexture: null
};

class AOEffect extends Effect {
  constructor(composer, depthTexture, aoPass, options = defaultAOOptions) {
    super("AOEffect", ao_compose, {
      type: "FinalAOMaterial",
      uniforms: new Map([["inputTexture", new Uniform(null)], ["depthTexture", new Uniform(depthTexture)], ["power", new Uniform(0)], ["color", new Uniform(new Color("black"))]])
    });
    this.lastSize = {
      width: 0,
      height: 0,
      resolutionScale: 0
    };
    this.composer = composer;
    this.aoPass = aoPass;
    options = { ...defaultAOOptions,
      ...options
    };
    this.makeOptionsReactive(options);
  }

  makeOptionsReactive(options) {
    for (const key of Object.keys(options)) {
      Object.defineProperty(this, key, {
        get() {
          return options[key];
        },

        set(value) {
          if (value === null || value === undefined) return;
          options[key] = value;

          switch (key) {
            case "spp":
              this.aoPass.fullscreenMaterial.defines.spp = value.toFixed(0);
              this.aoPass.fullscreenMaterial.needsUpdate = true;
              break;

            case "distance":
              this.aoPass.fullscreenMaterial.uniforms.aoDistance.value = value;
              break;

            case "resolutionScale":
              this.setSize(this.lastSize.width, this.lastSize.height);
              break;

            case "power":
              this.uniforms.get("power").value = value;
              break;

            case "color":
              this.uniforms.get("color").value.copy(new Color(value));
              break;

            default:
              if (key in this.aoPass.fullscreenMaterial.uniforms) {
                this.aoPass.fullscreenMaterial.uniforms[key].value = value;
              }

          }
        },

        configurable: true
      }); // apply all uniforms and defines

      this[key] = options[key];
    }
  }

  setSize(width, height) {
    if (width === undefined || height === undefined) return;

    if (width === this.lastSize.width && height === this.lastSize.height && this.resolutionScale === this.lastSize.resolutionScale) {
      return;
    }

    this.aoPass.setSize(width * this.resolutionScale, height * this.resolutionScale);
    this.lastSize = {
      width,
      height,
      resolutionScale: this.resolutionScale
    };
  }

  get texture() {
    if (this.iterations > 0) {
      return this.PoissonDenoisePass.texture;
    }

    return this.aoPass.texture;
  }

  update(renderer) {
    // check if TRAA is being used so we can animate the noise
    const hasTRAA = this.composer.passes.some(pass => {
      var _pass$effects;

      return pass.enabled && !pass.skipRendering && ((_pass$effects = pass.effects) == null ? void 0 : _pass$effects.some(effect => effect instanceof TRAAEffect));
    }); // set animated noise depending on TRAA

    if (hasTRAA && !("animatedNoise" in this.aoPass.fullscreenMaterial.defines)) {
      this.aoPass.fullscreenMaterial.defines.animatedNoise = "";
      this.aoPass.fullscreenMaterial.needsUpdate = true;
    } else if (!hasTRAA && "animatedNoise" in this.aoPass.fullscreenMaterial.defines) {
      delete this.aoPass.fullscreenMaterial.defines.animatedNoise;
      this.aoPass.fullscreenMaterial.needsUpdate = true;
    }

    this.uniforms.get("inputTexture").value = this.texture;
    this.aoPass.render(renderer);
  }

}

AOEffect.DefaultOptions = defaultAOOptions;

class HBAOEffect extends AOEffect {
  constructor(composer, camera, scene, depthTexture, options = AOEffect.DefaultOptions) {
    const hbaoPass = new HBAOPass(camera, scene, depthTexture);
    options = { ...AOEffect.DefaultOptions,
      ...HBAOEffect.DefaultOptions,
      ...options
    };
    super(composer, depthTexture, hbaoPass, options);
    this.lastSize = {
      width: 0,
      height: 0,
      resolutionScale: 0
    };
    options = { ...AOEffect.DefaultOptions,
      ...options
    };
  }

}

var taa = "#define GLSLIFY 1\nvarying vec2 vUv;uniform sampler2D inputTexture;uniform sampler2D acculumatedTexture;uniform float cameraNotMovedFrames;void main(){vec4 color=linearToOutputTexel(textureLod(inputTexture,vUv,0.));if(cameraNotMovedFrames==0.){gl_FragColor=color;return;}vec4 acculumatedColor=textureLod(acculumatedTexture,vUv,0.);gl_FragColor=mix(acculumatedColor,color,1./(cameraNotMovedFrames+1.));}"; // eslint-disable-line

class TAAPass extends Pass {
  constructor(camera) {
    super("TAAPass");
    this.accumulatedTexture = null;
    this.lastCameraPosition = new Vector3();
    this.lastCameraQuaternion = new Quaternion();
    this.lastCameraProjectionMatrix = null;
    this.cameraNotMovedFrames = 0;
    this.frame = 0;
    this.needsUpdate = false;
    this.renderToScreen = true;
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      type: FloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      depthBuffer: false
    });
    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader: taa,
      vertexShader,
      uniforms: {
        inputTexture: {
          value: null
        },
        acculumatedTexture: {
          value: null
        },
        cameraNotMovedFrames: {
          value: 0
        },
        invTexSize: {
          value: new Vector2(1, 1)
        }
      },
      toneMapped: false,
      depthWrite: false,
      depthTest: false
    });
    this._camera = camera;
  }

  setSize(width, height) {
    var _this$framebufferText;

    this.renderTarget.setSize(width, height);
    (_this$framebufferText = this.framebufferTexture) == null ? void 0 : _this$framebufferText.dispose();
    this.framebufferTexture = new FramebufferTexture(width, height, RGBAFormat);
    this.framebufferTexture.needsUpdate = true;
    this.fullscreenMaterial.uniforms.acculumatedTexture.value = this.framebufferTexture;
    this.needsUpdate = true;
  }

  render(renderer, inputBuffer) {
    this.frame = (this.frame + 1) % 4096;
    this.fullscreenMaterial.uniforms.inputTexture.value = inputBuffer.texture;
    this.fullscreenMaterial.uniforms.invTexSize.value.set(1 / inputBuffer.width, 1 / inputBuffer.height); // check if the camera has moved by comparing the camera's world matrix and projection matrix

    const cameraMoved = this.needsUpdate || didCameraMove(this._camera, this.lastCameraPosition, this.lastCameraQuaternion);
    this.needsUpdate = false;
    const cameraNotMovedFrames = this.fullscreenMaterial.uniforms.cameraNotMovedFrames.value;

    if (cameraNotMovedFrames > 0) {
      const {
        width,
        height
      } = this.framebufferTexture.image;
      jitter(width, height, this._camera, this.frame, 1);
    }

    this.fullscreenMaterial.uniforms.cameraNotMovedFrames.value = cameraMoved ? 0 : (cameraNotMovedFrames + 1) % 4096;
    this.lastCameraPosition.copy(this._camera.position);
    this.lastCameraQuaternion.copy(this._camera.quaternion);
    renderer.setRenderTarget(null);
    renderer.render(this.scene, this.camera);
    renderer.copyFramebufferToTexture(this.renderTarget, this.framebufferTexture);
  }

}

const fragmentShader$3 =
/* glsl */
`
uniform sampler2D inputTexture;
uniform float sharpness;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec4 blurredPixel = texture(inputTexture, uv - 1.0 * texelSize);
    blurredPixel += texture(inputTexture, uv + vec2(0.0, -1.0) * texelSize);
    blurredPixel += texture(inputTexture, uv + vec2(1.0, -1.0) * texelSize);
    blurredPixel += texture(inputTexture, uv + vec2(-1.0, 0.0) * texelSize);
    blurredPixel += inputColor;
    blurredPixel += texture(inputTexture, uv + vec2(1.0, 0.0) * texelSize);
    blurredPixel += texture(inputTexture, uv + vec2(-1.0, 1.0) * texelSize);
    blurredPixel += texture(inputTexture, uv + vec2(0.0, 1.0) * texelSize);
    blurredPixel += texture(inputTexture, uv + 1.0 * texelSize);
    blurredPixel /= 9.0;

    // Calculate the sharpness difference
    vec4 sharpDiff = inputColor - blurredPixel;

    // Apply the sharpness effect by adding the difference scaled by the sharpness value
    vec4 sharpenedPixel = inputColor + sharpDiff * sharpness;

	// set minimun to 0 as otherwise we get severe edge artifacts on Mac Sonoma Firefox v120 for example
	sharpenedPixel.rgb = max(sharpenedPixel.rgb, vec3(0.0));

    outputColor = sharpenedPixel;
}
`;
const defaultOptions = {
  sharpness: 1
};
class SharpnessEffect extends Effect {
  constructor(options = defaultOptions) {
    options = { ...defaultOptions,
      ...options
    };
    super("SharpnessEffect", fragmentShader$3, {
      uniforms: new Map([["sharpness", new Uniform(options.sharpness)], ["inputTexture", new Uniform(null)]])
    });
    this.setSharpness(options.sharpness);
  }

  setSharpness(sharpness) {
    this.uniforms.get("sharpness").value = sharpness;
  }

  update(renderer, inputBuffer) {
    this.uniforms.get("inputTexture").value = inputBuffer.texture;
  }

}

const fragmentShader$2 =
/* glsl */
`
        uniform highp sampler2D depthTexture;
        uniform mat4 projectionMatrix;
        uniform mat4 projectionMatrixInverse;
        uniform mat4 cameraMatrixWorld;
        uniform vec3 backgroundColor;
        uniform float maxDistance;

        // source: https://github.com/mrdoob/three.js/blob/79ea10830dfc97b6c0a7e29d217c7ff04c081095/examples/jsm/shaders/BokehShader.js#L66
        float getViewZ(const in float depth) {
            #if PERSPECTIVE_CAMERA == 1
            return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
            #else
            return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
            #endif
        }

        // source:
        // https://github.com/mrdoob/three.js/blob/dev/examples/js/shaders/SSAOShader.js
        vec3 getViewPosition(float viewZ) {
            float clipW = projectionMatrix[2][3] * viewZ + projectionMatrix[3][3];
            vec4 clipPosition = vec4((vec3(vUv, viewZ) - 0.5) * 2.0, 1.0);
            clipPosition *= clipW;
            vec3 p = (projectionMatrixInverse * clipPosition).xyz;
            p.z = viewZ;
            return p;
        }

        void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
            float depth = textureLod(depthTexture, uv, 0.).r;

            // get the world position from the depth texture
            float viewZ = getViewZ(depth);
            // view-space position of the current texel
            vec3 viewPos = getViewPosition(viewZ);
            vec3 worldPos = (cameraMatrixWorld * vec4(viewPos, 1.)).xyz;
            float distToCenter = length(worldPos.xz) + max(0., -worldPos.y);
            float fade = clamp(pow(distToCenter, 0.1) * 15.0 - maxDistance, 0., 1.);

            vec3 color = mix(inputColor.rgb, backgroundColor, fade);

            outputColor = vec4(color, 1.);
        }
`;
class GradualBackgroundEffect extends Effect {
  constructor(camera, depthTexture, backgroundColor, maxDistance = 5) {
    super("GradualBackgroundEffect", fragmentShader$2, {
      uniforms: new Map([["projectionMatrix", {
        value: camera.projectionMatrix
      }], ["projectionMatrixInverse", {
        value: camera.projectionMatrixInverse
      }], ["cameraMatrixWorld", {
        value: camera.matrixWorld
      }], ["depthTexture", {
        value: depthTexture
      }], ["backgroundColor", {
        value: backgroundColor
      }], ["maxDistance", {
        value: maxDistance
      }]]),
      defines: new Map([["PERSPECTIVE_CAMERA", camera.isPerspectiveCamera ? "1" : "0"]])
    });
  }

  setBackgroundColor(color) {
    this.uniforms.get("backgroundColor").value = color;
  }

  setMaxDistance(distance) {
    this.uniforms.get("maxDistance").value = distance;
  }

}

const fragmentShader$1 =
/* glsl */
`
    #define luminance(c) dot(c.rgb, vec3(0.299, 0.587, 0.114))

    ${gbuffer_packing}

    uniform highp sampler2D velocityTexture;
    uniform mat4 projectionMatrix;
    uniform mat4 projectionMatrixInverse;
    uniform mat4 viewMatrix;
    uniform mat4 cameraMatrixWorld;
    uniform vec3 backgroundColor;
    uniform float spread;
    uniform float intensity;

    // source: https://github.com/mrdoob/three.js/blob/79ea10830dfc97b6c0a7e29d217c7ff04c081095/examples/jsm/shaders/BokehShader.js#L66
    float getViewZ(const in float depth) {
        #if PERSPECTIVE_CAMERA == 1
        return perspectiveDepthToViewZ(depth, cameraNear, cameraFar);
        #else
        return orthographicDepthToViewZ(depth, cameraNear, cameraFar);
        #endif
    }

    // source:
    // https://github.com/mrdoob/three.js/blob/dev/examples/js/shaders/SSAOShader.js
    vec3 getViewPosition(float viewZ) {
        float clipW = projectionMatrix[2][3] * viewZ + projectionMatrix[3][3];
        vec4 clipPosition = vec4((vec3(vUv, viewZ) - 0.5) * 2.0, 1.0);
        clipPosition *= clipW;
        vec3 p = (projectionMatrixInverse * clipPosition).xyz;
        p.z = viewZ;
        return p;
    }

    float nn(vec2 n) {
        const vec2 d = vec2(0.0, 1.0);
        vec2 b = floor(n), f = smoothstep(vec2(0.0), vec2(1.0), fract(n));
        return mix(mix(rand(b), rand(b + d.yx), f.x), mix(rand(b + d.xy), rand(b + d.yy), f.x), f.y);
    }

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec4 velocityTexel = textureLod(velocityTexture, uv, 0.0);

        float depth = velocityTexel.a;

        if(depth == 0. || depth == 1.) {
            outputColor = inputColor;
            return;
        }

        vec3 normal = unpackNormal(velocityTexel.b);
        vec3 viewNormal = normalize((viewMatrix * vec4(normal, 0.)).xyz);

        // get the world position from the depth texture
        float viewZ = getViewZ(depth);
        // view-space position of the current texel
        vec3 viewPos = getViewPosition(viewZ);
        vec3 viewDir = normalize(viewPos);
        vec3 worldPos = (cameraMatrixWorld * vec4(viewPos, 1.)).xyz;

        if(worldPos.y < 0.01){
            outputColor = inputColor;
            return;
        }

        vec3 cameraPos = (cameraMatrixWorld * vec4(0., 0., 0., 1.)).xyz;

        float dist = length(worldPos - cameraPos);
        float distFactor = exp(-dist * 0.005);

        // using world normal and world position, determine how much the surface is facing the camera
        float facing = max(dot(-viewDir, viewNormal), 0.);
        facing = pow(facing, 4.);
        
        // facing = mix(facing, bn, 0.1);

        vec2 offset = normalize(worldPos).xz * 1000. + normal.xz * 500.;

        float noise = nn(offset);
        noise = pow(noise, 500. * spread);

        float lum = luminance(inputColor.rgb);
        lum = smoothstep(0.15, 1., lum);

        float sparkleFactor = noise * lum * facing * distFactor * 5000. * intensity;

        vec3 color = inputColor.rgb + pow(inputColor.rgb, vec3(4.)) * sparkleFactor;
        outputColor = vec4(color, 1.);
    }
`;
class SparkleEffect extends Effect {
  constructor(camera, velocityDepthNormalPass) {
    super("SparkleEffect", fragmentShader$1, {
      uniforms: new Map([["projectionMatrix", {
        value: camera.projectionMatrix.clone()
      }], ["projectionMatrixInverse", {
        value: camera.projectionMatrixInverse.clone()
      }], ["cameraMatrixWorld", {
        value: camera.matrixWorld
      }], ["viewMatrix", {
        value: camera.matrixWorldInverse
      }], ["velocityTexture", {
        value: velocityDepthNormalPass.texture
      }], ["spread", {
        value: 1
      }], ["intensity", {
        value: 1
      }]])
    });
    this._camera = camera;
  }

  update() {
    const {
      view
    } = this._camera;
    view && this._camera.clearViewOffset();
    this.uniforms.get("projectionMatrix").value.copy(this._camera.projectionMatrix);
    this.uniforms.get("projectionMatrixInverse").value.copy(this._camera.projectionMatrixInverse);
    view && this._camera.setViewOffset(view.fullWidth, view.fullHeight, view.offsetX, view.offsetY, view.width, view.height);
  }

  setSpread(spread) {
    this.uniforms.get("spread").value = spread;
  }

  setIntensity(intensity) {
    this.uniforms.get("intensity").value = intensity;
  }

}

const fragmentShader =
/* glsl */
`
    uniform sampler2D inputTexture;
    // uniform sampler2D chessboardTexture;
    uniform vec2 resolution;

    uniform float alphax;
    uniform float alphay;
    uniform float aberration;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        // source: https://marcodiiga.github.io/radial-lens-undistortion-filtering
        float x = (2.0 * vUv.x - 1.0) / 1.0;
        float y = (2.0 * vUv.y - 1.0) / 1.0;
        
        // Calculate l2 norm
        float r = x*x + y*y;
        
        // Calculate the deflated or inflated new coordinate (reverse transform)
        float x3 = x / (1.0 - alphax * r);
        float y3 = y / (1.0 - alphay * r); 
        float x2 = x / (1.0 - alphax * (x3 * x3 + y3 * y3));
        float y2 = y / (1.0 - alphay * (x3 * x3 + y3 * y3));

        // De-normalize to the original range
        float i2 = (x2 + 1.0) * 1.0 / 2.0;
        float j2 = (y2 + 1.0) * 1.0 / 2.0;

        vec2 duv = vec2(i2, j2);

        // source: https://stackoverflow.com/questions/9841863/reflection-refraction-with-chromatic-aberration-eye-correction
        vec2 rOffset = vec2(1.0 / resolution.x, 0.0);
        vec2 gOffset = vec2(0.0, 1.0 / resolution.y);
        vec2 bOffset = vec2(1.0 / resolution.x, 1.0 / resolution.y);

        vec4 rValue = texture2D(inputTexture, duv - aberration * rOffset);  
        vec4 gValue = texture2D(inputTexture, duv - aberration * gOffset);
        vec4 bValue = texture2D(inputTexture, duv - aberration * bOffset); 

        outputColor = vec4(rValue.r, gValue.g, bValue.b, 1.0);
    }
`;
class LensDistortionEffect extends Effect {
  constructor({
    alphax = -0.05,
    alphay = -0.05,
    aberration = 1
  } = {}) {
    // const chessboardTexture = new TextureLoader().load(chessboard)
    // chessboardTexture.wrapS = chessboardTexture.wrapT = RepeatWrapping
    super("LensDistortionEffect", fragmentShader, {
      uniforms: new Map([["inputTexture", {
        value: null
      }], // ["chessboardTexture", { value: chessboardTexture }],
      ["resolution", {
        value: new Vector2()
      }], ["alphax", {
        value: alphax
      }], ["alphay", {
        value: alphay
      }], ["aberration", {
        value: aberration
      }]])
    });
  }

  update(renderer, inputBuffer) {
    this.uniforms.get("inputTexture").value = inputBuffer.texture;
    this.uniforms.get("resolution").value.set(inputBuffer.width, inputBuffer.height);
  }

  setAlphaX(value) {
    this.uniforms.get("alphax").value = value;
  }

  setAlphaY(value) {
    this.uniforms.get("alphay").value = value;
  }

}

export { GradualBackgroundEffect, HBAOEffect, LensDistortionEffect, MotionBlurEffect, PoissonDenoisePass, SSGIEffect, SSREffect, SharpnessEffect, SparkleEffect, TAAPass, TRAAEffect, TemporalReprojectPass, VelocityDepthNormalPass, VelocityPass };
