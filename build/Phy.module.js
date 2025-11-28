/**
 * @license
 * Copyright 2010-2025 Phy.js Authors
 * SPDX-License-Identifier: MIT
 */
import { LineSegments, BufferGeometry, BufferAttribute, Float32BufferAttribute, LineBasicMaterial, BoxGeometry, Vector3, Matrix4, CylinderGeometry, CircleGeometry, PlaneGeometry, SphereGeometry, Box3, Vector2, CanvasTexture, RepeatWrapping, SRGBColorSpace, MeshPhysicalMaterial, Color, MeshStandardMaterial, ShadowMaterial, MeshToonMaterial, MeshBasicMaterial, MeshLambertMaterial, MeshPhongMaterial, DoubleSide, BackSide, FrontSide, SrcAlphaSaturateFactor, OneMinusDstColorFactor, DstColorFactor, OneMinusDstAlphaFactor, DstAlphaFactor, OneMinusSrcAlphaFactor, SrcAlphaFactor, OneMinusSrcColorFactor, SrcColorFactor, OneFactor, ZeroFactor, MaxEquation, MinEquation, ReverseSubtractEquation, SubtractEquation, AddEquation, MultiplyBlending, SubtractiveBlending, AdditiveBlending, NormalBlending, NoBlending, Line, InstancedMesh, Quaternion as Quaternion$1, Mesh, InstancedBufferAttribute, Object3D, Line3, Plane, Triangle, ShapeGeometry, Euler, Loader, FileLoader, LinearSRGBColorSpace, LoadingManager, EquirectangularReflectionMapping, AnimationMixer, NoColorSpace, NearestFilter, Texture, TextureLoader, CompressedTexture, ObjectSpaceNormalMap, Vector4, CustomBlending, Group, SkeletonHelper, AnimationClip, AnimationUtils, VectorKeyframeTrack, QuaternionKeyframeTrack, AdditiveAnimationBlendMode, NormalAnimationBlendMode, Raycaster, Sphere, PMREMGenerator, Scene, WebGLCubeRenderTarget, HalfFloatType, LinearFilter, CubeCamera, IcosahedronGeometry, ShaderMaterial, NoToneMapping, Ray as Ray$1, BatchedMesh, Frustum, REVISION, DataTexture, FloatType, UnsignedIntType, IntType, WebGLUtils, ColorManagement, RGBAFormat, RGBAIntegerFormat, RGFormat, RGIntegerFormat, RedFormat, RedIntegerFormat, WebGLCoordinateSystem, AxesHelper, Skeleton, MathUtils, Points, InstancedBufferGeometry, InterleavedBuffer, InterleavedBufferAttribute, InstancedInterleavedBuffer, DynamicDrawUsage, Matrix3 } from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';
import { KTX2Loader as KTX2Loader$1 } from 'three/addons/loaders/KTX2Loader.js';
import { radixSort } from 'three/addons/utils/SortUtils.js';

const PI = Math.PI;
const torad$3 = PI / 180;
const todeg$1 = 180 / PI;
const EPSILON = Number.EPSILON;//0.00001;
const PI90 = PI*0.5;


const M$3 = {

    //-----------------------
    //  LIGHT
    //-----------------------

    luminousPowers : {
        '110000 lm (1000W)': 110000,
        '3500 lm (300W)': 3500,
        '1700 lm (100W)': 1700,
        '800 lm (60W)': 800,
        '400 lm (40W)': 400,
        '180 lm (25W)': 180,
        '20 lm (4W)': 20,
        'Off': 0
    },

    // ref for solar irradiances: https://en.wikipedia.org/wiki/Lux
    luminousIrradiances : {
        '0.0001 lx (Moonless Night)': 0.0001,
        '0.002 lx (Night Airglow)': 0.002,
        '0.5 lx (Full Moon)': 0.5,
        '3.4 lx (City Twilight)': 3.4,
        '50 lx (Living Room)': 50,
        '100 lx (Very Overcast)': 100,
        '350 lx (Office Room)': 350,
        '400 lx (Sunrise/Sunset)': 400,
        '1000 lx (Overcast)': 1000,
        '18000 lx (Daylight)': 18000,
        '50000 lx (Direct Sun)': 50000
    },

    exposure : (v) => ( Math.pow( v, 5.0 ) ),
    //Candela is default three light intensity
    candelaToLumens : (v) => ( v * 4 * Math.PI ),
    lumensToCandela : (v) => ( v / ( 4 * Math.PI ) ),

    average: arr => arr?.reduce((a, b) => a + b, 0) / arr.length,

    //-----------------------
    //  MATH
    //-----------------------

    atan2: ( y, x ) => ( Math.fround(Math.atan2(y, x)) ),
    pow: ( y, x ) => ( Math.fround(Math.pow(y, x)) ),
    sin: ( a ) => ( Math.fround(Math.sin(a)) ),
    cos: ( a ) => ( Math.fround(Math.cos(a)) ),
    sqrt: ( a ) => ( Math.fround(Math.sqrt(a)) ),
    exp: ( a ) => ( Math.fround(Math.exp(a)) ),

    todeg:todeg$1,
    torad:torad$3,

    toFixed: ( x, n = 3 ) => ( x.toFixed(n) * 1 ),
    toRound: ( x, n = 3 ) => ( Math.trunc(x) ),

    clamp: ( v, min = 0, max = 1 ) => {
        v = v < min ? min : v;
        v = v > max ? max : v;
        return v;
    },

    clampA: ( v, min, max ) => ( Math.max( min, Math.min( max, v ) ) ),

    smoothstep: ( min, max, t ) => {
        t = M$3.clamp(t);
        t = -2 * t * t * t + 3.0 * t * t;
        return min * t + max * (1 - t);
    },

    remap: ( f, fmin, fmax, min, max) => {
        return min + (f - fmin) * (max - min) / (fmax - fmin);
    },

    lerp: ( x, y, t ) => ( ( 1 - t ) * x + t * y ),
    damp: ( x, y, lambda, dt ) => ( M$3.lerp( x, y, 1 - Math.exp( - lambda * dt ) ) ),

    nearAngle: ( s1, s2, deg = false ) => ( s2 + Math.atan2(Math.sin(s1-s2), Math.cos(s1-s2)) * (deg ? todeg$1 : 1) ),

    unwrapDeg: ( r ) => ( r - (Math.floor((r + 180)/360))*360 ), 
    //unwrapRad: ( r ) => (r - (Math.floor((r + Math.PI)/(2*Math.PI)))*2*Math.PI),
    unwrapRad: ( r ) => ( Math.atan2(Math.sin(r), Math.cos(r)) ),

    nearEquals: ( a, b, t = 1e-4 ) => ( Math.abs(a - b) <= t ? true : false ),

    autoSize: ( s = [ 1, 1, 1 ], type = 'box' ) => {

        if ( s.length === 1 ) s[ 1 ] = s[ 0 ];
        let radius = s[0];
        let height = s[1];
        if( type === 'sphere' ) s = [ radius, radius, radius ];
        if( type === 'cylinder' || type === 'wheel' || type === 'capsule' ) s = [ radius, height, radius ];
        if( type === 'cone' || type === 'pyramid' ) s = [ radius, height, radius ];
        if ( s.length === 2 ) s[ 2 ] = s[ 0 ];
        return s;

    },

    shuffle: (array) => {

        let shuffled = array
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);

        return shuffled

    },

    /*distance: ( a, b = { x:0, y:0, z:0 } ) => { // rotation array in degree

        const dx = a.x ? a.x - b.x : 0
        const dy = a.y ? a.y - b.y : 0
        const dz = a.z ? a.z - b.z : 0
        return Math.sqrt( dx * dx + dy * dy + dz * dz );

    },*/


    //-----------------------
    //  RANDOM
    //-----------------------

    randomSign: () => ( Math.random() < 0.5 ? -1 : 1 ),
    randSpread: ( range ) => ( range * ( 0.5 - Math.random() ) ),
    rand: ( low = 0, high = 1 ) => ( low + Math.random() * ( high - low ) ),
    randInt: ( low, high ) => ( low + Math.floor( Math.random() * ( high - low + 1 ) ) ),

    randIntUnic:  ( low, high, num ) => {
        var arr = [];
        while( arr.length < num ){
            var r = M$3.randInt(low, high);
            if( arr.indexOf(r) === -1 ) arr.push(r);
        }
        return arr;
    },

    //-----------------------
    //  EXTRA
    //-----------------------

    fromTransform: ( p1, q1, p2, q2 = [0,0,0,1], inv = false ) => {

        let m1 = M$3.composeMatrixArray( p1, q1 );
        let m2 = M$3.composeMatrixArray( p2, q2 );
        if( inv ) m1 = M$3.invertMatrixArray(m1);
        m1 = M$3.multiplyMatrixArray( m1, m2 );
        return [ m1[12],m1[13],m1[14]]

    },

    fromTransformToQ: ( p, q, inv = false ) => {

        let m = M$3.composeMatrixArray( p, q );
        let res = M$3.decomposeFullMatrixArray( m );
        let q1 = res.q;
        if(inv) q1 = M$3.quatInvert(q1);
        return q1

    },

    // special Havok motion !!!

    lerpTransform: ( oar, ar, t ) => {
        let op = oar[0];
        let oq = oar[1];
        let p = ar[0]; 
        let q = ar[1];

        p = M$3.lerpArray(op, p, t);
        q = M$3.slerpQuatArray(oq, q, t);
        return [p,q]
    },

    //-----------------------
    //  MATRIX
    //-----------------------

    composeMatrixArray: ( p, q, s = [1,1,1] ) => {

        const x = q[0], y = q[1], z = q[2], w = q[3];
        const x2 = x + x,  y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        const sx = s[0], sy = s[1], sz = s[2];
        return [
            ( 1 - ( yy + zz ) ) * sx, ( xy + wz ) * sx, ( xz - wy ) * sx, 0,
            ( xy - wz ) * sy, ( 1 - ( xx + zz ) ) * sy, ( yz + wx ) * sy, 0,
            ( xz + wy ) * sz, ( yz - wx ) * sz, ( 1 - ( xx + yy ) ) * sz, 0,
            p[0], p[1], p[2], 1
        ]

    },

    multiplyMatrixArray: ( a, b ) => {

        const ae = a;
        const be = b;
        const te = [];

        const a11 = ae[ 0 ], a12 = ae[ 4 ], a13 = ae[ 8 ], a14 = ae[ 12 ];
        const a21 = ae[ 1 ], a22 = ae[ 5 ], a23 = ae[ 9 ], a24 = ae[ 13 ];
        const a31 = ae[ 2 ], a32 = ae[ 6 ], a33 = ae[ 10 ], a34 = ae[ 14 ];
        const a41 = ae[ 3 ], a42 = ae[ 7 ], a43 = ae[ 11 ], a44 = ae[ 15 ];

        const b11 = be[ 0 ], b12 = be[ 4 ], b13 = be[ 8 ], b14 = be[ 12 ];
        const b21 = be[ 1 ], b22 = be[ 5 ], b23 = be[ 9 ], b24 = be[ 13 ];
        const b31 = be[ 2 ], b32 = be[ 6 ], b33 = be[ 10 ], b34 = be[ 14 ];
        const b41 = be[ 3 ], b42 = be[ 7 ], b43 = be[ 11 ], b44 = be[ 15 ];

        te[ 0 ] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
        te[ 4 ] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
        te[ 8 ] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
        te[ 12 ] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

        te[ 1 ] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
        te[ 5 ] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
        te[ 9 ] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
        te[ 13 ] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

        te[ 2 ] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
        te[ 6 ] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
        te[ 10 ] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
        te[ 14 ] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

        te[ 3 ] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
        te[ 7 ] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
        te[ 11 ] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
        te[ 15 ] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

        return te;

    },

    invertMatrixArray: ( m ) => {

        const te = m,

            n11 = te[ 0 ], n21 = te[ 1 ], n31 = te[ 2 ], n41 = te[ 3 ],
            n12 = te[ 4 ], n22 = te[ 5 ], n32 = te[ 6 ], n42 = te[ 7 ],
            n13 = te[ 8 ], n23 = te[ 9 ], n33 = te[ 10 ], n43 = te[ 11 ],
            n14 = te[ 12 ], n24 = te[ 13 ], n34 = te[ 14 ], n44 = te[ 15 ],

            t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44,
            t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44,
            t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44,
            t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

        if ( det === 0 ) return [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

        const detInv = 1 / det;

        te[ 0 ] = t11 * detInv;
        te[ 1 ] = ( n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44 ) * detInv;
        te[ 2 ] = ( n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44 ) * detInv;
        te[ 3 ] = ( n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43 ) * detInv;

        te[ 4 ] = t12 * detInv;
        te[ 5 ] = ( n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44 ) * detInv;
        te[ 6 ] = ( n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44 ) * detInv;
        te[ 7 ] = ( n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43 ) * detInv;

        te[ 8 ] = t13 * detInv;
        te[ 9 ] = ( n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44 ) * detInv;
        te[ 10 ] = ( n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44 ) * detInv;
        te[ 11 ] = ( n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43 ) * detInv;

        te[ 12 ] = t14 * detInv;
        te[ 13 ] = ( n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34 ) * detInv;
        te[ 14 ] = ( n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34 ) * detInv;
        te[ 15 ] = ( n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33 ) * detInv;

        return te;

    },

    matrixArrayDeterminant: ( m ) => {
        const te = m;

        const n11 = te[ 0 ], n12 = te[ 4 ], n13 = te[ 8 ], n14 = te[ 12 ];
        const n21 = te[ 1 ], n22 = te[ 5 ], n23 = te[ 9 ], n24 = te[ 13 ];
        const n31 = te[ 2 ], n32 = te[ 6 ], n33 = te[ 10 ], n34 = te[ 14 ];
        const n41 = te[ 3 ], n42 = te[ 7 ], n43 = te[ 11 ], n44 = te[ 15 ];

        //TODO: make this more efficient
        //( based on http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm )

        return (
            n41 * (
                + n14 * n23 * n32
                 - n13 * n24 * n32
                 - n14 * n22 * n33
                 + n12 * n24 * n33
                 + n13 * n22 * n34
                 - n12 * n23 * n34
            ) +
            n42 * (
                + n11 * n23 * n34
                 - n11 * n24 * n33
                 + n14 * n21 * n33
                 - n13 * n21 * n34
                 + n13 * n24 * n31
                 - n14 * n23 * n31
            ) +
            n43 * (
                + n11 * n24 * n32
                 - n11 * n22 * n34
                 - n14 * n21 * n32
                 + n12 * n21 * n34
                 + n14 * n22 * n31
                 - n12 * n24 * n31
            ) +
            n44 * (
                - n13 * n22 * n31
                 - n11 * n23 * n32
                 + n11 * n22 * n33
                 + n13 * n21 * n32
                 - n12 * n21 * n33
                 + n12 * n23 * n31
            )

        );
    },

    decomposeMatrixArray: ( m ) => {

        return [
            m[12],m[13],m[14],
        ]
    },

    decomposeFullMatrixArray: ( m ) => {

        const te = m;

        let sx = M$3.lengthArray( [te[ 0 ], te[ 1 ], te[ 2 ]] );//_v1.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
        const sy = M$3.lengthArray( [te[ 4 ], te[ 5 ], te[ 6 ]] );//_v1.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
        const sz = M$3.lengthArray( [te[ 8 ], te[ 9 ], te[ 10 ]] );//_v1.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

        // if determine is negative, we need to invert one scale
        const det = M$3.matrixArrayDeterminant(m);
        if ( det < 0 ) sx = - sx;

        let m1 = [...m];
        const invSX = 1 / sx;
        const invSY = 1 / sy;
        const invSZ = 1 / sz;

        m1[ 0 ] *= invSX;
        m1[ 1 ] *= invSX;
        m1[ 2 ] *= invSX;

        m1[ 4 ] *= invSY;
        m1[ 5 ] *= invSY;
        m1[ 6 ] *= invSY;

        m1[ 8 ] *= invSZ;
        m1[ 9 ] *= invSZ;
        m1[ 10 ] *= invSZ;

        let q = M$3.quatFromRotationMatrix(m1); 

        return {
            p:[m[12],m[13],m[14]],
            q:q,
            s:[sx,sy,sz]
        }
        
    },

    // for physx substep 

    applyTransformArray: ( v, p, q, s = [1,1,1] ) => {
        const e = M$3.composeMatrixArray( p, q, s );
        const x = v[0], y = v[1], z = v[2];
        const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );
        return [
            ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w, 
            ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w,
            ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w
        ]
    },

    

    slerpQuatArray: ( a, b, t ) => {

        if ( t === 0 ) return a;
        if ( t === 1 ) return b;
        let r = [...a];
        const x = a[0], y = a[1], z = a[2], w = a[3];
        const qx = b[0], qy = b[1], qz = b[2], qw = b[3];
        let cosHalfTheta = w * qw + x * qx + y * qy + z * qz;

        if ( cosHalfTheta < 0 ) {
            r = [ -qx, -qy, -qz, -qw ];
            cosHalfTheta = - cosHalfTheta;
        } else {
            r = [...b];
        }

        if ( cosHalfTheta >= 1.0 ) return a
        
        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

        if ( sqrSinHalfTheta <= EPSILON ) {

            const s = 1 - t;
            r[3] = s * w + t * r[3];
            r[0] = s * x + t * r[0];
            r[1] = s * y + t * r[1];
            r[2] = s * z + t * r[2];
            return M$3.quatNomalize(r);

        }

        const sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
        const halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
        const ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta, ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

        r[3] = ( w * ratioA + r[3] * ratioB );
        r[0] = ( x * ratioA + r[0] * ratioB );
        r[1] = ( y * ratioA + r[1] * ratioB );
        r[2] = ( z * ratioA + r[2] * ratioB );

        return r;

    },


    //-----------------------
    //  QUAT
    //-----------------------

    toLocalQuatArray: ( rot = [0,0,0], b ) => { // rotation array in degree

        let q1 = M$3.quatFromEuler( rot );
        let q2 = M$3.quatInvert( b.quaternion.toArray() );
        return M$3.quatMultiply( q2, q1 )

        /*quat.setFromEuler( euler.fromArray( math.vectorad( rot ) ) )
        quat.premultiply( b.quaternion.invert() );
        return quat.toArray();*/

    },

    quatFromRotationMatrix: ( m ) => {

        let q = [0,0,0,1];

        const te = m,

            m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
            m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
            m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

            trace = m11 + m22 + m33;

        if ( trace > 0 ) {

            const s = 0.5 / Math.sqrt( trace + 1.0 );

            q[3] = 0.25 / s;
            q[0] = ( m32 - m23 ) * s;
            q[1] = ( m13 - m31 ) * s;
            q[2] = ( m21 - m12 ) * s;

        } else if ( m11 > m22 && m11 > m33 ) {

            const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

            q[3] = ( m32 - m23 ) / s;
            q[0] = 0.25 * s;
            q[1] = ( m12 + m21 ) / s;
            q[2] = ( m13 + m31 ) / s;

        } else if ( m22 > m33 ) {

            const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

            q[3] = ( m13 - m31 ) / s;
            q[0] = ( m12 + m21 ) / s;
            q[1] = 0.25 * s;
            q[2] = ( m23 + m32 ) / s;

        } else {

            const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

            q[3] = ( m21 - m12 ) / s;
            q[0] = ( m13 + m31 ) / s;
            q[1] = ( m23 + m32 ) / s;
            q[2] = 0.25 * s;

        }

        return q;

    },

    quatFromEuler: ( r = [0,0,0], isDeg = true ) => {

        const cos = Math.cos;
        const sin = Math.sin;
        const n = isDeg ? torad$3 : 1; 
        const x = (r[0]*n) * 0.5, y = (r[1]*n) * 0.5, z = (r[2]*n) * 0.5;
        const c1 = cos( x ), c2 = cos( y ), c3 = cos( z );
        const s1 = sin( x ), s2 = sin( y ), s3 = sin( z );

        return [
            s1 * c2 * c3 + c1 * s2 * s3,
            c1 * s2 * c3 - s1 * c2 * s3,
            c1 * c2 * s3 + s1 * s2 * c3,
            c1 * c2 * c3 - s1 * s2 * s3
        ]
        
    },

    quatFromAxis: ( r = [0,0,0], angle, isDeg = true ) => {

        const n = isDeg ? torad$3 : 1; 
        const halfAngle = (angle * 0.5) * n, s = Math.sin( halfAngle );
        return [
            r[0] * s,
            r[1] * s,
            r[2] * s,
            Math.cos( halfAngle )
        ]
        
    },

    quatNomalize: ( q ) => {
        let l = M$3.lengthArray( q );
        if ( l === 0 ) {
            return [0,0,0,1]
        } else {
            l = 1 / l;
            return M$3.scaleArray(q, l, 4)
        }
    },

    quatInvert: ( q ) => {
        return [-q[0],-q[1],-q[2], q[3]]
    },

    quatMultiply:( a, b ) => {
        const qax = a[0], qay = a[1], qaz = a[2], qaw = a[3];
        const qbx = b[0], qby = b[1], qbz = b[2], qbw = b[3];
        return [
            qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
            qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
            qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
            qaw * qbw - qax * qbx - qay * qby - qaz * qbz
        ]
    },

    quatToAxis:( q ) => {

        let w = 2 * Math.acos( q[3] );
        const s = Math.sqrt( 1 - q[3] * q[3] );
        if ( s < 0.0001 ) {
            return [1,0,0]
        } else {
             return [ q[0] / s, q[1] / s, q[2] / s, w ]
        }
    },

    eulerFromMatrix: (te) => {

        const m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
        te[ 1 ]; const m22 = te[ 5 ], m23 = te[ 9 ];
        te[ 2 ]; const m32 = te[ 6 ], m33 = te[ 10 ];

        let ar = [0,0,0];
        ar[1] = Math.asin( M$3.clamp( m13, -1, 1 ) );
        if ( Math.abs( m13 ) < 0.9999999 ) {
            ar[0] = Math.atan2( - m23, m33 );
            ar[2] = Math.atan2( - m12, m11 );
        } else {
            ar[0] = Math.atan2( m32, m22 );
            ar[2] = 0;
        }
        return ar

    },

    angleTo: ( a, b ) => {

        return 2 * Math.acos( Math.abs( M$3.clamp( M$3.dotArray(a,b), -1, 1 ) ) );

    },


    //-----------------------
    //  ARRAY
    //-----------------------

    fixedArray: ( a, p ) => { 

        let i = a.length;
        let r = [];
        while(i--){ r[i] = M$3.toFixed(a[i], p); }
        return r;

    },

    getSize: ( r ) => ( ( r.byteLength * 0.001 ) +'kb' ),

    // Creates a vector normal (perpendicular) to the current Vector3

    perpendicularArray: ( v ) => { 

        const radius = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        let theta = Math.acos(v[1] / radius);
        const phi = Math.atan2(v[2], v[0]);
        //makes angle 90 degs to current vector
        if( theta > PI90 ) theta -= PI90;
        else theta += PI90;
        //Calculates resutant normal vector from spherical coordinate of perpendicular vector
        const x = radius * Math.sin(theta) * Math.cos(phi);
        const y = radius * Math.cos(theta);
        const z = radius * Math.sin(theta) * Math.sin(phi);

        return [x, y, z];

    },

    crossArray: ( a, b ) => { 

        const ax = a[0], ay = a[1], az = a[2];
        const bx = b[0], by = b[1], bz = b[2];
        let x = ay * bz - az * by;
        let y = az * bx - ax * bz;
        let z = ax * by - ay * bx;
        return [x, y, z];

    },

    applyQuaternion: ( v, q ) => { 

        // quaternion q is assumed to have unit length

        const vx = v[0], vy = v[1], vz = v[2];
        const qx = q[0], qy = q[1], qz = q[2], qw = q[3];

        // t = 2 * cross( q.xyz, v );
        const tx = 2 * ( qy * vz - qz * vy );
        const ty = 2 * ( qz * vx - qx * vz );
        const tz = 2 * ( qx * vy - qy * vx );

        // v + q.w * t + cross( q.xyz, t );
        let x = vx + qw * tx + qy * tz - qz * ty;
        let y = vy + qw * ty + qz * tx - qx * tz;
        let z = vz + qw * tz + qx * ty - qy * tx;

        return [x,y,z];

    },

    // ARRAY OPERATION

    nullArray: ( a, n, i ) => { 
        let j = 0;
        while( i-- ) j += a[n+i];
        return j;
    },

    equalArray: ( a, b ) => {
        let i = a.length;
        while(i--){ if(a[i]!==b[i]) return false; }
        return true;
    },
    
    lerpArray: ( a, b, t ) => {
        if ( t === 0 ) return a;
        if ( t === 1 ) return b;
        let i = a.length;
        let r = [];
        while(i--){ r[i] = a[i]; r[i] += ( b[i] - r[i] ) * t; }
        return r;
    },

    zeroArray: ( a, n = 0, i ) => {
        i = i ?? a.length;
        while ( i-- ) a[n+i] = 0;
        return a;
    },

    lengthArray: ( r ) => {
        let i = r.length, l=0;
        while( i-- ) l += r[i] * r[i];
        return Math.sqrt( l );
    },

    dotArray: ( a, b ) => {
        let i = a.length, r = 0;
        while ( i-- ) r += a[ i ] * b[ i ];
        return r;
    },

    addArray: ( a, b, i ) => {
        i = i ?? a.length;
        let r = [];
        while ( i-- ) r[i] = a[i] + b[i];
        return r;
    },

    subArray: ( a, b, i ) => {
        i = i ?? a.length;
        let r = [];
        while ( i-- ) r[i] = a[i] - b[i];
        return r;
    },

    mulArray: ( a, b, i ) => {
        
        let ar = b instanceof Array;
        if( !ar ){ 
            return a.map((x) => x * b);
        } else { 
            let r = [];
            i = i ?? a.length;
            while ( i-- ) r[i] = a[i] * b[i];
            return r;
        }
        
    },

    worldscale: ( a, b ) => {
        return a.map((x) => x * b);
    },

    divArray: ( r, s, i ) => ( M$3.mulArray( r, 1/s, i ) ),

    scaleArray: ( r, s, i ) => ( M$3.mulArray( r, s, i ) ),

    fillArray: ( a, b, n = 0, i ) => {
        i = i ?? a.length;
        while( i-- ) b[n+i] = a[i];
    },

    copyArray: ( a, b ) => { [...b]; },

    cloneArray: ( a ) => ( [...a] ),

    distanceArray: ( a, b = [0,0,0] ) => ( M$3.lengthArray( M$3.subArray( a, b ) ) ),

    normalizeArray: ( a ) => ( M$3.divArray( a, M$3.lengthArray(a) || 1 ) ),

    normalArray: ( a, b = [0,0,0] ) => ( M$3.normalizeArray( M$3.subArray( b, a ) ) ),

    //-----------------------
    //  VOLUME
    //-----------------------

    getCenter:( g, center ) => {

        g.computeBoundingBox();
        return g.boundingBox.getCenter( center );

    },

    getVolume: ( type, size, vertex = null ) => {

        let volume = 1;
        let s = size;

        switch(type){
            
            case 'sphere' : volume = (4*Math.PI*s[0]*s[0]*s[0])/3; break;
            case 'cone' : volume = Math.PI * s[0] * (s[1] * 0.5) * 2; break;
            case 'box' : volume = 8 * (s[0]*0.5)*(s[1]*0.5)*(s[2]*0.5); break;
            case 'cylinder' : volume = Math.PI * s[0] * s[0] * (s[1] * 0.5) * 2; break;
            case 'capsule' : volume = ( (4*Math.PI*s[0]*s[0]*s[0])/3) + ( Math.PI * s[0] * s[0] * (s[1] * 0.5) * 2 ); break;
            case 'convex' : case 'mesh' : volume = M$3.getConvexVolume( vertex ); break;

        }

        return volume;

    },

    getConvexVolume: ( v ) => {

        let i = v.length / 3, n;
        let min = [0, 0, 0];
        let max = [0, 0, 0];

        while(i--){

            n = i*3;
            if ( v[n] < min[0] ) min[0] = v[n];
            else if (v[n] > max[0]) max[0] = v[n];
            if ( v[n+1] < min[1] ) min[1] = v[n+1];
            else if (v[n+1] > max[1]) max[1] = v[n+1];
            if ( v[n+2] < min[2] ) min[2] = v[n+2];
            else if (v[n+2] > max[2]) max[2] = v[n+2];

        }

        let s = [ max[0]-min[0], max[1]-min[1], max[2]-min[2] ];

        return 8 * (s[0]*0.5)*(s[1]*0.5)*(s[2]*0.5);
        //return (max[0]-min[0])*(max[1]-min[1])*(max[2]-min[2])

    },

    massFromDensity: ( density, volume ) =>  ( density * volume ),
    densityFromMass: ( mass, volume ) =>  ( mass / volume ),


    //-----------------------
    //  GEOMETRY
    //-----------------------

    toNonIndexed: ( g ) => ( !g.index ? g : g.clone().toNonIndexed() ),

    getIndex: ( g, noIndex ) => {

        if( !g.index || noIndex ) return null
        return g.index.array || null

    },

    getSameVertex: ( g ) => {
        
        const positionAttribute = g.getAttribute( 'position' );
        const ar = positionAttribute.array;

        const tmppos = [];
        const pos = [];
        const sameId = {};

        new THREE.Vector3();
        let n = 0, jcount;

        M$3.getHash(g);

        let p1, p2, same = false;

        let idx = 0;

        for ( let i = 0; i < positionAttribute.count; i ++ ) {

            n = i*3;
            p1 = { x:ar[n], y:ar[n+1], z:ar[n+2], id:i };
            same = false;
            
            jcount = tmppos.length;
            for ( let j = 0; j < jcount; j ++ ) {
                p2 = tmppos[j];
                if( p1.x === p2.x && p1.y === p2.y && p1.z === p2.z ){ 
                    same = true;
                    sameId[i] = p2.id;
                    //console.log(i+' have same index than '+p2.id)
                }  
            }

            if(!same){ 
                //if(!sameId[i])sameId[i] = i
                p1.id = idx++;
                tmppos.push(p1);
                pos.push([ p1.x, p1.y, p1.z ]);
            }

        }

        //console.log(tmppos)

        return [pos, sameId]


    },

    getVertex: ( g, noIndex ) => {
        
        let c = g.attributes.position.array;

        if( noIndex && g.index ){
            g = g.clone().toNonIndexed();
            c = g.attributes.position.array;
        }

        return c;

    },

    getNormal: ( g ) => {

        //if( noIndex && g.index ) g = g.clone().toNonIndexed();
        
        let c = g.attributes.normal.array;
        //console.log(c)
        return c;

    },

    getFaces: ( g ) => {

        let faces = [];
        if( g.index ){
            let index = g.getIndex();
            for ( let i = 0; i < index.count; i += 3 ) {
                faces.push( [index.getX(i), index.getX(i+1), index.getX(i+2)] );
            }
        }else {
            let lng = g.getAttribute( 'position' ).count;
            for ( let i = 0; i < lng; i += 3 ) {
                faces.push([i, i+1, i+2] );
            }
        }
        return faces;

    },

    getConnectedFaces: ( faces ) => {

        const connected = [];
        let lng = faces.length;
        let i = lng, j, fa, fb, common;
        let tmp, nx, final;
        while(i--){
            fa = faces[i];
            j = lng;
            while(j--){
                if(j !== i){
                    //d = 0
                    fb = faces[j];
                    common = fa.filter(item => fb.includes(item));
                    if(common.length>1){

                        final = [];

                        tmp = [...fa];
                        nx = tmp.indexOf(common[0]);
                        tmp.splice(nx, 1);
                        nx = tmp.indexOf(common[1]);
                        tmp.splice(nx, 1);
                        final.push(tmp[0]);

                        tmp = [...fb];
                        nx = tmp.indexOf(common[0]);
                        tmp.splice(nx, 1);
                        nx = tmp.indexOf(common[1]);
                        tmp.splice(nx, 1);
                        final.push(tmp[0]);

                        connected.push( final );
                    }
                }

            }

        }

        return connected

    },

    reduce: ( x ) => {
    },

    barycentric: ( simplex, point ) => {
    },

    solve: ( simplex, point ) => {
    },

    getHash: (geometry, tolerance = 1e-4) => {

        tolerance = Math.max( tolerance, Number.EPSILON );

        const hashToIndex = {};
        const hashTable = {};
        const positions = geometry.getAttribute( 'position' );
        const vertexCount = positions.count;
        //const vertexCount = positions.count;

        const ar = positions.array;

        const halfTolerance = tolerance * 0.5;
        const exponent = Math.log10( 1 / tolerance );
        const mul = Math.pow( 10, exponent );
        const add = halfTolerance * mul;

        let n;
        

        for ( let i = 0; i < vertexCount; i ++ ) {

            const index = i;
            n = index*3;
            // Generate a hash for the vertex attributes at the current index 'i'
            let hash = `${ ~ ~ ( ar[n] * mul + add ) },${ ~ ~ ( ar[n+1] * mul + add ) },${ ~ ~ ( ar[n+2] * mul + add ) }`;

            if(hashToIndex[hash]) hashToIndex[hash].push(i);
            else hashToIndex[hash] = [i];

        }

        let id = 0;

        for(let h in hashToIndex){
            hashTable[id++] = hashToIndex[h];
        }

        //console.log(hashTable)

        return hashTable

    },



    /*mergeVertices:( geometry, tolerance = 1e-4 ) => {

        tolerance = Math.max( tolerance, Number.EPSILON );

        // Generate an index buffer if the geometry doesn't have one, or optimize it
        // if it's already available.
        const hashToIndex = {};
        const indices = geometry.getIndex();
        const positions = geometry.getAttribute( 'position' );
        const vertexCount = indices ? indices.count : positions.count;

        // next value for triangle indices
        let nextIndex = 0;

        // attributes and new attribute arrays
        const attributeNames = Object.keys( geometry.attributes );
        const tmpAttributes = {};
        const tmpMorphAttributes = {};
        const newIndices = [];
        const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
        const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

        // Initialize the arrays, allocating space conservatively. Extra
        // space will be trimmed in the last step.
        for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

            const name = attributeNames[ i ];
            const attr = geometry.attributes[ name ];

            tmpAttributes[ name ] = new attr.constructor(
                new attr.array.constructor( attr.count * attr.itemSize ),
                attr.itemSize,
                attr.normalized
            );

            const morphAttributes = geometry.morphAttributes[ name ];
            if ( morphAttributes ) {

                if ( ! tmpMorphAttributes[ name ] ) tmpMorphAttributes[ name ] = [];
                morphAttributes.forEach( ( morphAttr, i ) => {

                    const array = new morphAttr.array.constructor( morphAttr.count * morphAttr.itemSize );
                    tmpMorphAttributes[ name ][ i ] = new morphAttr.constructor( array, morphAttr.itemSize, morphAttr.normalized );

                } );

            }

        }

        // convert the error tolerance to an amount of decimal places to truncate to
        const halfTolerance = tolerance * 0.5;
        const exponent = Math.log10( 1 / tolerance );
        const mul = Math.pow( 10, exponent );
        const add = halfTolerance * mul;
        for ( let i = 0; i < vertexCount; i ++ ) {

            const index = indices ? indices.getX( i ) : i;

            // Generate a hash for the vertex attributes at the current index 'i'
            let hash = '';
            for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

                const name = attributeNames[ j ];
                const attribute = geometry.getAttribute( name );
                const itemSize = attribute.itemSize;

                for ( let k = 0; k < itemSize; k ++ ) {

                    // double tilde truncates the decimal value
                    hash += `${ ~ ~ ( attribute[ getters[ k ] ]( index ) * mul + add ) },`;

                }

            }

            // Add another reference to the vertex if it's already
            // used by another index
            if ( hash in hashToIndex ) {

                newIndices.push( hashToIndex[ hash ] );

            } else {

                // copy data to the new index in the temporary attributes
                for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

                    const name = attributeNames[ j ];
                    const attribute = geometry.getAttribute( name );
                    const morphAttributes = geometry.morphAttributes[ name ];
                    const itemSize = attribute.itemSize;
                    const newArray = tmpAttributes[ name ];
                    const newMorphArrays = tmpMorphAttributes[ name ];

                    for ( let k = 0; k < itemSize; k ++ ) {

                        const getterFunc = getters[ k ];
                        const setterFunc = setters[ k ];
                        newArray[ setterFunc ]( nextIndex, attribute[ getterFunc ]( index ) );

                        if ( morphAttributes ) {

                            for ( let m = 0, ml = morphAttributes.length; m < ml; m ++ ) {

                                newMorphArrays[ m ][ setterFunc ]( nextIndex, morphAttributes[ m ][ getterFunc ]( index ) );

                            }

                        }

                    }

                }

                hashToIndex[ hash ] = nextIndex;
                newIndices.push( nextIndex );
                nextIndex ++;

            }

        }

        // generate result BufferGeometry
        const result = geometry.clone();
        for ( const name in geometry.attributes ) {

            const tmpAttribute = tmpAttributes[ name ];

            result.setAttribute( name, new tmpAttribute.constructor(
                tmpAttribute.array.slice( 0, nextIndex * tmpAttribute.itemSize ),
                tmpAttribute.itemSize,
                tmpAttribute.normalized,
            ) );

            if ( ! ( name in tmpMorphAttributes ) ) continue;

            for ( let j = 0; j < tmpMorphAttributes[ name ].length; j ++ ) {

                const tmpMorphAttribute = tmpMorphAttributes[ name ][ j ];

                result.morphAttributes[ name ][ j ] = new tmpMorphAttribute.constructor(
                    tmpMorphAttribute.array.slice( 0, nextIndex * tmpMorphAttribute.itemSize ),
                    tmpMorphAttribute.itemSize,
                    tmpMorphAttribute.normalized,
                );

            }

        }

        // indices

        result.setIndex( newIndices );

        return result;

    }*/

};

const MathTool = M$3;

// point weight blend space javascript

/*
get_blend_space_2d_node_influences :: (using space : *Blend_Space_2d, position : Vec2) -> []f32 #must
{
    weights           := alloc_array (f32, nodes.count, temp_allocator);
    sqrd_distances    := alloc_array (f32, nodes.count, temp_allocator);
    angular_distances := alloc_array (f32, nodes.count, temp_allocator);

    total_sqrd_distance, total_angular_distance := 0.0;
    for nodes
    {
        sqrd_distance := dot (position - it.position, position - it.position);
        if sqrd_distance > 0
        {
            angular_distance := -(clamp (dot (normalize (position), normalize (it.position)), -1, 1) - 1) * 0.5;
            total_sqrd_distance += 1 / sqrd_distance;
            if angular_distance > 0 then total_angular_distance += 1 / angular_distance;
            sqrd_distances[it_index] = sqrd_distance;
            angular_distances[it_index] = angular_distance;
        }
        else    // The distance is 0 so it.position == position
        {
            // Weights are already initialized to 0
            weights[it_index] = 1;

            return weights;
        }
    }

    for i : 0..nodes.count - 1
    {
        sqrd_distance    := total_sqrd_distance    * sqrd_distances[i];
        angular_distance := total_angular_distance * angular_distances[i];
        if sqrd_distance > 0 && angular_distance > 0
            weights[i] = (1 / sqrd_distance) * 0.5 + (1 / angular_distance) * 0.5;
        else if sqrd_distance > 0
            weights[i] = (1 / sqrd_distance) * 0.5 + 0.5;
        else
            weight = 0;
    }

    return weights;
}
*/

const WithMassCenter = ['PHYSX', 'HAVOK'];


const Max = {
	body:4000,
    joint:1000,
    contact:4000,
    ray:100,
    character:100,
    vehicle:50,
    solver:20,
};

const Num = {
	bodyFull:14,
    body:8,
    joint:16,
    contact:1,
    ray:11,
    character:16,
    vehicle:72,//max 8 wheels
    solver:128,
};


// Define how many body phy can manage

const getArray = function ( engine, full = false ){

    const ArPos = {};

    let counts = {
        body: Max.body * ( full ? Num.bodyFull : Num.body ),
        joint: Max.joint * Num.joint,
        ray: Max.ray * Num.ray,
        contact: Max.contact * Num.contact,
        character: Max.character * Num.character
    };

    if( engine === 'PHYSX' || engine === 'AMMO' ){ 
        counts['vehicle'] = Max.vehicle * Num.vehicle;
    }

    if( engine === 'PHYSX' ){ 
        counts['solver'] = Max.solver * Num.solver;
    }

    if( engine === 'HAVOK' || engine === 'RAPIER' || engine === 'JOLT' ){ 
        Num.joint = 0;
    }

    let prev = 0;

    for( let m in counts ){ 

        ArPos[m] = prev;
        prev += counts[m];

    }

    ArPos['total'] = prev;

    return ArPos;

};


// Convert type for all engine

const getType = function ( o ) {
    switch( o.type ){
        case 'plane': case 'box': case 'sphere': case 'highSphere': case 'customSphere': case 'cylinder': case 'stair': case 'particle':
        case 'cone': case 'capsule': case 'mesh': case 'convex': case 'compound': case 'null':
            //if ( ( !o.mass || !o.density ) && !o.kinematic ) return 'solid'
            if ( !o.mass && !o.density && !o.kinematic ) return 'solid'
            else return 'body'
        case 'fixe':
        case 'generic': case 'universal': case "dof": case "d6": 
        case 'hinge': case 'revolute': 
        case "prismatic": 
        case 'cylindrical': case 'slider':
        case 'spherical':
        case 'ragdoll': 
        case "distance":
            return 'joint'
        default: 
            return o.type;
    }
};

class CircleHelper extends LineSegments {

	constructor( box, color = 0xffff00 ) {

		let size=0.6;

		const indices = new Uint16Array( [ 
			0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 0,   
			6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 6,
			12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 12,
			18,19, 20,21, 22, 23,
			] );
		const positions = [

		

		 0.5, 0.0, 0.0,
		0.25, 0.433, 0.0,
		-0.25, 0.433, 0.0,
		-0.5, 0.0, 0.0,
		-0.25, -0.433, 0.0,
		0.25, -0.433, 0.0, 

		 0.5, 0.0,0.0, 
		0.25,  0.0,0.433,
		-0.25,  0.0,0.433,
		-0.5, 0.0, 0.0,
		-0.25,0.0, -0.433, 
		0.25, 0.0, -0.433, 

		0.0,0.5, 0.0,
		0.0,0.25, 0.433, 
		0.0,-0.25, 0.433, 
		0.0,-0.5, 0.0, 
		0.0,-0.25, -0.433, 
		0.0,0.25, -0.433, 

		0, 0, 0,	size, 0, 0,
		0, 0, 0,	0, size, 0,
		0, 0, 0,	0, 0, size,

		
		];

		const colors = [

		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,

        1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,

		1, 0, 0,	1, 0, 0,
		0, 1, 0,	0, 1, 0,
		0, 0, 1,	0, 0, 1,

		];

		const geometry = new BufferGeometry();

		geometry.setIndex( new BufferAttribute( indices, 1 ) );

		geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		super( geometry, new LineBasicMaterial( { color: color, depthTest: false, depthWrite: false, toneMapped: false, transparent: true } ) );

		this.box = box;

		this.type = 'CircleHelper';

		this.geometry.computeBoundingSphere();

	}

	updateMatrixWorld( force ) {

		const box = this.box;

		if ( box.isEmpty() ) return;

		box.getCenter( this.position );

		box.getSize( this.scale );

		this.scale.multiplyScalar( 0.5 );

		super.updateMatrixWorld( force );

	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}

/**
* SPHERE BOX GEOMETRY
*/
class SphereBox extends BufferGeometry {

    constructor( radius=1, widthSegs=16, heightSegs=16, depthSegs=16, roundness=1 ) {
    //constructor( radius=1, widthSegs=2, heightSegs=2, depthSegs=2, roundness=1 ) {

        super();

        this.type = 'SphereBox';
        this.name = 'SphereBox_' + radius +'_'+widthSegs+'_'+heightSegs+'_'+depthSegs+'_'+roundness;

        radius = radius || 1;

        // segments

        widthSegs = Math.floor( widthSegs );
        heightSegs = Math.floor( heightSegs );
        depthSegs = Math.floor( depthSegs );        
        let g = new BoxGeometry( 1,1,1, widthSegs, heightSegs, depthSegs ), v = new Vector3(), r = new Vector3(), n;

        

        //;

        //g = mergeVertices( g );

        //createUV( g, 'box' );

        let posCount = g.attributes.position.count;
        let ar = g.attributes.position.array;
        let nm = g.attributes.normal.array;

        

        // uv for each face
        let uv = g.attributes.uv.array;
        let uvCount = g.attributes.uv.count;
        let nn, faceid;
        let fc = uvCount/6;
        let dx = 1/3;
        let dy = 1/2;
        let fx = 0;
        let fy = 0;

        for ( let i = 0; i < uvCount; i ++ ) {

            faceid = Math.floor(i/fc);
            switch(faceid){
                case 0 : fx = 0; fy = dy; break;
                case 5 : fx = dx; fy = dy; break;

                case 1 : fx = dx*2; fy = dy; break;
                case 4 : fx = 0; fy = 1; break;

                case 3 : fx = dx; fy = 1; break;
                case 2 : fx = dx*2; fy = 1; break;
            }

            nn = i*2;
            uv[nn] *= dx;
            uv[nn] += fx;
            uv[nn+1] *= -0.5;
            uv[nn+1] += fy;

            // remove white border
            //if(faceid===4 && uv[nn]>dx-0.01)uv[nn] -= 0.005
            //if(faceid===4 && uv[nn]>dx-0.0005)uv[nn] -= 0.0005

            if(uv[nn] > 1.0) uv[nn] = 1.0; 
            if(uv[nn] < 0.0) uv[nn] = 0.0;  

            if(uv[nn+1] > 1.0) uv[nn+1] = 1.0; 
            if(uv[nn+1] < 0.0) uv[nn+1] = 0.0;

        }

        for ( let i = 0; i < posCount; i ++ ) {

            n = i*3;
            v.set( ar[n], ar[n+1], ar[n+2] );
            r.copy( v ).normalize();

            v.lerp( r, roundness ).multiplyScalar( radius );

            ar[n] = v.x;
            ar[n+1] = v.y;
            ar[n+2] = v.z;

            v.normalize();

            nm[n] = v.x;
            nm[n+1] = v.y;
            nm[n+2] = v.z;
            
        }

        //g = mergeVertices( g );

        //g.computeVertexNormals()
        g.computeTangents();

        //console.log(g)

        //g.normalizeNormals()

        //g = toCreasedNormals(g)



        this.copy(g);

    }
}

/**
* CAPSULE GEOMETRY
*/
class Capsule extends BufferGeometry {

    constructor( radius = 1, height = 1, radialSegs = 12, heightSegs = 1 ) {

        super();

    	this.type = 'CapsuleGeometry';
        //this.name = 'Capsule_' + radius +'_'+height+'_'+radialSegs+'_'+heightSegs;

        let pi = Math.PI;

        let th = (radius*2) + height;
        let sy = radius / th;
        let hy = 1 - (2*sy);

        radialSegs = Math.floor( radialSegs );
        heightSegs = Math.floor( heightSegs );

        let sHeight = Math.floor( radialSegs * 0.5 );
        let o0 = Math.PI * 2;
        let o1 = Math.PI * 0.5;
        let m0 = new CylinderGeometry( radius, radius, height, radialSegs, heightSegs, true );
        //let m0 = new CylinderGeometryFix2( radius, radius, height, radialSegs, heightSegs, true );
        //let m0 = new CylinderGeometry( radius, radius, height, radialSegs, heightSegs, true );
        scaleUV$1( m0, 0, sy, 1, hy );
        let m1 = new SphereGeometry( radius, radialSegs, sHeight, 0, o0, 0, o1);
        scaleUV$1( m1, 0, 1-sy, 1, sy );
        let m2 = new SphereGeometry( radius, radialSegs, sHeight, 0, o0, o1, o1);
        scaleUV$1( m2, 0, 0, 1, sy );
        let mtx0 = new Matrix4().makeRotationY( -pi*0.5 );
        let mtx1 = new Matrix4().makeTranslation(0, height*0.5,0);
        let mtx2 = new Matrix4().makeTranslation(0, -height*0.5,0);
        m0.applyMatrix4( mtx0 );
        m1.applyMatrix4( mtx1 );
        m2.applyMatrix4( mtx2 );


        let g = mergeVertices( mergeGeometries( [ m0, m1, m2] ) );
        this.copy( g );

        /*m0.dispose()
        m1.dispose()
        m2.dispose()
        g.dispose()*/

    }
}


/**
* TORUS EXTRA GEOMETRY
*/
class TorusGeometryFix extends BufferGeometry {

    constructor( radius = 1, tube = 0.4, radialSegments = 8, tubularSegments = 6, arc= Math.PI * 2, thetaStart=0, thetaLength=Math.PI ) {

        super();

        this.type = 'TorusGeometryFix';

        this.parameters = {
            radius: radius,
            tube: tube,
            radialSegments: radialSegments,
            tubularSegments: tubularSegments,
            arc: arc
        };

        radialSegments = Math.floor( radialSegments );
        tubularSegments = Math.floor( tubularSegments );

        // buffers

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // helper variables

        const center = new Vector3();
        const vertex = new Vector3();
        const normal = new Vector3();

        let j, i;

        // generate vertices, normals and uvs

        for ( j = 0; j <= radialSegments; j ++ ) {

            for ( i = 0; i <= tubularSegments; i ++ ) {

                const u = i / tubularSegments * arc;
                //const v = j / radialSegments * Math.PI * 2;

                const v = (j / radialSegments) * thetaLength + thetaStart;

                // vertex

                vertex.x = ( radius + tube * Math.cos( v ) ) * Math.cos( u );
                vertex.y = ( radius + tube * Math.cos( v ) ) * Math.sin( u );
                vertex.z = tube * Math.sin( v );

                vertices.push( vertex.x, vertex.y, vertex.z );

                // normal

                center.x = radius * Math.cos( u );
                center.y = radius * Math.sin( u );
                normal.subVectors( vertex, center ).normalize();

                normals.push( normal.x, normal.y, normal.z );

                // uv

                uvs.push( i / tubularSegments );
                uvs.push( j / radialSegments );

            }

        }

        // generate indices

        for ( j = 1; j <= radialSegments; j ++ ) {

            for ( i = 1; i <= tubularSegments; i ++ ) {

                // indices

                const a = ( tubularSegments + 1 ) * j + i - 1;
                const b = ( tubularSegments + 1 ) * ( j - 1 ) + i - 1;
                const c = ( tubularSegments + 1 ) * ( j - 1 ) + i;
                const d = ( tubularSegments + 1 ) * j + i;

                // faces

                indices.push( a, b, d );
                indices.push( b, c, d );

            }

        }

        // build geometry

        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

    }
}


/**
* CHAMFER CYLINDRE GEOMETRY
*/
class ChamferCyl extends BufferGeometry {

    constructor( radiusTop = 1, radiusBottom = 1, height = 1, filet =0.01, radialSegs = 12, heightSegs = 1, filetSegs = 2 ) {

        super();

        this.type = 'ChamferCyl';
        //this.name = 'ChamferCyl_' + radiusTop +'_'+radiusBottom+'_'+height+'_'+filet+'_'+radialSegs+'_'+heightSegs+'_'+filetSegs;

        radialSegs = Math.floor( radialSegs );
        heightSegs = Math.floor( heightSegs );
        filetSegs = Math.floor( filetSegs );

        let mr = new Matrix4();
        let mt = new Matrix4();

        let pi = Math.PI;
        let p90 = pi * 0.5;
        let twoPi = pi * 2;

        let start = 0;//(twoPi / radialSegs)*(3/radialSegs)//;

        let th = height;
        let sy = filet / th;
        let hy = 1 - (2*sy);
        //console.log(start)

        //let mid = new CylinderGeometryFix( radiusBottom, radiusTop, height-(filet*2), radialSegs, heightSegs, true, start );
        let mid = new CylinderGeometry( radiusTop, radiusBottom, height-(filet*2), radialSegs, heightSegs, true, start );
        mr.makeRotationY( p90 );
        mid.applyMatrix4( mr );

        scaleUV$1( mid, 0, sy, 1, hy );

        // top
        let c1 = new TorusGeometryFix( radiusTop-filet, filet, filetSegs, radialSegs, twoPi, 0, p90 );
        let c2 = new CircleGeometry( radiusTop-filet, radialSegs );

        mt.makeTranslation( 0,0, filet );
        c2.applyMatrix4( mt );

        scaleUV$1( c1, 0, 1-sy, 1, sy );

        let top = mergeGeometries( [ c1, c2 ] );

        mr.makeTranslation( 0,0,( (height*0.5) - filet) );
        mt.makeRotationX( -p90 );

        top.applyMatrix4( mt.multiply(mr) );

        /*c1.dispose();
        c2.dispose();*/

        // bottom
        c1 = new TorusGeometryFix( radiusBottom-filet, filet, filetSegs, radialSegs, twoPi, 0, p90 );
        c2 = new CircleGeometry( radiusBottom-filet, radialSegs );

        mt.makeTranslation( 0,0, filet );
        c2.applyMatrix4( mt );

        scaleUV$1( c1, 0, 1-sy, 1, sy, true );

        let low = mergeGeometries( [ c1, c2 ] );

        mr.makeTranslation( 0,0,( (height*0.5) - filet) );
        mt.makeRotationX( p90 );
        low.applyMatrix4( mt.multiply(mr) );

        /*c1.dispose();
        c2.dispose();*/

        //this.geometry = mergeVertices( mergeGeometries( [ top, mid, low ] ) );

        let g = mergeVertices( mergeGeometries( [ top, mid, low ] ) );

        /*mid.dispose();
        top.dispose();
        low.dispose();*/

        this.copy(g);
        //g.dispose();

    }
}

//ChamferCyl.prototype = Object.create( THREE.BufferGeometry.prototype );

/**
* CHAMFER BOX GEOMETRY
*/
let ChamferBox$1 = class ChamferBox extends BufferGeometry {

    constructor( width  = 1, height = 1, depth = 1, filet = 0.01, widthSegs = 1, heightSegs = 1, depthSegs = 1, filetSegs = 2 ) {

        super();

        this.type = 'ChamferBox';
        //this.name = 'ChamferBox_' + width +'_'+height+'_'+depth+'_'+filet+'_'+widthSegs+'_'+heightSegs+'_'+depthSegs+'_'+filetSegs;

        widthSegs = Math.floor( widthSegs );
        heightSegs = Math.floor( heightSegs );
        depthSegs = Math.floor( depthSegs );
        filetSegs = Math.floor( filetSegs );

        let pi = Math.PI;
        let p90 = pi * 0.5;
        let twoFilet = filet * 2;

        let midWidth = width * 0.5;
        let midHeight = height * 0.5;
        let midDepth = depth * 0.5;

        let mr = new Matrix4();
        let mt = new Matrix4();
        let mp = new Matrix4();

        // uv calc

        let tw = width;
        let sw = filet / tw;
        let vw = 1 - (2*sw);

        let th = height;
        let sh = filet / th;
        let vh = 1 - (2*sw);

        let td = depth;
        let sd = filet / td;
        let vd = 1 - (2*sd);

        let f = new PlaneGeometry( width-twoFilet, height-twoFilet, widthSegs, heightSegs );
        let c1 = new CylinderGeometry( filet, filet, width-twoFilet, filetSegs, widthSegs, true, 0, p90 );
        let c2 = new CylinderGeometry( filet, filet, height-twoFilet, filetSegs, heightSegs, true, 0, p90 );
        let s1 = new SphereGeometryFix$1( filet, filetSegs, filetSegs, 0, p90, 0, -p90 );
        let s2 = new SphereGeometryFix$1( filet, filetSegs, filetSegs, 0, p90, 0, -p90 );

        scaleUV$1( f, -sw, sh, vw, vh );
        scaleUV$1( c1, 0, sw, sh, vw );
       //scaleUV( c2, 0, -sw, vw, sw )

        mt.makeTranslation( 0, midHeight - filet, 0 );
        mr.makeRotationX( p90 );
        s1.applyMatrix4( mt.multiply(mr) );

        mt.makeTranslation( 0, -midHeight + filet, 0 );
        mr.makeRotationX( p90 );
        mp.makeRotationY( -p90 );
        s2.applyMatrix4( mt.multiply(mr).multiply(mp) );

        let tra = mergeGeometries( [ c2, s1, s2 ] );
        let trc = tra.clone();

        /*c2.dispose();
        s1.dispose();
        s2.dispose();*/
        
        mt.makeTranslation( midWidth - filet, 0, -filet );

        tra.applyMatrix4( mt );

        mt.makeTranslation( -midWidth + filet, 0, -filet );
        mr.makeRotationZ( pi );

        trc.applyMatrix4( mt.multiply(mr) );

        // cylinder

        let c3 = c1.clone();

        mr.makeRotationZ( p90 );
        mt.makeTranslation( 0, midHeight - filet, -filet );
        c1.applyMatrix4( mt.multiply(mr) );
        mt.makeTranslation( 0, -midHeight + filet, -filet );
        mr.makeRotationZ( -p90 );
        c3.applyMatrix4( mt.multiply(mr) );

        let rf = mergeGeometries( [ c1, c3, f, tra, trc ] );
        let rg = rf.clone();

        mt.makeTranslation( 0, 0, midDepth );
        rf.applyMatrix4( mt );

        mt.makeTranslation( 0, 0, -midDepth );
        mr.makeRotationY( pi );
        rg.applyMatrix4( mt.multiply(mr) );

        // side left

        /*f.dispose();
        c1.dispose();
        c3.dispose();*/

        f = new PlaneGeometry( depth-twoFilet, height-twoFilet, depthSegs, heightSegs );
        c1 = new CylinderGeometry( filet, filet, depth-twoFilet, filetSegs, depthSegs, true, 0, p90 );
        c3 = c1.clone();

        scaleUV$1( f, -sd, sh, vd, vh );

        mt.makeTranslation( 0, -(midHeight - filet), -filet, 0 );
        mr.makeRotationZ( -p90 );

        c1.applyMatrix4( mt.multiply(mr) );

        mt.makeTranslation( 0, midHeight - filet, -filet, 0 );
        mr.makeRotationZ( p90 );

        c3.applyMatrix4( mt.multiply(mr) );


        let rr = mergeGeometries( [ c1, c3, f ] );
        let rb = rr.clone();

        /*f.dispose();
        c1.dispose();
        c3.dispose()*/

        mt.makeTranslation( -midWidth, 0, 0 );
        mr.makeRotationY( -p90 );

        rr.applyMatrix4( mt.multiply(mr) );

        // side right

        mt.makeTranslation( midWidth, 0, 0 );
        mr.makeRotationY( p90 );

        rb.applyMatrix4( mt.multiply(mr) );

        // top
        f = new PlaneGeometry( width-twoFilet, depth-twoFilet, widthSegs, depthSegs );
        scaleUV$1( f, -sw, sd, vw, vd );
        let f2 = f.clone();



        mt.makeTranslation( 0, midHeight, 0);
        mr.makeRotationX( -p90 );
        f.applyMatrix4( mt.multiply(mr) );

        // bottom
        mt.makeTranslation( 0, -midHeight, 0);
        mr.makeRotationX( p90 );
        f2.applyMatrix4( mt.multiply(mr) );

        let g = mergeVertices( mergeGeometries( [ rf, rg, rr, rb, f, f2 ] ) );

        /*rf.dispose();
        rg.dispose();
        rr.dispose();
        rb.dispose();
        f2.dispose();
        f.dispose();*/
        //g.computeVertexNormals()
        //g = g.toNonIndexed()
        //

        createUV$1(g, 'box');

        this.copy(g);
        /*g.dispose();*/

    }
};

let SphereGeometryFix$1 = class SphereGeometryFix extends BufferGeometry {

    constructor( radius = 1, widthSegments = 8, heightSegments = 6, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI ) {

        super();

        this.type = 'SphereGeometryFix';

        this.parameters = {
            radius: radius,
            widthSegments: widthSegments,
            heightSegments: heightSegments,
            phiStart: phiStart,
            phiLength: phiLength,
            thetaStart: thetaStart,
            thetaLength: thetaLength
        };

        widthSegments =  Math.floor( widthSegments );
        heightSegments =  Math.floor( heightSegments );

        const thetaEnd = Math.min( thetaStart + thetaLength, Math.PI );

        let index = 0;
        const grid = [];

        const vertex = new Vector3();
        const normal = new Vector3();

        // buffers

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // generate vertices, normals and uvs

        for ( let iy = 0; iy <= heightSegments; iy ++ ) {

            const verticesRow = [];

            const v = iy / heightSegments;

            // special case for the poles

            let uOffset = 0;

            if ( iy == 0 && thetaStart == 0 ) {

                uOffset = 0.5 / widthSegments;

            } else if ( iy == heightSegments && thetaEnd == Math.PI ) {

                uOffset = -0.5 / widthSegments;

            }

            for ( let ix = 0; ix <= widthSegments; ix ++ ) {

                const u = ix / widthSegments;

                // vertex

                vertex.x = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
                vertex.y = radius * Math.cos( thetaStart + v * thetaLength );
                vertex.z = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

                vertices.push( vertex.x, vertex.y, vertex.z );

                // normal

                normal.copy( vertex ).normalize();
                normals.push( normal.x, normal.y, normal.z );

                // uv

                uvs.push( u + uOffset, 1 - v );

                verticesRow.push( index ++ );

            }

            grid.push( verticesRow );

        }

        // indices

        for ( let iy = 0; iy < heightSegments; iy ++ ) {

            for ( let ix = 0; ix < widthSegments; ix ++ ) {

                const a = grid[ iy ][ ix + 1 ];
                const b = grid[ iy ][ ix ];
                const c = grid[ iy + 1 ][ ix ];
                const d = grid[ iy + 1 ][ ix + 1 ];

                if ( iy !== 0 || thetaStart > 0 ) indices.push( a, b, d );
                if ( iy !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );

            }

        }

        // build geometry

        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

    }

};

// { SphereGeometryFix };


// UV 

function scaleUV$1( geometry, x=0, y=0, dx=1, dy=1, reverse ) {

    let uv = geometry.attributes.uv;
    let ar = uv.array;
    let i = uv.count, n =0;

    while( i-- ){
        n=i*2;
        ar[n] = (ar[n]*dx)-x;
        ar[n+1] = (ar[n+1]*dy)+y;

        if(reverse){
            ar[n] = 1 - ar[n];
            ar[n+1] = 1 - ar[n+1];
        }
    }


}

function createUV$1( geometry, type = 'sphere', boxSize, pos = [0,0,0], quat = [0,0,0,1], transformMatrix ) {

    //type = type || 'sphere';

    if ( transformMatrix === undefined ) transformMatrix = new Matrix4();
    transformMatrix.compose( {x:pos[0], y:pos[1], z:pos[2] }, { _x:quat[0], _y:quat[1], _z:quat[2], _w:quat[3] }, {x:1, y:1, z:1 });



    if ( boxSize === undefined ) {
        if( !geometry.boundingBox ) geometry.computeBoundingBox();
        let bbox = geometry.boundingBox;
        boxSize = Math.max( bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z );
    }

    //.expandByScalar(0.9);//new THREE.Box3( new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2));
    //_applyBoxUV( bufferGeometry, transformMatrix, uvBbox, boxSize );

    let uvBbox = new Box3(new Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new Vector3(boxSize / 2, boxSize / 2, boxSize / 2));
    //let uvBbox = new Box3(new Vector3(-(boxSize / 2)/3, -(boxSize / 2)/3, -(boxSize / 2)/3), new Vector3((boxSize / 2)/3, (boxSize / 2)/3, (boxSize / 2)/3));
    //let uvBbox = bbox
    


    let coords = [];
    //coords.length = 2 * geometry.attributes.position.array.length / 3;
    coords.length = 2 * geometry.attributes.position.count;

    //if ( geometry.attributes.uv === undefined ) geometry.addAttribute('uv', new Float32BufferAttribute(coords, 2));
    if ( geometry.attributes.uv === undefined ) geometry.setAttribute('uv', new Float32BufferAttribute(coords, 2));
    
    let makeSphereUVs = function( v0, v1, v2 ) {

        //pre-rotate the model so that cube sides match world axis
        v0.applyMatrix4(transformMatrix);
        v1.applyMatrix4(transformMatrix);
        v2.applyMatrix4(transformMatrix);

        let invTwoPi = 1 / (2.0 * Math.PI);
        let invPi = 1 / Math.PI;

        v0.normalize();
        v1.normalize();
        v2.normalize();

        return {
            uv0: new Vector2( .5 - Math.atan( v0.z, - v0.x ) * invTwoPi, .5 - Math.asin( v0.y ) * invPi ),
            uv1: new Vector2( .5 - Math.atan( v1.z, - v1.x ) * invTwoPi, .5 - Math.asin( v1.y ) * invPi ),
            uv2: new Vector2( .5 - Math.atan( v2.z, - v2.x ) * invTwoPi, .5 - Math.asin( v2.y ) * invPi ),
        };

    };


  
    //maps 3 verts of 1 face on the better side of the cube
    //side of the cube can be XY, XZ or YZ
    let makeCubeUVs = function( v0, v1, v2 ) {

        //pre-rotate the model so that cube sides match world axis
        v0.applyMatrix4(transformMatrix);
        v1.applyMatrix4(transformMatrix);
        v2.applyMatrix4(transformMatrix);

        //get normal of the face, to know into which cube side it maps better
        let n = new Vector3();
        n.crossVectors( v1.clone().sub(v0), v1.clone().sub(v2) ).normalize();
        if(n.x<0 || n.y<0 || n.z<0) ;

        n.x = Math.abs(n.x);
        n.y = Math.abs(n.y);
        n.z = Math.abs(n.z);

        let uv0 = new Vector2();
        let uv1 = new Vector2();
        let uv2 = new Vector2();
        let max = 1/boxSize;

        
        // xz mapping
        if ( n.y > n.x && n.y > n.z ) {

            uv0.set( v0.x - uvBbox.min.x, uvBbox.max.z - v0.z ).multiplyScalar( max );
            uv1.set( v1.x - uvBbox.min.x, uvBbox.max.z - v1.z ).multiplyScalar( max );
            uv2.set( v2.x - uvBbox.min.x, uvBbox.max.z - v2.z ).multiplyScalar( max );

        } else if ( n.x > n.y && n.x > n.z ) {

            uv0.set( v0.z - uvBbox.min.z, v0.y - uvBbox.min.y ).multiplyScalar( max );
            uv1.set( v1.z - uvBbox.min.z, v1.y - uvBbox.min.y ).multiplyScalar( max );
            uv2.set( v2.z - uvBbox.min.z, v2.y - uvBbox.min.y ).multiplyScalar( max );

        } else if ( n.z > n.y && n.z > n.x ) {

            uv0.set( v0.x - uvBbox.min.x, v0.y - uvBbox.min.y ).multiplyScalar( max );
            uv1.set( v1.x - uvBbox.min.x, v1.y - uvBbox.min.y ).multiplyScalar( max );
            uv2.set( v2.x - uvBbox.min.x, v2.y - uvBbox.min.y ).multiplyScalar( max );

        }

        return { uv0: uv0, uv1: uv1, uv2: uv2 } 
    };



    let i, id0, id1, id2, uvs;
    let v0 = new Vector3();
    let v1 = new Vector3();
    let v2 = new Vector3();

    new Vector3();
    new Vector3();
    new Vector3();

    const positionAttribute = geometry.getAttribute( 'position' );
    geometry.getAttribute( 'normal' );

    if ( geometry.index ) { // is it indexed buffer geometry

        for (i = 0; i < geometry.index.count; i+=3 ) {

            //console.log('is index')

            //n = i*3;
            id0 = geometry.index.getX( i + 0 );
            id1 = geometry.index.getX( i + 1 );
            id2 = geometry.index.getX( i + 2 );

            v0.fromBufferAttribute( positionAttribute, id0 );
            v1.fromBufferAttribute( positionAttribute, id1 );
            v2.fromBufferAttribute( positionAttribute, id2 );

            /*nn0.fromBufferAttribute( normalAttribute, id0 );
            nn1.fromBufferAttribute( normalAttribute, id1 );
            nn2.fromBufferAttribute( normalAttribute, id2 )*/



            if( type === 'sphere' ) uvs = makeSphereUVs( v0, v1, v2 );
            else uvs = makeCubeUVs( v0, v1, v2);

            coords[2 * id0] = uvs.uv0.x;
            coords[2 * id0 + 1] = uvs.uv0.y;

            coords[2 * id1] = uvs.uv1.x;
            coords[2 * id1 + 1] = uvs.uv1.y;

            coords[2 * id2] = uvs.uv2.x;
            coords[2 * id2 + 1] = uvs.uv2.y;
        }
    } else {

        for ( i = 0; i < positionAttribute.count; i += 3) {

            v0.fromBufferAttribute( positionAttribute, i + 0 );
            v1.fromBufferAttribute( positionAttribute, i + 1 );
            v2.fromBufferAttribute( positionAttribute, i + 2 );

            if( type === 'sphere' ) uvs = makeSphereUVs( v0, v1, v2 );
            else uvs = makeCubeUVs( v0, v1, v2 );

            let idx0 = i;//vi / 3;
            let idx1 = i+1;//idx0 + 1;
            let idx2 = i+2;//idx0 + 2;

            coords[2 * idx0] = uvs.uv0.x;
            coords[2 * idx0 + 1] = uvs.uv0.y;

            coords[2 * idx1] = uvs.uv1.x;
            coords[2 * idx1 + 1] = uvs.uv1.y;

            coords[2 * idx2] = uvs.uv2.x;
            coords[2 * idx2 + 1] = uvs.uv2.y;
        }

    }

    geometry.attributes.uv.array = new Float32Array( coords );
    geometry.attributes.uv.needsUpdate = true;

}


/*
export function calcNormal( normals, normal, angle ){

    let allowed = normals.filter( n => n.angleTo( normal ) < angle * Math.PI / 180 );
    return allowed.reduce( (a, b) => a.clone().add( b ) ).normalize();

}

export function computeVertexNormals(geometry, angle){

    geometry.computeFaceNormals();
    
    var vertices = geometry.vertices.map( () => [] ); // vertices with normals array

    geometry.faces.map( face => {
        vertices[ face.a ].push( face.normal );
        vertices[ face.b ].push( face.normal );
        vertices[ face.c ].push( face.normal );
    });

    geometry.faces.map( face => {
        face.vertexNormals[ 0 ] = calcNormal( vertices[ face.a ], face.normal, angle );
        face.vertexNormals[ 1 ] = calcNormal( vertices[ face.b ], face.normal, angle );
        face.vertexNormals[ 2 ] = calcNormal( vertices[ face.c ], face.normal, angle );
    });

    if ( geometry.faces.length > 0 ) geometry.normalsNeedUpdate = true;

}*/

/*

BufferGeometry.prototype.computeMorphFaceNormals = function () {

        var i, il, f, fl, face;

        // save original normals
        // - create temp variables on first access
        //   otherwise just copy (for faster repeated calls)

        for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

            face = this.faces[ f ];

            if ( ! face.__originalFaceNormal ) {

                face.__originalFaceNormal = face.normal.clone();

            } else {

                face.__originalFaceNormal.copy( face.normal );

            }

        }

        // use temp geometry to compute face normals for each morph

        var tmpGeo = new THREE.Geometry();
        tmpGeo.faces = this.faces;

        for ( i = 0, il = this.morphTargets.length; i < il; i ++ ) {

            // create on first access

            if ( ! this.morphNormals[ i ] ) {

                this.morphNormals[ i ] = {};
                this.morphNormals[ i ].faceNormals = [];

                var dstNormalsFace = this.morphNormals[ i ].faceNormals;

                var faceNormal;

                for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

                    faceNormal = new Vector3();

                    dstNormalsFace.push( faceNormal );

                }

            }

            var morphNormals = this.morphNormals[ i ];

            // set vertices to morph target

            tmpGeo.vertices = this.morphTargets[ i ].vertices;

            // compute morph normals

            tmpGeo.computeFaceNormals();

            // store morph normals

            var faceNormal;

            for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

                face = this.faces[ f ];

                faceNormal = morphNormals.faceNormals[ f ];

                faceNormal.copy( face.normal );
            }

        }

        // restore original normals

        for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

            face = this.faces[ f ];

            face.normal = face.__originalFaceNormal;

        }

    }
    */

//-------------------
//
//  GEOMETRY POOL
//
//-------------------

let Geo$1 = class Geo {

	constructor(){

		this.geoN = 0;
		this.geo = {};

	}

	unic ( g ) {
        //console.log(g)
		this.geo[ 'geo' + this.geoN++ ] = g;

	}

	set( g ) {

		this.geo[g.name] = g;

	}

	get( name, o = {} ) {

		if( !this.geo[name] ){
			let g;
			switch( name ){
				case 'plane':    g = new PlaneGeometry(1,1); g.rotateX( -Math.PI * 0.5 ); break
				case 'box':      g = new BoxGeometry(1,1,1); break
				case 'sphere':   g = new SphereGeometry( 1, 16, 12 ); break
				case 'highSphere': g = new SphereBox( 1 ); break
				case 'cylinder': g = new CylinderGeometry( 1, 1, 1 , 16 ); break
				//case 'wheel':    g = new CylinderGeometry( 1, 1, 1 , 16 ); g.rotateX( -Math.PI * 0.5 ); break
				case 'cone':     g = new CylinderGeometry( 0.001, 1, 1 , 16 ); break
				//case 'joint':    g = new Box3Helper().geometry; g.scale( 0.05,0.05,0.05 ); break
				case 'particle': g = new SphereGeometry( 1.0, 6, 4 ); break
				case 'joint':    g = new CircleHelper().geometry; break
				default: return null;
			}
			this.geo[name] = g;
		}

		return this.geo[name]
		
	}

	dispose () {

		// TODO BUG with Start demo and HAVOK !!!
		
		//console.log( geo )
		for( let n in this.geo ){
		    if( this.geo[n].isBufferGeometry ) this.geo[n].dispose();
		    else console.log(this.geo[n]);
		}
		this.geo = {};
		this.geoN = 0;

	}

};

class CarbonTexture {

	constructor( normal, c1='rgb(69,69,69)', c2='rgb(39,39,39)'  ) {

		let s = 128;

		const canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;

		const ctx = canvas.getContext( '2d' );
		ctx.fillStyle = c1;
		ctx.fillRect( 0, 0, s, s );

		if( !normal ){

			ctx.beginPath();
			ctx.fillStyle = c2;
		    ctx.rect(0, 0, 32, 64);
		    ctx.rect(32, 32, 32, 64);
		    ctx.rect(64, 64, 32, 64);
		    ctx.rect(96, 96, 32, 64);
		    ctx.rect(96, -32, 32, 64);
		    ctx.fill();

	    } else {

	    	let i, j, n, d;
	    	let pos = [ [0, 0], [32, 32],[64, 64],[96, 96],[96, -32] ];
	    	let deg = [ [0, 64], [32, 96],[64, 128],[96, 160],[-32, 32] ];

	    	let f1 = normal ? 'rgb(128,128,255)' : c1;
	    	let f2 = normal ? 'rgb(160,100,255)' : c2;
	    	let f3 = normal ? 'rgba(100,160,255, 0.5)' : 'rgba(0,0,0, 0.1)';

	    	ctx.strokeStyle = f3;
	    	ctx.lineWidth = 1;

	    	for( i = 0; i<5; i++ ){

	    		d = ctx.createLinearGradient(0, deg[i][0], 0, deg[i][1]);
				d.addColorStop(0, f2);
				d.addColorStop(1, f1);

				ctx.beginPath();
				ctx.fillStyle = d;
				ctx.rect(pos[i][0], pos[i][1], 32, 64);
				ctx.fill();

				for( let j = 0; j<8; j++ ){   

					n = (Math.random()-0.5) * 2; 
				           
				    ctx.beginPath();
					ctx.moveTo(pos[i][0]+n+2+j*4, pos[i][1]);
					ctx.lineTo(pos[i][0]+n+2+j*4, pos[i][1]+64);
					ctx.stroke();
				}

	    	}

	    	pos = [ [32, 0], [64, 32],[96, 64],[-32, 64],[0, 96] ];
	    	deg = [ [32, 96], [64, 128],[96, 160],[-32, 32],[0, 64] ];

	    	for( i = 0; i<5; i++ ){

	    		d = ctx.createLinearGradient(deg[i][0], 0, deg[i][1], 0);
				d.addColorStop(0, f1);
				d.addColorStop(1, f2);

				ctx.beginPath();
				ctx.fillStyle = d;
				ctx.rect(pos[i][0], pos[i][1], 64, 32);
				ctx.fill();

				for( j = 0; j<8; j++ ){

					n = (Math.random()-0.5) * 2; 
					ctx.beginPath();
					ctx.moveTo(pos[i][0], pos[i][1]+n+2+j*4);
					ctx.lineTo(pos[i][0]+64, pos[i][1]+n+2+j*4);
					ctx.stroke();
				}

	    	}

	    }

		//return canvas;

		const texture = new CanvasTexture( canvas ); //new CarbonTexture('#ffffff', '#CCCCCC') )
		texture.wrapS = texture.wrapT = RepeatWrapping;
		texture.repeat.x = texture.repeat.y = 60;

		if(!normal) texture.colorSpace = SRGBColorSpace;

		return texture;

	}

}

/**
 * ------------------------------------------------------------------------------------------
 * Subsurface Scattering shader
 * Based on GDC 2011 – Approximating Translucency for a Fast, Cheap and Convincing Subsurface Scattering Look
 * https://colinbarrebrisebois.com/2011/03/07/gdc-2011-approximating-translucency-for-a-fast-cheap-and-convincing-subsurface-scattering-look/
 *------------------------------------------------------------------------------------------
 */

class MeshSssMaterial extends MeshPhysicalMaterial {

	constructor( parameters ) {

		super();

		this.defines = {

			'STANDARD': '',
			'PHYSICAL': '',
			'SUBSURFACE': '',
			'USE_UV': '',

		};

		this.extra = {};

		this.addParametre( 'sssMap', null );
		this.addParametre( 'sssColor', new Color( 0,0,0 ) );
		this.addParametre( 'sssAmbient', 0.5 );
		this.addParametre( 'sssDistortion', 0.6 );
		this.addParametre( 'sssAttenuation', 0.1 );
		this.addParametre( 'sssPower', 1.0 );
		this.addParametre( 'sssScale', 6.0 );
		
		this.setValues( parameters );

		let self = this;

        self.onBeforeCompile = function ( shader ) {
        	for(let name in self.extra ) {
				shader.uniforms[ name ] = { value: self.extra[name] };
			}

			shader.fragmentShader = shader.fragmentShader.replace( '#include <common>', shaderChange.common );
			shader.fragmentShader = shader.fragmentShader.replace( '#include <lights_fragment_begin>', 
				self.replaceAll(
					lights_fragment_begin,
					'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
					shaderChange.light
				)
			);

			self.userData.shader = shader;
        };

	}

	addParametre( name, value ){

		this.extra[ name ] = value;

		Object.defineProperty( this, name, {
			get: () => ( this.extra[ name ] ),
			set: ( v ) => {
				this.extra[ name ] = v;
				if( this.userData.shader ) this.userData.shader.uniforms[name].value = this.extra[ name ];
			}
		});
	}

	replaceAll( string, find, replace ) {

		return string.split( find ).join( replace );

	}

	/*customProgramCacheKey(){

		return self

	} */

	/*onBeforeCompile( shader ){

		for(let name in this.extra ) {
			shader.uniforms[ name ] = { value: this.extra[name] };
		}

		shader.fragmentShader = shader.fragmentShader.replace( '#include <common>', shaderChange.common );
		shader.fragmentShader = shader.fragmentShader.replace( '#include <lights_fragment_begin>', 
			this.replaceAll(
				THREE.ShaderChunk[ 'lights_fragment_begin' ],
				'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
				shaderChange.light
			)
		);

		this.userData.shader = shader;

	}*/

}

const shaderChange = {

	common : /* glsl */`
	#include <common>
	uniform sampler2D sssMap;
	uniform float sssPower;
	uniform float sssScale;
	uniform float sssDistortion;
	uniform float sssAmbient;
	uniform float sssAttenuation;
	uniform vec3 sssColor;

	void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
		vec3 thickness = sssColor * texture2D(sssMap, uv).r;
		vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * sssDistortion));
		float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), sssPower) * sssScale;
		vec3 scatteringIllu = (scatteringDot + sssAmbient) * thickness;
		reflectedLight.directDiffuse += scatteringIllu * sssAttenuation * directLight.color;
	}
	`,
	light : /* glsl */`
	RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	#if defined( SUBSURFACE ) && defined( USE_UV )
		RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);
	#endif
	`
};


const lights_fragment_begin = /* glsl */`

vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );

vec3 geometryClearcoatNormal = vec3( 0.0 );

#ifdef USE_CLEARCOAT

	geometryClearcoatNormal = clearcoatNormal;

#endif

#ifdef USE_IRIDESCENCE

	float dotNVi = saturate( dot( normal, geometryViewDir ) );

	if ( material.iridescenceThickness == 0.0 ) {

		material.iridescence = 0.0;

	} else {

		material.iridescence = saturate( material.iridescence );

	}

	if ( material.iridescence > 0.0 ) {

		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );

		// Iridescence F0 approximation
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );

	}

#endif

IncidentLight directLight;

#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )

	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {

		pointLight = pointLights[ i ];

		getPointLightInfo( pointLight, geometryPosition, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )

	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;

	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {

		spotLight = spotLights[ i ];

		getSpotLightInfo( spotLight, geometryPosition, directLight );

		// spot lights are ordered [shadows with maps, shadows without maps, maps without shadows, none]
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif

		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif

		#undef SPOT_LIGHT_MAP_INDEX

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )

	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {

		directionalLight = directionalLights[ i ];

		getDirectionalLightInfo( directionalLight, directLight );

		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif

		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )

	RectAreaLight rectAreaLight;

	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {

		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );

	}
	#pragma unroll_loop_end

#endif

#if defined( RE_IndirectDiffuse )

	vec3 iblIrradiance = vec3( 0.0 );

	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );

	#if defined( USE_LIGHT_PROBES )

		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );

	#endif

	#if ( NUM_HEMI_LIGHTS > 0 )

		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {

			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );

		}
		#pragma unroll_loop_end

	#endif

#endif

#if defined( RE_IndirectSpecular )

	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );

#endif
`;

//import { EnhanceShaderLighting } from '../../3TH/shaders/EnhanceShaderLighting.js';
//import { EnhanceLighting } from '../../3TH/shaders/EnhanceLighting.js';
//import { FakeGlowMaterial } from '../../3TH/materials/FakeGlowMaterial.js';


//-------------------
//
//  MATERIAL
//  https://physicallybased.info/
//
//-------------------

const matExtra = {

	//clearcoat:1.0,
	//clearcoatRoughness:0.1,
	metalness: 0.1,
	roughness: 0.9,
	//normalScale: new Vector2(0.25,0.25),

};

/*export const RealismLightOption = {
	enableESL:true,
	exposure:1,
	envMapIntensity:1,

	aoColor: new Color(0x000000),
	hemisphereColor: new Color(0xffffff),
    irradianceColor: new Color(0xffffff),
    radianceColor: new Color(0xffffff),

    aoPower: 9.7,//6,
    aoSmoothing: 0.26,
    aoMapGamma: 0.89,
    lightMapGamma: 0.9,//1,
    lightMapSaturation: 1,
    envPower: 1,//2
    roughnessPower: 1,//1.45,
    sunIntensity: 0,
    mapContrast: 1,//0.93,
    lightMapContrast: 1.03,
    smoothingPower: 0.76,
    irradianceIntensity: 6.59,
    radianceIntensity: 4.62,
    hardcodeValues: false

}*/

const Colors = {
	grey:new Color( 0.180,0.180,0.180 ),//
	black:new Color( 0.039,0.039,0.039 ),//0.180,0.180,0.180
    body:new Color( 0xCAC6C3 ),//0xefefd4
    sleep:new Color( "hsl(33, 15%, 54%)" ),//0x9FBFBD
    solid:new Color( 0x6C6A68 ),//
    base:new Color( 0xc9c8c7 ),

    brick:new Color( 0.262,0.095,0.061 ),
    sand:new Color( 0.440,0.386,0.231 ),
    //black:new Color( "hsl(220, 8%, 15%)" ),
    gold:new Color( 0.944, 0.776, 0.373 ),
    gold2:new Color( 0.998, 0.981, 0.751 ),
    titanium: new Color(0.633,0.578,0.503),
    titaniumSpec: new Color(0.728,0.680,0.550),
    chrome: new Color(0.653,0.650,0.615),
    chromeSpec: new Color(0.675,0.720,0.711),
    copper:new Color( 0.988,0.688,0.448 ),
    carPaint:new Color( 0.1037792, 0.59212029, 0.85064936 ),
    clay:new Color( "hsl(12, 30%, 40%)" ),
    clayWhite:new Color( 0xa9a9a9 ),
    concrete:new Color( 0.510,0.510,0.510 ),

    Raw_Fire:new Color( "hsl(40, 18%, 54%)" ),
    Raw_Buff:new Color( "hsl(33, 15%, 54%)" ),
    Raw_Terracotta:new Color( "hsl(12, 30%, 40%)" ),
    Raw_Porcelain:new Color( "hsl(45, 15%, 90%)" ),

};

const ThreeVariable = {

	No: NoBlending,
	Normal: NormalBlending,
	Additive: AdditiveBlending,
	Subtractive: SubtractiveBlending,
	Multiply: MultiplyBlending,

	Eadd: AddEquation,
	Esub: SubtractEquation,
	Erev: ReverseSubtractEquation,
	Emin: MinEquation,
	Emaw: MaxEquation,

	Fzero: ZeroFactor,
	Fone:  OneFactor,
	Fcolor: SrcColorFactor,
	Fcolorm: OneMinusSrcColorFactor,
	Falpha: SrcAlphaFactor,
	Falpham: OneMinusSrcAlphaFactor,
	Fdstalpha: DstAlphaFactor,
	Fdstalpham: OneMinusDstAlphaFactor,
	Fdstcolor: DstColorFactor,
	Fdstcolorm: OneMinusDstColorFactor,
	Falphasaturate: SrcAlphaSaturateFactor, // ! not for destination

	Front: FrontSide,
	Back: BackSide,
	Double: DoubleSide,

};
/*
const addRenderMode = ()=>{

	let s = ShaderChunk.common;
	s = s.replace( '#define EPSILON 1e-6', `
		#define EPSILON 1e-6
		uniform int renderMode;
		uniform int depthPacking;
		varying vec2 vZW;
    `);
    ShaderChunk.common = s;

    ShaderChunk.clipping_planes_vertex = `
        #if NUM_CLIPPING_PLANES > 0
            vClipPosition = - mvPosition.xyz;
        #endif
        vZW = gl_Position.zw;
    `;

    s = ShaderChunk.dithering_fragment;
	s = s.replace( '#endif', `
		#endif

        #ifdef STANDARD

        if( renderMode == 1 ){ // depth render
            float fz = 0.5 * vZW[0] / vZW[1] + 0.5;
            fz=pow(fz, 10.0);
            gl_FragColor = depthPacking == 1 ? packDepthToRGBA( fz ) : vec4( vec3( 1.0 - fz ), opacity );
        }
        if( renderMode == 2 ) gl_FragColor = vec4(  packNormalToRGB( normal ), opacity );// normal render
        //if( renderMode == 3 ) gl_FragColor = vec4(  shadowColor, opacity );// normal render

        #else

        if( renderMode != 0 ) discard;

        #endif
    `);
    ShaderChunk.dithering_fragment = s;


}*/

let Mat$3 = class Mat {

	constructor(){

		this.renderMode = { value: 0 };
		this.depthPacking = { value: 0 };
		this.extendMat = false;

		this.isRealism=false;
		this.realismOption={};
		this.envMapIntensity=1.0;

		this.mat = {};
		this.TmpMat = [];

	}

	changeRenderMode (n) {

		this.renderMode.value = n;

	}

	initExtandShader () {
		//addRenderMode()
		//this.extendMat = true;
	}
	

	useRealLight (o) {

		/*this.isRealism = true;

		// apply color setting number
		for(let c in o){
			if(c.search('Color')!==-1){
				if(!o[c].isColor){
					RealismLightOption[c].set( o[c] );
					delete o[c];
				}
			} 
		}

		this.realismOption = { ...RealismLightOption, ...o };*/

	}

	setColor( o ) {

		/*if(!this.isRealism) return;

		//console.log(o)

		RealismLightOption.aoColor.set(o.minLuma).convertLinearToSRGB()
		RealismLightOption.hemisphereColor.set(o.maxLuma).convertLinearToSRGB()
		RealismLightOption.irradianceColor.set(o.sun).convertLinearToSRGB()
		RealismLightOption.radianceColor.set(o.vibrant).convertLinearToSRGB()*/

	}

	set( m, direct, beforeCompile = null ) {

		if(!beforeCompile) beforeCompile = m.onBeforeCompile;
		//if(!direct) this.extendShader( m, beforeCompile );
		this.mat[m.name] = m;

	}

	extendShader( m, beforeCompile = null ) { 

		//let oldCompile = null;
		//if( m.onBeforeCompile ) oldCompile = m.onBeforeCompile;

		/*if( this.isRealism ){
			m.onBeforeCompile = function ( shader ) {
				//shader.uniforms.renderMode = this.renderMode;
				//shader.uniforms.depthPacking = this.depthPacking;

				EnhanceLighting( shader, this.realismOption );
		        m.userData.isRealism = true;
		        m.userData.shader = shader;
	            if( beforeCompile ) beforeCompile( shader );
	        }

		} else {
			m.onBeforeCompile = function ( shader ) {

				shader.uniforms.renderMode = this.renderMode;
				shader.uniforms.depthPacking = this.depthPacking;

	            if( beforeCompile ) beforeCompile( shader );
	            m.userData.shader = shader;
	        }
		}*/
		
	}

	addToTmp( m ) {

		this.TmpMat.push( m );

	}

	create( o ) {

		let m, beforeCompile = null;

		if( o.isMaterial ){
			m = o;
		} else {

			let type = o.type !== undefined ? o.type : 'Standard';
			if( o.type ) delete o.type;

			//if( !o.shadowSide ) o.shadowSide = 'double'

			beforeCompile = o.beforeCompile || null;
		    if( o.beforeCompile ) delete o.beforeCompile;

			if( o.thickness || o.sheen || o.clearcoat || o.transmission || o.specularColor ) type = 'Physical';

			if(o.normalScale){
				if( !o.normalScale.isVector2 ) o.normalScale = new Vector2().fromArray(o.normalScale);
			}

		    //if( o.map ) o.map.colorSpace = SRGBColorSpace;

		    if( o.side ) o.side = this.findValue( o.side );
		    if( o.shadowSide ) o.shadowSide = this.findValue( o.shadowSide );
		    if( o.blending ) o.blending = this.findValue( o.blending );
		    if( o.blendEquation ) o.blendEquation = this.findValue( o.blendEquation );
		    if( o.blendEquationAlpha ) o.blendEquationAlpha = this.findValue( o.blendEquationAlpha );
		    if( o.blendSrc ) o.blendSrc = this.findValue( o.blendSrc );
		    if( o.blendDst ) o.blendDst = this.findValue( o.blendDst );
		    if( o.blendDstAlpha ) o.blendDstAlpha = this.findValue( o.blendDstAlpha );
		    if( o.blendSrcAlpha ) o.blendSrcAlpha = this.findValue( o.blendSrcAlpha );

		    if(o.clearcoatNormalScale){
				if( !o.clearcoatNormalScale.isVector2 ) o.clearcoatNormalScale = new Vector2().fromArray( o.clearcoatNormalScale );
			}

		    type = type.toLowerCase();

		    switch( type ){

				case 'physical': 
					m = new MeshPhysicalMaterial( o ); 
					/*m.defines = {
						'STANDARD': '',
						'PHYSICAL': '',
						'USE_UV':'',
						'USE_SPECULAR':''
					}*/
				break;
				case 'phong': m = new MeshPhongMaterial( o ); break;
				case 'lambert': m = new MeshLambertMaterial( o ); break;
				case 'basic': m = new MeshBasicMaterial( o ); break;
				case 'line': m = new LineBasicMaterial( o ); break;
				case 'toon': m = new MeshToonMaterial( o ); break;
				case 'shadow': m = new ShadowMaterial( o ); break;
				case 'sss': m = new MeshSssMaterial( o ); break;
				default: m = new MeshStandardMaterial( o ); break;

			}

			///Mat.upEnvmapIntensity( m );

		} 

		if( this.mat[ m.name ] ) return null;
	    this.set( m, false, beforeCompile );
		return m;

	}

	findValue(v) { 
		return v === 'string' ? ThreeVariable[ v.charAt(0).toUpperCase() + v.slice(1) ] : v 
	}

	addToMat( o ) {

		if( this.isRealism ){
			for(let m in o){
				//o[m].shadowSide = DoubleSide;
				o[m].onBeforeCompile = function ( shader ) {
		            EnhanceLighting( shader, this.realismOption );
		            o[m].userData.isRealism = true;
		            o[m].userData.shader = shader;
		        };
			}


		}

		this.mat = { ...this.mat, ...o };

	}

	changeType() {



	}

	directIntensity ( v ) {

		for( let name in this.mat ) {
		//	if( mat[name].envMapIntensity ) mat[name].envMapIntensity = v;
		}
		
	}

	
	getList () {

		let l = {...this.mat};
		const ignor = ['line', 'debug', 'hide', 'svg'];
		let i = ignor.length;
		while(i--) delete l[ignor[i]];

		return l

	}

	get( name ) {

		if( !this.mat[name] ){
			switch( name ){

				case 'grey': this.create({name:'grey', color:Colors.grey, metalness: 0.0, roughness: 0.5 }); break
				case 'black':   this.create({ name:'black', color:Colors.black, metalness: 0, roughness: 0.5 }); break

				case 'body': this.create({name:'body', color:Colors.body, ...matExtra }); break
			    case 'sleep':  this.create({ name:'sleep', color:Colors.sleep, ...matExtra }); break//0x46B1C9
			    case 'solid':  this.create({ name:'solid', color:Colors.solid, ...matExtra }); break
			    case 'base':   this.create({ name:'base', color:Colors.base, ...matExtra }); break

			    case 'clay':  this.create({ name:'clay', color:Colors.clay, metalness: 0.1, roughness: 0.7 }); break
			    case 'clayWhite':  this.create({ name:'clayWhite', color:Colors.clayWhite, metalness: 0.1, roughness: 0.7 }); break

			    case 'concrete':  this.create({ name:'concrete', color:Colors.concrete, metalness: 0.0, roughness: 0.9 }); break
			    case 'brick':  this.create({ name:'brick', color:Colors.brick, metalness: 0.0, roughness: 0.6 }); break
			    case 'sand':  this.create({ name:'sand', color:Colors.sand, metalness: 0.0, roughness: 0.9 }); break

			    

			    

			    // metal
			    case 'chrome': this.create({ name:'chrome', color:Colors.chrome, specularColor:Colors.chromeSpec, metalness: 1, roughness:0.075 }); break
			    case 'silver': this.create({ name:'silver', color:0xAAAAAA, metalness: 0.8, roughness:0.22 }); break
			    case 'gold': this.create({ name:'gold', color:Colors.gold, specularColor:Colors.gold2, metalness: 1, roughness:0.02 }); break
			    case 'copper': this.create({ name:'copper', color:Colors.copper, metalness: 1, roughness:0.05 }); break
			    case 'titanium': this.create({ name:'titanium', color:Colors.titanium, metalness: 1.0, roughness:0, specularColor:Colors.titaniumSpec }); break


			    case 'carPaint': this.create({ name:'carPaint', color:Colors.carPaint, metalness: 0, anisotropy:new Vector2(0.5,0.5), roughness:0.4, clearcoat: 1.0, clearcoatRoughness: 0, }); break

				//case 'simple': m = this.create({ name:'simple', color:0x808080, metalness: 0, roughness: 1 }); break

				case 'carbon': this.create({ name:'carbon', map:new CarbonTexture(), normalMap:new CarbonTexture(true), clearcoat: 1.0, clearcoatRoughness: 0.1, roughness: 0.5 }); break
				case 'cloth': this.create({ name:'cloth', color:0x8009cf, roughness: 0.5, sheenColor:0xcb7cff, sheen:1, sheenRoughness:0.2 }); break


				//case 'clear':  m = new MeshStandardMaterial({ color:0xFFFFFF, metalness: 0.5, roughness: 0 }); break
				//case 'wood':   m = this.create({ name:'wood', color:0xe8c2a1, metalness: 0, roughness: 1 }); break
				
				//case 'hero':   m = new MeshStandardMaterial({ color:0x00FF88, ...matExtra }); break
				case 'skinny':   this.create({ name:'skinny', color:0xe0ac69, ...matExtra }); break
				
				case 'glass':  this.create({ name:'glass', color:0xFFFFff, transparent:true, roughness:0.02, metalness:0.0, side:DoubleSide, alphaToCoverage:true, premultipliedAlpha:true, transmission:1, clearcoat:1, thickness:0.01  }); break
				//case 'glassX':  m = this.create({ name:'glassX', color:0xeeeeee, transparent:false, opacity:1.0, roughness:0.03, metalness:0,  side:DoubleSide, transmission:1.0, clearcoat:1, clearcoatRoughness:0.0, thickness:0.02, ior:1.52, shadowSide:1, reflectivity:0.5, iridescence:0 }); break
				case 'glassX':  this.create({ name:'glassX', color:0xFFFFff,  alphaToCoverage:true, transparent:true, opacity:1.0, roughness:0.0, metalness:0, side:DoubleSide, transmission:1.0, clearcoat:1, clearcoatRoughness:0.0, thickness:0.05, ior:1.52, shadowSide:1, reflectivity:0.5, iridescence:0, specularIntensity: 1, specularColor: 0xffffff, }); break
				
				case 'plexi':  this.create({ name:'plexi', blending:AdditiveBlending, color:0x010101, transparent:true, opacity:0.7, reflectivity:0.3, metalness:0.6, roughness:0.1, clearcoat:0.2, clearcoatRoughness: 0.02, side:DoubleSide, alphaToCoverage:true, premultipliedAlpha:true }); break
				case 'plexi2':  this.create({ name:'plexi2', blending:AdditiveBlending, color:0x010101, transparent:false, opacity:0.7, reflectivity:0.3, metalness:0.6, roughness:0.1, clearcoat:0.2, clearcoatRoughness: 0.02, side:DoubleSide, alphaToCoverage:false, premultipliedAlpha:true }); break
				case 'glass2': this.create({ name:'glass2', color:0xEEEEEE, transparent:true, roughness:0, alphaToCoverage:true, opacity:0.3  }); break
				case 'glass3': this.create({ name:'glass3', color:0x000000, transparent:true, roughness:0, alphaToCoverage:true, opacity:0.4  }); break
				case 'glass_red': this.create({ name:'glass_red', color:0xFF0000, transparent:true, roughness:0, alphaToCoverage:true, opacity:0.8  }); break
				
				
				case 'car':   this.create({ name:'car', color:0x303030, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5 }); break
				case 'carGlass':   this.create({ name:'carGlass', color: 0xffffff, metalness: 0, roughness: 0, transmission: 1.0, ior:1.52 }); break

				case 'outline': 
				//if( !this.mat[ 'outline' ] ) this.mat[ 'outline' ] = new FakeGlowMaterial();
				//m = this.mat[ 'outline' ]
				//m = this.create({ name:'outline', color:0xFFFFFF, type:'Basic', side:BackSide, toneMapped:false, wireframe:false }); 
				this.create({ name:'outline', color:0xFFFFFF, type:'Basic', side:BackSide, toneMapped:false, wireframe:true, transparent:true, opacity:0.25 }); 
				break
				case 'debug': this.create({ name:'debug', type:'Basic', color:0xF37042, wireframe:true, toneMapped: false, transparent:true, opacity:0.5 }); break
				//case 'debug': m = this.create({ name:'debug', color:0xF37042, wireframe:true, toneMapped: false, transparent:true, opacity:0.5 }); break
				
				//case 'debug2': m = this.create({ name:'debug2', type:'Basic', color:0x00FFFF, wireframe:true, toneMapped: false }); break
				//case 'debug3':  m = this.create({ name:'debug3', type:'Basic', color:0x000000, wireframe:true, transparent:true, opacity:0.1, toneMapped: false }); break
				//case 'shadows': m = this.create({ name:'shadows', type:'Basic', transparent:true, opacity:0.01 }); break

				//case 'simple': m = this.create({ name:'simple', type:'basic'  }); break

				case 'shadow': this.create({ name:'shadow', type:'shadow', color:0x000000, opacity:0.5 }); break


				case 'bones':  this.create({ name:'bones', color:0xfde7d6,  wireframe:true }); break
				case 'bones2':  this.create({ name:'bones2', type:'basic', color:0xdfc4a8, transparent:true, opacity:0.5, depthTest:true, depthWrite:false, alphaToCoverage:true }); break

				
				case 'button':  this.create({ name:'button', color:0xFF404B, ...matExtra }); break
				//case 'hide': m = new MeshBasicMaterial({ visible:false }); break

				case 'line':
				    this.create({ name:'line', type:'line', vertexColors: true, toneMapped: false });
			    break
			    case 'liner':
				    this.create({ name:'liner', type:'line', vertexColors: true, toneMapped: false, depthTest:true, depthWrite:true, alphaToCoverage:true });
			    break
				case 'hide':
				    this.create({ name:'hide', type:'basic', visible:false });
			    break
			    case 'particle':
				    this.create({ name:'particle', type:'basic', toneMapped: false, color:0xffff00, transparent:true, opacity:0.2 });
			    break
			    case 'svg':
				    this.create({ name:'svg', type:'basic', toneMapped:false, vertexColors:true, transparent:false, side:DoubleSide });
			    break

			}
			
		}

		return this.mat[name]

	}

	dispose() {

		this.isRealism = false;

		for(let m in this.mat){
			this.mat[m].dispose();
			delete this.mat[m];
		}

		let i = this.TmpMat.length;
		while( i-- ) { this.TmpMat[i].dispose(); }
		this.TmpMat = [];

	}

	upShader() {

		let option = this.realismOption;
		//if(!option.enable) option = 

		for( let name in this.mat ){

			const m = this.mat[name];
			const shader = m.userData.shader;

			for( let o in option ){

				
				// undate shader uniforme
				if(shader){ 
					/*if(o==='enable'){ 
						shader.defines.ENHANCE_SHADER_LIGHTING = option[o] ? "" : undefined;
						//console.log(shader.defines.ENHANCE_SHADER_LIGHTING)
					}*/
					if(shader.uniforms[o]!==undefined) shader.uniforms[o].value = option[o]; 
				}
				// update material option
				if( m[o] ) m[o] = option[o];
			}


		}

	}

};


/*const outliner = new ShaderMaterial({
    uniforms: {
        color: {type: 'c', value: new Color(0xFFFFFF) },
        power: {type: 'f', value: 0.01 },
    },
    vertexShader:`
        uniform float power;
        void main(){
            //vec3 pos = position + normal * power;
            vec3 pos = position + normalize( normal ) * power;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
        }
    `,
    fragmentShader:`
        uniform vec3 color;
        void main(){
           gl_FragColor = vec4( color, 0.1 );
        }
    `,
    side:BackSide,
    toneMapped: false,
    //wireframe:true,
    //transparent:true,
    //opacity:0.1,

});*/

class Timer {

	constructor( framerate = -1 ) {

		this.perf = window.performance;
		this.time = { now:0, delta:0, then:0, interval: 0, tmp:0, n:0, dt:0 };
		this.fps = 0;
		this.delta = 0;
		this.elapsedTime = 0;
		this.unlimited = false;
		this.setFramerate( framerate );
		this.force = false;

	} 

	up ( stamp ) {

		let t = this.time;

		if(this.unlimited) this.force = true;

		t.now = stamp !== undefined ? stamp : this.now();
		t.delta = t.now - t.then;

		if( this.force ) {
			t.delta = t.interval;
			this.force = false;
		}
		
		if ( t.delta >= t.interval || this.unlimited ) {

		    t.then = this.unlimited ? t.now : t.now - ( t.delta % t.interval );
		    //if(t.delta>)
		    //this.delta = t.delta * 0.001 // bug on outside
		    this.delta = t.interval * 0.001;
		    //if(this.delta>this.time.interval)this.delta=this.time.interval
		    this.elapsedTime += this.delta;
		    
		    //if ( t.now - 1000 > t.tmp ){ t.tmp = t.now; this.fps = t.n; t.n = 0; }; t.n++;
			return true

		}

		return false

	}

	setFramerate ( framerate ){
		
		this.elapsedTime = 0;
		this.framerate = framerate;
		this.unlimited = this.framerate < 0;
		this.time.interval = 1000 / framerate;
		if( framerate === 60 ) this.time.interval = 16.67;

	}

    static now () {
    	return this.perf ? this.perf.now() : Date.now();
    }

    static format_time ( time ) {
	    if (time > 1000)  return (time / 1000) + " sec";
	    return time + " ms";
	}
	
}

class User {

	// key map
    // 0 : axe L | left:right  -1>1
    // 1 : axe L | top:down    -1>1
    // 2 : axe R | left:right  -1>1
    // 3 : axe R | top:down    -1>1
    // 4 : bouton A             0-1  jump / space
    // 5 : bouton B             0-1  roulade / shift ctrl
    // 6 : bouton X             0-1  arme principale / E
    // 7 : bouton Y             0-1  arme secondaire
    // 8 : gachette L up        0-1  
    // 9 : gachette R up        0-1
    // 10 : gachette L down     0>1
    // 11 : gachette R down     0>1
    // 12 : bouton setup        0-1
    // 13 : bouton menu         0-1
    // 14 : axe button left     0-1
    // 15 : axe button right    0-1
    // 16 : Xcross axe top      0-1
    // 17 : Xcross axe down     0-1
    // 18 : Xcross axe left     0-1
    // 19 : Xcross axe right    0-1

    // 20 : Keyboard or Gamepad    0-1

	constructor () {

		this.key = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
        this.key2 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

		this.gamepad = new Gamepad( this.key ); 

		this.useGamepad = false;
		this.sameAxis = true;

		document.addEventListener( 'keydown', function(e){this.keyDown(e);}.bind(this), false );
        document.addEventListener( 'keyup', function(e){this.keyUp(e);}.bind(this), false );

	}

    setKey( i, v ){
        this.key[i] = v;
    }

	update () {

		this.gamepad.update();

        if( this.gamepad.ready ){ 
            if( !this.useGamepad ) this.useGamepad = true;
            this.gamepad.getValue(0);
        }

        if( this.sameAxis ){
            this.key[ 2 ] = this.key[ 0 ];
            this.key[ 3 ] = this.key[ 1 ];
        }

        //this.axeL[ 0 ] = this.key[ 0 ];
        //this.axeL[ 1 ] = this.key[ 1 ];

        return this.key

	}

	keyDown (e) {

		var key = this.key;
        var key2 = this.key2;
        e = e || window.event;

        if( this.sameAxis ){

            switch ( e.which ) {
                // axe L
                case 65: case 81: case 37: key[0] = -1; key2[0] = 1; break;//key[0]<=-1 ? -1:key[0]-= 0.1; break; // left, A, Q
                case 68:  case 39:         key[0] = 1;  key2[1] = 1; break; // right, D
                case 87: case 90:  case 38: key[1] = -1; break; // up, W, Z
                case 83: case 40:          key[1] = 1;  break; // down, S

                case 32:          key[4] = 1; break; // space
                case 17: case 67: key[5] = 1; break; // ctrl, C
                case 69:          key[6] = 1; break; // E
                
                case 16:          key[7] = 1; break; // shift
                //case 71:          view.hideGrid(); break; // G
                //case 121:         noui(); break; // f10
                //case 122:         fscreen(); break; // f11
            }

        } else {

            switch ( e.which ) {
                // axe L
                case 65: case 81: key[0] = -1; key2[0] = 1; break;//key[0]<=-1 ? -1:key[0]-= 0.1; break; // left, A, Q
                case 68:          key[0] = 1; key2[1] = 1; break; // right, D
                case 87: case 90: key[1] = -1; break; // up, W, Z
                case 83:          key[1] = 1;  break; // down, S
                // axe R
                case 37:          key[2] = -1;  key2[0] = 1;break; // left
                case 39:          key[2] = 1;  key2[1] = 1;break; // right
                case 38:          key[3] = -1; break; // up
                case 40:          key[3] = 1;  break; // down
                

                case 32:          key[4] = 1; break; // space
                case 17: case 67: key[5] = 1; break; // ctrl, C
                case 69:          key[6] = 1; break; // E
                
                case 16:          key[7] = 1; break; // shift
                //case 121:         noui(); break; // f10
                //case 122:         fscreen(); break; // f11
                
                //case 71:          view.hideGrid(); break; // G
            }
        }

        this.gamepad.reset();
        //e.preventDefault();

	}

	keyUp (e) {

		var key = this.key;
        var key2 = this.key2;
        e = e || window.event;

        if( this.sameAxis ){

            switch ( e.which ) {
                 // axe L
                case 65: case 81: case 37: key[0] = key[0]<0 ? 0:key[0]; key2[0] = 0; break; // left, A, Q
                case 68: case 39:         key[0] = key[0]>0 ? 0:key[0]; key2[1] = 0; break; // right, D
                case 87: case 90: case 38:key[1] = key[1]<0 ? 0:key[1]; break; // up, W, Z
                case 83: case 40:         key[1] = key[1]>0 ? 0:key[1]; break; // down, S

                case 32:          key[4] = 0; break; // space
                case 17: case 67: key[5] = 0; break; // ctrl, C
                case 69:          key[6] = 0; break; // E
                
                case 16:          key[7] = 0; break; // shift
            }

        } else {

            switch( e.which ) {
                
                // axe L
                case 65: case 81: key[0] = key[0]<0 ? 0:key[0]; key2[0] = 0; break; // left, A, Q
                case 68:          key[0] = key[0]>0 ? 0:key[0]; key2[1] = 0; break; // right, D
                case 87: case 90: key[1] = key[1]<0 ? 0:key[1]; break; // up, W, Z
                case 83:          key[1] = key[1]>0 ? 0:key[1]; break; // down, S
                // axe R
                case 37:          key[2] = key[2]<0 ? 0:key[2]; key2[0] = 0;break; // left
                case 39:          key[2] = key[2]>0 ? 0:key[2]; key2[1] = 0;break; // right
                case 38:          key[3] = key[3]<0 ? 0:key[3]; break; // up
                case 40:          key[3] = key[3]>0 ? 0:key[3]; break; // down

                case 32:          key[4] = 0; break; // space
                case 17: case 67: key[5] = 0; break; // ctrl, C
                case 69:          key[6] = 0; break; // E
                
                case 16:          key[7] = 0; break; // shift

                
            }
        }

        //e.preventDefault();
		
	}


}


class Gamepad {

	constructor ( key ) {

		this.values = []; 
        this.ready = 0;
        this.key = key;

	}

	update () {

		var i,j,k,l, v, pad;
        var fix = this.fix;
        var gamepads = navigator.getGamepads();

        for (i = 0; i < gamepads.length; i++) {

            pad = gamepads[i];
            if(pad){
                k = pad.axes.length;
                l = pad.buttons.length;
                if(l){
                    if(!this.values[i]) this.values[i] = [];
                    // axe
                    for (j = 0; j < k; j++) {
                        v = fix(pad.axes[j], 0.08 );
                        if(this.ready == 0 && v !== 0 ) this.ready = 1;
                        this.values[i][j] = v;
                        //if(i==0) this.key[j] = fix( pad.axes[j], 0.08 );
                    }
                    // button
                    for (j = 0; j < l; j++) {
                        v = fix(pad.buttons[j].value); 
                        if(this.ready == 0 && v !== 0 ) this.ready = 1;
                        this.values[i][k+j] = v;
                        //if(i==0) this.key[k+j] = fix( pad.buttons[j].value );
                    }
                    //info += 'gamepad '+i+'| ' + this.values[i]+ '<br>';
                } else {
                    if(this.values[i]) this.values[i] = null;
                }
            }
        }

	}

	getValue (n) {

		var i = 19, v;
        while(i--){
            v = this.values[n][i];
            if(this.ready == 0 && v !== 0 ) this.ready = 1;
            this.key[i] = v;
        }

	}

	reset () {

		this.ready = 0;
		
	}

	fix (v, dead) {

		let n = Number((v.toString()).substring(0, 5));
        if(dead && n<dead && n>-dead) n = 0;
        return n;
		
	}


}

class Item {

	constructor () {

		this.id = 0;
		this.list = [];
		this.type = 'item';
		this.Utils = null;

	}

	reset () {

		let i = this.list.length;
		while( i-- ) this.dispose( this.list[i] );
		this.list = [];
	    this.id = 0;

	}

	byName ( name ) {

		return this.Utils.byName( name );

	}

	setName ( o = {} ) {

		let name = o.name !== undefined ? o.name : this.type + this.id ++;

		// clear old item if existe keep same id
		o.id = this.remove( name, true );
		o.name = name;
		return name;

	}

	addToWorld ( b, id = -1 ) {

		this.Utils.add( b );
		if( id !== -1 ) this.list[id] = b;
		else this.list.push( b );

	}

	remove ( name, remplace ) {

		let b = this.byName( name );
		if( !b ) return -1;
		return this.clear( b, remplace );

	}

	clear ( b, remplace ) {

		let n = this.list.indexOf( b );
		if ( n !== -1 && !remplace ) this.list.splice( n, 1 );
		else this.list[n] = null;
		this.dispose( b );
		return n;

	}

	dispose ( b ) {

		if( b !== null ) this.Utils.remove( b );

	}

	add ( o = {} ) {}

	set ( o = {} ) {}

	step ( AR, N ) {}

}

// THREE RAY

class Ray extends Item {

	constructor ( motor ) {

		super();

		this.motor = motor;

		this.Utils = this.motor.utils;
		this.type = 'ray';
		this.iType = 'ray';

	}

	step (AR, N) {

		let i = this.list.length, r, n;

		while( i-- ){

			r = this.list[i];
			n = N + ( i * Num.ray );
			r.update( AR, n, this.motor.reflow.ray[i] || null );

		}

	}

	add ( o = {} ) {

		this.setName( o );

		

		let r = new ExtraRay( o, this.motor );

		r.visible = o.visible !== undefined ? o.visible : true;

		// add to world
		this.addToWorld( r, o.id );

		if(o.parent){
			if( typeof o.parent !== 'string' ) o.parent = o.parent.name;
		}

		if( o.callback ) delete o.callback;

		

		// add to worker 
		this.motor.post( { m:'add', o:o } );

		return r;

	}

	set ( o = {}, r = null ) {

		if( r === null ) r = this.byName( o.name );
		if( r === null ) return;

		r.setRay(o);

	}

}


class ExtraRay extends Line {

	constructor( o = {}, motor ) {

	    super( new BufferGeometry(), motor.getMat('line') );

	    this.motor = motor;
		this.Utils = this.motor.utils;

	    this.isRay = true;

	    this.data = {

			hit:false,
			body: '',
			point: [0,0,0],
			normal: [0,0,0],
			distance: 0,
			angle:0,
			parent:null

		};

	    this.type = 'ray';
	    this.name = o.name;

	    this.parentMesh = null;
	    if(o.parent){
	    	this.parentMesh = typeof o.parent === 'string' ?  this.Utils.byName( o.parent ) : o.parent;
	    	this.data.parent = this.parentMesh;
	    }

	    this.callback = o.callback || null;

	    // color
		this.c0 = [ 0.1, 0.1, 0.3 ];
		this.c1 = [ 0.1, 0.4, 0.6 ];
		this.c2 = [ 1.0, 0.1, 0.1 ];
		this.c3 = [ 0.1, 1.0, 0.1 ];

	    this.begin = new Vector3();
	    this.end = new Vector3(0,1,0);
	    this.tmp = new Vector3();
	    this.vnormal = new Vector3();
	    this.vv1 = new Vector3();
	    this.vv2 = new Vector3();

	    this.fullDistance = 0;

	    this.setRay( o );

	    const positions = [0,0,0, 0,0,0, 0,0,0];
	    const colors = [0,0,0, 0,0,0, 0,0,0];

	    //this.geometry = new BufferGeometry();
	    this.geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    this.geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    //this.geometry.computeBoundingSphere();

	    this.vertices = this.geometry.attributes.position;
	    this.colors = this.geometry.attributes.color;
	    this.local = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

	    this.noRotation = o.noRotation || false;

	    this.fakeMatrix = new Matrix4();

	    this.matrixAutoUpdate = false;
	    this.frustumCulled = false;

	}

	setRay( o ){

		if( o.begin ) this.begin.fromArray( o.begin );
	    if( o.end ) this.end.fromArray( o.end );
	    this.fullDistance = this.begin.distanceTo( this.end );

	}

	update ( r, n = 0, body = null ) {

		this.data.hit = r[n] !== 0 ? true : false;
		this.data.body = body ? body : '';

		this.data.distance = r[n+1];

		if( this.data.hit ){

			this.local[0] = r[n+2];
			this.local[1] = r[n+3];
			this.local[2] = r[n+4];

			this.tmp.fromArray( r, n+5 );
			this.vnormal.fromArray( r, n+8 );

			this.data.point = this.tmp.toArray();
			this.data.normal = this.vnormal.toArray();
			//this.data.distance = this._begin.distanceTo( this.tmp )

			this.tmp.toArray( this.local, 3 );
			this.vv1.fromArray( this.local ).sub(this.tmp).normalize(); 
			this.tmp.addScaledVector( this.vnormal, this.fullDistance - this.data.distance );
			this.tmp.toArray( this.local, 6 );

			
			//vv1.fromArray( r, n+5 ); 

			this.data.angle = Math.floor( MathTool.angleTo( this.vv1.toArray(), this.data.normal ) * todeg$1 );
			//let angle = MathTool.angleTo( [this.local[0], this.local[2], this.local[2]], [this.local[3], this.local[4], this.local[5]] ) * todeg
			//console.log(this.data.angle)

		} else {
			if( this.parentMesh ){
				let mtx ;
				if(this.noRotation){
					mtx = this.fakeMatrix.setPosition(this.parentMesh.position.x, this.parentMesh.position.y, this.parentMesh.position.z );
				} else {
					mtx = this.parentMesh.matrixWorld;
				}
				//this.parentMesh.updateWorldMatrix( true, false )
				
				this.tmp.copy( this.begin ).applyMatrix4(mtx).toArray( this.local, 0 );
				this.tmp.copy( this.end ).applyMatrix4(mtx);
				this.tmp.toArray( this.local, 3 );
				this.tmp.toArray( this.local, 6 );
			} else {
				this.begin.toArray( this.local, 0 );
				this.end.toArray( this.local, 3 );
				this.end.toArray( this.local, 6 );
			}
		}

		this.updateGeometry();
		this.updateMatrix();

		if(this.callback) this.callback( this.data );

	}

	dispose(){
		
		this.callback = null;
		this.parentMesh = null;
		this.data = {};
		this.geometry.dispose();

	}

	raycast(){
		return
	}

	updateGeometry(){

		if ( !this.visible ) return;

		let v = this.vertices.array;
		let c = this.colors.array;
		let l = this.local;
		let hit = this.data.hit;
		let c1 = hit ? this.c2 : this.c1;
		let c2 = hit ? this.c3 : this.c1;

		c[ 3 ] = c1[0];
		c[ 4 ] = c1[1];
		c[ 5 ] = c1[2];

		c[ 6 ] = c2[0];
		c[ 7 ] = c2[1];
		c[ 8 ] = c2[2];

		v[ 0 ] = l[ 0 ];
		v[ 1 ] = l[ 1 ];
		v[ 2 ] = l[ 2 ];

		v[ 3 ] = l[ 3 ];
		v[ 4 ] = l[ 4 ];
		v[ 5 ] = l[ 5 ];
		
		v[ 6 ] = l[ 6 ];
		v[ 7 ] = l[ 7 ];
		v[ 8 ] = l[ 8 ];

		this.vertices.needsUpdate = true;
	    this.colors.needsUpdate = true;
	}

}

//ExtraRay.prototype.isRay = true;

class Instance extends InstancedMesh {

	constructor( geometry, material, count = 0 ) {

        super( geometry, material, count );

        //this.instanceMatrix = null;
        this.matrixAutoUpdate = false; 
        this.tmpMatrix = new Matrix4();
        this.tmpQuat = new Quaternion$1();

        this.instanceUv = null;
        this.instanceColor = null;
        this.needSphereUp = false;
        this.isRay = true;

        this.overMaterial = null;
        this.currentOver = -1;
        this.isOver = false;

        this.outline = null;

        this.tmpElement = [];
        
    }

    clearOutLine() {

        if( !this.overMaterial ) return;
        if( !this.outline ) return;
        //let i = this.outline.length
        this.parent.remove( this.outline );
        this.outline = null;
        this.currentOver = -1;

    }

    addOutLine( obj ) {

        if( !this.overMaterial ) return;

        if(!this.outline)this.outline = new Mesh( this.geometry, this.overMaterial );
        // if(this.overMaterial.uniforms.power)this.overMaterial.uniforms.power.value = 0.01;
        this.outline.matrixAutoUpdate = false;
        this.tmpMatrix.fromArray( this.instanceMatrix.array, obj.idx*16 );
        this.outline.matrix.copy( this.tmpMatrix );
        this.outline.matrixWorldNeedsUpdate = true;
        this.parent.add( this.outline );
        this.currentOver = obj.idx;

    }

    over ( b ) {

        if( b && !this.instance.isOver ){ 

            this.instance.isOver = true;
            this.instance.addOutLine( this );

        }

        if( !b && this.instance.isOver ){ 

            this.instance.isOver = false;
            this.instance.clearOutLine();

        }

    }

    /*getInfo( index ) {

        this.tmpMatrix.fromArray( this.instanceMatrix.array, index * 16 );
        let pos = {x:0, y:0, z:0 };
        let scale = { x:0, y:0, z:0 };
        this.tmpMatrix.decompose( pos, this.tmpQuat, scale );
        return{
            pos:[pos.x, pos.y, pos.z],
            quat:this.tmpQuat.toArray(),
            scale:[scale.x, scale.y, scale.z],
            //worldMatrix:this.tmpMatrix.toArray(),
        }
    }*/

    

    setColorAt( index, color ) {

        if ( this.instanceColor === null ) {

            this.instanceColor = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 3 ), 3 );

        }



        if( color.isColor ) color = color.toArray();
        
        let id = index * 3;
        this.instanceColor.array[id] = color[0];
        this.instanceColor.array[id +1] = color[1];
        this.instanceColor.array[id +2] = color[2];
        
        
        
        //color.toArray( this.instanceColor.array, index * 3 );

    }

    /*setUvAt( index, uv ) {

        if ( this.instanceUv === null ) this.instanceUv = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 2 ), 2 );
        
        if( uv.isVector2 ) uv = uv.toArray()
        let id = index * 2
        this.instanceUv.array[id] = uv[0]
        this.instanceUv.array[id +1] = uv[1]

    }*/

    add( bref, position = [0,0,0], rotation = [0,0,0,1], scale = [1,1,1], color = null, uv = null ) {

        if( rotation.length === 3 ) rotation = this.tmpQuat.setFromEuler( {_x:rotation[0], _y:rotation[1], _z:rotation[2], _order:'XYZ'}, false ).toArray();
        if(color){ 
            if( color.isColor ) color = color.toArray();
            if ( this.instanceColor === null ) this.instanceColor = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 3 ), 3 );
        }
        /*if(uv){ 
            if( uv.isVector2 ) uv = uv.toArray()
            if ( this.instanceUv === null ) this.instanceUv = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 2 ), 2 );
        }*/
        this.expand( position, rotation, scale, color, uv );

        //console.log(bref.idx)
        this.tmpElement.push( bref );
    }

    slice( ar, begin, end ) {

        let target = new Float32Array(end - begin);
        for (let i = 0; i < begin + end; ++i) {
            target[i] = ar[begin + i];
        }
        return target

    }

    remove( id ) {

        if(!this.count) return;
        
        this.tmpElement.splice( id, 1 );

        let old = [...this.instanceMatrix.array];
        old.splice( id*16, 16 );
        this.instanceMatrix = new InstancedBufferAttribute( new Float32Array(old), 16 );
        //this.instanceMatrix.array = new Float32Array(old);

        //this.instanceMatrix.array = this.slice( this.instanceMatrix.array, id*16, 16 );
        //this.instanceMatrix.needsUpdate = true;

        if ( this.instanceColor !== null ) {
            old = [...this.instanceColor.array];
            old.splice( id*3, 3 );
            this.instanceColor = new InstancedBufferAttribute( new Float32Array(old), 3 );
            //this.instanceColor.array = new Float32Array(old);
        }

        if ( this.instanceUv !== null ) {
            old = [...this.instanceUv.array];
            old.splice( id*2, 2 );
            this.instanceUv = new InstancedBufferAttribute( new Float32Array(old), 2 );
            //this.instanceUv.array = new Float32Array(old);
        }
        this.count--;

        this.reDistribute();

    }

    reDistribute() {

        let i = this.count;
        while(i--) this.tmpElement[i].idx = i;
        
    }

    getIDName( index ) {

        return this.tmpElement[index].name;

    }

    getBodyList(){

        let bodyNames = [];
        let i = this.count;
        while(i--) bodyNames.push( this.tmpElement[i].name );
        return bodyNames;

    }

    expand( p, q, s, c = [1,1,1], uv ) {

        let old = this.instanceMatrix !== null ? this.instanceMatrix.array : [];
        this.tmpMatrix.compose({x:p[0], y:p[1], z:p[2]}, {_x:q[0], _y:q[1], _z:q[2], _w:q[3]}, {x:s[0], y:s[1], z:s[2]});
        this.instanceMatrix = new InstancedBufferAttribute( new Float32Array([...old, ...this.tmpMatrix.toArray()]), 16 );
        //this.instanceMatrix.setUsage( DynamicDrawUsage );
        if ( this.instanceColor !== null ) {
            old = this.instanceColor.array;
            this.instanceColor = new InstancedBufferAttribute( new Float32Array([...old, ...c ]), 3 );
        }
       /* if ( this.instanceUv !== null ) {
            old = this.instanceUv.array;
            this.instanceUv = new InstancedBufferAttribute( new Float32Array([...old, ...uv ]), 2 );
        }*/
        this.count ++;

    }

    setTransformAt( index, p, q, s ) {

        this.tmpMatrix.compose({ x:p[0], y:p[1], z:p[2] }, {_x:q[0], _y:q[1], _z:q[2], _w:q[3]}, {x:s[0], y:s[1], z:s[2]});
        this.tmpMatrix.toArray( this.instanceMatrix.array, index * 16 );
        this.needSphereUp = true;

        if( !this.outline ) return;
        if(this.currentOver === index ){
            this.outline.matrix.copy(this.tmpMatrix);
            //this.outline.updateMatrix()
            this.outline.matrixWorldNeedsUpdate = true;
        }

    }

    dispose() {

        this.clearOutLine();
        this.parent.remove(this);
        this.geometry.dispose();
        //this.instanceMatrix = null;
        this.instanceColor = null;
        this.count = 0;
        this.tmpElement = [];
        //console.log(this.name+" is dispose")
        this.dispatchEvent( { type: 'dispose' } );

    }

    setRaycast(v) {

        if( v !== undefined ) this.isRay = v;

    }

    raycast( raycaster, intersects ) {

        if(!this.isRay) return
        this.instanceMatrix.needsUpdate = true;
        super.raycast( raycaster, intersects );

    }

    update(){

        if( this.instanceMatrix ) this.instanceMatrix.needsUpdate = true;
        if( this.instanceColor ) this.instanceColor.needsUpdate = true;
        if( this.needSphereUp )this.computeBoundingSphere();
        //if( this.instanceUv ) this.instanceUv.needsUpdate = true;
        this.needSphereUp = false;
        this.updateMatrix();

    }

}

class Quaternion {

	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		this.isQuaternion = true;
		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

	}

	set( x, y, z, w ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;
		return this;

	}

	fromArray( array, offset = 0 ) {

		this._x = array[ offset ];
		this._y = array[ offset + 1 ];
		this._z = array[ offset + 2 ];
		this._w = array[ offset + 3 ];
		return this;

	}

	toArray( array = [], offset = 0 ) {

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._w;
		return array;

	}
}

class CapsuleHelper extends Object3D {

	

	constructor( r, h, useDir, material, c1 = [0,1,0], c2 = [0,0.5,0], full = false ) {

		

		super();
		// TODO bug with hero skeleton !! create new CapsuleHelper on over ??
		if(!r) return
		if(!h) return

		

		const geometry = new BufferGeometry();

		let py = (h*0.5)-r;
		let side = 12;//32;
		let dir = r*0.2;


		let colors = [];

		const positions = [
		    r, py, 0 ,   r, -py, 0,
		    -r, py, 0 ,   -r, -py, 0,
		    0, py, r-dir ,   0, py, r+dir,
		];



		//console.log( r )

		colors.push(
			...c1,...c2,
			...c1,...c2,
			...c2,...c2
		);

		if(full){ 
			positions.push(
				0, py, r, 0, -py, r,
				0, py, -r, 0, -py, -r 
			);
			colors.push(
				...c1,...c2,
				...c1,...c2,
			);
		}


		// circle top / bottom

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			positions.push(
				r*Math.cos( p1 ), py, r*Math.sin( p1 ),
				r*Math.cos( p2 ), py, r*Math.sin( p2 ),

				r*Math.cos( p1 ), -py, r*Math.sin( p1 ),
				r*Math.cos( p2 ), -py, r*Math.sin( p2 ),
			);

			colors.push(
				...c1,...c1,
				...c2,...c2,
			);

		}

		// circle start / end

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			let s = j <= side*0.5 ? 1 : -1; 

			positions.push(
				r*Math.cos( p1 ), py*s + r*Math.sin( p1 ),0,
				r*Math.cos( p2 ), py*s + r*Math.sin( p2 ),0,
			);

			if(s===1) colors.push( ...c1,...c1 );
			else colors.push( ...c2,...c2 );

			if(full){
				positions.push(
					0, py*s + r*Math.sin( p1 ),r*Math.cos( p1 ),
					0, py*s + r*Math.sin( p2 ),r*Math.cos( p2 ),
				);
				if(s===1) colors.push( ...c1,...c1 );
			    else colors.push( ...c2,...c2 );
			}

		}

		//console.log( positions )

		geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		geometry.computeBoundingSphere();

		this.colors = geometry.attributes.color.array;
		this.colorsbase = [...this.colors];
		this.geometry = geometry;

		//const material = new LineBasicMaterial( { color:0x00ff00, fog: false, toneMapped: false } );


		
		this.cone = new LineSegments( geometry, material );
		this.cone.raycast = function(){return false };
		this.cone.updateMorphTargets = ()=>{};
		this.cone.name = 'cone';
		this.add( this.cone );

		this.isOver = false;
		this.matrixAutoUpdate = false;
		this.type = 'CapsuleHelper';

		if(!useDir) return

		const geometry2 = new BufferGeometry();

		const positions2 = [
		    dir*0.5, -py, r-dir ,   dir*0.5, -py, r+dir,
		    -dir*0.5, -py, r-dir ,   -dir*0.5, -py, r+dir,
		    dir*0.5, -py, r-dir,  -dir*0.5, -py, r-dir,

		    -dir*0.5, -py, r+dir , -dir, -py, r+dir ,
		    dir*0.5, -py, r+dir , dir, -py, r+dir ,

		    -dir, -py, r+dir , 0, -py, r+dir*2 ,
		    dir, -py, r+dir , 0, -py, r+dir*2 ,
		];

		colors = [];
		let cc = positions2.length/3;
		while(cc--){
			colors.push(1,0,0);
		}

		geometry2.setAttribute( 'position', new Float32BufferAttribute( positions2, 3 ) );
		geometry2.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );



		//const material2 = new LineBasicMaterial( { color:0xFF0000, fog: false, toneMapped: false } );

		this.direction = new LineSegments( geometry2, material );
		this.direction.raycast = function(){return false};
		this.add( this.direction );

	}

	over(b){

		if(b){
			if(!this.isOver){
				this.isOver = true;
				this.changeColor(this.isOver);
			}
		}else {
			if(this.isOver){
				this.isOver = false;
				this.changeColor(this.isOver);
		    }
		}
		

		//console.log('yo')

	}

	changeColor(b) {

		let i = this.colors.length;
		while(i--) this.colors[i] = b ? 1 : this.colorsbase[i];
		if( this.geometry ) this.geometry.attributes.color.needsUpdate = true;

	}

	setDirection(r) {

		if(!this.direction) return
		//this.rotation.y = r
		this.direction.rotation.y = r;

	}

	dispose() {

		this.geometry.dispose();

		this.cone.geometry.dispose();
		//this.cone.material.dispose();

		if(this.direction){
			this.direction.geometry.dispose();
			//this.direction.material.dispose();
		}

	}

	raycast(){
		return false
	}

	update() {

		/*this.light.updateWorldMatrix( true, false );
		this.light.target.updateWorldMatrix( true, false );

		const coneLength = this.light.distance ? this.light.distance : 1000;
		const coneWidth = coneLength * Math.tan( this.light.angle );

		this.cone.scale.set( coneWidth, coneWidth, coneLength );

		_vector.setFromMatrixPosition( this.light.target.matrixWorld );

		this.cone.lookAt( _vector );*/

		/*if ( this.color !== undefined ) {

			this.cone.material.color.set( this.color );

		} else {

			this.cone.material.color.copy( this.light.color );

		}*/

	}

}

const Visible = 0;
const Deleted = 1;

const _v1 = new Vector3();
const _line3 = new Line3();
const _plane = new Plane();
const _closestPoint = new Vector3();
const _triangle = new Triangle();

/**
 * Can be used to compute the convex hull in 3D space for a given set of points. It
 * is primarily intended for {@link ConvexGeometry}.
 *
 * This Quickhull 3D implementation is a port of [quickhull3d]{@link https://github.com/maurizzzio/quickhull3d/}
 * by Mauricio Poppe.
 *
 * @three_import import { ConvexHull } from 'three/addons/math/ConvexHull.js';
 */
class ConvexHull {

	/**
	 * Constructs a new convex hull.
	 */
	constructor() {

		this.tolerance = -1;

		this.faces = []; // the generated faces of the convex hull
		this.newFaces = []; // this array holds the faces that are generated within a single iteration

		// the vertex lists work as follows:
		//
		// let 'a' and 'b' be 'Face' instances
		// let 'v' be points wrapped as instance of 'Vertex'
		//
		//     [v, v, ..., v, v, v, ...]
		//      ^             ^
		//      |             |
		//  a.outside     b.outside
		//
		this.assigned = new VertexList();
		this.unassigned = new VertexList();

		this.vertices = []; // vertices of the hull (internal representation of given geometry data)

	}

	/**
	 * Computes to convex hull for the given array of points.
	 *
	 * @param {Array<Vector3>} points - The array of points in 3D space.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	setFromPoints( points ) {

		// The algorithm needs at least four points.

		if ( points.length >= 4 ) {

			this.makeEmpty();

			for ( let i = 0, l = points.length; i < l; i ++ ) {

				this.vertices.push( new VertexNode( points[ i ] ) );

			}

			this._compute();

		}

		return this;

	}

	/**
	 * Computes the convex hull of the given 3D object (including its descendants),
	 * accounting for the world transforms of both the 3D object and its descendants.
	 *
	 * @param {Object3D} object - The 3D object to compute the convex hull for.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	setFromObject( object ) {

		const points = [];

		object.updateMatrixWorld( true );

		object.traverse( function ( node ) {

			const geometry = node.geometry;

			if ( geometry !== undefined ) {

				const attribute = geometry.attributes.position;

				if ( attribute !== undefined ) {

					for ( let i = 0, l = attribute.count; i < l; i ++ ) {

						const point = new Vector3();

						point.fromBufferAttribute( attribute, i ).applyMatrix4( node.matrixWorld );

						points.push( point );

					}

				}

			}

		} );

		return this.setFromPoints( points );

	}

	/**
	 * Returns `true` if the given point lies in the convex hull.
	 *
	 * @param {Vector3} point - The point to test.
	 * @return {boolean} Whether the given point lies in the convex hull or not.
	 */
	containsPoint( point ) {

		const faces = this.faces;

		for ( let i = 0, l = faces.length; i < l; i ++ ) {

			const face = faces[ i ];

			// compute signed distance and check on what half space the point lies

			if ( face.distanceToPoint( point ) > this.tolerance ) return false;

		}

		return true;

	}

	/**
	 * Computes the intersections point of the given ray and this convex hull.
	 *
	 * @param {Ray} ray - The ray to test.
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3|null} The intersection point. Returns `null` if not intersection was detected.
	 */
	intersectRay( ray, target ) {

		// based on "Fast Ray-Convex Polyhedron Intersection" by Eric Haines, GRAPHICS GEMS II

		const faces = this.faces;

		let tNear = - Infinity;
		let tFar = Infinity;

		for ( let i = 0, l = faces.length; i < l; i ++ ) {

			const face = faces[ i ];

			// interpret faces as planes for the further computation

			const vN = face.distanceToPoint( ray.origin );
			const vD = face.normal.dot( ray.direction );

			// if the origin is on the positive side of a plane (so the plane can "see" the origin) and
			// the ray is turned away or parallel to the plane, there is no intersection

			if ( vN > 0 && vD >= 0 ) return null;

			// compute the distance from the ray’s origin to the intersection with the plane

			const t = ( vD !== 0 ) ? ( - vN / vD ) : 0;

			// only proceed if the distance is positive. a negative distance means the intersection point
			// lies "behind" the origin

			if ( t <= 0 ) continue;

			// now categorized plane as front-facing or back-facing

			if ( vD > 0 ) {

				// plane faces away from the ray, so this plane is a back-face

				tFar = Math.min( t, tFar );

			} else {

				// front-face

				tNear = Math.max( t, tNear );

			}

			if ( tNear > tFar ) {

				// if tNear ever is greater than tFar, the ray must miss the convex hull

				return null;

			}

		}

		// evaluate intersection point

		// always try tNear first since its the closer intersection point

		if ( tNear !== - Infinity ) {

			ray.at( tNear, target );

		} else {

			ray.at( tFar, target );

		}

		return target;

	}

	/**
	 * Returns `true` if the given ray intersects with this convex hull.
	 *
	 * @param {Ray} ray - The ray to test.
	 * @return {boolean} Whether the given ray intersects with this convex hull or not.
	 */
	intersectsRay( ray ) {

		return this.intersectRay( ray, _v1 ) !== null;

	}

	/**
	 * Makes the convex hull empty.
	 *
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	makeEmpty() {

		this.faces = [];
		this.vertices = [];

		return this;

	}

	// private

	/**
	 * Adds a vertex to the 'assigned' list of vertices and assigns it to the given face.
	 *
	 * @private
	 * @param {VertexNode} vertex - The vertex to add.
	 * @param {Face} face - The target face.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_addVertexToFace( vertex, face ) {

		vertex.face = face;

		if ( face.outside === null ) {

			this.assigned.append( vertex );

		} else {

			this.assigned.insertBefore( face.outside, vertex );

		}

		face.outside = vertex;

		return this;

	}

	/**
	 * Removes a vertex from the 'assigned' list of vertices and from the given face.
	 * It also makes sure that the link from 'face' to the first vertex it sees in 'assigned'
	 * is linked correctly after the removal.
	 *
	 * @private
	 * @param {VertexNode} vertex - The vertex to remove.
	 * @param {Face} face - The target face.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_removeVertexFromFace( vertex, face ) {

		if ( vertex === face.outside ) {

			// fix face.outside link

			if ( vertex.next !== null && vertex.next.face === face ) {

				// face has at least 2 outside vertices, move the 'outside' reference

				face.outside = vertex.next;

			} else {

				// vertex was the only outside vertex that face had

				face.outside = null;

			}

		}

		this.assigned.remove( vertex );

		return this;

	}

	/**
	 * Removes all the visible vertices that a given face is able to see which are stored in
	 * the 'assigned' vertex list.
	 *
	 * @private
	 * @param {Face} face - The target face.
	 * @return {VertexNode|undefined} A reference to this convex hull.
	 */
	_removeAllVerticesFromFace( face ) {

		if ( face.outside !== null ) {

			// reference to the first and last vertex of this face

			const start = face.outside;
			let end = face.outside;

			while ( end.next !== null && end.next.face === face ) {

				end = end.next;

			}

			this.assigned.removeSubList( start, end );

			// fix references

			start.prev = end.next = null;
			face.outside = null;

			return start;

		}

	}

	/**
	 * Removes all the visible vertices that `face` is able to see.
	 *
	 * - If `absorbingFace` doesn't exist, then all the removed vertices will be added to the 'unassigned' vertex list.
	 * - If `absorbingFace` exists, then this method will assign all the vertices of 'face' that can see 'absorbingFace'.
	 * - If a vertex cannot see `absorbingFace`, it's added to the 'unassigned' vertex list.
	 *
	 * @private
	 * @param {Face} face - The given face.
	 * @param {Face} [absorbingFace] - An optional face that tries to absorb the vertices of the first face.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_deleteFaceVertices( face, absorbingFace ) {

		const faceVertices = this._removeAllVerticesFromFace( face );

		if ( faceVertices !== undefined ) {

			if ( absorbingFace === undefined ) {

				// mark the vertices to be reassigned to some other face

				this.unassigned.appendChain( faceVertices );


			} else {

				// if there's an absorbing face try to assign as many vertices as possible to it

				let vertex = faceVertices;

				do {

					// we need to buffer the subsequent vertex at this point because the 'vertex.next' reference
					// will be changed by upcoming method calls

					const nextVertex = vertex.next;

					const distance = absorbingFace.distanceToPoint( vertex.point );

					// check if 'vertex' is able to see 'absorbingFace'

					if ( distance > this.tolerance ) {

						this._addVertexToFace( vertex, absorbingFace );

					} else {

						this.unassigned.append( vertex );

					}

					// now assign next vertex

					vertex = nextVertex;

				} while ( vertex !== null );

			}

		}

		return this;

	}

	/**
	 * Reassigns as many vertices as possible from the unassigned list to the new faces.
	 *
	 * @private
	 * @param {Array<Face>} newFaces - The new faces.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_resolveUnassignedPoints( newFaces ) {

		if ( this.unassigned.isEmpty() === false ) {

			let vertex = this.unassigned.first();

			do {

				// buffer 'next' reference, see ._deleteFaceVertices()

				const nextVertex = vertex.next;

				let maxDistance = this.tolerance;

				let maxFace = null;

				for ( let i = 0; i < newFaces.length; i ++ ) {

					const face = newFaces[ i ];

					if ( face.mark === Visible ) {

						const distance = face.distanceToPoint( vertex.point );

						if ( distance > maxDistance ) {

							maxDistance = distance;
							maxFace = face;

						}

						if ( maxDistance > 1000 * this.tolerance ) break;

					}

				}

				// 'maxFace' can be null e.g. if there are identical vertices

				if ( maxFace !== null ) {

					this._addVertexToFace( vertex, maxFace );

				}

				vertex = nextVertex;

			} while ( vertex !== null );

		}

		return this;

	}

	/**
	 * Computes the extremes values (min/max vectors) which will be used to
	 * compute the initial hull.
	 *
	 * @private
	 * @return {Object} The extremes.
	 */
	_computeExtremes() {

		const min = new Vector3();
		const max = new Vector3();

		const minVertices = [];
		const maxVertices = [];

		// initially assume that the first vertex is the min/max

		for ( let i = 0; i < 3; i ++ ) {

			minVertices[ i ] = maxVertices[ i ] = this.vertices[ 0 ];

		}

		min.copy( this.vertices[ 0 ].point );
		max.copy( this.vertices[ 0 ].point );

		// compute the min/max vertex on all six directions

		for ( let i = 0, l = this.vertices.length; i < l; i ++ ) {

			const vertex = this.vertices[ i ];
			const point = vertex.point;

			// update the min coordinates

			for ( let j = 0; j < 3; j ++ ) {

				if ( point.getComponent( j ) < min.getComponent( j ) ) {

					min.setComponent( j, point.getComponent( j ) );
					minVertices[ j ] = vertex;

				}

			}

			// update the max coordinates

			for ( let j = 0; j < 3; j ++ ) {

				if ( point.getComponent( j ) > max.getComponent( j ) ) {

					max.setComponent( j, point.getComponent( j ) );
					maxVertices[ j ] = vertex;

				}

			}

		}

		// use min/max vectors to compute an optimal epsilon

		this.tolerance = 3 * Number.EPSILON * (
			Math.max( Math.abs( min.x ), Math.abs( max.x ) ) +
			Math.max( Math.abs( min.y ), Math.abs( max.y ) ) +
			Math.max( Math.abs( min.z ), Math.abs( max.z ) )
		);

		return { min: minVertices, max: maxVertices };

	}

	/**
	 * Computes the initial simplex assigning to its faces all the points that are
	 * candidates to form part of the hull.
	 *
	 * @private
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_computeInitialHull() {

		const vertices = this.vertices;
		const extremes = this._computeExtremes();
		const min = extremes.min;
		const max = extremes.max;

		// 1. Find the two vertices 'v0' and 'v1' with the greatest 1d separation
		// (max.x - min.x)
		// (max.y - min.y)
		// (max.z - min.z)

		let maxDistance = 0;
		let index = 0;

		for ( let i = 0; i < 3; i ++ ) {

			const distance = max[ i ].point.getComponent( i ) - min[ i ].point.getComponent( i );

			if ( distance > maxDistance ) {

				maxDistance = distance;
				index = i;

			}

		}

		const v0 = min[ index ];
		const v1 = max[ index ];
		let v2;
		let v3;

		// 2. The next vertex 'v2' is the one farthest to the line formed by 'v0' and 'v1'

		maxDistance = 0;
		_line3.set( v0.point, v1.point );

		for ( let i = 0, l = this.vertices.length; i < l; i ++ ) {

			const vertex = vertices[ i ];

			if ( vertex !== v0 && vertex !== v1 ) {

				_line3.closestPointToPoint( vertex.point, true, _closestPoint );

				const distance = _closestPoint.distanceToSquared( vertex.point );

				if ( distance > maxDistance ) {

					maxDistance = distance;
					v2 = vertex;

				}

			}

		}

		// 3. The next vertex 'v3' is the one farthest to the plane 'v0', 'v1', 'v2'

		maxDistance = -1;
		_plane.setFromCoplanarPoints( v0.point, v1.point, v2.point );

		for ( let i = 0, l = this.vertices.length; i < l; i ++ ) {

			const vertex = vertices[ i ];

			if ( vertex !== v0 && vertex !== v1 && vertex !== v2 ) {

				const distance = Math.abs( _plane.distanceToPoint( vertex.point ) );

				if ( distance > maxDistance ) {

					maxDistance = distance;
					v3 = vertex;

				}

			}

		}

		const faces = [];

		if ( _plane.distanceToPoint( v3.point ) < 0 ) {

			// the face is not able to see the point so 'plane.normal' is pointing outside the tetrahedron

			faces.push(
				Face.create( v0, v1, v2 ),
				Face.create( v3, v1, v0 ),
				Face.create( v3, v2, v1 ),
				Face.create( v3, v0, v2 )
			);

			// set the twin edge

			for ( let i = 0; i < 3; i ++ ) {

				const j = ( i + 1 ) % 3;

				// join face[ i ] i > 0, with the first face

				faces[ i + 1 ].getEdge( 2 ).setTwin( faces[ 0 ].getEdge( j ) );

				// join face[ i ] with face[ i + 1 ], 1 <= i <= 3

				faces[ i + 1 ].getEdge( 1 ).setTwin( faces[ j + 1 ].getEdge( 0 ) );

			}

		} else {

			// the face is able to see the point so 'plane.normal' is pointing inside the tetrahedron

			faces.push(
				Face.create( v0, v2, v1 ),
				Face.create( v3, v0, v1 ),
				Face.create( v3, v1, v2 ),
				Face.create( v3, v2, v0 )
			);

			// set the twin edge

			for ( let i = 0; i < 3; i ++ ) {

				const j = ( i + 1 ) % 3;

				// join face[ i ] i > 0, with the first face

				faces[ i + 1 ].getEdge( 2 ).setTwin( faces[ 0 ].getEdge( ( 3 - i ) % 3 ) );

				// join face[ i ] with face[ i + 1 ]

				faces[ i + 1 ].getEdge( 0 ).setTwin( faces[ j + 1 ].getEdge( 1 ) );

			}

		}

		// the initial hull is the tetrahedron

		for ( let i = 0; i < 4; i ++ ) {

			this.faces.push( faces[ i ] );

		}

		// initial assignment of vertices to the faces of the tetrahedron

		for ( let i = 0, l = vertices.length; i < l; i ++ ) {

			const vertex = vertices[ i ];

			if ( vertex !== v0 && vertex !== v1 && vertex !== v2 && vertex !== v3 ) {

				maxDistance = this.tolerance;
				let maxFace = null;

				for ( let j = 0; j < 4; j ++ ) {

					const distance = this.faces[ j ].distanceToPoint( vertex.point );

					if ( distance > maxDistance ) {

						maxDistance = distance;
						maxFace = this.faces[ j ];

					}

				}

				if ( maxFace !== null ) {

					this._addVertexToFace( vertex, maxFace );

				}

			}

		}

		return this;

	}

	/**
	 * Removes inactive (e.g. deleted) faces from the internal face list.
	 *
	 * @private
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_reindexFaces() {

		const activeFaces = [];

		for ( let i = 0; i < this.faces.length; i ++ ) {

			const face = this.faces[ i ];

			if ( face.mark === Visible ) {

				activeFaces.push( face );

			}

		}

		this.faces = activeFaces;

		return this;

	}

	/**
	 * Finds the next vertex to create faces with the current hull.
	 *
	 * - Let the initial face be the first face existing in the 'assigned' vertex list.
	 * - If a face doesn't exist then return since there're no vertices left.
	 * - Otherwise for each vertex that face sees find the one furthest away from it.
	 *
	 * @private
	 * @return {?VertexNode} The next vertex to add.
	 */
	_nextVertexToAdd() {

		// if the 'assigned' list of vertices is empty, no vertices are left. return with 'undefined'

		if ( this.assigned.isEmpty() === false ) {

			let eyeVertex, maxDistance = 0;

			// grab the first available face and start with the first visible vertex of that face

			const eyeFace = this.assigned.first().face;
			let vertex = eyeFace.outside;

			// now calculate the farthest vertex that face can see

			do {

				const distance = eyeFace.distanceToPoint( vertex.point );

				if ( distance > maxDistance ) {

					maxDistance = distance;
					eyeVertex = vertex;

				}

				vertex = vertex.next;

			} while ( vertex !== null && vertex.face === eyeFace );

			return eyeVertex;

		}

	}

	/**
	 * Computes a chain of half edges in CCW order called the 'horizon'. For an edge
	 * to be part of the horizon it must join a face that can see 'eyePoint' and a face
	 * that cannot see 'eyePoint'.
	 *
	 * @private
	 * @param {Vector3} eyePoint - The 3D-coordinates of a point.
	 * @param {HalfEdge} crossEdge - The edge used to jump to the current face.
	 * @param {Face} face - The current face being tested.
	 * @param {Array<HalfEdge>} horizon - The edges that form part of the horizon in CCW order.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_computeHorizon( eyePoint, crossEdge, face, horizon ) {

		// moves face's vertices to the 'unassigned' vertex list

		this._deleteFaceVertices( face );

		face.mark = Deleted;

		let edge;

		if ( crossEdge === null ) {

			edge = crossEdge = face.getEdge( 0 );

		} else {

			// start from the next edge since 'crossEdge' was already analyzed
			// (actually 'crossEdge.twin' was the edge who called this method recursively)

			edge = crossEdge.next;

		}

		do {

			const twinEdge = edge.twin;
			const oppositeFace = twinEdge.face;

			if ( oppositeFace.mark === Visible ) {

				if ( oppositeFace.distanceToPoint( eyePoint ) > this.tolerance ) {

					// the opposite face can see the vertex, so proceed with next edge

					this._computeHorizon( eyePoint, twinEdge, oppositeFace, horizon );

				} else {

					// the opposite face can't see the vertex, so this edge is part of the horizon

					horizon.push( edge );

				}

			}

			edge = edge.next;

		} while ( edge !== crossEdge );

		return this;

	}

	/**
	 * Creates a face with the vertices 'eyeVertex.point', 'horizonEdge.tail' and 'horizonEdge.head'
	 * in CCW order. All the half edges are created in CCW order thus the face is always pointing
	 * outside the hull.
	 *
	 * @private
	 * @param {VertexNode} eyeVertex - The vertex that is added to the hull.
	 * @param {HalfEdge} horizonEdge - A single edge of the horizon.
	 * @return {HalfEdge} The half edge whose vertex is the eyeVertex.
	 */
	_addAdjoiningFace( eyeVertex, horizonEdge ) {

		// all the half edges are created in ccw order thus the face is always pointing outside the hull

		const face = Face.create( eyeVertex, horizonEdge.tail(), horizonEdge.head() );

		this.faces.push( face );

		// join face.getEdge( - 1 ) with the horizon's opposite edge face.getEdge( - 1 ) = face.getEdge( 2 )

		face.getEdge( -1 ).setTwin( horizonEdge.twin );

		return face.getEdge( 0 ); // the half edge whose vertex is the eyeVertex


	}

	/**
	 * Adds 'horizon.length' faces to the hull, each face will be linked with the horizon
	 * opposite face and the face on the left/right.
	 *
	 * @private
	 * @param {VertexNode} eyeVertex - The vertex that is added to the hull.
	 * @param {Array<HalfEdge>} horizon - The horizon.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_addNewFaces( eyeVertex, horizon ) {

		this.newFaces = [];

		let firstSideEdge = null;
		let previousSideEdge = null;

		for ( let i = 0; i < horizon.length; i ++ ) {

			const horizonEdge = horizon[ i ];

			// returns the right side edge

			const sideEdge = this._addAdjoiningFace( eyeVertex, horizonEdge );

			if ( firstSideEdge === null ) {

				firstSideEdge = sideEdge;

			} else {

				// joins face.getEdge( 1 ) with previousFace.getEdge( 0 )

				sideEdge.next.setTwin( previousSideEdge );

			}

			this.newFaces.push( sideEdge.face );
			previousSideEdge = sideEdge;

		}

		// perform final join of new faces

		firstSideEdge.next.setTwin( previousSideEdge );

		return this;

	}

	/**
	 * Adds a vertex to the hull with the following algorithm:
	 *
	 * - Compute the 'horizon' which is a chain of half edges. For an edge to belong to this group
	 * it must be the edge connecting a face that can see 'eyeVertex' and a face which cannot see 'eyeVertex'.
	 * - All the faces that can see 'eyeVertex' have its visible vertices removed from the assigned vertex list.
	 * - A new set of faces is created with each edge of the 'horizon' and 'eyeVertex'. Each face is connected
	 * with the opposite horizon face and the face on the left/right.
	 * - The vertices removed from all the visible faces are assigned to the new faces if possible.
	 *
	 * @private
	 * @param {VertexNode} eyeVertex - The vertex to add.
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_addVertexToHull( eyeVertex ) {

		const horizon = [];

		this.unassigned.clear();

		// remove 'eyeVertex' from 'eyeVertex.face' so that it can't be added to the 'unassigned' vertex list

		this._removeVertexFromFace( eyeVertex, eyeVertex.face );

		this._computeHorizon( eyeVertex.point, null, eyeVertex.face, horizon );

		this._addNewFaces( eyeVertex, horizon );

		// reassign 'unassigned' vertices to the new faces

		this._resolveUnassignedPoints( this.newFaces );

		return	this;

	}

	/**
	 * Cleans up internal properties after computing the convex hull.
	 *
	 * @private
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_cleanup() {

		this.assigned.clear();
		this.unassigned.clear();
		this.newFaces = [];

		return this;

	}

	/**
	 * Starts the execution of the quick hull algorithm.
	 *
	 * @private
	 * @return {ConvexHull} A reference to this convex hull.
	 */
	_compute() {

		let vertex;

		this._computeInitialHull();

		// add all available vertices gradually to the hull

		while ( ( vertex = this._nextVertexToAdd() ) !== undefined ) {

			this._addVertexToHull( vertex );

		}

		this._reindexFaces();

		this._cleanup();

		return this;

	}

}

/**
 * Represents a section bounded by a specific amount of half-edges.
 * The current implementation assumes that a face always consist of three edges.
 *
 * @private
 */
class Face {

	/**
	 * Constructs a new face.
	 */
	constructor() {

		/**
		 * The normal vector of the face.
		 *
		 * @private
		 * @type {Vector3}
		 */
		this.normal = new Vector3();

		/**
		 * The midpoint or centroid of the face.
		 *
		 * @private
		 * @type {Vector3}
		 */
		this.midpoint = new Vector3();

		/**
		 * The area of the face.
		 *
		 * @private
		 * @type {number}
		 * @default 0
		 */
		this.area = 0;

		/**
		 * Signed distance from face to the origin.
		 *
		 * @private
		 * @type {number}
		 * @default 0
		 */
		this.constant = 0;

		/**
		 * Reference to a vertex in a vertex list this face can see.
		 *
		 * @private
		 * @type {?VertexNode}
		 * @default null
		 */
		this.outside = null; // reference to a vertex in a vertex list this face can see
		this.mark = Visible;

		/**
		 * Reference to the base edge of a face. To retrieve all edges, you can use the
		 * `next` reference of the current edge.
		 *
		 * @private
		 * @type {?HalfEdge}
		 * @default null
		 */
		this.edge = null;

	}

	/**
	 * Creates a face from the given vertex nodes.
	 *
	 * @private
	 * @param {VertexNode} a - The first vertex node.
	 * @param {VertexNode} b - The second vertex node.
	 * @param {VertexNode} c - The third vertex node.
	 * @return {Face} The created face.
	 */
	static create( a, b, c ) {

		const face = new Face();

		const e0 = new HalfEdge( a, face );
		const e1 = new HalfEdge( b, face );
		const e2 = new HalfEdge( c, face );

		// join edges

		e0.next = e2.prev = e1;
		e1.next = e0.prev = e2;
		e2.next = e1.prev = e0;

		// main half edge reference

		face.edge = e0;

		return face.compute();

	}

	/**
	 * Returns an edge by the given index.
	 *
	 * @private
	 * @param {number} i - The edge index.
	 * @return {HalfEdge} The edge.
	 */
	getEdge( i ) {

		let edge = this.edge;

		while ( i > 0 ) {

			edge = edge.next;
			i --;

		}

		while ( i < 0 ) {

			edge = edge.prev;
			i ++;

		}

		return edge;

	}

	/**
	 * Computes all properties of the face.
	 *
	 * @private
	 * @return {Face} A reference to this face.
	 */
	compute() {

		const a = this.edge.tail();
		const b = this.edge.head();
		const c = this.edge.next.head();

		_triangle.set( a.point, b.point, c.point );

		_triangle.getNormal( this.normal );
		_triangle.getMidpoint( this.midpoint );
		this.area = _triangle.getArea();

		this.constant = this.normal.dot( this.midpoint );

		return this;

	}

	/**
	 * Returns the signed distance from a given point to the plane representation of this face.
	 *
	 * @private
	 * @param {Vector3} point - The point to compute the distance to.
	 * @return {number} The distance.
	 */
	distanceToPoint( point ) {

		return this.normal.dot( point ) - this.constant;

	}

}

/**
 * The basis for a half-edge data structure, also known as doubly
 * connected edge list (DCEL).
 *
 * @private
 */
class HalfEdge {

	/**
	 * Constructs a new half edge.
	 *
	 * @param {VertexNode} vertex - A reference to its destination vertex.
	 * @param {Face} face - A reference to its face.
	 */
	constructor( vertex, face ) {

		/**
		 * A reference to its destination vertex.
		 *
		 * @private
		 * @type {VertexNode}
		 */
		this.vertex = vertex;

		/**
		 * Reference to the previous half-edge of the same face.
		 *
		 * @private
		 * @type {?HalfEdge}
		 * @default null
		 */
		this.prev = null;

		/**
		 * Reference to the next half-edge of the same face.
		 *
		 * @private
		 * @type {?HalfEdge}
		 * @default null
		 */
		this.next = null;

		/**
		 * Reference to the twin half-edge to reach the opposite face.
		 *
		 * @private
		 * @type {?HalfEdge}
		 * @default null
		 */
		this.twin = null;

		/**
		 * A reference to its face.
		 *
		 * @private
		 * @type {Face}
		 */
		this.face = face;

	}

	/**
	 * Returns the destination vertex.
	 *
	 * @private
	 * @return {VertexNode} The destination vertex.
	 */
	head() {

		return this.vertex;

	}

	/**
	 * Returns the origin vertex.
	 *
	 * @private
	 * @return {VertexNode} The destination vertex.
	 */
	tail() {

		return this.prev ? this.prev.vertex : null;

	}

	/**
	 * Returns the Euclidean length (straight-line length) of the edge.
	 *
	 * @private
	 * @return {number} The edge's length.
	 */
	length() {

		const head = this.head();
		const tail = this.tail();

		if ( tail !== null ) {

			return tail.point.distanceTo( head.point );

		}

		return -1;

	}

	/**
	 * Returns the square of the Euclidean length (straight-line length) of the edge.
	 *
	 * @private
	 * @return {number} The square of the edge's length.
	 */
	lengthSquared() {

		const head = this.head();
		const tail = this.tail();

		if ( tail !== null ) {

			return tail.point.distanceToSquared( head.point );

		}

		return -1;

	}

	/**
	 * Sets the twin edge of this half-edge. It also ensures that the twin reference
	 * of the given half-edge is correctly set.
	 *
	 * @private
	 * @param {HalfEdge} edge - The twin edge to set.
	 * @return {HalfEdge} A reference to this edge.
	 */
	setTwin( edge ) {

		this.twin = edge;
		edge.twin = this;

		return this;

	}

}

/**
 * A vertex as a double linked list node.
 *
 * @private
 */
class VertexNode {

	/**
	 * Constructs a new vertex node.
	 *
	 * @param {Vector3} point - A point in 3D space.
	 */
	constructor( point ) {

		/**
		 * A point in 3D space.
		 *
		 * @private
		 * @type {Vector3}
		 */
		this.point = point;

		/**
		 * Reference to the previous vertex in the double linked list.
		 *
		 * @private
		 * @type {?VertexNode}
		 * @default null
		 */
		this.prev = null;

		/**
		 * Reference to the next vertex in the double linked list.
		 *
		 * @private
		 * @type {?VertexNode}
		 * @default null
		 */
		this.next = null;

		/**
		 * Reference to the face that is able to see this vertex.
		 *
		 * @private
		 * @type {?Face}
		 * @default null
		 */
		this.face = null;

	}

}

/**
 * A doubly linked list of vertices.
 *
 * @private
 */
class VertexList {

	/**
	 * Constructs a new vertex list.
	 */
	constructor() {

		/**
		 * Reference to the first vertex of the linked list.
		 *
		 * @private
		 * @type {?VertexNode}
		 * @default null
		 */
		this.head = null;

		/**
		 * Reference to the last vertex of the linked list.
		 *
		 * @private
		 * @type {?VertexNode}
		 * @default null
		 */
		this.tail = null;

	}

	/**
	 * Returns the head reference.
	 *
	 * @private
	 * @return {VertexNode} The head reference.
	 */
	first() {

		return this.head;

	}

	/**
	 * Returns the tail reference.
	 *
	 * @private
	 * @return {VertexNode} The tail reference.
	 */
	last() {

		return this.tail;

	}

	/**
	 * Clears the linked list.
	 *
	 * @private
	 * @return {VertexList} A reference to this vertex list.
	 */
	clear() {

		this.head = this.tail = null;

		return this;

	}

	/**
	 * Inserts a vertex before a target vertex.
	 *
	 * @private
	 * @param {VertexNode} target - The target.
	 * @param {VertexNode} vertex - The vertex to insert.
	 * @return {VertexList} A reference to this vertex list.
	 */
	insertBefore( target, vertex ) {

		vertex.prev = target.prev;
		vertex.next = target;

		if ( vertex.prev === null ) {

			this.head = vertex;

		} else {

			vertex.prev.next = vertex;

		}

		target.prev = vertex;

		return this;

	}

	/**
	 * Inserts a vertex after a target vertex.
	 *
	 * @private
	 * @param {VertexNode} target - The target.
	 * @param {VertexNode} vertex - The vertex to insert.
	 * @return {VertexList} A reference to this vertex list.
	 */
	insertAfter( target, vertex ) {

		vertex.prev = target;
		vertex.next = target.next;

		if ( vertex.next === null ) {

			this.tail = vertex;

		} else {

			vertex.next.prev = vertex;

		}

		target.next = vertex;

		return this;

	}

	/**
	 * Appends a vertex to this vertex list.
	 *
	 * @private
	 * @param {VertexNode} vertex - The vertex to append.
	 * @return {VertexList} A reference to this vertex list.
	 */
	append( vertex ) {

		if ( this.head === null ) {

			this.head = vertex;

		} else {

			this.tail.next = vertex;

		}

		vertex.prev = this.tail;
		vertex.next = null; // the tail has no subsequent vertex

		this.tail = vertex;

		return this;

	}

	/**
	 * Appends a chain of vertices where the given vertex is the head.
	 *
	 * @private
	 * @param {VertexNode} vertex - The head vertex of a chain of vertices.
	 * @return {VertexList} A reference to this vertex list.
	 */
	appendChain( vertex ) {

		if ( this.head === null ) {

			this.head = vertex;

		} else {

			this.tail.next = vertex;

		}

		vertex.prev = this.tail;

		// ensure that the 'tail' reference points to the last vertex of the chain

		while ( vertex.next !== null ) {

			vertex = vertex.next;

		}

		this.tail = vertex;

		return this;

	}

	/**
	 * Removes a vertex from the linked list.
	 *
	 * @private
	 * @param {VertexNode} vertex - The vertex to remove.
	 * @return {VertexList} A reference to this vertex list.
	 */
	remove( vertex ) {

		if ( vertex.prev === null ) {

			this.head = vertex.next;

		} else {

			vertex.prev.next = vertex.next;

		}

		if ( vertex.next === null ) {

			this.tail = vertex.prev;

		} else {

			vertex.next.prev = vertex.prev;

		}

		return this;

	}

	/**
	 * Removes a sublist of vertices from the linked list.
	 *
	 * @private
	 * @param {VertexNode} a - The head of the sublist.
	 * @param {VertexNode} b - The tail of the sublist.
	 * @return {VertexList} A reference to this vertex list.
	 */
	removeSubList( a, b ) {

		if ( a.prev === null ) {

			this.head = b.next;

		} else {

			a.prev.next = b.next;

		}

		if ( b.next === null ) {

			this.tail = a.prev;

		} else {

			b.next.prev = a.prev;

		}

		return this;

	}

	/**
	 * Returns `true` if the linked list is empty.
	 *
	 * @private
	 * @return {boolean} Whether the linked list is empty or not.
	 */
	isEmpty() {

		return this.head === null;

	}

}

/**
 * This class can be used to generate a convex hull for a given array of 3D points.
 * The average time complexity for this task is considered to be O(nlog(n)).
 *
 * ```js
 * const geometry = new ConvexGeometry( points );
 * const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
 * const mesh = new THREE.Mesh( geometry, material );
 * scene.add( mesh );
 * ```
 *
 * @augments BufferGeometry
 * @three_import import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
 */
class ConvexGeometry extends BufferGeometry {

	/**
	 * Constructs a new convex geometry.
	 *
	 * @param {Array<Vector3>} points - An array of points in 3D space which should be enclosed by the convex hull.
	 */
	constructor( points = [] ) {

		super();

		// buffers

		const vertices = [];
		const normals = [];

		const convexHull = new ConvexHull().setFromPoints( points );

		// generate vertices and normals

		const faces = convexHull.faces;

		for ( let i = 0; i < faces.length; i ++ ) {

			const face = faces[ i ];
			let edge = face.edge;

			// we move along a doubly-connected edge list to access all face points (see HalfEdge docs)

			do {

				const point = edge.head().point;

				vertices.push( point.x, point.y, point.z );
				normals.push( face.normal.x, face.normal.y, face.normal.z );

				edge = edge.next;

			} while ( edge !== face.edge );

		}

		// build geometry

		this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );

	}

}

let Geo = null;
let Mat$2 = null;

const _up = /*@__PURE__*/ new Vector3(0,1,0);
const _right = /*@__PURE__*/ new Vector3(1,0,0);
const _forward = /*@__PURE__*/ new Vector3(0,0,1);

// THREE BODY

class Body extends Item {

	constructor ( motor ) {

		super();

		this.motor = motor;
		this.engine = this.motor.engine;
		this.Utils = this.motor.utils;

		Geo = this.motor.geo;
		Mat$2 = this.motor.mat;

		this.type = 'body';
		this.num = Num[this.type];
		this.full = false;
		//this.extraConvex = false;
		this.needMatrix = this.engine ==='RAPIER' || this.engine ==='HAVOK';
		//this.tmpVolume = 0

	}

	setFull( full ){

		this.num = Num[ full ? 'bodyFull':'body' ];
		this.full = full;
		
	}

	step (AR, N) {

		const list = this.list;
		let i = list.length, b, n, vv;
		
		while( i-- ){

			b = list[i];
			//b.id = i;

			if( b === null ) continue;

			n = N + ( i * this.num );

			// update only when physics actif buggy
			if( !b.actif ){
				// a = MathTool.nullArray( AR, n, this.num );
				//a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7];
				//if( a === 0 ) continue
				//if( MathTool.nullArray( AR, n, this.num ) === 0 ) continue;
				//else 
				b.actif = true;
				continue;
			}

		    // test is object sleep
			b.sleep = AR[n] > 0 ? false : true;

			// update default material
	        if( b.defMat ){

	        	if( b.isInstance ){
	        		b.instance.setColorAt( b.idx, b.sleep ? Colors.sleep : Colors.body );
	        	} else {
	        		if ( !b.sleep && b.material.name === 'sleep' ) b.material = Mat$2.get('body');
			        if ( b.sleep && b.material.name === 'body' ) b.material = Mat$2.get('sleep');
	        	}
			    
			}

			if( b.sleep && !b.isKinematic ) continue; 

			

			// update position / rotation

			b.position.fromArray( AR, n + 1 );
	        b.quaternion.fromArray( AR, n + 4 );

	        if(this.motor.ws !== 1) b.position.multiplyScalar(this.motor.uws);

	        // update velocity

	        if( this.full ){
		        b.velocity.fromArray( AR, n + 8 );
		        b.angular.fromArray( AR, n + 11 );
		    } else {
	    		if( b.getVelocity ){
	    			vv = this.motor.reflow.velocity[b.name];
	    			if(vv){
	    				b.velocity.fromArray(vv, 0 );
	    				b.angular.fromArray(vv, 3 );
	    			}
	    		}
	    	}

	    	//

	    	if( b.isInstance ){ 
		    	if( b.speedMat ){ 
		    		//b.instance.setColorAt( b.id, [ Math.abs(AR[n+8])*0.5, Math.abs(AR[n+9])*0.5, Math.abs(AR[n+10])*0.5] );
		    		let v = AR[n]*0.01;///255; //MathTool.lengthArray([AR[n+8], AR[n+9], AR[n+10]]) * 0.062;
		    		b.instance.setColorAt( b.idx, [ v,v,v ] );
		    	}
		    	//b.instance.setTransformAt( b.idx, [AR[n+1],AR[n+2],AR[n+3]], [AR[n+4],AR[n+5],AR[n+6],AR[n+7]], b.noScale ? [1,1,1] : b.size );
		    	b.instance.setTransformAt( b.idx, b.position.toArray(), b.quaternion.toArray(), b.noScale ? [1,1,1] : b.size );
		    	if( this.needMatrix ) b.matrixWorld.compose( b.position, b.quaternion, {x:1, y:1, z:1}); 
		    	
		    } else { 

		        if( !b.auto ) b.updateMatrix();

		    }

		}

	}

	///

	geometry ( o = {}, b = null, material = null ) {

		let g, i, n, s = o.size, gName='';
		let t = o.type;
		let noScale = false, unic = false;
		let seg = o.seg || 16;

		const noIndex = this.engine === 'OIMO' || this.engine === 'JOLT' || this.engine === 'AMMO' || this.engine === 'CANNON';

		//if( o.instance && t!== 'capsule'&& !o.radius) s = o.instanceSize || [1,1,1]

		if( o.instance && t === 'compound'){ 
			t = o.shapes[0].type;
			s = o.shapes[0].size;
			o.translate = o.shapes[0].pos;
		}

		if( t==='mesh' || t==='convex' ){
			if( o.shape ){
				if( o.shape.isMesh ) o.shape = o.shape.geometry;
			} else {
				if( o.mesh && !o.v ) o.shape = o.mesh.geometry;
			}	
		}

		if( o.radius ){
			//if( !o.breakable ){
				if( t === 'box' ) t = 'ChamferBox';
				if( t === 'cylinder' ) t = 'ChamferCyl';
			//}
		}

		if( o.geometry ){
			if( t === 'convex' ) o.shape = o.geometry;
			else t = 'direct';
		} 


	    if( this.engine === 'PHYSX' && o.type==='cylinder' ){
			// convert geometry to convex if not in physics
	    	let geom = new CylinderGeometry( o.size[ 0 ], o.size[ 0 ], o.size[ 1 ], seg, 1 );//24
	    	if( o.isWheel ) geom.rotateZ( -PI90 );
	    	o.v = MathTool.getVertex( geom );
	    	o.type = 'convex';

	    }

	    if( ( this.engine === 'PHYSX' || this.engine === 'HAVOK' || this.engine === 'JOLT' ) && o.type==='cone' ){
	    	// convert geometry to convex if not in physics
	    	//if( !o.size[2] ) o.size[2] = 0;
	    	//console.log(o.size[2])
	    	let geom = new CylinderGeometry( 0, o.size[ 0 ], o.size[ 1 ], seg, 1 );//24

	    	//o.size[2] = o.size[0]
	    	o.v = MathTool.getVertex( geom );
	    	o.type = 'convex';

	    }

	    if( o.type==='stair' ){
	    	o.type = 'box';
	    	t = 'box';
	    }

		switch( t ){

			case 'direct':

			    g = o.geometry.clone();
			    if( o.size ) g.scale( o.size[0], o.size[1], o.size[2] );

			    unic = true;
			    noScale = true;

			break;

			case 'convex':

				if( o.v ){ 

					if( o.nogeo ) g = new BufferGeometry();
					else {
						let vv = [];
						i = Math.floor( o.v.length/3 );
						while( i-- ){
							n = i*3;
							vv.push( new Vector3( o.v[n], o.v[n+1], o.v[n+2] ) );
						}
						g = new ConvexGeometry( vv );
						//o.v = math.getVertex( g )
						//o.index = math.getIndex( g )
						//console.log(o.v, o.index)
					}
					unic = true;
					noScale = true;
				}

				if( o.shape ){

					g = o.shape.clone();
					if( o.size ) g.scale( o.size[0], o.size[0], o.size[0] );
					if( o.shapeScale ) g.scale( o.shapeScale[0], o.shapeScale[1], o.shapeScale[2] );

					let tg = noIndex ? MathTool.toNonIndexed(g) : null;
					o.v = MathTool.getVertex( tg || g, noIndex );
					o.index = MathTool.getIndex( tg || g, noIndex );
					if(this.engine === 'CANNON');

					unic = true;
					noScale = true;
				}

				if(!g.boundingBox) g.computeBoundingBox();
				let bx = g.boundingBox;
			    o.boxSize = [ -bx.min.x + bx.max.x, -bx.min.y + bx.max.y, -bx.min.z + bx.max.z ];

			    /*if(this.engine === 'PHYSX'){
					let center = new Vector3();
					MathTool.getCenter( g, center );
					if(!o.massCenter) o.massCenter = center.toArray();
					//console.log(o.massCenter)
				}*/

			break;

			case 'mesh':

				g = o.shape.clone();
				if( o.size ) g.scale( o.size[0], o.size[0], o.size[0] );
				
				o.v = MathTool.getVertex( g, noIndex );
				o.index = MathTool.getIndex( g, noIndex );

				//console.log(o.v, o.index)

				//console.log(o.index)

				/*let use16 = false;

				if(use16){
					let z = o.index.length;
					let index16 = new Uint16Array(z);
					while(z--){
						index16[z] = o.index[z];
					}
					o.index = index16;
				}*/

				if(this.engine === 'PHYSX'){
					let center = new Vector3();
					MathTool.getCenter( g, center );
					if(!o.massCenter) o.massCenter = center.toArray();
					//console.log(o.massCenter)
				}
				
				
				unic = true;
				noScale = true;
			
			break;

			case 'customSphere':

			    gName = 'customSphere_' + s[ 0 ];

			    g = Geo.get( gName );
			    if(!g){
			    	g = new SphereGeometry( s[ 0 ], o.seg1 || 32, o.seg2 || 16 );
					g.name = gName;
			    } else {
					gName = '';
				}
			    noScale = true;
			    o.type = 'sphere';

			break;

			/*case 'highSphere':

			    gName = 'highSphere_' + s[ 0 ];

			    g = Geo.get( gName );
			    if(!g){
			    	g = new SphereBox( s[ 0 ] );
					g.name = gName
			    } else {
					gName = ''
				}
			    noScale = true;
			    o.type = 'sphere';

			break;*/

			case 'capsule':

			    gName = 'capsule_' + s[ 0 ] +'_'+s[ 1 ] + '_' + seg; 

			    g = Geo.get( gName );
			    if(!g){
			    	//if( o.helper ) g = new CapsuleHelperGeometry( s[ 0 ], s[ 1 ] )
					//else 
					g = new Capsule( s[ 0 ], s[ 1 ], seg );
					g.name = gName;
				} else {
					gName = '';
				}
				noScale = true;
			break;

			case 'ChamferBox':

			    gName = 'ChamferBox_' + s[ 0 ] +'_'+ s[ 1 ] +'_'+ s[ 2 ] + '_' + o.radius; 

			    //console.log(s, o.radius)
			    g = Geo.get( gName );
			    if(!g){
					g = new ChamferBox$1( s[ 0 ], s[ 1 ], s[ 2 ], o.radius );
					g.name = gName;
				} else {
					gName = '';
				}
				noScale = true;
			break;

			case 'ChamferCyl':

			    gName = 'ChamferCyl_' + s[ 0 ] +'_'+ s[ 1 ] +'_'+ s[ 2 ] + '_' + o.radius + '_' + seg;

			    g = Geo.get( gName );
			    if(!g){
					g = new ChamferCyl( s[ 0 ], s[ 0 ], s[ 1 ], o.radius, seg );
					g.name = gName;
				} else {
					gName = '';
				}
				noScale = true;
			break;

			default:
			    if( !o.breakable ) g = Geo.get(t); //geo[ t ];
			    else {
			    	g = Geo.get(t).clone();
			    	g.scale( s[0], s[1], s[2] );
			    	unic = true;
			    	noScale = true;
			    }
			    
			    if( t === 'highSphere' ) o.type = 'sphere';

			break;

		}


		if( o.translate ) g.translate( o.translate[0], o.translate[1], o.translate[2]);


		// clear untranspherable variable for phy
    	if( o.shape ) delete o.shape;
    	if( o.geometry ) delete o.geometry;


    	if ( g.attributes.uv === undefined || o.autoUV ){
				//console.log(o.shape)
				createUV$1(g, 'box', 5.0, o.pos, o.quat );
		}


    	// reuse complex geometry
    	if( gName !== '' ) Geo.set( g );

    	if( o.isWheel ){
    		g = g.clone();
    		g.rotateZ( -PI90 );
    		unic = true;
    	}
    	
    	// unic geometry dispose on reset 
    	if( unic ) Geo.unic(g);

    	


    	if( b === null && material === null ){
    		g.noScale = noScale; 
    		return g
    	}

    	if( o.meshRemplace && o.debug ) material = Mat$2.get( 'debug' );
    	//if( o.debug ) material = Mat.get( 'debug' )
    	//if( o.helper ) material = Mat.get( 'hide' )

    	//if( o.instance ) return

    	//console.log( material.name )

		let m = new Mesh( g, material );

		if( o.button ) m.isButton = true;

		//if( o.helper ) m.add( new LineSegments( new CapsuleHelperGeometry( s[ 0 ], s[ 1 ] ),  Mat.get( 'line' ) ))
		if( o.helper ) {

			let hcolor = o.hcolor || [0.3,0.1,0.0];
			let hcolor2 = o.hcolor2 || [0.8,0.2,0.0];

			// TODO bug with character
			let hh = new CapsuleHelper( s[ 0 ], s[ 1 ]+(s[ 0 ]*2), false, Mat$2.get( 'liner' ), hcolor, hcolor2, true );
			m.add( hh );
			m.userData['helper'] = hh;

		}

		if( o.localRot ) o.localQuat = MathTool.quatFromEuler(o.localRot); //math.toQuatArray( o.localRot )
		if( o.localPos ) m.position.fromArray( o.localPos );
		if( o.localQuat ) m.quaternion.fromArray( o.localQuat );

    	if( !noScale ) m.scale.fromArray( o.size );
    	//if( unic ) m.unic = true

    	// disable raycast
    	if(o.ray !== undefined){
    		if( !o.ray ) m.raycast = () => {return};
    	}

    	// add or not add
    	if( !o.meshRemplace || o.debug ){ 
    		b.add( m );
    		if(m.userData.helper) b.over = (b)=>{ m.userData.helper.over(b); };
    	}

	}

	add ( o = {} ) {

		if(o.worldScale){
			o = this.scaler( o, o.worldScale );
			delete o.worldScale;
		}

		//this.tmpVolume = 0

		//console.log('add', o.type )

		let i, n, name, volume = 0;

		if( !o.instance ) name = this.setName( o );

		o.type = o.type === undefined ? 'box' : o.type;

		if( o.type === 'plane' && !o.visible ) o.visible = false;

		if( o.type === 'stair'){ 

			let v1 = new Vector3(0,0,o.size[2]);
			let v2 = new Vector3(0, o.size[1]*0.5,o.size[2]*0.5);
			let angle = v1.angleTo(v2);
			let dist = v1.distanceTo(v2);
			o.rot = [angle * todeg$1,0,0];
			o.size[1] *= o.div || 0.2;
			o.size[2] = dist*2;
		
		    let p1 = new Vector3(0,-o.size[1]*0.5,0);
		    p1.applyAxisAngle({x:1, y:0, z:0}, angle);
			o.pos[1] += p1.y;
			o.pos[2] += p1.z;

		}


		// change default center of mass 
		// if engine don't have massCenter option
		// is convert to compound
		
		if( o.massCenter && WithMassCenter.indexOf(this.engine) ===-1 ){
			if( o.type !== 'compound' ){
				//o.localPos = o.massCenter
				o.shapes = [{ type:o.type, pos:o.massCenter, size:o.size }];
				if( o.seg ) o.shapes[0].seg = o.seg;
				if( o.radius ) o.shapes[0].radius = o.radius;
				delete o.size; // ?? TODO
				o.type = 'compound';
			} else {
				for ( i = 0; i < o.shapes.length; i ++ ) {
					n = o.shapes[ i ];
					if( n.pos ) n.pos = MathTool.addArray( n.pos, o.massCenter );
					else n.pos = o.massCenter;
					//Geo.unic(n);

				}
			}
		}

		if( o.collision !== undefined ){
			if(o.collision === false){
				if( this.engine === 'PHYSX' ) o.flags = 0;
				if( this.engine === 'OIMO' ) o.mask = 0;
				//o.mask = 0
			}
			
		}

		//----------------------------
		//  Position, Rotation, Size
		//----------------------------

		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;

		// rotation is in degree or Quaternion
	    o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
	    // convert euler degree to Quaternion
	    if( o.rot !== undefined ) o.quat = MathTool.quatFromEuler(o.rot);
	    if( o.meshRot !== undefined ) o.meshQuat = MathTool.quatFromEuler(o.meshRot);

	    //o.size = o.size == undefined ? [ 1, 1, 1 ] : math.correctSize( o.size );
	    o.size = MathTool.autoSize( o.size, o.type );
	    if( o.meshScale ) o.meshScale = MathTool.autoSize( o.meshScale );


	    //--------------------
		//  Material
		//--------------------

	    let material, noMat = false;

	    if( o.visible === false ) o.material = 'hide';

	    if ( o.material !== undefined ) {
	    	if ( o.material.constructor === String ) material = Mat$2.get( o.material );
	    	else material = o.material;
	    } else {
	    	noMat = true;
	    	//defMat = this.type === 'body'
	    	material = Mat$2.get( this.type );
	    	if( o.instance && this.type!=='solid') material = Mat$2.get( 'base' );
	    }

	    if( o.unicMat ) {
	    	material = material.clone();
	    	Mat$2.addToTmp( material );
	    }


	    //--------------------
		//  Define Object
		//--------------------

	    let b = o.instance ? {} : new Object3D();// new Basic3D();

	    if( o.mesh && !o.instance ){

	    	//if( o.isTerrain ) o.noClone = true
	    	if( o.mesh.type === 'terrain' ) o.noClone = true;

	    	let mm = o.noClone ? o.mesh : o.mesh.clone();

	    	mm.position.fromArray( o.meshPos || [0,0,0]);
	    	//if( o.meshRot ) { o.meshQuat = MathTool.quatFromEuler(o.meshRot); delete o.meshRot; }
	    	if( o.meshQuat ) mm.quaternion.fromArray( o.meshQuat );
	    	if( o.meshSize ) mm.scale.set(1,1,1).multiplyScalar(o.meshSize);
	    	if( o.meshScale ) mm.scale.fromArray( o.meshScale );
	    	
	    	if( !noMat ){ 
	    		mm.material = material;
	    		if(mm.children && !o.nofullmat ) for(let k in mm.children) mm.children[k].material = material;
	    	}

	    	this.motor.tmpMesh.push(mm);

	    	o.meshRemplace = true;
	    	b.add( mm );

	    }

	    //--------------------
		//  Define Geometry
		//--------------------

	    switch( o.type ){

	    	case 'null': break;

	    	case 'compound':

	    	    for ( i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

					n.type = n.type === undefined ? 'box' : n.type;
					//n.size = n.size === undefined ? [ 1, 1, 1 ] : math.correctSize( n.size );
					n.size = MathTool.autoSize( n.size, n.type );

					if( n.pos ) n.localPos = n.pos;
					if( n.rot !== undefined ) n.quat = MathTool.quatFromEuler(n.rot);
					if( n.quat ) n.localQuat = n.quat;
					
					n.debug = o.debug;
					n.meshRemplace = o.meshRemplace || false;

					if( !o.instance ) this.geometry( n, b, material );
					else if( n.type === 'convex' ){ 
				    	n.v = MathTool.getVertex( n.shape, false );
				    }
					volume += MathTool.getVolume( n.type, n.size, n.v );
					//console.log(n.type, n.size)

				}

				//console.log(volume, name)

	    	break;
	    	default:

			    if( !o.instance ) this.geometry( o, b, material );
			    // TODO fix that 
			    else if( o.type === 'convex' ){ 
			    	o.v = MathTool.getVertex( o.shape, false );
			    }
			    // TODO bug with instance !!!
			    //else o.size = MathTool.autoSize( o.size, o.type );
			    volume = MathTool.getVolume( o.type, o.size, o.v );

			break;

	    }



	    
	    b.type = this.type;
	    b.size = o.size;
		b.shapetype = o.type;
		b.isKinematic = o.kinematic || false;
		b.link = 0;

		b.meshSize = o.meshSize ? o.meshSize : 1;

		b.velocity = new Vector3();
		b.angular = new Vector3();

		b.sleep = o.sleep || false;
		b.defMat = false;

		// for buttton only
		if( o.button ) b.isButton = true;

	    // enable or disable raycast
	    b.isRay = o.ray !== undefined ? o.ray : true;



	    //b.type === 'body' || b.isButton ? true : false
	    //if( o.ray !== undefined ){ 
	    //	b.isRay = o.ray;

	    	//b.setRaycast( o.ray )
	    //}
	    //if( !o.instance ) b.setRaycast()


	    
		
		if( b.material && noMat ) b.defMat = b.material.name === 'body';


	    //--------------------
		//  Instance
		//--------------------

		if( o.instance ){ 

			b.isInstance = true;
			b.instance = this.getInstance( o, material );
			b.instance.isRay = b.isRay;

			b.over = b.instance.over;
			b.isRay = false;
			b.isOver = false;

			b.speedMat = o.speedMat || false;

			b.defMat = b.instance.material.name === 'base';
			
			b.idx = b.instance.count;
			//b.unicId = MathUtils.generateUUID();

			//b.mass = o.mass || 0

			//b.refName = b.instance.name + b.id;
			b.name = o.name ? o.name : b.instance.name + b.idx;
			o.name = b.name;

			b.noScale = b.instance.noScale;//false//o.type!=='box' || o.type!=='ChamferBox' || o.type!=='sphere';
			if(o.sizeByInstance) b.noScale = false;
			//if(o.type === 'sphere') b.noScale = false
		    //if( o.type === 'capsule' ) b.noScale = true
		    //if( o.type === 'box' ) b.noScale = true
			//if(o.radius) b.noScale = true

			let color = o.color;
			if( b.defMat ) color = o.sleep ? Colors.sleep : Colors.body;

			b.instance.add( b, o.pos, o.quat, b.noScale ? [1,1,1] : b.size, color );

			
			b.position = new Vector3().fromArray(o.pos); //{x:o.pos[0], y:o.pos[1], z:o.pos[2]};
			b.quaternion = new Quaternion().fromArray(o.quat); //{_x:o.quat[0], _y:o.quat[1], _z:o.quat[2], _w:o.quat[3]};

			
		    
		    //b.link = 0;
		    if( this.needMatrix ) b.matrixWorld = new Matrix4();

			// for convex
			if(b.instance.v) o.v = b.instance.v;
			if(b.instance.index) o.index = b.instance.index;
		    o.type = b.instance.type;


		    // skip first frame to force good repositionning on delete !
		    b.actif = false;

			/*if( this.extraConvex && ( o.type==='cylinder' || o.type==='cone') ){
		    	o.v = b.instance.v;
		    	o.type = 'convex';
		    }*/


			//console.log( b )

		} else {

			b.name = name;

			if(!b.isRay){
				b.traverse( function ( node ) {
					if( node.isObject3D ) node.raycast = () => {return};
				});
			}

			if( o.renderOrder ) b.renderOrder = o.renderOrder;
			if( o.visible === undefined ) o.visible = true;
			if( o.shadow === undefined ) o.shadow = o.visible;

			b.dispose = function(){
		    	if(this.clearOutLine) this.clearOutLine();
		    	this.traverse( function ( node ) {
					if( node.isMesh && node.unic ) node.geometry.dispose();
				});
				this.children = [];
		    }.bind(b);

			b.visible = o.visible !== undefined ? o.visible : true;

			Object.defineProperty(b, 'material', {
				get() {
				    if( this.children[0] ) return this.children[0].material;
				    else return null;
				},
				set(value) {
				    this.traverse( function ( node ) { if( node.isMesh && node.name !== 'outline' ) node.material = value; });
				}
			});

			Object.defineProperty(b, 'castShadow', {
				get() {
				    if( this.children[0] ) return this.children[0].castShadow;
				    else return false;
				},
				set(value) {
				    this.traverse( function ( node ) { if( node.isMesh ) node.castShadow = value; });
				}
			});

			Object.defineProperty(b, 'receiveShadow', {
				get() {
				    if( this.children[0] ) return this.children[0].receiveShadow;
				    else return false;
				},
				set(value) {
				    this.traverse( function ( node ) { if( node.isMesh ) node.receiveShadow = value; });
				}
			});

		    b.receiveShadow = o.shadow;
		    b.castShadow = o.shadow;

		    if( this.motor.mouseActive ){

		    	b.overMaterial = Mat$2.get( 'outline' );
		    	b.isOver = false;

		    	// extra function to display wireframe over object

		    	b.addOutLine = function(){
		    		if( !this.children[0].isMesh ) return;
		    		this.outline = new Mesh().copy( this.children[0] );
					this.outline.name = "outline";
					this.outline.material = this.overMaterial;
					this.outline.matrixAutoUpdate = false;
					this.outline.receiveShadow = false;
					this.outline.castShadow = false;
					this.outline.raycast = () => ( false );
					this.add( this.outline );
		    	}.bind(b);

		    	b.clearOutLine = function(){
		    		if( !this.outline ) return;
					this.remove(this.outline);
					this.outline = null;
		    	}.bind(b);

		    	b.over = function(v){
		    		if( v && !this.isOver ) this.addOutLine();
			        if( !v && this.isOver ) this.clearOutLine();
			        this.isOver = v;
		    	}.bind(b);

		    	b.select = function(v){ }.bind(b);

		    }

		    

		    // apply option
			this.set( o, b );

		}




		//---------------------------
		//  Breakable
		//---------------------------

    	if( o.breakable ){

    		

    		let old = b;
			let child = old.children[0];
			old.remove(child);
			b = child;
			b.position.copy(old.position);
			b.quaternion.copy(old.quaternion);

			b.name = name;
			b.type = this.type;
			//b.density = o.density;
			b.breakable = true;
			b.breakOption = o.breakOption !== undefined ? o.breakOption : [ 250, 1, 2, 1 ];
			//b.getVelocity = true;

			b.ignore = o.ignore || [];

			///

			b.size = o.size;
			b.shapetype = o.type;
			b.isKinematic = o.kinematic || false;
			b.link = 0;

			b.meshSize = o.meshSize ? o.meshSize : 1;

			b.velocity = new Vector3();
			b.angular = new Vector3();

			b.sleep = o.sleep || false;
			b.defMat = false;




			b.auto = o.auto || false;

		    if( !b.auto ) {
		    	b.matrixAutoUpdate = false;
			    b.updateMatrix();
			} else {
				b.matrixAutoUpdate = true;
			}
			
			//b.userData.mass = o.mass;
		}

		// for skeleton mesh

		/*if( o.bone ){

			b.userData.decal = o.decal;
            b.userData.decalinv = o.decalinv;
            b.userData.bone = o.bone;
		    

		    delete o.bone
		    delete o.decal
		    delete o.decalinv
		}*/

		//o.volume = this.tmpVolume

		//---------------------------
		//  Mass and Density
		//---------------------------

		b.mass = o.mass || 0;
		b.density = o.density || 0;

		if( b.density && !b.mass ) b.mass = MathTool.massFromDensity( b.density, volume );
		else if( b.mass && !b.density ){ 
			b.density = MathTool.densityFromMass( b.mass, volume );
			//  force density for engin don't have mass
			if( this.engine === 'RAPIER' || this.engine === 'OIMO' || this.engine === 'PHYSX') o.density = b.density;
		}


		if( o.massInfo ) console.log( '%c'+b.name+ ' %c' + 'density:' + b.density + ' mass:'+ b.mass, "font-size:16px", "font-size:12px" );


		if( o.getVelocity ) b.getVelocity = true;

		//---------------------------
		// add to three world
		//---------------------------

		this.addToWorld( b, o.id );

		if( o.onlyMakeMesh ) return b;

		if( o.phySize ) o.size = o.phySize;
		if( o.phyPos ) o.pos = o.phyPos;

		//---------------------------
		//  Clear uneed object value
		//---------------------------

		if( o.rot ) delete o.rot;
		if( o.mesh ) delete o.mesh;
	    if( o.meshRot ) delete o.meshRot;
	    if( o.instance ) delete o.instance;
	    if( o.material ) delete o.material;
		if( o.parent ) delete o.parent;


		if( o.solver && this.engine === 'PHYSX' ){
			// physx only have mass for solver bone
			o.mass = b.mass;
			// keep name reference of bones
			const solver = this.byName( o.solver );
			solver.addBone( o.name );

		}

		if(o.sleep) this.set(o, b);

	    //---------------------------
		// send to physic engine 
		//---------------------------

		this.motor.post( { m:'add', o:o } );

		if( o.breakable ){ 

			let breaker = this.motor.getBreaker();
			breaker.add( b );
			// only add contact for first breakable 
			//if( b.name.search('_debris_') === -1 ) this.motor.add({ type:'contact', name:'cc_'+b.name,  b1:b.name, callback: null })
		}

		//---------------------------
		// return three object3d
		//---------------------------

		return b;

	}

	dispatchEvent( name, type, data ){

		let body = this.byName( name );
		body.dispatchEvent( { type:type, data:data } );

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return;

		if( o.getVelocity !== undefined ) b.getVelocity = o.getVelocity;

		if( b.isInstance ){

			if( o.pos ) b.position.fromArray(o.pos);// = {x:o.pos[0], y:o.pos[1], z:o.pos[2]}
		    if( o.quat ) b.quaternion.fromArray(o.quat);// = {_x:o.quat[0], _y:o.quat[1], _z:o.quat[2], _w:o.quat[3]};
			if( o.pos || o.quat ) b.instance.setTransformAt( b.idx, b.position.toArray(), b.quaternion.toArray(), b.noScale ? [1,1,1] : b.size );

		}else {

			if( o.pos ) b.position.fromArray( o.pos );
		    if( o.quat ) b.quaternion.fromArray( o.quat );

		    b.auto = o.auto || false;

		    if( !b.auto ) {
		    	b.matrixAutoUpdate = false;
			    b.updateMatrix();
			} else {
				b.matrixAutoUpdate = true;
			}
		}

	}

	getTransform( b ){

		if( typeof b === 'string' ) b = this.byName( o.name );
		if( b === null ) return;

		b.updateWorldMatrix( true, false );

		const e = b.matrixWorld.elements;

		//let q = b.quaternion;
		return {
			position:b.position.clone(),
			up: _up.clone().set( e[ 4 ], e[ 5 ], e[ 6 ] ).normalize(),//.applyQuaternion( q ),
			right: _right.clone().set( e[ 0 ], e[ 1 ], e[ 2 ] ).normalize(),//.applyQuaternion( q ),
			forward: _forward.clone().set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize()//.applyQuaternion( q ),
		}

	}

	clearInstance( name ){

		let instance = this.motor.instanceMesh[name];
		let bodyList = instance.getBodyList();

		this.motor.remove( bodyList );
		instance.dispose();
		delete this.motor.instanceMesh[name];

	}

	getInstance ( o, material ) {

		if( this.motor.instanceMesh[o.instance] ) return this.motor.instanceMesh[o.instance];

		// Create new instance 

		o = {...o};

		if( o.sizeByInstance ) o.size = [1,1,1];
		let g = this.geometry( o );

		if( o.mesh ) {
			if( !o.material && o.mesh.material ) material = o.mesh.material;
			g = o.mesh.isObject3D ? o.mesh.geometry.clone() : o.mesh.clone();
			if( o.meshSize ) g.scale( o.meshSize, o.meshSize, o.meshSize );
			if( o.meshScale ) g.scale( o.meshScale[0], o.meshScale[1], o.meshScale[2] );
			g.noScale = true;
		}

		let bb = new Instance( g, material, 0 );

		bb.type = o.type;
		bb.noScale = g.noScale;

		if( bb.type === 'convex' ) bb.v = o.v;
		if( o.index ) bb.index = o.index;
		

		//if( bb.type==='convex' ) bb.v = MathTool.getVertex( bb.geometry )

    	//bb.matrixAutoUpdate = false
    	//bb.instanceMatrix.setUsage( DynamicDrawUsage )
    	bb.receiveShadow = o.shadow !== undefined ? o.shadow : true;
    	bb.castShadow = o.shadow !== undefined ? o.shadow : true;

    	if( this.motor.mouseActive ) bb.overMaterial = Mat$2.get( 'outline' );

    	bb.name = o.instance;
		this.motor.scene.add( bb );
		this.motor.instanceMesh[ o.instance ] = bb;

		//console.log('add instance')

    	return bb;

	}

	scaler ( o, s ) {

	    if(o.size) o.size = math.worldscale(o.size, s );//o.size = math.scaleArray( o.size, s );
	    if(o.pos) o.pos = math.worldscale(o.pos, s );//o.pos = math.scaleArray( o.pos, s );
	    if(o.type === 'convex') o.shapeScale = [s,s,s];
	    if(o.shapes){
	        let i = o.shapes.length, sh;
	        while(i--){
	            sh = o.shapes[i];
	            if(sh.size) sh.size = math.scaleArray( sh.size, s );
	            if(sh.pos) sh.pos = math.scaleArray( sh.pos, s );
	            if(sh.type === 'convex') sh.shapeScale = [s,s,s];
	        }
	    }
	    if(o.mesh) o.meshScale = [s,s,s];
	    return o;

	}

}

class AutoSvg extends Mesh {

	constructor ( model, option = {}, material = null  ) {

		super();

		this.model = model;

		this.material = material;
		this.outMaterial = material ? true : false;

		this.XML = new XMLSerializer();
		this.color = new Color();
		this.opacity = 1;
		this.svgLoader = new SVGLoader();
		this.base = "http://www.w3.org/2000/svg";
		this.svg = document.createElementNS( this.base, 'svg' );
		this.layerUp = 0.0001;
		this.fill = true;
		this.stroke = true;

		this.size = option.size || 1;
		this.scaler = 1/this.size;

		//let w = 10
		//this.set( { viewBox:'0 0 '+w+' '+w, width:w, height:w, preserveAspectRatio:'none' })

		if( !this.model ) return;

		let o = {
			radius: 5, 
			min:90, 
			max:90, 
			strokeSize:0.25,
			...option
		};

		switch( this.model ){

			case 'angle':
			this.fill = o.fill !== undefined ? o.fill : true;
	        this.stroke = o.stroke !== undefined ? o.stroke : true;
	        let min = Math.abs(o.min);
			this.add( 'path', { d: this.circle(0,0, o.radius, 180,180+o.max, true ), stroke:'none', fill:'#FF0000', 'fill-opacity':0.1 } );
			this.add( 'path', { d: this.circle(0,0, o.radius, 180,180+o.max, false, false, 0.3), stroke:'#FF0000', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'round' } );
			this.add( 'path', { d: this.circle(0,0, o.radius, 180-min,180, true ), stroke:'none', fill:'#0050FF', 'fill-opacity':0.1 } );
	        this.add( 'path', { d: this.circle(0,0, o.radius, 180-min,180, false, false, 0.3, true), stroke:'#0050FF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'round' } );
			break;

			case 'liner':
			let r = o.radius*0.5;
			let y1 = o.max*this.scaler;
			let y2 = o.min*this.scaler;
			this.fill = o.fill !== undefined ? o.fill : true;
	        this.stroke = o.stroke !== undefined ? o.stroke : true;
	        this.add( 'path', { d: this.segment({x:-r, y:0}, {x:r, y:0} ), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        this.add( 'path', { d: this.segment({x:-r, y:y1}, {x:r, y:y1} ), stroke:'#FF0000', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        this.add( 'path', { d: this.segment({x:-r, y:y2}, {x:r, y:y2} ), stroke:'#0050FF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        //
	        this.add( 'path', { d: this.segment({x:0, y:0}, {x:0, y:y1} ), stroke:'#FF0000', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        this.add( 'path', { d: this.segment({x:0, y:0}, {x:0, y:y2} ), stroke:'#0050FF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        break;

			case 'needle':
			this.fill = o.fill !== undefined ? o.fill : true;
	        this.stroke = o.stroke !== undefined ? o.stroke : true;
			this.add( 'path', { d: this.circle(0,0, 0.7, 0, 360, false, true, 0), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
			this.add( 'path', { d: this.segment({x:0, y:0}, {x:0, y:4.4} ), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'round' } );
			break;

			case 'middle':
			let mm = o.radius*0.5;
			this.fill = o.fill !== undefined ? o.fill : true;
	        this.stroke = o.stroke !== undefined ? o.stroke : true;
			this.add( 'path', { d: this.circle(0,0, 0.7, 0, 360, false, true, 0), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
			this.add( 'path', { d: this.segment({x:0, y:-mm}, {x:0, y:mm} ), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
			this.add( 'path', { d: this.segment({x:-mm, y:0}, {x:mm, y:0} ), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
			break;


		}

		this.toMesh();

	}

	raycast(){
		return false;
	}

	update( option = {} ){

		let o = {};

		switch( this.model ){

			case 'angle':

			o = {
				radius: 5,
				min:-90,
				max:90,
				...option
			};

			let min = Math.abs(o.min);

			this.change( 'd', this.circle(0,0, o.radius, 180,180+o.max, true ), 0 );
			this.change( 'd', this.circle(0,0, o.radius, 180,180+o.max, false, false, 0.3), 1 );

			this.change( 'd', this.circle(0,0, o.radius, 180-min,180, true ), 2 );
	        this.change( 'd', this.circle(0,0, o.radius, 180-min,180, false, false, 0.3, true), 3 );



			break;

		}

		if( option.wireframe !== undefined ) this.material.wireframe = option.wireframe;

		// redraw
	    this.fill = o.fill !== undefined ? o.fill : true;
	    this.stroke = o.stroke !== undefined ? o.stroke : true;
		this.toMesh();

	}

	// SVG SIDE

	set( o = {}, parent ){
		for( let t in o ){
            if( parent ) parent.setAttributeNS( null, t, o[ t ] );
            else this.svg.setAttributeNS( null, t, o[ t ] );
        }
	}

	add( type, o = {} ){

		let g = document.createElementNS( this.base, type );
		this.set( o, g );
		this.svg.appendChild( g );

	}

	change( type, value, id ){

		this.svg.childNodes[ id ].setAttributeNS( null, type, value );

	}

	getString(){
		return this.XML.serializeToString(this.svg);
	}

	polarToCartesian( x, y, radius, angleInDegrees ){
	    var rad = (angleInDegrees-90) * Math.PI / 180.0;
	    return { x: x + (radius * Math.cos(rad)), y: y + (radius * Math.sin(rad)) };
	}

	circle( x, y, radius, startAngle = 0, endAngle = 360, tri = false, close = false, endTag = 0, over=false ){

		if( startAngle === 0 && endAngle === 360 ){ startAngle = 0.0001; close = true; }
	    let start = this.polarToCartesian(x, y, radius, endAngle);
	    let end = this.polarToCartesian(x, y, radius, startAngle);
	    let arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
	    let d = [
	        "M", start.x, start.y, 
	        "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
	    ];
	    if( tri ) d.push(
	    	"L", x,y,
	    	"L", start.x, start.y
	    );
	    if( close ) d.push( 'Z');

		if( endTag!==0 ){
			let p1 = this.polarToCartesian(x, y, radius-endTag, over ? startAngle:endAngle);
			let p2 = this.polarToCartesian(x, y, radius+endTag, over ? startAngle:endAngle);
			d.push( 'M', p1.x, p1.y,"L", p2.x, p2.y);
		}

	    return d.join(" ");

	}

	segment( p1, p2 ){
		let d = [ 'M', p1.x, p1.y,"L", p2.x, p2.y ];
		return d.join(" ");
	}

	// THREE SIDE

	geomColor( g, color, opacity = 1 ){

		let i = g.attributes.position.count;
		let cc = [];//, aa = []
		while(i--){ 
			cc.push( color.r, color.g, color.b, opacity );
			//aa.push( opacity )
		}

		//g.setAttribute( 'opacity', new Float32BufferAttribute( aa, 1 ) );
		g.setAttribute( 'color', new Float32BufferAttribute( cc, 4 ) );

	}

	toGeometry(){

		if ( !this.fill && !this.stroke ) return null;

		let geom = [];
		let layer = 0;
		let opacity = 1;
		let data = this.svgLoader.parse( this.getString() );
		
		for ( const path of data.paths ) {

			// FILL
			const fillColor = path.userData.style.fill;
			if ( this.fill && fillColor !== undefined && fillColor !== 'none' ) {

				this.color.setStyle( fillColor );
				opacity = path.userData.style.fillOpacity;
				if( opacity < this.opacity ) this.opacity = opacity;

				const shapes = SVGLoader.createShapes( path );

				for ( const shape of shapes ) {

					const geometry = new ShapeGeometry( shape );
					if ( geometry ) {

						this.geomColor( geometry, this.color, opacity );

						let gg = new BufferGeometry().copy(geometry).toNonIndexed();
						gg.translate( 0, 0, -layer*this.layerUp );
						geom.push( gg );

						layer++;
					}

				}
			}

			// STROKE
			const strokeColor = path.userData.style.stroke;
			if ( this.stroke && strokeColor !== undefined && strokeColor !== 'none' ) {

				this.color.setStyle( strokeColor );
				opacity = path.userData.style.strokeOpacity;
				if( opacity < this.opacity ) this.opacity = opacity;

				for ( const subPath of path.subPaths ) {

					const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style, 6 );
					if ( geometry ) {
						this.geomColor( geometry, this.color, opacity );

						geometry.translate( 0, 0, -layer*this.layerUp );

						//console.log(geometry)
						geom.push( geometry );

						layer++;
					}
				}
			}

		}

		return geom;

	}

	toMesh(){

		let s = this.size;

		if( this.geometry ) this.geometry.dispose();
		
		let tmpG = this.toGeometry();
        
        if( tmpG ){
		    this.geometry = mergeGeometries( tmpG );
			this.geometry.scale( s, -s, s );
			this.geometry.rotateY( Math.PI );
			this.geometry.rotateZ( -Math.PI*0.5 );
			this.geometry.rotateY( Math.PI*0.5 );
			this.geometry.computeBoundingSphere();
		} else {
			this.geometry = new BufferGeometry();
		}

		if( this.material === null ){ 
			this.material = new MeshBasicMaterial({ vertexColors:true, transparent:this.opacity!==1, side:DoubleSide });
			this.material.defines = { 'USE_COLOR_ALPHA': '' };
		}

	}

	dispose(){
		
		if( this.material && !this.outMaterial ) this.material.dispose();
		if( this.geometry ) this.geometry.dispose();
	}

}

class JointDebug extends Object3D {

	constructor( o = {}, motor ) {

	    super();

	    this.motor = motor;

	    this.isJoint = true;

	    this.type = 'joint';
	    this.mode = o.mode || 'hinge';
	    this.visible = o.visible !== undefined ? o.visible : false;
	    
	    this.mtx = new Matrix4();
	    this.size = o.helperSize || 0.1;

	    this.matrixAutoUpdate = false;

	    let material = this.motor.mat.get('line');
	    let mat, dt;

	    switch( this.mode ){
	    	case 'prismatic':
	    	    mat = this.motor.mat.get('svg');
		    	dt = {
					min:-180,
					max:180,
					fill:false,
					stroke:true,
					wireframe:false,
					size:this.size*0.5
				};

				if(o.lm){
					dt.min = o.lm[0];
					dt.max = o.lm[1];
				}
				this.m1 = new AutoSvg('liner', dt, mat );
		    	this.m2 = new AutoSvg('middle', dt, mat );

		    	this.m1.geometry.rotateY(90 * MathTool.torad);

		    	//this.m3 = this.m1.clone()
		    	//this.m3.rotation.x = 90 * MathTool.torad

		    	this.add( this.m1 );
		    	this.add( this.m2 );
		    	//this.add( this.m3 );

	    	break;
	    	case 'hinge': case 'cylindrical':

		    	mat = this.motor.mat.get('svg');
		    	dt = {
					min:-180,
					max:180,
					fill:false,
					stroke:true,
					wireframe:false,
					size:this.size*0.5
				};

				if(o.lm){
					dt.min = o.lm[0];
					dt.max = o.lm[1];
				}

				if(o.lmr){ // cylindrical
					dt.min = o.lmr[0];
					dt.max = o.lmr[1];
				}

		    	this.m1 = new AutoSvg('angle', dt, mat );
		    	this.m2 = new AutoSvg('needle', dt, mat );

		    	this.add( this.m1 );
		    	this.add( this.m2 );

	    	break;
	    	default:

		    	const geom = this.motor.geo.get('joint');
			    let g = geom.clone(); 
			    g.scale( this.size, this.size, this.size);
			    this.m1 = new LineSegments( g, material );
			    
			    
			    this.add( this.m1 );

			    g = geom.clone(); 
			    g.scale( this.size*0.8, this.size*0.8, this.size*0.8 );
			    this.m2 = new LineSegments( g, material );
			    //this.m2.scale.set( this.size, this.size, this.size)
			    this.add( this.m2 );
		    
	    	break;
	    }


	    this.m1.matrixAutoUpdate = false;
	    this.m2.matrixAutoUpdate = false;

		//    this.m2.updateMatrix()
		//    this.m1.updateMatrix()




	    this.body1 = null;
	    this.body2 = null;

	    this.mat1 = new Matrix4();
	    this.mat2 = new Matrix4();
	    this.end = new Vector3();

	    // experimental rotation ?
	    //Utils.refAxis( this.mat1, o.axis1 )
	    //Utils.refAxis( this.mat2, o.axis2 )

	    let qq = new Quaternion$1();
	    if(o.quat1) this.mat1.makeRotationFromQuaternion(qq.fromArray(o.quat1));
	    if(o.quat2) this.mat2.makeRotationFromQuaternion(qq.fromArray(o.quat2));

	    this.mat1.setPosition( o.pos1[0], o.pos1[1], o.pos1[2] );
	    this.mat2.setPosition( o.pos2[0], o.pos2[1], o.pos2[2] );
	    
	    
	    const positions = [ 0, 0, 0, 0, 0, 0 ];
	    const colors = [ 1, 0, 0, 1, 0, 0 ];
	    const gline = new BufferGeometry();
	    gline.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    gline.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    gline.computeBoundingSphere();


	    this.m3 = new LineSegments( gline, material );
	    this.add( this.m3 );
	    this.m3.matrixAutoUpdate = false;

	    this.pp = this.m3.geometry.attributes.position;

	}

	update () {

		if( !this.visible ) return

		if( this.body1 ){
			this.matrix.copy( this.body1.matrixWorld ).multiply( this.mat1 );
		} else {
			this.matrix.copy( this.mat1 );
		}

		if( this.body2 ){
			this.m2.matrix.copy( this.body2.matrixWorld ).multiply( this.mat2 );
		} else {
			this.m2.matrix.copy( this.mat2 );
		}

		this.m2.matrix.premultiply(this.matrix.clone().invert());
		this.end.setFromMatrixPosition( this.m2.matrix );

		this.pp.setXYZ(1, this.end.x, this.end.y, this.end.z);
		this.pp.needsUpdate = true;

		if( this.mode === 'cylindrical' ){ 
			this.m1.position.copy( this.end );
			this.m1.updateMatrix();
		}

		//if( !this.visible ) this.visible = true;

	}

	updateFromPhy ( r, n = 0 ) {

		//if( !this.isVisible ) return
		if( !this.visible ) return

		//m.matrix = b.matrixWorld;
        //m.matrixAutoUpdate = false;

		this.position.fromArray( r, n );
		this.quaternion.fromArray( r, n + 3 );

		this.updateMatrix();

		this.m2.position.fromArray( r, n+7 );
		this.m2.quaternion.fromArray( r, n+10 );
		this.m2.matrix.compose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );

		this.mtx.copy( this.matrix ).invert().multiply( this.m2.matrix );
		this.mtx.decompose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );
		this.m2.updateMatrix();


		this.pp.setXYZ(1, this.m2.position.x, this.m2.position.y, this.m2.position.z);
		this.pp.needsUpdate = true;

		if( this.mode === 'cylindrical' ){ 
			this.m1.position.copy( this.m2.position );
			this.m1.updateMatrix();
		}

		//if( !this.visible ) this.visible = true;

	}

	dispose (){

		if( this.body1 ) this.body1.link--;
		if( this.body2 ) this.body2.link--;

		this.m1.geometry.dispose();
		this.m2.geometry.dispose();
		this.m3.geometry.dispose();
		this.children = [];

	}

}

//----------------
//  MOTOR JOINT 
//----------------

class Joint extends Item {

	constructor ( motor ) {

		super();

		this.motor = motor;
		this.engine = this.motor.engine;
		this.Utils = this.motor.utils;

		this.type = 'joint';

		this.v1 = new Vector3();
		this.v2 = new Vector3();

	}

	step (AR, N) {

		let i = this.list.length, j, n;
		
		while( i-- ){

			j = this.list[i];
			n = N + ( i * Num.joint );
			if( Num.joint === 16 ) j.updateFromPhy( AR, n );
			else j.update();

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );

		let body1 = null;
		let body2 = null;
		let isString;

		let isWorldAxis = false;

		if( !o.axis1 ) o.axis1 = [1,0,0];
		if( !o.axis2 ) o.axis2 = [1,0,0];

		if( !o.pos1 ) o.pos1 = [0,0,0];
		if( !o.pos2 ) o.pos2 = [0,0,0];

		if( o.limit ) o.lm = o.limit;
		else if( o.lm ) o.limit = o.lm;

		// STRICT MODE

		if(o.mode==='universal'||o.mode==='dof'||o.mode==='d6') o.mode = 'generic';
		if(o.mode==='revolute') o.mode = 'hinge';
		if(o.mode==='slider') o.mode = 'cylindrical';

		// GET BODY REFERENCY

		if( o.b1 ) {
			isString = typeof o.b1 === 'string';
			body1 = isString ? this.Utils.byName( o.b1 ) : o.b1;
			if( !isString ) o.b1 = o.b1.name;
			if( body1 ) body1.link ++;
		}

		if( o.b2 ) {
			isString = typeof o.b2 === 'string';
			body2 = isString ? this.Utils.byName( o.b2 ) : o.b2;
			if( !isString ) o.b2 = o.b2.name;
			if( body2 ) body2.link ++;
		}

		// world to local
		if ( o.worldPos ) o.worldAnchor = o.worldPos;
		if ( o.worldAnchor ){

			o.pos1 = body1 ? this.Utils.toLocal( this.v1.fromArray( o.worldAnchor ), body1 ).toArray() : o.worldAnchor;
			o.pos2 = body2 ? this.Utils.toLocal( this.v2.fromArray( o.worldAnchor ), body2 ).toArray() : o.worldAnchor;
			/*if(body1){ 
				this.v1 = body1.worldToLocal(this.v2.fromArray( o.worldAnchor ));
				o.pos1 = this.v1.toArray();
			}
			if(body2){ 
				this.v1 = body2.worldToLocal(this.v2.fromArray( o.worldAnchor ));
				o.pos2 = this.v1.toArray();
			}*/
			delete o.worldAnchor;
		}

		if ( o.worldAxis ){

			
			/*if( this.engine === 'JOLT'){
				o.axis1 = o.worldAxis;
				o.axis2 = o.worldAxis;
			}else{*/
				o.axis1 = body1 ? this.Utils.toLocal( this.v1.fromArray( o.worldAxis ), body1, true ).toArray() : o.worldAxis;
			    o.axis2 = body2 ? this.Utils.toLocal( this.v2.fromArray( o.worldAxis ), body2, true ).toArray() : o.worldAxis;
			//}
			
			//o.quat1 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		    //o.quat2 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

			//console.log(o.worldAxis, o.axis1, o.axis2)
			isWorldAxis = true;

			delete o.worldAxis;

		}

		if ( o.worldQuat ){

			o.quat1 = this.Utils.quatLocal(o.worldQuat, body1);
			o.quat2 = this.Utils.quatLocal(o.worldQuat, body2);



			if( this.engine === 'OIMO' || this.engine === 'HAVOK' || this.engine === 'JOLT' ){

				//this.v1.fromArray( math.quadToAxisArray( o.worldQuat ) ).normalize()
				//this.v2.fromArray( math.quadToAxisArray( o.worldQuat ) ).normalize()

				//o.axis1 = Utils.axisLocal( math.quadToAxisArray( o.worldQuat ), body1)//this.v1.fromArray( math.quadToAxisArray( o.quat1 ) ).normalize().toArray()
				//o.axis2 = Utils.axisLocal( math.quadToAxisArray( o.worldQuat ), body2)//this.v2.fromArray( math.quadToAxisArray( o.quat2 ) ).normalize().toArray()

				o.axis1 = this.Utils.axisLocal( MathTool.quatToAxis( o.worldQuat ), body1);
				o.axis2 = this.Utils.axisLocal( MathTool.quatToAxis( o.worldQuat ), body2);

				//o.axis1 = body1 ? Utils.toLocal( this.v1, body1, true ).toArray():[1,0,0]
				//o.axis2 = body2 ? Utils.toLocal( this.v2, body2, true ).toArray():[1,0,0]

			}
			/*this.v1.fromArray( o.worldAxis ) 
			this.v2.fromArray( o.worldAxis )

			o.axis1 = body1 ? Utils.toLocal( this.v1, body1, true ).normalize().toArray():o.worldAxis
			o.axis2 = body2 ? Utils.toLocal( this.v2, body2, true ).normalize().toArray():o.worldAxis
*/
			//o.quat1 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		    //o.quat2 = new Quaternion().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

			//console.log(o.worldQuat, o.quat1, o.quat2)

			delete o.worldQuat;

		}

		

		

		/*if( o.b2 ) body2 = typeof o.b2 !== 'string' ? o.b2 : Utils.byName(o.b2)
		if( o.b1 && typeof o.b1 !== 'string') o.b1 = o.b1.name;
		if( o.b2 && typeof o.b2 !== 'string') o.b2 = o.b2.name;*/

		if( o.rot1 !== undefined ){ o.quat1 = MathTool.quatFromEuler( o.rot1 ); delete ( o.rot1 ); }
		if( o.rot2 !== undefined ){ o.quat2 = MathTool.quatFromEuler( o.rot2 ); delete ( o.rot2 ); }

		if( !o.quat1 ) o.quat1 = new Quaternion$1().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis1).normalize() ).toArray();
		if( !o.quat2 ) o.quat2 = new Quaternion$1().setFromUnitVectors( new Vector3(1, 0, 0), new Vector3().fromArray(o.axis2).normalize() ).toArray();

		if( this.engine === 'AMMO' && isWorldAxis && o.mode === 'hinge') {
			let ee = new Euler(0, -90*torad$3, 0);
			let qq = new Quaternion$1().setFromEuler(ee).toArray();
			o.quatX = qq;
			//o.quat1 = MathTool.quatMultiply(o.quat1, qq);
			//o.quat2 = MathTool.quatMultiply(o.quat2, qq);
		}

		if( o.drivePosition ) if( o.drivePosition.rot !== undefined ){ o.drivePosition.quat = MathTool.quatFromEuler( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }

		let j = new JointDebug( o, this.motor );
		j.name = name;
		j.body1 = body1;
		j.body2 = body2;
		
		if( o.visible === undefined ) o.visible = this.motor.jointVisible || false;

		// apply option
		this.set( o, j );

		// add to world
		this.addToWorld( j, o.id );

		// add to worker 
		this.motor.post( { m:'add', o:o } );

		return j;

	}

	set ( o = {}, j = null ) {

		if( j === null ) j = this.byName( o.name );
		if( j === null ) return;
		if( o.visible !== undefined ) j.visible = o.visible;

	}

}

class Contact extends Item {

	constructor ( motor ) {

		super();

		this.motor = motor;
		this.Utils = this.motor.utils;

		this.type = 'contact';

	}

	step (AR, N) {

		let i = this.list.length, c, n;
		
		while( i-- ){

			c = this.list[i];

			n = N + ( i * Num.contact );

			//c.update( AR.slice( n, n+8 ) )
			c.update( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o );

		let c = new Pair( o );

		if( o.callback ) delete ( o.callback );

		// add to world
		this.addToWorld( c, o.id );

		// add to worker 
		this.motor.post( { m:'add', o:o } );

		return c;

	}


}


class Pair {

	constructor ( o = {} ) {

		this.type = 'contact';

		this.name = o.name;
		this.callback = o.callback || function(){};

		//console.log(this.name)

		this.b1 = o.b1 || null;
		this.b2 = o.b2 || null;
		this.ignore = o.ignore || [];

		this.always = o.always !== undefined ? o.always : true;
		//this.simple = o.simple || false

		this.data = {

			hit:false,
			point: [0,0,0],
			normal: [0,0,0],
			//object: null,
		};

	}

	detectBody(){
		//this.dispatchEvent( { type: 'ready', message: 'ready to create plant' } );

	}

	update ( r, n = 0 ) {

		this.data.hit = r[n] > 0 ? true : false;

		if( !this.simple ){

			this.data.point = [ r[n+1], r[n+2], r[n+3] ];
			this.data.normal = [ r[n+4], r[n+5], r[n+6] ];

		}
		
		if( this.data.hit || this.always ) this.callback( this.data );

	}


}

let Mat$1 = null;

// THREE VEHICLE

class Vehicle extends Item {

	constructor ( motor ) {

		super();

		this.motor = motor;
		this.engine = this.motor.engine;
		this.Utils = this.motor.utils;

		this.motor.geo;
		Mat$1 = this.motor.mat;

		this.type = 'vehicle';
		this.num = Num[this.type];

	}

	step (AR, N) {

		let i = this.list.length, n, s;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * this.num );
			s.step( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o );
        const car = new Car( o, this.motor );

        // add to world
		this.addToWorld( car, o.id );

        // add to physics
        this.motor.post({ m:'add', o:car.o });

        return car

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return

	}

}



// CAR

class Car extends Object3D {//extends Object3D {

	constructor( o, motor ) {

		super();

		this.motor = motor;
		this.Utils = this.motor.utils;

		this.velocity = new Vector3();
		this.angular = new Vector3();

		// extra function // ex car selection
		if(o.extra){
			this.extra = o.extra;
			delete o.extra;
		}

		this.type = 'vehicle';
		this.name = o.name || 'car';
		this.isRay = o.ray || false;
		//this.withBody = false;
		this.actif = false;
		//this.position = new THREE.Vector3();
		this.steering = 0;
		this.suspension = [];
		this.rolling = [];
		this.init( o );

	}

	drive () {

	}

	raycast(){
		return
	}

	init ( o ) {

		this.mass = o.mass || 2000;

		this.model = null;

		//this.decal = o.bodyDecalY || 0;
		//this.circum = (Math.PI * 2 * o.radius);// in metter

        // CHASSIS
		this.size = o.size || [0.85*2, 0.5*2, 2.5*2];
		this.massCenter = o.massCenter || [0, 0.55, 1.594];
		this.chassisPos = o.chassisPos || [0, 0.83, 0];

		this.maxSteering = o.maxSteering || 24;
		this.incSteering = o.incSteering || 2;

		this.s_travel = o.s_travel || 0.4;
		this.s_ratio = 1 / ( this.s_travel * 0.5 );
		this.decaly = this.engine === 'PHYSX' ? this.s_travel * 0.5 : 0;


		//this.diff = math.vecSub( this.chassisPos, this.massCenter )
		//this.diff[2] = 0

		// WHEELS
		this.numWheel = o.numWheel || 4;
		this.radius = o.radius || 0.35;
		this.radiusBack = o.radiusBack || this.radius;
		this.deep = o.deep || 0.3;
		this.deepBack = o.deepBack || this.deep;

		let byAxe = this.numWheel < 4 ? 1 : 2;

		if(!o.wPos) o.wPos = [0.8, 0.1, 1.4];

		if( o.wPos ){

			this.wPos = o.wPos;

			var p, wp = o.wPos, axe, pp = [], s=1, back=0, y, x, z, pzz;
			wp.length === 3 ? true : false;
			wp.length === 4 ? true : false;

			for( let i=0; i < this.numWheel; i++ ){

				s = i%2 === 0 ? -1 : 1;
				axe = Math.floor(i * 0.5);
				back = i >= byAxe ? true: false;
				
				y = wp[ 1 ];
				if( y===0 ) y = back ? this.radiusBack : this.radius;

				x = wp[ 0 ];
				//if( x === 0 ) x = (back ? this.deepBack : this.deep)*0.5
				if( x instanceof Array ) x = wp[0][axe];

				z = back ? -wp[2] : wp[2];
			    if( wp[2] instanceof Array ) z = wp[2][axe];

			    	


				p = [ x * s, y, z ];

				pp.push( p );

			}

			//console.log(this.name, pp)

			this.wheelsPosition = pp;
			delete o.wPos;

		}

		if( o.wheelsPosition ) this.wheelsPosition = o.wheelsPosition;

		//console.log(this.wheelsPosition)

		const scale = o.meshScale || 1;


		const chassisShapes = [];// { type:'convex', shape:bodyShape, pos:[0,0,0], flag:8|2|1 } ];//, isExclusive:true

		//if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, pos:[0,0,0], flag:8|2|1 } );
		//else chassisShapes.push( { type:'box', size:this.size, pos:[0,0,0], flag:8|2|1 } );

		if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, size:[scale], pos:this.chassisPos, filter:[1, -1, 0, 0], isExclusive:true, ray:this.isRay  } );
		else chassisShapes.push( { type:'box', size:this.size, pos:this.chassisPos } ); 

		for( let i=0; i < this.numWheel; i++ ){
	    	if( i < byAxe ) chassisShapes.push({ type:'cylinder', size:[ this.radius, this.deep ], isWheel:true, radius:o.rad || 0.05 , shadow:false, ray:false });
	    	else chassisShapes.push({ type:'cylinder', size:[ this.radiusBack, this.deepBack ], isWheel:true, radius:o.rad || 0.05 , shadow:false, ray:false  });
	    	
	    }

	    /*for( var i=0; i < o.numWheel; i++ ){

	    	if( this.radiusBack !== this.radius ){
	    		if(i<2) chassisShapes.push( { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    		else chassisShapes.push(  { type:'convex', shape:wheelShapeBack, pos:[0,0,0] } );
	    	} else {
	    		chassisShapes.push(  { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    	}

	    }*/

	    var material = Mat$1.get( o.debug ? 'debug' : (o.chassisMesh === undefined ? 'body' : 'hide'));
	    //if( o.body === undefined ) material = 'move';

	    let n;

	    for ( let i = 0; i < chassisShapes.length; i ++ ) {
	    	n = chassisShapes[i];
	    	if( n.pos ) n.localPos = n.pos;
	    	n.size = MathTool.autoSize( n.size, n.type );
	    	this.motor.getGeometryRef(n, this, material);
	    }

	    //if( o.chassisShape ) console.log(  )


		let m;

		if(o.chassisMesh){
			m = o.noClone ? o.chassisMesh : o.chassisMesh.clone();
			m.position.set( 0, 0, 0 );
			this.Utils.noRay( m );
			m.scale.set( scale, scale, scale );
			this.children[0].add( m );
			this.model = m;
			delete o.chassisMesh;

			//this.chassis.children[0].castShadow = false;
			//this.chassis.children[0].receiveShadow = false;
		}


		//let back = false, 

		// wheel model
		if( o.wheelMesh ){
			
			
			for( let i = 1; i<this.numWheel+1; i++ ) {
				back = i >= byAxe+1;
				if( o.wheelMeshBack ) m = back ? o.wheelMeshBack.clone() : o.wheelMesh.clone();
				else m = o.wheelMesh.clone();
				this.Utils.noRay( m );
				m.position.set( 0, 0, 0 );
				if(i==2 || i ==4) m.scale.set( -scale, scale, scale );
				else m.scale.set( scale, scale, scale );
				this.children[i].add( m );

			    //this.chassis.children[i].castShadow = false;
			    //this.chassis.children[i].receiveShadow = false;
			}
			delete o.wheelMesh;
		}

		

		// suspension model
		if( o.suspensionMesh ){

			this.suspensionMesh = [];

			for( let i = 1; i<this.numWheel+1; i++ ) {

				m = o.suspensionMesh.clone();
				this.Utils.noRay( m );
				m.position.set( 0, 0, 0 );
				m.position.fromArray(this.wheelsPosition[i-1]);
				m.position.x = 0;
				if(i==2 || i ==4) m.scale.set( scale, scale, scale );
				else m.scale.set( -scale, scale, scale );
				this.children[0].add( m );
			    this.suspensionMesh.push( m );

			}
			delete o.suspensionMesh;

		}

		// suspension model
		if( o.brakeMesh ){

			this.brake = [];

			for( let i = 1; i<this.numWheel+1; i++ ) {
				back = i > 2;
				if( o.brakeMeshBack ) m = back ? o.brakeMeshBack.clone() : o.brakeMesh.clone();
				else m = o.brakeMesh.clone();
				this.Utils.noRay( m );
				m.position.set( 0, 0, 0 );
				m.position.fromArray(this.wheelsPosition[i-1]);
				if( o.brakeMeshBack ) pzz = scale;
				else pzz = back ? scale : -scale;
				if(i==2 || i ==4) m.scale.set( -scale, scale, pzz );
				else m.scale.set( scale, scale, pzz );
				this.children[0].add( m );
			    this.brake.push( m );

			}
			delete o.brakeMesh;

		}

		o.mass = this.mass;

		o.size = o.chassisShape ? chassisShapes[0].boxSize : this.size;
		o.numWheel = this.numWheel;
		o.wheelsPosition = this.wheelsPosition;
		o.radius = this.radius;
		o.radiusBack = this.radiusBack;
		o.deep = this.deep;
		o.deepBack = this.deepBack;

		o.chassisShape = chassisShapes[0];

		o.maxSteering = this.maxSteering;
		o.incSteering = this.incSteering;
		o.s_travel = this.s_travel;

		o.massCenter = this.massCenter;
		o.chassisPos = this.chassisPos;

		this.o = o;

	}

	set ( o ) {
		o.name = this.name;
		this.motor.change( o );
	}

	respawn ( o ) {

		//{ pos:[0,0,0], rot:[0,0,0], keepVelocity:false }

		o = o || {};
		o.respawn = true;
		o.name = this.name;

		if( o.keepRotation ) o.quat = this.quaternion.toArray();


		this.motor.change( o );

	}

	move(){

		/*phy.update({ 
		    name:this.name,
		    key: key
		});*/
	}

	dispose (){

		/*if(this.withBody){
			root.content.remove( this.body );
		}*/

		//root.remove( this.name + '_chassis' );
	}

	step ( AR, n ) {

		if( !this.actif ){
			let a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7];
			if( a===0 ) return;
			else this.actif = true;
		}

		

		this.position.fromArray( AR, n + 1 );
		this.quaternion.fromArray( AR, n + 4 );
		this.updateMatrix();

		let num = this.numWheel+1;
		let mesh;
		let s1 = 0, s2 = 0;
		let sp = [];
		let k = 0;

		for( let i = 0; i<num; i++ ){

			k = (i*8) + n;

			if(i===0) ( ( AR[ k ] ) / this.circum );
			if(i===1) s1 = AR[ k ];
			if(i===2) s2 = AR[ k ]; 
			
			mesh = this.children[i];
			

			if( mesh && i>0 ){

				//sp[i-1] = this.wheelsPosition[i-1][1] - AR[k+2]
				sp[i-1] = (this.wheelsPosition[i-1][1] - this.decaly ) - AR[k+2];

				// local
				
				mesh.position.fromArray( AR, k + 1 );
				//mesh.position.y += this.massCenter[1]
				mesh.quaternion.fromArray( AR, k + 4 );

				this.rolling[i-1] = mesh.rotation.x;

				if(this.brake){
					this.brake[i-1].position.copy( mesh.position );
					if(i==1 || i==2) this.brake[i-1].rotation.y = AR[k];
				}

			}

		}

		
		k = 4;
		while(k--){

			this.suspension[k] = MathTool.clamp( sp[k]*this.s_ratio, -1, 1 );
			
			if(this.suspensionMesh ){
				if ( this.suspension[k] > 0 ) {
					this.Utils.morph( this.suspensionMesh[k].children[0], 'low', this.suspension[k] );
					this.Utils.morph( this.suspensionMesh[k].children[0], 'top', 0 );
				} else {
					this.Utils.morph( this.suspensionMesh[k].children[0], 'low', 0 );
					this.Utils.morph( this.suspensionMesh[k].children[0], 'top', -this.suspension[k] );
				}
			}

		} 

		this.steering = Math.round(((s1+s2)*0.5)*todeg$1) / this.maxSteering;
		
		//console.log(this.steering)
		//console.log(acc)

	}
}

const _endMatrix = /*@__PURE__*/ new Matrix4();
const _p = /*@__PURE__*/ new Vector3();
const _q = /*@__PURE__*/ new Quaternion$1();
const _s = /*@__PURE__*/ new Vector3();


const _matrixWorldInv = /*@__PURE__*/ new Matrix4();
const _boneMatrix = /*@__PURE__*/ new Matrix4();
const Spine = [ 'hip', 'abdomen', 'chest', 'neck', 'head', 'rCollar', 'lCollar', 'lShldr', 'rShldr', 'lThigh', 'rThigh', 'rBreast', 'lBreast' ];

class SkeletonBody extends Object3D {

	constructor ( motor, name, model, bones, mass = null, option = {} ) {

		super();

        this.motor = motor;

		this.prefix = name || 'yoo_';

        this.mode = 'follow';

        this.withFinger = false;

        this.nodes = [];
		this.bones = bones;//character.model.skeleton.bones;
		this.model = model;//character.model.root;
       
        this.scaler = this.model.scale.x; 
        this.posRef = {};
        this.quatRef = {};

        this.useSolver = false; 
        if( this.motor.engine !== 'PHYSX' ) this.useSolver = false;

        this.nameList = [];
        this.jointList = [];

        this.breast = false;
        this.ready = false;

        this.matrixAutoUpdate = false;

        this.mass = mass; 
        this.friction = 0.5; 
        this.restitution = 0;
        this.option = option;
        this.useDrive = option.useDrive !== undefined ?  option.useDrive : true;
        this.showJoint = option.showJoint !== undefined ?  option.showJoint : false;

		this.init();

	}

    setMass( mass ){

        if( mass === this.mass ) return
        this.mass = mass;
        const d = [];
        let i = this.nodes.length;
        let m = this.mass/i;
        while( i-- ) d.push( { name:this.nodes[i].name, mass:m } );
        this.motor.change( d );

    }

    setMode( mode ){

        if( mode === this.mode ) return

        this.mode = mode;
        const data = [];

        let kinematic = this.mode === 'follow';

        let i = this.nodes.length, node;

        while( i-- ){

            node = this.nodes[i];
            data.push( { name:node.name, kinematic:kinematic } );
            node.kinematic = kinematic;
            node.bone.isPhysics = !kinematic;
            
        }

        this.motor.change( data );

    }

    freeBone( node ){

        if(!node.kinematic) return
        node.cc++;
        if(node.cc=== 20 ){
            node.cc = 0;
            node.kinematic = false;
            node.bone.isPhysics = true;
            this.motor.change( { name : node.name, kinematic:false } );
        }
        
    }

    isVisible( v ){

        //let i = this.nodes.length, node
        //while( i-- ) Utils.byName( this.nodes[i].name ).visible = v

        let i = this.nameList.length;
        while( i-- ) this.motor.byName( this.nameList[i] ).visible = v;
        /*let data = []
        i = this.jointList.length;
        while( i-- ) data.push( { name:this.jointList[i], visible:v } );
        root.motor.change( data );*/

    }


	init(){

        if( this.useSolver ) this.solver = this.motor.add({ 
            type:'solver', name:this.prefix+'_solver', iteration:32,
            fix:true, needData:true
        });

        this.useAggregate = this.motor.engine === 'PHYSX';// && this.option.useAggregate

		const data = [];
        
       

        // get character bones var bones = character.skeleton.bones;

        let scaleMatrix = new Matrix4().makeScale(this.scaler, this.scaler, this.scaler);
        

        let p = new Vector3();
        let s = new Vector3();
        let q = new Quaternion$1();
        let e = new Euler();
        let mtx = new Matrix4();

        let tmpMtx = new Matrix4();
        let tmpMtxR = new Matrix4();

        //this.model.updateWorldMatrix( true, false );
        _matrixWorldInv.copy( this.model.matrixWorld ).invert();

        let p1 = new Vector3();
        let p2 = new Vector3();

        let sizer  =  [1,1,1,1,1,1,1];
        if(this.option.sizer){
            sizer = this.option.sizer;
        }

        //let headDone = false

        let i, lng = this.bones.length, name, n, bone, parent;///, child, o, parentName;
        let size, dist, rot, type, kinematic, translate, phyName, motion;

        let averageMass = 0;
        if(this.mass) averageMass = this.mass / lng;

        for( i = 0; i < lng; i++ ){

        	type = null;
            bone = this.bones[i];
            name = bone.name;
            parent = bone.parent;

            if( parent ) {

            	n = parent.name;

                _boneMatrix.multiplyMatrices( _matrixWorldInv, bone.matrixWorld );
                p1.setFromMatrixPosition( _boneMatrix );

                _boneMatrix.multiplyMatrices( _matrixWorldInv, parent.matrixWorld );
                p2.setFromMatrixPosition( _boneMatrix );


            	//p1.setFromMatrixPosition( parent.matrixWorld );
            	//p2.setFromMatrixPosition( bone.matrixWorld );
                dist = p1.distanceTo( p2 );// * this.scaler;

                //if( n==='hip' && name==='abdomen' ) console.log( dist )

	            //translate = [ -dist * 0.5, 0, 0 ];
	            translate = [ 0, 0, dist * 0.5 ];
                size = [ dist, 1, 1 ];
                rot = null;//[0,0,0];
                kinematic = true;
                motion = false;

                //type = 'capsule'
                

                //if( n==='hip' && name==='abdomen' ){ type = 'capsule'; size = [  0.1,dist*1.8 ]; translate = [ 0, 0, -(dist*1.8) * 0.5 ]; rot = [0,0,90]; link='null';}
                
                // body
                //if( n==='hip' && name==='abdomen' ){ type = 'capsule'; size = [  0.1,dist*1.8 ]; translate = [ 0, 0, -(dist*1.8) * 0.5 ]; rot = [0,0,90]; link='null';}
                
                //if( n==='hip' && name==='abdomen' ){ type = 'capsule'; size = [  dist*1.8, 0.08 ]; translate = [ 0, 0, -dist * 0.5 ]; rot = [0,0,90]; link='null';}
                if( n==='hip' && name==='abdomen' ){ type = 'capsule'; size = [  dist*sizer[0], 0.08 ]; translate = [ 0, 0, -dist*sizer[0] ]; rot = [0,0,90];}
                if( n==='abdomen' && name==='chest'  ){ type = 'capsule'; size = [ dist*0.7*sizer[1], 0.08   ]; translate = [ 0, 0, (-dist * 0.5)-0.06 ]; rot = [90,0,0];}
                if( n==='chest' && name==='neck' ){ type = 'capsule'; size = [  dist*0.4*sizer[2], 0.04 ]; translate = [ 0, 0, (-dist * 0.5)-0.02 ]; rot = [0,0,90];}
                if( n==='neck' && name === 'head' ){ type = 'capsule'; size = [ 0.06*sizer[3], dist ]; translate = [ 0, 0, -dist * 0.5 ]; rot = [90,0,0]; }
                if( n==='head' && name === 'End_head' ){ type = 'capsule'; size = [ 0.1*sizer[4], dist-0.17 ]; translate = [ 0, 0.02, (-dist * 0.5)+0.02 ]; rot = [90,0,0]; }
                
                //if( n==='head' && !headDone ){ console.log(name); headDone = true; type = 'sphere'; dist=0.08; size = [ 0.08, 0.2, dist ]; translate = [ 0, 0.025, -0.08 ]; }
	            //if( n==='chest' && name==='neck' ){ type = 'box'; size = [  0.28, 0.24, dist ]; translate = [ 0, 0, -dist * 0.5 ]; }
	            //if( n==='abdomen' && name==='chest'  ){ type = 'box'; size = [ 0.24, 0.20,  dist ]; translate = [ 0, 0, -dist * 0.5 ]; }
              
                


                if( n==='chest' && name==='rBreast' && this.motor.engine!=='HAVOK' ){ n='rBreast'; parent = bone; type = 'sphere'; size = [ 0.065 ]; translate = [ 0.065,0,0 ]; this.breast=true; motion = true; }
                if( n==='chest' && name==='lBreast' && this.motor.engine!=='HAVOK' ){ n='lBreast'; parent = bone; type = 'sphere'; size = [ 0.065 ]; translate = [ 0.065,0,0 ]; this.breast=true; motion = true; }
                

                // arm

                let r = 0.04*sizer[5];
                let w = dist-r;

                if( n==='lCollar' && name==='lShldr'){ type = 'capsule'; size = [  r, dist*0.3 ]; translate = [dist*0.6 , 0, 0 ]; rot = [0,0,90]; }
                if( n==='lShldr' && name==='lForeArm'){ type = 'capsule'; size = [  r, w ]; translate = [w * 0.5, 0, 0 ]; rot = [0,0,90]; }
                if( n==='lForeArm' && name==='lHand'){ type = 'capsule'; size = [ r, w ]; translate = [w * 0.5, 0, 0 ]; rot = [0,0,90]; }
                if( n==='lHand' && name==='lMid1'){ type = 'box'; size = [ dist*2, 0.09, 0.05 ]; translate = [dist, 0, 0 ]; }

                if( n==='rCollar' && name==='rShldr'){ type = 'capsule'; size = [  r, dist*0.3 ]; translate = [-dist*0.6, 0, 0 ]; rot = [0,0,90]; }
                if( n==='rShldr' && name==='rForeArm'){ type = 'capsule'; size = [  r, w ]; translate = [-w * 0.5, 0, 0 ]; rot = [0,0,90]; }
                if( n==='rForeArm' && name==='rHand' ){ type = 'capsule'; size = [ r, w ]; translate = [-w * 0.5, 0, 0 ]; rot = [0,0,90]; }
                if( n==='rHand' && name==='rMid1'){ type = 'box'; size = [ dist*2, 0.09, 0.05 ]; translate = [-dist, 0, 0 ]; }

	            // legs

                r = 0.06*sizer[6];
                w = dist-r;

                if( n==='lThigh' ){ type = 'capsule'; size = [  r, dist ]; rot = [90,0,0]; translate = [ 0, 0, w * 0.5 ]; }
                if( n==='lShin' ){ type = 'capsule'; size = [  r, dist ]; rot = [90,0,0]; translate = [ 0, 0, w * 0.5 ]; }
                //if( n==='lFoot' ){ type = 'box'; size = [  0.1, dist*1.4, 0.06 ]; translate = [0, (dist * 0.5)-0.025, 0.06 ]; link:'lShin'; }
                if( n==='lFoot' ){ type = 'capsule'; size = [  0.05, dist ]; translate = [0, (dist * 0.5)-0.025, 0.04 ]; }

                if( n==='rThigh' ){ type = 'capsule'; size = [  r, dist ]; rot = [90,0,0]; translate = [ 0, 0, w * 0.5 ]; }
                if( n==='rShin' ){ type = 'capsule'; size = [  r, dist ]; rot = [90,0,0]; translate = [ 0, 0, w * 0.5 ]; }
                //if( n==='rFoot' ){ type = 'box'; size = [  0.1, dist*1.4, 0.06 ]; translate = [0, (dist * 0.5)-0.025, 0.06 ]; link:'rShin';}
                if( n==='rFoot' ){ type = 'capsule'; size = [  0.05, dist ]; translate = [0, (dist * 0.5)-0.025, 0.04 ]; }

                // extra ear
                r = 0.04;
                w = dist-r;
                
                
                if( n==='rEar_0'){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; Spine.push('rEar_0'); }
                if( n==='rEar_1'){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; Spine.push('rEar_1');}
                if( n==='rEar_2' ){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; Spine.push('rEar_2');}
                if( n==='rEar_3' ){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; }

                if( n==='lEar_0'){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; Spine.push('lEar_0');}
                if( n==='lEar_1'){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; Spine.push('lEar_1');}
                if( n==='lEar_2' ){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; Spine.push('lEar_2');}   
                if( n==='lEar_3' ){ type = 'capsule'; size = [  r, dist ]; rot = [0,0,90]; translate = [ w * 0.5, 0, 0 ]; }

                //if( n==='rFoot' && name==='lToes' ){ n='lToes'; parent = bone; type = 'capsule'; size = [  0.05, 0.1 ]; translate = [0, 0, 0 ]; link='rFoot'; rot = [0,0,0]; }
                //if( n==='lFoot' && name==='rToes' ){ n='rToes'; parent = bone; type = 'capsule'; size = [  0.05, 0.1 ]; translate = [0, 0, 0 ]; link='rFoot'; rot = [0,0,0]; }

                if( this.withFinger ) {

                    if( n==='lHand' && name==='lMid1'){ type = 'box'; size = [ dist, 0.09, 0.05 ]; translate = [dist*0.5, 0, 0 ]; }
                    if( n==='rHand' && name==='rMid1'){ type = 'box'; size = [ dist, 0.09, 0.05 ]; translate = [-dist*0.5, 0, 0 ]; }


                    if( n==='rThumb1' && name==='rThumb2' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; }
                    if( n==='rThumb2' && name==='rThumb3' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; }


                    if( n==='rHand' && name==='rMid1' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; translate = [-dist*0.6, 0, 0 ]; }
                    if( n==='rMid1' && name==='rMid2' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; translate = [-dist*0.6, 0, 0 ]; }
                    if( n==='rMid2' && name==='rMid3' ){ type = 'capsule'; size = [  0.02, dist ]; rot = [0,0,90]; translate = [-dist*0.6, 0, 0 ]; }

                }

                if( type !== null ){

                    phyName = this.prefix +'_bone_'+n;

                	// translation
                    //translate = MathTool.scaleArray(translate,this.scaler,3);
                    tmpMtx.makeTranslation( translate[0], translate[1], translate[2] );

                    // rotation
                    if( rot ){
                        tmpMtxR.makeRotationFromEuler( e.set( rot[0]*torad$3, rot[1]*torad$3, rot[2]*torad$3 ) );
                        tmpMtx.multiply( tmpMtxR );
                    }

                    //_boneMatrix.multiplyMatrices( _matrixWorldInv, parent.matrixWorld );
                    
                    //parent.matrixWorld );
                    parent.updateWorldMatrix( true, false );
                    _boneMatrix.multiplyMatrices( _matrixWorldInv, parent.matrixWorld );
                    mtx.copy( _boneMatrix );
                    //mtx.multiplyMatrices( _matrixWorldInv, parent.matrixWorld )
                    //_tmpMatrix2.makeScale(this.scaler,this.scaler,this.scaler)
                   // mtx.multiply(_tmpMatrix2)//Matrices( _matrixWorldInv, bone.matrixWorld );
                    //p
                    //mtx.copy( parent.matrixWorld )//.multiply(tmpMtx)//parent.matrixWorld );
                    mtx.decompose( p, q, s );

                    //p.copy(parent.position)

                    //p.copy(p2)

                    this.posRef[phyName] = p.toArray();
                    //this.posRef[phyName] = p2.toArray()
                    // if( n==='lForeArm'  )console.log(this.posRef[phyName])
                    //this.posRef[phyName] = MathTool.scaleArray(p.toArray(),this.scaler,3)

                    if( n==='lForeArm' || n==='rForeArm' ){
                        _q.setFromAxisAngle( {x:0, y:1, z:0}, -90*torad$3 );
                        q.multiply( _q );
                    } 

                    this.quatRef[phyName] = q.toArray();
                     
                    //mtx.multiplyMatrices( parent.matrixWorld, tmpMtx );
                    mtx.multiplyMatrices( _boneMatrix, tmpMtx );
                    mtx.decompose( p, q, s );


                    //this.posRef[phyName] = p.toArray()
                    // collection

                    this.nameList.push( phyName );

                    

                    



                	// for physic body
                    let bb = {

                        name: phyName,

                        friction: this.friction,
                        restitution: this.restitution,
                        
                        type: type,
                        size: MathTool.scaleArray(size,this.scaler,3),
                        pos: p.toArray(),
                        //rot: rot,
                        quat: q.toArray(),
                        kinematic: kinematic,
                        
                        //group:16,
                        //mask:mask,
                        //mask:0,
                        material:'hide',
                        //material:'debug',
                        shadow:false,
                        neverSleep: true,
                        helper: true,
                        hcolor:[0.0, 0.5, 1],
                        hcolor2:[0.0, 0.2, 1],
                        //hcolor:[0.87, 0.76, 0.65],
                        //hcolor2:[0.9, 0.77, 0.64],

                        penetrationVelocity:3,
                        stabilization:0.1,
                        //maxVelocity:[100,10],
                        damping:[0.25,0.5],
                        //maxAngularVelocity:3,

                        //linked:link,
                        //iterations:[4,4],
                        //inertiaScale:[20,20,20],
                        //iterations:[4,2],


                        /*bone:parent,
                        decal:tmpMtx.clone(),
                        decalinv:tmpMtx.clone().invert(),*/

                        ...this.option
                        
                    };



                    if( this.useAggregate ){

                        // aggregate test
                        if( Spine.indexOf(n)!==-1 ){ 
                            bb['aggregate'] = this.prefix +'__Group';
                            bb['aggregateMax'] = 21;
                        }
                        bb['mask'] = 1|2;

                    } else {
                        let mask =  1|2;
                        if( n==='lForeArm' || n==='rForeArm' || n==='lShin' || n==='rShin'  ) mask = 1|2|32;
                        if( n==='rEar_1' || n==='rEar_2' || n==='rEar_3' || n==='lEar_1'|| n==='lEar_2'|| n==='lEar_3' ) mask = 1|2|32;
                        if( n==='rEar_0' || n==='rEar_0') mask = 0;

                        bb['group'] = 32;
                        bb['mask'] = mask;
                    }
                    

                    //
                    


                    if( this.mass !== null ) bb['mass'] = averageMass;
                    else bb['density'] = 1;

                    data.push(bb);



                    /*if( this.useSolver ){
                        physicData['solver'] = this.prefix+'_solver'
                        physicData['linked'] = this.prefix+'_bone_'+link
                        physicData['kinematic'] = false
                    }*/

                     //physicData )

                    let inv = tmpMtx.clone().invert().premultiply(scaleMatrix);

                    this.nodes.push({
                    	name: phyName,
                        kinematic: kinematic,
                        motion:motion,// auto move
                    	bone:parent,
                        decal:tmpMtx.clone(),
                        decalinv:inv,
                        quat:q.toArray(),
                        pos:p.toArray(),
                        //scaler:this.scaler,
                        cc:0,
                    });
                }

            }
        }

        //console.log( data )

        this.motor.add( data );

        //if( this.useSolver ) this.solver.start();
       
        this.addLink();

        
        this.dispatchEvent( { type: 'start', message: 'go !' } );
        this.ready = true;

	}

    existe( name ){
        return this.nameList.indexOf(name) !== -1 ? true : false
    }

    addLink () {

        // Stiffness / Damping
        // raideur / amortissement
        //let sp = [0.05,1]
        let sp = [0.05, 1, 0];
        if(this.motor.engine==='PHYSX'){
            // stiffness / damping / restitution / bounceThreshold / contactDistance
            //[0,0, 0, 0.5]
            // raideur / amortissement
            sp = [50,10, 0, 0.5];
        }

        let driveSetting = {
            stiffness:2,
            damping:0.1,
            forceLimit:10000000,
            isAcceleration:false,
        };

        /*driveSetting = {
            stiffness:10000,
            damping:500,
            forceLimit:100,
            isAcceleration:true,
        }*/




        let p = this.prefix+'_bone_';
        let data = [];
        let sett = {
            type:'joint', 
            mode:'d6',
            
            lm:[  ['ry',-180,180,...sp], ['rz',-180,180,...sp] ],

            collision:false,
            helperSize:0.05,
            visible:this.showJoint,

            //acc:true,

            //worldAxis:[1,0,0],

            //autoDrive: true,

            /*drives: [
            ['rx', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ],
            ['ry', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ],
            ['rz', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ]
            ],*/

        };

        if( this.useDrive ){
            sett['drives'] = [
            ['rx', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ],
            ['ry', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ],
            ['rz', driveSetting.stiffness, driveSetting.damping, driveSetting.forceLimit, driveSetting.isAcceleration ]
            ];
        }

        let breastMotion = [-1e-3, 0.001, 100, 0.2, 0.5];
        

        data.push({ ...sett, b1:p+'hip', b2:p+'abdomen', worldPos:this.posRef[p+'abdomen'], worldQuat:this.quatRef[p+'hip'], lm:[ ['rx',-20,20,...sp], ['ry',-20,20,...sp], ['rz',-20,20,...sp]] });
        data.push({ ...sett, b1:p+'abdomen', b2:p+'chest', worldPos:this.posRef[p+'chest'], worldQuat:this.quatRef[p+'chest'], lm:[ ['rx',-20,20,...sp], ['ry',-20,20,...sp], ['rz',-20,20,...sp]] });
        //data.push({ ...sett, b1:p+'chest', b2:p+'neck', worldPos:this.posRef[p+'neck'], worldQuat:this.quatRef[p+'neck'], lm:[ ['rx',-60,60,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] })
        //data.push({ ...sett, b1:p+'neck', b2:p+'head', worldPos:this.posRef[p+'head'], worldQuat:this.quatRef[p+'head'], lm:[ ['rx',-60,60,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] })
        data.push({ ...sett, b1:p+'chest', b2:p+'neck', worldPos:this.posRef[p+'neck'], worldQuat:this.quatRef[p+'neck'], lm:[ ['rx',0,30,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] });
        data.push({ ...sett, b1:p+'neck', b2:p+'head', worldPos:this.posRef[p+'head'], worldQuat:this.quatRef[p+'head'], lm:[ ['rx',0,30,...sp], ['ry',-1,1,...sp], ['rz',-30,30,...sp]] });
        //data.push({ type:'joint', mode:'d6', b1:this.prefix*'chest', b2:this.prefix*'abdomen' })

        // arm

        //data.push({ ...sett, b1:p+'chest', b2:p+'rCollar', worldPos:this.posRef[p+'rCollar'],  worldQuat:this.quatRef[p+'rCollar'], lm:[ ['rx',-10,10,...sp], ['ry',-10,10,...sp], ['rz',-10,10,...sp]] })
        //data.push({ ...sett, b1:p+'chest', b2:p+'lCollar', worldPos:this.posRef[p+'lCollar'],  worldQuat:this.quatRef[p+'lCollar'], lm:[ ['rx',-10,10,...sp], ['ry',-10,10,...sp], ['rz',-10,10,...sp]] })
        data.push({ ...sett, b1:p+'chest', b2:p+'rCollar', worldPos:this.posRef[p+'rCollar'],  worldQuat:this.quatRef[p+'rCollar'], mode:'fixe' });
        data.push({ ...sett, b1:p+'chest', b2:p+'lCollar', worldPos:this.posRef[p+'lCollar'],  worldQuat:this.quatRef[p+'lCollar'], mode:'fixe' });

        data.push({ ...sett, b1:p+'rCollar', b2:p+'rShldr', worldPos:this.posRef[p+'rShldr'],  worldQuat:this.quatRef[p+'rShldr'] });
        data.push({ ...sett, b1:p+'lCollar', b2:p+'lShldr', worldPos:this.posRef[p+'lShldr'],  worldQuat:this.quatRef[p+'lShldr'] });

       //data.push({ ...sett, b1:p+'chest', b2:p+'rShldr', worldPos:this.posRef[p+'rShldr'], worldQuat:this.quatRef[p+'rShldr'] })
        //data.push({ ...sett, b1:p+'chest', b2:p+'lShldr', worldPos:this.posRef[p+'lShldr'], worldQuat:this.quatRef[p+'lShldr'] })

        if( this.existe(p+'rForeArm') ) data.push({ ...sett, b1:p+'rShldr', b2:p+'rForeArm', worldPos:this.posRef[p+'rForeArm'], worldQuat:this.quatRef[p+'rForeArm'], lm:[['rx',0,160,...sp]] });
        if( this.existe(p+'lForeArm') ) data.push({ ...sett, b1:p+'lShldr', b2:p+'lForeArm', worldPos:this.posRef[p+'lForeArm'], worldQuat:this.quatRef[p+'lForeArm'], lm:[['rx',0,160,...sp]] });

        if( this.existe(p+'rHand') ) data.push({ ...sett, b1:p+'rForeArm', b2:p+'rHand', worldPos:this.posRef[p+'rHand'], worldQuat:this.quatRef[p+'rHand'], lm:[['rx',0,160,...sp], ['ry',-10,10,...sp]] });
        if( this.existe(p+'lHand') ) data.push({ ...sett, b1:p+'lForeArm', b2:p+'lHand', worldPos:this.posRef[p+'lHand'], worldQuat:this.quatRef[p+'lHand'], lm:[['rx',0,160,...sp], ['ry',-10,10,...sp]] });

        //data.push({ ...sett, b1:p+'rShldr', b2:p+'rForeArm', worldPos:this.posRef[p+'rForeArm'], worldAxis:[1,0,0], lm:[['rx',-120, 0]] })
        //data.push({ ...sett, b1:p+'lShldr', b2:p+'lForeArm', worldPos:this.posRef[p+'lForeArm'], worldAxis:[1,0,0], lm:[['rx',-120, 0]] })

        // leg

        data.push({ ...sett, b1:p+'hip', b2:p+'rThigh', worldPos:this.posRef[p+'rThigh'],  worldQuat:this.quatRef[p+'rThigh'] });
        data.push({ ...sett, b1:p+'hip', b2:p+'lThigh', worldPos:this.posRef[p+'lThigh'],  worldQuat:this.quatRef[p+'lThigh'] });

        if( this.existe(p+'rShin') )data.push({ ...sett, b1:p+'rThigh', b2:p+'rShin', worldPos:this.posRef[p+'rShin'], lm:[['rx',0,160,...sp]], worldQuat:this.quatRef[p+'rShin'] });
        if( this.existe(p+'lShin') )data.push({ ...sett, b1:p+'lThigh', b2:p+'lShin', worldPos:this.posRef[p+'lShin'], lm:[['rx',0,160,...sp]], worldQuat:this.quatRef[p+'lShin'] });

        if( this.existe(p+'rFoot') ) data.push({ ...sett, b1:p+'rShin', b2:p+'rFoot', worldPos:this.posRef[p+'rFoot'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]], worldQuat:this.quatRef[p+'rFoot'] });
        if( this.existe(p+'lFoot') ) data.push({ ...sett, b1:p+'lShin', b2:p+'lFoot', worldPos:this.posRef[p+'lFoot'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]], worldQuat:this.quatRef[p+'lFoot'] });

        if(this.breast){
            if( this.existe(p+'rBreast') ) data.push({ ...sett, b1:p+'chest', b2:p+'rBreast', worldPos:this.posRef[p+'rBreast'], worldQuat:this.quatRef[p+'rBreast'], lm:[['x',...breastMotion], ['y',...breastMotion], ['z',...breastMotion]] });
            if( this.existe(p+'lBreast') ) data.push({ ...sett, b1:p+'chest', b2:p+'lBreast', worldPos:this.posRef[p+'lBreast'], worldQuat:this.quatRef[p+'lBreast'], lm:[['x',...breastMotion], ['y',...breastMotion], ['z',...breastMotion]] });
        }

        // EAR

        if( this.existe(p+'lEar_0') ) data.push({ ...sett, b1:p+'head',   b2:p+'lEar_0', worldPos:this.posRef[p+'lEar_0'], worldQuat:this.quatRef[p+'lEar_0'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] }); 
        if( this.existe(p+'lEar_1') ) data.push({ ...sett, b1:p+'lEar_0', b2:p+'lEar_1', worldPos:this.posRef[p+'lEar_1'], worldQuat:this.quatRef[p+'lEar_1'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] });
        if( this.existe(p+'lEar_2') ) data.push({ ...sett, b1:p+'lEar_1', b2:p+'lEar_2', worldPos:this.posRef[p+'lEar_2'], worldQuat:this.quatRef[p+'lEar_2'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] });
        if( this.existe(p+'lEar_3') ) data.push({ ...sett, b1:p+'lEar_2', b2:p+'lEar_3', worldPos:this.posRef[p+'lEar_3'], worldQuat:this.quatRef[p+'lEar_3'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] });
        
        if( this.existe(p+'rEar_0') ) data.push({ ...sett, b1:p+'head',   b2:p+'rEar_0', worldPos:this.posRef[p+'rEar_0'], worldQuat:this.quatRef[p+'rEar_0'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] });
        if( this.existe(p+'rEar_1') ) data.push({ ...sett, b1:p+'rEar_0', b2:p+'rEar_1', worldPos:this.posRef[p+'rEar_1'], worldQuat:this.quatRef[p+'rEar_1'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] });
        if( this.existe(p+'rEar_2') ) data.push({ ...sett, b1:p+'rEar_1', b2:p+'rEar_2', worldPos:this.posRef[p+'rEar_2'], worldQuat:this.quatRef[p+'rEar_2'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] });
        if( this.existe(p+'rEar_3') ) data.push({ ...sett, b1:p+'rEar_2', b2:p+'rEar_3', worldPos:this.posRef[p+'rEar_3'], worldQuat:this.quatRef[p+'rEar_3'], lm:[['rx',-10,30,...sp], ['rz',-10,10,...sp]] });


        let x = 0;
        for( let j in data ){
            data[j].name = this.prefix + '_joint_'+ x;
            //this.nameList.push( data[j].name )
            this.jointList.push( data[j].name );
            x++;
        }


        this.motor.add( data );

    }





    /*makeLink () {

        let p = this.prefix;
        let data = []
        data.push({ type:'joint', mode:'d6', b1:p+'hip', b2:p+'abdomen', visible:true })
        data.push({ type:'joint', mode:'d6', b1:p+'abdomen', b2:p+'chest', visible:true })
        //data.push({ type:'joint', mode:'d6', b1:this.prefix*'chest', b2:this.prefix*'abdomen' })

        //console.log(this.prefix, data)

        root.motor.add( data )

    }*/

	updateMatrixWorld( force ){

        if(!this.ready) return

		let up = [];

		const nodes = this.nodes;
		let i = nodes.length, node, bone, body, n=0;


		while( i-- ){

            node = nodes[n];
            bone = node.bone;
            n++;

            if( node.kinematic ){

                _endMatrix.multiplyMatrices( bone.matrixWorld, node.decal );
                _endMatrix.decompose( _p, _q, _s );

                node.pos = _p.toArray();
                node.quat = _q.toArray();

                up.push({ name:node.name, pos:node.pos, quat:node.quat });

                if( node.motion ) this.freeBone(node);

            } else {

                body = this.motor.byName( node.name );

                if(body){
                    _endMatrix.copy( body.matrixWorld ).multiply( node.decalinv );
                    bone.phyMtx.copy( _endMatrix );
                    bone.isPhysics = true;
                }
            }

        }

        if( up.length !== 0 ) this.motor.change( up, true );

	}

	dispose(){

        this.motor.remove( this.jointList );
        this.motor.remove( this.nameList );

        //if( this.useAggregate ) root.motor.remove(this.prefix +'__Group')

        this.nodes = [];
        this.posRef = {};
        this.quatRef = {};
		this.parent.remove( this );

        this.nameList = [];
        this.jointList = [];
		
	}

}

// This file is part of meshoptimizer library and is distributed under the terms of MIT License.
// Copyright (C) 2016-2025, by Arseny Kapoulkine (arseny.kapoulkine@gmail.com)
var MeshoptDecoder = (function () {
	// Built with clang version 19.1.5-wasi-sdk
	// Built from meshoptimizer 0.24
	var wasm_base =
		'b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:W:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq:S86qdbk;jYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz1jjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbhodnawTmbaxa8Acd4fRbbhokaocFeGh5cbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz1jjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:jjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q1jjbfcj1jjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bbarcwf9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfag9c8F1:NghcKtc8F91aicdfa8J9c8N1:Nfg8KRbbG86bbarcVfcba8KahcjeGcr4fghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fag9c8F1:NgicKtc8F91aha8J9c8N1:NfghRbbG86bbarc96fcbahaicjeGcr4fgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbb83bbarcwfaicwf8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbcbaocl49Rh8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E93aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z1jjjb8AazazcjdfaAcufad2fadz1jjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok:XseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbyd:K1jjbgeabcifc98GfgbBd:K1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk81dbcjwk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:Kwkl8WNbb'; // embed! base
	var wasm_simd =
		'b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;G9Mqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:183lYud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxavaialfgmar9Rgoad;8qbbcj;abad9Uc;WFbGcjdadca0EhPdndndnadTmbaoadfhscbhzinaeaz9nmdamax9RaD6miabazad2fhHaxaDfhOaPaeaz9RazaPfae6EgAcsfgocl4cifcd4hCavcj;cbfaoc9WGgXcetfhQavcj;cbfaXci2fhLavcj;cbfaXfhKcbhYaoc;ab6h8AincbhodnawTmbaxaYcd4fRbbhokaocFeGhEcbh3avcj;cbfh5indndndndnaEa3cet4ciGgoc9:fPdebdkamaO9RaX6mwavcj;cbfa3aX2faOaX;8qbbaOaAfhOxdkavcj;cbfa3aX2fcbaX;8kbxekamaO9RaC6moaoclVcbawEhraOaCfhocbhidna8Ambamao9Rc;Gb6mbcbhlina5alfhidndndndndndnaOalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiczfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaicafaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaoclffaqc:q:yjjbfRbbfhoxikaic8Wfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaocwffaqc:q:yjjbfRbbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitc:q1jjbfpbibaic:q:yjjbfRbbgipsaoRbegqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqc:q:yjjbfRbbfhokalc;abfhialcjefaX0meaihlamao9Rc;Fb0mbkkdnaiaX9pmbaici4hlinamao9RcK6mwa5aifhqdndndndndndnaOaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaoclffahc:q:yjjbfRbbfhoxikaqaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaocwffahc:q:yjjbfRbbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpkbbaaaocdffahc:q:yjjbfRbbfhokalcdfhlaiczfgiaX6mbkkaohOaoTmoka5aXfh5a3cefg3cl9hmbkdndndndnawTmbasaYcd4fRbbglciGPlbedwbkaXTmdavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep9Ta8Epxeeeeeeeeeeeeeeeeg8Fp9op9Hp9rg8Eagp9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Ug8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9AbbbaladfhlaoczfgoaX6mbxikkaXTmeavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep:nea8Epxebebebebebebebebg8Fp9op:bep9rg8Eagp:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeg8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9AbbbaladfhlaoczfgoaX6mbxdkkaXTmbcbhocbalcl4gl9Rc8FGhiavcjdfaYfhravaYfpbdbh8Finaravcj;cbfaofpblbggaKaofpblbg8JpmbzeHdOiAlCvXoQrLg8KaQaofpblbg8LaLaofpblbg8MpmbzeHdOiAlCvXoQrLg8NpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ea8Fp9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Fa8Ka8NpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwKDYq8AkEx3m5P8Es8Fgga8La8MpmwKDYq8AkEx3m5P8Es8Fg8JpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9AbbbaradfhraoczfgoaX6mbkkaYclfgYad6mbkaHavcjdfaAad2;8qbbavavcjdfaAcufad2fad;8qbbaAazfhzc9:hoaOhxaOmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdaPaeao9RaoaPfae6Eaofgoae6mbkaial9Rhxkcbc99amax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbk:TseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgDce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhqaicefgwarfhldnaeTmbcmcsaDceSEhkcbhxcbhmcbhrcbhicbhoindnalaq9nmbc9:hoxikdndnawRbbgDc;Ve0mbavc;abfaoaDcu7gPcl4fcsGcitfgsydlhzasydbhHdndnaDcsGgsak9pmbavaiaPfcsGcdtfydbaxasEhDaxasTgOfhxxekdndnascsSmbcehOasc987asamffcefhDxekalcefhDal8SbbgscFeGhPdndnascu9mmbaDhlxekalcvfhlaPcFbGhPcrhsdninaD8SbbgOcFbGastaPVhPaOcu9kmeaDcefhDascrfgsc8J9hmbxdkkaDcefhlkcehOaPce4cbaPceG9R7amfhDkaDhmkavc;abfaocitfgsaDBdbasazBdlavaicdtfaDBdbavc;abfaocefcsGcitfgsaHBdbasaDBdlaocdfhoaOaifhidnadcd9hmbabarcetfgsaH87ebasclfaD87ebascdfaz87ebxdkabarcdtfgsaHBdbascwfaDBdbasclfazBdbxekdnaDcpe0mbaxcefgOavaiaqaDcsGfRbbgscl49RcsGcdtfydbascz6gPEhDavaias9RcsGcdtfydbaOaPfgzascsGgOEhsaOThOdndnadcd9hmbabarcetfgHax87ebaHclfas87ebaHcdfaD87ebxekabarcdtfgHaxBdbaHcwfasBdbaHclfaDBdbkavaicdtfaxBdbavc;abfaocitfgHaDBdbaHaxBdlavaicefgicsGcdtfaDBdbavc;abfaocefcsGcitfgHasBdbaHaDBdlavaiaPfgicsGcdtfasBdbavc;abfaocdfcsGcitfgDaxBdbaDasBdlaocifhoaiaOfhiazaOfhxxekaxcbalRbbgHEgAaDc;:eSgDfhzaHcsGhCaHcl4hXdndnaHcs0mbazcefhOxekazhOavaiaX9RcsGcdtfydbhzkdndnaCmbaOcefhxxekaOhxavaiaH9RcsGcdtfydbhOkdndnaDTmbalcefhDxekalcdfhDal8SbegPcFeGhsdnaPcu9kmbalcofhAascFbGhscrhldninaD8SbbgPcFbGaltasVhsaPcu9kmeaDcefhDalcrfglc8J9hmbkaAhDxekaDcefhDkasce4cbasceG9R7amfgmhAkdndnaXcsSmbaDhsxekaDcefhsaD8SbbglcFeGhPdnalcu9kmbaDcvfhzaPcFbGhPcrhldninas8SbbgDcFbGaltaPVhPaDcu9kmeascefhsalcrfglc8J9hmbkazhsxekascefhskaPce4cbaPceG9R7amfgmhzkdndnaCcsSmbashlxekascefhlas8SbbgDcFeGhPdnaDcu9kmbascvfhOaPcFbGhPcrhDdninal8SbbgscFbGaDtaPVhPascu9kmealcefhlaDcrfgDc8J9hmbkaOhlxekalcefhlkaPce4cbaPceG9R7amfgmhOkdndnadcd9hmbabarcetfgDaA87ebaDclfaO87ebaDcdfaz87ebxekabarcdtfgDaABdbaDcwfaOBdbaDclfazBdbkavc;abfaocitfgDazBdbaDaABdlavaicdtfaABdbavc;abfaocefcsGcitfgDaOBdbaDazBdlavaicefgicsGcdtfazBdbavc;abfaocdfcsGcitfgDaABdbaDaOBdlavaiaHcz6aXcsSVfgicsGcdtfaOBdbaiaCTaCcsSVfhiaocifhokawcefhwaocsGhoaicsGhiarcifgrae6mbkkcbc99alaqSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:SPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiczfpxbbbbbbbbbbbbbbbbgopklbaiaopklbaiabalcitfgdaeciGglcitgv;8qbbdnalTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkadaiav;8qbbkk:oDllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiczfpxbbbbbbbbbbbbbbbbgkpklbaiakpklbaiabalcitfgoaeciGgvcitgw;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkaoaiaw;8qbbkk;uddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaic8WfpxbbbbbbbbbbbbbbbbgopklbaicafaopklbaiczfaopklbaiaopklbaiabavcdtfgdalciGgecdtgv;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkadaiav;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb'; // embed! simd

	var detector = new Uint8Array([
		0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 3, 2, 0, 0, 5, 3, 1, 0, 1, 12, 1, 0, 10, 22, 2, 12, 0, 65, 0, 65, 0, 65, 0, 252, 10, 0, 0,
		11, 7, 0, 65, 0, 253, 15, 26, 11,
	]);
	var wasmpack = new Uint8Array([
		32, 0, 65, 2, 1, 106, 34, 33, 3, 128, 11, 4, 13, 64, 6, 253, 10, 7, 15, 116, 127, 5, 8, 12, 40, 16, 19, 54, 20, 9, 27, 255, 113, 17, 42, 67,
		24, 23, 146, 148, 18, 14, 22, 45, 70, 69, 56, 114, 101, 21, 25, 63, 75, 136, 108, 28, 118, 29, 73, 115,
	]);

	if (typeof WebAssembly !== 'object') {
		return {
			supported: false,
		};
	}

	var wasm = WebAssembly.validate(detector) ? unpack(wasm_simd) : unpack(wasm_base);

	var instance;

	var ready = WebAssembly.instantiate(wasm, {}).then(function (result) {
		instance = result.instance;
		instance.exports.__wasm_call_ctors();
	});

	function unpack(data) {
		var result = new Uint8Array(data.length);
		for (var i = 0; i < data.length; ++i) {
			var ch = data.charCodeAt(i);
			result[i] = ch > 96 ? ch - 97 : ch > 64 ? ch - 39 : ch + 4;
		}
		var write = 0;
		for (var i = 0; i < data.length; ++i) {
			result[write++] = result[i] < 60 ? wasmpack[result[i]] : (result[i] - 60) * 64 + result[++i];
		}
		return result.buffer.slice(0, write);
	}

	function decode(instance, fun, target, count, size, source, filter) {
		var sbrk = instance.exports.sbrk;
		var count4 = (count + 3) & -4;
		var tp = sbrk(count4 * size);
		var sp = sbrk(source.length);
		var heap = new Uint8Array(instance.exports.memory.buffer);
		heap.set(source, sp);
		var res = fun(tp, count, size, sp, source.length);
		if (res == 0 && filter) {
			filter(tp, count4, size);
		}
		target.set(heap.subarray(tp, tp + count * size));
		sbrk(tp - sbrk(0));
		if (res != 0) {
			throw new Error('Malformed buffer data: ' + res);
		}
	}

	var filters = {
		NONE: '',
		OCTAHEDRAL: 'meshopt_decodeFilterOct',
		QUATERNION: 'meshopt_decodeFilterQuat',
		EXPONENTIAL: 'meshopt_decodeFilterExp',
	};

	var decoders = {
		ATTRIBUTES: 'meshopt_decodeVertexBuffer',
		TRIANGLES: 'meshopt_decodeIndexBuffer',
		INDICES: 'meshopt_decodeIndexSequence',
	};

	var workers = [];
	var requestId = 0;

	function createWorker(url) {
		var worker = {
			object: new Worker(url),
			pending: 0,
			requests: {},
		};

		worker.object.onmessage = function (event) {
			var data = event.data;

			worker.pending -= data.count;
			worker.requests[data.id][data.action](data.value);
			delete worker.requests[data.id];
		};

		return worker;
	}

	function initWorkers(count) {
		var source =
			'self.ready = WebAssembly.instantiate(new Uint8Array([' +
			new Uint8Array(wasm) +
			']), {})' +
			'.then(function(result) { result.instance.exports.__wasm_call_ctors(); return result.instance; });' +
			'self.onmessage = ' +
			workerProcess.name +
			';' +
			decode.toString() +
			workerProcess.toString();

		var blob = new Blob([source], { type: 'text/javascript' });
		var url = URL.createObjectURL(blob);

		for (var i = workers.length; i < count; ++i) {
			workers[i] = createWorker(url);
		}

		for (var i = count; i < workers.length; ++i) {
			workers[i].object.postMessage({});
		}

		workers.length = count;

		URL.revokeObjectURL(url);
	}

	function decodeWorker(count, size, source, mode, filter) {
		var worker = workers[0];

		for (var i = 1; i < workers.length; ++i) {
			if (workers[i].pending < worker.pending) {
				worker = workers[i];
			}
		}

		return new Promise(function (resolve, reject) {
			var data = new Uint8Array(source);
			var id = ++requestId;

			worker.pending += count;
			worker.requests[id] = { resolve: resolve, reject: reject };
			worker.object.postMessage({ id: id, count: count, size: size, source: data, mode: mode, filter: filter }, [data.buffer]);
		});
	}

	function workerProcess(event) {
		var data = event.data;
		if (!data.id) {
			return self.close();
		}
		self.ready.then(function (instance) {
			try {
				var target = new Uint8Array(data.count * data.size);
				decode(instance, instance.exports[data.mode], target, data.count, data.size, data.source, instance.exports[data.filter]);
				self.postMessage({ id: data.id, count: data.count, action: 'resolve', value: target }, [target.buffer]);
			} catch (error) {
				self.postMessage({ id: data.id, count: data.count, action: 'reject', value: error });
			}
		});
	}

	return {
		ready: ready,
		supported: true,
		useWorkers: function (count) {
			initWorkers(count);
		},
		decodeVertexBuffer: function (target, count, size, source, filter) {
			decode(instance, instance.exports.meshopt_decodeVertexBuffer, target, count, size, source, instance.exports[filters[filter]]);
		},
		decodeIndexBuffer: function (target, count, size, source) {
			decode(instance, instance.exports.meshopt_decodeIndexBuffer, target, count, size, source);
		},
		decodeIndexSequence: function (target, count, size, source) {
			decode(instance, instance.exports.meshopt_decodeIndexSequence, target, count, size, source);
		},
		decodeGltfBuffer: function (target, count, size, source, mode, filter) {
			decode(instance, instance.exports[decoders[mode]], target, count, size, source, instance.exports[filters[filter]]);
		},
		decodeGltfBufferAsync: function (count, size, source, mode, filter) {
			if (workers.length > 0) {
				return decodeWorker(count, size, source, decoders[mode], filters[filter]);
			}

			return ready.then(function () {
				var target = new Uint8Array(count * size);
				decode(instance, instance.exports[decoders[mode]], target, count, size, source, instance.exports[filters[filter]]);
				return target;
			});
		},
	};
})();

const _taskCache = new WeakMap();

class DRACOLoader extends Loader {

	constructor( manager ) {

		super( manager );

		this.useLocal = false;

		this.decoderPath = '';
		this.decoderConfig = {};
		this.decoderBinary = null;
		this.decoderPending = null;

		this.workerLimit = 4;
		this.workerPool = [];
		this.workerNextTaskID = 1;
		this.workerSourceURL = '';

		this.defaultAttributeIDs = {
			position: 'POSITION',
			normal: 'NORMAL',
			color: 'COLOR',
			uv: 'TEX_COORD'
		};
		
		this.defaultAttributeTypes = {
			position: 'Float32Array',
			normal: 'Float32Array',
			color: 'Float32Array',
			uv: 'Float32Array'
		};

	}

	setUseLocal( value ) {

		this.useLocal = value;

		return this;

	}

	setDecoderPath( path ) {

		this.decoderPath = path;

		return this;

	}

	setDecoderConfig( config ) {

		this.decoderConfig = config;

		return this;

	}

	setWorkerLimit( workerLimit ) {

		this.workerLimit = workerLimit;

		return this;

	}

	load( url, onLoad, onProgress, onError ) {

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );

		console.log( this.withCredentials, this.requestHeader, this.path );

		loader.load( url, ( buffer ) => {

			this.parse( buffer, onLoad, onError );

		}, onProgress, onError );

	}

	parse( buffer, onLoad, onError ) {

		this.decodeDracoFile( buffer, onLoad, null, null, SRGBColorSpace ).catch( onError );

	}

	decodeDracoFile( buffer, callback, attributeIDs, attributeTypes, vertexColorSpace = LinearSRGBColorSpace ) {

		const taskConfig = {
			attributeIDs: attributeIDs || this.defaultAttributeIDs,
			attributeTypes: attributeTypes || this.defaultAttributeTypes,
			useUniqueIDs: !! attributeIDs,
			vertexColorSpace: vertexColorSpace,
		};

		return this.decodeGeometry( buffer, taskConfig ).then( callback );

	}

	decodeGeometry( buffer, taskConfig ) {

		const taskKey = JSON.stringify( taskConfig );

		// Check for an existing task using this buffer. A transferred buffer cannot be transferred
		// again from this thread.
		if ( _taskCache.has( buffer ) ) {

			const cachedTask = _taskCache.get( buffer );

			if ( cachedTask.key === taskKey ) {

				return cachedTask.promise;

			} else if ( buffer.byteLength === 0 ) {

				// Technically, it would be possible to wait for the previous task to complete,
				// transfer the buffer back, and decode again with the second configuration. That
				// is complex, and I don't know of any reason to decode a Draco buffer twice in
				// different ways, so this is left unimplemented.
				throw new Error(

					'THREE.DRACOLoader: Unable to re-decode a buffer with different ' +
					'settings. Buffer has already been transferred.'

				);

			}

		}

		//

		let worker;
		const taskID = this.workerNextTaskID ++;
		const taskCost = buffer.byteLength;

		// Obtain a worker and assign a task, and construct a geometry instance
		// when the task completes.
		const geometryPending = this._getWorker( taskID, taskCost )
			.then( ( _worker ) => {

				worker = _worker;

				return new Promise( ( resolve, reject ) => {

					worker._callbacks[ taskID ] = { resolve, reject };

					worker.postMessage( { type: 'decode', id: taskID, taskConfig, buffer }, [ buffer ] );

					// this.debug();

				} );

			} )
			.then( ( message ) => this._createGeometry( message.geometry ) );

		// Remove task from the task list.
		// Note: replaced '.finally()' with '.catch().then()' block - iOS 11 support (#19416)
		geometryPending
			.catch( () => true )
			.then( () => {

				if ( worker && taskID ) {

					this._releaseTask( worker, taskID );

					// this.debug();

				}

			} );

		// Cache the task result.
		_taskCache.set( buffer, {

			key: taskKey,
			promise: geometryPending

		} );

		return geometryPending;

	}

	_createGeometry( geometryData ) {

		const geometry = new BufferGeometry();

		if ( geometryData.index ) {

			geometry.setIndex( new BufferAttribute( geometryData.index.array, 1 ) );

		}

		for ( let i = 0; i < geometryData.attributes.length; i ++ ) {

			const result = geometryData.attributes[ i ];
			const name = result.name;
			const array = result.array;
			const itemSize = result.itemSize;

			const attribute = new BufferAttribute( array, itemSize );

			if ( name === 'color' ) {

				this._assignVertexColorSpace( attribute, result.vertexColorSpace );

				attribute.normalized = ( array instanceof Float32Array ) === false;

			}

			geometry.setAttribute( name, attribute );

		}

		return geometry;

	}

	_assignVertexColorSpace( attribute, inputColorSpace ) {

		// While .drc files do not specify colorspace, the only 'official' tooling
		// is PLY and OBJ converters, which use sRGB. We'll assume sRGB when a .drc
		// file is passed into .load() or .parse(). GLTFLoader uses internal APIs
		// to decode geometry, and vertex colors are already Linear-sRGB in there.

		if ( inputColorSpace !== SRGBColorSpace ) return;

		const _color = new Color();

		for ( let i = 0, il = attribute.count; i < il; i ++ ) {

			_color.fromBufferAttribute( attribute, i ).convertSRGBToLinear();
			attribute.setXYZ( i, _color.r, _color.g, _color.b );

		}

	}

	_loadLibrary( url, responseType ) {

		const loader = new FileLoader( this.manager );
		loader.setPath( this.decoderPath );
		loader.setResponseType( responseType );
		loader.setWithCredentials( this.withCredentials );

		return new Promise( ( resolve, reject ) => {

			loader.load( url, resolve, undefined, reject );

		} );

	}



	preload() {

		this._initDecoder();

		return this;

	}

	_initDecoder() {

		if ( this.decoderPending ) return this.decoderPending;

		const useJS = typeof WebAssembly !== 'object' || this.decoderConfig.type === 'js';
		const librariesPending = [];

		if ( useJS ) {

			if(this.useLocal) {
				this.decoderPath = '';
				librariesPending.push( this._loadLibrary( new URL( '../build/draco/draco_decoder.js', import.meta.url ), 'text' ) );
			} else {
				librariesPending.push( this._loadLibrary( 'draco_decoder.js', 'text' ) );
			}

		} else {

			if(this.useLocal) {
				this.decoderPath = '';
				librariesPending.push( this._loadLibrary( new URL( '../build/draco/draco_wasm_wrapper.js', import.meta.url ), 'text' ) );
			} else {
				librariesPending.push( this._loadLibrary( 'draco_wasm_wrapper.js', 'text' ) );
			}

		}

		this.decoderPending = Promise.all( librariesPending )
			.then( ( libraries ) => {

				const jsContent = libraries[ 0 ];

				const fn = DRACOWorker.toString();

				const body = [
					'/* draco decoder */',
					jsContent,
					'',
					'/* worker */',
					fn.substring( fn.indexOf( '{' ) + 1, fn.lastIndexOf( '}' ) )
				].join( '\n' );

				this.workerSourceURL = URL.createObjectURL( new Blob( [ body ] ) );

			} );

		return this.decoderPending;

	}

	_getWorker( taskID, taskCost ) {

		return this._initDecoder().then( () => {

			if ( this.workerPool.length < this.workerLimit ) {

				const worker = new Worker( this.workerSourceURL );

				worker._callbacks = {};
				worker._taskCosts = {};
				worker._taskLoad = 0;

				worker.postMessage( { type: 'init', decoderConfig: this.decoderConfig } );

				worker.onmessage = function ( e ) {

					const message = e.data;

					switch ( message.type ) {

						case 'decode':
							worker._callbacks[ message.id ].resolve( message );
							break;

						case 'error':
							worker._callbacks[ message.id ].reject( message );
							break;

						default:
							console.error( 'THREE.DRACOLoader: Unexpected message, "' + message.type + '"' );

					}

				};

				this.workerPool.push( worker );

			} else {

				this.workerPool.sort( function ( a, b ) {

					return a._taskLoad > b._taskLoad ? -1 : 1;

				} );

			}

			const worker = this.workerPool[ this.workerPool.length - 1 ];
			worker._taskCosts[ taskID ] = taskCost;
			worker._taskLoad += taskCost;
			return worker;

		} );

	}

	_releaseTask( worker, taskID ) {

		worker._taskLoad -= worker._taskCosts[ taskID ];
		delete worker._callbacks[ taskID ];
		delete worker._taskCosts[ taskID ];

	}

	debug() {

		console.log( 'Task load: ', this.workerPool.map( ( worker ) => worker._taskLoad ) );

	}

	dispose() {

		for ( let i = 0; i < this.workerPool.length; ++ i ) {

			this.workerPool[ i ].terminate();

		}

		this.workerPool.length = 0;

		if ( this.workerSourceURL !== '' ) {

			URL.revokeObjectURL( this.workerSourceURL );

		}

		return this;

	}

}

/* WEB WORKER */

function DRACOWorker() {

	let decoderConfig;
	let decoderPending;

	onmessage = function ( e ) {

		const message = e.data;

		switch ( message.type ) {

			case 'init':
				decoderConfig = message.decoderConfig;
				decoderPending = new Promise( function ( resolve/*, reject*/ ) {

					decoderConfig.onModuleLoaded = function ( draco ) {

						// Module is Promise-like. Wrap before resolving to avoid loop.
						resolve( { draco: draco } );

					};

					DracoDecoderModule( decoderConfig ); // eslint-disable-line no-undef

				} );
				break;

			case 'decode':
				const buffer = message.buffer;
				const taskConfig = message.taskConfig;
				decoderPending.then( ( module ) => {

					const draco = module.draco;
					const decoder = new draco.Decoder();

					try {

						const geometry = decodeGeometry( draco, decoder, new Int8Array( buffer ), taskConfig );

						const buffers = geometry.attributes.map( ( attr ) => attr.array.buffer );

						if ( geometry.index ) buffers.push( geometry.index.array.buffer );

						self.postMessage( { type: 'decode', id: message.id, geometry }, buffers );

					} catch ( error ) {

						console.error( error );

						self.postMessage( { type: 'error', id: message.id, error: error.message } );

					} finally {

						draco.destroy( decoder );

					}

				} );
				break;

		}

	};

	function decodeGeometry( draco, decoder, array, taskConfig ) {

		const attributeIDs = taskConfig.attributeIDs;
		const attributeTypes = taskConfig.attributeTypes;

		let dracoGeometry;
		let decodingStatus;

		const geometryType = decoder.GetEncodedGeometryType( array );

		if ( geometryType === draco.TRIANGULAR_MESH ) {

			dracoGeometry = new draco.Mesh();
			decodingStatus = decoder.DecodeArrayToMesh( array, array.byteLength, dracoGeometry );

		} else if ( geometryType === draco.POINT_CLOUD ) {

			dracoGeometry = new draco.PointCloud();
			decodingStatus = decoder.DecodeArrayToPointCloud( array, array.byteLength, dracoGeometry );

		} else {

			throw new Error( 'THREE.DRACOLoader: Unexpected geometry type.' );

		}

		if ( ! decodingStatus.ok() || dracoGeometry.ptr === 0 ) {

			throw new Error( 'THREE.DRACOLoader: Decoding failed: ' + decodingStatus.error_msg() );

		}

		const geometry = { index: null, attributes: [] };

		// Gather all vertex attributes.
		for ( const attributeName in attributeIDs ) {

			const attributeType = self[ attributeTypes[ attributeName ] ];

			let attribute;
			let attributeID;

			// A Draco file may be created with default vertex attributes, whose attribute IDs
			// are mapped 1:1 from their semantic name (POSITION, NORMAL, ...). Alternatively,
			// a Draco file may contain a custom set of attributes, identified by known unique
			// IDs. glTF files always do the latter, and `.drc` files typically do the former.
			if ( taskConfig.useUniqueIDs ) {

				attributeID = attributeIDs[ attributeName ];
				attribute = decoder.GetAttributeByUniqueId( dracoGeometry, attributeID );

			} else {

				attributeID = decoder.GetAttributeId( dracoGeometry, draco[ attributeIDs[ attributeName ] ] );

				if ( attributeID === -1 ) continue;

				attribute = decoder.GetAttribute( dracoGeometry, attributeID );

			}

			const attributeResult = decodeAttribute( draco, decoder, dracoGeometry, attributeName, attributeType, attribute );

			if ( attributeName === 'color' ) {

				attributeResult.vertexColorSpace = taskConfig.vertexColorSpace;

			}

			geometry.attributes.push( attributeResult );

		}

		// Add index.
		if ( geometryType === draco.TRIANGULAR_MESH ) {

			geometry.index = decodeIndex( draco, decoder, dracoGeometry );

		}

		draco.destroy( dracoGeometry );

		return geometry;

	}

	function decodeIndex( draco, decoder, dracoGeometry ) {

		const numFaces = dracoGeometry.num_faces();
		const numIndices = numFaces * 3;
		const byteLength = numIndices * 4;

		const ptr = draco._malloc( byteLength );
		decoder.GetTrianglesUInt32Array( dracoGeometry, byteLength, ptr );
		const index = new Uint32Array( draco.HEAPF32.buffer, ptr, numIndices ).slice();
		draco._free( ptr );

		return { array: index, itemSize: 1 };

	}

	function decodeAttribute( draco, decoder, dracoGeometry, attributeName, attributeType, attribute ) {

		const numComponents = attribute.num_components();
		const numPoints = dracoGeometry.num_points();
		const numValues = numPoints * numComponents;
		const byteLength = numValues * attributeType.BYTES_PER_ELEMENT;
		const dataType = getDracoDataType( draco, attributeType );

		const ptr = draco._malloc( byteLength );
		decoder.GetAttributeDataArrayForAllPoints( dracoGeometry, attribute, dataType, byteLength, ptr );
		const array = new attributeType( draco.HEAPF32.buffer, ptr, numValues ).slice();
		draco._free( ptr );

		return {
			name: attributeName,
			array: array,
			itemSize: numComponents
		};

	}

	function getDracoDataType( draco, attributeType ) {

		switch ( attributeType ) {

			case Float32Array: return draco.DT_FLOAT32;
			case Int8Array: return draco.DT_INT8;
			case Int16Array: return draco.DT_INT16;
			case Int32Array: return draco.DT_INT32;
			case Uint8Array: return draco.DT_UINT8;
			case Uint16Array: return draco.DT_UINT16;
			case Uint32Array: return draco.DT_UINT32;

		}

	}

}

let _activeLoaders = 0;


class KTX2Loader extends KTX2Loader$1 {

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
				jsContent = this._loadLibrary( 'basis_transcoder.js', 'text' );
			    binaryContent = this._loadLibrary( 'basis_transcoder.wasm', 'arraybuffer' );
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

var lzma = function(){var pp, n0 = 0x10000000000000000, n1 = 4294967295, n2 = 2147483647, n3 = 2147483648;
function r(e,r){pp({action:nr,cbn:r,result:e});}function o(e){var r=[];return r[e-1]=void 0,r}function n(e,r){return i(e[0]+r[0],e[1]+r[1])}
function t(e,r){var o,n;return e[0]==r[0]&&e[1]==r[1]?0:(o=0>e[1],n=0>r[1],o&&!n?-1:!o&&n?1:d(e,r)[1]<0?-1:1)}
function i(e,r){var o,n;for(r%=n0,e%=n0,o=r%ir,n=Math.floor(e/ir)*ir,r=r-o+n,e=e-n+o;0>e;)e+=ir,r-=ir;for(;e>n1;)e-=ir,r+=ir;for(r%=n0;r>0x7fffffff00000000;)r-=n0;for(;-18446744073709552e3>r;)r+=n0;return [e,r]}
function u(e){return e>=0?[e,0]:[e+ir,-4294967296]}function s(e){return e[0]>=n3?~~Math.max(Math.min(e[0]-ir,n2),-2147483648):~~Math.max(Math.min(e[0],n2),-2147483648)}function d(e,r){return i(e[0]-r[0],e[1]-r[1])}
function c(e,r){return e.ab=r,e.cb=0,e.O=r.length,e}function m(e){return e.cb>=e.O?-1:255&e.ab[e.cb++]}function a(e){return e.ab=o(32),e.O=0,e}function _(e){var r=e.ab;return r.length=e.O,r}
function f(e,r,o,n){p(r,o,e.ab,e.O,n),e.O+=n;}function p(e,r,o,n,t){for(var i=0;t>i;++i)o[n+i]=e[r+i];}
function D(e,r,o){var n,t,i,s,d="",c=[];for(t=0;5>t;++t){if(i=m(r),-1==i)throw Error("truncated input");c[t]=i<<24>>24;}if(n=N({}),!z(n,c))throw Error("corrupted input");
for(t=0;64>t;t+=8){if(i=m(r),-1==i)throw Error("truncated input");i=i.toString(16),1==i.length&&(i="0"+i),d=i+""+d;}/^0+$|^f+$/i.test(d)?e.N=ur:(s=parseInt(d,16),e.N=s>n1?ur:u(s)),e.Q=B(n,r,o,e.N);}
function l(e,r){return e.S=a({}),D(e,c({},r),e.S),e}function g(e,r,o){var n=e.D-r-1;for(0>n&&(n+=e.c);0!=o;--o)n>=e.c&&(n=0),e.x[e.D++]=e.x[n++],e.D>=e.c&&w(e);}
function v(e,r){(null==e.x||e.c!=r)&&(e.x=o(r)),e.c=r,e.D=0,e.w=0;}function w(e){var r=e.D-e.w;r&&(f(e.V,e.x,e.w,r),e.D>=e.c&&(e.D=0),e.w=e.D);}
function R(e,r){var o=e.D-r-1;return 0>o&&(o+=e.c),e.x[o]}function h(e,r){e.x[e.D++]=r,e.D>=e.c&&w(e);}function P(e){w(e),e.V=null;}function C(e){return e-=2,4>e?e:3}
function S(e){return 4>e?0:10>e?e-3:e-6}function M(e,r){return e.h=r,e.bb=null,e.X=1,e}function L(e){if(!e.X)throw Error("bad state");if(e.bb)throw Error("No encoding");return y(e),e.X}
function y(e){var r=I(e.h);if(-1==r)throw Error("corrupted input");e.$=ur,e.Z=e.h.d,(r||t(e.h.U,sr)>=0&&t(e.h.d,e.h.U)>=0)&&(w(e.h.b),P(e.h.b),e.h.a.K=null,e.X=0);}
function B(e,r,o,n){return e.a.K=r,P(e.b),e.b.V=o,b(e),e.f=0,e.l=0,e.T=0,e.R=0,e._=0,e.U=n,e.d=sr,e.I=0,M({},e)}
function I(e){ var r,o,i,d,c,m;if(m=s(e.d)&e.P,Q(e.a,e.q,(e.f<<4)+m)){if(Q(e.a,e.E,e.f))i=0,
Q(e.a,e.s,e.f)?(Q(e.a,e.u,e.f)?(Q(e.a,e.r,e.f)?(o=e._,e._=e.R):o=e.R,e.R=e.T):o=e.T,e.T=e.l,e.l=o):Q(e.a,e.n,(e.f<<4)+m)||(e.f=7>e.f?9:11,i=1),
i||(i=x(e.o,e.a,m)+2,e.f=7>e.f?8:11);else if(e._=e.R,e.R=e.T,e.T=e.l,i=2+x(e.C,e.a,m),e.f=7>e.f?7:10,c=q(e.j[C(i)],e.a),c>=4){if(d=(c>>1)-1,e.l=(2|1&c)<<d,14>c)e.l+=J(e.J,e.l-c-1,e.a,d);
else if(e.l+=U(e.a,d-4)<<4,e.l+=F(e.t,e.a),0>e.l)return  -1==e.l?1:-1}else e.l=c;if(t(u(e.l),e.d)>=0||e.l>=e.m)return  -1;
g(e.b,e.l,i),e.d=n(e.d,u(i)),e.I=R(e.b,0);}else r=Z(e.k,s(e.d),e.I),e.I=7>e.f?T(r,e.a):$(r,e.a,R(e.b,e.l)),h(e.b,e.I),e.f=S(e.f),e.d=n(e.d,dr);return 0}
function N(e){e.b={},e.a={},e.q=o(192),e.E=o(12),e.s=o(12),e.u=o(12),e.r=o(12),e.n=o(192),e.j=o(4),e.J=o(114),e.t=K({},4),e.C=G({}),e.o=G({}),e.k={};for(var r=0;4>r;++r)e.j[r]=K({},6);return e}
function b(e){e.b.w=0,e.b.D=0,X(e.q),X(e.n),X(e.E),X(e.s),X(e.u),X(e.r),X(e.J),H(e.k);for(var r=0;4>r;++r)X(e.j[r].B);A(e.C),A(e.o),X(e.t.B),V(e.a);}
function z(e,r){var o,n,t,i,u,s,d;if(5>r.length)return 0;for(d=255&r[0],t=d%9,s=~~(d/9),i=s%5,u=~~(s/5),o=0,n=0;4>n;++n)o+=(255&r[1+n])<<8*n;return o>99999999||!W(e,t,i,u)?0:O(e,o)}
function O(e,r){return 0>r?0:(e.z!=r&&(e.z=r,e.m=Math.max(e.z,1),v(e.b,Math.max(e.m,4096))),1)}
function W(e,r,o,n){if(r>8||o>4||n>4)return 0;E(e.k,o,r);var t=1<<n;return k(e.C,t),k(e.o,t),e.P=t-1,1}function k(e,r){for(;r>e.e;++e.e)e.G[e.e]=K({},3),e.H[e.e]=K({},3);}
function x(e,r,o){if(!Q(r,e.M,0))return q(e.G[o],r);var n=8;return n+=Q(r,e.M,1)?8+q(e.L,r):q(e.H[o],r)}function G(e){return e.M=o(2),e.G=o(16),e.H=o(16),e.L=K({},8),e.e=0,e}
function A(e){X(e.M);for(var r=0;e.e>r;++r)X(e.G[r].B),X(e.H[r].B);X(e.L.B);}
function E(e,r,n){var t,i;if(null==e.F||e.g!=n||e.y!=r)for(e.y=r,e.Y=(1<<r)-1,e.g=n,i=1<<e.g+e.y,e.F=o(i),t=0;i>t;++t)e.F[t]=j({});}
function Z(e,r,o){return e.F[((r&e.Y)<<e.g)+((255&o)>>>8-e.g)]}function H(e){var r,o;for(o=1<<e.g+e.y,r=0;o>r;++r)X(e.F[r].v);}
function T(e,r){var o=1;do o=o<<1|Q(r,e.v,o);while(256>o);return o<<24>>24}
function $(e,r,o){var n,t,i=1;do if(t=o>>7&1,o<<=1,n=Q(r,e.v,(1+t<<8)+i),i=i<<1|n,t!=n){for(;256>i;)i=i<<1|Q(r,e.v,i);break}while(256>i);return i<<24>>24}
function j(e){return e.v=o(768),e}function K(e,r){return e.A=r,e.B=o(1<<r),e}function q(e,r){var o,n=1;for(o=e.A;0!=o;--o)n=(n<<1)+Q(r,e.B,n);return n-(1<<e.A)}
function F(e,r){var o,n,t=1,i=0;for(n=0;e.A>n;++n)o=Q(r,e.B,t),t<<=1,t+=o,i|=o<<n;return i}function J(e,r,o,n){var t,i,u=1,s=0;for(i=0;n>i;++i)t=Q(o,e,r+u),u<<=1,u+=t,s|=t<<i;return s}
function Q(e,r,o){var n,t=r[o];return n=(e.i>>>11)*t,(-2147483648^n)>(-2147483648^e.p)?(e.i=n,r[o]=t+(2048-t>>>5)<<16>>16,-16777216&e.i||(e.p=e.p<<8|m(e.K),e.i<<=8),0):(e.i-=n,e.p-=n,r[o]=t-(t>>>5)<<16>>16,
-16777216&e.i||(e.p=e.p<<8|m(e.K),e.i<<=8),1)}
function U(e,r){var o,n,t=0;for(o=r;0!=o;--o)e.i>>>=1,n=e.p-e.i>>>31,e.p-=e.i&n-1,t=t<<1|1-n,-16777216&e.i||(e.p=e.p<<8|m(e.K),e.i<<=8);return t}
function V(e){e.p=0,e.i=-1;for(var r=0;5>r;++r)e.p=e.p<<8|m(e.K);}function X(e){for(var r=e.length-1;r>=0;--r)e[r]=1024;}
function Y(e){ for(var r,o,n,t=0,i=0,u=e.length,s=[],d=[];u>t;++t,++i){
if(r=255&e[t],128&r)if(192==(224&r)){if(t+1>=u)return e;if(o=255&e[++t],128!=(192&o))return e;d[i]=(31&r)<<6|63&o;}else {if(224!=(240&r))return e;if(t+2>=u)return e;
if(o=255&e[++t],128!=(192&o))return e;if(n=255&e[++t],128!=(192&n))return e;d[i]=(15&r)<<12|(63&o)<<6|63&n;}else {if(!r)return e;
d[i]=r;}16383==i&&(s.push(String.fromCharCode.apply(String,d)),i=-1);}return i>0&&(d.length=i,s.push(String.fromCharCode.apply(String,d))),s.join("")}
function er(e){return e[1]+e[0]}
function rr(e,o,n){function t(){try{for(var e,r=0,u=(new Date).getTime();L(c.d.Q);)if(++r%1e3==0&&(new Date).getTime()-u>200)return s&&(i=er(c.d.Q.h.d)/d,n(i)),tr(t,0),0;
n(1),e=Y(_(c.d.S)),tr(o.bind(null,e),0);}catch(m){o(null,m);}} var i,u,s,d,c={},m=void 0===o&&void 0===n;
if("function"!=typeof o&&(u=o,o=n=0),n=n||function(e){return void 0!==u?r(s?e:-1,u):void 0},
o=o||function(e,r){return void 0!==u?pp({action:or,cbn:u,result:e,error:r}):void 0},m){for(c.d=l({},e);L(c.d.Q););return Y(_(c.d.S))}
try{c.d=l({},e),d=er(c.d.N),s=d>-1,n(0);}catch(a){return o(null,a)}tr(t,0);}
var or=2,nr=3,tr="function"==typeof setImmediate?setImmediate:setTimeout,ir=4294967296,ur=[n1,-4294967296],sr=[0,0],dr=[1,0];
return {decompress:rr}
}();

const LZMA = {

    decompress:( r, callback ) => {
        lzma.decompress( new Uint8Array( r ), callback );
    },
};
/*
  var action_compress   = 1, action_decompress = 2, action_progress   = 3

  export class LZMA {

    constructor( lzma_path ) {
   // export class LZMA = function (lzma_path) {
        
            
            this.callback_obj = {}
            
            ///NOTE: Node.js needs something like "./" or "../" at the beginning.
            this.lzma_worker = new Worker(lzma_path || "./lzma_worker-min.js");
        
        this.lzma_worker.onmessage = function onmessage(e) {
            if (e.data.action === action_progress) {
                if (this.callback_obj[e.data.cbn] && typeof this.callback_obj[e.data.cbn].on_progress === "function") {
                    this.callback_obj[e.data.cbn].on_progress(e.data.result);
                }
            } else {
                if (this.callback_obj[e.data.cbn] && typeof this.callback_obj[e.data.cbn].on_finish === "function") {
                    this.callback_obj[e.data.cbn].on_finish(e.data.result, e.data.error);
                    
                    /// Since the (de)compression is complete, the callbacks are no longer needed.
                    delete this.callback_obj[e.data.cbn];
                }
            }
        }.bind(this)
        
        /// Very simple error handling.
        this.lzma_worker.onerror = function(event) {
            var err = new Error(event.message + " (" + event.filename + ":" + event.lineno + ")");
            
            for (var cbn in this.callback_obj) {
                this.callback_obj[cbn].on_finish(null, err);
            }
            
            console.error('Uncaught error in lzma_worker', err);
        }.bind(this)
        
    }

    send_to_worker(action, data, mode, on_finish, on_progress) {
        var cbn;
        
        do {
            cbn = Math.floor(Math.random() * (10000000));
        } while(typeof this.callback_obj[cbn] !== "undefined");
        
        this.callback_obj[cbn] = {
            on_finish:   on_finish,
            on_progress: on_progress
        };
        
        this.lzma_worker.postMessage({
            action: action, /// action_compress = 1, action_decompress = 2, action_progress = 3
            cbn:    cbn,    /// callback number
            data:   data,
            mode:   mode
        });
    }

    compress(mixed, mode, on_finish, on_progress) {
        this.send_to_worker(action_compress, mixed, mode, on_finish, on_progress);
    }
    decompress(byte_arr, on_finish, on_progress) {
        this.send_to_worker(action_decompress, byte_arr, false, on_finish, on_progress);
    }
    worker() {
        return this.lzma_worker;
    }
}
*/

const GlbTool = {

	getMesh:( scene, multyMaterialGroup ) => {
        let meshs = {};

        if( multyMaterialGroup ){

            const oldGroup = {};
            const newMesh = {};

            scene.traverse( ( child ) => {
                if ( child.isGroup ){
                    let m = GlbTool.groupToMesh(child);
                    if(m){
                        m.applyMatrix4( child.matrix );
                        oldGroup[child.name] = child;
                        newMesh[child.name] = m;
                    } 
                }
            });

            // remove old group and add remplace mesh
            let parent;
            for(let k in oldGroup){

                //console.log( 'Group remplaced: ', k)
                parent = oldGroup[k].parent;
                parent.remove(oldGroup[k]);
                parent.add(newMesh[k]);

            }

            /*let oldGroup = []
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
              /*          nMesh.push(m);

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

            }*/

        }
        //if( keepMaterial ) GlbTool.keepMaterial( scene )
        scene.traverse( ( child ) => {
            if ( child.isMesh ) meshs[ child.name ] = child;
        });
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
            	groups[ child.name ] = autoMesh ? GlbTool.groupToMesh(child) : child;
            }
        });
        return groups;

    },

    // Material should be name like 
    // 0_concret
    // 10_silver ...

    getMaterial:( scene ) => {

    	const Mats = {};
        let names = [];
        let m;

        scene.traverse( ( child ) => {

            if ( child.isMesh ){ 

            	m = child.material;

            	if( names.indexOf(m.name) === -1 ){

                    names.push(m.name);
            		//Shader.add( m );
                    
            		Mats[m.name] = m;

                    //if( m.color ) m.color.convertSRGBToLinear();
                    //if( m.vertexColors ) m.vertexColors = false;
            		
            	}

            }
        });

        return Mats;

    },

    // convert multymaterial group to mesh

    groupToMesh: ( group ) => {

    	if( group.children[0].name !== (group.name + '_1') ) return false
    	if( !group.children[0].isMesh ) return false

    	let geometry = [];
        let material = [];
        let i = group.children.length;

        while(i--){

            material[i] = group.children[i].material;
			geometry[i] = group.children[i].geometry;
            geometry[i].group = i;

		}

		let mesh = new Mesh( new mergeGeometries( geometry, true ), material);
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
        });

		let oName, tName, target, id, g, gm, j, dp, dn, ar, m;
		

		for ( let name in morph ){

			oName = name.substring( 0, name.indexOf('__') );
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
                        while(j--) ar[j] = gm.attributes.position.array[j] - g.attributes.position.array[j];
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

                    target.morphTargetInfluences.push(0);
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
					console.warn( 'Morph '+ tName + ' target is no good on ' + target.name );
				}

			}

		}

		morph = {};

		// claer garbege
		j = tmpMesh.length;
		while(j--){
            m = tmpMesh[j];
			if( m.parent ) m.parent.remove( m );
			if( m.material ) m.material.dispose();
			if( m.geometry ) m.geometry.dispose();
		}

	},


};

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/

const Pool = {

    manager: new LoadingManager(),
    renderer: null,

    msg:'',
    inLoad:false,

    clip:[],
    data: new Map(),
    tmp: [],

    lzma:null,
    //extraTexture: [],
    dracoLoader: null,
    //dracoLoaderType:'js',
    dracoPath:'./build/draco/',
    basisPath:'./build/basis/',

    useLocal:false,

    formatGltf : {
        draco:true,
        ktx2: false,
        meshop: false,
    },

    setSupport: ( o ) => {

        for(let m in o){
            if(Pool.formatGltf[m]) Pool.formatGltf[m] = o[m];
        }

    },


    maxAnisotropy:1,

    onLoad:() => {},
    onEnd:() => {},
    log: ( msg ) => {},

    materialRoot:(n) => {console.log( n );},

    setLoadEvent:( onload, onend ) => {
        Pool.onLoad = onload;
        Pool.onEnd = onend;
    },

    prefix:( type ) => {
        let p = '';
        switch( type ){
            case 'S': case 'sound': case 'mp3': case 'wav': case 'ogg': p = 'S_';  break;
            case 'I': case 'image': case 'jpg': case 'png': p = 'I_';  break;
            case 'E': case 'hdr': case 'env': p = 'T_';  break;
            case 'J': case 'json': p = 'J_';  break;
            case 'JS': case 'js': p = 'JS_';  break;
            case 'H':  case 'bin': case 'hex': p = 'H_';  break;
            
            case 'O': case 'object3d': p = 'O_';  break;
            case 'M': case 'material': p = 'M_';  break;
            case 'T': case 'texture': p = 'T_';  break;
        }
        return p
    },

    dispose:() => {

        Pool.data.forEach( function( node, key ) {

            if( node.isMaterial || node.isTexture ){ 
                node.dispose();
                Pool.data.delete( key );
                //console.log( key + ' is delete')
            }

            if( node.isObject3D ){
                node.traverse( function ( snode ) {
                    if ( snode.isMesh ){
                        if( snode.geometry ) snode.geometry.dispose();
                        if( snode.material ){ 
                            if(snode.material.dispose) snode.material.dispose();
                        }
                    }
                });
                Pool.data.delete( key );
            }
           

        });

        //console.log('clear extra texture !!')
        /*let i = Pool.extraTexture.length
        while(i--){
            let p = Pool.get( Pool.extraTexture[i], 'T' )
            if(p) p.dispose();
            Pool.delete( Pool.extraTexture[i], 'T' )
        }
        Pool.extraTexture = [];*/
    
    },
    
    createElementNS: ( name ) => ( document.createElementNS( 'http://www.w3.org/1999/xhtml', name ) ),
    exist: ( name, type = '' ) => ( Pool.get( name, type ) ? true : false ),
    delete: ( name, type = '' ) => ( Pool.data.delete( Pool.prefix( type ) + name ) ),
    get: ( name, type = '' ) => ( Pool.data.get( Pool.prefix( type ) + name ) ),

    set: ( name, node, type = '', direct ) => {
        if( !node ){ 
            console.log('Loading error on ' + name); 
            return; 
        }
        if( node.isMaterial ){ 
            type = 'material';
            node.name = name;
            Pool.materialRoot( node, direct );
        }
        if( node.isTexture ) type = 'texture';
        if( node.isObject3D ) type = 'object3d';
        
        if( Pool.get( name, type ) ) return
        Pool.data.set( Pool.prefix( type ) + name, node );
    },

    getScript: ( name ) => ( Pool.data.get( Pool.prefix( 'js' ) + name ) ),

    getMaterials:( obj ) => {
        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        return GlbTool.getMaterial( obj )
    },

    getGLB:( obj, multyMaterialGroup ) => {
        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        if(!obj) return console.error('Not find Model ?')
        if(multyMaterialGroup) GlbTool.getMesh( obj, multyMaterialGroup );

    
        return obj
    },

    /*getMaterialList:( obj, keepMaterial ) => {
        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        if(!obj) return console.error('Not find Model ?')
        return GlbTool.getMesh( obj, keepMaterial )
    },*/

    getMesh:( obj, multyMaterialGroup ) => {

        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        if(!obj) return console.error('Not find Model ?')
        return GlbTool.getMesh( obj, multyMaterialGroup );

    },

    getGroup:( obj, autoMesh, autoMaterial ) => {
        if( typeof obj === 'string' ) obj = Pool.get( obj, 'O' );
        return GlbTool.getGroup( obj, autoMesh, autoMaterial )
    },

    applyMorph( modelName, meshs = null, normal = true, relative = true ){

        let model;
        if( modelName.isObject3D ) model = modelName;
        else model = Pool.get( modelName, 'O' );

        if( !meshs ) meshs = Pool.getMesh( modelName );
        if( !model || !meshs ) return
        GlbTool.autoMorph( model, meshs, normal, relative );

    },

    uv2( model ){
        GlbTool.uv2( model );
    },

    symetric( model ){
        GlbTool.symetric( model );
    },

    objectSpaceNormal( model ){
        // glTF currently supports only tangent-space normal maps.
        // this model has been modified to demonstrate the use of an object-space normal map.

        model.material.normalMapType = ObjectSpaceNormalMap;

        // attribute normals are not required with an object-space normal map. remove them.
        //model.geometry.deleteAttribute( 'normal' );
        //model.geometry.deleteAttribute( 'tangent' );

        //console.log(model, model.material)
    },

    add: ( name, node, type ) => {
        Pool.set( name, node, type );
        Pool.next();
        //console.log( name, type )
    },

    getMaterial:( name ) => ( Pool.data.get( 'M_' + name ) ),

    //getMap:( name, o = {} ) => ( Pool.getTexture(name, o) ),


    //--------------------
    //   TEXTURES
    //--------------------

    texture:( o = {} ) => {

        if( !Pool.loaderMap ) Pool.loaderMap = new TextureLoader();

        let name = o.name || '';
        let type = o.format || '';

        if( o.url ){ 
            if( o.url.lastIndexOf('.') !==-1 ){ 
                name = o.url.substring( o.url.lastIndexOf('/')+1, o.url.lastIndexOf('.') );
                type = o.url.substring( o.url.lastIndexOf('.')+1 ).toLowerCase();
            }
            else name = o.url.substring( o.url.lastIndexOf('/')+1 );
        }


        if( name.search('_c') !== -1 || name.search('_l') !== -1 || name.search('_u') !== -1|| name.search('_d') !== -1) o.srgb = true;

        if( Pool.exist( name, 'texture' )) return Pool.get( name, 'texture' );
        else if( Pool.exist( name, 'image' )) {
            //console.log('preload', name )
            return Pool.getTexture( name, o );
        } else {


            switch(type){
                case 'ktx2':
                const texture = new CompressedTexture();
                Pool.data.set( 'T_' + name, texture );
                Pool.loaderKTX2().load( o.url, function ( t ) { 

                    Pool.setTextureOption( t, o );

                    texture.copy(t);

                    t.dispose();
                    //Pool.setTextureOption( texture, o );
                    
                    if( o.callback ) o.callback();

                });
                return texture
                default:
                return Pool.loaderMap.load( o.url, function ( t ) { 
                    //console.log('use TextureLoader !!', name )
                    Pool.setTextureOption( t, o );
                    Pool.data.set( 'T_' + name, t );
                    if( o.callback ) o.callback();
                    return t
                })

            }

            /*return Pool.loaderMap.load( o.url, function ( t ) { 
                //console.log('use TextureLoader !!', name )
                Pool.setTextureOption( t, o );
                Pool.data.set( 'T_' + name, t );
                if( o.callback ) o.callback()
                return t
            })*/

            
        }
            
        

    },

    getTexture:( name, o = {} ) => {

        let k = o.quality ? o.quality+'k_' : ''; 
        name = k + name;

        //console.log(name)

        let t = Pool.get( name, 'texture' );
        if(!t){
            let im = Pool.get( name, 'image' );
            if(!im){ 
                //console.log('not find image', name );
                return null
            }
            t = new Texture( im );
            if( name.search('_c') !== -1 || name.search('_d') !== -1 || name.search('_l') !== -1 || name.search('_u') !== -1 ) o.srgb = true;
            Pool.setTextureOption( t, o );
            Pool.data.set( 'T_' + name, t );
        }

        //console.log(name, o.srgb)
        
        return t;
    },

    setTextureOption:( t, o = {} ) => {

        //if( o.colorSpace ) t.colorSpace = o.colorSpace;
        t.colorSpace = o.encoding || o.srgb ? SRGBColorSpace : NoColorSpace;
        
        t.flipY = o.flipY!== undefined || o.flip !== undefined ? o.flipY : false;

        if( o.anisotropy ){
            t.anisotropy = o.anisotropy === 'max' ? Pool.maxAnisotropy : o.anisotropy;
        }
           
        //if( o.anisotropy !== undefined ) t.anisotropy = o.anisotropy
        if( o.generateMipmaps !== undefined ) t.generateMipmaps = o.generateMipmaps;
        if( o.repeat ){
            t.repeat.fromArray( o.repeat );
            t.wrapS = t.wrapT = RepeatWrapping;
        }

        //t.minFilter = LinearMipmapLinearFilter
        //t.premultiplyAlpha = true



        if( o.center ) t.center.fromArray( o.center );
        if( o.offset ) t.offset.fromArray( o.offset );
        
        if( o.filter ){
            if( o.filter === 'near' ){
                t.minFilter = NearestFilter;
                t.magFilter = NearestFilter;
            }
        }

        if( o.channel ) t.channel = o.channel;
        t.needsUpdate = true;

    },

    

    ///

    loadAsync: ( Urls, Path = '', msg = '' ) => {

        return new Promise((resolve, reject) => {

            Pool.waiting = true;
            Pool.load( Urls, () => { Pool.waiting = false; }, Path, msg );

            //if (!Pool.waiting) resolve()
            //Pool.load( Urls, resolve, Path, msg );

        })

    },

    ///

    load: ( Urls, Callback, Path = '', msg = '', quality = 0 ) => {

        Pool.msg = msg;

        let urls = [];
        let callback = Callback || function(){};
        let start = ( typeof performance === 'undefined' ? Date : performance ).now();

        if ( typeof Urls === 'string' || Urls instanceof String ) urls.push( Urls );
        else urls = urls.concat( Urls );

        Pool.tmp.push( { urls:urls, path:Path, callback:callback, start:start, quality:quality } );

        if( !Pool.inLoad ) Pool.loadOne();

    },

    loadOne: () => {

        Pool.inLoad = true;
        Pool.onLoad();

        let url = Pool.tmp[0].path + Pool.tmp[0].urls[0];
        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        let type = url.substring( url.lastIndexOf('.')+1 ).toLowerCase();

        if( type==='jpg' || type==='png' ) name = (Pool.tmp[0].quality ? Pool.tmp[0].quality+'k_':'') + name;

        //console.log(name)

        if( Pool.exist( name, type ) ) Pool.next();
        else Pool.loading( url, name, type );

    },

    next: () => {

        Pool.tmp[0].urls.shift();

        if( Pool.tmp[0].urls.length === 0 ){

            Math.floor(( typeof performance === 'undefined' ? Date : performance ).now() - Pool.tmp[0].start);

            //if( end !== 0 ) console.log( 'pool load time:', end, 'ms' );
            
            Pool.tmp[0].callback();
            Pool.tmp.shift();

            if( Pool.tmp.length > 0 ) Pool.loadOne();
            else {
                Pool.inLoad = false;
                Pool.clearDRACO();
                Pool.clearKTX2();
                Pool.onEnd();
            }

        } else {

            Pool.loadOne();

        }

    },

    loading: ( url, name, type ) => {

        Pool.log( Pool.msg );

        switch( type ){
            
            case 'glb': case 'gltf': Pool.load_GLTF( url, name );  break;
            case 'fbx': case 'FBX': Pool.load_FBX( url, name ); break;
            case 'obj': Pool.load_OBJ( url, name ); break;
            case 'stl': Pool.load_STL( url, name ); break;

            case 'ktx2': Pool.load_KTX2( url, name );  break;
            case 'hdr': Pool.load_RGBE( url, name ); break;
            case 'exr': Pool.load_EXR( url, name ); break;
            default: Pool.extand( url, name, type );
        }

    },

    extand: ( url, name, type ) => {

        if( !Pool.XHTTP ) Pool.XHTTP = new XMLHttpRequest();
        const xml = Pool.XHTTP;

        xml.open('GET', url, true );
        if(type === "json") xml.overrideMimeType( "application/json");

        switch( type ){

            case 'bin': case 'hex': case 'wasm': case 'mp3': case 'wav': case 'ogg': xml.responseType = "arraybuffer"; break;
            case 'jpg': case 'png': xml.responseType = 'blob'; break;
            case 'bvh': case 'glsl': case 'js':  case 'json': xml.responseType = 'text'; break;

        }

        xml.onreadystatechange = function () {

            if ( xml.readyState === 4 ) {
            	if (xml.status >= 300) {
                    console.log("Error, status code = " + xml.status);
                } else {
                    //console.log(xml.response)
                	Pool.direct( xml.response, name, type );
                    //Pool.add( name, JSON.parse( xhr.responseText ), 'json' )
                }
                //if ( Pool.XML.status === 200 || Pool.XML.status === 0 ) Pool.load_direct( Pool.XML.response, name, type );
                //else console.error( "Couldn't load ["+ name + "] [" + Pool.XML.status + "]" );
            }

        };

        if ('onprogress' in xml){
            xml.onprogress = function(e) {
                //console.log( parseInt((e.loaded / e.total) * 100) );
            };
        }

        xml.send(null);

    },

    direct: ( response, name, type ) => {

        switch( type ){
        	case 'jpg': case 'png':
                let img = Pool.createElementNS('img');
                img.onload = function(e) {
                    window.URL.revokeObjectURL( img.src ); // Clean up after yourself.
                    Pool.add( name, img, 'image' );
                };
                img.src = window.URL.createObjectURL( response );

        	    /*let img = Pool.createElementNS('img');
	            img.src = window.URL.createObjectURL( new Blob([response]) );
                //img.onload = function(){
                    console.log(img)
                    Pool.add( name, img, 'image' );
                //}*/
        	break;
            case 'mp3': case 'wav': case 'ogg':
                AudioContext.getContext().decodeAudioData(
                    response.slice( 0 ),
                    function( buffer ){ Pool.add( name, buffer, 'sound' ); },
                    function( error ){ console.error('decodeAudioData error', error); }
                );
            break;
            case 'hex': case 'bin': LZMA.decompress( response, ( result ) => { Pool.add( name, result, type ); }); break;
            case 'wasm': Pool.add( name, new Uint8Array( response ), type ); break;
            case 'json': Pool.add( name, JSON.parse( response ), type ); break;
            case 'js': Pool.add( name, response, type ); break;
            default: Pool.add( name, response, type );

        }

    },

    //----------------------------
    //
    //       CLEAR MEMORY
    //
    //----------------------------

    clearKTX2: () => {

        if( Pool.KTX2 ){
            Pool.KTX2.dispose();
            Pool.KTX2 = null;
        }

    },

    clearDRACO: () => {

        if( Pool.dracoLoader ){
            Pool.dracoLoader.dispose();
            Pool.dracoLoader = null;
        }

        if( Pool.GLTF ){
            Pool.GLTF = null;
        }

    },


    //----------------------------
    //
    //         LOADER
    //
    //----------------------------

    loaderFILE: () => {

        if( !Pool.FILE ) Pool.FILE = new FileLoader( Pool.manager );
        return Pool.FILE

    },

    loaderDRACO: () => {

        if( Pool.dracoLoader ) return Pool.dracoLoader

        if( !Pool.dracoLoaderType ){
            if ( navigator.userAgentData ) Pool.dracoLoaderType = 'wasm';
            else {
                let ua = navigator.userAgent.toLowerCase();
                Pool.dracoLoaderType = (ua.indexOf('safari') !== -1 && ua.indexOf('chrome') === -1) ? 'js' : 'wasm';
            }
        }

        Pool.dracoLoader = new DRACOLoader()
            .setDecoderConfig( { type: Pool.dracoLoaderType } )
            .setDecoderPath( Pool.dracoPath )
            .setUseLocal( Pool.useLocal );
            //.setWorkerLimit(1)

        return Pool.dracoLoader

    },

    loaderKTX2: () => {

        if( Pool.KTX2 ) return Pool.KTX2

        Pool.KTX2 = new KTX2Loader( Pool.manager )
            .setTranscoderPath( Pool.basisPath )
            .detectSupport( Pool.renderer )
            .setUseLocal( Pool.useLocal );
        
        return Pool.KTX2

    },

    loaderGLTF: () => {

        if( !Pool.GLTF ){
            Pool.GLTF = new GLTFLoader( Pool.manager )
            .setCrossOrigin('anonymous');

            if(Pool.formatGltf.draco) Pool.GLTF.setDRACOLoader( Pool.loaderDRACO() );
            if(Pool.formatGltf.ktx2) Pool.GLTF.setKTX2Loader( Pool.loaderKTX2() );
            if(Pool.formatGltf.meshop) Pool.GLTF.setMeshoptDecoder( MeshoptDecoder );
        }
        return Pool.GLTF

    },

    loaderFBX: () => {

        if( !Pool.FBX ) Pool.FBX = new FBXLoader( Pool.manager );
        return Pool.FBX

    },

    loaderSTL: () => {

        if( !Pool.STL ) Pool.STL = new STLLoader( Pool.manager );
        return Pool.STL

    },

    loaderOBJ: () => {

        if( !Pool.OBJ ) Pool.OBJ = new OBJLoader( Pool.manager );
        return Pool.OBJ

    },

    loaderRGBE: () => {

        if( !Pool.RGBE ) Pool.RGBE = new HDRLoader( Pool.manager );
        return Pool.RGBE

    },

    loaderEXR: () => {

        if( !Pool.EXR ) Pool.EXR = new EXRLoader( Pool.manager );
        return Pool.EXR

    },

    loaderUltra: () => {

        if( !Pool.ULTRA ) Pool.ULTRA = new UltraHDRLoader( Pool.manager ).setDataType( THREE.HalfFloatType );
        return Pool.ULTRA

    },

    //////////////////////////////////

    load_GLTF: ( url, name ) => {

        /*Pool.loaderGLTF().setDRACOLoader( Pool.loaderDRACO() ).load( url, function ( gltf ) { 
            Pool.add( name, gltf.scene )
            Pool.dracoLoader.dispose()
        })*/

        Pool.loaderGLTF().load( url, function ( gltf ) {

            const model = gltf.scene;

            //console.log(gltf.animations)

            if( gltf.animations ){ 
                const animations = gltf.animations;
                const mixer = new AnimationMixer( gltf.scene );
                model.mixer = mixer;
                model.actions = {};
                for ( let i = 0; i < animations.length; i ++ ) {
                    let anim = animations[ i ];
                    model.actions[ anim.name ] = mixer.clipAction( anim );
                    //model.actions[ anim.name ].play()
                }

                model.play = (name) => {
                    if(model.actions[ name ]){ 
                        model.actions[ name ].paused = false;
                        model.actions[ name ].time = 0;
                        model.actions[ name ].play();
                    }
                };
                model.pause = (name, v=true) => {
                    if(model.actions[ name ]) model.actions[ name ].paused = v;
                };
            }
            
            Pool.add( name, model );
            //Pool.clearDRACO()
        });

    },

    load_FBX: ( url, name ) => {

        Pool.loaderFBX().load( url, function ( node ) { Pool.add( name, node ); });

    },

    load_OBJ: ( url, name ) => {

        Pool.loaderOBJ().load( url, function ( node ) { Pool.add( name, node ); });

    },

    load_STL: ( url, name ) => {

        Pool.loaderSTL().load( url, function ( node ) { 
            let object = new Mesh( node );
            Pool.add( name, object ); 
        });

    },

    load_KTX2: ( url, name, cb ) => {

        Pool.loaderKTX2().load( url, function ( texture ) {
            Pool.add( name, texture ); 
            //console.log(texture)
            //if(cb) cb(texture)
            return texture
        });

    },

    load_RGBE: ( url, name ) => {

        Pool.loaderRGBE().load( url, function ( texture ) {
            texture.mapping = EquirectangularReflectionMapping; 
            Pool.add( name, texture ); 
        });

    },

    load_EXR: ( url, name, cb ) => {

        Pool.loaderEXR().load( url, function ( texture ) {
            //Pool.add( name, texture ) 
            //console.log(texture)
            if(cb) cb(texture);
            return texture
        });

    },

    direct_EXR: ( data, name ) => {

        Pool.loaderEXR().parse( url, function ( texture ) {
            Pool.add( name, texture );
            return texture
        });

    },

};



/*class SuperLoader extends Loader {

    constructor( manager ) {

        super( manager );
        this.decoderPath = '';

    }

}*/

class Tension {

	constructor( origin, target ) {


		this.target = target || origin;

		this.baseGeometry = origin.geometry;
		this.geometry = this.target.geometry;

		this.V = [ new Vector3(), new Vector3(), new Vector3() ];
		this.X = [ new Vector4(), new Vector4(), new Matrix4() ];
		this.M = [ new Vector3(), new Vector3(), new Vector3() ];

		this.isMorph = this.target.morphTargetInfluences ? true : false;
		this.isSkin = this.target.isSkinnedMesh ? true : false;

		this.init();

	}

	init(){

		if( this.geometry.attributes.position.count !== this.baseGeometry.attributes.position.count ){
			console.log('object not have same number of vertices !!');
			return
		}

		this.length = this.baseGeometry.attributes.position.count;
		this.indexLength = this.baseGeometry.index.count / 3 ;

		//console.log( this.length, this.indexLength )
		

		this.originEdges = new Array(this.length).fill(0);
		this.targetEdges = new Array(this.length).fill(0);

		if( this.isSkin || this.isMorph) this.back = new Array( this.length * 3 ).fill(0);
		this.num = new Array( this.length ).fill(0);

		this.getEdge( this.baseGeometry, this.originEdges );
		this.addColor();

		setTimeout( this.start.bind(this), 100 );

	}

	start(){
		this.ready = true;
		this.update();
	}

	addColor(){

		const g = this.geometry;
		//if( g.attributes.color ) return;
		let lng = g.attributes.position.array.length;
		g.setAttribute( 'color', new Float32BufferAttribute( new Array(lng).fill(0), 3 ) );

	}

	resetEdge( edges )
	{
		let j = edges.length;
		while(j--) edges[j] = 0;
	}

	getEdge( g, edges, isSkin = false, isMorph = false ) 
	{
		let positions = g.attributes.position.array;
		const indices = g.index.array;
		let vA = this.V[0], vB = this.V[1], vC = this.V[2];
		let j, i=0, a, b, c, ab, ac, bc;

		if( isMorph ) positions = this.getMorph();
		if( isSkin ) positions = this.getSkinned( positions );
		if( isSkin || isMorph ) this.resetEdge( edges );
		
		j = this.indexLength;

		while( j-- )
		{
		    a = indices[i];
		    b = indices[i+1];
		    c = indices[i+2];
		    vA.fromArray( positions, a * 3 );
		    vB.fromArray( positions, b * 3 );
		    vC.fromArray( positions, c * 3 );

		    ab = vA.distanceTo(vB);
		    ac = vA.distanceTo(vC);
		    bc = vB.distanceTo(vC);
	    
		    
		    edges[a] += (ab + ac)*0.5;
			edges[b] += (ab + bc)*0.5;
			edges[c] += (ac + bc)*0.5;
			
			/*
			edges[a] += (ab + ac);
			edges[b] += (ab + bc);
			edges[c] += (ac + bc);

			num[a] += 2;
			num[b] += 2;
			num[c] += 2;
			*/

			i+=3;
		}

		//j = this.length;
		//while( j-- ){ edges[j] /= num[j]; }
	}

	isZero(v){

		if(v.x===0 && v.y===0 && v.z ===0 ) return true
		return false

	}

	getMorph()
	{
		const morphInfluences = this.target.morphTargetInfluences;
		const morphRef = this.geometry.morphAttributes.position;
		const morphsMax = morphInfluences.length;
		const position = this.geometry.attributes.position.array;
		let lng = this.geometry.attributes.position.count, id, i, j;
		let vertex = this.M[0];
		let base = this.M[1];
		let temp = this.M[2];
		let relative = this.geometry.morphTargetsRelative;
		let data;

		 // the following code section is normally implemented in the vertex shader

		i = lng;
	    while(i--)
	    {
			id = i*3;
			base.fromArray( position, id );
			vertex.set( 0,0,0 );
			j = morphsMax;
			while(j--){

				if ( morphInfluences[ j ] != 0.0 ){
					data =  morphRef[j].data ? morphRef[j].data.array : morphRef[j].array;
					if( relative ) vertex.addScaledVector( temp.fromArray( data, id ), morphInfluences[ j ] );
					else vertex.addScaledVector( temp.fromArray( data, id ).sub(base), morphInfluences[ j ] );
				}

			}
			base.add( vertex );
			base.toArray( this.back, id );
		}
		return this.back

	}

	getSkinned( position )
	{

		const skeleton = this.target.skeleton;
	    skeleton.boneMatrices;
	    const geometry = this.geometry;
	    //const position = geometry.attributes.position.array;
	    const skinIndex = geometry.attributes.skinIndex.array;
	    const skinWeigth = geometry.attributes.skinWeight.array;

	    const bindMatrix = this.target.bindMatrix;
	    const bindMatrixInverse = this.target.bindMatrixInverse;

	    let vertex = this.V[0];
	    let skin = this.V[1];
	    let temp = this.V[2];
	    let skinIndices = this.X[0];
	    let skinWeights = this.X[1];
	    let boneMatrix = this.X[2];

	    let lng = geometry.attributes.position.count;
	    let i, j, boneIndex, weight, id;

	    // the following code section is normally implemented in the vertex shader
	    i = lng;
	    while(i--)
	    {
			id = i*3;
            skinIndices.fromArray( skinIndex, i*4 );
            skinWeights.fromArray( skinWeigth, i*4 );
            vertex.fromArray( position, id ).applyMatrix4( bindMatrix ); // transform to bind space
            skin.set( 0, 0, 0 );
            j = 4;
            while(j--)
            {
                weight = skinWeights.getComponent( j );
                if ( weight > 0 ) {
                	boneIndex = skinIndices.getComponent( j );
	                boneMatrix.multiplyMatrices( skeleton.bones[ boneIndex ].matrixWorld, skeleton.boneInverses[ boneIndex ] );
	                // weighted vertex transformation
	                skin.addScaledVector( temp.copy( vertex ).applyMatrix4( boneMatrix ), weight );
	            }

            }

            skin.applyMatrix4( bindMatrixInverse ); // back to local space
            skin.toArray( this.back, id );
        }
        return this.back
	}

	update() 
	{

		if(!this.ready) return

		this.getEdge( this.geometry, this.targetEdges, this.isSkin, this.isMorph );
		const color = this.geometry.attributes.color.array;
		let o, delta, n, i = this.length;

		while( i-- )
		{
			o = this.originEdges[i];
			delta = ( ( o - this.targetEdges[i] ) / o ) + 0.5;
			n = i*3;
			color[n] = delta > 0.5 ? (delta-0.5)*2 : 0;
			color[n+1] = 0;
			color[n+2] = delta < 0.5 ? (1-(delta*2)) : 0;
		}
		this.geometry.attributes.color.needsUpdate = true;
	}

}

class ExoSkeleton extends Object3D {

    constructor( object, skeleton ) {

        super();

        this.isReady = false;

        this.skeleton = skeleton;

        this.bones = this.skeleton.bones;//getBoneList( object );
        this.root = object;

        this.box = new BoxGeometry();

        //console.log(this.bones)

        //this.avatar = avatar;
        //this.nodes = [];
        this.mtxr = new Matrix4();
        this.mtx0 = new Matrix4();
        this.mtx1 = new Matrix4();

        this.mtx = new Matrix4();
        this.mtx2 = new Matrix4();

        this.p = new Vector3();
        this.s = new Vector3();
        this.q = new Quaternion$1();
        this.e = new Euler();

        this.mat = new MeshBasicMaterial({ color:0xCCCC80, wireframe:true, toneMapped:false });//root.mat.skinCollider;

        this.init();

        this.matrix = object.matrixWorld;
        this.matrixAutoUpdate = false;

    }

    updateMatrixWorld ( force ) {

        if( !this.isReady ) return;

        //THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

        let nodes = this.children;
        let i = nodes.length, node, bone;

        this.mtxr.copy( this.root.matrixWorld ).invert();

        //console.log('up', i)

        while( i-- ){

            node = nodes[i];
            bone = node.userData.bone;

            //this.mtx1.fromArray( this.skeleton.boneMatrices, bone.idx )

            this.mtx0.multiplyMatrices(this.mtxr, bone.matrixWorld );
            //this.mtx0.scale( bone.scalling );

            this.mtx.multiplyMatrices( this.mtx0, node.userData.decal );
            //this.mtx.multiplyMatrices( this.mtx1, this.mtx );


            this.mtx.decompose( this.p, this.q, this.s );


            node.position.copy( this.p );
            node.quaternion.copy( this.q );

            node.updateMatrix();

        }

        super.updateMatrixWorld( force );

    }

    init () {

        this.mtxr.copy( this.root.matrixWorld ).invert();

        // get character bones
        const bones = this.bones; //object.skeleton.bones;
        //let nodes = [];

        let p1 = new Vector3();
        let p2 = new Vector3();

        let i, lng = bones.length, name, n, bone, parent;
        let size, dist, type, translate, rot, fx;

        for( i = 0; i < lng; i++ ){

            type = null;
            bone = bones[i];
            name = bone.name;
            parent = bone.parent;

            //bone.updateMatrix()


            if( parent ) {

                //parent.updateMatrix()

                n = parent.name;

                p1.setFromMatrixPosition( parent.matrixWorld );
                p2.setFromMatrixPosition( bone.matrixWorld );

                //p1.setFromMatrixPosition( this.mtx.multiplyMatrices(this.mtxr, parent.matrixWorld ) ) //parent.matrixWorld );
                //p2.setFromMatrixPosition( this.mtx.multiplyMatrices(this.mtxr, bone.matrixWorld ) ) //bone.matrixWorld );
                dist = p1.distanceTo( p2 );

                //console.log(n, dist)

                translate = [ 0, 0, dist * 0.5 ];
                size = [ dist, 1, 1 ];
                rot = [0,0,0];

                fx = '_C';

                if( n==='head' && name === 'End_head' ){ type = 'box'; size = [ 0.16, 0.2, dist ]; translate = [ 0, 0.025, -dist * 0.5 ]; }
                if( n==='chest' && name==='neck' ){ type = 'box'; size = [  0.30, 0.28, dist ]; translate = [ 0, 0, -dist * 0.5 ]; }
                if( n==='abdomen' ){ type = 'box'; size = [ 0.28, 0.24,  dist+0.14 ]; rot[2] = 0; translate = [ 0, 0, -dist * 0.5 ];translate[2] += 0.07;}

                 // legs
                if( n==='rThigh' ){ type = 'box'; size = [  0.15, 0.15, dist ];  }
                if( n==='lThigh' ){ type = 'box'; size = [  0.15, 0.15 , dist];  }
                if( n==='rShin' ){ type = 'box'; size = [  0.12, 0.12, dist+ 0.1, ]; translate[2] += 0.05; }
                if( n==='lShin' ){ type = 'box'; size = [  0.12, 0.12, dist+ 0.1, ]; translate[2] += 0.05; }

                // arm
                if( n==='rShldr'  ){ type = 'box'; size = [   dist+ 0.06, 0.12, 0.12  ]; translate[0] = -translate[2]+0.03; translate[2]=0; }
                if( n==='lShldr'  ){ type = 'box'; size = [  dist+ 0.06,0.12,   0.12, ];  translate[0] = translate[2]-0.03; translate[2]=0; }
                if( n==='rForeArm' ){ type = 'box'; size = [  dist + 0.1,0.1,  0.1 ];  translate[0] = -translate[2]-0.05; translate[2]=0; }
                if( n==='lForeArm' ){ type = 'box'; size = [  dist + 0.1,0.1,  0.1]; translate[0] = translate[2]+0.05; translate[2]=0; }

                if( type !== null ) this.addMesh( parent, type, size, translate, rot, fx );

            }
        }

        this.isReady = true;

    }

    addMesh ( parent, type, size, translate, rot, fx ) {

        // translation
        //this.mtx.makeTranslation( translate[0], translate[1], translate[2] );
        this.mtx.makeTranslation( translate[0], translate[1], translate[2] );
        // rotation
        //this.mtx2.makeRotationFromEuler( this.e.set( rot[0]*math.torad, rot[1]*math.torad, rot[2]*math.torad ) );
        //this.mtx.multiply( this.mtx2 );

       //let box = new BoxGeometry( size[0], size[1], size[2])


        var mesh = new Mesh( this.box, this.mat );
        mesh.scale.fromArray(size);

        //mesh.name = fx;
        mesh.userData.decal = this.mtx.clone();
        mesh.userData.bone = parent;
        mesh.userData.size = size;


        this.add( mesh );

        //mesh.userData.avatar = this.avatar;

    }

    dispose () {
        this.children = [];
        this.box.dispose();
        this.mat.dispose();
        this.isReady = false;
    }

}

/*
function getBoneList( object ) {

    const boneList = [];

    if ( object.isBone === true ) {

        boneList.push( object );

    }

    for ( let i = 0; i < object.children.length; i ++ ) {

        boneList.push.apply( boneList, getBoneList( object.children[ i ] ) );

    }

    return boneList;

}*/

const setting$4 = {

    mixRatio:0.0,
    threshold:0.1,
    normal:0.25,
    hair:0x752002,//0xa43412,
    bow:0x100402,
    sheen:1,//2.25,
    sheenRoughness:0.6,//1.0,
    metalness:0.6,
    roughness:0.4,
    
    vertexColors:false,
    alphaTest:0.1,//0.3,
    h_metal:0.0,//0.4,
    h_rough:0.5,//0.6,
    clearcoat:1.0,

    wireframe:false,
    transparent:false,
    opacity:1.0,
    
};

const Human = {

    refSize:1.81,

	isBreath:false,
	isEyeMove:false,
	
    haveHair:true,
    haveBlink:true,

    haveMorph:true,
    morphNormal:false,
    morphRelative:false,

    haveLOD:true,

    levelHigh:['body', 'Head', 'crane', 'eyelash', 'eyebrow', 'tear', 'eye_l', 'eye_r', 'eye_l_s', 'eye_r_s'],
    levelHair:['hair', 'hair_man'],
    levelLow:['body_low'],

    skeletonRef:'body',
	fullMorph: ['MUSCLE', 'LOW', 'BIG','MONSTER'],//, 

    textureQuality:2,
	textureRef:'avatar_c',
	texturePath: 'assets/textures/avatar_',
	textures: [
        'avatar_c.jpg', 'avatar_n.jpg', 'avatar_t.jpg',//'avatar_m.jpg', 'avatar_r.jpg', 'avatar_u.jpg',
        'mouth_c.jpg', 'mouth_a.jpg', 'mouth_n.jpg', 
        'eye_c.jpg', 'eye_n.jpg', 'hair.jpg', 'hair_a.jpg',
        'eyelash_c.jpg', 'eyelash_a.jpg', 'eyelash_n.jpg',
        'hair_man.jpg', 'hair_man_a.jpg', 'avatar_ao.jpg',
    ],

    modelPath: 'assets/models/avatar/',
    forceModel: null,

    setting:setting$4,

    materialRef:'skin',

    materials:{
        skin:{
            type:'Sss',
            //type:'Physical',
            //type:'Standard',

            map: 'avatar_c', 
            normalMap:'avatar_n',

            //envMapIntensity:0.7,
            reflectivity:0.2,

            roughness:0.54,
            metalness:0.14,
            
            /*roughness:1,
            metalness:1,
            metalnessMap:'avatar_m',
            roughnessMap:'avatar_r',*/

            normalScale: new Vector2( setting$4.normal, -setting$4.normal ),
            sheenColor:0x600000,
            sheen:setting$4.sheen,
            sheenRoughness:setting$4.sheenRoughness,


            //sheenColorMap:'avatar_c',
            /*sheenColor:0xff0000,
            sheenColorMap:'avatar_u',
            iridescence:0.1,*/
            wireframe:setting$4.wireframe,

            aoMap:'avatar_ao',
            aoMapIntensity:1.0,

            //ior:1.4,
            vertexColors:false,

            sssMap:'avatar_t',
            sssColor:new Color( 0xee2323 ),
            sssAmbient:0.5,
            sssDistortion:0.6,
            sssAttenuation:0.1,
            sssScale:6.0
            
        },
    	mouth:{
            type:'Standard',
    		map:'mouth_c',
            roughness:0.02,
            metalness:0.0,
            vertexColors:false,
            //shadowSide: BackSide,
            //roughness:0.6,
            //metalness:0.6,
            alphaMap:'mouth_a',
            alphaTest:0.5,
            normalMap:'mouth_n',
            normalScale: new Vector2( 0.5, -0.5 ),
    	},
    	sub_eye:{
            type:'Physical',
            roughness:0,//0.568,
            metalness:1,
            ior:1.376,
            opacity:0.1,
           //blending:AdditiveBlending,
            clearcoat:1,
            transparent:true,
            //envMapIntensity:0,
            //wireframe:true
        },
        eye:{
            type:'Physical',
        	map:'eye_c',
            roughness:0.7,
            metalness:0.15,
            normalMap:'eye_n',
            normalScale:new Vector2( 2, -2),
            clearcoat:0.25,
            //clearcoatRoughness:0.5,
        },
        hair:{
            type:'Standard',
        	//map:'hair',
            color:setting$4.hair,
            aoMap:'hair',
            metalnessMap:'hair',
            //bumpScale:-5,
            roughness:0.6,//setting.h_rough,
            metalness:1.0,//setting.h_metal,
            alphaMap:'hair_a',
            //alphaTest:setting.alphaTest,
            side: DoubleSide,
            shadowSide: DoubleSide,
            emissive:setting$4.hair,
            emissiveIntensity:0.5,
            //opacity:1.0,
            transparent:true,
            blending:CustomBlending,
            blendDst:ZeroFactor,
            blendDstAlpha:SrcAlphaFactor,
            //forceSinglePass:true,
            //alphaHash:true,
            //premultipliedAlpha:true,
            alphaToCoverage:true,
        },
        hair_man:{
            type:'Standard',
            color:setting$4.hair,
        	//map:'hair_man',
            aoMap:'hair_man',
            metalnessMap:'hair_man',
            roughness:0.6,
            metalness:1.0,//setting.h_metal,
            alphaMap:'hair_man_a',
            side: DoubleSide,

            //alphaTest:setting.alphaTest,
            
            //opacity:1.0,
            //emissive:setting.hair,
            //emissiveIntensity:0.5,
            //sheen:1.0,
            //sheenColor:setting.hair,
            //sheenRoughness:1.0,
            transparent:true,
            blending:CustomBlending,
            blendDst:ZeroFactor,
            blendDstAlpha:SrcAlphaFactor,
            forceSinglePass:true,
            //alphaHash:true,
            //premultipliedAlpha:true,
            alphaToCoverage:true,
        },
        eyelash:{
            type:'Standard',
        	color:setting$4.hair,
            map:'eyelash_c',
            //roughness:setting.h_rough,
           // metalness:setting.h_metal,
            alphaMap:'eyelash_a',
            //alphaTest:setting.alphaTest,
            transparent:true,
            opacity:1,
            side: DoubleSide,
            alphaToCoverage:true,
            polygonOffset: true,                
            polygonOffsetFactor: -4,
            //normalMap:'eyelash_n',
            //normalScale:new Vector2( 1, -1)
        },
        tear:{
            type:'Standard',
        	map:'eyelash_c',
            roughness:0.0,
            metalness:1.0,
            alphaMap:'eyelash_a',
            transparent:true,
            alphaToCoverage:true,
            opacity:1,
        },
        low:{
            type:'Basic',
        	//color:0x000000,
            //wireframe: true,
        }

    },

    changeMaterial:( sx = {}, def = false ) => {

        if( !Pool.getMaterial( Human.materialRef ) ) return

        const s = Human.setting;
        const defMat = Human.materials;
        
        let change = false;

        for(let v in sx){
            if(s[v]!== undefined){ 
                if(s[v] !== sx[v]){ 
                    s[v] = sx[v];
                    change = true;
                }}
        }

        let m;

        if(change){

            for(let key in defMat){
                m = Pool.getMaterial( key );
                for(let v in sx){
                    if( m[v] !== undefined ){ 

                        if( def && defMat[key][v] ) m[v] = defMat[key][v];
                        else m[v] = sx[v];

                    }
                }
            }

        }


    },

    

    applyMaterial:( root, model ) => {

        // apply Material



        const startHigh = true;//!Human.haveLOD;
        //console.log(startHigh, Human.haveLOD)

        const def = Pool.getMaterial( 'skin' );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
                switch( node.name ){
                    case 'body':
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    node.visible = startHigh;
                    break;
                    case 'body_low': 
                        node.material = def;
                        node.receiveShadow = true;
                        node.castShadow = true;
                        node.visible = false;
                    break;
                    case 'Head': 
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = true;
                    node.visible = startHigh;
                    break;
                    case 'crane': 
                    node.material = def;
                    node.receiveShadow = true;
                    node.castShadow = false;
                    node.visible = !Human.haveHair;//startHigh
                    break;
                    case 'mouth':
                    node.material = Pool.getMaterial( 'mouth' ) || def;
                    node.receiveShadow = true;
                    node.castShadow = false;
                    node.visible = startHigh;
                    // correct bad light
                    node.geometry.computeVertexNormals();
                    break;
                    case 'eyelash':  case 'eyebrow':
                    node.material = Pool.getMaterial( 'eyelash' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    node.visible = startHigh;
                    break;
                    case 'tear': 
                    node.material = Pool.getMaterial( 'tear' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    node.visible = startHigh;
                    break;
                    case 'eye_l':case 'eye_r':
                    node.material = Pool.getMaterial( 'eye' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    case 'eye_l_s':case 'eye_r_s':
                    node.material = Pool.getMaterial( 'sub_eye' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    node.visible = startHigh;
                    break;
                    case 'hair': 
                    node.material = Pool.getMaterial( 'hair' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = true;
                    //node.matrixWorldAutoUpdate = false
                    node.visible = Human.haveHair ? startHigh : false;
                    break;
                    case 'hair_man': 
                    node.material = Pool.getMaterial( 'hair_man' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;//true;
                    //node.matrixWorldAutoUpdate = false
                    node.visible = Human.haveHair ? startHigh : false;
                    break;
                }
            }

        });

    },

    /*lowMode:( b ) => {

        if(b){
            setVisible()
        }


    },*/

    adjustment:() => {

        //return []

        return [
        //{name:'head', values:[-10,0,0]},
        {name:'neck', values:[-5,0,0]},
        {name:'chest', values:[5,0,0]},
        
        {name:'lCollar', values:[0,0,-10]},
        {name:'rCollar', values:[0,0,10]},

        {name:'lShldr', values:[-20,2,5]},
        {name:'rShldr', values:[-20,-2,-5]},

        //{name:'lShldr', values:[-5,2,0]},
        //{name:'rShldr', values:[-5,-2,0]},

        {name:'lForeArm', values:[0,0,10]},
        {name:'rForeArm', values:[0,0,-10]},

        {name:'lHand', values:[0,15,10]},
        {name:'rHand', values:[0,-15,-10]},
        //{name:'lThumb1', values:[0,-15,0]},
        //{name:'rThumb1', values:[0,15,0]},
        {name:'lThumb2', values:[0,25,10]},
        {name:'rThumb2', values:[0,-25,-10]},
        ]

    }





};

const setting$3 = {

    wireframe:false,
    normal:0.25,
    hair:0x252011,
    
};

const Human_low = {

	isBreath:false,
	isEyeMove:false,
	haveMorph:true,
    
    skeletonRef:'body_low',
	fullMorph: ['MUSCLE', 'LOW', 'BIG', 'MONSTER'],

	//haveQuality: true,
    //textureQuality:0,
    textureRef:'avatar_c_0k',
    texturePath: 'assets/textures/avatar/',
    textures: ['avatar_c_0k.jpg', 'avatar_n_0k.jpg', 'avatar_ao_0k.jpg', 'hair_man_a_0k.jpg', 'Hair_01_c.png', 'Hair_01_n.png'],

    modelPath: 'assets/models/avatar/',
    forceModel: null,

    setting:setting$3,

    materialRef:'skin_low',
    materials:{
        skin_low:{
            //color:0xE24C00,
            type:'Standard',//Physical',
            map: 'avatar_c_0k',
            aoMap:'avatar_ao_0k',
            normalMap: 'avatar_n_0k',

            normalScale: new Vector2( setting$3.normal, -setting$3.normal),
            //normalMapType: ObjectSpaceNormalMap,
            envMapIntensity:0.3,
            roughness:0.22,
            metalness:0.0,
            //reflectivity:0.05,
            vertexColors:false,
            /*sheen:1.0,
            sheenColor:0x692000,
            sheenRoughness:0.5,**/
            //side:DoubleSide,
            
            
        },
        hair_low:{
            //color:0xE24C00,
            type:'Standard',
            color:setting$3.hair,
            alphaMap: 'hair_man_a_0k',
            transparent:true,
            //blending:CustomBlending,
            //blendDst:ZeroFactor,
            //blendDstAlpha:SrcAlphaFactor,
            //alphaToCoverage:true,
        },

        hair_low_2:{
            //color:0xE24C00,
            type:'Standard',
            color:setting$3.hair,
            map:'Hair_01_c',
            normalMap: 'Hair_01_n'
        },

    },

    changeMaterial:( sx = {}, def = false ) => {

        if( !Pool.getMaterial( Human_low.materialRef ) ) return

            const defMat = Lee.materials;
        let m;

        for(let key in defMat){
            m = Pool.getMaterial( key );
            for(let v in sx){
                if( m[v] !== undefined ){ 
                    if( def && defMat[key][v] ) m[v] = defMat[key][v];
                    else m[v] = sx[v];
                }
            }
            //m.needsUpdate = true
        }

    },

    
    applyMaterial:( root, model ) => {

        // apply Material

        const def = Pool.getMaterial( Human_low.materialRef );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
                switch( node.name ){
                    case 'body_low':
                    //Pool.symetric( node );
                    //node.geometry.deleteAttribute( 'normal' );
                    
                    //node.geometry.deleteAttribute( 'tangent' );
                    //node.geometry.computeVertexNormals()
                    node.material = def;
                    //node.material.normalMapType = ObjectSpaceNormalMap;

                    //node.material.needsUpdate = true

                    //Pool.objectSpaceNormal( node );
                    node.receiveShadow = true;
                    node.castShadow = true;
                    break;
                    case 'hair_low':
                    node.material = Pool.getMaterial( 'hair_low' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    case 'hair_low_2':
                    node.material = Pool.getMaterial( 'hair_low_2' ) || def;
                    node.receiveShadow = false;
                    node.castShadow = false;
                    break;
                    
                }
            }

        });

    },

    adjustment:() => {

        return [
        {name:'neck', values:[-5,0,0]},
        {name:'chest', values:[5,0,0]},
        {name:'lCollar', values:[0,0,-10]},
        {name:'rCollar', values:[0,0,10]},
        {name:'lShldr', values:[-20,2,0]},
        {name:'rShldr', values:[-20,-2,0]},
        
        ]

    }





};

const setting$2 = {

    metalness:0.33,
    roughness:0.11,
    clearcoat:0.0,
    wireframe:false,
    
};

const Eva = {

    decalY:0.02,

	isBreath:false,
	isEyeMove:false,
	haveMorph:false,

	skeletonRef:'eva_SKIN',

	fullMorph: [],

	haveQuality: false,
	skinRef:'eva_00',
	texturePath: 'assets/textures/eva/',
	textures: ['eva00_c.jpg', 'eva01_c.jpg', 'eva02_c.jpg', 'eva_l.jpg', 'eva_ao.jpg'],

    modelPath: 'assets/models/',
    forceModel:'eva',

    setting:setting$2,

    materialRef:'eva00',
    materials:{
        eva00:{
            type:'Physical',
            map: 'eva00_c', 
            emissiveMap:'eva_l',
            emissive:0xffffff,
            roughness:setting$2.roughness,
            metalness:setting$2.metalness,
            wireframe:setting$2.wireframe,
            clearcoat:setting$2.clearcoat,
            //iridescence:0.5,
            aoMap:'eva_ao',
        },
        eva01:{
            type:'Physical',
            map: 'eva01_c',
            emissiveMap:'eva_l',
            emissive:0xffffff,
            roughness:setting$2.roughness,
            metalness:setting$2.metalness,
            wireframe:setting$2.wireframe,
            clearcoat:setting$2.clearcoat,
            //iridescence:0.5,
            aoMap:'eva_ao',
        },
        eva02:{
            type:'Physical',
            map: 'eva02_c', 
            emissiveMap:'eva_l',
            emissive:0xffffff,
            roughness:setting$2.roughness,
            metalness:setting$2.metalness,
            wireframe:setting$2.wireframe,
            clearcoat:setting$2.clearcoat,
            //iridescence:0.5,
            aoMap:'eva_ao',
        }
    },

    changeMaterial:( sx, def = false ) => {

        if( !Pool.getMaterial( Eva.materialRef ) ) return

        //const s = Eva.setting;
        const defMat = Eva.materials;
        
        /*let change = false;

        for(let v in sx){
            if(s[v]!== undefined){ 
                if(s[v] !== sx[v]){ 
                    s[v] = sx[v]
                    change = true;
                }}
        }*/

        let m;

        //if(change){

            for(let key in defMat){
                m = Pool.getMaterial( key );
                for(let v in sx){
                    if( m[v] !== undefined ){ 
                        if( def && defMat[key][v] ) m[v] = defMat[key][v];
                        else m[v] = sx[v];
                    }
                }
                m.needsUpdate = true;
            }

        //}

        /*

        const s = Eva.setting;

        if(Setting){
            for(let o in Setting){
                if( s[o] !== undefined) s[o] = Setting[o]
            }
        }
        
        let m = Pool.getMaterial( 'eva00' );
        m.roughness = s.roughness;
        m.metalness = s.metalness;
        m.wireframe = s.wireframe;
        m.clearcoat = s.clearcoat;
        m = Pool.getMaterial( 'eva01' );
        m.roughness = s.roughness;
        m.metalness = s.metalness;
        m.wireframe = s.wireframe;
        m.clearcoat = s.clearcoat;
        m = Pool.getMaterial( 'eva02' );
        m.roughness = s.roughness;
        m.metalness = s.metalness;
        m.wireframe = s.wireframe;
        m.clearcoat = s.clearcoat;*/

    },

    applyMaterial:( root, model ) => {

    	const def = Pool.getMaterial( model );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
            	
            	node.material = def;
                node.receiveShadow = true;
                node.castShadow = true;
                //node.matrixWorldAutoUpdate = false

                switch( node.name ){

                    case 'eva_2_head': case 'eva_2_mach': 
                    node.visible = model === 'eva02' ? true : false;
                    break;

                    case 'eva_L_COLLAR': case 'eva_R_COLLAR': 
                    node.visible = model === 'eva00' ? false : true;
                    break;

                    case 'eva_HEAD': case 'eva_MACHOIR': 
                    node.visible = model === 'eva01' ? true : false;
                    break;

                    case 'eva_0_R_COLLAR':case 'eva_0_L_COLLAR':case 'eva_0_head': case 'eva_0_head2':
                    node.visible = model === 'eva00' ? true : false;
                    break;

                    case 'eva_0_CHEST2':
                    node.visible = model === 'eva01' ? false : true;
                    break;
                }
            }

        });

    }




};

const setting$1 = {

    metalness:0.2,
    roughness:0.8,
    wireframe:false,
    
};

const Lee$1 = {

    decalY:-0.06,

	isBreath:false,
	isEyeMove:false,
	haveMorph:false,

	skeletonRef:'leeSkin',

	fullMorph: [],

	haveQuality: false,
	//skinRef:'leeSkin',
	texturePath: 'assets/textures/',
	textures: ['lee_c.jpg', 'lee_ao.jpg'],

    modelPath: 'assets/models/',
    forceModel:'lee',

    setting:setting$1,

    materialRef:'lee_material',
    materials:{
        lee_material:{
            type:'Physical',
            map: 'lee_c', 

            roughness:0.3,
            metalness:0.08,
            //aoMap: 'lee_ao',
            wireframe:setting$1.wireframe,
            sheen:2.2,
            //emissive:0xFFFFFF,
            //emissiveMap:'lee_c',
            sheenColorMap:'lee_c',
            sheenColor:0xFFFFFF,
            sheenRoughness:0.4,
            envMapIntensity:1,
            //aoMapIntensity:0.5,
            //emissiveIntensity:0.25,

        },
    },

    /*changeMaterial:( Setting ) => {

        const s = Lee.setting;

        if(Setting){
            for(let o in Setting){
                if( s[o] !== undefined) s[o] = Setting[o]
            }
        }
        
        let m = Pool.getMaterial( 'lee_material' );
        m.roughness = s.roughness;
        m.metalness = s.metalness;
        m.wireframe = s.wireframe;

    },*/

    changeMaterial:( sx, def = false ) => {

        if( !Pool.getMaterial( Lee$1.materialRef ) ) return

        const defMat = Lee$1.materials;
        let m;

        for(let key in defMat){
            m = Pool.getMaterial( key );
            for(let v in sx){
                if( m[v] !== undefined ){ 
                    if( def && defMat[key][v] ) m[v] = defMat[key][v];
                    else m[v] = sx[v];
                }
            }
            //m.needsUpdate = true
        }

    },

    applyMaterial:( root, model ) => {

    	const def = Pool.getMaterial( 'lee_material' );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
            	
            	node.material = def;
                node.receiveShadow = true;
                node.castShadow = true;

            }

        });

    },

    adjustment:() => {

        return [
            //{name:'lShldr', values:[0,-70,0]},
            {name:'lHand', values:[-60,0,0]},
            //{name:'rShldr', values:[0,70,0]},
            {name:'rHand', values:[-60,0,0]}
        ]

    }




};

const setting = {

    metalness:0.2,
    roughness:0.8,
    wireframe:false,
    
};

const Barbados = {

    decalY:-0.06,

	isBreath:false,
	isEyeMove:false,
	haveMorph:false,

	skeletonRef:'barbados',

    multyMaterial:true,

	fullMorph: [],

	haveQuality: false,
	//skinRef:'leeSkin',
	texturePath: 'assets/textures/',
	textures: [],

    modelPath: 'assets/models/',
    forceModel:'barbados',

    setting:setting,

    materialRef:'bb',
    materials:{
        bb:{
            type:'Physical',

            roughness:0.3,
            metalness:0.08,
            //aoMap: 'lee_ao',
            wireframe:setting.wireframe,
            sheen:2.2,
            //emissive:0xFFFFFF,
            //emissiveMap:'lee_c',
            sheenColor:0xFFFFFF,
            sheenRoughness:0.4,
            envMapIntensity:1,
            //aoMapIntensity:0.5,
            //emissiveIntensity:0.25,

        },
    },

    /*changeMaterial:( Setting ) => {

        const s = Lee.setting;

        if(Setting){
            for(let o in Setting){
                if( s[o] !== undefined) s[o] = Setting[o]
            }
        }
        
        let m = Pool.getMaterial( 'lee_material' );
        m.roughness = s.roughness;
        m.metalness = s.metalness;
        m.wireframe = s.wireframe;

    },*/

    changeMaterial:( sx, def = false ) => {

       /* if( !Pool.getMaterial( Lee.materialRef ) ) return

        const defMat = Lee.materials;
        let m;

        for(let key in defMat){
            m = Pool.getMaterial( key );
            for(let v in sx){
                if( m[v] !== undefined ){ 
                    if( def && defMat[key][v] ) m[v] = defMat[key][v];
                    else m[v] = sx[v];
                }
            }
            //m.needsUpdate = true
        }*/

    },

    applyMaterial:( root, model ) => {

    	/*const def = Pool.getMaterial( 'bb' );

        root.traverse( ( node ) => {

            if ( node.isMesh ){
            	
            	node.material = def;
                node.receiveShadow = true;
                node.castShadow = true;

            }

        })*/

    },

    adjustment:() => {

        return [
            //{name:'lShldr', values:[0,-70,0]},
            //{name:'lHand', values:[-60,0,0]},
            //{name:'rShldr', values:[0,70,0]},
            //{name:'rHand', values:[-60,0,0]}
        ]

    }




};

/** __
*    _)_|_|_
*   __) |_| | 2023
*  @author lo.th / https://github.com/lo-th
* 
*  AVATAR
*/

const FrameTime = 30;
const TimeFrame = 1/30;
const torad$2 = Math.PI / 180;
const todeg = 180 / Math.PI;
const V$2 = new Vector3();


const preloadAvatar = {

    tmp:[],
    model:[],
    avatar:null,
    callback:() => {},

    add:( names, callback ) => {

        preloadAvatar.tmp = [...names];
        preloadAvatar.callback = callback;

        if(preloadAvatar.tmp.length){
            preloadAvatar.loadOne();
        }

    },

    loadOne:() => {

        let name = preloadAvatar.tmp[0];
        preloadAvatar.avatar = new Avatar({ type:name, callback:preloadAvatar.next, morph:true, isPreload:true });

    },

    next:( name ) => {
        
        preloadAvatar.avatar.dispose();

        preloadAvatar.tmp.shift();
        if( preloadAvatar.tmp.length === 0 ){
            preloadAvatar.callback();
        }else {
            preloadAvatar.loadOne();
        }
    }

};

class Avatar extends Group {

	constructor( o = {} ) {

        super();

        this.isPreload = o.isPreload || false;

        this.fixWeight = o.fixWeight !== undefined ? o.fixWeight : true;

        this.rootPath = o.path || './';
        this.lzmaPath = this.rootPath + 'src/libs/lzma_worker.js';
        //Pool.dracoPath =  this.rootPath + 'src/libs/draco/';

        this.callback = o.callback || function (){};

        this.matrixAutoUpdate = false;
        this.isPause = true;

        //this.textureQuality = o.quality || 1;

        this.randomMorph = o.randomMorph || false;
        this.randomSize = o.randomSize || false;

        this.actionPose = null;

        this.model = o.type || 'man';
        this.startAnimation = o.anim || 'idle';

        this.bodyMorph = [0,0];
        this.faceMorph = [0,0];

        this.ref = null;

        switch( this.model ){
            case 'barbados': this.ref = Barbados; break;
            case 'lee': this.ref = Lee$1; break;
            case 'man': case 'woman': this.ref = Human; break;
            case 'man_low': case 'woman_low': this.ref = Human_low; break;
            case 'eva00': case 'eva01': case 'eva02': this.ref = Eva; break;
        }


        this.compact = o.compact !== undefined ? o.compact : true;
        this.haveMorph = o.morph !== undefined ? o.morph : false;
        this.fullMaterial = o.material !== undefined ? o.material : true;



        this.size = o.size || 1;
        this.realSize = 0;
        this.baseSize = 0;


        this.fullMorph = this.ref.fullMorph || [];
        if(this.randomMorph && this.fullMorph.length ) this.haveMorph = true;

        this.textureQuality = this.ref.textureQuality || 0;


        this.skeleton = null;
        //this.root = null;
        this.mixer = null;
        this.mesh = {};
        this.bones = {};
        this.done = false;
        this.isClone = false;
        
        this.isBreath = this.ref.isBreath || false;
        this.isEyeMove = this.ref.isEyeMove || false;
        this.haveBlink = this.ref.haveBlink || false;

        this.haveLOD = this.ref.haveLOD || false;
        if( o.noLOD ){
            this.ref.haveLOD = false; 
            this.haveLOD = false;
        }
        this.lod = -1;

        this.decalY = this.ref.decalY || 0;

        this.tensionTest = false;
        this.tensionActive = false;

        this.fixToe = false;
        this.clipsToesFix = [];

        this.n = Math.round(Math.random()*1000);

        this.actions = new Map();
        this.current = null;
        this.old = null;

        this.breath = 0;
        this.breathSide = -1;

        this.q = new Quaternion$1().setFromAxisAngle( {x:0, y:1, z:0}, Math.PI*0.5 );
        this.headBoneLook = new Vector3();
        this.eyeTarget = new Group();//new AxesHelper(0.01)//
        this.eyeTarget.position.set(0, 1, 0);

        this.tmpMtx = new Matrix4();
        this.tmpQ = new Quaternion$1();

        this.setting = {};

        //this.initMaterial();

        this.root = Pool.get( this.ref.forceModel ? this.ref.forceModel : this.model, 'O' );

        if( this.root ){
            this.isClone = true;
            this.tensionTest = false;
            this.root = SkeletonUtils.clone( this.root );
            this.init();

        } else {
            if( this.fullMaterial ) this.load();
            else this.loadModels();
        }

    }

    rand( low = 0, high = 1 ){ 
        return low + Math.random() * ( high - low ) 
    }

    load(){

        if( !this.ref.textures || !this.ref.textures.length ){ 
            this.loadModels();
            return
        }

        this.skin = Pool.getTexture( this.ref.textureRef, { quality:this.textureQuality } );

        if( !this.skin ){

            const path = this.rootPath + this.ref.texturePath + ( this.textureQuality ? this.textureQuality + 'k/' : '' );
            //console.log(path)
            Pool.load( this.ref.textures, this.loadModels.bind(this), path, 'loading images...', this.textureQuality );

        } else {

            this.loadModels();

        }

    }

    loadModels(){

        const model = this.ref.forceModel ? this.ref.forceModel : this.model;
        const asset = [model+'.glb'];
        const path = this.rootPath + this.ref.modelPath;
        if( this.ref.haveMorph && this.haveMorph ) asset.push( model+'_morph.glb' );
        Pool.load( asset, this.init.bind(this), path, 'loading models...' );

    }

    update( delta ){

        if( !this.done ) return;
        if ( this.mixer ){

            this.mixer.update( delta );

            // blink
            if( this.haveBlink ) this.eyeBlink();
            

            if( !this.isClone ){
                this.look( delta*10 );
                this.breathing();
                this.autoToes();
            }

            if( this.tensionActive ){ 
                this.tension1.update();
                this.tension2.update();
            }

            if(this.actionPose){ 
                //console.log(this.getAction( 'idle' )._effectiveWeight)
                this.actionPose.setEffectiveWeight( this.getAction( 'idle' )._effectiveWeight );
            }

            /*if( this.ref.adjustment && !this.isClone ) {
                let dt = this.ref.adjustment()
                let m = dt.length, l
                while(m--){
                    l = dt[m]
                    this.setRot2( l.name, l.x, l.y, l.z )
                }
            }*/

            if( window.gui && window.gui.updateTimeBarre && this.current ){ 
                window.gui.updateTimeBarre( Math.round( this.current.time * FrameTime ), this.current.frameMax );
            }
        }

    }

    eyeBlink(){

        const n = this.n++; 
        let v = 0;
        let t = 10;
        let s = 1/t;

        if( n<=t) v = n*s;
        if( n>t && n<=t*2 ) v = 1-((n-t)*s);

        
        if( this.n>500 ){ this.n = 0;}

        this.setMorph( 'EyeBlink', v );
    
    }

    look( delta ){

        if(!this.isEyeMove) return;
        if(this.isPause) return;

        const v = window.mouse || {x:0, y:0};

        if(delta>1) delta = 1;

        this.headBoneLook.lerp({ x:-(v.y*20)*torad$2, y:0, z:-(v.x*20)*torad$2 }, delta );
        this.eyeTarget.position.lerp({ x:v.x*0.5, y:1, z:-v.y*0.25 }, delta );

        let e = this.headBoneLook;
        this.tmpQ.setFromEuler( { _x:e.x, _y:e.y, _z:e.z, _order:'XYZ' }, false );
        this.bones.head.quaternion.multiply(this.tmpQ);

        let ER = this.bones.ER;
        let EL = this.bones.EL;
        let up = {x:0, y:0, z:1};

        this.tmpMtx.lookAt( EL.position, this.eyeTarget.position.clone().add({x:0.03, y:0, z:-0.074}), up );
        EL.quaternion.setFromRotationMatrix( this.tmpMtx ).multiply(this.q);

        this.tmpMtx.lookAt( ER.position, this.eyeTarget.position.clone().add({x:-0.03, y:0, z:-0.074}), up );
        ER.quaternion.setFromRotationMatrix( this.tmpMtx ).multiply(this.q);

    }

    breathing(){

        if( !this.bones ) return;
        if( !this.isBreath ) return;
        if( !this.skeleton.setScalling ) return;

        let a = this.breath * 0.01;

        if(this.breathSide > 0){
            this.skeleton.setScalling( this.bones.chest, this.lerp (1,1.02, a), this.lerp (1,1.04, a), 1 );
            this.skeleton.setScalling( this.bones.abdomen, 1, this.lerp (1,0.92, a), 1 );
        }else {
            this.skeleton.setScalling( this.bones.chest, this.lerp (1.02,1, a), this.lerp (1.04,1, a), 1 );
            this.skeleton.setScalling( this.bones.abdomen, 1, this.lerp (0.92,1, a), 1 );
        }


        // !! just for testing 
        //this.skeleton.setScalling( this.bones.lShldr, 1.3, 2, 2 )
        //this.skeleton.setScalling( this.bones.lForeArm, 1.3, 2, 2 )

        this.breath ++;
        if( this.breath === 100 ){ this.breath = 0; this.breathSide = this.breathSide > 0 ? -1:1; }

    }

    setPosition( x, y, z ){

        this.position.set( x, y, z );
        this.updateMatrix();

    }

    setRotation( x, y, z, a ){

        let r  = this.lerp( this.rotation.y, y, a);
        this.rotation.set( x, r, z );
        this.updateMatrix();

    }

    lerp( x, y, t ) { return ( 1 - t ) * x + t * y }

    onReady(){}

    initMaterial(){

        if( Pool.getMaterial( this.ref.materialRef ) ) return

        if( !this.fullMaterial ){
            Pool.set( this.ref.materialRef, new MeshStandardMaterial() );
            return
        }

        let m, type, data;

        for( const name in this.ref.materials ){

            data = {...this.ref.materials[name]};
            type = data.type;
            delete data.type;
            for( const t in data ){
                if(t!=='envMapIntensity' && t!=='normalMapType' && t!=='aoMapIntensity' && t!=='aoMapIntensity'){
                    if(t==='map' || t.search('Map')!==-1 ) data[t] = Pool.getTexture( data[t], {quality:this.textureQuality } );
                }
            }


            if(type==='Basic') m = new MeshBasicMaterial( data );
            else if(type==='Standard') m = new MeshStandardMaterial( data );
            else if(type==='Physical') m = new MeshPhysicalMaterial( data );
            else if(type==='Sss') m = new MeshSssMaterial(data);
            m.name = name;

            Pool.set( name, m );

        }

        this.setting = this.ref.setting;

    }


    setMaterial(s, b){
        let m = Pool.getMaterial( this.ref.materialRef );
        if(!m) return;
        for(let p in s){
            if(m[p]!==undefined) m[p] = s[p];
        }

    }

    setMaterialNormal( v ){

        let m = Pool.getMaterial( 'skin' );
        if(!m) return
        if( v<0 ) v = 0;
        m.normalScale.set(v,-v);

    }

    getMaterial( name ){

        return Pool.getMaterial( name )
        
    }

    init(){

        this.initMaterial();

        if( !this.isClone ) {

            let modelName = this.ref.forceModel ? this.ref.forceModel : this.model;

            if( this.ref.multyMaterial ) Pool.getMesh(modelName, true);

            this.root = Pool.get( modelName, 'O' ); 
            this.ref.applyMaterial( this.root, this.model );
        }

        if( this.ref.forceModel && this.isClone ) this.ref.applyMaterial( this.root, this.model );

        this.realSize = 0;

        // get data
        this.root.traverse( function ( node ) {
            
            node.raycast = function(){ return };

            if ( node.isMesh ){

                if( node.name === this.ref.skeletonRef ){
                    node.matrixAutoUpdate = false;

                    this.skeleton = node.skeleton;
                    if( this.skeleton.resetScalling ) this.skeleton.resetScalling();

                    this.realSize = node.geometry.boundingBox.max.y;



                    //console.log( node.geometry.boundingSphere, node.geometry.boundingBox, node.frustumCulled )
                    //node.geometry.boundingSphere.radius = 0.1;
                }
                if( node.name === 'Head' ) this.realSize = node.geometry.boundingBox.max.y;
                
                this.mesh[node.name] = node;
            }
            if ( node.isBone ){
                this.bones[node.name] = node;
                //if(node.name==='rShldr' ) node.rotation.x = 80 * torad
               // console.log(node.name, node.rotation.x*todeg, node.rotation.y*todeg, node.rotation.z*todeg)
            }
        }.bind(this));

        this.realSizeRatio = 1 / this.realSize;
        this.baseSize = this.realSize;

        if( this.ref.isEyeMove ){
            this.bones.neck.add( this.eyeTarget );
        }
    
        //if( !this.isClone ){
        // for extra skin
        for( let m in this.mesh ){
            if( this.mesh[m].isSkinnedMesh && m !== this.ref.skeletonRef ){
                //this.mesh[m].skeleton.dispose();
                this.mesh[m].skeleton = this.skeleton;
            }
        }

        if( !this.isClone ){
            // add morph 
            if( this.haveMorph ) Pool.applyMorph( this.model+'_morph', this.mesh, this.ref.morphNormal, this.ref.morphRelative );
            Pool.set( this.model, this.root, 'O' );
            
        }

        if( this.size !== 1 ) this.root.scale.set(1,1,1).multiplyScalar(this.size);

        //if( this.tensionTest ) this.addTensionMap()



        // animation
        this.mixer = new AnimationMixer( this );

        

        if( Pool.clip.length === 0 ){ 
            // load animation include in json or the compacted version
            if( this.compact ) this.loadCompactAnimation(this.rootPath +'assets/animation/animations.bin');
            else this.loadAnimationJson(this.rootPath +'assets/animation/animations.json', this.start.bind(this) );

        } else {
            let i = Pool.clip.length;
            while(i--) this.addAction( Pool.clip[i] );
            this.start();
        }

        
             
    }

    setRealSize( s ){

        this.realSize = s;
        let r = 0.5 + ((this.baseSize / this.realSize)*0.5);
        this.setSize( this.realSize * this.realSizeRatio );
        this.setHeadSize( r );

    }

    setSize( s ){
        this.size = s;
        this.root.scale.set(1,1,1).multiplyScalar(this.size);
        //this.bones.head.scale.set(1,1,1).multiplyScalar(2);
    }

    setHeadSize( s ){
        this.bones.head.scale.set(1,1,1).multiplyScalar(s);
    }

    addTensionMap(){

        this.tension1 = new Tension( this.mesh.body );
        this.tension2 = new Tension( this.mesh.Head );
    }

    setBounding( r ){

        for( let m in this.mesh ){
            if(this.mesh[m].isMesh ){
                this.mesh[m].geometry.boundingSphere.radius = r;
            }
        }

    }

    /*setBoneScale( v ){

        const ingnor = [ 'head', 'lToes', 'rToes', 'rCollar', 'lCollar', 'rBreast', 'lBreast', 'neck'];
        const center = ['hip', 'abdomen', 'chest'];
        const legs = ['lThigh', 'rThigh', 'lShin', 'rShin'];
        const b = this.bones

        for( let n in b ){
            if(ingnor.indexOf(n) === -1) {
                if(center.indexOf(n) !== -1) b[n].scalling.z = v
                else if(legs.indexOf(n) !== -1) b[n].scalling.z = v
                else if( n === 'root' ) b[n].scalling.y = v
                else if( n === 'rFoot' || n === 'lFoot') b[n].scalling.y = v
                else b[n].scalling.x = v
            } 
        }

        this.setBounding(v)
    }*/

    setLevel( n ){

        if( !this.haveLOD ) return
        if( this.lod === n ) return

        this.lod = n;

        this.hideAll();

        if( this.lod === 0 ) this.setVisible( this.ref.levelLow, true );
        else { 
            this.setVisible( this.ref.levelHigh, true );
            if( this.ref.haveHair ){ 
                //this.mesh.body.visible = false;
                this.setVisible( this.ref.levelHair, true );
            }
        }
    
    }

    hideAll(){

        for( let m in this.mesh ) this.mesh[m].visible = false;
    
    }
 
    setVisible( names, v ){

        if( typeof names === 'string' ) names = [names];
        let i = names.length, name;
        while(i--){
            name = names[i];
            if( this.mesh[name] ) this.mesh[name].visible = v;
        }
    
    }


    /*eyeControl( v ){

        this.setMorph('EyeBlink', v)
    
    }*/

    setMorph( name, v ){

        v = v < 0 ? 0 : v;
        //v = v > 1 ? 1 : v;

        if( !this.haveMorph ) return
        this.morpher( 'eyelash', name, v);
        this.morpher( 'eyebrow', name, v);
        this.morpher( 'tear', name, v);
        this.morpher( 'mouth', name, v);
        this.morpher( 'body', name, v);
        this.morpher( 'Head', name, v);
        this.morpher( 'body_low', name, v);
    }

    morpher( obj, name, value ){

        if(!this.mesh[obj]) return
        if(!this.mesh[obj].morphTargetInfluences) return
        if(this.mesh[obj].morphTargetDictionary[name] === undefined ) return
        this.mesh[obj].morphTargetInfluences[ this.mesh[obj].morphTargetDictionary[name] ] = value;
    }

    lerp( x, y, t ) { return ( 1 - t ) * x + t * y; }

    clone( o ){

        return new this.constructor( {type:o.type}, this );
    
    }

    dispose(){

        if( this.exoskel ) this.addExo();
        if( this.helper ) this.addHelper();

        this.stop();
        //if( this.skeleton.resetScalling ) this.skeleton.resetScalling()
        this.mixer.uncacheRoot( this );

        //if(this.skeleton.boneTexture)this.skeleton.boneTexture.dispose();
        this.remove( this.root );

        this.skeleton.dispose();
        if( this.parent ) this.parent.remove(this);
        

        //console.log('hero remove')
        if(!this.isClone);
    }

    start(){

        if( this.isPreload ) { this.callback(); return; }
        if( this.done ) return;

        //this.updateMatrix()

        this.done = true;
 
        

        this.onReady();
        //this.playAll();
        
        this.play( this.startAnimation );

        if( this.ref.adjustment ){
            this.makePoseTrack('adjustment', this.ref.adjustment(), true );
        }

        // Random Human
        if( this.randomMorph ) this.setBodyMorph([this.rand(-1,1), this.rand(-1,1)]);
        if( this.randomSize ) this.setRealSize(this.rand(1,2));


        //this.add( this.root );


        //setTimeout( this.callback, 100 );
        setTimeout( function(){ 
            this.add( this.root );
            this.callback();
        }.bind(this), 100 );
        //this.callback()

    }

    setBodyMorph( v ){

        if(!this.haveMorph) return;

        if(v) this.bodyMorph = v;

        let vx = Number(this.bodyMorph[0]);
        let vy = Number(this.bodyMorph[1]);

        this.setMorph( 'MUSCLE', vy<0?-vy:0 );
        this.setMorph( 'LOW', vy>=0?vy:0 );

        this.setMorph( 'BIG', vx<0?-vx:0 );
        this.setMorph( 'MONSTER', vx>=0?vx:0 );

        let cx = ((vx+1)*0.5);
        let cy = (1-((vy+1)*0.5));

        this.setMaterialNormal( (cy+cx)*0.5 );

    }

    setFaceMorph( v ){

        if(!this.haveMorph) return;
        if(v) this.faceMorph = v;

        let vx = Number(this.faceMorph[0]);
        let vy = Number(this.faceMorph[1]);

        this.setMorph( 'Shock', vy<0?-vy:0 );
        this.setMorph( 'Frown', vy>=0?vy:0 );

        this.setMorph( 'SmileOpen', vx<0?-vx:0 );
        this.setMorph( 'Angry', vx>=0?vx:0 );

    }

    addHelper(){

        if( this.helper ){
            this.helper.dispose();
            this.remove( this.helper );
            this.helper = null;
        } else {
            this.helper = new SkeletonHelper( this.root );
            this.helper.raycast = function (){ return };
            this.helper.matrix = this.root.matrix;
            this.add( this.helper );
        }
    }

    addExo() {

        if( this.exoskel ){
            this.exoskel.dispose();
            this.remove( this.exoskel );
            this.exoskel = null;
        } else {
            this.exoskel = new ExoSkeleton( this.root, this.skeleton );
            this.exoskel.matrix = this.root.matrix;
            this.add( this.exoskel );

        }
        return this.exoskel;
    }

    attachToBone( m, b ){

        m.matrix = b.matrixWorld;
        m.matrixAutoUpdate = false;

    }

    loadAnimationJson( url, callback ){

        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.onreadystatechange = function() {
            if ( request.readyState === 4 ) {
                if ( request.status === 200 || request.status === 0 ) {
                    let data = JSON.parse( request.responseText );
                    this.urls = [];
                    for( let g in data ){
                        if( g === 'main' ) this.urls.push( ...data[g] );
                        else this.urls.push( ...data[g].map( x => g+'/'+x ) );
                    }
                    this.endCallback = callback || function(){}; 
                    this.loadOne();
                }
            }
        }.bind(this);
        request.send();

    }

    loadOne(){

        let name = this.urls[0];
        this.loadAnimationFbx( this.rootPath + 'assets/animation/fbx/'+name+'.fbx', this.next.bind(this) );

    }

    next(){

        this.urls.shift();
        if( this.urls.length === 0 ) this.endCallback();
        else this.loadOne();

    }

    loadCompactAnimation( url = './assets/models/animations.bin' ){

        var request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';

        const glb = { animations : [] };
        const self = this;

        request.onload = function() {
            LZMA.decompress( request.response, (result) => {
                const data = JSON.parse(result);
                
                for(let c in data) glb.animations.push( AnimationClip.parse( data[c] ) ); 
                //console.log( glb )
                self.applydAnimation( glb );
                self.start();
            });
        };
        request.send();

    }

    loadAnimationGlb( url, callback ){

        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        Pool.loaderGLTF().load( url, function ( glb ) {
            this.applydAnimation( glb, name );
            if( callback ) callback();
        }.bind(this), null, callback );
    }

    directGlb( data, name ){

        Pool.loaderGLTF().parse( data, '', function ( glb ) {
            this.stop();
            this.applydAnimation( glb, name );
        }.bind(this));
    }

    loadAnimationFbx( url, callback ){

        //if( !this.loaderFbx ) this.loaderFbx = new FBXLoader();
        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        Pool.loaderFBX().load( url, function ( node ) {
            this.convertFbx( name, node.animations[ 0 ] );
            if( callback ) callback();
        }.bind(this), null, callback );
    }

    directFbx( data, name ){

        //if( !this.loaderFbx ) this.loaderFbx = new FBXLoader();
        try {
            let node = Pool.loaderFBX().parse( data, '' );
            this.convertFbx( name, node.animations[ 0 ], true );
        } catch ( e ) {
            console.error( 'bug', e );
        }
    }

    applydAnimation( glb, name ){

        let i = glb.animations.length, autoplay = false;
        if( i === 1 ){
            if( name ) glb.animations[0].name = name;
            autoplay = true;
        } 
        while(i--){ 
            this.addClip( glb.animations[i] );
            this.addAction( glb.animations[i], autoplay );
        }

    }

    addClip( clip, additive = false ){

        // Make the clip additive and remove the reference frame
        if( additive ){ 
            AnimationUtils.makeClipAdditive( clip );
            //clip = AnimationUtils.subclip( clip, clip.name, 2, 3, 30 );
        }

        ///console.log(clip)

        let i = Pool.clip.length, removeId = -1;
        while(i--){ if( Pool.clip[i].name === clip.name ) removeId = i; }
        if( removeId !== -1 ) Pool.clip.slice( removeId, 1 );


        //clip.optimize();
        Pool.clip.push( clip );
    }

    addAction( clip, play ){

        const action = this.mixer.clipAction( clip );
        action.frameMax = Math.round( clip.duration * FrameTime );
        action.play();
        action.enabled = true;//false;
        if(clip.name.search('idle')!==-1) action.enabled = true;
        //action.setEffectiveWeight( 0 );
        if( clip.name === 'Jumping Up' ) action.loop = LoopPingPong;
        
        //action.play()
        this.actions.set( clip.name, action );



        /*
        if(clip.name.search('walk')!==-1) this.clipsToesFix.push(clip.name);
        if(clip.name.search('run')!==-1) this.clipsToesFix.push(clip.name);
        if(clip.name.search('strafe')!==-1) this.clipsToesFix.push(clip.name);
        if(clip.name.search('jog')!==-1) this.clipsToesFix.push(clip.name);
        if(clip.name.search('RUN')!==-1) this.clipsToesFix.push(clip.name);
        */

        //console.log(clip.name, action.frameMax)

        if( window.gui && window.gui.getAnimation ) window.gui.getAnimation();

       // if( play ) this.play( clip.name )

             
    }


    /// EXPORT

    getAnimation( toJson = false, fromPool = false ){

        let anim = [], n = 0;
        if(fromPool){
            let i = Pool.clip.length;
            while(i--){

                if( toJson ) anim[n] = Pool.clip[n].toJSON();
                else anim[n] = Pool.clip[n];
                // delete animations[n].uuid
                n++;
            }
        } else {
            this.actions.forEach( function ( action, key ) {
                if( toJson ) anim[n] = action._clip.toJSON();
                else anim[n] = action._clip;
                //delete data[n].uuid
                n++;
            });
        }

        return anim;

    }

    exportAnimationLzma( callback ){

        if(!this.lzma) this.lzma = new LZMA(this.lzmaPath);

        const data = this.getAnimation( true );

        this.lzma.compress( JSON.stringify(data), 2, function(result) {

            if( callback ) callback( {name:'animations', data:new Uint8Array(result), type:'bin'}  );
            else {
                let link = document.createElement("a");
                link.style.display = "none";
                document.body.appendChild(link);
                link.href = URL.createObjectURL( new Blob( [new Uint8Array(result)], {type: "application/octet-stream"} ) );
                link.download = 'animations.bin';
                link.click();
            }
        });
    }

    /*exportGLB( callback ){

        if( !this.exporter ) this.exporter = new GLTFExporter();
        
        const animations = this.getAnimation()

        this.exporter.parse( this.root, function( gltf ){

            if( callback ) callback( {name:'model', data:gltf, type:'glb'}  )
            else {
                let link = document.createElement("a");
                link.style.display = "none";
                document.body.appendChild(link);
                link.href = URL.createObjectURL( new Blob([gltf], { type: "application/octet-stream" }) );
                link.download = 'model.glb';
                link.click();
            }

            //self.loader.parse( JSON.stringify(glb, null, 2), '', function (r){ console.log(r) } )

        }, null, { animations:animations, binary: true, onlyVisible: true } )

    }*/

    armAngle(){

    }

    autoToes(){

        if(!this.fixToe) return;
        let r = this.getRot('rFoot');
        let l = this.getRot('lFoot');
        let v = this.getWorldPos('hip');
        let v0 = this.getWorldPos('rToes');
        let v1 = this.getWorldPos('lToes');
        if(r[0]>0 && (v0.z-v.z)<0) this.setRot('rToes', -r[0]*1.5, 0,0 );
        else if( r[0] !== 0 ) this.setRot('rToes', 0,0,0 );
        if(l[0]>0 && (v1.z-v.z)<0) this.setRot('lToes', -l[0]*1.5, 0,0 );
        else if( l[0] !== 0 ) this.setRot('lToes', 0,0,0 );
    }

    resetToes(){

        if(!this.fixToe) return;
        this.fixToe = false;
        this.setRot('rToes', 0,0,0 );
        this.setRot('lToes', 0,0,0 );

    }

    convertFbx( name, anim, autoplay ) {

        const torad = Math.PI / 180;
        let p = new Vector3();
        let q = new Quaternion$1();
        let RX = new Quaternion$1().setFromAxisAngle({x:1, y:0, z:0}, 90 * torad );

        const baseTracks = anim.tracks;
        const tracks = [];

        let i = baseTracks.length, j, n, t, b, k = 0;

        while(i--){
            t = baseTracks[k];
            b = t.name.substring(0, t.name.lastIndexOf('.') );

            if( t.name === 'hip.position' ){
                let rp = [];
                j = t.values.length / 3;
                while(j--){
                    n = j * 3;
                    p.set( t.values[n], t.values[n+1], 0).multiplyScalar(0.01);
                    p.toArray( rp, n );
                }
                tracks.push( new VectorKeyframeTrack( t.name, t.times, rp ) );

            } else {
                let rq = [];
                j = t.values.length / 4; 
                while(j--){
                    n = j * 4;
                    if( b==='hip') q.set(t.values[n], t.values[n+1], t.values[n+2], t.values[n+3]).multiply( RX );
                    else q.set(t.values[n], t.values[n+2], -t.values[n+1], t.values[n+3]);
                    q.toArray( rq, n );
                }
                tracks.push( new QuaternionKeyframeTrack( t.name, t.times, rq ) );
            }
            k++;
        }

        let clip = new AnimationClip( name, -1, tracks );
        clip.duration = anim.duration;

        //console.log( name, anim.duration )



        this.stop();
        this.addClip( clip );
        this.addAction( clip, autoplay );

    }

    makePoseTrack( name, data, isAdd = false ){

        const torad = Math.PI / 180;
        //let lockPosition = true;
        //let p = new Vector3();
        let q = new Quaternion$1();
        //let RX = new Quaternion().setFromAxisAngle({x:1, y:0, z:0}, 90 * torad );

        const baseTracks = data;// anim.tracks;
        const tracks = [];

        let i = baseTracks.length, j, n, n2, t, k = 0;

        let numFrame = 3;//3

   

        while(i--){
            t = baseTracks[i];
            t.name;//.substring(0, t.name.lastIndexOf('.') )

            /*if( t.name === 'hip.position' ){
                let rp = []
                j = t.values.length / 3;
                while(j--){
                    n = j * 3;
                    if( lockPosition ) p.set( t.values[n], t.values[n+1], 0).multiplyScalar(0.01);
                    else p.set( t.values[n], t.values[n+1], t.values[n+2]).multiplyScalar(0.01);
                    p.toArray( rp, n );
                }
                tracks.push( new VectorKeyframeTrack( t.name, t.times, rp ) );

            } else {*/
                let rq = [];
                let tt = [];
                k = 0;
                j = numFrame;//t.values.length / 3 
                while(j--){
                    n = 0;//j * 3
                    n2 = k * 4;

                    tt.push( k * 0.03333333507180214 );
                    //if( b==='hip') q.set(t.values[n], t.values[n+1], t.values[n+2], t.values[n+3]).multiply( RX );
                    //else q.set(t.values[n], t.values[n+2], -t.values[n+1], t.values[n+3]);
                    q.setFromEuler( {_x:t.values[n]*torad, _y:t.values[n+1]*torad, _z:t.values[n+2]*torad, _order:'XYZ'});
                    q.toArray( rq, n2 );
                    k++;
                }
                tracks.push( new QuaternionKeyframeTrack( t.name+'.quaternion', tt, rq ) );
            //}
            
        }


        // additive not work
        let blendMode = isAdd ? AdditiveAnimationBlendMode : NormalAnimationBlendMode;
        let clip = new AnimationClip( name, -1, tracks, blendMode );
        clip.duration = numFrame * 0.03333333507180214;//anim.duration;

        //console.log(clip)

        const action = this.mixer.clipAction( clip );
        //action.frameMax = numFrame;
        action.enabled = true;
        //action.time = 0;
        action.setEffectiveTimeScale( 1 );
        action.setEffectiveWeight( 1 );
        action.play();

        
        //action.paused = true;
        //this.actions.set( clip.name, action );

        //this.stop();
        //this.addClip( clip, true );
        //this.addAction( clip, autoplay );
        this.actionPose = action;



    }


    //---------------------
    //
    //  ANIMATION CONTROL
    //
    //---------------------

    prepareCrossFade( startAction, endAction, duration )  {
        //singleStepMode = false;

        this.isPause = false;
        this.unPause();
        // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
        // else wait until the current action has finished its current loop
        if ( endAction._clip.name !== 'idle' ) {
            this.executeCrossFade( startAction, endAction, duration );
        } else {
            this.synchronizeCrossFade( startAction, endAction, duration );
        }

    }

    synchronizeCrossFade( startAction, endAction, duration ) {

        this.mixer.addEventListener( 'loop', onLoopFinished );
        const self = this;
        function onLoopFinished( event ) {
            if ( event.action === startAction ) {
                self.mixer.removeEventListener( 'loop', onLoopFinished );
                self.executeCrossFade( startAction, endAction, duration );
            }
        }

    }

    executeCrossFade( startAction, endAction, duration, warping = true ) {
        // Not only the start action, but also the end action must get a weight of 1 before fading
        // (concerning the start action this is already guaranteed in this place)
        this.setWeight( endAction, 1 );
        endAction.time = 0;
        // Crossfade with warping - you can also try without warping by setting the third parameter to false
        startAction.crossFadeTo( endAction, duration, true );
    }

    pause(){
        this.actions.forEach( function ( action ) { action.paused = true; });
        this.isPause = true;
    }

    unPause(){
        this.actions.forEach( function ( action ) { action.paused = false; });
        this.isPause = false;
    }

    playAll(){
        this.actions.forEach( function ( action ) { action.play(); });
    }

    setTimescale( timescale ) {

        this.actions.forEach( function ( action ) { action.setEffectiveTimeScale( timescale ); });

    }

    syncro( name ) {

        let action = this.getAction( name );
        if ( !action ) return;
        let time = action.time;
        this.actions.forEach( function ( action ) { action.time = time; });

    }

    /*setTimescale( action, timescale ) {

        action.enabled = true;
        action.setEffectiveTimeScale( timescale );

    }*/

    setWeight( action, weight ) {

        //if( typeof action === 'string' ) action = this.getAction( action );
        //if ( !action ) return;

        action.enabled = true;
        if(weight<0) weight = 0;
        if(weight>1) weight = 1;
        //let old = action.getEffectiveWeight()
        //if(old===0 && weight!== 0) action.time = 0;
        //action.setEffectiveTimeScale( weight );
        action.setEffectiveWeight( weight );

    }


    getAnimInfo( name ){

        let action = this.getAction( name );
        if ( !action ) return;
        return {
            name: name,
            time: action.time,
            frame: Math.round( action.time * FrameTime ),
            frameMax: action.frameMax,
            timeScale: action.timeScale,
        }

        //if( ui ) ui.updateTimeBarre( anim.frame, anim.frameTime, anim.frameMax );

    }

    getAction( name ) {
        //if ( !this.actions.has( name ) ) return;
        return this.actions.get( name );
    }

    play( name, fade = 0.5 ) {

        let action = this.getAction( name );
        if ( !action ) return false;

        if( !this.current ){
            this.stop();
            this.current = action;
            //action.play();
            action.setEffectiveWeight( 1 );
        } else {

            if( this.current !== action ){

                this.old = this.current;
                this.current = action;

                let isIdle = this.current.getClip().name === 'idle';
                isIdle = this.old.getClip().name === 'idle';

                if( this.clipsToesFix.indexOf(name) !== -1 ) this.fixToe = true;
                else this.resetToes();

                let oldEff = this.old.getEffectiveWeight();
                let currentEff = this.current.getEffectiveWeight();
                
                // keep current time to avoid reloop
                let time = this.current.time;
                // sycro if not idle on walk run leg position
                if( !isIdle ){ 
                    let ratio = this.current.getClip().duration / this.old.getClip().duration;
                    time = this.old.time * ratio;
                }

                // reset current
                this.current.reset();
                //currentEff = 0

                this.current.time = time;


                if( this.fixWeight ){

                    this.current.weight = 1.0;
                    this.current.stopFading();
                    this.old.stopFading();//.stopWarping();
                    this.old._scheduleFading( fade, oldEff, 0 );
                    this.current._scheduleFading( fade, currentEff, 1 );

                } else {

                    this.executeCrossFade( this.old, this.current, fade );

                    //this.current.crossFadeFrom( this.old, fade, true );

                }

            }
        } 

        this.isPause = false;

        return true;
    }

    playFrame ( name, frame, weight = 1 ) {



        let action = this.getAction( name );
        if ( !action ) return;

        action.time = frame * TimeFrame;
        action.setEffectiveWeight( weight );
        action.play();
        action.paused = true;
        this.isPause = true;

    }

    playOne ( frame, weight = 1 ) {

        if ( !this.current ) return;

        this.current.time = frame * TimeFrame;
        this.current.setEffectiveWeight( weight );
        this.current.play();
        this.current.paused = true;
        this.isPause = true;

    }

    stop(){

        this.actions.forEach( function ( action ) { action.setEffectiveWeight( 0 ); });
        //this.mixer.stopAllAction()
    }



    // bone control

    setRot( name, x, y, z ){

        let n = this.bones[name];
        if(!n) return
        n.rotation.set( x*torad$2, y*torad$2, z*torad$2, 'XYZ' );
        n.updateMatrix();
    }

    setRot2( name, x, y, z ){

        let n = this.bones[name];
        if(!n) return
        //let q1 = n.quaternion
        let q2 = new Quaternion$1().setFromEuler( {_x:x*todeg, _y:y*todeg, _z:z*todeg, _order:'XYZ'}).invert();
     
        n.quaternion.premultiply(q2);
       // n.rotation.set( x*torad, y*torad, z*torad, 'XYZ' );
        n.updateMatrix();
    }

    getRot( name ){

        let n = this.bones[name];
        if(!n) return
        let r = n.rotation.toArray();
        return [ Math.round(r[0]*todeg), Math.round(r[1]*todeg), Math.round(r[2]*todeg) ];
    }

    getWorldPos( name ){

        let n = this.bones[name];
        if(!n) return
        V$2.set(0,0,0);
        n.localToWorld(V$2);
        return { x:V$2.x, y:V$2.y, z:V$2.z };

    }


    //---------------------
    //  HIDE PART OF BODY
    //---------------------

    bodyMask( o = {arm:true, leg:true, foot:true, chest:true } ){

        let s = 0.25;
        if(!this.canvas) {
            this.canvas = document.createElement( 'canvas' );
            this.canvas.width = this.canvas.height = 1024*s;
        }

        const ctx = this.canvas.getContext( '2d' ); 
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 1024*s, 1024*s);
        ctx.fillStyle = 'black';
        if(o.arm) ctx.fillRect( 784*s, 448*s, 236*s, 186*s );
        if(o.leg) ctx.fillRect( 512*s, 734*s, 287*s, 290*s );
        if(o.foot) ctx.fillRect( 817*s, 822*s, 206*s, 200*s );
        if(o.chest){ 
            ctx.fillRect( 480*s, 576*s, 300*s, 160*s );
            ctx.fillRect( 553*s, 466*s, 228*s, 110*s );
            ctx.fillRect( 533*s, 531*s, 20*s, 45*s );
        }

        let img = new Image();
        img.src = this.canvas.toDataURL();

        if(this.mask) this.mask.dispose();
        //this.mask = new CanvasTexture( this.canvas );

        this.mask = new Texture( img );
        this.mask.flipY = false;
        this.mask.needsUpdate = true;
        const m = Pool.getMaterial( 'skin' );
        m.alphaTest = 0.9;
        m.alphaMap = this.mask;
        //m.needsUpdate = true;
    }


    //---------------------
    //   TOOLS
    //---------------------

    zeroColor(g){

        if( g.isMesh ) g = g.geometry;
        let lng = g.attributes.position.array.length;
        g.setAttribute( 'color', new Float32BufferAttribute( new Array(lng).fill(0), 3 ) );

    }

    /*uv2( g, uv2 = true, tangent = true ) {

        if( g.isMesh ) g = g.geometry;
        g.setAttribute( 'uv2', g.attributes.uv );

    }*/

}

//
// not use native character function of physics engine 
// use some code from https://github.com/ErdongChen-Andrew/CharacterControl
// 

class Hero extends Object3D {

	constructor( o = {}, motor ) {

		super();

		this.motor = motor;
		this.utils = this.motor.utils;

		this.isCharacter = true;
		this.isPlayer = false;
		this.enable = false;

		this.useImpulse = o.useImpulse || false;
		this.useFloating = o.floating || false;

		this.waitRotation = false;

		let floatHeight = 0.3;
		let radius = o.radius || 0.3;
		let height = o.height || 1.8;//0.7

		this.realHeight = height;

		if(this.useFloating){
			height -= floatHeight;
		}

		this.option = {

			debug: false,
			capsuleHalfHeight: height*0.5,
			capsuleRadius: radius,
			floatHeight: floatHeight,
			characterInitDir: 0, // in rad
			//followLight: false,
			// Follow camera setups
			camInitDis: -5,
			camMaxDis: -7,
			camMinDis: -0.7,
			// Base control setups
			maxVelLimit: 5,//2.5,
			turnVelMultiplier: 0.2,
			turnSpeed: 15,
			sprintMult: 2,
			jumpVel: 4,
			jumpForceToGroundMult: 5,
			slopJumpMult: 0.25,
			sprintJumpMult: 1.2,
			airDragMultiplier: 0.2,
			dragDampingC: 0.15,
			accDeltaTime: 8,
			rejectVelMult: 4,
			moveImpulsePointY: 0.5,
			camFollowMult: 11,
			fallingGravityScale: 2.5,
			fallingMaxVel: -20,
			wakeUpDelay: 200,
			// Floating Ray setups
			rayOriginOffest: { x: 0, y: -height*0.5, z: 0 },
			rayHitForgiveness: 0.1,
			rayLength: radius + 2,
			rayDir: { x: 0, y: -1, z: 0 },

			floatingDis: radius + floatHeight + 0.08,
			springK: 2, //1.2,
			dampingC: 0.2,//0.08,
			// Slope Ray setups
			showSlopeRayOrigin: false,
			slopeMaxAngle: 1, // in rad
			slopeRayOriginOffest: radius - 0.03,
			slopeRayLength: radius + 3,
			slopeRayDir: { x: 0, y: -1, z: 0 },
			slopeUpExtraForce: 0.1,
			slopeDownExtraForce: 0.2,
			// AutoBalance Force setups
			autoBalance: true,
			autoBalanceSpringK: 1.2,//0.3,
			autoBalanceDampingC: 0.04,
			autoBalanceSpringOnY: 0.7,
			autoBalanceDampingOnY: 0.05,
			// Animation temporary setups
			animated: false,
			mode:null,

			//...o

		};

		this.v = {

			movingObjectVelocityInCharacterDir: new Vector3(),
			movingObjectVelocity: new Vector3(),
			standingForcePoint: new Vector3(),

			pivotPosition: new Vector3(),
			//modelEuler: new Euler(),
			modelQuat: new Quaternion$1(),
			moveImpulse: new Vector3(),
			impulseCenter: new Vector3(),
			movingDirection: new Vector3(),
			moveAccNeeded: new Vector3(),
			jumpVelocityVec: new Vector3(),
			jumpDirection: new Vector3(),
			currentVel: new Vector3(),
			currentPos: new Vector3(),
			dragForce: new Vector3(),
			dragAngForce: new Vector3(),
			wantToMoveVel: new Vector3(),
			rejectVel: new Vector3(),

			// Floating Ray setup
			floatingForce:null,
			springDirVec: new Vector3(),
			rayOrigin: new Vector3(),
			characterMassForce: new Vector3(),

			// slope
			slopeAngle:null,
			actualSlopeNormal: new Vector3(),
			actualSlopeAngle:null,
			actualSlopeNormalVec: new Vector3(),
			floorNormal: new Vector3(0, 1, 0),
			slopeRayOriginRef: new Vector3(),
			slopeRayorigin: new Vector3(),

			canJump:false,
			isFalling:false,
			//run:false,
			isOnMovingObject:false,

		};

		//this.angvel = new Vector3();

		this.fixWeight = o.fixWeight !== undefined ? o.fixWeight : true;

		this.type = 'character';
		this.name = o.name || 'hero';
		o.name = this.name;

		this.isRay = false;

		this.ray = null;
		this.model = null;
		this.static = false;
		this.moving = false;
		this.running = false;
		this.wantJump = false;

		//this.lod = -1;

		this.radius = radius;
		this.height = height;
		this.mass = o.mass || 0.84;
		
		delete o.radius;

		this.fall = false;
		this.floor = true;

		this.distance = 0;
		this.rayAngle = 0;
		this.rayStart = -(this.height*0.5)+this.radius;
		//this.rayEnd = this.rayStart - (radius + 2);//this.height;
		this.rayEnd = this.rayStart - (4*floatHeight);//this.height;
		this.maxRayDistance = this.height;

		this.contact = false;

		this.velocity = new Vector3();
		this.angular = new Vector3();

		this.tmpV1 = new Vector3();
		this.tmpV2 = new Vector3();
		this.ease = new Vector3();
		this.tmpAcc = 0;
		this.rs = 0;
		this.ts = 0;
		this.diagonal = 1/Math.sqrt(2);

		this.jump = false;
		this.crouch = false;
		this.toggle = true;
		this.oy = 0;
		this.vy = 0;

		this.timeScale = 1.25;

		this.angle = ( o.angle || 0 ) * torad$3;

		this.speed = {
		    idle:1,
		    fight:1,
		    walk:7.8,
		    crouch:7,
		    run:12,
		};

		this.valheimStyle = true;
		this.globalRay = o.ray || false;

		this.callback = o.callback || function (){};

		if( o.callback ) delete o.callback;

		this.initPhysic( o );

	}

	setHeight( H ) {

		if( this.model ) this.model.setRealSize( H );

	}

	reSizePhysics( h ) {
		
		if( h === this.realHeight ) return;

		this.realHeight = h;
		this.height = this.realHeight - (this.useFloating ? this.option.floatHeight : 0);
		let pos = this.position.toArray();
		pos[1] += (this.height*0.5) + (this.useFloating ? this.option.floatHeight : 0);
		let size = [ this.radius, this.height-(2*this.radius) ];

		this.phyData.pos = pos;
		this.phyData.size = size;

		this.motor.post({ m:'add', o:this.phyData });

	}

	initPhysic( o ){

	    if(!o.size) o.size = [ this.radius, this.height-(2*this.radius) ];
		if(!o.pos) o.pos = [0,0,0];

		o.pos[1] += this.height*0.5;
		if( this.useFloating ) o.pos[1] += this.option.floatHeight;

		if( this.globalRay ) this.motor.getGeometryRef( { ...o, type:'capsule', ray:true }, this, this.motor.mat.get('hide') );

		this.phyData = {

			name: this.name,
			size: o.size,
			pos: o.pos,
			type: 'character',
			shapeType: o.shapeType || 'capsule',
			density: 1,//o.density || 1,
			mass: this.mass, 
			friction: o.friction !== undefined ? o.friction : 0.5,
			angularFactor:[0,0,0],
			group: 16,
			regular:true,

			massInfo: o.massInfo,
		};

		if(this.motor.engine === 'HAVOK')this.phyData['inertia'] = [0,0,0];

		if( o.mask ) this.phyData['mask'] = o.mask;

		//o.volume = MathTool.getVolume( 'capsule', o.size );
	

		// add to world
		this.motor.getCharacterRef().addToWorld( this, o.id );

        // add capsule to physics
        //root.post({ m:'add', o:o });
        this.motor.post({ m:'add', o:this.phyData });

        // add bottom RAY
        if( this.useFloating ) this.ray = this.motor.add({ type:'ray', name:this.name + '_ray', begin:[0,this.rayStart,0], end:[0,this.rayEnd, 0], callback:this.selfRay.bind(this), visible:false, parent:this.name });


        // add skinning character model
        if( o.gender ) this.addModel( o );
        else this.showHelper( true );

        this.enable = true;
		
	}

	extraRemove(){
		// TODO bug with delete ray ?!
		if( this.ray ) this.motor.remove( this.name + '_ray' );
	}

	/*clear(){
		root.motor.remove([this.name, this.name + '_ray']);
	}*/

    selfRay( r ){

    	if( r.hit ){ 
    		this.distance = r.distance; //MathTool.toFixed(r.distance-this.radius)
    		this.rayAngle = r.angle;
    		//this.v.canJump = true;
    		//console.log('true')
    	} else { 
	        this.distance =this.option.rayLength;//maxRayDistance;
	        this.rayAngle = 0;
	        //console.log('false')
	        //this.v.canJump = false;	    
	    }

    }

    hit( d ){

    	this.contact = d;

    }

    showHelper( b ){

    	if(b){
    		if(!this.helper){
    			this.helper = new CapsuleHelper(this.radius, this.height, true, this.motor.mat.get('line'), [1,0.6,0], [0.6,0.2,0] );
    			this.helper.setDirection( this.angle ); 
		        this.add( this.helper );
    		}
    	} else {
    		if(this.helper){
    			this.remove(this.helper);
    			this.helper.dispose();
    			this.helper = null;
    		}
    	}

    	if( this.ray ) this.ray.visible = b;

    }

    addSkeleton(){

    	if( this.skeletonBody ) return
    	if( !this.model ) return
    	//this.skeletonBody = new SkeletonBody( this )
        this.skeletonBody = new SkeletonBody( this.motor, this.name, this.model.root, this.model.skeleton.bones );
    	this.motor.scene.add( this.skeletonBody );
    	this.skeletonBody.isVisible( false );

    }

    debugMode( v = false ){

    	if( this.skeletonBody ) this.skeletonBody.isVisible(v);
    	//if( this.model ) this.model.setMaterial( { wireframe: v, visible:!v })
    	if( this.model && this.skeletonBody ) this.model.setMaterial( { transparent:v, opacity:v?0.8:1.0 }, !v );
    	
    	this.showHelper( v );
        

    }

    setMode( name ){

    	if( this.skeletonBody ) this.skeletonBody.setMode( name );

    	//this.skeletonBody = new SkeletonBody( this )
    	//this.model.add( this.skeletonBody )

    }

	addModel( o ){

		this.model = new Avatar({ 
			type:o.gender, 
			anim: o.anim !== undefined ? o.anim : 'idle', 
			compact:true, 
			material:!o.noMat, 
			morph:o.morph || false, 
			randomMorph:o.randomMorph || false,
			randomSize:o.randomSize || false,
			callback:this.callback,
			fixWeight: this.fixWeight,
			noLOD : o.noLOD || false,
		});

		this.add( this.model );
		///this.model.rotation.order = 'YXZ'
		let ypos = -(this.height*0.5);
		if( this.useFloating ) ypos -= this.option.floatHeight;
		this.model.setPosition(0, this.model.decalY + ypos, 0);
		this.model.rotation.y = this.angle;
		this.model.updateMatrix();

	}

	raycast(){
		return;// false;
	}

	/*preStep(){
		if(this.skeletonBody) this.skeletonBody.update()
	}*/

	step ( AR, n ) {
		
		this.position.fromArray( AR, n + 1 );
		this.quaternion.fromArray( AR, n + 4 );
		this.velocity.fromArray( AR, n + 8 );
		this.angular.fromArray( AR, n + 11 );

		this.fall = this.position.y < this.oy;
		this.floor = MathTool.nearEquals(this.position.y, this.oy, 0.1);
		this.oy = this.position.y;
		

		if( this.model ) {
			this.model.update( this.motor.delta );
			this.getDistanceToCamera();
		}


		if( this.useFloating && !this.isPlayer ){ 

			this.stopMoving();

			this.getFloating();

	    	this.motor.change({

			    name:this.name,
			    impulse: this.v.moveImpulse.toArray(), 
			    impulseCenter: this.v.impulseCenter.toArray(),

			});

			


	    }

		//if(this.skeletonBody) this.skeletonBody.update()
		this.updateMatrix();
		

	}

	getDistanceToCamera () {

		if( !this.model ) return
		if( !this.model.haveLOD ) return

		const camera = this.motor.getCamera();
		//this.tmpV1.setFromMatrixPosition( camera.matrixWorld );
		this.tmpV1.copy( this.motor.getCurrentCharacterPosition() );
		this.tmpV2.copy( this.position );//setFromMatrixPosition( this.matrixWorld );
		const distance = this.tmpV1.distanceTo( this.tmpV2 ) / camera.zoom;

		//console.log(distance)

		let level = distance > 3 ? 0 : 1;
		//if( level !== this.lod ){
		//	this.lod = level;
			this.model.setLevel( level );
		
	}

	set ( o ) {

		//console.log('set', o)
		if(o.morph){
			if(this.model) this.model.setMorph( o.morph, o.value );
		}

	}

	dispose () {

		//console.log('dispose')

		this.callback = null;
		if( this.skeletonBody ) this.skeletonBody.dispose();
		if( this.model ) this.model.dispose();
		if( this.helper ) this.showHelper();

		//if( this.ray ) root.motor.remove( this.name + '_ray' );
	    //this.ray = null;

		//this.ray.dispose()

		//console.log('model remove')

		//super.dispose()
	}

	onFrame ( state, delta ){

		this.v;
		this.option;

	}

	autoBalance (){

		const v = this.v;
		const o = this.option;
		const r = this.rotation;

		v.dragAngForce.set(
		    -o.autoBalanceSpringK * r.x - this.angular.x * o.autoBalanceDampingC,
		    -o.autoBalanceSpringK * r.y - this.angular.y * o.autoBalanceDampingOnY,
		    -o.autoBalanceSpringK * r.z - this.angular.z * o.autoBalanceDampingC
		);

	}

	moveCharacter ( delta, angle = 0 ){

		const v = this.v;
		const o = this.option;
		const key = this.motor.getKey();
		this.motor.getAzimut();

		
		

		v.currentPos.copy(this.position);

		

		//v.movingObjectVelocity = 
		v.slopeAngle = 0;//azimut;



	    // Setup moving direction

	    // Only apply slope extra force when slope angle is between 0.2-slopeMaxAngle, actualSlopeAngle < slopeMaxAngle
	    if ( v.actualSlopeAngle < o.slopeMaxAngle &&  Math.abs(v.slopeAngle) > 0.2 && Math.abs(v.slopeAngle) < o.slopeMaxAngle ) {
	    	v.movingDirection.set(0, Math.sin(v.slopeAngle), Math.cos(v.slopeAngle));
	    } else if ( v.actualSlopeAngle >= o.slopeMaxAngle ) {
	    	v.movingDirection.set( 0, Math.sin(v.slopeAngle) > 0 ? 0 : Math.sin(v.slopeAngle), Math.sin(v.slopeAngle) > 0 ? 0.1 : 1 );
	    } else {
	    	v.movingDirection.set(0, 0, 1);
	    }



	    // Apply character quaternion to moving direction
	    //if( this.model ) v.movingDirection.applyQuaternion( this.model.quaternion );
	    v.movingDirection.applyAxisAngle( {x:0, y:1, z:0}, angle );

	    

	    // Calculate moving object velocity direction according to character moving direction
	    v.movingObjectVelocityInCharacterDir.copy(v.movingObjectVelocity).projectOnVector(v.movingDirection).multiply(v.movingDirection);
	    // Calculate angle between moving object velocity direction and character moving direction
	    const angleBetweenCharacterDirAndObjectDir = v.movingObjectVelocity.angleTo(v.movingDirection);

	    //Setup rejection velocity, (currently only work on ground)
	    const wantToMoveMeg = v.currentVel.dot(v.movingDirection);
	    v.wantToMoveVel.set( v.movingDirection.x * wantToMoveMeg, 0, v.movingDirection.z * wantToMoveMeg );
	    v.rejectVel.copy(v.currentVel).sub(v.wantToMoveVel);


	    // Calculate required accelaration and force: a = Δv/Δt
	    // If it's on a moving/rotating platform, apply platform velocity to Δv accordingly
	    // Also, apply reject velocity when character is moving opposite of it's moving direction
	    
	    v.moveAccNeeded.set(
	        (v.movingDirection.x * (o.maxVelLimit * (this.running ? o.sprintMult : 1) + v.movingObjectVelocityInCharacterDir.x) - (v.currentVel.x - v.movingObjectVelocity.x * Math.sin(angleBetweenCharacterDirAndObjectDir) + v.rejectVel.x * (v.isOnMovingObject ? 0 : o.rejectVelMult))) / o.accDeltaTime,
	        0,
	        (v.movingDirection.z * (o.maxVelLimit * (this.running ? o.sprintMult : 1) + v.movingObjectVelocityInCharacterDir.z) - (v.currentVel.z - v.movingObjectVelocity.z * Math.sin(angleBetweenCharacterDirAndObjectDir) + v.rejectVel.z * (v.isOnMovingObject ? 0 : o.rejectVelMult))) / o.accDeltaTime
	    );

	    // Wanted to move force function: F = ma
	    const moveForceNeeded = v.moveAccNeeded.multiplyScalar( this.mass );

	    //console.log(this.mass)

  
	    // Check if character complete turned to the wanted direction
	    //let characterRotated = Math.sin(this.rotation.y).toFixed(3) == Math.sin(v.modelEuler.y).toFixed(3);
	    let characterRotated = true;
	    if( this.waitRotation ) characterRotated = Math.sin( angle ).toFixed(3) == Math.sin(this.rotation.y).toFixed(3);

	    // If character hasn't complete turning, change the impulse quaternion follow characterModelRef quaternion
	    if ( !characterRotated ) {
	    	v.moveImpulse.set(
	    		moveForceNeeded.x * o.turnVelMultiplier * (v.canJump ? 1 : o.airDragMultiplier), // if it's in the air, give it less control
	    		v.slopeAngle === null || v.slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
	            ? 0 : v.movingDirection.y * o.turnVelMultiplier *
	            (v.movingDirection.y > 0 // check it is on slope up or slope down
	            ? o.slopeUpExtraForce : o.slopeDownExtraForce) * (this.running ? o.sprintMult : 1),
	            moveForceNeeded.z * o.turnVelMultiplier * (v.canJump ? 1 : o.airDragMultiplier) // if it's in the air, give it less control
	        );
	    }
	    // If character complete turning, change the impulse quaternion default
	    else {
	        v.moveImpulse.set(
	        	moveForceNeeded.x * (v.canJump ? 1 : o.airDragMultiplier),
	        	v.slopeAngle === null || v.slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
	        	? 0 : v.movingDirection.y * (v.movingDirection.y > 0 // check it is on slope up or slope down
	            ? o.slopeUpExtraForce : o.slopeDownExtraForce) * (this.running ? o.sprintMult : 1),
	            moveForceNeeded.z * (v.canJump ? 1 : o.airDragMultiplier)
	        );
	    }


	    v.impulseCenter.set( v.currentPos.x, v.currentPos.y + o.moveImpulsePointY, v.currentPos.z );

	    // Character current velocity
	    v.currentVel.copy(this.velocity);

	    // Jump impulse

	    if ( key[4] && v.canJump ) {
	    	v.jumpVelocityVec.set( v.currentVel.x, this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel, v.currentVel.z );
	    	v.moveImpulse.y = v.jumpVelocityVec.y;
	    }

	   //v.jumpDirection.set(0, ( this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel ) * o.slopJumpMult, 0).projectOnVector(v.actualSlopeNormalVec).add(v.jumpVelocityVec)
	    //root.motor.change({ name:this.name, linearVelocity:v.jumpDirection.toArray() });

	}

	getFloating (){
		
		const v = this.v;
		const o = this.option;

		const floatingForce = o.springK * (o.floatingDis - this.distance) - this.velocity.y * o.dampingC;
		v.moveImpulse.y = floatingForce * (this.mass);

	}

	stopMoving (){
		
		this.v;
		this.option;

		this.v.moveImpulse.set(0,0,0);

		// slowdown

		this.tmpV1.copy(this.velocity);//.multiplyScalar( 0.9 )
		this.tmpV1.x *= 0.9;
		this.tmpV1.z *= 0.9;

		if(this.tmpV1.x + this.tmpV1.z === 0 ) return;

		this.motor.change({

		    name:this.name,
		    //force: this.tmpV1.toArray(), forceMode:'velocity', 
		    linearVelocity: this.tmpV1.toArray(),
		    //angularVelocity: this.tmpV2.toArray(),
		    wake:false,
		    //noGravity:true 
		});

	}

	

	move () {

		this.v;

		const key = this.motor.getKey();
		const azimut = this.motor.getAzimut();
		const delta = this.motor.delta;
		
		// 1°/ find the good animation

		let anim = key[7] !== 0 ? 'run' : 'walk';
	    if( key[0] === 0 && key[1] === 0 ) anim = 'idle';//*= 0.9
	    let m = key[0] !== 0 && key[1] !== 0 ? this.diagonal : 1;

	    if( key[5] && this.toggle ){ 
	    	this.crouch = !this.crouch;
	    	this.toggle = false;
	    }
	    if( key[5] === 0 ) this.toggle = true;
	    if( ( anim==='walk' || anim==='run') && this.crouch ) anim = 'crouch';
	    if( key[6] === 1 ) anim = 'fight';

	    if( !this.jump && key[4] ){ this.vy = 22; this.jump = true; } // SPACE KEY

	    if( this.jump ){
	        this.vy-=1;
	        if(this.vy <= 0 ){ 
	            this.vy = 0; 
	            if( this.floor ) this.jump = false;

	            //if( MathTool.nearEquals(this.position.y, this.oy, 0.1)) this.jump = false;
	            //this.position.y === this.oy 
	        }
	    }

	    let mAnim = 'idle';
	    switch( anim ){
	    	case 'idle': mAnim = this.crouch ? 'Crouch Idle' : 'idle'; break;
	    	case 'walk': mAnim = 'Jog Forward'; break;
	    	case 'run': mAnim = 'Standard Run'; break;
	    	case 'crouch': mAnim = 'Crouch Walk'; break;
	    	case 'fight': mAnim = 'Attack'; break;
	    }


	    this.moving = key[0] !== 0 || key[1] !== 0;
	    this.running = key[7] !== 0;
	    this.wantJump = key[4] !== 0;

	    let angle = MathTool.unwrapRad( ( Math.atan2(key[0], key[1])) + azimut );


	    // 2°/ physic control

	    if( this.useImpulse ) {

	    	if( this.moving ) this.moveCharacter( delta, angle );
	    	else this.stopMoving();

	        if( this.useFloating ) this.getFloating();

	    	this.motor.change({

			    name:this.name,
			    impulse: this.v.moveImpulse.toArray(), 
			    impulseCenter: this.v.impulseCenter.toArray(),

			});

	    } else { // old method

	    	this.tmpAcc += delta*4;//MathTool.lerp( tmpAcc, 1, delta/10 )
	        //this.tmpAcc += MathTool.lerp( this.tmpAcc, 1, delta/10 )
	        //this.tmpAcc = MathTool.clamp( this.tmpAcc, 1, speed )

	        const genSpeed = 1.0;

	   		let speed = this.speed[anim] * genSpeed;

	        //this.rs += key[0] //* this.tmpAcc 
	        //this.ts += key[1] //* this.tmpAcc
			if( this.moving ){
		        this.rs = key[0] * speed; 
		        this.ts = key[1] * speed;
		    }

		    if( key[0] === 0 && key[1] === 0 ) this.tmpAcc = 0;//*= 0.9
		    if( this.tmpAcc>1 ) this.tmpAcc = 1;

		    this.ease.set( this.rs, 0, this.ts ).multiplyScalar( this.tmpAcc * m );

		    //let angle = math.unwrapRad( (Math.atan2(this.ease.z, this.ease.x)) + azimut );
		    //let angle = MathTool.unwrapRad( ( Math.atan2(key[0], key[1])) + azimut );
	    

		    this.ease.length(); //((Math.abs(this.ease.x) + Math.abs(this.ease.z)))

	        if( this.static ) this.ease.x = this.ease.z = 0;

		    let g = this.vy - 9.81;
		    this.ease.y = g;
		    this.tmpV1.copy( this.ease ).applyAxisAngle( { x:0, y:1, z:0 }, azimut );
		    //math.tmpV2.set( 0, rs, 0 );
		    this.tmpV2.set( 0, 0, 0 );

	    	this.motor.change({

			    name:this.name,
			    //force: this.tmpV1.toArray(), forceMode:'velocity', 
			    linearVelocity: this.tmpV1.toArray(), 
			    //angularVelocity: this.tmpV2.toArray(),
			    //wake:true, 
			    //noGravity:true 
			});
	    }



		if( this.helper ){ 

			this.helper.updateMatrix();
			this.helper.cone.rotation.y = azimut;//angle
			if( anim !== 'idle' ) this.helper.setDirection( angle ); 

		}


	   // if(anim!=='idle') this.model.setRotation( 0, azimut + Math.PI, 0, 0.25 )
        
        if( !this.model ) return


        //const distanceToCamera = this.getDistanceToCamera();

        //if()

        //this.model.setTimescale(this.tmpAcc)

        //this.model.setWeight( 'idle', 1-jj )
	    /*this.model.setWeight( 'Jog Forward', -this.ease.x )
	    this.model.setWeight( 'Jog Backward', this.ease.x )
	    this.model.setWeight( 'Jog Strafe Left',-this.ease.z )
	    this.model.setWeight( 'Jog Strafe Right', this.ease.z )*/
	    
	   

	    //if(anim!=='idle') this.model.syncro('Jog Forward')

	    //console.log(tmpAcc)

        
	    if( this.jump ){
	    	this.model.play( 'Jump', 0.5 );
	    	//this.model.setTimescale( 1 )
	    }else {

	    	this.model.play( mAnim, 0.75 );
	    	//this.model.setTimescale( this.timeScale )
	    	//this.model.setTimescale( 1 )
	    }

	    if( anim !== 'idle' ){

	    	//this.model.setTimescale( 2.0 )

	    	let pp = MathTool.unwrapRad( this.model.rotation.y );
	    	//if( anim === 'fight' ) pp = math.unwrapRad( azimut + Math.PI )
	    	let aa = MathTool.nearAngle( angle, pp );
	    	let diff = Math.abs(Math.floor((pp - aa)*math.todeg)/180);
	    	//console.log(diff)
	    	//this.model.rotation.y = anim === 'fight' ? (azimut + Math.PI) : math.lerp( pp, aa, 0.25 )
	    	this.model.rotation.y = anim === 'fight' ? (azimut + Math.PI) : MathTool.lerp( pp, aa, 0.2 - (diff*0.1) );
	    	this.model.updateMatrix();
	    	//this.model.setTimescale( this.tmpAcc * (1*genSpeed) )

	    	//let m = this.model.getAction( anim )
	    	//if( m ) m.setEffectiveTimeScale( this.tmpAcc * (1*genSpeed) );
	    	//if( m ) m.setEffectiveTimeScale( 0 );
	    }

	    //if( this.helper ) this.helper.setDirection( this.model.rotation.y )

	}


}

// THREE CHARACTER

class Character extends Item {

	constructor( motor ) {

		super();

		this.motor = motor;

		this.Utils = this.motor.utils;
		this.type = 'character';
		this.num = Num[this.type];

	}

	/*prestep () {

		let i = this.list.length;
		while( i-- ) this.list[i].preStep( );

	}*/

	step (AR, N) {
		
		let i = this.list.length, n, s;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * this.num );

			if(s) s.step( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o );
		const hero = new Hero( o, this.motor );
		return hero;

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return;
		b.set(o);

	}
	
}

const math$2 = {

	torad: Math.PI / 180,
	todeg: 180 / Math.PI,
	Pi: Math.PI,
	TwoPI: Math.PI*2,
	PI90: Math.PI*0.5,
	PI45: Math.PI*0.25,
	PI270: (Math.PI*0.5)*3,
	inv255: 0.003921569,
	golden: 1.618033,
	epsilon: Math.pow( 2, -52 ),

	randomSign: () => ( Math.random() < 0.5 ? -1 : 1 ),
	randSpread: ( range ) => ( range * ( 0.5 - Math.random() ) ),
	rand: ( low = 0, high = 1 ) => ( low + Math.random() * ( high - low ) ),
	randInt: ( low, high ) => ( low + Math.floor( Math.random() * ( high - low + 1 ) ) ),
	toFixed: ( x, n = 3 ) => ( x.toFixed(n) * 1 ),
	int: ( x ) => ( Math.floor(x) ),
	lerp: ( x, y, t ) => ( ( 1 - t ) * x + t * y ),
	clamp: ( v, min, max ) => ( Math.max( min, Math.min( max, v )) ),
	nearEquals: ( a, b, t ) => ( Math.abs(a - b) <= t ? true : false ),
	lerpAr: ( ar, arx, ary, t ) => {
		let i = ar.length;
		while( i-- ) ar[i] = math$2.lerp( arx[i], ary[i], t );
	},

    unwrapDeg: ( r ) => (r - (Math.floor((r + 180)/360))*360), 
	//unwrapRad: ( r ) => (r - (Math.floor((r + Math.PI)/(2*Math.PI)))*2*Math.PI),
	unwrapRad: ( r ) => ( Math.atan2(Math.sin(r), Math.cos(r)) ),


	scaleArray: ( ar, scale ) => {

		var i = ar.length;
		while( i-- ){ ar[i] *= scale; }		return ar;

	},

	addArray: ( ar, ar2 ) => {

		var r = [];
		var i = ar.length;
		while( i-- ){ r[i] = ar[i] + ar2[i]; }		return r;

	},

	angleDistance:(cur, prv)=> {
		var diff = (cur - prv + 180) % 360 - 180;
		return diff < -180 ? diff + 360 : diff;
	},




	/*map: ( value, in_min, in_max, out_min, out_max ) => ( (value - in_min) * (out_max - out_min) / (in_max - in_min) + out_min ),
	
	smoothLerp: ( a, b, c, t, k ) => {

        var f = a - b + (c - b) / (k * t);
        return c - (c - b) / ( k * t ) + f * Math.exp(-k*t);

    },

    smoothLerpV: ( a, b, c, t, k ) => {

    	let x = math.smoothLerp( a.x, b.x, c.x, t, k );
    	let y = math.smoothLerp( a.y, b.y, c.y, t, k );
    	let z = math.smoothLerp( a.z, b.z, c.z, t, k );

    	return { x:x, y:y, z:z }

    },

	minValue: ( ar ) => {

		let v = ar[0];
		for (let i = 1, l=ar.length; i<l; i++){ if( ar[i] < v ) v = ar[i]; }
		return v;

	},

	clamp: function (v, min, max) {

		//return Math.max( min, Math.min( max, value ) );
	    v = v < min ? min : v;
	    v = v > max ? max : v;
	    return v;
	},

	autoSize: ( o ) => {

		let s = o.size === undefined ? [ 1, 1, 1 ] : o.size;
		if ( s.length === 1 ) s[ 1 ] = s[ 0 ];

		let type = o.type === undefined ? 'box' : o.type;
		let radius = o.radius === undefined ? s[0] : o.radius;
		let height = o.height === undefined ? s[1] : o.height;

		if( type === 'sphere' ) s = [ radius, radius, radius ];
		if( type === 'cylinder' || type === 'wheel' || type === 'capsule' ) s = [ radius, height, radius ];
		if( type === 'cone' || type === 'pyramid' ) s = [ radius, height, 0 ];

	    if ( s.length === 2 ) s[ 2 ] = s[ 0 ];
	    return s;

	},

	correctSize: ( s ) => {

		if ( s.length === 1 ) s[ 1 ] = s[ 0 ];
	    if ( s.length === 2 ) s[ 2 ] = s[ 0 ];
	    return s;

	},*/

	tmpE: new Euler(),
	tmpM: new Matrix4(),
	tmpM2: new Matrix4(),
	tmpV: new Vector3(),
	tmpQ: new Quaternion$1(),

	fromTransformToQ: ( p, q, inv ) => {

		inv = inv || false;

		math$2.tmpM.compose( math$2.tmpV.fromArray( p ), math$2.tmpQ.fromArray( q ), { x:1, y:1, z:1 } );
		math$2.tmpM.decompose( math$2.tmpV, math$2.tmpQ, { x:1, y:1, z:1 } );

		//math.tmpQ.fromArray( q )

		if(inv) math$2.tmpQ.invert();

		return math$2.tmpQ.toArray();

	},

	fromTransform: ( p, q, p2, q2, inv ) => {

		inv = inv || false;
		q2 = q2 || [0,0,0,1];

		math$2.tmpM.compose( math$2.tmpV.fromArray( p ), math$2.tmpQ.fromArray( q ), { x:1, y:1, z:1 } );
		math$2.tmpM2.compose( math$2.tmpV.fromArray( p2 ), math$2.tmpQ.fromArray( q2 ), { x:1, y:1, z:1 } );
		if( inv ){
			//math.tmpM.getInverse( math.tmpM );
			math$2.tmpM.invert();
			math$2.tmpM.multiply( math$2.tmpM2 );
		} else {
			math$2.tmpM.multiply( math$2.tmpM2 );
		}

		math$2.tmpM.decompose( math$2.tmpV, math$2.tmpQ, { x:1, y:1, z:1 } );

		return math$2.tmpV.toArray();

	},

	arCopy: ( a, b ) => {

		[...b];

		//for( var i = 0; i< b.length; i++ ) a[i] = b[i];

	},

	axisToQuatArray: ( r, isdeg ) => { // r[0] array in degree

		isdeg = isdeg || false;
		return math$2.tmpQ.setFromAxisAngle( math$2.tmpV.fromArray( r, 1 ), isdeg ? r[0]*math$2.torad : r[0]).normalize().toArray();

	},

	toQuatArray: ( rotation ) => { // rotation array in degree

		return math$2.tmpQ.setFromEuler( math$2.tmpE.fromArray( math$2.vectorad( rotation ) ) ).toArray();

	},

	vectorad: ( r ) => {

		let i = 3, nr = [];
	    while ( i -- ) nr[ i ] = r[ i ] * math$2.torad;
	    nr[3] = r[3];
	    return nr;

	},
/*
	directionVector: ( a, b ) => {

	    var x = b.x-a.x;
	    var y = b.y-a.y;
	    var z = b.z-a.z;
	    var d = math.tmpV.set( x, 0, z ).normalize().toArray();
	    return d;

	},

	distanceVector: ( a, b ) => {

	    var x = b.x-a.x;
	    var y = b.y-a.y;
	    var z = b.z-a.z;
	    var d = Math.sqrt( x*x + y*y + z*z );
	    return d;

	},*/


	//--------------------
	//   COLORS
	//--------------------

	rgbToHex: ( rgb ) => {

	    return '0x' + ( '000000' + ( ( rgb[0] * 255 ) << 16 ^ ( rgb[1] * 255 ) << 8 ^ ( rgb[2] * 255 ) << 0 ).toString( 16 ) ).slice( -6 );

	},

	hexToRgb: ( hex ) => {

	    hex = Math.floor( hex );
	    var r = ( hex >> 16 & 255 ) / 255;
	    var g = ( hex >> 8 & 255 ) / 255;
	    var b = ( hex & 255 ) / 255;
	    return [ r, g, b ];

	},

	htmlToHex: ( v ) => {

	    return v.toUpperCase().replace("#", "0x");

	},

	hexToHtml: ( v ) => {

	    v = v === undefined ? 0x000000 : v;
	    return "#" + ("000000" + v.toString(16)).substr(-6);

	},

	rgbToHtml: ( rgb ) => {

	    return '#' + ( '000000' + ( ( rgb[0] * 255 ) << 16 ^ ( rgb[1] * 255 ) << 8 ^ ( rgb[2] * 255 ) << 0 ).toString( 16 ) ).slice( -6 );

	},


	//--------------------
	//   NOISE
	//--------------------

	perlin: null,

	resetPerlin:()=>{
		if( math$2.perlin !== null ) math$2.perlin = null;
	},

	noise: ( v, o ) => {

	    if( math$2.perlin === null ) math$2.perlin = new SimplexNoise();

	    o = o || {};

	    let level = o.level || [1,0.2,0.05];
	    let frequency  = o.frequency  || [0.016,0.05,0.2];

	    let i, f, c=0, d=0;

	    for(i=0; i<level.length; i++){

	        f = frequency [i];
	        c += level[i] * ( 0.5 + math$2.perlin.noise3d( v.x*f, v.y*f, v.z*f ) * 0.5 );
	        d += level[i];

	    }

	    c/=d;

	    return c;

	},

	/*radArray: (arr) => {
		var ret = [];
		for(var i = 0; i < 3; i++)
			ret[i] = arr[i] * math.torad;

		return ret;
	},

	degArray: (arr) => {
		var ret = [];
		for(var i = 0; i < 3; i++)
			ret[i] = arr[i] * math.todeg;

		return ret;
	},

	angleDistance: (cur, prv) =>{
		var diff = (cur - prv + 180) % 360 - 180;
		return diff < -180 ? diff + 360 : diff;
	}*/

};

class SimplexNoise {

	constructor ( r ) {

		if (r == undefined) r = Math;
		this.grad3 = [[ 1,1,0 ],[ -1,1,0 ],[ 1,-1,0 ],[ -1,-1,0 ],
	        [ 1,0,1 ],[ -1,0,1 ],[ 1,0,-1 ],[ -1,0,-1 ],
	        [ 0,1,1 ],[ 0,-1,1 ],[ 0,1,-1 ],[ 0,-1,-1 ]];

		this.grad4 = [[ 0,1,1,1 ], [ 0,1,1,-1 ], [ 0,1,-1,1 ], [ 0,1,-1,-1 ],
		     [ 0,-1,1,1 ], [ 0,-1,1,-1 ], [ 0,-1,-1,1 ], [ 0,-1,-1,-1 ],
		     [ 1,0,1,1 ], [ 1,0,1,-1 ], [ 1,0,-1,1 ], [ 1,0,-1,-1 ],
		     [ -1,0,1,1 ], [ -1,0,1,-1 ], [ -1,0,-1,1 ], [ -1,0,-1,-1 ],
		     [ 1,1,0,1 ], [ 1,1,0,-1 ], [ 1,-1,0,1 ], [ 1,-1,0,-1 ],
		     [ -1,1,0,1 ], [ -1,1,0,-1 ], [ -1,-1,0,1 ], [ -1,-1,0,-1 ],
		     [ 1,1,1,0 ], [ 1,1,-1,0 ], [ 1,-1,1,0 ], [ 1,-1,-1,0 ],
		     [ -1,1,1,0 ], [ -1,1,-1,0 ], [ -1,-1,1,0 ], [ -1,-1,-1,0 ]];

		this.p = [];
		for (var i = 0; i < 256; i ++) {
			this.p[i] = Math.floor(r.random() * 256);
		}
	  // To remove the need for index wrapping, double the permutation table length
		this.perm = [];
		for (var i = 0; i < 512; i ++) {
			this.perm[i] = this.p[i & 255];
		}

	  // A lookup table to traverse the simplex around a given point in 4D.
	  // Details can be found where this table is used, in the 4D noise method.
		this.simplex = [
	    [ 0,1,2,3 ],[ 0,1,3,2 ],[ 0,0,0,0 ],[ 0,2,3,1 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 1,2,3,0 ],
	    [ 0,2,1,3 ],[ 0,0,0,0 ],[ 0,3,1,2 ],[ 0,3,2,1 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 1,3,2,0 ],
	    [ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],
	    [ 1,2,0,3 ],[ 0,0,0,0 ],[ 1,3,0,2 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 2,3,0,1 ],[ 2,3,1,0 ],
	    [ 1,0,2,3 ],[ 1,0,3,2 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 2,0,3,1 ],[ 0,0,0,0 ],[ 2,1,3,0 ],
	    [ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],
	    [ 2,0,1,3 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 3,0,1,2 ],[ 3,0,2,1 ],[ 0,0,0,0 ],[ 3,1,2,0 ],
	    [ 2,1,0,3 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 0,0,0,0 ],[ 3,1,0,2 ],[ 0,0,0,0 ],[ 3,2,0,1 ],[ 3,2,1,0 ]];
	}

	dot (g, x, y) {
		return g[0] * x + g[1] * y;
	}

	dot3 (g, x, y, z) {
		return g[0] * x + g[1] * y + g[2] * z;
	}

	dot4 (g, x, y, z, w) {
		return g[0] * x + g[1] * y + g[2] * z + g[3] * w;
	}

	noise (xin, yin) {
		var n0, n1, n2; // Noise contributions from the three corners
	  // Skew the input space to determine which simplex cell we're in
		var F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
		var s = (xin + yin) * F2; // Hairy factor for 2D
		var i = Math.floor(xin + s);
		var j = Math.floor(yin + s);
		var G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
		var t = (i + j) * G2;
		var X0 = i - t; // Unskew the cell origin back to (x,y) space
		var Y0 = j - t;
		var x0 = xin - X0; // The x,y distances from the cell origin
		var y0 = yin - Y0;
	  // For the 2D case, the simplex shape is an equilateral triangle.
	  // Determine which simplex we are in.
		var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
		if (x0 > y0) {i1 = 1; j1 = 0;} // lower triangle, XY order: (0,0)->(1,0)->(1,1)
		else {i1 = 0; j1 = 1;}      // upper triangle, YX order: (0,0)->(0,1)->(1,1)
	  // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
	  // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
	  // c = (3-sqrt(3))/6
		var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
		var y1 = y0 - j1 + G2;
		var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
		var y2 = y0 - 1.0 + 2.0 * G2;
	  // Work out the hashed gradient indices of the three simplex corners
		var ii = i & 255;
		var jj = j & 255;
		var gi0 = this.perm[ii + this.perm[jj]] % 12;
		var gi1 = this.perm[ii + i1 + this.perm[jj + j1]] % 12;
		var gi2 = this.perm[ii + 1 + this.perm[jj + 1]] % 12;
	  // Calculate the contribution from the three corners
		var t0 = 0.5 - x0 * x0 - y0 * y0;
		if (t0 < 0) n0 = 0.0;
		else {
			t0 *= t0;
			n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);  // (x,y) of grad3 used for 2D gradient
		}
		var t1 = 0.5 - x1 * x1 - y1 * y1;
		if (t1 < 0) n1 = 0.0;
		else {
			t1 *= t1;
			n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
		}
		var t2 = 0.5 - x2 * x2 - y2 * y2;
		if (t2 < 0) n2 = 0.0;
		else {
			t2 *= t2;
			n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
		}
	  // Add contributions from each corner to get the final noise value.
	  // The result is scaled to return values in the interval [-1,1].
		return 70.0 * (n0 + n1 + n2);
	}

	// 3D simplex noise
	noise3d (xin, yin, zin) {
		var n0, n1, n2, n3; // Noise contributions from the four corners
	  // Skew the input space to determine which simplex cell we're in
		var F3 = 1.0 / 3.0;
		var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
		var i = Math.floor(xin + s);
		var j = Math.floor(yin + s);
		var k = Math.floor(zin + s);
		var G3 = 1.0 / 6.0; // Very nice and simple unskew factor, too
		var t = (i + j + k) * G3;
		var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
		var Y0 = j - t;
		var Z0 = k - t;
		var x0 = xin - X0; // The x,y,z distances from the cell origin
		var y0 = yin - Y0;
		var z0 = zin - Z0;
	  // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
	  // Determine which simplex we are in.
		var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
		var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
		if (x0 >= y0) {
			if (y0 >= z0)
	      { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } // X Y Z order
	      else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; } // X Z Y order
			else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; } // Z X Y order
		}
		else { // x0<y0
			if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } // Z Y X order
	    else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } // Y Z X order
			else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } // Y X Z order
		}
	  // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
	  // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
	  // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
	  // c = 1/6.
		var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
		var y1 = y0 - j1 + G3;
		var z1 = z0 - k1 + G3;
		var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
		var y2 = y0 - j2 + 2.0 * G3;
		var z2 = z0 - k2 + 2.0 * G3;
		var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
		var y3 = y0 - 1.0 + 3.0 * G3;
		var z3 = z0 - 1.0 + 3.0 * G3;
	  // Work out the hashed gradient indices of the four simplex corners
		var ii = i & 255;
		var jj = j & 255;
		var kk = k & 255;
		var gi0 = this.perm[ii + this.perm[jj + this.perm[kk]]] % 12;
		var gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]] % 12;
		var gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]] % 12;
		var gi3 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]] % 12;
	  // Calculate the contribution from the four corners
		var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
		if (t0 < 0) n0 = 0.0;
		else {
			t0 *= t0;
			n0 = t0 * t0 * this.dot3(this.grad3[gi0], x0, y0, z0);
		}
		var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
		if (t1 < 0) n1 = 0.0;
		else {
			t1 *= t1;
			n1 = t1 * t1 * this.dot3(this.grad3[gi1], x1, y1, z1);
		}
		var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
		if (t2 < 0) n2 = 0.0;
		else {
			t2 *= t2;
			n2 = t2 * t2 * this.dot3(this.grad3[gi2], x2, y2, z2);
		}
		var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
		if (t3 < 0) n3 = 0.0;
		else {
			t3 *= t3;
			n3 = t3 * t3 * this.dot3(this.grad3[gi3], x3, y3, z3);
		}
	  // Add contributions from each corner to get the final noise value.
	  // The result is scaled to stay just inside [-1,1]
		return 32.0 * (n0 + n1 + n2 + n3);
	}

	// 4D simplex noise
	noise4d ( x, y, z, w ) {
		// For faster and easier lookups
		var grad4 = this.grad4;
		var simplex = this.simplex;
		var perm = this.perm;

	   // The skewing and unskewing factors are hairy again for the 4D case
		var F4 = (Math.sqrt(5.0) - 1.0) / 4.0;
		var G4 = (5.0 - Math.sqrt(5.0)) / 20.0;
		var n0, n1, n2, n3, n4; // Noise contributions from the five corners
	   // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
		var s = (x + y + z + w) * F4; // Factor for 4D skewing
		var i = Math.floor(x + s);
		var j = Math.floor(y + s);
		var k = Math.floor(z + s);
		var l = Math.floor(w + s);
		var t = (i + j + k + l) * G4; // Factor for 4D unskewing
		var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
		var Y0 = j - t;
		var Z0 = k - t;
		var W0 = l - t;
		var x0 = x - X0;  // The x,y,z,w distances from the cell origin
		var y0 = y - Y0;
		var z0 = z - Z0;
		var w0 = w - W0;

	   // For the 4D case, the simplex is a 4D shape I won't even try to describe.
	   // To find out which of the 24 possible simplices we're in, we need to
	   // determine the magnitude ordering of x0, y0, z0 and w0.
	   // The method below is a good way of finding the ordering of x,y,z,w and
	   // then find the correct traversal order for the simplex we’re in.
	   // First, six pair-wise comparisons are performed between each possible pair
	   // of the four coordinates, and the results are used to add up binary bits
	   // for an integer index.
		var c1 = (x0 > y0) ? 32 : 0;
		var c2 = (x0 > z0) ? 16 : 0;
		var c3 = (y0 > z0) ? 8 : 0;
		var c4 = (x0 > w0) ? 4 : 0;
		var c5 = (y0 > w0) ? 2 : 0;
		var c6 = (z0 > w0) ? 1 : 0;
		var c = c1 + c2 + c3 + c4 + c5 + c6;
		var i1, j1, k1, l1; // The integer offsets for the second simplex corner
		var i2, j2, k2, l2; // The integer offsets for the third simplex corner
		var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
	   // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
	   // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
	   // impossible. Only the 24 indices which have non-zero entries make any sense.
	   // We use a thresholding to set the coordinates in turn from the largest magnitude.
	   // The number 3 in the "simplex" array is at the position of the largest coordinate.
		i1 = simplex[c][0] >= 3 ? 1 : 0;
		j1 = simplex[c][1] >= 3 ? 1 : 0;
		k1 = simplex[c][2] >= 3 ? 1 : 0;
		l1 = simplex[c][3] >= 3 ? 1 : 0;
	   // The number 2 in the "simplex" array is at the second largest coordinate.
		i2 = simplex[c][0] >= 2 ? 1 : 0;
		j2 = simplex[c][1] >= 2 ? 1 : 0;    k2 = simplex[c][2] >= 2 ? 1 : 0;
		l2 = simplex[c][3] >= 2 ? 1 : 0;
	   // The number 1 in the "simplex" array is at the second smallest coordinate.
		i3 = simplex[c][0] >= 1 ? 1 : 0;
		j3 = simplex[c][1] >= 1 ? 1 : 0;
		k3 = simplex[c][2] >= 1 ? 1 : 0;
		l3 = simplex[c][3] >= 1 ? 1 : 0;
	   // The fifth corner has all coordinate offsets = 1, so no need to look that up.
		var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
		var y1 = y0 - j1 + G4;
		var z1 = z0 - k1 + G4;
		var w1 = w0 - l1 + G4;
		var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
		var y2 = y0 - j2 + 2.0 * G4;
		var z2 = z0 - k2 + 2.0 * G4;
		var w2 = w0 - l2 + 2.0 * G4;
		var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
		var y3 = y0 - j3 + 3.0 * G4;
		var z3 = z0 - k3 + 3.0 * G4;
		var w3 = w0 - l3 + 3.0 * G4;
		var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
		var y4 = y0 - 1.0 + 4.0 * G4;
		var z4 = z0 - 1.0 + 4.0 * G4;
		var w4 = w0 - 1.0 + 4.0 * G4;
	   // Work out the hashed gradient indices of the five simplex corners
		var ii = i & 255;
		var jj = j & 255;
		var kk = k & 255;
		var ll = l & 255;
		var gi0 = perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32;
		var gi1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32;
		var gi2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32;
		var gi3 = perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32;
		var gi4 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32;
	   // Calculate the contribution from the five corners
		var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
		if (t0 < 0) n0 = 0.0;
		else {
			t0 *= t0;
			n0 = t0 * t0 * this.dot4(grad4[gi0], x0, y0, z0, w0);
		}
		var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
		if (t1 < 0) n1 = 0.0;
		else {
			t1 *= t1;
			n1 = t1 * t1 * this.dot4(grad4[gi1], x1, y1, z1, w1);
		}
		var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
		if (t2 < 0) n2 = 0.0;
		else {
			t2 *= t2;
			n2 = t2 * t2 * this.dot4(grad4[gi2], x2, y2, z2, w2);
		}   var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
		if (t3 < 0) n3 = 0.0;
		else {
			t3 *= t3;
			n3 = t3 * t3 * this.dot4(grad4[gi3], x3, y3, z3, w3);
		}
		var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
		if (t4 < 0) n4 = 0.0;
		else {
			t4 *= t4;
			n4 = t4 * t4 * this.dot4(grad4[gi4], x4, y4, z4, w4);
		}
	   // Sum up and scale the result to cover the range [-1,1]
		return 27.0 * (n0 + n1 + n2 + n3 + n4);
	}

}

//import { Shader } from '../Shader.js';


class Landscape extends Mesh {

    constructor( o = {} ) {

        super();

        this.ready = false;
        this.needUpdate = false;

        this.type = 'terrain';
        this.name = o.name;

        this.folder = o.folder || './assets/textures/terrain/';

        this.mapN = 0;
        this.mapMax = 7;//7

        // terrain, water, road
        this.ttype = o.terrainType || 'terrain';

        this.callback = o.callback || function(){};
        
        this.physicsUpdate = () => {};

        this.uvx = [ o.uv || 18, o.uv || 18 ];

        this.sample = o.sample == undefined ? [128,128] : o.sample;
        this.size = o.size === undefined ? [100,30,100] : o.size;

        let sx = this.sample[0] - 1;
        let sz = this.sample[1] - 1;

        this.rx = sx / this.size[0];
        this.rz = sz / this.size[2];

        this.zone = o.zone || 1;

        // why ??
        /*let pp = 0
        if( this.zone === 0.5 ) pp=2
        if( this.zone === 0.25 ) pp=3
        if( this.zone === 0.125 ) pp=7*/
        let square = [this.size[0]/sx, this.size[2]/sz];
        //let dx = (this.size[0]/sx)//*pp
        //let dz = (this.size[2]/sz)//**pp


        this.sampleZ = [o.sample[0] * this.zone, o.sample[1] * this.zone];
        //this.sizeZ = [(o.size[0]-dx) * this.zone, o.size[1], (o.size[2]-dz) * this.zone];

        this.sizeZ = [(this.sampleZ[0]-1) * square[0], o.size[1], ((this.sampleZ[1]-1)) * square[1]];

        this.lng = this.sample[0] * this.sample[1];
        this.lngZ = this.sampleZ[0] * this.sampleZ[1];

        //console.log(  this.sample, this.sampleZ)

        this.getZid();


        this.data = {
            level: o.level || [1,0.2,0.05],
            frequency: o.frequency || [0.016,0.05,0.2],
            expo: o.expo || 1,
        };

        this.isWater = o.water || false;
        this.isIsland = o.island || false;
        this.isBorder = false;
        this.wantBorder = o.border || false;

        this.isBottom = false;
        this.wantBottom = o.bottom || false;
        this.wantBorder = o.border || false;

        this.colorBase = this.isWater ? { r:0, g:0.7, b:1 } : { r:0.25, g:0.25, b:0.25 };

        this.maxspeed = o.maxSpeed || 0.1;
        this.acc = o.acc == undefined ? 0.01 : o.acc;
        this.dec = o.dec == undefined ? 0.01 : o.dec;

        this.deep = o.deep == undefined ? 0 : o.deep;

        this.ease = new Vector2();

        // for perlin
        this.complexity = o.complexity == undefined ? 30 : o.complexity;
        this.complexity2 = o.complexity2 == undefined ? null : o.complexity2;

        this.local = new Vector3();
        if( o.local ) this.local.fromArray( o.local );

        this.pp = new Vector3();

        this.ratioZ = 1 / this.sampleZ[0];
        this.ratio = 1 / this.sample[0];
        this.ruvx =  1.0 / ( this.size[0] / this.uvx[0] );
        this.ruvy = - ( 1.0 / ( this.size[2] / this.uvx[1] ) );

        this.is64 = o.is64 || false;
        this.isTurn = o.turn || false;

        this.heightData = new Float32Array( this.lngZ );
        this.height = [];

        // for physx 
        this.isAbsolute = o.isAbsolute || false;
        this.isTurned = o.isTurned || false;
        this.isReverse = o.isReverse || false;

        this.changeId = this.isReverse || this.isTurned;

        if( this.changeId ) this.getReverseID();

        this.colors = new Float32Array( this.lng * 3 );
        this.geometry = new PlaneGeometry( this.size[0], this.size[2], this.sample[0] - 1, this.sample[1] - 1 );
        this.geometry.rotateX( -math$2.PI90 );
        //if( this.isTurn ) 
        //this.geometry.rotateY( -math.PI90 );
        //if( this.isTurned ) this.geometry.rotateY( math.PI90 );


       // this.geometry.computeBoundingSphere();

        this.geometry.setAttribute( 'color', new BufferAttribute( this.colors, 3 ) );
        //this.geometry.setAttribute( 'uv2', this.geometry.attributes.uv );
        this.vertices = this.geometry.attributes.position.array;
        var clevels = new Quaternion$1( 0.5, 0.5, 0.1, 0.2 );//0.95, 0.8, 0.1, 0.05 ); 
        if( o.maplevels ) clevels.fromArray( o.maplevels );
        var T = TerrainShader;
        var maps = o.maps || [ 'sand', 'grass3', 'rock' ], txt = {};
        var name;

        if(this.isWater) maps = ['water'];

        for( let i in maps ){

            name = maps[i];

            txt[name+'_c'] = Pool.texture({ url:this.folder + name +'_c.jpg', flip:false, repeat:this.uvx, encoding:o.encoding || true , callback: this.mapcallback.bind(this)  });
            txt[name+'_n'] = Pool.texture({ url:this.folder + name +'_n.jpg', flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });

            //txt[name+'_c'] = Pool.directTexture(this.folder + name +'_c.jpg', { flip:false, repeat:this.uvx, encoding:o.encoding || true , callback: this.mapcallback.bind(this)  });
            //txt[name+'_n'] = Pool.directTexture(this.folder + name +'_n.jpg', { flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });
           // if( isORM )txt[name+'_n'] = Pool.directTexture('./assets/textures/terrain/'+name+'_n.jpg', { flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });

        }

        //txt['noise'] = Pool.directTexture(this.folder + 'noise.png', { flip:false, repeat:[1,1], encoding:false , callback: this.mapcallback.bind(this)  });
        txt['noise'] = Pool.texture({ url:this.folder + 'noise.png', flip:false, repeat:[1,1], encoding:false , callback: this.mapcallback.bind(this)  });

        this.txt = txt;

        this.material = new MeshPhysicalMaterial({ name:'terrain', vertexColors:true, color:0xFFFFFF, map:txt[maps[0]+'_c'], normalMap:txt[maps[0]+'_n'] });

        if( o.envmap !== undefined ) this.material.envMap = o.envmap;

        if( this.isWater ){
            this.material.transparent = true;
            this.material.opacity = o.opacity || 0.4;
            this.material.side = DoubleSide;
            this.material.alphaMap = txt[maps[0]+'_c'];
            this.material.map = null;
            this.material.metalness  = 0.9;
            this.material.roughness = 0.1;
        } else {
            this.material.reflectivity = 0.0;
            this.material.metalness = o.metalness || 0.0;
            this.material.roughness = o.roughness || 0.3;//0.7; 
        }

        var ns = o.nScale || 0.5;
        this.material.normalScale.set(ns,-ns);

        if( !this.isWater ){

            let self = this;

            this.material.onBeforeCompile = function ( shader ) {

                let uniforms = shader.uniforms;

                //uniforms['fogTime'] = { value: 0 };

                uniforms['clevels'] = { value: clevels };

                uniforms['map1'] = { value: txt[maps[1]+'_c'] };
                uniforms['map2'] = { value: txt[maps[2]+'_c'] };

                uniforms['randomUv'] = { value: 1 };

                uniforms['normalMap1'] = { value: txt[maps[1]+'_n'] };
                uniforms['normalMap2'] = { value: txt[maps[2]+'_n'] };

                //uniforms['noise'] = { value: txt['noise'] };
                uniforms['noiseMap'] = { value: txt['noise'] };
                uniforms['useNoiseMap'] = { value: 1 };

                shader.uniforms = uniforms;

                let fragment = shader.fragmentShader;

                fragment = fragment.replace( '#include <clipping_planes_pars_fragment>', '#include <clipping_planes_pars_fragment>' +  randomUV + T.fragmentAdd );

                fragment = fragment.replace( '#include <map_fragment>', T.map );
                fragment = fragment.replace( '#include <normal_fragment_maps>', T.normal );
                fragment = fragment.replace( '#include <color_fragment>', '' );
                
                shader.fragmentShader = fragment;

                self.material.userData.shader = shader;

                //if( o.shader ) o.shader.modify( shader );

                //Shader.modify( shader );

            };


            Object.defineProperty( this.material, 'randomUv', {
                  get() { return this.userData.shader.uniforms.randomUv.value ? true : false; },
                  set( value ) { this.userData.shader.uniforms.randomUv.value = value ? 1 : 0; }
            });

            Object.defineProperty( this.material, 'map1', {
                  get() { return this.userData.shader.uniforms.map1.value; },
                  set( value ) { this.userData.shader.uniforms.map1.value = value; }
            });

            Object.defineProperty( this.material, 'map2', {
                  get() { return this.userData.shader.uniforms.map2.value; },
                  set( value ) { this.userData.shader.uniforms.map2.value = value; }
            });

            Object.defineProperty( this.material, 'normalMap1', {
                  get() { return this.userData.shader.uniforms.normalMap1.value; },
                  set( value ) { this.userData.shader.uniforms.normalMap1.value = value; }
            });

            Object.defineProperty( this.material, 'normalMap2', {
                  get() { return this.userData.shader.uniforms.normalMap2.value; },
                  set( value ) { this.userData.shader.uniforms.normalMap2.value = value; }
            });

        } else {

            this.material.onBeforeCompile = function ( shader ) {

                var fragment = shader.fragmentShader;

                fragment = fragment.replace( '#include <alphamap_fragment>', T.alphamap );
           
                shader.fragmentShader = fragment;

            };

        }


        //THREE.Mesh.call( this, this.geometry, this.material );

       // super( this.geometry, this.material );

        if(o.debug){
            this.debugZone(o);
        }

        //root.garbage.push( this.geometry );
        

        if( this.wantBorder ) this.addBorder( o );
        if( this.wantBottom ) this.addBottom( o );

        if( o.pos ) this.position.fromArray( o.pos );


        // rotation is in degree or Quaternion
        o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
        if( o.rot !== undefined ){ o.quat = math$2.toQuatArray( o.rot ); delete o.rot; }
        //console.log(o.quat)
        this.quaternion.fromArray( o.quat );

        if( o.decal ) this.position.y += o.decal;

        this.castShadow = true;
        this.receiveShadow = true;

        Pool.set( 'terrain' + this.name, this.material, 'material', true );

        this.update();

    }

    getZid(){ // zone id

        this.zid = {};

        let lx = (this.sample[0] - this.sampleZ[0])*0.5;
        let lz = (this.sample[1] - this.sampleZ[1])*0.5;
        let first = (this.sample[0] * lz) + lx;
        let line = 0;
        for (let j = 0; j<this.lngZ; j++ ){
            //line = j % this.sampleZ[0];
            line = Math.floor(j / this.sampleZ[0]);
            this.zid[ first + j + (line*((lx*2))) ] = j;
        }
    }

    debugZone(o) {

        this.geometryZ = new PlaneGeometry( this.sizeZ[0], this.sizeZ[2], this.sampleZ[0] - 1, this.sampleZ[1] - 1 );
        this.geometryZ.rotateX( -math$2.PI90 );
        this.verticesZ = this.geometryZ.attributes.position.array;
        
        const debuger = new Mesh( this.geometryZ, new MeshBasicMaterial({ color:0x000000, wireframe:true, transparent:true, opacity:0.1 } ));
        //if( o.pos ) debuger.position.fromArray( o.pos );
        this.add( debuger );

    }

    mapcallback (){

        this.mapN++;
        if( this.mapN == this.mapMax ){ 
           // this.material.needsUpdate = true;
            this.callback();
        }

    }

    addBottom ( o ){

    	var geometry = new PlaneGeometry( this.size[0], this.size[2], 1, 1 );
        geometry.rotateX( math$2.PI90 );
        

        this.bottomMesh = new Mesh( geometry, this.borderMaterial );

        this.add( this.bottomMesh );

        this.isBottom = true;
    }

    addBorder ( o ){

    	this.borderMaterial = new MeshStandardMaterial({ 

    		vertexColors: true, 
    		metalness: this.isWater ? 0.8 : 0.4, 
       		roughness: this.isWater ? 0.2 : 0.6, 
       
            //envMap: view.getEnvMap(),
            //normalMap:this.wn,
            normalScale:this.isWater ?  [0.25,0.25]:[2,2],
            transparent:this.isWater ? true : false,
            opacity: this.isWater ? (o.opacity || 0.8) : 1,
            envMap: o.envmap || null, 

    		//shadowSide : false

    	});

    	//view.getMat()[this.name+'border'] = this.borderMaterial;

        var front = new PlaneGeometry( this.size[0], 2, this.sample[0] - 1, 1 );
        var back = new PlaneGeometry( this.size[0], 2, this.sample[0] - 1, 1 );
        var left = new PlaneGeometry( this.size[2], 2, this.sample[1] - 1, 1 );
        var right = new PlaneGeometry( this.size[2], 2, this.sample[1] - 1, 1 );

        front.translate( 0,1, this.size[2]*0.5);
        back.rotateY( -math$2.Pi );
        back.translate( 0,1, -this.size[2]*0.5);
        left.rotateY( -math$2.PI90 );
        left.translate( -this.size[0]*0.5,1, 0);
        right.rotateY( math$2.PI90 );
        right.translate( this.size[0]*0.5,1, 0);

        this.borderGeometry = mergeVertices( mergeGeometries( [ front, back, left, right ] ) );
        this.borderVertices = this.borderGeometry.attributes.position.array;
        this.lng2 = this.borderVertices.length / 3;
        this.list = new Array( this.lng2 );
        this.borderColors = new Float32Array( this.lng * 3 );
        this.borderGeometry.setAttribute( 'color', new BufferAttribute( this.borderColors, 3 ) );
        this.borderMesh = new Mesh( this.borderGeometry, this.borderMaterial );

        var j = this.lng2, n, i;
        while(j--){
            n = j*3;
            i = this.borderVertices[n+1] > 0 ? this.findPoint( this.borderVertices[n], this.borderVertices[n+2] ) : -1;
            this.list[j] = i;

        }

        this.add( this.borderMesh );

        this.borderMesh.castShadow = true;
        this.borderMesh.receiveShadow = true;

        this.isBorder = true;

    }

    dispose () {

        if(this.isBottom){
            this.remove( this.bottomMesh );
            this.bottomMesh.geometry.dispose();
        }

        if(this.isBorder){
            this.remove( this.borderMesh );
            this.borderMesh.geometry.dispose();
            this.borderMesh.material.dispose();
        }

        this.geometry.dispose();
        this.material.dispose();
        for(let t in this.txt) this.txt[t].dispose();
        
    }

    easing ( key, azimuthal, wait ) {

        //var key = user.key;
        if( key[0]===0 && key[1]===0 ) return;

        //if( !key[0] || !key[1] ) return;

        var r = azimuthal || 0;//view.getAzimuthal();

        if( key[7] ) this.maxspeed = 1.5;
        else this.maxspeed = 0.25;

        //acceleration
        this.ease.y += key[1] * this.acc; // up down
        this.ease.x += key[0] * this.acc; // left right
        //speed limite
        this.ease.x = this.ease.x > this.maxspeed ? this.maxspeed : this.ease.x;
        this.ease.x = this.ease.x < -this.maxspeed ? -this.maxspeed : this.ease.x;
        this.ease.y = this.ease.y > this.maxspeed ? this.maxspeed : this.ease.y;
        this.ease.y = this.ease.y < -this.maxspeed ? -this.maxspeed : this.ease.y;

        //break
        if (!key[1]) {
            if (this.ease.y > this.dec) this.ease.y -= this.dec;
            else if (this.ease.y < -this.dec) this.ease.y += this.dec;
            else this.ease.y = 0;
        }
        if (!key[0]) {
            if (this.ease.x > this.dec) this.ease.x -= this.dec;
            else if (this.ease.x < -this.dec) this.ease.x += this.dec;
            else this.ease.x = 0;
        }

        if ( !this.ease.x && !this.ease.y ) return;

        this.local.z += Math.sin(r) * this.ease.x + Math.cos(r) * this.ease.y;
        this.local.x += Math.cos(r) * this.ease.x - Math.sin(r) * this.ease.y;

        this.update( wait );

    }

    

    getTri (){

        return this.geometry


    }

    getHeight ( x, z ) {



        x *= this.rx;
        z *= this.rz; 
        x += this.sample[0]*0.5;
        z += this.sample[1]*0.5;

        //this.pv.set( x, 0, z ).applyAxisAngle( {x:0, y:1, z:0}, -math.PI90 )

        /*if( this.isTurn ){
            x = Math.floor(-z);
            z = Math.floor(x);
        }else {*/
            x = Math.floor(x);
            z = Math.floor(z);
        //}

        
        
        var h = this.isTurn ? this.height[ this.findId2( x, z ) ] : this.height[ this.findId( x, z ) ];
        return ( h * this.size[ 1 ] ) + this.position.y;

    }

    findIdZ( x, z ){

        return x+(z*this.sampleZ[1]) //|| 1;

    }

    findId( x, z ){

        return x+(z*this.sample[1]) //|| 1;

    }

    findId2( x, z ){

        return z+(-x*this.sample[0]) || 1;

    }

    /*findId3( x, z ){

        return z+(x*this.sample[0]) //|| 1;

    }*/

    findPoint( x, z ){

        var i = this.lng, n;
        while( i-- ){
            n = i * 3;
            if( this.vertices[ n ] === x && this.vertices[ n + 2 ] === z ) return i;
        }

        return -1;

    }

    getReverseID () {

        this.invId = [];

        let i = this.lngZ, x, z;
        const sz = this.sampleZ[1] - 1;
        this.sampleZ[0] - 1;

        while(i--){

            x = i % this.sampleZ[0];
            z = Math.floor( i * this.ratioZ );
            if( this.isReverse ) z = sz - z;
            //xr = sx - x;
            //this.invId[i] = this.findId( x, sz - z )//
            this.invId[i] = this.isTurned ?  (this.lngZ-1)-this.findIdZ( z, x ) : this.findIdZ( x, z );

            //console.log(i, this.findId( x, sz - z ), (this.lng-1)-this.findId( z, x ))
        }

    }

    set( o ) {

        if( o.ease ) this.easing( o.key, o.azimut );
        if( o.decal ) this.decal( o.decal, true );

    }

    decal( v, wait ){

        this.local.x += v[0];
        this.local.y += v[1];
        this.local.z += v[2];
        this.update( wait );

    }

    updateUv () {

        if( this.isWater ){ 
            this.material.normalMap.offset.x+=0.002;
            this.material.normalMap.offset.y+=0.001;
        } else {
            let v = { x: this.local.x * this.ruvx, y: this.local.z * this.ruvy };
            if(this.material.map) this.material.map.offset.copy(v);
            if(this.material.normalMap) this.material.normalMap.offset.copy(v);
            
        }

    }

    distance ( a, b ) {

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt( dx * dx + dy * dy );

    }

    clamp ( v, min = 0, max = 1 ) {
        v = v < min ? min : v;
        v = v > max ? max : v;
        return v;
    }

    update ( wait ) {

        let v = this.pp;
        let cc = [1,1,1];
        let i = this.lng, n, x, z,  c, id, result, idz;
        let oldz, oldh, ccY, ccc;

        while( i-- ){


            n = i * 3;
            x = i % this.sample[0];
            z = Math.floor( i * this.ratio );

            v.set( x + ( this.local.x*this.rx ), this.local.y, z + ( this.local.z*this.rz ) );

            c = math$2.noise( v, this.data );

            if( this.isIsland ){

                let d = 1-(this.distance({x:x, y:z},{x:(this.sample[0]-1)*0.5, y:(this.sample[1]-1)*0.5} )/((this.sample[0]-1)*0.5) );
                d *= 4;
                d = this.clamp(d);
                //console.log(d)
                c *= d;

            }



            //c = Math.quinticSCurve(c);
            //c = Math.cubicSCurve(c)
            //c = Math.linear(c,0.2, 1);
            //c = Math.clamp(c,0.2,1)

            c = Math.pow( c, this.data.expo );
            c = this.clamp(c);

            
            
            
            if( this.ttype === 'road' ) {

                if(oldz === z){
                    if(x===1 || x===2 || x===29 || x===30) c = oldh + 0.1;
                    else c = oldh;
                } else { 
                    oldz = z;
                    oldh = c;
                }

                //console.log(x)
            }

            this.height[ i ] = c;

            ccY = (c * this.size[ 1 ]) + this.deep;
            this.vertices[ n + 1 ] = ccY;

            //id = this.changeId ? this.invId[i] : i;
            result = this.isAbsolute ? c : c * this.size[1];

            if( this.zid[ i ] !== undefined ){
                idz = this.zid[ i ];
                id = this.changeId ? this.invId[idz] : idz;

                 // for physics
                this.heightData[ id ] = result;

                // for debug
                if(this.verticesZ) this.verticesZ[ ( idz * 3 ) + 1 ] = ccY;

            }

            // for physics
            //this.heightData[ id ] = result;

            

            

            if( this.isWater ){

                cc = [ c * this.colorBase.r, c * this.colorBase.g, c * this.colorBase.b ];

            } else {

                cc = [ c, 0, 0];

            }

            //ccc = math.clamp(cc[0]+0.25, 0.25, 1)
            ccc = cc[0];

            //if(ccc>mm) mm = ccc
            //if(ccc<mi) mi = ccc

            

            this.colors[ n ] = ccc;
            this.colors[ n + 1 ] = ccc;
            this.colors[ n + 2 ] = ccc;
            //oldx = x;
            

        }

        //console.log(mm, mi)


        if( this.isBorder ){

            let j = this.lng2, h;
            while(j--){
                n = j*3;
                if(this.list[j]!==-1){
                    h = this.height[ this.list[j] ];
                    this.borderVertices[n+1] = (h * this.size[1]) + this.deep;
                    ccc = math$2.clamp(h+0.25, 0.25, 1);
                    this.borderColors[n] = ccc; //* this.colorBase.r;//h * this.colorBase.r//ee;
                    this.borderColors[n+1] = ccc; //* this.colorBase.g;// h * this.colorBase.g//ee*0.5;
                    this.borderColors[n+2] = ccc; //* this.colorBase.b;// h * this.colorBase.b//ee*0.3;

                } else {
                    this.borderColors[n] = this.colorBase.r;//0.5;
                    this.borderColors[n+1] = this.colorBase.g;//0.25;
                    this.borderColors[n+2] = this.colorBase.b;//0.15;
                }
            }

        }

        if( wait ) this.needUpdate = true;
        else this.updateGeometry();

        

        if( this.ready ) this.physicsUpdate( this.name, this.heightData );

        this.ready = true;

        //if( phy ) root.view.update( { name:'terra', heightData:this.heightData, sample:this.sample } );

    }

    step (n) {

        if( !this.needUpdate ) return
        this.updateGeometry();
        this.needUpdate = false;
        
    }

    updateGeometry () {

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.computeVertexNormals();

        this.updateUv();

        if(this.geometryZ) this.geometryZ.attributes.position.needsUpdate = true;

        if( this.isBorder ){
        	this.borderGeometry.attributes.position.needsUpdate = true;
            this.borderGeometry.attributes.color.needsUpdate = true;
        }

    }

}

// SHADERS

// about no tiles
// https://iquilezles.org/articles/texturerepetition/

const TerrainShader = {

    fragmentAdd : /* glsl */`
        uniform vec4 clevels;
        uniform float randomUv;

        uniform sampler2D noise;

        uniform sampler2D normalMap1;
        uniform sampler2D normalMap2;

        uniform sampler2D roughnessMap1;
        uniform sampler2D roughnessMap2;

        uniform float aoMapIntensity;
        uniform sampler2D map1;
        uniform sampler2D map2;

        vec4 textureMAP( sampler2D mapper, in vec2 uv ){
            if( randomUv == 1.0 ) return textureNoTile( mapper, uv );
            else return texture2D( mapper, uv );
        }

        vec4 MappingMix( float slope, vec4 level, vec4 rocks, vec4 grasss, vec4 sands ){
            vec4 cc = rocks;
            if (slope < level.x) cc = grasss;
            if (slope < level.z) cc = sands;
            if (slope == 0.0 ) cc = sands;
            //if (( slope < level.x ) && (slope >= level.y)) cc = mix( grasss , rocks, (slope - level.y) * (1. / (level.x - level.y)));
            //if (( slope < level.y ) && (slope >= level.z)) cc = mix( sands , grasss, (slope - level.z) * (1. / (level.y - level.z)));

            float d = level.y;
            float rx = 1.0/level.y;

            if (( slope < level.x + d ) && (slope > level.x)) cc = mix( grasss , rocks, ( slope - (level.x) ) * rx );

            d = level.w;
            rx = 1.0/level.w;
            if (( slope < level.z + d ) && (slope > level.z )) cc = mix( sands , grasss, ( slope - (level.z) ) * rx );

            //cc = mix( grasss, cc, smoothstep(0.0,1.0, slope)*20.0 );
            return cc;
        }
    `,

    // map_fragment.glsl

    map : /* glsl */`
        #ifdef USE_MAP

            vec4 sand = textureMAP( map, vMapUv );
            vec4 grass = textureMAP( map1, vMapUv );
            vec4 rock = textureMAP( map2, vMapUv ); 

            vec4 sampledDiffuseColor = MappingMix(vColor.r, clevels, rock, grass, sand);

            diffuseColor *= sampledDiffuseColor;

        #endif
    `,

    // normal_fragment_maps

    normal : /* glsl */`

        #ifdef USE_NORMALMAP_OBJECTSPACE

            normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

            #ifdef FLIP_SIDED

                normal = - normal;

            #endif

            #ifdef DOUBLE_SIDED

                normal = normal * faceDirection;

            #endif

            normal = normalize( normalMatrix * normal );

        #elif defined( USE_NORMALMAP_TANGENTSPACE )

            vec4 sandN = textureMAP( normalMap, vNormalMapUv );
            vec4 grassN = textureMAP( normalMap1, vNormalMapUv );
            vec4 rockN = textureMAP( normalMap2, vNormalMapUv );
            vec3 mapN = MappingMix(vColor.r, clevels, rockN, grassN, sandN).xyz * 2.0 - 1.0;

            ///vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;

            mapN.xy *= normalScale;
            normal = normalize( tbn * mapN );

        #elif defined( USE_BUMPMAP )

            normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

        #endif
    `,

    alphamap : /* glsl */`
        #ifdef USE_ALPHAMAP
            diffuseColor.a = opacity +( texture2D( alphaMap, vAlphaMapUv ).g * opacity) * (1.0-opacity);
        #endif
    `,
    
};


const randomUV = /* glsl */`

uniform sampler2D noiseMap;
uniform float useNoiseMap;

float directNoise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
        mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
        mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
}

float sum( vec4 v ) { return v.x+v.y+v.z; }

vec4 textureNoTile( sampler2D mapper, in vec2 uv ){

    // sample variation pattern
    float k = 0.0;
    if( useNoiseMap == 1.0 ) k = texture2D( noiseMap, 0.005*uv ).x;
    else k = directNoise( uv );
    
    // compute index    
    float index = k*8.0;
    float f = fract( index );

    float ia = floor( index );
    float ib = ia + 1.0;
    // or
    //float ia = floor(index+0.5); // suslik's method (see comments)
    //float ib = floor(index);
    //f = min(f, 1.0-f)*2.0;

    // offsets for the different virtual patterns    
    vec2 offa = sin(vec2(3.0,7.0)*ia); // can replace with any other hash    
    vec2 offb = sin(vec2(3.0,7.0)*ib); // can replace with any other hash    

    // compute derivatives for mip-mapping    
    vec2 dx = dFdx(uv);
    vec2 dy = dFdy(uv);
    
    // sample the two closest virtual patterns    
    vec4 cola = textureGrad( mapper, uv + offa, dx, dy );
    vec4 colb = textureGrad( mapper, uv + offb, dx, dy );

    // interpolate between the two virtual patterns    
    return mix( cola, colb, smoothstep(0.2,0.8,f-0.1*sum(cola-colb)) );

}
`;

// THREE TERRAIN
let Mat = null;

class Terrain extends Item {

	constructor( motor ) {

		super();

		this.motor = motor;
		this.engine = this.motor.engine;
		this.Utils = this.motor.utils;

		Mat = this.motor.mat;

		this.type = 'terrain';
		this.num = Num[this.type];

	}

	step (AR, N) {

		let i = this.list.length, s;

		while( i-- ){

			s = this.list[i];
			//n = N + ( i * this.num );
			s.step();// AR[n] );

		}

	}

	add ( o = {} ) {

		this.setName( o );

		if( this.engine === 'JOLT' ){
			o.isAbsolute = true;
			o.isTurned = false;
		}

		if( this.engine === 'PHYSX' ){
			o.isAbsolute = true;
			o.isTurned = true;
		}

		if( this.engine === 'HAVOK'){
			o.isAbsolute = true;
			o.isTurned = true;
			//o.isReverse = false
		}

		if( this.engine !== 'OIMO'){
			o.zone = o.zone || 0.25;
			//o.debuger = true
		}

		const t = new Landscape( o );

		Mat.extendShader( t.material, t.material.onBeforeCompile );

		t.physicsUpdate = ( name, h ) =>{

			this.motor.flow.tmp.push( { name:name, heightData:h } );
			//root.post({m:'change', o:{ name:'terra', heightData:h }})
		};

		// add to world
		this.addToWorld( t, o.id );

        // add to physics
        this.motor.post({ m:'add', o:toPhysics(t, this.engine) });

		return t

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return

		b.set(o);

	}
	
}

const toPhysics = function( t, engine ) {

	const o = {
		name:t.name,
		type:t.type,
		pos:t.position.toArray(),
		quat:engine === 'PHYSX' ? [0,0,0,1]:t.quaternion.toArray(), // physx terrain can't turn !!
	};

	if( engine === 'PHYSX' || engine === 'AMMO' || engine === 'HAVOK' || engine === 'JOLT'){
		o.type = 'terrain';
		o.size = t.sizeZ;
		o.sample = t.sampleZ;
		o.zone = t.zone;
		o.heightData = t.heightData;
	} else {
		o.type = 'mesh';
		o.v = MathTool.getVertex( t.geometry, engine === 'OIMO' );
		o.index = engine === 'OIMO' ? null : MathTool.getIndex( t.geometry );
	}

	return o

};

class Solver extends Item {

	constructor ( motor ) {

		super();

		this.motor = motor;
		this.Utils = this.motor.utils;
		this.type = 'solver';

	}

	step (AR, N) {

		let i = this.list.length, n;

		while( i-- ){

			n = N + ( i * Num[this.type] );
			this.list[i].update( AR, n );

		}

	}

	///

	add ( o = {} ) {

		this.setName( o );

        let solver = new Articulation( o, this.motor );

        // add to world
		this.addToWorld( solver, o.id );

        // add to worker
        this.motor.post({ m:'add', o:o });

        return solver;


	}

	set ( o = {} ) {

	}

}

// ARTICULATION SOLVER

class Articulation {//extends Basic3D 

	constructor( o, motor ) {

		this.motor = motor;

		//super();

		this.name = o.name;
		this.type = 'solver';
		this.needData = o.needData || false;
		this.bones = [];
		this.joints = [];
		this.jid = 0;
		this.speed = 1;

	}

	addBone( name ){

		this.bones.push( name );

	}

	dispose(){

		this.motor.remove( this.bones, true );
		
	}

	update ( AR, n ){

		if( !this.needData ) return

		let k = this.joints.length, j, m;

		while(k--){

			m = n + (k*7);

			j = this.joints[k];

			j.data.target.x = AR[ m + 0];
			j.data.target.y = AR[ m + 1];
			j.data.target.z = AR[ m + 2];

			j.data.target.rx = AR[ m + 3];//Math.round( AR[ m + 3] )
			j.data.target.ry = AR[ m + 4];//Math.round(  )
			j.data.target.rz = AR[ m + 5];//Math.round( AR[ m + 5] )

			/*j.data.target.twiwt = Math.round( AR[ m + 3] )
			j.data.target.swing1 = Math.round( AR[ m + 4] )
			j.data.target.swing2 = Math.round( AR[ m + 5] )*/

			j.data.target.count = AR[ m + 6 ];

		}

	}

	start (){

		this.motor.post({ m:'startArticulation', o:{ name:this.name } });

	}

	stop (){

		this.motor.post({ m:'stopArticulation', o:{ name:this.name } });

	}

	commonInit (){

		this.motor.post({ m:'commonInitArticulation', o:{ name:this.name } });

	}

	addJoint ( o ) {

		this.jid = this.joints.length;

		o.name = o.name || ( this.name + '_Joint_' + this.jid );
		o.solver = this.name;

		if( o.rot1 !== undefined ){ o.quat1 = MathTool.quatFromEuler( o.rot1 ); delete ( o.rot1 ); }
		if( o.rot2 !== undefined ){ o.quat2 = MathTool.quatFromEuler( o.rot2 ); delete ( o.rot2 ); }
		
		if(o.type !== 'fixe') {
			this.joints.push( new SolverJoint( o, this ) );
		}

		this.motor.post({ m:'addSolverJoint', o:o });

	}

	/*addBone ( mesh ) {

		console.log('bone is add')

		this.add( mesh );

	}*/

	driveJoints ( dt ) {

		let isInDrive = false;

		let k = this.joints.length, j, d, nup = [];

		while(k--){ 

			j = this.joints[k];
			j.update( dt );
			d = j.isDrive;
			if( j.nup ) nup.push( j.nup );
			isInDrive = d ? true : isInDrive;

		}

		// update or die
		if( isInDrive ) this.motor.change( nup );
		else {
			if(this.resolve){
				this.resolve();
				delete this.resolve;
			}
		}

	}

    setAngles ( angles, time ){

    	if(!angles) return

    	let j = this.joints.length;

    	while(j--){ 
    		this.joints[j].pose( angles[j] !== undefined ?  angles[j] : 0, time !== undefined ? time : this.speed );
    	}

    	return new Promise((resolve) => this.resolve = resolve );

    }


}

// ARTICULATION JOINT

class SolverJoint {

	constructor( o, solver ) {

		this.name = o.name;
		this.solver = solver;
		this.type = 'solverJoint';
		this.isDrive = false;
		//this.inverse = o.inverse || false

		this.current = 0;
		this.tmp = 0;
		this.target = 0;
		this.start = 0;
		this.time = 0;
		this.nup = null;

		this.data = {

			target:{ x:0, y:0, z:0, rx:0, ry:0, rz:0, count:0 },

			//target:{ x:0, y:0, z:0, twist:0, swing1:0, swing2:0, count:0 },

		};

		if( o.limits ){
			this.driveType = o.limits[0][0];
			this.min = o.limits[0][1];
			this.max = o.limits[0][2];
		}

		if( o.position ) o.target = o.position;

		if( o.target ){
			let i = o.target.length, t;

			while(i--){
				t = o.target[i];
				this.data.target[ t[0] ] = t[1];
				//if(t[0]===this.driveType)  this.current = t[1]

			}
		}

		//stiffness, damping, forceLimit, acceleration drive flag
		//o.drives = [[this.driveType, 100000, 0, Infinity, true ]];
		//solver.addJoint(o);
		
	}

	start (){

	}

	pose( target, time ){



		// linear target need to be clamp ?!
		this.target = MathTool.clamp( target, this.min, this.max );
		//this.current = this.data.target[ this.driveType ];
		this.current = MathTool.clamp( this.data.target[ this.driveType ], this.min, this.max );

		//console.log( this.target, this.current )

		if( this.target === this.current ) return;


		this.start = this.current;
		this.tmp = 0;
		this.time = time;

		this.isDrive = true;

		/*if( this.driveType !== 'z' ) this.isDrive = true;
		else{ 
			/*if(target===0.3 || target===-0.3) this.start = 0;
			else{

				if(this.name = 'A7') this.start = -0.3;
				else this.start = 0.3;
			}*/
		//	console.log( this.driveType, this.current )
		//}
		
		//return new Promise((resolve) => this.resolve = resolve);

	}
	
	update( dt ){

		if( this.isDrive ){

			// TODO find methode to increase speed  

			//console.log(dt)
			//let totalTime = 1/this.time

			//let dt = this.solver.motor.delta*100

		    this.tmp += dt*this.time;
			let t = this.tmp;
			t = (t > 1) ? 1 : t;

			//this.tmp = 1;//dt;
			//let t = this.tmp // this.time;
			//t = (t > 1) ? 1 : t;

			//let move = MathTool.lerp( this.start, this.target, t );//this.current + (this.target - this.current) * t;
			let move = this.target;//MathTool.lerp( this.start, this.target, t );

			//let move = MathTool.damp(this.start, this.target, 0.5, dt )

			this.nup = { name:this.name, drivesTarget: [[ this.driveType, move ]] };

		    if( t === 1 ) this.isDrive = false;

		} else {
			this.nup = null;
		}

	}

}

class Collision {

	constructor ( motor ) {

		this.map = new Map();
		this.motor = motor;

		this.enginReady = ['PHYSX', 'HAVOK', 'OIMO'];

		this.rc = this.refresh.bind(this);

	}

	reset () {

		this.map = new Map();

	}

	step () {

		this.map.forEach( this.rc );

	}

	refresh ( b, key ) {

		let cc = this.motor.reflow.contact[key];
		if( cc !== undefined ){
			
			for(let i = 0, lng = cc.length; i<lng; i++){

				if( b.userData.collisionCallback ) b.userData.collisionCallback(cc[i]);
				else b.dispatchEvent( { type: 'collision', data:cc[i] } );

			}
		}
		
	}

	isReady() {
		return this.enginReady.indexOf( this.motor.engine ) !== -1
	}

	

	remove ( name ) {

		if(!this.isReady()) return
		if( !this.map.has( name ) ) return;

		this.map.delete( name );
		this.motor.post( { m:'removeCollision', o:{name:name} } );

	}

	add ( o ) {

		if(!this.isReady()) return

		let name = o.name;
		let b = this.motor.byName( name );
		if( b === null ) return;
		//if( !b.trigger ) b.getVelocity = true;

		if( o.vs && o.vs.constructor !== Array) o.vs = [o.vs];
		if( o.ignore && o.ignore.constructor !== Array) o.ignore = [o.ignore];

		if( o.callback ){ 
			b.userData.collisionCallback = o.callback;
			delete ( o.callback );
		}

		this.map.set( name, b );
	    this.motor.post( { m:'addCollision', o:o } );

	}

}

const average = arr => arr?.reduce((a, b) => a + b, 0) / arr.length;

class Stats {

	constructor() {

		this.chartLen = 60;
		this.frame = 0;
		this.frameG = 0;
		this.gpuAccums = [];
		this.activeAccums = [];
		this.queryCreated = false;
		this.queryHasResult = false;

		this.withGpu = true;


		this.reset();
		
	}

	reset() {
		this.msChart = new Array(this.chartLen).fill(0);
		this.fpsChart = new Array(this.chartLen).fill(0);
		this.gpuChart = new Array(this.chartLen).fill(0);
	}

	up( data ){

		this.msChart[this.frame] = data.ms;
		this.fpsChart[this.frame] = data.fps;
		//this.startGpu()
		//this.gpuChart[this.frame] = this.gpuAccums[0]

		this.frame++;
		if(this.frame === this.chartLen) this.frame = 0;

	}

	

    setRenderer(renderer){

    	if(!this.withGpu) return 

    	this.gl = renderer.getContext();
    	this.extension = this.gl.getExtension("EXT_disjoint_timer_query_webgl2");


    	if (this.extension !== null) {
    		this.startGpu();
    		/*this.query = this.gl.createQuery();
			this.gl.beginQuery( this.extension.TIME_ELAPSED_EXT, this.query );
			console.log('ok')*/
    	}
    	
    }

    upGpu(){

    	let v = this.startGpu(this.frameG);

    	if(v){



	    	this.gpuChart[this.frameG] = v;//this.gpuAccums[0]

			this.frameG++;
			if(this.frameG === this.chartLen) this.frameG = 0;

		
        }

        this.endGpu();

    	/*const gl = this.gl
		const ext = this.extension


		let available = false
		let disjoint, ns

		if (this.query){
			//let t = gl.getQuery(ext.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)
			//console.log(t)
			/*let query = this.query*/
		/*	available = gl.getQueryParameter(gl.CURRENT_QUERY, gl.QUERY_RESULT_AVAILABLE)
		    disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT)
		}

		//

		//const currentQuery = gl.getQuery(gl.ANY_SAMPLES_PASSED, gl.CURRENT_QUERY);
		

    	/*
		let disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT)

		if (available && !disjoint) {
		 	ns = this.gl.getQueryParameter( this.query, this.gl.QUERY_RESULT );

			//this.startGpu()
			
		}

	    if (available || disjoint) {
		    // Clean up the query object.
		    gl.deleteQuery(this.query)
		    // Don't re-enter this polling loop.
		    query = null
        }

        if (available && ns > 0) {
		    // update the display if it is valid
		    if (!disjoint) {
		        //this.activeAccums.forEach((_active, i) => { this.gpuAccums[i] = ms })
		        //this.gpuAccums[0] = ms

		        
		    }
	    }*/

	}

    startGpu() {

		const gl = this.gl;
		const ext = this.extension;

		if (!gl || !ext) return
		
		let available = false;
		let disjoint, ns;
		let v = null;


		if (this.query) {
		    this.queryHasResult = false;
		    let query = this.query;

		    //
			// console.log(gl.getParameter(ext.TIMESTAMP_EXT))
			available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
			disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);

		    if (available && !disjoint) {
		       ns = gl.getQueryParameter(this.query, gl.QUERY_RESULT);
		       const ms = ns * 1e-6;
		       
		       this.gpuAccums[0] = ms;

		        if (available || disjoint) {
				    // Clean up the query object.
				    gl.deleteQuery(this.query);
				    // Don't re-enter this polling loop.
				    query = null;
		        }

		        if (available && ms > 0) {
				    // update the display if it is valid
				    if (!disjoint) {

				    	v = ms; 
				        /*this.activeAccums.forEach((_active, i) => { 
				        	this.gpuAccums[i] = ms 
				        	//console.log(_active, i)
				        })*/
				        //this.gpuAccums[0] = ms*/
				    }
			    }
			}
		}

		if (available || !this.query) {
			this.queryCreated = true;
			this.query = gl.createQuery();
			gl.beginQuery(ext.TIME_ELAPSED_EXT, this.query);
	    }

	    return v
		
	}

	endGpu() {
		// finish the query measurement
		const ext = this.extension;
		const gl = this.gl;

		if ( this.queryCreated && gl.getQuery(ext.TIME_ELAPSED_EXT, gl.CURRENT_QUERY) ) {
		    gl.endQuery(ext.TIME_ELAPSED_EXT);
		}
	}

    get ms (){ return average(this.msChart) }
    get fps (){ return average(this.fpsChart) }
    get gpu (){ return average(this.gpuChart) }
}

class Textfield extends Mesh {

	constructor( o={} ) {

		super( new PlaneGeometry(), new MeshBasicMaterial({polygonOffset: true, polygonOffsetFactor: -4}));

		this.name = o.nam || 'text';
		this.canvas = null;

		this.w = o.w || 0;
		this.h = o.h || 0;

		this.weight = o.weight ?? 700;

		this.font = o.font ?? "'Mulish', sans-serif";
		this.fontSize = o.fontSize ?? 32;
		this.backgroundColor = o.backgroundColor ?? "#00000000";
		this.fontColor = o.color ?? "#FFFFFF";
		this.material.alphaTest = 0.5;
		this.set( o.text );
		
		if( o.pos ) this.position.fromArray(o.pos);
		if( o.rot ) this.quaternion.fromArray( MathTool.quatFromEuler( o.rot ) );
		
	}

	set( str ){

		if(!this.canvas) this.canvas = document.createElement("canvas");
		let ctx = this.canvas.getContext("2d"), w, h, r;
		
		ctx.font = this.weight + " " + this.fontSize + "px " + this.font;
		

		let metrics = ctx.measureText( str );

		//resize to nearest power of 2
		w = 2 ** Math.ceil(Math.log2(metrics.width));
		h = 2 ** Math.ceil(Math.log2(ctx.measureText('M').width));



		
		this.canvas.width = w;
		this.canvas.height = h;

		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(0, 0, w, h);
		//var backgroundAlpha = ctx.getImageData(0, 0, 1, 1).data[3];

        ctx.fillStyle = this.fontColor;
		//ctx.font = this.fontSize + "px " + this.font;
		ctx.font = this.weight + " " + this.fontSize + "px " + this.font;
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		
		ctx.fillText( str, w*0.5, h*0.5 );

		this.material.map = new CanvasTexture(this.canvas);

		//if(this.w===0) this.w = w*0.02

		if( this.h !== 0 ){
			r = this.h / h;
			this.scale.set(w*r,this.h,0);
		}

		else if( this.w !== 0 ){
			r = this.w / h;
			this.scale.set(this.w,h*r,0);
		}

		else {
			this.scale.set(w*0.025,h*0.025,0);
		}


		//this.scale.set(this.w,h*r,0)

		/*let img = new Image(w, h);
        img.src = canvas.toDataURL( 'image/png' );

        let self = this

        img.onload = ()=>{

			//
			self.material.map = new Texture(img);
			self.material.map.needsUpdate = true
			//self.material.needsUpdate = true

			self.scale.set(w*0.05,h*0.05,0)
		}*/

	}

	dispose(){

		this.parent.remove(this);
		this.material.map.dispose();
		this.material.dispose();
		this.geometry.dispose();

	}

}

let Nb$1 = 0;

class Button {

	constructor ( o={}, motor ) {

		this.motor = motor;

		this.down = false;


		this.time = o.time || 250;

		this.p = o.pos || [0,0,0];

		this.type = o.type || 'box';
		this.name = o.name || 'button' + Nb$1++;
		this.pos = o.pos || [0,0,0];
		this.size = o.size || [1,1,1];
		this.radius = o.radius || 0;
		this.axe = o.axe !== undefined ? o.axe : 1;

		this.fontSize = o.fontSize || 0.8; 
		this.fontScale = o.fontScale || 1.0;

		this.extraForce = true; 


		this.decal = this.type === 'sphere'? this.size[1]*0.5 : (this.size[1]*0.5) - this.radius;

		if( this.type !== 'sphere' ) this.pos[ this.axe ] += this.decal;


		this.origin = this.pos[this.axe];
	    let height = this.size[this.axe]-(this.radius*2);

		//this.range = [ this.origin - this.decal - (this.radius*2), this.origin ]
		this.range = [ this.origin - height, this.origin ];

		this.value = this.origin;
		this.target = this.origin;

		this.speed = (this.size[this.axe]/3) / (this.size[this.axe]);

	

		this.callback = function(){ 
			console.log("action down"); 
		};

		if( o.callback ){ 
			this.callback = o.callback; 
			delete o.callback;
		}

		o.button = true;
		o.pos = this.pos; 
		if(!o.material) o.material = 'button';
		o.kinematic = true;
		o.mask = 1;

		

		this.timeout = null;

		// add model & physics
		this.b = this.motor.add( o );

		this.b.userData['action'] = this.action.bind(this);
		this.b.userData['out'] = this.out.bind(this);

		// is bad ?
		this.b.userData['direct'] = this.callback.bind(this);

		// extra text on top 
		if( o.text ) this.addText( o.text );

	}

	addText( txt, size ){

		this.fontSize = this.type==='box' ? this.size[this.axe] * 0.8 : this.size[0] * 0.8;
		this.fontSize *= this.fontScale;
		let dt = { text:txt, pos:[ 0,this.size[1]*0.5,0 ], rot:[-90,0,0], h:this.fontSize };
		if( this.axe === 2 ) dt = { text:txt, pos:[ 0,0, this.size[2]*0.5 ], rot:[0,0,0], h:this.fontSize };
		this.txt = new Textfield( dt );
		this.b.add( this.txt );

	}

	action( p ){

		if( this.down ) return

		this.down = true;
	    this.target = this.range[0];
	    if(this.extraForce) this.motor.explosion( p || this.p, this.size[0]*2, 0.01 );
		this.callback();

	}

	out(){

		if(!this.down) return

		this.down = false;
	    this.target = this.range[1];
	    if(this.extraForce) this.motor.explosion( this.p, this.size[0]*2, 0.01 );

	}

	update(){

		if( this.value !== this.target ){

			//let side = this.target > this.value ? 1 : -1

			this.value = MathTool.lerp( this.value, this.target, this.speed );

			//this.value += 0.1 * side

			let t = MathTool.nearEquals( this.value, this.target, 0.0001);

			if(!t){
			    this.pos[this.axe] = this.value;
			    this.motor.change( {name:this.b.name, pos:this.pos} );
			} else {
				this.value = this.target;
			}


		}

	}

	dispose(){

		if(this.txt) this.txt.dispose();
	}

}

//----------------
//  MOUSE TOOL 
//----------------

class MouseTool {

	constructor ( controler, mode = 'drag', motor ) {

		this.motor = motor;

		this.needRay = false;

		this.moveDirect = false;
		this.moveDeep = false;

		this.mode = mode;
		this.option = {};

		this.overObj = null;

		this.controler = controler;
		this.dom = this.controler.domElement;

		//this.dom.style.cursor =  "url('./assets/icons/logo.png'), move";

		this.selected = null;
		this.buttonRef = null;
		this.release = false;

		this.numBullet = 0;
		this.maxBullet = 10;

		this.sticky = false;

		this.pz = 0;

		this.isActive = false;
		this.raycastTest = false;
		this.firstSelect = false;
		this.mouseDown = false;
		this.mouseDown2 = false;
		this.mouseMove = false;
		//this.controlFirst = true;

		this.decal = new Vector3();
		this.tmpPos = new Vector3();
		this.tmpD = new Vector3();

		this.mouse = new Vector2();
		this.oldMouse = new Vector2();
		this.raycast = new Raycaster();
		this.raycast.far = 1000;

		this.button = 0;

		this.pos = new Vector3();
		this.velocity = new Vector3();
		this.angle = 0;

		this.helper = null;
		this.dragPlane = null;
		this.overLock = false;

	    //if( this.mode === 'drag' ) 
	    this.activeDragMouse( true );

	}

	addDrag(){

		if( this.dragPlane ) return

		//this.overLock = true;
	    this.floorDrag = this.button === 2;
	    //this.floorDrag = true

		this.helper = new MoveHelper(this.motor);
		this.dragPlane = new Mesh( new PlaneGeometry( 1, 1 ), this.motor.mat.get('hide') );
		if(this.floorDrag)this.dragPlane.geometry.rotateX(-Math.PI*0.5);
	    this.dragPlane.castShadow = false;
	    this.dragPlane.receiveShadow = false;
	    this.dragPlane.scale.set( 1, 1, 1 ).multiplyScalar( 200 );
	    //this.dragPlane.visible = false

	    this.motor.scenePlus.add( this.helper );
	    this.motor.scenePlus.add( this.dragPlane );

	}

	clearDrag(){

		if( !this.dragPlane ) return

		//this.overLock = false;

		this.motor.scenePlus.remove( this.dragPlane );
		this.motor.scenePlus.remove( this.helper );

		this.dragPlane.geometry.dispose();
		this.helper.geometry.dispose();

		this.dragPlane = null;
		this.helper = null;

	}

    setMode ( mode, o = {} ) {

    	if( mode === this.mode ) return
    	this.mode = mode;
        this.option = o;

        if( this.mode === 'blast' && this.option.visible ) this.motor.initParticle();

    }

	activeDragMouse ( b ) {

		if( b ){
			if( !this.isActive ){
				this.dom.addEventListener( 'pointermove', this.mousemove.bind(this), false );
		        this.dom.addEventListener( 'pointerdown', this.mousedown.bind(this), false );
		        document.addEventListener( 'pointerup', this.mouseup.bind(this), false );
		        //document.addEventListener( 'contextmenu', this.contextmenu.bind(this), false )

		        this.controler.addEventListener( 'end', this.controleEnd.bind(this), false );
		        this.controler.addEventListener( 'start', this.controleStart.bind(this), false );
		        //this.controler.addEventListener( 'change', this.controleChange.bind(this), false )

		        this.isActive = true;
		        this.raycastTest = true;
		    }

		} else {
			if( this.isActive ){
				this.dom.removeEventListener( 'pointermove', this.mousemove.bind(this) );
			    this.dom.removeEventListener( 'pointerdown', this.mousedown.bind(this) );
			    document.removeEventListener( 'pointerup', this.mouseup.bind(this) );

			    this.controler.removeEventListener( 'end', this.controleEnd.bind(this) );
			    this.controler.removeEventListener( 'start', this.controleStart.bind(this), false );
		        //this.controler.removeEventListener( 'change', this.controleChange.bind(this) )

			    this.isActive = false;
			}
		}
	}

	controleEnd ( e ) {
		//this.controlFirst = true
		this.raycastTest = true;
		if( this.controler.getInfo ) this.controler.getInfo();
	}

	controleStart ( e ) {
		this.raycastTest = false;
	}

	controleChange ( e ) {

		

		

		//let state = this.controler.getState();

		//if( state !== -1 ) this.raycastTest = false;

		/*let state = this.controler.getState();
		console.log(state)
		if( state !== -1 ){
			if( this.controlFirst ) this.controlFirst = false;
			else this.raycastTest = false;
		}*/

		//this.controler.getInfo();
	}

	getMouse ( e ) {

		if(this.motor.viewSize){
			this.mouse.x =   ( e.offsetX / this.motor.viewSize.w ) * 2 - 1;
		    this.mouse.y = - ( e.offsetY / this.motor.viewSize.h ) * 2 + 1;
		} else {
			this.mouse.x =   ( e.offsetX / this.dom.clientWidth ) * 2 - 1;
			this.mouse.y = - ( e.offsetY / this.dom.clientHeight ) * 2 + 1;
		}

		//console.log(e.button)
		
		this.button = e.pointerType !== 'touch' ? e.button : 0;
		//if(this.button===2)this.moveDeep = !this.moveDeep

	}

	contextmenu ( e ) {
		//e.preventDefault();
		//this.mouseDown2 = true
		//this.controler.enabled = false;
		/*if( this.mouseDown ){

			//this.moveDeep = true
			console.log('yo ')
		}*/
	}

	mousedown ( e ) {

		if( this.sticky ){ 
			this.unSelect();
			console.log('unstick');
		}

		this.getMouse( e );
		//this.needRay = true;
		//this.overLock = true;

		switch( this.mode ){

			case 'drag': this.drag(); break;
			case 'shoot': this.shoot(); break;
			case 'blast': this.blast(); break;
			case 'build': this.build(); break;

		}

	}

	mouseup ( e ) {

		//console.log('up')

		this.release = true;
		//this.overLock = false;

		document.body.style.cursor = 'auto';

		this.mouseMove = this.oldMouse.distanceTo( this.mouse ) < 0.01 ? false : true;
		this.mouseDown = false;
		this.mouseDown2 = false;
		//this.motor.mouseDown = false



		if( this.sticky ) { this.controler.enabled = true; return; }

		this.unSelect();
		this.resetButton();

	}

	mousemove ( e ) {

		//if( this.release ) this.release = false;

		switch( this.mode ){

			case 'drag':
			this.getMouse( e );
			this.needRay = true;
		    //this.castray()
			break

		}

	}

	castray () {

		let inters, m, g, h, id, cursor = 'auto';

		if( this.selected !== null ){

			this.raycast.setFromCamera( this.mouse, this.controler.object );
			inters = this.raycast.intersectObject( this.dragPlane );
			if ( inters.length && this.mouseDown ){ 
				this.moveSelect( inters[0].point );
				//if( this.moveDirect ) root.motor.change({ name:this.selected.name, pos:inters[0].point.toArray() }, true )
				//else root.motor.change({ name:'mouse', pos:inters[0].point.toArray() }, true )
			}
			//return
		} else {

			if( !this.raycastTest ) return;

			//this.controler.enabled = false

			this.controler.enableRotate = false;
			this.controler.enablePan = false;

			this.raycast.setFromCamera( this.mouse, this.controler.object );

			inters = this.raycast.intersectObjects( this.motor.scene.children, true );

			this.tmpSelected = null;

			if ( inters.length > 0 ) {

				g = inters[ 0 ].object;
				

				//console.log(inters[ 0 ])

				if( g.isInstancedMesh ){
					// is instance mesh
					id = inters[ 0 ].instanceId;
					m = this.motor.byName( g.getIDName( id ) );
					//console.log(m)
					//m = root.motor.byName( g.name+id );
				} else {
					if( g.parent !== this.motor.scene ){
						h = g.parent;
						if( h.parent !== this.motor.scene ) m = h.parent;
						else m = h;
					} else m = g;
				}

				if( this.mouseDown2 ){
					if( m.extra ) m.extra( m.name );
					//console.log(m)
				}

				if( m && !m.isButton ){
					cursor = this.select( m, inters[ 0 ].point );
					//this.tmpSelected = m
					//this.tmpPoint = inters[ 0 ].point
				}
				else cursor = this.actionButton( m, inters[ 0 ] );
				//document.body.style.cursor = cursor

			} else {

				this.resetOver();
				this.controler.enableRotate = true;
				this.controler.enablePan = true;
				
				//this.controler.enabled = true
			}

			//console.log(this.release, cursor)
			if( this.release ){
				this.release = false;
				this.controler.enableRotate = true;
				this.controler.enablePan = true;
				cursor = 'auto';
				this.resetOver();
				
			}

			document.body.style.cursor = cursor;
		}

	}

	drag () {

		if( !this.mouseDown ){
			if( this.firstSelect ) this.firstSelect = false;
			this.oldMouse.copy( this.mouse );
		}

		//console.log(this.button)

        

		if( this.button === 2 ){

		    this.mouseDown2 = true;
		    //this.castray()
		}

	    //if( this.button === 0 ){
		    this.mouseDown = true;
		    //this.motor.mouseDown = true
		    this.needRay = true;

		    //if(this.tmpSelected!== null) this.select(this.tmpSelected, this.tmpPoint )
		    //this.castray()
		//}

		

	}

	blast () {

		let hit = null;
		this.raycast.setFromCamera( this.mouse, this.controler.object );
		let inters = this.raycast.intersectObjects( this.motor.scene.children, true );

		if ( inters.length > 0 ) {

			if( !inters[ 0 ].object.isButton ) hit = inters[ 0 ];
			else inters[ 0 ].object.parent.userData.direct();
				
		} else {
			inters = this.raycast.intersectObjects( this.motor.scenePlus.children, true );
			if ( inters.length > 0 ) hit = inters[ 0 ];
		}

	    const o = this.option;

		if(hit){ 

			this.motor.explosion( hit.point, o.radius || 3, o.power || 0.1 );

			if( o.visible ) this.motor.addParticle({
				name:'blast',
				type:"cube",
				position:hit.point.toArray(),
				numParticles: 60,
				radius:0.2,
				radiusRange:0.1,
				//accelerationRange:[0.3,0.3,0.3],
				acceleration:[5*10,5,5*10],
				lifeTime: 0.5,
		        endTime: 0.5,
		        startTime: 0,
		        gravity:[0,0.2,0],
		        startSize: 0.5,
		        endSize: 0.1,
		        //spinSpeedRange:2,
		        tween:"outQuad",
		        //velocityRange: [ 0.6, 0.6, 0.6 ]
		        //lifeTimeRange:1,
		        //startTime: 0,
		        //startSize: 0.1,

			});
		}
		

	}

	shoot () {

		const o = this.option;

		this.raycast.setFromCamera( this.mouse, this.controler.object );
		this.pos.copy( this.raycast.ray.direction ).add(  this.raycast.ray.origin );
		this.velocity.copy( this.raycast.ray.direction ).multiplyScalar( o.velocity || 60 );//.multiplyScalar( 100 )

		this.motor.add({
			name: 'bullet_' + this.numBullet,
			type:'sphere',
			mass: o.mass || 10,
			//density:20,
			size:[o.size || 0.2], 
			material:o.mat || 'chrome',
			pos:this.pos.toArray(),
			linearVelocity:this.velocity.toArray(),
			//impulse:this.velocity.toArray(),
			bullet:true,
			//iterations:[32,4],
			//minCCD:0.01,
			//speculativeCCD:true,
			//ccdThreshold:0.0000001,
            //ccdRadius:o.size*2,/**/
		});

		this.numBullet++;
		if(this.numBullet > this.maxBullet) this.numBullet = 0;

	}

    resetButton () {

		if( this.buttonRef ){
			if( this.buttonRef.userData.out ) this.buttonRef.userData.out();
			this.buttonRef = null;
		}

		this.raycastTest = true;
		this.selected = null;
		this.firstSelect = true;
		//this.controler.enabled = true
		this.controler.enableRotate = true;
		this.controler.enablePan = true;

	}

	actionButton ( obj, inters ) {

		if( this.buttonRef ){
			if( this.buttonRef.name !== obj.name ){ 
				if( this.buttonRef.userData.out ) this.buttonRef.userData.out();
				this.buttonRef = obj;
			}
		} else {
			if( this.mouseDown ) this.buttonRef = obj;
		}
		if( this.mouseDown && this.buttonRef.userData.action ){ 
			let pos = inters.point;
			this.buttonRef.userData.action( pos );
		}

		//if( this.mouseDown ) this.controler.enabled = false
		   
		//return 'grab'
	    return 'pointer'

	}

	setOver( obj ){

		//if( this.overLock ) return;
		if( !obj ) return;

		if( this.overObj ){
			if( obj.name !== this.overObj.name ) this.resetOver();
		}

		this.overObj = obj;
		if( this.overObj.over ) this.overObj.over(true);

	}

	resetOver(){

		//if( this.overLock ) return;
		if( !this.overObj ) return;
		if( this.overObj.over ) this.overObj.over( false );
		this.overObj = null;

	}

	select ( obj, point ) {

		//this.controler.enabled = false

		//if( this.selected !== null ) return 'pointer'
		//if( !this.mouseDown ) return 'auto'
		//if( this.selected === obj ) return 'grab'//'pointer'

		if( !this.mouseDown ) this.setOver( obj );

		

		if( !this.mouseDown || this.selected === obj ){
			return 'grab'
		}

		//this.overLock = true;


		this.pz = 0;

		let pos = point;
	    let quat = [0,0,0,1];

		this.selected = obj;
		//this.setOver( obj );
		/*if( this.selected.isInstance ) quat = this.selected.instance.getInfo( this.selected.id ).quat;
		else if( this.selected.isObject3D ){
			this.selected.updateMatrix()
			quat = this.selected.quaternion.toArray()
		}*/

		this.decal.copy( pos ).sub( this.selected.position );
		this.tmpPos.copy( pos ).sub( this.decal );
		this.angle = this.controler.getAzimuthalAngle();

		let q = this.selected.quaternion;
		quat = q.toArray();


		this.addDrag();

		//8root.scenePlus.add( this.helper )
	    //root.scenePlus.add( this.dragPlane )

	    this.dragPlane.rotation.set( 0, this.angle, 0 );
	    this.dragPlane.position.copy( pos );
	    //if(!this.floorDrag)this.dragPlane.position.y = 0

	    this.helper.position.copy( pos );


	    let p = pos.toArray();

	    let revert = false;

	    this.motor.change({ name: this.selected.name, neverSleep:true, wake:true });
		//Motor.add({ name:'mouse', type:'sphere', size:[0.01], pos:p, quat:quat, mask:0, density:0, noGravity:true, kinematic:true, flags:'noCollision' })
		//root.motor.add({ name:'mouse', type:'null', pos:p, quat:quat })

		//let def = [-0.03, 0.03, 60, 5]
		//let defr = [-3, 3, 60, 5]

		//let def = [-0.03, 0.03, 60, 2]
		//let defr = [-3, 3, 60, 2]

		const engine = this.motor.engine;

		if( this.moveDirect ){
			this.motor.change({ name:this.selected.name, kinematic:false, gravity:false, damping:[0.9,0.9]  });
		} else {
			let def = [-0.1, 0.1, 600, 1];
			let defr = [-0.1, 0.1, 600, 1];
			//let defr = [0, 0]
			let notUseKinematic = engine === 'OIMO' || engine ==='RAPIER' || engine ==='JOLT';//|| engine ==='HAVOK'
			let jtype = this.selected.link === 0 ? 'fixe' : 'd6';//root.engine === 'HAVOK' ? 'fixe' : 'd6';

			if( engine === 'JOLT' ) jtype = 'fixe';

			let limite = [['x',...def], ['y',...def], ['z',...def], ['rx',...defr], ['ry',...defr], ['rz',...defr]];

			if( engine === 'HAVOK' ) limite = [ ['x',...def], ['y',...def], ['z',...def] ];

			if( engine === 'OIMO' ){
				revert = true;
				jtype = this.selected.link === 0 ? 'fixe' : 'spherical';
				limite = [ ['x',...def], ['y',...def], ['z',...def] ];
				//if(this.selected.link !== 0)
				//limite = [ 4.0, 1.0 ]
			}

			if( engine === 'HAVOK' ){
				//revert = true;
				jtype = this.selected.link === 0 ? 'fixe' : 'spherical';
				limite = [ -180, 180, 0.1, 0.1 ];

				//jtype = 'fixe'
			}

			//console.log(jtype)

			this.motor.add([
				{ 
					name:'mouse', 
					type:'null', 
					pos:p, 
					quat:quat, 
					kinematic:notUseKinematic ? false : true,
					//mass:10,///10000000,
					//gravityFactor:0, 
				},
				{ 
					name:'mouseJoint', type:'joint',
					mode:jtype,
					lm:limite,
					sd:[4.0, 1.0],
					autoDrive: true,
					b1:revert ? this.selected.name : 'mouse',
					b2:revert ? 'mouse' : this.selected.name,  
					worldAnchor: p, 
					//worldQuat: quat,

					/*pos1: p, 
					quat1: quat,
					pos2: [0,0,0], 
					quat2: [0,0,0,1],*/
					//worldAxis:[1,0,0],
					visible:false,
				}
			]);

		}
		

		//this.raycastTest = false
		//this.controler.enabled = false

		//document.body.style.cursor = 'move'

		return "grabbing"//"url('./assets/icons/point.png') 8 8, move" //'move'

	}

	moveSelect ( point ) {

		if( this.selected === null ) return

		//this.setTmpOver( this.selected )

		if( point ){ 
			this.tmpPos.copy( point ).sub( this.decal ); 
		}

		if( this.moveDeep ){ // Z deep move

			let y = this.selected.position.y;
			let diff  = y-this.tmpPos.y;
			this.tmpPos.y = y;
			this.tmpD.set(0,0,diff).applyAxisAngle({x:0, y:1, z:0}, this.angle);
			this.tmpPos.add( this.tmpD );

		}

		this.helper.position.copy( this.tmpPos );

		let pos = this.tmpPos.toArray();

		if( this.moveDirect ){ 
			this.motor.change({ name:this.selected.name, pos:pos, reset:true });
		} else {
			this.motor.change({ name:'mouse', pos:point.toArray(), lockPos:true }, true );
		}
	}

	unSelect () {

		if( this.selected === null ) return

		this.resetOver();
		this.clearDrag();

		if( this.moveDirect ){
			this.motor.change({ name:this.selected.name, kinematic:false, wake:true, gravity:true, damping:[0,0.1] });
		} else {
			this.motor.remove(['mouseJoint','mouse']);
			this.motor.change({ name:this.selected.name, neverSleep:false, wake:true });
		}
		
		this.raycastTest = true;
		this.selected = null;
		this.firstSelect = true;
		
		//this.controler.enabled = true

	}

	step(){

		if( this.needRay ) this.castray();
	    this.needRay = false;

		if( this.selected === null ) return

		let key = this.motor.flow.key;

		if( key[1] !== 0 ){
			let pz = key[1] * 0.1;
			this.dragPlane.translateZ(pz);
			this.needRay = true;
		}

		//this.castray()
		if( this.moveDirect ) this.moveSelect();

		

	}


}






class MoveHelper extends Line {

	constructor( motor ) {

		super( new BufferGeometry(), motor.mat.get('line') );

		let c = 0.75;

		const positions = [0,0,0, 0,-100,0];
	    const colors = [c,c,c, 0,0,0];

	    //this.geometry = new BufferGeometry();
	    this.geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    this.geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    //this.geometry.computeBoundingSphere();

	    this.vertices = this.geometry.attributes.position;
	    this.colors = this.geometry.attributes.color;
	    this.local = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

	    //this.matrixAutoUpdate = false;
	    this.frustumCulled = false;

	}
}

const tmp_Vector = new Vector3(); 
//const SPHSystem_getNeighbors_dist = new Vector3()

// Temp vectors for calculation
new Vector3(); // Relative velocity

const SPHSystem_update_a_pressure = new Vector3();
const SPHSystem_update_a_visc = new Vector3();
const SPHSystem_update_gradW = new Vector3();
const SPHSystem_update_r_vec = new Vector3();
const SPHSystem_update_u = new Vector3();


class SoftSolver {

	constructor ( o = {}, motor ) {

		this.first = true;
		this.debug = o.debug || false;

		this.motor = motor;

		this.name = o.name  || 'ppp';

		this.pMass = o.pMass || 0.01;
		// visual size
		this.vSize = o.vSize || 0.16;//0.06;
		// physical size
		this.pSize = o.pSize || 0.02;

		this.particles = [];
		/**
	     * Density of the system (kg/m3).
	     * default 1.0
	     */
	    this.density = o.density || 0.01;
	    /**
	     * Distance below which two particles are considered to be neighbors.
	     * It should be adjusted so there are about 15-20 neighbor particles within this radius.
	     * default 1.0
	     */
	    this.smoothMulty = o.smoothMulty || 1;
	    this.smoothing = o.smoothing || 0.2;
	    this.smoothing*=this.smoothMulty;
	    /**
	     * Speed Of Sound
	     * default 1
	     */
	    this.speed = o.speed || 0.1;
	    
	    /**
	     * Viscosity of the system.
	     */
	    this.viscosity = o.viscosity || 0.03;

	    this.eps = 0.000001;

	    this.group = 1 << 8;

	    // Stuff Computed per particle
	    this.pressures = [];
	    this.densities = [];
	    this.neighbors = [];

	    this.maxDist = 0;

	    this.tv = new Vector3();
	    this.tv2 = new Vector3();

	    if( o.mesh ) this.setMesh( o.mesh, o.crossEdge );

	}

	setMesh( mesh, crossLink = false ){

		const link = [];
		const extralink = [];

		this.mesh = mesh;
		this.geometry = mesh.geometry;

		this.geometry.getIndex();
        const positions = this.geometry.getAttribute( 'position' );
        const ar = positions.array;

        const hash = MathTool.getHash(this.geometry);
        const faces = MathTool.getFaces(this.geometry);
        const connected = crossLink ? MathTool.getConnectedFaces(faces) : null;

        //console.log(hash)
        //console.log(connected)

		//let g2 = MathTool.getHash(this.geometry);

		let j, n, f, a, b, c;

		// add vertex position referency
		for(let m in hash){

			j = hash[m][0];
			//const k = indices ? indices.getX( j ) : j;
			n = j*3;
			tmp_Vector.set( ar[n], ar[n+1], ar[n+2] );
			this.mesh.localToWorld(tmp_Vector);
			this.add(tmp_Vector.toArray());

		}

		for( let i=0; i<faces.length; i++ ){

			f = faces[i];
			a = this.getKey( hash, f[0] );
			b = this.getKey( hash, f[1] );
			c = this.getKey( hash, f[2] );
			

			if(!this.sameLink(link, a, b)) link.push([a,b]);
			if(!this.sameLink(link, b, c)) link.push([b,c]);
			if(!this.sameLink(link, c, a)) link.push([c,a]);

		}

	    this.connect( link );

	    // extra link cross X

	    if(connected){
	    	for( let i=0; i<connected.length; i++ ){
	    	
		    	f = connected[i];
		    	a = this.getKey( hash, f[0] );
		    	b = this.getKey( hash, f[1] );
		    	if(!this.sameLink(link, a, b) && !this.sameLink(extralink, a, b)) extralink.push([a,b]);

		    }

		    this.connect( extralink, true );
	    }

	    

	    this.hash = hash;

	    this.mesh.position.set(0,0,0);
		this.mesh.quaternion.set(0,0,0,1);
		this.mesh.receiveShadow = true;
		this.mesh.castShadow = true;
		phy.addDirect( this.mesh );

	}

	updateMesh(){

		if(!this.geometry) return;

		let h = this.hash;
		let p = this.geometry.attributes.position.array;
		let i = this.particles.length, n, r, j;
		while(i--){

			r = this.particles[i];
			j = h[i].length;

			while(j--){
				n = h[i][j]*3;
				p[n] = r.position.x;
				p[n+1] = r.position.y;
				p[n+2] = r.position.z;
			}
		}

		this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.geometry.computeBoundingSphere();

	}

	add( pos ){


		let p = this.motor.add({ 

            instance:this.name,
            type:'particle', 
            //type:'sphere',
            //flags:'noQuery',
            size:[this.vSize],
            pSize:this.pSize,
            pos:pos, 

            inertia:[0,0,0], 
            //inertia:[0.00001,0.00001,0.00001], 
            //iterations:[10,1],
            
            mass:this.pMass,
            //density:0.0000001,
            restitution:0.0, 
            friction:0.5, 
            //maxVelocity:[2,100],
            damping:[0.2,0.1],

            //group:this.group, 
            //mask:1|2,
            material:this.debug ? 'particle':'hide',
            //maxVelocity:[1,100],
           // iterations:[40, 10],

            shadow:false,
            getVelocity:true,

            //massInfo:this.first,

        });

        this.first = false;

        p.force = new Vector3();

        this.particles.push( p );
        if (this.neighbors.length < this.particles.length) {
	        this.neighbors.push([]);
	    }

	}

	connect( link, extra ){

		let i = link.length;
		//console.log(i)
		let tmp = [], l, p1, p2, d = 0;

		while(i--){

			//if(!this.particles[l[0]] || !this.particles[l[1]]) continue

			l = link[i];
			this.name+l[0];
			this.name+l[1];

			p1 = this.particles[l[0]].position;
			p2 = this.particles[l[1]].position;

			//p1.y = 0
			//p2.y = 0

			//console.log(p1,p2)

			d = this.tv.copy( p1 ).distanceTo(p2);

			if(extra){
				if(d>this.maxDist) continue
			} else {
				if(d>this.maxDist)  this.maxDist = d;
			}

			

			//this.tv.copy( p2 ).sub( p1 ).multiplyScalar(0.5)
			this.tv.copy( p2 ).sub( p1 );//.multiplyScalar(0.5)

			

			tmp.push({ 
				type:'distance', 
			    helperSize:0.03, 
			    b1:this.name+l[0], 
			    b2:this.name+l[1], 
			    //limit:[d - 0.01, d + 0.01], 
			    //limit:[d*0.5, d],
			    limit:[d*0.5, d],
			    spring:[20, 1.0],

			    collision:true,
			    //spring:[2000, 100],

			    //noPreProcess:true,
			    noPreProcess:true,
			    alway:true,
			    //spring:[0.0, 0.0],
			    //friction:0,
			    //visible:true 
		    });
		    /*tmp.push({ 
		    	helperSize:0.01,
			    type:'spherical', 
			    b1:b1, b2:b2, 
			    worldAxis: n===0 ? [1,0,0] : [0,0,1],
			    //pos1: this.tv2.set(0,0,0).add(this.tv).toArray(),
			    pos2: this.tv2.set(0,0,0).sub(this.tv).toArray(),
		        limit:[-180, 180, 0.01, 10 ], //spring:[100, 0.01], 
		    })
		    n++
		    if(n===2)n=0*/
		}

		this.motor.add(tmp);

	}

	getPosition(){

		let ar = [];
		let i = this.particles.length, p, n;
		while(i--){

			n = i*3;
	    	p = this.particles[i];
	    	ar[n] = p.position.x;
	    	ar[n+1] = p.position.y;
	    	ar[n+2] = p.position.z;
	    }

	    return ar

	}

	
    // Get neighbors within smoothing volume, save in the array neighbors
    getNeighbors( particle, neighbors ) {

	    const N = this.particles.length;
	    const id = particle.idx;
	    const R2 = this.smoothing * this.smoothing;
	    let distance = 0;//SPHSystem_getNeighbors_dist
	    for (let i = 0; i !== N; i++) {
	        const p = this.particles[i];
	        //const dx = p.position.x - particle.position.x, dy = p.position.y - particle.position.y, dz = p.position.z - particle.position.z;
	        distance = this.distanceSq( p, particle );//dx * dx + dy * dy + dz * dz
	        if (id !== p.idx && distance < R2) {
	            neighbors.push(p);
	        }
	    }	
    }

    distance(p, v) {
	    const dx = p.position.x - v.position.x, dy = p.position.y - v.position.y, dz = p.position.z - v.position.z;
	    return Math.sqrt(dx * dx + dy * dy + dz * dz)
	}

    distanceSq(p, v) {
	    const dx = p.position.x - v.position.x, dy = p.position.y - v.position.y, dz = p.position.z - v.position.z;
	    return dx * dx + dy * dy + dz * dz
	}

    // Calculate the weight using the W(r) weightfunction
	w(r) {
	    // 315
	    const h = this.smoothing;
	    return 315.0/(64.0*Math.PI*Math.pow(h,9)) * Math.pow(h*h-r*r,3);
	    //return (315.0 / (64.0 * Math.PI * h ** 9)) * (h * h - r * r) ** 3;

	}

	// calculate gradient of the weight function
	gradw(rVec, resultVec) {

	    const r = rVec.length();
	    const h = this.smoothing;
	    const vv = 945.0/(32.0*Math.PI*Math.pow(h,9)) * Math.pow((h*h-r*r),2);
	    //resultVec.copy(rVec).multiplyScalar( (945.0 / (32.0 * Math.PI * h ** 9)) * (h * h - r * r) ** 2 );
	    resultVec.copy(rVec).multiplyScalar( vv );

	}

	// Calculate nabla(W)
	nablaw(r) {

	    const h = this.smoothing;
	    const nabla = 945.0/(32.0*Math.PI*Math.pow(h,9)) * (h*h-r*r)*(7*r*r - 3*h*h);
	    //const nabla = (945.0 / (32.0 * Math.PI * h ** 9)) * (h * h - r * r) * (7 * r * r - 3 * h * h);
	    return nabla;

	}

	// For mesh contruction

	getKey( hash, f){

		let k;
		for(let i in hash){
			k = hash[i];
			if(k.indexOf(f) !== -1) return i
		}
	
	}

	sameLink(link, a,b){

		let i = link.length, l;
		let same = false;
		while(i--){
			l = link[i];
			if( a === b ) same = true;
			if( a === l[0] && b === l[1] ) same = true;
			if( a === l[1] && b === l[0] ) same = true;
		}
	    return same;

	}

	update() {

		const TMP = [];

		const N = this.particles.length;
	    const cs = this.speed;
	    const eps = this.eps;

	    let j;

	    for (let i = 0; i !== N; i++) {
	    //while(i--){

	    	const p = this.particles[i]; // Current particle
	    	p.force.set(0,0,0);
            const neighbors = this.neighbors[i];

            // Get neighbors
		    neighbors.length = 0;
		    this.getNeighbors(p, neighbors);
		    neighbors.push(this.particles[i]); // Add current too
		    const numNeighbors = neighbors.length;

		    // Accumulate density for the particle
		    let sum = 0.0;
		    j = numNeighbors;
		    while(j--){
		    //for (let j = 0; j !== numNeighbors; j++) {
		        //printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
		        const weight = this.w( this.distance( p, neighbors[j] ) );
		        sum += neighbors[j].mass * weight;
		    }

		    // Save
		    this.densities[i] = sum;
		    this.pressures[i] = cs * cs * (this.densities[i] - this.density);

	    }

	    // Add forces

	    // Sum to these accelerations
	    const a_pressure = SPHSystem_update_a_pressure;
	    const a_visc = SPHSystem_update_a_visc;
	    const gradW = SPHSystem_update_gradW;
	    const r_vec = SPHSystem_update_r_vec;
	    const u = SPHSystem_update_u;

	    let neighbor, r;

	    for (let i = 0; i !== N; i++) {

	    	const particle = this.particles[i];

		    a_pressure.set(0, 0, 0);
		    a_visc.set(0, 0, 0);

		    // Init vars
		    let Pij;
		    let nabla;

		    // Sum up for all other neighbors
		    const neighbors = this.neighbors[i];
		    const numNeighbors = neighbors.length;

		    

		    //j = numNeighbors
		    //while(j--){
		    for (let j = 0; j !== numNeighbors; j++) {
		    	
		    	neighbor = neighbors[j];

		    	// Get r once for all..
		    	r_vec.copy(particle.position).sub(neighbor.position);
		        r = r_vec.length();


		        // Pressure contribution
		        Pij =
		          -neighbor.mass *
		          (this.pressures[i] / (this.densities[i] * this.densities[i] + eps) +
		            this.pressures[j] / (this.densities[j] * this.densities[j] + eps));

		        this.gradw(r_vec, gradW);
		        // Add to pressure acceleration
		        gradW.multiplyScalar(Pij); //scale(Pij, gradW)
		        a_pressure.add(gradW);//.vadd(gradW, a_pressure)


		        // Viscosity contribution
		        u.copy(neighbor.velocity).sub(particle.velocity);

		        /*TMP.push({
			    	name:neighbor.name,
			    	velocity : u.toArray()
			    })*/
		        //neighbor.velocity.vsub(particle.velocity, u)
		        u.multiplyScalar((1.0 / (0.0001 + this.densities[i] * this.densities[j])) * this.viscosity * neighbor.mass);
		        nabla = this.nablaw(r);
		        u.multiplyScalar(nabla);
		        // Add to viscosity acceleration
		        a_visc.add(u);


		    }

		    // Calculate force
		    a_visc.multiplyScalar(particle.mass);
		    a_pressure.multiplyScalar(particle.mass);

		    // Add force to particles

		    particle.force.add(a_visc);
            particle.force.add(a_pressure);

		    TMP.push({
		    	name: particle.name,
		    	force: particle.force.toArray(),
		    	//pos:particle.position.toArray()
		    	//velocityOperation:'step',
		    	//linear:0.01
		    });
            
	    }

	    this.motor.change(TMP);
	    this.updateMesh();

	}

}

const u=Math.max(1e-9,Number.EPSILON),c=.5*u,g=Math.log10(1/u),d=Math.pow(10,g),p=c*d;function x(t,n,i,e){return function(t,n,i,e,s){let o={x:n.x-t.x,y:n.y-t.y},r={x:e.x-i.x,y:e.y-i.y};const a=w(t),h=w(i);if(a===h)return s;const l=w(n);if(l===h)return s;const u=w(e);if(a===u)return s;if(l===u)return s;let c=(t.x-i.x)*r.y-(t.y-i.y)*r.x,g=(n.x-i.x)*r.y-(n.y-i.y)*r.x,d=(i.x-t.x)*o.y-(i.y-t.y)*o.x,p=(e.x-t.x)*o.y-(e.y-t.y)*o.x;return (c>=0&&g<=0||c<=0&&g>=0)&&(d>=0&&p<=0||d<=0&&p>=0)}(t,n,i,e,false)}function m$1(n,i,e,s){let o=0,r=new Vector3;return M$2(n)===M$2(i)||0===e.x&&0===e.y&&0===e.z?null:(o=((s.x-n.x)*e.x+(s.y-n.y)*e.y+(s.z-n.z)*e.z)/((i.x-n.x)*e.x+(i.y-n.y)*e.y+(i.z-n.z)*e.z),o>=0&&o<=1?(r=new Vector3(n.x+(i.x-n.x)*o,n.y+(i.y-n.y)*o,n.z+(i.z-n.z)*o),{x:r,s:o}):null)}function f(t,n,i){return (n.x-t.x)*(i.y-t.y)-(n.y-t.y)*(i.x-t.x)<=0}function y(t){return ~~(t*d+p)}function v(t,n){return Math.round((t+n)*(t+n+1)*.5+n)}function w(t){return v(y(t.x),y(t.y))}function M$2(t){return function(t,n,i){const e=(t+n)*(t+n+1)*.5+n;return (e+i)*(e+i+1)*.5+i}(y(t.x),y(t.y),y(t.z))}function z(t,n,i){return n.x*(t.x-i.x)+n.y*(t.y-i.y)+n.z*(t.z-i.z)>=0}class b{constructor(i=new Vector3,e=new Vector3,s=new Vector2){this.position=i,this.normal=e,this.uv=s;}clone(t){return new b(this.position.clone(),this.normal.clone(),this.uv.clone())}equals(t){return M$2(this.position)===M$2(t.position)}toString(){return `Position = ${this.position.x}, ${this.position.y}, ${this.position.z}, Normal = ${this.normal.x}, ${this.normal.y}, ${this.normal.z}, UV = ${this.uv.x}, ${this.uv.y}`}}const V$1=0,A=1;let C$2 = class C{constructor(t=null){this.isFragment=true,this.vertices=[],this.cutVertices=[],this.triangles=[[],[]],this.constraints=[],this.indexMap=[],this.bounds=new Box3,this.vertexAdjacency=[],this.convextested=false,this.minSize=.005,this.good=true,null!==t&&this.fromArgs(t);}fromArgs(i){const{positions:e,normals:s,uvs:o,indices:r}=i;for(let i=0;i<e.length/3;i++){const r=new Vector3(e[3*i],e[3*i+1],e[3*i+2]),a=new Vector3(s[3*i],s[3*i+1],s[3*i+2]),h=o?new Vector2(o[2*i],o[2*i+1]):new Vector2(0,0);this.vertices.push(new b(r,a,h));}if(r)this.triangles=[Array.from(r),[]];else {const t=e.length/3;this.triangles=[Array.from({length:t},((t,n)=>n)),[]];}this.calculateBounds();}get valid(){let t=this.triangleCount>6&&this.vertexCount>14;return this.volume()<this.minSize&&(t=false),t}get size(){this.bounds||this.calculateBounds();let n=new Vector3;return this.bounds.getSize(n)}get convex(){return this.convextested||(this.cc=this.isConvex()),this.cc}get triangleCount(){return (this.triangles[0].length+this.triangles[1].length)/3}get vertexCount(){return this.vertices.length+this.cutVertices.length}addCutFaceVertex(t,n,i){const e=new b(t,n,i);this.vertices.push(e),this.cutVertices.push(e),this.vertexAdjacency.push(this.vertices.length-1);}addMappedVertex(t,n){this.vertices.push(t),this.indexMap[n]=this.vertices.length-1;}addTriangle(t,n,i,e){this.triangles[e].push(t,n,i);}addMappedTriangle(t,n,i,e){this.triangles[e].push(this.indexMap[t],this.indexMap[n],this.indexMap[i]);}weldCutFaceVertices(){const t=[],n=[],i=new Array(this.cutVertices.length);let e=0;const s=new Map;this.cutVertices.forEach(((o,r)=>{const a=M$2(o.position),h=s.get(a);s.has(a)?i[r]=h:(i[r]=e,s.set(a,e),t.push(this.cutVertices[r]),n.push(this.vertexAdjacency[r]),e++);}));const o=[];for(let t=0;t<this.constraints.length;t++){const n=this.constraints[t];n.v1=i[n.v1],n.v2=i[n.v2],Math.abs(n.v1-n.v2)<1e-9||o.push(n);}this.constraints=o,this.cutVertices=t,this.vertexAdjacency=n;}volume(){let t=[];this.vertices.forEach((n=>{t.push(n.position.x,n.position.y,n.position.z);})),this.cutVertices.forEach((n=>{t.push(n.position.x,n.position.y,n.position.z);}));let n,i=t.length/3,e=[0,0,0],s=[0,0,0];for(;i--;)n=3*i,t[n]<e[0]?e[0]=t[n]:t[n]>s[0]&&(s[0]=t[n]),t[n+1]<e[1]?e[1]=t[n+1]:t[n+1]>s[1]&&(s[1]=t[n+1]),t[n+2]<e[2]?e[2]=t[n+2]:t[n+2]>s[2]&&(s[2]=t[n+2]);let o=[s[0]-e[0],s[1]-e[1],s[2]-e[2]];return .5*o[0]*8*(.5*o[1])*(.5*o[2])}calculateBounds(){if(!this.vertices.length)return;let t=this.vertices[0].position.clone(),n=t.clone();this.vertices.forEach((i=>{t.x=Math.min(t.x,i.position.x),t.y=Math.min(t.y,i.position.y),t.z=Math.min(t.z,i.position.z),n.x=Math.max(n.x,i.position.x),n.y=Math.max(n.y,i.position.y),n.z=Math.max(n.z,i.position.z);})),this.bounds=new Box3(t,n);}toMesh(n,i=null,o=true,r=0){const a=new Vector3,h=new Vector3;let l=this.toGeometry(o,r);l.boundingBox.getCenter(a),l.boundingBox.getSize(h),l.translate(-a.x,-a.y,-a.z),l.boundingSphere=new Sphere(new Vector3,.5*h.length());let u=n.material;i&&u.isMaterial&&(u=[n.material,i]);const c=new Mesh(l,u);return c.receiveShadow=n.receiveShadow,c.castShadow=n.castShadow,c.matrixAutoUpdate=n.matrixAutoUpdate,c.frustumCulled=n.frustumCulled,c.renderOrder=n.renderOrder,c.sizer=h.length(),a.applyQuaternion(n.quaternion),c.position.copy(n.position).add(a),c.quaternion.copy(n.quaternion),c.userData={origin:c.position.clone(),direction:a.normalize(),size:h},c}makeTrickness(t,n,i,e,s){let o,r=1-s,a=[...t],h=[...n],l=[...i],u=t.length/3,c=u;for(;c--;)o=3*c,a[o]*=r,a[o+1]*=r,a[o+2]*=r;let g=[];for(c=e.length;c--;)g[c]=e[c]+u;return [a,h,l,g]}toGeometry(t,n){let i;const e=new BufferGeometry;let s=[],a=[],h=[];if(this.vertices.forEach((t=>{s.push(t.position.x,t.position.y,t.position.z),a.push(t.normal.x,t.normal.y,t.normal.z),h.push(t.uv.x,t.uv.y);})),0!==n){let t=this.makeTrickness(s,a,h,this.triangles[0],n);s=s.concat(t[0]),a=a.concat(t[1]),h=h.concat(t[2]),i=t[3];}return t&&this.cutVertices.forEach((t=>{s.push(t.position.x,t.position.y,t.position.z),a.push(t.normal.x,t.normal.y,t.normal.z),h.push(t.uv.x,t.uv.y);})),e.addGroup(0,this.triangles[0].length,0),0!==n&&(e.addGroup(this.triangles[0].length,i.length,1),this.triangles[0]=this.triangles[0].concat(i)),t&&e.addGroup(this.triangles[0].length,this.triangles[1].length,1),e.setAttribute("position",new BufferAttribute(new Float32Array(s),3)),e.setAttribute("normal",new BufferAttribute(new Float32Array(a),3)),e.setAttribute("uv",new BufferAttribute(new Float32Array(h),2)),e.setIndex(new BufferAttribute(new Uint32Array(this.triangles.flat()),1)),e.computeBoundingBox(),e}isConvex(n=.001){this.convextested=true;let i=0;const e=this.triangleCount,s=[...this.triangles[0],...this.triangles[1]],o=[...this.vertices,...this.cutVertices],r=o.length;if(0===e||0===r)return  false;const a=new Vector3,h=new Vector3,l=new Vector3,u=new Vector3,c=new Vector3;let g,d;for(let t=0;t<e;t++){i=3*t,c.copy(o[0].position),a.copy(o[s[i]].position),h.copy(o[s[i+1]].position),l.copy(o[s[i+2]].position),h.sub(a),l.sub(a),u.copy(h).cross(l).normalize(),g=c.sub(a).dot(u);for(let t=0;t<r;t++)if(d=c.copy(o[t].position).sub(a).dot(u),Math.abs(g)>n&&Math.abs(d)>n&&g*d<0)return  false}return  true}};let T$1 = class T{constructor(t,n,i=-1,e=-1,s=0){this.v1=t,this.v2=n,this.t1=i,this.t2=e,this.t1Edge=s;}clone(){return new T(this.v1,this.v2,this.t1,this.t2,this.t1Edge)}equals(t){return this.v1===t.v1&&this.v2===t.v2||this.v1===t.v2&&this.v2===t.v1}toString(){return `Edge: T${this.t1}->T${this.t2} (V${this.v1}->V${this.v2})`}};let S$1 = class S{static getBinNumber(t,n,i){return t%2==0?t*i+n:(t+1)*i-n-1}static sort(t,n,i){if(i<=1)return t;n>t.length&&(n=t.length);const e=new Array(i).fill(0),s=new Array(t.length);for(let i=0;i<n;i++)e[t[i].bin]++;for(let t=1;t<i;t++)e[t]+=e[t-1];for(let i=n-1;i>=0;i--){const n=t[i].bin;e[n]--,s[e[n]]=t[i];}for(let i=n;i<s.length;i++)s[i]=t[i];return s}};let E$1 = class E{constructor(t,n){this.index=t,this.coords=n,this.bin=0;}toString(){return `${this.coords} -> ${this.bin}`}};const N$1=-1;let q$2 = class q{constructor(i,e){if(this.normalizationScaleFactor=1,this.N=i.length,this.N>=3){this.triangleCount=2*this.N+1,this.triangulation=Array.from({length:this.triangleCount},(()=>new Array(6).fill(0))),this.skipTriangle=new Array(this.triangleCount).fill(false),this.points=new Array(this.N+3),this.normal=e.clone().normalize();let r=i[0].position.clone().sub(i[1].position).normalize(),a=this.normal.clone(),h=new Vector3;h.crossVectors(r,a).normalize();for(let t=0;t<this.N;t++){var s=i[t].position,o=new Vector2(s.dot(r),s.dot(h));this.points[t]=new E$1(t,o);}}else this.triangleCount=0,this.triangulation=[],this.skipTriangle=[],this.points=[],this.normal=new Vector3;}triangulate(){if(this.N<3)return [];this.addSuperTriangle(),this.normalizeCoordinates(),this.computeTriangulation(),this.discardTrianglesWithSuperTriangleVertices();const t=[];for(let n=0;n<this.triangleCount;n++)this.skipTriangle[n]||t.push(this.triangulation[n][0],this.triangulation[n][1],this.triangulation[n][2]);return t}normalizeCoordinates(){let t=Number.MAX_VALUE,i=Number.MIN_VALUE,e=Number.MAX_VALUE,s=Number.MIN_VALUE;for(let n=0;n<this.N;n++)t=Math.min(t,this.points[n].coords.x),i=Math.max(i,this.points[n].coords.x),e=Math.min(e,this.points[n].coords.y),s=Math.max(s,this.points[n].coords.y);const o=Math.max(i-t,s-e);for(let i=0;i<this.N;i++){var r=this.points[i],a=new Vector2((r.coords.x-t)/o,(r.coords.y-e)/o);this.points[i].coords=a;}}sortPointsIntoBins(){const t=Math.round(Math.pow(this.N,.25)),n=t*t;for(let n=0;n<this.N;n++){var i=this.points[n];const e=Math.floor(.99*t*i.coords.y),s=Math.floor(.99*t*i.coords.x);i.bin=S$1.getBinNumber(e,s,t);}return S$1.sort(this.points,this.N,n)}computeTriangulation(){let t=0,n=0,i=this.sortPointsIntoBins();for(let e=0;e<this.N;e++){let s=i[e];if(!s)break;let o=0,r=false;for(;!r&&!(o++>n||t===N$1);){let i=this.points[this.triangulation[t][0]].coords,e=this.points[this.triangulation[t][1]].coords,o=this.points[this.triangulation[t][2]].coords;f(i,e,s.coords)?f(e,o,s.coords)?f(o,i,s.coords)?(this.insertPointIntoTriangle(s,t,n),n+=2,t=n,r=true):t=this.triangulation[t][5]:t=this.triangulation[t][4]:t=this.triangulation[t][3];}}}addSuperTriangle(){this.points[this.N]=new E$1(this.N,new Vector2(-100,-100)),this.points[this.N+1]=new E$1(this.N+1,new Vector2(0,100)),this.points[this.N+2]=new E$1(this.N+2,new Vector2(100,-100)),this.triangulation[0][0]=this.N,this.triangulation[0][1]=this.N+1,this.triangulation[0][2]=this.N+2,this.triangulation[0][3]=N$1,this.triangulation[0][4]=N$1,this.triangulation[0][5]=N$1;}insertPointIntoTriangle(t,n,i){const e=n,s=i+1,o=i+2;this.triangulation[s][0]=t.index,this.triangulation[s][1]=this.triangulation[n][1],this.triangulation[s][2]=this.triangulation[n][2],this.triangulation[s][3]=o,this.triangulation[s][4]=this.triangulation[n][4],this.triangulation[s][5]=e,this.triangulation[o][0]=t.index,this.triangulation[o][1]=this.triangulation[n][0],this.triangulation[o][2]=this.triangulation[n][1],this.triangulation[o][3]=e,this.triangulation[o][4]=this.triangulation[n][3],this.triangulation[o][5]=s,this.updateAdjacency(this.triangulation[n][3],n,o),this.updateAdjacency(this.triangulation[n][4],n,s),this.triangulation[e][1]=this.triangulation[n][2],this.triangulation[e][2]=this.triangulation[n][0],this.triangulation[e][0]=t.index,this.triangulation[e][4]=this.triangulation[n][5],this.triangulation[e][3]=s,this.triangulation[e][5]=o,this.restoreDelauneyTriangulation(t,e,s,o);}restoreDelauneyTriangulation(t,n,i,e){const s=[];for(s.push([n,this.triangulation[n][4]]),s.push([i,this.triangulation[i][4]]),s.push([e,this.triangulation[e][4]]);s.length>0;)if([n,i]=s.pop()??[N$1,N$1],i!==N$1){const e=this.swapQuadDiagonalIfNeeded(t.index,n,i);null!==e&&(s.push([n,e.t3]),s.push([i,e.t4]));}}swapQuadDiagonalIfNeeded(t,n,i){let e=0,s=0,o=0,r=t,a=0,h=0;this.triangulation[i][3]===n?(e=this.triangulation[i][1],s=this.triangulation[i][0],o=this.triangulation[i][2],a=this.triangulation[i][4],h=this.triangulation[i][5]):this.triangulation[i][4]===n?(e=this.triangulation[i][2],s=this.triangulation[i][1],o=this.triangulation[i][0],a=this.triangulation[i][5],h=this.triangulation[i][3]):(e=this.triangulation[i][0],s=this.triangulation[i][2],o=this.triangulation[i][1],a=this.triangulation[i][3],h=this.triangulation[i][4]);return this.swapTest(this.points[e].coords,this.points[s].coords,this.points[o].coords,this.points[r].coords)?(this.updateAdjacency(a,i,n),this.updateAdjacency(this.triangulation[n][5],n,i),this.triangulation[n][0]=r,this.triangulation[n][1]=e,this.triangulation[n][2]=o,this.triangulation[i][0]=r,this.triangulation[i][1]=o,this.triangulation[i][2]=s,this.triangulation[i][3]=n,this.triangulation[i][4]=h,this.triangulation[i][5]=this.triangulation[n][5],this.triangulation[n][4]=a,this.triangulation[n][5]=i,{t3:a,t4:h}):null}discardTrianglesWithSuperTriangleVertices(){for(let t=0;t<this.triangleCount;t++)(this.triangleContainsVertex(t,this.N)||this.triangleContainsVertex(t,this.N+1)||this.triangleContainsVertex(t,this.N+2))&&(this.skipTriangle[t]=true);}swapTest(t,n,i,e){const s=t.x-i.x,o=n.x-i.x,r=t.y-i.y,a=n.y-i.y,h=t.x-e.x,l=n.x-e.x,u=t.y-e.y,c=n.y-e.y,g=s*o+r*a,d=l*h+c*u;if(g>=0&&d>=0)return  false;if(g<0&&d<0)return  true;return (s*a-o*r)*d+(l*u-h*c)*g<0}triangleContainsVertex(t,n){return this.triangulation[t][0]===n||this.triangulation[t][1]===n||this.triangulation[t][2]===n}updateAdjacency(t,n,i){if(t===N$1)return;const e=this.findSharedEdge(t,n);e&&(this.triangulation[t][e]=i);}findSharedEdge(t,n){return t===N$1?null:this.triangulation[t][3]===n?3:this.triangulation[t][4]===n?4:this.triangulation[t][5]===n?5:null}};let P$2 = class P{constructor(t,n,i,e,s,o,r,a,h,l){this.q1=t,this.q2=n,this.q3=i,this.q4=e,this.t1=s,this.t2=o,this.t1L=r,this.t1R=a,this.t2L=h,this.t2R=l;}toString(){return `T${this.t1}/T${this.t2} (V${this.q1},V${this.q2},V${this.q3},V${this.q4})`}};let F$1 = class F extends q$2{edgeVertex1=[0,0,0,0,1,2];edgeVertex2=[0,0,0,1,2,0];oppositePoint=[0,0,0,2,0,1];nextEdge=[0,0,0,4,5,3];previousEdge=[0,0,0,5,3,4];constructor(t,n,i){super(t,i),this.constraints=n,this.vertexTriangles=[];}triangulate(){if(this.N<3)return [];this.addSuperTriangle(),this.normalizeCoordinates(),this.computeTriangulation(),this.constraints.length>0&&(this.applyConstraints(),this.discardTrianglesViolatingConstraints()),this.discardTrianglesWithSuperTriangleVertices();let t=[];for(let n=0;n<this.triangleCount;n++)this.skipTriangle[n]||(t.push(this.triangulation[n][0]),t.push(this.triangulation[n][1]),t.push(this.triangulation[n][2]));return t}applyConstraints(){const t=this.triangulation.length;this.vertexTriangles=new Array(this.N+3).fill(0);for(let n=0;n<t;n++)this.vertexTriangles[this.triangulation[n][0]]=n,this.vertexTriangles[this.triangulation[n][1]]=n,this.vertexTriangles[this.triangulation[n][2]]=n;for(let t of this.constraints){if(t.v1===t.v2)continue;const n=this.findIntersectingEdges(t,this.vertexTriangles);this.removeIntersectingEdges(t,n);}}findIntersectingEdges(t,n){const i=[],e=this.findStartingEdge(n,t);if(null===e)return i;i.push(e);let s=e.t1,o=e.t1Edge,r=s,a=false;for(;!a;){r=s,s=this.triangulation[s][o];const n=this.points[t.v1].coords,e=this.points[t.v2].coords,h=this.points[this.triangulation[s][0]].coords,l=this.points[this.triangulation[s][1]].coords,u=this.points[this.triangulation[s][2]].coords;if(this.triangleContainsVertex(s,t.v2))a=true;else if(this.triangulation[s][3]!==r&&x(n,e,h,l)){o=3;const t=new T$1(this.triangulation[s][0],this.triangulation[s][1],s,this.triangulation[s][3],o);i.push(t);}else if(this.triangulation[s][4]!==r&&x(n,e,l,u)){o=4;const t=new T$1(this.triangulation[s][1],this.triangulation[s][2],s,this.triangulation[s][4],o);i.push(t);}else {if(this.triangulation[s][5]===r||!x(n,e,u,h)){console.warn("Failed to find final triangle, exiting early.");break}{o=5;const t=new T$1(this.triangulation[s][2],this.triangulation[s][0],s,this.triangulation[s][5],o);i.push(t);}}}return i}findStartingEdge(t,n){let i,e,s,o=new T$1(-1,-1),r=n.v1,a=t[r],h=false,l=null;const u=new Array(this.triangulation.length);for(;!l&&!h;){if(u[a]=true,this.triangleContainsConstraint(a,n))return null;if(l=this.edgeConstraintIntersectsTriangle(a,n),l)break;if(i=this.triangulation[a][3],e=this.triangulation[a][4],s=this.triangulation[a][5],-1!==i&&!u[i]&&this.triangleContainsVertex(i,r))a=i;else if(-1!==e&&!u[e]&&this.triangleContainsVertex(e,r))a=e;else {if(-1===s||u[s]||!this.triangleContainsVertex(s,r)){h=true;break}a=s;}}if(l){const t=this.triangulation[a][this.edgeVertex1[l]],n=this.triangulation[a][this.edgeVertex2[l]],i=this.triangulation[a][l];return o=new T$1(t,n,a,i,l),o}return null}removeIntersectingEdges(t,n){let i,e=[],s=0;for(;n.length>0&&s<=n.length;){i=n.shift(),null==i&&console.log("no edge !!");let o=this.findQuadFromSharedEdge(i.t1,i.t1Edge);if(o)if(x(this.points[o.q4].coords,this.points[o.q3].coords,this.points[o.q1].coords,this.points[o.q2].coords)){this.swapQuadDiagonal(o,n,e,this.constraints);let i=new T$1(o.q3,o.q4,o.t1,o.t2,5);x(this.points[t.v1].coords,this.points[t.v2].coords,this.points[o.q3].coords,this.points[o.q4].coords)?n.push(i):(s=0,e.push(i));}else n.push(i);s++;}e.length>0&&this.restoreConstrainedDelauneyTriangulation(t,e);}restoreConstrainedDelauneyTriangulation(t,n){let i=true;for(;i;){i=false;for(let e=0;e<n.length;e++){const s=n[e];if(s.equals(t))continue;let o=this.findQuadFromSharedEdge(s.t1,s.t1Edge);if(o&&this.swapTest(this.points[o.q1].coords,this.points[o.q2].coords,this.points[o.q3].coords,this.points[o.q4].coords)){this.swapQuadDiagonal(o,n,this.constraints,null);const t=o.q3,s=o.q4;n[e]=new T$1(t,s,o.t1,o.t2,5),i=true;}}}}discardTrianglesViolatingConstraints(){this.skipTriangle.fill(true);let t=new Set;for(let n=0;n<this.constraints.length;n++){const i=this.constraints[n];t.add(v(i.v1,i.v2));}let n,i,e,s,o,r,a,h,l,u=[];const c=new Array(this.triangulation.length);for(let g=0;g<this.triangleCount;g++)if(!c[g]&&(n=this.triangulation[g][0],i=this.triangulation[g][1],e=this.triangulation[g][2],s=t.has(v(n,i)),o=t.has(v(i,e)),r=t.has(v(e,n)),a=t.has(v(i,n)),h=t.has(v(e,i)),l=t.has(v(n,e)),!(a||h||l)&&(s||o||r)))for(this.skipTriangle[g]=false,u=[],s||u.push(this.triangulation[g][3]),o||u.push(this.triangulation[g][4]),r||u.push(this.triangulation[g][5]);u.length>0;){const s=u.shift();void 0===s||-1===s||c[s]||(n=this.triangulation[s][0],i=this.triangulation[s][1],e=this.triangulation[s][2],a=t.has(v(i,n)),h=t.has(v(e,i)),l=t.has(v(n,e)),a||h||l?c[s]=true:(this.skipTriangle[s]=false,c[s]=true,t.has(v(n,i))||u.push(this.triangulation[s][3]),t.has(v(i,e))||u.push(this.triangulation[s][4]),t.has(v(e,n))||u.push(this.triangulation[s][5])));}}triangleContainsConstraint(t,n){return !(t>=this.triangulation.length)&&!(this.triangulation[t][0]!==n.v1&&this.triangulation[t][1]!==n.v1&&this.triangulation[t][2]!==n.v1||this.triangulation[t][0]!==n.v2&&this.triangulation[t][1]!==n.v2&&this.triangulation[t][2]!==n.v2)}edgeConstraintIntersectsTriangle(t,n){const i=this.points[n.v1].coords,e=this.points[n.v2].coords,s=this.points[this.triangulation[t][0]].coords,o=this.points[this.triangulation[t][1]].coords,r=this.points[this.triangulation[t][2]].coords;return x(i,e,s,o)?3:x(i,e,o,r)?4:x(i,e,r,s)?5:null}findQuadFromSharedEdge(t,n){let i,e,s,o,r,a,h,l,u=this.triangulation[t][n],c=this.findSharedEdge(u,t);return c?(3===c?(e=this.triangulation[u][0],i=this.triangulation[u][1],s=this.triangulation[u][2]):4===c?(e=this.triangulation[u][1],i=this.triangulation[u][2],s=this.triangulation[u][0]):(e=this.triangulation[u][2],i=this.triangulation[u][0],s=this.triangulation[u][1]),o=this.triangulation[t][this.oppositePoint[n]],r=this.triangulation[t][this.previousEdge[n]],a=this.triangulation[t][this.nextEdge[n]],h=this.triangulation[u][this.nextEdge[c]],l=this.triangulation[u][this.previousEdge[c]],new P$2(i,e,s,o,t,u,r,a,h,l)):null}swapQuadDiagonal(t,n,i,e){const s=t.t1,o=t.t2,r=t.t1R,a=t.t1L,h=t.t2R,l=t.t2L;this.triangulation[s][0]=t.q4,this.triangulation[s][1]=t.q1,this.triangulation[s][2]=t.q3,this.triangulation[o][0]=t.q4,this.triangulation[o][1]=t.q3,this.triangulation[o][2]=t.q2,this.triangulation[s][3]=a,this.triangulation[s][4]=l,this.triangulation[s][5]=o,this.triangulation[o][3]=s,this.triangulation[o][4]=h,this.triangulation[o][5]=r,this.updateAdjacency(l,o,s),this.updateAdjacency(r,s,o),this.updateEdgesAfterSwap(n,s,o,a,r,l,h),this.updateEdgesAfterSwap(i,s,o,a,r,l,h),this.updateEdgesAfterSwap(e,s,o,a,r,l,h),this.vertexTriangles[t.q1]=s,this.vertexTriangles[t.q2]=o;}updateEdgesAfterSwap(t,n,i,e,s,o,r){if(t)for(let a of t)a.t1===n&&a.t2===s?(a.t1=i,a.t2=s,a.t1Edge=5):a.t1===n&&a.t2===e?a.t1Edge=3:a.t1===s&&a.t2===n?a.t2=i:a.t1===e&&a.t2===n||(a.t1===i&&a.t2===r?a.t1Edge=4:a.t1===i&&a.t2===o?(a.t1=n,a.t2=o,a.t1Edge=4):a.t1===r&&a.t2===i||a.t1===o&&a.t2===i&&(a.t2=n));}};function I$1(t,i,e,s,o,r=false,a=true){const h=new C$2,l=new C$2,u=new Array(t.vertexCount).fill(false);for(let n=0;n<t.vertices.length;n++){const s=t.vertices[n];u[n]=z(s.position,i,e);(u[n]?h:l).addMappedVertex(s,n);}const c=t.vertices.length;for(let n=0;n<t.cutVertices.length;n++){const s=t.cutVertices[n];u[n+c]=z(s.position,i,e);(u[n+c]?h:l).addMappedVertex(s,n+c);}return k(t,h,l,i,e,u,V$1),a&&k(t,h,l,i,e,u,A),a&&function(t,i,e,s,o,r){if(t.weldCutFaceVertices(),i.weldCutFaceVertices(),t.cutVertices.length<3)return;const a=r?new q$2(t.cutVertices,e):new F$1(t.cutVertices,t.constraints,e),h=a.triangulate();for(let r=0;r<t.cutVertices.length;r++){var l=t.cutVertices[r],u=a.points[r];const h=new Vector2(a.normalizationScaleFactor*u.coords.x*s.x+o.x,a.normalizationScaleFactor*u.coords.y*s.y+o.y),c=new b(l.position.clone(),e.clone(),h.clone()),g=new b(l.position.clone(),e.clone().negate(),h.clone());t.cutVertices[r]=c,i.cutVertices[r]=g;}let c=t.vertices.length,g=i.vertices.length;for(let n=0;n<h.length;n+=3)t.addTriangle(c+h[n],c+h[n+1],c+h[n+2],A),i.addTriangle(g+h[n],g+h[n+2],g+h[n+1],A);}(h,l,i.clone().negate(),s,o,r),{topSlice:h,bottomSlice:l}}function k(t,n,i,e,s,o,r){const a=t.triangles[r];let h,l,u;for(let c=0;c<a.length;c+=3)h=a[c],l=a[c+1],u=a[c+2],o[h]&&o[l]&&o[u]?n.addMappedTriangle(h,l,u,r):o[h]||o[l]||o[u]?o[l]&&o[u]&&!o[h]?j(l,u,h,e,s,t,n,i,r,true):o[u]&&o[h]&&!o[l]?j(u,h,l,e,s,t,n,i,r,true):o[h]&&o[l]&&!o[u]?j(h,l,u,e,s,t,n,i,r,true):o[l]||o[u]||!o[h]?o[u]||o[h]||!o[l]?o[h]||o[l]||!o[u]||j(h,l,u,e,s,t,n,i,r,false):j(u,h,l,e,s,t,n,i,r,false):j(l,u,h,e,s,t,n,i,r,false):i.addMappedTriangle(h,l,u,r);}function j(i,e,s,o,r,a,h,l,u,c){const g=a.vertices.length;let d=i<g?a.vertices[i]:a.cutVertices[i-g],p=e<g?a.vertices[e]:a.cutVertices[e-g],x=s<g?a.vertices[s]:a.cutVertices[s-g];const f=m$1(d.position,x.position,o,r),y=m$1(p.position,x.position,o,r);if(f&&y){const o=new Vector3(d.normal.x+f.s*(x.normal.x-d.normal.x),d.normal.y+f.s*(x.normal.y-d.normal.y),d.normal.z+f.s*(x.normal.z-d.normal.z)).normalize(),r=new Vector3(p.normal.x+y.s*(x.normal.x-p.normal.x),p.normal.y+y.s*(x.normal.y-p.normal.y),p.normal.z+y.s*(x.normal.z-p.normal.z)).normalize(),a=new Vector2(d.uv.x+f.s*(x.uv.x-d.uv.x),d.uv.y+f.s*(x.uv.y-d.uv.y)),g=new Vector2(p.uv.x+y.s*(x.uv.x-p.uv.x),p.uv.y+y.s*(x.uv.y-p.uv.y));h.addCutFaceVertex(f.x,o,a),h.addCutFaceVertex(y.x,r,g),l.addCutFaceVertex(f.x,o,a),l.addCutFaceVertex(y.x,r,g);const m=h.vertices.length,v=l.vertices.length,w=h.cutVertices.length,M=l.cutVertices.length,z=m-2,b=m-1,V=v-2,A=v-1;c?(h.addTriangle(b,z,h.indexMap[e],u),h.addTriangle(z,h.indexMap[i],h.indexMap[e],u),l.addTriangle(l.indexMap[s],V,A,u),h.constraints.push(new T$1(w-2,w-1)),l.constraints.push(new T$1(M-1,M-2))):(h.addTriangle(z,b,h.indexMap[s],u),l.addTriangle(l.indexMap[i],l.indexMap[e],V,u),l.addTriangle(l.indexMap[e],A,V,u),h.constraints.push(new T$1(w-1,w-2)),l.constraints.push(new T$1(M-2,M-1)));}}function D$2(i){const e=i.attributes.position.array,s=i.attributes.normal.array,o=i.attributes.uv?.array,r=new C$2,a=i.attributes.position.count;let h,l,u;for(let i=0;i<a;i++){h=3*i,l=2*i;const a=new Vector3(e[h],e[h+1],e[h+2]),u=new Vector3(s[h],s[h+1],s[h+2]),c=o?new Vector2(o[l],o[l+1]):new Vector2(0,0);r.vertices.push(new b(a,u,c));}if(i.index)u=Array.from(i.index.array);else {const t=e.length/3;u=Array.from({length:t},((t,n)=>n));}if(i.groups&&2===i.groups.length){const t=[],n=[];for(const e of i.groups){const i=0===e.materialIndex?t:n,s=e.start,o=s+e.count;for(let t=s;t<o;t++)i.push(u[t]);}r.triangles=[t,n];}else r.triangles=[u,[]];return r.calculateBounds(),r}let O$2 = class O{constructor(t){this.parent=[],this.rank=[];for(let n=0;n<t;n++)this.parent[n]=n,this.rank[n]=1;}find(t){return this.parent[t]!==t&&(this.parent[t]=this.find(this.parent[t])),this.parent[t]}union(t,n){const i=this.find(t),e=this.find(n);i!==e&&(this.rank[i]>this.rank[e]?this.parent[e]=i:this.rank[i]<this.rank[e]?this.parent[i]=e:(this.parent[e]=i,this.rank[i]+=1));}};function U$1(t){const n=new O$2(t.vertexCount),i={},e=t.vertices.length,s=t.cutVertices.length,o=new Map;t.vertices.forEach(((t,i)=>{const e=M$2(t.position),s=o.get(e);void 0===s?o.set(e,i):n.union(s,i);}));for(let i=0;i<s;i++)n.union(t.vertexAdjacency[i],i+e);const r=t.triangles;for(let t=0;t<r.length;t++)for(let e=0;e<r[t].length;e+=3){const s=r[t][e],o=r[t][e+1],a=r[t][e+2];n.union(s,o),n.union(o,a);const h=n.find(s);i[h]||(i[h]=[[],[]]),i[h][t].push(s,o,a);}const a={},h=Array(t.vertexCount);for(let i=0;i<e;i++){const e=n.find(i);a[e]||(a[e]=new C$2),a[e].vertices.push(t.vertices[i]),h[i]=a[e].vertices.length-1;}for(let i=0;i<s;i++){const s=n.find(i+e);a[s].cutVertices.push(t.cutVertices[i]),h[i+e]=a[s].vertices.length+a[s].cutVertices.length-1;}for(const e of Object.keys(i)){let s=Number(e),o=n.parent[s];for(let n=0;n<t.triangles.length;n++)for(const t of i[s][n]){const i=h[t];a[o].triangles[n].push(i);}}return Object.values(a)}const R$2={textureScale:new Vector2(1,1),textureOffset:new Vector2};const W$2=new Vector3,_$1=new Vector3,X$1=new Vector3,H=new Plane,J$2=new Plane;function K$2(n,i,e,s,o,r){const a=[],h=n.matrixWorld.clone().invert(),l=n.position;i.applyMatrix4(h);const u=D$2(n.geometry);let c=u.convex,g=.03*u.volume();W$2.addVectors(i,e),H.setFromCoplanarPoints(i,l,W$2);const d=o+s;return function n(o,u,p,x){if(!o)return;if(Math.random()<.05*x||x>d)return void(o.valid&&a.push(o));let m=Math.PI,f=new Vector3;o.calculateBounds(),o.bounds.getCenter(f);let y=c;if(0===x)J$2.normal.copy(H.normal),J$2.constant=H.constant;else if(x<=s)m=(p-u)*(.2+.6*Math.random())+u,_$1.copy(l).sub(i).applyAxisAngle(e,m).add(i),J$2.setFromCoplanarPoints(i,W$2,_$1);else {let t=f.clone().applyMatrix4(h);m=(.5*(1&x)+.2*(2-Math.random()))*Math.PI,_$1.copy(i).sub(t).applyAxisAngle(e,m).add(t),X$1.copy(e).add(t),J$2.setFromCoplanarPoints(t,X$1,_$1);}const{topSlice:v,bottomSlice:w}=I$1(o,J$2.normal,_$1,R$2.textureScale,R$2.textureOffset,y,r);let M=v,z=w;M=U$1(v),z=U$1(w),M&&(M.isFragment&&(M=[M]),M=Y$1(M,g),M.length>0&&M.forEach(((t,i)=>{0===i?n(t,m,p,x+1):a.push(t);}))),z&&(z.isFragment&&(z=[z]),z=Y$1(z,g),z.length>0&&z.forEach(((t,i)=>{0===i?n(t,m,p,x+1):a.push(t);})));}(u,0,2*Math.PI,0),a}function Y$1(t,n){if(0===t.length)return [];let i=0,e=-1,s=[];return t.forEach(((t,s)=>{t.minSize=n,t.bounds=null;let o=.5*t.size.length();t.valid&&o>0?o>i&&(i=o,e=s):t.good=false;})),-1!==e&&s.push(t[e]),t.forEach(((t,n)=>{t.good&&n!==e&&s.push(t);})),s}function tt(t,n,i,e=true,s=0){const o=[];return t.map(((t,r)=>{o.push(t.toMesh(n,i,e,s));})),o}

class Breaker {

	constructor (motor) {

		this.motor = motor;

		this.tpos = new Vector3();
		this.tnormal = new Vector3();

		this.nDebris = 0;
		this.maxDebris = 1500;

		this.interneMat = this.motor.getMat('chrome');//new MeshBasicMaterial({ color:0xff0000 })


		this.tt = null;

	}

	add( body, ignore = [] ){

		let self = this;

		let delay = 0;

		if( body.name.search('_debris_') !== -1 ) delay = 1000;

		setTimeout( ()=>{ 

			self.motor.addCollision({ name:body.name, ignore:body.ignore });
			body.addEventListener( 'collision', (event) => { 
				let d = event.data;
				if(d.hit === 1) self.makeBreak( d.from, d.point, d.normal, d.impulse, d.v1 );
			});

		}, delay );

		

	}

	makeBreak ( name, pos, normal, impulse, v ) {

		let mesh = this.motor.byName( name );

		if ( !mesh ) return;
		if ( !mesh.breakable ) return;

		let breakOption = mesh.breakOption;

		const intern = breakOption[4] !== undefined ? breakOption[4] : true;
		//let imp = this.tmpI.fromArray( impulse ).length();

		//console.log( name, impulse )

		// not enoputh impulse to break
		if ( impulse < breakOption[ 0 ] ) return;

		// remove contact ??
		//this.motor.remove( 'cc_' + name )
		this.motor.removeCollision( name );
		this.motor.remove( name );

		
		const size = new Vector3();
		mesh.geometry.boundingBox.getSize( size );
		const baseSize = size.length();

		


		//let parentMatrix = mesh.matrix.clone().invert()

		//let debris = this.convexBreaker.subdivideByImpact( mesh, this.tpos.fromArray(pos), this.tnormal.fromArray(normal), breakOption[ 1 ], breakOption[ 2 ] );

		//                                                                                              maxRadialIterations, maxRandomIterations
		let fragment = K$2( mesh, this.tpos.fromArray(pos), this.tnormal.fromArray(normal), breakOption[ 1 ], breakOption[ 2 ], intern );
		let debris = tt( fragment, mesh, this.interneMat, intern, 0 );

		//console.log( debris.length )

		if(debris.length<1) return

		// add debris
		let list = [];
		let i = debris.length, n = 0, m, nv, ratio;
		let herit, breako;
		let ignore = [...mesh.ignore];

		while ( i -- ){ 

			m = debris[ n ];
			nv = m.geometry.attributes.position.count;// physx can't use lese that 4 vertex
			ratio = m.sizer/baseSize;

			herit = {};
			breako = [...breakOption];
			// remove one level if big enouth
			breako[3] = breako[3]-1;
			if(ratio < 0.2) breako[3] = 0;
			//else ;

			if( m.sizer > 0.02 && nv > 6) {
				this.nDebris ++;
				herit.name = name+'_debris_'+n;
				herit.mass = mesh.mass * ratio;
				list.push( this.addDebris( m, breako, herit ) );
				ignore.push(herit.name);
			}
			n++;
		}

		// disabler self collision
		i = list.length;
		while ( i -- ){
			list[i]['ignore'] = ignore;
		}

        // remove original object and add debrit
        //this.motor.remove( name, true )
        //this.tt = setTimeout( ()=>{
        	//this.motor.remove( name )
		this.motor.add( list );

		//this.tt = setTimeout( ()=>{ this.activeSubCollider(list) }, 1000 )
		

	}

	addDebris ( mesh, breakOption, heritage ) {

		let breakable = breakOption[ 3 ] > 0 ? true : false;

		//let name = heritage.basename +'_debris_' + (this.nDebris++)

		let deb = {

			...heritage,

			//name: name,
			type: 'convex',
			shape: mesh.geometry,
			material: mesh.material, //
			//material: breakable ? mesh.material : 'debug',
			//size:[1,1,1],
			pos: mesh.position.toArray(),
			quat: mesh.quaternion.toArray(),
			breakable: breakable,
			breakOption: breakOption,

		};

		//console.log(breakOption)

		//this.nDebris++
		//if( this.nDebris>this.maxDebris ) this.nDebris = 0

		return deb

	}

}

class AutoRagdoll {
	
	constructor( o = {}, motor ){

		this.motor = motor;
		this.utils = this.motor.utils;

		this.id = 0;
		this.type = 'autoRagdoll';
		this.name = o.name || this.type+this.id++;

		let b = this.utils.byName( this.name );
		if( b ) this.utils.remove( b );

		//this.isAutoRagdoll = true;

		this._mode = o.mode || 'follow';
		this._size = o.size || 1;
		this._debug = o.debug || false;

		const model = SkeletonUtils.clone( o.model );
		model.scale.set(1,1,1).multiplyScalar( this._size );
		if(o.pos) model.position.fromArray(o.pos);

		model.raycast = function (){ return };
		model.name = this.name;
		//model.frustumCulled = false;

		let bones;

		model.traverse( ( child ) => {
			if ( child.isMesh ){
				child.frustumCulled = false;
			}
			if ( child.isSkinnedMesh ){
				child.raycast = function (){ return };
				child.frustumCulled = false;
				child.matrixAutoUpdate = false;
				child.receiveShadow = true;
				child.castShadow = true;
				if( o.material ) child.material = o.material;
				child.skeleton.resetScalling();
				bones = child.skeleton.bones;
			}
		});

		let mass = o.mass || null;
		
		this.skeletonBody = new SkeletonBody( this.motor, model.name, model, bones, mass, o.option );

		this.debug = this._debug;
		this.mode = this._mode;

		/*this.skeletonBody.addEventListener ( 'start', function ( event ) {
			console.log( event.message );
		});*/



		/* 
		// basic three helper
		let helper = new SkeletonHelper( m );
		helper.raycast = function (){ return }
        helper.matrix = m.matrix;
        root.scene.add( helper );
        */

		model.add( this.skeletonBody );

		this.model = model;

		this.utils.add( this );

		return this;

	}

	getRealPosition() {
		let node = this.utils.byName( this.skeletonBody.nodes[0].name );
		return node.position;
	}

	dispose () {

		if( this.skeletonBody ) this.skeletonBody.dispose();
		if( this.model ) this.model.parent.remove( this.model );

	}

	//

	get position () { return model.position; }

	get size () { return this._size; }
	set size (value) {
		this._size = value;
		this.model.scale.set(1,1,1).multiplyScalar( this._size );
	}

	//

	get debug () { return this._debug; }
	set debug (value) {
		this._debug = value;
		this.skeletonBody.isVisible( this._debug );
	}

	get mode () { return this._mode; }
	set mode (value) {
		this._mode = value;
		this.skeletonBody.setMode( this._mode );
	}



}

class Debuger extends LineSegments {

	constructor( motor ) {

		super();

        this.rayCount = 0;

        this.ray = [];

        this.motor = motor;

		this.maxVertices = 10000;
		this.currentVertex = 0;

		this.geometry = new BufferGeometry();
		this.geometry.setAttribute( 'position', new Float32BufferAttribute( this.maxVertices * 3 , 3) );
		this.geometry.setAttribute( 'color', new Float32BufferAttribute(  this.maxVertices * 3 , 3) );

		this.positions = this.geometry.attributes.position.array;
		this.colors = this.geometry.attributes.color.array;

		this.material = new LineBasicMaterial({ vertexColors:true, toneMapped:false, depthTest:false, depthWrite:false });
        this.material.transparent = true; this.renderOrder = 30000;
		this.frustumCulled = false;

	}

    DrawRay( a, b, c ){

        c = new Color(c);

        let i = this.currentVertex;
        let n = i * 3;
        this.positions[n] = a.x;
        this.positions[n + 1] = a.y;
        this.positions[n + 2] = a.z;
        this.colors[n] = c.r;
        this.colors[n + 1] = c.g;
        this.colors[n + 2] = c.b;

        i++;
        n = i * 3;
        this.positions[n] = a.x + b.x;
        this.positions[n + 1] = a.y + b.y;
        this.positions[n + 2] = a.z + b.z;
        this.colors[n] = c.r;
        this.colors[n + 1] = c.g;
        this.colors[n + 2] = c.b;
        this.currentVertex += 2;

    }

	collapseBuffer () {

        let i = this.maxVertices;
        let min = this.currentVertex;
        let n = 0;
        while(i>=min){
            n = i * 3;
            this.positions[n] = 0;
            this.positions[n+1] = 0;
            this.positions[n+2] = 0;
            this.colors[n] = 0;
            this.colors[n+1] = 0;
            this.colors[n+2] = 0;
            i--;
        }
    }

    insertLine (a, b, c) {
        
        let i = this.currentVertex;
        let n = i * 3;
        this.positions[n] = a.x;
        this.positions[n + 1] = a.y;
        this.positions[n + 2] = a.z;
        this.colors[n] = c.r;
        this.colors[n + 1] = c.g;
        this.colors[n + 2] = c.b;

        i++;
        n = i * 3;
        this.positions[n] = b.x;
        this.positions[n + 1] = b.y;
        this.positions[n + 2] = b.z;
        this.colors[n] = c.r;
        this.colors[n + 1] = c.g;
        this.colors[n + 2] = c.b;
        this.currentVertex += 2;

    }

    draw() {

        /*let i = this.ray.length, r;
        while(i--){
            r = this.ray[i]
            this.insertLine(r.a, r.b, r.c)
        }*/


    	this.collapseBuffer();
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;

        this.currentVertex = 0;

    }

    dispose() {

        this.parent.remove(this);
        this.material.dispose();
        this.geometry.dispose();

    }

}

const skyOption = {

    sunPosition: new Vector3(0.27, 1, 0.5),
    sunTop: new Vector3(0, .99, 0),
    saturation:1,
    noiseMap:null,

	//shadow:1.0,

	//sunIntensity:100,//1.26,
	//hemiIntensity:1,//2,//2.79,
	nightLuminosity:0.03,

	//HOUR:12,
	//AZIMUTH:0,

	cloud_size:0.29,
	cloud_covr:0.1,//0.56,
	cloud_dens:0.4,
	cloud_dist:0.64,

	haze:0.1,
	mixRatio:0.76,

	SAMPLE:64,//128*0.5,
	STEP:4,//16

	cloudColor: new Color(0xfffff9).multiplyScalar(1),
	skyColor: new Color(0x425876),
	fogColor: new Color(0xabb5c0),
    groundColor: new Color(0x808080),
    sunColor: new Color(0xffffff).multiplyScalar(3),

};

const SkyShader = {
	defines:{
		'USE_NOISE_MAP' : false,
	},
	uniforms: {
		lightdir: { value: skyOption.sunPosition },
        sunTop: { value:skyOption.sunTop },
        noiseMap: { value:skyOption.noiseMap },
        
        mixRatio: { value: skyOption.mixRatio },

		cloud_size: { value: skyOption.cloud_size },
        cloud_covr: { value: skyOption.cloud_covr },
        cloud_dens: { value: skyOption.cloud_dens },
        cloud_dist: { value: skyOption.cloud_dist },
        nightLuminosity: { value: skyOption.nightLuminosity },
        haze: { value: skyOption.haze },
        saturation:{ value: skyOption.saturation },
        
        SAMPLE:{ value: skyOption.SAMPLE },
        STEP:{ value: skyOption.STEP },
        fogy: { value: skyOption.fogy },
        t: { value: 1.0 },
        // extra color

        fogColor: { value: skyOption.fogColor },
        groundColor: { value: skyOption.groundColor },
        cloudColor: { value: skyOption.cloudColor },
        skyColor: { value: skyOption.skyColor },
        sunColor: { value: skyOption.sunColor },
	},
	vertexShader: /* glsl */ `
varying vec3 worldPosition;
void main()	{
	worldPosition = ( modelMatrix * vec4( position, 1.0 )).xyz;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`,
	fragmentShader: /* glsl */`
//precision highp float;
varying vec3 worldPosition;

uniform vec3 fogColor;
uniform vec3 groundColor;
uniform vec3 cloudColor;
uniform vec3 skyColor;
uniform vec3 sunColor;

uniform float saturation;

uniform float hue;
uniform float mixRatio;
uniform float fogy;

uniform vec3 sunTop;

uniform sampler2D noiseMap;
uniform vec3 lightdir;

uniform float cloud_size;
uniform float cloud_covr;
uniform float cloud_dens;
uniform float cloud_dist;

uniform float nightLuminosity;
uniform float haze;
uniform float t;

uniform int SAMPLE;
uniform int STEP;

//const float c = 6.36e6;
//const float d = 6.38e6;
const float c = 6.407e6;
const float d = 6.416e6;

//const float g = 0.76; // mix ratio
//const float h = g*g;
const float icc = 1.0/8e3;
const float jcc = 1.0/1200.0;
const float pi = 3.141592653589793;

const vec3 vm = vec3( 0,-c,0 );
//const vec3 vn = vec3( 2.1e-5 );
//const vec3 vo = vec3( 5.8e-6, 1.35e-5, 3.31e-5 );

//const vec3 vn = vec3( 0.000021 );
//const vec3 vo = vec3( 0.0000058, 0.0000135, 0.0000331 );// sky base color

//const vec3 vo = vec3( 0.000021 );// sky base color


#ifdef USE_NOISE_MAP

float noise( in vec3 x ){
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    vec2 uv = (p.xy+vec2(37.0,17.0)*p.z) + f.xy;
    vec2 rg = texture2D( noiseMap, (uv+0.5)/256.0, -16.0 ).yx;
    return mix( rg.x, rg.y, f.z );
}

#else

float hash( float n ) { return fract(sin(n)*753.5453123); }
float noise( in vec3 x ){
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f*f*(3.0-2.0*f);
    float n = p.x + p.y*157.0 + 113.0*p.z;
    return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                   mix( hash(n+157.0), hash(n+158.0),f.x),f.y),
               mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                   mix( hash(n+270.0), hash(n+271.0),f.x),f.y),f.z);
}

#endif

float NOISE( vec3 r )
{
	r.xz += t;
	r *= 0.5;
	float s;
	s = 0.5 * noise(r);
	r = r * 2.52;
	s += 0.25 * noise(r);
	r = r * 2.53;
	s += 0.125 * noise(r);
	r = r * 2.51;
	s += 0.0625 * noise(r);
	r = r * 2.53;
	s += 0.03125 * noise(r);
	r = r * 2.52;
	s += 0.015625 * noise(r);
	return s;
}

float MakeNoise( vec3 r )
{
	float s,tt;
	s = NOISE( r * 2e-4 * ( 1.0 - cloud_size ) );
	tt = ( 1.0 - cloud_covr ) * 0.5 + 0.2;
	s = smoothstep( tt, tt+.2 , s );
	s *= 0.5*(cloud_dens*100.0);
	return s;
}

void clouds( in vec3 r, out vec3 u )
{
	float v,w;
	v = length( r-vm ) - c;
	w = 0.0;
	if( 5e3 < v && v < 1e4 ) w = MakeNoise( r ) * (sin( pi*(v-5e3)/5e3 ));
	u = vec3( exp(-v*icc), exp(-v*jcc), w );
}

float ca( in vec3 r, in vec3 s, in float t )
{
	vec3 u = r - vm;
	float v,w,x,y,z,A;
	v = dot(u,s);
	w = dot(u,u)-t*t;
	x = v*v-w;
	if( x < 0.0 ) return -1.0;
	y = sqrt(x);
	z = -v-y;
	A = -v+y;
	return z >= 0.0 ? z : A;
}

vec3 czm_saturation(vec3 rgb, float adjustment)
{
    vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
}


vec3 makeSky( in vec3 lightpos, in vec3 r, in vec3 world, out float mask )
{

	vec3 vn = vec3( 0.000021 );
	vec3 vo = skyColor;
	vo *= 0.00005;

	float u,v,w,x,y,z,m, M, N, S, H, F;
	vec3 p = lightpos;
	u = ca(r,world,d);
	v = dot(world,p);
	w = 1.0+v*v;

	float gg = mixRatio;
	float hh = gg*gg;

	x = 0.0596831*w;
	y = 0.0253662*(1.0-hh)*w/((2.0+hh)*pow(abs(1.0+hh-2.0*gg*v),1.5));
	z = 50.*pow(abs(1.+dot(world,-p)),2.0)*dot(vec3(0.,1.,0.),p)*(1.0-cloud_covr)*(1.0-min(fogy,1.0));

	m = 0.0;
	vec3 D,E, CB, CM, BB, BM, SX;

	F = u / float( SAMPLE );

	BB = vec3(0.0);
	BM = vec3(0.0);

	float count = 0.0;

	for( int G=0; G<SAMPLE; ++G ){

		H = float(G)*F;
		vec3 I = r + world * H;
		//CB = vec3(1.0);
		//BB = vec3(0.0);
		clouds( I, CB );
		CB += fogy;// add fog
		CB.y += CB.z;// add clound
		CB.xy *= F;
		BB += CB;

		M = ca(I,p,d);

		if( M > 0.0 ){

			N = M/float(STEP);
			BM = vec3(0.0);

			for( int R=0; R<STEP; ++R ){

				S = float(R)*N;
				vec3 T=I+p*S;
				clouds( T, CM );
				CM += fogy;// add fog
				CM.y += CM.z;// add clound
				BM += CM * N;

			}

			SX = exp(-(vo*(BM.x+BB.x)+vn*(BM.y+BB.y)* cloud_dist));

			m += CB.z;
			count += 1.0;
			D += SX*CB.x;
			E += (SX*CB.y)+z*m;
		}
		else return vec3(0.0);
	}
	//mask = m * 0.0125;
	//mask = m / count;
	mask = m / float( SAMPLE );

	return ((D * vo * x ) + (E * vn * y * sunColor)) * 15.0;
}


void main()
{
	vec3 light = normalize( lightdir );
	vec3 world = normalize( worldPosition.xyz );

	float uvy = acos( world.y ) / pi;

	//float luma = smoothstep(0.0, 4.0,  1.0-(abs(world.y)/0.8) );
    //float mid = smoothstep(0.0, 1.0,  abs(world.y) < haze ? 1.0-(abs(world.y)/(haze*1.0)) : 0.0 );
    //mid *= nightLuminosity;//pow(  mid, 1.0 );

    // ground reapeat sky
	//if( world.y < -0.15) world.y = -0.15+((-world.y-0.15)*0.1);
	if( world.y < 0.0) world.y = -world.y;

	float high = smoothstep(1.0, 0.0, (uvy)*10000.0);
	float top =  smoothstep(1.0, 0.0, (uvy-0.5)*50.0);
	float middle = uvy > 0.5 ? high : smoothstep(0.0, 1.0, (0.5-uvy)*((1.0-haze)*100.0));

	float middle2 = uvy > 0.5 ? smoothstep(0.0, 1.0, (0.5-uvy)*((1.0-haze)*100.0)) : smoothstep(0.0, 1.0, (0.5-uvy)*((1.0-haze)*100.0));

	vec3 s = sunTop;
	float lm = dot( s, light );
	float day = clamp((lm*4.0), 0.0, (1.0-nightLuminosity) )+nightLuminosity;

	if(lm <= 0.0) light *= -1.0;
	light.y = abs(light.y);

	//if(light.y < 0.1) light.y = 0.1;
	light.y = clamp(light.y, 0.1, 1.0 );
	//light.y += 0.5;

	float mask = 0.0;

	vec3 sky = makeSky( light, s, world, mask );
	mask = clamp(mask, 0.0, 1.0 );
	sky = mix( sky, cloudColor, mask ); //apply cloud color
	

	//sky = mix( sky, groundColor, 1.0-middle ); // apply ground color
	sky = mix( sky, fogColor, 1.0-middle2 ); // apply fog color
	
    //float dd = clamp(day+(nightLuminosity*0.5), 0.0, 1.0);
	//luma *= 1.0-dd;
	//clear = mix( clear, clear+skyColor, luma ); // extra luminosity on night

	sky *= day;
	//sky = czm_saturation(sky, saturation);
    //sky = clamp(sky, 0.0, 1.0 );


 	gl_FragColor = vec4( sky, 1.0 );

}
`,
	depthWrite: false,
	depthTest: false,
	side:1,
	toneMapped: false,
	fog:false,
};

const torad$1 = Math.PI / 180;

class Envmap {

	constructor( o = {} ) {

		this.mainScene = o.scene;
		this.renderer = o.renderer;

		this.usePrem = o.usePmrem !== undefined ? o.usePmrem : false;
		this.useBackground = o.useBackground !== undefined ? o.useBackground : true;
		this.envBlur = o.envBlur !== undefined ? o.envBlur : 0;
		this.callback = o.callback || null;
		this.isSky = false;

		 if( this.usePrem ){
	        this.pmremGenerator = new PMREMGenerator( this.renderer );
	        this.pmremGenerator.compileEquirectangularShader();
	    }

		if(o.cube) this.initCubeEnv( o );
		if(o.url) this.load( o.url );
    
	}

	initCubeEnv( o = {} ) {

		this.isCubeEnv = true;
		this._quality = o.quality || 1;

		this.scene = new Scene();
		if(o.color) this.scene.background = new Color(o.color); 
		this.target = new WebGLCubeRenderTarget( 256*this._quality, {
			//magFilter: LinearFilter,
            minFilter: LinearFilter,
            type: HalfFloatType,
            //format: RGBAFormat,
            //colorSpace: LinearSRGBColorSpace,
            colorSpace: SRGBColorSpace, 
            //generateMipmaps: false,
            //depthBuffer: false,
            //generateMipmaps:true,
            anisotropy:1,
        });

        this.camera = new CubeCamera( o.near || 0.1, o.far || 100, this.target );
		this.mainScene.environment = this.target.texture;
		if( this.useBackground ) this.mainScene.background = this.target.texture;

	}

	addSky(){

		let g = new IcosahedronGeometry( 20, 1 );
		const mat = new ShaderMaterial( SkyShader );
		this.sky = new Mesh( g, mat );
		this.scene.add(this.sky);
		this.render();
		this.isSky = true;
		
	}

	getSkyOtion(){

		if(!this.isSky) return;
		return skyOption;

	}

	setSkyOtion( o ){

		if(!this.isSky) return;
		let u = this.sky.material.uniforms;
		for(let k in o){
			if(u[k]) u[k].value = o[k];
		}
	
	    if(this.timeout) clearTimeout(this.timeout);
	    this.timeout = setTimeout( this.render.bind(this), 0 );

	}

	render() {

		if(!this.isCubeEnv) return
		const renderer = this.renderer;
        const lastToneMapping = renderer.toneMapping;
        //const lastToneExposure = renderer.toneMappingExposure;
        renderer.toneMapping = NoToneMapping;
        //renderer.toneMappingExposure = 1.0;

		this.camera.update( renderer, this.scene );
        renderer.toneMapping = lastToneMapping;
        //renderer.toneMappingExposure = lastToneExposure;

	}

	load ( url ) {

		this.name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
	    this.type = url.substring( url.lastIndexOf('.')+1 ).toLowerCase();

		this.loader = null;

		switch( this.type ){
			case 'hdr': 
			    this.loader = new HDRLoader().load( url, this.end.bind(this), null, this.bug.bind(this) );
			break;
			case 'exr':
			    this.loader = new EXRLoader().load( url, this.end.bind(this), null, this.bug.bind(this) );
			break;
			/*case 'jpg': 
			    this.loader = new HDRJPGLoader( this.renderer ).load( url, this.end.bind(this), null, this.bug.bind(this) );
			break;*/
		}

	}

	bug () {

		console.log( 'Envmap is not find :', this.name );
		if( this.callback ) this.callback();

	}

	end () {

		let env;

		switch( this.type ){
			case 'hdr': case 'exr':
			    env = this.loader;
			    env.mapping = EquirectangularReflectionMapping;
			break;
			case 'jpg':
			    env = this.loader.renderTarget.texture;
			    env.mapping = EquirectangularReflectionMapping;
			    
			break;
		}

		if( this.usePrem ) {
            
            env = this.pmremGenerator.fromEquirectangular( env ).texture;
            this.pmremGenerator.dispose();

        }

        env.needsUpdate = true;

        const scene = this.isCubeEnv ? this.scene : this.mainScene;

        
		if( this.isCubeEnv || this.useBackground ) scene.background = env;
		if( this.envBlur ) scene.backgroundBlurriness = this.envBlur;
	    scene.environment = env;
	    
        this.loader.dispose();

		if( this.callback ) this.callback();

	}


	get intensity() {
        return this.mainScene.environmentIntensity;
    }
    set intensity(value) {
        this.mainScene.environmentIntensity = value;
    }

    get bgIntensity() {
        return this.mainScene.backgroundIntensity;
    }
    set bgIntensity(value) {
        this.mainScene.backgroundIntensity = value;
    }

    get blur() {
        return this.mainScene.backgroundBlurriness;
    }
    set blur(value) {
        this.mainScene.backgroundBlurriness = value;
    }

    rotate( x=0,y=0,z=0 ) {

        if(x!==0) x *= torad$1;
        if(y!==0) y *= torad$1;
        if(z!==0) z *= torad$1;

        this.mainScene.environmentRotation.set(x,y,z);
        this.mainScene.backgroundRotation.set(x,y,z);

    }

}

const M$1=1.25,O$1=65535,S=Math.pow(2,-24),R$1=Symbol("SKIP_GENERATION");function P$1(a){return function(a){return a.index?a.index.count:a.attributes.position.count}(a)/3}function q$1(a,b){if(!a.index){const e=a.attributes.position.count,c=function(a,b=ArrayBuffer){return a>65535?new Uint32Array(new b(4*a)):new Uint16Array(new b(2*a))}(e,b.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer);a.setIndex(new BufferAttribute(c,1));for(let a=0;a<e;a++)c[a]=a;}}function U(a,b){const e=P$1(a),c=b||a.drawRange,t=c.start/3,d=(c.start+c.count)/3,n=Math.max(0,t),i=Math.min(e,d)-n;return [{offset:Math.floor(n),count:Math.floor(i)}]}function K$1(a,b){if(!a.groups||!a.groups.length)return U(a,b);const e=[],c=new Set,t=b||a.drawRange,d=t.start/3,n=(t.start+t.count)/3;for(const b of a.groups){const a=b.start/3,e=(b.start+b.count)/3;c.add(Math.max(d,a)),c.add(Math.min(n,e));}const i=Array.from(c.values()).sort(((a,b)=>a-b));for(let a=0;a<i.length-1;a++){const b=i[a],c=i[a+1];e.push({offset:Math.floor(b),count:Math.floor(c-b)});}return e}function J$1(a,b,e,c,t){let d=1/0,n=1/0,i=1/0,r=-1/0,f=-1/0,o=-1/0,h=1/0,s=1/0,l=1/0,g=-1/0,u=-1/0,m=-1/0;for(let c=6*b,t=6*(b+e);c<t;c+=6){const b=a[c+0],e=a[c+1],t=b-e,p=b+e;t<d&&(d=t),p>r&&(r=p),b<h&&(h=b),b>g&&(g=b);const j=a[c+2],k=a[c+3],y=j-k,x=j+k;y<n&&(n=y),x>f&&(f=x),j<s&&(s=j),j>u&&(u=j);const w=a[c+4],v=a[c+5],E=w-v,A=w+v;E<i&&(i=E),A>o&&(o=A),w<l&&(l=w),w>m&&(m=w);}c[0]=d,c[1]=n,c[2]=i,c[3]=r,c[4]=f,c[5]=o,t[0]=h,t[1]=s,t[2]=l,t[3]=g,t[4]=u,t[5]=m;}function N(a,b,e){return e.min.x=b[a],e.min.y=b[a+1],e.min.z=b[a+2],e.max.x=b[a+3],e.max.y=b[a+4],e.max.z=b[a+5],e}function T(a){let b=-1,e=-1/0;for(let c=0;c<3;c++){const t=a[c+3]-a[c];t>e&&(e=t,b=c);}return b}function G(a,b){b.set(a);}function D$1(a,b,e){let c,t;for(let d=0;d<3;d++){const n=d+3;c=a[d],t=b[d],e[d]=c<t?c:t,c=a[n],t=b[n],e[n]=c>t?c:t;}}function C$1(a,b,e){for(let c=0;c<3;c++){const t=b[a+2*c],d=b[a+2*c+1],n=t-d,i=t+d;n<e[c]&&(e[c]=n),i>e[c+3]&&(e[c+3]=i);}}function L(a){const b=a[3]-a[0],e=a[4]-a[1],c=a[5]-a[2];return 2*(b*e+e*c+c*b)}const W$1=32,V=(a,b)=>a.candidate-b.candidate,Q=new Array(W$1).fill().map((()=>({count:0,bounds:new Float32Array(6),rightCacheBounds:new Float32Array(6),leftCacheBounds:new Float32Array(6),candidate:0}))),X=new Float32Array(6);class Y{constructor(){this.boundingData=new Float32Array(6);}}function _(a,b,e,c,t,d){let n=c,i=c+t-1;const r=d.pos,f=2*d.axis;for(;;){for(;n<=i&&e[6*n+f]<r;)n++;for(;n<=i&&e[6*i+f]>=r;)i--;if(!(n<i))return n;for(let a=0;a<3;a++){let e=b[3*n+a];b[3*n+a]=b[3*i+a],b[3*i+a]=e;}for(let a=0;a<6;a++){let b=e[6*n+a];e[6*n+a]=e[6*i+a],e[6*i+a]=b;}n++,i--;}}function Z(a,b,e,c,t,d){let n=c,i=c+t-1;const r=d.pos,f=2*d.axis;for(;;){for(;n<=i&&e[6*n+f]<r;)n++;for(;n<=i&&e[6*i+f]>=r;)i--;if(!(n<i))return n;{let b=a[n];a[n]=a[i],a[i]=b;for(let a=0;a<6;a++){let b=e[6*n+a];e[6*n+a]=e[6*i+a],e[6*i+a]=b;}n++,i--;}}}function $(a,b){return 65535===b[a+15]}function aa(a,b){return b[a+6]}function ba(a,b){return b[a+14]}function ea(a){return a+8}function ca(a,b){return b[a+6]}function ta(a,b){return b[a+7]}let da,na,ia,ra;const fa=Math.pow(2,32);function oa(a){return "count"in a?1:1+oa(a.left)+oa(a.right)}function ha(a,b,e){return da=new Float32Array(e),na=new Uint32Array(e),ia=new Uint16Array(e),ra=new Uint8Array(e),sa(a,b)}function sa(a,b){const e=a/4,c=a/2,t="count"in b,d=b.boundingData;for(let a=0;a<6;a++)da[e+a]=d[a];if(t){if(b.buffer){const c=b.buffer;ra.set(new Uint8Array(c),a);for(let b=a,t=a+c.byteLength;b<t;b+=32){$(b/2,ia)||(na[b/4+6]+=e);}return a+c.byteLength}{const t=b.offset,d=b.count;return na[e+6]=t,ia[c+14]=d,ia[c+15]=O$1,a+32}}{const c=b.left,t=b.right,d=b.splitAxis;let n;if(n=sa(a+32,c),n/4>fa)throw new Error("MeshBVH: Cannot store child pointer greater than 32 bits.");return na[e+6]=n/4,n=sa(n,t),na[e+7]=d,n}}function la(a,b,e,c,t){const{maxDepth:d,verbose:n,maxLeafTris:i,strategy:r,onProgress:f,indirect:o}=t,h=a._indirectBuffer,s=a.geometry,l=s.index?s.index.array:null,g=o?Z:_,u=P$1(s),m=new Float32Array(6);let p=false;const j=new Y;return J$1(b,e,c,j.boundingData,m),function a(e,c,t,f=null,o=0){!p&&o>=d&&(p=true,n&&(console.warn(`MeshBVH: Max depth of ${d} reached when generating BVH. Consider increasing maxDepth.`),console.warn(s)));if(t<=i||o>=d)return k(c+t),e.offset=c,e.count=t,e;const u=function(a,b,e,c,t,d){let n=-1,i=0;if(0===d)n=T(b),-1!==n&&(i=(b[n]+b[n+3])/2);else if(1===d)n=T(a),-1!==n&&(i=function(a,b,e,c){let t=0;for(let d=b,n=b+e;d<n;d++)t+=a[6*d+2*c];return t/e}(e,c,t,n));else if(2===d){const d=L(a);let r=M$1*t;const f=6*c,o=6*(c+t);for(let a=0;a<3;a++){const c=b[a],h=(b[a+3]-c)/W$1;if(t<8){const b=[...Q];b.length=t;let c=0;for(let t=f;t<o;t+=6,c++){const d=b[c];d.candidate=e[t+2*a],d.count=0;const{bounds:n,leftCacheBounds:i,rightCacheBounds:r}=d;for(let a=0;a<3;a++)r[a]=1/0,r[a+3]=-1/0,i[a]=1/0,i[a+3]=-1/0,n[a]=1/0,n[a+3]=-1/0;C$1(t,e,n);}b.sort(V);let h=t;for(let a=0;a<h;a++){const e=b[a];for(;a+1<h&&b[a+1].candidate===e.candidate;)b.splice(a+1,1),h--;}for(let c=f;c<o;c+=6){const t=e[c+2*a];for(let a=0;a<h;a++){const d=b[a];t>=d.candidate?C$1(c,e,d.rightCacheBounds):(C$1(c,e,d.leftCacheBounds),d.count++);}}for(let e=0;e<h;e++){const c=b[e],f=c.count,o=t-c.count,h=c.leftCacheBounds,s=c.rightCacheBounds;let l=0;0!==f&&(l=L(h)/d);let g=0;0!==o&&(g=L(s)/d);const u=1+M$1*(l*f+g*o);u<r&&(n=a,r=u,i=c.candidate);}}else {for(let a=0;a<W$1;a++){const b=Q[a];b.count=0,b.candidate=c+h+a*h;const e=b.bounds;for(let a=0;a<3;a++)e[a]=1/0,e[a+3]=-1/0;}for(let b=f;b<o;b+=6){let t=~~((e[b+2*a]-c)/h);t>=W$1&&(t=31);const d=Q[t];d.count++,C$1(b,e,d.bounds);}const b=Q[31];G(b.bounds,b.rightCacheBounds);for(let a=30;a>=0;a--){const b=Q[a],e=Q[a+1];D$1(b.bounds,e.rightCacheBounds,b.rightCacheBounds);}let s=0;for(let b=0;b<31;b++){const e=Q[b],c=e.count,f=e.bounds,o=Q[b+1].rightCacheBounds;0!==c&&(0===s?G(f,X):D$1(f,X,X)),s+=c;let h=0,l=0;0!==s&&(h=L(X)/d);const g=t-s;0!==g&&(l=L(o)/d);const u=1+M$1*(h*s+l*g);u<r&&(n=a,r=u,i=e.candidate);}}}}else console.warn(`MeshBVH: Invalid build strategy value ${d} used.`);return {axis:n,pos:i}}(e.boundingData,f,b,c,t,r);if(-1===u.axis)return k(c+t),e.offset=c,e.count=t,e;const j=g(h,l,b,c,t,u);if(j===c||j===c+t)k(c+t),e.offset=c,e.count=t;else {e.splitAxis=u.axis;const d=new Y,n=c,i=j-c;e.left=d,J$1(b,n,i,d.boundingData,m),a(d,n,i,m,o+1);const r=new Y,f=j,h=t-i;e.right=r,J$1(b,f,h,r.boundingData,m),a(r,f,h,m,o+1);}return e}(j,e,c,m),j;function k(a){f&&f(a/u);}}function ga(a,b){const e=a.geometry;b.indirect&&(a._indirectBuffer=function(a,b){const e=(a.index?a.index.count:a.attributes.position.count)/3,c=e>65536,t=c?4:2,d=b?new SharedArrayBuffer(e*t):new ArrayBuffer(e*t),n=c?new Uint32Array(d):new Uint16Array(d);for(let a=0,b=n.length;a<b;a++)n[a]=a;return n}(e,b.useSharedArrayBuffer),function(a,b){const e=P$1(a),c=K$1(a,b).sort(((a,b)=>a.offset-b.offset)),t=c[c.length-1];t.count=Math.min(e-t.offset,t.count);let d=0;return c.forEach((({count:a})=>d+=a)),e!==d}(e,b.range)&&!b.verbose&&console.warn('MeshBVH: Provided geometry contains groups or a range that do not fully span the vertex contents while using the "indirect" option. BVH may incorrectly report intersections on unrendered portions of the geometry.')),a._indirectBuffer||q$1(e,b);const c=b.useSharedArrayBuffer?SharedArrayBuffer:ArrayBuffer,t=function(a,b=null,e=null,c=null){const t=a.attributes.position,d=a.index?a.index.array:null,n=P$1(a),i=t.normalized;let r;null===b?(r=new Float32Array(6*n),e=0,c=n):(r=b,e=e||0,c=c||n);const f=t.array,o=t.offset||0;let h=3;t.isInterleavedBufferAttribute&&(h=t.data.stride);const s=["getX","getY","getZ"];for(let a=e;a<e+c;a++){const b=3*a,e=6*a;let c=b+0,n=b+1,l=b+2;d&&(c=d[c],n=d[n],l=d[l]),i||(c=c*h+o,n=n*h+o,l=l*h+o);for(let a=0;a<3;a++){let b,d,o;i?(b=t[s[a]](c),d=t[s[a]](n),o=t[s[a]](l)):(b=f[c+a],d=f[n+a],o=f[l+a]);let h=b;d<h&&(h=d),o<h&&(h=o);let g=b;d>g&&(g=d),o>g&&(g=o);const u=(g-h)/2,m=2*a;r[e+m+0]=h+u,r[e+m+1]=u+(Math.abs(h)+u)*S;}}return r}(e),d=b.indirect?U(e,b.range):K$1(e,b.range);a._roots=d.map((e=>{const d=la(a,t,e.offset,e.count,b),n=oa(d),i=new c(32*n);return ha(0,d,i),i}));}class ua{constructor(){this.min=1/0,this.max=-1/0;}setFromPointsField(a,b){let e=1/0,c=-1/0;for(let t=0,d=a.length;t<d;t++){const d=a[t][b];e=d<e?d:e,c=d>c?d:c;}this.min=e,this.max=c;}setFromPoints(a,b){let e=1/0,c=-1/0;for(let t=0,d=b.length;t<d;t++){const d=b[t],n=a.dot(d);e=n<e?n:e,c=n>c?n:c;}this.min=e,this.max=c;}isSeparated(a){return this.min>a.max||a.min>this.max}}ua.prototype.setFromBox=function(){const b=new Vector3;return function(a,e){const c=e.min,t=e.max;let d=1/0,n=-1/0;for(let e=0;e<=1;e++)for(let i=0;i<=1;i++)for(let r=0;r<=1;r++){b.x=c.x*e+t.x*(1-e),b.y=c.y*i+t.y*(1-i),b.z=c.z*r+t.z*(1-r);const f=a.dot(b);d=Math.min(f,d),n=Math.max(f,n);}this.min=d,this.max=n;}}();const ma=function(){const b=new Vector3,e=new Vector3,c=new Vector3;return function(a,t,d){const n=a.start,i=b,r=t.start,f=e;c.subVectors(n,r),b.subVectors(a.end,a.start),e.subVectors(t.end,t.start);const o=c.dot(f),h=f.dot(i),s=f.dot(f),l=c.dot(i),g=i.dot(i)*s-h*h;let u,m;u=0!==g?(o*h-l*s)/g:0,m=(o+u*h)/s,d.x=u,d.y=m;}}(),pa=function(){const e=new Vector2,c=new Vector3,t=new Vector3;return function(a,b,d,n){ma(a,b,e);let i=e.x,r=e.y;if(i>=0&&i<=1&&r>=0&&r<=1)return a.at(i,d),void b.at(r,n);if(i>=0&&i<=1)return r<0?b.at(0,n):b.at(1,n),void a.closestPointToPoint(n,true,d);if(r>=0&&r<=1)return i<0?a.at(0,d):a.at(1,d),void b.closestPointToPoint(d,true,n);{let e,f;e=i<0?a.start:a.end,f=r<0?b.start:b.end;const o=c,h=t;return a.closestPointToPoint(f,true,c),b.closestPointToPoint(e,true,t),o.distanceToSquared(f)<=h.distanceToSquared(e)?(d.copy(o),void n.copy(f)):(d.copy(e),void n.copy(h))}}}(),ja=function(){const b=new Vector3,t=new Vector3,d=new Plane,n=new Line3;return function(a,e){const{radius:c,center:i}=a,{a:r,b:f,c:o}=e;n.start=r,n.end=f;if(n.closestPointToPoint(i,true,b).distanceTo(i)<=c)return  true;n.start=r,n.end=o;if(n.closestPointToPoint(i,true,b).distanceTo(i)<=c)return  true;n.start=f,n.end=o;if(n.closestPointToPoint(i,true,b).distanceTo(i)<=c)return  true;const h=e.getPlane(d);if(Math.abs(h.distanceToPoint(i))<=c){const a=h.projectPoint(i,t);if(e.containsPoint(a))return  true}return  false}}();function ka(a){return Math.abs(a)<1e-15}class ya extends Triangle{constructor(...b){super(...b),this.isExtendedTriangle=true,this.satAxes=new Array(4).fill().map((()=>new Vector3)),this.satBounds=new Array(4).fill().map((()=>new ua)),this.points=[this.a,this.b,this.c],this.sphere=new Sphere,this.plane=new Plane,this.needsUpdate=true;}intersectsSphere(a){return ja(a,this)}update(){const a=this.a,b=this.b,e=this.c,c=this.points,t=this.satAxes,d=this.satBounds,n=t[0],i=d[0];this.getNormal(n),i.setFromPoints(n,c);const r=t[1],f=d[1];r.subVectors(a,b),f.setFromPoints(r,c);const o=t[2],h=d[2];o.subVectors(b,e),h.setFromPoints(o,c);const s=t[3],l=d[3];s.subVectors(e,a),l.setFromPoints(s,c),this.sphere.setFromPoints(this.points),this.plane.setFromNormalAndCoplanarPoint(n,a),this.needsUpdate=false;}}ya.prototype.closestPointToSegment=function(){const b=new Vector3,e=new Vector3,t=new Line3;return function(a,c=null,d=null){const{start:n,end:i}=a,r=this.points;let f,o=1/0;for(let n=0;n<3;n++){const i=(n+1)%3;t.start.copy(r[n]),t.end.copy(r[i]),pa(t,a,b,e),f=b.distanceToSquared(e),f<o&&(o=f,c&&c.copy(b),d&&d.copy(e));}return this.closestPointToPoint(n,b),f=n.distanceToSquared(b),f<o&&(o=f,c&&c.copy(b),d&&d.copy(n)),this.closestPointToPoint(i,b),f=i.distanceToSquared(b),f<o&&(o=f,c&&c.copy(b),d&&d.copy(i)),Math.sqrt(o)}}(),ya.prototype.intersectsTriangle=function(){const b=new ya,e=new Array(3),t=new Array(3),d=new ua,n=new ua,i=new Vector3,r=new Vector3,f=new Vector3,o=new Vector3,h=new Vector3,s=new Line3,l=new Line3,g=new Line3,u=new Vector3;function m(a,b,e){const c=a.points;let t=0,d=-1;for(let a=0;a<3;a++){const{start:n,end:i}=s;n.copy(c[a]),i.copy(c[(a+1)%3]),s.delta(r);const f=ka(b.distanceToPoint(n));if(ka(b.normal.dot(r))&&f){e.copy(s),t=2;break}const o=b.intersectLine(s,u);if(!o&&f&&u.copy(n),(o||f)&&!ka(u.distanceTo(i))){if(t<=1){(1===t?e.start:e.end).copy(u),f&&(d=t);}else if(t>=2){(1===d?e.start:e.end).copy(u),t=2;break}if(t++,2===t&&-1===d)break}}return t}return function(a,c=null,r=false){this.needsUpdate&&this.update(),a.isExtendedTriangle?a.needsUpdate&&a.update():(b.copy(a),b.update(),a=b);const s=this.plane,u=a.plane;if(Math.abs(s.normal.dot(u.normal))>1-1e-10){const b=this.satBounds,f=this.satAxes;t[0]=a.a,t[1]=a.b,t[2]=a.c;for(let a=0;a<4;a++){const e=b[a],c=f[a];if(d.setFromPoints(c,t),e.isSeparated(d))return  false}const o=a.satBounds,h=a.satAxes;e[0]=this.a,e[1]=this.b,e[2]=this.c;for(let a=0;a<4;a++){const b=o[a],c=h[a];if(d.setFromPoints(c,e),b.isSeparated(d))return  false}for(let a=0;a<4;a++){const b=f[a];for(let a=0;a<4;a++){const c=h[a];if(i.crossVectors(b,c),d.setFromPoints(i,e),n.setFromPoints(i,t),d.isSeparated(n))return  false}}return c&&(r||console.warn("ExtendedTriangle.intersectsTriangle: Triangles are coplanar which does not support an output edge. Setting edge to 0, 0, 0."),c.start.set(0,0,0),c.end.set(0,0,0)),true}{const b=m(this,u,l);if(1===b&&a.containsPoint(l.end))return c&&(c.start.copy(l.end),c.end.copy(l.end)),true;if(2!==b)return  false;const e=m(a,s,g);if(1===e&&this.containsPoint(g.end))return c&&(c.start.copy(g.end),c.end.copy(g.end)),true;if(2!==e)return  false;if(l.delta(f),g.delta(o),f.dot(o)<0){let a=g.start;g.start=g.end,g.end=a;}const t=l.start.dot(f),d=l.end.dot(f),n=g.start.dot(f),i=g.end.dot(f);return (t===i||n===d||d<n!==t<i)&&(c&&(h.subVectors(l.start,g.start),h.dot(f)>0?c.start.copy(l.start):c.start.copy(g.start),h.subVectors(l.end,g.end),h.dot(f)<0?c.end.copy(l.end):c.end.copy(g.end)),true)}}}(),ya.prototype.distanceToPoint=function(){const b=new Vector3;return function(a){return this.closestPointToPoint(a,b),a.distanceTo(b)}}(),ya.prototype.distanceToTriangle=function(){const b=new Vector3,e=new Vector3,t=["a","b","c"],d=new Line3,n=new Line3;return function(a,c=null,i=null){const r=c||i?d:null;if(this.intersectsTriangle(a,r))return (c||i)&&(c&&r.getCenter(c),i&&r.getCenter(i)),0;let f=1/0;for(let e=0;e<3;e++){let d;const n=t[e],r=a[n];this.closestPointToPoint(r,b),d=r.distanceToSquared(b),d<f&&(f=d,c&&c.copy(b),i&&i.copy(r));const o=this[n];a.closestPointToPoint(o,b),d=o.distanceToSquared(b),d<f&&(f=d,c&&c.copy(o),i&&i.copy(b));}for(let r=0;r<3;r++){const o=t[r],h=t[(r+1)%3];d.set(this[o],this[h]);for(let r=0;r<3;r++){const o=t[r],h=t[(r+1)%3];n.set(a[o],a[h]),pa(d,n,b,e);const s=b.distanceToSquared(e);s<f&&(f=s,c&&c.copy(b),i&&i.copy(e));}}return Math.sqrt(f)}}();class xa{constructor(b,e,c){this.isOrientedBox=true,this.min=new Vector3,this.max=new Vector3,this.matrix=new Matrix4,this.invMatrix=new Matrix4,this.points=new Array(8).fill().map((()=>new Vector3)),this.satAxes=new Array(3).fill().map((()=>new Vector3)),this.satBounds=new Array(3).fill().map((()=>new ua)),this.alignedSatBounds=new Array(3).fill().map((()=>new ua)),this.needsUpdate=false,b&&this.min.copy(b),e&&this.max.copy(e),c&&this.matrix.copy(c);}set(a,b,e){this.min.copy(a),this.max.copy(b),this.matrix.copy(e),this.needsUpdate=true;}copy(a){this.min.copy(a.min),this.max.copy(a.max),this.matrix.copy(a.matrix),this.needsUpdate=true;}}xa.prototype.update=function(){const a=this.matrix,b=this.min,e=this.max,c=this.points;for(let t=0;t<=1;t++)for(let d=0;d<=1;d++)for(let n=0;n<=1;n++){const i=c[1*t|2*d|4*n];i.x=t?e.x:b.x,i.y=d?e.y:b.y,i.z=n?e.z:b.z,i.applyMatrix4(a);}const t=this.satBounds,d=this.satAxes,n=c[0];for(let a=0;a<3;a++){const b=d[a],e=t[a],i=c[1<<a];b.subVectors(n,i),e.setFromPoints(b,c);}const i=this.alignedSatBounds;i[0].setFromPointsField(c,"x"),i[1].setFromPointsField(c,"y"),i[2].setFromPointsField(c,"z"),this.invMatrix.copy(this.matrix).invert(),this.needsUpdate=false;},xa.prototype.intersectsBox=function(){const a=new ua;return function(b){this.needsUpdate&&this.update();const e=b.min,c=b.max,t=this.satBounds,d=this.satAxes,n=this.alignedSatBounds;if(a.min=e.x,a.max=c.x,n[0].isSeparated(a))return  false;if(a.min=e.y,a.max=c.y,n[1].isSeparated(a))return  false;if(a.min=e.z,a.max=c.z,n[2].isSeparated(a))return  false;for(let e=0;e<3;e++){const c=d[e],n=t[e];if(a.setFromBox(c,b),n.isSeparated(a))return  false}return  true}}(),xa.prototype.intersectsTriangle=function(){const b=new ya,e=new Array(3),c=new ua,t=new ua,d=new Vector3;return function(a){this.needsUpdate&&this.update(),a.isExtendedTriangle?a.needsUpdate&&a.update():(b.copy(a),b.update(),a=b);const n=this.satBounds,i=this.satAxes;e[0]=a.a,e[1]=a.b,e[2]=a.c;for(let a=0;a<3;a++){const b=n[a],t=i[a];if(c.setFromPoints(t,e),b.isSeparated(c))return  false}const r=a.satBounds,f=a.satAxes,o=this.points;for(let a=0;a<3;a++){const b=r[a],e=f[a];if(c.setFromPoints(e,o),b.isSeparated(c))return  false}for(let a=0;a<3;a++){const b=i[a];for(let a=0;a<4;a++){const n=f[a];if(d.crossVectors(b,n),c.setFromPoints(d,e),t.setFromPoints(d,o),c.isSeparated(t))return  false}}return  true}}(),xa.prototype.closestPointToPoint=function(a,b){return this.needsUpdate&&this.update(),b.copy(a).applyMatrix4(this.invMatrix).clamp(this.min,this.max).applyMatrix4(this.matrix),b},xa.prototype.distanceToPoint=function(){const b=new Vector3;return function(a){return this.closestPointToPoint(a,b),a.distanceTo(b)}}(),xa.prototype.distanceToBox=function(){const b=["x","y","z"],e=new Array(12).fill().map((()=>new Line3)),t=new Array(12).fill().map((()=>new Line3)),d=new Vector3,n=new Vector3;return function(a,c=0,i=null,r=null){if(this.needsUpdate&&this.update(),this.intersectsBox(a))return (i||r)&&(a.getCenter(n),this.closestPointToPoint(n,d),a.closestPointToPoint(d,n),i&&i.copy(d),r&&r.copy(n)),0;const f=c*c,o=a.min,h=a.max,s=this.points;let l=1/0;for(let a=0;a<8;a++){const b=s[a];n.copy(b).clamp(o,h);const e=b.distanceToSquared(n);if(e<l&&(l=e,i&&i.copy(b),r&&r.copy(n),e<f))return Math.sqrt(e)}let g=0;for(let a=0;a<3;a++)for(let c=0;c<=1;c++)for(let d=0;d<=1;d++){const n=(a+1)%3,i=(a+2)%3,r=1<<a|c<<n|d<<i,f=s[c<<n|d<<i],l=s[r];e[g].set(f,l);const u=b[a],m=b[n],p=b[i],j=t[g],k=j.start,y=j.end;k[u]=o[u],k[m]=c?o[m]:h[m],k[p]=d?o[p]:h[m],y[u]=h[u],y[m]=c?o[m]:h[m],y[p]=d?o[p]:h[m],g++;}for(let a=0;a<=1;a++)for(let b=0;b<=1;b++)for(let e=0;e<=1;e++){n.x=a?h.x:o.x,n.y=b?h.y:o.y,n.z=e?h.z:o.z,this.closestPointToPoint(n,d);const c=n.distanceToSquared(d);if(c<l&&(l=c,i&&i.copy(d),r&&r.copy(n),c<f))return Math.sqrt(c)}for(let a=0;a<12;a++){const b=e[a];for(let a=0;a<12;a++){const e=t[a];pa(b,e,d,n);const c=d.distanceToSquared(n);if(c<l&&(l=c,i&&i.copy(d),r&&r.copy(n),c<f))return Math.sqrt(c)}}return Math.sqrt(l)}}();class wa{constructor(a){this._getNewPrimitive=a,this._primitives=[];}getPrimitive(){const a=this._primitives;return 0===a.length?this._getNewPrimitive():a.pop()}releasePrimitive(a){this._primitives.push(a);}}class va extends wa{constructor(){super((()=>new ya));}}const Ea=new va;const Aa=new class{constructor(){this.float32Array=null,this.uint16Array=null,this.uint32Array=null;const a=[];let b=null;this.setBuffer=e=>{b&&a.push(b),b=e,this.float32Array=new Float32Array(e),this.uint16Array=new Uint16Array(e),this.uint32Array=new Uint32Array(e);},this.clearBuffer=()=>{b=null,this.float32Array=null,this.uint16Array=null,this.uint32Array=null,0!==a.length&&this.setBuffer(a.pop());};}};let Fa,Ia;const Ba=[],za=new wa((()=>new Box3));function Ha(a,b,e,c,t,d){Fa=za.getPrimitive(),Ia=za.getPrimitive(),Ba.push(Fa,Ia),Aa.setBuffer(a._roots[b]);const n=Ma(0,a.geometry,e,c,t,d);Aa.clearBuffer(),za.releasePrimitive(Fa),za.releasePrimitive(Ia),Ba.pop(),Ba.pop();const i=Ba.length;return i>0&&(Ia=Ba[i-1],Fa=Ba[i-2]),n}function Ma(a,b,e,c,t=null,d=0,n=0){const{float32Array:i,uint16Array:r,uint32Array:f}=Aa;let o=2*a;if($(o,r)){const h=aa(a,f),s=ba(o,r);return N(a,i,Fa),c(h,s,false,n,d+a,Fa)}{const l=ea(a),g=ca(a,f);let u,m,p,j,k=l,y=g;if(t&&(p=Fa,j=Ia,N(k,i,p),N(y,i,j),u=t(p),m=t(j),m<u)){k=g,y=l;const I=u;u=m,m=I,p=j;}p||(p=Fa,N(k,i,p));const x=e(p,$(2*k,r),u,n+1,d+k);let w;if(2===x){const B=A(k);w=c(B,F(k)-B,true,n+1,d+k,p);}else w=x&&Ma(k,b,e,c,t,d,n+1);if(w)return  true;j=Ia,N(y,i,j);const v=e(j,$(2*y,r),m,n+1,d+y);let E;if(2===v){const z=A(y);E=c(z,F(y)-z,true,n+1,d+y,j);}else E=v&&Ma(y,b,e,c,t,d,n+1);return !!E;function A(a){const{uint16Array:b,uint32Array:e}=Aa;let c=2*a;for(;!$(c,b);)c=2*(a=ea(a));return aa(a,e)}function F(a){const{uint16Array:b,uint32Array:e}=Aa;let c=2*a;for(;!$(c,b);)c=2*(a=ca(a,e));return aa(a,e)+ba(c,b)}}}const Oa=new Vector3,Sa=new Vector3;const Ra=parseInt(REVISION)>=169,Pa=new Vector3,qa=new Vector3,Ua=new Vector3,Ka=new Vector2,Ja=new Vector2,Na=new Vector2,Ta=new Vector3,Ga=new Vector3,Da=new Vector3,Ca=new Vector3;function La(e,c,t,d,n,r,f,o,h,s,l){Pa.fromBufferAttribute(c,r),qa.fromBufferAttribute(c,f),Ua.fromBufferAttribute(c,o);const m=function(a,b,e,c,t,d,n,i){let r;if(r=d===BackSide?a.intersectTriangle(c,e,b,true,t):a.intersectTriangle(b,e,c,d!==DoubleSide,t),null===r)return null;const f=a.origin.distanceTo(t);return f<n||f>i?null:{distance:f,point:t.clone()}}(e,Pa,qa,Ua,Ca,h,s,l);if(m){const c=new Vector3;Triangle.getBarycoord(Ca,Pa,qa,Ua,c),d&&(Ka.fromBufferAttribute(d,r),Ja.fromBufferAttribute(d,f),Na.fromBufferAttribute(d,o),m.uv=Triangle.getInterpolation(Ca,Pa,qa,Ua,Ka,Ja,Na,new Vector2)),n&&(Ka.fromBufferAttribute(n,r),Ja.fromBufferAttribute(n,f),Na.fromBufferAttribute(n,o),m.uv1=Triangle.getInterpolation(Ca,Pa,qa,Ua,Ka,Ja,Na,new Vector2)),t&&(Ta.fromBufferAttribute(t,r),Ga.fromBufferAttribute(t,f),Da.fromBufferAttribute(t,o),m.normal=Triangle.getInterpolation(Ca,Pa,qa,Ua,Ta,Ga,Da,new Vector3),m.normal.dot(e.direction)>0&&m.normal.multiplyScalar(-1));const h={a:r,b:f,c:o,normal:new Vector3,materialIndex:0};Triangle.getNormal(Pa,qa,Ua,h.normal),m.face=h,m.faceIndex=r,Ra&&(m.barycoord=c);}return m}function Wa(a,b,e,c,t,d,n){const i=3*c;let r=i+0,f=i+1,o=i+2;const h=a.index;a.index&&(r=h.getX(r),f=h.getX(f),o=h.getX(o));const{position:s,normal:l,uv:g,uv1:u}=a.attributes,m=La(e,s,l,g,u,r,f,o,b,d,n);return m?(m.faceIndex=c,t&&t.push(m),m):null}function Va(a,b,e,c){const t=a.a,d=a.b,n=a.c;let i=b,r=b+1,f=b+2;e&&(i=e.getX(i),r=e.getX(r),f=e.getX(f)),t.x=c.getX(i),t.y=c.getY(i),t.z=c.getZ(i),d.x=c.getX(r),d.y=c.getY(r),d.z=c.getZ(r),n.x=c.getX(f),n.y=c.getY(f),n.z=c.getZ(f);}function Qa(a,b,e,c,t,d,n){const{geometry:i}=e,{index:r}=i,f=i.attributes.position;for(let e=a,i=b+a;e<i;e++){let a;if(a=e,Va(n,3*a,r,f),n.needsUpdate=true,c(n,a,t,d))return  true}return  false}function Xa(a,b=null){b&&Array.isArray(b)&&(b=new Set(b));const e=a.geometry,c=e.index?e.index.array:null,t=e.attributes.position;let d,n,i,r,f=0;const o=a._roots;for(let a=0,b=o.length;a<b;a++)d=o[a],n=new Uint32Array(d),i=new Uint16Array(d),r=new Float32Array(d),h(0,f),f+=d.byteLength;function h(a,e,d=false){const f=2*a;if(i[f+15]===O$1){const b=n[a+6];let e=1/0,d=1/0,o=1/0,h=-1/0,s=-1/0,l=-1/0;for(let a=3*b,n=3*(b+i[f+14]);a<n;a++){let b=c[a];const n=t.getX(b),i=t.getY(b),r=t.getZ(b);n<e&&(e=n),n>h&&(h=n),i<d&&(d=i),i>s&&(s=i),r<o&&(o=r),r>l&&(l=r);}return (r[a+0]!==e||r[a+1]!==d||r[a+2]!==o||r[a+3]!==h||r[a+4]!==s||r[a+5]!==l)&&(r[a+0]=e,r[a+1]=d,r[a+2]=o,r[a+3]=h,r[a+4]=s,r[a+5]=l,true)}{const c=a+8,t=n[a+6],i=c+e,f=t+e;let o=d,s=false,l=false;b?o||(s=b.has(i),l=b.has(f),o=!s&&!l):(s=true,l=true);const g=o||l;let u=false;(o||s)&&(u=h(c,e,o));let m=false;g&&(m=h(t,e,o));const p=u||m;if(p)for(let b=0;b<3;b++){const e=c+b,d=t+b,n=r[e],i=r[e+3],f=r[d],o=r[d+3];r[a+b]=n<f?n:f,r[a+b+3]=i>o?i:o;}return p}}}function Ya(a,b,e,c,t){let d,n,i,r,f,o;const h=1/e.direction.x,s=1/e.direction.y,l=1/e.direction.z,g=e.origin.x,u=e.origin.y,m=e.origin.z;let p=b[a],j=b[a+3],k=b[a+1],y=b[a+3+1],x=b[a+2],w=b[a+3+2];return h>=0?(d=(p-g)*h,n=(j-g)*h):(d=(j-g)*h,n=(p-g)*h),s>=0?(i=(k-u)*s,r=(y-u)*s):(i=(y-u)*s,r=(k-u)*s),!(d>r||i>n)&&((i>d||isNaN(d))&&(d=i),(r<n||isNaN(n))&&(n=r),l>=0?(f=(x-m)*l,o=(w-m)*l):(f=(w-m)*l,o=(x-m)*l),!(d>o||f>n)&&((f>d||d!=d)&&(d=f),(o<n||n!=n)&&(n=o),d<=t&&n>=c))}function _a(a,b,e,c,t,d,n){const{geometry:i}=e,{index:r}=i,f=i.attributes.position;for(let i=a,o=b+a;i<o;i++){let a;if(a=e.resolveTriangleIndex(i),Va(n,3*a,r,f),n.needsUpdate=true,c(n,a,t,d))return  true}return  false}function Za(a,b,e,c,t,d,n){Aa.setBuffer(a._roots[b]),$a(0,a,e,c,t,d,n),Aa.clearBuffer();}function $a(a,b,e,c,t,d,n){const{float32Array:i,uint16Array:r,uint32Array:f}=Aa,o=2*a;if($(o,r)){!function(a,b,e,c,t,d,n,i){const{geometry:r,_indirectBuffer:f}=a;for(let a=c,f=c+t;a<f;a++)Wa(r,b,e,a,d,n,i);}(b,e,c,aa(a,f),ba(o,r),t,d,n);}else {const r=ea(a);Ya(r,i,c,d,n)&&$a(r,b,e,c,t,d,n);const o=ca(a,f);Ya(o,i,c,d,n)&&$a(o,b,e,c,t,d,n);}}const ab=["x","y","z"];function bb(a,b,e,c,t,d){Aa.setBuffer(a._roots[b]);const n=eb(0,a,e,c,t,d);return Aa.clearBuffer(),n}function eb(a,b,e,c,t,d){const{float32Array:n,uint16Array:i,uint32Array:r}=Aa;let f=2*a;if($(f,i)){return function(a,b,e,c,t,d,n){const{geometry:i,_indirectBuffer:r}=a;let f=1/0,o=null;for(let a=c,r=c+t;a<r;a++){let c;c=Wa(i,b,e,a,null,d,n),c&&c.distance<f&&(o=c,f=c.distance);}return o}(b,e,c,aa(a,r),ba(f,i),t,d)}{const i=ta(a,r),f=ab[i],o=c.direction[f]>=0;let h,s;o?(h=ea(a),s=ca(a,r)):(h=ca(a,r),s=ea(a));const l=Ya(h,n,c,t,d)?eb(h,b,e,c,t,d):null;if(l){const a=l.point[f];if(o?a<=n[s+i]:a>=n[s+i+3])return l}const g=Ya(s,n,c,t,d)?eb(s,b,e,c,t,d):null;return l&&g?l.distance<=g.distance?l:g:l||g||null}}const cb=new Box3,tb=new ya,db=new ya,nb=new Matrix4,ib=new xa,rb=new xa;function fb(a,b,e,c){Aa.setBuffer(a._roots[b]);const t=ob(0,a,e,c);return Aa.clearBuffer(),t}function ob(a,b,e,c,t=null){const{float32Array:d,uint16Array:n,uint32Array:i}=Aa;let r=2*a;null===t&&(e.boundingBox||e.computeBoundingBox(),ib.set(e.boundingBox.min,e.boundingBox.max,c),t=ib);if(!$(r,n)){const n=a+8,r=i[a+6];N(n,d,cb);if(t.intersectsBox(cb)&&ob(n,b,e,c,t))return  true;N(r,d,cb);return !!(t.intersectsBox(cb)&&ob(r,b,e,c,t))}{const t=b.geometry,f=t.index,o=t.attributes.position,h=e.index,s=e.attributes.position,l=aa(a,i),g=ba(r,n);if(nb.copy(c).invert(),e.boundsTree){N(a,d,rb),rb.matrix.copy(nb),rb.needsUpdate=true;const b=e.boundsTree.shapecast({intersectsBounds:a=>rb.intersectsBox(a),intersectsTriangle:a=>{a.a.applyMatrix4(c),a.b.applyMatrix4(c),a.c.applyMatrix4(c),a.needsUpdate=true;for(let b=3*l,e=3*(g+l);b<e;b+=3)if(Va(db,b,f,o),db.needsUpdate=true,a.intersectsTriangle(db))return  true;return  false}});return b}for(let a=3*l,b=3*(g+l);a<b;a+=3){Va(tb,a,f,o),tb.a.applyMatrix4(nb),tb.b.applyMatrix4(nb),tb.c.applyMatrix4(nb),tb.needsUpdate=true;for(let a=0,b=h.count;a<b;a+=3)if(Va(db,a,h,s),db.needsUpdate=true,tb.intersectsTriangle(db))return  true}}}const hb=new Matrix4,sb=new xa,lb=new xa,gb=new Vector3,ub=new Vector3,mb=new Vector3,pb=new Vector3;function jb(a,b,e,c={},t={},d=0,n=1/0){b.boundingBox||b.computeBoundingBox(),sb.set(b.boundingBox.min,b.boundingBox.max,e),sb.needsUpdate=true;const i=a.geometry,r=i.attributes.position,f=i.index,o=b.attributes.position,h=b.index,s=Ea.getPrimitive(),l=Ea.getPrimitive();let g=gb,u=ub,m=null,p=null;t&&(m=mb,p=pb);let j=1/0,k=null,y=null;return hb.copy(e).invert(),lb.matrix.copy(hb),a.shapecast({boundsTraverseOrder:a=>sb.distanceToBox(a),intersectsBounds:(a,b,e)=>e<j&&e<n&&(b&&(lb.min.copy(a.min),lb.max.copy(a.max),lb.needsUpdate=true),true),intersectsRange:(a,c)=>{if(b.boundsTree){return b.boundsTree.shapecast({boundsTraverseOrder:a=>lb.distanceToBox(a),intersectsBounds:(a,b,e)=>e<j&&e<n,intersectsRange:(b,t)=>{for(let n=b,i=b+t;n<i;n++){Va(l,3*n,h,o),l.a.applyMatrix4(e),l.b.applyMatrix4(e),l.c.applyMatrix4(e),l.needsUpdate=true;for(let b=a,e=a+c;b<e;b++){Va(s,3*b,f,r),s.needsUpdate=true;const a=s.distanceToTriangle(l,g,m);if(a<j&&(u.copy(g),p&&p.copy(m),j=a,k=b,y=n),a<d)return  true}}}})}for(let t=0,n=P$1(b);t<n;t++){Va(l,3*t,h,o),l.a.applyMatrix4(e),l.b.applyMatrix4(e),l.c.applyMatrix4(e),l.needsUpdate=true;for(let b=a,e=a+c;b<e;b++){Va(s,3*b,f,r),s.needsUpdate=true;const a=s.distanceToTriangle(l,g,m);if(a<j&&(u.copy(g),p&&p.copy(m),j=a,k=b,y=t),a<d)return  true}}}}),Ea.releasePrimitive(s),Ea.releasePrimitive(l),j===1/0?null:(c.point?c.point.copy(u):c.point=u.clone(),c.distance=j,c.faceIndex=k,t&&(t.point?t.point.copy(p):t.point=p.clone(),t.point.applyMatrix4(hb),u.applyMatrix4(hb),t.distance=u.sub(t.point).length(),t.faceIndex=y),c)}function kb(a,b=null){b&&Array.isArray(b)&&(b=new Set(b));const e=a.geometry,c=e.index?e.index.array:null,t=e.attributes.position;let d,n,i,r,f=0;const o=a._roots;for(let a=0,b=o.length;a<b;a++)d=o[a],n=new Uint32Array(d),i=new Uint16Array(d),r=new Float32Array(d),h(0,f),f+=d.byteLength;function h(e,d,f=false){const o=2*e;if(i[o+15]===O$1){const b=n[e+6];let d=1/0,f=1/0,h=1/0,s=-1/0,l=-1/0,g=-1/0;for(let e=b,n=b+i[o+14];e<n;e++){const b=3*a.resolveTriangleIndex(e);for(let a=0;a<3;a++){let e=b+a;e=c?c[e]:e;const n=t.getX(e),i=t.getY(e),r=t.getZ(e);n<d&&(d=n),n>s&&(s=n),i<f&&(f=i),i>l&&(l=i),r<h&&(h=r),r>g&&(g=r);}}return (r[e+0]!==d||r[e+1]!==f||r[e+2]!==h||r[e+3]!==s||r[e+4]!==l||r[e+5]!==g)&&(r[e+0]=d,r[e+1]=f,r[e+2]=h,r[e+3]=s,r[e+4]=l,r[e+5]=g,true)}{const a=e+8,c=n[e+6],t=a+d,i=c+d;let o=f,s=false,l=false;b?o||(s=b.has(t),l=b.has(i),o=!s&&!l):(s=true,l=true);const g=o||l;let u=false;(o||s)&&(u=h(a,d,o));let m=false;g&&(m=h(c,d,o));const p=u||m;if(p)for(let b=0;b<3;b++){const t=a+b,d=c+b,n=r[t],i=r[t+3],f=r[d],o=r[d+3];r[e+b]=n<f?n:f,r[e+b+3]=i>o?i:o;}return p}}}function yb(a,b,e,c,t,d,n){Aa.setBuffer(a._roots[b]),xb(0,a,e,c,t,d,n),Aa.clearBuffer();}function xb(a,b,e,c,t,d,n){const{float32Array:i,uint16Array:r,uint32Array:f}=Aa,o=2*a;if($(o,r)){!function(a,b,e,c,t,d,n,i){const{geometry:r,_indirectBuffer:f}=a;for(let a=c,o=c+t;a<o;a++)Wa(r,b,e,f?f[a]:a,d,n,i);}(b,e,c,aa(a,f),ba(o,r),t,d,n);}else {const r=ea(a);Ya(r,i,c,d,n)&&xb(r,b,e,c,t,d,n);const o=ca(a,f);Ya(o,i,c,d,n)&&xb(o,b,e,c,t,d,n);}}const wb=["x","y","z"];function vb(a,b,e,c,t,d){Aa.setBuffer(a._roots[b]);const n=Eb(0,a,e,c,t,d);return Aa.clearBuffer(),n}function Eb(a,b,e,c,t,d){const{float32Array:n,uint16Array:i,uint32Array:r}=Aa;let f=2*a;if($(f,i)){return function(a,b,e,c,t,d,n){const{geometry:i,_indirectBuffer:r}=a;let f=1/0,o=null;for(let a=c,h=c+t;a<h;a++){let c;c=Wa(i,b,e,r?r[a]:a,null,d,n),c&&c.distance<f&&(o=c,f=c.distance);}return o}(b,e,c,aa(a,r),ba(f,i),t,d)}{const i=ta(a,r),f=wb[i],o=c.direction[f]>=0;let h,s;o?(h=ea(a),s=ca(a,r)):(h=ca(a,r),s=ea(a));const l=Ya(h,n,c,t,d)?Eb(h,b,e,c,t,d):null;if(l){const a=l.point[f];if(o?a<=n[s+i]:a>=n[s+i+3])return l}const g=Ya(s,n,c,t,d)?Eb(s,b,e,c,t,d):null;return l&&g?l.distance<=g.distance?l:g:l||g||null}}const Ab=new Box3,Fb=new ya,Ib=new ya,Bb=new Matrix4,zb=new xa,Hb=new xa;function Mb(a,b,e,c){Aa.setBuffer(a._roots[b]);const t=Ob(0,a,e,c);return Aa.clearBuffer(),t}function Ob(a,b,e,c,t=null){const{float32Array:d,uint16Array:n,uint32Array:i}=Aa;let r=2*a;null===t&&(e.boundingBox||e.computeBoundingBox(),zb.set(e.boundingBox.min,e.boundingBox.max,c),t=zb);if(!$(r,n)){const n=a+8,r=i[a+6];N(n,d,Ab);if(t.intersectsBox(Ab)&&Ob(n,b,e,c,t))return  true;N(r,d,Ab);return !!(t.intersectsBox(Ab)&&Ob(r,b,e,c,t))}{const t=b.geometry,f=t.index,o=t.attributes.position,h=e.index,s=e.attributes.position,l=aa(a,i),g=ba(r,n);if(Bb.copy(c).invert(),e.boundsTree){N(a,d,Hb),Hb.matrix.copy(Bb),Hb.needsUpdate=true;const t=e.boundsTree.shapecast({intersectsBounds:a=>Hb.intersectsBox(a),intersectsTriangle:a=>{a.a.applyMatrix4(c),a.b.applyMatrix4(c),a.c.applyMatrix4(c),a.needsUpdate=true;for(let e=l,c=g+l;e<c;e++)if(Va(Ib,3*b.resolveTriangleIndex(e),f,o),Ib.needsUpdate=true,a.intersectsTriangle(Ib))return  true;return  false}});return t}for(let a=l,e=g+l;a<e;a++){const e=b.resolveTriangleIndex(a);Va(Fb,3*e,f,o),Fb.a.applyMatrix4(Bb),Fb.b.applyMatrix4(Bb),Fb.c.applyMatrix4(Bb),Fb.needsUpdate=true;for(let a=0,b=h.count;a<b;a+=3)if(Va(Ib,a,h,s),Ib.needsUpdate=true,Fb.intersectsTriangle(Ib))return  true}}}const Sb=new Matrix4,Rb=new xa,Pb=new xa,qb=new Vector3,Ub=new Vector3,Kb=new Vector3,Jb=new Vector3;function Nb(a,b,e,c={},t={},d=0,n=1/0){b.boundingBox||b.computeBoundingBox(),Rb.set(b.boundingBox.min,b.boundingBox.max,e),Rb.needsUpdate=true;const i=a.geometry,r=i.attributes.position,f=i.index,o=b.attributes.position,h=b.index,s=Ea.getPrimitive(),l=Ea.getPrimitive();let g=qb,u=Ub,m=null,p=null;t&&(m=Kb,p=Jb);let j=1/0,k=null,y=null;return Sb.copy(e).invert(),Pb.matrix.copy(Sb),a.shapecast({boundsTraverseOrder:a=>Rb.distanceToBox(a),intersectsBounds:(a,b,e)=>e<j&&e<n&&(b&&(Pb.min.copy(a.min),Pb.max.copy(a.max),Pb.needsUpdate=true),true),intersectsRange:(c,t)=>{if(b.boundsTree){const i=b.boundsTree;return i.shapecast({boundsTraverseOrder:a=>Pb.distanceToBox(a),intersectsBounds:(a,b,e)=>e<j&&e<n,intersectsRange:(b,n)=>{for(let x=b,w=b+n;x<w;x++){const b=i.resolveTriangleIndex(x);Va(l,3*b,h,o),l.a.applyMatrix4(e),l.b.applyMatrix4(e),l.c.applyMatrix4(e),l.needsUpdate=true;for(let b=c,e=c+t;b<e;b++){const e=a.resolveTriangleIndex(b);Va(s,3*e,f,r),s.needsUpdate=true;const c=s.distanceToTriangle(l,g,m);if(c<j&&(u.copy(g),p&&p.copy(m),j=c,k=b,y=x),c<d)return  true}}}})}for(let n=0,i=P$1(b);n<i;n++){Va(l,3*n,h,o),l.a.applyMatrix4(e),l.b.applyMatrix4(e),l.c.applyMatrix4(e),l.needsUpdate=true;for(let b=c,e=c+t;b<e;b++){const e=a.resolveTriangleIndex(b);Va(s,3*e,f,r),s.needsUpdate=true;const c=s.distanceToTriangle(l,g,m);if(c<j&&(u.copy(g),p&&p.copy(m),j=c,k=b,y=n),c<d)return  true}}}}),Ea.releasePrimitive(s),Ea.releasePrimitive(l),j===1/0?null:(c.point?c.point.copy(u):c.point=u.clone(),c.distance=j,c.faceIndex=k,t&&(t.point?t.point.copy(p):t.point=p.clone(),t.point.applyMatrix4(Sb),u.applyMatrix4(Sb),t.distance=u.sub(t.point).length(),t.faceIndex=y),c)}const Tb=new Aa.constructor,Gb=new Aa.constructor,Db=new wa((()=>new Box3)),Cb=new Box3,Lb=new Box3,Wb=new Box3,Vb=new Box3;let Qb=false;function Xb(a,b,e,c,t,d=0,n=0,i=0,r=0,f=null,o=false){let h,s;o?(h=Gb,s=Tb):(h=Tb,s=Gb);const l=h.float32Array,g=h.uint32Array,u=h.uint16Array,m=s.float32Array,p=s.uint32Array,j=s.uint16Array,k=2*b,y=$(2*a,u),x=$(k,j);let w=false;if(x&&y)w=o?t(aa(b,p),ba(2*b,j),aa(a,g),ba(2*a,u),r,n+b,i,d+a):t(aa(a,g),ba(2*a,u),aa(b,p),ba(2*b,j),i,d+a,r,n+b);else if(x){const f=Db.getPrimitive();N(b,m,f),f.applyMatrix4(e);const h=ea(a),s=ca(a,g);N(h,l,Cb),N(s,l,Lb);const u=f.intersectsBox(Cb),p=f.intersectsBox(Lb);w=u&&Xb(b,h,c,e,t,n,d,r,i+1,f,!o)||p&&Xb(b,s,c,e,t,n,d,r,i+1,f,!o),Db.releasePrimitive(f);}else {const h=ea(b),s=ca(b,p);N(h,m,Wb),N(s,m,Vb);const u=f.intersectsBox(Wb),j=f.intersectsBox(Vb);if(u&&j)w=Xb(a,h,e,c,t,d,n,i,r+1,f,o)||Xb(a,s,e,c,t,d,n,i,r+1,f,o);else if(u)if(y)w=Xb(a,h,e,c,t,d,n,i,r+1,f,o);else {const b=Db.getPrimitive();b.copy(Wb).applyMatrix4(e);const f=ea(a),s=ca(a,g);N(f,l,Cb),N(s,l,Lb);const u=b.intersectsBox(Cb),m=b.intersectsBox(Lb);w=u&&Xb(h,f,c,e,t,n,d,r,i+1,b,!o)||m&&Xb(h,s,c,e,t,n,d,r,i+1,b,!o),Db.releasePrimitive(b);}else if(j)if(y)w=Xb(a,s,e,c,t,d,n,i,r+1,f,o);else {const b=Db.getPrimitive();b.copy(Vb).applyMatrix4(e);const f=ea(a),h=ca(a,g);N(f,l,Cb),N(h,l,Lb);const u=b.intersectsBox(Cb),m=b.intersectsBox(Lb);w=u&&Xb(s,f,c,e,t,n,d,r,i+1,b,!o)||m&&Xb(s,h,c,e,t,n,d,r,i+1,b,!o),Db.releasePrimitive(b);}}return w}const Yb=new xa,_b=new Box3,Zb={strategy:0,maxDepth:40,maxLeafTris:10,useSharedArrayBuffer:false,setBoundingBox:true,onProgress:null,indirect:false,verbose:true,range:null};class $b{static serialize(a,b={}){b={cloneBuffers:true,...b};const e=a.geometry,c=a._roots,t=a._indirectBuffer,d=e.getIndex();let n;return n=b.cloneBuffers?{roots:c.map((a=>a.slice())),index:d?d.array.slice():null,indirectBuffer:t?t.slice():null}:{roots:c,index:d?d.array:null,indirectBuffer:t},n}static deserialize(a,b,e={}){e={setIndex:true,indirect:Boolean(a.indirectBuffer),...e};const{index:c,roots:t,indirectBuffer:d}=a,n=new $b(b,{...e,[R$1]:true});if(n._roots=t,n._indirectBuffer=d||null,e.setIndex){const e=b.getIndex();if(null===e){const e=new BufferAttribute(a.index,1,false);b.setIndex(e);}else e.array!==c&&(e.array.set(c),e.needsUpdate=true);}return n}get indirect(){return !!this._indirectBuffer}constructor(a,b={}){if(!a.isBufferGeometry)throw new Error("MeshBVH: Only BufferGeometries are supported.");if(a.index&&a.index.isInterleavedBufferAttribute)throw new Error("MeshBVH: InterleavedBufferAttribute is not supported for the index attribute.");if((b=Object.assign({...Zb,[R$1]:false},b)).useSharedArrayBuffer&&"undefined"==typeof SharedArrayBuffer)throw new Error("MeshBVH: SharedArrayBuffer is not available.");this.geometry=a,this._roots=null,this._indirectBuffer=null,b[R$1]||(ga(this,b),!a.boundingBox&&b.setBoundingBox&&(a.boundingBox=this.getBoundingBox(new Box3))),this.resolveTriangleIndex=b.indirect?a=>this._indirectBuffer[a]:a=>a;}refit(a=null){return (this.indirect?kb:Xa)(this,a)}traverse(a,b=0){const e=this._roots[b],c=new Uint32Array(e),t=new Uint16Array(e);!function b(d,n=0){const i=2*d,r=t[i+15]===O$1;if(r){const b=c[d+6],f=t[i+14];a(n,r,new Float32Array(e,4*d,6),b,f);}else {const t=d+8,i=c[d+6],f=c[d+7];a(n,r,new Float32Array(e,4*d,6),f)||(b(t,n+1),b(i,n+1));}}(0);}raycast(a,b=FrontSide,e=0,c=1/0){const t=this._roots,d=this.geometry,n=[],i=b.isMaterial,r=Array.isArray(b),f=d.groups,o=i?b.side:b,h=this.indirect?yb:Za;for(let d=0,i=t.length;d<i;d++){const t=r?b[f[d].materialIndex].side:o,i=n.length;if(h(this,d,t,a,n,e,c),r){const a=f[d].materialIndex;for(let b=i,e=n.length;b<e;b++)n[b].face.materialIndex=a;}}return n}raycastFirst(a,b=FrontSide,e=0,c=1/0){const t=this._roots,d=this.geometry,n=b.isMaterial,i=Array.isArray(b);let r=null;const f=d.groups,o=n?b.side:b,h=this.indirect?vb:bb;for(let d=0,n=t.length;d<n;d++){const t=h(this,d,i?b[f[d].materialIndex].side:o,a,e,c);null!=t&&(null==r||t.distance<r.distance)&&(r=t,i&&(t.face.materialIndex=f[d].materialIndex));}return r}intersectsGeometry(a,b){let e=false;const c=this._roots,t=this.indirect?Mb:fb;for(let d=0,n=c.length;d<n&&(e=t(this,d,a,b),!e);d++);return e}shapecast(a){const b=Ea.getPrimitive(),e=this.indirect?_a:Qa;let{boundsTraverseOrder:c,intersectsBounds:t,intersectsRange:d,intersectsTriangle:n}=a;if(d&&n){const a=d;d=(c,t,d,i,r)=>!!a(c,t,d,i,r)||e(c,t,this,n,d,i,b);}else d||(d=n?(a,c,t,d)=>e(a,c,this,n,t,d,b):(a,b,e)=>e);let i=false,r=0;const f=this._roots;for(let a=0,b=f.length;a<b;a++){const b=f[a];if(i=Ha(this,a,t,d,c,r),i)break;r+=b.byteLength;}return Ea.releasePrimitive(b),i}bvhcast(a,b,e){let{intersectsRanges:c,intersectsTriangles:t}=e;const d=Ea.getPrimitive(),n=this.geometry.index,i=this.geometry.attributes.position,r=this.indirect?a=>{const b=this.resolveTriangleIndex(a);Va(d,3*b,n,i);}:a=>{Va(d,3*a,n,i);},o=Ea.getPrimitive(),h=a.geometry.index,s=a.geometry.attributes.position,l=a.indirect?b=>{const e=a.resolveTriangleIndex(b);Va(o,3*e,h,s);}:a=>{Va(o,3*a,h,s);};if(t){const a=(a,e,c,n,i,f,h,s)=>{for(let g=c,u=c+n;g<u;g++){l(g),o.a.applyMatrix4(b),o.b.applyMatrix4(b),o.c.applyMatrix4(b),o.needsUpdate=true;for(let b=a,c=a+e;b<c;b++)if(r(b),d.needsUpdate=true,t(d,o,b,g,i,f,h,s))return  true}return  false};if(c){const b=c;c=function(e,c,t,d,n,i,r,f){return !!b(e,c,t,d,n,i,r,f)||a(e,c,t,d,n,i,r,f)};}else c=a;}return function(a,b,e,c){if(Qb)throw new Error("MeshBVH: Recursive calls to bvhcast not supported.");Qb=true;const t=a._roots,d=b._roots;let n,i=0,r=0;const o=(new Matrix4).copy(e).invert();for(let a=0,b=t.length;a<b;a++){Tb.setBuffer(t[a]),r=0;const b=Db.getPrimitive();N(0,Tb.float32Array,b),b.applyMatrix4(o);for(let a=0,t=d.length;a<t&&(Gb.setBuffer(d[a]),n=Xb(0,0,e,o,c,i,r,0,0,b),Gb.clearBuffer(),r+=d[a].length,!n);a++);if(Db.releasePrimitive(b),Tb.clearBuffer(),i+=t[a].length,n)break}return Qb=false,n}(this,a,b,c)}intersectsBox(a,b){return Yb.set(a.min,a.max,b),Yb.needsUpdate=true,this.shapecast({intersectsBounds:a=>Yb.intersectsBox(a),intersectsTriangle:a=>Yb.intersectsTriangle(a)})}intersectsSphere(a){return this.shapecast({intersectsBounds:b=>a.intersectsBox(b),intersectsTriangle:b=>b.intersectsSphere(a)})}closestPointToGeometry(a,b,e={},c={},t=0,d=1/0){return (this.indirect?Nb:jb)(this,a,b,e,c,t,d)}closestPointToPoint(a,b={},e=0,c=1/0){return function(a,b,e={},c=0,t=1/0){const d=c*c,n=t*t;let i=1/0,r=null;if(a.shapecast({boundsTraverseOrder:a=>(Oa.copy(b).clamp(a.min,a.max),Oa.distanceToSquared(b)),intersectsBounds:(a,b,e)=>e<i&&e<n,intersectsTriangle:(a,e)=>{a.closestPointToPoint(b,Oa);const c=b.distanceToSquared(Oa);return c<i&&(Sa.copy(Oa),i=c,r=e),c<d}}),i===1/0)return null;const f=Math.sqrt(i);return e.point?e.point.copy(Sa):e.point=Sa.clone(),e.distance=f,e.faceIndex=r,e}(this,a,b,e,c)}getBoundingBox(a){a.makeEmpty();return this._roots.forEach((b=>{N(0,new Float32Array(b),_b),a.union(_b);})),a}}function ae(a,b,e){return null===a?null:(a.point.applyMatrix4(b.matrixWorld),a.distance=a.point.distanceTo(e.ray.origin),a.object=b,a)}const be=parseInt(REVISION)>=166,ee=new Ray$1,ce=new Vector3,te=new Matrix4,de=Mesh.prototype.raycast,ne=BatchedMesh.prototype.raycast,ie=new Vector3,re=new Mesh,fe=[];function oe(a,b){this.isBatchedMesh?he.call(this,a,b):se.call(this,a,b);}function he(a,b){if(this.boundsTrees){const e=this.boundsTrees,c=this._drawInfo||this._instanceInfo,t=this._drawRanges||this._geometryInfo,d=this.matrixWorld;re.material=this.material,re.geometry=this.geometry;const n=re.geometry.boundsTree,i=re.geometry.drawRange;null===re.geometry.boundingSphere&&(re.geometry.boundingSphere=new Sphere);for(let n=0,i=c.length;n<i;n++){if(!this.getVisibleAt(n))continue;const i=c[n].geometryIndex;if(re.geometry.boundsTree=e[i],this.getMatrixAt(n,re.matrixWorld).premultiply(d),!re.geometry.boundsTree){this.getBoundingBoxAt(i,re.geometry.boundingBox),this.getBoundingSphereAt(i,re.geometry.boundingSphere);const a=t[i];re.geometry.setDrawRange(a.start,a.count);}re.raycast(a,fe);for(let a=0,e=fe.length;a<e;a++){const e=fe[a];e.object=this,e.batchId=n,b.push(e);}fe.length=0;}re.geometry.boundsTree=n,re.geometry.drawRange=i,re.material=null,re.geometry=null;}else ne.call(this,a,b);}function se(a,b){if(this.geometry.boundsTree){if(void 0===this.material)return;te.copy(this.matrixWorld).invert(),ee.copy(a.ray).applyMatrix4(te),ie.setFromMatrixScale(this.matrixWorld),ce.copy(ee.direction).multiply(ie);const e=ce.length(),c=a.near/e,t=a.far/e,d=this.geometry.boundsTree;if(true===a.firstHitOnly){const e=ae(d.raycastFirst(ee,this.material,c,t),this,a);e&&b.push(e);}else {const e=d.raycast(ee,this.material,c,t);for(let c=0,t=e.length;c<t;c++){const t=ae(e[c],this,a);t&&b.push(t);}}}else de.call(this,a,b);}function le(a=-1,b={}){if(!be)throw new Error("BatchedMesh: Three r166+ is required to compute bounds trees.");b.indirect&&console.warn('"Indirect" is set to false because it is not supported for BatchedMesh.'),b={...b,indirect:false,range:null};const e=this._drawRanges||this._geometryInfo,c=this._geometryCount;this.boundsTrees||(this.boundsTrees=new Array(c).fill(null));const t=this.boundsTrees;for(;t.length<c;)t.push(null);if(a<0){for(let a=0;a<c;a++)b.range=e[a],t[a]=new $b(this.geometry,b);return t}return a<e.length&&(b.range=e[a],t[a]=new $b(this.geometry,b)),t[a]||null}function ge(a,b,e){e[0]=a[0]>b[0]?b[0]:a[0],e[1]=a[1]<b[1]?b[1]:a[1],e[2]=a[2]>b[2]?b[2]:a[2],e[3]=a[3]<b[3]?b[3]:a[3],e[4]=a[4]>b[4]?b[4]:a[4],e[5]=a[5]<b[5]?b[5]:a[5];}function ue(a,b,e){let c=false;const t=a[0]>b[0]?b[0]:a[0],d=a[1]<b[1]?b[1]:a[1],n=a[2]>b[2]?b[2]:a[2],i=a[3]<b[3]?b[3]:a[3],r=a[4]>b[4]?b[4]:a[4],f=a[5]<b[5]?b[5]:a[5];return e[0]>t&&(e[0]=t,c=true),e[1]<d&&(e[1]=d,c=true),e[2]>n&&(e[2]=n,c=true),e[3]<i&&(e[3]=i,c=true),e[4]>r&&(e[4]=r,c=true),e[5]<f&&(e[5]=f,c=true),c}function me(a,b){let e=false;return b[0]>a[0]&&(b[0]=a[0],e=true),b[1]<a[1]&&(b[1]=a[1],e=true),b[2]>a[2]&&(b[2]=a[2],e=true),b[3]<a[3]&&(b[3]=a[3],e=true),b[4]>a[4]&&(b[4]=a[4],e=true),b[5]<a[5]&&(b[5]=a[5],e=true),e}function pe(a,b){a[0]-=b,a[1]+=b,a[2]-=b,a[3]+=b,a[4]-=b,a[5]+=b;}function je(a){const b=a[1]-a[0],e=a[3]-a[2],c=a[5]-a[4];return 2*(b*e+e*c+c*b)}function ke(a,b){const e=a[0]>b[0]?b[0]:a[0],c=a[1]<b[1]?b[1]:a[1],t=a[2]>b[2]?b[2]:a[2],d=a[3]<b[3]?b[3]:a[3],n=a[4]>b[4]?b[4]:a[4],i=c-e,r=d-t,f=(a[5]<b[5]?b[5]:a[5])-n;return 2*(i*r+r*f+f*i)}function ye(a,b){const e=a[0]-b[0],c=b[0]-a[1];let t=e>c?e:c;t<0&&(t=0);const d=a[2]-b[1],n=b[1]-a[3];let i=d>n?d:n;i<0&&(i=0);const r=a[4]-b[2],f=b[2]-a[5];let o=r>f?r:f;return o<0&&(o=0),t*t+i*i+o*o}class xe{constructor(){this.array=[];}clear(){this.array=[];}push(a){const b=this.array,e=a.inheritedCost,c=b.length>6?b.length-6:0;let t;for(t=b.length-1;t>=c&&!(e<=b[t].inheritedCost);t--);t>b.length-7&&b.splice(t+1,0,a);}pop(){return this.array.pop()}}let we=class{constructor(a=false){this.root=null,this._sortedList=new xe,this.count=0,this.highPrecision=a,this._typeArray=a?Float64Array:Float32Array;}createFromArray(a,b,e,c=0){const t=b.length,d=this._typeArray;d!==(4===b[0].BYTES_PER_ELEMENT?Float32Array:Float64Array)&&console.warn("Different precision.");const n=new d(6);let i,r;this.root=function t(f,o,h){if(1===o){const t=b[f];c>0&&pe(t,c);const d={box:t,object:a[f],parent:h};return e&&e(d),d}const s=function(a,e){const t=new d(6),i=a+e;t[0]=1/0,t[1]=-1/0,t[2]=1/0,t[3]=-1/0,t[4]=1/0,t[5]=-1/0,n[0]=1/0,n[1]=-1/0,n[2]=1/0,n[3]=-1/0,n[4]=1/0,n[5]=-1/0;for(let e=a;e<i;e++){const a=b[e],c=a[0],d=a[1],i=a[2],r=a[3],f=a[4],o=a[5];t[0]>c&&(t[0]=c),t[1]<d&&(t[1]=d),t[2]>i&&(t[2]=i),t[3]<r&&(t[3]=r),t[4]>f&&(t[4]=f),t[5]<o&&(t[5]=o);const h=.5*(d+c),s=.5*(r+i),l=.5*(o+f);n[0]>h&&(n[0]=h),n[1]<h&&(n[1]=h),n[2]>s&&(n[2]=s),n[3]<s&&(n[3]=s),n[4]>l&&(n[4]=l),n[5]<l&&(n[5]=l);}return t[0]-=c,t[1]+=c,t[2]-=c,t[3]+=c,t[4]-=c,t[5]+=c,t}(f,o);i=2*function(a){const b=a[1]-a[0],e=a[3]-a[2],c=a[5]-a[4];return b>e?b>c?0:2:e>c?1:2}(n),r=.5*(n[i]+n[i+1]);let l=function(e,c){let t=e,d=e+c-1;for(;t<=d;){const e=b[t];if(.5*(e[i+1]+e[i])>=r)for(;;){const e=b[d];if(.5*(e[i+1]+e[i])<r){const e=a[t];a[t]=a[d],a[d]=e;const c=b[t];b[t]=b[d],b[d]=c,d--;break}if(d--,d<=t)return t}t++;}return t}(f,o);(l===f||l===f+o)&&(l=f+(o>>1));const g={box:s,parent:h};return g.left=t(f,l-f,g),g.right=t(l,o-l+f,g),g}(0,t,null);}insert(a,b,e){e>0&&pe(b,e);const c=this.createLeafNode(a,b);return null===this.root?this.root=c:this.insertLeaf(c),this.count++,c}insertRange(a,b,e,c){console.warn("Method not optimized yet. It just calls 'insert' N times.");const t=a.length,d=e>0?e:e?null:0;for(let n=0;n<t;n++){const t=this.insert(a[n],b[n],d??e[n]);c&&c(t);}}move(a,b){if(!a.parent||function(a,b){return !(b[0]>a[0]||b[1]<a[1]||b[2]>a[2]||b[3]<a[3]||b[4]>a[4]||b[5]<a[5])}(a.box,a.parent.box))return void(b>0&&pe(a.box,b));b>0&&pe(a.box,b);const e=this.delete(a);this.insertLeaf(a,e),this.count++;}delete(a){const b=a.parent;if(null===b)return this.root=null,null;const e=b.parent,c=b.left===a?b.right:b.left;return c.parent=e,a.parent=null,null===e?(this.root=c,b):(e.left===b?e.left=c:e.right=c,this.refit(e),this.count--,b)}clear(){this.root=null;}insertLeaf(a,b){const e=this.findBestSibling(a.box),c=e.parent;void 0===b?b=this.createInternalNode(c,e,a):(b.parent=c,b.left=e,b.right=a),e.parent=b,a.parent=b,null===c?this.root=b:c.left===e?c.left=b:c.right=b,this.refitAndRotate(a,e);}createLeafNode(a,b){return {box:b,object:a,parent:null}}createInternalNode(a,b,e){return {parent:a,left:b,right:e,box:new this._typeArray(6)}}findBestSibling(a){const b=this.root;let e=b,c=ke(a,b.box);const t=je(a);if(void 0!==b.object)return b;const d=this._sortedList;d.clear();let n={node:b,inheritedCost:c-je(b.box)};do{const{node:b,inheritedCost:i}=n;if(t+i>=c)break;const r=b.left,f=b.right,o=ke(a,r.box)+i,h=o-je(r.box),s=ke(a,f.box)+i,l=s-je(f.box);if(o>s?c>s&&(e=f,c=s):c>o&&(e=r,c=o),l>h){if(t+h>=c||(void 0===r.object&&d.push({node:r,inheritedCost:h}),t+l>=c))continue;void 0===f.object&&d.push({node:f,inheritedCost:l});}else {if(t+l>=c||(void 0===f.object&&d.push({node:f,inheritedCost:l}),t+h>=c))continue;void 0===r.object&&d.push({node:r,inheritedCost:h});}}while(n=d.pop());return e}refit(a){for(ge(a.left.box,a.right.box,a.box);a=a.parent;)if(!ue(a.left.box,a.right.box,a.box))return}refitAndRotate(a,b){const e=a.box,c=(a=a.parent).box;for(ge(e,b.box,c);a=a.parent;){if(!me(e,a.box))return;const b=a.left,c=a.right,t=b.box,d=c.box;let n=null,i=null,r=0;if(void 0===c.object){const a=c.left,e=c.right,d=je(c.box),f=d-ke(t,a.box),o=d-ke(t,e.box);f>o?f>0&&(n=b,i=e,r=f):o>0&&(n=b,i=a,r=o);}if(void 0===b.object){const a=b.left,e=b.right,t=je(b.box),f=t-ke(d,a.box),o=t-ke(d,e.box);f>o?f>r&&(n=c,i=e):o>r&&(n=c,i=a);}null!==n&&this.swap(n,i);}}swap(a,b){const e=a.parent,c=b.parent,t=c.box;e.left===a?e.left=b:e.right=b,c.left===b?c.left=a:c.right=a,a.parent=c,b.parent=e,ge(c.left.box,c.right.box,t);}};class ve{constructor(a,b){this.coordinateSystem=b,this.array=a?new Float64Array(24):new Float32Array(24);}setFromProjectionMatrix(a){if(this.updatePlane(0,a[3]+a[0],a[7]+a[4],a[11]+a[8],a[15]+a[12]),this.updatePlane(1,a[3]-a[0],a[7]-a[4],a[11]-a[8],a[15]-a[12]),this.updatePlane(2,a[3]-a[1],a[7]-a[5],a[11]-a[9],a[15]-a[13]),this.updatePlane(3,a[3]+a[1],a[7]+a[5],a[11]+a[9],a[15]+a[13]),this.updatePlane(4,a[3]-a[2],a[7]-a[6],a[11]-a[10],a[15]-a[14]),0===this.coordinateSystem)this.updatePlane(5,a[3]+a[2],a[7]+a[6],a[11]+a[10],a[15]+a[14]);else {if(1!==this.coordinateSystem)throw new Error("Invalid coordinate system: "+this.coordinateSystem);this.updatePlane(5,a[2],a[6],a[10],a[14]);}return this}updatePlane(a,b,e,c,t){const d=this.array,n=4*a,i=Math.sqrt(b*b+e*e+c*c);d[n+0]=b/i,d[n+1]=e/i,d[n+2]=c/i,d[n+3]=t/i;}intersectsBoxMask(a,b){const e=this.array;let c,t,d,n,i,r;for(let f=0;f<6;f++){if(!(b&32>>f))continue;const o=4*f,h=e[o+0],s=e[o+1],l=e[o+2],g=e[o+3];if(h>0?(c=a[1],n=a[0]):(c=a[0],n=a[1]),s>0?(t=a[3],i=a[2]):(t=a[2],i=a[3]),l>0?(d=a[5],r=a[4]):(d=a[4],r=a[5]),h*c+s*t+l*d<-g)return  -1;h*n+s*i+l*r>-g&&(b^=32>>f);}return b}isIntersected(a,b){const e=this.array;for(let c=0;c<6;c++){if(!(b&32>>c))continue;const t=4*c,d=e[t+0],n=e[t+1],i=e[t+2],r=e[t+3];if(d*(d>0?a[1]:a[0])+n*(n>0?a[3]:a[2])+i*(i>0?a[5]:a[4])<-r)return  false}return  true}isIntersectedMargin(a,b,e){if(0===b)return  true;const c=this.array;for(let t=0;t<6;t++){if(!(b&32>>t))continue;const d=4*t,n=c[d+0],i=c[d+1],r=c[d+2],f=c[d+3];if(n*(n>0?a[1]-e:a[0]+e)+i*(i>0?a[3]-e:a[2]+e)+r*(r>0?a[5]-e:a[4]+e)<-f)return  false}return  true}}function Ee(a,b,e,c,t,d){let n=c[0],i=b[0],r=e[0],f=(a[n]-i)*r,o=(a[1^n]-i)*r,h=f>0?f:0,s=o<1/0?o:1/0;return n=c[1],i=b[1],r=e[1],f=(a[n+2]-i)*r,!(f>s||(o=(a[3^n]-i)*r,h>o)||(h=f>h?f:h,s=o<s?o:s,n=c[2],i=b[2],r=e[2],f=(a[n+4]-i)*r,f>s)||(o=(a[5^n]-i)*r,h>o))&&(h=f>h?f:h,s=o<s?o:s,h<=d&&s>=t)}function Ae(a,b){return a[1]>=b[0]&&b[1]>=a[0]&&a[3]>=b[2]&&b[3]>=a[2]&&a[5]>=b[4]&&b[5]>=a[4]}let Fe=class{constructor(a,b=0){this._sign=new Uint8Array(3),this.builder=a;const e=a.highPrecision;this.frustum=new ve(e,b),this._dirInv=e?new Float64Array(3):new Float32Array(3);}get root(){return this.builder.root}createFromArray(a,b,e,c){(null==a?void 0:a.length)>0&&this.builder.createFromArray(a,b,e,c);}insert(a,b,e){return this.builder.insert(a,b,e)}insertRange(a,b,e,c){(null==a?void 0:a.length)>0&&this.builder.insertRange(a,b,e,c);}move(a,b){this.builder.move(a,b);}delete(a){return this.builder.delete(a)}clear(){this.builder.clear();}traverse(a){null!==this.root&&function b(e,c){if(void 0!==e.object)return void a(e,c);a(e,c)||(b(e.left,c+1),b(e.right,c+1));}(this.root,0);}intersectsRay(a,b,e,c=0,t=1/0){if(null===this.root)return  false;const d=this._dirInv,n=this._sign;return d[0]=1/a[0],d[1]=1/a[1],d[2]=1/a[2],n[0]=d[0]<0?1:0,n[1]=d[1]<0?1:0,n[2]=d[2]<0?1:0,function a(i){return !!Ee(i.box,b,d,n,c,t)&&(void 0!==i.object?e(i.object):a(i.left)||a(i.right))}(this.root)}intersectsBox(a,b){return null!==this.root&&function e(c){return !!Ae(a,c.box)&&(void 0!==c.object?b(c.object):e(c.left)||e(c.right))}(this.root)}intersectsSphere(a,b,e){return null!==this.root&&function c(t){return !!function(a,b,e){return ye(e,a)<=b*b}(a,b,t.box)&&(void 0!==t.object?e(t.object):c(t.left)||c(t.right))}(this.root)}isNodeIntersected(a,b){const e=a.box;let c;for(;c=a.parent;){if(t(c.left===a?c.right:c.left))return  true;a=c;}return  false;function t(a){return !!Ae(e,a.box)&&(void 0!==a.object?b(a.object):t(a.left)||t(a.right))}}rayIntersections(a,b,e,c=0,t=1/0){if(null===this.root)return;const d=this._dirInv,n=this._sign;d[0]=1/a[0],d[1]=1/a[1],d[2]=1/a[2],n[0]=d[0]<0?1:0,n[1]=d[1]<0?1:0,n[2]=d[2]<0?1:0,function a(i){if(Ee(i.box,b,d,n,c,t)){if(void 0!==i.object)return void e(i.object);a(i.left),a(i.right);}}(this.root);}frustumCulling(a,b){if(null===this.root)return;const e=this.frustum.setFromProjectionMatrix(a);function c(a){ void 0===a.object?(c(a.left),c(a.right)):b(a,e,0);}!function a(t,d){if(void 0!==t.object)return void(e.isIntersected(t.box,d)&&b(t,e,d));if(!((d=e.intersectsBoxMask(t.box,d))<0)){if(0===d)return c(t.left),void c(t.right);a(t.left,d),a(t.right,d);}}(this.root,63);}frustumCullingLOD(a,b,e,c){if(null===this.root)return;const t=this.frustum.setFromProjectionMatrix(a);function d(a,b){null===b&&(b=n(a.box)),void 0===a.object?(d(a.left,b),d(a.right,b)):c(a,b,t,0);}function n(a){const{min:c,max:t}=function(a,b){let e,c,t,d,n,i;const r=a[0]-b[0],f=b[0]-a[1];r>f?(e=r,c=f):(e=f,c=r),e<0&&(e=0);const o=a[2]-b[1],h=b[1]-a[3];o>h?(t=o,d=h):(t=h,d=o),t<0&&(t=0);const s=a[4]-b[2],l=b[2]-a[5];return s>l?(n=s,i=l):(n=l,i=s),n<0&&(n=0),{min:e*e+t*t+n*n,max:c*c+d*d+i*i}}(a,b);for(let a=e.length-1;a>0;a--)if(t>=e[a])return c>=e[a]?a:null;return 0}!function a(b,e,i){const r=b.box;if(null===i&&(i=n(r)),void 0!==b.object)return void(t.isIntersected(r,e)&&c(b,i,t,e));if(e=t.intersectsBoxMask(r,e),!(e<0)){if(0===e)return d(b.left,i),void d(b.right,i);a(b.left,e,i),a(b.right,e,i);}}(this.root,63,null);}closestPointToPoint(a,b){if(null===this.root)return;let e=1/0;return function c(t){if(void 0!==t.object){if(b){const c=b(t.object)??ye(t.box,a);c<e&&(e=c);}else e=ye(t.box,a);return}const d=ye(t.left.box,a),n=ye(t.right.box,a);d<n?d<e&&(c(t.left),n<e&&c(t.right)):n<e&&(c(t.right),d<e&&c(t.left));}(this.root),Math.sqrt(e)}};function Ie(a,b){return b[0]=a.x,b[1]=a.y,b[2]=a.z,b}function Be(a,b){const e=a.min,c=a.max;return b[0]=e.x,b[1]=c.x,b[2]=e.y,b[3]=c.y,b[4]=e.z,b[5]=c.z,b}class ze{constructor(a,b,e=0,c=true){this.nodesMap=new Map,this._origin=new Float32Array(3),this._dir=new Float32Array(3),this._cameraPos=new Float32Array(3),this._boxArray=new Float32Array(6),this.target=a,this.accurateCulling=c,this._margin=e,this.bvh=new Fe(new we,2e3===b?0:1);}create(){const a=this.target.instanceCount,b=this.target._instanceInfo.length,e=this.target._instanceInfo,c=new Array(a),t=new Uint32Array(a);let d=0;this.clear();for(let a=0;a<b;a++)e[a].active&&(c[d]=this.getBox(a,new Float32Array(6)),t[d]=a,d++);this.bvh.createFromArray(t,c,(a=>{this.nodesMap.set(a.object,a);}),this._margin);}insert(a){const b=this.bvh.insert(a,this.getBox(a,new Float32Array(6)),this._margin);this.nodesMap.set(a,b);}insertRange(a){const b=a.length,e=new Array(b);for(let c=0;c<b;c++)e[c]=this.getBox(a[c],new Float32Array(6));this.bvh.insertRange(a,e,this._margin,(a=>{this.nodesMap.set(a.object,a);}));}move(a){const b=this.nodesMap.get(a);b&&(this.getBox(a,b.box),this.bvh.move(b,this._margin));}delete(a){const b=this.nodesMap.get(a);b&&(this.bvh.delete(b),this.nodesMap.delete(a));}clear(){this.bvh.clear(),this.nodesMap.clear();}frustumCulling(a,b){this._margin>0&&this.accurateCulling?this.bvh.frustumCulling(a.elements,((a,e,c)=>{e.isIntersectedMargin(a.box,c,this._margin)&&b(a);})):this.bvh.frustumCulling(a.elements,b);}raycast(a,b){const e=a.ray,c=this._origin,t=this._dir;Ie(e.origin,c),Ie(e.direction,t),this.bvh.rayIntersections(t,c,b,a.near,a.far);}intersectBox(a,b){const e=this._boxArray;return Be(a,e),this.bvh.intersectsBox(e,b)}getBox(a,b){const e=this.target,c=e._instanceInfo[a].geometryIndex;return e.getBoundingBoxAt(c,He).applyMatrix4(e.getMatrixAt(a,Me)),Be(He,b),b}}const He=new Box3,Me=new Matrix4;function Oe(a,b){return Math.max(b,Math.ceil(Math.sqrt(a/b))*b)}class Se extends DataTexture{constructor(a,b,e,c,t,d){3===b&&(b=4);const{array:n,format:i,size:r,type:f}=function(a,b,e,c){3===b&&(console.warn('"channels" cannot be 3. Set to 4. More info: https://github.com/mrdoob/three.js/pull/23228'),b=4);const t=Oe(c,e),d=new a(t*t*b),n=a.name.includes("Float"),i=a.name.includes("Uint"),r=n?FloatType:i?UnsignedIntType:IntType;let f;switch(b){case 1:f=n?RedFormat:RedIntegerFormat;break;case 2:f=n?RGFormat:RGIntegerFormat;break;case 4:f=n?RGBAFormat:RGBAIntegerFormat;}return {array:d,size:t,type:r,format:f}}(a,b,e,c);super(n,r,r,i,f),this.partialUpdate=true,this.maxUpdateCalls=1/0,this._utils=null,this._needsUpdate=false,this._lastWidth=null,this._data=n,this._channels=b,this._pixelsPerInstance=e,this._stride=e*b,this._rowToUpdate=new Array(r),this._uniformMap=t,this._fetchUniformsInFragmentShader=d,this.needsUpdate=true;}resize(a){const b=Oe(a,this._pixelsPerInstance);if(b===this.image.width)return;const e=this._data,c=this._channels;this._rowToUpdate.length=b;const t=e.constructor,d=new t(b*b*c),n=Math.min(e.length,d.length);d.set(new t(e.buffer,0,n)),this.dispose(),this.image={data:d,height:b,width:b},this._data=d;}enqueueUpdate(a){if(this._needsUpdate=true,!this.partialUpdate)return;const b=this.image.width/this._pixelsPerInstance,e=Math.floor(a/b);this._rowToUpdate[e]=true;}update(a){const b=a.properties.get(this),e=this.version>0&&b.__version!==this.version,c=null!==this._lastWidth&&this._lastWidth!==this.image.width;if(!this._needsUpdate||!b.__webglTexture||e||c)return this._lastWidth=this.image.width,void(this._needsUpdate=false);if(this._needsUpdate=false,!this.partialUpdate)return void(this.needsUpdate=true);const t=this.getUpdateRowsInfo();0!==t.length&&(t.length>this.maxUpdateCalls?this.needsUpdate=true:this.updateRows(b,a,t),this._rowToUpdate.fill(false));}getUpdateRowsInfo(){const a=this._rowToUpdate,b=[];for(let e=0,c=a.length;e<c;e++)if(a[e]){const t=e;for(;e<c&&a[e];e++);b.push({row:t,count:e-t});}return b}updateRows(a,b,e){const c=b.state,t=b.getContext();this._utils??(this._utils=new WebGLUtils(t,b.extensions,b.capabilities));const d=this._utils.convert(this.format),n=this._utils.convert(this.type),{data:i,width:r}=this.image,f=this._channels;c.bindTexture(t.TEXTURE_2D,a.__webglTexture);const o=ColorManagement.getPrimaries(ColorManagement.workingColorSpace),h=this.colorSpace===NoColorSpace?null:ColorManagement.getPrimaries(this.colorSpace),s=this.colorSpace===NoColorSpace||o===h?t.NONE:t.BROWSER_DEFAULT_WEBGL;t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL,this.flipY),t.pixelStorei(t.UNPACK_PREMULTIPLY_ALPHA_WEBGL,this.premultiplyAlpha),t.pixelStorei(t.UNPACK_ALIGNMENT,this.unpackAlignment),t.pixelStorei(t.UNPACK_COLORSPACE_CONVERSION_WEBGL,s);for(const{count:a,row:b}of e)t.texSubImage2D(t.TEXTURE_2D,0,0,b,r,a,d,n,i,b*r*f);this.onUpdate&&this.onUpdate(this);}setUniformAt(a,b,e){const{offset:c,size:t}=this._uniformMap.get(b),d=this._stride;1===t?this._data[a*d+c]=e:e.toArray(this._data,a*d+c);}getUniformAt(a,b,e){const{offset:c,size:t}=this._uniformMap.get(b),d=this._stride;return 1===t?this._data[a*d+c]:e.fromArray(this._data,a*d+c)}getUniformsGLSL(a,b,e){return {vertex:this.getUniformsVertexGLSL(a,b,e),fragment:this.getUniformsFragmentGLSL(a,b,e)}}getUniformsVertexGLSL(a,b,e){if(this._fetchUniformsInFragmentShader)return `\n        flat varying ${e} ez_v${b}; \n        void main() {\n          ez_v${b} = ${b};`;const c=this.texelsFetchGLSL(a,b),t=this.getFromTexelsGLSL(),{assignVarying:d,declareVarying:n}=this.getVarying();return `\n      uniform highp sampler2D ${a};  \n      ${n}\n      void main() {\n        ${c}\n        ${t}\n        ${d}`}getUniformsFragmentGLSL(a,b,e){if(!this._fetchUniformsInFragmentShader){const{declareVarying:a,getVarying:b}=this.getVarying();return `\n      ${a}\n      void main() {\n        ${b}`}return `\n      uniform highp sampler2D ${a};  \n      flat varying ${e} ez_v${b};\n      void main() {\n        ${this.texelsFetchGLSL(a,`ez_v${b}`)}\n        ${this.getFromTexelsGLSL()}`}texelsFetchGLSL(a,b){const e=this._pixelsPerInstance;let c=`\n      int size = textureSize(${a}, 0).x;\n      int j = int(${b}) * ${e};\n      int x = j % size;\n      int y = j / size;\n    `;for(let b=0;b<e;b++)c+=`vec4 ez_texel${b} = texelFetch(${a}, ivec2(x + ${b}, y), 0);\n`;return c}getFromTexelsGLSL(){const a=this._uniformMap;let b="";for(const[e,{type:c,offset:t,size:d}]of a){const a=Math.floor(t/this._channels);if("mat3"===c)b+=`mat3 ${e} = mat3(ez_texel${a}.rgb, vec3(ez_texel${a}.a, ez_texel${a+1}.rg), vec3(ez_texel${a+1}.ba, ez_texel${a+2}.r));\n`;else if("mat4"===c)b+=`mat4 ${e} = mat4(ez_texel${a}, ez_texel${a+1}, ez_texel${a+2}, ez_texel${a+3});\n`;else {b+=`${c} ${e} = ez_texel${a}.${this.getUniformComponents(t,d)};\n`;}}return b}getVarying(){const a=this._uniformMap;let b="",e="",c="";for(const[t,{type:d}]of a)b+=`flat varying ${d} ez_v${t};\n`,e+=`ez_v${t} = ${t};\n`,c+=`${d} ${t} = ez_v${t};\n`;return {declareVarying:b,assignVarying:e,getVarying:c}}getUniformComponents(a,b){const e=a%this._channels;let c="";for(let a=0;a<b;a++)c+=Re[e+a];return c}copy(a){return super.copy(a),this.partialUpdate=a.partialUpdate,this.maxUpdateCalls=a.maxUpdateCalls,this._channels=a._channels,this._pixelsPerInstance=a._pixelsPerInstance,this._stride=a._stride,this._rowToUpdate=a._rowToUpdate,this._uniformMap=a._uniformMap,this._fetchUniformsInFragmentShader=a._fetchUniformsInFragmentShader,this}}const Re=["r","g","b","a"];function Pe(a,b={}){this.bvh=new ze(this,a,b.margin,b.accurateCulling),this.bvh.create();}function qe(a){const b={get:a=>a.zSort,aux:new Array(a.maxInstanceCount),reversed:null};return function(e){b.reversed=a.material.transparent,a.maxInstanceCount>b.aux.length&&(b.aux.length=a.maxInstanceCount);let c=1/0,t=-1/0;for(const{z:a}of e)a>t&&(t=a),a<c&&(c=a);const d=(2**32-1)/(t-c);for(const a of e)a.zSort=(a.z-c)*d;radixSort(e,b);}}function Ue(a,b){return a.z-b.z}function Ke(a,b){return b.z-a.z}const Je=new Frustum,Ne=new class{constructor(){this.array=[],this.pool=[];}push(a,b,e,c){const t=this.pool,d=this.array,n=d.length;n>=t.length&&t.push({start:null,count:null,z:null,zSort:null,index:null});const i=t[n];i.index=a,i.start=e,i.count=c,i.z=b,d.push(i);}reset(){this.array.length=0;}},Te=new Matrix4,Ge=new Matrix4,De=new Vector3,Ce=new Vector3,Le=new Vector3,We=new Vector3,Ve=new Sphere;function Qe(a,b,e,c,t,d){this.frustumCulling(e);}function Xe(a,b=a){if(!this._visibilityChanged&&!this.perObjectFrustumCulled&&!this.sortObjects)return;this._indirectTexture.needsUpdate=true,this._visibilityChanged=false;const e=this.sortObjects,c=this.perObjectFrustumCulled;if(c||e){if(Ge.copy(this.matrixWorld).invert(),Ce.setFromMatrixPosition(a.matrixWorld).applyMatrix4(Ge),Le.setFromMatrixPosition(b.matrixWorld).applyMatrix4(Ge),De.set(0,0,-1).transformDirection(a.matrixWorld).transformDirection(Ge),c?(Te.multiplyMatrices(a.projectionMatrix,a.matrixWorldInverse).multiply(this.matrixWorld),this.bvh?this.BVHCulling(a,b):this.linearCulling(a,b)):this.updateRenderList(),e){const a=this.geometry.getIndex(),b=null===a?1:a.array.BYTES_PER_ELEMENT,e=this._multiDrawStarts,c=this._multiDrawCounts,t=this._indirectTexture.image.data,d=this.customSort;null===d?Ne.array.sort(this.material.transparent?Ke:Ue):d(Ne.array);const n=Ne.array,i=n.length;for(let a=0;a<i;a++){const d=n[a];e[a]=d.start*b,c[a]=d.count,t[a]=d.index;}Ne.reset();}}else this.updateIndexArray();}function Ye(){if(!this._visibilityChanged)return;const a=this.geometry.getIndex(),b=null===a?1:a.array.BYTES_PER_ELEMENT,e=this._instanceInfo,c=this._geometryInfo,t=this._multiDrawStarts,d=this._multiDrawCounts,n=this._indirectTexture.image.data;let i=0;for(let a=0,r=e.length;a<r;a++){const r=e[a];if(r.visible&&r.active){const e=c[r.geometryIndex];t[i]=e.start*b,d[i]=e.count,n[i]=a,i++;}}this._multiDrawCount=i;}function _e(){const a=this._instanceInfo,b=this._geometryInfo;for(let e=0,c=a.length;e<c;e++){const c=a[e];if(c.visible&&c.active){const a=b[c.geometryIndex],t=this.getPositionAt(e).sub(Ce).dot(De);Ne.push(e,t,a.start,a.count);}}this._multiDrawCount=Ne.array.length;}function Ze(a,b){const e=this.geometry.getIndex(),c=null===e?1:e.array.BYTES_PER_ELEMENT,t=this._instanceInfo,d=this._geometryInfo,n=this.sortObjects,i=this._multiDrawStarts,r=this._multiDrawCounts,f=this._indirectTexture.image.data,o=this.onFrustumEnter;let h=0;this.bvh.frustumCulling(Te,(e=>{const s=e.object,l=t[s];if(!l.visible)return;const g=l.geometryIndex,u=d[g],m=u.LOD;let p,j;if(m){const e=this.getPositionAt(s).distanceToSquared(Le),c=this.getLODIndex(m,e);if(o&&!o(s,a,b,c))return;p=m[c].start,j=m[c].count;}else {if(o&&!o(s,a))return;p=u.start,j=u.count;}if(n){const a=this.getPositionAt(s).sub(Ce).dot(De);Ne.push(s,a,p,j);}else i[h]=p*c,r[h]=j,f[h]=s,h++;})),this._multiDrawCount=n?Ne.array.length:h;}function $e(a,b){const e=this.geometry.getIndex(),c=null===e?1:e.array.BYTES_PER_ELEMENT,t=this._instanceInfo,d=this._geometryInfo,n=this.sortObjects,i=this._multiDrawStarts,r=this._multiDrawCounts,f=this._indirectTexture.image.data,o=this.onFrustumEnter;let h=0;Je.setFromProjectionMatrix(Te);for(let e=0,s=t.length;e<s;e++){const s=t[e];if(!s.visible||!s.active)continue;const l=d[s.geometryIndex],g=l.LOD;let u,m;const p=l.boundingSphere,j=p.radius,k=p.center;if(0===k.x&&0===k.y&&0===k.z){const a=this.getPositionAndMaxScaleOnAxisAt(e,Ve.center);Ve.radius=j*a;}else this.applyMatrixAtToSphere(e,Ve,k,j);if(Je.intersectsSphere(Ve)){if(g){const c=Ve.center.distanceToSquared(Le),t=this.getLODIndex(g,c);if(o&&!o(e,a,b,t))continue;u=g[t].start,m=g[t].count;}else {if(o&&!o(e,a))continue;u=l.start,m=l.count;}if(n){const a=We.subVectors(Ve.center,Ce).dot(De);Ne.push(e,a,u,m);}else i[h]=u*c,r[h]=m,f[h]=e,h++;}}this._multiDrawCount=n?Ne.array.length:h;}const ac=new Vector3;function bc(a,b=ac){const e=16*a,c=this._matricesTexture.image.data;return b.x=c[e+12],b.y=c[e+13],b.z=c[e+14],b}function ec(a,b){const e=16*a,c=this._matricesTexture.image.data,t=c[e+0],d=c[e+1],n=c[e+2],i=t*t+d*d+n*n,r=c[e+4],f=c[e+5],o=c[e+6],h=r*r+f*f+o*o,s=c[e+8],l=c[e+9],g=c[e+10],u=s*s+l*l+g*g;return b.x=c[e+12],b.y=c[e+13],b.z=c[e+14],Math.sqrt(Math.max(i,h,u))}function cc(a,b,e,c){const t=16*a,d=this._matricesTexture.image.data,n=d[t+0],i=d[t+1],r=d[t+2],f=d[t+3],o=d[t+4],h=d[t+5],s=d[t+6],l=d[t+7],g=d[t+8],u=d[t+9],m=d[t+10],p=d[t+11],j=d[t+12],k=d[t+13],y=d[t+14],x=d[t+15],w=b.center,v=e.x,E=e.y,A=e.z,F=1/(f*v+l*E+p*A+x);w.x=(n*v+o*E+g*A+j)*F,w.y=(i*v+h*E+u*A+k)*F,w.z=(r*v+s*E+m*A+y)*F;const I=n*n+i*i+r*r,B=o*o+h*h+s*s,z=g*g+u*u+m*m;b.radius=c*Math.sqrt(Math.max(I,B,z));}function tc(a,b,e,c=0){const t=this._geometryInfo[a];e=e**2,t.LOD??(t.LOD=[{start:t.start,count:t.count,distance:0,hysteresis:0}]);const d=t.LOD,n=d[d.length-1],i=n.start+n.count,r=b.index.count;if(i-t.start+r>t.reservedIndexCount)throw new Error("BatchedMesh LOD: Reserved space request exceeds the maximum buffer size.");d.push({start:i,count:r,distance:e,hysteresis:c});const f=b.getIndex().array,o=this.geometry.getIndex(),h=o.array,s=t.vertexStart;for(let a=0;a<r;a++)h[i+a]=f[a]+s;o.needsUpdate=true;}function dc(a,b){for(let e=a.length-1;e>0;e--){const c=a[e];if(b>=c.distance-c.distance*c.hysteresis)return e}return 0}const nc=[],ic=new Mesh,rc=new Ray$1,fc=new Vector3,oc=new Vector3,hc=new Matrix4;function sc(a,b){var e,c;if(!this.material||0===this.instanceCount)return;ic.geometry=this.geometry,ic.material=this.material,(e=ic.geometry).boundingBox??(e.boundingBox=new Box3),(c=ic.geometry).boundingSphere??(c.boundingSphere=new Sphere);const d=a.ray,n=a.near,i=a.far;hc.copy(this.matrixWorld).invert(),oc.setFromMatrixScale(this.matrixWorld),fc.copy(a.ray.direction).multiply(oc);const f=fc.length();if(a.ray=rc.copy(a.ray).applyMatrix4(hc),a.near/=f,a.far/=f,this.bvh)this.bvh.raycast(a,(e=>this.checkInstanceIntersection(a,e,b)));else if(null===this.boundingSphere&&this.computeBoundingSphere(),a.ray.intersectsSphere(this.boundingSphere))for(let e=0,c=this._instanceInfo.length;e<c;e++)this.checkInstanceIntersection(a,e,b);a.ray=d,a.near=n,a.far=i;}function lc(a,b,e){const c=this._instanceInfo[b];if(!c.active||!c.visible)return;const t=c.geometryIndex,d=this._geometryInfo[t];this.getMatrixAt(b,ic.matrixWorld),ic.geometry.boundsTree=this.boundsTrees?this.boundsTrees[t]:void 0,ic.geometry.boundsTree||(this.getBoundingBoxAt(t,ic.geometry.boundingBox),this.getBoundingSphereAt(t,ic.geometry.boundingSphere),ic.geometry.setDrawRange(d.start,d.count)),ic.raycast(a,nc);for(const a of nc)a.batchId=b,a.object=this,e.push(a);nc.length=0;}function gc(a,b,e){if(!this.uniformsTexture)throw new Error('Before get/set uniform, it\'s necessary to use "initUniformsPerInstance".');return this.uniformsTexture.getUniformAt(a,b,e)}function uc(a,b,e){if(!this.uniformsTexture)throw new Error('Before get/set uniform, it\'s necessary to use "initUniformsPerInstance".');this.uniformsTexture.setUniformAt(a,b,e),this.uniformsTexture.enqueueUpdate(a);}function mc(a){if(this.uniformsTexture)throw new Error('"initUniformsPerInstance" must be called only once.');const{channels:b,pixelsPerInstance:e,uniformMap:c,fetchInFragmentShader:t}=function(a){let b=0;const e=new Map,c=[],t=a.vertex??{},d=a.fragment??{};let n=true;for(const a in t){const e=t[a],d=jc(e);b+=d,c.push({name:a,type:e,size:d}),n=false;}for(const a in d)if(!t[a]){const e=d[a],t=jc(e);b+=t,c.push({name:a,type:e,size:t});}c.sort(((a,b)=>b.size-a.size));const i=[];for(const{name:a,size:b,type:t}of c){const c=pc(b,i);e.set(a,{offset:c,size:b,type:t});}const r=Math.ceil(b/4);return {channels:Math.min(b,4),pixelsPerInstance:r,uniformMap:e,fetchInFragmentShader:n}}(a);this.uniformsTexture=new Se(Float32Array,b,e,this.maxInstanceCount,c,t),function(a){const b=a.material,e=b.onBeforeCompile.bind(b);b.onBeforeCompile=(b,c)=>{if(a.uniformsTexture){b.uniforms.uniformsTexture={value:a.uniformsTexture};const{vertex:e,fragment:c}=a.uniformsTexture.getUniformsGLSL("uniformsTexture","batchIndex","float");b.vertexShader=b.vertexShader.replace("void main() {",e),b.fragmentShader=b.fragmentShader.replace("void main() {",c),b.vertexShader=b.vertexShader.replace("void main() {","void main() { float batchIndex = getIndirectIndex( gl_DrawID );");}e(b,c);};}(this);}function pc(a,b){if(a<4)for(let e=0;e<b.length;e++)if(b[e]+a<=4){const c=4*e+b[e];return b[e]+=a,c}const e=4*b.length;for(;a>0;a-=4)b.push(a);return e}function jc(a){switch(a){case "float":return 1;case "vec2":return 2;case "vec3":return 3;case "vec4":return 4;case "mat3":return 9;case "mat4":return 16;default:throw new Error(`Invalid uniform type: ${a}`)}}function kc(){BatchedMesh.prototype.computeBVH=Pe,BatchedMesh.prototype.onBeforeRender=Qe,BatchedMesh.prototype.frustumCulling=Xe,BatchedMesh.prototype.updateIndexArray=Ye,BatchedMesh.prototype.updateRenderList=_e,BatchedMesh.prototype.BVHCulling=Ze,BatchedMesh.prototype.linearCulling=$e,BatchedMesh.prototype.getPositionAt=bc,BatchedMesh.prototype.getPositionAndMaxScaleOnAxisAt=ec,BatchedMesh.prototype.applyMatrixAtToSphere=cc,BatchedMesh.prototype.addGeometryLOD=tc,BatchedMesh.prototype.getLODIndex=dc,BatchedMesh.prototype.raycast=sc,BatchedMesh.prototype.checkInstanceIntersection=lc,BatchedMesh.prototype.getUniformAt=gc,BatchedMesh.prototype.setUniformAt=uc,BatchedMesh.prototype.initUniformsPerInstance=mc;}function yc(a){let b=0,e=0;for(const c of a)b+=c.attributes.position.count,e+=c.index.count;return {vertexCount:b,indexCount:e}}function xc(a){const b=[];let e=0,c=0;for(const t of a){let a=0;for(const b of t){const t=b.index.count;c+=t,a+=t,e+=b.attributes.position.count;}b.push(a);}return {vertexCount:e,indexCount:c,LODIndexCount:b}}!function(){var a,b=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if("object"!=typeof WebAssembly)return {supported:false};WebAssembly.instantiate(function(a){for(var e=new Uint8Array(15574),c=0;c<15574;++c){var t=a.charCodeAt(c);e[c]=t>96?t-97:t>64?t-39:t+4;}var d=0;for(c=0;c<15574;++c)e[d++]=e[c]<60?b[e[c]]:64*(e[c]-60)+e[++c];return e.buffer.slice(0,d)}("b9H79Tebbbe9nk9Geueu9Geub9Gbb9Gouuuuuueu9Gvuuuuueu9Gduueu9Gluuuueu9Gvuuuuub9Gouuuuuub9Gluuuub9GiuuueuiYKdilveoveovrrwrrDDoDbqqbelve9Weiiviebeoweuec;G:Qdkr:nlAo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9mW4W2be8A9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWVbd8F9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949c919M9MWV9c9V919U9KbiE9TW79O9V9Wt9FW9U9J9V9KW9wWVtW949wWV79P9V9UblY9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWVbv8E9TW79O9V9Wt9FW9U9J9V9KW69U9KW949c919M9MWV9c9V919U9Kbo8A9TW79O9V9Wt9FW9U9J9V9KW69U9KW949wWV79P9V9UbrE9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JWbwa9TW79O9V9Wt9FW9U9J9V9KW69U9KW949tWG91W9U9JW9c9V919U9KbDL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9p9JtbqK9TW79O9V9Wt9FW9U9J9V9KWS9P2tWV9r919HtbkL9TW79O9V9Wt9FW9U9J9V9KWS9P2tWVT949WbxE9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OWbsa9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94J9H9J9OW9ttV9P9Wbza9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9WbHK9TW79O9V9Wt9F79W9Ht9P9H29t9VVt9sW9T9H9WbOl79IV9RbADwebcekdLQq:X9MKdbk:xhdgud9:8Jjjjjbc;qw9Rgo8Kjjjjbdndnaembcbhrxekabcbyd;C:kjjbgwc:GeV86bbaoc;adfcbcjdz:vjjjb8AdnaiTmbaoc;adfadalzNjjjb8Akaoc;abfalfcbcbcjdal9RalcFe0Ez:vjjjb8Aaoc;abfaoc;adfalzNjjjb8AaocUf9cb83ibaoc8Wf9cb83ibaocyf9cb83ibaocaf9cb83ibaocKf9cb83ibaoczf9cb83ibao9cb83iwao9cb83ibcj;abal9Uc;WFbGcjdalca0EhDdnaicd6mbavcd9imbawTmbadcefhqaDci2gkal2hxaoc;alfclfhmaoc;qlfceVhPaoc;qofclVhsaoc;qofcKfhzaoc;qofczfhHcbhOincdhAcbhrdnavci6mbaz9cb83ibaH9cb83ibao9cb83i;yoao9cb83i;qoadaOfgrybbhCcbhXincbhQcbhLdninaralfhKarybbgYaC7aLVhLaQcP0meaKhraYhCaQcefgQaXfai6mbkkcbhCaoc;qofhQincwh8AcwhEdnaLaC93grcFeGg3cs0mbclhEa3ci0mba3cb9hcethEkdnarcw4cFeGg3cs0mbclh8Aa3ci0mba3cb9hceth8Aka8AaEfh3aQydbh5cwh8AcwhEdnarcz4cFeGg8Ecs0mbclhEa8Eci0mba8Ecb9hcethEka3a5fh3dnarcFFFFb0mbclh8AarcFFF8F0mbarcFFFr0ceth8AkaQa3aEfa8AfBdbaQclfhQaCcefgCcw9hmbkaKhraYhCaXczfgXai6mbkcbhrcehQashLinaQaraLydbaoc;qofarcdtfydb6EhraLclfhLaQcefgQcw9hmbkcihAkcbh3aoc;qlfcbcjdz:vjjjb8Aaoc;alfcwfcbBdbao9cb83i;alarclth8FadhaaDhhaqh5inaoc;qlfadcba3cufgrara30Eal2falzNjjjb8Aaiahaiah6EhgdnaDaia39Ra3aDfai6EgYcsfc9WGgraY9nmbaoc;qofaYfcbaraY9Rz:vjjjb8Akada3al2fh8Jcbh8Kina8Ka8FVcl4hXaoc;alfa8Kcdtfh8LaOh8Mcbh8Nina8NaOfhQdndndndndndna8KPldebidkaPa8Mc98GgLfhra5aLfh8Aaoc;qlfaQc98GgLfRbbhCcwhQinarRbbaQtaCVhCarcefhraQcwfgQca9hmbkaYTmla8Ncith8Ea8JaLfhEcbhKinaERbbhLcwhra8AhQinaQRbbartaLVhLaQcefhQarcwfgrca9hmbkaoc;qofaKfaLaC7aX93a8E486bba8Aalfh8AaEalfhEaLhCaKcefgKaY9hmbxlkkaYTmia8Mc9:Ghra8NcitcwGhEaoc;qlfaQceVfRbbcwtaoc;qlfaQc9:GfRbbVhLaoc;qofhQaghCinaQa5arfRbbcwtaaarfRbbVg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbaralfhraQcefhQa8AhLa3aCcufgC9hmbxikkaYTmda8JaQfhraoc;qlfaQfRbbhLaoc;qofhQaghCinaQarRbbg8AaL9RgLcetaLcKtcK91cr4786bbaQcefhQaralfhra8AhLa3aCcufgC9hmbxdkkaYTmeka8LydbhEcbhKaoc;qofhrincdhLcbhQinaLaraQfRbbcb9hfhLaQcefgQcz9hmbkclhCcbhQinaCaraQfRbbcd0fhCaQcefgQcz9hmbkcwh8AcbhQina8AaraQfRbbcP0fh8AaQcefgQcz9hmbkaLaCaLaC6EgQa8AaQa8A6EgQczaQcz6EaEfhEarczfhraKczfgKaY6mbka8LaEBdbka8Mcefh8Ma8Ncefg8Ncl9hmbka8Kcefg8KaA9hmbkaaaxfhaahakfhha5axfh5a3akfg3ai6mbkcbhrcehQamhLinaQaraLydbaoc;alfarcdtfydb6EhraLclfhLaQcefgChQaAaC9hmbkaoaOcd4fa8FcdVararcdSE86bbaOclfgOal6mbkkabaefh8Kabcefhralcd4gecbawEhqadcefhHaoc;abfceVhzcbhxdndninaiax9nmeaoc;qofcbcjdz:vjjjb8Aa8Kar9Raq6mdadaxal2gQfhkcbh8JaHaQfhsarcbaqz:vjjjbghaqfh5aDaiax9RaxaDfai6EgPcsfgrcl4cifcd4hAarc9WGg8LThmindndndndndndndndndndnawTmbaoa8Jcd4fRbbgLciGPlbedlbkaPTmdaka8Jfhraoc;abfa8JfRbbhLaoc;qofhQaPhCinaQarRbbg8AaL9RgLcetaLcKtcK91cr4786bbaQcefhQaralfhra8AhLaCcufgCmbxikkaPTmia8JcitcwGhEaoc;abfa8JceVfRbbcwtaoc;abfa8Jc9:GgrfRbbVhLakarfhraoc;qofhQaPhCinaQar8Vbbg8AaL9RgLcetaLcztcz91cs47cFFiGaE486bbaQcefhQaralfhra8AhLaCcufgCmbxdkkaza8Jc98GgEfhrasaEfh8Aaoc;abfaEfRbbhCcwhQinarRbbaQtaCVhCarcefhraQcwfgQca9hmbkaPTmbaLcl4hYa8JcitcKGh3akaEfhEcbhKinaERbbhLcwhra8AhQinaQRbbartaLVhLaQcefhQarcwfgrca9hmbkaoc;qofaKfaLaC7aY93a3486bba8Aalfh8AaEalfhEaLhCaKcefgKaP9hmbkkawmbcbhrxlka8LTmbcbhrdninaoc;qofarfgQcwf8PibaQ8Pib:e9qTmearczfgra8L9pmdxbkkdnavmbcehrxikcbhEaAhKaAhYinaoc;qofaEfgrcwf8Pibhyar8Pibh8PcdhLcbhQinaLaraQfRbbcb9hfhLaQcefgQcz9hmbkclhCcbhQinaCaraQfRbbcd0fhCaQcefgQcz9hmbkcwh8AcbhQina8AaraQfRbbcP0fh8AaQcefgQcz9hmbkaLaCaLaC6Egra8Aara8A6Egrczarcz6EaYfhYarcucbaya8P:e9cb9sEgQaraQ6EaKfhKaEczfgEa8L9pmdxbkkaha8Jcd4fgrarRbbcda8JcetcoGtV86bbxikdnaKaP6mbaYaP6mbaha8Jcd4fgrarRbbcia8JcetcoGtV86bba8Ka59RaP6mra5aoc;qofaPzNjjjbaPfh5xikaKaY9phrkaha8Jcd4fgQaQRbbara8JcetcoGtV86bbka8Ka59RaA6mla5cbaAz:vjjjbgOaAfhYdndna8Lmbamhrxekdna8KaY9RcK9pmbamhrxekarcdtc:q1jjbfcj1jjbawEg5ydxggcetc;:FFFeGh8Fcuh3cuagtcu7cFeGhacbh8Maoc;qofhLinaoc;qofa8MfhXczhEdndndnagPDbeeeeeeedekcucbaXcwf8PibaX8Pib:e9cb9sEhExekcbhra8FhEinaEaaaLarfRbb9nfhEarcefgrcz9hmbkkcih8Ecbh8AinczhQdndndna5a8AcdtfydbgKPDbeeeeeeedekcucbaXcwf8PibaX8Pib:e9cb9sEhQxekaKcetc;:FFFeGhQcuaKtcu7cFeGhCcbhrinaQaCaLarfRbb9nfhQarcefgrcz9hmbkkdndnaQaE6mbaKa39hmeaQaE9hmea5a8EcdtfydbcwSmeka8Ah8EaQhEka8Acefg8Aci9hmbkaOa8Mco4fgrarRbba8Ea8Mci4coGtV86bbdndndna5a8Ecdtfydbg3PDdbbbbbbbebkdncwa39Tg8ETmbcua3tcu7hQdndna3ceSmbcbh8NaLhXinaXhra8Eh8AcbhCinarRbbgEaQcFeGgKaEaK6EaCa3tVhCarcefhra8Acufg8AmbkaYaC86bbaXa8EfhXaYcefhYa8Na8Efg8Ncz6mbxdkkcbh8NaLhXinaXhra8Eh8AcbhCinarRbbgEaQcFeGgKaEaK6EaCcetVhCarcefhra8Acufg8AmbkaYaC:T9cFe:d9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:9ca188bbaXa8EfhXaYcefhYa8Na8Efg8Ncz6mbkkcbhrinaYaLarfRbbgC86bbaYaCaQcFeG9pfhYarcefgrcz9hmbxikkdna3ceSmbinaYcb86bbaYcefhYxbkkinaYcb86bbaYcefhYxbkkaYaX8Pbb83bbaYcwfaXcwf8Pbb83bbaYczfhYka8Mczfg8Ma8L9pgrmeaLczfhLa8KaY9RcK9pmbkkarTmlaYh5aYTmlka8Jcefg8Jal9hmbkaoc;abfakaPcufal2falzNjjjb8AaPaxfhxa5hra5mbkcbhrxdkdna8Kar9RaqalfgQcKcaawEgLaQaL0EgC9pmbcbhrxdkdnaQaL9pmbarcbaCaQ9RgQz:vjjjbaQfhrkaraoc;adfalzNjjjbalfhrdnawTmbaraoaezNjjjbaefhrkarab9Rhrxekcbhrkaoc;qwf8KjjjjbarkCbabaeadaialcdz:bjjjbk9reduaecd4gdaefgicaaica0Eabcj;abae9Uc;WFbGcjdaeca0Egifcufai9Uae2aiadfaicl4cifcd4f2fcefkmbcbabBd;C:kjjbk:Ese5u8Jjjjjbc;ae9Rgl8Kjjjjbcbhvdnaici9UgocHfae0mbabcbyd;m:kjjbgrc;GeV86bbalc;abfcFecjez:vjjjb8AalcUfgw9cu83ibalc8WfgD9cu83ibalcyfgq9cu83ibalcafgk9cu83ibalcKfgx9cu83ibalczfgm9cu83ibal9cu83iwal9cu83ibabaefc9WfhPabcefgsaofhednaiTmbcmcsarcb9kgzEhHcbhOcbhAcbhCcbhXcbhQindnaeaP9nmbcbhvxikaQcufhvadaCcdtfgLydbhKaLcwfydbhYaLclfydbh8AcbhEdndndninalc;abfavcsGcitfgoydlh3dndndnaoydbgoaK9hmba3a8ASmekdnaoa8A9hmba3aY9hmbaEcefhExekaoaY9hmea3aK9hmeaEcdfhEkaEc870mdaXcufhvaLaEciGcx2goc;i1jjbfydbcdtfydbh3aLaoc;e1jjbfydbcdtfydbh8AaLaoc;a1jjbfydbcdtfydbhKcbhodnindnalavcsGcdtfydba39hmbaohYxdkcuhYavcufhvaocefgocz9hmbkkaOa3aOSgvaYce9iaYaH9oVgoGfhOdndndncbcsavEaYaoEgvcs9hmbarce9imba3a3aAa3cefaASgvEgAcefSmecmcsavEhvkasavaEcdtc;WeGV86bbavcs9hmea3aA9Rgvcetavc8F917hvinaeavcFb0crtavcFbGV86bbaecefheavcje6hoavcr4hvaoTmbka3hAxvkcPhvasaEcdtcPV86bba3hAkavTmiavaH9omicdhocehEaQhYxlkavcufhvaEclfgEc;ab9hmbkkdnaLceaYaOSceta8AaOSEcx2gvc;a1jjbfydbcdtfydbgKTaLavc;e1jjbfydbcdtfydbg8AceSGaLavc;i1jjbfydbcdtfydbg3cdSGaOcb9hGazGg5ce9hmbaw9cu83ibaD9cu83ibaq9cu83ibak9cu83ibax9cu83ibam9cu83ibal9cu83iwal9cu83ibcbhOkcbhEaXcufgvhodnindnalaocsGcdtfydba8A9hmbaEhYxdkcuhYaocufhoaEcefgEcz9hmbkkcbhodnindnalavcsGcdtfydba39hmbaohExdkcuhEavcufhvaocefgocz9hmbkkaOaKaOSg8EfhLdndnaYcm0mbaYcefhYxekcbcsa8AaLSgvEhYaLavfhLkdndnaEcm0mbaEcefhExekcbcsa3aLSgvEhEaLavfhLkc9:cua8EEh8FcbhvaEaYcltVgacFeGhodndndninavc:W1jjbfRbbaoSmeavcefgvcz9hmbxdkka5aKaO9havcm0VVmbasavc;WeV86bbxekasa8F86bbaeaa86bbaecefhekdna8EmbaKaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombkaKhAkdnaYcs9hmba8AaA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka8AhAkdnaEcs9hmba3aA9Rgvcetavc8F917hvinaeavcFb0gocrtavcFbGV86bbavcr4hvaecefheaombka3hAkalaXcdtfaKBdbaXcefcsGhvdndnaYPzbeeeeeeeeeeeeeebekalavcdtfa8ABdbaXcdfcsGhvkdndnaEPzbeeeeeeeeeeeeeebekalavcdtfa3BdbavcefcsGhvkcihoalc;abfaQcitfgEaKBdlaEa8ABdbaQcefcsGhYcdhEavhXaLhOxekcdhoalaXcdtfa3BdbcehEaXcefcsGhXaQhYkalc;abfaYcitfgva8ABdlava3Bdbalc;abfaQaEfcsGcitfgva3BdlavaKBdbascefhsaQaofcsGhQaCcifgCai6mbkkdnaeaP9nmbcbhvxekcbhvinaeavfavc:W1jjbfRbb86bbavcefgvcz9hmbkaeab9Ravfhvkalc;aef8KjjjjbavkZeeucbhddninadcefgdc8F0meceadtae6mbkkadcrfcFeGcr9Uci2cdfabci9U2cHfkmbcbabBd;m:kjjbk:Adewu8Jjjjjbcz9Rhlcbhvdnaicvfae0mbcbhvabcbRb;m:kjjbc;qeV86bbal9cb83iwabcefhoabaefc98fhrdnaiTmbcbhwcbhDindnaoar6mbcbskadaDcdtfydbgqalcwfawaqav9Rgvavc8F91gv7av9Rc507gwcdtfgkydb9Rgvc8E91c9:Gavcdt7awVhvinaoavcFb0gecrtavcFbGV86bbavcr4hvaocefhoaembkakaqBdbaqhvaDcefgDai9hmbkkdnaoar9nmbcbskaocbBbbaoab9RclfhvkavkBeeucbhddninadcefgdc8F0meceadtae6mbkkadcwfcFeGcr9Uab2cvfk:bvli99dui99ludnaeTmbcuadcetcuftcu7:Zhvdndncuaicuftcu7:ZgoJbbbZMgr:lJbbb9p9DTmbar:Ohwxekcjjjj94hwkcbhicbhDinalclfIdbgrJbbbbJbbjZalIdbgq:lar:lMalcwfIdbgk:lMgr:varJbbbb9BEgrNhxaqarNhrdndnakJbbbb9GTmbaxhqxekJbbjZar:l:tgqaq:maxJbbbb9GEhqJbbjZax:l:tgxax:marJbbbb9GEhrkdndnalcxfIdbgxJbbj:;axJbbj:;9GEgkJbbjZakJbbjZ9FEavNJbbbZJbbb:;axJbbbb9GEMgx:lJbbb9p9DTmbax:Ohmxekcjjjj94hmkdndnaqJbbj:;aqJbbj:;9GEgxJbbjZaxJbbjZ9FEaoNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:OhPxekcjjjj94hPkdndnarJbbj:;arJbbj:;9GEgqJbbjZaqJbbjZ9FEaoNJbbbZJbbb:;arJbbbb9GEMgr:lJbbb9p9DTmbar:Ohsxekcjjjj94hskdndnadcl9hmbabaifgzas86bbazcifam86bbazcdfaw86bbazcefaP86bbxekabaDfgzas87ebazcofam87ebazclfaw87ebazcdfaP87ebkalczfhlaiclfhiaDcwfhDaecufgembkkk;hlld99eud99eudnaeTmbdndncuaicuftcu7:ZgvJbbbZMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikaic;8FiGhrinabcofcicdalclfIdb:lalIdb:l9EgialcwfIdb:lalaicdtfIdb:l9EEgialcxfIdb:lalaicdtfIdb:l9EEgiarV87ebdndnJbbj:;JbbjZalaicdtfIdbJbbbb9DEgoalaicd7cdtfIdbJ;Zl:1ZNNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabcdfaq87ebdndnalaicefciGcdtfIdbJ;Zl:1ZNaoNgwJbbj:;awJbbj:;9GEgDJbbjZaDJbbjZ9FEavNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohqxekcjjjj94hqkabaq87ebdndnaoalaicufciGcdtfIdbJ;Zl:1ZNNgoJbbj:;aoJbbj:;9GEgwJbbjZawJbbjZ9FEavNJbbbZJbbb:;aoJbbbb9GEMgo:lJbbb9p9DTmbao:Ohixekcjjjj94hikabclfai87ebabcwfhbalczfhlaecufgembkkk;3viDue99eu8Jjjjjbcjd9Rgo8Kjjjjbadcd4hrdndndndnavcd9hmbadcl6meaohwarhDinawc:CuBdbawclfhwaDcufgDmbkaeTmiadcl6mdarcdthqalhkcbhxinaohwakhDarhminawawydbgPcbaDIdbgs:8cL4cFeGc:cufasJbbbb9BEgzaPaz9kEBdbaDclfhDawclfhwamcufgmmbkakaqfhkaxcefgxaeSmixbkkaeTmdxekaeTmekarcdthkavce9hhqadcl6hdcbhxindndndnaqmbadmdc:CuhDalhwarhminaDcbawIdbgs:8cL4cFeGc:cufasJbbbb9BEgPaDaP9kEhDawclfhwamcufgmmbxdkkc:CuhDdndnavPleddbdkadmdaohwalhmarhPinawcbamIdbgs:8cL4cFeGgzc;:bazc;:b0Ec:cufasJbbbb9BEBdbamclfhmawclfhwaPcufgPmbxdkkadmecbhwarhminaoawfcbalawfIdbgs:8cL4cFeGgPc8AaPc8A0Ec:cufasJbbbb9BEBdbawclfhwamcufgmmbkkadmbcbhwarhPinaDhmdnavceSmbaoawfydbhmkdndnalawfIdbgscjjj;8iamai9RcefgmcLt9R::NJbbbZJbbb:;asJbbbb9GEMgs:lJbbb9p9DTmbas:Ohzxekcjjjj94hzkabawfazcFFFrGamcKtVBdbawclfhwaPcufgPmbkkabakfhbalakfhlaxcefgxae9hmbkkaocjdf8Kjjjjbk;YqdXui998Jjjjjbc:qd9Rgv8Kjjjjbavc:Sefcbc;Kbz:vjjjb8AcbhodnadTmbcbhoaiTmbdndnabaeSmbaehrxekavcuadcdtgwadcFFFFi0Ecbyd;u:kjjbHjjjjbbgrBd:SeavceBd:mdaraeawzNjjjb8Akavc:GefcwfcbBdbav9cb83i:Geavc:Gefaradaiavc:Sefz:ojjjbavyd:GehDadci9Ugqcbyd;u:kjjbHjjjjbbheavc:Sefavyd:mdgkcdtfaeBdbavakcefgwBd:mdaecbaqz:vjjjbhxavc:SefawcdtfcuaicdtaicFFFFi0Ecbyd;u:kjjbHjjjjbbgmBdbavakcdfgPBd:mdalc;ebfhsaDheamhwinawalIdbasaeydbgzcwazcw6EcdtfIdbMUdbaeclfheawclfhwaicufgimbkavc:SefaPcdtfcuaqcdtadcFFFF970Ecbyd;u:kjjbHjjjjbbgPBdbdnadci6mbarheaPhwaqhiinawamaeydbcdtfIdbamaeclfydbcdtfIdbMamaecwfydbcdtfIdbMUdbaecxfheawclfhwaicufgimbkkakcifhoalc;ebfhHavc;qbfhOavheavyd:KehAavyd:OehCcbhzcbhwcbhXcehQinaehLcihkarawci2gKcdtfgeydbhsaeclfydbhdabaXcx2fgicwfaecwfydbgYBdbaiclfadBdbaiasBdbaxawfce86bbaOaYBdwaOadBdlaOasBdbaPawcdtfcbBdbdnazTmbcihkaLhiinaOakcdtfaiydbgeBdbakaeaY9haeas9haead9hGGfhkaiclfhiazcufgzmbkkaXcefhXcbhzinaCaAarazaKfcdtfydbcdtgifydbcdtfgYheaDaifgdydbgshidnasTmbdninaeydbawSmeaeclfheaicufgiTmdxbkkaeaYascdtfc98fydbBdbadadydbcufBdbkazcefgzci9hmbkdndnakTmbcuhwJbbbbh8Acbhdavyd:KehYavyd:OehKindndnaDaOadcdtfydbcdtgzfydbgembadcefhdxekadcs0hiamazfgsIdbhEasalcbadcefgdaiEcdtfIdbaHaecwaecw6EcdtfIdbMg3Udba3aE:th3aecdthiaKaYazfydbcdtfheinaPaeydbgzcdtfgsa3asIdbMgEUdbaEa8Aa8AaE9DgsEh8AazawasEhwaeclfheaic98fgimbkkadak9hmbkawcu9hmekaQaq9pmdindnaxaQfRbbmbaQhwxdkaqaQcefgQ9hmbxikkakczakcz6EhzaOheaLhOawcu9hmbkkaocdtavc:Seffc98fhedninaoTmeaeydbcbyd;q:kjjbH:bjjjbbaec98fheaocufhoxbkkavc:qdf8Kjjjjbk;IlevucuaicdtgvaicFFFFi0Egocbyd;u:kjjbHjjjjbbhralalyd9GgwcdtfarBdbalawcefBd9GabarBdbaocbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdlcuadcdtadcFFFFi0Ecbyd;u:kjjbHjjjjbbhralalyd9GgocdtfarBdbalaocefBd9GabarBdwabydbcbavz:vjjjb8Aadci9UhDdnadTmbabydbhoaehladhrinaoalydbcdtfgvavydbcefBdbalclfhlarcufgrmbkkdnaiTmbabydbhlabydlhrcbhvaihoinaravBdbarclfhralydbavfhvalclfhlaocufgombkkdnadci6mbabydlhrabydwhvcbhlinaecwfydbhoaeclfydbhdaraeydbcdtfgwawydbgwcefBdbavawcdtfalBdbaradcdtfgdadydbgdcefBdbavadcdtfalBdbaraocdtfgoaoydbgocefBdbavaocdtfalBdbaecxfheaDalcefgl9hmbkkdnaiTmbabydlheabydbhlinaeaeydbalydb9RBdbalclfhlaeclfheaicufgimbkkkQbabaeadaic;K1jjbz:njjjbkQbabaeadaic;m:jjjbz:njjjbk9DeeuabcFeaicdtz:vjjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk;:kivuo99lu8Jjjjjbcj;Hb9Rgl8Kjjjjbcbhvalc:m;Gbfcbc;Kbz:vjjjb8AalcuadcdtadcFFFFi0Egocbyd;u:kjjbHjjjjbbgrBd:m9GalceBd;S9Galcwfcbyd:8:kjjbBdbalcb8Pd:0:kjjb83ibalc;W;Gbfcwfcbyd;i:kjjbBdbalcb8Pd;a:kjjb83i;W9Gaicd4hwdndnadmbJFFuFhDJFFuuhqJFFuuhkJFFuFhxJFFuuhmJFFuFhPxekawcdthsaehzincbhiinalaifgHazaifIdbgDaHIdbgxaxaD9EEUdbalc;W;GbfaifgHaDaHIdbgxaxaD9DEUdbaiclfgicx9hmbkazasfhzavcefgvad9hmbkalIdwhqalId;49GhDalIdlhkalId;09GhxalIdbhmalId;W9GhPkdndnadTmbJbbbbJbbjZJbbbbaPam:tgPaPJbbbb9DEgPaxak:tgxaxaP9DEgxaDaq:tgDaDax9DEgD:vaDJbbbb9BEhDawcdthsarhHadhzindndnaDaeIdbam:tNJb;au9eNJbbbZMgx:lJbbb9p9DTmbax:Ohixekcjjjj94hikaicztaicwtcj;GiGVaicsGVc:p;G:dKGcH2c;d;H:WKGcv2c;j:KM;jbGhvdndnaDaeclfIdbak:tNJb;au9eNJbbbZMgx:lJbbb9p9DTmbax:Ohixekcjjjj94hikaicztaicwtcj;GiGVaicsGVc:p;G:dKGcH2c;d;H:WKGcq2cM;j:KMeGavVhvdndnaDaecwfIdbaq:tNJb;au9eNJbbbZMgx:lJbbb9p9DTmbax:Ohixekcjjjj94hikaHavaicztaicwtcj;GiGVaicsGVc:p;G:dKGcH2c;d;H:WKGcC2c:KM;j:KdGVBdbaeasfheaHclfhHazcufgzmbkalcbcj;Gbz:vjjjbhiarhHadheinaiaHydbgzcFrGcx2fgvavydbcefBdbaiazcq4cFrGcx2fgvavydlcefBdlaiazcC4cFrGcx2fgzazydwcefBdwaHclfhHaecufgembxdkkalcbcj;Gbz:vjjjb8AkcbhHcbhzcbhecbhvinalaHfgiydbhsaiazBdbaicwfgwydbhOawavBdbaiclfgiydbhwaiaeBdbasazfhzaOavfhvawaefheaHcxfgHcj;Gb9hmbkcbhHalaocbyd;u:kjjbHjjjjbbgiBd:q9GdnadTmbabhzinazaHBdbazclfhzadaHcefgH9hmbkabhHadhzinalaraHydbgecdtfydbcFrGcx2fgvavydbgvcefBdbaiavcdtfaeBdbaHclfhHazcufgzmbkaihHadhzinalaraHydbgecdtfydbcq4cFrGcx2fgvavydlgvcefBdlabavcdtfaeBdbaHclfhHazcufgzmbkabhHadhzinalaraHydbgecdtfydbcC4cFrGcx2fgvavydwgvcefBdwaiavcdtfaeBdbaHclfhHazcufgzmbkcbhHinabaiydbcdtfaHBdbaiclfhiadaHcefgH9hmbkkclhidninaic98Smealc:m;Gbfaifydbcbyd;q:kjjbH:bjjjbbaic98fhixbkkalcj;Hbf8Kjjjjbk9teiucbcbyd;y:kjjbgeabcifc98GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd;y:kjjbgeabcrfc94GfgbBd;y:kjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd;y:kjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd;y:kjjbfgdBd;y:kjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akkk;Qddbcjwk;mdbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbbbbbbbbbbbbb4:h9w9N94:P:gW:j9O:ye9Pbbbbbbebbbdbbbebbbdbbbbbbbdbbbbbbbebbbbbbb:l29hZ;69:9kZ;N;76Z;rg97Z;z;o9xZ8J;B85Z;:;u9yZ;b;k9HZ:2;Z9DZ9e:l9mZ59A8KZ:r;T3Z:A:zYZ79OHZ;j4::8::Y:D9V8:bbbb9s:49:Z8R:hBZ9M9M;M8:L;z;o8:;8:PG89q;x:J878R:hQ8::M:B;e87bbbbbbjZbbjZbbjZ:E;V;N8::Y:DsZ9i;H;68:xd;R8:;h0838:;W:NoZbbbb:WV9O8:uf888:9i;H;68:9c9G;L89;n;m9m89;D8Ko8:bbbbf:8tZ9m836ZS:2AZL;zPZZ818EZ9e:lxZ;U98F8:819E;68:FFuuFFuuFFuuFFuFFFuFFFuFbc;mqkzebbbebbbdbbb9G:vbb"),{}).then((function(b){(a=b.instance).exports.__wasm_call_ctors(),a.exports.meshopt_encodeVertexVersion(0),a.exports.meshopt_encodeIndexVersion(1);}));}(),function(){var a=new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,3,3,2,0,0,5,3,1,0,1,12,1,0,10,22,2,12,0,65,0,65,0,65,0,252,10,0,0,11,7,0,65,0,253,15,26,11]),b=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if("object"!=typeof WebAssembly)return {supported:false};var c=WebAssembly.validate(a)?d("b9H79TebbbeKl9Gbb9Gvuuuuueu9Giuuub9Geueuikqbbebeedddilve9Weeeviebeoweuec:q:6dkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbdY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVblE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtboK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbrL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbwl79IV9RbDq;X9Mqlbzik9:evu8Jjjjjbcz9Rhbcbheincbhdcbhiinabcwfadfaicjuaead4ceGglE86bbaialfhiadcefgdcw9hmbkaec:q:yjjbfai86bbaecitc:q1jjbfab8Piw83ibaecefgecjd9hmbkk:183lYud97dur978Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxavaialfgmar9Rgoad;8qbbcj;abad9Uc;WFbGcjdadca0EhPdndndnadTmbaoadfhscbhzinaeaz9nmdamax9RaD6miabazad2fhHaxaDfhOaPaeaz9RazaPfae6EgAcsfgocl4cifcd4hCavcj;cbfaoc9WGgXcetfhQavcj;cbfaXci2fhLavcj;cbfaXfhKcbhYaoc;ab6h8AincbhodnawTmbaxaYcd4fRbbhokaocFeGhEcbh3avcj;cbfh5indndndndnaEa3cet4ciGgoc9:fPdebdkamaO9RaX6mwavcj;cbfa3aX2faOaX;8qbbaOaAfhOxdkavcj;cbfa3aX2fcbaX;8kbxekamaO9RaC6moaoclVcbawEhraOaCfhocbhidna8Ambamao9Rc;Gb6mbcbhlina5alfhidndndndndndnaOalco4fRbbgqciGarfPDbedibledibkaipxbbbbbbbbbbbbbbbbpklbxlkaiaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiaopbbbpklbaoczfhoxekaiaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcd4ciGarfPDbedibledibkaiczfpxbbbbbbbbbbbbbbbbpklbxlkaiczfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaiczfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaiczfaopbbbpklbaoczfhoxekaiczfaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqcl4ciGarfPDbedibledibkaicafpxbbbbbbbbbbbbbbbbpklbxlkaicafaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaoclffahc:q:yjjbfRbbfhoxikaicafaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaaaocwffahc:q:yjjbfRbbfhoxdkaicafaopbbbpklbaoczfhoxekaicafaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaaaocdffahc:q:yjjbfRbbfhokdndndndndndnaqco4arfPDbedibledibkaic8Wfpxbbbbbbbbbbbbbbbbpklbxlkaic8Wfaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaoclffaqc:q:yjjbfRbbfhoxikaic8Wfaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngicitc:q1jjbfpbibaic:q:yjjbfRbbgipsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Ngqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spklbaiaocwffaqc:q:yjjbfRbbfhoxdkaic8Wfaopbbbpklbaoczfhoxekaic8WfaopbbdaoRbbgicitc:q1jjbfpbibaic:q:yjjbfRbbgipsaoRbegqcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpklbaiaocdffaqc:q:yjjbfRbbfhokalc;abfhialcjefaX0meaihlamao9Rc;Fb0mbkkdnaiaX9pmbaici4hlinamao9RcK6mwa5aifhqdndndndndndnaOaico4fRbbalcoG4ciGarfPDbedibledibkaqpxbbbbbbbbbbbbbbbbpkbbxlkaqaopbblaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLg8Ecdp:mea8EpmbzeHdOiAlCvXoQrLpxiiiiiiiiiiiiiiiip9og8Fpxiiiiiiiiiiiiiiiip8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaoclffahc:q:yjjbfRbbfhoxikaqaopbbwaopbbbg8Eclp:mea8EpmbzeHdOiAlCvXoQrLpxssssssssssssssssp9og8Fpxssssssssssssssssp8Jg8Ep5b9cjF;8;4;W;G;ab9:9cU1:Ngacitc:q1jjbfpbibaac:q:yjjbfRbbgapsa8Ep5e9cjF;8;4;W;G;ab9:9cU1:Nghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPa8Fa8Ep9spkbbaaaocwffahc:q:yjjbfRbbfhoxdkaqaopbbbpkbbaoczfhoxekaqaopbbdaoRbbgacitc:q1jjbfpbibaac:q:yjjbfRbbgapsaoRbeghcitc:q1jjbfpbibp9UpmbedilvorzHOACXQLpPpkbbaaaocdffahc:q:yjjbfRbbfhokalcdfhlaiczfgiaX6mbkkaohOaoTmoka5aXfh5a3cefg3cl9hmbkdndndndnawTmbasaYcd4fRbbglciGPlbedwbkaXTmdavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep9Ta8Epxeeeeeeeeeeeeeeeeg8Fp9op9Hp9rg8Eagp9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Uggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp9Uggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp9Uggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep9Ta8Ea8Fp9op9Hp9rg8Ep9Ug8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9Ug8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9Uggp9AbbbaladfhlaoczfgoaX6mbxikkaXTmeavcjdfaYfhlavaYfpbdbhgcbhoinalavcj;cbfaofpblbg8JaKaofpblbg8KpmbzeHdOiAlCvXoQrLg8LaQaofpblbg8MaLaofpblbg8NpmbzeHdOiAlCvXoQrLgypmbezHdiOAlvCXorQLg8Ecep:nea8Epxebebebebebebebebg8Fp9op:bep9rg8Eagp:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8LaypmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwKDYq8AkEx3m5P8Es8Fg8Ja8Ma8NpmwKDYq8AkEx3m5P8Es8Fg8KpmbezHdiOAlvCXorQLg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeggp9Abbbaladfglaga8Ea8Epmlvorlvorlvorlvorp:oeggp9Abbbaladfglaga8Ea8EpmwDqkwDqkwDqkwDqkp:oeggp9Abbbaladfglaga8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9Abbbaladfglaga8Ja8KpmwDKYqk8AExm35Ps8E8Fg8Ecep:nea8Ea8Fp9op:bep9rg8Ep:oeg8Fp9Abbbaladfgla8Fa8Ea8Epmlvorlvorlvorlvorp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmwDqkwDqkwDqkwDqkp:oeg8Fp9Abbbaladfgla8Fa8Ea8EpmxmPsxmPsxmPsxmPsp:oeggp9AbbbaladfhlaoczfgoaX6mbxdkkaXTmbcbhocbalcl4gl9Rc8FGhiavcjdfaYfhravaYfpbdbh8Finaravcj;cbfaofpblbggaKaofpblbg8JpmbzeHdOiAlCvXoQrLg8KaQaofpblbg8LaLaofpblbg8MpmbzeHdOiAlCvXoQrLg8NpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ea8Fp9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Fa8Ka8NpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwKDYq8AkEx3m5P8Es8Fgga8La8MpmwKDYq8AkEx3m5P8Es8Fg8JpmbezHdiOAlvCXorQLg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9Abbbaradfgra8Faga8JpmwDKYqk8AExm35Ps8E8Fg8Eaip:Rea8Ealp:Sep9qg8Ep9rg8Fp9Abbbaradfgra8Fa8Ea8Epmlvorlvorlvorlvorp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmwDqkwDqkwDqkwDqkp9rg8Fp9Abbbaradfgra8Fa8Ea8EpmxmPsxmPsxmPsxmPsp9rg8Fp9AbbbaradfhraoczfgoaX6mbkkaYclfgYad6mbkaHavcjdfaAad2;8qbbavavcjdfaAcufad2fad;8qbbaAazfhzc9:hoaOhxaOmbxlkkaeTmbaDalfhrcbhocuhlinaralaD9RglfaD6mdaPaeao9RaoaPfae6Eaofgoae6mbkaial9Rhxkcbc99amax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaokwbz:bjjjbk::seHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecje;8kbavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhDaicefgqarfhidnaeTmbcmcsawceSEhkcbhxcbhmcbhPcbhwcbhlindnaiaD9nmbc9:hoxikdndnaqRbbgoc;Ve0mbavc;abfalaocu7gscl4fcsGcitfgzydlhrazydbhzdnaocsGgHak9pmbavawasfcsGcdtfydbaxaHEhoaHThsdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkaxasfhxcdhHavawcdtfaoBdbawasfhwcehsalhOxdkdndnaHcsSmbaHc987aHamffcefhoxekaicefhoai8SbbgHcFeGhsdndnaHcu9mmbaohixekaicvfhiascFbGhscrhHdninao8SbbgOcFbGaHtasVhsaOcu9kmeaocefhoaHcrfgHc8J9hmbxdkkaocefhikasce4cbasceG9R7amfhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhHavawcdtfaoBdbcehsawcefhwalhOaohmxekdnaocpe0mbaxcefgHavawaDaocsGfRbbgocl49RcsGcdtfydbaocz6gzEhravawao9RcsGcdtfydbaHazfgAaocsGgHEhoaHThCdndnadcd9hmbabaPcetfgHax87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHaxBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfaxBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgOaxBdlaOarBdbavawazfgwcsGcdtfaoBdbalcefcsGhOawaCfhwaxhzaAaCfhxxekaxcbaiRbbgOEgzaoc;:eSgHfhraOcsGhCaOcl4hAdndnaOcs0mbarcefhoxekarhoavawaA9RcsGcdtfydbhrkdndnaCmbaocefhxxekaohxavawaO9RcsGcdtfydbhokdndnaHTmbaicefhHxekaicdfhHai8SbegscFeGhzdnascu9kmbaicofhXazcFbGhzcrhidninaH8SbbgscFbGaitazVhzascu9kmeaHcefhHaicrfgic8J9hmbkaXhHxekaHcefhHkazce4cbazceG9R7amfgmhzkdndnaAcsSmbaHhsxekaHcefhsaH8SbbgicFeGhrdnaicu9kmbaHcvfhXarcFbGhrcrhidninas8SbbgHcFbGaitarVhraHcu9kmeascefhsaicrfgic8J9hmbkaXhsxekascefhskarce4cbarceG9R7amfgmhrkdndnaCcsSmbashixekascefhias8SbbgocFeGhHdnaocu9kmbascvfhXaHcFbGhHcrhodninai8SbbgscFbGaotaHVhHascu9kmeaicefhiaocrfgoc8J9hmbkaXhixekaicefhikaHce4cbaHceG9R7amfgmhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfazBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgXazBdlaXarBdbavawaOcz6aAcsSVfgwcsGcdtfaoBdbawaCTaCcsSVfhwalcefcsGhOkaqcefhqavc;abfaOcitfgOarBdlaOaoBdbavc;abfalasfcsGcitfgraoBdlarazBdbawcsGhwalaHfcsGhlaPcifgPae6mbkkcbc99aiaDSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:SPliuo97eue978Jjjjjbca9Rhiaec98Ghldndnadcl9hmbdnalTmbcbhvabhdinadadpbbbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDpxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpkbbadczfhdavclfgval6mbkkalaeSmeaipxbbbbbbbbbbbbbbbbgqpklbaiabalcdtfgdaeciGglcdtgv;8qbbdnalTmbaiaipblbgocKp:RecKp:Sep;6egraocwp:RecKp:Sep;6earp;Geaoczp:RecKp:Sep;6egwp;Gep;Kep;LegDaqp:2egqarpxbbbjbbbjbbbjbbbjgkp9op9rp;Kegrpxbb;:9cbb;:9cbb;:9cbb;:9cararp;MeaDaDp;Meawaqawakp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFbbbFbbbFbbbFbbbp9oaopxbbbFbbbFbbbFbbbFp9op9qarawp;Meaqp;Kecwp:RepxbFbbbFbbbFbbbFbbp9op9qaDawp;Meaqp;Keczp:RepxbbFbbbFbbbFbbbFbp9op9qpklbkadaiav;8qbbskdnalTmbcbhvabhdinadczfgxaxpbbbgopxbbbbbbFFbbbbbbFFgkp9oadpbbbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpkbbadaDakp9oaoarpmbezHdiOAlvCXorQLp9qpkbbadcafhdavclfgval6mbkkalaeSmbaiczfpxbbbbbbbbbbbbbbbbgopklbaiaopklbaiabalcitfgdaeciGglcitgv;8qbbdnalTmbaiaipblzgopxbbbbbbFFbbbbbbFFgkp9oaipblbgDaopmbediwDqkzHOAKY8AEgwczp:Reczp:Sep;6egraDaopmlvorxmPsCXQL358E8FpxFubbFubbFubbFubbp9op;7eawczp:Sep;6egwp;Gearp;Gep;Kep;Legopxbbbbbbbbbbbbbbbbp:2egqarpxbbbjbbbjbbbjbbbjgmp9op9rp;Kegrpxb;:FSb;:FSb;:FSb;:FSararp;Meaoaop;Meawaqawamp9op9rp;Kegrarp;Mep;Kep;Kep;Jep;Negwp;Mepxbbn0bbn0bbn0bbn0gqp;KepxFFbbFFbbFFbbFFbbp9oaoawp;Meaqp;Keczp:Rep9qgoarawp;Meaqp;KepxFFbbFFbbFFbbFFbbp9ogrpmwDKYqk8AExm35Ps8E8Fp9qpklzaiaDakp9oaoarpmbezHdiOAlvCXorQLp9qpklbkadaiav;8qbbkk:oDllue97euv978Jjjjjbc8W9Rhidnaec98GglTmbcbhvabhoinaiaopbbbgraoczfgwpbbbgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklbaopxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblbpEb:T:j83ibaocwfarp5eaipblbpEe:T:j83ibawaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblbpEd:T:j83ibaocKfakp5eaipblbpEi:T:j83ibaocafhoavclfgval6mbkkdnalaeSmbaiczfpxbbbbbbbbbbbbbbbbgkpklbaiakpklbaiabalcitfgoaeciGgvcitgw;8qbbdnavTmbaiaipblbgraipblzgDpmlvorxmPsCXQL358E8Fgqczp:Segkclp:RepklaaipxbbjZbbjZbbjZbbjZpx;Zl81Z;Zl81Z;Zl81Z;Zl81Zakpxibbbibbbibbbibbbp9qp;6ep;NegkaraDpmbediwDqkzHOAKY8AEgrczp:Reczp:Sep;6ep;MegDaDp;Meakarczp:Sep;6ep;Megxaxp;Meakaqczp:Reczp:Sep;6ep;Megqaqp;Mep;Kep;Kep;Lepxbbbbbbbbbbbbbbbbp:4ep;Jepxb;:FSb;:FSb;:FSb;:FSgkp;Mepxbbn0bbn0bbn0bbn0grp;KepxFFbbFFbbFFbbFFbbgmp9oaxakp;Mearp;Keczp:Rep9qgxaDakp;Mearp;Keamp9oaqakp;Mearp;Keczp:Rep9qgkpmbezHdiOAlvCXorQLgrp5baipblapEb:T:j83ibaiarp5eaipblapEe:T:j83iwaiaxakpmwDKYqk8AExm35Ps8E8Fgkp5baipblapEd:T:j83izaiakp5eaipblapEi:T:j83iKkaoaiaw;8qbbkk;uddiue978Jjjjjbc;ab9Rhidnadcd4ae2glc98GgvTmbcbheabhdinadadpbbbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepkbbadczfhdaeclfgeav6mbkkdnavalSmbaic8WfpxbbbbbbbbbbbbbbbbgopklbaicafaopklbaiczfaopklbaiaopklbaiabavcdtfgdalciGgecdtgv;8qbbdnaeTmbaiaipblbgocwp:Recwp:Sep;6eaocep:SepxbbjFbbjFbbjFbbjFp9opxbbjZbbjZbbjZbbjZp:Uep;Mepklbkadaiav;8qbbkk9teiucbcbydj1jjbgeabcifc98GfgbBdj1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaikkkebcjwklz:Dbb"):d("b9H79Tebbbe8Fv9Gbb9Gvuuuuueu9Giuuub9Geueu9Giuuueuikqbeeedddillviebeoweuec:W:Odkr;leDo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9KW9J9V9KW9wWVtW949c919M9MWVbeY9TW79O9V9Wt9F9KW9J9V9KW69U9KW949c919M9MWVbdE9TW79O9V9Wt9F9KW9J9V9KW69U9KW949tWG91W9U9JWbiL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9p9JtblK9TW79O9V9Wt9F9KW9J9V9KWS9P2tWV9r919HtbvL9TW79O9V9Wt9F9KW9J9V9KWS9P2tWVT949Wbol79IV9Rbrq:986qdbk;jYi5ud9:du8Jjjjjbcj;kb9Rgv8Kjjjjbc9:hodnalTmbcuhoaiRbbgrc;WeGc:Ge9hmbarcsGgwce0mbc9:hoalcufadcd4cbawEgDadfgrcKcaawEgqaraq0Egk6mbaicefhxcj;abad9Uc;WFbGcjdadca0EhmaialfgPar9Rgoadfhsavaoadz1jjjbgzceVhHcbhOdndninaeaO9nmeaPax9RaD6mdamaeaO9RaOamfgoae6EgAcsfglc9WGhCabaOad2fhXaAcethQaxaDfhiaOaeaoaeao6E9RhLalcl4cifcd4hKazcj;cbfaAfhYcbh8AazcjdfhEaHh3incbhodnawTmbaxa8Acd4fRbbhokaocFeGh5cbh8Eazcj;cbfhqinaih8Fdndndndna5a8Ecet4ciGgoc9:fPdebdkaPa8F9RaA6mrazcj;cbfa8EaA2fa8FaAz1jjjb8Aa8FaAfhixdkazcj;cbfa8EaA2fcbaAz:jjjjb8Aa8FhixekaPa8F9RaK6mva8FaKfhidnaCTmbaPai9RcK6mbaocdtc:q1jjbfcj1jjbawEhaczhrcbhlinargoc9Wfghaqfhrdndndndndndnaaa8Fahco4fRbbalcoG4ciGcdtfydbPDbedvivvvlvkar9cb83bbarcwf9cb83bbxlkarcbaiRbdai8Xbb9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbaqaofgrcGfag9c8F1:NghcKtc8F91aicdfa8J9c8N1:Nfg8KRbbG86bbarcVfcba8KahcjeGcr4fghRbbag9cjjjjjl:dg8J9qE86bbarc7fcbaha8J9c8L1:NfghRbbag9cjjjjjd:dg8J9qE86bbarctfcbaha8J9c8K1:NfghRbbag9cjjjjje:dg8J9qE86bbarc91fcbaha8J9c8J1:NfghRbbag9cjjjj;ab:dg8J9qE86bbarc4fcbaha8J9cg1:NfghRbbag9cjjjja:dg8J9qE86bbarc93fcbaha8J9ch1:NfghRbbag9cjjjjz:dgg9qE86bbarc94fcbahag9ca1:NfghRbbai8Xbe9c:c:qj:bw9:9c:q;c1:I1e:d9c:b:c:e1z9:gg9cjjjjjz:dg8J9qE86bbarc95fag9c8F1:NgicKtc8F91aha8J9c8N1:NfghRbbG86bbarc96fcbahaicjeGcr4fgiRbbag9cjjjjjl:dg8J9qE86bbarc97fcbaia8J9c8L1:NfgiRbbag9cjjjjjd:dg8J9qE86bbarc98fcbaia8J9c8K1:NfgiRbbag9cjjjjje:dg8J9qE86bbarc99fcbaia8J9c8J1:NfgiRbbag9cjjjj;ab:dg8J9qE86bbarc9:fcbaia8J9cg1:NfgiRbbag9cjjjja:dg8J9qE86bbarcufcbaia8J9ch1:NfgiRbbag9cjjjjz:dgg9qE86bbaiag9ca1:NfhixikaraiRblaiRbbghco4g8Ka8KciSg8KE86bbaqaofgrcGfaiclfa8Kfg8KRbbahcl4ciGg8La8LciSg8LE86bbarcVfa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc7fa8Ka8Lfg8KRbbahciGghahciSghE86bbarctfa8Kahfg8KRbbaiRbeghco4g8La8LciSg8LE86bbarc91fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc4fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc93fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc94fa8Kahfg8KRbbaiRbdghco4g8La8LciSg8LE86bbarc95fa8Ka8Lfg8KRbbahcl4ciGg8La8LciSg8LE86bbarc96fa8Ka8Lfg8KRbbahcd4ciGg8La8LciSg8LE86bbarc97fa8Ka8Lfg8KRbbahciGghahciSghE86bbarc98fa8KahfghRbbaiRbigico4g8Ka8KciSg8KE86bbarc99faha8KfghRbbaicl4ciGg8Ka8KciSg8KE86bbarc9:faha8KfghRbbaicd4ciGg8Ka8KciSg8KE86bbarcufaha8KfgrRbbaiciGgiaiciSgiE86bbaraifhixdkaraiRbwaiRbbghcl4g8Ka8KcsSg8KE86bbaqaofgrcGfaicwfa8Kfg8KRbbahcsGghahcsSghE86bbarcVfa8KahfghRbbaiRbeg8Kcl4g8La8LcsSg8LE86bbarc7faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarctfaha8KfghRbbaiRbdg8Kcl4g8La8LcsSg8LE86bbarc91faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc4faha8KfghRbbaiRbig8Kcl4g8La8LcsSg8LE86bbarc93faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc94faha8KfghRbbaiRblg8Kcl4g8La8LcsSg8LE86bbarc95faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc96faha8KfghRbbaiRbvg8Kcl4g8La8LcsSg8LE86bbarc97faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc98faha8KfghRbbaiRbog8Kcl4g8La8LcsSg8LE86bbarc99faha8LfghRbba8KcsGg8Ka8KcsSg8KE86bbarc9:faha8KfghRbbaiRbrgicl4g8Ka8KcsSg8KE86bbarcufaha8KfgrRbbaicsGgiaicsSgiE86bbaraifhixekarai8Pbb83bbarcwfaicwf8Pbb83bbaiczfhikdnaoaC9pmbalcdfhlaoczfhraPai9RcL0mekkaoaC6moaimexokaCmva8FTmvkaqaAfhqa8Ecefg8Ecl9hmbkdndndndnawTmbasa8Acd4fRbbgociGPlbedrbkaATmdaza8Afh8Fazcj;cbfhhcbh8EaEhaina8FRbbhraahocbhlinaoahalfRbbgqce4cbaqceG9R7arfgr86bbaoadfhoaAalcefgl9hmbkaacefhaa8Fcefh8FahaAfhha8Ecefg8Ecl9hmbxikkaATmeaza8Afhaazcj;cbfhhcbhoceh8EaYh8FinaEaofhlaa8Vbbhrcbhoinala8FaofRbbcwtahaofRbbgqVc;:FiGce4cbaqceG9R7arfgr87bbaladfhlaLaocefgofmbka8FaQfh8FcdhoaacdfhaahaQfhha8EceGhlcbh8EalmbxdkkaATmbcbaocl49Rh8Eaza8AfRbbhqcwhoa3hlinalRbbaotaqVhqalcefhlaocwfgoca9hmbkcbhhaEh8FaYhainazcj;cbfahfRbbhrcwhoaahlinalRbbaotarVhralaAfhlaocwfgoca9hmbkara8E93aq7hqcbhoa8Fhlinalaqao486bbalcefhlaocwfgoca9hmbka8Fadfh8FaacefhaahcefghaA9hmbkkaEclfhEa3clfh3a8Aclfg8Aad6mbkaXazcjdfaAad2z1jjjb8AazazcjdfaAcufad2fadz1jjjb8AaAaOfhOaihxaimbkc9:hoxdkcbc99aPax9RakSEhoxekc9:hokavcj;kbf8Kjjjjbaok;cseHu8Jjjjjbc;ae9Rgv8Kjjjjbc9:hodnaeci9UgrcHfal0mbcuhoaiRbbgwc;WeGc;Ge9hmbawcsGgwce0mbavc;abfcFecjez:jjjjb8AavcUf9cu83ibavc8Wf9cu83ibavcyf9cu83ibavcaf9cu83ibavcKf9cu83ibavczf9cu83ibav9cu83iwav9cu83ibaialfc9WfhDaicefgqarfhidnaeTmbcmcsawceSEhkcbhxcbhmcbhPcbhwcbhlindnaiaD9nmbc9:hoxikdndnaqRbbgoc;Ve0mbavc;abfalaocu7gscl4fcsGcitfgzydlhrazydbhzdnaocsGgHak9pmbavawasfcsGcdtfydbaxaHEhoaHThsdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkaxasfhxcdhHavawcdtfaoBdbawasfhwcehsalhOxdkdndnaHcsSmbaHc987aHamffcefhoxekaicefhoai8SbbgHcFeGhsdndnaHcu9mmbaohixekaicvfhiascFbGhscrhHdninao8SbbgOcFbGaHtasVhsaOcu9kmeaocefhoaHcrfgHc8J9hmbxdkkaocefhikasce4cbasceG9R7amfhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhHavawcdtfaoBdbcehsawcefhwalhOaohmxekdnaocpe0mbaxcefgHavawaDaocsGfRbbgocl49RcsGcdtfydbaocz6gzEhravawao9RcsGcdtfydbaHazfgAaocsGgHEhoaHThCdndnadcd9hmbabaPcetfgHax87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHaxBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfaxBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgOaxBdlaOarBdbavawazfgwcsGcdtfaoBdbalcefcsGhOawaCfhwaxhzaAaCfhxxekaxcbaiRbbgOEgzaoc;:eSgHfhraOcsGhCaOcl4hAdndnaOcs0mbarcefhoxekarhoavawaA9RcsGcdtfydbhrkdndnaCmbaocefhxxekaohxavawaO9RcsGcdtfydbhokdndnaHTmbaicefhHxekaicdfhHai8SbegscFeGhzdnascu9kmbaicofhXazcFbGhzcrhidninaH8SbbgscFbGaitazVhzascu9kmeaHcefhHaicrfgic8J9hmbkaXhHxekaHcefhHkazce4cbazceG9R7amfgmhzkdndnaAcsSmbaHhsxekaHcefhsaH8SbbgicFeGhrdnaicu9kmbaHcvfhXarcFbGhrcrhidninas8SbbgHcFbGaitarVhraHcu9kmeascefhsaicrfgic8J9hmbkaXhsxekascefhskarce4cbarceG9R7amfgmhrkdndnaCcsSmbashixekascefhias8SbbgocFeGhHdnaocu9kmbascvfhXaHcFbGhHcrhodninai8SbbgscFbGaotaHVhHascu9kmeaicefhiaocrfgoc8J9hmbkaXhixekaicefhikaHce4cbaHceG9R7amfgmhokdndnadcd9hmbabaPcetfgHaz87ebaHclfao87ebaHcdfar87ebxekabaPcdtfgHazBdbaHcwfaoBdbaHclfarBdbkcdhsavawcdtfazBdbavawcefgwcsGcdtfarBdbcihHavc;abfalcitfgXazBdlaXarBdbavawaOcz6aAcsSVfgwcsGcdtfaoBdbawaCTaCcsSVfhwalcefcsGhOkaqcefhqavc;abfaOcitfgOarBdlaOaoBdbavc;abfalasfcsGcitfgraoBdlarazBdbawcsGhwalaHfcsGhlaPcifgPae6mbkkcbc99aiaDSEhokavc;aef8Kjjjjbaok:clevu8Jjjjjbcz9Rhvdnaecvfal9nmbc9:skdnaiRbbc;:eGc;qeSmbcuskav9cb83iwaicefhoaialfc98fhrdnaeTmbdnadcdSmbcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcdtfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgiBdbalaiBdbawcefgwae9hmbxdkkcbhwindnaoar6mbc9:skaocefhlao8SbbgicFeGhddndnaicu9mmbalhoxekaocvfhoadcFbGhdcrhidninal8SbbgDcFbGaitadVhdaDcu9kmealcefhlaicrfgic8J9hmbxdkkalcefhokabawcetfadc8Etc8F91adcd47avcwfadceGcdtVglydbfgi87ebalaiBdbawcefgwae9hmbkkcbc99aoarSEk:Lvoeue99dud99eud99dndnadcl9hmbaeTmeindndnabcdfgd8Sbb:Yab8Sbbgi:Ygl:l:tabcefgv8Sbbgo:Ygr:l:tgwJbb;:9cawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai86bbdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad86bbdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad86bbabclfhbaecufgembxdkkaeTmbindndnabclfgd8Ueb:Yab8Uebgi:Ygl:l:tabcdfgv8Uebgo:Ygr:l:tgwJb;:FSawawNJbbbbawawJbbbb9GgDEgq:mgkaqaicb9iEalMgwawNakaqaocb9iEarMgqaqNMM:r:vglNJbbbZJbbb:;aDEMgr:lJbbb9p9DTmbar:Ohixekcjjjj94hikadai87ebdndnaqalNJbbbZJbbb:;aqJbbbb9GEMgq:lJbbb9p9DTmbaq:Ohdxekcjjjj94hdkavad87ebdndnawalNJbbbZJbbb:;awJbbbb9GEMgw:lJbbb9p9DTmbaw:Ohdxekcjjjj94hdkabad87ebabcwfhbaecufgembkkk;oiliui99iue99dnaeTmbcbhiabhlindndnJ;Zl81Zalcof8UebgvciV:Y:vgoal8Ueb:YNgrJb;:FSNJbbbZJbbb:;arJbbbb9GEMgw:lJbbb9p9DTmbaw:OhDxekcjjjj94hDkalclf8Uebhqalcdf8UebhkabaiavcefciGfcetfaD87ebdndnaoak:YNgwJb;:FSNJbbbZJbbb:;awJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavciGfgkcd7cetfaD87ebdndnaoaq:YNgoJb;:FSNJbbbZJbbb:;aoJbbbb9GEMgx:lJbbb9p9DTmbax:OhDxekcjjjj94hDkabaiavcufciGfcetfaD87ebdndnJbbjZararN:tawawN:taoaoN:tgrJbbbbarJbbbb9GE:rJb;:FSNJbbbZMgr:lJbbb9p9DTmbar:Ohvxekcjjjj94hvkabakcetfav87ebalcwfhlaiclfhiaecufgembkkk9mbdnadcd4ae2gdTmbinababydbgecwtcw91:Yaece91cjjj98Gcjjj;8if::NUdbabclfhbadcufgdmbkkk9teiucbcbyd:K1jjbgeabcifc98GfgbBd:K1jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabkk81dbcjwk8Kbbbbdbbblbbbwbbbbbbbebbbdbbblbbbwbbbbc:Kwkl8WNbb");WebAssembly.instantiate(c,{}).then((function(a){(a.instance).exports.__wasm_call_ctors();}));function d(a){for(var e=new Uint8Array(a.length),c=0;c<a.length;++c){var t=a.charCodeAt(c);e[c]=t>96?t-97:t>64?t-39:t+4;}var d=0;for(c=0;c<a.length;++c)e[d++]=e[c]<60?b[e[c]]:64*(e[c]-60)+e[++c];return e.buffer.slice(0,d)}}();(function(){var a,b=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if("object"!=typeof WebAssembly)return {supported:false};var e=WebAssembly.instantiate(function(a){for(var e=new Uint8Array(21504),c=0;c<21504;++c){var t=a.charCodeAt(c);e[c]=t>96?t-97:t>64?t-39:t+4;}var d=0;for(c=0;c<21504;++c)e[d++]=e[c]<60?b[e[c]]:64*(e[c]-60)+e[++c];return e.buffer.slice(0,d)}("b9H79Tebbbe9Hk9Geueu9Geub9Gbb9Gsuuuuuuuuuuuu99uueu9Gvuuuuub9Gvuuuuue999Gquuuuuuu99uueu9Gwuuuuuu99ueu9Giuuue999Gluuuueu9GiuuueuizsdilvoirwDbqqbeqlve9Weiiviebeoweuec:G:Pdkr:Tewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bbz9TW79O9V9Wt9F79P9T9W29P9M95bl8E9TW79O9V9Wt9F79P9T9W29P9M959x9Pt9OcttV9P9I91tW7bvQ9TW79O9V9Wt9F79P9T9W29P9M959q9V9P9Ut7boX9TW79O9V9Wt9F79P9T9W29P9M959t9J9H2Wbra9TW79O9V9Wt9F9V9Wt9P9T9P96W9wWVtW94SWt9J9O9sW9T9H9Wbwl79IV9RbDDwebcekdmxq:x:yesdbk:Z9VvKue99euY99Ou8Jjjjjbc;W;qb9Rgs8Kjjjjbcbhzascxfcbc;Kbz:ljjjb8AdnabaeSmbabaeadcdtz:kjjjb8AkdnamcdGTmbalcrfci4gHcbyd:m:jjjbHjjjjbbheascxfasyd2gOcdtfaeBdbasaOcefBd2aecbaHz:ljjjbhAcbhlcbhednadTmbcbhlabheadhHinaAaeydbgOci4fgCaCRbbgCceaOcrGgOtV86bbaCcu7aO4ceGalfhlaeclfheaHcufgHmbkcualcdtalcFFFFi0Ehekaecbyd:m:jjjbHjjjjbbhzascxfasyd2gecdtfazBdbasaecefBd2alcd4alfhOcehHinaHgecethHaeaO6mbkcbhXcuaecdtgOaecFFFFi0Ecbyd:m:jjjbHjjjjbbhHascxfasyd2gCcdtfaHBdbasaCcefBd2aHcFeaOz:ljjjbhQdnadTmbaecufhLcbhKindndnaQabaXcdtfgYydbgCc:v;t;h;Ev2aLGgOcdtfgAydbgHcuSmbceheinazaHcdtfydbaCSmdaOaefhHaecefheaQaHaLGgOcdtfgAydbgHcu9hmbkkazaKcdtfaCBdbaAaKBdbaKhHaKcefhKkaYaHBdbaXcefgXad9hmbkkaQcbyd1:jjjbH:bjjjbbasasyd2cufBd2kcualcefgecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbh8Aascxfasyd2gecdtfa8ABdbasa8ABdlasaecefBd2cuadcitadcFFFFe0Ecbyd:m:jjjbHjjjjbbhEascxfasyd2gecdtfaEBdbasaEBdwasaecefBd2asclfabadalcbz:cjjjbcualcdtg3alcFFFFi0Eg5cbyd:m:jjjbHjjjjbbhLascxfasyd2gecdtfaLBdbasaecefBd2a5cbyd:m:jjjbHjjjjbbh8Eascxfasyd2gecdtfa8EBdbasaecefBd2alcd4alfhOcehHinaHgecethHaeaO6mbkcbhYcuaecdtgOaecFFFFi0Ecbyd:m:jjjbHjjjjbbhHascxfasyd2gCcdtfaHBdbasaCcefBd2aHcFeaOz:ljjjbhQdnalTmbavcd4hCaecufhKinaYhednazTmbazaYcdtfydbhekaiaeaC2cdtfgeydlgHcH4aH7c:F:b:DD2aeydbgHcH4aH7c;D;O:B8J27aeydwgecH4ae7c:3F;N8N27aKGhHaYcdth8FdndndnazTmbaQaHcdtfgAydbgecuSmeaiaza8FfydbaC2cdtfhXcehOinaiazaecdtfydbaC2cdtfaXcxz:ojjjbTmiaHaOfheaOcefhOaQaeaKGgHcdtfgAydbgecu9hmbxdkkaQaHcdtfgAydbgecuSmbaiaYaC2cdtfhXcehOinaiaeaC2cdtfaXcxz:ojjjbTmdaHaOfheaOcefhOaQaeaKGgHcdtfgAydbgecu9hmbkkaAaYBdbaYhekaLa8FfaeBdbaYcefgYal9hmbkcbhea8EhHinaHaeBdbaHclfhHalaecefge9hmbkcbheaLhHa8EhOindnaeaHydbgCSmbaOa8EaCcdtfgCydbBdbaCaeBdbkaHclfhHaOclfhOalaecefge9hmbkkcbhaaQcbyd1:jjjbH:bjjjbbasasyd2cufBd2alcbyd:m:jjjbHjjjjbbhKascxfasyd2gecdtfaKBdbasaecefBd2a5cbyd:m:jjjbHjjjjbbheascxfasyd2gHcdtfaeBdbasaHcefBd2a5cbyd:m:jjjbHjjjjbbhHascxfasyd2gOcdtfaHBdbasaOcefBd2aecFea3z:ljjjbhhaHcFea3z:ljjjbhgdnalTmbaEcwfh8Jindna8AaagOcefgacdtfydbgCa8AaOcdtgefydbgHSmbaCaH9Rh8FaEaHcitfh3agaefh8KahaefhYcbhAindndna3aAcitfydbgQaO9hmbaYaOBdba8KaOBdbxekdna8AaQcdtg8LfgeclfydbgHaeydbgeSmbaEaecitgCfydbaOSmeaHae9Rh8Maecu7aHfhXa8JaCfhHcbheinaXaeSmeaecefheaHydbhCaHcwfhHaCaO9hmbkaea8M6mekaga8LfgeaOaQaeydbcuSEBdbaYaQaOaYydbcuSEBdbkaAcefgAa8F9hmbkkaaal9hmbkaLhHa8EhOaghCahhAcbheindndnaeaHydbgQ9hmbdnaeaOydbgQ9hmbaAydbhQdnaCydbgXcu9hmbaQcu9hmbaKaefcb86bbxikaKaefhYdnaeaXSmbaeaQSmbaYce86bbxikaYcl86bbxdkdnaea8EaQcdtgXfydb9hmbdnaCydbgYcuSmbaeaYSmbaAydbg8FcuSmbaea8FSmbagaXfydbg3cuSmba3aQSmbahaXfydbgXcuSmbaXaQSmbdnaLaYcdtfydbgQaLaXcdtfydb9hmbaQaLa8FcdtfydbgXSmbaXaLa3cdtfydb9hmbaKaefcd86bbxlkaKaefcl86bbxikaKaefcl86bbxdkaKaefcl86bbxekaKaefaKaQfRbb86bbkaHclfhHaOclfhOaCclfhCaAclfhAalaecefge9hmbkdnaqTmbdndnazTmbazheaLhHalhOindnaqaeydbfRbbTmbaKaHydbfcl86bbkaeclfheaHclfhHaOcufgOmbxdkkaLhealhHindnaqRbbTmbaKaeydbfcl86bbkaqcefhqaeclfheaHcufgHmbkkaLhealhOaKhHindnaKaeydbfRbbcl9hmbaHcl86bbkaeclfheaHcefhHaOcufgOmbkkamceGTmbaKhealhHindnaeRbbce9hmbaecl86bbkaecefheaHcufgHmbkkcualcx2alc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbhaascxfasyd2gecdtfaaBdbasaecefBd2aaaialavazz:djjjbh8NdndnaDmbcbhycbh8Jxekcbh8JawhecbhHindnaeIdbJbbbb9ETmbasc;Wbfa8JcdtfaHBdba8Jcefh8JkaeclfheaDaHcefgH9hmbkcua8Jal2gecdtaecFFFFi0Ecbyd:m:jjjbHjjjjbbhyascxfasyd2gecdtfayBdbasaecefBd2alTmba8JTmbarcd4hYdnazTmba8Jcdth8FcbhQayhXinaoazaQcdtfydbaY2cdtfhAasc;WbfheaXhHa8JhOinaHaAaeydbcdtgCfIdbawaCfIdbNUdbaeclfheaHclfhHaOcufgOmbkaXa8FfhXaQcefgQal9hmbxdkka8Jcdth8FcbhQayhXinaoaQaY2cdtfhAasc;WbfheaXhHa8JhOinaHaAaeydbcdtgCfIdbawaCfIdbNUdbaeclfheaHclfhHaOcufgOmbkaXa8FfhXaQcefgQal9hmbkkcualc8S2gHalc;D;O;f8U0EgCcbyd:m:jjjbHjjjjbbheascxfasyd2gOcdtfaeBdbasaOcefBd2aecbaHz:ljjjbhqdndndndna8JTmbaCcbyd:m:jjjbHjjjjbbhvascxfasyd2gecdtfavBdbcehOasaecefBd2avcbaHz:ljjjb8Acua8Jal2gecltgHaecFFFFb0Ecbyd:m:jjjbHjjjjbbhrascxfasyd2gecdtfarBdbasaecefBd2arcbaHz:ljjjb8AadmexikcbhvadTmecbhrkcbhAabhHindnaaaHclfydbgQcx2fgeIdbaaaHydbgXcx2fgOIdbg8P:tgIaaaHcwfydbgYcx2fgCIdlaOIdlg8R:tg8SNaCIdba8P:tgRaeIdla8R:tg8UN:tg8Va8VNa8UaCIdwaOIdwg8W:tg8XNa8SaeIdwa8W:tg8UN:tg8Sa8SNa8UaRNa8XaIN:tgIaINMM:rgRJbbbb9ETmba8VaR:vh8VaIaR:vhIa8SaR:vh8SkaqaLaXcdtfydbc8S2fgea8SaR:rgRa8SNNg8UaeIdbMUdbaeaIaRaINg8YNg8XaeIdlMUdlaea8VaRa8VNg8ZNg80aeIdwMUdwaea8Ya8SNg8YaeIdxMUdxaea8Za8SNg81aeIdzMUdzaea8ZaINg8ZaeIdCMUdCaea8SaRa8Va8WNa8Sa8PNa8RaINMM:mg8RNg8PNg8SaeIdKMUdKaeaIa8PNgIaeId3MUd3aea8Va8PNg8VaeIdaMUdaaea8Pa8RNg8PaeId8KMUd8KaeaRaeIdyMUdyaqaLaQcdtfydbc8S2fgea8UaeIdbMUdbaea8XaeIdlMUdlaea80aeIdwMUdwaea8YaeIdxMUdxaea81aeIdzMUdzaea8ZaeIdCMUdCaea8SaeIdKMUdKaeaIaeId3MUd3aea8VaeIdaMUdaaea8PaeId8KMUd8KaeaRaeIdyMUdyaqaLaYcdtfydbc8S2fgea8UaeIdbMUdbaea8XaeIdlMUdlaea80aeIdwMUdwaea8YaeIdxMUdxaea81aeIdzMUdzaea8ZaeIdCMUdCaea8SaeIdKMUdKaeaIaeId3MUd3aea8VaeIdaMUdaaea8PaeId8KMUd8KaeaRaeIdyMUdyaHcxfhHaAcifgAad6mbkcbh8FabhXinaba8FcdtfhQcbhHinaKaQaHc;a1jjbfydbcdtfydbgOfRbbhedndnaKaXaHfydbgCfRbbgAc99fcFeGcpe0mbaec99fcFeGc;:e6mekdnaAcufcFeGce0mbahaCcdtfydbaO9hmekdnaecufcFeGce0mbagaOcdtfydbaC9hmekdnaAcv2aefc:G1jjbfRbbTmbaLaOcdtfydbaLaCcdtfydb0mekJbbacJbbacJbbjZaecFeGceSEaAceSEh8ZdnaaaQaHc;e1jjbfydbcdtfydbcx2fgeIdwaaaCcx2fgAIdwg8R:tg8VaaaOcx2fgYIdwa8R:tg8Sa8SNaYIdbaAIdbg8W:tgIaINaYIdlaAIdlg8U:tgRaRNMMg8PNa8Va8SNaeIdba8W:tg80aINaRaeIdla8U:tg8YNMMg8Xa8SN:tg8Va8VNa80a8PNa8XaIN:tg8Sa8SNa8Ya8PNa8XaRN:tgIaINMM:rgRJbbbb9ETmba8VaR:vh8VaIaR:vhIa8SaR:vh8SkaqaLaCcdtfydbc8S2fgea8Sa8Za8P:rNgRa8SNNg8XaeIdbMUdbaeaIaRaINg8ZNg80aeIdlMUdlaea8VaRa8VNg8PNg8YaeIdwMUdwaea8Za8SNg8ZaeIdxMUdxaea8Pa8SNg81aeIdzMUdzaea8PaINgBaeIdCMUdCaea8SaRa8Va8RNa8Sa8WNa8UaINMM:mg8RNg8PNg8SaeIdKMUdKaeaIa8PNgIaeId3MUd3aea8Va8PNg8VaeIdaMUdaaea8Pa8RNg8PaeId8KMUd8KaeaRaeIdyMUdyaqaLaOcdtfydbc8S2fgea8XaeIdbMUdbaea80aeIdlMUdlaea8YaeIdwMUdwaea8ZaeIdxMUdxaea81aeIdzMUdzaeaBaeIdCMUdCaea8SaeIdKMUdKaeaIaeId3MUd3aea8VaeIdaMUdaaea8PaeId8KMUd8KaeaRaeIdyMUdykaHclfgHcx9hmbkaXcxfhXa8Fcifg8Fad6mbkdna8JTmbcbhXinJbbbbh8WaaabaXcdtfgeclfydbgYcx2fgHIdwaaaeydbg8Fcx2fgOIdwg8Y:tgIaINaHIdbaOIdbg81:tg8Va8VNaHIdlaOIdlgB:tgRaRNMMg8Zaaaecwfydbg3cx2fgeIdwa8Y:tg8PNaIaIa8PNa8VaeIdba81:tg8RNaRaeIdlaB:tg8UNMMg8SN:tJbbbbJbbjZa8Za8Pa8PNa8Ra8RNa8Ua8UNMMg80Na8Sa8SN:tg8X:va8XJbbbb9BEg8XNh83a80aINa8Pa8SN:ta8XNhUa8Za8UNaRa8SN:ta8XNh85a80aRNa8Ua8SN:ta8XNh86a8Za8RNa8Va8SN:ta8XNh87a80a8VNa8Ra8SN:ta8XNh88a8Va8UNa8RaRN:tg8Sa8SNaRa8PNa8UaIN:tg8Sa8SNaIa8RNa8Pa8VN:tg8Sa8SNMM:rJbbbZNh8Saya8Fa8J2gwcdtfhHaya3a8J2g8LcdtfhOayaYa8J2gicdtfhCa8Y:mh89aB:mh8:a81:mhZcbhAa8JhQJbbbbh8UJbbbbh8XJbbbbh8ZJbbbbh80Jbbbbh8YJbbbbh81JbbbbhBJbbbbhnJbbbbhcinasc;WbfaAfgecwfa8SaUaCIdbaHIdbg8P:tgRNa83aOIdba8P:tg8RNMgINUdbaeclfa8Sa86aRNa85a8RNMg8VNUdbaea8Sa88aRNa87a8RNMgRNUdbaecxfa8Sa89aINa8:a8VNa8PaZaRNMMMg8PNUdba8SaIa8VNNa80Mh80a8SaIaRNNa8YMh8Ya8Sa8VaRNNa81Mh81a8Sa8Pa8PNNa8WMh8Wa8SaIa8PNNa8UMh8Ua8Sa8Va8PNNa8XMh8Xa8SaRa8PNNa8ZMh8Za8SaIaINNaBMhBa8Sa8Va8VNNanMhna8SaRaRNNacMhcaHclfhHaCclfhCaOclfhOaAczfhAaQcufgQmbkava8Fc8S2fgeacaeIdbMUdbaeanaeIdlMUdlaeaBaeIdwMUdwaea81aeIdxMUdxaea8YaeIdzMUdzaea80aeIdCMUdCaea8ZaeIdKMUdKaea8XaeId3MUd3aea8UaeIdaMUdaaea8WaeId8KMUd8Kaea8SaeIdyMUdyavaYc8S2fgeacaeIdbMUdbaeanaeIdlMUdlaeaBaeIdwMUdwaea81aeIdxMUdxaea8YaeIdzMUdzaea80aeIdCMUdCaea8ZaeIdKMUdKaea8XaeId3MUd3aea8UaeIdaMUdaaea8WaeId8KMUd8Kaea8SaeIdyMUdyava3c8S2fgeacaeIdbMUdbaeanaeIdlMUdlaeaBaeIdwMUdwaea81aeIdxMUdxaea8YaeIdzMUdzaea80aeIdCMUdCaea8ZaeIdKMUdKaea8XaeId3MUd3aea8UaeIdaMUdaaea8WaeId8KMUd8Kaea8SaeIdyMUdyarawcltfhQcbhHa8JhCinaQaHfgeasc;WbfaHfgOIdbaeIdbMUdbaeclfgAaOclfIdbaAIdbMUdbaecwfgAaOcwfIdbaAIdbMUdbaecxfgeaOcxfIdbaeIdbMUdbaHczfhHaCcufgCmbkaraicltfhQcbhHa8JhCinaQaHfgeasc;WbfaHfgOIdbaeIdbMUdbaeclfgAaOclfIdbaAIdbMUdbaecwfgAaOcwfIdbaAIdbMUdbaecxfgeaOcxfIdbaeIdbMUdbaHczfhHaCcufgCmbkara8LcltfhQcbhHa8JhCinaQaHfgeasc;WbfaHfgOIdbaeIdbMUdbaeclfgAaOclfIdbaAIdbMUdbaecwfgAaOcwfIdbaAIdbMUdbaecxfgeaOcxfIdbaeIdbMUdbaHczfhHaCcufgCmbkaXcifgXad6mbkkcbhOxekcehOcbhrkcbh3dndnamcwGg9cmbJbbbbh8UcbhJcbhocbhCxekcbhea5cbyd:m:jjjbHjjjjbbhCascxfasyd2gHcdtfaCBdbasaHcefBd2dnalTmbaChHinaHaeBdbaHclfhHalaecefge9hmbkkdnaOmbcbh8Finaba8FcdtfhYcbhXinaLaYaXcdtgec;a1jjbfydbcdtfydbcdtfydbhHdnaCaLaYaefydbcdtfydbgOcdtfgAydbgeaOSmbinaAaCaegOcdtfgQydbgeBdbaQhAaOae9hmbkkdnaCaHcdtfgAydbgeaHSmbinaAaCaegHcdtfgQydbgeBdbaQhAaHae9hmbkkdnaOaHSmbaCaOaHaOaH0EcdtfaOaHaOaH6EBdbkaXcefgXci9hmbka8Fcifg8Fad6mbkkcbhJdnalTmbcbhQindnaLaQcdtgefydbaQ9hmbaQhHdnaCaefgXydbgeaQSmbaXhOinaOaCaegHcdtfgAydbgeBdbaAhOaHae9hmbkkaXaHBdbkaQcefgQal9hmbkcbheaLhOaChHcbhJindndnaeaOydbgA9hmbdnaeaHydbgA9hmbaHaJBdbaJcefhJxdkaHaCaAcdtfydbBdbxekaHaCaAcdtfydbBdbkaOclfhOaHclfhHalaecefge9hmbkkcuaJcltgeaJcjjjjiGEcbyd:m:jjjbHjjjjbbhoascxfasyd2gHcdtfaoBdbasaHcefBd2aocbaez:ljjjbhAdnalTmbaChOaahealhQinaecwfIdbh8SaeclfIdbhIaAaOydbcltfgHaeIdbaHIdbMUdbaHclfgXaIaXIdbMUdbaHcwfgXa8SaXIdbMUdbaHcxfgHaHIdbJbbjZMUdbaOclfhOaecxfheaQcufgQmbkkdnaJTmbaAheaJhHinaecxfgOIdbh8SaOcbBdbaeaeIdbJbbbbJbbjZa8S:va8SJbbbb9BEg8SNUdbaeclfgOa8SaOIdbNUdbaecwfgOa8SaOIdbNUdbaeczfheaHcufgHmbkkdnalTmbaChOaahealhQinaAaOydbcltfgHcxfgXaecwfIdbaHcwfIdb:tg8Sa8SNaeIdbaHIdb:tg8Sa8SNaeclfIdbaHclfIdb:tg8Sa8SNMMg8SaXIdbgIaIa8S9DEUdbaOclfhOaecxfheaQcufgQmbkkdnaJmbcbhJJFFuuh8UxekaAcxfheaAhHaJhOinaHaeIdbUdbaeczfheaHclfhHaOcufgOmbkJFFuuh8UaAheaJhHinaeIdbg8Sa8Ua8Ua8S9EEh8UaeclfheaHcufgHmbkkasydlh9ednalTmba9eclfhea9eydbhAaKhHalhQcbhOincbaeydbgXaA9RaHRbbcpeGEaOfhOaHcefhHaeclfheaXhAaQcufgQmbkaOce4h3kcuada39RcifgTcx2aTc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbhDascxfasyd2gecdtfaDBdbasaecefBd2cuaTcdtaTcFFFFi0Ecbyd:m:jjjbHjjjjbbhSascxfasyd2gecdtfaSBdbasaecefBd2a5cbyd:m:jjjbHjjjjbbh8Mascxfasyd2gecdtfa8MBdbasaecefBd2alcbyd:m:jjjbHjjjjbbh9hascxfasyd2gecdtfa9hBdbasaecefBd2axaxNa8NJbbjZamclGEg83a83N:vhcJbbbbhndnadak9nmbdnaTci6mba8Jclth9iaDcwfh6JbbbbhBJbbbbhninasclfabadalaLz:cjjjbabh3cbhEcbh5inaba5cdtfhwcbheindnaLa3aefydbgOcdtg8FfydbgQaLawaec;q1jjbfydbcdtfydbgHcdtg8LfydbgXSmbaKaHfRbbgYcv2aKaOfRbbgAfc;G1jjbfRbbg8AaAcv2aYfgic;G1jjbfRbbg8KVcFeGTmbdnaXaQ9nmbaic:G1jjbfRbbcFeGmekaAcufhQdnaAaY9hmbaQcFeGce0mbaha8FfydbaH9hmekdndnaAclSmbaYcl9hmekdnaQcFeGce0mbaha8FfydbaH9hmdkaYcufcFeGce0mbaga8LfydbaO9hmekaDaEcx2fgAaHaOa8KcFeGgQEBdlaAaOaHaQEBdbaAaQa8AGcb9hBdwaEcefhEkaeclfgecx9hmbkdna5cifg5ad9pmba3cxfh3aEcifaT9nmekkaETmdcbhYinaqaLaDaYcx2fgAydbgQcdtg3fydbc8S2fgeIdwaaaAydlgXcx2fgHIdwg8VNaeIdzaHIdbgRNaeIdaMg8Sa8SMMa8VNaeIdlaHIdlg8PNaeIdCa8VNaeId3Mg8Sa8SMMa8PNaeIdbaRNaeIdxa8PNaeIdKMg8Sa8SMMaRNaeId8KMMM:lh8SJbbbbJbbjZaeIdygI:vaIJbbbb9BEhIdndnaAydwg8FmbJFFuuh8XxekJbbbbJbbjZaqaLaXcdtfydbc8S2fgeIdyg8R:va8RJbbbb9BEaeIdwaaaQcx2fgHIdwg8RNaeIdzaHIdbg8WNaeIdaMg8Xa8XMMa8RNaeIdlaHIdlg8XNaeIdCa8RNaeId3Mg8Ra8RMMa8XNaeIdba8WNaeIdxa8XNaeIdKMg8Ra8RMMa8WNaeId8KMMM:lNh8XkaIa8SNh8Zdna8JTmbavaQc8S2fgOIdwa8VNaOIdzaRNaOIdaMg8Sa8SMMa8VNaOIdla8PNaOIdCa8VNaOId3Mg8Sa8SMMa8PNaOIdbaRNaOIdxa8PNaOIdKMg8Sa8SMMaRNaOId8KMMMh8SayaXa8J2gwcdtfhHaraQa8J2g8LcltfheaOIdyh8Ra8JhOinaHIdbgIaIa8RNaecxfIdba8VaecwfIdbNaRaeIdbNa8PaeclfIdbNMMMgIaIM:tNa8SMh8SaHclfhHaeczfheaOcufgOmbkdndna8FmbJbbbbhIxekavaXc8S2fgOIdwaaaQcx2fgeIdwgRNaOIdzaeIdbg8PNaOIdaMgIaIMMaRNaOIdlaeIdlg8RNaOIdCaRNaOId3MgIaIMMa8RNaOIdba8PNaOIdxa8RNaOIdKMgIaIMMa8PNaOId8KMMMhIaya8LcdtfhHarawcltfheaOIdyh8Wa8JhOinaHIdbg8Va8Va8WNaecxfIdbaRaecwfIdbNa8PaeIdbNa8RaeclfIdbNMMMg8Va8VM:tNaIMhIaHclfhHaeczfheaOcufgOmbkaI:lhIka8Za8S:lMh8Za8XaIMh8XaKaQfRbbcd9hmbdnagahaha3fydbaXSEa8Ea3fydbgwcdtfydbg3cu9hmba8EaXcdtfydbh3kavawc8S2fgOIdwaaa3cx2fgeIdwg8VNaOIdzaeIdbgRNaOIdaMg8Sa8SMMa8VNaOIdlaeIdlg8PNaOIdCa8VNaOId3Mg8Sa8SMMa8PNaOIdbaRNaOIdxa8PNaOIdKMg8Sa8SMMaRNaOId8KMMMh8Saya3a8J2g8LcdtfhHarawa8J2gicltfheaOIdyh8Ra8JhOinaHIdbgIaIa8RNaecxfIdba8VaecwfIdbNaRaeIdbNa8PaeclfIdbNMMMgIaIM:tNa8SMh8SaHclfhHaeczfheaOcufgOmbkdndna8FmbJbbbbhIxekava3c8S2fgOIdwaaawcx2fgeIdwgRNaOIdzaeIdbg8PNaOIdaMgIaIMMaRNaOIdlaeIdlg8RNaOIdCaRNaOId3MgIaIMMa8RNaOIdba8PNaOIdxa8RNaOIdKMgIaIMMa8PNaOId8KMMMhIayaicdtfhHara8LcltfheaOIdyh8Wa8JhOinaHIdbg8Va8Va8WNaecxfIdbaRaecwfIdbNa8PaeIdbNa8RaeclfIdbNMMMg8Va8VM:tNaIMhIaHclfhHaeczfheaOcufgOmbkaI:lhIka8Za8S:lMh8Za8XaIMh8XkaAa8Za8Xa8Za8X9FgeEUdwaAaXaQaea8FTVgeEBdlaAaQaXaeEBdbaYcefgYaE9hmbkasc;Wbfcbcj;qbz:ljjjb8Aa6heaEhHinasc;WbfaeydbcA4cF8FGgOcFAaOcFA6EcdtfgOaOydbcefBdbaecxfheaHcufgHmbkcbhecbhHinasc;WbfaefgOydbhAaOaHBdbaAaHfhHaeclfgecj;qb9hmbkcbhea6hHinasc;WbfaHydbcA4cF8FGgOcFAaOcFA6EcdtfgOaOydbgOcefBdbaSaOcdtfaeBdbaHcxfhHaEaecefge9hmbkadak9RgOci9Uh9kdnalTmbcbhea8MhHinaHaeBdbaHclfhHalaecefge9hmbkkcbh0a9hcbalz:ljjjbh5aOcO9Uh9ma9kce4h9nasydwh9ocbh8Kcbh8AdninaDaSa8Acdtfydbcx2fgiIdwg8Sac9Emea8Ka9k9pmeJFFuuhIdna9naE9pmbaDaSa9ncdtfydbcx2fIdwJbb;aZNhIkdna8SaI9ETmba8San9ETmba8Ka9m0mdkdna5aLaiydlgwcdtg9pfydbgAfg9qRbba5aLaiydbg3cdtg9rfydbgefg9sRbbVmbaKa3fRbbh9tdna9eaecdtfgHclfydbgOaHydbgHSmbaOaH9RhQaaaAcx2fhYaaaecx2fh8Fa9oaHcitfhecbhHceh8Ldnindna8MaeydbcdtfydbgOaASmba8MaeclfydbcdtfydbgXaASmbaOaXSmbaaaXcx2fgXIdbaaaOcx2fgOIdbg8V:tg8Sa8FIdlaOIdlgR:tg8WNa8FIdba8V:tg8XaXIdlaR:tgIN:tg8Pa8SaYIdlaR:tg8ZNaYIdba8V:tg80aIN:tgRNaIa8FIdwaOIdwg8R:tg8YNa8WaXIdwa8R:tg8VN:tg8WaIaYIdwa8R:tg81Na8Za8VN:tgINa8Va8XNa8Ya8SN:tg8Ra8Va80Na81a8SN:tg8SNMMa8Pa8PNa8Wa8WNa8Ra8RNMMaRaRNaIaINa8Sa8SNMMN:rJbbj8:N9FmdkaecwfheaHcefgHaQ6h8LaQaH9hmbkka8LceGTmba9ncefh9nxekdndndndna9tc9:fPdebdka3heina8MaecdtgefawBdba8Eaefydbgea39hmbxikkdnagahaha9rfydbawSEa8Ea9rfydbg3cdtfydbgecu9hmba8Ea9pfydbheka8Ma9rfawBdbaehwka8Ma3cdtfawBdbka9sce86bba9qce86bbaiIdwg8Sanana8S9DEhna0cefh0cecda9tceSEa8Kfh8Kka8Acefg8AaE9hmbkka0TmddnalTmbcbhXcbh8Findna8Ma8FcdtgefydbgOa8FSmbaLaOcdtfydbh3dna8FaLaefydb9hgwmbaqa3c8S2fgeaqa8Fc8S2fgHIdbaeIdbMUdbaeaHIdlaeIdlMUdlaeaHIdwaeIdwMUdwaeaHIdxaeIdxMUdxaeaHIdzaeIdzMUdzaeaHIdCaeIdCMUdCaeaHIdKaeIdKMUdKaeaHId3aeId3MUd3aeaHIdaaeIdaMUdaaeaHId8KaeId8KMUd8KaeaHIdyaeIdyMUdyka8JTmbavaOc8S2fgeava8Fc8S2g8LfgHIdbaeIdbMUdbaeaHIdlaeIdlMUdlaeaHIdwaeIdwMUdwaeaHIdxaeIdxMUdxaeaHIdzaeIdzMUdzaeaHIdCaeIdCMUdCaeaHIdKaeIdKMUdKaeaHId3aeId3MUd3aeaHIdaaeIdaMUdaaeaHId8KaeId8KMUd8KaeaHIdyaeIdyMUdya9iaO2hYarhHa8JhAinaHaYfgeaHaXfgOIdbaeIdbMUdbaeclfgQaOclfIdbaQIdbMUdbaecwfgQaOcwfIdbaQIdbMUdbaecxfgeaOcxfIdbaeIdbMUdbaHczfhHaAcufgAmbkawmbJbbbbJbbjZaqa8LfgeIdyg8S:va8SJbbbb9BEaeIdwaaa3cx2fgHIdwg8SNaeIdzaHIdbgINaeIdaMg8Va8VMMa8SNaeIdlaHIdlg8VNaeIdCa8SNaeId3Mg8Sa8SMMa8VNaeIdbaINaeIdxa8VNaeIdKMg8Sa8SMMaINaeId8KMMM:lNg8SaBaBa8S9DEhBkaXa9ifhXa8Fcefg8Fal9hmbkcbhHahheindnaeydbgOcuSmbdnaHa8MaOcdtgAfydbgO9hmbcuhOahaAfydbgAcuSmba8MaAcdtfydbhOkaeaOBdbkaeclfhealaHcefgH9hmbkcbhHagheindnaeydbgOcuSmbdnaHa8MaOcdtgAfydbgO9hmbcuhOagaAfydbgAcuSmba8MaAcdtfydbhOkaeaOBdbkaeclfhealaHcefgH9hmbkkaBana8JEhBcbhAabhecbhQindna8MaeydbcdtfydbgHa8MaeclfydbcdtfydbgOSmbaHa8MaecwfydbcdtfydbgXSmbaOaXSmbabaAcdtfgYaHBdbaYcwfaXBdbaYclfaOBdbaAcifhAkaecxfheaQcifgQad6mbkdndna9cTmbaAak9nmba8UaB9FTmbcbhdabhecbhHindnaoaCaeydbgOcdtfydbcdtfIdbaB9ETmbabadcdtfgQaOBdbaQclfaeclfydbBdbaQcwfaecwfydbBdbadcifhdkaecxfheaHcifgHaA6mbkJFFuuh8UaJTmeaoheaJhHJFFuuh8SinaeIdbgIa8Sa8SaI9EEg8Va8SaIaB9EgOEh8Sa8Va8UaOEh8UaeclfheaHcufgHmbxdkkaAhdkadak0mbxdkkasclfabadalaLz:cjjjbkdndnadak0mbadhOxekdna9cmbadhOxekdna8Uac9FmbadhOxekina8UJbb;aZNg8Saca8Sac9DEh8VJbbbbh8SdnaJTmbaoheaJhHinaeIdbgIa8SaIa8V9FEa8SaIa8S9EEh8SaeclfheaHcufgHmbkkcbhOabhecbhHindnaoaCaeydbgAcdtfydbcdtfIdba8V9ETmbabaOcdtfgQaABdbaQclfaeclfydbBdbaQcwfaecwfydbBdbaOcifhOkaecxfheaHcifgHad6mbkJFFuuh8UdnaJTmbaoheaJhHJFFuuhIinaeIdbgRaIaIaR9EEg8PaIaRa8V9EgAEhIa8Pa8UaAEh8UaeclfheaHcufgHmbkkdnaOad9hmbadhOxdka8Sanana8S9DEhnaOak9nmeaOhda8Uac9FmbkkdnamcjjjjlGTmbazmbaOTmbcbhLabheinaKaeydbgAfRbbc3thXaecwfgYydbhHdndnahaAcdtg3fydbaeclfg8FydbgCSmbcbhQagaCcdtfydbaA9hmekcjjjj94hQkaeaXaQVaAVBdbaKaCfRbbc3thXdndnahaCcdtfydbaHSmbcbhQagaHcdtfydbaC9hmekcjjjj94hQka8FaXaQVaCVBdbaKaHfRbbc3thQdndnahaHcdtfydbaASmbcbhCaga3fydbaH9hmekcjjjj94hCkaYaQaCVaHVBdbaecxfheaLcifgLaO6mbkkdnazTmbaOTmbaOheinabazabydbcdtfydbBdbabclfhbaecufgembkkdnaPTmbaPa83an:rNUdbkasyd2gecdtascxffc98fhHdninaeTmeaHydbcbyd1:jjjbH:bjjjbbaHc98fhHaecufhexbkkasc;W;qbf8KjjjjbaOk;Yieouabydlhvabydbclfcbaicdtz:ljjjbhoadci9UhrdnadTmbdnalTmbaehwadhDinaoalawydbcdtfydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbxdkkaehwadhDinaoawydbcdtfgqaqydbcefBdbawclfhwaDcufgDmbkkdnaiTmbcbhDaohwinawydbhqawaDBdbawclfhwaqaDfhDaicufgimbkkdnadci6mbinaecwfydbhwaeclfydbhDaeydbhidnalTmbalawcdtfydbhwalaDcdtfydbhDalaicdtfydbhikavaoaicdtfgqydbcitfaDBdbavaqydbcitfawBdlaqaqydbcefBdbavaoaDcdtfgqydbcitfawBdbavaqydbcitfaiBdlaqaqydbcefBdbavaoawcdtfgwydbcitfaiBdbavawydbcitfaDBdlawawydbcefBdbaecxfhearcufgrmbkkabydbcbBdbk;Qodvuv998Jjjjjbca9Rgvczfcwfcbyd11jjbBdbavcb8Pdj1jjb83izavcwfcbydN1jjbBdbavcb8Pd:m1jjb83ibdnadTmbaicd4hodnabmbdnalTmbcbhrinaealarcdtfydbao2cdtfhwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxikkaocdthrcbhwincbhiinavczfaifgDaeaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkaearfheawcefgwad9hmbxdkkdnalTmbcbhrinabarcx2fgiaealarcdtfydbao2cdtfgwIdbUdbaiawIdlUdlaiawIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkarcefgrad9hmbxdkkaocdthlcbhraehwinabarcx2fgiaearao2cdtfgDIdbUdbaiaDIdlUdlaiaDIdwUdwcbhiinavczfaifgDawaifIdbgqaDIdbgkakaq9EEUdbavaifgDaqaDIdbgkakaq9DEUdbaiclfgicx9hmbkawalfhwarcefgrad9hmbkkJbbbbavIdbavIdzgk:tgqaqJbbbb9DEgqavIdlavIdCgx:tgmamaq9DEgqavIdwavIdKgm:tgPaPaq9DEhPdnabTmbadTmbJbbbbJbbjZaP:vaPJbbbb9BEhqinabaqabIdbak:tNUdbabclfgvaqavIdbax:tNUdbabcwfgvaqavIdbam:tNUdbabcxfhbadcufgdmbkkaPk8MbabaeadaialavcbcbcbcbcbaoarawaDz:bjjjbk8MbabaeadaialavaoarawaDaqakaxamaPz:bjjjbk:DCoDud99rue99iul998Jjjjjbc;Wb9Rgw8KjjjjbdndnarmbcbhDxekawcxfcbc;Kbz:ljjjb8Aawcuadcx2adc;v:Q;v:Qe0Ecbyd:m:jjjbHjjjjbbgqBdxawceBd2aqaeadaicbz:djjjb8AawcuadcdtadcFFFFi0Egkcbyd:m:jjjbHjjjjbbgxBdzawcdBd2adcd4adfhmceheinaegicetheaiam6mbkcbhPawcuaicdtgsaicFFFFi0Ecbyd:m:jjjbHjjjjbbgzBdCawciBd2dndnar:ZgH:rJbbbZMgO:lJbbb9p9DTmbaO:Ohexekcjjjj94hekaicufhAc:bwhmcbhCadhXcbhQinaChLaeamgKcufaeaK9iEaPgDcefaeaD9kEhYdndnadTmbaYcuf:YhOaqhiaxheadhmindndnaiIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdbaONJbbbZMg8A:lJbbb9p9DTmba8A:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ljjjbh3cbh5cbhPindna3axaPcdtfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbaeaCSmbcehiina3amaifaAGgmcdtfgEydbgecuSmeaicefhiaeaC9hmbkkaEaCBdba5aecuSfh5aPcefgPad9hmbxdkkazcFeasz:ljjjb8Acbh5kaDaYa5ar0giEhPaLa5aiEhCdna5arSmbaYaKaiEgmaP9Rcd9imbdndnaQcl0mbdnaX:ZgOaL:Zg8A:taY:Yg8EaD:Y:tg8Fa8EaK:Y:tgaa5:ZghaH:tNNNaOaH:taaNa8Aah:tNa8AaH:ta8FNahaO:tNM:va8EMJbbbZMgO:lJbbb9p9DTmbaO:Ohexdkcjjjj94hexekaPamfcd9Theka5aXaiEhXaQcefgQcs9hmekkdndnaCmbcihicbhDxekcbhiawakcbyd:m:jjjbHjjjjbbg5BdKawclBd2aPcuf:Yh8AdndnadTmbaqhiaxheadhmindndnaiIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhCxekcjjjj94hCkaCcCthCdndnaiclfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaEcqtaCVhCdndnaicwfIdba8ANJbbbZMgO:lJbbb9p9DTmbaO:OhExekcjjjj94hEkaeaCaEVBdbaicxfhiaeclfheamcufgmmbkazcFeasz:ljjjbh3cbhDcbhYindndndna3axaYcdtgKfydbgCcm4aC7c:v;t;h;Ev2gics4ai7aAGgmcdtfgEydbgecuSmbcehiinaxaecdtgefydbaCSmdamaifheaicefhia3aeaAGgmcdtfgEydbgecu9hmbkkaEaYBdbaDhiaDcefhDxeka5aefydbhika5aKfaiBdbaYcefgYad9hmbkcuaDc32giaDc;j:KM;jb0EhexekazcFeasz:ljjjb8AcbhDcbhekawaecbyd:m:jjjbHjjjjbbgeBd3awcvBd2aecbaiz:ljjjbhEavcd4hKdnadTmbdnalTmbaKcdth3a5hCaqhealhmadhAinaEaCydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiamIdbaiIdxMUdxaiamclfIdbaiIdzMUdzaiamcwfIdbaiIdCMUdCaiaiIdKJbbjZMUdKaCclfhCaecxfheama3fhmaAcufgAmbxdkka5hmaqheadhCinaEamydbc32fgiaeIdbaiIdbMUdbaiaeclfIdbaiIdlMUdlaiaecwfIdbaiIdwMUdwaiaiIdxJbbbbMUdxaiaiIdzJbbbbMUdzaiaiIdCJbbbbMUdCaiaiIdKJbbjZMUdKamclfhmaecxfheaCcufgCmbkkdnaDTmbaEhiaDheinaiaiIdbJbbbbJbbjZaicKfIdbgO:vaOJbbbb9BEgONUdbaiclfgmaOamIdbNUdbaicwfgmaOamIdbNUdbaicxfgmaOamIdbNUdbaiczfgmaOamIdbNUdbaicCfgmaOamIdbNUdbaic3fhiaecufgembkkcbhCawcuaDcdtgYaDcFFFFi0Egicbyd:m:jjjbHjjjjbbgeBdaawcoBd2awaicbyd:m:jjjbHjjjjbbg3Bd8KaecFeaYz:ljjjbhxdnadTmbJbbjZJbbjZa8A:vaPceSEaoNgOaONh8AaKcdthPalheina8Aaec;81jjbalEgmIdwaEa5ydbgAc32fgiIdC:tgOaONamIdbaiIdx:tgOaONamIdlaiIdz:tgOaONMMNaqcwfIdbaiIdw:tgOaONaqIdbaiIdb:tgOaONaqclfIdbaiIdl:tgOaONMMMhOdndnaxaAcdtgifgmydbcuSmba3aifIdbaO9ETmekamaCBdba3aifaOUdbka5clfh5aqcxfhqaeaPfheadaCcefgC9hmbkkabaxaYz:kjjjb8AcrhikaicdthiinaiTmeaic98fgiawcxffydbcbyd1:jjjbH:bjjjbbxbkkawc;Wbf8KjjjjbaDk:Ydidui99ducbhi8Jjjjjbca9Rglczfcwfcbyd11jjbBdbalcb8Pdj1jjb83izalcwfcbydN1jjbBdbalcb8Pd:m1jjb83ibdndnaembJbbjFhvJbbjFhoJbbjFhrxekadcd4cdthwincbhdinalczfadfgDabadfIdbgvaDIdbgoaoav9EEUdbaladfgDavaDIdbgoaoav9DEUdbadclfgdcx9hmbkabawfhbaicefgiae9hmbkalIdwalIdK:thralIdlalIdC:thoalIdbalIdz:thvkJbbbbavavJbbbb9DEgvaoaoav9DEgvararav9DEk9DeeuabcFeaicdtz:ljjjbhlcbhbdnadTmbindnalaeydbcdtfgiydbcu9hmbaiabBdbabcefhbkaeclfheadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcifc98GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd:q:jjjbgeabcrfc94GfgbBd:q:jjjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd:q:jjjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd:q:jjjbfgdBd:q:jjjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk6eiucbhidnadTmbdninabRbbglaeRbbgv9hmeaecefheabcefhbadcufgdmbxdkkalav9Rhikaikk:Iedbcjwk1eFFuuFFuuFFuuFFuFFFuFFFuFbbbbbbbbeeebeebebbeeebebbbbbebebbbbbbbbbebbbdbbbbbbbebbbebbbdbbbbbbbbbbbeeeeebebbebbebebbbeebbbbbbbbbbbbbbbbbbbbbc1Dkxebbbdbbb:GNbb"),{}).then((function(b){(a=b.instance).exports.__wasm_call_ctors();}));function c(a){if(!a)throw new Error("Assertion failed")}function t(a){return new Uint8Array(a.buffer,a.byteOffset,a.byteLength)}function d(b,e,c,d,n,i,r,f){var o=a.exports.sbrk,h=o(4*f),s=o(c*d),l=o(c*i),g=new Uint8Array(a.exports.memory.buffer);g.set(t(e),s),n&&g.set(t(n),l);var u=b(h,s,c,d,l,i,r,f);g=new Uint8Array(a.exports.memory.buffer);var m=new Uint32Array(u);return t(m).set(g.subarray(h,h+4*u)),o(h-o(0)),m}var n={LockBorder:1,Sparse:2,ErrorAbsolute:4,Prune:8,_InternalDebug:1<<30};return {ready:e,supported:true,compactMesh:function(b){c(b instanceof Uint32Array||b instanceof Int32Array||b instanceof Uint16Array||b instanceof Int16Array),c(b.length%3==0);var e=4==b.BYTES_PER_ELEMENT?b:new Uint32Array(b);return function(b,e,c){var d=a.exports.sbrk,n=d(4*e.length),i=d(4*c),r=new Uint8Array(a.exports.memory.buffer),f=t(e);r.set(f,n);var o=b(i,n,e.length,c);r=new Uint8Array(a.exports.memory.buffer);var h=new Uint32Array(c);new Uint8Array(h.buffer).set(r.subarray(i,i+4*c)),f.set(r.subarray(n,n+4*e.length)),d(n-d(0));for(var s=0;s<e.length;++s)e[s]=h[e[s]];return [h,o]}(a.exports.meshopt_optimizeVertexFetchRemap,e,function(a){for(var b=0,e=0;e<a.length;++e){var c=a[e];b=b<c?c:b;}return b}(b)+1)},simplify:function(b,e,d,i,r,f){c(b instanceof Uint32Array||b instanceof Int32Array||b instanceof Uint16Array||b instanceof Int16Array),c(b.length%3==0),c(e instanceof Float32Array),c(e.length%d==0),c(d>=3),c(i>=0&&i<=b.length),c(i%3==0),c(r>=0);for(var o=0,h=0;h<(f?f.length:0);++h)c(f[h]in n),o|=n[f[h]];var s=4==b.BYTES_PER_ELEMENT?b:new Uint32Array(b),l=function(b,e,c,d,n,i,r,f,o){var h=a.exports.sbrk,s=h(4),l=h(4*c),g=h(n*i),u=h(4*c),m=new Uint8Array(a.exports.memory.buffer);m.set(t(d),g),m.set(t(e),u);var p=b(l,u,c,g,n,i,r,f,o,s);m=new Uint8Array(a.exports.memory.buffer);var j=new Uint32Array(p);t(j).set(m.subarray(l,l+4*p));var k=new Float32Array(1);return t(k).set(m.subarray(s,s+4)),h(s-h(0)),[j,k[0]]}(a.exports.meshopt_simplify,s,b.length,e,e.length/d,4*d,i,r,o);return l[0]=b instanceof Uint32Array?l[0]:new b.constructor(l[0]),l},simplifyWithAttributes:function(b,e,d,i,r,f,o,h,s,l){c(b instanceof Uint32Array||b instanceof Int32Array||b instanceof Uint16Array||b instanceof Int16Array),c(b.length%3==0),c(e instanceof Float32Array),c(e.length%d==0),c(d>=3),c(i instanceof Float32Array),c(i.length%r==0),c(r>=0),c(null==o||o instanceof Uint8Array),c(null==o||o.length==e.length/d),c(h>=0&&h<=b.length),c(h%3==0),c(s>=0),c(Array.isArray(f)),c(r>=f.length),c(f.length<=32);for(var g=0;g<f.length;++g)c(f[g]>=0);var u=0;for(g=0;g<(l?l.length:0);++g)c(l[g]in n),u|=n[l[g]];var m=4==b.BYTES_PER_ELEMENT?b:new Uint32Array(b),p=function(b,e,c,d,n,i,r,f,o,h,s,l,g){var u=a.exports.sbrk,m=u(4),p=u(4*c),j=u(n*i),k=u(n*f),y=u(4*o.length),x=u(4*c),w=h?u(n):0,v=new Uint8Array(a.exports.memory.buffer);v.set(t(d),j),v.set(t(r),k),v.set(t(o),y),v.set(t(e),x),h&&v.set(t(h),w);var E=b(p,x,c,j,n,i,k,f,y,o.length,w,s,l,g,m);v=new Uint8Array(a.exports.memory.buffer);var A=new Uint32Array(E);t(A).set(v.subarray(p,p+4*E));var F=new Float32Array(1);return t(F).set(v.subarray(m,m+4)),u(m-u(0)),[A,F[0]]}(a.exports.meshopt_simplifyWithAttributes,m,b.length,e,e.length/d,4*d,i,4*r,new Float32Array(f),o?new Uint8Array(o):null,h,s,u);return p[0]=b instanceof Uint32Array?p[0]:new b.constructor(p[0]),p},getScale:function(b,e){return c(b instanceof Float32Array),c(b.length%e==0),c(e>=3),function(b,e,c,d){var n=a.exports.sbrk,i=n(c*d);new Uint8Array(a.exports.memory.buffer).set(t(e),i);var r=b(i,c,d);return n(i-n(0)),r}(a.exports.meshopt_simplifyScale,b,b.length/e,4*e)},simplifyPoints:function(b,e,t,n,i,r){return c(b instanceof Float32Array),c(b.length%e==0),c(e>=3),c(t>=0&&t<=b.length/e),n?(c(n instanceof Float32Array),c(n.length%i==0),c(i>=3),c(b.length/e==n.length/i),d(a.exports.meshopt_simplifyPoints,b,b.length/e,4*e,n,4*i,r,t)):d(a.exports.meshopt_simplifyPoints,b,b.length/e,4*e,void 0,0,0,t)}}})();!function(){var b=new Uint8Array([32,0,65,2,1,106,34,33,3,128,11,4,13,64,6,253,10,7,15,116,127,5,8,12,40,16,19,54,20,9,27,255,113,17,42,67,24,23,146,148,18,14,22,45,70,69,56,114,101,21,25,63,75,136,108,28,118,29,73,115]);if("object"!=typeof WebAssembly)return {supported:false};WebAssembly.instantiate(function(a){for(var e=new Uint8Array(12765),c=0;c<12765;++c){var t=a.charCodeAt(c);e[c]=t>96?t-97:t>64?t-39:t+4;}var d=0;for(c=0;c<12765;++c)e[d++]=e[c]<60?b[e[c]]:64*(e[c]-60)+e[++c];return e.buffer.slice(0,d)}("b9H79TebbbeVx9Geueu9Geub9Gbb9Giuuueu9Gmuuuuuuuuuuu9999eu9Gvuuuuueu9Gwuuuuuuuub9Gxuuuuuuuuuuuueu9Gkuuuuuuuuuu99eu9Gouuuuuub9Gruuuuuuub9GluuuubiOHdilvorwDDqkbiibeilve9Weiiviebeoweuec:q:Odkr:Yewo9TW9T9VV95dbH9F9F939H79T9F9J9H229F9Jt9VV7bb8A9TW79O9V9Wt9F9I919P29K9nW79O2Wt79c9V919U9KbeX9TW79O9V9Wt9F9I919P29K9nW79O2Wt7bo39TW79O9V9Wt9F9J9V9T9W91tWJ2917tWV9c9V919U9K7br39TW79O9V9Wt9F9J9V9T9W91tW9nW79O2Wt9c9V919U9K7bDL9TW79O9V9Wt9F9V9Wt9P9T9P96W9nW79O2Wtbql79IV9RbkDwebcekdsPq;29zHdbkIbabaec9:fgefcufae9Ugeabci9Uadfcufad9Ugbaeab0Ek:w8KDPue99eux99dui99euo99iu8Jjjjjbc:WD9Rgm8KjjjjbdndnalmbcbhPxekamc:Cwfcbc;Kbz:njjjb8Adndnalcb9imbaoal9nmbamcuaocdtaocFFFFi0Egscbyd:e1jjbHjjjjbbgzBd:CwamceBd;8wamascbyd:e1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd:e1jjbHjjjjbbgOBd:KwamciBd;8waihsalhAinazasydbcdtfcbBdbasclfhsaAcufgAmbkaihsalhAinazasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkaihsalhCcbhXindnazasydbcdtgQfgAydbcb9imbaHaQfaXBdbaAaAydbgQcjjjj94VBdbaQaXfhXkasclfhsaCcufgCmbkalci9UhLdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhXaHaAydbcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaXcdtfgXaXydbgXcefBdbaOaXcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaihsalhAindnazasydbcdtgCfgXydbgQcu9kmbaXaQcFFFFrGgQBdbaHaCfgCaCydbaQ9RBdbkasclfhsaAcufgAmbxdkkamcuaocdtgsaocFFFFi0EgAcbyd:e1jjbHjjjjbbgzBd:CwamceBd;8wamaAcbyd:e1jjbHjjjjbbgHBd:GwamcdBd;8wamcualcdtalcFFFFi0Ecbyd:e1jjbHjjjjbbgOBd:KwamciBd;8wazcbasz:njjjbhXalci9UhLaihsalhAinaXasydbcdtfgCaCydbcefBdbasclfhsaAcufgAmbkdnaoTmbcbhsaHhAaXhCaohQinaAasBdbaAclfhAaCydbasfhsaCclfhCaQcufgQmbkkdnalci6mbcbhsaihAinaAcwfydbhCaAclfydbhQaHaAydbcdtfgKaKydbgKcefBdbaOaKcdtfasBdbaHaQcdtfgQaQydbgQcefBdbaOaQcdtfasBdbaHaCcdtfgCaCydbgCcefBdbaOaCcdtfasBdbaAcxfhAaLascefgs9hmbkkaoTmbcbhsaohAinaHasfgCaCydbaXasfydb9RBdbasclfhsaAcufgAmbkkamaLcbyd:e1jjbHjjjjbbgsBd:OwamclBd;8wascbaLz:njjjbhYamcuaLcK2alcjjjjd0Ecbyd:e1jjbHjjjjbbg8ABd:SwamcvBd;8wJbbbbhEdnalci6g3mbarcd4hKaihAa8AhsaLhrJbbbbh5inavaAclfydbaK2cdtfgCIdlh8EavaAydbaK2cdtfgXIdlhEavaAcwfydbaK2cdtfgQIdlh8FaCIdwhaaXIdwhhaQIdwhgasaCIdbg8JaXIdbg8KMaQIdbg8LMJbbnn:vUdbasclfaXIdlaCIdlMaQIdlMJbbnn:vUdbaQIdwh8MaCIdwh8NaXIdwhyascxfa8EaE:tg8Eagah:tggNa8FaE:tg8Faaah:tgaN:tgEJbbbbJbbjZa8Ja8K:tg8Ja8FNa8La8K:tg8Ka8EN:tghahNaEaENaaa8KNaga8JN:tgEaENMM:rg8K:va8KJbbbb9BEg8ENUdbasczfaEa8ENUdbascCfaha8ENUdbascwfa8Maya8NMMJbbnn:vUdba5a8KMh5aAcxfhAascKfhsarcufgrmbka5aL:Z:vJbbbZNhEkamcuaLcdtalcFFFF970Ecbyd:e1jjbHjjjjbbgCBd:WwamcoBd;8waEaq:ZNhEdna3mbcbhsaChAinaAasBdbaAclfhAaLascefgs9hmbkkaE:rhhcuh8PamcuaLcltalcFFFFd0Ecbyd:e1jjbHjjjjbbgIBd:0wamcrBd;8wcbaIa8AaCaLz:djjjb8AJFFuuhyJFFuuh8RJFFuuh8Sdnalci6gXmbJFFuuh8Sa8AhsaLhAJFFuuh8RJFFuuhyinascwfIdbgEayayaE9EEhyasclfIdbgEa8Ra8RaE9EEh8RasIdbgEa8Sa8SaE9EEh8SascKfhsaAcufgAmbkkahJbbbZNhgamaocetgscuaocu9kEcbyd:e1jjbHjjjjbbgABd:4waAcFeasz:njjjbhCdnaXmbcbhAJFFuuhEa8Ahscuh8PinascwfIdbay:tghahNasIdba8S:tghahNasclfIdba8R:tghahNMM:rghaEa8PcuSahaE9DVgXEhEaAa8PaXEh8PascKfhsaLaAcefgA9hmbkkamczfcbcjwz:njjjb8Aamcwf9cb83ibam9cb83ibagaxNhRJbbjZak:th8Ncbh8UJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80cbh81cbhPinJbbbbhEdna8UTmbJbbjZa8U:Z:vhEkJbbbbhhdna80a80Na8Ya8YNa8Za8ZNMMg8KJbbbb9BmbJbbjZa8K:r:vhhka8XaENh5a8WaENh8Fa8VaENhaa8PhQdndndndndna8UaPVTmbamydwgBTmea80ahNh8Ja8ZahNh8La8YahNh8Maeamydbcdtfh83cbh3JFFuuhEcvhXcuhQindnaza83a3cdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAindndnaCaiaAydbgKcx2fgsclfydbgrcetf8Vebcs4aCasydbgLcetf8Vebcs4faCascwfydbglcetf8Vebcs4fgombcbhsxekcehsazaLcdtfydbgLceSmbcehsazarcdtfydbgrceSmbcehsazalcdtfydbglceSmbdnarcdSaLcdSfalcdSfcd6mbaocefhsxekaocdfhskdnasaX9kmba8AaKcK2fgLIdwa5:thhaLIdla8F:th8KaLIdbaa:th8EdndnakJbbbb9DTmba8E:lg8Ea8K:lg8Ka8Ea8K9EEg8Kah:lgha8Kah9EEag:vJbbjZMhhxekahahNa8Ea8ENa8Ka8KNMM:rag:va8NNJbbjZMJ9VO:d86JbbjZaLIdCa8JNaLIdxa8MNa8LaLIdzNMMakN:tghahJ9VO:d869DENhhkaKaQasaX6ahaE9DVgLEhQasaXaLEhXahaEaLEhEkaAclfhAavcufgvmbkka3cefg3aB9hmbkkaQcu9hmekama5Ud:ODama8FUd:KDamaaUd:GDamcuBd:qDamcFFF;7rBdjDaIcba8AaYamc:GDfakJbbbb9Damc:qDfamcjDfz:ejjjbamyd:qDhQdndnaxJbbbb9ETmba8UaD6mbaQcuSmeceh3amIdjDaR9EmixdkaQcu9hmekdna8UTmbdnamydlgza8Uci2fgsciGTmbadasfcba8Uazcu7fciGcefz:njjjb8AkabaPcltfgzam8Pib83dbazcwfamcwf8Pib83dbaPcefhPkc3hzinazc98Smvamc:Cwfazfydbcbydj1jjbH:bjjjbbazc98fhzxbkkcbh3a8Uaq9pmbamydwaCaiaQcx2fgsydbcetf8Vebcs4aCascwfydbcetf8Vebcs4faCasclfydbcetf8Vebcs4ffaw9nmekcbhscbhAdna81TmbcbhAamczfhXinamczfaAcdtfaXydbgLBdbaXclfhXaAaYaLfRbbTfhAa81cufg81mbkkamydwhlamydbhXam9cu83i:GDam9cu83i:ODam9cu83i:qDam9cu83i:yDaAc;8eaAclfc:bd6Eh81inamcjDfasfcFFF;7rBdbasclfgscz9hmbka81cdthBdnalTmbaeaXcdtfhocbhrindnazaoarcdtfydbcdtgsfydbgvTmbaOaHasfydbcdtfhAcuhLcuhsinazaiaAydbgKcx2fgXclfydbcdtfydbazaXydbcdtfydbfazaXcwfydbcdtfydbfgXasaXas6gXEhsaKaLaXEhLaAclfhAavcufgvmbkaLcuSmba8AaLcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEcbhAindndnasamc:qDfaAfgvydbgX6mbasaX9hmeaEamcjDfaAfIdb9FTmekavasBdbamc:GDfaAfaLBdbamcjDfaAfaEUdbxdkaAclfgAcz9hmbkkarcefgral9hmbkkamczfaBfhLcbhscbhAindnamc:GDfasfydbgXcuSmbaLaAcdtfaXBdbaAcefhAkasclfgscz9hmbkaAa81fg81TmbJFFuuhhcuhKamczfhsa81hvcuhLina8AasydbgXcK2fgAIdway:tgEaENaAIdba8S:tgEaENaAIdla8R:tgEaENMM:rhEdndnazaiaXcx2fgAclfydbcdtfydbazaAydbcdtfydbfazaAcwfydbcdtfydbfgAaL6mbaAaL9hmeaEah9DTmekaEhhaAhLaXhKkasclfhsavcufgvmbkaKcuSmbaKhQkdnamaiaQcx2fgrydbarclfydbarcwfydbaCabaeadaPawaqa3z:fjjjbTmbaPcefhPJbbbbh8VJbbbbh8WJbbbbh8XJbbbbh8YJbbbbh8ZJbbbbh80kcbhXinaOaHaraXcdtfydbcdtgAfydbcdtfgKhsazaAfgvydbgLhAdnaLTmbdninasydbaQSmeasclfhsaAcufgATmdxbkkasaKaLcdtfc98fydbBdbavavydbcufBdbkaXcefgXci9hmbka8AaQcK2fgsIdbhEasIdlhhasIdwh8KasIdxh8EasIdzh5asIdCh8FaYaQfce86bba80a8FMh80a8Za5Mh8Za8Ya8EMh8Ya8Xa8KMh8Xa8WahMh8Wa8VaEMh8Vamydxh8Uxbkkamc:WDf8KjjjjbaPk;Vvivuv99lu8Jjjjjbca9Rgv8Kjjjjbdndnalcw0mbaiydbhoaeabcitfgralcdtcufBdlaraoBdbdnalcd6mbaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkkalabfhrxekcbhDavczfcwfcbBdbav9cb83izavcwfcbBdbav9cb83ibJbbjZhqJbbjZhkinadaiaDcdtfydbcK2fhwcbhrinavczfarfgoawarfIdbgxaoIdbgm:tgPakNamMgmUdbavarfgoaPaxam:tNaoIdbMUdbarclfgrcx9hmbkJbbjZaqJbbjZMgq:vhkaDcefgDal9hmbkcbhoadcbcecdavIdlgxavIdwgm9GEgravIdbgPam9GEaraPax9GEgscdtgrfhzavczfarfIdbhxaihralhwinaiaocdtfgDydbhHaDarydbgOBdbaraHBdbarclfhraoazaOcK2fIdbax9Dfhoawcufgwmbkaeabcitfhrdndnaocv6mbaoalc98f6mekaraiydbBdbaralcdtcufBdlaiclfhoalcufhwarcxfhrinaoydbhDarcuBdbarc98faDBdbarcwfhraoclfhoawcufgwmbkalabfhrxekaraxUdbararydlc98GasVBdlabcefaeadaiaoz:djjjbhwararydlciGawabcu7fcdtVBdlawaeadaiaocdtfalao9Rz:djjjbhrkavcaf8Kjjjjbark:;idiud99dndnabaecitfgwydlgDciGgqciSmbinabcbaDcd4gDalaqcdtfIdbawIdb:tgkJbbbb9FEgwaecefgefadaialavaoarz:ejjjbak:larIdb9FTmdabawaD7aefgecitfgwydlgDciGgqci9hmbkkabaecitfgeclfhbdnavmbcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdwalIdw:tgkakNaqIdbalIdb:tgkakNaqIdlalIdl:tgkakNMM:rgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbxdkkcuhwindnaiaeydbgDfRbbmbadaDcK2fgqIdbalIdb:t:lgkaqIdlalIdl:t:lgxakax9EEgkaqIdwalIdw:t:lgxakax9EEgkarIdb9DTmbarakUdbaoaDBdbkaecwfheawcefgwabydbcd46mbkkk;llevudnabydwgxaladcetfgm8Vebcs4alaecetfgP8Vebgscs4falaicetfgz8Vebcs4ffaD0abydxaq9pVakVgDce9hmbavawcltfgxab8Pdb83dbaxcwfabcwfgx8Pdb83dbdnaxydbgqTmbaoabydbcdtfhxaqhsinalaxydbcetfcFFi87ebaxclfhxascufgsmbkkdnabydxglci2gsabydlgxfgkciGTmbarakfcbalaxcu7fciGcefz:njjjb8Aabydxci2hsabydlhxabydwhqkab9cb83dwababydbaqfBdbabascifc98GaxfBdlaP8Vebhscbhxkdnascztcz91cu9kmbabaxcefBdwaPax87ebaoabydbcdtfaxcdtfaeBdbkdnam8Uebcu9kmbababydwgxcefBdwamax87ebaoabydbcdtfaxcdtfadBdbkdnaz8Uebcu9kmbababydwgxcefBdwazax87ebaoabydbcdtfaxcdtfaiBdbkarabydlfabydxci2faPRbb86bbarabydlfabydxci2fcefamRbb86bbarabydlfabydxci2fcdfazRbb86bbababydxcefBdxaDk8LbabaeadaialavaoarawaDaDaqJbbbbz:cjjjbk;Jkovud99euv99eul998Jjjjjbc:W;ae9Rgo8KjjjjbdndnadTmbavcd4hrcbhwcbhDindnaiaeclfydbar2cdtfgvIdbaiaeydbar2cdtfgqIdbgk:tgxaiaecwfydbar2cdtfgmIdlaqIdlgP:tgsNamIdbak:tgzavIdlaP:tgPN:tgkakNaPamIdwaqIdwgH:tgONasavIdwaH:tgHN:tgPaPNaHazNaOaxN:tgxaxNMM:rgsJbbbb9Bmbaoc:W:qefawcx2fgAakas:vUdwaAaxas:vUdlaAaPas:vUdbaoc8Wfawc8K2fgAaq8Pdb83dbaAav8Pdb83dxaAam8Pdb83dKaAcwfaqcwfydbBdbaAcCfavcwfydbBdbaAcafamcwfydbBdbawcefhwkaecxfheaDcifgDad6mbkab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbawTmeaocbBd8Sao9cb83iKao9cb83izaoczfaoc8Wfawci2cxaoc8Sfcbz1jjjbaoIdKhCaoIdChXaoIdzhQao9cb83iwao9cb83ibaoaoc:W:qefawcxaoc8Sfcbz1jjjbJbbjZhkaoIdwgPJbbbbJbbjZaPaPNaoIdbgPaPNaoIdlgsasNMM:rgx:vaxJbbbb9BEgzNhxasazNhsaPazNhzaoc:W:qefheawhvinaecwfIdbaxNaeIdbazNasaeclfIdbNMMgPakaPak9DEhkaecxfheavcufgvmbkabaCUdwabaXUdlabaQUdbabaoId3UdxdndnakJ;n;m;m899FmbJbbbbhPaoc:W:qefheaoc8WfhvinaCavcwfIdb:taecwfIdbgHNaQavIdb:taeIdbgONaXavclfIdb:taeclfIdbgLNMMaxaHNazaONasaLNMM:vgHaPaHaP9EEhPavc8KfhvaecxfheawcufgwmbkabaxUd8KabasUdaabazUd3abaCaxaPN:tUdKabaXasaPN:tUdCabaQazaPN:tUdzabJbbjZakakN:t:rgkUdydndnaxJbbj:;axJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;axJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohexekcjjjj94hekabae86b8UdndnasJbbj:;asJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;asJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohvxekcjjjj94hvkabav86bRdndnazJbbj:;azJbbj:;9GEgPJbbjZaPJbbjZ9FEJbb;:9cNJbbbZJbbb:;azJbbbb9GEMgP:lJbbb9p9DTmbaP:Ohqxekcjjjj94hqkabaq86b8SdndnaecKtcK91:YJbb;:9c:vax:t:lavcKtcK91:YJbb;:9c:vas:t:laqcKtcK91:YJbb;:9c:vaz:t:lakMMMJbb;:9cNJbbjZMgk:lJbbb9p9DTmbak:Ohexekcjjjj94hekaecFbaecFb9iEhexekabcjjj;8iBdycFbhekabae86b8Vxekab9cb83dbabcyf9cb83dbabcaf9cb83dbabcKf9cb83dbabczf9cb83dbabcwf9cb83dbkaoc:W;aef8Kjjjjbk;Yodouk99cbho8Jjjjjbca9RgrczfcwfcbBdbar9cb83izarcwfcbBdbar9cb83ibavcd4hwaicd4hDdnadTmbaDcdthqaehkinalaoaw2cdtfIdbhxcbhvinarczfavfgiaoaiydbgiakavfIdbgmax:taeavaqai2ffIdbalaiaw2cdtfIdb:t9DEBdbaravfgiaoaiydbgiaxamMaeavaqai2ffIdbalaiaw2cdtfIdbM9EEBdbavclfgvcx9hmbkakaqfhkaocefgoad9hmbkkJbbbbhxcbhvcbhkcbhiinalaravfydbgoaw2cdtfIdbalarczfavfydbgqaw2cdtfIdbaeaoaD2cdtfgoIdwaeaqaD2cdtfgqIdw:tgmamNaoIdbaqIdb:tgmamNaoIdlaqIdl:tgmamNMM:rMMgmaxamax9EgoEhxaiakaoEhkavclfhvaicefgici9hmbkJbbbbhmdnaearakcdtgifydbgoaD2cdtfgvIdwaearczfaifydbgraD2cdtfgiIdwgP:tgsasNavIdbaiIdbgz:tgHaHNavIdlaiIdlgO:tgAaANMM:rgCJbbbb9ETmbaCalaoaw2cdtfIdbMalaraw2cdtfIdb:taCaCM:vhmkaxJbbbZNhCasamNaPMhPaAamNaOMhOaHamNazMhzdnadTmbaDcdthvawcdthiindnalIdbgXaecwfIdbaP:tgxaxNaeIdbaz:tgmamNaeclfIdbaO:tgsasNMM:rgHMgQaC9ETmbJbbbbhAdnaHJbbbb9ETmbaQaC:taHaHM:vhAkaAaxNaPMhPaAasNaOMhOaAamNazMhzaXaCaHMMJbbbZNhCkaeavfhealaifhladcufgdmbkkabaCUdxabaPUdwabaOUdlabazUdbkjeeiu8Jjjjjbcj8W9Rgr8Kjjjjbaici2hwdnaiTmbawceawce0EhDarhiinaiaeadRbbcdtfydbBdbadcefhdaiclfhiaDcufgDmbkkabarawaladaoz:hjjjbarcj8Wf8Kjjjjbk:3lequ8JjjjjbcjP9Rgl8Kjjjjbcbhvalcjxfcbaiz:njjjb8AdndnadTmbcjehoaehrincuhwarhDcuhqavhkdninawakaoalcjxfaDcefRbbfRbb9RcFeGci6aoalcjxfaDRbbfRbb9RcFeGci6faoalcjxfaDcdfRbbfRbb9RcFeGci6fgxaq9mgmEhwdnammbaxce0mdkaxaqaxaq9kEhqaDcifhDadakcefgk9hmbkkaeawci2fgDcdfRbbhqaDcefRbbhxaDRbbhkaeavci2fgDcifaDawav9Rci2z:qjjjb8Aakalcjxffaocefgo86bbaxalcjxffao86bbaDcdfaq86bbaDcefax86bbaDak86bbaqalcjxffao86bbarcifhravcefgvad9hmbkalcFeaicetz:njjjbhoadci2gDceaDce0EhqcbhxindnaoaeRbbgkcetfgw8UebgDcu9kmbawax87ebaocjlfaxcdtfabakcdtfydbBdbaxhDaxcefhxkaeaD86bbaecefheaqcufgqmbkaxcdthDxekcbhDkabalcjlfaDz:mjjjb8AalcjPf8Kjjjjbk9teiucbcbyd11jjbgeabcifc98GfgbBd11jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik;teeeudndnaeabVciGTmbabhixekdndnadcz9pmbabhixekabhiinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaeczfheaiczfhiadc9Wfgdcs0mbkkadcl6mbinaiaeydbBdbaeclfheaiclfhiadc98fgdci0mbkkdnadTmbinaiaeRbb86bbaicefhiaecefheadcufgdmbkkabk:3eedudndnabciGTmbabhixekaecFeGc:b:c:ew2hldndnadcz9pmbabhixekabhiinaialBdxaialBdwaialBdlaialBdbaiczfhiadc9Wfgdcs0mbkkadcl6mbinaialBdbaiclfhiadc98fgdci0mbkkdnadTmbinaiae86bbaicefhiadcufgdmbkkabk9teiucbcbyd11jjbgeabcrfc94GfgbBd11jjbdndnabZbcztgd9nmbcuhiabad9RcFFifcz4nbcuSmekaehikaik9:eiuZbhedndncbyd11jjbgdaecztgi9nmbcuheadai9RcFFifcz4nbcuSmekadhekcbabae9Rcifc98Gcbyd11jjbfgdBd11jjbdnadZbcztge9nmbadae9RcFFifcz4nb8Akk:;Deludndndnadch9pmbabaeSmdaeabadfgi9Rcbadcet9R0mekabaead;8qbbxekaeab7ciGhldndndnabae9pmbdnalTmbadhvabhixikdnabciGmbadhvabhixdkadTmiabaeRbb86bbadcufhvdnabcefgiciGmbaecefhexdkavTmiabaeRbe86beadc9:fhvdnabcdfgiciGmbaecdfhexdkavTmiabaeRbd86bdadc99fhvdnabcifgiciGmbaecifhexdkavTmiabaeRbi86biabclfhiaeclfheadc98fhvxekdnalmbdnaiciGTmbadTmlabadcufgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc9:fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc99fgifglaeaifRbb86bbdnalciGmbaihdxekaiTmlabadc98fgdfaeadfRbb86bbkadcl6mbdnadc98fgocd4cefciGgiTmbaec98fhlabc98fhvinavadfaladfydbBdbadc98fhdaicufgimbkkaocx6mbaec9Wfhvabc9WfhoinaoadfgicxfavadfglcxfydbBdbaicwfalcwfydbBdbaiclfalclfydbBdbaialydbBdbadc9Wfgdci0mbkkadTmdadhidnadciGglTmbaecufhvabcufhoadhiinaoaifavaifRbb86bbaicufhialcufglmbkkadcl6mdaec98fhlabc98fhvinavaifgecifalaifgdcifRbb86bbaecdfadcdfRbb86bbaecefadcefRbb86bbaeadRbb86bbaic98fgimbxikkavcl6mbdnavc98fglcd4cefcrGgdTmbavadcdt9RhvinaiaeydbBdbaeclfheaiclfhiadcufgdmbkkalc36mbinaiaeydbBdbaiaeydlBdlaiaeydwBdwaiaeydxBdxaiaeydzBdzaiaeydCBdCaiaeydKBdKaiaeyd3Bd3aecafheaicafhiavc9Gfgvci0mbkkavTmbdndnavcrGgdmbavhlxekavc94GhlinaiaeRbb86bbaicefhiaecefheadcufgdmbkkavcw6mbinaiaeRbb86bbaiaeRbe86beaiaeRbd86bdaiaeRbi86biaiaeRbl86blaiaeRbv86bvaiaeRbo86boaiaeRbr86braicwfhiaecwfhealc94fglmbkkabkkAebcjwkxebbbdbbbzNbb"),{}).then((function(b){(b.instance).exports.__wasm_call_ctors();}));}();

class GrassGeometry extends BufferGeometry {

    constructor( lod = 3 ){

        super();

        const rand = MathTool.rand;
        const rad = MathTool.torad;

        let g = new PlaneGeometry();
        g.translate( 0, 0.5, 0 );

        const pp = [];

        let p, s; 
        let r = 360/lod;

        for(let i = 0; i<lod; i++){
            p = g.clone();
            p.translate( rand(-0.2,0.2), 0, rand(-0.2,0.2) );
            p.rotateX( rand(-22,22)*rad );
            p.rotateY( ((r*i) + rand(-10,10))*rad );
            s = rand(0.8, 1.2);
            p.scale(s,s,s);
            pp.push(p);
        }


        let gg = mergeVertices( mergeGeometries( pp ) );
        //console.log(gg)
        this.copy(gg);

    }

}

// add and override BatchedMesh methods ( @three.ez/batched-mesh-extensions )
kc();

// add the extension functions ( three-mesh-bvh )
Mesh.prototype.raycast = oe;
BatchedMesh.prototype.computeBoundsTree = le;

const position = new Vector3();
const rotation = new Euler();
const quaternion = new Quaternion$1();
const scale = new Vector3();

class Grass {

	constructor ( o={}, motor ) {

		this.motor = motor;

		this.ids = [];

		this.useLod = true;

		this.maxVertex = 0;
		this.maxIndex = 0;

		//this.initTexture()

		this.initGeometries();
		this.initBatchedMesh();

	}


	initGeometries(){

		this.geometriesLOD = [];
		this.geo = [
			new GrassGeometry(),
			new GrassGeometry(),
			new GrassGeometry(),
			new GrassGeometry(),
			new GrassGeometry(),
		];

		if(this.useLod){ 
			for(let i = 0; i<this.geo.length; i++){
				this.geometriesLOD.push( [this.geo[i], new GrassGeometry(2), new GrassGeometry(1)]);
			}
			let { vertexCount, indexCount, LODIndexCount } = xc( this.geometriesLOD );
			this.vertexCount = vertexCount;
			this.indexCount = indexCount;
			this.LODIndexCount = LODIndexCount;
		} else {
			let { vertexCount, indexCount } = yc(this.geo);
			this.vertexCount = vertexCount;
		    this.indexCount = indexCount;
		}



		//console.log(this.geometriesLOD)

	    console.log(this.vertexCount, this.indexCount);
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


		new Euler();
		const matrix = new Matrix4();

		// create BatchedMesh

		let mesh = new BatchedMesh( instancesCount, this.vertexCount, this.indexCount, this.createMaterial() );

		mesh.customSort = qe( mesh );
		//mesh.userData.rotationSpeeds = [];

		// add geometries and their LODs to the batched mesh ( all LODs share the same position array )

		if(this.useLod){
			for ( let i = 0; i < this.geometriesLOD.length; i ++ ) {

		        const geometryLOD = this.geometriesLOD[ i ];
		        const geometryId = mesh.addGeometry( geometryLOD[ 0 ], -1, this.LODIndexCount[ i ] );
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

			let id;

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
	    mesh.raycast = () => {return};

		mesh.castShadow = true;
		mesh.receiveShadow = false;

		//this.mesh = mesh

		//console.log(mesh.bvh)


		this.motor.scenePlus.add( mesh );

		/*const lods = mesh._geometryInfo.map( x => x.LOD );
		const geometryInfo = mesh._geometryInfo;
        for ( let i = 0; i < geometryInfo.length; i ++ ) {

            geometryInfo[ i ].LOD = v ? lods[ i ] : null;

        }*/

	}

}

//ChamferCyl.prototype = Object.create( THREE.BufferGeometry.prototype );

/**
* CHAMFER BOX GEOMETRY
*/
class ChamferBox extends BufferGeometry {

    constructor( width  = 1, height = 1, depth = 1, filet = 0.01, widthSegs = 1, heightSegs = 1, depthSegs = 1, filetSegs = 2 ) {

        super();

        this.type = 'ChamferBox';
        //this.name = 'ChamferBox_' + width +'_'+height+'_'+depth+'_'+filet+'_'+widthSegs+'_'+heightSegs+'_'+depthSegs+'_'+filetSegs;

        widthSegs = Math.floor( widthSegs );
        heightSegs = Math.floor( heightSegs );
        depthSegs = Math.floor( depthSegs );
        filetSegs = Math.floor( filetSegs );

        let pi = Math.PI;
        let p90 = pi * 0.5;
        let twoFilet = filet * 2;

        let midWidth = width * 0.5;
        let midHeight = height * 0.5;
        let midDepth = depth * 0.5;

        let mr = new Matrix4();
        let mt = new Matrix4();
        let mp = new Matrix4();

        // uv calc

        let tw = width;
        let sw = filet / tw;
        let vw = 1 - (2*sw);

        let th = height;
        let sh = filet / th;
        let vh = 1 - (2*sw);

        let td = depth;
        let sd = filet / td;
        let vd = 1 - (2*sd);

        let f = new PlaneGeometry( width-twoFilet, height-twoFilet, widthSegs, heightSegs );
        let c1 = new CylinderGeometry( filet, filet, width-twoFilet, filetSegs, widthSegs, true, 0, p90 );
        let c2 = new CylinderGeometry( filet, filet, height-twoFilet, filetSegs, heightSegs, true, 0, p90 );
        let s1 = new SphereGeometryFix( filet, filetSegs, filetSegs, 0, p90, 0, -p90 );
        let s2 = new SphereGeometryFix( filet, filetSegs, filetSegs, 0, p90, 0, -p90 );

        scaleUV( f, -sw, sh, vw, vh );
        scaleUV( c1, 0, sw, sh, vw );
       //scaleUV( c2, 0, -sw, vw, sw )

        mt.makeTranslation( 0, midHeight - filet, 0 );
        mr.makeRotationX( p90 );
        s1.applyMatrix4( mt.multiply(mr) );

        mt.makeTranslation( 0, -midHeight + filet, 0 );
        mr.makeRotationX( p90 );
        mp.makeRotationY( -p90 );
        s2.applyMatrix4( mt.multiply(mr).multiply(mp) );

        let tra = mergeGeometries( [ c2, s1, s2 ] );
        let trc = tra.clone();

        /*c2.dispose();
        s1.dispose();
        s2.dispose();*/
        
        mt.makeTranslation( midWidth - filet, 0, -filet );

        tra.applyMatrix4( mt );

        mt.makeTranslation( -midWidth + filet, 0, -filet );
        mr.makeRotationZ( pi );

        trc.applyMatrix4( mt.multiply(mr) );

        // cylinder

        let c3 = c1.clone();

        mr.makeRotationZ( p90 );
        mt.makeTranslation( 0, midHeight - filet, -filet );
        c1.applyMatrix4( mt.multiply(mr) );
        mt.makeTranslation( 0, -midHeight + filet, -filet );
        mr.makeRotationZ( -p90 );
        c3.applyMatrix4( mt.multiply(mr) );

        let rf = mergeGeometries( [ c1, c3, f, tra, trc ] );
        let rg = rf.clone();

        mt.makeTranslation( 0, 0, midDepth );
        rf.applyMatrix4( mt );

        mt.makeTranslation( 0, 0, -midDepth );
        mr.makeRotationY( pi );
        rg.applyMatrix4( mt.multiply(mr) );

        // side left

        /*f.dispose();
        c1.dispose();
        c3.dispose();*/

        f = new PlaneGeometry( depth-twoFilet, height-twoFilet, depthSegs, heightSegs );
        c1 = new CylinderGeometry( filet, filet, depth-twoFilet, filetSegs, depthSegs, true, 0, p90 );
        c3 = c1.clone();

        scaleUV( f, -sd, sh, vd, vh );

        mt.makeTranslation( 0, -(midHeight - filet), -filet, 0 );
        mr.makeRotationZ( -p90 );

        c1.applyMatrix4( mt.multiply(mr) );

        mt.makeTranslation( 0, midHeight - filet, -filet, 0 );
        mr.makeRotationZ( p90 );

        c3.applyMatrix4( mt.multiply(mr) );


        let rr = mergeGeometries( [ c1, c3, f ] );
        let rb = rr.clone();

        /*f.dispose();
        c1.dispose();
        c3.dispose()*/

        mt.makeTranslation( -midWidth, 0, 0 );
        mr.makeRotationY( -p90 );

        rr.applyMatrix4( mt.multiply(mr) );

        // side right

        mt.makeTranslation( midWidth, 0, 0 );
        mr.makeRotationY( p90 );

        rb.applyMatrix4( mt.multiply(mr) );

        // top
        f = new PlaneGeometry( width-twoFilet, depth-twoFilet, widthSegs, depthSegs );
        scaleUV( f, -sw, sd, vw, vd );
        let f2 = f.clone();



        mt.makeTranslation( 0, midHeight, 0);
        mr.makeRotationX( -p90 );
        f.applyMatrix4( mt.multiply(mr) );

        // bottom
        mt.makeTranslation( 0, -midHeight, 0);
        mr.makeRotationX( p90 );
        f2.applyMatrix4( mt.multiply(mr) );

        let g = mergeVertices( mergeGeometries( [ rf, rg, rr, rb, f, f2 ] ) );

        /*rf.dispose();
        rg.dispose();
        rr.dispose();
        rb.dispose();
        f2.dispose();
        f.dispose();*/
        //g.computeVertexNormals()
        //g = g.toNonIndexed()
        //

        createUV(g, 'box');

        this.copy(g);
        /*g.dispose();*/

    }
}

class SphereGeometryFix extends BufferGeometry {

    constructor( radius = 1, widthSegments = 8, heightSegments = 6, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI ) {

        super();

        this.type = 'SphereGeometryFix';

        this.parameters = {
            radius: radius,
            widthSegments: widthSegments,
            heightSegments: heightSegments,
            phiStart: phiStart,
            phiLength: phiLength,
            thetaStart: thetaStart,
            thetaLength: thetaLength
        };

        widthSegments =  Math.floor( widthSegments );
        heightSegments =  Math.floor( heightSegments );

        const thetaEnd = Math.min( thetaStart + thetaLength, Math.PI );

        let index = 0;
        const grid = [];

        const vertex = new Vector3();
        const normal = new Vector3();

        // buffers

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // generate vertices, normals and uvs

        for ( let iy = 0; iy <= heightSegments; iy ++ ) {

            const verticesRow = [];

            const v = iy / heightSegments;

            // special case for the poles

            let uOffset = 0;

            if ( iy == 0 && thetaStart == 0 ) {

                uOffset = 0.5 / widthSegments;

            } else if ( iy == heightSegments && thetaEnd == Math.PI ) {

                uOffset = -0.5 / widthSegments;

            }

            for ( let ix = 0; ix <= widthSegments; ix ++ ) {

                const u = ix / widthSegments;

                // vertex

                vertex.x = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
                vertex.y = radius * Math.cos( thetaStart + v * thetaLength );
                vertex.z = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

                vertices.push( vertex.x, vertex.y, vertex.z );

                // normal

                normal.copy( vertex ).normalize();
                normals.push( normal.x, normal.y, normal.z );

                // uv

                uvs.push( u + uOffset, 1 - v );

                verticesRow.push( index ++ );

            }

            grid.push( verticesRow );

        }

        // indices

        for ( let iy = 0; iy < heightSegments; iy ++ ) {

            for ( let ix = 0; ix < widthSegments; ix ++ ) {

                const a = grid[ iy ][ ix + 1 ];
                const b = grid[ iy ][ ix ];
                const c = grid[ iy + 1 ][ ix ];
                const d = grid[ iy + 1 ][ ix + 1 ];

                if ( iy !== 0 || thetaStart > 0 ) indices.push( a, b, d );
                if ( iy !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );

            }

        }

        // build geometry

        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

    }

}

// { SphereGeometryFix };


// UV 

function scaleUV( geometry, x=0, y=0, dx=1, dy=1, reverse ) {

    let uv = geometry.attributes.uv;
    let ar = uv.array;
    let i = uv.count, n =0;

    while( i-- ){
        n=i*2;
        ar[n] = (ar[n]*dx)-x;
        ar[n+1] = (ar[n+1]*dy)+y;
    }


}

function createUV( geometry, type = 'sphere', boxSize, pos = [0,0,0], quat = [0,0,0,1], transformMatrix ) {

    //type = type || 'sphere';

    if ( transformMatrix === undefined ) transformMatrix = new Matrix4();
    transformMatrix.compose( {x:pos[0], y:pos[1], z:pos[2] }, { _x:quat[0], _y:quat[1], _z:quat[2], _w:quat[3] }, {x:1, y:1, z:1 });



    if ( boxSize === undefined ) {
        if( !geometry.boundingBox ) geometry.computeBoundingBox();
        let bbox = geometry.boundingBox;
        boxSize = Math.max( bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z );
    }

    //.expandByScalar(0.9);//new THREE.Box3( new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2));
    //_applyBoxUV( bufferGeometry, transformMatrix, uvBbox, boxSize );

    let uvBbox = new Box3(new Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new Vector3(boxSize / 2, boxSize / 2, boxSize / 2));
    //let uvBbox = new Box3(new Vector3(-(boxSize / 2)/3, -(boxSize / 2)/3, -(boxSize / 2)/3), new Vector3((boxSize / 2)/3, (boxSize / 2)/3, (boxSize / 2)/3));
    //let uvBbox = bbox
    


    let coords = [];
    //coords.length = 2 * geometry.attributes.position.array.length / 3;
    coords.length = 2 * geometry.attributes.position.count;

    //if ( geometry.attributes.uv === undefined ) geometry.addAttribute('uv', new Float32BufferAttribute(coords, 2));
    if ( geometry.attributes.uv === undefined ) geometry.setAttribute('uv', new Float32BufferAttribute(coords, 2));
    
    let makeSphereUVs = function( v0, v1, v2 ) {

        //pre-rotate the model so that cube sides match world axis
        v0.applyMatrix4(transformMatrix);
        v1.applyMatrix4(transformMatrix);
        v2.applyMatrix4(transformMatrix);

        let invTwoPi = 1 / (2.0 * Math.PI);
        let invPi = 1 / Math.PI;

        v0.normalize();
        v1.normalize();
        v2.normalize();

        return {
            uv0: new Vector2( .5 - Math.atan( v0.z, - v0.x ) * invTwoPi, .5 - Math.asin( v0.y ) * invPi ),
            uv1: new Vector2( .5 - Math.atan( v1.z, - v1.x ) * invTwoPi, .5 - Math.asin( v1.y ) * invPi ),
            uv2: new Vector2( .5 - Math.atan( v2.z, - v2.x ) * invTwoPi, .5 - Math.asin( v2.y ) * invPi ),
        };

    };


  
    //maps 3 verts of 1 face on the better side of the cube
    //side of the cube can be XY, XZ or YZ
    let makeCubeUVs = function( v0, v1, v2 ) {

        //pre-rotate the model so that cube sides match world axis
        v0.applyMatrix4(transformMatrix);
        v1.applyMatrix4(transformMatrix);
        v2.applyMatrix4(transformMatrix);

        //get normal of the face, to know into which cube side it maps better
        let n = new Vector3();
        n.crossVectors( v1.clone().sub(v0), v1.clone().sub(v2) ).normalize();
        if(n.x<0 || n.y<0 || n.z<0) ;

        n.x = Math.abs(n.x);
        n.y = Math.abs(n.y);
        n.z = Math.abs(n.z);

        let uv0 = new Vector2();
        let uv1 = new Vector2();
        let uv2 = new Vector2();
        let max = 1/boxSize;

        
        // xz mapping
        if ( n.y > n.x && n.y > n.z ) {

            uv0.set( v0.x - uvBbox.min.x, uvBbox.max.z - v0.z ).multiplyScalar( max );
            uv1.set( v1.x - uvBbox.min.x, uvBbox.max.z - v1.z ).multiplyScalar( max );
            uv2.set( v2.x - uvBbox.min.x, uvBbox.max.z - v2.z ).multiplyScalar( max );

        } else if ( n.x > n.y && n.x > n.z ) {

            uv0.set( v0.z - uvBbox.min.z, v0.y - uvBbox.min.y ).multiplyScalar( max );
            uv1.set( v1.z - uvBbox.min.z, v1.y - uvBbox.min.y ).multiplyScalar( max );
            uv2.set( v2.z - uvBbox.min.z, v2.y - uvBbox.min.y ).multiplyScalar( max );

        } else if ( n.z > n.y && n.z > n.x ) {

            uv0.set( v0.x - uvBbox.min.x, v0.y - uvBbox.min.y ).multiplyScalar( max );
            uv1.set( v1.x - uvBbox.min.x, v1.y - uvBbox.min.y ).multiplyScalar( max );
            uv2.set( v2.x - uvBbox.min.x, v2.y - uvBbox.min.y ).multiplyScalar( max );

        }

        return { uv0: uv0, uv1: uv1, uv2: uv2 } 
    };



    let i, id0, id1, id2, uvs;
    let v0 = new Vector3();
    let v1 = new Vector3();
    let v2 = new Vector3();

    new Vector3();
    new Vector3();
    new Vector3();

    const positionAttribute = geometry.getAttribute( 'position' );
    geometry.getAttribute( 'normal' );

    if ( geometry.index ) { // is it indexed buffer geometry

        for (i = 0; i < geometry.index.count; i+=3 ) {

            //console.log('is index')

            //n = i*3;
            id0 = geometry.index.getX( i + 0 );
            id1 = geometry.index.getX( i + 1 );
            id2 = geometry.index.getX( i + 2 );

            v0.fromBufferAttribute( positionAttribute, id0 );
            v1.fromBufferAttribute( positionAttribute, id1 );
            v2.fromBufferAttribute( positionAttribute, id2 );

            /*nn0.fromBufferAttribute( normalAttribute, id0 );
            nn1.fromBufferAttribute( normalAttribute, id1 );
            nn2.fromBufferAttribute( normalAttribute, id2 )*/



            if( type === 'sphere' ) uvs = makeSphereUVs( v0, v1, v2 );
            else uvs = makeCubeUVs( v0, v1, v2);

            coords[2 * id0] = uvs.uv0.x;
            coords[2 * id0 + 1] = uvs.uv0.y;

            coords[2 * id1] = uvs.uv1.x;
            coords[2 * id1 + 1] = uvs.uv1.y;

            coords[2 * id2] = uvs.uv2.x;
            coords[2 * id2 + 1] = uvs.uv2.y;
        }
    } else {

        for ( i = 0; i < positionAttribute.count; i += 3) {

            v0.fromBufferAttribute( positionAttribute, i + 0 );
            v1.fromBufferAttribute( positionAttribute, i + 1 );
            v2.fromBufferAttribute( positionAttribute, i + 2 );

            if( type === 'sphere' ) uvs = makeSphereUVs( v0, v1, v2 );
            else uvs = makeCubeUVs( v0, v1, v2 );

            let idx0 = i;//vi / 3;
            let idx1 = i+1;//idx0 + 1;
            let idx2 = i+2;//idx0 + 2;

            coords[2 * idx0] = uvs.uv0.x;
            coords[2 * idx0 + 1] = uvs.uv0.y;

            coords[2 * idx1] = uvs.uv1.x;
            coords[2 * idx1 + 1] = uvs.uv1.y;

            coords[2 * idx2] = uvs.uv2.x;
            coords[2 * idx2 + 1] = uvs.uv2.y;
        }

    }

    geometry.attributes.uv.array = new Float32Array( coords );
    geometry.attributes.uv.needsUpdate = true;

}


/*
export function calcNormal( normals, normal, angle ){

    let allowed = normals.filter( n => n.angleTo( normal ) < angle * Math.PI / 180 );
    return allowed.reduce( (a, b) => a.clone().add( b ) ).normalize();

}

export function computeVertexNormals(geometry, angle){

    geometry.computeFaceNormals();
    
    var vertices = geometry.vertices.map( () => [] ); // vertices with normals array

    geometry.faces.map( face => {
        vertices[ face.a ].push( face.normal );
        vertices[ face.b ].push( face.normal );
        vertices[ face.c ].push( face.normal );
    });

    geometry.faces.map( face => {
        face.vertexNormals[ 0 ] = calcNormal( vertices[ face.a ], face.normal, angle );
        face.vertexNormals[ 1 ] = calcNormal( vertices[ face.b ], face.normal, angle );
        face.vertexNormals[ 2 ] = calcNormal( vertices[ face.c ], face.normal, angle );
    });

    if ( geometry.faces.length > 0 ) geometry.normalsNeedUpdate = true;

}*/

/*

BufferGeometry.prototype.computeMorphFaceNormals = function () {

        var i, il, f, fl, face;

        // save original normals
        // - create temp variables on first access
        //   otherwise just copy (for faster repeated calls)

        for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

            face = this.faces[ f ];

            if ( ! face.__originalFaceNormal ) {

                face.__originalFaceNormal = face.normal.clone();

            } else {

                face.__originalFaceNormal.copy( face.normal );

            }

        }

        // use temp geometry to compute face normals for each morph

        var tmpGeo = new THREE.Geometry();
        tmpGeo.faces = this.faces;

        for ( i = 0, il = this.morphTargets.length; i < il; i ++ ) {

            // create on first access

            if ( ! this.morphNormals[ i ] ) {

                this.morphNormals[ i ] = {};
                this.morphNormals[ i ].faceNormals = [];

                var dstNormalsFace = this.morphNormals[ i ].faceNormals;

                var faceNormal;

                for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

                    faceNormal = new Vector3();

                    dstNormalsFace.push( faceNormal );

                }

            }

            var morphNormals = this.morphNormals[ i ];

            // set vertices to morph target

            tmpGeo.vertices = this.morphTargets[ i ].vertices;

            // compute morph normals

            tmpGeo.computeFaceNormals();

            // store morph normals

            var faceNormal;

            for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

                face = this.faces[ f ];

                faceNormal = morphNormals.faceNormals[ f ];

                faceNormal.copy( face.normal );
            }

        }

        // restore original normals

        for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

            face = this.faces[ f ];

            face.normal = face.__originalFaceNormal;

        }

    }
    */

const _box = /*@__PURE__*/ new Box3();

class BoxHelper extends LineSegments {

	constructor( object, color = 0xffff00 ) {

		const indices = new Uint16Array( [ 0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ] );
		const positions = new Float32Array( 8 * 3 );
		

		let c = new Color( color );
		let ar = [];
		let i = 8;
		while(i--) ar.push(c.r,c.g,c.b);
		const colors = new Float32Array( ar );

		const geometry = new BufferGeometry();
		geometry.setIndex( new BufferAttribute( indices, 1 ) );
		geometry.setAttribute( 'position', new BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'color', new BufferAttribute( colors, 3 ) );

		super( geometry, new LineBasicMaterial( { vertexColors: true, toneMapped: false } ) );

		this.object = object;
		this.type = 'BoxHelper';

		this.matrixAutoUpdate = false;

		this.update();

	}

	update( object ) {

		if ( object !== undefined ) {

			console.warn( 'THREE.BoxHelper: .update() has no longer arguments.' );

		}

		if ( this.object !== undefined ) {
			_box.setFromObject( this.object );
		}

		if ( _box.isEmpty() ) return;

		const min = _box.min;
		const max = _box.max;

		/*
			5____4
		1/___0/|
		| 6__|_7
		2/___3/

		0: max.x, max.y, max.z
		1: min.x, max.y, max.z
		2: min.x, min.y, max.z
		3: max.x, min.y, max.z
		4: max.x, max.y, min.z
		5: min.x, max.y, min.z
		6: min.x, min.y, min.z
		7: max.x, min.y, min.z
		*/

		const position = this.geometry.attributes.position;
		const array = position.array;

		array[ 0 ] = max.x; array[ 1 ] = max.y; array[ 2 ] = max.z;
		array[ 3 ] = min.x; array[ 4 ] = max.y; array[ 5 ] = max.z;
		array[ 6 ] = min.x; array[ 7 ] = min.y; array[ 8 ] = max.z;
		array[ 9 ] = max.x; array[ 10 ] = min.y; array[ 11 ] = max.z;
		array[ 12 ] = max.x; array[ 13 ] = max.y; array[ 14 ] = min.z;
		array[ 15 ] = min.x; array[ 16 ] = max.y; array[ 17 ] = min.z;
		array[ 18 ] = min.x; array[ 19 ] = min.y; array[ 20 ] = min.z;
		array[ 21 ] = max.x; array[ 22 ] = min.y; array[ 23 ] = min.z;

		position.needsUpdate = true;

		this.geometry.computeBoundingSphere();

	}

	setFromObject( object ) {

		this.object = object;
		this.update();

		return this;

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.object = source.object;

		return this;

	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}

class Container {

	constructor ( o = {}, motor ) {

		this.motor = motor;

		this.isCompound = true;
		this.remplace = o.remplace || false;
		this.init(o);

	}

	init ( o = {} ) {

		const intern = o.intern || false;

		let s = o.size || [5,3,8];
		let p = o.pos || [0,2,0];
		let w = o.wall || 0.1;

		if( o.size[3] !== undefined )  w = o.size[3];
		if(w<=0) w = 0.01;
		let mw = w * 0.5;
		let xw = w * 2;

		if(!o.face) o.face = {};
		let f = { up:1, down:1, left:1, right:1, front:1, back:1, ...o.face };
		delete o.face;

		//let geometry = new ChamferBox( s[ 0 ], s[ 1 ], s[ 2 ], o.radius || mw );
		//let mesh = new Mesh( geometry );

		const data = [];

		if(intern){

			if(f.up===1) data.push({ pos:[0, s[1]*0.5+mw, 0], size:[s[0]+xw, w, s[2]+xw] });
			if(f.down===1) data.push({ pos:[0, -mw-s[1]*0.5, 0], size:[s[0]+xw, w, s[2]+xw] });

			if(f.left===1) data.push({ pos:[-mw-s[0]*0.5, 0, 0 ], size:[w, s[1], s[2]] });
			if(f.right===1) data.push({ pos:[s[0]*0.5+mw, 0, 0 ], size:[w, s[1], s[2]] });

			if(f.back===1) data.push({ pos:[0, 0, -mw-s[2]*0.5], size:[s[0]+xw, s[1], w] });
			if(f.front===1) data.push({ pos:[0, 0, s[2]*0.5+mw], size:[s[0]+xw, s[1], w] });

		}else {

			if(f.up===1) data.push({ pos:[0, s[1]*0.5-mw, 0], size:[s[0], w, s[2]] });
			if(f.down===1) data.push({ pos:[0, mw-s[1]*0.5, 0], size:[s[0], w, s[2]] });

			if(f.left===1) data.push({ pos:[mw-s[0]*0.5, 0, 0 ], size:[w, s[1]-xw, s[2]] });
			if(f.right===1) data.push({ pos:[s[0]*0.5-mw, 0, 0 ], size:[w, s[1]-xw, s[2]] });

			if(f.back===1) data.push({ pos:[0, 0, mw-s[2]*0.5], size:[s[0]-xw, s[1]-xw, w] });
			if(f.front===1) data.push({ pos:[0, 0, s[2]*0.5-mw], size:[s[0]-xw, s[1]-xw, w] });

		}

		

		const faces = [];
		let i = data.length, n=0, pp, d;

		while( i-- ){

			d = data[n];
			pp = this.isCompound ? d.pos : MathTool.addArray(p, d.pos);
			faces.push( { type:'box', size:d.size, pos:pp, material:o.material } );
			n++;

		}

		

		if( this.isCompound ){
			let mesh = null;
			if( this.remplace ){
				if(o.radius===0) mesh = new Mesh( new BoxGeometry( s[ 0 ], s[ 1 ], s[ 2 ] ) );
				else mesh = new Mesh( new ChamferBox( s[ 0 ], s[ 1 ], s[ 2 ], o.radius || mw ) );

				if(o.material){
					if(o.material === 'debug'){ 
						mesh = new BoxHelper( mesh, o.color );
						o.material = 'line';
					}
				}

				mesh.raycast = () => {return};
			}

			
			this.motor.add({
				...o,
				mesh:mesh,
				shapes:faces,
		        type:'compound',
		        ray:false,
		    });

		    
		} else {
			this.motor.add( faces );
		}
		
	}

}

// Universal ray vehicule 

// ...ref
//https://forum.babylonjs.com/t/havok-raycastvehicle/40314 
//https://sketches.isaacmason.com/sketch/p2-es/marching-cubes-goo
//https://github.com/isaac-mason/sketches/tree/main
//https://playground.babylonjs.com/#8WQIA8
//https://github.com/Jaagrav/raycast-vehicle-engine
//https://asawicki.info/Mirror/Car%20Physics%20for%20Games/Car%20Physics%20for%20Games.html

const torad = Math.PI / 180;
const directions = [
    new Vector3(1, 0, 0),
    new Vector3(0, 1, 0),
    new Vector3(0, 0, 1)
];

const calcRollingFriction_vel1 = new Vector3();
const calcRollingFriction_vel2 = new Vector3();
const calcRollingFriction_vel = new Vector3();

const updateFriction_surfNormalWS_scaled_proj = new Vector3();

const sideFrictionStiffness2 = 1;
const updateFriction_forwardWS = [];
const updateFriction_axle = [];

const tmpVec4 = new Vector3();
const tmpVec5 = new Vector3();
const tmpVec6 = new Vector3();

new Matrix4();

class RayCar {
	
	constructor( o = {}, motor ){

        this.motor = motor;

        this.extra = {};

		this.tmp = {
			forwardForce : 0,
			steerValue : 0,
			steerDirection : 0,
			brakeForce : 0,
		};

        this.localWheel = true;

		this.maxSpeed = 70;
		this.maxForce = 1500;
		this.maxBrakeForce = 45;
		this.maxSteer = 0.4;//0.6 
		this.steeringIncrement = 0.15;
		this.steerRecover = 0.15;

		this.name = o.name || 'car';
		this.mass = o.mass || 1000;//200;
		this.size = o.size || [1.5, 0.7, 3.8];
		this.pos = o.pos || [0,4,0];
		this.rot = o.rot || [0,0,0];
		this.friction = o.friction || 0.2;
		this.restitution = o.restitution || 0.3;
		this.massCenter = o.massCenter || [0,0,0];//[0,-0.2,0];

        this.driveWheel = o.driveWheel || null;


		/*this.body = root.motor.add({ 

			type:'box',
			name:this.name,  
	        size:this.size, 
	        pos:this.pos, 
	        rot:this.rot,
	        friction:this.friction, 
	        restitution:this.restitution,
	        neverSleep:true,
	        mass:this.mass,
	        massCenter:this.massCenter,
	        radius: 0.02,

	    });*/

        let shape = [ { type:'box', pos:this.massCenter, size:this.size, radius: 0.02 } ];
        if(o.shapeMesh){
            shape = [ { type:'convex', shape:o.shapeMesh.geometry,  pos:o.shapePos || [0,0,0] } ];
        }

        this.body = this.motor.add({ 

            type:'compound',
            shapes:shape,
            name:this.name,
            pos:this.pos,
            rot:this.rot,
            friction:this.friction,
            restitution:this.restitution,
            mass:this.mass,
            //neverSleep:true,
            //massInfo:true,

            //shadow:false,

            mesh:o.bodyMesh || null,
            //noClone: true,
            meshPos:o.meshPos || [0,-1.1,0],
            material:o.material,
            damping:[0.05,0.05],
            debug:false,

        });

	    this.body.inertia = new Vector3( 1.416666865348816, 1.666666865348816, 0.416666716337204 );
        //this.body.inertia.set( 283.33331298828125, 333.33331298828125, 83.33332824707031 );

	    this.vehicle = new RaycastVehicle({ chassis: this.body }, this.motor);

	    /*const wheelPositions = [
	        new Vector3(-0.95,0,-1.8),
	        new Vector3(0.95,0,-1.8),
	        new Vector3(-0.95,0,1.8),
	        new Vector3(0.95,0,1.8)
	    ]*/

        //let wy = 0

        let wp = o.wheelPosition || [0.61, 0, 1.2];

        const wheelPositions = [
            new Vector3(-wp[0], wp[1], -wp[2]),
            new Vector3(wp[0], wp[1], -wp[2]),
            new Vector3(-wp[0], wp[1], wp[2]),
            new Vector3(wp[0], wp[1], wp[2])
        ];

	    const options = {
	        radius: o.wheelRadius || 0.31,//0.32,//0.5,
	        directionLocal: new Vector3(0, -1, 0),
	        suspensionStiffness: 100,//30
	        suspensionRestLength: 0.5,//0.8
            suspensionMaxLength: 1,//2,//2
            maxSuspensionTravel: 0.3,//0.8//0.3,
	        frictionSlip: 4,
	        dampingRelaxation: 2.3,
	        dampingCompression: 4.4,
	        maxSuspensionForce: 100000,
	        rollInfluence: 0.001,//0.001,
	        axleLocal: new Vector3(1, 0, 0),
	        chassisConnectionPointLocal: new Vector3(1, 1, 0),
	        
	    };

        this.addParametre('frictionSlip', 4);
        
        this.addParametre('maxSuspensionTravel', 0.3);
        this.addParametre('suspensionRestLength', 0.5);
        this.addParametre('suspensionMaxLength', 1.0);

        //this._frictionSlip = 4

	    wheelPositions.forEach( positionLocal => {
	        options.chassisConnectionPointLocal.copy( positionLocal );
	        this.vehicle.addWheel( options );
	    });

        let wgeo;
        let m1, m2;

        let mat = this.motor.getMat('debug');

        if( o.wheelMesh ){

            /*wgeo = o.wheelMesh.geometry
            if(o.wheelMesh2) wgeo2 = o.wheelMesh2.geometry
            mat = o.material || mat;*/

            m1 = o.wheelMesh;
            m2 = o.wheelMesh2 ? o.wheelMesh2 : null;

            if(o.material){
                mat = o.material || mat;
                m1.material = mat;
                if(m2) m2.material = mat;
            }

        } else {

            wgeo = new CylinderGeometry( options.radius, options.radius, o.wheelDepth || 0.2 );
            wgeo.rotateZ( Math.PI * 0.5 );

            m1 = new Mesh( wgeo, mat );
            m2 = null;

        }

	    
	    

        this.vehicle.localWheel = this.localWheel;

        if(this.localWheel){
            this.vehicle.wheelMeshes = [ m2? m2 : m1.clone(), m1, m2? m2.clone() : m1.clone(), m1.clone() ];
            let k = this.vehicle.wheelMeshes.length, n=0;
            while(k--) this.body.add(this.vehicle.wheelMeshes[n++]);
        }else {
            m.matrixAutoUpdate = false;
            if(m2) m2.matrixAutoUpdate = false;
            this.vehicle.wheelMeshes = [
                this.motor.add(m2? m2 : m.clone()),
                this.motor.add(m),
                this.motor.add(m2? m2.clone() : m.clone()),
                this.motor.add(m.clone())
            ];
        }

	    
	
	}

	step(){

		this.tmp.forwardForce = 0;
	    this.tmp.brakeForce = 0;
	    this.tmp.steerDirection = 0;

	    let delta = this.motor.getDelta();
	    this.motor.getAzimut();
	    let key = this.motor.getKey();

	    this.tmp.forwardForce = key[1];
	    this.tmp.steerDirection = key[0]*-1;
	    this.tmp.brakeForce = key[4]===1 ? this.maxBrakeForce : 0;

	    this.tmp.steerValue += this.tmp.steerDirection * this.steeringIncrement;
	    this.tmp.steerValue = Math.min(Math.max(this.tmp.steerValue, -this.maxSteer), this.maxSteer);
	    this.tmp.steerValue *= 1-(1-Math.abs(this.tmp.steerDirection))*this.steerRecover;

	    let speed = Math.abs(this.vehicle.currentVehicleSpeedKmHour);
	    speed = Math.min(speed, this.maxSpeed);
	    (speed/this.maxSpeed)*100;
	    const acceleration = 1.0;//accelerationCurve.evaluate(prog)
	    const force = acceleration*this.tmp.forwardForce*this.maxForce;
	    const slipForce = 8;//-(slip*4)

	    /*this.vehicle.applyEngineForce(0, 0)
	    this.vehicle.applyEngineForce(0, 1)
	    this.vehicle.applyEngineForce(force, 2)
	    this.vehicle.applyEngineForce(force, 3)*/

        this.vehicle.applyEngineForce(force, 0);
        this.vehicle.applyEngineForce(force, 1);
        this.vehicle.applyEngineForce(force, 2);
        this.vehicle.applyEngineForce(force, 3);

	    this.vehicle.setSteeringValue(this.tmp.steerValue, 2);
	    this.vehicle.setSteeringValue(this.tmp.steerValue, 3);

	    this.vehicle.setBrake(this.tmp.brakeForce, 0);
	    this.vehicle.setBrake(this.tmp.brakeForce, 1);
	    this.vehicle.setBrake(0, 2);
	    this.vehicle.setBrake(0, 3);

	    this.vehicle.wheelInfos[0].frictionSlip = slipForce;
	    this.vehicle.wheelInfos[1].frictionSlip = slipForce;
	    this.vehicle.wheelInfos[2].frictionSlip = slipForce;
	    this.vehicle.wheelInfos[3].frictionSlip = slipForce;

	    this.vehicle.updateVehicle(delta);

        if( this.driveWheel ){ 
            this.driveWheel.rotation.y = this.tmp.steerValue * 180 * torad;
        }

	}

    /*get frictionSlip (){
        return this._frictionSlip
    }

    set frictionSlip (v){
        this._frictionSlip = v
        this.vehicle.setWheels({frictionSlip:this._frictionSlip})
    }*/

    addParametre( name, value ){

        this.extra[ name ] = value;

        Object.defineProperty( this, name, {
            get: () => ( this.extra[ name ] ),
            set: ( v ) => {
                this.extra[ name ] = v;
                if( this.vehicle ) this.vehicle.setWheels( name, this.extra[ name ] );
            }
        });
    }

}





class RaycastVehicle {

    constructor( o, motor ){

        this.motor = motor;

        this.chassisBody = o.chassis;
        this.wheelInfos = [];
        this.sliding = false;
        this.world = null;
        this.indexRightAxis = typeof(o.indexRightAxis) !== 'undefined' ? o.indexRightAxis : 0;
        this.indexForwardAxis = typeof(o.indexForwardAxis) !== 'undefined' ? o.indexForwardAxis : 2;
        this.indexUpAxis = typeof(o.indexUpAxis) !== 'undefined' ? o.indexUpAxis : 1;
        //this.rays = []
        this.wheelMeshes = [];
        this.brakeMeshs = null;
        this.localWheel = false;
        //this.wheelMatrix = [];
    }

    addWheel ( o = {} ){
    
        let info = new WheelInfo(o, this.motor );
        let index = this.wheelInfos.length-1;

        info.chassisBody = this.chassisBody;

        let raylen = info.suspensionRestLength + info.radius;
        
        info.ray = this.motor.add({
            type:'ray', 
            name:this.chassisBody.name + '_wheel_' + index, 
            begin:info.chassisConnectionPointLocal.toArray(), 
            end:[info.chassisConnectionPointLocal.x,-raylen, info.chassisConnectionPointLocal.z], 
            callback:function(r){ info.castRay(r); }, 
            visible:false, 
            parent:this.chassisBody 
        });

        this.wheelInfos.push(info);
        //this.wheelMatrix.push( new Matrix4() );

        return index;

    }

    setWheels (name, value) {

        let i = this.wheelInfos.length, w;
        while(i--){
            w = this.wheelInfos[i];
            if(w[name]) w[name] = value;
        }

    }

    setSteeringValue( value, wheelIndex ){

        let wheel = this.wheelInfos[wheelIndex];
        wheel.steering = value;

    }

    applyEngineForce(value, wheelIndex){
        this.wheelInfos[wheelIndex].engineForce = value;
    }

    setBrake(brake, wheelIndex){
        this.wheelInfos[wheelIndex].brake = brake;
    }

    getVehicleAxisWorld(axisIndex, result){
        result.set(
            axisIndex === 0 ? 1 : 0,
            axisIndex === 1 ? 1 : 0,
            axisIndex === 2 ? 1 : 0
        );
        TransformCoordinatesToRef(result, bodyTransform(this.chassisBody, new Matrix4()), result);
        return result;
    }

    updateVehicle( timeStep ) {

        let wheelInfos = this.wheelInfos;
        let numWheels = wheelInfos.length;
        let chassisBody = this.chassisBody;

        let i = numWheels; 

        while ( i-- ) {
            this.updateWheelTransform(i);
        }

        

        const cVel = bodyLinearVelocity(chassisBody, new Vector3());
        const cVelLocal = TransformNormalToRef(cVel, bodyTransform(chassisBody, new Matrix4()).invert(),new Vector3());
        this.currentVehicleSpeedKmHour = cVelLocal.z;

        let forwardWorld = new Vector3();
        this.getVehicleAxisWorld(this.indexForwardAxis, forwardWorld);

        //if (Dot(forwardWorld,bodyLinearVelocity(chassisBody, new Vector3())) < 0){
        if ( forwardWorld.dot( chassisBody.velocity ) < 0 ){
            this.currentVehicleSpeedKmHour *= -1;
        }

        // simulate suspension
        // auto on ray result
        //for (var i = 0; i < numWheels; i++) {
            //this.castRay(wheelInfos[i]);
        //}

        

        this.updateSuspension(timeStep);


        let impulse = new Vector3();
        new Vector3();
        for ( i = 0; i < numWheels; i++) {
            //apply suspension force
            let wheel = wheelInfos[i];
            let suspensionForce = wheel.suspensionForce;
            if (suspensionForce > wheel.maxSuspensionForce) {
                suspensionForce = wheel.maxSuspensionForce;
            }
            //impulse.copyFrom(wheel.raycastResult.hitNormalWorld).scaleInPlace(suspensionForce * timeStep)
            impulse.copy( wheel.raycastResult.hitNormalWorld ).multiplyScalar(suspensionForce * timeStep);
            //console.log(suspensionForce * timeStep)
            
            addImpulseAt( this.motor, chassisBody, impulse, wheel.raycastResult.hitPointWorld );
            
            //repos.copy( wheel.raycastResult.hitPointWorld ).sub( chassisBody.position );
            //addImpulseAt( chassisBody, impulse, repos );
        }

        this.updateFriction(timeStep);
        
 
        let hitNormalWorldScaledWithProj = new Vector3();
        let fwd  = new Vector3();
        let vel = new Vector3();
        for (i = 0; i < numWheels; i++) {
            let wheel = wheelInfos[i];
            velocityAt(chassisBody, wheel.chassisConnectionPointWorld, vel);
            // Hack to get the rotation in the correct direction
            let m = 1;
            switch(this.indexUpAxis){
            case 1:
                m = -1;
                break;
            }

            if (wheel.isInContact) {

                this.getVehicleAxisWorld(this.indexForwardAxis, fwd);
                let proj = Dot(fwd, wheel.raycastResult.hitNormalWorld);
                //hitNormalWorldScaledWithProj.copyFrom(wheel.raycastResult.hitNormalWorld).scaleInPlace(proj)
                hitNormalWorldScaledWithProj.copy(wheel.raycastResult.hitNormalWorld).multiplyScalar(proj);

                //fwd.subtractToRef(hitNormalWorldScaledWithProj, fwd);
                fwd.sub(hitNormalWorldScaledWithProj);

                let proj2 = Dot(fwd, vel);
                wheel.deltaRotation = m * proj2 * timeStep / wheel.radius;
            }

            if((wheel.sliding || !wheel.isInContact) && wheel.engineForce !== 0 && wheel.useCustomSlidingRotationalSpeed){
                // Apply custom rotation when accelerating and sliding
                wheel.deltaRotation = (wheel.engineForce > 0 ? 1 : -1) * wheel.customSlidingRotationalSpeed * timeStep;
            }

            // Lock wheels
            if(Math.abs(wheel.brake) > Math.abs(wheel.engineForce)){
                wheel.deltaRotation = 0;
            }

            //wheel.rotation += wheel.deltaRotation; // Use the old value
            wheel.rotation -= wheel.deltaRotation; // Use the old value
            wheel.deltaRotation *= 0.99; // damping of rotation when not in contact
        }
    }


    updateSuspension( deltaTime ) {

        let chassisBody = this.chassisBody;
        let chassisMass = bodyMass(chassisBody);
        let wheelInfos = this.wheelInfos;
        let numWheels = wheelInfos.length;

        for (let w_it = 0; w_it < numWheels; w_it++){
            let wheel = wheelInfos[w_it];

            if (wheel.isInContact){
                let force;

                // Spring
                let susp_length = wheel.suspensionRestLength;
                let current_length = wheel.suspensionLength;
                let length_diff = (susp_length - current_length);

                force = wheel.suspensionStiffness * length_diff * wheel.clippedInvContactDotSuspension;

                // Damper
                let projected_rel_vel = wheel.suspensionRelativeVelocity;
                let susp_damping;
                if (projected_rel_vel < 0) {
                    susp_damping = wheel.dampingCompression;
                } else {
                    susp_damping = wheel.dampingRelaxation;
                }
                force -= susp_damping * projected_rel_vel;

                wheel.suspensionForce = force * chassisMass;
                if (wheel.suspensionForce < 0) {
                    wheel.suspensionForce = 0;
                }
            } else {
                wheel.suspensionForce = 0;
            }
        }

    }

    updateFriction( timeStep ){

        let surfNormalWS_scaled_proj = updateFriction_surfNormalWS_scaled_proj;

        //calculate the impulse, so that the wheels don't move sidewards
        let wheelInfos = this.wheelInfos;
        let numWheels = wheelInfos.length;
        let chassisBody = this.chassisBody;
        let forwardWS = updateFriction_forwardWS;
        let axle = updateFriction_axle;
        let i, wheel, groundObject;

        for ( i = 0; i < numWheels; i++) {

            wheel = wheelInfos[i];
            groundObject = wheel.raycastResult.body;
            
            wheel.sideImpulse = 0;
            wheel.forwardImpulse = 0;

            if(!forwardWS[i]) forwardWS[i] = new Vector3();
            if(!axle[i]) axle[i] = new Vector3();
            
        /*}
        
        for ( i = 0; i < numWheels; i++){

            wheel = wheelInfos[i];
    
            groundObject = wheel.raycastResult.body;*/
    
            if (groundObject) {

                let axlei = axle[i];
                let wheelTrans = this.getWheelTransformWorld(i);
    
                // Get world axle
                TransformNormalToRef( directions[this.indexRightAxis], wheelTrans, axlei );
        
                let surfNormalWS = wheel.raycastResult.hitNormalWorld;
                //if(i=== 0)console.log(axlei)
                let proj = Dot(axlei, surfNormalWS);
                
                //surfNormalWS.scaleToRef(proj, surfNormalWS_scaled_proj);
                //axlei.subtractToRef(surfNormalWS_scaled_proj, axlei);

                surfNormalWS_scaled_proj.copy(surfNormalWS).multiplyScalar(proj);
                axlei.sub(surfNormalWS_scaled_proj).normalize();
               
                CrossToRef(surfNormalWS, axlei, forwardWS[i]);
                forwardWS[i].normalize();
                //if(i=== 0)console.log(forwardWS[i])

                wheel.sideImpulse = resolveSingleBilateral(
                    chassisBody,
                    wheel.raycastResult.hitPointWorld,
                    groundObject,
                    wheel.raycastResult.hitPointWorld,
                    axlei
                );
                //if(i == 0) console.log(wheel.sideImpulse)
                wheel.sideImpulse *= sideFrictionStiffness2;
            }
        }



        let sideFactor = 1;
        let fwdFactor = 0.5;
        this.sliding = false;

        for ( i = 0; i < numWheels; i++) {

            wheel = wheelInfos[i];
            groundObject = wheel.raycastResult.body;

            let rollingFriction = 0;

            wheel.slipInfo = 1;
            if ( groundObject ) {
                let defaultRollingFrictionImpulse = 0;
                let maxImpulse = wheel.brake ? wheel.brake : defaultRollingFrictionImpulse;

                // btWheelContactPoint contactPt(chassisBody,groundObject,wheelInfraycastInfo.hitPointWorld,forwardWS[wheel],maxImpulse);
                // rollingFriction = calcRollingFriction(contactPt);
                rollingFriction = calcRollingFriction(chassisBody, groundObject, wheel.raycastResult.hitPointWorld, forwardWS[i], maxImpulse);

                rollingFriction += wheel.engineForce * timeStep;
                //rollingFriction *= 10

                // rollingFriction = 0;
                let factor = maxImpulse / rollingFriction;
                wheel.slipInfo *= factor;

                //console.log(rollingFriction)
            }

            //switch between active rolling (throttle), braking and non-active rolling friction (nthrottle/break)

            wheel.forwardImpulse = 0;
            wheel.skidInfo = 1;

            if ( groundObject ) {
                wheel.skidInfo = 1;

                let maximp = wheel.suspensionForce * timeStep * wheel.frictionSlip;
                let maximpSide = maximp;

                let maximpSquared = maximp * maximpSide;

                wheel.forwardImpulse = rollingFriction;//wheelInfo.engineForce* timeStep;

                let x = (wheel.forwardImpulse * fwdFactor) / wheel.forwardAcceleration;
                let y = (wheel.sideImpulse * sideFactor) / wheel.sideAcceleration;

                let impulseSquared = x * x + y * y;

                ///console.log(impulseSquared)

                wheel.sliding = false;
                if ( impulseSquared > maximpSquared ) {
                    this.sliding = true;
                    wheel.sliding = true;

                    let factor = maximp / Math.sqrt( impulseSquared );

                    wheel.skidInfo *= factor;
                }
            }
        }

        if (this.sliding) {
            for (let i = 0; i < numWheels; i++) {
                wheel = wheelInfos[i];
                if (wheel.sideImpulse !== 0) {
                    if (wheel.skidInfo < 1){
                        wheel.forwardImpulse *= wheel.skidInfo;
                        wheel.sideImpulse *= wheel.skidInfo;
                    }
                }
            }
        }

        
        // apply the impulses // TODO !!!
        for ( i = 0; i < numWheels; i++) {

            wheel = wheelInfos[i];
    
            let rel_pos = new Vector3();
            rel_pos.copy( wheel.raycastResult.hitPointWorld ).sub( bodyPosition(chassisBody, new Vector3()) );
            //wheel.raycastResult.hitPointWorld.subtractToRef(bodyPosition(chassisBody, new Vector3()), rel_pos);
           
            if (wheel.forwardImpulse !== 0) {
                let impulse = new Vector3();
                impulse.copy(forwardWS[i]).multiplyScalar(wheel.forwardImpulse);
                //impulse.copyFrom(forwardWS[i]).scaleInPlace(wheel.forwardImpulse)
                addImpulseAt( this.motor, chassisBody, impulse, wheel.raycastResult.hitPointWorld);
            
            }
    
            if ( wheel.sideImpulse !== 0 ){

                groundObject = wheel.raycastResult.body;
    
                let rel_pos2 = new Vector3();
               
                rel_pos2.copy(wheel.raycastResult.hitPointWorld).sub(bodyPosition(groundObject, new Vector3()));
                //wheel.raycastResult.hitPointWorld.subtractToRef(bodyPosition(groundObject, new Vector3()), rel_pos2);
                let sideImp = new Vector3();
                sideImp.copy(axle[i]).multiplyScalar(wheel.sideImpulse);
                //sideImp.copyFrom(axle[i]).scaleInPlace(wheel.sideImpulse)
    
                TransformNormalToRef(rel_pos, bodyTransform(chassisBody, new Matrix4()).invert(), rel_pos);
                rel_pos['xyz'[this.indexUpAxis]] *= wheel.rollInfluence;
                
                TransformNormalToRef(rel_pos, bodyTransform(chassisBody, new Matrix4()), rel_pos);
                addImpulseAt( this.motor, chassisBody, sideImp, bodyPosition(chassisBody, new Vector3()).add(rel_pos));
            
                //sideImp.scaleToRef(-1, sideImp);
                sideImp.multiplyScalar(-1);

                // add impulse on staic object ???
                addImpulseAt( this.motor, groundObject, sideImp, wheel.raycastResult.hitPointWorld );
                
            }
        }

    }


    updateWheelTransformWorld( wheel ){

        //wheel.isInContact = false;
        let chassisBody = this.chassisBody;
        const transform = chassisBody.matrixWorld;//bodyTransform( chassisBody, new Matrix4() )
      
        TransformCoordinatesToRef( wheel.chassisConnectionPointLocal, transform, wheel.chassisConnectionPointWorld );
        TransformNormalToRef( wheel.directionLocal, transform, wheel.directionWorld );
        //TransformNormalToRef( wheel.axleLocal, transform, wheel.axleWorld )
        
    }

    updateWheelTransform( wheelIndex ){

        let up = tmpVec4;
        let right = tmpVec5;
        let fwd = tmpVec6;

        let wheel = this.wheelInfos[wheelIndex];
        this.updateWheelTransformWorld(wheel);

        up.copy( wheel.directionLocal ).multiplyScalar(-1);
        right.copy(wheel.axleLocal);
        CrossToRef( up, right, fwd );
        fwd.normalize();
        right.normalize();

        // Rotate around steering over the wheelAxle
        let steering = wheel.steering;
        let steeringOrn = new Quaternion$1();
        RotationAxisToRef( up, steering, steeringOrn );

        let rotatingOrn = new Quaternion$1();
        RotationAxisToRef(right, wheel.rotation, rotatingOrn);

        // World rotation of the wheel
        let q = wheel.quaternion;
        bodyOrientation( this.chassisBody, q );
        q.multiply(steeringOrn).multiply(rotatingOrn).normalize();

        // world position of the wheel
        let p = wheel.position;
        p.copy( wheel.directionWorld );
        p.multiplyScalar( wheel.suspensionLength );
        let locP = p.clone();
        p.add( wheel.chassisConnectionPointWorld );

        wheel.matrix.compose( wheel.position, wheel.quaternion, {x:1,y:1,z:1} );

        if( this.localWheel ){
            locP.add( wheel.chassisConnectionPointLocal );
            this.wheelMeshes[wheelIndex].quaternion.copy(steeringOrn).multiply(rotatingOrn).normalize();
            this.wheelMeshes[wheelIndex].position.copy(locP);
            if(this.brakeMeshs){
                if(wheelIndex === 2 || wheelIndex === 3 ) this.brakeMeshs[wheelIndex].quaternion.copy(steeringOrn).normalize();
                this.brakeMeshs[wheelIndex].position.copy(locP);
                this.brakeMeshs[wheelIndex].updateMatrix();
            }
        } else {
            this.wheelMeshes[wheelIndex].position.copy(wheel.position);
            this.wheelMeshes[wheelIndex].quaternion.copy(wheel.quaternion);
            this.wheelMeshes[wheelIndex].updateMatrix();
        }

    }

    getWheelTransformWorld(id) {
        return this.wheelInfos[id].matrix;
        //return this.wheelMeshes[id].matrixWorld ;
    }



}




const Utilsdefaults = (options, defaults) => {
    options = options || {};

    for(var key in defaults){
        if(!(key in options)){
            options[key] = defaults[key];
        }
    }

    return options;
};


var chassis_velocity_at_contactPoint = new Vector3();
var relpos = new Vector3();

class WheelInfo {
    constructor( options, motor ){

        this.motor = motor;

        options = Utilsdefaults(options, {
            chassisConnectionPointLocal: new Vector3(),
            chassisConnectionPointWorld: new Vector3(),
            directionLocal: new Vector3(),
            directionWorld: new Vector3(),
            axleLocal: new Vector3(),
            //axleWorld: new Vector3(),
            suspensionRestLength: 1,
            suspensionMaxLength: 2,
            radius: 1,
            suspensionStiffness: 100,
            dampingCompression: 10,
            dampingRelaxation: 10,
            frictionSlip: 10000,
            forwardAcceleration: 1,
            sideAcceleration: 1,
            steering: 0,
            rotation: 0,
            deltaRotation: 0,
            rollInfluence: 0.01,
            maxSuspensionForce: Number.MAX_VALUE,
            isFrontWheel: true,
            clippedInvContactDotSuspension: 1,
            suspensionRelativeVelocity: 0,
            suspensionForce: 0,
            skidInfo: 0,
            suspensionLength: 0,
            maxSuspensionTravel: 1,
            useCustomSlidingRotationalSpeed: false,
            customSlidingRotationalSpeed: -0.1
        });

        this.maxSuspensionTravel = options.maxSuspensionTravel;
        this.customSlidingRotationalSpeed = options.customSlidingRotationalSpeed;
        this.useCustomSlidingRotationalSpeed = options.useCustomSlidingRotationalSpeed;
        this.sliding = false;
        this.chassisConnectionPointLocal = options.chassisConnectionPointLocal.clone();
        this.chassisConnectionPointWorld = options.chassisConnectionPointLocal.clone();
        this.directionLocal = options.directionLocal.clone();
        this.directionWorld = options.directionLocal.clone();
        this.axleLocal = options.axleLocal.clone();
        //this.axleWorld = options.axleLocal.clone();
        this.suspensionRestLength = options.suspensionRestLength;
        this.suspensionMaxLength = options.suspensionMaxLength;
        this.radius = options.radius;
        this.suspensionStiffness = options.suspensionStiffness;
        this.dampingCompression = options.dampingCompression;
        this.dampingRelaxation = options.dampingRelaxation;
        this.frictionSlip = options.frictionSlip;
        this.forwardAcceleration = options.forwardAcceleration;
        this.sideAcceleration = options.sideAcceleration;
        this.steering = 0;
        this.rotation = 0;
        this.deltaRotation = 0;
        this.rollInfluence = options.rollInfluence;
        this.maxSuspensionForce = options.maxSuspensionForce;
        this.engineForce = 0;
        this.brake = 0;
        this.isFrontWheel = options.isFrontWheel;
        this.clippedInvContactDotSuspension = 1;
        this.suspensionRelativeVelocity = 0;
        this.suspensionForce = 0;
        this.skidInfo = 0;
        this.suspensionLength = 0;
        this.sideImpulse = 0;
        this.forwardImpulse = 0;
        this.raycastResult = new RaycastResult();
        //this.raycastDirectionWorld = new Vector3()
        //this.worldTransform = new TransformNode("")
        //this.worldTransform.rotationQuaternion = new THREE.Quaternion()

        this.position = new Vector3().copy(this.chassisConnectionPointLocal);
        this.quaternion = new Quaternion$1();

        this.isInContact = false;
        this.chassisBody = null;
        this.ray = null;

        this.matrix = new Matrix4();

    }

    castRay( r ){

        if(r.hit){

            this.isInContact = true;
            //if( this.isInContact ){
            let hitDistance = r.distance;
            this.raycastResult.hitPointWorld.fromArray( r.point );
            this.raycastResult.hitNormalWorld.fromArray( r.normal );
            this.raycastResult.body = this.motor.byName( r.body );

            this.suspensionLength = hitDistance - this.radius;
            // clamp on max suspension travel
            let minSuspensionLength = this.suspensionRestLength - this.maxSuspensionTravel;
            let maxSuspensionLength = this.suspensionRestLength + this.maxSuspensionTravel;
            if (this.suspensionLength < minSuspensionLength) {
                this.suspensionLength = minSuspensionLength;
            }
            if (this.suspensionLength > maxSuspensionLength) {
                this.suspensionLength = maxSuspensionLength;
                this.raycastResult.reset();
            }
            let denominator = Dot(this.raycastResult.hitNormalWorld,this.directionWorld);

            //var chassis_velocity_at_contactPoint = new Vector3();
            velocityAt( this.chassisBody, this.raycastResult.hitPointWorld, chassis_velocity_at_contactPoint );
            var projVel = Dot(this.raycastResult.hitNormalWorld, chassis_velocity_at_contactPoint );
            //let projVel = this.raycastResult.hitNormalWorld.dot( chassis_velocity_at_contactPoint )

            if (denominator >= -0.1) {
                this.suspensionRelativeVelocity = 0;
                this.clippedInvContactDotSuspension = 1 / 0.1;
            } else {
                let inv = -1 / denominator;
                this.suspensionRelativeVelocity = projVel * inv;
                this.clippedInvContactDotSuspension = inv;
            }

        } else {

            this.isInContact = false;

            //put wheel info as in rest position
            this.suspensionLength = this.suspensionRestLength + 0 * this.maxSuspensionTravel;
            this.suspensionRelativeVelocity = 0.0;
            this.raycastResult.hitNormalWorld.copy( this.directionWorld ).multiplyScalar(-1);
            this.clippedInvContactDotSuspension = 1.0;

        }

        // change ray lenght on next frame ?
        /*let raylen = this.suspensionRestLength + this.radius;
        this.ray.setRay({end:[  this.chassisConnectionPointLocal.x, -raylen, this.chassisConnectionPointLocal.z ]})
        */

    }

    updateWheel( chassis ){

        let raycastResult = this.raycastResult;
    
        if (this.isInContact){
            let project = raycastResult.hitNormalWorld.dot(raycastResult.directionWorld);
            //var project = Dot(raycastResult.hitNormalWorld, raycastResult.directionWorld);
            relpos.copy( raycastResult.hitPointWorld ).sub( chassis.position );
            //raycastResult.hitPointWorld.subtractToRef( bodyPosition(chassis, new Vector3()), relpos);
            velocityAt( chassis, relpos, chassis_velocity_at_contactPoint );
           // velocityAt(chassis, raycastResult.hitPointWorld, relpos);
            //var projVel = Dot(raycastResult.hitNormalWorld, chassis_velocity_at_contactPoint );
            let projVel = raycastResult.hitNormalWorld.dot( chassis_velocity_at_contactPoint );
            if (project >= -0.1) {
                this.suspensionRelativeVelocity = 0.0;
                this.clippedInvContactDotSuspension = 1.0 / 0.1;
            } else {
                let inv = -1 / project;
                this.suspensionRelativeVelocity = projVel * inv;
                this.clippedInvContactDotSuspension = inv;
            }
    
        } else {
            // Not in contact : position wheel in a nice (rest length) position
            raycastResult.suspensionLength = this.suspensionRestLength;
            this.suspensionRelativeVelocity = 0.0;
            raycastResult.hitNormalWorld.copy(raycastResult.directionWorld).scaleInPlace(-1);
            this.clippedInvContactDotSuspension = 1.0;
        }
    }
}






class RaycastResult {
    constructor(){
        this.body = null;
        this.hitPointWorld = new Vector3();
        this.hitNormalWorld = new Vector3();
        this.directionWorld = new Vector3();
    }
    reset(){
        this.body = null;
        this.hitPointWorld = new Vector3();
        this.hitNormalWorld = new Vector3();
        this.directionWorld = new Vector3();
    }
}


const bodyMass = (body) => ( body.mass );
const bodyInvMass = (body) => ( body.mass > 0 ? 1.0 / body.mass : 0 );

const bodyPosition = (body, res) => ( res.copy( body.position ) );
const bodyLinearVelocity = (body, res) => ( res.copy( body.velocity ) );
const bodyTransform = (body, res) => ( res.copy( body.matrixWorld ) );
const bodyOrientation = (body, res) => ( res.copy( body.quaternion ) );



// The force applies the given energy overtime, while the impulse applies the given energy immediately


const addImpulseAt = ( motor, body, impulse, point ) => {

    //impulse = body.worldToLocal( impulse )
    //root.motor.change({ name:body.name, impulse:impulse.toArray() })
    //point = body.worldToLocal( point )
    //impulse = body.localToWorld( impulse )
    //point = body.localToWorld( point )
    //root.motor.change({ name:body.name, worldForce
    //console.log({ name:body.name, impulse:impulse.toArray(), impulseCenter:point.toArray() })
    motor.change({ name:body.name, impulse:impulse.toArray(), impulseCenter:point.toArray() });
};

const velocityAt = (body, pos, res) => {
    
    res.copy( pos ).sub( body.position );
    res.crossVectors( body.angular, res );
    res.add( body.velocity );
    return res;

};

const bodyInertiaWorld = ( body, res ) => {

    if(body.inertia) res.copy( body.inertia );//.applyNormalMatrix( body.matrixWorld );
    //console.log(res)
    TransformNormalToRef(res, body.matrixWorld, res);
    res.x = res.x > 0 ? 1.0 / res.x : 0;
    res.y = res.y > 0 ? 1.0 / res.y : 0;
    res.z = res.z > 0 ? 1.0 / res.z : 0;
    return res
};


// vector3 function 

const Dot = ( v, w ) => ( v.x * w.x + v.y * w.y + v.z * w.z );

const CrossToRef = ( left, right, result ) => {
    const x = left.y * right.z - left.z * right.y;
    const y = left.z * right.x - left.x * right.z;
    const z = left.x * right.y - left.y * right.x;
    result.set( x, y, z );
    return result
};

const TransformCoordinatesToRef = ( v, t, result ) => {

    //result.copy(v).applyMatrix4(t)

    const x = v.x, y = v.y, z = v.z;
    const m = t.elements;
    const rx = x * m[0] + y * m[4] + z * m[8] + m[12];
    const ry = x * m[1] + y * m[5] + z * m[9] + m[13];
    const rz = x * m[2] + y * m[6] + z * m[10] + m[14];
    const rw = 1 / (x * m[3] + y * m[7] + z * m[11] + m[15]);

    result.x = rx * rw;
    result.y = ry * rw;
    result.z = rz * rw;
    return result;

};

const TransformNormalToRef = ( v, t, result ) => {

    const x = v.x, y = v.y, z = v.z;
    const m = t.elements;
    result.x = x * m[0] + y * m[4] + z * m[8];
    result.y = x * m[1] + y * m[5] + z * m[9];
    result.z = x * m[2] + y * m[6] + z * m[10];
    return result//.normalize();

};

// Quaternion function 

const RotationAxisToRef = ( axis, angle, result ) => {

    const sin = Math.sin(angle / 2);
    axis.normalize();
    result.w = Math.cos(angle / 2);
    result.x = axis.x * sin;
    result.y = axis.y * sin;
    result.z = axis.z * sin;
    return result;

};









function calcRollingFriction(body0, body1, frictionPosWorld, frictionDirectionWorld, maxImpulse) {
    var j1 = 0;
    var contactPosWorld = frictionPosWorld;

    var vel1 = calcRollingFriction_vel1;
    var vel2 = calcRollingFriction_vel2;
    var vel = calcRollingFriction_vel;
   
    velocityAt(body0, contactPosWorld, vel1);
    velocityAt(body1, contactPosWorld, vel2);
    //vel1.subtractToRef(vel2, vel);
    //vel1.sub(vel2)
    vel.copy(vel1).sub(vel2);

    var vrel = Dot(frictionDirectionWorld, vel);

    var denom0 = computeImpulseDenominator(body0, frictionPosWorld, frictionDirectionWorld);
    var denom1 = computeImpulseDenominator(body1, frictionPosWorld, frictionDirectionWorld);
    var relaxation = 1;
    var jacDiagABInv = relaxation / (denom0 + denom1);

    // calculate j that moves us to zero relative velocity
    j1 = -vrel * jacDiagABInv;

    if (maxImpulse < j1) {
        j1 = maxImpulse;
    }
    if (j1 < -maxImpulse) {
        j1 = -maxImpulse;
    }

    return j1;
}



var computeImpulseDenominator_r0 = new Vector3();
var computeImpulseDenominator_c0 = new Vector3();
var computeImpulseDenominator_vec = new Vector3();
var computeImpulseDenominator_m = new Vector3();

function computeImpulseDenominator(body, pos, normal) {

    var r0 = computeImpulseDenominator_r0;
    var c0 = computeImpulseDenominator_c0;
    var vec = computeImpulseDenominator_vec;
    var m = computeImpulseDenominator_m;

    //pos.subtractToRef(bodyPosition(body, new Vector3()), r0);
    r0.copy(pos).sub(bodyPosition(body, new Vector3()));
    CrossToRef(r0, normal, c0);
    // ???
    //bodyInertiaWorld(body, new Vector3()).multiplyToRef(c0, m)
    //bodyInertiaWorld( body, m ).multiply(c0)
    m.copy( bodyInertiaWorld(body, new Vector3()) ).multiply(c0);
    

    CrossToRef(m, r0, vec);

    return bodyInvMass(body) + Dot(normal, vec);
}



var resolveSingleBilateral_vel1 = new Vector3();
var resolveSingleBilateral_vel2 = new Vector3();
var resolveSingleBilateral_vel = new Vector3();



function resolveSingleBilateral( body1, pos1, body2, pos2, normal ){

    var normalLenSqr = normal.lengthSq();
    if (normalLenSqr > 1.1){
        return 0; // no impulse
    }
    let vel1 = resolveSingleBilateral_vel1;
    let vel2 = resolveSingleBilateral_vel2;
    let vel = resolveSingleBilateral_vel;
   
    velocityAt(body1, pos1, vel1);
    velocityAt(body2, pos2, vel2);
    
    //vel1.sub(vel2);
    vel.copy(vel1).sub(vel2);

    let rel_vel = Dot(normal, vel);
    let massTerm = 1 / (bodyInvMass(body1) + bodyInvMass(body2));
    let impulse = -0.1 * rel_vel * massTerm;

    //console.log(bodyInvMass(body1) )

    return impulse;
}

// https://www.youtube.com/watch?v=WzNDI7g6jA4

class Helicopter {

	constructor ( o = {}, motor ) {

		// car test
		//https://www.youtube.com/watch?v=BSybcKPQCnc

		this.MoveSpeed = 50;
	    this.MaxSpeed = 15;
	    this.Drag = 0.98;
	    this.SteerAngle = 20;
	    this.Traction = 10;
	    this.MoveForce = new Vector3(0,0,0);

	    this.tt = new Vector3(0,0,0);
	    this.v1 = new Vector3(0,0,0);
	    this.v2 = new Vector3(0,0,0);
	    //

		this.motor = motor;

		this.debug = this.motor.addDebuger();

		/*this.up = new Vector3(0,1,0);
		this.right = new Vector3(1,0,0);
		this.forward = new Vector3(0,0,1);

		this.transform = {
			position:new Vector3(),
			up:new Vector3(),
			right:new Vector3(),
			forward: new Vector3(),
			thottle:new Vector3(),
		}*/

		this._reponsivness = 500;
		this._throttleAmt = 25;

		this._thottle = 0;

		this._roll = 0;
		this._pitch = 0;
		this._yaw = 0;

		
		this.init(o);

	}

	init(){

		this.car = new Mesh(new BoxGeometry(2,1,3), new MeshBasicMaterial({wireframe:true}));
		this.car.position.y = 0.5;
		this.motor.add(this.car);

		let axis = new AxesHelper();
		this.car.add(axis);
		
		/*this.body = this.motor.add({
			type:'box',
			name:'copter',
			size:[1.87, 2, 5],
			pos:[0,1,0],
			mass:360,
		})*/

	}

	update( delta ){

		this.updateCar(delta);

		//this.handleInputs(delta)

		//this.fixedUpdate()

	}

	updateCar(delta) {


		const key = this.motor.getKey();
		const transform = this.motor.getTransform(this.car);

		/*transform.position.copy(this.car.position);

		// Moving
		transform.forward.copy(this.forward).applyQuaternion( this.car.quaternion );
		transform.up.copy(this.up).applyQuaternion( this.car.quaternion );*/

		//

		this.tt.copy(transform.forward).multiplyScalar(this.MoveSpeed*-key[1]*delta);

        this.MoveForce.add(this.tt);

        this.car.position.add(this.MoveForce.clone().multiplyScalar(delta));// += MoveForce * Time.deltaTime;



		// Steering
        let steerInput = -key[0];
        let magnitude = this.MoveForce.length();
        transform.up.multiplyScalar(steerInput*magnitude*this.SteerAngle*delta);

        this.car.rotation.y += transform.up.y*this.motor.math.torad;


        this.MoveForce.multiplyScalar(this.Drag);
        this.MoveForce.clampLength(0, this.MaxSpeed);

        magnitude = this.MoveForce.length();


        this.v1.copy(this.MoveForce).normalize().multiplyScalar(3);
        this.v2.copy(transform.forward).multiplyScalar(3);


        // Traction
        this.debug.DrawRay(transform.position, this.v1, 'white');
        this.debug.DrawRay(transform.position, this.v2, 'blue');

        this.debug.DrawRay(transform.position, transform.right, 'red');

        this.v1.copy(this.MoveForce).normalize().lerp(transform.forward, this.Traction*delta );

        this.MoveForce.copy(this.v1).multiplyScalar(magnitude);

        // Steering
        
        /*transform.Rotate(Vector3.up * steerInput * MoveForce.magnitude * SteerAngle * Time.deltaTime);

        // Drag and max speed limit
        MoveForce *= Drag;
        MoveForce = Vector3.ClampMagnitude(MoveForce, MaxSpeed);

        // Traction
        this.debug.DrawRay(transform.position, MoveForce.normalized * 3);
        this.debug.DrawRay(transform.position, transform.forward * 3, Color.blue);
        MoveForce = Vector3.Lerp(MoveForce.normalized, transform.forward, Traction * Time.deltaTime) * MoveForce.magnitude;*/
    
    }

	fixedUpdate( delta ){

		const transform = this.motor.getTransform(this.body);//this.transform;

		transform.position.copy(this.body.position);

		transform.forward.copy(this.forward).applyQuaternion( this.body.quaternion );
		transform.right.copy(this.right).applyQuaternion( this.body.quaternion );
		transform.up.copy(this.up).applyQuaternion( this.body.quaternion );
		transform.thottle.copy(transform.up);
		
		this.motor.change({ name:this.body.name, impulse:transform.thottle.multiplyScalar(this._thottle).toArray() });

		//this.motor.change({ name:this.body.name, torque:transform.right.multiplyScalar(this._pitch * this._reponsivness).toArray() })
		//this.motor.change({ name:this.body.name, torque:transform.forward.multiplyScalar(this._roll * this._reponsivness).toArray() })
		//this.motor.change({ name:this.body.name, torque:transform.up.multiplyScalar(this._yaw * this._reponsivness).toArray() })


		this.debug.DrawRay(transform.position, transform.thottle, 'red');
		this.debug.DrawRay(transform.position, transform.forward, 'yellow');
		this.debug.DrawRay(transform.position, transform.right, 'cyan');
		this.debug.DrawRay(transform.position, transform.up, 'green');



		/*this.body.addForces( transform.up * this._thottle, 'impulse' )

		this.body.addTorque( transform.right * this._pitch * this._reponsivness )
		this.body.addTorque( transform.forward * this._roll * this._reponsivness )
		this.body.addTorque( transform.up * this._yaw * this._reponsivness )*/

	}

	handleInputs(delta){

		const key = this.motor.getKey();


		this._roll = key[0];
		this._pitch = key[1];

		if(key[4]) this._thottle += delta * this._throttleAmt;
		else if(key[5]) this._thottle -= delta * this._throttleAmt;

		

		this._thottle = this.motor.math.clamp(this._thottle, 0, 100);

	}

}

// https://www.youtube.com/watch?v=WzNDI7g6jA4

class Kart {

	constructor ( o = {}, motor ) {

		this.startPosition = o.pos || [0,0,0];
		this.model = o.model || null;
		this.debug = o.debug || false;

		// taxi test
		//https://www.youtube.com/watch?v=BSybcKPQCnc

		// https://www.models-resource.com/wii/mariokartwii/
		//https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=10&sort_by=count&sort_order=DESC

		

		this.angle = 0;

		this.speed = 50;
	    this.maxSpeed = 20;
	    this.drag = 0.98;
	    this.steerAngle = 5;//20;
	    this.traction = 3;//1_10 drift 


	    this.moveForce = new Vector3(0,0,0);
	    this.side = 0;
	    this.onAir = false;

	    this.tt = new Vector3(0,0,0);
	    this.v1 = new Vector3(0,0,0);
	    this.v2 = new Vector3(0,0,0);

	    this.floorNormal = new Vector3(0,0,0);
	    this.up = new Vector3(0,1,0);
	    this.decal = new Vector3(0,-0.5,0);

	    this.tmpQ1 = new Quaternion$1();
	    this.tmpQ2 = new Quaternion$1();
	    this.tmpQ3 = new Quaternion$1();

		this.motor = motor;
		this.angleS = 0;

		if(this.debug) this.debuger = this.motor.addDebuger();

		this.phyMove = true;

		
		this.init(o);
		//this.setDebug();

	}

	setDebug(b){

		if(b)this.debug = b;
		this.sphere.visible = this.debug;
	    this.ray.visible = this.debug;

	}

	init(){

		this.radius = 1;
		this.decal.y = -0.5;

		this.radius = 1.7;
		this.decal.y = -1.2;

		const math = this.motor.math;

		this.sphere = this.motor.add({ 
			type:'sphere', 
			name:'baser', 
			mass:1, size:[this.radius], 
			pos:math.addArray(this.startPosition, [0,this.radius,0]), 
			friction:0.5,  
			material:'debug',
			getVelocity:true,
			visible:this.debug,
			shadow:false,
			ray:false,
		});//angularFactor:[1,0,0],

		let selfHit = this.rayHit.bind(this);

		this.ray = this.motor.add({ name:'raySphere', type:'ray', begin:[0,0,0], end:[0,-(this.radius+1),0], visible:this.debug, parent:this.sphere, noRotation:true, callback:selfHit });

		
		if(this.model ){ 

			for(let m in this.model){
				this.model[m].receiveShadow = true;
				this.model[m].castShadow = true;
			}

			this.car = this.model.body;
			
			this.w = [
				this.model.wheel_0,
				this.model.wheel_1,
				this.model.wheel_2,
				this.model.wheel_3,
				this.model.d_wheel,
			];
			//this.car.geometry.scale(10,10,10)
		} else {
			this.car = new Mesh(new BoxGeometry(1,0.4,2), new MeshBasicMaterial({wireframe:true}));
			this.addWheels();
		}

		this.motor.add(this.car);

		/*this.chassis = this.motor.add({
			type:'compound',
			name:'chassis',
			//kinematic:true,
			mass:1,
			shapes:[
			{type:'box', size:[0.5,0.5,0.5], pos:[0,0,1.6]}
			],

		})*/

		

		//let axis = new AxesHelper();
		//this.car.add(axis);

	}

	addWheels(){
		let g = new CylinderGeometry(0.3,0.3, 0.3, 16);
		g.rotateZ(Math.PI/2);
		let m = new MeshBasicMaterial({wireframe:true});
		let i = 4;
		let p = [0.7, -0.2, 0.7];
		let pos; 
		let w = [];
		while(i--){
			w[i] = new Mesh( g, m );
			pos = [i===0||i===3? p[0]:-0.7, p[1], i<2? p[2]:-0.7];
			w[i].position.fromArray( pos );

			//r[i] = this.motor.add({ name:'rayW'+i, type:'ray', begin:pos, end:pos1, visible:true, parent:this.sphere, noRotation:true })

			this.car.add(w[i]);
		}

		this.w = w;
	}

	updateWheels(){
		this.motor.math;
		let i = 4, w;
		
		this.tmpQ3.setFromAxisAngle( {x:0,y:1,z:0}, this.angleS*3 );
		let s = this.sphere.velocity.length()*this.side;//*2;
		//s = math.clamp(s, -0.8, 0.8)
		let axis = {x:1,y:0,z:0};
		while(i--){
			w = this.w[i];
			if(i<2) w.quaternion.setFromAxisAngle(axis,s).premultiply(this.tmpQ3);
			else w.quaternion.setFromAxisAngle(axis,s);
		}

	    if(this.w[4]) this.w[4].rotation.y = this.angleS*10;

	}

	rayHit(r){

		//console.log(o)
		if(r.hit) this.floorNormal.fromArray(r.normal).normalize();
		else this.floorNormal.set(0,0,0);

		this.onAir = !r.hit;
		
	}

	update( delta ){

		const key = this.motor.getKey();
		const math = this.motor.math;

		if(this.phyMove) this.car.position.copy(this.sphere.position).add(this.decal);

		const transform = this.motor.getTransform(this.car);

		// moving

		let acceleration = -key[1]*this.speed*delta;

		if( this.onAir ) acceleration = 0;



		this.tt.copy(transform.forward).multiplyScalar(acceleration);

        this.moveForce.add(this.tt);

        if(!this.phyMove) this.car.position.add(this.moveForce.clone().multiplyScalar(delta));

        //this.car.position.copy(this.sphere.position).add(this.decal);

        this.tmpQ1.setFromUnitVectors( this.up, this.floorNormal );
        this.tmpQ2.slerp(this.tmpQ1, delta*4);

        

        let ar = this.moveForce.toArray();

        this.motor.change({ name:this.sphere.name, linear:ar, velocityOperation:'xz' });

        if(this.chassis)this.motor.change({ name:this.chassis.name, /*linear:ar, velocityOperation:'xz',*/quat:this.car.quaternion.toArray() ,pos:this.car.position.toArray() });
        





		// Steering

        let steerInput = -key[0];
        let magnitude = this.moveForce.length();
        // console.log(transform.up)
        // transform.up.multiplyScalar(steerInput*magnitude*this.SteerAngle*delta)

        this.angleS = steerInput*this.steerAngle*math.torad;

        //this.angle += (steerInput*magnitude*this.SteerAngle*delta)*math.torad;

        this.angle += this.angleS*magnitude*delta;

        //this.angleS = math.clamp(Math.PI/2 + this.angle, -this.SteerAngle, this.SteerAngle)

        //this.car.rotation.y += transform.up.y*math.torad

        this.car.quaternion.setFromAxisAngle(this.up, this.angle).premultiply(this.tmpQ2);

        


        this.moveForce.multiplyScalar(this.drag);
        this.moveForce.clampLength(0, this.maxSpeed);

        magnitude = this.moveForce.length();


        this.v1.copy(this.moveForce).normalize().multiplyScalar(1);
        this.v2.copy(transform.forward).multiplyScalar(1);


        // Traction
        if(this.debug){
        	this.debuger.DrawRay(transform.position, this.v1, 'white');
            this.debuger.DrawRay(transform.position, this.v2, 'blue');
        }
        
        //this.debug.DrawRay(transform.position, transform.right, 'red');

        this.v1.copy(this.moveForce).normalize().lerp(transform.forward, this.traction*delta );

        this.moveForce.copy(this.v1).multiplyScalar(magnitude);

        this.side = this.moveForce.dot(transform.forward)>0?-1:1;

        this.updateWheels();
    
    }

}

const _offsetMatrix = new Matrix4();
const _identityMatrix = new Matrix4();
new Vector3();

let K = Skeleton.prototype;

K.byName = function ( name ) {

    let i = this.bones.length;
    while(i--) if( this.bones[i].name === name ) return this.bones[i]
    return null

};

K.getId = function ( name ) {

    let i = this.bones.length;
    while(i--) if( this.bones[i].name === name ) return i
    return null

};

K.setExtraRotation = function ( b, x, y, z ) {

    //this.pose()

    /*let name = b.isBone ? b.name : b
    let degtorad = MathUtils.DEG2RAD

    let bone = this.byName( name )
    if( !bone ) return

    let id = this.getId( name )
    let tt = new Matrix4().makeRotationFromEuler( {x:x*degtorad, y:y*degtorad, z:z*degtorad, order:'XYZ'});

    //bone.matrixWorld.multiply( tt );
    bone.matrix.multiply( tt );
    bone.matrixWorld.multiplyMatrices( bone.parent.matrixWorld, bone.matrix );
    bone.matrix.decompose( bone.position, bone.quaternion, bone.scale );
    //bone.updateMatrixWorld( true )

    //bone.updateWorldMatrix( true, true )

    let j = bone.children.length, child;
    while(j--){
        child = bone.children[ j ]
        child.matrixWorld.multiplyMatrices( bone.matrixWorld, child.matrix )
    }



    this.calculateInverses()*/
//this.pose()


    let bone = b.isBone ? b : this.byName( b );
    if( !bone ) return
    MathUtils.DEG2RAD;
    
    //bone.extraRotation = new Matrix4().makeRotationFromEuler( {x:x*degtorad, y:y*degtorad, z:z*degtorad, order:'XYZ'});
    //bone.extraRotation = new Quaternion().setFromEuler( {_x:x*degtorad, _y:y*degtorad, _z:z*degtorad, _order:'XYZ'}).invert();

    //this.applyScalling()

};

K.setScalling = function ( b, x, y, z ) {

    let bone = b.isBone ? b : this.byName( b );
    if( !bone ) return
    bone.scalling = new Vector3(x, y, z);

};

K.resetScalling = function (b) {

    this.pose();

    this.scalled = true;

    for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

        //this.bones[i].scalling = new Vector3(1,1,1);
        this.bones[i].isPhysics = false;
        this.bones[i].phyMtx = new Matrix4();

    }

    if(!b) this.applyScalling();

};

K.childScale = function ( bone, matrix ) {

    if( !this.scalled ) return

    //

    if( bone.scalling ) matrix.scale( bone.scalling );
    //if( bone.extraRotation ) matrix.multiply( bone.extraRotation );
    //if( !bone.isBone ) return

    //if(bone.name === 'head') console.log(bone.children.length)


    let j = bone.children.length, child, k=0;

    while(j--){

        child = bone.children[ k ];
        k++;

        if( child.isBone ) {
            child.matrixWorld.multiplyMatrices( matrix, child.matrix );
            
        } else {

            //child.matrixAutoUpdate = false;
            //child.applyMatrix4(matrix)
            //child.matrixWorldNeedsUpdate = false;
            child.matrixWorld.multiplyMatrices( matrix, child.matrix );
            //child.matrixWorldNeedsUpdate = true;

            //child.updateWorldMatrix(false,true)
            //child.updateWorldMatrix(true, true);
            //child.updateMatrixWorld(true);
            //child.updateMatrix()
            //child.updateWorldMatrix( false, true );

            // BUG WITH HAIR !!!
         //   child.matrixWorld.multiplyMatrices( matrix, child.matrix )
           // child.matrixWorld.multiplyMatrices( matrix, child.matrix )

            //child.updateWorldMatrix(false, true)
            //child.matrix = matrix.clone();
            //child.matrixWorld.premultiply( matrix.clone() )
           
        }

        
        //child.matrixAutoUpdate = true
        //if( child.matrixAutoUpdate ) child.matrixAutoUpdate = false
        //if( child.matrixWorldAutoUpdate ) child.matrixWorldAutoUpdate = false
        //child.matrixWorldNeedsUpdate = false;
        //child.matrixWorld.copy( child.matrix ).premultiply( matrix )

        //child.matrixWorld.copy( matrix ).multiply( child.matrix )
        


        //scaleMatrix = matrix.clone()
        //scaleMatrix.multiply( child.matrix )
        //child.matrixWorld.copy( scaleMatrix )

       // if( child.isBone ) 
            //child.matrix.premultiply(matrix)
            //child.matrixWorld.copy( child.matrix );
            
            ///child.matrixWorldNeedsUpdate = true;
        //child.matrix.premultiply(matrix)
        //child.matrixWorld.setPosition( _decal.setFromMatrixPosition( scaleMatrix ) );
        //child.matrixWorld.setPosition( _decal.setFromMatrixPosition( scaleMatrix ) );
        
    }

};

K.applyScalling = function ( fingerPos ) {

    let b, i, lng = this.bones.length;
    let parent;

    for ( i = 0; i < lng; i ++ ) {

        b = this.bones[ i ];
        parent = b.parent || null;

        if( parent !== null && parent.scalling && b.name!=='root' ){//

          //  if( parent.scalling ) 
            b.position.multiply( parent.scalling );
            //if(parent.extraRotation) b.quaternion.premultiply( parent.extraRotation );
            //b.updateWorldMatrix( false, true )
            b.updateMatrixWorld( true );

        }

    }

    this.calculateInverses();

};


K.update = function () {

    const bones = this.bones;
    const boneInverses = this.boneInverses;
    const boneMatrices = this.boneMatrices;
    const boneTexture = this.boneTexture;

    // flatten bone matrices to array

    let i = bones.length, bone, n=0;

    while( i-- ){

        bone = bones[ n ];

        // compute the offset between the current and the original transform
        //if(bone && bone.isPhysics) bone.matrixWorld.copy(bone.phyMtx)
        //const matrix = bone ? bone.matrixWorld : _identityMatrix;

        const matrix = bone ? ( bone.isPhysics ? bone.phyMtx : bone.matrixWorld ) : _identityMatrix;

        // no need but break dragon demo ??
        //if( bone.isPhysics ) this.scalled = true
        
        this.childScale( bone, matrix );

        _offsetMatrix.multiplyMatrices( matrix, boneInverses[ n ] );
        _offsetMatrix.toArray( boneMatrices, n * 16 );

        n++;

    }

    if ( boneTexture !== null ) {

        boneTexture.needsUpdate = true;

    }

};

const P={getColor(t){let e=t.toString();e=e.substring(e.lastIndexOf(".")+1);let i,a=[255,255,255];switch(e){case "grass":a=[.223,.827,.325],i=[.741,.498,.258];break;case "dirt":a=[.741,.498,.258];break;case "leaves":a=[.152,.682,.376];break;case "sand":a=[.878,.819,.686];break;case "ice":a=[.65,.882,.96];break;case "stone":a=[.537,.64,.65];break;case "cobblestone":a=[.666,.647,.588];break;case "wood":a=[.603,.321,.152];break;case "snow":a=[.905,.976,1];}return i?[a[0],a[1],a[2],i[0],i[1],i[2]]:[a[0],a[1],a[2]]},fire:{type:"star",numParticles:20,position:[0,0,0],colors:[1,1,0,0,1,1,0,1,1,0,0,1,1,0,0,1,1,0,0,.5,0,0,0,0],lifeTime:2,timeRange:2,startSize:.3,endSize:.9,velocity:[0,.8,0],velocityRange:[.15,.15,.15],gravity:[0,-0.2,0],spinSpeedRange:4},smoke:{position:[-2,-0.2,0],colors:[0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0],numParticles:20,lifeTime:2,timeRange:2,startSize:.5,endSize:2,velocity:[0,1.6,0],velocityRange:[.2,0,.2],gravity:[0,-0.25,0],spinSpeedRange:4,blending:"normal"},addBlock:{type:"cube",numParticles:30,lifeTime:1.5,endTime:1.5,startTime:0,startSize:.25,endSize:.5,sizeRange:.25,spinSpeedRange:2,radius:.25,velocity:[1,0,1],velocityRange:[.25,0,.25],acceleration:[1,0,1],accelerationRange:[.25,0,.25],gravity:[0,.05,0],tween:"outQuad",blending:"normal",alphaTest:.1},removeBlock:{type:"cube",lifeTime:1.5,endTime:1.5,startTime:0,startSize:.5,sizeRange:.25,endSize:.1,spinSpeedRange:2,accelerationRange:[.5,.5,.5],gravity:[0,-0.1,0],tween:"outQuad",blending:"normal",alphaTest:.1},explosion:{colors:[1,0,0,0,1,0,0,1,1,0,0,1,1,1,0,1,1,1,1,.5,1,1,1,0],type:"cloud",radius:.5,radiusRange:.5,numParticles:400,positionRange:[2,1,2],lifeTime:3,endTime:4,lifeTimeRange:1,startTime:0,startSize:.1,endSize:2,sizeRange:1,accelerationRange:[1,.3,1],acceleration:[.8,.8,.8],gravity:[0,-0.5,0],spinSpeedRange:2,luma:false},playerMove:{trail:true,colors:[1,1,1,1,.2,.2,.2,0],type:"round",blending:"normal",numParticles:4,maxParticles:1e3,positionRange:[.2,0,.2],lifeTime:1.5,startSize:.5,endSize:1,sizeRange:.25,velocityRange:[.6,0,.6],gravity:[0,.1,0]},vehicleMove:{trail:true,colors:[.5,.5,.5,.25,.2,.2,.2,0],type:"round",blending:"normal",numParticles:4,maxParticles:2e3,positionRange:[.25,0,.25],lifeTime:1.5,startSize:.5,endSize:1,sizeRange:.25,velocityRange:[.6,0,.6],gravity:[0,.2,0]},vehicleTrack:{trail:true,colors:[.2,.2,.2,.1,.2,.2,.2,0],type:"round2",blending:"normal",startSize:.3,endSize:.3,numParticles:4,maxParticles:2e3,position:[0,-0.1,0],lifeTime:6,oriented:true},underWater:{trail:true,colors:[1,1,1,1,.5,.5,1,0],type:"bubble",blending:"normal",numParticles:1,maxParticles:1e3,positionRange:[.25,0,.25],lifeTime:1.5,startSize:.1,endSize:.5,sizeRange:.05,velocity:[0,1,0],velocityRange:[1,0,1],acceleration:[.2,0,.2],gravity:[0,1,0]},bazookaFire:{trail:true,colors:[1,0,0,1,1,1,0,.5,1,1,1,0],type:"round",numParticles:2,maxParticles:600,positionRange:[.1,.1,.1],lifeTime:1.5,startSize:.5,endSize:1,sizeRange:.1,velocityRange:[.6,.6,.6],gravity:[0,.1,0],luma:false}},R=["pixel","basic","cube","cloud","round","round2","donut","bubble","smoke","circle","field","star","octo"];function C(){this.parent=null,this.position=[0,0,0],this.rotation=[0,0,0],this.name="default",this.type="round",this.tween="linear",this.trail=false,this.model="",this.numParticles=1,this.maxParticles=0,this.numFrames=1,this.frameDuration=1,this.frameStart=0,this.frameStartRange=0,this.timeRange=99999999,this.startTime=null,this.lifeTime=1,this.endTime=-1,this.lifeTimeRange=0,this.sizeRange=0,this.startSize=1,this.startSizeRange=0,this.endSize=1,this.endSizeRange=0,this.pposition=[0,0,0],this.positionRange=[0,0,0],this.velocity=[0,0,0],this.velocityRange=[0,0,0],this.acceleration=[0,0,0],this.accelerationRange=[0,0,0],this.spinStart=0,this.spinStartRange=0,this.spinSpeed=0,this.spinSpeedRange=0,this.colorMult=[1,1,1,1],this.colorMultRange=[0,0,0,0],this.worldVelocity=[0,0,0],this.gravity=[0,0,0],this.oriented=false,this.orientation=[0,0,0,1],this.colors=[1,1,1,1],this.blending="additive",this.radius=0,this.radiusPosition=false,this.axis="Y",this.radiusRange=0,this.tmpRotation=null,this.alphaTest=0,this.renderOrder=0,this.luma=true,this.depthWrite=false,this.transparent=true;}const M={torad:Math.PI/180,todeg:180/Math.PI,random:()=>Math.random(),rand:(t,e)=>t+M.random()*(e-t),randInt:(t,e)=>t+Math.floor(M.random()*(e-t+1)),plusMinus:t=>(M.random()-.5)*t*2,plusMinusVector:t=>{const e=[];let i=t.length;for(;i--;)e.push(M.plusMinus(t[i]));return e},toTexture:t=>{let e=new Texture(t);return e.minFilter=LinearFilter,e.magFilter=LinearFilter,e.flipY=false,e.colorSpace=SRGBColorSpace,e.needsUpdate=true,e},createTextureFromFloats:(a,n,r,o)=>{let s=null;if(null==o){const o=new Uint8Array(r.length);let l;for(let t=0;t<r.length;t++)l=255*r[t],o[t]=l;return s=new DataTexture(o,a,n,RGBAFormat),s.minFilter=LinearFilter,s.magFilter=LinearFilter,s.needsUpdate=true,s}return s=o,s}},B=function(t){let e;switch(t){case "linear":e="float tween( float k ) { return k; }";break;case "inQuad":e="float tween( float k ) { return k * k; }";break;case "outQuad":e="float tween( float k ) { return k * ( 2.0 - k ); }";break;case "inOutQuad":e="float tween( float k ) { \n\t\t\tif ( ( k *= 2.0 ) < 1.0 ) return 0.5 * k * k;\n            return - 0.5 * ( --k * ( k - 2.0 ) - 1.0 ); \n        }";break;case "inCubic":e="float tween( float k ) { return k * k * k; }";break;case "outCubic":e="float tween( float k ) { return --k * k * k + 1.0; }";break;case "inOutCubic":e="float tween( float k ) { \n\t\t\tif ( ( k *= 2.0 ) < 1.0 ) return 0.5 * k * k * k;\n\t\t\treturn 0.5 * ( ( k -= 2.0 ) * k * k + 2.0 ); \n        }";break;case "inQuart":e="float tween( float k ) { return k * k * k * k; }";break;case "outQuart":e="float tween( float k ) { return 1.0 - ( --k * k * k * k ); }";break;case "inOutQuart":e="float tween( float k ) { \n\t\t\tif ( ( k *= 2.0 ) < 1.0) return 0.5 * k * k * k * k;\n\t\t\treturn - 0.5 * ( ( k -= 2.0 ) * k * k * k - 2.0 ); \n        }";break;case "inQuint":e="float tween( float k ) { return k * k * k * k * k; }";break;case "outQuint":e="float tween( float k ) { return --k * k * k * k * k + 1.0; }";break;case "inOutQuint":e="float tween( float k ) { \n\t\t\tif ( ( k *= 2.0 ) < 1.0 ) return 0.5 * k * k * k * k * k;\n\t\t\treturn 0.5 * ( ( k -= 2.0 ) * k * k * k * k + 2.0 );\n        }";break;case "inSine":e="#define PI_90 1.570796326794896\n        float tween( float k ) { float j = k * PI_90; return 1.0 - cos( j ); }";break;case "outSine":e="#define PI_90 1.570796326794896\n\t\tfloat tween( float k ) { float j = k * PI_90; return sin( j ); }";break;case "inOutSine":e="#define M_PI 3.14159265358979323846\n\t\tfloat tween( float k ) { \n\t\t\tfloat j = k * M_PI; return 0.5 * (1.0-cos(j));\n        }";break;case "inExpo":e="float tween( float k ) { return k == 0.0 ? 0.0 : pow( 1024.0, k - 1.0 ); }";break;case "outExpo":e="float tween( float k ) { return k == 1.0 ? 1.0 : 1.0 - pow( 2.0, - 10.0 * k ); }";break;case "inOutExpo":e="float tween( float k ) { \n\t\t\tif ( k == 0.0 ) return 0.0;\n\t\t    if ( k == 1.0 ) return 1.0;\n\t\t    if ( ( k *= 2.0 ) < 1.0 ) return 0.5 * pow( 1024.0, k - 1.0 );\n\t\t    return 0.5 * ( - pow( 2.0, - 10.0 * ( k - 1.0 ) ) + 2.0 );\n        }";break;case "inCirc":e="float tween( float k ) { return 1.0 - sqrt( 1.0 - k * k ); }";break;case "outCirc":e="float tween( float k ) { return sqrt( 1.0 - ( --k * k ) ); }";break;case "inOutCirc":e="float tween( float k ) { \n\t\t\tif ( ( k *= 2.0 ) < 1.0) return - 0.5 * ( sqrt( 1.0 - k * k ) - 1.0 );\n\t\t\treturn 0.5 * ( sqrt( 1.0 - ( k -= 2.0 ) * k ) + 1.0 ); \n        }";break;case "inElastic":e="#define TWO_PI 6.28318530717958647692\n        float tween(float k) {\n\t\t    float s;\n\t\t    float a = 0.1;\n\t\t    float p = 0.4;\n\t\t    if ( k == 0.0 ) return 0.0;\n\t\t    if ( k == 1.0 ) return 1.0;\n\t\t    if ( a < 1.0 ) { a = 1.0; s = p * 0.25; }\n\t\t    else s = p * asin( 1.0 / a ) / TWO_PI;\n\t\t    return - ( a * pow( 2.0, 10.0 * ( k -= 1.0 ) ) * sin( ( k - s ) * TWO_PI / p ) );\n\t\t}";break;case "outElastic":e="#define TWO_PI 6.28318530717958647692\n\t\tfloat tween(float k) {\n\t\t    float s;\n\t\t    float a = 0.1; \n\t\t    float p = 0.4;\n\t\t    if ( k == 0.0 ) return 0.0;\n\t\t    if ( k == 1.0 ) return 1.0;\n\t\t    if ( a < 1.0 ) { a = 1.0; s = p * 0.25; }\n\t\t    else s = p * asin( 1.0 / a ) / TWO_PI;\n\t\t    return ( a * pow( 2.0, - 10.0 * k) * sin( ( k - s ) * TWO_PI / p ) + 1.0 );\n\t\t}";break;case "inOutElastic":e="#define TWO_PI 6.28318530717958647692\n\t\tfloat tween(float k) {\n\t\t    float s;\n\t\t    float a = 0.1;\n\t\t    float p = 0.4;\n\t\t    if ( k == 0.0 ) return 0.0;\n\t\t    if ( k == 1.0 ) return 1.0;\n\t\t    if ( a < 1.0 ) { a = 1.0; s = p * 0.25; }\n\t\t    else s = p * asin( 1.0 / a ) / TWO_PI;\n\t\t    if ( ( k *= 2.0 ) < 1.0 ) return - 0.5 * ( a * pow( 2.0, 10.0 * ( k -= 1.0 ) ) * sin( ( k - s ) * TWO_PI / p ) );\n\t\t    return a * pow( 2.0, -10.0 * ( k -= 1.0 ) ) * sin( ( k - s ) * TWO_PI / p ) * 0.5 + 1.0;\n\t\t}";break;case "inBack":e="float tween(float k) {\n\t\t    float s = 1.70158;\n\t\t    return k * k * ( ( s + 1.0 ) * k - s );\n\t\t}";break;case "outBack":e="float tween(float k) {\n\t\t    float s = 1.70158;\n\t\t    return --k * k * ( ( s + 1.0 ) * k + s ) + 1.0;\n\t\t}";break;case "inOutBack":e="float tween(float k) {\n\t\t    float s = 1.70158 * 1.525;\n\t\t    if ( ( k *= 2.0 ) < 1.0 ) return 0.5 * ( k * k * ( ( s + 1.0 ) * k - s ) );\n\t\t    return 0.5 * ( ( k -= 2.0 ) * k * ( ( s + 1.0 ) * k + s ) + 2.0 );\n\t\t}";break;case "inBounce":e="float outBounce(float k) {\n\t\t    if ( k < ( 1.0 / 2.75 ) ) return 7.5625 * k * k;\n\t\t    else if ( k < ( 2.0 / 2.75 ) ) return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;\n\t\t    else if ( k < ( 2.5 / 2.75 ) ) return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;\n\t\t    else return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;\n\t\t}\n\t\tfloat tween(float k) { return 1.0 - outBounce( 1.0 - k ); }";break;case "outBounce":e="float tween(float k) {\n\t\t    if ( k < ( 1.0 / 2.75 ) ) return 7.5625 * k * k;\n\t\t    else if ( k < ( 2.0 / 2.75 ) ) return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;\n\t\t    else if ( k < ( 2.5 / 2.75 ) ) return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;\n\t\t    else return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;\n\t\t}";break;case "inOutBounce":e="float outBounce(float k) {\n\t\t    if ( k < ( 1.0 / 2.75 ) ) return 7.5625 * k * k;\n\t\t    else if ( k < ( 2.0 / 2.75 ) ) return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;\n\t\t    else if ( k < ( 2.5 / 2.75 ) ) return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;\n\t\t    else return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;\n\t\t}\n\t\tfloat inBounce(float k) { return 1.0 - outBounce( 1.0 - k ); }\n\t\tfloat tween(float k) {\n\t\t    if ( k < 0.5 ) return inBounce( k * 2.0 ) * 0.5;\n\t\t    return outBounce( k * 2.0 - 1.0 ) * 0.5 + 0.5;\n\t\t}";}return e},E=[[-0.5,-0.5],[.5,-0.5],[.5,.5],[-0.5,.5]],I=28,O=new Float32Array(28);class F extends Points{constructor(t,e){super(),this.pe=t,this.count=0,this.color=null,this.texture=null,this.localTime=0,this.time=0,this.endTime=-1,this.num=0,this.matrixAutoUpdate=false,this.frustumCulled=e.frustum||false,this.receiveShadow=false,this.castShadow=false,this.birthIndex=0,this.luma=true,e&&this.setParameters(e);}setParameters(t){this.validateParameters(t),this.geometry&&this.geometry.dispose(),this.material&&this.material.dispose(),this.name=t.name,this.isTrail=t.trail||false,this.parameters=t;const e=this.isTrail?t.maxParticles:t.numParticles;this.allocateParticles_(e,t),this.isTrail||this.createParticles_(0,e,t),t.parent?t.parent.add(this):this.pe.scene?this.pe.scene.add(this):this.pe.add(this);}makeGeometry(t){this.geometry=t.oriented?new InstancedBufferGeometry:new BufferGeometry,this.isMesh=t.oriented;}setColorRamp(t){const e=t.length/4;if(e%1!=0)throw "colorRamp must have multiple of 4 entries";this.color=M.createTextureFromFloats(e,1,t);}validateParameters(t){var e=new C;for(let i in t)if(void 0===e[i])throw 'unknown particle parameter "'+i+'"';for(let i in e) void 0===t[i]&&(t[i]=e[i]);}perParticle(t,e){}birthParticles(t,e){var i=this.parameters.numParticles;this.parameters.pposition=t,this.parameters.startTime=this.time,this.endTime=this.time+this.parameters.lifeTime,e&&this.setColorRamp(e),this.createParticles_(this.birthIndex,i,this.parameters),this.birthIndex+=i,this.birthIndex+i>=this.parameters.maxParticles&&(this.birthIndex=0);}createParticles_(t,e,i){const a=M.plusMinus,n=M.plusMinusVector,r=this.interleavedBuffer.array;let o,s=e;for(;s--;){this.perParticle(s,i);let m=i.lifeTime+a(i.lifeTimeRange),f=null===i.startTime?s*i.lifeTime/e:i.startTime,h=i.frameStart+a(i.frameStartRange),p=(new Vector3).addVectors((new Vector3).fromArray(i.pposition),(new Vector3).fromArray(n(i.positionRange))),g=(new Vector3).addVectors((new Vector3).fromArray(i.velocity),(new Vector3).fromArray(n(i.velocityRange))),k=(new Vector3).addVectors((new Vector3).fromArray(i.acceleration),(new Vector3).fromArray(n(i.accelerationRange))),v=(new Vector4).addVectors((new Vector4).fromArray(i.colorMult),(new Vector4).fromArray(n(i.colorMultRange))),y=i.spinStart+a(i.spinStartRange),w=i.spinSpeed+a(i.spinSpeedRange),b=i.startSize+a(i.sizeRange||i.startSizeRange),S=i.endSize+a(i.sizeRange||i.endSizeRange),x=(new Vector4).fromArray(i.orientation);if(i.positionRange[0],i.positionRange[1],i.positionRange[2],i.radius){let t=i.axis||"Y",e=M.rand(0,2*Math.PI);i.tmpRotation=[90,-e*M.todeg,90,"YXZ"];let n=i.radius+a(i.radiusRange),r=Math.cos(e),o=Math.sin(e),s=new Vector3;switch(t){case "X":s.y=r,s.z=o;break;case "Y":s.x=r,s.z=o;break;case "Z":s.x=r,s.y=o;}switch(s.multiplyScalar(n),i.radiusPosition&&p.add(s),t){case "X":s.x=1;break;case "Y":s.y=1;break;case "Z":s.z=1;}k.multiply(s),g.multiply(s);}i.tmpRotation&&(x=(new Quaternion$1).setFromEuler(new Euler(i.tmpRotation[0]*M.torad,i.tmpRotation[1]*M.torad,i.tmpRotation[2]*M.torad,i.tmpRotation[3])));o=0+s*I*4+t*I*4,r[0+o]=p.x,r[0+o+1]=p.y,r[0+o+2]=p.z,r[0+o+3]=f,r[4+o]=E[0][0],r[4+o+1]=E[0][1],r[4+o+2]=m,r[4+o+3]=h,r[8+o]=g.x,r[8+o+1]=g.y,r[8+o+2]=g.z,r[8+o+3]=b,r[12+o]=k.x,r[12+o+1]=k.y,r[12+o+2]=k.z,r[12+o+3]=S,r[16+o]=y,r[16+o+1]=w,r[16+o+2]=0,r[16+o+3]=0,r[20+o]=x.x,r[20+o+1]=x.y,r[20+o+2]=x.z,r[20+o+3]=x.w,r[24+o]=v.x,r[24+o+1]=v.y,r[24+o+2]=v.z,r[24+o+3]=v.w;}this.interleavedBuffer.needsUpdate=true,this.material.uniforms.worldVelocity.value.fromArray(i.worldVelocity),this.material.uniforms.gravity.value.fromArray(i.gravity),this.material.uniforms.timeRange.value=i.timeRange,this.material.uniforms.frameDuration.value=i.frameDuration,this.material.uniforms.numFrames.value=i.numFrames,this.material.uniforms.rampSampler.value=this.color,this.material.uniforms.colorSampler.value=this.texture,this.material.blending="normal"===i.blending?NormalBlending:AdditiveBlending,this.updateMatrix();}allocateParticles_(t,e){if(this.count!==t){if(e.oriented||(e.oriented=false),e.position&&this.position.fromArray(e.position),e.rotation&&this.quaternion.setFromEuler(new Euler(e.rotation[0]*M.torad,e.rotation[1]*M.torad,e.rotation[2]*M.torad)),this.setColorRamp(e.colors),this.pe.textures.has(e.type)||-1!==R.indexOf(e.type)&&this.pe.textures.make(e.type),this.texture=this.pe.textures.get(e.type),this.texture||console.log("this texture is undefined !!"),this.endTime=e.endTime||-1,this.luma=e.luma,this.makeGeometry(e),this.count=t,e.oriented){var i=new InterleavedBuffer(new Float32Array([0,0,0,0,-0.5,-0.5,0,0,0,0,0,0,.5,-0.5,0,0,0,0,0,0,.5,.5,0,0,0,0,0,0,-0.5,.5,0,0]),8);this.geometry.setAttribute("position",new InterleavedBufferAttribute(i,3,0)),this.geometry.setAttribute("uv",new InterleavedBufferAttribute(i,2,4)),this.geometry.setIndex(new BufferAttribute(new Uint16Array([0,1,2,0,2,3]),1)),this.interleavedBuffer=new InstancedInterleavedBuffer(new Float32Array(t*O.byteLength),I,1).setUsage(DynamicDrawUsage);}else this.interleavedBuffer=new InterleavedBuffer(new Float32Array(t*O.byteLength),I).setUsage(DynamicDrawUsage);this.geometry.setAttribute("position",new InterleavedBufferAttribute(this.interleavedBuffer,3,0)),this.geometry.setAttribute("startTime",new InterleavedBufferAttribute(this.interleavedBuffer,1,3)),this.geometry.setAttribute("uvLifeTimeFrameStart",new InterleavedBufferAttribute(this.interleavedBuffer,4,4)),this.geometry.setAttribute("velocityStartSize",new InterleavedBufferAttribute(this.interleavedBuffer,4,8)),this.geometry.setAttribute("accelerationEndSize",new InterleavedBufferAttribute(this.interleavedBuffer,4,12)),this.geometry.setAttribute("spinStartSpinSpeed",new InterleavedBufferAttribute(this.interleavedBuffer,4,16)),this.geometry.setAttribute("orientation",new InterleavedBufferAttribute(this.interleavedBuffer,4,20)),this.geometry.setAttribute("colorMult",new InterleavedBufferAttribute(this.interleavedBuffer,4,24)),this.geometry.boundingSphere=new Sphere,this.geometry.boundingSphere.radius=3;let n=AdditiveBlending;switch(e.blending){case "sub":case "subtractive":n=SubtractiveBlending;break;case "multi":case "multiply":n=MultiplyBlending;break;case "normal":n=NormalBlending;break;default:n=AdditiveBlending;}var a={worldVelocity:{value:new Vector3},gravity:{value:new Vector3},timeRange:{value:0},time:{value:0},timeOffset:{value:0},frameDuration:{value:0},numFrames:{value:0},rampSampler:{value:null},colorSampler:{value:null},scale:{value:.5*window.innerHeight},luma:{value:this.luma?this.pe.luminosity:1},alphaTest:{value:e.alphaTest}};this.material=new ShaderMaterial({defines:{USE_ORIENTATION:e.oriented},uniforms:a,vertexShader:B(e.tween||"linear")+"\nprecision mediump float;\nprecision mediump int;\n\n#ifdef USE_ORIENTATION\n\t//uniform mat4 worldViewProjection;\n\t//uniform mat4 world;\n\tattribute vec3 offset;\n\tattribute vec4 orientation;\n#else\n    uniform float scale;\n#endif\n\nuniform vec3 worldVelocity;\nuniform vec3 gravity;\nuniform float timeRange;\nuniform float time;\nuniform float timeOffset;\nuniform float frameDuration;\nuniform float numFrames;\n\nattribute vec4 uvLifeTimeFrameStart;\nattribute float startTime;\nattribute vec4 velocityStartSize;\nattribute vec4 accelerationEndSize;\nattribute vec4 spinStartSpinSpeed;\nattribute vec4 colorMult;\n\nvarying vec2 outputTexcoord;\nvarying float outputPercentLife;\nvarying vec4 outputColorMult;\nvarying mat2 rotationMtx;\n\n#include <fog_pars_vertex>\n#include <logdepthbuf_pars_vertex>\n//#include <clipping_planes_pars_vertex>\n\nvec3 lerp( vec3 a, vec3 b, float p ){ return a + (b - a) * p; }\n\nvoid main() \n{\n    float lifeTime = uvLifeTimeFrameStart.z;\n    float frameStart = uvLifeTimeFrameStart.w;\n    float startSize = velocityStartSize.w;\n\n    //vec3 velocity = (modelMatrix * vec4(velocityStartSize.xyz, 0.0)).xyz + worldVelocity;\n\t//vec3 acceleration = (modelMatrix * vec4(accelerationEndSize.xyz, 0.0)).xyz + gravity;\n\n    //vec3 velocity = velocityStartSize.xyz + worldVelocity;\n\t//vec3 acceleration = accelerationEndSize.xyz + gravity;\n\n\tvec3 velocity = velocityStartSize.xyz + (inverse(modelMatrix) * vec4(worldVelocity, 0.0)).xyz;\n\tvec3 acceleration = accelerationEndSize.xyz + (inverse(modelMatrix) * vec4(gravity, 0.0)).xyz;\n\n    float endSize = accelerationEndSize.w;\n    float spinStart = spinStartSpinSpeed.x;\n    float spinSpeed = spinStartSpinSpeed.y;\n\n    float localTime = mod((time - timeOffset - startTime), timeRange);\n    //localTime = tween( localTime );\n    float percentLife = localTime / lifeTime;\n    percentLife = tween( percentLife );\n\n    vec3 posEnd = velocity * lifeTime + acceleration * lifeTime * lifeTime;\n\n    float frame = mod(floor(localTime / frameDuration + frameStart), numFrames);\n    float uOffset = frame / numFrames;\n    float u = uOffset + (uv.x + 0.5) * (1. / numFrames);\n\n    outputTexcoord = vec2(u, uv.y + 0.5);\n    outputColorMult = colorMult;\n\n    float size = mix(startSize, endSize, percentLife);\n\tsize = (percentLife < 0. || percentLife > 1.0) ? 0.0 : size;\n\n\tfloat s = sin(spinStart + spinSpeed * localTime);\n\tfloat c = cos(spinStart + spinSpeed * localTime);\n\n    #ifdef USE_ORIENTATION\n\t\t\n\t\tvec4 rotatedPoint = vec4((uv.x * c + uv.y * s) * size, 0., (uv.x * s - uv.y * c) * size, 1.);\n\t\t//vec3 center = velocity * localTime + acceleration * localTime * localTime + position + offset;\n\t\tvec3 center = (posEnd * percentLife) + position + offset;\n\n\t\tvec4 q2 = orientation + orientation;\n\t\tvec4 qx = orientation.xxxw * q2.xyzx;\n\t\tvec4 qy = orientation.xyyw * q2.xyzy;\n\t\tvec4 qz = orientation.xxzw * q2.xxzz;\n\n\t\tmat4 localMatrix = mat4(\n\t\t    (1.0 - qy.y) - qz.z,  qx.y + qz.w,  qx.z - qy.w, 0,\n\t\t    qx.y - qz.w, (1.0 - qx.x) - qz.z, qy.z + qx.w, 0,\n\t\t    qx.z + qy.w, qy.z - qx.w, (1.0 - qx.x) - qy.y, 0,\n\t\t    center.x, center.y, center.z, 1\n\t\t);\n\t\trotatedPoint = localMatrix * rotatedPoint;\n\t\tgl_Position = projectionMatrix * modelViewMatrix * rotatedPoint;\n\n\t#else\n\n\t    //vec3 pos = position + velocity * localTime + acceleration * localTime * localTime;\n\n\t    vec3 pos = (posEnd * percentLife) + position;\n\t    \n\t    vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );\n        //gl_PointSize = size * 1.5 * ( scale / length( mvPosition.xyz ) );\n        gl_PointSize = size * 1.5 * ( scale / - mvPosition.z );\n\n        mat2 r = mat2( c, -s, s, c);\n        r *= 0.5; r += 0.5;  r = r * 2.0 - 1.0;\n        rotationMtx = r;\n\n        gl_Position = projectionMatrix * mvPosition;\n\n\t#endif\n\n\toutputPercentLife = percentLife;\n\n\t#include <logdepthbuf_vertex>\n\t//#include <clipping_planes_vertex>\n\t#include <fog_vertex>\n}\n",fragmentShader:"\nprecision mediump float;\nprecision mediump int;\n\nuniform sampler2D rampSampler;\nuniform sampler2D colorSampler;\nuniform float luma;\nuniform float alphaTest;\n\nvarying vec2 outputTexcoord;\nvarying float outputPercentLife;\nvarying vec4 outputColorMult;\nvarying mat2 rotationMtx;\n\n#include <fog_pars_fragment>\n#include <logdepthbuf_pars_fragment>\n//#include <clipping_planes_pars_fragment>\n\nvoid main() {\n\n\t//#include <clipping_planes_fragment>\n\t#include <logdepthbuf_fragment>\n\n\tvec4 diffuseColor = texture2D( rampSampler, vec2(outputPercentLife, 0.5) ) * outputColorMult;\n\n    vec2 uv = vec2(0.0);\n    #ifdef USE_ORIENTATION\n        uv = outputTexcoord;\n\t#else\n\t    uv = gl_PointCoord;\n\t    uv -= 0.5; uv = uv * rotationMtx; uv += 0.5;\n\t#endif\n\n\t// texture\n\tdiffuseColor *= texture2D( colorSampler, uv );\n\n\tif ( diffuseColor.a < alphaTest ) discard;\n\n\tdiffuseColor.rgb *= luma;\n\n\tgl_FragColor = diffuseColor; \n\t#include <fog_fragment>\n\n}\n",side:e.oriented?DoubleSide:FrontSide,blending:n,depthTest:true,depthWrite:e.depthWrite,transparent:e.transparent,forceSinglePass:e.single||false,fog:e.fog||false}),this.renderOrder=e.renderOrder||0;}}draw(t=0){if(!this.material.uniforms)return;const e=this.material.uniforms;this.time+=this.pe.delta,e.time.value=this.time,e.timeOffset.value=t,e.scale.value=this.pe.hscale,e.luma.value=this.luma?this.pe.luminosity:1,-1!==this.endTime&&this.time>=this.endTime&&this.pe.remove(this.name);}dispose(){this.parent.remove(this),this.geometry.dispose(),this.material.dispose(),this.color.dispose();}raycast(){}clone(t){return void 0===t&&(t=this.pe.createEmitter(this.texture)),t.time=0,t.endTime=this.endTime,t.geometry=this.geometry,t.material=this.material.clone(),t.material.uniforms.rampSampler.value=this.color,t.material.uniforms.colorSampler.value=this.texture,super.copy(t),this.num++,t.name=this.name+this.num,t}}class q extends Map{constructor(){super();}dispose(){this.forEach((t=>{t.dispose();})),this.clear();}add(t,e){this.has(t)||this.set(t,e);}make(t){if(!this.has(t)){let e=this["make"+t[0].toUpperCase()+t.substring(1)]();this.set(t,e);}}makePixel(){const t=[];for(let e=0;e<2;++e)for(let e=0;e<2;++e)t.push(1,1,1,1);return M.createTextureFromFloats(2,2,t)}makeBasic(){const t=[0,.2,.7,1,.7,.2,0,0],e=[];for(let i=0;i<8;++i)for(let a=0;a<8;++a){let n=t[a]*t[i];e.push(n,n,n,1);}return M.createTextureFromFloats(8,8,e)}makeCube(){let t=document.createElement("canvas");t.width=t.height=8;const e=t.getContext("2d");return e.fillStyle="rgba(255,255,255,1.0)",e.fillRect(2,2,4,4),M.toTexture(t)}makeCloud(){let t=16,e=document.createElement("canvas");e.width=e.height=t;const i=e.getContext("2d");let a="rgba(255,255,255,1)",n="rgba(255,255,255,0)",r=i.createRadialGradient(8,6.4,0,8,6.4,6.4);return r.addColorStop(.3,a),r.addColorStop(1,n),i.fillStyle=r,i.fillRect(0,0,t,t),r=i.createRadialGradient(6.4,9.92,0,6.4,9.92,5.6),r.addColorStop(.3,a),r.addColorStop(1,n),i.fillStyle=r,i.fillRect(0,0,t,t),r=i.createRadialGradient(4.32,6.4,0,4.32,6.4,4.16),r.addColorStop(.2,a),r.addColorStop(1,n),i.fillStyle=r,i.fillRect(0,0,t,t),r=i.createRadialGradient(12.16,9.6,0,12.16,9.6,3.68),r.addColorStop(.2,a),r.addColorStop(1,n),i.fillStyle=r,i.fillRect(0,0,t,t),M.toTexture(e)}makeRound(){let t=16,e=document.createElement("canvas");e.width=e.height=t;const i=e.getContext("2d"),a=i.createRadialGradient(8,8,0,8,8,8);return a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.3,"rgba(255,255,255,0.1)"),a.addColorStop(.9,"rgba(255,255,255,0)"),a.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=a,i.fillRect(0,0,t,t),M.toTexture(e)}makeRound2(){let t=16,e=document.createElement("canvas");e.width=e.height=t;const i=e.getContext("2d"),a=i.createRadialGradient(8,8,0,8,8,8);return a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.9,"rgba(255,255,255,1)"),a.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=a,i.fillRect(0,0,t,t),M.toTexture(e)}makeDonut(){let t=32,e=document.createElement("canvas");e.width=e.height=t;const i=e.getContext("2d"),a=i.createRadialGradient(16,16,0,16,16,16);return a.addColorStop(0,"rgba(255,255,255,1)"),a.addColorStop(.9,"rgba(255,255,255,0.1)"),a.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=a,i.beginPath(),i.arc(16,16,16,0,2*Math.PI,false),i.arc(16,16,8,0,2*Math.PI,true),i.fill(),M.toTexture(e)}makeBubble(){let t=64,e=document.createElement("canvas");e.width=e.height=t;let i="rgba(0,255,255,0)";const a=e.getContext("2d"),n=a.createRadialGradient(25.6,25.6,0,32,32,32);return n.addColorStop(.4,i),n.addColorStop(.9,"rgba(0,255,255,0.6)"),n.addColorStop(.99,"rgba(0,255,255,1)"),n.addColorStop(1,i),a.fillStyle=n,a.fillRect(0,0,t,t),a.fillStyle="rgba(255,255,255,1)",a.beginPath(),a.arc(44.8,25.6,8.96,0,2*Math.PI,false),a.fill(),a.beginPath(),a.arc(12.8,41.6,3.2,0,2*Math.PI,false),a.fill(),M.toTexture(e)}makeSmoke(){let t=document.createElement("canvas");t.width=t.height=64;const e=t.getContext("2d");let i=new Image;i.src=D;let a=M.toTexture(t);return i.onload=function(){e.drawImage(i,0,0),a.needsUpdate=true;},a}makeCircle(){let t=document.createElement("canvas");t.width=t.height=64;const e=t.getContext("2d");return e.strokeStyle="white",e.lineWidth=4,e.beginPath(),e.arc(32,32,30,0,2*Math.PI),e.stroke(),M.toTexture(t)}makeField(){let t=64,e=document.createElement("canvas");e.width=e.height=t;const i=e.getContext("2d"),a=i.createLinearGradient(0,0,0,t);return a.addColorStop(0,"rgba(255,255,255,0)"),a.addColorStop(.8,"rgba(255,255,255,0.4)"),a.addColorStop(1,"rgba(255,255,255,0)"),i.fillStyle=a,i.fillRect(24,0,16,t),M.toTexture(e)}makeStar(){let t=64,e=document.createElement("canvas");e.width=e.height=t;const i=e.getContext("2d"),a=i.createRadialGradient(32,32,0,32,32,32);return a.addColorStop(0,"rgba(255,255,255,0.5)"),a.addColorStop(.5,"rgba(255,255,255,0.1)"),a.addColorStop(.9,"rgba(255,255,255,0)"),i.fillStyle=a,this.star(i,32,6.4,32,32,3),this.star(i,32,25.6,32,32,3),M.toTexture(e)}makeOcto(){let t=64,e=document.createElement("canvas");e.width=e.height=t;const i=e.getContext("2d"),a=i.createRadialGradient(32,32,0,32,32,32);return a.addColorStop(.4,"rgba(255,255,255,0.2)"),a.addColorStop(1,"rgba(255,255,255,0.4)"),i.fillStyle=a,this.star(i,25.6,22.4,32,32,6),i.strokeStyle="rgba(255,255,255,0.1)",i.lineWidth=6,i.stroke(),M.toTexture(e)}star(t,e,i,a,n,r){let o,s,l;t.beginPath(),t.moveTo(a+e,n);for(var c=1;c<=2*r;c++)c%2==0?(l=c*(2*Math.PI)/(2*r),o=a+e*Math.cos(l),s=n+e*Math.sin(l)):(l=c*(2*Math.PI)/(2*r),o=a+i*Math.cos(l),s=n+i*Math.sin(l)),t.lineTo(o,s);t.closePath(),t.fill();}}const D="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAPOklEQVR42rWb224dRRaGq\n7r30Tu2Y5MhmYsZRZqbeahBiCvgPnCBOCeAEEjcI/E2vAfiYqJJgIHE2/Y+Vk2tzf9Ji2XZDsmkpeXu3V1dXf9f61Sr2316wa3Wmj/++GO\nTrkkvSTo3aDKUdB999JHJoMlEYud72tk13ce53kmmX5PWNr///vvpgw8+yPfv30+llPzee+917Xd68ODBM4+/f1HwbYd04XhgouNqx3re0\nF3rc85DtUntmK6zk7G11XHh0fZns9nk1WqVjYR23J2ennZtn7788sv6UgkA/Hq97mzwbevbbwMzEMBJGPj290HnDrC2qe3IzrV7N2oXSR2\nZ2PN4dNbW972JjSOfnJx0o9EoDwaD+sUXX7w8Ah4+fJgbw7nWCphRztnkDzMr0Wwx8ISWVNvTXrNv14xI7u+4LmLpE82xbcd+A50nk0kdj\n8fJCHnzzTfTN998U18KAW+88UY+OjoypjsNdtTGMLQJYXYBDUjTjqC+nYD1XtVbu7Ht23lIsfPW936TiZ0HOP3YRLTNNKG2LW2aVp6dnqZ\n/vfZa/fbbb//vBJiDMcbtgTv71aDs2IMvkl4AbKDJ9tZW94w0k0nmcsOO7bp+j0TErO1nOgeRmIqZQ3UkNlOYp58eP0qL5bJ+99139YUJ+\nP77702l8ttvv51ff/31bjab5f39/a7h3wFv7GP7nfMPqC8qW5htAd8ToKTr+9pXAZ+atH72pCkFMtVmg48Ag55Rt9tt3pRSbx4epPv3H+T\nPP/+8mrP89NNPn48AA95sKw+Hw7xcLvPh4WG3t7eXmhb0+AER4L3/UOKdYFbbPQOs6xknh1MUMfQ71bkiDaO/KvFRZrsD1Hf1xmy2PTy8m\nc0pWli07cMPP4SEP0fAu+++m9ssAz5Pp1MzAXuone+c+mcAAEr9V+0xh5ns3druOe0ZVbv++zERoUdbpOreufZ6Bu1LbVsjoLTxFXtuKaV\nmF1v/NAE//PCDObtk4J8+fZru3LnTNfXPTc0MuBExMBNgxph5+YbeacN0Z+8pT2qqaIYBu6H7JtYmy/tLcJY7LfBaBpkci6zN76aSa3DC6\nbkJuHfvns18Oj8/z/P5PN29e7c3AizWNsmEJ0DrgcwMmnBDx5yHgJGAkzNwL2qfaEN/zvvzLHwBJlDYk1hJc5KN+Zl9wOPHj/Nbb72VF4t\nFMqfSJN26das7Pj7uBDzLAe5mzhwbaqvBzQAmQBBVNPO3mhziH3R96tp2uncm4N6nmPbZPWvA4hjdcRZwSLDUOX3yySfPRsBXX31l6tKSi\n3GaTmfN9g924Jsz9NmeATcbTnr4K03+0eS2AwEJaEMS+L/p2mmTousHTY5s77z/EBIEHFNgNrdEADcBbBXnye9nIoDts88+a1502Lz/yLx\n+3zIt4rl1aLO/51TxZpN/Nvm7wJ+LfYvtM9vL8++3xsf2WwNeYCYCuqd8YExYM6J1viOlJqSi8oRT38Y0BALIqdCCawkwtd85+G4X5bu+R\nX2lqR2q6LzrRMDvaqbO9PChG3wvMzlq+4NUKzNETnCg/ZA0mO51Du1Z2vBEAODxA7TBNOgju8VWtRUlJFxKQGtkM52hAG+q2TQQE2K+4vq\nrTf5CMqP9mFlxWeG+zW7F4THrzjG6sBjziixwC5PWbi3wtIWMVZOiBZT1h6ZU7a8mwICLva4dDGgjsH9tcstASI2P5KTMBI6lytPWybQaM\nFskaXZqO6e21nfVnri+lmrPlBsAyGSsxVYncGcysRVpsPcBkmrgyTad06xXEQD4rIXHrB0NmzCbNpA7Lvk4tt8Cf2gDx4sbcFP1LIIEaso\nCiDiv2L0SiIna9HZeA06ocq311EzA5RhbgTtX25Eky/aL4WlixxtpzPZSAnTB1H/MzMrmqmb9WECxa0LdDQjQAAa0IaZr1WbgR5yzKZKNk\nvtjCpgb8R1Vt/b4lTFaAilyxGM0Aa2wRZj8BqZxrQbsCViV0Pmr2ncCfSwSpiQ72DGgdT+eewx4BxBCmHnsH8FubdYP3RpiWWs9MVDSwCM\nIwDnqEUVttiKhxHDYB/CEExzPvpzbEbMPYInXhJ4Bh7oAMvAAQ2aIWbB1FD1Ybvt1hsBh0zM3tuzMp9CuyVIkFJMLBAC+2kSlDAl7YvUVN\n8PTkOWh5iP6Ql19Dc9XiaKHD+cK99LepcUrSYdPCmk096+UYJ0T1Ru+FVHjAgEsFSlJ5STV1AMkexJ+Q8bEgc8BTGJgYZZzJILjIPSJhi7\nl+akTohFDgV4TCgV+ASHyE7oeCCilsKQdNfDYsLdjzmGnFD1nzM4ldT7AebBe2OL5DgE7lR9MwfVXQypcHQlryZmZAATJB3Bf2tXbvXfFk\nzuwPmxBCFrRexAcR3XHriPweG/Yxy0z44B3oFJIhM4VwRYco/4mfyCg5ceoPwMO+zBoPDkq6BxbsN84o33s6wrANYIPYwF8hQyBXDkS5k1\nOjASIwkmTDnsC6DiWtHyUsGMywL1QAq9h9qNtR9WOYCIZRJN4Lap4If/HSZIuC/wTaQAEEA53aYiREDVggODdA7CZZXgu6ekYBGEngI4zG\nDeARo2IfiX5NNcdF8BpjwN8auC1xxkWHwW8BpD7Q0DvvHzPAJWCjmuq45zyGPWP6oq6M2gGGK6zlUsIyvE8M49msAc4CRAE1Fqf5Jznvk5\nwqQ/ggVRecTaAQTt8FMiJWj0DdKrvPLPi8JaiZvDg0TzYIhGAAwzgVxYeqf6wWML+2/kzTxraEwnABdgegIPg8SeszRvwvSb7So6IGBlwJ\ngK9Id3lAdFEop+4wkQAsXZkFmxeE7cR+FMtnObtvHOA9HExDCZMAEAhvFGYzJSuAE97rwXMmDAPfJv4yuwa71/DbBdWeZw3Mpg5A0rI08J\nnIQJ8kkQekDwBdnN0gjGx6STEf9oQCuNM9aFymzwBPO8a8EiJ4RIwqikMCH0ihcRpHULjBkyEQQiICYm30S4scGKGiCNMHrykwjj9egn91\n0tUv9qmWS/BZIonR9qw1OJnFRKgKnJKLIr0qgF4Aipg48tIVn+sA3CWGsAaH8IAQRM0KZKcaQRoSKgURoPTJLp4AjTjC6W+Oz8gItZMhpb\nHjgCpobSADVUfQgDnRcC+r+UxKzg8SQ5ZYQxxSNyKN4EMQHfORwQJx+da+xdMgCTIRw9INudv0sMGzpAECNaoBKtcFatBgMtBa6JfAVy0/\nwg67itLdaq6zt6XIc9Y6Fqv945FYZC2tKd/+7iiMhBIGJHrMzAqv8w8xRDqf0HVAZwlHPs4nJ2UeC2S4AlWZCHZWVzTZ5YJzBUeF/5ZBn4\n34FgOJw9A3GupiSovN0XGOFaBorML4FNMlIJEP1QFIprLhvhOe2npxNoqAXqiPs0kfm3X5+3KihenmL1JJCChyiEhwr4PAR8iBGSi/hFIu\nSZFjibC7EftoJK8dZ4dM4QYy/9/bccmv7XrLIm3XrtUbquxKlwbCdF2s3/1Hew8xvUcB891hOtIyPUJo7H/qBXYvG0DJT0PDbgRq7XATyy\nHCYUCbR0U8EJA1AJf0CgskTnHbwZ+hbevkflos5yL/dA+fB5nUlj+4tQE/D/SgCxCfpPtky1Gjaq75XD44tNXbgEQzSIukhJZWIjTyautB\nx8JiWbCfQKdEPry1R/z9E2eKuxx75oQKNL88hlJEADLvQMY1Tb7zC/k6RsHehVUGm3iOM58zBTZs3kNKgrLBXtX9Zd8vwJOoTApDK5jvRB\nt8olQVD1fDI3LYcBWsXzC93p6TcXD1hKWwcEfsOFf4nlAx3UGROeleXa3Cly68hd+jklZ+fsBHwngZFT5HgEYbXR8oj2VJexzKYJKzBdi3\nVHiNSQ60Q0AciYRspw/VcX5X/S8gZ4/17qAfs/1bsC/GYoEsF0sZjIb0aGFslTiCzBXmKiE05jxcR67DoAhwKktYZM3PQkT+K9kqDCdjBA\n5wY1ejvpMMPsPJXwqnAP4dEkeTgaI7fGd0MS9UCnGOKRAABJtPPgTzKtwLhCNZhnAx9qva7U6RZ3hH3SPOce5osJWDlFZoNOAK7Qggu/8C\nlBveW8oC6vKyLZ8RNUEMr3jZPMLGsBCRqWqJEDVacpCBc9fZX4qe9WO+3DoAv4katgFEwgLouioiMdJlTMADUO1J5KWib2Q6olgJgHgica\nBatY8YWu1/012fyo175y/8vn/mUUCCiWMg3+8cHlAICFUZtbrddJXoYWZ452/V2m7jr36d3GQo2tLvvKgYhPMASe6DuaysEovs45NKzWfE\nqIF/t9NfpYjJOwl7XdcXFgMeVOIBJydnSX77lY328CQWAcE4EbHzCzhaIEAIBQsmf1YzFyR4wsgaj4LobrIPB5ZUcSFQsBnbwYNF4uhK7T\nAenv0KLUvRJWKJr684CMEPl4sOL743Q7FCcJjfI3Fbw8Y4VU3ak07/JEnEfWXFLROmkl9IZVS7DtI+xTw0q/EsoGFiB9//DG1DyVT3/fVv\nSgZmWgg5Og4RpPs1G/DQH3CErw64NAA2s0hA63w4ZE+Q4EEKe5bwYrqG/jgBC9qgTeH27dvJ3VQmtqU4XDYt474jLWYkHqhjuTvfBjFmgF\nNCCqPFgAe/xBJAnwN959KqGgV/c5kmTjya78TjERgEsbccrWqv/z8c9o/OBjq32SSr7pCArNuh/xGRRXa8DPk9ZjAGWCYccwgRIu42oTA5\nN8UY4oQR0SxRMjVBNmuJ8Js5uuvv+7MFHwMj6s5acWaNl6FfbE01PgXCm9zpyVr7B+zCNEBcMUVY88k29A+VqbytRpwlXmEjxJZb7Px1ma\ntGUaVS9Zmx4EcoodpyRqtQGhLP8Gn4PBYB5yiBY6guNXnIgCTkJOsLv4jqOaaj5NM9LuSHOWUlyEk4jCLTMXab3B8OFIvgPR+QhKrwHGro\nSr8fFoAGd4HsF7Hthk49opG4OVjfZ/j0rZt2+y4DbSgVSEZox/fnzO9izMPcDAEAp6LDDSBZMMGvml+gvjrFzokS+uUk2lHVOfdrJO2bjY\n6NFEmJxIgwAvA/TMrYL2wQcALb1ETmDGfpDDzDPaSLLAivMtbrVZpcX6+y0G6JlnpbAAaS14cAzhsgYCXQAL7uK4v7C8T8gpy9fl8npeNh\nJZ71L7ryUYhwUsKx+T7L5WASAJSEUjBWfK7bQCOIGi/S1lLazadTtPBwUF955179r+A9g9QXq13MV2qXtvxM4Fn+x+D0fC1BkndygAAAAB\nJRU5ErkJggg==";class J extends Group{constructor(t){super(),this.scene=t||null,this.isGl2=true,this.emitters=new Map,this.textures=new q,this.loader=null,this.now=0,this.last=0,this.delta=0,this.elapsed=0,this.num=0,this.hscale=.5*window.innerHeight,this.luminosity=1,this.matrixAutoUpdate=false,this.matrixWorldAutoUpdate=false;}updateMatrixWorld(t){super.updateMatrixWorld(t),null===this.scene&&this.update();}get(t){return this.emitters.has(t)?this.emitters.get(t):null}add(t,e){if(t.isPoints)return void super.add(t);t.name||(t.name="PP"+this.num++),this.remove(t.name),t.model&&P[t.model]&&(t={...P[t.model],...t});let i=new F(this,t);return this.emitters.set(t.name,i),i}remove(t){if("string"==typeof t||t instanceof String){if(!this.emitters.has(t))return;this.emitters.get(t).dispose(),this.emitters.delete(t);}else if(t.isPoints)return void super.remove(t)}addTexture(t,e,i=true){this.textures.has(t)?console.log("this name of texture is already take !"):"string"==typeof e?(this.loader||(this.loader=new TextureLoader),this.loader.load(e,(e=>{e.flipY=false,i&&(e.colorSpace=SRGBColorSpace),this.textures.add(t,e);}))):e.isTexture&&(e.flipY=false,this.textures.add(t,e));}load(t){const e=t.substring(t.lastIndexOf("/")+1,t.lastIndexOf("."));var i=new XMLHttpRequest;i.open("GET",t),i.onreadystatechange=function(){if(4===i.readyState)if(200===i.status||0===i.status){let t=JSON.parse(i.responseText);for(let e in t)this.add(t[e]);}else console.error("Couldn't load ["+e+"] ["+i.status+"]");}.bind(this),i.send();}resize(t){this.hscale=.5*t;}onresize(t){this.hscale=.5*t;}loop(t){this.delta=t,this.emitters.forEach((t=>{t.draw();}));}update(t){this.now=void 0!==t?t:Date.now(),this.delta=.001*(this.now-this.last),this.elapsed+=this.delta,this.last=this.now,this.emitters.forEach((t=>{t.draw();}));}dispose(t=true){this.emitters.forEach((t=>{t.dispose();})),this.emitters.clear(),t&&this.textures.dispose(),this.num=0;}addBlock(t,e){let i=t[1]<=4?-2:0,a=P.getColor(e),n=a[0],r=a[1],o=a[2];a.length>3&&(n=a[3],r=a[4],o=a[5]),t[0]+=.5,t[2]+=.5,this.add({position:t,colors:[n,r,o,1,n,r,o,0],renderOrder:i,...P.addBlock});}delBlock(t,e){let i=t[1]<=4?-2:0,a=P.getColor(e),n=a[0],r=a[1],o=a[2];t[0]+=.5,t[2]+=.5,t[1]+=.5;let s=30;a.length>3&&(s=20,this.add({position:[t[0],t[1]+.375,t[2]],positionRange:[.5,.25,.5],colors:[n,r,o,.5,n,r,o,0],numParticles:10,renderOrder:i,...P.removeBlock}),n=a[3],r=a[4],o=a[5]),this.add({position:t,positionRange:[.5,.5,.5],colors:[n,r,o,.5,n,r,o,0],numParticles:s,renderOrder:i,...P.removeBlock});}removePlayerTrail(t){this.remove("PlayerTrail_"+t);}onPlayerWalk(t,e,i){let a=this.get("PlayerTrail_"+e);null===a&&(a=this.addTrail({name:"PlayerTrail_"+e,...P.playerMove}));let n=t.toArray();n[1]+=.2;let r=P.getColor(i),o=[r[0],r[1],r[2],.75,r[0],r[1],r[2],0];r.length>3&&(o=[r[0],r[1],r[2],.75,r[3],r[4],r[5],0]),a.birthParticles(n,o);}onVehicleDrive(t,e){let i=this.get("VehicleTrail_"+e);null===i&&(i=this.addTrail({name:"VehicleTrail_"+e,...P.vehicleMove})),i.birthParticles(t.toArray());}onBazookaFire(t,e){let i=this.get("BazookaTrail_"+e);null===i&&(i=this.addTrail({name:"BazookaTrail_"+e,...P.bazookaFire})),i.birthParticles(t.toArray());}onExplosion(t){this.add({position:t.toArray(),...P.explosion});}}

new Vector3;new Vector3;new Mesh(new SphereGeometry(.03),new MeshBasicMaterial({transparent:true}));new Vector3;new Vector3;new Mesh(new SphereGeometry(.03),new MeshBasicMaterial({transparent:true}));new PlaneGeometry;const W=new CylinderGeometry(1,1,1);W.rotateX(Math.PI/2);new Object3D;new Vector3;new Vector3;new Color("red");

/** __
*    _)_|_|_
*   __) |_| | 2025
* @author lo.th / https://github.com/lo-th
*
*    THREE.JS BRIDGE ENGINE
*/

const Version = {
	
	PHY: '0.5.0',
	// best
    PHYSX: '5.06.10',
    HAVOK: '1.2.1',
    JOLT: '0.39.0',
    // old
    RAPIER: '0.20.0',
    OIMO: '1.2.4',
    AMMO: '3.2.6',

};


class PhyEngine {

	constructor( parameters = {} ) {

		this.noBuffer = true;

		this.stats = new Stats();

		this.geo = new Geo$1();
		this.mat = new Mat$3();

		this.math = MathTool;
		this.pool = Pool;


		//console.log(MathTool.pow(25.66,3), Math.pow(25.66,3))
		//this.RayCar = RayCar;
		
		this.version = Version.PHY;
		this.Version = Version;

		this.engine = '';

		this.jointVisible = false;

		this.utils = new Utils(this);
		this.collision = new Collision(this);

		this.viewSize = null;
		this.debug = false;
		this.delta = 0;

		this.debuger = null;
		this.mouseActive = false;

		const _this = this;

		let particles = null;

        let useLocal = false;
        let useModule = false;

		let needContact = false;

		let currentControle = null;
		let callbackReady = null;
		let worker = null;
		let isWorker = false;
		let isBuffer = false;
		let isTimeout = false;
		let outsideStep = true;
		let engineReady = false;
		let breaker = null;

		let isAdd = false;

		let timetest = { t1:0, t2:0, t3:0, t4:0 };

		let mouseTool = null;

		let directMessage = null;
		let controls = null;

		let isPause = false;
		let first = true;

		let timout = null;
		let timoutFunction = null;
		let timoutTime = 0;
		let elapsedTime = 0;

		let envmapUrl = '';
		let _envmap = null;

		// from three
		let renderer = null;
		let scene = null;


		const user = new User();
		const timer = new Timer(60);
		const tt = { start:0, end:0, startTime:'' };

		let azimut = ()=>(0);
		let endReset = ()=>{};
		let postUpdate = ()=>{};
		let addControl = ()=>{};

		let buttons = [];
		let textfields = [];
		let softBodySolver = [];

		let colorChecker = null;

		const settings = {

			fps: 60,
			fixe: true,
			full: false,
			substep: 2,
			gravity: [0,-9.81,0],
			
		};


		// ------------------------------
		//     MAIN ARRAY POOL
		// ------------------------------

		let _Ar = null;
		let _ArPos = {};

		this.flow = {
			stamp:0,
			current:'',
			key:[],
			tmp:[],
			add:[],
			remove:[]
		};

		this.reflow = {
			ray:[],
			stat:{ fps:0, delta:0, ms:0 },
			point:{},
			contact:{},
			velocity:{},
		};

		const items = {};

		// ------------------------------
		//     MAIN SCENE FOR PHY
		// ------------------------------

		this.scene = null;
	    this.scenePlus = null;

	    // ------------------------------
		//     WORRLD SCALE
		// ------------------------------

	    this.ws = 1;
		this.uws = 1;


		// ------------------------------
		//     GARBAGE
		// ------------------------------

		this.garbage = [];
		this.tmpMesh = [];
		this.instanceMesh = {};
		this.tmpTex = [];

		this.disposeTmp = () => {
			// clear temporary mesh
			let i, j, m;
			for( i in this.tmpMesh ) {
				m = this.tmpMesh[i];
				if( m.children ){
					for( j in m.children ) this.disposeMesh( m.children[j] );
				}
				this.disposeMesh( m );
				if( m.parent ) m.parent.remove( m );
			}
			this.tmpMesh = [];

			// clear temporary textures
			for( i in this.tmpTex ) this.tmpTex[i].dispose();
			this.tmpTex = [];

		};

		this.disposeMesh = ( m ) => {

			if( m.geometry ) m.geometry.dispose();
			if( m.dispose ) m.dispose();
				
		};

	    this.setStep = ( f ) => { postUpdate = f; };

		this.debugMode = ( b ) => { this.setDebugMode(b); };
		this.setDebugMode = ( b ) => { this.debug = b; };

		this.useRealLight = (o) => { this.mat.useRealLight(o); };

		this.getSetting = () => { return settings; };

		this.setGravity = ( v ) => {

			if(v) settings.gravity = v;
			this.post({ m:'setGravity', o:{ gravity:settings.gravity } });

		};

		this.set = ( o = {} ) => {

			settings.fixe = o.fixe !== undefined ? o.fixe : true;
			settings.full = o.full !== undefined ? o.full : false;
			settings.gravity = o.gravity ? o.gravity : [0,-9.81,0];
		    settings.substep = o.substep ? o.substep : 1;
		    settings.fps = o.fps ? o.fps : 60;

		    this.ws = o.worldScale !== undefined ? o.worldScale : 1;
		    this.uws = 1/this.ws;
		    

		    // TODO remove whrn full complete
		    //if(o.forceSubstep) settings.substep = o.forceSubstep;
		    //else if( this.engine === 'HAVOK') settings.substep = 1;

			if( o.key ) addControl();

			items.body.setFull( settings.full );
			this.initArray( settings.full );

			elapsedTime = 0;
			isTimeout = isWorker;
			outsideStep = !isTimeout;

			//console.log( isTimeout, isWorker, outsideStep )

		    this.jointVisible = o.jointVisible || false;

			if( outsideStep ) timer.setFramerate( settings.fps );

			const data = {
				...o,
				...settings,
				ArPos:_ArPos,
				isTimeout:isTimeout,
				outsideStep:outsideStep,
			};

			this.post({ m:'set', o:data });

		};

		this.activeMouse = ( controler, mode ) => { 
			if( !mouseTool ) mouseTool = new MouseTool( controler, mode, this );
			this.mouseActive = true;
		};

	    this.mouseMode = ( mode, o ) => { 
			if( mouseTool ) mouseTool.setMode( mode, o );
		};

	    this.getTime = () => { return Timer.now(); };
	    this.readTime =( t ) => { return Timer.format_time(t); };

	    this.startTime =() => { return tt.startTime; };

		this.getTimeTest =() => { return timetest; };

		this.setMaxFps = ( v ) => { };

		this.getMouse = () => { return mouseTool ? mouseTool.mouse : null; };

		this.setMaxAnisotropy = ( f ) => { Pool.maxAnisotropy = f; };

		this.setAddControl =( f ) => { addControl = f; };

		this.setPrevUpdate = ( f ) => { };
		this.setPostUpdate = ( f ) => { postUpdate = f !== null ? f : ()=>{}; };

		this.setAzimut = ( f ) => { azimut = f; };
		this.setRenderer = ( f ) => { 
			renderer = f;
			Pool.renderer = renderer;
		};

		this.setKey =(i, v) => { return user.setKey(i,v) };
		this.getKey =() => { return user.key };
		this.getKey2 =() => { return user.key2 };
		this.getAzimut =() => { return azimut() };

		this.setContent = ( Scene ) => {

			if( isAdd ) return;
			scene = Scene;
			scene.add( this.scene );
			scene.add( this.scenePlus );
			isAdd = true;

		};

		this.message = ( m ) => {

			let e = m.data;
			if( e.Ar ) _Ar = e.Ar;
			if( e.reflow ){
				this.reflow = e.reflow;
				if(this.reflow.stat.delta){ 
					this.stats.up( this.reflow.stat );
					elapsedTime += this.reflow.stat.delta;
				}
			}
		
			_this[ e.m ]( e.o );

		};

		this.worldScaler = ( o ) => {

			const w = this.ws;

			if(o.pos) o.pos = MathTool.worldscale( o.pos, w );
			if(o.localPos) o.localPos = MathTool.worldscale(o.localPos, w );
			if(o.massCenter) o.massCenter = MathTool.worldscale(o.massCenter, w );
			
			if(o.pos1) o.pos1 = MathTool.worldscale(o.pos1, w );
			if(o.pos2) o.pos2 = MathTool.worldscale(o.pos2, w );

			if(o.shapes){
				let i = o.shapes.length, s;
		        while(i--){
		            s = o.shapes[i];
		            if(s.size) o.shapes[i].size = MathTool.worldscale( s.size, w );
		            if(s.pos) o.shapes[i].pos = MathTool.worldscale( s.pos, w );
		            if(s.v) o.shapes[i].v = MathTool.worldscale( s.v, w );
		        }
			} else {
				if(o.size) o.size = MathTool.worldscale(o.size, w );
				if(o.v) o.v = MathTool.worldscale( o.v, w );
			}

		};

		// Typically, on a Flame, the transfer speed is 80 kB/ms for postMessage 
		// This means that if you want your message to fit in a single frame, 
		// you should keep it under 1,300 kB

		this.post = ( e, buffer = null, direct = false ) => {

			// worldscale
			if( this.ws !== 1 ){
				if(e.m === 'add' || e.m === 'change') this.worldScaler( e.o );
			}

			if( !isWorker ){
				directMessage( { data : e } );
				return;
			}

			{
				if( e.o ){
			    	if( e.o.type === 'solver' ) direct = true;
			    	if( e.o.solver !== undefined ) direct = true;
			    }
			    if( direct ){
			    	worker.postMessage( e, buffer );
			    } else {
			    	if( e.m === 'add' ) this.flow.add.push( e.o );
			    	else if ( e.m === 'remove' ) this.flow.remove.push( e.o );
			    	else worker.postMessage( e, buffer );
			    }
			}

		};


		//-----------------------
		//  DEBUGER TEST
		//-----------------------

		this.addDebuger = () => {

			if( this.debuger !== null ) return;
			this.debuger = new Debuger( this );
			this.scenePlus.add(this.debuger);
			return this.debuger

		};

		this.removeDebuger = () => {

			if( this.debuger !== null ){
				this.debuger.dispose();
				this.debuger = null;
			}

		};


		//-----------------------
		//  EXTRA OBJECT
		//-----------------------

		this.vehicle = ( o ) => {

			let b;
			switch(o.type){
				case 'raycar': b =  new RayCar(o, this); break;
				//case 'taxi': b =  new Taxi(o, this); break;
				case 'kart': b =  new Kart(o, this); break;
				case 'helico': b =  new Helicopter(o, this); break;
			}
			return b;

		};

		this.autoRagdoll = ( o ) => {

			const arg = new AutoRagdoll( o, this );
			this.scene.add( arg.model );
			return arg;

		};


		//-----------------------
		//  BASE FUNCTION
		//-----------------------

		this.byName = ( name ) => ( this.utils.byName( name ) );
		this.getScene = () => ( this.scene );

		this.makeView = () => {};

		this.resize = ( size ) => { 
			this.viewSize = size; 
			if(particles) particles.resize(this.viewSize.h);
		};

		this.init = ( o = {} ) => {

			typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;

			tt.start = Timer.now();

			const compact = o.compact || false;

			// TODO find better solution
			let url = document.location.href.replace(/\/[^/]*$/,"/");
			let arr = url.split("/");
			url = arr[0] + "//" + arr[2] + '/';

			if( url === 'https://lo-th.github.io/' ) url = 'https://lo-th.github.io/phy/';

			let path = o.path || '';
			path += compact ? 'compact/' : 'build/';

			let type = o.type || 'PHYSX';

			let name = type.toLowerCase();
			let mini = name.charAt(0).toUpperCase() + name.slice(1);

			this.engine = type.toUpperCase();

			this.initItems();

			// garbage material
			Pool.materialRoot = this.mat.set.bind(this.mat);

			// extand shader
			//this.mat.initExtandShader();

			if( o.callback ){ 
				callbackReady = o.callback;
				delete o.callback;
			}

			isWorker = o.worker || false;

			this.scene = new Group();
			this.scene.name = 'phy_scene';
			this.scenePlus = new Group();
			this.scenePlus.name = 'phy_scenePlus';

			if( o.scene ){  // need for envmap
				this.setContent( o.scene );
				delete ( o.scene );
			}

			if( o.renderer ){ // need for envmap and ktx2
				this.setRenderer( o.renderer );
				delete ( o.renderer );
			}

			envmapUrl = o.envmap || '';

			useModule = o.useModule ? this.supportModuleWorker() : false;
			useLocal = o.useLocal || false;
			o.useDecal || false;

			Pool.useLocal = useLocal;

			if( compact ){

				if( useLocal ){
				
					if( useModule ) Pool.load( new URL( '../' + path + mini + '.module.hex', import.meta.url), function(){ _this.onCompactDone(o); } );
		    		else Pool.load( new URL( '../' + path + mini + '.hex', import.meta.url), function(){ _this.onCompactDone(o); } );
				
				} else {

					if( useModule ) Pool.load( url + path + mini + '.module.hex', function(){ _this.onCompactDone(o); } );
					else Pool.load( url + path + mini + '.hex', function(){ _this.onCompactDone(o); } );

				}

			} else {

				if( isWorker ){ // is worker version

					let fileName = useModule ? mini + '.module.js' : mini + '.min.js';
					let workerSourceURL;

					/*if(useDecal){
						this.loadDecal( `./${fileName}`, o);
						return;
					}*/

					// TODO test
					// https://aditya003-ay.medium.com/different-ways-to-share-data-between-main-thread-and-worker-thread-75a5d86ab441
					//const sharedBuffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * 5);
					//const sharedArray = new Float32Array(sharedBuffer);
					// Start the worker and pass the shared buffer
					//const worker = new Worker('./worker-shared-buffer.js', { workerData: sharedBuffer });

					// https://web.dev/articles/module-workers?hl=fr
					// https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker

					if( useLocal ) workerSourceURL = new URL( `./${fileName}`, import.meta.url );
					else workerSourceURL = url + path + fileName;

					

				    worker = new Worker( workerSourceURL, { type: useModule ? 'module' : 'classic'} );
				    worker.postMessage = worker.webkitPostMessage || worker.postMessage;
					worker.onmessage = this.message;

					if( this.noBuffer ) o.isBuffer = false;
					else {
						// test if worker Shared buffer is compatible
						let ab = new ArrayBuffer( 1 );
						worker.postMessage( { m: 'test', ab:ab }, [ ab ] );
						isBuffer = ab.byteLength ? false : true;
						o.isBuffer = isBuffer;
					}

					this.initPhysics( o );


				} else { // is direct version

					if( o.devMode ) this.preLoad( mini, o, url );
				    else this.preLoadMin( mini, o, url, useLocal );

				}

			}

		};


		this.supportModuleWorker = () => {

			 let supports = false;
			 const tester = {
			      get type() { supports = true; }
			};
			try {
			    const worker = new Worker('data:,', tester).terminate();
			} finally {
			    return supports;
			}

		};

		this.onCompactDone = ( o ) =>{

			let name = this.engine.toLowerCase();
			let mini = name.charAt(0).toUpperCase() + name.slice(1);
			let code = useModule ? Pool.get( mini+'.module', 'H' ) : Pool.get( mini, 'H' );

			if( isWorker ){

				let blob;

				try {
				    blob = new Blob([code], {type: 'application/javascript'});//text/html
				} catch (e) { // Backwards-compatibility
				    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
				    blob = new BlobBuilder();
				    blob.append(code);
				    blob = blob.getBlob();
				}

				if( useModule ) worker = new Worker( URL.createObjectURL(blob), {type:'module'} );
				else worker = new Worker( URL.createObjectURL(blob) );
			    //else worker = new Worker( url + path + mini + '.module.js', {type:'module'});

			    //console.log('can run worker module:', useModule )

				worker.postMessage = worker.webkitPostMessage || worker.postMessage;
				worker.onmessage = this.message;

				if( this.noBuffer ) o.isBuffer = false;
				else {

					let ab = new ArrayBuffer( 1 );
					worker.postMessage( { m: 'test', ab:ab }, [ ab ] );
					isBuffer = ab.byteLength ? false : true;
					o.isBuffer = isBuffer;

				}
				//console.log( st + ' Worker '+ type + (o.isBuffer ? ' with Shared Buffer' : '') );

				this.initPhysics( o );

			} else {

				let type = name.toUpperCase();
				//if(type==='RAPIER') type = 'RAPIER3D';

				let n = document.createElement("script");
	            n.language = "javascript";
	            n.type = "text/javascript";
	            n.charset = "utf-8";
	            n.async = true;
	            n.innerHTML = code;

	            document.getElementsByTagName('head')[0].appendChild(n);
	            //document.body.appendChild(n);

	            directMessage = window[type].engine.message;
				o.message = this.message;
				this.initPhysics( o );

			}

			//console.log( code, isWorker )

		};

		this.loadWasmDirect = ( link, o, name, url ) => {

		    let s = document.createElement("script");
		    s.src = url + link;
		    document.body.appendChild( s );
		    s.onload = () => { this.preLoad( name, o, url ); };

		};

		this.preLoadMin = ( name, o, url, useLocal = false ) => {

			let link = url + 'build/'+name+'.min.js';

			if( useLocal ) link = new URL( './'+ name + '.min.js', import.meta.url );

			let type = name.toUpperCase();
			//if(type==='RAPIER') type = 'RAPIER3D';

			var xml = new XMLHttpRequest();
	        xml.open('GET', link );
	        xml.overrideMimeType( "text/javascript" );
	        xml.onreadystatechange = function() {
	            if ( xml.readyState === 4 ) {
	                if ( xml.status === 200 || xml.status === 0 ) {
	                    let n = document.createElement("script");
	                    n.language = "javascript";
	                    n.type = "text/javascript";
	                    n.charset = "utf-8";
	                    n.async = true;
	                    n.innerHTML = xml.responseText;

	                    console.log( xml.responseText);
	                    //this.extraCode.push(n)
	                    document.getElementsByTagName('head')[0].appendChild(n);
	                    //document.body.appendChild(n);

					    directMessage = window[type].engine.message;
						o.message = this.message;
						this.initPhysics( o );
	                }
	                else console.error( "Couldn't load ["+ name + "] [" + xml.status + "]" );
	            }
	        }.bind(this);
	        xml.send(null);

		};

		this.preLoad = async( name, o, url ) => {

			let link = url + 'build/'+name+'.module.js';
			if( o.devMode ) link = url + 'src/'+name+'.js';
		    let M = await import( link );
		    directMessage = M.engine.message;
			o.message = this.message;
			this.initPhysics( o );

		};

		////

		this.initPhysics = ( o ) => {

			if( envmapUrl !== '' ){
				this.preloadEnvmap( o );
				return
			}

			//tt.start = Timer.now();
		
		    this.post({ m:'init', o:o });
		    engineReady = true;

		};

		this.addEnvmap = ( o ) => {
			if(!_envmap) _envmap = new Envmap( { renderer:renderer, scene:scene, ...o } );
			return _envmap;
		};

		this.preloadEnvmap = ( o ) => {

			_envmap = new Envmap( {
				url:envmapUrl,
				renderer:renderer,
				scene:scene,
				usePmrem:o.usePmrem,
				useBackground: o.useBackground !== undefined ? o.useBackground : true,
				envBlur: o.envBlur !== undefined ? o.envBlur : 0,
				callback:()=>{
					envmapUrl = '';
					this.initPhysics(o);
				}
			});

		};
		
		this.getPause = () => { return isPause; };

		this.pause = ( v ) => {

			if( v === isPause ) return
			isPause = v;
			if( isPause ) this.pausetimout();
			else this.playtimout();
			this.post({ m:'pause', o:{ value:isPause } });

		};

		this.flowReset = ( ) => {

			this.flow = { 
				stamp:0,
				current:'',
				key:[],
				tmp:[],
				add:[],
				remove:[],
				//point:[]
			};

		};

		this.reset = ( callback ) => {

			if( first ){
				first = false;
				callback();
				return;
			}

			buttons = [];

			currentControle = null;
			needContact = false;

			if( controls ) controls.resetAll();
			if( mouseTool ) mouseTool.unSelect();

			if( particles ){ 
				particles.dispose();
				particles = null;
			}

			endReset = callback;

			postUpdate = function () {};

			this.collision.reset();

			this.clearText();
			//this.clearSkeleton()
			this.clearSoftSolver();

			this.cleartimout();

			this.flowReset();

			// clear instance
		    this.clearInstance();

		    // reset all items
		    this.resetItems();

			// clear temporary geometry
			this.geo.dispose();

		    // clear temporary material
		    this.mat.dispose();

		    // clear temporary mesh
			this.disposeTmp();

			this.stats.reset();

			this.garbage = [];

			colorChecker =  null;

			if( breaker !== null ) breaker = null;

			if( this.debuger !== null ) this.removeDebuger();
				
		    this.scenePlus.children = [];
		    this.scene.children = [];

			this.post({ m:'reset', o:{} });

		};

		this.clearGarbage = () => {

			this.remove(this.garbage);
			this.clearInstance();
			this.garbage = [];
			
		};

		this.clear = ( callback ) => {

			this.reset(callback);
			
		};

		this.resetCallback = () => {

			endReset();

		};

		this.dispose = () => {

			this.reset(()=>{

				if( worker ){ 
					worker.terminate();
					worker = null;
				}

				if( isAdd ){
					_this.scene.parent.remove( _this.scene );
					_this.scenePlus.parent.remove( _this.scenePlus );
					isAdd = false;
				}

			});

		};

		this.ready = () => {

			tt.end = Timer.now();
			tt.startTime = Timer.format_time( tt.end - tt.start );

			console.log( '%c'+this.engine + ' %c' + Version[this.engine] +'%c | '+ (useModule ? 'Module ' : '' ) + ( isWorker?'Worker': 'Direct') +' '+ tt.startTime, 
				"font-size:16px", 
				"font-size:12px", 
				"font-size:12px" 
			);
			if( callbackReady ) callbackReady();

		};

		this.start = ( o = {} ) => { this.post({ m:'start', o:o }); };

		this.morph = ( obj, name, value ) => { this.utils.morph( obj, name, value ); };

		//this.getFps = () => { return this.reflow.stat.fps }
		//this.getMs = () => { return this.reflow.stat.ms.toFixed(1) }

		this.getFps = () => { return this.stats.fps.toFixed(0) };
		this.getMs = () => { return this.stats.ms.toFixed(1) };
		this.getGpu = () => { return this.stats.gpu.toFixed(1) };
		
		this.getDelta2 = () => { return this.delta };
		this.getElapsedTime2 = () => { return elapsedTime };

		this.setDelta = (v) => { timer.delta = v; }; // three js delta time
		this.getDelta = () => { return timer.delta };
		this.getElapsedTime = () => { return timer.elapsedTime };

		this.doStep = ( stamp ) => {

			if( !engineReady ) return;
			if( !outsideStep ) return;
			if( timer.up( stamp ) ) {
				this.post( { m:'step', o:stamp } );
			}

		};

		this.step = () => {

			// time of physic engine step
			this.delta = this.reflow.stat.delta;
	        // user key interaction
			this.flow.key = user.update();
			this.flow.current = currentControle !== null ? currentControle.name : '';
	        //prevUpdate( timer.delta )

			this.stepItems();
			this.collision.step();

			if( mouseTool ) mouseTool.step();

			//if( breaker !== null ) breaker.step();

			if( currentControle !== null ) currentControle.move();

			if( this.debuger !== null ) this.debuger.draw();


			// TODO fix dt 0 when no doStep ??

			let delta = outsideStep ? timer.delta : this.delta;

			postUpdate( delta );


			//items.character.prestep()

			// update this.object for this side !
			this.changes( this.flow.tmp );

			// finally post flow change to physx
			if( isBuffer ) this.post( { m:'poststep', flow:this.flow, Ar:_Ar }, [ _Ar.buffer ] );
			else this.post( { m:'poststep', flow:this.flow });

			//	this.stepItems()
			this.flowReset();

		};

	    

		this.initArray = ( full = false ) => {

		    // dynamics array
			_ArPos = {...getArray( this.engine, full )};

		};

	    this.takeControl = ( name = null ) => {

	    	this.control( name );

	    };

		this.control = ( name = null ) => { // for character and vehicle

			if( currentControle !== null ){
				if( name === null ) {
					if( currentControle.isPlayer ) currentControle.isPlayer = false;
					currentControle = null;
				} else  {
					if( name !== currentControle.name ) {
						currentControle = this.byName( name );
						if( currentControle ) currentControle.isPlayer = true;
					}
				}
			} else if( name !== null ){
				currentControle = this.byName( name );
				if( currentControle ) currentControle.isPlayer = true;
			}

		};

		

		this.getAllBody = ( name ) => {

			return items.body.list;

		};

		this.activeContact = () => {

			if(!needContact ){
				needContact = true;
				this.post( { m:'activeContact', o:{} } );
			}
			
		};

		//-----------------------
		//  COLLISION
		//-----------------------

		this.addCollision = ( o ) => {
			this.collision.add(o);
		};

		this.removeCollision = ( name ) => {
			this.collision.remove(name);
		};


		//-----------------------
		//  ITEMS
		//-----------------------

		this.initItems = () => {

			items['body'] = new Body(_this);
			items['ray'] = new Ray(_this);
			items['joint'] = new Joint(_this);
			items['solid'] = new Solid(_this);
			items['contact'] = new Contact(_this);
			items['terrain'] = new Terrain(_this);
			items['character'] = new Character(_this);

			// vehicle only on physx and ammo
			if( this.engine === 'PHYSX' || this.engine === 'AMMO' ){ 
				items['vehicle'] = new Vehicle(_this);
			}

			// solver is only on physx
			if( this.engine === 'PHYSX' ) items['solver'] = new Solver(_this);

		};

		this.getBodyRef = () => items.body;
		this.getCharacterRef = () => items.character;

		// on Hero / vehicle
		this.getGeometryRef = ( o, b, m ) => { items.body.geometry( o, b, m ); }; 

		this.clearBody = () => { items.body.reset(); };

		this.resetItems = () => {

			Object.values(items).forEach( v => v.reset() );

		};

		this.stepItems = () => {

		    Object.values( items ).forEach( v => v.step( _Ar, _ArPos[v.type] ) );

		   // this.collision.step();
			this.upInstance();
			this.upButton();

		};

		this.getTransform = (b) => {

		    return items.body.getTransform( b ) 

		};

		


		//-----------------------
		//  INSTANCE
		//-----------------------

		this.upInstance = () =>{

	    	Object.values( this.instanceMesh ).forEach( value => value.update() );

	    };

		this.clearInstance = () => {

	    	Object.values( this.instanceMesh ).forEach( value => value.dispose() );
	    	this.instanceMesh = {};

		};


		//-----------------------
		//  ADD
		//-----------------------

		this.adds = ( r = [], direct = false ) => {

			let i = r.length, n = 0;
			while(i--) this.add( r[n++], direct );

		};

		this.add = ( o = {}, direct = false ) => {

			if( o.isObject3D ) return this.addDirect( o );
			if( o.constructor === Array ) return this.adds( o, direct );
			if( o.type === 'container' ) return new Container( o, this );
			
			if( o.bounce !== undefined ) o.restitution = o.bounce;
			if( o.type === undefined ) o.type = 'box';
			if( o.mode !== undefined ) o.type = 'joint';

			let type = getType( o );

			if( type === 'joint' && o.mode === undefined ){ 
				o.mode = o.type;
				o.type = 'joint';
			}

			let m = items[type].add( o );
			this.garbage.push( m.name );
			return m;

		};

		this.addDirect = ( b ) => {

			this.scenePlus.add( b );
			this.tmpMesh.push( b );
			return b;

		};


		//-----------------------
		//  REMOVE
		//-----------------------

		this.removes = ( r = [], direct ) => { 

			let i = r.length, n = 0;
			while(i--) this.remove( r[n++], direct );

		};
		
		this.remove = ( name, direct = false ) => {

			if ( name.constructor === Array ) return this.removes( name, direct );

			let b = this.byName( name );
			if( b === null ){ 
				if( this.instanceMesh[ name ] ) items.body.clearInstance( name );
				return;
			}

			this.removeCollision(name);

			if(b.type === 'autoRagdoll' ) {
				this.utils.remove(b);
				return 
			}
			if( b.extraRemove ) b.extraRemove();

			// remove on three side
			items[b.type].clear( b );
			// remove on physics side
			this.post( { m:'remove', o:{ name:name, type:b.type } }, null, direct );

		};


		//-----------------------
		//  CHANGE
		//-----------------------

		this.changes = ( r = [], direct = false ) => { 

			let i = r.length, n = 0;
			while( i-- ) this.changeOne( r[n++], direct );

		};

	    this.change = ( o, direct = false ) => {

	    	if( direct ){
	    		if( o instanceof Array ) this.changes( o, true );
	    		else this.changeOne( o, true );
	    	} else {
	    		if( o instanceof Array ) this.flow.tmp.push( ...o );
	    		else this.flow.tmp.push( o );
	    	}

		};

		this.changeOne = ( o = {}, direct = false ) => {

			if( o.heightData ) return

			let b = this.byName( o.name );
			if( b === null ) return null;
			let type = b.type;

			if( o.drivePosition ){
				if( o.drivePosition.rot !== undefined ){  
					o.drivePosition.quat = MathTool.quatFromEuler( o.drivePosition.rot ); 
					delete ( o.drivePosition.rot ); 
				}
			}
			if( o.rot !== undefined ){ o.quat = MathTool.quatFromEuler( o.rot ); delete ( o.rot ); }
			//if( o.rot1 !== undefined ){ o.quat1 = math.toQuatArray( o.rot1 ); delete ( o.rot1 ); }
			//if( o.rot2 !== undefined ){ o.quat2 = math.toQuatArray( o.rot2 ); delete ( o.rot2 ); }
			if( o.localRot !== undefined ){ o.quat = MathTool.toLocalQuatArray( o.localRot, b ); delete ( o.localRot ); }


			//if( o.type === 'solver' ) direct = true;
			//if( o.solver !== undefined ) direct = true;

			switch( type ){

				case 'terrain': b = items.terrain.set( o, b ); direct = false; break;
				case 'ray': b = items.ray.set( o, b ); direct = false; break;
				case 'character': b = items.character.set( o, b ); break;
				case 'solid': b = items.solid.set( o, b ); break;
				case 'joint': b = items.joint.set( o, b );  break;
				case 'body':

				if( !b.isKinematic ){
				//if( this.engine !== 'HAVOK' ){


					//if( b.isKinematic ) items.body.set( o, b );
		            if( !b.actif || b.sleep ) items.body.set( o, b );
		            if( o.sleep ) items.body.set( o, b );
		        } 
				break;

			}
			
			if( direct ){
				this.post({ m:'change', o:o }, null, direct );
			}

		};


		//-----------------------
		//  CAMERA CONTROLS
		//-----------------------

		this.setControl = ( Controls ) => { 

			controls = Controls;
			azimut = ()=>{return controls.getAzimuthalAngle()};

		};

		this.getControl = () => {

			return controls;

		};

		this.getCurrentCharacterPosition = () => {

			return controls.followGroup.position;

		};

		this.getCamera = ( o = {} ) => {

			return controls.object;

		};

		this.setCamera = ( o = {} ) => {

			controls.moveCam( o );

		};

		this.follow = ( m = '', o = {} ) => {

			let mesh = null;

			if ( typeof m === 'string' || m instanceof String ) mesh = m === '' ? null : this.byName( m );
			else if ( m.isObject3D ) mesh = m;

			if( mesh === null ) controls.resetFollow();
			else controls.startFollow( mesh, o );

		};


	    //-----------------------
		//  INTERN timout
		//-----------------------

		this.setTimeout = ( f, time = 0, single = false ) => {

			if(single) timout = setTimeout( f, time );
			else {
				timoutFunction = f; 
				timoutTime = time; 
				timout = setTimeout( timoutFunction, timoutTime );
			}

		};

		this.playtimout = () => {

			if( timoutFunction === null ) return
			timout = setTimeout( timoutFunction, timoutTime );

		};

		this.pausetimout = () => {

			if( timout === null ) return
			clearTimeout( timout );

		};

		this.cleartimout = ( f, time ) => {

			if( timout === null ) return
			timoutFunction = null;
			timoutTime = 0; 
			clearTimeout( timout );
			timout = null;

		};


		//-----------------------
		//  TEXTURE
		//-----------------------

		this.texture = ( o={} ) => ( Pool.texture( o ) );
		this.getTexture = ( name, o={} ) => ( Pool.getTexture( name, o ) );
		//this.texture( o = {} ) { return Pool.texture( o );}


		//-----------------------
		//  MATERIAL
		//-----------------------

		this.setExtendShader = ( f ) => { this.mat.extendShader = f; };
		this.addMaterial = ( m, direct ) => { this.mat.set( m, direct ); };
		this.directIntensity = ( v ) => { /*this.mat.directIntensity(v);*/ };
		this.setEnvmapIntensity = ( v ) => { /*this.mat.setEnvmapIntensity(v);*/ };

		// return
		this.getMatRef = () => ( this.mat );
		this.getMat = ( name ) => ( this.mat.get( name ) );
		this.getMaterial = ( name ) => ( this.mat.get( name ) );
		this.getMaterialList = () => ( this.mat.getList() );
		this.material = ( o={} ) => ( this.mat.create( o ) );
		this.changeRenderMode = ( n ) => ( this.mat.changeRenderMode( n ) );


		//-----------------------
		//
		//  POOL
		//
		//-----------------------

		this.load = Pool.load; // ( Urls, Callback, Path = '', msg = '' )
		this.get = Pool.get; // ( name, type )
		//this.getGlb = Pool.getGLB;
		this.getGroup = Pool.getGroup;
		this.getScript = Pool.getScript;

		this.preload = ( Urls, Callback ) => {

			preloadAvatar.add( Urls, Callback );
			//Pool.load( Urls, Callback, Path, msg )
		};

		/*this.load ( Urls, Callback, Path = '', msg = '' ){
			Pool.load( Urls, Callback, Path, msg );
		}*/

		// TODO ?? 

		/*this.async loadAsync ( Urls, Path = '', msg = '' ){
			await Pool.loadAsync( Urls, Path, msg );
		}*/

		this.applyMorph = ( modelName, meshs = null, normal = true, relative = true )=>{
			Pool.applyMorph( modelName, meshs = null, normal = true, relative = true );
		};

		this.getMesh = ( obj, keepMaterial, multyMaterialGroup )=>{
			if( keepMaterial ){
				let mm = Pool.getMaterials(obj);
				for( let m in mm ){
					this.addMaterial( mm[m] );
				}
			}
			return Pool.getMesh( obj, multyMaterialGroup );
		};

		this.getGlb = ( obj, keepMaterial, multyMaterialGroup )=>{
			if( keepMaterial ){
				let mm = Pool.getMaterials(obj);
				for( let m in mm ){
					this.addMaterial( mm[m] );
				}
			}
			return Pool.getGLB( obj, multyMaterialGroup );
			
		};

		this.getGlbMaterial = ( obj )=>{
			let ms = Pool.getMaterials( obj );
			this.mat.addToMat( ms );
			return ms;
		};

		this.poolDispose = ()=>{

			// TODO bug on dispose pool !!!
			//return Pool.dispose();
		};

		this.setDracoPath = ( src ) => {
			return Pool.dracoPath = src;
		};


		//-----------------------
		//  PARTICLE 
		//-----------------------

		this.initParticle = ()=>{};
		this.addParticle = ()=>{};
		this.getParticle = ()=>{};

		//--------------------------
		//  SOFT PARTICLE PHYSICS
		//--------------------------

		this.addSoftSolver = ( o )=>{
			let s = new SoftSolver( o, this );
			softBodySolver.push(s);
			return s;
		};

		this.updateSoftSolver = () =>{ 

			let i = softBodySolver.length;
			while( i-- ) softBodySolver[i].update();
			
		};

		this.clearSoftSolver = () => { 

			softBodySolver.length;
	    	softBodySolver = [];
			
		};


		//-----------------------
		//  BUTTON
		//-----------------------

		this.addButton = (o) => {

			let b = new Button( o, this );
			buttons.push( b );
			return b;

		};

		this.upButton = (o) => {
			for ( const key in buttons ) buttons[key].update();
		};

	    //-----------------------
		//  GRASS
		//-----------------------

		this.addGrass = ( o ) => {

			let t = new Grass( o, this );
			//if( o.parent ) o.parent.add( t.mesh );
			//else this.scenePlus.add( t.mesh );
			//textfields.push(t);
			return t;

		};


		//-----------------------
		//  TEXT
		//-----------------------

		this.addText = ( o ) => {

			let t = new Textfield( o );
			if( o.parent ) o.parent.add( t );
			else this.scenePlus.add( t );
			textfields.push(t);
			return t;

		};

		this.clearText = () => {

			let i = textfields.length;
			while( i-- ) textfields[i].dispose();
	    	textfields = [];
			
		};


		//-----------------------
		//  SCEENSHOT
		//-----------------------

		this.screenshot = () => {

			var w = window.open('', '');
		    w.document.title = "Screenshot";
		    w.document.body.style.cssText = 'margin:0; padding:0; overflow:hidden;';
		    //w.document.body.style.backgroundColor = "red";
		    var img = new Image();
		    // Without 'preserveDrawingBuffer' set to true, we must render now
		    renderer.render(scene, this.getCamera());
		    img.src = renderer.domElement.toDataURL();
		    w.document.body.appendChild(img); 

		};


		//-----------------------
		// BREAK
		//-----------------------

		this.getBreaker = () => {

			if( breaker !== null ) return breaker;
			breaker = new Breaker(this);
			return breaker;

		};

		//-----------------------
		//  COLOR CHECKER
		//-----------------------

		this.setColorChecker = ( m ) => {

	    	colorChecker = m;

	    };

	    this.getColorChecker = () => {

	    	return colorChecker;

	    };

	    //--------------------
		//
		//  WINGGLE
		//
		//--------------------

		this.addWiggle = ( o = {} ) => {

		   

		};



	    //--------------------
		//
		//  PARTICLE
		//
		//--------------------

		this.initParticleEngine = () => {

		   if( particles ) return;
		   particles = new J();
		   this.scene.add( particles );

		};

		this.addParticle = ( o = {} ) => {

		   if( particles === null ) this.initParticleEngine();
		   return particles.add( o );

		};

		this.getParticle = ( name ) => {
			
			if( particles === null ) return null
		    return particles.get( name );

		};


		//-----------------------
		//  EXPLOSION
		//-----------------------

		this.explosion = ( position = [0,0,0], radius = 10, force = 1 )=>{

			let r = [];
		    let pos = new Vector3();

		    if( position ){
		    	if( position.isVector3 ) pos.copy(position);
		    	else pos.fromArray( position );
		    }
		    
		    let dir = new Vector3();
		    let i = items.body.list.length, b, scaling;

		    while( i-- ){

		        b = items.body.list[i];
		        dir.copy( b.position ).sub( pos );
		        scaling = 1.0 - dir.length() / radius;

		        if( b.isKinematic ) continue;
		        if ( scaling < 0 ) continue;
		        	
		        dir.setLength( scaling );
		        dir.multiplyScalar( force );

		        r.push({ name:b.name, impulse:dir.toArray(), wake:true });
		        //r.push({ name:b.name, impulse:[0,0.01,0], impulseCenter:pos.toArray(), wake:true })
		    }
		    
			this.change( r );
		};
	}

	set onStep ( f ) {

		this.setStep( f );

	}
	
}



//--------------
//
//  SOLID ONLY 
//
//--------------

class Solid extends Body {
	constructor ( motor ) {
		super( motor );
		this.type = 'solid';
	}
	step (){

		// test to force idx
		/*let i = this.list.length, b;
		while( i-- ){
			b = this.list[i];
			b.id = i;
		}*/

	}
}




//-------------------
//
//  UTILS
//
//-------------------

class Utils {


	constructor ( motor ) {

		this.map = new Map();
		this.motor = motor;

	}

	byName ( name ) {

		if ( !this.map.has( name ) ) return null;
		return this.map.get( name );

	}

	add ( b, parent ) {

		if( b.type !== 'contact' && !b.isInstance && b.isObject3D ){

			//console.log('add', b.name, b.type )

			if(!parent){
				if(b.isButton){ this.motor.scene.add( b ); }
				else {
					switch( b.type ){
						case 'terrain': case 'solid': case 'joint': case 'ray': case 'articulation': this.motor.scenePlus.add( b ); break;
						default: this.motor.scene.add( b ); break;
					}
				}
				
			} else {
				parent.add( b );
			}

		}

		//if( b.isInstance && b.refName !== b.name ) this.map.set( b.refName, b );

		this.map.set( b.name, b );

	}

	remove( b ) {

		if( b.dispose ) b.dispose();
		if( b.parent ) b.parent.remove( b );
		if( b.isInstance ) { 
			//if( b.refName !== b.name ) this.map.delete( b.refName );
			b.instance.remove( b.idx );
		}
		this.map.delete( b.name );

	}

	noRay( b ) {
		if( b.isObject3D ){
			b.raycast = () => {return};
			b.traverse( ( child ) => {
				if ( child.isObject3D ) child.raycast = () => {return};
			});
		}
	}

    morph ( obj, name, value ) {
        
        if(!obj.morphTargetInfluences) return
        if(obj.morphTargetDictionary[name] === undefined ) return
        obj.morphTargetInfluences[ obj.morphTargetDictionary[name] ] = value;
    
    }

    toLocal ( v, obj, isAxe = false ) {

    	//if( obj.isObject3D ) obj.updateWorldMatrix( true, false )
    	// apply position
    	if(!isAxe) v.sub( obj.position );
    	//v.multiply(obj.scale)
    	// apply invers rotation
    	let q = obj.quaternion;//.normalize();
    	//v.applyQuaternion(q.clone().invert())
    	//v.applyQuaternion({x:-q.x, y:-q.y, z:-q.z, w:q.w})
    	v.applyQuaternion({x:-q._x, y:-q._y, z:-q._z, w:q._w});
    	//if(isAxe) v.normalize()
    	return v

    }

    quatLocal ( q, obj ) {

    	if( obj.isObject3D ) obj.updateWorldMatrix( true, false );
    	// apply position
    	//if(!isAxe) v.sub( obj.position )
    	// apply invers rotation
    	let q1 = new Quaternion$1().fromArray(q);
    	let q2 = obj.quaternion.clone().invert();
    	q1.premultiply(q2);
    	//v.applyQuaternion({x:-q.x, y:-q.y, z:-q.z, w:q.w})
    	return q1.normalize().toArray();

    }

    axisLocal ( v, obj ) {

    	if( obj.isObject3D ) obj.updateWorldMatrix( true, false );
    	// apply position

        let m3 = new Matrix3().setFromMatrix4( obj.matrixWorld );//.invert()
        //m3.invert()
        let vv = new Vector3().fromArray(v).applyMatrix3( m3 );

        //let vv = new Vector3().fromArray(v).applyMatrix4( obj.matrixWorld.clone().invert() );

    	return vv.toArray()

    }


    quatToAngular ( qb, qa ) {

    	// invert
    	qa[0] *= -1;
    	qa[1] *= -1;
    	qa[2] *= -1;

    	let x = qa[0] * qb[3] + qa[3] * qb[0] + qa[1] * qb[2] - qa[2] * qb[1];
		let y = qa[1] * qb[3] + qa[3] * qb[1] + qa[2] * qb[0] - qa[0] * qb[2];
		let z = qa[2] * qb[3] + qa[3] * qb[2] + qa[0] * qb[1] - qa[1] * qb[0];
		let w = qa[3] * qb[3] - qa[0] * qb[0] - qa[1] * qb[1] - qa[2] * qb[2];

    	let angle = 2 * Math.acos(w), ax;
	    let s = Math.sqrt(1-w*w); // assuming quaternion normalised then w is less than 1, so term always positive.
	    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
	        // if s close to zero then direction of axis not important
	        // if it is important that axis is normalised then replace with x=1; y=z=0;
	        ax = [0,0,0];
	    } else {
	        //x = q[0] / s; // normalise axis
	        ax =  [x / s,y / s,z / s];
        }
    	
        const v = new Vector3().fromArray(ax);
    	const timeDiff = 1;//time2 - time1;
    	v.multiplyScalar( angle / timeDiff );

    	//console.log('result',v)

    }

    refAxis( m, axe ) {

    	let zAxis = new Vector3().fromArray(axe);
	    let xAxis = new Vector3(1, 0, 0);
	    let yAxis = new Vector3(0, 1, 0);
	    if ( Math.abs( axe[1] ) > 0.9999 ){
			yAxis.copy( xAxis ).cross( zAxis ).normalize();
		} else {
			xAxis.copy( zAxis ).cross( yAxis ).normalize();
			yAxis.copy( xAxis ).cross( zAxis ).normalize();
		}

		m.makeBasis( xAxis, yAxis, zAxis );

    }

    

}

const phy$1 = new PhyEngine();
const phy2 = PhyEngine;
const math$1 = MathTool;
const pool = Pool;

export { math$1 as math, phy$1 as phy, phy2, pool };
