import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js';
import { LUTCubeLoader } from 'three/addons/loaders/LUTCubeLoader.js';
import { LUT3dlLoader } from 'three/addons/loaders/LUT3dlLoader.js';
import { LUTImageLoader } from 'three/addons/loaders/LUTImageLoader.js';

import { BrightnessContrastShader } from 'three/addons/shaders/BrightnessContrastShader.js';
import { ColorCorrectionShader } from 'three/addons/shaders/ColorCorrectionShader.js';
import { GammaCorrectionShader } from 'three/addons/shaders/GammaCorrectionShader.js';

import { LensDistortionShader } from '../3TH/shaders/LensDistortionShader.js'
import { N8AOPass } from '../libs/N8AO.js';

export class PostProcess {

	constructor ( renderer, scene, camera, view ) {

		this.enabled = false;

		this.lutMap = [
			'premium.cube', 'realism.3dl',
			/*'Bourbon 64.CUBE', 'Chemical 168.CUBE', 'Clayton 33.CUBE',
			'Cubicle 99.CUBE', 'Remy 24.CUBE',
			'Dark_BladeRunner.cube', 'Warm_BladeRunner.cube', 'Cold_BladeRunner.cube',
			'mono1.cube', 'mono2.cube', 'mono3.cube',*/
		];


		this.tmp = {
			lutModel : '',
			screenSpaceRadius:false,
		}

		this.option = {

			colorCorrection:true,

			brightness:0.0,
			contrast:0.2,

			// lut
			lut:true,
			lutIntensity : 0.5,
			lutModel:'Realism.3dl',

			//smaa
			smaa:true,

			// bloom
			bloom:true,
			threshold : 0.5,
			strength : 0.1,
			radius : 0.1,

			// n8ao
			n8ao:true,
	        
	        aoRadius: 1.5,//5.0,
	        distanceFalloff: 1.5, //1.0,
	        intensity: 3.5,
	        
	        aoTones: 0.0,
	        aoSamples: 16.0,
	        denoiseSamples: 8.0,
	        denoiseRadius: 12.0,

	        debugAo:false,
	        screenSpaceRadius:false,
	        denoiseIterations: 2.0,
	        
	        halfRes: false,
	        depthAwareUpsampling: false,
	        transparencyAware: true,
	        
	        renderMode: "Combined",
	        color: [0, 0, 0],
	        colorMultiply: true,
	        gammaCorrection:false,
	        stencil: true,
	        accumulate: false,
	    };

		const pixelRatio = view.px; //window.PixelRatio; //renderer.getPixelRatio();

		const composer = new EffectComposer(renderer);
		this.composer = composer;

		const renderPass = new RenderPass( scene, camera );
		

		/*const gtaoPass = new GTAOPass( scene, camera, view.w, view.h );
		//gtaoPass.output = GTAOPass.OUTPUT.Denoise;
		gtaoPass.output =GTAOPass.OUTPUT.Default
		composer.addPass( gtaoPass );

		

		return*/

	    const n8aopass = new N8AOPass( scene, camera, view.w, view.h );
	    n8aopass.enableDebugMode();

	    const smaaPass = new SMAAPass(view.w, view.h);
	    /*const fxaaPass = new ShaderPass( FXAAShader );
	    fxaaPass.material.uniforms[ 'resolution' ].value.x = 1 / ( view.w * pixelRatio );
		fxaaPass.material.uniforms[ 'resolution' ].value.y = 1 / ( view.h * pixelRatio );
		*/
	    

	    

	    const bloomPass = new UnrealBloomPass( new THREE.Vector2( view.w, view.h ), 1.5, 0.4, 0.85 );
		bloomPass.threshold = 0.5;
		bloomPass.strength = 0.1;
		bloomPass.radius = 0.1;

		

	    const lutPass = new LUTPass();



	    const colorPass = new ShaderPass( ColorCorrectionShader );

	    colorPass.material.uniforms.addRGB.value.set(0,0,0)
	    colorPass.material.uniforms.mulRGB.value.set(1,1,1)
	    colorPass.material.uniforms.powRGB.value.set(2,2,2)

	    const contrastPass = new ShaderPass( BrightnessContrastShader );

	    const gammaPass = new ShaderPass( GammaCorrectionShader );

	    const outputPass = new OutputPass();

	    


	    //console.log(gammaPass.material.uniforms)



	    composer.addPass( renderPass );

		composer.addPass( n8aopass );
		//composer.addPass(fxaaPass);		
	    
	    composer.addPass( bloomPass )
		composer.addPass( outputPass );
		composer.addPass( smaaPass );
		composer.addPass( lutPass );
		/*composer.addPass( colorPass );
		composer.addPass( contrastPass );
		composer.addPass( gammaPass );*/

		this.renderPass = renderPass
		this.lutPass = lutPass;
	    this.smaaPass = smaaPass;
	    //this.fxaaPass = fxaaPass;
	    this.n8aopass = n8aopass;
	    this.bloomPass = bloomPass;
	    this.contrastPass = contrastPass;
	    this.colorPass = colorPass;

	    this.pixelRatio = pixelRatio

	    this.upOption()
	    

	}

