import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import * as CANNON from '../libs/cannon-es.js'

import { root, Utils, map, torad, Vec3, Quat } from './root.js';



export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'joint'

		this.v = new Vec3()
		this.q = new Quat()
		//this.m = new Mat3()

		this.v1 = new Vec3()
		this.v2 = new Vec3()

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		/*let i = this.list.length, j, n
		const v = this.v
		const q = this.q
		const m = this.m

		while( i-- ){

			j = this.list[i]

			n = N + ( i * Num.joint )

			if( j.visible ){

				
			}

		}*/

	}

	///

	add ( o = {} ) {

		//const v = this.v;

		let name = this.setName( o )

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null

		let b1 = this.byName(o.b1)
		let b2 = this.byName(o.b2)




		let mode = o.mode || 'revolute';

	

		let j

		switch ( mode ) {

			case 'fixe':
			j = new CANNON.PointToPointConstraint( b1, this.v1, b2, this.v2 )
			break;
			case "hinge": case "revolute":
			break;
			case "slider":case "prismatic":
			case "distance":
			j = new CANNON.DistanceConstraint( b1, b2, distance )
			break;

			case "dof": case "d6": case 'ragdoll':
			break;


		}

		//const j = new Joints[ mode + 'Joint' ](jc);
		j.name = name;
		j.types = this.type;

		
		j.mode = mode;
		j.visible = o.visible !== undefined ? o.visible : true; 

		//if( j.mode ==='Generic' ) console.log( j.getAxisY() )

		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j );


	}

	set ( o = {}, j = null ) {

		let i, k, axe, translate, rotate

		if( j === null ) j = this.byName( o.name )
		if( j === null ) return

	


	}


}

