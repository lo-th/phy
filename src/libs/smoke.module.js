import { DataTexture, RGBAFormat, LinearFilter, Texture, SRGBColorSpace, Points, InstancedBufferGeometry, BufferGeometry, Vector3, Vector4, Quaternion, Euler, NormalBlending, AdditiveBlending, InterleavedBuffer, InterleavedBufferAttribute, BufferAttribute, InstancedInterleavedBuffer, DynamicDrawUsage, Sphere, ShaderMaterial, DoubleSide, FrontSide, MultiplyBlending, SubtractiveBlending, Group, TextureLoader } from 'three';

// for easing curve style look 
// https://sole.github.io/tween.js/examples/03_graphs.html

const ParticleSetting = {

	getColor( type ){
        
		let s = type.toString();
		s = s.substring( s.lastIndexOf('.') + 1 );
		let cc = [255,255,255], cc2;
		switch( s ){
			case 'grass': cc = [0.223,0.827,0.325]; cc2 = [0.741,0.498,0.258]; break;
			case 'dirt': cc = [0.741,0.498,0.258]; break;
			case 'leaves': cc = [0.152,0.682,0.376]; break;
			case 'sand': cc = [0.878,0.819,0.686]; break;
			case 'ice': cc = [0.65,0.882,0.96]; break;
			case 'stone': cc = [0.537,0.64,0.65]; break;
			case 'cobblestone': cc = [0.666,0.647,0.588]; break;
			case 'wood': cc = [0.603,0.321,0.152]; break;
			case 'snow': cc = [0.905,0.976,1]; break;
		}
		if( cc2 ) return [ cc[0], cc[1], cc[2], cc2[0], cc2[1], cc2[2] ]
		else return [ cc[0], cc[1], cc[2] ]
	},

    fire : {
        type:"star",
        numParticles: 20,
        position:[0,0,0],
        colors:[
            1, 1, 0, 0,
            1, 1, 0, 1,
            1, 0, 0, 1,
            1, 0, 0, 1,
            1, 0, 0, 0.5,
            0, 0, 0, 0
        ],
        lifeTime: 2,
        timeRange: 2,
        startSize: 0.3,
        endSize: 0.9,
        velocity: [ 0, 0.8, 0 ], 
        velocityRange: [ 0.15, 0.15, 0.15 ],
        gravity: [ 0, -0.2, 0 ],
        spinSpeedRange: 4
    },

    smoke: {
        position:[-2,-0.2,0],
        colors:[
            0, 0, 0, 0,
            0, 0, 0, 1,
            0, 0, 0, 1,
            0, 0, 0, 1,
            0, 0, 0, 0
        ],
        numParticles: 20,
        lifeTime: 2,
        timeRange: 2,
        startSize: 0.5,
        endSize: 2,
        velocity: [ 0, 1.6, 0 ], 
        velocityRange: [ 0.2, 0, 0.2 ],
        gravity: [ 0, -0.25, 0 ],
        spinSpeedRange: 4,
        blending:"normal"
    },

	addBlock:{
    	type:"cube",
        numParticles: 30,
        lifeTime: 1.5,
        endTime: 1.5,
        startTime: 0,
        startSize: 0.25,
        endSize: 0.5,
        sizeRange:0.25,
        spinSpeedRange: 2,
        radius: 0.25,
        velocity:[1,0,1],
        velocityRange:[0.25,0,0.25],
        acceleration:[1,0,1],
        accelerationRange:[0.25,0,0.25],
        gravity:[0,0.05,0],
        tween:"outQuad",
        blending:"normal",
        alphaTest:0.1,
	},

	removeBlock:{
    	type:"cube",
        lifeTime: 1.5,
        endTime: 1.5,
        startTime: 0,
        startSize: 0.5,
        sizeRange:0.25,
        endSize: 0.1,
        spinSpeedRange: 2,
        accelerationRange:[0.5,0.5,0.5],
        gravity:[0,-0.1,0],
        tween:"outQuad",
        blending:"normal",
        alphaTest:0.1,
	},

	explosion:{
		colors:[
		1, 0, 0, 0,
		1, 0, 0, 1,
		1, 0, 0, 1,
		1, 1, 0, 1,
		1, 1, 1, 0.5,
		1, 1, 1, 0
		],
    	type:"cloud",
    	radius:0.5,
    	radiusRange:0.5,
    	numParticles:400,
    	positionRange:[2, 1, 2],
        lifeTime: 3,
        endTime: 4,
        lifeTimeRange:1,
        startTime: 0,
        startSize: 0.1,
        endSize:2,
        sizeRange:1,
        accelerationRange:[1,0.3,1],
        acceleration:[0.8,0.8,0.8],
        gravity:[0,-0.5,0],
        //blending:"normal",
        spinSpeedRange:2,
        //tween:"outSine",
        luma:false,
	},

	////// TRAIL //////

	playerMove:{
		trail:true,
		colors:[
		1, 1, 1, 1,
		0.2, 0.2, 0.2, 0
		],
		type:"round",
		blending:"normal",
		//alphaTest:0.5,
        numParticles:4,
        maxParticles:1000,
        positionRange:[0.2, 0, 0.2],
        lifeTime:1.5,
        startSize: 0.5,
        endSize: 1.0,
        sizeRange:0.25,
        velocityRange: [ 0.6, 0, 0.6 ],
        gravity:[0,0.1,0],
	},

	vehicleMove:{
		trail:true,
		colors:[
		0.5, 0.5, 0.5, 0.25,
		0.2, 0.2, 0.2, 0
		],
		type:"round",
		blending:"normal",
		//alphaTest:0.5,
        numParticles:4,
        maxParticles:2000,
        positionRange:[0.25, 0, 0.25],
        lifeTime:1.5,
        startSize: 0.5,
        endSize:1.0,
        sizeRange:0.25,
        velocityRange: [ 0.6, 0, 0.6 ],
        gravity:[0,0.2,0]
	},

	vehicleTrack:{
		trail:true,
		colors:[
		0.2, 0.2, 0.2, 0.1,
		0.2, 0.2, 0.2, 0
		],
		type:"round2",
		blending:"normal",
        startSize: 0.3,
        endSize:0.3,
		//alphaTest:0.5,
        numParticles:4,
        maxParticles:2000,
        position:[0, -0.1, 0],
        //positionRange:[0, 0, 0],
        lifeTime:6,
        //velocityRange: [ 0.6, 0, 0.6 ],
        oriented:true
	},

	underWater:{
		trail:true,
		colors:[
		1, 1, 1, 1,
		0.5, 0.5, 1, 0
		],
		type:"bubble",
		blending:"normal",
        numParticles:1,
        maxParticles:1000,
        positionRange:[0.25, 0, 0.25],
        lifeTime:1.5,
        startSize: 0.1,
        endSize:0.5,
        sizeRange:0.05,
        velocity: [ 0,1,0 ],
        velocityRange: [ 1,0,1 ],
        acceleration:[0.2,0,0.2],
        gravity:[0,1,0],
        //oriented:true,
	},

	bazookaFire: {
		trail:true,
		colors:[
		1, 0, 0, 1,
		1, 1, 0, 0.5,
		1, 1, 1, 0
		],
		type:"round",
		//blending:"normal",
		//alphaTest:0.5,
        numParticles:2,
        maxParticles:600,
        positionRange:[0.1, 0.1, 0.1],
        lifeTime:1.5,
        startSize: 0.5,
        endSize: 1,
        sizeRange:0.1,
        velocityRange: [ 0.6, 0.6, 0.6 ],
        gravity:[0,0.1,0],
        luma:false,
	},

};

