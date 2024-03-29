
import {
    Object3D, Group, Mesh, SkinnedMesh, Texture,
    Matrix4, Quaternion, Euler, Vector3, Vector2,
    SphereGeometry, SkeletonHelper,
    MeshStandardMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshBasicMaterial,MeshPhysicalMaterial,
    TextureLoader,AnimationMixer,
    FrontSide, DoubleSide, Color, ShaderChunk, 
    VectorKeyframeTrack, QuaternionKeyframeTrack, AnimationClip, Skeleton,
    Float32BufferAttribute, EquirectangularReflectionMapping, AdditiveBlending,
    CustomBlending,
    ZeroFactor,
    SrcAlphaFactor,
    ObjectSpaceNormalMap, TangentSpaceNormalMap,
} from 'three';
import { Pool } from '../Pool.js';

const setting = {

    wireframe:false,
    normal:0.25,
    hair:0x252011,
    
}

export const Human_low = {

	isBreath:false,
	isEyeMove:false,
	haveMorph:true,
    
    skeletonRef:'body_low',
	fullMorph: ['MUSCLE', 'LOW', 'BIG', 'MONSTER'],

	//haveQuality: true,
    //textureQuality:0,
    textureRef:'avatar_c_0k',
    texturePath: 'assets/textures/avatar/',
    textures: ['avatar_c_0k.jpg', 'avatar_n_0k.jpg', 'avatar_ao_0k.jpg', 'hair_man_a_0k.jpg', 'Hair_01_c.png', 'Hair_01_n.png'],

    modelPath: 'assets/models/avatar/',
    forceModel: null,

    setting:setting,

    materialRef:'skin_low',
    materials:{
        skin_low:{
            //color:0xE24C00,
            type:'Standard',//Physical',
            map: 'avatar_c_0k',
            aoMap:'avatar_ao_0k',
            normalMap: 'avatar_n_0k',

            normalScale: new Vector2( setting.normal, -setting.normal),
            //normalMapType: ObjectSpaceNormalMap,
            //normalMapType:TangentSpaceNormalMap,
            envMapIntensity:0.3,
            roughness:0.22,
            metalness:0.0,
            //reflectivity:0.05,
            vertexColors:false,
            /*sheen:1.0,
            sheenColor:0x692000,
            sheenRoughness:0.5,**/
            //side:DoubleSide,
            
            
        },
        hair_low:{
            //color:0xE24C00,
            type:'Standard',
            color:setting.hair,
            alphaMap: 'hair_man_a_0k',
            transparent:true,
            //blending:CustomBlending,
            //blendDst:ZeroFactor,
            //blendDstAlpha:SrcAlphaFactor,
            //alphaToCoverage:true,
        },

        hair_low_2:{
            //color:0xE24C00,
            type:'Standard',
            color:setting.hair,
            map:'Hair_01_c',
            normalMap: 'Hair_01_n'
        },

    },

    changeMaterial:( sx = {}, def = false ) => {

        if( !Pool.getMaterial( Human_low.materialRef ) ) return

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

        // apply Material

        const def = Pool.getMaterial( Human_low.materialRef );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
                switch( node.name ){
                    case 'body_low':
                    //Pool.symetric( node );
                    //node.geometry.deleteAttribute( 'normal' );
                    
                    //node.geometry.deleteAttribute( 'tangent' );
                    //node.geometry.computeVertexNormals()
                    node.material = def;
                    //node.material.normalMapType = ObjectSpaceNormalMap;

                    //node.material.needsUpdate = true

                    //Pool.objectSpaceNormal( node );
                    node.receiveShadow = true;
                    node.castShadow = true;
                    break;
                    case 'hair_low':
                    node.material = Pool.getMaterial( 'hair_low' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    case 'hair_low_2':
                    node.material = Pool.getMaterial( 'hair_low_2' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    
                }
            }

        })

    },

    adjustment:() => {

        return [
        {name:'neck', values:[-5,0,0]},
        {name:'chest', values:[5,0,0]},
        {name:'lCollar', values:[0,0,-10]},
        {name:'rCollar', values:[0,0,10]},
        {name:'lShldr', values:[-20,2,0]},
        {name:'rShldr', values:[-20,-2,0]},
        
        ]

    }





}