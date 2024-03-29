import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, torad } from '../core/MathTool.js';

import { Utils, root, map, Vec3, Quat, Mat3, RayCastClosest } from './root.js';

// OIMO RAY

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'ray';

		this.callback = new RayCastClosest();

		this.begin = new Vec3();
	    this.end = new Vec3();
	    this.p = new Vec3()
		this.q = new Quat()
		
	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		root.reflow.ray = [];

		let i = this.list.length, r, n, pp, ph, d;
		let cb = this.callback;

		while( i-- ){

			n = N + ( i * Num.ray );

			r = this.list[i];

			pp = r.getPoint( this.p, this.q )

			this.begin.fromArray( pp[0] )
			this.end.fromArray( pp[1] )

			// distance
			//d = MathTool.distanceArray( pp[0], pp[1] );

			AR[n] = 0;
			//AR[n+1] = d;

			cb.clear();

			root.world.rayCast( this.begin, this.end, cb );

			if ( cb.hit ) {

				AR[n] = 1;

				ph = cb.position.toArray();
				AR[n+1] = MathTool.distanceArray( pp[0], ph );
				AR[n+2] = pp[0][0]
				AR[n+3] = pp[0][1]
				AR[n+4] = pp[0][2]

				AR[n+5] = ph[0]
				AR[n+6] = ph[1]
				AR[n+7] = ph[2]
				cb.normal.toArray( AR, n+8 );

				if( cb.shape ){ 
					// get name of hit rigidbody
					root.reflow.ray[i] = cb.shape.getRigidBody().name;
				}

			}

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );
		let r = new ExtraRay( o );

		// add to world
		this.addToWorld( r, o.id );

	}

	set ( o = {}, r = null ) {

		
		if( r === null ) r = this.byName( o.name );
		if( r === null ) return;

		if(o.begin) r.begin = o.begin
		if(o.end) r.end = o.end

	}

}



export class ExtraRay {

	constructor( o = {} ) {

	    this.type = 'ray';

	    this.name = o.name;
	    this.parent = o.parent || ''

	    this.begin = o.begin || [0,0,0]
	    this.end = o.end || [0,0,1]

	}

	getPoint( p, q ){
		if( this.parent ){
			const b = Utils.byName( this.parent )
			if(b){
				b.getPositionTo( p )
			    b.getOrientationTo( q )
				const pp = p.toArray()
				const qq = q.toArray()
				return [
				    MathTool.applyTransformArray( this.begin, pp, qq ),
				    MathTool.applyTransformArray( this.end, pp, qq )
				]

			} 
		}
		return [ this.begin, this.end ]
	}

}