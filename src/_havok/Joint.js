import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, map, torad } from './root.js';

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'joint'

		this.LimitMode = {
			FREE: havok.ConstraintAxisLimitMode.FREE,
			LOCKED: havok.ConstraintAxisLimitMode.LOCKED,
			LIMITED: havok.ConstraintAxisLimitMode.LIMITED,
		}

		this.ConstraintAxis = {
			LINEAR_X: havok.ConstraintAxis.LINEAR_X,
			LINEAR_Y: havok.ConstraintAxis.LINEAR_Y,
			LINEAR_Z: havok.ConstraintAxis.LINEAR_Z,
			ANGULAR_X: havok.ConstraintAxis.ANGULAR_X,
			ANGULAR_Y: havok.ConstraintAxis.ANGULAR_Y,
			ANGULAR_Z: havok.ConstraintAxis.ANGULAR_Z,
			LINEAR_DISTANCE: havok.ConstraintAxis.LINEAR_DISTANCE,
		}

		this.MotorType = {
			POSITION: havok.ConstraintMotorType.POSITION,
			VELOCITY: havok.ConstraintMotorType.VELOCITY,
			NONE: havok.ConstraintMotorType.NONE,
		}

		this.angulars = ['ANGULAR_X', 'ANGULAR_Y', 'ANGULAR_Z']

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

		const CA = this.ConstraintAxis;
		const LM = this.LimitMode

		switch ( mode ) {
			case 'fixe':
			havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_X, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Z, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_X, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Z, LM.LOCKED)
			break;
			case 'hinge': case "revolute":
			havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_X, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Z, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Z, LM.LOCKED)


            break;
            case 'prismatic':
			havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Z, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_X, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Z, LM.LOCKED)
            break;
            case 'slider':
			havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Z, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Z, LM.LOCKED)
            break;
            case 'spherical':
			havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_X, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Z, LM.LOCKED)
            break;
            case 'distance':
            const distance = o.maxDistance || 0;
            const dist3d = CA.LINEAR_DISTANCE;
            havok.HP_Constraint_SetAxisMode(j, dist3d, LM.LIMITED)
            havok.HP_Constraint_SetAxisMinLimit(j, dist3d, distance)
            havok.HP_Constraint_SetAxisMaxLimit(j, dist3d, distance)
            break;
            case "dof": case "d6": case 'ragdoll':
//console.log(j)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_X, LM.LIMITED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Z, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_X, LM.FREE)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Y, LM.FREE)
            havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_Z, LM.FREE)
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

		const CA = this.ConstraintAxis;
		const LM = this.LimitMode



		if( o.enable !== undefined ) havok.HP_Constraint_SetEnabled(j, o.enable);

		switch(j.mode ){

			case 'hinge': case "revolute":
			if( o.lm ) this.setLimit( j, o.lm, 'ANGULAR_X' )
			break;

		}

		

		//havok.HP_Constraint_SetAxisFriction( j, this._constraintAxisToNative(axis), friction);




	}

	setLimit( j, lm, axe ){

		let r = this.angulars.indexOf(axe) !== -1 ? torad : 1
		const axis = this.ConstraintAxis[ axe ];
		havok.HP_Constraint_SetAxisMode( j, axis, this.LimitMode.LIMITED )
		havok.HP_Constraint_SetAxisMinLimit( j, axis, lm[0]*r );
		havok.HP_Constraint_SetAxisMaxLimit( j, axis, lm[1]*r );

	}

	setMotor( j, target, maxForce, axe ){

		let r = this.angulars.indexOf(axe) !== -1 ? torad : 1
		const axis = this.ConstraintAxis[ axe ];

		havok.HP_Constraint_SetAxisMotorType( j, axis, this.MotorType['VELOCITY'] );
		havok.HP_Constraint_SetAxisMotorTarget( j, axis, target);
		havok.HP_Constraint_SetAxisMotorMaxForce( j, axis, maxForce);

	}

	setFriction( j, friction, axe ){

		let r = this.angulars.indexOf(axe) !== -1 ? torad : 1
		const axis = this.ConstraintAxis[ axe ];
		havok.HP_Constraint_SetAxisFriction( j, axis, friction )

	}


}

