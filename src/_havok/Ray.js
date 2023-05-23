import { Item } from '../core/Item.js';
import { Num, MathTool } from '../core/Config.js';

import { Utils, root, map } from './root.js';

// HAVOK RAY

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'ray'

	}

	step ( AR, N ) {

		root.reflow.ray = [];

		let i = this.list.length, r, n, b, query, pp, ph
		let queryMembership, queryCollideWith
		let normal, hitData

		while( i-- ){

			n = N + ( i * Num.ray )

			r = this.list[i]

			pp = r.getPoint()

			queryMembership = ~0;
			queryCollideWith = ~0;
			query = [pp[0], pp[1], [queryMembership, queryCollideWith]];

			AR[n] = 0;

			havok.HP_World_CastRayWithCollector( root.world, root.queryCollector, query );

			if ( havok.HP_QueryCollector_GetNumHits(root.queryCollector)[1] > 0) {

				hitData = havok.HP_QueryCollector_GetCastRayResult(root.queryCollector, 0)[1]
				ph = hitData[1][3]
                normal = hitData[1][4]

				AR[n] = 1
				AR[n+1] = MathTool.distanceArray( pp[0], ph )
				AR[n+2] = pp[0][0]
				AR[n+3] = pp[0][1]
				AR[n+4] = pp[0][2]

				AR[n+5] = ph[0]
				AR[n+6] = ph[1]
				AR[n+7] = ph[2]

				AR[n+8] = normal[0]
				AR[n+9] = normal[1]
				AR[n+10] = normal[2]

				b = Utils.byId( hitData[1][0][0] )

				if( b ){ 
					// get name of hit rigidbody
					root.reflow.ray[i] = b.name;
				}

			}

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );
		let r = new ExtraRay( o ); 

		// apply option
		//this.set( o, r );

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

	    this.type = 'ray'
	    this.name = o.name
	    this.parent = o.parent || ''

	    this.begin = o.begin || [0,0,0]
	    this.end = o.end || [0,0,1]


	}

	getPoint(){
		if( this.parent ){
			const b = Utils.byName( this.parent )
			if(b){
				const ar = havok.HP_Body_GetQTransform(b)[1]
				const p = ar[0]
				const q = ar[1]
				return [
				    MathTool.applyTransformArray( this.begin, p, q ),
				    MathTool.applyTransformArray( this.end, p, q )
				]

			} 
		}
		return [ this.begin, this.end ]
	}

}