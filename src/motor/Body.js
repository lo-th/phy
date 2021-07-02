import { Item } from '../core/Item.js';
import { Utils, root, math, geo, mat } from './root.js';
import { Object3D, Vector3, Group, Mesh, BufferGeometry, CylinderGeometry } from '../../build/three.module.js';
import { SphereBox, CapsuleGeometry, ChamferCyl, ChamferBox, createUV  } from '../jsm/lth/GeometryExtent.js';
import { ConvexGeometry } from '../jsm/geometry/ConvexGeometry.js';

export class Body extends Item {

	constructor () {

		super()

		this.Utils = Utils
		this.type = 'body'
		this.extraConvex = false

	}

	step ( AR, N ) {

		let i = this.list.length, b, n, a;
		
		while( i-- ){

			b = this.list[i];

			n = N + ( i * 8 );

			// update only when physics actif
			if( !b.actif ){
				a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7]
				if( a===0 ) continue
				else b.actif = true
			}


		    // update position and rotation
			b.sleep = AR[n] > 0 ? false : true;
			b.position.fromArray( AR, n + 1 );
	        b.quaternion.fromArray( AR, n + 4 );
	        if( !b.auto ) b.updateMatrix();


	        // update default material
	        if( b.defMat ){
			    if ( !b.sleep && b.material.name === 'sleep') b.material = mat.body;
			    if ( b.sleep && b.material.name === 'body') b.material = mat.sleep;
			}

		}

	}

	///

	geometry ( o = {}, b, material ) {

		let g, i, n;
		let t = o.type, s = o.size;
		let noScale = false, custom = false;

		if( o.radius ){
			if( t === 'box' ) t = 'ChamferBox';
		    if( t === 'cylinder' ) t = 'ChamferCyl';
		}

		if( o.geometry ){
			if( t === 'convex' ) o.shape = o.geometry;
			else t = 'direct';
		} 


		if( this.extraConvex && ( o.type==='cylinder' || o.type==='cone') ){
			// convert geometry to convex if not in physics
	    	let geom = new CylinderGeometry( o.type==='cone' ? 0 : o.size[ 0 ], o.size[ 0 ], o.size[ 1 ], o.segment || 24, 1 );
	    	o.v = math.getVertex( geom )
	    	o.type = 'convex'
	    }

		switch( t ){

			case 'direct':

			    g = o.geometry.clone();
			    if( o.size ) g.scale( o.size[0], o.size[1], o.size[2] );
			    custom = true
			    noScale = true

			break;

			case 'convex':

			if( o.v ){ 

				if( o.nogeo ) g = new BufferGeometry();
				else {
					let vv = [];
					i = Math.floor( o.v.length/3 );
					while( i-- ){
						n = i*3;
						vv.push( new Vector3( o.v[n], o.v[n+1], o.v[n+2] ) )
					}

					g = new ConvexGeometry( vv );
				}
				custom = true;
				noScale = true;
			}

			if( o.shape ){
				g = o.shape.clone();
				if( o.size ) g.scale( o.size[0], o.size[0], o.size[0] );
				//o.v = g.attributes.position.array;
				o.v = math.getVertex( g )
				//o.index = math.getIndex( g );

				custom = true;
				noScale = true;
			}

			break;

			case 'mesh':

				g = o.shape.clone()
				if( o.size ) g.scale( o.size[0], o.size[0], o.size[0] )

				//if( root.engine ==='OIMO' || root.engine ==='AMMO'){
				if( root.engine ==='OIMO' ){
					o.v = math.getVertex( g, true )
					o.index = null
				} else {
					o.v = math.getVertex( g )
				    o.index = math.getIndex( g )
				}
				

				custom = true
				noScale = true
			

			break;

			/*case 'highSphere':
				g = new SphereBox( s[ 0 ] );
				custom = true;
				noScale = true;
				o.type = 'sphere';
			break;*/

			case 'capsule':
				g = new CapsuleGeometry( s[ 0 ], s[ 1 ], o.seg || 24 );

				createUV( g );

				custom = true;
				noScale = true;
			break;

			case 'ChamferBox':
				g = new ChamferBox( s[ 0 ], s[ 1 ], s[ 2 ], o.radius, o.seg || 24 );
				custom = true;
				noScale = true;
			break;

			case 'ChamferCyl':
				g = new ChamferCyl( s[ 0 ], s[ 0 ], s[ 1 ], o.radius, o.seg || 24 );
				custom = true;
				noScale = true;
			break;

			default:
			    g = geo[ t ];
			break;

		}

		if( t==='highSphere' ) o.type = 'sphere'

		//g.rotateZ( -Math.PI*0.5 );

		let m = new Mesh( g, material );

		if( o.localRot ) o.localQuat = math.toQuatArray( o.localRot );
		if( o.localPos ) m.position.fromArray( o.localPos );
		if( o.localQuat ) m.quaternion.fromArray( o.localQuat );

    	if( !noScale ) m.scale.fromArray( o.size );

    	if( custom ) root.tmpGeo.push( g );

    	// add or not add
    	if( !o.meshRemplace || o.debug ) b.add( m );

    	if(o.shape) delete ( o.shape );
    	if(o.geometry) delete ( o.geometry );

	}

	add ( o = {} ) {

		let name = this.setName( o );

		o.type = o.type === undefined ? 'box' : o.type;

		// position
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;

		// rotation is in degree or Quaternion
	    o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
	    if( o.rot !== undefined ){ o.quat = math.toQuatArray( o.rot ); delete ( o.rot ); }
	    if( o.meshRot !== undefined ){ o.meshQuat = math.toQuatArray( o.meshRot ); delete ( o.meshRot ); }

	    //o.size = o.size == undefined ? [ 1, 1, 1 ] : math.correctSize( o.size );
	    o.size = math.autoSize( o.size, o.type );
	    if(o.meshScale) o.meshScale = math.autoSize( o.meshScale )

	    let material, noMat = false;

	    if ( o.material !== undefined ) {
	    	if ( o.material.constructor === String ) material = mat[o.material];
	    	else material = o.material;
	    } else {
	    	noMat = true
	    	material = mat[this.type]
	    }

	    if( o.material ) delete ( o.material );

	    let b = new ExtraGroup();

	    if( o.mesh ){

	    	let mm = o.noClone ? o.mesh : o.mesh.clone()

	    	mm.position.fromArray( o.meshPos || [0,0,0]);
	    	if( o.meshQuat ) mm.quaternion.fromArray( o.meshQuat )
	    	if( o.meshScale ) mm.scale.fromArray( o.meshScale )
	    	

	    	//mm.receiveShadow = true
	    	//mm.castShadow = true

	    	if( !noMat ) mm.material = material

	    	o.meshRemplace = true;
	    	b.add( mm )

	    	delete ( o.mesh );

	    }

	    switch( o.type ){

	    	case 'null': break;

	    	case 'compound':

	    	    for ( var i = 0, n; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

					n.type = n.type === undefined ? 'box' : n.type;
					//n.size = n.size === undefined ? [ 1, 1, 1 ] : math.correctSize( n.size );
					n.size = math.autoSize( n.size, n.type );

					if( n.pos ) n.localPos = n.pos;
					if( n.rot !== undefined ){ n.quat = math.toQuatArray( n.rot ); delete ( n.rot ); }
					if( n.quat ) n.localQuat = n.quat;
					
					n.debug = o.debug || false;
					n.meshRemplace = o.meshRemplace;

					this.geometry( n, b, material );

				}

	    	break;
	    	default:

			    this.geometry( o, b, material );

			break;

	    }

	    
	    
	    b.name = name;
	    b.type = this.type;
	    b.size = o.size;
		b.shapetype = o.type;
		if( !noMat ) b.material = material

		b.defMat = false;
		if(b.material) b.defMat = b.material.name === 'body'

		b.visible = o.visible !== undefined ? o.visible : true

	    if( o.renderOrder ) b.renderOrder = o.renderOrder

	    //let m = new Mesh( geo[o.type], mat[this.type] );
	    //m.scale.fromArray( o.size );

	    //b.add( m );

	    b.receiveShadow = o.shadow !== undefined ? o.shadow : true;
	    b.castShadow = o.shadow !== undefined ? o.shadow : true;

	    if( !b.visible ){
	    	b.receiveShadow = false;
	        b.castShadow = false;
	    }

	    

		// apply option
		this.set( o, b );

		// add to world
		this.addToWorld( b );

		// add to worker 
		root.post( { m:'add', o:o } );

		return b;

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return;

		if(o.pos) b.position.fromArray( o.pos );
	    if(o.quat) b.quaternion.fromArray( o.quat );

	    b.auto = o.auto || false;

	    if( !b.auto ) {
	    	b.matrixAutoUpdate = false;
		    b.updateMatrix();
		}

	}

}