const Premade = [
    'pixel', 'basic', 'cube', 'cloud', 'round', 
    'round2', 'donut', 'bubble', 'smoke', 'circle',
    'field', 'star', 'octo'
];

function ParticleSpec () {

	this.parent = null;
	this.position = [ 0, 0, 0 ];
	this.rotation = [ 0, 0, 0];
	this.name = 'default';
	this.type = 'round';
	this.tween = 'linear';
	this.trail = false;
	this.model = '';
	
	this.numParticles = 1;
	this.maxParticles = 0;
	this.numFrames = 1;
	this.frameDuration = 1;
	this.frameStart = 0;
	this.frameStartRange = 0;
	this.timeRange = 99999999;
	this.startTime = null;
	this.lifeTime = 1;
	this.endTime = -1;
	this.lifeTimeRange = 0;
	
	this.sizeRange = 0;
	this.startSize = 1;
	this.startSizeRange = 0;

	this.endSize = 1;
	this.endSizeRange = 0;
	this.pposition = [ 0, 0, 0 ];
	this.positionRange = [ 0, 0, 0 ];
	this.velocity = [ 0, 0, 0 ];
	this.velocityRange = [ 0, 0, 0 ];
	this.acceleration = [ 0, 0, 0 ];
	this.accelerationRange = [ 0, 0, 0 ];
	this.spinStart = 0;
	this.spinStartRange = 0;
	this.spinSpeed = 0;
	this.spinSpeedRange = 0;
	this.colorMult = [ 1, 1, 1, 1 ];
	this.colorMultRange = [ 0, 0, 0, 0 ];
	this.worldVelocity = [ 0, 0, 0 ];
	this.gravity = [ 0, 0, 0 ];
	this.oriented = false;
	this.orientation = [ 0, 0, 0, 1 ];
	this.colors = [1,1,1,1];
	this.blending = 'additive';

	this.radius = 0;
	this.radiusPosition = false;
	this.axis = 'Y';
	this.radiusRange = 0;
	
	this.tmpRotation = null;
	this.alphaTest = 0;
	this.renderOrder = 0;
	this.luma = true;
	this.depthWrite = false;
	this.transparent = true;

}

const tools = {

	torad: Math.PI / 180,
	todeg: 180 / Math.PI,

	random: () => ( Math.random() ),
	rand: ( low, high ) => ( low + tools.random() * ( high - low ) ),
	randInt: ( low, high ) => ( low + Math.floor( tools.random() * ( high - low + 1 ) ) ),
	plusMinus: ( range ) => (( tools.random() - 0.5 ) * range * 2 ), 
	plusMinusVector: ( range ) => {
		const v = [];
		let i = range.length;
		while(i--) v.push( tools.plusMinus( range[ i ] ) );
		return v;
	},

	toTexture: ( canvas ) => {

		let t = new Texture( canvas );
		t.minFilter = LinearFilter;
		t.magFilter = LinearFilter;
		t.flipY = false;
		t.colorSpace = SRGBColorSpace;
		t.needsUpdate = true;
		return t;

	},

	createTextureFromFloats: ( width, height, pixels, opt_texture ) => {

		let texture = null;
		if ( opt_texture != null ) {
			texture = opt_texture;
		} else {
			const data = new Uint8Array( pixels.length );
			let t;
			for ( let i = 0; i < pixels.length; i ++ ) {

				t = pixels[ i ] * 255.;
				data[ i ] = t;

			}

			texture = new DataTexture( data, width, height, RGBAFormat );
			texture.minFilter = LinearFilter;
			texture.magFilter = LinearFilter;
			texture.needsUpdate = true;

			return texture;

		}

		return texture;
	}
};

