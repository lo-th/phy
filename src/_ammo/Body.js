import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';
import { Utils, root } from './root.js';


//----------------
//  AMMO BODY 
//----------------

export class Body extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'body';
		this.itype = 'body';
		this.num = Num[this.type];
		this.full = false;

		this.v = new Ammo.btVector3();
		this.vv = new Ammo.btVector3();
		this.q = new Ammo.btQuaternion();
		this.t = new Ammo.btTransform();

		this.v1 = new Ammo.btVector3();
		this.v2 = new Ammo.btVector3();
		this.v3 = new Ammo.btVector3();

	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ];
		this.full = full;
	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.itype];

		let i = this.list.length, b, n, v, r;

		while( i-- ){

			b = this.list[i];
			n = N + ( i * this.num );
			
			//AR[ n ] = b.getActivationState() === 2 ? 0 : 1; 
			AR[ n ] = b.isActive() ? 1 : 0;

			b.getMotionState().getWorldTransform( this.t );
			this.t.toArray( AR, n + 1 );

			if( this.full ){
				v = b.getLinearVelocity();
				r = b.getAngularVelocity();
				v.toArray( AR, n+8 );
				r.toArray( AR, n+11 );
				if( AR[ n ] === 1 ) AR[ n ] = v.length() * 9.8;// speed km/h
			}
			
		}

	}

	///

	shape ( o = {} ) {

		let g;
		let t = o.type || 'box';
		let s = o.size || [1,1,1];

		let i, n;

		switch( t ){

			case 'plane': 
			g = new Ammo.btStaticPlaneShape( this.v.fromArray(o.dir || [ 0, 1, 0 ] ), 0.001 ); 
			g.setLocalScaling(this.v.fromArray([ 1, 1, 1 ]))	
			break;// 0 : planeConstant ?
			case 'box' : g = new Ammo.btBoxShape( this.v.set(s[0] * 0.5, s[1] * 0.5, s[2] * 0.5) ); break;
			case 'particle' : g = new Ammo.btSphereShape( o.pSize || 0.05 ); break;
			case 'sphere' : g = new Ammo.btSphereShape( s[0] ); break;
			case 'cone' : g = new Ammo.btConeShape( s[0], s[1] ); break;
			case 'cylinder' : g = new Ammo.btCylinderShape( this.v.set( s[0], s[1] * 0.5, s[0] )); break;// def Y
			//btCylinderShapeX( height, radius, 0 )
			//btCylinderShapeZ( radius, 0, height )
			case 'capsule' : g = new Ammo.btCapsuleShape( s[0], s[1] );  break;
			case 'convex' : 

			    //let optimize = o.optimize !== undefined ? o.optimize : false;

			    g = new Ammo.btConvexHullShape();



			    i =  Math.floor( o.v.length/3 );
			    while( i-- ){

			    	n = i*3;
			    	g.addPoint( this.v.fromArray( o.v, n ), false )

			    }

			    //g.batchedUnitVectorGetSupportingVertexWithoutMargin()


		    	//g.optimizeConvexHull()
				g.recalcLocalAabb();
				//g.initializePolyhedralFeatures(1);
				//g.localGetSupportingVertexWithoutMargin( this.v.fromArray( 0,0,0 ) )

				//if( o.margin !== undefined ) g.setMargin( o.margin )


				//console.log(g.getNumPoints())
			    //console.log(g.getMarginNonVirtual())
				

			break;
			case 'mesh':

			//btTriangleMesh (bool use32bitIndices=true, bool use4componentVertices=true
				let des = new Ammo.btTriangleMesh(true, true)
				//let m = new Ammo.btIndexedMesh()
				//let des = new Ammo.btTriangleIndexVertexArray()
				console.log( des)

				
				let removeDuplicateVertices = false
				let v = o.v;
				let index = o.index || null
				let max = v.length
				let px, py, pz

				//console.log(des)

				if( index !== null ){

					//let tmpIndex = Utils.malloc( index )
					//des.addIndex(tmpIndex)

					max = v.length

					/*for ( i = 0; i < max; i += 9 ) {

						des.addTriangle( 
							this.v1.set( v[ i + 0 ], v[ i + 1 ], v[ i + 2 ] ),
							this.v2.set( v[ i + 3 ], v[ i + 4 ], v[ i + 5 ] ),
							this.v3.set( v[ i + 6 ], v[ i + 7 ], v[ i + 8 ] ),
							removeDuplicateVertices 
						)

					}*/

					for ( i = 0; i < max; i += 3 ) {
						des.findOrAddVertex( this.v.set( v[ i ], v[ i + 1 ], v[ i + 2 ] ), removeDuplicateVertices )
					}

					max = index.length

					for ( i = 0; i < max; i += 3 ) {
						// only work on bullet3 !!
						if( des.addTriangleIndices ) des.addTriangleIndices( index[i], index[i+1], index[i+2] )

					}

				} else {

					for ( i = 0; i < max; i += 9 ) {

						des.addTriangle( 
							this.v1.set( v[ i + 0 ], v[ i + 1 ], v[ i + 2 ] ),
							this.v2.set( v[ i + 3 ], v[ i + 4 ], v[ i + 5 ] ),
							this.v3.set( v[ i + 6 ], v[ i + 7 ], v[ i + 8 ] ),
							removeDuplicateVertices 
						)

					}

				}

				
				
				if ( this.type === 'solid' || !Ammo.btGImpactMeshShape ) {

					//bool useQuantizedAabbCompression, bool buildBvh=true

					// btScaledBvhTriangleMeshShape -- if scaled instances
					g = new Ammo.btBvhTriangleMeshShape( des, true, true );

					//console.log(g)
					
				} else {

					// only work on bullet2 !!
					// btGimpactTriangleMeshShape -- complex?
					// btConvexHullShape -- possibly better?
					g =  new Ammo.btGImpactMeshShape(des);//new Ammo.btConvexTriangleMeshShape( des, true );
					//g.setMargin(o.margin || 0.01);
					//g.setLocalScaling(new Ammo.btVector3(scale.x, scale.y, scale.z));
					g.updateBound();
					console.log(g)

				}

				///des.destroy()

			break;

		}

		//if( o.margin !== undefined && g.setMargin && o.type!=='sphere' && o.type!=='capsule') g.setMargin( o.margin )

		if( g.setMargin ) g.setMargin( o.margin || 0.0001 ) // )

		g.volume = MathTool.getVolume( t, s, o.v );

		return g;

	}

	add ( o = {} ) {

		let name = this.setName( o );


		let flag = o.flag !== undefined ? o.flag : this.type === 'solid' ? 1 : 0

		let group = o.group !== undefined ? o.group : this.type === 'solid' ? 2 : 1
		let mask = o.mask  !== undefined  ? o.mask : -1

		if( o.kinematic ){ 
			flag = 2
			group = 4
		}

		// shape goemetry

		let g = null; 

		switch( o.type ){

			case 'null': // ammo can't have null geometry !?

			    mask = 0
			    g = this.shape( {type:'sphere', size:[0.01] } )

			break;
			
			case 'compound':

			    g = new Ammo.btCompoundShape();
			    g.volume = 0

				let n, s, v;

				for ( var i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

					this.t.fromArray( n.pos, n.quat )

					s = this.shape( n )
					g.volume += s.volume

				    g.addChildShape( this.t, s );

				}

			break;
			default:
			
			    if( o.shapeType ) o.type = o.shapeType;
			    g = this.shape( o );

			break;

		}

		// start position / rotation
		this.t.fromArray( o.pos, o.quat )

		this.v.set(0,0,0)

		
		let mass = 0;
		if( o.mass && o.density ) delete o.density
		if( o.density ) mass = MathTool.massFromDensity( o.density || 0, g.volume )
		if( o.mass ) mass = o.mass

			//mass = mass *0.1

		//console.log(mass, o.density, o.volume)


		//mass = o.density || 0//o.density //* g.volume;
		//if ( o.density ) g.calculateLocalInertia( o.density, this.v );
		if ( mass !== 0 ){ 
			g.calculateLocalInertia( mass, this.v )
			//console.log('inertia', this.v.toArray() )
		}

		let motionState = new Ammo.btDefaultMotionState( this.t )
		//var rbInfo = new Ammo.btRigidBodyConstructionInfo( o.density || 0, motionState, g, this.v )
		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, g, this.v );




		let b = new Ammo.btRigidBody( rbInfo );

		b.setCollisionFlags( flag )

		Ammo.destroy( rbInfo );

		b.mass = mass
		b.g = g
	

		b.name = name
		b.type = this.type
		b.isKinematic = o.kinematic || false
		b.isGhost = false
		b.breakable = o.breakable || false

		if( b.breakable ) root.numBreak++

		b.group = group
		b.mask = mask

		b.first = true


		delete o.pos
		delete o.quat 
		if( o.kinematic ){ 
			o.neverSleep = true
			delete o.kinematic
		}

		
		// add to world
		this.addToWorld( b, o.id )

		// apply option
		this.set( o, b );


		

		//console.log(b)

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return;

		/*if ( o.density !== undefined ){

		    let mass =  ( o.density || 0 ) * b.g.volume
		    if ( mass !== 0 ) b.g.calculateLocalInertia( mass, this.v )
			b.setMassProps( mass, this.v )
		}*/

		if ( o.kinematic !== undefined ){ 
			b.setCollisionFlags( o.kinematic ? 2 : 0 ); 
			b.isKinematic = o.kinematic;
			if(!b.isKinematic) b.setGravity( root.gravity ) 
		}

		if ( o.flag !== undefined ){ 
			b.setCollisionFlags( o.flag ); 
			b.isKinematic = o.flag === 2 ? true : false; 
		}

		if( o.noGravity ) b.setGravity( this.v.fromArray( [0,0,0] ) )

		// position / rotation

		if( o.pos || o.quat ){

			//b.getWorldTransform( this.t )

			if( !o.pos || !o.quat ) b.getMotionState().getWorldTransform( this.t )
			if( !o.pos ) o.pos = this.t.getPos()
			if( !o.quat ) o.quat = this.t.getQuat()
			
			this.t.fromArray( o.pos, o.quat )
			if ( b.isKinematic ) b.getMotionState().setWorldTransform( this.t )
			else b.setWorldTransform( this.t )

		}

	    // state

		if ( o.state !== undefined ) b.setActivationState( o.state );
		if ( o.activate || o.wake ) b.activate();
		if( o.neverSleep !== undefined ){ // linear, angular
			if( o.neverSleep ){ b.setSleepingThresholds( 0, 0 ); b.activate(); }
			else{ b.setSleepingThresholds( 0.8, 1.0 ); }
		}

		if( o.sleep ) b.setActivationState( 2 )
		


		if ( o.friction !== undefined ) b.setFriction( o.friction );
		if ( o.restitution !== undefined ) b.setRestitution( o.restitution );
		if ( o.rollingFriction !== undefined ) b.setRollingFriction( o.rollingFriction );


		

	    if(o.reset){ 
			b.setLinearVelocity( this.v.set( 0, 0, 0) );
			b.setAngularVelocity( this.v.set( 0, 0, 0) );
		}

		if(!b.isGhost){
	    	
			if ( o.group !== undefined ){ b.getBroadphaseProxy().set_m_collisionFilterGroup( o.group ); b.group = o.group }
			if ( o.mask !== undefined ){ b.getBroadphaseProxy().set_m_collisionFilterMask( o.mask ); b.mask = o.mask }
			if ( o.damping !== undefined ) b.setDamping( o.damping[ 0 ], o.damping[ 1 ] );
			if ( o.sleeping !== undefined ) b.setSleepingThresholds( o.sleeping[ 0 ], o.sleeping[ 1 ] );

        }

        if( b.type === 'body' ){

	        /*b.getMotionState().getWorldTransform( this.t )
	        let q = this.t.getRotation()

	        if ( o.linearVelocity !== undefined ) b.setLinearVelocity( this.v.fromArray( o.linearVelocity ).applyQuaternion( q ) );
			if ( o.angularVelocity !== undefined ) b.setAngularVelocity( this.v.fromArray( o.angularVelocity ).applyQuaternion( q ) );// radian*/

		    if ( o.linearVelocity !== undefined ) b.setLinearVelocity( this.v.fromArray( o.linearVelocity ) );
			if ( o.angularVelocity !== undefined ) b.setAngularVelocity( this.v.fromArray( o.angularVelocity ) );// radian
		}


		/*if ( o.linearVelocityAdd !== undefined ){

			b.getLinearVelocity( this.vv );

			o.linearVelocityAdd[1] += this.vv.y()
			

		    b.setLinearVelocity( this.v.fromArray( o.linearVelocityAdd ) );
		}*/

		if ( o.linearFactor !== undefined ) b.setLinearFactor( this.v.fromArray( o.linearFactor ) );
		if ( o.angularFactor !== undefined ) b.setAngularFactor( this.v.fromArray( o.angularFactor ) );

		if ( o.anisotropic !== undefined ) b.setAnisotropicFriction( o.anisotropic[ 0 ], o.anisotropic[ 1 ] );
		if ( o.massProps !== undefined ) b.setMassProps( o.massProps[ 0 ], o.massProps[ 1 ])//vv);


		// for high speed object like bullet
		// http://www.panda3d.org/manual/?title=Bullet_Continuous_Collision_Detection
		// Don't do continuous collision detection if the motion (in one step) is less then m_ccdMotionThreshold
		if( o.bullet ){
			b.setCcdMotionThreshold( 1e-7 )
			b.setCcdSweptSphereRadius( 0.1 );
		}
		if ( o.ccdThreshold !== undefined ) b.setCcdMotionThreshold( o.ccdThreshold );// 1e-7
		if ( o.ccdRadius !== undefined ) b.setCcdSweptSphereRadius( o.ccdRadius ); // 0.2 // 0.0 by default

		if ( o.selfGravity !== undefined ) b.setGravity( this.v.fromArray( o.selfGravity ) );

		if ( o.gravity !== undefined ) b.setGravity( o.gravity ? root.gravity : this.v.fromArray( [0,0,0] ) );



		// Applies the force `force` to `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
		if( o.worldForce ) b.applyForce( this.v.fromArray( o.worldForce ), this.v.fromArray( o.worldForce, 3 ) );
		//if( o.force ) b.applyCentralForce( this.v.fromArray( o.force ).multiplyScalar(root.delta) );
		//if( o.localForce ) b.applyCentralForce( this.v.fromArray( o.localForce ).multiplyScalar(root.delta) );

		if( o.force ){ 
			b.applyForce( this.v.fromArray( o.force ).divideScalar(root.substep) );
		}

			//console.log( b )

		if( o.torque ) b.applyTorque( this.v.fromArray( o.torque ).divideScalar(root.substep) );
		//if( o.torque ) b.applyTorqueImpulse( this.v.fromArray( o.torque ).multiplyScalar(root.delta) );
		//if( o.torque ) b.applyTorqueTurnImpulse( this.v.fromArray( o.torque ).multiplyScalar(root.delta) );

		//if( o.torque ) b.applyTorqueImpulse( this.v.fromArray( o.torque ) );
	    // Applies the impulse `impulse` to the rigid body at `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
	    /*if( o.linearImpulse ) { 
	    	o.impulseCentral = o.linearImpulse
	    	//this.multiplyScalar( o.impulseCentral, root.delta, 3 )
	    }*/
	  
	    if( o.impulse ){ // impulseCenter is relative to the body position ?? 

	    	b.activate();

	    	if( o.impulseCenter ) {
	    	    // Convert contactPoint relative to center of mass
	    	    b.getMotionState().getWorldTransform( this.t );
	    		this.v2.fromArray( o.impulseCenter ).sub( this.t.getOrigin() );
	    		b.applyImpulse( this.v.fromArray( o.impulse ).multiplyScalar(0.7), this.v2 )

	    	} else {
	    		b.applyCentralImpulse( this.v.fromArray( o.impulse ) )
	    	}
	    }

	}

}


