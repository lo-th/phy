import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root } from './root.js'

// AMMO CONTACT

export class Contact extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'contact'
		this.cb = new Ammo.ConcreteContactResultCallback()

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, c, n, k;
		
		while( i-- ){

			k = 0

			c = this.list[i]
			n = N + ( i * Num.contact )

			this.cb.addSingleResult = function () { k = 1; }

			if ( c.b2 !== null ) root.world.contactPairTest( c.b1, c.b2, this.cb )
			else root.world.contactTest( c.b1, this.cb )


			AR[n] = k

		}

	}

	add ( o = {} ) {

		let name = this.setName( o )

		o.b1 = this.byName(o.b1)
		o.b2 = this.byName(o.b2)

		let c = new Pair( o )

		// add to world
		this.addToWorld( c, o.id )

	}


	///


}


export class Pair {

	constructor ( o = {} ) {

		this.type = 'contact';

		this.name = o.name;

		this.b1 = o.b1 || null;
		this.b2 = o.b2 || null;
		this.ignore = o.ignore || [];

		this.result = {

			hit:false,
			point: [0,0,0],
			normal: [0,0,0],
			distance: 0,

		}

	}

	update () {

	}


}