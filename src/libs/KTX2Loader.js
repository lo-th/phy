import {
	CompressedArrayTexture,
	CompressedCubeTexture,
	CompressedTexture,
	Data3DTexture,
	DataTexture,
	FileLoader,
	FloatType,
	HalfFloatType,
	LinearFilter,
	LinearMipmapLinearFilter,
	LinearSRGBColorSpace,
	Loader,
	NoColorSpace,
	RGBAFormat,
	RGBA_ASTC_4x4_Format,
	RGBA_ASTC_6x6_Format,
	RGBA_BPTC_Format,
	RGBA_S3TC_DXT3_Format,
	RGBA_ETC2_EAC_Format,
	RGBA_PVRTC_4BPPV1_Format,
	RGBA_S3TC_DXT1_Format,
	RGBA_S3TC_DXT5_Format,
	RGB_BPTC_UNSIGNED_Format,
	RGB_ETC1_Format,
	RGB_ETC2_Format,
	RGB_PVRTC_4BPPV1_Format,
	RGB_S3TC_DXT1_Format,
	RGFormat,
	RedFormat,
	SRGBColorSpace,
	UnsignedByteType
} from 'three';

import { KTX2Loader as KTX2LoaderBase } from '../../three/examples/jsm/loaders/KTX2Loader.js';


const _taskCache = new WeakMap();

let _activeLoaders = 0;

let _zstd;


class KTX2Loader extends KTX2LoaderBase {

	/**
	 * Constructs a new KTX2 loader.
	 *
	 * @param {LoadingManager} [manager] - The loading manager.
	 */
	constructor( manager ) {

		super( manager );

		this.useLocal = false;

	}

	setUseLocal( value ) {

		this.useLocal = value;
		return this;

	}

	_loadLibrary( url, responseType ) {

		const loader = new FileLoader( this.manager );
		loader.setPath( this.transcoderPath );
		loader.setResponseType( responseType );
		loader.setWithCredentials( this.withCredentials );

		return new Promise( ( resolve, reject ) => {

			loader.load( url, resolve, undefined, reject );

		});

	}


	// TODO: Make this method private

	init() {

		if ( ! this.transcoderPending ) {

			let jsContent, binaryContent;


			if(this.useLocal) {
				this.transcoderPath = '';
				jsContent = this._loadLibrary( new URL( '../build/basis/basis_transcoder.js', import.meta.url ), 'text' );
				binaryContent = this._loadLibrary( new URL( '../build/basis/basis_transcoder.wasm', import.meta.url ), 'arraybuffer' );
			} else {
				jsContent = this._loadLibrary( 'basis_transcoder.js', 'text' )
			    binaryContent = this._loadLibrary( 'basis_transcoder.wasm', 'arraybuffer' )
			}


			this.transcoderPending = Promise.all( [ jsContent, binaryContent ] )
				.then( ( [ jsContent, binaryContent ] ) => {

					const fn = KTX2Loader.BasisWorker.toString();

					const body = [
						'/* constants */',
						'let _EngineFormat = ' + JSON.stringify( KTX2Loader.EngineFormat ),
						'let _EngineType = ' + JSON.stringify( KTX2Loader.EngineType ),
						'let _TranscoderFormat = ' + JSON.stringify( KTX2Loader.TranscoderFormat ),
						'let _BasisFormat = ' + JSON.stringify( KTX2Loader.BasisFormat ),
						'/* basis_transcoder.js */',
						jsContent,
						'/* worker */',
						fn.substring( fn.indexOf( '{' ) + 1, fn.lastIndexOf( '}' ) )
					].join( '\n' );

					this.workerSourceURL = URL.createObjectURL( new Blob( [ body ] ) );
					this.transcoderBinary = binaryContent;

					this.workerPool.setWorkerCreator( () => {

						const worker = new Worker( this.workerSourceURL );
						const transcoderBinary = this.transcoderBinary.slice( 0 );

						worker.postMessage( { type: 'init', config: this.workerConfig, transcoderBinary }, [ transcoderBinary ] );

						return worker;

					} );

				} );

			if ( _activeLoaders > 0 ) {

				// Each instance loads a transcoder and allocates workers, increasing network and memory cost.

				console.warn(

					'THREE.KTX2Loader: Multiple active KTX2 loaders may cause performance issues.'
					+ ' Use a single KTX2Loader instance, or call .dispose() on old instances.'

				);

			}

			_activeLoaders ++;

		}

		return this.transcoderPending;

	}

	
}

export { KTX2Loader };
