import {
	Vector2, Vector3
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
//import { BokehShader, BokehDepthShader } from '../shaders/BokehShader2.js';
import { GammaCorrectionShader } from '../shaders/GammaCorrectionShader.js';
import { DistortionShader } from '../shaders/DistortionShader.js';

import { LUTCubeLoader } from '../loaders/LUTCubeLoader.js';

export class Composer extends EffectComposer {

	constructor( renderer, scene, camera, controls, size, renderTarget ) {

		super( renderer, renderTarget );

		this.v = new Vector3();

		this.torad = Math.PI / 180;
		this.todeg = 180 / Math.PI;

		this.isGl2 = renderer.capabilities.isWebGL2;

		this.scene = scene
		this.camera = camera
		this.controls = controls
		this.size = size

		this.pixelRatio = renderer.getPixelRatio()

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

		this.pass.render = new RenderPass( scene, camera );
		//this.pass.render.clear = false;

		/*this.pass.clear = new ClearPass('white', 1.0);

		this.pass.background = new TexturePass();
		this.pass.background.map = this.scene.environment;

		this.pass.copy = new ShaderPass( CopyShader );*/

		//this.scene.background = null;

		this.pass.focus = new BokehPass( this.scene, this.camera, { focus: 20.0, aperture: 0.025, maxblur: 0.01, width: size.w, height: size.h } );
				




		this.pass.bloom = new UnrealBloomPass( new Vector2( size.w, size.h ), 1.5, 0.4, 0.85 )
		/*this.pass.bloom.threshold = 0
		this.pass.bloom.strength = 1.5
		this.pass.bloom.bloomRadius = 0*/

		//this.pass.bloomComposer = new EffectComposer( renderer );
		//this.pass.bloomComposer.renderToScreen = false;

		this.pass.distortion = new ShaderPass( DistortionShader );
		this.setDistortion()



		this.lutMap = {}
		this.pass.lut = new LUTPass();

		this.loadLut( 'premium' )
		//this.loadLut( 'indoor/dreams' )

		this.pass.fxaa = new ShaderPass( FXAAShader );

		this.pass.fxaa.material.uniforms[ 'resolution' ].value.x = 1 / ( size.w * this.pixelRatio );
		this.pass.fxaa.material.uniforms[ 'resolution' ].value.y = 1 / ( size.h * this.pixelRatio );


		this.pass.gamma = new ShaderPass( GammaCorrectionShader )

		//
		//this.addPass( this.pass.clear );
		//this.addPass( this.pass.background );

		this.addPass( this.pass.render )
		
		//this.addPass( this.pass.copy )
		this.addPass( this.pass.bloom )
		
		this.addPass( this.pass.lut )
		this.addPass( this.pass.gamma )



		this.addPass( this.pass.distortion )

		

		this.addPass( this.pass.fxaa )
		
		//this.addPass( this.pass.focus )

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

		this.pass.focus.uniforms[ "focus" ].value = this.options.focus;
		this.pass.focus.uniforms[ "aperture" ].value = this.options.aperture * 0.00001;
		this.pass.focus.uniforms[ "maxblur" ].value = this.options.maxblur * 0.001;
		this.pass.focus.uniforms[ "aspect" ].value = this.camera.aspect;

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

		this.pass.fxaa.material.uniforms[ 'resolution' ].value.x = 1 / ( this.size.w * this.pixelRatio );
		this.pass.fxaa.material.uniforms[ 'resolution' ].value.y = 1 / ( this.size.h * this.pixelRatio );

	}

	render ( deltaTime ) {

		//let d = this.controls.target.distanceTo( this.camera.position );
		//this.pass.focus.uniforms[ "focus" ].value = d;

		super.render( deltaTime )

	}

}



