import {
	Box3,
	CubeCamera,
	CubeRenderTarget,
	FloatType,
	HalfFloatType,
	LinearFilter,
	NearestFilter,
	Object3D,
	QuadMesh,
	RGBAFormat,
	RenderTarget3D,
	Vector3,
	NodeMaterial
} from 'three/webgpu';

import { Fn, If, Loop, cubeTexture, float, int, ivec3, screenCoordinate, texture3D, uniform, vec3, vec4 } from 'three/tsl';

// Shared fullscreen-quad
let _quad = null;

// SH projection material (depends on cubemapSize)
let _shMaterial = null;
let _shEnvNode = null;
let _lastCubemapSize = 0;

// Repack materials (one per output sub-volume / texture index)
let _repackMaterials = null;
let _repackBatchNode = null;
let _repackResolution = null;
let _repackSliceZ = null;

// Cached bake resources
let _cubeRenderTarget = null;
let _cubeCamera = null;
let _cachedCubemapSize = 0;
let _cachedNear = 0;
let _cachedFar = 0;

// Cached batch render target ( one 9×1 slice per probe )
let _batchTarget = null;
let _batchTargetProbes = 0;

// Reusable temp objects
const _position = /*@__PURE__*/ new Vector3();
const _size = /*@__PURE__*/ new Vector3();

// Number of padding texels added at each boundary of every sub-volume in the atlas.
const ATLAS_PADDING = 1;

/**
 * A 3D grid of L2 Spherical Harmonic irradiance probes that provides
 * position-dependent diffuse global illumination.
 *
 * This is the WebGPU counterpart of the WebGL `LightProbeGrid` addon and uses
 * the same packed-atlas layout, so it is consumed at runtime by the built-in
 * `LightProbeGridNode` automatically: simply `scene.add( grid )` and every
 * standard / physical material in the scene receives the grid's irradiance.
 *
 * Note that this class can only be used with {@link WebGPURenderer}.
 * When using {@link WebGLRenderer}, import from `LightProbeGrid.js`.
 *
 * All seven packed SH sub-volumes are stored in a **single** RGBA
 * `RenderTarget3D` using a texture-atlas layout along the Z axis. Each
 * sub-volume occupies `( nz + 2 )` atlas slices: one padding slice at each end
 * (a copy of the nearest edge data slice) to prevent color bleeding when the
 * hardware trilinear filter reads across a sub-volume boundary.
 *
 * Atlas layout (nz = resolution.z, PADDING = 1):
 * ```
 *   slice   0              : padding  (copy of sub-volume 0, data slice 0)
 *   slices  1 … nz         : sub-volume 0 data
 *   slice   nz + 1         : padding  (copy of sub-volume 0, data slice nz-1)
 *   slice   nz + 2         : padding  (copy of sub-volume 1, data slice 0)
 *   slices  nz+3 … 2*nz+2  : sub-volume 1 data
 *   …
 * ```
 * Total atlas depth = `7 * ( nz + 2 )`.
 *
 * Baking is fully GPU-resident: cubemap rendering, SH projection, and texture
 * packing all happen on the GPU with zero CPU readback.
 *
 * @augments Object3D
 * @three_import import { LightProbeGrid } from 'three/addons/lighting/LightProbeGridGPU.js';
 */
class LightProbeGridGPU extends Object3D {

