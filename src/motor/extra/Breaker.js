import { Vector3, MeshBasicMaterial } from 'three';
//import { ConvexObjectBreaker } from '../3TH/objects/ConvexObjectBreaker.js';
//import { ConvexObjectBreaker } from '../../jsm/misc/ConvexObjectBreaker.js';
import { FragmentsToMesh, SubdivideByImpact, Fracture } from "../../libs/fracture.module.js"


export class Breaker {

	constructor (motor) {

		this.motor = motor
		//this.motor.activeContact();

		//this.convexBreaker = new ConvexObjectBreaker();
		//this.tmpI = new Vector3();
		this.tpos = new Vector3();
		this.tnormal = new Vector3();

		this.nDebris = 0
		this.maxDebris = 1000

		this.interneMat = this.motor.getMat('chrome')//new MeshBasicMaterial({ color:0xff0000 })

		this.tt = null

	}

	step () {

		let p;

		for( let n in this.motor.reflow.point ){

			p = this.motor.reflow.point[n];

			//if ( !b1.breakable && !b2.breakable ) continue;

			

			if ( p.distance !== 0 ) {

				this.makeBreak( p.b1, p.pos, p.normal, p.impulse, p.v1 );
				this.makeBreak( p.b2, p.pos, p.normal, p.impulse, p.v2 );
				
			} 
		}
	}

	makeBreak ( name, pos, normal, impulse, v ) {

		let mesh = this.motor.utils.byName( name );

		if ( !mesh ) return;
		if ( !mesh.breakable ) return;



		let breakOption = mesh.breakOption;

		const intern = breakOption[4] !== undefined ? breakOption[4] : true;
		//let imp = this.tmpI.fromArray( impulse ).length();

		//console.log( name, impulse )

		// not enoputh impulse to break
		if ( impulse < breakOption[ 0 ] ) return;

		// remove contact ??
		this.motor.remove( 'cc_' + name )
		this.motor.remove( name )



		//let parentMatrix = mesh.matrix.clone().invert()

		//let debris = this.convexBreaker.subdivideByImpact( mesh, this.tpos.fromArray(pos), this.tnormal.fromArray(normal), breakOption[ 1 ], breakOption[ 2 ] );

		//                                                                                              maxRadialIterations, maxRandomIterations
		let fragment = SubdivideByImpact( mesh, this.tpos.fromArray(pos), this.tnormal.fromArray(normal), breakOption[ 1 ], breakOption[ 2 ], intern );
		let debris = FragmentsToMesh( fragment, mesh, this.interneMat, intern, 0 )

		//console.log( debris.length )

		if(debris.length<1) return

		// remove one level
		breakOption[ 3 ] -= 1;
		
		const heritage = {
			basename: name,
			material: mesh.material,
			linearVelocity:mesh.velocity.toArray(),
			angularVelocity:mesh.angular.toArray(),
			//linearVelocity: [v[0], v[1], v[2]],
			//angularVelocity: [v[3], v[4], v[5]],
			//density: mesh.density,
			mass:0
		}

		// add debris
		let list = []
		let i = debris.length, n = 0, m, nv;
		let mass = mesh.mass/i;
		heritage.mass = mass;
		while ( i -- ){ 
			m = debris[ n ];
			nv = m.geometry.attributes.position.count;// physx can't use lese that 4 vertex
			if(m.sizer>0.02 && nv > 5) list.push( this.addDebris( m, breakOption, heritage ) );
			n++
		}

        // remove original object and add debrit
        //this.motor.remove( name, true )
        //this.tt = setTimeout( ()=>{
        	//this.motor.remove( name )
		    this.motor.add( list )
        //}, 60 )
		

	}

	addDebris ( mesh, breakOption, heritage ) {

		let breakable = breakOption[ 3 ] > 0 ? true : false;

		let name = heritage.basename +'_debris_' + (this.nDebris++)

		//console.log(mesh.position.toArray())
		let deb = {

			...heritage,

			name: name,
			type: 'convex',
			shape: mesh.geometry,
			material:mesh.material,
			//size:[1,1,1],
			pos: mesh.position.toArray(),
			quat: mesh.quaternion.toArray(),
			breakable: breakable,
			breakOption: breakOption,

		}

		//this.nDebris++
		if( this.nDebris>this.maxDebris ) this.nDebris = 0


		return deb

	}

}