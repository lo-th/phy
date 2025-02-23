import {
    Matrix4, Euler, Quaternion, Vector3, Vector2, Matrix3, Color,
} from 'three';
//import { CircleHelper } from '../3TH/helpers/CircleHelper.js';
//import { CarbonTexture } from '../3TH/textures/CarbonTexture.js';


export const map = new Map()

//-------------------
//
//  ROOT
//
//-------------------

export const root = {

	debug:false,

	Ar:null, 
	ArPos: {},

	garbage:[],

	//AR:null,

	viewSize:null,

	engine:'OIMO',
	motor: null,
	scene : null,
	scenePlus : null,
	//threeScene : null,
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
	//tmpMat : [],

	//hideMaterial: null,
	//lineMaterial: null,

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

		if( b.isInstance && b.refName !== b.name ) map.set( b.refName, b );

		map.set( b.name, b );

	},

	remove:( b ) => {

		if( b.dispose ) b.dispose();
		if( b.parent ) b.parent.remove( b );
		if( b.isInstance ) { 
			if( b.refName !== b.name ) map.delete( b.refName );
			b.instance.remove( b.id );
		}
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
    	if(!isAxe) v.sub( obj.position );
    	//v.multiply(obj.scale)
    	// apply invers rotation
    	let q = obj.quaternion//.normalize();
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
    	return q1.normalize().toArray();

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

    	//console.log('result',v)

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