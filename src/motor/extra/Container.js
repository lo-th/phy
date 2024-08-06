import { MathTool } from '../../core/MathTool.js';
import { root } from '../root.js';
import { BoxGeometry, Mesh } from 'three';
import { ChamferBox } from '../../3TH/Geometry.js';
import { BoxHelper } from '../../3TH/helpers/BoxHelper.js'

let Nb = 0

export class Container {

	constructor ( o = {} ) {

		this.isCompound = true;
		this.remplace = o.remplace || false;
		this.init(o);

	}

	init ( o = {} ) {

		const intern = o.intern || false;


		let s = o.size || [5,3,8];
		let p = o.pos || [0,2,0];
		let w = o.wall || 0.1;

		if( o.size[3] !== undefined )  w = o.size[3];
		if(w<=0) w = 0.01
		let mw = w * 0.5;
		let xw = w * 2;

		if(!o.face) o.face = {};
		let f = { up:1, down:1, left:1, right:1, front:1, back:1, ...o.face };
		delete o.face;

		//let geometry = new ChamferBox( s[ 0 ], s[ 1 ], s[ 2 ], o.radius || mw );
		//let mesh = new Mesh( geometry );

		const data = [];

		if(intern){

			if(f.up===1) data.push({ pos:[0, s[1]*0.5+mw, 0], size:[s[0]+xw, w, s[2]+xw] });
			if(f.down===1) data.push({ pos:[0, -mw-s[1]*0.5, 0], size:[s[0]+xw, w, s[2]+xw] });

			if(f.left===1) data.push({ pos:[-mw-s[0]*0.5, 0, 0 ], size:[w, s[1], s[2]] });
			if(f.right===1) data.push({ pos:[s[0]*0.5+mw, 0, 0 ], size:[w, s[1], s[2]] });

			if(f.back===1) data.push({ pos:[0, 0, -mw-s[2]*0.5], size:[s[0]+xw, s[1], w] });
			if(f.front===1) data.push({ pos:[0, 0, s[2]*0.5+mw], size:[s[0]+xw, s[1], w] });

		}else{

			if(f.up===1) data.push({ pos:[0, s[1]*0.5-mw, 0], size:[s[0], w, s[2]] });
			if(f.down===1) data.push({ pos:[0, mw-s[1]*0.5, 0], size:[s[0], w, s[2]] });

			if(f.left===1) data.push({ pos:[mw-s[0]*0.5, 0, 0 ], size:[w, s[1]-xw, s[2]] });
			if(f.right===1) data.push({ pos:[s[0]*0.5-mw, 0, 0 ], size:[w, s[1]-xw, s[2]] });

			if(f.back===1) data.push({ pos:[0, 0, mw-s[2]*0.5], size:[s[0]-xw, s[1]-xw, w] });
			if(f.front===1) data.push({ pos:[0, 0, s[2]*0.5-mw], size:[s[0]-xw, s[1]-xw, w] });

		}

		

		const faces = [];
		let i = data.length, n=0, pp, d;

		while( i-- ){

			d = data[n];
			pp = this.isCompound ? d.pos : MathTool.addArray(p, d.pos);
			faces.push( { type:'box', size:d.size, pos:pp, material:o.material } );
			n++

		}

		

		if( this.isCompound ){
			let mesh = null;
			if( this.remplace ){
				if(o.radius===0) mesh = new Mesh( new BoxGeometry( s[ 0 ], s[ 1 ], s[ 2 ] ) );
				else mesh = new Mesh( new ChamferBox( s[ 0 ], s[ 1 ], s[ 2 ], o.radius || mw ) );

				if(o.material){
					if(o.material === 'debug'){ 
						mesh = new BoxHelper( mesh, o.color );
						o.material = 'line'
					}
				}
			}
			root.motor.add({
				...o,
				mesh:mesh,
				shapes:faces,
		        type:'compound',
		    });
		} else {
			root.motor.add( faces );
		}
		
	}

}