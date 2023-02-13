import {
	Object3D, Group, Mesh,SkinnedMesh,Texture,
    Matrix4, Quaternion, Euler, Vector3, Vector2,
    SphereGeometry, SkeletonHelper,
    MeshStandardMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshBasicMaterial,MeshPhysicalMaterial,
    TextureLoader,AnimationMixer, AxesHelper,
    FrontSide, BackSide, DoubleSide, Color, ShaderChunk, CanvasTexture,
    VectorKeyframeTrack, QuaternionKeyframeTrack, AnimationClip, Skeleton, sRGBEncoding,
    Float32BufferAttribute, EquirectangularReflectionMapping, LinearEncoding,
    EqualDepth,LessDepth,LessEqualDepth,GreaterEqualDepth,GreaterDepth,NotEqualDepth,
    CustomBlending, AddEquation, SubtractEquation, ReverseSubtractEquation, MinEquation, MaxEquation,
    ZeroFactor, OneFactor, SrcColorFactor, OneMinusSrcColorFactor, SrcAlphaFactor, OneMinusSrcAlphaFactor, DstAlphaFactor, OneMinusDstAlphaFactor, DstColorFactor, OneMinusDstColorFactor, SrcAlphaSaturateFactor,
} from 'three';


import { Pool } from '../Pool.js';
import { Shader } from '../Shader.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

import { LZMA } from '../../libs/lzma.js';
import { Tension } from '../Tension.js';

import { ExoSkeleton } from './ExoSkeleton.js';

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

export class Avatar extends Group {

	constructor( o = { } ) {

        super();

        this.matrixAutoUpdate = false;
        this.isPause = true;

        this.textureQuality = 2;

        this.model = o.type || 'man';
        this.compact = o.compact !== undefined ? o.compact : true
        this.haveMorph = o.morh !== undefined ? o.morph : true
        this.fullMaterial = o.material !== undefined ? o.material : true

        this.size = 1;

        this.fullMorph = ['MUSCLE', 'LOW', 'BIG', 'MONSTER']
        

        this.skeleton = null;
        //this.root = null;
        this.mixer = null;
        this.mesh = {};
        this.bones = {};
        this.done = false;
        this.isClone = false;
        
        this.isBreath = true;

        this.tensionTest = true;
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

        this.setting = {
            mixRatio:0.,
            threshold:0.1,
            normal:0.4,
            hair:0xa43412,

            bow:0x100402,

            sheen:2.25,
            sheenRoughness:1.0,

            metalness:1,
            roughness:0.5,
            wireframe:false,
            vertexColors:false,

            /*equation: 'add',
            blendSrc:'srcAlpha',
            blendDst:'zero',///'oneSrcAlpha'
            equationA: 'add',
            blendSrcA:'srcAlpha',
            blendDstA:'oneSrcAlpha',*/
            alphaTest:0.3,
            h_metal:0.4,
            h_rough:0.6,
            
        }

        //this.initMaterial();

        this.root = Pool.get( this.model, 'O' )

        if( this.root ){
            this.isClone = true;
            this.tensionTest = false;
            this.root = SkeletonUtils.clone( this.root );
            this.init();
        } else {
            if(this.fullMaterial) this.load()
            else this.loadModels()
        }

    }

    load()
    {

        this.skin = Pool.getTexture('avatar_c')
        if( !this.skin ){
            const path = './assets/textures/avatar_' + this.textureQuality + 'k/'
            const asset = [
                'avatar_c.jpg', 'avatar_n.jpg', 'avatar_m.jpg', 'avatar_r.jpg', 'avatar_u.jpg',
                'mouth_c.jpg', 'mouth_a.jpg', 'mouth_n.jpg', 
                'eye_c.jpg', 'eye_n.jpg', 'hair.jpg', 'hair_a.jpg',
                'eyelash_c.jpg', 'eyelash_a.jpg', 'eyelash_n.jpg',
                'hair_man.jpg', 'hair_man_a.jpg'
            ]
            Pool.load( asset, this.loadModels.bind(this), path, 'loading images...' )
        } else {
            this.loadModels()
        }

    }

    loadModels()
    {
        this.initMaterial()
        const asset = [this.model+'.glb']
        const path = './assets/models/avatar/'
        if( this.haveMorph ) asset.push( this.model+'_morph.glb' )
        Pool.load( asset, this.init.bind(this), path, 'loading models...' )
    }

    update( delta )
    {

        if( !this.done ) return;
        if ( this.mixer ){

            this.mixer.update( delta );

            // blink
            const n = this.n
            if( n<=20) this.eyeControl((n*0.05))
            if( n>10 && n<=40 ) this.eyeControl(1-((n-20)*0.05))
            this.n ++
            if( this.n===1000 ) this.n = 0

            if( !this.isClone ){ 
                this.look( delta*10 )
                this.breathing()
                this.autoToes()
            }

            if( this.tensionActive ){ 
                this.tension1.update()
                this.tension2.update()
            }

            if( window.gui && this.current ){ 
                window.gui.updateTimeBarre( Math.round( this.current.time * FrameTime ), this.current.frameMax );
            }
        }

    }

