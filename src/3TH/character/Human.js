
import {
	Object3D, Group, Mesh, SkinnedMesh, Texture,
    Matrix4, Quaternion, Euler, Vector3, Vector2,
    SphereGeometry, SkeletonHelper,
    MeshStandardMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshBasicMaterial,MeshPhysicalMaterial,
    TextureLoader,AnimationMixer,
    FrontSide, DoubleSide, Color, ShaderChunk, 
    VectorKeyframeTrack, QuaternionKeyframeTrack, AnimationClip, Skeleton, sRGBEncoding,
    Float32BufferAttribute, EquirectangularReflectionMapping, LinearEncoding,AdditiveBlending,
    CustomBlending,
    ZeroFactor,
    SrcAlphaFactor,
} from 'three';
import { Pool } from '../Pool.js';

const setting = {

    mixRatio:0.0,
    threshold:0.1,
    normal:0.25,
    hair:0xa43412,
    bow:0x100402,
    sheen:1,//2.25,
    sheenRoughness:1.0,//1.0,
    metalness:0.6,
    roughness:0.4,
    
    vertexColors:false,
    alphaTest:0.3,
    h_metal:0.4,
    h_rough:0.6,
    clearcoat:1.0,

    wireframe:false,
    transparent:false,
    opacity:1.0,
    
}

