import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';
import { Utils, root } from './root.js';


//----------------
//  HAVOK BODY 
//----------------

// https://dalyup.wordpress.com/2014/07/04/havok-tutorial-02-simple-rigid-bodies/
const vToAr = Utils.vToAr
const qToAr = Utils.qToAr
const toQuat = Utils.toQuat
const toVec = Utils.toVec
const transToAr = Utils.transToAr
const toTrans = Utils.toTrans

export class Body extends Item {

	constructor () {

		super();
		
		this.Utils = Utils;
		this.type = 'body';
		this.itype = 'body';
		this.num = Num[this.type];
		this.full = false;

		this.kinematic = {}

	}

	setFull( full ){

		this.num = Num[ full ? 'bodyFull':'body' ];
		this.full = full;

	}

	reset () {

		this.kinematic = {};
		super.reset();

	}

	clear (b, remplace) {

		if( b.isKinematic ) delete this.kinematic[b.name];

		return super.clear(b, remplace);

		/*const AR = root.Ar;
		const N = root.ArPos[this.itype];

		let n = super.clear(b, remplace)
		MathTool.nullArray( AR, N+n* this.num, this.num )

		return n*/
	}


	// call before engine step

	postStep() {

		let b, t;

		for( let name in this.kinematic ){

			b = this.kinematic[name];
			if(b.first){
				t = b.transform;
				b.first = false
			} else {

				b3.b3Body_SetTargetTransform(
				    b,
				    toTrans(b.transform),
				    root.deltaTime,
				    true,
				);
				//t = havok.HP_Body_GetQTransform(b)[1];
				//havok.HP_Body_SetTargetQTransform( b, MathTool.lerpTransform( t, b.transform, 1/root.substep ))
				//havok.HP_Body_SetTargetQTransform( b, b.transform)

				//b3.b3Body_SetTransform( b, toVec(p), toQuat(q) );
			}
			
		}

		// on each bad perf

		/*let i = this.list.length, b, n, t;
		while( i-- ){
			b = this.list[i];

			if( b.isKinematic ) {
				t = havok.HP_Body_GetQTransform(b)[1];
				havok.HP_Body_SetTargetQTransform( b, MathTool.lerpTransform( t, b.transform, 1/root.substep ))
			}
		}*/

	}

