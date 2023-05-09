import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Basic3D } from '../core/Basic3D.js';
import { Utils, root, math, Mat, Geo } from './root.js';

import {
	LineSegments, BufferGeometry,
    Object3D, Line, Float32BufferAttribute,
    Matrix4, Quaternion, Vector3
} from 'three';

//import { Item } from './Item.js';

export class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'joint';

		this.v1 = new Vector3()
		this.v2 = new Vector3()

	}

	step ( AR, N ) {

		let i = this.list.length, j, n;
		
		while( i-- ){

			j = this.list[i];

			n = N + ( i * Num.joint );

			//j.update( AR, n );
			j.update();

			//j.update( AR.slice( n, 16 ) );

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o )

		let body1 = null
		let body2 = null
		let isString

		if( o.b1 ) {
			isString = typeof o.b1 === 'string'
			body1 = isString ? Utils.byName( o.b1 ) : o.b1
			if(!isString) o.b1 = o.b1.name;
		}

		if( o.b2 ) {
			isString = typeof o.b2 === 'string'
			body2 = isString ? Utils.byName( o.b2 ) : o.b2
			if(!isString) o.b2 = o.b2.name;
		}

		// world to local

		if ( o.worldPos ) o.worldAnchor = o.worldPos
		if ( o.worldAnchor ){

			this.v1.fromArray( o.worldAnchor ) 
			this.v2.fromArray( o.worldAnchor )

			o.pos1 = body1 ? Utils.toLocal( this.v1, body1 ).toArray():o.worldAnchor
			o.pos2 = body2 ? Utils.toLocal( this.v2, body2 ).toArray():o.worldAnchor

			delete o.worldAnchor

		}

		if ( o.worldAxis ){

			this.v1.fromArray( o.worldAxis ) 
			this.v2.fromArray( o.worldAxis )

			o.axis1 = body1 ? Utils.toLocal( this.v1, body1, true ).normalize().toArray():o.worldAxis
			o.axis2 = body2 ? Utils.toLocal( this.v2, body2, true ).normalize().toArray():o.worldAxis

			//o.quat1 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		    //o.quat2 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

			//console.log(o.worldAxis, o.axis1, o.axis2)

			delete o.worldAxis

		}

		//if( !o.axis1 ) o.axis1 = [0,0,1]
		//if( !o.axis2 ) o.axis2 = [0,0,1]

		if( !o.axis1 ) o.axis1 = [1,0,0]
		if( !o.axis2 ) o.axis2 = [1,0,0]

		if( !o.pos1 ) o.pos1 = [0,0,0]
		if( !o.pos2 ) o.pos2 = [0,0,0]

		/*if( o.b2 ) body2 = typeof o.b2 !== 'string' ? o.b2 : Utils.byName(o.b2)
		if( o.b1 && typeof o.b1 !== 'string') o.b1 = o.b1.name;
		if( o.b2 && typeof o.b2 !== 'string') o.b2 = o.b2.name;*/

		if( o.rot1 !== undefined ){ o.quat1 = math.toQuatArray( o.rot1 ); delete ( o.rot1 ); }
		if( o.rot2 !== undefined ){ o.quat2 = math.toQuatArray( o.rot2 ); delete ( o.rot2 ); }

		if( !o.quat1 ) o.quat1 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		if( !o.quat2 ) o.quat2 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

		if( o.drivePosition) if( o.drivePosition.rot !== undefined ){ o.drivePosition.quat = math.toQuatArray( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }

		let j = new ExtraJoint( Geo.get('joint'), Mat.get('joint'), o );
		j.name = name;

		j.visible = false; // joint is visible after first update
		j.isVisible = o.visible !== undefined ? o.visible : true;
		j.body1 = body1
		j.body2 = body2

		// add to world
		this.addToWorld( j, o.id )

		// add to worker 
		root.post( { m:'add', o:o } )

		return j

	}

	set ( o = {} ) {

	}

}





export class ExtraJoint extends Basic3D {

	constructor( g, material = undefined, o ) {

	    super()

	    this.type = 'joint';
	    this.mode = 'revolute';
	    this.isJoint = true;

	    //this.mtx = new Matrix4();

	    this.m1 = new LineSegments( g, material )
	    this.add(this.m1)
	    this.m1.matrixAutoUpdate = false;

	    this.m2 = new LineSegments( g, material )
	    this.add( this.m2 );
	    this.m2.matrixAutoUpdate = false;

	    this.body1 = null
	    this.body2 = null

	    this.mat1 = new Matrix4()
	    this.mat2 = new Matrix4()
	    this.end = new Vector3()

	    // experimental rotation ?
	    Utils.refAxis( this.mat1, o.axis1 )
	    Utils.refAxis( this.mat2, o.axis2 )

	    this.mat1.setPosition( o.pos1[0], o.pos1[1], o.pos1[2] )
	    this.mat2.setPosition( o.pos2[0], o.pos2[1], o.pos2[2] )
	    
	    
	    const positions = [ 0, 0, 0, 0, 0, 0 ]
	    const gline = new BufferGeometry();
	    gline.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    gline.computeBoundingSphere();


	    this.m3 = new LineSegments( gline, material )
	    this.add( this.m3 )
	    this.m3.matrixAutoUpdate = false;

	    this.pp = this.m3.geometry.attributes.position;

	}

	update ( r, n = 0 ) {

		if( !this.isVisible ) return

		if(this.body1){
			this.matrix.copy( this.body1.matrixWorld ).multiply( this.mat1 );
		} else {
			this.matrix.copy( this.mat1 );
		}

		if(this.body2){
			this.m2.matrix.copy( this.body2.matrixWorld ).multiply( this.mat2 );
		} else {
			this.m2.matrix.copy( this.mat2 )
		}

		this.m2.matrix.premultiply(this.matrix.clone().invert())
		this.end.setFromMatrixPosition( this.m2.matrix )


		//m.matrix = b.matrixWorld;
        //m.matrixAutoUpdate = false;

		//this.position.fromArray( r, n );
		//this.quaternion.fromArray( r, n + 3 );

		//this.updateMatrix();

		//this.m2.position.fromArray( r, n+7 );
		//this.m2.quaternion.fromArray( r, n+10 );
		//this.m2.matrix.compose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );

		//this.mtx.copy( this.matrix ).invert().multiply( this.m2.matrix );
		//this.mtx.decompose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );
		//this.m2.updateMatrix();

		//const position = this.m3.geometry.attributes.position;
		//position.setXYZ(1, this.m2.position.x, this.m2.position.y, this.m2.position.z)

		this.pp.setXYZ(1, this.end.x, this.end.y, this.end.z)
		this.pp.needsUpdate = true

		if( !this.visible ) this.visible = true;

	}

	dispose (){

		this.m1.geometry.dispose()
		this.m2.geometry.dispose()
		this.m3.geometry.dispose()
		this.children = []

	}

}