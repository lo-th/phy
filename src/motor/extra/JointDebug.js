import {
	Group, Object3D, LineSegments, BufferGeometry, Float32BufferAttribute, Matrix4, Quaternion, Vector3, Euler
} from 'three';

import { MathTool } from '../../core/MathTool.js';
import { AutoSvg } from '../../3TH/AutoSvg.js';
import { CircleHelper } from '../geometries/CircleHelper.js';

const baseGeo1 = new CircleHelper().geometry
const baseGeo2 = new CircleHelper(null, 1).geometry

export class JointDebug extends Object3D {

	constructor( o = {}, motor ) {

	    super()

	    this.motor = motor;
	    this.engine = motor.engine;

	    this.isJoint = true;
	    this.defJoint = false;

	    this.type = 'joint';
	    this.mode = o.mode || 'hinge';
	    this.visible = o.visible !== undefined ? o.visible : false;

	    this.garbage = []
	    
	    this.mtx = new Matrix4();
	    this.size = o.helperSize || 0.1;

	    this.matrixAutoUpdate = false;

	    this.m1 = new Group()
	    this.m2 = new Group()
	    this.m3 = new Group()
	    this.m4 = new Group()

	    this.m1.matrixAutoUpdate = false;
	    this.m2.matrixAutoUpdate = false;
	    this.m3.matrixAutoUpdate = false;
	    this.m4.matrixAutoUpdate = false;

	    this.add( this.m1) 
	    this.add( this.m2) 
	    this.add( this.m3) 
	    this.add( this.m4)

	    this.body1 = null
	    this.body2 = null

	    this.mat1 = new Matrix4()
	    this.mat2 = new Matrix4()
	    this.mat4 = new Matrix4()
	    this.end = new Vector3()

	    let qq = new Quaternion()
	    if(o.quat1) this.mat1.makeRotationFromQuaternion(qq.fromArray(o.quat1))
	    if(o.quat2) this.mat2.makeRotationFromQuaternion(qq.fromArray(o.quat2))

	    this.mat1.setPosition( o.pos1[0], o.pos1[1], o.pos1[2] )
	    this.mat2.setPosition( o.pos2[0], o.pos2[1], o.pos2[2] )
	    this.mat4.setPosition( o.pos2[0], o.pos2[1], o.pos2[2] )

	    this.axis = {
	    	x:null,
	    	y:null,
	    	z:null
	    }



	    let material = this.motor.mat.get('line');
	    let mat, dt

	    let min, max, tmp

	    let o1, o2, o3

	    switch( this.mode ){
	    	case 'fixe':
	    	o2 = this.svg('middle', 0, 0 );
	    	this.m2.add( o2 );
	    	break;
	    	case 'prismatic':

	    	    min = -180
	    	    max = 180

				if(o.lm){
					min = o.lm[0]
					max = o.lm[1]
				}

		    	o1 = this.svg('liner', min, max );
		    	o2 = this.svg('middle', min, max );

		    	o1.geometry.rotateY(90 * MathTool.torad)

		    	this.m1.add( o1 );
		    	this.m2.add( o2 );

		    	this.garbage.push(o1,o2)

	    	break;
	    	case 'hinge': case 'cylindrical':

	    	    min = -180
	    	    max = 180

				if(o.lm){
					min = o.lm[0]
					max = o.lm[1]
				}

				if(o.lmr){ // cylindrical
					min = o.lmr[0]
					max = o.lmr[1]
				}

		    	o1 = this.svg('angle', min, max );
		    	o2 = this.svg('needle', min, max );

		    	this.m1.add( o1 );
		    	this.m2.add( o2 );

		    	this.garbage.push(o1,o2)

	    	break;
	    	default:

	    	    this.defJoint = true

	    	    min = -180
	    	    max = 180

	    	    // RX

	    	    if(o.lm){
	    	    	tmp = this.getAxis(o.lm, 'rx')
	    	    	min = tmp[0]
	    	    	max = tmp[1]
				}

				if(min !== undefined && max !== undefined ){
					o1 = this.svg('angle', min, max );
		    	    o1.geometry.rotateX(-90 * MathTool.torad)
		    	    //o1.geometry.rotateY(180 * MathTool.torad)
		    	    o2 = this.svg('needle', min, max );
		    	    o2.geometry.rotateX(-90 * MathTool.torad)
		    	    this.m4.add( o1 )
		    	    this.m4.add( o2 )
		    	    this.axis.x = o2
		    	    this.garbage.push(o1, o2)
				}

				// RY

				if(o.lm){
	    	    	tmp = this.getAxis(o.lm, 'ry')
	    	    	min = tmp[0]
	    	    	max = tmp[1]
				}

				

				if(min !== undefined && max !== undefined){

					if(this.engine!=='HAVOK'){
						let v = this.getMax(min,max)
						min = -v
		    	    	max = v
					}
					
					o1 = this.svg('angle', min, max, 'y' );
		    	    o1.geometry.rotateZ(90 * MathTool.torad)
		    	    o2 = this.svg('needle', min, max, 'y' );
		    	    o2.geometry.rotateZ(90 * MathTool.torad)
		    	    this.m4.add( o1 )
		    	    this.m4.add( o2 )
		    	    this.axis.y = o2
		    	    this.garbage.push(o1, o2)
				}

				// RZ

				if(o.lm){
	    	    	tmp = this.getAxis(o.lm, 'rz')
	    	    	min = tmp[0]
	    	    	max = tmp[1]
				}

				

				if(min !== undefined && max !== undefined){

					if(this.engine!=='HAVOK'){
						let v = this.getMax(min,max)
						min = -v
		    	    	max = v
					}

					o1 = this.svg('angle', min, max, 'z' );
		    	    o1.geometry.rotateY(-90 * MathTool.torad)
		    	    //o1.geometry.rotateX(180  * MathTool.torad)
		    	    o2 = this.svg('needle', min, max, 'z' );
		    	    o2.geometry.rotateY(-90 * MathTool.torad)
		    	    //o2.geometry.rotateX(180 * MathTool.torad)
		    	    this.m4.add( o1 )
		    	    this.m4.add( o2 )
		    	    this.axis.z = o2
		    	    this.garbage.push(o1, o2)
				}

		    	//const geom = this.motor.geo.get('joint');
			    let g = baseGeo1.clone() 
			    g.scale( this.size, this.size, this.size)
			    //this.m1 = new LineSegments( g, material )
			    o1 = new LineSegments( g, material )
			    this.garbage.push(g)
			    
			    
			    //this.add( this.m1 )
			    //this.m1.add( o1 )

			    g = baseGeo2.clone() 
			    g.scale( this.size*0.8, this.size*0.8, this.size*0.8 );
			    //this.m2 = new LineSegments( g, material )
			    o2 = new LineSegments( g, material )
			    //this.add( this.m2 );

			    this.garbage.push(g)

			    this.m1.add( o1 )
			    this.m2.add( o2 )
		    
	    	break;
	    }


	    
	    
	    
	    const positions = [ 0, 0, 0, 0, 0, 0 ]
	    const colors = [ 1, 0, 0, 1, 0, 0 ]
	    const gline = new BufferGeometry();
	    gline.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    gline.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    gline.computeBoundingSphere();

	    let liner = new LineSegments( gline, material )
	    this.pp = liner.geometry.attributes.position;
	    this.m3.add( liner )


	    /*this.m3 = new LineSegments( gline, material )
	    this.add( this.m3 )
	    this.m3.matrixAutoUpdate = false;*/

	    //this.pp = this.m3.geometry.attributes.position;
	    

	}

