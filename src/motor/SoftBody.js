/*global THREE*/
import { geometryInfo, ConvexGeometry } from './Geometry.js';
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    SHOT - SOFTBODY
*/

function SoftBody() {

	this.ID = 0;
	this.softs = [];

	this.tmpMat = null;

}

Object.assign( SoftBody.prototype, {

	step: function ( AR, N ) {

		var softPoints = N;

		this.softs.forEach( function ( b ) {

			var n, c, cc, p, j, k, u;
	        var g = b.geometry;
	        var t = b.softType; // type of softBody
	        var order = null;
	        var isWithColor = g.attributes.color ? true : false;
	        var isWithNormal = g.attributes.normal ? true : false;


	        if ( t === 2 ) { // rope

	            j = g.positions.length;
	            while ( j -- ) {

	                n = softPoints + ( j * 3 );
	                g.positions[ j ].set( AR[ n ], AR[ n + 1 ], AR[ n + 2 ] );

				}

	            g.updatePath();

	        } else {

	            if ( ! g.attributes.position ) return;

	            p = g.attributes.position.array;
	            if ( isWithColor ) c = g.attributes.color.array;

	            if ( t === 5 || t === 4 ) { // softTriMesh // softConvex

	                var max = g.numVertices;
	                var maxi = g.maxi;
	                var pPoint = g.pPoint;
	                var lPoint = g.lPoint;

	                j = max;
	                while ( j -- ) {

	                    n = ( j * 3 ) + softPoints;
	                    if ( j == max - 1 ) k = maxi - pPoint[ j ];
	                    else k = pPoint[ j + 1 ] - pPoint[ j ];
	                    var d = pPoint[ j ];
	                    while ( k -- ) {

	                        u = lPoint[ d + k ] * 3;
	                        p[ u ] = AR[ n ];
	                        p[ u + 1 ] = AR[ n + 1 ];
	                        p[ u + 2 ] = AR[ n + 2 ];

						}

					}

	            } else { // cloth // ellipsoid

	                if ( g.attributes.order ) order = g.attributes.order.array;
	                j = p.length;

	                n = 2;

	                if ( order !== null ) {

	                    j = order.length;
	                    while ( j -- ) {

	                        k = order[ j ] * 3;
	                        n = j * 3 + softPoints;
	                        p[ k ] = AR[ n ];
	                        p[ k + 1 ] = AR[ n + 1 ];
	                        p[ k + 2 ] = AR[ n + 2 ];

	                        cc = Math.abs( AR[ n + 1 ] / 10 );
	                        c[ k ] = cc;
	                        c[ k + 1 ] = cc;
	                        c[ k + 2 ] = cc;

						}

	                } else {

	                     while ( j -- ) {

	                        p[ j ] = AR[ j + softPoints ];
	                        if ( n == 1 ) {

	                            cc = Math.abs( p[ j ] / 10 );
	                            c[ j - 1 ] = cc;
	                            c[ j ] = cc;
	                            c[ j + 1 ] = cc;

							}
	                        n --;
	                        n = n < 0 ? 2 : n;

						}

	                }

	            }

	            if ( t !== 2 ) g.computeVertexNormals();

	            if ( isWithNormal ) {

	                var norm = g.attributes.normal.array;

	                j = max;
	                while ( j -- ) {

	                    if ( j == max - 1 ) k = maxi - pPoint[ j ];
	                    else k = pPoint[ j + 1 ] - pPoint[ j ];
	                    var d = pPoint[ j ];
	                    var ref = lPoint[ d ] * 3;
	                    while ( k -- ) {

	                        u = lPoint[ d + k ] * 3;
	                        norm[ u ] = norm[ ref ];
	                        norm[ u + 1 ] = norm[ ref + 1 ];
	                        norm[ u + 2 ] = norm[ ref + 2 ];

						}

					}

	                g.attributes.normal.needsUpdate = true;

	            }

	            if ( isWithColor ) g.attributes.color.needsUpdate = true;
	            g.attributes.position.needsUpdate = true;

	            g.computeBoundingSphere();

	        }

	        softPoints += b.points * 3;

		} );



	},

	clear: function () {

		while ( this.softs.length > 0 ) this.destroy( this.softs.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		if ( b.parent ) b.parent.remove( b );
		map.delete( b.name );

	},

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var b = map.get( name );

		var n = this.softs.indexOf( b );
		if ( n !== - 1 ) {

			this.softs.splice( n, 1 );
			this.destroy( b );

		}

	},

	add: function ( o ) {


		var name = o.name !== undefined ? o.name : o.type + this.ID ++;

		// delete old if same name
		this.remove( name );

		// position
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		// size
	    o.size = o.size == undefined ? [ 1, 1, 1 ] : o.size;
	    o.size = root.correctSize( o.size );
		// rotation is in degree or Quaternion
	    o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
	    if( o.rot !== undefined ){ o.quat = root.toQuatArray( o.rot ); delete ( o.rot ); }

		// material

		var material;
		if ( o.material !== undefined ) {

			if ( o.material.constructor === String ) material = root.mat[ o.material ];
			else material = o.material;

		} else {

			material = root.mat.soft;

		}

		var tmp, mesh;

		switch ( o.type ) {

			case 'softMesh': case 'softTriMesh': tmp = softMesh( o, material ); break;
			case 'softConvex': tmp = softMesh( o, material ); break;
			case 'softCloth': tmp = softCloth( o, material ); break;
			case 'softRope': tmp = softRope( o, material ); break;

			case 'softEllips':// tmp = ellipsoid( o )
			    this.tmpMat = material;
				root.post( 'add', o );

				return;
				break;

		}

		mesh = tmp.mesh;
		o = tmp.o;

		mesh.name = name;
		//mesh.isSoft = true;
		mesh.type = 'soft';

		//mesh.position.fromArray( o.pos );
	    //mesh.quaternion.fromArray( o.quat );


	    root.container.add( mesh );
		this.softs.push( mesh );

		map.set( name, mesh );

		root.post( 'add', o );

	},

	createEllipsoid: function ( o ) {

		var mesh = ellipsoid( o );
		if(this.tmpMat) mesh.material = this.tmpMat;
		//o = tmp.o;

		mesh.name = o.name;
		root.container.add( mesh );
		this.softs.push( mesh );
		map.set( o.name, mesh );

	},

	/////



} );


