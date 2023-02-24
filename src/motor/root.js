import {
    SphereGeometry, PlaneGeometry, CylinderGeometry, BoxGeometry,
    MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, LineBasicMaterial,
    Matrix4, Euler, Quaternion, Vector3, Vector2, Color,
    Box3Helper, DoubleSide,
} from 'three';


export const map = new Map()

/*export const Max = {
	body:2000,
    joint:100,
    contact:50,
    vehicle:20,
    character:20,
    solver:20,
    ray:50,
}

export const Num = {
	body:11,
    joint:16,
    contact:8,
    vehicle:64,
    character:16,
    solver:256,
    ray:8,
}*/

//-------------------
//
//  ROOT
//
//-------------------

export const root = {

	engine:'OIMO',
	scene : null,
	scenePlus : null,
	post : null,
	up:null,
	update:null,
	delta:0,
	add:null,
	remove:null,
	items:null,
	//bodyRef:null,
	//characterRef:null,
	tmpMesh : [],
	instanceMesh : {},
	tmpTex : [],
	tmpMat : [],
	flow:{
		tmp:[],
		key:[],
		add:[],
		remove:[],
		point:[]
	},
	reflow:{
		ray:[],
		stat:{ fps:0 },
	},

	extraMaterial:() => {},
	
	disposeTmp:() => {

		// clear temporary mesh
		let i, j, m
		for( i in root.tmpMesh ) {
			m = root.tmpMesh[i]
			if( m.children ){
				for( j in m.children ) root.disposeMesh( m.children[j] )
			}
			root.disposeMesh( m )
			if( m.parent ) m.parent.remove( m )
		}
		root.tmpMesh = []

		// clear temporary textures
		for( i in root.tmpTex ) root.tmpTex[i].dispose()

	},

	disposeMesh:( m ) => {
		if( m.geometry ) m.geometry.dispose()
		if( m.dispose ) m.dispose()
	},

}


//-------------------
//
//  UTILS
//
//-------------------

export const Utils = {

	byName: ( name ) => {

		if ( !map.has( name ) ) return null;
		return map.get( name );

	},

	add: ( b, parent ) => {

		if( b.type !== 'contact' && !b.isInstance && b.isObject3D ){

			//console.log('add', b.name, b.type )

			if(!parent){
				switch( b.type ){
					case 'terrain': case 'solid': case 'joint': case 'ray': case 'articulation': root.scenePlus.add( b ); break;
					default: root.scene.add( b ); break;
				}
			} else {
				parent.add( b );
			}

		}

		//console.log('add', b.name, b.type )

		map.set( b.name, b );

	},

	remove:( b ) => {

		if( b.dispose ) b.dispose()
		if( b.parent ) b.parent.remove( b )
		if( b.instance ) b.instance.remove( b.id )
		map.delete( b.name );

	},

	noRay:( b ) => {
		if( b.isObject3D ){
			b.raycast = () => {return}
			b.traverse( ( child ) => {
				if ( child.isObject3D ) child.raycast = () => {return}
			})

		}
	},

    morph: ( obj, name, value ) => {
        
        if(!obj.morphTargetInfluences) return
        if(obj.morphTargetDictionary[name] === undefined ) return
        obj.morphTargetInfluences[ obj.morphTargetDictionary[name] ] = value;
    
    },

}


//-------------------
//
//  GEOMETRY
//
//-------------------

let geoN = 0;
let geo = {}

export const Geo = {

	unic: ( g ) => {

		geo[ 'geo' + geoN++ ] = g

	},

	set: ( g ) => {

		//console.log( g.name )
		geo[g.name] = g

	},

	get: ( name, o = {} ) => {

		if( !geo[name] ){
			let g;
			switch( name ){
				case 'plane':    g = new PlaneGeometry(1,1); g.rotateX( -Math.PI * 0.5 ); break
				case 'box':      g = new BoxGeometry(1,1,1); break
				case 'sphere':   g = new SphereGeometry( 1, 16, 12 ); break
				case 'cylinder': g = new CylinderGeometry( 1, 1, 1 , 16 ); break
				//case 'wheel':    g = new CylinderGeometry( 1, 1, 1 , 16 ); g.rotateX( -Math.PI * 0.5 ); break
				case 'cone':     g = new CylinderGeometry( 0.001, 1, 1 , 16 ); break
				case 'joint':    g = new Box3Helper().geometry; g.scale( 0.05,0.05,0.05 ); break
				default: return null;
			}
			geo[name] = g;
		}

		return geo[name]
		
	},

	dispose: () => {
		//console.log( geo )
		for( let n in geo ) geo[n].dispose()
		geo = {}
		geoN = 0

	}

}



//-------------------
//
//  MATERIAL
//
//-------------------

const matExtra = {

	//clearcoat:1.0,
	//clearcoatRoughness:0.1,
	metalness: 0.6,
	roughness: 0.3,
	//normalScale: new Vector2(0.25,0.25),

}

export const Colors = {

	body:new Color( 0xFF934F ).convertSRGBToLinear(),
	sleep:new Color( 0x939393 ).convertSRGBToLinear()//0x46B1C9

}

