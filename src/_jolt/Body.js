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

		this.v = new Jolt.Vec3();
		this.q = new Jolt.Quat();

		this.v2 = new Jolt.Vec3();
		this.q2 = new Jolt.Quat();

	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ];
		this.full = full;
	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.itype];

		let i = this.list.length, b, n, p, q, v, r;

		while( i-- ){

			b = this.list[i];
			n = N + ( i * this.num );

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
			    if( AR[ n ] === 1 ) AR[ n ] = this.v.Length() * 9.8;// speed km/h
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
		let inConvexRadius = 0.05; //0.05;

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
			case 'cone' : g = new ConeGeometry( s[0], s[1] * 0.5 ); break;
			*/
			
			case 'convex' : 
			    hull = new Jolt.ConvexHullShapeSettings;

			    i = Math.floor( o.v.length/3);
			    j = 0
			    while( i-- ){
			    	n = j*3;
			    	hull.mPoints.push_back( this.v.fromArray( o.v, n ) )//.clone()
			    	j++
			    } 

			    shape = hull.Create().Get();

			break;
			case 'mesh' : 
			let triangles = new Jolt.TriangleList;
			let v = o.v;

			if(o.index){

			}else{

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
			}

			shape = new Jolt.MeshShapeSettings( triangles, new Jolt.PhysicsMaterialList ).Create().Get();
			
			break;

		}

		if( o.density && shape.SetDensity ){ 
			shape.SetDensity(o.density);
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
			case 'cone' : g = new ConeGeometry( s[0], s[1] * 0.5 ); break;
			*/
			
			case 'convex' : 
			    sett = new Jolt.ConvexHullShapeSettings;

			    i = Math.floor( o.v.length/3);
			    j = 0
			    while( i-- ){
			    	n = j*3;
			    	sett.mPoints.push_back( this.v.fromArray( o.v, n ) )//.clone()
			    	j++
			    } 

			    //shape = hull.Create().Get();

			break;
			case 'mesh' : 
			/*let vertices = this.getVertices(o.v)
			let numTri = Math.floor( o.index.length/3);
			let triangles = new Jolt.TriangleList;
			let shape = new Jolt.MeshShapeSettings(triangles, new Jolt.PhysicsMaterialList).Create().Get();*/
			break;

		}

		//if( o.density && shape.SetDensity ) shape.SetDensity(o.density);

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



		return sett;

	}

	add ( o = {} ) {

		let name = this.setName( o );

		
		let tt = this.type === 'body' ? Jolt.Dynamic : Jolt.Static;
		let move = this.type === 'body' ? Jolt.MOVING : Jolt.NON_MOVING;

		// BodyCreationSettings

		let bcs;

		switch( o.type ){

			case 'null': 

				bcs = new Jolt.BodyCreationSettings( this.shape( { type:'sphere', size:[0.01] } ), this.v.fromArray(o.pos || [0,0,0]), this.q.fromArray(o.quat || [0,0,0,1]), tt , move );
			

			break;
			
			case 'compound':

			    let scs = new Jolt.StaticCompoundShapeSettings();

				let gs = [], n;

				for ( var i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

			        //if( o.density !== undefined ) n.density = o.density;
					scs.AddShape( this.v2.fromArray(n.pos || [0,0,0]), this.q2.fromArray(n.quat || [0,0,0,1]), this.shapeSetting( n ) );

				}

				bcs = new Jolt.BodyCreationSettings( scs.Create().Get(), this.v.fromArray(o.pos || [0,0,0]), this.q.fromArray(o.quat || [0,0,0,1]), tt , move );
				
			break;

			default:

			    bcs = new Jolt.BodyCreationSettings( this.shape( o ), this.v.fromArray(o.pos || [0,0,0]), this.q.fromArray(o.quat || [0,0,0,1]), tt , move );
				
			break;

		}


		if( o.mass ) bcs.mMassPropertiesOverride.mMass = o.mass
		//if( o.inertia ) bcs.mMassPropertiesOverride.mInertia.hq(x,y,z,w); = o.mass
        //bcs.mMaxAngularVelocity: 47.1238899230957
		//bcs.mMaxLinearVelocity: 500
		//bcs.mGravityFactor: 1
		//bcs.mInertiaMultiplier: 1
		//bcs.mOverrideMassProperties: 0
		//if( o.kinematic !== undefined ) bcs.mAllowDynamicOrKinematic(o.kinematic);
		if( o.sensor !== undefined ) bcs.mIsSensor(o.sensor);

		// body 

		const b = root.bodyInterface.CreateBody(bcs);

	    b.name = name
	    b.type = this.type;
	    b.isKinematic = o.kinematic || false;
	    b.breakable = o.breakable || false;

	    //console.log( b );

		// add to world
		this.addToWorld( b, o.id );

		delete o.pos;
		delete o.quat;
		delete o.kinematic;
		if( !o.friction ) o.friction = 0.5;

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
	    	let cg = b.GetCollisionGroup()
	    	let ff = cg.GetGroupFilter();

	    	ff.gq = o.filter[1]
	    	//cg.SetGroupFilter(o.filter[1]) //  GroupFilter ??
	    	cg.SetGroupID(o.filter[0]) // -1
	    	//cg.SetSubGroupID(o.filter[1])// undefined ?

	    	//b.SetCollisionGroup( cg );

	    	//console.log( cg, ff )
	    }

	    //console.log( b.GetCollisionGroup().GetGroupFilter() )


	    // STATE

		if( o.sleep ) root.bodyInterface.DeactivateBody(b.GetID());
		if( o.activate || o.wake ) root.bodyInterface.ActivateBody(b.GetID());
		if( o.neverSleep !== undefined ) b.SetAllowSleeping( !o.neverSleep );


		// VELOCITY
		// !! world space velocity

		if( o.linearVelocity !== undefined ) b.SetLinearVelocity( this.v.fromArray( o.linearVelocity ) );
		if( o.linearVelocityClamped !== undefined ) b.SetLinearVelocityClamped( this.v.fromArray( o.linearVelocityClamped ) )

		if( o.angularVelocity !== undefined ) b.SetAngularVelocity( this.v.fromArray( o.angularVelocity ) );
		if( o.angularVelocityClamped !== undefined ) b.SetAngularVelocityClamped( this.v.fromArray( o.angularVelocityClamped ) )


		/*if( o.kinematic !== undefined ){
			b.setType(o.kinematic ? 2 : 0);
			b.isKinematic = o.kinematic
		}


		if( o.noGravity ) b.setGravityScale( 0 )
		*/

		// position / rotation

	    if( o.pos || o.quat ){

	    	// void MoveKinematic([Const, Ref] Vec3 inPosition, [Const, Ref] Quat inRotation, float inDeltaTime);
	    	//https://github.com/jrouwe/JoltPhysics.js/blob/0f3538a7a9615cbdbafa452f12997e3ea6a9fd55/JoltJS.idl#L728

	    	if( o.pos ){ 
	    		
	    		/*if(b.isKinematic){

	    			let pp = MathTool.subArray(o.pos, b.pos)
	    			pp = MathTool.mulArray(pp, root.invDelta)
	    			b.setLinearVelocity( this.v.fromArray( pp ) )
	    			b.pos = o.pos
	    		}*/

	    		root.bodyInterface.SetPosition( b.GetID(), this.v.fromArray( o.pos ), null );

	    		//b.setPosition( this.v.fromArray( o.pos ) )

	    	}
		    if( o.quat ){
		    	/*if(b.isKinematic){

		    		let qqq = MathTool.quatMultiply( o.quat, MathTool.quatInvert( b.quat ) )
		    		let mtx = MathTool.composeMatrixArray( [0,0,0], qqq, [1,1,1])
		    		let eee = MathTool.eulerFromMatrix( mtx )
		    		eee = MathTool.mulArray(eee, root.invDelta )

	    			b.setAngularVelocity( this.v.fromArray( eee ) )
	    			b.quat = o.quat
	    		}*/

	    		root.bodyInterface.SetRotation( b.GetID(), this.q.fromArray( o.quat ), null );

		    }
	    }

	    if( o.impulse ) b.AddImpulse( this.v.fromArray( o.impulse ), this.v2.fromArray( [0,0,0] ) );
	    if( o.force ) b.AddForce( this.v.fromArray( o.force ), this.v2.fromArray( [0,0,0] ) );
	    if( o.torque ) b.AddTorque( this.v.fromArray( o.torque ) );



	    //console.log( this.getShape(b) )


		

		
		
			