    look( delta )
    {

        if(this.isPause) return

        const v = window.mouse || {x:0, y:0};

        if(delta>1) delta = 1

        this.headBoneLook.lerp({ x:-(v.y*20)*torad, y:0, z:-(v.x*20)*torad }, delta );
        this.eyeTarget.position.lerp({ x:v.x*0.5, y:1, z:-v.y*0.25 }, delta );

        let e = this.headBoneLook;
        this.tmpQ.setFromEuler( { _x:e.x, _y:e.y, _z:e.z, _order:'XYZ' }, false );
        this.bones.head.quaternion.multiply(this.tmpQ)

        let ER = this.bones.ER;
        let EL = this.bones.EL;
        let up = {x:0, y:0, z:1}

        this.tmpMtx.lookAt( EL.position, this.eyeTarget.position.clone().add({x:0.03, y:0, z:-0.074}), up );
        EL.quaternion.setFromRotationMatrix( this.tmpMtx ).multiply(this.q);

        this.tmpMtx.lookAt( ER.position, this.eyeTarget.position.clone().add({x:-0.03, y:0, z:-0.074}), up );
        ER.quaternion.setFromRotationMatrix( this.tmpMtx ).multiply(this.q);

    }

    breathing()
    {

        if( !this.isBreath )return;

        let a = this.breath*0.01

        if(this.breathSide > 0){
            this.bones.chest.scalling.y = this.lerp (1,1.04, a);
            this.bones.chest.scalling.x = this.lerp (1,1.02, a);
            this.bones.abdomen.scalling.y = this.lerp (1,0.92, a);
        }else{
            this.bones.chest.scalling.y = this.lerp (1.04,1, a);
            this.bones.chest.scalling.x = this.lerp (1.02,1, a);
            this.bones.abdomen.scalling.y = this.lerp (0.92,1, a);
        }

        this.breath ++;
        if( this.breath === 100 ){ this.breath = 0; this.breathSide = this.breathSide > 0 ? -1:1; }

    }

    setPosition( x, y, z )
    {
        this.position.set( x, y, z )
        this.updateMatrix()
    }

    onReady(){}

    /*load()
    {
        this.loader = new GLTFLoader().setDRACOLoader( new DRACOLoader().setDecoderPath( './src/libs/draco/' ) );
        this.loader.load( './assets/model/'+this.model+'.glb', function ( glb ) {
            //this.root = glb.scene;
            //Pool.set( this.model, this.root );
            Pool.set( this.model, glb.scene );
            this.loadMorph();
        }.bind(this))
    }

    loadMorph()
    {
        this.loader.load( './assets/model/' + this.model+'_morph.glb', function ( glb ) {
            Pool.set( this.model+'_morph', glb.scene );
            this.init();
        }.bind(this))
    }

    loadExtra()
    {
        const self = this;
        const list = []
        this.loader.load( './assets/model/extra.glb', function ( glb ) {

            glb.scene.traverse( function ( node ) {
                if ( node.isMesh ){
                    node.receiveShadow = true;
                    node.castShadow = true;
                    node.visible = false;
                    node.material = self.material2;
                    // remplace skeleton
                    if( node.isSkinnedMesh ){
                        node.skeleton.dispose();
                        node.skeleton = self.skeleton;
                    }
                    self.mesh[node.name] = node;
                    list.push(node.name);
                }
            })

            // add new mesh to root
            let i = list.length;
            while( i-- ){
                self.root.add( self.mesh[ list[i] ]);
            }

            //self.loadAnimationFbx('./assets/animation/Defeated.fbx');
            self.loadAnimationGlb('./assets/animation/locomotion.glb')
            //self.loadAnimationHex('./assets/animation/animation.hex')

        })
    }*/

    /*texture( url, o = {} )
    {

        //const tx = new Texture()
        if( !this.imgLoader ) this.imgLoader = new TextureLoader();
        let path = './assets/textures/avatar_2k/'
        const tx = this.imgLoader.load( path + url );

        tx.encoding = o.rgbe ? sRGBEncoding : LinearEncoding;
        tx.flipY = o.flipY !== undefined ? o.flipY : false;

        return tx;
    }

    mats( type, o = {} ){

    }*/

