import { Item } from '../core/Item.js';
import {  Utils, root, math, geo, mat } from './root.js';
import {
	Line, LineSegments, BufferGeometry,
    Object3D, Float32BufferAttribute,
    Matrix4, Quaternion, Vector3
} from '../../build/three.module.js';


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

			n = N + ( i * 8 );

			r.update( AR, n, root.reflow.ray[i] || null );

			// re send start end
			r.begin.toArray( AR, n+1 );
			r.end.toArray( AR, n+4 );

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );

		if( o.link && typeof o.link !== 'string') o.link = o.link.name;

		let r = new ExtraRay( o, mat.ray );

		r.visible = o.visible !== undefined ? o.visible : true; 

		// add to world
		this.addToWorld( r );

		if(o.parent) delete (o.parent);
		if(o.callback) delete (o.callback);

		// add to worker 
		root.post( { m:'add', o:o } );

		return r;

	}

	set ( o = {}, r = null ) {

		if( r === null ) r = this.byName( o.name );
		if( r === null ) return;

		if( o.begin !== undefined ) r._begin.fromrray( o.begin )
		if( o.end !== undefined ) r._end.fromrray( o.end )

	}

}


export class ExtraRay extends Line {

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


	    this.linked = o.parent !== undefined ? true : false;
 
	    if( this.linked ) this.parent = o.parent;

	    this.callback = o.callback || function () {};

	    this.matrix = this.linked ? this.parent.matrixWorld : new Matrix4();
	    this.inv = new Matrix4();

	    // color
		this.c0 = [ 0.4, 0.4, 0.4 ];
		this.c1 = [ 0.15, 0.15, 0.15 ];
		this.c2 = [ 1.0, 0, 0 ];

		// local
		this._begin = new Vector3().fromArray( o.begin || [0,3,0] );
	    this._end = new Vector3().fromArray( o.end || [0,0,0] );

	    // global
	    this.begin = new Vector3().copy( this._begin );
	    this.end = new Vector3().copy( this._end );

	    this.tmp = new Vector3();
	    this.normal = new Vector3();
	    
	    const positions = [0,0,0, 0,0,0, 0,0,0];
	    const colors = [0,0,0, 0,0,0, 0,0,0];

	    //this.geometry = new BufferGeometry();
	    this.geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    this.geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    //this.geometry.computeBoundingSphere();

	    this.vertices = this.geometry.attributes.position;
	    this.colors = this.geometry.attributes.color;
	    this.local = [ 0, 0, 0, 0, 0, 0 ];





	    //this.m = new LineSegments( this.geometry, material )
	    //this.add(this.m)

	    this.updateGeometry()

	    this.matrixAutoUpdate = false;

	}

	update ( r, n = 0, body = null ) {

		this.updateMatrix();


		if( this.linked ){

			this.inv.copy( this.matrix ).invert();
			this.begin.copy( this._begin ).applyMatrix4( this.inv )
			this.end.copy( this._end ).applyMatrix4( this.inv )

		}

		

		this.data.hit = r[n] !== 0 ? true : false;
		this.data.body = body ? body : '';

		if( this.data.hit ){

			this.tmp.fromArray( r, n+1 );
			this.normal.fromArray( r, n+4 ).normalize();

			this.data.point = this.tmp.toArray();
			this.data.normal = this.normal.toArray();
			this.data.distance = this.begin.distanceTo( this.tmp )


			this.tmp.toArray( this.local, 0 );
			
			let d = this.tmp.distanceTo( this.end );
			
			this.tmp.addScaledVector( this.normal, d );

			//this.tmp.fromArray( r, n+4 );
			this.tmp.toArray( this.local, 3 )

		}


		this.updateGeometry()

		//

		

		this.callback( this.data );

	}

	updateGeometry (){

		if ( ! this.visible ) return;

		let v = this.vertices.array;
		let c = this.colors.array;
		let l = this.local;
		let n, d, i;

		if ( this.data.hit ) {

			c[ 3 ] = c[ 6 ] = this.c2[ 0 ];
			c[ 4 ] = c[ 7 ] = this.c2[ 1 ];
			c[ 5 ] = c[ 8 ] = this.c2[ 2 ];

			v[ 0 ] = this._begin.x;
			v[ 1 ] = this._begin.y;
			v[ 2 ] = this._begin.z;

			v[ 3 ] = l[ 0 ];
			v[ 4 ] = l[ 1 ];
			v[ 5 ] = l[ 2 ];
			
			v[ 6 ] = l[ 3 ];
			v[ 7 ] = l[ 4 ];
			v[ 8 ] = l[ 5 ];

		} else {

			i = 3;

			while ( i -- ) {

				n = i * 3;
				d = i === 0 ? true : false;

				c[ n ] = d ? this.c0[ 0 ] : this.c1[ 0 ];
				c[ n + 1 ] = d ? this.c0[ 1 ] : this.c1[ 0 ];
				c[ n + 2 ] = d ? this.c0[ 2 ] : this.c1[ 0 ];

				v[ n ] = d ? this._begin.x : this._end.x;
				v[ n + 1 ] = d ? this._begin.y : this._end.y;
				v[ n + 2 ] = d ? this._begin.z : this._end.z;

			}

		}

		this.vertices.needsUpdate = true;
	    this.colors.needsUpdate = true;
	}

}

ExtraRay.prototype.isRay = true;