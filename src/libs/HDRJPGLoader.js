/**
 * @monogrid/gainmap-js v2.0.5
 * With ❤️, by MONOGRID <hello@mono-grid.com>
 */

//import { Q as QuadRenderer } from './QuadRenderer-gqnZPNP-.js';
import { ShaderMaterial, Vector3, NoBlending, SRGBColorSpace, LinearSRGBColorSpace, HalfFloatType, Loader, LoadingManager, Texture, UVMapping, ClampToEdgeWrapping, LinearFilter, LinearMipMapLinearFilter, RGBAFormat, UnsignedByteType, FileLoader,
Scene, OrthographicCamera, FloatType, Mesh, PlaneGeometry, WebGLRenderTarget, RepeatWrapping, WebGLRenderer, DataTexture, IntType, ShortType, ByteType, UnsignedIntType, MeshBasicMaterial } from 'three';

const vertexShader = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const fragmentShader = /* glsl */ `
// min half float value
#define HALF_FLOAT_MIN vec3( -65504, -65504, -65504 )
// max half float value
#define HALF_FLOAT_MAX vec3( 65504, 65504, 65504 )

uniform sampler2D sdr;
uniform sampler2D gainMap;
uniform vec3 gamma;
uniform vec3 offsetHdr;
uniform vec3 offsetSdr;
uniform vec3 gainMapMin;
uniform vec3 gainMapMax;
uniform float weightFactor;

varying vec2 vUv;

void main() {
  vec3 rgb = texture2D( sdr, vUv ).rgb;
  vec3 recovery = texture2D( gainMap, vUv ).rgb;
  vec3 logRecovery = pow( recovery, gamma );
  vec3 logBoost = gainMapMin * ( 1.0 - logRecovery ) + gainMapMax * logRecovery;
  vec3 hdrColor = (rgb + offsetSdr) * exp2( logBoost * weightFactor ) - offsetHdr;
  vec3 clampedHdrColor = max( HALF_FLOAT_MIN, min( HALF_FLOAT_MAX, hdrColor ));
  gl_FragColor = vec4( clampedHdrColor , 1.0 );
}
`;
/**
 * A Material which is able to decode the Gainmap into a full HDR Representation
 *
 * @category Materials
 * @group Materials
 */
class GainMapDecoderMaterial extends ShaderMaterial {
    /**
     *
     * @param params
     */
    constructor({ gamma, offsetHdr, offsetSdr, gainMapMin, gainMapMax, maxDisplayBoost, hdrCapacityMin, hdrCapacityMax, sdr, gainMap }) {
        super({
            name: 'GainMapDecoderMaterial',
            vertexShader,
            fragmentShader,
            uniforms: {
                sdr: { value: sdr },
                gainMap: { value: gainMap },
                gamma: { value: new Vector3(1.0 / gamma[0], 1.0 / gamma[1], 1.0 / gamma[2]) },
                offsetHdr: { value: new Vector3().fromArray(offsetHdr) },
                offsetSdr: { value: new Vector3().fromArray(offsetSdr) },
                gainMapMin: { value: new Vector3().fromArray(gainMapMin) },
                gainMapMax: { value: new Vector3().fromArray(gainMapMax) },
                weightFactor: {
                    value: (Math.log2(maxDisplayBoost) - hdrCapacityMin) / (hdrCapacityMax - hdrCapacityMin)
                }
            },
            blending: NoBlending,
            depthTest: false,
            depthWrite: false
        });
        this._maxDisplayBoost = maxDisplayBoost;
        this._hdrCapacityMin = hdrCapacityMin;
        this._hdrCapacityMax = hdrCapacityMax;
        this.needsUpdate = true;
        this.uniformsNeedUpdate = true;
    }
    get sdr() { return this.uniforms.sdr.value; }
    set sdr(value) { this.uniforms.sdr.value = value; }
    get gainMap() { return this.uniforms.gainMap.value; }
    set gainMap(value) { this.uniforms.gainMap.value = value; }
    /**
     * @see {@link GainMapMetadata.offsetHdr}
     */
    get offsetHdr() { return this.uniforms.offsetHdr.value.toArray(); }
    set offsetHdr(value) { this.uniforms.offsetHdr.value.fromArray(value); }
    /**
     * @see {@link GainMapMetadata.offsetSdr}
     */
    get offsetSdr() { return this.uniforms.offsetSdr.value.toArray(); }
    set offsetSdr(value) { this.uniforms.offsetSdr.value.fromArray(value); }
    /**
     * @see {@link GainMapMetadata.gainMapMin}
     */
    get gainMapMin() { return this.uniforms.gainMapMin.value.toArray(); }
    set gainMapMin(value) { this.uniforms.gainMapMin.value.fromArray(value); }
    /**
     * @see {@link GainMapMetadata.gainMapMax}
     */
    get gainMapMax() { return this.uniforms.gainMapMax.value.toArray(); }
    set gainMapMax(value) { this.uniforms.gainMapMax.value.fromArray(value); }
    /**
     * @see {@link GainMapMetadata.gamma}
     */
    get gamma() {
        const g = this.uniforms.gamma.value;
        return [1 / g.x, 1 / g.y, 1 / g.z];
    }
    set gamma(value) {
        const g = this.uniforms.gamma.value;
        g.x = 1.0 / value[0];
        g.y = 1.0 / value[1];
        g.z = 1.0 / value[2];
    }
    /**
     * @see {@link GainMapMetadata.hdrCapacityMin}
     * @remarks Logarithmic space
     */
    get hdrCapacityMin() { return this._hdrCapacityMin; }
    set hdrCapacityMin(value) {
        this._hdrCapacityMin = value;
        this.calculateWeight();
    }
    /**
     * @see {@link GainMapMetadata.hdrCapacityMin}
     * @remarks Logarithmic space
     */
    get hdrCapacityMax() { return this._hdrCapacityMax; }
    set hdrCapacityMax(value) {
        this._hdrCapacityMax = value;
        this.calculateWeight();
    }
    /**
     * @see {@link GainmapDecodingParameters.maxDisplayBoost}
     * @remarks Non Logarithmic space
     */
    get maxDisplayBoost() { return this._maxDisplayBoost; }
    set maxDisplayBoost(value) {
        this._maxDisplayBoost = Math.max(1, Math.min(65504, value));
        this.calculateWeight();
    }
    calculateWeight() {
        const val = (Math.log2(this._maxDisplayBoost) - this._hdrCapacityMin) / (this._hdrCapacityMax - this._hdrCapacityMin);
        this.uniforms.weightFactor.value = Math.max(0, Math.min(1, val));
    }
}

