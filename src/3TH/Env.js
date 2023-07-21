import {
	PMREMGenerator,
	HalfFloatType,
	UnsignedByteType, LinearEncoding,
	Vector3, Vector2, Spherical,
	Color, Mesh, PlaneGeometry, MeshBasicMaterial, Scene, OrthographicCamera, WebGLRenderTarget,
	RGBAFormat, FloatType, EquirectangularReflectionMapping, NoToneMapping, SRGBColorSpace
} from 'three';

import { RGBELoader } from '../jsm/loaders/RGBELoader.js';
import { EXRLoader } from '../jsm/loaders/EXRLoader.js';
import { GroundProjectedEnv } from '../jsm/objects/GroundProjectedEnv.js';
import { ImgTool } from './utils/ImgTool.js';
//import { math } from './math.js';
//import { Hub } from './Hub.js'
//import { Main } from '../Main.js'

//import { texture, equirectUV } from 'three/nodes';
import { Lights } from './Lights.js';
//import { HDRTool } from './utils/HDRTool.js';

const autoSize = 0.25

const useHalfFloat = true

let gamma = 2.2
let envName = ''

let usePmrem = true
let isWebGPU = false
let autosun = true

let sunColor = new Color()
let fogColor = new Color()
let skyColor = new Color()
let groundColor = new Color()

let previewCanvas = null
let previewPalette = null
let isPreviewDisplay = false
let isPaletteDisplay = false
let previewData = null

let pm = null
let env = null
let hdr = null
let pmrem = null
let floor = null;
let data = {};
let palette = {};
let color =  new Color();
let scene = null, renderer = null;

const s1 = new Spherical()
const s2 = new Spherical()

const tmpV = new Vector3()

let cc = new Color()
let cc2 = new Color()
let cc3 = new Color()

let tt = 0

const tmpSize = new Vector2()
const hdrLoader = new RGBELoader();
const exrLoader = new EXRLoader();

let hdrTool = null
let useHdrTool = false

let main = null



// https://discourse.threejs.org/t/how-to-dispose-scene-background-with-webglrendertarget/19935

let plane, sceneR, cameraR, targetR = null, read = null, read16 = null

export class Env {

	static setMain (m) { main = m }

	static get () { return env }
	static getData () { return data }

	static dispose () {

	    if( scene.background && scene.background.dispose ){ scene.background.dispose(); }
	    if( scene.environment && scene.environment.dispose ){ scene.environment.dispose(); }

	    scene.background = null
		scene.environment = null
	    
	    this.clearTargetRender()

		if( env ) env.dispose()
		if( hdr ) hdr.dispose()
		if( pm ) pm.dispose()
		//

	//console.log(renderer)
		
		env = null
		hdr = null

		//renderer.dispose()

	}

    static set ( value, callback = ()=>{} ) {

    	Env.dispose()

    	if( typeof value  === 'string' ){
    		if( value !== 'null' ){ 
    			if( value.search('/') !== -1 ) this.load( value, callback )
    			else {
    				envName = value
    				this.load( './assets/textures/equirectangular/'+value+'.hdr', callback )
    			}
    		} else {
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

		//if( c !== undefined ) renderer.setClearColor ( color.setHex(c) ) //
		if( c !== undefined ) scene.background = color.setHex(c);
		else scene.background = env

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

	    //if( useHdrTool ) hdrTool = new HDRTool()

	    if( usePmrem ){
			pmrem = new PMREMGenerator( renderer );
			pmrem.compileEquirectangularShader();
		}

	    //this.initTargetRender()

    }

	static async load ( url, callback, type = 'hdr' ) {

		data = {
			pos: new Vector3(0,1,0),
			sun: new Color(0xffffff),
			fog: new Color(0x000000),
			envmap:null,
		}

		if( type === 'hdr' ) hdr = await hdrLoader.loadAsync( url );
		else if( type === 'exr' ) hdr = await exrLoader.loadAsync( url );

		//console.log(hdr)

		gamma = 2.2
		if(envName==='basic') gamma = 2.68
		if(envName==='alien') gamma = 1.88

		//console.log(hdr)

		Env.process()
		
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
				scene.background = env;

			}
			
		}

		// autosun
		tt = 0
		if(autosun) Env.up()

	}

	/*static processOLD () {

		if( usePmrem ){ 
			pm = pmrem.fromEquirectangular( hdr )
			env = pm.texture;
			pmrem.dispose()
		} else {
			if( isWebGPU ) {
				env = texture( hdr, equirectUV(), 0 );
			} else {
				env = hdr;
			    env.mapping = EquirectangularReflectionMapping;
			}
		}
	
		if( scene ) {
			if( !isWebGPU ) scene.environment = env;
			if( floor ) floor.map = env;
			else { 
				if( isWebGPU ) scene.backgroundNode = env;
				else scene.background = env;
				
			}
			//if( scene.ground ) scene.ground.setColor( data.fog.getHex(), true )
		}

		// autosun
		tt = 0
		if(autosun) Env.up()

	}*/

	