	// call after engine step 

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.itype];
		let p, q

		let i = this.list.length, b, n, t, tar, v, r, sleep;

		while( i-- ){

			b = this.list[i];
			n = N + ( i * this.num );

			sleep = b3.b3Body_IsAwake(b) ? 0 : 1
			AR[ n ] = sleep ? 0 : 1;

			if( b.sleep ) continue;

			//p = b3.b3Body_GetPosition(b);
			//q = b3.b3Body_GetRotation(b);
			t = b3.b3Body_GetTransform(b)

			tar = [[t.p.x, t.p.y, t.p.z], [t.q.v.x, t.q.v.y, t.q.v.z, t.q.s ]];

			MathTool.fillArray( tar[0], AR, n+1, 3 );
			MathTool.fillArray( tar[1], AR, n+4, 4 );

			

			if( this.full ){

				v = vToAr(b3.b3Body_GetLinearVelocity(b));
				r = vToAr(b3.b3Body_GetAngularVelocity(b));
			    MathTool.fillArray( v, AR, n+8, 3 );
			    MathTool.fillArray( r, AR, n+11, 3 );
			    if( AR[ n ] === 1 ) AR[ n ] = MathTool.lengthArray(v) * 9.8;// speed km/h
			} else {

				if( b.getVelocity ){
				    v = vToAr(b3.b3Body_GetLinearVelocity(b));
					r = vToAr(b3.b3Body_GetAngularVelocity(b));
					root.reflow.velocity[b.name] = [...v, ...r];
				}

			}

		}

	}

	///

	shape ( body, o = {} ) {

		let g;
		let t = o.type || 'box'
		let s = o.size || [1,1,1];

		let tt, h, i, n, j, numVertices, vertices;

		let center = o.localPos || [0,0,0]
		let p1 = [center[0], center[1]-s[1]*0.5, center[2]]
		let p2 = [center[0], center[1]+s[1]*0.5, center[2]]
		/*//let p1 = [center[0], center[1], center[2]]
		//let p2 = [center[0], center[1]+s[1], center[2]]
		let qq = o.localQuat || [0,0,0,1]
		p1 = MathTool.applyQuaternion(p1, qq)
		p2 = MathTool.applyQuaternion(p2, qq)*/

		const segment = o.segment || 16

		const scale = { x: 1, y: 1, z: 1 };

		// box3d uses SI units and a right-handed coordinate system (+Y up by default):

		//Length: metres (m)
		//Mass: kilograms (kg) - note: default shape density is 1000 kg/m³
		//Time: seconds (s)
		//Triangle winding: counter-clockwise (CCW) is the front face

		const sd = b3.b3DefaultShapeDef()


		if( o.isTrigger ) sd.isSensor = true;

		/*
		sd.density = 1000
		sd.enableContactEvents = false
		sd.enableCustomFiltering = false
		sd.enableHitEvents = false
		sd.enablePreSolveEvents = false
		sd.enableSensorEvents = false
		sd.explosionScale = 1
		sd.internalValue =  1152023
		sd.invokeContactCreation = true
		sd.isSensor = false
		updateBodyMass = true
		*/

		


		sd.baseMaterial.friction = o.friction !== undefined ? o.friction : 0.5; // 0 = frictionless, 1 = rough
		sd.baseMaterial.restitution = o.restitution !== undefined ? o.restitution : 0.0;  // 0 = no bounce, 1 = perfectly elastic

		switch( t ){

			case 'plane':
			
			if( s[0]===1 ) s = [300,0,300]

			s[1] = 0;

			/*h = [
			    s[0]*0.5, 0, s[2]*0.5,
			    s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, -s[2]*0.5,
			    -s[0]*0.5, 0, s[2]*0.5,
			]

			let planeData = b3.b3CreateHull(h);
			b3.b3CreateHullShape(body, sd, planeData);
			planeData.delete()*/

			b3.b3CreateBoxShape(body, sd, s[0]*0.5, 0.1, s[2]*0.5);

			break;

			case 'box' : b3.b3CreateBoxShape(body, sd, s[0]*0.5, s[1]*0.5, s[2]*0.5); break;
			case 'sphere' : b3.b3CreateSphereShape(body, sd, { center: { x: 0, y: 0, z: 0 }, radius: s[0] }); break;
			case 'particle' : b3.b3CreateSphereShape(body, sd, { center: { x: 0, y: 0, z: 0 }, radius: o.pSize }); break;
			case 'cone' : 

				let coneData = b3.b3CreateCone(s[1], s[0], 0.0, segment);
				tt = { 
					p:{ x:0, y:-s[1]*0.5, z:0 }, 
					q:{ v:{ x:0, y:0, z:0 }, s: 1 } 
				}
				coneData = b3.b3CloneAndTransformHull(coneData, tt, scale)
				b3.b3CreateHullShape(body, sd, coneData);
				coneData.delete();

			break;
			case 'cylinder' : 

				let cylData = b3.b3CreateCylinder(s[1], s[0], 0.0, segment);
				tt = { 
					p:{ x:0, y:-s[1]*0.5, z:0 }, 
					q:{ v:{ x:0, y:0, z:0 }, s: 1 } 
				}
				cylData = b3.b3CloneAndTransformHull(cylData, tt, scale)
				b3.b3CreateHullShape(body, sd, cylData);
				cylData.delete(); 

			break;

			case 'capsule' : 

			    b3.b3CreateCapsuleShape(body, sd, {
				    center1: { x: p1[0], y: p1[1], z: p1[2] },
				    center2: { x: p2[0], y: p2[1], z: p2[2] },
				    radius: s[0],
				});

			break;

			case 'convex' :
			    
			    const hullData = b3.b3CreateHull(o.v);
				b3.b3CreateHullShape(body, sd, hullData);
				hullData.delete()

			break;

			case 'mesh':

			   const meshData = b3.b3CreateMesh(o.v, o.index);
			   b3.b3CreateMeshShape(body, sd, meshData, scale);
			   meshData.delete();

			break;

		}

		//

		//console.log(this.getShape(body))

		if( o.density ){ 

			// The shape density is used to compute the mass properties of the parent body. 
			// The density can be zero or positive. 
			// You should generally use similar densities for all your shapes. 
			// This will improve stacking stability.

			// the body mass immediately or defer for a later call to b3Body_ApplyMassFromShapes()
			let updateMass = true;

			b3.b3Shape_SetDensity ( this.getShape(body), o.density, updateMass )

		}
		

		/** Mark this shape as a trigger. A trigger will generate events, rather than applying impulses to prevent overlap.
	     *  Any material set on this shape will be unused. This has no effect on container shapes, as they don't have any
	     *  geometry themselves.
	     *  Note: Currently, when one of the shapes overlapping a trigger is a mesh shape, one event will be raised per
	     *  overlapping triangle. This is subject to change, as it can cause performance issues.
	     */
		//if( o.isTrigger ) havok.HP_Shape_SetTrigger( g, true );

		//this.setMaterial( g, o );
		//this.setFilter( g, o );

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

		// Allows descending a hierarchy of shape containers, advancing `curItem` to the next entry.
		HP_Shape_PathIterator_GetNext(curItem : ShapePathIterator): [Result, ShapePathIterator, number];
		
		HP_Shape_Release(arg0)
		HP_Shape_RemoveChild(arg0, arg1)
		*/

		//console.log(m)

		//g.volume = o.volume !== undefined ? o.volume : MathTool.getVolume( t, s, o.v );


		//return g

	}

	getShape(b){
		return b3.b3Body_GetShapes(b).get(0);
	}



	setFilter ( b, o ) {

		// b3Filter uses bigint category/mask bits.
		// A contact is generated when (categoryA & maskB) != 0n AND (categoryB & maskA) != 0n.
		//const GROUND  = 1n;
		//const GROUP_A = 2n;
		//const GROUP_B = 4n;

		// belongs to
		if(!o.mask) o.mask = -1
		// collid with
		if(!o.group) o.group = this.type === 'body' ? 1 : 2

		const shape = b3.b3Body_GetShapes(b).get(0);
		if(shape) b3.b3Shape_SetFilter(shape, { categoryBits: o.group, maskBits: o.mask, groupIndex: 0 }, true);

    }

	

    boxHull(hx, hy, hz) {
		return b3.b3CreateHull([
			-hx, -hy, -hz,
			hx, -hy, -hz,
			hx, -hy, hz,
			-hx, -hy, hz,
			-hx, hy, -hz,
			hx, hy, -hz,
			hx, hy, hz,
			-hx, hy, hz,
		]);
	}

	

	add ( o = {} ) {

		let name = this.setName( o );

		// Dynamic sphere dropped from above
		const bodyDef = b3.b3DefaultBodyDef();

		//const motionType = this.type === 'body' ? ( o.kinematic ? "KINEMATIC" : "DYNAMIC" ) : "STATIC";

        bodyDef.type = this.type === 'body' ?  o.kinematic ? b3.b3BodyType.b3_kinematicBody : b3.b3BodyType.b3_dynamicBody : b3.b3BodyType.b3_staticBody;
        

        //bodyDef.position = { x: p[0], y: p[1], z: p[2] };

		//if( o.mass ) delete o.density

		let b = b3.b3CreateBody(root.world, bodyDef);//havok.HP_Body_Create()[1], g;

		let p = o.pos || [0,0,0]
		let q = o.quat || [0,0,0,1]
		b3.b3Body_SetTransform( b, toVec(p), toQuat(q) );

		//let b = new RigidBody( bodyConfig ); 

		//if(o.type === 'mesh') this.autoMesh( o );
		//if( o.shapeType ) o.type = o.shapeType;

		switch( o.type ){

			/*case 'null':
			    //o.density = Infinity
			    //o.mass = 0
			    //o.inertia = [0,0,0]
			    g = havok.HP_Shape_CreateContainer()[1]
			    //g = this.shape( { type:'sphere', size:[0.01] } );
				havok.HP_Body_SetShape( b, g )
				this.applyMass( b, g, o );

				//if( o.density !== undefined ) havok.HP_Shape_SetDensity( g, o.density );

			break;*/
			
			case 'compound':

			    let n, bb
			    const spec = {
				    spheres: [],
				    capsules: [],
				    hulls: [],
				}

			    for ( let i = 0; i < o.shapes.length; i ++ ) {

			    	n = o.shapes[ i ];
			    	p = n.pos || [0,0,0]
			    	q = n.quat || [0,0,0,1]

			    	if(n.type==='box'){
			    		bb = this.boxHull(n.size[0]*0.5, n.size[1]*0.5, n.size[2]*0.5)
			    		spec.hulls.push({
			    			hull: bb,
			    			transform: { p: toVec(p), q: toQuat(q) },
			    		})
			    	}
			    }

			    

			    //console.log(spec)

			    const compound = b3.b3CreateCompound(spec);
			    b3.b3CreateCompoundShape( b, b3.b3DefaultShapeDef(), compound);
			    b.compound = compound
			    /*compoundData.delete();*/


			    /*g = havok.HP_Shape_CreateContainer()[1]

				let gs = [], n, tt;

				for ( let i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

			        if( o.density !== undefined ) n.density = o.density;
			        if( o.friction !== undefined ) n.friction = o.friction
			        if( o.restitution !== undefined ) n.restitution = o.restitution
			        if( o.mask !== undefined ) n.mask = o.mask
			        if( o.group !== undefined ) n.group = o.group

					if(n.localQuat) delete n.localQuat
					if(n.localPos) delete n.localPos

					let trans = [ n.pos || [0,0,0], n.quat || [0,0,0,1], [1,1,1] ]

					//b.addShape( this.shape( n ) )
				    havok.HP_Shape_AddChild( g, this.shape( n ), trans )

				}

				this.setFilter(g, o);

				havok.HP_Body_SetShape( b, g )
				this.applyMass( b, g, o )*/
				
			break;
			default:

			    this.shape( b, o )

			break;

		}

		this.setFilter(b,o)


		b.name = name;
		b.mass = b3.b3Body_GetMass(b)
		b.type = this.type;
		b.breakable = o.breakable || false;
		b.trigger = o.isTrigger || false;
		b.isBone = o.isBone || false


		b.isKinematic = o.kinematic || false;
		if(b.isKinematic){ 

			b.transform = [ p, q ];
			b.first = true
			this.kinematic[b.name] = b;
			
		}

		//this.setMassInfo(b,o)




		//b.lockPos = b.isKinematic;
		//b.sleep = o.sleep || false;
		//b.up = false

		b.button = o.button || false;

		if(o.pos) delete o.pos;
		if(o.quat) delete o.quat;
		if(o.mass) delete o.mass;

		// position / rotation
		/*b.transform = [ o.pos || [0,0,0], o.quat || [0,0,0,1] ];
		if(b.isKinematic) havok.HP_Body_SetTargetQTransform( b, b.transform )
		havok.HP_Body_SetQTransform( b, b.transform )


		// save start state
		//b.pos = o.pos || [0,0,0];
		//b.quat = o.quat || [0,0,0,1]/*

		
		//b.forceSleep = false

		//if( o.pos ){ havok.HP_Body_SetPosition(b, o.pos);  ; }
		//if( o.quat ) { havok.HP_Body_SetOrientation(b, o.quat); b.quat = o.quat; delete o.quat }

		//if( b.isKinematic ) havok.HP_Body_SetTargetQTransform( b, [ b.pos, b.quat ] )
		//else 
		//havok.HP_Body_SetQTransform( b, [ b.pos, b.quat ] )




		havok.HP_Body_SetMotionType(b, havok.MotionType[motionType])
		if( o.kinematic !== undefined ) delete o.kinematic;


		//b.first = true

		



        //console.log(havok.HP_Body_GetMotionType(b)[1])


        // add to world
       // havok.HP_World_AddBody( root.world, b, o.sleep || false );

        
        /*if( o.sleep ){
        	b.deepSleep = 1;
        	havok.HP_Body_SetActivationControl( b, havok.ActivationControl.ALWAYS_INACTIVE );
        }*/



		// add to reference
		this.addToWorld( b, o.id );

		// apply option
		this.set( o, b );

		//this.getMassInfo(b)

		//console.log( b )

		//this.addCollisionCallback(b.name, true)

		//console.log( havok.HP_Body_GetWorldTransformOffset(b) )

		//console.log( havok.HP_World_GetBodyBuffer(b) )

		//if(o.isTrigger)console.log(b)

	}

	applyMass ( b, g, o ) {

		/*if( this.type === 'solid' ) return
		
		

	    // [ center, mass, inertia, inertiaOrientation ]);
		let massProperties = [[0, 0, 0], 1, [1, 1, 1], [0, 0, 0, 1]];

		const shapeRes = havok.HP_Body_GetShape(b);
		if (shapeRes[0] == havok.Result.RESULT_OK) {
			const shapeMass = havok.HP_Shape_BuildMassProperties(shapeRes[1]);
            if (shapeMass[0] == havok.Result.RESULT_OK) {
            	massProperties = shapeMass[1]
            }
		}

		/*if( g ){
			const shapeMass = havok.HP_Shape_BuildMassProperties( g );
			if ( shapeMass[0] === havok.Result.RESULT_OK ){ 
				massProperties = shapeMass[1]
				//console.log(massProperties)
			}
		}*/

		/*if( o.massCenter ) massProperties[0] = o.massCenter;
		if( o.mass !== undefined ) massProperties[1] = o.mass;
		if( o.inertia ) massProperties[2] = o.inertia;
		if( o.inertiaOrientation ) massProperties[3] = o.inertiaOrientation;//Quaternion

	    havok.HP_Body_SetMassProperties( b, massProperties );*/

	}



	setMassInfo ( b, o ){

		let massData = b3.b3Body_GetMassData( b )

		
		if(o.massCenter) massData.center = toVec(o.massCenter);
		//if(o.mass) massData.mass = 100//o.mass;
		//if(o.inertia) massPropsTuple[2] = o.inertia; // [1,1,1]
		//if(o.inertiaOrientation) massPropsTuple[3] = o.inertiaOrientation; // [0,0,0,1]
		console.log(massData)


        b3.b3Body_SetMassData( b, massData )
        //b3.b3Body_ApplyMassFromShapes(b)

	}

	getMassInfo ( b ){

		
		let massData = b3.b3Body_GetMassData (b)

		const info = {
            centerOfMass: massData.center,
            mass: massData.mass,
            inertia: massData.inertia,
        };

        console.log( info )

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return



	    if(o.ccd) o.bullet = o.ccd
	    if(o.bullet) b3.b3Body_SetBullet(b, o.bullet);


		// return velocity on each frame for this body
		if( o.getVelocity !== undefined ) b.getVelocity = o.getVelocity;

		//----------------
	    //  TYPE
	    //----------------

	    if(o.kinematic !== undefined){

	    	// Change body type at runtime
			//b3.b3Body_SetType(b, b3.b3BodyType.b3_staticBody);
			//b3.b3Body_SetType(b, b3.b3BodyType.b3_dynamicBody);
			//havok.HP_Body_SetMotionType(b, havok.MotionType[ o.kinematic ? "KINEMATIC" : "DYNAMIC" ]);
			b.isKinematic = o.kinematic;
			if(b.isKinematic) b3.b3Body_SetType(b, b3.b3BodyType.b3_kinematicBody);
			else b3.b3Body_SetType(b, b3.b3BodyType.b3_dynamicBody);
		}

		//----------------
	    //  GRAVITY
	    //----------------
		
		if( o.gravityScale !== undefined ) b3.b3Body_SetGravityScale(b, o.gravityScale);
	    //if( o.gravityFactor !== undefined ) havok.HP_Body_SetGravityFactor(b, o.gravityFactor);
	    //if( o.gravity !== undefined ) havok.HP_Body_SetGravityFactor(b, o.gravity ? 1 : 0 );

		//----------------
	    //  STATE
	    //----------------

	    // Manually wake or sleep a body
		if( o.sleep ) b3.b3Body_SetAwake(b, false);
		if( o.activate || o.wake ) b3.b3Body_SetAwake(b, true);

		// Disable sleep entirely for a body (keeps it active even at rest)
		if( o.neverSleep !== undefined ) b3.b3Body_EnableSleep(b, !o.neverSleep);

		//----------------
		//   LOCK
		//----------------

        if ( o.angularFactor !== undefined || o.linearFactor !== undefined ){

        	let ang = o.angularFactor || [1,1,1]
        	let lin = o.linearFactor || [1,1,1]
        	let lock = {
        		angularX: !ang[0], angularY: !ang[1], angularZ: !ang[2], 
        		linearX: !lin[0], linearY: !lin[1], linearZ: !lin[2]
        	}
        	b3.b3Body_SetMotionLocks( b, lock )

        }


	    /** Set the activation priority of a body. `priority` should be in the range [-127, 127]. Defaults to 0.
	     * A body with simulation controlled activation will only be activated by interactions from other bodies
	     * whose priority is >= `priority` */
	    //if( o.priority ) havok.HP_Body_SetActivationPriority( b, o.priority );


		// position / rotation

		//if( o.pos || o.quat) havok.HP_Body_SetQTransform( b, [ o.pos || [0, 0, 0], o.quat || [0, 0, 0, 1] ] )
		//if( o.pos ) havok.HP_Body_SetPosition(b, o.pos)
		//if( o.quat ) havok.HP_Body_SetOrientation(b, o.quat)

		if( o.pos || o.quat ){

			//let p = o.pos ? toVec(o.pos) : b3.b3Body_GetPosition(b)
			//let q = o.quat ? toQuat(o.quat) : b3.b3Body_GetRotation(b)

			let pp = o.pos ? o.pos : vToAr(b3.b3Body_GetPosition(b))
			let qq = o.quat ? o.quat : qToAr(b3.b3Body_GetRotation(b))

			b.transform = [ pp, qq ];

			if( !b.isKinematic ) b3.b3Body_SetTransform( b, toVec(pp), toQuat(qq) );

			

		

			// Move a kinematic body towards a target transform each frame.
			// box3d computes the velocities needed to reach it in `dt` seconds,
			// so dynamic bodies are pushed physically rather than teleported through.
			/*if( b.isKinematic ){
				const dt = root.deltaTime//1 / 60;
				b3.b3Body_SetTargetTransform(
				    b,
				    { p:p, q:q },
				    dt,
				    true,
				);
			} else {

				b3.b3Body_SetTransform( b, p, q );

			}*/
			

			//if( b.isKinematic && root.tmpStep===(2*root.substep) ) havok.HP_Body_SetTargetQTransform( b, u ); // !! only on one step
			// Change the body velocity such that next step, it would reach the target transform. DYNAMIC bodies can still be prevented from reaching that transform by collisions and constraints.
			//if( b.isKinematic ) havok.HP_Body_SetTargetQTransform( b, b.transform ); // !! only on one step
			//else havok.HP_Body_SetQTransform( b, b.transform )

			//if( !b.isKinematic ) havok.HP_Body_SetQTransform( b, b.transform )

		}

		//-------------------------
	    //  Damping or drag
	    //-------------------------
		
		// The higher the damping, the more quickly the body will slow down and come to a halt.
		if( o.damping ){
			// This function is useful for controlling the angular velocity of a physics body.
			// Linear damping is a force that opposes the motion of the body, and is proportional to the velocity of the body.
			// This will reduce the linear velocity of the body by some fraction every step, even when the body is not in collision.
			b3.b3Body_SetLinearDamping(b, o.damping[0]);
			// By setting the angular damping, the body's angular velocity will be reduced over time, allowing for more realistic physics simulations.
			b3.b3Body_SetAngularDamping(b, o.damping[1]);
			
		}

		//-------------------------
	    //  Force / Impulse
	    //-------------------------


	    // Apply force at center of mass (accumulates until next step)
		

		// Apply force at a world-space point (generates torque)
		

		
		

		// Apply impulse at a world-space point (generates both linear and angular velocity change)
		


		// impulse has units of momentum, mass * distance/time (mass times velocity), 
		// force has units of mass * distance/time^2 (mass times acceleration)


		// impulse - The impulse vector to apply.
	    // location - The location in world space to apply the impulse.
		/*if( o.impulse ) havok.HP_Body_ApplyImpulse(b, location, o.impulse );*/
		if( o.force ){
			if(o.forcePosition) b3.b3Body_ApplyForce(b, toVec(o.force), toVec(o.forcePosition), true);
			else b3.b3Body_ApplyForceToCenter(b, toVec(o.force), true);
			/*let forceMode = o.forceMode || 'force';
			let location = o.forcePosition ? o.forcePosition : havok.HP_Body_GetPosition(b)[1];
		    if(forceMode === 'force') o.force = MathTool.scaleArray( o.force, root.timestep, 3 );
			havok.HP_Body_ApplyImpulse( b, location, o.force );*/
		}

		// Apply instant impulse at center of mass.
		// box3d's default shape density is 1000 kg/m3 -- bodies are heavy.
		// Scale impulse by mass so the magnitude is predictable regardless of size.
		//const mass = b3.b3Body_GetMass(b);

		if( o.impulse ){
			o.impulse = MathTool.scaleArray( o.impulse, b.mass, 3 );
	    	if( o.impulseCenter ) b3.b3Body_ApplyLinearImpulse(b, toVec(o.impulse), toVec(o.impulseCenter), true);
	    	else b3.b3Body_ApplyLinearImpulseToCenter(b, toVec(o.impulse), true);
	    	//else havok.HP_Body_ApplyImpulse( b, b.pos, o.impulse )
	    }

	    //if( o.angularImpulse ) havok.HP_Body_ApplyAngularImpulse( b, o.angularImpulse );
	    //if( o.torque ) havok.HP_Body_ApplyAngularImpulse( b, o.torque );

		/*if( o.linearImpulse ){
			//this.multiplyScalar( o.linearImpulse, root.delta, 3 )
			havok.HP_Body_ApplyImpulse( b, b.pos, o.linearImpulse );
		}*/

		//-------------------------
	    //  edit compound shape
	    //-------------------------

		/*if(o.editShape){
			this.editShape(o.editShape, b);
		}*/


		//-------------------------
	    //  Velocity operation
	    //-------------------------

	    if( o.linearVelocity ) o.linear = o.linearVelocity;
	    if( o.angularVelocity ) o.angular = o.angularVelocity;

		if( o.velocityOperation !== undefined ){ 
			this.velocityOperation( o, b )
		} else {
			if( o.linear ) b3.b3Body_SetLinearVelocity(b, { x: o.linear[0], y: o.linear[1], z: o.linear[2] });
			if( o.angular ) b3.b3Body_SetAngularVelocity(b, { x: o.angular[0], y: o.angular[1], z: o.angular[2] });
		}

		if( o.reset ){ 
			b3.b3Body_SetLinearVelocity(b, { x:0, y:0, z:0 });
			b3.b3Body_SetAngularVelocity(b, { x:0, y:0, z:0 });
		}

		/*
		if( o.inertiaScale ) o.linearFactor = o.inertiaScale;
		if( o.linearFactor || o.angularFactor ) this.setMassInfo( b, o );

		if( o.massInfo ) this.getMassInfo( b );
		*/

	}

	velocityOperation ( o, b ){

		const lv = b3.b3Body_GetLinearVelocity(b);
		const av = b3.b3Body_GetAngularVelocity(b);


		let linear = [lv[0], lv[1], lv[2]];
		let angular = [av[0], av[1], av[2]];

		switch( o.velocityOperation ){

			case 'xz':
			    if(o.linear) linear = [o.linear[0], linear[1], o.linear[2]];
			    //if(o.angular) angular = [angular[0], o.angular[1], o.angular[2]];
			break;
			case 'add':
				if(o.linear) linear = MathTool.addArray(linear, o.linear, 3);
				if(o.angular) angular = MathTool.addArray(angular, o.angular, 3);
			break;
			case 'sub':
			    if(o.linear) linear = MathTool.subArray(linear, o.linear, 3);
				if(o.angular) angular = MathTool.subArray(angular, o.angular, 3);
			break;
			case 'multy':
			    if(o.linear) linear = MathTool.mulArray(linear, o.linear, 3);
				if(o.angular) angular = MathTool.mulArray(angular, o.angular, 3);
			break;
		    case 'lerp':
			    if(o.linear) linear = MathTool.lerpArray(linear, o.linear, o.time);
				if(o.angular) angular = MathTool.lerpArray(angular, o.angular, o.time);
			break;
			case 'step':
			    if(o.linear) linear = MathTool.mulArray(linear, root.substep);
				if(o.angular) angular = MathTool.mulArray(angular, root.substep);
			break;
			case 'local':
			    let q = havok.HP_Body_GetQTransform(b)[1][1];
			    if(o.linear) linear = MathTool.applyQuaternion(linear, q);
				if(o.angular) angular = MathTool.applyQuaternion(angular, q);
			break;

		}

		b3.b3Body_SetLinearVelocity(b, { x: linear[0], y: linear[1], z: linear[2] });
		b3.b3Body_SetAngularVelocity(b, { x: angular[0], y: angular[1], z: angular[2] });

	}

	getBoundingBox( shape ){

		// get local AABB
        const aabb = havok.HP_Shape_GetBoundingBox( shape, [
            [0, 0, 0],
            [0, 0, 0, 1],
        ])[1];
        return {
        	min:[aabb[0][0], aabb[0][1], aabb[0][2]],
        	max:[aabb[1][0], aabb[1][1], aabb[1][2]]
        };
       
	}

	addCollisionCallback( b, enabled ){

		// Configure a body to raise events, based on eventMask. Bodies will not raise events by default. 
		// The event mask should be the integer value of the EventType enum for all the events you wish to opt into, ORed together. 

		if(b.trigger){
			let shape = havok.HP_Body_GetShape(b)[1]
			havok.HP_Shape_SetTrigger( shape, enabled );
		}else{
			const collideEvents = havok.EventType.COLLISION_STARTED.value | havok.EventType.COLLISION_CONTINUED.value | havok.EventType.COLLISION_FINISHED.value;
		    havok.HP_Body_SetEventMask( b, enabled ? collideEvents : 0);
		}
    
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

	editShape (data, b){

		const container = havok.HP_Body_GetShape(b)[1]
		let lng = havok.HP_Shape_GetNumChildren(container)[1]
		let shape, o, local, shapes = [];
		let i = lng

		while(i--){
			o = data[i];
			shapes[i] = havok.HP_Shape_GetChildShape(container, i)[1]
			havok.HP_Shape_RemoveChild( container, i)
		}

		for ( let j = 0; j < lng; j ++ ) {
			o = data[j];
			let trans = [ o.pos || [0,0,0], o.quat || [0,0,0,1], [1,1,1] ]
			havok.HP_Shape_AddChild( container, shapes[j], trans )
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

/**
 * This method is useful for releasing a physics shape from the physics engine, freeing up resources and preventing memory leaks.
     */
  /*  public disposeShape(shape: PhysicsShape): void {
        this._shapes.delete(shape._pluginData[0]);
        this._hknp.HP_Shape_Release(shape._pluginData);
        shape._pluginData = undefined;
    }*/