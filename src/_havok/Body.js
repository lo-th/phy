import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, map } from './root.js';


export class Body extends Item {

	constructor () {

		super();
		
		this.Utils = Utils

		this.type = 'body'
		this.num = Num[this.type]
		this.full = false

	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ]
		this.full = full
	}

	step ( AR, N ) {

		let i = this.list.length, b, n, ar;

		while( i-- ){

			b = this.list[i];
			n = N + ( i * this.num )

			if( !b ){
				this.vecZero( AR, n, this.num )
				continue
			}

			AR[ n ] = 1//b.isSleeping() ? 0 : 1

			ar = havok.HP_Body_GetQTransform(b)[1]

			AR[ n+1 ] = ar[0][0]
			AR[ n+2 ] = ar[0][1]
			AR[ n+3 ] = ar[0][2]

			AR[ n+4 ] = ar[1][0]
			AR[ n+5 ] = ar[1][1]
			AR[ n+6 ] = ar[1][2]
			AR[ n+7 ] = ar[1][3]

			/*b.getPositionTo( this.p )
			b.getOrientationTo( this.q )
			this.p.toArray( AR, n+1 )
			this.q.toArray( AR, n+4 )

			if( this.full ){
				b.getLinearVelocityTo( this.v )
			    b.getAngularVelocityTo( this.r )
				this.v.toArray( AR, n+8 ) // velocity
			    this.r.toArray( AR, n+11 ) // angular
			    if( AR[ n ] === 1 ) AR[ n ] = this.v.length() * 9.8;// speed km/h
			}*/
		}

	}

	///

	shape ( o = {} ) {

		//let sc = this.sc;// new ShapeConfig();
		// The density of the shape, usually in Kg/m^3. def = 1
        /*if( o.density !== undefined ) sc.density = o.density;
        if( o.mass !== undefined ) sc.density = o.mass; // extra mass for static body test ??
        // The coefficient of friction of the shape. def = 0.2
        if( o.friction !== undefined ) sc.friction = o.friction;
        // The coefficient of restitution of the shape. def = 0.2
        if( o.restitution !== undefined ) sc.restitution = o.restitution;
        // The bits of the collision groups to which the shape belongs. def = 1
        sc.collisionMask = -1
        if( o.mask !== undefined ) sc.collisionMask = o.mask
        // The bits of the collision groups with which the shape collides. def = 1
        sc.collisionGroup = this.type === 'body' ? 1 : 2
        if( o.group !== undefined ) sc.collisionGroup = o.group
        // e contact callback of the shape
        //if( o.callback !== undefined ) sc.contactCallback = o.callback;
        /*if( o.contactCallback !== undefined ){ 
        	sc.contactCallback = new ContactCallback()
        	console.log( sc.contactCallback )

        	sc.contactCallback.preSolve = function (c){
        		console.log('contact ', c)
        	}
        }*/



		let g;
		let t = o.type || 'box'
		let s = o.size || [1,1,1];

		let h, i, n, j, numVertices, vertices;

		let center = o.localPos || [0,0,0]
		let p1 = [center[0], center[1]-s[1]*0.5, center[2]]
		let p2 = [center[0], center[1]+s[1]*0.5, center[2]]
		//let p1 = [center[0], center[1], center[2]]
		//let p2 = [center[0], center[1]+s[1], center[2]]
		let qq = o.localQuat || [0,0,0,1]

		switch( t ){

			case 'plane':
			
			if( s[0]===1 ) s = [300,0,300]

			s[1] = 0
		    g = havok.HP_Shape_CreateBox( center, qq, s )[1];

			/*h = [
			    s[0]*0.5, 0, s[2]*0.5 ,
			    s[0]*0.5, 0, -s[2]*0.5 ,
			    -s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, s[2]*0.5,
			]

			vertices = this.getVertices(h)
			
			g = havok.HP_Shape_CreateConvexHull( vertices, h.length/3 )[1]*/
			//g._gjkMargin = o.margin || 0.0001;// default 0.05
			//g._useGjkRayCast = o.ray || false;

			break;

			case 'box' : g = havok.HP_Shape_CreateBox( center, qq, s )[1]; break;
			case 'sphere' : g = havok.HP_Shape_CreateSphere( center, s[0] )[1]; break;
			case 'cone' : g = havok.HP_Shape_CreateCylinder( p1, p2, s[0])[1]; break;
			case 'cylinder' : g = havok.HP_Shape_CreateCylinder( p1, p2, s[0])[1]; break;
			case 'capsule' : g = havok.HP_Shape_CreateCapsule( p1, p2, s[0])[1]; break;
			case 'convex' :
			    numVertices = Math.floor( o.v.length/3 );
			    vertices = this.getVertices(o.v)
			    g = havok.HP_Shape_CreateConvexHull(vertices.byteOffset, numVertices)[1];
			break;
			case 'mesh':
			   numVertices = Math.floor( o.v.length/3);
			   vertices = this.getVertices(o.v)
			   let numTri = Math.floor( o.index.length/3);
			   let triangles = this.getTriangles(o.index)
			   g = havok.HP_Shape_CreateMesh( vertices.byteOffset, numVertices, triangles.byteOffset, numTri )[1];
			break;

			
			

		}

		//console.log(havok.HP_Shape_CreateBox)

		if( o.density ) havok.HP_Shape_SetDensity( g, o.density )

		

		//

		this.setMaterial( g, o )

		//havok.HP_Shape_SetFilterInfo(g, arg1)
		//havok.HP_Shape_SetMaterial(g, arg1)

		//havok.HP_Shape_AddChild(arg0, arg1, arg2)
		//havok.HP_Shape_BuildMassProperties(arg0)
		//havok.HP_Shape_CreateDebugDisplayGeometry(arg0)

		//let m = havok.HP_Shape_GetMaterial(g)[1] // [0.5, 0.5, 0, ctor, ctor}

		/*
		HP_Shape_GetDensity(arg0)
		HP_Shape_GetFilterInfo(arg0)
		HP_Shape_GetMaterial(arg0)
		HP_Shape_GetNumChildren(arg0)
		HP_Shape_GetType(arg0)
		HP_Shape_PathIterator_GetNext(arg0)
		HP_Shape_Release(arg0)
		HP_Shape_RemoveChild(arg0, arg1)
		HP_Shape_SetDensity(arg0, arg1)
		HP_Shape_SetFilterInfo(arg0, arg1)
		HP_Shape_SetMaterial(arg0, arg1)
		*/

		//console.log(m)


		return g

	}

	setMaterial ( shape, o ) {

		if(!o.friction && !o.restitution) return
		if(o.friction === 0.5 && !o.restitution === 0 ) return
        const dynamicFriction = o.friction ?? 0.5;
        const staticFriction = o.staticFriction ?? dynamicFriction;
        const restitution = o.restitution ?? 0.0;
        const frictionCombine = o.frictionCombine ?? 'MINIMUM';
        const restitutionCombine = o.restitutionCombine ?? 'MAXIMUM';

        const hpMaterial = [staticFriction, dynamicFriction, restitution, this.materialCombine(frictionCombine), this.materialCombine(restitutionCombine)];
        havok.HP_Shape_SetMaterial(shape, hpMaterial);

    }

    materialCombine ( mode ) {
        switch ( mode ) {
            case 'GEOMETRIC_MEAN':
                return havok.MaterialCombine.GEOMETRIC_MEAN;
            case 'MINIMUM':
                return havok.MaterialCombine.MINIMUM;
            case 'MAXIMUM':
                return havok.MaterialCombine.MAXIMUM;
            case 'ARITHMETIC_MEAN':
                return havok.MaterialCombine.ARITHMETIC_MEAN;
            case 'MULTIPLY':
                return havok.MaterialCombine.MULTIPLY;
        }
    }

	getVertices ( ar ) {
        const nFloats = ar.length// * 3;
        const bytesPerFloat = 4;
        const nBytes = nFloats * bytesPerFloat;
        const bufferBegin = havok._malloc(nBytes);

        const ret = new Float32Array(havok.HEAPU8.buffer, bufferBegin, nFloats);
        for (let i = 0; i < ar.length; i++) {
        	ret[i] = ar[i];
            /*ret[i * 3 + 0] = this._vertices[i].x;
            ret[i * 3 + 1] = this._vertices[i].y;
            ret[i * 3 + 2] = this._vertices[i].z;*/
        }

        return ret;
    }

	getTriangles ( ar ) {
        const bytesPerInt = 4;
        const nBytes = ar.length * bytesPerInt;
        const bufferBegin = havok._malloc(nBytes);
        const ret = new Int32Array(havok.HEAPU8.buffer, bufferBegin, ar.length);
        for (let i = 0; i < ar.length; i++) {
            ret[i] = ar[i];
        }

        return ret;
    }

	add ( o = {} ) {

		let name = this.setName( o );

		const motionType = this.type === 'body' ? ( o.kinematic ? "KINEMATIC" : "DYNAMIC" ) : "STATIC";

		let b = havok.HP_Body_Create()[1], g;

		//let b = new RigidBody( bodyConfig ); 

		//if(o.type === 'mesh') this.autoMesh( o );

		switch( o.type ){

			case 'null':

				havok.HP_Body_SetShape( b, havok.HP_Shape_CreateContainer()[1] )

			break;
			
			case 'compound':

			    g = havok.HP_Shape_CreateContainer()[1]

				let gs = [], n;

				for ( var i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

			        if( o.density !== undefined ) n.density = o.density
			        if( o.friction !== undefined ) n.friction = o.friction
			        if( o.restitution !== undefined ) n.restitution = o.restitution
			        if( o.mask !== undefined ) n.collisionMask = o.mask
			        if( o.group !== undefined ) n.collisionGroup = o.group

					if( n.pos ) n.localPos = n.pos
					if( n.quat ) n.localQuat = n.quat

				    let trans = [
				      [0,0,0],
				      [0,0,0,1],
				      [1,1,1]
				    ]

					//b.addShape( this.shape( n ) )
				    havok.HP_Shape_AddChild(g, this.shape( n ), trans)

				}

				
				this.applyMass( b, g )
				havok.HP_Body_SetShape( b, g )

			break;
			default:

				g = this.shape( o )
				havok.HP_Body_SetShape( b, g )
				this.applyMass( b, g )

			break;

		}

		
        

		b.name = name
		b.type = this.type
		b.breakable = o.breakable || false

		b.first = true

		// apply option
		this.set( o, b )

		//havok.HP_World_AddBody(root.world, b, false);
        havok.HP_Body_SetMotionType(b, havok.MotionType[motionType]);

        //havok.HP_World_AddBody(root.world, b, o.sleep || false );

        // add to world
        havok.HP_World_AddBody( root.world, b, false );



		// add to reference
		this.addToWorld( b, o.id )

		//console.log( havok.HP_Body_GetWorldTransformOffset(b) )


		//console.log( havok.HP_World_GetBodyBuffer(b) )

		//if(o.isTrigger)console.log(b)

	}

	applyMass ( b, g ) {

		if( this.type === 'solid' ) return

	    // [ center, mass, inertia, inertiaOrientation ]);
		let massProperties = [[0, 0, 0], 1, [1, 1, 1], [0, 0, 0, 1]]

		if( g ){
			const shapeMass = havok.HP_Shape_BuildMassProperties(g);
			if ( shapeMass[0] == havok.Result.RESULT_OK ){ 
				massProperties = shapeMass[1]
			}
		}

	    havok.HP_Body_SetMassProperties( b, massProperties );

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		//if( o.noGravity ) b.setGravityScale( 0 )

	    //havok.HP_Body_SetEventMask(b, arg1)
	    //havok.HP_Body_SetMassProperties(b, arg1)

		// position / rotation

		//if( o.pos ) havok.HP_Body_SetQTransform( b, [ o.pos || [0, 0, 0], o.quat || [0, 0, 0, 1] ] )
		if( o.pos ) havok.HP_Body_SetPosition(b, o.pos)
		if( o.quat ) havok.HP_Body_SetOrientation(b, o.quat)


		if( o.linearVelocity ) havok.HP_Body_SetLinearVelocity(b, o.linearVelocity)
		if( o.angularVelocity ) havok.HP_Body_SetAngularVelocity(b, o.angularVelocity)
		
		if( o.damping ){
			havok.HP_Body_SetAngularDamping(b, o.damping[0])
			havok.HP_Body_SetLinearDamping(b, o.damping[1])
		}

		if( o.gavityFactor ) havok.HP_Body_SetGravityFactor(b, o.gavityFactor)

		// impulse - The impulse vector to apply.
	    // location - The location in world space to apply the impulse.
		/*if( o.impulse ) havok.HP_Body_ApplyImpulse(b, location, o.impulse );
		if( o.force ){ 
			havok.HP_Body_ApplyImpulse(b, location, o.force );
		}*/
		



		/*



		if( o.sleep ) b.sleep()
		if( o.activate || o.wake ) b.wakeUp()
		if( o.neverSleep !== undefined ){ 
			b.setAutoSleep( !o.neverSleep )
			if( o.neverSleep )  b.wakeUp()
		}
			

		// Applies the force `force` to `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
		if( o.worldForce ) b.applyForce( this.v.fromArray( o.worldForce ), this.v.fromArray( o.worldForce, 3 ) )
		if( o.force ) b.applyForceToCenter( this.v.fromArray( o.force ) )
		if( o.torque ) b.applyTorque( this.v.fromArray( o.torque ) )

	    // Applies the impulse `impulse` to the rigid body at `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
	    if( o.impulse ) b.applyImpulse( this.v.fromArray( o.impulse ), this.v.fromArray( o.impulse, 3 ) )
	    if( o.linearImpulse ) b.applyLinearImpulse( this.v.fromArray( o.linearImpulse ) )
	    if( o.angularImpulse ) b.applyAngularImpulse( this.v.fromArray( o.angularImpulse ) )

	    if( o.gravityScale ) b.setGravityScale( o.gravityScale );

	    if( b.type === 'body' ){
		    b.getOrientationTo( this.q )
		    if( o.linearVelocity ) b.setLinearVelocity( this.v.fromArray( o.linearVelocity ).applyQuaternion( this.q ) )
		    if( o.angularVelocity ) b.setAngularVelocity( this.v.fromArray( o.angularVelocity ).applyQuaternion( this.q ) )
		}



	    if( o.angularFactor ) b.setRotationFactor( this.v.fromArray( o.angularFactor ) )

	    // Sets the linear and angular damping. [ 0,0 ]
	    if( o.damping ){
		     b.setLinearDamping( o.damping[0] )
		     b.setAngularDamping( o.damping[1] )
		 }*/

		if( o.reset ){ 
			havok.HP_Body_SetLinearVelocity(b, [0,0,0])
			havok.HP_Body_SetAngularVelocity(b, [0,0,0])
		}

	}

	setShapes ( o = {}, b = null  ){

		/*let shapes = b.getShapeList()
		let i = b.getNumShapes(), s
		while(i--){

			s = shapes[i]

			if( o.density !== undefined ) s.setDensity( o.density )
		    if( o.friction !== undefined ) s.setFriction( o.friction )
		    if( o.restitution !== undefined ) s.setRestitution( o.restitution )
		    if( o.mask !== undefined ) s.setCollisionMask( o.mask )
		    if( o.group !== undefined ) s.setCollisionGroup( o.group )
		    //if( o.callback !== undefined ) s.setContactCallback( o.callback );

		}*/


	}

}