import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { Utils, root } from './root.js';

import { Hero } from './extra/Hero.js';

// THREE CHARACTER

export class Character extends Item {

	constructor() {

		super()

		this.Utils = Utils
		this.type = 'character';
		this.num = Num[this.type];

	}

	/*prestep () {

		let i = this.list.length;
		while( i-- ) this.list[i].preStep( );

	}*/

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];
		let i = this.list.length, n, s, j, k=0, m;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * this.num );

			if(s) s.step( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o );
		const hero = new Hero( o );
		return hero;

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return;
		b.set(o);

	}
	
}