/*
		// Applies the force `force` to `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
		if( o.worldForce ) b.applyForce( this.v.fromArray( o.worldForce ), this.v.fromArray( o.worldForce, 3 ) )
		if( o.force ) b.applyForceToCenter( this.v.fromArray( o.force ) )
		if( o.torque ) b.applyTorque( this.v.fromArray( o.torque ) )



	    // Applies the impulse `impulse` to the rigid body at `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]

	    if(o.impulse){
	    	if( o.impulseCenter ) b.applyImpulse( this.v.fromArray( o.impulse ), this.v2.fromArray( o.impulseCenter ) );
	    	else b.applyLinearImpulse( this.v.fromArray( o.impulse ) );
	    }
	    if( o.impulse ) b.applyImpulse( this.v.fromArray( o.impulse ), this.v.fromArray( o.impulse, 3 ) )
	    if( o.linearImpulse ) {
	    	//this.multiplyScalar( o.linearImpulse, root.delta, 3 )
	    	b.applyLinearImpulse( this.v.fromArray( o.linearImpulse ) )
	    }


	   /* if( o.angularImpulse ) b.applyAngularImpulse( this.v.fromArray( o.angularImpulse ) )

	    if( o.gravityScale ) b.setGravityScale( o.gravityScale );

	    if( o.gravity !== undefined ) b.setGravityScale( o.gravity ? 1 : 0 );

	    if( b.type === 'body' ){
		    //b.getOrientationTo( this.q )
		    //if( o.linearVelocity ) b.setLinearVelocity( this.v.fromArray( o.linearVelocity ).applyQuaternion( this.q ) )
		    //if( o.angularVelocity ) b.setAngularVelocity( this.v.fromArray( o.angularVelocity ).applyQuaternion( this.q ) )

		    if( o.linearVelocity ) b.setLinearVelocity( this.v.fromArray( o.linearVelocity ) )
		    if( o.angularVelocity ) b.setAngularVelocity( this.v.fromArray( o.angularVelocity ) )

		    if( o.addLinearVelocity ) b.addLinearVelocity( this.v.fromArray( o.linearVelocity ) )
		    if( o.addAngularVelocity ) b.addAngularVelocity( this.v.fromArray( o.angularVelocity ) )
		}

	    if( o.angularFactor ) b.setRotationFactor( this.v.fromArray( o.angularFactor ) )

	    // Sets the linear and angular damping. [ 0,0 ]
	    if( o.damping ){
		     b.setLinearDamping( o.damping[0] )
		     b.setAngularDamping( o.damping[1] )
		 }

		if( o.reset ){ 
			b.setLinearVelocity( this.v.set( 0, 0, 0) )
			b.setAngularVelocity( this.v.set( 0, 0, 0) )
		}*/

	}

	getShape(b) {

		return b.GetShape();

	}

}