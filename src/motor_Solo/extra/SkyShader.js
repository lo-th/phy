import{
	Color,Vector3
}from "three";

export const skyOption = {

    sunPosition: new Vector3(0.27, 1, 0.5),
    sunTop: new Vector3(0, .99, 0),
    saturation:1,
    noiseMap:null,

	//shadow:1.0,

	//sunIntensity:100,//1.26,
	//hemiIntensity:1,//2,//2.79,
	nightLuminosity:0.03,

	//HOUR:12,
	//AZIMUTH:0,

	cloud_size:0.29,
	cloud_covr:0.1,//0.56,
	cloud_dens:0.4,
	cloud_dist:0.64,

	haze:0.1,
	mixRatio:0.76,

	SAMPLE:64,//128*0.5,
	STEP:4,//16

	cloudColor: new Color(0xfffff9).multiplyScalar(1),
	skyColor: new Color(0x425876),
	fogColor: new Color(0xabb5c0),
    groundColor: new Color(0x808080),
    sunColor: new Color(0xffffff).multiplyScalar(3),

}

export const SkyShader = {
	defines:{
		'USE_NOISE_MAP' : false,
	},
	uniforms: {
		lightdir: { value: skyOption.sunPosition },
        sunTop: { value:skyOption.sunTop },
        noiseMap: { value:skyOption.noiseMap },
        
        mixRatio: { value: skyOption.mixRatio },

		cloud_size: { value: skyOption.cloud_size },
        cloud_covr: { value: skyOption.cloud_covr },
        cloud_dens: { value: skyOption.cloud_dens },
        cloud_dist: { value: skyOption.cloud_dist },
        nightLuminosity: { value: skyOption.nightLuminosity },
        haze: { value: skyOption.haze },
        saturation:{ value: skyOption.saturation },
        
        SAMPLE:{ value: skyOption.SAMPLE },
        STEP:{ value: skyOption.STEP },
        fogy: { value: skyOption.fogy },
        t: { value: 1.0 },
        // extra color

        fogColor: { value: skyOption.fogColor },
        groundColor: { value: skyOption.groundColor },
        cloudColor: { value: skyOption.cloudColor },
        skyColor: { value: skyOption.skyColor },
        sunColor: { value: skyOption.sunColor },
	},
	vertexShader: /* glsl */ `
varying vec3 worldPosition;
void main()	{
	worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`,
	fragmentShader: /* glsl */`
//precision highp float;
varying vec3 worldPosition;

uniform vec3 fogColor;
uniform vec3 groundColor;
uniform vec3 cloudColor;
uniform vec3 skyColor;
uniform vec3 sunColor;

uniform float saturation;

uniform float hue;
uniform float mixRatio;
uniform float fogy;

uniform vec3 sunTop;

uniform sampler2D noiseMap;
uniform vec3 lightdir;

uniform float cloud_size;
uniform float cloud_covr;
uniform float cloud_dens;
uniform float cloud_dist;

uniform float nightLuminosity;
uniform float haze;
uniform float t;

uniform int SAMPLE;
uniform int STEP;

//const float c = 6.36e6;
//const float d = 6.38e6;
const float c = 6.407e6;
const float d = 6.416e6;

//const float g = 0.76; // mix ratio
//const float h = g*g;
const float icc = 1.0/8e3;
const float jcc = 1.0/1200.0;
const float pi = 3.141592653589793;

const vec3 vm = vec3( 0,-c,0 );
//const vec3 vn = vec3( 2.1e-5 );
//const vec3 vo = vec3( 5.8e-6, 1.35e-5, 3.31e-5 );

//const vec3 vn = vec3( 0.000021 );
//const vec3 vo = vec3( 0.0000058, 0.0000135, 0.0000331 );// sky base color

//const vec3 vo = vec3( 0.000021 );// sky base color


#ifdef USE_NOISE_MAP

float noise( in vec3 x ){
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
    vec2 rg = texture2D( noiseMap, (uv+0.5)/256.0, -16.0 ).yx;
    return mix( rg.x, rg.y, f.z );
}

#else

float hash( float n ) { return fract(sin(n)*753.5453123); }
float noise( in vec3 x ){
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*157.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
}

#endif

float NOISE( vec3 r )
{
	r.xz += t;
	r *= 0.5;
	float s;
	s = 0.5 * noise(r);
	r = r * 2.52;
	s += 0.25 * noise(r);
	r = r * 2.53;
	s += 0.125 * noise(r);
	r = r * 2.51;
	s += 0.0625 * noise(r);
	r = r * 2.53;
	s += 0.03125 * noise(r);
	r = r * 2.52;
	s += 0.015625 * noise(r);
	return s;
}

float MakeNoise( vec3 r )
{
	float s,tt;
	s = NOISE( r * 2e-4 * ( 1.0 - cloud_size ) );
	tt = ( 1.0 - cloud_covr ) * 0.5 + 0.2;
	s = smoothstep( tt, tt+.2 , s );
	s *= 0.5*(cloud_dens*100.0);
	return s;
}

void clouds( in vec3 r, out vec3 u )
{
	float v,w;
	v = length( r-vm ) - c;
	w = 0.0;
	if( 5e3 < v && v < 1e4 ) w = MakeNoise( r ) * (sin( pi*(v-5e3)/5e3 ));
	u = vec3( exp(-v*icc), exp(-v*jcc), w );
}

float ca( in vec3 r, in vec3 s, in float t )
{
	vec3 u = r - vm;
	float v,w,x,y,z,A;
	v = dot(u,s);
	w = dot(u,u)-t*t;
	x = v*v-w;
	if( x < 0.0 ) return -1.0;
	y = sqrt(x);
	z = -v-y;
	A = -v+y;
	return z >= 0.0 ? z : A;
}

vec3 czm_saturation(vec3 rgb, float adjustment)
{
    vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}


vec3 makeSky( in vec3 lightpos, in vec3 r, in vec3 world, out float mask )
{

	vec3 vn = vec3( 0.000021 );
	vec3 vo = skyColor;
	vo *= 0.00005;

	float u,v,w,x,y,z,m, M, N, S, H, F;
	vec3 p = lightpos;
	u = ca(r,world,d);
	v = dot(world,p);
	w = 1.0+v*v;

	float gg = mixRatio;
	float hh = gg*gg;

	x = 0.0596831*w;
	y = 0.0253662*(1.0-hh)*w/((2.0+hh)*pow(abs(1.0+hh-2.0*gg*v),1.5));
	z = 50.*pow(abs(1.+dot(world,-p)),2.0)*dot(vec3(0.,1.,0.),p)*(1.0-cloud_covr)*(1.0-min(fogy,1.0));

	m = 0.0;
	vec3 D,E, CB, CM, BB, BM, SX;

	F = u / float( SAMPLE );

	BB = vec3(0.0);
	BM = vec3(0.0);

	float count = 0.0;

	for( int G=0; G<SAMPLE; ++G ){

		H = float(G)*F;
		vec3 I = r + world * H;
		//CB = vec3(1.0);
		//BB = vec3(0.0);
		clouds( I, CB );
		CB += fogy;// add fog
		CB.y += CB.z;// add clound
		CB.xy *= F;
		BB += CB;

		M = ca(I,p,d);

		if( M > 0.0 ){

			N = M/float(STEP);
			BM = vec3(0.0);

			for( int R=0; R<STEP; ++R ){

				S = float(R)*N;
				vec3 T=I+p*S;
				clouds( T, CM );
				CM += fogy;// add fog
				CM.y += CM.z;// add clound
				BM += CM * N;

			}

			SX = exp(-(vo*(BM.x+BB.x)+vn*(BM.y+BB.y)* cloud_dist));

			m += CB.z;
			count += 1.0;
			D += SX*CB.x;
			E += (SX*CB.y)+z*m;
		}
		else return vec3(0.0);
	}
	//mask = m * 0.0125;
	//mask = m / count;
	mask = m / float( SAMPLE );

	return ((D * vo * x ) + (E * vn * y * sunColor)) * 15.0;
}


void main()
{
	vec3 light = normalize( lightdir );
	vec3 world = normalize( worldPosition.xyz );

	float uvy = acos( world.y ) / pi;

	//float luma = smoothstep(0.0, 4.0,  1.0-(abs(world.y)/0.8) );
    //float mid = smoothstep(0.0, 1.0,  abs(world.y) < haze ? 1.0-(abs(world.y)/(haze*1.0)) : 0.0 );
    //mid *= nightLuminosity;//pow(  mid, 1.0 );

    // ground reapeat sky
	//if( world.y < -0.15) world.y = -0.15+((-world.y-0.15)*0.1);
	if( world.y < 0.0) world.y = -world.y;

	float high = smoothstep(1.0, 0.0, (uvy)*10000.0);
	float top =  smoothstep(1.0, 0.0, (uvy-0.5)*50.0);
	float middle = uvy > 0.5 ? high : smoothstep(0.0, 1.0, (0.5-uvy)*((1.0-haze)*100.0));

	float middle2 = uvy > 0.5 ? smoothstep(0.0, 1.0, (0.5-uvy)*((1.0-haze)*100.0)) : smoothstep(0.0, 1.0, (0.5-uvy)*((1.0-haze)*100.0));

	vec3 s = sunTop;
	float lm = dot( s, light );
	float day = clamp((lm*4.0), 0.0, (1.0-nightLuminosity) )+nightLuminosity;

	if(lm <= 0.0) light *= -1.0;
	light.y = abs(light.y);

	//if(light.y < 0.1) light.y = 0.1;
	light.y = clamp(light.y, 0.1, 1.0 );
	//light.y += 0.5;

	float mask = 0.0;

	vec3 sky = makeSky( light, s, world, mask );
	mask = clamp(mask, 0.0, 1.0 );
	sky = mix( sky, cloudColor, mask ); //apply cloud color
	

	//sky = mix( sky, groundColor, 1.0-middle ); // apply ground color
	sky = mix( sky, fogColor, 1.0-middle2 ); // apply fog color
	
    //float dd = clamp(day+(nightLuminosity*0.5), 0.0, 1.0);
	//luma *= 1.0-dd;
	//clear = mix( clear, clear+skyColor, luma ); // extra luminosity on night

	sky *= day;
	//sky = czm_saturation(sky, saturation);
    //sky = clamp(sky, 0.0, 1.0 );


 	gl_FragColor = vec4( sky, 1.0 );

}
`,
	depthWrite: false,
	depthTest: false,
	side:1,
	toneMapped: false,
	fog:false,
}