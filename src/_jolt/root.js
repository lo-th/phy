//import { oimo } from '../libs/OimoPhysics.js';


export const map = new Map();

export const root = {

	Ar:null, 
	ArPos: {},


	deltaTime : 0,
	invDelta : 0,

	settings:null,
	physicsSystem:null,
	bodyInterface:null,

	world : null,
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
				case 'joint': root.physicsSystem.AddConstraint( b ); break;
				default: root.bodyInterface.AddBody( b.GetID(), Jolt.Activate ); break;
			}
		}

		map.set( b.name, b );

	}

	static remove( b ) {

		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': root.physicsSystem.RemoveConstraint( b ); break;
				default: 
				root.bodyInterface.RemoveBody( b.GetID() ); 
				root.bodyInterface.DestroyBody( b.GetID() ); 
				break;
			}
		}

		map.delete( b.name );

	}

	static stats (){
	} 

	static extends (){

		Jolt.Vec3.prototype.set = function ( x,y,z ){

			this.SetX( x );
			this.SetY( y );
			this.SetZ( z );
			return this;

		}

		Jolt.Vec3.prototype.fromArray = function ( r, n ){

			n = n || 0;
			this.set( r[ n ], r[ n + 1 ], r[ n + 2 ] )
			return this
			
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


	    Jolt.Quat.prototype.set = function ( x,y,z,w ){

	    	this.hq(x,y,z,w);
			return this;

		}

		Jolt.Quat.prototype.fromArray = function ( r, n ){

			n = n || 0;
			this.set( r[ n ], r[ n + 1 ], r[ n + 2 ], r[ n + 3 ] );
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

	    	this.set(0,0,0,1);
			return this;

		}
	}

}
