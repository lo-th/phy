import { Color, Euler, Quaternion, Matrix4, Vector3, Box3Helper, CylinderGeometry, SphereGeometry, BoxGeometry, PlaneGeometry, MeshBasicMaterial, LineBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, Line, BufferGeometry, Float32BufferAttribute, EventDispatcher, MathUtils, Layers, InstancedMesh, InstancedBufferAttribute, DynamicDrawUsage, BufferAttribute, TrianglesDrawMode, TriangleFanDrawMode, TriangleStripDrawMode, CircleGeometry, Vector2, Line3, Plane, Triangle, Mesh, LineSegments, Loader, LoaderUtils, FileLoader, SpotLight, PointLight, DirectionalLight, sRGBEncoding, Object3D, TextureLoader, ImageBitmapLoader, InterleavedBuffer, InterleavedBufferAttribute, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, PointsMaterial, Material, DoubleSide, PropertyBinding, SkinnedMesh, LineLoop, Points, Group, PerspectiveCamera, OrthographicCamera, Skeleton, InterpolateLinear, AnimationClip, Bone, NearestFilter, NearestMipmapNearestFilter, LinearMipmapNearestFilter, NearestMipmapLinearFilter, ClampToEdgeWrapping, MirroredRepeatWrapping, InterpolateDiscrete, FrontSide, Texture, VectorKeyframeTrack, QuaternionKeyframeTrack, NumberKeyframeTrack, Box3, Sphere, Interpolant, Vector4, Curve, MeshPhongMaterial, MeshLambertMaterial, EquirectangularReflectionMapping, AmbientLight, Uint16BufferAttribute, Matrix3, DataTextureLoader, HalfFloatType, FloatType, DataUtils, LinearEncoding, ShaderChunk } from 'three';

const map = new Map();

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

const root = {

	engine:'OIMO',
	scene : null,
	scenePlus : null,
	post : null,
	up:null,
	update:null,
	add:null,
	remove:null,
	tmpMesh : [],
	instanceMesh : {},
	tmpTex : [],
	flow:{
		tmp:[],
		key:[],
		add:[],
		remove:[]
	},
	reflow:{
		ray:[],
		stat:{ fps:0 },
	},

	extraMaterial:() => {},
	
	disposeTmp:() => {

		// clear temporary mesh
		let i, j, m;
		for( i in root.tmpMesh ) {
			m = root.tmpMesh[i];
			if( m.children ){
				for( j in m.children ) root.disposeMesh( m.children[j] );
			}
			root.disposeMesh( m );
			if( m.parent ) m.parent.remove( m );
		}
		root.tmpMesh = [];

		// clear temporary textures
		for( i in root.tmpTex ) root.tmpTex[i].dispose();

	},

	disposeMesh:( m ) => {
		if( m.geometry ) m.geometry.dispose();
		if( m.dispose ) m.dispose();
	},

};


//-------------------
//
//  UTILS
//
//-------------------

const Utils = {

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

		map.set( b.name, b );

	},

	remove:( b ) => {

		if( b.dispose ) b.dispose();
		if( b.parent ) b.parent.remove( b );
		if( b.instance ) b.instance.remove( b.id );
		map.delete( b.name );

	}

};


//-------------------
//
//  GEOMETRY
//
//-------------------

let geoN = 0;
let geo = {};

const Geo = {

	unic: ( g ) => {

		geo[ 'geo' + geoN++ ] = g;

	},

	set: ( g ) => {

		//console.log( g.name )
		geo[g.name] = g;

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
		for( let n in geo ) geo[n].dispose();
		geo = {};
		geoN = 0;

	}

};



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

};

const Colors = {

	body:new Color( 0xFF934F ).convertSRGBToLinear(),
	sleep:new Color( 0x46B1C9 ).convertSRGBToLinear()

};

const mat = {};

const Mat = {

	set:( m ) => {

		root.extraMaterial( m );
		mat[m.name] = m;

	},

	get:( name ) => {

		if( !mat[name] ){
			//console.log(name)
			let m;
			switch( name ){

				case 'base':   m = new MeshStandardMaterial({ color:0xffffff, ...matExtra }); break
				case 'simple': m = new MeshStandardMaterial({ color:0x808080, metalness: 0, roughness: 1 }); break
				case 'body':   m = new MeshStandardMaterial({ color:0xFF934F, ...matExtra }); break
				case 'sleep':  m = new MeshStandardMaterial({ color:0x46B1C9, ...matExtra }); break
				case 'solid':  m = new MeshStandardMaterial({ color:0x3C474B, ...matExtra }); break
				case 'hero':   m = new MeshStandardMaterial({ color:0x00FF88, ...matExtra }); break
				case 'skin':   m = new MeshStandardMaterial({ color:0xe0ac69, ...matExtra }); break
				case 'chrome': m = new MeshStandardMaterial({ color:0xCCCCCC, metalness: 1, roughness:0 }); break
				case 'glass':  m = new MeshPhysicalMaterial({ color:0xFFFFff, transparent:true, opacity:0.8, depthTest:true, depthWrite:false, roughness:0.02, metalness:0.0, /*side:DoubleSide,*/ alphaToCoverage:true, premultipliedAlpha:true, transmission:1, clearcoat:1, thickness:0.02  }); break
				case 'plexi':  m = new MeshPhysicalMaterial({ color:0xCCCCCCC, transparent:true, opacity:0.4  }); break
				case 'glass2': m = new MeshPhysicalMaterial({ color:0xCCCCff, transparent:true, opacity:0.3  }); break

				case 'joint':  m = new LineBasicMaterial( { color: 0x00FF00, toneMapped: false } ); break
				case 'ray':    m = new LineBasicMaterial( { vertexColors: true, toneMapped: false } ); break	

				case 'debug':  m = new MeshBasicMaterial({ color:0x000000, wireframe:true }); break
				case 'debug2': m = new MeshBasicMaterial({ color:0x00FFFF, wireframe:true }); break

				case 'hide': m = new MeshBasicMaterial({ visible:false }); break

			}
			m.name = name;
			root.extraMaterial( m );
			mat[name] = m;
		}

		return mat[name]

	},

	dispose:() => {

		for(let m in mat){
			mat[m].dispose();
			delete mat[m];
		}

	}

};


//-------------------
//
//  MATH
//
//-------------------

const torad = Math.PI / 180;

const euler = new Euler();
const quat = new Quaternion();

/*const tmpMtx = new Matrix4()
const tmpP = new Vector3()
const tmpS = new Vector3()
const tmpQ = new Quaternion()
*/

const math$1 = {

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
		let i = ar.length;
		while( i-- ) ar[i] = math$1.lerp( arx[i], ary[i], t );
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
	unwrapDeg: ( r ) => (r - (Math.floor((r + 180)/360))*360), 
	unwrapRad: ( r ) => (r - (Math.floor((r + Math.PI)/(2*Math.PI)))*2*Math.PI),

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

	toQuatArray: ( rot = [0,0,0] ) => { // rotation array in degree

		return quat.setFromEuler( euler.fromArray( math$1.vectorad( rot ) ) ).toArray();

	},

	toLocalQuatArray: ( rot = [0,0,0], b ) => { // rotation array in degree

		quat.setFromEuler( euler.fromArray( math$1.vectorad( rot ) ) );
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

	addArray:( a, b ) => ( math$1.vecAdd(a,b) ),

	vectorad: ( r ) => {

		let i = 3, nr = [];
	    while ( i -- ) nr[ i ] = r[ i ] * torad;
	    nr[3] = r[3];
	    return nr;

	},

	scaleArray: ( ar, scale ) => {

		var i = ar.length;
		while( i-- ){ ar[i] *= scale; }		return ar;

	},

	getIndex: ( g ) => {

		//console.log( 'i', g.index )
		//let c = new Uint32Array( g.index.array ) || null

		return g.index.array || null
	},

	getVertex: ( g, noIndex ) => {
		
		let c = g.attributes.position.array;

		if( noIndex ){
			let h = g.clone().toNonIndexed();
			c = h.attributes.position.array;
		}

		return c;

	},

	arCopy: ( a, b ) => { [...b]; },

	////////

	fromTransformToQ: ( p, q, inv ) => {

		inv = inv || false;
		math$1.tmpM.compose( math$1.tmpV.fromArray( p ), math$1.tmpQ.fromArray( q ), { x:1, y:1, z:1 } );
		math$1.tmpM.decompose( math$1.tmpV, math$1.tmpQ, { x:1, y:1, z:1 } );
		if(inv) math$1.tmpQ.invert();
		return math$1.tmpQ.toArray();

	},

	fromTransform: ( p, q, p2, q2, inv ) => {

		inv = inv || false;
		q2 = q2 || [0,0,0,1];

		math$1.tmpM.compose( math$1.tmpV.fromArray( p ), math$1.tmpQ.fromArray( q ), { x:1, y:1, z:1 } );
		math$1.tmpM2.compose( math$1.tmpV.fromArray( p2 ), math$1.tmpQ.fromArray( q2 ), { x:1, y:1, z:1 } );
		if( inv ){
			math$1.tmpM.invert();
			math$1.tmpM.multiply( math$1.tmpM2 );
		} else {
			math$1.tmpM.multiply( math$1.tmpM2 );
		}

		math$1.tmpM.decompose( math$1.tmpV, math$1.tmpQ, { x:1, y:1, z:1 } );

		return math$1.tmpV.toArray();

	},

	axisToQuatArray: ( r, isdeg ) => { // r[0] array in degree

		isdeg = isdeg || false;
		return math$1.tmpQ.setFromAxisAngle( math$1.tmpV.fromArray( r, 1 ), isdeg ? r[0]*math$1.torad : r[0]).normalize().toArray();

	},

	toQuatArray: ( rotation ) => { // rotation array in degree

		return math$1.tmpQ.setFromEuler( math$1.tmpE.fromArray( math$1.vectorad( rotation ) ) ).toArray();

	},

	/*static transform ( p = [0,0,0], q = [0,0,0,1], s = [1,1,1] ) {

		tmpMtx.compose( tmpP.fromArray(p), tmpQ.fromArray(q), tmpS.fromArray(s) )
		return tmpMtx;

	}*/


};

const Max = {
	body:2000,
    joint:100,
    contact:50,
    ray:50,
    character:20,
    vehicle:20,
    solver:20,
};

const Num = {
	bodyFull:14,
    body:8,
    joint:16,
    contact:8,
    ray:8,
    character:16,
    vehicle:64,
    solver:256,
};

const getArray = function ( engine, full = false ){

    let ArPos = {};

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

    let prev = 0;

    for( let m in counts ){ 

        ArPos[m] = prev;
        prev += counts[m];

    }

    ArPos['total'] = prev;

    return ArPos

};

const getType = function (o){
    switch(o.type){
        case 'plane': case 'box': case 'sphere': case 'highSphere': case 'cylinder': 
        case 'cone': case 'capsule': case 'mesh': case 'convex': case 'compound': case 'null':
        if ( !o.density && !o.kinematic ) return 'solid'
        else return 'body'
        default: 
            return o.type 
    }
};

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

		this.id = 0;
		this.list = [];

	}

	///

	byName ( name ) {

		return this.Utils.byName( name )

	}

	setName ( o = {} ) {

		let name = o.name !== undefined ? o.name : this.type + this.id ++;

		// clear old item if existe keep id
		o.id = this.remove( name, true );
		o.name = name;

		return name

	}

	addToWorld ( b, id = -1 ) {

		this.Utils.add( b );
		if( id !== -1 ) this.list[id] = b;
		else this.list.push( b );

	}

	remove ( name, remplace ) {

		let b = this.byName( name );
		if( !b ) return -1
		return this.clear( b, remplace )

	}

	clear ( b, remplace ) {

		let n = this.list.indexOf( b );
		if ( n !== - 1 && !remplace ) this.list.splice( n, 1 );
		else this.list[n] = null;
		this.dispose( b );
		return n

	}

	dispose ( b ) {

		if( b !== null ) this.Utils.remove( b );

	}

	add ( o = {} ) { }

	set ( o = {} ) { }

	step ( AR, N ) { }

}

class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'ray';
		//this.mtx = new Matrix4()
		//this.mtx2 = new Matrix4()

	}

	step ( AR, N ) {

		let i = this.list.length, r, n;
		
		while( i-- ){

			r = this.list[i];

			n = N + ( i * Num.ray );

			r.update( AR, n, root.reflow.ray[i] || null );

			// re send start end
			r.begin.toArray( AR, n+1 );
			r.end.toArray( AR, n+4 );

		}

	}

	///

	add ( o = {} ) {

		this.setName( o );

		if( o.link && typeof o.link !== 'string') o.link = o.link.name;

		let r = new ExtraRay( o, Mat.get('ray') );

		r.visible = o.visible !== undefined ? o.visible : true;

		// add to world
		this.addToWorld( r, o.id );

		if( o.parent ) delete o.parent;
		if( o.callback ) delete o.callback;

		// add to worker 
		root.post( { m:'add', o:o } );

		return r;

	}

	set ( o = {}, r = null ) {

		if( r === null ) r = this.byName( o.name );
		if( r === null ) return;

		if( o.begin !== undefined ) r._begin.fromrray( o.begin );
		if( o.end !== undefined ) r._end.fromrray( o.end );

	}

}


class ExtraRay extends Line {

	constructor( o = {}, material = undefined ) {

	    super(  new BufferGeometry(), material);

	    this.data = {

			hit:false,
			body: '',
			point: [0,0,0],
			normal: [0,0,0],
			distance: 0,

		};

	    this.type = 'ray';
	    this.name = o.name;

	    if( typeof o.parent === 'string' ) o.parent = Utils.byName( o.parent );


	    this.linked = o.parent !== undefined ? true : false;
 
	    if( this.linked ) this.parent = o.parent;

	    this.callback = o.callback || function () {};

	    this.matrix = this.linked ? this.parent.matrixWorld : new Matrix4();
	    this.inv = new Matrix4();

	    // color
		this.c0 = [ 0.1, 0.1, 0.3 ];
		this.c1 = [ 0.1, 0.4, 0.6 ];
		this.c2 = [ 1.0, 0.1, 0.1 ];
		this.c3 = [ 0.4, 0.1, 0.1 ];

		// local
		this._begin = new Vector3().fromArray( o.begin || [0,3,0] );
	    this._end = new Vector3().fromArray( o.end || [0,0,0] );

	    // global
	    this.begin = new Vector3().copy( this._begin );
	    this.end = new Vector3().copy( this._end );

	    this.tmp = new Vector3();
	    this.normal = new Vector3();
	    
	    const positions = [0,0,0, 0,0,0, 0,0,0];
	    const colors = [0,0,0, 0,0,0, 0,0,0];

	    //this.geometry = new BufferGeometry();
	    this.geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    this.geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    //this.geometry.computeBoundingSphere();

	    this.vertices = this.geometry.attributes.position;
	    this.colors = this.geometry.attributes.color;
	    this.local = [ 0, 0, 0, 0, 0, 0 ];





	    //this.m = new LineSegments( this.geometry, material )
	    //this.add(this.m)

	    this.updateGeometry();

	    this.matrixAutoUpdate = false;

	}

	update ( r, n = 0, body = null ) {

		if( this.linked ){
			this.inv.copy( this.matrix ).invert();
			this.begin.copy( this._begin ).applyMatrix4( this.matrix );
			this.end.copy( this._end ).applyMatrix4( this.matrix );

		} else {
			this.updateMatrix();
		}

		this.data.hit = r[n] !== 0 ? true : false;
		this.data.body = body ? body : '';

		if( this.data.hit ){

			this.tmp.fromArray( r, n+1 );
			this.normal.fromArray( r, n+4 );//.normalize();

			if( this.linked ){
				this.tmp.applyMatrix4( this.inv );
				this.inv.extractRotation( this.inv );
				this.normal.applyMatrix4( this.inv );//.normalize()
			}

			this.data.point = this.tmp.toArray();
			this.data.normal = this.normal.toArray();
			this.data.distance = this._begin.distanceTo( this.tmp );

			this.tmp.toArray( this.local, 0 );
			
			let d = this.tmp.distanceTo( this._end );
			
			this.tmp.addScaledVector( this.normal, d );
			this.tmp.toArray( this.local, 3 );

		}


		this.updateGeometry();


		this.callback( this.data );

	}

	dispose(){
		this.geometry.dispose();
	}

	updateGeometry (){

		if ( ! this.visible ) return;

		let v = this.vertices.array;
		let c = this.colors.array;
		let l = this.local;
		let n, d, i;

		if ( this.data.hit ) {

			c[ 3 ] = c[ 6 ] = this.c2[ 0 ];
			c[ 4 ] = c[ 7 ] = this.c2[ 1 ];
			c[ 5 ] = c[ 8 ] = this.c2[ 2 ];

			c[ 6 ] = this.c3[ 0 ];
			c[ 7 ] = this.c3[ 1 ];
			c[ 8 ] = this.c3[ 2 ];

			v[ 0 ] = this._begin.x;
			v[ 1 ] = this._begin.y;
			v[ 2 ] = this._begin.z;

			v[ 3 ] = l[ 0 ];
			v[ 4 ] = l[ 1 ];
			v[ 5 ] = l[ 2 ];
			
			v[ 6 ] = l[ 3 ];
			v[ 7 ] = l[ 4 ];
			v[ 8 ] = l[ 5 ];

		} else {

			i = 3;

			while ( i -- ) {

				n = i * 3;
				d = i === 0 ? true : false;

				c[ n ] = d ? this.c0[ 0 ] : this.c1[ 0 ];
				c[ n + 1 ] = d ? this.c0[ 1 ] : this.c1[ 1 ];
				c[ n + 2 ] = d ? this.c0[ 2 ] : this.c1[ 2 ];

				v[ n ] = d ? this._begin.x : this._end.x;
				v[ n + 1 ] = d ? this._begin.y : this._end.y;
				v[ n + 2 ] = d ? this._begin.z : this._end.z;

			}

		}

		this.vertices.needsUpdate = true;
	    this.colors.needsUpdate = true;
	}

}

ExtraRay.prototype.isRay = true;

let _object3DId = 0;

const _v1$1 = /*@__PURE__*/ new Vector3();
const _q1 = /*@__PURE__*/ new Quaternion();
const _m1 = /*@__PURE__*/ new Matrix4();
const _target = /*@__PURE__*/ new Vector3();

const _position = /*@__PURE__*/ new Vector3();
const _scale = /*@__PURE__*/ new Vector3();
const _quaternion = /*@__PURE__*/ new Quaternion();

const _xAxis = /*@__PURE__*/ new Vector3( 1, 0, 0 );
const _yAxis = /*@__PURE__*/ new Vector3( 0, 1, 0 );
const _zAxis = /*@__PURE__*/ new Vector3( 0, 0, 1 );

const _addedEvent = { type: 'added' };
const _removedEvent = { type: 'removed' };

class Basic3D extends EventDispatcher {

	constructor() {

		super();

		this.isObject3D = true;

		Object.defineProperty( this, 'id', { value: _object3DId ++ } );
		this.uuid = MathUtils.generateUUID();
		
	    this.isRay = true;
	    this.matrix = new Matrix4();
	    this.matrixWorld = new Matrix4();
		
		this.name = '';
		this.type = 'Object3D';

		this.children = [];
		this.parent = null;
		
		
		this.position = new Vector3();
		this.quaternion = new Quaternion();
		this.scale = new Vector3( 1, 1, 1 );

		this.isKinematic = false;
		
		this.matrixAutoUpdate = false;
		this.matrixWorldNeedsUpdate = false;

		this.layers = new Layers();
		this.visible = true;
		this.isVisible = true;

		//this.castShadow = false;
		//this.receiveShadow = false;

		this.frustumCulled = true;
		this.renderOrder = 0;

		//this.animations = [];

		//this.userData = {};

		
		this.shapetype = 'box';
		this.size = [1,1,1];
		//this.data = {}
		//this._size = new Vector3(1,1,1)
		this.velocity = new Vector3();
		this.angular = new Vector3();
		this.defMat = false;
		this.actif = false;
		this.auto = false;
		this.sleep = false;
		// only for high mesh
		this.mesh = null;
		// if object is link by joint
		this.linked = [];

	}

	// ADD

	select ( b ) {

    }

    dispose () {

    	this.traverse( function ( node ) {
			if( node.isMesh && node.unic ) node.geometry.dispose();
		});

		this.children = [];

    }

	/*set size( value ){
		this._size.fromArray( value )
	}

	get size(){
		return this._size.toArray()
	}*/

	set receiveShadow( value ){
		this.traverse( function ( node ) {
			if( node.isMesh ) node.receiveShadow = value;
		});
	}

	get receiveShadow(){
		if( this.children[0] ) return this.children[0].receiveShadow;
		else return false
	}

	set castShadow( value ){
		this.traverse( function ( node ) {
			if( node.isMesh ) node.castShadow = value;
		});
	}

	get castShadow(){
		if( this.children[0] ) return this.children[0].castShadow;
		else return false
	}

	set material( value ){
		this.traverse( function ( node ) {
			if( node.isMesh ) node.material = value;
		});
	}

	get material(){
		this.children;
		if( this.children[0] ) return this.children[0].material;
		else return null
	}

    //////


	onBeforeRender( /* renderer, scene, camera, geometry, material, group */ ) {}

	onAfterRender( /* renderer, scene, camera, geometry, material, group */ ) {}

	applyMatrix4( matrix ) {

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		this.matrix.premultiply( matrix );

		this.matrix.decompose( this.position, this.quaternion, this.scale );

	}

	applyQuaternion( q ) {

		this.quaternion.premultiply( q );

		return this;

	}

	setRotationFromAxisAngle( axis, angle ) {

		// assumes axis is normalized

		this.quaternion.setFromAxisAngle( axis, angle );

	}

	setRotationFromEuler( euler ) {

		this.quaternion.setFromEuler( euler, true );

	}

	setRotationFromMatrix( m ) {

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		this.quaternion.setFromRotationMatrix( m );

	}

	setRotationFromQuaternion( q ) {

		// assumes q is normalized

		this.quaternion.copy( q );

	}

	rotateOnAxis( axis, angle ) {

		// rotate object on axis in object space
		// axis is assumed to be normalized

		_q1.setFromAxisAngle( axis, angle );

		this.quaternion.multiply( _q1 );

		return this;

	}

	rotateOnWorldAxis( axis, angle ) {

		// rotate object on axis in world space
		// axis is assumed to be normalized
		// method assumes no rotated parent

		_q1.setFromAxisAngle( axis, angle );

		this.quaternion.premultiply( _q1 );

		return this;

	}

	rotateX( angle ) {

		return this.rotateOnAxis( _xAxis, angle );

	}

	rotateY( angle ) {

		return this.rotateOnAxis( _yAxis, angle );

	}

	rotateZ( angle ) {

		return this.rotateOnAxis( _zAxis, angle );

	}

	translateOnAxis( axis, distance ) {

		// translate object by distance along axis in object space
		// axis is assumed to be normalized

		_v1$1.copy( axis ).applyQuaternion( this.quaternion );

		this.position.add( _v1$1.multiplyScalar( distance ) );

		return this;

	}

	translateX( distance ) {

		return this.translateOnAxis( _xAxis, distance );

	}

	translateY( distance ) {

		return this.translateOnAxis( _yAxis, distance );

	}

	translateZ( distance ) {

		return this.translateOnAxis( _zAxis, distance );

	}

	localToWorld( vector ) {

		return vector.applyMatrix4( this.matrixWorld );

	}

	worldToLocal( vector ) {

		return vector.applyMatrix4( _m1.copy( this.matrixWorld ).invert() );

	}

	lookAt( x, y, z ) {

		// This method does not support objects having non-uniformly-scaled parent(s)

		if ( x.isVector3 ) {

			_target.copy( x );

		} else {

			_target.set( x, y, z );

		}

		const parent = this.parent;

		this.updateWorldMatrix( true, false );

		_position.setFromMatrixPosition( this.matrixWorld );

		if ( this.isCamera || this.isLight ) {

			_m1.lookAt( _position, _target, this.up );

		} else {

			_m1.lookAt( _target, _position, this.up );

		}

		this.quaternion.setFromRotationMatrix( _m1 );

		if ( parent ) {

			_m1.extractRotation( parent.matrixWorld );
			_q1.setFromRotationMatrix( _m1 );
			this.quaternion.premultiply( _q1.invert() );

		}

	}

	add( object ) {

		if ( arguments.length > 1 ) {

			for ( let i = 0; i < arguments.length; i ++ ) {

				this.add( arguments[ i ] );

			}

			return this;

		}

		if ( object === this ) {

			console.error( 'THREE.Object3D.add: object can\'t be added as a child of itself.', object );
			return this;

		}

		if ( object && object.isObject3D ) {

			if ( object.parent !== null ) {

				object.parent.remove( object );

			}

			object.parent = this;
			this.children.push( object );

			object.dispatchEvent( _addedEvent );

		} else {

			console.error( 'THREE.Object3D.add: object not an instance of THREE.Object3D.', object );

		}

		return this;

	}

	remove( object ) {

		if ( arguments.length > 1 ) {

			for ( let i = 0; i < arguments.length; i ++ ) {

				this.remove( arguments[ i ] );

			}

			return this;

		}

		const index = this.children.indexOf( object );

		if ( index !== - 1 ) {

			object.parent = null;
			this.children.splice( index, 1 );

			object.dispatchEvent( _removedEvent );

		}

		return this;

	}

	removeFromParent() {

		const parent = this.parent;

		if ( parent !== null ) {

			parent.remove( this );

		}

		return this;

	}

	clear() {

		const children = this.children;
		let i = children.length;

		while( i-- ){
		//for ( let i = 0; i < this.children.length; i ++ ) {

			const object = children[ i ];
			object.parent = null;
			object.dispatchEvent( _removedEvent );

		}

		this.children.length = 0;

		return this;


	}

	attach( object ) {

		// adds object as a child of this, while maintaining the object's world transform
		// Note: This method does not support scene graphs having non-uniformly-scaled nodes(s)

		this.updateWorldMatrix( true, false );

		_m1.copy( this.matrixWorld ).invert();

		if ( object.parent !== null ) {

			object.parent.updateWorldMatrix( true, false );

			_m1.multiply( object.parent.matrixWorld );

		}

		object.applyMatrix4( _m1 );

		this.add( object );

		object.updateWorldMatrix( false, true );

		return this;

	}

	getObjectById( id ) {

		return this.getObjectByProperty( 'id', id );

	}

	getObjectByName( name ) {

		return this.getObjectByProperty( 'name', name );

	}

	getObjectByProperty( name, value ) {

		if ( this[ name ] === value ) return this;

		const children = this.children;
		let i = children.length;

		while( i-- ){
		//for ( let i = 0, l = this.children.length; i < l; i ++ ) {

			const child = children[ i ];
			const object = child.getObjectByProperty( name, value );

			if ( object !== undefined ) {

				return object;

			}

		}

		return undefined;

	}

	getWorldPosition( target ) {

		this.updateWorldMatrix( true, false );

		return target.setFromMatrixPosition( this.matrixWorld );

	}

	getWorldQuaternion( target ) {

		this.updateWorldMatrix( true, false );

		this.matrixWorld.decompose( _position, target, _scale );

		return target;

	}

	getWorldScale( target ) {

		this.updateWorldMatrix( true, false );

		this.matrixWorld.decompose( _position, _quaternion, target );

		return target;

	}

	getWorldDirection( target ) {

		this.updateWorldMatrix( true, false );

		const e = this.matrixWorld.elements;

		return target.set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize();

	}

	setRaycast(v){
		if( v !== undefined ) this.isRay = v;
		if(!this.isRay){
			let i =  this.children.length;
			while( i-- ) this.children[i].raycast = () => {};
		}
	}

	// direct raycast avoid recursive !!
	raycast( raycaster, intersects ) {

		if( !this.isRay ) return

		const children = this.children;
		let i = children.length;

		while( i-- ){

			if ( children[i].layers.test( raycaster.layers ) ) {

				children[i].raycast( raycaster, intersects );

			}

		}
	}

	traverse( callback ) {

		callback( this );

		const children = this.children;
		let i = children.length;

		//for ( let i = 0, l = children.length; i < l; i ++ ) {
		while( i-- ){

			children[ i ].traverse( callback );

		}

	}

	traverseVisible( callback ) {

		if ( this.visible === false ) return;

		callback( this );

		const children = this.children;
		let i = children.length;

		//for ( let i = 0, l = children.length; i < l; i ++ ) {
		while( i-- ){

			children[ i ].traverseVisible( callback );

		}

	}

	traverseAncestors( callback ) {

		const parent = this.parent;

		if ( parent !== null ) {

			callback( parent );

			parent.traverseAncestors( callback );

		}

	}

	/*setTransform( p, q, s ) {

		this.position.fromArray( p )
		this.quaternion.fromArray( q )

		this.matrix.copy( m );
		this.matrix.decompose( this.position, this.quaternion, this.scale );
		this.matrixWorldNeedsUpdate = true;

	}

	setColor( color ) {

		if( this.isInstance ){
		    this.instance.setColorAt( this.instanceId, color );
		}
		
	}

	updateMatrix() {

		this.matrix.compose( this.position, this.quaternion, this.scale );
	    this.matrixWorldNeedsUpdate = true;

		if( this.isInstance ) {
			this.instance.setTransformAt( this.instanceId, this.position.toArray(), this.quaternion.toArray(), this.size )
			return;
		} else {
			
		}

		

		//if( this.isInstance ) this.instance.setMatrixAt( this.instanceId, this.matrix );
		//else this.matrixWorldNeedsUpdate = true;

	}*/

	updateMatrix() {

		this.matrix.compose( this.position, this.quaternion, this.scale );
		this.matrixWorldNeedsUpdate = true;

	}

	updateMatrixWorld( force ) {

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate || force ) {

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// update children

		const children = this.children;
		let i = children.length;

		while( i-- ){
		//for ( let i = 0, l = children.length; i < l; i ++ ) {
			children[ i ].updateMatrixWorld( force );

		}

	}

	updateWorldMatrix( updateParents, updateChildren ) {

		const parent = this.parent;

		if ( updateParents === true && parent !== null ) {

			parent.updateWorldMatrix( true, false );

		}

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.parent === null ) {

			this.matrixWorld.copy( this.matrix );

		} else {

			this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

		}

		// update children

		if ( updateChildren === true ) {

			const children = this.children;
			let i = children.length;

			while( i-- ){
			//for ( let i = 0, l = children.length; i < l; i ++ ) {
				children[ i ].updateWorldMatrix( false, true );

			}

		}

	}

	/*toJSON( meta ) {

		// meta is a string when called from JSON.stringify
		const isRootObject = ( meta === undefined || typeof meta === 'string' );

		const output = {};

		// meta is a hash used to collect geometries, materials.
		// not providing it implies that this is the root object
		// being serialized.
		if ( isRootObject ) {

			// initialize meta obj
			meta = {
				geometries: {},
				materials: {},
				textures: {},
				images: {},
				shapes: {},
				skeletons: {},
				animations: {},
				nodes: {}
			};

			output.metadata = {
				version: 4.5,
				type: 'Object',
				generator: 'Object3D.toJSON'
			};

		}

		// standard Object3D serialization

		const object = {};

		object.uuid = this.uuid;
		object.type = this.type;

		if ( this.name !== '' ) object.name = this.name;
		if ( this.castShadow === true ) object.castShadow = true;
		if ( this.receiveShadow === true ) object.receiveShadow = true;
		if ( this.visible === false ) object.visible = false;
		if ( this.frustumCulled === false ) object.frustumCulled = false;
		if ( this.renderOrder !== 0 ) object.renderOrder = this.renderOrder;
		if ( JSON.stringify( this.userData ) !== '{}' ) object.userData = this.userData;

		object.layers = this.layers.mask;
		object.matrix = this.matrix.toArray();

		if ( this.matrixAutoUpdate === false ) object.matrixAutoUpdate = false;

		// object specific properties

		if ( this.isInstancedMesh ) {

			object.type = 'InstancedMesh';
			object.count = this.count;
			object.instanceMatrix = this.instanceMatrix.toJSON();
			if ( this.instanceColor !== null ) object.instanceColor = this.instanceColor.toJSON();

		}

		//

		function serialize( library, element ) {

			if ( library[ element.uuid ] === undefined ) {

				library[ element.uuid ] = element.toJSON( meta );

			}

			return element.uuid;

		}

		if ( this.isScene ) {

			if ( this.background ) {

				if ( this.background.isColor ) {

					object.background = this.background.toJSON();

				} else if ( this.background.isTexture ) {

					object.background = this.background.toJSON( meta ).uuid;

				}

			}

			if ( this.environment && this.environment.isTexture ) {

				object.environment = this.environment.toJSON( meta ).uuid;

			}

		} else if ( this.isMesh || this.isLine || this.isPoints ) {

			object.geometry = serialize( meta.geometries, this.geometry );

			const parameters = this.geometry.parameters;

			if ( parameters !== undefined && parameters.shapes !== undefined ) {

				const shapes = parameters.shapes;

				if ( Array.isArray( shapes ) ) {

					for ( let i = 0, l = shapes.length; i < l; i ++ ) {

						const shape = shapes[ i ];

						serialize( meta.shapes, shape );

					}

				} else {

					serialize( meta.shapes, shapes );

				}

			}

		}

		if ( this.isSkinnedMesh ) {

			object.bindMode = this.bindMode;
			object.bindMatrix = this.bindMatrix.toArray();

			if ( this.skeleton !== undefined ) {

				serialize( meta.skeletons, this.skeleton );

				object.skeleton = this.skeleton.uuid;

			}

		}

		if ( this.material !== undefined ) {

			if ( Array.isArray( this.material ) ) {

				const uuids = [];

				for ( let i = 0, l = this.material.length; i < l; i ++ ) {

					uuids.push( serialize( meta.materials, this.material[ i ] ) );

				}

				object.material = uuids;

			} else {

				object.material = serialize( meta.materials, this.material );

			}

		}

		//

		if ( this.children.length > 0 ) {

			object.children = [];

			for ( let i = 0; i < this.children.length; i ++ ) {

				object.children.push( this.children[ i ].toJSON( meta ).object );

			}

		}

		//

		if ( this.animations.length > 0 ) {

			object.animations = [];

			for ( let i = 0; i < this.animations.length; i ++ ) {

				const animation = this.animations[ i ];

				object.animations.push( serialize( meta.animations, animation ) );

			}

		}

		if ( isRootObject ) {

			const geometries = extractFromCache( meta.geometries );
			const materials = extractFromCache( meta.materials );
			const textures = extractFromCache( meta.textures );
			const images = extractFromCache( meta.images );
			const shapes = extractFromCache( meta.shapes );
			const skeletons = extractFromCache( meta.skeletons );
			const animations = extractFromCache( meta.animations );
			const nodes = extractFromCache( meta.nodes );

			if ( geometries.length > 0 ) output.geometries = geometries;
			if ( materials.length > 0 ) output.materials = materials;
			if ( textures.length > 0 ) output.textures = textures;
			if ( images.length > 0 ) output.images = images;
			if ( shapes.length > 0 ) output.shapes = shapes;
			if ( skeletons.length > 0 ) output.skeletons = skeletons;
			if ( animations.length > 0 ) output.animations = animations;
			if ( nodes.length > 0 ) output.nodes = nodes;

		}

		output.object = object;

		return output;

		// extract data from the cache hash
		// remove metadata on each item
		// and return as array
		function extractFromCache( cache ) {

			const values = [];
			for ( const key in cache ) {

				const data = cache[ key ];
				delete data.metadata;
				values.push( data );

			}

			return values;

		}

	}*/

	/*clone( recursive ) {

		return new this.constructor().copy( this, recursive );

	}

	copy( source, recursive = true ) {

		this.name = source.name;

		this.up.copy( source.up );

		this.position.copy( source.position );
		this.rotation.order = source.rotation.order;
		this.quaternion.copy( source.quaternion );
		this.scale.copy( source.scale );

		this.matrix.copy( source.matrix );
		this.matrixWorld.copy( source.matrixWorld );

		this.matrixAutoUpdate = source.matrixAutoUpdate;
		this.matrixWorldNeedsUpdate = source.matrixWorldNeedsUpdate;

		this.layers.mask = source.layers.mask;
		this.visible = source.visible;

		this.castShadow = source.castShadow;
		this.receiveShadow = source.receiveShadow;

		this.frustumCulled = source.frustumCulled;
		this.renderOrder = source.renderOrder;

		this.userData = JSON.parse( JSON.stringify( source.userData ) );

		if ( recursive === true ) {

			for ( let i = 0; i < source.children.length; i ++ ) {

				const child = source.children[ i ];
				this.add( child.clone() );

			}

		}

		return this;

	}*/

}

class Instance extends InstancedMesh {

	constructor( geometry, material, count = 0 ) {

        super( geometry, material, count );

        //this.instanceMatrix = null;
        this.matrixAutoUpdate = false; 
        this.tmpMatrix = new Matrix4();
        this.tmpQuat = new Quaternion();

        this.isRay = true; 
        
    }

    getInfo(id)
    {
        this.tmpMatrix.fromArray( this.instanceMatrix.array, id*16 );
        let pos = {x:0, y:0, z:0 };
        let scale = {x:0, y:0, z:0 };
        this.tmpMatrix.decompose( pos, this.tmpQuat, scale );
        return {
            pos:[pos.x, pos.y, pos.z],
            quat:this.tmpQuat.toArray(),
            scale:[scale.x, scale.y, scale.z]
        }
    }

    add( position = [0,0,0], rotation = [0,0,0,1], scale = [1,1,1], color )
    {
        if( rotation.length === 3 ) rotation = this.tmpQuat.setFromEuler( {_x:rotation[0], _y:rotation[1], _z:rotation[2], _order:'XYZ'}, false ).toArray();
        if(color){ 
            if( color.isColor ) color = color.toArray();
            if ( this.instanceColor === null ) this.instanceColor = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 3 ), 3 );
        }
        this.expand( position, rotation, scale, color );
    }

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

    remove( id )
    {
        if(!this.count) return;
        let old = [...this.instanceMatrix.array];
        old.splice( id*16, 16 );
        this.instanceMatrix = new InstancedBufferAttribute( new Float32Array(old), 16 );
        //this.instanceMatrix.setUsage( DynamicDrawUsage );
        if ( this.instanceColor !== null ) {
            old = [...this.instanceColor.array];
            old.splice( id*3, 3 );
            this.instanceColor = new InstancedBufferAttribute( new Float32Array(old), 3 );
        }
        this.count --;
    }

    expand( p, q, s, c = [1,1,1] )
    {
        let old = this.instanceMatrix !== null ? this.instanceMatrix.array : [];
        this.tmpMatrix.compose({x:p[0], y:p[1], z:p[2]}, {_x:q[0], _y:q[1], _z:q[2], _w:q[3]}, {x:s[0], y:s[1], z:s[2]});
        this.instanceMatrix = new InstancedBufferAttribute( new Float32Array([...old, ...this.tmpMatrix.toArray()]), 16 );
        this.instanceMatrix.setUsage( DynamicDrawUsage );
        if ( this.instanceColor !== null ) {
            old = this.instanceColor.array;
            this.instanceColor = new InstancedBufferAttribute( new Float32Array([...old, ...c ]), 3 );
        }
        this.count ++;
    }

    setTransformAt( index, p, q, s ) {
        this.tmpMatrix.compose({x:p[0], y:p[1], z:p[2]}, {_x:q[0], _y:q[1], _z:q[2], _w:q[3]}, {x:s[0], y:s[1], z:s[2]});
        this.tmpMatrix.toArray( this.instanceMatrix.array, index * 16 );
    }

    dispose() {
        this.parent.remove(this);
        this.geometry.dispose();
        //this.instanceMatrix = null;
        this.instanceColor = null;
        this.count = 0;
        //console.log(this.name+" is dispose")
        this.dispatchEvent( { type: 'dispose' } );

    }

    setRaycast(v){
        if( v !== undefined ) this.isRay = v;
    }

    raycast( raycaster, intersects ) {
        if(!this.isRay) return
        super.raycast( raycaster, intersects );
    }

    update(){
        if( this.instanceMatrix ) this.instanceMatrix.needsUpdate = true;
        if( this.instanceColor ) this.instanceColor.needsUpdate = true;
    }

}

/**
 * @param  {Array<BufferGeometry>} geometries
 * @param  {Boolean} useGroups
 * @return {BufferGeometry}
 */
function mergeBufferGeometries( geometries, useGroups = false ) {

	const isIndexed = geometries[ 0 ].index !== null;

	const attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
	const morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );

	const attributes = {};
	const morphAttributes = {};

	const morphTargetsRelative = geometries[ 0 ].morphTargetsRelative;

	const mergedGeometry = new BufferGeometry();

	let offset = 0;

	for ( let i = 0; i < geometries.length; ++ i ) {

		const geometry = geometries[ i ];
		let attributesCount = 0;

		// ensure that all geometries are indexed, or none

		if ( isIndexed !== ( geometry.index !== null ) ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.' );
			return null;

		}

		// gather attributes, exit early if they're different

		for ( const name in geometry.attributes ) {

			if ( ! attributesUsed.has( name ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure "' + name + '" attribute exists among all geometries, or in none of them.' );
				return null;

			}

			if ( attributes[ name ] === undefined ) attributes[ name ] = [];

			attributes[ name ].push( geometry.attributes[ name ] );

			attributesCount ++;

		}

		// ensure geometries have the same number of attributes

		if ( attributesCount !== attributesUsed.size ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. Make sure all geometries have the same number of attributes.' );
			return null;

		}

		// gather morph attributes, exit early if they're different

		if ( morphTargetsRelative !== geometry.morphTargetsRelative ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. .morphTargetsRelative must be consistent throughout all geometries.' );
			return null;

		}

		for ( const name in geometry.morphAttributes ) {

			if ( ! morphAttributesUsed.has( name ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '.  .morphAttributes must be consistent throughout all geometries.' );
				return null;

			}

			if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

			morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

		}

		if ( useGroups ) {

			let count;

			if ( isIndexed ) {

				count = geometry.index.count;

			} else if ( geometry.attributes.position !== undefined ) {

				count = geometry.attributes.position.count;

			} else {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. The geometry must have either an index or a position attribute' );
				return null;

			}

			mergedGeometry.addGroup( offset, count, geometry.forceMatId || i );

			offset += count;

		}

	}

	// merge indices

	if ( isIndexed ) {

		let indexOffset = 0;
		const mergedIndex = [];

		for ( let i = 0; i < geometries.length; ++ i ) {

			const index = geometries[ i ].index;

			for ( let j = 0; j < index.count; ++ j ) {

				mergedIndex.push( index.getX( j ) + indexOffset );

			}

			indexOffset += geometries[ i ].attributes.position.count;

		}

		mergedGeometry.setIndex( mergedIndex );

	}

	// merge attributes

	for ( const name in attributes ) {

		const mergedAttribute = mergeBufferAttributes( attributes[ name ] );

		if ( ! mergedAttribute ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' attribute.' );
			return null;

		}

		mergedGeometry.setAttribute( name, mergedAttribute );

	}

	// merge morph attributes

	for ( const name in morphAttributes ) {

		const numMorphTargets = morphAttributes[ name ][ 0 ].length;

		if ( numMorphTargets === 0 ) break;

		mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
		mergedGeometry.morphAttributes[ name ] = [];

		for ( let i = 0; i < numMorphTargets; ++ i ) {

			const morphAttributesToMerge = [];

			for ( let j = 0; j < morphAttributes[ name ].length; ++ j ) {

				morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

			}

			const mergedMorphAttribute = mergeBufferAttributes( morphAttributesToMerge );

			if ( ! mergedMorphAttribute ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' morphAttribute.' );
				return null;

			}

			mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

		}

	}

	return mergedGeometry;

}

/**
 * @param {Array<BufferAttribute>} attributes
 * @return {BufferAttribute}
 */
function mergeBufferAttributes( attributes ) {

	let TypedArray;
	let itemSize;
	let normalized;
	let arrayLength = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		const attribute = attributes[ i ];

		if ( attribute.isInterleavedBufferAttribute ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. InterleavedBufferAttributes are not supported.' );
			return null;

		}

		if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
		if ( TypedArray !== attribute.array.constructor ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.' );
			return null;

		}

		if ( itemSize === undefined ) itemSize = attribute.itemSize;
		if ( itemSize !== attribute.itemSize ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.' );
			return null;

		}

		if ( normalized === undefined ) normalized = attribute.normalized;
		if ( normalized !== attribute.normalized ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.' );
			return null;

		}

		arrayLength += attribute.array.length;

	}

	const array = new TypedArray( arrayLength );
	let offset = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		array.set( attributes[ i ].array, offset );

		offset += attributes[ i ].array.length;

	}

	return new BufferAttribute( array, itemSize, normalized );

}

/**
 * @param {BufferGeometry} geometry
 * @param {number} tolerance
 * @return {BufferGeometry}
 */
function mergeVertices( geometry, tolerance = 1e-4 ) {

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

		tmpAttributes[ name ] = new BufferAttribute(
			new attr.array.constructor( attr.count * attr.itemSize ),
			attr.itemSize,
			attr.normalized
		);

		const morphAttr = geometry.morphAttributes[ name ];
		if ( morphAttr ) {

			tmpMorphAttributes[ name ] = new BufferAttribute(
				new morphAttr.array.constructor( morphAttr.count * morphAttr.itemSize ),
				morphAttr.itemSize,
				morphAttr.normalized
			);

		}

	}

	// convert the error tolerance to an amount of decimal places to truncate to
	const decimalShift = Math.log10( 1 / tolerance );
	const shiftMultiplier = Math.pow( 10, decimalShift );
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
				hash += `${ ~ ~ ( attribute[ getters[ k ] ]( index ) * shiftMultiplier ) },`;

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
				const morphAttr = geometry.morphAttributes[ name ];
				const itemSize = attribute.itemSize;
				const newarray = tmpAttributes[ name ];
				const newMorphArrays = tmpMorphAttributes[ name ];

				for ( let k = 0; k < itemSize; k ++ ) {

					const getterFunc = getters[ k ];
					const setterFunc = setters[ k ];
					newarray[ setterFunc ]( nextIndex, attribute[ getterFunc ]( index ) );

					if ( morphAttr ) {

						for ( let m = 0, ml = morphAttr.length; m < ml; m ++ ) {

							newMorphArrays[ m ][ setterFunc ]( nextIndex, morphAttr[ m ][ getterFunc ]( index ) );

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

		result.setAttribute( name, new BufferAttribute(
			tmpAttribute.array.slice( 0, nextIndex * tmpAttribute.itemSize ),
			tmpAttribute.itemSize,
			tmpAttribute.normalized,
		) );

		if ( ! ( name in tmpMorphAttributes ) ) continue;

		for ( let j = 0; j < tmpMorphAttributes[ name ].length; j ++ ) {

			const tmpMorphAttribute = tmpMorphAttributes[ name ][ j ];

			result.morphAttributes[ name ][ j ] = new BufferAttribute(
				tmpMorphAttribute.array.slice( 0, nextIndex * tmpMorphAttribute.itemSize ),
				tmpMorphAttribute.itemSize,
				tmpMorphAttribute.normalized,
			);

		}

	}

	// indices

	result.setIndex( newIndices );

	return result;

}

/**
 * @param {BufferGeometry} geometry
 * @param {number} drawMode
 * @return {BufferGeometry}
 */
function toTrianglesDrawMode( geometry, drawMode ) {

	if ( drawMode === TrianglesDrawMode ) {

		console.warn( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.' );
		return geometry;

	}

	if ( drawMode === TriangleFanDrawMode || drawMode === TriangleStripDrawMode ) {

		let index = geometry.getIndex();

		// generate index if not present

		if ( index === null ) {

			const indices = [];

			const position = geometry.getAttribute( 'position' );

			if ( position !== undefined ) {

				for ( let i = 0; i < position.count; i ++ ) {

					indices.push( i );

				}

				geometry.setIndex( indices );
				index = geometry.getIndex();

			} else {

				console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.' );
				return geometry;

			}

		}

		//

		const numberOfTriangles = index.count - 2;
		const newIndices = [];

		if ( drawMode === TriangleFanDrawMode ) {

			// gl.TRIANGLE_FAN

			for ( let i = 1; i <= numberOfTriangles; i ++ ) {

				newIndices.push( index.getX( 0 ) );
				newIndices.push( index.getX( i ) );
				newIndices.push( index.getX( i + 1 ) );

			}

		} else {

			// gl.TRIANGLE_STRIP

			for ( let i = 0; i < numberOfTriangles; i ++ ) {

				if ( i % 2 === 0 ) {

					newIndices.push( index.getX( i ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i + 2 ) );

				} else {

					newIndices.push( index.getX( i + 2 ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i ) );

				}

			}

		}

		if ( ( newIndices.length / 3 ) !== numberOfTriangles ) {

			console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.' );

		}

		// build final geometry

		const newGeometry = geometry.clone();
		newGeometry.setIndex( newIndices );
		newGeometry.clearGroups();

		return newGeometry;

	} else {

		console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', drawMode );
		return geometry;

	}

}

/**
* SPHERE BOX GEOMETRY
*/
class SphereBox extends BufferGeometry {

    constructor( radius=1, widthSegs=10, heightSegs=10, depthSegs=10, roundness=1 ) {

        super();

        this.type = 'SphereBox';
        this.name = 'SphereBox_' + radius +'_'+widthSegs+'_'+heightSegs+'_'+depthSegs+'_'+roundness;

        radius = radius || 1;

        // segments

        widthSegs = Math.floor( widthSegs );
        heightSegs = Math.floor( heightSegs );
        depthSegs = Math.floor( depthSegs );        
        let g = new BoxGeometry( 1,1,1, widthSegs, heightSegs, depthSegs ), v = new Vector3(), r = new Vector3(), n;

        let ar = g.attributes.position.array;
        let nm = g.attributes.normal.array;

        for ( let i = 0, l = g.attributes.position.count; i < l; i ++ ) {

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
        scaleUV( m0, 0, sy, 1, hy );
        let m1 = new SphereGeometry( radius, radialSegs, sHeight, 0, o0, 0, o1);
        scaleUV( m1, 0, 1-sy, 1, sy );
        let m2 = new SphereGeometry( radius, radialSegs, sHeight, 0, o0, o1, o1);
        scaleUV( m2, 0, 0, 1, sy );
        let mtx0 = new Matrix4().makeRotationY( -pi*0.5 );
        let mtx1 = new Matrix4().makeTranslation(0, height*0.5,0);
        let mtx2 = new Matrix4().makeTranslation(0, -height*0.5,0);
        m0.applyMatrix4( mtx0 );
        m1.applyMatrix4( mtx1 );
        m2.applyMatrix4( mtx2 );


        let g = mergeVertices( mergeBufferGeometries( [ m0, m1, m2] ) );
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

        scaleUV( mid, 0, sy, 1, hy );

        // top
        let c1 = new TorusGeometryFix( radiusTop-filet, filet, filetSegs, radialSegs, twoPi, 0, p90 );
        let c2 = new CircleGeometry( radiusTop-filet, radialSegs );

        mt.makeTranslation( 0,0, filet );
        c2.applyMatrix4( mt );

        scaleUV( c1, 0, 1-sy, 1, sy );

        let top = mergeBufferGeometries( [ c1, c2 ] );

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

        scaleUV( c1, 0, 1-sy, 1, sy, true );

        let low = mergeBufferGeometries( [ c1, c2 ] );

        mr.makeTranslation( 0,0,( (height*0.5) - filet) );
        mt.makeRotationX( p90 );
        low.applyMatrix4( mt.multiply(mr) );

        /*c1.dispose();
        c2.dispose();*/

        let g = mergeVertices( mergeBufferGeometries( [ top, mid, low ] ) );

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

        let tra = mergeBufferGeometries( [ c2, s1, s2 ] );
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

        let rf = mergeBufferGeometries( [ c1, c3, f, tra, trc ] );
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


        let rr = mergeBufferGeometries( [ c1, c3, f ] );
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

        let g = mergeVertices( mergeBufferGeometries( [ rf, rg, rr, rb, f, f2 ] ) );

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

                uOffset = - 0.5 / widthSegments;

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

        if(reverse){
            ar[n] = 1 - ar[n];
            ar[n+1] = 1 - ar[n+1];
        }
    }


}

function createUV( geometry, type = 'sphere', transformMatrix, boxSize ) {

    //type = type || 'sphere';

    if ( transformMatrix === undefined ) transformMatrix = new Matrix4();
  
    //if ( boxSize === undefined ) {

        geometry.computeBoundingBox();
        let bbox = geometry.boundingBox;
        boxSize = Math.max( bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z );

       //geometry.computeBoundingSphere()
       //transformMatrix.multiplyScalar(geometry.boundingSphere.radiu*2)

    //}

    let uvBbox = bbox;//.expandByScalar(0.9);//new THREE.Box3( new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2));
    //_applyBoxUV( bufferGeometry, transformMatrix, uvBbox, boxSize );

    


    let coords = [];
    //coords.length = 2 * geometry.attributes.position.array.length / 3;
    coords.length = 2 * geometry.attributes.position.count;

    if ( geometry.attributes.uv === undefined ) geometry.addAttribute('uv', new Float32BufferAttribute(coords, 2));
    



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

    if ( geometry.index ) { // is it indexed buffer geometry?

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

/**
 * Ported from: https://github.com/maurizzzio/quickhull3d/ by Mauricio Poppe (https://github.com/maurizzzio)
 */

const Visible = 0;
const Deleted = 1;

const _v1 = new Vector3();
const _line3 = new Line3();
const _plane = new Plane();
const _closestPoint = new Vector3();
const _triangle = new Triangle();

class ConvexHull {

	constructor() {

		this.tolerance = - 1;

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

		this.vertices = []; 	// vertices of the hull (internal representation of given geometry data)

	}

	setFromPoints( points ) {

		// The algorithm needs at least four points.

		if ( points.length >= 4 ) {

			this.makeEmpty();

			for ( let i = 0, l = points.length; i < l; i ++ ) {

				this.vertices.push( new VertexNode( points[ i ] ) );

			}

			this.compute();

		}

		return this;

	}

	setFromObject( object ) {

		const points = [];

		object.updateMatrixWorld( true );

		object.traverse( function ( node ) {

			const geometry = node.geometry;

			if ( geometry !== undefined ) {

				if ( geometry.isGeometry ) {

					console.error( 'THREE.ConvexHull no longer supports Geometry. Use THREE.BufferGeometry instead.' );
					return;

				} else if ( geometry.isBufferGeometry ) {

					const attribute = geometry.attributes.position;

					if ( attribute !== undefined ) {

						for ( let i = 0, l = attribute.count; i < l; i ++ ) {

							const point = new Vector3();

							point.fromBufferAttribute( attribute, i ).applyMatrix4( node.matrixWorld );

							points.push( point );

						}

					}

				}

			}

		} );

		return this.setFromPoints( points );

	}

	containsPoint( point ) {

		const faces = this.faces;

		for ( let i = 0, l = faces.length; i < l; i ++ ) {

			const face = faces[ i ];

			// compute signed distance and check on what half space the point lies

			if ( face.distanceToPoint( point ) > this.tolerance ) return false;

		}

		return true;

	}

	intersectRay( ray, target ) {

		// based on "Fast Ray-Convex Polyhedron Intersection"  by Eric Haines, GRAPHICS GEMS II

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

				//  plane faces away from the ray, so this plane is a back-face

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

	intersectsRay( ray ) {

		return this.intersectRay( ray, _v1 ) !== null;

	}

	makeEmpty() {

		this.faces = [];
		this.vertices = [];

		return this;

	}

	// Adds a vertex to the 'assigned' list of vertices and assigns it to the given face

	addVertexToFace( vertex, face ) {

		vertex.face = face;

		if ( face.outside === null ) {

			this.assigned.append( vertex );

		} else {

			this.assigned.insertBefore( face.outside, vertex );

		}

		face.outside = vertex;

		return this;

	}

	// Removes a vertex from the 'assigned' list of vertices and from the given face

	removeVertexFromFace( vertex, face ) {

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

	// Removes all the visible vertices that a given face is able to see which are stored in the 'assigned' vertext list

	removeAllVerticesFromFace( face ) {

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

	// Removes all the visible vertices that 'face' is able to see

	deleteFaceVertices( face, absorbingFace ) {

		const faceVertices = this.removeAllVerticesFromFace( face );

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

						this.addVertexToFace( vertex, absorbingFace );

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

	// Reassigns as many vertices as possible from the unassigned list to the new faces

	resolveUnassignedPoints( newFaces ) {

		if ( this.unassigned.isEmpty() === false ) {

			let vertex = this.unassigned.first();

			do {

				// buffer 'next' reference, see .deleteFaceVertices()

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

					this.addVertexToFace( vertex, maxFace );

				}

				vertex = nextVertex;

			} while ( vertex !== null );

		}

		return this;

	}

	// Computes the extremes of a simplex which will be the initial hull

	computeExtremes() {

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

	// Computes the initial simplex assigning to its faces all the points
	// that are candidates to form part of the hull

	computeInitialHull() {

		const vertices = this.vertices;
		const extremes = this.computeExtremes();
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

		maxDistance = - 1;
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

					this.addVertexToFace( vertex, maxFace );

				}

			}

		}

		return this;

	}

	// Removes inactive faces

	reindexFaces() {

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

	// Finds the next vertex to create faces with the current hull

	nextVertexToAdd() {

		// if the 'assigned' list of vertices is empty, no vertices are left. return with 'undefined'

		if ( this.assigned.isEmpty() === false ) {

			let eyeVertex, maxDistance = 0;

			// grap the first available face and start with the first visible vertex of that face

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

	// Computes a chain of half edges in CCW order called the 'horizon'.
	// For an edge to be part of the horizon it must join a face that can see
	// 'eyePoint' and a face that cannot see 'eyePoint'.

	computeHorizon( eyePoint, crossEdge, face, horizon ) {

		// moves face's vertices to the 'unassigned' vertex list

		this.deleteFaceVertices( face );

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

					this.computeHorizon( eyePoint, twinEdge, oppositeFace, horizon );

				} else {

					// the opposite face can't see the vertex, so this edge is part of the horizon

					horizon.push( edge );

				}

			}

			edge = edge.next;

		} while ( edge !== crossEdge );

		return this;

	}

	// Creates a face with the vertices 'eyeVertex.point', 'horizonEdge.tail' and 'horizonEdge.head' in CCW order

	addAdjoiningFace( eyeVertex, horizonEdge ) {

		// all the half edges are created in ccw order thus the face is always pointing outside the hull

		const face = Face.create( eyeVertex, horizonEdge.tail(), horizonEdge.head() );

		this.faces.push( face );

		// join face.getEdge( - 1 ) with the horizon's opposite edge face.getEdge( - 1 ) = face.getEdge( 2 )

		face.getEdge( - 1 ).setTwin( horizonEdge.twin );

		return face.getEdge( 0 ); // the half edge whose vertex is the eyeVertex


	}

	//  Adds 'horizon.length' faces to the hull, each face will be linked with the
	//  horizon opposite face and the face on the left/right

	addNewFaces( eyeVertex, horizon ) {

		this.newFaces = [];

		let firstSideEdge = null;
		let previousSideEdge = null;

		for ( let i = 0; i < horizon.length; i ++ ) {

			const horizonEdge = horizon[ i ];

			// returns the right side edge

			const sideEdge = this.addAdjoiningFace( eyeVertex, horizonEdge );

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

	// Adds a vertex to the hull

	addVertexToHull( eyeVertex ) {

		const horizon = [];

		this.unassigned.clear();

		// remove 'eyeVertex' from 'eyeVertex.face' so that it can't be added to the 'unassigned' vertex list

		this.removeVertexFromFace( eyeVertex, eyeVertex.face );

		this.computeHorizon( eyeVertex.point, null, eyeVertex.face, horizon );

		this.addNewFaces( eyeVertex, horizon );

		// reassign 'unassigned' vertices to the new faces

		this.resolveUnassignedPoints( this.newFaces );

		return	this;

	}

	cleanup() {

		this.assigned.clear();
		this.unassigned.clear();
		this.newFaces = [];

		return this;

	}

	compute() {

		let vertex;

		this.computeInitialHull();

		// add all available vertices gradually to the hull

		while ( ( vertex = this.nextVertexToAdd() ) !== undefined ) {

			this.addVertexToHull( vertex );

		}

		this.reindexFaces();

		this.cleanup();

		return this;

	}

}

//

class Face {

	constructor() {

		this.normal = new Vector3();
		this.midpoint = new Vector3();
		this.area = 0;

		this.constant = 0; // signed distance from face to the origin
		this.outside = null; // reference to a vertex in a vertex list this face can see
		this.mark = Visible;
		this.edge = null;

	}

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

	distanceToPoint( point ) {

		return this.normal.dot( point ) - this.constant;

	}

}

// Entity for a Doubly-Connected Edge List (DCEL).

class HalfEdge {


	constructor( vertex, face ) {

		this.vertex = vertex;
		this.prev = null;
		this.next = null;
		this.twin = null;
		this.face = face;

	}

	head() {

		return this.vertex;

	}

	tail() {

		return this.prev ? this.prev.vertex : null;

	}

	length() {

		const head = this.head();
		const tail = this.tail();

		if ( tail !== null ) {

			return tail.point.distanceTo( head.point );

		}

		return - 1;

	}

	lengthSquared() {

		const head = this.head();
		const tail = this.tail();

		if ( tail !== null ) {

			return tail.point.distanceToSquared( head.point );

		}

		return - 1;

	}

	setTwin( edge ) {

		this.twin = edge;
		edge.twin = this;

		return this;

	}

}

// A vertex as a double linked list node.

class VertexNode {

	constructor( point ) {

		this.point = point;
		this.prev = null;
		this.next = null;
		this.face = null; // the face that is able to see this vertex

	}

}

// A double linked list that contains vertex nodes.

class VertexList {

	constructor() {

		this.head = null;
		this.tail = null;

	}

	first() {

		return this.head;

	}

	last() {

		return this.tail;

	}

	clear() {

		this.head = this.tail = null;

		return this;

	}

	// Inserts a vertex before the target vertex

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

	// Inserts a vertex after the target vertex

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

	// Appends a vertex to the end of the linked list

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

	// Appends a chain of vertices where 'vertex' is the head.

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

	// Removes a vertex from the linked list

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

	// Removes a list of vertices whose 'head' is 'a' and whose 'tail' is b

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

	isEmpty() {

		return this.head === null;

	}

}

class ConvexGeometry extends BufferGeometry {

	constructor( points ) {

		super();

		// buffers

		const vertices = [];
		const normals = [];

		if ( ConvexHull === undefined ) {

			console.error( 'THREE.ConvexBufferGeometry: ConvexBufferGeometry relies on ConvexHull' );

		}

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

// THREE BODY

class Body extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'body';
		this.num = Num[this.type];
		this.full = false;
		this.extraConvex = false;

	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ];
		this.full = full;
	}

	step ( AR, N ) {

		const list = this.list;
		let i = list.length, b, n, a;
		
		while( i-- ){

			b = list[i];

			if( b === null ) continue

			n = N + ( i * this.num );

			// update only when physics actif
			if( !b.actif ){
				a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7];
				if( a === 0 ) continue
				else b.actif = true;
			}

		    // test is object sleep
			b.sleep = AR[n] > 0 ? false : true;

			// update default material
	        if( b.defMat ){

	        	if( b.isInstance ){
	        		b.instance.setColorAt(b.id, b.sleep ? Colors.sleep : Colors.body );
	        	} else {
	        		if ( !b.sleep && b.material.name === 'sleep' ) b.material = Mat.get('body');
			        if ( b.sleep && b.material.name === 'body' ) b.material = Mat.get('sleep');
	        	}
			    
			}

			if( b.sleep && !b.isKinematic ) continue 

			// update position / rotation / velocity

		    if( b.isInstance ){ 
		    	if( b.speedMat ) b.instance.setColorAt(b.id, [ Math.abs(AR[n+8])*0.5, Math.abs(AR[n+9])*0.5, Math.abs(AR[n+10])*0.5] );
		    	b.instance.setTransformAt( b.id, [AR[n+1],AR[n+2],AR[n+3]], [AR[n+4],AR[n+5],AR[n+6],AR[n+7]], b.noScale ? [1,1,1] : b.size );
		    	b.position = {x:AR[n+1], y:AR[n+2], z:AR[n+3]};
		    	if( this.full ){
		    		b.velocity = {x:AR[n+8], y:AR[n+9], z:AR[n+10]};
		    		b.angular = {x:AR[n+11], y:AR[n+12], z:AR[n+13]};
		    	}
		    }
		    else {
		    	b.position.fromArray( AR, n + 1 );
		        b.quaternion.fromArray( AR, n + 4 );
		        if( this.full ){
			        b.velocity.fromArray( AR, n + 8 );
			        b.angular.fromArray( AR, n + 11 );
			    }
		        if( !b.auto ) b.updateMatrix();
		    }
		}

	}

	///

	geometry ( o = {}, b = null, material = null ) {

		//console.log( 'geometry', o, b, material)

		let g, i, n, s = o.size, gName='';
		let t = o.type;
		let noScale = false, unic = false;
		let seg = o.seg || 16;

		if( o.instance && t!== 'capsule') s = o.instanceSize || [1,1,1];

		if( o.instance && t=== 'compound'){ 
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
			if( t === 'box' ) t = 'ChamferBox';
		    if( t === 'cylinder' ) t = 'ChamferCyl';
		}

		if( o.geometry ){
			if( t === 'convex' ) o.shape = o.geometry;
			else t = 'direct';
		} 


		if( this.extraConvex && ( o.type==='cylinder' || o.type==='cone' ) ){
			// convert geometry to convex if not in physics
	    	let geom = new CylinderGeometry( o.type === 'cone' ? 0 : o.size[ 0 ], o.size[ 0 ], o.size[ 1 ], seg, 1 );//24
	    	if( o.isWheel ) geom.rotateZ( -math$1.PI90 );
	    	o.v = math$1.getVertex( geom );
	    	o.type = 'convex';

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
				}
				unic = true;
				noScale = true;
			}

			if( o.shape ){
				g = o.shape.clone();
				if( o.size ) g.scale( o.size[0], o.size[0], o.size[0] );
				//o.v = g.attributes.position.array;
				o.v = math$1.getVertex( g );
				o.index = math$1.getIndex( g );

				unic = true;
				noScale = true;
			}

			break;

			case 'mesh':

				g = o.shape.clone();
				if( o.size ) g.scale( o.size[0], o.size[0], o.size[0] );
				
				o.v = math$1.getVertex( g, root.engine === 'OIMO' );
				o.index = root.engine === 'OIMO' ? null : math$1.getIndex( g );
				
				unic = true;
				noScale = true;
			
			break;

			case 'highSphere':

			    gName = 'highSphere_' + s[ 0 ];

			    g = Geo.get( gName );
			    if(!g){
			    	g = new SphereBox( s[ 0 ] );
					g.name = gName;
			    } else {
					gName = '';
				}
			    noScale = true;
			    o.type = 'sphere';

			break;

			case 'capsule':

			    gName = 'capsule_' + s[ 0 ] +'_'+s[ 1 ] + '_' + seg; 

			    g = Geo.get( gName );
			    if(!g){
					g = new Capsule( s[ 0 ], s[ 1 ], seg );
					g.name = gName;
				} else {
					gName = '';
				}
				noScale = true;
			break;

			case 'ChamferBox':

			    gName = 'ChamferBox_' + s[ 0 ] +'_'+ s[ 1 ] +'_'+ s[ 2 ] + '_' + o.radius + '_' + seg; 

			    g = Geo.get( gName );
			    if(!g){
					g = new ChamferBox( s[ 0 ], s[ 1 ], s[ 2 ], o.radius, seg );
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
			    g = Geo.get(t); //geo[ t ];
			break;

		}

		if(o.translate) g.translate( o.translate[0], o.translate[1], o.translate[2]);

		

		// clear untranspherable variable for phy
    	if( o.shape ) delete o.shape;
    	if( o.geometry ) delete o.geometry;


    	// reuse complex geometry
    	if( gName !== '' ) Geo.set( g );

    	if( o.isWheel ){
    		g = g.clone();
    		g.rotateZ( -math$1.PI90 );
    		unic = true;
    	}
    	
    	// unic geometry dispose on reset 
    	if( unic ) Geo.unic(g);

    	
    	

    	if( b === null && material === null ){
    		g.noScale = noScale; 
    		return g
    	}

		let m = new Mesh( g, material );

		if( o.localRot ) o.localQuat = math$1.toQuatArray( o.localRot );
		if( o.localPos ) m.position.fromArray( o.localPos );
		if( o.localQuat ) m.quaternion.fromArray( o.localQuat );

    	if( !noScale ) m.scale.fromArray( o.size );
    	//if( unic ) m.unic = true
    	

    	// add or not add
    	if( !o.meshRemplace || o.debug ) b.add( m );

	}

	add ( o = {} ) {

		//console.log('add', o.type )

		let i, n, name;

		if( !o.instance ) name = this.setName( o );


		o.type = o.type === undefined ? 'box' : o.type;

		if( o.type === 'plane' && !o.visible ) o.visible = false;

		// change default center of mass 
		if( o.massCenter && root.engine !== 'PHYSX'){
			if( o.type !== 'compound' ){
				//o.localPos = o.massCenter
				o.shapes = [{ type:o.type, pos:o.massCenter, size:o.size }];
				if( o.seg ) o.shapes[0].seg = o.seg;
				if( o.radius ) o.shapes[0].radius = o.radius;
				delete ( o.size );
				o.type = 'compound';
			} else {
				for ( i = 0; i < o.shapes.length; i ++ ) {
					n = o.shapes[ i ];
					if( n.pos ) n.pos = Utils.vecAdd( n.pos, o.massCenter );
					else n.pos = o.massCenter;
					Geo.unic(n);
				}
			}
		}

		//console.log('add', o.type, )

		// position
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;

		// rotation is in degree or Quaternion
	    o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
	    if( o.rot !== undefined ){ o.quat = math$1.toQuatArray( o.rot ); delete o.rot; }
	    if( o.meshRot !== undefined ){ o.meshQuat = math$1.toQuatArray( o.meshRot ); delete o.meshRot; }

	    //o.size = o.size == undefined ? [ 1, 1, 1 ] : math.correctSize( o.size );
	    o.size = math$1.autoSize( o.size, o.type );
	    if( o.meshScale ) o.meshScale = math$1.autoSize( o.meshScale );

	    let material, noMat = false;

	    if ( o.material !== undefined ) {
	    	if ( o.material.constructor === String ) material = Mat.get(o.material);
	    	else material = o.material;
	    } else {
	    	noMat = true;
	    	material = Mat.get( this.type ); //mat[this.type]
	    	if( o.instance ) material = Mat.get( 'base' );
	    }

	    if( o.material ) delete o.material;




	    //if( o.makeInstance ) return this.addInstance( o, material )
	    /*{

	    	let bb = new Instance( this.geometry( o ), material, 0 )
	    	bb.matrixAutoUpdate = false
	    	bb.instanceMatrix.setUsage( DynamicDrawUsage )
	    	bb.receiveShadow = o.shadow !== undefined ? o.shadow : true;
	    	bb.castShadow = o.shadow !== undefined ? o.shadow : true;

	    	bb.name = name || 'inst' + root.instanceMesh.length
	    	//bb.n = 0
			root.scene.add( bb )
			root.instanceMesh.push( bb )

	    	return bb

	    }*/





	    //let b = new Basic3D( o.instance )
	    let b = o.instance ? {} : new Basic3D();

	    if( o.mesh ){

	    	//if( o.isTerrain ) o.noClone = true
	    	if( o.mesh.type === 'terrain' ) o.noClone = true;

	    	let mm = o.noClone ? o.mesh : o.mesh.clone();

	    	mm.position.fromArray( o.meshPos || [0,0,0]);
	    	if( o.meshRot ) { o.meshQuat = math$1.toQuatArray( o.meshRot ); delete o.meshRot; }
	    	if( o.meshQuat ) mm.quaternion.fromArray( o.meshQuat );
	    	if( o.meshSize ) mm.scale.set(1,1,1).multiplyScalar(o.meshSize);
	    	if( o.meshScale ) mm.scale.fromArray( o.meshScale );
	    	
	    	if( !noMat ) mm.material = material;

	    	root.tmpMesh.push(mm);

	    	o.meshRemplace = true;
	    	b.add( mm );

	    }

	    switch( o.type ){

	    	case 'null': break;

	    	case 'compound':

	    	    for ( i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

					n.type = n.type === undefined ? 'box' : n.type;
					//n.size = n.size === undefined ? [ 1, 1, 1 ] : math.correctSize( n.size );
					n.size = math$1.autoSize( n.size, n.type );

					if( n.pos ) n.localPos = n.pos;
					if( n.rot !== undefined ){ n.quat = math$1.toQuatArray( n.rot ); delete n.rot; }
					if( n.quat ) n.localQuat = n.quat;


					
					n.debug = o.debug || false;
					n.meshRemplace = o.meshRemplace || false;

					if( !o.instance ) this.geometry( n, b, material );

				}

	    	break;
	    	default:

			    if( !o.instance ) this.geometry( o, b, material );

			break;

	    }

	    
	    b.type = this.type;
	    b.size = o.size;
		b.shapetype = o.type;
		b.isKinematic = o.kinematic || false;

	    // enable or disable raycast
	    b.isRay = b.type === 'body' ? true : false;
	    if( o.ray !== undefined ) b.isRay = o.ray; 
	    if( !o.instance ) b.setRaycast();
	    

		if( !noMat ) b.material = material;
		b.defMat = false;
		if( b.material ) b.defMat = b.material.name === 'body';


		//  for instancing
		if( o.instance ){ 

			b.isInstance = true;
			b.instance = root.instanceMesh[ o.instance ] || this.addInstance( o, material );
			b.instance.isRay = b.isRay;

			b.defMat = b.instance.material.name === 'base';
			
			b.id = b.instance.count;
			
			b.name = b.instance.name + b.id;
			o.name = b.name;
			b.noScale = false;//o.type!=='box' || o.type!=='ChamferBox' || o.type!=='sphere';
			//if(o.type === 'sphere') b.noScale = false
		    if(o.type === 'capsule') b.noScale = true;
			/*if(o.radius) b.noScale = true*/

			let color = o.color;
			if( b.defMat ) color = o.sleep ? Colors.sleep : Colors.body;

			b.instance.add( o.pos, o.quat, b.noScale ? [1,1,1] : b.size, color );

			b.position = {x:o.pos[0], y:o.pos[1], z:o.pos[2]};
		    b.velocity = {x:0, y:0, z:0};
		    b.angular = {x:0, y:0, z:0};

			// for convex
			if(b.instance.v) o.v = b.instance.v;
			if(b.instance.index) o.index = b.instance.index;
		    o.type = b.instance.type;

			/*if( this.extraConvex && ( o.type==='cylinder' || o.type==='cone') ){
		    	o.v = b.instance.v;
		    	o.type = 'convex';
		    }*/


			//console.log( b )

		} else {

			b.name = name;

			if( o.renderOrder ) b.renderOrder = o.renderOrder;
			if( o.visible === undefined ) o.visible = true;
			if( o.shadow === undefined ) o.shadow = o.visible;

			b.visible = o.visible !== undefined ? o.visible : true;
		    b.receiveShadow = o.shadow;
		    b.castShadow = o.shadow;

		    // apply option
			this.set( o, b );

		}

	    if( o.instance ) delete o.instance;
	    if( o.mesh ) delete o.mesh;

		// add to world
		this.addToWorld( b, o.id );

		if( o.onlyMakeMesh ) return b

		if(o.phySize) o.size = o.phySize;
		if(o.phyPos) o.pos = o.phyPos;

		// add to physic worker 
		root.post( { m:'add', o:o } );

		//console.log(b)

		return b

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return

		/*if(b.isInstance){

			b.instance.setTransformAt( b.id, o.pos, o.quat, b.noScale ? [1,1,1] : b.size )
		    b.position = {x:o.pos[0], y:o.pos[1], z:o.pos[2]}

		}else{*/
			if( o.pos ) b.position.fromArray( o.pos );
		    if( o.quat ) b.quaternion.fromArray( o.quat );

		    b.auto = o.auto || false;

		    if( !b.auto ) {
		    	b.matrixAutoUpdate = false;
			    b.updateMatrix();
			} else {
				b.matrixAutoUpdate = true;
			}
		//}

		

	}

	addInstance ( o, material ) {

		let bb = new Instance( this.geometry( o ), material, 0 );

		if(o.v) bb.v = o.v;
		if(o.index) bb.index = o.index;
		bb.type = o.type;

    	//bb.matrixAutoUpdate = false
    	//bb.instanceMatrix.setUsage( DynamicDrawUsage )
    	bb.receiveShadow = o.shadow !== undefined ? o.shadow : true;
    	bb.castShadow = o.shadow !== undefined ? o.shadow : true;

    	bb.name = o.instance;
    	//bb.n = 0
		root.scene.add( bb );
		root.instanceMesh[ o.instance ] = bb;

		//console.log(bb.name+" is add")

    	return bb

	}

}

//import { Item } from './Item.js';

class Joint extends Item {

	constructor () {

		super();

		this.Utils = Utils;

		this.type = 'joint';

	}

	step ( AR, N ) {

		let i = this.list.length, j, n;
		
		while( i-- ){

			j = this.list[i];

			n = N + ( i * Num.joint );

			j.update( AR, n );

			//j.update( AR.slice( n, 16 ) );

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );

		if( o.b1 && typeof o.b1 !== 'string') o.b1 = o.b1.name;
		if( o.b2 && typeof o.b2 !== 'string') o.b2 = o.b2.name;

		if( o.rot1 !== undefined ){ o.quat1 = math$1.toQuatArray( o.rot1 ); delete ( o.rot1 ); }
		if( o.rot2 !== undefined ){ o.quat2 = math$1.toQuatArray( o.rot2 ); delete ( o.rot2 ); }

		if( o.drivePosition) if( o.drivePosition.rot !== undefined ){ o.drivePosition.quat = math$1.toQuatArray( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }

		let j = new ExtraJoint( Geo.get('joint'), Mat.get('joint') );
		j.name = name;

		j.visible = false; // joint is visible after first update
		j.isVisible = o.visible !== undefined ? o.visible : true;

		// add to world
		this.addToWorld( j, o.id );

		// add to worker 
		root.post( { m:'add', o:o } );

		return j;

	}

	set ( o = {} ) {

	}

}





class ExtraJoint extends Basic3D {

	constructor( g, material = undefined ) {

	    super();

	    this.type = 'joint';
	    this.mode = 'revolute';
	    this.isJoint = true;

	    this.mtx = new Matrix4();

	    this.m1 = new LineSegments( g, material );
	    this.add(this.m1);

	    this.m2 = new LineSegments( g, material );
	    this.add( this.m2 );
	    this.m2.matrixAutoUpdate = false;
	    
	    const positions = [ 0, 0, 0, 0, 0, 0];
	    const gline = new BufferGeometry();
	    gline.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    gline.computeBoundingSphere();


	    this.m3 = new LineSegments( gline, material );
	    this.add( this.m3 );

	}

	update ( r, n = 0 ) {

		if(!this.isVisible) return

		this.position.fromArray( r, n );
		this.quaternion.fromArray( r, n + 3 );

		this.updateMatrix();

		this.m2.position.fromArray( r, n+7 );
		this.m2.quaternion.fromArray( r, n+10 );
		this.m2.matrix.compose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );

		this.mtx.copy( this.matrix ).invert().multiply( this.m2.matrix );
		this.mtx.decompose( this.m2.position, this.m2.quaternion, {x:1,y:1,z:1} );
		this.m2.updateMatrix();

		const position = this.m3.geometry.attributes.position;
		position.setXYZ(1, this.m2.position.x, this.m2.position.y, this.m2.position.z);
		position.needsUpdate = true;

		if( !this.visible ) this.visible = true;

	}

	dispose (){

		this.m1.geometry.dispose();
		this.m2.geometry.dispose();
		this.m3.geometry.dispose();
		this.children = [];

	}

}

class Contact extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'contact';

	}

	step ( AR, N ) {

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
		root.post( { m:'add', o:o } );

		return c;

	}


}


class Pair {

	constructor ( o = {} ) {

		this.type = 'contact';

		this.name = o.name;
		this.callback = o.callback || function(){};

		this.b1 = o.b1 || null;
		this.b2 = o.b2 || null;
		this.ignore = o.ignore || [];

		this.always = o.always !== undefined ? o.always : true;
		this.simple = o.simple || false;

		this.data = {

			hit:false,
			point: [0,0,0],
			normal: [0,0,0],
			//object: null,
		};

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

// THREE VEHICLE

class Vehicle extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'vehicle';
		this.num = Num[this.type];

	}

	step ( AR, N ) {

		let i = this.list.length, n, s;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * this.num );
			s.step( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o );
        const car = new Car( o );

        // add to world
		this.addToWorld( car, o.id );

        // add to physics
        root.post({ m:'add', o:car.o });

        return car

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return

	}

}



// CAR

class Car {//extends Object3D {

	constructor( o ) {

		//super();

		this.type = 'vehicle';
		this.isCar = true;
		this.name = o.name;
		this.withBody = false;
		this.actif = false;
		//this.position = new THREE.Vector3();
		this.init( o );

	}

	drive () {

	}

	init ( o ) {

		//this.decal = o.bodyDecalY || 0;
		//this.circum = (Math.PI * 2 * o.radius);// in metter

        // CHASSIS
		this.size = o.size || [0.85*2, 0.5*2, 2.5*2];
		this.massCenter = o.massCenter || [0, 0.55, 1.594];
		this.chassisPos = o.chassisPos || [0, 0.83, 0];


		//this.diff = math.vecSub( this.chassisPos, this.massCenter )
		//this.diff[2] = 0

		// WHEELS
		this.numWheel = o.numWheel || 4;
		this.radius = o.radius || 0.35;
		this.radiusBack = o.radiusBack || this.radius;
		this.deep = o.deep || 0.3;
		this.deepBack = o.deepBack || this.deep;

		if(!o.wPos) o.wPos = [0.8, 0.1, 1.4];

		if( o.wPos ){

			var p, wp = o.wPos, pp = [], s=1;
			var limz = wp.length === 3 ? true : false;
			var pz = 1;

			for( var i=0; i < this.numWheel; i++ ){

				s = i%2 === 0 ? -1 : 1;
				if(s === -1) pz++;

				if(limz){
					p = [ wp[ 0 ] * s, wp[ 1 ], i<2 ? wp[ 2 ] : -wp[ 2 ] ];
				} else {
					p = [ wp[ 0 ] * s, wp[ 1 ],  -wp[ pz ] ];
				}

				pp.push( p );

			}

			this.wheelsPosition = pp;
			//delete o.wPos;

		} else {

			this.wheelsPosition = o.wheelsPosition;

		}

		//console.log(this.wheelsPosition)

		const chassisShapes = [];// { type:'convex', shape:bodyShape, pos:[0,0,0], flag:8|2|1 } ];//, isExclusive:true

		//if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, pos:[0,0,0], flag:8|2|1 } );
		//else chassisShapes.push( { type:'box', size:this.size, pos:[0,0,0], flag:8|2|1 } );

		if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, filter:[1, -1, 0, 0], isExclusive:true  } );
		else chassisShapes.push( { type:'box', size:this.size, pos:this.chassisPos } );

		let wType = 'cylinder';//'wheel'

		for( let i=0; i < this.numWheel; i++ ){

	    	if( i < 2 ) chassisShapes.push({ type:wType, size:[ this.radius, this.deep ], isWheel:true, radius:0.05 /*pos:this.wheelsPosition[i], filter:[2, 4, 0, 0], isExclusive:true */ });
	    	else chassisShapes.push({ type:wType, size:[ this.radiusBack, this.deepBack ], isWheel:true, radius:0.05 /*pos:this.wheelsPosition[i], filter:[2, 4, 0, 0], isExclusive:true*/  });
	    	
	    }

	    ///console.log( chassisShapes )


	    /*for( var i=0; i < o.numWheel; i++ ){

	    	if( this.radiusBack !== this.radius ){
	    		if(i<2) chassisShapes.push( { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    		else chassisShapes.push(  { type:'convex', shape:wheelShapeBack, pos:[0,0,0] } );
	    	} else {
	    		chassisShapes.push(  { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    	}

	    }*/

	    var material = 'debug';//o.debug ? 'debug' : (o.body === undefined ? 'body' : 'hide');
	    //if( o.body === undefined ) material = 'move';

		this.kinematic = o.kinematic;
		this.chassis = root.add({ 
			onlyMakeMesh:true, 
		    name:this.name + '_chassis', 
		    type:'compound', 
		    shapes:chassisShapes, 
		    pos:o.pos, 
		    rot:o.rot, 
		    ray:false,
		    //mass:1,
		    /*mass:o.mass + o.wheelMass * o.numWheel, */
		    material:material, 
		    //kinematic: o.kinematic,
			//noGravity:true
		});
		
		this.chassis.car = this;

		if( o.body ){

			this.withBody = true;

			this.body = o.noClone ? o.body : o.body.clone();
			this.body.matrixAutoUpdate = false;

			this.chassisName = o.chassisName || "chassis";
			this.wheelNamePrefix = o.wheelNamePrefix || "wheel_";

			if( this.body.scale.x!==o.bodyScale ) this.body.scale.multiplyScalar(o.bodyScale);

			this.invScale = 1/o.bodyScale;

			root.content.add( this.body );

			var i = this.body.children.length;
			this.bodys = {};
			while (i--){
				var child = this.body.children[i];
				var name = child.name;
				this.bodys[ name ] = child;
				
				//if(child.name.startsWith(this.wheelNamePrefix))
				//	child.rotation.order = "YXZ";
			}
			
			var chassisMesh = this.bodys[this.chassisName];
			if(this.kinematic && chassisMesh) chassisMesh.position.y -= this.decal;

			//console.log( this.wheelsPosition, this.bodys )

			delete ( o.body );
		}

		o.size = this.size;
		o.numWheel = this.numWheel;
		o.wheelsPosition = this.wheelsPosition;
		o.radius = this.radius;
		o.radiusBack = this.radiusBack;
		o.deep = this.deep;
		o.deepBack = this.deepBack;

		o.chassisShape = chassisShapes[0];

		o.massCenter = this.massCenter;
		o.chassisPos = this.chassisPos;

		this.o = o;

	}

	respawn ( o ) {

		//{ pos:[0,0,0], rot:[0,0,0], keepVelocity:false }

		o = o || {};
		o.respawn = true;
		o.name = this.name;

		if( o.keepRotation ) o.quat = this.chassis.quaternion.toArray();


		root.view.up( o );

	}

	dispose (){

		if(this.withBody){
			root.content.remove( this.body );
		}

		root.remove( this.name + '_chassis' );
	}

	step ( AR, n ) {

		if( !this.actif ){
			let a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7];
			if( a===0 ) return;
			else this.actif = true;
		}

		this.chassis.position.fromArray( AR, n + 1 );
		this.chassis.quaternion.fromArray( AR, n + 4 );
		this.chassis.updateMatrix();

		//console.log(AR)

		if( this.withBody ){
			this.body.position.copy( this.chassis.position );
		    this.body.quaternion.copy( this.chassis.quaternion );
		    this.body.updateMatrix();
		}

		//this.position.copy( this.chassis.position );
		
		//if(this.kinematic) return;

		var num = this.numWheel+1;

		var mesh;

		/*let isGlobal = false

		let mx = new Matrix4()
		let mx2 = new Matrix4().copy( this.chassis.matrixWorld ).invert()
		let mp = new Vector3()
		let mq = new Quaternion()*/

		var k = 0;
		for( var i = 0; i<num; i++ ){

			k = (i*8) + n; //( i*5 ) + n;

			//if(i===0) acc = -( AR[ m+n ] * this.circum );
			if(i===0)  ( ( AR[ k ] ) / this.circum  );




			mesh = this.chassis.children[i];

			if( mesh && i>0 ){

				/*if(isGlobal){
					mx.compose( {x:AR[k+1], y:AR[k+2], z:AR[k+3]}, {_x:AR[k+4], _y:AR[k+5], _z:AR[k+6], _w:AR[k+7]}, {x:1, y:1, z:1})
					mx.premultiply( mx2 )
					mx.decompose(mp, mq, {x:1, y:1, z:1})
					mp.toArray( AR, k + 1 )
					mq.toArray( AR, k + 4 )
				}*/

				
				

				//mesh.rotation.order = 'YXZ'
				/*mesh.position.copy(mp)//fromArray( AR, k + 1 );
				mesh.position.y += this.massCenter[1]
				mesh.quaternion.copy(mq)//fromArray( AR, k + 4 )*/

				// local
				
				mesh.position.fromArray( AR, k + 1 );
				//mesh.position.y += this.massCenter[1]
				mesh.quaternion.fromArray( AR, k + 4 );



				//mesh.quaternion.fromArray( AR, n + 4 )//.premultiply(this.q)
				//mesh.rotation.order = 'YXZ';
				/*mesh.rotation.order = 'YZX';
				mesh.rotation.y = AR[k+4];
				mesh.rotation.x = AR[k+5];
				mesh.rotation.z = AR[k+6];*/


			}

			
			//mesh.quaternion.fromArray( AR, k + 4 );

			/*if( this.withBody ){

				if( i > 0 ) real = this.bodys[ this.wheelNamePrefix + ( i-1 ) ];
			    else real = this.bodys[ this.chassisName ];

				if(real) {
					real.position.fromArray( AR, k + 1 ).multiplyScalar(this.invScale);
					//real.quaternion.fromArray( AR, k + 4 );
					if(real.name === this.chassisName) real.position.y-= this.decal;
				}
			}*/



			/*if(i>0){

				var roll = AR[ k+4 ]

				mesh.rotation.order = 'YXZ';
				mesh.rotation.y = sr;
				mesh.rotation.x += acc/Math.PI;
				mesh.rotation.x = roll;

				if( this.withBody && real ){
			        if(!this.disableSteerAnimation) real.rotation.y = sr;
				    //real.rotation.x += acc/Math.PI;
				    real.rotation.x = roll;
				}


			}*/



		}

		//console.log(acc)




	}
}

// THREE CHARACTER

class Character extends Item {

	constructor() {

		super();

		this.Utils = Utils;
		this.type = 'character';

	}

	step ( AR, N ) {

		let i = this.list.length, n, s;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * Num.character );
			s.step( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o );

		const hero = new Hero( o );

		// add to world
		this.addToWorld( hero, o.id );

        // add to physics
        root.post({ m:'add', o:hero.o });

		return hero

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return

		b.set(o);

	}
	
}

// HERO

class Hero {

	constructor( o ) {

		this.type = 'character';
		this.name = o.name;

		//this.position = new THREE.Vector3();
		this.init( o );

	}

	init( o ){

		this.shape = root.add({ 
			onlyMakeMesh:true, 
		    name:this.name + '_shape', 
		    type:'capsule', 
		    size:o.size,
		    pos:o.pos, 
		    rot:o.rot,
		    ray:false,
		    material:'hero'
		});

	}

	step ( AR, n ) {

		this.shape.position.fromArray( AR, n + 1 );
		this.shape.quaternion.fromArray( AR, n + 4 );
		this.shape.updateMatrix();

	}

	set ( o ) {

	}


}

const math = {

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
		let i = ar.length;
		while( i-- ) ar[i] = math.lerp( arx[i], ary[i], t );
	},

    unwrapDeg: ( r ) => (r - (Math.floor((r + 180)/360))*360), 
	unwrapRad: ( r ) => (r - (Math.floor((r + Math.PI)/(2*Math.PI)))*2*Math.PI),


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

		[...b];

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

class GLTFLoader extends Loader {

	constructor( manager ) {

		super( manager );

		this.dracoLoader = null;
		this.ktx2Loader = null;
		this.meshoptDecoder = null;

		this.pluginCallbacks = [];

		this.register( function ( parser ) {

			return new GLTFMaterialsClearcoatExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureBasisUExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureWebPExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureAVIFExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSheenExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsTransmissionExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsVolumeExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIorExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsEmissiveStrengthExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSpecularExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIridescenceExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFLightsExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshoptCompression( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshGpuInstancing( parser );

		} );

	}

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		let resourcePath;

		if ( this.resourcePath !== '' ) {

			resourcePath = this.resourcePath;

		} else if ( this.path !== '' ) {

			resourcePath = this.path;

		} else {

			resourcePath = LoaderUtils.extractUrlBase( url );

		}

		// Tells the LoadingManager to track an extra item, which resolves after
		// the model is fully loaded. This means the count of items loaded will
		// be incorrect, but ensures manager.onLoad() does not fire early.
		this.manager.itemStart( url );

		const _onError = function ( e ) {

			if ( onError ) {

				onError( e );

			} else {

				console.error( e );

			}

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		};

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );

		loader.load( url, function ( data ) {

			try {

				scope.parse( data, resourcePath, function ( gltf ) {

					onLoad( gltf );

					scope.manager.itemEnd( url );

				}, _onError );

			} catch ( e ) {

				_onError( e );

			}

		}, onProgress, _onError );

	}

	setDRACOLoader( dracoLoader ) {

		this.dracoLoader = dracoLoader;
		return this;

	}

	setDDSLoader() {

		throw new Error(

			'THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".'

		);

	}

	setKTX2Loader( ktx2Loader ) {

		this.ktx2Loader = ktx2Loader;
		return this;

	}

	setMeshoptDecoder( meshoptDecoder ) {

		this.meshoptDecoder = meshoptDecoder;
		return this;

	}

	register( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) === - 1 ) {

			this.pluginCallbacks.push( callback );

		}

		return this;

	}

	unregister( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) !== - 1 ) {

			this.pluginCallbacks.splice( this.pluginCallbacks.indexOf( callback ), 1 );

		}

		return this;

	}

	parse( data, path, onLoad, onError ) {

		let json;
		const extensions = {};
		const plugins = {};
		const textDecoder = new TextDecoder();

		if ( typeof data === 'string' ) {

			json = JSON.parse( data );

		} else if ( data instanceof ArrayBuffer ) {

			const magic = textDecoder.decode( new Uint8Array( data, 0, 4 ) );

			if ( magic === BINARY_EXTENSION_HEADER_MAGIC ) {

				try {

					extensions[ EXTENSIONS.KHR_BINARY_GLTF ] = new GLTFBinaryExtension( data );

				} catch ( error ) {

					if ( onError ) onError( error );
					return;

				}

				json = JSON.parse( extensions[ EXTENSIONS.KHR_BINARY_GLTF ].content );

			} else {

				json = JSON.parse( textDecoder.decode( data ) );

			}

		} else {

			json = data;

		}

		if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

			if ( onError ) onError( new Error( 'THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.' ) );
			return;

		}

		const parser = new GLTFParser( json, {

			path: path || this.resourcePath || '',
			crossOrigin: this.crossOrigin,
			requestHeader: this.requestHeader,
			manager: this.manager,
			ktx2Loader: this.ktx2Loader,
			meshoptDecoder: this.meshoptDecoder

		} );

		parser.fileLoader.setRequestHeader( this.requestHeader );

		for ( let i = 0; i < this.pluginCallbacks.length; i ++ ) {

			const plugin = this.pluginCallbacks[ i ]( parser );
			plugins[ plugin.name ] = plugin;

			// Workaround to avoid determining as unknown extension
			// in addUnknownExtensionsToUserData().
			// Remove this workaround if we move all the existing
			// extension handlers to plugin system
			extensions[ plugin.name ] = true;

		}

		if ( json.extensionsUsed ) {

			for ( let i = 0; i < json.extensionsUsed.length; ++ i ) {

				const extensionName = json.extensionsUsed[ i ];
				const extensionsRequired = json.extensionsRequired || [];

				switch ( extensionName ) {

					case EXTENSIONS.KHR_MATERIALS_UNLIT:
						extensions[ extensionName ] = new GLTFMaterialsUnlitExtension();
						break;

					case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
						extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
						break;

					case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
						extensions[ extensionName ] = new GLTFTextureTransformExtension();
						break;

					case EXTENSIONS.KHR_MESH_QUANTIZATION:
						extensions[ extensionName ] = new GLTFMeshQuantizationExtension();
						break;

					default:

						if ( extensionsRequired.indexOf( extensionName ) >= 0 && plugins[ extensionName ] === undefined ) {

							console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );

						}

				}

			}

		}

		parser.setExtensions( extensions );
		parser.setPlugins( plugins );
		parser.parse( onLoad, onError );

	}

	parseAsync( data, path ) {

		const scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.parse( data, path, resolve, reject );

		} );

	}

}

/* GLTFREGISTRY */

function GLTFRegistry() {

	let objects = {};

	return	{

		get: function ( key ) {

			return objects[ key ];

		},

		add: function ( key, object ) {

			objects[ key ] = object;

		},

		remove: function ( key ) {

			delete objects[ key ];

		},

		removeAll: function () {

			objects = {};

		}

	};

}

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

const EXTENSIONS = {
	KHR_BINARY_GLTF: 'KHR_binary_glTF',
	KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
	KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
	KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
	KHR_MATERIALS_IOR: 'KHR_materials_ior',
	KHR_MATERIALS_SHEEN: 'KHR_materials_sheen',
	KHR_MATERIALS_SPECULAR: 'KHR_materials_specular',
	KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
	KHR_MATERIALS_IRIDESCENCE: 'KHR_materials_iridescence',
	KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
	KHR_MATERIALS_VOLUME: 'KHR_materials_volume',
	KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
	KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
	KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
	KHR_MATERIALS_EMISSIVE_STRENGTH: 'KHR_materials_emissive_strength',
	EXT_TEXTURE_WEBP: 'EXT_texture_webp',
	EXT_TEXTURE_AVIF: 'EXT_texture_avif',
	EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression',
	EXT_MESH_GPU_INSTANCING: 'EXT_mesh_gpu_instancing'
};

/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
class GLTFLightsExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

		// Object3D instance caches
		this.cache = { refs: {}, uses: {} };

	}

	_markDefs() {

		const parser = this.parser;
		const nodeDefs = this.parser.json.nodes || [];

		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.extensions
					&& nodeDef.extensions[ this.name ]
					&& nodeDef.extensions[ this.name ].light !== undefined ) {

				parser._addNodeRef( this.cache, nodeDef.extensions[ this.name ].light );

			}

		}

	}

	_loadLight( lightIndex ) {

		const parser = this.parser;
		const cacheKey = 'light:' + lightIndex;
		let dependency = parser.cache.get( cacheKey );

		if ( dependency ) return dependency;

		const json = parser.json;
		const extensions = ( json.extensions && json.extensions[ this.name ] ) || {};
		const lightDefs = extensions.lights || [];
		const lightDef = lightDefs[ lightIndex ];
		let lightNode;

		const color = new Color( 0xffffff );

		if ( lightDef.color !== undefined ) color.fromArray( lightDef.color );

		const range = lightDef.range !== undefined ? lightDef.range : 0;

		switch ( lightDef.type ) {

			case 'directional':
				lightNode = new DirectionalLight( color );
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			case 'point':
				lightNode = new PointLight( color );
				lightNode.distance = range;
				break;

			case 'spot':
				lightNode = new SpotLight( color );
				lightNode.distance = range;
				// Handle spotlight properties.
				lightDef.spot = lightDef.spot || {};
				lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
				lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
				lightNode.angle = lightDef.spot.outerConeAngle;
				lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			default:
				throw new Error( 'THREE.GLTFLoader: Unexpected light type: ' + lightDef.type );

		}

		// Some lights (e.g. spot) default to a position other than the origin. Reset the position
		// here, because node-level parsing will only override position if explicitly specified.
		lightNode.position.set( 0, 0, 0 );

		lightNode.decay = 2;

		assignExtrasToUserData( lightNode, lightDef );

		if ( lightDef.intensity !== undefined ) lightNode.intensity = lightDef.intensity;

		lightNode.name = parser.createUniqueName( lightDef.name || ( 'light_' + lightIndex ) );

		dependency = Promise.resolve( lightNode );

		parser.cache.add( cacheKey, dependency );

		return dependency;

	}

	getDependency( type, index ) {

		if ( type !== 'light' ) return;

		return this._loadLight( index );

	}

	createNodeAttachment( nodeIndex ) {

		const self = this;
		const parser = this.parser;
		const json = parser.json;
		const nodeDef = json.nodes[ nodeIndex ];
		const lightDef = ( nodeDef.extensions && nodeDef.extensions[ this.name ] ) || {};
		const lightIndex = lightDef.light;

		if ( lightIndex === undefined ) return null;

		return this._loadLight( lightIndex ).then( function ( light ) {

			return parser._getNodeRef( self.cache, lightIndex, light );

		} );

	}

}

/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
class GLTFMaterialsUnlitExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

	}

	getMaterialType() {

		return MeshBasicMaterial;

	}

	extendParams( materialParams, materialDef, parser ) {

		const pending = [];

		materialParams.color = new Color( 1.0, 1.0, 1.0 );
		materialParams.opacity = 1.0;

		const metallicRoughness = materialDef.pbrMetallicRoughness;

		if ( metallicRoughness ) {

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, sRGBEncoding ) );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Emissive Strength Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/blob/5768b3ce0ef32bc39cdf1bef10b948586635ead3/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md
 */
class GLTFMaterialsEmissiveStrengthExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_EMISSIVE_STRENGTH;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const emissiveStrength = materialDef.extensions[ this.name ].emissiveStrength;

		if ( emissiveStrength !== undefined ) {

			materialParams.emissiveIntensity = emissiveStrength;

		}

		return Promise.resolve();

	}

}

/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
class GLTFMaterialsClearcoatExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.clearcoatFactor !== undefined ) {

			materialParams.clearcoat = extension.clearcoatFactor;

		}

		if ( extension.clearcoatTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatMap', extension.clearcoatTexture ) );

		}

		if ( extension.clearcoatRoughnessFactor !== undefined ) {

			materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;

		}

		if ( extension.clearcoatRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture ) );

		}

		if ( extension.clearcoatNormalTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture ) );

			if ( extension.clearcoatNormalTexture.scale !== undefined ) {

				const scale = extension.clearcoatNormalTexture.scale;

				materialParams.clearcoatNormalScale = new Vector2( scale, scale );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Iridescence Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence
 */
class GLTFMaterialsIridescenceExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IRIDESCENCE;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.iridescenceFactor !== undefined ) {

			materialParams.iridescence = extension.iridescenceFactor;

		}

		if ( extension.iridescenceTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceMap', extension.iridescenceTexture ) );

		}

		if ( extension.iridescenceIor !== undefined ) {

			materialParams.iridescenceIOR = extension.iridescenceIor;

		}

		if ( materialParams.iridescenceThicknessRange === undefined ) {

			materialParams.iridescenceThicknessRange = [ 100, 400 ];

		}

		if ( extension.iridescenceThicknessMinimum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 0 ] = extension.iridescenceThicknessMinimum;

		}

		if ( extension.iridescenceThicknessMaximum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 1 ] = extension.iridescenceThicknessMaximum;

		}

		if ( extension.iridescenceThicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceThicknessMap', extension.iridescenceThicknessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
class GLTFMaterialsSheenExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SHEEN;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		materialParams.sheenColor = new Color( 0, 0, 0 );
		materialParams.sheenRoughness = 0;
		materialParams.sheen = 1;

		const extension = materialDef.extensions[ this.name ];

		if ( extension.sheenColorFactor !== undefined ) {

			materialParams.sheenColor.fromArray( extension.sheenColorFactor );

		}

		if ( extension.sheenRoughnessFactor !== undefined ) {

			materialParams.sheenRoughness = extension.sheenRoughnessFactor;

		}

		if ( extension.sheenColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenColorMap', extension.sheenColorTexture, sRGBEncoding ) );

		}

		if ( extension.sheenRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenRoughnessMap', extension.sheenRoughnessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
class GLTFMaterialsTransmissionExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.transmissionFactor !== undefined ) {

			materialParams.transmission = extension.transmissionFactor;

		}

		if ( extension.transmissionTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'transmissionMap', extension.transmissionTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
class GLTFMaterialsVolumeExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_VOLUME;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.thickness = extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;

		if ( extension.thicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'thicknessMap', extension.thicknessTexture ) );

		}

		materialParams.attenuationDistance = extension.attenuationDistance || Infinity;

		const colorArray = extension.attenuationColor || [ 1, 1, 1 ];
		materialParams.attenuationColor = new Color( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ] );

		return Promise.all( pending );

	}

}

/**
 * Materials ior Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_ior
 */
class GLTFMaterialsIorExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IOR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const extension = materialDef.extensions[ this.name ];

		materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;

		return Promise.resolve();

	}

}

/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
class GLTFMaterialsSpecularExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.specularIntensity = extension.specularFactor !== undefined ? extension.specularFactor : 1.0;

		if ( extension.specularTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularIntensityMap', extension.specularTexture ) );

		}

		const colorArray = extension.specularColorFactor || [ 1, 1, 1 ];
		materialParams.specularColor = new Color( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ] );

		if ( extension.specularColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularColorMap', extension.specularColorTexture, sRGBEncoding ) );

		}

		return Promise.all( pending );

	}

}

/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
class GLTFTextureBasisUExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_TEXTURE_BASISU;

	}

	loadTexture( textureIndex ) {

		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ this.name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ this.name ];
		const loader = parser.options.ktx2Loader;

		if ( ! loader ) {

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures' );

			} else {

				// Assumes that the extension is optional and that a fallback texture is present
				return null;

			}

		}

		return parser.loadTextureImage( textureIndex, extension.source, loader );

	}

}

/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
class GLTFTextureWebPExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
		this.isSupported = null;

	}

	loadTexture( textureIndex ) {

		const name = this.name;
		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ name ];
		const source = json.images[ extension.source ];

		let loader = parser.textureLoader;
		if ( source.uri ) {

			const handler = parser.options.manager.getHandler( source.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.detectSupport().then( function ( isSupported ) {

			if ( isSupported ) return parser.loadTextureImage( textureIndex, extension.source, loader );

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: WebP required by asset but unsupported.' );

			}

			// Fall back to PNG or JPEG.
			return parser.loadTexture( textureIndex );

		} );

	}

	detectSupport() {

		if ( ! this.isSupported ) {

			this.isSupported = new Promise( function ( resolve ) {

				const image = new Image();

				// Lossy test image. Support for lossy images doesn't guarantee support for all
				// WebP images, unfortunately.
				image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

				image.onload = image.onerror = function () {

					resolve( image.height === 1 );

				};

			} );

		}

		return this.isSupported;

	}

}

/**
 * AVIF Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_avif
 */
class GLTFTextureAVIFExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_TEXTURE_AVIF;
		this.isSupported = null;

	}

	loadTexture( textureIndex ) {

		const name = this.name;
		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ name ];
		const source = json.images[ extension.source ];

		let loader = parser.textureLoader;
		if ( source.uri ) {

			const handler = parser.options.manager.getHandler( source.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.detectSupport().then( function ( isSupported ) {

			if ( isSupported ) return parser.loadTextureImage( textureIndex, extension.source, loader );

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: AVIF required by asset but unsupported.' );

			}

			// Fall back to PNG or JPEG.
			return parser.loadTexture( textureIndex );

		} );

	}

	detectSupport() {

		if ( ! this.isSupported ) {

			this.isSupported = new Promise( function ( resolve ) {

				const image = new Image();

				// Lossy test image.
				image.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=';
				image.onload = image.onerror = function () {

					resolve( image.height === 1 );

				};

			} );

		}

		return this.isSupported;

	}

}

/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
class GLTFMeshoptCompression {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
		this.parser = parser;

	}

	loadBufferView( index ) {

		const json = this.parser.json;
		const bufferView = json.bufferViews[ index ];

		if ( bufferView.extensions && bufferView.extensions[ this.name ] ) {

			const extensionDef = bufferView.extensions[ this.name ];

			const buffer = this.parser.getDependency( 'buffer', extensionDef.buffer );
			const decoder = this.parser.options.meshoptDecoder;

			if ( ! decoder || ! decoder.supported ) {

				if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

					throw new Error( 'THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files' );

				} else {

					// Assumes that the extension is optional and that fallback buffer data is present
					return null;

				}

			}

			return buffer.then( function ( res ) {

				const byteOffset = extensionDef.byteOffset || 0;
				const byteLength = extensionDef.byteLength || 0;

				const count = extensionDef.count;
				const stride = extensionDef.byteStride;

				const source = new Uint8Array( res, byteOffset, byteLength );

				if ( decoder.decodeGltfBufferAsync ) {

					return decoder.decodeGltfBufferAsync( count, stride, source, extensionDef.mode, extensionDef.filter ).then( function ( res ) {

						return res.buffer;

					} );

				} else {

					// Support for MeshoptDecoder 0.18 or earlier, without decodeGltfBufferAsync
					return decoder.ready.then( function () {

						const result = new ArrayBuffer( count * stride );
						decoder.decodeGltfBuffer( new Uint8Array( result ), count, stride, source, extensionDef.mode, extensionDef.filter );
						return result;

					} );

				}

			} );

		} else {

			return null;

		}

	}

}

/**
 * GPU Instancing Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 *
 */
class GLTFMeshGpuInstancing {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESH_GPU_INSTANCING;
		this.parser = parser;

	}

	createNodeMesh( nodeIndex ) {

		const json = this.parser.json;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( ! nodeDef.extensions || ! nodeDef.extensions[ this.name ] ||
			nodeDef.mesh === undefined ) {

			return null;

		}

		const meshDef = json.meshes[ nodeDef.mesh ];

		// No Points or Lines + Instancing support yet

		for ( const primitive of meshDef.primitives ) {

			if ( primitive.mode !== WEBGL_CONSTANTS.TRIANGLES &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_STRIP &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_FAN &&
				 primitive.mode !== undefined ) {

				return null;

			}

		}

		const extensionDef = nodeDef.extensions[ this.name ];
		const attributesDef = extensionDef.attributes;

		// @TODO: Can we support InstancedMesh + SkinnedMesh?

		const pending = [];
		const attributes = {};

		for ( const key in attributesDef ) {

			pending.push( this.parser.getDependency( 'accessor', attributesDef[ key ] ).then( accessor => {

				attributes[ key ] = accessor;
				return attributes[ key ];

			} ) );

		}

		if ( pending.length < 1 ) {

			return null;

		}

		pending.push( this.parser.createNodeMesh( nodeIndex ) );

		return Promise.all( pending ).then( results => {

			const nodeObject = results.pop();
			const meshes = nodeObject.isGroup ? nodeObject.children : [ nodeObject ];
			const count = results[ 0 ].count; // All attribute counts should be same
			const instancedMeshes = [];

			for ( const mesh of meshes ) {

				// Temporal variables
				const m = new Matrix4();
				const p = new Vector3();
				const q = new Quaternion();
				const s = new Vector3( 1, 1, 1 );

				const instancedMesh = new InstancedMesh( mesh.geometry, mesh.material, count );

				for ( let i = 0; i < count; i ++ ) {

					if ( attributes.TRANSLATION ) {

						p.fromBufferAttribute( attributes.TRANSLATION, i );

					}

					if ( attributes.ROTATION ) {

						q.fromBufferAttribute( attributes.ROTATION, i );

					}

					if ( attributes.SCALE ) {

						s.fromBufferAttribute( attributes.SCALE, i );

					}

					instancedMesh.setMatrixAt( i, m.compose( p, q, s ) );

				}

				// Add instance attributes to the geometry, excluding TRS.
				for ( const attributeName in attributes ) {

					if ( attributeName !== 'TRANSLATION' &&
						 attributeName !== 'ROTATION' &&
						 attributeName !== 'SCALE' ) {

						mesh.geometry.setAttribute( attributeName, attributes[ attributeName ] );

					}

				}

				// Just in case
				Object3D.prototype.copy.call( instancedMesh, mesh );

				// https://github.com/mrdoob/three.js/issues/18334
				instancedMesh.frustumCulled = false;
				this.parser.assignFinalMaterial( instancedMesh );

				instancedMeshes.push( instancedMesh );

			}

			if ( nodeObject.isGroup ) {

				nodeObject.clear();

				nodeObject.add( ... instancedMeshes );

				return nodeObject;

			}

			return instancedMeshes[ 0 ];

		} );

	}

}

/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

class GLTFBinaryExtension {

	constructor( data ) {

		this.name = EXTENSIONS.KHR_BINARY_GLTF;
		this.content = null;
		this.body = null;

		const headerView = new DataView( data, 0, BINARY_EXTENSION_HEADER_LENGTH );
		const textDecoder = new TextDecoder();

		this.header = {
			magic: textDecoder.decode( new Uint8Array( data.slice( 0, 4 ) ) ),
			version: headerView.getUint32( 4, true ),
			length: headerView.getUint32( 8, true )
		};

		if ( this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC ) {

			throw new Error( 'THREE.GLTFLoader: Unsupported glTF-Binary header.' );

		} else if ( this.header.version < 2.0 ) {

			throw new Error( 'THREE.GLTFLoader: Legacy binary file detected.' );

		}

		const chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
		const chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
		let chunkIndex = 0;

		while ( chunkIndex < chunkContentsLength ) {

			const chunkLength = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			const chunkType = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

				const contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
				this.content = textDecoder.decode( contentArray );

			} else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

				const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
				this.body = data.slice( byteOffset, byteOffset + chunkLength );

			}

			// Clients must ignore chunks with unknown types.

			chunkIndex += chunkLength;

		}

		if ( this.content === null ) {

			throw new Error( 'THREE.GLTFLoader: JSON content not found.' );

		}

	}

}

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
class GLTFDracoMeshCompressionExtension {

	constructor( json, dracoLoader ) {

		if ( ! dracoLoader ) {

			throw new Error( 'THREE.GLTFLoader: No DRACOLoader instance provided.' );

		}

		this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
		this.json = json;
		this.dracoLoader = dracoLoader;
		this.dracoLoader.preload();

	}

	decodePrimitive( primitive, parser ) {

		const json = this.json;
		const dracoLoader = this.dracoLoader;
		const bufferViewIndex = primitive.extensions[ this.name ].bufferView;
		const gltfAttributeMap = primitive.extensions[ this.name ].attributes;
		const threeAttributeMap = {};
		const attributeNormalizedMap = {};
		const attributeTypeMap = {};

		for ( const attributeName in gltfAttributeMap ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			threeAttributeMap[ threeAttributeName ] = gltfAttributeMap[ attributeName ];

		}

		for ( const attributeName in primitive.attributes ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			if ( gltfAttributeMap[ attributeName ] !== undefined ) {

				const accessorDef = json.accessors[ primitive.attributes[ attributeName ] ];
				const componentType = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

				attributeTypeMap[ threeAttributeName ] = componentType.name;
				attributeNormalizedMap[ threeAttributeName ] = accessorDef.normalized === true;

			}

		}

		return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

			return new Promise( function ( resolve ) {

				dracoLoader.decodeDracoFile( bufferView, function ( geometry ) {

					for ( const attributeName in geometry.attributes ) {

						const attribute = geometry.attributes[ attributeName ];
						const normalized = attributeNormalizedMap[ attributeName ];

						if ( normalized !== undefined ) attribute.normalized = normalized;

					}

					resolve( geometry );

				}, threeAttributeMap, attributeTypeMap );

			} );

		} );

	}

}

/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
class GLTFTextureTransformExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

	}

	extendTexture( texture, transform ) {

		if ( transform.texCoord !== undefined ) {

			console.warn( 'THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.' );

		}

		if ( transform.offset === undefined && transform.rotation === undefined && transform.scale === undefined ) {

			// See https://github.com/mrdoob/three.js/issues/21819.
			return texture;

		}

		texture = texture.clone();

		if ( transform.offset !== undefined ) {

			texture.offset.fromArray( transform.offset );

		}

		if ( transform.rotation !== undefined ) {

			texture.rotation = transform.rotation;

		}

		if ( transform.scale !== undefined ) {

			texture.repeat.fromArray( transform.scale );

		}

		texture.needsUpdate = true;

		return texture;

	}

}

/**
 * Mesh Quantization Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
 */
class GLTFMeshQuantizationExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;

	}

}

/*********************************/
/********** INTERPOLATION ********/
/*********************************/

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {

	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	copySampleValue_( index ) {

		// Copies a sample value to the result buffer. See description of glTF
		// CUBICSPLINE values layout in interpolate_() function below.

		const result = this.resultBuffer,
			values = this.sampleValues,
			valueSize = this.valueSize,
			offset = index * valueSize * 3 + valueSize;

		for ( let i = 0; i !== valueSize; i ++ ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	}

	interpolate_( i1, t0, t, t1 ) {

		const result = this.resultBuffer;
		const values = this.sampleValues;
		const stride = this.valueSize;

		const stride2 = stride * 2;
		const stride3 = stride * 3;

		const td = t1 - t0;

		const p = ( t - t0 ) / td;
		const pp = p * p;
		const ppp = pp * p;

		const offset1 = i1 * stride3;
		const offset0 = offset1 - stride3;

		const s2 = - 2 * ppp + 3 * pp;
		const s3 = ppp - pp;
		const s0 = 1 - s2;
		const s1 = s3 - pp + p;

		// Layout of keyframe output values for CUBICSPLINE animations:
		//   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
		for ( let i = 0; i !== stride; i ++ ) {

			const p0 = values[ offset0 + i + stride ]; // splineVertex_k
			const m0 = values[ offset0 + i + stride2 ] * td; // outTangent_k * (t_k+1 - t_k)
			const p1 = values[ offset1 + i + stride ]; // splineVertex_k+1
			const m1 = values[ offset1 + i ] * td; // inTangent_k+1 * (t_k+1 - t_k)

			result[ i ] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;

		}

		return result;

	}

}

const _q = new Quaternion();

class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {

	interpolate_( i1, t0, t, t1 ) {

		const result = super.interpolate_( i1, t0, t, t1 );

		_q.fromArray( result ).normalize().toArray( result );

		return result;

	}

}


/*********************************/
/********** INTERNALS ************/
/*********************************/

/* CONSTANTS */

const WEBGL_CONSTANTS = {
	FLOAT: 5126,
	//FLOAT_MAT2: 35674,
	FLOAT_MAT3: 35675,
	FLOAT_MAT4: 35676,
	FLOAT_VEC2: 35664,
	FLOAT_VEC3: 35665,
	FLOAT_VEC4: 35666,
	LINEAR: 9729,
	REPEAT: 10497,
	SAMPLER_2D: 35678,
	POINTS: 0,
	LINES: 1,
	LINE_LOOP: 2,
	LINE_STRIP: 3,
	TRIANGLES: 4,
	TRIANGLE_STRIP: 5,
	TRIANGLE_FAN: 6,
	UNSIGNED_BYTE: 5121,
	UNSIGNED_SHORT: 5123
};

const WEBGL_COMPONENT_TYPES = {
	5120: Int8Array,
	5121: Uint8Array,
	5122: Int16Array,
	5123: Uint16Array,
	5125: Uint32Array,
	5126: Float32Array
};

const WEBGL_FILTERS = {
	9728: NearestFilter,
	9729: LinearFilter,
	9984: NearestMipmapNearestFilter,
	9985: LinearMipmapNearestFilter,
	9986: NearestMipmapLinearFilter,
	9987: LinearMipmapLinearFilter
};

const WEBGL_WRAPPINGS = {
	33071: ClampToEdgeWrapping,
	33648: MirroredRepeatWrapping,
	10497: RepeatWrapping
};

const WEBGL_TYPE_SIZES = {
	'SCALAR': 1,
	'VEC2': 2,
	'VEC3': 3,
	'VEC4': 4,
	'MAT2': 4,
	'MAT3': 9,
	'MAT4': 16
};

const ATTRIBUTES = {
	POSITION: 'position',
	NORMAL: 'normal',
	TANGENT: 'tangent',
	TEXCOORD_0: 'uv',
	TEXCOORD_1: 'uv2',
	COLOR_0: 'color',
	WEIGHTS_0: 'skinWeight',
	JOINTS_0: 'skinIndex',
};

const PATH_PROPERTIES = {
	scale: 'scale',
	translation: 'position',
	rotation: 'quaternion',
	weights: 'morphTargetInfluences'
};

const INTERPOLATION = {
	CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
		                        // keyframe track will be initialized with a default interpolation type, then modified.
	LINEAR: InterpolateLinear,
	STEP: InterpolateDiscrete
};

const ALPHA_MODES = {
	OPAQUE: 'OPAQUE',
	MASK: 'MASK',
	BLEND: 'BLEND'
};

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
function createDefaultMaterial( cache ) {

	if ( cache[ 'DefaultMaterial' ] === undefined ) {

		cache[ 'DefaultMaterial' ] = new MeshStandardMaterial( {
			color: 0xFFFFFF,
			emissive: 0x000000,
			metalness: 1,
			roughness: 1,
			transparent: false,
			depthTest: true,
			side: FrontSide
		} );

	}

	return cache[ 'DefaultMaterial' ];

}

function addUnknownExtensionsToUserData( knownExtensions, object, objectDef ) {

	// Add unknown glTF extensions to an object's userData.

	for ( const name in objectDef.extensions ) {

		if ( knownExtensions[ name ] === undefined ) {

			object.userData.gltfExtensions = object.userData.gltfExtensions || {};
			object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];

		}

	}

}

/**
 * @param {Object3D|Material|BufferGeometry} object
 * @param {GLTF.definition} gltfDef
 */
function assignExtrasToUserData( object, gltfDef ) {

	if ( gltfDef.extras !== undefined ) {

		if ( typeof gltfDef.extras === 'object' ) {

			Object.assign( object.userData, gltfDef.extras );

		} else {

			console.warn( 'THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );

		}

	}

}

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 *
 * @param {BufferGeometry} geometry
 * @param {Array<GLTF.Target>} targets
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addMorphTargets( geometry, targets, parser ) {

	let hasMorphPosition = false;
	let hasMorphNormal = false;
	let hasMorphColor = false;

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( target.POSITION !== undefined ) hasMorphPosition = true;
		if ( target.NORMAL !== undefined ) hasMorphNormal = true;
		if ( target.COLOR_0 !== undefined ) hasMorphColor = true;

		if ( hasMorphPosition && hasMorphNormal && hasMorphColor ) break;

	}

	if ( ! hasMorphPosition && ! hasMorphNormal && ! hasMorphColor ) return Promise.resolve( geometry );

	const pendingPositionAccessors = [];
	const pendingNormalAccessors = [];
	const pendingColorAccessors = [];

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( hasMorphPosition ) {

			const pendingAccessor = target.POSITION !== undefined
				? parser.getDependency( 'accessor', target.POSITION )
				: geometry.attributes.position;

			pendingPositionAccessors.push( pendingAccessor );

		}

		if ( hasMorphNormal ) {

			const pendingAccessor = target.NORMAL !== undefined
				? parser.getDependency( 'accessor', target.NORMAL )
				: geometry.attributes.normal;

			pendingNormalAccessors.push( pendingAccessor );

		}

		if ( hasMorphColor ) {

			const pendingAccessor = target.COLOR_0 !== undefined
				? parser.getDependency( 'accessor', target.COLOR_0 )
				: geometry.attributes.color;

			pendingColorAccessors.push( pendingAccessor );

		}

	}

	return Promise.all( [
		Promise.all( pendingPositionAccessors ),
		Promise.all( pendingNormalAccessors ),
		Promise.all( pendingColorAccessors )
	] ).then( function ( accessors ) {

		const morphPositions = accessors[ 0 ];
		const morphNormals = accessors[ 1 ];
		const morphColors = accessors[ 2 ];

		if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
		if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;
		if ( hasMorphColor ) geometry.morphAttributes.color = morphColors;
		geometry.morphTargetsRelative = true;

		return geometry;

	} );

}

/**
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets( mesh, meshDef ) {

	mesh.updateMorphTargets();

	if ( meshDef.weights !== undefined ) {

		for ( let i = 0, il = meshDef.weights.length; i < il; i ++ ) {

			mesh.morphTargetInfluences[ i ] = meshDef.weights[ i ];

		}

	}

	// .extras has user-defined data, so check that .extras.targetNames is an array.
	if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {

		const targetNames = meshDef.extras.targetNames;

		if ( mesh.morphTargetInfluences.length === targetNames.length ) {

			mesh.morphTargetDictionary = {};

			for ( let i = 0, il = targetNames.length; i < il; i ++ ) {

				mesh.morphTargetDictionary[ targetNames[ i ] ] = i;

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );

		}

	}

}

function createPrimitiveKey( primitiveDef ) {

	const dracoExtension = primitiveDef.extensions && primitiveDef.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ];
	let geometryKey;

	if ( dracoExtension ) {

		geometryKey = 'draco:' + dracoExtension.bufferView
				+ ':' + dracoExtension.indices
				+ ':' + createAttributesKey( dracoExtension.attributes );

	} else {

		geometryKey = primitiveDef.indices + ':' + createAttributesKey( primitiveDef.attributes ) + ':' + primitiveDef.mode;

	}

	return geometryKey;

}

function createAttributesKey( attributes ) {

	let attributesKey = '';

	const keys = Object.keys( attributes ).sort();

	for ( let i = 0, il = keys.length; i < il; i ++ ) {

		attributesKey += keys[ i ] + ':' + attributes[ keys[ i ] ] + ';';

	}

	return attributesKey;

}

function getNormalizedComponentScale( constructor ) {

	// Reference:
	// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

	switch ( constructor ) {

		case Int8Array:
			return 1 / 127;

		case Uint8Array:
			return 1 / 255;

		case Int16Array:
			return 1 / 32767;

		case Uint16Array:
			return 1 / 65535;

		default:
			throw new Error( 'THREE.GLTFLoader: Unsupported normalized accessor component type.' );

	}

}

function getImageURIMimeType( uri ) {

	if ( uri.search( /\.jpe?g($|\?)/i ) > 0 || uri.search( /^data\:image\/jpeg/ ) === 0 ) return 'image/jpeg';
	if ( uri.search( /\.webp($|\?)/i ) > 0 || uri.search( /^data\:image\/webp/ ) === 0 ) return 'image/webp';

	return 'image/png';

}

const _identityMatrix = new Matrix4();

/* GLTF PARSER */

class GLTFParser {

	constructor( json = {}, options = {} ) {

		this.json = json;
		this.extensions = {};
		this.plugins = {};
		this.options = options;

		// loader object cache
		this.cache = new GLTFRegistry();

		// associations between Three.js objects and glTF elements
		this.associations = new Map();

		// BufferGeometry caching
		this.primitiveCache = {};

		// Node cache
		this.nodeCache = {};

		// Object3D instance caches
		this.meshCache = { refs: {}, uses: {} };
		this.cameraCache = { refs: {}, uses: {} };
		this.lightCache = { refs: {}, uses: {} };

		this.sourceCache = {};
		this.textureCache = {};

		// Track node names, to ensure no duplicates
		this.nodeNamesUsed = {};

		// Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
		// expensive work of uploading a texture to the GPU off the main thread.

		let isSafari = false;
		let isFirefox = false;
		let firefoxVersion = - 1;

		if ( typeof navigator !== 'undefined' ) {

			isSafari = /^((?!chrome|android).)*safari/i.test( navigator.userAgent ) === true;
			isFirefox = navigator.userAgent.indexOf( 'Firefox' ) > - 1;
			firefoxVersion = isFirefox ? navigator.userAgent.match( /Firefox\/([0-9]+)\./ )[ 1 ] : - 1;

		}

		if ( typeof createImageBitmap === 'undefined' || isSafari || ( isFirefox && firefoxVersion < 98 ) ) {

			this.textureLoader = new TextureLoader( this.options.manager );

		} else {

			this.textureLoader = new ImageBitmapLoader( this.options.manager );

		}

		this.textureLoader.setCrossOrigin( this.options.crossOrigin );
		this.textureLoader.setRequestHeader( this.options.requestHeader );

		this.fileLoader = new FileLoader( this.options.manager );
		this.fileLoader.setResponseType( 'arraybuffer' );

		if ( this.options.crossOrigin === 'use-credentials' ) {

			this.fileLoader.setWithCredentials( true );

		}

	}

	setExtensions( extensions ) {

		this.extensions = extensions;

	}

	setPlugins( plugins ) {

		this.plugins = plugins;

	}

	parse( onLoad, onError ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		// Clear the loader cache
		this.cache.removeAll();
		this.nodeCache = {};

		// Mark the special nodes/meshes in json for efficient parse
		this._invokeAll( function ( ext ) {

			return ext._markDefs && ext._markDefs();

		} );

		Promise.all( this._invokeAll( function ( ext ) {

			return ext.beforeRoot && ext.beforeRoot();

		} ) ).then( function () {

			return Promise.all( [

				parser.getDependencies( 'scene' ),
				parser.getDependencies( 'animation' ),
				parser.getDependencies( 'camera' ),

			] );

		} ).then( function ( dependencies ) {

			const result = {
				scene: dependencies[ 0 ][ json.scene || 0 ],
				scenes: dependencies[ 0 ],
				animations: dependencies[ 1 ],
				cameras: dependencies[ 2 ],
				asset: json.asset,
				parser: parser,
				userData: {}
			};

			addUnknownExtensionsToUserData( extensions, result, json );

			assignExtrasToUserData( result, json );

			Promise.all( parser._invokeAll( function ( ext ) {

				return ext.afterRoot && ext.afterRoot( result );

			} ) ).then( function () {

				onLoad( result );

			} );

		} ).catch( onError );

	}

	/**
	 * Marks the special nodes/meshes in json for efficient parse.
	 */
	_markDefs() {

		const nodeDefs = this.json.nodes || [];
		const skinDefs = this.json.skins || [];
		const meshDefs = this.json.meshes || [];

		// Nothing in the node definition indicates whether it is a Bone or an
		// Object3D. Use the skins' joint references to mark bones.
		for ( let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {

			const joints = skinDefs[ skinIndex ].joints;

			for ( let i = 0, il = joints.length; i < il; i ++ ) {

				nodeDefs[ joints[ i ] ].isBone = true;

			}

		}

		// Iterate over all nodes, marking references to shared resources,
		// as well as skeleton joints.
		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.mesh !== undefined ) {

				this._addNodeRef( this.meshCache, nodeDef.mesh );

				// Nothing in the mesh definition indicates whether it is
				// a SkinnedMesh or Mesh. Use the node's mesh reference
				// to mark SkinnedMesh if node has skin.
				if ( nodeDef.skin !== undefined ) {

					meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;

				}

			}

			if ( nodeDef.camera !== undefined ) {

				this._addNodeRef( this.cameraCache, nodeDef.camera );

			}

		}

	}

	/**
	 * Counts references to shared node / Object3D resources. These resources
	 * can be reused, or "instantiated", at multiple nodes in the scene
	 * hierarchy. Mesh, Camera, and Light instances are instantiated and must
	 * be marked. Non-scenegraph resources (like Materials, Geometries, and
	 * Textures) can be reused directly and are not marked here.
	 *
	 * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
	 */
	_addNodeRef( cache, index ) {

		if ( index === undefined ) return;

		if ( cache.refs[ index ] === undefined ) {

			cache.refs[ index ] = cache.uses[ index ] = 0;

		}

		cache.refs[ index ] ++;

	}

	/** Returns a reference to a shared resource, cloning it if necessary. */
	_getNodeRef( cache, index, object ) {

		if ( cache.refs[ index ] <= 1 ) return object;

		const ref = object.clone();

		// Propagates mappings to the cloned object, prevents mappings on the
		// original object from being lost.
		const updateMappings = ( original, clone ) => {

			const mappings = this.associations.get( original );
			if ( mappings != null ) {

				this.associations.set( clone, mappings );

			}

			for ( const [ i, child ] of original.children.entries() ) {

				updateMappings( child, clone.children[ i ] );

			}

		};

		updateMappings( object, ref );

		ref.name += '_instance_' + ( cache.uses[ index ] ++ );

		return ref;

	}

	_invokeOne( func ) {

		const extensions = Object.values( this.plugins );
		extensions.push( this );

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) return result;

		}

		return null;

	}

	_invokeAll( func ) {

		const extensions = Object.values( this.plugins );
		extensions.unshift( this );

		const pending = [];

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) pending.push( result );

		}

		return pending;

	}

	/**
	 * Requests the specified dependency asynchronously, with caching.
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
	 */
	getDependency( type, index ) {

		const cacheKey = type + ':' + index;
		let dependency = this.cache.get( cacheKey );

		if ( ! dependency ) {

			switch ( type ) {

				case 'scene':
					dependency = this.loadScene( index );
					break;

				case 'node':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadNode && ext.loadNode( index );

					} );
					break;

				case 'mesh':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMesh && ext.loadMesh( index );

					} );
					break;

				case 'accessor':
					dependency = this.loadAccessor( index );
					break;

				case 'bufferView':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadBufferView && ext.loadBufferView( index );

					} );
					break;

				case 'buffer':
					dependency = this.loadBuffer( index );
					break;

				case 'material':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMaterial && ext.loadMaterial( index );

					} );
					break;

				case 'texture':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadTexture && ext.loadTexture( index );

					} );
					break;

				case 'skin':
					dependency = this.loadSkin( index );
					break;

				case 'animation':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadAnimation && ext.loadAnimation( index );

					} );
					break;

				case 'camera':
					dependency = this.loadCamera( index );
					break;

				default:
					dependency = this._invokeOne( function ( ext ) {

						return ext != this && ext.getDependency && ext.getDependency( type, index );

					} );

					if ( ! dependency ) {

						throw new Error( 'Unknown type: ' + type );

					}

					break;

			}

			this.cache.add( cacheKey, dependency );

		}

		return dependency;

	}

	/**
	 * Requests all dependencies of the specified type asynchronously, with caching.
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
	getDependencies( type ) {

		let dependencies = this.cache.get( type );

		if ( ! dependencies ) {

			const parser = this;
			const defs = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || [];

			dependencies = Promise.all( defs.map( function ( def, index ) {

				return parser.getDependency( type, index );

			} ) );

			this.cache.add( type, dependencies );

		}

		return dependencies;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBuffer( bufferIndex ) {

		const bufferDef = this.json.buffers[ bufferIndex ];
		const loader = this.fileLoader;

		if ( bufferDef.type && bufferDef.type !== 'arraybuffer' ) {

			throw new Error( 'THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );

		}

		// If present, GLB container is required to be the first buffer.
		if ( bufferDef.uri === undefined && bufferIndex === 0 ) {

			return Promise.resolve( this.extensions[ EXTENSIONS.KHR_BINARY_GLTF ].body );

		}

		const options = this.options;

		return new Promise( function ( resolve, reject ) {

			loader.load( LoaderUtils.resolveURL( bufferDef.uri, options.path ), resolve, undefined, function () {

				reject( new Error( 'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );

			} );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferViewIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBufferView( bufferViewIndex ) {

		const bufferViewDef = this.json.bufferViews[ bufferViewIndex ];

		return this.getDependency( 'buffer', bufferViewDef.buffer ).then( function ( buffer ) {

			const byteLength = bufferViewDef.byteLength || 0;
			const byteOffset = bufferViewDef.byteOffset || 0;
			return buffer.slice( byteOffset, byteOffset + byteLength );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
	 * @param {number} accessorIndex
	 * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
	 */
	loadAccessor( accessorIndex ) {

		const parser = this;
		const json = this.json;

		const accessorDef = this.json.accessors[ accessorIndex ];

		if ( accessorDef.bufferView === undefined && accessorDef.sparse === undefined ) {

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];
			const normalized = accessorDef.normalized === true;

			const array = new TypedArray( accessorDef.count * itemSize );
			return Promise.resolve( new BufferAttribute( array, itemSize, normalized ) );

		}

		const pendingBufferViews = [];

		if ( accessorDef.bufferView !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.bufferView ) );

		} else {

			pendingBufferViews.push( null );

		}

		if ( accessorDef.sparse !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) );
			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) );

		}

		return Promise.all( pendingBufferViews ).then( function ( bufferViews ) {

			const bufferView = bufferViews[ 0 ];

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

			// For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
			const elementBytes = TypedArray.BYTES_PER_ELEMENT;
			const itemBytes = elementBytes * itemSize;
			const byteOffset = accessorDef.byteOffset || 0;
			const byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[ accessorDef.bufferView ].byteStride : undefined;
			const normalized = accessorDef.normalized === true;
			let array, bufferAttribute;

			// The buffer is not interleaved if the stride is the item size in bytes.
			if ( byteStride && byteStride !== itemBytes ) {

				// Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
				// This makes sure that IBA.count reflects accessor.count properly
				const ibSlice = Math.floor( byteOffset / byteStride );
				const ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count;
				let ib = parser.cache.get( ibCacheKey );

				if ( ! ib ) {

					array = new TypedArray( bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes );

					// Integer parameters to IB/IBA are in array elements, not bytes.
					ib = new InterleavedBuffer( array, byteStride / elementBytes );

					parser.cache.add( ibCacheKey, ib );

				}

				bufferAttribute = new InterleavedBufferAttribute( ib, itemSize, ( byteOffset % byteStride ) / elementBytes, normalized );

			} else {

				if ( bufferView === null ) {

					array = new TypedArray( accessorDef.count * itemSize );

				} else {

					array = new TypedArray( bufferView, byteOffset, accessorDef.count * itemSize );

				}

				bufferAttribute = new BufferAttribute( array, itemSize, normalized );

			}

			// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
			if ( accessorDef.sparse !== undefined ) {

				const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
				const TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];

				const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
				const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

				const sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
				const sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

				if ( bufferView !== null ) {

					// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
					bufferAttribute = new BufferAttribute( bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized );

				}

				for ( let i = 0, il = sparseIndices.length; i < il; i ++ ) {

					const index = sparseIndices[ i ];

					bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
					if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
					if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
					if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
					if ( itemSize >= 5 ) throw new Error( 'THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.' );

				}

			}

			return bufferAttribute;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
	 * @param {number} textureIndex
	 * @return {Promise<THREE.Texture|null>}
	 */
	loadTexture( textureIndex ) {

		const json = this.json;
		const options = this.options;
		const textureDef = json.textures[ textureIndex ];
		const sourceIndex = textureDef.source;
		const sourceDef = json.images[ sourceIndex ];

		let loader = this.textureLoader;

		if ( sourceDef.uri ) {

			const handler = options.manager.getHandler( sourceDef.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.loadTextureImage( textureIndex, sourceIndex, loader );

	}

	loadTextureImage( textureIndex, sourceIndex, loader ) {

		const parser = this;
		const json = this.json;

		const textureDef = json.textures[ textureIndex ];
		const sourceDef = json.images[ sourceIndex ];

		const cacheKey = ( sourceDef.uri || sourceDef.bufferView ) + ':' + textureDef.sampler;

		if ( this.textureCache[ cacheKey ] ) {

			// See https://github.com/mrdoob/three.js/issues/21559.
			return this.textureCache[ cacheKey ];

		}

		const promise = this.loadImageSource( sourceIndex, loader ).then( function ( texture ) {

			texture.flipY = false;

			texture.name = textureDef.name || sourceDef.name || '';

			const samplers = json.samplers || {};
			const sampler = samplers[ textureDef.sampler ] || {};

			texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || LinearFilter;
			texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || LinearMipmapLinearFilter;
			texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || RepeatWrapping;
			texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || RepeatWrapping;

			parser.associations.set( texture, { textures: textureIndex } );

			return texture;

		} ).catch( function () {

			return null;

		} );

		this.textureCache[ cacheKey ] = promise;

		return promise;

	}

	loadImageSource( sourceIndex, loader ) {

		const parser = this;
		const json = this.json;
		const options = this.options;

		if ( this.sourceCache[ sourceIndex ] !== undefined ) {

			return this.sourceCache[ sourceIndex ].then( ( texture ) => texture.clone() );

		}

		const sourceDef = json.images[ sourceIndex ];

		const URL = self.URL || self.webkitURL;

		let sourceURI = sourceDef.uri || '';
		let isObjectURL = false;

		if ( sourceDef.bufferView !== undefined ) {

			// Load binary image data from bufferView, if provided.

			sourceURI = parser.getDependency( 'bufferView', sourceDef.bufferView ).then( function ( bufferView ) {

				isObjectURL = true;
				const blob = new Blob( [ bufferView ], { type: sourceDef.mimeType } );
				sourceURI = URL.createObjectURL( blob );
				return sourceURI;

			} );

		} else if ( sourceDef.uri === undefined ) {

			throw new Error( 'THREE.GLTFLoader: Image ' + sourceIndex + ' is missing URI and bufferView' );

		}

		const promise = Promise.resolve( sourceURI ).then( function ( sourceURI ) {

			return new Promise( function ( resolve, reject ) {

				let onLoad = resolve;

				if ( loader.isImageBitmapLoader === true ) {

					onLoad = function ( imageBitmap ) {

						const texture = new Texture( imageBitmap );
						texture.needsUpdate = true;

						resolve( texture );

					};

				}

				loader.load( LoaderUtils.resolveURL( sourceURI, options.path ), onLoad, undefined, reject );

			} );

		} ).then( function ( texture ) {

			// Clean up resources and configure Texture.

			if ( isObjectURL === true ) {

				URL.revokeObjectURL( sourceURI );

			}

			texture.userData.mimeType = sourceDef.mimeType || getImageURIMimeType( sourceDef.uri );

			return texture;

		} ).catch( function ( error ) {

			console.error( 'THREE.GLTFLoader: Couldn\'t load texture', sourceURI );
			throw error;

		} );

		this.sourceCache[ sourceIndex ] = promise;
		return promise;

	}

	/**
	 * Asynchronously assigns a texture to the given material parameters.
	 * @param {Object} materialParams
	 * @param {string} mapName
	 * @param {Object} mapDef
	 * @return {Promise<Texture>}
	 */
	assignTexture( materialParams, mapName, mapDef, encoding ) {

		const parser = this;

		return this.getDependency( 'texture', mapDef.index ).then( function ( texture ) {

			if ( ! texture ) return null;

			// Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
			// However, we will copy UV set 0 to UV set 1 on demand for aoMap
			if ( mapDef.texCoord !== undefined && mapDef.texCoord != 0 && ! ( mapName === 'aoMap' && mapDef.texCoord == 1 ) ) {

				console.warn( 'THREE.GLTFLoader: Custom UV set ' + mapDef.texCoord + ' for texture ' + mapName + ' not yet supported.' );

			}

			if ( parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] ) {

				const transform = mapDef.extensions !== undefined ? mapDef.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] : undefined;

				if ( transform ) {

					const gltfReference = parser.associations.get( texture );
					texture = parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ].extendTexture( texture, transform );
					parser.associations.set( texture, gltfReference );

				}

			}

			if ( encoding !== undefined ) {

				texture.encoding = encoding;

			}

			materialParams[ mapName ] = texture;

			return texture;

		} );

	}

	/**
	 * Assigns final material to a Mesh, Line, or Points instance. The instance
	 * already has a material (generated from the glTF material options alone)
	 * but reuse of the same glTF material may require multiple threejs materials
	 * to accommodate different primitive types, defines, etc. New materials will
	 * be created if necessary, and reused from a cache.
	 * @param  {Object3D} mesh Mesh, Line, or Points instance.
	 */
	assignFinalMaterial( mesh ) {

		const geometry = mesh.geometry;
		let material = mesh.material;

		const useDerivativeTangents = geometry.attributes.tangent === undefined;
		const useVertexColors = geometry.attributes.color !== undefined;
		const useFlatShading = geometry.attributes.normal === undefined;

		if ( mesh.isPoints ) {

			const cacheKey = 'PointsMaterial:' + material.uuid;

			let pointsMaterial = this.cache.get( cacheKey );

			if ( ! pointsMaterial ) {

				pointsMaterial = new PointsMaterial();
				Material.prototype.copy.call( pointsMaterial, material );
				pointsMaterial.color.copy( material.color );
				pointsMaterial.map = material.map;
				pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

				this.cache.add( cacheKey, pointsMaterial );

			}

			material = pointsMaterial;

		} else if ( mesh.isLine ) {

			const cacheKey = 'LineBasicMaterial:' + material.uuid;

			let lineMaterial = this.cache.get( cacheKey );

			if ( ! lineMaterial ) {

				lineMaterial = new LineBasicMaterial();
				Material.prototype.copy.call( lineMaterial, material );
				lineMaterial.color.copy( material.color );

				this.cache.add( cacheKey, lineMaterial );

			}

			material = lineMaterial;

		}

		// Clone the material if it will be modified
		if ( useDerivativeTangents || useVertexColors || useFlatShading ) {

			let cacheKey = 'ClonedMaterial:' + material.uuid + ':';

			if ( useDerivativeTangents ) cacheKey += 'derivative-tangents:';
			if ( useVertexColors ) cacheKey += 'vertex-colors:';
			if ( useFlatShading ) cacheKey += 'flat-shading:';

			let cachedMaterial = this.cache.get( cacheKey );

			if ( ! cachedMaterial ) {

				cachedMaterial = material.clone();

				if ( useVertexColors ) cachedMaterial.vertexColors = true;
				if ( useFlatShading ) cachedMaterial.flatShading = true;

				if ( useDerivativeTangents ) {

					// https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
					if ( cachedMaterial.normalScale ) cachedMaterial.normalScale.y *= - 1;
					if ( cachedMaterial.clearcoatNormalScale ) cachedMaterial.clearcoatNormalScale.y *= - 1;

				}

				this.cache.add( cacheKey, cachedMaterial );

				this.associations.set( cachedMaterial, this.associations.get( material ) );

			}

			material = cachedMaterial;

		}

		// workarounds for mesh and geometry

		if ( material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined ) {

			geometry.setAttribute( 'uv2', geometry.attributes.uv );

		}

		mesh.material = material;

	}

	getMaterialType( /* materialIndex */ ) {

		return MeshStandardMaterial;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
	 * @param {number} materialIndex
	 * @return {Promise<Material>}
	 */
	loadMaterial( materialIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;
		const materialDef = json.materials[ materialIndex ];

		let materialType;
		const materialParams = {};
		const materialExtensions = materialDef.extensions || {};

		const pending = [];

		if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {

			const kmuExtension = extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
			materialType = kmuExtension.getMaterialType();
			pending.push( kmuExtension.extendParams( materialParams, materialDef, parser ) );

		} else {

			// Specification:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

			const metallicRoughness = materialDef.pbrMetallicRoughness || {};

			materialParams.color = new Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, sRGBEncoding ) );

			}

			materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
			materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

			if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
				pending.push( parser.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );

			}

			materialType = this._invokeOne( function ( ext ) {

				return ext.getMaterialType && ext.getMaterialType( materialIndex );

			} );

			pending.push( Promise.all( this._invokeAll( function ( ext ) {

				return ext.extendMaterialParams && ext.extendMaterialParams( materialIndex, materialParams );

			} ) ) );

		}

		if ( materialDef.doubleSided === true ) {

			materialParams.side = DoubleSide;

		}

		const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

		if ( alphaMode === ALPHA_MODES.BLEND ) {

			materialParams.transparent = true;

			// See: https://github.com/mrdoob/three.js/issues/17706
			materialParams.depthWrite = false;

		} else {

			materialParams.transparent = false;

			if ( alphaMode === ALPHA_MODES.MASK ) {

				materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;

			}

		}

		if ( materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) );

			materialParams.normalScale = new Vector2( 1, 1 );

			if ( materialDef.normalTexture.scale !== undefined ) {

				const scale = materialDef.normalTexture.scale;

				materialParams.normalScale.set( scale, scale );

			}

		}

		if ( materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

			if ( materialDef.occlusionTexture.strength !== undefined ) {

				materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;

			}

		}

		if ( materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial ) {

			materialParams.emissive = new Color().fromArray( materialDef.emissiveFactor );

		}

		if ( materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture, sRGBEncoding ) );

		}

		return Promise.all( pending ).then( function () {

			const material = new materialType( materialParams );

			if ( materialDef.name ) material.name = materialDef.name;

			assignExtrasToUserData( material, materialDef );

			parser.associations.set( material, { materials: materialIndex } );

			if ( materialDef.extensions ) addUnknownExtensionsToUserData( extensions, material, materialDef );

			return material;

		} );

	}

	/** When Object3D instances are targeted by animation, they need unique names. */
	createUniqueName( originalName ) {

		const sanitizedName = PropertyBinding.sanitizeNodeName( originalName || '' );

		let name = sanitizedName;

		for ( let i = 1; this.nodeNamesUsed[ name ]; ++ i ) {

			name = sanitizedName + '_' + i;

		}

		this.nodeNamesUsed[ name ] = true;

		return name;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
	 *
	 * Creates BufferGeometries from primitives.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Promise<Array<BufferGeometry>>}
	 */
	loadGeometries( primitives ) {

		const parser = this;
		const extensions = this.extensions;
		const cache = this.primitiveCache;

		function createDracoPrimitive( primitive ) {

			return extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ]
				.decodePrimitive( primitive, parser )
				.then( function ( geometry ) {

					return addPrimitiveAttributes( geometry, primitive, parser );

				} );

		}

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const primitive = primitives[ i ];
			const cacheKey = createPrimitiveKey( primitive );

			// See if we've already created this geometry
			const cached = cache[ cacheKey ];

			if ( cached ) {

				// Use the cached geometry if it exists
				pending.push( cached.promise );

			} else {

				let geometryPromise;

				if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) {

					// Use DRACO geometry if available
					geometryPromise = createDracoPrimitive( primitive );

				} else {

					// Otherwise create a new geometry
					geometryPromise = addPrimitiveAttributes( new BufferGeometry(), primitive, parser );

				}

				// Cache this geometry
				cache[ cacheKey ] = { primitive: primitive, promise: geometryPromise };

				pending.push( geometryPromise );

			}

		}

		return Promise.all( pending );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
	 * @param {number} meshIndex
	 * @return {Promise<Group|Mesh|SkinnedMesh>}
	 */
	loadMesh( meshIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		const meshDef = json.meshes[ meshIndex ];
		const primitives = meshDef.primitives;

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const material = primitives[ i ].material === undefined
				? createDefaultMaterial( this.cache )
				: this.getDependency( 'material', primitives[ i ].material );

			pending.push( material );

		}

		pending.push( parser.loadGeometries( primitives ) );

		return Promise.all( pending ).then( function ( results ) {

			const materials = results.slice( 0, results.length - 1 );
			const geometries = results[ results.length - 1 ];

			const meshes = [];

			for ( let i = 0, il = geometries.length; i < il; i ++ ) {

				const geometry = geometries[ i ];
				const primitive = primitives[ i ];

				// 1. create Mesh

				let mesh;

				const material = materials[ i ];

				if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
						primitive.mode === undefined ) {

					// .isSkinnedMesh isn't in glTF spec. See ._markDefs()
					mesh = meshDef.isSkinnedMesh === true
						? new SkinnedMesh( geometry, material )
						: new Mesh( geometry, material );

					if ( mesh.isSkinnedMesh === true && ! mesh.geometry.attributes.skinWeight.normalized ) {

						// we normalize floating point skin weight array to fix malformed assets (see #15319)
						// it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
						mesh.normalizeSkinWeights();

					}

					if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleStripDrawMode );

					} else if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleFanDrawMode );

					}

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {

					mesh = new LineSegments( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_STRIP ) {

					mesh = new Line( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_LOOP ) {

					mesh = new LineLoop( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.POINTS ) {

					mesh = new Points( geometry, material );

				} else {

					throw new Error( 'THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode );

				}

				if ( Object.keys( mesh.geometry.morphAttributes ).length > 0 ) {

					updateMorphTargets( mesh, meshDef );

				}

				mesh.name = parser.createUniqueName( meshDef.name || ( 'mesh_' + meshIndex ) );

				assignExtrasToUserData( mesh, meshDef );

				if ( primitive.extensions ) addUnknownExtensionsToUserData( extensions, mesh, primitive );

				parser.assignFinalMaterial( mesh );

				meshes.push( mesh );

			}

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				parser.associations.set( meshes[ i ], {
					meshes: meshIndex,
					primitives: i
				} );

			}

			if ( meshes.length === 1 ) {

				return meshes[ 0 ];

			}

			const group = new Group();

			parser.associations.set( group, { meshes: meshIndex } );

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				group.add( meshes[ i ] );

			}

			return group;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
	 * @param {number} cameraIndex
	 * @return {Promise<THREE.Camera>}
	 */
	loadCamera( cameraIndex ) {

		let camera;
		const cameraDef = this.json.cameras[ cameraIndex ];
		const params = cameraDef[ cameraDef.type ];

		if ( ! params ) {

			console.warn( 'THREE.GLTFLoader: Missing camera parameters.' );
			return;

		}

		if ( cameraDef.type === 'perspective' ) {

			camera = new PerspectiveCamera( MathUtils.radToDeg( params.yfov ), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6 );

		} else if ( cameraDef.type === 'orthographic' ) {

			camera = new OrthographicCamera( - params.xmag, params.xmag, params.ymag, - params.ymag, params.znear, params.zfar );

		}

		if ( cameraDef.name ) camera.name = this.createUniqueName( cameraDef.name );

		assignExtrasToUserData( camera, cameraDef );

		return Promise.resolve( camera );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
	 * @param {number} skinIndex
	 * @return {Promise<Skeleton>}
	 */
	loadSkin( skinIndex ) {

		const skinDef = this.json.skins[ skinIndex ];

		const pending = [];

		for ( let i = 0, il = skinDef.joints.length; i < il; i ++ ) {

			pending.push( this._loadNodeShallow( skinDef.joints[ i ] ) );

		}

		if ( skinDef.inverseBindMatrices !== undefined ) {

			pending.push( this.getDependency( 'accessor', skinDef.inverseBindMatrices ) );

		} else {

			pending.push( null );

		}

		return Promise.all( pending ).then( function ( results ) {

			const inverseBindMatrices = results.pop();
			const jointNodes = results;

			// Note that bones (joint nodes) may or may not be in the
			// scene graph at this time.

			const bones = [];
			const boneInverses = [];

			for ( let i = 0, il = jointNodes.length; i < il; i ++ ) {

				const jointNode = jointNodes[ i ];

				if ( jointNode ) {

					bones.push( jointNode );

					const mat = new Matrix4();

					if ( inverseBindMatrices !== null ) {

						mat.fromArray( inverseBindMatrices.array, i * 16 );

					}

					boneInverses.push( mat );

				} else {

					console.warn( 'THREE.GLTFLoader: Joint "%s" could not be found.', skinDef.joints[ i ] );

				}

			}

			return new Skeleton( bones, boneInverses );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 * @param {number} animationIndex
	 * @return {Promise<AnimationClip>}
	 */
	loadAnimation( animationIndex ) {

		const json = this.json;

		const animationDef = json.animations[ animationIndex ];

		const pendingNodes = [];
		const pendingInputAccessors = [];
		const pendingOutputAccessors = [];
		const pendingSamplers = [];
		const pendingTargets = [];

		for ( let i = 0, il = animationDef.channels.length; i < il; i ++ ) {

			const channel = animationDef.channels[ i ];
			const sampler = animationDef.samplers[ channel.sampler ];
			const target = channel.target;
			const name = target.node;
			const input = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.input ] : sampler.input;
			const output = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.output ] : sampler.output;

			pendingNodes.push( this.getDependency( 'node', name ) );
			pendingInputAccessors.push( this.getDependency( 'accessor', input ) );
			pendingOutputAccessors.push( this.getDependency( 'accessor', output ) );
			pendingSamplers.push( sampler );
			pendingTargets.push( target );

		}

		return Promise.all( [

			Promise.all( pendingNodes ),
			Promise.all( pendingInputAccessors ),
			Promise.all( pendingOutputAccessors ),
			Promise.all( pendingSamplers ),
			Promise.all( pendingTargets )

		] ).then( function ( dependencies ) {

			const nodes = dependencies[ 0 ];
			const inputAccessors = dependencies[ 1 ];
			const outputAccessors = dependencies[ 2 ];
			const samplers = dependencies[ 3 ];
			const targets = dependencies[ 4 ];

			const tracks = [];

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				const node = nodes[ i ];
				const inputAccessor = inputAccessors[ i ];
				const outputAccessor = outputAccessors[ i ];
				const sampler = samplers[ i ];
				const target = targets[ i ];

				if ( node === undefined ) continue;

				node.updateMatrix();

				let TypedKeyframeTrack;

				switch ( PATH_PROPERTIES[ target.path ] ) {

					case PATH_PROPERTIES.weights:

						TypedKeyframeTrack = NumberKeyframeTrack;
						break;

					case PATH_PROPERTIES.rotation:

						TypedKeyframeTrack = QuaternionKeyframeTrack;
						break;

					case PATH_PROPERTIES.position:
					case PATH_PROPERTIES.scale:
					default:

						TypedKeyframeTrack = VectorKeyframeTrack;
						break;

				}

				const targetName = node.name ? node.name : node.uuid;

				const interpolation = sampler.interpolation !== undefined ? INTERPOLATION[ sampler.interpolation ] : InterpolateLinear;

				const targetNames = [];

				if ( PATH_PROPERTIES[ target.path ] === PATH_PROPERTIES.weights ) {

					node.traverse( function ( object ) {

						if ( object.morphTargetInfluences ) {

							targetNames.push( object.name ? object.name : object.uuid );

						}

					} );

				} else {

					targetNames.push( targetName );

				}

				let outputArray = outputAccessor.array;

				if ( outputAccessor.normalized ) {

					const scale = getNormalizedComponentScale( outputArray.constructor );
					const scaled = new Float32Array( outputArray.length );

					for ( let j = 0, jl = outputArray.length; j < jl; j ++ ) {

						scaled[ j ] = outputArray[ j ] * scale;

					}

					outputArray = scaled;

				}

				for ( let j = 0, jl = targetNames.length; j < jl; j ++ ) {

					const track = new TypedKeyframeTrack(
						targetNames[ j ] + '.' + PATH_PROPERTIES[ target.path ],
						inputAccessor.array,
						outputArray,
						interpolation
					);

					// Override interpolation with custom factory method.
					if ( sampler.interpolation === 'CUBICSPLINE' ) {

						track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline( result ) {

							// A CUBICSPLINE keyframe in glTF has three output values for each input value,
							// representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
							// must be divided by three to get the interpolant's sampleSize argument.

							const interpolantType = ( this instanceof QuaternionKeyframeTrack ) ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant;

							return new interpolantType( this.times, this.values, this.getValueSize() / 3, result );

						};

						// Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
						track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

					}

					tracks.push( track );

				}

			}

			const name = animationDef.name ? animationDef.name : 'animation_' + animationIndex;

			return new AnimationClip( name, undefined, tracks );

		} );

	}

	createNodeMesh( nodeIndex ) {

		const json = this.json;
		const parser = this;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( nodeDef.mesh === undefined ) return null;

		return parser.getDependency( 'mesh', nodeDef.mesh ).then( function ( mesh ) {

			const node = parser._getNodeRef( parser.meshCache, nodeDef.mesh, mesh );

			// if weights are provided on the node, override weights on the mesh.
			if ( nodeDef.weights !== undefined ) {

				node.traverse( function ( o ) {

					if ( ! o.isMesh ) return;

					for ( let i = 0, il = nodeDef.weights.length; i < il; i ++ ) {

						o.morphTargetInfluences[ i ] = nodeDef.weights[ i ];

					}

				} );

			}

			return node;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
	 * @param {number} nodeIndex
	 * @return {Promise<Object3D>}
	 */
	loadNode( nodeIndex ) {

		const json = this.json;
		const parser = this;

		const nodeDef = json.nodes[ nodeIndex ];

		return ( function () {

			const nodePending = parser._loadNodeShallow( nodeIndex );

			const childPending = [];
			const childrenDef = nodeDef.children || [];

			for ( let i = 0, il = childrenDef.length; i < il; i ++ ) {

				childPending.push( parser.getDependency( 'node', childrenDef[ i ] ) );

			}

			const skeletonPending = nodeDef.skin === undefined
				? Promise.resolve( null )
				: parser.getDependency( 'skin', nodeDef.skin );

			return Promise.all( [
				nodePending,
				Promise.all( childPending ),
				skeletonPending
			] );

		}() ).then( function ( results ) {

			const node = results[ 0 ];
			const children = results[ 1 ];
			const skeleton = results[ 2 ];

			if ( skeleton !== null ) {

				// This full traverse should be fine because
				// child glTF nodes have not been added to this node yet.
				node.traverse( function ( mesh ) {

					if ( ! mesh.isSkinnedMesh ) return;

					mesh.bind( skeleton, _identityMatrix );

				} );

			}

			for ( let i = 0, il = children.length; i < il; i ++ ) {

				node.add( children[ i ] );

			}

			return node;

		} );

	}

	// ._loadNodeShallow() parses a single node.
	// skin and child nodes are created and added in .loadNode() (no '_' prefix).
	_loadNodeShallow( nodeIndex ) {

		const json = this.json;
		const extensions = this.extensions;
		const parser = this;

		// This method is called from .loadNode() and .loadSkin().
		// Cache a node to avoid duplication.

		if ( this.nodeCache[ nodeIndex ] !== undefined ) {

			return this.nodeCache[ nodeIndex ];

		}

		const nodeDef = json.nodes[ nodeIndex ];

		// reserve node's name before its dependencies, so the root has the intended name.
		const nodeName = nodeDef.name ? parser.createUniqueName( nodeDef.name ) : '';

		this.nodeCache[ nodeIndex ] = ( function () {

			const pending = [];

			const meshPromise = parser._invokeOne( function ( ext ) {

				return ext.createNodeMesh && ext.createNodeMesh( nodeIndex );

			} );

			if ( meshPromise ) {

				pending.push( meshPromise );

			}

			if ( nodeDef.camera !== undefined ) {

				pending.push( parser.getDependency( 'camera', nodeDef.camera ).then( function ( camera ) {

					return parser._getNodeRef( parser.cameraCache, nodeDef.camera, camera );

				} ) );

			}

			parser._invokeAll( function ( ext ) {

				return ext.createNodeAttachment && ext.createNodeAttachment( nodeIndex );

			} ).forEach( function ( promise ) {

				pending.push( promise );

			} );

			return Promise.all( pending );

		}() ).then( function ( objects ) {

			let node;

			// .isBone isn't in glTF spec. See ._markDefs
			if ( nodeDef.isBone === true ) {

				node = new Bone();

			} else if ( objects.length > 1 ) {

				node = new Group();

			} else if ( objects.length === 1 ) {

				node = objects[ 0 ];

			} else {

				node = new Object3D();

			}

			if ( node !== objects[ 0 ] ) {

				for ( let i = 0, il = objects.length; i < il; i ++ ) {

					node.add( objects[ i ] );

				}

			}

			if ( nodeDef.name ) {

				node.userData.name = nodeDef.name;
				node.name = nodeName;

			}

			assignExtrasToUserData( node, nodeDef );

			if ( nodeDef.extensions ) addUnknownExtensionsToUserData( extensions, node, nodeDef );

			if ( nodeDef.matrix !== undefined ) {

				const matrix = new Matrix4();
				matrix.fromArray( nodeDef.matrix );
				node.applyMatrix4( matrix );

			} else {

				if ( nodeDef.translation !== undefined ) {

					node.position.fromArray( nodeDef.translation );

				}

				if ( nodeDef.rotation !== undefined ) {

					node.quaternion.fromArray( nodeDef.rotation );

				}

				if ( nodeDef.scale !== undefined ) {

					node.scale.fromArray( nodeDef.scale );

				}

			}

			if ( ! parser.associations.has( node ) ) {

				parser.associations.set( node, {} );

			}

			parser.associations.get( node ).nodes = nodeIndex;

			return node;

		} );

		return this.nodeCache[ nodeIndex ];

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
	 * @param {number} sceneIndex
	 * @return {Promise<Group>}
	 */
	loadScene( sceneIndex ) {

		const extensions = this.extensions;
		const sceneDef = this.json.scenes[ sceneIndex ];
		const parser = this;

		// Loader returns Group, not Scene.
		// See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172
		const scene = new Group();
		if ( sceneDef.name ) scene.name = parser.createUniqueName( sceneDef.name );

		assignExtrasToUserData( scene, sceneDef );

		if ( sceneDef.extensions ) addUnknownExtensionsToUserData( extensions, scene, sceneDef );

		const nodeIds = sceneDef.nodes || [];

		const pending = [];

		for ( let i = 0, il = nodeIds.length; i < il; i ++ ) {

			pending.push( parser.getDependency( 'node', nodeIds[ i ] ) );

		}

		return Promise.all( pending ).then( function ( nodes ) {

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				scene.add( nodes[ i ] );

			}

			// Removes dangling associations, associations that reference a node that
			// didn't make it into the scene.
			const reduceAssociations = ( node ) => {

				const reducedAssociations = new Map();

				for ( const [ key, value ] of parser.associations ) {

					if ( key instanceof Material || key instanceof Texture ) {

						reducedAssociations.set( key, value );

					}

				}

				node.traverse( ( node ) => {

					const mappings = parser.associations.get( node );

					if ( mappings != null ) {

						reducedAssociations.set( node, mappings );

					}

				} );

				return reducedAssociations;

			};

			parser.associations = reduceAssociations( scene );

			return scene;

		} );

	}

}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */
function computeBounds( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const box = new Box3();

	if ( attributes.POSITION !== undefined ) {

		const accessor = parser.json.accessors[ attributes.POSITION ];

		const min = accessor.min;
		const max = accessor.max;

		// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

		if ( min !== undefined && max !== undefined ) {

			box.set(
				new Vector3( min[ 0 ], min[ 1 ], min[ 2 ] ),
				new Vector3( max[ 0 ], max[ 1 ], max[ 2 ] )
			);

			if ( accessor.normalized ) {

				const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
				box.min.multiplyScalar( boxScale );
				box.max.multiplyScalar( boxScale );

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

			return;

		}

	} else {

		return;

	}

	const targets = primitiveDef.targets;

	if ( targets !== undefined ) {

		const maxDisplacement = new Vector3();
		const vector = new Vector3();

		for ( let i = 0, il = targets.length; i < il; i ++ ) {

			const target = targets[ i ];

			if ( target.POSITION !== undefined ) {

				const accessor = parser.json.accessors[ target.POSITION ];
				const min = accessor.min;
				const max = accessor.max;

				// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

				if ( min !== undefined && max !== undefined ) {

					// we need to get max of absolute components because target weight is [-1,1]
					vector.setX( Math.max( Math.abs( min[ 0 ] ), Math.abs( max[ 0 ] ) ) );
					vector.setY( Math.max( Math.abs( min[ 1 ] ), Math.abs( max[ 1 ] ) ) );
					vector.setZ( Math.max( Math.abs( min[ 2 ] ), Math.abs( max[ 2 ] ) ) );


					if ( accessor.normalized ) {

						const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
						vector.multiplyScalar( boxScale );

					}

					// Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
					// to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
					// are used to implement key-frame animations and as such only two are active at a time - this results in very large
					// boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
					maxDisplacement.max( vector );

				} else {

					console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

				}

			}

		}

		// As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
		box.expandByVector( maxDisplacement );

	}

	geometry.boundingBox = box;

	const sphere = new Sphere();

	box.getCenter( sphere.center );
	sphere.radius = box.min.distanceTo( box.max ) / 2;

	geometry.boundingSphere = sphere;

}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addPrimitiveAttributes( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const pending = [];

	function assignAttributeAccessor( accessorIndex, attributeName ) {

		return parser.getDependency( 'accessor', accessorIndex )
			.then( function ( accessor ) {

				geometry.setAttribute( attributeName, accessor );

			} );

	}

	for ( const gltfAttributeName in attributes ) {

		const threeAttributeName = ATTRIBUTES[ gltfAttributeName ] || gltfAttributeName.toLowerCase();

		// Skip attributes already provided by e.g. Draco extension.
		if ( threeAttributeName in geometry.attributes ) continue;

		pending.push( assignAttributeAccessor( attributes[ gltfAttributeName ], threeAttributeName ) );

	}

	if ( primitiveDef.indices !== undefined && ! geometry.index ) {

		const accessor = parser.getDependency( 'accessor', primitiveDef.indices ).then( function ( accessor ) {

			geometry.setIndex( accessor );

		} );

		pending.push( accessor );

	}

	assignExtrasToUserData( geometry, primitiveDef );

	computeBounds( geometry, primitiveDef, parser );

	return Promise.all( pending ).then( function () {

		return primitiveDef.targets !== undefined
			? addMorphTargets( geometry, primitiveDef.targets, parser )
			: geometry;

	} );

}

const _taskCache = new WeakMap();

class DRACOLoader extends Loader {

	constructor( manager ) {

		super( manager );

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

		loader.load( url, ( buffer ) => {

			this.decodeDracoFile( buffer, onLoad ).catch( onError );

		}, onProgress, onError );

	}

	decodeDracoFile( buffer, callback, attributeIDs, attributeTypes ) {

		const taskConfig = {
			attributeIDs: attributeIDs || this.defaultAttributeIDs,
			attributeTypes: attributeTypes || this.defaultAttributeTypes,
			useUniqueIDs: !! attributeIDs
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

			const attribute = geometryData.attributes[ i ];
			const name = attribute.name;
			const array = attribute.array;
			const itemSize = attribute.itemSize;

			geometry.setAttribute( name, new BufferAttribute( array, itemSize ) );

		}

		return geometry;

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

			librariesPending.push( this._loadLibrary( 'draco_decoder.js', 'text' ) );

		} else {

			librariesPending.push( this._loadLibrary( 'draco_wasm_wrapper.js', 'text' ) );
			librariesPending.push( this._loadLibrary( 'draco_decoder.wasm', 'arraybuffer' ) );

		}

		this.decoderPending = Promise.all( librariesPending )
			.then( ( libraries ) => {

				const jsContent = libraries[ 0 ];

				if ( ! useJS ) {

					this.decoderConfig.wasmBinary = libraries[ 1 ];

				}

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

					return a._taskLoad > b._taskLoad ? - 1 : 1;

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
					const decoderBuffer = new draco.DecoderBuffer();
					decoderBuffer.Init( new Int8Array( buffer ), buffer.byteLength );

					try {

						const geometry = decodeGeometry( draco, decoder, decoderBuffer, taskConfig );

						const buffers = geometry.attributes.map( ( attr ) => attr.array.buffer );

						if ( geometry.index ) buffers.push( geometry.index.array.buffer );

						self.postMessage( { type: 'decode', id: message.id, geometry }, buffers );

					} catch ( error ) {

						console.error( error );

						self.postMessage( { type: 'error', id: message.id, error: error.message } );

					} finally {

						draco.destroy( decoderBuffer );
						draco.destroy( decoder );

					}

				} );
				break;

		}

	};

	function decodeGeometry( draco, decoder, decoderBuffer, taskConfig ) {

		const attributeIDs = taskConfig.attributeIDs;
		const attributeTypes = taskConfig.attributeTypes;

		let dracoGeometry;
		let decodingStatus;

		const geometryType = decoder.GetEncodedGeometryType( decoderBuffer );

		if ( geometryType === draco.TRIANGULAR_MESH ) {

			dracoGeometry = new draco.Mesh();
			decodingStatus = decoder.DecodeBufferToMesh( decoderBuffer, dracoGeometry );

		} else if ( geometryType === draco.POINT_CLOUD ) {

			dracoGeometry = new draco.PointCloud();
			decodingStatus = decoder.DecodeBufferToPointCloud( decoderBuffer, dracoGeometry );

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

				if ( attributeID === - 1 ) continue;

				attribute = decoder.GetAttribute( dracoGeometry, attributeID );

			}

			geometry.attributes.push( decodeAttribute( draco, decoder, dracoGeometry, attributeName, attributeType, attribute ) );

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

/*!
fflate - fast JavaScript compression/decompression
<https://101arrowz.github.io/fflate>
Licensed under MIT. https://github.com/101arrowz/fflate/blob/master/LICENSE
version 0.6.9
*/

// DEFLATE is a complex format; to read this code, you should probably check the RFC first:
// https://tools.ietf.org/html/rfc1951
// You may also wish to take a look at the guide I made about this program:
// https://gist.github.com/101arrowz/253f31eb5abc3d9275ab943003ffecad
// Some of the following code is similar to that of UZIP.js:
// https://github.com/photopea/UZIP.js
// However, the vast majority of the codebase has diverged from UZIP.js to increase performance and reduce bundle size.
// Sometimes 0 will appear where -1 would be more appropriate. This is because using a uint
// is better for memory in most engines (I *think*).
var ch2 = {};
var durl = function (c) { return URL.createObjectURL(new Blob([c], { type: 'text/javascript' })); };
var cwk = function (u) { return new Worker(u); };
try {
    URL.revokeObjectURL(durl(''));
}
catch (e) {
    // We're in Deno or a very old browser
    durl = function (c) { return 'data:application/javascript;charset=UTF-8,' + encodeURI(c); };
    // If Deno, this is necessary; if not, this changes nothing
    cwk = function (u) { return new Worker(u, { type: 'module' }); };
}
var wk = (function (c, id, msg, transfer, cb) {
    var w = cwk(ch2[id] || (ch2[id] = durl(c)));
    w.onerror = function (e) { return cb(e.error, null); };
    w.onmessage = function (e) { return cb(null, e.data); };
    w.postMessage(msg, transfer);
    return w;
});

// aliases for shorter compressed code (most minifers don't do this)
var u8 = Uint8Array, u16 = Uint16Array, u32 = Uint32Array;
// fixed length extra bits
var fleb = new u8([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, /* unused */ 0, 0, /* impossible */ 0]);
// fixed distance extra bits
// see fleb note
var fdeb = new u8([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, /* unused */ 0, 0]);
// code length index map
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
// get base, reverse index map from extra bits
var freb = function (eb, start) {
    var b = new u16(31);
    for (var i = 0; i < 31; ++i) {
        b[i] = start += 1 << eb[i - 1];
    }
    // numbers here are at max 18 bits
    var r = new u32(b[30]);
    for (var i = 1; i < 30; ++i) {
        for (var j = b[i]; j < b[i + 1]; ++j) {
            r[j] = ((j - b[i]) << 5) | i;
        }
    }
    return [b, r];
};
var _a = freb(fleb, 2), fl = _a[0], revfl = _a[1];
// we can ignore the fact that the other numbers are wrong; they never happen anyway
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0), fd = _b[0], revfd = _b[1];
// map of value to reverse (assuming 16 bits)
var rev = new u16(32768);
for (var i = 0; i < 32768; ++i) {
    // reverse table algorithm from SO
    var x = ((i & 0xAAAA) >>> 1) | ((i & 0x5555) << 1);
    x = ((x & 0xCCCC) >>> 2) | ((x & 0x3333) << 2);
    x = ((x & 0xF0F0) >>> 4) | ((x & 0x0F0F) << 4);
    rev[i] = (((x & 0xFF00) >>> 8) | ((x & 0x00FF) << 8)) >>> 1;
}
// create huffman tree from u8 "map": index -> code length for code index
// mb (max bits) must be at most 15
// TODO: optimize/split up?
var hMap = (function (cd, mb, r) {
    var s = cd.length;
    // index
    var i = 0;
    // u16 "map": index -> # of codes with bit length = index
    var l = new u16(mb);
    // length of cd must be 288 (total # of codes)
    for (; i < s; ++i)
        ++l[cd[i] - 1];
    // u16 "map": index -> minimum code for bit length = index
    var le = new u16(mb);
    for (i = 0; i < mb; ++i) {
        le[i] = (le[i - 1] + l[i - 1]) << 1;
    }
    var co;
    if (r) {
        // u16 "map": index -> number of actual bits, symbol for code
        co = new u16(1 << mb);
        // bits to remove for reverser
        var rvb = 15 - mb;
        for (i = 0; i < s; ++i) {
            // ignore 0 lengths
            if (cd[i]) {
                // num encoding both symbol and bits read
                var sv = (i << 4) | cd[i];
                // free bits
                var r_1 = mb - cd[i];
                // start value
                var v = le[cd[i] - 1]++ << r_1;
                // m is end value
                for (var m = v | ((1 << r_1) - 1); v <= m; ++v) {
                    // every 16 bit value starting with the code yields the same result
                    co[rev[v] >>> rvb] = sv;
                }
            }
        }
    }
    else {
        co = new u16(s);
        for (i = 0; i < s; ++i) {
            if (cd[i]) {
                co[i] = rev[le[cd[i] - 1]++] >>> (15 - cd[i]);
            }
        }
    }
    return co;
});
// fixed length tree
var flt = new u8(288);
for (var i = 0; i < 144; ++i)
    flt[i] = 8;
for (var i = 144; i < 256; ++i)
    flt[i] = 9;
for (var i = 256; i < 280; ++i)
    flt[i] = 7;
for (var i = 280; i < 288; ++i)
    flt[i] = 8;
// fixed distance tree
var fdt = new u8(32);
for (var i = 0; i < 32; ++i)
    fdt[i] = 5;
// fixed length map
var flm = /*#__PURE__*/ hMap(flt, 9, 0), flrm = /*#__PURE__*/ hMap(flt, 9, 1);
// fixed distance map
var fdm = /*#__PURE__*/ hMap(fdt, 5, 0), fdrm = /*#__PURE__*/ hMap(fdt, 5, 1);
// find max of array
var max = function (a) {
    var m = a[0];
    for (var i = 1; i < a.length; ++i) {
        if (a[i] > m)
            m = a[i];
    }
    return m;
};
// read d, starting at bit p and mask with m
var bits = function (d, p, m) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8)) >> (p & 7)) & m;
};
// read d, starting at bit p continuing for at least 16 bits
var bits16 = function (d, p) {
    var o = (p / 8) | 0;
    return ((d[o] | (d[o + 1] << 8) | (d[o + 2] << 16)) >> (p & 7));
};
// get end of byte
var shft = function (p) { return ((p / 8) | 0) + (p & 7 && 1); };
// typed array slice - allows garbage collector to free original reference,
// while being more compatible than .slice
var slc = function (v, s, e) {
    if (s == null || s < 0)
        s = 0;
    if (e == null || e > v.length)
        e = v.length;
    // can't use .constructor in case user-supplied
    var n = new (v instanceof u16 ? u16 : v instanceof u32 ? u32 : u8)(e - s);
    n.set(v.subarray(s, e));
    return n;
};
// expands raw DEFLATE data
var inflt = function (dat, buf, st) {
    // source length
    var sl = dat.length;
    if (!sl || (st && !st.l && sl < 5))
        return buf || new u8(0);
    // have to estimate size
    var noBuf = !buf || st;
    // no state
    var noSt = !st || st.i;
    if (!st)
        st = {};
    // Assumes roughly 33% compression ratio average
    if (!buf)
        buf = new u8(sl * 3);
    // ensure buffer can fit at least l elements
    var cbuf = function (l) {
        var bl = buf.length;
        // need to increase size to fit
        if (l > bl) {
            // Double or set to necessary, whichever is greater
            var nbuf = new u8(Math.max(bl * 2, l));
            nbuf.set(buf);
            buf = nbuf;
        }
    };
    //  last chunk         bitpos           bytes
    var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
    // total bits
    var tbts = sl * 8;
    do {
        if (!lm) {
            // BFINAL - this is only 1 when last chunk is next
            st.f = final = bits(dat, pos, 1);
            // type: 0 = no compression, 1 = fixed huffman, 2 = dynamic huffman
            var type = bits(dat, pos + 1, 3);
            pos += 3;
            if (!type) {
                // go to end of byte boundary
                var s = shft(pos) + 4, l = dat[s - 4] | (dat[s - 3] << 8), t = s + l;
                if (t > sl) {
                    if (noSt)
                        throw 'unexpected EOF';
                    break;
                }
                // ensure size
                if (noBuf)
                    cbuf(bt + l);
                // Copy over uncompressed data
                buf.set(dat.subarray(s, t), bt);
                // Get new bitpos, update byte count
                st.b = bt += l, st.p = pos = t * 8;
                continue;
            }
            else if (type == 1)
                lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
            else if (type == 2) {
                //  literal                            lengths
                var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
                var tl = hLit + bits(dat, pos + 5, 31) + 1;
                pos += 14;
                // length+distance tree
                var ldt = new u8(tl);
                // code length tree
                var clt = new u8(19);
                for (var i = 0; i < hcLen; ++i) {
                    // use index map to get real code
                    clt[clim[i]] = bits(dat, pos + i * 3, 7);
                }
                pos += hcLen * 3;
                // code lengths bits
                var clb = max(clt), clbmsk = (1 << clb) - 1;
                // code lengths map
                var clm = hMap(clt, clb, 1);
                for (var i = 0; i < tl;) {
                    var r = clm[bits(dat, pos, clbmsk)];
                    // bits read
                    pos += r & 15;
                    // symbol
                    var s = r >>> 4;
                    // code length to copy
                    if (s < 16) {
                        ldt[i++] = s;
                    }
                    else {
                        //  copy   count
                        var c = 0, n = 0;
                        if (s == 16)
                            n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
                        else if (s == 17)
                            n = 3 + bits(dat, pos, 7), pos += 3;
                        else if (s == 18)
                            n = 11 + bits(dat, pos, 127), pos += 7;
                        while (n--)
                            ldt[i++] = c;
                    }
                }
                //    length tree                 distance tree
                var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
                // max length bits
                lbt = max(lt);
                // max dist bits
                dbt = max(dt);
                lm = hMap(lt, lbt, 1);
                dm = hMap(dt, dbt, 1);
            }
            else
                throw 'invalid block type';
            if (pos > tbts) {
                if (noSt)
                    throw 'unexpected EOF';
                break;
            }
        }
        // Make sure the buffer can hold this + the largest possible addition
        // Maximum chunk size (practically, theoretically infinite) is 2^17;
        if (noBuf)
            cbuf(bt + 131072);
        var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
        var lpos = pos;
        for (;; lpos = pos) {
            // bits read, code
            var c = lm[bits16(dat, pos) & lms], sym = c >>> 4;
            pos += c & 15;
            if (pos > tbts) {
                if (noSt)
                    throw 'unexpected EOF';
                break;
            }
            if (!c)
                throw 'invalid length/literal';
            if (sym < 256)
                buf[bt++] = sym;
            else if (sym == 256) {
                lpos = pos, lm = null;
                break;
            }
            else {
                var add = sym - 254;
                // no extra bits needed if less
                if (sym > 264) {
                    // index
                    var i = sym - 257, b = fleb[i];
                    add = bits(dat, pos, (1 << b) - 1) + fl[i];
                    pos += b;
                }
                // dist
                var d = dm[bits16(dat, pos) & dms], dsym = d >>> 4;
                if (!d)
                    throw 'invalid distance';
                pos += d & 15;
                var dt = fd[dsym];
                if (dsym > 3) {
                    var b = fdeb[dsym];
                    dt += bits16(dat, pos) & ((1 << b) - 1), pos += b;
                }
                if (pos > tbts) {
                    if (noSt)
                        throw 'unexpected EOF';
                    break;
                }
                if (noBuf)
                    cbuf(bt + 131072);
                var end = bt + add;
                for (; bt < end; bt += 4) {
                    buf[bt] = buf[bt - dt];
                    buf[bt + 1] = buf[bt + 1 - dt];
                    buf[bt + 2] = buf[bt + 2 - dt];
                    buf[bt + 3] = buf[bt + 3 - dt];
                }
                bt = end;
            }
        }
        st.l = lm, st.p = lpos, st.b = bt;
        if (lm)
            final = 1, st.m = lbt, st.d = dm, st.n = dbt;
    } while (!final);
    return bt == buf.length ? buf : slc(buf, 0, bt);
};
// starting at p, write the minimum number of bits that can hold v to d
var wbits = function (d, p, v) {
    v <<= p & 7;
    var o = (p / 8) | 0;
    d[o] |= v;
    d[o + 1] |= v >>> 8;
};
// starting at p, write the minimum number of bits (>8) that can hold v to d
var wbits16 = function (d, p, v) {
    v <<= p & 7;
    var o = (p / 8) | 0;
    d[o] |= v;
    d[o + 1] |= v >>> 8;
    d[o + 2] |= v >>> 16;
};
// creates code lengths from a frequency table
var hTree = function (d, mb) {
    // Need extra info to make a tree
    var t = [];
    for (var i = 0; i < d.length; ++i) {
        if (d[i])
            t.push({ s: i, f: d[i] });
    }
    var s = t.length;
    var t2 = t.slice();
    if (!s)
        return [et, 0];
    if (s == 1) {
        var v = new u8(t[0].s + 1);
        v[t[0].s] = 1;
        return [v, 1];
    }
    t.sort(function (a, b) { return a.f - b.f; });
    // after i2 reaches last ind, will be stopped
    // freq must be greater than largest possible number of symbols
    t.push({ s: -1, f: 25001 });
    var l = t[0], r = t[1], i0 = 0, i1 = 1, i2 = 2;
    t[0] = { s: -1, f: l.f + r.f, l: l, r: r };
    // efficient algorithm from UZIP.js
    // i0 is lookbehind, i2 is lookahead - after processing two low-freq
    // symbols that combined have high freq, will start processing i2 (high-freq,
    // non-composite) symbols instead
    // see https://reddit.com/r/photopea/comments/ikekht/uzipjs_questions/
    while (i1 != s - 1) {
        l = t[t[i0].f < t[i2].f ? i0++ : i2++];
        r = t[i0 != i1 && t[i0].f < t[i2].f ? i0++ : i2++];
        t[i1++] = { s: -1, f: l.f + r.f, l: l, r: r };
    }
    var maxSym = t2[0].s;
    for (var i = 1; i < s; ++i) {
        if (t2[i].s > maxSym)
            maxSym = t2[i].s;
    }
    // code lengths
    var tr = new u16(maxSym + 1);
    // max bits in tree
    var mbt = ln(t[i1 - 1], tr, 0);
    if (mbt > mb) {
        // more algorithms from UZIP.js
        // TODO: find out how this code works (debt)
        //  ind    debt
        var i = 0, dt = 0;
        //    left            cost
        var lft = mbt - mb, cst = 1 << lft;
        t2.sort(function (a, b) { return tr[b.s] - tr[a.s] || a.f - b.f; });
        for (; i < s; ++i) {
            var i2_1 = t2[i].s;
            if (tr[i2_1] > mb) {
                dt += cst - (1 << (mbt - tr[i2_1]));
                tr[i2_1] = mb;
            }
            else
                break;
        }
        dt >>>= lft;
        while (dt > 0) {
            var i2_2 = t2[i].s;
            if (tr[i2_2] < mb)
                dt -= 1 << (mb - tr[i2_2]++ - 1);
            else
                ++i;
        }
        for (; i >= 0 && dt; --i) {
            var i2_3 = t2[i].s;
            if (tr[i2_3] == mb) {
                --tr[i2_3];
                ++dt;
            }
        }
        mbt = mb;
    }
    return [new u8(tr), mbt];
};
// get the max length and assign length codes
var ln = function (n, l, d) {
    return n.s == -1
        ? Math.max(ln(n.l, l, d + 1), ln(n.r, l, d + 1))
        : (l[n.s] = d);
};
// length codes generation
var lc = function (c) {
    var s = c.length;
    // Note that the semicolon was intentional
    while (s && !c[--s])
        ;
    var cl = new u16(++s);
    //  ind      num         streak
    var cli = 0, cln = c[0], cls = 1;
    var w = function (v) { cl[cli++] = v; };
    for (var i = 1; i <= s; ++i) {
        if (c[i] == cln && i != s)
            ++cls;
        else {
            if (!cln && cls > 2) {
                for (; cls > 138; cls -= 138)
                    w(32754);
                if (cls > 2) {
                    w(cls > 10 ? ((cls - 11) << 5) | 28690 : ((cls - 3) << 5) | 12305);
                    cls = 0;
                }
            }
            else if (cls > 3) {
                w(cln), --cls;
                for (; cls > 6; cls -= 6)
                    w(8304);
                if (cls > 2)
                    w(((cls - 3) << 5) | 8208), cls = 0;
            }
            while (cls--)
                w(cln);
            cls = 1;
            cln = c[i];
        }
    }
    return [cl.subarray(0, cli), s];
};
// calculate the length of output from tree, code lengths
var clen = function (cf, cl) {
    var l = 0;
    for (var i = 0; i < cl.length; ++i)
        l += cf[i] * cl[i];
    return l;
};
// writes a fixed block
// returns the new bit pos
var wfblk = function (out, pos, dat) {
    // no need to write 00 as type: TypedArray defaults to 0
    var s = dat.length;
    var o = shft(pos + 2);
    out[o] = s & 255;
    out[o + 1] = s >>> 8;
    out[o + 2] = out[o] ^ 255;
    out[o + 3] = out[o + 1] ^ 255;
    for (var i = 0; i < s; ++i)
        out[o + i + 4] = dat[i];
    return (o + 4 + s) * 8;
};
// writes a block
var wblk = function (dat, out, final, syms, lf, df, eb, li, bs, bl, p) {
    wbits(out, p++, final);
    ++lf[256];
    var _a = hTree(lf, 15), dlt = _a[0], mlb = _a[1];
    var _b = hTree(df, 15), ddt = _b[0], mdb = _b[1];
    var _c = lc(dlt), lclt = _c[0], nlc = _c[1];
    var _d = lc(ddt), lcdt = _d[0], ndc = _d[1];
    var lcfreq = new u16(19);
    for (var i = 0; i < lclt.length; ++i)
        lcfreq[lclt[i] & 31]++;
    for (var i = 0; i < lcdt.length; ++i)
        lcfreq[lcdt[i] & 31]++;
    var _e = hTree(lcfreq, 7), lct = _e[0], mlcb = _e[1];
    var nlcc = 19;
    for (; nlcc > 4 && !lct[clim[nlcc - 1]]; --nlcc)
        ;
    var flen = (bl + 5) << 3;
    var ftlen = clen(lf, flt) + clen(df, fdt) + eb;
    var dtlen = clen(lf, dlt) + clen(df, ddt) + eb + 14 + 3 * nlcc + clen(lcfreq, lct) + (2 * lcfreq[16] + 3 * lcfreq[17] + 7 * lcfreq[18]);
    if (flen <= ftlen && flen <= dtlen)
        return wfblk(out, p, dat.subarray(bs, bs + bl));
    var lm, ll, dm, dl;
    wbits(out, p, 1 + (dtlen < ftlen)), p += 2;
    if (dtlen < ftlen) {
        lm = hMap(dlt, mlb, 0), ll = dlt, dm = hMap(ddt, mdb, 0), dl = ddt;
        var llm = hMap(lct, mlcb, 0);
        wbits(out, p, nlc - 257);
        wbits(out, p + 5, ndc - 1);
        wbits(out, p + 10, nlcc - 4);
        p += 14;
        for (var i = 0; i < nlcc; ++i)
            wbits(out, p + 3 * i, lct[clim[i]]);
        p += 3 * nlcc;
        var lcts = [lclt, lcdt];
        for (var it = 0; it < 2; ++it) {
            var clct = lcts[it];
            for (var i = 0; i < clct.length; ++i) {
                var len = clct[i] & 31;
                wbits(out, p, llm[len]), p += lct[len];
                if (len > 15)
                    wbits(out, p, (clct[i] >>> 5) & 127), p += clct[i] >>> 12;
            }
        }
    }
    else {
        lm = flm, ll = flt, dm = fdm, dl = fdt;
    }
    for (var i = 0; i < li; ++i) {
        if (syms[i] > 255) {
            var len = (syms[i] >>> 18) & 31;
            wbits16(out, p, lm[len + 257]), p += ll[len + 257];
            if (len > 7)
                wbits(out, p, (syms[i] >>> 23) & 31), p += fleb[len];
            var dst = syms[i] & 31;
            wbits16(out, p, dm[dst]), p += dl[dst];
            if (dst > 3)
                wbits16(out, p, (syms[i] >>> 5) & 8191), p += fdeb[dst];
        }
        else {
            wbits16(out, p, lm[syms[i]]), p += ll[syms[i]];
        }
    }
    wbits16(out, p, lm[256]);
    return p + ll[256];
};
// deflate options (nice << 13) | chain
var deo = /*#__PURE__*/ new u32([65540, 131080, 131088, 131104, 262176, 1048704, 1048832, 2114560, 2117632]);
// empty
var et = /*#__PURE__*/ new u8(0);
// compresses data into a raw DEFLATE buffer
var dflt = function (dat, lvl, plvl, pre, post, lst) {
    var s = dat.length;
    var o = new u8(pre + s + 5 * (1 + Math.ceil(s / 7000)) + post);
    // writing to this writes to the output buffer
    var w = o.subarray(pre, o.length - post);
    var pos = 0;
    if (!lvl || s < 8) {
        for (var i = 0; i <= s; i += 65535) {
            // end
            var e = i + 65535;
            if (e < s) {
                // write full block
                pos = wfblk(w, pos, dat.subarray(i, e));
            }
            else {
                // write final block
                w[i] = lst;
                pos = wfblk(w, pos, dat.subarray(i, s));
            }
        }
    }
    else {
        var opt = deo[lvl - 1];
        var n = opt >>> 13, c = opt & 8191;
        var msk_1 = (1 << plvl) - 1;
        //    prev 2-byte val map    curr 2-byte val map
        var prev = new u16(32768), head = new u16(msk_1 + 1);
        var bs1_1 = Math.ceil(plvl / 3), bs2_1 = 2 * bs1_1;
        var hsh = function (i) { return (dat[i] ^ (dat[i + 1] << bs1_1) ^ (dat[i + 2] << bs2_1)) & msk_1; };
        // 24576 is an arbitrary number of maximum symbols per block
        // 424 buffer for last block
        var syms = new u32(25000);
        // length/literal freq   distance freq
        var lf = new u16(288), df = new u16(32);
        //  l/lcnt  exbits  index  l/lind  waitdx  bitpos
        var lc_1 = 0, eb = 0, i = 0, li = 0, wi = 0, bs = 0;
        for (; i < s; ++i) {
            // hash value
            // deopt when i > s - 3 - at end, deopt acceptable
            var hv = hsh(i);
            // index mod 32768    previous index mod
            var imod = i & 32767, pimod = head[hv];
            prev[imod] = pimod;
            head[hv] = imod;
            // We always should modify head and prev, but only add symbols if
            // this data is not yet processed ("wait" for wait index)
            if (wi <= i) {
                // bytes remaining
                var rem = s - i;
                if ((lc_1 > 7000 || li > 24576) && rem > 423) {
                    pos = wblk(dat, w, 0, syms, lf, df, eb, li, bs, i - bs, pos);
                    li = lc_1 = eb = 0, bs = i;
                    for (var j = 0; j < 286; ++j)
                        lf[j] = 0;
                    for (var j = 0; j < 30; ++j)
                        df[j] = 0;
                }
                //  len    dist   chain
                var l = 2, d = 0, ch_1 = c, dif = (imod - pimod) & 32767;
                if (rem > 2 && hv == hsh(i - dif)) {
                    var maxn = Math.min(n, rem) - 1;
                    var maxd = Math.min(32767, i);
                    // max possible length
                    // not capped at dif because decompressors implement "rolling" index population
                    var ml = Math.min(258, rem);
                    while (dif <= maxd && --ch_1 && imod != pimod) {
                        if (dat[i + l] == dat[i + l - dif]) {
                            var nl = 0;
                            for (; nl < ml && dat[i + nl] == dat[i + nl - dif]; ++nl)
                                ;
                            if (nl > l) {
                                l = nl, d = dif;
                                // break out early when we reach "nice" (we are satisfied enough)
                                if (nl > maxn)
                                    break;
                                // now, find the rarest 2-byte sequence within this
                                // length of literals and search for that instead.
                                // Much faster than just using the start
                                var mmd = Math.min(dif, nl - 2);
                                var md = 0;
                                for (var j = 0; j < mmd; ++j) {
                                    var ti = (i - dif + j + 32768) & 32767;
                                    var pti = prev[ti];
                                    var cd = (ti - pti + 32768) & 32767;
                                    if (cd > md)
                                        md = cd, pimod = ti;
                                }
                            }
                        }
                        // check the previous match
                        imod = pimod, pimod = prev[imod];
                        dif += (imod - pimod + 32768) & 32767;
                    }
                }
                // d will be nonzero only when a match was found
                if (d) {
                    // store both dist and len data in one Uint32
                    // Make sure this is recognized as a len/dist with 28th bit (2^28)
                    syms[li++] = 268435456 | (revfl[l] << 18) | revfd[d];
                    var lin = revfl[l] & 31, din = revfd[d] & 31;
                    eb += fleb[lin] + fdeb[din];
                    ++lf[257 + lin];
                    ++df[din];
                    wi = i + l;
                    ++lc_1;
                }
                else {
                    syms[li++] = dat[i];
                    ++lf[dat[i]];
                }
            }
        }
        pos = wblk(dat, w, lst, syms, lf, df, eb, li, bs, i - bs, pos);
        // this is the easiest way to avoid needing to maintain state
        if (!lst && pos & 7)
            pos = wfblk(w, pos + 1, et);
    }
    return slc(o, 0, pre + shft(pos) + post);
};
// CRC32 table
var crct = /*#__PURE__*/ (function () {
    var t = new u32(256);
    for (var i = 0; i < 256; ++i) {
        var c = i, k = 9;
        while (--k)
            c = ((c & 1) && 0xEDB88320) ^ (c >>> 1);
        t[i] = c;
    }
    return t;
})();
// CRC32
var crc = function () {
    var c = -1;
    return {
        p: function (d) {
            // closures have awful performance
            var cr = c;
            for (var i = 0; i < d.length; ++i)
                cr = crct[(cr & 255) ^ d[i]] ^ (cr >>> 8);
            c = cr;
        },
        d: function () { return ~c; }
    };
};
// Alder32
var adler = function () {
    var a = 1, b = 0;
    return {
        p: function (d) {
            // closures have awful performance
            var n = a, m = b;
            var l = d.length;
            for (var i = 0; i != l;) {
                var e = Math.min(i + 2655, l);
                for (; i < e; ++i)
                    m += n += d[i];
                n = (n & 65535) + 15 * (n >> 16), m = (m & 65535) + 15 * (m >> 16);
            }
            a = n, b = m;
        },
        d: function () {
            a %= 65521, b %= 65521;
            return (a & 255) << 24 | (a >>> 8) << 16 | (b & 255) << 8 | (b >>> 8);
        }
    };
};
// deflate with opts
var dopt = function (dat, opt, pre, post, st) {
    return dflt(dat, opt.level == null ? 6 : opt.level, opt.mem == null ? Math.ceil(Math.max(8, Math.min(13, Math.log(dat.length))) * 1.5) : (12 + opt.mem), pre, post, !st);
};
// Walmart object spread
var mrg = function (a, b) {
    var o = {};
    for (var k in a)
        o[k] = a[k];
    for (var k in b)
        o[k] = b[k];
    return o;
};
// worker clone
// This is possibly the craziest part of the entire codebase, despite how simple it may seem.
// The only parameter to this function is a closure that returns an array of variables outside of the function scope.
// We're going to try to figure out the variable names used in the closure as strings because that is crucial for workerization.
// We will return an object mapping of true variable name to value (basically, the current scope as a JS object).
// The reason we can't just use the original variable names is minifiers mangling the toplevel scope.
// This took me three weeks to figure out how to do.
var wcln = function (fn, fnStr, td) {
    var dt = fn();
    var st = fn.toString();
    var ks = st.slice(st.indexOf('[') + 1, st.lastIndexOf(']')).replace(/ /g, '').split(',');
    for (var i = 0; i < dt.length; ++i) {
        var v = dt[i], k = ks[i];
        if (typeof v == 'function') {
            fnStr += ';' + k + '=';
            var st_1 = v.toString();
            if (v.prototype) {
                // for global objects
                if (st_1.indexOf('[native code]') != -1) {
                    var spInd = st_1.indexOf(' ', 8) + 1;
                    fnStr += st_1.slice(spInd, st_1.indexOf('(', spInd));
                }
                else {
                    fnStr += st_1;
                    for (var t in v.prototype)
                        fnStr += ';' + k + '.prototype.' + t + '=' + v.prototype[t].toString();
                }
            }
            else
                fnStr += st_1;
        }
        else
            td[k] = v;
    }
    return [fnStr, td];
};
var ch = [];
// clone bufs
var cbfs = function (v) {
    var tl = [];
    for (var k in v) {
        if (v[k] instanceof u8 || v[k] instanceof u16 || v[k] instanceof u32)
            tl.push((v[k] = new v[k].constructor(v[k])).buffer);
    }
    return tl;
};
// use a worker to execute code
var wrkr = function (fns, init, id, cb) {
    var _a;
    if (!ch[id]) {
        var fnStr = '', td_1 = {}, m = fns.length - 1;
        for (var i = 0; i < m; ++i)
            _a = wcln(fns[i], fnStr, td_1), fnStr = _a[0], td_1 = _a[1];
        ch[id] = wcln(fns[m], fnStr, td_1);
    }
    var td = mrg({}, ch[id][1]);
    return wk(ch[id][0] + ';onmessage=function(e){for(var k in e.data)self[k]=e.data[k];onmessage=' + init.toString() + '}', id, td, cbfs(td), cb);
};
// base async inflate fn
var bInflt = function () { return [u8, u16, u32, fleb, fdeb, clim, fl, fd, flrm, fdrm, rev, hMap, max, bits, bits16, shft, slc, inflt, inflateSync, pbf, gu8]; };
var bDflt = function () { return [u8, u16, u32, fleb, fdeb, clim, revfl, revfd, flm, flt, fdm, fdt, rev, deo, et, hMap, wbits, wbits16, hTree, ln, lc, clen, wfblk, wblk, shft, slc, dflt, dopt, deflateSync, pbf]; };
// gzip extra
var gze = function () { return [gzh, gzhl, wbytes, crc, crct]; };
// gunzip extra
var guze = function () { return [gzs, gzl]; };
// zlib extra
var zle = function () { return [zlh, wbytes, adler]; };
// unzlib extra
var zule = function () { return [zlv]; };
// post buf
var pbf = function (msg) { return postMessage(msg, [msg.buffer]); };
// get u8
var gu8 = function (o) { return o && o.size && new u8(o.size); };
// async helper
var cbify = function (dat, opts, fns, init, id, cb) {
    var w = wrkr(fns, init, id, function (err, dat) {
        w.terminate();
        cb(err, dat);
    });
    w.postMessage([dat, opts], opts.consume ? [dat.buffer] : []);
    return function () { w.terminate(); };
};
// auto stream
var astrm = function (strm) {
    strm.ondata = function (dat, final) { return postMessage([dat, final], [dat.buffer]); };
    return function (ev) { return strm.push(ev.data[0], ev.data[1]); };
};
// async stream attach
var astrmify = function (fns, strm, opts, init, id) {
    var t;
    var w = wrkr(fns, init, id, function (err, dat) {
        if (err)
            w.terminate(), strm.ondata.call(strm, err);
        else {
            if (dat[1])
                w.terminate();
            strm.ondata.call(strm, err, dat[0], dat[1]);
        }
    });
    w.postMessage(opts);
    strm.push = function (d, f) {
        if (t)
            throw 'stream finished';
        if (!strm.ondata)
            throw 'no stream handler';
        w.postMessage([d, t = f], [d.buffer]);
    };
    strm.terminate = function () { w.terminate(); };
};
// read 2 bytes
var b2 = function (d, b) { return d[b] | (d[b + 1] << 8); };
// read 4 bytes
var b4 = function (d, b) { return (d[b] | (d[b + 1] << 8) | (d[b + 2] << 16) | (d[b + 3] << 24)) >>> 0; };
var b8 = function (d, b) { return b4(d, b) + (b4(d, b + 4) * 4294967296); };
// write bytes
var wbytes = function (d, b, v) {
    for (; v; ++b)
        d[b] = v, v >>>= 8;
};
// gzip header
var gzh = function (c, o) {
    var fn = o.filename;
    c[0] = 31, c[1] = 139, c[2] = 8, c[8] = o.level < 2 ? 4 : o.level == 9 ? 2 : 0, c[9] = 3; // assume Unix
    if (o.mtime != 0)
        wbytes(c, 4, Math.floor(new Date(o.mtime || Date.now()) / 1000));
    if (fn) {
        c[3] = 8;
        for (var i = 0; i <= fn.length; ++i)
            c[i + 10] = fn.charCodeAt(i);
    }
};
// gzip footer: -8 to -4 = CRC, -4 to -0 is length
// gzip start
var gzs = function (d) {
    if (d[0] != 31 || d[1] != 139 || d[2] != 8)
        throw 'invalid gzip data';
    var flg = d[3];
    var st = 10;
    if (flg & 4)
        st += d[10] | (d[11] << 8) + 2;
    for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++])
        ;
    return st + (flg & 2);
};
// gzip length
var gzl = function (d) {
    var l = d.length;
    return ((d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16) | (d[l - 1] << 24)) >>> 0;
};
// gzip header length
var gzhl = function (o) { return 10 + ((o.filename && (o.filename.length + 1)) || 0); };
// zlib header
var zlh = function (c, o) {
    var lv = o.level, fl = lv == 0 ? 0 : lv < 6 ? 1 : lv == 9 ? 3 : 2;
    c[0] = 120, c[1] = (fl << 6) | (fl ? (32 - 2 * fl) : 1);
};
// zlib valid
var zlv = function (d) {
    if ((d[0] & 15) != 8 || (d[0] >>> 4) > 7 || ((d[0] << 8 | d[1]) % 31))
        throw 'invalid zlib data';
    if (d[1] & 32)
        throw 'invalid zlib data: preset dictionaries not supported';
};
function AsyncCmpStrm(opts, cb) {
    if (!cb && typeof opts == 'function')
        cb = opts, opts = {};
    this.ondata = cb;
    return opts;
}
// zlib footer: -4 to -0 is Adler32
/**
 * Streaming DEFLATE compression
 */
var Deflate = /*#__PURE__*/ (function () {
    function Deflate(opts, cb) {
        if (!cb && typeof opts == 'function')
            cb = opts, opts = {};
        this.ondata = cb;
        this.o = opts || {};
    }
    Deflate.prototype.p = function (c, f) {
        this.ondata(dopt(c, this.o, 0, 0, !f), f);
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Deflate.prototype.push = function (chunk, final) {
        if (this.d)
            throw 'stream finished';
        if (!this.ondata)
            throw 'no stream handler';
        this.d = final;
        this.p(chunk, final || false);
    };
    return Deflate;
}());
/**
 * Asynchronous streaming DEFLATE compression
 */
var AsyncDeflate = /*#__PURE__*/ (function () {
    function AsyncDeflate(opts, cb) {
        astrmify([
            bDflt,
            function () { return [astrm, Deflate]; }
        ], this, AsyncCmpStrm.call(this, opts, cb), function (ev) {
            var strm = new Deflate(ev.data);
            onmessage = astrm(strm);
        }, 6);
    }
    return AsyncDeflate;
}());
function deflate(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        throw 'no callback';
    return cbify(data, opts, [
        bDflt,
    ], function (ev) { return pbf(deflateSync(ev.data[0], ev.data[1])); }, 0, cb);
}
/**
 * Compresses data with DEFLATE without any wrapper
 * @param data The data to compress
 * @param opts The compression options
 * @returns The deflated version of the data
 */
function deflateSync(data, opts) {
    return dopt(data, opts || {}, 0, 0);
}
/**
 * Streaming DEFLATE decompression
 */
var Inflate = /*#__PURE__*/ (function () {
    /**
     * Creates an inflation stream
     * @param cb The callback to call whenever data is inflated
     */
    function Inflate(cb) {
        this.s = {};
        this.p = new u8(0);
        this.ondata = cb;
    }
    Inflate.prototype.e = function (c) {
        if (this.d)
            throw 'stream finished';
        if (!this.ondata)
            throw 'no stream handler';
        var l = this.p.length;
        var n = new u8(l + c.length);
        n.set(this.p), n.set(c, l), this.p = n;
    };
    Inflate.prototype.c = function (final) {
        this.d = this.s.i = final || false;
        var bts = this.s.b;
        var dt = inflt(this.p, this.o, this.s);
        this.ondata(slc(dt, bts, this.s.b), this.d);
        this.o = slc(dt, this.s.b - 32768), this.s.b = this.o.length;
        this.p = slc(this.p, (this.s.p / 8) | 0), this.s.p &= 7;
    };
    /**
     * Pushes a chunk to be inflated
     * @param chunk The chunk to push
     * @param final Whether this is the final chunk
     */
    Inflate.prototype.push = function (chunk, final) {
        this.e(chunk), this.c(final);
    };
    return Inflate;
}());
/**
 * Asynchronous streaming DEFLATE decompression
 */
var AsyncInflate = /*#__PURE__*/ (function () {
    /**
     * Creates an asynchronous inflation stream
     * @param cb The callback to call whenever data is deflated
     */
    function AsyncInflate(cb) {
        this.ondata = cb;
        astrmify([
            bInflt,
            function () { return [astrm, Inflate]; }
        ], this, 0, function () {
            var strm = new Inflate();
            onmessage = astrm(strm);
        }, 7);
    }
    return AsyncInflate;
}());
function inflate(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        throw 'no callback';
    return cbify(data, opts, [
        bInflt
    ], function (ev) { return pbf(inflateSync(ev.data[0], gu8(ev.data[1]))); }, 1, cb);
}
/**
 * Expands DEFLATE data with no wrapper
 * @param data The data to decompress
 * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
 * @returns The decompressed version of the data
 */
function inflateSync(data, out) {
    return inflt(data, out);
}
// before you yell at me for not just using extends, my reason is that TS inheritance is hard to workerize.
/**
 * Streaming GZIP compression
 */
var Gzip = /*#__PURE__*/ (function () {
    function Gzip(opts, cb) {
        this.c = crc();
        this.l = 0;
        this.v = 1;
        Deflate.call(this, opts, cb);
    }
    /**
     * Pushes a chunk to be GZIPped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Gzip.prototype.push = function (chunk, final) {
        Deflate.prototype.push.call(this, chunk, final);
    };
    Gzip.prototype.p = function (c, f) {
        this.c.p(c);
        this.l += c.length;
        var raw = dopt(c, this.o, this.v && gzhl(this.o), f && 8, !f);
        if (this.v)
            gzh(raw, this.o), this.v = 0;
        if (f)
            wbytes(raw, raw.length - 8, this.c.d()), wbytes(raw, raw.length - 4, this.l);
        this.ondata(raw, f);
    };
    return Gzip;
}());
/**
 * Asynchronous streaming GZIP compression
 */
var AsyncGzip = /*#__PURE__*/ (function () {
    function AsyncGzip(opts, cb) {
        astrmify([
            bDflt,
            gze,
            function () { return [astrm, Deflate, Gzip]; }
        ], this, AsyncCmpStrm.call(this, opts, cb), function (ev) {
            var strm = new Gzip(ev.data);
            onmessage = astrm(strm);
        }, 8);
    }
    return AsyncGzip;
}());
function gzip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        throw 'no callback';
    return cbify(data, opts, [
        bDflt,
        gze,
        function () { return [gzipSync]; }
    ], function (ev) { return pbf(gzipSync(ev.data[0], ev.data[1])); }, 2, cb);
}
/**
 * Compresses data with GZIP
 * @param data The data to compress
 * @param opts The compression options
 * @returns The gzipped version of the data
 */
function gzipSync(data, opts) {
    if (!opts)
        opts = {};
    var c = crc(), l = data.length;
    c.p(data);
    var d = dopt(data, opts, gzhl(opts), 8), s = d.length;
    return gzh(d, opts), wbytes(d, s - 8, c.d()), wbytes(d, s - 4, l), d;
}
/**
 * Streaming GZIP decompression
 */
var Gunzip = /*#__PURE__*/ (function () {
    /**
     * Creates a GUNZIP stream
     * @param cb The callback to call whenever data is inflated
     */
    function Gunzip(cb) {
        this.v = 1;
        Inflate.call(this, cb);
    }
    /**
     * Pushes a chunk to be GUNZIPped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Gunzip.prototype.push = function (chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        if (this.v) {
            var s = this.p.length > 3 ? gzs(this.p) : 4;
            if (s >= this.p.length && !final)
                return;
            this.p = this.p.subarray(s), this.v = 0;
        }
        if (final) {
            if (this.p.length < 8)
                throw 'invalid gzip stream';
            this.p = this.p.subarray(0, -8);
        }
        // necessary to prevent TS from using the closure value
        // This allows for workerization to function correctly
        Inflate.prototype.c.call(this, final);
    };
    return Gunzip;
}());
/**
 * Asynchronous streaming GZIP decompression
 */
var AsyncGunzip = /*#__PURE__*/ (function () {
    /**
     * Creates an asynchronous GUNZIP stream
     * @param cb The callback to call whenever data is deflated
     */
    function AsyncGunzip(cb) {
        this.ondata = cb;
        astrmify([
            bInflt,
            guze,
            function () { return [astrm, Inflate, Gunzip]; }
        ], this, 0, function () {
            var strm = new Gunzip();
            onmessage = astrm(strm);
        }, 9);
    }
    return AsyncGunzip;
}());
function gunzip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        throw 'no callback';
    return cbify(data, opts, [
        bInflt,
        guze,
        function () { return [gunzipSync]; }
    ], function (ev) { return pbf(gunzipSync(ev.data[0])); }, 3, cb);
}
/**
 * Expands GZIP data
 * @param data The data to decompress
 * @param out Where to write the data. GZIP already encodes the output size, so providing this doesn't save memory.
 * @returns The decompressed version of the data
 */
function gunzipSync(data, out) {
    return inflt(data.subarray(gzs(data), -8), out || new u8(gzl(data)));
}
/**
 * Streaming Zlib compression
 */
var Zlib = /*#__PURE__*/ (function () {
    function Zlib(opts, cb) {
        this.c = adler();
        this.v = 1;
        Deflate.call(this, opts, cb);
    }
    /**
     * Pushes a chunk to be zlibbed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Zlib.prototype.push = function (chunk, final) {
        Deflate.prototype.push.call(this, chunk, final);
    };
    Zlib.prototype.p = function (c, f) {
        this.c.p(c);
        var raw = dopt(c, this.o, this.v && 2, f && 4, !f);
        if (this.v)
            zlh(raw, this.o), this.v = 0;
        if (f)
            wbytes(raw, raw.length - 4, this.c.d());
        this.ondata(raw, f);
    };
    return Zlib;
}());
/**
 * Asynchronous streaming Zlib compression
 */
var AsyncZlib = /*#__PURE__*/ (function () {
    function AsyncZlib(opts, cb) {
        astrmify([
            bDflt,
            zle,
            function () { return [astrm, Deflate, Zlib]; }
        ], this, AsyncCmpStrm.call(this, opts, cb), function (ev) {
            var strm = new Zlib(ev.data);
            onmessage = astrm(strm);
        }, 10);
    }
    return AsyncZlib;
}());
function zlib(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        throw 'no callback';
    return cbify(data, opts, [
        bDflt,
        zle,
        function () { return [zlibSync]; }
    ], function (ev) { return pbf(zlibSync(ev.data[0], ev.data[1])); }, 4, cb);
}
/**
 * Compress data with Zlib
 * @param data The data to compress
 * @param opts The compression options
 * @returns The zlib-compressed version of the data
 */
function zlibSync(data, opts) {
    if (!opts)
        opts = {};
    var a = adler();
    a.p(data);
    var d = dopt(data, opts, 2, 4);
    return zlh(d, opts), wbytes(d, d.length - 4, a.d()), d;
}
/**
 * Streaming Zlib decompression
 */
var Unzlib = /*#__PURE__*/ (function () {
    /**
     * Creates a Zlib decompression stream
     * @param cb The callback to call whenever data is inflated
     */
    function Unzlib(cb) {
        this.v = 1;
        Inflate.call(this, cb);
    }
    /**
     * Pushes a chunk to be unzlibbed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Unzlib.prototype.push = function (chunk, final) {
        Inflate.prototype.e.call(this, chunk);
        if (this.v) {
            if (this.p.length < 2 && !final)
                return;
            this.p = this.p.subarray(2), this.v = 0;
        }
        if (final) {
            if (this.p.length < 4)
                throw 'invalid zlib stream';
            this.p = this.p.subarray(0, -4);
        }
        // necessary to prevent TS from using the closure value
        // This allows for workerization to function correctly
        Inflate.prototype.c.call(this, final);
    };
    return Unzlib;
}());
/**
 * Asynchronous streaming Zlib decompression
 */
var AsyncUnzlib = /*#__PURE__*/ (function () {
    /**
     * Creates an asynchronous Zlib decompression stream
     * @param cb The callback to call whenever data is deflated
     */
    function AsyncUnzlib(cb) {
        this.ondata = cb;
        astrmify([
            bInflt,
            zule,
            function () { return [astrm, Inflate, Unzlib]; }
        ], this, 0, function () {
            var strm = new Unzlib();
            onmessage = astrm(strm);
        }, 11);
    }
    return AsyncUnzlib;
}());
function unzlib(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        throw 'no callback';
    return cbify(data, opts, [
        bInflt,
        zule,
        function () { return [unzlibSync]; }
    ], function (ev) { return pbf(unzlibSync(ev.data[0], gu8(ev.data[1]))); }, 5, cb);
}
/**
 * Expands Zlib data
 * @param data The data to decompress
 * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
 * @returns The decompressed version of the data
 */
function unzlibSync(data, out) {
    return inflt((zlv(data), data.subarray(2, -4)), out);
}
/**
 * Streaming GZIP, Zlib, or raw DEFLATE decompression
 */
var Decompress = /*#__PURE__*/ (function () {
    /**
     * Creates a decompression stream
     * @param cb The callback to call whenever data is decompressed
     */
    function Decompress(cb) {
        this.G = Gunzip;
        this.I = Inflate;
        this.Z = Unzlib;
        this.ondata = cb;
    }
    /**
     * Pushes a chunk to be decompressed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Decompress.prototype.push = function (chunk, final) {
        if (!this.ondata)
            throw 'no stream handler';
        if (!this.s) {
            if (this.p && this.p.length) {
                var n = new u8(this.p.length + chunk.length);
                n.set(this.p), n.set(chunk, this.p.length);
            }
            else
                this.p = chunk;
            if (this.p.length > 2) {
                var _this_1 = this;
                var cb = function () { _this_1.ondata.apply(_this_1, arguments); };
                this.s = (this.p[0] == 31 && this.p[1] == 139 && this.p[2] == 8)
                    ? new this.G(cb)
                    : ((this.p[0] & 15) != 8 || (this.p[0] >> 4) > 7 || ((this.p[0] << 8 | this.p[1]) % 31))
                        ? new this.I(cb)
                        : new this.Z(cb);
                this.s.push(this.p, final);
                this.p = null;
            }
        }
        else
            this.s.push(chunk, final);
    };
    return Decompress;
}());
/**
 * Asynchronous streaming GZIP, Zlib, or raw DEFLATE decompression
 */
var AsyncDecompress = /*#__PURE__*/ (function () {
    /**
   * Creates an asynchronous decompression stream
   * @param cb The callback to call whenever data is decompressed
   */
    function AsyncDecompress(cb) {
        this.G = AsyncGunzip;
        this.I = AsyncInflate;
        this.Z = AsyncUnzlib;
        this.ondata = cb;
    }
    /**
     * Pushes a chunk to be decompressed
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    AsyncDecompress.prototype.push = function (chunk, final) {
        Decompress.prototype.push.call(this, chunk, final);
    };
    return AsyncDecompress;
}());
function decompress(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        throw 'no callback';
    return (data[0] == 31 && data[1] == 139 && data[2] == 8)
        ? gunzip(data, opts, cb)
        : ((data[0] & 15) != 8 || (data[0] >> 4) > 7 || ((data[0] << 8 | data[1]) % 31))
            ? inflate(data, opts, cb)
            : unzlib(data, opts, cb);
}
/**
 * Expands compressed GZIP, Zlib, or raw DEFLATE data, automatically detecting the format
 * @param data The data to decompress
 * @param out Where to write the data. Saves memory if you know the decompressed size and provide an output buffer of that length.
 * @returns The decompressed version of the data
 */
function decompressSync(data, out) {
    return (data[0] == 31 && data[1] == 139 && data[2] == 8)
        ? gunzipSync(data, out)
        : ((data[0] & 15) != 8 || (data[0] >> 4) > 7 || ((data[0] << 8 | data[1]) % 31))
            ? inflateSync(data, out)
            : unzlibSync(data, out);
}
// flatten a directory structure
var fltn = function (d, p, t, o) {
    for (var k in d) {
        var val = d[k], n = p + k;
        if (val instanceof u8)
            t[n] = [val, o];
        else if (Array.isArray(val))
            t[n] = [val[0], mrg(o, val[1])];
        else
            fltn(val, n + '/', t, o);
    }
};
// text encoder
var te = typeof TextEncoder != 'undefined' && /*#__PURE__*/ new TextEncoder();
// text decoder
var td = typeof TextDecoder != 'undefined' && /*#__PURE__*/ new TextDecoder();
// text decoder stream
var tds = 0;
try {
    td.decode(et, { stream: true });
    tds = 1;
}
catch (e) { }
// decode UTF8
var dutf8 = function (d) {
    for (var r = '', i = 0;;) {
        var c = d[i++];
        var eb = (c > 127) + (c > 223) + (c > 239);
        if (i + eb > d.length)
            return [r, slc(d, i - 1)];
        if (!eb)
            r += String.fromCharCode(c);
        else if (eb == 3) {
            c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63)) - 65536,
                r += String.fromCharCode(55296 | (c >> 10), 56320 | (c & 1023));
        }
        else if (eb & 1)
            r += String.fromCharCode((c & 31) << 6 | (d[i++] & 63));
        else
            r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | (d[i++] & 63));
    }
};
/**
 * Streaming UTF-8 decoding
 */
var DecodeUTF8 = /*#__PURE__*/ (function () {
    /**
     * Creates a UTF-8 decoding stream
     * @param cb The callback to call whenever data is decoded
     */
    function DecodeUTF8(cb) {
        this.ondata = cb;
        if (tds)
            this.t = new TextDecoder();
        else
            this.p = et;
    }
    /**
     * Pushes a chunk to be decoded from UTF-8 binary
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    DecodeUTF8.prototype.push = function (chunk, final) {
        if (!this.ondata)
            throw 'no callback';
        final = !!final;
        if (this.t) {
            this.ondata(this.t.decode(chunk, { stream: true }), final);
            if (final) {
                if (this.t.decode().length)
                    throw 'invalid utf-8 data';
                this.t = null;
            }
            return;
        }
        if (!this.p)
            throw 'stream finished';
        var dat = new u8(this.p.length + chunk.length);
        dat.set(this.p);
        dat.set(chunk, this.p.length);
        var _a = dutf8(dat), ch = _a[0], np = _a[1];
        if (final) {
            if (np.length)
                throw 'invalid utf-8 data';
            this.p = null;
        }
        else
            this.p = np;
        this.ondata(ch, final);
    };
    return DecodeUTF8;
}());
/**
 * Streaming UTF-8 encoding
 */
var EncodeUTF8 = /*#__PURE__*/ (function () {
    /**
     * Creates a UTF-8 decoding stream
     * @param cb The callback to call whenever data is encoded
     */
    function EncodeUTF8(cb) {
        this.ondata = cb;
    }
    /**
     * Pushes a chunk to be encoded to UTF-8
     * @param chunk The string data to push
     * @param final Whether this is the last chunk
     */
    EncodeUTF8.prototype.push = function (chunk, final) {
        if (!this.ondata)
            throw 'no callback';
        if (this.d)
            throw 'stream finished';
        this.ondata(strToU8(chunk), this.d = final || false);
    };
    return EncodeUTF8;
}());
/**
 * Converts a string into a Uint8Array for use with compression/decompression methods
 * @param str The string to encode
 * @param latin1 Whether or not to interpret the data as Latin-1. This should
 *               not need to be true unless decoding a binary string.
 * @returns The string encoded in UTF-8/Latin-1 binary
 */
function strToU8(str, latin1) {
    if (latin1) {
        var ar_1 = new u8(str.length);
        for (var i = 0; i < str.length; ++i)
            ar_1[i] = str.charCodeAt(i);
        return ar_1;
    }
    if (te)
        return te.encode(str);
    var l = str.length;
    var ar = new u8(str.length + (str.length >> 1));
    var ai = 0;
    var w = function (v) { ar[ai++] = v; };
    for (var i = 0; i < l; ++i) {
        if (ai + 5 > ar.length) {
            var n = new u8(ai + 8 + ((l - i) << 1));
            n.set(ar);
            ar = n;
        }
        var c = str.charCodeAt(i);
        if (c < 128 || latin1)
            w(c);
        else if (c < 2048)
            w(192 | (c >> 6)), w(128 | (c & 63));
        else if (c > 55295 && c < 57344)
            c = 65536 + (c & 1023 << 10) | (str.charCodeAt(++i) & 1023),
                w(240 | (c >> 18)), w(128 | ((c >> 12) & 63)), w(128 | ((c >> 6) & 63)), w(128 | (c & 63));
        else
            w(224 | (c >> 12)), w(128 | ((c >> 6) & 63)), w(128 | (c & 63));
    }
    return slc(ar, 0, ai);
}
/**
 * Converts a Uint8Array to a string
 * @param dat The data to decode to string
 * @param latin1 Whether or not to interpret the data as Latin-1. This should
 *               not need to be true unless encoding to binary string.
 * @returns The original UTF-8/Latin-1 string
 */
function strFromU8(dat, latin1) {
    if (latin1) {
        var r = '';
        for (var i = 0; i < dat.length; i += 16384)
            r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
        return r;
    }
    else if (td)
        return td.decode(dat);
    else {
        var _a = dutf8(dat), out = _a[0], ext = _a[1];
        if (ext.length)
            throw 'invalid utf-8 data';
        return out;
    }
}
// deflate bit flag
var dbf = function (l) { return l == 1 ? 3 : l < 6 ? 2 : l == 9 ? 1 : 0; };
// skip local zip header
var slzh = function (d, b) { return b + 30 + b2(d, b + 26) + b2(d, b + 28); };
// read zip header
var zh = function (d, b, z) {
    var fnl = b2(d, b + 28), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl, bs = b4(d, b + 20);
    var _a = z && bs == 4294967295 ? z64e(d, es) : [bs, b4(d, b + 24), b4(d, b + 42)], sc = _a[0], su = _a[1], off = _a[2];
    return [b2(d, b + 10), sc, su, fn, es + b2(d, b + 30) + b2(d, b + 32), off];
};
// read zip64 extra field
var z64e = function (d, b) {
    for (; b2(d, b) != 1; b += 4 + b2(d, b + 2))
        ;
    return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
};
// extra field length
var exfl = function (ex) {
    var le = 0;
    if (ex) {
        for (var k in ex) {
            var l = ex[k].length;
            if (l > 65535)
                throw 'extra field too long';
            le += l + 4;
        }
    }
    return le;
};
// write zip header
var wzh = function (d, b, f, fn, u, c, ce, co) {
    var fl = fn.length, ex = f.extra, col = co && co.length;
    var exl = exfl(ex);
    wbytes(d, b, ce != null ? 0x2014B50 : 0x4034B50), b += 4;
    if (ce != null)
        d[b++] = 20, d[b++] = f.os;
    d[b] = 20, b += 2; // spec compliance? what's that?
    d[b++] = (f.flag << 1) | (c == null && 8), d[b++] = u && 8;
    d[b++] = f.compression & 255, d[b++] = f.compression >> 8;
    var dt = new Date(f.mtime == null ? Date.now() : f.mtime), y = dt.getFullYear() - 1980;
    if (y < 0 || y > 119)
        throw 'date not in range 1980-2099';
    wbytes(d, b, (y << 25) | ((dt.getMonth() + 1) << 21) | (dt.getDate() << 16) | (dt.getHours() << 11) | (dt.getMinutes() << 5) | (dt.getSeconds() >>> 1)), b += 4;
    if (c != null) {
        wbytes(d, b, f.crc);
        wbytes(d, b + 4, c);
        wbytes(d, b + 8, f.size);
    }
    wbytes(d, b + 12, fl);
    wbytes(d, b + 14, exl), b += 16;
    if (ce != null) {
        wbytes(d, b, col);
        wbytes(d, b + 6, f.attrs);
        wbytes(d, b + 10, ce), b += 14;
    }
    d.set(fn, b);
    b += fl;
    if (exl) {
        for (var k in ex) {
            var exf = ex[k], l = exf.length;
            wbytes(d, b, +k);
            wbytes(d, b + 2, l);
            d.set(exf, b + 4), b += 4 + l;
        }
    }
    if (col)
        d.set(co, b), b += col;
    return b;
};
// write zip footer (end of central directory)
var wzf = function (o, b, c, d, e) {
    wbytes(o, b, 0x6054B50); // skip disk
    wbytes(o, b + 8, c);
    wbytes(o, b + 10, c);
    wbytes(o, b + 12, d);
    wbytes(o, b + 16, e);
};
/**
 * A pass-through stream to keep data uncompressed in a ZIP archive.
 */
var ZipPassThrough = /*#__PURE__*/ (function () {
    /**
     * Creates a pass-through stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     */
    function ZipPassThrough(filename) {
        this.filename = filename;
        this.c = crc();
        this.size = 0;
        this.compression = 0;
    }
    /**
     * Processes a chunk and pushes to the output stream. You can override this
     * method in a subclass for custom behavior, but by default this passes
     * the data through. You must call this.ondata(err, chunk, final) at some
     * point in this method.
     * @param chunk The chunk to process
     * @param final Whether this is the last chunk
     */
    ZipPassThrough.prototype.process = function (chunk, final) {
        this.ondata(null, chunk, final);
    };
    /**
     * Pushes a chunk to be added. If you are subclassing this with a custom
     * compression algorithm, note that you must push data from the source
     * file only, pre-compression.
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    ZipPassThrough.prototype.push = function (chunk, final) {
        if (!this.ondata)
            throw 'no callback - add to ZIP archive before pushing';
        this.c.p(chunk);
        this.size += chunk.length;
        if (final)
            this.crc = this.c.d();
        this.process(chunk, final || false);
    };
    return ZipPassThrough;
}());
// I don't extend because TypeScript extension adds 1kB of runtime bloat
/**
 * Streaming DEFLATE compression for ZIP archives. Prefer using AsyncZipDeflate
 * for better performance
 */
var ZipDeflate = /*#__PURE__*/ (function () {
    /**
     * Creates a DEFLATE stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     * @param opts The compression options
     */
    function ZipDeflate(filename, opts) {
        var _this_1 = this;
        if (!opts)
            opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new Deflate(opts, function (dat, final) {
            _this_1.ondata(null, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
    }
    ZipDeflate.prototype.process = function (chunk, final) {
        try {
            this.d.push(chunk, final);
        }
        catch (e) {
            this.ondata(e, null, final);
        }
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    ZipDeflate.prototype.push = function (chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return ZipDeflate;
}());
/**
 * Asynchronous streaming DEFLATE compression for ZIP archives
 */
var AsyncZipDeflate = /*#__PURE__*/ (function () {
    /**
     * Creates a DEFLATE stream that can be added to ZIP archives
     * @param filename The filename to associate with this data stream
     * @param opts The compression options
     */
    function AsyncZipDeflate(filename, opts) {
        var _this_1 = this;
        if (!opts)
            opts = {};
        ZipPassThrough.call(this, filename);
        this.d = new AsyncDeflate(opts, function (err, dat, final) {
            _this_1.ondata(err, dat, final);
        });
        this.compression = 8;
        this.flag = dbf(opts.level);
        this.terminate = this.d.terminate;
    }
    AsyncZipDeflate.prototype.process = function (chunk, final) {
        this.d.push(chunk, final);
    };
    /**
     * Pushes a chunk to be deflated
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    AsyncZipDeflate.prototype.push = function (chunk, final) {
        ZipPassThrough.prototype.push.call(this, chunk, final);
    };
    return AsyncZipDeflate;
}());
// TODO: Better tree shaking
/**
 * A zippable archive to which files can incrementally be added
 */
var Zip = /*#__PURE__*/ (function () {
    /**
     * Creates an empty ZIP archive to which files can be added
     * @param cb The callback to call whenever data for the generated ZIP archive
     *           is available
     */
    function Zip(cb) {
        this.ondata = cb;
        this.u = [];
        this.d = 1;
    }
    /**
     * Adds a file to the ZIP archive
     * @param file The file stream to add
     */
    Zip.prototype.add = function (file) {
        var _this_1 = this;
        if (this.d & 2)
            throw 'stream finished';
        var f = strToU8(file.filename), fl = f.length;
        var com = file.comment, o = com && strToU8(com);
        var u = fl != file.filename.length || (o && (com.length != o.length));
        var hl = fl + exfl(file.extra) + 30;
        if (fl > 65535)
            throw 'filename too long';
        var header = new u8(hl);
        wzh(header, 0, file, f, u);
        var chks = [header];
        var pAll = function () {
            for (var _i = 0, chks_1 = chks; _i < chks_1.length; _i++) {
                var chk = chks_1[_i];
                _this_1.ondata(null, chk, false);
            }
            chks = [];
        };
        var tr = this.d;
        this.d = 0;
        var ind = this.u.length;
        var uf = mrg(file, {
            f: f,
            u: u,
            o: o,
            t: function () {
                if (file.terminate)
                    file.terminate();
            },
            r: function () {
                pAll();
                if (tr) {
                    var nxt = _this_1.u[ind + 1];
                    if (nxt)
                        nxt.r();
                    else
                        _this_1.d = 1;
                }
                tr = 1;
            }
        });
        var cl = 0;
        file.ondata = function (err, dat, final) {
            if (err) {
                _this_1.ondata(err, dat, final);
                _this_1.terminate();
            }
            else {
                cl += dat.length;
                chks.push(dat);
                if (final) {
                    var dd = new u8(16);
                    wbytes(dd, 0, 0x8074B50);
                    wbytes(dd, 4, file.crc);
                    wbytes(dd, 8, cl);
                    wbytes(dd, 12, file.size);
                    chks.push(dd);
                    uf.c = cl, uf.b = hl + cl + 16, uf.crc = file.crc, uf.size = file.size;
                    if (tr)
                        uf.r();
                    tr = 1;
                }
                else if (tr)
                    pAll();
            }
        };
        this.u.push(uf);
    };
    /**
     * Ends the process of adding files and prepares to emit the final chunks.
     * This *must* be called after adding all desired files for the resulting
     * ZIP file to work properly.
     */
    Zip.prototype.end = function () {
        var _this_1 = this;
        if (this.d & 2) {
            if (this.d & 1)
                throw 'stream finishing';
            throw 'stream finished';
        }
        if (this.d)
            this.e();
        else
            this.u.push({
                r: function () {
                    if (!(_this_1.d & 1))
                        return;
                    _this_1.u.splice(-1, 1);
                    _this_1.e();
                },
                t: function () { }
            });
        this.d = 3;
    };
    Zip.prototype.e = function () {
        var bt = 0, l = 0, tl = 0;
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
            var f = _a[_i];
            tl += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0);
        }
        var out = new u8(tl + 22);
        for (var _b = 0, _c = this.u; _b < _c.length; _b++) {
            var f = _c[_b];
            wzh(out, bt, f, f.f, f.u, f.c, l, f.o);
            bt += 46 + f.f.length + exfl(f.extra) + (f.o ? f.o.length : 0), l += f.b;
        }
        wzf(out, bt, this.u.length, tl, l);
        this.ondata(null, out, true);
        this.d = 2;
    };
    /**
     * A method to terminate any internal workers used by the stream. Subsequent
     * calls to add() will fail.
     */
    Zip.prototype.terminate = function () {
        for (var _i = 0, _a = this.u; _i < _a.length; _i++) {
            var f = _a[_i];
            f.t();
        }
        this.d = 2;
    };
    return Zip;
}());
function zip(data, opts, cb) {
    if (!cb)
        cb = opts, opts = {};
    if (typeof cb != 'function')
        throw 'no callback';
    var r = {};
    fltn(data, '', r, opts);
    var k = Object.keys(r);
    var lft = k.length, o = 0, tot = 0;
    var slft = lft, files = new Array(lft);
    var term = [];
    var tAll = function () {
        for (var i = 0; i < term.length; ++i)
            term[i]();
    };
    var cbf = function () {
        var out = new u8(tot + 22), oe = o, cdl = tot - o;
        tot = 0;
        for (var i = 0; i < slft; ++i) {
            var f = files[i];
            try {
                var l = f.c.length;
                wzh(out, tot, f, f.f, f.u, l);
                var badd = 30 + f.f.length + exfl(f.extra);
                var loc = tot + badd;
                out.set(f.c, loc);
                wzh(out, o, f, f.f, f.u, l, tot, f.m), o += 16 + badd + (f.m ? f.m.length : 0), tot = loc + l;
            }
            catch (e) {
                return cb(e, null);
            }
        }
        wzf(out, o, files.length, cdl, oe);
        cb(null, out);
    };
    if (!lft)
        cbf();
    var _loop_1 = function (i) {
        var fn = k[i];
        var _a = r[fn], file = _a[0], p = _a[1];
        var c = crc(), size = file.length;
        c.p(file);
        var f = strToU8(fn), s = f.length;
        var com = p.comment, m = com && strToU8(com), ms = m && m.length;
        var exl = exfl(p.extra);
        var compression = p.level == 0 ? 0 : 8;
        var cbl = function (e, d) {
            if (e) {
                tAll();
                cb(e, null);
            }
            else {
                var l = d.length;
                files[i] = mrg(p, {
                    size: size,
                    crc: c.d(),
                    c: d,
                    f: f,
                    m: m,
                    u: s != fn.length || (m && (com.length != ms)),
                    compression: compression
                });
                o += 30 + s + exl + l;
                tot += 76 + 2 * (s + exl) + (ms || 0) + l;
                if (!--lft)
                    cbf();
            }
        };
        if (s > 65535)
            cbl('filename too long', null);
        if (!compression)
            cbl(null, file);
        else if (size < 160000) {
            try {
                cbl(null, deflateSync(file, p));
            }
            catch (e) {
                cbl(e, null);
            }
        }
        else
            term.push(deflate(file, p, cbl));
    };
    // Cannot use lft because it can decrease
    for (var i = 0; i < slft; ++i) {
        _loop_1(i);
    }
    return tAll;
}
/**
 * Synchronously creates a ZIP file. Prefer using `zip` for better performance
 * with more than one file.
 * @param data The directory structure for the ZIP archive
 * @param opts The main options, merged with per-file options
 * @returns The generated ZIP archive
 */
function zipSync(data, opts) {
    if (!opts)
        opts = {};
    var r = {};
    var files = [];
    fltn(data, '', r, opts);
    var o = 0;
    var tot = 0;
    for (var fn in r) {
        var _a = r[fn], file = _a[0], p = _a[1];
        var compression = p.level == 0 ? 0 : 8;
        var f = strToU8(fn), s = f.length;
        var com = p.comment, m = com && strToU8(com), ms = m && m.length;
        var exl = exfl(p.extra);
        if (s > 65535)
            throw 'filename too long';
        var d = compression ? deflateSync(file, p) : file, l = d.length;
        var c = crc();
        c.p(file);
        files.push(mrg(p, {
            size: file.length,
            crc: c.d(),
            c: d,
            f: f,
            m: m,
            u: s != fn.length || (m && (com.length != ms)),
            o: o,
            compression: compression
        }));
        o += 30 + s + exl + l;
        tot += 76 + 2 * (s + exl) + (ms || 0) + l;
    }
    var out = new u8(tot + 22), oe = o, cdl = tot - o;
    for (var i = 0; i < files.length; ++i) {
        var f = files[i];
        wzh(out, f.o, f, f.f, f.u, f.c.length);
        var badd = 30 + f.f.length + exfl(f.extra);
        out.set(f.c, f.o + badd);
        wzh(out, o, f, f.f, f.u, f.c.length, f.o, f.m), o += 16 + badd + (f.m ? f.m.length : 0);
    }
    wzf(out, o, files.length, cdl, oe);
    return out;
}
/**
 * Streaming pass-through decompression for ZIP archives
 */
var UnzipPassThrough = /*#__PURE__*/ (function () {
    function UnzipPassThrough() {
    }
    UnzipPassThrough.prototype.push = function (data, final) {
        this.ondata(null, data, final);
    };
    UnzipPassThrough.compression = 0;
    return UnzipPassThrough;
}());
/**
 * Streaming DEFLATE decompression for ZIP archives. Prefer AsyncZipInflate for
 * better performance.
 */
var UnzipInflate = /*#__PURE__*/ (function () {
    /**
     * Creates a DEFLATE decompression that can be used in ZIP archives
     */
    function UnzipInflate() {
        var _this_1 = this;
        this.i = new Inflate(function (dat, final) {
            _this_1.ondata(null, dat, final);
        });
    }
    UnzipInflate.prototype.push = function (data, final) {
        try {
            this.i.push(data, final);
        }
        catch (e) {
            this.ondata(e, data, final);
        }
    };
    UnzipInflate.compression = 8;
    return UnzipInflate;
}());
/**
 * Asynchronous streaming DEFLATE decompression for ZIP archives
 */
var AsyncUnzipInflate = /*#__PURE__*/ (function () {
    /**
     * Creates a DEFLATE decompression that can be used in ZIP archives
     */
    function AsyncUnzipInflate(_, sz) {
        var _this_1 = this;
        if (sz < 320000) {
            this.i = new Inflate(function (dat, final) {
                _this_1.ondata(null, dat, final);
            });
        }
        else {
            this.i = new AsyncInflate(function (err, dat, final) {
                _this_1.ondata(err, dat, final);
            });
            this.terminate = this.i.terminate;
        }
    }
    AsyncUnzipInflate.prototype.push = function (data, final) {
        if (this.i.terminate)
            data = slc(data, 0);
        this.i.push(data, final);
    };
    AsyncUnzipInflate.compression = 8;
    return AsyncUnzipInflate;
}());
/**
 * A ZIP archive decompression stream that emits files as they are discovered
 */
var Unzip = /*#__PURE__*/ (function () {
    /**
     * Creates a ZIP decompression stream
     * @param cb The callback to call whenever a file in the ZIP archive is found
     */
    function Unzip(cb) {
        this.onfile = cb;
        this.k = [];
        this.o = {
            0: UnzipPassThrough
        };
        this.p = et;
    }
    /**
     * Pushes a chunk to be unzipped
     * @param chunk The chunk to push
     * @param final Whether this is the last chunk
     */
    Unzip.prototype.push = function (chunk, final) {
        var _this_1 = this;
        if (!this.onfile)
            throw 'no callback';
        if (!this.p)
            throw 'stream finished';
        if (this.c > 0) {
            var len = Math.min(this.c, chunk.length);
            var toAdd = chunk.subarray(0, len);
            this.c -= len;
            if (this.d)
                this.d.push(toAdd, !this.c);
            else
                this.k[0].push(toAdd);
            chunk = chunk.subarray(len);
            if (chunk.length)
                return this.push(chunk, final);
        }
        else {
            var f = 0, i = 0, is = void 0, buf = void 0;
            if (!this.p.length)
                buf = chunk;
            else if (!chunk.length)
                buf = this.p;
            else {
                buf = new u8(this.p.length + chunk.length);
                buf.set(this.p), buf.set(chunk, this.p.length);
            }
            var l = buf.length, oc = this.c, add = oc && this.d;
            var _loop_2 = function () {
                var _a;
                var sig = b4(buf, i);
                if (sig == 0x4034B50) {
                    f = 1, is = i;
                    this_1.d = null;
                    this_1.c = 0;
                    var bf = b2(buf, i + 6), cmp_1 = b2(buf, i + 8), u = bf & 2048, dd = bf & 8, fnl = b2(buf, i + 26), es = b2(buf, i + 28);
                    if (l > i + 30 + fnl + es) {
                        var chks_2 = [];
                        this_1.k.unshift(chks_2);
                        f = 2;
                        var sc_1 = b4(buf, i + 18), su_1 = b4(buf, i + 22);
                        var fn_1 = strFromU8(buf.subarray(i + 30, i += 30 + fnl), !u);
                        if (sc_1 == 4294967295) {
                            _a = dd ? [-2] : z64e(buf, i), sc_1 = _a[0], su_1 = _a[1];
                        }
                        else if (dd)
                            sc_1 = -1;
                        i += es;
                        this_1.c = sc_1;
                        var d_1;
                        var file_1 = {
                            name: fn_1,
                            compression: cmp_1,
                            start: function () {
                                if (!file_1.ondata)
                                    throw 'no callback';
                                if (!sc_1)
                                    file_1.ondata(null, et, true);
                                else {
                                    var ctr = _this_1.o[cmp_1];
                                    if (!ctr)
                                        throw 'unknown compression type ' + cmp_1;
                                    d_1 = sc_1 < 0 ? new ctr(fn_1) : new ctr(fn_1, sc_1, su_1);
                                    d_1.ondata = function (err, dat, final) { file_1.ondata(err, dat, final); };
                                    for (var _i = 0, chks_3 = chks_2; _i < chks_3.length; _i++) {
                                        var dat = chks_3[_i];
                                        d_1.push(dat, false);
                                    }
                                    if (_this_1.k[0] == chks_2 && _this_1.c)
                                        _this_1.d = d_1;
                                    else
                                        d_1.push(et, true);
                                }
                            },
                            terminate: function () {
                                if (d_1 && d_1.terminate)
                                    d_1.terminate();
                            }
                        };
                        if (sc_1 >= 0)
                            file_1.size = sc_1, file_1.originalSize = su_1;
                        this_1.onfile(file_1);
                    }
                    return "break";
                }
                else if (oc) {
                    if (sig == 0x8074B50) {
                        is = i += 12 + (oc == -2 && 8), f = 3, this_1.c = 0;
                        return "break";
                    }
                    else if (sig == 0x2014B50) {
                        is = i -= 4, f = 3, this_1.c = 0;
                        return "break";
                    }
                }
            };
            var this_1 = this;
            for (; i < l - 4; ++i) {
                var state_1 = _loop_2();
                if (state_1 === "break")
                    break;
            }
            this.p = et;
            if (oc < 0) {
                var dat = f ? buf.subarray(0, is - 12 - (oc == -2 && 8) - (b4(buf, is - 16) == 0x8074B50 && 4)) : buf.subarray(0, i);
                if (add)
                    add.push(dat, !!f);
                else
                    this.k[+(f == 2)].push(dat);
            }
            if (f & 2)
                return this.push(buf.subarray(i), final);
            this.p = buf.subarray(i);
        }
        if (final) {
            if (this.c)
                throw 'invalid zip file';
            this.p = null;
        }
    };
    /**
     * Registers a decoder with the stream, allowing for files compressed with
     * the compression type provided to be expanded correctly
     * @param decoder The decoder constructor
     */
    Unzip.prototype.register = function (decoder) {
        this.o[decoder.compression] = decoder;
    };
    return Unzip;
}());
/**
 * Asynchronously decompresses a ZIP archive
 * @param data The raw compressed ZIP file
 * @param cb The callback to call with the decompressed files
 * @returns A function that can be used to immediately terminate the unzipping
 */
function unzip(data, cb) {
    if (typeof cb != 'function')
        throw 'no callback';
    var term = [];
    var tAll = function () {
        for (var i = 0; i < term.length; ++i)
            term[i]();
    };
    var files = {};
    var e = data.length - 22;
    for (; b4(data, e) != 0x6054B50; --e) {
        if (!e || data.length - e > 65558) {
            cb('invalid zip file', null);
            return;
        }
    }
    var lft = b2(data, e + 8);
    if (!lft)
        cb(null, {});
    var c = lft;
    var o = b4(data, e + 16);
    var z = o == 4294967295;
    if (z) {
        e = b4(data, e - 12);
        if (b4(data, e) != 0x6064B50) {
            cb('invalid zip file', null);
            return;
        }
        c = lft = b4(data, e + 32);
        o = b4(data, e + 48);
    }
    var _loop_3 = function (i) {
        var _a = zh(data, o, z), c_1 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
        o = no;
        var cbl = function (e, d) {
            if (e) {
                tAll();
                cb(e, null);
            }
            else {
                files[fn] = d;
                if (!--lft)
                    cb(null, files);
            }
        };
        if (!c_1)
            cbl(null, slc(data, b, b + sc));
        else if (c_1 == 8) {
            var infl = data.subarray(b, b + sc);
            if (sc < 320000) {
                try {
                    cbl(null, inflateSync(infl, new u8(su)));
                }
                catch (e) {
                    cbl(e, null);
                }
            }
            else
                term.push(inflate(infl, { size: su }, cbl));
        }
        else
            cbl('unknown compression type ' + c_1, null);
    };
    for (var i = 0; i < c; ++i) {
        _loop_3();
    }
    return tAll;
}
/**
 * Synchronously decompresses a ZIP archive. Prefer using `unzip` for better
 * performance with more than one file.
 * @param data The raw compressed ZIP file
 * @returns The decompressed files
 */
function unzipSync(data) {
    var files = {};
    var e = data.length - 22;
    for (; b4(data, e) != 0x6054B50; --e) {
        if (!e || data.length - e > 65558)
            throw 'invalid zip file';
    }
    var c = b2(data, e + 8);
    if (!c)
        return {};
    var o = b4(data, e + 16);
    var z = o == 4294967295;
    if (z) {
        e = b4(data, e - 12);
        if (b4(data, e) != 0x6064B50)
            throw 'invalid zip file';
        c = b4(data, e + 32);
        o = b4(data, e + 48);
    }
    for (var i = 0; i < c; ++i) {
        var _a = zh(data, o, z), c_2 = _a[0], sc = _a[1], su = _a[2], fn = _a[3], no = _a[4], off = _a[5], b = slzh(data, off);
        o = no;
        if (!c_2)
            files[fn] = slc(data, b, b + sc);
        else if (c_2 == 8)
            files[fn] = inflateSync(data.subarray(b, b + sc), new u8(su));
        else
            throw 'unknown compression type ' + c_2;
    }
    return files;
}

var fflate = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Deflate: Deflate,
	AsyncDeflate: AsyncDeflate,
	deflate: deflate,
	deflateSync: deflateSync,
	Inflate: Inflate,
	AsyncInflate: AsyncInflate,
	inflate: inflate,
	inflateSync: inflateSync,
	Gzip: Gzip,
	AsyncGzip: AsyncGzip,
	gzip: gzip,
	gzipSync: gzipSync,
	Gunzip: Gunzip,
	AsyncGunzip: AsyncGunzip,
	gunzip: gunzip,
	gunzipSync: gunzipSync,
	Zlib: Zlib,
	AsyncZlib: AsyncZlib,
	zlib: zlib,
	zlibSync: zlibSync,
	Unzlib: Unzlib,
	AsyncUnzlib: AsyncUnzlib,
	unzlib: unzlib,
	unzlibSync: unzlibSync,
	compress: gzip,
	AsyncCompress: AsyncGzip,
	compressSync: gzipSync,
	Compress: Gzip,
	Decompress: Decompress,
	AsyncDecompress: AsyncDecompress,
	decompress: decompress,
	decompressSync: decompressSync,
	DecodeUTF8: DecodeUTF8,
	EncodeUTF8: EncodeUTF8,
	strToU8: strToU8,
	strFromU8: strFromU8,
	ZipPassThrough: ZipPassThrough,
	ZipDeflate: ZipDeflate,
	AsyncZipDeflate: AsyncZipDeflate,
	Zip: Zip,
	zip: zip,
	zipSync: zipSync,
	UnzipPassThrough: UnzipPassThrough,
	UnzipInflate: UnzipInflate,
	AsyncUnzipInflate: AsyncUnzipInflate,
	Unzip: Unzip,
	unzip: unzip,
	unzipSync: unzipSync
});

/**
 * NURBS utils
 *
 * See NURBSCurve and NURBSSurface.
 **/


/**************************************************************
 *	NURBS Utils
 **************************************************************/

/*
Finds knot vector span.

p : degree
u : parametric value
U : knot vector

returns the span
*/
function findSpan( p, u, U ) {

	const n = U.length - p - 1;

	if ( u >= U[ n ] ) {

		return n - 1;

	}

	if ( u <= U[ p ] ) {

		return p;

	}

	let low = p;
	let high = n;
	let mid = Math.floor( ( low + high ) / 2 );

	while ( u < U[ mid ] || u >= U[ mid + 1 ] ) {

		if ( u < U[ mid ] ) {

			high = mid;

		} else {

			low = mid;

		}

		mid = Math.floor( ( low + high ) / 2 );

	}

	return mid;

}


/*
Calculate basis functions. See The NURBS Book, page 70, algorithm A2.2

span : span in which u lies
u    : parametric point
p    : degree
U    : knot vector

returns array[p+1] with basis functions values.
*/
function calcBasisFunctions( span, u, p, U ) {

	const N = [];
	const left = [];
	const right = [];
	N[ 0 ] = 1.0;

	for ( let j = 1; j <= p; ++ j ) {

		left[ j ] = u - U[ span + 1 - j ];
		right[ j ] = U[ span + j ] - u;

		let saved = 0.0;

		for ( let r = 0; r < j; ++ r ) {

			const rv = right[ r + 1 ];
			const lv = left[ j - r ];
			const temp = N[ r ] / ( rv + lv );
			N[ r ] = saved + rv * temp;
			saved = lv * temp;

		}

		N[ j ] = saved;

	}

	return N;

}


/*
Calculate B-Spline curve points. See The NURBS Book, page 82, algorithm A3.1.

p : degree of B-Spline
U : knot vector
P : control points (x, y, z, w)
u : parametric point

returns point for given u
*/
function calcBSplinePoint( p, U, P, u ) {

	const span = findSpan( p, u, U );
	const N = calcBasisFunctions( span, u, p, U );
	const C = new Vector4( 0, 0, 0, 0 );

	for ( let j = 0; j <= p; ++ j ) {

		const point = P[ span - p + j ];
		const Nj = N[ j ];
		const wNj = point.w * Nj;
		C.x += point.x * wNj;
		C.y += point.y * wNj;
		C.z += point.z * wNj;
		C.w += point.w * Nj;

	}

	return C;

}


/*
Calculate basis functions derivatives. See The NURBS Book, page 72, algorithm A2.3.

span : span in which u lies
u    : parametric point
p    : degree
n    : number of derivatives to calculate
U    : knot vector

returns array[n+1][p+1] with basis functions derivatives
*/
function calcBasisFunctionDerivatives( span, u, p, n, U ) {

	const zeroArr = [];
	for ( let i = 0; i <= p; ++ i )
		zeroArr[ i ] = 0.0;

	const ders = [];

	for ( let i = 0; i <= n; ++ i )
		ders[ i ] = zeroArr.slice( 0 );

	const ndu = [];

	for ( let i = 0; i <= p; ++ i )
		ndu[ i ] = zeroArr.slice( 0 );

	ndu[ 0 ][ 0 ] = 1.0;

	const left = zeroArr.slice( 0 );
	const right = zeroArr.slice( 0 );

	for ( let j = 1; j <= p; ++ j ) {

		left[ j ] = u - U[ span + 1 - j ];
		right[ j ] = U[ span + j ] - u;

		let saved = 0.0;

		for ( let r = 0; r < j; ++ r ) {

			const rv = right[ r + 1 ];
			const lv = left[ j - r ];
			ndu[ j ][ r ] = rv + lv;

			const temp = ndu[ r ][ j - 1 ] / ndu[ j ][ r ];
			ndu[ r ][ j ] = saved + rv * temp;
			saved = lv * temp;

		}

		ndu[ j ][ j ] = saved;

	}

	for ( let j = 0; j <= p; ++ j ) {

		ders[ 0 ][ j ] = ndu[ j ][ p ];

	}

	for ( let r = 0; r <= p; ++ r ) {

		let s1 = 0;
		let s2 = 1;

		const a = [];
		for ( let i = 0; i <= p; ++ i ) {

			a[ i ] = zeroArr.slice( 0 );

		}

		a[ 0 ][ 0 ] = 1.0;

		for ( let k = 1; k <= n; ++ k ) {

			let d = 0.0;
			const rk = r - k;
			const pk = p - k;

			if ( r >= k ) {

				a[ s2 ][ 0 ] = a[ s1 ][ 0 ] / ndu[ pk + 1 ][ rk ];
				d = a[ s2 ][ 0 ] * ndu[ rk ][ pk ];

			}

			const j1 = ( rk >= - 1 ) ? 1 : - rk;
			const j2 = ( r - 1 <= pk ) ? k - 1 : p - r;

			for ( let j = j1; j <= j2; ++ j ) {

				a[ s2 ][ j ] = ( a[ s1 ][ j ] - a[ s1 ][ j - 1 ] ) / ndu[ pk + 1 ][ rk + j ];
				d += a[ s2 ][ j ] * ndu[ rk + j ][ pk ];

			}

			if ( r <= pk ) {

				a[ s2 ][ k ] = - a[ s1 ][ k - 1 ] / ndu[ pk + 1 ][ r ];
				d += a[ s2 ][ k ] * ndu[ r ][ pk ];

			}

			ders[ k ][ r ] = d;

			const j = s1;
			s1 = s2;
			s2 = j;

		}

	}

	let r = p;

	for ( let k = 1; k <= n; ++ k ) {

		for ( let j = 0; j <= p; ++ j ) {

			ders[ k ][ j ] *= r;

		}

		r *= p - k;

	}

	return ders;

}


/*
	Calculate derivatives of a B-Spline. See The NURBS Book, page 93, algorithm A3.2.

	p  : degree
	U  : knot vector
	P  : control points
	u  : Parametric points
	nd : number of derivatives

	returns array[d+1] with derivatives
	*/
function calcBSplineDerivatives( p, U, P, u, nd ) {

	const du = nd < p ? nd : p;
	const CK = [];
	const span = findSpan( p, u, U );
	const nders = calcBasisFunctionDerivatives( span, u, p, du, U );
	const Pw = [];

	for ( let i = 0; i < P.length; ++ i ) {

		const point = P[ i ].clone();
		const w = point.w;

		point.x *= w;
		point.y *= w;
		point.z *= w;

		Pw[ i ] = point;

	}

	for ( let k = 0; k <= du; ++ k ) {

		const point = Pw[ span - p ].clone().multiplyScalar( nders[ k ][ 0 ] );

		for ( let j = 1; j <= p; ++ j ) {

			point.add( Pw[ span - p + j ].clone().multiplyScalar( nders[ k ][ j ] ) );

		}

		CK[ k ] = point;

	}

	for ( let k = du + 1; k <= nd + 1; ++ k ) {

		CK[ k ] = new Vector4( 0, 0, 0 );

	}

	return CK;

}


/*
Calculate "K over I"

returns k!/(i!(k-i)!)
*/
function calcKoverI( k, i ) {

	let nom = 1;

	for ( let j = 2; j <= k; ++ j ) {

		nom *= j;

	}

	let denom = 1;

	for ( let j = 2; j <= i; ++ j ) {

		denom *= j;

	}

	for ( let j = 2; j <= k - i; ++ j ) {

		denom *= j;

	}

	return nom / denom;

}


/*
Calculate derivatives (0-nd) of rational curve. See The NURBS Book, page 127, algorithm A4.2.

Pders : result of function calcBSplineDerivatives

returns array with derivatives for rational curve.
*/
function calcRationalCurveDerivatives( Pders ) {

	const nd = Pders.length;
	const Aders = [];
	const wders = [];

	for ( let i = 0; i < nd; ++ i ) {

		const point = Pders[ i ];
		Aders[ i ] = new Vector3( point.x, point.y, point.z );
		wders[ i ] = point.w;

	}

	const CK = [];

	for ( let k = 0; k < nd; ++ k ) {

		const v = Aders[ k ].clone();

		for ( let i = 1; i <= k; ++ i ) {

			v.sub( CK[ k - i ].clone().multiplyScalar( calcKoverI( k, i ) * wders[ i ] ) );

		}

		CK[ k ] = v.divideScalar( wders[ 0 ] );

	}

	return CK;

}


/*
Calculate NURBS curve derivatives. See The NURBS Book, page 127, algorithm A4.2.

p  : degree
U  : knot vector
P  : control points in homogeneous space
u  : parametric points
nd : number of derivatives

returns array with derivatives.
*/
function calcNURBSDerivatives( p, U, P, u, nd ) {

	const Pders = calcBSplineDerivatives( p, U, P, u, nd );
	return calcRationalCurveDerivatives( Pders );

}

/**
 * NURBS curve object
 *
 * Derives from Curve, overriding getPoint and getTangent.
 *
 * Implementation is based on (x, y [, z=0 [, w=1]]) control points with w=weight.
 *
 **/

class NURBSCurve extends Curve {

	constructor(
		degree,
		knots /* array of reals */,
		controlPoints /* array of Vector(2|3|4) */,
		startKnot /* index in knots */,
		endKnot /* index in knots */
	) {

		super();

		this.degree = degree;
		this.knots = knots;
		this.controlPoints = [];
		// Used by periodic NURBS to remove hidden spans
		this.startKnot = startKnot || 0;
		this.endKnot = endKnot || ( this.knots.length - 1 );

		for ( let i = 0; i < controlPoints.length; ++ i ) {

			// ensure Vector4 for control points
			const point = controlPoints[ i ];
			this.controlPoints[ i ] = new Vector4( point.x, point.y, point.z, point.w );

		}

	}

	getPoint( t, optionalTarget = new Vector3() ) {

		const point = optionalTarget;

		const u = this.knots[ this.startKnot ] + t * ( this.knots[ this.endKnot ] - this.knots[ this.startKnot ] ); // linear mapping t->u

		// following results in (wx, wy, wz, w) homogeneous point
		const hpoint = calcBSplinePoint( this.degree, this.knots, this.controlPoints, u );

		if ( hpoint.w !== 1.0 ) {

			// project to 3D space: (wx, wy, wz, w) -> (x, y, z, 1)
			hpoint.divideScalar( hpoint.w );

		}

		return point.set( hpoint.x, hpoint.y, hpoint.z );

	}

	getTangent( t, optionalTarget = new Vector3() ) {

		const tangent = optionalTarget;

		const u = this.knots[ 0 ] + t * ( this.knots[ this.knots.length - 1 ] - this.knots[ 0 ] );
		const ders = calcNURBSDerivatives( this.degree, this.knots, this.controlPoints, u, 1 );
		tangent.copy( ders[ 1 ] ).normalize();

		return tangent;

	}

}

/**
 * Loader loads FBX file and generates Group representing FBX scene.
 * Requires FBX file to be >= 7.0 and in ASCII or >= 6400 in Binary format
 * Versions lower than this may load but will probably have errors
 *
 * Needs Support:
 *  Morph normals / blend shape normals
 *
 * FBX format references:
 * 	https://help.autodesk.com/view/FBX/2017/ENU/?guid=__cpp_ref_index_html (C++ SDK reference)
 *
 * Binary format specification:
 *	https://code.blender.org/2013/08/fbx-binary-file-format-specification/
 */


let fbxTree;
let connections;
let sceneGraph;

class FBXLoader extends Loader {

	constructor( manager ) {

		super( manager );

	}

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		const path = ( scope.path === '' ) ? LoaderUtils.extractUrlBase( url ) : scope.path;

		const loader = new FileLoader( this.manager );
		loader.setPath( scope.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( scope.requestHeader );
		loader.setWithCredentials( scope.withCredentials );

		loader.load( url, function ( buffer ) {

			try {

				onLoad( scope.parse( buffer, path ) );

			} catch ( e ) {

				if ( onError ) {

					onError( e );

				} else {

					console.error( e );

				}

				scope.manager.itemError( url );

			}

		}, onProgress, onError );

	}

	parse( FBXBuffer, path ) {

		if ( isFbxFormatBinary( FBXBuffer ) ) {

			fbxTree = new BinaryParser().parse( FBXBuffer );

		} else {

			const FBXText = convertArrayBufferToString( FBXBuffer );

			if ( ! isFbxFormatASCII( FBXText ) ) {

				throw new Error( 'THREE.FBXLoader: Unknown format.' );

			}

			if ( getFbxVersion( FBXText ) < 7000 ) {

				throw new Error( 'THREE.FBXLoader: FBX version not supported, FileVersion: ' + getFbxVersion( FBXText ) );

			}

			fbxTree = new TextParser().parse( FBXText );

		}

		// console.log( fbxTree );

		const textureLoader = new TextureLoader( this.manager ).setPath( this.resourcePath || path ).setCrossOrigin( this.crossOrigin );

		return new FBXTreeParser( textureLoader, this.manager ).parse( fbxTree );

	}

}

// Parse the FBXTree object returned by the BinaryParser or TextParser and return a Group
class FBXTreeParser {

	constructor( textureLoader, manager ) {

		this.textureLoader = textureLoader;
		this.manager = manager;

	}

	parse() {

		connections = this.parseConnections();

		const images = this.parseImages();
		const textures = this.parseTextures( images );
		const materials = this.parseMaterials( textures );
		const deformers = this.parseDeformers();
		const geometryMap = new GeometryParser().parse( deformers );

		this.parseScene( deformers, geometryMap, materials );

		return sceneGraph;

	}

	// Parses FBXTree.Connections which holds parent-child connections between objects (e.g. material -> texture, model->geometry )
	// and details the connection type
	parseConnections() {

		const connectionMap = new Map();

		if ( 'Connections' in fbxTree ) {

			const rawConnections = fbxTree.Connections.connections;

			rawConnections.forEach( function ( rawConnection ) {

				const fromID = rawConnection[ 0 ];
				const toID = rawConnection[ 1 ];
				const relationship = rawConnection[ 2 ];

				if ( ! connectionMap.has( fromID ) ) {

					connectionMap.set( fromID, {
						parents: [],
						children: []
					} );

				}

				const parentRelationship = { ID: toID, relationship: relationship };
				connectionMap.get( fromID ).parents.push( parentRelationship );

				if ( ! connectionMap.has( toID ) ) {

					connectionMap.set( toID, {
						parents: [],
						children: []
					} );

				}

				const childRelationship = { ID: fromID, relationship: relationship };
				connectionMap.get( toID ).children.push( childRelationship );

			} );

		}

		return connectionMap;

	}

	// Parse FBXTree.Objects.Video for embedded image data
	// These images are connected to textures in FBXTree.Objects.Textures
	// via FBXTree.Connections.
	parseImages() {

		const images = {};
		const blobs = {};

		if ( 'Video' in fbxTree.Objects ) {

			const videoNodes = fbxTree.Objects.Video;

			for ( const nodeID in videoNodes ) {

				const videoNode = videoNodes[ nodeID ];

				const id = parseInt( nodeID );

				images[ id ] = videoNode.RelativeFilename || videoNode.Filename;

				// raw image data is in videoNode.Content
				if ( 'Content' in videoNode ) {

					const arrayBufferContent = ( videoNode.Content instanceof ArrayBuffer ) && ( videoNode.Content.byteLength > 0 );
					const base64Content = ( typeof videoNode.Content === 'string' ) && ( videoNode.Content !== '' );

					if ( arrayBufferContent || base64Content ) {

						const image = this.parseImage( videoNodes[ nodeID ] );

						blobs[ videoNode.RelativeFilename || videoNode.Filename ] = image;

					}

				}

			}

		}

		for ( const id in images ) {

			const filename = images[ id ];

			if ( blobs[ filename ] !== undefined ) images[ id ] = blobs[ filename ];
			else images[ id ] = images[ id ].split( '\\' ).pop();

		}

		return images;

	}

	// Parse embedded image data in FBXTree.Video.Content
	parseImage( videoNode ) {

		const content = videoNode.Content;
		const fileName = videoNode.RelativeFilename || videoNode.Filename;
		const extension = fileName.slice( fileName.lastIndexOf( '.' ) + 1 ).toLowerCase();

		let type;

		switch ( extension ) {

			case 'bmp':

				type = 'image/bmp';
				break;

			case 'jpg':
			case 'jpeg':

				type = 'image/jpeg';
				break;

			case 'png':

				type = 'image/png';
				break;

			case 'tif':

				type = 'image/tiff';
				break;

			case 'tga':

				if ( this.manager.getHandler( '.tga' ) === null ) {

					console.warn( 'FBXLoader: TGA loader not found, skipping ', fileName );

				}

				type = 'image/tga';
				break;

			default:

				console.warn( 'FBXLoader: Image type "' + extension + '" is not supported.' );
				return;

		}

		if ( typeof content === 'string' ) { // ASCII format

			return 'data:' + type + ';base64,' + content;

		} else { // Binary Format

			const array = new Uint8Array( content );
			return window.URL.createObjectURL( new Blob( [ array ], { type: type } ) );

		}

	}

	// Parse nodes in FBXTree.Objects.Texture
	// These contain details such as UV scaling, cropping, rotation etc and are connected
	// to images in FBXTree.Objects.Video
	parseTextures( images ) {

		const textureMap = new Map();

		if ( 'Texture' in fbxTree.Objects ) {

			const textureNodes = fbxTree.Objects.Texture;
			for ( const nodeID in textureNodes ) {

				const texture = this.parseTexture( textureNodes[ nodeID ], images );
				textureMap.set( parseInt( nodeID ), texture );

			}

		}

		return textureMap;

	}

	// Parse individual node in FBXTree.Objects.Texture
	parseTexture( textureNode, images ) {

		const texture = this.loadTexture( textureNode, images );

		texture.ID = textureNode.id;

		texture.name = textureNode.attrName;

		const wrapModeU = textureNode.WrapModeU;
		const wrapModeV = textureNode.WrapModeV;

		const valueU = wrapModeU !== undefined ? wrapModeU.value : 0;
		const valueV = wrapModeV !== undefined ? wrapModeV.value : 0;

		// http://download.autodesk.com/us/fbx/SDKdocs/FBX_SDK_Help/files/fbxsdkref/class_k_fbx_texture.html#889640e63e2e681259ea81061b85143a
		// 0: repeat(default), 1: clamp

		texture.wrapS = valueU === 0 ? RepeatWrapping : ClampToEdgeWrapping;
		texture.wrapT = valueV === 0 ? RepeatWrapping : ClampToEdgeWrapping;

		if ( 'Scaling' in textureNode ) {

			const values = textureNode.Scaling.value;

			texture.repeat.x = values[ 0 ];
			texture.repeat.y = values[ 1 ];

		}

		if ( 'Translation' in textureNode ) {

			const values = textureNode.Translation.value;

			texture.offset.x = values[ 0 ];
			texture.offset.y = values[ 1 ];

		}

		return texture;

	}

	// load a texture specified as a blob or data URI, or via an external URL using TextureLoader
	loadTexture( textureNode, images ) {

		let fileName;

		const currentPath = this.textureLoader.path;

		const children = connections.get( textureNode.id ).children;

		if ( children !== undefined && children.length > 0 && images[ children[ 0 ].ID ] !== undefined ) {

			fileName = images[ children[ 0 ].ID ];

			if ( fileName.indexOf( 'blob:' ) === 0 || fileName.indexOf( 'data:' ) === 0 ) {

				this.textureLoader.setPath( undefined );

			}

		}

		let texture;

		const extension = textureNode.FileName.slice( - 3 ).toLowerCase();

		if ( extension === 'tga' ) {

			const loader = this.manager.getHandler( '.tga' );

			if ( loader === null ) {

				console.warn( 'FBXLoader: TGA loader not found, creating placeholder texture for', textureNode.RelativeFilename );
				texture = new Texture();

			} else {

				loader.setPath( this.textureLoader.path );
				texture = loader.load( fileName );

			}

		} else if ( extension === 'psd' ) {

			console.warn( 'FBXLoader: PSD textures are not supported, creating placeholder texture for', textureNode.RelativeFilename );
			texture = new Texture();

		} else {

			texture = this.textureLoader.load( fileName );

		}

		this.textureLoader.setPath( currentPath );

		return texture;

	}

	// Parse nodes in FBXTree.Objects.Material
	parseMaterials( textureMap ) {

		const materialMap = new Map();

		if ( 'Material' in fbxTree.Objects ) {

			const materialNodes = fbxTree.Objects.Material;

			for ( const nodeID in materialNodes ) {

				const material = this.parseMaterial( materialNodes[ nodeID ], textureMap );

				if ( material !== null ) materialMap.set( parseInt( nodeID ), material );

			}

		}

		return materialMap;

	}

	// Parse single node in FBXTree.Objects.Material
	// Materials are connected to texture maps in FBXTree.Objects.Textures
	// FBX format currently only supports Lambert and Phong shading models
	parseMaterial( materialNode, textureMap ) {

		const ID = materialNode.id;
		const name = materialNode.attrName;
		let type = materialNode.ShadingModel;

		// Case where FBX wraps shading model in property object.
		if ( typeof type === 'object' ) {

			type = type.value;

		}

		// Ignore unused materials which don't have any connections.
		if ( ! connections.has( ID ) ) return null;

		const parameters = this.parseParameters( materialNode, textureMap, ID );

		let material;

		switch ( type.toLowerCase() ) {

			case 'phong':
				material = new MeshPhongMaterial();
				break;
			case 'lambert':
				material = new MeshLambertMaterial();
				break;
			default:
				console.warn( 'THREE.FBXLoader: unknown material type "%s". Defaulting to MeshPhongMaterial.', type );
				material = new MeshPhongMaterial();
				break;

		}

		material.setValues( parameters );
		material.name = name;

		return material;

	}

	// Parse FBX material and return parameters suitable for a three.js material
	// Also parse the texture map and return any textures associated with the material
	parseParameters( materialNode, textureMap, ID ) {

		const parameters = {};

		if ( materialNode.BumpFactor ) {

			parameters.bumpScale = materialNode.BumpFactor.value;

		}

		if ( materialNode.Diffuse ) {

			parameters.color = new Color().fromArray( materialNode.Diffuse.value );

		} else if ( materialNode.DiffuseColor && ( materialNode.DiffuseColor.type === 'Color' || materialNode.DiffuseColor.type === 'ColorRGB' ) ) {

			// The blender exporter exports diffuse here instead of in materialNode.Diffuse
			parameters.color = new Color().fromArray( materialNode.DiffuseColor.value );

		}

		if ( materialNode.DisplacementFactor ) {

			parameters.displacementScale = materialNode.DisplacementFactor.value;

		}

		if ( materialNode.Emissive ) {

			parameters.emissive = new Color().fromArray( materialNode.Emissive.value );

		} else if ( materialNode.EmissiveColor && ( materialNode.EmissiveColor.type === 'Color' || materialNode.EmissiveColor.type === 'ColorRGB' ) ) {

			// The blender exporter exports emissive color here instead of in materialNode.Emissive
			parameters.emissive = new Color().fromArray( materialNode.EmissiveColor.value );

		}

		if ( materialNode.EmissiveFactor ) {

			parameters.emissiveIntensity = parseFloat( materialNode.EmissiveFactor.value );

		}

		if ( materialNode.Opacity ) {

			parameters.opacity = parseFloat( materialNode.Opacity.value );

		}

		if ( parameters.opacity < 1.0 ) {

			parameters.transparent = true;

		}

		if ( materialNode.ReflectionFactor ) {

			parameters.reflectivity = materialNode.ReflectionFactor.value;

		}

		if ( materialNode.Shininess ) {

			parameters.shininess = materialNode.Shininess.value;

		}

		if ( materialNode.Specular ) {

			parameters.specular = new Color().fromArray( materialNode.Specular.value );

		} else if ( materialNode.SpecularColor && materialNode.SpecularColor.type === 'Color' ) {

			// The blender exporter exports specular color here instead of in materialNode.Specular
			parameters.specular = new Color().fromArray( materialNode.SpecularColor.value );

		}

		const scope = this;
		connections.get( ID ).children.forEach( function ( child ) {

			const type = child.relationship;

			switch ( type ) {

				case 'Bump':
					parameters.bumpMap = scope.getTexture( textureMap, child.ID );
					break;

				case 'Maya|TEX_ao_map':
					parameters.aoMap = scope.getTexture( textureMap, child.ID );
					break;

				case 'DiffuseColor':
				case 'Maya|TEX_color_map':
					parameters.map = scope.getTexture( textureMap, child.ID );
					if ( parameters.map !== undefined ) {

						parameters.map.encoding = sRGBEncoding;

					}

					break;

				case 'DisplacementColor':
					parameters.displacementMap = scope.getTexture( textureMap, child.ID );
					break;

				case 'EmissiveColor':
					parameters.emissiveMap = scope.getTexture( textureMap, child.ID );
					if ( parameters.emissiveMap !== undefined ) {

						parameters.emissiveMap.encoding = sRGBEncoding;

					}

					break;

				case 'NormalMap':
				case 'Maya|TEX_normal_map':
					parameters.normalMap = scope.getTexture( textureMap, child.ID );
					break;

				case 'ReflectionColor':
					parameters.envMap = scope.getTexture( textureMap, child.ID );
					if ( parameters.envMap !== undefined ) {

						parameters.envMap.mapping = EquirectangularReflectionMapping;
						parameters.envMap.encoding = sRGBEncoding;

					}

					break;

				case 'SpecularColor':
					parameters.specularMap = scope.getTexture( textureMap, child.ID );
					if ( parameters.specularMap !== undefined ) {

						parameters.specularMap.encoding = sRGBEncoding;

					}

					break;

				case 'TransparentColor':
				case 'TransparencyFactor':
					parameters.alphaMap = scope.getTexture( textureMap, child.ID );
					parameters.transparent = true;
					break;

				case 'AmbientColor':
				case 'ShininessExponent': // AKA glossiness map
				case 'SpecularFactor': // AKA specularLevel
				case 'VectorDisplacementColor': // NOTE: Seems to be a copy of DisplacementColor
				default:
					console.warn( 'THREE.FBXLoader: %s map is not supported in three.js, skipping texture.', type );
					break;

			}

		} );

		return parameters;

	}

	// get a texture from the textureMap for use by a material.
	getTexture( textureMap, id ) {

		// if the texture is a layered texture, just use the first layer and issue a warning
		if ( 'LayeredTexture' in fbxTree.Objects && id in fbxTree.Objects.LayeredTexture ) {

			console.warn( 'THREE.FBXLoader: layered textures are not supported in three.js. Discarding all but first layer.' );
			id = connections.get( id ).children[ 0 ].ID;

		}

		return textureMap.get( id );

	}

	// Parse nodes in FBXTree.Objects.Deformer
	// Deformer node can contain skinning or Vertex Cache animation data, however only skinning is supported here
	// Generates map of Skeleton-like objects for use later when generating and binding skeletons.
	parseDeformers() {

		const skeletons = {};
		const morphTargets = {};

		if ( 'Deformer' in fbxTree.Objects ) {

			const DeformerNodes = fbxTree.Objects.Deformer;

			for ( const nodeID in DeformerNodes ) {

				const deformerNode = DeformerNodes[ nodeID ];

				const relationships = connections.get( parseInt( nodeID ) );

				if ( deformerNode.attrType === 'Skin' ) {

					const skeleton = this.parseSkeleton( relationships, DeformerNodes );
					skeleton.ID = nodeID;

					if ( relationships.parents.length > 1 ) console.warn( 'THREE.FBXLoader: skeleton attached to more than one geometry is not supported.' );
					skeleton.geometryID = relationships.parents[ 0 ].ID;

					skeletons[ nodeID ] = skeleton;

				} else if ( deformerNode.attrType === 'BlendShape' ) {

					const morphTarget = {
						id: nodeID,
					};

					morphTarget.rawTargets = this.parseMorphTargets( relationships, DeformerNodes );
					morphTarget.id = nodeID;

					if ( relationships.parents.length > 1 ) console.warn( 'THREE.FBXLoader: morph target attached to more than one geometry is not supported.' );

					morphTargets[ nodeID ] = morphTarget;

				}

			}

		}

		return {

			skeletons: skeletons,
			morphTargets: morphTargets,

		};

	}

	// Parse single nodes in FBXTree.Objects.Deformer
	// The top level skeleton node has type 'Skin' and sub nodes have type 'Cluster'
	// Each skin node represents a skeleton and each cluster node represents a bone
	parseSkeleton( relationships, deformerNodes ) {

		const rawBones = [];

		relationships.children.forEach( function ( child ) {

			const boneNode = deformerNodes[ child.ID ];

			if ( boneNode.attrType !== 'Cluster' ) return;

			const rawBone = {

				ID: child.ID,
				indices: [],
				weights: [],
				transformLink: new Matrix4().fromArray( boneNode.TransformLink.a ),
				// transform: new Matrix4().fromArray( boneNode.Transform.a ),
				// linkMode: boneNode.Mode,

			};

			if ( 'Indexes' in boneNode ) {

				rawBone.indices = boneNode.Indexes.a;
				rawBone.weights = boneNode.Weights.a;

			}

			rawBones.push( rawBone );

		} );

		return {

			rawBones: rawBones,
			bones: []

		};

	}

	// The top level morph deformer node has type "BlendShape" and sub nodes have type "BlendShapeChannel"
	parseMorphTargets( relationships, deformerNodes ) {

		const rawMorphTargets = [];

		for ( let i = 0; i < relationships.children.length; i ++ ) {

			const child = relationships.children[ i ];

			const morphTargetNode = deformerNodes[ child.ID ];

			const rawMorphTarget = {

				name: morphTargetNode.attrName,
				initialWeight: morphTargetNode.DeformPercent,
				id: morphTargetNode.id,
				fullWeights: morphTargetNode.FullWeights.a

			};

			if ( morphTargetNode.attrType !== 'BlendShapeChannel' ) return;

			rawMorphTarget.geoID = connections.get( parseInt( child.ID ) ).children.filter( function ( child ) {

				return child.relationship === undefined;

			} )[ 0 ].ID;

			rawMorphTargets.push( rawMorphTarget );

		}

		return rawMorphTargets;

	}

	// create the main Group() to be returned by the loader
	parseScene( deformers, geometryMap, materialMap ) {

		sceneGraph = new Group();

		const modelMap = this.parseModels( deformers.skeletons, geometryMap, materialMap );

		const modelNodes = fbxTree.Objects.Model;

		const scope = this;
		modelMap.forEach( function ( model ) {

			const modelNode = modelNodes[ model.ID ];
			scope.setLookAtProperties( model, modelNode );

			const parentConnections = connections.get( model.ID ).parents;

			parentConnections.forEach( function ( connection ) {

				const parent = modelMap.get( connection.ID );
				if ( parent !== undefined ) parent.add( model );

			} );

			if ( model.parent === null ) {

				sceneGraph.add( model );

			}


		} );

		this.bindSkeleton( deformers.skeletons, geometryMap, modelMap );

		this.createAmbientLight();

		sceneGraph.traverse( function ( node ) {

			if ( node.userData.transformData ) {

				if ( node.parent ) {

					node.userData.transformData.parentMatrix = node.parent.matrix;
					node.userData.transformData.parentMatrixWorld = node.parent.matrixWorld;

				}

				const transform = generateTransform( node.userData.transformData );

				node.applyMatrix4( transform );
				node.updateWorldMatrix();

			}

		} );

		const animations = new AnimationParser().parse();

		// if all the models where already combined in a single group, just return that
		if ( sceneGraph.children.length === 1 && sceneGraph.children[ 0 ].isGroup ) {

			sceneGraph.children[ 0 ].animations = animations;
			sceneGraph = sceneGraph.children[ 0 ];

		}

		sceneGraph.animations = animations;

	}

	// parse nodes in FBXTree.Objects.Model
	parseModels( skeletons, geometryMap, materialMap ) {

		const modelMap = new Map();
		const modelNodes = fbxTree.Objects.Model;

		for ( const nodeID in modelNodes ) {

			const id = parseInt( nodeID );
			const node = modelNodes[ nodeID ];
			const relationships = connections.get( id );

			let model = this.buildSkeleton( relationships, skeletons, id, node.attrName );

			if ( ! model ) {

				switch ( node.attrType ) {

					case 'Camera':
						model = this.createCamera( relationships );
						break;
					case 'Light':
						model = this.createLight( relationships );
						break;
					case 'Mesh':
						model = this.createMesh( relationships, geometryMap, materialMap );
						break;
					case 'NurbsCurve':
						model = this.createCurve( relationships, geometryMap );
						break;
					case 'LimbNode':
					case 'Root':
						model = new Bone();
						break;
					case 'Null':
					default:
						model = new Group();
						break;

				}

				model.name = node.attrName ? PropertyBinding.sanitizeNodeName( node.attrName ) : '';

				model.ID = id;

			}

			this.getTransformData( model, node );
			modelMap.set( id, model );

		}

		return modelMap;

	}

	buildSkeleton( relationships, skeletons, id, name ) {

		let bone = null;

		relationships.parents.forEach( function ( parent ) {

			for ( const ID in skeletons ) {

				const skeleton = skeletons[ ID ];

				skeleton.rawBones.forEach( function ( rawBone, i ) {

					if ( rawBone.ID === parent.ID ) {

						const subBone = bone;
						bone = new Bone();

						bone.matrixWorld.copy( rawBone.transformLink );

						// set name and id here - otherwise in cases where "subBone" is created it will not have a name / id

						bone.name = name ? PropertyBinding.sanitizeNodeName( name ) : '';
						bone.ID = id;

						skeleton.bones[ i ] = bone;

						// In cases where a bone is shared between multiple meshes
						// duplicate the bone here and and it as a child of the first bone
						if ( subBone !== null ) {

							bone.add( subBone );

						}

					}

				} );

			}

		} );

		return bone;

	}

	// create a PerspectiveCamera or OrthographicCamera
	createCamera( relationships ) {

		let model;
		let cameraAttribute;

		relationships.children.forEach( function ( child ) {

			const attr = fbxTree.Objects.NodeAttribute[ child.ID ];

			if ( attr !== undefined ) {

				cameraAttribute = attr;

			}

		} );

		if ( cameraAttribute === undefined ) {

			model = new Object3D();

		} else {

			let type = 0;
			if ( cameraAttribute.CameraProjectionType !== undefined && cameraAttribute.CameraProjectionType.value === 1 ) {

				type = 1;

			}

			let nearClippingPlane = 1;
			if ( cameraAttribute.NearPlane !== undefined ) {

				nearClippingPlane = cameraAttribute.NearPlane.value / 1000;

			}

			let farClippingPlane = 1000;
			if ( cameraAttribute.FarPlane !== undefined ) {

				farClippingPlane = cameraAttribute.FarPlane.value / 1000;

			}


			let width = window.innerWidth;
			let height = window.innerHeight;

			if ( cameraAttribute.AspectWidth !== undefined && cameraAttribute.AspectHeight !== undefined ) {

				width = cameraAttribute.AspectWidth.value;
				height = cameraAttribute.AspectHeight.value;

			}

			const aspect = width / height;

			let fov = 45;
			if ( cameraAttribute.FieldOfView !== undefined ) {

				fov = cameraAttribute.FieldOfView.value;

			}

			const focalLength = cameraAttribute.FocalLength ? cameraAttribute.FocalLength.value : null;

			switch ( type ) {

				case 0: // Perspective
					model = new PerspectiveCamera( fov, aspect, nearClippingPlane, farClippingPlane );
					if ( focalLength !== null ) model.setFocalLength( focalLength );
					break;

				case 1: // Orthographic
					model = new OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, nearClippingPlane, farClippingPlane );
					break;

				default:
					console.warn( 'THREE.FBXLoader: Unknown camera type ' + type + '.' );
					model = new Object3D();
					break;

			}

		}

		return model;

	}

	// Create a DirectionalLight, PointLight or SpotLight
	createLight( relationships ) {

		let model;
		let lightAttribute;

		relationships.children.forEach( function ( child ) {

			const attr = fbxTree.Objects.NodeAttribute[ child.ID ];

			if ( attr !== undefined ) {

				lightAttribute = attr;

			}

		} );

		if ( lightAttribute === undefined ) {

			model = new Object3D();

		} else {

			let type;

			// LightType can be undefined for Point lights
			if ( lightAttribute.LightType === undefined ) {

				type = 0;

			} else {

				type = lightAttribute.LightType.value;

			}

			let color = 0xffffff;

			if ( lightAttribute.Color !== undefined ) {

				color = new Color().fromArray( lightAttribute.Color.value );

			}

			let intensity = ( lightAttribute.Intensity === undefined ) ? 1 : lightAttribute.Intensity.value / 100;

			// light disabled
			if ( lightAttribute.CastLightOnObject !== undefined && lightAttribute.CastLightOnObject.value === 0 ) {

				intensity = 0;

			}

			let distance = 0;
			if ( lightAttribute.FarAttenuationEnd !== undefined ) {

				if ( lightAttribute.EnableFarAttenuation !== undefined && lightAttribute.EnableFarAttenuation.value === 0 ) {

					distance = 0;

				} else {

					distance = lightAttribute.FarAttenuationEnd.value;

				}

			}

			// TODO: could this be calculated linearly from FarAttenuationStart to FarAttenuationEnd?
			const decay = 1;

			switch ( type ) {

				case 0: // Point
					model = new PointLight( color, intensity, distance, decay );
					break;

				case 1: // Directional
					model = new DirectionalLight( color, intensity );
					break;

				case 2: // Spot
					let angle = Math.PI / 3;

					if ( lightAttribute.InnerAngle !== undefined ) {

						angle = MathUtils.degToRad( lightAttribute.InnerAngle.value );

					}

					let penumbra = 0;
					if ( lightAttribute.OuterAngle !== undefined ) {

						// TODO: this is not correct - FBX calculates outer and inner angle in degrees
						// with OuterAngle > InnerAngle && OuterAngle <= Math.PI
						// while three.js uses a penumbra between (0, 1) to attenuate the inner angle
						penumbra = MathUtils.degToRad( lightAttribute.OuterAngle.value );
						penumbra = Math.max( penumbra, 1 );

					}

					model = new SpotLight( color, intensity, distance, angle, penumbra, decay );
					break;

				default:
					console.warn( 'THREE.FBXLoader: Unknown light type ' + lightAttribute.LightType.value + ', defaulting to a PointLight.' );
					model = new PointLight( color, intensity );
					break;

			}

			if ( lightAttribute.CastShadows !== undefined && lightAttribute.CastShadows.value === 1 ) {

				model.castShadow = true;

			}

		}

		return model;

	}

	createMesh( relationships, geometryMap, materialMap ) {

		let model;
		let geometry = null;
		let material = null;
		const materials = [];

		// get geometry and materials(s) from connections
		relationships.children.forEach( function ( child ) {

			if ( geometryMap.has( child.ID ) ) {

				geometry = geometryMap.get( child.ID );

			}

			if ( materialMap.has( child.ID ) ) {

				materials.push( materialMap.get( child.ID ) );

			}

		} );

		if ( materials.length > 1 ) {

			material = materials;

		} else if ( materials.length > 0 ) {

			material = materials[ 0 ];

		} else {

			material = new MeshPhongMaterial( { color: 0xcccccc } );
			materials.push( material );

		}

		if ( 'color' in geometry.attributes ) {

			materials.forEach( function ( material ) {

				material.vertexColors = true;

			} );

		}

		if ( geometry.FBX_Deformer ) {

			model = new SkinnedMesh( geometry, material );
			model.normalizeSkinWeights();

		} else {

			model = new Mesh( geometry, material );

		}

		return model;

	}

	createCurve( relationships, geometryMap ) {

		const geometry = relationships.children.reduce( function ( geo, child ) {

			if ( geometryMap.has( child.ID ) ) geo = geometryMap.get( child.ID );

			return geo;

		}, null );

		// FBX does not list materials for Nurbs lines, so we'll just put our own in here.
		const material = new LineBasicMaterial( { color: 0x3300ff, linewidth: 1 } );
		return new Line( geometry, material );

	}

	// parse the model node for transform data
	getTransformData( model, modelNode ) {

		const transformData = {};

		if ( 'InheritType' in modelNode ) transformData.inheritType = parseInt( modelNode.InheritType.value );

		if ( 'RotationOrder' in modelNode ) transformData.eulerOrder = getEulerOrder( modelNode.RotationOrder.value );
		else transformData.eulerOrder = 'ZYX';

		if ( 'Lcl_Translation' in modelNode ) transformData.translation = modelNode.Lcl_Translation.value;

		if ( 'PreRotation' in modelNode ) transformData.preRotation = modelNode.PreRotation.value;
		if ( 'Lcl_Rotation' in modelNode ) transformData.rotation = modelNode.Lcl_Rotation.value;
		if ( 'PostRotation' in modelNode ) transformData.postRotation = modelNode.PostRotation.value;

		if ( 'Lcl_Scaling' in modelNode ) transformData.scale = modelNode.Lcl_Scaling.value;

		if ( 'ScalingOffset' in modelNode ) transformData.scalingOffset = modelNode.ScalingOffset.value;
		if ( 'ScalingPivot' in modelNode ) transformData.scalingPivot = modelNode.ScalingPivot.value;

		if ( 'RotationOffset' in modelNode ) transformData.rotationOffset = modelNode.RotationOffset.value;
		if ( 'RotationPivot' in modelNode ) transformData.rotationPivot = modelNode.RotationPivot.value;

		model.userData.transformData = transformData;

	}

	setLookAtProperties( model, modelNode ) {

		if ( 'LookAtProperty' in modelNode ) {

			const children = connections.get( model.ID ).children;

			children.forEach( function ( child ) {

				if ( child.relationship === 'LookAtProperty' ) {

					const lookAtTarget = fbxTree.Objects.Model[ child.ID ];

					if ( 'Lcl_Translation' in lookAtTarget ) {

						const pos = lookAtTarget.Lcl_Translation.value;

						// DirectionalLight, SpotLight
						if ( model.target !== undefined ) {

							model.target.position.fromArray( pos );
							sceneGraph.add( model.target );

						} else { // Cameras and other Object3Ds

							model.lookAt( new Vector3().fromArray( pos ) );

						}

					}

				}

			} );

		}

	}

	bindSkeleton( skeletons, geometryMap, modelMap ) {

		const bindMatrices = this.parsePoseNodes();

		for ( const ID in skeletons ) {

			const skeleton = skeletons[ ID ];

			const parents = connections.get( parseInt( skeleton.ID ) ).parents;

			parents.forEach( function ( parent ) {

				if ( geometryMap.has( parent.ID ) ) {

					const geoID = parent.ID;
					const geoRelationships = connections.get( geoID );

					geoRelationships.parents.forEach( function ( geoConnParent ) {

						if ( modelMap.has( geoConnParent.ID ) ) {

							const model = modelMap.get( geoConnParent.ID );

							model.bind( new Skeleton( skeleton.bones ), bindMatrices[ geoConnParent.ID ] );

						}

					} );

				}

			} );

		}

	}

	parsePoseNodes() {

		const bindMatrices = {};

		if ( 'Pose' in fbxTree.Objects ) {

			const BindPoseNode = fbxTree.Objects.Pose;

			for ( const nodeID in BindPoseNode ) {

				if ( BindPoseNode[ nodeID ].attrType === 'BindPose' && BindPoseNode[ nodeID ].NbPoseNodes > 0 ) {

					const poseNodes = BindPoseNode[ nodeID ].PoseNode;

					if ( Array.isArray( poseNodes ) ) {

						poseNodes.forEach( function ( poseNode ) {

							bindMatrices[ poseNode.Node ] = new Matrix4().fromArray( poseNode.Matrix.a );

						} );

					} else {

						bindMatrices[ poseNodes.Node ] = new Matrix4().fromArray( poseNodes.Matrix.a );

					}

				}

			}

		}

		return bindMatrices;

	}

	// Parse ambient color in FBXTree.GlobalSettings - if it's not set to black (default), create an ambient light
	createAmbientLight() {

		if ( 'GlobalSettings' in fbxTree && 'AmbientColor' in fbxTree.GlobalSettings ) {

			const ambientColor = fbxTree.GlobalSettings.AmbientColor.value;
			const r = ambientColor[ 0 ];
			const g = ambientColor[ 1 ];
			const b = ambientColor[ 2 ];

			if ( r !== 0 || g !== 0 || b !== 0 ) {

				const color = new Color( r, g, b );
				sceneGraph.add( new AmbientLight( color, 1 ) );

			}

		}

	}

}

// parse Geometry data from FBXTree and return map of BufferGeometries
class GeometryParser {

	constructor() {

		this.negativeMaterialIndices = false;

	}

	// Parse nodes in FBXTree.Objects.Geometry
	parse( deformers ) {

		const geometryMap = new Map();

		if ( 'Geometry' in fbxTree.Objects ) {

			const geoNodes = fbxTree.Objects.Geometry;

			for ( const nodeID in geoNodes ) {

				const relationships = connections.get( parseInt( nodeID ) );
				const geo = this.parseGeometry( relationships, geoNodes[ nodeID ], deformers );

				geometryMap.set( parseInt( nodeID ), geo );

			}

		}

		// report warnings

		if ( this.negativeMaterialIndices === true ) {

			console.warn( 'THREE.FBXLoader: The FBX file contains invalid (negative) material indices. The asset might not render as expected.' );

		}

		return geometryMap;

	}

	// Parse single node in FBXTree.Objects.Geometry
	parseGeometry( relationships, geoNode, deformers ) {

		switch ( geoNode.attrType ) {

			case 'Mesh':
				return this.parseMeshGeometry( relationships, geoNode, deformers );

			case 'NurbsCurve':
				return this.parseNurbsGeometry( geoNode );

		}

	}

	// Parse single node mesh geometry in FBXTree.Objects.Geometry
	parseMeshGeometry( relationships, geoNode, deformers ) {

		const skeletons = deformers.skeletons;
		const morphTargets = [];

		const modelNodes = relationships.parents.map( function ( parent ) {

			return fbxTree.Objects.Model[ parent.ID ];

		} );

		// don't create geometry if it is not associated with any models
		if ( modelNodes.length === 0 ) return;

		const skeleton = relationships.children.reduce( function ( skeleton, child ) {

			if ( skeletons[ child.ID ] !== undefined ) skeleton = skeletons[ child.ID ];

			return skeleton;

		}, null );

		relationships.children.forEach( function ( child ) {

			if ( deformers.morphTargets[ child.ID ] !== undefined ) {

				morphTargets.push( deformers.morphTargets[ child.ID ] );

			}

		} );

		// Assume one model and get the preRotation from that
		// if there is more than one model associated with the geometry this may cause problems
		const modelNode = modelNodes[ 0 ];

		const transformData = {};

		if ( 'RotationOrder' in modelNode ) transformData.eulerOrder = getEulerOrder( modelNode.RotationOrder.value );
		if ( 'InheritType' in modelNode ) transformData.inheritType = parseInt( modelNode.InheritType.value );

		if ( 'GeometricTranslation' in modelNode ) transformData.translation = modelNode.GeometricTranslation.value;
		if ( 'GeometricRotation' in modelNode ) transformData.rotation = modelNode.GeometricRotation.value;
		if ( 'GeometricScaling' in modelNode ) transformData.scale = modelNode.GeometricScaling.value;

		const transform = generateTransform( transformData );

		return this.genGeometry( geoNode, skeleton, morphTargets, transform );

	}

	// Generate a BufferGeometry from a node in FBXTree.Objects.Geometry
	genGeometry( geoNode, skeleton, morphTargets, preTransform ) {

		const geo = new BufferGeometry();
		if ( geoNode.attrName ) geo.name = geoNode.attrName;

		const geoInfo = this.parseGeoNode( geoNode, skeleton );
		const buffers = this.genBuffers( geoInfo );

		const positionAttribute = new Float32BufferAttribute( buffers.vertex, 3 );

		positionAttribute.applyMatrix4( preTransform );

		geo.setAttribute( 'position', positionAttribute );

		if ( buffers.colors.length > 0 ) {

			geo.setAttribute( 'color', new Float32BufferAttribute( buffers.colors, 3 ) );

		}

		if ( skeleton ) {

			geo.setAttribute( 'skinIndex', new Uint16BufferAttribute( buffers.weightsIndices, 4 ) );

			geo.setAttribute( 'skinWeight', new Float32BufferAttribute( buffers.vertexWeights, 4 ) );

			// used later to bind the skeleton to the model
			geo.FBX_Deformer = skeleton;

		}

		if ( buffers.normal.length > 0 ) {

			const normalMatrix = new Matrix3().getNormalMatrix( preTransform );

			const normalAttribute = new Float32BufferAttribute( buffers.normal, 3 );
			normalAttribute.applyNormalMatrix( normalMatrix );

			geo.setAttribute( 'normal', normalAttribute );

		}

		buffers.uvs.forEach( function ( uvBuffer, i ) {

			// subsequent uv buffers are called 'uv1', 'uv2', ...
			let name = 'uv' + ( i + 1 ).toString();

			// the first uv buffer is just called 'uv'
			if ( i === 0 ) {

				name = 'uv';

			}

			geo.setAttribute( name, new Float32BufferAttribute( buffers.uvs[ i ], 2 ) );

		} );

		if ( geoInfo.material && geoInfo.material.mappingType !== 'AllSame' ) {

			// Convert the material indices of each vertex into rendering groups on the geometry.
			let prevMaterialIndex = buffers.materialIndex[ 0 ];
			let startIndex = 0;

			buffers.materialIndex.forEach( function ( currentIndex, i ) {

				if ( currentIndex !== prevMaterialIndex ) {

					geo.addGroup( startIndex, i - startIndex, prevMaterialIndex );

					prevMaterialIndex = currentIndex;
					startIndex = i;

				}

			} );

			// the loop above doesn't add the last group, do that here.
			if ( geo.groups.length > 0 ) {

				const lastGroup = geo.groups[ geo.groups.length - 1 ];
				const lastIndex = lastGroup.start + lastGroup.count;

				if ( lastIndex !== buffers.materialIndex.length ) {

					geo.addGroup( lastIndex, buffers.materialIndex.length - lastIndex, prevMaterialIndex );

				}

			}

			// case where there are multiple materials but the whole geometry is only
			// using one of them
			if ( geo.groups.length === 0 ) {

				geo.addGroup( 0, buffers.materialIndex.length, buffers.materialIndex[ 0 ] );

			}

		}

		this.addMorphTargets( geo, geoNode, morphTargets, preTransform );

		return geo;

	}

	parseGeoNode( geoNode, skeleton ) {

		const geoInfo = {};

		geoInfo.vertexPositions = ( geoNode.Vertices !== undefined ) ? geoNode.Vertices.a : [];
		geoInfo.vertexIndices = ( geoNode.PolygonVertexIndex !== undefined ) ? geoNode.PolygonVertexIndex.a : [];

		if ( geoNode.LayerElementColor ) {

			geoInfo.color = this.parseVertexColors( geoNode.LayerElementColor[ 0 ] );

		}

		if ( geoNode.LayerElementMaterial ) {

			geoInfo.material = this.parseMaterialIndices( geoNode.LayerElementMaterial[ 0 ] );

		}

		if ( geoNode.LayerElementNormal ) {

			geoInfo.normal = this.parseNormals( geoNode.LayerElementNormal[ 0 ] );

		}

		if ( geoNode.LayerElementUV ) {

			geoInfo.uv = [];

			let i = 0;
			while ( geoNode.LayerElementUV[ i ] ) {

				if ( geoNode.LayerElementUV[ i ].UV ) {

					geoInfo.uv.push( this.parseUVs( geoNode.LayerElementUV[ i ] ) );

				}

				i ++;

			}

		}

		geoInfo.weightTable = {};

		if ( skeleton !== null ) {

			geoInfo.skeleton = skeleton;

			skeleton.rawBones.forEach( function ( rawBone, i ) {

				// loop over the bone's vertex indices and weights
				rawBone.indices.forEach( function ( index, j ) {

					if ( geoInfo.weightTable[ index ] === undefined ) geoInfo.weightTable[ index ] = [];

					geoInfo.weightTable[ index ].push( {

						id: i,
						weight: rawBone.weights[ j ],

					} );

				} );

			} );

		}

		return geoInfo;

	}

	genBuffers( geoInfo ) {

		const buffers = {
			vertex: [],
			normal: [],
			colors: [],
			uvs: [],
			materialIndex: [],
			vertexWeights: [],
			weightsIndices: [],
		};

		let polygonIndex = 0;
		let faceLength = 0;
		let displayedWeightsWarning = false;

		// these will hold data for a single face
		let facePositionIndexes = [];
		let faceNormals = [];
		let faceColors = [];
		let faceUVs = [];
		let faceWeights = [];
		let faceWeightIndices = [];

		const scope = this;
		geoInfo.vertexIndices.forEach( function ( vertexIndex, polygonVertexIndex ) {

			let materialIndex;
			let endOfFace = false;

			// Face index and vertex index arrays are combined in a single array
			// A cube with quad faces looks like this:
			// PolygonVertexIndex: *24 {
			//  a: 0, 1, 3, -3, 2, 3, 5, -5, 4, 5, 7, -7, 6, 7, 1, -1, 1, 7, 5, -4, 6, 0, 2, -5
			//  }
			// Negative numbers mark the end of a face - first face here is 0, 1, 3, -3
			// to find index of last vertex bit shift the index: ^ - 1
			if ( vertexIndex < 0 ) {

				vertexIndex = vertexIndex ^ - 1; // equivalent to ( x * -1 ) - 1
				endOfFace = true;

			}

			let weightIndices = [];
			let weights = [];

			facePositionIndexes.push( vertexIndex * 3, vertexIndex * 3 + 1, vertexIndex * 3 + 2 );

			if ( geoInfo.color ) {

				const data = getData( polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.color );

				faceColors.push( data[ 0 ], data[ 1 ], data[ 2 ] );

			}

			if ( geoInfo.skeleton ) {

				if ( geoInfo.weightTable[ vertexIndex ] !== undefined ) {

					geoInfo.weightTable[ vertexIndex ].forEach( function ( wt ) {

						weights.push( wt.weight );
						weightIndices.push( wt.id );

					} );


				}

				if ( weights.length > 4 ) {

					if ( ! displayedWeightsWarning ) {

						console.warn( 'THREE.FBXLoader: Vertex has more than 4 skinning weights assigned to vertex. Deleting additional weights.' );
						displayedWeightsWarning = true;

					}

					const wIndex = [ 0, 0, 0, 0 ];
					const Weight = [ 0, 0, 0, 0 ];

					weights.forEach( function ( weight, weightIndex ) {

						let currentWeight = weight;
						let currentIndex = weightIndices[ weightIndex ];

						Weight.forEach( function ( comparedWeight, comparedWeightIndex, comparedWeightArray ) {

							if ( currentWeight > comparedWeight ) {

								comparedWeightArray[ comparedWeightIndex ] = currentWeight;
								currentWeight = comparedWeight;

								const tmp = wIndex[ comparedWeightIndex ];
								wIndex[ comparedWeightIndex ] = currentIndex;
								currentIndex = tmp;

							}

						} );

					} );

					weightIndices = wIndex;
					weights = Weight;

				}

				// if the weight array is shorter than 4 pad with 0s
				while ( weights.length < 4 ) {

					weights.push( 0 );
					weightIndices.push( 0 );

				}

				for ( let i = 0; i < 4; ++ i ) {

					faceWeights.push( weights[ i ] );
					faceWeightIndices.push( weightIndices[ i ] );

				}

			}

			if ( geoInfo.normal ) {

				const data = getData( polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.normal );

				faceNormals.push( data[ 0 ], data[ 1 ], data[ 2 ] );

			}

			if ( geoInfo.material && geoInfo.material.mappingType !== 'AllSame' ) {

				materialIndex = getData( polygonVertexIndex, polygonIndex, vertexIndex, geoInfo.material )[ 0 ];

				if ( materialIndex < 0 ) {

					scope.negativeMaterialIndices = true;
					materialIndex = 0; // fallback

				}

			}

			if ( geoInfo.uv ) {

				geoInfo.uv.forEach( function ( uv, i ) {

					const data = getData( polygonVertexIndex, polygonIndex, vertexIndex, uv );

					if ( faceUVs[ i ] === undefined ) {

						faceUVs[ i ] = [];

					}

					faceUVs[ i ].push( data[ 0 ] );
					faceUVs[ i ].push( data[ 1 ] );

				} );

			}

			faceLength ++;

			if ( endOfFace ) {

				scope.genFace( buffers, geoInfo, facePositionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength );

				polygonIndex ++;
				faceLength = 0;

				// reset arrays for the next face
				facePositionIndexes = [];
				faceNormals = [];
				faceColors = [];
				faceUVs = [];
				faceWeights = [];
				faceWeightIndices = [];

			}

		} );

		return buffers;

	}

	// Generate data for a single face in a geometry. If the face is a quad then split it into 2 tris
	genFace( buffers, geoInfo, facePositionIndexes, materialIndex, faceNormals, faceColors, faceUVs, faceWeights, faceWeightIndices, faceLength ) {

		for ( let i = 2; i < faceLength; i ++ ) {

			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ 0 ] ] );
			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ 1 ] ] );
			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ 2 ] ] );

			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ ( i - 1 ) * 3 ] ] );
			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ ( i - 1 ) * 3 + 1 ] ] );
			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ ( i - 1 ) * 3 + 2 ] ] );

			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ i * 3 ] ] );
			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ i * 3 + 1 ] ] );
			buffers.vertex.push( geoInfo.vertexPositions[ facePositionIndexes[ i * 3 + 2 ] ] );

			if ( geoInfo.skeleton ) {

				buffers.vertexWeights.push( faceWeights[ 0 ] );
				buffers.vertexWeights.push( faceWeights[ 1 ] );
				buffers.vertexWeights.push( faceWeights[ 2 ] );
				buffers.vertexWeights.push( faceWeights[ 3 ] );

				buffers.vertexWeights.push( faceWeights[ ( i - 1 ) * 4 ] );
				buffers.vertexWeights.push( faceWeights[ ( i - 1 ) * 4 + 1 ] );
				buffers.vertexWeights.push( faceWeights[ ( i - 1 ) * 4 + 2 ] );
				buffers.vertexWeights.push( faceWeights[ ( i - 1 ) * 4 + 3 ] );

				buffers.vertexWeights.push( faceWeights[ i * 4 ] );
				buffers.vertexWeights.push( faceWeights[ i * 4 + 1 ] );
				buffers.vertexWeights.push( faceWeights[ i * 4 + 2 ] );
				buffers.vertexWeights.push( faceWeights[ i * 4 + 3 ] );

				buffers.weightsIndices.push( faceWeightIndices[ 0 ] );
				buffers.weightsIndices.push( faceWeightIndices[ 1 ] );
				buffers.weightsIndices.push( faceWeightIndices[ 2 ] );
				buffers.weightsIndices.push( faceWeightIndices[ 3 ] );

				buffers.weightsIndices.push( faceWeightIndices[ ( i - 1 ) * 4 ] );
				buffers.weightsIndices.push( faceWeightIndices[ ( i - 1 ) * 4 + 1 ] );
				buffers.weightsIndices.push( faceWeightIndices[ ( i - 1 ) * 4 + 2 ] );
				buffers.weightsIndices.push( faceWeightIndices[ ( i - 1 ) * 4 + 3 ] );

				buffers.weightsIndices.push( faceWeightIndices[ i * 4 ] );
				buffers.weightsIndices.push( faceWeightIndices[ i * 4 + 1 ] );
				buffers.weightsIndices.push( faceWeightIndices[ i * 4 + 2 ] );
				buffers.weightsIndices.push( faceWeightIndices[ i * 4 + 3 ] );

			}

			if ( geoInfo.color ) {

				buffers.colors.push( faceColors[ 0 ] );
				buffers.colors.push( faceColors[ 1 ] );
				buffers.colors.push( faceColors[ 2 ] );

				buffers.colors.push( faceColors[ ( i - 1 ) * 3 ] );
				buffers.colors.push( faceColors[ ( i - 1 ) * 3 + 1 ] );
				buffers.colors.push( faceColors[ ( i - 1 ) * 3 + 2 ] );

				buffers.colors.push( faceColors[ i * 3 ] );
				buffers.colors.push( faceColors[ i * 3 + 1 ] );
				buffers.colors.push( faceColors[ i * 3 + 2 ] );

			}

			if ( geoInfo.material && geoInfo.material.mappingType !== 'AllSame' ) {

				buffers.materialIndex.push( materialIndex );
				buffers.materialIndex.push( materialIndex );
				buffers.materialIndex.push( materialIndex );

			}

			if ( geoInfo.normal ) {

				buffers.normal.push( faceNormals[ 0 ] );
				buffers.normal.push( faceNormals[ 1 ] );
				buffers.normal.push( faceNormals[ 2 ] );

				buffers.normal.push( faceNormals[ ( i - 1 ) * 3 ] );
				buffers.normal.push( faceNormals[ ( i - 1 ) * 3 + 1 ] );
				buffers.normal.push( faceNormals[ ( i - 1 ) * 3 + 2 ] );

				buffers.normal.push( faceNormals[ i * 3 ] );
				buffers.normal.push( faceNormals[ i * 3 + 1 ] );
				buffers.normal.push( faceNormals[ i * 3 + 2 ] );

			}

			if ( geoInfo.uv ) {

				geoInfo.uv.forEach( function ( uv, j ) {

					if ( buffers.uvs[ j ] === undefined ) buffers.uvs[ j ] = [];

					buffers.uvs[ j ].push( faceUVs[ j ][ 0 ] );
					buffers.uvs[ j ].push( faceUVs[ j ][ 1 ] );

					buffers.uvs[ j ].push( faceUVs[ j ][ ( i - 1 ) * 2 ] );
					buffers.uvs[ j ].push( faceUVs[ j ][ ( i - 1 ) * 2 + 1 ] );

					buffers.uvs[ j ].push( faceUVs[ j ][ i * 2 ] );
					buffers.uvs[ j ].push( faceUVs[ j ][ i * 2 + 1 ] );

				} );

			}

		}

	}

	addMorphTargets( parentGeo, parentGeoNode, morphTargets, preTransform ) {

		if ( morphTargets.length === 0 ) return;

		parentGeo.morphTargetsRelative = true;

		parentGeo.morphAttributes.position = [];
		// parentGeo.morphAttributes.normal = []; // not implemented

		const scope = this;
		morphTargets.forEach( function ( morphTarget ) {

			morphTarget.rawTargets.forEach( function ( rawTarget ) {

				const morphGeoNode = fbxTree.Objects.Geometry[ rawTarget.geoID ];

				if ( morphGeoNode !== undefined ) {

					scope.genMorphGeometry( parentGeo, parentGeoNode, morphGeoNode, preTransform, rawTarget.name );

				}

			} );

		} );

	}

	// a morph geometry node is similar to a standard  node, and the node is also contained
	// in FBXTree.Objects.Geometry, however it can only have attributes for position, normal
	// and a special attribute Index defining which vertices of the original geometry are affected
	// Normal and position attributes only have data for the vertices that are affected by the morph
	genMorphGeometry( parentGeo, parentGeoNode, morphGeoNode, preTransform, name ) {

		const vertexIndices = ( parentGeoNode.PolygonVertexIndex !== undefined ) ? parentGeoNode.PolygonVertexIndex.a : [];

		const morphPositionsSparse = ( morphGeoNode.Vertices !== undefined ) ? morphGeoNode.Vertices.a : [];
		const indices = ( morphGeoNode.Indexes !== undefined ) ? morphGeoNode.Indexes.a : [];

		const length = parentGeo.attributes.position.count * 3;
		const morphPositions = new Float32Array( length );

		for ( let i = 0; i < indices.length; i ++ ) {

			const morphIndex = indices[ i ] * 3;

			morphPositions[ morphIndex ] = morphPositionsSparse[ i * 3 ];
			morphPositions[ morphIndex + 1 ] = morphPositionsSparse[ i * 3 + 1 ];
			morphPositions[ morphIndex + 2 ] = morphPositionsSparse[ i * 3 + 2 ];

		}

		// TODO: add morph normal support
		const morphGeoInfo = {
			vertexIndices: vertexIndices,
			vertexPositions: morphPositions,

		};

		const morphBuffers = this.genBuffers( morphGeoInfo );

		const positionAttribute = new Float32BufferAttribute( morphBuffers.vertex, 3 );
		positionAttribute.name = name || morphGeoNode.attrName;

		positionAttribute.applyMatrix4( preTransform );

		parentGeo.morphAttributes.position.push( positionAttribute );

	}

	// Parse normal from FBXTree.Objects.Geometry.LayerElementNormal if it exists
	parseNormals( NormalNode ) {

		const mappingType = NormalNode.MappingInformationType;
		const referenceType = NormalNode.ReferenceInformationType;
		const buffer = NormalNode.Normals.a;
		let indexBuffer = [];
		if ( referenceType === 'IndexToDirect' ) {

			if ( 'NormalIndex' in NormalNode ) {

				indexBuffer = NormalNode.NormalIndex.a;

			} else if ( 'NormalsIndex' in NormalNode ) {

				indexBuffer = NormalNode.NormalsIndex.a;

			}

		}

		return {
			dataSize: 3,
			buffer: buffer,
			indices: indexBuffer,
			mappingType: mappingType,
			referenceType: referenceType
		};

	}

	// Parse UVs from FBXTree.Objects.Geometry.LayerElementUV if it exists
	parseUVs( UVNode ) {

		const mappingType = UVNode.MappingInformationType;
		const referenceType = UVNode.ReferenceInformationType;
		const buffer = UVNode.UV.a;
		let indexBuffer = [];
		if ( referenceType === 'IndexToDirect' ) {

			indexBuffer = UVNode.UVIndex.a;

		}

		return {
			dataSize: 2,
			buffer: buffer,
			indices: indexBuffer,
			mappingType: mappingType,
			referenceType: referenceType
		};

	}

	// Parse Vertex Colors from FBXTree.Objects.Geometry.LayerElementColor if it exists
	parseVertexColors( ColorNode ) {

		const mappingType = ColorNode.MappingInformationType;
		const referenceType = ColorNode.ReferenceInformationType;
		const buffer = ColorNode.Colors.a;
		let indexBuffer = [];
		if ( referenceType === 'IndexToDirect' ) {

			indexBuffer = ColorNode.ColorIndex.a;

		}

		return {
			dataSize: 4,
			buffer: buffer,
			indices: indexBuffer,
			mappingType: mappingType,
			referenceType: referenceType
		};

	}

	// Parse mapping and material data in FBXTree.Objects.Geometry.LayerElementMaterial if it exists
	parseMaterialIndices( MaterialNode ) {

		const mappingType = MaterialNode.MappingInformationType;
		const referenceType = MaterialNode.ReferenceInformationType;

		if ( mappingType === 'NoMappingInformation' ) {

			return {
				dataSize: 1,
				buffer: [ 0 ],
				indices: [ 0 ],
				mappingType: 'AllSame',
				referenceType: referenceType
			};

		}

		const materialIndexBuffer = MaterialNode.Materials.a;

		// Since materials are stored as indices, there's a bit of a mismatch between FBX and what
		// we expect.So we create an intermediate buffer that points to the index in the buffer,
		// for conforming with the other functions we've written for other data.
		const materialIndices = [];

		for ( let i = 0; i < materialIndexBuffer.length; ++ i ) {

			materialIndices.push( i );

		}

		return {
			dataSize: 1,
			buffer: materialIndexBuffer,
			indices: materialIndices,
			mappingType: mappingType,
			referenceType: referenceType
		};

	}

	// Generate a NurbGeometry from a node in FBXTree.Objects.Geometry
	parseNurbsGeometry( geoNode ) {

		if ( NURBSCurve === undefined ) {

			console.error( 'THREE.FBXLoader: The loader relies on NURBSCurve for any nurbs present in the model. Nurbs will show up as empty geometry.' );
			return new BufferGeometry();

		}

		const order = parseInt( geoNode.Order );

		if ( isNaN( order ) ) {

			console.error( 'THREE.FBXLoader: Invalid Order %s given for geometry ID: %s', geoNode.Order, geoNode.id );
			return new BufferGeometry();

		}

		const degree = order - 1;

		const knots = geoNode.KnotVector.a;
		const controlPoints = [];
		const pointsValues = geoNode.Points.a;

		for ( let i = 0, l = pointsValues.length; i < l; i += 4 ) {

			controlPoints.push( new Vector4().fromArray( pointsValues, i ) );

		}

		let startKnot, endKnot;

		if ( geoNode.Form === 'Closed' ) {

			controlPoints.push( controlPoints[ 0 ] );

		} else if ( geoNode.Form === 'Periodic' ) {

			startKnot = degree;
			endKnot = knots.length - 1 - startKnot;

			for ( let i = 0; i < degree; ++ i ) {

				controlPoints.push( controlPoints[ i ] );

			}

		}

		const curve = new NURBSCurve( degree, knots, controlPoints, startKnot, endKnot );
		const points = curve.getPoints( controlPoints.length * 12 );

		return new BufferGeometry().setFromPoints( points );

	}

}

// parse animation data from FBXTree
class AnimationParser {

	// take raw animation clips and turn them into three.js animation clips
	parse() {

		const animationClips = [];

		const rawClips = this.parseClips();

		if ( rawClips !== undefined ) {

			for ( const key in rawClips ) {

				const rawClip = rawClips[ key ];

				const clip = this.addClip( rawClip );

				animationClips.push( clip );

			}

		}

		return animationClips;

	}

	parseClips() {

		// since the actual transformation data is stored in FBXTree.Objects.AnimationCurve,
		// if this is undefined we can safely assume there are no animations
		if ( fbxTree.Objects.AnimationCurve === undefined ) return undefined;

		const curveNodesMap = this.parseAnimationCurveNodes();

		this.parseAnimationCurves( curveNodesMap );

		const layersMap = this.parseAnimationLayers( curveNodesMap );
		const rawClips = this.parseAnimStacks( layersMap );

		return rawClips;

	}

	// parse nodes in FBXTree.Objects.AnimationCurveNode
	// each AnimationCurveNode holds data for an animation transform for a model (e.g. left arm rotation )
	// and is referenced by an AnimationLayer
	parseAnimationCurveNodes() {

		const rawCurveNodes = fbxTree.Objects.AnimationCurveNode;

		const curveNodesMap = new Map();

		for ( const nodeID in rawCurveNodes ) {

			const rawCurveNode = rawCurveNodes[ nodeID ];

			if ( rawCurveNode.attrName.match( /S|R|T|DeformPercent/ ) !== null ) {

				const curveNode = {

					id: rawCurveNode.id,
					attr: rawCurveNode.attrName,
					curves: {},

				};

				curveNodesMap.set( curveNode.id, curveNode );

			}

		}

		return curveNodesMap;

	}

	// parse nodes in FBXTree.Objects.AnimationCurve and connect them up to
	// previously parsed AnimationCurveNodes. Each AnimationCurve holds data for a single animated
	// axis ( e.g. times and values of x rotation)
	parseAnimationCurves( curveNodesMap ) {

		const rawCurves = fbxTree.Objects.AnimationCurve;

		// TODO: Many values are identical up to roundoff error, but won't be optimised
		// e.g. position times: [0, 0.4, 0. 8]
		// position values: [7.23538335023477e-7, 93.67518615722656, -0.9982695579528809, 7.23538335023477e-7, 93.67518615722656, -0.9982695579528809, 7.235384487103147e-7, 93.67520904541016, -0.9982695579528809]
		// clearly, this should be optimised to
		// times: [0], positions [7.23538335023477e-7, 93.67518615722656, -0.9982695579528809]
		// this shows up in nearly every FBX file, and generally time array is length > 100

		for ( const nodeID in rawCurves ) {

			const animationCurve = {

				id: rawCurves[ nodeID ].id,
				times: rawCurves[ nodeID ].KeyTime.a.map( convertFBXTimeToSeconds ),
				values: rawCurves[ nodeID ].KeyValueFloat.a,

			};

			const relationships = connections.get( animationCurve.id );

			if ( relationships !== undefined ) {

				const animationCurveID = relationships.parents[ 0 ].ID;
				const animationCurveRelationship = relationships.parents[ 0 ].relationship;

				if ( animationCurveRelationship.match( /X/ ) ) {

					curveNodesMap.get( animationCurveID ).curves[ 'x' ] = animationCurve;

				} else if ( animationCurveRelationship.match( /Y/ ) ) {

					curveNodesMap.get( animationCurveID ).curves[ 'y' ] = animationCurve;

				} else if ( animationCurveRelationship.match( /Z/ ) ) {

					curveNodesMap.get( animationCurveID ).curves[ 'z' ] = animationCurve;

				} else if ( animationCurveRelationship.match( /d|DeformPercent/ ) && curveNodesMap.has( animationCurveID ) ) {

					curveNodesMap.get( animationCurveID ).curves[ 'morph' ] = animationCurve;

				}

			}

		}

	}

	// parse nodes in FBXTree.Objects.AnimationLayer. Each layers holds references
	// to various AnimationCurveNodes and is referenced by an AnimationStack node
	// note: theoretically a stack can have multiple layers, however in practice there always seems to be one per stack
	parseAnimationLayers( curveNodesMap ) {

		const rawLayers = fbxTree.Objects.AnimationLayer;

		const layersMap = new Map();

		for ( const nodeID in rawLayers ) {

			const layerCurveNodes = [];

			const connection = connections.get( parseInt( nodeID ) );

			if ( connection !== undefined ) {

				// all the animationCurveNodes used in the layer
				const children = connection.children;

				children.forEach( function ( child, i ) {

					if ( curveNodesMap.has( child.ID ) ) {

						const curveNode = curveNodesMap.get( child.ID );

						// check that the curves are defined for at least one axis, otherwise ignore the curveNode
						if ( curveNode.curves.x !== undefined || curveNode.curves.y !== undefined || curveNode.curves.z !== undefined ) {

							if ( layerCurveNodes[ i ] === undefined ) {

								const modelID = connections.get( child.ID ).parents.filter( function ( parent ) {

									return parent.relationship !== undefined;

								} )[ 0 ].ID;

								if ( modelID !== undefined ) {

									const rawModel = fbxTree.Objects.Model[ modelID.toString() ];

									if ( rawModel === undefined ) {

										console.warn( 'THREE.FBXLoader: Encountered a unused curve.', child );
										return;

									}

									const node = {

										modelName: rawModel.attrName ? PropertyBinding.sanitizeNodeName( rawModel.attrName ) : '',
										ID: rawModel.id,
										initialPosition: [ 0, 0, 0 ],
										initialRotation: [ 0, 0, 0 ],
										initialScale: [ 1, 1, 1 ],

									};

									sceneGraph.traverse( function ( child ) {

										if ( child.ID === rawModel.id ) {

											node.transform = child.matrix;

											if ( child.userData.transformData ) node.eulerOrder = child.userData.transformData.eulerOrder;

										}

									} );

									if ( ! node.transform ) node.transform = new Matrix4();

									// if the animated model is pre rotated, we'll have to apply the pre rotations to every
									// animation value as well
									if ( 'PreRotation' in rawModel ) node.preRotation = rawModel.PreRotation.value;
									if ( 'PostRotation' in rawModel ) node.postRotation = rawModel.PostRotation.value;

									layerCurveNodes[ i ] = node;

								}

							}

							if ( layerCurveNodes[ i ] ) layerCurveNodes[ i ][ curveNode.attr ] = curveNode;

						} else if ( curveNode.curves.morph !== undefined ) {

							if ( layerCurveNodes[ i ] === undefined ) {

								const deformerID = connections.get( child.ID ).parents.filter( function ( parent ) {

									return parent.relationship !== undefined;

								} )[ 0 ].ID;

								const morpherID = connections.get( deformerID ).parents[ 0 ].ID;
								const geoID = connections.get( morpherID ).parents[ 0 ].ID;

								// assuming geometry is not used in more than one model
								const modelID = connections.get( geoID ).parents[ 0 ].ID;

								const rawModel = fbxTree.Objects.Model[ modelID ];

								const node = {

									modelName: rawModel.attrName ? PropertyBinding.sanitizeNodeName( rawModel.attrName ) : '',
									morphName: fbxTree.Objects.Deformer[ deformerID ].attrName,

								};

								layerCurveNodes[ i ] = node;

							}

							layerCurveNodes[ i ][ curveNode.attr ] = curveNode;

						}

					}

				} );

				layersMap.set( parseInt( nodeID ), layerCurveNodes );

			}

		}

		return layersMap;

	}

	// parse nodes in FBXTree.Objects.AnimationStack. These are the top level node in the animation
	// hierarchy. Each Stack node will be used to create a AnimationClip
	parseAnimStacks( layersMap ) {

		const rawStacks = fbxTree.Objects.AnimationStack;

		// connect the stacks (clips) up to the layers
		const rawClips = {};

		for ( const nodeID in rawStacks ) {

			const children = connections.get( parseInt( nodeID ) ).children;

			if ( children.length > 1 ) {

				// it seems like stacks will always be associated with a single layer. But just in case there are files
				// where there are multiple layers per stack, we'll display a warning
				console.warn( 'THREE.FBXLoader: Encountered an animation stack with multiple layers, this is currently not supported. Ignoring subsequent layers.' );

			}

			const layer = layersMap.get( children[ 0 ].ID );

			rawClips[ nodeID ] = {

				name: rawStacks[ nodeID ].attrName,
				layer: layer,

			};

		}

		return rawClips;

	}

	addClip( rawClip ) {

		let tracks = [];

		const scope = this;
		rawClip.layer.forEach( function ( rawTracks ) {

			tracks = tracks.concat( scope.generateTracks( rawTracks ) );

		} );

		return new AnimationClip( rawClip.name, - 1, tracks );

	}

	generateTracks( rawTracks ) {

		const tracks = [];

		let initialPosition = new Vector3();
		let initialRotation = new Quaternion();
		let initialScale = new Vector3();

		if ( rawTracks.transform ) rawTracks.transform.decompose( initialPosition, initialRotation, initialScale );

		initialPosition = initialPosition.toArray();
		initialRotation = new Euler().setFromQuaternion( initialRotation, rawTracks.eulerOrder ).toArray();
		initialScale = initialScale.toArray();

		if ( rawTracks.T !== undefined && Object.keys( rawTracks.T.curves ).length > 0 ) {

			const positionTrack = this.generateVectorTrack( rawTracks.modelName, rawTracks.T.curves, initialPosition, 'position' );
			if ( positionTrack !== undefined ) tracks.push( positionTrack );

		}

		if ( rawTracks.R !== undefined && Object.keys( rawTracks.R.curves ).length > 0 ) {

			const rotationTrack = this.generateRotationTrack( rawTracks.modelName, rawTracks.R.curves, initialRotation, rawTracks.preRotation, rawTracks.postRotation, rawTracks.eulerOrder );
			if ( rotationTrack !== undefined ) tracks.push( rotationTrack );

		}

		if ( rawTracks.S !== undefined && Object.keys( rawTracks.S.curves ).length > 0 ) {

			const scaleTrack = this.generateVectorTrack( rawTracks.modelName, rawTracks.S.curves, initialScale, 'scale' );
			if ( scaleTrack !== undefined ) tracks.push( scaleTrack );

		}

		if ( rawTracks.DeformPercent !== undefined ) {

			const morphTrack = this.generateMorphTrack( rawTracks );
			if ( morphTrack !== undefined ) tracks.push( morphTrack );

		}

		return tracks;

	}

	generateVectorTrack( modelName, curves, initialValue, type ) {

		const times = this.getTimesForAllAxes( curves );
		const values = this.getKeyframeTrackValues( times, curves, initialValue );

		return new VectorKeyframeTrack( modelName + '.' + type, times, values );

	}

	generateRotationTrack( modelName, curves, initialValue, preRotation, postRotation, eulerOrder ) {

		if ( curves.x !== undefined ) {

			this.interpolateRotations( curves.x );
			curves.x.values = curves.x.values.map( MathUtils.degToRad );

		}

		if ( curves.y !== undefined ) {

			this.interpolateRotations( curves.y );
			curves.y.values = curves.y.values.map( MathUtils.degToRad );

		}

		if ( curves.z !== undefined ) {

			this.interpolateRotations( curves.z );
			curves.z.values = curves.z.values.map( MathUtils.degToRad );

		}

		const times = this.getTimesForAllAxes( curves );
		const values = this.getKeyframeTrackValues( times, curves, initialValue );

		if ( preRotation !== undefined ) {

			preRotation = preRotation.map( MathUtils.degToRad );
			preRotation.push( eulerOrder );

			preRotation = new Euler().fromArray( preRotation );
			preRotation = new Quaternion().setFromEuler( preRotation );

		}

		if ( postRotation !== undefined ) {

			postRotation = postRotation.map( MathUtils.degToRad );
			postRotation.push( eulerOrder );

			postRotation = new Euler().fromArray( postRotation );
			postRotation = new Quaternion().setFromEuler( postRotation ).invert();

		}

		const quaternion = new Quaternion();
		const euler = new Euler();

		const quaternionValues = [];

		for ( let i = 0; i < values.length; i += 3 ) {

			euler.set( values[ i ], values[ i + 1 ], values[ i + 2 ], eulerOrder );

			quaternion.setFromEuler( euler );

			if ( preRotation !== undefined ) quaternion.premultiply( preRotation );
			if ( postRotation !== undefined ) quaternion.multiply( postRotation );

			quaternion.toArray( quaternionValues, ( i / 3 ) * 4 );

		}

		return new QuaternionKeyframeTrack( modelName + '.quaternion', times, quaternionValues );

	}

	generateMorphTrack( rawTracks ) {

		const curves = rawTracks.DeformPercent.curves.morph;
		const values = curves.values.map( function ( val ) {

			return val / 100;

		} );

		const morphNum = sceneGraph.getObjectByName( rawTracks.modelName ).morphTargetDictionary[ rawTracks.morphName ];

		return new NumberKeyframeTrack( rawTracks.modelName + '.morphTargetInfluences[' + morphNum + ']', curves.times, values );

	}

	// For all animated objects, times are defined separately for each axis
	// Here we'll combine the times into one sorted array without duplicates
	getTimesForAllAxes( curves ) {

		let times = [];

		// first join together the times for each axis, if defined
		if ( curves.x !== undefined ) times = times.concat( curves.x.times );
		if ( curves.y !== undefined ) times = times.concat( curves.y.times );
		if ( curves.z !== undefined ) times = times.concat( curves.z.times );

		// then sort them
		times = times.sort( function ( a, b ) {

			return a - b;

		} );

		// and remove duplicates
		if ( times.length > 1 ) {

			let targetIndex = 1;
			let lastValue = times[ 0 ];
			for ( let i = 1; i < times.length; i ++ ) {

				const currentValue = times[ i ];
				if ( currentValue !== lastValue ) {

					times[ targetIndex ] = currentValue;
					lastValue = currentValue;
					targetIndex ++;

				}

			}

			times = times.slice( 0, targetIndex );

		}

		return times;

	}

	getKeyframeTrackValues( times, curves, initialValue ) {

		const prevValue = initialValue;

		const values = [];

		let xIndex = - 1;
		let yIndex = - 1;
		let zIndex = - 1;

		times.forEach( function ( time ) {

			if ( curves.x ) xIndex = curves.x.times.indexOf( time );
			if ( curves.y ) yIndex = curves.y.times.indexOf( time );
			if ( curves.z ) zIndex = curves.z.times.indexOf( time );

			// if there is an x value defined for this frame, use that
			if ( xIndex !== - 1 ) {

				const xValue = curves.x.values[ xIndex ];
				values.push( xValue );
				prevValue[ 0 ] = xValue;

			} else {

				// otherwise use the x value from the previous frame
				values.push( prevValue[ 0 ] );

			}

			if ( yIndex !== - 1 ) {

				const yValue = curves.y.values[ yIndex ];
				values.push( yValue );
				prevValue[ 1 ] = yValue;

			} else {

				values.push( prevValue[ 1 ] );

			}

			if ( zIndex !== - 1 ) {

				const zValue = curves.z.values[ zIndex ];
				values.push( zValue );
				prevValue[ 2 ] = zValue;

			} else {

				values.push( prevValue[ 2 ] );

			}

		} );

		return values;

	}

	// Rotations are defined as Euler angles which can have values  of any size
	// These will be converted to quaternions which don't support values greater than
	// PI, so we'll interpolate large rotations
	interpolateRotations( curve ) {

		for ( let i = 1; i < curve.values.length; i ++ ) {

			const initialValue = curve.values[ i - 1 ];
			const valuesSpan = curve.values[ i ] - initialValue;

			const absoluteSpan = Math.abs( valuesSpan );

			if ( absoluteSpan >= 180 ) {

				const numSubIntervals = absoluteSpan / 180;

				const step = valuesSpan / numSubIntervals;
				let nextValue = initialValue + step;

				const initialTime = curve.times[ i - 1 ];
				const timeSpan = curve.times[ i ] - initialTime;
				const interval = timeSpan / numSubIntervals;
				let nextTime = initialTime + interval;

				const interpolatedTimes = [];
				const interpolatedValues = [];

				while ( nextTime < curve.times[ i ] ) {

					interpolatedTimes.push( nextTime );
					nextTime += interval;

					interpolatedValues.push( nextValue );
					nextValue += step;

				}

				curve.times = inject( curve.times, i, interpolatedTimes );
				curve.values = inject( curve.values, i, interpolatedValues );

			}

		}

	}

}

// parse an FBX file in ASCII format
class TextParser {

	getPrevNode() {

		return this.nodeStack[ this.currentIndent - 2 ];

	}

	getCurrentNode() {

		return this.nodeStack[ this.currentIndent - 1 ];

	}

	getCurrentProp() {

		return this.currentProp;

	}

	pushStack( node ) {

		this.nodeStack.push( node );
		this.currentIndent += 1;

	}

	popStack() {

		this.nodeStack.pop();
		this.currentIndent -= 1;

	}

	setCurrentProp( val, name ) {

		this.currentProp = val;
		this.currentPropName = name;

	}

	parse( text ) {

		this.currentIndent = 0;

		this.allNodes = new FBXTree();
		this.nodeStack = [];
		this.currentProp = [];
		this.currentPropName = '';

		const scope = this;

		const split = text.split( /[\r\n]+/ );

		split.forEach( function ( line, i ) {

			const matchComment = line.match( /^[\s\t]*;/ );
			const matchEmpty = line.match( /^[\s\t]*$/ );

			if ( matchComment || matchEmpty ) return;

			const matchBeginning = line.match( '^\\t{' + scope.currentIndent + '}(\\w+):(.*){', '' );
			const matchProperty = line.match( '^\\t{' + ( scope.currentIndent ) + '}(\\w+):[\\s\\t\\r\\n](.*)' );
			const matchEnd = line.match( '^\\t{' + ( scope.currentIndent - 1 ) + '}}' );

			if ( matchBeginning ) {

				scope.parseNodeBegin( line, matchBeginning );

			} else if ( matchProperty ) {

				scope.parseNodeProperty( line, matchProperty, split[ ++ i ] );

			} else if ( matchEnd ) {

				scope.popStack();

			} else if ( line.match( /^[^\s\t}]/ ) ) {

				// large arrays are split over multiple lines terminated with a ',' character
				// if this is encountered the line needs to be joined to the previous line
				scope.parseNodePropertyContinued( line );

			}

		} );

		return this.allNodes;

	}

	parseNodeBegin( line, property ) {

		const nodeName = property[ 1 ].trim().replace( /^"/, '' ).replace( /"$/, '' );

		const nodeAttrs = property[ 2 ].split( ',' ).map( function ( attr ) {

			return attr.trim().replace( /^"/, '' ).replace( /"$/, '' );

		} );

		const node = { name: nodeName };
		const attrs = this.parseNodeAttr( nodeAttrs );

		const currentNode = this.getCurrentNode();

		// a top node
		if ( this.currentIndent === 0 ) {

			this.allNodes.add( nodeName, node );

		} else { // a subnode

			// if the subnode already exists, append it
			if ( nodeName in currentNode ) {

				// special case Pose needs PoseNodes as an array
				if ( nodeName === 'PoseNode' ) {

					currentNode.PoseNode.push( node );

				} else if ( currentNode[ nodeName ].id !== undefined ) {

					currentNode[ nodeName ] = {};
					currentNode[ nodeName ][ currentNode[ nodeName ].id ] = currentNode[ nodeName ];

				}

				if ( attrs.id !== '' ) currentNode[ nodeName ][ attrs.id ] = node;

			} else if ( typeof attrs.id === 'number' ) {

				currentNode[ nodeName ] = {};
				currentNode[ nodeName ][ attrs.id ] = node;

			} else if ( nodeName !== 'Properties70' ) {

				if ( nodeName === 'PoseNode' )	currentNode[ nodeName ] = [ node ];
				else currentNode[ nodeName ] = node;

			}

		}

		if ( typeof attrs.id === 'number' ) node.id = attrs.id;
		if ( attrs.name !== '' ) node.attrName = attrs.name;
		if ( attrs.type !== '' ) node.attrType = attrs.type;

		this.pushStack( node );

	}

	parseNodeAttr( attrs ) {

		let id = attrs[ 0 ];

		if ( attrs[ 0 ] !== '' ) {

			id = parseInt( attrs[ 0 ] );

			if ( isNaN( id ) ) {

				id = attrs[ 0 ];

			}

		}

		let name = '', type = '';

		if ( attrs.length > 1 ) {

			name = attrs[ 1 ].replace( /^(\w+)::/, '' );
			type = attrs[ 2 ];

		}

		return { id: id, name: name, type: type };

	}

	parseNodeProperty( line, property, contentLine ) {

		let propName = property[ 1 ].replace( /^"/, '' ).replace( /"$/, '' ).trim();
		let propValue = property[ 2 ].replace( /^"/, '' ).replace( /"$/, '' ).trim();

		// for special case: base64 image data follows "Content: ," line
		//	Content: ,
		//	 "/9j/4RDaRXhpZgAATU0A..."
		if ( propName === 'Content' && propValue === ',' ) {

			propValue = contentLine.replace( /"/g, '' ).replace( /,$/, '' ).trim();

		}

		const currentNode = this.getCurrentNode();
		const parentName = currentNode.name;

		if ( parentName === 'Properties70' ) {

			this.parseNodeSpecialProperty( line, propName, propValue );
			return;

		}

		// Connections
		if ( propName === 'C' ) {

			const connProps = propValue.split( ',' ).slice( 1 );
			const from = parseInt( connProps[ 0 ] );
			const to = parseInt( connProps[ 1 ] );

			let rest = propValue.split( ',' ).slice( 3 );

			rest = rest.map( function ( elem ) {

				return elem.trim().replace( /^"/, '' );

			} );

			propName = 'connections';
			propValue = [ from, to ];
			append( propValue, rest );

			if ( currentNode[ propName ] === undefined ) {

				currentNode[ propName ] = [];

			}

		}

		// Node
		if ( propName === 'Node' ) currentNode.id = propValue;

		// connections
		if ( propName in currentNode && Array.isArray( currentNode[ propName ] ) ) {

			currentNode[ propName ].push( propValue );

		} else {

			if ( propName !== 'a' ) currentNode[ propName ] = propValue;
			else currentNode.a = propValue;

		}

		this.setCurrentProp( currentNode, propName );

		// convert string to array, unless it ends in ',' in which case more will be added to it
		if ( propName === 'a' && propValue.slice( - 1 ) !== ',' ) {

			currentNode.a = parseNumberArray( propValue );

		}

	}

	parseNodePropertyContinued( line ) {

		const currentNode = this.getCurrentNode();

		currentNode.a += line;

		// if the line doesn't end in ',' we have reached the end of the property value
		// so convert the string to an array
		if ( line.slice( - 1 ) !== ',' ) {

			currentNode.a = parseNumberArray( currentNode.a );

		}

	}

	// parse "Property70"
	parseNodeSpecialProperty( line, propName, propValue ) {

		// split this
		// P: "Lcl Scaling", "Lcl Scaling", "", "A",1,1,1
		// into array like below
		// ["Lcl Scaling", "Lcl Scaling", "", "A", "1,1,1" ]
		const props = propValue.split( '",' ).map( function ( prop ) {

			return prop.trim().replace( /^\"/, '' ).replace( /\s/, '_' );

		} );

		const innerPropName = props[ 0 ];
		const innerPropType1 = props[ 1 ];
		const innerPropType2 = props[ 2 ];
		const innerPropFlag = props[ 3 ];
		let innerPropValue = props[ 4 ];

		// cast values where needed, otherwise leave as strings
		switch ( innerPropType1 ) {

			case 'int':
			case 'enum':
			case 'bool':
			case 'ULongLong':
			case 'double':
			case 'Number':
			case 'FieldOfView':
				innerPropValue = parseFloat( innerPropValue );
				break;

			case 'Color':
			case 'ColorRGB':
			case 'Vector3D':
			case 'Lcl_Translation':
			case 'Lcl_Rotation':
			case 'Lcl_Scaling':
				innerPropValue = parseNumberArray( innerPropValue );
				break;

		}

		// CAUTION: these props must append to parent's parent
		this.getPrevNode()[ innerPropName ] = {

			'type': innerPropType1,
			'type2': innerPropType2,
			'flag': innerPropFlag,
			'value': innerPropValue

		};

		this.setCurrentProp( this.getPrevNode(), innerPropName );

	}

}

// Parse an FBX file in Binary format
class BinaryParser {

	parse( buffer ) {

		const reader = new BinaryReader( buffer );
		reader.skip( 23 ); // skip magic 23 bytes

		const version = reader.getUint32();

		if ( version < 6400 ) {

			throw new Error( 'THREE.FBXLoader: FBX version not supported, FileVersion: ' + version );

		}

		const allNodes = new FBXTree();

		while ( ! this.endOfContent( reader ) ) {

			const node = this.parseNode( reader, version );
			if ( node !== null ) allNodes.add( node.name, node );

		}

		return allNodes;

	}

	// Check if reader has reached the end of content.
	endOfContent( reader ) {

		// footer size: 160bytes + 16-byte alignment padding
		// - 16bytes: magic
		// - padding til 16-byte alignment (at least 1byte?)
		//	(seems like some exporters embed fixed 15 or 16bytes?)
		// - 4bytes: magic
		// - 4bytes: version
		// - 120bytes: zero
		// - 16bytes: magic
		if ( reader.size() % 16 === 0 ) {

			return ( ( reader.getOffset() + 160 + 16 ) & ~ 0xf ) >= reader.size();

		} else {

			return reader.getOffset() + 160 + 16 >= reader.size();

		}

	}

	// recursively parse nodes until the end of the file is reached
	parseNode( reader, version ) {

		const node = {};

		// The first three data sizes depends on version.
		const endOffset = ( version >= 7500 ) ? reader.getUint64() : reader.getUint32();
		const numProperties = ( version >= 7500 ) ? reader.getUint64() : reader.getUint32();

		( version >= 7500 ) ? reader.getUint64() : reader.getUint32(); // the returned propertyListLen is not used

		const nameLen = reader.getUint8();
		const name = reader.getString( nameLen );

		// Regards this node as NULL-record if endOffset is zero
		if ( endOffset === 0 ) return null;

		const propertyList = [];

		for ( let i = 0; i < numProperties; i ++ ) {

			propertyList.push( this.parseProperty( reader ) );

		}

		// Regards the first three elements in propertyList as id, attrName, and attrType
		const id = propertyList.length > 0 ? propertyList[ 0 ] : '';
		const attrName = propertyList.length > 1 ? propertyList[ 1 ] : '';
		const attrType = propertyList.length > 2 ? propertyList[ 2 ] : '';

		// check if this node represents just a single property
		// like (name, 0) set or (name2, [0, 1, 2]) set of {name: 0, name2: [0, 1, 2]}
		node.singleProperty = ( numProperties === 1 && reader.getOffset() === endOffset ) ? true : false;

		while ( endOffset > reader.getOffset() ) {

			const subNode = this.parseNode( reader, version );

			if ( subNode !== null ) this.parseSubNode( name, node, subNode );

		}

		node.propertyList = propertyList; // raw property list used by parent

		if ( typeof id === 'number' ) node.id = id;
		if ( attrName !== '' ) node.attrName = attrName;
		if ( attrType !== '' ) node.attrType = attrType;
		if ( name !== '' ) node.name = name;

		return node;

	}

	parseSubNode( name, node, subNode ) {

		// special case: child node is single property
		if ( subNode.singleProperty === true ) {

			const value = subNode.propertyList[ 0 ];

			if ( Array.isArray( value ) ) {

				node[ subNode.name ] = subNode;

				subNode.a = value;

			} else {

				node[ subNode.name ] = value;

			}

		} else if ( name === 'Connections' && subNode.name === 'C' ) {

			const array = [];

			subNode.propertyList.forEach( function ( property, i ) {

				// first Connection is FBX type (OO, OP, etc.). We'll discard these
				if ( i !== 0 ) array.push( property );

			} );

			if ( node.connections === undefined ) {

				node.connections = [];

			}

			node.connections.push( array );

		} else if ( subNode.name === 'Properties70' ) {

			const keys = Object.keys( subNode );

			keys.forEach( function ( key ) {

				node[ key ] = subNode[ key ];

			} );

		} else if ( name === 'Properties70' && subNode.name === 'P' ) {

			let innerPropName = subNode.propertyList[ 0 ];
			let innerPropType1 = subNode.propertyList[ 1 ];
			const innerPropType2 = subNode.propertyList[ 2 ];
			const innerPropFlag = subNode.propertyList[ 3 ];
			let innerPropValue;

			if ( innerPropName.indexOf( 'Lcl ' ) === 0 ) innerPropName = innerPropName.replace( 'Lcl ', 'Lcl_' );
			if ( innerPropType1.indexOf( 'Lcl ' ) === 0 ) innerPropType1 = innerPropType1.replace( 'Lcl ', 'Lcl_' );

			if ( innerPropType1 === 'Color' || innerPropType1 === 'ColorRGB' || innerPropType1 === 'Vector' || innerPropType1 === 'Vector3D' || innerPropType1.indexOf( 'Lcl_' ) === 0 ) {

				innerPropValue = [
					subNode.propertyList[ 4 ],
					subNode.propertyList[ 5 ],
					subNode.propertyList[ 6 ]
				];

			} else {

				innerPropValue = subNode.propertyList[ 4 ];

			}

			// this will be copied to parent, see above
			node[ innerPropName ] = {

				'type': innerPropType1,
				'type2': innerPropType2,
				'flag': innerPropFlag,
				'value': innerPropValue

			};

		} else if ( node[ subNode.name ] === undefined ) {

			if ( typeof subNode.id === 'number' ) {

				node[ subNode.name ] = {};
				node[ subNode.name ][ subNode.id ] = subNode;

			} else {

				node[ subNode.name ] = subNode;

			}

		} else {

			if ( subNode.name === 'PoseNode' ) {

				if ( ! Array.isArray( node[ subNode.name ] ) ) {

					node[ subNode.name ] = [ node[ subNode.name ] ];

				}

				node[ subNode.name ].push( subNode );

			} else if ( node[ subNode.name ][ subNode.id ] === undefined ) {

				node[ subNode.name ][ subNode.id ] = subNode;

			}

		}

	}

	parseProperty( reader ) {

		const type = reader.getString( 1 );
		let length;

		switch ( type ) {

			case 'C':
				return reader.getBoolean();

			case 'D':
				return reader.getFloat64();

			case 'F':
				return reader.getFloat32();

			case 'I':
				return reader.getInt32();

			case 'L':
				return reader.getInt64();

			case 'R':
				length = reader.getUint32();
				return reader.getArrayBuffer( length );

			case 'S':
				length = reader.getUint32();
				return reader.getString( length );

			case 'Y':
				return reader.getInt16();

			case 'b':
			case 'c':
			case 'd':
			case 'f':
			case 'i':
			case 'l':

				const arrayLength = reader.getUint32();
				const encoding = reader.getUint32(); // 0: non-compressed, 1: compressed
				const compressedLength = reader.getUint32();

				if ( encoding === 0 ) {

					switch ( type ) {

						case 'b':
						case 'c':
							return reader.getBooleanArray( arrayLength );

						case 'd':
							return reader.getFloat64Array( arrayLength );

						case 'f':
							return reader.getFloat32Array( arrayLength );

						case 'i':
							return reader.getInt32Array( arrayLength );

						case 'l':
							return reader.getInt64Array( arrayLength );

					}

				}

				if ( typeof fflate === 'undefined' ) {

					console.error( 'THREE.FBXLoader: External library fflate.min.js required.' );

				}

				const data = unzlibSync( new Uint8Array( reader.getArrayBuffer( compressedLength ) ) ); // eslint-disable-line no-undef
				const reader2 = new BinaryReader( data.buffer );

				switch ( type ) {

					case 'b':
					case 'c':
						return reader2.getBooleanArray( arrayLength );

					case 'd':
						return reader2.getFloat64Array( arrayLength );

					case 'f':
						return reader2.getFloat32Array( arrayLength );

					case 'i':
						return reader2.getInt32Array( arrayLength );

					case 'l':
						return reader2.getInt64Array( arrayLength );

				}

				break; // cannot happen but is required by the DeepScan

			default:
				throw new Error( 'THREE.FBXLoader: Unknown property type ' + type );

		}

	}

}

class BinaryReader {

	constructor( buffer, littleEndian ) {

		this.dv = new DataView( buffer );
		this.offset = 0;
		this.littleEndian = ( littleEndian !== undefined ) ? littleEndian : true;

	}

	getOffset() {

		return this.offset;

	}

	size() {

		return this.dv.buffer.byteLength;

	}

	skip( length ) {

		this.offset += length;

	}

	// seems like true/false representation depends on exporter.
	// true: 1 or 'Y'(=0x59), false: 0 or 'T'(=0x54)
	// then sees LSB.
	getBoolean() {

		return ( this.getUint8() & 1 ) === 1;

	}

	getBooleanArray( size ) {

		const a = [];

		for ( let i = 0; i < size; i ++ ) {

			a.push( this.getBoolean() );

		}

		return a;

	}

	getUint8() {

		const value = this.dv.getUint8( this.offset );
		this.offset += 1;
		return value;

	}

	getInt16() {

		const value = this.dv.getInt16( this.offset, this.littleEndian );
		this.offset += 2;
		return value;

	}

	getInt32() {

		const value = this.dv.getInt32( this.offset, this.littleEndian );
		this.offset += 4;
		return value;

	}

	getInt32Array( size ) {

		const a = [];

		for ( let i = 0; i < size; i ++ ) {

			a.push( this.getInt32() );

		}

		return a;

	}

	getUint32() {

		const value = this.dv.getUint32( this.offset, this.littleEndian );
		this.offset += 4;
		return value;

	}

	// JavaScript doesn't support 64-bit integer so calculate this here
	// 1 << 32 will return 1 so using multiply operation instead here.
	// There's a possibility that this method returns wrong value if the value
	// is out of the range between Number.MAX_SAFE_INTEGER and Number.MIN_SAFE_INTEGER.
	// TODO: safely handle 64-bit integer
	getInt64() {

		let low, high;

		if ( this.littleEndian ) {

			low = this.getUint32();
			high = this.getUint32();

		} else {

			high = this.getUint32();
			low = this.getUint32();

		}

		// calculate negative value
		if ( high & 0x80000000 ) {

			high = ~ high & 0xFFFFFFFF;
			low = ~ low & 0xFFFFFFFF;

			if ( low === 0xFFFFFFFF ) high = ( high + 1 ) & 0xFFFFFFFF;

			low = ( low + 1 ) & 0xFFFFFFFF;

			return - ( high * 0x100000000 + low );

		}

		return high * 0x100000000 + low;

	}

	getInt64Array( size ) {

		const a = [];

		for ( let i = 0; i < size; i ++ ) {

			a.push( this.getInt64() );

		}

		return a;

	}

	// Note: see getInt64() comment
	getUint64() {

		let low, high;

		if ( this.littleEndian ) {

			low = this.getUint32();
			high = this.getUint32();

		} else {

			high = this.getUint32();
			low = this.getUint32();

		}

		return high * 0x100000000 + low;

	}

	getFloat32() {

		const value = this.dv.getFloat32( this.offset, this.littleEndian );
		this.offset += 4;
		return value;

	}

	getFloat32Array( size ) {

		const a = [];

		for ( let i = 0; i < size; i ++ ) {

			a.push( this.getFloat32() );

		}

		return a;

	}

	getFloat64() {

		const value = this.dv.getFloat64( this.offset, this.littleEndian );
		this.offset += 8;
		return value;

	}

	getFloat64Array( size ) {

		const a = [];

		for ( let i = 0; i < size; i ++ ) {

			a.push( this.getFloat64() );

		}

		return a;

	}

	getArrayBuffer( size ) {

		const value = this.dv.buffer.slice( this.offset, this.offset + size );
		this.offset += size;
		return value;

	}

	getString( size ) {

		// note: safari 9 doesn't support Uint8Array.indexOf; create intermediate array instead
		let a = [];

		for ( let i = 0; i < size; i ++ ) {

			a[ i ] = this.getUint8();

		}

		const nullByte = a.indexOf( 0 );
		if ( nullByte >= 0 ) a = a.slice( 0, nullByte );

		return LoaderUtils.decodeText( new Uint8Array( a ) );

	}

}

// FBXTree holds a representation of the FBX data, returned by the TextParser ( FBX ASCII format)
// and BinaryParser( FBX Binary format)
class FBXTree {

	add( key, val ) {

		this[ key ] = val;

	}

}

// ************** UTILITY FUNCTIONS **************

function isFbxFormatBinary( buffer ) {

	const CORRECT = 'Kaydara\u0020FBX\u0020Binary\u0020\u0020\0';

	return buffer.byteLength >= CORRECT.length && CORRECT === convertArrayBufferToString( buffer, 0, CORRECT.length );

}

function isFbxFormatASCII( text ) {

	const CORRECT = [ 'K', 'a', 'y', 'd', 'a', 'r', 'a', '\\', 'F', 'B', 'X', '\\', 'B', 'i', 'n', 'a', 'r', 'y', '\\', '\\' ];

	let cursor = 0;

	function read( offset ) {

		const result = text[ offset - 1 ];
		text = text.slice( cursor + offset );
		cursor ++;
		return result;

	}

	for ( let i = 0; i < CORRECT.length; ++ i ) {

		const num = read( 1 );
		if ( num === CORRECT[ i ] ) {

			return false;

		}

	}

	return true;

}

function getFbxVersion( text ) {

	const versionRegExp = /FBXVersion: (\d+)/;
	const match = text.match( versionRegExp );

	if ( match ) {

		const version = parseInt( match[ 1 ] );
		return version;

	}

	throw new Error( 'THREE.FBXLoader: Cannot find the version number for the file given.' );

}

// Converts FBX ticks into real time seconds.
function convertFBXTimeToSeconds( time ) {

	return time / 46186158000;

}

const dataArray = [];

// extracts the data from the correct position in the FBX array based on indexing type
function getData( polygonVertexIndex, polygonIndex, vertexIndex, infoObject ) {

	let index;

	switch ( infoObject.mappingType ) {

		case 'ByPolygonVertex' :
			index = polygonVertexIndex;
			break;
		case 'ByPolygon' :
			index = polygonIndex;
			break;
		case 'ByVertice' :
			index = vertexIndex;
			break;
		case 'AllSame' :
			index = infoObject.indices[ 0 ];
			break;
		default :
			console.warn( 'THREE.FBXLoader: unknown attribute mapping type ' + infoObject.mappingType );

	}

	if ( infoObject.referenceType === 'IndexToDirect' ) index = infoObject.indices[ index ];

	const from = index * infoObject.dataSize;
	const to = from + infoObject.dataSize;

	return slice( dataArray, infoObject.buffer, from, to );

}

const tempEuler = new Euler();
const tempVec = new Vector3();

// generate transformation from FBX transform data
// ref: https://help.autodesk.com/view/FBX/2017/ENU/?guid=__files_GUID_10CDD63C_79C1_4F2D_BB28_AD2BE65A02ED_htm
// ref: http://docs.autodesk.com/FBX/2014/ENU/FBX-SDK-Documentation/index.html?url=cpp_ref/_transformations_2main_8cxx-example.html,topicNumber=cpp_ref__transformations_2main_8cxx_example_htmlfc10a1e1-b18d-4e72-9dc0-70d0f1959f5e
function generateTransform( transformData ) {

	const lTranslationM = new Matrix4();
	const lPreRotationM = new Matrix4();
	const lRotationM = new Matrix4();
	const lPostRotationM = new Matrix4();

	const lScalingM = new Matrix4();
	const lScalingPivotM = new Matrix4();
	const lScalingOffsetM = new Matrix4();
	const lRotationOffsetM = new Matrix4();
	const lRotationPivotM = new Matrix4();

	const lParentGX = new Matrix4();
	const lParentLX = new Matrix4();
	const lGlobalT = new Matrix4();

	const inheritType = ( transformData.inheritType ) ? transformData.inheritType : 0;

	if ( transformData.translation ) lTranslationM.setPosition( tempVec.fromArray( transformData.translation ) );

	if ( transformData.preRotation ) {

		const array = transformData.preRotation.map( MathUtils.degToRad );
		array.push( transformData.eulerOrder || Euler.DefaultOrder );
		lPreRotationM.makeRotationFromEuler( tempEuler.fromArray( array ) );

	}

	if ( transformData.rotation ) {

		const array = transformData.rotation.map( MathUtils.degToRad );
		array.push( transformData.eulerOrder || Euler.DefaultOrder );
		lRotationM.makeRotationFromEuler( tempEuler.fromArray( array ) );

	}

	if ( transformData.postRotation ) {

		const array = transformData.postRotation.map( MathUtils.degToRad );
		array.push( transformData.eulerOrder || Euler.DefaultOrder );
		lPostRotationM.makeRotationFromEuler( tempEuler.fromArray( array ) );
		lPostRotationM.invert();

	}

	if ( transformData.scale ) lScalingM.scale( tempVec.fromArray( transformData.scale ) );

	// Pivots and offsets
	if ( transformData.scalingOffset ) lScalingOffsetM.setPosition( tempVec.fromArray( transformData.scalingOffset ) );
	if ( transformData.scalingPivot ) lScalingPivotM.setPosition( tempVec.fromArray( transformData.scalingPivot ) );
	if ( transformData.rotationOffset ) lRotationOffsetM.setPosition( tempVec.fromArray( transformData.rotationOffset ) );
	if ( transformData.rotationPivot ) lRotationPivotM.setPosition( tempVec.fromArray( transformData.rotationPivot ) );

	// parent transform
	if ( transformData.parentMatrixWorld ) {

		lParentLX.copy( transformData.parentMatrix );
		lParentGX.copy( transformData.parentMatrixWorld );

	}

	const lLRM = lPreRotationM.clone().multiply( lRotationM ).multiply( lPostRotationM );
	// Global Rotation
	const lParentGRM = new Matrix4();
	lParentGRM.extractRotation( lParentGX );

	// Global Shear*Scaling
	const lParentTM = new Matrix4();
	lParentTM.copyPosition( lParentGX );

	const lParentGRSM = lParentTM.clone().invert().multiply( lParentGX );
	const lParentGSM = lParentGRM.clone().invert().multiply( lParentGRSM );
	const lLSM = lScalingM;

	const lGlobalRS = new Matrix4();

	if ( inheritType === 0 ) {

		lGlobalRS.copy( lParentGRM ).multiply( lLRM ).multiply( lParentGSM ).multiply( lLSM );

	} else if ( inheritType === 1 ) {

		lGlobalRS.copy( lParentGRM ).multiply( lParentGSM ).multiply( lLRM ).multiply( lLSM );

	} else {

		const lParentLSM = new Matrix4().scale( new Vector3().setFromMatrixScale( lParentLX ) );
		const lParentLSM_inv = lParentLSM.clone().invert();
		const lParentGSM_noLocal = lParentGSM.clone().multiply( lParentLSM_inv );

		lGlobalRS.copy( lParentGRM ).multiply( lLRM ).multiply( lParentGSM_noLocal ).multiply( lLSM );

	}

	const lRotationPivotM_inv = lRotationPivotM.clone().invert();
	const lScalingPivotM_inv = lScalingPivotM.clone().invert();
	// Calculate the local transform matrix
	let lTransform = lTranslationM.clone().multiply( lRotationOffsetM ).multiply( lRotationPivotM ).multiply( lPreRotationM ).multiply( lRotationM ).multiply( lPostRotationM ).multiply( lRotationPivotM_inv ).multiply( lScalingOffsetM ).multiply( lScalingPivotM ).multiply( lScalingM ).multiply( lScalingPivotM_inv );

	const lLocalTWithAllPivotAndOffsetInfo = new Matrix4().copyPosition( lTransform );

	const lGlobalTranslation = lParentGX.clone().multiply( lLocalTWithAllPivotAndOffsetInfo );
	lGlobalT.copyPosition( lGlobalTranslation );

	lTransform = lGlobalT.clone().multiply( lGlobalRS );

	// from global to local
	lTransform.premultiply( lParentGX.invert() );

	return lTransform;

}

// Returns the three.js intrinsic Euler order corresponding to FBX extrinsic Euler order
// ref: http://help.autodesk.com/view/FBX/2017/ENU/?guid=__cpp_ref_class_fbx_euler_html
function getEulerOrder( order ) {

	order = order || 0;

	const enums = [
		'ZYX', // -> XYZ extrinsic
		'YZX', // -> XZY extrinsic
		'XZY', // -> YZX extrinsic
		'ZXY', // -> YXZ extrinsic
		'YXZ', // -> ZXY extrinsic
		'XYZ', // -> ZYX extrinsic
		//'SphericXYZ', // not possible to support
	];

	if ( order === 6 ) {

		console.warn( 'THREE.FBXLoader: unsupported Euler Order: Spherical XYZ. Animations and rotations may be incorrect.' );
		return enums[ 0 ];

	}

	return enums[ order ];

}

// Parses comma separated list of numbers and returns them an array.
// Used internally by the TextParser
function parseNumberArray( value ) {

	const array = value.split( ',' ).map( function ( val ) {

		return parseFloat( val );

	} );

	return array;

}

function convertArrayBufferToString( buffer, from, to ) {

	if ( from === undefined ) from = 0;
	if ( to === undefined ) to = buffer.byteLength;

	return LoaderUtils.decodeText( new Uint8Array( buffer, from, to ) );

}

function append( a, b ) {

	for ( let i = 0, j = a.length, l = b.length; i < l; i ++, j ++ ) {

		a[ j ] = b[ i ];

	}

}

function slice( a, b, from, to ) {

	for ( let i = from, j = 0; i < to; i ++, j ++ ) {

		a[ j ] = b[ i ];

	}

	return a;

}

// inject array a2 into array a1 at index
function inject( a1, index, a2 ) {

	return a1.slice( 0, index ).concat( a2 ).concat( a1.slice( index ) );

}

// https://github.com/mrdoob/three.js/issues/5552
// http://en.wikipedia.org/wiki/RGBE_image_format

class RGBELoader extends DataTextureLoader {

	constructor( manager ) {

		super( manager );

		this.type = HalfFloatType;

	}

	// adapted from http://www.graphics.cornell.edu/~bjw/rgbe.html

	parse( buffer ) {

		const
			/* return codes for rgbe routines */
			//RGBE_RETURN_SUCCESS = 0,
			RGBE_RETURN_FAILURE = - 1,

			/* default error routine.  change this to change error handling */
			rgbe_read_error = 1,
			rgbe_write_error = 2,
			rgbe_format_error = 3,
			rgbe_memory_error = 4,
			rgbe_error = function ( rgbe_error_code, msg ) {

				switch ( rgbe_error_code ) {

					case rgbe_read_error: console.error( 'THREE.RGBELoader Read Error: ' + ( msg || '' ) );
						break;
					case rgbe_write_error: console.error( 'THREE.RGBELoader Write Error: ' + ( msg || '' ) );
						break;
					case rgbe_format_error: console.error( 'THREE.RGBELoader Bad File Format: ' + ( msg || '' ) );
						break;
					default:
					case rgbe_memory_error: console.error( 'THREE.RGBELoader: Error: ' + ( msg || '' ) );

				}

				return RGBE_RETURN_FAILURE;

			},

			/* offsets to red, green, and blue components in a data (float) pixel */
			//RGBE_DATA_RED = 0,
			//RGBE_DATA_GREEN = 1,
			//RGBE_DATA_BLUE = 2,

			/* number of floats per pixel, use 4 since stored in rgba image format */
			//RGBE_DATA_SIZE = 4,

			/* flags indicating which fields in an rgbe_header_info are valid */
			RGBE_VALID_PROGRAMTYPE = 1,
			RGBE_VALID_FORMAT = 2,
			RGBE_VALID_DIMENSIONS = 4,

			NEWLINE = '\n',

			fgets = function ( buffer, lineLimit, consume ) {

				const chunkSize = 128;

				lineLimit = ! lineLimit ? 1024 : lineLimit;
				let p = buffer.pos,
					i = - 1, len = 0, s = '',
					chunk = String.fromCharCode.apply( null, new Uint16Array( buffer.subarray( p, p + chunkSize ) ) );

				while ( ( 0 > ( i = chunk.indexOf( NEWLINE ) ) ) && ( len < lineLimit ) && ( p < buffer.byteLength ) ) {

					s += chunk; len += chunk.length;
					p += chunkSize;
					chunk += String.fromCharCode.apply( null, new Uint16Array( buffer.subarray( p, p + chunkSize ) ) );

				}

				if ( - 1 < i ) {

					/*for (i=l-1; i>=0; i--) {
						byteCode = m.charCodeAt(i);
						if (byteCode > 0x7f && byteCode <= 0x7ff) byteLen++;
						else if (byteCode > 0x7ff && byteCode <= 0xffff) byteLen += 2;
						if (byteCode >= 0xDC00 && byteCode <= 0xDFFF) i--; //trail surrogate
					}*/
					if ( false !== consume ) buffer.pos += len + i + 1;
					return s + chunk.slice( 0, i );

				}

				return false;

			},

			/* minimal header reading.  modify if you want to parse more information */
			RGBE_ReadHeader = function ( buffer ) {


				// regexes to parse header info fields
				const magic_token_re = /^#\?(\S+)/,
					gamma_re = /^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,
					exposure_re = /^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,
					format_re = /^\s*FORMAT=(\S+)\s*$/,
					dimensions_re = /^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,

					// RGBE format header struct
					header = {

						valid: 0, /* indicate which fields are valid */

						string: '', /* the actual header string */

						comments: '', /* comments found in header */

						programtype: 'RGBE', /* listed at beginning of file to identify it after "#?". defaults to "RGBE" */

						format: '', /* RGBE format, default 32-bit_rle_rgbe */

						gamma: 1.0, /* image has already been gamma corrected with given gamma. defaults to 1.0 (no correction) */

						exposure: 1.0, /* a value of 1.0 in an image corresponds to <exposure> watts/steradian/m^2. defaults to 1.0 */

						width: 0, height: 0 /* image dimensions, width/height */

					};

				let line, match;

				if ( buffer.pos >= buffer.byteLength || ! ( line = fgets( buffer ) ) ) {

					return rgbe_error( rgbe_read_error, 'no header found' );

				}

				/* if you want to require the magic token then uncomment the next line */
				if ( ! ( match = line.match( magic_token_re ) ) ) {

					return rgbe_error( rgbe_format_error, 'bad initial token' );

				}

				header.valid |= RGBE_VALID_PROGRAMTYPE;
				header.programtype = match[ 1 ];
				header.string += line + '\n';

				while ( true ) {

					line = fgets( buffer );
					if ( false === line ) break;
					header.string += line + '\n';

					if ( '#' === line.charAt( 0 ) ) {

						header.comments += line + '\n';
						continue; // comment line

					}

					if ( match = line.match( gamma_re ) ) {

						header.gamma = parseFloat( match[ 1 ] );

					}

					if ( match = line.match( exposure_re ) ) {

						header.exposure = parseFloat( match[ 1 ] );

					}

					if ( match = line.match( format_re ) ) {

						header.valid |= RGBE_VALID_FORMAT;
						header.format = match[ 1 ];//'32-bit_rle_rgbe';

					}

					if ( match = line.match( dimensions_re ) ) {

						header.valid |= RGBE_VALID_DIMENSIONS;
						header.height = parseInt( match[ 1 ], 10 );
						header.width = parseInt( match[ 2 ], 10 );

					}

					if ( ( header.valid & RGBE_VALID_FORMAT ) && ( header.valid & RGBE_VALID_DIMENSIONS ) ) break;

				}

				if ( ! ( header.valid & RGBE_VALID_FORMAT ) ) {

					return rgbe_error( rgbe_format_error, 'missing format specifier' );

				}

				if ( ! ( header.valid & RGBE_VALID_DIMENSIONS ) ) {

					return rgbe_error( rgbe_format_error, 'missing image size specifier' );

				}

				return header;

			},

			RGBE_ReadPixels_RLE = function ( buffer, w, h ) {

				const scanline_width = w;

				if (
					// run length encoding is not allowed so read flat
					( ( scanline_width < 8 ) || ( scanline_width > 0x7fff ) ) ||
					// this file is not run length encoded
					( ( 2 !== buffer[ 0 ] ) || ( 2 !== buffer[ 1 ] ) || ( buffer[ 2 ] & 0x80 ) )
				) {

					// return the flat buffer
					return new Uint8Array( buffer );

				}

				if ( scanline_width !== ( ( buffer[ 2 ] << 8 ) | buffer[ 3 ] ) ) {

					return rgbe_error( rgbe_format_error, 'wrong scanline width' );

				}

				const data_rgba = new Uint8Array( 4 * w * h );

				if ( ! data_rgba.length ) {

					return rgbe_error( rgbe_memory_error, 'unable to allocate buffer space' );

				}

				let offset = 0, pos = 0;

				const ptr_end = 4 * scanline_width;
				const rgbeStart = new Uint8Array( 4 );
				const scanline_buffer = new Uint8Array( ptr_end );
				let num_scanlines = h;

				// read in each successive scanline
				while ( ( num_scanlines > 0 ) && ( pos < buffer.byteLength ) ) {

					if ( pos + 4 > buffer.byteLength ) {

						return rgbe_error( rgbe_read_error );

					}

					rgbeStart[ 0 ] = buffer[ pos ++ ];
					rgbeStart[ 1 ] = buffer[ pos ++ ];
					rgbeStart[ 2 ] = buffer[ pos ++ ];
					rgbeStart[ 3 ] = buffer[ pos ++ ];

					if ( ( 2 != rgbeStart[ 0 ] ) || ( 2 != rgbeStart[ 1 ] ) || ( ( ( rgbeStart[ 2 ] << 8 ) | rgbeStart[ 3 ] ) != scanline_width ) ) {

						return rgbe_error( rgbe_format_error, 'bad rgbe scanline format' );

					}

					// read each of the four channels for the scanline into the buffer
					// first red, then green, then blue, then exponent
					let ptr = 0, count;

					while ( ( ptr < ptr_end ) && ( pos < buffer.byteLength ) ) {

						count = buffer[ pos ++ ];
						const isEncodedRun = count > 128;
						if ( isEncodedRun ) count -= 128;

						if ( ( 0 === count ) || ( ptr + count > ptr_end ) ) {

							return rgbe_error( rgbe_format_error, 'bad scanline data' );

						}

						if ( isEncodedRun ) {

							// a (encoded) run of the same value
							const byteValue = buffer[ pos ++ ];
							for ( let i = 0; i < count; i ++ ) {

								scanline_buffer[ ptr ++ ] = byteValue;

							}
							//ptr += count;

						} else {

							// a literal-run
							scanline_buffer.set( buffer.subarray( pos, pos + count ), ptr );
							ptr += count; pos += count;

						}

					}


					// now convert data from buffer into rgba
					// first red, then green, then blue, then exponent (alpha)
					const l = scanline_width; //scanline_buffer.byteLength;
					for ( let i = 0; i < l; i ++ ) {

						let off = 0;
						data_rgba[ offset ] = scanline_buffer[ i + off ];
						off += scanline_width; //1;
						data_rgba[ offset + 1 ] = scanline_buffer[ i + off ];
						off += scanline_width; //1;
						data_rgba[ offset + 2 ] = scanline_buffer[ i + off ];
						off += scanline_width; //1;
						data_rgba[ offset + 3 ] = scanline_buffer[ i + off ];
						offset += 4;

					}

					num_scanlines --;

				}

				return data_rgba;

			};

		const RGBEByteToRGBFloat = function ( sourceArray, sourceOffset, destArray, destOffset ) {

			const e = sourceArray[ sourceOffset + 3 ];
			const scale = Math.pow( 2.0, e - 128.0 ) / 255.0;

			destArray[ destOffset + 0 ] = sourceArray[ sourceOffset + 0 ] * scale;
			destArray[ destOffset + 1 ] = sourceArray[ sourceOffset + 1 ] * scale;
			destArray[ destOffset + 2 ] = sourceArray[ sourceOffset + 2 ] * scale;
			destArray[ destOffset + 3 ] = 1;

		};

		const RGBEByteToRGBHalf = function ( sourceArray, sourceOffset, destArray, destOffset ) {

			const e = sourceArray[ sourceOffset + 3 ];
			const scale = Math.pow( 2.0, e - 128.0 ) / 255.0;

			// clamping to 65504, the maximum representable value in float16
			destArray[ destOffset + 0 ] = DataUtils.toHalfFloat( Math.min( sourceArray[ sourceOffset + 0 ] * scale, 65504 ) );
			destArray[ destOffset + 1 ] = DataUtils.toHalfFloat( Math.min( sourceArray[ sourceOffset + 1 ] * scale, 65504 ) );
			destArray[ destOffset + 2 ] = DataUtils.toHalfFloat( Math.min( sourceArray[ sourceOffset + 2 ] * scale, 65504 ) );
			destArray[ destOffset + 3 ] = DataUtils.toHalfFloat( 1 );

		};

		const byteArray = new Uint8Array( buffer );
		byteArray.pos = 0;
		const rgbe_header_info = RGBE_ReadHeader( byteArray );

		if ( RGBE_RETURN_FAILURE !== rgbe_header_info ) {

			const w = rgbe_header_info.width,
				h = rgbe_header_info.height,
				image_rgba_data = RGBE_ReadPixels_RLE( byteArray.subarray( byteArray.pos ), w, h );

			if ( RGBE_RETURN_FAILURE !== image_rgba_data ) {

				let data, type;
				let numElements;

				switch ( this.type ) {

					case FloatType:

						numElements = image_rgba_data.length / 4;
						const floatArray = new Float32Array( numElements * 4 );

						for ( let j = 0; j < numElements; j ++ ) {

							RGBEByteToRGBFloat( image_rgba_data, j * 4, floatArray, j * 4 );

						}

						data = floatArray;
						type = FloatType;
						break;

					case HalfFloatType:

						numElements = image_rgba_data.length / 4;
						const halfArray = new Uint16Array( numElements * 4 );

						for ( let j = 0; j < numElements; j ++ ) {

							RGBEByteToRGBHalf( image_rgba_data, j * 4, halfArray, j * 4 );

						}

						data = halfArray;
						type = HalfFloatType;
						break;

					default:

						console.error( 'THREE.RGBELoader: unsupported type: ', this.type );
						break;

				}

				return {
					width: w, height: h,
					data: data,
					header: rgbe_header_info.string,
					gamma: rgbe_header_info.gamma,
					exposure: rgbe_header_info.exposure,
					type: type
				};

			}

		}

		return null;

	}

	setDataType( value ) {

		this.type = value;
		return this;

	}

	load( url, onLoad, onProgress, onError ) {

		function onLoadCallback( texture, texData ) {

			switch ( texture.type ) {

				case FloatType:
				case HalfFloatType:

					texture.encoding = LinearEncoding;
					texture.minFilter = LinearFilter;
					texture.magFilter = LinearFilter;
					texture.generateMipmaps = false;
					texture.flipY = true;

					break;

			}

			if ( onLoad ) onLoad( texture, texData );

		}

		return super.load( url, onLoadCallback, onProgress, onError );

	}

}

/** __
*    _)_|_|_
*   __) |_| | 2022
* @author lo.th / https://github.com/lo-th
*/

let isGL2 = true;
//let mode = ''

//const mats = {}

const materials = new Map();

const uniforms = {

	renderMode: { value: 2 },
    depthPacking: { value: 1 },

	time: { value: 0.0 },

	shadow: { value: 0.25 },
    shadowLuma: { value: 0 },
    shadowContrast: { value: 1 },
    shadowGamma: { value: 0.25 },
	//shadowAlpha: { value: 1.0 }

    lightSizeUV: { value: 1.3 },
    nearPlane: { value: 9.5 },
    rings:{ value: 11 },
    nSample:{ value: 17 },
    noiseIntensity:{ value: 1 },
    softness:{ value: 3 },
    
};


class Shader {

    static setGl2 ( b ) { isGL2 = b; }
    static getGl2 ( b ) { return isGL2 }

	static init ( o = {} ) {

        // Set CustomToneMapping to Uncharted2
        // source: http://filmicworlds.com/blog/filmic-tonemapping-operators/

        ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
            'vec3 CustomToneMapping( vec3 color ) { return color; }',
            `#define Uncharted2Helper( x ) max( ( ( x * ( 0.15 * x + 0.10 * 0.50 ) + 0.20 * 0.02 ) / ( x * ( 0.15 * x + 0.50 ) + 0.20 * 0.30 ) ) - 0.02 / 0.30, vec3( 0.0 ) )
            float toneMappingWhitePoint = 1.0;
            vec3 CustomToneMapping( vec3 color ) {
                color *= toneMappingExposure;
                return saturate( Uncharted2Helper( color ) / Uncharted2Helper( vec3( toneMappingWhitePoint ) ) );
            }`
        );

        //mode = o.mode

        //if( mode === 'LOW' ) return

        let s;

        this.up( o );

        {

            //defines['NUM_SAMPLES'] = 17
            //defines['NUM_RINGS'] = 11

            s = ShaderChunk.shadowmap_pars_fragment;

            s = s.replace(
                '#ifdef USE_SHADOWMAP', shadowPCSS
            );

            s = s.replace(//BasicShadowMap
                'shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );',`
                return PCSS( shadowMap, shadowCoord );
            `);

            /*s = s.replace(
                '#if defined( SHADOWMAP_TYPE_PCF )',`
                return PCSS( shadowMap, shadowCoord );
                #if defined( SHADOWMAP_TYPE_PCF )
            `)*/

            ShaderChunk.shadowmap_pars_fragment = s;

        }

		//return;

		s = ShaderChunk.common;
        s = s.replace( '#define EPSILON 1e-6', `
        	#define EPSILON 1e-6
        	uniform float shadow;
            uniform float shadowLuma;
            uniform float shadowContrast;
            uniform float shadowGamma;

            uniform int renderMode;
            uniform int depthPacking;

            varying vec2 vZW;

            float shadowValue = 1.0;
            float shadowTmp = 1.0;
            vec3 shadowColor = vec3(1.0);

            
            /*
            float color_distance( vec3 a, vec3 b){
                vec3 s = vec3( a - b );
                float dist = sqrt( s.r * s.r + s.g * s.g + s.b * s.b );
                return clamp(dist, 0.0, 1.0);
            }

            vec3 rgb2hsv(vec3 c){
                vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
                vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
                vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

                float d = q.x - min(q.w, q.y);
                float e = 1.0e-10;
                return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
            }

            vec3 hsv2rgb(vec3 c){
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }

            vec3 brightnessContrastCorrection(vec3 value, float brightness, float contrast){
                return (value - 0.5) * contrast + 0.5 + brightness;
            }

            vec3 GammaCorrection(vec3 value, float param){
                return vec3(pow(abs(value.r), param),pow(abs(value.g), param),pow(abs(value.b), param));
            }
            */

        `);

        ShaderChunk.common = s;


        /**/

        s = ShaderChunk.fog_vertex;

        s = s.replace( '#ifdef USE_FOG', `
            vZW = gl_Position.zw;
            #ifdef USE_FOG
        `);

        ShaderChunk.fog_vertex = s;


        

        

        s = ShaderChunk.lights_fragment_begin;
/*
        // point
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;', `
        	shadowTmp = 1.0;
        	shadowTmp *= all( bvec2( directLight.visible, receiveShadow ) ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
        	//directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)

        // spot
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;', `
            shadowTmp = 1.0;
        	shadowTmp *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotShadowCoord[ i ] ) : 1.0;
        	//directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)

        // direct
        s = s.replace( 'directLight.color *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;', `
            shadowTmp = 1.0;
            shadowTmp *= all( bvec2( directLight.visible, receiveShadow ) ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
            //directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `)*/

        // point
        s = s.replace( 'directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;', `
            shadowTmp = 1.0;
            shadowTmp *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;;
            //directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `);

        // spot
        s = s.replace( 'directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;', `
            shadowTmp = 1.0;
            shadowTmp *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
            //directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `);

        s = s.replace( 'directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;', `
            shadowTmp = 1.0;
            shadowTmp *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
            //directLight.color *= shadowTmp;
            shadowValue *= shadowTmp;
        `);

        ShaderChunk.lights_fragment_begin = s;

       /* s = ShaderChunk.tonemapping_fragment;

        s = s.replace( '#if defined( TONE_MAPPING )', `
            #if defined( USE_SHADOWMAP )
            gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * shadowR, Shadow);
            #endif

            #if defined( TONE_MAPPING )
        `);

        ShaderChunk.tonemapping_fragment = s;*/


        //s = ShaderChunk.fog_fragment;
        s = ShaderChunk.output_fragment;



        //s = s.replace( '#ifndef saturate', `
        //s = ShaderChunk.tonemapping_fragment;

        s = s.replace( 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );', `

            gl_FragColor = vec4( outgoingLight, diffuseColor.a );

        	#if defined( USE_SHADOWMAP )

            shadowValue = (shadowValue - 0.5) * shadowContrast + 0.5 + shadowLuma;
            shadowValue = pow(abs(shadowValue), shadowGamma );
            shadowValue = clamp( shadowValue, 0.0, 1.0 );

            shadowColor = vec3( shadowValue );




            
            /*
            vec3 invColor = vec3(1.0 - gl_FragColor.rgb);
            vec3 cc = rgb2hsv( invColor );
            cc.r += 0.1; // teint
            cc.g *= 1.0; // saturation
            cc.b *= 0.5; // luma
            invColor = hsv2rgb( cc );

            shadowColor = shadowColor + invColor;
            shadowColor = clamp( shadowColor, 0.0, 1.0 );
            */
            


            //gl_FragColor.rgb = mix( gl_FragColor.rgb, gl_FragColor.rgb * shadowColor, (1.0-shadowValue) * shadow );

            gl_FragColor.rgb *= ((1.0-shadowValue) * (1.0-shadow)) + shadowColor;


        	#endif
            
        `);

        //ShaderChunk.fog_fragment = s;
        ShaderChunk.output_fragment = s;

      //  ShaderChunk.tonemapping_fragment = s;


        //console.log('shadow modif on')

        s = ShaderChunk.dithering_fragment;

        s = s.replace( '#endif', `

            #endif

            #ifdef STANDARD

            if( renderMode == 1 ){ 
                float fz = 0.5 * vZW[0] / vZW[1] + 0.5;
                gl_FragColor = depthPacking == 1 ? packDepthToRGBA( fz ) : vec4( vec3( 1.0 - fz ), opacity );// depth render
            }
            if( renderMode == 2 ) gl_FragColor = vec4(  packNormalToRGB( normal ), opacity );// normal render
            if( renderMode == 3 ) gl_FragColor = vec4(  shadowColor, opacity );// normal render

            #else

            if( renderMode != 0 ) discard;

            #endif

        `);

        ShaderChunk.dithering_fragment = s;



        s = ShaderChunk.color_vertex;
        s = s.replace( 'vColor.xyz *= instanceColor.xyz;', `vColor.xyz = instanceColor.xyz;`);
        ShaderChunk.color_vertex = s;






		//this.shaders=[];
		//this.uniforms = {};

	}

    static add ( m ) {

        //mats[m.name] = m
        let name = m.name;
        if ( materials.has( name ) ) { 
            //console.log('already add', name)
            return 
        }
       // else console.log('add', name)
        materials.set( name, true );
        
        m.shadowSide = DoubleSide;


        //m.format = sRGBEncoding;
        if(!m.isEncod){
            if( m.map ) m.map.encoding = sRGBEncoding;
            m.color.convertSRGBToLinear();
            m.isEncod = true;
        }

        m.onBeforeCompile = function ( shader ) {
            Shader.modify( shader );
        };

        /*if(!m.defines){ 
            m.defines = defines
        } else {
            Shader.setDefines( m )
        }*/
         //

    } 

    static refresh () {

      /* console.log( 'refresh', materials )

        materials.forEach( (value, key)=>{


            //console.log( value, key )



            value.needsUpdate = true 

        })*/
    }

    static setDefines ( m ) {
        
        //for( var o in defines ) m.defines[o] = defines[o]

        //if(!mats[m.name]) mats[m.name] = m

       // console.log(m.name)

    }


    static modify ( s ) {

       // if( mode === 'LOW' ) return

       //shaders.push( s );
       // apply global uniform
       for( let n in uniforms ){

       	    s.uniforms[n] = uniforms[n];

       }

       // start add

       /*let fragment = s.fragmentShader;

        fragment.replace( 'vec4 diffuseColor = vec4( diffuse, opacity );', `
            vec4 diffuseColor = vec4( diffuse, opacity );
            vec3 shadowR = vec3(1.0);
        `);
        s.fragmentShader = fragment;*/

    }

    static up ( o ) {

        //if( mode === 'LOW' ) return

        for( let n in o ){

            if( uniforms[n] ){ 
                if( uniforms[n].value.isColor ) uniforms[n].value.setHex( o[n] );
                else uniforms[n].value = o[n];

            }

            /*if( defines[n] ){

                for( let m in mats ){ 
                    console.log(m)
                    mats[m].defines[n] = o[n]
                }

            }*/
            

        }

    	/*for ( let s of shaders ){

    		for( let n in o ){

    			if( s.uniforms[n] ){ 
                    if( s.uniforms[n].value.isColor ) s.uniforms[n].value.setHex( o[n] );
                    else s.uniforms[n].value = o[n];

                }
    		}

    	}*/

    }

    static reset (){
        materials.clear();
    }

}



const shadowPCSS = `
#ifdef USE_SHADOWMAP

uniform float lightSizeUV;
uniform float nearPlane;
uniform float rings;
uniform int nSample;
uniform float noiseIntensity;
uniform float softness;

//#define LIGHT_WORLD_SIZE 0.005
//#define LIGHT_FRUSTUM_WIDTH 3.75
//#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)
//#define NEAR_PLANE 9.5

#define NUM_SAMPLES 17

vec2 poissonDisk[32];

void initPoissonSamples( const in vec2 randomSeed ) {

    int numSample = nSample;

    float ANGLE_STEP = PI2 * rings / float( numSample );
    float INV_NUM_SAMPLES = 1.0 / float( numSample );

    // jsfiddle that shows sample pattern: https://jsfiddle.net/a16ff1p7/
    float angle = rand( randomSeed ) * PI2 * noiseIntensity;
    float radius = INV_NUM_SAMPLES;
    float radiusStep = radius;

    for( int i = 0; i < numSample; i ++ ) {
        poissonDisk[i] = vec2( cos( angle ), sin( angle ) ) * pow( radius, 0.75 );
        radius += radiusStep;
        angle += ANGLE_STEP;
    }
}

float penumbraSize( const in float zReceiver, const in float zBlocker ) { // Parallel plane estimation
    return (zReceiver - zBlocker) / zBlocker;
}

float findBlocker( sampler2D shadowMap, const in vec2 uv, const in float zReceiver, float ls ) {

    // This uses similar triangles to compute what
    // area of the shadow map we should search
    float searchRadius = ls * ( zReceiver - nearPlane ) / zReceiver;
    float blockerDepthSum = 0.0;
    int numBlockers = 0;
    int numSample = nSample;
    float shadowMapDepth = 0.0;

    for( int i = 0; i < numSample; i++ ) {
        shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));
        if ( shadowMapDepth < zReceiver ) {
            blockerDepthSum += shadowMapDepth;
            numBlockers ++;
        }
    }

    if( numBlockers == 0 ) return -1.0;

    return blockerDepthSum / float( numBlockers );

}

float PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius ) {
    
    /*int numSample = nSample;
    float sum = 0.0;
    float depth;
    #pragma unroll_loop_start
    for( int i = 0; i < 17; i ++ ) {
        depth = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
        if( zReceiver <= depth ) sum += 1.0;
    }
    #pragma unroll_loop_end
    #pragma unroll_loop_start
    for( int i = 0; i < 17; i ++ ) {
        depth = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
        if( zReceiver <= depth ) sum += 1.0;
    }
    #pragma unroll_loop_end
    return sum / ( 2.0 * float( 17 ) );*/

    int numSample = nSample;
    float sum = 0.0;
    float top = 0.0;
    float low = 0.0;
    #pragma unroll_loop_start
    for( int i = 0; i < 17; i ++ ) {
        top = unpackRGBAToDepth( texture2D( shadowMap, uv + poissonDisk[ i ] * filterRadius ) );
        low = unpackRGBAToDepth( texture2D( shadowMap, uv + -poissonDisk[ i ].yx * filterRadius ) );
        if( zReceiver <= top ) sum += 1.0;
        if( zReceiver <= low ) sum += 1.0;
    }
    #pragma unroll_loop_end
    return sum / ( 2.0 * float( 17 ) );
}

float PCSS ( sampler2D shadowMap, vec4 coords ) {

    vec2 uv = coords.xy;
    float zReceiver = coords.z; // Assumed to be eye-space z in this code
    //float lightSizeUV = LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH;

    float ls = lightSizeUV * 0.001;

    initPoissonSamples( uv );
    // STEP 1: blocker search
    float avgBlockerDepth = findBlocker( shadowMap, uv, zReceiver, ls );

    //There are no occluders so early out (this saves filtering)
    if( avgBlockerDepth == -1.0 ) return 1.0;

    // STEP 2: penumbra size
    float penumbraRatio = penumbraSize( zReceiver, avgBlockerDepth );
    float filterRadius = penumbraRatio * ls * nearPlane / zReceiver;

    // STEP 3: filtering
    //return avgBlockerDepth;
    return PCF_Filter( shadowMap, uv, zReceiver, filterRadius );
}
`;

const GlbTool = {

	getMesh:(scene) => {
        let meshs = {};
        scene.traverse( function ( child ) {
            if ( child.isMesh ) meshs[ child.name ] = child;
        });
        return meshs;
    },

    getGroup:( scene, autoMesh, autoMaterial ) => {
        const groups = {};
        let mats = null;
        scene.traverse( function ( child ) {
            if ( child.isGroup ){ 
            	if( autoMaterial ) mats = GlbTool.getMaterial( scene, true ); 
            	groups[ child.name ] = autoMesh ? GlbTool.groupToMesh(child, mats) : child;
            }
        });
        return groups;
    },

    // Material should be name like 
    // 0_concret
    // 10_silver ...

    getMaterial:( scene, toArray ) => {
    	const Mats = {};
        const mats = []; 
        let m, n;
        scene.traverse( function ( child ) {
            if ( child.isMesh ){ 
            	m = child.material;
            	if( !Mats[m.name] ){
            		Shader.add( m );
            		Mats[m.name] = m;
            		n = Number( m.name.substring( 0, m.name.lastIndexOf('_') )  );
            		mats[n] = m;
            	}
            }
        });
        return toArray ? mats : Mats;
    },

    groupToMesh: ( group, autoMaterial ) => {

    	if( group.children[0].name !== (group.name + '_1') ) return group
    	if( !group.children[0].isMesh ) return group

    	let g = [];
		let lng = group.children.length, n = 0, mName;

		for( let i = 0; i<lng; i++ ){

			mName = group.children[i].material.name;
		
			n = Number( mName.substring( 0, mName.lastIndexOf('_') )  );
			group.children[i].material.dispose();

			g[i] = group.children[i].geometry;
			g[i].forceMatId = n;
		}

		let mesh = new THREE.Mesh( new mergeBufferGeometries( g, true ), autoMaterial );
		mesh.name = group.name;

		return mesh

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


    autoMorph: ( meshName, fullAttribute ) => {

		let m, name, tName, target, id, g;

		// get mesh list
		let meshs = Pool.getMesh( meshName );

		
		for( let n in meshs ){

			m = meshs[n];
			name = m.name;

			if( name.search("__morph__") !== -1  ) {

				target = meshs[ name.substring( 0, name.indexOf('__') ) ];
				tName = name.substring( name.lastIndexOf('__') + 2 );

				// apply Morph

				if( target ){

					if( !target.userData.morph ){
						target.userData['morph'] = {};
						target.material.morphTargets = true;
					}

					g = target.geometry;

					//console.log( g.attributes.position.count, m.geometry.attributes.position.count )

					if( g.attributes.position.count === m.geometry.attributes.position.count ){

						if( !g.morphAttributes.position ) g.morphAttributes.position = [];
						id = g.morphAttributes.position.length;
						g.morphAttributes.position.push( m.geometry.attributes.position );

						// extra attribute

						if( fullAttribute ){

							for( let a in  m.geometry.attributes ){
								if( a !== 'position' && g.attributes[a] ){
									if( !g.morphAttributes[a] ) g.morphAttributes[a] = [];
									g.morphAttributes[a][id] = m.geometry.attributes[a];
								}
							}

						}

						// clear morph mesh
					    m.parent.remove( m );
					    m.material.dispose();
						m.geometry.dispose();

						// update target
						target.updateMorphTargets();

						// add morph reference by name
						target.userData.morph[ tName ] = id;

					} else {

						console.warn('this morph target is not good : ', tName);

					}

				}

			}

		}


	},




};

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/

const Pool$1 = {
    msg:'',
    inLoad:false,
    clip:[],
    data: new Map(),
    tmp: [],
    extraTexture: [],
    dracoLoader: null,
    dracoLoaderType:'js',

    dispose:() => {

        //console.log('clear extra texture !!')
        let i = Pool$1.extraTexture.length;
        while(i--){
            Pool$1.get( Pool$1.extraTexture[i], 'T' ).dispose();
            Pool$1.delete( Pool$1.extraTexture[i], 'T' );
        }
        Pool$1.extraTexture = [];
    
    },
    
    createElementNS: ( name ) => ( document.createElementNS( 'http://www.w3.org/1999/xhtml', name ) ),
    exist: ( name, type = '' ) => ( Pool$1.get( name, type ) ? true : false ),
    delete: ( name, type = '' ) => ( Pool$1.data.delete( Pool$1.prefix( type ) + name ) ),
    get: ( name, type = '' ) => ( Pool$1.data.get( Pool$1.prefix( type ) + name ) ),

    set: ( name, node, type = '' ) => {
        if( node.isMaterial ){ 
            type = 'material';
            node.name = name;
        }
        if( node.isTexture ) type = 'texture';
        if( node.isObject3D ) type = 'object3d';
        
        if( Pool$1.get( name, type ) ) return
        Pool$1.data.set( Pool$1.prefix( type ) + name, node );
    },

    getScript: ( name ) => ( Pool$1.data.get( Pool$1.prefix( 'js' ) + name ) ),

    getMaterials:( obj, toArray ) => {
        if( typeof obj === 'string' ) obj = Pool$1.get( obj, 'O' );
        return GlbTool.getMaterial( obj, toArray )
    },

    getMesh:( obj ) => {
        if( typeof obj === 'string' ) obj = Pool$1.get( obj, 'O' );
        return GlbTool.getMesh( obj )
    },

    getGroup:( obj, autoMesh, autoMaterial ) => {
        if( typeof obj === 'string' ) obj = Pool$1.get( obj, 'O' );
        return GlbTool.getGroup( obj, autoMesh, autoMaterial )
    },

    add: ( name, node, type ) => {
        Pool$1.set( name, node, type );
        Pool$1.next();
        //console.log( name, type )
    },

    getMaterial:( name ) => ( Pool$1.data.get( 'M_' + name ) ),

    //getMap:( name, o = {} ) => ( Pool.getTexture(name, o) ),

    directTexture:( url, o = {} ) => {

        if( !Pool$1.loaderMap ) Pool$1.loaderMap = new TextureLoader();

        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );

        if( Pool$1.exist( name, 'texture') ) return Pool$1.get( name, 'texture' );
            
        return Pool$1.loaderMap.load( url, function ( txt ) { 

            Pool$1.setTextureOption( txt, o );
            //Pool.set( name , txt );
            Pool$1.data.set( 'T_' + name, txt );
            Pool$1.extraTexture.push( name );
            if( o.callback ) o.callback();
            return txt
            
        })

    },

    getTexture:( name, o = {} ) => {

        let t = Pool$1.get( name, 'texture' );
        if(!t){
            let im = Pool$1.data.get( 'I_' + name );
            if(!im) return null
            t = new Texture( im );
            if( name.search('_c') !== -1) o.encoding = true;
        }
        Pool$1.setTextureOption( t, o );
        return t
    },

    setTextureOption:( t, o = {} ) => {
        if( o.encoding ) t.encoding = sRGBEncoding;
        t.flipY = ( o.flipY || o.flip ) !== undefined ? o.flipY : false;
        if( o.anisotropy !== undefined ) t.anisotropy = o.anisotropy;
        if( o.generateMipmaps !== undefined ) t.generateMipmaps = o.generateMipmaps;
        if( o.repeat ){
            t.repeat.fromArray( o.repeat );
            t.wrapS = t.wrapT = RepeatWrapping;
        }
        if( o.filter ){
            if( o.filter === 'near' ){
                t.minFilter = NearestFilter;
                t.magFilter = NearestFilter;
            }
        }
        t.needsUpdate = true;
    },

    prefix:( type ) => {
        let p = '';
        switch( type ){
            case 'S': case 'sound': case 'mp3': case 'wav': case 'ogg': p = 'S_';  break;
            case 'I': case 'image': case 'jpg': case 'png': p = 'I_';  break;
            case 'E': case 'hdr': case 'env': p = 'T_';  break;
            case 'J': case 'json': p = 'J_';  break;
            case 'JS': case 'js': p = 'JS_';  break;
            
            case 'O': case 'object3d': p = 'O_';  break;
            case 'M': case 'material': p = 'M_';  break;
            case 'T': case 'texture': p = 'T_';  break;
        }
        return p
    },

    ///

    log: ( msg ) => {},

    ///

    load: ( Urls, Callback, Path = '', msg = '' ) => {

        Pool$1.msg = msg;

        let urls = [];
        let callback = Callback || function(){};
        let start = ( typeof performance === 'undefined' ? Date : performance ).now();

        if ( typeof Urls === 'string' || Urls instanceof String ) urls.push( Urls );
        else urls = urls.concat( Urls );

        Pool$1.tmp.push( { urls:urls, path:Path, callback:callback, start:start } );

        if( !Pool$1.inLoad ) Pool$1.loadOne();

    },

    loadOne: () => {

        Pool$1.inLoad = true;

        let url = Pool$1.tmp[0].path + Pool$1.tmp[0].urls[0];
        let name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') );
        let type = url.substring( url.lastIndexOf('.')+1 ).toLowerCase();

        if( Pool$1.exist( name, type ) ) Pool$1.next();
        else Pool$1.loading( url, name, type );

    },

    next: () => {

        Pool$1.tmp[0].urls.shift();

        if( Pool$1.tmp[0].urls.length === 0 ){

            Math.floor(( typeof performance === 'undefined' ? Date : performance ).now() - Pool$1.tmp[0].start);

            //if( end !== 0 ) console.log( 'pool load time:', end, 'ms' );
            
            Pool$1.tmp[0].callback();
            Pool$1.tmp.shift();

            if( Pool$1.tmp.length > 0 ) Pool$1.loadOne();
            else Pool$1.inLoad = false;

        } else {

            Pool$1.loadOne();

        }

    },

    loading: ( url, name, type ) => {

        switch( type ){
            case 'glb': case 'gltf': Pool$1.load_GLTF( url, name );  break;
            case 'fbx': case 'FBX': Pool$1.load_FBX( url, name ); break;
            case 'hdr': Pool$1.load_RGBE( url, name ); break;
            default: Pool$1.extand( url, name, type );
        }

    },

    extand: ( url, name, type ) => {

        if( !Pool$1.XHTTP ) Pool$1.XHTTP = new XMLHttpRequest();
        const xml = Pool$1.XHTTP;

        xml.open('GET', url, true );
        if(type === "json") xml.overrideMimeType( "application/json");

        switch( type ){

            case 'hex': case 'wasm': case 'mp3': case 'wav': case 'ogg': case 'jpg': case 'png': xml.responseType = "arraybuffer"; break;
            case 'bvh': case 'glsl': case 'js':  case 'json': xml.responseType = 'text'; break;

        }

        xml.onreadystatechange = function () {

            if ( xml.readyState === 4 ) {
            	if (xml.status >= 300) {
                    console.log("Error, status code = " + xml.status);
                } else {
                	Pool$1.direct( xml.response, name, type );
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
        	    let img = Pool$1.createElementNS('img');
	            img.src = window.URL.createObjectURL( new Blob([response]) );
	            Pool$1.add( name, img, 'image' );
        	break;
            case 'mp3': case 'wav': case 'ogg':
                AudioContext.getContext().decodeAudioData(
                    response.slice( 0 ),
                    function( buffer ){ Pool$1.add( name, buffer, 'sound' ); },
                    function( error ){ console.error('decodeAudioData error', error); }
                );
            break;
            case 'hex': LzmaUnpack.parse( response, function ( result ) { Pool$1.add( name, result, type ); }); break;
            case 'wasm': Pool$1.add( name, new Uint8Array( response ), type ); break;
            case 'json': Pool$1.add( name, JSON.parse( response ), type ); break;
            case 'js': Pool$1.add( name, response, type ); break;
            default: Pool$1.add( name, response, type );

        }

    },

    //////////////////////////////////

    loaderDRACO: () => {

        Pool$1.dracoLoader = new DRACOLoader().setDecoderPath( './src/libs/draco/' );
        Pool$1.dracoLoader.setDecoderConfig( { type: Pool$1.dracoLoaderType } );
        return Pool$1.dracoLoader

    },

    loaderGLTF: () => {

        if( !Pool$1.GLTF ) Pool$1.GLTF = new GLTFLoader();
        return Pool$1.GLTF

    },

    loaderFBX: () => {

        if( !Pool$1.FBX ) Pool$1.FBX = new FBXLoader();
        return Pool$1.FBX

    },

    loaderRGBE: () => {

        if( !Pool$1.RGBE ) Pool$1.RGBE = new RGBELoader();
        return Pool$1.RGBE

    },

    //////////////////////////////////

    load_GLTF: ( url, name ) => {

        Pool$1.loaderGLTF().setDRACOLoader( Pool$1.loaderDRACO() ).load( url, function ( gltf ) { 
            Pool$1.add( name, gltf.scene );
            Pool$1.dracoLoader.dispose();
        });

    },

    load_FBX: ( url, name ) => {

        Pool$1.loaderFBX().load( url, function ( node ) { Pool$1.add( name, node ); });

    },

    load_RGBE: ( url, name ) => {

        Pool$1.loaderRGBE().load( url, function ( texture ) {
            texture.mapping = EquirectangularReflectionMapping; 
            Pool$1.add( name, texture ); 
        });

    }

};

class Landscape extends Mesh {

    constructor( o = {} ) {

        super();

        this.ready = false;

        this.type = 'terrain';
        this.name = o.name;

        this.mapN = 0;
        this.mapMax = 6;

        // terrain, water, road
        this.ttype = o.terrainType || 'terrain';

        this.callback = o.callback || function(){};
        
        this.physicsUpdate = () => {};

        this.uvx = [ o.uv || 18, o.uv || 18 ];


        this.sample = o.sample == undefined ? [128,128] : o.sample;
        this.size = o.size === undefined ? [100,30,100] : o.size;

        this.data = {
            level: o.level || [1,0.2,0.05],
            frequency: o.frequency || [0.016,0.05,0.2],
            expo: o.expo || 1,
        };

        this.isWater = o.water || false;

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

        this.lng = this.sample[0] * this.sample[1];
        var sx = this.sample[0] - 1;
        var sz = this.sample[1] - 1;
        this.rx = sx / this.size[0];
        this.rz = sz / this.size[2];
        this.ratio = 1 / this.sample[0];
        this.ruvx =  1.0 / ( this.size[0] / this.uvx[0] );
        this.ruvy = - ( 1.0 / ( this.size[2] / this.uvx[1] ) );

        this.is64 = o.is64 || false;

        this.isTurn = o.turn || false;

        this.heightData = new Float32Array( this.lng );//[]//new Float64Array( this.lng )//[];//this.is64 ? new Float64Array( this.lng ) : new Float32Array( this.lng );
        this.height = [];

        this.isAbsolute = o.isAbsolute || false;
        this.isReverse = o.isReverse || false;
        this.isTurned = o.isTurned || false;

        this.changeId = this.isReverse || this.isTurned;
       // console.log(this.changeId)


        if( this.changeId ) this.getReverseID();

        this.colors = new Float32Array( this.lng * 3 );
        this.geometry = new PlaneGeometry( this.size[0], this.size[2], this.sample[0] - 1, this.sample[1] - 1 );
        this.geometry.rotateX( -math.PI90 );
        //if( this.isTurn ) 
        //this.geometry.rotateY( -math.PI90 );
        //if( this.isTurned ) this.geometry.rotateY( math.PI90 );


       // this.geometry.computeBoundingSphere();

        this.geometry.setAttribute( 'color', new BufferAttribute( this.colors, 3 ) );
        //this.geometry.setAttribute( 'uv2', this.geometry.attributes.uv );
        this.vertices = this.geometry.attributes.position.array;
        var clevels = new Quaternion( 0.95, 0.8, 0.1, 0.05 ); 
        if( o.maplevels ) clevels.fromArray( o.maplevels );
        var T = TerrainShader;
        var maps = o.maps || [ 'sand', 'grass', 'rock' ], txt = {};
        var name;

        if(this.isWater) maps = ['water'];

        for( let i in maps ){

            name = maps[i];

            txt[name] = Pool$1.directTexture('./assets/textures/terrain/'+name+'.jpg', { flip:false, repeat:this.uvx, encoding:o.encoding || true , callback: this.mapcallback.bind(this)  });
            txt[name+'_n'] = Pool$1.directTexture('./assets/textures/terrain/'+name+'_n.jpg', { flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });
           // if( isORM )txt[name+'_n'] = Pool.directTexture('./assets/textures/terrain/'+name+'_n.jpg', { flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });

        }

        this.txt = txt;

        this.material = new MeshStandardMaterial({ name:'terrain', vertexColors:true, color:0xFFFFFF, map:txt[maps[0]], normalMap:txt[maps[0]+'_n'] });

        if( o.envmap !== undefined ) this.material.envMap = o.envmap; 

        if( this.isWater ){
            this.material.transparent = true;
            this.material.opacity = o.opacity || 0.4;
            this.material.side = DoubleSide;
            this.material.alphaMap = txt[maps[0]];
            this.material.map = null;
            this.material.metalnes  = 0.9;
            this.material.roughness = 0.1;
        } else {
            this.material.metalnes  = 0.25;
            this.material.roughness = 0.7; 
        }

        var ns = o.nScale || 1;
        this.material.normalScale.set(ns,ns);

        if( !this.isWater ){

            this.material.onBeforeCompile = function ( shader ) {

                var uniforms = shader.uniforms;

                //uniforms['fogTime'] = { value: 0 };

                uniforms['clevels'] = { value: clevels };

                uniforms['map1'] = { value: txt[maps[1]] };
                uniforms['map2'] = { value: txt[maps[2]] };

                uniforms['normalMap1'] = { value: txt[maps[1]+'_n'] };
                uniforms['normalMap2'] = { value: txt[maps[2]+'_n'] };

                shader.uniforms = uniforms;

                var fragment = shader.fragmentShader;

                fragment = fragment.replace( 'uniform vec3 diffuse;', T.baseRemplace );

                fragment = fragment.replace( '#include <map_fragment>', T.map );
                fragment = fragment.replace( '#include <normal_fragment_maps>', T.normal );
                fragment = fragment.replace( '#include <color_fragment>', '' );
                
                shader.fragmentShader = fragment;

                //if( o.shader ) o.shader.modify( shader );

                Shader.modify( shader );

            };

        } else {

            this.material.onBeforeCompile = function ( shader ) {

                var fragment = shader.fragmentShader;

                fragment = fragment.replace( '#include <alphamap_fragment>', T.alphamap );
           
                shader.fragmentShader = fragment;

            };

        }


        //THREE.Mesh.call( this, this.geometry, this.material );

       // super( this.geometry, this.material );

        if(o.debuger){
            var debuger = new Mesh( this.geometry, new MeshBasicMaterial({  vertexColors:VertexColors, wireframe:true, transparent:true, opacity:0.25 } ));
            this.add( debuger );
        }

        //root.garbage.push( this.geometry );
        

        if( this.wantBorder ) this.addBorder( o );
        if( this.wantBottom ) this.addBottom( o );

        if( o.pos ) this.position.fromArray( o.pos );

        // rotation is in degree or Quaternion
        o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
        if( o.rot !== undefined ){ o.quat = math.toQuatArray( o.rot ); delete o.rot; }
        //console.log(o.quat)
        this.quaternion.fromArray( o.quat );

        if( o.decal ) this.position.y += o.decal;

        this.castShadow = true;
        this.receiveShadow = true;

        this.update();

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
        geometry.rotateX( math.PI90 );
        

        this.bottomMesh = new Mesh( geometry, this.borderMaterial );

        this.add( this.bottomMesh );

        this.isBottom = true;
    }

    addBorder ( o ){

    	this.borderMaterial = new MeshStandardMaterial({ 

    		vertexColors: VertexColors, 
    		metalness: this.isWater ? 0.8 : 0.4, 
       		roughness: this.isWater ? 0.2 : 0.6, 
       
            //envMap: view.getEnvMap(),
            //normalMap:this.wn,
            normalScale:this.isWater ?  [0.25,0.25]:[-1,-1],
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
        back.rotateY( -math.Pi );
        back.translate( 0,1, -this.size[2]*0.5);
        left.rotateY( -math.PI90 );
        left.translate( -this.size[0]*0.5,1, 0);
        right.rotateY( math.PI90 );
        right.translate( this.size[0]*0.5,1, 0);

        this.borderGeometry = mergeVertices( mergeBufferGeometries( [ front, back, left, right ] ) );
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

    findId( x, z ){

        return x+(z*this.sample[1]) //|| 1;

    }

    findId2( x, z ){

        return z+(-x*this.sample[0]) || 1;

    }

    findId3( x, z ){

        return z+(x*this.sample[0]) //|| 1;

    }

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

        let i = this.lng, x, z;
        const sz = this.sample[1] - 1;
        this.sample[0] - 1;

        while(i--){
            x = i % this.sample[0];
            z = Math.floor( i * this.ratio );
            if( this.isReverse ) z = sz - z;
            //xr = sx - x;
            //this.invId[i] = this.findId( x, sz - z )//
            this.invId[i] = this.isTurned ?  (this.lng-1)-this.findId( z, x ) : this.findId( x, z );

            //console.log(i, this.findId( x, sz - z ), (this.lng-1)-this.findId( z, x ))
        }

    }

    update ( wait ) {


        if( this.isWater ){ 
            this.material.normalMap.offset.x+=0.002;
            this.material.normalMap.offset.y+=0.001;
        } else {

            if(this.material.map){
                this.material.map.offset.x = this.local.x * this.ruvx;
                this.material.map.offset.y = this.local.z * this.ruvy;
            }
            
        }

        let v = this.pp;
        let cc = [1,1,1];
        let i = this.lng, n, x, z,  c, id, result;
        let oldz, oldh, ccY, ccc;

        while( i-- ){


            n = i * 3;
            x = i % this.sample[0];
            z = Math.floor( i * this.ratio );

            v.set( x + ( this.local.x*this.rx ), this.local.y, z + ( this.local.z*this.rz ) );

            c = math.noise( v, this.data );



            //c = Math.quinticSCurve(c);
            //c = Math.cubicSCurve(c)
            //c = Math.linear(c,0.2, 1);
            //c = Math.clamp(c,0.2,1)

            c = Math.pow( c, this.data.expo );

            c = c>1 ? 1:c;
            c = c<0 ? 0:c;
            
            


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

            id = this.changeId ? this.invId[i] : i;
            result = this.isAbsolute ? c : c * this.size[1];

            // for physics
            this.heightData[ id ] = result;

            ccY = (c * this.size[ 1 ]) + this.deep;

            

            this.vertices[ n + 1 ] = ccY;

            if( this.isWater ){

                cc = [ c * this.colorBase.r, c * this.colorBase.g, c * this.colorBase.b ];

            } else {

                cc = [ c, 0, 0];

            }

            ccc = math.clamp(cc[0]+0.25, 0.25, 1);

            this.colors[ n ] = ccc;
            this.colors[ n + 1 ] = ccc;
            this.colors[ n + 2 ] = ccc;
            //oldx = x;
            

        }


        if( this.isBorder ){

            let j = this.lng2, h;
            while(j--){
                n = j*3;
                if(this.list[j]!==-1){
                    h = this.height[ this.list[j] ];
                    this.borderVertices[n+1] = (h * this.size[1]) + this.deep;
                    ccc = math.clamp(h+0.25, 0.25, 1);
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

        this.updateGeometry();

        

        if(this.ready) this.physicsUpdate( this.heightData );

        this.ready = true;

        //if( phy ) root.view.update( { name:'terra', heightData:this.heightData, sample:this.sample } );

    }

    updateGeometry () {

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.computeVertexNormals();

 
        if( this.isBorder ){
        	this.borderGeometry.attributes.position.needsUpdate = true;
            this.borderGeometry.attributes.color.needsUpdate = true;
        }

    }

}

// SHADERS

const TerrainShader = {

    baseRemplace : /* glsl */`
        uniform vec3 diffuse; 
        uniform vec4 clevels;

        uniform sampler2D normalMap1;
        uniform sampler2D normalMap2;

        uniform sampler2D roughnessMap1;
        uniform sampler2D roughnessMap2;

        uniform float aoMapIntensity;
        uniform sampler2D map1;
        uniform sampler2D map2;

        vec4 MappingMix( float slope, vec4 level, vec4 rocks, vec4 grasss, vec4 sands ){
            vec4 cc = rocks;
            if (slope < level.y) cc = grasss;
            if (slope < level.z) cc = sands;
            if (( slope < level.x ) && (slope >= level.y)) cc = mix( grasss , rocks, (slope - level.y) * (1. / (level.x - level.y)));
            if (( slope < level.y ) && (slope >= level.z)) cc = mix( sands , grasss, (slope - level.z) * (1. / (level.y - level.z)));
            return cc;
        }
    `,

    rough : /* glsl */`
        float roughnessFactor = roughness;
        float metalnessFactor = metalness;
        #ifdef USE_ROUGHNESSMAP

            vec4 sandR = texture2D( roughnessMap, vUv );
            vec4 grassR = texture2D( roughnessMap1, vUv );
            vec4 rockR = texture2D( roughnessMap2, vUv );

            vec4 baseColorR = MappingMix( vColor.r, clevels, rockR, grassR, sandR );
            // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
            float ambientOcclusion =( baseColorR.r - 1.0 ) * aoMapIntensity + 1.0;
            roughnessFactor *= baseColorR.g;
            metalnessFactor *= baseColorR.b;
        #endif
    `,

    // ao

    ao : /* glsl */`
        reflectedLight.indirectDiffuse *= ambientOcclusion;
        #if defined( USE_ENVMAP ) && defined( STANDARD )
            float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
            reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );
        #endif
    `,

    // map

    map : /* glsl */`
        #ifdef USE_MAP
            vec4 sand = texture2D( map, vUv );
            vec4 grass = texture2D( map1, vUv );
            vec4 rock = texture2D( map2, vUv );

            vec4 baseColor = MappingMix(vColor.r, clevels, rock, grass, sand);
            diffuseColor *= baseColor;

        #endif
    `,

    // normal

    normal : /* glsl */`
        #ifdef USE_NORMALMAP
            vec4 sandN =  texture2D( normalMap, vUv );
            vec4 grassN = texture2D( normalMap1, vUv );
            vec4 rockN = texture2D( normalMap2, vUv );

            vec3 extraNormal = MappingMix(vColor.r, clevels, rockN, grassN, sandN).xyz * 2.0 - 1.0;
            extraNormal.xy *= normalScale;
            normal = perturbNormal2Arb( -vViewPosition, normal, extraNormal, faceDirection );
        #endif
    `,

    alphamap : /* glsl */`
        #ifdef USE_ALPHAMAP
            diffuseColor.a = opacity +( texture2D( alphaMap, vUv ).g * opacity) * (1.0-opacity);
        #endif
    `,
    
};

// THREE TERRAIN

class Terrain extends Item {

	constructor() {

		super();

		this.Utils = Utils;
		this.type = 'terrain';

	}

	add ( o = {} ) {

		this.setName( o );

		if( root.engine === 'PHYSX'){
			o.isAbsolute = true;
			o.isTurned = true;
		}

		const t = new Landscape( o );

		// add to world
		this.addToWorld( t, o.id );

        // add to physics
        root.post({ m:'add', o:toPhysics(t) });

		return t

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name );
		if( b === null ) return

	}
	
}

const toPhysics = function( t ) {

	const o = {
		name:t.name,
		type:t.type,
		pos:t.position.toArray(),
		quat:root.engine === 'PHYSX' ? [0,0,0,1]:t.quaternion.toArray(), // physx terrain can't turn !!
	};

	if( root.engine === 'PHYSX' || root.engine === 'AMMO' ){
		o.type = 'terrain';
		o.size = t.size;
		o.sample = t.sample;
		o.heightData = t.heightData;
	} else {
		o.type = 'mesh';
		o.v = math$1.getVertex( t.geometry, root.engine === 'OIMO' );
		o.index = root.engine === 'OIMO' ? null : math$1.getIndex( t.geometry );
	}

	return o

};

class Solver extends Item {

	constructor () {

		super();

		this.Utils = Utils;
		this.type = 'solver';

	}

	step ( AR, N ) {

		let i = this.list.length, n, s, j, k=0, m;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * Num[this.type] );

			if( s.needData ){

				for( j of s.joints ){

					m = n + (k*7);

					j.data.target.x = AR[ m + 0];
					j.data.target.y = AR[ m + 1];
					j.data.target.z = AR[ m + 2];

					j.data.target.twiwt = Math.round( AR[ m + 3] );
					j.data.target.swing1 = Math.round( AR[ m + 4] );
					j.data.target.swing2 = Math.round( AR[ m + 5] );

					j.data.target.count = AR[ m + 6];

					k++;

				}

			}

		}

	}

	///

	add ( o = {} ) {

		this.setName( o );

        let solver = new Articulation( o );

        // add to world
		this.addToWorld( solver, o.id );

        // add to worker
        root.post({ m:'add', o:o });
        //root.post({ m:'addSolver', o:o });

        //console.log( 'solver is add', o )

        return solver;


	}

	set ( o = {} ) {

	}

}

// ARTICULATION SOLVER

class Articulation extends Object3D {

	constructor( o ) {

		super();

		this.name = o.name;
		this.type = 'solver';

		this.needData = o.needData || false;

		this.chain = new THREE.Group();
		this.joints = [];
		this.jid = 0;

		this.add( this.chain );

		//this.bones = {};

	}

	start (){

		root.post({ m:'startArticulation', o:{ name:this.name } });

	}

	commonInit (){

		root.post({ m:'commonInitArticulation', o:{ name:this.name } });

	}

	addJoint ( o ) {

		this.jid = this.joints.length;

		o.name = o.name || ( this.name + '_Joint_' + this.jid );
		o.solver = this.name;
		
		this.joints.push( new SolverJoint( o, this ) );

		root.post({ m:'addSolverJoint', o:o });

	}

	addBone ( mesh ) {

		this.chain.add( mesh );
		//this.bones[ mesh.name ] = mesh;

	}

	release () {

		root.destroy( this.chain );

	}

	driveJoints ( dt ) {

		let isInDrive = false;

		for( let j of this.joints ){ 

			j.update( dt );
			isInDrive = j.isDrive ? true : isInDrive;

		}

		if( this.resolve && !isInDrive ) {
			this.resolve();
			delete this.resolve;
		}

	}

    setAngles ( angles, time ){

    	//console.log(angles, time)

    	if(!angles) return

    	var j = this.joints.length;

    	while(j--){ 
    		this.joints[j].pose( angles[j] !== undefined ?  angles[j] : 0, time !== undefined ? time : 5 );
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

		this.data = {

			target:{ x:0, y:0, z:0, twist:0, swing1:0, swing2:0, count:0 },

		};

		if( o.limits ){
			this.min = o.limits[0][1];
			this.max = o.limits[0][2];
			this.driveType = o.limits[0][0];
		}


		
		
		//stiffness, damping, forceLimit, acceleration drive flag
		//o.drives = [[this.driveType, 100000, 0, Infinity, true ]];
		//solver.addJoint(o);
		
		this.current = 0;
		this.tmp = 0;
		this.target = 0;
		this.start = 0;
		this.time = 0;

	}

	start (){

	}

	pose( target, time ){



		// linear target need to be clamp ?!
		this.target = math$1.clamp( target, this.min, this.max );
		//this.current = this.data.target[ this.driveType ];
		this.current = math$1.clamp( this.data.target[ this.driveType ], this.min, this.max );

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



		// linear target need to be clamp ?!
		/*this.current = math.clamp( this.data.target[ this.driveType ], this.min, this.max );

		if( this.current === this.target ){

			this.isDrive = false;

		} else {*/

		if( this.isDrive ){

			this.tmp += dt;
			let t = this.tmp / this.time;
			t = (t > 1) ? 1 : t;
			let move = math$1.lerp( this.start, this.target, t );//this.current + (this.target - this.current) * t;
			
		    root.update({ name:this.name, drivesTarget: [[ this.driveType, move ]] });

		    //console.log('yoo',{ name:this.name, drivesTarget: [[ this.driveType, move ]] } )

		    //root.flow.tmp.push( { name:this.name, drivesTarget: [[ this.driveType, move ]] } )

		    if( t === 1 ) this.isDrive = false;

		}


	}


}

class Timer {

	constructor( framerate = -1 ) {

		this.time = { now:0, delta:0, then:0, interval: 0, tmp:0, n:0, dt:0 };
		this.fps = 0;
		this.delta = 0;
		this.elapsedTime = 0;
		this.unlimited = true;
		this.setFramerate( framerate );

	} 

	up ( stamp = 0 ) {

		let t = this.time;

		t.now = stamp !== undefined ? stamp : Date.now();
		t.delta = t.now - t.then;
		
		if ( t.delta > t.interval || this.unlimited ) {

		    t.then = this.unlimited ? t.now : t.now - ( t.delta % t.interval );
		    this.delta = t.delta * 0.001;
		    this.elapsedTime += this.delta;
		    if ( t.now - 1000 > t.tmp ){ t.tmp = t.now; this.fps = t.n; t.n = 0; } t.n++;
			return true

		}

		return false

	}

	setFramerate ( framerate ){
		
		this.elapsedTime = 0;
		this.framerate = framerate;
		this.unlimited = this.framerate < 0;
		this.time.interval = 1000 / framerate;

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
    // 6 : bouton X             0-1  arme principale
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
		this.sameAxis = false;

		document.addEventListener( 'keydown', function(e){this.keyDown(e);}.bind(this), false );
        document.addEventListener( 'keyup', function(e){this.keyUp(e);}.bind(this), false );

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
                case 69:          key[5] = 1; break; // E
                
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
                case 69:          key[5] = 1; break; // E
                
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
                case 69:          key[5] = 0; break; // E
                
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
                case 69:          key[5] = 0; break; // E
                
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

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*
*    THREE JS ENGINE
*/

let items;

let callback = null;
let Ar, ArPos = {};
let maxFps = 60;
let worker = null;
let isWorker = false;
let isBuffer = false;
let isTimeout = false;
let outsideStep = true;

let isPause = false;

let directMessage = null;
let controls = null;
let first = true;

let timout = null;
let timoutFunction = null;
let timoutTime = 0;
let elapsedTime = 0;

const user = new User();
const timer = new Timer(60);

let azimut = function(){ return 0 };
let endReset = function(){};
let postUpdate = function(){};
let extraTexture = function(){};
//let extraMaterial = function(){}

class Motor {

	static setMaxFps ( v ) { maxFps = v; }

	static setExtraTexture ( f ) { extraTexture = f; }
	//static setExtraMaterial ( f ) { extraMaterial = f }

	static setExtraMaterial ( f ) { root.extraMaterial = f; }

	static setPostUpdate ( f ) { postUpdate = f !== null ? f : function(){}; }
	static setAzimut ( f ) { azimut = f; }

	static getKey () { return user.key }
	static getKey2 () { return user.key2 }
	static getAzimut () { return azimut() }
	static math () { return math$1 }

	static setContent ( Scene ) {

		Scene.add( root.scene );
		Scene.add( root.scenePlus );

	}

	static setControl ( Controls ) { 

		controls = Controls;
		azimut = controls.getAzimuthalAngle;

	}

	static message ( m ){

		let e = m.data;
		if( e.Ar ) Ar = e.Ar;
		if( e.reflow ){
			root.reflow = e.reflow;
			if(root.reflow.stat.delta) elapsedTime += root.reflow.stat.delta;
		}
		Motor[ e.m ]( e.o );

	}

	static post ( e, buffer ){

		if( isWorker ){ 

			if ( e.m === 'add' ){ 
				if( e.o.type === 'solver' ) worker.postMessage( e );// direct
				else if( e.o.solver !== undefined ) worker.postMessage( e );// direct
				else root.flow.add.push( e.o );// in temp 
			}
			else if ( e.m === 'remove' ) root.flow.remove.push( e.o );
			else worker.postMessage( e, buffer );

		} else {

			directMessage( { data : e } );

		}

	}

	static makeView () {

	}

	static getScene () { return root.scene; }

	//static getMat ( mode ) { return mat; }

	static getHideMat() { return Mat.get('hide'); }

	//static getMat ( mode ) { return mode === 'HIGH' ? mat : matLow; }

	static init ( o = {} ){

		let type = o.type || 'PHYSX';
		let name = type.toLowerCase();
		let mini = name.charAt(0).toUpperCase() + name.slice(1);
		let st = '';

		let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

		root.engine = type;

		Motor.initItems();

		items.body.extraConvex = mini === 'Physx';
		items.solid.extraConvex = mini === 'Physx';

		if( o.callback ){ 
			callback = o.callback;
			delete ( o.callback );
		}

		/*Motor.initArray()
		o.ArPos = ArPos
		o.ArMax = ArMax*/

		root.scene = new Group();
		root.scene.name = 'phy_scene';
		root.scenePlus = new Group();
		root.scenePlus.name = 'phy_scenePlus';

		root.post = Motor.post;
		root.up = Motor.up;
		root.update = Motor.update;

		root.add = Motor.add;
		root.remove = Motor.remove;

		if( !o.direct ){ // is worker version

			switch( type ){

				case 'OIMO':

				    if( isFirefox ) worker = new Worker( './build/'+mini+'.min.js' );
				    else {
				    	try {
					        worker = new Worker('./build/'+mini+'.module.js', {type:'module'});
						    st = 'ES6';
						} catch (error) {
						    worker = new Worker( './build/'+mini+'.js' );
						}
				    }

				break
				
				default :
				    if( type === 'RAPIER' ) { name = 'rapier3d'; mini = 'rapier3d'; }

				    // for wasm side
				    if( o.link ) o.blob = document.location.href.replace(/\/[^/]*$/,"/") + o.link;

					worker = new Worker( './build/'+mini+'.min.js' );

				break

			}

			worker.postMessage = worker.webkitPostMessage || worker.postMessage;
			worker.onmessage = Motor.message;

			let ab = new ArrayBuffer( 1 );
			worker.postMessage( { m: 'test', ab: ab }, [ ab ] );
			isBuffer = ab.byteLength ? false : true;

			o.isBuffer = isBuffer;
			console.log( st  + ' Worker '+ type + (o.isBuffer ? ' with Shared Buffer' : '') );

			isWorker = true;

		} else { // is direct version

			directMessage = o.direct;
			o.message = Motor.message;
			console.log( type + ' is direct' );

		}

		
		root.post({ m:'init', o:o });

	}
	
	static getPause (){
		return isPause
	}

	static pause ( v ){

		if( v === isPause ) return
		isPause = v;
		if( isPause ) Motor.pausetimout();
		else Motor.playtimout();
		root.post({ m:'pause', o:{ value:isPause } });

	}

	static flowReset ( ){

		root.flow = { tmp:[], key:[], add:[], remove:[] };

	}

	static reset ( callback ){

		if( first ){
			first = false;
			callback();
			return
		}

		Motor.cleartimout();

		if( controls ) controls.resetAll();

		endReset = callback;

		postUpdate = function () {};

		Motor.flowReset();

		// clear instance
	    Motor.clearInstance();

	    // reset all items
	    Motor.resetItems();

		// clear temporary geometry
		Geo.dispose();

	    // clear temporary material
	    Mat.dispose();

	    // clear temporary mesh
		root.disposeTmp();
			
		root.tmpTex = [];
	    root.scenePlus.children = [];
	    root.scene.children = [];

		root.post({ m:'reset' });

	}

	static resetCallback (){

		endReset();

	}

	static ready (){

		console.log( 'Motor is ready !!' );
		if( callback ) callback();

	}

	static start ( o = {} ){

		root.post({ m:'start', o:o });

	}

	static setTimeout ( b ){ isTimeout = b; }
	static getTimeout ( b ){ return isTimeout }

	static set ( o = {} ){

		if( o.full === undefined ) o.full = false;

		items.body.setFull( o.full );

		Motor.initArray( o.full );
		o.ArPos = ArPos;

		elapsedTime = 0;

		o.outsideStep = outsideStep;
		o.isTimeout = isTimeout;
		if(!o.gravity) o.gravity = [0,-9.81,0];
		if(!o.substep) o.substep = 2;

		if(o.fps){
			if( o.fps < 0 ) o.fps = maxFps;
		} else {
			o.fps = 60;
		}

		//console.log( o.fps );

		timer.setFramerate( o.fps );

		
		
		root.post({ m:'set', o:o });

	}

	static getFps (){ return root.reflow.stat.fps }
	
	static getDelta2(){ return root.reflow.stat.delta }
	static getElapsedTime2(){ return elapsedTime }
	
	static getDelta(){ return timer.delta }
	static getElapsedTime(){ return timer.elapsedTime }

	static doStep ( stamp ){

		if( timer.up( stamp ) ) {
			root.post( { m:'step', o:stamp } );
		}

		/*if( isBuffer ) root.post( { m:'poststep', flow:root.flow, Ar:Ar }, [ Ar.buffer ] )
		else root.post( { m:'poststep', flow:root.flow, Ar:Ar })
		Motor.flowReset()*/

	}

	static step ( o ){

		//console.time('step')

		Motor.stepItems();

		// user key interaction 
		root.flow.key = user.update();
		//root.flow.tmp = []

		postUpdate( root.reflow.stat.delta );
		//postUpdate( timer.delta )

		// for update static object !!! 
		//let i = root.flow.tmp.length;
		//while( i-- ) this.change( root.flow.tmp[i], true )
		Motor.changes( root.flow.tmp );

		//if( outsideStep ) return

		// finally post flow change to physx
		if( isBuffer ) root.post( { m:'poststep', flow:root.flow, Ar:Ar }, [ Ar.buffer ] );
		else root.post( { m:'poststep', flow:root.flow, Ar:Ar });

		Motor.flowReset();

	    //console.timeEnd('step')

	}

	

    static up ( list ) {

		if( list instanceof Array ) Motor.changes( list, true );
		else Motor.change( list, true );

	}

	static update ( list ) {

		if( list instanceof Array ) root.flow.tmp.push( ...list );
		else root.flow.tmp.push( list );

	}

	static initArray ( full = false ) {

	    // dynamics array
		ArPos = getArray( root.engine, full );

	}

    static upInstance() {

    	for( let n in root.instanceMesh ) root.instanceMesh[n].update();

    }

	static clearInstance() {

    	for( let n in root.instanceMesh ) root.instanceMesh[n].dispose();
    	root.instanceMesh = {};

	}

	static addDirect( b ) {

		root.scene.add( b );
		root.tmpMesh.push( b );

	}

	static texture( o = {} ) {

		let t = extraTexture( o );
		//root.tmpTex.push( t )
		return t
	}

	static material ( o = {} ){

		let m;
		if( o.isMaterial ) m = o;
		else m = new MeshPhysicalMaterial( o );


		if( mat[ m.name ] ) return null;

	    Mat.set( m );

		//mat[ m.name ] = m;
		//root.extraMaterial( m )

		return m;

	}

	static byName ( name ){

		return Utils.byName( name )

	}

	static getAllBody ( name ){

		return items.body.list

	}

	static explosion ( position = [0,0,0], radius = 10, force = 100 ){

		let r = [];
	    let pos = new Vector3().fromArray( position );
	    let dir = new Vector3();
	    let i = items.body.list.length, b, scaling;

	    while( i-- ){

	        b = items.body.list[i];
	        dir.copy( b.position ).sub( pos );
	        scaling = 1.0 - dir.length() / radius;
	        if ( scaling < 0 ) continue;
	        dir.setLength( scaling );
	        dir.multiplyScalar( force );

	        //r.push({ name:b.name, impulse: [ ...pos.toArray(), ...dir.toArray()] })
	        r.push({ name:b.name, linearImpulse: dir.toArray() });

	    }

		Motor.update( r );

	}


	//-----------------------
	//  ITEMS
	//-----------------------

	static getBodyRef () {
		return items.body
	}

	static initItems () {

		items = {
			ray : new Ray(), 
			body : new Body(), 
			solid : new Solid(), 
			joint : new Joint(), 
			contact : new Contact(), 
			terrain : new Terrain(), 
			character : new Character()
		};

		if( root.engine === 'PHYSX' || root.engine === 'AMMO' ){ 
			items['vehicle'] = new Vehicle();
		}

		if( root.engine === 'PHYSX' ){ 
			items['solver'] = new Solver();
		}

	}

	static resetItems() {

		for (const key in items) items[key].reset();

	}

	static stepItems () {

		for (const key in items) items[key].step( Ar, ArPos[key] );

		Motor.upInstance();

		// update follow camera
		if( controls ){ 
			if( controls.follow )controls.follow( Motor.getDelta() );
		}
	}

	static adds ( r = [] ){ for( let o in r ) Motor.add( r[o] ); }

	static add ( o = {} ){

		if ( o.constructor === Array ) return Motor.adds( o )

		if( o.mass !== undefined ) o.density = o.mass;
		if( o.bounce !== undefined ) o.restitution = o.bounce;
		if( o.type === undefined ) o.type = 'box';

		let type = getType( o );

		return items[type].add( o );

	}


	static removes ( r = [] ){ for( let o in r ) Motor.remove( r[o] ); }
	
	static remove ( name ){

		if ( name.constructor === Array ) return Motor.removes( o )

		let b = Motor.byName( name );
		if( b === null ) return;

		// remove on three side
		items[b.type].clear( b );
		// remove on physics side
		root.post( { m:'remove', o:{ name:name, type:b.type } });

	}


	static changes ( r = [], direct = false ){ for( let o in r ) Motor.change( r[o], direct ); }

	static change ( o = {}, direct = false ){

		//if ( o.constructor === Array ) return this.changes( o )

		let b = Motor.byName( o.name );
		if( b === null ) return null;
		let type = b.type;
		if( o.drivePosition ){
			if( o.drivePosition.rot !== undefined ){  o.drivePosition.quat = math$1.toQuatArray( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }
		}
		
		if( o.rot !== undefined ){ o.quat = math$1.toQuatArray( o.rot ); delete ( o.rot ); }
		if( o.localRot !== undefined ){ 
			o.quat = math$1.toLocalQuatArray( o.localRot, b ); delete ( o.localRot ); 
		}

		switch( type ){

			//case 'terrain': b = terrain.set( o, b ); break;
			//case 'joint': b = joint.set( o, b ); break;
			case 'solid': b = items.solid.set( o, b ); break;
			case 'ray': b = items.ray.set( o, b ); direct = false; break;
			//case 'body': b = body.set( o, b ); break;

		}
		
		if( direct ){
			root.post( { m:'change', o:o });
		}

	}


	//-----------------------
	//  CAMERA CONTROLS
	//-----------------------

	static setCamera ( o = {} ){

		controls.moveCam( o );

	}

	static follow ( m = '', o = {} ){

		let mesh = null;

		if ( typeof m === 'string' || m instanceof String ) mesh = m === '' ? null : Motor.byName( m );
		else if ( m.isMesh || m.isGroup ) mesh = m;

		if( mesh === null ) controls.resetFollow();
		else controls.startFollow( mesh, o );

	}


    //-----------------------
	// INTERN timout
	//-----------------------

	static setTimeout ( f, time ){

		timoutFunction = f; 
		timoutTime = time; 
		timout = setTimeout( timoutFunction, timoutTime ); 

	}

	static playtimout (){

		if( timoutFunction === null ) return
		timout = setTimeout( timoutFunction, timoutTime ); 

	}

	static pausetimout (){

		if( timout === null ) return
		clearTimeout( timout ); 

	}

	static cleartimout ( f, time ){

		if( timout === null ) return
		timoutFunction = null;
		timoutTime = 0; 
		clearTimeout( timout );
		timout = null;

	}



}



//--------------
//
//  SOLID ONLY 
//
//--------------

class Solid extends Body {
	constructor () {
		super();
		this.type = 'solid';
	}
	step ( AR, N ) {}
}

const phy = Motor;

export { phy };
