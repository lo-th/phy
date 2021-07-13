
import { root, Utils } from './root.js';

import { Body } from './Body.js';
import { Solid } from './Solid.js';
import { Joint } from './Joint.js';
import { Ray } from './Ray.js';
import { Contact } from './Contact.js';


//--------------
//
//  AMMO SIDE 
//
//--------------


self.onmessage = function ( m ) { engine.message( m ) }

let isTimeout = false;
let isSoft = true;

let Ar, ArPos, ArMax;
let isBuffer = false;
let returnMessage, isWorker;

let body, solid, joint, ray, contact;

const Time = typeof performance === 'undefined' ? Date : performance;

const t = { tmp:0, n:0, dt:0, fps:0 };

let timestep = 1/60;
let substep = 4;
let fixe = true;
let broadphase = 2;

let startTime = 0;
let lastTime = 0;
let isStop, isReset, tmpStep;

let interval = null;
let timeout = null;
let gravity = null;
let penetration = null;

let tmpadd = []
let tmpremove = []
let tmpchange = []

let Solver, SolverSoft, CollisionConfig, Dispatcher, Broadphase;

//--------------
//  OIMO SIDE 
//--------------

export class engine {

	static test (){}

	static message ( m ) {

		let e = m.data;

		if( e.Ar ) Ar = e.Ar;
		if( e.flow ) root.flow = e.flow;
		engine[ e.m ]( e.o );

	}

	static post ( e, buffer ){

		if( isWorker ) self.postMessage( e, buffer );
		else returnMessage( { data : e } );

	}

	static init ( o = {} ){

		isWorker = true;
		isBuffer = o.isBuffer || false;

		ArPos = o.ArPos;
		ArMax = o.ArMax;


		if( o.fps !== undefined ) timestep = 1 / o.fps;
		if( o.substep !== undefined ) substep = o.substep;

		if( o.returnMessage ){ 
			returnMessage = o.returnMessage;
			isWorker = false;
			isBuffer = false;
		}

		if( o.blob ) importScripts( o.blob )

		Ammo().then( function ( Ammo ) {

			Utils.extends()

			engine.initItems()

			engine.post( { m:'ready', o:{} } )

		})

	}

	static initItems () {

		body = new Body()
		solid = new Solid()
		joint = new Joint()
		ray = new Ray()
		contact = new Contact()

	}

	static set ( o = {} ){

		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		substep = o.substep || 1;
		fixe = o.fixe !== undefined ? o.fixe : true;
		broadphase = o.broadphase || 2;

		root.substep = substep

		isSoft = o.soft === undefined ? true : o.soft;

		gravity = new Ammo.btVector3().fromArray( o.gravity || [ 0, -9.8, 0 ] )

		if ( o.penetration ) penetration = o.penetration

		if( root.world === null ) engine.start();
		
	}

	static start (){

		if( root.world  === null ){

			// define transfer array
		    Ar = new Float32Array( ArMax );

		    // create new world
		    this.makeWorld()

		}

		isStop = false
		isReset = false
		lastTime = 0
		tmpStep = 0
		
		if( isTimeout ) engine.step();
		else interval = setInterval( engine.step, 1000 * timestep )
		
	}

    static makeWorld () {

    	 // create new world
		Solver = new Ammo.btSequentialImpulseConstraintSolver();
		SolverSoft = isSoft ? new Ammo.btDefaultSoftBodySolver() : null;
		CollisionConfig = isSoft ? new Ammo.btSoftBodyRigidBodyCollisionConfiguration() : new Ammo.btDefaultCollisionConfiguration();
		Dispatcher = new Ammo.btCollisionDispatcher( CollisionConfig );

		switch ( broadphase ) {

			//case 0: broadphase = new Ammo.btSimpleBroadphase(); break;
			case 1: let s = 1000; Broadphase = new Ammo.btAxisSweep3( new Ammo.btVector3( - s, - s, - s ), new Ammo.btVector3( s, s, s ), 4096 ); break;//16384;
			case 2: Broadphase = new Ammo.btDbvtBroadphase(); break;

		}

		root.world = isSoft ? new Ammo.btSoftRigidDynamicsWorld( Dispatcher, Broadphase, Solver, CollisionConfig, SolverSoft ) : new Ammo.btDiscreteDynamicsWorld( Dispatcher, Broadphase, Solver, CollisionConfig );

		root.world.setGravity( gravity );
		if ( isSoft ) {
			var worldInfo = root.world.getWorldInfo();
			worldInfo.set_m_gravity( gravity );
		}

		if ( penetration ) {

			var worldDispatch = root.world.getDispatchInfo();
			worldDispatch.set_m_allowedCcdPenetration( penetration );// default 0.0399}

		}

    }



	static add ( o = {} ){

		let type = o.type || 'box';

		switch( type ){
			case 'contact': contact.add( o ); break;
			case 'ray': ray.add( o ); break;
			case 'joint': joint.add( o ); break;
			default: 
			    if ( !o.density && !o.kinematic ) solid.add( o );
			    else body.add( o ); 
			break;

		}
		
	}

