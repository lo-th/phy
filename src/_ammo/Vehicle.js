import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, map, math, torad, todeg } from './root.js';

/** __
*    _)_|_|_
*   __) |_| | 2023
*   @author lo.th / https://github.com/lo-th
*
*   AMMO VEHICLE
*/

export class Vehicle extends Item {

	constructor () {

		super();

		this.type = 'vehicle'
		this.Utils = Utils
		this.trans = new Ammo.btTransform();

	}

	step ( AR, N ) {

		let i = this.list.length, n;

		while( i-- ){
			n = N + ( i * Num.vehicle );
			this.list[i].step( AR, n, this.trans );
		}

	}

	add ( o ) {

		let name = this.setName( o )
		let car = new Car( o )
		this.addToWorld( car, o.id )

	}

	set ( o = {}, car = null ) {

		if( car === null ) car = this.byName( o.name )
		if( car === null ) return
		car.set( o )

	}

}



class Car {

	constructor ( o ) {

		// http://www.asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html
		
		// https://github.com/yanzuzu/BulletPhysic_Vehicle

		//https://docs.google.com/document/d/18edpOwtGgCwNyvakS78jxMajCuezotCU_0iezcwiFQc/edit

		this.type = 'vehicle'
		this.name = o.name

		// wheel
        this.numWheel = o.numWheel || 4
        this.wheelsPosition = o.wheelsPosition
        this.radius = o.radius
        this.radiusBack = o.radiusBack
        this.deep = o.deep
        this.deepBack = o.deepBack
		this.massCenter = o.massCenter || [0, 0.55, 1.594]
        this.chassisPos = o.chassisPos || [0, 0.83, 0]

		this.chassis = null;
		this.body = null;
		this.steering = 0;
		this.breaking = 0;
		this.motor = 0;

		this.gearRatio = [ - 1, 0, 2.3, 1.8, 1.3, 0.9, 0.5 ];
		this.key = [0,0,0,0,0,0,0,0];
		// acceleration / topSpeed

		this.limitAngular = [1,1,1];

		this.transforms = [];

		this.wheelBody = [];
		this.wheelJoint = [];
		this.wheelRadius = [];

		this.isRay = true;

		this.data = {

			mass: o.mass || 2000, // 100

			incSteering: o.incSteering || 2,
			maxSteering: o.maxSteering || 24,

			wMass: 1,
			// wheels
			//radius: 0.5,
			wWidth: 0.25,
			nWheel: o.nWheel || 4,
			wPos: [ 1, 0, 1.6 ], // wheels position on chassis
			// drive setting
			engine: 1000,
			acceleration: 10,
			breaking: 100,

			// position / rotation / size
			pos: [ 0, 0, 0 ],
			quat: [ 0, 0, 0, 1 ],
			//size:[ 1.5, 0.4, 3.6 ],
			// local center of mass (best is on chassis bottom)
			masscenter: [ 0, - 0.6, 0 ],
			// car body physics
			friction: 0.6,
			restitution: 0.1,
			linear: 0,
			angular: 0,
			rolling: 0,
			// auto compess
			autoSuspension: false,
			compValue: 0.2, //(lower than damp!)
			dampValue: 0.3,
			// suspension
			s_stiffness: 20,
			s_compression: 2.3,
			s_damping: 4.4, //2.4
			s_travel: 5,
			s_force: 6000,
			s_length: 0.2,
			// wheel
			w_friction: 10.5, //1000,
			w_roll: 0.001,

		};

		this.init( o );

	}

