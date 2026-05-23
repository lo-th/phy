import {
	Object3D, Group, Mesh, SkinnedMesh, Texture, Spherical,
    Matrix4, Quaternion, Euler, Vector3, Vector2,
    MathUtils,
    SphereGeometry, SkeletonHelper,
    MeshStandardMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshBasicMaterial,MeshPhysicalMaterial,
    TextureLoader,AnimationMixer,
    FrontSide, DoubleSide, Color,
    VectorKeyframeTrack, QuaternionKeyframeTrack, AnimationClip, Skeleton,
    Float32BufferAttribute, EquirectangularReflectionMapping, AdditiveBlending,
    CustomBlending,// AddEquation, SubtractEquation, ReverseSubtractEquation, MinEquation, MaxEquation,
    ZeroFactor,//, OneFactor, SrcColorFactor, OneMinusSrcColorFactor, 
    SrcAlphaFactor,
    AnimationUtils,AxesHelper,
    AdditiveAnimationBlendMode, NormalAnimationBlendMode,
} from 'three';

import { AvatarTools } from './AvatarTools.js';

import { MeshSssMaterial } from '../materials/MeshSssMaterial.js';

import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

import * as TWEEN from '../../libs/tween.esm.js'

import { Pool } from '../Pool.js';

import { Tension } from '../Tension.js';

import { ExoSkeleton } from './ExoSkeleton.js';

import { AnimPack } from './AnimPack.js';
import { AnimFBX } from './AnimFBX.js';
import { AnimRetarget } from './AnimRetarget.js';

import { AvatarAnimation } from './AvatarAnimation.js';

// ready model

import { Human } from './Human.js';
import { Human_low } from './Human_low.js';
import { Eva } from './Eva.js';
import { Lee } from './Lee.js';
import { Barbados } from './Barbados.js';

/** __
*    _)_|_|_
*   __) |_| | 2023
*  @author lo.th / https://github.com/lo-th
* 
*  AVATAR
*/

const FrameTime = 30;
const TimeFrame = 1/30;
const torad = Math.PI / 180;
const todeg = 180 / Math.PI;
const V = new Vector3();

const tmpMtx = new Matrix4();
const tmpQ = new Quaternion();
const tmpP = new Vector3();
const tmpP2 = new Vector3();
const UPZ = new Vector3(0,0,1);
const Q = new Quaternion().setFromAxisAngle( {x:0, y:1, z:0}, Math.PI*0.5 );

const list = [ 'lee', 'man', 'woman', 'man_low', 'woman_low', 'eva00', 'eva01', 'eva02' ];
const noRay = function(){ return }

export const preloadAvatar = {

    tmp:[],
    model:[],
    avatar:null,
    callback:() => {},

    add:( names, callback ) => {

        preloadAvatar.tmp = [...names];
        preloadAvatar.callback = callback;

        if(preloadAvatar.tmp.length){
            preloadAvatar.loadOne()
        }

    },

    loadOne:() => {

        let name = preloadAvatar.tmp[0]
        preloadAvatar.avatar = new Avatar({ type:name, callback:preloadAvatar.next, morph:true, isPreload:true });

    },

    next:( name ) => {
        
        preloadAvatar.avatar.dispose();

        preloadAvatar.tmp.shift();
        if( preloadAvatar.tmp.length === 0 ){
            preloadAvatar.callback()
        }else{
            preloadAvatar.loadOne()
        }
    }

}

export class Avatar extends Group {

