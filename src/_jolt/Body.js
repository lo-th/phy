import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';
import { Utils, root } from './root.js';


//----------------
//  JOLT BODY 
//----------------

// https://jrouwe.github.io/JoltPhysics/class_body.html


export class Body extends Item {

	constructor () {

		super();
		
		this.Utils = Utils;

		this.type = 'body';
		this.itype = 'body';
		this.num = Num[this.type];
		this.full = false;

		this.v = new Jolt.RVec3();
		this.q = new Jolt.Quat();

		this.v2 = new Jolt.RVec3();
		this.q2 = new Jolt.Quat();

	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ];
		this.full = full;
	}

	/*byId(n) {

		let i = this.list.length, b, id;

		while( i-- ){
			b = this.list[i];
			id = b.GetID();
			if( id === n ) return b;
		}

		return null;

	}*/

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.itype];

		let i = this.list.length, b, n, p, q, v, r;

		while( i-- ){

			b = this.list[i];
			if(!b) continue;
			n = N + ( i * this.num );

			if( b.lockPos ) root.bodyInterface.MoveKinematic( b.GetID(), b.GetPosition(), b.GetRotation(), root.deltaTime );

			AR[ n ] = b.IsActive() ? 1 : 0;

			p = b.GetPosition();
			q = b.GetRotation();

			p.toArray( AR, n+1 );
			q.toArray( AR, n+4 );

			if( this.full ){
				v = b.GetLinearVelocity();
			    r = b.GetAngularVelocity();
				v.toArray( AR, n+8 );
			    r.toArray( AR, n+11 );
			    if( AR[ n ] === 1 ) AR[ n ] = v.Length() * 9.8;// speed km/h
			}

		}

	}

	///

	shape ( o = {} ) {

		let shape = null;
		let t = o.type || 'box'
		let s = o.size || [1,1,1];

		let h, i, n, j, hull;

		// If objects are closer than this distance, they are considered to be colliding (used for GJK) (unit: meter)
		let inConvexRadius = 0.01; //0.05;

		let inMaterial = null//PhysicsMaterial 
		//new Jolt.PhysicsMaterialList

		switch( t ){

			case 'plane':
			s = [300,1,300]
			hull = new Jolt.ConvexHullShapeSettings;
			let point = [
			    s[0]*0.5, 0, s[2]*0.5,
			    s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, s[2]*0.5,
			]
			i = 4;
		    while( i-- ){
		    	n = i*3;
		    	hull.mPoints.push_back( this.v.fromArray( point, n ) );
		    }
		    shape = hull.Create().Get();

			break;

			case 'box' : shape = new Jolt.BoxShape( this.v.set( s[0] * 0.5, s[1] * 0.5, s[2] * 0.5), inConvexRadius, inMaterial ); break;
			case 'sphere' : shape = new Jolt.SphereShape(s[0], inMaterial); break;
			case 'cylinder' : shape = new Jolt.CylinderShape( s[1] * 0.5, s[0],  inConvexRadius, inMaterial ); break;
			case 'capsule' : shape = new Jolt.CapsuleShape( s[1] * 0.5, s[0],  inConvexRadius, inMaterial ); break;
			/*
			case 'particle' : g = new SphereGeometry( o.pSize || 0.05 ); break;
			*/
			
			case 'convex' : 
			    hull = new Jolt.ConvexHullShapeSettings;
			    i = Math.floor( o.v.length/3);
			    j = 0
			    while( i-- ){
			    	n = j*3;
			    	hull.mPoints.push_back( this.v.fromArray( o.v, n ) );
			    	j++
			    } 
			    shape = hull.Create().Get();

			break;
			case 'mesh' : 
			let triangles = new Jolt.TriangleList;
			let v = o.v;
			let numTri = Math.floor( v.length/3 );
			triangles.resize( numTri );
			i = numTri/3;
			j = 0
		    while( i-- ){
		    	n = j*9;
		    	let t = triangles.at(j);
		    	let v1 = t.get_mV(0), v2 = t.get_mV(1), v3 = t.get_mV(2);
		    	v1.x = v[ n+0 ]; v1.y = v[ n+1 ]; v1.z = v[ n+2 ];
		    	v2.x = v[ n+3 ]; v2.y = v[ n+4 ]; v2.z = v[ n+5 ];
		    	v3.x = v[ n+6 ]; v3.y = v[ n+7 ]; v3.z = v[ n+8 ];
		    	j++
		    }
			shape = new Jolt.MeshShapeSettings( triangles, inMaterial ).Create().Get();
			break;

		}

		if( o.density && shape.SetDensity ){ 
			//shape.SetDensity(o.density);
		}

		//console.log(g._volume, o.volume)

		//g.volume = MathTool.getVolume( t, s, o.v );

		/*sc.geometry = g;
		sc.position.fromArray( o.localPos || [0,0,0] );
		sc.rotation.fromQuat( this.q.fromArray( o.localQuat || [0,0,0,1] ) );


		// The density of the shape, usually in Kg/m^3. def = 1
		//if( o.mass && o.density ) delete o.density
        sc.density = o.density || 0;
        if( o.mass !== undefined ) sc.density = MathTool.densityFromMass( o.mass, MathTool.getVolume( t, s, o.v ) )*/


		//let shape = new Shape( sc );

	    shape.volume = MathTool.getVolume( t, s, o.v );

	    //console.log(shape)



		return shape;

	}

	shapeSetting ( o = {} ) {

		let sett = null;
		let t = o.type || 'box'
		let s = o.size || [1,1,1];

		let h, i, n, j;

		let inConvexRadius = 0.0 // what that ???
		let inMaterial = null//PhysicsMaterial 

		switch( t ){

			case 'box' : sett = new Jolt.BoxShapeSettings( this.v.set( s[0] * 0.5, s[1] * 0.5, s[2] * 0.5), inConvexRadius, inMaterial ); break;
			case 'sphere' : sett = new Jolt.SphereShapeSettings(s[0], inMaterial); break;
			case 'cylinder' : sett = new Jolt.CylinderShapeSettings( s[1] * 0.5, s[0],  inConvexRadius, inMaterial ); break;
			case 'capsule' : sett = new Jolt.CapsuleShapeSettings( s[1] * 0.5, s[0],  inConvexRadius, inMaterial ); break;
			/*
			case 'particle' : g = new SphereGeometry( o.pSize || 0.05 ); break;
			*/
			
			case 'convex' : 
			    sett = new Jolt.ConvexHullShapeSettings;

			    i = Math.floor( o.v.length/3);
			    j = 0
			    while( i-- ){
			    	n = j*3;
			    	sett.mPoints.push_back( this.v.fromArray( o.v, n ) );
			    	j++
			    } 
			break;
			case 'mesh' : 
			let triangles = new Jolt.TriangleList;
			let v = o.v;
			let numTri = Math.floor( v.length/3 );
			triangles.resize( numTri );
			i = numTri/3;
			j = 0
		    while( i-- ){
		    	n = j*9;
		    	let t = triangles.at(j);
		    	let v1 = t.get_mV(0), v2 = t.get_mV(1), v3 = t.get_mV(2);
		    	v1.x = v[ n+0 ]; v1.y = v[ n+1 ]; v1.z = v[ n+2 ];
		    	v2.x = v[ n+3 ]; v2.y = v[ n+4 ]; v2.z = v[ n+5 ];
		    	v3.x = v[ n+6 ]; v3.y = v[ n+7 ]; v3.z = v[ n+8 ];
		    	j++
		    }
			sett = new Jolt.MeshShapeSettings( triangles, inMaterial );
			break;

		}

	    sett.volume = MathTool.getVolume( t, s, o.v );

		return sett;

	}

	add ( o = {} ) {

		let name = this.setName( o );

		let tt = this.type === 'body' ? ( o.kinematic ? Jolt.EMotionType_Kinematic : Jolt.EMotionType_Dynamic ) : Jolt.EMotionType_Static;
		//EBodyType_SoftBody
		let move = this.type === 'body' ? root.LAYER_MOVING : root.LAYER_NON_MOVING;
		let volume = 0;

		if( o.move !== undefined )  move = o.move ? root.LAYER_MOVING : root.LAYER_NON_MOVING;

		let pos = this.v.fromArray(o.pos || [0,0,0]);
		let quat = this.q.fromArray(o.quat || [0,0,0,1]);

		// BodyCreationSettings

		let bcs;

		switch( o.type ){

			case 'null': 

				bcs = new Jolt.BodyCreationSettings( this.shape( { type:'sphere', size:[0.01] } ), this.v.fromArray(o.pos || [0,0,0]), this.q.fromArray(o.quat || [0,0,0,1]), tt , move );

			break;
			
			case 'compound':

			    let scs = new Jolt.StaticCompoundShapeSettings();

				let gs = [], n, ss;

				for ( var i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];
			        ss = this.shapeSetting( n );
			        volume += ss.volume;
					scs.AddShape( this.v2.fromArray(n.pos || [0,0,0]), this.q2.fromArray(n.quat || [0,0,0,1]), ss );
					//Jolt.destroy(ss);

				}

				bcs = new Jolt.BodyCreationSettings( scs.Create().Get(), this.v.fromArray(o.pos || [0,0,0]), this.q.fromArray(o.quat || [0,0,0,1]), tt , move );
				Jolt.destroy( scs );
			break;

			default:

			    if( o.shapeType ) o.type = o.shapeType;
			    let sp = this.shape( o );
			    volume = sp.volume;
			    bcs = new Jolt.BodyCreationSettings( sp, this.v.fromArray(o.pos || [0,0,0]), this.q.fromArray(o.quat || [0,0,0,1]), tt , move );
			    //Jolt.destroy(sp);
				
			break;

		}

		

		// set mass or density

		//console.log( bcs );

		//EOverrideMassProperties_CalculateInertia: 1
		//EOverrideMassProperties_CalculateMassAndInertia: 0
		//EOverrideMassProperties_MassAndInertiaProvided: 2

		if( o.density ) o.mass = MathTool.massFromDensity( o.density || 0, volume );
		if( o.mass ){
		    bcs.mOverrideMassProperties = 1;// Jolt.EOverrideMassProperties_CalculateInertia; 
			bcs.mMassPropertiesOverride.mMass = o.mass;
			
			//bcs.mGravityFactor = 2

		}

		 if( o.inertia ){ // mInertia is mat44
		 	// TODO not work !!!
		 	//
		 	bcs.mOverrideMassProperties = 1;
		 	//bcs.mMassPropertiesOverride.mInertia.sScale(this.v.fromArray( o.inertia ))
		 	bcs.mMassPropertiesOverride.mInertia.PostScaled(this.v.fromArray( o.inertia ))
		 	//bcs.mMassPropertiesOverride.mInertia.PostTranslated(this.v.fromArray( o.inertia ))
		 	//bcs.mMassPropertiesOverride.mInertia.sIdentity()
		 	//bcs.mMassPropertiesOverride.mInertia.sZero()
		 	//console.log( bcs.mMassPropertiesOverride.mInertia );
		 }

		 if( o.linearFactor || o.angularFactor ){

		 	let dof = 0;
		 	if( o.linearFactor ){		
		 		if(o.linearFactor[0]>0) dof |= Jolt.EAllowedDOFs_TranslationX
			 	if(o.linearFactor[1]>0) dof |= Jolt.EAllowedDOFs_TranslationY
			 	if(o.linearFactor[2]>0) dof |= Jolt.EAllowedDOFs_TranslationZ
		 	} else dof |= Jolt.EAllowedDOFs_TranslationX | Jolt.EAllowedDOFs_TranslationY | Jolt.EAllowedDOFs_TranslationZ;
		 	if( o.angularFactor ){
			 	if(o.angularFactor[0]>0) dof |= Jolt.EAllowedDOFs_RotationX
			 	if(o.angularFactor[1]>0) dof |= Jolt.EAllowedDOFs_RotationY
			 	if(o.angularFactor[2]>0) dof |= Jolt.EAllowedDOFs_RotationZ
			} else dof |= Jolt.EAllowedDOFs_RotationX | Jolt.EAllowedDOFs_RotationY | Jolt.EAllowedDOFs_RotationZ;

		    bcs.mAllowedDOFs = dof
			
		 }

		 

		// bcs.mAllowedDOFs = EAllowedDOFs_TranslationX | EAllowedDOFs_TranslationY | EAllowedDOFs_TranslationZ;
		
		//bcs.mInertiaMultiplier = 1.0;

		//bcs.mGravityFactor
		//console.log( Jolt.EOverrideMassProperties_CalculateInertia );
		//console.log( bcs.mMassPropertiesOverride );
		
		//if( o.inertia ) bcs.mMassPropertiesOverride.mInertia = this.v.fromArray( o.inertia );
	    //if( o.inertia ) bcs.mMassPropertiesOverride.mInertia.sTranslation(this.v.fromArray( o.inertia ))
	   

        //bcs.mMaxAngularVelocity: 47.1238899230957

        // Motion quality, or how well it detects collisions when it has a high velocity. 
        // Discrete : 0 or LinearCast : 1 // default : 0
        if( o.motionQuality !== undefined ) bcs.mMotionQuality = o.motionQuality;
        if( o.useCCD !== undefined ) bcs.mMotionQuality = 1;
        
        // Maximum linear velocity that this body can reach (m/s) default 500
		if( o.maxLinear !== undefined ) bcs.mMaxLinearVelocity = o.maxLinear;

		// Maximum Angular velocity that this body can reach (rad/s) default 0.25 * PI * 60
		if( o.maxAngular !== undefined ) bcs.mMaxAngularVelocity = o.maxAngular;


		if( o.noGravity !== undefined ){ 
			bcs.mGravityFactor = o.noGravity ? 0:1;
			//bcs.mInertiaMultiplier = o.noGravity ? 0:1;
		}

		if( o.gravityScale !== undefined ) bcs.mGravityFactor = o.gravityScale;
		//bcs.mInertiaMultiplier: 1

		// Which degrees of freedom this body has (can be used to limit simulation to 2D)
		//bmc.mAllowedDOFs 
		
		if( o.kinematic !== undefined ) bcs.mAllowDynamicOrKinematic = o.kinematic;
		if( o.sensor !== undefined ) bcs.mIsSensor = o.sensor;

		//console.log( bcs.mLinearDamping, bcs.mAngularDamping )

		if ( o.damping !== undefined ){ 
			bcs.mLinearDamping = o.damping[ 0 ];//def 0.05
			bcs.mAngularDamping = o.damping[ 1 ];//def 0.05
		}/* else {
			bcs.mLinearDamping = 0;
			bcs.mAngularDamping = 0.05;
		}*/


		

		//if( o.kinematic !== undefined ) console.log( bcs )

		// body 

		const b = root.bodyInterface.CreateBody( bcs );
		Jolt.destroy( bcs );// 'creationSettings' no longer needed, all settings and the shape reference went to 'body'

		//if(o.type === 'compound') b.SetUseManifoldReduction(false)

	    b.name = name
	    b.type = this.type;
	    b.isKinematic = o.kinematic || false;
	    b.breakable = o.breakable || false;

	    

	    //b.SetUseManifoldReduction(false)

	    //console.log( b );
	    //console.log( b.GetSoftBodyCreationSettings() )

	    //console.log(root.bodyInterface)
	    
	    //console.log(root.bodyInterface)



		// add to world
		this.addToWorld( b, o.id );

		//console.log( b.GetMotionProperties() )

		delete o.pos;
		delete o.quat;
		delete o.mass;
		delete o.kinematic;

		//if( !o.friction ) o.friction = 0.5;// default friction to 0.5

		// apply option
		this.set( o, b );

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return


		if( o.friction !== undefined ) b.SetFriction(o.friction); // def 0.2
	    if( o.restitution !== undefined ) b.SetRestitution(o.restitution);// def 0

	    // COLLISION GROUP

	    if(o.group !== undefined && o.mask !== undefined ){
	    	o.filter = [o.group, o.mask]
	    }

	    if( o.filter ){

	    	// Create group filter that filters out collisions between body N and N + 1 in the same chain
			//let filter = new Jolt.GroupFilterTable( 512 );

			
			//for (let z = 0; z < 9; ++z) filter.DisableCollision(z, z + 1);



	    	const cg = b.GetCollisionGroup();

	    	/*let gf = cg.GetGroupFilter();
	    	let gid = cg.GetGroupID() // def -1
	    	let sg = cg.GetSubGroupID() // def -1*/

	    	//console.log(cg)

	    	cg.SetGroupFilter( root.groupFilter ); //  GroupFilter define in main engine
	    	cg.SetGroupID( o.filter[0] );
	    	cg.SetSubGroupID( o.filter[1] );

	    }

	    //----------------
	    //  TYPE
	    //----------------

	    if( o.kinematic !== undefined && b.type === 'body' ){ 
	    	b.isKinematic = o.kinematic || false;
	    	b.mMotionType = o.kinematic == 0 ? Jolt.EMotionType_Kinematic : Jolt.EMotionType_Dynamic;
	    	//if(o.kinematic) b.SetMotionType( Jolt.Kinematic );
	    	//else b.SetMotionType( Jolt.Dynamic );
	    	
	    }

	    //Motion quality, or how well it detects collisions when it has a high velocity.
	    // Discrete : 0 or LinearCast : 1 for high speed contact
	    if( o.bullet !== undefined ) root.bodyInterface.SetMotionQuality( b.GetID(), o.bullet ? 1 : 0 );
	    if( o.motionQuality !== undefined ) root.bodyInterface.SetMotionQuality( b.GetID(), o.motionQuality );

	    //console.log( b.GetCollisionGroup().GetGroupFilter() )

	    //----------------
	    //  GRAVITY
	    //----------------

	    if( o.gravityScale ) root.bodyInterface.SetGravityFactor( b.GetID(), o.gravityScale );

	    //----------------
	    //  STATE
	    //----------------

		if( o.sleep ) root.bodyInterface.DeactivateBody(b.GetID());
		if( o.activate || o.wake ) root.bodyInterface.ActivateBody(b.GetID());
		if( o.neverSleep !== undefined ) b.SetAllowSleeping( !o.neverSleep );

		if( o.noGravity ) {
			//console.log(b)

			//SetMotionType( b)
		}


		// VELOCITY
		// !! world space velocity

		if( o.linearVelocity !== undefined ) b.SetLinearVelocity( this.v.fromArray( o.linearVelocity ) );
		if( o.linearVelocityClamped !== undefined ) b.SetLinearVelocityClamped( this.v.fromArray( o.linearVelocityClamped ) )

		if( o.angularVelocity !== undefined ) b.SetAngularVelocity( this.v.fromArray( o.angularVelocity ) );

	    // Set world space angular velocity of the center of mass, 
	    // will make sure the value is clamped against the maximum angular velocity.
		if( o.angularVelocityClamped !== undefined ) b.SetAngularVelocityClamped( this.v.fromArray( o.angularVelocityClamped ) )
        // miss b.GetLinearVelocityClamped

		if ( o.angularFactor !== undefined ){ 
			// TODO not working solution
			//this.v.fromArray( MathTool.mulArray([47.12,47.12,47.12], o.angularFactor) );
			//b.GetMotionProperties().SetAngularVelocityClamped(this.v)
		}

		//if( o.maxAngular !== undefined ) b.GetMotionProperties().SetMaxAngularVelocity(o.maxAngular)



		

		if( o.reset ){ 
			b.SetLinearVelocity( this.v.set( 0, 0, 0) );
			b.SetAngularVelocity( this.v.set( 0, 0, 0) );
			b.ResetForce();
			b.ResetTorque();
		}

		/*if( o.kinematic !== undefined ){
			b.setType(o.kinematic ? 2 : 0);
			b.isKinematic = o.kinematic
		}


		if( o.noGravity ) b.setGravityScale( 0 )
		*/

	    // --------------------
		// position / rotation
		// --------------------

		// kinematic only update by velocity
		// rigidbody only update by force

	    if( o.pos || o.quat ){

	    	//if( b.IsKinematic() ){
	    	if( b.isKinematic ){

	    		let p = o.pos ? this.v.fromArray( o.pos ) : b.GetPosition();
	    		let q = o.quat ? this.q.fromArray( o.quat ) : b.GetRotation();
	    	    root.bodyInterface.MoveKinematic( b.GetID(), p, q, root.deltaTime );
	    	    b.old = { p:p, q:q }
	    	    b.lockPos = true;

	    	} else {

	    		if( o.pos ) root.bodyInterface.SetPosition( b.GetID(), this.v.fromArray( o.pos ), null );
		        if( o.quat ) root.bodyInterface.SetRotation( b.GetID(), this.q.fromArray( o.quat ), null );

	    	}
	    }

	    

	    //if( o.impulse ) b.AddImpulse( this.v.fromArray( o.impulse ), this.v2.fromArray( [0,0,0] ) );
	    if( o.impulse ){
	    	if(!b.IsActive()) root.bodyInterface.ActivateBody(b.GetID())
	    	b.AddImpulse( this.v.fromArray( o.impulse ), o.impulseCenter ? this.v2.fromArray( o.impulseCenter ) : b.GetPosition() );
	    }

	    
	    if( o.angularImpulse ) b.AddAngularImpulse( this.v.fromArray( o.angularImpulse ) );
	    //if( o.force ) b.AddForce( this.v2.fromArray( [0,0,0] ), this.v.fromArray( o.force ) );
	    if( o.force ) b.AddForce( this.v.fromArray( o.force ), o.forceCenter ? this.v2.fromArray( o.forceCenter ) : b.GetPosition() );
	    
	    if( o.torque ) b.AddTorque( this.v.fromArray( o.torque ) );

	    if( o.useManifoldReduction !== undefined ) b.SetUseManifoldReduction( o.useManifoldReduction ); // boolean



	    //console.log( this.getShape(b) )
	    if( !b.GetMotionProperties ) return
	    if( o.massInfo ) this.getMassInfo( b );
	    if( o.mass ) this.setMass( b, o.mass );

	    if ( o.damping !== undefined ){ 
			b.GetMotionProperties().SetLinearDamping( o.damping[ 0 ] );//def 0.05
			b.GetMotionProperties().SetAngularDamping( o.damping[ 1 ] );//def 0.05
		}

		// !! experimental 
		if( o.inertiaScale !== undefined ){
			let pp = b.GetMotionProperties().GetInverseInertiaDiagonal().toArray()
			let qq = b.GetMotionProperties().GetInertiaRotation()
			pp = MathTool.mulArray(pp, 1/o.inertiaScale);
			b.GetMotionProperties().SetInverseInertia (this.v2.fromArray( pp ), qq)
		}
		

		//if( o.inertiaScale !== undefined ) b.G  etMotionProperties().MultiplyWorldSpaceInverseInertiaByVector(b.GetID(), this.v2.fromArray( [o.inertiaScale, o.inertiaScale, o.inertiaScale ] ))

	}

	setMass( b, mass ) {
		b.GetMotionProperties().SetInverseMass( 1.0 / mass );
	}

	getMassInfo(b) {

		if( typeof b === 'string' ) b = this.byName( b );
		if( b === null ) return;
		if( this.type !== 'body' ) return;

		const info = {

			invMass: b.GetMotionProperties().GetInverseMass(),
			massCenter: b.GetCenterOfMassPosition().toArray(),
			inertia : b.GetMotionProperties().GetInverseInertiaDiagonal().toArray(),
			inertiaRotation : b.GetMotionProperties().GetInertiaRotation().toArray(),

			invInertia: b.GetInverseInertia().toArray(),

			/*mass: b.getMass(),
			invMass: b.getInvMass(),
			massCenter: b.getCMassLocalPose().p.toArray(),
			inertia: b.getMassSpaceInertiaTensor().toArray(),
			invInertia: b.getMassSpaceInvInertiaTensor().toArray(),
			*/

			damping:[ b.GetMotionProperties().GetLinearDamping(), b.GetMotionProperties().GetAngularDamping() ]

		}

		console.log( info )

	}

	getShape(b) {

		return b.GetShape();

	}

}


