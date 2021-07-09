import { Item } from '../core/Item.js';
import { 
	Utils, Vec3, Quat, Transform, RigidBodyConfig, ShapeConfig, Shape, RigidBody,ContactCallback,
	BoxGeometry, SphereGeometry, CylinderGeometry, CapsuleGeometry, ConeGeometry, ConvexHullGeometry
} from './root.js';


export class Body extends Item {

	constructor () {

		super();
		
		this.Utils = Utils

		this.type = 'body';

		this.v = new Vec3();
		this.q = new Quat();
		this.t = new Transform();

		this.sc = new ShapeConfig();

	}

	reset () {

		super.reset();

		// ?? need rest shape config
		//this.sc = new ShapeConfig();

	}

	step ( AR, N ) {

		let i = this.list.length, b, n, s;

		while( i-- ){

			b = this.list[i];

			n = N + ( i * 8 );

			s = b.isSleeping()

			if( s ) b.getLinearVelocityTo(this.v)
			AR[ n ] = s ? 0 : this.v.length() * 9.8;// speed km/h

			b.getPositionTo( this.v )
			b.getOrientationTo( this.q )

			this.v.toArray( AR, n+1 )
			this.q.toArray( AR, n+4 )

		}

	}

	///

	shape ( o = {} ) {

		let sc = this.sc;// new ShapeConfig();
		// The density of the shape, usually in Kg/m^3. def = 1
        if( o.density !== undefined ) sc.density = o.density;
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

		let h, i, n;

		switch( t ){

			case 'plane':
			h = [
			    new Vec3( s[0]*0.5, 0, s[2]*0.5 ),
			    new Vec3( s[0]*0.5, 0, -s[2]*0.5 ),
			    new Vec3( -s[0]*0.5, 0, -s[2]*0.5 ),
			    new Vec3( -s[0]*0.5, 0, s[2]*0.5 ),
			]
			
			g = new ConvexHullGeometry( h );
			g._gjkMargin = o.margin || 0;// default 0.05
			g._useGjkRayCast = o.ray || false;

			break;

			case 'box' : g = new BoxGeometry( this.v.set(s[0] * 0.5, s[1] * 0.5, s[2] * 0.5) ); break;
			case 'sphere' : g = new SphereGeometry( s[0] ); break;
			case 'cone' : g = new ConeGeometry( s[0], s[1] * 0.5 ); break;
			case 'cylinder' : g = new CylinderGeometry( s[0], s[1] * 0.5 ); break;
			case 'capsule' : g = new CapsuleGeometry( s[0], s[1] * 0.5 ); break;
			case 'convex' : 

			    i =  Math.floor( o.v.length/3);
			    h = [];
			    while( i-- ){
			    	n = i*3;
			    	h.push( this.v.fromArray( o.v, n ).clone() )
			    } 
			    g = new ConvexHullGeometry( h );
			    g._gjkMargin = o.margin || 0.00001 // default 0.05
			    g._useGjkRayCast = o.ray || false

			break;

		}

		sc.geometry = g;

		sc.position.fromArray( o.localPos || [0,0,0] );
		sc.rotation.fromQuat( this.q.fromArray( o.localQuat || [0,0,0,1] ) );

		return new Shape( sc );

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

			        if( o.density !== undefined ) n.density = o.density;
			        if( o.friction !== undefined ) n.friction = o.friction;
			        if( o.restitution !== undefined ) n.restitution = o.restitution;
			        if( o.mask !== undefined ) n.collisionMask = o.mask;
			        if( o.group !== undefined ) n.collisionGroup = o.group;

			        if( o.margin !== undefined ) n.margin = o.margin;
			        //if( o.contactCallback !== undefined ) n.contactCallback = new ContactCallback()//o.contactCallback;

					if( n.pos ) n.localPos = n.pos;
					if( n.quat ) n.localQuat = n.quat

					b.addShape( this.shape( n ) );

				}

			break;
			default:

			    b.addShape( this.shape( o ) );

			break;

		}


		


		b.name = name
		b.type = this.type

		// apply option
		this.set( o, b );

		// add to world
		this.addToWorld( b );

	}


	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return;

		if( o.noGravity ) b.setGravityScale( 0 )

		// position / rotation

		if( o.pos ) b.setPosition( this.v.fromArray( o.pos ) )
		if( o.quat ) b.setOrientation( this.q.fromArray( o.quat ) )

		// state

		if( o.sleep ) b.sleep()
		if( o.activate || o.wake ) b.wakeUp()
		if( o.neverSleep !== undefined ) b.setAutoSleep( !o.neverSleep )
			

		// Applies the force `force` to `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
		if( o.worldForce ) b.applyForce( this.v.fromArray( o.worldForce ), this.v.fromArray( o.worldForce, 3 ) )
		if( o.force ) b.applyForceToCenter( this.v.fromArray( o.force ) )
		if( o.torque ) b.applyTorque( this.v.fromArray( o.torque ) )

	    // Applies the impulse `impulse` to the rigid body at `positionInWorld` in world position. [ 0,0,0,   0,0,0 ]
	    if( o.impulse ) b.applyImpulse( this.v.fromArray( o.impulse ), this.v.fromArray( o.impulse, 3 ) );
	    if( o.linearImpulse ) b.applyLinearImpulse( this.v.fromArray( o.linearImpulse ) );
	    if( o.angularImpulse ) b.applyAngularImpulse( this.v.fromArray( o.angularImpulse ) );

	    if( o.gravityScale ) b.setGravityScale( o.gravityScale );

	    if( o.linearVelocity ) b.setLinearVelocity( this.v.fromArray( o.linearVelocity ) );
	    if( o.angularVelocity ) b.setAngularVelocity( this.v.fromArray( o.angularVelocity ) );

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

	}

	setShapes ( o = {}, b = null  ){

		let shapes = b.getShapeList();
		let i = b.getNumShapes(), s;
		while(i--){

			s = shapes[i];

			if( o.density !== undefined ) s.setDensity( o.density );
		    if( o.friction !== undefined ) s.setFriction( o.friction );
		    if( o.restitution !== undefined ) s.setRestitution( o.restitution );
		    if( o.mask !== undefined ) s.setCollisionMask( o.mask );
		    if( o.group !== undefined ) s.setCollisionGroup( o.group );
		    //if( o.callback !== undefined ) s.setContactCallback( o.callback );

		}


	}

}