import {
	MeshStandardMaterial,
	MeshPhysicalMaterial,
	MeshLambertMaterial,
	MeshBasicMaterial,
	WebGLRenderTarget,
	Mesh,
	PlaneGeometry,
	Plane,
	PerspectiveCamera,
	Matrix4,
	Vector3,
	Vector4,
	LinearFilter,
	SRGBColorSpace,
	DoubleSide,
	FrontSide,
	Texture,
	RepeatWrapping,
	TextureLoader,
	NoToneMapping,
	AdditiveBlending,
	MultiplyBlending,
	Color,
	HalfFloatType,

} from 'three';
import { Shader } from '../Shader.js';
import { Pool } from '../Pool.js';

//import RenderTarget from '../../jsm/renderers/common/RenderTarget.js';

//import WebGPUTextureRenderer from '../jsm/renderers/webgpu/WebGPUTextureRenderer.js';


/**
 * @author Slayvin / http://slayvin.net
 */

//export var Reflector = function ( o ) {
export class Reflector extends Mesh {

	constructor( o = {} ) {

		//let geometry = o.geometry !== undefined ? o.geometry : new PlaneGeometry( 1, 1, 1, 1 );
		//geometry.setAttribute( 'uv2', geometry.attributes.uv );

		//super( geometry );
		super();

		this.geometry = new PlaneGeometry( 1, 1, 1, 1 );
		//this.geometry.setAttribute( 'uv2', this.geometry.attributes.uv );

		//console.log('ground is add')

		this.settings = {
			size: [30,30],
			gAlpha:true,
			opacity:1,

		}

		//this.scale.set( 30, 30, 1 )
		
		this.rotateX( -Math.PI / 2 );
		this.castShadow = false;
		this.receiveShadow = true;

		this.type = 'Reflector';

		this.isShow = true;

		const scope = this;

		o = o || {};

		this.map = o.map || null;
		this.color = o.color || 0x808080;
		this.reflect = o.reflect !== undefined ? o.reflect : 0.4;
		//this.opacity = o.opacity !== undefined ? o.opacity : 1;
		this.isWater = o.water !== undefined ? o.water : false;
		this.uv = o.uv || 1;
		this.normalScale = o.normalScale || 1;

		this.multisample = o.multisample !== undefined ? o.multisample : 4;



		/*if( this.isWater ){ 
			this.material.normalMap = Pool.directTexture('./assets/textures/terrain/water_n.jpg', { flip:false, repeat:[30,30] });
			this.reflect = 1
			//this.opacity = 0.5
		} else {
			this.normalMap = Pool.directTexture('./assets/textures/floor.png', { flip:false, repeat:[200,200] });
		}*/

		//this.normalMap = null

		//if(o.normal){
			//new TextureLoader().load( './assets/textures/floor.png' );
			//this.normalMap.wrapS = this.normalMap.wrapT = RepeatWrapping
			//this.normalMap.repeat.x = this.normalMap.repeat.y = 200
		//}
		
		//normalMap.offset.x=normalMap.offset.y=0.5

		//this.encoding = o.encoding || false;

		this.textureSize = o.textureSize || 512;

		this.renderTarget = null;

		
		const clipBias = o.clipBias || 0;

		const reflectorPlane = new Plane();
		const normal = new Vector3();
		const reflectorWorldPosition = new Vector3();
		const cameraWorldPosition = new Vector3();
		const rotationMatrix = new Matrix4();
		const lookAtPosition = new Vector3( 0, 0, - 1 );
		const clipPlane = new Vector4();

		const view = new Vector3();
		const target = new Vector3();
		const q = new Vector4();

		const textureMatrix = new Matrix4();
		const virtualCamera = new PerspectiveCamera();


		this.material = new MeshStandardMaterial({ //new MeshStandardMaterial({ 
			name:'Ground', 
			color:this.color,
			//emissive:0xFFFFFF,
			//map:this.map, 
			roughness:0.8,//0.25, 
			metalness:0,//1, 
			opacity:1,
			transparent:true,
			depthWrite:false,
			normalMap: null,//this.normalMap,
			dithering:true,
			//blending:AdditiveBlending,
			///blending:MultiplyBlending,
			//aoMap: normalMap,
	        //depthTest: false, 
	        //premultipliedAlpha:true,
	        //format:sRGBEncoding,

		})


		

		//this.material.reflect = o.reflect !== undefined ? o.reflect : 0.35;

		//this.material.color.convertSRGBToLinear();


		this.groundAlpha();
		this.renderOrder = -1;

		//if( this.isWater ) this.setWater();

		this.material.userData = {
			reflectif: { value: this.reflect },
			mirrorMap:{ value: null },
			blackAll:{ value: 0 }
		}


		Object.defineProperty( this.material, 'reflectif', {
			  get() { return this.userData.reflectif.value; },
			  set( value ) { this.userData.reflectif.value = value; }
		});

		this.textureRenderer = null

		this.setTarget();

		const self = this;

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
		
			vertex = vertex.replace( '#include <common>', ['#include <common>', 'varying vec4 vUvR;', 'uniform mat4 textureMatrix;'].join("\n") );
			vertex = vertex.replace( '#include <uv_vertex>', ['#include <uv_vertex>', 'vUvR = textureMatrix * vec4( position, 1.0 );'].join("\n") );
			shader.vertexShader = vertex;

			var fragment = shader.fragmentShader;
			fragment = fragment.replace( 'uniform vec3 diffuse;', ['uniform vec3 diffuse;', 'varying vec4 vUvR;', 'uniform float reflectif;', 'uniform sampler2D mirrorMap;', 'uniform int blackAll;'].join("\n") );
			//fragment = fragment.replace( '#include <map_fragment>', ReflectShader.map_fragment );
			fragment = fragment.replace( '#include <lights_fragment_maps>', ReflectShader.lights_fragment_maps );
			fragment = fragment.replace( '#include <fog_fragment>', ReflectShader.fog_fragment );

			//fragment = fragment.replace( '#include <alphamap_fragment>', ReflectShader.alphamap_fragment );

			//fragment = fragment.replace( '#include <normal_fragment_maps>', ReflectShader.normal_fragment_maps );

			//fragment = fragment.replace( '#include <aomap_pars_fragment>', '' );
			//fragment = fragment.replace( '#include <aomap_fragment>', '' );
			//fragment = fragment.replace( '#include <emissivemap_fragment>', '' );
			//fragment = fragment.replace( '#include <clearcoat_normal_fragment_begin>', '' );
			//fragment = fragment.replace( '#include <clearcoat_normal_fragment_maps>', '' );
			//fragment = fragment.replace( '#include <clearcoat_pars_fragment>', '' );
			fragment = fragment.replace( '#include <bumpmap_pars_fragment>', '' );

			//fragment = fragment.replace( '#include <alphamap_fragment>', '' );

			shader.fragmentShader = fragment;

			Shader.modify( shader );

		}




