
import { root, Utils, Vec3 } from './root.js';
import { getType, getArray } from '../core/Config.js';

import { Body } from './Body.js';
import { Joint } from './Joint.js';
import { Ray } from './Ray.js';
import { Contact } from './Contact.js';
import { Character } from './Character.js';

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

let items;

let isTimeout = false;
let outsideStep = false;

//let Ar, ArPos;
let isBuffer = false;
let returnMessage, isWorker;

//let body, solid, joint, ray, contact, character;

const Time = typeof performance === 'undefined' ? Date : performance;

const t = { tmp:0, n:0, dt:0, fps:0 }

let timestep = 1/60
let substep = 1
let fixe = true

let startTime = 0, lastTime = 0;
let isStop = true, isReset, tmpStep;

let interval = null
let timeout = null

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

		if( e.Ar ) root.Ar = e.Ar
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

		items = {
			body : new Body(),
			solid : new Solid(),
			joint : new Joint(),
			ray : new Ray(),
			contact : new Contact(),
			character : new Character(),
		}

		/*body = new Body()
		solid = new Solid()
		joint = new Joint()
		ray = new Ray()
		contact = new Contact()
		character = new Character()*/

	}

	static set ( o = {} ){

		root.ArPos = o.ArPos || getArray('RAPIER', o.full)

		items.body.setFull(o.full)
		//body.setFull(o.full)

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		substep = o.substep || 1;
		fixe = o.fixe !== undefined ? o.fixe : true;

		root.gravity = new Vec3().fromArray( o.gravity || [ 0, -9.81, 0 ] );

		if( root.world === null ) engine.start();
		else {
			root.world.timestep = timestep / substep
			//root.world.maxStabilizationIterations = substep
		}
		

	}

	static setGravity( o ) {
		
		root.gravity.fromArray( o.gravity );

	}
	
	static start (){

		if( root.world === null ){

			// define transfer array
		    root.Ar = new Float32Array( root.ArPos.total )

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

    	root.world = new RAPIER.World( root.gravity )
		root.world.maxStabilizationIterations = 1
		root.world.maxVelocityFrictionIterations = 8//8
		root.world.maxPositionIterations = 1
		root.world.maxVelocityIterations = 4 //4
		root.world.timestep = timestep / substep

		//console.log( root.world )

    }

	static add ( o = {} ){

		let type = getType( o )
		items[type].add( o )
		
	}

	static remove ( o = {} ){

		let b = this.byName( o.name )
		if( b === null ) return
		items[b.type].clear( b )

	}

	static change ( o = {} ){

		let b = this.byName( o.name );
		if( b === null ) return;
		items[b.type].set( o, b )

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

		root.invDelta = 1 / (fixe ? root.world.timestep : root.delta);

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

		if ( isBuffer ) engine.post( { m: 'step', reflow:root.reflow, Ar: root.Ar }, [ root.Ar.buffer ] );	
		else engine.post( { m:'step', reflow:root.reflow, Ar:root.Ar } );

	}

	static resetItems() { Object.values(items).forEach( value => value.reset() ); }
	static stepItems() { Object.values(items).forEach( value => value.step() ); }

	static byName ( name ){

		return Utils.byName( name );

	}


	static reset (){ isReset = true }

	static endReset (){

		engine.stop();

		engine.resetItems();

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