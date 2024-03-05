import {
	Vector2, Vector3,
	//WebGLMultisampleRenderTarget,
	WebGLRenderTarget,
	LinearFilter,
	NearestFilter,
	RGBAFormat,
	FloatType
} from 'three';

import { Shader } from './Shader.js';
import { Env } from './Env.js'

import { EffectComposer } from '../jsm/postprocessing/EffectComposer.js';
import { RenderPass } from '../jsm/postprocessing/RenderPass.js';
import { ShaderPass } from '../jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../jsm/postprocessing/UnrealBloomPass.js';
import { LUTPass } from '../jsm/postprocessing/LUTPass.js';
//import { ClearPass } from '../postprocessing/ClearPass.js';
//import { TexturePass } from '../postprocessing/TexturePass.js';
import { BokehPass } from '../jsm/postprocessing/BokehPass.js';

import { SSAOPass } from '../jsm/postprocessing/SSAOPass.js';
import { SAOPass } from '../jsm/postprocessing/SAOPass.js';

import { CopyShader } from '../jsm/shaders/CopyShader.js';
import { FXAAShader } from '../jsm/shaders/FXAAShader.js';

//import { BokehShader, BokehDepthShader } from '../shaders/BokehShader2.js';
import { GammaCorrectionShader } from '../jsm/shaders/GammaCorrectionShader.js';

import { BloomMix } from '../jsm/shaders/BloomMix.js';

import { ToneMapShader } from '../jsm/shaders/ToneMapShader.js';

import { LUTCubeLoader } from '../jsm/loaders/LUTCubeLoader.js';
import { LUT3dlLoader } from '../jsm/loaders/LUT3dlLoader.js';

import { DistortionShader } from './shaders/DistortionShader.js';
import { SharpenShader } from './shaders/SharpenShader.js';

export class Composer extends EffectComposer {

