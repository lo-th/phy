import {
	TextureLoader, sRGBEncoding, RepeatWrapping,
	NearestFilter, AudioContext, SphereGeometry,
	PlaneGeometry, BoxGeometry, Mesh, 
} from 'three';
import { mergeBufferGeometries } from '../jsm/utils/BufferGeometryUtils.js'

import { GLTFLoader } from '../jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '../jsm/loaders/DRACOLoader.js';
import { LzmaUnpack } from './LzmaUnpack.js';

/** __
*    _)_|_|_
*   __) |_| | 2022
* @author lo.th / https://github.com/lo-th
*/

const tmp = []
let data = {}
const geo = {}
//const materials = {}

let idm = 0
let loaderMap = null
let loaderGLTF = null
let loader = null
let inLoad = false
let extraMaterial = null

export class Pool {

	static dispose() {

		let m 
		for( const key in data ){

			if( data[key].isGroup ){
				data[key].traverse( function ( child ) {
					if ( child.isMesh ){ 
						if( child.geometry ) child.geometry.dispose()
						if( child.material ) child.material.dispose()
					}
				})
			}

		}

		data = {}

	}

	static setExtraMaterial( f ) {
		return extraMaterial = f
	}

	// --------------------------
	//   GET
	// --------------------------

	static getScript( name, o = {} ) {
		return this.get( name+'_js' , o )
	}

	static getCompactScript( name ) {

		let n = document.createElement("script");
        n.type = "text/javascript";
                    //n.async = true;
        n.charset = "utf-8";
        n.text = this.get( name );
        document.getElementsByTagName('head')[0].appendChild(n);

	}

	static get( name, o = {} ) {

		if( !data[ name ] ) console.error('data of ' + name + ' not find in pool !! ');
        return data[ name ];

	}

	static getSound( name, o = {} ) {

		if( !data[ 'S_' + name ] ){ 
			console.error('sound of ' + name + ' not find in pool !! ');
			return null;
		}

		let s = data[ 'S_' + name ];

		return s;

	}

	/*static getGeo( name ) {

		if( !geo[ name ] ){

			if( name === 'sphere' ) geo[ name ] = new SphereGeometry(1, 16, 12);
			if( name === 'box' ) geo[ name ] = new BoxGeometry(1, 1, 1);
			if( name === 'plane' ) geo[ name ] = new PlaneGeometry(1, 1);

		};
        return geo[ name ];

	}*/


	// --------------------------
	//   TEXTURE POOL
	// --------------------------

	static directTexture( url, o = {} ) {
	
		if( loaderMap === null ) loaderMap = new TextureLoader();

		let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );

		if( data[ 'T_' + name ] ) return this.getMap( name, o );
			
