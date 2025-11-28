import { Object3D, BatchedMesh, Vector3, Euler, CanvasTexture, Quaternion, Mesh, Matrix4, MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, MeshNormalMaterial, DoubleSide, WebGLCoordinateSystem } from 'three';

// bvh test 
import { acceleratedRaycast, computeBatchedBoundsTree, createRadixSort, extendBatchedMeshPrototype, getBatchedMeshLODCount, getBatchedMeshCount  } from "../../libs/bvhlab.module.js";
// add and override BatchedMesh methods ( @three.ez/batched-mesh-extensions )
extendBatchedMeshPrototype();

// add the extension functions ( three-mesh-bvh )
Mesh.prototype.raycast = acceleratedRaycast;
BatchedMesh.prototype.computeBoundsTree = computeBatchedBoundsTree;

import { GrassGeometry } from '../geometries/GrassGeometry.js';
import { MathTool } from '../../core/MathTool.js';

const position = new Vector3();
const rotation = new Euler();
const quaternion = new Quaternion();
const scale = new Vector3();

export class Grass {

	constructor ( o={}, motor ) {

		this.motor = motor;

		this.ids = []

		this.useLod = true

		this.maxVertex = 0
		this.maxIndex = 0

		//this.initTexture()

		this.initGeometries()
		this.initBatchedMesh()

	}


	initGeometries(){

		this.geometriesLOD = []
		this.geo = [
			new GrassGeometry(),
			new GrassGeometry(),
			new GrassGeometry(),
		]

		if(this.useLod){ 
			for(let i = 0; i<this.geo.length; i++){
				this.geometriesLOD.push( [this.geo[i], new GrassGeometry(2), new GrassGeometry(1)])
			}
			let { vertexCount, indexCount, LODIndexCount } = getBatchedMeshLODCount( this.geometriesLOD );
			this.vertexCount = vertexCount
			this.indexCount = indexCount
			this.LODIndexCount = LODIndexCount
		} else {
			let { vertexCount, indexCount } = getBatchedMeshCount(this.geo);
			this.vertexCount = vertexCount;
		    this.indexCount = indexCount;
		}



		//console.log(this.geometriesLOD)

	    console.log(this.vertexCount, this.indexCount)
	}

	createMaterial(){

		if ( ! this.material ) {

				//this.material = new MeshNormalMaterial({side:DoubleSide});
				this.material = new MeshStandardMaterial({side:DoubleSide, alphaTest:0.6, roughness:1});
				this.material.map = this.motor.texture({ url:'./assets/textures/plante/grass_c.jpg', flipY:true, encoding:true });
				this.material.alphaMap = this.motor.texture({ url:'./assets/textures/plante/grass_a.jpg', flipY:true, encoding:false });
				this.material.normalMap = this.motor.texture({ url:'./assets/textures/plante/grass_n.jpg', flipY:true, encoding:false });
				this.material.aoMap = this.motor.texture({ url:'./assets/textures/plante/grass_ao.jpg', flipY:true, encoding:false });
				this.material.roughnessMap = this.motor.texture({ url:'./assets/textures/plante/grass_r.jpg', flipY:true, encoding:false });
				//this.material.roughnessMap = this.motor.texture({ url:'../../assets/textures/plante/grass_ao.jpg', flipY:true, encoding:false });

			}

			return this.material;

	}

	randomizeMatrix( matrix ){

		position.x = Math.random() * 40 - 20;
		//position.y = Math.random() * 40 - 20;
		position.z = Math.random() * 40 - 20;

		//rotation.x = Math.random() * 2 * Math.PI;
		rotation.y = Math.random() * 2 * Math.PI;
		//rotation.z = Math.random() * 2 * Math.PI;

		quaternion.setFromEuler( rotation );

		scale.x = scale.y = scale.z = 0.5 + ( Math.random() * 0.5 );

		return matrix.compose( position, quaternion, scale );

	}

	initBatchedMesh(){

		const instancesCount = 16000;


		const euler = new Euler();
		const matrix = new Matrix4();

		// create BatchedMesh

		let mesh = new BatchedMesh( instancesCount, this.vertexCount, this.indexCount, this.createMaterial() );

		mesh.customSort = createRadixSort( mesh );
		//mesh.userData.rotationSpeeds = [];

		// add geometries and their LODs to the batched mesh ( all LODs share the same position array )

		if(this.useLod){
			for ( let i = 0; i < this.geometriesLOD.length; i ++ ) {

		        const geometryLOD = this.geometriesLOD[ i ];
		        const geometryId = mesh.addGeometry( geometryLOD[ 0 ], - 1, this.LODIndexCount[ i ] );
		        mesh.addGeometryLOD( geometryId, geometryLOD[ 1 ], 10 );
		        mesh.addGeometryLOD( geometryId, geometryLOD[ 2 ], 20 );

		    }
		} else {
			this.geometryIds = [
				mesh.addGeometry( this.geo[ 0 ] ),
				mesh.addGeometry( this.geo[ 1 ] ),
				mesh.addGeometry( this.geo[ 2 ] ),
			];
		}
	    

		// disable full-object frustum culling since all of the objects can be dynamic.
		//mesh.frustumCulled = false;

		this.ids.length = 0;


		for ( let i = 0; i < instancesCount ; i ++ ) {

			let id

			if(this.useLod) id = mesh.addInstance( Math.floor( Math.random() * this.geometriesLOD.length ) );
			else id = mesh.addInstance( this.geometryIds[ i % this.geometryIds.length ] );

			mesh.setMatrixAt( id, this.randomizeMatrix( matrix ) );

			/*const rotationMatrix = new THREE.Matrix4();
			rotationMatrix.makeRotationFromEuler( randomizeRotationSpeed( euler ) );
			mesh.userData.rotationSpeeds.push( rotationMatrix );*/

			this.ids.push( id );

		}

		// compute blas (bottom-level acceleration structure) bvh ( three-mesh-bvh 
		//mesh.computeBoundsTree();

	    // compute tlas (top-level acceleration structure) bvh ( @three.ez/batched-mesh-extensions )
	    // To speed up raycasting and frustum culling,
	    mesh.computeBVH( WebGLCoordinateSystem, { margin: 0 } );

	    // disable raycast
	    mesh.raycast = () => {return}

		mesh.castShadow = true
		mesh.receiveShadow = false

		//this.mesh = mesh

		//console.log(mesh.bvh)


		this.motor.scenePlus.add( mesh );

		let v = false

		/*const lods = mesh._geometryInfo.map( x => x.LOD );
		const geometryInfo = mesh._geometryInfo;
        for ( let i = 0; i < geometryInfo.length; i ++ ) {

            geometryInfo[ i ].LOD = v ? lods[ i ] : null;

        }*/

	}

}