	init ( o ) {

		this.wpos = o.wPos;

		

	   /*o.size = o.size === undefined ? [ 2, 0.5, 4 ] : o.size;

		if( o.pos !== undefined ) o.pos = math.vectomult( o.pos, root.invScale );
		if( o.size !== undefined ) o.size = math.vectomult( o.size, root.invScale );
		if( o.masscenter !== undefined ) o.masscenter = math.vectomult( o.masscenter, root.invScale );

		// car shape
		var shapeType = o.shapeType || 'box';
		var shapeInfo = {};

		if ( shapeType == 'mesh' ) shapeInfo = { type: 'mesh', v: o.v, mass: 1 };
		else if ( shapeType == 'convex' ) shapeInfo = { type: 'convex', v: o.v };
		else shapeInfo = { type: 'box', size: o.size };

		var shape = root.makeShape( shapeInfo );

		if ( o.v !== undefined ) delete ( o.v );

		//var vehicleRay = new Ammo.btDefaultVehicleRaycaster( root.world );
		var car = new Car( name, o, shape );

		root.world.addAction( car.chassis );
		root.world.addRigidBody( car.body );

		this.cars.push( car );

		//map.set( name, car );
		//map.set( name + '_body', car.body );

		map.set( name + '_constuctor', car  );
		map.set( name , car.body );
		map.set( name + '_chassis', car.chassis );*/

		const data = this.data;

		let trans = new Ammo.btTransform();
		let p0 = new Ammo.btVector3();
		let p1 = new Ammo.btVector3();
		let p2 = new Ammo.btVector3();
		let p3 = new Ammo.btVector3();

		this.isRay = o.isRay === undefined ? true : o.isRay;

		data.mass = o.mass === undefined ? 800 : o.mass;
		//o.masscenter = o.masscenter === undefined ? [ 0, 0, 0 ] : o.masscenter;

		data.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		data.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;

		data.nWheel = o.nWheel || 4;

		// car shape

		//console.log(o.masscenter)

		this.chassisShape = o.chassisShape ? root.bodyRef.shape( o.chassisShape ) : new Ammo.btBoxShape( p0.set(0.85, 0.65, 2.5) );


		// move center of mass
		p0.fromArray( this.massCenter )//.negate();
		trans.setIdentity();
		trans.setOrigin( p0 );
		const compound = new Ammo.btCompoundShape();
		compound.addChildShape( trans, this.chassisShape );

		// position rotation of car
		this.startPose = new Ammo.btTransform().fromArray( this.startPosition, this.startQuaternion )
		//trans.fromArray( data.pos.concat( data.quat ) );

		// mass of vehicle in kg
		p0.setValue( 0, 0, 0 );
		compound.calculateLocalInertia( data.mass, p0 );
		var motionState = new Ammo.btDefaultMotionState( this.startPose );
		var rbInfo = new Ammo.btRigidBodyConstructionInfo( data.mass, motionState, compound, p0 );

		// car body
		this.body = new Ammo.btRigidBody( rbInfo );
		this.body.name = this.name;
		//this.body.isRigidBody = true;
		//this.body.isBody = true;

		this.body.setActivationState( 4 );

		Ammo.destroy( rbInfo );

		//if( this.isRay ) {
		const tuning = new Ammo.btVehicleTuning();
		const vehicleRay = new Ammo.btDefaultVehicleRaycaster( root.world );
		this.chassis = new Ammo.btRaycastVehicle( tuning, this.body, vehicleRay );
		this.chassis.setCoordinateSystem( 0, 1, 2 );
		//}

		// wheels

		/*var radius = o.radius || 0.4;
		var radiusBack = o.radiusBack || radius;
		var wPos = o.wPos || [ 1, 0, 1.6 ];

		wPos = math.vectomult( wPos, root.invScale );
		radius = radius * root.invScale;
		radiusBack = radiusBack * root.invScale;



		wPos[ 1 ] -= o.masscenter[ 1 ];

		var n = data.nWheel, p, fw;
		var by = o.decalYBack || 0;

		for ( var i = 0; i < n; i ++ ) {



			//if ( i === 2 && wPos[ 4 ] ) wPos[ 0 ] += wPos[ 4 ];
			if ( i === 0 ) {

				p = [ wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 1 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ], wPos[ 2 ] ]; fw = true;

			}
			if ( i === 2 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 3 ) {

				p = [ wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

			}
			if ( i === 4 ) {

				p = [ - wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 3 ] ]; fw = false;

			}
			if ( i === 5 ) {

				p = [ wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 3 ] ]; fw = false;

			}

			if ( n === 2 ) { // moto

				if ( i === 0 ) {

					p = [ 0, wPos[ 1 ], wPos[ 2 ] ]; fw = true;

				}

				if ( i === 1 ) {

					p = [ 0, wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

			}

			if ( n === 3 ) { // moto

				if ( i === 0 ) {

					p = [ 0, wPos[ 1 ], wPos[ 2 ] ]; fw = true;

				}

				if ( i === 1 ) {

					p = [ wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

				if ( i === 2 ) {

					p = [ -wPos[ 0 ], wPos[ 1 ] + by, - wPos[ 2 ] ]; fw = false;

				}

			}*/

			//console.log(p)

			const NW = this.numWheel;

			for ( let i = 0; i < NW; i ++ ) {

				let fw = 1<2;

				p1.fromArray( this.wheelsPosition[i] ); // position
				p2.setValue( 0, - 1, 0 ); // wheelDir
				p3.setValue( - 1, 0, 0 ); // wheelAxe

			/*var m = i*3;
			if(o.wheelDir){
				p2.setValue( o.wheelDir[m], o.wheelDir[m+1], o.wheelDir[m+2] );
			}
			if(o.wheelAxe){
				p3.setValue( o.wheelAxe[m], o.wheelAxe[m+1], o.wheelAxe[m+2] );
			}*/

			//if( this.isRay ){

				//console.log(fw ? radius : radiusBack)
				
				this.chassis.addWheel( p1, p2, p3, 1, fw ? this.radius : this.radiusBack, tuning, fw );
			    this.chassis.setBrake( o.breaking || 100, i );

			    //this.wheelRadius.push( fw ? this.radius : this.radiusBack );

			    //this.transforms.push( this.chassis.getWheelTransformWS( i ) )

			/*} else {

				trans.identity();
				trans.setOrigin( p1 );

				p2.setValue( data.wWidth * root.invScale, radius, radius );
				shape = new Ammo.btCylinderShape( p2 );

				p0.setValue( 0, 0, 0 );
				shape.calculateLocalInertia( data.wMass, p0 );

				var motionState = new Ammo.btDefaultMotionState( trans );
				var rbInfo = new Ammo.btRigidBodyConstructionInfo( data.wMass, motionState, shape, p0 );

				var wheel = new Ammo.btRigidBody( rbInfo );

				wheel.setFriction( 1110 );
				wheel.setActivationState( 4 );
				root.world.addRigidBody( wheel, 1, - 1 );

				this.wheelBody[i] = wheel;

				var joint = new Ammo.btHingeConstraint( this.body, wheel, p1, p0, p2, p3, false );
				root.world.addConstraint( joint, false );

				// Drive engine.
				/*
				joint.enableMotor(3, true);
				joint.setMaxMotorForce(3, 1000);
				joint.setTargetVelocity(3, 0);

				// Steering engine.
				joint.enableMotor(5, true);
				joint.setMaxMotorForce(5, 1000);
				joint.setTargetVelocity(5, 0);

				joint.setParam( BT_CONSTRAINT_CFM, 0.15f, 2 );
				joint.setParam( BT_CONSTRAINT_ERP, 0.35f, 2 );

				joint.setDamping( 2, 2.0 );
				joint.setStiffness( 2, 40.0 );
				*/

			//	this.wheelJoint[i] = joint;


			//}
			

		}

		//return

		






		this.setData( o );

		//this.world.addAction( this.chassis );
		//this.world.addRigidBody( this.body );
		//this.body.activate();
		trans.free();
		p0.free();
		p1.free();
		p2.free();
		p3.free();


		root.world.addAction( this.chassis );
		root.world.addRigidBody( this.body );

	}

