
import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, torad } from '../core/MathTool.js';


import { Utils, root, Vec3, Quat } from './root.js';

// RAPIER JOINT

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'joint';

		this.v1 = new Vec3()
		this.v2 = new Vec3()

		this.p1 = new Vec3()
		this.p2 = new Vec3()

		this.q1 = new Quat()
		this.q2 = new Quat()
		this.q3 = new Quat()

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, j, n, mtx1, mtx2;

		while( i-- ){

			j = this.list[i];

			n = N + ( i * Num.joint );

			//j.getRelativeTransform().toArray( AR, n  );

			if( j.visible ){

				/*if(j.b1){
					this.p1.copy( j.b1.translation() )
					this.q1.copy( j.b1.rotation() )
					mtx1 = MathTool.composeMatrixArray(this.p1.toArray(), this.q1.toArray())
				}

				if(j.b2){
					this.p2.copy( j.b2.translation() )
					this.q2.copy( j.b2.rotation() )
					mtx2 = MathTool.composeMatrixArray(this.p2.toArray(), this.q2.toArray())
					//MathTool.composeMatrixArray
				}

				this.v1.copy( j.b1.translation() ).add({x:j.p1[0], y:j.p1[1], z:j.p1[2]}).toArray( AR, n  )
				this.v2.copy( j.b2.translation() ).add({x:j.p2[0], y:j.p2[1], z:j.p2[2]}).toArray( AR, n+7  )*/

			}

		}

	}

	// https://rapier.rs/docs/user_guides/javascript/joints

	add ( o = {} ) {

		const v = this.v;

		let name = this.setName( o );

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null

		const b1 = this.byName(o.b1)
		const b2 = this.byName(o.b2)

		if(b1)b1.wakeUp()
		if(b2)b2.wakeUp()

		const mode = o.mode || 'revolute';

		let posA = this.v1.fromArray( o.pos1 || [0,0,0] )
		let posB = this.v2.fromArray( o.pos2 || [0,0,0] )

		let quatA = this.q1.fromArray( o.quat1 || [0,0,0,1] )
		let quatB = this.q2.fromArray( o.quat2 || [0,0,0,1] )

		let axeA = this.p1.fromArray( o.axis1 || [1,0,0] )
		let axeB = this.p2.fromArray( o.axis2 || [1,0,0] )


		/*this.q3.fromAxisAngle([0,1,0], Math.PI*0.5 )

		if(!o.quat1) quatA.fromAxis( axeA );
		if(!o.quat2) quatB.fromAxis( axeB );

		//console.log(quatA.toArray())*/

		/*this.t1.identity();
		this.t2.identity();

		//const useA = o.useA || false;

		if( o.worldAnchor || o.worldAxis ){

			if(b1){ 
				if(b1.type==='body'){ if(!b1.isBone) b1.wakeUp();}
				this.t1.copy( b1.getGlobalPose() )
			}

			if(b2){ 
				if(b2.type==='body'){ if(!b2.isBone) b2.wakeUp();}
				this.t2.copy( b2.getGlobalPose() )
			}

		}

/*

		// world to local position

		if( o.worldAnchor ){

		    posA = this.v1.fromArray( o.worldAnchor ).op_sub( this.t1.p )
		    posB = this.v2.fromArray( o.worldAnchor ).op_sub( this.t2.p )

		    

		    //posA.applyQuaternion( this.t1.q )
		    //posB.applyQuaternion( this.t2.q )

		    posA.applyMatrix3( this.t1 )
		    posB.applyMatrix3( this.t2 )

		}

		//return

		// world to local axis

	    if( o.worldAxis ){

	    	axeA = this.p1.fromArray( o.worldAxis )
	    	axeB = this.p2.fromArray( o.worldAxis )
	   
		    //axeA.applyQuaternion( this.t1.q )
		    //axeB.applyQuaternion( this.t2.q )

		    axeA.applyMatrix3( this.t1 )
		    axeB.applyMatrix3( this.t2 )

		    quatA.fromAxis( axeA )
		    quatB.fromAxis( axeB )



		}

		quatA.multiply( this.q3 )
		quatB.multiply( this.q3 )

		const formA = new PhysX.PxTransform([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).set( posA, quatA );
		const formB = new PhysX.PxTransform([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).set( posB, quatB );*/

		/*if( o.worldAnchor ){

		    posA = this.v1.fromArray( o.worldAnchor ).sub( b1.translation() )
		    posB = this.v2.fromArray( o.worldAnchor ).sub( b2.translation() )

		    

		    //posA.applyQuaternion( this.t1.q )
		    //posB.applyQuaternion( this.t2.q )

		    //posA.applyMatrix3( this.t1 )
		    //posB.applyMatrix3( this.t2 )

		}*/

		let data

		switch ( mode ) {

			case 'spherical': data = RAPIER.JointData.spherical( posA, posB ); break;
			case "hinge": case "revolute": data = RAPIER.JointData.revolute( posA, posB, axeA ); break;
			case "slider":case "prismatic":  data = RAPIER.JointData.prismatic( posA, posB, axeA ); break;
			case "fixe": data = RAPIER.JointData.fixed( posA, quatA, posB, quatB ); break;
			default: data = RAPIER.JointData.spherical( posA, posB ); break;

		}


		

		// add to world
		//let collision = o.collision !== undefined ? o.collision : false;
		let collisionEnabled = o.collision !== undefined ? o.collision : false;

		const j = root.world.createImpulseJoint( data, b1, b2, collisionEnabled )

		j.data = data
		j.name = name
		j.mode = mode
		j.type = this.type

		j.b1 = b1
		j.b2 = b2

		j.visible = false; 


		// apply option
		this.set( o, j );
		//j.setContactsEnabled( collisionEnabled )

		//console.log(jv)
		//jv.contactsEnabled = collisionEnabled

		//j.handle = jv.handle

	    //console.log(j)

		this.addToWorld( j, o.id )
		

	}

	limit ( j, r = [0,0], trans = false ){

		let m = trans ? 1 : torad
		j.limitsEnabled = true;
		j.limits = [ r[0] * m, r[1] * m ]

	}

	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;

		if( o.visible !== undefined ) j.visible = o.visible;


		if( o.lm ) this.limit( j.data, o.lm, j.mode === 'prismatic' || j.mode === 'slider' )


		
		/*
		j.configureMotorVelocity(1.0, 0.5);// targetVel, damping
		j.configureMotorPosition(targetPos, stiffness, damping)
		j.configureMotor(targetPos, targetVel, stiffness, damping)
		j.configureMotorModel(model)
		*/

	/*	let l, i, s, d, k, f, tmp = {};
		let linears = ['x', 'y', 'z']
		let autowake = o.wake !== undefined ? o.wake : true

		if( o.projection !== undefined ){
			//If the joint separates by more than this distance along its locked degrees of freedom, the solver will move the bodies to close the distance.
			//Setting a very small tolerance may result in simulation jitter or other artifacts.
			//Range: [ 0, infinity ) Default: 1e10
			j.setProjectionLinearTolerance( o.projection )
			j.setConstraintFlag( PhysX._emscripten_enum_PxConstraintFlagEnum_ePROJECTION(), true )

		}

		switch ( j.mode ) {

			case 'spherical':
			if( o.lm ){

				l = this.coneLimit( o.lm )
				j.setLimitCone( l )
				PhysX.destroy(l)
				j.setSphericalJointFlag( PhysX._emscripten_enum_PxPrismaticJointFlagEnum_eLIMIT_ENABLED(), true )
				
			} 
			break;

			case 'revolute': case 'hinge':

			//return

			if( o.lm !== undefined ){
				//o.limit = [ upper, lower, stiffness ,damping, restitution, bounceThreshold, contactDist ]
				l = this.angularLimit( o.lm )
				j.setLimit( l )
				PhysX.destroy(l)
				j.setRevoluteJointFlag( PhysX. _emscripten_enum_PxPrismaticJointFlagEnum_eLIMIT_ENABLED(), true )

			}

			if( o.driveFree ) j.setRevoluteJointFlag( PhysX._emscripten_enum_PxRevoluteJointFlagEnum_eDRIVE_FREESPIN(), true )

			//if( o.velocity !== undefined ) o.driveVelocity = o.velocity;// / ( root.substep)// * root.delta );
			if( o.driveVelocity  ){

				if( o.driveVelocity instanceof Array ) o.driveVelocity = o.driveVelocity[0];
				// velocity , autowake 
				//j.setDriveVelocity( o.driveVelocity[0], o.driveVelocity[1] );
				j.setDriveVelocity( o.driveVelocity, autowake );
				j.setRevoluteJointFlag( PhysX._emscripten_enum_PxRevoluteJointFlagEnum_eDRIVE_ENABLED(), true )
			}
			if( o.driveForceLimit !== undefined ) j.setDriveForceLimit( o.driveForceLimit );
			if( o.driveGearRatio !== undefined ) o.gearRatio = o.driveGearRatio;
			if( o.gearRatio !== undefined ) j.setDriveGearRatio( o.gearRatio );

			if(o.motor){	
				j.setDriveVelocity( o.motor[0]*torad, true );
				//j.enableAngularMotor( true, o.motor[0], o.motor[1] )
				//j.setRevoluteJointFlag( PhysX._emscripten_enum_PxRevoluteJointFlagEnum_eDRIVE_ENABLED(), true );
				j.setRevoluteJointFlag( PhysX._emscripten_enum_PxRevoluteJointFlagEnum_eDRIVE_ENABLED(), true )
			}

			break;

			case 'd6':

			//return

			// SPRING DAMPER

			if( o.sd ){
				i = o.sd.length
				while(i--){
					k = o.sd[i]
					tmp[k[0]] = k.slice(1)

				}
			}

			// LIMIT MOTOR

			if( o.lm ){
				i = o.lm.length
				while(i--){
					k = o.lm[i]
					f = k.slice(1)
					if( tmp[ k[0] ] ) f = f.concat( tmp[k[0]] ) // for spring

					if( linears.indexOf(k[0]) !== -1 ){

						let aa = PhysX['_emscripten_enum_PxD6AxisEnum_e'+ k[0].toUpperCase()]()
						j.setMotion( aa, PhysX._emscripten_enum_PxD6MotionEnum_eLIMITED() );
						l = this.linearLimit( f )
					    j.setLinearLimit( aa, l )

					} else {
						if( k[0]==='rx' ){
							 j.setMotion( PhysX._emscripten_enum_PxD6AxisEnum_eTWIST(), PhysX._emscripten_enum_PxD6MotionEnum_eLIMITED() );
							 l = this.angularLimit( f )
							 j.setTwistLimit( l )
						}
						if( k[0]==='ry' ){
							 j.setMotion( PhysX._emscripten_enum_PxD6AxisEnum_eSWING1(), PhysX._emscripten_enum_PxD6MotionEnum_eLIMITED() );
							 l = this.coneLimit( f )
							 j.setSwingLimit( l )
						}
						if( k[0]==='rz' ){
							 j.setMotion( PhysX._emscripten_enum_PxD6AxisEnum_eSWING2(), PhysX._emscripten_enum_PxD6MotionEnum_eLIMITED() );
						}
					}

					PhysX.destroy(l)
				}
			}

			// MOTIONS
			// To unlock and lock degrees of freedom, use the joint's setMotion function
			// D6Axis can be : x, y, z, twist, swing1, swing2, count
			// D6Motion can be : locked, limited, free
			// twist > X axis / swing1 > Y axis / swing2 > Z axis

			if( o.motion ) o.motions = o.motion;
			if( o.motions ){
				i = o.motions.length;
				while( i-- ){
					s = o.motions[i];
					j.setMotion( PhysX['_emscripten_enum_PxD6AxisEnum_e'+ s[0].toUpperCase()](), PhysX['_emscripten_enum_PxD6MotionEnum_e'+ s[1].toUpperCase()]() );
				}
			}

			// DRIVES
			// D6Drive can be  x, y, z, swing, twist, slerp, count
			if( o.drive ) o.drives = o.drive;
			if( o.drives ){
				i = o.drives.length;
				while( i-- ){
					s = o.drives[i];

					// driveStiffness, driveDamping, driveForceLimit, isAcceleration = false
					// Raideur, Amortissement
					// isAcceleration	Whether the drive is an acceleration drive or a force drive
					d = new PhysX.PxD6JointDrive( s[1] || 0, s[2] || 0, s[3], s[4] || false );

					j.setDrive( PhysX['_emscripten_enum_PxD6DriveEnum_e'+ s[0].toUpperCase()](), d );
					//d.delete();

				}
			}

			if( o.drivePosition ){ // not sure
				// The goal is relative to the constraint frame of actor[0]
				j.setDrivePosition( this.t1.fromArray( o.drivePosition.pos || [0,0,0], o.drivePosition.quat || [0,0,0,1] ), autowake );
			}

			// Set the target goal velocity for drive.
			// The velocity is measured in the constraint frame of actor[0

			if( o.driveVelocity ){

				// linear / angular
				j.setDriveVelocity( this.v1.fromArray(o.driveVelocity[0]), this.v2.fromArray(o.driveVelocity[1]), autowake );

			}

			// LIMIT

			if( o.swingLimit !== undefined ){
				l = this.coneLimit( o.swingLimit )
				j.setSwingLimit( l )
			}

			if( o.twistLimit !== undefined ){
				l = this.angularLimit( o.twistLimit )
				j.setTwistLimit( l )
			}
			
			if( o.pyramidSwingLimit !== undefined ){
				l = this.pyramidLimit( o.pyramidSwingLimit )
				j.setPyramidSwingLimit( l )
			}

			// LINEAR LIMIT

			if( o.linearLimits !== undefined ){
				i = o.linearLimits.length;
				while( i-- ){
					s = o.linearLimits[i];
					l = this.linearLimit( s.slice(1) );
					j.setLinearLimit( PhysX.PxD6Axis['e'+ s[0].toUpperCase()], l )
				}
			}

			if( o.distanceLimit !== undefined ){
				l = this.distanceLimit( o.distanceLimit );
				j.setDistanceLimit( l )
			}

			break;
		}*/

	}

}

