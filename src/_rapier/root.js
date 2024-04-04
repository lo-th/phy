export const map = new Map();
export const mapCollider = new Map();

export const root = {

	Ar:null, 
	ArPos: {},

	world : null,
	timestep:1/60,
	tmpStep:0,
	delta : 0,
	invDelta :0,
	gravity:null,

	key:[],

	reflow:{
		ray:[],
		stat:{
			fps:0,
			delta:0,
		},
	},



	group:{
		all:0xfffffffff,
		0: 0x00000000,
		1: 0x00010001,
		2: 0x00020002,
		3: 0x00030003,
		4: 0x00040004,
	}

};

//export const torad = Math.PI / 180;
//export const todeg = 180 / Math.PI;

export class Utils {

	static clear() {

		map.clear()
		mapCollider.clear()

	}

	static byName( name ) {

		if ( !map.has( name ) ) return null;
		return map.get( name );

	}

	static add( b ) {
		
		/*if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': root.world.addJoint( b ); break;
				default: root.world.addRigidBody( b ); break;
			}
		}*/

		map.set( b.name, b )

	}

	static remove( b ) {

		if( b.type !== 'ray' &&  b.type !== 'contact' ){
			switch( b.type ){
				case 'joint': 

				//console.log('joint remove', b)

				//root.world.getImpulseJoint( b )
				root.world.removeImpulseJoint( b ) 
				break;
				case 'body': case 'solid':
				if( b.isValid() ){

					let i = b.numColliders()
					while(i--) mapCollider.delete( b.collider(i) )
					root.world.removeRigidBody( b )

				}
				
				break;
				//default: root.world.removeRigidBody( b ); break;
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


export class Vec3 {

	constructor ( x=0, y=0, z=0 ) {

		this.x = x
		this.y = y
		this.z = z

	}

	copy( v ){
		this.x = v.x
		this.y = v.y
		this.z = v.z
		return this
	}

	toArray ( r, n ){

		let direct = r !== undefined;

		n = n || 0;
		//r = r || [];

		if( !direct ) r = [];

		r[ n ] = this.x
		r[ n + 1 ] = this.y
		r[ n + 2 ] = this.z
		if(!direct) return r

	}

	fromArray ( r, n ){

		n = n || 0;

		this.x = r[ n ]
		this.y = r[ n + 1 ]
		this.z = r[ n + 2 ]
		return this
		
	}

	sub(v){

		this.x -= v.x
		this.y -= v.y
		this.z -= v.z
		return this

	}

	add(v) {

		this.x += v.x
		this.y += v.y
		this.z += v.z
		return this

	}

	set( x,y,z ) {

		this.x = x
		this.y = y
		this.z = z
		return this

	}

	length(){
		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
	}

	distanceTo( v ) {

		const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z
		return Math.sqrt(dx * dx + dy * dy + dz * dz)
			
	}

	multiplyScalar( scalar ) {

		this.x *= scalar
		this.y *= scalar
		this.z *= scalar
		return this

	}

	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar )

	}

	normalize() {

		return this.divideScalar( this.length() || 1 )

	}


}

export class Quat {

	constructor (x=0,y=0,z=0,w=1) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;
	}

	copy( v ){
		this.x = v.x;
		this.y = v.y;
		this.z = v.z;
		this.w = v.w;
		return this
	}

	toArray ( r, n ){

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

	fromArray ( r, n ){

		n = n || 0;

		this.x = r[ n ];
		this.y = r[ n + 1 ];
		this.z = r[ n + 2 ];
		this.w = r[ n + 3 ];

		return this;
		
	}

	set ( x,y,z,w ){

		this.x = x;
		this.y = y;
		this.z = z;
		this.w = w;

		return this;

	}
}