    initMaterial()
    {



        if( Pool.getMaterial( 'body' ) ) return

        if( !this.fullMaterial ){
            Pool.set( 'body', new MeshStandardMaterial() )
            return
        } 

        const s = this.setting

        // MOUTH

        let m = new MeshStandardMaterial( { 
            map:Pool.getTexture('mouth_c'),
            roughness:0.6,//0.568,
            metalness:0.6,
            alphaMap:Pool.getTexture('mouth_a'),
            alphaTest:0.5,
            normalMap:Pool.getTexture('mouth_n')
        });

        Shader.add(m)
        Pool.set( 'mouth', m );

        // EYE

        m = new MeshPhysicalMaterial( { 
            //color:0x000000,
            roughness:0,//0.568,
            metalness:0,
            ior:1.376,
            //clearcoat:1.0,
            //opacity:0.33,
            //transparent:true,
            transmission: 1,
            thickness: 0.001,
            envMapIntensity:0.01,
            normalMap:Pool.getTexture('eye_n'),
            normalScale:new Vector2( 2, -2),
            envMap:Pool.get('reflect3', 'hdr')
        });

        Shader.add(m)
        Pool.set( 'sub_eye', m );


        m = new MeshStandardMaterial({ 
            map:Pool.getTexture('eye_c'),
            emissiveMap:Pool.getTexture('eye_c'),
            emissive:0x101010,
            roughness:0.7,
            metalness:0.1,
            normalMap:Pool.getTexture('eye_n'),
            normalScale:new Vector2( 2, -2)
            //opacity:0.2,
            //transparent:true,
            //transmission: 1,
            //thickness: 0.5,
        });

        Shader.add(m)
        Pool.set( 'eye', m );


        // HAIR

        m = new MeshStandardMaterial({
            map:Pool.getTexture('hair'),
            color:s.hair,
            //emissiveMap:Pool.getTexture('hair'),
            //emissive:this.setting.hair,
            roughness:s.h_rough,
            metalness:s.h_metal,
            alphaMap:Pool.getTexture('hair_a'),
            alphaTest:s.alphaTest,
            
            side: DoubleSide,
            opacity:1.0,
            
            transparent:true,

            blending:CustomBlending,
            blendDst:ZeroFactor,
            blendDstAlpha:SrcAlphaFactor,
            //OneMinusSrcAlphaFactor
            /*blendEquationAlpha:AddEquation,
            blendSrcAlpha:SrcAlphaFactor,//SrcAlphaFactor
            */
            shadowSide:DoubleSide,

            //depthTest:false,
            //depthWrite:false,
            alphaToCoverage:true,
            //premultipliedAlpha:true,
            //dithering:true,
        });



        Shader.add(m)
        Pool.set( 'hair', m );

        m = m.clone();
        //m.map = m.emissiveMap = Pool.getTexture('hair_man')
        m.color.setHex( s.hair )
        m.map = Pool.getTexture('hair_man')
        m.alphaMap = Pool.getTexture('hair_man_a')

        Shader.add(m)
        Pool.set( 'hair_man', m );

        
        m = new MeshStandardMaterial({
            color:s.hair, //bow,
            map:Pool.getTexture('eyelash_c'),
            //emissiveMap:Pool.getTexture('eyelash_a'),
            //emissive:s.bow,

            roughness:s.h_rough,
            metalness:s.h_metal,
            //roughness:0.75,
            //metalness:0.25,
            alphaMap:Pool.getTexture('eyelash_a'),
            alphaTest:s.alphaTest,
            transparent:true,
            side: DoubleSide,
            alphaToCoverage:true,
            polygonOffset: true,                
            polygonOffsetFactor: - 4,
            //premultipliedAlpha:true,
            normalMap:Pool.getTexture('eyelash_n'),
            normalScale:new Vector2( 1, -1)
        });

        Shader.add(m)
        Pool.set( 'eyelash', m );

        m = new MeshPhysicalMaterial({
            map:Pool.getTexture('eyelash_c'),
            //emissiveMap:eyea,
            //emissive:this.setting.hair,
            roughness:0.5,
            metalness:0.5,
            alphaMap:Pool.getTexture('eyelash_a'),
            //alphaTest:0.5,
            transparent:true,
            alphaToCoverage:true,
            opacity:1,
            //thickness: 0.001,
            //envMapIntensity:0.3,
            //envMap:eyer
            //premultipliedAlpha:true
        });

        Shader.add(m)
        Pool.set( 'tear', m );

        this.skin = Pool.getTexture('avatar_c')

        m = new MeshPhysicalMaterial({

            map: this.skin, 
            normalMap:Pool.getTexture('avatar_n'),
            roughness:this.setting.roughness, //1.0,
            metalness:this.setting.metalness, //1.0,
            metalnessMap:Pool.getTexture('avatar_m'),
            //roughnessMap:Pool.getTexture('avatar_r'),
           // alphaMap:alpha,
           // alphaTest:0.0001,
            normalScale:new Vector2( this.setting.normal, -this.setting.normal),
            shadowSide:DoubleSide,
            //transparent:true,
            //aoMap:ao,
            sheenColorMap:Pool.getTexture('avatar_u', {encoding:true}),
            //sheenRoughnessMap:rough,
            sheenRoughness:this.setting.sheenRoughness,
            sheenColor:0xffffff,
            sheen:this.setting.sheen,

        });


        /*const self = this;



        m.onBeforeCompile = function ( shader ) {
            Shader.modify( shader );
            //console.log(  'bf', this )
            /*shader.uniforms.mixRatio = { value: self.setting.mixRatio };
            shader.uniforms.threshold = { value: self.setting.threshold };

            //shader.vertexShader = shader.vertexShader.replace( `#include <morphtarget_vertex>`, morphFix )

            shader.fragmentShader = 'uniform float mixRatio;\nuniform float threshold;\n' + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace(
            `#include <alphamap_fragment>`,`
            #ifdef USE_ALPHAMAP
                float vv = texture2D( alphaMap, vUv ).g;
                float r = mixRatio * (1.0 + threshold * 2.0) - threshold;
                float mixf = clamp((vv - r)*(1.0/threshold), 0.0, 1.0);
                diffuseColor.a *= mixf;
            #endif
            `)
            this.userData.shader = shader;*/
        /*}

        m.customProgramCacheKey = function () {
            console.log(  'bf', this )
            //return amount;
        };*/


        //if( this.tensionTest ) m = new MeshBasicMaterial({ vertexColors:true })
        Shader.add(m)
        Pool.set( 'body', m );

        // LOW

        m = new MeshBasicMaterial({ 
            color:0x000000,
            wireframe: true,
        });

        Shader.add(m)
        Pool.set( 'low', m );

    }

    

