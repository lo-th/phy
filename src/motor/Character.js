import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, math } from './root.js';


// THREE CHARACTER

export class Character extends Item {

	constructor() {

		super()

		this.Utils = Utils
		this.type = 'character'

	}

	step ( AR, N ) {

		let i = this.list.length, n, s, j, k=0, m;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * Num.character );
			s.step( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o )

		const hero = new Hero( o )

		// add to world
		this.addToWorld( hero, o.id )

        // add to physics
        root.post({ m:'add', o:hero.o })

		return hero

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		b.set(o)

	}
	
}

// HERO

class Hero {

	constructor( o ) {

		this.type = 'character';
		this.name = o.name;

		//this.position = new THREE.Vector3();
		this.init( o );

	}

	init( o ){

		this.shape = root.add({ 
			onlyMakeMesh:true, 
		    name:this.name + '_shape', 
		    type:'capsule', 
		    size:o.size,
		    pos:o.pos, 
		    rot:o.rot,
		    ray:false,
		    material:'hero'
		});

	}

	step ( AR, n ) {

		this.shape.position.fromArray( AR, n + 1 )
		this.shape.quaternion.fromArray( AR, n + 4 )
		this.shape.updateMatrix()

	}

	set ( o ) {

	}


}