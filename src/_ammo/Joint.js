import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, torad } from '../core/MathTool.js';

import { Utils, root } from './root.js';

// AMMO JOINT

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'joint'

		this.t = new Ammo.btTransform()

		this.t1 = new Ammo.btTransform()
		this.t2 = new Ammo.btTransform()

		this.v1 = new Ammo.btVector3()
		this.v2 = new Ammo.btVector3()

		this.p1 = new Ammo.btVector3()
		this.p2 = new Ammo.btVector3()

		this.q1 = new Ammo.btQuaternion()
		this.q2 = new Ammo.btQuaternion()

	}

	step () {

		if( Num.joint!==16 ) return

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, j, n;

		while( i-- ){

			j = this.list[i];

			n = N + ( i * Num.joint )
			if( j.visible ){
				this.t.copy( j.B1.getWorldTransform() ).op_mul( j.formA ).toArray( AR, n  )
				this.t.copy( j.B2.getWorldTransform() ).op_mul( j.formB ).toArray( AR, n + 7 )
			}

		}

	}

	// https://pybullet.org/Bullet/phpBB3/viewtopic.php?t=8881
	// https://github.com/bulletphysics/bullet3/tree/master/src/BulletDynamics/ConstraintSolver

	// https://github.com/bulletphysics/bullet3/blob/master/examples/Constraints/ConstraintDemo.cpp

	///

	add ( o = {} ) {

		const v = this.v;

		let name = this.setName( o )

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null

		let b1 = this.byName(o.b1)
		let b2 = this.byName(o.b2)

		if( b1 && b1.type === 'vehicle' ) b1 = b1.body
		if( b2 && b2.type === 'vehicle' ) b2 = b2.body

		let posA = this.v1.fromArray( o.pos1 || [0,0,0])
		let posB = this.v2.fromArray( o.pos2 || [0,0,0])

		if(o.quatX){ // hinge correction ?
			o.quat1 = MathTool.quatMultiply(o.quat1, o.quatX);
			o.quat2 = MathTool.quatMultiply(o.quat2, o.quatX);
		}

		let quatA = this.q1.fromArray( o.quat1 || [0,0,0,1])
		let quatB = this.q2.fromArray( o.quat2 || [0,0,0,1])

		let axisA = this.p1.fromArray( o.axis1 || [0,0,1])
		let axisB = this.p2.fromArray( o.axis2 || [0,0,1])

		if(!o.quat1) quatA.fromAxis( axisA ).normalize();
		if(!o.quat2) quatB.fromAxis( axisB ).normalize();

		//console.log(quatA.toArray())

		//this.t1.identity()
		//this.t2.identity()

		const useA = o.useA !== undefined ? o.useA : false;

		/*if( o.worldAnchor || o.worldAxis ){

			if(b1){ 
				b1.activate()
				b1.getMotionState().getWorldTransform( this.t1 )
			}

			if(b2){ 
				b2.activate()
				b2.getMotionState().getWorldTransform( this.t2 )
			}

		}

		// world to local position

		if( o.worldAnchor ){

		    posA = this.v1.fromArray( o.worldAnchor ).op_sub( this.t1.getOrigin() )
		    posB = this.v2.fromArray( o.worldAnchor ).op_sub( this.t2.getOrigin() )

		    posA.applyMatrix3( this.t1.getBasis() )
		    posB.applyMatrix3( this.t2.getBasis() )

		}

		// world to local axis
*/
	    /*if( o.worldAxis ){

	    	axeA = this.p1.fromArray( o.worldAxis )
	    	axeB = this.p2.fromArray( o.worldAxis )
	   
		    axeA.applyMatrix3( this.t1.getBasis() )
		    axeB.applyMatrix3( this.t2.getBasis() )

		    quatA.fromAxis( axeA )
		    quatB.fromAxis( axeB )

		}*/

		const formA = new Ammo.btTransform().set( posA, quatA )
		const formB = new Ammo.btTransform().set( posB, quatB )

		let j

		let mode = o.mode || 'revolute';
		if( mode==='d6' || mode==='universal' || mode==='dof') mode = 'generic'
		if( mode==='slider' || mode==='cylindrical') mode = 'prismatic'
		if( mode==='joint_p2p') mode='spherical'
		if( mode==='conetwist') mode='ragdoll'


		switch ( mode ) {

			case 'spherical':
				j = new Ammo.btPoint2PointConstraint( b1, b2, posA, posB );
				if ( o.strength ) j.get_m_setting().set_m_tau( o.strength );
				if ( o.damping ) j.get_m_setting().set_m_damping( o.damping );
				if ( o.impulse ) j.get_m_setting().set_m_impulseClamp( o.impulse );
			break;
			case 'distance':
			    if(o.lm){
			    	posA.setValue( posA.x()+o.lm[0] , posA.y(), posA.z() );
			    	posB.setValue( posB.x()+o.lm[1] , posB.y(), posB.z() );
			    }
			    j = new Ammo.btPoint2PointConstraint( b1, b2, posA, posB );
				//j = new Ammo.btDistanceConstraint( b1, b2, posA, posB );
				//if ( o.strength ) j.get_m_setting().set_m_tau( o.strength );
				//if ( o.damping ) j.get_m_setting().set_m_damping( o.damping );
				//if ( o.impulse ) j.get_m_setting().set_m_impulseClamp( o.impulse );
			break;
			case "hinge2": 
			    j = new Ammo.btHinge2Constraint( b1, b2, posA, axisA, axisB );
			    //j.setAxis( this.v1.fromArray( [0,0,1]))
			break;
			case "hinge": case "revolute": 
			    j = new Ammo.btHingeConstraint( b1, b2, formA, formB, useA );
			    //console.log(j)
			    //j.setAxis( axisA )
			 break;
			case "prismatic": j = new Ammo.btSliderConstraint( b1, b2, formA, formB, useA );  break;
			case 'ragdoll': j = new Ammo.btConeTwistConstraint( b1, b2, formA, formB ); break;
			//case "dof": j = new Ammo.btGeneric6DofConstraint( b1, b2, formA, formB, useA ); break;
			case "generic": 
			j = new Ammo.btGeneric6DofSpringConstraint( b1, b2, formA, formB, useA );
			// by default i lock all angle
			//j.setAngularLowerLimit( this.v1.fromArray([0,0,0]))
		    //j.setAngularUpperLimit( this.v1.fromArray([0,0,0]))
			 break;
			case "fixe": j = new Ammo.btFixedConstraint( b1, b2, formA, formB ); break;
            case "gear": j = new Ammo.btGearConstraint( b1, b2, axisA, axisB, o.ratio || 1); break;
            //case "universal": j = new Ammo.btUniversalConstraint( b1, b2, formA, axeA, axeB); break;// missing
		}

		
		j.name = name
		j.mode = mode
		j.type = this.type

		//console.log(j)

		/**/
		j.B1 = b1
		j.B2 = b2
		

		j.formA = formA
		j.formB = formB
		j.visible = false;
		j.collision = o.collision || false; 

		// apply option
		this.set( o, j )

		// add to world
		this.addToWorld( j, o.id )


	}

	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;

		if( o.visible !== undefined ) j.visible = o.visible;

		if ( o.breaking && j.setBreakingImpulseThreshold ) j.setBreakingImpulseThreshold( o.breaking );
		if ( o.iteration && j.setOverrideNumSolverIterations ) j.setOverrideNumSolverIterations( o.iteration ) // -1

		let i, k, m, n
	    const idx = [ 'x', 'y', 'z', 'rx', 'ry', 'rz' ]


		//if(j.setUseFrameOffset) j.setUseFrameOffset(true)

		switch( j.mode ){

			case "prismatic" : 

			if( o.lm ){
				j.setLowerLinLimit(o.lm[0])
				j.setUpperLinLimit(o.lm[1])
			}
			if( o.lmr ){ // cylindrical / slider 
				j.setLowerAngLimit(o.lmr[0] * torad )
				j.setUpperAngLimit(o.lmr[1] * torad )
			}

			if(o.motor){
				j.setTargetLinMotorVelocity(o.motor[0])
				j.setMaxLinMotorForce(o.motor[1])
			}

			if(o.amotor){
				j.setTargetAngMotorVelocity(o.amotor[0]*torad)
				j.setMaxAngMotorForce(o.amotor[1])
			}
				
			break;

			case "hinge": case "revolute": 

			//console.log(j)

			// low / high / _softness / _biasFactor / _relaxationFactor
			if( o.lm ) j.setLimit( o.lm[0]*torad, o.lm[1]*torad, o.lm[2] || 0.9, o.lm[3] || 0.3, o.lm[4] || 1.0 )
			if( o.motor ) j.enableAngularMotor( true, o.motor[0]*torad, o.motor[1] )
			
			break;

			case "distance" :
			//console.log(j)
				/*if(o.lm){
				    j.setAngularLowerLimit( this.v1.fromArray([-Math.PI, -Math.PI, -Math.PI]) )
				    j.setAngularUpperLimit( this.v1.fromArray([Math.PI, Math.PI, Math.PI]) )

				    j.setLinearLowerLimit( this.v1.fromArray([o.lm[0], 0, 0]) )
				    j.setLinearUpperLimit( this.v1.fromArray([o.lm[1], 0, 0]) )
				}*/
			break;


			case "generic" :


			// https://pybullet.org/Bullet/BulletFull/classbtGeneric6DofSpring2Constraint.html#a38a394ba85aa31aa53ff4236ac22cd1c	

			// MOTOR
			// translation motor not exist in ammo !!

			if( o.motor ){
				//console.log( j)
				i = o.motor.length
				let trans = false
				while(i--){
					k = o.motor[i]

					if( k[0]==='rx' ) m = j.getRotationalLimitMotor(0)
					else if( k[0]==='ry' ) m = j.getRotationalLimitMotor(1)
					else if( k[0]==='rz' ) m = j.getRotationalLimitMotor(2)
					else {
						m = getTranslationalLimitMotor()
						trans = true
					}
					//console.log(m)

					//m.m_enableMotor = k[1] ? true : false; 
					//m.m_targetVelocity = k[1] /// root.substep;// def 0 
					//m.m_maxMotorForce = k[2] /// root.substep;
					if(m){

						if(!trans){
							m.set_m_enableMotor( true )//k[1] !== 0 )
							m.set_m_targetVelocity( -k[1]*torad )// is reverse why ??
							m.set_m_maxMotorForce(k[2])// def 6
							//m.set_m_maxLimitForce(k[2])
						} else {
							//m_lowerLimit         .setValue(0.f , 0.f , 0.f );
							//m_upperLimit         .setValue(0.f , 0.f , 0.f );
							//m_bounce             .setValue(0.f , 0.f , 0.f );
						}
						
					}
					

				}
			}

	        // LIMIT MOTOR

			if( o.lm ){

				m = [ [0,0,0], [0,0,0], [0,0,0], [0,0,0] ]
				
				i = o.lm.length
				while(i--){
					k = o.lm[i]
					if( k[0]==='rx' ) { m[0][0] = -k[2] * torad; m[1][0] = -k[1] * torad; }// X -PI PI
					if( k[0]==='ry' ) { m[0][1] = -k[2] * torad; m[1][1] = -k[1] * torad; }// Y -PI/2 PI/2
					if( k[0]==='rz' ) { m[0][2] = -k[2] * torad; m[1][2] = -k[1] * torad; }// Z -PI PI
					//if( k[0]==='rx' ) { m[0][0] = k[1] * torad; m[1][0] = k[2] * torad; }// X -PI PI
					//if( k[0]==='ry' ) { m[0][1] = k[1] * torad; m[1][1] = k[2] * torad; }// Y -PI/2 PI/2
					//if( k[0]==='rz' ) { m[0][2] = k[1] * torad; m[1][2] = k[2] * torad; }// Z -PI PI
					if( k[0]==='x' )  { m[2][0] = k[1]; m[3][0] = k[2]; }
					if( k[0]==='y' )  { m[2][1] = k[1]; m[3][1] = k[2]; }
					if( k[0]==='z' )  { m[2][2] = k[1]; m[3][2] = k[2]; }

					if( k.length>3) {
						
						n = idx.indexOf( k[0] )
						j.enableSpring( n,  k[3] !== 0 )
						//j.setStiffness( n, k[3] || 0 )
						//j.setDamping( n, k[4] || 0)

						j.setStiffness( n, 1/k[3] || 0 )
						j.setDamping( n, 1/k[4] || 0)
						//j.setEquilibriumPoint(n,0)
						//j.setFrames(n,c)
						
					}
				}

			/*	 for ( int i = 0; i < 3; ++i )
			   {
			      pGen6DOFSpring->enableSpring( i, true );
			      pGen6DOFSpring->setStiffness( i, 1 );
			      pGen6DOFSpring->setStiffness( i + 3, 1 );
			      pGen6DOFSpring->setDamping( i, btScalar( 0.99 ) );
			      pGen6DOFSpring->setDamping( i + 3, btScalar( 0.99 ) );
			      pGen6DOFSpring->setParam( BT_CONSTRAINT_STOP_CFM, btScalar( (1.0E-5) ), i );
			      pGen6DOFSpring->setParam( BT_CONSTRAINT_STOP_CFM, btScalar( ( 1.0E-5 ) ), i + 3 );
			      pGen6DOFSpring->setParam( BT_CONSTRAINT_CFM, btScalar( ( 1.0E-5 ) ), i );
			      pGen6DOFSpring->setParam( BT_CONSTRAINT_CFM, btScalar( ( 1.0E-5 ) ), i+3 );
			   }
			   pGen6DOFSpring->setEquilibriumPoint( );

			*/	

				//console.log(j.name, m)

				// setting the lower limit above the upper one.

			    j.setAngularLowerLimit( this.v1.fromArray(m[0]) )
			    j.setAngularUpperLimit( this.v1.fromArray(m[1]) )

			    j.setLinearLowerLimit( this.v1.fromArray(m[2]) )
			    j.setLinearUpperLimit( this.v1.fromArray(m[3]) )


			    //console.log(j)

			}

			//j.setEnabled(b)
			///j.setBreakingImpulseThreshold(b)

			// SPRING DAMPER

			/*if( o.sd ){

				i = o.sd.length

				while(i--){


					k = o.sd[i]
					n = idx.indexOf( k[0] )
					//console.log(j)
					
					j.setStiffness( n, k[1] || 0 ) // raideur
					j.setDamping( n, k[2] ) // amortissement //1
					j.enableSpring( n, true )
					if( k[3] ) j.setEquilibriumPoint(n) // lock the spring ?
						//j.set_m_bounce( )//0
				}

			}*/


			break;

		}

	}

}

