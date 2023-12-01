
import * as CANNON from '../libs/cannon-es.js'

import { root, Utils, Vec3, Quat } from './root.js';
import { Num, getType, getArray } from '../core/Config.js';

import { Body } from './Body.js';
import { Joint } from './Joint.js';

//--------------
//
//  CANNON SIDE 
//
//--------------

self.onmessage = function ( m ) { engine.message( m ) }

let isTimeout = false;
let outsideStep = false;

//let Ar, ArPos
let isBuffer = false;
let returnMessage, isWorker;

let body, solid, joint, ray, contact;

const Time = typeof performance === 'undefined' ? Date : performance;

const t = { tmp:0, n:0, dt:0, fps:0 };

let timestep = 1/60;
let substep = 10;
let broadphase = 2;
let fixe = true;

let startTime = 0, lastTime = 0;
let isStop = true, isReset, tmpStep;

let interval = null
let timeout = null

let gravity = null

let tmpadd = []
let tmpremove = []
let tmpchange = []


export class engine {

	static test (){}

	static message ( m ) {

		let e = m.data;
		if( e.Ar ) root.Ar = e.Ar;
		if( e.flow ) root.flow = e.flow;
		if(!engine[ e.m ]) console.log(e.m)
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

		engine.initItems()

		engine.post( { m:'ready', o:{} } );

	}

	static initItems () {

		body = new Body()
		solid = new Solid()
		joint = new Joint()
	

	}

	static set ( o = {} ){

		root.ArPos = o.ArPos || getArray('CANNON', o.full)
		body.setFull(o.full)

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		substep = o.substep || 1;
		// broadphase 1:BRUTE_FORCE 2:BVH
		broadphase = o.broadphase || 2;
		fixe = o.fixe !== undefined ? o.fixe : true;

		gravity = new Vec3().fromArray( o.gravity || [ 0, -9.80665, 0 ] );

		if( root.world === null ) engine.start();

		//root.world.solver.iterations = substep
		//else root.world.setGravity( gravity );

	}


	
	static start (){

		if( root.world  === null ){

			// define transfer array
			//const buffer = new ArrayBuffer(ArMax)
			//Ar = new Float32Array( buffer )
		    root.Ar = new Float32Array( root.ArPos.total )

		    // create new world
			engine.initWorld()

		} 

		isStop = false
		isReset = false
		lastTime = 0
		tmpStep = 0

		if( outsideStep ) return

		if( isTimeout ) timeout = setTimeout( engine.step, 0 );
		else interval = setInterval( engine.step, 1000 * timestep );
		

	}

	static initWorld () {

    	const world = new CANNON.World();

    	world.gravity = gravity;

    	// Max solver iterations: Use more for better force propagation, but keep in mind that it's not very computationally cheap!
    	//world.solver.iterations = 1 // def 10
    	//world.solver.tolerance = 0.001// def 1e-7

        // Uncomment to test with sleeeping bodies
        world.allowSleep = true;

        world.defaultContactMaterial.friction = 0.5;//0.3
        world.defaultContactMaterial.restitution = 0;

        // Tweak contact properties.
        // Contact stiffness - use to make softer/harder contacts
        //world.defaultContactMaterial.contactEquationStiffness = 10000000;

        // Stabilization time in number of timesteps
        world.defaultContactMaterial.contactEquationRelaxation = 1//3
        world.broadphase.useBoundingBoxes = true;

        //console.log(world.defaultContactMaterial.contactEquationStiffness)


        root.world = world;

    }

	static add ( o = {} ){

		let type = o.type || 'box';

		//if(type==='mesh') o.density = 0

		switch( type ){
			//case 'contact': contact.add( o ); break;
			//case 'ray': ray.add( o ); break;
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
		let type = b.types;

		switch( type ){
			//case 'contact': b = contact.clear( b ); break
			//case 'ray': b = ray.clear( b ); break; 
			case 'joint': b = joint.clear( b ); break;
			case 'solid': b = solid.clear( b ); break;
			case 'body': b = body.clear( b ); break;

		}

	}

	static change ( o = {} ){

		let b = this.byName( o.name );
		if( b === null ) return;
		let type = b.types;

		switch( type ){

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

		if( outsideStep ) return;//engine.step()

		

		if( isTimeout ){

			// If the worker was faster delay the next timestep
            let delay = timestep * 1000 - ( Time.now() - startTime );
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

		//engine.stepItems()

		//root.world.fixedStep()

		let n = substep;
		while( n-- ){ 
			if( fixe ) root.world.step( timestep / substep );
			else root.world.step( root.delta / substep )
		}

		//root.world.fixedStep()
		//root.world.step(1 / 60, 0.016)

		engine.stepItems()


		// get simulation stat
		if ( startTime - 1000 > t.tmp ){ t.tmp = startTime; root.reflow.stat.fps = t.n; t.n = 0; }; t.n++;
		root.reflow.stat.delta = root.delta

		if ( isBuffer ) engine.post( { m: 'step', reflow:root.reflow, Ar: root.Ar }, [ root.Ar.buffer ] );	
		else engine.post( { m:'step', reflow:root.reflow, Ar:root.Ar } );

	}

	static stepItems () {

		body.step( root.Ar, root.ArPos.body );
		joint.step( root.Ar, root.ArPos.joint );
		//ray.step( Ar, ArPos.ray );
		//contact.step( Ar, ArPos.contact );

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
		//ray.reset();
		//contact.reset();

		// clear world
		root.world = null;

		Utils.clear()

		engine.post( { m:'resetCallback', o:{} } );

	}

	static stop (){

		isStop = true;

		if( outsideStep ) return;
		if( timeout ) clearTimeout( timeout );
		if( interval ) clearInterval( interval );
		interval = null;
		timeout = null;

	}

	static pause( o ) {

		let pause = o.value;
		if( pause === isStop ) return
		if( pause ) this.stop()
		else this.start()

	}

}


//--------------
//  SOLID ONLY 
//--------------

class Solid extends Body {
	constructor () {
		super();
		this.type = 'solid';
		this.num = 0;
	}
	step () {}
}

//--------------
//  CHARATER
//--------------

class Character extends Body {

	constructor () {
		super();
		this.itype = 'character';
		this.num = Num['character'];
		this.full = true;
	}

}