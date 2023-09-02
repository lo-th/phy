export const PI = Math.PI;
export const torad = PI / 180;
export const todeg = 180 / PI;
export const max32 = Number.MAX_SAFE_INTEGER;
export const EPSILON = Number.EPSILON;//0.00001;

export const TwoPI = PI * 2;
export const PI90 = PI*0.5;
export const PI45 = PI*0.25;
export const PI270 = (PI*0.5)*3;

export const inv255 = 0.003921569;
export const GOLD = 1.618033;


const M = {

    //-----------------------
    //  MATH
    //-----------------------

    todeg:todeg,
    torad:torad,

    toFixed: ( x, n = 3 ) => ( x.toFixed(n) * 1 ),
    toRound: ( x, n = 3 ) => ( Math.trunc(x) ),

    clamp: ( v, min, max ) => {
        v = v < min ? min : v;
        v = v > max ? max : v;
        return v;
    },

    clampA: ( v, min, max ) => ( Math.max( min, Math.min( max, v ) ) ),

    lerp: ( x, y, t ) => ( ( 1 - t ) * x + t * y ),
    damp: ( x, y, lambda, dt ) => ( M.lerp( x, y, 1 - Math.exp( - lambda * dt ) ) ),

    nearAngle: ( s1, s2, deg = false ) => ( s2 + Math.atan2(Math.sin(s1-s2), Math.cos(s1-s2)) * (deg ? todeg : 1) ),

    unwrapDeg: ( r ) => ( r - (Math.floor((r + 180)/360))*360 ), 
    //unwrapRad: ( r ) => (r - (Math.floor((r + Math.PI)/(2*Math.PI)))*2*Math.PI),
    unwrapRad: ( r ) => ( Math.atan2(Math.sin(r), Math.cos(r)) ),

    nearEquals: ( a, b, t ) => ( Math.abs(a - b) <= t ? true : false ),

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

    decomposeMatrixArray: ( m ) => {

        return [
            m[12],m[13],m[14],
            
        ]
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

    quatFromEuler: ( r = [0,0,0], isDeg = true ) => {

        const cos = Math.cos;
        const sin = Math.sin;
        const n = isDeg ? torad : 1 
        const x = (r[0]*n) * 0.5, y = (r[1]*n) * 0.5, z = (r[2]*n) * 0.5
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

    mulArray: ( r, s, i ) => {
        i = i ?? r.length;
        while ( i-- ) r[i] *= s;
        return r;
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


    //-----------------------
    //  VOLUME
    //-----------------------

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


    // GEOMETRY

    getIndex: ( g, noIndex ) => {

        if( !g.index || noIndex ) return null
        return g.index.array || null

    },

    getVertex: ( g, noIndex ) => {
        
        let c = g.attributes.position.array;

        if( noIndex ){
            let h = g.clone().toNonIndexed()
            c = h.attributes.position.array;
        }

        return c;

    },

    /*getFaces: ( g ) => {
        
        const index = g.getIndex();
        const position = g.getAttribute( 'position' );
        const faces = [];
        const vv = []

        for ( let i = 0; i < index.count; i += 3 ) {
            const face = {
                a: index.getX(i),
                b: index.getX(i+1),
                c: index.getX(i+2),
            };
            faces.push(face);
        }

        for( let j = 0; j < faces.length; j ++ ) {
            let face = faces[j]
            vv.push( 
                position.getX(face.a), position.getY(face.a), position.getZ(face.a),
                position.getX(face.b), position.getY(face.b), position.getZ(face.b),
                position.getX(face.c), position.getY(face.c), position.getZ(face.c),
            )
        }

        return vv;

    },*/

    reduce: ( x ) => {
    },

    barycentric: ( simplex, point ) => {
    },

    solve: ( simplex, point ) => {
    }

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