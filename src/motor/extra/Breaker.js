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
		this.maxDebris = 1500

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

		
		const size = new Vector3();
		mesh.geometry.boundingBox.getSize( size )
		const baseSize = size.length();

		


		//let parentMatrix = mesh.matrix.clone().invert()

		//let debris = this.convexBreaker.subdivideByImpact( mesh, this.tpos.fromArray(pos), this.tnormal.fromArray(normal), breakOption[ 1 ], breakOption[ 2 ] );

		//                                                                                              maxRadialIterations, maxRandomIterations
		let fragment = SubdivideByImpact( mesh, this.tpos.fromArray(pos), this.tnormal.fromArray(normal), breakOption[ 1 ], breakOption[ 2 ], intern );
		let debris = FragmentsToMesh( fragment, mesh, this.interneMat, intern, 0 )

		//console.log( debris.length )

		if(debris.length<1) return

		// remove one level
		//breakOption[ 3 ] -= 1;

		//console.log(breakOption[ 3 ])
		
		const heritage = {
			basename: name,
			material: mesh.material,
			linearVelocity:mesh.velocity.toArray(),
			angularVelocity:mesh.angular.toArray(),
			//density: mesh.density,
			mass:mesh.mass
		}

		// add debris
		let list = []
		let i = debris.length, n = 0, m, nv, ratio;
		let herit, breako

		while ( i -- ){ 
			m = debris[ n ];
			nv = m.geometry.attributes.position.count;// physx can't use lese that 4 vertex
			ratio = m.sizer/baseSize;

			herit = {...heritage};
			herit.mass = mesh.mass * ratio;

			breako = [...breakOption];
			if(ratio<0.3) breako[3] = 0;
			if(ratio>0.8) breako[3] = breako[3];
			else breako[3] = breako[3]-1;

			if(m.sizer>0.02 && nv > 5) list.push( this.addDebris( m, breako, herit ) );
			n++
		}

        // remove original object and add debrit
        //this.motor.remove( name, true )
        //this.tt = setTimeout( ()=>{
        	//this.motor.remove( name )
		this.motor.add( list )

		this.tt = setTimeout( ()=>{this.activeCollider(list)}, 1000 )
		

	}

	activeCollider ( list ) {

		const contactList = []

		let item
		for(let m in list){
			item = list[m];
			if(item.breakable){
				 contactList.push({ type:'contact', name:'cc_'+item.name,  b1:item.name, callback: null })
			}
		}

		this.motor.add( contactList )

	}

	addDebris ( mesh, breakOption, heritage ) {

		let breakable = breakOption[ 3 ] > 0 ? true : false;

		let name = heritage.basename +'_debris_' + (this.nDebris++)

		let deb = {

			...heritage,

			name: name,
			type: 'convex',
			shape: mesh.geometry,
			material:mesh.material, //
			//material: breakable ? mesh.material : 'debug',
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