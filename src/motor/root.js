import {
    SphereGeometry, PlaneGeometry, CylinderGeometry, BoxGeometry,
    MeshPhongMaterial, MeshLambertMaterial, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, LineBasicMaterial,
    Matrix4, Euler, Quaternion, Vector3, Vector2, Matrix3, Color,
    Box3Helper, DoubleSide,
} from 'three';
import { CircleHelper } from '../3TH/helpers/CircleHelper.js';
//import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
export const map = new Map()

//-------------------
//
//  ROOT
//
//-------------------

export const root = {

	AR:null,

	engine:'OIMO',
	motor: null,
	scene : null,
	scenePlus : null,
	threeScene : null,
	post : null,
	//up:null,
	//update:null,
	//change:null,
	jointVisible:false,
	delta:0,
	add:null,
	remove:null,
	items:null,
	tmpMesh : [],
	instanceMesh : {},
	tmpTex : [],
	tmpMat : [],

	hideMaterial: null,
	lineMaterial: null,

	mouseDown:false,
	flow:{
		stamp:0,
		current:'',
		key:[],
		tmp:[],
		add:[],
		remove:[]
	},
	reflow:{
		ray:[],
		stat:{ fps:0 },
		point:{},
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
				if(b.isButton){ root.scene.add( b ); }
				else {
					switch( b.type ){
						case 'terrain': case 'solid': case 'joint': case 'ray': case 'articulation': root.scenePlus.add( b ); break;
						default: root.scene.add( b ); break;
					}
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


    toLocal: ( v, obj, isAxe = false ) => {

    	//if( obj.isObject3D ) obj.updateWorldMatrix( true, false )
    	// apply position
    	if(!isAxe) v.sub( obj.position )
    	// apply invers rotation
    	let q = obj.quaternion
    	//v.applyQuaternion(q.clone().invert())
    	//v.applyQuaternion({x:-q.x, y:-q.y, z:-q.z, w:q.w})
    	v.applyQuaternion({x:-q._x, y:-q._y, z:-q._z, w:q._w})
    	//if(isAxe) v.normalize()
    	return v

    },

    quatLocal: ( q, obj ) => {

    	if( obj.isObject3D ) obj.updateWorldMatrix( true, false )
    	// apply position
    	//if(!isAxe) v.sub( obj.position )
    	// apply invers rotation
    	let q1 = new Quaternion().fromArray(q)
    	let q2 = obj.quaternion.clone().invert()
    	q1.premultiply(q2)
    	//v.applyQuaternion({x:-q.x, y:-q.y, z:-q.z, w:q.w})
    	return q1.normalize().toArray()

    },

    axisLocal: ( v, obj ) => {

    	if( obj.isObject3D ) obj.updateWorldMatrix( true, false )
    	// apply position

        let m3 = new Matrix3().setFromMatrix4( obj.matrixWorld )//.invert()
        //m3.invert()
        let vv = new Vector3().fromArray(v).applyMatrix3( m3 )

        //let vv = new Vector3().fromArray(v).applyMatrix4( obj.matrixWorld.clone().invert() );

    	return vv.toArray()

    },


    quatToAngular: ( qb, qa ) => {

    	/*const qq1 = new Quaternion().fromArray(qa);
    	const qq2 = new Quaternion().fromArray(qb);
    	//qq1.normalize()
    	//qq2.normalize();



    	qq2.multiply( qq1.invert() )*/

    	// invert
    	qa[0] *= -1
    	qa[1] *= -1
    	qa[2] *= -1

    	let x = qa[0] * qb[3] + qa[3] * qb[0] + qa[1] * qb[2] - qa[2] * qb[1];
		let y = qa[1] * qb[3] + qa[3] * qb[1] + qa[2] * qb[0] - qa[0] * qb[2];
		let z = qa[2] * qb[3] + qa[3] * qb[2] + qa[0] * qb[1] - qa[1] * qb[0];
		let w = qa[3] * qb[3] - qa[0] * qb[0] - qa[1] * qb[1] - qa[2] * qb[2];

    	let angle = 2 * Math.acos(w), ax;
	    let s = Math.sqrt(1-w*w); // assuming quaternion normalised then w is less than 1, so term always positive.
	    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
	        // if s close to zero then direction of axis not important
	        // if it is important that axis is normalised then replace with x=1; y=z=0;
	        ax = [0,0,0]
	    } else {
	        //x = q[0] / s; // normalise axis
	        ax =  [x / s,y / s,z / s]
        }



    	/*const matrix1 = new Matrix4().makeRotationFromQuaternion(qq1);
    	const matrix2 = new Matrix4().makeRotationFromQuaternion(qq2);

    	matrix2.multiply(matrix1.invert())

    	const v = new Vector3().applyMatrix4(matrix2);
    	const angle = Math.acos((matrix2.elements[0] + matrix2.elements[5] + matrix2.elements[10] - 1) / 2);
*/
        const v = new Vector3().fromArray(ax)
    	const timeDiff = 1//time2 - time1;
    	const angularVelocity = v.multiplyScalar( angle / timeDiff );

    	console.log('result',v)

    },

   /* matrixToAxix: ( m ) => {

    	let p = new Vector3(1,0,0).transformDirection( m )
    	return p.toArray()

    },*/

    refAxis:( m, axe ) => {

    	let zAxis = new Vector3().fromArray(axe)
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
				//case 'joint':    g = new Box3Helper().geometry; g.scale( 0.05,0.05,0.05 ); break

				case 'joint':    g = new CircleHelper().geometry; break
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

	body:new Color( 0xFF934F ),//.convertSRGBToLinear(),
	sleep:new Color( 0x939393 )//.convertSRGBToLinear()//0x46B1C9

}

export const mat = {}

export const Mat = {

	set:( m, direct ) => {

		if(!direct) root.extraMaterial( m )
		mat[m.name] = m

		//console.log( m.name )

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
				case 'solid':  m = new MeshStandardMaterial({ color:0xDDDDDD, ...matExtra }); break
				
				//case 'hero':   m = new MeshStandardMaterial({ color:0x00FF88, ...matExtra }); break
				case 'skinny':   m = new MeshStandardMaterial({ color:0xe0ac69, ...matExtra }); break
				case 'chrome': m = new MeshStandardMaterial({ color:0xCCCCCC, metalness: 1, roughness:0.2 }); break
				case 'glass':  m = new MeshPhysicalMaterial({ color:0xFFFFff, transparent:true, opacity:0.8, depthTest:true, depthWrite:false, roughness:0.02, metalness:0.0, /*side:DoubleSide,*/ alphaToCoverage:true, premultipliedAlpha:true, transmission:1, clearcoat:1, thickness:0.02  }); break
				case 'glassX':  m = new MeshPhysicalMaterial({ color:0xFFFFff, transparent:false, opacity:1.0, roughness:0.1, metalness:0, side:DoubleSide, transmission:1.0, clearcoat:1, thickness:0.1, ior:1.5, envMapIntensity:2.2, shadowSide:1, reflectivity:0.5, iridescence:0.5 }); break
				
				case 'plexi':  m = new MeshPhysicalMaterial({ color:0xFFFFff, transparent:true, opacity:0.4, metalness:1, roughness:0, clearcoat:1, side:DoubleSide }); break
				case 'glass2': m = new MeshPhysicalMaterial({ color:0xCCCCff, transparent:true, opacity:0.3  }); break
				case 'sat': m = new MeshPhysicalMaterial({ color:0xffffff, metalness: 1, roughness:0, clearcoat:1  }); break
				
				case 'car':   m = new MeshPhysicalMaterial({ color:0x303030, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5 }); break
				case 'carGlass':   m = new MeshPhysicalMaterial({ color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0 }); break


				case 'debug':  m = new MeshBasicMaterial({ color:0x000000, wireframe:true, toneMapped: false }); break
				case 'debug2': m = new MeshBasicMaterial({ color:0x00FFFF, wireframe:true, toneMapped: false }); break
				case 'debug3':  m = new MeshBasicMaterial({ color:0x000000, wireframe:true, transparent:true, opacity:0.1, toneMapped: false, depthTest:true }); break

				case 'bones':  m = new MeshStandardMaterial({ color:0xCCAA33,  wireframe:true }); break
				case 'bones2':  m = new MeshStandardMaterial({ color:0x7777ff }); break

				case 'shadows': m = new MeshBasicMaterial({ transparent:true, opacity:0.01 }); break
				case 'button':  m = new MeshStandardMaterial({ color:0xFF404B, ...matExtra }); break
				//case 'hide': m = new MeshBasicMaterial({ visible:false }); break

				case 'line': 
					if( !root.lineMaterial ) root.lineMaterial = new LineBasicMaterial( { vertexColors: true, toneMapped: false } )
					return root.lineMaterial; 
			    break
				case 'hide': 
					if( !root.hideMaterial ) root.hideMaterial = new MeshBasicMaterial({ visible:false })
					return root.hideMaterial; 
			    break


				

			}

			if(m){
				m.name = name;
				root.extraMaterial( m )
				mat[name] = m
			}
			
		}

		//console.log(DoubleSide)

		return mat[name]



	},

	dispose:() => {

		if( root.lineMaterial ){
			root.lineMaterial.dispose()
			root.lineMaterial = null
		}

		if( root.hideMaterial ){
			root.hideMaterial.dispose()
			root.hideMaterial = null
		}

		for(let m in mat){
			mat[m].dispose()
			delete mat[m]
		}

		let i = root.tmpMat.length
		while( i-- ) { root.tmpMat[i].dispose(); root.tmpMat[i] = null; }
		root.tmpMat = []

	}

}