    /*correctNeck( name )
    {
        let h = this.mesh[name].geometry
        let c = this.mesh['Neck'].geometry

        let p = h.attributes.position.array;
        let o = h.attributes.normal.array;
        let i = h.attributes.position.count, j, n, m;

        let pc = c.attributes.position.array;
        let co = c.attributes.normal.array;

        while( i-- ){
            n = i*3;
            j = c.attributes.position.count;
            while( j-- ){
                m = j*3;
                if(pc[m] === p[n]){
                    if(pc[m+1] === p[n+1]){
                        if(pc[m+2] === p[n+2]){
                            //console.log( o[n] + ' | '+o[n+1]+' | '+o[n+2]  +'    ', co[m] +' | '+co[m+1]+' | '+co[m+2]  )
                            o[n] = co[m]
                            o[n+1] = co[m+1]
                            o[n+2] = co[m+2]
                        }
                    }
                }
            }

        }

        h.attributes.normal.needsUpdate  = true
        
    }

    cloneHair( node )
    {
        let hair = node.clone();
        hair.material = node.material.clone();
        hair.material.side = BackSide;
        hair.material.depthWrite = false;
        node.renderOrder = 1;
        node.parent.add(hair)
    }*/


    

    /*setBlending()
    {
        const equation = {
            'add':AddEquation,
            'sub':SubtractEquation,
            'rsub':ReverseSubtractEquation,
            'min':MinEquation,
            'max':MaxEquation,
        }

        const factors = {
            'zero':ZeroFactor,
            'one':OneFactor,
            'srcColor':SrcColorFactor,
            'oneSrcColor':OneMinusSrcColorFactor,
            'srcAlpha':SrcAlphaFactor,
            'oneSrcAlpha':OneMinusSrcAlphaFactor,
            'dstAlpha':DstAlphaFactor,
            'oneDstAlpha':OneMinusDstAlphaFactor,
            'dstColor':DstColorFactor,
            'oneDstColor':OneMinusDstColorFactor,
            'saturate':SrcAlphaSaturateFactor,
        }


        let m = Pool.getMaterial( 'hair' )
        m.blendEquation = equation[this.setting.equation]
        m.blendSrc = factors[this.setting.blendSrc]
        m.blendDst = factors[this.setting.blendDst]

        m.blendEquationAlpha = equation[this.setting.equationA]
        m.blendSrcAlpha = factors[this.setting.blendSrcA]
        m.blendDstAlpha = factors[this.setting.blendDstA]

        m.needsUpdate = true

        m = Pool.getMaterial( 'hair_man' )
        m.blendEquation = equation[this.setting.equation]
        m.blendSrc = factors[this.setting.blendSrc]
        m.blendDst = factors[this.setting.blendDst]

        m.blendEquationAlpha = equation[this.setting.equationA]
        m.blendSrcAlpha = factors[this.setting.blendSrcA]
        m.blendDstAlpha = factors[this.setting.blendDstA]
        
        m.needsUpdate = true

    }*/

    setHair()
    {

        if( !Pool.getMaterial( 'hair' ) ) return
        let c = this.setting.hair;
        let m = Pool.getMaterial( 'hair' )
        m.color.setHex( c ).convertSRGBToLinear()
        m.alphaTest = this.setting.alphaTest
        m.metalness = this.setting.h_metal
        m.roughness = this.setting.h_rough
        //m.emissive.setHex( c )
        m = Pool.getMaterial( 'hair_man' )
        m.color.setHex( c ).convertSRGBToLinear()
        m.alphaTest = this.setting.alphaTest
        m.metalness = this.setting.h_metal
        m.roughness = this.setting.h_rough
        //m.emissive.setHex( c )
        m = Pool.getMaterial( 'eyelash' )
        m.color.setHex( c ).convertSRGBToLinear()
        m.alphaTest = this.setting.alphaTest
        m.metalness = this.setting.h_metal
        m.roughness = this.setting.h_rough
        //m.emissive.setHex( c )
    }

    setMaterial()
    {

        if( !Pool.getMaterial( 'body' ) ) return

        const m = Pool.getMaterial( 'body' );
        const s = this.setting;

        m.roughness = s.roughness;
        m.metalness = s.metalness;
        m.wireframe = s.wireframe;
        m.vertexColors = s.vertexColors;

        m.normalScale.set( s.normal, -s.normal )
        m.sheen = s.sheen;
        m.sheenRoughness = s.sheenRoughness;

        if( s.vertexColors && m.map !== null ){ m.map = null; this.tensionActive = true; m.sheen = 0;}
        if( !s.vertexColors && m.map === null ){ m.map = this.skin; this.tensionActive = false; }

        const shader = m.userData.shader;
        if( shader ){
            shader.uniforms.mixRatio.value = s.mixRatio;
            shader.uniforms.threshold.value = s.threshold;
        }
    }