	step ( Ar, n, trans ) {

		this.drive()

		//

		//var scale = root.scale;

		// speed km/h
		Ar[ n ] = this.chassis.getCurrentSpeedKmHour();

		this.body.getMotionState().getWorldTransform( trans );
		trans.toArray( Ar, n + 1 );
		trans = trans.inverse()

		var j = this.data.nWheel, w, t;

		while ( j -- ) {

			this.chassis.updateWheelTransform( j, true );

			t = this.chassis.getWheelTransformWS( j );
			// convet to local transform
			t.mult(trans, t)

			//t.sub(trans)

			// supension info
			Ar[ n + 56 + j ] = this.chassis.getWheelInfo( j ).get_m_raycastInfo().get_m_suspensionLength();

			w = 8 * ( j + 1 );
			t.toArray( Ar, n + w + 1 );

			//this.transforms[j].toArray( Ar, n + w + 1, scale );

			if ( j === 0 ) Ar[ n + w ] = this.chassis.getWheelInfo( 0 ).get_m_steering();
			if ( j === 1 ) Ar[ n + w ] = this.chassis.getWheelInfo( 1 ).get_m_steering();
			if ( j === 2 ) Ar[ n + w ] = this.steering;//this.chassis.getWheelInfo( 0 ).get_m_steering();

		}

		Ar[ n + 62 ] = this.chassis.getWheelInfo( 0 ).m_rotation;
		Ar[ n + 63 ] = this.chassis.getWheelInfo( 1 ).m_rotation;

	}