//-------------------
//
//  MATH
//
//-------------------
/*
export const torad = Math.PI / 180
export const todeg = 180 / Math.PI

export const euler = new Euler()
export const quat = new Quaternion()
*/
/*const tmpMtx = new Matrix4()
const tmpP = new Vector3()
const tmpS = new Vector3()
const tmpQ = new Quaternion()
*/
/*
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

	vecMul: ( a, s ) => {

		let i = a.length;
	    while ( i -- ) a[i] *= s;
	    return a;

	},

	vecSub: ( a, b ) => {

		let i = a.length, r = [];
	    while ( i -- ) r[i] = a[ i ] - b[ i ];
	    return r;

	},

	vecZero: ( ar, n, i ) => {

	    while ( i -- ) ar[n+i] = 0;

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

	/*getIndex: ( g ) => {

		if(!g.index) return null

		return g.index.array || null
	},

	getVertex: ( g, noIndex ) => {
		
		let c = g.attributes.position.array;

		if( noIndex ){
			let h = g.clone().toNonIndexed()
			c = h.attributes.position.array;
		}

		return c;

	},*/
/*
	arCopy: ( a, b ) => { a = [...b] },

	////////

	quadToAxisArray: ( q ) => {

		//math.tmpV( 1,0,0 ).applyMatrix3( )
		//q = math.tmpQ.fromArray(q).normalize().toArray();
	   if (q[3] > 1) q = math.tmpQ.fromArray(q).normalize().toArray(); // if w>1 acos and sqrt will produce errors, this cant happen if quaternion is normalised
	   let angle = 2 * Math.acos(q[3]);
	   let s = Math.sqrt(1-q[3]*q[3]); // assuming quaternion normalised then w is less than 1, so term always positive

	   if (s < 0.001) {   
	       // console.log(s)
	        // test to avoid divide by zero, s is always positive due to sqrt
	        // if s close to zero then direction of axis not important
	        // if it is important that axis is normalised then replace with x=1; y=z=0;
	        return [1,0,0]

	        //return [q[0],q[1],q[2]]
	   } else {
	        //x = q[0] / s; // normalize axis
	        return [(q[0] / s)*angle, (q[1] / s)*angle, (q[2] / s)*angle]
	        //return [(q[0] / s),(q[1] / s),(q[2] / s)]
	   }
	},

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

		math.tmpE.fromArray( math.vectorad( rotation ) )
		console.log(math.tmpE)
		return math.tmpQ.setFromEuler( math.tmpE ).toArray();

	},

	/*static transform ( p = [0,0,0], q = [0,0,0,1], s = [1,1,1] ) {

		tmpMtx.compose( tmpP.fromArray(p), tmpQ.fromArray(q), tmpS.fromArray(s) )
		return tmpMtx;

	}*/


//}*/