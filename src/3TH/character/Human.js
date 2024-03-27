
import {
	Object3D, Group, Mesh, SkinnedMesh, Texture,
    Matrix4, Quaternion, Euler, Vector3, Vector2,
    SphereGeometry, SkeletonHelper,
    MeshStandardMaterial, MeshLambertMaterial, MeshPhongMaterial, MeshBasicMaterial,MeshPhysicalMaterial,
    TextureLoader,AnimationMixer,
    FrontSide, BackSide, DoubleSide, Color, ShaderChunk, 
    VectorKeyframeTrack, QuaternionKeyframeTrack, AnimationClip, Skeleton,
    Float32BufferAttribute, EquirectangularReflectionMapping, AdditiveBlending,
    CustomBlending,
    ZeroFactor,
    SrcAlphaFactor,
} from 'three';
import { Pool } from '../Pool.js';

const setting = {

    mixRatio:0.0,
    threshold:0.1,
    normal:0.25,
    hair:0x752002,//0xa43412,
    bow:0x100402,
    sheen:1,//2.25,
    sheenRoughness:1.0,//1.0,
    metalness:0.6,
    roughness:0.4,
    
    vertexColors:false,
    alphaTest:0.1,//0.3,
    h_metal:0.0,//0.4,
    h_rough:0.5,//0.6,
    clearcoat:1.0,

    wireframe:false,
    transparent:false,
    opacity:1.0,
    
}

