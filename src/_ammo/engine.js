import { root, Utils, math } from './root.js'
import { getType, getArray } from '../core/Config.js';

import { Ray } from './Ray.js'
import { Body } from './Body.js'
import { Joint } from './Joint.js'
import { Contact } from './Contact.js'
import { Vehicle } from './Vehicle.js'
import { Terrain } from './Terrain.js'
import { Character } from './Character.js'

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*
*    AMMO ENGINE
*/

self.onmessage = function ( m ) { engine.message( m ) }

let items;

let isTimeout = false;
let outsideStep = false;
let isSoft = true;

let Ar, ArPos;
let isBuffer = false;
let returnMessage, isWorker;

const Time = typeof performance === 'undefined' ? Date : performance;

const t = { tmp:0, n:0, dt:0, fps:0 };

let timestep = 1/60;
let interval = 16.67;
let substep = 4;
let fixe = true;
let broadphase = 2;

let startTime = 0, lastTime = 0;
let isStop = true, isReset, tmpStep;

let intertime = null;
let timeout = null;

let gravity = null;
let penetration = null;

let flow = {}
let current = ''

let Solver, SolverSoft, CollisionConfig, Dispatcher, Broadphase;


export class engine {

	static test (){}

	static message ( m ) {

		let e = m.data
		if( e.Ar ) Ar = e.Ar
		if( e.flow ) flow = e.flow
		if( e.m ) engine[ e.m ]( e.o )

	}

	static post ( e, buffer ){

		if( isWorker ) self.postMessage( e, buffer );
		else returnMessage( { data : e } );

	}

	static init ( o = {} ){

		isWorker = true;
		isBuffer = o.isBuffer || false;

		if( o.fps !== undefined ) timestep = 1 / o.fps;
		if( o.substep !== undefined ) substep = o.substep;

		if( o.message ){ 
			returnMessage = o.message;
			isWorker = false;
			isBuffer = false;
		}

		if( o.blob ) importScripts( o.blob )

		Ammo().then( ( Ammo ) => {

			self.Ammo = Ammo;

			Utils.extends()
			engine.initItems()

			engine.post( { m:'ready', o:{} } )

		})

	}

	static set ( o = {} ){

		ArPos = o.ArPos || getArray('AMMO', o.full)
		items.body.setFull(o.full)

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		interval = math.toFixed(timestep*1000, 2)

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
		    Ar = new Float32Array( ArPos.total );

		    // create new world
		    engine.initWorld()

		}

		isStop = false
		isReset = false
		lastTime = 0
		tmpStep = 0

		if( outsideStep ) return
		
		if( isTimeout ){
			if( timeout ) clearTimeout( timeout ); 
			timeout = setTimeout( engine.step, 0 );
		}
		else intertime = setInterval( engine.step, interval )
		
	}

    static initWorld () {

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

		//console.log(root.world)

    }

    static controle ( name ) {

		if( name === current ) return
		this.enable( current, false )
		current = name;
		this.enable( current, true )

	}

	static enable ( name, value ) {

		if( name === '' ) return
		let b = engine.byName( name )
		if( b === null ) return
		b.enable = value

	}

	static dispatch () {

		root.key = flow.key
		if( flow.remove ) while ( flow.remove.length > 0 ) this.remove( flow.remove.shift() )
		if( flow.add ) while ( flow.add.length > 0 ) this.add( flow.add.shift() )
		if( flow.tmp ) while ( flow.tmp.length > 0 ) this.change( flow.tmp.shift() )
		this.controle( flow.current )

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

		if( outsideStep ) return;

		

		if( isTimeout ){

			if( timeout ) clearTimeout( timeout );

			// If the worker was faster delay the next timestep
            let delay = interval - ( Time.now() - lastTime );
            if( delay < 0 ) delay = 0;
            timeout = setTimeout( engine.step, delay );

		}

	}

	static step ( stamp ){

		if( isReset ) engine.endReset();
		if( isStop || tmpStep >= 2 ) return;

		tmpStep = 2;

		startTime = stamp || Time.now();
		root.delta = ( startTime - lastTime ) * 0.001;
		lastTime = startTime;

		// timeStep - the amount of time in seconds to step the simulation by. Typically you're going to be passing it the time since you last called it.

        // maxSubSteps - the maximum number of steps that Bullet is allowed to take each time you call it.

        // fixedTimeStep - regulates resolution of the simulation. If your balls penetrates your walls instead of colliding with them try to decrease it.

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
		//while( n-- ) root.world.stepSimulation( timestep / substep, substep, timestep / substep );

		//if ( fixe ) root.world.stepSimulation( 1.0, substep, timestep / substep )
		//if ( fixe ) root.world.stepSimulation( timestep, 100, timestep / substep )
		if ( fixe ) root.world.stepSimulation( timestep, substep, timestep / substep )//, timestep / substep );
		else root.world.stepSimulation( root.delta, substep, timestep / substep );

		engine.stepItems()

		// get simulation stat
		if ( startTime - 1000 > t.tmp ){ t.tmp = startTime; root.reflow.stat.fps = t.n; t.n = 0; }; t.n++;
		root.reflow.stat.delta = root.delta

		if ( isBuffer ) engine.post( { m: 'step', reflow:root.reflow, Ar: Ar }, [ Ar.buffer ] );	
		else engine.post( { m:'step', reflow:root.reflow, Ar:Ar } );

	}

	static byName ( name ){

		return Utils.byName( name );

	}

	static reset (){ isReset = true }

	static endReset (){

		engine.stop();

		engine.resetItems()
		
		// clear world
		Ammo.destroy( root.world );
		Ammo.destroy( Solver );
		if ( isSoft ) Ammo.destroy( SolverSoft );
		Ammo.destroy( CollisionConfig );
		Ammo.destroy( Dispatcher );
		Ammo.destroy( Broadphase );
		root.world = null;
		current = '';

		Utils.clear()

		engine.post( { m:'resetCallback', o:{} } );

	}

	static stop (){

		isStop = true;

		if( outsideStep ) return;
		if( timeout ) clearTimeout( timeout );
		if( intertime ) clearInterval( intertime );
		intertime = null;
		timeout = null;

	}

	static pause( o ) {

		let pause = o.value;
		if( pause === isStop ) return
		if( pause ) this.stop()
		else this.start()

	}


	//-----------------------
	//
	//  ITEMS
	//
	//-----------------------

	static initItems () {

		items = {
			ray : new Ray(),
		    body : new Body(),
			solid : new Solid(),
			joint : new Joint(),
			contact : new Contact(),
			character : new Character(),
			vehicle : new Vehicle(),
			terrain : new Terrain(),
		}

		// reference function for rigidbody
		root.bodyRef = items.body
		root.byName = engine.byName

	}

	static resetItems() {

		for (const key in items) items[key].reset()

	}

	static stepItems() {

	    for (const key in items) items[key].step( Ar, ArPos[key] )

	}

	static add ( o = {} ){

		let type = getType( o )
		items[type].add( o )
		
	}

	static remove ( o = {} ){

		let b = this.byName( o.name );
		if( b === null ) return;
		items[b.type].clear( b )

	}

	static change ( o = {} ){

		let b = this.byName( o.name );
		if( b === null ) return;
		items[b.type].set( o, b )

	}

}


//--------------
//
//  SOLID ONLY 
//
//--------------

class Solid extends Body {
	constructor () {
		super()
		this.type = 'solid'
	}
	step ( AR, N ) {}
}