/* webgl-memory@1.1.2, license MIT */
(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
})((function () { 'use strict';

  /* PixelFormat */
  const ALPHA                          = 0x1906;
  const RGB                            = 0x1907;
  const RGBA                           = 0x1908;
  const LUMINANCE                      = 0x1909;
  const LUMINANCE_ALPHA                = 0x190A;
  const DEPTH_COMPONENT                = 0x1902;
  const DEPTH_STENCIL                  = 0x84F9;

  const R8                           = 0x8229;
  const R8_SNORM                     = 0x8F94;
  const R16F                         = 0x822D;
  const R32F                         = 0x822E;
  const R8UI                         = 0x8232;
  const R8I                          = 0x8231;
  const RG16UI                       = 0x823A;
  const RG16I                        = 0x8239;
  const RG32UI                       = 0x823C;
  const RG32I                        = 0x823B;
  const RG8                          = 0x822B;
  const RG8_SNORM                    = 0x8F95;
  const RG16F                        = 0x822F;
  const RG32F                        = 0x8230;
  const RG8UI                        = 0x8238;
  const RG8I                         = 0x8237;
  const R16UI                        = 0x8234;
  const R16I                         = 0x8233;
  const R32UI                        = 0x8236;
  const R32I                         = 0x8235;
  const RGB8                         = 0x8051;
  const SRGB8                        = 0x8C41;
  const RGB565                       = 0x8D62;
  const RGB8_SNORM                   = 0x8F96;
  const R11F_G11F_B10F               = 0x8C3A;
  const RGB9_E5                      = 0x8C3D;
  const RGB16F                       = 0x881B;
  const RGB32F                       = 0x8815;
  const RGB8UI                       = 0x8D7D;
  const RGB8I                        = 0x8D8F;
  const RGB16UI                      = 0x8D77;
  const RGB16I                       = 0x8D89;
  const RGB32UI                      = 0x8D71;
  const RGB32I                       = 0x8D83;
  const RGBA8                        = 0x8058;
  const SRGB8_ALPHA8                 = 0x8C43;
  const RGBA8_SNORM                  = 0x8F97;
  const RGB5_A1                      = 0x8057;
  const RGBA4                        = 0x8056;
  const RGB10_A2                     = 0x8059;
  const RGBA16F                      = 0x881A;
  const RGBA32F                      = 0x8814;
  const RGBA8UI                      = 0x8D7C;
  const RGBA8I                       = 0x8D8E;
  const RGB10_A2UI                   = 0x906F;
  const RGBA16UI                     = 0x8D76;
  const RGBA16I                      = 0x8D88;
  const RGBA32I                      = 0x8D82;
  const RGBA32UI                     = 0x8D70;

  const DEPTH_COMPONENT16            = 0x81A5;
  const DEPTH_COMPONENT24            = 0x81A6;
  const DEPTH_COMPONENT32F           = 0x8CAC;
  const DEPTH32F_STENCIL8            = 0x8CAD;
  const DEPTH24_STENCIL8             = 0x88F0;
  const STENCIL_INDEX8               = 0x8d48;

  /* DataType */
  // const BYTE                         = 0x1400;
  const UNSIGNED_BYTE                = 0x1401;
  // const SHORT                        = 0x1402;
  const UNSIGNED_SHORT               = 0x1403;
  // const INT                          = 0x1404;
  const UNSIGNED_INT                 = 0x1405;
  const FLOAT                        = 0x1406;
  const UNSIGNED_SHORT_4_4_4_4       = 0x8033;
  const UNSIGNED_SHORT_5_5_5_1       = 0x8034;
  const UNSIGNED_SHORT_5_6_5         = 0x8363;
  const HALF_FLOAT                   = 0x140B;
  const HALF_FLOAT_OES               = 0x8D61;  // Thanks Khronos for making this different >:(

  const SRGB_ALPHA_EXT               = 0x8C42;

  /**
   * @typedef {Object} TextureFormatDetails
   * @property {number} textureFormat format to pass texImage2D and similar functions.
   * @property {boolean} colorRenderable true if you can render to this format of texture.
   * @property {boolean} textureFilterable true if you can filter the texture, false if you can ony use `NEAREST`.
   * @property {number[]} type Array of possible types you can pass to texImage2D and similar function
   * @property {Object.<number,number>} bytesPerElementMap A map of types to bytes per element
   * @private
   */

  let s_textureInternalFormatInfo;
  function getTextureInternalFormatInfo(internalFormat) {
    if (!s_textureInternalFormatInfo) {
      // NOTE: these properties need unique names so we can let Uglify mangle the name.
      const t = {};
      // unsized formats
      t[ALPHA]              = { bytesPerElement: [1, 2, 2, 4],        type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT], };
      t[LUMINANCE]          = { bytesPerElement: [1, 2, 2, 4],        type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT], };
      t[LUMINANCE_ALPHA]    = { bytesPerElement: [2, 4, 4, 8],        type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT], };
      t[RGB]                = { bytesPerElement: [3, 6, 6, 12, 2],    type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT, UNSIGNED_SHORT_5_6_5], };
      t[RGBA]               = { bytesPerElement: [4, 8, 8, 16, 2, 2], type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1], };
      t[SRGB_ALPHA_EXT]     = { bytesPerElement: [4, 8, 8, 16, 2, 2], type: [UNSIGNED_BYTE, HALF_FLOAT, HALF_FLOAT_OES, FLOAT, UNSIGNED_SHORT_4_4_4_4, UNSIGNED_SHORT_5_5_5_1], };
      t[DEPTH_COMPONENT]    = { bytesPerElement: [2, 4],              type: [UNSIGNED_INT, UNSIGNED_SHORT], };
      t[DEPTH_STENCIL]      = { bytesPerElement: [4],                 };

      // sized formats
      t[R8]                 = { bytesPerElement: [1],  };
      t[R8_SNORM]           = { bytesPerElement: [1],  };
      t[R16F]               = { bytesPerElement: [2],  };
      t[R32F]               = { bytesPerElement: [4],  };
      t[R8UI]               = { bytesPerElement: [1],  };
      t[R8I]                = { bytesPerElement: [1],  };
      t[R16UI]              = { bytesPerElement: [2],  };
      t[R16I]               = { bytesPerElement: [2],  };
      t[R32UI]              = { bytesPerElement: [4],  };
      t[R32I]               = { bytesPerElement: [4],  };
      t[RG8]                = { bytesPerElement: [2],  };
      t[RG8_SNORM]          = { bytesPerElement: [2],  };
      t[RG16F]              = { bytesPerElement: [4],  };
      t[RG32F]              = { bytesPerElement: [8],  };
      t[RG8UI]              = { bytesPerElement: [2],  };
      t[RG8I]               = { bytesPerElement: [2],  };
      t[RG16UI]             = { bytesPerElement: [4],  };
      t[RG16I]              = { bytesPerElement: [4],  };
      t[RG32UI]             = { bytesPerElement: [8],  };
      t[RG32I]              = { bytesPerElement: [8],  };
      t[RGB8]               = { bytesPerElement: [3],  };
      t[SRGB8]              = { bytesPerElement: [3],  };
      t[RGB565]             = { bytesPerElement: [2],  };
      t[RGB8_SNORM]         = { bytesPerElement: [3],  };
      t[R11F_G11F_B10F]     = { bytesPerElement: [4],  };
      t[RGB9_E5]            = { bytesPerElement: [4],  };
      t[RGB16F]             = { bytesPerElement: [6],  };
      t[RGB32F]             = { bytesPerElement: [12], };
      t[RGB8UI]             = { bytesPerElement: [3],  };
      t[RGB8I]              = { bytesPerElement: [3],  };
      t[RGB16UI]            = { bytesPerElement: [6],  };
      t[RGB16I]             = { bytesPerElement: [6],  };
      t[RGB32UI]            = { bytesPerElement: [12], };
      t[RGB32I]             = { bytesPerElement: [12], };
      t[RGBA8]              = { bytesPerElement: [4],  };
      t[SRGB8_ALPHA8]       = { bytesPerElement: [4],  };
      t[RGBA8_SNORM]        = { bytesPerElement: [4],  };
      t[RGB5_A1]            = { bytesPerElement: [2],  };
      t[RGBA4]              = { bytesPerElement: [2],  };
      t[RGB10_A2]           = { bytesPerElement: [4],  };
      t[RGBA16F]            = { bytesPerElement: [8],  };
      t[RGBA32F]            = { bytesPerElement: [16], };
      t[RGBA8UI]            = { bytesPerElement: [4],  };
      t[RGBA8I]             = { bytesPerElement: [4],  };
      t[RGB10_A2UI]         = { bytesPerElement: [4],  };
      t[RGBA16UI]           = { bytesPerElement: [8],  };
      t[RGBA16I]            = { bytesPerElement: [8],  };
      t[RGBA32I]            = { bytesPerElement: [16], };
      t[RGBA32UI]           = { bytesPerElement: [16], };
      // Sized Internal
      t[DEPTH_COMPONENT16]  = { bytesPerElement: [2],  };
      t[DEPTH_COMPONENT24]  = { bytesPerElement: [4],  };
      t[DEPTH_COMPONENT32F] = { bytesPerElement: [4],  };
      t[DEPTH24_STENCIL8]   = { bytesPerElement: [4],  };
      t[DEPTH32F_STENCIL8]  = { bytesPerElement: [4],  };
      t[STENCIL_INDEX8]     = { bytesPerElement: [1],  };

      s_textureInternalFormatInfo = t;
    }
    return s_textureInternalFormatInfo[internalFormat];
  }

  function makeComputeBlockRectSizeFunction(blockWidth, blockHeight, bytesPerBlock) {
    return function(width, height, depth) {
      const blocksAcross = (width + blockWidth - 1) / blockWidth | 0;
      const blocksDown =  (height + blockHeight - 1) / blockHeight | 0;
      return blocksAcross * blocksDown * bytesPerBlock * depth;
    };
  }

  function makeComputePaddedRectSizeFunction(minWidth, minHeight, divisor) {
    return function(width, height, depth) {
      return (Math.max(width, minWidth) * Math.max(height, minHeight) / divisor | 0) * depth;
    };
  }

  // WEBGL_compressed_texture_s3tc
  const COMPRESSED_RGB_S3TC_DXT1_EXT        = 0x83F0;
  const COMPRESSED_RGBA_S3TC_DXT1_EXT       = 0x83F1;
  const COMPRESSED_RGBA_S3TC_DXT3_EXT       = 0x83F2;
  const COMPRESSED_RGBA_S3TC_DXT5_EXT       = 0x83F3;
  // WEBGL_compressed_texture_etc1
  const COMPRESSED_RGB_ETC1_WEBGL           = 0x8D64;
  // WEBGL_compressed_texture_pvrtc
  const COMPRESSED_RGB_PVRTC_4BPPV1_IMG      = 0x8C00;
  const COMPRESSED_RGB_PVRTC_2BPPV1_IMG      = 0x8C01;
  const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG     = 0x8C02;
  const COMPRESSED_RGBA_PVRTC_2BPPV1_IMG     = 0x8C03;
  // WEBGL_compressed_texture_etc
  const COMPRESSED_R11_EAC                        = 0x9270;
  const COMPRESSED_SIGNED_R11_EAC                 = 0x9271;
  const COMPRESSED_RG11_EAC                       = 0x9272;
  const COMPRESSED_SIGNED_RG11_EAC                = 0x9273;
  const COMPRESSED_RGB8_ETC2                      = 0x9274;
  const COMPRESSED_SRGB8_ETC2                     = 0x9275;
  const COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2  = 0x9276;
  const COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9277;
  const COMPRESSED_RGBA8_ETC2_EAC                 = 0x9278;
  const COMPRESSED_SRGB8_ALPHA8_ETC2_EAC          = 0x9279;
  // WEBGL_compressed_texture_astc
  const COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;
  const COMPRESSED_RGBA_ASTC_5x4_KHR = 0x93B1;
  const COMPRESSED_RGBA_ASTC_5x5_KHR = 0x93B2;
  const COMPRESSED_RGBA_ASTC_6x5_KHR = 0x93B3;
  const COMPRESSED_RGBA_ASTC_6x6_KHR = 0x93B4;
  const COMPRESSED_RGBA_ASTC_8x5_KHR = 0x93B5;
  const COMPRESSED_RGBA_ASTC_8x6_KHR = 0x93B6;
  const COMPRESSED_RGBA_ASTC_8x8_KHR = 0x93B7;
  const COMPRESSED_RGBA_ASTC_10x5_KHR = 0x93B8;
  const COMPRESSED_RGBA_ASTC_10x6_KHR = 0x93B9;
  const COMPRESSED_RGBA_ASTC_10x8_KHR = 0x93BA;
  const COMPRESSED_RGBA_ASTC_10x10_KHR = 0x93BB;
  const COMPRESSED_RGBA_ASTC_12x10_KHR = 0x93BC;
  const COMPRESSED_RGBA_ASTC_12x12_KHR = 0x93BD;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR = 0x93D0;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR = 0x93D1;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR = 0x93D2;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR = 0x93D3;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR = 0x93D4;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR = 0x93D5;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR = 0x93D6;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR = 0x93D7;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR = 0x93D8;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR = 0x93D9;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR = 0x93DA;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR = 0x93DB;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR = 0x93DC;
  const COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR = 0x93DD;
  // WEBGL_compressed_texture_s3tc_srgb
  const COMPRESSED_SRGB_S3TC_DXT1_EXT        = 0x8C4C;
  const COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT  = 0x8C4D;
  const COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT  = 0x8C4E;
  const COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT  = 0x8C4F;
  // EXT_texture_compression_bptc
  const COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8E8C;
  const COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT = 0x8E8D;
  const COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT = 0x8E8E;
  const COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT = 0x8E8F;
  // EXT_texture_compression_rgtc
  const COMPRESSED_RED_RGTC1_EXT = 0x8DBB;
  const COMPRESSED_SIGNED_RED_RGTC1_EXT = 0x8DBC;
  const COMPRESSED_RED_GREEN_RGTC2_EXT = 0x8DBD;
  const COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT = 0x8DBE;

  const compressedTextureFunctions = new Map([
    [ COMPRESSED_RGB_S3TC_DXT1_EXT, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_RGBA_S3TC_DXT1_EXT, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_RGBA_S3TC_DXT3_EXT, makeComputeBlockRectSizeFunction(4, 4, 16) ],
    [ COMPRESSED_RGBA_S3TC_DXT5_EXT, makeComputeBlockRectSizeFunction(4, 4, 16) ],

    [ COMPRESSED_RGB_ETC1_WEBGL, makeComputeBlockRectSizeFunction(4, 4, 8) ],

    [ COMPRESSED_RGB_PVRTC_4BPPV1_IMG, makeComputePaddedRectSizeFunction(8, 8, 2) ],
    [ COMPRESSED_RGBA_PVRTC_4BPPV1_IMG, makeComputePaddedRectSizeFunction(8, 8, 2) ],
    [ COMPRESSED_RGB_PVRTC_2BPPV1_IMG, makeComputePaddedRectSizeFunction(16, 8, 4) ],
    [ COMPRESSED_RGBA_PVRTC_2BPPV1_IMG, makeComputePaddedRectSizeFunction(16, 8, 4) ],

    [ COMPRESSED_R11_EAC, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_SIGNED_R11_EAC, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_RGB8_ETC2, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_SRGB8_ETC2, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2, makeComputeBlockRectSizeFunction(4, 4, 8) ],

    [ COMPRESSED_RG11_EAC, makeComputeBlockRectSizeFunction(4, 4, 16) ],
    [ COMPRESSED_SIGNED_RG11_EAC, makeComputeBlockRectSizeFunction(4, 4, 16) ],
    [ COMPRESSED_RGBA8_ETC2_EAC, makeComputeBlockRectSizeFunction(4, 4, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ETC2_EAC, makeComputeBlockRectSizeFunction(4, 4, 16) ],

    [ COMPRESSED_RGBA_ASTC_4x4_KHR, makeComputeBlockRectSizeFunction(4, 4, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR, makeComputeBlockRectSizeFunction(4, 4, 16) ],
    [ COMPRESSED_RGBA_ASTC_5x4_KHR, makeComputeBlockRectSizeFunction(5, 4, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR, makeComputeBlockRectSizeFunction(5, 4, 16) ],
    [ COMPRESSED_RGBA_ASTC_5x5_KHR, makeComputeBlockRectSizeFunction(5, 5, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR, makeComputeBlockRectSizeFunction(5, 5, 16) ],
    [ COMPRESSED_RGBA_ASTC_6x5_KHR, makeComputeBlockRectSizeFunction(6, 5, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR, makeComputeBlockRectSizeFunction(6, 5, 16) ],
    [ COMPRESSED_RGBA_ASTC_6x6_KHR, makeComputeBlockRectSizeFunction(6, 6, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR, makeComputeBlockRectSizeFunction(6, 6, 16) ],
    [ COMPRESSED_RGBA_ASTC_8x5_KHR, makeComputeBlockRectSizeFunction(8, 5, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR, makeComputeBlockRectSizeFunction(8, 5, 16) ],
    [ COMPRESSED_RGBA_ASTC_8x6_KHR, makeComputeBlockRectSizeFunction(8, 6, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR, makeComputeBlockRectSizeFunction(8, 6, 16) ],
    [ COMPRESSED_RGBA_ASTC_8x8_KHR, makeComputeBlockRectSizeFunction(8, 8, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR, makeComputeBlockRectSizeFunction(8, 8, 16) ],
    [ COMPRESSED_RGBA_ASTC_10x5_KHR, makeComputeBlockRectSizeFunction(10, 5, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR, makeComputeBlockRectSizeFunction(10, 5, 16) ],
    [ COMPRESSED_RGBA_ASTC_10x6_KHR, makeComputeBlockRectSizeFunction(10, 6, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR, makeComputeBlockRectSizeFunction(10, 6, 16) ],
    [ COMPRESSED_RGBA_ASTC_10x8_KHR, makeComputeBlockRectSizeFunction(10, 8, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR, makeComputeBlockRectSizeFunction(10, 8, 16) ],
    [ COMPRESSED_RGBA_ASTC_10x10_KHR, makeComputeBlockRectSizeFunction(10, 10, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR, makeComputeBlockRectSizeFunction(10, 10, 16) ],
    [ COMPRESSED_RGBA_ASTC_12x10_KHR, makeComputeBlockRectSizeFunction(12, 10, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR, makeComputeBlockRectSizeFunction(12, 10, 16) ],
    [ COMPRESSED_RGBA_ASTC_12x12_KHR, makeComputeBlockRectSizeFunction(12, 12, 16) ],
    [ COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR, makeComputeBlockRectSizeFunction(12, 12, 16) ],

    [ COMPRESSED_SRGB_S3TC_DXT1_EXT, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT, makeComputeBlockRectSizeFunction(4, 4, 8) ],
    [ COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT, makeComputeBlockRectSizeFunction(4, 4, 16) ],
    [ COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT, makeComputeBlockRectSizeFunction(4, 4, 16) ],

    [ COMPRESSED_RGBA_BPTC_UNORM_EXT, makeComputeBlockRectSizeFunction( 4, 4, 16 ) ],
    [ COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT, makeComputeBlockRectSizeFunction( 4, 4, 16 ) ],
    [ COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT, makeComputeBlockRectSizeFunction( 4, 4, 16 ) ],
    [ COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT, makeComputeBlockRectSizeFunction( 4, 4, 16 ) ],

    [ COMPRESSED_RED_RGTC1_EXT, makeComputeBlockRectSizeFunction( 4, 4, 8 ) ],
    [ COMPRESSED_SIGNED_RED_RGTC1_EXT, makeComputeBlockRectSizeFunction( 4, 4, 8 ) ],
    [ COMPRESSED_RED_GREEN_RGTC2_EXT, makeComputeBlockRectSizeFunction( 4, 4, 16 ) ],
    [ COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT, makeComputeBlockRectSizeFunction( 4, 4, 16 ) ],
  ]);

  /**
   * Gets the number of bytes per element for a given internalFormat / type
   * @param {number} internalFormat The internalFormat parameter from texImage2D etc..
   * @param {number} type The type parameter for texImage2D etc..
   * @return {number} the number of bytes per element for the given internalFormat, type combo
   * @memberOf module:twgl/textures
   */
  function getBytesPerElementForInternalFormat(internalFormat, type) {
    const info = getTextureInternalFormatInfo(internalFormat);
    if (!info) {
      throw "unknown internal format";
    }
    if (info.type) {
      const ndx = info.type.indexOf(type);
      if (ndx < 0) {
        throw new Error(`unsupported type ${type} for internalformat ${internalFormat}`);
      }
      return info.bytesPerElement[ndx];
    }
    return info.bytesPerElement[0];
  }

  function getBytesForMipUncompressed(internalFormat, width, height, depth, type) {
    const bytesPerElement = getBytesPerElementForInternalFormat(internalFormat, type);
    return width * height * depth * bytesPerElement;
  }

  function getBytesForMip(internalFormat, width, height, depth, type) {
    const fn = compressedTextureFunctions.get(internalFormat);
    return fn ? fn(width, height, depth) : getBytesForMipUncompressed(internalFormat, width, height, depth, type);
  }

  function isTypedArray(v) {
    return v && v.buffer && v.buffer instanceof ArrayBuffer;
  }

  function isBufferSource(v) {
    return isTypedArray(v) || v instanceof ArrayBuffer;
  }

  function getDrawingbufferInfo(gl) {
    return {
      samples: gl.getParameter(gl.SAMPLES) || 1,
      depthBits: gl.getParameter(gl.DEPTH_BITS),
      stencilBits: gl.getParameter(gl.STENCIL_BITS),
      contextAttributes: gl.getContextAttributes(),
    };
  }

  function computeDepthStencilSize(drawingBufferInfo) {
    const {depthBits, stencilBits} = drawingBufferInfo;
    const depthSize = (depthBits + stencilBits + 7) / 8 | 0;
    return depthSize === 3 ? 4 : depthSize;
  }

  function computeDrawingbufferSize(gl, drawingBufferInfo) {
    if (gl.isContextLost()) {
      return 0;
    }
    const {samples} = drawingBufferInfo;
    // this will need to change for hi-color support
    const colorSize = 4;
    const size = gl.drawingBufferWidth * gl.drawingBufferHeight;
    const depthStencilSize = computeDepthStencilSize(drawingBufferInfo);
    return size * colorSize + size * samples * colorSize + size * depthStencilSize;
  }

  // I know this is not a full check
  function isNumber(v) {
    return typeof v === 'number';
  }

  function collectObjects(state, type) {
    const list = [...state.webglObjectToMemory.keys()]
      .filter(obj => obj instanceof type)
      .map((obj) => state.webglObjectToMemory.get(obj));

    return list;
  }

  function getStackTrace() {
    const stack = (new Error()).stack;
    const lines = stack.split('\n');
    // Remove the first two entries, the error message and this function itself, or the webgl-memory itself.
    const userLines = lines.slice(2).filter((l) => !l.includes('webgl-memory.js'));
    return userLines.join('\n');
  }

  /*
  The MIT License (MIT)

  Copyright (c) 2021 Gregg Tavares

  Permission is hereby granted, free of charge, to any person obtaining a copy of
  this software and associated documentation files (the "Software"), to deal in
  the Software without restriction, including without limitation the rights to
  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
  the Software, and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */

  //------------ [ from https://github.com/KhronosGroup/WebGLDeveloperTools ]

  /*
  ** Copyright (c) 2012 The Khronos Group Inc.
  **
  ** Permission is hereby granted, free of charge, to any person obtaining a
  ** copy of this software and/or associated documentation files (the
  ** "Materials"), to deal in the Materials without restriction, including
  ** without limitation the rights to use, copy, modify, merge, publish,
  ** distribute, sublicense, and/or sell copies of the Materials, and to
  ** permit persons to whom the Materials are furnished to do so, subject to
  ** the following conditions:
  **
  ** The above copyright notice and this permission notice shall be included
  ** in all copies or substantial portions of the Materials.
  **
  ** THE MATERIALS ARE PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  ** EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  ** MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  ** IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
  ** CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  ** TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  ** MATERIALS OR THE USE OR OTHER DEALINGS IN THE MATERIALS.
  */


  const augmentedSet = new Set();

  /**
   * Given a WebGL context replaces all the functions with wrapped functions
   * that call gl.getError after every command
   *
   * @param {WebGLRenderingContext|Extension} ctx The webgl context to wrap.
   * @param {string} nameOfClass (eg, webgl, webgl2, OES_texture_float)
   */
  // eslint-disable-next-line consistent-return
  function augmentAPI(ctx, nameOfClass, options = {}) {

    if (augmentedSet.has(ctx)) {
      return ctx;
    }
    augmentedSet.add(ctx);

    const origGLErrorFn = options.origGLErrorFn || ctx.getError;

    function createSharedState(ctx) {
      const drawingBufferInfo = getDrawingbufferInfo(ctx);
      const sharedState = {
        baseContext: ctx,
        config: options,
        apis: {
          // custom extension
          gman_webgl_memory: {
            ctx: {
              getMemoryInfo() {
                const drawingbuffer = computeDrawingbufferSize(ctx, drawingBufferInfo);
                return {
                  memory: {
                    ...memory,
                    drawingbuffer,
                    total: drawingbuffer + memory.buffer + memory.texture + memory.renderbuffer,
                  },
                  resources: {
                    ...resources,
                  },
                };
              },
              getResourcesInfo(type) {
                return collectObjects(sharedState, type);
              },
            },
          },
        },
        resources: {},
        memory: {
          texture: 0,
          buffer: 0,
          renderbuffer: 0,
        },
        bindings: new Map(),
        defaultVertexArray: {},
        webglObjectToMemory: new Map(),
      };

      const unRestorableAPIs = new Set([
        'webgl',
        'webgl2',
        'webgl_lose_context',
      ]);

      function resetSharedState() {
        sharedState.bindings.clear();
        sharedState.webglObjectToMemory.clear();
        sharedState.webglObjectToMemory.set(sharedState.defaultVertexArray, {});
        sharedState.currentVertexArray = sharedState.defaultVertexArray;
        [sharedState.resources, sharedState.memory].forEach(function(obj) {
          for (const prop in obj) {
            obj[prop] = 0;
          }
        });
      }

      function handleContextLost() {
        // Issues:
        //   * all resources are lost.
        //     Solution: handled by resetSharedState
        //   * all functions are no-op
        //     Solutions:
        //        * swap all functions for noop
        //          (not so easy because some functions return values)
        //        * wrap all functions is a isContextLost check forwarder
        //          (slow? and same as above)
        //        * have each function manually check for context lost
        //          (simple but repetitive)
        //   * all extensions are lost
        //      Solution: For these we go through and restore all the functions
        //         on each extension
        resetSharedState();
        sharedState.isContextLost = true;

        // restore all original functions for extensions since
        // user will have to get new extensions.
        for (const [name, {ctx, origFuncs}] of [...Object.entries(sharedState.apis)]) {
          if (!unRestorableAPIs.has(name) && origFuncs) {
            augmentedSet.delete(ctx);
            for (const [funcName, origFn] of Object.entries(origFuncs)) {
              ctx[funcName] = origFn;
            }
            delete apis[name];
          }
        }
      }

      function handleContextRestored() {
        sharedState.isContextLost = false;
      }

      if (ctx.canvas) {
        ctx.canvas.addEventListener('webglcontextlost', handleContextLost);
        ctx.canvas.addEventListener('webglcontextrestored', handleContextRestored);
      }

      resetSharedState();
      return sharedState;
    }

    const sharedState = options.sharedState || createSharedState(ctx);
    options.sharedState = sharedState;

    const {
      apis,
      bindings,
      memory,
      resources,
      webglObjectToMemory,
    } = sharedState;

    const origFuncs = {};

    function noop() {
    }

    function makeCreateWrapper(ctx, typeName, _funcName) {
      const funcName = _funcName || `create${typeName[0].toUpperCase()}${typeName.substr(1)}`;
      if (!ctx[funcName]) {
        return null;
      }
      resources[typeName] = 0;
      return function(ctx, funcName, args, webglObj) {
        if (sharedState.isContextLost) {
          return;
        }
        ++resources[typeName];
        webglObjectToMemory.set(webglObj, {
          size: 0,
          stackCreated: getStackTrace(),
        });
      };
    }

    function makeDeleteWrapper(typeName, fn = noop, _funcName) {
      const funcName = _funcName || `delete${typeName[0].toUpperCase()}${typeName.substr(1)}`;
      if (!ctx[funcName]) {
        return null;
      }
      return function(ctx, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        const [obj] = args;
        const info = webglObjectToMemory.get(obj);
        if (info) {
          --resources[typeName];
          fn(obj, info);
          // TODO: handle resource counts
          webglObjectToMemory.delete(obj);
        }
      };
    }

    function updateRenderbuffer(target, samples, internalFormat, width, height) {
      if (sharedState.isContextLost) {
        return;
      }
      const obj = bindings.get(target);
      if (!obj) {
        throw new Error(`no renderbuffer bound to ${target}`);
      }
      const info = webglObjectToMemory.get(obj);
      if (!info) {
        throw new Error(`unknown renderbuffer ${obj}`);
      }

      const bytesForMip = getBytesForMip(internalFormat, width, height, 1);
      const newSize = bytesForMip * samples;

      memory.renderbuffer -= info.size;
      info.size = newSize;
      info.stackUpdated = getStackTrace();
      memory.renderbuffer += newSize;
    }

    const ELEMENT_ARRAY_BUFFER           = 0x8893;

    const UNSIGNED_BYTE                  = 0x1401;
    const TEXTURE_CUBE_MAP               = 0x8513;
    const TEXTURE_2D_ARRAY               = 0x8C1A;
    const TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515;
    const TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516;
    const TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517;
    const TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518;
    const TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519;
    const TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A;

    const TEXTURE_BASE_LEVEL             = 0x813C;
    const TEXTURE_MAX_LEVEL              = 0x813D;

    const cubemapTargets = new Set([
      TEXTURE_CUBE_MAP_POSITIVE_X,
      TEXTURE_CUBE_MAP_NEGATIVE_X,
      TEXTURE_CUBE_MAP_POSITIVE_Y,
      TEXTURE_CUBE_MAP_NEGATIVE_Y,
      TEXTURE_CUBE_MAP_POSITIVE_Z,
      TEXTURE_CUBE_MAP_NEGATIVE_Z,
    ]);

    function isCubemapFace(target) {
      return cubemapTargets.has(target);
    }

    function getTextureInfo(target) {
      target = isCubemapFace(target) ? TEXTURE_CUBE_MAP : target;
      const obj = bindings.get(target);
      if (!obj) {
        throw new Error(`no texture bound to ${target}`);
      }
      const info = webglObjectToMemory.get(obj);
      if (!info) {
        throw new Error(`unknown texture ${obj}`);
      }
      return info;
    }

    function updateMipLevel(info, target, level, internalFormat, width, height, depth, type) {
      const oldSize = info.size;
      const newMipSize = getBytesForMip(internalFormat, width, height, depth, type);

      const faceNdx = isCubemapFace(target)
        ? target - TEXTURE_CUBE_MAP_POSITIVE_X
        : 0;

      info.mips = info.mips || [];
      info.mips[level] = info.mips[level] || [];
      const mipFaceInfo = info.mips[level][faceNdx] || {};
      info.size -= mipFaceInfo.size || 0;

      mipFaceInfo.size = newMipSize;
      mipFaceInfo.internalFormat = internalFormat;
      mipFaceInfo.type = type;
      mipFaceInfo.width = width;
      mipFaceInfo.height = height;
      mipFaceInfo.depth = depth;

      info.mips[level][faceNdx] = mipFaceInfo;
      info.size += newMipSize;

      memory.texture -= oldSize;
      memory.texture += info.size;

      info.stackUpdated = getStackTrace();
    }

    function updateTexStorage(target, levels, internalFormat, width, height, depth) {
      const info = getTextureInfo(target);
      const numFaces = target === TEXTURE_CUBE_MAP ? 6 : 1;
      const baseFaceTarget = target === TEXTURE_CUBE_MAP ? TEXTURE_CUBE_MAP_POSITIVE_X : target;
      for (let level = 0; level < levels; ++level) {
        for (let face = 0; face < numFaces; ++face) {
          updateMipLevel(info, baseFaceTarget + face, level, internalFormat, width, height, depth);
        }
        width = Math.ceil(Math.max(width / 2, 1));
        height = Math.ceil(Math.max(height / 2, 1));
        depth = target === TEXTURE_2D_ARRAY ? depth : Math.ceil(Math.max(depth / 2, 1));
      }
    }

    function handleBindVertexArray(gl, funcName, args) {
      if (sharedState.isContextLost) {
        return;
      }
      const [va] = args;
      sharedState.currentVertexArray = va ? va : sharedState.defaultVertexArray;
    }

    function handleBufferBinding(target, obj) {
      if (sharedState.isContextLost) {
        return;
      }
      switch (target) {
        case ELEMENT_ARRAY_BUFFER: {
            const info = webglObjectToMemory.get(sharedState.currentVertexArray);
            info.elementArrayBuffer = obj;
            break;
          }
        default:
          bindings.set(target, obj);
          break;
      }
    }

    const preChecks = {};
    const postChecks = {
      // WebGL1
      //   void bufferData(GLenum target, GLsizeiptr size, GLenum usage);
      //   void bufferData(GLenum target, [AllowShared] BufferSource? srcData, GLenum usage);
      // WebGL2:
      //   void bufferData(GLenum target, [AllowShared] ArrayBufferView srcData, GLenum usage, GLuint srcOffset,
      //                   optional GLuint length = 0);
      bufferData(gl, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        const [target, src, /* usage */, /*srcOffset = 0*/, length = undefined] = args;
        let obj;
        switch (target) {
          case ELEMENT_ARRAY_BUFFER:
            {
              const info = webglObjectToMemory.get(sharedState.currentVertexArray);
              obj = info.elementArrayBuffer;
            }
            break;
          default:
            obj = bindings.get(target);
            break;
        }
        if (!obj) {
          throw new Error(`no buffer bound to ${target}`);
        }
        let newSize = 0;
        if (length !== undefined) {
          newSize = length * src.BYTES_PER_ELEMENT;
        } else if (isBufferSource(src)) {
          newSize = src.byteLength;
        } else if (isNumber(src)) {
          newSize = src;
        } else {
          throw new Error(`unsupported bufferData src type ${src}`);
        }

        const info = webglObjectToMemory.get(obj);
        if (!info) {
          throw new Error(`unknown buffer ${obj}`);
        }

        memory.buffer -= info.size;
        info.size = newSize;
        info.stackUpdated = getStackTrace();
        memory.buffer += newSize;
      },

      bindVertexArray: handleBindVertexArray,
      bindVertexArrayOES: handleBindVertexArray,

      bindBuffer(gl, funcName, args) {
        const [target, obj] = args;
        handleBufferBinding(target, obj);
      },

      bindBufferBase(gl, funcName, args) {
        const [target, /*ndx*/, obj] = args;
        handleBufferBinding(target, obj);
      },

      bindBufferRange(gl, funcName, args) {
        const [target, /*ndx*/, obj, /*offset*/, /*size*/] = args;
        handleBufferBinding(target, obj);
      },

      bindRenderbuffer(gl, funcName, args) {
        if (sharedState.isContextLost) {
         return;
        }
        const [target, obj] = args;
        bindings.set(target, obj);
      },

      bindTexture(gl, funcName, args) {
        if (sharedState.isContextLost) {
         return;
        }
        const [target, obj] = args;
        bindings.set(target, obj);
      },

      // void gl.copyTexImage2D(target, level, internalformat, x, y, width, height, border);
      copyTexImage2D(ctx, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        const [target, level, internalFormat, /*x*/, /*y*/, width, height, /*border*/] = args;
        const info = getTextureInfo(target);
        updateMipLevel(info, target, level, internalFormat, width, height, 1, UNSIGNED_BYTE);
      },

      createBuffer: makeCreateWrapper(ctx, 'buffer'),
      createFramebuffer: makeCreateWrapper(ctx, 'framebuffer'),
      createRenderbuffer: makeCreateWrapper(ctx, 'renderbuffer'),
      createProgram: makeCreateWrapper(ctx, 'program'),
      createQuery: makeCreateWrapper(ctx, 'query'),
      createShader: makeCreateWrapper(ctx, 'shader'),
      createSampler: makeCreateWrapper(ctx, 'sampler'),
      createTexture: makeCreateWrapper(ctx, 'texture'),
      createTransformFeedback: makeCreateWrapper(ctx, 'transformFeedback'),
      createVertexArray: makeCreateWrapper(ctx, 'vertexArray'),
      createVertexArrayOES: makeCreateWrapper(ctx, 'vertexArray', 'createVertexArrayOES'),

      // WebGL 1:
      // void gl.compressedTexImage2D(target, level, internalformat, width, height, border, ArrayBufferView? pixels);
      //
      // Additionally available in WebGL 2:
      // read from buffer bound to gl.PIXEL_UNPACK_BUFFER
      // void gl.compressedTexImage2D(target, level, internalformat, width, height, border, GLsizei imageSize, GLintptr offset);
      // void gl.compressedTexImage2D(target, level, internalformat, width, height, border,
      //                              ArrayBufferView srcData, optional srcOffset, optional srcLengthOverride);
      compressedTexImage2D(ctx, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        const [target, level, internalFormat, width, height] = args;
        const info = getTextureInfo(target);
        updateMipLevel(info, target, level, internalFormat, width, height, 1, UNSIGNED_BYTE);
      },

      // read from buffer bound to gl.PIXEL_UNPACK_BUFFER
      // void gl.compressedTexImage3D(target, level, internalformat, width, height, depth, border, GLsizei imageSize, GLintptr offset);
      // void gl.compressedTexImage3D(target, level, internalformat, width, height, depth, border,
      //                              ArrayBufferView srcData, optional srcOffset, optional srcLengthOverride);
      compressedTexImage3D(ctx, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        const [target, level, internalFormat, width, height, depth] = args;
        const info = getTextureInfo(target);
        updateMipLevel(info, target, level, internalFormat, width, height, depth, UNSIGNED_BYTE);
      },

      deleteBuffer: makeDeleteWrapper('buffer', function(obj, info) {
        memory.buffer -= info.size;
      }),
      deleteFramebuffer: makeDeleteWrapper('framebuffer'),
      deleteProgram: makeDeleteWrapper('program'),
      deleteQuery: makeDeleteWrapper('query'),
      deleteRenderbuffer: makeDeleteWrapper('renderbuffer', function(obj, info) {
        memory.renderbuffer -= info.size;
      }),
      deleteSampler: makeDeleteWrapper('sampler'),
      deleteShader: makeDeleteWrapper('shader'),
      deleteSync: makeDeleteWrapper('sync'),
      deleteTexture: makeDeleteWrapper('texture', function(obj, info) {
        memory.texture -= info.size;
      }),
      deleteTransformFeedback: makeDeleteWrapper('transformFeedback'),
      deleteVertexArray: makeDeleteWrapper('vertexArray'),
      deleteVertexArrayOES: makeDeleteWrapper('vertexArray', noop, 'deleteVertexArrayOES'),

      fenceSync: function(ctx) {
        if (sharedState.isContextLost) {
          return undefined;
        }
        if (!ctx.fenceSync) {
          return undefined;
        }
        resources.sync = 0;
        return function(ctx, funcName, args, webglObj) {
          ++resources.sync;

          webglObjectToMemory.set(webglObj, {
            size: 0,
          });
        };
      }(ctx),

      generateMipmap(ctx, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        const [target] = args;
        const info = getTextureInfo(target);
        const baseMipNdx = info.parameters ? info.parameters.get(TEXTURE_BASE_LEVEL) || 0 : 0;
        const maxMipNdx = info.parameters ? info.parameters.get(TEXTURE_MAX_LEVEL) || 1024 : 1024;
        const mipInfo = info.mips[baseMipNdx][0];
        let {width, height, depth} = mipInfo;
        const {internalFormat, type} = mipInfo;
        let level = baseMipNdx + 1;

        const numFaces = target === TEXTURE_CUBE_MAP ? 6 : 1;
        const baseFaceTarget = target === TEXTURE_CUBE_MAP ? TEXTURE_CUBE_MAP_POSITIVE_X : target;
        while (level <= maxMipNdx && !(width === 1 && height === 1 && (depth === 1 || target === TEXTURE_2D_ARRAY))) {
          width = Math.ceil(Math.max(width / 2, 1));
          height = Math.ceil(Math.max(height / 2, 1));
          depth = target === TEXTURE_2D_ARRAY ? depth : Math.ceil(Math.max(depth / 2, 1));
          for (let face = 0; face < numFaces; ++face) {
            updateMipLevel(info, baseFaceTarget + face, level, internalFormat, width, height, depth, type);
          }
          ++level;
        }
      },

      getSupportedExtensions(ctx, funcName, args, result) {
        if (sharedState.isContextLost) {
          return;
        }
        result.push('GMAN_webgl_memory');
      },

      // void gl.renderbufferStorage(target, internalFormat, width, height);
      // gl.RGBA4: 4 red bits, 4 green bits, 4 blue bits 4 alpha bits.
      // gl.RGB565: 5 red bits, 6 green bits, 5 blue bits.
      // gl.RGB5_A1: 5 red bits, 5 green bits, 5 blue bits, 1 alpha bit.
      // gl.DEPTH_COMPONENT16: 16 depth bits.
      // gl.STENCIL_INDEX8: 8 stencil bits.
      // gl.DEPTH_STENCIL
      renderbufferStorage(ctx, funcName, args) {
        const [target, internalFormat, width, height] = args;
        updateRenderbuffer(target, 1, internalFormat, width, height);
      },

      // void gl.renderbufferStorageMultisample(target, samples, internalFormat, width, height);
      renderbufferStorageMultisample(ctx, funcName, args) {
        const [target, samples, internalFormat, width, height] = args;
        updateRenderbuffer(target, samples, internalFormat, width, height);
      },

      texImage2D(ctx, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        // WebGL1:
        // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView? pixels);
        // void gl.texImage2D(target, level, internalformat, format, type, ImageData? pixels);
        // void gl.texImage2D(target, level, internalformat, format, type, HTMLImageElement? pixels);
        // void gl.texImage2D(target, level, internalformat, format, type, HTMLCanvasElement? pixels);
        // void gl.texImage2D(target, level, internalformat, format, type, HTMLVideoElement? pixels);
        // void gl.texImage2D(target, level, internalformat, format, type, ImageBitmap? pixels// );

        // WebGL2:
        // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, GLintptr offset);
        // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLCanvasElement source);
        // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLImageElement source);
        // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, HTMLVideoElement source);
        // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ImageBitmap source);
        // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ImageData source);
        // void gl.texImage2D(target, level, internalformat, width, height, border, format, type, ArrayBufferView srcData, srcOffset);
        const [target, level, internalFormat] = args;
        let width;
        let height;
        let type;
        if (args.length === 6) {
          const src = args[5];
          width = src.width;
          height = src.height;
          type = args[4];
        } else {
          width = args[3];
          height = args[4];
          type = args[7];
        }

        const info = getTextureInfo(target);
        updateMipLevel(info, target, level, internalFormat, width, height, 1, type);
      },

      // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, GLintptr offset);
      //
      // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLCanvasElement source);
      // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLImageElement source);
      // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, HTMLVideoElement source);
      // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ImageBitmap source);
      // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ImageData source);
      // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ArrayBufferView? srcData);
      // void gl.texImage3D(target, level, internalformat, width, height, depth, border, format, type, ArrayBufferView srcData, srcOffset);

      texImage3D(ctx, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        const [target, level, internalFormat, width, height, depth, /*border*/, /*format*/, type] = args;
        const info = getTextureInfo(target);
        updateMipLevel(info, target, level, internalFormat, width, height, depth, type);
      },

      texParameteri(ctx, funcName, args) {
        if (sharedState.isContextLost) {
          return;
        }
        const [target, pname, value] = args;
        const info = getTextureInfo(target);
        info.parameters = info.parameters || new Map();
        info.parameters.set(pname, value);
      },

      // void gl.texStorage2D(target, levels, internalformat, width, height);
      texStorage2D(ctx, funcName, args) {
        const [target, levels, internalFormat, width, height] = args;
        updateTexStorage(target, levels, internalFormat, width, height, 1);
      },

      // void gl.texStorage3D(target, levels, internalformat, width, height, depth);
      texStorage3D(ctx, funcName, args) {
        const [target, levels, internalFormat, width, height, depth] = args;
        updateTexStorage(target, levels, internalFormat, width, height, depth);
      },
    };

    const extraWrappers = {
      getExtension(ctx, propertyName) {
        if (sharedState.isContextLost) {
          return;
        }
        const origFn = ctx[propertyName];
        ctx[propertyName] = function(...args) {
          const extensionName = args[0].toLowerCase();
          const api = apis[extensionName];
          if (api) {
            return api.ctx;
          }
          const ext = origFn.call(ctx, ...args);
          if (ext) {
            augmentAPI(ext, extensionName, {...options, origGLErrorFn});
          }
          return ext;
        };
      },
    };

    // Makes a function that calls a WebGL function and then calls getError.
    function makeErrorWrapper(ctx, funcName) {
      const origFn = ctx[funcName];
      const preCheck = preChecks[funcName] || noop;
      const postCheck = postChecks[funcName] || noop;
      if (preCheck === noop && postChecks === noop) {
        return;
      }
      ctx[funcName] = function(...args) {
        preCheck(ctx, funcName, args);
        const result = origFn.call(ctx, ...args);
        postCheck(ctx, funcName, args, result);
        return result;
      };
      const extraWrapperFn = extraWrappers[funcName];
      if (extraWrapperFn) {
        extraWrapperFn(ctx, funcName, origGLErrorFn);
      }
    }

    // Wrap each function
    for (const propertyName in ctx) {
      if (typeof ctx[propertyName] === 'function') {
        origFuncs[propertyName] = ctx[propertyName];
        makeErrorWrapper(ctx, propertyName);
      }
    }

    apis[nameOfClass.toLowerCase()] = { ctx, origFuncs };
  }

  /*
  The MIT License (MIT)

  Copyright (c) 2021 Gregg Tavares

  Permission is hereby granted, free of charge, to any person obtaining a copy of
  this software and associated documentation files (the "Software"), to deal in
  the Software without restriction, including without limitation the rights to
  use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
  the Software, and to permit persons to whom the Software is furnished to do so,
  subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
  FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
  COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
  IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
  CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */

  function wrapGetContext(Ctor) {
    const oldFn = Ctor.prototype.getContext;
    Ctor.prototype.getContext = function(type, ...args) {
      const ctx = oldFn.call(this, type, ...args);
      // Using bindTexture to see if it's WebGL. Could check for instanceof WebGLRenderingContext
      // but that might fail if wrapped by debugging extension
      if (ctx && ctx.bindTexture) {
        const config = {};
        augmentAPI(ctx, type, config);
        ctx.getExtension('GMAN_webgl_memory');
      }
      return ctx;
    };
  }

  if (typeof HTMLCanvasElement !== 'undefined') {
    wrapGetContext(HTMLCanvasElement);
  }
  if (typeof OffscreenCanvas !== 'undefined') {
    wrapGetContext(OffscreenCanvas);
  }

}));
