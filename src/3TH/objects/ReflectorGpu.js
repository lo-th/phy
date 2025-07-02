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


import { MeshStandardNodeMaterial } from 'three/webgpu';
import { uniform, Fn, screenUV, uv, texture, color, vec2, vec4, reflector, positionWorld } from 'three/tsl';

//import { Shader } from '../Shader.js';
import { Pool } from '../Pool.js';



//export var Reflector = function ( o ) {
export class ReflectorGpu extends Mesh {

	constructor( o = {} ) {

		const geometry = new PlaneGeometry( 1, 1, 1, 1 );
		const material = new MeshStandardNodeMaterial();

		super(geometry, material);

		this.type = 'Reflector';

		this.isShow = true;

		this.rotateX( - Math.PI / 2 );


		this.settings = {
			size: [30,30],
			gAlpha:true,
			opacity:1,

		}

		this.color = uniform( color( '#808080' ) );

		this.reflect = uniform( o.reflect !== undefined ? o.reflect : 0.4 );
		this.opacity = uniform( o.opacity !== undefined ? o.opacity : 1.0 );

		this.reflection = reflector( { resolution: 1.0 } );
		//reflection.target.rotateX( - Math.PI / 2 );
		this.add( this.reflection.target );

		this.reflectionMask = positionWorld.xz.distance( 0 ).mul( .05 ).clamp().oneMinus();

		this.material.colorNode = vec4( this.color.rgb.add(this.reflection.rgb.mul( this.reflect )), this.reflectionMask.mul( this.opacity ) );
		//this.material.opacity = 1;
		this.material.transparent = true;
		this.material.depthWrite = false;
		//this.material.depthTest = false;
		this.material.roughness = 0.8;

		//this.frustumCulled = false
		this.renderOrder = -1;

		this.receiveShadow = true;


		return

		//console.log('ground is add')

		

		//this.scale.set( 30, 30, 1 )
		
		
		this.castShadow = false;
		this.receiveShadow = true;

		

		const scope = this;

		o = o || {};

		this.map = o.map || null;
		
		
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

	

	}

	raycast(){
		return;
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

		/*this.onBeforeRender = function (){}

		if( this.material.map ) this.material.map.dispose()
		if( this.material.alphaMap ) this.material.alphaMap.dispose()
		if( this.material.normalMap ) this.material.normalMap.dispose()
		if( this.renderTarget ) this.renderTarget.dispose();
*/
		if( this.parent ) this.parent.remove(this)
		this.geometry.dispose()
		this.material.dispose()

	}

	/*getRenderTarget () {
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
		

		/*var parameters = { samples: this.multisample, type: HalfFloatType }

        this.renderTarget = new WebGLRenderTarget( this.textureSize, this.textureSize, parameters );
		//this.renderTarget = new RenderTarget( this.textureSize, this.textureSize, parameters );
		//this.material.alphaMap = this.renderTarget.texture;

		this.material.userData.mirrorMap.value = this.renderTarget.texture;

	}*/

	setAlphaMap ( b = true ) {

		return

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

	setOpacity ( v = 1 ) {

		this.opacity.value = v;

	}

	setReflect ( v ) {

		this.reflect.value = ( v !== undefined ? v : 0.35 );

	}

	setColor ( v, srgb ) {

		this.color.value.setHex(v);

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

		/*if( b!==undefined ) this.isWater = b;

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
		}*/

	}

	

	

	

	show ( b ) {

		return

		this.isShow = b;
		this.visible = b;

	}

	/*groundAlpha () {

		return

		let c = document.createElement('canvas');
		c.width = c.height = 512;
        let ctx = c.getContext('2d');

        let grd = ctx.createRadialGradient( 256, 256, 128, 256, 256, 256 );

		grd.addColorStop(0, 'white');
		grd.addColorStop(.2, 'white');
		grd.addColorStop(1, 'black');

		ctx.fillStyle = grd;
		ctx.fillRect(0, 0, 512, 512);

		var img = new Image( 512, 512 );
	    img.src = c.toDataURL( 'image/png' )

	    this.alphaMap = new Texture( img )
	    this.material.alphaMap = this.alphaMap;

	    img.onload = function (){
		    this.alphaMap.needsUpdate = true;
	    }.bind(this)

	}*/

	setBlack ( b ){

		//this.isShow = !b  ;
		//this.material.userData.blackAll.value = b ? 1 : 0 ;

	}

}