/**
 * Decodes a gain map using a WebGLRenderTarget
 *
 * @category Decoding Functions
 * @group Decoding Functions
 * @example
 * import { decode } from '@monogrid/gainmap-js'
 * import {
 *   Mesh,
 *   MeshBasicMaterial,
 *   PerspectiveCamera,
 *   PlaneGeometry,
 *   Scene,
 *   TextureLoader,
 *   WebGLRenderer
 * } from 'three'
 *
 * const renderer = new WebGLRenderer()
 *
 * const textureLoader = new TextureLoader()
 *
 * // load SDR Representation
 * const sdr = await textureLoader.loadAsync('sdr.jpg')
 * // load Gain map recovery image
 * const gainMap = await textureLoader.loadAsync('gainmap.jpg')
 * // load metadata
 * const metadata = await (await fetch('metadata.json')).json()
 *
 * const result = await decode({
 *   sdr,
 *   gainMap,
 *   // this allows to use `result.renderTarget.texture` directly
 *   renderer,
 *   // this will restore the full HDR range
 *   maxDisplayBoost: Math.pow(2, metadata.hdrCapacityMax),
 *   ...metadata
 * })
 *
 * const scene = new Scene()
 * // `result` can be used to populate a Texture
 * const mesh = new Mesh(
 *   new PlaneGeometry(),
 *   new MeshBasicMaterial({ map: result.renderTarget.texture })
 * )
 * scene.add(mesh)
 * renderer.render(scene, new PerspectiveCamera())
 *
 *
 * @param params
 * @returns
 * @throws {Error} if the WebGLRenderer fails to render the gain map
 */
const decode = (params) => {
    const { sdr, gainMap, renderer } = params;
    if (sdr.colorSpace !== SRGBColorSpace) {
        console.warn('SDR Colorspace needs to be *SRGBColorSpace*, setting it automatically');
        sdr.colorSpace = SRGBColorSpace;
    }
    sdr.needsUpdate = true;
    if (gainMap.colorSpace !== LinearSRGBColorSpace) {
        console.warn('Gainmap Colorspace needs to be *LinearSRGBColorSpace*');
        gainMap.colorSpace = LinearSRGBColorSpace;
    }
    gainMap.needsUpdate = true;
    const material = new GainMapDecoderMaterial({
        ...params,
        sdr,
        gainMap
    });
    // TODO: three types are generic, eslint complains here, see how we can solve
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    const quadRenderer = new QuadRenderer(sdr.image.width, sdr.image.height, HalfFloatType, LinearSRGBColorSpace, material, renderer);
    try {
        quadRenderer.render();
    }
    catch (e) {
        quadRenderer.dispose();
        throw e;
    }
    return quadRenderer;
};

const getAttribute = (description, name, defaultValue) => {
    var _a;
    let returnValue;
    const parsedValue = (_a = description.attributes.getNamedItem(name)) === null || _a === void 0 ? void 0 : _a.nodeValue;
    if (!parsedValue) {
        const node = description.getElementsByTagName(name)[0];
        if (node) {
            const values = node.getElementsByTagName('rdf:li');
            if (values.length === 3) {
                returnValue = Array.from(values).map(v => v.innerHTML);
            }
            else {
                throw new Error(`Gainmap metadata contains an array of items for ${name} but its length is not 3`);
            }
        }
        else {
            if (defaultValue)
                return defaultValue;
            else
                throw new Error(`Can't find ${name} in gainmap metadata`);
        }
    }
    else {
        returnValue = parsedValue;
    }
    return returnValue;
};
/**
 *
 * @param input
 * @returns
 */
