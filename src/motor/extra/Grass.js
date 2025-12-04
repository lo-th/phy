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

		const res = '128'
		const format = 'jpg'
		const flipY = true

		if ( !this.material ) {

				//this.material = new MeshNormalMaterial({side:DoubleSide});
				const material = new MeshStandardMaterial({side:DoubleSide, alphaTest:0.6, roughness:1, metalness:1 });
				
				material.map = this.motor.texture({ url:'./assets/textures/plante/'+res+'/grass_c.' + format, flipY:flipY, srgb:true });
				material.alphaMap = this.motor.texture({ url:'./assets/textures/plante/'+res+'/grass_a.' + format, flipY:flipY, srgb:false });
				//material.normalMap = this.motor.texture({ url:'./assets/textures/plante/'+res+'/grass_n.' + format, flipY:flipY, srgb:false });
				const arm = this.motor.texture({ url:'./assets/textures/plante/'+res+'/grass_arm.' + format, flipY:flipY, srgb:false });
				material.aoMap = arm;
				material.roughnessMap = arm;
				material.metalnessMap = arm;

				material.onBeforeCompile = function ( shader ) {

					// https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83

					shader.uniforms.time = { value: 0 };

					shader.vertexShader = `
					uniform float time;
					` + noise + shader.vertexShader;

					shader.vertexShader = shader.vertexShader.replace(
						'#include <begin_vertex>',`

						

						vec4 wPosition = vec4( position, 1.0 );
						wPosition = batchingMatrix * wPosition;
						float noi = snoise(vec2(wPosition.x+(time*5.0), wPosition.z+(time*5.0))*0.08);

						float nox = (1.0+noi)*0.5;
						float noy = 1.0+(nox*0.5);


						float theta = sin( time + wPosition.y ) / 2.0;
						float c = cos( theta );
						float s = sin( theta );
						mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c )*noy;

						
						vec3 transformed = vec3( position );
						if(position.y>0.5) {
							
							transformed.y = 0.5+(nox*0.25); //1.0 + (noi*0.25);
							transformed *= m;
						}

						#ifdef USE_ALPHAHASH

							vPosition = vec3( position ) * m;

						#endif
						`
					);
					/*shader.vertexShader = shader.vertexShader.replace(
						'#include <begin_vertex>',
						[
							`float theta = sin( time + position.y ) / 2.0;`,
							'float c = cos( theta );',
							'float s = sin( theta );',
							'mat3 m = mat3( c, 0, s, 0, 1, 0, -s, 0, c );',
							'vec3 transformed = vec3( position ) * m;',
							'vNormal = vNormal * m;'
						].join( '\n' )
					);*/

					//console.log(shader.vertexShader)

					material.userData.shader = shader;
				}

				this.material = material

			}



			return this.material;

	}

	randomizeMatrix( matrix ){

		position.x = Math.random() * 40 - 20;
		position.y = 0//Math.random() * 40 - 20;
		position.z = Math.random() * 40 - 20;

		//rotation.x = Math.random() * 2 * Math.PI;
		rotation.y = Math.random() * 2 * Math.PI;
		//rotation.z = Math.random() * 2 * Math.PI;

		quaternion.setFromEuler( rotation );

		scale.x = scale.y = scale.z = 0.5 + ( Math.random() * 0.5 );

		return matrix.compose( position, quaternion, scale );

	}

	initBatchedMesh(){

		const instancesCount = 25000;


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
		        mesh.addGeometryLOD( geometryId, geometryLOD[ 1 ], 15 );
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
		mesh.computeBoundsTree();

	    // compute tlas (top-level acceleration structure) bvh ( @three.ez/batched-mesh-extensions )
	    // To speed up raycasting and frustum culling,
	    mesh.computeBVH( WebGLCoordinateSystem, { margin: 0 } );

	    // disable raycast
	    mesh.raycast = () => {return}

		//mesh.castShadow = true
		//mesh.receiveShadow = false

		//this.mesh = mesh

		//console.log(mesh.bvh)


		this.motor.scenePlus.add( mesh );

		this.mesh = mesh

		let v = false

		/*const lods = mesh._geometryInfo.map( x => x.LOD );
		const geometryInfo = mesh._geometryInfo;
        for ( let i = 0; i < geometryInfo.length; i ++ ) {

            geometryInfo[ i ].LOD = v ? lods[ i ] : null;

        }*/

	}

}

const noise = `
float randd(vec2 n) { 
	return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
}

float noise(vec2 p){
	vec2 ip = floor(p);
	vec2 u = fract(p);
	u = u*u*(3.0-2.0*u);
	
	float res = mix(
		mix(randd(ip),randd(ip+vec2(1.0,0.0)),u.x),
		mix(randd(ip+vec2(0.0,1.0)),randd(ip+vec2(1.0,1.0)),u.x),u.y);
	return res*res;
}

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
`