export const Human = {

	isBreath:false,
	isEyeMove:false,
	haveMorph:false,
    

    skeletonRef:'body',
	fullMorph: ['MUSCLE', 'LOW', 'BIG', 'MONSTER'],

	haveQuality: true,
	textureRef:'avatar_c',
	texturePath: 'assets/textures/avatar_',
	textures: [
        'avatar_c.jpg', 'avatar_n.jpg', 'avatar_m.jpg', 'avatar_r.jpg', 'avatar_u.jpg',
        'mouth_c.jpg', 'mouth_a.jpg', 'mouth_n.jpg', 
        'eye_c.jpg', 'eye_n.jpg', 'hair.jpg', 'hair_a.jpg',
        'eyelash_c.jpg', 'eyelash_a.jpg', 'eyelash_n.jpg',
        'hair_man.jpg', 'hair_man_a.jpg', //'avatar_ao.jpg',
    ],

    modelPath: 'assets/models/avatar/',
    forceModel: null,

    setting:setting,

    materialRef:'skin',
    materials:{
        skin:{
            type:'Physical',
            map: 'avatar_c', 
            normalMap:'avatar_n',
            roughness:1,
            metalness:1,
            metalnessMap:'avatar_m',
            roughnessMap:'avatar_r',
            normalScale: new Vector2( setting.normal, -setting.normal),
            
            sheen:setting.sheen,
            sheenRoughness:setting.sheenRoughness,
            sheenColor:0xffffff,
            sheenColorMap:'avatar_u',
            iridescence:1.0,
            wireframe:setting.wireframe,

            /*aoMap:'avatar_ao',
            aoMapIntensity:1,*/


            //envMapIntensity:1,
            
        },
    	mouth:{
            type:'Standard',
    		map:'mouth_c',
            roughness:0.6,
            metalness:0.6,
            alphaMap:'mouth_a',
            alphaTest:0.5,
            normalMap:'mouth_n'
    	},
    	sub_eye:{
            type:'Physical',
            roughness:0,//0.568,
            metalness:1,
            ior:1.376,
            opacity:1,
            blending:AdditiveBlending,
            clearcoat:1,
            transparent:true,
            envMapIntensity:0,
            //wireframe:true
        },
        eye:{
            type:'Physical',
        	map:'eye_c',
            roughness:0.7,
            metalness:0.15,
            normalMap:'eye_n',
            normalScale:new Vector2( 2, -2),
            clearcoat:0.25,
            //clearcoatRoughness:0.5,
        },
        hair:{
            type:'Standard',
        	map:'hair',
            color:setting.hair,
            roughness:setting.h_rough,
            metalness:setting.h_metal,
            alphaMap:'hair_a',
            alphaTest:setting.alphaTest,
            side: DoubleSide,
            opacity:1.0,
            transparent:true,
            blending:CustomBlending,
            blendDst:ZeroFactor,
            blendDstAlpha:SrcAlphaFactor,
            alphaToCoverage:true,
        },
        hair_man:{
            type:'Standard',
        	map:'hair_man',
            color:setting.hair,
            roughness:setting.h_rough,
            metalness:setting.h_metal,
            alphaMap:'hair_man_a',
            alphaTest:setting.alphaTest,
            side: DoubleSide,
            opacity:1.0,
            transparent:true,
            blending:CustomBlending,
            blendDst:ZeroFactor,
            blendDstAlpha:SrcAlphaFactor,
            alphaToCoverage:true,
        },
        eyelash:{
            type:'Standard',
        	color:setting.hair,
            map:'eyelash_c',
            roughness:setting.h_rough,
            metalness:setting.h_metal,
            alphaMap:'eyelash_a',
            alphaTest:setting.alphaTest,
            transparent:true,
            opacity:1,
            side: DoubleSide,
            alphaToCoverage:true,
            polygonOffset: true,                
            polygonOffsetFactor: - 4,
            //normalMap:'eyelash_n',
            //normalScale:new Vector2( 1, -1)
        },
        tear:{
            type:'Physical',
        	map:'eyelash_c',
            roughness:0.5,
            metalness:0.5,
            alphaMap:'eyelash_a',
            transparent:true,
            alphaToCoverage:true,
            opacity:1,
        },
        low:{
            type:'Basic',
        	color:0x000000,
            wireframe: true,
        }

    },

    changeMaterial:( sx = {}, def = false ) => {

        if( !Pool.getMaterial( Human.materialRef ) ) return

        const s = Human.setting;
        const defMat = Human.materials;
        
        let change = false;

        for(let v in sx){
            if(s[v]!== undefined){ 
                if(s[v] !== sx[v]){ 
                    s[v] = sx[v]
                    change = true;
                }}
        }

        let m;

        if(change){

            for(let key in defMat){
                m = Pool.getMaterial( key );
                for(let v in sx){
                    if( m[v] !== undefined ){ 

                        if( def && defMat[key][v] ) m[v] = defMat[key][v];
                        else m[v] = sx[v];

                    }
                }
            }

        }

    
        
        /*
         m = Pool.getMaterial( 'skin' );
        
        //m.roughness = s.roughness;
        //m.metalness = s.metalness;
        m.wireframe = s.wireframe;
        m.vertexColors = s.vertexColors;
        m.normalScale.set( s.normal, -s.normal )
        m.sheen = s.sheen;
        m.sheenRoughness = s.sheenRoughness;
        */

       /* let c = s.hair;
        m = Pool.getMaterial( 'hair' )
        m.color.setHex( c )
        m.alphaTest = s.alphaTest
        m.metalness = s.h_metal
        m.roughness = s.h_rough
        m = Pool.getMaterial( 'hair_man' )
        m.color.setHex( c )
        m.alphaTest = s.alphaTest
        m.metalness = s.h_metal
        m.roughness = s.h_rough
        m = Pool.getMaterial( 'eyelash' )
        m.color.setHex( c )
        m.alphaTest = s.alphaTest
        m.metalness = s.h_metal
        m.roughness = s.h_rough*/

        //if( s.vertexColors && m.map !== null ){ m.map = null; this.tensionActive = true; m.sheen = 0;}
        ///if( !s.vertexColors && m.map === null ){ m.map = this.skin; this.tensionActive = false; }

    },

    

    applyMaterial:( root, model ) => {

        // apply Material

        const def = Pool.getMaterial( 'skin' );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
                switch( node.name ){
                    case 'body':

                    //Pool.addUv2( node )
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    break;
                    case 'body_low': 
                        node.material = def
                        node.receiveShadow = false;
                        node.castShadow = false;
                        node.visible = false
                    break;
                    case 'Head': 
                    //Pool.addUv2( node )
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    break;
                    case 'mouth':
                    node.material = Pool.getMaterial( 'mouth' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    case 'eyelash':  case 'eyebrow':
                    node.material = Pool.getMaterial( 'eyelash' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    case 'tear': 
                    node.material = Pool.getMaterial( 'tear' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    case 'eye_l':case 'eye_r':
                    node.material = Pool.getMaterial( 'eye' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    case 'eye_l_s':case 'eye_r_s':
                    node.material = Pool.getMaterial( 'sub_eye' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    //node.visible = false
                    break;
                    case 'hair': 
                    node.material = Pool.getMaterial( 'hair' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = true;
                    node.matrixWorldAutoUpdate = false
                    break;
                    case 'hair_man': 
                    node.material = Pool.getMaterial( 'hair_man' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = true;
                    node.matrixWorldAutoUpdate = false
                    break;
                }
            }

        })

    },





}