const extractXMP = (input) => {
    var _a, _b;
    let str;
    // support node test evnvironment
    if (typeof TextDecoder !== 'undefined')
        str = new TextDecoder().decode(input);
    else
        str = input.toString();
    let start = str.indexOf('<x:xmpmeta');
    const parser = new DOMParser();
    while (start !== -1) {
        const end = str.indexOf('x:xmpmeta>', start);
        str.slice(start, end + 10);
        const xmpBlock = str.slice(start, end + 10);
        try {
            const xmlDocument = parser.parseFromString(xmpBlock, 'text/xml');
            const description = xmlDocument.getElementsByTagName('rdf:Description')[0];
            const gainMapMin = getAttribute(description, 'hdrgm:GainMapMin', '0');
            const gainMapMax = getAttribute(description, 'hdrgm:GainMapMax');
            const gamma = getAttribute(description, 'hdrgm:Gamma', '1');
            const offsetSDR = getAttribute(description, 'hdrgm:OffsetSDR', '0.015625');
            const offsetHDR = getAttribute(description, 'hdrgm:OffsetHDR', '0.015625');
            let hdrCapacityMin = (_a = description.attributes.getNamedItem('hdrgm:HDRCapacityMin')) === null || _a === void 0 ? void 0 : _a.nodeValue;
            if (!hdrCapacityMin)
                hdrCapacityMin = '0';
            const hdrCapacityMax = (_b = description.attributes.getNamedItem('hdrgm:HDRCapacityMax')) === null || _b === void 0 ? void 0 : _b.nodeValue;
            if (!hdrCapacityMax)
                throw new Error('Incomplete gainmap metadata');
            return {
                gainMapMin: Array.isArray(gainMapMin) ? gainMapMin.map(v => parseFloat(v)) : [parseFloat(gainMapMin), parseFloat(gainMapMin), parseFloat(gainMapMin)],
                gainMapMax: Array.isArray(gainMapMax) ? gainMapMax.map(v => parseFloat(v)) : [parseFloat(gainMapMax), parseFloat(gainMapMax), parseFloat(gainMapMax)],
                gamma: Array.isArray(gamma) ? gamma.map(v => parseFloat(v)) : [parseFloat(gamma), parseFloat(gamma), parseFloat(gamma)],
                offsetSdr: Array.isArray(offsetSDR) ? offsetSDR.map(v => parseFloat(v)) : [parseFloat(offsetSDR), parseFloat(offsetSDR), parseFloat(offsetSDR)],
                offsetHdr: Array.isArray(offsetHDR) ? offsetHDR.map(v => parseFloat(v)) : [parseFloat(offsetHDR), parseFloat(offsetHDR), parseFloat(offsetHDR)],
                hdrCapacityMin: parseFloat(hdrCapacityMin),
                hdrCapacityMax: parseFloat(hdrCapacityMax)
            };
        }
        catch (e) {
        }
        start = str.indexOf('<x:xmpmeta', end);
    }
};

/**
 * MPF Extractor (Multi Picture Format Extractor)
 * By Henrik S Nilsson 2019
 *
 * Extracts images stored in images based on the MPF format (found here: https://www.cipa.jp/e/std/std-sec.html
 * under "CIPA DC-007-Translation-2021 Multi-Picture Format"
 *
 * Overly commented, and without intention of being complete or production ready.
 * Created to extract depth maps from iPhone images, and to learn about image metadata.
 * Kudos to: Phil Harvey (exiftool), Jaume Sanchez (android-lens-blur-depth-extractor)
 */
