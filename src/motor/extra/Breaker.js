import { Vector3, MeshBasicMaterial } from 'three';
//import { ConvexObjectBreaker } from '../3TH/objects/ConvexObjectBreaker.js';
//import { ConvexObjectBreaker } from '../../jsm/misc/ConvexObjectBreaker.js';
import { FragmentsToMesh, SubdivideByImpact, Fracture } from "../../libs/fracture.module.js"


export class Breaker {

	constructor (motor) {

		this.motor = motor;

		this.tpos = new Vector3();
		this.tnormal = new Vector3();

		this.nDebris = 0
		this.maxDebris = 1500

		this.interneMat = this.motor.getMat('chrome')//new MeshBasicMaterial({ color:0xff0000 })


		this.tt = null

	}

	add( body, ignore = [] ){

		let self = this;

		let delay = 0

		if( body.name.search('_debris_') !== -1 ) delay = 1000

		setTimeout( ()=>{ 

			self.motor.addCollision({ name:body.name, ignore:body.ignore })
			body.addEventListener( 'collision', (event) => { 
				let d = event.data;
				if(d.hit === 1) self.makeBreak( d.from, d.point, d.normal, d.impulse, d.v1 );
			})

		}, delay )

		

	}

	makeBreak ( name, pos, normal, impulse, v ) {

		let mesh = this.motor.byName( name );

		if ( !mesh ) return;
		if ( !mesh.breakable ) return;

		let breakOption = mesh.breakOption;

		const intern = breakOption[4] !== undefined ? breakOption[4] : true;
		//let imp = this.tmpI.fromArray( impulse ).length();

		//console.log( name, impulse )

		// not enoputh impulse to break
		if ( impulse < breakOption[ 0 ] ) return;

		// remove contact ??
		//this.motor.remove( 'cc_' + name )
		this.motor.removeCollision( name )
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

		// add debris
		let list = []
		let i = debris.length, n = 0, m, nv, ratio;
		let herit, breako
		let ignore = [...mesh.ignore]

		while ( i -- ){ 

			m = debris[ n ];
			nv = m.geometry.attributes.position.count;// physx can't use lese that 4 vertex
			ratio = m.sizer/baseSize;

			herit = {};
			breako = [...breakOption];
			// remove one level if big enouth
			breako[3] = breako[3]-1
			if(ratio < 0.2) breako[3] = 0;
			//else ;

			if( m.sizer > 0.02 && nv > 6) {
				this.nDebris ++
				herit.name = name+'_debris_'+n
				herit.mass = mesh.mass * ratio;
				list.push( this.addDebris( m, breako, herit ) )
				ignore.push(herit.name)
			}
			n++
		}

		// disabler self collision
		i = list.length
		while ( i -- ){
			list[i]['ignore'] = ignore;
		}

        // remove original object and add debrit
        //this.motor.remove( name, true )
        //this.tt = setTimeout( ()=>{
        	//this.motor.remove( name )
		this.motor.add( list )

		//this.tt = setTimeout( ()=>{ this.activeSubCollider(list) }, 1000 )
		

	}

	addDebris ( mesh, breakOption, heritage ) {

		let breakable = breakOption[ 3 ] > 0 ? true : false;

		//let name = heritage.basename +'_debris_' + (this.nDebris++)

		let deb = {

			...heritage,

			//name: name,
			type: 'convex',
			shape: mesh.geometry,
			material: mesh.material, //
			//material: breakable ? mesh.material : 'debug',
			//size:[1,1,1],
			pos: mesh.position.toArray(),
			quat: mesh.quaternion.toArray(),
			breakable: breakable,
			breakOption: breakOption,

		}

		//console.log(breakOption)

		//this.nDebris++
		//if( this.nDebris>this.maxDebris ) this.nDebris = 0

		return deb

	}

}