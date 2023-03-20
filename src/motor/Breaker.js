import { root, map, Utils } from './root.js';
import { ConvexObjectBreaker } from '../3TH/objects/ConvexObjectBreaker.js';
 
export class Breaker {

	constructor () {

		this.convexBreaker = new ConvexObjectBreaker();
		this.tmpI = new THREE.Vector3();

	}

	step () {

		let p;

		for( let n in root.flow.point ){

			p = root.flow.point[n];

			//if ( !b1.breakable && !b2.breakable ) continue;

			//console.log( p )

			if ( p.distance !== 0 ) {

				this.makeBreak( p.b1, p.pos, p.normal, p.impulse, p.b1_velocity );
				this.makeBreak( p.b2, p.pos, p.normal, p.impulse, p.b2_velocity );
				
			} 
		}
	}

	makeBreak ( name, pos, normal, impulse, velocity ) {

		let mesh = Utils.byName( name );

		if ( !mesh ) return;
		if ( !mesh.breakable ) return;

		let breakOption = mesh.breakOption;
		let imp = this.tmpI.fromArray( impulse ).length();

		//console.log( name, imp )

		// not enoputh impulse to break
		if ( imp < breakOption[ 0 ] ) return;

		let debris = this.convexBreaker.subdivideByImpact( mesh, pos, normal, breakOption[ 1 ], breakOption[ 2 ] );

		// remove one level
		breakOption[ 3 ] -= 1;
		
		
		// remove original object
		root.motor.remove( name );
		//root.flow.remove.push( name )

		// add debris
		let list = []
		let i = debris.length;
		while ( i -- ){ 
			//root.flow.add.push( this.addDebris( name, i, debris[ i ], breakOption, velocity ) );
			list.push( this.addDebris( name, i, debris[ i ], breakOption, velocity ) );
		}

		root.motor.add( list )

	}

	addDebris ( name, id, mesh, breakOption, v ) {

		let next = breakOption[ 3 ] > 0 ? true : false;

		return {

			name: name + '_debris' + id,
			material: mesh.material,
			type: 'convex',
			shape: mesh.geometry,
			size:[1,1,1],
			pos: mesh.position.toArray(),
			quat: mesh.quaternion.toArray(),
			density: mesh.density,
			linearVelocity: [v[0], v[1], v[2]],
			angularVelocity: [v[3], v[4], v[5]],

			breakable: next,
			breakOption: next ? breakOption: null,
			filter:next ? [ 1, -1, [1,3,10, 11,15], 0] : [ 1, -1, 0, 0],

		}

	}

}