    init()
    {

        if( !this.isClone ) this.root = Pool.get( this.model, 'O' ) 


        /*this.root.traverse( function ( node ) {
            if ( node.isMesh ) this.mesh[node.name] = node;
            if ( node.isBone ) this.bones[node.name] = node;
        }.bind(this))

        if( !this.isClone ) this.applyMorph( Pool.get( this.model +'_morph' ) );
        */

        
        const def = Pool.getMaterial( 'body' );

        this.root.traverse( function ( node ) {
            if ( node.isMesh ){

                // dispatch material 
                switch( node.name ){
                    case 'body': 
                    
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    node.matrixAutoUpdate = false;

                    //this.symetric( node );
                    //this.uv2( node )
                    //node.bindMode = 'detached';'attached'
                    this.skeleton = node.skeleton;
                    if( this.skeleton.resetScalling ) this.skeleton.resetScalling()
                    break;
                    case 'body_low': 
                        node.material = def//= Pool.getMaterial( 'low' ) || def;
                        node.receiveShadow = false;
                        node.castShadow = false;
                        node.visible = false
                    break;
                    case 'Head': 
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    //node.visible = false
                    break;
                    case 'mouth':
                    node.material = Pool.getMaterial( 'mouth' ) || def;
                    break;
                    case 'eyelash':  case 'eyebrow':
                    node.material = Pool.getMaterial( 'eyelash' ) || def;
                    break;
                    case 'tear': 
                    node.material = Pool.getMaterial( 'tear' ) || def;
                    break;
                    case 'eye_l':case 'eye_r':
                    node.material = Pool.getMaterial( 'eye' ) || def;
                    break;
                    case 'eye_l_s':case 'eye_r_s':
                    node.material = Pool.getMaterial( 'sub_eye' ) || def;
                    break;
                    case 'hair': 
                    node.material = Pool.getMaterial( this.model === 'man' ? 'hair_man': 'hair' ) || def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    break;
                    case 'hair_man': 
                    node.material = Pool.getMaterial( 'hair_man' ) || def;
                    node.name = 'hair'
                    node.receiveShadow = true;
                    node.castShadow = true;
                    break;
                }

                //console.log(node.name, node.material.name)
                // reset color
                this.zeroColor(node)
                // disable raycast
                node.raycast = function(){}
                this.mesh[node.name] = node;
            }
            if ( node.isBone ){ 
                //console.log(node.name)
                this.bones[node.name] = node;
                if( node.name === 'neck' ) node.add( this.eyeTarget );
                //if(node.name === 'ER') node.add(new AxesHelper(0.05));
                //if(node.name === 'EL') node.add(new AxesHelper(0.05));
            }
            
        }.bind(this))

        


        if( !this.isClone ){


            // for extra skin
            for( let m in this.mesh ){
                if( this.mesh[m].isSkinnedMesh && m !== 'body' ){
                    this.mesh[m].skeleton.dispose();
                    this.mesh[m].skeleton = this.skeleton;
                }
            }

            // add morph 
            if( this.haveMorph ) this.applyMorph( Pool.get( this.model+'_morph', 'O' ) );
        }


        if( this.size !== 1 ) this.root.scale.set(1,1,1).multiplyScalar(this.size);

        if( this.tensionTest ) this.addTensionMap()

        // animation
        this.mixer = new AnimationMixer( this );


        if( Pool.clip.length === 0 ){ 

            // load animation include in json or the compacted version
            if( this.compact ) this.loadCompactAnimation('./assets/models/avatar/animations.bin')
            else this.loadAnimationJson('./assets/animation/animations.json', this.start.bind(this) )

        } else {
            let i = Pool.clip.length;
            while(i--) this.addAction( Pool.clip[i] );
            this.start()
        }
             
    }

    addTensionMap()
    {
        this.tension1 = new Tension( this.mesh.body );
        this.tension2 = new Tension( this.mesh.Head );
    }

    setBounding( r )
    {
        for( let m in this.mesh ){
            if(this.mesh[m].isMesh ){
                this.mesh[m].geometry.boundingSphere.radius = r;
            }
        }

    }

    setBoneScale( v ){

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
    }


    eyeControl( v )
    {
        this.setMorph('EyeBlink', v)
    }

    setMorph( name, v )
    {
        if( !this.haveMorph ) return
        this.morpher( 'eyelash', name, v);
        this.morpher( 'eyebrow', name, v);
        this.morpher( 'tear', name, v);
        this.morpher( 'mouth', name, v);
        this.morpher( 'body', name, v);
        this.morpher( 'Head', name, v);
        this.morpher( 'body_low', name, v);
    }

    morpher( obj, name, value )
    {
        if(!this.mesh[obj]) return
        if(!this.mesh[obj].morphTargetInfluences) return
        if(this.mesh[obj].morphTargetDictionary[name] === undefined ) return
        this.mesh[obj].morphTargetInfluences[ this.mesh[obj].morphTargetDictionary[name] ] = value;
    }