export class ExtraGroup extends Object3D {

    constructor() {

	    super();

		this.type = '';

		this.shapetype = 'box';
		this.data = {};
		this._size = new Vector3();

		this.defMat = false;
		this.actif = false;

		// only for high mesh
		this.mesh = null;

		// if object is link by joint
		this.linked = [];

		Object.defineProperty( this, 'size', {
		    get: function() { return this._size.toArray(); },
		    set: function( value ) { this._size.fromArray( value ); }
		});

		Object.defineProperty( this, 'material', {
		    get: function() { 
		    	let m = null;
		    	if( this.children[0] ) m = this.children[0].material;
		    	return m;
		    },
		    set: function( value ) { 
		    	this.children.forEach( function ( b ) { if( b.isMesh ) b.material = value; })
		    }
		});

		Object.defineProperty( this, 'receiveShadow', {
		    get: function() { return this.children[0].receiveShadow; },
		    set: function( value ) { this.children.forEach( function ( b ) {  if( b.isMesh ) b.receiveShadow = value; }); }
		});

		Object.defineProperty( this, 'castShadow', {
		    get: function() { return this.children[0].castShadow; },
		    set: function( value ) { this.children.forEach( function ( b ) {  if( b.isMesh ) b.castShadow = value; }); }
		});
	}


	select ( b ) {

    }


}

ExtraGroup.prototype.isGroup = true;