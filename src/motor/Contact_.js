import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

export class Contact extends Item {

	constructor ( motor ) {

		super();

		this.colliderMap = new Map();

		this.motor = motor;
		this.Utils = this.motor.utils;

		this.type = 'contact';
		this.rc = this.refresh.bind(this)

	}

	refresh( b, key ){

		let data =  { from:key, hit:0 }
		let cc = this.motor.reflow.contact[key]
		if( cc !== undefined ){
			data = {...cc[0]}
		}
		

		if( b.userData.collisionCallback ) b.userData.collisionCallback(data, b);
		
	}

	step (AR, N) {

		

		
		this.colliderMap.forEach( this.rc );


		let i = this.list.length, c, n;
		
		while( i-- ){

			c = this.list[i]

			n = N + ( i * Num.contact )

			//c.update( AR.slice( n, n+8 ) )
			c.update( AR, n )

		}

	}

	add ( o = {} ) {

		if(o.b1) this.activeCollision(o.b1, o)
		//if(o.b2) this.activeCollision(o.b2)

		



		let name = this.setName( o );

		let c = new Pair( o, this.motor );

		if( o.callback ) delete ( o.callback );

		// add to world
		this.addToWorld( c, o.id );

		// add to worker 
		this.motor.post( { m:'add', o:o } );

		return c;

	}

	activeCollision( name, o ){

		let b = this.byName( name );
		if( b === null ) return;
		b.getVelocity = true;
		if( o.callback ) b.userData.collisionCallback = o.callback
		this.motor.post( { m:'activeBodyCollision', o:{name:name} } );
		this.colliderMap.set( name, b );


	}


}


export class Pair {

	constructor ( o = {}, motor ) {

		this.type = 'contact';
		this.motor = motor;

		this.name = o.name;
		this.callback = o.callback || function(){};

		//console.log(this.name)

		this.b1 = o.b1 || null;
		this.b2 = o.b2 || null;
		this.ignore = o.ignore || []

		this.always = o.always !== undefined ? o.always : true
		//this.simple = o.simple || false

		this.data = {
			hit:false
		}

	}

	detectBody(){
		//this.dispatchEvent( { type: 'ready', message: 'ready to create plant' } );

	}

	update ( r, n = 0 ) {

		return

		const hit = r[n] > 0 ? true : false

		let data = { hit:hit, from:this.b1 }

		if(hit && this.motor.reflow.contact){
			let cc = this.motor.reflow.contact[this.b1]
			if(cc){
				data = {
					...data,
					...cc[0]
				}
			}
		}

		
		if( data.hit || this.always ) this.callback( data )

	}


}