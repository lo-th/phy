import { root, Utils } from '../root.js';
//import { ConvexObjectBreaker } from '../3TH/objects/ConvexObjectBreaker.js';
import { ConvexObjectBreaker } from '../../jsm/misc/ConvexObjectBreaker.js';
 
export class Breaker {

	constructor () {

		this.convexBreaker = new ConvexObjectBreaker();
		this.tmpI = new THREE.Vector3();

		this.tpos = new THREE.Vector3();
		this.tnormal = new THREE.Vector3();

		this.nDebris = 0
		this.maxDebris = 300

		this.tt = null

	}

	step () {

		let p;

		for( let n in root.reflow.point ){

			p = root.reflow.point[n];

			//if ( !b1.breakable && !b2.breakable ) continue;

			

			if ( p.distance !== 0 ) {

				this.makeBreak( p.b1, p.pos, p.normal, p.impulse, p.v1 );
				this.makeBreak( p.b2, p.pos, p.normal, p.impulse, p.v2 );
				
			} 
		}
	}

	makeBreak ( name, pos, normal, impulse, v ) {

		let mesh = Utils.byName( name );

		if ( !mesh ) return;
		if ( !mesh.breakable ) return;



		let breakOption = mesh.breakOption;
		//let imp = this.tmpI.fromArray( impulse ).length();

		//console.log( name, impulse )

		// not enoputh impulse to break
		if ( impulse < breakOption[ 0 ] ) return;


		//let parentMatrix = mesh.matrix.clone().invert()

		let debris = this.convexBreaker.subdivideByImpact( mesh, this.tpos.fromArray(pos), this.tnormal.fromArray(normal), breakOption[ 1 ], breakOption[ 2 ] );

		//console.log( debris.length )

		if(debris.length<1) return

		// remove one level
		breakOption[ 3 ] -= 1;
		
		const eritage = {
			material: mesh.material,
			linearVelocity: [v[0], v[1], v[2]],
			angularVelocity: [v[3], v[4], v[5]],
			density: mesh.density,
		}

		// add debris
		let list = []
		let i = debris.length, n = 0;
		while ( i -- ){ 
			list.push( this.addDebris( debris[ n ], breakOption, eritage ) );
			n++
		}

        // remove original object and add debrit
        //root.motor.remove( name, true )
        this.tt = setTimeout( ()=>{
        	root.motor.remove( name )
		    root.motor.add( list )
        }, 0 )
		

	}

	addDebris ( mesh, breakOption, eritage ) {

		let breakable = breakOption[ 3 ] > 0 ? true : false;

		let name = 'debris_' + (this.nDebris++)

		let deb = {

			...eritage,

			name: name,
			type: 'convex',
			shape: mesh.geometry,
			//size:[1,1,1],
			pos: mesh.position.toArray(),
			quat: mesh.quaternion.toArray(),
			breakable: breakable,
			breakOption:breakOption,

		}

		//this.nDebris++
		if( this.nDebris>this.maxDebris ) this.nDebris = 0


		return deb

	}

}