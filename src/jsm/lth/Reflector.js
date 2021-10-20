import {
	MeshStandardMaterial,
	MeshPhysicalMaterial,
	WebGLRenderTarget,
	Mesh,
	PlaneGeometry,
	Plane,
	PerspectiveCamera,
	Matrix4,
	Vector3,
	Vector4,
	LinearFilter,
	RGBFormat,
	sRGBEncoding,
	LinearEncoding,
	DoubleSide,
	FrontSide,
	Texture,

} from '../../../build/three.module.js';
import { Shader } from './Shader.js';

//import * as THREE from '../../../three/build/three.module.js';
//import { Tools } from '../Tools.js';

/**
 * @author Slayvin / http://slayvin.net
 */

//export var Reflector = function ( o ) {
export class Reflector extends Mesh {

	constructor( o = {} ) {


		let geometry = o.geometry !== undefined ? o.geometry : new PlaneGeometry( 1, 1, 1, 1 );

		//Mesh.call( this, geometry );
		super( geometry );

		this.settings = {
			size: [200,200],
			gAlpha:true,
			opacity:1,

		}



		this.scale.set( 200, 200, 1 )

		
		this.rotateX( -Math.PI / 2 );
		this.castShadow = false;
		this.receiveShadow = true;

		this.type = 'Reflector';

		this.isShow = true;

		var scope = this;

		o = o || {};

		this.map = o.map || null;
		this.color = o.color || 0x505050//0x404040;
		this.reflect = o.reflect !== undefined ? o.reflect : 0.35;
		this.opacity = o.opacity !== undefined ? o.opacity : 1;
		this.isWater = o.water !== undefined ? o.water : false;
		this.uv = o.uv || 1;
		this.normalScale = o.normalScale || 1;


		this.encoding = o.encoding || false;

		this.textureSize = o.textureSize || 512;

		this.renderTarget = null;

		
		var clipBias = o.clipBias || 0;

		var reflectorPlane = new Plane();
		var normal = new Vector3();
		var reflectorWorldPosition = new Vector3();
		var cameraWorldPosition = new Vector3();
		var rotationMatrix = new Matrix4();
		var lookAtPosition = new Vector3( 0, 0, - 1 );
		var clipPlane = new Vector4();

		var viewPos = new Vector3();
		var target = new Vector3();
		var q = new Vector4();

		var textureMatrix = new Matrix4();
		var virtualCamera = new PerspectiveCamera();


		this.material = new MeshStandardMaterial({ 
			name:'floor', color:this.color, map:this.map, roughness:0.25, metalness:1, opacity:1,
			transparent:true,
			depthWrite: false,
	        //depthTest: false, 
	        premultipliedAlpha:true,

		});


		this.groundAlpha();
		this.renderOrder = 1;

		if( this.isWater ) this.setWater();

		this.material.userData = {
			reflectif: { value: this.reflect },
			mirrorMap:{ value: null },
			blackAll:{ value: 0 }
		}

		this.setTarget();

		


		var _this = this;



		this.material.onBeforeCompile = function ( shader ) {

			var uniforms = shader.uniforms;

			//uniforms['fogTime'] = { value: 0 };
			
			//var uniforms = THREE.UniformsUtils.clone( THREE.ShaderLib[ 'standard' ].uniforms );
			uniforms[ "mirrorMap" ] = this.userData.mirrorMap;//{ value: scope.renderTarget.texture };
			//uniforms[ "mirrorPower" ] = { value: scope.reflect };
			uniforms[ "textureMatrix" ] = { value: textureMatrix };
			uniforms[ "reflectif" ] =  this.userData.reflectif;
			uniforms[ "blackAll" ] = this.userData.blackAll;
			//uniforms[ "shadowPower" ] =  { value: 0.01 };
			shader.uniforms = uniforms;

			//shader.uniforms.reflectif = this.userData.reflectif;

			var vertex = shader.vertexShader;
			vertex = vertex.replace( 'varying vec3 vViewPosition;', ['varying vec3 vViewPosition;', 'varying vec4 vUvR;', 'uniform mat4 textureMatrix;'].join("\n") );
			vertex = vertex.replace( 'vViewPosition = - mvPosition.xyz;', ['vViewPosition = - mvPosition.xyz;', 'vUvR = textureMatrix * vec4( position, 1.0 );'].join("\n") );
			shader.vertexShader = vertex;

			var fragment = shader.fragmentShader;
			fragment = fragment.replace( 'uniform vec3 diffuse;', ['uniform vec3 diffuse;', 'varying vec4 vUvR;', 'uniform float reflectif;', 'uniform sampler2D mirrorMap;', 'uniform int blackAll;'].join("\n") );
			fragment = fragment.replace( '#include <map_fragment>', MapRemplace );
			fragment = fragment.replace( '#include <fog_fragment>', FogRemplace );

			fragment = fragment.replace( '#include <aomap_pars_fragment>', '' );
			fragment = fragment.replace( '#include <aomap_fragment>', '' );
			fragment = fragment.replace( '#include <emissivemap_fragment>', '' );
			fragment = fragment.replace( '#include <clearcoat_normal_fragment_begin>', '' );
			fragment = fragment.replace( '#include <clearcoat_normal_fragment_maps>', '' );
			fragment = fragment.replace( '#include <clearcoat_pars_fragment>', '' );
			fragment = fragment.replace( '#include <bumpmap_pars_fragment>', '' );

			//fragment = fragment.replace( '#include <alphamap_fragment>', '' );

			shader.fragmentShader = fragment;

			Shader.modify( shader );

		}

		Shader.setDefines( this.material )
		
		this.onBeforeRender = function ( renderer, scene, camera ) {

			if( !this.isShow ) return;

			if( _this.isWater ) {
				_this.material.normalMap.offset.x+=0.0005;
				_this.material.normalMap.offset.y+=0.00025;
			}

			reflectorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
			cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

			rotationMatrix.extractRotation( scope.matrixWorld );

			normal.set( 0, 0, 1 );
			normal.applyMatrix4( rotationMatrix );

			viewPos.subVectors( reflectorWorldPosition, cameraWorldPosition );

			// Avoid rendering when reflector is facing away

			if ( viewPos.dot( normal ) > 0 ) return;

			viewPos.reflect( normal ).negate();
			viewPos.add( reflectorWorldPosition );

			rotationMatrix.extractRotation( camera.matrixWorld );

			lookAtPosition.set( 0, 0, - 1 );
			lookAtPosition.applyMatrix4( rotationMatrix );
			lookAtPosition.add( cameraWorldPosition );

			target.subVectors( reflectorWorldPosition, lookAtPosition );
			target.reflect( normal ).negate();
			target.add( reflectorWorldPosition );

			virtualCamera.position.copy( viewPos );
			virtualCamera.up.set( 0, 1, 0 );
			virtualCamera.up.applyMatrix4( rotationMatrix );
			virtualCamera.up.reflect( normal );
			virtualCamera.lookAt( target );

			virtualCamera.far = camera.far; // Used in WebGLBackground

			virtualCamera.updateMatrixWorld();
			virtualCamera.projectionMatrix.copy( camera.projectionMatrix );

			// Update the texture matrix
			textureMatrix.set(
				0.5, 0.0, 0.0, 0.5,
				0.0, 0.5, 0.0, 0.5,
				0.0, 0.0, 0.5, 0.5,
				0.0, 0.0, 0.0, 1.0
			);
			textureMatrix.multiply( virtualCamera.projectionMatrix );
			textureMatrix.multiply( virtualCamera.matrixWorldInverse );
			textureMatrix.multiply( scope.matrixWorld );

			// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
			// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
			reflectorPlane.setFromNormalAndCoplanarPoint( normal, reflectorWorldPosition );
			reflectorPlane.applyMatrix4( virtualCamera.matrixWorldInverse );

			clipPlane.set( reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant );

			var projectionMatrix = virtualCamera.projectionMatrix;

			q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
			q.y = ( Math.sign( clipPlane.y ) + projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
			q.z = - 1.0;
			q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

			// Calculate the scaled plane vector
			clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) );

			// Replacing the third row of the projection matrix
			projectionMatrix.elements[ 2 ] = clipPlane.x;
			projectionMatrix.elements[ 6 ] = clipPlane.y;
			projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
			projectionMatrix.elements[ 14 ] = clipPlane.w;

			// Render

			scope.renderTarget.texture.encoding = renderer.outputEncoding;

			scope.visible = false;

			var currentRenderTarget = renderer.getRenderTarget();
			var currentXrEnabled = renderer.xr.enabled;
			var currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

			renderer.xr.enabled = false; // Avoid camera modification and recursion
			renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows

			renderer.setRenderTarget( scope.renderTarget );

			renderer.state.buffers.depth.setMask( true );// make sure depth buffer is writable

			if( renderer.autoClear === false ) renderer.clear();
			renderer.render( scene, virtualCamera );

			//renderer.outputEncoding = currentEncoding;
			renderer.xr.enabled = currentXrEnabled;
			renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

			renderer.setRenderTarget( currentRenderTarget );

			// Restore viewport

			var viewport = camera.viewport;

			if ( viewport !== undefined ) renderer.state.viewport( viewport );

			

			scope.visible = true;

		}


	}
