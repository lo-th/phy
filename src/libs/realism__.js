import { Pass, Effect, RenderPass, Selection } from './postprocessing.js';
import { DataTexture, RGBAFormat, FloatType, ShaderChunk, ShaderLib, UniformsUtils, WebGLMultipleRenderTargets, ShaderMaterial, GLSL3, Uniform, Vector2, Matrix4, Vector3, Clock, Quaternion, LinearFilter, HalfFloatType, NearestFilter, Color, Matrix3, TangentSpaceNormalMap, RepeatWrapping, RedFormat, MeshDepthMaterial, RGBADepthPacking, BackSide, WebGLRenderTarget, TextureLoader, LinearEncoding, DepthTexture, sRGBEncoding, Texture, NoToneMapping, EquirectangularReflectionMapping, LinearMipMapLinearFilter, UnsignedByteType, FramebufferTexture } from 'three';
import { GroundProjectedSkybox } from 'three/addons/objects/GroundProjectedSkybox.js';

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
const keepMaterialMapUpdated = (mrtMaterial, originalMaterial, prop, define, useKey) => {
  if (useKey) {
    if (originalMaterial[prop] !== mrtMaterial[prop]) {
      mrtMaterial[prop] = originalMaterial[prop];
      mrtMaterial.uniforms[prop].value = originalMaterial[prop];

      if (originalMaterial[prop]) {
        mrtMaterial.defines[define] = "";

        if (define === "USE_NORMALMAP") {
          mrtMaterial.defines.TANGENTSPACE_NORMALMAP = "";
        }
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
const getMaxMipLevel = texture => {
  const {
    width,
    height
  } = texture.image;
  return Math.floor(Math.log2(Math.max(width, height))) + 1;
};
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
};
const createGlobalDisableIblIradianceUniform = () => {
  if (!ShaderChunk.envmap_physical_pars_fragment.includes("iblIrradianceDisabled")) {
    ShaderChunk.envmap_physical_pars_fragment = ShaderChunk.envmap_physical_pars_fragment.replace("vec3 getIBLIrradiance( const in vec3 normal ) {",
    /* glsl */
    `
			uniform bool iblIrradianceDisabled;
		
			vec3 getIBLIrradiance( const in vec3 normal ) {
			 if(iblIrradianceDisabled) return vec3(0.);
			`);
  }

  if ("iblIrradianceDisabled" in ShaderLib.physical.uniforms) return ShaderLib.physical.uniforms["iblIrradianceDisabled"];
  const globalIblIrradianceDisabledUniform = {
    value: false
  };
  ShaderLib.physical.uniforms.iblIrradianceDisabled = globalIblIrradianceDisabledUniform;
  const {
    clone
  } = UniformsUtils;

  UniformsUtils.clone = uniforms => {
    const result = clone(uniforms);

    if ("iblIrradianceDisabled" in uniforms) {
      result.iblIrradianceDisabled = globalIblIrradianceDisabledUniform;
    }

    return result;
  };

  return globalIblIrradianceDisabledUniform;
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
const isGroundProjectedEnv = c => {
  return c instanceof GroundProjectedSkybox;
};
const isChildMaterialRenderable = (c, material = c.material) => {
  return material.visible && material.depthWrite && material.depthTest && (!material.transparent || material.opacity > 0) && !isGroundProjectedEnv(c);
};
const copyNecessaryProps = (originalMaterial, newMaterial) => {
  const keys = ["vertexTangent", "vertexColors", "vertexAlphas", "vertexUvs", "uvsVertexOnly", "supportsVertexTextures", "instancing", "instancingColor", "side", "flatShading", "skinning", "doubleSided", "flipSided"];

  for (const key of keys) newMaterial[key] = originalMaterial[key];
};

var vertexShader = "#define GLSLIFY 1\nvarying vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,1.0,1.0);}"; // eslint-disable-line

class CopyPass extends Pass {
  constructor(textureCount = 1) {
    super("CopyPass");
    this.needsSwap = false;
    this.renderTarget = new WebGLMultipleRenderTargets(1, 1, 1, {
      depthBuffer: false
    });
    this.setTextureCount(textureCount);
  }

  setTextureCount(textureCount) {
    var _this$fullscreenMater;

    let definitions = "";
    let body = "";

    for (let i = 0; i < textureCount; i++) {
      definitions +=
      /* glsl */
      `
				uniform sampler2D inputTexture${i};
				layout(location = ${i}) out vec4 gOutput${i};
			`;
      body +=
      /* glsl */
      `gOutput${i} = textureLod(inputTexture${i}, vUv, 0.);`;
    }

    (_this$fullscreenMater = this.fullscreenMaterial) == null ? void 0 : _this$fullscreenMater.dispose();
    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader:
      /* glsl */
      `
            varying vec2 vUv;
			
			${definitions}

            void main() {
				${body}
            }
            `,
      vertexShader: vertexShader,
      glslVersion: GLSL3
    });

    for (let i = 0; i < textureCount; i++) {
      this.fullscreenMaterial.uniforms["inputTexture" + i] = new Uniform(null);

      if (i >= this.renderTarget.texture.length) {
        const texture = this.renderTarget.texture[0].clone();
        texture.isRenderTargetTexture = true;
        this.renderTarget.texture.push(texture);
      }
    }
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);
  }

  render(renderer) {
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
  }

}

var fragmentShader$2 = "#define GLSLIFY 1\nvarying vec2 vUv;uniform sampler2D velocityTexture;uniform sampler2D depthTexture;uniform sampler2D lastDepthTexture;uniform float blend;uniform bool constantBlend;uniform bool fullAccumulate;uniform vec2 invTexSize;uniform mat4 projectionMatrix;uniform mat4 projectionMatrixInverse;uniform mat4 cameraMatrixWorld;uniform vec3 cameraPos;uniform mat4 prevViewMatrix;uniform mat4 prevCameraMatrixWorld;uniform mat4 prevProjectionMatrix;uniform mat4 prevProjectionMatrixInverse;uniform bool reset;uniform float delta;\n#define EPSILON 0.00001\n#include <packing>\n#include <reproject>\nvoid main(){vec4 depthTexel;float depth;getDepthAndDilatedUVOffset(depthTexture,vUv,depth,dilatedDepth,depthTexel);vec2 dilatedUv=vUv+dilatedUvOffset;if(dot(depthTexel.rgb,depthTexel.rgb)==0.0){\n#ifdef neighborhoodClamping\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){gOutput[i]=textureLod(inputTexture[i],vUv,0.0);}\n#pragma unroll_loop_end\n#else\ndiscard;\n#endif\nreturn;}vec4 inputTexel[textureCount];vec4 accumulatedTexel[textureCount];bool textureSampledThisFrame[textureCount];\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){inputTexel[i]=textureLod(inputTexture[i],vUv,0.0);doColorTransform[i]=luminance(inputTexel[i].rgb)>0.0;textureSampledThisFrame[i]=inputTexel[i].r>=0.;if(textureSampledThisFrame[i]){transformColor(inputTexel[i].rgb);}else{inputTexel[i].rgb=vec3(0.0);}texIndex++;}\n#pragma unroll_loop_end\ntexIndex=0;velocityTexel=textureLod(velocityTexture,vUv,0.0);bool didMove=dot(velocityTexel.xy,velocityTexel.xy)>0.000000001;\n#ifdef dilation\nvec2 octahedronEncodedNormal=textureLod(velocityTexture,dilatedUv,0.0).ba;\n#else\nvec2 octahedronEncodedNormal=velocityTexel.ba;\n#endif\nvec3 worldNormal=Decode(octahedronEncodedNormal);vec3 worldPos=screenSpaceToWorldSpace(vUv,depth,cameraMatrixWorld,projectionMatrixInverse);vec2 reprojectedUvDiffuse=vec2(-10.0);vec2 reprojectedUvSpecular[textureCount];vec2 reprojectedUv;bool reprojectHitPoint;bool useBlockySampling;\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){reprojectHitPoint=reprojectSpecular[i]&&inputTexel[i].a>0.0;if(reprojectHitPoint){reprojectedUvSpecular[i]=getReprojectedUV(neighborhoodClamping[i],neighborhoodClampingDisocclusionTest[i],depth,worldPos,worldNormal,inputTexel[i].a);}else{reprojectedUvSpecular[i]=vec2(-1.0);}if(reprojectedUvDiffuse.x==-10.0&&reprojectedUvSpecular[i].x<0.0){reprojectedUvDiffuse=getReprojectedUV(neighborhoodClamping[i],neighborhoodClampingDisocclusionTest[i],depth,worldPos,worldNormal,0.0);}reprojectedUv=reprojectedUvSpecular[i].x>=0.0 ? reprojectedUvSpecular[i]: reprojectedUvDiffuse;if(reprojectedUv.x<0.0){accumulatedTexel[i]=vec4(inputTexel[i].rgb,0.0);}else{useBlockySampling=blockySampling[texIndex]&&didMove;accumulatedTexel[i]=sampleReprojectedTexture(accumulatedTexture[i],reprojectedUv,catmullRomSampling[i],useBlockySampling);transformColor(accumulatedTexel[i].rgb);if(textureSampledThisFrame[i]){accumulatedTexel[i].a++;if(neighborhoodClamping[i])clampNeighborhood(inputTexture[i],accumulatedTexel[i].rgb,inputTexel[i].rgb);}else{inputTexel[i].rgb=accumulatedTexel[i].rgb;}}texIndex++;}\n#pragma unroll_loop_end\ntexIndex=0;float m=1.-delta/(1./60.);float fpsAdjustedBlend=blend+max(0.,(1.-blend)*m);float maxValue=(fullAccumulate&&!didMove)? 1.0 : fpsAdjustedBlend;vec3 outputColor;float temporalReprojectMix;\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){if(constantBlend){temporalReprojectMix=accumulatedTexel[i].a==0.0 ? 0.0 : fpsAdjustedBlend;}else{temporalReprojectMix=fpsAdjustedBlend;if(reset)accumulatedTexel[i].a=0.0;temporalReprojectMix=min(1.-1./(accumulatedTexel[i].a+1.0),maxValue);}outputColor=mix(inputTexel[i].rgb,accumulatedTexel[i].rgb,temporalReprojectMix);undoColorTransform(outputColor);gOutput[i]=vec4(outputColor,accumulatedTexel[i].a);texIndex++;}\n#pragma unroll_loop_end\n#ifdef useCustomComposeShader\ncustomComposeShader\n#endif\n}"; // eslint-disable-line

var reproject = "#define GLSLIFY 1\nvec4 velocityTexel;float dilatedDepth;vec2 dilatedUvOffset;int texIndex;\n#define luminance(a) dot(vec3(0.2125, 0.7154, 0.0721), a)\nvec3 screenSpaceToWorldSpace(const vec2 uv,const float depth,mat4 curMatrixWorld,const mat4 projMatrixInverse){vec4 ndc=vec4((uv.x-0.5)*2.0,(uv.y-0.5)*2.0,(depth-0.5)*2.0,1.0);vec4 clip=projMatrixInverse*ndc;vec4 view=curMatrixWorld*(clip/clip.w);return view.xyz;}vec2 viewSpaceToScreenSpace(const vec3 position,const mat4 projMatrix){vec4 projectedCoord=projMatrix*vec4(position,1.0);projectedCoord.xy/=projectedCoord.w;projectedCoord.xy=projectedCoord.xy*0.5+0.5;return projectedCoord.xy;}bool doColorTransform[textureCount];\n#ifdef logTransform\nvoid transformColor(inout vec3 color){if(!doColorTransform[texIndex])return;float lum=luminance(color);float diff=min(1.0,lum-0.99);if(diff>0.0){color=vec3(diff*0.1);return;}color=log(max(color,vec3(EPSILON)));}void undoColorTransform(inout vec3 color){if(!doColorTransform[texIndex])return;color=exp(color);}\n#else\n#define transformColor\n#define undoColorTransform\n#endif\nvoid getNeighborhoodAABB(const sampler2D tex,inout vec3 minNeighborColor,inout vec3 maxNeighborColor){for(int x=-2;x<=2;x++){for(int y=-2;y<=2;y++){if(x!=0||y!=0){vec2 offset=vec2(x,y)*invTexSize;vec2 neighborUv=vUv+offset;vec4 neighborTexel=textureLod(tex,neighborUv,0.0);transformColor(neighborTexel.rgb);minNeighborColor=min(neighborTexel.rgb,minNeighborColor);maxNeighborColor=max(neighborTexel.rgb,maxNeighborColor);}}}}\n#ifdef logClamp\nvoid clampNeighborhood(const sampler2D tex,inout vec3 color,vec3 inputColor){transformColor(inputColor);vec3 minNeighborColor=inputColor;vec3 maxNeighborColor=inputColor;getNeighborhoodAABB(tex,minNeighborColor,maxNeighborColor);transformColor(color);color=clamp(color,minNeighborColor,maxNeighborColor);undoColorTransform(color);}\n#else\nvoid clampNeighborhood(const sampler2D tex,inout vec3 color,const vec3 inputColor){vec3 minNeighborColor=inputColor;vec3 maxNeighborColor=inputColor;getNeighborhoodAABB(tex,minNeighborColor,maxNeighborColor);color=clamp(color,minNeighborColor,maxNeighborColor);}\n#endif\n#ifdef dilation\nvoid getDilatedDepthUVOffset(const sampler2D tex,const vec2 centerUv,out float depth,out float dilatedDepth,out vec4 closestDepthTexel){float closestDepth=0.0;for(int x=-1;x<=1;x++){for(int y=-1;y<=1;y++){vec2 offset=vec2(x,y)*invTexSize;vec2 neighborUv=centerUv+offset;vec4 neighborDepthTexel=textureLod(tex,neighborUv,0.0);float neighborDepth=unpackRGBAToDepth(neighborDepthTexel);if(x==0&&y==0)depth=neighborDepth;if(neighborDepth>closestDepth){closestDepth=neighborDepth;closestDepthTexel=neighborDepthTexel;dilatedUvOffset=offset;}}}dilatedDepth=closestDepth;}\n#endif\nvoid getDepthAndDilatedUVOffset(sampler2D depthTex,vec2 uv,out float depth,out float dilatedDepth,out vec4 depthTexel){\n#ifdef dilation\ngetDilatedDepthUVOffset(depthTex,uv,depth,dilatedDepth,depthTexel);\n#else\ndepthTexel=textureLod(depthTex,uv,0.);depth=unpackRGBAToDepth(depthTexel);dilatedDepth=depth;\n#endif\n}bool planeDistanceDisocclusionCheck(const vec3 worldPos,const vec3 lastWorldPos,const vec3 worldNormal,const float worldDistFactor){if(abs(dot(worldNormal,worldPos))==0.0)return false;vec3 toCurrent=worldPos-lastWorldPos;float distToPlane=abs(dot(toCurrent,worldNormal));return distToPlane>depthDistance*worldDistFactor;}bool worldDistanceDisocclusionCheck(const vec3 worldPos,const vec3 lastWorldPos,const float worldDistFactor){return distance(worldPos,lastWorldPos)>worldDistance*worldDistFactor;}bool validateReprojectedUV(const vec2 reprojectedUv,const bool neighborhoodClamp,const bool neighborhoodClampDisocclusionTest,const float depth,const vec3 worldPos,const vec3 worldNormal){if(any(lessThan(reprojectedUv,vec2(0.)))||any(greaterThan(reprojectedUv,vec2(1.))))return false;if(neighborhoodClamp&&!neighborhoodClampDisocclusionTest)return true;vec3 dilatedWorldPos=worldPos;vec3 lastWorldPos;float dilatedLastDepth,lastDepth;vec4 lastDepthTexel;vec2 dilatedReprojectedUv;\n#ifdef dilation\ndilatedWorldPos=screenSpaceToWorldSpace(vUv+dilatedUvOffset,dilatedDepth,cameraMatrixWorld,projectionMatrixInverse);getDepthAndDilatedUVOffset(lastDepthTexture,reprojectedUv,lastDepth,dilatedLastDepth,lastDepthTexel);dilatedReprojectedUv=reprojectedUv+dilatedUvOffset;\n#else\nlastDepthTexel=textureLod(lastDepthTexture,reprojectedUv,0.);lastDepth=unpackRGBAToDepth(lastDepthTexel);dilatedLastDepth=lastDepth;dilatedReprojectedUv=reprojectedUv;\n#endif\nlastWorldPos=screenSpaceToWorldSpace(dilatedReprojectedUv,dilatedLastDepth,prevCameraMatrixWorld,prevProjectionMatrixInverse);float worldDistFactor=clamp((50.0+distance(dilatedWorldPos,cameraPos))/100.,0.25,1.);if(worldDistanceDisocclusionCheck(dilatedWorldPos,lastWorldPos,worldDistFactor))return false;return!planeDistanceDisocclusionCheck(dilatedWorldPos,lastWorldPos,worldNormal,worldDistFactor);}vec2 reprojectHitPoint(const vec3 rayOrig,const float rayLength,const float depth){vec3 cameraRay=normalize(rayOrig-cameraPos);float cameraRayLength=distance(rayOrig,cameraPos);vec3 parallaxHitPoint=cameraPos+cameraRay*(cameraRayLength+rayLength);vec4 reprojectedParallaxHitPoint=prevViewMatrix*vec4(parallaxHitPoint,1.0);vec2 hitPointUv=viewSpaceToScreenSpace(reprojectedParallaxHitPoint.xyz,prevProjectionMatrix);return hitPointUv;}vec2 getReprojectedUV(const bool neighborhoodClamp,const bool neighborhoodClampDisocclusionTest,const float depth,const vec3 worldPos,const vec3 worldNormal,const float rayLength){if(rayLength!=0.0){vec2 reprojectedUv=reprojectHitPoint(worldPos,rayLength,depth);if(validateReprojectedUV(reprojectedUv,neighborhoodClamp,neighborhoodClampDisocclusionTest,depth,worldPos,worldNormal)){return reprojectedUv;}return vec2(-1.);}vec2 reprojectedUv=vUv-velocityTexel.rg;if(validateReprojectedUV(reprojectedUv,neighborhoodClamp,neighborhoodClampDisocclusionTest,depth,worldPos,worldNormal)){return reprojectedUv;}return vec2(-1.);}vec4 SampleTextureCatmullRom(const sampler2D tex,const vec2 uv,const vec2 texSize){vec2 samplePos=uv*texSize;vec2 texPos1=floor(samplePos-0.5f)+0.5f;vec2 f=samplePos-texPos1;vec2 w0=f*(-0.5f+f*(1.0f-0.5f*f));vec2 w1=1.0f+f*f*(-2.5f+1.5f*f);vec2 w2=f*(0.5f+f*(2.0f-1.5f*f));vec2 w3=f*f*(-0.5f+0.5f*f);vec2 w12=w1+w2;vec2 offset12=w2/(w1+w2);vec2 texPos0=texPos1-1.;vec2 texPos3=texPos1+2.;vec2 texPos12=texPos1+offset12;texPos0/=texSize;texPos3/=texSize;texPos12/=texSize;vec4 result=vec4(0.0);result+=textureLod(tex,vec2(texPos0.x,texPos0.y),0.0f)*w0.x*w0.y;result+=textureLod(tex,vec2(texPos12.x,texPos0.y),0.0f)*w12.x*w0.y;result+=textureLod(tex,vec2(texPos3.x,texPos0.y),0.0f)*w3.x*w0.y;result+=textureLod(tex,vec2(texPos0.x,texPos12.y),0.0f)*w0.x*w12.y;result+=textureLod(tex,vec2(texPos12.x,texPos12.y),0.0f)*w12.x*w12.y;result+=textureLod(tex,vec2(texPos3.x,texPos12.y),0.0f)*w3.x*w12.y;result+=textureLod(tex,vec2(texPos0.x,texPos3.y),0.0f)*w0.x*w3.y;result+=textureLod(tex,vec2(texPos12.x,texPos3.y),0.0f)*w12.x*w3.y;result+=textureLod(tex,vec2(texPos3.x,texPos3.y),0.0f)*w3.x*w3.y;result=max(result,vec4(0.));return result;}vec4 getTexel(const sampler2D tex,vec2 p){p=p/invTexSize+0.5;vec2 i=floor(p);vec2 f=p-i;f=f*f*f*(f*(f*6.0-15.0)+10.0);p=i+f;p=(p-0.5)*invTexSize;return textureLod(tex,p,0.0);}vec2 sampleBlocky(vec2 p){vec2 d=vec2(dFdx(p.x),dFdy(p.y))/invTexSize;p/=invTexSize;vec2 fA=p-0.5*d,iA=floor(fA);vec2 fB=p+0.5*d,iB=floor(fB);return(iA+(iB-iA)*(fB-iB)/d+0.5)*invTexSize;}vec4 sampleReprojectedTexture(const sampler2D tex,const vec2 reprojectedUv,bool useCatmullRomSampling,bool useBlockySampling){vec2 p=useBlockySampling ? sampleBlocky(reprojectedUv): reprojectedUv;if(useCatmullRomSampling){return SampleTextureCatmullRom(tex,p,1.0/invTexSize);}return textureLod(tex,p,0.);}vec3 Decode(vec2 f){f=f*2.0-1.0;vec3 n=vec3(f.x,f.y,1.0-abs(f.x)-abs(f.y));float t=max(-n.z,0.0);n.x+=n.x>=0.0 ?-t : t;n.y+=n.y>=0.0 ?-t : t;return normalize(n);}"; // eslint-disable-line

class TemporalReprojectMaterial extends ShaderMaterial {
  constructor(textureCount = 1, customComposeShader = "") {
    let finalFragmentShader = fragmentShader$2.replace("#include <reproject>", reproject);

    if (typeof customComposeShader === "string") {
      finalFragmentShader = finalFragmentShader.replace("customComposeShader", customComposeShader);
    }

    let definitions = "";

    for (let i = 0; i < textureCount; i++) {
      definitions +=
      /* glsl */
      `
				uniform sampler2D inputTexture${i};
				uniform sampler2D accumulatedTexture${i};

				layout(location = ${i}) out vec4 gOutput${i};
			`;
    }

    finalFragmentShader = definitions + finalFragmentShader.replaceAll("textureCount", textureCount);
    finalFragmentShader = unrollLoops(finalFragmentShader);
    const matches = finalFragmentShader.matchAll(/inputTexture\[\s*[0-9]+\s*]/g);

    for (const [key] of matches) {
      const number = key.replace(/[^0-9]/g, "");
      finalFragmentShader = finalFragmentShader.replace(key, "inputTexture" + number);
    }

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
        velocityTexture: new Uniform(null),
        depthTexture: new Uniform(null),
        lastDepthTexture: new Uniform(null),
        blend: new Uniform(0),
        constantBlend: new Uniform(false),
        fullAccumulate: new Uniform(false),
        reset: new Uniform(false),
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
        cameraPos: new Uniform(new Vector3())
      },
      vertexShader,
      fragmentShader: finalFragmentShader,
      toneMapped: false,
      glslVersion: GLSL3
    });

    for (let i = 0; i < textureCount; i++) {
      this.uniforms["inputTexture" + i] = new Uniform(null);
      this.uniforms["accumulatedTexture" + i] = new Uniform(null);
    }

    if (typeof customComposeShader === "string") this.defines.useCustomComposeShader = "";
  }

}

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