	constructor( o = {} ) {

        super();

        this.isPreload = o.isPreload || false;

        this.fixWeight = o.fixWeight !== undefined ? o.fixWeight : true;

        this.rootPath = o.path || './';
        //this.lzmaPath = this.rootPath + 'src/libs/lzma_worker.js';
        //Pool.dracoPath =  this.rootPath + 'src/libs/draco/';

        this.callback = o.callback || function (){};

        this.matrixAutoUpdate = false;
        this.isPause = true;
        
        //this.textureQuality = o.quality || 1;

        this.randomMorph = o.randomMorph || false;
        this.randomSize = o.randomSize || false;

        this.actionPose = null;

        this.model = o.type || 'man';
        this.startAnimation = o.anim || 'Idle';

        this.eyeLook = [0,0];
        this.headLook = [0,0.15];
        this.oldEyeLook = [0,0];
        this.oldHeadLook = [0,0];

        this.bodyMorph = [0,0];
        this.faceMorph = [0,0];
        
        this.ref = null;

        switch( this.model ){
            case 'barbados': this.ref = Barbados; break;
            case 'lee': this.ref = Lee; break;
            case 'man': case 'woman': this.ref = Human; break;
            case 'man_low': case 'woman_low': this.ref = Human_low; break;
            case 'eva00': case 'eva01': case 'eva02': this.ref = Eva; break;
        }

        this.compact = o.compact !== undefined ? o.compact : true;
        this.haveMorph = o.morph !== undefined ? o.morph : false;
        this.fullMaterial = o.material !== undefined ? o.material : true;

        this.size = o.size || 1;
        this.realSize = 0;
        this.baseSize = 0;

        this.fullMorph = this.ref.fullMorph || [];
        if(this.randomMorph && this.fullMorph.length ) this.haveMorph = true;

        this.textureQuality = this.ref.textureQuality || 0;

        this.prevQ = new Quaternion()


        this.skeleton = null;
        //this.root = null;
        this.mixer = null;
        this.animator = null;
        this.mesh = {};
        this.bones = {};
        this.done = false;
        this.isClone = false;
        
        this.isBreath = this.ref.isBreath || false;
        this.isEyeMove = this.ref.isEyeMove || false;
        this.haveBlink = this.ref.haveBlink || false;

        this.haveLOD = this.ref.haveLOD || false;
        if( o.noLOD ) this.haveLOD = false;
        
        this.lod = -1;

        this.decalY = this.ref.decalY || 0;

        this.tensionTest = false;
        this.tensionActive = false;

        this.fixToe = false;
        this.clipsToesFix = [];

        this.speakGroup = null

        this.n = Math.round(Math.random()*1000);
        this.prevV = 0

        this.actions = new Map();
        this.current = null;
        this.old = null;

        this.breath = 0;
        this.breathSide = -1;

        //this.headBoneLook = new Vector3();
        //this.headSpherical = new Spherical()
        //this.headPos = new Vector3()

        this.setting = {};

        // for debug animation pack
        this.extraMixer = null
        this.extraAction = null

        //this.initMaterial();

        this.root = Pool.get( this.ref.forceModel ? this.ref.forceModel : this.model, 'O' );

        if( this.root ){
            this.isClone = true;
            this.tensionTest = false;
            this.root = SkeletonUtils.clone( this.root );
            this.init();

        } else {
            if( this.fullMaterial ) this.load()
            else this.loadModels()
        }

    }

    rand( low = 0, high = 1 ){ 
        return low + Math.random() * ( high - low ) 
    }

    load(){

        if( !this.ref.textures || !this.ref.textures.length ){ 
            this.loadModels();
            return
        }

        this.skin = Pool.getTexture( this.ref.textureRef, { quality:this.textureQuality, anisotropy:this.ref.anisotropy || 1 } );

        if( !this.skin ){

            const path = this.rootPath + this.ref.texturePath + ( this.textureQuality ? this.textureQuality + 'k/' : '' );
            //console.log(path)
            Pool.load( this.ref.textures, this.loadModels.bind(this), path, 'loading images...', this.textureQuality );

        } else {

            this.loadModels();

        }

    }

    loadModels(){

        const model = this.ref.forceModel ? this.ref.forceModel : this.model;
        const asset = [model+'.glb'];
        const path = this.rootPath + this.ref.modelPath;
        if( this.ref.haveMorph && this.haveMorph ) asset.push( model+'_morph.glb' );
        Pool.load( asset, this.init.bind(this), path, 'loading models...' );

    }

    update( delta ){

        if( !this.done ) return;

        if ( this.animator ){


            this.animator.update( delta );

            // blink
            if( this.haveBlink ) this.eyeBlink();
            this.lookink();

            if( this.speakGroup !== null){
                this.speakGroup.update();
            }
            
            //if( !this.isClone ){
                
                //this.breathing();
                //this.autoToes();
           //}

            if( this.tensionActive ){ 
                this.tension1.update();
                this.tension2.update();
            }

            /*if( window.gui && window.gui.updateTimeBarre && this.current ){ 
                window.gui.updateTimeBarre( Math.round( this.current.time * FrameTime ), this.current.frameMax );
            }*/
        }

        //this.updateMatrix()

    }

    raycast( raycaster, intersects ){
        /*if(this.mesh.headlook){ 
            const r = this.mesh.headlook.raycast( raycaster, intersects )
            console.log('ray ?', r)
            return r
        }*/
        return 
    }

    eyeBlink(){

        let n = this.n++ 
        let v = 0;
        let t = 10;
        let s = 1/t;

        if( n<=t) v = n*s;
        if( n>t && n<=t*2 ) v = 1-((n-t)*s);

        if(v!==this.prevV) this.setMorph( 'EyeBlink', v );

        this.prevV = v;
        if( this.n>500 ){ this.n = 0;}

    }