	set ( o ) {

        if( o.key ) this.key = o.key

            //console.log(this.key)

	}

	setMass ( m ) {

		var p0 = math.vector3();
		this.data.mass = m;
		p0.setValue( 0, 0, 0 );
		this.body.getCollisionShape().calculateLocalInertia( this.data.mass, p0 );
		this.body.setMassProps( m, p0 );
		this.body.updateInertiaTensor();
		p0.free();

	}

	setPosition () {

		this.steering = 0;
		this.breaking = 0;
		this.motor = 0;

		var trans = math.transform();
		trans.identity().fromArray( this.data.pos.concat( this.data.quat ) );
		var p0 = math.vector3().set( 0, 0, 0 );

		this.body.setAngularVelocity( p0 );
		this.body.setLinearVelocity( p0 );
		this.body.setWorldTransform( trans );
		//this.body.activate();

		//world.getBroadphase().getOverlappingPairCache().cleanProxyFromPairs( this.body.getBroadphaseHandle(), world.getDispatcher() );

		this.chassis.resetSuspension();
		var n = this.data.nWheel;
		while ( n -- ) this.chassis.updateWheelTransform( n, true );

		trans.free();
		p0.free();

		//console.log( world, world.getPairCache(), world.getDispatcher() )

	}

	drive () {

		const data = this.data;
		const k = this.key

		

		// steering

        if ( k[ 0 ] === 0 ) this.steering *= 0.9;
        else this.steering -= data.incSteering * k[ 0 ];
        this.steering = math.clamp( this.steering, - data.maxSteering, data.maxSteering );

        // engine
        if ( k[ 1 ] === 0 ){ 
        	this.motor = 0; 
        	this.breaking = data.breaking;
        } else {
			this.motor -= data.acceleration * k[ 1 ];
			this.breaking = 0;
		}

		this.motor = math.clamp( this.motor, - data.engine, data.engine );
		//if ( this.motor > data.engine ) this.motor = data.engine;
		//if ( this.motor < - data.engine ) this.motor = - data.engine;

		/*if ( key[ 1 ] === 0 ) { // && key[1] == 0 ){

			if ( this.motor > 1 || this.motor < - 1 ) this.motor *= 0.9;
			else {

				this.motor = 0; this.breaking = data.breaking;

			}

		}*/

		//return

		let angle_l, angle_r

		// Ackermann steering principle
		if ( this.numWheel > 3 ){

			let lng = (this.wpos[2]*2);
			let w = this.wpos[0];
			let turn_point = lng / Math.tan( this.steering*torad );

			angle_l = Math.atan2( lng, w + turn_point);
			angle_r = Math.atan2( lng, -w + turn_point);
			if(turn_point<0){
				angle_l-=Math.PI;
				angle_r-=Math.PI;
			}

		}


		let i = this.numWheel;

		while ( i -- ) {

			if ( this.numWheel < 4 ){

				if ( i === 0 ) this.chassis.setSteeringValue( this.steering*torad, i );

			} else {

				if ( i === 0 ) this.chassis.setSteeringValue( angle_r, i );
			    if ( i === 1 ) this.chassis.setSteeringValue( angle_l, i );

			}

			this.chassis.applyEngineForce( this.motor, i );
			this.chassis.setBrake( this.breaking, i );

		}

		if(this.motor<1){
			var v = this.body.getAngularVelocity();
			v.multiplyArray( this.limitAngular );
			this.body.setAngularVelocity(v);
		}

	}

