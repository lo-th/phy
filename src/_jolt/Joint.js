import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { torad } from '../core/MathTool.js';

import { Utils, root, map } from './root.js';


//----------------
//  JOLT JOINT 
//----------------

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'joint';

		this.v = new Jolt.Vec3();

	}

	step () {

		//const AR = root.Ar;
		//const N = root.ArPos[this.type];

	}

	///

	add ( o = {} ) {

		//const v = this.v;

		let name = this.setName( o )

		let mode = o.mode || 'revolute';

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null
		let b1 = this.byName(o.b1)
		let b2 = this.byName(o.b2)


		// anchors
        const posA = o.pos1 ? o.pos1 : [0,0,0];
        const axisA = o.axis1 ? o.axis1 : [1,0,0];
        //const perpAxisA = this.getNormalToRef(axisA);
        //havok.HP_Constraint_SetAnchorInParent(j, posA, axisA, perpAxisA);
        const posB = o.pos2 ? o.pos2 : [0,0,0];
        const axisB = o.axis2 ? o.axis2 : [1,0,0];

		let jc
		switch ( mode ) {
			case 'fixe': jc = new Jolt.FixedConstraintSettings(); jc.mAutoDetectPoint = true; break;
			case 'hinge': case 'revolute': jc = new Jolt.HingeConstraintSettings(); break;
            case 'distance': jc = new Jolt.DistanceConstraintSettings(); break;
            case 'slider': jc = new Jolt.SliderConstraintSettings();  break;
            case 'spherical': jc = new Jolt.PointConstraintSettings(); break;
            case 'cone': jc = new Jolt.ConeConstraintSettings(); break;
            case 'st': jc = new Jolt.SwingTwistConstraintSettings(); break;
            case "generic": jc = new Jolt.SixDOFConstraintSettings(); break;
		}

		if(!jc) return

        if(jc.mPoint1) jc.mPoint1.fromArray(posA);
		if(jc.mPoint2) jc.mPoint2.fromArray(posB);
		//if(jc.mPoint1) jc.mPoint1 = new Jolt.Vec3().fromArray(posA);
		//if(jc.mPoint2) jc.mPoint2 = new Jolt.Vec3().fromArray(posB);
		// or ?
		if(jc.mPosition1) jc.mPosition1.fromArray(posA);
		if(jc.mPosition2) jc.mPosition2.fromArray(posB);

		if(jc.mAxisX1) jc.mAxisX1.fromArray(axisA);
		if(jc.mAxisY1) jc.mAxisY1.fromArray(axisB);




        /*const perpAxisB =  this.getNormalToRef(axisB);
        havok.HP_Constraint_SetAnchorInChild(j, posB, axisB, perpAxisB);

        //console.log(axisA, axisB, perpAxisA, perpAxisB)

        const CA = this.ConstraintAxis;
		const LM = this.LimitMode;

		

		if( mode==='d6' || mode==='universal' || mode==='dof' || mode==='ragdoll') mode = 'generic'
		if( mode==='revolute' ) mode = 'hinge'
		if( mode==='cylindrical' ) mode = 'slider'

		
		switch ( mode ) {
			case 'fixe': this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
			case 'hinge': this.lock( j, ['x', 'y', 'z', 'ry', 'rz'] ); break;
            case 'prismatic': this.lock( j, ['y', 'z', 'rx','ry', 'rz'] ); break;
            case 'slider': this.lock( j, ['y', 'z', 'ry', 'rz'] );  break;
            case 'spherical': this.lock( j, ['x', 'y', 'z'] ); break;
            case "generic": this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
		}

		let collisionEnabled = o.collision !== undefined ? o.collision : false;

		havok.HP_Constraint_SetCollisionsEnabled( j, collisionEnabled );
        havok.HP_Constraint_SetEnabled( j, true );
*/
		const j = jc.Create(b1, b2);
		j.name = name;
		j.type = this.type;
		j.mode = mode;
		j.visible = o.visible !== undefined ? o.visible : true; 

		//console.log(j, jc)




		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j );


	}

	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;

		/*const CA = this.ConstraintAxis;
		const LM = this.LimitMode
		let i 


		if( o.enable !== undefined ) havok.HP_Constraint_SetEnabled(j, o.enable);

		switch(j.mode ){

			case 'hinge':
			if( o.limit ) this.setLimit( j, [ 'rx', ...o.limit ] );
			if( o.spring ) this.setSpring( j, [ 'rx', ...o.spring ] );
			if( o.motor ) this.setMotor( j, o.motor[1], o.motor[2], 'ANGULAR_X' )
			if( o.friction !== undefined ) this.setFriction( j, o.friction, 'ANGULAR_X' )
			//if( o.lm ) this.setLimit( j, o.lm, 'ANGULAR_Z' )
			break;

		    case "prismatic":
		    if( o.limit ) this.setLimit( j, [ 'x', ...o.limit ] );
			if( o.spring ) this.setSpring( j, [ 'x', ...o.spring ] );
			if( o.friction ) this.setFriction( j, 'x', o.friction );
			//if( o.lm ) this.setLimit( j, [ 'x', ...o.lm ] )
			break;

		    case 'slider':
			if( o.lm ) this.setLimit( j, [ 'x', ...o.lm ]  )
			if( o.lmr ) this.setLimit( j, [ 'rx', ...o.lmr ] )
			break;

		    case "spherical":
			if( o.lm ){ 
				this.setLimit( j, [ 'rx', ...o.lm ] )
				this.setLimit( j, [ 'ry', ...o.lm ] )
				this.setLimit( j, [ 'rz', ...o.lm ] )
			}
			break;

			case 'distance':
			
			if( o.limit ) this.setLimit( j, [ 'distance', ...o.limit ] );
			if( o.spring ) this.setSpring( j, [ 'distance', ...o.spring ] );
			if( o.friction ) this.setFriction( j, 'distance', o.friction );

			break;

			

		    case "generic": 


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
					this.setFriction( j, o.friction[i][0], o.friction[i][1] );
				}
			}
			
			break;

		}

		

		//havok.HP_Constraint_SetAxisFriction( j, this._constraintAxisToNative(axis), friction);*/




	}

	/*lock( j, axes ){
		let i = axes.length;
		while( i-- ) havok.HP_Constraint_SetAxisMode( j, this.ConstraintAxis[ this.convert[axes[i]] ], this.LimitMode.LOCKED );
	}

	setLimitMode( j, axe, type ){

		havok.HP_Constraint_SetAxisMode( j, this.ConstraintAxis[ axe ], this.LimitMode[ type ] )

	}

	setLimit( j, limit ){

		let m = this.angulars.indexOf( limit[0] ) !== -1 ? torad : 1;
		const axis = this.ConstraintAxis[ this.convert[ limit[0] ] ];

		havok.HP_Constraint_SetAxisMode( j, axis, this.LimitMode.LIMITED );
		havok.HP_Constraint_SetAxisMinLimit( j, axis, limit[1]*m );
		havok.HP_Constraint_SetAxisMaxLimit( j, axis, limit[2]*m );
		if( limit[3] !== undefined ) havok.HP_Constraint_SetAxisStiffness( j, axis, limit[3] );
		if( limit[4] !== undefined ) havok.HP_Constraint_SetAxisDamping( j, axis, limit[4] );
		//if( limit[5] !== undefined ) havok.HP_Constraint_SetAxisFriction( j, axis, limit[5] );//friction default 0

	}

	setSpring( j, spring ){

		const axis = this.ConstraintAxis[ this.convert[ spring[0] ] ];
		if( spring[1] !== undefined ) havok.HP_Constraint_SetAxisStiffness( j, axis, spring[1] );//stiffness*0.1
		if( spring[2] !== undefined ) havok.HP_Constraint_SetAxisDamping( j, axis, spring[2] );//damping (0 means default damping of 1.0f)
		
		
	}

	setFriction( j, axe, friction = 0 ){

		const axis = this.ConstraintAxis[ this.convert[ axe ] ];
		havok.HP_Constraint_SetAxisFriction( j, axis, friction )

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


		//console.log(havok.HP_Constraint_GetAxisMotorMaxForce( j, axis)[1]);
		//havok.HP_Constraint_SetAxisMotorMaxForce( j, axis, maxForce);

	}*/

	


}

// Stiffness >> Raideur
// Damping >> Amortissement