    lookink(){

        if((this.headLook[0] !== this.oldHeadLook[0])||(this.headLook[1] !== this.oldHeadLook[1])){

            this.oldHeadLook = [...this.headLook] 

            let aax = -this.headLook[1]*40;
            let aay = -this.headLook[0]*40;

            const data = [
                {name:'head', values:[aax,0,aay]},
                {name:'neck', values:[aax*0.5,0,aay*0.5]},
            ]

            this.animator.makePoseTrack( data )

        }

        if(this.isEyeMove){

            if((this.eyeLook[0] !== this.oldEyeLook[0])||(this.eyeLook[1] !== this.oldEyeLook[1])){

                this.oldEyeLook = [...this.eyeLook] 

                let bbx = -this.eyeLook[1]*15*torad;
                let bby = -this.eyeLook[0]*30*torad;

                tmpQ.setFromEuler( { _x:bbx, _y:0, _z:bby, _order:'XYZ' }, false )
                this.eyeBase.quaternion.copy(tmpQ);

                let ER = this.bones.ER;
                let EL = this.bones.EL;

                tmpP.copy( this.TL.position );
                tmpP.applyMatrix4( this.eyeTarget.matrix );
                tmpP.applyMatrix4( this.eyeBase.matrix );

                tmpMtx.lookAt( EL.position, tmpP, UPZ );
                tmpQ.setFromRotationMatrix( tmpMtx ).multiply(Q);
                EL.quaternion.copy(tmpQ)
                //data.push({name:'EL', qq:tmpQ.toArray()});

                tmpP.copy( this.TR.position );
                tmpP.applyMatrix4( this.eyeTarget.matrix );
                tmpP.applyMatrix4( this.eyeBase.matrix );

                tmpMtx.lookAt( ER.position, tmpP, UPZ );
                tmpQ.setFromRotationMatrix( tmpMtx ).multiply(Q);
                ER.quaternion.copy(tmpQ)
                //data.push({name:'ER', qq:tmpQ.toArray()});
            }

        }


        //this.animator.makePoseTrack( data )

        return

        //if( !this.animator.current ) return

        //if(this.animator.mixer.time === this.animator.oldTime) return

        //if(this.prevQ.equals(this.bones.head.quaternion)) return
        //this.prevQ = this.bones.head.quaternion.clone()

        // head and neck bones

        /*let ax = -this.headLook[1]*40*torad;
        let ay = -this.headLook[0]*40*torad;

        tmpQ.setFromEuler( { _x:ax, _y:0, _z:ay, _order:'XYZ' }, false );
        this.bones.head.quaternion.premultiply(tmpQ);

        tmpQ.setFromEuler( { _x:ax*0.5, _y:0, _z:ay*0.5, _order:'XYZ' }, false );
        this.bones.neck.quaternion.premultiply(tmpQ);



        // eyes bones

        if(!this.isEyeMove) return;

        let bx = -this.eyeLook[1]*15*torad;
        let by = -this.eyeLook[0]*30*torad;

        tmpQ.setFromEuler( { _x:bx, _y:0, _z:by, _order:'XYZ' }, false )
        this.eyeBase.quaternion.copy(tmpQ);

        let ER = this.bones.ER;
        let EL = this.bones.EL;

        tmpP.copy( this.TL.position );
        tmpP.applyMatrix4( this.eyeTarget.matrix );
        tmpP.applyMatrix4( this.eyeBase.matrix );

        tmpMtx.lookAt( EL.position, tmpP, UPZ );
        EL.quaternion.setFromRotationMatrix( tmpMtx ).multiply(Q);

        tmpP.copy( this.TR.position );
        tmpP.applyMatrix4( this.eyeTarget.matrix );
        tmpP.applyMatrix4( this.eyeBase.matrix );

        tmpMtx.lookAt( ER.position, tmpP, UPZ );
        ER.quaternion.setFromRotationMatrix( tmpMtx ).multiply(Q);*/

    }

    breathing(){

        if( !this.bones ) return;
        if( !this.isBreath ) return;
        if( !this.skeleton.setScalling ) return;

        let a = this.breath * 0.01;

        if(this.breathSide > 0){
            this.skeleton.setScalling( this.bones.chest, this.lerp (1,1.02, a), this.lerp (1,1.04, a), 1 );
            this.skeleton.setScalling( this.bones.abdomen, 1, this.lerp (1,0.92, a), 1 );
        }else{
            this.skeleton.setScalling( this.bones.chest, this.lerp (1.02,1, a), this.lerp (1.04,1, a), 1 );
            this.skeleton.setScalling( this.bones.abdomen, 1, this.lerp (0.92,1, a), 1 );
        }


        // !! just for testing 
        //this.skeleton.setScalling( this.bones.lShldr, 1.3, 2, 2 )
        //this.skeleton.setScalling( this.bones.lForeArm, 1.3, 2, 2 )

        this.breath ++;
        if( this.breath === 100 ){ this.breath = 0; this.breathSide = this.breathSide > 0 ? -1:1; }

    }