export { SoftBody };



//--------------------------------------
//   SOFT TRIMESH
//--------------------------------------

export function softMesh( o, material ) {

	var g = o.shape.clone();
	
	// apply scale before get geometry info
	g.scale( o.size[ 0 ], o.size[ 1 ], o.size[ 2 ] );

	geometryInfo( g );

	root.extraGeo.push( g );

	o.v = g.realVertices;
	o.i = g.realIndices;
	o.ntri = g.numFaces;

	// position and rotation after get geometry info
	g.translate( o.pos[ 0 ], o.pos[ 1 ], o.pos[ 2 ] );
	g.applyMatrix( root.tmpM.makeRotationFromQuaternion( root.tmpQ.fromArray( o.quat ) ) );


	var mesh = new THREE.Mesh( g, material );

	mesh.castShadow = true;
	mesh.receiveShadow = true;

	mesh.softType = 5;
	mesh.points = o.v.length / 3;

	if ( o.shape ) delete ( o.shape );
	if ( o.material ) delete ( o.material );

	return { mesh: mesh, o: o };

}

//--------------------------------------
//   SOFT CONVEX
//--------------------------------------

/*export function softConvex( o, material ) {

    var g = o.shape.clone();
    var pos = o.pos || [0,0,0];
    var size = o.size || [1,1,1];
    var rot = o.rot || [0,0,0];

    g.translate( pos[0], pos[1], pos[2] );
    g.scale( size[0], size[1], size[2] );
    // g.applyMatrix( new THREE.Matrix4().makeRotationY(rot[1] *= Math.torad ));

    geometryInfo( g );

    root.extraGeo.push( g );

    o.v = g.realVertices;

    //var material = o.material === undefined ? root.mat.soft : root.mat[o.material];
    var mesh = new THREE.Mesh( g, material );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    mesh.softType = 4;
    mesh.points = o.v.length / 3;

    //mesh.idx = view.setIdx( softs.length, 'softs' );
    //view.setName( o, mesh );

    //this.byName[ o.name ] = mesh;

    //this.scene.add( mesh );
    //this.softs.push( mesh );

    if( o.shape ) delete(o.shape);
    if( o.material ) delete(o.material);

    return { mesh: mesh, o: o };

};*/


export function softCloth( o, material ) {

	var div = o.div || [ 16, 16 ];
	var size = o.size || [ 100, 0, 100 ];
	var pos = o.pos || [ 0, 0, 0 ];

	var max = div[ 0 ] * div[ 1 ];

	var g = new THREE.PlaneBufferGeometry( size[ 0 ], size[ 2 ], div[ 0 ] - 1, div[ 1 ] - 1 );
	g.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ) );
	g.rotateX( - Math.PI90 );
	//g.translate( -size[0]*0.5, 0, -size[2]*0.5 );

	//var numVerts = g.attributes.position.array.length / 3;

	var mesh = new THREE.Mesh( g, material );

	//mesh.idx = view.setIdx( softs.length, 'softs' );

	//view.setName( o, mesh );
	//this.byName[ o.name ] = mesh;

	// mesh.material.needsUpdate = true;
	mesh.position.set( pos[ 0 ], pos[ 1 ], pos[ 2 ] );

	mesh.castShadow = true;
	mesh.receiveShadow = true;//true;
	//mesh.frustumCulled = false;

	mesh.softType = 1;
	mesh.points = g.attributes.position.array.length / 3;

	o.size = size;
	o.div = div;
	o.pos = pos;


	return { mesh: mesh, o: o };

}

