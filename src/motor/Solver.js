import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';
//import { Basic3D } from '../core/Basic3D.js';
import { Utils, root } from './root.js';

export class Solver extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'solver';

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, n

		while( i-- ){

			n = N + ( i * Num[this.type] )
			this.list[i].update( AR, n )

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

        return solver;


	}

	set ( o = {} ) {

	}

}

// ARTICULATION SOLVER

export class Articulation {//extends Basic3D 

	constructor( o ) {

		//super();

		this.name = o.name
		this.type = 'solver'
		this.needData = o.needData || false
		this.bones = []
		this.joints = []
		this.jid = 0
		this.speed = 1

	}

	addBone( name ){

		this.bones.push( name );

	}

	dispose(){

		root.motor.remove( this.bones, true );
		
	}

	update ( AR, n ){

		if( !this.needData ) return

		let k = this.joints.length, j, m

		while(k--){

			m = n + (k*7)

			j = this.joints[k]

			j.data.target.x = AR[ m + 0]
			j.data.target.y = AR[ m + 1]
			j.data.target.z = AR[ m + 2]

			j.data.target.rx = AR[ m + 3]//Math.round( AR[ m + 3] )
			j.data.target.ry = AR[ m + 4]//Math.round(  )
			j.data.target.rz = AR[ m + 5]//Math.round( AR[ m + 5] )

			/*j.data.target.twiwt = Math.round( AR[ m + 3] )
			j.data.target.swing1 = Math.round( AR[ m + 4] )
			j.data.target.swing2 = Math.round( AR[ m + 5] )*/

			j.data.target.count = AR[ m + 6 ]

		}

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

		if( o.rot1 !== undefined ){ o.quat1 = MathTool.quatFromEuler( o.rot1 ); delete ( o.rot1 ); }
		if( o.rot2 !== undefined ){ o.quat2 = MathTool.quatFromEuler( o.rot2 ); delete ( o.rot2 ); }
		
		if(o.type !== 'fixe') {
			this.joints.push( new SolverJoint( o, this ) );
		}

		root.post({ m:'addSolverJoint', o:o });

	}

	/*addBone ( mesh ) {

		console.log('bone is add')

		this.add( mesh );

	}*/

	driveJoints ( dt ) {

		let isInDrive = false;

		let k = this.joints.length, j, d, nup = [];

		while(k--){ 

			j = this.joints[k]
			j.update( dt );
			d = j.isDrive;
			if( j.nup ) nup.push( j.nup )
			isInDrive = d ? true : isInDrive;

		}

		// update or die
		if( isInDrive ) root.motor.change( nup )
		else {
			if(this.resolve){
				this.resolve();
				delete this.resolve;
			}
		}

	}

    setAngles ( angles, time ){

    	if(!angles) return

    	let j = this.joints.length;

    	while(j--){ 
    		this.joints[j].pose( angles[j] !== undefined ?  angles[j] : 0, time !== undefined ? time : this.speed );
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
		//this.inverse = o.inverse || false

		this.current = 0;
		this.tmp = 0;
		this.target = 0;
		this.start = 0
		this.time = 0;
		this.nup = null

		this.data = {

			target:{ x:0, y:0, z:0, rx:0, ry:0, rz:0, count:0 },

			//target:{ x:0, y:0, z:0, twist:0, swing1:0, swing2:0, count:0 },

		}

		if( o.limits ){
			this.driveType = o.limits[0][0];
			this.min = o.limits[0][1];
			this.max = o.limits[0][2];
		}

		if( o.position ) o.target = o.position;

		if( o.target ){
			let i = o.target.length, t

			while(i--){
				t = o.target[i];
				this.data.target[ t[0] ] = t[1];
				//if(t[0]===this.driveType)  this.current = t[1]

			}
		}

		//stiffness, damping, forceLimit, acceleration drive flag
		//o.drives = [[this.driveType, 100000, 0, Infinity, true ]];
		//solver.addJoint(o);
		
	}

	start (){

	}

	pose( target, time ){



		// linear target need to be clamp ?!
		this.target = MathTool.clamp( target, this.min, this.max );
		//this.current = this.data.target[ this.driveType ];
		this.current = MathTool.clamp( this.data.target[ this.driveType ], this.min, this.max );

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

		if( this.isDrive ){

		    this.tmp += dt*this.time;
			let t = this.tmp;
			t = (t > 1) ? 1 : t;

			//this.tmp = 1;//dt;
			//let t = this.tmp // this.time;
			//t = (t > 1) ? 1 : t;

			let move = MathTool.lerp( this.start, this.target, t );//this.current + (this.target - this.current) * t;

			this.nup = { name:this.name, drivesTarget: [[ this.driveType, move ]] }

		    if( t === 1 ) this.isDrive = false;

		} else {
			this.nup = null;
		}

	}

}