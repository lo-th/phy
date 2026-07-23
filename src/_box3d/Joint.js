import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, torad, max32 } from '../core/MathTool.js';

import { Utils, root, map } from './root.js';


//----------------
//  BOX3D JOINT 
//----------------

const vToAr = Utils.vToAr
const qToAr = Utils.qToAr
const toQuat = Utils.toQuat
const toVec = Utils.toVec

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'joint';

	}

	step () {

		//const AR = root.Ar;
		//const N = root.ArPos[this.type];

	}

	// Creates a vector normal (perpendicular) to the current Vector3

	/*getNormalToRef(v) {

        const radius = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        let theta = Math.acos(v[1] / radius);
        const phi = Math.atan2(v[2], v[0]);
        //makes angle 90 degs to current vector
        if( theta > Math.PI * 0.5 ) theta -= Math.PI * 0.5;
        else theta += Math.PI * 0.5;
        
        //Calculates resutant normal vector from spherical coordinate of perpendicular vector
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);

        return [x, y, z];

    }*/


	///

	add ( o = {} ) {

		let name = this.setName( o )

		let mode = o.mode || 'hinge';

		let j //jointDef
		
		switch ( mode ) {
			case 'fixe':
			//It is tempting to use the weld joint to define breakable structures.
			j = b3.b3DefaultWeldJointDef();
			break;
			case 'hinge': 
			j = b3.b3DefaultRevoluteJointDef(); 
			break;
			case 'distance': 
            j = b3.b3DefaultDistanceJointDef()
            break;
            case 'prismatic': 
            j = b3.b3DefaultPrismaticJointDef();
            break;
            //case 'cylindrical': 
            //j = b3.b3DefaultSphericalJointDef();
            //break;
            case 'spherical': 
            j = b3.b3DefaultSphericalJointDef();
            break;
            case 'wheel': 
            j = b3.b3DefaultWheelJointDef();
            break;

            case 'motor': 
            // A motor joint lets you control the motion of a body by specifying target linear and angular velocities. 
            j = b3.b3DefaultMotorJointDef();
            break;

            case 'parallel': 
            j = b3.b3DefaultParallelJointDef();
            break;
            case 'filter': 
            //The filter (or null) joint is used to disable collision between two specific bodie
            j = b3.b3DefaultParallelJointDef();
            break;
            //case 'spherical': this.lock( j, ['x', 'y', 'z'] ); break;
            //case 'ragdoll': this.lock( j, ['x', 'y', 'z'] ); break;
            //case 'generic': this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
            //default: this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
		}

		if(!j) return
			//console.log(j)

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null
		let b1 = this.byName(o.b1)
		let b2 = this.byName(o.b2)

		if(b1!==null) j.base.bodyIdA = b1;
        if(b2!==null) j.base.bodyIdB = b2;

        // anchors
        let posA =  o.pos1 || [0,0,0] 
		let posB =  o.pos2 || [0,0,0] 

		let quatA =  o.quat1 || [0,0,0,1]
		let quatB =  o.quat2 || [0,0,0,1]
        j.base.localFrameA = { p: toVec(posA), q: toQuat(quatA) };
        j.base.localFrameB = { p: toVec(posB), q: toQuat(quatB) };

        //
        j.base.collideConnected = o.collision !== undefined ? o.collision : false;



		
		j.name = name;
		j.type = this.type;
		j.mode = mode;
		j.visible = o.visible !== undefined ? o.visible : true; 

		//j.isAcceleration = false

		//if(b1) j.massInfo1 =  this.getMassInfo(b1)
		//if(b2) j.massInfo2 =  this.getMassInfo(b2)

		//console.log(j)


		// apply option
		//this.set( o, j );

		let joint

		switch ( mode ) {
			case 'fixe':
			joint = b3.b3CreateWeldJoint(root.world, j);
			break;
			//case 'distance': this.lock( j, ['rx', 'ry', 'rz'] ); break;
			case 'hinge': 
			joint = b3.b3CreateRevoluteJoint(root.world, j);
			break;
			case 'distance': 
            joint = b3.b3CreateDistanceJoint(root.world, j);
            break;
            case 'prismatic': 
            joint = b3.b3CreatePrismaticJoint(root.world, j);
            break;
            case 'spherical': 
            //This gives 3 rotational degrees of freedom with no translation
            joint = b3.b3CreateSphericalJoint(root.world, j);
            break;
            case 'wheel': 
            joint = b3.b3CreateWheelJoint(root.world, j);
            break;

            case 'motor': 
            joint = b3.b3CreateMotorJoint(root.world, j);
            break;

            case 'parallel': 
            joint = b3.b3CreateParallelJoint(root.world, j);
            break;
            case 'filter': 
            //The filter (or null) joint is used to disable collision between two specific bodie
            joint = b3.b3CreateFilterJoint(root.world, j);
            break;
            //case 'spherical': this.lock( j, ['x', 'y', 'z'] ); break;
            //case 'ragdoll': this.lock( j, ['x', 'y', 'z'] ); break;
            //case 'generic': this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
            //default: this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
		}

		j.joint = joint

		// add to world
		this.addToWorld( j );


		//console.log(j)


	}

	/*getMassInfo ( b ){

		const massPropsTuple = havok.HP_Body_GetMassProperties( b )[1];
		const info = {
            centerOfMass: massPropsTuple[0],//vector3
            mass: massPropsTuple[1],
            inertia: massPropsTuple[2],//vector3
            inertiaOrientation: massPropsTuple[3],//Quaternion
            damping: [havok.HP_Body_GetLinearDamping(b)[1], havok.HP_Body_GetAngularDamping(b)[1]],
        };

        return info

	}*/

	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;

		


		//if( o.enable !== undefined ) havok.HP_Constraint_SetEnabled(j, o.enable);

		switch(j.mode ){

			case 'hinge':
			//if( o.limit ) this.setLimit( j, [ 'rx', ...o.limit ] );
			//if( o.spring ) this.setSpring( j, [ 'rx', ...o.spring ] );
			if( o.motor ){ 
				j.enableMotor = true;
				j.motorSpeed = o.motor[1]//2.0;          // rad/s
				j.maxMotorTorque = o.motor[2]//10000;    // must be large enough to overcome inertia

				//this.setDrive(j, ['rx', o.motor[1], o.motor[2]])
				//const axis = this.ConstraintAxis[ 'ANGULAR_X' ]
	            //if(o.motor[1])havok.HP_Constraint_SetAxisMotorMaxForce( j, axis, o.motor[1] );
				//this.setDriveVelocity(j, {rot:[o.motor[0],0,0]})
			}
			//if( o.motor ) this.setMotor( j, o.motor[1], o.motor[2], 'ANGULAR_X' )
			// Adds a friction coefficient which resists movement along the specified axis. 
			//if( o.friction !== undefined ) this.setFriction( j, 'rx', o.friction )
			//if( o.lm ) this.setLimit( j, o.lm, 'ANGULAR_Z' )
			break;

		    case "prismatic":

		    if( o.lm ) o.limit = o.lm
		    if( o.limit ){
		    	j.enableLimit = true;
				j.lowerTranslation = o.limit[0];
				j.upperTranslation = o.limit[1];
		    }
			//if( o.spring ) this.setSpring( j, [ 'x', ...o.spring ] );
			// Adds a friction coefficient which resists movement along the specified axis. 
			//if( o.friction ) this.setFriction( j, 'x', o.friction );
			//if( o.lm ) this.setLimit( j, [ 'x', ...o.lm ] )
			break;

		    case 'cylindrical':
			//if( o.lm ) this.setLimit( j, [ 'x', ...o.lm ]  )
			//if( o.lmr ) this.setLimit( j, [ 'rx', ...o.lmr ] )
			break;

		    case "spherical":
			//if( o.lm ){ 
			//	this.setLimit( j, [ 'rx', ...o.lm ] )
			//	this.setLimit( j, [ 'ry', ...o.lm ] )
			//	this.setLimit( j, [ 'rz', ...o.lm ] )
			//}
			break;

			case 'distance':

			if( o.limit ) j.length = o.limit[0]; // desired distance in metres
			
			//if( o.limit ) this.setLimit( j, [ 'distance', ...o.limit ] );
			//if( o.spring ) this.setSpring( j, [ 'distance', ...o.spring ] );
			// Adds a friction coefficient which resists movement along the specified axis. 
			//if( o.friction ) this.setFriction( j, 'distance', o.friction );

			break;


		    case 'generic': case 'ragdoll': 

		    /*if( o.motion ){ 
				i = o.motion.length
				while(i--){
					this.setLimitMode( j, this.convert[ o.motion[i][0] ], this.convert[ o.motion[i][1] ] )
				}
			}

			if( o.lm ){ 
				i = o.lm.length;
				while(i--){
					this.setLimit( j, o.lm[i] )
				}
			}

			if( o.drive ){ 
				i = o.drive.length;
				while(i--){
					this.setDrive( j, o.drive[i] )
					//this.setMotor( j, o.motor[i][0], o.motor[i][1], o.motor[i][2] )
				}
			}
			if( o.friction !== undefined ){ 
				let frict = []
				if(o.friction instanceof Array){
					frict = [...o.friction]
					
				} else {
					let f = o.friction
					frict = [['x', f], ['y', f], ['z', f], ['rx', f], ['ry', f], ['rz', f]]
				}
				// apply friction on each axis if only one value
				i = frict.length
				while(i--){
					// Adds a friction coefficient which resists movement along the specified axis. 
					this.setFriction( j, frict[i][0], frict[i][1] );
				}


			}

			if( o.drivePosition ){ 
				this.setDrivePosition( j, o.drivePosition );
			}

			if( o.driveVelocity ){
				this.setDriveVelocity( j, o.driveVelocity );
			}*/


			
			break;

		}

		//if(o.getInfo) this.getInfo(j)

		//havok.HP_Constraint_SetAxisFriction( j, this._constraintAxisToNative(axis), friction);

	}

	/*getDriveTarget(j){

		const d = [
			havok.HP_Constraint_GetAxisMotorTarget(j, this.ConstraintAxis['LINEAR_X'])[1],
			havok.HP_Constraint_GetAxisMotorTarget(j, this.ConstraintAxis['LINEAR_Y'])[1],
			havok.HP_Constraint_GetAxisMotorTarget(j, this.ConstraintAxis['LINEAR_Z'])[1],

			havok.HP_Constraint_GetAxisMotorTarget(j, this.ConstraintAxis['ANGULAR_X'])[1],
			havok.HP_Constraint_GetAxisMotorTarget(j, this.ConstraintAxis['ANGULAR_Y'])[1],
			havok.HP_Constraint_GetAxisMotorTarget(j, this.ConstraintAxis['ANGULAR_Z'])[1],
			0
		]

		return d

	}

	getInfo(j){

		const info = {
		}

		console.log(info)

	}

	

	lock( j, axes ){
		let i = axes.length;
		while( i-- ) havok.HP_Constraint_SetAxisMode( j, this.ConstraintAxis[ this.convert[axes[i]] ], this.LimitMode.LOCKED );
	}

	setLimitMode( j, axe, type ){

		havok.HP_Constraint_SetAxisMode( j, this.ConstraintAxis[ axe ], this.LimitMode[ type ] )

	}

	setDriveMode( j, axe, type ){

		havok.HP_Constraint_SetAxisMotorType( j, this.ConstraintAxis[ axe ], this.MotorType[type] )

	}

	setLimit( j, limit ){

		//return

		const a = this.convert[ limit[0] ]
		const m = this.angulars.indexOf( a ) !== -1 ? torad : 1;
		const axis = this.ConstraintAxis[ a ];

		//havok.HP_Constraint_SetAxisMotorType( j, axis, this.MotorType.SPRING_ACCELERATION )

		havok.HP_Constraint_SetAxisMode( j, axis, this.LimitMode.LIMITED );
		havok.HP_Constraint_SetAxisMinLimit( j, axis, limit[1]*m );
		havok.HP_Constraint_SetAxisMaxLimit( j, axis, limit[2]*m );
		
		// if not set limite is hard
		if(limit.length>3){
			//let spring = [ limit[0], ...limit.splice(3) ];
			let spring = [ limit[0], ...limit.slice(3) ];
			this.setSpring(j, spring);
		}

	}*/

	

	


}
