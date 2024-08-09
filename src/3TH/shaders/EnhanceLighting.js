//https://github.com/0beqz/enhance-shader-lighting

import * as THREE from "three"

const shaderFunctions = /* glsl */ `

mat4 brightnessMatrix( float brightness )
{
    return mat4( 1, 0, 0, 0,
                 0, 1, 0, 0,
                 0, 0, 1, 0,
                 brightness, brightness, brightness, 1 );
}

mat4 contrastMatrix( float contrast )
{
    float t = ( 1.0 - contrast ) / 2.0;
    
    return mat4( contrast, 0, 0, 0,
                 0, contrast, 0, 0,
                 0, 0, contrast, 0,
                 t, t, t, 1 );

}

mat4 saturationMatrix( float saturation )
{
    vec3 luminance = vec3( 0.3086, 0.6094, 0.0820 );
    
    float oneMinusSat = 1.0 - saturation;
    
    vec3 red = vec3( luminance.x * oneMinusSat );
    red+= vec3( saturation, 0, 0 );
    
    vec3 green = vec3( luminance.y * oneMinusSat );
    green += vec3( 0, saturation, 0 );
    
    vec3 blue = vec3( luminance.z * oneMinusSat );
    blue += vec3( 0, 0, saturation );
    
    return mat4( red,     0,
                 green,   0,
                 blue,    0,
                 0, 0, 0, 1 );
}
//fragColor = brightnessMatrix( brightness ) *
//                contrastMatrix( contrast ) * 
//                saturationMatrix( saturation ) *
//                color;

// source: https://timseverien.com/posts/2020-06-19-colour-correction-with-webgl/
vec3 adjustContrast(vec3 color, float value) {
    const vec3 zero = vec3(0.);
    vec3 cc = color-0.5;
    return max(zero, 0.5 + value * (cc));
}

// source: https://gist.github.com/yiwenl/745bfea7f04c456e0101
vec3 hsv2rgb(vec3 c){
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

// source: https://gist.github.com/yiwenl/745bfea7f04c456e0101
vec3 rgb2hsv(vec3 rgb) {
    float Cmax = max(rgb.r, max(rgb.g, rgb.b));
    float Cmin = min(rgb.r, min(rgb.g, rgb.b));
    float delta = Cmax - Cmin;
    vec3 hsv = vec3(0., 0., Cmax);
    if (Cmax > Cmin) {
        hsv.y = delta / Cmax;
        if (rgb.r == Cmax)
            hsv.x = (rgb.g - rgb.b) / delta;
        else {
            if (rgb.g == Cmax)
                hsv.x = 2. + (rgb.b - rgb.r) / delta;
            else
                hsv.x = 4. + (rgb.r - rgb.g) / delta;
        }
        hsv.x = fract(hsv.x / 6.);
    }
    return hsv;
}
`
const aoCode = /* glsl */ `
float aoMapClr = 1.;

#ifdef USE_AOMAP
    aoMapClr = (texture2D(aoMap, vAoMapUv).r - 1.0) * aoMapIntensity + 1.0;
#else
    #ifdef USE_LIGHTMAP

        float lightMapIntensityCorrect = lightMapIntensity;
        if(useLegacyLights) lightMapIntensityCorrect = lightMapIntensity / PI;
        vec3 lightMapVec = (texture2D(lightMap, vLightMapUv).rgb - vec3(1.)) * (lightMapIntensityCorrect) + vec3(1.);
        
        const vec3 luminanceWeight = vec3(0.2126, 0.7152, 0.0722);

        // grayscale the lightmap
        aoMapClr = dot(lightMapVec.rgb, luminanceWeight);
    #endif
#endif

if(aoMapGamma != 1.) aoMapClr = pow(aoMapClr, 1. / aoMapGamma);

// clamp
aoMapClr = min(1., aoMapClr);
`

const aomap_fragment = /* glsl */ `
#ifdef USE_AOMAP

    // reads channel R, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
    if(!enableESL) {

        float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
        reflectedLight.indirectDiffuse *= ambientOcclusion;

        #if defined( USE_CLEARCOAT ) 
            clearcoatSpecularIndirect *= ambientOcclusion;
        #endif

        #if defined( USE_SHEEN ) 
            sheenSpecularIndirect *= ambientOcclusion;
        #endif

        #if defined( USE_ENVMAP ) && defined( STANDARD )

            float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );

            reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );

        #endif
    }

#endif
`