    setPosition( x, y, z ){

        this.position.set( x, y, z );
        this.updateMatrix();

    }

    setRotation( x, y, z, a ){

        let r  = this.lerp( this.rotation.y, y, a);
        this.rotation.set( x, r, z );
        this.updateMatrix();

    }

    lerp( x, y, t ) { return ( 1 - t ) * x + t * y }

    onReady(){}

    initMaterial(){

        if( Pool.getMaterial( this.ref.materialRef ) ) return

        if( !this.fullMaterial ){
            Pool.set( this.ref.materialRef, new MeshStandardMaterial() )
            return
        }

        let m, type, data

        for( const name in this.ref.materials ){

            data = { ...this.ref.materials[name] }
            type = data.type
            delete data.type
            for( const t in data ){
                if(t!=='envMapIntensity' && t!=='normalMapType' && t!=='aoMapIntensity' && t!=='aoMapIntensity'){
                    if(t==='map' || t.search('Map')!==-1 ){ 
                        //if(t==='alphaMap') data[t] = Pool.getTexture( data[t], { quality:this.textureQuality, anisotropy:0, filter:'near' } );
                        //else 
                        data[t] = Pool.getTexture( data[t], { quality:this.textureQuality, anisotropy:this.ref.anisotropy || 1 } );
                    }
                }
            }

            if(type==='Basic') m = new MeshBasicMaterial( data );
            else if(type==='Standard') m = new MeshStandardMaterial( data );
            else if(type==='Physical') m = new MeshPhysicalMaterial( data );
            else if(type==='Sss') m = new MeshSssMaterial(data);
            m.name = name;

            Pool.set( name, m );

        }

        this.setting = this.ref.setting;

    }


    setMaterial(s, b){

        let m = Pool.getMaterial( this.ref.materialRef )
        //console.log(m)
        if(!m) return;
        for(let p in s){
            if(m[p]!==undefined) m[p] = s[p]
        }

    }

    setMaterialNormal( v ){

        let m = Pool.getMaterial( 'skin' )
        if(!m) return
        if( v<0 ) v = 0
        m.normalScale.set(v,-v);

    }

    getMaterial( name ){

        return Pool.getMaterial( name )
        
    }

    init(){

        // TODO avoid multiple init on preload !!!

        //if( this.isPreload ) { this.callback(); return; }

        //console.log('avatar init!')

        this.initMaterial()

        if( !this.isClone ) {

            let modelName = this.ref.forceModel ? this.ref.forceModel : this.model

            if( this.ref.multyMaterial ) Pool.getMesh(modelName, true);

            this.root = Pool.get( modelName, 'O' ) 
            this.ref.applyMaterial( this.root, this.model )
        }

        if( this.ref.forceModel && this.isClone ) this.ref.applyMaterial( this.root, this.model )

        this.realSize = 0;

        let bodySize = 0;
        let headSize = 0;

        // get data
        this.root.traverse( function ( node ) {
            
            if ( node.isMesh ){

                if( node.name === this.ref.skeletonRef ){
                    node.matrixAutoUpdate = false;

                    this.skeleton = node.skeleton;
                    if( this.skeleton.resetScalling ) this.skeleton.resetScalling()
                    bodySize = node.geometry.boundingBox.max.y;
                }
                if( node.name === 'Head' ){ 
                    headSize = node.geometry.boundingBox.max.y;
                }

                //if(node.name!=='headlook') 
                node.raycast = noRay

                this.mesh[node.name] = node;
            }
            if ( node.isBone ){
                node.raycast = noRay
                this.bones[node.name] = node;
                //if(node.name==='rShldr' ) node.rotation.x = 80 * torad
               // console.log(node.name, node.rotation.x*todeg, node.rotation.y*todeg, node.rotation.z*todeg)
            }
        }.bind(this))

        this.realSize = headSize > bodySize ? headSize : bodySize;
        this.realSizeRatio = 1 / this.realSize;
        this.baseSize = this.realSize;

       /*if( this.ref.isEyeMove ){
           
        }*/
    
        //if( !this.isClone ){
        // for extra skin
        for( let m in this.mesh ){
            if( this.mesh[m].isSkinnedMesh && m !== this.ref.skeletonRef ){
                //this.mesh[m].skeleton.dispose();
                this.mesh[m].skeleton = this.skeleton;
            }
        }

        if( !this.isClone ){
            // add morph 
            if( this.haveMorph ) Pool.applyMorph( this.model+'_morph', this.mesh, this.ref.morphNormal, this.ref.morphRelative );
            Pool.set( this.model, this.root, 'O' )

            //console.log(this.mesh)

            if(this.mesh.Head){
                this.connectHead(this.mesh.body, this.mesh.Head)
            }
            
        }

        if( this.size !== 1 ) this.root.scale.set(1,1,1).multiplyScalar(this.size);

        //if( this.tensionTest ) this.addTensionMap()



        // animation
        this.mixer = new AnimationMixer( this );
        this.animator = new AvatarAnimation( this.mixer );

        // load compact animation

        if( AvatarTools.clips.length === 0 ){ 
            //const url = this.rootPath +'assets/animation/animations.bin';
            //const ccc = this.moreAnimation.bind(this);
            const url = this.rootPath +'assets/animation/ual.bin';
            const ccc = this.animationReady.bind(this);
            AvatarTools.loadCompactAnimations( url, ccc );
        } else {
            this.animationReady();
        }

        
        /*if( Pool.clip.length === 0 ){ 
            //this.loadCompactAnimation( this.rootPath +'assets/animation/ual.bin' )
            this.loadCompactAnimation( this.rootPath +'assets/animation/animations.bin' )
            // load animation include in json or the compacted version
            //if( this.compact ) this.loadCompactAnimation(this.rootPath +'assets/animation/animations.bin')
            //else this.loadAnimationJson(this.rootPath +'assets/animation/animations.json', this.start.bind(this) )

        } else {
            let i = Pool.clip.length;
            while(i--) this.addAction( Pool.clip[i] );
            this.start()
        }*/

        
             
    }

