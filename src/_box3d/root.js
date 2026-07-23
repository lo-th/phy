
export const map = new Map();
export const mapId = new Map();
export const contactmap = new Map();

export const root = {

	Ar:null, 
	ArPos: {},

	needTrigger:false,
	needContact:false,

	world : null,
	bodyRef: null,
	queryCollector: null,
	timestep : 1/60,
	delta : 0,
	ms:0,
	deltaTime : 0,
	tmpStep:0,
	substep:1,
	key:[],
	gravity:[0,9.81,0],

	reflow:{
		ray:[],
		point:{},
		contact:{},
		velocity:{},
		stat:{ fps:0, delta:0, ms:0 },
	}

};

/*export const torad = Math.PI / 180;
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
}*/

export const Utils = {

	clear:() => {

		map.clear()
		mapId.clear()
		contactmap.clear()

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

		if(b.type === 'body' || b.type === 'solid' || b.type === 'terrain' ){
			mapId.set( b.index1, b )
		}

		map.set( b.name, b )

	},

	remove:( b ) => {

		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				//case 'terrain': b.release(); break;
				case 'joint':
				b3.b3DestroyJoint(b.joint, true);
				break;
				default: 

				/*if(b.type==='terrain'){
					if(b.geometry) havok.HP_Shape_Release(b.geometry);
					
				}*/

				//let s = b3.b3Body_GetShapes(b)
				//b3.b3DestroyShape(s, true);
				//b3.b3DestroyMesh(b);

				// Remove a body from the world.
				b3.b3DestroyBody(b);
				//if(b.compound) b.compound.delete();

				
				//havok.HP_World_RemoveBody(root.world, b); 
				// Releases a body, potentially freeing the memory. Will not remove from the world if body is in use.
				//havok.HP_Body_Release(b)
				break;
			}
		}

		if(b.index1) map.delete( b.index1 );
		map.delete( b.name );


	},

	toVec:(ar)=>( {x:ar[0], y:ar[1],z:ar[2]} ),

	vToAr:(v)=>( [v.x, v.y, v.z] ),

	toQuat:(ar)=>( { v:{ x:ar[0], y: ar[1], z: ar[2] }, s: ar[3] } ),

	qToAr:(q)=>( [ q.v.x, q.v.y, q.v.z, q.s ] ),

	transToAr: (t)=>([
		[ t.p.x, t.p.y, t.p.z ],
		[ t.q.v.x, t.q.v.y, t.q.v.z, t.q.s ]
	]),
	
	toTrans: (ar)=>({ 
		p:{ x:ar[0][0], y:ar[0][1], z:ar[0][2] }, 
		q:{ v:{ x:ar[1][0], y: ar[1][1], z: ar[1][2] }, s: ar[1][3] } 
	}),

	stats: () => {
	},

	extends: () => {
	},


	// contact

	byContact:( name ) => {

		if ( !contactmap.has( name ) ) { return false; }
		else return true;

		//if ( !contactmap.has( name ) ) { return null; }
		//else return contactmap.get( name );

	},

	clearContact:() => {

		contactmap.clear();

	},

	addContact:( name, v = {} ) => {

		//if ( !contactmap.has( name ) ) 
			contactmap.set( name, v );

	},

	removeContact:( name ) => {

		//if ( contactmap.has( name ) ) 
			contactmap.delete( name );

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