const defaultTemporalReprojectPassOptions = {
  blend: 0.9,
  dilation: false,
  constantBlend: false,
  fullAccumulate: false,
  catmullRomSampling: true,
  blockySampling: true,
  neighborhoodClamping: false,
  neighborhoodClampingDisocclusionTest: true,
  logTransform: false,
  logClamp: false,
  depthDistance: 0.25,
  worldDistance: 0.375,
  reprojectSpecular: false,
  customComposeShader: null,
  renderTarget: null
};
const tmpProjectionMatrix$1 = new Matrix4();
const tmpProjectionMatrixInverse$1 = new Matrix4();
class TemporalReprojectPass extends Pass {
  constructor(scene, camera, velocityDepthNormalPass, textureCount = 1, options = defaultTemporalReprojectPassOptions) {
    super("TemporalReprojectPass");
    this.needsSwap = false;
    this.clock = new Clock();
    this.r2Sequence = [];
    this.pointsIndex = 0;
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
    this.renderTarget = new WebGLMultipleRenderTargets(1, 1, textureCount, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      type: HalfFloatType,
      depthBuffer: false
    });
    this.fullscreenMaterial = new TemporalReprojectMaterial(textureCount, options.customComposeShader);
    this.fullscreenMaterial.defines.textureCount = textureCount;
    if (options.dilation) this.fullscreenMaterial.defines.dilation = "";
    if (options.neighborhoodClamping) this.fullscreenMaterial.defines.neighborhoodClamping = "";
    if (options.logTransform) this.fullscreenMaterial.defines.logTransform = "";
    if (options.logClamp) this.fullscreenMaterial.defines.logClamp = "";
    this.fullscreenMaterial.defines.depthDistance = options.depthDistance.toPrecision(5);
    this.fullscreenMaterial.defines.worldDistance = options.worldDistance.toPrecision(5);
    this.fullscreenMaterial.uniforms.blend.value = options.blend;
    this.fullscreenMaterial.uniforms.constantBlend.value = options.constantBlend;
    this.fullscreenMaterial.uniforms.fullAccumulate.value = options.fullAccumulate;
    this.fullscreenMaterial.uniforms.projectionMatrix.value = camera.projectionMatrix.clone();
    this.fullscreenMaterial.uniforms.projectionMatrixInverse.value = camera.projectionMatrixInverse.clone();
    this.fullscreenMaterial.uniforms.cameraMatrixWorld.value = camera.matrixWorld;
    this.fullscreenMaterial.uniforms.viewMatrix.value = camera.matrixWorldInverse;
    this.fullscreenMaterial.uniforms.cameraPos.value = camera.position;
    this.fullscreenMaterial.uniforms.prevViewMatrix.value = camera.matrixWorldInverse.clone();
    this.fullscreenMaterial.uniforms.prevCameraMatrixWorld.value = camera.matrixWorld.clone();
    this.fullscreenMaterial.uniforms.prevProjectionMatrix.value = camera.projectionMatrix.clone();
    this.fullscreenMaterial.uniforms.prevProjectionMatrixInverse.value = camera.projectionMatrixInverse.clone(); // init copy pass to save the accumulated textures and the textures from the last frame

    this.copyPass = new CopyPass(textureCount);

    for (let i = 0; i < textureCount; i++) {
      const accumulatedTexture = this.copyPass.renderTarget.texture[i];
      accumulatedTexture.type = HalfFloatType;
      accumulatedTexture.minFilter = LinearFilter;
      accumulatedTexture.magFilter = LinearFilter;
      accumulatedTexture.needsUpdate = true;
    }

    this.fullscreenMaterial.uniforms.velocityTexture.value = velocityDepthNormalPass.texture;
    this.fullscreenMaterial.uniforms.depthTexture.value = velocityDepthNormalPass.depthTexture;

    for (const opt of ["catmullRomSampling", "blockySampling", "reprojectSpecular", "neighborhoodClamping", "neighborhoodClampingDisocclusionTest"]) {
      if (typeof options[opt] === "boolean") {
        options[opt] = Array(textureCount).fill(options[opt]);
      }

      this.fullscreenMaterial.defines[opt] =
      /* glsl */
      `bool[](${options[opt].join(", ")})`;
    }

    this.options = options;
    this.velocityDepthNormalPass = velocityDepthNormalPass;
  }

  dispose() {
    super.dispose();
    this.renderTarget.dispose();
    this.copyPass.dispose();
    this.fullscreenMaterial.dispose();
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);
    this.copyPass.setSize(width, height);
    this.fullscreenMaterial.uniforms.invTexSize.value.set(1 / width, 1 / height);
  }

  get texture() {
    return this.renderTarget.texture[0];
  }

  reset() {
    this.fullscreenMaterial.uniforms.reset.value = true;
  }

  render(renderer) {
    const delta = Math.min(1 / 10, this.clock.getDelta());
    this.fullscreenMaterial.uniforms.delta.value = delta;
    tmpProjectionMatrix$1.copy(this._camera.projectionMatrix);
    tmpProjectionMatrixInverse$1.copy(this._camera.projectionMatrixInverse);
    if (this._camera.view) this._camera.view.enabled = false;

    this._camera.updateProjectionMatrix();

    this.fullscreenMaterial.uniforms.projectionMatrix.value.copy(this._camera.projectionMatrix);
    this.fullscreenMaterial.uniforms.projectionMatrixInverse.value.copy(this._camera.projectionMatrixInverse);
    this.fullscreenMaterial.uniforms.lastDepthTexture.value = this.velocityDepthNormalPass.lastDepthTexture;
    if (this._camera.view) this._camera.view.enabled = true;

    this._camera.projectionMatrix.copy(tmpProjectionMatrix$1);

    this._camera.projectionMatrixInverse.copy(tmpProjectionMatrixInverse$1);

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
    this.fullscreenMaterial.uniforms.reset.value = false;

    for (let i = 0; i < this.textureCount; i++) {
      this.copyPass.fullscreenMaterial.uniforms["inputTexture" + i].value = this.renderTarget.texture[i];
      this.fullscreenMaterial.uniforms["accumulatedTexture" + i].value = this.copyPass.renderTarget.texture[i];
    }

    this.copyPass.render(renderer); // save last transformations

    this.fullscreenMaterial.uniforms.prevCameraMatrixWorld.value.copy(this._camera.matrixWorld);
    this.fullscreenMaterial.uniforms.prevViewMatrix.value.copy(this._camera.matrixWorldInverse);
    this.fullscreenMaterial.uniforms.prevProjectionMatrix.value.copy(this.fullscreenMaterial.uniforms.projectionMatrix.value);
    this.fullscreenMaterial.uniforms.prevProjectionMatrixInverse.value.copy(this.fullscreenMaterial.uniforms.projectionMatrixInverse.value);
  }

  jitter(jitterScale = 1) {
    this.unjitter();
    if (this.r2Sequence.length === 0) this.r2Sequence = generateR2(256).map(([a, b]) => [a - 0.5, b - 0.5]);
    this.pointsIndex = (this.pointsIndex + 1) % this.r2Sequence.length;
    const [x, y] = this.r2Sequence[this.pointsIndex];
    const {
      width,
      height
    } = this.renderTarget;
    if (this._camera.setViewOffset) this._camera.setViewOffset(width, height, x * jitterScale, y * jitterScale, width, height);
  }

  unjitter() {
    if (this._camera.clearViewOffset) this._camera.clearViewOffset();
  }

}

var compose$1 = "#define GLSLIFY 1\nuniform sampler2D inputTexture;void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){vec4 accumulatedTexel=textureLod(inputTexture,vUv,0.);outputColor=vec4(accumulatedTexel.rgb,1.);}"; // eslint-disable-line

const defaultTRAAOptions = {
  blend: 0.8,
  constantBlend: true,
  dilation: true,
  blockySampling: false,
  logTransform: false,
  // ! todo: check if can use logTransform withoutt artifacts
  depthDistance: 10,
  worldDistance: 5,
  neighborhoodClamping: true
};
class TRAAEffect extends Effect {
  constructor(scene, camera, velocityDepthNormalPass, options = defaultTRAAOptions) {
    super("TRAAEffect", compose$1, {
      type: "FinalTRAAEffectMaterial",
      uniforms: new Map([["inputTexture", new Uniform(null)]])
    });
    this._scene = scene;
    this._camera = camera;
    options = { ...defaultTRAAOptions,
      ...options
    };
    this.temporalReprojectPass = new TemporalReprojectPass(scene, camera, velocityDepthNormalPass, 1, options);
    this.uniforms.get("inputTexture").value = this.temporalReprojectPass.texture;
    this.setSize(options.width, options.height);
  }

  setSize(width, height) {
    this.temporalReprojectPass.setSize(width, height);
  }

  dispose() {
    super.dispose();
    this.temporalReprojectPass.dispose();
  }

  update(renderer, inputBuffer) {
    this.temporalReprojectPass.unjitter();
    this.unjitteredProjectionMatrix = this._camera.projectionMatrix.clone();

    this._camera.projectionMatrix.copy(this.unjitteredProjectionMatrix);

    const noJitterMeshes = getVisibleChildren(this._scene).filter(c => isGroundProjectedEnv(c));

    for (const mesh of noJitterMeshes) {
      const renderData = renderer.properties.get(mesh.material);
      if (!(renderData != null && renderData.programs)) continue;
      const uniforms = Array.from(renderData.programs.values())[0].getUniforms();

      if (!uniforms._patchedProjectionMatrix) {
        const oldSetValue = uniforms.setValue.bind(uniforms);
        uniforms._oldSetValue = oldSetValue;

        uniforms.setValue = (gl, name, value, ...args) => {
          if (name === "projectionMatrix") {
            value = this.unjitteredProjectionMatrix;
          }

          oldSetValue(gl, name, value, ...args);
        };

        uniforms._patchedProjectionMatrix = true;
      }

      cancelAnimationFrame(uniforms._destroyPatchRAF);
      cancelAnimationFrame(uniforms._destroyPatchRAF2);
      uniforms._destroyPatchRAF = requestAnimationFrame(() => {
        uniforms._destroyPatchRAF2 = requestAnimationFrame(() => {
          uniforms.setValue = uniforms._oldSetValue;
          delete uniforms._oldSetValue;
          delete uniforms._patchedProjectionMatrix;
        });
      });
    }

    this.temporalReprojectPass.fullscreenMaterial.uniforms.inputTexture0.value = inputBuffer.texture;
    this.temporalReprojectPass.jitter();
    this.temporalReprojectPass.render(renderer);
  }

}
TRAAEffect.DefaultOptions = defaultTRAAOptions;

