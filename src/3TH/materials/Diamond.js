import {
	MeshPhysicalMaterial, MeshStandardMaterial, ShaderMaterial, WebGLCubeRenderTarget, CubeCamera, Scene, Mesh, RGBAFormat,
	DoubleSide, Color, Vector3, BackSide, LinearMipmapLinearFilter
} from 'three';

import { Shader } from '../Shader.js';
//import { Main } from '../../Main.js';


export class Diamond extends MeshPhysicalMaterial {

	constructor( o = {}, extra = {} ) {

		o.metalness = 0;
		o.roughness = 0;

        o.clearcoat = 1;
        //o.clearcoatRoughness = 0.01

        o.iridescenceIOR = 2.33;
        o.iridescence = 1;

        //o.flatShading = true


        
		
		//o.side = DoubleSide
		
		//o.envMapIntensity = 1
        o.reflectivity = 1.0;
        o.envMapIntensity = 1.3;
        //o.iridescence = 1.0
        //o.ior=1.7

        //o.transparent = true
        //o.opacity = 0.9


        //o.transmission = 1
        //o.thickness = 2.5

        //o.depthTest = false
        //o.depthWrite = false
		//o.premultipliedAlpha = true
        //o.alphaToCoverage = true

        /*o.polygonOffset = true
        o.polygonOffsetFactor = 1
        o.polygonOffsetUnits = 4.0*/

		super( o )

        this.normal = this.cubeNormal( extra );

        //this.color.convertSRGBToLinear();

		this.onBeforeCompile = function ( shader ) {

			var uniforms = shader.uniforms;
			uniforms[ "normalCube" ] = { value: this.normal.texture };
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
			uniforms[ "correction" ] = { value: new Color( o.color || 0xFFFFFF ) };
			uniforms[ "boost" ] = { value: new Color(.892, .892, .98595025) };

			uniforms[ "radius" ] = { value: 1.5 };
			uniforms[ "centreOffset" ] = { value: new Vector3(0, 0, 0) };

			shader.uniforms = uniforms;

			//shader.uniforms.reflectif = this.userData.reflectif;

			var vertex = shader.vertexShader;
			vertex = vertex.replace( 'varying vec3 vViewPosition;', Shader.getGl2() ? vertAdd : inverse+vertAdd  );
			vertex = vertex.replace( '#include <fog_vertex>', vertMainAdd );
			shader.vertexShader = vertex;

			//console.log(vertex)

			var fragment = shader.fragmentShader;
			fragment = fragment.replace( 'void main() {', fragAdd );
			//fragment = fragment.replace( 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );', fragMainAdd );
            //fragment = fragment.replace( '#include <output_fragment>', '#include <output_fragment>' + fragMainAdd );
            fragment = fragment.replace( '#include <opaque_fragment>', '#include <opaque_fragment>' + fragMainAdd );

			shader.fragmentShader = fragment;

			Shader.modify( shader );

		}

	}

	cubeNormal ( o = {} ){

        let target = new WebGLCubeRenderTarget( 1024, { format:RGBAFormat/*, anisotropy:1, generateMipmaps:false, minFilter:LinearMipmapLinearFilter*/ });

        //console.log(target)

        let camera = new CubeCamera( 0.01, 10, target );
        let scene = new Scene();
        scene.add( camera );

        let normal = new ShaderMaterial({
            vertexShader: ["varying vec3 vNormalm;", "void main() {", "vNormalm = normal;", "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );", "}"].join("\n"),
            fragmentShader: ["varying vec3 vNormalm;", "void main() {", "vec3 color = normalize(vNormalm);", "color = color * 0.5 + 0.5;", "gl_FragColor = vec4( color.xyz, 1.0 );", "}"].join("\n"),
            side: BackSide
        });

        //console.log(normal)

        let m = new Mesh( o.geometry, normal );
        m.scale.set(10,10,10);
        m.frustumCulled = false;
        m.geometry.center();
        scene.add( m );

        camera.update( Shader.renderer, scene );

        scene.remove( m );
        scene.remove( camera );

        m.material.dispose();
        m.geometry.dispose();

        return target;

    }

