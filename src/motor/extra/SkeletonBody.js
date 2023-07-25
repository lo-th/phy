import { MathTool, torad } from '../../core/MathTool.js';
import { root, Utils } from '../root.js';
import { Object3D, Vector3, Quaternion, Euler, Matrix4 } from 'three';

/** __
*    _)_|_|_
*   __) |_| | 2023
*  @author lo.th / https://github.com/lo-th
* 
*  SKELETON BODY
*  make and controle rigidbody from skeleton bones 
*/

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

		this.prefix = character.name || 'yoo_'

        this.mode = 'follow'

        this.withFinger = false

        this.nodes = []
		this.bones = character.model.skeleton.bones;
		this.model = character.model.root;
        this.posRef = {}
        this.quatRef = {}

        this.useSolver = false 
        if( root.engine!=='PHYSX' ) this.useSolver = false

        this.nameList = []
        this.jointList = []

        this.breast = false

        this.ready = false

		this.init()

	}

    setMode( mode ){

        if( mode === this.mode ) return

        this.mode = mode
        const data = []

        let kinematic = this.mode === 'follow'

        let i = this.nodes.length, node

        while( i-- ){

            node = this.nodes[i]

            data.push( { name : node.name, kinematic:kinematic } )
            node.kinematic = kinematic
            node.bone.isPhysics = !kinematic;
            
        }

        root.motor.change( data )

    }

    freeBone( node ){

        if(!node.kinematic) return
        node.cc++
        if(node.cc=== 20 ){
            node.cc = 0
            node.kinematic = false
            node.bone.isPhysics = true;
            root.motor.change( { name : node.name, kinematic:false } )
        }
        
    }

    isVisible( v ){

        //let i = this.nodes.length, node
        //while( i-- ) Utils.byName( this.nodes[i].name ).visible = v

        let i = this.nameList.length, node
        while( i-- ) Utils.byName( this.nameList[i] ).visible = v

        let data = []
        i = this.jointList.length
        while( i-- ) data.push( { name:this.jointList[i], visible:v } )
        root.motor.change( data )

    }


	init(){

        if( this.useSolver ) this.solver = root.motor.add({ 
            type:'solver', name:this.prefix+'_solver', iteration:32,
            fix:true, needData:true
        });

		const data = []
        
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

        //let headDone = false

        let i, lng = this.bones.length, name, n, boneId, bone, parent;///, child, o, parentName;
        let size, dist, rot, type, mesh, r, kinematic, translate, phyName, motion, link;

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
                rot = null;//[0,0,0];
                kinematic = true;
                motion = false;
                link = 'null'


                // body

                if( n==='hip' && name==='abdomen' ){ type = 'capsule'; size = [  dist*1.8, 0.08 ]; translate = [ 0, 0, -dist * 0.5 ]; rot = [0,0,90]; link='null';}
                if( n==='abdomen' && name==='chest'  ){ type = 'capsule'; size = [ dist*0.7, 0.08   ]; translate = [ 0, 0, (-dist * 0.5)-0.06 ]; rot = [90,0,0]; link='hip';}
                if( n==='chest' && name==='neck' ){ type = 'capsule'; size = [  dist*0.4, 0.04  ]; translate = [ 0, 0, (-dist * 0.5)-0.02 ]; rot = [0,0,90]; link='abdomen';}
                if( n==='neck' && name === 'head' ){ type = 'capsule'; size = [ 0.06, dist ]; translate = [ 0, 0, -dist * 0.5 ]; rot = [90,0,0]; link='chest'; }
                if( n==='head' && name === 'End_head' ){ type = 'capsule'; size = [ 0.1, dist-0.17 ]; translate = [ 0, 0.02, (-dist * 0.5)+0.02 ]; rot = [90,0,0]; link='neck'; }
                
                //if( n==='head' && !headDone ){ console.log(name); headDone = true; type = 'sphere'; dist=0.08; size = [ 0.08, 0.2, dist ]; translate = [ 0, 0.025, -0.08 ]; }

	            /*if( n==='chest' && name==='neck' ){ type = 'box'; size = [  0.28, 0.24, dist ]; translate = [ 0, 0, -dist * 0.5 ]; }
	            if( n==='abdomen' && name==='chest'  ){ type = 'box'; size = [ 0.24, 0.20,  dist ]; translate = [ 0, 0, -dist * 0.5 ]; }
                if( n==='hip' && name==='abdomen' ){ type = 'box'; size = [  0.28, 0.24, dist ]; translate = [ 0, 0, -dist * 0.5 ]; }*/

                
                
                


                if( n==='chest' && name==='rBreast' && root.engine!=='HAVOK' ){ n='rBreast'; parent = bone; type = 'sphere'; size = [ 0.065 ]; translate = [ 0.065,0,0 ]; this.breast=true; motion = true; link='chest'; }
                if( n==='chest' && name==='lBreast' && root.engine!=='HAVOK' ){ n='lBreast'; parent = bone; type = 'sphere'; size = [ 0.065 ]; translate = [ 0.065,0,0 ]; this.breast=true; motion = true; link='chest'; }
                

                // arm

                if( n==='lCollar' && name==='lShldr'){ type = 'capsule'; size = [  0.05, dist*0.3 ]; translate = [dist*0.6 , 0, 0 ]; rot = [0,0,90]; link='chest'; }
                if( n==='lShldr' && name==='lForeArm'){ type = 'capsule'; size = [  0.05, dist ]; translate = [dist * 0.5, 0, 0 ]; rot = [0,0,90]; link='lCollar'; }
                if( n==='lForeArm' && name==='lHand'){ type = 'capsule'; size = [ 0.04, dist ]; translate = [dist * 0.5, 0, 0 ]; rot = [0,0,90]; link='lShldr'; }
                if( n==='lHand' && name==='lMid1'){ type = 'box'; size = [ dist*2, 0.09, 0.05 ]; translate = [dist, 0, 0 ]; link='lForeArm'; }

                if( n==='rCollar' && name==='rShldr'){ type = 'capsule'; size = [  0.05, dist*0.3 ]; translate = [-dist*0.6, 0, 0 ]; rot = [0,0,90]; link='chest'; }
                if( n==='rShldr' && name==='rForeArm'){ type = 'capsule'; size = [  0.05, dist ]; translate = [-dist * 0.5, 0, 0 ]; rot = [0,0,90]; link='rCollar'; }
                if( n==='rForeArm' && name==='rHand' ){ type = 'capsule'; size = [ 0.04, dist ]; translate = [-dist * 0.5, 0, 0 ]; rot = [0,0,90]; link='rShldr'; }
                if( n==='rHand' && name==='rMid1'){ type = 'box'; size = [ dist*2, 0.09, 0.05 ]; translate = [-dist, 0, 0 ]; link='rForeArm'; }

                


	            // legs

                if( n==='lThigh' ){ type = 'capsule'; size = [  0.08, dist ]; rot = [90,0,0]; link='hip'; }
                if( n==='lShin' ){ type = 'capsule'; size = [  0.065, dist ]; rot = [90,0,0]; link='lThigh'; }
                //if( n==='lFoot' ){ type = 'box'; size = [  0.1, dist*1.4, 0.06 ]; translate = [0, (dist * 0.5)-0.025, 0.06 ]; link:'lShin'; }
                if( n==='lFoot' ){ type = 'capsule'; size = [  0.05, dist ]; translate = [0, (dist * 0.5)-0.025, 0.04 ]; link='lShin'; }

                if( n==='rThigh' ){ type = 'capsule'; size = [  0.08, dist ]; rot = [90,0,0]; link='hip'; }
                if( n==='rShin' ){ type = 'capsule'; size = [  0.065, dist ]; rot = [90,0,0]; link='rThigh'; }
                //if( n==='rFoot' ){ type = 'box'; size = [  0.1, dist*1.4, 0.06 ]; translate = [0, (dist * 0.5)-0.025, 0.06 ]; link:'rShin';}
                if( n==='rFoot' ){ type = 'capsule'; size = [  0.05, dist ]; translate = [0, (dist * 0.5)-0.025, 0.04 ]; link='rShin'; }



                //if( n==='rFoot' && name==='lToes' ){ n='lToes'; parent = bone; type = 'capsule'; size = [  0.05, 0.1 ]; translate = [0, 0, 0 ]; link='rFoot'; rot = [0,0,0]; }
                //if( n==='lFoot' && name==='rToes' ){ n='rToes'; parent = bone; type = 'capsule'; size = [  0.05, 0.1 ]; translate = [0, 0, 0 ]; link='rFoot'; rot = [0,0,0]; }

                if( this.withFinger ) {

                    if( n==='lHand' && name==='lMid1'){ type = 'box'; size = [ dist, 0.09, 0.05 ]; translate = [dist*0.5, 0, 0 ]; link='lForeArm'; }
                    if( n==='rHand' && name==='rMid1'){ type = 'box'; size = [ dist, 0.09, 0.05 ]; translate = [-dist*0.5, 0, 0 ]; link='rForeArm'; }


                    if( n==='rThumb1' && name==='rThumb2' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; link='rHand'; }
                    if( n==='rThumb2' && name==='rThumb3' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; link='rHand'; }


                    if( n==='rHand' && name==='rMid1' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; translate = [-dist*0.6, 0, 0 ]; link='rHand'; }
                    if( n==='rMid1' && name==='rMid2' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; translate = [-dist*0.6, 0, 0 ]; link='rHand'; }
                    if( n==='rMid2' && name==='rMid3' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; translate = [-dist*0.6, 0, 0 ]; link='rHand'; }

                }

                

	            

                if( type !== null ){

                    phyName = this.prefix +'_bone_'+n;

                	// translation
                    tmpMtx.makeTranslation( translate[0], translate[1], translate[2] );
                    // rotation
                    if( rot ){
                        tmpMtxR.makeRotationFromEuler( e.set( rot[0]*torad, rot[1]*torad, rot[2]*torad ) );
                        tmpMtx.multiply( tmpMtxR );
                    }

                    mtx.copy( parent.matrixWorld );
                    mtx.decompose( p, q, s );

                    this.posRef[phyName] = p.toArray()
                    if( n==='lForeArm' || n==='rForeArm' ){
                        _q.setFromAxisAngle( {x:0, y:1, z:0}, -90*torad )
                        q.multiply( _q )
                    } 

                    this.quatRef[phyName] = q.toArray()
                     
                    mtx.multiplyMatrices( parent.matrixWorld, tmpMtx );
                    mtx.decompose( p, q, s );

                	let physicData = {

                        name: phyName,
                        density:1,
                        //mass:1,
                        type: type,
                        size: MathTool.scaleArray(size,1,3),
                        pos: p.toArray(),
                        //rot: rot,
                        quat: q.toArray(),
                        kinematic: kinematic,
                        friction: 0.5,
                        restitution:0.1,
                        group:1,
                        mask:1|2,
                        material:'bones2',
                        shadow:false,
                        neverSleep: true,
                        helper: true,

                        //linked:link,
                        //iterations:[4,4],


                        /*bone:parent,
                        decal:tmpMtx.clone(),
                        decalinv:tmpMtx.clone().invert(),*/
                        
                    }

                    /*if( this.useSolver ){
                        physicData['solver'] = this.prefix+'_solver'
                        physicData['linked'] = this.prefix+'_bone_'+link
                        physicData['kinematic'] = false
                    }*/

                    data.push( physicData )

                    this.nameList.push( phyName )

                    this.nodes.push({
                    	name: phyName,
                        kinematic: kinematic,
                        motion:motion,// auto move
                    	bone:parent,
                        decal:tmpMtx.clone(),
                        decalinv:tmpMtx.clone().invert(),
                        quat:q.toArray(),
                        pos:p.toArray(),
                        cc:0,
                    })
                }

            }
        }

        //console.log( data )

        root.motor.add( data )

        //if( this.useSolver ) this.solver.start();
       
        this.addLink()

        this.ready = true

	}

    addLink () {

        // Stiffness / Damping
        // raideur / amortissement
        //let sp = [0.05,1]
        let sp = [0.05, 1, 0]
        if(root.engine==='PHYSX'){
            // stiffness / damping / restitution / bounceThreshold / contactDistance
            //[0,0, 0, 0.5]
            // raideur / amortissement
            sp = [50,10, 0, 0.5]
        }




        let p = this.prefix+'_bone_';
        let data = []
        let sett = {
            type:'joint', 
            mode:'d6',
            visible:false,
            lm:[  ['ry',-180,180,...sp], ['rz',-180,180,...sp] ],

            collision:false,
            helperSize:0.05,

            //acc:true,

            //worldAxis:[1,0,0],

            autoDrive: true,

        }

        let breastMotion = [-0.001, 0.001, 100, 0.2, 0.5]
        

        data.push({ ...sett, b1:p+'hip', b2:p+'abdomen', worldPos:this.posRef[p+'abdomen'], worldQuat:this.quatRef[p+'hip'], lm:[ ['rx',-20,20,...sp], ['ry',-20,20,...sp], ['rz',-20,20,...sp]] })
        data.push({ ...sett, b1:p+'abdomen', b2:p+'chest', worldPos:this.posRef[p+'chest'], worldQuat:this.quatRef[p+'chest'], lm:[ ['rx',-20,20,...sp], ['ry',-20,20,...sp], ['rz',-20,20,...sp]] })
        data.push({ ...sett, b1:p+'chest', b2:p+'neck', worldPos:this.posRef[p+'neck'], worldQuat:this.quatRef[p+'neck'], lm:[ ['rx',-60,60,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] })
        data.push({ ...sett, b1:p+'neck', b2:p+'head', worldPos:this.posRef[p+'head'], worldQuat:this.quatRef[p+'head'], lm:[ ['rx',-60,60,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] })
        //data.push({ type:'joint', mode:'d6', b1:this.prefix*'chest', b2:this.prefix*'abdomen' })

        // arm

        data.push({ ...sett, b1:p+'chest', b2:p+'rCollar', worldPos:this.posRef[p+'rCollar'],  worldQuat:this.quatRef[p+'rCollar'], lm:[ ['rx',-10,10,...sp], ['ry',-10,10,...sp], ['rz',-10,10,...sp]] })
        data.push({ ...sett, b1:p+'chest', b2:p+'lCollar', worldPos:this.posRef[p+'lCollar'],  worldQuat:this.quatRef[p+'lCollar'], lm:[ ['rx',-10,10,...sp], ['ry',-10,10,...sp], ['rz',-10,10,...sp]] })

        data.push({ ...sett, b1:p+'rCollar', b2:p+'rShldr', worldPos:this.posRef[p+'rShldr'],  worldQuat:this.quatRef[p+'rShldr'] })
        data.push({ ...sett, b1:p+'lCollar', b2:p+'lShldr', worldPos:this.posRef[p+'lShldr'],  worldQuat:this.quatRef[p+'lShldr'] })

       //data.push({ ...sett, b1:p+'chest', b2:p+'rShldr', worldPos:this.posRef[p+'rShldr'], worldQuat:this.quatRef[p+'rShldr'] })
        //data.push({ ...sett, b1:p+'chest', b2:p+'lShldr', worldPos:this.posRef[p+'lShldr'], worldQuat:this.quatRef[p+'lShldr'] })

        data.push({ ...sett, b1:p+'rShldr', b2:p+'rForeArm', worldPos:this.posRef[p+'rForeArm'], worldQuat:this.quatRef[p+'rForeArm'], lm:[['rx',0,160,...sp]] })
        data.push({ ...sett, b1:p+'lShldr', b2:p+'lForeArm', worldPos:this.posRef[p+'lForeArm'], worldQuat:this.quatRef[p+'lForeArm'], lm:[['rx',0,160,...sp]] })

        data.push({ ...sett, b1:p+'rForeArm', b2:p+'rHand', worldPos:this.posRef[p+'rHand'], worldQuat:this.quatRef[p+'rHand'], lm:[['rx',0,160,...sp], ['ry',-10,10,...sp]] })
        data.push({ ...sett, b1:p+'lForeArm', b2:p+'lHand', worldPos:this.posRef[p+'lHand'], worldQuat:this.quatRef[p+'lHand'], lm:[['rx',0,160,...sp], ['ry',-10,10,...sp]] })

        //data.push({ ...sett, b1:p+'rShldr', b2:p+'rForeArm', worldPos:this.posRef[p+'rForeArm'], worldAxis:[1,0,0], lm:[['rx',-120, 0]] })
        //data.push({ ...sett, b1:p+'lShldr', b2:p+'lForeArm', worldPos:this.posRef[p+'lForeArm'], worldAxis:[1,0,0], lm:[['rx',-120, 0]] })

        // leg

        data.push({ ...sett, b1:p+'hip', b2:p+'rThigh', worldPos:this.posRef[p+'rThigh'],  worldQuat:this.quatRef[p+'rThigh'] })
        data.push({ ...sett, b1:p+'hip', b2:p+'lThigh', worldPos:this.posRef[p+'lThigh'],  worldQuat:this.quatRef[p+'lThigh'] })

        data.push({ ...sett, b1:p+'rThigh', b2:p+'rShin', worldPos:this.posRef[p+'rShin'], lm:[['rx',0,160,...sp]], worldQuat:this.quatRef[p+'rShin'] })
        data.push({ ...sett, b1:p+'lThigh', b2:p+'lShin', worldPos:this.posRef[p+'lShin'], lm:[['rx',0,160,...sp]], worldQuat:this.quatRef[p+'lShin'] })

        data.push({ ...sett, b1:p+'rShin', b2:p+'rFoot', worldPos:this.posRef[p+'rFoot'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]], worldQuat:this.quatRef[p+'rFoot'] })
        data.push({ ...sett, b1:p+'lShin', b2:p+'lFoot', worldPos:this.posRef[p+'lFoot'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]], worldQuat:this.quatRef[p+'lFoot'] })

        if(this.breast){
            data.push({ ...sett, b1:p+'chest', b2:p+'rBreast', worldPos:this.posRef[p+'rBreast'], worldQuat:this.quatRef[p+'rBreast'], lm:[['x',...breastMotion], ['y',...breastMotion], ['z',...breastMotion]] })
            data.push({ ...sett, b1:p+'chest', b2:p+'lBreast', worldPos:this.posRef[p+'lBreast'], worldQuat:this.quatRef[p+'lBreast'], lm:[['x',...breastMotion], ['y',...breastMotion], ['z',...breastMotion]] })
        }

        let x = 0
        for( let j in data ){
            data[j].name = this.prefix + '_joint_'+ x
            this.nameList.push( data[j].name )
            this.jointList.push( data[j].name )
            x++
        }


        root.motor.add( data )

    }





    /*makeLink () {

        let p = this.prefix;
        let data = []
        data.push({ type:'joint', mode:'d6', b1:p+'hip', b2:p+'abdomen', visible:true })
        data.push({ type:'joint', mode:'d6', b1:p+'abdomen', b2:p+'chest', visible:true })
        //data.push({ type:'joint', mode:'d6', b1:this.prefix*'chest', b2:this.prefix*'abdomen' })

        //console.log(this.prefix, data)

        root.motor.add( data )

    }*/

	updateMatrixWorld( force ){

        if(!this.ready) return

		let up = []

		const nodes = this.nodes;
		let i = nodes.length, node, bone, body;


		while( i-- ){

            node = nodes[i];
            bone = node.bone;

            if( node.kinematic ){


                //_tmpMatrix.multiplyMatrices( _rootMatrix, bone.matrixWorld );
                _endMatrix.multiplyMatrices( bone.matrixWorld, node.decal );
                _endMatrix.decompose( _p, _q, _s );

                node.pos = _p.toArray();
                node.quat = _q.toArray();

                up.push({ name:node.name, pos:node.pos, quat:node.quat })

                if( node.motion ) this.freeBone(node)

            } else {

                body = Utils.byName( node.name )

                if(body){

                    _endMatrix.copy( body.matrixWorld ).multiply( node.decalinv );

                    //_endMatrix.multiplyMatrices( node.decalinv, bone.matrixWorld );

                    //_endMatrix
                    //.copy( body.matrixWorld )
                    //.decompose( _p, _q, _s )
                    //.compose( _p, _q, _s.set( 1, 1, 1 ) )
                    //.multiply( node.decalinv );

                    /*if ( bone.parent && bone.parent.isBone ) {

                        //_tmpMatrix.getInverse( bone.parent.matrixWorld );
                        _tmpMatrix.copy( bone.parent.matrixWorld ).invert()
                        _tmpMatrix.multiply( _endMatrix );

                    } else {

                        _tmpMatrix.copy( _endMatrix );

                    }*/

                    bone.phyMtx.copy( _endMatrix );
                    bone.isPhysics = true;// .copy( _endMatrix );
                }
            }

        }

        if( up.length !== 0 ) root.motor.change( up, true )

	}

	dispose(){

        root.motor.remove( this.nameList )

        this.nodes = []
        this.posRef = {}
        this.quatRef = {}
		this.parent.remove( this );

        this.nameList = []
        this.jointList = []
		
	}

}