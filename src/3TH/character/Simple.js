
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
    normal:0.3,
    
}

export const Simple = {

	isBreath:false,
	isEyeMove:false,
	haveMorph:true,
    
    skeletonRef:'body_low',
	fullMorph: ['MUSCLE', 'LOW', 'BIG'],//, 'MONSTER'

	//haveQuality: true,
    textureQuality:1,
    textureRef:'avatar_c',
    texturePath: 'assets/textures/avatar_',
    textures: ['avatar_c.jpg', 'avatar_n.jpg'],

    modelPath: 'assets/models/avatar/',
    forceModel: null,

    setting:setting,

    materialRef:'skin_low',
    materials:{
        skin_low:{
            //color:0xE24C00,
            type:'Physical',
            map: 'avatar_c',
            
            normalMap: 'avatar_n',
            //metalnessMap:'avatar_c',
            normalScale: new Vector2( setting.normal, -setting.normal),
            //normalMapType: ObjectSpaceNormalMap,
            //normalMapType:TangentSpaceNormalMap,
            envMapIntensity:0.3,
            roughness:0.54,
            metalness:0.14,
            reflectivity:0.05,
            wireframe:setting.wireframe,
            vertexColors:false,
            /*sheen:1.0,
            sheenColor:0x692000,
            sheenRoughness:0.5,**/
            //side:DoubleSide,
            
            
        },

    },

    changeMaterial:( sx = {}, def = false ) => {

        if( !Pool.getMaterial( Simple.materialRef ) ) return

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

        const def = Pool.getMaterial( Simple.materialRef );

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