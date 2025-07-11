import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

export class Contact extends Item {

	constructor ( motor ) {

		super();

		this.motor = motor;
		this.Utils = this.motor.utils;

		this.type = 'contact';

	}

	step (AR, N) {

		let i = this.list.length, c, n;
		
		while( i-- ){

			c = this.list[i]

			n = N + ( i * Num.contact )

			//c.update( AR.slice( n, n+8 ) )
			c.update( AR, n )

		}

	}

	add ( o = {} ) {

		let name = this.setName( o );

		let c = new Pair( o );

		if( o.callback ) delete ( o.callback );

		// add to world
		this.addToWorld( c, o.id );

		// add to worker 
		this.motor.post( { m:'add', o:o } );

		return c;

	}


}


export class Pair {

	constructor ( o = {} ) {

		this.type = 'contact';

		this.name = o.name;
		this.callback = o.callback || function(){};

		//console.log(this.name)

		this.b1 = o.b1 || null;
		this.b2 = o.b2 || null;
		this.ignore = o.ignore || []

		this.always = o.always !== undefined ? o.always : true
		//this.simple = o.simple || false

		this.data = {

			hit:false,
			point: [0,0,0],
			normal: [0,0,0],
			//object: null,
		}

	}

	detectBody(){
		//this.dispatchEvent( { type: 'ready', message: 'ready to create plant' } );

	}

	update ( r, n = 0 ) {

		this.data.hit = r[n] > 0 ? true : false

		if( !this.simple ){

			this.data.point = [ r[n+1], r[n+2], r[n+3] ]
			this.data.normal = [ r[n+4], r[n+5], r[n+6] ]

		}
		
		if( this.data.hit || this.always ) this.callback( this.data )

	}


}