//}

//Reflector.prototype = Object.create( THREE.Mesh.prototype );
//Reflector.prototype.constructor = THREE.Reflector;

//Reflector.prototype = Object.assign( Object.create( Mesh.prototype ), {

	//constructor: Reflector,

	getRenderTarget () {
		return this.renderTarget;
	}

	setTarget () {

		if( this.renderTarget ) this.renderTarget.dispose();

		var parameters = {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: RGBFormat,
			stencilBuffer: false,
			encoding : this.encoding ? sRGBEncoding : LinearEncoding,
			generateMipmaps:true,
		};

		


		this.renderTarget = new WebGLRenderTarget( this.textureSize, this.textureSize, parameters );
		//this.material.alphaMap = this.renderTarget.texture;

		this.material.userData.mirrorMap.value = this.renderTarget.texture;

	}

	setAlphaMap ( b = true ) {

		if( b === this.settings.gAlpha ) return
		this.settings.gAlpha = b
		this.material.alphaMap = b ? this.alphaMap : null;
		if( b ) this.material.alphaMap.needsUpdate = true;
		this.material.needsUpdate = true;
		
	}

	setSize ( s = [ 200, 200 ] ){

		if( s === this.settings.size ) return
		this.settings.size = s
		this.scale.set( s[0], s[1], 1 )

	}

	setColor ( v ) {

		this.color = v !==undefined ? v : 0xa87232;
		this.material.color.setHex( this.color );

	}

	setMapRepeat ( v ) {
		
		if(!this.map) return;
		this.map.repeat.set( v, v );

	}

	setMap ( v ) {

		this.map = v;
		this.material.map = this.map;
		this.material.needsUpdate = true;

	}

	setWater ( b, repeat, scale ) {

		if( b!==undefined ) this.isWater = b;

		if( this.isWater ) {
			var r = repeat !== undefined ? repeat : this.uv;
			var s = scale !== undefined ? scale : this.normalScale;
			this.material.normalMap = null;//Tools.loadTextures('./textures/terrain/water_n.jpg', { repeat:[r,r], anisotropy:4, generateMipmaps:true });
			this.material.normalScale.set( s, s );
			this.material.roughness = 0.1;
			this.material.metalness = 0.6;
			this.material.side = DoubleSide;
			//console.log('water')
		} else {
			this.material.normalMap = null;
			this.material.roughness = 0.9;
			this.material.metalness = 0.1;
			this.material.side = FrontSide;
		}

	}

	

	setOpacity ( v = 1 ) {

		if( v === this.settings.opacity ) return

		this.settings.opacity = v;
		this.material.opacity = this.settings.opacity;
	    //this.material.transparent = this.settings.opacity < 1 ? true : false;

	}

	setReflect ( v ) {

		this.reflect = v !==undefined ? v : 0.35;
		this.material.userData.reflectif.value = this.reflect;

	}

	show ( b ) {

		this.isShow = b;
		this.visible = b;

	}

	groundAlpha () {

		//if(!this.settings.gAlpha ) return

		let c = document.createElement('canvas');
		c.width = c.height = 512;
        let ctx = c.getContext('2d');

        let grd = ctx.createRadialGradient( 256,256,60, 256,256,250 );

		grd.addColorStop(0, 'white');
		grd.addColorStop(.2, 'white');
		grd.addColorStop(1, 'black');

		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, 512, 512);

		var img = new Image( 512, 512 );
	    img.src = c.toDataURL( 'image/png' )

	    this.alphaMap = new Texture( img )

		this.material.alphaMap = this.alphaMap;//new Texture( img );

		let _this = this;

		img.onload = function(){
			//_this.material.alphaMap = _this.alphaMap;
		    if(_this.material.alphaMap !== null)_this.material.alphaMap.needsUpdate = true; 
		 }


	}

	setBlack ( b ){

		this.isShow = !b  ;
		this.material.userData.blackAll.value = b ? 1 : 0 ;

	}

}
//});