	clear () {

		/*this.world.removeRigidBody( this.body );
        this.world.removeAction( this.chassis );

        Ammo.destroy( this.body );
        Ammo.destroy( this.chassis );*/

		this.body = null;
		this.chassis = null;

	}

	setData ( o ) {

		var data = this.data;

		// mass
		if ( o.mass !== undefined ) {

			if ( o.mass !== data.mass ) this.setMass( o.mass );

		}

		// copy value
		for ( var i in o ) {

			if ( data[ i ] !== undefined ) data[ i ] = o[ i ];

		}

		// force value for bool
		//data.autoSuspension = o.autoSuspension || false;

		// body
		this.body.setFriction( data.friction );
		this.body.setRestitution( data.restitution );
		this.body.setDamping( data.linear, data.angular );// def 0,0
		this.body.setRollingFriction( data.rolling );

		if ( o.limitAngular !== undefined ) this.limitAngular = o.limitAngular;

		//console.log(this.body.getAngularVelocity().toArray())

		var p1 =new Ammo.btVector3();
		if ( o.linearFactor !== undefined ) this.body.setLinearFactor( p1.fromArray( o.linearFactor ) );
		if ( o.angularFactor !== undefined ) this.body.setAngularFactor( p1.fromArray( o.angularFactor ) );
		p1.free();

		//console.log( o.autoSuspension )


		if ( data.autoSuspension ) {

			var sqrt = Math.sqrt( data.s_stiffness );
			data.s_compression = data.compValue * 2 * sqrt;
			data.s_damping = data.dampValue * 2 * sqrt;
            
            //console.log( data.s_damping, data.s_compression )
		}

		var n = data.nWheel, w;

		while ( n -- ) {

			w = this.chassis.getWheelInfo( n );

			w.set_m_suspensionStiffness( data.s_stiffness );
			w.set_m_wheelsDampingCompression( data.s_compression );
			w.set_m_wheelsDampingRelaxation( data.s_damping );

			w.set_m_maxSuspensionTravelCm( data.s_travel * 100  );
			//console.log( 'travel', w.get_m_maxSuspensionTravelCm() );
			
			w.set_m_suspensionRestLength1( data.s_length  );
			w.set_m_maxSuspensionForce( data.s_force );

			w.set_m_rollInfluence( data.w_roll );
			w.set_m_frictionSlip( data.w_friction );

			w.set_m_wheelsRadius( n<2 ? this.radius : this.radiusBack );
			//w.set_m_chassisConnectionPointCS( tmpPos1.fromArray(o.w_position) );

		}

		if ( o.reset ) this.setPosition();

	}

	get () {

		self.postMessage( { m: 'carData', o: this.data } );

	}

	release() {

		root.world.removeAction( this.chassis );
		root.world.removeRigidBody( this.body );
		Ammo.destroy( this.chassis );
		Ammo.destroy( this.body );

	}

}