import { Object3D, Vector3, Quaternion, Euler, Matrix4 } from 'three';
import { MathTool, torad } from '../../core/MathTool.js';


/** __
*    _)_|_|_
*   __) |_| | 2023
*  @author lo.th / https://github.com/lo-th
* 
*  SKELETON BODY
*  make and controle rigidbody from skeleton bones 
*  https://wheecorea.com/total-football-way/flexibility-and-joint-limitations/
*/

let Nb = 0


const _rootMatrix = /*@__PURE__*/ new Matrix4();
const _tmpMatrix = /*@__PURE__*/ new Matrix4();
const _tmpMatrix2 = /*@__PURE__*/ new Matrix4();
const _endMatrix = /*@__PURE__*/ new Matrix4();
const _p = /*@__PURE__*/ new Vector3();
const _q = /*@__PURE__*/ new Quaternion();
const _s = /*@__PURE__*/ new Vector3();


const _matrixWorldInv = /*@__PURE__*/ new Matrix4();
const _boneMatrix = /*@__PURE__*/ new Matrix4();

const fingers = [ 'Thumb', 'Index', 'Mid', 'Ring', 'Pinky' ];
const Spine = [ 'hip', 'abdomen', 'abdomen2', 'chest', 'neck', 'head', 'rCollar', 'lCollar', 'lShldr', 'rShldr', 'lThigh', 'rThigh', 'rBreast', 'lBreast' ];

//const NeedFixe = [  'abdomen', 'neck'];

export class SkeletonBody extends Object3D {

	constructor ( motor, name, model, bones, mass = null, option = {} ) {

		super()

        this.motor = motor;

		this.prefix = name || 'yoo_'

        this.mode = 'follow'

        this.withFinger = false

        this.nodes = [];
		//this.bones = bones;//character.model.skeleton.bones;
		this.model = model//character.model.root;

        // HERE IS THE FIXE :)
        this.bones = getBoneList(model)
       
        this.scaler = this.model.scale.x; 
        this.posRef = {};
        this.quatRef = {};

        this.useSolver = false 
        if( this.motor.engine !== 'PHYSX' ) this.useSolver = false;
        this.useAggregate = false
        if(this.motor.engine === 'PHYSX'){
            this.useAggregate = !this.useSolver
        }

        this.nameList = [];
        this.jointList = [];

        this.breast = false;
        this.ready = false;

        this.withBreast = option.breast || false

        this.matrix = model.matrixWorld
        this.matrixAutoUpdate = false;

        this.mass = mass; 
        this.friction = 0.5; 
        this.restitution = 0;
        this.option = option;
        this.useDrive = option.useDrive !== undefined ?  option.useDrive : true;
        this.showJoint = option.showJoint !== undefined ?  option.showJoint : false;

        this.detectSpineNum()
		this.init()

	}

    detectSpineNum(){

        this.isTreeSpine = false

        let i, lng = this.bones.length;
        for( i = 0; i < lng; i++ ){
            //this.bones[i].updateMatrixWorld( true, false );
            if(this.bones[i].name === 'abdomen2') this.isTreeSpine = true

        }

        //this.bones[0].updateMatrixWorld( true, true );
        //console.log('is three spine model '+ this.isTreeSpine)

    }

    wake(){

        const d = []
        let i = this.nodes.length;
        while( i-- ) d.push( { name:this.nodes[i].name, wake:true } )
        this.motor.change( d );

    }

    setMass( mass ){

        if( mass === this.mass ) return
        this.mass = mass
        const d = []
        let i = this.nodes.length;
        let m = this.mass/i;
        while( i-- ) d.push( { name:this.nodes[i].name, mass:m } )
        this.motor.change( d );

    }

    setMode( mode ){

        if( mode === this.mode ) return

        this.mode = mode
        const data = []

        let kinematic = this.mode === 'follow';

        let i = this.nodes.length, node

        while( i-- ){

            node = this.nodes[i]
            data.push( { name:node.name, kinematic:kinematic } )
            node.kinematic = kinematic
            node.bone.isPhysics = !kinematic;
            
        }

        this.motor.change( data );

    }

    freeBone( node ){

        if(!node.kinematic) return
        node.cc++
        if(node.cc=== 20 ){
            node.cc = 0;
            node.kinematic = false;
            node.bone.isPhysics = true;
            this.motor.change( { name : node.name, kinematic:false } )
        }
        
    }

