import {
    PMREMGenerator, EquirectangularReflectionMapping, NoToneMapping, IcosahedronGeometry,
    Scene, CubeCamera, WebGLCubeRenderTarget, Mesh,Color,
    LinearFilter, HalfFloatType, LinearSRGBColorSpace, SRGBColorSpace, ShaderMaterial,
} from 'three';
import { HDRJPGLoader } from '../../libs/HDRJPGLoader.js';
import { RGBELoader } from '../../jsm/loaders/RGBELoader.js';
import { EXRLoader } from '../../jsm/loaders/EXRLoader.js';

import { SkyShader, skyOption } from './SkyShader.js';

const torad = Math.PI / 180;

export class Envmap {

	constructor( o = {} ) {

		this.mainScene = o.scene;
		this.renderer = o.renderer;

		this.usePrem = o.usePmrem !== undefined ? o.usePmrem : false;
		this.useBackground = o.useBackground !== undefined ? o.useBackground : true;
		this.envBlur = o.envBlur !== undefined ? o.envBlur : 0;
		this.callback = o.callback || null;
		this.isSky = false;

		 if( this.usePrem ){
	        this.pmremGenerator = new PMREMGenerator( this.renderer );
	        this.pmremGenerator.compileEquirectangularShader();
	    }

		if(o.cube) this.initCubeEnv( o );
		if(o.url) this.load( o.url );
    
	}

	initCubeEnv( o = {} ) {

		this.isCubeEnv = true;
		this._quality = o.quality || 1;

		this.scene = new Scene();
		if(o.color) this.scene.background = new Color(o.color) 
		this.target = new WebGLCubeRenderTarget( 256*this._quality, {
			//magFilter: LinearFilter,
            minFilter: LinearFilter,
            type: HalfFloatType,
            //format: RGBAFormat,
            //colorSpace: LinearSRGBColorSpace,
            colorSpace: SRGBColorSpace, 
            //generateMipmaps: false,
            //depthBuffer: false,
            //generateMipmaps:true,
            anisotropy:1,
        });

        this.camera = new CubeCamera( o.near || 0.1, o.far || 100, this.target );
		this.mainScene.environment = this.target.texture;
		if( this.useBackground ) this.mainScene.background = this.target.texture;

	}

	addSky(){

		let g = new IcosahedronGeometry( 20, 1 )
		const mat = new ShaderMaterial( SkyShader );
		this.sky = new Mesh( g, mat );
		this.scene.add(this.sky);
		this.render();
		this.isSky = true;
		
	}

	getSkyOtion(){

		if(!this.isSky) return;
		return skyOption;

	}

	setSkyOtion( o ){

		if(!this.isSky) return;
		let u = this.sky.material.uniforms;
		for(let k in o){
			if(u[k]) u[k].value = o[k];
		}
	
	    if(this.timeout) clearTimeout(this.timeout);
	    this.timeout = setTimeout( this.render.bind(this), 0 );

	}

	render() {

		if(!this.isCubeEnv) return
		const renderer = this.renderer;
        const lastToneMapping = renderer.toneMapping;
        //const lastToneExposure = renderer.toneMappingExposure;
        renderer.toneMapping = NoToneMapping;
        //renderer.toneMappingExposure = 1.0;

		this.camera.update( renderer, this.scene );
        renderer.toneMapping = lastToneMapping;
        //renderer.toneMappingExposure = lastToneExposure;

	}

	load ( url ) {

		this.name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
	    this.type = url.substring( url.lastIndexOf('.')+1 ).toLowerCase()

		this.loader = null;

		switch( this.type ){
			case 'hdr': 
			    this.loader = new RGBELoader().load( url, this.end.bind(this), null, this.bug.bind(this) );
			break;
			case 'exr':
			    this.loader = new EXRLoader().load( url, this.end.bind(this), null, this.bug.bind(this) );
			break;
			case 'jpg': 
			    this.loader = new HDRJPGLoader( this.renderer ).load( url, this.end.bind(this), null, this.bug.bind(this) );
			break;
		}

	}

	bug () {

		console.log( 'Envmap is not find :', this.name )
		if( this.callback ) this.callback();

	}

	end () {

		let env;

		switch( this.type ){
			case 'hdr': case 'exr':
			    env = this.loader;
			    env.mapping = EquirectangularReflectionMapping;
			break;
			case 'jpg':
			    env = this.loader.renderTarget.texture;
			    env.mapping = EquirectangularReflectionMapping;
			    
			break;
		}

		if( this.usePrem ) {
            
            env = this.pmremGenerator.fromEquirectangular( env ).texture;
            this.pmremGenerator.dispose();

        }

        env.needsUpdate = true;

        const scene = this.isCubeEnv ? this.scene : this.mainScene;

        
		if( this.isCubeEnv || this.useBackground ) scene.background = env;
		if( this.envBlur ) scene.backgroundBlurriness = this.envBlur;
	    scene.environment = env;
	    
        this.loader.dispose();

		if( this.callback ) this.callback();

	}


	get intensity() {
        return this.mainScene.environmentIntensity;
    }
    set intensity(value) {
        this.mainScene.environmentIntensity = value;
    }

    get bgIntensity() {
        return this.mainScene.backgroundIntensity;
    }
    set bgIntensity(value) {
        this.mainScene.backgroundIntensity = value;
    }

    get blur() {
        return this.mainScene.backgroundBlurriness;
    }
    set blur(value) {
        this.mainScene.backgroundBlurriness = value;
    }

    rotate( x=0,y=0,z=0 ) {

        if(x!==0) x *= torad;
        if(y!==0) y *= torad;
        if(z!==0) z *= torad;

        this.mainScene.environmentRotation.set(x,y,z);
        this.mainScene.backgroundRotation.set(x,y,z);

    }

}