var fragmentShader$1 = "#define GLSLIFY 1\nvarying vec2 vUv;uniform sampler2D depthTexture;uniform sampler2D normalTexture;uniform sampler2D momentTexture;uniform vec2 invTexSize;uniform bool horizontal;uniform bool blurHorizontal;uniform float denoise[textureCount];uniform float depthPhi;uniform float normalPhi;uniform float roughnessPhi;uniform float denoiseKernel;uniform float stepSize;uniform mat4 projectionMatrixInverse;uniform mat4 projectionMatrix;uniform mat4 cameraMatrixWorld;uniform bool isFirstIteration;uniform bool isLastIteration;\n#include <packing>\n#define EPSILON 0.00001\n#define M_PI 3.1415926535897932384626433832795\n#define PI M_PI\n#define luminance(a) dot(a, vec3(0.2125, 0.7154, 0.0721))\n#include <customComposeShaderFunctions>\nvec3 screenSpaceToWorldSpace(const vec2 uv,const float depth,const mat4 curMatrixWorld){vec4 ndc=vec4((uv.x-0.5)*2.0,(uv.y-0.5)*2.0,(depth-0.5)*2.0,1.0);vec4 clip=projectionMatrixInverse*ndc;vec4 view=curMatrixWorld*(clip/clip.w);return view.xyz;}float distToPlane(const vec3 worldPos,const vec3 neighborWorldPos,const vec3 worldNormal){vec3 toCurrent=worldPos-neighborWorldPos;float distToPlane=abs(dot(toCurrent,worldNormal));return distToPlane;}void tap(const vec2 neighborVec,const vec2 pixelStepOffset,const float depth,const vec3 normal,const float roughness,const float roughnessSqrt,const vec3 worldPos,const float luma[textureCount],const float colorPhi[textureCount],inout vec3 denoisedColor[textureCount],inout float totalWeight[textureCount],inout float sumVariance[textureCount]){vec2 fullNeighborUv=neighborVec*pixelStepOffset;vec2 neighborUvNearest=vUv+fullNeighborUv;vec2 neighborUv=vUv+fullNeighborUv;vec2 neighborUvRoughness=vUv+fullNeighborUv*roughnessSqrt;float basicWeight=1.0;\n#ifdef useDepth\nvec4 neighborDepthTexel=textureLod(depthTexture,neighborUvNearest,0.);float neighborDepth=unpackRGBAToDepth(neighborDepthTexel);vec3 neighborWorldPos=screenSpaceToWorldSpace(neighborUvNearest,neighborDepth,cameraMatrixWorld);float depthDiff=(1.-distToPlane(worldPos,neighborWorldPos,normal));float depthSimilarity=max(depthDiff/depthPhi,0.);if(depthSimilarity<EPSILON)return;basicWeight*=depthSimilarity;\n#endif\n#if defined(useNormal) || defined(useRoughness)\nvec4 neighborNormalTexel=textureLod(normalTexture,neighborUvNearest,0.);\n#endif\n#ifdef useNormal\nvec3 neighborNormal=neighborNormalTexel.rgb;float normalDiff=dot(neighborNormal,normal);float normalSimilarity=pow(max(0.,normalDiff),normalPhi);if(normalSimilarity<EPSILON)return;basicWeight*=normalSimilarity;\n#endif\n#ifdef useRoughness\nfloat neighborRoughness=neighborNormalTexel.a;neighborRoughness*=neighborRoughness;float roughnessDiff=abs(roughness-neighborRoughness);float roughnessSimilarity=exp(-roughnessDiff*roughnessPhi);if(roughnessSimilarity<EPSILON)return;basicWeight*=roughnessSimilarity;\n#endif\nvec4 neighborInputTexel[textureCount];vec3 neighborColor;float neighborLuma,lumaDiff,lumaSimilarity;float weight[textureCount];\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){neighborInputTexel[i]=textureLod(texture[i],roughnessDependent[i]? neighborUvRoughness : neighborUv,0.);neighborColor=neighborInputTexel[i].rgb;neighborLuma=luminance(neighborColor);lumaDiff=abs(luma[i]-neighborLuma);lumaSimilarity=max(1.0-lumaDiff/colorPhi[i],0.0);weight[i]=min(basicWeight*lumaSimilarity,1.0);denoisedColor[i]+=neighborColor*weight[i];totalWeight[i]+=weight[i];}\n#pragma unroll_loop_end\n#ifdef useMoment\nif(isFirstIteration){vec4 neighborMoment=textureLod(momentTexture,neighborUvNearest,0.);neighborInputTexel[0].a=max(0.0,neighborMoment.g-neighborMoment.r*neighborMoment.r);sumVariance[0]+=weight[0]*weight[0]*neighborInputTexel[0].a;\n#if momentTextureCount > 1\nneighborInputTexel[1].a=max(0.0,neighborMoment.a-neighborMoment.b*neighborMoment.b);sumVariance[1]+=weight[1]*weight[1]*neighborInputTexel[1].a;\n#endif\n}\n#endif\n#pragma unroll_loop_start\nfor(int i=0;i<momentTextureCount;i++){\n#ifndef useMoment\nif(isFirstIteration)neighborInputTexel[i].a=1.0;\n#endif\nsumVariance[i]+=weight[i]*weight[i]*neighborInputTexel[i].a;}\n#pragma unroll_loop_end\n}void main(){vec4 depthTexel=textureLod(depthTexture,vUv,0.);if(dot(depthTexel.rgb,depthTexel.rgb)==0.){discard;return;}float depth=unpackRGBAToDepth(depthTexel);vec3 worldPos=screenSpaceToWorldSpace(vUv,depth,cameraMatrixWorld);vec4 normalTexel=textureLod(normalTexture,vUv,0.);vec3 normal=normalTexel.rgb;float roughness=normalTexel.a;roughness*=roughness;vec3 denoisedColor[textureCount];vec4 texel[textureCount];float luma[textureCount];float sumVariance[textureCount];float totalWeight[textureCount];float colorPhi[textureCount];\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){totalWeight[i]=1.0;texel[i]=textureLod(texture[i],vUv,0.);denoisedColor[i]=texel[i].rgb;luma[i]=luminance(texel[i].rgb);}\n#pragma unroll_loop_end\n#ifdef useMoment\nif(isFirstIteration){vec4 moment=textureLod(momentTexture,vUv,0.);texel[0].a=max(0.0,moment.g-moment.r*moment.r);\n#if momentTextureCount > 1\ntexel[1].a=max(0.0,moment.a-moment.b*moment.b);\n#endif\n}\n#endif\n#pragma unroll_loop_start\nfor(int i=0;i<momentTextureCount;i++){\n#ifndef useMoment\nif(isFirstIteration)texel[i].a=1.0;\n#endif\nsumVariance[i]=texel[i].a;if(roughnessDependent[i]){colorPhi[i]=denoise[i]*sqrt(basicVariance[i]*roughness+sumVariance[i]);}else{colorPhi[i]=denoise[i]*sqrt(basicVariance[i]+sumVariance[i]);}}\n#pragma unroll_loop_end\nvec2 pixelStepOffset=invTexSize*stepSize;float roughnessSqrt=max(0.05,sqrt(roughness));if(denoiseKernel>EPSILON){if(blurHorizontal){for(float i=-denoiseKernel;i<=denoiseKernel;i++){if(i!=0.){vec2 neighborVec=horizontal ? vec2(i,0.): vec2(0.,i);tap(neighborVec,pixelStepOffset,depth,normal,roughness,roughnessSqrt,worldPos,luma,colorPhi,denoisedColor,totalWeight,sumVariance);}}}else{for(float i=-denoiseKernel;i<=denoiseKernel;i++){if(i!=0.){vec2 neighborVec=horizontal ? vec2(-i,-i): vec2(i,-i);tap(neighborVec,pixelStepOffset,depth,normal,roughness,roughnessSqrt,worldPos,luma,colorPhi,denoisedColor,totalWeight,sumVariance);}}}\n#pragma unroll_loop_start\nfor(int i=0;i<textureCount;i++){sumVariance[i]/=totalWeight[i]*totalWeight[i];denoisedColor[i]/=totalWeight[i];}\n#pragma unroll_loop_end\n}if(isLastIteration){\n#include <customComposeShader>\n}\n#include <outputShader>\n}"; // eslint-disable-line

// https://diharaw.github.io/post/adventures_in_hybrid_rendering/
// https://github.com/NVIDIAGameWorks/Falcor/tree/master/Source/RenderPasses/SVGFPass

const defaultDenoisePassOptions = {
  moment: true,
  depth: true,
  normal: true,
  roughness: true,
  diffuse: true,
  roughnessDependent: false,
  basicVariance: 0.0005
};
const useEdgeStoppingTypes = [["moment", "", "useMoment"], ["depth", "depthPhi", "useDepth"], ["normal", "normalPhi", "useNormal"], ["roughness", "roughnessPhi", "useRoughness"]];
class DenoisePass extends Pass {
  constructor(camera, textures = [], customComposeShader = "", customComposeShaderFunctions = "", options = defaultDenoisePassOptions) {
    super("DenoisePass");
    this.iterations = 1;
    options = { ...defaultDenoisePassOptions,
      ...options
    };
    let definitions = "";
    const finalOutputShader = "";
    let outputShader = "";
    this.textures = textures;

    for (let i = 0; i < this.textures.length; i++) {
      definitions +=
      /* glsl */
      `layout(location = ${i}) out vec4 gTexture${i};\n`;
      definitions +=
      /* glsl */
      `uniform sampler2D texture${i};\n`;
      outputShader +=
      /* glsl */
      `gTexture${i} = vec4(denoisedColor[${i}], sumVariance[${i}]);\n`;
    }

    let finalFragmentShader = definitions + fragmentShader$1.replace("#include <customComposeShaderFunctions>", customComposeShaderFunctions).replace("#include <customComposeShader>", customComposeShader).replace("#include <finalOutputShader>", finalOutputShader).replace("#include <outputShader>", outputShader).replaceAll("textureCount", this.textures.length).replaceAll("momentTextureCount", Math.min(this.textures.length, 2));
    finalFragmentShader = unrollLoops(finalFragmentShader);
    const matches = finalFragmentShader.matchAll(/texture\[\s*[0-9]+\s*]/g);

    for (const [key] of matches) {
      const number = key.replace(/[^0-9]/g, "");
      finalFragmentShader = finalFragmentShader.replace(key, "texture" + number);
    }

    options = { ...defaultDenoisePassOptions,
      ...options
    };
    this.fullscreenMaterial = new ShaderMaterial({
      fragmentShader: finalFragmentShader,
      vertexShader: vertexShader,
      uniforms: {
        depthTexture: new Uniform(null),
        normalTexture: new Uniform(null),
        momentTexture: new Uniform(null),
        invTexSize: new Uniform(new Vector2()),
        horizontal: new Uniform(true),
        blurHorizontal: new Uniform(true),
        denoiseKernel: new Uniform(1),
        denoiseDiffuse: new Uniform(1),
        denoise: new Uniform([0]),
        depthPhi: new Uniform(1),
        normalPhi: new Uniform(1),
        roughnessPhi: new Uniform(1),
        stepSize: new Uniform(1),
        isFirstIteration: new Uniform(false),
        isLastIteration: new Uniform(false),
        viewMatrix: new Uniform(camera.matrixWorldInverse),
        projectionMatrix: new Uniform(camera.projectionMatrix),
        cameraMatrixWorld: new Uniform(camera.matrixWorld),
        projectionMatrixInverse: new Uniform(camera.projectionMatrixInverse)
      },
      glslVersion: GLSL3
    });
    const renderTargetOptions = {
      type: HalfFloatType,
      depthBuffer: false
    };
    this.renderTargetA = new WebGLMultipleRenderTargets(1, 1, this.textures.length, renderTargetOptions);
    this.renderTargetB = new WebGLMultipleRenderTargets(1, 1, this.textures.length, renderTargetOptions); // register the texture uniforms

    for (let i = 0; i < this.textures.length; i++) {
      this.fullscreenMaterial.uniforms["texture" + i] = new Uniform(textures[i]);
    }

    if (typeof options.roughnessDependent === "boolean") {
      options.roughnessDependent = Array(textures.length).fill(options.roughnessDependent);
    }

    this.fullscreenMaterial.defines.roughnessDependent =
    /* glsl */
    `bool[](${options.roughnessDependent.join(", ")})`;

    if (typeof options.basicVariance === "number") {
      options.basicVariance = Array(textures.length).fill(options.basicVariance);
    }

    this.fullscreenMaterial.defines.basicVariance =
    /* glsl */
    `float[](${options.basicVariance.map(n => n.toPrecision(5)).join(", ")})`;
    this.options = options;
  }

  setSize(width, height) {
    this.renderTargetA.setSize(width, height);
    this.renderTargetB.setSize(width, height);
    this.fullscreenMaterial.uniforms.invTexSize.value.set(1 / width, 1 / height);
  }

  dispose() {
    super.dispose();
    this.renderTargetA.dispose();
    this.renderTargetB.dispose();
  }

  keepEdgeStoppingDefinesUpdated() {
    for (const [name, phi, define] of useEdgeStoppingTypes) {
      var _this$fullscreenMater;

      const useEdgeStoppingType = this.options[name] && (phi === "" || ((_this$fullscreenMater = this.fullscreenMaterial.uniforms[phi]) == null ? void 0 : _this$fullscreenMater.value) > 0.001);

      if (useEdgeStoppingType !== define in this.fullscreenMaterial.defines) {
        useEdgeStoppingType ? this.fullscreenMaterial.defines[define] = "" : delete this.fullscreenMaterial.defines[define];
        this.fullscreenMaterial.needsUpdate = true;
      }
    }
  }

  render(renderer) {
    this.keepEdgeStoppingDefinesUpdated();
    const denoiseKernel = this.fullscreenMaterial.uniforms.denoiseKernel.value;

    if (this.iterations > 0) {
      for (let i = 0; i < 2 * this.iterations; i++) {
        const horizontal = i % 2 === 0;
        const stepSize = 2 ** ~~(i / 2);
        const n = parseInt(Math.log2(stepSize));
        const blurHorizontal = n % 2 == 0;
        this.fullscreenMaterial.uniforms.horizontal.value = horizontal;
        this.fullscreenMaterial.uniforms.blurHorizontal.value = blurHorizontal;
        this.fullscreenMaterial.uniforms.stepSize.value = stepSize;
        this.fullscreenMaterial.uniforms.isFirstIteration.value = i === 0;
        this.fullscreenMaterial.uniforms.isLastIteration.value = i === 2 * this.iterations - 1;
        const renderTarget = horizontal ? this.renderTargetA : this.renderTargetB;

        for (let j = 0; j < this.textures.length; j++) {
          this.fullscreenMaterial.uniforms["texture" + j].value = horizontal ? i === 0 ? this.textures[j] : this.renderTargetB.texture[j] : this.renderTargetA.texture[j];
        }

        renderer.setRenderTarget(renderTarget);
        renderer.render(this.scene, this.camera);
      }
    } else {
      this.fullscreenMaterial.uniforms.denoiseKernel.value = 0;
      renderer.setRenderTarget(this.renderTargetB);
      renderer.render(this.scene, this.camera);
      this.fullscreenMaterial.uniforms.denoiseKernel.value = denoiseKernel;
    }

    for (let i = 0; i < this.textures.length; i++) {
      this.fullscreenMaterial.uniforms["texture" + i].value = this.textures[i];
    }
  } // final composition will be written to buffer 0


  get texture() {
    return this.renderTargetB.texture[0];
  }

}

var svgf_temporal_reproject = "#define GLSLIFY 1\nvec4 moment;if(!reset&&reprojectedUvDiffuse.x>=0.0){vec4 historyMoment=sampleReprojectedTexture(lastMomentTexture,reprojectedUvDiffuse,true,didMove);moment.r=luminance(gOutput[0].rgb);moment.g=moment.r*moment.r;\n#if textureCount > 1\nmoment.b=luminance(gOutput[1].rgb);moment.a=moment.b*moment.b;\n#endif\ngMoment=mix(moment,historyMoment,0.8);}else{moment.rg=vec2(0.,5000.);moment.ba=vec2(0.,5000.);gMoment=moment;return;}"; // eslint-disable-line