	static initTargetRender (w,h) {

		if( targetR !== null ) return

		plane = new Mesh( new PlaneGeometry( 4, 2 ), new MeshBasicMaterial({ toneMapped: true }) )
		plane.scale.y = -1
		sceneR = new Scene()
		sceneR.add( plane )
		cameraR = new OrthographicCamera( - 2, 2, 1, - 1, 0, 1 )
		//targetR = new WebGLRenderTarget( 1, 1, { /*format: RGBAFormat,*/ type:FloatType } )
		targetR = new WebGLRenderTarget( 1, 1, { format: RGBAFormat, type:useHalfFloat ? HalfFloatType : FloatType } )
		targetR.setSize( w, h )
		//read = new Float32Array( w * h * 4 )
	    read = new Float32Array( w * h * 4 )
		if(useHalfFloat) read16 = new Uint16Array( w * h * 4 )

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
		read16 = null

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
		renderer.readRenderTargetPixels( targetR, 0, 0, w, h, useHalfFloat ? read16 : read )
		if(!useHalfFloat) read = read.map( x => Math.round(x * 255) )
		else {
			//read8 = read.map( x => x  )
			let i = read.length/4, n
			
			while(i--) {
				n = i * 4

				read[n] = this.float16ToNumber(read16[n]) * 255
				read[n+1] = this.float16ToNumber(read16[n+1]) * 255
				read[n+2] = this.float16ToNumber(read16[n+2]) * 255
				read[n+3] = this.float16ToNumber(read16[n+3]) * 255
			}
		//	while(i--) read8[i] = (read[i])
		}
		

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

	static getCanvas () {

		const ref = previewData

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

		return palette;//ImgTool.getPalette( previewData )
		
	}

	static preview ( b ) {

		Env.palettePreview( b )

		const ref = previewData;
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

	static palettePreview ( b ) {
		
		let size = 25.6
		let n = 0, y = 0, x = 0, d = 5
		//let num = 10 + 4 
		let w = (size * 3) + d
		let h = size * 5
		

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

		const d = this.renderTarget( hdr )
		const image = hdr.image
		const w = image.width * autoSize
		const h = image.height * autoSize
		const lng = d.length/4
        const dt = []
		const color = new Uint8ClampedArray( 4 )

		const gammaCorrection = 1 / gamma;

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


		sunColor.setRGB( color[0] * rs, color[1] * rs, color[1] * rs, SRGBColorSpace )//.convertSRGBToLinear()
		fogColor.setRGB( (fr/w)*rs, (fg/w)*rs, (fb/w)*rs, SRGBColorSpace )
		skyColor.setRGB( (cr/w)*rs, (cg/w)*rs, (cb/w)*rs, SRGBColorSpace )//.convertSRGBToLinear()
		groundColor.setRGB( (br/w)*rs, (bg/w)*rs, (bb/w)*rs, SRGBColorSpace )//.convertSRGBToLinear()

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

		palette = ImgTool.getPalette( previewData )//Env.getPalette()

		let extra = {

			sun: '#' + sunColor.getHexString(),
			m: undefined,
			fog: '#' + fogColor.getHexString(),
			
			sky: '#' + skyColor.getHexString(),
			ground: '#' + groundColor.getHexString()

		}

		palette = {...extra, ...palette }


		if( main ) main.setColors( palette )
		

		/*palette['sun'] = '#' + sunColor.getHexString()
		palette['fog'] = '#' + fogColor.getHexString()
		palette['m'] = undefined
		palette['sky'] = '#' + skyColor.getHexString()
		palette['ground'] = '#' + groundColor.getHexString()*/

		//console.log(palette)

		//Env.palettePreview( true )

		Env.preview( isPreviewDisplay )

	}

	static getFogColor () {
		return fogColor
	}

	static upLight () {

		//if( !light ) return

		if( scene.fog ) scene.fog.color.copy( data.fog )
			
		const dt = {
			sunPos: tmpV.setFromSpherical(s1).toArray(),
			sunColor: data.sun,
			skyColor: data.sky,
			groundColor: data.ground, 
		}

		Lights.update( dt );
	
	}

	static float16ToNumber (input) {
	    // Create a 32 bit DataView to store the input
	    const arr = new ArrayBuffer(4);
	    const dv = new DataView(arr);

	    // Set the Float16 into the last 16 bits of the dataview
	    // So our dataView is [00xx]
	    dv.setUint16(2, input, false);

	    // Get all 32 bits as a 32 bit integer
	    // (JS bitwise operations are performed on 32 bit signed integers)
	    const asInt32 = dv.getInt32(0, false);

	    // All bits aside from the sign
	    let rest = asInt32 & 0x7fff;
	    // Sign bit
	    let sign = asInt32 & 0x8000;
	    // Exponent bits
	    const exponent = asInt32 & 0x7c00;

	    // Shift the non-sign bits into place for a 32 bit Float
	    rest <<= 13;
	    // Shift the sign bit into place for a 32 bit Float
	    sign <<= 16;

	    // Adjust bias
	    // https://en.wikipedia.org/wiki/Half-precision_floating-point_format#Exponent_encoding
	    rest += 0x38000000;
	    // Denormals-as-zero
	    rest = (exponent === 0 ? 0 : rest);
	    // Re-insert sign bit
	    rest |= sign;

	    // Set the adjusted float32 (stored as int32) back into the dataview
	    dv.setInt32(0, rest, false);

	    // Get it back out as a float32 (which js will convert to a Number)
	    const asFloat32 = dv.getFloat32(0, false);

	    return asFloat32;
	}

}