    isVisible( v ){

        //let i = this.nodes.length, node
        //while( i-- ) Utils.byName( this.nodes[i].name ).visible = v

        let i = this.nameList.length, node;
        while( i-- ) this.motor.byName( this.nameList[i] ).visible = v;
        /*let data = []
        i = this.jointList.length;
        while( i-- ) data.push( { name:this.jointList[i], visible:v } );
        root.motor.change( data );*/

    }

    init(){
            
        this.addNode()
        this.addLink()

        
        if( this.useSolver ){

            this.solver = this.motor.add({ type:'solver', name:this.prefix+'_solver', iteration:32, fix:true, needData:false });
            
            this.motor.add( [...this.bodyData ] )
            for(let j in this.linkData){
                this.solver.addJoint(this.linkData[j])
            }

            this.solver.start();
            //this.solver.commonInit();

        } else {

            this.motor.add( [...this.bodyData, ...this.linkData ] )
        }

        
        this.dispatchEvent( { type: 'start', message: 'go !' } );
        this.ready = true

    }

	addNode(){

        

        

		const data = []
        
        // get character bones var bones = character.skeleton.bones;

        let scaleMatrix = new Matrix4().makeScale(this.scaler, this.scaler, this.scaler)
        

        let p = new Vector3();
        let s = new Vector3();
        let q = new Quaternion();
        let e = new Euler();
        let mtx = new Matrix4();

        let p1 = new Vector3();
        let p2 = new Vector3();

        let tmpMtx = new Matrix4();
        let tmpMtxR = new Matrix4();
        let rootMtx = new Matrix4();

        _matrixWorldInv.copy( this.model.matrixWorld ).invert();

        let sizer  =  [1.4,1,1,1,1,1,1]
        if(this.option.sizer){
            sizer = this.option.sizer
        }


        let i, lng = this.bones.length, name, n, boneId, bone, parent;///, child, o, parentName;
        let size, dist, rot, type, mesh, kinematic, translate, phyName, motion, link;
        let forceName

        let r, w

        let averageMass = 0;
        if(this.mass) averageMass = this.mass / lng;

        for( i = 0; i < lng; i++ ){

        	type = null;
            bone = this.bones[i];

            name = bone.name;
            parent = bone.parent;

            forceName = ''

            if( parent && parent.isBone) {

            	n = parent.name;

                _boneMatrix.multiplyMatrices( _matrixWorldInv, bone.matrixWorld );
                p1.setFromMatrixPosition( _boneMatrix );

                _boneMatrix.multiplyMatrices( _matrixWorldInv, parent.matrixWorld )
                p2.setFromMatrixPosition( _boneMatrix );


            	//p1.setFromMatrixPosition( parent.matrixWorld );
            	//p2.setFromMatrixPosition( bone.matrixWorld );

                dist = p1.distanceTo( p2 );// * this.scaler;

	            //translate = [ -dist * 0.5, 0, 0 ];
	            translate = [ 0, 0, dist * 0.5 ];
                size = [ dist, 1, 1 ];
                rot = null;//[0,0,0];
                kinematic = true;
                motion = false;
                link = 'null'

                r = dist*sizer[0]
                w = r*1.2

                if( n==='hip' && name==='abdomen' ){ type = 'capsule'; size = [ r, w ]; translate = [ 0, 0, 0 ]; rot = [0,0,90]; link='null';}

                if(this.isTreeSpine){
                    r = dist*0.8*sizer[1]
                    if( n==='abdomen' && name==='abdomen2'  ){ type = 'capsule'; size = [ r, r*0.3 ]; translate = [ 0, r*0.3, (-dist * 0.5)-0.06 ]; rot = [90,0,0]; link='hip';  }
                    r = dist*0.9*sizer[1]
                    if( n==='abdomen2' && name==='chest'  ){ type = 'capsule'; size = [ r, r*0.3 ]; translate = [ 0, r*0.15, (-dist * 0.5)-0.06 ]; rot = [90,0,0]; link='abdomen';  }

                  }else{
                    if( n==='abdomen' && name==='chest' ){ type = 'capsule'; size = [ dist*0.7*sizer[1], 0.08 ]; translate = [ 0, 0, (-dist * 0.5)-0.06 ]; rot = [90,0,0]; link='hip'; }
                }

                r = dist*0.4*sizer[2]
                if( n==='chest' && name === 'neck' ){  type = 'capsule'; size = [  r, 0.04 ]; translate = [ 0, 0, -r ]; rot = [0,0,90]; link=this.isTreeSpine? 'abdomen2':'abdomen';}
                if( n==='neck' && name === 'head' ){ type = 'capsule'; size = [ 0.06*sizer[3], dist ]; translate = [ 0, 0, -dist * 0.5 ]; rot = [90,0,0]; link='chest'; }
                if( n==='head' && name === 'End_head' ){ type = 'capsule'; size = [ 0.08*sizer[4], dist-0.17 ]; translate = [ 0, 0.02, (-dist * 0.5)+0.02 ]; rot = [90,0,0]; link='neck'; }
                
                //if( n==='head' && !headDone ){ console.log(name); headDone = true; type = 'sphere'; dist=0.08; size = [ 0.08, 0.2, dist ]; translate = [ 0, 0.025, -0.08 ]; }
	            //if( n==='chest' && name==='neck' ){ type = 'box'; size = [  0.28, 0.24, dist ]; translate = [ 0, 0, -dist * 0.5 ]; }
	            //if( n==='abdomen' && name==='chest'  ){ type = 'box'; size = [ 0.24, 0.20,  dist ]; translate = [ 0, 0, -dist * 0.5 ]; }


                // TODO bug with worker !!!!
                if(this.withBreast){
                    if( n==='chest' && name==='rBreast' && this.motor.engine!=='HAVOK' ){ n='rBreast'; parent = bone; type = 'sphere'; size = [ 0.065 ]; translate = [ 0.065,0,0 ]; this.breast=true; motion = true; link='chest'; }
                    if( n==='chest' && name==='lBreast' && this.motor.engine!=='HAVOK' ){ n='lBreast'; parent = bone; type = 'sphere'; size = [ 0.065 ]; translate = [ 0.065,0,0 ]; this.breast=true; motion = true; link='chest'; }
                }
                
                

                // arm

                r = 0.04*sizer[5];
                w = dist-r

                if( n==='lCollar' && name==='lShldr'){ type = 'capsule'; size = [  r, dist*0.3 ]; translate = [dist*0.6 , 0, 0 ]; rot = [0,0,90]; link='chest'; }
                if( n==='lShldr' && name==='lForeArm'){ type = 'capsule'; size = [  r, w ]; translate = [w * 0.5, 0, 0 ]; rot = [0,0,90]; link='lCollar'; }
                if( n==='lForeArm' && name==='lHand'){ type = 'capsule'; size = [ r, w ]; translate = [w * 0.5, 0, 0 ]; rot = [0,0,90]; link='lShldr'; }
                if( n==='lHand' && name==='lMid1'){ type = 'box'; size = [ dist*2, 0.09, 0.05 ]; translate = [dist, 0, 0 ]; link='lForeArm'; }

                if( n==='rCollar' && name==='rShldr'){ type = 'capsule'; size = [  r, dist*0.3 ]; translate = [-dist*0.6, 0, 0 ]; rot = [0,0,90]; link='chest'; }
                if( n==='rShldr' && name==='rForeArm'){ type = 'capsule'; size = [  r, w ]; translate = [-w * 0.5, 0, 0 ]; rot = [0,0,90]; link='rCollar'; }
                if( n==='rForeArm' && name==='rHand' ){ type = 'capsule'; size = [ r, w ]; translate = [-w * 0.5, 0, 0 ]; rot = [0,0,90]; link='rShldr'; }
                if( n==='rHand' && name==='rMid1'){ type = 'box'; size = [ dist*2, 0.09, 0.05 ]; translate = [-dist, 0, 0 ]; link='rForeArm'; }

	            // legs

                r = 0.06*sizer[6];
                w = dist-r

                if( n==='lThigh' ){ type = 'capsule'; size = [ r, w ]; rot = [90,0,0]; translate = [ 0, 0, w * 0.5  ]; link='hip'; }
                if( n==='lShin' ){ type = 'capsule'; size = [  r, w ]; rot = [90,0,0]; translate = [ 0, 0, w * 0.5 ]; link='lThigh'; }
                //if( n==='lFoot' ){ type = 'box'; size = [  0.1, dist*1.4, 0.06 ]; translate = [0, (dist * 0.5)-0.025, 0.06 ]; link:'lShin'; }
                if( n==='lFoot' ){ type = 'capsule'; size = [  0.05, dist ]; translate = [0, (dist * 0.5)-0.025, 0.04 ]; link='lShin'; }

                if( n==='rThigh' ){ type = 'capsule'; size = [  r, w ]; rot = [90,0,0]; translate = [ 0, 0, w * 0.5 ]; link='hip'; }
                if( n==='rShin' ){ type = 'capsule'; size = [  r, w ]; rot = [90,0,0]; translate = [ 0, 0, w * 0.5 ]; link='rThigh'; }
                //if( n==='rFoot' ){ type = 'box'; size = [  0.1, dist*1.4, 0.06 ]; translate = [0, (dist * 0.5)-0.025, 0.06 ]; link:'rShin';}
                if( n==='rFoot' ){ type = 'capsule'; size = [  0.05, dist ]; translate = [0, (dist * 0.5)-0.025, 0.04 ]; link='rShin'; }

                // extra ear
                r = 0.04;
                w = dist-r;
                
                
                if( n==='rEar_0'){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; link='head'; Spine.push('rEar_0'); }
                if( n==='rEar_1'){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; link='rEar_0'; Spine.push('rEar_1');}
                if( n==='rEar_2' ){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; link='rEar_1'; Spine.push('rEar_2');}
                if( n==='rEar_3' ){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; link='rEar_2'; }

                if( n==='lEar_0'){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; link='head'; Spine.push('lEar_0');}
                if( n==='lEar_1'){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; link='lEar_0'; Spine.push('lEar_1');}
                if( n==='lEar_2' ){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; link='lEar_1'; Spine.push('lEar_2');}   
                if( n==='lEar_3' ){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; link='lEar_2'; }

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
                    //translate = MathTool.scaleArray(translate,this.scaler,3);
                    tmpMtx.makeTranslation( translate[0], translate[1], translate[2] );

                    // rotation
                    if( rot ){
                        tmpMtxR.makeRotationFromEuler( e.set( rot[0]*torad, rot[1]*torad, rot[2]*torad ) );
                        tmpMtx.multiply( tmpMtxR );
                    }

                    //_boneMatrix.multiplyMatrices( _matrixWorldInv, parent.matrixWorld );
                    
                    //parent.matrixWorld );
                    parent.updateWorldMatrix( true, false );
                    _boneMatrix.multiplyMatrices( _matrixWorldInv, parent.matrixWorld )
                    mtx.copy( _boneMatrix )
                    //mtx.multiplyMatrices( _matrixWorldInv, parent.matrixWorld )
                    //_tmpMatrix2.makeScale(this.scaler,this.scaler,this.scaler)
                   // mtx.multiply(_tmpMatrix2)//Matrices( _matrixWorldInv, bone.matrixWorld );
                    //p
                    //mtx.copy( parent.matrixWorld )//.multiply(tmpMtx)//parent.matrixWorld );
                    mtx.decompose( p, q, s );

                    //p.copy(parent.position)

                    //p.copy(p2)

                    this.posRef[phyName] = p.toArray()

                    let side = 1;
                    side = n.substring(0, 1) === 'r' ? -1 : side;

                    //this.posRef[phyName] = p2.toArray()
                    // if( n==='lForeArm'  )console.log(this.posRef[phyName])
                    //this.posRef[phyName] = MathTool.scaleArray(p.toArray(),this.scaler,3)

                    if( n==='hip' || n==='abdomen'|| n==='abdomen2'|| n==='chest'|| n==='neck' ){
                        _q.setFromAxisAngle( {x:0, y:1, z:0}, -90*torad )
                        q.multiply( _q )
                    }

                    if( n==='lForeArm' || n==='rForeArm'){
                        _q.setFromAxisAngle( {x:0, y:1, z:0}, 90*torad*side )
                        q.multiply( _q )
                    } 

                    if( n==='lShldr' || n==='lHand' || n==='rShldr' || n==='rHand' ){
                        _q.setFromAxisAngle( {x:0, y:0, z:1}, 90*torad*side )
                        q.multiply( _q )
                    }

                    /*if( n==='rThigh' || n==='lThigh' ){
                        _q.setFromAxisAngle( {x:0, y:1, z:0}, 90*torad )
                        q.multiply( _q )
                    } */

                    this.quatRef[phyName] = q.toArray();
                     
                    mtx.multiplyMatrices( parent.matrixWorld, tmpMtx );
                    mtx.multiplyMatrices( _boneMatrix, tmpMtx );
                    mtx.decompose( p, q, s );


                    //this.posRef[phyName] = p.toArray()
                    // collection

                    this.nameList.push( phyName );

                    

                    



                	// for physic body
                    let bb = {

                        name: phyName,

                        friction: this.friction,
                        restitution: this.restitution,
                        
                        type: type,
                        size: MathTool.scaleArray(size,this.scaler,3),
                        pos: p.toArray(),
                        quat: q.toArray(),
                        kinematic: kinematic,
                        
                        //group:16,
                        //mask:mask,
                        //mask:0,
                        material:'hide',
                        //material:'debug',
                        shadow:false,
                        //neverSleep: true,
                        helper: true,
                        hcolor:[0.0, 0.5, 1],
                        hcolor2:[0.0, 0.2, 1],
                        //hcolor:[0.87, 0.76, 0.65],
                        //hcolor2:[0.9, 0.77, 0.64],

                        penetrationVelocity:3,
                        stabilization:0.1,
                        //maxVelocity:[100,10],
                        damping:[0.25,0.5],
                        //maxAngularVelocity:3,

                        //linked:link,
                        //iterations:[4,4],
                        //inertiaScale:[20,20,20],
                        //iterations:[4,2],


                        /*bone:parent,
                        decal:tmpMtx.clone(),
                        decalinv:tmpMtx.clone().invert(),*/

                        ...this.option
                        
                    }

                    if( this.useAggregate ){

                        // aggregate test
                        if( Spine.indexOf(n)!==-1 ){ 
                            bb['aggregate'] = this.prefix +'__Group';
                            bb['aggregateMax'] = 21;
                        }
                        bb['mask'] = 1|2;

                    } else {

                        let g1 = 1 << 6 // 64
                        let g2 = 1 << 7 // 128
                        let g3 = 1 << 8 // 256


                        /*let mask =  1|2;
                        //if( n==='rThigh' || n==='lThigh'  ) mask = 1|2|32;
                        if( n==='lForeArm' || n==='rForeArm' || n==='lShin' || n==='rShin'  ) mask = 1|2|32;
                        if( n==='rEar_1' || n==='rEar_2' || n==='rEar_3' || n==='lEar_1'|| n==='lEar_2'|| n==='lEar_3' ) mask = 1|2|32;
                        if( n==='rEar_0' || n==='rEar_0') mask = 0;

                        bb['group'] = 32;
                        bb['mask'] = mask;*/


                    }
                    

                    //
                    

                    if( this.mass !== null ) bb['mass'] = averageMass;
                    else bb['density'] = 1;

                    if( this.useSolver ){
                        bb['solver'] = this.prefix+'_solver'
                        bb['linked'] = this.prefix+'_bone_'+link
                        bb['kinematic'] = false
                    }


                    data.push(bb)

                    let inv = tmpMtx.clone().invert().premultiply(scaleMatrix);

                    const finalNodeData = {
                        name: phyName,
                        kinematic: kinematic,
                        motion:motion,// auto move
                        bone:parent,
                        decal:tmpMtx.clone(),
                        decalinv:inv,
                        quat:q.toArray(),
                        pos:p.toArray(),
                        //scaler:this.scaler,
                        cc:0,
                    }

                    this.nodes.push(finalNodeData)
                }

            }
        }


