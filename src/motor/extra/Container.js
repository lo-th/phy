import { MathTool } from '../../core/MathTool.js';
import { root } from '../root.js';
import { BoxGeometry, Mesh } from 'three';
import { ChamferBox } from '../../3TH/Geometry.js';

let Nb = 0

export class Container {

	constructor ( o = {} ) {

		this.isCompound = true

		this.init(o)

	}

	init ( o ) {


		let s = o.size || [5,3,8]
		let p = o.pos || [0,2,0]
		let w = 0.1
		let mw = w * 0.5
		let xw = w * 2

		let geometry = new ChamferBox( s[ 0 ], s[ 1 ], s[ 2 ], o.radius || mw );
		//let geometry = new BoxGeometry( s[ 0 ], s[ 1 ], s[ 2 ] );
		let mesh = new Mesh( geometry );


		let size = [

		    [w, s[1]-xw, s[2]],
			[w, s[1]-xw, s[2]],

			[s[0], w, s[2]],
			[s[0], w, s[2]],

			[s[0]-xw, s[1]-xw, w],
			[s[0]-xw, s[1]-xw, w],

		]

		let pos = [

		    [mw-s[0]*0.5, 0, 0 ],
			[s[0]*0.5-mw, 0, 0 ],

			[0, mw-s[1]*0.5, 0 ],
			[0, s[1]*0.5-mw, 0 ],

			[0, 0, mw-s[2]*0.5],
			[0, 0, s[2]*0.5-mw],

		]

		const faces = []
		let i = 6, n=0, pp
		while( i-- ){

			pp = this.isCompound ? pos[n] : MathTool.addArray(p, pos[n])
			faces.push( { type:'box', size:size[n], pos:pp, material:o.material } )
			n++

		}

		if(this.isCompound){
			root.motor.add({
				...o,
				shapes:faces,
				mesh:mesh,
		        type:'compound',
		    })	
		} else {
			root.motor.add( faces )
		}
		
	}

}