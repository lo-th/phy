import {
	PMREMGenerator,
	HalfFloatType,
	UnsignedByteType, LinearFilter,
	Vector3, Vector2, Spherical, RepeatWrapping,
	Color, Mesh, PlaneGeometry, MeshBasicMaterial, Scene, OrthographicCamera, WebGLRenderTarget,
	RGBAFormat, FloatType, EquirectangularReflectionMapping, NoToneMapping, SRGBColorSpace
} from 'three';

import { HDRJPGLoader } from '../libs/HDRJPGLoader.js';
import { RGBELoader } from '../jsm/loaders/RGBELoader.js';
import { EXRLoader } from '../jsm/loaders/EXRLoader.js';
import { GroundProjectedSkybox } from '../jsm/objects/GroundProjectedSkybox.js';
import { ImgTool } from './utils/ImgTool.js';
import { TextureAnalys } from './utils/TextureAnalys.js';
//import { texture, equirectUV } from 'three/nodes';
import { Lights } from './Lights.js';
//import { HDRTool } from './utils/HDRTool.js';

const autoSize = 0.25
const useHalfFloat = true

let gamma = 2.2;
let envName = '';
let autosun = true;
let usePmrem = true;
let isWebGPU = false;

let textureAnalys = null;

let skybox = null;
let needSkybox = false;

/*let sunColor = new Color();
let fogColor = new Color();
let skyColor = new Color();
let groundColor = new Color();
*/
let previewCanvas = null;
let previewPalette = null;
let isPreviewDisplay = false;
let isPaletteDisplay = false;
//let previewData = null;

let pm = null;
let env = null;
let hdr = null;
let pmrem = null;
let floor = null;
//let data = {};
//let palette = {};
let color =  new Color();
let scene = null, renderer = null;

//const s1 = new Spherical();
//const s2 = new Spherical();

//const tmpV = new Vector3();

//let cc = new Color();
//let cc2 = new Color();
//let cc3 = new Color();

let tt = 0;

const tmpSize = new Vector2()
const hdrLoader = new RGBELoader();
const exrLoader = new EXRLoader();
let jpgLoader// = new HDRJPGLoader();

let hdrTool = null;
let useHdrTool = false;
let backIsColor = false;

let main = null



// https://discourse.threejs.org/t/how-to-dispose-scene-background-with-webglrendertarget/19935

//let plane, sceneR, cameraR, targetR = null, read = null, read16 = null

export class Env {

	static setMain (m) { main = m }

	static get () { return env }
	//static getData () { return data }

	static dispose () {

	    if( scene.background && scene.background.dispose ){ scene.background.dispose(); }
	    if( scene.environment && scene.environment.dispose ){ scene.environment.dispose(); }

	    scene.background = null;
		scene.environment = null;
		backIsColor = false;
	    
	    //this.clearTargetRender();
	    if(textureAnalys) textureAnalys.clear()

	    if(skybox) Env.clearProject();

		if( env ) env.dispose();
		if( hdr ) hdr.dispose();
		if( pm ) pm.dispose();
		
		env = null;
		hdr = null;

	}

	static reset () {

		Env.clearProject();
		needSkybox = false;
		
	}

	static clearProject () {

		if(!skybox) return;

		//needSkybox = false;

		scene.remove( skybox );
		//skybox.material.map.dispose()
		skybox.geometry.dispose();
	    skybox = null;

	}

	static project ( radius = 500, height = 100 ) {

		needSkybox = true;
		if(!hdr) return;
		if(skybox) Env.clearProject();

		skybox = new GroundProjectedSkybox( hdr );
		skybox.scale.setScalar( 100 );
		scene.add( skybox );

		skybox.radius = radius;// 200 / 600
		skybox.height = height;// 20 / 50

	}

    static set ( value, callback = ()=>{} ) {

    	Env.dispose()

    	if( typeof value  === 'string' ){
    		if( value !== 'null' ){ 
    			if( value.search('/') !== -1 ) this.load( value, callback )
    			else {
    				envName = value;
    				if( envName.search('_4k') !== -1 ) this.load( './assets/textures/env/'+value+'.jpg', callback, 'jpg' )
    				else this.load( './assets/textures/equirectangular/'+value+'.hdr', callback, 'hdr' )
    			}
    		} else {
    			scene.environment = null;
    			scene.background = null;
    			callback()
    		}
		} else if (!isNaN(value)){
			this.setBackgroud( value );
			callback();
		}

    }