    applyMorph( mod, normal = true, relative = false )
    {
        const morph = {};
        
        mod.traverse( function ( node ) { 
            if ( node.isMesh && node.name.search('__M__') !== -1) morph[node.name] = node.geometry;
        })


        let target, tName, oName, id, g, gm, j, dp, dn, ar, nn, nb;

        for ( let name in morph ){

            oName = name.substring( 0, name.indexOf('__') )
            tName = name.substring( name.lastIndexOf('__') + 2 );

            target = this.mesh[ oName ];

            if( target ){

                g = target.geometry;
                gm = morph[name];

                g.morphTargetsRelative = relative;

                if( g.attributes.position.count === gm.attributes.position.count ){

                    if( !g.morphAttributes.position ){
                        g.morphAttributes.position = [];
                        if( normal ) g.morphAttributes.normal = [];
                        target.morphTargetInfluences = [];
                        target.morphTargetDictionary = {};
                    }

                    id = g.morphAttributes.position.length;

                    // position
                    
                    if( relative ){

                        j = gm.attributes.position.array.length;
                        ar = []; 
                        while(j--) ar[j] = gm.attributes.position.array[j] - g.attributes.position.array[j]
                        dp = new Float32BufferAttribute( ar, 3 );
                    } else {
                        dp = new Float32BufferAttribute( gm.attributes.position.array, 3 );
                    }

                    g.morphAttributes.position.push( dp );

                    // normal
                    if( normal ){

                        let onlyHead = this.fullMorph.indexOf(tName) === -1 ? true : false

                        if( relative ){
                            j = gm.attributes.normal.length;
                            ar = [];
                            //while(j--) ar[j] = onlyHead ? 0.0 : gm.attributes.normal.array[j] - g.attributes.normal.array[j]
                            dn = new Float32BufferAttribute( gm.attributes.normal.array, 3 );
                            //dn = new Float32BufferAttribute( ar, 3 );
                        } else {
                            dn = new Float32BufferAttribute( gm.attributes.normal.array, 3 );
                        }

                        g.morphAttributes.normal.push( dn );

                    }

                    target.morphTargetInfluences.push(0)
                    target.morphTargetDictionary[ tName ] = id;

                    // clear morph mesh
                    //if( node.material ) node.material.dispose();
                    gm.dispose();

                    //console.log( target.name, tName)

                } else {
                    console.warn( 'Morph '+ tName + 'target is no good on ' + target.name )
                }
                
            }

        }

    }

    

    lerp( x, y, t ) { return ( 1 - t ) * x + t * y; }

    clone( o )
    {
        return new this.constructor( {type:o.type}, this );
    }

    dispose()
    {

        if( this.exoskel ) this.addExo()
        if( this.helper ) this.addHelper()
        this.stop();
        this.mixer.uncacheRoot( this );
        this.parent.remove(this);
        this.skeleton.dispose();
        if(!this.isClone){

        }
    }

    start()
    {

        //console.log('start', this.model)
        if( this.done ) return

        this.done = true;
        this.add( this.root );
        this.onReady();
        let a = this.play('IDLE');
        if(!a) this.play('idle');
    }

    addHelper()
    {
        if( this.helper ){
            this.helper.dispose()
            this.parent.remove( this.helper );
            this.helper = null;
        } else {
            this.helper = new SkeletonHelper( this.root );
            this.parent.add( this.helper );
        }
    }

    addExo()
    {
        if( this.exoskel ){
            this.exoskel.dispose()
            this.parent.remove( this.exoskel );
            this.exoskel = null;
        } else {
            this.exoskel = new ExoSkeleton( this.root, this.skeleton );
            this.parent.add( this.exoskel );
        }
    }

    attachToBone( m, b )
    {
        m.matrix = b.matrixWorld;
        m.matrixAutoUpdate = false;
    }

