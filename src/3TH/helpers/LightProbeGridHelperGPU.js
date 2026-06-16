import {
	InstancedBufferAttribute,
	InstancedMesh,
	Matrix4,
	SphereGeometry,
	Vector3,
	NodeMaterial
} from 'three/webgpu';

import { Fn, float, instanceIndex, int, normalWorld, texture3D, uniform, varying, vec3 } from 'three/tsl';

/**
 * Visualizes a `LightProbeGrid` by rendering a sphere at each probe position,
 * shaded with the probe's L2 spherical harmonics.
 *
 * Uses a single `InstancedMesh` draw call for all probes.
 *
 * This helper can only be used with {@link WebGPURenderer}.
 * When using {@link WebGLRenderer}, import from `LightProbeGridHelper.js`.
 *
 * ```js
 * const helper = new LightProbeGridHelper( probes );
 * scene.add( helper );
 * ```
 *
 * @augments InstancedMesh
 * @three_import import { LightProbeGridHelper } from 'three/addons/helpers/LightProbeGridHelperGPU.js';
 */
class LightProbeGridHelperGPU extends InstancedMesh {

	/**
	 * Constructs a new irradiance probe grid helper.
	 *
	 * @param {LightProbeGrid} probes - The probe grid to visualize.
	 * @param {number} [sphereSize=0.12] - The radius of each probe sphere.
	 */
	constructor( probes, sphereSize = 0.12 ) {

		const geometry = new SphereGeometry( sphereSize, 16, 16 );

		const material = new NodeMaterial();

		const probesSH = texture3D( null );
		const probesResolution = uniform( new Vector3() );

		material.colorNode = Fn( () => {

			// Per-instance grid coordinate, derived from the instance index.
			// Instances are ordered ix fastest, then iy, then iz (see update()).
			const idx = int( instanceIndex );
			const nx = int( probesResolution.x );
			const ny = int( probesResolution.y );
			const ix = idx.mod( nx );
			const iy = idx.div( nx ).mod( ny );
			const iz = idx.div( nx.mul( ny ) );

			const uvw = varying( vec3(
				float( ix ).add( 0.5 ).div( probesResolution.x ),
				float( iy ).add( 0.5 ).div( probesResolution.y ),
				float( iz ).add( 0.5 ).div( probesResolution.z )
			) );

			// Atlas UV mapping along Z ( must match LightProbeGridNode and the WebGL chunk )
			const nz = probesResolution.z;
			const paddedSlices = nz.add( 2.0 );
			const atlasDepth = paddedSlices.mul( 7.0 );
			const uvZBase = uvw.z.mul( nz ).add( 1.0 );

			const sampleAtlas = ( index ) => probesSH.sample( vec3( uvw.x, uvw.y, uvZBase.add( paddedSlices.mul( index ) ).div( atlasDepth ) ) );

			const s0 = sampleAtlas( 0.0 );
			const s1 = sampleAtlas( 1.0 );
			const s2 = sampleAtlas( 2.0 );
			const s3 = sampleAtlas( 3.0 );
			const s4 = sampleAtlas( 4.0 );
			const s5 = sampleAtlas( 5.0 );
			const s6 = sampleAtlas( 6.0 );

			// Unpack 9 vec3 SH L2 coefficients
			const c0 = s0.xyz;
			const c1 = vec3( s0.w, s1.x, s1.y );
			const c2 = vec3( s1.z, s1.w, s2.x );
			const c3 = vec3( s2.y, s2.z, s2.w );
			const c4 = s3.xyz;
			const c5 = vec3( s3.w, s4.x, s4.y );
			const c6 = vec3( s4.z, s4.w, s5.x );
			const c7 = vec3( s5.y, s5.z, s5.w );
			const c8 = s6.xyz;

			// Evaluate L2 irradiance
			const x = normalWorld.x, y = normalWorld.y, z = normalWorld.z;

			let result = c0.mul( 0.886227 );
			result = result.add( c1.mul( 2.0 * 0.511664 ).mul( y ) );
			result = result.add( c2.mul( 2.0 * 0.511664 ).mul( z ) );
			result = result.add( c3.mul( 2.0 * 0.511664 ).mul( x ) );
			result = result.add( c4.mul( 2.0 * 0.429043 ).mul( x ).mul( y ) );
			result = result.add( c5.mul( 2.0 * 0.429043 ).mul( y ).mul( z ) );
			result = result.add( c6.mul( z.mul( z ).mul( 0.743125 ).sub( 0.247708 ) ) );
			result = result.add( c7.mul( 2.0 * 0.429043 ).mul( x ).mul( z ) );
			result = result.add( c8.mul( 0.429043 ).mul( x.mul( x ).sub( y.mul( y ) ) ) );

			return result.max( 0.0 );

		} )();

		const res = probes.resolution;
		const count = res.x * res.y * res.z;

		super( geometry, material, count );

		/**
		 * The probe grid to visualize.
		 *
		 * @type {LightProbeGrid}
		 */
		this.probes = probes;

		this.type = 'LightProbeGridHelper';

		this._probesSH = probesSH;
		this._probesResolution = probesResolution;

		this.update();

	}

	/**
	 * Rebuilds instance matrices from the current probe grid and refreshes the
	 * SH texture binding. Call this after re-baking or changing `probes`.
	 */
	update() {

		const probes = this.probes;
		const res = probes.resolution;
		const count = res.x * res.y * res.z;

		// Resize instance matrix buffer if needed

		if ( this.instanceMatrix.count !== count ) {

			this.instanceMatrix = new InstancedBufferAttribute( new Float32Array( count * 16 ), 16 );

		}

		this.count = count;

		const matrix = new Matrix4();
		const probePos = new Vector3();

		let i = 0;

		for ( let iz = 0; iz < res.z; iz ++ ) {

			for ( let iy = 0; iy < res.y; iy ++ ) {

				for ( let ix = 0; ix < res.x; ix ++ ) {

					probes.getProbePosition( ix, iy, iz, probePos );
					matrix.makeTranslation( probePos.x, probePos.y, probePos.z );
					this.setMatrixAt( i, matrix );

					i ++;

				}

			}

		}

		this.instanceMatrix.needsUpdate = true;

		// Update texture uniforms

		this._probesSH.value = probes.texture;
		this._probesResolution.value.copy( probes.resolution );

	}

	/**
	 * Frees the GPU-related resources allocated by this instance.
	 */
	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}

export { LightProbeGridHelperGPU };
