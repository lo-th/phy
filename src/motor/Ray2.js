import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, math, Mat } from './root.js';
import {
	Line, LineSegments, BufferGeometry,
    Object3D, Float32BufferAttribute,
    Matrix4, Quaternion, Vector3
} from 'three';


import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';

// THREE RAY

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'ray'
		//this.mtx = new Matrix4()
		//this.mtx2 = new Matrix4()

	}

	step ( AR, N ) {

		let i = this.list.length, r, n;
		
		while( i-- ){

			r = this.list[i];

			n = N + ( i * Num.ray );

			r.update( AR, n, root.reflow.ray[i] || null );

			// re send start end
			//r.begin.toArray( AR, n+1 );
			//r.end.toArray( AR, n+4 );

		}

	}

	/// 0, 0,  0,0,0,   0,0,0,   0,0,0

	add ( o = {} ) {

		let name = this.setName( o );

		

		//if( o.link && typeof o.link !== 'string') o.link = o.link.name;

		let r = new ExtraRay( o, Mat.get('ray') );

		r.visible = o.visible !== undefined ? o.visible : true

		

		// add to world
		this.addToWorld( r, o.id )

		if(o.parent){
			if( typeof o.parent !== 'string' ) o.parent = o.parent.name
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

		//if( o.begin !== undefined ) r._begin.fromArray( o.begin )
		//if( o.end !== undefined ) r._end.fromArray( o.end )

	}

}


export class ExtraRay extends Line2 {

	constructor( o = {}, material = undefined ) {

	    super(  new BufferGeometry(), material);

	    this.data = {

			hit:false,
			body: '',
			point: [0,0,0],
			normal: [0,0,0],
			distance: 0,

		};

	    this.type = 'ray';
	    this.name = o.name;

	    this.parentMesh = null
	    if(o.parent){
	    	this.parentMesh = typeof o.parent === 'string' ?  Utils.byName( o.parent ) : o.parent
	    }

	    this.callback = o.callback || function () {};

	    // color
		this.c0 = [ 0.1, 0.1, 0.3 ];
		this.c1 = [ 0.1, 0.4, 0.6 ];
		this.c2 = [ 1.0, 0.1, 0.1 ];
		this.c3 = [ 1.0, 0.8, 0.1 ];

	    this.begin = new Vector3()
	    this.end = new Vector3(0,1,0)
	    this.fullDistance = 0

	    this.setRay( o )

	    this.tmp = new Vector3();
	    this.normal = new Vector3();
	    
	    const positions = [0,0,0, 0,0,0, 0,0,0];
	    const colors = [0,0,0, 0,0,0, 0,0,0];
        this.vertices = positions;
	    this.colors = colors;
	    //this.geometry = new BufferGeometry();
	    this.geometry = new LineGeometry()

	    this.geometry.setPositions( this.vertices );
		this.geometry.setColors( this.colors );
		this.computeLineDistances();
	    
	   // this.geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	   // this.geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    //this.geometry.computeBoundingSphere();

	    
	    this.local = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

	   /* this.line = new MeshLine();
	    this.line.setPoints(this.local);

	    this.mat = new MeshLineMaterial({lineWidth:0.1});

	   
        var mesh = new THREE.Mesh( this.line, this.mat );
        this.add(mesh)
        mesh.frustumCulled = false;*/
	    //this.updateGeometry()

	    this.matrixAutoUpdate = false;
	    this.frustumCulled = false;

	}

	setRay( o ){

		if(o.begin) this.begin.fromArray( o.begin );
	    if(o.end) this.end.fromArray( o.end );
	    this.fullDistance = this.begin.distanceTo( this.end )

	}

	update ( r, n = 0, body = null ) {

		this.data.hit = r[n] !== 0 ? true : false;
		this.data.body = body ? body : '';

		this.data.distance = r[n+1]

		if( this.data.hit ){

			this.local[0] = r[n+2]
			this.local[1] = r[n+3]
			this.local[2] = r[n+4]

			this.tmp.fromArray( r, n+5 );
			this.normal.fromArray( r, n+8 )

			this.data.point = this.tmp.toArray();
			this.data.normal = this.normal.toArray();
			//this.data.distance = this._begin.distanceTo( this.tmp )

			this.tmp.toArray( this.local, 3 );
			this.tmp.addScaledVector( this.normal, this.fullDistance - this.data.distance );
			this.tmp.toArray( this.local, 6 )

		} else {
			if( this.parentMesh ){
				//this.parentMesh.updateWorldMatrix(false,false )
				const mtx = this.parentMesh.matrixWorld
				this.tmp.copy( this.begin ).applyMatrix4(mtx).toArray( this.local, 0 )
				this.tmp.copy( this.end ).applyMatrix4(mtx)
				this.tmp.toArray( this.local, 3 )
				this.tmp.toArray( this.local, 6 )
			} else {
				this.begin.toArray( this.local, 0 );
				this.end.toArray( this.local, 3 );
			}
		}

		this.updateGeometry()
		//this.updateMatrix()

		this.callback( this.data );

	}

	dispose(){
		this.geometry.dispose()
	}

	raycast(){
		return
	}

	updateGeometry(){

		if ( !this.visible ) return;

		//if(this.line) this.line.setPoints(this.local);

		let v = this.vertices//.array;
		let c = this.colors//.array;
		let l = this.local;
		let hit = this.data.hit
		let n, d, i;
		let c1 = hit ? this.c2 : this.c1
		let c2 = hit ? this.c3 : this.c1

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

		this.geometry.setPositions( this.vertices );
		this.geometry.setColors( this.colors );

		//this.vertices.needsUpdate = true;
	    //this.colors.needsUpdate = true;

	    
	}

}

ExtraRay.prototype.isRay = true;