const GlTween = function ( type ){

	let s;

	switch(type){

		case 'linear': s = `float tween( float k ) { return k; }`; break;

		case 'inQuad': s = `float tween( float k ) { return k * k; }`; break;
		case 'outQuad': s = `float tween( float k ) { return k * ( 2.0 - k ); }`; break;
		case 'inOutQuad': s = `float tween( float k ) { 
			if ( ( k *= 2.0 ) < 1.0 ) return 0.5 * k * k;
            return - 0.5 * ( --k * ( k - 2.0 ) - 1.0 ); 
        }`; break;

        case 'inCubic': s = `float tween( float k ) { return k * k * k; }`; break;
		case 'outCubic': s = `float tween( float k ) { return --k * k * k + 1.0; }`; break;
		case 'inOutCubic': s = `float tween( float k ) { 
			if ( ( k *= 2.0 ) < 1.0 ) return 0.5 * k * k * k;
			return 0.5 * ( ( k -= 2.0 ) * k * k + 2.0 ); 
        }`; break;

        case 'inQuart': s = `float tween( float k ) { return k * k * k * k; }`; break;
		case 'outQuart': s = `float tween( float k ) { return 1.0 - ( --k * k * k * k ); }`; break;
		case 'inOutQuart': s = `float tween( float k ) { 
			if ( ( k *= 2.0 ) < 1.0) return 0.5 * k * k * k * k;
			return - 0.5 * ( ( k -= 2.0 ) * k * k * k - 2.0 ); 
        }`; break;

        case 'inQuint': s = `float tween( float k ) { return k * k * k * k * k; }`; break;
		case 'outQuint': s = `float tween( float k ) { return --k * k * k * k * k + 1.0; }`; break;
		case 'inOutQuint': s = `float tween( float k ) { 
			if ( ( k *= 2.0 ) < 1.0 ) return 0.5 * k * k * k * k * k;
			return 0.5 * ( ( k -= 2.0 ) * k * k * k * k + 2.0 );
        }`; break;

        case 'inSine': s = `#define PI_90 1.570796326794896
        float tween( float k ) { float j = k * PI_90; return 1.0 - cos( j ); }`; break;
		case 'outSine': s = `#define PI_90 1.570796326794896
		float tween( float k ) { float j = k * PI_90; return sin( j ); }`; break;
		case 'inOutSine': s = `#define M_PI 3.14159265358979323846
		float tween( float k ) { 
			float j = k * M_PI; return 0.5 * (1.0-cos(j));
        }`; break;

        case 'inExpo': s = `float tween( float k ) { return k == 0.0 ? 0.0 : pow( 1024.0, k - 1.0 ); }`; break;
		case 'outExpo': s = `float tween( float k ) { return k == 1.0 ? 1.0 : 1.0 - pow( 2.0, - 10.0 * k ); }`; break;
		case 'inOutExpo': s = `float tween( float k ) { 
			if ( k == 0.0 ) return 0.0;
		    if ( k == 1.0 ) return 1.0;
		    if ( ( k *= 2.0 ) < 1.0 ) return 0.5 * pow( 1024.0, k - 1.0 );
		    return 0.5 * ( - pow( 2.0, - 10.0 * ( k - 1.0 ) ) + 2.0 );
        }`; break;

        case 'inCirc': s = `float tween( float k ) { return 1.0 - sqrt( 1.0 - k * k ); }`; break;
		case 'outCirc': s = `float tween( float k ) { return sqrt( 1.0 - ( --k * k ) ); }`; break;
		case 'inOutCirc': s = `float tween( float k ) { 
			if ( ( k *= 2.0 ) < 1.0) return - 0.5 * ( sqrt( 1.0 - k * k ) - 1.0 );
			return 0.5 * ( sqrt( 1.0 - ( k -= 2.0 ) * k ) + 1.0 ); 
        }`; break;

        case 'inElastic': s = `#define TWO_PI 6.28318530717958647692
        float tween(float k) {
		    float s;
		    float a = 0.1;
		    float p = 0.4;
		    if ( k == 0.0 ) return 0.0;
		    if ( k == 1.0 ) return 1.0;
		    if ( a < 1.0 ) { a = 1.0; s = p * 0.25; }
		    else s = p * asin( 1.0 / a ) / TWO_PI;
		    return - ( a * pow( 2.0, 10.0 * ( k -= 1.0 ) ) * sin( ( k - s ) * TWO_PI / p ) );
		}`; break;
		case 'outElastic': s = `#define TWO_PI 6.28318530717958647692
		float tween(float k) {
		    float s;
		    float a = 0.1; 
		    float p = 0.4;
		    if ( k == 0.0 ) return 0.0;
		    if ( k == 1.0 ) return 1.0;
		    if ( a < 1.0 ) { a = 1.0; s = p * 0.25; }
		    else s = p * asin( 1.0 / a ) / TWO_PI;
		    return ( a * pow( 2.0, - 10.0 * k) * sin( ( k - s ) * TWO_PI / p ) + 1.0 );
		}`; break;
		case 'inOutElastic': s = `#define TWO_PI 6.28318530717958647692
		float tween(float k) {
		    float s;
		    float a = 0.1;
		    float p = 0.4;
		    if ( k == 0.0 ) return 0.0;
		    if ( k == 1.0 ) return 1.0;
		    if ( a < 1.0 ) { a = 1.0; s = p * 0.25; }
		    else s = p * asin( 1.0 / a ) / TWO_PI;
		    if ( ( k *= 2.0 ) < 1.0 ) return - 0.5 * ( a * pow( 2.0, 10.0 * ( k -= 1.0 ) ) * sin( ( k - s ) * TWO_PI / p ) );
		    return a * pow( 2.0, -10.0 * ( k -= 1.0 ) ) * sin( ( k - s ) * TWO_PI / p ) * 0.5 + 1.0;
		}`; break;

		case 'inBack': s = `float tween(float k) {
		    float s = 1.70158;
		    return k * k * ( ( s + 1.0 ) * k - s );
		}`; break;
		case 'outBack': s = `float tween(float k) {
		    float s = 1.70158;
		    return --k * k * ( ( s + 1.0 ) * k + s ) + 1.0;
		}`; break;
		case 'inOutBack': s = `float tween(float k) {
		    float s = 1.70158 * 1.525;
		    if ( ( k *= 2.0 ) < 1.0 ) return 0.5 * ( k * k * ( ( s + 1.0 ) * k - s ) );
		    return 0.5 * ( ( k -= 2.0 ) * k * ( ( s + 1.0 ) * k + s ) + 2.0 );
		}`; break;

		case 'inBounce': s = `float outBounce(float k) {
		    if ( k < ( 1.0 / 2.75 ) ) return 7.5625 * k * k;
		    else if ( k < ( 2.0 / 2.75 ) ) return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
		    else if ( k < ( 2.5 / 2.75 ) ) return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
		    else return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
		}
		float tween(float k) { return 1.0 - outBounce( 1.0 - k ); }`; break;
		case 'outBounce': s = `float tween(float k) {
		    if ( k < ( 1.0 / 2.75 ) ) return 7.5625 * k * k;
		    else if ( k < ( 2.0 / 2.75 ) ) return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
		    else if ( k < ( 2.5 / 2.75 ) ) return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
		    else return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
		}`; break;
		case 'inOutBounce': s = `float outBounce(float k) {
		    if ( k < ( 1.0 / 2.75 ) ) return 7.5625 * k * k;
		    else if ( k < ( 2.0 / 2.75 ) ) return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
		    else if ( k < ( 2.5 / 2.75 ) ) return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
		    else return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
		}
		float inBounce(float k) { return 1.0 - outBounce( 1.0 - k ); }
		float tween(float k) {
		    if ( k < 0.5 ) return inBounce( k * 2.0 ) * 0.5;
		    return outBounce( k * 2.0 - 1.0 ) * 0.5 + 0.5;
		}`; break;

	}

	return s;

};

// SHADER //

const ParticleVertex = `
precision mediump float;
precision mediump int;

#ifdef USE_ORIENTATION
	//uniform mat4 worldViewProjection;
	//uniform mat4 world;
	attribute vec3 offset;
	attribute vec4 orientation;
#else
    uniform float scale;
#endif

uniform vec3 worldVelocity;
uniform vec3 gravity;
uniform float timeRange;
uniform float time;
uniform float timeOffset;
uniform float frameDuration;
uniform float numFrames;

attribute vec4 uvLifeTimeFrameStart;
attribute float startTime;
attribute vec4 velocityStartSize;
attribute vec4 accelerationEndSize;
attribute vec4 spinStartSpinSpeed;
attribute vec4 colorMult;

varying vec2 outputTexcoord;
varying float outputPercentLife;
varying vec4 outputColorMult;
varying mat2 rotationMtx;

#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
//#include <clipping_planes_pars_vertex>

vec3 lerp( vec3 a, vec3 b, float p ){ return a + (b - a) * p; }

void main() 
{
    float lifeTime = uvLifeTimeFrameStart.z;
    float frameStart = uvLifeTimeFrameStart.w;
    float startSize = velocityStartSize.w;

    //vec3 velocity = (modelMatrix * vec4(velocityStartSize.xyz, 0.0)).xyz + worldVelocity;
	//vec3 acceleration = (modelMatrix * vec4(accelerationEndSize.xyz, 0.0)).xyz + gravity;

    //vec3 velocity = velocityStartSize.xyz + worldVelocity;
	//vec3 acceleration = accelerationEndSize.xyz + gravity;

	vec3 velocity = velocityStartSize.xyz + (inverse(modelMatrix) * vec4(worldVelocity, 0.0)).xyz;
	vec3 acceleration = accelerationEndSize.xyz + (inverse(modelMatrix) * vec4(gravity, 0.0)).xyz;

    float endSize = accelerationEndSize.w;
    float spinStart = spinStartSpinSpeed.x;
    float spinSpeed = spinStartSpinSpeed.y;

    float localTime = mod((time - timeOffset - startTime), timeRange);
    //localTime = tween( localTime );
    float percentLife = localTime / lifeTime;
    percentLife = tween( percentLife );

    vec3 posEnd = velocity * lifeTime + acceleration * lifeTime * lifeTime;

    float frame = mod(floor(localTime / frameDuration + frameStart), numFrames);
    float uOffset = frame / numFrames;
    float u = uOffset + (uv.x + 0.5) * (1. / numFrames);

    outputTexcoord = vec2(u, uv.y + 0.5);
    outputColorMult = colorMult;

    float size = mix(startSize, endSize, percentLife);
	size = (percentLife < 0. || percentLife > 1.0) ? 0.0 : size;

	float s = sin(spinStart + spinSpeed * localTime);
	float c = cos(spinStart + spinSpeed * localTime);

    #ifdef USE_ORIENTATION
		
		vec4 rotatedPoint = vec4((uv.x * c + uv.y * s) * size, 0., (uv.x * s - uv.y * c) * size, 1.);
		//vec3 center = velocity * localTime + acceleration * localTime * localTime + position + offset;
		vec3 center = (posEnd * percentLife) + position + offset;

		vec4 q2 = orientation + orientation;
		vec4 qx = orientation.xxxw * q2.xyzx;
		vec4 qy = orientation.xyyw * q2.xyzy;
		vec4 qz = orientation.xxzw * q2.xxzz;

		mat4 localMatrix = mat4(
		    (1.0 - qy.y) - qz.z,  qx.y + qz.w,  qx.z - qy.w, 0,
		    qx.y - qz.w, (1.0 - qx.x) - qz.z, qy.z + qx.w, 0,
		    qx.z + qy.w, qy.z - qx.w, (1.0 - qx.x) - qy.y, 0,
		    center.x, center.y, center.z, 1
		);
		rotatedPoint = localMatrix * rotatedPoint;
		gl_Position = projectionMatrix * modelViewMatrix * rotatedPoint;

	#else

	    //vec3 pos = position + velocity * localTime + acceleration * localTime * localTime;

	    vec3 pos = (posEnd * percentLife) + position;
	    
	    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
        //gl_PointSize = size * 1.5 * ( scale / length( mvPosition.xyz ) );
        gl_PointSize = size * 1.5 * ( scale / - mvPosition.z );

        mat2 r = mat2( c, -s, s, c);
        r *= 0.5; r += 0.5;  r = r * 2.0 - 1.0;
        rotationMtx = r;

        gl_Position = projectionMatrix * mvPosition;

	#endif

	outputPercentLife = percentLife;

	#include <logdepthbuf_vertex>
	//#include <clipping_planes_vertex>
	#include <fog_vertex>
}
`;

