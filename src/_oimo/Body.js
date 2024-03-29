import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';
import { 
	root, Utils, Vec3, Quat, Transform, RigidBodyConfig, 
	ShapeConfig, Shape, RigidBody,ContactCallback,
	BoxGeometry, SphereGeometry, CylinderGeometry, 
	CapsuleGeometry, ConeGeometry, ConvexHullGeometry
} from './root.js';


//----------------
//  OIMO BODY 
//----------------

export class Body extends Item {

	constructor () {

		super();
		
		this.Utils = Utils;

		this.type = 'body';
		this.itype = 'body';
		this.num = Num[this.type];
		this.full = false;

		this.p = new Vec3();
		this.v = new Vec3();
		this.v2 = new Vec3();
		this.v3 = new Vec3();
		this.vv = new Vec3();
		this.r = new Vec3();
		this.q = new Quat();

		this.sc = new ShapeConfig();

	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ];
		this.full = full;
	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.itype];

		let i = this.list.length, b, n;

		while( i-- ){

			b = this.list[i];
			n = N + ( i * this.num );

			/*if( !b ){
				this.vecZero( AR, n, this.num )
				//AR[n]=AR[n+1]=AR[n+2]=AR[n+3]=AR[n+4]=AR[n+5]=AR[n+6]=AR[n+7] = 0
				continue
			}*/

			AR[ n ] = b.isSleeping() ? 0 : 1;

			b.getPositionTo( this.p );
			b.getOrientationTo( this.q );
			this.p.toArray( AR, n+1 );
			this.q.toArray( AR, n+4 );

			if( this.full ){
				b.getLinearVelocityTo( this.vv );
			    b.getAngularVelocityTo( this.r );
				this.vv.toArray( AR, n+8 );
			    this.r.toArray( AR, n+11 );
			    if( AR[ n ] === 1 ) AR[ n ] = this.vv.length() * 9.8;// speed km/h
			}
		}

	}

	///

	shape ( o = {} ) {

		let sc = this.sc;// new ShapeConfig();
		
        
        //if( o.mass !== undefined ) sc.density = o.mass; // extra mass for static body test ??
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

		let h, i, n, j;

		switch( t ){

			case 'plane':
			
			if( s[0]===1 ) s = [300,0,300];
			if( !s[1] ) s[1] = 1.0;

			g = new BoxGeometry( this.v.set(s[0] * 0.5, s[1] * 0.5, s[2] * 0.5) );

		    if(o.localPos) o.localPos[1] -= s[1]*0.5;
			else o.localPos = [0,-s[1]*0.5,0];

			/*h = [
			    new Vec3( s[0]*0.5, 0, s[2]*0.5 ),
			    new Vec3( s[0]*0.5, 0, -s[2]*0.5 ),
			    new Vec3( -s[0]*0.5, 0, -s[2]*0.5 ),
			    new Vec3( -s[0]*0.5, 0, s[2]*0.5 ),
			]
			
			g = new ConvexHullGeometry( h );
			g._gjkMargin = o.margin || 0.0001;// default 0.05
			g._useGjkRayCast = o.ray || false;*/

			break;

			case 'box' : g = new BoxGeometry( this.v.set(s[0] * 0.5, s[1] * 0.5, s[2] * 0.5) ); break;
			case 'sphere' : g = new SphereGeometry( s[0] ); break;
			case 'particle' : g = new SphereGeometry( o.pSize || 0.05 ); break;
			case 'cone' : g = new ConeGeometry( s[0], s[1] * 0.5 ); break;
			case 'cylinder' : g = new CylinderGeometry( s[0], s[1] * 0.5 ); break;
			case 'capsule' : g = new CapsuleGeometry( s[0], s[1] * 0.5 ); break;
			case 'convex' : 

			    i = Math.floor( o.v.length/3);
			    j = 0
			    h = [];
			    while( i-- ){
			    	n = j*3;
			    	h.push( this.v.fromArray( o.v, n ).clone() )
			    	j++
			    } 
			    g = new ConvexHullGeometry( h );
			    g._gjkMargin = o.margin || 0.0001 // default 0.05
			    // oimo ray can hit this convex // false by default
			    g._useGjkRayCast = true;//o.ray || false

			break;

		}

		//console.log(g._volume, o.volume)

		//g.volume = MathTool.getVolume( t, s, o.v );

		sc.geometry = g;

		//sc.position.fromArray( o.pos || [0,0,0] );
		//sc.rotation.fromQuat( this.q.fromArray( o.quat || [0,0,0,1] ) );

		sc.position.fromArray( o.localPos || [0,0,0] );
		sc.rotation.fromQuat( this.q.fromArray( o.localQuat || [0,0,0,1] ) );


		// The density of the shape, usually in Kg/m^3. def = 1
		//if( o.mass && o.density ) delete o.density
		//if( o.mass !== undefined ) o.density = MathTool.densityFromMass( o.mass, MathTool.getVolume( t, s, o.v ) )
        sc.density = o.density || 0;


        //console.log( o.mass, o.density )
        


		let shape = new Shape( sc );



		return shape

	}

	autoMesh ( o ){

		o.type = 'compound'
		o.shapes = []

		let square = o.square || false
		square = o.isTerrain || false
		let v = o.v
		let n, vv, lng
		let index = o.index || null

		if( index !== null ){

			//console.log('isIndex')

			let ta, tb, tc
			lng = index.length/3

			//console.log(index[0], index[1], index[2])

			for( let i=0; i<lng; i++ ){

				n = i*3;
				ta = index[n]
				tb = index[n+1]
				tc = index[n+2]

				vv = [
					v[ ta ], v[ ta+1 ], v[ ta+2 ],
					v[ tb ], v[ tb+1 ], v[ tb+2 ],
					v[ tc ], v[ tc+1 ], v[ tc+2 ],
				]

				o.shapes.push( { type:'convex', v:vv, nogeo:true })

			}


		}else{

			if( square ){

				lng = v.length/18 
				
				for( let i=0; i<lng; i++ ){

					n = i*18;

					vv = [
					v[ n ], v[ n+1 ], v[ n+2 ],
					v[ n+3 ], v[ n+4 ], v[ n+5 ],
					v[ n+6 ], v[ n+7 ], v[ n+8 ],

					v[ n+9 ], v[ n+10 ], v[ n+11 ],
					v[ n+12 ], v[ n+13 ], v[ n+14 ],
					v[ n+15 ], v[ n+16 ], v[ n+17 ]
					]

					o.shapes.push( { type:'convex', v:vv, nogeo:true })

				}

			} else {// each triangle

				lng = v.length/9

				for( let i=0; i<lng; i++ ){

					n = i*9;

					vv = [
					v[ n ], v[ n+1 ], v[ n+2 ],
					v[ n+3 ], v[ n+4 ], v[ n+5 ],
					v[ n+6 ], v[ n+7 ], v[ n+8 ],
					]

					o.shapes.push( { type:'convex', v:vv, nogeo:true })

				}

			}
		}

	}

	add ( o = {} ) {

		let name = this.setName( o );

		let bodyConfig = new RigidBodyConfig();

		let pos = o.pos || [0,0,0]
		let quat = o.quat || [0,0,0,1]

		bodyConfig.position.fromArray(pos)
		bodyConfig.rotation.fromQuat(this.q.fromArray(quat))

		bodyConfig.autoSleep = o.autoSleep !== undefined ? o.autoSleep : true;
		
		// 0 : DYNAMIC / 1 : STATIC / 2 : KINEMATIC 
		bodyConfig.type = this.type === 'body' ? ( o.kinematic ? 2 : 0 ) : 1;

		

		let b = new RigidBody( bodyConfig ); 

		if(o.type === 'mesh') this.autoMesh( o );

		switch( o.type ){

			case 'null': break;
			
			case 'compound':

				let gs = [], n;

				for ( var i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

			        if( o.density !== undefined ) n.density = o.density
			        if( o.friction !== undefined ) n.friction = o.friction
			        if( o.restitution !== undefined ) n.restitution = o.restitution
			        if( o.mask !== undefined ) n.collisionMask = o.mask
			        if( o.group !== undefined ) n.collisionGroup = o.group
			        if( o.margin !== undefined ) n.margin = o.margin
			        //if( o.contactCallback !== undefined ) n.contactCallback = new ContactCallback()//o.contactCallback;

					if( n.pos ) n.localPos = n.pos
					if( n.quat ) n.localQuat = n.quat

					b.addShape( this.shape( n ) )

				}

			break;
			default:
			
			    if( o.shapeType ) o.type = o.shapeType;
			    b.addShape( this.shape( o ) );

			break;

		}

		//b.updateMass()


		b.name = name
		b.type = this.type
		b.breakable = o.breakable || false
		b.isKinematic = o.kinematic || false

		//b.first = true

		if( o.kinematic ){ 
			b.pos = o.pos || [0,0,0]
			b.quat = o.quat || [0,0,0,1]
		}

		

		// 0 : DYNAMIC / 1 : STATIC / 2 : KINEMATIC 
		b.setType( this.type === 'body' ? ( o.kinematic ? 2 : 0 ) : 1 );

		
		

		delete o.kinematic
	    delete o.pos
	    delete o.quat
		

		// add to world
		this.addToWorld( b, o.id )

		b.setLinearVelocity( this.v.set( 0, 0, 0) );
		b.setAngularVelocity( this.v.set( 0, 0, 0) );
		//b.updateMass();


		// apply option
		this.set( o, b )

		//console.log(b)

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		if( o.kinematic !== undefined ){
			b.setType(o.kinematic ? 2 : 0);
			b.isKinematic = o.kinematic ? true : false;
		}


		if( o.noGravity ) b.setGravityScale( 0 )

		// position / rotation

	    if( o.pos || o.quat ){

	    	if( o.pos ){ 
	    		
	    		if(b.isKinematic){

	    			let pp = MathTool.subArray(o.pos, b.pos)
	    			pp = MathTool.mulArray(pp, root.invDelta)
	    			b.setLinearVelocity( this.v.fromArray( pp ) )
	    			b.pos = o.pos
	    		}

	    		b.setPosition( this.v.fromArray( o.pos ) )

	    	}
		    if( o.quat ){
		    	
		    	if(b.isKinematic){

		    		let qqq = MathTool.quatMultiply( o.quat, MathTool.quatInvert( b.quat ) )
		    		let mtx = MathTool.composeMatrixArray( [0,0,0], qqq, [1,1,1])
		    		let eee = MathTool.eulerFromMatrix( mtx )
		    		eee = MathTool.mulArray(eee, root.invDelta )

	    			b.setAngularVelocity( this.v.fromArray( eee ) )
	    			b.quat = o.quat
	    		}
	    		
		        b.setOrientation( this.q.fromArray( o.quat ) )
		    }
	    }

		

		// state

		if( o.sleep ) b.sleep()
		if( o.activate || o.wake ) b.wakeUp()
		if( o.neverSleep !== undefined ){ 
			b.setAutoSleep( !o.neverSleep )
			if( o.neverSleep )  b.wakeUp()
		}

	    if( b.type === 'body' ){

	    	//b.setRotationFactor(this.v.set( 0.1, 0.1, 0.1))
			

			// Applies the force `force` to `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
			if( o.worldForce ) b.applyForce( this.v.fromArray( o.worldForce ), this.v.fromArray( o.worldForce, 3 ) )
			if( o.force ) b.applyForceToCenter( this.v.fromArray( o.force ) )
			if( o.torque ) b.applyTorque( this.v.fromArray( o.torque ) )



		    // Applies the impulse to the rigid body at `positionInWorld` in world position
		    if( o.impulse ){
		    	if( o.impulseCenter ){ 
		    		//b.getPositionTo( this.v3 );
		    		this.v2.fromArray( o.impulseCenter )//.sub( this.v3 );
		    		b.applyImpulse( this.v3.fromArray( o.impulse ), this.v2 );
		    		
		    		//o.damping = [1, 1]
		    		//o.reset = true
		    		//b.applyImpulse( this.v.fromArray( o.impulse ), this.v2.fromArray( o.impulseCenter ) );
		    	}
		    	else b.applyLinearImpulse( this.v.fromArray( o.impulse ) );
		    }


		    if( o.angularImpulse ) b.applyAngularImpulse( this.v.fromArray( o.angularImpulse ) )

		    if( o.gravityScale ) b.setGravityScale( o.gravityScale );

		    if( o.gravity !== undefined ) b.setGravityScale( o.gravity ? 1 : 0 );

	    
		    //b.getOrientationTo( this.q )
		    //if( o.linearVelocity ) b.setLinearVelocity( this.v.fromArray( o.linearVelocity ).applyQuaternion( this.q ) )
		    //if( o.angularVelocity ) b.setAngularVelocity( this.v.fromArray( o.angularVelocity ).applyQuaternion( this.q ) )

		    if( o.linearVelocity ) b.setLinearVelocity( this.v.fromArray( o.linearVelocity ) )
		    if( o.angularVelocity ) b.setAngularVelocity( this.v.fromArray( o.angularVelocity ) )

		    if( o.addLinearVelocity ) b.addLinearVelocity( this.v.fromArray( o.linearVelocity ) )
		    if( o.addAngularVelocity ) b.addAngularVelocity( this.v.fromArray( o.angularVelocity ) )
		}

	    // lock rotation axis
	    if( o.angularFactor ) b.setRotationFactor( this.v.fromArray( o.angularFactor ) )

	    // Sets the linear and angular damping. [ 0,0 ]
	    if( o.damping ){
		    b.setLinearDamping( o.damping[0] );
		    b.setAngularDamping( o.damping[1] );
		}

		if( o.reset ){ 
			b.setLinearVelocity( this.v.set( 0, 0, 0) );
			b.setAngularVelocity( this.v.set( 0, 0, 0) );
		}

		if( o.massInfo ) {
	    	this.getMassInfo( b );
	    }

	}

	setShapes ( o = {}, b = null  ){

		let shapes = b.getShapeList()
		let i = b.getNumShapes(), s
		while(i--){

			s = shapes[i]

			if( o.density !== undefined ) s.setDensity( o.density )
		    if( o.friction !== undefined ) s.setFriction( o.friction )
		    if( o.restitution !== undefined ) s.setRestitution( o.restitution )
		    if( o.mask !== undefined ) s.setCollisionMask( o.mask )
		    if( o.group !== undefined ) s.setCollisionGroup( o.group )
		    //if( o.callback !== undefined ) s.setContactCallback( o.callback );

		}


	}

	getMassInfo( b = null ){

		if( typeof b === 'string' ) b = this.byName( b );
		if( b === null ) return;
		if( this.type !== 'body' ) return;

		const info = {

			mass: b.getMass(),
			invMass: b._invMass,
			inertia: b.getLocalInertia().toArray(),
			invInertia:[
			b._invInertia00, b._invInertia01, b._invInertia02,
			b._invInertia10, b._invInertia11, b._invInertia12,
			b._invInertia20, b._invInertia21, b._invInertia22
			]//_invLocalInertia//.toArray(),
			/*massCenter: b.getCMassLocalPose().p.toArray(),
			
			invInertia: b.getMassSpaceInvInertiaTensor().toArray(),*/

		}

		console.log( info )

	}

}