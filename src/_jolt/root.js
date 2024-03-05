//import { oimo } from '../libs/OimoPhysics.js';


export const map = new Map();
export const contactmap = new Map();

export const root = {

	// Object layers
	LAYER_NON_MOVING: 0,
	LAYER_MOVING: 1,
	LAYER_ALL: 0|1,

	Ar:null, 
	ArPos: {},


	deltaTime : 0,
	invDelta : 0,

	//settings:null,
	physicsSystem:null,
	bodyInterface:null,
	//broadPhase:null,
	//narrowPhase:null,

	world : null,
	groupFilter: null,

	
	delta : 0,
	tmpStep:0,
	gravity:null,
	key:[],

	reflow:{
		ray:[],
		stat:{
			fps:0,
			delta:0,
		},
	}

};

/*export const pool = {

	tmpv:null,
	tmpq:null,

	v3:(ar,n) => { pool.tmpv = new Jolt.RVec3().fromArray(ar,n); return pool.tmpv; },
	q:(ar,n) => { pool.tmpq = new Jolt.RVec3().fromArray(ar,n); return pool.tmpq; },
	free:() => {
		if(pool.tmpv) Jolt.destroy(pool.tmpv);
		if(pool.tmpq) Jolt.destroy(pool.tmpq);
		pool.tmpv = null;
		pool.tmpq = null;
	}
	
}*/

export const Utils = {

	clear:() => {

		map.clear();
		contactmap.clear();

	},

	byName:( name ) => {

		if ( !map.has( name ) ) return null;
		return map.get( name );

	},

	byContact:( name ) => ( contactmap.has( name ) ),
	clearContact:() => { contactmap.clear() },
	addContact:( name, v = {} ) => { if ( !Utils.byContact(name) ) contactmap.set( name, v ); },
	removeContact:( name ) => { contactmap.delete( name ); },

	add:( b ) => {
		
		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': root.physicsSystem.AddConstraint( b ); break;
				case 'body': case 'solid': root.bodyInterface.AddBody( b.GetID(), Jolt.EActivation_Activate ); break;
			}
		}

		map.set( b.name, b );

	},

	remove:( b ) => {

		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'terrain': b.release(); break;
				case 'joint': root.physicsSystem.RemoveConstraint( b ); break;
				case 'body': case 'solid': 

				root.bodyInterface.RemoveBody( b.GetID() ); 
				root.bodyInterface.DestroyBody( b.GetID() ); 
				//let s = b.GetShape()
				//console.log(s)
				//if(s) Jolt.destroy(s);
				break;
			}
		}

		map.delete( b.name );

	},

	stats:() => {
	}, 

	extends:() => {

		Jolt.Vec3.prototype.set = function ( x,y,z ){

			this.Set( x, y, z );
			return this;

		}

		Jolt.Vec3.prototype.clone = function ( v ){

			return new Jolt.RVec3( v.GetX(), v.GetY(), v.GetZ() );

		}

		Jolt.Vec3.prototype.fromArray = function ( r, n ){

			n = n || 0;
			this.Set( r[ n ], r[ n + 1 ], r[ n + 2 ] )
			return this;
			
		}

		Jolt.Vec3.prototype.toArray = function ( r, n ){

			let direct = r !== undefined
			n = n || 0
			if( !direct ) r = []

			r[ n ] = this.GetX();
			r[ n + 1 ] = this.GetY();
			r[ n + 2 ] = this.GetZ();

			if(!direct) return r

		}

	////////////////

		Jolt.RVec3.prototype.set = function ( x,y,z ){

			this.Set( x, y, z );
			return this;

		}

		Jolt.RVec3.prototype.clone = function ( v ){

			return new Jolt.RVec3( v.GetX(), v.GetY(), v.GetZ() );

		}

		Jolt.RVec3.prototype.fromArray = function ( r, n ){

			n = n || 0;
			this.Set( r[ n ], r[ n + 1 ], r[ n + 2 ] )
			return this;
			
		}

		Jolt.RVec3.prototype.toArray = function ( r, n ){

			let direct = r !== undefined
			n = n || 0
			if( !direct ) r = []

			r[ n ] = this.GetX();
			r[ n + 1 ] = this.GetY();
			r[ n + 2 ] = this.GetZ();

			if(!direct) return r

		}


	    Jolt.Quat.prototype.set = function ( x,y,z,w ){

	    	this.Set( x, y, z, w );
			return this;

		}

		Jolt.Quat.prototype.fromArray = function ( r, n ){

			n = n || 0;
			this.Set( r[ n ], r[ n + 1 ], r[ n + 2 ], r[ n + 3 ] );
			return this;
			
		}

		Jolt.Quat.prototype.toArray = function ( r, n ){

			let direct = r !== undefined
			n = n || 0
			if( !direct ) r = [];

			r[ n ] = this.GetX();
			r[ n + 1 ] = this.GetY();
			r[ n + 2 ] = this.GetZ();
			r[ n + 3 ] = this.GetW();

			if(!direct) return r;

		}

		Jolt.Quat.prototype.identity = function (){

	    	this.Set(0,0,0,1);
			return this;

		}

		Jolt.Mat44.prototype.toArray = function ( r, n ){

			let direct = r !== undefined
			n = n || 0
			if( !direct ) r = [];

			let t = this.GetTranslation().toArray();
			let q = this.GetQuaternion().toArray();
			//let q = this.GetRotation();//?

			//console.log('yo', t, q)

			/*r[ n ] = this.GetX();
			r[ n + 1 ] = this.GetY();
			r[ n + 2 ] = this.GetZ();
			r[ n + 3 ] = this.GetW();

			if(!direct) return r;*/

			return [t, q];

		}
	}

}