		Shader.setDefines( this.material )

		//Pool.set( 'Ground', this.material, 'material', true );
		
		this.onBeforeRender = function ( renderer, scene, camera ) {

			if( !this.isShow ) return;
			if( self.reflect === 0 ) return;

			if( self.isWater ) {
				self.material.normalMap.offset.x+=0.0005;
				self.material.normalMap.offset.y+=0.00025;
			}

			let isWebGPU = renderer.isWebGPURenderer || false

			reflectorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
			cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

			rotationMatrix.extractRotation( scope.matrixWorld );

			normal.set( 0, 0, 1 );
			normal.applyMatrix4( rotationMatrix );

			view.subVectors( reflectorWorldPosition, cameraWorldPosition );

			// Avoid rendering when reflector is facing away

			if ( view.dot( normal ) > 0 ) return;

			view.reflect( normal ).negate();
			view.add( reflectorWorldPosition );

			rotationMatrix.extractRotation( camera.matrixWorld );

			lookAtPosition.set( 0, 0, - 1 );
			lookAtPosition.applyMatrix4( rotationMatrix );
			lookAtPosition.add( cameraWorldPosition );

			target.subVectors( reflectorWorldPosition, lookAtPosition );
			target.reflect( normal ).negate();
			target.add( reflectorWorldPosition );

			virtualCamera.position.copy( view );
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

			const projectionMatrix = virtualCamera.projectionMatrix;

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

			scope.visible = false;

			const currentFog = scene.fog;
			const currentRenderTarget = renderer.getRenderTarget();

			const currentXrEnabled = renderer.xr.enabled;
			const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

			scene.fog = null
			if(currentXrEnabled) renderer.xr.enabled = false; // Avoid camera modification and recursion

			// bug with HAIR ????
			//renderer.shadowMap.autoUpdate = false; // Avoid re-computing shadows
			//renderer.toneMapping = NoToneMapping;

			renderer.setRenderTarget( scope.renderTarget );
			
			if( !isWebGPU ) renderer.state.buffers.depth.setMask( true );// make sure depth buffer is writable

			if( renderer.autoClear === false ) renderer.clear();
			renderer.render( scene, virtualCamera );
			
			renderer.xr.enabled = currentXrEnabled;
		    renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;
			//renderer.toneMapping = currentToneMapping;
			scene.fog = currentFog;

			//renderer.shadowMap.needsUpdate = true

			renderer.setRenderTarget( currentRenderTarget );

			// Restore viewport
			const viewport = camera.viewport;
			
			if ( viewport !== undefined ) renderer.state.viewport( viewport );

			scope.visible = true;

		}

	}

	reset(){
		//console.log('reset map')
		if( this.material.map ) this.material.map.dispose()
		//if( this.material.alphaMap ) this.material.alphaMap.dispose()
		if( this.material.normalMap ) this.material.normalMap.dispose()

		//this.groundAutoColor = true;
        //this.material.color = null;
		this.material.map = null;
		//this.material.alphaMap = null;
		this.material.normalMap = null;

	}
//}

