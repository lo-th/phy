import { Item } from '../core/Item.js';
import { Utils, root } from './root.js';

// AMMO TERRAIN

export class Terrain extends Item {

	constructor() {

		super()

		this.type = 'terrain'
		this.Utils = Utils

	}

	add ( o ) {

		let name = this.setName( o )
		let t = new LandScape( o )
		this.addToWorld( t, o.id )

	}

	set ( o = {}, t = null ) {

		if( t === null ) t = this.byName( o.name )
		if( t === null ) return
		t.set( o )

	}

}


// AMMO LANDSCAPE

export class LandScape {

	constructor( o ) {

		this.type = 'terrain';
		this.name = o.name;

		this.needUpdate = false;
		this.heightField = null;
		this.t = new Ammo.btTransform()
		this.data = null

		this.init(o);

	}

	init( o ) {

		const size = o.size;
		const squarSize = [ size[0] / (o.sample[0]-1), size[2] / (o.sample[1]-1) ];

		this.fullSample = [o.sample[0], o.sample[1]]

		this.setData( o )
		this.update()

		let margin = o.margin === undefined ? 0.02 : o.margin;
		let heightScale = o.heightScale === undefined ? 1 : o.heightScale;
		let upAxis = o.upAxis === undefined ? 1 : o.upAxis;
		let hdt = "PHY_FLOAT";
		let flipEdge = false;

		let shape = new Ammo.btHeightfieldTerrainShape( o.sample[ 0 ], o.sample[ 1 ], this.data, heightScale, - size[ 1 ]*2, size[ 1 ]*2, upAxis, hdt, flipEdge );

		let p = new Ammo.btVector3( squarSize[0], 1, squarSize[1] )
		shape.setLocalScaling( p );
		shape.setMargin( margin );

		let mass = o.mass === undefined ? 0 : o.mass;
		let friction = o.friction === undefined ? 0.5 : o.friction;
		let restitution = o.restitution === undefined ? 0 : o.restitution;
		let flag = o.flag === undefined ? 1 : o.flag;
		this.group = o.group !== undefined ? o.group : 2
		this.mask = o.mask  !== undefined  ? o.mask : -1

		this.t.fromArray( o.pos, o.quat )

		p.set( 0, 0, 0 );
		//shape.calculateLocalInertia( mass, p1 );
		let motionState = new Ammo.btDefaultMotionState( this.t );
		let rbInfo = new Ammo.btRigidBodyConstructionInfo( mass, motionState, shape, p );
		rbInfo.set_m_friction( friction );
	    rbInfo.set_m_restitution( restitution );

	    this.body = new Ammo.btRigidBody( rbInfo );
	    this.body.setCollisionFlags( flag );


	    //root.world.addCollisionObject( this.body, b.group, b.mask )

	}

	setData ( o ) {

		this.tmpData = o.heightData;
		this.nDataBytes = this.tmpData.length * this.tmpData.BYTES_PER_ELEMENT;
		this.needsUpdate = true;

	}

	update() {

		if ( !this.needsUpdate ) return;

		this.malloc()
		//self.postMessage( { m:'terrain', o: { name: this.name } } );
		this.needsUpdate = false;
		this.tmpData = null;

	}

	malloc () {

		//var nDataBytes = this.tmpData.length * this.tmpData.BYTES_PER_ELEMENT;
		if ( this.data === null ) this.data = Ammo._malloc( this.nDataBytes );
		let i = this.tmpData.length, p=0, p2=0
		while(i--){
			// write 32-bit float data to memory
			Ammo.HEAPF32[ this.data + p2 >> 2 ] = this.tmpData[ p ];
			p++
			// 4 bytes/float
			p2 += 4;

		}

		//this.dataHeap = new Uint8Array( Ammo.HEAPF32.buffer, this.data, this.nDataBytes );
		//this.dataHeap.set( new Uint8Array( this.tmpData.buffer ) );

	}

	release () {

		//console.log('clear terrain')

		root.world.removeCollisionObject( this.body );
		Ammo.destroy( this.body );
		//Ammo._free( this.data );
		//Ammo.destroy( this.data );

		this.body = null;
		this.data = null;
		this.tmpData = null;
		this.dataHeap = null;

	}

	set (o) {

		if(o.heightData){
			this.setData( o )
			this.update()
		}

	}

}