//--------------------------------------
//   ROPE
//--------------------------------------

export function softRope( o, material ) {

	//var max = o.numSegment || 10;
	//var start = o.start || [0,0,0];
	//var end = o.end || [0,10,0];

	// max += 2;
	/*var ropeIndices = [];

    //var n;
    //var pos = new Float32Array( max * 3 );
    for(var i=0; i<max-1; i++){

        ropeIndices.push( i, i + 1 );

    }*/

	if ( o.numSeg === undefined ) o.numSeg = o.numSegment;

	var g = new THREE.Tubular( o, o.numSeg || 10, o.radius || 0.2, o.numRad || 6, false );

	var mesh = new THREE.Mesh( g, material );

	mesh.castShadow = true;
	mesh.receiveShadow = true;

	mesh.softType = 2;
	mesh.points = g.positions.length;

	return { mesh: mesh, o: o };

}

//--------------------------------------
//   ELLIPSOID
//--------------------------------------
/*
function ellipsoid( o ) {

    // send to worker
    root.send( 'add', o );

};
*/
export function ellipsoid( o ) {

	var max = o.lng;
	var points = [];
	var ar = o.a;
	var i, j, k, v, n;

	// create temp convex geometry and convert to buffergeometry
	for ( i = 0; i < max; i ++ ) {

		n = i * 3;
		points.push( new THREE.Vector3( ar[ n ], ar[ n + 1 ], ar[ n + 2 ] ) );

	}



	var gt = new ConvexGeometry( points );


	var indices = new Uint32Array( gt.faces.length * 3 );
	var vertices = new Float32Array( max * 3 );
	var order = new Float32Array( max );
	//var normals = new Float32Array( max * 3 );





	// get new order of vertices
	v = gt.vertices;
	i = max;
	//var v = gt.vertices;
	//var i = max, j, k;
	while ( i -- ) {

		j = max;
		while ( j -- ) {

			n = j * 3;
			if ( ar[ n ] == v[ i ].x && ar[ n + 1 ] == v[ i ].y && ar[ n + 2 ] == v[ i ].z ) order[ j ] = i;

		}

	}


	i = max;
	while ( i -- ) {

		n = i * 3;
		k = order[ i ] * 3;

		vertices[ k ] = ar[ n ];
		vertices[ k + 1 ] = ar[ n + 1 ];
		vertices[ k + 2 ] = ar[ n + 2 ];

	}

	// get indices of faces
	i = gt.faces.length;
	while ( i -- ) {

		n = i * 3;
		var face = gt.faces[ i ];
		indices[ n ] = face.a;
		indices[ n + 1 ] = face.b;
		indices[ n + 2 ] = face.c;

	}


	//gt.computeVertexNormals();
	//gt.computeFaceNormals();


	//console.log(gtt.vertices.length)
	var g = new THREE.BufferGeometry();//.fromDirectGeometry( gt );

	g.setIndex( new THREE.BufferAttribute( indices, 1 ) );
	g.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
	g.setAttribute( 'color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ) );
	g.setAttribute( 'order', new THREE.BufferAttribute( order, 1 ) );

	//g.setAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );

	if ( gt.uvs ) {

		var uvs = new Float32Array( gt.uvs.length * 2 );
		g.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ).copyVector2sArray( gt.uvs ), 2 );

	}


	g.computeVertexNormals();

	root.extraGeo.push( g );


	gt.dispose();


	//g.setAttribute('color', new THREE.BufferAttribute( new Float32Array( max * 3 ), 3 ));
	var mesh = new THREE.Mesh( g, root.mat.soft );

	//mesh.idx = view.setIdx( softs.length, 'softs' );

	//this.byName[ o.name ] = mesh;

	//this.setName( o, mesh );

	mesh.softType = 3;
	//mesh.isSoft = true;
	mesh.type = 'soft';
	mesh.points = g.attributes.position.array.length / 3;

	//console.log( mesh.points )

	mesh.castShadow = true;
	mesh.receiveShadow = true;

	return mesh;

	//this.scene.add( mesh );
	//this.softs.push( mesh );

}