    static setFloorRadius ( v ) {
    	if(!floor) return
    	floor.radius = v;
    }

    static setFloorHeight ( v ) {
    	if(!floor) return
    	floor.height = v;
    }

    static setBlur ( v ) {
    	if(!scene) return
    	scene.backgroundBlurriness = v;
    }

    static addFloor ( v, s=2 ) {

    	console.log('addFloor', v)

    	if( v ){
    		floor = new GroundProjectedEnv( env );
			floor.scale.setScalar( 100 );
			floor.radius = 100;
			floor.height = 10
			scene.add( floor );
    	} else {
    		if(floor){
    			scene.remove( floor )
    		}
    	}

		

		//floor.radius = params.radius;
		//floor.height = params.height;

	}

    static setBackgroud ( c ) {

		if( c !== undefined ){ 
			backIsColor = true;
			scene.background = color.setHex(c);
		} else{ 
			backIsColor = false;
			scene.background = env;
		}

	}

    static init ( Renderer, Scene, Autosun = true ) {

    	if( Renderer ){ 
    		renderer = Renderer;
    		isWebGPU = renderer.isWebGPURenderer || false
    		usePmrem = isWebGPU ? false : usePmrem
    	}
		if( Scene ) scene = Scene
		autosun = Autosun !== undefined ? Autosun : true;
	    if( isWebGPU ) autosun = false

	    if(autosun) textureAnalys = new TextureAnalys( renderer );

	    //if( useHdrTool ) hdrTool = new HDRTool()

	    if( usePmrem ){
			pmrem = new PMREMGenerator( renderer );
			pmrem.compileEquirectangularShader();
		}

		//if( useJpgHdr ){
			jpgLoader = new HDRJPGLoader( renderer );
		//}

	    //this.initTargetRender()

    }

	static async load ( url, callback, type = 'hdr' ) {

		/*data = {
			pos: new Vector3(0,1,0),
			sun: new Color(0xffffff),
			fog: new Color(0x000000),
			envmap:null,
		}*/

		if( type === 'hdr' ) hdr = await hdrLoader.loadAsync( url );
		else if( type === 'exr' ) hdr = await exrLoader.loadAsync( url );
		else if( type === 'jpg' ) {
			//hdr = await jpgLoader.loadAsync( url );

			jpgLoader = new HDRJPGLoader( renderer ).load( url, function ( ) {

				console.log(jpgLoader.width + 'x' + jpgLoader.height)

				let hdrJpgPMREMRenderTarget = pmrem.fromEquirectangular( jpgLoader.renderTarget.texture );
				pmrem.dispose()

				let hdrJpgEquirectangularMap = jpgLoader.toDataTexture();
				hdrJpgEquirectangularMap.mapping = EquirectangularReflectionMapping;
				hdrJpgEquirectangularMap.minFilter = LinearFilter;
				hdrJpgEquirectangularMap.magFilter = LinearFilter;
				hdrJpgEquirectangularMap.generateMipmaps = false;
				hdrJpgEquirectangularMap.needsUpdate = true;

				scene.environment = hdrJpgPMREMRenderTarget.texture;
				scene.background = hdrJpgEquirectangularMap;

				if( callback ) callback()

			})


			return;
		}
		
        //hdr.wrapS = RepeatWrapping;
		//hdr.offset.x = 0.5

		gamma = 2.2
		if(envName==='basic') gamma = 2.68
		if(envName==='alien') gamma = 1.88

		//console.log(hdr)

		Env.process();
		
		if( callback ) callback()

	}

    static process () {

		if( usePmrem ){ 
			pm = pmrem.fromEquirectangular( hdr )
			env = pm.texture;
			pmrem.dispose()
		} else {
			env = hdr;
		    env.mapping = EquirectangularReflectionMapping;
		}
	
		if( scene ) {
			scene.environment = env;
			if( floor ) floor.map = env;
			else {
				if( backIsColor ) scene.background = color;
				else scene.background = env;
			}
			
		}

		if( needSkybox ) Env.project()

		// autosun
		tt = 0
		if(autosun) Env.up()

	}



	static up () {

		if(tt=== 0){
			Env.autoSun()
			Env.upLight()
		}
		tt++
		if(tt<6) tt = 0
		tt = 0
		
	}

