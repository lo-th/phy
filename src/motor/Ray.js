import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, todeg } from '../core/MathTool.js';

import { Utils, root } from './root.js';
import { Mat } from './base/Mat.js';

import {
	Line, LineSegments, BufferGeometry,
    Object3D, Float32BufferAttribute,
    Matrix4, Quaternion, Vector3
} from 'three';

// THREE RAY

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'ray';
		this.iType = 'ray';

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, r, n;

		while( i-- ){

			r = this.list[i];
			n = N + ( i * Num.ray );
			r.update( AR, n, root.reflow.ray[i] || null );

		}

	}

	add ( o = {} ) {

		let name = this.setName( o );

		let r = new ExtraRay( o );

		r.visible = o.visible !== undefined ? o.visible : true

		// add to world
		this.addToWorld( r, o.id )

		if(o.parent){
			if( typeof o.parent !== 'string' ) o.parent = o.parent.name;
		}

		if( o.callback ) delete o.callback

		

		// add to worker 
		root.post( { m:'add', o:o } );

		return r;

	}

	set ( o = {}, r = null ) {

		if( r === null ) r = this.byName( o.name );
		if( r === null ) return;

		r.setRay(o)

	}

}


export class ExtraRay extends Line {

	constructor( o = {} ) {

	    super( new BufferGeometry(), Mat.get('line') );

	    this.isRay = true;

	    this.data = {

			hit:false,
			body: '',
			point: [0,0,0],
			normal: [0,0,0],
			distance: 0,
			angle:0,
			parent:null

		};

	    this.type = 'ray';
	    this.name = o.name;

	    this.parentMesh = null;
	    if(o.parent){
	    	this.parentMesh = typeof o.parent === 'string' ?  Utils.byName( o.parent ) : o.parent;
	    	this.data.parent = this.parentMesh;
	    }

	    this.callback = o.callback || null;

	    // color
		this.c0 = [ 0.1, 0.1, 0.3 ];
		this.c1 = [ 0.1, 0.4, 0.6 ];
		this.c2 = [ 1.0, 0.1, 0.1 ];
		this.c3 = [ 0.1, 1.0, 0.1 ];

	    this.begin = new Vector3();
	    this.end = new Vector3(0,1,0);
	    this.tmp = new Vector3();
	    this.vnormal = new Vector3();
	    this.vv1 = new Vector3();
	    this.vv2 = new Vector3();

	    this.fullDistance = 0;

	    this.setRay( o )

	    const positions = [0,0,0, 0,0,0, 0,0,0];
	    const colors = [0,0,0, 0,0,0, 0,0,0];

	    //this.geometry = new BufferGeometry();
	    this.geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    this.geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    //this.geometry.computeBoundingSphere();

	    this.vertices = this.geometry.attributes.position;
	    this.colors = this.geometry.attributes.color;
	    this.local = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

	    this.matrixAutoUpdate = false;
	    this.frustumCulled = false;

	}

	setRay( o ){

		if( o.begin ) this.begin.fromArray( o.begin );
	    if( o.end ) this.end.fromArray( o.end );
	    this.fullDistance = this.begin.distanceTo( this.end );

	}

	update ( r, n = 0, body = null ) {

		this.data.hit = r[n] !== 0 ? true : false;
		this.data.body = body ? body : '';

		this.data.distance = r[n+1]

		if( this.data.hit ){

			this.local[0] = r[n+2];
			this.local[1] = r[n+3];
			this.local[2] = r[n+4];

			this.tmp.fromArray( r, n+5 );
			this.vnormal.fromArray( r, n+8 );

			this.data.point = this.tmp.toArray();
			this.data.normal = this.vnormal.toArray();
			//this.data.distance = this._begin.distanceTo( this.tmp )

			this.tmp.toArray( this.local, 3 );
			this.vv1.fromArray( this.local ).sub(this.tmp).normalize(); 
			this.tmp.addScaledVector( this.vnormal, this.fullDistance - this.data.distance );
			this.tmp.toArray( this.local, 6 );

			
			//vv1.fromArray( r, n+5 ); 

			this.data.angle = Math.floor( MathTool.angleTo( this.vv1.toArray(), this.data.normal ) * todeg );
			//let angle = MathTool.angleTo( [this.local[0], this.local[2], this.local[2]], [this.local[3], this.local[4], this.local[5]] ) * todeg
			//console.log(this.data.angle)

		} else {
			if( this.parentMesh ){
				//this.data.parent = this.parentMesh;
				//this.parentMesh.updateWorldMatrix(false,false )
				const mtx = this.parentMesh.matrixWorld;
				this.tmp.copy( this.begin ).applyMatrix4(mtx).toArray( this.local, 0 );
				this.tmp.copy( this.end ).applyMatrix4(mtx);
				this.tmp.toArray( this.local, 3 );
				this.tmp.toArray( this.local, 6 );
			} else {
				this.begin.toArray( this.local, 0 );
				this.end.toArray( this.local, 3 );
				this.end.toArray( this.local, 6 );
			}
		}

		this.updateGeometry();
		this.updateMatrix();

		if(this.callback) this.callback( this.data );

	}

	dispose(){
		
		this.callback = null;
		this.parentMesh = null;
		this.data = {}
		this.geometry.dispose();

	}

	raycast(){
		return
	}

	updateGeometry(){

		if ( !this.visible ) return;

		let v = this.vertices.array;
		let c = this.colors.array;
		let l = this.local;
		let hit = this.data.hit;
		let n, d, i;
		let c1 = hit ? this.c2 : this.c1;
		let c2 = hit ? this.c3 : this.c1;

		c[ 3 ] = c1[0];
		c[ 4 ] = c1[1];
		c[ 5 ] = c1[2];

		c[ 6 ] = c2[0];
		c[ 7 ] = c2[1];
		c[ 8 ] = c2[2];

		v[ 0 ] = l[ 0 ];
		v[ 1 ] = l[ 1 ];
		v[ 2 ] = l[ 2 ];

		v[ 3 ] = l[ 3 ];
		v[ 4 ] = l[ 4 ];
		v[ 5 ] = l[ 5 ];
		
		v[ 6 ] = l[ 6 ];
		v[ 7 ] = l[ 7 ];
		v[ 8 ] = l[ 8 ];

		this.vertices.needsUpdate = true;
	    this.colors.needsUpdate = true;
	}

}

//ExtraRay.prototype.isRay = true;