class MPFExtractor {
    constructor(options) {
        this.options = {
            debug: options && options.debug !== undefined ? options.debug : false,
            extractFII: options && options.extractFII !== undefined ? options.extractFII : true,
            extractNonFII: options && options.extractNonFII !== undefined ? options.extractNonFII : true
        };
    }
    extract(imageArrayBuffer) {
        return new Promise((resolve, reject) => {
            const debug = this.options.debug;
            const dataView = new DataView(imageArrayBuffer.buffer);
            // If you're executing this line on a big endian machine, it'll be reversed.
            // bigEnd further down though, refers to the endianness of the image itself.
            if (dataView.getUint16(0) !== 0xffd8) {
                reject(new Error('Not a valid jpeg'));
                return;
            }
            const length = dataView.byteLength;
            let offset = 2;
            let loops = 0;
            let marker; // APP# marker
            while (offset < length) {
                if (++loops > 250) {
                    reject(new Error(`Found no marker after ${loops} loops 😵`));
                    return;
                }
                if (dataView.getUint8(offset) !== 0xff) {
                    reject(new Error(`Not a valid marker at offset 0x${offset.toString(16)}, found: 0x${dataView.getUint8(offset).toString(16)}`));
                    return;
                }
                marker = dataView.getUint8(offset + 1);
                if (debug)
                    console.log(`Marker: ${marker.toString(16)}`);
                if (marker === 0xe2) {
                    if (debug)
                        console.log('Found APP2 marker (0xffe2)');
                    // Works for iPhone 8 Plus, X, and XSMax. Or any photos of MPF format.
                    // Great way to visualize image information in html is using Exiftool. E.g.:
                    // ./exiftool.exe -htmldump -wantTrailer photo.jpg > photo.html
                    const formatPt = offset + 4;
                    /*
                     *  Structure of the MP Format Identifier
                     *
                     *  Offset Addr.  | Code (Hex)  | Description
                     *  +00             ff            Marker Prefix      <-- offset
                     *  +01             e2            APP2
                     *  +02             #n            APP2 Field Length
                     *  +03             #n            APP2 Field Length
                     *  +04             4d            'M'                <-- formatPt
                     *  +05             50            'P'
                     *  +06             46            'F'
                     *  +07             00            NULL
                     *                                                   <-- tiffOffset
                     */
                    if (dataView.getUint32(formatPt) === 0x4d504600) {
                        // Found MPF tag, so we start dig out sub images
                        const tiffOffset = formatPt + 4;
                        let bigEnd; // Endianness from TIFF header
                        // Test for TIFF validity and endianness
                        // 0x4949 and 0x4D4D ('II' and 'MM') marks Little Endian and Big Endian
                        if (dataView.getUint16(tiffOffset) === 0x4949) {
                            bigEnd = false;
                        }
                        else if (dataView.getUint16(tiffOffset) === 0x4d4d) {
                            bigEnd = true;
                        }
                        else {
                            reject(new Error('No valid endianness marker found in TIFF header'));
                            return;
                        }
                        if (dataView.getUint16(tiffOffset + 2, !bigEnd) !== 0x002a) {
                            reject(new Error('Not valid TIFF data! (no 0x002A marker)'));
                            return;
                        }
                        // 32 bit number stating the offset from the start of the 8 Byte MP Header
                        // to MP Index IFD Least possible value is thus 8 (means 0 offset)
                        const firstIFDOffset = dataView.getUint32(tiffOffset + 4, !bigEnd);
                        if (firstIFDOffset < 0x00000008) {
                            reject(new Error('Not valid TIFF data! (First offset less than 8)'));
                            return;
                        }
                        // Move ahead to MP Index IFD
                        // Assume we're at the first IFD, so firstIFDOffset points to
                        // MP Index IFD and not MP Attributes IFD. (If we try extract from a sub image,
                        // we fail silently here due to this assumption)
                        // Count (2 Byte) | MP Index Fields a.k.a. MP Entries (count * 12 Byte) | Offset of Next IFD (4 Byte)
                        const dirStart = tiffOffset + firstIFDOffset; // Start of IFD (Image File Directory)
                        const count = dataView.getUint16(dirStart, !bigEnd); // Count of MPEntries (2 Byte)
                        // Extract info from MPEntries (starting after Count)
                        const entriesStart = dirStart + 2;
                        let numberOfImages = 0;
                        for (let i = entriesStart; i < entriesStart + 12 * count; i += 12) {
                            // Each entry is 12 Bytes long
                            // Check MP Index IFD tags, here we only take tag 0xb001 = Number of images
                            if (dataView.getUint16(i, !bigEnd) === 0xb001) {
                                // stored in Last 4 bytes of its 12 Byte entry.
                                numberOfImages = dataView.getUint32(i + 8, !bigEnd);
                            }
                        }
                        const nextIFDOffsetLen = 4; // 4 Byte offset field that appears after MP Index IFD tags
                        const MPImageListValPt = dirStart + 2 + count * 12 + nextIFDOffsetLen;
                        const images = [];
                        for (let i = MPImageListValPt; i < MPImageListValPt + numberOfImages * 16; i += 16) {
                            const image = {
                                MPType: dataView.getUint32(i, !bigEnd),
                                size: dataView.getUint32(i + 4, !bigEnd),
                                // This offset is specified relative to the address of the MP Endian
                                // field in the MP Header, unless the image is a First Individual Image,
                                // in which case the value of the offset shall be NULL (0x00000000).
                                dataOffset: dataView.getUint32(i + 8, !bigEnd),
                                dependantImages: dataView.getUint32(i + 12, !bigEnd),
                                start: -1,
                                end: -1,
                                isFII: false
                            };
                            if (!image.dataOffset) {
                                // dataOffset is 0x00000000 for First Individual Image
                                image.start = 0;
                                image.isFII = true;
                            }
                            else {
                                image.start = tiffOffset + image.dataOffset;
                                image.isFII = false;
                            }
                            image.end = image.start + image.size;
                            images.push(image);
                        }
                        if (this.options.extractNonFII && images.length) {
                            const bufferBlob = new Blob([dataView]);
                            const imgs = [];
                            for (const image of images) {
                                if (image.isFII && !this.options.extractFII) {
                                    continue; // Skip FII
                                }
                                const imageBlob = bufferBlob.slice(image.start, image.end + 1, 'image/jpeg');
                                // we don't need this
                                // const imageUrl = URL.createObjectURL(imageBlob)
                                // image.img = document.createElement('img')
                                // image.img.src = imageUrl
                                imgs.push(imageBlob);
                            }
                            resolve(imgs);
                        }
                    }
                }
                offset += 2 + dataView.getUint16(offset + 2);
            }
        });
    }
}

