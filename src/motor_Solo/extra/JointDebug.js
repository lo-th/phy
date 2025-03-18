import {
	LineSegments, BufferGeometry,
    Object3D, Line, Float32BufferAttribute,
    Matrix4, Quaternion, Vector3
} from 'three';


import { Basic3D } from '../../core/Basic3D.js';
import { Utils, root } from '../root.js';
import { MathTool } from '../../core/MathTool.js';
import { Geo } from '../base/Geo.js';
import { Mat } from '../base/Mat.js';

import { AutoSvg } from '../../3TH/AutoSvg.js';

export class JointDebug extends Basic3D {

	constructor( o = {} ) {

	    super()

	    this.isJoint = true;

	    this.type = 'joint';
	    this.mode = o.mode || 'hinge';
	    this.visible = o.visible !== undefined ? o.visible : false;
	    
	    this.mtx = new Matrix4();
	    this.size = o.helperSize || 0.1;

	    let material = Mat.get('line');
	    let mat, dt

	    switch( this.mode ){
	    	case 'prismatic':
	    	    mat = Mat.get('svg');
		    	dt = {
					min:-180,
					max:180,
					fill:false,
					stroke:true,
					wireframe:false,
					size:this.size*0.5
				}

				if(o.lm){
					dt.min = o.lm[0]
					dt.max = o.lm[1]
				}
				this.m1 = new AutoSvg('liner', dt, mat );
		    	this.m2 = new AutoSvg('middle', dt, mat );

		    	this.m1.geometry.rotateY(90 * MathTool.torad)

		    	//this.m3 = this.m1.clone()
		    	//this.m3.rotation.x = 90 * MathTool.torad

		    	this.add( this.m1 );
		    	this.add( this.m2 );
		    	//this.add( this.m3 );

	    	break;
	    	case 'hinge': case 'cylindrical':

		    	mat = Mat.get('svg');
		    	dt = {
					min:-180,
					max:180,
					fill:false,
					stroke:true,
					wireframe:false,
					size:this.size*0.5
				}

				if(o.lm){
					dt.min = o.lm[0]
					dt.max = o.lm[1]
				}

				if(o.lmr){ // cylindrical
					dt.min = o.lmr[0]
					dt.max = o.lmr[1]
				}

		    	this.m1 = new AutoSvg('angle', dt, mat );
		    	this.m2 = new AutoSvg('needle', dt, mat );

		    	this.add( this.m1 );
		    	this.add( this.m2 );

	    	break;
	    	default:

		    	const geom = Geo.get('joint');
			    let g = geom.clone() 
			    g.scale( this.size, this.size, this.size)
			    this.m1 = new LineSegments( g, material )
			    
			    
			    this.add( this.m1 )

			    g = geom.clone() 
			    g.scale( this.size*0.8, this.size*0.8, this.size*0.8 );
			    this.m2 = new LineSegments( g, material )
			    //this.m2.scale.set( this.size, this.size, this.size)
			    this.add( this.m2 );
		    
	    	break;
	    }


	    this.m1.matrixAutoUpdate = false;
	    this.m2.matrixAutoUpdate = false;

		//    this.m2.updateMatrix()
		//    this.m1.updateMatrix()




	    this.body1 = null
	    this.body2 = null

	    this.mat1 = new Matrix4()
	    this.mat2 = new Matrix4()
	    this.end = new Vector3()

	    // experimental rotation ?
	    //Utils.refAxis( this.mat1, o.axis1 )
	    //Utils.refAxis( this.mat2, o.axis2 )

	    let qq = new Quaternion()
	    if(o.quat1) this.mat1.makeRotationFromQuaternion(qq.fromArray(o.quat1))
	    if(o.quat2) this.mat2.makeRotationFromQuaternion(qq.fromArray(o.quat2))

	    this.mat1.setPosition( o.pos1[0], o.pos1[1], o.pos1[2] )
	    this.mat2.setPosition( o.pos2[0], o.pos2[1], o.pos2[2] )
	    
	    
	    const positions = [ 0, 0, 0, 0, 0, 0 ]
	    const colors = [ 1, 0, 0, 1, 0, 0 ]
	    const gline = new BufferGeometry();
	    gline.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    gline.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    gline.computeBoundingSphere();


	    this.m3 = new LineSegments( gline, material )
	    this.add( this.m3 )
	    this.m3.matrixAutoUpdate = false;

	    this.pp = this.m3.geometry.attributes.position;

	}

	update () {

		if( !this.visible ) return

		if( this.body1 ){
			this.matrix.copy( this.body1.matrixWorld ).multiply( this.mat1 );
		} else {
			this.matrix.copy( this.mat1 );
		}

		if( this.body2 ){
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

		if( this.mode === 'cylindrical' ){ 
			this.m1.position.copy( this.end );
			this.m1.updateMatrix();
		}

		if( !this.visible ) this.visible = true;

	}

	updateFromPhy ( r, n = 0 ) {

		//if( !this.isVisible ) return
		if( !this.visible ) return


		//m.matrix = b.matrixWorld;
        //m.matrixAutoUpdate = false;

		this.position.fromArray( r, n );
		this.quaternion.fromArray( r, n + 3 );

		this.updateMatrix();

		this.m2.position.fromArray( r, n+7 );
		this.m2.quaternion.fromArray( r, n+10 );
		this.m2.matrix.compose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );

		this.mtx.copy( this.matrix ).invert().multiply( this.m2.matrix );
		this.mtx.decompose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );
		this.m2.updateMatrix();


		this.pp.setXYZ(1, this.m2.position.x, this.m2.position.y, this.m2.position.z)
		this.pp.needsUpdate = true;

		if( this.mode === 'cylindrical' ){ 
			this.m1.position.copy( this.m2.position );
			this.m1.updateMatrix();
		}

		if( !this.visible ) this.visible = true;

	}

	dispose (){

		if( this.body1 ) this.body1.link--;
		if( this.body2 ) this.body2.link--;

		this.m1.geometry.dispose()
		this.m2.geometry.dispose()
		this.m3.geometry.dispose()
		this.children = []

	}

}