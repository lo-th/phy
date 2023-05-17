import { oimo } from '../libs/OimoPhysics.js';

export const map = new Map();
export const mapId = new Map();

export const root = {

	world : null,
	bodyRef: null,
	queryCollector: null,
	delta : 0,
	deltaTime : 0,
	tmpStep:0,
	substep:1,
	key:[],

	reflow:{
		ray:[],
		stat:{
			fps:0,
			delta:0,
		},
	}

};

export const torad = Math.PI / 180;
export const todeg = 180 / Math.PI;

export const math = {
	clamp: ( v, min, max ) => { 
		//Math.max( min, Math.min( max, v )) 
		v = v < min ? min : v;
	    v = v > max ? max : v;
	    return v;
	},
	equalArray:(a, b)=>{
		let i = a.length
		while(i--){ if(a[i]!==b[i]) return false }
	    return true
	},

	toFixed: ( x, n = 3 ) => ( x.toFixed(n) * 1 ),
}

export const Utils = {

	clear:() => {

		mapId.clear()
		map.clear()

	},

	byName:( name ) => {

		if ( !map.has( name ) ) return null;
		return map.get( name );

	},

	byId:( id ) => {

		if ( !mapId.has( id ) ) return null;
		return mapId.get( id );

	},

	add:( b ) => {
		
		if( b.type !== 'ray' && b.type !== 'contact' && b.type !== 'terrain' && b.type !== 'joint'){
			switch( b.type ){
				//case 'terrain': break;
				//case 'joint':/* havok.HP_World_AddBody(root.world, b, false);*/ break;
				//default: havok.HP_World_AddBody(root.world, b, false); break;
			}
		}

		if(b.type === 'body' || b.type === 'solid' ){
			mapId.set( b[0], b )
		}

		map.set( b.name, b )

	},

	remove:( b ) => {

		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'terrain': b.release(); break;
				case 'joint':
				havok.HP_Constraint_SetEnabled(b, false);
                havok.HP_Constraint_Release(b); 
				break;
				default: 
				havok.HP_World_RemoveBody(root.world, b); 
				havok.HP_Body_Release(b)
				break;
			}
		}

		map.delete( b.name );

	},

	stats: () => {
	},

	extends: () => {
	},



}

export class Matrix4 {

	constructor() {

		Matrix4.prototype.isMatrix4 = true;

		this.elements = [

			1, 0, 0, 0,
			0, 1, 0, 0,
			0, 0, 1, 0,
			0, 0, 0, 1

		];

	}

	fromArray( array, offset = 0 ) {

		for ( let i = 0; i < 16; i ++ ) {

			this.elements[ i ] = array[ i + offset ];

		}

		return this;

	}

	toArray( array = [], offset = 0 ) {

		const te = this.elements;

		array[ offset ] = te[ 0 ];
		array[ offset + 1 ] = te[ 1 ];
		array[ offset + 2 ] = te[ 2 ];
		array[ offset + 3 ] = te[ 3 ];

		array[ offset + 4 ] = te[ 4 ];
		array[ offset + 5 ] = te[ 5 ];
		array[ offset + 6 ] = te[ 6 ];
		array[ offset + 7 ] = te[ 7 ];

		array[ offset + 8 ] = te[ 8 ];
		array[ offset + 9 ] = te[ 9 ];
		array[ offset + 10 ] = te[ 10 ];
		array[ offset + 11 ] = te[ 11 ];

		array[ offset + 12 ] = te[ 12 ];
		array[ offset + 13 ] = te[ 13 ];
		array[ offset + 14 ] = te[ 14 ];
		array[ offset + 15 ] = te[ 15 ];

		return array;

	}
}