/**
 * Extracts XMP Metadata and the gain map recovery image
 * from a single JPEG file.
 *
 * @category Decoding Functions
 * @group Decoding Functions
 * @param jpegFile an `Uint8Array` containing and encoded JPEG file
 * @returns an sdr `Uint8Array` compressed in JPEG, a gainMap `Uint8Array` compressed in JPEG and the XMP parsed XMP metadata
 * @throws Error if XMP Metadata is not found
 * @throws Error if Gain map image is not found
 * @example
 * import { FileLoader } from 'three'
 * import { extractGainmapFromJPEG } from '@monogrid/gainmap-js'
 *
 * const jpegFile = await new FileLoader()
 *  .setResponseType('arraybuffer')
 *  .loadAsync('image.jpg')
 *
 * const { sdr, gainMap, metadata } = extractGainmapFromJPEG(jpegFile)
 */
const extractGainmapFromJPEG = async (jpegFile) => {
    const metadata = extractXMP(jpegFile);
    if (!metadata)
        throw new Error('Gain map XMP metadata not found');
    const mpfExtractor = new MPFExtractor({ extractFII: true, extractNonFII: true });
    const images = await mpfExtractor.extract(jpegFile);
    if (images.length !== 2)
        throw new Error('Gain map recovery image not found');
    return {
        sdr: new Uint8Array(await images[0].arrayBuffer()),
        gainMap: new Uint8Array(await images[1].arrayBuffer()),
        metadata
    };
};

/**
 * private function, async get image from blob
 *
 * @param blob
 * @returns
 */
const getImage = (blob) => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = () => { resolve(img); };
        img.onerror = (e) => { reject(e); };
        img.src = URL.createObjectURL(blob);
    });
};
class LoaderBase extends Loader {
    /**
     *
     * @param renderer
     * @param manager
     */
    constructor(renderer, manager) {
        super(manager);
        this._renderer = renderer;
        this._internalLoadingManager = new LoadingManager();
    }
    /**
     * @private
     * @returns
     */
    prepareQuadRenderer() {
        // temporary values
        const material = new GainMapDecoderMaterial({
            gainMapMax: [1, 1, 1],
            gainMapMin: [0, 0, 0],
            gamma: [1, 1, 1],
            offsetHdr: [1, 1, 1],
            offsetSdr: [1, 1, 1],
            hdrCapacityMax: 1,
            hdrCapacityMin: 0,
            maxDisplayBoost: 1,
            gainMap: new Texture(),
            sdr: new Texture()
        });
        return new QuadRenderer(16, 16, HalfFloatType, LinearSRGBColorSpace, material, this._renderer);
    }
    /**
     *
     * @private
     * @param quadRenderer
     * @param gainMapBuffer
     * @param sdrBuffer
     * @param metadata
     */
    async render(quadRenderer, gainMapBuffer, sdrBuffer, metadata) {
        const gainMapBlob = new Blob([gainMapBuffer], { type: 'image/jpeg' });
        const sdrBlob = new Blob([sdrBuffer], { type: 'image/jpeg' });
        let sdrImage;
        let gainMapImage;
        let needsFlip = false;
        if (typeof createImageBitmap === 'undefined') {
            const res = await Promise.all([
                getImage(gainMapBlob),
                getImage(sdrBlob)
            ]);
            gainMapImage = res[0];
            sdrImage = res[1];
            needsFlip = true;
        }
        else {
            const res = await Promise.all([
                createImageBitmap(gainMapBlob, { imageOrientation: 'flipY' }),
                createImageBitmap(sdrBlob, { imageOrientation: 'flipY' })
            ]);
            gainMapImage = res[0];
            sdrImage = res[1];
        }
        const gainMap = new Texture(gainMapImage, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearMipMapLinearFilter, RGBAFormat, UnsignedByteType, 1, LinearSRGBColorSpace);
        gainMap.flipY = needsFlip;
        gainMap.needsUpdate = true;
        const sdr = new Texture(sdrImage, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearMipMapLinearFilter, RGBAFormat, UnsignedByteType, 1, SRGBColorSpace);
        sdr.flipY = needsFlip;
        sdr.needsUpdate = true;
        quadRenderer.width = sdrImage.width;
        quadRenderer.height = sdrImage.height;
        quadRenderer.material.gainMap = gainMap;
        quadRenderer.material.sdr = sdr;
        quadRenderer.material.gainMapMin = metadata.gainMapMin;
        quadRenderer.material.gainMapMax = metadata.gainMapMax;
        quadRenderer.material.offsetHdr = metadata.offsetHdr;
        quadRenderer.material.offsetSdr = metadata.offsetSdr;
        quadRenderer.material.gamma = metadata.gamma;
        quadRenderer.material.hdrCapacityMin = metadata.hdrCapacityMin;
        quadRenderer.material.hdrCapacityMax = metadata.hdrCapacityMax;
        quadRenderer.material.maxDisplayBoost = Math.pow(2, metadata.hdrCapacityMax);
        quadRenderer.material.needsUpdate = true;
        quadRenderer.render();
    }
}

