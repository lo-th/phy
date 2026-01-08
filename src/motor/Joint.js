import {
	Vector3, Quaternion, Euler
} from 'three';
import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, torad } from '../core/MathTool.js';
import { JointDebug } from './extra/JointDebug.js';

const Q = new Quaternion()


//----------------
//  MOTOR JOINT 
//----------------

export class Joint extends Item {

	constructor ( motor ) {

		super();

		this.motor = motor;
		this.engine = this.motor.engine;
		this.Utils = this.motor.utils;

		this.type = 'joint';

		this.v1 = new Vector3()
		this.v2 = new Vector3()

	}

	step (AR, N) {

		let i = this.list.length, j, n;
		
		while( i-- ){

			j = this.list[i];
			n = N + ( i * Num.joint );
			//if( Num.joint === 16 ) j.updateFromPhy( AR, n );
			//else 

			j.update(AR, n);

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );

		let body1 = null;
		let body2 = null;
		let isString;

		let isWorldAxis = false;

		if( !o.axis1 ) o.axis1 = [1,0,0];
		if( !o.axis2 ) o.axis2 = [1,0,0];

		if( !o.pos1 ) o.pos1 = [0,0,0];
		if( !o.pos2 ) o.pos2 = [0,0,0];

		if( o.limit ) o.lm = o.limit;
		else if( o.lm ) o.limit = o.lm;

		/*if(o.lm) o.lm = [...o.lm]*/

		// STRICT MODE

		if(o.mode==='universal'||o.mode==='dof'||o.mode==='d6') o.mode = 'generic';
		if(o.mode==='revolute') o.mode = 'hinge';
		if(o.mode==='slider') o.mode = 'cylindrical';

		// GET BODY REFERENCY

		if( o.b1 ) {
			isString = typeof o.b1 === 'string';
			body1 = isString ? this.Utils.byName( o.b1 ) : o.b1;
			if( !isString ) o.b1 = o.b1.name;
			if( body1 ) body1.link ++;
		}

		if( o.b2 ) {
			isString = typeof o.b2 === 'string';
			body2 = isString ? this.Utils.byName( o.b2 ) : o.b2;
			if( !isString ) o.b2 = o.b2.name;
			if( body2 ) body2.link ++;
		}

		// world to local
		if ( o.worldPos ) o.worldAnchor = o.worldPos;

		if ( o.worldAnchor ){

			//o.pos1 = body1 ? this.Utils.toLocal( this.v1.fromArray( o.worldAnchor ), body1 ).toArray() : o.worldAnchor;
			//o.pos2 = body2 ? this.Utils.toLocal( this.v2.fromArray( o.worldAnchor ), body2 ).toArray() : o.worldAnchor;

			//o.pos1 = body1 ? this.Utils.toLocal2( o.worldAnchor, body1 ) : o.worldAnchor;
			//o.pos2 = body2 ? this.Utils.toLocal2( o.worldAnchor, body2 ) : o.worldAnchor;

			o.pos1 = body1 ? this.Utils.toLocal2( o.worldAnchor, body1 ) : o.worldAnchor;
			o.pos2 = body2 ? this.Utils.toLocal2( o.worldAnchor, body2 ) : o.worldAnchor;

			//console.log("POS", o.pos1, o.pos2, os1, os2)
			

			/*if(body1){ 
				this.v1 = body1.worldToLocal(this.v2.fromArray( o.worldAnchor ));
				o.pos1 = this.v1.toArray();
			}
			if(body2){ 
				this.v1 = body2.worldToLocal(this.v2.fromArray( o.worldAnchor ));
				o.pos2 = this.v1.toArray();
			}*/
			delete o.worldAnchor;
		}

		if ( o.worldAxis ){

			//o.axis1 = body1 ? this.Utils.toLocal( this.v1.fromArray( o.worldAxis ), body1, true ).toArray() : o.worldAxis;
		    //o.axis2 = body2 ? this.Utils.toLocal( this.v2.fromArray( o.worldAxis ), body2, true ).toArray() : o.worldAxis;

			o.axis1 = body1 ? this.Utils.toLocal2( o.worldAxis, body1, true ) : o.worldAxis;
		    o.axis2 = body2 ? this.Utils.toLocal2( o.worldAxis, body2, true ) : o.worldAxis;

			 
			
			//o.quat1 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		    //o.quat2 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

			//console.log(o.worldAxis, o.axis1, o.axis2)
			isWorldAxis = true;

			/*if( this.engine === 'HAVOK' ){

				let a1 = new Vector3().fromArray(o.axis1)
				let a2 = new Vector3().fromArray(o.axis2)

				o.axis1 = MathTool.quatToAxis(new Quaternion().setFromUnitVectors( a1, new Vector3(1, 0, 0) ).toArray());
			    o.axis2 = MathTool.quatToAxis(new Quaternion().setFromUnitVectors( a2, new Vector3(1, 0, 0) ).toArray());

				o.axis1Y = MathTool.quatToAxis(new Quaternion().setFromUnitVectors( a1, new Vector3(0, 1, 0) ).toArray());
			    o.axis2Y = MathTool.quatToAxis(new Quaternion().setFromUnitVectors( a2, new Vector3(0, 1, 0) ).toArray());
			    
			}*/

			delete o.worldAxis;

		}

		if ( o.worldQuat ){

			o.quat1 = this.Utils.quatLocal(o.worldQuat, body1)
			o.quat2 = this.Utils.quatLocal(o.worldQuat, body2)

			if( this.engine === 'OIMO' ||  this.engine === 'JOLT' ){//this.engine === 'HAVOK' ||

				//this.v1.fromArray( math.quadToAxisArray( o.worldQuat ) ).normalize()
				//this.v2.fromArray( math.quadToAxisArray( o.worldQuat ) ).normalize()
                /*let q1 = new Quaternion().fromArray(o.worldQuat)
                let q2 = new Quaternion().setFromAxisAngle({x:0,y:1,z:0}, -Math.PI*0.5)
				let qqq = q2.multiply(q1).normalize().toArray()*/

				//console.log(q1, q2, qqq)

				//o.axis1 = Utils.axisLocal( math.quadToAxisArray( o.worldQuat ), body1)//this.v1.fromArray( math.quadToAxisArray( o.quat1 ) ).normalize().toArray()
				//o.axis2 = Utils.axisLocal( math.quadToAxisArray( o.worldQuat ), body2)//this.v2.fromArray( math.quadToAxisArray( o.quat2 ) ).normalize().toArray()

				let axeA = MathTool.quatToAxis( o.worldQuat )
				//let axeB = MathTool.perpendicularArray0( axeA )//this.v1.fromArray(MathTool.quatToAxis( o.worldQuat )).applyAxisAngle({x:0,y:1,z:0}, -Math.PI*0.5 ).toArray()
				//let axeB = MathTool.normalizeArray( MathTool.quatToAxis( qqq ))//this.v1.fromArray(axeA).applyAxisAngle({x:0,y:1,z:0}, Math.PI*0.5 ).toArray()

				o.axis1 = MathTool.quatToAxis( o.quat1 )//this.Utils.axisLocal( axeA, body1)
				o.axis2 = MathTool.quatToAxis( o.quat2 )//this.Utils.axisLocal( axeA, body2)

				//console.log("B", axeB)

				/*if( this.engine === 'HAVOK' ){

					let a1 = new Vector3().fromArray(o.axis1)
					let a2 = new Vector3().fromArray(o.axis2)

					o.axis1 = MathTool.quatToAxis(new Quaternion().setFromUnitVectors( a1, new Vector3(1, 0, 0) ).toArray());
				    o.axis2 = MathTool.quatToAxis(new Quaternion().setFromUnitVectors( a2,  new Vector3(1, 0, 0), ).toArray());

					o.axis1Y = MathTool.quatToAxis(new Quaternion().setFromUnitVectors( a1, new Vector3(0, 1, 0) ).toArray());
				    o.axis2Y = MathTool.quatToAxis(new Quaternion().setFromUnitVectors( a2,  new Vector3(0, 1, 0), ).toArray());
				    
				}*/

				/*

				

				o.axis1Y = this.Utils.axisLocal( qqq, body1)
				o.axis2Y = this.Utils.axisLocal( qqq, body2)*/
				//let qq2 = MathTool.quatMultiply( qq, MathTool.quatToAxis( o.worldQuat ) )

				//o.axis1Y = this.v1.fromArray(MathTool.quatToAxis( o.worldQuat )).applyAxisAngle({x:0,y:1,z:0}, -Math.PI*0.5 ).toArray()
				//o.axis2Y = this.v2.fromArray(MathTool.quatToAxis( o.worldQuat )).applyAxisAngle({x:0,y:1,z:0}, -Math.PI*0.5 ).toArray()

				

				//o.axis1Y = this.Utils.axisLocal( axeB, body1)
				//o.axis2Y = this.Utils.axisLocal( axeB, body2)

				//o.axis1 = body1 ? Utils.toLocal( this.v1, body1, true ).toArray():[1,0,0]
				//o.axis2 = body2 ? Utils.toLocal( this.v2, body2, true ).toArray():[1,0,0]

			}
			/*this.v1.fromArray( o.worldAxis ) 
			this.v2.fromArray( o.worldAxis )

			o.axis1 = body1 ? Utils.toLocal( this.v1, body1, true ).normalize().toArray():o.worldAxis
			o.axis2 = body2 ? Utils.toLocal( this.v2, body2, true ).normalize().toArray():o.worldAxis
*/
			//o.quat1 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		    //o.quat2 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

			//console.log(o.worldQuat, o.quat1, o.quat2)

			delete o.worldQuat;

		}


		/*if( o.b2 ) body2 = typeof o.b2 !== 'string' ? o.b2 : Utils.byName(o.b2)
		if( o.b1 && typeof o.b1 !== 'string') o.b1 = o.b1.name;
		if( o.b2 && typeof o.b2 !== 'string') o.b2 = o.b2.name;*/

		if( o.rot1 !== undefined ){ o.quat1 = MathTool.quatFromEuler( o.rot1 ); delete ( o.rot1 ); }
		if( o.rot2 !== undefined ){ o.quat2 = MathTool.quatFromEuler( o.rot2 ); delete ( o.rot2 ); }

		if( !o.quat1 ) o.quat1 = Q.setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		if( !o.quat2 ) o.quat2 = Q.setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();


		if( this.engine === 'HAVOK' ){ 
			//o.quat1 = MathTool.quatNomalize(o.quat1)
			let m31 = MathTool.Mat3FromQuatArray( o.quat1 )
			let m32 = MathTool.Mat3FromQuatArray( o.quat2 )

			o.axis1 = m31[0]
			o.axis1Y = m31[1]

			o.axis2 = m32[0]
			o.axis2Y = m32[1]
		}

		if( this.engine === 'AMMO' && isWorldAxis && o.mode === 'hinge') {
			let ee = new Euler(0, -90*torad, 0);
			let qq = new Quaternion().setFromEuler(ee).toArray();
			o.quatX = qq;
			//o.quat1 = MathTool.quatMultiply(o.quat1, qq);
			//o.quat2 = MathTool.quatMultiply(o.quat2, qq);
		}



		let j = new JointDebug( o, this.motor );
		j.name = name;
		j.body1 = body1;
		j.body2 = body2;
		
		if( o.visible === undefined ) o.visible = this.motor.jointVisible || false;

		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j, o.id );

		//console.log(j)

		// add to worker 
		this.motor.post( { m:'add', o:o } );

		return j;

	}

	set ( o = {}, j = null ) {

		

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;
		if( o.visible !== undefined ) j.visible = o.visible;

		/*if( o.drivePosition && this.engine !== 'HAVOK') {
			if( o.drivePosition.rot !== undefined ){ o.drivePosition.quat = MathTool.quatFromEuler( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }
			console.log(o.drivePosition)
		}*/

	}

}