	static getCanvas () {

		const ref = textureAnalys.dataPreview;

		if( previewCanvas === null ) previewCanvas = document.createElement("canvas");
		previewCanvas.style.cssText = 'position:absolute; left:10px; bottom:20px; width:'+ref.w+'px; height:'+ref.h+'px; border:1px solid #222;';
        previewCanvas.width = ref.w;
        previewCanvas.height = ref.h;
        let ctx = previewCanvas.getContext("2d")
		let dt = ctx.createImageData( ref.w, ref.h )
		let k = dt.data.length
		while(k--) dt.data[k] = ref.data[k]
		ctx.putImageData( dt, 0, 0 )
		/*ctx.lineWidth = 2;
		ctx.strokeStyle = 'red';
		ctx.beginPath();
		ctx.arc(ref.x, ref.y, 20*autoSize, 0, 2 * Math.PI);
		ctx.stroke()*/
		
	}

	static getPalette () {

		return textureAnalys.palette;//ImgTool.getPalette( previewData )
		
	}

	static preview ( b ) {

		Env.palettePreview( b )

		const ref = textureAnalys.dataPreview//previewData;
		if( ref === null ) return
		if(b){
			if( previewCanvas === null ) previewCanvas = document.createElement("canvas");
			previewCanvas.style.cssText = 'position:absolute; left:10px; bottom:10px; width:'+ref.w+'px; height:'+ref.h+'px; border:1px solid #222;';
	        previewCanvas.width = ref.w;
	        previewCanvas.height = ref.h;
	        let ctx = previewCanvas.getContext("2d")
			let dt = ctx.createImageData( ref.w, ref.h )

			//dt.data = [...ref.data]
			let k = dt.data.length
			while(k--) dt.data[k] = ref.data[k]
			ctx.putImageData( dt, 0, 0 );
			ctx.lineWidth = 2;
			ctx.strokeStyle = 'red';
			ctx.beginPath();
			ctx.arc(ref.x, ref.y, 20*autoSize, 0, 2 * Math.PI);
			ctx.stroke();

			if( !isPreviewDisplay ) {
				document.body.appendChild( previewCanvas )
				isPreviewDisplay = true;
			}
			
		} else {
			if( isPreviewDisplay ){
				document.body.removeChild( previewCanvas )
				isPreviewDisplay = false
			}
		}
	}

	static palettePreview ( b ) {
		
		let size = 25.6
		let n = 0, y = 0, x = 0, d = 5
		//let num = 10 + 4 
		let w = (size * 3) + d
		let h = size * 5
		let palette = textureAnalys.palette;
		

		if(b){
			if( previewPalette === null ) previewPalette = document.createElement("canvas");;
			previewPalette.style.cssText = 'position:absolute; left:271px; bottom:10px; width:'+w+'px; height:'+h+'px; border:1px solid #222;';
			previewPalette.width = w;
	        previewPalette.height = h;
	        const ctx = previewPalette.getContext("2d");

	        ctx.fillStyle = '#000'
			ctx.fillRect(0, 0, w, h);

			for(let m in palette){
				
				if(palette[m]!==undefined){

					x = Math.floor( n / 5 )
					y = (n - (x*5)) 
					
					ctx.fillStyle = palette[m]
					ctx.fillRect(x*size+(x>0? d : 0), y* size, size, size);
					
				}
				
				n++

			}

			if( !isPaletteDisplay ) {
				document.body.appendChild( previewPalette )
				isPaletteDisplay = true;
			}

		} else {

			if( isPaletteDisplay ){
				document.body.removeChild( previewPalette )
				isPaletteDisplay = false
			}

		}

	}

	static autoSun () {

		textureAnalys.run(hdr);
		if( main ) main.setColors( textureAnalys.palette )
		Env.preview( isPreviewDisplay )

	}

	static getFogColor () {
		return textureAnalys.color.fog
	}

	static upLight () {

		let r = textureAnalys;

		//if( !light ) return

		if( scene.fog ) scene.fog.color.copy( r.color.fog )
			
		const dt = {
			sunPos: r.sunPosition.toArray(), //tmpV.setFromSpherical(s1).toArray(),
			sunColor: r.color.sun,
			skyColor: r.color.sky,
			groundColor: r.color.ground, 
		}

		Lights.update( dt );
	
	}


}