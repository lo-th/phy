import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, map } from './root.js';

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'ray'

	}

	step ( AR, N ) {

		root.reflow.ray = [];

		let i = this.list.length, r, n, b, query
		let queryMembership, queryCollideWith
		let pos, normal, hitData

		while( i-- ){

			n = N + ( i * Num.ray )

			r = this.list[i]

			r.begin = [AR[n+1], AR[n+2], AR[n+3]]
			r.end = [AR[n+4], AR[n+5], AR[n+6]]

			queryMembership = ~0;
			queryCollideWith = ~0;
			query = [r.begin, r.end, [queryMembership, queryCollideWith]];

			AR[n] = 0;

			havok.HP_World_CastRayWithCollector( root.world, root.queryCollector, query );

			if ( havok.HP_QueryCollector_GetNumHits(root.queryCollector)[1] > 0) {

				hitData = havok.HP_QueryCollector_GetCastRayResult(root.queryCollector, 0)[1]
				pos = hitData[1][3]
                normal = hitData[1][4]

				AR[n] = 1
				AR[n+1] = pos[0]
				AR[n+2] = pos[1]
				AR[n+3] = pos[2]

				AR[n+4] = normal[0]
				AR[n+5] = normal[1]
				AR[n+6] = normal[2]

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

		/*
		if( r === null ) r = this.byName( o.name );
		if( r === null ) return;

		if( o.begin !== undefined ) r.begin.fromrray( o.begin || [0,1,0] )
		if( o.end !== undefined ) r.end.fromrray( o.end || [0,0,0] )
		*/

	}

}



export class ExtraRay {

	constructor( o = {} ) {

	    this.type = 'ray'
	    this.name = o.name
	    this.begin = []
	    this.end = []

	}

}