/*
AddAngularImpulse (a)
AddForce (a,c)
AddImpulse (a,c)
AddTorque (a)
CanBeKinematicOrDynamic ()
GetAccumulatedForce ()
GetAccumulatedTorque ()
GetAllowSleeping ()
GetAngularVelocity ()
GetBodyType ()
GetCenterOfMassPosition ()
GetCenterOfMassTransform ()
GetCollisionGroup ()
GetFriction ()
GetID ()
GetInverseCenterOfMassTransform ()
GetInverseInertia ()
GetLinearVelocity ()
GetMotionProperties ()
GetMotionType ()
GetObjectLayer ()
GetPosition ()
GetRestitution ()
GetRotation ()
GetShape ()
GetTransformedShape ()
GetUseManifoldReduction ()
GetWorldSpaceBounds ()
GetWorldSpaceSurfaceNormal (a,c)
GetWorldTransform ()
IsActive ()
IsDynamic ()
IsInBroadPhase ()
IsKinematic ()
IsRigidBody ()
IsSensor ()
IsSoftBody ()
IsStatic ()
MoveKinematic (a,c,e)
ResetForce ()
ResetTorque ()
SensorDetectsStatic ()
SetAllowSleeping (a)
SetAngularVelocity (a)
SetAngularVelocityClamped (a)
SetFriction (a)
SetIsSensor (a)
SetLinearVelocity (a)
SetLinearVelocityClamped (a)
SetMotionType (a)
SetRestitution (a)
SetSensorDetectsStatic (a)
SetUseManifoldReduction (a)
*/