	/**
	 * Constructs a new irradiance probe grid.
	 *
	 * The volume is centered at the object's position.
	 *
	 * @param {number} [width=1] - Full width of the volume along X.
	 * @param {number} [height=1] - Full height of the volume along Y.
	 * @param {number} [depth=1] - Full depth of the volume along Z.
	 * @param {number} [widthProbes] - Number of probes along X. Defaults to `Math.max( 2, Math.round( width ) + 1 )`.
	 * @param {number} [heightProbes] - Number of probes along Y. Defaults to `Math.max( 2, Math.round( height ) + 1 )`.
	 * @param {number} [depthProbes] - Number of probes along Z. Defaults to `Math.max( 2, Math.round( depth ) + 1 )`.
	 */
	constructor( width = 1, height = 1, depth = 1, widthProbes, heightProbes, depthProbes ) {

		super();

		/**
		 * This flag can be used for type testing.
		 *
		 * @type {boolean}
		 * @readonly
		 * @default true
		 */
		this.isLightProbeGrid = true;

		/**
		 * The full width of the volume along X.
		 *
		 * @type {number}
		 */
		this.width = width;

		/**
		 * The full height of the volume along Y.
		 *
		 * @type {number}
		 */
		this.height = height;

		/**
		 * The full depth of the volume along Z.
		 *
		 * @type {number}
		 */
		this.depth = depth;

		/**
		 * The number of probes along each axis.
		 *
		 * @type {Vector3}
		 */
		this.resolution = new Vector3(
			widthProbes !== undefined ? widthProbes : Math.max( 2, Math.round( width ) + 1 ),
			heightProbes !== undefined ? heightProbes : Math.max( 2, Math.round( height ) + 1 ),
			depthProbes !== undefined ? depthProbes : Math.max( 2, Math.round( depth ) + 1 )
		);

		/**
		 * The world-space bounding box for the grid. Updated automatically
		 * by {@link LightProbeGrid#bake}.
		 *
		 * @type {Box3}
		 */
		this.boundingBox = new Box3();

		/**
		 * The single RGBA atlas 3D texture storing all seven packed SH sub-volumes.
		 *
		 * @type {?Data3DTexture}
		 * @default null
		 */
		this.texture = null;

		/**
		 * Internal render target for GPU-resident baking.
		 *
		 * @private
		 * @type {?RenderTarget3D}
		 * @default null
		 */
		this._renderTarget = null;

		this.updateBoundingBox();

	}

	/**
	 * Returns the world-space position of the probe at grid indices (ix, iy, iz).
	 *
	 * @param {number} ix - X index.
	 * @param {number} iy - Y index.
	 * @param {number} iz - Z index.
	 * @param {Vector3} target - The target vector.
	 * @return {Vector3} The world-space position.
	 */
	getProbePosition( ix, iy, iz, target ) {

		const pos = this.position;
		const res = this.resolution;
		const w = this.width, h = this.height, d = this.depth;

		target.set(
			res.x > 1 ? pos.x - w / 2 + ix * w / ( res.x - 1 ) : pos.x,
			res.y > 1 ? pos.y - h / 2 + iy * h / ( res.y - 1 ) : pos.y,
			res.z > 1 ? pos.z - d / 2 + iz * d / ( res.z - 1 ) : pos.z
		);

		return target;

	}

	/**
	 * Updates the world-space bounding box from the current position and size.
	 */
	updateBoundingBox() {

		_size.set( this.width, this.height, this.depth );
		this.boundingBox.setFromCenterAndSize( this.position, _size );

	}