/**
 * A Three.js Loader for the gain map format.
 *
 * @category Loaders
 * @group Loaders
 *
 * @example
 * import { GainMapLoader } from '@monogrid/gainmap-js'
 * import {
 *   EquirectangularReflectionMapping,
 *   LinearFilter,
 *   Mesh,
 *   MeshBasicMaterial,
 *   PerspectiveCamera,
 *   PlaneGeometry,
 *   Scene,
 *   WebGLRenderer
 * } from 'three'
 *
 * const renderer = new WebGLRenderer()
 *
 * const loader = new GainMapLoader(renderer)
 *
 * const result = loader.load(['sdr.jpeg', 'gainmap.jpeg', 'metadata.json'])
 * // `result` can be used to populate a Texture
 *
 * const scene = new Scene()
 * const mesh = new Mesh(
 *   new PlaneGeometry(),
 *   new MeshBasicMaterial({ map: result.renderTarget.texture })
 * )
 * scene.add(mesh)
 * renderer.render(scene, new PerspectiveCamera())
 *
 * // `result.renderTarget.texture` must be
 * // converted to `DataTexture` in order
 * // to use it as Equirectangular scene background
 * // if needed
 *
 * scene.background = result.toDataTexture()
 * scene.background.mapping = EquirectangularReflectionMapping
 * scene.background.minFilter = LinearFilter
 *
 */
class GainMapLoader extends LoaderBase {
    /**
     * Loads a gainmap using separate data
     * * sdr image
     * * gain map image
     * * metadata json
     *
     * useful for webp gain maps
     *
     * @param urls An array in the form of [sdr.jpg, gainmap.jpg, metadata.json]
     * @param onLoad Load complete callback, will receive the result
     * @param onProgress Progress callback, will receive a {@link ProgressEvent}
     * @param onError Error callback
     * @returns
     */
    load([sdrUrl, gainMapUrl, metadataUrl], onLoad, onProgress, onError) {
        const quadRenderer = this.prepareQuadRenderer();
        let sdr;
        let gainMap;
        let metadata;
        const loadCheck = async () => {
            if (sdr && gainMap && metadata) {
                await this.render(quadRenderer, gainMap, sdr, metadata);
                if (typeof onLoad === 'function')
                    onLoad(quadRenderer);
                this.manager.itemEnd(sdrUrl);
                this.manager.itemEnd(gainMapUrl);
                this.manager.itemEnd(metadataUrl);
                quadRenderer.dispose();
            }
        };
        let sdrLengthComputable = true;
        let sdrTotal = 0;
        let sdrLoaded = 0;
        let gainMapLengthComputable = true;
        let gainMapTotal = 0;
        let gainMapLoaded = 0;
        let metadataLengthComputable = true;
        let metadataTotal = 0;
        let metadataLoaded = 0;
        const progressHandler = () => {
            if (typeof onProgress === 'function') {
                const total = sdrTotal + gainMapTotal + metadataTotal;
                const loaded = sdrLoaded + gainMapLoaded + metadataLoaded;
                const lengthComputable = sdrLengthComputable && gainMapLengthComputable && metadataLengthComputable;
                onProgress(new ProgressEvent('progress', { lengthComputable, loaded, total }));
            }
        };
        this.manager.itemStart(sdrUrl);
        this.manager.itemStart(gainMapUrl);
        this.manager.itemStart(metadataUrl);
        const sdrLoader = new FileLoader(this._internalLoadingManager);
        sdrLoader.setResponseType('arraybuffer');
        sdrLoader.setRequestHeader(this.requestHeader);
        sdrLoader.setPath(this.path);
        sdrLoader.setWithCredentials(this.withCredentials);
        sdrLoader.load(sdrUrl, async (buffer) => {
            if (typeof buffer === 'string')
                throw new Error('Invalid sdr buffer');
            sdr = buffer;
            await loadCheck();
        }, (e) => {
            sdrLengthComputable = e.lengthComputable;
            sdrLoaded = e.loaded;
            sdrTotal = e.total;
            progressHandler();
        }, (error) => {
            this.manager.itemError(sdrUrl);
            if (typeof onError === 'function')
                onError(error);
        });
        const gainMapLoader = new FileLoader(this._internalLoadingManager);
        gainMapLoader.setResponseType('arraybuffer');
        gainMapLoader.setRequestHeader(this.requestHeader);
        gainMapLoader.setPath(this.path);
        gainMapLoader.setWithCredentials(this.withCredentials);
        gainMapLoader.load(gainMapUrl, async (buffer) => {
            if (typeof buffer === 'string')
                throw new Error('Invalid gainmap buffer');
            gainMap = buffer;
            await loadCheck();
        }, (e) => {
            gainMapLengthComputable = e.lengthComputable;
            gainMapLoaded = e.loaded;
            gainMapTotal = e.total;
            progressHandler();
        }, (error) => {
            this.manager.itemError(gainMapUrl);
            if (typeof onError === 'function')
                onError(error);
        });
        const metadataLoader = new FileLoader(this._internalLoadingManager);
        // metadataLoader.setResponseType('json')
        metadataLoader.setRequestHeader(this.requestHeader);
        metadataLoader.setPath(this.path);
        metadataLoader.setWithCredentials(this.withCredentials);
        metadataLoader.load(metadataUrl, async (json) => {
            if (typeof json !== 'string')
                throw new Error('Invalid metadata string');
            // TODO: implement check on JSON file and remove this eslint disable
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            metadata = JSON.parse(json);
            await loadCheck();
        }, (e) => {
            metadataLengthComputable = e.lengthComputable;
            metadataLoaded = e.loaded;
            metadataTotal = e.total;
            progressHandler();
        }, (error) => {
            this.manager.itemError(metadataUrl);
            if (typeof onError === 'function')
                onError(error);
        });
        return quadRenderer;
    }
}