/* eslint-disable camelcase */
const defaultSVGFTemporalReprojectPassOptions = {
  fullAccumulate: true,
  customComposeShader: svgf_temporal_reproject
};
class SVGFTemporalReprojectPass extends TemporalReprojectPass {
  constructor(scene, camera, velocityDepthNormalPass, textureCount = 1, options = defaultSVGFTemporalReprojectPassOptions) {
    options = { ...defaultSVGFTemporalReprojectPassOptions,
      ...options
    };
    super(scene, camera, velocityDepthNormalPass, textureCount, options); // moment

    this.momentTexture = this.renderTarget.texture[0].clone();
    this.momentTexture.isRenderTargetTexture = true;
    this.momentTexture.type = FloatType;
    this.momentTexture.minFilter = NearestFilter;
    this.momentTexture.magFilter = NearestFilter;
    this.momentTexture.needsUpdate = true;
    this.renderTarget.texture.push(this.momentTexture);
    const momentBuffers =
    /* glsl */
    `
		layout(location = ${textureCount}) out vec4 gMoment;

		uniform sampler2D lastMomentTexture;
		`;
    this.fullscreenMaterial.fragmentShader = momentBuffers + this.fullscreenMaterial.fragmentShader;
    this.fullscreenMaterial.uniforms = { ...this.fullscreenMaterial.uniforms,
      ...{
        lastMomentTexture: new Uniform(null)
      }
    };
    const copyPassTextureCount = textureCount + 1;
    this.copyPass.setTextureCount(copyPassTextureCount);
    this.copyPass.fullscreenMaterial.uniforms["inputTexture" + (copyPassTextureCount - 1)].value = this.momentTexture;
    const lastMomentTexture = this.copyPass.renderTarget.texture[copyPassTextureCount - 1];
    lastMomentTexture.type = FloatType;
    lastMomentTexture.minFilter = LinearFilter; // need to use linear filter over nearest filter

    lastMomentTexture.magFilter = LinearFilter;
    lastMomentTexture.needsUpdate = true;
    this.fullscreenMaterial.uniforms.lastMomentTexture.value = lastMomentTexture;
    this.fullscreenMaterial.defines.momentTextureCount = Math.min(2, textureCount);
  }

}

class SVGF {
  constructor(scene, camera, velocityDepthNormalPass, textureCount = 1, denoiseComposeShader = "", denoiseComposeFunctions = "", options = {}) {
    this.svgfTemporalReprojectPass = new SVGFTemporalReprojectPass(scene, camera, velocityDepthNormalPass, textureCount, options);
    const textures = this.svgfTemporalReprojectPass.renderTarget.texture.slice(0, textureCount);
    this.denoisePass = new DenoisePass(camera, textures, denoiseComposeShader, denoiseComposeFunctions, options);
    this.denoisePass.fullscreenMaterial.uniforms.momentTexture.value = this.svgfTemporalReprojectPass.momentTexture;
    this.setNonJitteredDepthTexture(velocityDepthNormalPass.depthTexture);
  } // the denoised texture


  get texture() {
    return this.denoisePass.texture;
  }

  setGBuffers(depthTexture, normalTexture) {
    this.setJitteredGBuffers(depthTexture, normalTexture);
    this.setNonJitteredGBuffers(depthTexture, normalTexture);
  }

  setJitteredGBuffers(depthTexture, normalTexture) {
    this.denoisePass.fullscreenMaterial.uniforms.depthTexture.value = depthTexture;
    this.denoisePass.fullscreenMaterial.uniforms.normalTexture.value = normalTexture;
  }

  setNonJitteredDepthTexture(depthTexture) {
    this.svgfTemporalReprojectPass.fullscreenMaterial.uniforms.depthTexture.value = depthTexture;
  }

  setVelocityTexture(texture) {
    this.svgfTemporalReprojectPass.fullscreenMaterial.uniforms.velocityTexture.value = texture;
  }

  setSize(width, height) {
    this.denoisePass.setSize(width, height);
    this.svgfTemporalReprojectPass.setSize(width, height);
  }

  dispose() {
    this.denoisePass.dispose();
    this.svgfTemporalReprojectPass.dispose();
  }

  render(renderer) {
    this.svgfTemporalReprojectPass.render(renderer);
    this.denoisePass.render(renderer);
  }

}

// and velocity to "gVelocity" buffer

class MRTMaterial extends ShaderMaterial {
  constructor() {
    super({
      type: "MRTMaterial",
      defines: {
        USE_UV: "",
        TEMPORAL_RESOLVE: ""
      },
      uniforms: {
        color: new Uniform(new Color()),
        emissive: new Uniform(new Color()),
        map: new Uniform(null),
        roughnessMap: new Uniform(null),
        metalnessMap: new Uniform(null),
        emissiveMap: new Uniform(null),
        alphaMap: new Uniform(null),
        normalMap: new Uniform(null),
        normalScale: new Uniform(new Vector2(1, 1)),
        roughness: new Uniform(0),
        metalness: new Uniform(0),
        emissiveIntensity: new Uniform(0),
        uvTransform: new Uniform(new Matrix3()),
        boneTexture: new Uniform(null),
        blueNoiseTexture: new Uniform(null),
        blueNoiseRepeat: new Uniform(new Vector2(1, 1)),
        texSize: new Uniform(new Vector2(1, 1)),
        frame: new Uniform(0)
      },
      vertexShader:
      /* glsl */
      `
                varying vec2 vHighPrecisionZW;

                #define NORMAL
                #if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
                    varying vec3 vViewPosition;
                #endif
                
                #include <common>
                #include <uv_pars_vertex>
                #include <displacementmap_pars_vertex>
                #include <normal_pars_vertex>
                #include <morphtarget_pars_vertex>
                #include <logdepthbuf_pars_vertex>
                #include <clipping_planes_pars_vertex>
                #include <skinning_pars_vertex>
                #include <color_pars_vertex>

                varying vec2 screenUv;

                void main() {
                    #include <uv_vertex>
                    
                    #include <skinbase_vertex>
                    #include <beginnormal_vertex>
                    #include <skinnormal_vertex>
                    #include <defaultnormal_vertex>

                    #include <morphnormal_vertex>
                    #include <normal_vertex>
                    #include <begin_vertex>
                    #include <morphtarget_vertex>

                    #include <skinning_vertex>

                    #include <displacementmap_vertex>
                    #include <project_vertex>
                    #include <logdepthbuf_vertex>
                    #include <clipping_planes_vertex>

                    #include <color_vertex>
                    
                    #if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
                        vViewPosition = - mvPosition.xyz;
                    #endif

                    screenUv = gl_Position.xy * 0.5 + 0.5;

                    vHighPrecisionZW = gl_Position.zw;
                }
            `,
      fragmentShader:
      /* glsl */
      `
                #define NORMAL
                #if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
                    varying vec3 vViewPosition;
                #endif
                #include <packing>
                #include <uv_pars_fragment>
                #include <normal_pars_fragment>
                #include <bumpmap_pars_fragment>
                #include <normalmap_pars_fragment>
                #include <logdepthbuf_pars_fragment>
                #include <clipping_planes_pars_fragment>
                #include <color_pars_fragment>
                #include <alphamap_pars_fragment>
                
                layout(location = 0) out vec4 gDepth;
                layout(location = 1) out vec4 gNormal;
                layout(location = 2) out vec4 gDiffuse;
                layout(location = 3) out vec4 gEmissive;

                #include <map_pars_fragment>
                uniform vec3 color;

                varying vec2 vHighPrecisionZW;

                #include <metalnessmap_pars_fragment>
                uniform float metalness;

                #include <roughnessmap_pars_fragment>
                uniform float roughness;

                #include <emissivemap_pars_fragment>
                uniform vec3 emissive;
                uniform float emissiveIntensity;

#ifdef USE_ALPHAMAP
                uniform sampler2D blueNoiseTexture;
                uniform vec2 blueNoiseRepeat;
                uniform vec2 texSize;
                uniform int frame;

                varying vec2 screenUv;

                const float g = 1.6180339887498948482;
                const float a1 = 1.0 / g;

                // reference: https://extremelearning.com.au/unreasonable-effectiveness-of-quasirandom-sequences/
                float r1(float n) {
                    // 7th harmonious number
                    return fract(1.1127756842787055 + a1 * n);
                }

                const vec4 hn = vec4(0.618033988749895, 0.3247179572447458, 0.2207440846057596, 0.1673039782614187);

                vec4 sampleBlueNoise(vec2 uv, int seed) {
                    vec2 size = uv * texSize;
                    vec2 blueNoiseSize = texSize / blueNoiseRepeat;
                    float blueNoiseIndex = floor(floor(size.y / blueNoiseSize.y) * blueNoiseRepeat.x) + floor(size.x / blueNoiseSize.x);

                    // get the offset of this pixel's blue noise tile
                    int blueNoiseTileOffset = int(r1(blueNoiseIndex + 1.0) * 65536.);

                    vec2 blueNoiseUv = uv * blueNoiseRepeat;

                    // fetch blue noise for this pixel
                    vec4 blueNoise = textureLod(blueNoiseTexture, blueNoiseUv, 0.);

                    // animate blue noise
                    blueNoise = fract(blueNoise + hn * float(seed + blueNoiseTileOffset));

                    blueNoise.r = (blueNoise.r > 0.5 ? 1.0 - blueNoise.r : blueNoise.r) * 2.0;
                    blueNoise.g = (blueNoise.g > 0.5 ? 1.0 - blueNoise.g : blueNoise.g) * 2.0;
                    blueNoise.b = (blueNoise.b > 0.5 ? 1.0 - blueNoise.b : blueNoise.b) * 2.0;
                    blueNoise.a = (blueNoise.a > 0.5 ? 1.0 - blueNoise.a : blueNoise.a) * 2.0;

                    return blueNoise;
                }
#endif

                void main() {
                    #ifdef USE_ALPHAMAP
                    float alpha = textureLod( alphaMap, vUv, 0. ).g;

                    float alphaThreshold = sampleBlueNoise(screenUv, frame).a;
                    if(alpha < alphaThreshold){
                        discard;
                        return;
                    }
                    #endif

                    #include <clipping_planes_fragment>
                    #include <logdepthbuf_fragment>
                    #include <normal_fragment_begin>
                    #include <normal_fragment_maps>

                    float roughnessFactor = roughness;
                    bool isDeselected = roughness > 10.0e9;
                    
                    if(isDeselected){
                        roughnessFactor = 1.;
                        gNormal = vec4(0.);
                    }else{
                        #ifdef USE_ROUGHNESSMAP
                            vec4 texelRoughness = textureLod( roughnessMap, vUv, 0. );
                            // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
                            roughnessFactor *= texelRoughness.g;
                        #endif

                        // roughness of 1.0 is reserved for deselected meshes
                        roughnessFactor = min(0.99, roughnessFactor);

                        vec3 worldNormal = normalize((vec4(normal, 1.) * viewMatrix).xyz);
                        gNormal = vec4( worldNormal, roughnessFactor );
                    }
                    

                    if(isDeselected){
                        discard;
                        return;
                    }

                    float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;

                    vec4 depthColor = packDepthToRGBA( fragCoordZ );
                    gDepth = depthColor;

                    #include <metalnessmap_fragment>

                    vec4 diffuseColor = vec4(color, metalnessFactor);

                    #include <map_fragment>
                    #include <color_fragment>

                    gDiffuse = diffuseColor;

                    vec3 totalEmissiveRadiance = emissive * emissiveIntensity;
                    #include <emissivemap_fragment>
                    
                    gEmissive = vec4(totalEmissiveRadiance, 0.);
                }
            `,
      glslVersion: GLSL3,
      toneMapped: false,
      alphaTest: false,
      fog: false,
      lights: false
    });
    this.normalMapType = TangentSpaceNormalMap;
    this.normalScale = new Vector2(1, 1);
  }

}

