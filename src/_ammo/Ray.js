import { Item } from '../core/Item.js';
import { Utils, root } from './root.js';

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'ray'

		this.callback = new Ammo.ClosestRayResultCallback();


	}

	step ( AR, N ) {

		root.reflow.ray = [];

		let i = this.list.length, r, n, name;
		let cb = this.callback;

		while( i-- ){

			n = N + ( i * 8 );

			r = this.list[i];

			//r.begin.fromArray( AR, n+1 )
			//r.end.fromArray( AR, n+4 )

			AR[n] = 0;
			
			cb.set_m_collisionObject( null );

			// Set ray callback option
			cb.get_m_rayFromWorld().fromArray( AR, n+1 )
			cb.get_m_rayToWorld().fromArray( AR, n+4 )
			cb.set_m_collisionFilterGroup( r.group );
			cb.set_m_collisionFilterMask( r.mask );
			cb.set_m_closestHitFraction( r.precision );


			root.world.rayTest( cb.get_m_rayFromWorld(), cb.get_m_rayToWorld(), cb );

			if ( cb.hasHit() ) {

				AR[n] = 1;
				cb.get_m_hitPointWorld().toArray( AR, n+1 )
				cb.get_m_hitNormalWorld().toArray( AR, n+4 )

				name = Ammo.castObject( cb.get_m_collisionObject(), Ammo.btRigidBody ).name;
				if ( name === undefined ) name = Ammo.castObject( ray.get_m_collisionObject(), Ammo.btSoftBody ).name;
				root.reflow.ray[i] = name;

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
		this.addToWorld( r );

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

	    this.precision = o.precision || 1;
	    this.group = o.group !== undefined || 1
	    this.mask = o.mask !== undefined || -1

	}

}