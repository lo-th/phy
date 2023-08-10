import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root } from './root.js'


export class Contact extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'contact';

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, c, n, k, l;
		
		while( i-- ){

			c = this.list[i]
			n = N + ( i * Num.contact )

			if ( c.b2 !== null  ) {

				if( c.b1.isSensor || c.b2.isSensor ){

					AR[n] = root.world.intersectionPair(c.b1, c.b2) ? 1 : 0

				} else {
					AR[n] = 0
					root.world.contactPair( c.b1, c.b2, ( manifold, flipped ) => {

						AR[n] = 1//manifold.numContacts() > 0 ? 1 : 0

						//if(manifold.numContacts() > 0)
						//console.log( manifold )

						//console.log( manifold.numContacts() )
					})
				}

				

				/**/
			}
			else{ 

				if( c.b1.isSensor ) root.world.contactsWith(c.c1, ( otherCollider ) => {});
				else root.world.contactsWith(collider, (otherCollider) => {});

			}

		}
	}

	add ( o = {} ) {

		let name = this.setName( o )

		o.b1 = this.byName( o.b1 )
		o.b2 = this.byName( o.b2 )

		if( o.b1 === null ) return

			//console.log(o.b1.ref)

		//o.b1.collid.setActiveCollisionTypes( RAPIER.ActiveCollisionTypes.DEFAULT | RAPIER.ActiveCollisionTypes.KINEMATIC_FIXED );
		o.b1.collid.setActiveEvents( RAPIER.ActiveEvents.COLLISION_EVENTS );
		//if( o.b2 === null )o.b2.collid.setActiveEvents( RAPIER.ActiveEvents.COLLISION_EVENTS );

		let c = new Pair( o )

		// add to world
		this.addToWorld( c, o.id );

	}


}


export class Pair {

	constructor ( o = {} ) {

		this.type = 'contact';

		this.name = o.name;

		this.b1 = o.b1 || null;
		this.b2 = o.b2 || null;

		this.c1 = null;
		this.c2 = null;

		if(this.b1) this.c1 = this.b1.collid
		if(this.b2) this.c2 = this.b2.collid
		this.ignore = o.ignore || [];

		this.result = {

			hit:false,
			point: [0,0,0],
			normal: [0,0,0],
			distance: 0,

		}

	}

	update() {

	}


}