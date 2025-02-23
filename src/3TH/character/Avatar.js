import {
	Object3D, Group, Mesh, SkinnedMesh, Texture,
    Matrix4, Quaternion, Euler, Vector3, Vector2,
    SphereGeometry, SkeletonHelper,
    MeshStandardMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshBasicMaterial,MeshPhysicalMaterial,
    TextureLoader,AnimationMixer,
    FrontSide, DoubleSide, Color, ShaderChunk, 
    VectorKeyframeTrack, QuaternionKeyframeTrack, AnimationClip, Skeleton,
    Float32BufferAttribute, EquirectangularReflectionMapping, AdditiveBlending,
    CustomBlending,// AddEquation, SubtractEquation, ReverseSubtractEquation, MinEquation, MaxEquation,
    ZeroFactor,//, OneFactor, SrcColorFactor, OneMinusSrcColorFactor, 
    SrcAlphaFactor,
    AnimationUtils,
    AdditiveAnimationBlendMode, NormalAnimationBlendMode,
} from 'three';

import { MeshSssMaterial } from '../materials/MeshSssMaterial.js';

import { GLTFExporter } from '../../jsm/exporters/GLTFExporter.js';
import * as SkeletonUtils from '../../jsm/utils/SkeletonUtils.js';
import { Basic3D } from '../../core/Basic3D.js';

import { Pool } from '../Pool.js';
import { Shader } from '../Shader.js';
import { LZMA } from '../../libs/lzma.js';
import { Tension } from '../Tension.js';
import { GlbTool } from '../utils/GlbTool.js';

import { ExoSkeleton } from './ExoSkeleton.js';

// ready model
import { Human } from './Human.js';
import { Human_low } from './Human_low.js';
import { Eva } from './Eva.js';
import { Lee } from './Lee.js';
import { Bear } from './Bear.js';
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

