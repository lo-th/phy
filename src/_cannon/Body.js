import * as CANNON from '../libs/cannon-es.js'


import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { root, Utils, Vec3, Quat } from './root.js';
import { QuickHull } from './QuickHull.js';

export class Body extends Item {

	constructor () {

		super();
		
		this.Utils = Utils

		this.type = 'body'
		this.num = Num[this.type]
		this.full = false

		this.p = new Vec3()
		this.v = new Vec3()
		this.q = new Quat()


	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ]
		this.full = full
	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, b, n;

		while( i-- ){

			b = this.list[i];
			n = N + ( i * this.num )

			if( !b ){ 
				AR[n]=AR[n+1]=AR[n+2]=AR[n+3]=AR[n+4]=AR[n+5]=AR[n+6]=AR[n+7] = 0
				continue
			}

			//this.v.copy( b.velocity )

			AR[ n ] = b.sleepState === 2 ? 0 : 1 // speed km/h

			//b.interpolatedPosition.toArray( AR, n+1 )
			//b.interpolatedQuaternion.toArray( AR, n+4 )

			b.position.toArray( AR, n+1 )
			b.quaternion.toArray( AR, n+4 )

			if( this.full ){
				this.v.copy( b.velocity )
				this.v.toArray( AR, n+8 ) // velocity
				AR[ n ] = b.isSleeping() ? 0 : this.v.length() * 9.8
				//this.r.copy(b.angvel())
				//this.r.toArray( AR, n+11 )
			}

		}

	}

	shape ( o = {} ) {


		let g;
		let t = o.type || 'box'
		let s = o.size || [1,1,1];

		let h, i, n, j;

		switch( t ){

			case 'plane':

			g = new CANNON.Plane();
			o.quat = [-0.7071067811865475, 0, 0, 0.7071067811865476]

			break;
			case 'particle' : g = new CANNON.Particle(); break;
			case 'box' : g = new CANNON.Box( this.v.set(s[0] * 0.5, s[1] * 0.5, s[2] * 0.5) ); break;
			case 'sphere' : g = new CANNON.Sphere( s[0] ); break;
			case 'cone' : g = new CANNON.Cylinder( 0.001, s[0], s[1]  ); break;
			case 'cylinder' : g = new CANNON.Cylinder( s[0], s[0], s[1]  ); break;
			case 'capsule' : g = new CANNON.Sphere( s[0] ); break;
			case 'convex' : 
			    i = Math.floor( o.v.length/3);
			    j = 0
			    h = [];
			    while( i-- ){
			    	n = j*3;
			    	h.push( this.v.fromArray( o.v, n ).clone() )
			    	//h.push( new CANNON.Vec3(0, 0, 0).fromArray( o.v, n ) )
			    	j++
			    }

			    let norm = undefined
			    if( o.normals ){
			    	i = Math.floor( o.normals.length/3);
			    	j = 0
				    norm = [];
				    while( i-- ){
				    	n = j*3;
				    	norm.push( this.v.fromArray( o.normals, n ).clone() )
				    	j++
				    }
			    }

			    /*const faces = []
		        for ( i = 0; i < this.v.length / 3; i += 3) {
		            faces.push([i, i + 1, i + 2])
		        }*/

			    // outch perf is slow
			    let faces = o.faces || QuickHull.createHull(h);

			    //console.log(faces)

			    //console.log(faces.length, o.index.length/3)

			    /*let faces = [];
			    i =  o.index.length/3;
			    j = 0
			    while( i-- ){
			    	n = j*3;
			    	faces.push( [ o.index[n], o.index[n+1], o.index[n+2] ] )
			    	j++
			    }*/

			   

			    g = new CANNON.ConvexPolyhedron( { vertices:h, faces:faces, normals:norm } );

			  
			break;
			case 'mesh' : 
 
			    g = new CANNON.Trimesh( o.v, o.index );
			  
			break;

		}

		let needNewMat = false

        if( o.friction !== undefined && o.friction !== 0.5 ) needNewMat = true
        if( o.restitution !== undefined && o.restitution !== 0.0) needNewMat = true

		if( needNewMat ){
			const mat = new CANNON.Material()
			mat.friction = o.friction || 0.5
			mat.restitution = o.restitution || 0.0
			g.material = mat
		}


		g.volumes = g.volume()

		return g

	}



	add ( o = {} ) {

		let name = this.setName( o );

		let volume = 0, g
		const gs = []



		// MAKE SHAPES

		switch( o.type ){

			case 'null': 

			    g = new CANNON.Particle()
			    g.localPos = new Vec3().fromArray(o.localPos||[0,0,0])
			    g.localQuat = new Quat().fromArray(o.localQuat||[0,0,0,1])
			    gs.push( g )

			break;
			
			case 'compound':

				let n;

				for ( var i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

			        if( o.density !== undefined ) n.density = o.density
			        if( o.friction !== undefined ) n.friction = o.friction
			        if( o.restitution !== undefined ) n.restitution = o.restitution
			        if( o.mask !== undefined ) n.collisionMask = o.mask
			        if( o.group !== undefined ) n.collisionGroup = o.group
			        if( o.margin !== undefined ) n.margin = o.margin
			        //if( o.contactCallback !== undefined ) n.contactCallback = new ContactCallback()//o.contactCallback;

			        g = this.shape( n )
			        g.localPos = new Vec3().fromArray(n.pos||[0,0,0])
			        g.localQuat = new Quat().fromArray(n.quat||[0,0,0,1])
			        volume += g.volumes;
			        gs.push( g )

				}

			break;
			case 'capsule':
				g = this.shape( o )
				g.localPos = new Vec3().fromArray(o.localPos||[0,0,0])
				g.localPos.y += o.size[1] * 0.5
				g.localQuat = new Quat().fromArray(o.localQuat||[0,0,0,1])
				gs.push( g )
				g = this.shape( o )
				g.localPos = new Vec3().fromArray(o.localPos||[0,0,0])
				g.localPos.y -= o.size[1] * 0.5
				g.localQuat = new Quat().fromArray(o.localQuat||[0,0,0,1])
				gs.push( g )
				
				volume += g.volumes;
			break;
			default:

			    if( o.shapeType ) o.type = o.shapeType;
			    g = this.shape( o );
			    g.localPos = new Vec3().fromArray(o.localPos||[0,0,0])
			    g.localQuat = new Quat().fromArray(o.localQuat||[0,0,0,1])
			    volume += g.volumes
			    gs.push( g )

			break;

		}

		let bodyConfig = {
			mass:( o.density || 0 ) * volume,
		}

		// MAKE RIGID BODY

		let b = new CANNON.Body( bodyConfig );

		for(let j in gs){
			b.addShape( gs[j], gs[j].localPos, gs[j].localQuat )
		}

		b.name = name
		b.types = this.type

		b.first = true

		// apply option
		this.set( o, b )

		// add to world
		this.addToWorld( b, o.id )

		//if(o.isTrigger)
		//console.log(b)

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return


		// position / rotation
		if( o.pos ) b.position.fromArray( o.pos )
		if( o.quat ) b.quaternion.fromArray( o.quat )

		// state

		if( o.sleep ) b.sleep()
		if( o.activate || o.wake ) b.wakeUp()
		if( o.neverSleep !== undefined ){ 
			b.allowSleep = !o.neverSleep;
			if( o.neverSleep )  b.wakeUp()
		}
			

		// Applies the force `force` to `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
		if( o.worldForce ) b.applyForce( this.v.fromArray( o.worldForce ), this.v.fromArray( o.worldForce, 3 ) )
		if( o.force ) b.applyLocalForce( this.v.fromArray( o.force ) )
		if( o.torque ) b.applyTorque( this.v.fromArray( o.torque ) )

	    if( o.impulse ) b.applyImpulse( this.v.fromArray( o.impulse ), this.v.fromArray( o.impulse, 3 ) )
	    if( o.localImpulse ) b.applyLocalImpulse( this.v.fromArray( o.localImpulse ), this.v.fromArray( o.localImpulse, 3 ) )

	    if( o.angularFactor ) b.angularFactor.fromArray( o.angularFactor ) // def 1,1,1
	    if( o.linearFactor ) b.linearFactor.fromArray( o.linearFactor )// def 1,1,1

	    if( o.linearVelocity ) b.velocity.fromArray( o.linearVelocity )
	    if( o.angularVelocity ) b.angularVelocity.fromArray( o.angularVelocity )


	    if( o.damping ){
		     b.linearDamping = o.damping[0]
		     b.angularDamping = o.damping[1]
		 }

		if( o.reset ){ 
			b.velocity.set( 0, 0, 0)
			b.angularVelocity.set( 0, 0, 0)
		}

	}


}