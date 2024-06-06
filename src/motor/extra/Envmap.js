import {
    PMREMGenerator, EquirectangularReflectionMapping
} from 'three';
import { HDRJPGLoader } from '../../libs/HDRJPGLoader.js';
import { RGBELoader } from '../../jsm/loaders/RGBELoader.js';
import { EXRLoader } from '../../jsm/loaders/EXRLoader.js';

export class Envmap {

	constructor( o = {} ) {

		const url = o.url;
		this.name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        this.type = url.substring( url.lastIndexOf('.')+1 ).toLowerCase();

		this.scene = o.scene;
		this.renderer = o.renderer;

		this.usePrem = o.usePmrem !== undefined ? o.usePmrem : false;
		this.useBackground = o.useBackground !== undefined ? o.useBackground : true;
		this.callback = o.callback || null;

		 if( this.usePrem ){
	        this.pmremGenerator = new PMREMGenerator( this.renderer );
	        this.pmremGenerator.compileEquirectangularShader();
	    }

		this.load( url );
    
	}

	load ( url ) {

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

		if( this.useBackground ) this.scene.background = env;
        this.scene.environment = env;

        this.loader.dispose();

		if( this.callback ) this.callback();

	}

}