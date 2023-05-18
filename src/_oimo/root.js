import { oimo } from '../libs/OimoPhysics.js';

export const map = new Map();

export const root = {


	deltaTime : 0,
	invDelta : 0,

	world : null,
	delta : 0,
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

	velocityArray:( a, b, m = 1 ) => {
		let ar = [0,0,0]
		let i = a.length
		while(i--){ 
			ar[i] = a[i]-b[i] 
			if(ar[i]!==0) ar[i] *= m
		}
	    //b = a
	    return ar
	},

	angularArray:( qb, qa, m = 1 ) => {
		let ar = [0,0,0]
		qa[0] *= -1
    	qa[1] *= -1
    	qa[2] *= -1
    	let x = qa[0] * qb[3] + qa[3] * qb[0] + qa[1] * qb[2] - qa[2] * qb[1];
		let y = qa[1] * qb[3] + qa[3] * qb[1] + qa[2] * qb[0] - qa[0] * qb[2];
		let z = qa[2] * qb[3] + qa[3] * qb[2] + qa[0] * qb[1] - qa[1] * qb[0];
		let w = qa[3] * qb[3] - qa[0] * qb[0] - qa[1] * qb[1] - qa[2] * qb[2];

    	let angle = 2 * Math.acos(w), ax;
	    let s = Math.sqrt(1-w*w); // assuming quaternion normalised then w is less than 1, so term always positive.
	    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
	        // if s close to zero then direction of axis not important
	        // if it is important that axis is normalised then replace with x=1; y=z=0;
	        ar = [0,0,0]
	    } else {
	        //x = q[0] / s; // normalise axis
	        ar =  [ x / s, y / s, z / s ]
        }

        let i = ar.length
		while(i--){ 
			if(ar[i]!==0) ar[i] *= m
		}

        return ar
	},

	toFixed: ( x, n = 3 ) => ( x.toFixed(n) * 1 ),
}

export class Utils {

	static clear() {

		map.clear()

	}

	static byName( name ) {

		if ( !map.has( name ) ) return null;
		return map.get( name );

	}

	static add( b ) {
		
		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': root.world.addJoint( b ); break;
				default: root.world.addRigidBody( b ); break;
			}
		}

		map.set( b.name, b );

	}

	static remove( b ) {

		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': root.world.removeJoint( b ); break;
				default: root.world.removeRigidBody( b ); break;
			}
		}

		map.delete( b.name );

	}

	static stats (){
		/*text =
			'${currentDemo.demoName} - ${pause ? "Paused" : "Running"}\n' +
			'------------\n' +
			'Profile\n' +
			'  Rigid Bodies  : ${world.getNumRigidBodies()}\n' +
			'  Joints        : ${world.getNumJoints()}\n' +
			'  Shapes        : ${world.getNumShapes()}\n' +
			'  Pairs         : ${world.getContactManager().getNumContacts()}\n' +
			'------------\n' +
			'Performance\n' +
			'  Broad Phase  : ${Math.round(Performance.broadPhaseCollisionTime)}ms\n' +
			'  Narrow Phase : ${Math.round(Performance.narrowPhaseCollisionTime)}ms\n' +
			'  Dynamics     : ${Math.round(Performance.dynamicsTime)}ms\n' +
			'  Physics Total: ${Math.round(Performance.totalTime)}ms\n' +
			'  Rendering    : ${Math.round(drawTime)}ms\n' +
			'  Actual FPS   : $fps\n' +
			'------------\n' +
			'Control\n' +
			'${createKeyDescriptions("  ")}' +
			'------------\n' +
			'Misc. Info\n' +
			'${additionalInfo()}' +
			'\n'
		;*/
	} 

}

export const Vec3 = oimo.common.Vec3;
export const Quat = oimo.common.Quat;
export const Mat3 = oimo.common.Mat3;
export const Mat4 = oimo.common.Mat4;
export const Transform = oimo.common.Transform;

export const World = oimo.dynamics.World;

//export const RigidBodyType = oimo.dynamics.rigidbody.RigidBodyType;
export const RigidBodyConfig = oimo.dynamics.rigidbody.RigidBodyConfig;
export const ShapeConfig = oimo.dynamics.rigidbody.ShapeConfig;
export const RigidBody = oimo.dynamics.rigidbody.RigidBody;
export const Shape = oimo.dynamics.rigidbody.Shape;

export const RayCastClosest = oimo.dynamics.callback.RayCastClosest;
export const ContactCallback = oimo.dynamics.callback.ContactCallback;


/*
export const Proxy = oimo.collision.broadphase.Proxy;
export const ProxyPair = oimo.collision.broadphase.ProxyPair;
export const BroadPhaseProxyCallback = oimo.collision.broadphase.BroadPhaseProxyCallback
//export const BroadPhase = oimo.collision.broadphase.BroadPhase;
export const bruteforce = oimo.collision.broadphase.bruteforce;
export const bvh = oimo.collision.broadphase.bvh;
export const bruteforce = oimo.collision.broadphase.bruteforce;
*/