var fragmentShader = "#define GLSLIFY 1\n#if !defined(diffuseOnly) && !defined(specularOnly)\nlayout(location=0)out vec4 gDiffuse;layout(location=1)out vec4 gSpecular;\n#else\n#ifdef diffuseOnly\nlayout(location=0)out vec4 gDiffuse;\n#else\nlayout(location=0)out vec4 gSpecular;\n#endif\n#endif\nvarying vec2 vUv;uniform sampler2D directLightTexture;uniform sampler2D accumulatedTexture;uniform sampler2D normalTexture;uniform sampler2D depthTexture;uniform sampler2D diffuseTexture;uniform sampler2D emissiveTexture;uniform sampler2D blueNoiseTexture;uniform sampler2D velocityTexture;\n#ifdef autoThickness\nuniform sampler2D backSideDepthTexture;\n#endif\nuniform mat4 projectionMatrix;uniform mat4 inverseProjectionMatrix;uniform mat4 cameraMatrixWorld;uniform float cameraNear;uniform float cameraFar;uniform float maxEnvMapMipLevel;uniform vec3 cameraPos;uniform float rayDistance;uniform float maxRoughness;uniform float thickness;uniform float envBlur;uniform float maxEnvLuminance;uniform int frame;uniform vec2 texSize;uniform vec2 blueNoiseRepeat;struct EquirectHdrInfo{sampler2D marginalWeights;sampler2D conditionalWeights;sampler2D map;vec2 size;float totalSumWhole;float totalSumDecimal;};uniform EquirectHdrInfo envMapInfo;\n#define INVALID_RAY_COORDS vec2(-1.0);\n#define EPSILON 0.00001\n#define ONE_MINUS_EPSILON 1.0 - EPSILON\nfloat nearMinusFar;float nearMulFar;float farMinusNear;vec2 invTexSize;\n#include <packing>\n#include <utils>\nvec2 RayMarch(inout vec3 dir,inout vec3 hitPos);vec2 BinarySearch(inout vec3 dir,inout vec3 hitPos);float fastGetViewZ(const float depth);vec3 doSample(const vec3 viewPos,const vec3 viewDir,const vec3 viewNormal,const vec3 worldPosition,const float metalness,const float roughness,const bool isDiffuseSample,const bool isMisSample,const float NoV,const float NoL,const float NoH,const float LoH,const float VoH,const vec2 random,inout vec3 l,inout vec3 hitPos,out bool isMissedRay,out vec3 brdf,out float pdf);void main(){vec4 depthTexel=textureLod(depthTexture,vUv,0.0);if(dot(depthTexel.rgb,depthTexel.rgb)==0.){discard;return;}vec4 normalTexel=textureLod(normalTexture,vUv,0.0);float roughness=normalTexel.a;if(roughness==1.0||roughness>maxRoughness){discard;return;}invTexSize=1./texSize;roughness=clamp(roughness*roughness,0.0001,1.0);nearMinusFar=cameraNear-cameraFar;nearMulFar=cameraNear*cameraFar;farMinusNear=cameraFar-cameraNear;float unpackedDepth=unpackRGBAToDepth(depthTexel);float depth=fastGetViewZ(unpackedDepth);vec3 viewPos=getViewPosition(depth);vec3 viewDir=normalize(viewPos);vec3 worldNormal=normalTexel.xyz;vec3 viewNormal=normalize((vec4(worldNormal,1.)*cameraMatrixWorld).xyz);vec3 worldPos=vec4(vec4(viewPos,1.)*viewMatrix).xyz;vec4 diffuseTexel=textureLod(diffuseTexture,vUv,0.);vec3 diffuse=diffuseTexel.rgb;float metalness=diffuseTexel.a;vec3 n=viewNormal;vec3 v=-viewDir;float NoV=max(EPSILON,dot(n,v));vec3 V=(vec4(v,1.)*viewMatrix).xyz;vec3 N=worldNormal;vec4 blueNoise;vec3 H,l,h,F,T,B,envMisDir,gi;vec3 SSGI,diffuseGI,specularGI,brdf,hitPos;Onb(N,T,B);V=ToLocal(T,B,N,V);vec3 f0=mix(vec3(0.04),diffuse,metalness);float NoL,NoH,LoH,VoH,diffW,specW,invW,pdf,envPdf,diffuseSamples,specularSamples;bool isDiffuseSample,valid,isMissedRay;int sampleCounter=0;\n#pragma unroll_loop_start\nfor(int i=0;i<spp;i++){blueNoise=sampleBlueNoise(frame+sampleCounter++);H=SampleGGXVNDF(V,roughness,roughness,blueNoise.r,blueNoise.g);if(H.z<0.0)H=-H;l=normalize(reflect(-V,H));l=ToWorld(T,B,N,l);l=(vec4(l,1.)*cameraMatrixWorld).xyz;l=normalize(l);h=normalize(v+l);NoL=clamp(dot(n,l),EPSILON,ONE_MINUS_EPSILON);NoH=clamp(dot(n,h),EPSILON,ONE_MINUS_EPSILON);LoH=clamp(dot(l,h),EPSILON,ONE_MINUS_EPSILON);VoH=clamp(dot(v,h),EPSILON,ONE_MINUS_EPSILON);\n#if !defined(diffuseOnly) && !defined(specularOnly)\nF=F_Schlick(f0,VoH);diffW=(1.-metalness)*luminance(diffuse);specW=luminance(F);diffW=max(diffW,EPSILON);specW=max(specW,EPSILON);invW=1./(diffW+specW);diffW*=invW;specW*=invW;isDiffuseSample=blueNoise.b<diffW;\n#else\n#ifdef diffuseOnly\nisDiffuseSample=true;\n#else\nisDiffuseSample=false;\n#endif\n#endif\nenvMisDir=vec3(0.0);envPdf=0.0;\n#ifdef importanceSampling\nenvPdf=sampleEquirectProbability(envMapInfo,blueNoise.rg,envMisDir);envMisDir=normalize((vec4(envMisDir,1.)*cameraMatrixWorld).xyz);\n#endif\nvalid=blueNoise.a<0.25+dot(envMisDir,viewNormal)*0.5;if(!valid)envPdf=0.0;if(isDiffuseSample){if(envPdf==0.0){l=cosineSampleHemisphere(viewNormal,blueNoise.rg);}else{l=envMisDir;}h=normalize(v+l);NoL=clamp(dot(n,l),EPSILON,ONE_MINUS_EPSILON);NoH=clamp(dot(n,h),EPSILON,ONE_MINUS_EPSILON);LoH=clamp(dot(l,h),EPSILON,ONE_MINUS_EPSILON);VoH=clamp(dot(v,h),EPSILON,ONE_MINUS_EPSILON);gi=doSample(viewPos,viewDir,viewNormal,worldPos,metalness,roughness,isDiffuseSample,envPdf!=0.0,NoV,NoL,NoH,LoH,VoH,blueNoise.rg,l,hitPos,isMissedRay,brdf,pdf);gi*=brdf;if(envPdf==0.0){gi/=pdf;}else{gi*=misHeuristic(envPdf,pdf);gi/=envPdf;}diffuseSamples++;diffuseGI=mix(diffuseGI,gi,1./diffuseSamples);}else{if(envPdf!=0.0&&roughness>=0.025){l=envMisDir;h=normalize(v+l);NoL=clamp(dot(n,l),EPSILON,ONE_MINUS_EPSILON);NoH=clamp(dot(n,h),EPSILON,ONE_MINUS_EPSILON);LoH=clamp(dot(l,h),EPSILON,ONE_MINUS_EPSILON);VoH=clamp(dot(v,h),EPSILON,ONE_MINUS_EPSILON);}else{envPdf=0.0;}gi=doSample(viewPos,viewDir,viewNormal,worldPos,metalness,roughness,isDiffuseSample,envPdf!=0.0,NoV,NoL,NoH,LoH,VoH,blueNoise.rg,l,hitPos,isMissedRay,brdf,pdf);gi*=brdf;if(envPdf==0.0){gi/=pdf;}else{gi*=misHeuristic(envPdf,pdf);gi/=envPdf;}specularSamples++;specularGI=mix(specularGI,gi,1./specularSamples);}}\n#pragma unroll_loop_end\nroughness=sqrt(roughness);\n#ifndef specularOnly\nif(diffuseSamples==0.0)diffuseGI=vec3(-1.0);gDiffuse=vec4(diffuseGI,roughness);\n#endif\n#ifndef diffuseOnly\nfloat rayLength=0.0;if(!isMissedRay&&roughness<0.375&&getCurvature(viewNormal,depth)<0.001){vec3 hitPosWS=(vec4(hitPos,1.)*viewMatrix).xyz;rayLength=distance(worldPos,hitPosWS);}if(specularSamples==0.0)specularGI=vec3(-1.0);gSpecular=vec4(specularGI,rayLength);\n#endif\n}vec3 doSample(const vec3 viewPos,const vec3 viewDir,const vec3 viewNormal,const vec3 worldPosition,const float metalness,const float roughness,const bool isDiffuseSample,const bool isMisSample,const float NoV,const float NoL,const float NoH,const float LoH,const float VoH,const vec2 random,inout vec3 l,inout vec3 hitPos,out bool isMissedRay,out vec3 brdf,out float pdf){float cosTheta=max(0.0,dot(viewNormal,l));if(isDiffuseSample){vec3 diffuseBrdf=vec3(evalDisneyDiffuse(NoL,NoV,LoH,roughness,metalness));pdf=NoL/M_PI;pdf=max(EPSILON,pdf);brdf=diffuseBrdf;}else{vec3 specularBrdf=evalDisneySpecular(roughness,NoH,NoV,NoL);pdf=GGXVNDFPdf(NoH,NoV,roughness);pdf=max(EPSILON,pdf);brdf=specularBrdf;}brdf*=cosTheta;hitPos=viewPos;\n#if steps == 0\nhitPos+=l;vec2 coords=viewSpaceToScreenSpace(hitPos);\n#else\nvec2 coords=RayMarch(l,hitPos);\n#endif\nbool allowMissedRays=false;\n#ifdef missedRays\nallowMissedRays=true;\n#endif\nisMissedRay=coords.x==-1.0;vec3 envMapSample=vec3(0.);\n#ifdef USE_ENVMAP\nif(isMissedRay||allowMissedRays){vec3 reflectedWS=normalize((vec4(l,1.)*viewMatrix).xyz);\n#ifdef BOX_PROJECTED_ENV_MAP\nfloat depth=unpackRGBAToDepth(textureLod(depthTexture,vUv,0.));reflectedWS=parallaxCorrectNormal(reflectedWS.xyz,envMapSize,envMapPosition,worldPosition);reflectedWS=normalize(reflectedWS.xyz);\n#endif\nfloat mip=envBlur*maxEnvMapMipLevel;if(!isDiffuseSample)mip*=sqrt(roughness);envMapSample=sampleEquirectEnvMapColor(reflectedWS,envMapInfo.map,mip);float maxEnvLum=isMisSample ? maxEnvLuminance : 5.0;if(maxEnvLum!=0.0){float envLum=luminance(envMapSample);if(envLum>maxEnvLum){envMapSample*=maxEnvLum/envLum;}}return envMapSample;}\n#endif\nvec4 velocity=textureLod(velocityTexture,coords.xy,0.0);vec2 reprojectedUv=coords.xy-velocity.xy;vec3 SSGI;bvec4 reprojectedUvInScreen=bvec4(greaterThanEqual(reprojectedUv,vec2(0.)),lessThanEqual(reprojectedUv,vec2(1.)));if(all(reprojectedUvInScreen)){vec4 emissiveTexel=textureLod(emissiveTexture,coords.xy,0.);vec3 emissiveColor=emissiveTexel.rgb*10.;vec3 reprojectedGI=getTexel(accumulatedTexture,reprojectedUv,0.).rgb;SSGI=reprojectedGI+emissiveColor;\n#ifdef useDirectLight\nSSGI+=textureLod(directLightTexture,coords.xy,0.).rgb*directLightMultiplier;\n#endif\n}else{SSGI=textureLod(directLightTexture,vUv,0.).rgb;}if(allowMissedRays){float ssgiLum=luminance(SSGI);float envLum=luminance(envMapSample);if(envLum>ssgiLum)SSGI=envMapSample;}return SSGI;}vec2 RayMarch(inout vec3 dir,inout vec3 hitPos){float stepsFloat=float(steps);float rayHitDepthDifference;dir*=rayDistance/float(steps);vec2 uv;for(int i=1;i<steps;i++){hitPos+=dir;if(hitPos.z>0.0)return INVALID_RAY_COORDS;uv=viewSpaceToScreenSpace(hitPos);\n#ifndef missedRays\nif(any(lessThan(uv,vec2(0.)))||any(greaterThan(uv,vec2(1.))))return INVALID_RAY_COORDS;\n#endif\nfloat unpackedDepth=unpackRGBAToDepth(textureLod(depthTexture,uv,0.0));float depth=fastGetViewZ(unpackedDepth);\n#ifdef autoThickness\nfloat unpackedBackSideDepth=unpackRGBAToDepth(textureLod(backSideDepthTexture,uv,0.0));float backSideDepth=fastGetViewZ(unpackedBackSideDepth);float currentThickness=max(abs(depth-backSideDepth),thickness);\n#else\nfloat currentThickness=thickness;\n#endif\nrayHitDepthDifference=depth-hitPos.z;if(rayHitDepthDifference>=0.0&&rayHitDepthDifference<currentThickness){\n#if refineSteps == 0\nreturn uv;\n#else\nreturn BinarySearch(dir,hitPos);\n#endif\n}}\n#ifndef missedRays\nreturn INVALID_RAY_COORDS;\n#endif\nreturn uv;}vec2 BinarySearch(inout vec3 dir,inout vec3 hitPos){float rayHitDepthDifference;vec2 uv;dir*=0.5;hitPos-=dir;for(int i=0;i<refineSteps;i++){uv=viewSpaceToScreenSpace(hitPos);float unpackedDepth=unpackRGBAToDepth(textureLod(depthTexture,uv,0.0));float depth=fastGetViewZ(unpackedDepth);rayHitDepthDifference=depth-hitPos.z;dir*=0.5;hitPos+=rayHitDepthDifference>0.0 ?-dir : dir;}uv=viewSpaceToScreenSpace(hitPos);return uv;}float fastGetViewZ(const float depth){\n#ifdef PERSPECTIVE_CAMERA\nreturn nearMulFar/(farMinusNear*depth-cameraFar);\n#else\nreturn depth*nearMinusFar-cameraNear;\n#endif\n}"; // eslint-disable-line

var ssgi_utils = "#define GLSLIFY 1\n#define PI M_PI\n#define luminance(a) dot(vec3(0.2125, 0.7154, 0.0721), a)\nvec4 getTexel(const sampler2D tex,vec2 p,const float mip){p=p/invTexSize+0.5;vec2 i=floor(p);vec2 f=p-i;f=f*f*f*(f*(f*6.0-15.0)+10.0);p=i+f;p=(p-0.5)*invTexSize;return textureLod(tex,p,mip);}vec3 getViewPosition(const float depth){float clipW=projectionMatrix[2][3]*depth+projectionMatrix[3][3];vec4 clipPosition=vec4((vec3(vUv,depth)-0.5)*2.0,1.0);clipPosition*=clipW;return(inverseProjectionMatrix*clipPosition).xyz;}vec3 screenSpaceToWorldSpace(vec2 uv,float depth,mat4 camMatrixWorld){vec3 viewPos=getViewPosition(depth);return vec4(camMatrixWorld*vec4(viewPos,1.)).xyz;}float getViewZ(const float depth){\n#ifdef PERSPECTIVE_CAMERA\nreturn perspectiveDepthToViewZ(depth,cameraNear,cameraFar);\n#else\nreturn orthographicDepthToViewZ(depth,cameraNear,cameraFar);\n#endif\n}vec2 viewSpaceToScreenSpace(const vec3 position){vec4 projectedCoord=projectionMatrix*vec4(position,1.0);projectedCoord.xy/=projectedCoord.w;projectedCoord.xy=projectedCoord.xy*0.5+0.5;return projectedCoord.xy;}vec2 worldSpaceToScreenSpace(const vec3 worldPos){vec4 vsPos=vec4(worldPos,1.0)*cameraMatrixWorld;return viewSpaceToScreenSpace(vsPos.xyz);}\n#ifdef BOX_PROJECTED_ENV_MAP\nuniform vec3 envMapSize;uniform vec3 envMapPosition;vec3 parallaxCorrectNormal(const vec3 v,const vec3 cubeSize,const vec3 cubePos,const vec3 worldPosition){vec3 nDir=normalize(v);vec3 rbmax=(.5*cubeSize+cubePos-worldPosition)/nDir;vec3 rbmin=(-.5*cubeSize+cubePos-worldPosition)/nDir;vec3 rbminmax;rbminmax.x=(nDir.x>0.)? rbmax.x : rbmin.x;rbminmax.y=(nDir.y>0.)? rbmax.y : rbmin.y;rbminmax.z=(nDir.z>0.)? rbmax.z : rbmin.z;float correction=min(min(rbminmax.x,rbminmax.y),rbminmax.z);vec3 boxIntersection=worldPosition+nDir*correction;return boxIntersection-cubePos;}\n#endif\n#define M_PI 3.1415926535897932384626433832795\nvec2 equirectDirectionToUv(const vec3 direction){vec2 uv=vec2(atan(direction.z,direction.x),acos(direction.y));uv/=vec2(2.0*M_PI,M_PI);uv.x+=0.5;uv.y=1.0-uv.y;return uv;}vec3 equirectUvToDirection(vec2 uv){uv.x-=0.5;uv.y=1.0-uv.y;float theta=uv.x*2.0*PI;float phi=uv.y*PI;float sinPhi=sin(phi);return vec3(sinPhi*cos(theta),cos(phi),sinPhi*sin(theta));}vec3 sampleEquirectEnvMapColor(const vec3 direction,const sampler2D map,const float lod){return getTexel(map,equirectDirectionToUv(direction),lod).rgb;}mat3 getBasisFromNormal(const vec3 normal){vec3 other;if(abs(normal.x)>0.5){other=vec3(0.0,1.0,0.0);}else{other=vec3(1.0,0.0,0.0);}vec3 ortho=normalize(cross(normal,other));vec3 ortho2=normalize(cross(normal,ortho));return mat3(ortho2,ortho,normal);}vec3 F_Schlick(const vec3 f0,const float theta){return f0+(1.-f0)*pow(1.0-theta,5.);}float F_Schlick(const float f0,const float f90,const float theta){return f0+(f90-f0)*pow(1.0-theta,5.0);}float D_GTR(const float roughness,const float NoH,const float k){float a2=pow(roughness,2.);return a2/(PI*pow((NoH*NoH)*(a2*a2-1.)+1.,k));}float SmithG(const float NDotV,const float alphaG){float a=alphaG*alphaG;float b=NDotV*NDotV;return(2.0*NDotV)/(NDotV+sqrt(a+b-a*b));}float GGXVNDFPdf(const float NoH,const float NoV,const float roughness){float D=D_GTR(roughness,NoH,2.);float G1=SmithG(NoV,roughness*roughness);return(D*G1)/max(0.00001,4.0f*NoV);}float GeometryTerm(const float NoL,const float NoV,const float roughness){float a2=roughness*roughness;float G1=SmithG(NoV,a2);float G2=SmithG(NoL,a2);return G1*G2;}float evalDisneyDiffuse(const float NoL,const float NoV,const float LoH,const float roughness,const float metalness){float FD90=0.5+2.*roughness*pow(LoH,2.);float a=F_Schlick(1.,FD90,NoL);float b=F_Schlick(1.,FD90,NoV);return(a*b/PI)*(1.-metalness);}vec3 evalDisneySpecular(const float roughness,const float NoH,const float NoV,const float NoL){float D=D_GTR(roughness,NoH,2.);float G=GeometryTerm(NoL,NoV,pow(0.5+roughness*.5,2.));vec3 spec=vec3(D*G/(4.*NoL*NoV));return spec;}vec3 SampleGGXVNDF(const vec3 V,const float ax,const float ay,const float r1,const float r2){vec3 Vh=normalize(vec3(ax*V.x,ay*V.y,V.z));float lensq=Vh.x*Vh.x+Vh.y*Vh.y;vec3 T1=lensq>0. ? vec3(-Vh.y,Vh.x,0.)*inversesqrt(lensq): vec3(1.,0.,0.);vec3 T2=cross(Vh,T1);float r=sqrt(r1);float phi=2.0*PI*r2;float t1=r*cos(phi);float t2=r*sin(phi);float s=0.5*(1.0+Vh.z);t2=(1.0-s)*sqrt(1.0-t1*t1)+s*t2;vec3 Nh=t1*T1+t2*T2+sqrt(max(0.0,1.0-t1*t1-t2*t2))*Vh;return normalize(vec3(ax*Nh.x,ay*Nh.y,max(0.0,Nh.z)));}void Onb(const vec3 N,inout vec3 T,inout vec3 B){vec3 up=abs(N.z)<0.9999999 ? vec3(0,0,1): vec3(1,0,0);T=normalize(cross(up,N));B=cross(N,T);}vec3 ToLocal(const vec3 X,const vec3 Y,const vec3 Z,const vec3 V){return vec3(dot(V,X),dot(V,Y),dot(V,Z));}vec3 ToWorld(const vec3 X,const vec3 Y,const vec3 Z,const vec3 V){return V.x*X+V.y*Y+V.z*Z;}vec3 cosineSampleHemisphere(const vec3 n,const vec2 u){float r=sqrt(u.x);float theta=2.0*PI*u.y;vec3 b=normalize(cross(n,vec3(0.0,1.0,1.0)));vec3 t=cross(b,n);return normalize(r*sin(theta)*b+sqrt(1.0-u.x)*n+r*cos(theta)*t);}float equirectDirectionPdf(vec3 direction){vec2 uv=equirectDirectionToUv(direction);float theta=uv.y*PI;float sinTheta=sin(theta);if(sinTheta==0.0){return 0.0;}return 1.0/(2.0*PI*PI*sinTheta);}float sampleEquirectProbability(EquirectHdrInfo info,vec2 r,out vec3 direction){float v=textureLod(info.marginalWeights,vec2(r.x,0.0),0.).x;float u=textureLod(info.conditionalWeights,vec2(r.y,v),0.).x;vec2 uv=vec2(u,v);vec3 derivedDirection=equirectUvToDirection(uv);direction=derivedDirection;vec3 color=texture(info.map,uv).rgb;float totalSum=info.totalSumWhole+info.totalSumDecimal;float lum=luminance(color);float pdf=lum/totalSum;return info.size.x*info.size.y*pdf;}float misHeuristic(float a,float b){float aa=a*a;float bb=b*b;return aa/(aa+bb);}const float g=1.6180339887498948482;const float a1=1.0/g;float r1(float n){return fract(1.1127756842787055+a1*n);}const vec4 hn=vec4(0.618033988749895,0.3247179572447458,0.2207440846057596,0.1673039782614187);vec4 sampleBlueNoise(int seed){vec2 size=vUv*texSize;vec2 blueNoiseSize=texSize/blueNoiseRepeat;float blueNoiseIndex=floor(floor(size.y/blueNoiseSize.y)*blueNoiseRepeat.x)+floor(size.x/blueNoiseSize.x);int blueNoiseTileOffset=int(r1(blueNoiseIndex+1.0)*65536.);vec2 blueNoiseUv=vUv*blueNoiseRepeat;vec4 blueNoise=textureLod(blueNoiseTexture,blueNoiseUv,0.);blueNoise=fract(blueNoise+hn*float(seed+blueNoiseTileOffset));blueNoise.r=(blueNoise.r>0.5 ? 1.0-blueNoise.r : blueNoise.r)*2.0;blueNoise.g=(blueNoise.g>0.5 ? 1.0-blueNoise.g : blueNoise.g)*2.0;blueNoise.b=(blueNoise.b>0.5 ? 1.0-blueNoise.b : blueNoise.b)*2.0;blueNoise.a=(blueNoise.a>0.5 ? 1.0-blueNoise.a : blueNoise.a)*2.0;return blueNoise;}float getCurvature(const vec3 n,const float depth){vec3 dx=dFdx(n);vec3 dy=dFdy(n);vec3 xneg=n-dx;vec3 xpos=n+dx;vec3 yneg=n-dy;vec3 ypos=n+dy;float curvature=(cross(xneg,xpos).y-cross(yneg,ypos).x)*4.0/depth;return curvature;}"; // eslint-disable-line

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
    // eslint-disable-next-line guard-for-in
    for (const i in data) {
      data[i] = fromHalfFloat(data[i]);
    }
  }

  const marginalDataArray = new Float32Array(height);
  const conditionalDataArray = new Float32Array(width * height);
  const totalSumValue = gatherData(data, width, height, flipY, marginalDataArray, conditionalDataArray);

  if (isFloatType) {
    postMessage({
      totalSumValue,
      marginalDataArray,
      conditionalDataArray
    });
  } else {
    postMessage({
      data,
      totalSumValue,
      marginalDataArray,
      conditionalDataArray
    });
  }
};

