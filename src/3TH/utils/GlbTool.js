import { Shader } from '../Shader.js'
import { mergeBufferGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const GlbTool = {

	getMesh:(scene) => {
        let meshs = {};
        scene.traverse( function ( child ) {
            if ( child.isMesh ) meshs[ child.name ] = child;
        })
        return meshs;
    },

    getGroup:( scene, autoMesh, autoMaterial ) => {
        const groups = {};
        let mats = null
        scene.traverse( function ( child ) {
            if ( child.isGroup ){ 
            	if( autoMaterial ) mats = GlbTool.getMaterial( scene, true ) 
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
        scene.traverse( function ( child ) {
            if ( child.isMesh ){ 
            	m = child.material;
            	if( !Mats[m.name] ){
            		Shader.add( m )
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

		let mesh = new THREE.Mesh( new mergeBufferGeometries( g, true ), autoMaterial )
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


    autoMorph: ( meshName, fullAttribute ) => {

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


	},




}