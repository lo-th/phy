import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, torad } from '../core/MathTool.js';

import { Utils, root, map } from './root.js';


//----------------
//  JOLT JOINT 
//----------------

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'joint';

		this.v = new Jolt.RVec3();

		this.min = new Jolt.RVec3(0,0,0);
		this.max = new Jolt.RVec3(0,0,0);

		
		/*this.ConstraintAxis = {
			LINEAR_X: Jolt.EAxis.TranslationX,
			LINEAR_Y: Jolt.EAxis.TranslationY,
			LINEAR_Z: Jolt.EAxis.TranslationZ,
			ANGULAR_X: Jolt.EAxis.RotationX,
			ANGULAR_Y: Jolt.EAxis.RotationY,
			ANGULAR_Z: Jolt.EAxis.RotationZ,
			//LINEAR_DISTANCE: Jolt.EAxis.NumTranslation,
			//LINEAR_DISTANCE: Jolt.EAxis.Num,
		}*/

	}

	step () {

		//const AR = root.Ar;
		//const N = root.ArPos[this.type];

	}

	///

	add ( o = {} ) {

		// JOLT JOINT POSITION IS WORLD GLOBAL

		//const v = this.v;

		let name = this.setName( o )

		let mode = o.mode || 'hinge';

		// define body b1 and b2 is string body name
        // note: b1 / b2 can be null
		let b1 = this.byName(o.b1);
		let b2 = this.byName(o.b2);

		let b1Pos = [0,0,0]
		let b2Pos = [0,0,0]
		let b1Quat = [0,0,0,1]
		let b2Quat = [0,0,0,1]


		




		// anchors
        let posA = o.pos1 ? o.pos1 : [0,0,0];
        let axisA = o.axis1 ? o.axis1 : [1,0,0];
        let posB = o.pos2 ? o.pos2 : [0,0,0];
        let axisB = o.axis2 ? o.axis2 : [1,0,0];

        /*if(o.worldAxis){
			axisA = o.worldAxis; 
			axisB = o.worldAxis; 
		}*/

        let normA =  [0,1,0];
        let perpAxisA = MathTool.perpendicularArray(axisA);
        //const perpAxisA = this.getNormalToRef(axisA);
        //havok.HP_Constraint_SetAnchorInParent(j, posA, axisA, perpAxisA);
        
        let perpAxisB = MathTool.perpendicularArray(axisB);
        let normB =  [0,1,0];

        //const axeX = [1,0,0]
        //const axeY = [0,1,0]

        //!\\ local to world global
        //if(b1) posA = MathTool.applyTransformArray(posA, b1.GetPosition().toArray(), b1.GetRotation().toArray())
		//if(b2) posB = MathTool.applyTransformArray(posB, b2.GetPosition().toArray(), b2.GetRotation().toArray())

        //posA = MathTool.addArray( b1Pos, posA );
        //posB = MathTool.addArray( b2Pos, posB );

        let jtype = null

		let jc
		switch ( mode ) {
			case 'fixe': jc = new Jolt.FixedConstraintSettings(); jc.mAutoDetectPoint = true; jtype = 'FixedConstraint'; break;
			case 'hinge': jc = new Jolt.HingeConstraintSettings(); jtype = 'HingeConstraint'; break;
            case 'distance': jc = new Jolt.DistanceConstraintSettings(); jtype = 'DistanceConstraint';break;
            case 'prismatic': jc = new Jolt.SliderConstraintSettings(); jtype = 'SliderConstraint';break;
            case 'spherical': jc = new Jolt.PointConstraintSettings(); jtype = 'PointConstraintConstraint';break;
            case 'cone': jc = new Jolt.ConeConstraintSettings(); jtype = 'ConeConstraint';break;
            case 'ragdoll': jc = new Jolt.SwingTwistConstraintSettings(); jtype = 'SwingTwistConstraint'; break;
            case "generic":  case "cylindrical": jc = new Jolt.SixDOFConstraintSettings(); jtype = 'SixDOFConstraint'; break;
		}

		if(!jc) return

		// hinge
        if(jc.mPoint1) jc.mPoint1.fromArray(posA);
		if(jc.mPoint2) jc.mPoint2.fromArray(posB);
		//if(jc.mPoint1) jc.mPoint1 = new Jolt.RVec3().fromArray(posA);
		//if(jc.mPoint2) jc.mPoint2 = new Jolt.RVec3().fromArray(posB);
		// or ?
		if(jc.mPosition1) jc.mPosition1.fromArray(posA);
		if(jc.mPosition2) jc.mPosition2.fromArray(posB);

		if(jc.mAxisX1) jc.mAxisX1.fromArray(axisA);
		if(jc.mAxisY1) jc.mAxisY1.fromArray(perpAxisA);

		if(jc.mAxisX2) jc.mAxisX2.fromArray(axisB);
		if(jc.mAxisY2) jc.mAxisY2.fromArray(perpAxisB);

		if(jc.mHingeAxis1) jc.mHingeAxis1.fromArray(axisA);
		if(jc.mHingeAxis2) jc.mHingeAxis2.fromArray(axisB);

		if(jc.mSliderAxis1) jc.mSliderAxis1.fromArray(axisA);
		if(jc.mSliderAxis2) jc.mSliderAxis2.fromArray(axisB);

		if(jc.mNormalAxis1) jc.mNormalAxis1.fromArray(perpAxisA);
		if(jc.mNormalAxis2) jc.mNormalAxis2.fromArray(perpAxisB);


		// 0 local position 1 world position 
		if(jc.mSpace) jc.mSpace = 0;



		//console.log(jc)


        /*const perpAxisB =  this.getNormalToRef(axisB);
        havok.HP_Constraint_SetAnchorInChild(j, posB, axisB, perpAxisB);

        

        const CA = this.ConstraintAxis;
		const LM = this.LimitMode;

		

		if( mode==='d6' || mode==='universal' || mode==='dof' || mode==='ragdoll') mode = 'generic'
		if( mode==='revolute' ) mode = 'hinge'
		if( mode==='cylindrical' ) mode = 'slider'
		*/

		switch ( mode ) {
			
            case "generic": 
            jc.MakeFixedAxis(0)
			jc.MakeFixedAxis(1)
			jc.MakeFixedAxis(2)
			jc.MakeFixedAxis(3)
			jc.MakeFixedAxis(4)
			jc.MakeFixedAxis(5)
            break;
            case "cylindrical": 
            //jc.MakeFixedAxis(0)
			jc.MakeFixedAxis(1)
			jc.MakeFixedAxis(2)
			//jc.MakeFixedAxis(3)
			jc.MakeFixedAxis(4)
			jc.MakeFixedAxis(5)

			if(mode==='cylindrical'){
				//jc.MakeFreeAxis(0)// x
				//jc.MakeFreeAxis(3)// rx
			}
            break;
		}

	
		//const j = jc.Create( b1, b2 );
		const j = Jolt.castObject( jc.Create( b1, b2 ), Jolt[jtype] );
		j.name = name;
		j.type = this.type;
		j.mode = mode;
		j.visible = o.visible !== undefined ? o.visible : true;

		//j.SetEnabled(true);
		
		Jolt.destroy(jc);

		//console.log( j )

		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j );

	}

	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;

		if( o.enable !== undefined ) j.SetEnabled(o.enable);

		// what is that ?
		//j.jc.mNumPositionStepsOverride = 10
		//j.jc.mNumVelocityStepsOverride = 10

		switch( j.mode ){

			case 'hinge':
			if( o.lm ){
				j.SetLimits(o.lm[0] * torad, o.lm[1] * torad );

				/*
				// sping setting
				console.log(j.jc.mLimitsSpringSettings)
				j.jc.mLimitsSpringSettings.mDamping = 0;
				j.jc.mLimitsSpringSettings.mFrequency = 0;
				j.jc.mLimitsSpringSettings.mMode = 0;
				j.jc.mLimitsSpringSettings.mStiffness = 0;
				*/
			}
			break;
			case 'spherical':
			break;
			case 'prismatic':
			if( o.lm ){
				j.SetLimits(o.lm[0], o.lm[1]);

				
				// sping setting
				if( o.spring ){

					let s = j.GetLimitsSpringSettings();

					s.mStiffness = o.spring[0];
					s.mDamping = o.spring[1];
					s.mFrequency = o.spring[0];
					// 0 FrequencyAndDamping
					// 1 StiffnessAndDamping 
					s.mMode = 1;

					//j.SetLimitsSpringSettings(s);
					//console.log("srping", s)
				}
				
			}
			break;
			case "cylindrical":
			if( o.lm ){
				this.min.set(o.lm[0],0,0);
				this.max.set(o.lm[1],0,0);
				j.SetTranslationLimits( this.min, this.max );
			}
			if( o.lmr ){
				this.min.set(o.lmr[0]*torad,0,0);
				this.max.set(o.lmr[1]*torad,0,0);
				j.SetRotationLimits( this.min, this.max );
			}
			j.SetEnabled(true);
			//console.log(j)
			break;
			case "generic":
			if( o.lm ){
				//j.IsFixedAxis(0)
				//j.IsFixedAxis(1)
				//j.IsFreeAxis(EAxis)
				j.SetTranslationLimits( this.min, this.max );
				j.SetRotationLimits( this.min, this.max );
				//j.SetLimitsSpringSettings(	EAxis,  SpringSettings )
				//j.SetMaxFriction(EAxis, c)
				//j.SetMotorState (EAxis inAxis, EMotorState inState)

				// EMotorState Off Velocity Position 
				//j.SetMotorState( EAxis, EMotorState );
			}
			break;


		}

	}

	setSpring( j, spring ){

		
		
	}

	


}

// Stiffness >> Raideur
// Damping >> Amortissement