const MapRemplace =/* glsl */`

//vec2 distortion = vec2(0.0);
//vec4 reflector =vec4(0.0);

//vec3 vn = vec3(0.0);

//#ifdef OBJECTSPACE_NORMALMAP

	//vn = texture2D( normalMap, vUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals
	//vn = normalize( normalMatrix * vn );
	//distortion = vn.xz * ( 0.001 + 1.0 / 1.0 ) * 20.0;

	//reflector = texture2D( alphaMap, vUvR.xy / vUvR.w + distortion );

//#endif
 
//vec4 reflector = texture2DProj( alphaMap, vUvR );
vec4 reflector = texture2DProj( mirrorMap, vUvR );

#ifdef USE_MAP

	vec4 texelColor = texture2D( map, vUv );

	texelColor = mapTexelToLinear( texelColor );

	texelColor.rgb = mix( texelColor.rgb, reflector.rgb, reflectif );
	//texelColor.rgb *= mix( vec3(1.0), reflector.rgb, reflectif );
	diffuseColor *= texelColor;

	

	
	
#else

diffuseColor.rgb *= mix( vec3(1.0), reflector.rgb, reflectif );

#endif
//if( blackAll == 1 ) diffuseColor = vec4(0.0, 0.0, 0.0, 1.0);
`;

/*Reflector.ExtraFunction =`

    uniform vec3 diffuse;
    //uniform float mirrorPower;
    //uniform sampler2D tMirror;
    


    /*float blendOverlay( float base, float blend ) {
		return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
	}

	vec3 blendOverlay( vec3 base, vec3 blend ) {
		return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
	}*/
/*`;*/


const FogRemplace =/* glsl */`
if( blackAll == 1 ) gl_FragColor = vec4( vec3(0.0), diffuseColor.a );
#ifdef USE_FOG

	#ifdef FOG_EXP2

		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );

	#else

		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );

	#endif

	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );

#endif
`;