const envBasicCode = /* glsl */ `
envMapColor.rgb *= aoMapClr;

vec3 origEnvMapColor = vec3(envMapColor.rgb);

float origAoMapClr = aoMapClr;

#ifndef DISABLE_SMOOTHING
    // calculate smoothing
    float smoothingRoughnessInfluence = max(0.75 - roughness, 0.);
    float smoothingAoInfluence = (1. - aoMapClr) * 0.75;

    float totalSmoothing = 0.3 + smoothingPower + (1. - smoothingPower) * smoothingRoughnessInfluence - smoothingAoInfluence;
    vec3 smoothing = vec3(max(totalSmoothing, 0.));

    envMapColor.rgb = pow(envMapColor.rgb, smoothing);
#endif

envMapColor.rgb += pow(envMapColor.rgb, vec3(envPower)) * (aoPower * 0.2);

float aoMapPower = pow(aoMapClr + aoSmoothing * (0.5 - aoMapClr), aoPower);
if(aoMapPower > 1.) aoMapPower = 1.;
`

// will replace "return PI * envMapColor.rgb * envMapIntensity;"
const getIBLIrradiance_replace = /* glsl */ `

if(enableESL){
    ${envBasicCode}

    envMapColor.rgb *= irradianceColor;

    #ifndef DISABLE_SMOOTHING
        envMapColor.rgb = pow(envMapColor.rgb, smoothing);
    #endif

    float origAoMapClrPow = origAoMapClr * origAoMapClr;

    vec3 hemisphereInfluence = aoMapClr * mix(
        irradianceColor,
        hemisphereColor,
        1. - origAoMapClrPow
    ) * envMapColor.rgb * envMapIntensity * 0.125;

    envMapColor.rgb = mix(envMapColor.rgb, hemisphereColor, 1. - origAoMapClrPow);

    vec3 env = irradianceIntensity * envMapColor.rgb * envMapIntensity * aoMapPower + hemisphereInfluence;

    if(sunIntensity != 0.){
        env += irradianceIntensity * sunIntensity * irradianceColor * origEnvMapColor * envMapIntensity * pow(aoMapClr, 16.);
    }

     return env;
} else {
    return PI * envMapColor.rgb * envMapIntensity;
}
`

// will replace "return envMapColor.rgb * envMapIntensity;"
const getIBLRadiance_replace = /* glsl */ `

if(enableESL) {
    ${envBasicCode}

    #ifndef DISABLE_SMOOTHING

        envMapColor.rgb *= radianceColor;
        envMapColor.rgb = pow(envMapColor.rgb, smoothing);

    #endif

    vec3 env = envMapColor.rgb * envMapIntensity * 0.125 * (aoMapPower * radianceIntensity + aoMapClr * radianceColor);

    if(sunIntensity != 0.){
        env += radianceIntensity * sunIntensity * irradianceColor * origEnvMapColor * envMapIntensity * pow(aoMapClr, 16.);
    }

    return env;

} else {
    return envMapColor.rgb * envMapIntensity;
}
`
const new_map_fragment = /* glsl */ `
#ifdef USE_MAP

   vec4 sampledDiffuseColor = texture2D( map, vMapUv );

   #ifdef DECODE_VIDEO_TEXTURE

        // use inline sRGB decode until browsers properly support SRGB8_ALPHA8 with video textures (#26516)

        sampledDiffuseColor = vec4( mix( pow( sampledDiffuseColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), sampledDiffuseColor.rgb * 0.0773993808, vec3( lessThanEqual( sampledDiffuseColor.rgb, vec3( 0.04045 ) ) ) ), sampledDiffuseColor.w );
    
    #endif

if(enableESL) {
    #ifdef USE_LIGHTMAP
        float lightMapIntensityCorrect = lightMapIntensity;
        if(useLegacyLights) lightMapIntensityCorrect = lightMapIntensity / PI;
        vec3 lightMapClr = (texture2D(lightMap, vLightMapUv).rgb - vec3(1.)) * (lightMapIntensityCorrect) + vec3(1.);
    #else
        vec3 lightMapClr = vec3(1.);
    #endif

    if(lightMapGamma != 1.) lightMapClr = pow(lightMapClr, vec3(1. / lightMapGamma));

    if(lightMapContrast != 1.) lightMapClr = adjustContrast(lightMapClr, lightMapContrast);

    // clamp
    lightMapClr = min(lightMapClr, vec3(1.));

    // source: Chapter 16 of OpenGL Shading Language
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(lightMapClr, W));
    lightMapClr = mix(intensity, lightMapClr, lightMapSaturation);

    if(mapContrast != 1.) sampledDiffuseColor = vec4(adjustContrast(sampledDiffuseColor.rgb, mapContrast), sampledDiffuseColor.a);
    //sampledDiffuseColor = clamp(sampledDiffuseColor, 0.0,1.0);
    //if(mapContrast != 1.) sampledDiffuseColor *= contrastMatrix( mapContrast );
    //if(mapContrast != 1.) sampledDiffuseColor *= saturationMatrix( mapContrast );

    vec3 lightMapHsv = rgb2hsv(lightMapClr);
    float saturation = lightMapHsv.y;

    float mixVal = saturation;
    
    float value = pow(lightMapHsv.z, 0.05);
    float darkness = 1. - value;

     lightMapHsv.y = mix(lightMapHsv.y, lightMapHsv.y * 5., darkness * 1.75);
    
    lightMapHsv = hsv2rgb(lightMapHsv);

    // blend the lightmap color towards the diffuse color the more light this spot receives
    lightMapHsv = mix(lightMapHsv, lightMapHsv * normalize(sampledDiffuseColor.rgb) * length(sampledDiffuseColor.rgb), value);

    mixVal += darkness * 0.2;
    
    lightMapClr = pow(
        mix(lightMapClr, lightMapHsv, mixVal),
        vec3(1.25)
    );

    float lightnessFactor = pow(lightMapHsv.z, 0.1);

    diffuseColor *= lightnessFactor * sampledDiffuseColor * vec4(lightMapClr, 1.0);
    diffuseColor.a = 1.0;

} else {
    diffuseColor *= sampledDiffuseColor;
}
#endif
`

