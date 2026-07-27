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

		//b3Joint_GetBodyA (arg0)
		//b3Joint_GetBodyB (arg0)
		//b3Joint_GetLocalFrameA (j)
		//b3Joint_GetLocalFrameB (j)

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

		if(mode==='generic'){
        	mode = 'spherical'
        }

		let jd //jointDef
		
		switch ( mode ) {
			case 'fixe':
			//It is tempting to use the weld joint to define breakable structures.
			jd = b3.b3DefaultWeldJointDef();
			break;
			case 'hinge': 
			jd = b3.b3DefaultRevoluteJointDef(); 
			break;
			case 'distance': 
            jd = b3.b3DefaultDistanceJointDef()
            break;
            case 'prismatic': 
            jd = b3.b3DefaultPrismaticJointDef();
            /*j.enableLimit = true;
			j.lowerTranslation = -2.0;
			j.upperTranslation =  2.0;*/
            break;
            //case 'cylindrical': 
            //j = b3.b3DefaultSphericalJointDef();
            //break;
            case 'spherical': 
            jd = b3.b3DefaultSphericalJointDef();
            break;
            case 'wheel': 
            jd = b3.b3DefaultWheelJointDef();
            break;

            case 'motor': 
            // A motor joint lets you control the motion of a body by specifying target linear and angular velocities. 
            jd = b3.b3DefaultMotorJointDef();
            break;

            case 'parallel': 
            jd = b3.b3DefaultParallelJointDef();
            break;
            case 'filter': 
            //The filter (or null) joint is used to disable collision between two specific bodie
            jd = b3.b3DefaultParallelJointDef();
            break;
            //case 'spherical': this.lock( j, ['x', 'y', 'z'] ); break;
            //case 'ragdoll': this.lock( j, ['x', 'y', 'z'] ); break;
            //case 'generic': this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
            //default: this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
		}

		if(!jd){ 
			console.log('miss joint', mode)
			return
		}
			//console.log(j)

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null
		let b1 = this.byName(o.b1)
		let b2 = this.byName(o.b2)
		let massA = 0 
		let massB = 0



		if(b1!==null) {
			jd.base.bodyIdA = b1;
			massA = b3.b3Body_GetMass(b1)
		}
        if(b2!==null) {
        	jd.base.bodyIdB = b2;
        	massB = b3.b3Body_GetMass(b2)
        }

        // anchors
        let posA =  o.pos1 || [0,0,0] 
		let posB =  o.pos2 || [0,0,0] 

		let quatA =  o.quat1 || [0,0,0,1]
		let quatB =  o.quat2 || [0,0,0,1]

		if(mode==='hinge'){
			quatA = MathTool.quatMultiply(quatA, o.quatY);
		    quatB = MathTool.quatMultiply(quatB, o.quatY);
		}

        jd.base.localFrameA = { p: toVec(posA), q: toQuat(quatA) };
        jd.base.localFrameB = { p: toVec(posB), q: toQuat(quatB) };

        //
        jd.base.collideConnected = o.collision !== undefined ? o.collision : false;




		let j

		switch ( mode ) {
			case 'fixe':
			j = b3.b3CreateWeldJoint(root.world, jd);
			break;
			//case 'distance': this.lock( j, ['rx', 'ry', 'rz'] ); break;
			case 'hinge': 
			//Revolute: rotates about the joint frame's local Z-axis
			j = b3.b3CreateRevoluteJoint(root.world, jd);
			break;
			case 'distance': 
            j = b3.b3CreateDistanceJoint(root.world, jd);
            break;
            case 'prismatic': 
            // Prismatic: slides along the joint frame's local X-axis
            j = b3.b3CreatePrismaticJoint(root.world, jd);
            break;
            case 'spherical': 
            // Spherical: cone centered on frame Z
            //This gives 3 rotational degrees of freedom with no translation
            j = b3.b3CreateSphericalJoint(root.world, jd);
            break;
            case 'wheel': 
            j = b3.b3CreateWheelJoint(root.world, jd);
            break;

            case 'motor': 
            j = b3.b3CreateMotorJoint(root.world, jd);
            break;

            case 'parallel': 
            j = b3.b3CreateParallelJoint(root.world, jd);
            break;
            case 'filter': 
            //The filter (or null) joint is used to disable collision between two specific bodie
            j = b3.b3CreateFilterJoint(root.world, jd);
            break;
            //case 'spherical': this.lock( j, ['x', 'y', 'z'] ); break;
            //case 'ragdoll': this.lock( j, ['x', 'y', 'z'] ); break;
            //case 'generic': this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
            //default: this.lock( j, ['x', 'y', 'z', 'rx', 'ry', 'rz'] ); break;
		}

		

		// apply option
		j.name = name;
		j.type = this.type;
		j.mode = mode;
		j.massA = massA 
		j.massB = massB
		j.visible = o.visible !== undefined ? o.visible : true; 
		this.set( o, j );

		// add to world
		this.addToWorld( j );


		//console.log(j)


	}

	stiffnessToHertz( stiffness, mass ) {
	    // Vérification pour éviter les erreurs de division par zéro ou racine négative
	    if (mass <= 0 || stiffness < 0) {
	        throw new Error("Les valeurs de m doivent être strictement positives et k doit être non-négatif.");
	    }

	    const f = (1 / (2 * Math.PI)) * Math.sqrt(stiffness / mass);
	    console.log(f)
	    return f;

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

			case 'fixe':
			if(o.spring){
				b3.b3WeldJoint_SetLinearHertz (j,o.spring[0])
				b3.b3WeldJoint_SetLinearDampingRatio (j,o.spring[1])
				b3.b3WeldJoint_SetAngularHertz (j,o.spring[2])
				b3.b3WeldJoint_SetAngularDampingRatio (j,o.spring[3])
			}
			break;

			case 'hinge':

			if( o.lm ) o.limit = o.lm
		    if( o.limit ){
		    	b3.b3RevoluteJoint_EnableLimit(j,true)
				b3.b3RevoluteJoint_SetLimits(j, o.limit[0]*torad, o.limit[1]*torad )
				if(o.limit[2]){ 
					b3.b3RevoluteJoint_EnableSpring(j,o.limit[2]>0)
					b3.b3RevoluteJoint_SetSpringHertz(j, this.stiffnessToHertz(o.limit[2], j.massB ))
				}
				if(o.limit[3]) b3.b3RevoluteJoint_SetSpringDampingRatio(j, o.limit[3])
		    }

			if( o.motor ){
				b3.b3PrismaticJoint_EnableMotor (j, o.motor[0]>0)
				b3.b3RevoluteJoint_SetMaxMotorTorque (j, o.motor[0])
				b3.b3RevoluteJoint_SetMotorSpeed (j, o.motor[1])
			}
			
			if( o.target ) b3.b3RevoluteJoint_SetTargetAngle (j, o.target)
			
			break;

		    case "prismatic":

		    /*
			    Set the prismatic joint stiffness in Hertz.
			    This should usually be less than a quarter of the simulation rate. 
			    For example, if the simulation runs at 60Hz then the joint stiffness 
			    should be 15Hz or less.
		    */

		    if( o.lm ) o.limit = o.lm
		    if( o.limit ){
		    	b3.b3PrismaticJoint_EnableLimit(j,true)
				b3.b3PrismaticJoint_SetLimits(j, o.limit[0], o.limit[1] )
				if(o.limit[2]){ 
					b3.b3PrismaticJoint_SetSpringHertz(j, this.stiffnessToHertz(o.limit[2], j.massB ) )
					b3.b3PrismaticJoint_EnableSpring(j,true)
				}
				if(o.limit[3]) b3.b3PrismaticJoint_SetSpringDampingRatio(j, o.limit[3])
		    }

		    if( o.friction ) o.motor = [o.friction]
			if( o.motor ){
				b3.b3PrismaticJoint_EnableMotor (j, o.motor[0]>0)
				b3.b3PrismaticJoint_SetMaxMotorForce (j, o.motor[0])
				b3.b3PrismaticJoint_SetMotorSpeed (j, o.motor[1])
			}
			
			if( o.target ) b3.b3PrismaticJoint_SetTargetTranslation (j, o.target)


			break;

		    case 'cylindrical':
			//if( o.lm ) this.setLimit( j, [ 'x', ...o.lm ]  )
			//if( o.lmr ) this.setLimit( j, [ 'rx', ...o.lmr ] )
			break;

		    case "spherical":
			
			if( o.limit ){
				let l
				for(let i = 0; i<o.limit.length; i++){
					l = o.limit[i]

					if(l[0] === 'rx'){
						b3.b3SphericalJoint_EnableTwistLimit (j,true)
				        b3.b3SphericalJoint_SetTwistLimits (j, l[1]*torad, l[2]*torad)
					}

					if(l[0] === 'rz'){
						b3.b3SphericalJoint_EnableConeLimit (j, l[2]>0 )
					    b3.b3SphericalJoint_SetConeLimit (j, l[2]*torad)
					}

				}

				/*b3.b3SphericalJoint_EnableTwistLimit (j,true)
				// range [-0.99*pi, 0.99*pi]
				b3.b3SphericalJoint_SetTwistLimits (j, o.limit[0], o.limit[1])

				if(o.limit[2]){
				    //  z-axis  [0, pi]
					b3.b3SphericalJoint_EnableConeLimit (j, true )
					b3.b3SphericalJoint_SetConeLimit (j, o.limit[2])
				}*/
				
			}
			if( o.spring ){
				b3.b3SphericalJoint_EnableSpring (j, o.spring[0]>0 )
				b3.b3SphericalJoint_SetSpringHertz (j, this.stiffnessToHertz(o.spring[0], j.massB ) )
				b3.b3SphericalJoint_SetSpringDampingRatio (j, o.spring[1])
			}

			if( o.friction ) o.motor = [o.friction]

			if( o.motor ){
				b3.b3SphericalJoint_EnableMotor (j, o.motor[0]>0)
				b3.b3SphericalJoint_SetMaxMotorTorque (j,o.motor[0]) // can be use as friction
				if(o.motor[1]) b3.b3SphericalJoint_SetMotorVelocity (j,o.motor[1])
			}

			if( o.target )  b3.b3SphericalJoint_SetTargetRotation (j, o.target)
			
			break;
			case "wheel":
			/*
			b3WheelJoint_EnableSpinMotor (arg0,arg1)
			b3WheelJoint_EnableSteering (arg0,arg1)
			b3WheelJoint_EnableSteeringLimit (arg0,arg1)
			b3WheelJoint_EnableSuspension (arg0,arg1)
			b3WheelJoint_EnableSuspensionLimit (arg0,arg1)

			b3WheelJoint_IsSpinMotorEnabled (arg0)
			b3WheelJoint_IsSteeringEnabled (arg0)
			b3WheelJoint_IsSteeringLimitEnabled (arg0)
			b3WheelJoint_IsSuspensionEnabled (arg0)
			b3WheelJoint_IsSuspensionLimitEnabled (arg0)
			b3WheelJoint_SetMaxSpinTorque (arg0,arg1)
			b3WheelJoint_SetMaxSteeringTorque (arg0,arg1)
			b3WheelJoint_SetSpinMotorSpeed (arg0,arg1)
			b3WheelJoint_SetSteeringDampingRatio (arg0,arg1)
			b3WheelJoint_SetSteeringHertz (arg0,arg1)
			b3WheelJoint_SetSteeringLimits (arg0,arg1,arg2)
			b3WheelJoint_SetSuspensionDampingRatio (arg0,arg1)
			b3WheelJoint_SetSuspensionHertz (arg0,arg1)
			b3WheelJoint_SetSuspensionLimits (arg0,arg1,arg2)
			b3WheelJoint_SetTargetSteeringAngle (arg0,arg1)
			*/
			break;

			case "motor":
			/*
			b3MotorJoint_GetAngularDampingRatio (arg0)
			b3MotorJoint_GetAngularHertz (arg0)

			b3MotorJoint_SetAngularDampingRatio (arg0,arg1)
			b3MotorJoint_SetAngularHertz (arg0,arg1)
			b3MotorJoint_SetAngularVelocity (arg0,arg1)
			b3MotorJoint_SetLinearDampingRatio (arg0,arg1)
			b3MotorJoint_SetLinearHertz (arg0,arg1)
			b3MotorJoint_SetLinearVelocity (arg0,arg1)
			b3MotorJoint_SetMaxSpringForce (arg0,arg1)
			b3MotorJoint_SetMaxSpringTorque (arg0,arg1)
			b3MotorJoint_SetMaxVelocityForce (arg0,arg1)
			b3MotorJoint_SetMaxVelocityTorque (arg0,arg1)
			*/
			break;

			case 'distance':

			if( o.limit ){
				
				b3.b3DistanceJoint_EnableLimit (j,true)
				//b3.b3DistanceJoint_SetLength (j,arg1)
				b3.b3DistanceJoint_SetLengthRange (j,o.limit[0],o.limit[1])
			}
			
			if( o.spring ){
				b3.b3DistanceJoint_EnableSpring (j,true)
				b3.b3DistanceJoint_SetSpringHertz (j, this.stiffnessToHertz(o.spring[0], j.massB ) )
				b3.b3DistanceJoint_SetSpringDampingRatio (j,o.spring[1])
				b3.b3DistanceJoint_SetSpringForceRange (j,o.spring[2],o.spring[3])
			}

			if( o.friction ) o.motor = [o.friction]

			if( o.motor ){
				b3.b3DistanceJoint_EnableMotor (j,true)
				b3.b3DistanceJoint_SetMaxMotorForce (j,o.motor[0])// can be use as friction
				if(o.motor[1]) b3.b3DistanceJoint_SetMotorSpeed (j,o.motor[1])
			}

			break;

			case "parallel":
			/*
			b3ParallelJoint_SetMaxTorque (arg0,arg1)
			b3ParallelJoint_SetSpringDampingRatio (arg0,arg1)
			b3ParallelJoint_SetSpringHertz (arg0,arg1)
			*/
			break;


		    case 'generic': case 'ragdoll': 


			
			break;

		}


	}

	
	

	


}