        this.bodyData = data

	}


    existe( name ){
        return this.nameList.indexOf(name) !== -1 ? true : false
    }

    addLink () {

        // Stiffness / Damping
        // raideur / amortissement
        //let sp = [0.05,1]
        //let sp = [0.05, 1, 0]
        let sp = [100,1]
        if(this.motor.engine==='PHYSX'){
            // stiffness / damping / restitution / bounceThreshold / contactDistance
            //[0,0, 0, 0.5]
            // raideur / amortissement
            //sp = [50,10, 0, 0.5]
        }

        let driveSetting = {
            stiffness:2,
            damping:0.1,
            forceLimit:10000000,
            isAcceleration:false,
        }

        /*driveSetting = {
            stiffness:10000,
            damping:500,
            forceLimit:100,
            isAcceleration:true,
        }*/




        let p = this.prefix+'_bone_';
        let data = []
        let sett = {
            type:'joint', 
            mode:'d6',
            
            lm:[  ['ry',-180,180,...sp], ['rz',-180,180,...sp] ],

            collision:false,
            helperSize:0.1,
            visible:this.showJoint,

            //acc:true,

            //worldAxis:[1,0,0],

            //autoDrive: true,

            /*drives: [
            ['rx', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ],
            ['ry', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ],
            ['rz', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ]
            ],*/

        }

        if( this.useDrive ){
            sett['drives'] = [
            ['rx', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ],
            ['ry', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ],
            ['rz', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ]
            ]
        }

        let breastMotion = [-0.001, 0.001, 1000, 0.2, 0.5]//100, 0.2, 0.5

        let spineLm = [ ['rx',-20,20,...sp], ['ry',-20,20,...sp], ['rz',-20,20,...sp]];
        data.push({ ...sett, b1:p+'hip', b2:p+'abdomen', worldPos:this.posRef[p+'abdomen'], worldQuat:this.quatRef[p+'hip'], lm:spineLm })


        if(this.isTreeSpine){
            data.push({ ...sett, b1:p+'abdomen', b2:p+'abdomen2', worldPos:this.posRef[p+'abdomen2'], worldQuat:this.quatRef[p+'abdomen2'], lm:spineLm })
            data.push({ ...sett, b1:p+'abdomen2', b2:p+'chest', worldPos:this.posRef[p+'chest'], worldQuat:this.quatRef[p+'chest'], lm:spineLm })

        } else {
            data.push({ ...sett, b1:p+'abdomen', b2:p+'chest', worldPos:this.posRef[p+'chest'], worldQuat:this.quatRef[p+'chest'], lm:spineLm })
        }



        //data.push({ ...sett, b1:p+'chest', b2:p+'neck', worldPos:this.posRef[p+'neck'], worldQuat:this.quatRef[p+'neck'], lm:[ ['rx',-60,60,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] })
        //data.push({ ...sett, b1:p+'neck', b2:p+'head', worldPos:this.posRef[p+'head'], worldQuat:this.quatRef[p+'head'], lm:[ ['rx',-60,60,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] })
        data.push({ ...sett, b1:p+'chest', b2:p+'neck', worldPos:this.posRef[p+'neck'], worldQuat:this.quatRef[p+'neck'], lm:[ ['rx',0,30,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] })
        data.push({ ...sett, b1:p+'neck', b2:p+'head', worldPos:this.posRef[p+'head'], worldQuat:this.quatRef[p+'head'], lm:[ ['rx',0,30,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] })
        //data.push({ type:'joint', mode:'d6', b1:this.prefix*'chest', b2:this.prefix*'abdomen' })

        // arm

        //data.push({ ...sett, b1:p+'chest', b2:p+'rCollar', worldPos:this.posRef[p+'rCollar'],  worldQuat:this.quatRef[p+'rCollar'], lm:[ ['rx',-10,10,...sp], ['ry',-10,10,...sp], ['rz',-10,10,...sp]] })
        //data.push({ ...sett, b1:p+'chest', b2:p+'lCollar', worldPos:this.posRef[p+'lCollar'],  worldQuat:this.quatRef[p+'lCollar'], lm:[ ['rx',-10,10,...sp], ['ry',-10,10,...sp], ['rz',-10,10,...sp]] })
        data.push({ ...sett, b1:p+'chest', b2:p+'rCollar', worldPos:this.posRef[p+'rCollar'],  worldQuat:this.quatRef[p+'rCollar'], mode:'fixe' })
        data.push({ ...sett, b1:p+'chest', b2:p+'lCollar', worldPos:this.posRef[p+'lCollar'],  worldQuat:this.quatRef[p+'lCollar'], mode:'fixe' })

        let shldrLm = [  ['rx',-90,120,...sp], ['ry',-10,10,...sp], ['rz',-90,90,...sp] ];

        data.push({ ...sett, b1:p+'rCollar', b2:p+'rShldr', worldPos:this.posRef[p+'rShldr'],  worldQuat:this.quatRef[p+'rShldr'], lm:shldrLm })
        data.push({ ...sett, b1:p+'lCollar', b2:p+'lShldr', worldPos:this.posRef[p+'lShldr'],  worldQuat:this.quatRef[p+'lShldr'], lm:shldrLm })

       //data.push({ ...sett, b1:p+'chest', b2:p+'rShldr', worldPos:this.posRef[p+'rShldr'], worldQuat:this.quatRef[p+'rShldr'] })
        //data.push({ ...sett, b1:p+'chest', b2:p+'lShldr', worldPos:this.posRef[p+'lShldr'], worldQuat:this.quatRef[p+'lShldr'] })

        if( this.existe(p+'rForeArm') ) data.push({ ...sett, b1:p+'rShldr', b2:p+'rForeArm', worldPos:this.posRef[p+'rForeArm'], worldQuat:this.quatRef[p+'rForeArm'], lm:[['rx',-150,1,...sp]] })
        if( this.existe(p+'lForeArm') ) data.push({ ...sett, b1:p+'lShldr', b2:p+'lForeArm', worldPos:this.posRef[p+'lForeArm'], worldQuat:this.quatRef[p+'lForeArm'], lm:[['rx',-150,1,...sp]] })

        let handLm = [  ['rx',-90,90,...sp], ['ry',-40,40,...sp], ['rz',-20,20,...sp] ];
        if( this.existe(p+'rHand') ) data.push({ ...sett, b1:p+'rForeArm', b2:p+'rHand', worldPos:this.posRef[p+'rHand'], worldQuat:this.quatRef[p+'rHand'], lm:handLm })
        if( this.existe(p+'lHand') ) data.push({ ...sett, b1:p+'lForeArm', b2:p+'lHand', worldPos:this.posRef[p+'lHand'], worldQuat:this.quatRef[p+'lHand'], lm:handLm })

        //data.push({ ...sett, b1:p+'rShldr', b2:p+'rForeArm', worldPos:this.posRef[p+'rForeArm'], worldAxis:[1,0,0], lm:[['rx',-120, 0]] })
        //data.push({ ...sett, b1:p+'lShldr', b2:p+'lForeArm', worldPos:this.posRef[p+'lForeArm'], worldAxis:[1,0,0], lm:[['rx',-120, 0]] })

        // leg

        let legLm = [  ['rx',-10,180,...sp], ['ry',-40,40,...sp], ['rz',-20,20,...sp] ];

        data.push({ ...sett, b1:p+'hip', b2:p+'rThigh', worldPos:this.posRef[p+'rThigh'], worldQuat:this.quatRef[p+'rThigh'], lm:legLm })
        data.push({ ...sett, b1:p+'hip', b2:p+'lThigh', worldPos:this.posRef[p+'lThigh'], worldQuat:this.quatRef[p+'lThigh'], lm:legLm })

        if( this.existe(p+'rShin') ) data.push({ ...sett, b1:p+'rThigh', b2:p+'rShin', worldPos:this.posRef[p+'rShin'], worldQuat:this.quatRef[p+'rShin'], lm:[['rx',0,145,...sp]] })
        if( this.existe(p+'lShin') ) data.push({ ...sett, b1:p+'lThigh', b2:p+'lShin', worldPos:this.posRef[p+'lShin'], worldQuat:this.quatRef[p+'lShin'], lm:[['rx',0,145,...sp]] })

        if( this.existe(p+'rFoot') ) data.push({ ...sett, b1:p+'rShin', b2:p+'rFoot', worldPos:this.posRef[p+'rFoot'], worldQuat:this.quatRef[p+'rFoot'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })
        if( this.existe(p+'lFoot') ) data.push({ ...sett, b1:p+'lShin', b2:p+'lFoot', worldPos:this.posRef[p+'lFoot'], worldQuat:this.quatRef[p+'lFoot'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })

        if(this.withBreast){
            if( this.existe(p+'rBreast') ) data.push({ ...sett, b1:p+'chest', b2:p+'rBreast', worldPos:this.posRef[p+'rBreast'], worldQuat:this.quatRef[p+'rBreast'], lm:[['x',...breastMotion], ['y',...breastMotion], ['z',...breastMotion]] })
            if( this.existe(p+'lBreast') ) data.push({ ...sett, b1:p+'chest', b2:p+'lBreast', worldPos:this.posRef[p+'lBreast'], worldQuat:this.quatRef[p+'lBreast'], lm:[['x',...breastMotion], ['y',...breastMotion], ['z',...breastMotion]] })
        }

        // EAR

        if( this.existe(p+'lEar_0') ) data.push({ ...sett, b1:p+'head',   b2:p+'lEar_0', worldPos:this.posRef[p+'lEar_0'], worldQuat:this.quatRef[p+'lEar_0'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] }) 
        if( this.existe(p+'lEar_1') ) data.push({ ...sett, b1:p+'lEar_0', b2:p+'lEar_1', worldPos:this.posRef[p+'lEar_1'], worldQuat:this.quatRef[p+'lEar_1'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })
        if( this.existe(p+'lEar_2') ) data.push({ ...sett, b1:p+'lEar_1', b2:p+'lEar_2', worldPos:this.posRef[p+'lEar_2'], worldQuat:this.quatRef[p+'lEar_2'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })
        if( this.existe(p+'lEar_3') ) data.push({ ...sett, b1:p+'lEar_2', b2:p+'lEar_3', worldPos:this.posRef[p+'lEar_3'], worldQuat:this.quatRef[p+'lEar_3'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })
        
        if( this.existe(p+'rEar_0') ) data.push({ ...sett, b1:p+'head',   b2:p+'rEar_0', worldPos:this.posRef[p+'rEar_0'], worldQuat:this.quatRef[p+'rEar_0'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })
        if( this.existe(p+'rEar_1') ) data.push({ ...sett, b1:p+'rEar_0', b2:p+'rEar_1', worldPos:this.posRef[p+'rEar_1'], worldQuat:this.quatRef[p+'rEar_1'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })
        if( this.existe(p+'rEar_2') ) data.push({ ...sett, b1:p+'rEar_1', b2:p+'rEar_2', worldPos:this.posRef[p+'rEar_2'], worldQuat:this.quatRef[p+'rEar_2'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })
        if( this.existe(p+'rEar_3') ) data.push({ ...sett, b1:p+'rEar_2', b2:p+'rEar_3', worldPos:this.posRef[p+'rEar_3'], worldQuat:this.quatRef[p+'rEar_3'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] })


        let x = 0
        for( let j in data ){
            data[j].name = this.prefix + '_joint_'+ x
            //this.nameList.push( data[j].name )
            this.jointList.push( data[j].name )
            x++
        }

        this.linkData = data;

    }

    displayJoint(v){

        let dt = []

        for( let b in this.jointList ){
            dt.push({ name:this.jointList[b], visible:v })
        }

        this.motor.change( dt )

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

        //if(!this.ready) return

		let up = []

		const nodes = this.nodes;
		let i = nodes.length, node, bone, body, n=0;


		while( i-- ){

            node = nodes[n];
            bone = node.bone;
            n++;

            if( node.kinematic ){

                // update from three to physic

                _endMatrix.multiplyMatrices( bone.matrixWorld, node.decal );
                _endMatrix.decompose( _p, _q, _s );

                node.pos = _p.toArray();
                node.quat = _q.toArray();

                up.push({ name:node.name, pos:node.pos, quat:node.quat });

                if( node.motion ) this.freeBone(node);

            } else {

                // update from physic to three

                body = this.motor.byName( node.name );

                if(body){
                    if(body.actif){
                        _endMatrix.copy( body.matrixWorld ).multiply( node.decalinv );
                        bone.phyMtx.copy( _endMatrix );
                        bone.isPhysics = true;
                    }
                    
                }
            }

        }

        if( up.length !== 0 ) this.motor.change( up, true );

        super.updateMatrixWorld( force );

	}

	dispose(){

        this.motor.remove( this.jointList );
        this.motor.remove( this.nameList );

        //if( this.useAggregate ) root.motor.remove(this.prefix +'__Group')

        this.nodes = []
        this.posRef = {}
        this.quatRef = {}
		this.parent.remove( this );

        this.nameList = []
        this.jointList = []
		
	}

}


function getBoneList( object ) {

    const boneList = [];
    if ( object.isBone === true ) {
        boneList.push( object );
    }
    for ( let i = 0; i < object.children.length; i ++ ) {
        boneList.push( ...getBoneList( object.children[ i ] ) );
    }
    return boneList;

}