/*

applyCentralForce: ƒ (b)
applyCentralImpulse: ƒ (b)
applyCentralPushImpulse: ƒ (b)
applyDamping: ƒ (b)
applyForce: ƒ (b,c)
applyGravity: ƒ ()
applyImpulse: ƒ (b,c)
applyPushImpulse: ƒ (b,c)
applyTorque: ƒ (b)
applyTorqueImpulse: ƒ (b)
applyTorqueTurnImpulse: ƒ (b)
*/


// ___________________________STATE
//  1  : ACTIVE
//  2  : ISLAND_SLEEPING
//  3  : WANTS_DEACTIVATION
//  4  : DISABLE_DEACTIVATION
//  5  : DISABLE_SIMULATION

// ___________________________FLAG
//  1  : STATIC_OBJECT
//  2  : KINEMATIC_OBJECT
//  4  : NO_CONTACT_RESPONSE
//  8  : CUSTOM_MATERIAL_CALLBACK
//  16 : CHARACTER_OBJECT
//  32 : DISABLE_VISUALIZE_OBJECT
//  64 : DISABLE_SPU_COLLISION_PROCESSING

// ___________________________GROUP
//  -1   : ALL
//  1    : DEFAULT
//  2    : STATIC
//  4    : KINEMATIC
//  8    : DEBRIS
//  16   : SENSORTRIGGER
//  32   : NOCOLLISION
//  64   : GROUP0
//  128  : GROUP1
//  256  : GROUP2
//  512  : GROUP3
//  1024 : GROUP4
//  2048 : GROUP5
//  4096 : GROUP6
//  8192 : GROUP7