const blob = new Blob(["onmessage = " + workerOnMessage], {
  type: "application/javascript"
});
const workerUrl = URL.createObjectURL(blob);
class EquirectHdrInfoUniform {
  constructor() {
    // Default to a white texture and associated weights so we don't
    // just render black initially.
    const whiteTex = new DataTexture(new Float32Array([1, 1, 1, 1]), 1, 1);
    whiteTex.type = FloatType;
    whiteTex.format = RGBAFormat;
    whiteTex.minFilter = LinearFilter;
    whiteTex.magFilter = LinearFilter;
    whiteTex.wrapS = RepeatWrapping;
    whiteTex.wrapT = RepeatWrapping;
    whiteTex.generateMipmaps = false;
    whiteTex.needsUpdate = true; // Stores a map of [0, 1] value -> cumulative importance row & pdf
    // used to sampling a random value to a relevant row to sample from

    const marginalWeights = new DataTexture(new Float32Array([0, 1]), 1, 2);
    marginalWeights.type = FloatType;
    marginalWeights.format = RedFormat;
    marginalWeights.minFilter = LinearFilter;
    marginalWeights.magFilter = LinearFilter;
    marginalWeights.generateMipmaps = false;
    marginalWeights.needsUpdate = true; // Stores a map of [0, 1] value -> cumulative importance column & pdf
    // used to sampling a random value to a relevant pixel to sample from

    const conditionalWeights = new DataTexture(new Float32Array([0, 0, 1, 1]), 2, 2);
    conditionalWeights.type = FloatType;
    conditionalWeights.format = RedFormat;
    conditionalWeights.minFilter = LinearFilter;
    conditionalWeights.magFilter = LinearFilter;
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
    this.mapUuid = map.uuid;
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
          data,
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

        if (data) {
          map.image.data = data;
          map.type = FloatType;
        }

        this.map = map;
        this.worker = null;
        resolve();
      };
    });
  }

}

class SSGIMaterial extends ShaderMaterial {
  constructor() {
    super({
      type: "SSGIMaterial",
      uniforms: {
        directLightTexture: new Uniform(null),
        accumulatedTexture: new Uniform(null),
        normalTexture: new Uniform(null),
        depthTexture: new Uniform(null),
        diffuseTexture: new Uniform(null),
        emissiveTexture: new Uniform(null),
        velocityTexture: new Uniform(null),
        blueNoiseTexture: new Uniform(null),
        backSideDepthTexture: new Uniform(null),
        projectionMatrix: new Uniform(new Matrix4()),
        inverseProjectionMatrix: new Uniform(new Matrix4()),
        cameraMatrixWorld: new Uniform(new Matrix4()),
        viewMatrix: new Uniform(new Matrix4()),
        cameraNear: new Uniform(0),
        cameraFar: new Uniform(0),
        rayDistance: new Uniform(0),
        thickness: new Uniform(0),
        r3Offset: new Uniform(new Vector3()),
        frame: new Uniform(0),
        envBlur: new Uniform(0),
        maxRoughness: new Uniform(0),
        maxEnvMapMipLevel: new Uniform(0),
        maxEnvLuminance: new Uniform(0),
        envMapInfo: {
          value: new EquirectHdrInfoUniform()
        },
        envMapPosition: new Uniform(new Vector3()),
        envMapSize: new Uniform(new Vector3()),
        viewMatrix: new Uniform(new Matrix4()),
        texSize: new Uniform(new Vector2()),
        blueNoiseRepeat: new Uniform(new Vector2()),
        cameraPos: new Uniform(new Vector3())
      },
      defines: {
        steps: 20,
        refineSteps: 5,
        spp: 1,
        directLightMultiplier: 1,
        CUBEUV_TEXEL_WIDTH: 0,
        CUBEUV_TEXEL_HEIGHT: 0,
        CUBEUV_MAX_MIP: 0,
        vWorldPosition: "worldPos"
      },
      fragmentShader: fragmentShader.replace("#include <utils>", ssgi_utils),
      vertexShader,
      toneMapped: false,
      depthWrite: false,
      depthTest: false,
      glslVersion: GLSL3
    });
  }

}

const backgroundColor$2 = new Color(0);
const overrideMaterial = new MeshDepthMaterial({
  depthPacking: RGBADepthPacking,
  side: BackSide
});
class BackSideDepthPass extends Pass {
  constructor(scene, camera) {
    super("BackSideDepthPass");
    this._scene = scene;
    this._camera = camera;
    this.renderTarget = new WebGLRenderTarget(1, 1, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    });
  }

  setSize(width, height) {
    this.renderTarget.setSize(width, height);
  }

  dispose() {
    super.dispose();
    this.renderTarget.dispose();
  }

  render(renderer) {
    const {
      background
    } = this._scene;
    this._scene.background = backgroundColor$2;
    this._scene.overrideMaterial = overrideMaterial;
    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this._scene, this._camera);
    this._scene.background = background;
    this._scene.overrideMaterial = null;
  }

}

var img = "data:image/png;base64,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";
  var blueNoiseImage = img;

const backgroundColor$1 = new Color(0);
class SSGIPass extends Pass {
  constructor(ssgiEffect, options) {
    super("SSGIPass");
    this.needsSwap = false;
    this.defaultFragmentShader = "";
    this.frame = 0;
    this.cachedMaterials = new WeakMap();
    this.visibleMeshes = [];
    this.ssgiEffect = ssgiEffect;
    this._scene = ssgiEffect._scene;
    this._camera = ssgiEffect._camera;
    this.fullscreenMaterial = new SSGIMaterial();
    this.defaultFragmentShader = this.fullscreenMaterial.fragmentShader;
    const bufferCount = !options.diffuseOnly && !options.specularOnly ? 2 : 1;
    this.renderTarget = new WebGLMultipleRenderTargets(1, 1, bufferCount, {
      type: HalfFloatType,
      depthBuffer: false
    }); // set up basic uniforms that we don't have to update

    this.fullscreenMaterial.uniforms.cameraMatrixWorld.value = this._camera.matrixWorld;
    this.fullscreenMaterial.uniforms.viewMatrix.value = this._camera.matrixWorldInverse;
    this.fullscreenMaterial.uniforms.projectionMatrix.value = this._camera.projectionMatrix;
    this.fullscreenMaterial.uniforms.inverseProjectionMatrix.value = this._camera.projectionMatrixInverse;
    this.fullscreenMaterial.uniforms.cameraPos.value = this._camera.position;
    if (ssgiEffect._camera.isPerspectiveCamera) this.fullscreenMaterial.defines.PERSPECTIVE_CAMERA = "";
    if (options.diffuseOnly) this.fullscreenMaterial.defines.diffuseOnly = "";
    if (options.specularOnly) this.fullscreenMaterial.defines.specularOnly = "";
    this.initMRTRenderTarget();
  }

  initialize(renderer, ...args) {
    super.initialize(renderer, ...args);
    new TextureLoader().load(blueNoiseImage, blueNoiseTexture => {
      blueNoiseTexture.minFilter = NearestFilter;
      blueNoiseTexture.magFilter = NearestFilter;
      blueNoiseTexture.wrapS = RepeatWrapping;
      blueNoiseTexture.wrapT = RepeatWrapping;
      blueNoiseTexture.encoding = LinearEncoding;
      this.fullscreenMaterial.uniforms.blueNoiseTexture.value = blueNoiseTexture;
    });
  }

  get texture() {
    return this.renderTarget.texture[0];
  }

  get specularTexture() {
    const index = "specularOnly" in this.fullscreenMaterial.defines ? 0 : 1;
    return this.renderTarget.texture[index];
  }

  initMRTRenderTarget() {
    this.gBuffersRenderTarget = new WebGLMultipleRenderTargets(1, 1, 4, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    });
    this.gBuffersRenderTarget.depthTexture = new DepthTexture(1, 1);
    this.gBuffersRenderTarget.depthTexture.type = FloatType;
    this.backSideDepthPass = new BackSideDepthPass(this._scene, this._camera);
    this.depthTexture = this.gBuffersRenderTarget.texture[0];
    this.normalTexture = this.gBuffersRenderTarget.texture[1];
    this.diffuseTexture = this.gBuffersRenderTarget.texture[2];
    this.emissiveTexture = this.gBuffersRenderTarget.texture[3];
    this.diffuseTexture.minFilter = LinearFilter;
    this.diffuseTexture.magFilter = LinearFilter;
    this.diffuseTexture.encoding = sRGBEncoding;
    this.diffuseTexture.needsUpdate = true;
    this.emissiveTexture.minFilter = LinearFilter;
    this.emissiveTexture.magFilter = LinearFilter;
    this.emissiveTexture.type = HalfFloatType;
    this.emissiveTexture.needsUpdate = true;
    this.normalTexture.type = HalfFloatType;
    this.normalTexture.needsUpdate = true;
    this.fullscreenMaterial.uniforms.normalTexture.value = this.normalTexture;
    this.fullscreenMaterial.uniforms.depthTexture.value = this.depthTexture;
    this.fullscreenMaterial.uniforms.diffuseTexture.value = this.diffuseTexture;
    this.fullscreenMaterial.uniforms.emissiveTexture.value = this.emissiveTexture;
    this.fullscreenMaterial.uniforms.backSideDepthTexture.value = this.backSideDepthPass.renderTarget.texture;
  }

  setSize(width, height) {
    this.renderTarget.setSize(width * this.ssgiEffect.resolutionScale, height * this.ssgiEffect.resolutionScale);
    this.gBuffersRenderTarget.setSize(width, height);
    this.backSideDepthPass.setSize(width, height);
    this.fullscreenMaterial.uniforms.texSize.value.set(this.renderTarget.width, this.renderTarget.height);
  }

  dispose() {
    super.dispose();
    this.renderTarget.dispose();
    this.gBuffersRenderTarget.dispose();
    this.backSideDepthPass.dispose();
    this.fullscreenMaterial.dispose();
    this.normalTexture = null;
    this.depthTexture = null;
    this.diffuseTexture = null;
    this.emissiveTexture = null;
  }

  setMRTMaterialInScene() {
    this.visibleMeshes = getVisibleChildren(this._scene);

    for (const c of this.visibleMeshes) {
      const originalMaterial = c.material;
      let [cachedOriginalMaterial, mrtMaterial] = this.cachedMaterials.get(c) || [];

      if (originalMaterial !== cachedOriginalMaterial) {
        var _c$skeleton;

        if (mrtMaterial) mrtMaterial.dispose();
        mrtMaterial = new MRTMaterial();
        copyNecessaryProps(originalMaterial, mrtMaterial);
        mrtMaterial.uniforms.normalScale.value = originalMaterial.normalScale;

        if ((_c$skeleton = c.skeleton) != null && _c$skeleton.boneTexture) {
          mrtMaterial.defines.USE_SKINNING = "";
          mrtMaterial.defines.BONE_TEXTURE = "";
          mrtMaterial.uniforms.boneTexture.value = c.skeleton.boneTexture;
          mrtMaterial.needsUpdate = true;
        }

        this.cachedMaterials.set(c, [originalMaterial, mrtMaterial]);
      }

      const textureKey = Object.keys(originalMaterial).find(key => {
        const value = originalMaterial[key];
        return value instanceof Texture && value.matrix;
      });
      if (textureKey) mrtMaterial.uniforms.uvTransform.value = originalMaterial[textureKey].matrix;
      if (originalMaterial.emissive) mrtMaterial.uniforms.emissive.value = originalMaterial.emissive;
      if (originalMaterial.color) mrtMaterial.uniforms.color.value = originalMaterial.color; // update the child's MRT material

      keepMaterialMapUpdated(mrtMaterial, originalMaterial, "normalMap", "USE_NORMALMAP", true);
      keepMaterialMapUpdated(mrtMaterial, originalMaterial, "roughnessMap", "USE_ROUGHNESSMAP", true);
      keepMaterialMapUpdated(mrtMaterial, originalMaterial, "metalnessMap", "USE_	METALNESSMAP", true);
      keepMaterialMapUpdated(mrtMaterial, originalMaterial, "map", "USE_MAP", true);
      keepMaterialMapUpdated(mrtMaterial, originalMaterial, "emissiveMap", "USE_EMISSIVEMAP", true);
      keepMaterialMapUpdated(mrtMaterial, originalMaterial, "alphaMap", "USE_ALPHAMAP", true);
      const noiseTexture = this.fullscreenMaterial.uniforms.blueNoiseTexture.value;

      if (noiseTexture) {
        const {
          width,
          height
        } = noiseTexture.source.data;
        mrtMaterial.uniforms.blueNoiseTexture.value = noiseTexture;
        mrtMaterial.uniforms.blueNoiseRepeat.value.set(this.renderTarget.width / width, this.renderTarget.height / height);
      }

      mrtMaterial.uniforms.texSize.value.set(this.renderTarget.width, this.renderTarget.height);
      mrtMaterial.uniforms.frame.value = this.frame;
      c.visible = isChildMaterialRenderable(c, originalMaterial);
      const origRoughness = typeof originalMaterial.roughness === "number" ? originalMaterial.roughness : 1;
      mrtMaterial.uniforms.roughness.value = this.ssgiEffect.selection.size === 0 || this.ssgiEffect.selection.has(c) ? origRoughness : 10e10;
      mrtMaterial.uniforms.metalness.value = c.material.metalness || 0;
      mrtMaterial.uniforms.emissiveIntensity.value = c.material.emissiveIntensity || 0;
      c.material = mrtMaterial;
    }
  }

  unsetMRTMaterialInScene() {
    for (const c of this.visibleMeshes) {
      c.visible = true; // set material back to the original one

      const [originalMaterial] = this.cachedMaterials.get(c);
      c.material = originalMaterial;
    }
  }

  render(renderer) {
    this.frame = (this.frame + this.ssgiEffect.spp) % 65536;
    const {
      background
    } = this._scene;
    this._scene.background = backgroundColor$1;
    this.setMRTMaterialInScene();
    renderer.setRenderTarget(this.gBuffersRenderTarget);
    renderer.render(this._scene, this._camera);
    this.unsetMRTMaterialInScene();
    if (this.ssgiEffect.autoThickness) this.backSideDepthPass.render(renderer); // update uniforms

    this.fullscreenMaterial.uniforms.frame.value = this.frame;
    this.fullscreenMaterial.uniforms.cameraNear.value = this._camera.near;
    this.fullscreenMaterial.uniforms.cameraFar.value = this._camera.far;
    this.fullscreenMaterial.uniforms.viewMatrix.value.copy(this._camera.matrixWorldInverse);
    this.fullscreenMaterial.uniforms.accumulatedTexture.value = this.ssgiEffect.svgf.denoisePass.texture;
    const noiseTexture = this.fullscreenMaterial.uniforms.blueNoiseTexture.value;

    if (noiseTexture) {
      const {
        width,
        height
      } = noiseTexture.source.data;
      this.fullscreenMaterial.uniforms.blueNoiseRepeat.value.set(this.renderTarget.width / width, this.renderTarget.height / height);
    }

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this.scene, this.camera);
    this._scene.background = background;
  }

}