/**
 * A Three.js Loader for a JPEG with embedded gainmap metadata.
 *
 * @category Loaders
 * @group Loaders
 *
 * @example
 * import { JPEGRLoader } from '@monogrid/gainmap-js'
 * import {
 *   EquirectangularReflectionMapping,
 *   LinearFilter,
 *   Mesh,
 *   MeshBasicMaterial,
 *   PerspectiveCamera,
 *   PlaneGeometry,
 *   Scene,
 *   WebGLRenderer
 * } from 'three'
 *
 * const renderer = new WebGLRenderer()
 *
 * const loader = new JPEGRLoader(renderer)
 *
 * const result = loader.load('gainmap.jpeg')
 * // `result` can be used to populate a Texture
 *
 * const scene = new Scene()
 * const mesh = new Mesh(
 *   new PlaneGeometry(),
 *   new MeshBasicMaterial({ map: result.renderTarget.texture })
 * )
 * scene.add(mesh)
 * renderer.render(scene, new PerspectiveCamera())
 *
 * // `result.renderTarget.texture` must be
 * // converted to `DataTexture` in order
 * // to use it as Equirectangular scene background
 * // if needed
 *
 * scene.background = result.toDataTexture()
 * scene.background.mapping = EquirectangularReflectionMapping
 * scene.background.minFilter = LinearFilter

 *
 */
class HDRJPGLoader extends LoaderBase {
    /**
     * Loads a JPEGR Image
     *
     * @param url An array in the form of [sdr.jpg, gainmap.jpg, metadata.json]
     * @param onLoad Load complete callback, will receive the result
     * @param onProgress Progress callback, will receive a {@link ProgressEvent}
     * @param onError Error callback
     * @returns
     */
    load(url, onLoad, onProgress, onError) {
        const quadRenderer = this.prepareQuadRenderer();
        const loader = new FileLoader(this._internalLoadingManager);
        loader.setResponseType('arraybuffer');
        loader.setRequestHeader(this.requestHeader);
        loader.setPath(this.path);
        loader.setWithCredentials(this.withCredentials);
        this.manager.itemStart(url);
        loader.load(url, async (jpeg) => {
            if (typeof jpeg === 'string')
                throw new Error('Invalid buffer');
            const { gainMap: gainMapJPEG, sdr: sdrJPEG, metadata } = await extractGainmapFromJPEG(new Uint8Array(jpeg));
            await this.render(quadRenderer, gainMapJPEG, sdrJPEG, metadata);
            if (typeof onLoad === 'function')
                onLoad(quadRenderer);
            this.manager.itemEnd(url);
            quadRenderer.dispose();
        }, onProgress, (error) => {
            this.manager.itemError(url);
            if (typeof onError === 'function')
                onError(error);
        });
        return quadRenderer;
    }
}

export { GainMapDecoderMaterial, GainMapLoader, HDRJPGLoader, HDRJPGLoader as JPEGRLoader, QuadRenderer, decode, extractGainmapFromJPEG };








/**
 * @monogrid/gainmap-js v2.0.5
 * With ❤️, by MONOGRID <hello@mono-grid.com>
 */

const getBufferForType = (type, width, height) => {
    let out;
    switch (type) {
        case UnsignedByteType:
            out = new Uint8ClampedArray(width * height * 4);
            break;
        case HalfFloatType:
            out = new Uint16Array(width * height * 4);
            break;
        case UnsignedIntType:
            out = new Uint32Array(width * height * 4);
            break;
        case ByteType:
            out = new Int8Array(width * height * 4);
            break;
        case ShortType:
            out = new Int16Array(width * height * 4);
            break;
        case IntType:
            out = new Int32Array(width * height * 4);
            break;
        case FloatType:
            out = new Float32Array(width * height * 4);
            break;
        default:
            throw new Error('Unsupported data type');
    }
    return out;
};
let _canReadPixelsResult;
/**
 * Test if this browser implementation can correctly read pixels from the specified
 * Render target type.
 *
 * Runs only once
 *
 * @param type
 * @param renderer
 * @param camera
 * @returns
 */
const canReadPixels = (type, renderer, camera) => {
    if (_canReadPixelsResult !== undefined)
        return _canReadPixelsResult;
    const testRT = new WebGLRenderTarget(1, 1, {
        type,
        colorSpace: LinearSRGBColorSpace,
        format: RGBAFormat,
        magFilter: LinearFilter,
        minFilter: LinearFilter,
        wrapS: RepeatWrapping,
        wrapT: RepeatWrapping,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: true
    });
    renderer.setRenderTarget(testRT);
    const mesh = new Mesh(new PlaneGeometry(), new MeshBasicMaterial({ color: 0xffffff }));
    renderer.render(mesh, camera);
    renderer.setRenderTarget(null);
    const out = getBufferForType(type, testRT.width, testRT.height);
    renderer.readRenderTargetPixels(testRT, 0, 0, testRT.width, testRT.height, out);
    testRT.dispose();
    mesh.geometry.dispose();
    mesh.material.dispose();
    _canReadPixelsResult = out[0] !== 0;
    return _canReadPixelsResult;
};
/**
 * Utility class used for rendering a texture with a material
 *
 * @category Core
 * @group Core
 */
