import {
    LoadingManager, Texture, Mesh, TextureLoader, SRGBColorSpace, RepeatWrapping, NearestFilter, EquirectangularReflectionMapping, AnimationMixer, ObjectSpaceNormalMap, 
} from 'three';

import { GLTFLoader } from '../jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../jsm/loaders/DRACOLoader.js';
import { FBXLoader } from '../jsm/loaders/FBXLoader.js';
import { MeshoptDecoder } from '../jsm/libs/meshopt_decoder.module.js';
import { OBJLoader } from '../jsm/loaders/OBJLoader.js';
import { STLLoader } from '../jsm/loaders/STLLoader.js';

import { RGBELoader } from '../jsm/loaders/RGBELoader.js';
import { EXRLoader } from '../jsm/loaders/EXRLoader.js';
import { KTX2Loader } from '../jsm/loaders/KTX2Loader.js';
//import { HDRJPGLoader } from '../libs/HDRJPGLoader.js';

import { LZMA } from '../libs/lzma.js';

import { GlbTool } from './utils/GlbTool.js';

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/

export const Pool = {

    manager: new LoadingManager(),
    renderer: null,

    msg:'',
    inLoad:false,

    clip:[],
    data: new Map(),
    tmp: [],

    lzma:null,
    //extraTexture: [],
    dracoLoader: null,
    //dracoLoaderType:'js',
    dracoPath:'./src/libs/draco/',
    basisPath:'./src/jsm/libs/basis/',

    maxAnisotropy:1,

    onLoad:() => {},
    onEnd:() => {},
    log: ( msg ) => {},

    materialRoot:(n) => {console.log( n )},

    setLoadEvent:( onload, onend ) => {
        Pool.onLoad = onload
        Pool.onEnd = onend
    },

    prefix:( type ) => {
        let p = ''
        switch( type ){
            case 'S': case 'sound': case 'mp3': case 'wav': case 'ogg': p = 'S_';  break;
            case 'I': case 'image': case 'jpg': case 'png': p = 'I_';  break;
            case 'E': case 'hdr': case 'env': p = 'T_';  break;
            case 'J': case 'json': p = 'J_';  break;
            case 'JS': case 'js': p = 'JS_';  break;
            case 'H':  case 'bin': case 'hex': p = 'H_';  break;
            
            case 'O': case 'object3d': p = 'O_';  break;
            case 'M': case 'material': p = 'M_';  break;
            case 'T': case 'texture': p = 'T_';  break;
        }
        return p
    },

    dispose:() => {

        Pool.data.forEach( function( node, key ) {

            if( node.isMaterial || node.isTexture ){ 
                node.dispose()
                Pool.data.delete( key )
                //console.log( key + ' is delete')
            }

            if( node.isObject3D ){
                node.traverse( function ( snode ) {
                    if ( snode.isMesh ){
                        if( snode.geometry ) snode.geometry.dispose()
                        if( snode.material ){ 
                            if(snode.material.dispose) snode.material.dispose()
                        }
                    }
                })
                Pool.data.delete( key )
            }
           

        })

        //console.log('clear extra texture !!')
        /*let i = Pool.extraTexture.length
        while(i--){
            let p = Pool.get( Pool.extraTexture[i], 'T' )
            if(p) p.dispose();
            Pool.delete( Pool.extraTexture[i], 'T' )
        }
        Pool.extraTexture = [];*/
    
    },
    
    createElementNS: ( name ) => ( document.createElementNS( 'http://www.w3.org/1999/xhtml', name ) ),
    exist: ( name, type = '' ) => ( Pool.get( name, type ) ? true : false ),
    delete: ( name, type = '' ) => ( Pool.data.delete( Pool.prefix( type ) + name ) ),
    get: ( name, type = '' ) => ( Pool.data.get( Pool.prefix( type ) + name ) ),

    set: ( name, node, type = '', direct ) => {
        if( !node ){ 
            console.log('Loading error on ' + name); 
            return; 
        }
        if( node.isMaterial ){ 
            type = 'material';
            node.name = name;
            Pool.materialRoot( node, direct );
        }
        if( node.isTexture ) type = 'texture';
        if( node.isObject3D ) type = 'object3d';
        
        if( Pool.get( name, type ) ) return
        Pool.data.set( Pool.prefix( type ) + name, node );
    },

    getScript: ( name ) => ( Pool.data.get( Pool.prefix( 'js' ) + name ) ),

    getMaterials:( obj ) => {
        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        return GlbTool.getMaterial( obj )
    },

    getGLB:( obj, multyMaterialGroup ) => {
        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        if(!obj) return console.error('Not find Model ?')
        if(multyMaterialGroup) GlbTool.getMesh( obj, multyMaterialGroup );

    
        return obj
    },

    /*getMaterialList:( obj, keepMaterial ) => {
        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        if(!obj) return console.error('Not find Model ?')
        return GlbTool.getMesh( obj, keepMaterial )
    },*/

    getMesh:( obj, multyMaterialGroup ) => {

        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        if(!obj) return console.error('Not find Model ?')
        return GlbTool.getMesh( obj, multyMaterialGroup );

    },

    getGroup:( obj, autoMesh, autoMaterial ) => {
        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        return GlbTool.getGroup( obj, autoMesh, autoMaterial )
    },

    applyMorph( modelName, meshs = null, normal = true, relative = true ){

        let model
        if( modelName.isObject3D ) model = modelName;
        else model = Pool.get( modelName, 'O' );

        if( !meshs ) meshs = Pool.getMesh( modelName );
        if( !model || !meshs ) return
        GlbTool.autoMorph( model, meshs, normal, relative );

    },

    uv2( model ){
        GlbTool.uv2( model );
    },

    symetric( model ){
        GlbTool.symetric( model );
    },

    objectSpaceNormal( model ){
        // glTF currently supports only tangent-space normal maps.
        // this model has been modified to demonstrate the use of an object-space normal map.

        model.material.normalMapType = ObjectSpaceNormalMap;

        // attribute normals are not required with an object-space normal map. remove them.
        //model.geometry.deleteAttribute( 'normal' );
        //model.geometry.deleteAttribute( 'tangent' );

        //console.log(model, model.material)
    },

    add: ( name, node, type ) => {
        Pool.set( name, node, type );
        Pool.next();
        //console.log( name, type )
    },

    getMaterial:( name ) => ( Pool.data.get( 'M_' + name ) ),

    //getMap:( name, o = {} ) => ( Pool.getTexture(name, o) ),


    //--------------------
    //   TEXTURES
    //--------------------

    texture:( o = {} ) => {

        if( !Pool.loaderMap ) Pool.loaderMap = new TextureLoader();

        let name = o.name || '';

        if( o.url ){ 
            if( o.url.lastIndexOf('.') !==-1 ) name = o.url.substring( o.url.lastIndexOf('/')+1, o.url.lastIndexOf('.') );
            else name = o.url.substring( o.url.lastIndexOf('/')+1 );
        }

        if( name.search('_c') !== -1 || name.search('_l') !== -1 || name.search('_u') !== -1|| name.search('_d') !== -1) o.srgb = true

        if( Pool.exist( name, 'texture' )) return Pool.get( name, 'texture' );
        else if( Pool.exist( name, 'image' )) {
            //console.log('preload', name )
            return Pool.getTexture( name, o );
        } else {

            return Pool.loaderMap.load( o.url, function ( t ) { 
                //console.log('use TextureLoader !!', name )
                Pool.setTextureOption( t, o );
                Pool.data.set( 'T_' + name, t );
                if( o.callback ) o.callback()
                return t
            })
        }
            
        

    },

    getTexture:( name, o = {} ) => {

        let k = o.quality ? o.quality+'k_' : ''; 
        name = k + name;

        //console.log(name)

        let t = Pool.get( name, 'texture' );
        if(!t){
            let im = Pool.get( name, 'image' )
            if(!im){ 
                //console.log('not find image', name );
                return null
            }
            t = new Texture( im );
            if( name.search('_c') !== -1 || name.search('_d') !== -1 || name.search('_l') !== -1 || name.search('_u') !== -1 ) o.srgb = true
            Pool.data.set( 'T_' + name, t );
        }
        Pool.setTextureOption( t, o );
        return t;
    },

    setTextureOption:( t, o = {} ) => {

        //if( o.colorSpace ) t.colorSpace = o.colorSpace;
        if( o.encoding ) t.colorSpace = SRGBColorSpace;
        if( o.srgb ) t.colorSpace = SRGBColorSpace;
        t.flipY = o.flipY!== undefined || o.flip !== undefined ? o.flipY : false

        if( o.anisotropy ){
            t.anisotropy = o.anisotropy === 'max' ? Pool.maxAnisotropy : o.anisotropy;
        }
           
        //if( o.anisotropy !== undefined ) t.anisotropy = o.anisotropy
        if( o.generateMipmaps !== undefined ) t.generateMipmaps = o.generateMipmaps
        if( o.repeat ){
            t.repeat.fromArray( o.repeat );
            t.wrapS = t.wrapT = RepeatWrapping;
        }

        if( o.center ) t.center.fromArray( o.center );
        if( o.offset ) t.offset.fromArray( o.offset );
        
        if( o.filter ){
            if( o.filter === 'near' ){
                t.minFilter = NearestFilter;
                t.magFilter = NearestFilter;
            }
        }

        if( o.channel ) t.channel = o.channel
        t.needsUpdate = true;

    },

    

    ///

    loadAsync: ( Urls, Path = '', msg = '' ) => {

        return new Promise((resolve, reject) => {

            Pool.waiting = true;
            Pool.load( Urls, () => { Pool.waiting = false; }, Path, msg );

            //if (!Pool.waiting) resolve()
            //Pool.load( Urls, resolve, Path, msg );

        })

    },

    ///

    load: ( Urls, Callback, Path = '', msg = '', quality = 0 ) => {

        Pool.msg = msg;

        let urls = [];
        let callback = Callback || function(){};
        let start = ( typeof performance === 'undefined' ? Date : performance ).now();

        if ( typeof Urls === 'string' || Urls instanceof String ) urls.push( Urls );
        else urls = urls.concat( Urls );

        Pool.tmp.push( { urls:urls, path:Path, callback:callback, start:start, quality:quality } );

        if( !Pool.inLoad ) Pool.loadOne();

    },

    loadOne: () => {

        Pool.inLoad = true;
        Pool.onLoad()

        let url = Pool.tmp[0].path + Pool.tmp[0].urls[0];
        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        let type = url.substring( url.lastIndexOf('.')+1 ).toLowerCase();

        if( type==='jpg' || type==='png' ) name = (Pool.tmp[0].quality ? Pool.tmp[0].quality+'k_':'') + name;

        //console.log(name)

        if( Pool.exist( name, type ) ) Pool.next();
        else Pool.loading( url, name, type );

    },

    next: () => {

        Pool.tmp[0].urls.shift();

        if( Pool.tmp[0].urls.length === 0 ){

            let end = Math.floor(( typeof performance === 'undefined' ? Date : performance ).now() - Pool.tmp[0].start);

            //if( end !== 0 ) console.log( 'pool load time:', end, 'ms' );
            
            Pool.tmp[0].callback();
            Pool.tmp.shift();

            if( Pool.tmp.length > 0 ) Pool.loadOne();
            else {
                Pool.inLoad = false;
                Pool.clearDRACO()
                Pool.onEnd()
            }

        } else {

            Pool.loadOne();

        }

    },

    loading: ( url, name, type ) => {

        Pool.log( Pool.msg )

        switch( type ){
            
            case 'glb': case 'gltf': Pool.load_GLTF( url, name );  break;
            case 'fbx': case 'FBX': Pool.load_FBX( url, name ); break;
            case 'obj': Pool.load_OBJ( url, name ); break;
            case 'stl': Pool.load_STL( url, name ); break;

            case 'ktx2': Pool.load_KTX2( url, name );  break;
            case 'hdr': Pool.load_RGBE( url, name ); break;
            case 'exr': Pool.load_EXR( url, name ); break;
            default: Pool.extand( url, name, type );
        }

    },

    extand: ( url, name, type ) => {

        if( !Pool.XHTTP ) Pool.XHTTP = new XMLHttpRequest();
        const xml = Pool.XHTTP;

        xml.open('GET', url, true );
        if(type === "json") xml.overrideMimeType( "application/json");

        switch( type ){

            case 'bin': case 'hex': case 'wasm': case 'mp3': case 'wav': case 'ogg': xml.responseType = "arraybuffer"; break;
            case 'jpg': case 'png': xml.responseType = 'blob'; break;
            case 'bvh': case 'glsl': case 'js':  case 'json': xml.responseType = 'text'; break;

        }

        xml.onreadystatechange = function () {

            if ( xml.readyState === 4 ) {
            	if (xml.status >= 300) {
                    console.log("Error, status code = " + xml.status)
                } else {
                    //console.log(xml.response)
                	Pool.direct( xml.response, name, type )
                    //Pool.add( name, JSON.parse( xhr.responseText ), 'json' )
                }
                //if ( Pool.XML.status === 200 || Pool.XML.status === 0 ) Pool.load_direct( Pool.XML.response, name, type );
                //else console.error( "Couldn't load ["+ name + "] [" + Pool.XML.status + "]" );
            }

        }

        if ('onprogress' in xml){
            xml.onprogress = function(e) {
                //console.log( parseInt((e.loaded / e.total) * 100) );
            }
        }

        xml.send(null);

    },

    direct: ( response, name, type ) => {

        switch( type ){
        	case 'jpg': case 'png':
                let img = Pool.createElementNS('img');
                img.onload = function(e) {
                    window.URL.revokeObjectURL( img.src ); // Clean up after yourself.
                    Pool.add( name, img, 'image' );
                }
                img.src = window.URL.createObjectURL( response );

        	    /*let img = Pool.createElementNS('img');
	            img.src = window.URL.createObjectURL( new Blob([response]) );
                //img.onload = function(){
                    console.log(img)
                    Pool.add( name, img, 'image' );
                //}*/
        	break;
            case 'mp3': case 'wav': case 'ogg':
                AudioContext.getContext().decodeAudioData(
                    response.slice( 0 ),
                    function( buffer ){ Pool.add( name, buffer, 'sound' ); },
                    function( error ){ console.error('decodeAudioData error', error); }
                );
            break;
            case 'hex': case 'bin': LZMA.decompress( response, ( result ) => { Pool.add( name, result, type ) }); break;
            case 'wasm': Pool.add( name, new Uint8Array( response ), type ); break;
            case 'json': Pool.add( name, JSON.parse( response ), type ); break;
            case 'js': Pool.add( name, response, type ); break;
            default: Pool.add( name, response, type );

        }

    },

    //////////////////////////////////

    clearDRACO: () => {

        if( Pool.dracoLoader ){
            Pool.dracoLoader.dispose();
            Pool.dracoLoader = null;
        }

        if( Pool.GLTF ){
            Pool.GLTF = null;
        }

    },

    loaderDRACO: () => {

        if( Pool.dracoLoader ) return Pool.dracoLoader

        if( !Pool.dracoLoaderType ){
            if ( navigator.userAgentData ) Pool.dracoLoaderType = 'wasm'
            else {
                let ua = navigator.userAgent.toLowerCase()
                Pool.dracoLoaderType = (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) ? 'js' : 'wasm'
            }

            //console.log(Pool.dracoLoaderType)
        }

        

        Pool.dracoLoader = new DRACOLoader().setDecoderPath( Pool.dracoPath )
        //Pool.dracoLoader.setWorkerLimit(1)
        Pool.dracoLoader.setDecoderConfig( { type: Pool.dracoLoaderType } )
        return Pool.dracoLoader

    },

    loaderKTX2: () => {

        if( !Pool.KTX2 ){
            Pool.KTX2 = new KTX2Loader( Pool.manager )
                .setTranscoderPath( Pool.basisPath )
                .detectSupport( Pool.renderer )
        }
        return Pool.KTX2

    },

    loaderGLTF: () => {

        if( !Pool.GLTF ){
            Pool.GLTF = new GLTFLoader( Pool.manager )
            .setCrossOrigin('anonymous')
            .setDRACOLoader( Pool.loaderDRACO() )
            .setKTX2Loader( Pool.loaderKTX2() )
            .setMeshoptDecoder( MeshoptDecoder )
        }
        return Pool.GLTF

    },

    loaderFBX: () => {

        if( !Pool.FBX ) Pool.FBX = new FBXLoader( Pool.manager )
        return Pool.FBX

    },

    loaderSTL: () => {

        if( !Pool.STL ) Pool.STL = new STLLoader( Pool.manager )
        return Pool.STL

    },

    loaderOBJ: () => {

        if( !Pool.OBJ ) Pool.OBJ = new OBJLoader( Pool.manager )
        return Pool.OBJ

    },

    loaderRGBE: () => {

        if( !Pool.RGBE ) Pool.RGBE = new RGBELoader( Pool.manager )
        return Pool.RGBE

    },

    loaderEXR: () => {

        if( !Pool.EXR ) Pool.EXR = new EXRLoader( Pool.manager )
        return Pool.EXR

    },

    //////////////////////////////////

    load_GLTF: ( url, name ) => {

        /*Pool.loaderGLTF().setDRACOLoader( Pool.loaderDRACO() ).load( url, function ( gltf ) { 
            Pool.add( name, gltf.scene )
            Pool.dracoLoader.dispose()
        })*/

        Pool.loaderGLTF().load( url, function ( gltf ) {

            const model = gltf.scene;

            //console.log(gltf.animations)

            if( gltf.animations ){ 
                const animations = gltf.animations
                const mixer = new AnimationMixer( gltf.scene )
                model.mixer = mixer
                model.actions = {}
                for ( let i = 0; i < animations.length; i ++ ) {
                    let anim = animations[ i ];
                    model.actions[ anim.name ] = mixer.clipAction( anim );
                    //model.actions[ anim.name ].play()
                }

                model.play = (name) => {
                    if(model.actions[ name ]){ 
                        model.actions[ name ].paused = false
                        model.actions[ name ].time = 0;
                        model.actions[ name ].play()
                    }
                }
                model.pause = (name, v=true) => {
                    if(model.actions[ name ]) model.actions[ name ].paused = v
                }
            }
            
            Pool.add( name, model )
            //Pool.clearDRACO()
        })

    },

    load_FBX: ( url, name ) => {

        Pool.loaderFBX().load( url, function ( node ) { Pool.add( name, node ) })

    },

    load_OBJ: ( url, name ) => {

        Pool.loaderOBJ().load( url, function ( node ) { Pool.add( name, node ) })

    },

    load_STL: ( url, name ) => {

        Pool.loaderSTL().load( url, function ( node ) { 
            let object = new Mesh( node );
            Pool.add( name, object ) 
        })

    },

    load_KTX2: ( url, name, cb ) => {

        Pool.loaderKTX2().load( url, function ( texture ) {
            Pool.add( name, texture ) 
            //console.log(texture)
            //if(cb) cb(texture)
            return texture
        })

    },

    load_RGBE: ( url, name ) => {

        Pool.loaderRGBE().load( url, function ( texture ) {
            texture.mapping = EquirectangularReflectionMapping; 
            Pool.add( name, texture ) 
        })

    },

    load_EXR: ( url, name, cb ) => {

        Pool.loaderEXR().load( url, function ( texture ) {
            //Pool.add( name, texture ) 
            //console.log(texture)
            if(cb) cb(texture)
            return texture
        })

    },

    direct_EXR: ( data, name ) => {

        Pool.loaderEXR().parse( url, function ( texture ) {
            Pool.add( name, texture )
            return texture
        })

    },

}