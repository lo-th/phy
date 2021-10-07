import {
	Vector2, Vector3,
	WebGLMultisampleRenderTarget,
	WebGLRenderTarget,
	LinearFilter,NearestFilter,
	RGBAFormat,RGBFormat,
	sRGBEncoding
} from '../../../build/three.module.js';

import { Shader } from './Shader.js';
import { Env } from './Env.js'

import { EffectComposer } from '../postprocessing/EffectComposer.js';
import { RenderPass } from '../postprocessing/RenderPass.js';
import { ShaderPass } from '../postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../postprocessing/UnrealBloomPass.js';
import { LUTPass } from '../postprocessing/LUTPass.js';
//import { ClearPass } from '../postprocessing/ClearPass.js';
//import { TexturePass } from '../postprocessing/TexturePass.js';
import { BokehPass } from '../postprocessing/BokehPass.js';

import { SSAOPass } from '../postprocessing/SSAOPass.js';
import { SAOPass } from '../postprocessing/SAOPass.js';


import { CopyShader } from '../shaders/CopyShader.js';
import { FXAAShader } from '../shaders/FXAAShader.js';
import { SharpenShader } from '../shaders/SharpenShader.js';
//import { BokehShader, BokehDepthShader } from '../shaders/BokehShader2.js';
import { GammaCorrectionShader } from '../shaders/GammaCorrectionShader.js';
import { DistortionShader } from '../shaders/DistortionShader.js';

import { LUTCubeLoader } from '../loaders/LUTCubeLoader.js';

export class Composer extends EffectComposer {

	constructor( renderer, scene, camera, controls, size ) {

		let isGl2 = renderer.capabilities.isWebGL2
		let px = renderer.getPixelRatio()
		let RTClass = isGl2 ? WebGLMultisampleRenderTarget : WebGLRenderTarget
		

		const renderTarget = new RTClass( size.w*px, size.h*px, {
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			format: RGBAFormat,
			//encoding: sRGBEncoding
		})

		if( renderTarget.samples ) renderTarget.samples = 4

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

			focus: 20.0,
			aperture: 5,
			maxblur: 1,

			// bloom
			threshold:0.85,
			strength:1.5,
			bloomRadius: 0.4,

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

		this.addPass( this.pass.sao );

		this.pass.sao.enabled = true


		this.lutMap = {}
		this.pass.lut = new LUTPass();
		this.loadLut( 'premium' )
		//this.loadLut( 'indoor/dreams' )
		this.addPass( this.pass.lut )
		this.pass.lut.enabled = false


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

		/*
		this.pass.sharpen = new ShaderPass( SharpenShader )
		this.pass.sharpen.setSize = function (w,h){ this.uniforms[ 'resolution' ].value.set(w,h) }
		this.addPass( this.pass.sharpen )
		this.pass.sharpen.enabled = false
		*/


		/*
		this.pass.focus = new BokehPass( this.scene, this.camera, { focus: 20.0, aperture: 0.2, maxblur: 2, width: size.w, height: size.h } );
		this.addPass( this.pass.focus )
		this.pass.focus.enabled = false
		*/



		this.pass.distortion = new ShaderPass( DistortionShader );
		this.setDistortion()
		this.addPass( this.pass.distortion )
		this.pass.distortion.enabled = false



		this.pass.bloom = new UnrealBloomPass( new Vector2( size.w, size.h ), 1.5, 0.4, 0.85, true, Env )
		this.addPass( this.pass.bloom )
		this.pass.bloom.enabled = true

		

		/*this.pass.gamma = new ShaderPass( GammaCorrectionShader )
		this.addPass( this.pass.gamma )
		this.pass.gamma.enabled = false*/


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
	    this.renderer.setRenderTarget( this.normalTarget )
	    //this.renderer.clear();
	    this.renderer.render( this.scene, this.camera )


	}

	renderDepth () {
		
		//if( !this.needDepth ) return
		//if( this.depthTarget === null  ) this.depthTarget = this.renderTarget.clone()
		Shader.up( {renderMode:1} )
		Env.setBackgroud(0x000000)

	    this.renderer.setRenderTarget( this.depthTarget )
	    //this.renderer.clear();
	    this.renderer.render( this.scene, this.camera )

	}

	renderBeauty() {
		
		//if( this.depthTarget === null  ) this.depthTarget = this.renderTarget.clone()
		Shader.up( {renderMode:0} )
		Env.setBackgroud()

		this.renderer.setRenderTarget( null )

	    //this.renderer.setRenderTarget( this.beautyTarget )
	    //this.renderer.render( this.scene, this.camera )

	}

	setDistortion () {

		//console.log(this.camera.fov)

		let horizontalFOV = 100;//140
		let strength = 0.5;
		let cylindricalRatio = 2;
		let height = Math.tan( ( horizontalFOV * this.torad ) *0.5 ) / this.camera.aspect;

		//this.camera.fov = Math.floor( Math.atan(height) * 2 * this.todeg );
		//this.camera.updateProjectionMatrix();
		//console.log(this.camera.fov)

		this.pass.distortion.uniforms[ "strength" ].value = strength;
		this.pass.distortion.uniforms[ "height" ].value = height;
		this.pass.distortion.uniforms[ "aspectRatio" ].value = this.camera.ratio;
		this.pass.distortion.uniforms[ "cylindricalRatio" ].value = cylindricalRatio;

	}

	update (){

		/*if( this.pass.focus ){
			this.pass.focus.uniforms[ "focus" ].value = this.options.focus;
			this.pass.focus.uniforms[ "aperture" ].value = this.options.aperture// * 0.00001;
			this.pass.focus.uniforms[ "maxblur" ].value = this.options.maxblur// * 0.001;
			this.pass.focus.uniforms[ "aspect" ].value = this.camera.aspect;
		}*/

		if( this.pass.bloom ){
			this.pass.bloom.threshold = this.options.threshold;
			this.pass.bloom.strength = this.options.strength;
			this.pass.bloom.bloomRadius = this.options.bloomRadius; 
		}

		if(this.pass.sao){

			this.pass.sao.params.saoBias = this.options.saoBias
			this.pass.sao.params.saoIntensity = this.options.saoIntensity
			this.pass.sao.params.saoScale = this.options.saoScale
			this.pass.sao.params.saoKernelRadius = this.options.saoKernelRadius
			this.pass.sao.params.saoMinResolution = this.options.saoMinResolution

		}

		/*if(this.pass.ssaoPass){
			this.pass.ssao.kernelRadius = this.options.kernelRadius;
			this.pass.ssao.minDistance = this.options.minDistance;
			this.pass.ssao.maxDistance = this.options.maxDistance;
		}*/

	}

	loadLut ( name ){

		new LUTCubeLoader().load( 'assets/luts/' + name + '.cube', function ( result ) {

			let n = name.substring( name.lastIndexOf('/')+1, name.lastIndexOf('.') )
			this.lutMap[ n ] = result
			this.setLut( n )

		}.bind(this) );

	}

	setLut ( name ){

		this.pass.lut.lut = this.isGl2 ? this.lutMap[ name ].texture : this.lutMap[ name ].texture3D

	}

	resize ( size ) {

		if( !this.enabled ) return;

		this.size = size;
		this.setSize( this.size.w, this.size.h );

	}

	render ( deltaTime ) {

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



