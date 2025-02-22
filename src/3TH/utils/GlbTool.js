import {
	Float32BufferAttribute
} from 'three';

import { Shader } from '../Shader.js'
import { mergeGeometries } from '../../jsm/utils/BufferGeometryUtils.js';

export const GlbTool = {

	getMesh:( scene, multyMaterialGroup ) => {
        let meshs = {};

 

        if( multyMaterialGroup ){

            let oldGroup = []
            let nMesh = []
            let tmpMesh = {}
            let groupName = []
            scene.traverse( ( child ) => {
                if ( child.isGroup ){ 
                    let m = GlbTool.groupToMesh(child);

                    if(m){
                        oldGroup.push(child);
                        groupName.push( child.name )

                        m.applyMatrix4(child.matrix)
                        /*m.position.copy(child.position)
                        m.quaternion.copy(child.quaternion)
                        m.scale.copy(child.scale)*/
                        nMesh.push(m);

                        tmpMesh[m.name] = nMesh;
                    }
                }
            })

            // remove old group and add remplace mesh
            let i = oldGroup.length, p, name
            while(i--){
                p = oldGroup[i].parent;
                name = p.name

                p.remove(oldGroup[i]);

                if(groupName.indexOf(name)!==-1) p = tmpMesh[name];
                
                p.add(nMesh[i]);

            }

        }
        //if( keepMaterial ) GlbTool.keepMaterial( scene )
        scene.traverse( ( child ) => {
            if ( child.isMesh ) meshs[ child.name ] = child;
        })
        return meshs;
    },

    /*keepMaterial: ( scene ) => {

        let Mats = {}, m 

        scene.traverse( ( child ) => {
            if ( child.isMesh ){ 
                m = child.material;
                if( !Mats[m.name] ){
                    Shader.add( m );
                    console.log(m.name)
                    Mats[m.name] = true;
                }
            }
        })

    },*/

    getGroup:( scene, autoMesh, autoMaterial ) => {

        const groups = {};
        scene.traverse( ( child ) => {
            if ( child.isGroup ){ 
            	groups[ child.name ] = autoMesh ? GlbTool.groupToMesh(child, mats) : child;
            }
        })
        return groups;

    },

    // Material should be name like 
    // 0_concret
    // 10_silver ...

    getMaterial:( scene ) => {

    	const Mats = {};
        let names = [];
        let m, n;

        scene.traverse( ( child ) => {

            if ( child.isMesh ){ 

            	m = child.material;

            	if( names.indexOf(m.name) === -1 ){

                    names.push(m.name);
            		Shader.add( m );
                    
            		Mats[m.name] = m;

                    //if( m.color ) m.color.convertSRGBToLinear();
                    if( m.vertexColors ) m.vertexColors = false;
            		
            	}

            }
        })

        return Mats;

    },

    // convert multymaterial group to mesh

    groupToMesh: ( group ) => {

    	if( group.children[0].name !== (group.name + '_1') ) return false
    	if( !group.children[0].isMesh ) return false

    	let geometry = []
        let material = []
        let i = group.children.length;

        while(i--){

            material[i] = group.children[i].material;
			geometry[i] = group.children[i].geometry;
            geometry[i].group = i;

		}

		let mesh = new THREE.Mesh( new mergeGeometries( geometry, true ), material)
		mesh.name = group.name;
		return mesh;

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
            	tmpMesh.push(node);
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