export const Human = {

    refSize:1.81,

	isBreath:false,
	isEyeMove:false,
	
    haveHair:true,
    haveBlink:true,

    haveMorph:true,
    morphNormal:false,
    morphRelative:false,

    haveLOD:true,

    levelHigh:['body', 'Head', 'crane', 'eyelash', 'eyebrow', 'tear', 'eye_l', 'eye_r', 'eye_l_s', 'eye_r_s'],
    levelHair:['hair', 'hair_man'],
    levelLow:['body_low'],

    skeletonRef:'body',
	fullMorph: ['MUSCLE', 'LOW', 'BIG','MONSTER'],//, 

    textureQuality:1,
	textureRef:'avatar_c',
	texturePath: 'assets/textures/avatar_',
	textures: [
        'avatar_c.jpg', 'avatar_n.jpg', 'avatar_t.jpg',//'avatar_m.jpg', 'avatar_r.jpg', 'avatar_u.jpg',
        'mouth_c.jpg', 'mouth_a.jpg', 'mouth_n.jpg', 
        'eye_c.jpg', 'eye_n.jpg', 'hair.jpg', 'hair_a.jpg',
        'eyelash_c.jpg', 'eyelash_a.jpg', 'eyelash_n.jpg',
        'hair_man.jpg', 'hair_man_a.jpg', 'avatar_ao.jpg',
    ],

    modelPath: 'assets/models/avatar/',
    forceModel: null,

    setting:setting,

    materialRef:'skin',

    materials:{
        skin:{
            type:'Sss',
            map: 'avatar_c', 
            normalMap:'avatar_n',

            //envMapIntensity:0.7,
            //reflectivity:1.0,

            roughness:0.54,
            metalness:0.14,
            
            /*roughness:1,
            metalness:1,
            metalnessMap:'avatar_m',
            roughnessMap:'avatar_r',*/

            normalScale: new Vector2( setting.normal, -setting.normal ),
            
            /*sheen:setting.sheen,
            sheenColor:0xFFFFFF,
            sheenRoughness:setting.sheenRoughness,
            sheenColorMap:'avatar_c',
            /*sheenColor:0xff0000,
            sheenColorMap:'avatar_u',
            iridescence:0.1,*/
            wireframe:setting.wireframe,

            aoMap:'avatar_ao',
            aoMapIntensity:1.0,

            //ior:1.4,
            vertexColors:false,

            sssMap:'avatar_t',
            sssColor:new Color( 0xee2323 ),
            sssAmbient:0.5,
            sssDistortion:0.6,
            sssAttenuation:0.1,
            sssScale:6.0
            
        },
    	mouth:{
            type:'Standard',
    		map:'mouth_c',
            roughness:0.02,
            metalness:0.0,
            vertexColors:false,
            //shadowSide: BackSide,
            //roughness:0.6,
            //metalness:0.6,
            alphaMap:'mouth_a',
            alphaTest:0.5,
            normalMap:'mouth_n',
            normalScale: new Vector2( 0.5, -0.5 ),
    	},
    	sub_eye:{
            type:'Physical',
            roughness:0,//0.568,
            metalness:1,
            ior:1.376,
            opacity:0.1,
           //blending:AdditiveBlending,
            clearcoat:1,
            transparent:true,
            //envMapIntensity:0,
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
        	//map:'hair',
            color:setting.hair,
            aoMap:'hair',
            metalnessMap:'hair',
            //bumpScale:-5,
            roughness:0.6,//setting.h_rough,
            metalness:1.0,//setting.h_metal,
            alphaMap:'hair_a',
            //alphaTest:setting.alphaTest,
            side: DoubleSide,
            emissive:setting.hair,
            emissiveIntensity:0.5,
            //opacity:1.0,
            transparent:true,
            blending:CustomBlending,
            blendDst:ZeroFactor,
            blendDstAlpha:SrcAlphaFactor,
            //forceSinglePass:true,
            //alphaHash:true,
            //premultipliedAlpha:true,
            alphaToCoverage:true,
        },
        hair_man:{
            type:'Standard',
            color:setting.hair,
        	//map:'hair_man',
            aoMap:'hair_man',
            metalnessMap:'hair_man',
            roughness:0.6,
            metalness:1.0,//setting.h_metal,
            alphaMap:'hair_man_a',
            side: DoubleSide,

            //alphaTest:setting.alphaTest,
            
            //opacity:1.0,
            //emissive:setting.hair,
            //emissiveIntensity:0.5,
            //sheen:1.0,
            //sheenColor:setting.hair,
            //sheenRoughness:1.0,
            transparent:true,
            blending:CustomBlending,
            blendDst:ZeroFactor,
            blendDstAlpha:SrcAlphaFactor,
            forceSinglePass:true,
            //alphaHash:true,
            //premultipliedAlpha:true,
            alphaToCoverage:true,
        },
        eyelash:{
            type:'Standard',
        	color:setting.hair,
            map:'eyelash_c',
            //roughness:setting.h_rough,
           // metalness:setting.h_metal,
            alphaMap:'eyelash_a',
            //alphaTest:setting.alphaTest,
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
            type:'Standard',
        	map:'eyelash_c',
            roughness:0.0,
            metalness:1.0,
            alphaMap:'eyelash_a',
            transparent:true,
            alphaToCoverage:true,
            opacity:1,
        },
        low:{
            type:'Basic',
        	//color:0x000000,
            //wireframe: true,
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


    },

    

    applyMaterial:( root, model ) => {

        // apply Material



        const startHigh = true;//!Human.haveLOD;
        //console.log(startHigh, Human.haveLOD)

        const def = Pool.getMaterial( 'skin' );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
                switch( node.name ){
                    case 'body':
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    node.visible = startHigh
                    break;
                    case 'body_low': 
                        node.material = def;
                        node.receiveShadow = true;
                        node.castShadow = true;
                        node.visible = !startHigh
                    break;
                    case 'Head': 
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    node.visible = startHigh
                    break;
                    case 'crane': 
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = false;
                    node.visible = startHigh ? !Human.haveHair:false;//startHigh
                    break;
                    case 'mouth':
                    node.material = Pool.getMaterial( 'mouth' ) || def;
                    node.receiveShadow = true;
                    node.castShadow = false;
                    node.visible = startHigh;
                    // correct bad light
                    node.geometry.computeVertexNormals()
                    break;
                    case 'eyelash':  case 'eyebrow':
                    node.material = Pool.getMaterial( 'eyelash' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    node.visible = startHigh
                    break;
                    case 'tear': 
                    node.material = Pool.getMaterial( 'tear' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    node.visible = startHigh
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
                    node.visible = startHigh
                    break;
                    case 'hair': 
                    node.material = Pool.getMaterial( 'hair' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;//true;
                    //node.matrixWorldAutoUpdate = false
                    node.visible = Human.haveHair ? startHigh : false;
                    break;
                    case 'hair_man': 
                    node.material = Pool.getMaterial( 'hair_man' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;//true;
                    //node.matrixWorldAutoUpdate = false
                    node.visible = Human.haveHair ? startHigh : false;
                    break;
                }
            }

        })

    },

    /*lowMode:( b ) => {

        if(b){
            setVisible()
        }


    },*/

    adjustment:() => {

        //return []

        return [
        //{name:'head', values:[-10,0,0]},
        {name:'neck', values:[-5,0,0]},
        {name:'chest', values:[5,0,0]},
        
        {name:'lCollar', values:[0,0,-10]},
        {name:'rCollar', values:[0,0,10]},

        {name:'lShldr', values:[-20,2,5]},
        {name:'rShldr', values:[-20,-2,-5]},

        //{name:'lShldr', values:[-5,2,0]},
        //{name:'rShldr', values:[-5,-2,0]},

        {name:'lForeArm', values:[0,0,10]},
        {name:'rForeArm', values:[0,0,-10]},

        {name:'lHand', values:[0,15,10]},
        {name:'rHand', values:[0,-15,-10]},
        //{name:'lThumb1', values:[0,-15,0]},
        //{name:'rThumb1', values:[0,15,0]},
        {name:'lThumb2', values:[0,25,10]},
        {name:'rThumb2', values:[0,-25,-10]},
        ]

    }





}