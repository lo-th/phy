export const PI = 3.14159265358979323846;//Math.PI;
export const torad = PI / 180;
export const todeg = 180 / PI;
export const max32 = Number.MAX_SAFE_INTEGER;
export const EPSILON = Number.EPSILON;//0.00001;
export const LN2 = 0.69314718056; // natural logarithm
export const TwoPI = PI * 2;
export const PI90 = PI*0.5;
export const PI45 = PI*0.25;
export const PI270 = (PI*0.5)*3;

export const inv255 = 0.003921569;
export const GOLD = 1.618033;
const copySign = (x, y) => (Math.sign(x) === Math.sign(y) ? x : -x);


const M = {

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

    todeg:todeg,
    torad:torad,

    toFixed: ( x, n = 3 ) => ( x.toFixed(n) * 1 ),
    toRound: ( x, n = 3 ) => ( Math.trunc(x) ),

    clamp: ( x, min = 0, max = 1 ) => ( x < min ? min : x > max ? max : x ),
    min: ( x, y ) => ( x < y ? x : y ),
    max: ( x, y ) => ( x > y ? x : y ),
    lerp: ( x, y, t ) => ( ( 1 - t ) * x + t * y ),
    sign:( x ) => ( x > 0.0 ? 1.0 : x < 0.0 ? -1.0 : 0.0 ),
    fast_negexp:( x ) => ( 1.0 / (1.0 + x + 0.48*x*x + 0.235*x*x*x) ),
    fast_atan:( x ) => {
        let z = Math.abs(x);
        let w = z > 1.0 ? 1.0 / z : z;
        let y = (PI / 4.0)*w - w*(w - 1.0)*(0.2447 + 0.0663*w);
        return copysign(z > 1.0 ? PI / 2.0 - y : y, x);
    },
    /*clamp: ( v, min = 0, max = 1 ) => {
        //v = v < min ? min : v;
        //v = v > max ? max : v;
        //return v;
    },*/

    clampA: ( v, min, max ) => ( Math.max( min, Math.min( max, v ) ) ),

    smoothstep: ( min, max, t ) => {
        t = M.clamp(t);
        t = -2.0 * t * t * t + 3.0 * t * t;
        return min * t + max * (1 - t);
    },

    remap: ( f, fmin, fmax, min, max) => {
        return min + (f - fmin) * (max - min) / (fmax - fmin);
    },

    
    damp: ( x, y, lambda, dt ) => ( M.lerp( x, y, 1 - Math.exp( - lambda * dt ) ) ),

    nearAngle: ( s1, s2, deg = false ) => ( s2 + Math.atan2(Math.sin(s1-s2), Math.cos(s1-s2)) * (deg ? todeg : 1) ),

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
        .map(({ value }) => value)

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
            var r = M.randInt(low, high);
            if( arr.indexOf(r) === -1 ) arr.push(r);
        }
        return arr;
    },

    //-----------------------
    //  EXTRA
    //-----------------------

    fromTransform: ( p1, q1, p2, q2 = [0,0,0,1], inv = false ) => {

        let m1 = M.composeMatrixArray( p1, q1 );
        let m2 = M.composeMatrixArray( p2, q2 );
        if( inv ) m1 = M.invertMatrixArray(m1);
        m1 = M.multiplyMatrixArray( m1, m2 );
        return [ m1[12],m1[13],m1[14]]

    },

    fromTransformToQ: ( p, q, inv = false ) => {

        let m = M.composeMatrixArray( p, q )
        let res = M.decomposeFullMatrixArray( m );
        let q1 = res.q;
        if(inv) q1 = M.quatInvert(q1);
        return q1

    },

    // special Havok motion !!!

    lerpTransform: ( oar, ar, t ) => {
        let op = oar[0]
        let oq = oar[1]
        let p = ar[0] 
        let q = ar[1]

        p = M.lerpArray(op, p, t)
        q = M.slerpQuatArray(oq, q, t)
        return [p,q]
    },

    //-----------------------
    //  MATRIX3
    //-----------------------

    Mat3FromQuatArrayThree: ( q ) => {

        const x = q[0], y = q[1], z = q[2], w = q[3];
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;
        const sx = 1, sy = 1, sz = 1;

        let r00 = ( 1 - ( yy + zz ) ) * sx;
        let r01 = ( xy + wz ) * sx;
        let r02 = ( xz - wy ) * sx;

        let r10 = ( xy - wz ) * sy;
        let r11 = ( 1 - ( xx + zz ) ) * sy;
        let r12 = ( yz + wx ) * sy;

        let r20 = ( xz + wy ) * sz;
        let r21 = ( yz - wx ) * sz;
        let r22 = ( 1 - ( xx + yy ) ) * sz;

        let d = [
            [r00, r01, r02], 
            [r01, r11, r12],
            [r20, r21, r22]
        ]

        return d;

    },

    Mat3FromQuatArray: ( q ) => {

        let q0 = q[3];//w
        let q1 = q[0];//x
        let q2 = q[1];//y
        let q3 = q[2];//z

        // First row of the rotation matrix
        let r00 = 2 * (q0 * q0 + q1 * q1) - 1
        let r01 = 2 * (q1 * q2 - q0 * q3)
        let r02 = 2 * (q1 * q3 + q0 * q2)
         
        // Second row of the rotation matrix
        let r10 = 2 * (q1 * q2 + q0 * q3)
        let r11 = 2 * (q0 * q0 + q2 * q2) - 1
        let r12 = 2 * (q2 * q3 - q0 * q1)
         
        // Third row of the rotation matrix
        let r20 = 2 * (q1 * q3 - q0 * q2)
        let r21 = 2 * (q2 * q3 + q0 * q1)
        let r22 = 2 * (q0 * q0 + q3 * q3) - 1

        let d = [
            [r00, r10, r20], // axe X
            [r01, r11, r21], // axe y
            [r02, r12, r22]  // axe z
        ]

        return d;

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

        let sx = M.lengthArray( [te[ 0 ], te[ 1 ], te[ 2 ]] );//_v1.set( te[ 0 ], te[ 1 ], te[ 2 ] ).length();
        const sy = M.lengthArray( [te[ 4 ], te[ 5 ], te[ 6 ]] );//_v1.set( te[ 4 ], te[ 5 ], te[ 6 ] ).length();
        const sz = M.lengthArray( [te[ 8 ], te[ 9 ], te[ 10 ]] );//_v1.set( te[ 8 ], te[ 9 ], te[ 10 ] ).length();

        // if determine is negative, we need to invert one scale
        const det = M.matrixArrayDeterminant(m);
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

        let q = M.quatFromRotationMatrix(m1) 

        return {
            p:[m[12],m[13],m[14]],
            q:q,
            s:[sx,sy,sz]
        }
        
    },

    // for physx substep 

    applyTransformArray: ( v, p, q, s = [1,1,1] ) => {
        const e = M.composeMatrixArray( p, q, s )
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
            return M.quatNomalize(r);

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

        let q1 = M.quatFromEuler( rot );
        let q2 = M.quatInvert( b.quaternion.toArray() )
        return M.quatMultiply( q2, q1 )

        /*quat.setFromEuler( euler.fromArray( math.vectorad( rot ) ) )
        quat.premultiply( b.quaternion.invert() );
        return quat.toArray();*/

    },

    quatFromRotationMatrix: ( m ) => {

        let q = [0,0,0,1]

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

    quatFromEuler: ( r = [0,0,0], isDeg = true, order = 'XYZ' ) => {

        const cos = Math.cos;
        const sin = Math.sin;
        const n = isDeg ? torad : 1 
        const x = (r[0]*n) / 2, y = (r[1]*n) / 2, z = (r[2]*n) / 2
        const c1 = cos( x ), c2 = cos( y ), c3 = cos( z );
        const s1 = sin( x ), s2 = sin( y ), s3 = sin( z );

        let _x, _y, _z, _w

        switch ( order ) {

            case 'XYZ':
                _x = s1 * c2 * c3 + c1 * s2 * s3;
                _y = c1 * s2 * c3 - s1 * c2 * s3;
                _z = c1 * c2 * s3 + s1 * s2 * c3;
                _w = c1 * c2 * c3 - s1 * s2 * s3;
                break;

            case 'YXZ':
                _x = s1 * c2 * c3 + c1 * s2 * s3;
                _y = c1 * s2 * c3 - s1 * c2 * s3;
                _z = c1 * c2 * s3 - s1 * s2 * c3;
                _w = c1 * c2 * c3 + s1 * s2 * s3;
                break;

            case 'ZXY':
                _x = s1 * c2 * c3 - c1 * s2 * s3;
                _y = c1 * s2 * c3 + s1 * c2 * s3;
                _z = c1 * c2 * s3 + s1 * s2 * c3;
                _w = c1 * c2 * c3 - s1 * s2 * s3;
                break;

            case 'ZYX':
                _x = s1 * c2 * c3 - c1 * s2 * s3;
                _y = c1 * s2 * c3 + s1 * c2 * s3;
                _z = c1 * c2 * s3 - s1 * s2 * c3;
                _w = c1 * c2 * c3 + s1 * s2 * s3;
                break;

            case 'YZX':
                _x = s1 * c2 * c3 + c1 * s2 * s3;
                _y = c1 * s2 * c3 + s1 * c2 * s3;
                _z = c1 * c2 * s3 - s1 * s2 * c3;
                _w = c1 * c2 * c3 - s1 * s2 * s3;
                break;

            case 'XZY':
                _x = s1 * c2 * c3 - c1 * s2 * s3;
                _y = c1 * s2 * c3 - s1 * c2 * s3;
                _z = c1 * c2 * s3 + s1 * s2 * c3;
                _w = c1 * c2 * c3 + s1 * s2 * s3;
                break;

        }

        return [ _x, _y, _z, _w ]
        
    },

    quatFromAxis: ( r = [0,0,0], angle, isDeg = true ) => {

        const n = isDeg ? torad : 1 
        const halfAngle = (angle * 0.5) * n, s = Math.sin( halfAngle );
        return [
            r[0] * s,
            r[1] * s,
            r[2] * s,
            Math.cos( halfAngle )
        ]
        
    },

    quatNomalize: ( q ) => {
        let l = M.lengthArray( q )
        if ( l === 0 ) {
            return [0,0,0,1]
        } else {
            l = 1 / l;
            return M.scaleArray(q, l, 4)
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
        let s = Math.sqrt( 1 - q[3] * q[3] );

        if ( s < 0.00001 ) {
            // test to avoid divide by zero, s is always positive due to sqrt
            // if s close to zero then direction of axis not important
            // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToAngle/   
            s = 1
        } 
        
        return [ q[0] / s, q[1] / s, q[2] / s ]
        

        /*if ( s < 0.00001 ) {
            return [1,0,0]
        } else {
             return [ q[0] / s, q[1] / s, q[2] / s, w ]
        }*/
    },

    eulerFromMatrix: (te) => {

        const m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
        const m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
        const m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];

        let ar = [0,0,0]
        ar[1] = Math.asin( M.clamp( m13, - 1, 1 ) );
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

        return 2 * Math.acos( Math.abs( M.clamp( M.dotArray(a,b), - 1, 1 ) ) );

    },


    //-----------------------
    //  ARRAY
    //-----------------------

    fixedArray: ( a, p ) => { 

        let i = a.length
        let r = [];
        while(i--){ r[i] = M.toFixed(a[i], p); }
        return r;

    },

    getSize: ( r ) => ( ( r.byteLength * 0.001 ) +'kb' ),

    // Creates a vector normal (perpendicular) to the current Vector3 
    // TODO bug !!!! function from babylone js

    

     // computes a normalized vector perpendicular to the src

    perpendicularArray0: ( v ) => { 

        const x1 = v[0]
        const y1 = v[1]
        const z1 = v[2]

        const x2 = x1 * x1
        const y2 = y1 * y1
        const z2 = z1 * z1

        let d
        let axe// = 'X'

        if(x2<y2){
            if(x2<z2){
                axe = 'X'
            }else{
                axe = 'Z'
            }
        } else {
            if(y2<z2){
                axe = 'Y'
            } else {
                axe = 'Z'
            }
        }

        switch(axe){
            case 'X':
            d = 1 / Math.sqrt(y2 + z2);
            return [0, z1 * d, -y1 * d]
            break;
            case 'Y':
            d = 1 / Math.sqrt(z2 + x2);
            return [-z1 * d, 0, x1 * d]
            break;
            case 'Z':
            d = 1 / Math.sqrt(x2 + y2);
            return [y1 * d, -x1 * d, 0]
            break;
        }

    },
    /**
     * Creates a vector normal (perpendicular) to the current Vector3 and stores the result in the given vector
     * Out of the infinite possibilities the normal chosen is the one formed by rotating the current vector
     * 90 degrees about an axis which lies perpendicular to the current vector
     * and its projection on the xz plane. In the case of a current vector in the xz plane
     * the normal is calculated to be along the y axis.
     * Example Playground https://playground.babylonjs.com/#R1F8YU#230
     * Example Playground https://playground.babylonjs.com/#R1F8YU#231
     * @param result defines the Vector3 object where to store the resultant normal
     * @returns the result
     */
    perpendicularArray: ( v ) => { 

        const radius = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        let theta = Math.acos(v[1] / radius);
        const phi = Math.atan2(v[2], v[0]);

        //makes angle 90 degs to current vector
        /*if (theta > Math.PI / 2) {
            theta -= Math.PI / 2;
        } else {
            theta += Math.PI / 2;
        }*/

        //console.log(theta < PI90)
        //makes angle 90 degs to current vector
        //if( theta > PI90 ) theta -= PI90;
        //else 
         theta -= PI90;
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
        let i = a.length
        while(i--){ if(a[i]!==b[i]) return false; }
        return true;
    },
    
    lerpArray: ( a, b, t ) => {
        if ( t === 0 ) return a;
        if ( t === 1 ) return b;
        let i = a.length
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

    divArray: ( r, s, i ) => ( M.mulArray( r, 1/s, i ) ),

    scaleArray: ( r, s, i ) => ( M.mulArray( r, s, i ) ),

    fillArray: ( a, b, n = 0, i ) => {
        i = i ?? a.length;
        while( i-- ) b[n+i] = a[i];
    },

    copyArray: ( a, b ) => { a = [...b]; },

    cloneArray: ( a ) => ( [...a] ),

    distanceArray: ( a, b = [0,0,0] ) => ( M.lengthArray( M.subArray( a, b ) ) ),

    normalizeArray: ( a ) => ( M.divArray( a, M.lengthArray(a) || 1 ) ),

    normalArray: ( a, b = [0,0,0] ) => ( M.normalizeArray( M.subArray( b, a ) ) ),

    //-----------------------
    //  VOLUME
    //-----------------------

    getCenter:( g, center ) => {

        g.computeBoundingBox();
        return g.boundingBox.getCenter( center );

    },

    getVolume: ( type, size, vertex = null ) => {

        let volume = 1
        let s = size

        switch(type){
            
            case 'sphere' : volume = (4*Math.PI*s[0]*s[0]*s[0])/3; break;
            case 'cone' : volume = Math.PI * s[0] * (s[1] * 0.5) * 2; break;
            case 'box' : volume = 8 * (s[0]*0.5)*(s[1]*0.5)*(s[2]*0.5); break;
            case 'cylinder' : volume = Math.PI * s[0] * s[0] * (s[1] * 0.5) * 2; break;
            case 'capsule' : volume = ( (4*Math.PI*s[0]*s[0]*s[0])/3) + ( Math.PI * s[0] * s[0] * (s[1] * 0.5) * 2 ); break;
            case 'convex' : case 'mesh' : volume = M.getConvexVolume( vertex ); break;

        }

        return volume;

    },

    getConvexVolume: ( v ) => {

        let i = v.length / 3, n;
        let min = [0, 0, 0]
        let max = [0, 0, 0]

        while(i--){

            n = i*3
            if ( v[n] < min[0] ) min[0] = v[n]
            else if (v[n] > max[0]) max[0] = v[n]
            if ( v[n+1] < min[1] ) min[1] = v[n+1]
            else if (v[n+1] > max[1]) max[1] = v[n+1]
            if ( v[n+2] < min[2] ) min[2] = v[n+2]
            else if (v[n+2] > max[2]) max[2] = v[n+2]

        }

        let s = [ max[0]-min[0], max[1]-min[1], max[2]-min[2] ]

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

        const tmppos = []
        const pos = []
        const sameId = {}

        const vertex = new THREE.Vector3();
        let n = 0, jcount

        const hashTable = M.getHash(g)

        let p1, p2, same = false

        let idx = 0

        for ( let i = 0; i < positionAttribute.count; i ++ ) {

            n = i*3
            p1 = { x:ar[n], y:ar[n+1], z:ar[n+2], id:i };
            same = false
            
            jcount = tmppos.length
            for ( let j = 0; j < jcount; j ++ ) {
                p2 = tmppos[j]
                if( p1.x === p2.x && p1.y === p2.y && p1.z === p2.z ){ 
                    same = true
                    sameId[i] = p2.id
                    //console.log(i+' have same index than '+p2.id)
                }  
            }

            if(!same){ 
                //if(!sameId[i])sameId[i] = i
                p1.id = idx++
                tmppos.push(p1)
                pos.push([ p1.x, p1.y, p1.z ])
            }

        }

        //console.log(tmppos)

        return [pos, sameId]


    },

    getVertex: ( g, noIndex ) => {
        
        let c = g.attributes.position.array;

        if( noIndex && g.index ){
            g = g.clone().toNonIndexed()
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
        }else{
            let lng = g.getAttribute( 'position' ).count;
            for ( let i = 0; i < lng; i += 3 ) {
                faces.push([i, i+1, i+2] );
            }
        }
        return faces;

    },

    getConnectedFaces: ( faces ) => {

        const connected = []
        let lng = faces.length
        let i = lng, j, fa, fb, common, d = 0
        let tmp, nx, final
        while(i--){
            fa = faces[i]
            j = lng
            while(j--){
                if(j !== i){
                    //d = 0
                    fb = faces[j]
                    common = fa.filter(item => fb.includes(item));
                    if(common.length>1){

                        final = []

                        tmp = [...fa]
                        nx = tmp.indexOf(common[0])
                        tmp.splice(nx, 1)
                        nx = tmp.indexOf(common[1])
                        tmp.splice(nx, 1)
                        final.push(tmp[0])

                        tmp = [...fb]
                        nx = tmp.indexOf(common[0])
                        tmp.splice(nx, 1)
                        nx = tmp.indexOf(common[1])
                        tmp.splice(nx, 1)
                        final.push(tmp[0])

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
        const indices = null//geometry.getIndex();
        const positions = geometry.getAttribute( 'position' );
        const vertexCount = indices ? indices.count : positions.count;
        //const vertexCount = positions.count;

        const ar = positions.array

        const halfTolerance = tolerance * 0.5;
        const exponent = Math.log10( 1 / tolerance );
        const mul = Math.pow( 10, exponent );
        const add = halfTolerance * mul;

        let n;
        

        for ( let i = 0; i < vertexCount; i ++ ) {

            const index = indices ? indices.getX( i ) : i;
            n = index*3
            // Generate a hash for the vertex attributes at the current index 'i'
            let hash = `${ ~ ~ ( ar[n] * mul + add ) },${ ~ ~ ( ar[n+1] * mul + add ) },${ ~ ~ ( ar[n+2] * mul + add ) }`;

            if(hashToIndex[hash]) hashToIndex[hash].push(i)
            else hashToIndex[hash] = [i]

        }

        let id = 0

        for(let h in hashToIndex){
            hashTable[id++] = hashToIndex[h]
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

}

export const MathTool = M;

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