	/**
	 * Bakes all probes by rendering cubemaps at each probe position
	 * and projecting to L2 SH. Fully GPU-resident with zero CPU readback.
	 *
	 * @param {WebGPURenderer} renderer - The renderer.
	 * @param {Scene} scene - The scene to render.
	 * @param {Object} [options] - Bake options.
	 * @param {number} [options.cubemapSize=8] - Resolution of each cubemap face.
	 * @param {number} [options.near=0.1] - Near plane for the cube camera.
	 * @param {number} [options.far=100] - Far plane for the cube camera.
	 */
	bake( renderer, scene, options = {} ) {

		const { cubeRenderTarget, cubeCamera } = _ensureBakeResources( options );

		this._ensureTextures();
		this.updateBoundingBox();

		// Keep the SH projection material pointed at the active cube render target
		_shEnvNode.value = cubeRenderTarget.texture;

		// Prevent feedback: temporarily hide the volume during baking
		this.visible = false;

		const res = this.resolution;
		const totalProbes = res.x * res.y * res.z;

		// Batch render target for SH coefficients: 9×1 slice per probe
		const batchTarget = _ensureBatchTarget( totalProbes );
		_repackBatchNode.value = batchTarget.texture;

		// Save renderer state
		const currentRenderTarget = renderer.getRenderTarget();

		// Scene is static across the bake — update once and disable per-render auto updates.
		const currentMatrixWorldAutoUpdate = scene.matrixWorldAutoUpdate;
		if ( currentMatrixWorldAutoUpdate === true ) {

			scene.updateMatrixWorld( true );
			scene.matrixWorldAutoUpdate = false;

		}

		// Phase 1: Render cubemaps and project to SH into the batch target ( one slice per probe )
		_quad.material = _shMaterial;

		for ( let iz = 0; iz < res.z; iz ++ ) {

			for ( let iy = 0; iy < res.y; iy ++ ) {

				for ( let ix = 0; ix < res.x; ix ++ ) {

					const probeIndex = ix + iy * res.x + iz * res.x * res.y;

					this.getProbePosition( ix, iy, iz, _position );
					cubeCamera.position.copy( _position );
					cubeCamera.update( renderer, scene );

					renderer.setRenderTarget( batchTarget, probeIndex );
					_quad.render( renderer );

				}

			}

		}

		// Phase 2: Repack SH data from the batch target into the atlas 3D texture (GPU-to-GPU).
		//
		// For each of the 7 packed sub-volumes (texture index t) we write:
		//   - A leading padding slice  (copy of data slice iz = 0)
		//   - All nz data slices       (iz = 0 … nz-1)
		//   - A trailing padding slice (copy of data slice iz = nz-1)
		//
		// In the atlas the slices for sub-volume t occupy the range:
		//   [ t * paddedSlices, t * paddedSlices + paddedSlices - 1 ]
		// where paddedSlices = nz + 2 * ATLAS_PADDING.

		const paddedSlices = res.z + 2 * ATLAS_PADDING;
		const rt = this._renderTarget;

		_repackResolution.value.copy( res );

		for ( let t = 0; t < 7; t ++ ) {

			_quad.material = _repackMaterials[ t ];

			// Write data slices
			for ( let iz = 0; iz < res.z; iz ++ ) {

				_repackSliceZ.value = iz;
				renderer.setRenderTarget( rt, t * paddedSlices + ATLAS_PADDING + iz );
				_quad.render( renderer );

			}

			// Leading padding: copy of data slice iz = 0
			_repackSliceZ.value = 0;
			renderer.setRenderTarget( rt, t * paddedSlices );
			_quad.render( renderer );

			// Trailing padding: copy of data slice iz = nz - 1
			_repackSliceZ.value = res.z - 1;
			renderer.setRenderTarget( rt, t * paddedSlices + ATLAS_PADDING + res.z );
			_quad.render( renderer );

		}

		// Restore renderer state
		renderer.setRenderTarget( currentRenderTarget );

		scene.matrixWorldAutoUpdate = currentMatrixWorldAutoUpdate;

		this.visible = true;

	}

	/**
	 * Ensures the atlas 3D render target exists with the correct dimensions.
	 *
	 * @private
	 */
	_ensureTextures() {

		if ( this._renderTarget !== null ) return;

		const res = this.resolution;
		const nx = res.x, ny = res.y, nz = res.z;

		// Atlas depth: 7 sub-volumes, each with ATLAS_PADDING slices at both ends
		const atlasDepth = 7 * ( nz + 2 * ATLAS_PADDING );

		const rt = new RenderTarget3D( nx, ny, atlasDepth, {
			format: RGBAFormat,
			type: FloatType,
			minFilter: LinearFilter,
			magFilter: LinearFilter,
			generateMipmaps: false,
			depthBuffer: false
		} );

		this._renderTarget = rt;
		this.texture = rt.texture;

	}

	/**
	 * Frees GPU resources.
	 */
	dispose() {

		if ( this._renderTarget !== null ) {

			this._renderTarget.dispose();
			this._renderTarget = null;
			this.texture = null;

		}

	}

}

// Internal: Ensure the shared fullscreen-quad exists
function _ensureQuad() {

	if ( _quad === null ) {

		_quad = new QuadMesh();

	}

}