const map_fragment = THREE.ShaderChunk.map_fragment.replace( "diffuseColor *= sampledDiffuseColor;", new_map_fragment )

const lights_pars_begin = THREE.ShaderChunk.lights_pars_begin.replace(
	"vec3 irradiance = ambientLightColor;",
	/* glsl */ `
    vec3 irradiance = vec3(0.0);
    if(enableESL) {
        ${aoCode}
        aoMapClr *= aoMapClr;
        irradiance = mix( ambientLightColor, aoColor * 15.0 * ((aoMapClr - 1.0) * 0.28 + 1.0), 1.0 - aoMapClr );
    } else {
        irradiance = ambientLightColor;
    }
    `
)

//const lights_fragment_maps = THREE.ShaderChunk.lights_fragment_maps.replace("USE_LIGHTMAP", "false")
//const lightmap_fragment = THREE.ShaderChunk.lightmap_fragment.replace("USE_LIGHTMAP", "false")

const lights_fragment_maps = THREE.ShaderChunk.lights_fragment_maps.replace("irradiance += lightMapIrradiance;", "if(!enableESL) irradiance += lightMapIrradiance;")
//const lightmap_fragment = THREE.ShaderChunk.lightmap_fragment.replace("reflectedLight.indirectDiffuse += lightMapIrradiance;", "if(!enableESL) reflectedLight.indirectDiffuse += lightMapIrradiance;")


const toFloat32 = number => {
	let float32 = Math.fround(number).toString()
	if (!float32.includes(".")) float32 += "."

	return float32
}

const toVec3 = color => {
	return "vec3(" + toFloat32(color.r) + ", " + toFloat32(color.g) + ", " + toFloat32(color.b) + ")"
}


