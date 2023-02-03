import {
	PMREMGenerator,
	HalfFloatType,
	UnsignedByteType, sRGBEncoding, LinearEncoding,
	Vector3, Vector2, Spherical,
	Color, Mesh, PlaneGeometry, MeshBasicMaterial, Scene, OrthographicCamera, WebGLRenderTarget,
	RGBAFormat, FloatType, EquirectangularReflectionMapping, NoToneMapping
} from 'three';

import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { GroundProjectedEnv } from 'three/addons/objects/GroundProjectedEnv.js';
import { math } from './math.js';

const usePmrem = true
const autoSize = 0.25

let sunColor = new Color()
let fogColor = new Color()
let skyColor = new Color()
let groundColor = new Color()

let previewCanvas = null
let isPreviewDisplay = false
let previewData = null

let pm = null
let env = null
let hdr = null
let pmrem = null
let floor = null;
let data = {};
let color =  new Color();
let light = null, scene = null, renderer = null, light2 = null;

const s1 = new Spherical()
const s2 = new Spherical()

let cc = new Color()
let cc2 = new Color()
let cc3 = new Color()

let tt = 0

const tmpSize = new Vector2()
const hdrLoader = new RGBELoader();

// https://discourse.threejs.org/t/how-to-dispose-scene-background-with-webglrendertarget/19935

let plane, sceneR, cameraR, targetR = null, read = null

export class Env {

	static get () { return env }
	static getData () { return data }

	static dispose () {

	    //if( scene.background && scene.background.dispose ){ scene.background.dispose(); console.log("back dispose !!")}//
	    //if( scene.environment && scene.environment.dispose ){ scene.environment.dispose(); console.log("env dispose !!") } //
	    this.clearTargetRender()

		if( env ) env.dispose()
		if( hdr ) hdr.dispose()
		if( pm ) pm.dispose()
		//
		scene.background = null
		scene.environment = null
		env = null
		hdr = null

		//renderer.dispose()

	}

