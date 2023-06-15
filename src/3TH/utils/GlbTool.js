import {
	Float32BufferAttribute
} from 'three';

import { Shader } from '../Shader.js'
import { mergeGeometries } from '../../jsm/utils/BufferGeometryUtils.js';

export const GlbTool = {

	getMesh:( scene, keepMaterial ) => {
        let meshs = {};
        //if( keepMaterial ) GlbTool.keepMaterial( scene )
        scene.traverse( ( child ) => {
            if ( child.isMesh ) meshs[ child.name ] = child;
        })
        return meshs;
    },

    keepMaterial: ( scene ) => {

        let Mats = {}, m 

        scene.traverse( ( child ) => {
            if ( child.isMesh ){ 
                m = child.material;
                if( !Mats[m.name] ){
                    Shader.add( m );
                    //console.log(m.name)
                    Mats[m.name] = true;
                }
            }
        })

    },

    getGroup:( scene, autoMesh, autoMaterial ) => {
        const groups = {};
        let mats = null
        if( autoMaterial ) mats = GlbTool.getMaterial( scene, true ) 
        scene.traverse( ( child ) => {
            if ( child.isGroup ){ 
            	//if( autoMaterial ) mats = GlbTool.getMaterial( scene, true ) 
            	groups[ child.name ] = autoMesh ? GlbTool.groupToMesh(child, mats) : child;
            }
        })
        return groups;
    },

    // Material should be name like 
    // 0_concret
    // 10_silver ...

    getMaterial:( scene, toArray ) => {
    	const Mats = {}
        const mats = [] 
        let m, n
        scene.traverse( ( child ) => {
            if ( child.isMesh ){ 
            	m = child.material;
            	if( !Mats[m.name] ){
            		Shader.add( m );
            		Mats[m.name] = m;
            		n = Number( m.name.substring( 0, m.name.lastIndexOf('_') )  )
            		mats[n] = m
            	}
            }
        })
        return toArray ? mats : Mats;
    },

    groupToMesh: ( group, autoMaterial ) => {

    	if( group.children[0].name !== (group.name + '_1') ) return group
    	if( !group.children[0].isMesh ) return group

    	let g = []
		let lng = group.children.length, n = 0, mName

		for( let i = 0; i<lng; i++ ){

			mName = group.children[i].material.name;
		
			n = Number( mName.substring( 0, mName.lastIndexOf('_') )  )
			group.children[i].material.dispose()

			g[i] = group.children[i].geometry
			g[i].forceMatId = n;
		}

		let mesh = new THREE.Mesh( new mergeGeometries( g, true ), autoMaterial )
		mesh.name = group.name

		return mesh

    },

    symetric: ( g ) => {

		if( g.isMesh ) g = g.geometry;

        let uv = g.attributes.uv.array;
        let i = uv.length*0.5;

        while( i-- ){
        	if( uv[i*2] < 0 ) uv[i*2]*=-1;
        }
        g.attributes.uv.needsUpdate = true;

    },

    uv2: ( g ) => {

		if( g.isMesh ) g = g.geometry;
        g.setAttribute( 'uv2', g.attributes.uv );

    },


    autoMorph: ( mod, meshs, normal = true, relative = false ) => {

    	let morph = {};
    	let tmpMesh = [];
        mod.traverse( ( node ) => { 
            if ( node.isMesh && node.name.search('__M__') !== -1){ 
            	morph[ node.name ] = node.geometry;
            	tmpMesh.push(node)
            }
        })

		let oName, tName, target, id, g, gm, j, dp, dn, ar, m;
		

		for ( let name in morph ){

			oName = name.substring( 0, name.indexOf('__') )
            tName = name.substring( name.lastIndexOf('__') + 2 );

            target = meshs[ oName ];

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
                        /*if( relative ){
                            j = gm.attributes.normal.length;
                            ar = [];
                            while(j--) ar[j] = gm.attributes.normal.array[j] - g.attributes.normal.array[j]
                            dn = new Float32BufferAttribute( ar, 3 );
                        } else {
                            dn = new Float32BufferAttribute( gm.attributes.normal.array, 3 );
                        }*/

                        dn = new Float32BufferAttribute( gm.attributes.normal.array, 3 );

                        g.morphAttributes.normal.push( dn );

                    }

                    target.morphTargetInfluences.push(0)
                    target.morphTargetDictionary[ tName ] = id;

                    /*if( !target.morph ) {
                        target.morph = function ( name, value ){
                            //console.log(this.morphTargetInfluences)
                            if(!this.morphTargetInfluences) return
                            if(this.morphTargetDictionary[name] === undefined ) return
                            this.morphTargetInfluences[ this.morphTargetDictionary[name] ] = value;
                        }

                        
                    }*/
                    //console.log( target.name + ' have morph call '+ tName )

				} else {
					console.warn( 'Morph '+ tName + ' target is no good on ' + target.name )
				}

			}

		}

		morph = {}

		// claer garbege
		j = tmpMesh.length
		while(j--){
            m = tmpMesh[j]
			if( m.parent ) m.parent.remove( m );
			if( m.material ) m.material.dispose()
			if( m.geometry ) m.geometry.dispose()
		}

	},


}