const ParticleFragment = `
precision mediump float;
precision mediump int;

uniform sampler2D rampSampler;
uniform sampler2D colorSampler;
uniform float luma;
uniform float alphaTest;

varying vec2 outputTexcoord;
varying float outputPercentLife;
varying vec4 outputColorMult;
varying mat2 rotationMtx;

#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
//#include <clipping_planes_pars_fragment>

void main() {

	//#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>

	vec4 diffuseColor = texture2D( rampSampler, vec2(outputPercentLife, 0.5) ) * outputColorMult;

    vec2 uv = vec2(0.0);
    #ifdef USE_ORIENTATION
        uv = outputTexcoord;
	#else
	    uv = gl_PointCoord;
	    uv -= 0.5; uv = uv * rotationMtx; uv += 0.5;
	#endif

	// texture
	diffuseColor *= texture2D( colorSampler, uv );

	if ( diffuseColor.a < alphaTest ) discard;

	diffuseColor.rgb *= luma;

	gl_FragColor = diffuseColor; 
	#include <fog_fragment>

}
`;

const CORNERS_ = [
	[ -0.5, -0.5 ],
	[ 0.5, -0.5 ],
	[ 0.5, 0.5 ],
	[ -0.5, 0.5 ]
];

const POSITION_START_TIME_IDX = 0;
const UV_LIFE_TIME_FRAME_START_IDX = 4;
const VELOCITY_START_SIZE_IDX = 8;
const ACCELERATION_END_SIZE_IDX = 12;
const SPIN_START_SPIN_SPEED_IDX = 16;
const ORIENTATION_IDX = 20;
const COLOR_MULT_IDX = 24;
const LAST_IDX = 28;

const singleParticleArray_ = new Float32Array( 1 * LAST_IDX );

class Emitter extends Points {

	constructor( pe, o ) {

		super();

		this.pe = pe;
		this.count = 0;
		this.color = null;
		this.texture = null;
		this.localTime = 0;
		this.time = 0;
		this.endTime = -1;
		this.num = 0;

		this.matrixAutoUpdate = false;
		this.frustumCulled = o.frustum || false;
		this.receiveShadow = false;
        this.castShadow = false;

        this.birthIndex = 0;

        this.luma = true;

		if( o ) this.setParameters(o);

	}

	setParameters ( o ){

		this.validateParameters ( o );
		if( this.geometry ) this.geometry.dispose();
		if( this.material ) this.material.dispose();

		this.name = o.name;
		this.isTrail = o.trail || false;
		this.parameters = o;


		const numParticles = this.isTrail ? o.maxParticles : o.numParticles;

		//this.makeGeometry( o )

		this.allocateParticles_ ( numParticles, o );
		
		if( !this.isTrail ) this.createParticles_ ( 0, numParticles, o );

		// add to scene
		if( o.parent ) o.parent.add( this );
		else {
			if(this.pe.scene) this.pe.scene.add( this );
			else this.pe.add( this );
		}

	}

	makeGeometry( o ){
		
		//if( this.geometry ) this.geometry.dispose();
		this.geometry = o.oriented ? new InstancedBufferGeometry() : new BufferGeometry();
		this.isMesh = o.oriented;

	}

	setColorRamp ( colorRamp ) {

		const width = colorRamp.length / 4;
		if (width % 1 != 0) throw 'colorRamp must have multiple of 4 entries';
		//if ( this.color == this.pe.defaultColor ) this.color = null;
		this.color = tools.createTextureFromFloats( width, 1, colorRamp );


		// materials[ i ].color.setHSL( h, color[ 1 ], color[ 2 ], THREE.SRGBColorSpace );

	}

	validateParameters ( o ) {

		var defaults = new ParticleSpec();

		for ( let key in o ) {
			if ( typeof defaults[ key ] === 'undefined' ) throw 'unknown particle parameter "' + key + '"';
		}

		for ( let key in defaults ) {
			if ( typeof o[ key ] === 'undefined' ) o[ key ] = defaults[ key ];
		}

	}

	perParticle( index, parameters ){

	}

	birthParticles ( position, colors ) { // only for trail

		var numParticles = this.parameters.numParticles;

		this.parameters.pposition = position;
		this.parameters.startTime = this.time;

		// auto delete trail !!
		this.endTime = this.time + this.parameters.lifeTime;

		if( colors ) this.setColorRamp( colors );

		/*while ( this.birthIndex + numParticles >= this.maxParticles ) {

			var numParticlesToEnd = this.maxParticles - this.birthIndex;

			this.createParticles_( this.birthIndex, numParticlesToEnd,	this.parameters, this.perParticleParamSetter );
			numParticles -= numParticlesToEnd;

			this.birthIndex = 0;

		}*/

		this.createParticles_( this.birthIndex, numParticles, this.parameters );

		this.birthIndex += numParticles;
		if( this.birthIndex + numParticles >= this.parameters.maxParticles ) {
			this.birthIndex = 0;
			//this.time = 0
		}

	}

