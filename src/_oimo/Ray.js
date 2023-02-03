import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, map, torad, Vec3, Quat, Mat3, RayCastClosest } from './root.js';

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'ray';

		this.callback = new RayCastClosest();


	}

	step ( AR, N ) {

		root.reflow.ray = [];

		let i = this.list.length, r, n;
		let cb = this.callback;

		while( i-- ){

			n = N + ( i * Num.ray );

			r = this.list[i];

			r.begin.fromArray(  AR, n+1 )
			r.end.fromArray(  AR, n+4 )

			AR[n] = 0;

			cb.clear();

			root.world.rayCast( r.begin, r.end, cb );

			if ( cb.hit ) {

				AR[n] = 1;
				cb.position.toArray( AR, n+1 );
				cb.normal.toArray( AR, n+4 );

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

	    this.type = 'ray';

	    this.name = o.name;

	    this.begin = new Vec3();
	    this.end = new Vec3();

	}

}