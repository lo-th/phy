import { root, math, torad } from './root.js';
import {
    Object3D, Vector3, Quaternion, Euler, Matrix4,
} from 'three';
let Nb = 0


const _rootMatrix = /*@__PURE__*/ new Matrix4();
const _tmpMatrix = /*@__PURE__*/ new Matrix4();
const _endMatrix = /*@__PURE__*/ new Matrix4();
const _p = /*@__PURE__*/ new Vector3();
const _q = /*@__PURE__*/ new Quaternion();
const _s = /*@__PURE__*/ new Vector3();

export class SkeletonBody extends Object3D {

	constructor ( character ) {

		super()

		this.prefix = 'yoo_'

		this.bones = character.model.skeleton.bones;
		this.model = character.model.root;

		this.init()

	}


	init(){

		this.meshData = []
		this.nodes = []


        const fingers = [ 'Thumb', 'Index', 'Mid', 'Ring', 'Pinky' ];

        // get character bones var bones = character.skeleton.bones;
        

        let p = new Vector3();
        let s = new Vector3();
        let q = new Quaternion();
        let e = new Euler();
        let mtx = new Matrix4();

        let tmpMtx = new Matrix4();
        let tmpMtxR = new Matrix4();

        let p1 = new Vector3();
        let p2 = new Vector3();

        let i, lng = this.bones.length, name, n, boneId, bone, parent;///, child, o, parentName;
        let size, dist, rot, type, mesh, r, kinematic, translate;

        for( i = 0; i < lng; i++ ){

        	type = null;
            bone = this.bones[i];
            name = bone.name;
            parent = bone.parent;

            if( parent ) {

            	n = parent.name;

            	p1.setFromMatrixPosition( parent.matrixWorld );
            	p2.setFromMatrixPosition( bone.matrixWorld );
                dist = p1.distanceTo( p2 );

	            //translate = [ -dist * 0.5, 0, 0 ];
	            translate = [ 0, 0, dist * 0.5 ];
                size = [ dist, 1, 1 ];
                rot = [0,0,0];
                kinematic = true;

                // body
                if( n==='head' && name === 'End_head' ){ type = 'box'; size = [ 0.16, 0.2, dist ]; translate = [ 0, 0.025, -dist * 0.5 ]; }
	            if( n==='chest' && name==='neck' ){ type = 'box'; size = [  0.30, 0.28, dist ]; translate = [ 0, 0, -dist * 0.5 ]; }
	            if( n==='abdomen' ){ type = 'box'; size = [ 0.28, 0.24,  dist+0.14 ]; rot[2] = 0; translate = [ 0, 0, -dist * 0.5 ];translate[2] += 0.07;}

	             // legs
	            if( n==='rThigh' ){ type = 'box'; size = [  0.15, 0.15, dist ];  }
	            if( n==='lThigh' ){ type = 'box'; size = [  0.15, 0.15 , dist];  }
	            if( n==='rShin' ){ type = 'box'; size = [  0.12, 0.12, dist+ 0.1, ]; translate[2] += 0.05; }
	            if( n==='lShin' ){ type = 'box'; size = [  0.12, 0.12, dist+ 0.1, ]; translate[2] += 0.05; }

	            // arm
	            if( n==='rShldr'  ){ type = 'box'; size = [   dist+ 0.06, 0.12, 0.12  ]; translate[0] = -translate[2]+0.03; translate[2]=0; }
	            if( n==='lShldr'  ){ type = 'box'; size = [  dist+ 0.06,0.12,   0.12, ];  translate[0] = translate[2]-0.03; translate[2]=0; }
	            if( n==='rForeArm' ){ type = 'box'; size = [  dist + 0.1,0.1,  0.1 ];  translate[0] = -translate[2]-0.05; translate[2]=0; }
	            if( n==='lForeArm' ){ type = 'box'; size = [  dist + 0.1,0.1,  0.1]; translate[0] = translate[2]+0.05; translate[2]=0; }

                /*if( n==='head' ){ type = 'capsule'; size = [ 7.5, 8.6, 7.5 ]; r = 90; }
                if( n==='neck' && name==='head' ){    type = 'box'; size = [ dist, 6, 6 ]; r = 0; }
                if( n==='chest' && name==='neck' ){   type = 'box'; size = [ dist, 15, 13 ]; r = 0; }
                if( n==='abdomen' && name==='chest'){ type = 'box'; size = [ dist, 14, 12 ]; r = 0; }
                //if( n==='hip' && name==='abdomen' ){  type = 'box'; size = [ dist, 13, 11 ]; r = 0; }
                if( n==='hip' && name==='abdomen' ){  type = 'capsule'; size = [ 4, 24.4, 4 ]; r = 0; translate = [ 0, 0, 0 ]}
                // arms
                if( n==='lCollar' || n==='rCollar' ){    type = 'cylinder'; size = [ 3, dist, 3 ]; }
                if( n==='rShldr' && name==='rForeArm' ){ type = 'cylinder'; size = [ 3, dist, 3 ]; }
                if( n==='lShldr' && name==='lForeArm' ){ type = 'cylinder'; size = [ 3, dist, 3 ]; }
                if( n==='rForeArm' && name==='rHand' ){  type = 'cylinder'; size = [ 2.6, dist, 2.6 ]; }
                if( n==='lForeArm' && name==='lHand' ){  type = 'cylinder'; size = [ 2.6, dist, 2.6 ]; }
                // hand
                if( n==='rHand' && name==='rMid1' ){  type = 'box'; size = [ dist, 2, 4 ]; r = -5; translate = [ -dist * 0.5, 0.5, 0 ]}
                if( n==='lHand' && name==='lMid1' ){  type = 'box'; size = [ dist, 2, 4 ]; r = 5; translate = [ -dist * 0.5, -0.5, 0 ]}
                // fingers
                let f = n.substring( 1, n.length-1 );
                let fnum = 4 - Number(n.substring( n.length-1 ));
                if( fingers.indexOf(f) !== -1 ){
                    let sx = f === 'Thumb' ? 1+(fnum*0.25) : 1+(fnum*0.1);
                    type = 'box'; size = [ dist, sx, sx ]; r=0; 
                }
                // legs
                if( n==='rThigh' && name==='rShin' ){ type = 'cylinder'; size = [ 4, dist, 4 ]; }
                if( n==='lThigh' && name==='lShin' ){ type = 'cylinder'; size = [ 4, dist, 4 ]; }
                if( n==='rShin' && name==='rFoot' ){  type = 'cylinder'; size = [ 3, dist, 3 ]; }
                if( n==='lShin' && name==='lFoot' ){  type = 'cylinder'; size = [ 3, dist, 3 ]; }
                // foot
                if( n==='rFoot' && name==='rToes' ){ type = 'box'; size = [ 4, 5, 9 ]; r = 0; translate = [ -1, 0, -2.5 ]; }
                if( n==='lFoot' && name==='lToes' ){ type = 'box'; size = [ 4, 5, 9 ]; r = 0; translate = [ -1, 0, -2.5 ]; }
                if( n==='rToes' ){ type = 'box'; size = [ dist+1, 5, 3 ]; r = 0; translate = [ (-dist * 0.5)-0.5, 0, -1.5 ];}
                if( n==='lToes' ){ type = 'box'; size = [ dist+1, 5, 3 ]; r = 0; translate = [ (-dist * 0.5)-0.5, 0, -1.5 ];}*/

                if( type !== null ){

                	// translation
                    tmpMtx.makeTranslation( translate[0], translate[1], translate[2] );
                    // rotation
                    /*if( r!==0 ){
                        tmpMtxR.makeRotationFromEuler( e.set( 0, 0, r*torad ) );
                        tmpMtx.multiply( tmpMtxR );
                    }*/
                     
                    mtx.multiplyMatrices( parent.matrixWorld, tmpMtx );
                    mtx.decompose( p, q, s );

                	let data = {

                        name: this.prefix + n,
                        density:1,
                        type: type,
                        size: math.vecMul(size,1),
                        pos: p.toArray(),
                        //rot: rot,
                        quat: q.toArray(),
                        kinematic: kinematic,
                        friction: 0.5,
                        restitution:0.1,
                        group:1,
                        mask:1|2,
                        //neverSleep: true,

                        /*bone:parent,
                        decal:tmpMtx.clone(),
                        decalinv:tmpMtx.clone().invert(),*/
                        
                    }

                    this.meshData.push( data )
                    this.nodes.push({
                    	name: this.prefix + n,
                    	bone:parent,
                        decal:tmpMtx.clone(),
                        //decalinv:tmpMtx.clone().invert(),
                        quat:q.toArray(),
                        pos:p.toArray(),
                    })
                }

            }
        }

        //console.log( this.meshData )

        root.motor.add( this.meshData )

	}

	updateMatrixWorld( force ){
		this.update(force)
	}

	update( force ){

		let up = []

		_rootMatrix.identity()//copy( this.matrixWorld ).invert();

		const nodes = this.nodes;
		let i = nodes.length, node, bone;

		while( i-- ){

            node = nodes[i];
            bone = node.bone;

            //_tmpMatrix.multiplyMatrices( _rootMatrix, bone.matrixWorld );
            _endMatrix.multiplyMatrices( bone.matrixWorld, node.decal );
            _endMatrix.decompose( _p, _q, _s );

            node.pos = _p.toArray();
            node.quat = _q.toArray();

            up.push({ name:node.name, pos:node.pos, quat:node.quat })

            //node.updateMatrix()

        }

        root.motor.change( up, true )

	}

	dispose(){

		this.parent.remove(this);
		
	}

}