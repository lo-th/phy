import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, map } from './root.js';

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'joint'

	}

	step ( AR, N ) {

		let i = this.list.length, j, n
		const v = this.v
		const q = this.q
		const m = this.m

		while( i-- ){

			j = this.list[i]

			n = N + ( i * Num.joint )

			/*if( j.visible ){

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
				
			}*/

		}

	}

	// Creates a vector normal (perpendicular) to the current Vector3

	getNormalToRef(v) {
        const radius = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        let theta = Math.acos(v[1] / radius);
        const phi = Math.atan2(v[2], v[0]);
        //makes angle 90 degs to current vector
        if (theta > Math.PI * 0.5)  theta -= Math.PI * 0.5;
        else  theta += Math.PI * 0.5;
        
        //Calculates resutant normal vector from spherical coordinate of perpendicular vector
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);
        return [x, y, z];
    }

	///

	add ( o = {} ) {

		//const v = this.v;

		let name = this.setName( o )

		const j = havok.HP_Constraint_Create()[1];

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null
		let b1 = this.byName(o.b1)
		let b2 = this.byName(o.b2)

		//console.log(b1.hpBodyId, b2.hpBodyId)

		if(b1!==null) havok.HP_Constraint_SetParentBody(j, b1);
        if(b2!==null) havok.HP_Constraint_SetChildBody(j, b2);

        // anchors
        const pivotA = o.pos1 ? o.pos1 : [0,0,0];
        const axisA = o.axis1 ? o.axis1 : [1,0,0];
        const perpAxisA = this.getNormalToRef(axisA);
        havok.HP_Constraint_SetAnchorInParent(j, pivotA, axisA, perpAxisA);
        const pivotB = o.pos2 ? o.pos2 : [0,0,0];
        const axisB = o.axis2 ? o.axis2 : [1,0,0];
        const perpAxisB = this.getNormalToRef(axisB);
        havok.HP_Constraint_SetAnchorInChild(j, pivotB, axisB, perpAxisB);


		let mode = o.mode || 'revolute';

		switch ( mode ) {
			case 'fixe':
			havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_X, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Z, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_X, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_Z, havok.ConstraintAxisLimitMode.LOCKED)
			break;
			case 'hinge': case "revolute":
			havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_X, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Z, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_Z, havok.ConstraintAxisLimitMode.LOCKED);
            break;
            case 'prismatic':
			havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Z, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_X, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_Z, havok.ConstraintAxisLimitMode.LOCKED);
            break;
            case 'slider':
			havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Z, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.ANGULAR_Z, havok.ConstraintAxisLimitMode.LOCKED);
            break;
            case 'spherical':
			havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_X, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Y, havok.ConstraintAxisLimitMode.LOCKED);
            havok.HP_Constraint_SetAxisMode(j, havok.ConstraintAxis.LINEAR_Z, havok.ConstraintAxisLimitMode.LOCKED);
            break;
            case 'distance':
            const distance = o.maxDistance || 0;
            const dist3d = havok.ConstraintAxis.LINEAR_DISTANCE;
            havok.HP_Constraint_SetAxisMode(j, dist3d, havok.ConstraintAxisLimitMode.LIMITED);
            havok.HP_Constraint_SetAxisMinLimit(j, dist3d, distance);
            havok.HP_Constraint_SetAxisMaxLimit(j, dist3d, distance);
            break;
            case "dof": case "d6": case 'ragdoll':
            /*const sixdofData: Physics6DoFConstraint = <Physics6DoFConstraint>constraint;
            for (const l of sixdofData.limits) {
                const axId = this._constraintAxisToNative(l.axis);
                if ((l.minLimit ?? -1) == 0 && (l.maxLimit ?? -1) == 0) {
                    havok.HP_Constraint_SetAxisMode(j, axId, havok.ConstraintAxisLimitMode.LOCKED);
                } else {
                    if (l.minLimit != undefined) {
                        havok.HP_Constraint_SetAxisMode(j, axId, havok.ConstraintAxisLimitMode.LIMITED);
                        havok.HP_Constraint_SetAxisMinLimit(j, axId, l.minLimit);
                    }

                    if (l.maxLimit != undefined) {
                        havok.HP_Constraint_SetAxisMode(j, axId, havok.ConstraintAxisLimitMode.LIMITED);
                        havok.HP_Constraint_SetAxisMaxLimit(j, axId, l.maxLimit);
                    }
                }
            }*/
            break;
		}



		/*if( mode === 'fixe' ){ 
			mode = 'revolute';
			o.sd = [0,0]
			o.lm = [0,0]
		}


		mode = mode.charAt(0).toUpperCase() + mode.slice(1)

		if( mode === 'D6' ) mode = 'Generic'

		const jc = new Joints[ mode + 'JointConfig' ]()

		jc.rigidBody1 = b1
		jc.rigidBody2 = b2

		if( b1 && b2 ){

			if ( o.worldAnchor ) {
				v.fromArray( o.worldAnchor );
				b1.getLocalPointTo( v, jc.localAnchor1 )
			 	b2.getLocalPointTo( v, jc.localAnchor2 )
			}

			 if ( o.worldAxis ) {
			 	v.fromArray( o.worldAxis );

			 	if( jc.localAxis1 && jc.localAxis2 ){
			 		b1.getLocalVectorTo( v, jc.localAxis1 )
			 	    b2.getLocalVectorTo( v, jc.localAxis2 )
			 	}

			 	if( jc.localBasis1 && jc.localBasis2 ){ // generic joint

			 		// ??
			 		//b1.getLocalVectorTo( v, jc.localAxis1 );
			 	    //b2.getLocalVectorTo( v, jc.localAxis2 );
			 	}
			 	
			 }

		}

		if( o.pos1 ) jc.localAnchor1.fromArray( o.pos1 || [0,0,0] )
		if( o.pos2 ) jc.localAnchor2.fromArray( o.pos2 || [0,0,0] )

		if( jc.localAxis1 && o.axis1 ) jc.localAxis1.fromArray( o.axis1 )
		if( jc.localAxis2 && o.axis2 ) jc.localAxis2.fromArray( o.axis2 )

		//if( jc.localBasis1 && o.axis1 ) jc.localBasis1.fromQuat( o.axis1 );
		//if( jc.localBasis2 && o.axis2 ) jc.localBasis2.fromQuat( o.axis2 );

		//console.log(jc.localAxis2)

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

			    /*if (o.twistSd ) this.spring( jc.twistSpringDamper, o.twistSd );
			    if (o.swingSd ) this.spring( jc.swingSpringDamper, o.swingSd );
				if (o.twistLm ) this.limit( jc.twistLimitMotor, o.twistLm );*/
				
				//jc.maxSwingAngle1 = (o.maxSwing1 !== undefined ? o.maxSwing1 : 180) * torad;
				//jc.maxSwingAngle2 = (o.maxSwing2 !== undefined ? o.maxSwing2 : 180) * torad;

		/*	break;
			case 'Generic':
			
			break;

		}*/

		let collisionEnabled = o.collision !== undefined ? o.collision : false;

		havok.HP_Constraint_SetCollisionsEnabled(j, collisionEnabled);
        havok.HP_Constraint_SetEnabled(j, true);

		//const j = new Joints[ mode + 'Joint' ](jc);
		j.name = name;
		j.type = this.type;
		j.mode = mode;
		j.visible = o.visible !== undefined ? o.visible : true; 

		//console.log(j)

		//if( j.mode ==='Generic' ) console.log( j.getAxisY() )


		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j );


	}

	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;



		if( o.enable!== undefined ) havok.HP_Constraint_SetEnabled(j, o.enable);

		//havok.HP_Constraint_SetAxisFriction( j, this._constraintAxisToNative(axis), friction);




	}


}

