import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { root, Utils, Vec3, Quat } from './root.js';

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'ray';

		this.ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });

		this.v1 = new Vec3( 0,0,0 )
		this.v2 = new Vec3( 0,0,0 )

	}

	step ( AR, N ) {

		root.reflow.ray = [];

		let i = this.list.length, r, n
		let distance = 0

		while( i-- ){

			n = N + ( i * Num.ray )

			r = this.list[i];

			AR[n] = 0

			this.v1.fromArray( AR, n+1 )
			this.v2.fromArray( AR, n+4 )

			// distance
			distance = this.v1.distanceTo( this.v2 )

			// convert v2 to direction
			this.v2.sub( this.v1 ).normalize()

			this.ray.origin = this.v1
			this.ray.dir = this.v2

			root.world.intersectionsWithRay( this.ray, distance, r.solid, r.group, (hit) => {

				AR[n] = 1
				let hitPoint = this.ray.pointAt(hit.toi)

				let collider = hit.collider._parent.name
				//if( collider ) console.log(collider)
				root.reflow.ray[i] = collider

				AR[n+1] = hitPoint.x
				AR[n+2] = hitPoint.y
				AR[n+3] = hitPoint.z

				AR[n+4] = hit.normal.x
				AR[n+5] = hit.normal.y
				AR[n+6] = hit.normal.z
			})

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

	}

}



export class ExtraRay {

	constructor( o = {} ) {

	    this.type = 'ray'
	    this.name = o.name

	    this.group = o.group !== undefined || 0xfffffffff

	    // use intern shape
	    this.solid = false

	}

}