/*global Ammo*/
import { math } from './math.js';
import { root, map } from './root.js';

/**   _   _____ _   _
*    | | |_   _| |_| |
*    | |_ _| | |  _  |
*    |___|_|_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*
*    GUN - SOFTBODY
*/

function SoftBody() {

	this.ID = 0;
	this.softs = [];

}

Object.assign( SoftBody.prototype, {

	step: function ( AR, N ) {

		var softPoints = N, n, s, j;
		var scale = root.scale;

		this.softs.forEach( function ( b ) {

			s = b.get_m_nodes(); // get vertrices list
			j = s.size();

			while ( j -- ) {

				n = softPoints + ( j * 3 );
				s.at( j ).get_m_x().toArray( AR, n, scale );

			}

			softPoints += s.size() * 3;

		});

	},

	getNodes: function ( b ) {

		var list = [];

		var s = b.get_m_nodes(), r; // get vertrices list
		var lng = s.size();

		for ( var j = 0; j < lng; j ++ ) {

			//n = ( j * 3 );
			r = s.at( j ).get_m_x().toArray();
			if ( r[ 1 ] > 300 ) list.push( j );
			//list.push( r );


		}

		return list;

	},

	/*move: function ( o ) {

		if ( ! map.has( o.name ) ) return;
		var soft = map.get( o.name );

		var s = soft.get_m_nodes();
		//console.log(s)
		var j = s.size();
		while ( j -- ) {
			//pos = s.at( j ).get_m_x().add( new Ammo.btVector3(0, 10, 0) );
		}

		soft.set_m_nodes( s );

	},*/

	clear: function () {

		while ( this.softs.length > 0 ) this.destroy( this.softs.pop() );
		this.ID = 0;

	},

	destroy: function ( b ) {

		root.world.removeSoftBody( b );
		Ammo.destroy( b );
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

	addAreo: function ( o ) {

		if ( ! map.has( o.soft )) return;
		var soft = map.get( o.soft );
		var p0 = math.vector3().fromeArray( o.wind );
		var i = o.nodes.length;
		while( i-- ) soft.addAeroForceToNode( p0, o.nodes[i] );
		p0.free();

	},

	addAnchor: function ( o ) {

		if ( ! map.has( o.soft ) || ! map.has( o.body ) ) return;
		var collision = o.collision || false;
		var soft = map.get( o.soft );
		var body = map.get( o.body );

		var i = o.nodes.length;
		while(i--) soft.appendAnchor( o.nodes[i], body, collision ? false : true, o.influence || 1 );

	},

	add: function ( o ) {

		var name = o.name !== undefined ? o.name : 'soft' + this.ID ++;

		// delete old if same name
		this.remove( name );

		var worldInfo = root.world.getWorldInfo();



		var gendiags = o.gendiags || true;
		//var fixed = o.fixed || 0;

		o.size = o.size == undefined ? [ 1, 1, 1 ] : o.size;
		o.pos = o.pos === undefined ? [ 0, 0, 0 ] : o.pos;
		o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
		o.div = o.div == undefined ? [ 64, 64 ] : o.div;

		if ( root.scale !== 1 ) {

			o.pos = math.vectomult( o.pos, root.invScale );
			o.size = math.vectomult( o.size, root.invScale );

		}

		//console.log(o.pos)

		var p0 = math.vector3();
		var p1 = math.vector3();
		var p2 = math.vector3();
		var p3 = math.vector3();
		var p4 = math.vector3();
		var trans = math.transform();

		var softBodyHelpers = new Ammo.btSoftBodyHelpers();

		//console.log( softBodyHelpers )

		var body;

		switch ( o.type ) {

			case 'softMesh': //case 'softConvex':

			    // scale geometry
			    if ( root.scale !== 1 ){
			    	var j = o.v.length;
			        while ( j -- ) o.v[ j ] *= root.invScale;
			    }
			    
				body = softBodyHelpers.CreateFromTriMesh( worldInfo, o.v, o.i, o.ntri, o.randomize || true );
				body.softType = 5;

			break;

			case 'softCloth':

				var mw = o.size[ 0 ] * 0.5;
				var mh = o.size[ 2 ] * 0.5;

				p1.fromArray( [ - mw, 0, - mh ] );
				p2.fromArray( [ mw, 0, - mh ] );
				p3.fromArray( [ - mw, 0, mh ] );
				p4.fromArray( [ mw, 0, mh ] );

				body = softBodyHelpers.CreatePatch( worldInfo, p1, p2, p3, p4, o.div[ 0 ], o.div[ 1 ], o.fixed || 0, gendiags );
				body.softType = 1;

				break;

			case 'softRope':

				p1.fromArray( o.start || [ - 10, 0, 0 ], 0, root.invScale );
				p2.fromArray( o.end || [ 10, 0, 0 ], 0, root.invScale );

				var nseg = o.numSegment || 10;
				nseg -= 2;

				//if ( o.margin === undefined ) o.margin = o.radius || 0.2;
				body = softBodyHelpers.CreateRope( worldInfo, p1, p2, nseg, o.fixed || 0 );
				//body.setTotalMass(o.mass);
				body.softType = 2;

				break;

			case 'softEllips':

				p1.fromArray( o.center || [ 0, 0, 0 ], 0, root.invScale );
				p2.fromArray( o.radius || [ 3, 3, 3 ], 0, root.invScale );

				body = softBodyHelpers.CreateEllipsoid( worldInfo, p1, p2, o.vertices || 128 );
				body.softType = 3;

				var a = [];
				var b = body.get_m_nodes();
				var j = b.size(), n, node, p;
				while ( j -- ) {

					n = ( j * 3 );
					node = b.at( j );
					p = node.get_m_x();
					a[ n ] = p.x();
					a[ n + 1 ] = p.y();
					a[ n + 2 ] = p.z();

				}

				o.lng = b.size();
				o.a = a;

				self.postMessage( { m: 'ellipsoid', o: o } );

			break;

			case 'softConvex': // BUG !!

			    //var j = o.v.length;
			    //while( j-- ) { o.v[ j ] *= root.invScale; }

				var lng = o.v.length / 3;
				var arr = [];
				var i = 0, n;

				//var ff = new Ammo.btVector3Array();

				for ( i = 0; i<lng; i++ ) {

					n = i * 3;
					//p1.fromArray( o.v, n, root.invScale );
					//arr.push( p1.clone() );
					//body.get_m_nodes().at( i ).set_m_x( p1 );
					//body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));

					//arr.push( new Ammo.btVector3( o.v[n], o.v[n+1], o.v[n+2]) );
					//arr[i] = new Ammo.btVector3( o.v[n], o.v[n+1], o.v[n+2]);

					//arr.push(  [o.v[n], o.v[n+1], o.v[n+2]] );

				}

				//







                var hull = new Ammo.btConvexHullShape()

                for ( i = 0; i<lng; i++ ) {

					n = i * 3;
					p1.fromArray( o.v, n, root.invScale );
					hull.addPoint( p1 );
				}

				//hull.recalcLocalAabb();
				hull.initializePolyhedralFeatures();

                //console.log(hull, hull.getNumVertices() )

                //console.log(hull.getConvexPolyhedron().m_vertices.size() )

				body = softBodyHelpers.CreateFromConvexHull( worldInfo, hull.getConvexPolyhedron(), hull.getConvexPolyhedron().m_vertices.size(), o.randomize || false );


				//body = softBodyHelpers.CreateFromConvexHull( worldInfo, hull.getConvexPolyhedron(), hull.getConvexPolyhedron().get_m_vertices().size(), o.randomize || true );

				//body.setCollisionShape( fff )
				//body = softBodyHelpers.CreateFromConvexHull( worldInfo, arr, lng, o.randomize || true );
				//body.generateBendingConstraints( hull.getNumVertices() );
				body.softType = 4;

				//console.log(body)



				// free node
				/*i = lng;
				//while ( i -- ) arr[i].free();
				// force nodes
				//var i = lng, n;
				for ( i = 0; i<lng; i++ ) {

					n = i * 3;
					p1.fromArray( o.v, n, root.invScale );
					body.get_m_nodes().at( i ).set_m_x( p1 );
					//body.get_m_nodes().at( i ).set_m_x(new Ammo.btVector3(o.v[n], o.v[n+1], o.v[n+2]));

				}
*/
				console.log( body, body.get_m_nodes().size() )

			break;

			

		}


		// apply parametre
		this.applyOption( body, o );
		

		// apply position and rotation
		trans.identity().fromArray( o.pos.concat( o.quat ) );
		body.transform( trans );


		// Soft-soft and soft-rigid collisions
		root.world.addSoftBody( body, o.group || 1, o.mask || - 1 );


		body.setActivationState( o.state || 4 );
		body.points = body.get_m_nodes().size();
		body.name = name;

		body.type = 'soft';

		this.softs.push( body );

		map.set( name, body );

		// free math
		p0.free();
		p1.free();
		p2.free();
		p3.free();
		p4.free();
		trans.free();
		o = null;

	},

	applyOption: function ( body, o ) {

		var sb = body.get_m_cfg();

		//console.log(sb.get_kVC())

		if ( o.viterations !== undefined ) sb.set_viterations( o.viterations );// Velocities solver iterations 0 // velocityIterations
		if ( o.piterations !== undefined ) sb.set_piterations( o.piterations );// Positions solver iterations 1 // positionIterations
		if ( o.diterations !== undefined ) sb.set_diterations( o.diterations );// Drift solver iterations 0 // driftIterations
		if ( o.citerations !== undefined ) sb.set_citerations( o.citerations );// Cluster solver iterations 4 // clusterIterations

		sb.set_collisions( 0x11 );

		if ( o.friction !== undefined ) sb.set_kDF( o.friction );// Dynamic friction coefficient [0,1] def 0.2
		if ( o.damping !== undefined ) sb.set_kDP( o.damping );// Damping coefficient [0,1] def:0
		if ( o.pressure !== undefined ) sb.set_kPR( o.pressure );// Pressure coefficient [-inf,+inf] def:0

		if ( o.drag !== undefined ) sb.set_kDG( o.drag );// Drag coefficient [0,+inf] def:0
		if ( o.lift !== undefined ) sb.set_kLF( o.lift );// Lift coefficient [0,+inf] def:0

		if ( o.volume !== undefined ) sb.set_kVC( o.volume ); // Volume conversation coefficient [0,+inf] def:0
		if ( o.matching !== undefined ) sb.set_kMT( o.matching );// Pose matching coefficient [0,1] def:0

		if ( o.hardness !== undefined ) {

			sb.set_kCHR( o.hardness );// Rigid contacts hardness [0,1] def : 1.0
			sb.set_kKHR( o.hardness );// Kinetic contacts hardness [0,1] def : 0.1
			sb.set_kSHR( o.hardness );// Soft contacts hardness [0,1] def: 1.0
			sb.set_kAHR( o.hardness );// Anchors hardness [0,1] def:0.7

		}

		if ( o.timescale !== undefined ) sb.set_timescale( o.timescale );// def:1
		if ( o.maxvolume !== undefined ) sb.set_maxvolume( o.maxvolume );// Maximum volume ratio for pose def:1
		

		/*
        kSRHR_CL;               // Soft vs rigid hardness [0,1] (cluster only)
        kSKHR_CL;               // Soft vs kinetic hardness [0,1] (cluster only)
        kSSHR_CL;               // Soft vs soft hardness [0,1] (cluster only)
        kSR_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
        kSK_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
        kSS_SPLT_CL;    // Soft vs rigid impulse split [0,1] (cluster only)
        */

        var mat = body.get_m_materials().at( 0 );

        //mat.set_m_flags(0);// def 1


        //console.log(body, sb, mat)



		if ( o.stiffness !== undefined ) { // range (0,1)

			mat.set_m_kLST( o.stiffness ); // linear
			mat.set_m_kAST( o.stiffness ); // angular
			mat.set_m_kVST( o.stiffness ); // volume

		}

		if( o.bendingConstraint  !== undefined  ){
			// ( int distance > 1, material )
			body.generateBendingConstraints( o.bendingConstraint, mat );

		}

		//body.set_m_cfg( sb );

		body.setTotalMass( o.mass || 0, o.fromfaces || false );

		if( o.cluster  !== undefined  ){

			body.generateClusters( o.cluster, o.maxClusterIterations || 8192 );
			
		}

		//body.setPose( true, true );
		if ( o.restitution !== undefined ) body.setRestitution( o.restitution );
		if ( o.rolling !== undefined ) body.setRollingFriction( o.rolling );
		if ( o.flag !== undefined ) body.setCollisionFlags( o.flag );
		if ( o.margin !== undefined ) Ammo.castObject( body, Ammo.btCollisionObject ).getCollisionShape().setMargin( o.margin * root.invScale );// def 0.25




	}

} );

export { SoftBody };
