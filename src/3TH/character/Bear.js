
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
    
}

export const Bear = {

	isBreath:false,
	isEyeMove:false,
	haveMorph:false,
    
    skeletonRef:'Bear',
	fullMorph: [],

	//haveQuality: true,
    //textureQuality:0,
    textureRef:'',
    texturePath: 'assets/textures/',
    textures: [],

    modelPath: 'assets/models/',
    forceModel: null,

    setting:setting,

    materialRef:'skin_low',
    materials:{
        skin_low:{
            type:'Standard',
            envMapIntensity:1.0,
            roughness:0.22,
            metalness:0.0,
            vertexColors:false,
        },

    },

    changeMaterial:( sx = {}, def = false ) => {

        if( !Pool.getMaterial( Bear.materialRef ) ) return

        const defMat = Bear.materials;
        let m;

        for(let key in defMat){
            m = Pool.getMaterial( key );
            for(let v in sx){
                if( m[v] !== undefined ){ 
                    if( def && defMat[key][v] ) m[v] = defMat[key][v];
                    else m[v] = sx[v];
                }
            }
        }

    },

    
    applyMaterial:( root, model ) => {

        // apply Material

        const def = Pool.getMaterial( Bear.materialRef );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
                switch( node.name ){
                    case 'Bear':
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
                    
                }
            }

        })

    },

    adjustment:() => {

        return [
        /*{name:'neck', values:[-5,0,0]},
        {name:'chest', values:[5,0,0]},
        {name:'lCollar', values:[0,0,-10]},
        {name:'rCollar', values:[0,0,10]},
        {name:'lShldr', values:[-20,2,0]},
        {name:'rShldr', values:[-20,-2,0]},*/
        
        ]

    }





}