	createParticles_ ( firstParticleIndex, numParticles, o ) {

		/*if( o.position ) this.position.fromArray( o.position );
		this.setColorRamp( o.colors )
		this.texture = this.pe.textures.make(o.type);
		this.endTime = o.endTime || -1;*/

		
		const plusMinus = tools.plusMinus;
		const plusMinusVector = tools.plusMinusVector;
		const inter = this.interleavedBuffer.array;

		let i = numParticles, n;
		
		while(i--){

			this.perParticle( i, o );
			
			let pLifeTime = o.lifeTime + plusMinus(o.lifeTimeRange);
			let pStartTime = ( o.startTime === null ) ? ( i * o.lifeTime / numParticles ) : o.startTime;
			let pFrameStart = o.frameStart + plusMinus(o.frameStartRange);
			let pPosition = new Vector3().addVectors( new Vector3().fromArray(o.pposition), new Vector3().fromArray(plusMinusVector(o.positionRange)));
			let pVelocity = new Vector3().addVectors( new Vector3().fromArray(o.velocity), new Vector3().fromArray(plusMinusVector(o.velocityRange)));
			let pAcceleration = new Vector3().addVectors( new Vector3().fromArray(o.acceleration), new Vector3().fromArray( plusMinusVector( o.accelerationRange )));
			let pColorMult = new Vector4().addVectors( new Vector4().fromArray(o.colorMult), new Vector4().fromArray(plusMinusVector( o.colorMultRange )));
			let pSpinStart = o.spinStart + plusMinus(o.spinStartRange);
			let pSpinSpeed = o.spinSpeed + plusMinus(o.spinSpeedRange);
			let pStartSize = o.startSize + plusMinus(o.sizeRange || o.startSizeRange);
			let pEndSize = o.endSize + plusMinus(o.sizeRange || o.endSizeRange);
			let pOrientation = new Vector4().fromArray(o.orientation);

			o.positionRange[0]+o.positionRange[1]+o.positionRange[2] === 0 ? true : false;

			if( o.radius ){

				let axis = o.axis || 'Y';

				let angle = tools.rand(0, 2*Math.PI);
				//o.tmpRotation = [ tools.rand(0, 2*Math.PI) * tools.todeg, -angle * tools.todeg, tools.rand(0, 2*Math.PI)	 * tools.todeg, 'YXZ']
				o.tmpRotation = [90, -angle * tools.todeg, 90, 'YXZ'];
				let distance = o.radius + plusMinus(o.radiusRange);

				let pcos = Math.cos(angle);
				let psin = Math.sin(angle);


				let radialP = new Vector3();
				//pPosition = new Vector3(Math.cos(angle), 0, Math.sin(angle)).multiplyScalar(distance).add( new Vector3().fromArray(plusMinusVector(o.positionRange)));

				switch(axis){

					case 'X': radialP.y = pcos; radialP.z = psin; break;
					case 'Y': radialP.x = pcos; radialP.z = psin; break;
					case 'Z': radialP.x = pcos; radialP.y = psin; break;

				}

				radialP.multiplyScalar(distance);

				if(o.radiusPosition) pPosition.add(radialP);

				switch(axis){

					case 'X': radialP.x = 1; break;
					case 'Y': radialP.y = 1; break;
					case 'Z': radialP.z = 1; break;

				}



				//if( pRangeZero ) pPosition = radialP
				//let len = pPosition.length();
				//pVelocity.copy(pPosition).multiplyScalar(len)
				//t = pAcceleration.y;
				pAcceleration.multiply(radialP);//pPosition)
				//pAcceleration.y = t

				//t = pVelocity.y
				pVelocity.multiply(radialP);//pPosition)
				//pVelocity.y = t
			}

			if( o.tmpRotation ){
				pOrientation = new Quaternion().setFromEuler( new Euler( o.tmpRotation[0]*tools.torad, o.tmpRotation[1]*tools.torad, o.tmpRotation[2]*tools.torad, o.tmpRotation[3] ) );
			}

			var jj = 0;
			n = LAST_IDX * jj + ( i * LAST_IDX * 4 ) + ( firstParticleIndex * LAST_IDX * 4 );

			inter[POSITION_START_TIME_IDX + n] = pPosition.x;
			inter[POSITION_START_TIME_IDX + n+1] = pPosition.y;
			inter[POSITION_START_TIME_IDX + n+2] = pPosition.z;
			inter[POSITION_START_TIME_IDX + n+3] = pStartTime;

			inter[UV_LIFE_TIME_FRAME_START_IDX + n] = CORNERS_[jj][0];
			inter[UV_LIFE_TIME_FRAME_START_IDX + n+1] = CORNERS_[jj][1];
			inter[UV_LIFE_TIME_FRAME_START_IDX + n+2] = pLifeTime;
			inter[UV_LIFE_TIME_FRAME_START_IDX + n+3] = pFrameStart;

			inter[VELOCITY_START_SIZE_IDX + n] = pVelocity.x;
			inter[VELOCITY_START_SIZE_IDX + n+1] = pVelocity.y;
			inter[VELOCITY_START_SIZE_IDX + n+2] = pVelocity.z;
			inter[VELOCITY_START_SIZE_IDX + n+3] = pStartSize;

			inter[ACCELERATION_END_SIZE_IDX + n] = pAcceleration.x;
			inter[ACCELERATION_END_SIZE_IDX + n+1] = pAcceleration.y;
			inter[ACCELERATION_END_SIZE_IDX + n+2] = pAcceleration.z;
			inter[ACCELERATION_END_SIZE_IDX + n+3] = pEndSize;

			inter[SPIN_START_SPIN_SPEED_IDX + n] = pSpinStart;
			inter[SPIN_START_SPIN_SPEED_IDX + n+1] = pSpinSpeed;
			inter[SPIN_START_SPIN_SPEED_IDX + n+2] = 0;
			inter[SPIN_START_SPIN_SPEED_IDX + n+3] = 0;

			inter[ORIENTATION_IDX + n] = pOrientation.x;
			inter[ORIENTATION_IDX + n+1] = pOrientation.y;
			inter[ORIENTATION_IDX + n+2] = pOrientation.z;
			inter[ORIENTATION_IDX + n+3] = pOrientation.w;

			inter[COLOR_MULT_IDX + n] = pColorMult.x;
			inter[COLOR_MULT_IDX + n+1] = pColorMult.y;
			inter[COLOR_MULT_IDX + n+2] = pColorMult.z;
			inter[COLOR_MULT_IDX + n+3] = pColorMult.w;
			

		}

		this.interleavedBuffer.needsUpdate = true;

		this.material.uniforms.worldVelocity.value.fromArray( o.worldVelocity );
		this.material.uniforms.gravity.value.fromArray( o.gravity ); 
		this.material.uniforms.timeRange.value = o.timeRange;
		this.material.uniforms.frameDuration.value = o.frameDuration;
		this.material.uniforms.numFrames.value = o.numFrames;
		this.material.uniforms.rampSampler.value = this.color;
		this.material.uniforms.colorSampler.value = this.texture;

		this.material.blending = o.blending === 'normal' ? NormalBlending : AdditiveBlending;



		this.updateMatrix();

	}

