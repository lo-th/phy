export const Max = {
	body:4000,
    joint:1000,
    contact:50,
    ray:100,
    character:50,
    vehicle:50,
    solver:20,
    //terrain:10,
}

export const Num = {
	bodyFull:14,
    body:8,
    joint:16,
    contact:8,
    ray:11,
    character:16,
    vehicle:72,//max 8 wheels
    solver:128,//256,
    //terrain:1,
}

export const getArray = function ( engine, full = false ){

    let ArPos = {}

    let counts = {
        body: Max.body * ( full ? Num.bodyFull : Num.body ),
        joint: Max.joint * Num.joint,
        ray: Max.ray * Num.ray,
        contact: Max.contact * Num.contact,
        character: Max.character * Num.character
    }

    if( engine === 'PHYSX' || engine === 'AMMO' ){ 
        counts['vehicle'] = Max.vehicle * Num.vehicle;
    }

    if( engine === 'PHYSX' ){ 
        counts['solver'] = Max.solver * Num.solver;
    }

    if( engine === 'HAVOK' || engine === 'RAPIER' ){ 
        Num.joint = 0;
    }

    let prev = 0;

    for( let m in counts ){ 

        ArPos[m] = prev
        prev += counts[m]

    }

    ArPos['total'] = prev

    return ArPos

}

export const getType = function ( o ) {
    switch( o.type ){
        case 'plane': case 'box': case 'sphere': case 'highSphere': case 'cylinder': case 'stair':case 'particle':
        case 'cone': case 'capsule': case 'mesh': case 'convex': case 'compound': case 'null':
            if ( !o.mass && !o.density && !o.kinematic ) return 'solid'
            else return 'body'
        break;
        case 'generic': case 'hinge': case 'slider': case 'spherical': case 'fixe':
        case "dof": case "d6": case 'ragdoll': case 'universal': case 'cylindrical': case "distance":
        case 'revolute': case "prismatic": 
            return 'joint'
        break;
        default: 
            return o.type 
        break;
    }
}

export const MathTool = {

    torad: Math.PI / 180,
    todeg: 180 / Math.PI,

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

    composeArray: ( p, q, s = [1,1,1] ) => {
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

    applyTransformArray: ( v, p, q, s = [1,1,1] ) => {
        const e = MathTool.composeArray( p, q, s )
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