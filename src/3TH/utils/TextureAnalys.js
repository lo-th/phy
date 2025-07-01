import {
	Color, Spherical, Vector3, SRGBColorSpace
} from 'three';

import { ImgTool } from './ImgTool.js';

export class TextureAnalys {
	
	constructor () {

		this.previewH = 128;
		this.useHalfFloat = true;
		this.gamma = 2.2;

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

	clear () {
	}

	run ( texture, callback ) {

		let dth = resize_texture( texture, 256, false, 'x.hdr')

		const self = this


		const transcoderPending = Promise.all( [ dth ] )
		.then( ( [ dth ] ) => {
			//console.log( "ok", dth )

			const w = dth.width
			const h = dth.height
			const lng = dth.data.length/4;
			const d = dth.data

			const color = new Uint8ClampedArray( 4 );
			const dt = new Uint8ClampedArray( d.length )//[];

			//console.log( "base", w,h,lng )

			const gammaCorrection = 1 / self.gamma;

			let final = 0, maxId;
			let i = lng, n, r, g, b, a, t, x, y, rs = 1/255, fr=0, fg=0, fb=0;
			let br=0, bg=0, bb=0;
			let cr=0, cg=0, cb=0;
			let max = 0;
			let maxY = 128

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

				if( t > max && y < h * 0.35 ){ 
					color[0] = r;
					color[1] = g;
					color[2] = b;
					color[3] = 255;
					maxId = i;
					max = t;
					maxY = y;
				}

				dt[n] = r;
				dt[n+1] = g;
				dt[n+2] = b;
				dt[n+3] = 255;

			}

			x = maxId % w;
			y = Math.floor((maxId-x)/w);

			// main color
			self.color.sun.setRGB( color[0] * rs, color[1] * rs, color[1] * rs, SRGBColorSpace )
			self.color.fog.setRGB( (fr/w)*rs, (fg/w)*rs, (fb/w)*rs, SRGBColorSpace )
			self.color.sky.setRGB( (cr/w)*rs, (cg/w)*rs, (cb/w)*rs, SRGBColorSpace )
			self.color.ground.setRGB( (br/w)*rs, (bg/w)*rs, (bb/w)*rs, SRGBColorSpace )

			// sun position
			self.sunSpherical.set( 1,  (y / h)*Math.PI, -(x / w)*(Math.PI * 2)-(Math.PI*0.5) );
			self.sunPosition.setFromSpherical(self.sunSpherical);

			self.dataPreview = { data:dt, x:x, y:y, w:w, h:h };

			self.palette = {

				sun: '#' + self.color.sun.getHexString(),
				m: undefined,
				sky: '#' + self.color.sky.getHexString(),
				fog: '#' + self.color.fog.getHexString(),
				ground: '#' + self.color.ground.getHexString(),

				...ImgTool.getPalette( self.dataPreview )

			}

			callback(self.palette)

		})

	}

}




async function resize_texture( texture, res = 2048, tex_flip = false, m_type = 'image/png', isMeshTex = false, imageDataOnly = true ) {

    const image = texture.image;

    let getImageData = imageDataOnly

    let image_types = [ 'avif', 'bmp', 'gif', 'jpeg', 'png', 'svg+xml', 'webp' ];
    let image_hd_types = [ 'x.hdr', 'x.exr', 'ktx2' ];

    let img_ext = image_types.some( ext => m_type.endsWith( ext ) );
    let img_hd_ext = image_hd_types.some( ext => m_type.endsWith( ext ) );
    let mesh_texture = ( isMeshTex === true && ( img_ext === true || img_hd_ext === true ) );

    let tex, img = new Image();

    await new Promise( resolve => {

        img.onload = function() {
            
            let canvas2 = document.createElement('canvas');

            let scale = res / Math.max( img.naturalWidth, img.naturalHeight );

            canvas2.width = img.naturalWidth * Math.min( 1, scale );
            canvas2.height = img.naturalHeight * Math.min( 1, scale );

            let ctx2 = canvas2.getContext( '2d', { willReadFrequently: true } );

            // Flip image vertically
            if (tex_flip === true) {
                ctx2.translate( 0, canvas2.height );
                ctx2.scale( 1, -1 );
            }

            ctx2.drawImage( img, 0, 0, canvas2.width, canvas2.height );

            if(getImageData){
            	resolve( tex = ctx2.getImageData(0,0,canvas2.width, canvas2.height));
            } else {
            	resolve( tex = new THREE.CanvasTexture( canvas2 ) );
            }

        }

        if ( image.src ) {

            img.src = image.src;

        } else if ( image.data && ( img_ext === true || mesh_texture === true ) ) {

            let blob = new Blob( [ image.data ], { type: m_type } );
            img.src = URL.createObjectURL( blob );
            URL.revokeObjectURL( blob );

        } else {

            let canvas1 = document.createElement('canvas');

            canvas1.width = image.width;
            canvas1.height = image.height;

            let ctx1 = canvas1.getContext( '2d', { willReadFrequently: true } );

            if ( image instanceof ImageData ) {

                ctx1.putImageData( image, 0, 0 );

            } else if ( image.data && image.data.constructor === Float32Array ) {

                let u8 = new Uint8Array( image.data.length );

                for ( let i = 0; i < image.data.length; i ++ ) {
	                let tmp = Math.max( -1, Math.min( 1, image.data[ i ] ) );
	                tmp = tmp < 0 ? ( tmp * 0x8000 ) : ( tmp * 0x7FFF );
	                u8[ i ] = tmp / 128.0;
                }

                let imgData = new ImageData( new Uint8ClampedArray( u8.buffer ), image.width, image.height );
                ctx1.putImageData( imgData, 0, 0 );

            } else if ( image.data && image.data.constructor === Uint16Array ) {

                let u8 = new Uint8Array( image.data.length );

                for ( let i = 0; i < image.data.length; i ++ ) {
	                let tmp = Math.max( -1, Math.min( 1, THREE.DataUtils.fromHalfFloat( image.data[ i ] ) ) );
	                tmp = tmp < 0 ? ( tmp * 0x8000 ) : ( tmp * 0x7FFF );
	                u8[ i ] = tmp / 128.0;
                }

                let imgData = new ImageData( new Uint8ClampedArray( u8.buffer ), image.width, image.height );
                ctx1.putImageData( imgData, 0, 0 );

            } else if ( image.data && image.data.constructor === Uint8Array ) {

                let imgData = new ImageData( new Uint8ClampedArray( image.data.buffer ), image.width, image.height );
                ctx1.putImageData( imgData, 0, 0 );

            } else {

                ctx1.drawImage( image, 0, 0, canvas1.width, canvas1.height );

            }

            let base64data = canvas1.toDataURL( 'image/png', 1 ).replace( /^data:image\/(avif|png|gif|ktx2|jpeg|webp);base64,/, '' );
            let a2b = atob( base64data );
            let buff = new Uint8Array( a2b.length );

            for ( let i = 0, l = buff.length; i < l; i ++ ) {
                buff[ i ] = a2b.charCodeAt( i );
            }

            let blob = new Blob( [ buff ], { type: 'image/png' } );

            img.src = URL.createObjectURL( blob );
            URL.revokeObjectURL( blob );
        }
    });

    // Dispose of current texture and return a new one

    //if (texture.isTexture) texture.dispose();

    //console.log( tex )

    return tex;
}