	getMax(aa, bb){
		let a = Math.abs(aa)
		let b = Math.abs(bb)
		let v = a>b ? a : b;
		return v
	}

	getAxis ( lm, axe ){
		let p
		for(let i in lm){
			p = lm[i]
			if(p[0]===axe) return [p[1], p[2]]
		}
	    return [undefined, undefined]

	}

	svg (type = 'angle', min=-180, max=180, axis='x') {

		let mat = this.motor.mat.get('svg');

		let dt = {
			min:min,
			max:max,
			fill:false,
			stroke:true,
			wireframe:false,
			size:this.size*0.25,
			axis:axis,
		}

		return new AutoSvg( type, dt, mat );

	}

	update ( r, n = 0 ) {

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

		this.m2.matrix.premultiply(this.matrix.clone().invert());
		this.end.setFromMatrixPosition( this.m2.matrix );

		this.m4.position.copy(this.end);
		
		//this.m4.quaternion.copy(this.m2.quaternion);
		//this.m4.quaternion.setFromRotationMatrix(this.body2.matrixWorld);
		this.m4.updateMatrix();
		//this.m2.updateMatrix()

		this.pp.setXYZ(1, this.end.x, this.end.y, this.end.z);
		this.pp.needsUpdate = true;

		this.m2.updateWorldMatrix( true, false );

		//this.updateD6( new Quaternion().setFromRotationMatrix(this.m2.matrixWorld) )
		this.updateD6( new Quaternion().setFromRotationMatrix(this.m2.matrix) )
		//this.updateD6(this.m2.getWorldQuaternion(new Quaternion()))
		//this.updateD6( this.m2.quaternion )

		if( this.mode === 'cylindrical' ){ 
			this.m1.position.copy( this.end );
			this.m1.updateMatrix();
		}

		//console.log('up1')

		//if( !this.visible ) this.visible = true;

	}

	updateD6( q ){

		let e = new Euler().setFromQuaternion(q,'XYZ')

		if(this.axis.x){ 
			//e.setFromQuaternion(q,'XYZ')
			this.axis.x.rotation.x = e.x
		}

		if(this.axis.y){ 
			//e.setFromQuaternion(q,'YXZ')
			this.axis.y.rotation.y = e.y
		}

		if(this.axis.z){ 
			//e.setFromQuaternion(q,'ZXY')
			this.axis.z.rotation.z = e.z
		}

	}

	/*updateFromPhy ( r, n = 0 ) {

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

		this.m4.position.copy(this.m2.position);
		//this.m4.quaternion.copy(this.m2.quaternion);
		this.updateD6( this.m2.quaternion )
		this.m4.updateMatrix();

		this.pp.setXYZ(1, this.m2.position.x, this.m2.position.y, this.m2.position.z);
		this.pp.needsUpdate = true;

		if( this.mode === 'cylindrical' ){ 
			this.m1.position.copy( this.m2.position );
			this.m1.updateMatrix();
		}



		//console.log('up2')

		//if( !this.visible ) this.visible = true;

	}*/

	dispose (){

		if( this.body1 ) this.body1.link--;
		if( this.body2 ) this.body2.link--;

		for(let i in this.garbage){
			this.garbage[i].dispose()
		}

		/*this.m1.geometry.dispose()
		this.m2.geometry.dispose()
		this.m3.geometry.dispose()*/
		this.children = []

	}

}