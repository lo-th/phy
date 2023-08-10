import * as CANNON from '../libs/cannon-es.js'


export const map = new Map();

export const root = {

	Ar:null, 
	ArPos: {},

	world : null,
	delta : 0,

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

export const Utils = {

	clear: () => {

		map.clear()

	},

	byName: ( name ) => {

		if ( !map.has( name ) ) return null;
		return map.get( name );

	},

	add: ( b ) => {
		
		if( b.types !== 'ray' &&  b.types !== 'contact' ){
			switch( b.types ){
				case 'joint': root.world.addConstraint( b );  break;
				default: root.world.addBody( b ); break;
			}
		}

		map.set( b.name, b );

	},

	remove: ( b ) => {

		if( b.types !== 'ray' &&  b.types !== 'contact' ){
			switch( b.types ){
				case 'joint': root.world.removeConstraint( b ); break;
				default: root.world.removeBody( b ); break;
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

	}

}


export const Vec3 = CANNON.Vec3;
export const Quat = CANNON.Quaternion;
//export const World = CANNON.World;

//export const RigidBody = CANNON.Body

//export const BoxGeometry = CANNON.Box
//export const SphereGeometry = CANNON.Sphere
//export const PlaneGeometry = CANNON.Plane

//export const Material = CANNON.Material

// CLASS EXTEND

/*Transform.prototype.fromArray = function ( p, q, np, nq ){

	nq = np || 0;
	nq = nq || 0;

	if( p ) this._position.fromArray( p, np );
	if( q ) this._rotation.fromQuat( { x:q[ nq ], y:q[ nq+1 ], z:q[ nq+2 ], w:q[ nq+3 ] } );

}*/

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


Vec3.prototype.fromArray = function ( r, n ){

	n = n || 0;

	this.x = r[ n ];
	this.y = r[ n + 1 ];
	this.z = r[ n + 2 ];

	return this;
	
}
/*Vec3.prototype.set = function ( x,y,z ){

	this.x = x;
	this.y = y;
	this.z = z;

	return this;

}*/


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

/*Quat.prototype.set = function ( x,y,z,w ){

	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;

	return this;

}*/