export const Aabb = oimo.collision.geometry.Aabb;
export const BoxGeometry = oimo.collision.geometry.BoxGeometry;
export const SphereGeometry = oimo.collision.geometry.SphereGeometry;
export const CylinderGeometry = oimo.collision.geometry.CylinderGeometry;
export const CapsuleGeometry = oimo.collision.geometry.CapsuleGeometry;
export const ConeGeometry = oimo.collision.geometry.ConeGeometry;
export const RayCastHit = oimo.collision.geometry.RayCastHit;
export const ConvexGeometry = oimo.collision.geometry.ConvexGeometry;
export const ConvexHullGeometry = oimo.collision.geometry.ConvexHullGeometry;

export const Joints = {
    // JOINT
	RagdollJoint : oimo.dynamics.constraint.joint.RagdollJoint,
	UniversalJoint : oimo.dynamics.constraint.joint.UniversalJoint,
	GenericJoint : oimo.dynamics.constraint.joint.GenericJoint,
	PrismaticJoint : oimo.dynamics.constraint.joint.PrismaticJoint,
	RevoluteJoint : oimo.dynamics.constraint.joint.RevoluteJoint,
	CylindricalJoint : oimo.dynamics.constraint.joint.CylindricalJoint,
	SphericalJoint : oimo.dynamics.constraint.joint.SphericalJoint,
	// JOINT_CONFIG
	RagdollJointConfig : oimo.dynamics.constraint.joint.RagdollJointConfig,
	UniversalJointConfig : oimo.dynamics.constraint.joint.UniversalJointConfig,
	GenericJointConfig : oimo.dynamics.constraint.joint.GenericJointConfig,
	PrismaticJointConfig : oimo.dynamics.constraint.joint.PrismaticJointConfig,
	RevoluteJointConfig : oimo.dynamics.constraint.joint.RevoluteJointConfig,
	CylindricalJointConfig : oimo.dynamics.constraint.joint.CylindricalJointConfig,
	SphericalJointConfig : oimo.dynamics.constraint.joint.SphericalJointConfig,

	RotationalLimitMotor : oimo.dynamics.constraint.joint.RotationalLimitMotor,
	TranslationalLimitMotor : oimo.dynamics.constraint.joint.TranslationalLimitMotor,
	SpringDamper : oimo.dynamics.constraint.joint.SpringDamper
	
}

// JOINT_EXTRA
//export const RotationalLimitMotor = oimo.dynamics.constraint.joint.RotationalLimitMotor;
//export const TranslationalLimitMotor = oimo.dynamics.constraint.joint.TranslationalLimitMotor;
//export const SpringDamper = oimo.dynamics.constraint.joint.SpringDamper;




// CLASS EXTEND

Transform.prototype.fromArray = function ( p, q, np, nq ){

	nq = np || 0;
	nq = nq || 0;

	if( p ) this._position.fromArray( p, np );
	if( q ) this._rotation.fromQuat( { x:q[ nq ], y:q[ nq+1 ], z:q[ nq+2 ], w:q[ nq+3 ] } );

}

Vec3.prototype.toArray = function ( r, n ){

	let direct = r !== undefined;

	n = n || 0;
	//r = r || [];

	if( !direct ) r = [];

	r[ n ] = this.x;
	r[ n + 1 ] = this.y;
	r[ n + 2 ] = this.z;


	if(!direct) return r;

}

Vec3.prototype.fromArray = function ( r, n ){

	n = n || 0;

	this.x = r[ n ];
	this.y = r[ n + 1 ];
	this.z = r[ n + 2 ];

	return this;
	
}

Vec3.prototype.set = function ( x,y,z ){

	this.x = x;
	this.y = y;
	this.z = z;

	return this;

}


Vec3.prototype.applyQuaternion = function ( q ){

	const x = this.x, y = this.y, z = this.z;
	const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

	// calculate quat * vector
	const ix = qw * x + qy * z - qz * y;
	const iy = qw * y + qz * x - qx * z;
	const iz = qw * z + qx * y - qy * x;
	const iw = - qx * x - qy * y - qz * z;

	// calculate result * inverse quat
	this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
	this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
	this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

    return this;

}

Quat.prototype.toArray = function ( r, n ){

	let direct = r !== undefined;

	n = n || 0;
	//r = r || [];

	if( !direct ) r = [];

	r[ n ] = this.x;
	r[ n + 1 ] = this.y;
	r[ n + 2 ] = this.z;
	r[ n + 3 ] = this.w;

	//return r;
	if(!direct) return r;

}

Quat.prototype.fromArray = function ( r, n ){

	n = n || 0;

	this.x = r[ n ];
	this.y = r[ n + 1 ];
	this.z = r[ n + 2 ];
	this.w = r[ n + 3 ];

	return this;
	
}

Quat.prototype.set = function ( x,y,z,w ){

	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;

	return this;

}