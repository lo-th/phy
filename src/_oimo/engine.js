
import { root, Utils, World, Vec3, Quat } from './root.js';

import { Body } from './Body.js';
import { Solid } from './Solid.js';
import { Joint } from './Joint.js';
import { Ray } from './Ray.js';
import { Contact } from './Contact.js';


//--------------
//  OIMO SIDE 
//--------------


self.onmessage = function ( m ) { engine.message( m ) }

let isTimeout = false;

let Ar, ArPos, ArMax;
let isBuffer = false;
let returnMessage, isWorker;

let body, solid, joint, ray, contact;

const Time = typeof performance === 'undefined' ? Date : performance;

const t = { tmp:0, n:0, dt:0, fps:0 };

let timestep = 1/60;
let substep = 10;
let broadphase = 2;
let fixe = true;

let startTime = 0;
let lastTime = 0;
let isStop, isReset, tmpStep;

let interval = null;
let timeout = null;

let gravity = null;


//--------------
//
//  OIMO SIDE 
//
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

		//Ar = new Float32Array( ArMax )


		if( o.fps !== undefined ) timestep = 1 / o.fps;
		if( o.substep !== undefined ) substep = o.substep;

		if( o.returnMessage ){ 
			returnMessage = o.returnMessage;
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
		ray = new Ray()
		contact = new Contact()

	}

	static set ( o = {} ){

		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		substep = o.substep || 1;
		// broadphase 1:BRUTE_FORCE 2:BVH
		broadphase = o.broadphase || 2;
		fixe = o.fixe !== undefined ? o.fixe : true;

		gravity = new Vec3().fromArray( o.gravity || [ 0, -9.80665, 0 ] );

		if( root.world === null ) engine.start();
		//else root.world.setGravity( gravity );

	}
	
	static start (){

		if( root.world  === null ){

			// define transfer array
		    Ar = new Float32Array( ArMax );

		    // create new world
			root.world = new World( broadphase, gravity );

			root.world.setNumVelocityIterations( 10 )
			root.world.setNumPositionIterations( 5 )

		} 

		isStop = false
		isReset = false
		lastTime = 0
		tmpStep = 0

		if( isTimeout ) timeout = setTimeout( engine.step, 0 );
		else interval = setInterval( engine.step, 1000 * timestep );
		
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

			case 'joint': b = joint.set( o, b ); break;
			case 'solid': b = solid.set( o, b ); break;
			case 'body': b = body.set( o, b ); break;
		}

	}

	//static changes ( r = [] ){ for( let o in r ) this.change( r[o] ) }

	static poststep (){

		if( isStop ) return;

		// for update object
		let i = root.flow.tmp.length;
		while( i-- ) this.change( root.flow.tmp[i] );

		root.flow.tmp = [];
		root.flow.key = [];

		tmpStep = 1;

		if( isTimeout ){

			// If the worker was faster delay the next timestep
            let delay = timestep * 1000 - ( Time.now() - startTime );
            if( delay < 0 ) delay = 0;

            timeout = setTimeout( engine.step, delay );

		}

	}

	static step (){

		if( isReset ){ engine.endReset(); return }
		if( isStop || tmpStep === 2 ) return;

		tmpStep = 2;

		startTime = Time.now();
		root.delta = ( startTime - lastTime ) * 0.001;
		lastTime = startTime;

		let n = substep;
		while( n-- ){ 
			if( fixe ) root.world.step( timestep / substep );
			else root.world.step( root.delta/substep )
		}

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