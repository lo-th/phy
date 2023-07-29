import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { torad } from '../core/MathTool.js';

import { Utils, root, map } from './root.js';


//----------------
//  HAVOK JOINT 
//----------------

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

		// z and x is revese ?

		this.convert = {
			x:'LINEAR_X',
			y:'LINEAR_Y',
			z:'LINEAR_Z',
			rx:'ANGULAR_X',
			ry:'ANGULAR_Y',
			rz:'ANGULAR_Z',
			twist:'ANGULAR_X',
			swing1:'ANGULAR_Y',
			swing2:'ANGULAR_Z',
			free:'FREE',
			locked:'LOCKED',
			limited:'LIMITED',
		}

		/*this.convert = {
			z:'LINEAR_X',
			y:'LINEAR_Y',
			x:'LINEAR_Z',
			rz:'ANGULAR_X',
			ry:'ANGULAR_Y',
			rx:'ANGULAR_Z',
			twist:'ANGULAR_X',
			swing1:'ANGULAR_Y',
			swing2:'ANGULAR_Z',
			free:'FREE',
			locked:'LOCKED',
			limited:'LIMITED',
		}*/

		this.angulars = ['ANGULAR_X', 'ANGULAR_Y', 'ANGULAR_Z']

	}

	step ( AR, N ) {

	}

	// Creates a vector normal (perpendicular) to the current Vector3

	getNormalToRef(v) {

        const radius = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        let theta = Math.acos(v[1] / radius);
        const phi = Math.atan2(v[2], v[0])
        //makes angle 90 degs to current vector
        if( theta > Math.PI * 0.5 ) theta -= Math.PI * 0.5;
        else theta += Math.PI * 0.5;
        
        //Calculates resutant normal vector from spherical coordinate of perpendicular vector
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);

        return [x, y, z];

    }

    crossVectors( a, b ) {

		const ax = a[0], ay = a[1], az = a[2];
		const bx = b[0], by = b[1], bz = b[2];

		let x = ay * bz - az * by;
		let y = az * bx - ax * bz;
		let z = ax * by - ay * bx;

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
        const posA = o.pos1 ? o.pos1 : [0,0,0];
        const axisA = o.axis1 ? o.axis1 : [1,0,0];
        const perpAxisA = this.getNormalToRef(axisA);
        havok.HP_Constraint_SetAnchorInParent(j, posA, axisA, perpAxisA);
        const posB = o.pos2 ? o.pos2 : [0,0,0];
        const axisB = o.axis2 ? o.axis2 : [1,0,0];
        const perpAxisB =  this.getNormalToRef(axisB);
        havok.HP_Constraint_SetAnchorInChild(j, posB, axisB, perpAxisB);

        //console.log(axisA, axisB, perpAxisA, perpAxisB)

		let mode = o.mode || 'revolute';

		const CA = this.ConstraintAxis;
		const LM = this.LimitMode

		switch ( mode ) {
			case 'fixe':
			for(let t in CA){
            	if(t!=='LINEAR_DISTANCE') havok.HP_Constraint_SetAxisMode(j, CA[t], LM.LOCKED)	
            }
			break;
			case 'hinge': case "revolute":
			havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_X, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Y, LM.LOCKED)
            havok.HP_Constraint_SetAxisMode(j, CA.LINEAR_Z, LM.LOCKED)
            //havok.HP_Constraint_SetAxisMode(j, CA.ANGULAR_X, LM.LOCKED)
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
            case 'slider': case 'cylindrical':
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
            case "dof": case "d6": case 'ragdoll': case 'universal':

            for(let t in CA){
            	if(t!=='LINEAR_DISTANCE') havok.HP_Constraint_SetAxisMode(j, CA[t], LM.LOCKED)
            }
            break;
		}



		let collisionEnabled = o.collision !== undefined ? o.collision : false;

		havok.HP_Constraint_SetCollisionsEnabled( j, collisionEnabled );
        havok.HP_Constraint_SetEnabled( j, true );

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
		let i 



		if( o.enable !== undefined ) havok.HP_Constraint_SetEnabled(j, o.enable);

		switch(j.mode ){

			case 'hinge': case "revolute":
			if( o.lm ) this.setLimit( j, [ 'rx', ...o.lm ] )
			if( o.motor ) this.setMotor( j, o.motor[1], o.motor[2], 'ANGULAR_X' )
			if( o.friction !== undefined ) this.setFriction( j, o.friction, 'ANGULAR_X' )
			//if( o.lm ) this.setLimit( j, o.lm, 'ANGULAR_Z' )
			break;

		    case "prismatic":
			if( o.lm ) this.setLimit( j, [ 'x', ...o.lm ] )
			break;

		    case 'slider': case 'cylindrical':
			if( o.lm ) this.setLimit( j, [ 'x', ...o.lm ]  )
			if( o.lmr ) this.setLimit( j, [ 'rx', ...o.lmr ] )
			break;

		    case 'dof': case 'd6': case 'ragdoll': case 'universal':


		    if( o.motion ){ 
				i = o.motion.length
				while(i--){
					this.setLimitMode( j, this.convert[ o.motion[i][0] ], this.convert[ o.motion[i][1] ] )
				}
			}

			if( o.lm ){ 
				i = o.lm.length
				while(i--){
					//this.setLimit( j, [o.lm[i][1], o.lm[i][2]], this.convert[ o.lm[i][0] ] )
					this.setLimit( j, o.lm[i] )
				}
			}
			if( o.motor ){ 
				i = o.motor.length
				while(i--){
					this.setMotor( j, o.motor[i][1], o.motor[i][2], this.convert[ o.motor[i][0] ] )
				}
			}
			if( o.friction !== undefined ){ 
				if(! o.friction instanceof Array){
					let f = o.friction
					o.friction = [['x', f], ['y', f], ['z', f], ['rx', f], ['ry', f], ['rz', f]]
				}
				i = o.friction.length
				while(i--){
					this.setFriction( j, o.friction[i][1], this.convert[ o.friction[i][0] ] )
				}
			}
			
			break;

		}

		

		//havok.HP_Constraint_SetAxisFriction( j, this._constraintAxisToNative(axis), friction);




	}

	setLimitMode( j, axe, type ){

		havok.HP_Constraint_SetAxisMode( j, this.ConstraintAxis[ axe ], this.LimitMode[type] )

	}

	setLimit( j, lm ){

		let axe = this.convert[ lm[0] ] 

		let r = this.angulars.indexOf( axe ) !== -1 ? torad : 1

		const axis = this.ConstraintAxis[ axe ];

		if( lm[1] === 0 && lm[2] === 0 ) havok.HP_Constraint_SetAxisMode( j, axis, this.LimitMode.FREE )
		else {
			havok.HP_Constraint_SetAxisMode( j, axis, this.LimitMode.LIMITED )
			havok.HP_Constraint_SetAxisMinLimit( j, axis, lm[1]*r );
			havok.HP_Constraint_SetAxisMaxLimit( j, axis, lm[2]*r );

			if(lm[3]) havok.HP_Constraint_SetAxisStiffness( j, axis, lm[3]*0.1 );//stiffness
			if(lm[4]) havok.HP_Constraint_SetAxisDamping( j, axis, lm[4]*6 );//damping
		}

	}

	setMotor( j, target, maxForce, axe ){

		let r = this.angulars.indexOf(axe) !== -1 ? torad : 1
		const axis = this.ConstraintAxis[ axe ];

		havok.HP_Constraint_SetAxisMotorType( j, axis, this.MotorType['VELOCITY'] );
		//havok.HP_Constraint_SetAxisMotorType( j, axis, this.MotorType['POSITION'] );
		havok.HP_Constraint_SetAxisMotorTarget( j, axis, target*r);
		if( maxForce ) havok.HP_Constraint_SetAxisMotorMaxForce( j, axis, maxForce);//0

		//havok.HP_Constraint_SetAxisMode( j, axis, this.LimitMode.FREE )

	//	console.log(j, axis.value);

		/*j.setAxisMotorType(axis.value, this.MotorType['VELOCITY']);
       j.setAxisMotorMaxForce(axis.value, 1000);
        j.setAxisMotorTarget(axis.value, Math.PI * 0.5)*/

		//console.log(havok.HP_Constraint_GetAxisMotorMaxForce( j, axis)[1]);
		//havok.HP_Constraint_SetAxisMotorMaxForce( j, axis, maxForce);

	}

	setFriction( j, friction, axe ){

		//let r = this.angulars.indexOf(axe) !== -1 ? torad : 1
		const axis = this.ConstraintAxis[ axe ];
		havok.HP_Constraint_SetAxisFriction( j, axis, friction )

		//console.log(havok.HP_Constraint_GetAxisFriction( j, axis)[1]);

	}


}

