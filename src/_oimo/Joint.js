import { Item } from '../core/Item.js';
import { Utils, map, torad, Vec3, Quat, Mat3, Joints } from './root.js';

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'joint';

		this.v = new Vec3();
		this.q = new Quat();
		this.m = new Mat3();

	}

	step ( AR, N ) {

		let i = this.list.length, j, n;
		const v = this.v;
		const q = this.q;
		const m = this.m;

		while( i-- ){

			j = this.list[i];

			n = N + ( i * 16 );

			if(j.visible){

				j.getAnchor1To( v );
				v.toArray( AR, n );

				j.getBasis1To( m )
				q.fromMat3( m );
				q.toArray( AR, n+3 );

				j.getAnchor2To( v );
				v.toArray( AR, n+7 );

				j.getBasis1To( m )
				q.fromMat3( m );
				q.toArray( AR, n+10 );
				
			}

		}

	}

	///

	add ( o = {} ) {

		const v = this.v;

		let name = this.setName( o );

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null

		let b1 = this.byName(o.b1);
		let b2 = this.byName(o.b2);

		let mode = o.mode || 'revolute';

		mode = mode.charAt(0).toUpperCase() + mode.slice(1);

		if( mode === 'D6' ) mode = 'Universal'

		const jc = new Joints[ mode + 'JointConfig' ]();

		jc.rigidBody1 = b1;
		jc.rigidBody2 = b2;

		if( b1 && b2 ){

			if ( o.worldAnchor ) {
				v.fromArray( o.worldAnchor );
				b1.getLocalPointTo( v, jc.localAnchor1 );
			 	b2.getLocalPointTo( v, jc.localAnchor2 );
			}

			 if ( o.worldAxis ) {
			 	v.fromArray( o.worldAxis );
			 	b1.getLocalVectorTo( v, jc.localAxis1 );
			 	b2.getLocalVectorTo( v, jc.localAxis2 );
			 }

		}

		if( o.pos1 ) jc.localAnchor1.fromArray( o.pos1 || [0,0,0] );
		if( o.pos2 ) jc.localAnchor2.fromArray( o.pos2 || [0,0,0] );

		if( jc.localAxis1 && o.axis1 ) jc.localAxis1.fromArray( o.axis1 );
		if( jc.localAxis2 && o.axis2 ) jc.localAxis2.fromArray( o.axis2 );

		/*jc.allowCollision = o.collision !== undefined ? o.collision : false;
		jc.breakForce = o.breakForce !== undefined ? o.breakForce : 0;
		jc.breakTorque = o.breakTorque !== undefined ? o.breakTorque : 0;*/

		switch ( mode ) {

			case 'Ragdoll':

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

			    if (o.twistSd ) this.spring( jc.twistSpringDamper, o.twistSd );
			    if (o.swingSd ) this.spring( jc.swingSpringDamper, o.swingSd );
				if (o.twistLm ) this.limit( jc.twistLimitMotor, o.twistLm );
				
				jc.maxSwingAngle1 = (o.maxSwing1 !== undefined ? o.maxSwing1 : 180) * torad;
				jc.maxSwingAngle2 = (o.maxSwing2 !== undefined ? o.maxSwing2 : 180) * torad;

			break;

		}

		const j = new Joints[ mode + 'Joint' ](jc);
		j.name = name;
		j.type = this.type;
		j.mode = mode;
		j.visible = o.visible !== undefined ? o.visible : true; 


		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j );


	}

	spring ( ref, r = [0,0] ){

		// frequency / dampingRatio
		ref.setSpring( r[0], r[1] );
		if( r[2] !== undefined ) ref.setSymplecticEuler( r[2] ? true : false )

	}

	motor ( ref, r = [0,0], trans = false ){

		let m = trans ? 1 : torad;
		// speed / force or torque
		ref.setMotor( r[0] * m, r[1] );

	}

	limit ( ref, r = [0,0], trans = false ){

		let m = trans ? 1 : torad
		ref.setLimits( r[0] * m, r[1] * m )

	}


	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;

		if( o.collision !== undefined ) j.setAllowCollision( o.collision )
		if( o.breakForce !== undefined ) j.setBreakForce( o.breakForce )
		if( o.breakTorque !== undefined ) j.setBreakTorque( o.breakTorque )

		switch ( j.mode ) {

			case 'Ragdoll':

			    /*if( o.worldTwistAxis ){
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

			    if (o.twistSd ) this.spring( jc.twistSpringDamper, o.twistSd );
			    if (o.swingSd ) this.spring( jc.swingSpringDamper, o.swingSd );
				if (o.twistLm ) this.limit( jc.twistLimitMotor, o.twistLm );
				
				jc.maxSwingAngle1 = (o.maxSwing1 !== undefined ? o.maxSwing1 : 180) * torad;
				jc.maxSwingAngle2 = (o.maxSwing2 !== undefined ? o.maxSwing2 : 180) * torad;*/

			break;
			case 'Universal':

			    if ( o.sd1 ) this.spring( j.getSpringDamper1(), o.sd1 )
			    if ( o.sd2 ) this.spring( j.getSpringDamper2(), o.sd2 )
				if ( o.lm1 ) this.limit( j.getLimitMotor1(), o.lm1 )
				if ( o.lm2 ) this.limit( j.getLimitMotor2(), o.lm2 )

			break;

			case 'Prismatic': case 'Revolute':

				if( o.sd ) this.spring( j.getSpringDamper(), o.sd )
			    if( o.lm ) this.limit( j.getLimitMotor(), o.lm, j.mode === 'Prismatic' )
			    if( o.motor ) this.motor( j.getLimitMotor(), o.motor, j.mode === 'Prismatic' )

			break;

			case 'Cylindrical': 

			    if ( o.rsd ) this.spring( j.getRotationalSpringDamper(), o.rsd );
				if ( o.tsd ) this.spring( j.translationalSpringDamper(),  o.tsd );
				if ( o.rlm ) this.limit( j.getRotationalLimitMotor(), o.rlm );
				if ( o.tlm ) this.limit( j.getTranslationalLimitMotor(), o.tlm, true );

			break;
			case 'Generic':

			break;
			case 'Spherical':
			    if( o.sd ) this.spring( j.getSpringDamper(), o.sd )
			break;

		}



	}

}

