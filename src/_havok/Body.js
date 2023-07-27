import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';

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

		let i = this.list.length, b, n, t, lv, av, sleep;

		while( i-- ){

			b = this.list[i];
			n = N + ( i * this.num )

			if( !b ){
				this.vecZero( AR, n, this.num )
				continue
			}

			if( b.lockPos ){
				if( b.isKinematic ) havok.HP_Body_SetTargetQTransform( b, [ b.lockPos, b.lockQuat ] );
				else havok.HP_Body_SetQTransform( b, [ b.lockPos, b.lockQuat ] )
			}

			lv = havok.HP_Body_GetLinearVelocity(b)[1];

			sleep = havok.HP_Body_GetActivationState( b ) === 1 ? true : false; 
			AR[ n ] = sleep ? 0 : this.arLength(lv) * 9.8;// speed km/h
		    //AR[ n ] = b.up ? 1 : this.arLength(lv) * 9.8;// speed km/h

			t = havok.HP_Body_GetQTransform(b)[1]

			b.pos = t[0]
			b.quat = t[1]

			this.fillArray( t[0], AR, n+1, 3 ) 
			this.fillArray( t[1], AR, n+4, 4 ) 

			if( this.full ){
			    av = havok.HP_Body_GetAngularVelocity(b)[1];
			    this.fillArray( lv, AR, n+8, 3 )
			    this.fillArray( av, AR, n+11, 3 )
			}
		}

	}

	///

	shape ( o = {} ) {

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
		    //g = havok.HP_Shape_CreateBox( center, qq, s )[1];

			h = [
			    s[0]*0.5, 0, s[2]*0.5 ,
			    s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, s[2]*0.5,
			]

			vertices = this.getVertices(h)
			
			g = havok.HP_Shape_CreateConvexHull( vertices.byteOffset, 4 )[1]
			/**/
			//g._gjkMargin = o.margin || 0.0001;// default 0.05
			//g._useGjkRayCast = o.ray || false;

			break;

			case 'box' : g = havok.HP_Shape_CreateBox( center, qq, s )[1]; break;
			case 'sphere' : g = havok.HP_Shape_CreateSphere( center, s[0] )[1]; break;
			//case 'cone' : g = havok.HP_Shape_CreateCylinder( p1, p2, s[0])[1]; break;
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

		//

		if( o.density ) havok.HP_Shape_SetDensity( g, o.density );
			//if( o.density ) havok.HP_Shape_SetDensity( g, o.density )

		//

		if( o.isTrigger ) havok.HP_Shape_SetTrigger( g, true );

		this.setMaterial( g, o )
		this.setFilter( g, o )

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
		*/

		//console.log(m)

		g.volume = MathTool.getVolume( t, s, o.v );


		return g

	}

	setFilter ( shape, o ) {

		if(!o.mask) o.mask = -1
		if(!o.group) o.group = this.type === 'body' ? 1 : 2

		/*const selfMask = o.group !== undefined ? o.group : havok.HP_Shape_GetFilterInfo(shape)[1][0];
		const collideMask = o.mask !== undefined ? o.mask : havok.HP_Shape_GetFilterInfo(shape)[1][1];
		havok.HP_Shape_SetFilterInfo(shape, [ selfMask, collideMask ]);*/

		havok.HP_Shape_SetFilterInfo(shape, [ o.group, o.mask ]);

    }

	setMaterial ( shape, o ) {

		//if(o.friction === 0.5 && !o.restitution === 0 ) return
        const friction = o.friction !== undefined ? o.friction : 0.5;
        const staticFriction = o.staticFriction  !== undefined ?  o.staticFriction : friction;
        const restitution = o.restitution !== undefined ? o.restitution : 0.0;
        const frictionCombine = o.frictionCombine ?? 'MINIMUM';
        const restitutionCombine = o.restitutionCombine ?? 'MINIMUM'//'MAXIMUM';

        const hpMaterial = [staticFriction, friction, restitution, this.materialCombine(frictionCombine), this.materialCombine(restitutionCombine)];
        havok.HP_Shape_SetMaterial( shape, hpMaterial );

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
        const nFloats = ar.length * 3;
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

				//havok.HP_Body_SetShape( b, havok.HP_Shape_CreateContainer()[1] )
				g = this.shape( { type:'sphere', size:[0.01] } );
				havok.HP_Body_SetShape( b, g );
				this.applyMass( b, g, o );

			break;
			
			case 'compound':

			    g = havok.HP_Shape_CreateContainer()[1]

				let gs = [], n, tt;

				for ( let i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

			        if( o.density !== undefined ) n.density = o.density
			        if( o.friction !== undefined ) n.friction = o.friction
			        if( o.restitution !== undefined ) n.restitution = o.restitution
			        if( o.mask !== undefined ) n.collisionMask = o.mask
			        if( o.group !== undefined ) n.collisionGroup = o.group

					if(n.localQuat) delete n.localQuat
					if(n.localPos) delete n.localPos

					let trans = [ n.pos || [0,0,0], n.quat || [0,0,0,1], [1,1,1] ]

					//b.addShape( this.shape( n ) )
				    havok.HP_Shape_AddChild( g, this.shape( n ), trans )

				}

				havok.HP_Body_SetShape( b, g )
				this.applyMass( b, g, o )
				
			break;
			default:

				g = this.shape( o )
				havok.HP_Body_SetShape( b, g )
				this.applyMass( b, g, o )

			break;

		}


		b.name = name
		b.type = this.type
		b.breakable = o.breakable || false
		b.isKinematic = o.kinematic || false
		b.sleep = o.sleep || false
		//b.up = false

		b.button = o.button || false

		// save start state
		b.pos = o.pos || [0,0,0];
		b.quat = o.quat || [0,0,0,1]

		b.oldp = o.pos || [0,0,0];

		if(o.pos) delete o.pos
		if(o.quat) delete o.quat
		//b.forceSleep = false

		//if( o.pos ){ havok.HP_Body_SetPosition(b, o.pos);  ; }
		//if( o.quat ) { havok.HP_Body_SetOrientation(b, o.quat); b.quat = o.quat; delete o.quat }

		//if( b.isKinematic ) havok.HP_Body_SetTargetQTransform( b, [ b.pos, b.quat ] )
		//else 
		havok.HP_Body_SetQTransform( b, [ b.pos, b.quat ] )


		havok.HP_Body_SetMotionType(b, havok.MotionType[motionType])
		if(o.kinematic) delete o.kinematic


		//b.first = true

		



        //console.log(havok.HP_Body_GetMotionType(b)[1])

        //havok.HP_World_AddBody(root.world, b, o.sleep || false );



        // add to world
        havok.HP_World_AddBody( root.world, b, o.startSleep || false );



		// add to reference
		this.addToWorld( b, o.id )

		// apply option
		this.set( o, b )

		//this.addCollisionCallback(b.name, true)

		//console.log( havok.HP_Body_GetWorldTransformOffset(b) )

		//console.log( havok.HP_World_GetBodyBuffer(b) )

		//if(o.isTrigger)console.log(b)

	}

	applyMass ( b, g, o ) {

		if( this.type === 'solid' ) return
		//if( o.kinematic ) return

	    // [ center, mass, inertia, inertiaOrientation ]);
		let massProperties = [[0, 0, 0], 1, [1, 1, 1], [0, 0, 0, 1]]

		if( g ){
			const shapeMass = havok.HP_Shape_BuildMassProperties(g);
			if ( shapeMass[0] == havok.Result.RESULT_OK ){ 
				massProperties = shapeMass[1]
			}
		}

		
		if( o.mass ) massProperties[1] = o.mass
		if( o.inertia ) massProperties[2] = o.inertia

		//	console.log(massProperties)

	    havok.HP_Body_SetMassProperties( b, massProperties );

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		if(o.kinematic !== undefined){
			havok.HP_Body_SetMotionType(b, havok.MotionType[o.kinematic ? "KINEMATIC" : "DYNAMIC"]);
		}



		//havok.ActivationControl.ALWAYS_ACTIVE.value // 1
		//havok.ActivationControl.ALWAYS_INACTIVE.value // 2
		//havok.ActivationControl.SIMULATION_CONTROLLED.value // 0

		//havok.ActivationState.ACTIVE.value // 0
		//havok.ActivationState.INACTIVE.value // 1


		if( o.sleep ){
			//havok.HP_Body_SetActivationControl( b, havok.ActivationControl.ALWAYS_INACTIVE );
		    havok.HP_Body_SetActivationState (b, havok.ActivationState.INACTIVE );
		    //havok.HP_Body_SetActivationPriority(b, 1 ); ???
		}
		if( o.activate || o.wake ){
			havok.HP_Body_SetActivationControl( b, havok.ActivationControl.SIMULATION_CONTROLLED );
			havok.HP_Body_SetActivationState (b, havok.ActivationState.ACTIVE );
		}
		if( o.neverSleep !== undefined ) havok.HP_Body_SetActivationControl(b, o.neverSleep ? havok.ActivationControl.ALWAYS_ACTIVE : havok.ActivationControl.SIMULATION_CONTROLLED );
		if( o.alwaySleep !== undefined ) havok.HP_Body_SetActivationControl(b, o.alwaySleep ? havok.ActivationControl.ALWAYS_INACTIVE : havok.ActivationControl.SIMULATION_CONTROLLED );


		//if( o.sleep ) b.forceSleep = true;
		//if( o.activate || o.wake ) b.up = true
		//if( o.neverSleep !== undefined ) b.up = o.neverSleep 

		//if( o.gravityScale !== undefined ) b.setGravityScale( o.gravityScale )

	    if( o.gravityFactor !== undefined ) havok.HP_Body_SetGravityFactor(b, o.gravityFactor)

	    if( o.gravity !== undefined ) havok.HP_Body_SetGravityFactor(b, o.gravity ? 1 : 0 )

	    //havok.HP_Body_SetEventMask(b, arg1)
	    //havok.HP_Body_SetMassProperties(b, arg1)




	    /*havok.HP_Body_SetActivationControl(b, )
		havok.HP_Body_SetActivationPriority(b, )
		havok.HP_Body_SetActivationState (b, havok.ActivationState.ACTIVE.value )*/


		// position / rotation

		//if( o.pos || o.quat) havok.HP_Body_SetQTransform( b, [ o.pos || [0, 0, 0], o.quat || [0, 0, 0, 1] ] )
		//if( o.pos ) havok.HP_Body_SetPosition(b, o.pos)
		//if( o.quat ) havok.HP_Body_SetOrientation(b, o.quat)

		if( o.pos || o.quat ){

			if( !o.pos ) o.pos = b.pos
			if( !o.quat ) o.quat = b.quat

			let move = true

			if( b.isKinematic ){

				if( MathTool.equalArray( b.oldp, o.pos )  ) move = false
				else  b.oldp = o.pos 

			}
			/*9if( b.oldp !== o.pos ){ 
				move = true

			}*/

			//if( !o.pos ) o.pos = b.pos
			//if( !o.quat ) o.quat = b.quat

			let u = [ o.pos, o.quat ]

			//if( b.isKinematic && root.tmpStep===(2*root.substep) ) havok.HP_Body_SetTargetQTransform( b, u ); // !! only on one step
			if( b.isKinematic && move ) havok.HP_Body_SetTargetQTransform( b, u ); // !! only on one step
			else havok.HP_Body_SetQTransform( b, u )

		}


		if( o.linearVelocity ) havok.HP_Body_SetLinearVelocity(b, o.linearVelocity)
		if( o.angularVelocity ) havok.HP_Body_SetAngularVelocity(b, o.angularVelocity)
		
		if( o.damping ){
			// This function is useful for controlling the angular velocity of a physics body.
			// By setting the angular damping, the body's angular velocity will be reduced over time, allowing for more realistic physics simulations.
			havok.HP_Body_SetAngularDamping(b, o.damping[0]) // def 0.1
			// Linear damping is a force that opposes the motion of the body, and is proportional to the velocity of the body.
			havok.HP_Body_SetLinearDamping(b, o.damping[1]) // def 0
		}

		


		// impulse - The impulse vector to apply.
	    // location - The location in world space to apply the impulse.
		/*if( o.impulse ) havok.HP_Body_ApplyImpulse(b, location, o.impulse );*/
		if( o.force ){
		    if(!o.location) o.location = [0,0,0];
		    if(!o.local) o.location = havok.HP_Body_GetPosition(b)[1];
		    //this.multiplyScalar( o.force, root.delta, 3 )
			havok.HP_Body_ApplyImpulse( b, o.location, o.force );
		}

		if( o.impulse ){
	    	if( o.impulseCenter ) havok.HP_Body_ApplyImpulse( b, o.impulseCenter, o.impulse )
	    	else havok.HP_Body_ApplyImpulse( b, b.pos, o.impulse )
	    }

		/*if( o.linearImpulse ){
			//this.multiplyScalar( o.linearImpulse, root.delta, 3 )
			havok.HP_Body_ApplyImpulse( b, b.pos, o.linearImpulse );
		}*/

		if( o.lockPos ){

			b.lockPos = o.pos;
			b.lockQuat = o.quat;



		}

		if( o.reset ){ 
			havok.HP_Body_SetLinearVelocity(b, [0,0,0])
			havok.HP_Body_SetAngularVelocity(b, [0,0,0])
		}

	}

	addCollisionCallback( b, enabled ){

		//https://www.youtube.com/watch?v=Uv7DWq6KFbk at 23:30

		//const b = this.byName( name )
		//if( b === null ) return
// 5440976n
		//console.log(havok.EventType.COLLISION_STARTED)

		const collideEvents = havok.EventType.COLLISION_STARTED.value | havok.EventType.COLLISION_CONTINUED.value | havok.EventType.COLLISION_FINISHED.value;
		havok.HP_Body_SetEventMask( b, enabled ? collideEvents : 0)
       
	}

	freeze ( b, v ){

		if(v){
			havok.HP_Body_SetGravityFactor(b, 0)
			havok.HP_Body_SetLinearVelocity(b, [0,0,0])
			havok.HP_Body_SetAngularVelocity(b, [0,0,0])
			b.sleep = true
		} else {
			if(b.sleep){
				havok.HP_Body_SetGravityFactor(b, 1)
				b.sleep = false
			}
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