// Internal: Ensure GPU resources for SH projection are created
function _ensureGPUResources( cubemapSize ) {

	_ensureQuad();

	// Recreate material when cubemap size changes
	if ( cubemapSize !== _lastCubemapSize ) {

		if ( _shMaterial !== null ) _shMaterial.dispose();

		_shEnvNode = cubeTexture( _cubeRenderTarget.texture );

		const pixelSize = 2.0 / cubemapSize;

		_shMaterial = new NodeMaterial();
		_shMaterial.fragmentNode = Fn( () => {

			const coefIndex = int( screenCoordinate.x );

			const accum0 = vec3( 0.0 ).toVar();
			const accum1 = vec3( 0.0 ).toVar();
			const accum2 = vec3( 0.0 ).toVar();
			const accum3 = vec3( 0.0 ).toVar();
			const accum4 = vec3( 0.0 ).toVar();
			const accum5 = vec3( 0.0 ).toVar();
			const accum6 = vec3( 0.0 ).toVar();
			const accum7 = vec3( 0.0 ).toVar();
			const accum8 = vec3( 0.0 ).toVar();
			const totalWeight = float( 0.0 ).toVar();

			// Nested loops MUST be expressed as a single compacted Loop() so each level
			// gets a distinct iteration variable ( i, j, k ). Three separate Loop() calls
			// would each generate a variable named `i`, shadowing the outer indices.
			Loop( 6, cubemapSize, cubemapSize, ( { i: face, j: iy, k: ix } ) => {

				// WebGL cubemaps have a left-handed orientation (flip = -1)
				const col = float( ix ).add( 0.5 ).mul( pixelSize ).sub( 1.0 );
				const row = float( 1.0 ).sub( float( iy ).add( 0.5 ).mul( pixelSize ) );

				const coord = vec3( 0.0 ).toVar();

				If( face.equal( 0 ), () => {

					coord.assign( vec3( 1.0, row, col.negate() ) );

				} ).ElseIf( face.equal( 1 ), () => {

					coord.assign( vec3( - 1.0, row, col ) );

				} ).ElseIf( face.equal( 2 ), () => {

					coord.assign( vec3( col, 1.0, row.negate() ) );

				} ).ElseIf( face.equal( 3 ), () => {

					coord.assign( vec3( col, - 1.0, row ) );

				} ).ElseIf( face.equal( 4 ), () => {

					coord.assign( vec3( col, row, 1.0 ) );

				} ).Else( () => {

					coord.assign( vec3( col.negate(), row, - 1.0 ) );

				} );

				const lengthSq = coord.dot( coord );
				const weight = float( 4.0 ).div( lengthSq.sqrt().mul( lengthSq ) );
				totalWeight.addAssign( weight );

				const dir = coord.normalize();
				const cw = _shEnvNode.sample( coord ).rgb.mul( weight );

				// band 0
				accum0.addAssign( cw.mul( 0.282095 ) );

				// band 1
				accum1.addAssign( cw.mul( dir.y.mul( 0.488603 ) ) );
				accum2.addAssign( cw.mul( dir.z.mul( 0.488603 ) ) );
				accum3.addAssign( cw.mul( dir.x.mul( 0.488603 ) ) );

				// band 2
				accum4.addAssign( cw.mul( dir.x.mul( dir.y ).mul( 1.092548 ) ) );
				accum5.addAssign( cw.mul( dir.y.mul( dir.z ).mul( 1.092548 ) ) );
				accum6.addAssign( cw.mul( dir.z.mul( dir.z ).mul( 3.0 ).sub( 1.0 ).mul( 0.315392 ) ) );
				accum7.addAssign( cw.mul( dir.x.mul( dir.z ).mul( 1.092548 ) ) );
				accum8.addAssign( cw.mul( dir.x.mul( dir.x ).sub( dir.y.mul( dir.y ) ).mul( 0.546274 ) ) );

			} );

			const norm = float( 4.0 * Math.PI ).div( totalWeight );

			const accum = vec3( 0.0 ).toVar();

			If( coefIndex.equal( 0 ), () => {

				accum.assign( accum0 );

			} ).ElseIf( coefIndex.equal( 1 ), () => {

				accum.assign( accum1 );

			} ).ElseIf( coefIndex.equal( 2 ), () => {

				accum.assign( accum2 );

			} ).ElseIf( coefIndex.equal( 3 ), () => {

				accum.assign( accum3 );

			} ).ElseIf( coefIndex.equal( 4 ), () => {

				accum.assign( accum4 );

			} ).ElseIf( coefIndex.equal( 5 ), () => {

				accum.assign( accum5 );

			} ).ElseIf( coefIndex.equal( 6 ), () => {

				accum.assign( accum6 );

			} ).ElseIf( coefIndex.equal( 7 ), () => {

				accum.assign( accum7 );

			} ).Else( () => {

				accum.assign( accum8 );

			} );

			return vec4( accum.mul( norm ), 1.0 );

		} )();

		_lastCubemapSize = cubemapSize;

	}

}

