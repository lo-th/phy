
export const map = new Map();

export const root = {

	Ar:null, 
	ArPos: {},

	world : null,
	gravity : null,
	bodyRef: null,
	byName: null,
	delta : 0,
	tmpStep:0,
	substep:1,
	numBreak:0,
	gravity:null,

	key:[],

	reflow:{
		ray:[],
		point:{},
		stat:{
			fps:0,
			delta:0,
		},
	}

};


export const Utils = {

	clear: () => {

		map.clear()

	},

	byName: ( name ) => {

		if ( !map.has( name ) ) return null;
		return map.get( name );

	},

	add: ( b ) => {

		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': root.world.addConstraint( b, !b.collision ); break;
				case 'solid': root.world.addCollisionObject( b, b.group, b.mask ); break;
				case 'terrain': root.world.addCollisionObject( b.body, b.group, b.mask ); break;
				case 'body': root.world.addRigidBody( b, b.group, b.mask ); break;
			}
		}

		map.set( b.name, b );

	},

	remove: ( b ) => {

		if( b.type !== 'ray' && b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': root.world.removeConstraint( b ); Ammo.destroy( b.formA ); Ammo.destroy( b.formB ); Ammo.destroy( b ); break;
				case 'solid': root.world.removeCollisionObject( b ); Ammo.destroy( b ); break;
				case 'body': root.world.removeRigidBody( b ); Ammo.destroy( b ); break;
				case 'vehicle': b.release(); break;
				case 'terrain': b.release(); break;
			}
		}

		map.delete( b.name );

	},

	getVolume: ( type, s, v ) => {

		let volume = 1

		switch(type){
			
			case 'sphere' : volume = (4*Math.PI*s[0]*s[0]*s[0])/3; break;
			case 'cone' : volume = Math.PI * s[0] * (s[1] * 0.5) * 2; break;
			case 'box' : volume = 8 * (s[0]*0.5)*(s[1]*0.5)*(s[2]*0.5); break;
			case 'cylinder' : volume = Math.PI * s[0] * s[0] * (s[1] * 0.5) * 2; break;
			case 'capsule' : volume = ( (4*Math.PI*s[0]*s[0]*s[0])/3) + ( Math.PI * s[0] * s[0] * (s[1] * 0.5) * 2 ); break;
			case 'convex' : case 'mesh' : volume = Utils.getConvexVolume( v ); break;

		}

		return volume;

	},

	getConvexVolume: ( v ) => {

		let i = v.length / 3, n;
		let min = [v[0], v[1], v[2]]
		let max = [v[0], v[1], v[2]]

		while(i--){

			n = i*3
			if ( v[n] < min[0] ) min[0] = v[n]
			else if (v[n] > max[0]) max[0] = v[n]
			if ( v[n+1] < min[1] ) min[1] = v[n+1]
			else if (v[n+1] > max[1]) max[1] = v[n+1]
			if ( v[n+2] < min[2] ) min[2] = v[n+2]
			else if (v[n+2] > max[2]) max[2] = v[n+2]

		}

	    return (max[0]-min[0])*(max[1]-min[1])*(max[2]-min[2])

	},

	malloc: ( f, q ) => {

        var nDataBytes = f.length * f.BYTES_PER_ELEMENT;
        if( q === undefined ) q = Ammo._malloc(nDataBytes);
        var dataHeap = new Uint8Array( Ammo.HEAPU8.buffer, q, nDataBytes);
        dataHeap.set(new Uint8Array( f.buffer ));
        return q;

    },

    free: ( ptr ) => {
    	if( ptr ) Ammo._free( ptr );
    },

	stats: () => {
	},

	extends: () => {

		// CLASS EXTEND

		// VEC3

		Ammo.btVector3.prototype.set = function ( x,y,z ){

			this.setValue( x, y, z );
			return this;

		}

		Ammo.btVector3.prototype.toArray = function ( r, n ){

			let direct = r !== undefined;

			n = n || 0;
			//r = r || [];

			if( !direct ) r = [];

			r[ n ] = this.x();
			r[ n + 1 ] = this.y();
			r[ n + 2 ] = this.z();

			if(!direct) return r;

		}

		Ammo.btVector3.prototype.fromArray = function ( r, n ){

			n = n || 0;
			this.setValue( r[ n ], r[ n + 1 ], r[ n + 2 ] )
			return this
			
		}

		Ammo.btVector3.prototype.copy = function ( v ){

			this.setValue( v.x(), v.y(), v.z() )
			return this
			
		}

		Ammo.btVector3.prototype.sub = function ( v ){

			this.setValue( this.x()-v.x(), this.y()-v.y(), this.z()-v.z() )
			return this
			
		}

		Ammo.btVector3.prototype.mul = function (){

			// for box volume calcylation
			return this.x() * this.y() * this.z()
			
		}

		Ammo.btVector3.prototype.multiplyArray = function (ar){

			this.setValue( this.x()*ar[0], this.y()*ar[1], this.z()*ar[2] )
			return this
			
		}

		Ammo.btVector3.prototype.multiplyScalar = function ( s ){

			this.setValue( this.x()*s, this.y()*s, this.z()*s )
			return this
			
		}

		Ammo.btVector3.prototype.divideScalar = function ( s ){

			return this.multiplyScalar( 1/s )
			
		}

		Ammo.btVector3.prototype.applyQuaternion = function ( q ){

			const x = this.x(), y = this.y(), z = this.z();
			const qx = q.x(), qy = q.y(), qz = q.z(), qw = q.w();

			// calculate quat * vector
			const ix = qw * x + qy * z - qz * y;
			const iy = qw * y + qz * x - qx * z;
			const iz = qw * z + qx * y - qy * x;
			const iw = - qx * x - qy * y - qz * z;

			// calculate result * inverse quat
			this.setValue(
				ix * qw + iw * - qx + iy * - qz - iz * - qy,
				iy * qw + iw * - qy + iz * - qx - ix * - qz,
				iz * qw + iw * - qz + ix * - qy - iy * - qx
			)

		    return this;

		}

		Ammo.btVector3.prototype.applyMatrix3 = function ( m ){
			
			const x = this.x(), y = this.y(), z = this.z();
			const e = [];

			m.getRow( 0 ).toArray( e, 0 )
			m.getRow( 1 ).toArray( e, 3 )
			m.getRow( 2 ).toArray( e, 6 )

			this.setValue(
			    e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z,
			    e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z,
			    e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z
			)

			return this;
			
		}

		Ammo.btVector3.prototype.free = function (){
			//Ammo._free( this.ptr );
		}


		// QUATERNION

		Ammo.btQuaternion.prototype.set = function ( x,y,z,w ){

			this.setValue( x, y, z, w )
			return this

		}


		Ammo.btQuaternion.prototype.toArray = function ( r, n ){

			let direct = r !== undefined;

			n = n || 0;

			if( !direct ) r = [];

			r[ n ] = this.x();
			r[ n + 1 ] = this.y();
			r[ n + 2 ] = this.z();
			r[ n + 3 ] = this.w();

			//return r;
			if(!direct) return r;

		}

		Ammo.btQuaternion.prototype.fromArray = function ( r, n ){

			n = n || 0
			this.setValue( r[ n ], r[ n + 1 ], r[ n + 2 ], r[ n + 3 ] )
			return this
			
		}

		Ammo.btQuaternion.prototype.multiply = function ( q ){

			return this.multiplyQuaternions( this, q );
			
		}

		Ammo.btQuaternion.prototype.premultiply = function ( q ){

			return this.multiplyQuaternions( q, this );
			
		}

		Ammo.btQuaternion.prototype.multiplyQuaternions = function ( a, b ){

			const qax = a.x(), qay = a.y(), qaz = a.z(), qaw = a.w();
			const qbx = b.x(), qby = b.y(), qbz = b.z(), qbw = b.w();

			this.setValue(
				qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
				qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
				qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
				qaw * qbw - qax * qbx - qay * qby - qaz * qbz
			)

			return this;
			
		}

		/*Ammo.btQuaternion.prototype.invert = function (){

			const x = this.x(), y = this.y(), z = this.z(), w = this.w();
			this.setValue( -x, -y, -z, w )
			return this;

		}*/

		Ammo.btQuaternion.prototype.fromAxisAngle = function ( axis, angle ){

			var halfAngle = angle * 0.5;
			var s = Math.sin( halfAngle );
			this.setValue( axis[ 0 ] * s, axis[ 1 ] * s, axis[ 2 ] * s, Math.cos( halfAngle ) );
			return this;
			
		}

		Ammo.btQuaternion.prototype.fromAxis = function ( Axis ){

			let axis = Axis.toArray();

			if (axis[ 2 ] > 0.99999) this.setValue( 0, 0, 0, 1 );
			else if (axis[ 2 ] < -0.99999) this.setValue( 1, 0, 0, 0 );
			else {

				let ax = [ axis[ 1 ], axis[ 0 ], 0 ];
				let r = Math.acos(axis[ 2 ]);
				this.fromAxisAngle( ax, r );
			}
			return this;
			
		}

		Ammo.btQuaternion.prototype.free = function (){
			//Ammo._free( this.ptr );
		}

		// TRANSFORM

		Ammo.btTransform.prototype.set = function ( p, q ){

			this.setOrigin( p )
			this.setRotation( q )
			return this;

		}

		Ammo.btTransform.prototype.identity = function (){

			this.setIdentity();
			return this;

		}

		Ammo.btTransform.prototype.fromArray = function ( p, q, np, nq ){

			let v = this.getOrigin()
			v.fromArray( p || [0,0,0], np || 0 )
			this.setOrigin( v ) 
		
			let r = this.getRotation()
			r.fromArray( q || [0,0,0,1], nq || 0)
			this.setRotation( r )

			return this

		}

		Ammo.btTransform.prototype.toArray = function ( array, offset ){

			offset = offset || 0;

			this.getOrigin().toArray( array, offset );
			this.getRotation().toArray( array, offset + 3 );

		}

		Ammo.btTransform.prototype.getPos = function (){

			return this.getOrigin().toArray()

		}

		Ammo.btTransform.prototype.getQuat = function (){

			return this.getRotation().toArray()

		}

		Ammo.btTransform.prototype.copy = function ( t ){

			//this.op_set( t )
			this.setOrigin( t.getOrigin() );
			this.setRotation( t.getRotation() );
			return this;

		}

		Ammo.btTransform.prototype.rotationFromAxis = function ( axis ){

			let q = this.getRotation()
			q.fromAxis( axis )
			this.setRotation( q )

			return this;

		}

		Ammo.btTransform.prototype.free = function (){
			//Ammo._free( this.ptr );
		}





		//Ammo.btTransform.prototype.free = function (){
			//Ammo._free( this.ptr );
		//}

		/*class btDistanceConstraint extends Ammo.btPoint2PointConstraint {
			constructor(b1, b2, posA, posB) {
				super(b1, b2, posA, posB)
			}
		}

		Ammo.btDistanceConstraint = btDistanceConstraint


		console.log()*/

	} 

}