	static remove ( o = {} ){

		let b = this.byName( o.name );
		if( b === null ) return;
		let type = b.type;

		switch( type ){
			case 'contact': b = contact.clear( b ); break
			case 'ray': b = ray.clear( b ); break;
			case 'joint': b = joint.clear( b ); break;
			case 'solid': b = solid.clear( b ); break;
			case 'body': b = body.clear( b ); break;

		}

	}

	static change ( o = {} ){

		let b = this.byName( o.name );
		if( b === null ) return;
		let type = b.type;

		switch( type ){
			case 'ray': b = ray.set( o, b ); break;
			case 'joint': b = joint.set( o, b ); break;
			case 'solid': b = solid.set( o, b ); break;
			case 'body': b = body.set( o, b ); break;
		}

	}

	//static changes ( r = [] ){ for( let o in r ) this.change( r[o] ) }

	static dispatch (){

		tmpremove = root.flow.remove
		tmpadd = root.flow.add
		tmpchange = root.flow.tmp

		while ( tmpremove.length > 0 ) this.remove( tmpremove.shift() )
		while ( tmpadd.length > 0 ) this.add( tmpadd.shift() )
		while ( tmpchange.length > 0 ) this.change( tmpchange.shift() )

		root.flow = { key:[], add:[], remove:[], tmp:[] }
		
	} 

	static poststep (){

		if( isStop ) return;

		tmpStep = 1;

		this.dispatch()

		// for update object
		/*let i = root.flow.tmp.length;
		while( i-- ) this.change( root.flow.tmp[i] );*/

		//root.flow.tmp = [];
		//root.flow.key = [];

		

		if( isTimeout ){

			// If the worker was faster delay the next timestep
            let delay = timestep * 1000 - ( Time.now() - startTime );
            if( delay < 0 ) engine.step();
            else timeout = setTimeout( engine.step, delay );

		}

	}

	static step (){

		if( isReset ){ engine.endReset(); return }
		if( isStop || tmpStep === 2 ) return;

		tmpStep = 2;

		startTime = Time.now();
		root.delta = ( startTime - lastTime ) * 0.001;
		lastTime = startTime;

		///stepSimulation proceeds the simulation over 'timeStep', units in preferably in seconds.
		///By default, Bullet will subdivide the timestep in constant substeps of each 'fixedTimeStep'.
		///in order to keep the simulation real-time, the maximum number of substeps can be clamped to 'maxSubSteps'.
		///You can disable subdividing the timestep/substepping by passing maxSubSteps=0 as second argument to stepSimulation, but in that case you have to keep the timeStep constant.

		// timeStep < subSteps * fixedTimeStep if you don't want to lose time

		/*・ timeStep ... How many seconds will you spend
		  MaxSubSteps: How many times can I divide time internally?
		  ・ FixedTimeStep ... Internally, this time interval is calculated

		     
		For example, if you give (1.0, 100, 1/60) as an argument,
		  "Simulate the state after 1 second by 1/60 seconds at a time. However, you can only calculate up to 100 times."
		  It becomes. The unit is seconds, not milliseconds.
		  */

		let n = substep;
		//while( n-- ) root.world.stepSimulation( timestep / substep, 0 );

		//if ( fixe ) root.world.stepSimulation( 1.0, substep, timestep / substep )
		//if ( fixe ) root.world.stepSimulation( timestep, 100, timestep / substep )
		if ( fixe ) root.world.stepSimulation( timestep, substep, timestep / substep )//, timestep / substep );
		//else root.world.stepSimulation( root.delta, substep, timestep / substep );

		engine.stepItems()

		// get simulation stat
		if ( startTime - 1000 > t.tmp ){ t.tmp = startTime; root.reflow.stat.fps = t.n; t.n = 0; }; t.n++;
		root.reflow.stat.delta = root.delta

		if ( isBuffer ) engine.post( { m: 'step', reflow:root.reflow, Ar: Ar }, [ Ar.buffer ] );	
		else engine.post( { m:'step', reflow:root.reflow, Ar:Ar } );

	}

	static stepItems () {

		body.step( Ar, ArPos.body );
		joint.step( Ar, ArPos.joint );
		ray.step( Ar, ArPos.ray );
		contact.step( Ar, ArPos.contact );

	}

	static byName ( name ){

		return Utils.byName( name );

	}

	static reset (){ isReset = true }

	static endReset (){

		engine.stop();

		body.reset();
		solid.reset();
		joint.reset();
		ray.reset();
		contact.reset();

		// clear world
		Ammo.destroy( root.world );
		Ammo.destroy( Solver );
		if ( isSoft ) Ammo.destroy( SolverSoft );
		Ammo.destroy( CollisionConfig );
		Ammo.destroy( Dispatcher );
		Ammo.destroy( Broadphase );
		root.world = null;

		Utils.clear()

		engine.post( { m:'resetCallback', o:{} } );

	}

	static stop (){

		isStop = true;

		if( timeout ) clearTimeout( timeout );
		if( interval ) clearInterval( interval );
		interval = null;
		timeout = null;

	}

	static pause (){

		if( !isStop ) this.stop();
		else this.start();

	}

	


}