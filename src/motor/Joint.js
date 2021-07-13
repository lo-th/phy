import { Item } from '../core/Item.js';
import { Utils, root, math, geo, mat } from './root.js';

import {
	LineSegments, BufferGeometry,
    Object3D, Line, Float32BufferAttribute,
    Matrix4, Quaternion, Vector3
} from '../../build/three.module.js';

//import { Item } from './Item.js';

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'joint';

	}

	step ( AR, N ) {

		let i = this.list.length, j, n;
		
		while( i-- ){

			j = this.list[i];

			n = N + ( i * 16 );

			j.update( AR, n );

			//j.update( AR.slice( n, 16 ) );

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );

		if( o.b1 && typeof o.b1 !== 'string') o.b1 = o.b1.name;
		if( o.b2 && typeof o.b2 !== 'string') o.b2 = o.b2.name;

		if( o.rot1 !== undefined ){ o.quat1 = math.toQuatArray( o.rot1 ); delete ( o.rot1 ); }
		if( o.rot2 !== undefined ){ o.quat2 = math.toQuatArray( o.rot2 ); delete ( o.rot2 ); }

		if( o.drivePosition) if( o.drivePosition.rot !== undefined ){ o.drivePosition.quat = math.toQuatArray( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }

		let j = new ExtraJoint( geo.joint, mat.joint );
		j.name = name;

		j.visible = o.visible !== undefined ? o.visible : true; 

		// add to world
		this.addToWorld( j, o.id );

		// add to worker 
		root.post( { m:'add', o:o } );

		return j;

	}

	set ( o = {} ) {

	}

}





export class ExtraJoint extends Object3D {

	constructor( g, material = undefined ) {

	    super()

	    this.type = 'joint';
	    this.mode = 'revolute';

	    this.mtx = new Matrix4();

	    this.matrixAutoUpdate = false;

	    let m = new LineSegments( g, material )
	    this.add(m)

	    this.m2 = new LineSegments( g, material )
	    this.add( this.m2 );
	    this.m2.matrixAutoUpdate = false;
	    
	    const positions = [ 0, 0, 0, 0, 0, 0]
	    const gline = new BufferGeometry();
	    gline.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    gline.computeBoundingSphere();


	    this.m3 = new LineSegments( gline, material )
	    this.add( this.m3 )

	}

	update ( r, n = 0 ) {

		if(!this.visible) return

		this.position.fromArray( r, n );
		this.quaternion.fromArray( r, n + 3 );

		this.updateMatrix();

		this.m2.position.fromArray( r, n+7 );
		this.m2.quaternion.fromArray( r, n+10 );
		this.m2.matrix.compose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );

		this.mtx.copy( this.matrix ).invert().multiply( this.m2.matrix );
		this.mtx.decompose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );
		this.m2.updateMatrix();

		const position = this.m3.geometry.attributes.position;
		position.setXYZ(1, this.m2.position.x, this.m2.position.y, this.m2.position.z)
		position.needsUpdate = true

	}

}

ExtraJoint.prototype.isJoint = true;