    moreAnimation(){

        const url = this.rootPath +'assets/animation/ual.bin';
        const ccc = this.animationReady.bind(this);
        AvatarTools.loadCompactAnimations( url, ccc );

    }

    animationReady(){

        let i = AvatarTools.clips.length;
        while(i--) this.animator.addAction( AvatarTools.clips[i] );
        this.start()

    }

    addLookTarget(){

        if(!this.isEyeMove) return

        this.eyeBase = new Group()
        this.bones.head.add( this.eyeBase );

        this.eyeTarget = new Group()
        this.eyeTarget.position.set(0, 0.5, -0.1);
        this.eyeBase.add( this.eyeTarget );

        //if(this.isEyeMove){
        this.TL = new Group()//new AxesHelper(0.01)
        this.TL.position.x = 0.03
        //this.TL.raycast = noRay
        this.eyeTarget.add( this.TL );
        this.TR = new Group()//new AxesHelper(0.01)
        this.TR.position.x = -0.03
        //this.TR.raycast = noRay
        this.eyeTarget.add( this.TR );
    }

    start(){

        if( this.isPreload ) { this.callback(); return; }
        if( this.done ) return;

        //this.updateMatrix()

        this.done = true;
 
        this.onReady();
        
        this.play( this.startAnimation );

        // only if eye can move 
        this.addLookTarget()

        /*if( this.ref.adjustment ){
            this.animator.makePoseTrack('adjustment', this.ref.adjustment(), true );
        }*/

        // Random Human
        if( this.randomMorph ){ 
            this.setBodyMorph([this.rand(-1,1), this.rand(-1,1)])
            this.setFaceMorph([this.rand(-0.4,0.4), this.rand(-0.4,0.4)])
        }
        if( this.randomSize ) this.setRealSize(this.rand(1,2));


        //this.add( this.root );

        setTimeout( function(){ 
            this.add( this.root );
            this.root.position.y = this.decalY
            this.dispatchEvent({ type: 'Ready', message: "Model is ready" });
            this.callback();
        }.bind(this), 100 )
        //this.callback()

    }



    nearEquals( a, b, t = 1e-4 ){ return Math.abs(a - b) <= t ? true : false }