    loadAnimationJson( url, callback )
    {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onreadystatechange = function() {
            if ( request.readyState === 4 ) {
                if ( request.status === 200 || request.status === 0 ) {
                    let data = JSON.parse( request.responseText )
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

    loadOne()
    {
        let name = this.urls[0];
        this.loadAnimationFbx( './assets/animation/fbx/'+name+'.fbx', this.next.bind(this) );
    }

    next()
    {
        this.urls.shift();
        if( this.urls.length === 0 ) this.endCallback();
        else this.loadOne();
    }

    loadCompactAnimation( url = './assets/models/animations.bin' )
    {
        if(!this.lzma) this.lzma = new LZMA("./src/libs/lzma_worker.js");

        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        const glb = { animations : [] }
        const self = this;

        request.onload = function() {
            self.lzma.decompress( new Uint8Array( request.response ), function (result) {
                const data = JSON.parse(result);
                
                for(let c in data) glb.animations.push( AnimationClip.parse( data[c] ) ); 
                console.log( glb )
                self.applydAnimation( glb );
                self.start();
            })
        };
        request.send();

    }

    loadAnimationGlb( url, callback )
    {
        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        Pool.loaderGLTF().load( url, function ( glb ) {
            this.applydAnimation( glb, name );
            if( callback ) callback();
        }.bind(this), null, callback );
    }

    directGlb( data, name )
    {
        Pool.loaderGLTF().parse( data, '', function ( glb ) {
            this.stop();
            this.applydAnimation( glb, name );
        }.bind(this))
    }

    loadAnimationFbx( url, callback )
    {
        //if( !this.loaderFbx ) this.loaderFbx = new FBXLoader();
        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        Pool.loaderFBX().load( url, function ( node ) {
            this.convertFbx( name, node.animations[ 0 ] );
            if( callback ) callback();
        }.bind(this), null, callback )
    }

    directFbx( data, name )
    {
        //if( !this.loaderFbx ) this.loaderFbx = new FBXLoader();
        try {
            let node = Pool.loaderFBX().parse( data, '' )
            this.convertFbx( name, node.animations[ 0 ], true );
        } catch ( e ) {
            console.error( 'bug', e );
        }
    }

    applydAnimation( glb, name )
    {
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

    addClip( clip )
    {
        let i = Pool.clip.length, removeId = -1;
        while(i--){ if( Pool.clip[i].name === clip.name ) removeId = i; }
        if( removeId !== -1 ) Pool.clip.slice( removeId, 1 );


        //clip.optimize();
        Pool.clip.push( clip );
    }

    addAction( clip, play )
    {
        const action = this.mixer.clipAction( clip );
        action.frameMax = Math.round( clip.duration * FrameTime );
        this.actions.set( clip.name, action );

        if(clip.name.search('walk')!==-1) this.clipsToesFix.push(clip.name)
        if(clip.name.search('run')!==-1) this.clipsToesFix.push(clip.name)
        if(clip.name.search('strafe')!==-1) this.clipsToesFix.push(clip.name)
        if(clip.name.search('jog')!==-1) this.clipsToesFix.push(clip.name)
        if(clip.name.search('RUN')!==-1) this.clipsToesFix.push(clip.name)


        //if(clip.name=='idle'){
            //console.log( clip.toJSON() );
            //console.log( action )
        //}
        

        //
        //
        //console.log( this.getAnimInfo( clip.name ) )
        //

        //action.play();

        //action.paused = true; //!play
        if( window.gui ) window.gui.getAnimation()

        if( play ) this.play( clip.name )

             
    }

    getAnimation( toJson = false, fromPool = false )
    {

        let anim = [], n = 0
        if(fromPool){
            let i = Pool.clip.length
            while(i--){

                if( toJson ) anim[n] = Pool.clip[n].toJSON()
                else anim[n] = Pool.clip[n]
                // delete animations[n].uuid
                n++;
            }
        } else {
            this.actions.forEach( function ( action, key ) {
                if( toJson ) anim[n] = action._clip.toJSON()
                else anim[n] = action._clip
                //delete data[n].uuid
                n++;
            })
        }

        return anim

    }

    exportAnimationLzma( callback )
    {

        if(!this.lzma) this.lzma = new LZMA("./src/libs/lzma_worker.js");

        const data = this.getAnimation( true )

        this.lzma.compress( JSON.stringify(data), 2, function(result) {

            if(callback) callback( {name:'animations', data:new Uint8Array(result), type:'bin'}  )
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

    exportGLB( callback )
    {
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

    autoToes()
    {
        if(!this.fixToe) return
        let r = this.getRot('rFoot')
        let l = this.getRot('lFoot')
        let v = this.getWorldPos('hip')
        let v0 = this.getWorldPos('rToes')
        let v1 = this.getWorldPos('lToes')
        if(r[0]>0 && (v0.z-v.z)<0) this.setRot('rToes', -r[0]*1.5, 0,0 )
        else if( r[0] !== 0 ) this.setRot('rToes', 0,0,0 )
        if(l[0]>0 && (v1.z-v.z)<0) this.setRot('lToes', -l[0]*1.5, 0,0 )
        else if( l[0] !== 0 ) this.setRot('lToes', 0,0,0 )
    }

    resetToes()
    {
        if(!this.fixToe) return
        this.fixToe = false;
        this.setRot('rToes', 0,0,0 )
        this.setRot('lToes', 0,0,0 )
    }

    convertFbx( name, anim, autoplay )
    {
        const torad = Math.PI / 180;
        let lockPosition = true;
        let p = new Vector3();
        let q = new Quaternion();
        let RX = new Quaternion().setFromAxisAngle({x:1, y:0, z:0}, 90 * torad );

        const baseTracks = anim.tracks;
        const tracks = [];

        let i = baseTracks.length, j, n, t, b, k = 0;

        while(i--){
            t = baseTracks[k]
            b = t.name.substring(0, t.name.lastIndexOf('.') )

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

        this.stop();
        this.addClip( clip );
        this.addAction( clip, autoplay );

    }


    //---------------------
    //  ANIMATION CONTROL
    //---------------------

    prepareCrossFade( startAction, endAction, duration ) 
    {
        //singleStepMode = false;
        this.unPause();
        // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
        // else wait until the current action has finished its current loop

        if ( startAction === idleAction ) {
            this.executeCrossFade( startAction, endAction, duration );
        } else {
            this.synchronize( startAction, endAction, duration );
        }

    }

    synchronize( startAction, endAction, duration ) {

        this.mixer.addEventListener( 'loop', onLoopFinished );
        const self = this;
        function onLoopFinished( event ) {
            if ( event.action === startAction ) {
                self.mixer.removeEventListener( 'loop', onLoopFinished );
                self.executeCrossFade( startAction, endAction, duration );
            }
        }

    }

    executeCrossFade( startAction, endAction, duration ) 
    {
        // Not only the start action, but also the end action must get a weight of 1 before fading
        // (concerning the start action this is already guaranteed in this place)
        this.setWeight( endAction, 1 );
        endAction.time = 0;
        // Crossfade with warping - you can also try without warping by setting the third parameter to false
        startAction.crossFadeTo( endAction, duration, true );
    }

    pause()
    {
        this.actions.forEach( function ( action ) { action.paused = true; });
        this.isPause = true;
    }

    unPause()
    {
        this.actions.forEach( function ( action ) { action.paused = false; });
        this.isPause = false;
    }

    setTimescale( action, timescale ) {

        action.enabled = true;
        action.setEffectiveTimeScale( timescale );

    }

    setWeight( action, weight ) {

        action.enabled = true;
        //action.setEffectiveTimeScale( 1 );
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

    getAction( name )
    {
        //if ( !this.actions.has( name ) ) return;
        return this.actions.get( name );
    }

    play( name )
    {

        let action = this.getAction( name );
        if ( !action ) return false;

        if(!this.current){
            this.stop()
            this.current = action;
            action.play();
            //console.log(name)
        } else {
            if( this.current !== action ){

                this.old = this.current
                this.current = action;
                action.play();

                if( this.clipsToesFix.indexOf(name) !== -1 ) this.fixToe = true;
                else this.resetToes(); 


                //console.log( name, this.fixToe )


                this.executeCrossFade(this.old, this.current, 0.5  )

               // this.stop()
               //this.current = action;
               //

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

    stop()
    {
        this.mixer.stopAllAction()
    }



    // bone control

    setRot( name, x, y, z )
    {
        let n = this.bones[name];
        if(!n) return
        n.rotation.set( x*torad, y*torad, z*torad, 'XYZ' );
        n.updateMatrix();
    }

    getRot( name )
    {
        let n = this.bones[name];
        if(!n) return
        let r = n.rotation.toArray();
        return [ Math.round(r[0]*todeg), Math.round(r[1]*todeg), Math.round(r[2]*todeg) ];
    }

    getWorldPos( name )
    {
        let n = this.bones[name];
        if(!n) return
        V.set(0,0,0)
        n.localToWorld(V)
        return { x:V.x, y:V.y, z:V.z };
    }


    //---------------------
    //  HIDE PART OF BODY
    //---------------------

    bodyMask( o = {arm:true, leg:true, foot:true, chest:true } )
    {
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
        const m = Pool.getMaterial( 'body' );
        m.alphaTest = 0.9
        m.alphaMap = this.mask;
        //m.needsUpdate = true;
    }


    //---------------------
    //   TOOLS
    //---------------------

    zeroColor(g)
    {
        if( g.isMesh ) g = g.geometry;
        let lng = g.attributes.position.array.length;
        g.setAttribute( 'color', new Float32BufferAttribute( new Array(lng).fill(0), 3 ) );
    }

    symetric( g, uv2 = true, tangent = true ) {

        if( g.isMesh ) g = g.geometry;

        

        //

        /*let uv = g.attributes.uv.array;
        let i = uv.length*0.5;
        while( i-- ){ if( uv[i*2] < 0 ) uv[i*2]*=-1; }
        g.attributes.uv.needsUpdate = true;
        */

        //if( tangent ){ 

            //console.log(isReady)
            //g.computeTangents();
            //let MikkTSpace = { wasm:wasm, isReady:isReady, generateTangents:generateTangents }
            //g=computeMikkTSpaceTangents(g,MikkTSpace)
        //}

        //

        // for ao map
        if( uv2 ) g.setAttribute( 'uv2', g.attributes.uv );

    }

    uv2( g, uv2 = true, tangent = true ) {

        if( g.isMesh ) g = g.geometry;
        g.setAttribute( 'uv2', g.attributes.uv );

    }

}




//-----------------------------
//
//  SKELETON EXTAND
//
//-----------------------------

const _offsetMatrix = new Matrix4();
const _identityMatrix = new Matrix4();

let K = Skeleton.prototype;

K.resetScalling = function () {

    for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

        this.bones[i].idx = i;
        this.bones[i].scalling = new Vector3(1,1,1);
        //console.log(this.bones[i].id, i)

    }

    //this.setScalling();

}

K.setScalling = function ( fingerPos ) {

    let o, b, i, lng = this.bones.length;
    let parent;

    //this.resetPosition();

    for ( i = 0; i < lng; i ++ ) {

        b = this.bones[ i ];
        parent = b.parent || null;

        /*if( b.name==='root'){

            b.position.y = this.footPos;
            b.updateMatrixWorld( true );

        }*/

        if( parent !== null && parent.scalling && b.name!=='root'){

            // finger position fix

            /*if( fingerPos && this.isFinger( b ) ){

                b.position.fromArray( fingerPos[ b.name ] );
                b.children[0].position.set(0,0,0);

            }*/

            b.position.multiply( parent.scalling );
            b.updateMatrixWorld( true );

        }

    }

    this.calculateInverses();

}

K.update = function () {

    const bones = this.bones;
    const boneInverses = this.boneInverses;
    const boneMatrices = this.boneMatrices;
    const boneTexture = this.boneTexture;

    let scaleMatrix;
    const decal = new Vector3();

    // flatten bone matrices to array

    for ( let i = 0, il = bones.length; i < il; i ++ ) {

        // compute the offset between the current and the original transform

        const matrix = bones[ i ] ? bones[ i ].matrixWorld : _identityMatrix;

        if( bones[ i ].scalling !== undefined  ){ 
            matrix.scale( bones[ i ].scalling );
            for ( let j = 0, l = bones[ i ].children.length; j < l; j ++ ) {
                    scaleMatrix = matrix.clone();
                    scaleMatrix.multiply( bones[ i ].children[ j ].matrix );
                    bones[ i ].children[ j ].matrixWorld.setPosition( decal.setFromMatrixPosition( scaleMatrix ) );
                }
        }

        _offsetMatrix.multiplyMatrices( matrix, boneInverses[ i ] );
        _offsetMatrix.toArray( boneMatrices, i * 16 );

    }

    if ( boneTexture !== null ) {

        boneTexture.needsUpdate = true;

    }

}