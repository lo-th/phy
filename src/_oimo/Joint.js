import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { torad } from '../core/MathTool.js';

import { root, Utils, map, Vec3, Quat, Mat3, Joints } from './root.js';

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'joint'

		this.v = new Vec3()
		this.q = new Quat()
		this.m = new Mat3()

		this.fullList = [ 'x', 'y', 'z', 'rx', 'ry', 'rz' ];

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, j, n
		const v = this.v
		const q = this.q
		const m = this.m

		while( i-- ){

			j = this.list[i]

			n = N + ( i * Num.joint )

			if(  Num.joint===16 ){

				if( j.visible ){

					j.getAnchor1To( v )
					v.toArray( AR, n )

					j.getBasis1To( m )
					q.fromMat3( m )
					q.toArray( AR, n+3 )

					j.getAnchor2To( v )
					v.toArray( AR, n+7 )

					j.getBasis2To( m )
					q.fromMat3( m )
					q.toArray( AR, n+10 )

				}
				
			}

		}

	}

	///

	add ( o = {} ) {

		const v = this.v;

		let name = this.setName( o )

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null

		let b1 = this.byName(o.b1)
		let b2 = this.byName(o.b2)


		let mode = o.mode || 'revolute';

		if( mode === 'fixe' ){ 
			mode = 'generic';
			//o.sd = [0,0]
			o.lm = [0,0]
		}

		if( mode === 'd6' ) mode = 'generic'
		if( mode === 'hinge' ) mode = 'revolute'
		if( mode === 'slider' ) mode = 'cylindrical'

		let modeName = mode.charAt(0).toUpperCase() + mode.slice(1)

	    if( modeName === 'Distance' ) modeName = 'Cylindrical'

		const jc = new Joints[ modeName + 'JointConfig' ]()

		if( b1 ) jc.rigidBody1 = b1
		if( b2 ) jc.rigidBody2 = b2

		if( o.pos1 ) jc.localAnchor1.fromArray( o.pos1 || [0,0,0] )
		if( o.pos2 ) jc.localAnchor2.fromArray( o.pos2 || [0,0,0] )

		if( jc.localAxis1 && o.axis1 ) jc.localAxis1.fromArray( o.axis1 )
		if( jc.localAxis2 && o.axis2 ) jc.localAxis2.fromArray( o.axis2 )

		if( jc.localBasis1 && o.quat1 ) jc.localBasis1.fromQuat( this.q.fromArray(o.quat1) )
		if( jc.localBasis2 && o.quat2 ) jc.localBasis2.fromQuat( this.q.fromArray(o.quat2) )

		//if( jc.localBasis1 && o.quat1 ) jc.localBasis1.fromQuat( o.quat1 );
		//if( jc.localBasis2 && o.quat2 ) jc.localBasis2.fromQuat( o.quat2 );

		

		//	console.log( o.axis1, o.axis2 )

		/*if( b1 && b2 ){

			if ( o.worldAnchor ) {
				v.fromArray( o.worldAnchor );
				b1.getLocalPointTo( v, jc.localAnchor1 )
			 	b2.getLocalPointTo( v, jc.localAnchor2 )

			 	//console.log('oimo pos', jc.localAnchor1, jc.localAnchor2)
			}

			if ( o.worldAxis ) {
			 	v.fromArray( o.worldAxis );

			 	if( jc.localAxis1 ) b1.getLocalVectorTo( v, jc.localAxis1 ) 
			 	if( jc.localAxis2 ) b2.getLocalVectorTo( v, jc.localAxis2 )

			 	if( jc.localBasis1 && jc.localBasis2 ){ // generic joint
			 		console.log('oimo axe',jc.localBasis1)

			 		// ??
			 		//b1.getLocalVectorTo( v, jc.localAxis1 );
			 	    //b2.getLocalVectorTo( v, jc.localAxis2 );
			 	}

			 	
			 	
			}

			if ( o.worldAxis2 ) {
				v.fromArray( o.worldAxis2 );
				if( jc.localAxis2 ) b2.getLocalVectorTo( v, jc.localAxis2 )
			}

			

		}*/

		

		//console.log(jc.localAxis1, o.axis1)

		switch ( mode ) {

			case 'ragdoll':

			    if( o.worldTwistAxis ){
			    	v.fromArray( o.worldTwistAxis );
			    	b1.getLocalVectorTo( v, jc.localTwistAxis1);
			    	b2.getLocalVectorTo( v, jc.localTwistAxis2);
			    }
			    if( o.worldSwingAxis ){
			    	v.fromArray( o.worldSwingAxis );
			    	b1.getLocalVectorTo( v, jc.localSwingAxis1);
			    }


			    if( o.axis1 ) jc.localTwistAxis1.fromArray( o.axis1 || [1,0,0] );
			    if( o.axis2 ) jc.localTwistAxis2.fromArray( o.axis2 || [1,0,0] );
			    if( o.axis3 ) jc.localSwingAxis1.fromArray( o.axis3 || [0,1,0] );

			    /*if (o.twistSd ) this.spring( jc.twistSpringDamper, o.twistSd );
			    if (o.swingSd ) this.spring( jc.swingSpringDamper, o.swingSd );
				if (o.twistLm ) this.limit( jc.twistLimitMotor, o.twistLm );*/
				
				//jc.maxSwingAngle1 = (o.maxSwing1 !== undefined ? o.maxSwing1 : 180) * torad;
				//jc.maxSwingAngle2 = (o.maxSwing2 !== undefined ? o.maxSwing2 : 180) * torad;

			break;
			case 'spherical':

			    //console.log(jc)
			    //jc.springDamper.frequency = 4.0;
				//jc.springDamper.dampingRatio = 1;


			break;
			case 'generic':
			
			break;

		}

		const j = new Joints[ modeName + 'Joint' ](jc);
		j.name = name;
		j.type = this.type;
		j.mode = mode;
		j.visible = false; 

		//if( j.mode ==='Generic' ) console.log( j.getAxisY() )


		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j );


	}

	set ( o = {}, j = null ) {

		let i, k, axe, translate, rotate

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;

		if( o.visible !== undefined ) j.visible = o.visible;

		if( o.collision !== undefined ) j.setAllowCollision( o.collision )
		if( o.breakForce !== undefined ) j.setBreakForce( o.breakForce )
		if( o.breakTorque !== undefined ) j.setBreakTorque( o.breakTorque )

		switch ( j.mode ) {

			case 'ragdoll':

			    /*if( o.worldTwistAxis ){
			    	v.fromArray( o.worldTwistAxis );
			    	j._b1.getLocalVectorTo( v, j._localBasisX1);
			    	j._b2.getLocalVectorTo( v, j._localBasisX2);
			    }
			    if( o.worldSwingAxis ){
			    	v.fromArray( o.worldSwingAxis );
			    	j._b1.getLocalVectorTo( v, j._localBasisY1);
			    }


			    if( o.axis1 ) j.getLocalAxis1To( v.fromArray( o.axis1 || [1,0,0] ) );
			    if( o.axis2 ) j.getLocalAxis2To( v.fromArray( o.axis2 || [1,0,0] ) );
			    //if( o.axis3 ) j._localBasisY1.fromArray( o.axis3 || [0,1,0] ); // missing in oimoPhysics
			    */

			    if ( o.twistSd ) this.spring( j.getTwistSpringDamper(), o.twistSd )
			    if ( o.swingSd ) this.spring( j.getSwingSpringDamper(), o.swingSd )
				if ( o.twistLm ) this.limit( j.getTwistLimitMotor(), o.twistLm )
				if ( o.twistMotor ) this.motor( j.getTwistLimitMotor(), o.twistMotor )

				j._maxSwingAngle1 = (o.maxSwing1 !== undefined ? o.maxSwing1 : 180) * torad
				j._maxSwingAngle2 = (o.maxSwing2 !== undefined ? o.maxSwing2 : 180) * torad


			break;
			
			case 'prismatic': case 'revolute': // one degree of freedom

			    if( o.spring ) o.sd = o.spring
			    if( o.limit ) o.lm = o.limit

				if( o.sd ) this.spring( j.getSpringDamper(), o.sd )
			    if( o.lm ) this.limit( j.getLimitMotor(), o.lm, j.mode === 'prismatic' )
			    if( o.motor ) this.motor( j.getLimitMotor(), o.motor, j.mode === 'prismatic' )

			break;

			case 'cylindrical': case 'distance':// two degrees of freedom

			    if ( o.sdr ) this.spring( j.getRotationalSpringDamper(), o.sdr )
			    if ( o.lmr ) this.limit( j.getRotationalLimitMotor(), o.lmr )

				if ( o.sd ) this.spring( j.getTranslationalSpringDamper(), o.sd )	
				if ( o.lm ) this.limit( j.getTranslationalLimitMotor(), o.lm, true )

				if ( o.rmotor ) this.motor( j.getRotationalLimitMotor(), o.rmotor )
				if ( o.tmotor ) this.motor( j.getTranslationalLimitMotor(), o.tmotor, true )

			break;

			case 'universal': // two degrees of freedom

			    if ( o.sd1 ) this.spring( j.getSpringDamper1(), o.sd1 )
			    if ( o.sd2 ) this.spring( j.getSpringDamper2(), o.sd2 )
				if ( o.lm1 ) this.limit( j.getLimitMotor1(), o.lm1 )
				if ( o.lm2 ) this.limit( j.getLimitMotor2(), o.lm2 )
				if ( o.motor1 ) this.motor( j.getLimitMotor1(), o.motor1 )
				if ( o.motor2 ) this.motor( j.getLimitMotor2(), o.motor2 )

			break;

			case 'generic': // six degrees of freedom



			/*if( o.setAxis ){
				i = o.axis.length
				while(i--){
					k = o.axis[i]
					if( k[0]==='rx' ) j._axisX.fromArray( [ k[1], k[2], k[3] ] )
					if( k[0]==='ry' ) j._axisY.fromArray( [ k[1], k[2], k[3] ] )
					if( k[0]==='rz' ) j._axisZ.fromArray( [ k[1], k[2], k[3] ] )
				}
			}*/

			// MOTOR

			if( o.motor ){

				rotate = j.getRotationalLimitMotors()
				translate =  j.getTranslationalLimitMotors()

				if( ! o.motor[0] instanceof Array ) o.motor = this.fillAll( o.motor )

				i = o.motor.length
				while(i--){
					k = o.motor[i]
					
					if( k[0]==='rx' ) this.motor( rotate[0], [ k[1], k[2] ] )
					if( k[0]==='ry' ) this.motor( rotate[1], [ k[1], k[2] ] )
					if( k[0]==='rz' ) this.motor( rotate[2], [ k[1], k[2] ] )
					if( k[0]==='x' ) this.motor( translate[0], [ k[1], k[2] ], true )
					if( k[0]==='y' ) this.motor( translate[1], [ k[1], k[2] ], true )
					if( k[0]==='z' ) this.motor( translate[2], [ k[1], k[2] ], true )
				}
			}

			// LIMIT MOTOR

			if( o.lm ){

				rotate = j.getRotationalLimitMotors()
				translate =  j.getTranslationalLimitMotors()

				if( ! o.lm[0] instanceof Array ) o.lm = this.fillAll( o.lm )
				
				i = o.lm.length
				while(i--){
					k = o.lm[i];
					if( k[0]==='rx' ) this.limit( rotate[0], [ k[1], k[2] ] )
					if( k[0]==='ry' ) this.limit( rotate[1], [ k[1], k[2] ] )
					if( k[0]==='rz' ) this.limit( rotate[2], [ k[1], k[2] ] )
					if( k[0]==='x' ) this.limit( translate[0], [ k[1], k[2] ], true )
					if( k[0]==='y' ) this.limit( translate[1], [ k[1], k[2] ], true )
					if( k[0]==='z' ) this.limit( translate[2], [ k[1], k[2] ], true )
				}
			}

			// SPRING DAMPER

			if( o.sd ){ // spring damlper

				if( ! o.sd[0] instanceof Array ) o.sd = this.fillAll( o.sd )

				i = o.sd.length
				while(i--){
					k = o.sd[i]
					if( k[0]==='rx' ) this.spring( j._rotSds[0], [ k[1], k[2] ] )
					if( k[0]==='ry' ) this.spring( j._rotSds[1], [ k[1], k[2] ] )
					if( k[0]==='rz' ) this.spring( j._rotSds[2], [ k[1], k[2] ] )
					if( k[0]==='x' ) this.spring( j._translSds[0], [ k[1], k[2] ], true )
					if( k[0]==='y' ) this.spring( j._translSds[1], [ k[1], k[2] ], true )
					if( k[0]==='z' ) this.spring( j._translSds[2], [ k[1], k[2] ], true )
				}
			}

			break;
			case 'spherical':
			    if( o.sd ) this.spring( j.getSpringDamper(), o.sd )
			break;

		}


	}

	fillAll ( ref ){

		let nlm = [];
		i = this.fullList.length;
		while(i--){
			nlm.push([ this.fullList[i], ...ref ])
		}

		return nlm

	}

	spring ( ref, r = [0,0] ){

		//console.log( r )

		// frequency / dampingRatio
		ref.setSpring( r[0], r[1] );
		if( r[2] !== undefined ) ref.setSymplecticEuler( r[2] ? true : false )

	}

	motor ( ref, r = [0,0], trans = false ){

	    // speed / force or torque
	    // meters per second / newtons > 0 
		let m = trans ? 1 : torad;
		ref.setMotor( r[0] * m ,  r[1] );

	}

	limit ( ref, r = [0,0], trans = false ){

		let m = trans ? 1 : torad
		ref.setLimits( r[0] * m, r[1] * m )

	}

}

