import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { Hero } from './extra/Hero.js';

// THREE CHARACTER

export class Character extends Item {

	constructor( motor ) {

		super()

		this.motor = motor;

		this.Utils = this.motor.utils;
		this.type = 'character';
		this.num = Num[this.type];

	}

	/*prestep () {

		let i = this.list.length;
		while( i-- ) this.list[i].preStep( );

	}*/

	step (AR, N) {
		
		let i = this.list.length, n, s, j, k=0, m;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * this.num );

			if(s) s.step( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o );
		const hero = new Hero( o, this.motor );
		return hero;

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return;
		b.set(o);

	}
	
}