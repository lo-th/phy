import {
	Scene, Mesh, PlaneGeometry, MeshBasicMaterial, OrthographicCamera, WebGLRenderTarget,
	RGBAFormat, HalfFloatType, FloatType, Color, Spherical, Vector3, SRGBColorSpace
} from 'three';

import { ImgTool } from './ImgTool.js';

export class TextureAnalys {
	
	constructor ( renderer ) {

		this.previewH = 128;
		this.useHalfFloat = true;
		this.gamma = 1//2.2;
		this.renderer = renderer;

		this.sunSpherical = new Spherical();
		this.sunPosition = new Vector3(0,1,0);

		this.dataPreview = null;
		this.palette = {};

		this.color = {
			sun: new Color(1,1,1),
			fog: new Color(0.5,0.5,0.5),
			sky: new Color(0,0,0),
			ground: new Color(0,0,0),
		}

	}

	init ( w, h, texture ) {

		if( this.target ) return

		this.plane = new Mesh( new PlaneGeometry( 1, 1 ), new MeshBasicMaterial({ map:texture, toneMapped:false }) );
		this.plane.scale.y = -1;
		this.scene = new Scene();
		this.scene.add( this.plane );
		this.camera = new OrthographicCamera( -0.5, 0.5, 0.5, -0.5, 0, 1 );
		this.target = new WebGLRenderTarget( w, h, { format: RGBAFormat, type:this.useHalfFloat ? HalfFloatType : FloatType } );
	    this.read = this.useHalfFloat ? new Uint16Array( w * h * 4 ) : new Float32Array( w * h * 4 );

	}

	clear () {

		this.sunPosition.set(0,1,0);
		this.color.sun.set(1,1,1);
		this.color.fog.set(0.5,0.5,0.5);
		this.color.sky.set(0,0,0);
		this.color.ground.set(0,0,0);

		this.dataPreview = null;
		this.palette = {};

		if( !this.target ) return

		if(this.target.texture) this.target.texture.dispose();
		this.target.dispose();
		this.scene.remove( this.plane );
		this.plane.material.map.dispose();
		this.plane.geometry.dispose();
		this.plane.material.dispose();
		this.plane = null;
		this.scene = null;
		this.camera = null;
		this.target = null;
		this.read = null;

	}

	render ( texture, w, h ) {

		this.init( w, h, texture );
		this.renderer.setRenderTarget( this.target )
		this.renderer.render( this.scene, this.camera );
		this.renderer.setRenderTarget( null );
		this.renderer.readRenderTargetPixels( this.target, 0, 0, w, h, this.read );
		const colors = [];
		if( this.useHalfFloat ){
			let i = this.read.length/4, n;
			while(i--) {
				n = i * 4;
				colors[n] = this.float16ToNumber(this.read[n]) * 255;
				colors[n+1] = this.float16ToNumber(this.read[n+1]) * 255;
				colors[n+2] = this.float16ToNumber(this.read[n+2]) * 255;
				colors[n+3] = this.float16ToNumber(this.read[n+3]) * 255;
			}
		} else {
			 colors = this.read.map( x => Math.round(x * 255) )
		}

		return colors;

	}


	float16ToNumber (input) {

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
	    return dv.getFloat32(0, false);

	}

	run ( texture ) {

		const image = texture.image;
		//console.log( image )
		let sizer = this.previewH / image.height;
		const w = image.width * sizer;
		const h = image.height * sizer;
		const d = this.render(texture, w, h );

		const lng = d.length/4;
		const color = new Uint8ClampedArray( 4 );
		const dt = new Uint8ClampedArray( d.length )//[];

		const gammaCorrection = 1 / this.gamma;

		let final = 0, maxId;
		let i = lng, n, r, g, b, a, t, x, y, rs = 1/255, fr=0, fg=0, fb=0;
		let br=0, bg=0, bb=0;
		let cr=0, cg=0, cb=0;
		let max = 0;

		while( i-- ){

			n = i*4;

			x = i % w;
			y = Math.floor((i-x)/w);

			r = 255 * Math.pow((d[n+0] / 255), gammaCorrection)
			g = 255 * Math.pow((d[n+1] / 255), gammaCorrection)
			b = 255 * Math.pow((d[n+2] / 255), gammaCorrection)
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

		// main color
		this.color.sun.setRGB( color[0] * rs, color[1] * rs, color[1] * rs, SRGBColorSpace )
		this.color.fog.setRGB( (fr/w)*rs, (fg/w)*rs, (fb/w)*rs, SRGBColorSpace )
		this.color.sky.setRGB( (cr/w)*rs, (cg/w)*rs, (cb/w)*rs, SRGBColorSpace )
		this.color.ground.setRGB( (br/w)*rs, (bg/w)*rs, (bb/w)*rs, SRGBColorSpace )

		// sun position
		this.sunSpherical.set( 1,  (y / h)*Math.PI, -(x / w)*(Math.PI * 2)-(Math.PI*0.5) );
		this.sunPosition.setFromSpherical(this.sunSpherical);

		this.dataPreview = { data:dt, x:x, y:y, w:w, h:h };

		this.palette = {

			sun: '#' + this.color.sun.getHexString(),
			m: undefined,
			sky: '#' + this.color.sky.getHexString(),
			fog: '#' + this.color.fog.getHexString(),
			ground: '#' + this.color.ground.getHexString(),

			...ImgTool.getPalette( this.dataPreview )

		}

	}

}