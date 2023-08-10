import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root } from './root.js'

export class Contact extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'contact';
		//this.cb = new Ammo.ConcreteContactResultCallback();

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, c, n, k, l;
		
		while( i-- ){

			c = this.list[i]
			n = N + ( i * Num.contact )

			k = 0

			//k = c.b1.getNumContectLinks()
			l = c.b1.getContactLinkList()



			if ( c.b2 !== null && l !== null ){

				//console.log(l.getOther())

				let ct = l.getContact()
				while( ct !== null ){

					if(( c.b2.name === ct._b2.name && c.b1.name === ct._b1.name) || ( c.b2.name === ct._b1.name && c.b1.name === ct._b2.name)){ k = 1; break; }
					ct = ct.getNext()

				}

			}

		    AR[n] = k;


		}

	}

	add ( o = {} ) {

		let name = this.setName( o )

		o.b1 = this.byName( o.b1 )
		o.b2 = this.byName( o.b2 )

		if( o.b1 === null ) return

		let c = new Pair( o )

		// add to world
		this.addToWorld( c, o.id );

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