export const mat = {}

export const Mat = {

	set:( m ) => {

		root.extraMaterial( m )
		mat[m.name] = m

	},

	get:( name ) => {

		if( !mat[name] ){
			//console.log(name)
			let m;
			switch( name ){

				case 'base':   m = new MeshStandardMaterial({ color:0xffffff, ...matExtra }); break
				case 'simple': m = new MeshStandardMaterial({ color:0x808080, metalness: 0, roughness: 1 }); break
				case 'body':   m = new MeshStandardMaterial({ color:0xFF934F, ...matExtra }); break
				case 'clear':   m = new MeshStandardMaterial({ color:0xFFFFFF, metalness: 0.5, roughness: 0 }); break
				case 'sleep':  m = new MeshStandardMaterial({ color:0x939393, ...matExtra }); break//0x46B1C9
				case 'solid':  m = new MeshStandardMaterial({ color:0x3C474B, ...matExtra }); break
				case 'hero':   m = new MeshStandardMaterial({ color:0x00FF88, ...matExtra }); break
				case 'skinny':   m = new MeshStandardMaterial({ color:0xe0ac69, ...matExtra }); break
				case 'chrome': m = new MeshStandardMaterial({ color:0xCCCCCC, metalness: 1, roughness:0 }); break
				case 'glass':  m = new MeshPhysicalMaterial({ color:0xFFFFff, transparent:true, opacity:0.8, depthTest:true, depthWrite:false, roughness:0.02, metalness:0.0, /*side:DoubleSide,*/ alphaToCoverage:true, premultipliedAlpha:true, transmission:1, clearcoat:1, thickness:0.02  }); break
				case 'plexi':  m = new MeshPhysicalMaterial({ color:0xFFFFff, transparent:true, opacity:0.4, metalness: 1, roughness:0, clearcoat:1 }); break
				case 'glass2': m = new MeshPhysicalMaterial({ color:0xCCCCff, transparent:true, opacity:0.3  }); break
				case 'sat': m = new MeshPhysicalMaterial({ color:0xffffff, metalness: 1, roughness:0, clearcoat:1  }); break
				
				case 'car':   m = new MeshPhysicalMaterial({ color:0x303030, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5 }); break
				case 'carGlass':   m = new MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0 }); break

				case 'joint':  m = new LineBasicMaterial( { color: 0x00FF00, toneMapped: false } ); break
				case 'ray':    m = new LineBasicMaterial( { vertexColors: true, toneMapped: false } ); break	

				case 'debug':  m = new MeshBasicMaterial({ color:0x000000, wireframe:true, toneMapped: false }); break
				case 'debug2': m = new MeshBasicMaterial({ color:0x00FFFF, wireframe:true, toneMapped: false }); break
				case 'debug3':  m = new MeshBasicMaterial({ color:0x000000, wireframe:true, transparent:true, opacity:0.05, toneMapped: false, depthTest:true, depthWrite:false }); break

				case 'shadows': m = new MeshBasicMaterial({ transparent:true, opacity:0.01 }); break
				case 'hide': m = new MeshBasicMaterial({ visible:false }); break

			}
			m.name = name;
			root.extraMaterial( m )
			mat[name] = m
		}

		return mat[name]

	},

	dispose:() => {

		for(let m in mat){
			mat[m].dispose()
			delete mat[m]
		}

		let i = root.tmpMat.length
		while( i-- ) root.tmpMat[i].dispose()
		root.tmpMat = []

	}

}


//-------------------
//
//  MATH
//
//-------------------

export const torad = Math.PI / 180
export const todeg = 180 / Math.PI

export const euler = new Euler()
export const quat = new Quaternion()