		return loaderMap.load( url, function ( txt ) { 
			
			data[ 'T_' + name ] = txt;
			return this.getMap( name, o )
			
		}.bind(this))
	
	}

	static getMap( name, o = {} ) {

		if( !data[ 'T_' + name ] ){ 
			console.error('texture of ' + name + ' not find in pool !! ');
			return null;
		}

		let t = data[ 'T_' + name ];

		if( o.encoding ) t.encoding = sRGBEncoding;

		t.flipY = o.flip !== undefined ? o.flip : false;

		if( o.anisotropy !== undefined ) t.anisotropy = o.anisotropy;
		if( o.generateMipmaps !== undefined ) t.generateMipmaps = o.generateMipmaps;

		if( o.repeat ){
			t.repeat.fromArray( o.repeat );
            t.wrapS = RepeatWrapping;
            t.wrapT = RepeatWrapping;
		}

		if( o.filter ){
			if( o.filter === 'near' ){
				t.minFilter = NearestFilter;
				t.magFilter = NearestFilter;
			}
		}

		if( o.callback ) o.callback()

		return t;

	}


	// --------------------------
	//   MATERIAL POOL
	// --------------------------

	/*static getMaterial( name ) {
	
		return materials[name] || null;
	
	}

	static setMaterial( m ) {

		let name = m.name;
		if( !name ) name = 'material_noName_' + idm++;

		if( !materials[name] ) materials[name] = m;

		return materials[name];

	}*/


	// --------------------------
	//   LOAD
	// --------------------------

	static load( Urls, Callback ) {

		let urls = [];
		let callback = Callback || function(){};
		let start = ( typeof performance === 'undefined' ? Date : performance ).now();

        if ( typeof Urls === 'string' || Urls instanceof String ) urls.push( Urls );
        else urls = urls.concat( Urls );

        tmp.push( { urls:urls, callback:callback, start:start } );

        if( !inLoad ) Pool.loadOne();

	}

	static loadOne () {

		inLoad = true;

		let url = tmp[0].urls[0];
        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        let type = url.substring( url.lastIndexOf('.')+1 ).toLowerCase();

        if( Pool.exist( name, type ) ) Pool.next();
        else Pool.loading( url, name, type );

	}

	static exist( name, type ) {

		var ex = false;
		let prefix = '';

		switch( type ){

			case 'mp3': case 'wav': case 'ogg': prefix = 'S_';  break;
			case 'jpg': case 'png': prefix = 'T_';  break;

		}

		return data[ prefix + name ] ? true : false;

	}

	static next() {

		tmp[0].urls.shift();

		if( tmp[0].urls.length === 0 ){

			let end = Math.floor(( typeof performance === 'undefined' ? Date : performance ).now() - tmp[0].start);

			//if( end !== 0 ) console.log( 'pool load time:', end, 'ms' );
			
			tmp[0].callback();

            tmp.shift();

            if( tmp.length > 0 ) Pool.loadOne();
            else inLoad = false;

        } else {

            Pool.loadOne();

        }

	}

	static loading( url, name, type ) {

		switch( type ){

			 case 'glb': case 'gltf': Pool.load_GLTF( url, name );  break;
			 case 'jpg': case 'png': Pool.load_MAP( url, name );  break;
			 case 'fbx': Pool.load_FBX( url, name );  break;
			 default: Pool.loadingExtand( url, name, type );

		}

	}

	static loadingExtand( url, name, type ) {

		if( loader === null ) loader = new XMLHttpRequest();

		loader.open('GET', url, true );

        loader.overrideMimeType( type === "json" ?  "application/json" : "text/xml" );

        switch( type ){

            case 'hex': case 'wasm': case 'mp3': case 'wav': case 'ogg': loader.responseType = "arraybuffer"; break;
            case 'bvh': case 'glsl': case 'js': loader.responseType = 'text'; break;

        }

        loader.onreadystatechange = function () {

        	if ( loader.readyState === 4 ) {
                if ( loader.status === 200 || loader.status === 0 ) Pool.load_direct( loader.response, name, type );
                else console.error( "Couldn't load ["+ name + "] [" + loader.status + "]" );
            }

        }

        loader.send( null );

	}

	static load_direct( response, name, type ){

		switch( type ){

			case 'mp3': case 'wav': case 'ogg':

                AudioContext.getContext().decodeAudioData(
                    response.slice( 0 ),
                    function( buffer ){ Pool.set( 'S_' + name, buffer ); },
                    function( error ){ console.error('decodeAudioData error', error); }
                );

            break;

            case 'hex': LzmaUnpack.parse( response, function ( result ) { Pool.set( name, result ); }); break;
            case 'json': Pool.set( name, JSON.parse( response ) ); break;
            case 'wasm': Pool.set( name, new Uint8Array( response ) ); break;
            case 'js': Pool.set( name+'_js', response ); break;
            default: Pool.set( name, response );

		}

	}

	static set( name, res ) {

		data[ name ] = res;
		Pool.next();

	}

	static load_MAP( url, name ) {

		if( loaderMap === null ) loaderMap = new TextureLoader();
		loaderMap.load( url, function ( txt ) { Pool.set( 'T_' + name , txt ); })

	}

	static load_FBX() {

	}

	static load_GLTF( url, name ) {

		if( loaderGLTF === null ){ // init Loader

			loaderGLTF = new GLTFLoader();//.setPath( './' );

			let dracoLoader = new DRACOLoader().setDecoderPath( './src/libs/draco/' );

			let ua, type

			if ( navigator.userAgentData ) {

				//console.log( navigator.userAgentData )

				type = 'wasm'
			  // use new hints
			} else {
			  // fall back to user-agent string parsing
			  ua = navigator.userAgent.toLowerCase()
			  type = (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) ? 'js' : 'wasm'

			}

			
			dracoLoader.setDecoderConfig( { type: type } );

			loaderGLTF.setDRACOLoader( dracoLoader );
            //loaderGLTF.setDDSLoader( new DDSLoader() );

		}

		loaderGLTF.load( url, function ( gltf ) { 

			if( extraMaterial !== null ) {
				// modify base shader
				gltf.scene.traverse( function ( node ) {
					if( node.isMesh ) extraMaterial( node.material )
				})
			}
			//console.log(gltf.scene)
			Pool.set( name, gltf.scene )
		})

	}


	// --------------------------
	//   GEOMETRY
	// --------------------------

	static symetric( g, cloneUV2 = true ) {

		if( g.isMesh ) g = g.geometry;

        let uv = g.attributes.uv.array;
        let i = uv.length*0.5;

        while( i-- ){
        	if( uv[i*2] < 0 ) uv[i*2]*=-1;
        }
        g.attributes.uv.needsUpdate = true;

        // for ao map
        if( cloneUV2 ) g.setAttribute( 'uv2', g.attributes.uv );

    }


	// --------------------------
	//   MESH
	// --------------------------

	static getMesh( obj ) {

		if( typeof obj === 'string' ) obj = data[obj];

		let meshs = {};

		obj.traverse( function ( child ) {

			if ( child.isMesh ) meshs[ child.name ] = child;

		})

		return meshs;

	}

	static getGroup( obj ) {

		if( typeof obj === 'string' ) obj = data[obj];

		let meshs = {};

		obj.traverse( function ( child ) {

			if ( child.isGroup ) meshs[ child.name ] = child;

		})

		return meshs;

	}

	/**
	*  autoGroup
	*  pack group material to single mesh 
	*/

	static autoGroup( scene, name ) {

    	const del = []
    	const model = {} 

    	scene.traverse( function ( child ) { 

    		/*if( child.isMesh && child.name ) {
    			if( child.material ){
    				child.material.dispose()
    				child.position.set(0,0,0)
    				child.material = root.tmpMat
    			}

    			model[ child.name ] = child
    			
    		}*/
			
			if( child.isGroup && child.name ){ 

				if( child.children[0].name !== (child.name + '_1') ) return

				let group = child, g = []
				let lng = group.children.length
				let mat = []
				for( let i = 0; i<lng; i++ ){
					group.children[i].material.dispose()
					group.children[i].material = null
					g[i] = group.children[i].geometry
					g[i].clearGroups()
					g[i].addGroup( 0, Infinity, i )
					//mat.push( root.tmpMat )
				}

				let mesh = new THREE.Mesh( new mergeBufferGeometries( g, true ), mat )
				mesh.name = child.name
				scene.add( mesh )
				del.push( group )

				//model[ mesh.name ] = mesh
				 
			}

		})

		let j = del.length
		while(j--){
			scene.remove( del[j] )
		}

		//root.tmpGroup.add( scene )
		//models[name] = model

    }


	/**
	*  autMorph
	*  morph naming convention is : [ target name ][ '__morph__' ][ morph name ]
	*/

	static autoMorph( meshName, fullAttribute ) { 

		let m, name, tName, target, id, g;

		// get mesh list
		let meshs = Pool.getMesh( meshName );

		
		for( let n in meshs ){

			m = meshs[n];
			name = m.name;

			if( name.search("__morph__") !== -1  ) {

				target = meshs[ name.substring( 0, name.indexOf('__') ) ];
				tName = name.substring( name.lastIndexOf('__') + 2 );

				// apply Morph

				if( target ){

					if( !target.userData.morph ){
						target.userData['morph'] = {};
						target.material.morphTargets = true;
					}

					g = target.geometry;

					//console.log( g.attributes.position.count, m.geometry.attributes.position.count )

					if( g.attributes.position.count === m.geometry.attributes.position.count ){

						if( !g.morphAttributes.position ) g.morphAttributes.position = [];
						id = g.morphAttributes.position.length;
						g.morphAttributes.position.push( m.geometry.attributes.position );

						// extra attribute

						if( fullAttribute ){

							for( let a in  m.geometry.attributes ){
								if( a !== 'position' && g.attributes[a] ){
									if( !g.morphAttributes[a] ) g.morphAttributes[a] = [];
									g.morphAttributes[a][id] = m.geometry.attributes[a];
								}
							}

						}

						// clear morph mesh
					    m.parent.remove( m );
					    m.material.dispose();
						m.geometry.dispose();

						// update target
						target.updateMorphTargets();

						// add morph reference by name
						target.userData.morph[ tName ] = id;

					} else {

						console.warn('this morph target is not good : ', tName)

					}

				}

			}

		}


	}





}