const list = [ 'lee', 'man', 'woman', 'man_low', 'woman_low', 'eva00', 'eva01', 'eva02' ];


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
        this.lzmaPath = this.rootPath + 'src/libs/lzma_worker.js';
        Pool.dracoPath =  this.rootPath + 'src/libs/draco/';

        this.callback = o.callback || function (){};

        this.matrixAutoUpdate = false;
        this.isPause = true;

        //this.textureQuality = o.quality || 1;

        this.randomMorph = o.randomMorph || false;
        this.randomSize = o.randomSize || false;

        this.actionPose = null

        this.model = o.type || 'man';
        this.startAnimation = o.anim || 'idle';

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


        this.skeleton = null;
        //this.root = null;
        this.mixer = null;
        this.mesh = {};
        this.bones = {};
        this.done = false;
        this.isClone = false;
        
        this.isBreath = this.ref.isBreath || false;
        this.isEyeMove = this.ref.isEyeMove || false;
        this.haveBlink = this.ref.haveBlink || false;

        this.haveLOD = this.ref.haveLOD || false;
        if( o.noLOD ){
            this.ref.haveLOD = false; 
            this.haveLOD = false;
        }
        this.lod = -1;

        this.decalY = this.ref.decalY || 0;

        this.tensionTest = false;
        this.tensionActive = false;

        this.fixToe = false;
        this.clipsToesFix = [];

        this.n = Math.round(Math.random()*1000);

        this.actions = new Map();
        this.current = null;
        this.old = null;

        this.breath = 0;
        this.breathSide = -1;

        this.q = new Quaternion().setFromAxisAngle( {x:0, y:1, z:0}, Math.PI*0.5 );
        this.headBoneLook = new Vector3();
        this.eyeTarget = new Group()//new AxesHelper(0.01)//
        this.eyeTarget.position.set(0, 1, 0);

        this.tmpMtx = new Matrix4();
        this.tmpQ = new Quaternion();

        this.setting = {};

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

        this.skin = Pool.getTexture( this.ref.textureRef, { quality:this.textureQuality } );

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
        if ( this.mixer ){

            this.mixer.update( delta );

            // blink
            if( this.haveBlink ) this.eyeBlink();
            

            if( !this.isClone ){
                this.look( delta*10 );
                this.breathing();
                this.autoToes();
            }

            if( this.tensionActive ){ 
                this.tension1.update();
                this.tension2.update();
            }

            if(this.actionPose){ 
                //console.log(this.getAction( 'idle' )._effectiveWeight)
                this.actionPose.setEffectiveWeight( this.getAction( 'idle' )._effectiveWeight );
            }

            /*if( this.ref.adjustment && !this.isClone ) {
                let dt = this.ref.adjustment()
                let m = dt.length, l
                while(m--){
                    l = dt[m]
                    this.setRot2( l.name, l.x, l.y, l.z )
                }
            }*/

            if( window.gui && window.gui.updateTimeBarre && this.current ){ 
                window.gui.updateTimeBarre( Math.round( this.current.time * FrameTime ), this.current.frameMax );
            }
        }

    }

    eyeBlink(){

        const n = this.n++ 
        let v = 0;
        let t = 10;
        let s = 1/t;

        if( n<=t) v = n*s;
        if( n>t && n<=t*2 ) v = 1-((n-t)*s);

        
        if( this.n>500 ){ this.n = 0;}

        this.setMorph( 'EyeBlink', v );
    
    }

    look( delta ){

        if(!this.isEyeMove) return;
        if(this.isPause) return;

        const v = window.mouse || {x:0, y:0};

        if(delta>1) delta = 1;

        this.headBoneLook.lerp({ x:-(v.y*20)*torad, y:0, z:-(v.x*20)*torad }, delta );
        this.eyeTarget.position.lerp({ x:v.x*0.5, y:1, z:-v.y*0.25 }, delta );

        let e = this.headBoneLook;
        this.tmpQ.setFromEuler( { _x:e.x, _y:e.y, _z:e.z, _order:'XYZ' }, false );
        this.bones.head.quaternion.multiply(this.tmpQ);

        let ER = this.bones.ER;
        let EL = this.bones.EL;
        let up = {x:0, y:0, z:1};

        this.tmpMtx.lookAt( EL.position, this.eyeTarget.position.clone().add({x:0.03, y:0, z:-0.074}), up );
        EL.quaternion.setFromRotationMatrix( this.tmpMtx ).multiply(this.q);

        this.tmpMtx.lookAt( ER.position, this.eyeTarget.position.clone().add({x:-0.03, y:0, z:-0.074}), up );
        ER.quaternion.setFromRotationMatrix( this.tmpMtx ).multiply(this.q);

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

            data = {...this.ref.materials[name]}
            type = data.type
            delete data.type
            for( const t in data ){
                if(t!=='envMapIntensity' && t!=='normalMapType' && t!=='aoMapIntensity' && t!=='aoMapIntensity'){
                    if(t==='map' || t.search('Map')!==-1 ) data[t] = Pool.getTexture( data[t], {quality:this.textureQuality } );
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

        this.initMaterial()

        if( !this.isClone ) {

            let modelName = this.ref.forceModel ? this.ref.forceModel : this.model

            if( this.ref.multyMaterial ) Pool.getMesh(modelName, true);

            this.root = Pool.get( modelName, 'O' ) 
            this.ref.applyMaterial( this.root, this.model )
        }

        if( this.ref.forceModel && this.isClone ) this.ref.applyMaterial( this.root, this.model )

        this.realSize = 0;

        // get data
        this.root.traverse( function ( node ) {
            
            node.raycast = function(){ return }

            if ( node.isMesh ){

                if( node.name === this.ref.skeletonRef ){
                    node.matrixAutoUpdate = false;

                    this.skeleton = node.skeleton;
                    if( this.skeleton.resetScalling ) this.skeleton.resetScalling()

                    this.realSize = node.geometry.boundingBox.max.y;



                    //console.log( node.geometry.boundingSphere, node.geometry.boundingBox, node.frustumCulled )
                    //node.geometry.boundingSphere.radius = 0.1;
                }
                if( node.name === 'Head' ) this.realSize = node.geometry.boundingBox.max.y;
                
                this.mesh[node.name] = node;
            }
            if ( node.isBone ){
                this.bones[node.name] = node;
                //if(node.name==='rShldr' ) node.rotation.x = 80 * torad
               // console.log(node.name, node.rotation.x*todeg, node.rotation.y*todeg, node.rotation.z*todeg)
            }
        }.bind(this))

        this.realSizeRatio = 1 / this.realSize;
        this.baseSize = this.realSize;

        if( this.ref.isEyeMove ){
            this.bones.neck.add( this.eyeTarget );
        }
    
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
            
        }

        if( this.size !== 1 ) this.root.scale.set(1,1,1).multiplyScalar(this.size);

        //if( this.tensionTest ) this.addTensionMap()



        // animation
        this.mixer = new AnimationMixer( this );

        

        if( Pool.clip.length === 0 ){ 
            // load animation include in json or the compacted version
            if( this.compact ) this.loadCompactAnimation(this.rootPath +'assets/animation/animations.bin')
            else this.loadAnimationJson(this.rootPath +'assets/animation/animations.json', this.start.bind(this) )

        } else {
            let i = Pool.clip.length;
            while(i--) this.addAction( Pool.clip[i] );
            this.start()
        }

        
             
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

        if( this.lod === 0 ) this.setVisible( this.ref.levelLow, true );
        else { 
            this.setVisible( this.ref.levelHigh, true );
            if( this.ref.haveHair ){ 
                //this.mesh.body.visible = false;
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

    start(){

        if( this.isPreload ) { this.callback(); return; }
        if( this.done ) return;

        //this.updateMatrix()

        this.done = true;
 
        

        this.onReady();
        //this.playAll();
        
        this.play( this.startAnimation );

        if( this.ref.adjustment ){
            this.makePoseTrack('adjustment', this.ref.adjustment(), true );
        }

        // Random Human
        if( this.randomMorph ) this.setBodyMorph([this.rand(-1,1), this.rand(-1,1)])
        if( this.randomSize ) this.setRealSize(this.rand(1,2));


        //this.add( this.root );


        //setTimeout( this.callback, 100 );
        setTimeout( function(){ 
            this.add( this.root );
            this.callback();
        }.bind(this), 100 )
        //this.callback()

    }

    setBodyMorph( v ){

        if(!this.haveMorph) return;

        if(v) this.bodyMorph = v;

        let vx = Number(this.bodyMorph[0]);
        let vy = Number(this.bodyMorph[1]);

        this.setMorph( 'MUSCLE', vy<0?-vy:0 )
        this.setMorph( 'LOW', vy>=0?vy:0 )

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

        this.setMorph( 'Shock', vy<0?-vy:0 )
        this.setMorph( 'Frown', vy>=0?vy:0 )

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

    loadAnimationJson( url, callback ){

        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onreadystatechange = function() {
            if ( request.readyState === 4 ) {
                if ( request.status === 200 || request.status === 0 ) {
                    let data = JSON.parse( request.responseText );
                    this.urls = [];
                    for( let g in data ){
                        if( g === 'main' ) this.urls.push( ...data[g] );
                        else this.urls.push( ...data[g].map( x => g+'/'+x ) );
                    }
                    this.endCallback = callback || function(){}; 
                    this.loadOne();
                }
            }
        }.bind(this)
        request.send();

    }

    loadOne(){

        let name = this.urls[0];
        this.loadAnimationFbx( this.rootPath + 'assets/animation/fbx/'+name+'.fbx', this.next.bind(this) );

    }

    next(){

        this.urls.shift();
        if( this.urls.length === 0 ) this.endCallback();
        else this.loadOne();

    }

    loadCompactAnimation( url = './assets/models/animations.bin' ){

        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        const glb = { animations : [] }
        const self = this;

        request.onload = function() {
            LZMA.decompress( request.response, (result) => {
                const data = JSON.parse(result);
                
                for(let c in data) glb.animations.push( AnimationClip.parse( data[c] ) ); 
                //console.log( glb )
                self.applydAnimation( glb );
                self.start();
            })
        };
        request.send();

    }

    loadAnimationGlb( url, callback ){

        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        Pool.loaderGLTF().load( url, function ( glb ) {
            this.applydAnimation( glb, name );
            if( callback ) callback();
        }.bind(this), null, callback );
    }

    directGlb( data, name ){

        Pool.loaderGLTF().parse( data, '', function ( glb ) {
            this.stop();
            this.applydAnimation( glb, name );
        }.bind(this))
    }

    loadAnimationFbx( url, callback ){

        //if( !this.loaderFbx ) this.loaderFbx = new FBXLoader();
        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        Pool.loaderFBX().load( url, function ( node ) {
            this.convertFbx( name, node.animations[ 0 ] );
            if( callback ) callback();
        }.bind(this), null, callback )
    }

    directFbx( data, name ){

        //if( !this.loaderFbx ) this.loaderFbx = new FBXLoader();
        try {
            let node = Pool.loaderFBX().parse( data, '' )
            this.convertFbx( name, node.animations[ 0 ], true );
        } catch ( e ) {
            console.error( 'bug', e );
        }
    }

    applydAnimation( glb, name ){

        let i = glb.animations.length, autoplay = false;
        if( i === 1 ){
            if( name ) glb.animations[0].name = name;
            autoplay = true;
        } 
        while(i--){ 
            this.addClip( glb.animations[i] );
            this.addAction( glb.animations[i], autoplay );
        }

    }

    addClip( clip, additive = false ){

        // Make the clip additive and remove the reference frame
        if( additive ){ 
            AnimationUtils.makeClipAdditive( clip )
            //clip = AnimationUtils.subclip( clip, clip.name, 2, 3, 30 );
        }

        ///console.log(clip)

        let i = Pool.clip.length, removeId = -1;
        while(i--){ if( Pool.clip[i].name === clip.name ) removeId = i; }
        if( removeId !== -1 ) Pool.clip.slice( removeId, 1 );


        //clip.optimize();
        Pool.clip.push( clip );
    }

    addAction( clip, play ){

        const action = this.mixer.clipAction( clip );
        action.frameMax = Math.round( clip.duration * FrameTime );
        action.play();
        action.enabled = true//false;
        if(clip.name.search('idle')!==-1) action.enabled = true;
        //action.setEffectiveWeight( 0 );
        if( clip.name === 'Jumping Up' ) action.loop = LoopPingPong;
        
        //action.play()
        this.actions.set( clip.name, action );



        /*
        if(clip.name.search('walk')!==-1) this.clipsToesFix.push(clip.name);
        if(clip.name.search('run')!==-1) this.clipsToesFix.push(clip.name);
        if(clip.name.search('strafe')!==-1) this.clipsToesFix.push(clip.name);
        if(clip.name.search('jog')!==-1) this.clipsToesFix.push(clip.name);
        if(clip.name.search('RUN')!==-1) this.clipsToesFix.push(clip.name);
        */

        //console.log(clip.name, action.frameMax)

        if( window.gui && window.gui.getAnimation ) window.gui.getAnimation();

       // if( play ) this.play( clip.name )

             
    }


    /// EXPORT

    getAnimation( toJson = false, fromPool = false ){

        let anim = [], n = 0
        if(fromPool){
            let i = Pool.clip.length
            while(i--){

                if( toJson ) anim[n] = Pool.clip[n].toJSON();
                else anim[n] = Pool.clip[n];
                // delete animations[n].uuid
                n++;
            }
        } else {
            this.actions.forEach( function ( action, key ) {
                if( toJson ) anim[n] = action._clip.toJSON();
                else anim[n] = action._clip;
                //delete data[n].uuid
                n++;
            })
        }

        return anim;

    }

    exportAnimationLzma( callback ){

        if(!this.lzma) this.lzma = new LZMA(this.lzmaPath);

        const data = this.getAnimation( true );

        this.lzma.compress( JSON.stringify(data), 2, function(result) {

            if( callback ) callback( {name:'animations', data:new Uint8Array(result), type:'bin'}  )
            else {
                let link = document.createElement("a");
                link.style.display = "none";
                document.body.appendChild(link);
                link.href = URL.createObjectURL( new Blob( [new Uint8Array(result)], {type: "application/octet-stream"} ) );
                link.download = 'animations.bin';
                link.click();
            }
        })
    }

    exportGLB( callback ){

        if( !this.exporter ) this.exporter = new GLTFExporter();
        
        const animations = this.getAnimation()

        this.exporter.parse( this.root, function( gltf ){

            if( callback ) callback( {name:'model', data:gltf, type:'glb'}  )
            else {
                let link = document.createElement("a");
                link.style.display = "none";
                document.body.appendChild(link);
                link.href = URL.createObjectURL( new Blob([gltf], { type: "application/octet-stream" }) );
                link.download = 'model.glb';
                link.click();
            }

            //self.loader.parse( JSON.stringify(glb, null, 2), '', function (r){ console.log(r) } )

        }, null, { animations:animations, binary: true, onlyVisible: true } )

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

    convertFbx( name, anim, autoplay ) {

        const torad = Math.PI / 180;
        let lockPosition = true;
        let p = new Vector3();
        let q = new Quaternion();
        let RX = new Quaternion().setFromAxisAngle({x:1, y:0, z:0}, 90 * torad );

        const baseTracks = anim.tracks;
        const tracks = [];

        let i = baseTracks.length, j, n, t, b, k = 0;

        while(i--){
            t = baseTracks[k];
            b = t.name.substring(0, t.name.lastIndexOf('.') );

            if( t.name === 'hip.position' ){
                let rp = []
                j = t.values.length / 3;
                while(j--){
                    n = j * 3;
                    if( lockPosition ) p.set( t.values[n], t.values[n+1], 0).multiplyScalar(0.01);
                    else p.set( t.values[n], t.values[n+1], t.values[n+2]).multiplyScalar(0.01);
                    p.toArray( rp, n );
                }
                tracks.push( new VectorKeyframeTrack( t.name, t.times, rp ) );

            } else {
                let rq = []
                j = t.values.length / 4 
                while(j--){
                    n = j * 4
                    if( b==='hip') q.set(t.values[n], t.values[n+1], t.values[n+2], t.values[n+3]).multiply( RX );
                    else q.set(t.values[n], t.values[n+2], -t.values[n+1], t.values[n+3]);
                    q.toArray( rq, n );
                }
                tracks.push( new QuaternionKeyframeTrack( t.name, t.times, rq ) );
            }
            k++;
        }

        let clip = new AnimationClip( name, -1, tracks );
        clip.duration = anim.duration;

        //console.log( name, anim.duration )



        this.stop();
        this.addClip( clip );
        this.addAction( clip, autoplay );

    }

    makePoseTrack( name, data, isAdd = false ){

        const torad = Math.PI / 180;
        //let lockPosition = true;
        //let p = new Vector3();
        let q = new Quaternion();
        //let RX = new Quaternion().setFromAxisAngle({x:1, y:0, z:0}, 90 * torad );

        const baseTracks = data// anim.tracks;
        const tracks = [];

        let i = baseTracks.length, j, n, n2, t, b, k = 0;

        let numFrame = 3//3

   

        while(i--){
            t = baseTracks[i]
            b = t.name//.substring(0, t.name.lastIndexOf('.') )

            /*if( t.name === 'hip.position' ){
                let rp = []
                j = t.values.length / 3;
                while(j--){
                    n = j * 3;
                    if( lockPosition ) p.set( t.values[n], t.values[n+1], 0).multiplyScalar(0.01);
                    else p.set( t.values[n], t.values[n+1], t.values[n+2]).multiplyScalar(0.01);
                    p.toArray( rp, n );
                }
                tracks.push( new VectorKeyframeTrack( t.name, t.times, rp ) );

            } else {*/
                let rq = []
                let tt = []
                k = 0
                j = numFrame//t.values.length / 3 
                while(j--){
                    n = 0//j * 3
                    n2 = k * 4

                    tt.push( k * 0.03333333507180214 )
                    //if( b==='hip') q.set(t.values[n], t.values[n+1], t.values[n+2], t.values[n+3]).multiply( RX );
                    //else q.set(t.values[n], t.values[n+2], -t.values[n+1], t.values[n+3]);
                    q.setFromEuler( {_x:t.values[n]*torad, _y:t.values[n+1]*torad, _z:t.values[n+2]*torad, _order:'XYZ'})
                    q.toArray( rq, n2 );
                    k++;
                }
                tracks.push( new QuaternionKeyframeTrack( t.name+'.quaternion', tt, rq ) );
            //}
            
        }


        // additive not work
        let blendMode = isAdd ? AdditiveAnimationBlendMode : NormalAnimationBlendMode;
        let clip = new AnimationClip( name, -1, tracks, blendMode );
        clip.duration = numFrame * 0.03333333507180214//anim.duration;

        //console.log(clip)

        const action = this.mixer.clipAction( clip );
        //action.frameMax = numFrame;
        action.enabled = true;
        //action.time = 0;
        action.setEffectiveTimeScale( 1 );
        action.setEffectiveWeight( 1 );
        action.play();

        
        //action.paused = true;
        //this.actions.set( clip.name, action );

        //this.stop();
        //this.addClip( clip, true );
        //this.addAction( clip, autoplay );
        this.actionPose = action;



    }


    //---------------------
    //
    //  ANIMATION CONTROL
    //
    //---------------------

    prepareCrossFade( startAction, endAction, duration )  {
        //singleStepMode = false;

        this.isPause = false;
        this.unPause();
        // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
        // else wait until the current action has finished its current loop
        if ( endAction._clip.name !== 'idle' ) {
            this.executeCrossFade( startAction, endAction, duration );
        } else {
            this.synchronizeCrossFade( startAction, endAction, duration );
        }

    }

    synchronizeCrossFade( startAction, endAction, duration ) {

        this.mixer.addEventListener( 'loop', onLoopFinished );
        const self = this;
        function onLoopFinished( event ) {
            if ( event.action === startAction ) {
                self.mixer.removeEventListener( 'loop', onLoopFinished );
                self.executeCrossFade( startAction, endAction, duration );
            }
        }

    }

    executeCrossFade( startAction, endAction, duration, warping = true ) {
        // Not only the start action, but also the end action must get a weight of 1 before fading
        // (concerning the start action this is already guaranteed in this place)
        this.setWeight( endAction, 1 );
        endAction.time = 0;
        // Crossfade with warping - you can also try without warping by setting the third parameter to false
        startAction.crossFadeTo( endAction, duration, true );
    }

    pause(){
        this.actions.forEach( function ( action ) { action.paused = true; });
        this.isPause = true;
    }

    unPause(){
        this.actions.forEach( function ( action ) { action.paused = false; });
        this.isPause = false;
    }

    playAll(){
        this.actions.forEach( function ( action ) { action.play(); });
    }

    setTimescale( timescale ) {

        this.actions.forEach( function ( action ) { action.setEffectiveTimeScale( timescale ); });

    }

    syncro( name ) {

        let action = this.getAction( name );
        if ( !action ) return;
        let time = action.time;
        this.actions.forEach( function ( action ) { action.time = time; });

    }

    /*setTimescale( action, timescale ) {

        action.enabled = true;
        action.setEffectiveTimeScale( timescale );

    }*/

    setWeight( action, weight ) {

        //if( typeof action === 'string' ) action = this.getAction( action );
        //if ( !action ) return;

        action.enabled = true;
        if(weight<0) weight = 0
        if(weight>1) weight = 1
        //let old = action.getEffectiveWeight()
        //if(old===0 && weight!== 0) action.time = 0;
        //action.setEffectiveTimeScale( weight );
        action.setEffectiveWeight( weight );

    }


    getAnimInfo( name ){

        let action = this.getAction( name );
        if ( !action ) return;
        return {
            name: name,
            time: action.time,
            frame: Math.round( action.time * FrameTime ),
            frameMax: action.frameMax,
            timeScale: action.timeScale,
        }

        //if( ui ) ui.updateTimeBarre( anim.frame, anim.frameTime, anim.frameMax );

    }

    getAction( name ) {
        //if ( !this.actions.has( name ) ) return;
        return this.actions.get( name );
    }

    play( name, fade = 0.5 ) {

        let action = this.getAction( name );
        if ( !action ) return false;

        if( !this.current ){
            this.stop()
            this.current = action;
            //action.play();
            action.setEffectiveWeight( 1 );
        } else {

            if( this.current !== action ){

                this.old = this.current;
                this.current = action;

                let isIdle = this.current.getClip().name === 'idle'
                isIdle = this.old.getClip().name === 'idle'

                if( this.clipsToesFix.indexOf(name) !== -1 ) this.fixToe = true;
                else this.resetToes();

                let oldEff = this.old.getEffectiveWeight();
                let currentEff = this.current.getEffectiveWeight();
                
                // keep current time to avoid reloop
                let time = this.current.time;
                // sycro if not idle on walk run leg position
                if( !isIdle ){ 
                    let ratio = this.current.getClip().duration / this.old.getClip().duration;
                    time = this.old.time * ratio;
                }

                // reset current
                this.current.reset();
                //currentEff = 0

                this.current.time = time;


                if( this.fixWeight ){

                    this.current.weight = 1.0;
                    this.current.stopFading()
                    this.old.stopFading()//.stopWarping();
                    this.old._scheduleFading( fade, oldEff, 0 );
                    this.current._scheduleFading( fade, currentEff, 1 );

                } else {

                    this.executeCrossFade( this.old, this.current, fade );

                    //this.current.crossFadeFrom( this.old, fade, true );

                }

            }
        } 

        this.isPause = false;

        return true;
    }

    playFrame ( name, frame, weight = 1 ) {



        let action = this.getAction( name );
        if ( !action ) return;

        action.time = frame * TimeFrame;
        action.setEffectiveWeight( weight );
        action.play();
        action.paused = true;
        this.isPause = true;

    }

    playOne ( frame, weight = 1 ) {

        if ( !this.current ) return;

        this.current.time = frame * TimeFrame;
        this.current.setEffectiveWeight( weight );
        this.current.play();
        this.current.paused = true;
        this.isPause = true;

    }

    stop(){

        this.actions.forEach( function ( action ) { action.setEffectiveWeight( 0 ) });
        //this.mixer.stopAllAction()
    }



    // bone control

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
    //  HIDE PART OF BODY
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

}