    connectHead(body, head){

        //console.log(body.geometry.attributes.position, body.geometry.attributes.tangent)

        let p1 = body.geometry.attributes.position
        let p2 = head.geometry.attributes.position

        let a1 = p1.array
        let a2 = p2.array

        let n1 = 0, n2=0, nr1 = 0, nr2 = 0
        let l1 = p1.count
        let l2 = p2.count

        let pp = []
        let v1 = new Vector3()
        let v2 = new Vector3()

        // find same
        for(let i = 0; i<l1; i++){
            n1 = i*3
            v1.set(a1[n1] , a1[n1+1] , a1[n1+2])
            for(let j = 0; j<l2; j++){
                n2 = j*3
                v2.set(a2[n2], a2[n2+1], a2[n2+2])
                if(v1.distanceTo(v2)<0.00001) pp.push([i,j])
            }
        }

        //console.log(pp.length)


        // copy normal
        let nn1 = body.geometry.attributes.normal.array
        let nn2 = head.geometry.attributes.normal.array

        let tt1 = body.geometry.attributes.tangent.array
        let tt2 = head.geometry.attributes.tangent.array

        for(let i = 0; i<pp.length; i++){

            n1 = pp[i][0]*3
            n2 = pp[i][1]*3

            nn1[n1] = nn2[n2]
            nn1[n1+1] = nn2[n2+1]
            nn1[n1+2] = nn2[n2+2]

            tt1[n1] = tt2[n2]
            tt1[n1+1] = tt2[n2+1]
            tt1[n1+2] = tt2[n2+2]

            /*nn2[n2] = nn1[n1]
            nn2[n2+1] = nn1[n1+1]
            nn2[n2+2] = nn1[n1+2]

            tt2[n2] = tt1[n1]
            tt2[n2+1] = tt1[n1+1]
            tt2[n2+2] = tt1[n1+2]*/

        }

        body.geometry.attributes.tangent.needsUpdate = true;
        body.geometry.attributes.normal.needsUpdate = true;

    }

    setRealSize( s ){

        this.realSize = s;
        let r = 0.5 + ((this.baseSize / this.realSize)*0.5);
        this.setSize( this.realSize * this.realSizeRatio )
        this.setHeadSize( r )

    }

    setSize( s ){
        this.size = s;
        this.root.scale.set(1,1,1).multiplyScalar(this.size);
        //this.bones.head.scale.set(1,1,1).multiplyScalar(2);
    }

    setHeadSize( s ){
        this.bones.head.scale.set(1,1,1).multiplyScalar(s);
    }

    addTensionMap(){

        this.tension1 = new Tension( this.mesh.body );
        this.tension2 = new Tension( this.mesh.Head );
    }

    setBounding( r ){

        for( let m in this.mesh ){
            if(this.mesh[m].isMesh ){
                this.mesh[m].geometry.boundingSphere.radius = r;
            }
        }

    }

    /*setBoneScale( v ){

        const ingnor = [ 'head', 'lToes', 'rToes', 'rCollar', 'lCollar', 'rBreast', 'lBreast', 'neck'];
        const center = ['hip', 'abdomen', 'chest'];
        const legs = ['lThigh', 'rThigh', 'lShin', 'rShin'];
        const b = this.bones

        for( let n in b ){
            if(ingnor.indexOf(n) === -1) {
                if(center.indexOf(n) !== -1) b[n].scalling.z = v
                else if(legs.indexOf(n) !== -1) b[n].scalling.z = v
                else if( n === 'root' ) b[n].scalling.y = v
                else if( n === 'rFoot' || n === 'lFoot') b[n].scalling.y = v
                else b[n].scalling.x = v
            } 
        }

        this.setBounding(v)
    }*/

    setLevel( n ){

        if( !this.haveLOD ) return
        if( this.lod === n ) return

        this.lod = n;

        this.hideAll();

        if( this.lod === 0 ){
            this.setVisible( this.ref.levelLow, true );
            if( this.ref.haveHair ){ 
                this.setVisible( this.ref.levelHairLow, true );
            }
        } else { 
            this.setVisible( this.ref.levelHigh, true );
            if( this.ref.haveHair ){ 
                this.setVisible( this.ref.levelHair, true );
            }
        }
    
    }

    hideAll(){

        for( let m in this.mesh ) this.mesh[m].visible = false;
    
    }
 
    setVisible( names, v ){

        if( typeof names === 'string' ) names = [names];
        let i = names.length, name;
        while(i--){
            name = names[i];
            if( this.mesh[name] ) this.mesh[name].visible = v;
        }
    
    }


    /*eyeControl( v ){

        this.setMorph('EyeBlink', v)
    
    }*/

    setMorph( name, v ){

        v = v < 0 ? 0 : v;
        //v = v > 1 ? 1 : v;

        if( !this.haveMorph ) return
        this.morpher( 'eyelash', name, v);
        this.morpher( 'eyebrow', name, v);
        this.morpher( 'tear', name, v);
        this.morpher( 'mouth', name, v);
        this.morpher( 'socks', name, v);
        this.morpher( 'logo', name, v);
        this.morpher( 'body', name, v);
        this.morpher( 'Head', name, v);
        this.morpher( 'body_low', name, v);
    }

