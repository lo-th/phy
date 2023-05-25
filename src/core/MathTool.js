
export const torad = Math.PI / 180;
export const todeg = 180 / Math.PI;
export const max32 = Number.MAX_SAFE_INTEGER;
export const EPSILON = 0.00001;

export const MathTool = {

    //torad: Math.PI / 180,
    //todeg: 180 / Math.PI,

    toFixed: ( x, n = 3 ) => ( x.toFixed(n) * 1 ),

    clamp: ( v, min, max ) => {
        v = v < min ? min : v;
        v = v > max ? max : v;
        return v;
    },

    // ARRAY

    equalArray:(a, b)=>{
        let i = a.length
        while(i--){ if(a[i]!==b[i]) return false }
        return true
    },

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

    // for physx substep 

    applyTransformArray: ( v, p, q, s = [1,1,1] ) => {
        const e = MathTool.composeMatrixArray( p, q, s )
        const x = v[0], y = v[1], z = v[2];
        const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );
        return [
            ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w, 
            ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w,
            ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w
        ]
    },

    equalArray:( a, b ) => {
        let i = a.length
        while(i--){ if(a[i]!==b[i]) return false }
        return true
    },
    
    lerpArray:( a, b, t ) => {
        if ( t === 0 ) return a;
        if ( t === 1 ) return b;
        let i = a.length
        let r = [];
        while(i--){ r[i] = a[i]; r[i] += ( b[i] - r[i] ) * t; }
        return r 
    },

    slerpQuatArray:( a, b, t ) => {

        if ( t === 0 ) return a;
        if ( t === 1 ) return b;
        let r = [...a]
        const x = a[0], y = a[1], z = a[2], w = a[3];
        const qx = b[0], qy = b[1], qz = b[2], qw = b[3];
        let cosHalfTheta = w * qw + x * qx + y * qy + z * qz;

        if ( cosHalfTheta < 0 ) {
            r = [ -qx, -qy, -qz, -qw ]
            cosHalfTheta = - cosHalfTheta;
        } else {
            r = [...b]
        }

        if ( cosHalfTheta >= 1.0 ) return a
        
        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

        if ( sqrSinHalfTheta <= EPSILON ) {

            const s = 1 - t;
            r[3] = s * w + t * r[3];
            r[0] = s * x + t * r[0];
            r[1] = s * y + t * r[1];
            r[2] = s * z + t * r[2];
            return MathTool.quatNomalize(r);

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

    lengthArray:( r ) => {
        let i = r.length, l=0
        while(i--) l += r[i] * r[i]
        return Math.sqrt( l ) 
    },

    quatNomalize:( q ) => {
        let l = MathTool.lengthArray( q )
        if ( l === 0 ) {
            return [0,0,0,1]
        } else {
            l = 1 / l;
            return MathTool.mulArray(q, l)
        }
    },

    quatInvert:( q ) => {
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
        const m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
        const m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

        let ar = [0,0,0]
        ar[1] = Math.asin( MathTool.clamp( m13, - 1, 1 ) );
        if ( Math.abs( m13 ) < 0.9999999 ) {
            ar[0] = Math.atan2( - m23, m33 );
            ar[2] = Math.atan2( - m12, m11 );
        } else {
            ar[0] = Math.atan2( m32, m22 );
            ar[2] = 0;
        }
        return ar

    },

    angleTo:( a, b ) => {

        return 2 * Math.acos( Math.abs( MathTool.clamp( MathTool.dotArray(a,b), - 1, 1 ) ) );

    },

    dotArray: ( a, b ) => {
        let i = a.length, r = 0;
        while ( i -- ) r += a[ i ] * b[ i ];
        return r;
    },

    addArray: ( a, b ) => {
        let i = a.length, r = [];
        while ( i -- ) r[i] = a[ i ] + b[ i ];
        return r;
    },

    subArray: ( a, b ) => {
        let i = a.length, r = [];
        while ( i -- ) r[i] = a[ i ] - b[ i ];
        return r;
    },

    mulArray: ( r, s ) => {
        let i = r.length;
        while ( i -- ) r[i] *= s;
        return r;
    },

    distanceArray: ( a, b ) => ( MathTool.lengthArray( MathTool.subArray( a, b ) ) ),

}