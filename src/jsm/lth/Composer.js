import {
	Vector2, Vector3,
	WebGLMultisampleRenderTarget,
	WebGLRenderTarget,
	LinearFilter,
	RGBAFormat,
	sRGBEncoding
} from '../../../build/three.module.js';



import { EffectComposer } from '../postprocessing/EffectComposer.js';
import { RenderPass } from '../postprocessing/RenderPass.js';
import { ShaderPass } from '../postprocessing/ShaderPass.js';
import { UnrealBloomPass } from '../postprocessing/UnrealBloomPass.js';
import { LUTPass } from '../postprocessing/LUTPass.js';
//import { ClearPass } from '../postprocessing/ClearPass.js';
//import { TexturePass } from '../postprocessing/TexturePass.js';
import { BokehPass } from '../postprocessing/BokehPass.js';


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
			//encoding: sRGBEncoding // ??
		})

		if( renderTarget.samples ) renderTarget.samples = 4

		super( renderer, renderTarget );

		this.v = new Vector3();

		this.torad = Math.PI / 180;
		this.todeg = 180 / Math.PI;

		this.isGl2 = isGl2
		this._pixelRatio = px

		this.scene = scene
		this.camera = camera
		this.controls = controls
		this.size = size

		this._width = size.w;
		this._height = size.h;

		this.enabled = false
		this.needDepth = false
		this.needNormal = false

		this.options = {

			focus: 20.0,
			aperture: 5,
			maxblur: 1,

			threshold:0.85,
			strength:1.5,
			bloomRadius: 0.4,

		}

		this.pass = {}

		this.pass.render = new RenderPass( scene, camera )
		this.addPass( this.pass.render )


		

		this.pass.bloom = new UnrealBloomPass( new Vector2( size.w, size.h ), 1.5, 0.4, 0.85 )
		this.addPass( this.pass.bloom )


		this.lutMap = {}
		this.pass.lut = new LUTPass();
		this.loadLut( 'premium' )
		//this.loadLut( 'indoor/dreams' )
		this.addPass( this.pass.lut )

		this.pass.gamma = new ShaderPass( GammaCorrectionShader )
		this.addPass( this.pass.gamma )


		this.pass.distortion = new ShaderPass( DistortionShader );
		this.setDistortion()
		this.addPass( this.pass.distortion )


		/*
		this.pass.sharpen = new ShaderPass( SharpenShader )
		this.pass.sharpen.setSize = function (w,h){ this.uniforms[ 'resolution' ].value.set(w,h) }
		this.addPass( this.pass.sharpen )
		*/



		if( !this.isGL2 ){
			this.pass.fxaa = new ShaderPass( FXAAShader );
			this.pass.fxaa.setSize = function (w,h){ this.uniforms[ 'resolution' ].value.set(1/w,1/h) }
			this.addPass( this.pass.fxaa )
		}


		//this.pass.focus = new BokehPass( this.scene, this.camera, { focus: 20.0, aperture: 0.025, maxblur: 0.01, width: size.w, height: size.h } );
		//this.addPass( this.pass.focus )

		//this.setSize( this.size.w, this.size.h );

		this.update()
		
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

		if(this.pass.focus){
			this.pass.focus.uniforms[ "focus" ].value = this.options.focus;
			this.pass.focus.uniforms[ "aperture" ].value = this.options.aperture * 0.00001;
			this.pass.focus.uniforms[ "maxblur" ].value = this.options.maxblur * 0.001;
			this.pass.focus.uniforms[ "aspect" ].value = this.camera.aspect;
		}

		

		this.pass.bloom.threshold = this.options.threshold;
		this.pass.bloom.strength = this.options.strength;
		this.pass.bloom.bloomRadius = this.options.bloomRadius;

	}

	loadLut ( name ){

		new LUTCubeLoader().load( 'assets/luts/' + name + '.cube', function ( result ) {

			let n = name.substring( name.lastIndexOf('/')+1, name.lastIndexOf('.') )
			this.lutMap[ n ] = result
			this.setLut( n )

		}.bind(this) );

	}

	setLut ( name ){

		this.pass.lut.lut = this.isGl2 ? this.lutMap[ name ].texture : this.lutMap[ name ].texture3D;;

	}

	resize ( size ) {

		if( !this.enabled ) return;

		this.size = size;

		this.setSize( this.size.w, this.size.h );

	}

	render ( deltaTime ) {

		//let d = this.controls.target.distanceTo( this.camera.position );
		//this.pass.focus.uniforms[ "focus" ].value = d;

		super.render( deltaTime )

	}

}



