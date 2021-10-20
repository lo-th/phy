import {
	PMREMGenerator,
	UnsignedByteType,
	Vector3, Spherical,
	Color
} from '../../../build/three.module.js';

import { RGBELoader } from '../loaders/RGBELoader.js';

let env = null;
let data = {};
let color =  new Color();
let light = null, scene = null, renderer = null, light2 = null;

const s1 = new Spherical()
const s2 = new Spherical()

export class Env {

	static get (){ return env }

	static getData (){ return data }

	static setBackgroud ( c ) {

		if( c !== undefined ) scene.background = color.setHex(c);
		else scene.background = env

	}

	static load ( url, callback, Renderer, Scene, Light, Light2, autosun ) {

		data = {
			pos: new Vector3(0,1,0),
			sun: new Color(0xffffff),
			fog: new Color(0x000000),
			envmap:null,
		}

		if(Renderer) renderer = Renderer
		if(Scene) scene = Scene
		if(Light) light = Light
		if(Light2) light2 = Light2


		autosun = autosun !== undefined ? autosun : true;

		let pmremGenerator = new PMREMGenerator( renderer );
		pmremGenerator.compileEquirectangularShader();

		new RGBELoader().setDataType( UnsignedByteType ).load( url, function ( texture ) {

			env = pmremGenerator.fromEquirectangular( texture ).texture;

			if( autosun ) Env.autoSun( texture.image, 'hdr' );
			
			if( scene ) {
				
				scene.background = env;
				scene.environment = env;

				if(scene.ground) scene.ground.setColor( data.fog.getHex(), true )

				//renderer.background = env;


				//scene.background.visible = false

				//console.log(scene.background)
			}

			if( light && autosun ) {

				//light.position.copy( data.pos ).multiplyScalar( light.distance || 20 );
				light.position.setFromSpherical(s1).multiplyScalar( light.distance || 20 );
				light.color.copy( data.sun );
				//light.lookAt( 0, 0, 0 )

				light.target.position.set( 0, 0, 0 )
				light.updateMatrixWorld();

				if( light.helper ) light.helper.update()

				if(light2){

					light2.position.setFromSpherical(s2).multiplyScalar( light2.distance || 20 );

					//light2.position.copy( data.pos ).multiplyScalar( light2.distance || 20 );
					light2.color.copy( data.fog );
					//light2.lookAt( 0, 0, 0 )

					light2.target.position.set( 0, 0, 0 )
				    light2.updateMatrixWorld();

					if(light2.helper) light2.helper.update()

				}

			}

			texture.dispose()
			pmremGenerator.dispose()

			if( callback ) callback()

		})


	}

	static autoSun ( image, format, preview ) {

		let d = image.data;
		let lng = d.length/4;
		let w = image.width;
		let h = image.height;
		let dt = null;

		if( preview ){ 

			let c = document.createElement("canvas");
			c.style.cssText = 'position:absolute; left:10px; top:10px; width:50%; height:50%;';
			document.body.appendChild(c)
	        c.width = w;
	        c.height = h;

	        let ctx = c.getContext("2d");

	        if(format !== 'hdr'){
	        	ctx.drawImage( image, 0, 0 );
	        	image.data = ctx.getImageData( 0, 0, w, h ).data;
	        } else {
	        	dt = ctx.createImageData( c.width, c.height )
	        }

		}

		let color = new Uint8ClampedArray( 4 );

		let exposure = 1;
		let gamma = 1/2.7;
		let exp = Math.pow( 2, exposure )*0.5;

		let max = 0, final = 0, maxId;
		let i = lng, n, r, g, b, a, t, x, y, rs = 1/255, fr=0, fg=0, fb=0;


		for( i=0; i < lng; i++ ){

			n = i*4;

			x = i % w;
			y = Math.floor((i-x)/w);

			if( format === 'hdr' ){

				a = exp * Math.pow( 2, ( d[n+3]) - (128-8) );
				r = 2 * Math.pow( d[n]*a, gamma);
				g = 2 * Math.pow( d[n+1]*a, gamma);
				b = 2 * Math.pow( d[n+2]*a, gamma);

			} else {

				r = d[n];
				g = d[n+1];
				b = d[n+2];
				a = d[n+3];

			}

			t = ( r + g + b );

			if( y === h * 0.5 ){

				fr += r;
				fg += g;
				fb += b;
				
			}

			if( t > max ){ 
				
				color[0] = r;
				color[1] = g;
				color[2] = b;
				color[3] = 255;

				maxId = i;
				max = t;

			}

			if( preview ){

				dt.data[n] = r;
				dt.data[n+1] = g;
				dt.data[n+2] = b;
				dt.data[n+3] = 255;

			}

		}

		if( preview ) ctx.putImageData( dt, 0, 0 );

		if( format !== 'hdr' ) image.data = null;

		x = maxId % w;
		y = Math.floor((maxId-x)/w);
		let sunPosition = new Vector3().setFromSphericalCoords( 1, (y / h)*Math.PI, -(x / w)*(Math.PI * 2)-(Math.PI*0.5) );
		let sunColor = new Color( color[0] * rs, color[1] * rs, color[1] * rs);

		s1.set( 1,  (y / h)*Math.PI, -(x / w)*(Math.PI * 2)-(Math.PI*0.5 ) )
		s2.copy( s1 )
		s2.theta += Math.PI * 0.2
		s2.phi -= Math.PI*0.5
		

		let fcc = new Color()
		let fogColor = new Color( (fr/w)*rs, (fg/w)*rs, (fb/w)*rs ).getHSL( fcc );
		//if( format === 'hdr' ) fogColor.setHSL( fcc.h, fcc.s*0.65, fcc.l *.92);
		//if( format === 'hdr' ) fogColor.setHSL( fcc.h, fcc.s*2.1, fcc.l*1.4);
		if( format === 'hdr' ){ 
			//if( renderer.toneMapping === 4 ) 
			//	fogColor.setHSL( fcc.h, fcc.s*1.666, fcc.l*( 1.1 + renderer.toneMappingExposure ));
			//else 
			fogColor.setHSL( fcc.h, fcc.s*1.66, fcc.l*1.88);
		}
		else fogColor.setHSL( fcc.h, fcc.s*0.99, fcc.l*1.1 );

		sunColor.convertSRGBToLinear()
		fogColor.convertSRGBToLinear()

		//console.log( sunPosition, sunColor );

		data['pos'] = sunPosition;
		data['sun'] = sunColor;
		data['fog'] = fogColor;

		//return { pos:sunPosition, color:sunColor, fog:fogColor };

	}




}