	async loadLut( url ){

		let type = url.substring( url.lastIndexOf('.')+1 ).toLowerCase();
		
		let loader;
		switch(type){
			case'cube': loader = new LUTCubeLoader(); break;
			case'3dl': loader = new LUT3dlLoader(); break;
			case'png': loader = new LUTImageLoader(); break;
		}

		const [ lut ] = await Promise.all( [ loader.loadAsync( './assets/luts/' + url ) ]);
		this.tmp.lutModel = url;
		this.lutPass.lut = lut.texture3D;

	}

	upOption(){

		const renderPass = this.renderPass;
		const n8aopass = this.n8aopass;
		const contrastPass = this.contrastPass;
		const colorPass = this.colorPass;
		const smaaPass = this.smaaPass;
		const bloomPass = this.bloomPass;
		const lutPass = this.lutPass;
		const option = this.option;
		const tmp = this.tmp;


		colorPass.enabled = option.colorCorrection

		contrastPass.material.uniforms.brightness.value = option.brightness
	    contrastPass.material.uniforms.contrast.value = option.contrast


		// LUT
		lutPass.enabled = option.lut;
		lutPass.intensity = option.lutIntensity;
		if( option.lutModel !== tmp.lutModel ) this.loadLut(option.lutModel);


		// BLOOM
		bloomPass.enabled = option.bloom;
		bloomPass.threshold = option.threshold;
		bloomPass.strength = option.strength;
		bloomPass.radius = option.radius;

		// N8AO
		n8aopass.enabled = option.n8ao;
		renderPass.enabled = !option.n8ao
		n8aopass.configuration.gammaCorrection = option.gammaCorrection
		n8aopass.configuration.aoRadius = option.aoRadius;
        n8aopass.configuration.aoSamples = option.aoSamples;
        n8aopass.configuration.aoTones = option.aoTones;
        n8aopass.configuration.distanceFalloff = option.distanceFalloff;
        n8aopass.configuration.transparencyAware = option.transparencyAware;
        n8aopass.configuration.intensity = option.intensity;
        n8aopass.configuration.denoiseRadius = option.denoiseRadius;
        n8aopass.configuration.denoiseSamples = option.denoiseSamples;
        n8aopass.configuration.denoiseIterations = option.denoiseIterations;
        n8aopass.configuration.stencil = option.stencil;
        n8aopass.configuration.renderMode = option.debugAo ? 1 : 0;
        n8aopass.configuration.color = new THREE.Color(option.color[0], option.color[1], option.color[2]);
        n8aopass.configuration.screenSpaceRadius = option.screenSpaceRadius;
        n8aopass.configuration.halfRes = option.halfRes;
        n8aopass.configuration.depthAwareUpsampling = option.depthAwareUpsampling;
        n8aopass.configuration.colorMultiply = option.colorMultiply;
        n8aopass.configuration.accumulate = option.accumulate;

        if(option.screenSpaceRadius !== tmp.screenSpaceRadius){
        	tmp.screenSpaceRadius = option.screenSpaceRadius;
	        if(option.screenSpaceRadius){
				option.aoRadius = 48.0;
	            option.distanceFalloff = 0.2;
			} else {
				option.aoRadius = 5.0;
	            option.distanceFalloff = 1.0;
			}
		}

		// SMAA
		smaaPass.enabled = option.smaa

	}

	resize(v){
		if( !this.enabled ) return;
	    this.composer.setSize(v.w, v.h);
	    //if(this.fxaaPass) this.fxaaPass.material.uniforms[ 'resolution' ].value.set(1 / ( v.w * this.pixelRatio ), 1 / ( v.h * this.pixelRatio ))
	}

    dispose() {
		this.enabled = false;
		//super.dispose();
	}

	render(){
		this.composer.render()
	}

}