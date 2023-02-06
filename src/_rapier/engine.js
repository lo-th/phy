
import { root, Utils, Vec3 } from './root.js';
import { getType, getArray } from '../core/Config.js';

import { Body } from './Body.js';
import { Joint } from './Joint.js';
import { Ray } from './Ray.js';
import { Contact } from './Contact.js';

//import('../../build/rapier3d').then(RAPIER => { })
//import RAPIER from '../../build/rapier3d';
import RAPIER from '../libs/rapier3d-compat.js';
//import RAPIER from 'https://cdn.skypack.dev/@dimforge/rapier3d-compat';

//----------------
//
//  RAAPIER SIDE
// 
//----------------

self.onmessage = function ( m ) { engine.message( m ) }

let isTimeout = false;
let outsideStep = false;

let Ar, ArPos;
let isBuffer = false;
let returnMessage, isWorker;

let body, solid, joint, ray, contact;

const Time = typeof performance === 'undefined' ? Date : performance;

const t = { tmp:0, n:0, dt:0, fps:0 }

let timestep = 1/60
let substep = 1
let fixe = true

let startTime = 0, lastTime = 0;
let isStop = true, isReset, tmpStep;

let interval = null
let timeout = null
let gravity = null

let tmpadd = []
let tmpremove = []
let tmpchange = []


//--------------
//
//  OIMO SIDE 
//
//--------------

export class engine {

	static test (){}

	static message ( m ) {

		let e = m.data;

		if( e.Ar ) Ar = e.Ar
		if( e.flow ) root.flow = e.flow
		if( e.m ) engine[ e.m ]( e.o )

	}

	static post ( e, buffer ){

		if( isWorker ) self.postMessage( e, buffer )
		else returnMessage( { data : e } )

	}

	static init ( o = {} ){

		isWorker = true
		isBuffer = o.isBuffer || false

		if( o.fps !== undefined ) timestep = 1 / o.fps
		if( o.substep !== undefined ) substep = o.substep

		if( o.message ){ 
			returnMessage = o.message;
			isWorker = false
			isBuffer = false
		}

		//if( o.blob ) importScripts( o.blob )

		RAPIER.init().then( () => {

			self.RAPIER = RAPIER

			//Utils.extends()

			engine.initItems()
			engine.post( { m:'ready', o:{} } )


		})

		

		//engine.initItems()

		//engine.post( { m:'ready', o:{} } );

	}

	static initItems () {

		body = new Body()
		solid = new Solid()
		joint = new Joint()
		ray = new Ray()
		contact = new Contact()

	}

	static set ( o = {} ){

		ArPos = o.ArPos || getArray('RAPIER', o.full)
		body.setFull(o.full)

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		substep = o.substep || 1;
		fixe = o.fixe !== undefined ? o.fixe : true;

		gravity = new Vec3().fromArray( o.gravity || [ 0, -9.80665, 0 ] );

		if( root.world === null ) engine.start();
		else {
			root.world.timestep = timestep / substep
			//root.world.maxStabilizationIterations = substep
		}
		
		//else root.world.setGravity( gravity );

	}
	
	static start (){

		if( root.world === null ){

			// define transfer array
		    Ar = new Float32Array( ArPos.total )

		    // create new world
			engine.initWorld()

		} 

		isStop = false
		isReset = false
		lastTime = 0
		tmpStep = 0

		if( outsideStep ) return

		if( isTimeout ) timeout = setTimeout( engine.step, 0 )
		else interval = setInterval( engine.step, 1000 * timestep )
		
	}

	static initWorld() {

    	root.world = new RAPIER.World( gravity )
		root.world.maxStabilizationIterations = 1
		root.world.maxVelocityFrictionIterations = 8//8
		root.world.maxPositionIterations = 1
		root.world.maxVelocityIterations = 4 //4
		root.world.timestep = timestep / substep

    }

	static add ( o = {} ){

		let type = o.type || 'box'

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

		let b = this.byName( o.name )
		if( b === null ) return
		let type = b.type

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

		if( outsideStep ) return;

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

		let n = substep;
		while( n-- ){
			if( !fixe ) root.world.timestep = root.delta/substep
			root.world.step()
		}

		//root.world.step()

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
		root.world.free()
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