//Reflector.prototype = Object.create( THREE.Mesh.prototype );
//Reflector.prototype.constructor = THREE.Reflector;

//Reflector.prototype = Object.assign( Object.create( Mesh.prototype ), {

	//constructor: Reflector,

	dispose() {

		this.onBeforeRender = function (){}

		if( this.material.map ) this.material.map.dispose()
		if( this.material.alphaMap ) this.material.alphaMap.dispose()
		if( this.material.normalMap ) this.material.normalMap.dispose()
		if( this.renderTarget ) this.renderTarget.dispose();

		if( this.parent ) this.parent.remove(this)
		this.geometry.dispose()
		this.material.dispose()

	}

	getRenderTarget () {
		return this.renderTarget;
	}

	setTarget () {

		if( this.renderTarget ) this.renderTarget.dispose();

		/*var parameters = {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			//format: RGBFormat,
			stencilBuffer: false,
			//colorSpace : this.encoding ? SRGBColorSpace : LinearEncoding,
			generateMipmaps:true,
		};*/
		

		var parameters = { samples: this.multisample, type: HalfFloatType }

        this.renderTarget = new WebGLRenderTarget( this.textureSize, this.textureSize, parameters );
		//this.renderTarget = new RenderTarget( this.textureSize, this.textureSize, parameters );
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

	setColor ( v, srgb ) {

		

		//return;
		this.color = v !== undefined ? v : 0xa87232
		this.material.color.setHex( this.color )

		//if(srgb) this.material.color.convertSRGBToLinear()

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
			this.uv = 30
			var r = repeat !== undefined ? repeat : this.uv;
			var s = scale !== undefined ? scale : this.normalScale;
			this.material.normalMap = Pool.texture( { url:'./assets/textures/terrain/water_n.jpg', flip:false, repeat:[r,r] });//null;//Tools.loadTextures('./textures/terrain/water_n.jpg', { repeat:[r,r], anisotropy:4, generateMipmaps:true });
			this.material.normalScale.set( s, s );
			this.material.roughness = 0.;
			this.material.metalness = 0.;
			this.material.opacity = 0.8;
			this.material.side = DoubleSide;
			//console.log('water')
		} else {
			//this.material.normalMap = Pool.texture( { url:'./assets/textures/floor.png', flip:false, repeat:[200,200] });
			//this.material.normalMap.channel = 1;
			//this.material.normalMap = null;
			this.material.roughness = 0.8;//0.8;
			this.material.metalness = 0;//0.2;
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

		this.reflect = v !== undefined ? v : 0.35;
		this.material.userData.reflectif.value = this.reflect;

	}

	show ( b ) {

		this.isShow = b;
		this.visible = b;

	}

	groundAlpha () {

		let c = document.createElement('canvas');
		c.width = c.height = 512;
        let ctx = c.getContext('2d');

        let grd = ctx.createRadialGradient( 256,256, 128, 256,256,256 );

		grd.addColorStop(0, 'white');
		grd.addColorStop(.2, 'white');
		grd.addColorStop(1, 'black');

		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, 512, 512);

		var img = new Image( 512, 512 );
	    img.src = c.toDataURL( 'image/png' )

	    this.alphaMap = new Texture( img )
	   // this.alphaMap.channel = 1;
	    this.material.alphaMap = this.alphaMap;//new Texture( img );

	    img.onload = function (){
		    this.alphaMap.needsUpdate = true;
	    }.bind(this)

	}

	setBlack ( b ){

		this.isShow = !b  ;
		this.material.userData.blackAll.value = b ? 1 : 0 ;

	}

}

const ReflectShader = {

	lights_fragment_maps :/* glsl */`
	#include <lights_fragment_maps>

	if( reflectif != 0.0 ){
		vec3 reflector = texture2DProj( mirrorMap, vUvR ).rgb;

	    //totalEmissiveRadiance.rgb = mix( totalEmissiveRadiance.rgb, totalEmissiveRadiance.rgb + reflector.rgb, reflectif );
	    totalEmissiveRadiance.rgb += reflector * reflectif;
	}
	`,

	map_fragment :/* glsl */`
	#include <map_fragment>

	if( reflectif != 0.0 ){
		vec4 reflector = texture2DProj( mirrorMap, vUvR );
	    diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb + reflector.rgb, reflectif );
	}
	`,

	fog_fragment :/* glsl */`
	#include <fog_fragment>
	if( blackAll == 1 ) gl_FragColor = vec4( vec3(0.0), diffuseColor.a );
	`,

	extra_Function :/* glsl */`

	float blendOverlay( float base, float blend ) {
		return( base < 0.5 ? ( 2.0 * base * blend ) : ( 1.0 - 2.0 * ( 1.0 - base ) * ( 1.0 - blend ) ) );
	}

	vec3 blendOverlay( vec3 base, vec3 blend ) {
		return vec3( blendOverlay( base.r, blend.r ), blendOverlay( base.g, blend.g ), blendOverlay( base.b, blend.b ) );
	}`,

}