export function EnhanceLighting( shader,
	{
        enableESL = true,
        useLegacyLights = false,
		aoColor = new THREE.Color(0x000000),
		hemisphereColor = new THREE.Color(0xffffff),
		irradianceColor = new THREE.Color(0xffffff),
		radianceColor = new THREE.Color(0xffffff),

		aoPower = 1,
		aoSmoothing = 0,
		aoMapGamma = 1,
		lightMapGamma = 1,
		lightMapSaturation = 1,
		envPower = 1,
		roughnessPower = 1,
		sunIntensity = 0,
		mapContrast = 1,
		lightMapContrast = 1,
		smoothingPower = 0.25,
		irradianceIntensity = Math.PI,
		radianceIntensity = 1,

		hardcodeValues = false
	} = {}
) {
	if (shader.defines && shader.fragmentShader.includes("#define ENHANCE_SHADER_LIGHTING")) return

	if (shader.defines === undefined) shader.defines = {}

	shader.defines.ENHANCE_SHADER_LIGHTING = ""
    //shader.defines.DISABLE_SMOOTHING = ""

	if (hardcodeValues) {
		shader.fragmentShader = shader.fragmentShader.replace(
			"uniform float opacity;",
			/* glsl */ `
            uniform float opacity;
            
            const vec3 aoColor = ${toVec3(aoColor)};
            const vec3 hemisphereColor = ${toVec3(hemisphereColor)};
            const vec3 irradianceColor = ${toVec3(irradianceColor)};
            const vec3 radianceColor = ${toVec3(radianceColor)};

            const float aoPower = ${toFloat32(aoPower)};
            const float aoSmoothing = ${toFloat32(aoSmoothing)};
            const float aoMapGamma = ${toFloat32(aoMapGamma)};
            const float lightMapGamma = ${toFloat32(lightMapGamma)};
            const float lightMapSaturation = ${toFloat32(lightMapSaturation)};
            const float envPower = ${toFloat32(envPower)};
            const float roughnessPower = ${toFloat32(roughnessPower)};
            const float sunIntensity = ${toFloat32(sunIntensity)};
            const float mapContrast = ${toFloat32(mapContrast)};
            const float lightMapContrast = ${toFloat32(lightMapContrast)};
            const float smoothingPower = ${toFloat32(smoothingPower)};
            const float irradianceIntensity = ${toFloat32(irradianceIntensity)};
            const float radianceIntensity = ${toFloat32(radianceIntensity)};
            `
		)
	} else {
        
		shader.uniforms.aoColor = { value: aoColor }
		shader.uniforms.hemisphereColor = { value: hemisphereColor }
		shader.uniforms.irradianceColor = { value: irradianceColor }
		shader.uniforms.radianceColor = { value: radianceColor }

        shader.uniforms.enableESL = { value: enableESL }
        shader.uniforms.useLegacyLights = { value: useLegacyLights }

		shader.uniforms.aoPower = { value: aoPower }
		shader.uniforms.aoSmoothing = { value: aoSmoothing }
		shader.uniforms.lightMapGamma = { value: lightMapGamma }
		shader.uniforms.lightMapSaturation = { value: lightMapSaturation }
		shader.uniforms.aoMapGamma = { value: aoMapGamma }
		shader.uniforms.envPower = { value: envPower }
		shader.uniforms.smoothingPower = { value: smoothingPower }
		shader.uniforms.roughnessPower = { value: roughnessPower }
		shader.uniforms.sunIntensity = { value: sunIntensity }
		shader.uniforms.mapContrast = { value: mapContrast }
		shader.uniforms.lightMapContrast = { value: lightMapContrast }

		shader.uniforms.irradianceIntensity = { value: irradianceIntensity }
		shader.uniforms.radianceIntensity = { value: radianceIntensity }

		shader.fragmentShader = shader.fragmentShader.replace(
			"uniform float opacity;",
			/* glsl */ `
            uniform float opacity;
            
            uniform vec3 aoColor;
            uniform vec3 hemisphereColor;
            uniform vec3 irradianceColor;
            uniform vec3 radianceColor;

            uniform bool enableESL;
            uniform bool useLegacyLights;

            uniform float aoPower;
            uniform float aoSmoothing;
            uniform float aoMapGamma;
            uniform float lightMapGamma;
            uniform float lightMapSaturation;
            uniform float envPower;
            uniform float roughnessPower;
            uniform float sunIntensity;
            uniform float mapContrast;
            uniform float lightMapContrast;
            uniform float smoothingPower;
            uniform float irradianceIntensity;
            uniform float radianceIntensity;

            #define ENHANCE_SHADER_LIGHTING
            ${shaderFunctions}
            `
		)
	}

	shader.fragmentShader = shader.fragmentShader
		.replace(
			"main() {",
			`
            main() {
            ${aoCode}
            `
		)
		.replace("#include <aomap_fragment>", aomap_fragment)
		.replace("#include <lights_pars_begin>", lights_pars_begin)
		.replace("#include <lights_fragment_maps>", lights_fragment_maps)
		//.replace("#include <lightmap_fragment>", lightmap_fragment) // NO MORE LIGHTMAP IN LAST THREE 
		//.replace("#include <map_fragment>", map_fragment) 
        .replace( "#include <map_fragment>", new_map_fragment )
        ///.replace( "diffuseColor *= sampledDiffuseColor;", new_map_fragment )

		.replace("#include <envmap_physical_pars_fragment>", THREE.ShaderChunk.envmap_physical_pars_fragment)

        // in envmap_physical_pars_fragment

		.replace(
            "getIBLIrradiance( const in vec3 normal )", 
            "getIBLIrradiance( const in vec3 normal, float aoMapClr )"
        )
		.replace(
			"getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness )",
			"getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, float aoMapClr )"
		)

		.replace("return PI * envMapColor.rgb * envMapIntensity;", getIBLIrradiance_replace)
		.replace("return envMapColor.rgb * envMapIntensity;", getIBLRadiance_replace)

        // in lights_fragment_maps

        .replace(
            "#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )",
            /* glsl */ `
            //#include <aomap_fragment>
            #if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
            `
        )
        .replace(
            "iblIrradiance += getIBLIrradiance( geometryNormal );",
            "iblIrradiance += getIBLIrradiance( geometryNormal, aoMapClr );"
        )
        .replace(
            "radiance += getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );",
            "radiance += getIBLRadiance( geometryViewDir, geometryNormal, pow(material.roughness, enableESL ? roughnessPower : 1.0), aoMapClr );"
        )
        .replace(
            "clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );",
            "clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, pow(material.clearcoatRoughness, enableESL ? roughnessPower : 1.0), aoMapClr );"
        )

}
