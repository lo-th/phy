

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


export const Eva = {

	isBreath:false,
	isEyeMove:false,
	haveMorph:false,

	skeletonRef:'eva_SKIN',

	fullMorph: [],

	haveQuality: false,
	skinRef:'eva_00',
	texturePath: 'assets/textures/eva/',
	textures: ['eva00_c.jpg', 'eva01_c.jpg', 'eva02_c.jpg'],

    modelPath: 'assets/models/',
    forceModel:'eva',

    setting:{},

    materialRef:'eva00',
    materials:{
        eva00:{
            type:'Standard',
            map: 'eva00_c', 
            roughness:0.5,
            metalness:0.8
        },
        eva01:{
            type:'Standard',
            map: 'eva01_c', 
            roughness:0.5,
            metalness:0.8
        },
        eva02:{
            type:'Standard',
            map: 'eva02_c', 
            roughness:0.5,
            metalness:0.8
        }
    },

    changeMaterial:() => {},

    

    applyMaterial:( root, model ) => {

    	const def = Pool.getMaterial( model );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
            	
            	node.material = def;
                node.receiveShadow = true;
                node.castShadow = true;

                switch( node.name ){

                    case 'eva_2_head':case 'eva_2_mach': 
                    node.visible = model === 'eva02' ? true : false
                    break;

                    case 'eva_L_COLLAR':case 'eva_R_COLLAR': 
                    node.visible = model === 'eva00' ? false : true
                    break;

                    case 'eva_HEAD': case 'eva_MACHOIR': 
                    node.visible = model === 'eva01' ? true : false
                    break;

                    case 'eva_0_R_COLLAR':case 'eva_0_L_COLLAR':case 'eva_0_head': case 'eva_0_head2':
                    node.visible = model === 'eva00' ? true : false
                    break;

                    case 'eva_0_CHEST2':
                    node.visible = model === 'eva01' ? false : true
                    break;
                }
            }

        })

    }




}