var compose = "#define GLSLIFY 1\nuniform sampler2D inputTexture;uniform sampler2D sceneTexture;uniform sampler2D depthTexture;uniform int toneMapping;\n#include <tonemapping_pars_fragment>\n#pragma tonemapping_pars_fragment\nvoid mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){vec4 depthTexel=textureLod(depthTexture,uv,0.);vec3 ssgiClr;if(dot(depthTexel.rgb,depthTexel.rgb)==0.){ssgiClr=textureLod(sceneTexture,uv,0.).rgb;}else{ssgiClr=textureLod(inputTexture,uv,0.).rgb;switch(toneMapping){case 1:ssgiClr=LinearToneMapping(ssgiClr);break;case 2:ssgiClr=ReinhardToneMapping(ssgiClr);break;case 3:ssgiClr=OptimizedCineonToneMapping(ssgiClr);break;case 4:ssgiClr=ACESFilmicToneMapping(ssgiClr);break;case 5:ssgiClr=CustomToneMapping(ssgiClr);break;}ssgiClr*=toneMappingExposure;}outputColor=vec4(ssgiClr,1.0);}"; // eslint-disable-line

var denoise_compose = "#define GLSLIFY 1\n{vec3 viewNormal=normalize((vec4(normal,1.)*cameraMatrixWorld).xyz);roughness*=roughness;vec3 viewPos=getViewPosition(depth);vec3 viewDir=normalize(viewPos);vec3 T,B;vec3 n=viewNormal;vec3 v=viewDir;vec3 V=(vec4(v,1.)*viewMatrix).xyz;vec3 N=(vec4(n,1.)*viewMatrix).xyz;Onb(N,T,B);V=ToLocal(T,B,N,V);vec3 H=SampleGGXVNDF(V,roughness,roughness,0.25,0.25);if(H.z<0.0)H=-H;vec3 l=normalize(reflect(-V,H));l=ToWorld(T,B,N,l);l=(vec4(l,1.)*cameraMatrixWorld).xyz;l=normalize(l);if(dot(viewNormal,l)<0.)l=-l;vec3 h=normalize(v+l);float VoH=max(EPSILON,dot(v,h));VoH=pow(VoH,0.875);vec4 diffuseTexel=textureLod(diffuseTexture,vUv,0.);vec3 diffuse=diffuseTexel.rgb;float metalness=diffuseTexel.a;vec3 f0=mix(vec3(0.04),diffuse,metalness);vec3 F=F_Schlick(f0,VoH);vec3 directLight=textureLod(directLightTexture,vUv,0.).rgb;\n#ifdef ssgi\nvec3 diffuseLightingColor=denoisedColor[0];vec3 diffuseComponent=diffuse*(1.-metalness)*(1.-F)*diffuseLightingColor;vec3 specularLightingColor=denoisedColor[1];vec3 specularComponent=specularLightingColor*F;denoisedColor[0]=diffuseComponent+specularComponent;\n#endif\n#ifdef ssdgi\nvec3 diffuseLightingColor=denoisedColor[0];vec3 diffuseComponent=diffuse*(1.-metalness)*(1.-F)*diffuseLightingColor;denoisedColor[0]=diffuseComponent;\n#endif\n#ifdef ssr\nvec3 specularLightingColor=denoisedColor[0];vec3 specularComponent=specularLightingColor*F;denoisedColor[0]=specularComponent;\n#endif\n#ifdef useDirectLight\ndenoisedColor[0]+=directLight;\n#endif\n}"; // eslint-disable-line

var denoise_compose_functions = "#define GLSLIFY 1\nuniform sampler2D diffuseTexture;uniform sampler2D directLightTexture;vec3 getViewPosition(const float depth){float clipW=projectionMatrix[2][3]*depth+projectionMatrix[3][3];vec4 clipPosition=vec4((vec3(vUv,depth)-0.5)*2.0,1.0);clipPosition*=clipW;return(projectionMatrixInverse*clipPosition).xyz;}vec3 F_Schlick(const vec3 f0,const float theta){return f0+(1.-f0)*pow(1.0-theta,5.);}vec3 SampleGGXVNDF(const vec3 V,const float ax,const float ay,const float r1,const float r2){vec3 Vh=normalize(vec3(ax*V.x,ay*V.y,V.z));float lensq=Vh.x*Vh.x+Vh.y*Vh.y;vec3 T1=lensq>0. ? vec3(-Vh.y,Vh.x,0.)*inversesqrt(lensq): vec3(1.,0.,0.);vec3 T2=cross(Vh,T1);float r=sqrt(r1);float phi=2.0*PI*r2;float t1=r*cos(phi);float t2=r*sin(phi);float s=0.5*(1.0+Vh.z);t2=(1.0-s)*sqrt(1.0-t1*t1)+s*t2;vec3 Nh=t1*T1+t2*T2+sqrt(max(0.0,1.0-t1*t1-t2*t2))*Vh;return normalize(vec3(ax*Nh.x,ay*Nh.y,max(0.0,Nh.z)));}void Onb(const vec3 N,inout vec3 T,inout vec3 B){vec3 up=abs(N.z)<0.9999999 ? vec3(0,0,1): vec3(1,0,0);T=normalize(cross(up,N));B=cross(N,T);}vec3 ToLocal(const vec3 X,const vec3 Y,const vec3 Z,const vec3 V){return vec3(dot(V,X),dot(V,Y),dot(V,Z));}vec3 ToWorld(const vec3 X,const vec3 Y,const vec3 Z,const vec3 V){return V.x*X+V.y*Y+V.z*Z;}"; // eslint-disable-line

/**
* Options of the SSGI effect
* @typedef {Object} SSGIOptions
* @property {Number} [distance] maximum distance a SSGI ray can travel to find what it reflects
* @property {Number} [thickness] maximum depth difference between a ray and the particular depth at its screen position before refining with binary search; higher values will result in better performance
* @property {Number} [autoThickness] whether to use a back-side depth buffer to approximate the actual thickness; enabling this may decrease performance; the thickness parameter will also be used as the minimum value
* @property {Number} [maxRoughness] maximum roughness a texel can have to have SSGI calculated for it
* @property {Number} [blend] a value between 0 and 1 to set how much the last frame's SSGI should be blended in; higher values will result in less noisy SSGI when moving the camera but a more smeary look
* @property {Number} [denoiseIterations] how many times the denoise filter runs, more iterations will denoise the frame better but need more performance
* @property {Number} [denoiseKernel] the kernel (~ number of neighboring pixels) to take into account when denoising a pixel
* @property {Number} [denoiseDiffuse] diffuse luminance factor of the denoiser, higher values will denoise areas with varying luminance more aggressively
* @property {Number} [denoiseSpecular] specular luminance factor of the denoiser, higher values will denoise areas with varying luminance more aggressively
* @property {Number} [depthPhi] depth factor of the denoiser, higher values will use neighboring areas with different depth values more resulting in less noise but loss of details
* @property {Number} [depthPhi] normals factor of the denoiser, higher values will use neighboring areas with different normals more resulting in less noise but loss of details and sharpness
* @property {Number} [roughnessPhi] roughness factor of the denoiser setting how much the denoiser should only apply the blur to rougher surfaces, a value of 0 means the denoiser will blur mirror-like surfaces the same as rough surfaces
* @property {Number} [directLightMultiplier] how much to boost direct lighting
* @property {Number} [envBlur] higher values will result in lower mipmaps being sampled which will cause less noise but also less detail regarding environment lighting
* @property {Number} [importanceSampling] whether to use importance sampling for the environment map
* @property {Number} [maxEnvLuminance] the maximum luminance by which the environment lighting will be clamped; used to reduce noise from sharp light sources such as the sun
* @property {Number} [steps] number of steps a SSGI ray can maximally do to find an object it intersected (and thus reflects)
* @property {Number} [refineSteps] once we had our ray intersect something, we need to find the exact point in space it intersected and thus it reflects; this can be done through binary search with the given number of maximum steps
* @property {Number} [spp] number of samples per pixel
* @property {boolean} [missedRays] if there should still be SSGI for rays for which a reflecting point couldn't be found; enabling this will result in stretched looking SSGI which can look good or bad depending on the angle
* @property {Number} [resolutionScale] resolution of the SSGI effect, a resolution of 0.5 means the effect will be rendered at half resolution
*/

/**
 * The options of the SSGI effect
 * @type {SSGIOptions}
 */
const defaultSSGIOptions = {
  distance: 10,
  thickness: 10,
  autoThickness: false,
  maxRoughness: 1,
  blend: 0.9,
  denoiseIterations: 1,
  denoiseKernel: 2,
  denoiseDiffuse: 10,
  denoiseSpecular: 10,
  depthPhi: 2,
  normalPhi: 50,
  roughnessPhi: 1,
  envBlur: 0.5,
  importanceSampling: true,
  directLightMultiplier: 1,
  maxEnvLuminance: 50,
  steps: 20,
  refineSteps: 5,
  spp: 1,
  resolutionScale: 1,
  missedRays: false
};