	constructor( renderer, scene, camera, controls, size ) {

		let isGl2 = renderer.capabilities.isWebGL2
		let px = renderer.getPixelRatio()

		/*const sizeFX = renderer.getDrawingBufferSize( new THREE.Vector2() );
		console.log( sizeFX, size.w*px, size.h*px )
		//let RTClass = WebGLRenderTarget
*/
		const renderTarget = new WebGLRenderTarget( size.w*px, size.h*px , {
			//minFilter: LinearFilter,
			//magFilter: LinearFilter,
			//format: RGBAFormat,//??? slow down
			//encoding: sRGBEncoding,
			//type:FloatType ,
		})

		if( renderTarget.samples ){ 
			//renderer.autoClear = false;
			//renderTarget.samples = 4
		}

		super( renderer, renderTarget );

	    this.renderTarget = renderTarget;

	    //this.needNormal = false
	    //this.needDepth = false

	    this.normalTarget = renderTarget.clone()
	    this.depthTarget = renderTarget.clone()
	    //this.beautyTarget = renderTarget.clone()

	    this.normalTarget.texture.minFilter = NearestFilter
	    this.normalTarget.texture.magFilter = NearestFilter
	    //this.normalTarget.texture.format=RGBFormat

	    //this.saoEnable = true

	    this.lutCubeLoader = null;
	    this.lut3DLoader = null;


		this.v = new Vector3();

		this.torad = Math.PI / 180;
		this.todeg = 180 / Math.PI;

		this.isGl2 = isGl2
		this._pixelRatio = px

		this.scene = scene
		this.camera = camera
		this.controls = controls
		this.size = size

		this._width = size.w
		this._height = size.h

		this.enabled = false

		this.options = {

			// focus
			focus: 2.0,
			aperture: 2.5,
			maxblur: 0.01,

			// bloom
			threshold:0.85,
			strength:1.5,
			bloomRadius: 0,


			// sao
			saoBias:0.5,
			saoIntensity:0.06,
			saoScale:40,
			saoKernelRadius:50,
			saoMinResolution:0,

			// ssao
			kernelRadius:0.1,
			minDistance:0.0001,
			maxDistance:2,

			// distortion
			horizontal: 100,
			distortion:0.5,
			cylindrical: 1,


			// lut
			lutIntensity:1,

			// sharpen
			power: 0.1,

		}

		this.pass = {}

		this.pass.render = new RenderPass( scene, camera )
		this.addPass( this.pass.render )


		// SAO PASS
		this.pass.sao = new SAOPass( scene, camera, this.isGl2, true );
		this.pass.sao.params = {
			output: 0,
			saoBias: this.options.saoBias,//0.5,
			saoIntensity: this.options.saoIntensity,
			saoScale: this.options.saoScale,//1,
			saoKernelRadius: this.options.saoKernelRadius,//100,
			saoMinResolution: this.options.saoMinResolution,
			saoBlur: true,
			saoBlurRadius: 4,//8,
			saoBlurStdDev: 2,//4,
			saoBlurDepthCutoff: 0.01,//0.01
		}

		this.pass.sao.setNormalTarget( this.normalTarget )
		if(!this.isGl2) this.pass.sao.setDepthTarget( this.depthTarget )

		this.pass.sao.enabled = true

		this.lutMap = null
		this.pass.lut = new LUTPass()
		//this.loadLut( 'premium', 'cube' )
		this.loadLut( 'realism', '3dl' )

		this.pass.lut.intensity = this.options.lutIntensity
		
		this.pass.lut.enabled = true


		// SSAO PASS
		/*this.pass.ssao = new SSAOPass( scene, camera, this._width, this._height, true );
		this.pass.ssao.output = 0
		this.pass.ssao.kernelRadius = this.options.kernelRadius;
		this.pass.ssao.minDistance = this.options.minDistance;
		this.pass.ssao.maxDistance = this.options.maxDistance;

		this.pass.ssao.setNormalTarget( this.normalTarget )
		this.pass.ssao.setDepthTarget( this.depthTarget )
		this.pass.ssao.setBeautyTarget( this.beautyTarget )
		this.addPass( this.pass.ssao );*/

		
		this.pass.sharpen = new ShaderPass( SharpenShader )
		this.pass.sharpen.setSize = function (w,h){ this.uniforms[ 'resolution' ].value.set(w,h) }	
		this.pass.sharpen.enabled = false
		

		
		this.pass.focus = new BokehPass( this.scene, this.camera, { focus: 20.0, aperture: 0.2, maxblur: 2, width: size.w, height: size.h } );
		this.addPass( this.pass.focus )
		this.pass.focus.enabled = false
		



		this.pass.distortion = new ShaderPass( DistortionShader );
		this.pass.distortion.enabled = true



		/*this.pass.bloom = new UnrealBloomPass( new Vector2( size.w, size.h ), 1.5, 0.4, 0.85, true, Env )
		
		this.pass.bloom.enabled = true*/

		this.bloomPass = new UnrealBloomPass( new Vector2( size.w, size.h ), this.options.strength, this.options.bloomRadius, this.options.threshold, true )
		this.bloomPass.enabled = true

		this.bloomComposer = new EffectComposer( renderer, renderTarget )
		this.bloomComposer.renderToScreen = false
		this.bloomComposer.addPass( this.pass.render )
		this.bloomComposer.addPass( this.bloomPass )



		this.pass.bloom = new ShaderPass( BloomMix )
		this.pass.bloom.enabled = true
		this.pass.bloom.needsSwap = true
		this.pass.bloom.uniforms[ "bloomTexture" ].value = this.bloomComposer.renderTarget2.texture;






		
		this.addPass( this.pass.bloom )
		this.addPass( this.pass.sao )
		this.addPass( this.pass.distortion )
		this.addPass( this.pass.lut )
		this.addPass( this.pass.sharpen )
		this.addPass( this.pass.focus )

		/*this.pass.tone = new ShaderPass( ToneMapShader )
		this.addPass( this.pass.tone )
		this.pass.tone.enabled = true

		this.pass.gamma = new ShaderPass( GammaCorrectionShader )
		this.addPass( this.pass.gamma )
		this.pass.gamma.enabled = true*/


		if( !this.isGl2 ){
			this.pass.fxaa = new ShaderPass( FXAAShader );
			this.pass.fxaa.setSize = function (w,h){ this.uniforms[ 'resolution' ].value.set(1/w,1/h) }
			this.addPass( this.pass.fxaa )
		}


		

		//this.setSize( this.size.w, this.size.h );
		this.update()
		
	}


	renderNormal () {

		//if( !this.needNormal ) return
		//if( this.normalTarget === null  ) this.normalTarget = this.renderTarget.clone()
		Shader.up( {renderMode:2} )
		Env.setBackgroud(0x7777ff)
		this.scene.helper.visible = false
	    this.renderer.setRenderTarget( this.normalTarget )
	    //this.renderer.clear();
	    this.renderer.render( this.scene, this.camera )


	}

	renderDepth () {
		
		//if( !this.needDepth ) return
		//if( this.depthTarget === null  ) this.depthTarget = this.renderTarget.clone()
		Shader.up( {renderMode:1} )
		Env.setBackgroud(0x000000)
		this.scene.helper.visible = false

	    this.renderer.setRenderTarget( this.depthTarget )
	    //this.renderer.clear();
	    this.renderer.render( this.scene, this.camera )

	}

	renderBeauty() {
		
		//if( this.depthTarget === null  ) this.depthTarget = this.renderTarget.clone()
		Shader.up( {renderMode:0} )
		Env.setBackgroud()
		this.scene.helper.visible = true

		this.renderer.setRenderTarget( null )

	    //this.renderer.setRenderTarget( this.beautyTarget )
	    //this.renderer.render( this.scene, this.camera )

	}

	

	