    static set ( value, callback = ()=>{} ) {

    	Env.dispose()

    	if( typeof value  === 'string' ){
    		if( value !== 'null' ){ 
    			if( value.search('/') !== -1 ) this.load( value, callback )
    			else this.load( './assets/textures/equirectangular/'+value+'.hdr', callback )
    		}
    		else {
    			scene.environment = null;
    			scene.background = null;
    			callback()
    		}
		} else if (!isNaN(value)){
			this.setBackgroud( value )
			callback()
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

		//if( c !== undefined ) renderer.setClearColor ( color.setHex(c) ) //
		if( c !== undefined ) scene.background = color.setHex(c);
		else scene.background = env

	}

    static init ( Renderer, Scene, Light, Light2, autosun ) {

    	if( Renderer ) renderer = Renderer;
		if(Scene) scene = Scene
		if(Light) light = Light
		if(Light2) light2 = Light2
		autosun = autosun !== undefined ? autosun : true;


	    if( usePmrem ){
			pmrem = new PMREMGenerator( renderer );
			pmrem.compileEquirectangularShader();
		}

	    //this.initTargetRender()

    }

    static clearPmrem ( ) {

    	if(!pmrem) return
    	/*let i = pmrem._lodPlanes.length
        while(i--){ 
        	pmrem._lodPlanes[i].dispose()
        }*/

        pmrem._dispose()


    }

	static async load ( url, callback, Renderer, Scene, Light, Light2, autosun ) {

		data = {
			pos: new Vector3(0,1,0),
			sun: new Color(0xffffff),
			fog: new Color(0x000000),
			envmap:null,
		}

		if( Renderer ) renderer = Renderer
		if( Scene ) scene = Scene
		if( Light ) light = Light
		if( Light2 ) light2 = Light2


		autosun = autosun !== undefined ? autosun : true;

		hdr = await hdrLoader.loadAsync( url );//.setDataType(FloatType)
		//hdr.mapping = EquirectangularReflectionMapping;

		//hdr = hdrLoader.load( url, function(){ 


		if( usePmrem ){ 
			//pmrem = new PMREMGenerator( renderer );
			//pmrem.compileEquirectangularShader();
			pm = pmrem.fromEquirectangular( hdr )
			env = pm.texture;
			pmrem.dispose()
			//hdr.dispose()
			//pmrem = null
			//Env.clearPmrem ( )
			//console.log(pmrem)
		} else {
			env = hdr;
			env.mapping = EquirectangularReflectionMapping;
			//texture.encoding = THREE.sRGBEncoding
			//env = texture
		}


		//pmrem.fromEquirectangular( texture ).texture;



		//console.log(texture.encoding, THREE.sRGBEncoding )

		

		//if( autosun ) Env.autoSun( texture.source.data, 'hdr', true );
	
		if( scene ) {
			
			
			scene.environment = env;

			

			if( floor ) floor.map = env;
			else scene.background = env;

			if( scene.ground ) scene.ground.setColor( data.fog.getHex(), true )

			//renderer.background = env;

			//scene.background.visible = false

			//console.log(scene.background)
		}

		if( autosun ) {
			tt = 0
			Env.up()
		}

		//texture.dispose()
		/*if( usePmrem ){ 
			pmrem.dispose()
			//pm.dispose()
		}*/

		if( callback ) callback()


		//})


	}

	

	static initTargetRender (w,h) {

		if( targetR !== null ) return

		plane = new Mesh( new PlaneGeometry( 4, 2 ), new MeshBasicMaterial({ toneMapped: true }) )
		plane.scale.y = -1
		sceneR = new Scene()
		sceneR.add( plane )
		cameraR = new OrthographicCamera( - 2, 2, 1, - 1, 0, 1 )
		targetR = new WebGLRenderTarget( 1, 1, { /*format: RGBAFormat,*/ type:FloatType } )
		targetR.setSize( w, h )
		read = new Float32Array( w * h * 4 )

	}

	static clearTargetRender () {

		if( targetR === null ) return

		if(targetR.texture) targetR.texture.dispose()

		targetR.dispose()
		sceneR.remove( plane )
		plane.material.map.dispose()
		plane.geometry.dispose()
		plane.material.dispose()

		plane = null
		sceneR = null
		cameraR = null
		targetR = null
		read = null

	}

	static renderTarget ( texture ) {

		

		//renderer.getSize( tmpSize )
		//let old = renderer.toneMappingExposure
		//let toneMapping = renderer.toneMapping
		//const originalAutoClear = renderer.autoClear
		//texture.encoding = sRGBEncoding
		//console.log(texture, HalfFloatType)

		
		

		let w = texture.image.width * autoSize
		let h = texture.image.height * autoSize

		//renderer.autoClear = false;

		this.initTargetRender(w,h)

		plane.material.map = texture
		plane.material.needsUpdate = true;
		
		//renderer.setSize( w, h )
		renderer.setRenderTarget( targetR )
		//renderer.outputEncoding = LinearEncoding
		//renderer.toneMapping = NoToneMapping;
		//renderer.toneMappingExposure = old*2.2//1.25 // why ?
		//renderer.toneMapping = THREE.LinearToneMapping//THREE.ACESFilmicToneMapping
		//renderer.clear()

		renderer.render( sceneR, cameraR )

		renderer.setRenderTarget( null )
		//renderer.setSize( tmpSize.x, tmpSize.y )
		//renderer.toneMappingExposure = old
		//renderer.toneMapping = toneMapping
		//renderer.autoClear = originalAutoClear
		//renderer.outputEncoding = sRGBEncoding

		//let read = new Float32Array( w * h * 4 )
		renderer.readRenderTargetPixels( targetR, 0, 0, w, h, read )
		read = read.map( x => Math.round(x * 255) )

		//this.clearTargetRender()

		return read

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

	static preview ( b ) {

		const ref = previewData;
		if( ref === null ) return
		if(b){
			if( previewCanvas === null ) previewCanvas = document.createElement("canvas");
			previewCanvas.style.cssText = 'position:absolute; left:10px; bottom:20px; width:'+ref.w+'px; height:'+ref.h+'px; border:1px solid #222;';
	        previewCanvas.width = ref.w;
	        previewCanvas.height = ref.h;
	        let ctx = previewCanvas.getContext("2d")
			let dt = ctx.createImageData( ref.w, ref.h )
			let k = dt.data.length
			while(k--) dt.data[k] = ref.data[k]
			ctx.putImageData( dt, 0, 0 )
			ctx.lineWidth = 2;
			ctx.strokeStyle = 'red';
			ctx.beginPath();
			ctx.arc(ref.x, ref.y, 20*autoSize, 0, 2 * Math.PI);
			ctx.stroke()

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

	static autoSun () {

		const d = this.renderTarget( hdr )
		const image = hdr.image
		const w = image.width * autoSize
		const h = image.height * autoSize
		const lng = d.length/4
        const dt = []
		const color = new Uint8ClampedArray( 4 )

		const gammaCorrection = 1 / 2.2;

		//const tmpColor = new Color()

		let final = 0, maxId, scale;
		let i = lng, n, r, g, b, a, t, x, y, rs = 1/255, fr=0, fg=0, fb=0;
		let br=0, bg=0, bb=0;
		let cr=0, cg=0, cb=0;
		let max = 0

		while( i-- ){

			n = i*4;

			x = i % w;
			y = Math.floor((i-x)/w);

			scale = 1//Math.pow( 2.0, d[n+3] - 128.0 ) / 255.0;

			/*tmpColor.setRGB( d[n+0], d[n+1], d[n+2]).convertLinearToSRGB()

			r = tmpColor.r
			g = tmpColor.g
			b = tmpColor.b*/

			r = 255 * Math.pow((d[n+0] / 255), gammaCorrection)
			g = 255 * Math.pow((d[n+1] / 255), gammaCorrection)
			b = 255 * Math.pow((d[n+2] / 255), gammaCorrection)

			/*r = d[n+0] * scale
			g = d[n+1] * scale
			b = d[n+2] * scale*/
			a = 255

			t = ( r + g + b );

			if( y === h * 0.5 ){

				fr += r;
				fg += g;
				fb += b;
				
			}

			if( y === h * 0.25 ){

				cr += r;
				cg += g;
				cb += b;
				
			}

			if( y === h * 0.75 ){

				br += r;
				bg += g;
				bb += b;
				
			}

			if( t > max ){ 
				
				color[0] = r;
				color[1] = g;
				color[2] = b;
				color[3] = 255;

				maxId = i;
				max = t;

			}

			dt[n] = r;
			dt[n+1] = g;
			dt[n+2] = b;
			dt[n+3] = 255;

		}

		x = maxId % w;
		y = Math.floor((maxId-x)/w);


		sunColor.setRGB( color[0] * rs, color[1] * rs, color[1] * rs ).convertSRGBToLinear()
		fogColor.setRGB( (fr/w)*rs, (fg/w)*rs, (fb/w)*rs )//.convertSRGBToLinear()
		skyColor.setRGB( (cr/w)*rs, (cg/w)*rs, (cb/w)*rs ).convertSRGBToLinear()
		groundColor.setRGB( (br/w)*rs, (bg/w)*rs, (bb/w)*rs ).convertSRGBToLinear()

		//let sunColor = new Color( color[0] * rs, color[1] * rs, color[1] * rs);
		//let fogColor = new Color( (fr/w)*rs, (fg/w)*rs, (fb/w)*rs )
		//let skyColor = new Color( (cr/w)*rs, (cg/w)*rs, (cb/w)*rs )
		//let groundColor = new Color( (br/w)*rs, (bg/w)*rs, (bb/w)*rs )

		// sun position spherical
		s1.set( 1,  (y / h)*Math.PI, -(x / w)*(Math.PI * 2)-(Math.PI*0.5) )

		data['sun'] = sunColor
		data['fog'] = fogColor
		data['sky'] = skyColor
		data['ground'] = groundColor

		previewData = { data:dt, x:x, y:y, w:w, h:h }

		Env.preview( isPreviewDisplay )

	}

	static getFogColor () {
		return fogColor
	}

	static upLight () {

		if( !light ) return

		if( scene.fog ) scene.fog.color.copy( data.fog )

		//light.position.copy( data.pos ).multiplyScalar( light.distance || 20 );
		light.position.setFromSpherical(s1).multiplyScalar( light.distance || 20 );

		//console.log( light.position )
		light.color.copy( data.sun );
		//light.lookAt( 0, 0, 0 )

		light.target.position.set( 0, 1, 0 )
		light.updateMatrixWorld();

		if( light.helper ) light.helper.update()

		if( !light2 ) return

		light2.color.copy( data.sky );
		light2.groundColor.copy( data.ground );
		if( light2.helper ) light2.helper.update()

	
	}

}