	allocateParticles_ ( numParticles, o ) {

		if ( this.count !== numParticles ) {

			if(!o.oriented) o.oriented = false;

			if( o.position ) this.position.fromArray( o.position );
			if( o.rotation ) this.quaternion.setFromEuler( new Euler( o.rotation[0]*tools.torad, o.rotation[1]*tools.torad, o.rotation[2]*tools.torad ) );
			
			this.setColorRamp( o.colors );

		    // get the texture 
		    if(!this.pe.textures.has( o.type )){
		    	 if( Premade.indexOf(o.type) !== -1 ) this.pe.textures.make( o.type );
		    }
		   
			this.texture = this.pe.textures.get( o.type );

			if(!this.texture){
				console.log('this texture is undefined !!');
				//return; 
			}


			this.endTime = o.endTime || -1;
			this.luma = o.luma; 

			//var numIndices = 6 * numParticles;

			//if (numIndices > 65536 && BufferGeometry.MaxIndex < 65536) throw "can't have more than 10922 particles per emitter";

			this.makeGeometry( o );

			this.count = numParticles;

			if( o.oriented ){

				// Use vertexBuffer, starting at offset 0, 3 items in position attribute
				// Use vertexBuffer, starting at offset 4, 2 items in uv attribute
				var vertexBuffer = new InterleavedBuffer( new Float32Array([
					// Front
					0, 0, 0, 0, -0.5, -0.5, 0, 0,
					0, 0, 0, 0, 0.5, -0.5, 0, 0,
					0, 0, 0, 0, 0.5, 0.5, 0, 0,
					0, 0, 0, 0, -0.5, 0.5, 0, 0
				]), 8);

				this.geometry.setAttribute( 'position', new InterleavedBufferAttribute( vertexBuffer, 3, 0 ) );
				this.geometry.setAttribute( 'uv', new InterleavedBufferAttribute( vertexBuffer, 2, 4 ) );
				this.geometry.setIndex( new BufferAttribute( new Uint16Array([ 0, 1, 2, 0, 2, 3 ]), 1 ) );
				this.interleavedBuffer = new InstancedInterleavedBuffer( new Float32Array( numParticles * singleParticleArray_.byteLength ), LAST_IDX, 1 ).setUsage( DynamicDrawUsage );
			} else {
				this.interleavedBuffer = new InterleavedBuffer( new Float32Array( numParticles * singleParticleArray_.byteLength ), LAST_IDX ).setUsage( DynamicDrawUsage );
			}

			this.geometry.setAttribute( 'position', new InterleavedBufferAttribute(this.interleavedBuffer, 3, POSITION_START_TIME_IDX));
			this.geometry.setAttribute( 'startTime', new InterleavedBufferAttribute(this.interleavedBuffer, 1, 3));
			this.geometry.setAttribute( 'uvLifeTimeFrameStart', new InterleavedBufferAttribute(this.interleavedBuffer, 4, UV_LIFE_TIME_FRAME_START_IDX));
			this.geometry.setAttribute( 'velocityStartSize', new InterleavedBufferAttribute(this.interleavedBuffer, 4, VELOCITY_START_SIZE_IDX));
			this.geometry.setAttribute( 'accelerationEndSize', new InterleavedBufferAttribute(this.interleavedBuffer, 4, ACCELERATION_END_SIZE_IDX));
			this.geometry.setAttribute( 'spinStartSpinSpeed', new InterleavedBufferAttribute(this.interleavedBuffer, 4, SPIN_START_SPIN_SPEED_IDX));
			this.geometry.setAttribute( 'orientation', new InterleavedBufferAttribute(this.interleavedBuffer, 4, ORIENTATION_IDX));
			this.geometry.setAttribute( 'colorMult', new InterleavedBufferAttribute(this.interleavedBuffer, 4, COLOR_MULT_IDX));

			//this.geometry.computeBoundingSphere();
			this.geometry.boundingSphere = new Sphere();
			this.geometry.boundingSphere.radius = 3;

			//let isAlpha = false;
			//let isDepthWrite = false;

			let blending = AdditiveBlending;
			switch( o.blending ){
				case 'sub': case 'subtractive': blending = SubtractiveBlending; break;
				case 'multi': case 'multiply': blending = MultiplyBlending; break;
				case 'normal': blending = NormalBlending; break;
				default: blending = AdditiveBlending;
				//isDepthWrite = false
			}

			var uniforms = {

				worldVelocity: { value: new Vector3() },
				gravity: { value: new Vector3() },
				timeRange: { value: 0 },
				time: { value: 0 },
				timeOffset: { value: 0 },
				frameDuration: { value: 0 },
				numFrames: { value: 0 },
				rampSampler: { value: null },
				colorSampler: { value: null },
				scale:{ value: window.innerHeight * 0.5 },
				luma:{value: this.luma ? this.pe.luminosity : 1.0 },
				alphaTest:{ value: o.alphaTest  },

			};

			this.material = new ShaderMaterial({
				defines:{
					'USE_ORIENTATION' : o.oriented,
				},
				uniforms: uniforms,
				vertexShader: GlTween( o.tween || 'linear') + ParticleVertex,
				fragmentShader: ParticleFragment,
				side: (o.oriented) ? DoubleSide : FrontSide,
				blending: blending,//o.blending === 'normal' ? NormalBlending : AdditiveBlending,
				depthTest: true,
				depthWrite:  o.depthWrite,
				transparent: o.transparent,

				// TODO test
		        forceSinglePass: o.single || false,
				fog: o.fog || false,
				//alphaTest: 0.5//:{value: 1.0  }, || 0,
				//alphaToCoverage: isAlpha ? true : false,
			});

			this.renderOrder = o.renderOrder || 0;

		}

	}

	draw ( timeOffset = 0 ) {

		if(!this.material.uniforms) return;
		const uniforms = this.material.uniforms;
		this.time += this.pe.delta;
		uniforms.time.value = this.time;
		uniforms.timeOffset.value = timeOffset;
		uniforms.scale.value = this.pe.hscale;
		uniforms.luma.value = this.luma ? this.pe.luminosity : 1.0;

		if( this.endTime !== -1 ){
			if( this.time >= this.endTime ) this.pe.remove( this.name );
		}
	
	}

	dispose(){

		this.parent.remove(this);
		this.geometry.dispose();
		this.material.dispose();
		this.color.dispose();
		//this.texture.dispose();
	}

	raycast(){}

	clone ( object ){

		if ( object === undefined ) object = this.pe.createEmitter( this.texture ); //, this.timeSource_);

		object.time = 0;
		object.endTime = this.endTime;
		object.geometry = this.geometry;
		object.material = this.material.clone();
		object.material.uniforms.rampSampler.value = this.color;
		object.material.uniforms.colorSampler.value = this.texture;

		super.copy( object );
		this.num++;
		object.name = this.name + this.num;

		return object;

	}

}

class TextureMap extends Map {

	constructor(){

		super();

	}

	dispose(){

		this.forEach( (e)=>{ e.dispose(); });
		this.clear();

	}

	add( name, t ){

		if ( !this.has( name ) ){

			this.set( name, t );
			//console.log('add new texture', name, t )
		}

	}

	make( name ){

		if ( !this.has( name ) ){  
			let t = this['make' + name[0].toUpperCase() + name.substring(1)]();
			this.set( name, t );
		}

	}





	///////



	makePixel(){

		const pixels = [];
		for (let yy = 0; yy < 2; ++yy) {
			for (let xx = 0; xx < 2; ++xx) {
				pixels.push(1, 1, 1, 1);
			}
		}
		return tools.createTextureFromFloats(2, 2, pixels);

	}