    dispose() {
        this.normal.dispose()
        this.dispatchEvent( { type: 'dispose' } );
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

varying vec3 worldNormal;
varying vec3 vecPos;
//varying vec3 vEye;
varying vec3 vI;
`;

const vertMainAdd =/* glsl */`
#include <fog_vertex>

modelMatrixOn = modelMatrix;
invMat = inverse( modelMatrix );
vecPos = worldPosition.xyz;//(modelMatrix * vec4(position, 1.0 )).xyz;
//worldNormal = (modelMatrix * vec4(normal,0.0)).xyz;
worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
//vEye = normalize(-cameraPosition);
vI = normalize( worldPosition.xyz - cameraPosition );//vecPos - cameraPosition;

`;

const fragMainAdd =/* glsl */`
#ifdef USE_ENVMAP
float vReflectionFactor = mFresnelBias + mFresnelScale * pow( abs((1.0 + dot( normalize( vI ), vNormal ))), mFresnelPower );

vec3 refractedColor = traceRayTest( vecPos, vI, normalize( worldNormal ) );

vec3 finalColor = mix( refractedColor, refractedColor*outgoingLight, clamp( vReflectionFactor, 0.0, 1.0 ) );
//vec3 finalColor = outgoingLight * refractedColor;
gl_FragColor = vec4( finalColor, diffuseColor.a);
//reflectedColor.rgb = textureCube( envMap, vec3( -vReflect.x, vReflect.yz ) ).rgb;
#endif

`;

const fragAdd =/* glsl */`

#define RAY_BOUNCES 5

varying mat4 invMat;
varying mat4 modelMatrixOn;
varying vec3 worldNormal;
varying vec3 vecPos;
//varying vec3 vEye;
varying vec3 vI;

uniform samplerCube normalCube;
uniform bool bDebugBounces;

uniform float mFresnelBias;
uniform float mFresnelScale;
uniform float mFresnelPower;

uniform float refraction;
uniform float aberration;

uniform float normalOffset;
uniform float squashFactor;
uniform float distanceOffset;
uniform float geometryFactor;

uniform vec3 absorbption;
uniform vec3 correction;
uniform vec3 boost;

uniform float radius;
uniform vec3 centreOffset;

#ifdef USE_ENVMAP

vec3 BRDF_Specular_GGX_EnvironmentTest( const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float roughness ) {
    float dotNV = abs( dot( normal, viewDir ) );
    const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
    const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
    vec4 r = roughness * c0 + c1; 
    float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
    vec2 AB = vec2( -1.04, 1.04 ) * a004 + r.zw;
    return specularColor * AB.x + AB.y;
}

vec4 SampleSpecularReflectionTest( vec4 specularColor, vec3 direction ) {
    direction.x *= -1.0;
    direction.z *= -1.0;
    vec4 sampleColorRGB = envMapIntensity * textureCubeUV( envMap, direction, 0.0 );
    sampleColorRGB = clamp( sampleColorRGB, 0.0, 1.0);
    return sampleColorRGB;
}

vec4 SampleSpecularContributionTest( vec4 specularColor, vec3 direction ) { 
    direction = normalize(direction);
    direction.x *= -1.0; 
    direction.z *= -1.0;
    vec4 sampleColorRGB = envMapIntensity * textureCubeUV( envMap, direction, 0.0 );

    //sampleColorRGB.a = 1.0;

    sampleColorRGB = clamp( sampleColorRGB, 0.0, 1.0);
    return sampleColorRGB;
}

vec3 intersectSphereTest( vec3 origin, vec3 direction ) {
    origin -= centreOffset;
    direction.y /= squashFactor;
    float A = dot(direction, direction);
    float B = 2.0*dot(origin, direction);
    float C = dot(origin, origin) - radius * radius;
    float disc = B*B - 4.0 * A * C;
    if(disc > 0.0){ 
        disc = sqrt(disc);
        float t1 = (-B + disc)*geometryFactor/A;
        float t2 = (-B - disc)*geometryFactor/A;
        float t = (t1 > t2) ? t1 : t2;
        direction.y *= squashFactor;
        return vec3(origin + centreOffset + direction * t);
     }
     return vec3(0.0); 
}

vec3 debugBounces( int count ) { 
    vec3 color = vec3(1.,1.,1.);
    if(count == 1) color = vec3(0.0,1.0,0.0);
    else if(count == 2) color = vec3(0.0,0.0,1.0);
    else if(count == 3) color = vec3(1.0,1.0,0.0);
    else if(count == 4) color = vec3(0.0,1.0,1.0);
    else color = vec3(0.0,1.0,0.0); 
    if(count == 0) color = vec3(1.0,0.0,0.0);
    return color;
}

vec3 traceRayTest( vec3 origin, vec3 direction, vec3 normal ) { 

    mat4 invModelMat = invMat;

    vec3 outColor = vec3(0.0); 
    // Reflect/Refract ray entering the diamond 
    const float n1 = 1.0; 
    const float epsilon = 1e-8;
    float f0 = (2.4- n1)/(2.4 + n1);
    f0 *= f0;
    vec3 attenuationFactor = vec3(1.0);
    vec3 newDirection = refract( direction, normal, n1/refraction ); 
    vec3 reflectedDirection = reflect(direction, normal);
    vec3 brdfReflected = BRDF_Specular_GGX_EnvironmentTest(reflectedDirection, normal, vec3(f0), 0.0);
    vec3 brdfRefracted = BRDF_Specular_GGX_EnvironmentTest(newDirection, -normal, vec3(f0), 0.0);
    attenuationFactor *= ( vec3(1.0) - brdfRefracted);
    outColor += SampleSpecularReflectionTest(vec4(1.0), reflectedDirection ).rgb * brdfReflected;
    int count = 0;

    newDirection = (invModelMat * vec4(newDirection, 0.0)).xyz; 
    newDirection = normalize(newDirection);
    origin = (invModelMat * vec4(origin, 1.0)).xyz;

    // ray bounces 
    for( int i=0; i<RAY_BOUNCES; i++) { 

        vec3 intersectedPos = intersectSphereTest(origin + vec3(epsilon), newDirection);
        vec3 dist = intersectedPos - origin;
        vec3 d = normalize(intersectedPos - centreOffset);
        vec3 mappedNormal = textureCube( normalCube, d ).xyz;

        //vec3 mappedNormal = normalize( vNormal ) * -1.0;


        mappedNormal = 2. * mappedNormal - 1.0;
        //mappedNormal.y += normalOffset;
        mappedNormal = normalize(mappedNormal);
        dist = (modelMatrixOn * vec4(dist, 1.)).xyz;
        float r = sqrt(dot(dist, dist));
        attenuationFactor *= exp(-r*absorbption);
        // refract the ray at first intersection 
        vec3 oldOrigin = origin;
        origin = intersectedPos - normalize(intersectedPos - centreOffset) * distanceOffset;
        vec3 oldDir = newDirection;
        newDirection = refract(newDirection, mappedNormal, refraction/n1);
         
        if( dot(newDirection, newDirection) == 0.0) { // Total Internal Reflection. Continue inside the diamond
            newDirection = reflect(oldDir, mappedNormal);
             //If the ray got trapped even after max iterations, simply sample along the outgoing refraction!
            if( i == RAY_BOUNCES-1 ) {
                vec3 brdfReflected = BRDF_Specular_GGX_EnvironmentTest(-oldDir, mappedNormal, vec3(f0), 0.0);
                vec3 d1 = (modelMatrixOn * vec4(oldDir, 0.0)).xyz;
                outColor += SampleSpecularContributionTest( vec4(1.0), d1 ).rgb * correction * attenuationFactor  * boost * (vec3(1.0) - brdfReflected);
                //outColor = vec3(1.,0.,0.);
                //if(d1.y > 0.95) outColor += d1.y * vec3(1.,0.,0) * attenuationFactor * (vec3(1.0) - brdfReflected) * boost;
            } 
        
        } else { // Add the contribution from outgoing ray, and continue the reflected ray inside the diamond 
           vec3 brdfRefracted = BRDF_Specular_GGX_EnvironmentTest(newDirection, -mappedNormal, vec3(f0), 0.0);
           // outgoing(refracted) ray's contribution
           vec3 d1 = (modelMatrixOn * vec4(newDirection, 0.0)).xyz;
           vec3 colorG = SampleSpecularContributionTest(vec4(1.0), d1 ).rgb * ( vec3(1.0) - brdfRefracted);
           vec3 dir1 = refract(oldDir, mappedNormal, (refraction+aberration)/n1);
           vec3 dir2 = refract(oldDir, mappedNormal, (refraction-aberration)/n1);
           vec3 d2 = (modelMatrixOn * vec4(dir1, 0.0)).xyz;
           vec3 d3 = (modelMatrixOn * vec4(dir2, 0.0)).xyz;
           vec3 colorR = SampleSpecularContributionTest(vec4(1.0), d2 ).rgb * ( vec3(1.0) - brdfRefracted);
           vec3 colorB = SampleSpecularContributionTest(vec4(1.0), d3 ).rgb * ( vec3(1.0) - brdfRefracted);
           outColor += vec3(colorR.r, colorG.g, colorB.b) * correction * attenuationFactor * boost;
           //outColor = oldDir;
           //new reflected ray inside the diamond
           newDirection = reflect(oldDir, mappedNormal);
           vec3 brdfReflected = BRDF_Specular_GGX_EnvironmentTest(newDirection, mappedNormal, vec3(f0), 0.0);
           attenuationFactor *= brdfReflected * boost;
           count++;
        } 
    }
    if(bDebugBounces) outColor = debugBounces(count); 
    //outColor = (textureCube( tCubeMapNormals, direction )).rgb;
    //outColor = texture2D( sphereMap, vUv ).rgb

    return outColor;
    
}
#endif
void main() {

`;