    morpher( obj, name, value ){

        if(!this.mesh[obj]) return
        if(!this.mesh[obj].morphTargetInfluences) return
        if(this.mesh[obj].morphTargetDictionary[name] === undefined ) return
        this.mesh[obj].morphTargetInfluences[ this.mesh[obj].morphTargetDictionary[name] ] = value;
    }

    lerp( x, y, t ) { return ( 1 - t ) * x + t * y; }

    clone( o ){

        return new this.constructor( {type:o.type}, this );
    
    }

    dispose(){

        //if( this.isPreload ) { return; }

        if( this.exoskel ) this.addExo()
        if( this.helper ) this.addHelper()

        this.stop();
        //if( this.skeleton.resetScalling ) this.skeleton.resetScalling()
        this.mixer.uncacheRoot( this );

        //if(this.skeleton.boneTexture)this.skeleton.boneTexture.dispose();
        this.remove( this.root );

        this.skeleton.dispose();
        if( this.parent ) this.parent.remove(this);
        

        //console.log('hero remove')
        if(!this.isClone){

        }
    }

    

    setBodyMorph( v ){

        if(!this.haveMorph) return;

        if(v) this.bodyMorph = v;

        let vx = Number(this.bodyMorph[0]);
        let vy = Number(this.bodyMorph[1]);

        this.setMorph( 'LOW', vy<0?-vy:0 )
        this.setMorph( 'MUSCLE', vy>=0?vy:0 )

        this.setMorph( 'BIG', vx<0?-vx:0 )
        this.setMorph( 'MONSTER', vx>=0?vx:0 )

        let cx = ((vx+1)*0.5)
        let cy = (1-((vy+1)*0.5))

        this.setMaterialNormal( (cy+cx)*0.5 )

    }

    setFaceMorph( v ){

        if(!this.haveMorph) return;
        if(v) this.faceMorph = v;

        let vx = Number(this.faceMorph[0]);
        let vy = Number(this.faceMorph[1]);

        this.setMorph( 'Frown', vy<0?-vy:0 )
        this.setMorph( 'Shock', vy>=0?vy:0 )

        this.setMorph( 'SmileOpen', vx<0?-vx:0 )
        this.setMorph( 'Angry', vx>=0?vx:0 )

    }

    addHelper(){

        if( this.helper ){
            this.helper.dispose();
            this.remove( this.helper );
            this.helper = null;
        } else {
            this.helper = new SkeletonHelper( this.root );
            this.helper.raycast = function (){ return }
            this.helper.matrix = this.root.matrix;
            this.add( this.helper );
        }
    }

    addExo() {

        if( this.exoskel ){
            this.exoskel.dispose()
            this.remove( this.exoskel );
            this.exoskel = null;
        } else {
            this.exoskel = new ExoSkeleton( this.root, this.skeleton );
            this.exoskel.matrix = this.root.matrix
            this.add( this.exoskel );

        }
        return this.exoskel;
    }

    attachToBone( m, b ){

        m.matrix = b.matrixWorld;
        m.matrixAutoUpdate = false;

    }


    armAngle(){

    }

    autoToes(){

        if(!this.fixToe) return;
        let r = this.getRot('rFoot');
        let l = this.getRot('lFoot');
        let v = this.getWorldPos('hip');
        let v0 = this.getWorldPos('rToes');
        let v1 = this.getWorldPos('lToes');
        if(r[0]>0 && (v0.z-v.z)<0) this.setRot('rToes', -r[0]*1.5, 0,0 );
        else if( r[0] !== 0 ) this.setRot('rToes', 0,0,0 );
        if(l[0]>0 && (v1.z-v.z)<0) this.setRot('lToes', -l[0]*1.5, 0,0 );
        else if( l[0] !== 0 ) this.setRot('lToes', 0,0,0 );
    }

    resetToes(){

        if(!this.fixToe) return;
        this.fixToe = false;
        this.setRot('rToes', 0,0,0 );
        this.setRot('lToes', 0,0,0 );

    }


    //---------------------
    //
    //  ANIMATION CONTROL
    //
    //---------------------

    getAnimInfo( name ){

        this.animator.getAnimInfo( name );

    }

    play( name, fade = 0.5, callback ) {

        this.animator.play( name, fade, callback );

    }

    playFrame ( name, frame, weight = 1 ) {

        this.animator.playFrame( name, frame, weight );

    }

    playOne ( frame, weight = 1 ) {

        this.animator.playOne( name, weight );

    }

    stop(){

        this.animator.stop()

    }


    //---------------------
    //
    //  BONES CONTROL
    //
    //---------------------

    setRot( name, x, y, z ){

        let n = this.bones[name];
        if(!n) return
        n.rotation.set( x*torad, y*torad, z*torad, 'XYZ' );
        n.updateMatrix();
    }

