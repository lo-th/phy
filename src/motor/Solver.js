import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, math, mat } from './root.js';

import {
	Object3D, Group
} from 'three';


export class Solver extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'solver'

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

		let name = this.setName( o );

        let solver = new Articulation( o )

        // add to world
		this.addToWorld( solver, o.id )

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

export class Articulation extends Object3D {

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

	stop (){

		root.post({ m:'stopArticulation', o:{ name:this.name } });

	}

	commonInit (){

		root.post({ m:'commonInitArticulation', o:{ name:this.name } });

	}

	addJoint ( o ) {

		this.jid = this.joints.length;

		o.name = o.name || ( this.name + '_Joint_' + this.jid );
		o.solver = this.name;

		if( o.rot1 !== undefined ){ o.quat1 = math.toQuatArray( o.rot1 ); delete ( o.rot1 ); }
		if( o.rot2 !== undefined ){ o.quat2 = math.toQuatArray( o.rot2 ); delete ( o.rot2 ); }
		
		if(o.type!=='fixe') {
			this.joints.push( new SolverJoint( o, this ) );
			//console.log(o.name)
		}

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

export class SolverJoint {

	constructor( o, solver ) {

		this.name = o.name;
		this.solver = solver;
		this.type = 'solverJoint';
		this.isDrive = false;

		this.data = {

			target:{ x:0, y:0, z:0, twist:0, swing1:0, swing2:0, count:0 },

		}

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
		this.start = 0
		this.time = 0;

	}

	start (){

	}

	pose( target, time ){



		// linear target need to be clamp ?!
		this.target = math.clamp( target, this.min, this.max );
		//this.current = this.data.target[ this.driveType ];
		this.current = math.clamp( this.data.target[ this.driveType ], this.min, this.max );

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
			let move = math.lerp( this.start, this.target, t );//this.current + (this.target - this.current) * t;
			
		    root.update({ name:this.name, drivesTarget: [[ this.driveType, move ]] });

		    //console.log('yoo',{ name:this.name, drivesTarget: [[ this.driveType, move ]] } )

		    //root.flow.tmp.push( { name:this.name, drivesTarget: [[ this.driveType, move ]] } )

		    if( t === 1 ) this.isDrive = false;

		}


	}


}