	update (){

		if( this.pass.focus ){
			this.pass.focus.uniforms[ "focus" ].value = this.options.focus;//this.camera.dist //
			this.pass.focus.uniforms[ "aperture" ].value = this.options.aperture * 0.001;
			this.pass.focus.uniforms[ "maxblur" ].value = this.options.maxblur;
			//this.pass.focus.uniforms[ "aspect" ].value = this.camera.aspect;
		}

		if( this.bloomPass ){
			this.bloomPass.threshold = this.options.threshold;
			this.bloomPass.strength = this.options.strength;
			this.bloomPass.radius = this.options.bloomRadius; 

			this.bloomPass.applyValue()

		}

		/*if( this.pass.bloom ){
			this.pass.bloom.threshold = this.options.threshold;
			this.pass.bloom.strength = this.options.strength;
			this.pass.bloom.bloomRadius = this.options.bloomRadius; 
		}*/

		if(this.pass.sao){

			this.pass.sao.params.saoBias = this.options.saoBias
			this.pass.sao.params.saoIntensity = this.options.saoIntensity
			this.pass.sao.params.saoScale = this.options.saoScale
			this.pass.sao.params.saoKernelRadius = this.options.saoKernelRadius
			this.pass.sao.params.saoMinResolution = this.options.saoMinResolution

			this.pass.sao.applyValue()
		}

		if(this.pass.sharpen){
			this.pass.sharpen.uniforms[ "power" ].value = this.options.power
		}

		this.setDistortion()

		

		/*if(this.pass.ssaoPass){
			this.pass.ssao.kernelRadius = this.options.kernelRadius;
			this.pass.ssao.minDistance = this.options.minDistance;
			this.pass.ssao.maxDistance = this.options.maxDistance;
		}*/

	}


	setDistortion () {

		if(!this.pass.distortion) return

		const o = this.options

	    //console.log(this.camera, this.camera.ratio)

		let horizontalFOV = o.horizontal;
		let strength = o.distortion;
		let cylindricalRatio = o.cylindrical;
		let height = Math.tan( ( horizontalFOV * this.torad ) * 0.5 ) / this.camera.aspect;

		//this.camera.fov = Math.floor( Math.atan(height) * 2 * this.todeg );
		//this.camera.updateProjectionMatrix();
		//console.log(this.camera.fov)

		this.pass.distortion.uniforms[ "strength" ].value = strength;
		this.pass.distortion.uniforms[ "height" ].value = height;
		this.pass.distortion.uniforms[ "aspectRatio" ].value = this.camera.aspect//this.camera.ratio;
		this.pass.distortion.uniforms[ "cylindricalRatio" ].value = cylindricalRatio;

	}




	changeLut ( txt, name, type ) {

		type = type.toLowerCase()

		if( this.lutMap !== null ){
			if(this.lutMap.texture)this.lutMap.texture.dispose()
			if(this.lutMap.texture3D)this.lutMap.texture3D.dispose()
		}

		switch(type){
			case 'cube':
				if( this.lutCubeLoader === null ) this.lutCubeLoader = new LUTCubeLoader();
				this.lutMap = this.lutCubeLoader.parse( txt )
			break;
			case '3dl':
				if( this.lut3DLoader === null ) this.lut3DLoader = new LUT3dlLoader();
				this.lutMap = this.lut3DLoader.parse( txt )
			break;
		}

		this.setLut()

	}

	loadLut ( name, type ){

		switch(type){
			case 'cube':
				if( this.lutCubeLoader === null ) this.lutCubeLoader = new LUTCubeLoader();
				this.lutCubeLoader.load( 'assets/luts/' + name + '.cube', function ( result ) {
					this.lutMap = result
					this.setLut()
				}.bind(this) );
			break;
			case '3dl':
				if( this.lut3DLoader === null ) this.lut3DLoader = new LUT3dlLoader();
				this.lut3DLoader.load( 'assets/luts/' + name + '.3dl', function ( result ) {
						this.lutMap = result
						this.setLut()
				}.bind(this) );
			break;
		}

	}

	setLut (){

		this.pass.lut.lut = this.isGl2 ? this.lutMap.texture : this.lutMap.texture3D

	}

	resize ( size ) {

		if( !this.enabled ) return;

		this.size = size;
		this.setSize( this.size.w, this.size.h )
		this.bloomComposer.setSize( this.size.w, this.size.h )

	}

	dispose() {
		this.enabled = false
	}

	render ( deltaTime ) {


		if( this.pass.bloom.enabled ){ 
			this.bloomPass.enabled = true

			Env.setBackgroud(0x000000)
			this.scene.helper.visible = false
			if( this.scene.ground ) this.scene.ground.setBlack( true )
			this.bloomComposer.render( deltaTime )
		    if( this.scene.ground ) this.scene.ground.setBlack( false )
		    this.scene.helper.visible = true
			Env.setBackgroud()
		} else {
			this.bloomPass.enabled = false
		}

		if( this.pass.sao.isDirectNormal || this.pass.sao.isDirectDepth ){

			this.renderNormal()
	       // this.renderDepth()
	        this.renderBeauty()

		}



		//Env.setBackgroud(0x111111)

		
		//let d = this.controls.target.distanceTo( this.camera.position );
		//this.pass.focus.uniforms[ "focus" ].value = d;

		super.render( deltaTime )

	}

}