    setRot2( name, x, y, z ){

        let n = this.bones[name];
        if(!n) return
        //let q1 = n.quaternion
        let q2 = new Quaternion().setFromEuler( {_x:x*todeg, _y:y*todeg, _z:z*todeg, _order:'XYZ'}).invert();
     
        n.quaternion.premultiply(q2)
       // n.rotation.set( x*torad, y*torad, z*torad, 'XYZ' );
        n.updateMatrix();
    }

    getRot( name ){

        let n = this.bones[name];
        if(!n) return
        let r = n.rotation.toArray();
        return [ Math.round(r[0]*todeg), Math.round(r[1]*todeg), Math.round(r[2]*todeg) ];
    }

    getWorldPos( name ){

        let n = this.bones[name];
        if(!n) return
        V.set(0,0,0)
        n.localToWorld(V)
        return { x:V.x, y:V.y, z:V.z };

    }


    //---------------------
    //
    //  HIDE PART OF BODY
    //
    //---------------------

    bodyMask( o = {arm:true, leg:true, foot:true, chest:true } ){

        let s = 0.25;
        if(!this.canvas) {
            this.canvas = document.createElement( 'canvas' );
            this.canvas.width = this.canvas.height = 1024*s;
        }

        const ctx = this.canvas.getContext( '2d' ); 
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1024*s, 1024*s);
        ctx.fillStyle = 'black';
        if(o.arm) ctx.fillRect( 784*s, 448*s, 236*s, 186*s );
        if(o.leg) ctx.fillRect( 512*s, 734*s, 287*s, 290*s );
        if(o.foot) ctx.fillRect( 817*s, 822*s, 206*s, 200*s );
        if(o.chest){ 
            ctx.fillRect( 480*s, 576*s, 300*s, 160*s );
            ctx.fillRect( 553*s, 466*s, 228*s, 110*s );
            ctx.fillRect( 533*s, 531*s, 20*s, 45*s );
        }

        let img = new Image();
        img.src = this.canvas.toDataURL()

        if(this.mask) this.mask.dispose()
        //this.mask = new CanvasTexture( this.canvas );

        this.mask = new Texture( img );
        this.mask.flipY = false;
        this.mask.needsUpdate = true;
        const m = Pool.getMaterial( 'skin' );
        m.alphaTest = 0.9
        m.alphaMap = this.mask;
        //m.needsUpdate = true;
    }


    //---------------------
    //   TOOLS
    //---------------------

    zeroColor(g){

        if( g.isMesh ) g = g.geometry;
        let lng = g.attributes.position.array.length;
        g.setAttribute( 'color', new Float32BufferAttribute( new Array(lng).fill(0), 3 ) );

    }

    /*uv2( g, uv2 = true, tangent = true ) {

        if( g.isMesh ) g = g.geometry;
        g.setAttribute( 'uv2', g.attributes.uv );

    }*/

    //---------------------
    //   SPEAK
    //---------------------

    speak( sequence, time ){

        console.log( 'test', sequence, time, this.model );

        this.speakGroup = new TWEEN.Group()

        const lng = sequence.length
        let timing = Math.floor(time/lng);

        const t = []

        const self = this

       
        

        for (let i=0; i < lng; i++){

            if(i===0){
                t[i] = new TWEEN.Tween({ p:'', m:sequence[i], v:0, h:1 }, self.speakGroup).to( { v:1, h:0 }, timing ).onUpdate( (object)=>{ self.updateSpeakMorph(object) });
           
            } else {
                t[i] = new TWEEN.Tween({ p:sequence[i-1],  m:sequence[i], v:0, h:1 }, self.speakGroup).to( { v:1, h:0 }, timing ).onUpdate( (object)=>{ self.updateSpeakMorph(object) });
                t[i-1].chain(t[i]);
                if(i===(lng-1)){
                    t[i+1] = new TWEEN.Tween({ p:sequence[i],  m:'', v:0, h:1 }, self.speakGroup).to( { v:1, h:0 }, timing ).onUpdate( (object)=>{ self.updateSpeakMorph(object) }).onComplete(()=>{ self.stopSpeakMorph() });
                    t[i].chain(t[i+1]);
                }
            } 

        }

        t[0].start()

        //console.log( 'test', this.speakGroup );

    }

    updateSpeakMorph( obj ){

        //console.log('up', obj)

        if(obj.p !== '') this.setMorph( obj.p, obj.h )
        if(obj.m !== '') this.setMorph( obj.m, obj.v )

    }

    stopSpeakMorph( obj ){

        console.log('stop talking')

        this.speakGroup = null

    }

}