import {
	Vector3, Quaternion, Euler
} from 'three';
import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, torad } from '../core/MathTool.js';
import { Utils, root } from './root.js';

import { JointDebug } from './extra/JointDebug.js';


//----------------
//  MOTOR JOINT 
//----------------

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'joint';

		this.v1 = new Vector3()
		this.v2 = new Vector3()

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, j, n;
		
		while( i-- ){

			j = this.list[i];
			n = N + ( i * Num.joint );
			if( Num.joint === 16 ) j.updateFromPhy( AR, n );
			else j.update();

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o )

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

		// STRICT MODE

		if(o.mode==='universal'||o.mode==='dof'||o.mode==='d6') o.mode = 'generic';
		if(o.mode==='revolute') o.mode = 'hinge';
		if(o.mode==='slider') o.mode = 'cylindrical';

		// GET BODY REFERENCY

		if( o.b1 ) {
			isString = typeof o.b1 === 'string';
			body1 = isString ? Utils.byName( o.b1 ) : o.b1;
			if( !isString ) o.b1 = o.b1.name;
			if( body1 ) body1.link ++;
		}

		if( o.b2 ) {
			isString = typeof o.b2 === 'string';
			body2 = isString ? Utils.byName( o.b2 ) : o.b2;
			if( !isString ) o.b2 = o.b2.name;
			if( body2 ) body2.link ++;
		}

		// world to local
		if ( o.worldPos ) o.worldAnchor = o.worldPos;
		if ( o.worldAnchor ){

			o.pos1 = body1 ? Utils.toLocal( this.v1.fromArray( o.worldAnchor ), body1 ).toArray() : o.worldAnchor;
			o.pos2 = body2 ? Utils.toLocal( this.v2.fromArray( o.worldAnchor ), body2 ).toArray() : o.worldAnchor;
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

			
			/*if( root.engine === 'JOLT'){
				o.axis1 = o.worldAxis;
				o.axis2 = o.worldAxis;
			}else{*/
				o.axis1 = body1 ? Utils.toLocal( this.v1.fromArray( o.worldAxis ), body1, true ).toArray() : o.worldAxis;
			    o.axis2 = body2 ? Utils.toLocal( this.v2.fromArray( o.worldAxis ), body2, true ).toArray() : o.worldAxis;
			//}
			
			//o.quat1 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		    //o.quat2 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

			//console.log(o.worldAxis, o.axis1, o.axis2)
			isWorldAxis = true;

			delete o.worldAxis;

		}

		if ( o.worldQuat ){

			o.quat1 = Utils.quatLocal(o.worldQuat, body1)
			o.quat2 = Utils.quatLocal(o.worldQuat, body2)



			if( root.engine === 'OIMO' || root.engine === 'HAVOK' || root.engine === 'JOLT' ){

				//this.v1.fromArray( math.quadToAxisArray( o.worldQuat ) ).normalize()
				//this.v2.fromArray( math.quadToAxisArray( o.worldQuat ) ).normalize()

				//o.axis1 = Utils.axisLocal( math.quadToAxisArray( o.worldQuat ), body1)//this.v1.fromArray( math.quadToAxisArray( o.quat1 ) ).normalize().toArray()
				//o.axis2 = Utils.axisLocal( math.quadToAxisArray( o.worldQuat ), body2)//this.v2.fromArray( math.quadToAxisArray( o.quat2 ) ).normalize().toArray()

				o.axis1 = Utils.axisLocal( MathTool.quatToAxis( o.worldQuat ), body1)
				o.axis2 = Utils.axisLocal( MathTool.quatToAxis( o.worldQuat ), body2)

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

		if( !o.quat1 ) o.quat1 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		if( !o.quat2 ) o.quat2 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

		if( root.engine === 'AMMO' && isWorldAxis && o.mode === 'hinge') {
			let ee = new Euler(0, -90*torad, 0);
			let qq = new Quaternion().setFromEuler(ee).toArray();
			o.quatX = qq;
			//o.quat1 = MathTool.quatMultiply(o.quat1, qq);
			//o.quat2 = MathTool.quatMultiply(o.quat2, qq);
		}

		if( o.drivePosition ) if( o.drivePosition.rot !== undefined ){ o.drivePosition.quat = MathTool.quatFromEuler( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }

		let j = new JointDebug( o );
		j.name = name;
		j.body1 = body1;
		j.body2 = body2;
		
		if( o.visible === undefined ) o.visible = root.jointVisible || false;

		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j, o.id );

		// add to worker 
		root.post( { m:'add', o:o } );

		return j;

	}

	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;
		if( o.visible !== undefined ) j.visible = o.visible;

	}

}