/*const tmpMtx = new Matrix4()
const tmpP = new Vector3()
const tmpS = new Vector3()
const tmpQ = new Quaternion()
*/

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

	tmpE: new Euler(),
	tmpM: new Matrix4(),
	tmpM2: new Matrix4(),
	tmpQ: new Quaternion(),
	tmpV: new Vector3(),

	clampA: ( v, min, max ) => { 
		return Math.max( min, Math.min( max, v ))
	},

	clamp: ( v, min, max ) => { 
		v = v < min ? min : v;
	    v = v > max ? max : v;
	    return v;
	},

	int: (x) => ( Math.floor(x) ),
	toFixed: ( x, n = 3 ) => ( x.toFixed(n) * 1 ),

	lerp: ( x, y, t ) => ( ( 1 - t ) * x + t * y ),
	lerpAr: ( ar, arx, ary, t ) => {
		let i = ar.length
		while( i-- ) ar[i] = math.lerp( arx[i], ary[i], t )
	},

	randomSign: () => ( Math.random() < 0.5 ? -1 : 1 ),
	randSpread: ( range ) => ( range * ( 0.5 - Math.random() ) ),
	rand: ( low = 0, high = 1 ) => ( low + Math.random() * ( high - low ) ),
	randInt: ( low, high ) => ( low + Math.floor( Math.random() * ( high - low + 1 ) ) ),

	nearEquals: ( a, b, t ) => ( Math.abs(a - b) <= t ? true : false ),

	angleDistance:(cur, prv)=> {
		var diff = (cur - prv + 180) % 360 - 180;
		return diff < -180 ? diff + 360 : diff;
	},

	nearAngle: ( s1, s2, deg = false ) => ( s2 + Math.atan2(Math.sin(s1-s2), Math.cos(s1-s2)) * (deg ? root.todeg : 1) ),

	unwrapDeg: ( r ) => (r - (Math.floor((r + 180)/360))*360), 
	//unwrapRad: ( r ) => (r - (Math.floor((r + Math.PI)/(2*Math.PI)))*2*Math.PI),
	unwrapRad: ( r ) => ( Math.atan2(Math.sin(r), Math.cos(r)) ),

	autoSize: ( s = [ 1, 1, 1 ], type = 'box' ) => {

		//let s = o.size === undefined ? [ 1, 1, 1 ] : o.size;
		if ( s.length === 1 ) s[ 1 ] = s[ 0 ];

		let radius =  s[0];
		let height =  s[1];

		if( type === 'sphere' ) s = [ radius, radius, radius ];
		if( type === 'cylinder' || type === 'wheel' || type === 'capsule' ) s = [ radius, height, radius ];
		if( type === 'cone' || type === 'pyramid' ) s = [ radius, height, radius ];

	    if ( s.length === 2 ) s[ 2 ] = s[ 0 ];
	    return s;

	},

	distance: ( a, b = { x:0, y:0, z:0 } ) => { // rotation array in degree

		const dx = a.x ? a.x - b.x : 0
		const dy = a.y ? a.y - b.y : 0
		const dz = a.z ? a.z - b.z : 0
		return Math.sqrt( dx * dx + dy * dy + dz * dz );

	},

	toQuatArray: ( rot = [0,0,0] ) => { // rotation array in degree

		return quat.setFromEuler( euler.fromArray( math.vectorad( rot ) ) ).toArray();

	},

	toLocalQuatArray: ( rot = [0,0,0], b ) => { // rotation array in degree

		quat.setFromEuler( euler.fromArray( math.vectorad( rot ) ) )
		quat.premultiply( b.quaternion.invert() );
		return quat.toArray();

	},

	vecAdd: ( a, b ) => {

		let i = a.length, r = [];
	    while ( i -- ) r[i] = a[ i ] + b[ i ];
	    return r;

	},

	vecSub: ( a, b ) => {

		let i = a.length, r = [];
	    while ( i -- ) r[i] = a[ i ] - b[ i ];
	    return r;

	},

	addArray:( a, b ) => ( math.vecAdd(a,b) ),

	vectorad: ( r ) => {

		let i = 3, nr = [];
	    while ( i -- ) nr[ i ] = r[ i ] * torad;
	    nr[3] = r[3];
	    return nr;

	},

	scaleArray: ( ar, scale ) => {

		var i = ar.length;
		while( i-- ){ ar[i] *= scale };
		return ar;

	},

	getIndex: ( g ) => {

		//console.log( 'i', g.index )
		//let c = new Uint32Array( g.index.array ) || null

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

	arCopy: ( a, b ) => { a = [...b] },

	////////

	fromTransformToQ: ( p, q, inv ) => {

		inv = inv || false;
		math.tmpM.compose( math.tmpV.fromArray( p ), math.tmpQ.fromArray( q ), { x:1, y:1, z:1 } );
		math.tmpM.decompose( math.tmpV, math.tmpQ, { x:1, y:1, z:1 } );
		if(inv) math.tmpQ.invert();
		return math.tmpQ.toArray();

	},

	fromTransform: ( p, q, p2, q2, inv ) => {

		inv = inv || false;
		q2 = q2 || [0,0,0,1];

		math.tmpM.compose( math.tmpV.fromArray( p ), math.tmpQ.fromArray( q ), { x:1, y:1, z:1 } );
		math.tmpM2.compose( math.tmpV.fromArray( p2 ), math.tmpQ.fromArray( q2 ), { x:1, y:1, z:1 } );
		if( inv ){
			math.tmpM.invert();
			math.tmpM.multiply( math.tmpM2 );
		} else {
			math.tmpM.multiply( math.tmpM2 );
		}

		math.tmpM.decompose( math.tmpV, math.tmpQ, { x:1, y:1, z:1 } );

		return math.tmpV.toArray();

	},

	axisToQuatArray: ( r, isdeg ) => { // r[0] array in degree

		isdeg = isdeg || false;
		return math.tmpQ.setFromAxisAngle( math.tmpV.fromArray( r, 1 ), isdeg ? r[0]*math.torad : r[0]).normalize().toArray();

	},

	toQuatArray: ( rotation ) => { // rotation array in degree

		return math.tmpQ.setFromEuler( math.tmpE.fromArray( math.vectorad( rotation ) ) ).toArray();

	},

	/*static transform ( p = [0,0,0], q = [0,0,0,1], s = [1,1,1] ) {

		tmpMtx.compose( tmpP.fromArray(p), tmpQ.fromArray(q), tmpS.fromArray(s) )
		return tmpMtx;

	}*/


}