	makeBasic(){

		const pixelBase = [0, 0.20, 0.70, 1, 0.70, 0.20, 0, 0];
		const pixels = [];
		for (let yy = 0; yy < 8; ++yy) {
			for (let xx = 0; xx < 8; ++xx) {
				let pixel = pixelBase[xx] * pixelBase[yy];
				pixels.push(pixel, pixel, pixel, 1);
			}
		}
		return tools.createTextureFromFloats(8, 8, pixels);

	}

	makeCube(){

		let s = 8;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		//ctx.fillStyle = 'rgba(255,255,255,0.25)';
		//ctx.fillRect(0, 0, s, s);
		ctx.fillStyle = 'rgba(255,255,255,1.0)';
		ctx.fillRect(s*0.25, s*0.25, s*0.5, s*0.5);
		//let t = new Texture( canvas )
		//t.needsUpdate = true;
		return tools.toTexture( canvas );

	}

	makeCloud(){

		let s = 16;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		let c1 = 'rgba(255,255,255,1)';
		let c2 = 'rgba(255,255,255,0)';

		let grd = ctx.createRadialGradient(s*0.5, s*0.4, 0, s*0.5, s*0.4, s*0.4);
		grd.addColorStop(0.3, c1);
		grd.addColorStop(1, c2);
		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, s,s);
		grd = ctx.createRadialGradient(s*0.4, s*0.62, 0, s*0.4, s*0.62, s*0.35);
		grd.addColorStop(0.3, c1);
		grd.addColorStop(1, c2);
		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, s,s);
		grd = ctx.createRadialGradient(s*0.27, s*0.4, 0, s*0.27, s*0.4, s*0.26);
		grd.addColorStop(0.2, c1);
		grd.addColorStop(1, c2);
		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, s,s);
		grd = ctx.createRadialGradient(s*0.76, s*0.6, 0, s*0.76, s*0.6, s*0.23);
		grd.addColorStop(0.2, c1);
		grd.addColorStop(1, c2);
		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, s,s);

		return tools.toTexture( canvas );
	}

	makeRound(){

		let s = 16;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		const gradient = ctx.createRadialGradient(s*0.5, s*0.5, 0, s*0.5, s*0.5, s*0.5);
		gradient.addColorStop(0, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.3,'rgba(255,255,255,0.1)');
		gradient.addColorStop(0.9,'rgba(255,255,255,0)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, s, s);
		return tools.toTexture( canvas );

	}

	makeRound2(){

		let s = 16;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		const gradient = ctx.createRadialGradient(s*0.5, s*0.5, 0, s*0.5, s*0.5, s*0.5);
		gradient.addColorStop(0, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.9,'rgba(255,255,255,1)');
		//gradient.addColorStop(0.9,'rgba(255,255,255,0)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, s, s);
		return tools.toTexture( canvas );
	}

	makeDonut(){

		let s = 32;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		const gradient = ctx.createRadialGradient(s*0.5, s*0.5, 0, s*0.5, s*0.5, s*0.5);
		gradient.addColorStop(0, 'rgba(255,255,255,1)');
		gradient.addColorStop(0.9,'rgba(255,255,255,0.1)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		//ctx.fillRect(0, 0, s, s);
		ctx.beginPath();
		ctx.arc(s*0.5,s*0.5,s*0.5,0,Math.PI*2, false); // outer (filled)
		ctx.arc(s*0.5,s*0.5,s*0.25,0,Math.PI*2, true); // inner (unfills it)
		ctx.fill();
		return tools.toTexture( canvas );
	}

	makeBubble(){

		let s = 64;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		let c1 = 'rgba(0,255,255,0)';
		let c2 = 'rgba(0,255,255,0.6)';
		let c3 = 'rgba(0,255,255,1)';
		const ctx = canvas.getContext( '2d' );
		const gradient = ctx.createRadialGradient(s*0.4, s*0.4, 0, s*0.5, s*0.5, s*0.5);
		gradient.addColorStop(0.4,c1);
		gradient.addColorStop(0.9,c2);
		gradient.addColorStop(0.99,c3);
		gradient.addColorStop(1, c1);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, s, s);
		ctx.fillStyle = 'rgba(255,255,255,1)';
		ctx.beginPath();
		ctx.arc(s*0.7,s*0.4,s*0.14,0,Math.PI*2, false);
		ctx.fill();
		ctx.beginPath();
		ctx.arc(s*0.2,s*0.65,s*0.05,0,Math.PI*2, false);
		ctx.fill();
		return tools.toTexture( canvas );
	}

	makeSmoke(){

		let s = 64;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		let img = new Image();
		img.src = SMOKE;
		let t = tools.toTexture( canvas );//new Texture( canvas )
		img.onload = function (){
			ctx.drawImage(img, 0, 0);
			t.needsUpdate = true;
			
		};
		return t;
	}

	makeCircle(){

		let s = 64;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		ctx.strokeStyle = "white";
		ctx.lineWidth = 4;
		ctx.beginPath();
		ctx.arc(s*0.5,s*0.5,(s*0.5)-2,0,Math.PI*2);
		ctx.stroke();
		return tools.toTexture( canvas );
	}

	makeField(){

		let s = 64;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		const gradient = ctx.createLinearGradient(0, 0, 0, s);
		gradient.addColorStop(0, 'rgba(255,255,255,0)');
		gradient.addColorStop(0.8, 'rgba(255,255,255,0.4)');
		gradient.addColorStop(1.0, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect((s-(s*0.25))*0.5, 0, s*0.25, s);
		return tools.toTexture( canvas );
	}

	makeStar() {

		let s = 64;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
		const gradient = ctx.createRadialGradient(s*0.5, s*0.5, 0, s*0.5, s*0.5, s*0.5);
		gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
		gradient.addColorStop(0.5, 'rgba(255,255,255,0.1)');
		gradient.addColorStop(0.9, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		this.star(ctx, s*0.5, s*0.1, s*0.5, s*0.5, 3);
		this.star(ctx, s*0.5, s*0.4, s*0.5, s*0.5, 3);
		return tools.toTexture( canvas );
	}

	makeOcto () {

	    let s = 64;
		let canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;
		const ctx = canvas.getContext( '2d' );
	    const gradient = ctx.createRadialGradient(s*0.5, s*0.5, 0, s*0.5, s*0.5, s*0.5);
		gradient.addColorStop(0.4, 'rgba(255,255,255,0.2)');
		gradient.addColorStop(1.0, 'rgba(255,255,255,0.4)');
		ctx.fillStyle = gradient;
		this.star(ctx, s*0.4, s*0.35, s*0.5, s*0.5, 6);
        ctx.strokeStyle = "rgba(255,255,255,0.1)";
		ctx.lineWidth = 6;
        ctx.stroke();
        return tools.toTexture( canvas );
	}
	
	star (ctx, r, r2, cX, cY, N) {

	    ctx.beginPath();
	    ctx.moveTo(cX + r,cY);
	    let x, y, theta;
	    for(var i = 1; i <= N * 2; i++){
		    if(i % 2 == 0){
		        theta = i * (Math.PI * 2) / (N * 2);
		        x = cX + (r * Math.cos(theta));
		        y = cY + (r * Math.sin(theta));
		    } else {
		        theta = i * (Math.PI * 2) / (N * 2);
		        x = cX + (r2 * Math.cos(theta));
		        y = cY + (r2 * Math.sin(theta));
		    }
		    ctx.lineTo(x,y);
	    }
	    ctx.closePath();
	    ctx.fill();

	}



}



const SMOKE = `data:image/png;base64,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
JRU5ErkJggg==`;

class Smoke extends Group {

	constructor (scene) {

		super();

		this.scene = scene || null;
		this.isGl2 = true;
		//this.camera = camera;

		this.emitters = new Map();
		this.textures = new TextureMap();

		this.loader = null;

		this.now = 0;
		this.last = 0;
		this.delta = 0;
		this.elapsed = 0;
		this.num = 0;
		this.hscale = window.innerHeight * 0.5;
		this.luminosity = 1.0;

		this.matrixAutoUpdate = false;
		this.matrixWorldAutoUpdate = false;


	}

	updateMatrixWorld(force) {

		super.updateMatrixWorld(force);

		// internal update
		if(this.scene === null) this.update();

	}

	get ( name ) {

		if ( !this.emitters.has( name ) ) return null
		return this.emitters.get( name )

	}

	add ( o, perParticleParam ) {

		if(o.isPoints){ super.add(o); return; }

		if( !o.name ) o.name = 'PP' + (this.num++);

		// remove old if same name
		this.remove( o.name );

		if( o.model ){

			if( ParticleSetting[o.model] ) o = { ...ParticleSetting[o.model], ...o };

		}

	    let emitter = new Emitter( this, o );
		this.emitters.set( o.name, emitter );

		return emitter;

	}

	remove( name ) {

		if (typeof name === 'string' || name instanceof String){
			if ( !this.emitters.has( name ) ) return
			this.emitters.get( name ).dispose();
			this.emitters.delete( name );
		}
		else if(name.isPoints){ super.remove(name); return; }
		
	}

	addTexture ( name, src, assignSRGB = true ) {

		if( this.textures.has( name )) {
			console.log('this name of texture is already take !');
			return;
		}

		if (typeof src === 'string'){

			if(!this.loader) this.loader = new TextureLoader();

			//let texture = this.loader.load( src );
			//texture.flipY = false;
			//this.textures.add( name, texture );
			this.loader.load( src, 
				( t ) => {
					t.flipY = false;
					//t.minFilter = LinearFilter;
					//t.magFilter = LinearFilter;
					//t.needsUpdate = true;
					if(assignSRGB) t.colorSpace = SRGBColorSpace;
					this.textures.add( name, t );
				} 
			);

		} else {

			if( src.isTexture ){

				src.flipY = false;
				this.textures.add( name, src );

			}

		}

	}

	load( url ) {

        const name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        var xml = new XMLHttpRequest();
        xml.open('GET', url );
        //xml.overrideMimeType( "text/javascript" );
        xml.onreadystatechange = function() {
            if ( xml.readyState === 4 ) {
                if ( xml.status === 200 || xml.status === 0 ) {

                	let data = JSON.parse(xml.responseText);
                	for(let i in data){
						//data['name'] = i
						this.add( data[i] );
					}
                }
                else console.error( "Couldn't load ["+ name + "] [" + xml.status + "]" );
            }
        }.bind(this);
        xml.send();
    }

	resize ( h ) {
		this.hscale = h * 0.5;
	}

	onresize ( h ) {
		this.hscale = h * 0.5;
	}

	loop ( deltaTime ) {

		this.delta = deltaTime;
		this.emitters.forEach( (e)=>{ e.draw(); });

	}

	update ( stamp ) {

		this.now = stamp !== undefined ? stamp : Date.now();
		this.delta = (this.now - this.last)*0.001;
		this.elapsed += this.delta; 
		this.last = this.now;

		this.emitters.forEach( (e)=>{ e.draw(); });

	}

	dispose ( full = true ){

		this.emitters.forEach( (e)=>{ e.dispose(); });
		this.emitters.clear();
		// clear all temp textures
		if( full ) this.textures.dispose();
		this.num = 0;

	}



	///// FOR BLOCK ADD / REMOVE /////

	addBlock( p, type ){

		// underwater
		let order = p[1] <= 4 ? -2 : 0;

		let c = ParticleSetting.getColor(type);
		let r = c[0], g = c[1], b = c[2];
		if(c.length>3){ r = c[3]; g = c[4]; b = c[5]; }
    	p[0] += 0.5;
    	p[2] += 0.5;
    	this.add({
    		position:p,
        	colors:[
        	    r, g, b, 1,
                r, g, b, 0
        	],
        	renderOrder: order,
        	...ParticleSetting.addBlock
    	});

	}

	delBlock( p, type ) {

		// underwater
		let order = p[1] <= 4 ? -2 : 0;

		let c = ParticleSetting.getColor(type);
		let r = c[0], g = c[1], b = c[2];
    	p[0] += 0.5;
    	p[2] += 0.5;
    	p[1] += 0.5;
    	let num = 30;

    	if(c.length>3){ 
    		// top block for grass color
    		num = 20;
    		this.add({
	    		position:[p[0], p[1]+0.375, p[2]],
	    		positionRange:[0.5, 0.25, 0.5],
	        	colors:[
	        	    r, g, b, 0.5,
	                r, g, b, 0
	        	],
	        	numParticles: 10,
	        	renderOrder: order,
	        	...ParticleSetting.removeBlock
	    	});
    		r = c[3]; g = c[4]; b = c[5];
    	}

    	this.add({
    		position:p,
    		positionRange:[0.5, 0.5, 0.5],
        	colors:[
        	    r, g, b, 0.5,
                r, g, b, 0
        	],
        	numParticles: num,
        	renderOrder: order,
        	...ParticleSetting.removeBlock
    	});
	}

	///// FOR PLAYER /////

	removePlayerTrail( uuid ){

		this.remove('PlayerTrail_' + uuid);

	}

    onPlayerWalk( p, uuid, type ){

    	let trail = this.get( 'PlayerTrail_' + uuid );
    	if( trail === null ) 
    		trail = this.addTrail( {
				name:'PlayerTrail_' + uuid,
				...ParticleSetting.playerMove
	        });

		let pos = p.toArray();
		pos[1] += 0.2;
		let c = ParticleSetting.getColor(type);
		let cc = [
    	    c[0], c[1], c[2], 0.75,
            c[0], c[1], c[2], 0
    	];

    	if(c.length>3) cc = [
    	    c[0], c[1], c[2], 0.75,
            c[3], c[4], c[5], 0
    	];

		trail.birthParticles( pos, cc );

    }

    ///// FOR VEHICLE /////

    onVehicleDrive( pos, uuid ){

    	let trail = this.get( 'VehicleTrail_' + uuid );
    	if( trail === null ) 
    		trail = this.addTrail( {
				name:'VehicleTrail_' + uuid,
				...ParticleSetting.vehicleMove
	        });
    	trail.birthParticles( pos.toArray() );

    }

    ///// FOR BAZOOKA /////

    onBazookaFire( pos, uuid ){

    	let trail = this.get( 'BazookaTrail_' + uuid );
    	if( trail === null ) 
    		trail = this.addTrail( {
				name:'BazookaTrail_' + uuid,
				...ParticleSetting.bazookaFire
	        });
    	trail.birthParticles( pos.toArray() );

    }

    ///// FOR EXPLOSION /////

    onExplosion( pos ){

    	this.add({
    		position:pos.toArray(),
        	...ParticleSetting.explosion
    	});

    }

}

export { Smoke };