class QuadRenderer {
    /**
     *
     * @param sourceTexture
     * @param renderer
     */
    constructor(width, height, type, colorSpace, material, renderer) {
        this._rendererIsDisposable = false;
        this._supportsReadPixels = true;
        /**
         * Renders the input texture using the specified material
         */
        this.render = () => {
            this._renderer.setRenderTarget(this._renderTarget);
            try {
                this._renderer.render(this._scene, this._camera);
            }
            catch (e) {
                this._renderer.setRenderTarget(null);
                throw e;
            }
            this._renderer.setRenderTarget(null);
        };
        this._width = width;
        this._height = height;
        this._type = type;
        this._colorSpace = colorSpace;
        this._material = material;
        if (renderer) {
            this._renderer = renderer;
        }
        else {
            this._renderer = QuadRenderer.instantiateRenderer();
            this._rendererIsDisposable = true;
        }
        this._scene = new Scene();
        this._camera = new OrthographicCamera();
        this._camera.position.set(0, 0, 10);
        this._camera.left = -0.5;
        this._camera.right = 0.5;
        this._camera.top = 0.5;
        this._camera.bottom = -0.5;
        this._camera.updateProjectionMatrix();
        if (!canReadPixels(this._type, this._renderer, this._camera)) {
            let alternativeType;
            switch (this._type) {
                case HalfFloatType:
                    alternativeType = this._renderer.extensions.has('EXT_color_buffer_float') ? FloatType : undefined;
                    break;
            }
            if (alternativeType !== undefined) {
                console.warn(`This browser does not support reading pixels from ${this._type} RenderTargets, switching to ${FloatType}`);
                this._type = alternativeType;
            }
            else {
                this._supportsReadPixels = false;
                console.warn('This browser dos not support toArray or toDataTexture, calls to those methods will result in an error thrown');
            }
        }
        this._quad = new Mesh(new PlaneGeometry(), this._material);
        this._quad.geometry.computeBoundingBox();
        this._scene.add(this._quad);
        this._renderTarget = new WebGLRenderTarget(width, height, {
            type: this._type,
            colorSpace,
            format: RGBAFormat,
            magFilter: LinearFilter,
            minFilter: LinearMipMapLinearFilter,
            wrapS: RepeatWrapping,
            wrapT: RepeatWrapping,
            depthBuffer: false,
            stencilBuffer: false,
            generateMipmaps: true
        });
    }
    /**
     * Instantiates a temporary renderer
     *
     * @returns
     */
    static instantiateRenderer() {
        const renderer = new WebGLRenderer();
        renderer.setSize(128, 128);
        // renderer.outputColorSpace = SRGBColorSpace
        // renderer.toneMapping = LinearToneMapping
        // renderer.debug.checkShaderErrors = false
        // this._rendererIsDisposable = true
        return renderer;
    }
    /**
     * Obtains a Buffer containing the rendered texture.
     *
     * @throws Error if the browser cannot read pixels from this RenderTarget type.
     * @returns a TypedArray containing RGBA values from this renderer
     */
    toArray() {
        if (!this._supportsReadPixels)
            throw new Error('Can\'t read pixels in this browser');
        const out = getBufferForType(this._type, this._width, this._height);
        this._renderer.readRenderTargetPixels(this._renderTarget, 0, 0, this._width, this._height, out);
        return out;
    }
    toDataTexture() {
        return new DataTexture(this.toArray(), this.width, this.height, RGBAFormat, this._type, UVMapping, RepeatWrapping, RepeatWrapping, LinearFilter, LinearMipMapLinearFilter, 1, LinearSRGBColorSpace);
    }
    /**
     * If using a disposable renderer, it will dispose it.
     */
    dispose() {
        this._renderer.setRenderTarget(null);
        if (this._rendererIsDisposable) {
            this._renderer.dispose();
            this._renderer.forceContextLoss();
        }
    }
    /**
     * Width of the texture
     */
    get width() { return this._width; }
    set width(value) {
        this._width = value;
        this._renderTarget.setSize(this._width, this._height);
    }
    /**
     * Height of the texture
     */
    get height() { return this._height; }
    set height(value) {
        this._height = value;
        this._renderTarget.setSize(this._width, this._height);
    }
    /**
     * The renderer used
     */
    get renderer() { return this._renderer; }
    /**
     * The `WebGLRenderTarget` used.
     */
    get renderTarget() { return this._renderTarget; }
    set renderTarget(value) {
        this._renderTarget = value;
        this._width = value.width;
        this._height = value.height;
        // this._type = value.texture.type
    }
    /**
     * The `Material` used.
     */
    get material() { return this._material; }
    /**
     *
     */
    get type() { return this._type; }
    get colorSpace() { return this._colorSpace; }
}

export { QuadRenderer as Q };