

/*import {
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
} from 'three';*/
import { Pool } from '../Pool.js';

const setting = {

    metalness:0.2,
    roughness:0.8,
    wireframe:false,
    
}

export const Lee = {

    decalY:-0.06,

	isBreath:false,
	isEyeMove:false,
	haveMorph:false,

	skeletonRef:'leeSkin',

	fullMorph: [],

	haveQuality: false,
	//skinRef:'leeSkin',
	texturePath: 'assets/textures/',
	textures: ['lee_c.jpg', 'lee_ao.jpg'],

    modelPath: 'assets/models/',
    forceModel:'lee',

    setting:setting,

    materialRef:'lee_material',
    materials:{
        lee_material:{
            type:'Physical',
            map: 'lee_c', 

            roughness:0.3,
            metalness:0.08,
            //aoMap: 'lee_ao',
            wireframe:setting.wireframe,
            sheen:2.2,
            //emissive:0xFFFFFF,
            //emissiveMap:'lee_c',
            sheenColorMap:'lee_c',
            sheenColor:0xFFFFFF,
            sheenRoughness:0.4,
            envMapIntensity:1,
            //aoMapIntensity:0.5,
            //emissiveIntensity:0.25,

        },
    },

    /*changeMaterial:( Setting ) => {

        const s = Lee.setting;

        if(Setting){
            for(let o in Setting){
                if( s[o] !== undefined) s[o] = Setting[o]
            }
        }
        
        let m = Pool.getMaterial( 'lee_material' );
        m.roughness = s.roughness;
        m.metalness = s.metalness;
        m.wireframe = s.wireframe;

    },*/

    changeMaterial:( sx, def = false ) => {

        if( !Pool.getMaterial( Lee.materialRef ) ) return

        const defMat = Lee.materials;
        let m;

        for(let key in defMat){
            m = Pool.getMaterial( key );
            for(let v in sx){
                if( m[v] !== undefined ){ 
                    if( def && defMat[key][v] ) m[v] = defMat[key][v];
                    else m[v] = sx[v];
                }
            }
            //m.needsUpdate = true
        }

    },

    applyMaterial:( root, model ) => {

    	const def = Pool.getMaterial( 'lee_material' );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
            	
            	node.material = def;
                node.receiveShadow = true;
                node.castShadow = true;

            }

        })

    },

    adjustment:() => {

        return [
            //{name:'lShldr', values:[0,-70,0]},
            {name:'lHand', values:[-60,0,0]},
            //{name:'rShldr', values:[0,70,0]},
            {name:'rHand', values:[-60,0,0]}
        ]

    }




}