/* eslint-disable camelcase */
const {
  render
} = RenderPass.prototype;
const globalIblIrradianceDisabledUniform = createGlobalDisableIblIradianceUniform();
const globalIblRadianceDisabledUniform = createGlobalDisableIblRadianceUniform();
class SSGIEffect extends Effect {
  /**
   * @param {THREE.Scene} scene The scene of the SSGI effect
   * @param {THREE.Camera} camera The camera with which SSGI is being rendered
   * @param {velocityDepthNormalPass} velocityDepthNormalPass Required velocity pass
   * @param {SSGIOptions} [options] The optional options for the SSGI effect
   */
  constructor(scene, camera, velocityDepthNormalPass, options = defaultSSGIOptions) {
    options = { ...defaultSSGIOptions,
      ...options
    };
    super("SSGIEffect", compose, {
      type: "FinalSSGIMaterial",
      uniforms: new Map([["inputTexture", new Uniform(null)], ["sceneTexture", new Uniform(null)], ["depthTexture", new Uniform(null)], ["toneMapping", new Uniform(NoToneMapping)]])
    });
    this.selection = new Selection();
    this.isUsingRenderPass = true;
    this._scene = scene;
    this._camera = camera;
    let definesName;

    if (options.diffuseOnly) {
      definesName = "ssdgi";
      options.reprojectSpecular = false;
      options.roughnessDependent = false;
      options.basicVariance = 0.00025;
      options.neighborhoodClamping = false;
    } else if (options.specularOnly) {
      definesName = "ssr";
      options.reprojectSpecular = true;
      options.roughnessDependent = true;
      options.basicVariance = 0.00025;
      options.neighborhoodClamping = true;
    } else {
      definesName = "ssgi";
      options.reprojectSpecular = [false, true];
      options.neighborhoodClamping = [false, true];
      options.roughnessDependent = [false, true];
      options.basicVariance = [0.00025, 0.00025];
    }

    const textureCount = options.diffuseOnly || options.specularOnly ? 1 : 2;
    this.svgf = new SVGF(scene, camera, velocityDepthNormalPass, textureCount, denoise_compose, denoise_compose_functions, options);

    if (definesName === "ssgi") {
      this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.fragmentShader = this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.fragmentShader.replace("accumulatedTexel[ 1 ].rgb = clampedColor;", `
						float roughness = inputTexel[ 0 ].a;
						accumulatedTexel[ 1 ].rgb = mix(accumulatedTexel[ 1 ].rgb, clampedColor, 1. - sqrt(roughness));
						`);
    } else if (definesName === "ssr") {
      this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.fragmentShader = this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.fragmentShader.replace("accumulatedTexel[ 0 ].rgb = clampedColor;", `
					accumulatedTexel[ 0 ].rgb = mix(accumulatedTexel[ 0 ].rgb, clampedColor, 0.5);
					`);
    }

    this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.needsUpdate = true; // ssgi pass

    this.ssgiPass = new SSGIPass(this, options);

    if (options.diffuseOnly) {
      this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.uniforms.inputTexture0.value = this.ssgiPass.texture;
    } else if (options.specularOnly) {
      this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.uniforms.inputTexture0.value = this.ssgiPass.specularTexture;
    } else {
      this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.uniforms.inputTexture0.value = this.ssgiPass.texture;
      this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.uniforms.inputTexture1.value = this.ssgiPass.specularTexture;
    }

    this.svgf.setJitteredGBuffers(this.ssgiPass.depthTexture, this.ssgiPass.normalTexture); // patch the denoise pass

    this.svgf.denoisePass.fullscreenMaterial.uniforms = { ...this.svgf.denoisePass.fullscreenMaterial.uniforms,
      ...{
        diffuseTexture: new Uniform(null),
        directLightTexture: new Uniform(null)
      }
    };
    this.svgf.denoisePass.fullscreenMaterial.defines[definesName] = "";
    this.ssgiPass.fullscreenMaterial.defines.directLightMultiplier = options.directLightMultiplier.toPrecision(5);
    this.svgf.denoisePass.fullscreenMaterial.uniforms.diffuseTexture.value = this.ssgiPass.diffuseTexture;
    this.lastSize = {
      width: options.width,
      height: options.height,
      resolutionScale: options.resolutionScale
    };
    this.sceneRenderTarget = new WebGLRenderTarget(1, 1, {
      encoding: sRGBEncoding
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
  }

  updateUsingRenderPass() {
    if (this.isUsingRenderPass) {
      this.ssgiPass.fullscreenMaterial.defines.useDirectLight = "";
      this.svgf.denoisePass.fullscreenMaterial.defines.useDirectLight = "";
    } else {
      delete this.ssgiPass.fullscreenMaterial.defines.useDirectLight;
      delete this.svgf.denoisePass.fullscreenMaterial.defines.useDirectLight;
    }

    this.ssgiPass.fullscreenMaterial.needsUpdate = true;
    this.svgf.denoisePass.fullscreenMaterial.needsUpdate = true;
  }

  makeOptionsReactive(options) {
    let needsUpdate = false;
    const ssgiPassFullscreenMaterialUniforms = this.ssgiPass.fullscreenMaterial.uniforms;
    const ssgiPassFullscreenMaterialUniformsKeys = Object.keys(ssgiPassFullscreenMaterialUniforms);
    const temporalReprojectPass = this.svgf.svgfTemporalReprojectPass;

    for (const key of Object.keys(options)) {
      Object.defineProperty(this, key, {
        get() {
          return options[key];
        },

        set(value) {
          if (options[key] === value && needsUpdate) return;
          options[key] = value;

          switch (key) {
            // denoiser
            case "denoiseIterations":
              this.svgf.denoisePass.iterations = value;
              break;

            case "denoiseDiffuse":
              this.svgf.denoisePass.fullscreenMaterial.uniforms.denoise.value[0] = value;
              break;

            case "denoiseSpecular":
              this.svgf.denoisePass.fullscreenMaterial.uniforms.denoise.value[1] = value;
              break;

            case "denoiseKernel":
            case "depthPhi":
            case "normalPhi":
            case "roughnessPhi":
              this.svgf.denoisePass.fullscreenMaterial.uniforms[key].value = value;
              break;
            // SSGI

            case "resolutionScale":
              this.setSize(this.lastSize.width, this.lastSize.height);
              temporalReprojectPass.reset();
              break;
            // defines

            case "spp":
              this.ssgiPass.fullscreenMaterial.fragmentShader = this.ssgiPass.defaultFragmentShader.replaceAll("spp", value);

              if (value !== 1) {
                this.ssgiPass.fullscreenMaterial.fragmentShader = unrollLoops(this.ssgiPass.fullscreenMaterial.fragmentShader.replace("#pragma unroll_loop_start", "").replace("#pragma unroll_loop_end", ""));
              }

              this.ssgiPass.fullscreenMaterial.needsUpdate = needsUpdate;
              temporalReprojectPass.reset();
              break;

            case "steps":
            case "refineSteps":
              this.ssgiPass.fullscreenMaterial.defines[key] = parseInt(value);
              this.ssgiPass.fullscreenMaterial.needsUpdate = needsUpdate;
              temporalReprojectPass.reset();
              break;

            case "importanceSampling":
            case "missedRays":
            case "autoThickness":
              if (value) {
                this.ssgiPass.fullscreenMaterial.defines[key] = "";
              } else {
                delete this.ssgiPass.fullscreenMaterial.defines[key];
              }

              this.ssgiPass.fullscreenMaterial.needsUpdate = needsUpdate;
              temporalReprojectPass.reset();
              break;

            case "blend":
              this.svgf.svgfTemporalReprojectPass.fullscreenMaterial.uniforms[key].value = value;
              temporalReprojectPass.reset();
              break;

            case "distance":
              ssgiPassFullscreenMaterialUniforms.rayDistance.value = value;
              temporalReprojectPass.reset();
              break;
            // must be a uniform

            default:
              if (ssgiPassFullscreenMaterialUniformsKeys.includes(key)) {
                ssgiPassFullscreenMaterialUniforms[key].value = value;
                temporalReprojectPass.reset();
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
    if (width === undefined && height === undefined) return;
    if (!force && width === this.lastSize.width && height === this.lastSize.height && this.resolutionScale === this.lastSize.resolutionScale) return;
    this.ssgiPass.setSize(width, height);
    this.svgf.setSize(width, height);
    this.sceneRenderTarget.setSize(width, height);
    this.lastSize = {
      width,
      height,
      resolutionScale: this.resolutionScale
    };
  }

  dispose() {
    super.dispose();
    this.ssgiPass.dispose();
    this.svgf.dispose();
    RenderPass.prototype.render = render;
  }

  keepEnvMapUpdated() {
    const ssgiMaterial = this.ssgiPass.fullscreenMaterial;

    if (this._scene.environment && ssgiMaterial.uniforms.envMapInfo.value.mapUuid !== this._scene.environment.uuid) {
      var _this$_scene$environm;

      if (((_this$_scene$environm = this._scene.environment) == null ? void 0 : _this$_scene$environm.mapping) === EquirectangularReflectionMapping) {
        if (!this._scene.environment.generateMipmaps) {
          this._scene.environment.generateMipmaps = true;
          this._scene.environment.minFilter = LinearMipMapLinearFilter;
          this._scene.environment.magFilter = LinearMipMapLinearFilter;
          this._scene.environment.needsUpdate = true;
        }

        const maxEnvMapMipLevel = getMaxMipLevel(this._scene.environment);
        ssgiMaterial.uniforms.maxEnvMapMipLevel.value = maxEnvMapMipLevel;
        ssgiMaterial.uniforms.envMapInfo.value.map = this._scene.environment;
        ssgiMaterial.defines.USE_ENVMAP = "";
        delete ssgiMaterial.defines.importanceSampling;

        if (this.importanceSampling) {
          ssgiMaterial.uniforms.envMapInfo.value.updateFrom(this._scene.environment).then(() => {
            ssgiMaterial.defines.importanceSampling = "";
            ssgiMaterial.needsUpdate = true;
          });
        } else {
          ssgiMaterial.uniforms.envMapInfo.value.map = this._scene.environment;
        }
      } else {
        delete ssgiMaterial.defines.USE_ENVMAP;
        delete ssgiMaterial.defines.importanceSampling;
      }

      this.svgf.svgfTemporalReprojectPass.reset();
      ssgiMaterial.needsUpdate = true;
    }
  }

  update(renderer, inputBuffer) {
    // ! todo: make SSGI's accumulation no longer FPS-dependent
    this.keepEnvMapUpdated();
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
    this.svgf.denoisePass.fullscreenMaterial.uniforms.directLightTexture.value = sceneBuffer.texture;
    this.ssgiPass.render(renderer);
    this.svgf.render(renderer);
    this.uniforms.get("inputTexture").value = this.svgf.texture;
    this.uniforms.get("sceneTexture").value = sceneBuffer.texture;
    this.uniforms.get("depthTexture").value = this.ssgiPass.depthTexture;
    this.uniforms.get("toneMapping").value = renderer.toneMapping;

    for (const c of hideMeshes) c.visible = true;

    const fullGi = !this.diffuseOnly && !this.specularOnly;
    globalIblIrradianceDisabledUniform.value = fullGi || this.diffuseOnly === true;
    globalIblRadianceDisabledUniform.value = fullGi || this.specularOnly == true;
    cancelAnimationFrame(this.rAF2);
    cancelAnimationFrame(this.rAF);
    cancelAnimationFrame(this.usingRenderPassRAF);
    this.rAF = requestAnimationFrame(() => {
      this.rAF2 = requestAnimationFrame(() => {
        globalIblIrradianceDisabledUniform.value = false;
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
  constructor(scene, camera, velocityDepthNormalPass, options = defaultSSGIOptions) {
    options = { ...defaultSSGIOptions,
      ...options
    };
    options.specularOnly = true;
    super(scene, camera, velocityDepthNormalPass, options);
  }

}

class SSDGIEffect extends SSGIEffect {
  constructor(scene, camera, velocityDepthNormalPass, options = defaultSSGIOptions) {
    options = { ...defaultSSGIOptions,
      ...options
    };
    options.diffuseOnly = true;
    super(scene, camera, velocityDepthNormalPass, options);
  }

}

var motion_blur = "#define GLSLIFY 1\nuniform sampler2D inputTexture;uniform sampler2D velocityTexture;uniform sampler2D blueNoiseTexture;uniform ivec2 blueNoiseSize;uniform vec2 texSize;uniform float intensity;uniform float jitter;uniform float deltaTime;uniform int frame;uvec4 s0,s1;ivec2 pixel;void rng_initialize(vec2 p,int frame){pixel=ivec2(p);s0=uvec4(p,uint(frame),uint(p.x)+uint(p.y));s1=uvec4(frame,frame*15843,frame*31+4566,frame*2345+58585);}void pcg4d(inout uvec4 v){v=v*1664525u+1013904223u;v.x+=v.y*v.w;v.y+=v.z*v.x;v.z+=v.x*v.y;v.w+=v.y*v.z;v=v ^(v>>16u);v.x+=v.y*v.w;v.y+=v.z*v.x;v.z+=v.x*v.y;v.w+=v.y*v.z;}ivec2 shift2(){pcg4d(s1);return(pixel+ivec2(s1.xy % 0x0fffffffu))% blueNoiseSize;}void mainImage(const in vec4 inputColor,const in vec2 uv,out vec4 outputColor){vec4 velocity=textureLod(velocityTexture,vUv,0.0);if(dot(velocity.xyz,velocity.xyz)==0.0){outputColor=inputColor;return;}velocity.xy*=intensity;rng_initialize(vUv*texSize,frame);vec2 blueNoise=texelFetch(blueNoiseTexture,shift2(),0).rg-0.5;vec2 jitterOffset=jitter*velocity.xy*blueNoise;float frameSpeed=(1./100.)/deltaTime;vec2 startUv=vUv+(jitterOffset-velocity.xy*0.5)*frameSpeed;vec2 endUv=vUv+(jitterOffset+velocity.xy*0.5)*frameSpeed;startUv=max(vec2(0.),startUv);endUv=min(vec2(1.),endUv);vec3 motionBlurredColor;for(float i=0.0;i<=samplesFloat;i++){vec2 reprojectedUv=mix(startUv,endUv,i/samplesFloat);vec3 neighborColor=textureLod(inputTexture,reprojectedUv,0.0).rgb;motionBlurredColor+=neighborColor;}motionBlurredColor/=samplesFloat;outputColor=vec4(motionBlurredColor,inputColor.a);}"; // eslint-disable-line

/* eslint-disable camelcase */
// http://john-chapman-graphics.blogspot.com/2013/01/per-object-motion-blur.html
// reference code: https://github.com/gkjohnson/threejs-sandbox/blob/master/motionBlurPass/src/CompositeShader.js

const defaultOptions = {
  intensity: 1,
  jitter: 1,
  samples: 16
};
class MotionBlurEffect extends Effect {
  constructor(velocityPass, options = defaultOptions) {
    options = { ...defaultOptions,
      ...options
    };
    super("MotionBlurEffect", motion_blur, {
      type: "MotionBlurMaterial",
      uniforms: new Map([["inputTexture", new Uniform(null)], ["velocityTexture", new Uniform(velocityPass.texture)], ["blueNoiseTexture", new Uniform(null)], ["blueNoiseSize", new Uniform(new Vector2())], ["texSize", new Uniform(new Vector2())], ["intensity", new Uniform(1)], ["jitter", new Uniform(1)], ["frame", new Uniform(0)], ["deltaTime", new Uniform(0)]]),
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
      blueNoiseTexture.encoding = LinearEncoding;
      this.uniforms.get("blueNoiseTexture").value = blueNoiseTexture;
    });
  }

  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get("inputTexture").value = inputBuffer.texture;
    this.uniforms.get("deltaTime").value = Math.max(1 / 1000, deltaTime);
    const frame = renderer.info.render.frame % 65536;
    this.uniforms.get("frame").value = frame;
    this.uniforms.get("texSize").value.set(window.innerWidth, window.innerHeight);
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

#ifdef renderDepthNormal
varying vec2 vHighPrecisionZW;
#endif
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

#ifdef renderDepthNormal
vHighPrecisionZW = gl_Position.zw;
#endif
`;
const velocity_fragment_pars =
/* glsl */
`
varying vec4 prevPosition;
varying vec4 newPosition;

#ifdef renderDepthNormal
varying vec2 vHighPrecisionZW;
#endif
`;
const velocity_fragment_main =
/* glsl */
`
vec2 pos0 = (prevPosition.xy / prevPosition.w) * 0.5 + 0.5;
vec2 pos1 = (newPosition.xy / newPosition.w) * 0.5 + 0.5;

vec2 vel = pos1 - pos0;

#ifdef renderDepthNormal
float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
#endif

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
    value: new Vector2()
  },
  uvTransform: {
    value: new Matrix3()
  }
};
class VelocityDepthNormalMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: UniformsUtils.clone(velocity_uniforms),
      glslVersion: GLSL3,
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

					#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
						varying vec3 vViewPosition;
					#endif
					
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

						#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
							vViewPosition = - mvPosition.xyz;
						#endif

                    }`,
      fragmentShader:
      /* glsl */
      `
					#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( TANGENTSPACE_NORMALMAP )
						varying vec3 vViewPosition;
					#endif

					#ifdef renderDepthNormal
					layout(location = 0) out vec4 gDepth;
					layout(location = 1) out vec4 gVelocity;
					#else
					#define gVelocity gl_FragColor
					#endif

					${velocity_fragment_pars}
					#include <packing>

					#include <uv_pars_fragment>
					#include <normal_pars_fragment>

					// source: https://knarkowicz.wordpress.com/2014/04/16/octahedron-normal-vector-encoding/
					vec2 OctWrap( vec2 v ) {
						vec2 w = 1.0 - abs( v.yx );
						if (v.x < 0.0) w.x = -w.x;
						if (v.y < 0.0) w.y = -w.y;
						return w;
					}

					vec2 Encode( vec3 n ) {
						n /= ( abs( n.x ) + abs( n.y ) + abs( n.z ) );
						n.xy = n.z > 0.0 ? n.xy : OctWrap( n.xy );
						n.xy = n.xy * 0.5 + 0.5;
						return n.xy;
					}

                    void main() {
						#include <normal_fragment_begin>
                    	#include <normal_fragment_maps>

						${velocity_fragment_main.replaceAll("gl_FragColor", "gVelocity")}
						vec3 worldNormal = normalize((vec4(normal, 1.) * viewMatrix).xyz);
						gVelocity.ba = Encode(worldNormal);

						#ifdef renderDepthNormal
						gDepth = packDepthToRGBA(fragCoordZ);
						#endif
                    }`
    });
    this.isVelocityMaterial = true;
  }

}

const backgroundColor = new Color(0);
const zeroVec2 = new Vector2();
const tmpProjectionMatrix = new Matrix4();
const tmpProjectionMatrixInverse = new Matrix4();
class VelocityDepthNormalPass extends Pass {
  constructor(scene, camera, renderDepthNormal = true) {
    super("velocityDepthNormalPass");
    this.cachedMaterials = new WeakMap();
    this.visibleMeshes = [];
    this.needsSwap = false;
    this._scene = scene;
    this._camera = camera;
    const bufferCount = renderDepthNormal ? 2 : 1;
    this.renderTarget = new WebGLMultipleRenderTargets(1, 1, bufferCount, {
      minFilter: NearestFilter,
      magFilter: NearestFilter
    });
    this.renderTarget.depthTexture = new DepthTexture(1, 1);
    this.renderTarget.depthTexture.type = FloatType;

    if (renderDepthNormal) {
      this.renderTarget.texture[0].type = UnsignedByteType;
      this.renderTarget.texture[0].needsUpdate = true;
      this.renderTarget.texture[1].type = FloatType;
      this.renderTarget.texture[1].needsUpdate = true;
    }

    this.renderDepthNormal = renderDepthNormal;
  }

  setVelocityDepthNormalMaterialInScene() {
    this.visibleMeshes = getVisibleChildren(this._scene);

    for (const c of this.visibleMeshes) {
      const originalMaterial = c.material;
      let [cachedOriginalMaterial, velocityDepthNormalMaterial] = this.cachedMaterials.get(c) || [];

      if (originalMaterial !== cachedOriginalMaterial) {
        var _c$skeleton;

        velocityDepthNormalMaterial = new VelocityDepthNormalMaterial();
        copyNecessaryProps(originalMaterial, velocityDepthNormalMaterial);
        c.material = velocityDepthNormalMaterial;
        if ((_c$skeleton = c.skeleton) != null && _c$skeleton.boneTexture) saveBoneTexture(c);
        this.cachedMaterials.set(c, [originalMaterial, velocityDepthNormalMaterial]);
      }

      c.material = velocityDepthNormalMaterial;
      c.visible = isChildMaterialRenderable(c, originalMaterial);
      if (this.renderDepthNormal) velocityDepthNormalMaterial.defines.renderDepthNormal = "";
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
    var _this$lastDepthTextur;

    this.renderTarget.setSize(width, height);
    (_this$lastDepthTextur = this.lastDepthTexture) == null ? void 0 : _this$lastDepthTextur.dispose();
    this.lastDepthTexture = new FramebufferTexture(width, height, RGBAFormat);
    this.lastDepthTexture.minFilter = NearestFilter;
    this.lastDepthTexture.magFilter = NearestFilter;
  }

  dispose() {
    super.dispose();
    this.renderTarget.dispose();
  }

  get texture() {
    return Array.isArray(this.renderTarget.texture) ? this.renderTarget.texture[1] : this.renderTarget.texture;
  }

  get depthTexture() {
    return this.renderTarget.texture[0];
  }

  render(renderer) {
    tmpProjectionMatrix.copy(this._camera.projectionMatrix);
    tmpProjectionMatrixInverse.copy(this._camera.projectionMatrixInverse);
    if (this._camera.view) this._camera.view.enabled = false;

    this._camera.updateProjectionMatrix();

    this.setVelocityDepthNormalMaterialInScene();
    const {
      background
    } = this._scene;
    this._scene.background = backgroundColor;
    renderer.setRenderTarget(this.renderTarget);
    renderer.copyFramebufferToTexture(zeroVec2, this.lastDepthTexture);
    renderer.render(this._scene, this._camera);
    this._scene.background = background;
    this.unsetVelocityDepthNormalMaterialInScene();
    if (this._camera.view) this._camera.view.enabled = true;

    this._camera.projectionMatrix.copy(tmpProjectionMatrix);

    this._camera.projectionMatrixInverse.copy(tmpProjectionMatrixInverse);
  }

}

class VelocityPass extends VelocityDepthNormalPass {
  constructor(scene, camera) {
    super(scene, camera, false);
  }

}

export { MotionBlurEffect, SSDGIEffect, SSGIEffect, SSREffect, SVGF, TRAAEffect, TemporalReprojectPass, VelocityDepthNormalPass, VelocityPass };
