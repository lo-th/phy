import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { root, Utils, Vec3, Quat, mapCollider } from './root.js';


export class Body extends Item {

	constructor () {

		super();
		
		this.Utils = Utils

		this.type = 'body'
		this.num = Num[this.type]
		this.full = false

		this.p = new Vec3()
		
		this.q = new Quat()

		this.v = new Vec3()
		this.r = new Vec3()
		//this.t = new Transform()

		//this.sc = new ShapeConfig()

	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ]
		this.full = full
	}

	step ( AR, N ) {

		let i = this.list.length, b, n;

		while( i-- ){

			b = this.list[i];
			n = N + ( i * this.num )

			if( !b ){ 
				AR[n]=AR[n+1]=AR[n+2]=AR[n+3]=AR[n+4]=AR[n+5]=AR[n+6]=AR[n+7] = 0
				continue
			}

			if (!b.isValid()) continue

			AR[ n ] = b.isSleeping() ? 0 : 1

			if( b.isSleeping() ) b.setGravityScale( 0 );
			else b.setGravityScale( 1 );

			this.p.copy( b.translation() )
			this.q.copy( b.rotation() )

			this.p.toArray( AR, n+1 )
			this.q.toArray( AR, n+4 )

			if( this.full ){
				this.v.copy(b.linvel())
				this.v.toArray( AR, n+8 ) // velocity
				AR[ n ] = b.isSleeping() ? 0 : this.v.length() * 9.8
				this.r.copy(b.angvel())
				this.r.toArray( AR, n+11 )
			}
			

		}

	}

	///

	shape ( o = {} ) {


		let g;
		let t = o.type || 'box'
		let s = o.size || [1,1,1];

		let h, i, n

		switch( t ){

			case 'plane':
			
			if( s[0]===1 ) s = [300,0,300]

			h = [
			    s[0]*0.5, 0, s[2]*0.5,
			    s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, s[2]*0.5,
			]

			g = RAPIER.ColliderDesc.convexHull( h )

			break;

			case 'box' : g = RAPIER.ColliderDesc.cuboid(s[0] * 0.5, s[1] * 0.5, s[2] * 0.5); break;
			case 'ChamferBox' : g = RAPIER.ColliderDesc.roundCuboid(s[0] * 0.5, s[1] * 0.5, s[2] * 0.5, o.radius ); break;
			case 'sphere' : g = RAPIER.ColliderDesc.ball(s[0]); break;
			case 'cone' : g = RAPIER.ColliderDesc.cone( s[1] * 0.5, s[0] ); break;
			case 'ChamferCone' : g = RAPIER.ColliderDesc.roundCone( s[1] * 0.5, s[0], o.radius ); break;
			case 'cylinder' : g = RAPIER.ColliderDesc.cylinder( s[1] * 0.5, s[0] ); break;
			case 'ChamferCyl' : g = RAPIER.ColliderDesc.roundCylinder( s[1] * 0.5, s[0], o.radius ); break;
			case 'capsule' : g = RAPIER.ColliderDesc.capsule(s[1] * 0.5, s[0]); break;
			case 'convex' : g = RAPIER.ColliderDesc.convexHull( o.v, o.index || null ); break;
			case 'convexmesh': g = RAPIER.ColliderDesc.convexMesh( o.v, o.index || null ); break;
			case 'roundConvexHull': g = RAPIER.ColliderDesc.roundConvexHull( o.v, o.index || null, o.radius ); break;
			case 'roundConvexMesh': g = RAPIER.ColliderDesc.roundConvexMesh( o.v, o.index || null, o.radius ); break;
			case 'mesh': g = RAPIER.ColliderDesc.trimesh( o.v, o.index || null ); break;
			case 'heightfield':
			//g = RAPIER.ColliderDesc.heightfield( nrows: number, ncols: number, heights: Float32Array, scale: Vector );
			break;

			case 'triangle': g = RAPIER.ColliderDesc.triangle( new Vec3().fromArray( o.v, 0 ), new Vec3().fromArray( o.v, 3 ), new Vec3().fromArray( o.v, 6 ) ); break;
			case 'roundTriangle': g = RAPIER.ColliderDesc.roundTriangle( new Vec3().fromArray( o.v, 0 ), new Vec3().fromArray( o.v, 3 ), new Vec3().fromArray( o.v, 6 ), o.radius ); break;
			case 'segment': g = RAPIER.ColliderDesc.segment( new Vec3().fromArray( o.v, 0 ), new Vec3().fromArray( o.v, 3 ) ); break;
			case 'polyline': g = RAPIER.ColliderDesc.polyline( o.v, o.index || null ); break;

		}


		let p = o.localPos || [0,0,0]
		g.setTranslation(p[0], p[1], p[2])

		this.q.fromArray( o.localQuat || [0,0,0,1] )
		g.setRotation( this.q )


		// The density of the shape, usually in Kg/m^3. def = 1
        g.setDensity( o.density || 0 ) 
        //if( o.mass !== undefined ) sc.density = o.mass; // extra mass for static body test ??

        //g.setMassProperties(mass: number, centerOfMass: Vector, principalAngularInertia: Vector, angularInertiaLocalFrame: Rotation)

        // The coefficient of friction of the shape. def = 0.2
        if( o.friction !== undefined ) g.setFriction( o.friction )
        
        // The coefficient of restitution of the shape. def = 0
        if( o.restitution !== undefined ) g.setRestitution( o.restitution )

        if( o.sensor !== undefined ) g.setSensor( o.sensor )
        if( o.isTrigger !== undefined ) g.setSensor( o.isTrigger )


        // https://rapier.rs/docs/user_guides/javascript/colliders
    
        // The membership and filter are both 16-bit bit masks packed into a single 32-bits value. 
        // The 16 left-most bits contain the memberships whereas the 16 right-most bits contain the filter.
        
        // The bits of the collision groups to which the shape belongs. def = -1
        // The groups filter indicates what groups the collider can interact with (one bit per group)
        
        //if( o.mask !== undefined ) g.setSolverGroups(o.mask)
        // The bits of the collision groups with which the shape collides. def = 1
        // The groups membership indicates what groups the collider is part of (one bit per group)
        //if( o.group !== undefined ) g.setCollisionGroups(o.group)//sc.collisionGroup = o.group
        

	    //Set the collision types active for this collider.
	    /*RAPIER.ALL
		RAPIER.DEFAULT
		RAPIER.DYNAMIC_DYNAMIC
		RAPIER.DYNAMIC_KINEMATIC
		RAPIER.DYNAMIC_STATIC
		RAPIER.KINEMATIC_KINEMATIC
		RAPIER.KINEMATIC_STATIC
		RAPIER.STATIC_STATIC
	    g.setActiveCollisionTypes(ActiveCollisionTypes)
	    */

	    //Set the events active for this collider.
	    //Use this to enable contact and/or intersection event reporting for this collider.
	    //g.setActiveEvents(RAPIER.CONTACT_EVENTS)
	    //g.setActiveEvents(RAPIER.INTERSECTION_EVENTS)

	    //Set the physics hooks active for this collider.
	    //Use this to enable custom filtering rules for contact/intersecstion pairs involving this collider.
	    //g.setActiveHooks(RAPIER.FILTER_CONTACT_PAIRS)
	    //g.setActiveHooks(RAPIER.FILTER_INTERSECTION_PAIRS)


	    // Use this when configuring the ColliderDesc to specify how friction and restitution coefficient should be combined in a contact.
	    //g.setFrictionCombineRule(0)
	    //g.setRestitutionCombineRule(0)



		return g

	}

	add ( o = {} ) {


		let name = this.setName( o );

		// https://rapier.rs/javascript3d/globals.html#interactiongroups

		let bodyDesc

		

		switch( this.type ){
			case 'body':
			if( o.kinematic ){ 
				if( o.velocityBased ) bodyDesc = RAPIER.RigidBodyDesc.kinematicVelocityBased()
				else bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
			} else bodyDesc = RAPIER.RigidBodyDesc.dynamic()
			break;
			case 'solid':
			bodyDesc = RAPIER.RigidBodyDesc.fixed()
			break;
		}

		// build the rigid-body.
		let b = root.world.createRigidBody( bodyDesc ), collider

		switch( o.type ){

			case 'null':

			    collider = root.world.createCollider( this.shape( { type:'segment', v:[-0.01, 0, 0, 0.01, 0, 0], sensor:true } ), b );
			    mapCollider.set( collider.handle, collider )

			break;
			
			case 'compound':

				let gs = [], n;

				for ( var i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

			        if( o.density !== undefined ) n.density = o.density
			        if( o.friction !== undefined ) n.friction = o.friction
			        if( o.restitution !== undefined ) n.restitution = o.restitution
			        if( o.mask !== undefined ) n.collisionMask = o.mask
			        if( o.group !== undefined ) n.collisionGroup = o.group
			        //if( o.margin !== undefined ) n.margin = o.margin
			        //if( o.contactCallback !== undefined ) n.contactCallback = new ContactCallback()//o.contactCallback;

					if( n.pos ) n.localPos = n.pos
					if( n.quat ) n.localQuat = n.quat

				    collider = root.world.createCollider( this.shape( n ), b );
				    mapCollider.set( collider.handle, collider )

				}

			break;
			default:

			    collider = root.world.createCollider( this.shape( o ), b );
			    mapCollider.set( collider.handle, collider )

			break;

		}

		b.name = name
		b.type = this.type
		b.first = true

		b.collid = collider

		b.isSensor = o.isTrigger ? o.isTrigger : false



		// add to world
		this.addToWorld( b, o.id )

		//console.log(b)

		// apply option
		this.set( o, b )

		//console.log(b)

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		let autowake = o.activate ? o.activate : true;

	    // state
		if( o.sleep ){ b.sleep(); autowake = false;   }
		if( o.activate || o.wake ){ b.wakeUp() }
		//if( o.neverSleep !== undefined ) b.setCanSleep( !o.neverSleep )

		if( o.noGravity ) b.setGravityScale( 0 )

		// position / rotation
		if( o.pos ) b.setTranslation( this.v.fromArray( o.pos ), autowake )
		if( o.quat ) b.setRotation( this.q.fromArray( o.quat ), autowake )

		// Applies the force `force` to `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
		if( o.worldForce ) b.applyForceAtPoint( this.v.fromArray( o.worldForce ), this.v.fromArray( o.worldForce, 3 ), autowake )
		if( o.force ) b.applyForce( this.v.fromArray( o.force ), autowake )
		if( o.torque ) b.applyTorque( this.v.fromArray( o.torque ), autowake )

	    // Applies the impulse `impulse` to the rigid body at `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
	    if( o.impulse ) b.applyImpulseAtPoint( this.v.fromArray( o.impulse ), this.v.fromArray( o.impulse, 3 ), autowake )
	    if( o.linearImpulse ) b.applyImpulse( this.v.fromArray( o.linearImpulse ), autowake )
	    if( o.angularImpulse ) b.applyTorqueImpulse( this.v.fromArray( o.angularImpulse ), autowake )

	    // lock
	    if ( o.linearFactor !== undefined ) b.restrictTranslations( o.linearFactor[0] ? true:false, o.linearFactor[1] ? true:false, o.linearFactor[2] ? true:false, autowake )
	    if ( o.angularFactor !== undefined ) b.restrictRotations( o.angularFactor[0] ? true:false, o.angularFactor[1] ? true:false, o.angularFactor[2] ? true:false, autowake );

	    if ( o.lockPosition !== undefined ) b.lockTranslations( o.lockRotation, autowake )
	    if ( o.lockRotation !== undefined ) b.lockRotations( o.lockRotation, autowake )

	    // velocity
	    if( o.linearVelocity ) b.setLinvel( this.v.fromArray( o.linearVelocity ), autowake )
	    if( o.angularVelocity ) b.setAngvel( this.v.fromArray( o.angularVelocity ), autowake )

	    if( o.gravityScale ) b.setGravityScale( o.gravityScale, autowake );

	    // Each rigid-body is part of a dominance group in [-127; 127] (the default group is 0).
	    // damping coefficients
	    if( o.dominance ) b.setDominanceGroup( o.dominance );

	    // Sets the linear and angular damping. [ 0,0 ]
	    // Damping lets you slow down a rigid-body automatically. This can be used to achieve a wide variety of effects like fake air friction
	    if( o.damping ){
		     b.setLinearDamping( o.damping[0] )
		     b.setAngularDamping( o.damping[1] )
		 }

		if( o.reset ){ 
			b.setLinvel( this.v.set( 0, 0, 0), false )
			b.setAngvel( this.v.set( 0, 0, 0), false )
		}

		if( o.enableCCD !== undefined ) b.setCcdEnabled( o.enableCCD );

	}

	clearShapes ( o = {}, b = null  ){

		let i = b.numColliders()
		while(i--){
			mapCollider.delete( b.collider(i) )
		}

	}

	setShapes ( o = {}, b = null  ){

		let i = b.numColliders(), s
		while(i--){

			s = mapCollider.get( b.collider(i) )

			if( o.density !== undefined ) s.setDensity( o.density )
		    if( o.friction !== undefined ) s.setFriction( o.friction )
		    if( o.restitution !== undefined ) s.setRestitution( o.restitution )
		    //if( o.mask !== undefined ) s.setCollisionMask( o.mask )
		    //if( o.group !== undefined ) s.setCollisionGroup( o.group )
		    //if( o.callback !== undefined ) s.setContactCallback( o.callback );

		}


	}

}