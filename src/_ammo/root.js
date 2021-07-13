
export const map = new Map();

export const root = {

	world : null,
	delta : 0,
	substep:1,

	flow:{
		tmp:[],
		key:[],
	},

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
				case 'joint': root.world.addConstraint( b, !b.collision ); break;
				case 'solid': root.world.addCollisionObject( b, b.group, b.mask ); break;
				default: root.world.addRigidBody( b, b.group, b.mask ); break;
			}
		}

		map.set( b.name, b );

	}

	static remove( b ) {

		if( b.type !== 'ray' && b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': root.world.removeConstraint( b ); Ammo.destroy( b.formA ); Ammo.destroy( b.formB ); break;
				case 'solid': root.world.removeCollisionObject( b ); break;
				default: root.world.removeRigidBody( b ); break;

			}

			Ammo.destroy( b );

		}

		map.delete( b.name );

	}

	static getConvexVolume ( v ) {

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

	}

	static stats (){
	}

	static extends (){

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

		Ammo.btVector3.prototype.mul = function (){

			// for box volume calcylation
			return this.x() * this.y() * this.z()
			
		}

		Ammo.btVector3.prototype.multiplyScalar = function ( s ){

			this.setValue( this.x()*s, this.y()*s, this.z()*s )
			return this
			
		}

		Ammo.btVector3.prototype.divideScalar = function ( s ){

			return this.multiplyScalar( 1/s )
			
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


		// QUAT

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

		// TRANS

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

		Ammo.btTransform.prototype.getQuat = function (  ){

			return this.getRotation().toArray()

		}

		Ammo.btTransform.prototype.copy = function ( t ){

			this.op_set( t )
			//this.setOrigin( t.getOrigin() );
			//this.setRotation( t.getRotation() );
			return this;

		}

		Ammo.btTransform.prototype.rotationFromAxis = function ( axis ){

			let q = this.getRotation()
			q.fromAxis( axis )
			this.setRotation( q )

			return this;

		}

	} 

}