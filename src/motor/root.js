
import {
    SphereGeometry,
    PlaneGeometry,
    CylinderGeometry,
    BoxGeometry,
    Euler,
    Quaternion,
    MeshStandardMaterial,
    MeshPhysicalMaterial,
    MeshBasicMaterial,
    LineBasicMaterial,
    Box3Helper,
    DoubleSide,
    CanvasTexture,
    RepeatWrapping,
    Vector2,
} from '../../build/three.module.js';

import { FlakesTexture } from '../jsm/textures/FlakesTexture.js';
import { CheckTexture } from '../jsm/textures/CheckTexture.js';

export const map = new Map();

export const root = {

	engine:'OIMO',
	scene : null,
	scenePlus : null,
	post : null,
	tmpMesh : [],
	tmpGeo : [],
	tmpMat : [],
	tmpTex : [],
	flow:{
		tmp:[],
		key:[],
	},
	
	reflow:{
		ray:[],
		stat:{
			fps:0,
		},
	}

};


export class Utils {

	static byName ( name ) {

		if ( !map.has( name ) ) return null;
		return map.get( name );

	}

	static add ( b, parent ) {

		if( b.type !== 'contact'){

			if(!parent){
				switch( b.type ){
					case 'solid': case 'joint': case 'ray': root.scenePlus.add( b ); break;
					default: root.scene.add( b ); break;
				}
			} else {
				parent.add( b );
			}

		}

		map.set( b.name, b );

	}

	static remove ( b ) {

		if( b.type !== 'contact') b.parent.remove( b );

		map.delete( b.name );

	}

}

export const geo = {

	plane: new PlaneGeometry(1,1),
	box: new BoxGeometry(1,1,1),
	sphere: new SphereGeometry( 1, 16, 12 ),
	cylinder: new CylinderGeometry( 1, 1, 1 , 16 ),
	cone: new CylinderGeometry( 0.001, 1, 1 , 16 ),
	highSphere: new SphereGeometry( 1, 32, 24 ),
	joint: new Box3Helper().geometry, //new BoxGeometry(0.1,0.1,0.1),

};

geo.plane.rotateX( -Math.PI * 0.5 );
geo.joint.scale( 0.05,0.05,0.05 );

const flakeTexture = new CanvasTexture(new CheckTexture())
flakeTexture.wrapS = flakeTexture.wrapT = RepeatWrapping
flakeTexture.repeat.x = 2
flakeTexture.repeat.y = 2

const matExtra = {

	clearcoat:1.0,
	clearcoatRoughness:0.1,
	metalness: 0.9,
	roughness: 0.15,
	normalMap: flakeTexture,
	normalScale: new Vector2(0.25,0.25),

}
//mat[m].
		//mat[m].

export const mat = {


	body: new MeshPhysicalMaterial({ name:'body', color:0xff8800, ...matExtra }),
	sleep: new MeshPhysicalMaterial({ name:'sleep', color:0x888888, ...matExtra }),
	solid: new MeshPhysicalMaterial({ name:'solid', color:0x0088ff, ...matExtra }),

	debug: new MeshBasicMaterial({ name:'debug', color:0xffFF00,  wireframe:true }),
	debug2: new MeshBasicMaterial({ name:'debug2', color:0x00FFFF,  wireframe:true }),
	hero: new MeshPhysicalMaterial({ name:'body', color:0x00FF88, ...matExtra }),
	skin: new MeshPhysicalMaterial({ name:'skin', color:0x8D5524, ...matExtra }),
	
	joint: new LineBasicMaterial( { color: 0x00FF00, toneMapped: false } ),
	ray: new LineBasicMaterial( { vertexColors: true, toneMapped: false } ),
	glass: new MeshStandardMaterial({ name:'glass', color:0x9999ff, transparent:true, opacity:0.25, depthTest:true, depthWrite:false, roughness:0.1, metalness:1, side:DoubleSide, premultipliedAlpha:true  }),
	chrome: new MeshStandardMaterial({ name:'chrome', color:0x808080, metalness:1, roughness:0 }),
	hide: new MeshBasicMaterial({ name:'hide', color:0x0088ff, transparent:true, opacity:0, depthTest:false, depthWrite:false  }),

};


export const torad = Math.PI / 180;
export const todeg = 180 / Math.PI;

export const euler = new Euler();
export const quat = new Quaternion();

export class math {

	static int (x) { return Math.floor(x); }
	static lerp ( x, y, t ) { return ( 1 - t ) * x + t * y; }
	static rand ( low, high ) { return low + Math.random() * ( high - low ); }
	static randInt ( low, high ) { return low + Math.floor( Math.random() * ( high - low + 1 ) ); }

	static autoSize ( s = [ 1, 1, 1 ], type = 'box' ) {

		//let s = o.size === undefined ? [ 1, 1, 1 ] : o.size;
		if ( s.length === 1 ) s[ 1 ] = s[ 0 ];

		let radius =  s[0];
		let height =  s[1];

		if( type === 'sphere' ) s = [ radius, radius, radius ];
		if( type === 'cylinder' || type === 'wheel' || type === 'capsule' ) s = [ radius, height, radius ];
		if( type === 'cone' || type === 'pyramid' ) s = [ radius, height, radius ];

	    if ( s.length === 2 ) s[ 2 ] = s[ 0 ];
	    return s;

	}

	static toQuatArray ( rot = [0,0,0] ) { // rotation array in degree

		return quat.setFromEuler( euler.fromArray( math.vectorad( rot ) ) ).toArray();

	}

	static toLocalQuatArray ( rot = [0,0,0], b ) { // rotation array in degree

		quat.setFromEuler( euler.fromArray( math.vectorad( rot ) ) )
		quat.premultiply( b.quaternion.inverse() );
		return quat.toArray();

	}

	static vectorad ( r ) {

		let i = 3, nr = [];
	    while ( i -- ) nr[ i ] = r[ i ] * torad;
	    nr[3] = r[3];
	    return nr;

	}

	static getIndex ( g ) {

		//console.log( 'i', g.index.array.length/3 )

		return g.index.array || null
	}

	static getVertex ( g, noIndex ) {

		let c = g.attributes.position.array;

		if( noIndex ){
			let h = g.clone().toNonIndexed()
			c = h.attributes.position.array;
		}

		//console.log( 'v', c.length/3 )

		return c;

	}


}