/*

HEAP8: Int8Array(29097984)
HEAP16: Int16Array(14548992)
HEAP32: Int32Array(7274496)
HEAP64: BigInt64Array(3637248) 
HEAPF32: Float32Array(7274496) 
HEAPF64: Float64Array(3637248) 
HEAPU8: Uint8Array(29097984) 
HEAPU16: Uint16Array(14548992)
HEAPU32: Uint32Array(7274496) 
HEAPU64: BigUint64Array(3637248)

HP_Body_ApplyImpulse(arg0, arg1, arg2)
HP_Body_Create()

HP_Body_GetAngularDamping(arg0)
HP_Body_GetAngularVelocity(arg0)
HP_Body_GetEventMask(arg0)
HP_Body_GetGravityFactor(arg0)
HP_Body_GetLinearDamping(arg0)
HP_Body_GetLinearVelocity(arg0)
HP_Body_GetMassProperties(arg0)
HP_Body_GetMotionType(arg0)
HP_Body_GetOrientation(arg0)
HP_Body_GetPosition(arg0)
HP_Body_GetQTransform(arg0)
HP_Body_GetShape(arg0)
HP_Body_GetWorldTransformOffset(arg0)
HP_Body_Release(arg0)
HP_Body_SetAngularDamping(arg0, arg1)
HP_Body_SetAngularVelocity(arg0, arg1)
HP_Body_SetEventMask(arg0, arg1)
HP_Body_SetGravityFactor(arg0, arg1)
HP_Body_SetLinearDamping(arg0, arg1)
HP_Body_SetLinearVelocity(arg0, arg1)
HP_Body_SetMassProperties(arg0, arg1)
HP_Body_SetMotionType(arg0, arg1)
HP_Body_SetOrientation(arg0, arg1)
HP_Body_SetPosition(arg0, arg1)
HP_Body_SetQTransform(arg0, arg1)
HP_Body_SetShape(arg0, arg1)
HP_Body_SetTargetQTransform(arg0, arg1)

HP_Constraint_Create()
HP_Constraint_GetAxisFriction(arg0, arg1)
HP_Constraint_GetAxisMaxLimit(arg0, arg1)
HP_Constraint_GetAxisMinLimit(arg0, arg1)
HP_Constraint_GetAxisMode(arg0, arg1)
HP_Constraint_GetAxisMotorMaxForce(arg0, arg1)
HP_Constraint_GetAxisMotorTarget(arg0, arg1)
HP_Constraint_GetAxisMotorType(arg0, arg1)
HP_Constraint_GetChildBody(arg0)
HP_Constraint_GetCollisionsEnabled(arg0)
HP_Constraint_GetEnabled(arg0)
HP_Constraint_GetParentBody(arg0)
HP_Constraint_Release(arg0)
HP_Constraint_SetAnchorInChild(arg0, arg1, arg2, arg3)
HP_Constraint_SetAnchorInParent(arg0, arg1, arg2, arg3)
HP_Constraint_SetAxisFriction(arg0, arg1, arg2)
HP_Constraint_SetAxisMaxLimit(arg0, arg1, arg2)
HP_Constraint_SetAxisMinLimit(arg0, arg1, arg2)
HP_Constraint_SetAxisMode(arg0, arg1, arg2)
HP_Constraint_SetAxisMotorMaxForce(arg0, arg1, arg2)
HP_Constraint_SetAxisMotorTarget(arg0, arg1, arg2)
HP_Constraint_SetAxisMotorType(arg0, arg1, arg2)
HP_Constraint_SetChildBody(arg0, arg1)
HP_Constraint_SetCollisionsEnabled(arg0, arg1)
HP_Constraint_SetEnabled(arg0, arg1)
HP_Constraint_SetParentBody(arg0, arg1)

HP_DebugGeometry_GetInfo(arg0)
HP_DebugGeometry_Release(arg0)

HP_Debug_StartRecordingStats(arg0)
HP_Debug_StopRecordingStats(arg0, arg1)
HP_Event_AsCollision(arg0)
HP_GetStatistics()
HP_QueryCollector_Create(arg0)
HP_QueryCollector_GetCastRayResult(arg0, arg1)
HP_QueryCollector_GetNumHits(arg0)
HP_QueryCollector_Release(arg0)

HP_Shape_AddChild(arg0, arg1, arg2)
HP_Shape_BuildMassProperties(arg0)
HP_Shape_CreateBox(arg0, arg1, arg2)
HP_Shape_CreateCapsule(arg0, arg1, arg2)
HP_Shape_CreateContainer()
HP_Shape_CreateConvexHull(arg0, arg1)
HP_Shape_CreateCylinder(arg0, arg1, arg2)
HP_Shape_CreateDebugDisplayGeometry(arg0)
HP_Shape_CreateHeightField(arg0, arg1, arg2, arg3)
HP_Shape_CreateMesh(arg0, arg1, arg2, arg3)
HP_Shape_CreateSphere(arg0, arg1)
HP_Shape_GetDensity(arg0)
HP_Shape_GetFilterInfo(arg0)
HP_Shape_GetMaterial(arg0)
HP_Shape_GetNumChildren(arg0)
HP_Shape_GetType(arg0)
HP_Shape_PathIterator_GetNext(arg0)
HP_Shape_Release(arg0)
HP_Shape_RemoveChild(arg0, arg1)
HP_Shape_SetDensity(arg0, arg1)
HP_Shape_SetFilterInfo(arg0, arg1)
HP_Shape_SetMaterial(arg0, arg1)

HP_World_AddBody(arg0, arg1, arg2)
HP_World_CastRayWithCollector(arg0, arg1, arg2)
HP_World_Create()
HP_World_GetBodyBuffer(arg0)
HP_World_GetCollisionEvents(arg0)
HP_World_GetNextCollisionEvent(arg0, arg1)
HP_World_GetNumBodies(arg0)
HP_World_Release(arg0)
HP_World_RemoveBody(arg0, arg1)
HP_World_SetGravity(arg0, arg1)
HP_World_Step(arg0, arg1)
*/