import {
    CanvasTexture, RepeatWrapping, SRGBColorSpace,
} from 'three';

class CarbonTexture {

	constructor( normal, c1='rgb(69,69,69)', c2='rgb(39,39,39)'  ) {

		let s = 128

		const canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;

		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = c1;
		ctx.fillRect( 0, 0, s, s );

		if( !normal ){

			ctx.beginPath();
			ctx.fillStyle = c2
		    ctx.rect(0, 0, 32, 64)
		    ctx.rect(32, 32, 32, 64)
		    ctx.rect(64, 64, 32, 64)
		    ctx.rect(96, 96, 32, 64)
		    ctx.rect(96, -32, 32, 64)
		    ctx.fill()

	    } else {

	    	let i, j, n, d
	    	let pos = [ [0, 0], [32, 32],[64, 64],[96, 96],[96, -32] ]
	    	let deg = [ [0, 64], [32, 96],[64, 128],[96, 160],[-32, 32] ]

	    	let f1 = normal ? 'rgb(128,128,255)' : c1
	    	let f2 = normal ? 'rgb(160,100,255)' : c2
	    	let f3 = normal ? 'rgba(100,160,255, 0.5)' : 'rgba(0,0,0, 0.1)'

	    	ctx.strokeStyle = f3
	    	ctx.lineWidth = 1

	    	for( i = 0; i<5; i++ ){

	    		d = ctx.createLinearGradient(0, deg[i][0], 0, deg[i][1]);
				d.addColorStop(0, f2)
				d.addColorStop(1, f1)

				ctx.beginPath();
				ctx.fillStyle = d
				ctx.rect(pos[i][0], pos[i][1], 32, 64)
				ctx.fill()

				for( let j = 0; j<8; j++ ){   

					n = (Math.random()-0.5) * 2 
				           
				    ctx.beginPath()
					ctx.moveTo(pos[i][0]+n+2+j*4, pos[i][1])
					ctx.lineTo(pos[i][0]+n+2+j*4, pos[i][1]+64)
					ctx.stroke()
				}

	    	}

	    	pos = [ [32, 0], [64, 32],[96, 64],[-32, 64],[0, 96] ]
	    	deg = [ [32, 96], [64, 128],[96, 160],[-32, 32],[0, 64] ]

	    	for( i = 0; i<5; i++ ){

	    		d = ctx.createLinearGradient(deg[i][0], 0, deg[i][1], 0);
				d.addColorStop(0, f1)
				d.addColorStop(1, f2)

				ctx.beginPath();
				ctx.fillStyle = d
				ctx.rect(pos[i][0], pos[i][1], 64, 32)
				ctx.fill()

				for( j = 0; j<8; j++ ){

					n = (Math.random()-0.5) * 2 
					ctx.beginPath()
					ctx.moveTo(pos[i][0], pos[i][1]+n+2+j*4)
					ctx.lineTo(pos[i][0]+64, pos[i][1]+n+2+j*4)
					ctx.stroke()
				}

	    	}

	    }

		//return canvas;

		const texture = new CanvasTexture( canvas ) //new CarbonTexture('#ffffff', '#CCCCCC') )
		texture.wrapS = texture.wrapT = RepeatWrapping
		texture.repeat.x = texture.repeat.y = 60

		if(!normal) texture.colorSpace = SRGBColorSpace;

		return texture;

	}

}

export { CarbonTexture };
