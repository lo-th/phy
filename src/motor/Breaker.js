import { root, map, Utils } from './root.js';
//import { ConvexObjectBreaker } from '../3TH/objects/ConvexObjectBreaker.js';
import { ConvexObjectBreaker } from '../jsm/misc/ConvexObjectBreaker.js';
 
export class Breaker {

	constructor () {

		this.convexBreaker = new ConvexObjectBreaker();
		this.tmpI = new THREE.Vector3();

		this.tpos = new THREE.Vector3();
		this.tnormal = new THREE.Vector3();

		this.nDebris = 0
		this.maxDebris = 300

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

		//console.log( name, mesh )

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
		
		
		
		//root.flow.remove.push( name )

		const eritage = {
			material: mesh.material,
			linearVelocity: [v[0], v[1], v[2]],
			angularVelocity: [v[3], v[4], v[5]],
			density: mesh.density,
		}

		// add debris
		let list = []
		let i = debris.length;
		while ( i -- ){ 
			//root.flow.add.push( this.addDebris( name, i, debris[ i ], breakOption, velocity ) );
			list.push( this.addDebris( debris[ i ], breakOption, eritage ) );
		}

        // remove original object and add debrit
        root.motor.remove( name, true )
        setTimeout( ()=>{
		    root.motor.add( list )
        }, 0 )
		

	}

	addDebris ( mesh, breakOption, eritage ) {

		let next = breakOption[ 3 ] > 0 ? true : false;

		let deb = {

			...eritage,

			//name: name + 'debris_' + id,
			name: 'debris_' + this.nDebris,
			type: 'convex',
			shape: mesh.geometry,
			size:[1,1,1],
			pos: mesh.position.toArray(),
			quat: mesh.quaternion.toArray(),
			breakable: next,
			breakOption:breakOption,

		}

		this.nDebris++
		if(this.nDebris>this.maxDebris) this.nDebris = 0


		return deb

	}

}