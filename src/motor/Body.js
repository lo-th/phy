import { Object3D, Vector3, Group, Mesh, BufferGeometry, CylinderGeometry, InstancedMesh, DynamicDrawUsage } from 'three';

import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Basic3D } from '../core/Basic3D.js';
import { Instance } from '../core/Instance.js';
import { Utils, root, math, Mat, Geo, Colors, map } from './root.js';

import { SphereBox, Capsule, ChamferCyl, ChamferBox  } from '../3TH/Geometry.js';
import { ConvexGeometry } from '../jsm/geometry/ConvexGeometry.js';


// THREE BODY

export class Body extends Item {

	constructor () {

		super()

		this.Utils = Utils
		this.type = 'body'
		this.num = Num[this.type]
		this.full = false
		this.extraConvex = false

	}

	setFull( full ){
		this.num = Num[ full ? 'bodyFull':'body' ]
		this.full = full
	}

	step ( AR, N ) {

		const list = this.list
		let i = list.length, b, n, a;
		
		while( i-- ){

			b = list[i]

			if( b === null ) continue

			n = N + ( i * this.num )

			// update only when physics actif
			if( !b.actif ){
				a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7]
				if( a === 0 ) continue
				else b.actif = true
			}

		    // test is object sleep
			b.sleep = AR[n] > 0 ? false : true

			// update default material
	        if( b.defMat ){

	        	if( b.isInstance ){
	        		b.instance.setColorAt(b.id, b.sleep ? Colors.sleep : Colors.body )
	        	} else {
	        		if ( !b.sleep && b.material.name === 'sleep' ) b.material = Mat.get('body')
			        if ( b.sleep && b.material.name === 'body' ) b.material = Mat.get('sleep')
	        	}
			    
			}

			if( b.sleep && !b.isKinematic ) continue 

			// update position / rotation / velocity

		    if( b.isInstance ){ 
		    	if( b.speedMat ) b.instance.setColorAt(b.id, [ Math.abs(AR[n+8])*0.5, Math.abs(AR[n+9])*0.5, Math.abs(AR[n+10])*0.5] )
		    	b.instance.setTransformAt( b.id, [AR[n+1],AR[n+2],AR[n+3]], [AR[n+4],AR[n+5],AR[n+6],AR[n+7]], b.noScale ? [1,1,1] : b.size )
		    	b.position = {x:AR[n+1], y:AR[n+2], z:AR[n+3]}
		    	if( this.full ){
		    		b.velocity = {x:AR[n+8], y:AR[n+9], z:AR[n+10]}
		    		b.angular = {x:AR[n+11], y:AR[n+12], z:AR[n+13]}
		    	}
		    }
		    else {
		    	b.position.fromArray( AR, n + 1 )
		        b.quaternion.fromArray( AR, n + 4 )
		        if( this.full ){
			        b.velocity.fromArray( AR, n + 8 )
			        b.angular.fromArray( AR, n + 11 )
			    }
		        if( !b.auto ) b.updateMatrix()
		    }
		}

	}

	///

	geometry ( o = {}, b = null, material = null ) {

		//console.log( 'geometry', o, b, material)

		let g, i, n, s = o.size, gName=''
		let t = o.type
		let noScale = false, unic = false;
		let seg = o.seg || 16;

		if( o.instance && t!== 'capsule') s = o.instanceSize || [1,1,1]

		if( o.instance && t=== 'compound'){ 
			t = o.shapes[0].type
			s = o.shapes[0].size
			o.translate = o.shapes[0].pos
		}

		if( t==='mesh' || t==='convex' ){
			if( o.shape ){
				if( o.shape.isMesh ) o.shape = o.shape.geometry
			} else {
				if( o.mesh && !o.v ) o.shape = o.mesh.geometry
			}			
		}

		if( o.radius ){
			if( !o.breakable ){
				if( t === 'box' ) t = 'ChamferBox';
				if( t === 'cylinder' ) t = 'ChamferCyl';
			}
		}

		if( o.geometry ){
			if( t === 'convex' ) o.shape = o.geometry;
			else t = 'direct';
		} 


		if( this.extraConvex && ( o.type==='cylinder' || o.type==='cone' ) ){
			// convert geometry to convex if not in physics
	    	let geom = new CylinderGeometry( o.type === 'cone' ? 0 : o.size[ 0 ], o.size[ 0 ], o.size[ 1 ], seg, 1 );//24
	    	if( o.isWheel ) geom.rotateZ( -math.PI90 );
	    	o.v = math.getVertex( geom )
	    	o.type = 'convex';

	    }

		switch( t ){

			case 'direct':

			    g = o.geometry.clone();
			    if( o.size ) g.scale( o.size[0], o.size[1], o.size[2] );
			    unic = true
			    noScale = true

			break;

			case 'convex':

			if( o.v ){ 

				if( o.nogeo ) g = new BufferGeometry();
				else {
					let vv = [];
					i = Math.floor( o.v.length/3 );
					while( i-- ){
						n = i*3;
						vv.push( new Vector3( o.v[n], o.v[n+1], o.v[n+2] ) )
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
				o.v = math.getVertex( g )
				o.index = math.getIndex( g )

				unic = true;
				noScale = true;
			}

			if(!g.boundingBox) g.computeBoundingBox()
			let bx = g.boundingBox
		    o.boxSize = [ -bx.min.x + bx.max.x, -bx.min.y + bx.max.y, -bx.min.z + bx.max.z ]

			//console.log(g)

			break;

			case 'mesh':

				g = o.shape.clone()
				if( o.size ) g.scale( o.size[0], o.size[0], o.size[0] )
				
				o.v = math.getVertex( g, root.engine === 'OIMO' )
				o.index = root.engine === 'OIMO' ? null : math.getIndex( g )
				
				unic = true
				noScale = true
			
			break;

			case 'highSphere':

			    gName = 'highSphere_' + s[ 0 ];

			    g = Geo.get( gName )
			    if(!g){
			    	g = new SphereBox( s[ 0 ] );
					g.name = gName
			    } else {
					gName = ''
				}
			    noScale = true;
			    o.type = 'sphere';

			break;

			case 'capsule':

			    gName = 'capsule_' + s[ 0 ] +'_'+s[ 1 ] + '_' + seg; 

			    g = Geo.get( gName )
			    if(!g){
					g = new Capsule( s[ 0 ], s[ 1 ], seg )
					g.name = gName
				} else {
					gName = ''
				}
				noScale = true;
			break;

			case 'ChamferBox':

			    gName = 'ChamferBox_' + s[ 0 ] +'_'+ s[ 1 ] +'_'+ s[ 2 ] + '_' + o.radius + '_' + seg; 

			    g = Geo.get( gName )
			    if(!g){
					g = new ChamferBox( s[ 0 ], s[ 1 ], s[ 2 ], o.radius, seg );
					g.name = gName
				} else {
					gName = ''
				}
				noScale = true;
			break;

			case 'ChamferCyl':

			    gName = 'ChamferCyl_' + s[ 0 ] +'_'+ s[ 1 ] +'_'+ s[ 2 ] + '_' + o.radius + '_' + seg;

			    g = Geo.get( gName )
			    if(!g){
					g = new ChamferCyl( s[ 0 ], s[ 0 ], s[ 1 ], o.radius, seg );
					g.name = gName;
				} else {
					gName = ''
				}
				noScale = true;
			break;

			default:
			    g = Geo.get(t); //geo[ t ];
			break;

		}

		if(o.translate) g.translate( o.translate[0], o.translate[1], o.translate[2])

		

		// clear untranspherable variable for phy
    	if( o.shape ) delete o.shape
    	if( o.geometry ) delete o.geometry


    	// reuse complex geometry
    	if( gName !== '' ) Geo.set( g )

    	if( o.isWheel ){
    		g = g.clone()
    		g.rotateZ( -math.PI90 );
    		unic = true
    	}
    	
    	// unic geometry dispose on reset 
    	if( unic ) Geo.unic(g);

    	
    	

    	if( b === null && material === null ){
    		g.noScale = noScale; 
    		return g
    	}

    	if( o.meshRemplace && o.debug ) material = Mat.get( 'debug3' )


		let m = new Mesh( g, material )

		if( o.localRot ) o.localQuat = math.toQuatArray( o.localRot );
		if( o.localPos ) m.position.fromArray( o.localPos );
		if( o.localQuat ) m.quaternion.fromArray( o.localQuat );

    	if( !noScale ) m.scale.fromArray( o.size );
    	//if( unic ) m.unic = true

    	// disable raycast
    	if(o.ray !== undefined){
    		if( !o.ray ) m.raycast = () => {return}
    	}
    	

    	// add or not add
    	if( !o.meshRemplace || o.debug ) b.add( m )

	}

	add ( o = {} ) {

		//console.log('add', o.type )

		let i, n, name

		if( !o.instance ) name = this.setName( o );


		o.type = o.type === undefined ? 'box' : o.type;

		if( o.type === 'plane' && !o.visible ) o.visible = false;

		// change default center of mass 
		if( o.massCenter && root.engine !== 'PHYSX'){
			if( o.type !== 'compound' ){
				//o.localPos = o.massCenter
				o.shapes = [{ type:o.type, pos:o.massCenter, size:o.size }]
				if( o.seg ) o.shapes[0].seg = o.seg
				if( o.radius ) o.shapes[0].radius = o.radius
				delete ( o.size )
				o.type = 'compound'
			} else {
				for ( i = 0; i < o.shapes.length; i ++ ) {
					n = o.shapes[ i ]
					if( n.pos ) n.pos = Utils.vecAdd( n.pos, o.massCenter )
					else n.pos = o.massCenter
					Geo.unic(n);
				}
			}
		}

		//console.log('add', o.type, )

		// position
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;

		// rotation is in degree or Quaternion
	    o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
	    if( o.rot !== undefined ){ o.quat = math.toQuatArray( o.rot ); delete o.rot; }
	    if( o.meshRot !== undefined ){ o.meshQuat = math.toQuatArray( o.meshRot ); delete o.meshRot; }

	    //o.size = o.size == undefined ? [ 1, 1, 1 ] : math.correctSize( o.size );
	    o.size = math.autoSize( o.size, o.type );
	    if( o.meshScale ) o.meshScale = math.autoSize( o.meshScale )

	    let material, noMat = false;

	    if ( o.material !== undefined ) {
	    	if ( o.material.constructor === String ) material = Mat.get(o.material)
	    	else material = o.material;
	    } else {
	    	noMat = true
	    	material = Mat.get( this.type ) //mat[this.type]
	    	if( o.instance ) material = Mat.get( 'base' )
	    }

	    if( o.unicMat ) {
	    	material = material.clone()
	    	root.tmpMat.push( material )
	    }

	    if( o.material ) delete o.material




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
	    let b = o.instance ? {} : new Basic3D()

	    if( o.mesh ){

	    	//if( o.isTerrain ) o.noClone = true
	    	if( o.mesh.type === 'terrain' ) o.noClone = true;

	    	let mm = o.noClone ? o.mesh : o.mesh.clone()

	    	mm.position.fromArray( o.meshPos || [0,0,0]);
	    	if( o.meshRot ) { o.meshQuat = math.toQuatArray( o.meshRot ); delete o.meshRot; }
	    	if( o.meshQuat ) mm.quaternion.fromArray( o.meshQuat )
	    	if( o.meshSize ) mm.scale.set(1,1,1).multiplyScalar(o.meshSize)
	    	if( o.meshScale ) mm.scale.fromArray( o.meshScale )
	    	
	    	if( !noMat ) mm.material = material

	    	root.tmpMesh.push(mm)

	    	o.meshRemplace = true;
	    	b.add( mm )

	    }

	    switch( o.type ){

	    	case 'null': break;

	    	case 'compound':

	    	    for ( i = 0; i < o.shapes.length; i ++ ) {

					n = o.shapes[ i ];

					n.type = n.type === undefined ? 'box' : n.type;
					//n.size = n.size === undefined ? [ 1, 1, 1 ] : math.correctSize( n.size );
					n.size = math.autoSize( n.size, n.type );

					if( n.pos ) n.localPos = n.pos;
					if( n.rot !== undefined ){ n.quat = math.toQuatArray( n.rot ); delete n.rot; }
					if( n.quat ) n.localQuat = n.quat;


					
					n.debug = o.debug || false;
					n.meshRemplace = o.meshRemplace || false;

					if( !o.instance ) this.geometry( n, b, material )

				}

	    	break;
	    	default:

			    if( !o.instance ) this.geometry( o, b, material );

			break;

	    }

	    
	    b.type = this.type
	    b.size = o.size
		b.shapetype = o.type
		b.isKinematic = o.kinematic || false

	    // enable or disable raycast
	    b.isRay = b.type === 'body' ? true : false
	    if( o.ray !== undefined ) b.isRay = o.ray; 
	    if( !o.instance ) b.setRaycast()
	    

		if( !noMat ) b.material = material
		b.defMat = false;
		if( b.material ) b.defMat = b.material.name === 'body'


		//  for instancing
		if( o.instance ){ 

			b.isInstance = true;
			b.instance = root.instanceMesh[ o.instance ] || this.addInstance( o, material );
			b.instance.isRay = b.isRay;

			b.defMat = b.instance.material.name === 'base'
			
			b.id = b.instance.count;
			
			b.name = b.instance.name + b.id;
			o.name = b.name;
			b.noScale = false//o.type!=='box' || o.type!=='ChamferBox' || o.type!=='sphere';
			//if(o.type === 'sphere') b.noScale = false
		    if(o.type === 'capsule') b.noScale = true
			/*if(o.radius) b.noScale = true*/

			let color = o.color;
			if( b.defMat ) color = o.sleep ? Colors.sleep : Colors.body;

			b.instance.add( o.pos, o.quat, b.noScale ? [1,1,1] : b.size, color );

			b.position = {x:o.pos[0], y:o.pos[1], z:o.pos[2]}
		    b.velocity = {x:0, y:0, z:0}
		    b.angular = {x:0, y:0, z:0}

			// for convex
			if(b.instance.v) o.v = b.instance.v
			if(b.instance.index) o.index = b.instance.index;
		    o.type = b.instance.type;

			/*if( this.extraConvex && ( o.type==='cylinder' || o.type==='cone') ){
		    	o.v = b.instance.v;
		    	o.type = 'convex';
		    }*/


			//console.log( b )

		} else {

			b.name = name;

			if( o.renderOrder ) b.renderOrder = o.renderOrder
			if( o.visible === undefined ) o.visible = true
			if( o.shadow === undefined ) o.shadow = o.visible

			b.visible = o.visible !== undefined ? o.visible : true
		    b.receiveShadow = o.shadow
		    b.castShadow = o.shadow

		    // apply option
			this.set( o, b )

		}

	    if( o.instance ) delete o.instance
	    if( o.mesh ) delete o.mesh

		// add to world
		this.addToWorld( b, o.id )

		if( o.onlyMakeMesh ) return b

		if(o.phySize) o.size = o.phySize
		if(o.phyPos) o.pos = o.phyPos

		// add to physic worker 
		root.post( { m:'add', o:o } )

		//console.log(b)

		return b

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		/*if(b.isInstance){

			b.instance.setTransformAt( b.id, o.pos, o.quat, b.noScale ? [1,1,1] : b.size )
		    b.position = {x:o.pos[0], y:o.pos[1], z:o.pos[2]}

		}else{*/
			if( o.pos ) b.position.fromArray( o.pos )
		    if( o.quat ) b.quaternion.fromArray( o.quat )

		    b.auto = o.auto || false

		    if( !b.auto ) {
		    	b.matrixAutoUpdate = false
			    b.updateMatrix()
			} else {
				b.matrixAutoUpdate = true
			}
		//}

		

	}

	addInstance ( o, material ) {

		let bb = new Instance( this.geometry( o ), material, 0 )

		if(o.v) bb.v = o.v;
		if(o.index) bb.index = o.index;
		bb.type = o.type;

    	//bb.matrixAutoUpdate = false
    	//bb.instanceMatrix.setUsage( DynamicDrawUsage )
    	bb.receiveShadow = o.shadow !== undefined ? o.shadow : true;
    	bb.castShadow = o.shadow !== undefined ? o.shadow : true;

    	bb.name = o.instance;
    	//bb.n = 0
		root.scene.add( bb )
		root.instanceMesh[ o.instance ] = bb

		//console.log(bb.name+" is add")

    	return bb

	}

}