// Internal: Ensure GPU resources for repacking SH into the atlas 3D texture
function _ensureRepackResources() {

	if ( _repackMaterials !== null ) return;

	_ensureQuad();

	_repackBatchNode = texture3D( null );
	_repackResolution = uniform( new Vector3() );
	_repackSliceZ = uniform( 0 );

	// Create 7 materials, one per output texture packing
	// Texture 0: (c0.r, c0.g, c0.b, c1.r)
	// Texture 1: (c1.g, c1.b, c2.r, c2.g)
	// Texture 2: (c2.b, c3.r, c3.g, c3.b)
	// Texture 3: (c4.r, c4.g, c4.b, c5.r)
	// Texture 4: (c5.g, c5.b, c6.r, c6.g)
	// Texture 5: (c6.b, c7.r, c7.g, c7.b)
	// Texture 6: (c8.r, c8.g, c8.b, 0.0)

	_repackMaterials = [];

	for ( let t = 0; t < 7; t ++ ) {

		const textureIndex = t;

		const material = new NodeMaterial();
		material.fragmentNode = Fn( () => {

			const nx = int( _repackResolution.x );
			const ny = int( _repackResolution.y );

			const ix = int( screenCoordinate.x );
			const iy = int( screenCoordinate.y );
			const iz = int( _repackSliceZ );

			const probeIndex = ix.add( iy.mul( nx ) ).add( iz.mul( nx ).mul( ny ) );

			// Read 9 SH coefficients from the batch target slice ( layout: x = coefficient, z = probe )
			const c0 = _repackBatchNode.load( ivec3( 0, 0, probeIndex ) );
			const c1 = _repackBatchNode.load( ivec3( 1, 0, probeIndex ) );
			const c2 = _repackBatchNode.load( ivec3( 2, 0, probeIndex ) );
			const c3 = _repackBatchNode.load( ivec3( 3, 0, probeIndex ) );
			const c4 = _repackBatchNode.load( ivec3( 4, 0, probeIndex ) );
			const c5 = _repackBatchNode.load( ivec3( 5, 0, probeIndex ) );
			const c6 = _repackBatchNode.load( ivec3( 6, 0, probeIndex ) );
			const c7 = _repackBatchNode.load( ivec3( 7, 0, probeIndex ) );
			const c8 = _repackBatchNode.load( ivec3( 8, 0, probeIndex ) );

			// Pack into the output format for this texture index
			if ( textureIndex === 0 ) return vec4( c0.xyz, c1.x );
			if ( textureIndex === 1 ) return vec4( c1.y, c1.z, c2.x, c2.y );
			if ( textureIndex === 2 ) return vec4( c2.z, c3.x, c3.y, c3.z );
			if ( textureIndex === 3 ) return vec4( c4.xyz, c5.x );
			if ( textureIndex === 4 ) return vec4( c5.y, c5.z, c6.x, c6.y );
			if ( textureIndex === 5 ) return vec4( c6.z, c7.x, c7.y, c7.z );
			return vec4( c8.xyz, 0.0 );

		} )();

		_repackMaterials[ t ] = material;

	}

}

// Internal: Ensure cube render target and camera exist with the right parameters
function _ensureBakeResources( options ) {

	const {
		cubemapSize = 8,
		near = 0.1,
		far = 100
	} = options;

	if ( _cubeRenderTarget === null || cubemapSize !== _cachedCubemapSize || near !== _cachedNear || far !== _cachedFar ) {

		if ( _cubeRenderTarget !== null ) _cubeRenderTarget.dispose();

		_cubeRenderTarget = new CubeRenderTarget( cubemapSize, { type: HalfFloatType, generateMipmaps: false } );
		_cubeCamera = new CubeCamera( near, far, _cubeRenderTarget );
		_cachedCubemapSize = cubemapSize;
		_cachedNear = near;
		_cachedFar = far;

	}

	_ensureGPUResources( cubemapSize );
	_ensureRepackResources();

	return { cubeRenderTarget: _cubeRenderTarget, cubeCamera: _cubeCamera };

}

function _ensureBatchTarget( totalProbes ) {

	if ( _batchTarget === null || _batchTargetProbes !== totalProbes ) {

		if ( _batchTarget !== null ) _batchTarget.dispose();

		_batchTarget = new RenderTarget3D( 9, 1, totalProbes, {
			format: RGBAFormat,
			type: FloatType,
			minFilter: NearestFilter,
			magFilter: NearestFilter,
			generateMipmaps: false,
			depthBuffer: false
		} );

		_batchTargetProbes = totalProbes;

	}

	return _batchTarget;

}

export { LightProbeGridGPU };
