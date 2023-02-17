
/** __
*    _)_|_|_
*   __) |_| | 2022
* @author lo.th / https://github.com/lo-th
*/

import {
    Euler,Matrix4,Vector3, Quaternion
} from 'three';

export const math = {

	torad: Math.PI / 180,
	todeg: 180 / Math.PI,
	Pi: Math.PI,
	TwoPI: Math.PI*2,
	PI90: Math.PI*0.5,
	PI45: Math.PI*0.25,
	PI270: (Math.PI*0.5)*3,
	inv255: 0.003921569,
	golden: 1.618033,
	epsilon: Math.pow( 2, - 52 ),

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
		let i = ar.length
		while( i-- ) ar[i] = math.lerp( arx[i], ary[i], t )
	},

    unwrapDeg: ( r ) => (r - (Math.floor((r + 180)/360))*360), 
	//unwrapRad: ( r ) => (r - (Math.floor((r + Math.PI)/(2*Math.PI)))*2*Math.PI),
	unwrapRad: ( r ) => ( Math.atan2(Math.sin(r), Math.cos(r)) ),


	scaleArray: ( ar, scale ) => {

		var i = ar.length;
		while( i-- ){ ar[i] *= scale };
		return ar;

	},

	addArray: ( ar, ar2 ) => {

		var r = []
		var i = ar.length;
		while( i-- ){ r[i] = ar[i] + ar2[i] };
		return r;

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
	tmpQ: new Quaternion(),

	fromTransformToQ: ( p, q, inv ) => {

		inv = inv || false;

		math.tmpM.compose( math.tmpV.fromArray( p ), math.tmpQ.fromArray( q ), { x:1, y:1, z:1 } );
		math.tmpM.decompose( math.tmpV, math.tmpQ, { x:1, y:1, z:1 } );

		//math.tmpQ.fromArray( q )

		if(inv) math.tmpQ.invert();

		return math.tmpQ.toArray();

	},

	fromTransform: ( p, q, p2, q2, inv ) => {

		inv = inv || false;
		q2 = q2 || [0,0,0,1];

		math.tmpM.compose( math.tmpV.fromArray( p ), math.tmpQ.fromArray( q ), { x:1, y:1, z:1 } );
		math.tmpM2.compose( math.tmpV.fromArray( p2 ), math.tmpQ.fromArray( q2 ), { x:1, y:1, z:1 } );
		if( inv ){
			//math.tmpM.getInverse( math.tmpM );
			math.tmpM.invert();
			math.tmpM.multiply( math.tmpM2 );
		} else {
			math.tmpM.multiply( math.tmpM2 );
		}

		math.tmpM.decompose( math.tmpV, math.tmpQ, { x:1, y:1, z:1 } );

		return math.tmpV.toArray();

	},

	arCopy: ( a, b ) => {

		a = [...b]

		//for( var i = 0; i< b.length; i++ ) a[i] = b[i];

	},

	axisToQuatArray: ( r, isdeg ) => { // r[0] array in degree

		isdeg = isdeg || false;
		return math.tmpQ.setFromAxisAngle( math.tmpV.fromArray( r, 1 ), isdeg ? r[0]*math.torad : r[0]).normalize().toArray();

	},

	toQuatArray: ( rotation ) => { // rotation array in degree

		return math.tmpQ.setFromEuler( math.tmpE.fromArray( math.vectorad( rotation ) ) ).toArray();

	},

	vectorad: ( r ) => {

		let i = 3, nr = [];
	    while ( i -- ) nr[ i ] = r[ i ] * math.torad;
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

	    return '0x' + ( '000000' + ( ( rgb[0] * 255 ) << 16 ^ ( rgb[1] * 255 ) << 8 ^ ( rgb[2] * 255 ) << 0 ).toString( 16 ) ).slice( - 6 );

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

	    return '#' + ( '000000' + ( ( rgb[0] * 255 ) << 16 ^ ( rgb[1] * 255 ) << 8 ^ ( rgb[2] * 255 ) << 0 ).toString( 16 ) ).slice( - 6 );

	},


	//--------------------
	//   NOISE
	//--------------------

	perlin: null,

	resetPerlin:()=>{
		if( math.perlin !== null ) math.perlin = null
	},

	noise: ( v, o ) => {

	    if( math.perlin === null ) math.perlin = new SimplexNoise();

	    o = o || {};

	    let level = o.level || [1,0.2,0.05];
	    let frequency  = o.frequency  || [0.016,0.05,0.2];

	    let i, f, c=0, d=0;

	    for(i=0; i<level.length; i++){

	        f = frequency [i];
	        c += level[i] * ( 0.5 + math.perlin.noise3d( v.x*f, v.y*f, v.z*f ) * 0.5 );
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

}

export class SimplexNoise {

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
