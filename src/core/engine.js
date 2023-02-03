
self.onmessage = function ( m ) { Engine.message( m ) }

let isTimeout = false;
let outsideStep = false;

let Ar, ArPos, ArMax;

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

let tmpadd = []
let tmpremove = []
let tmpchange = []


export class Engine {

	constructor ( o = {} ) {

		this.Utils = null

	}

	test () {}

	message ( m ) {

		let e = m.data;
		if( e.Ar ) Ar = e.Ar;
		if( e.flow ) root.flow = e.flow;
		if( e.m ) this[ e.m ]( e.o )

	}

	post ( e, buffer ){

		if( this.isWorker ) self.postMessage( e, buffer );
		else this.returnMessage( { data : e } );

	}

	init ( o = {} ){

		this.isWorker = true;
		this.isBuffer = o.isBuffer || false;

		ArPos = o.ArPos;
		ArMax = o.ArMax;

		//Ar = new Float32Array( ArMax )


		if( o.fps !== undefined ) timestep = 1 / o.fps;
		if( o.substep !== undefined ) substep = o.substep;

		if( o.returnMessage ){ 
			this.returnMessage = o.returnMessage;
			this.isWorker = false;
			this.isBuffer = false;
		}

		if( o.blob ) importScripts( o.blob )

		

		this.initItems()
		this.post( { m:'ready', o:{} } );

	}

	initItems () {
	}

	initWorld () {
	}

	set ( o = {} ){

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		substep = o.substep || 1;

	}
	
	start (){

		initWorld()

		isStop = false
		isReset = false
		lastTime = 0
		tmpStep = 0

		if( outsideStep ) return

		if( isTimeout ) timeout = setTimeout( engine.step, 0 );
		else interval = setInterval( engine.step, 1000 * timestep );
		

	}

	add ( o = {} ){
		
	}

	remove ( o = {} ){

	}

	change ( o = {} ){

	}

	dispatch (){
		
	} 

	poststep (){

		if( isStop ) return;

		tmpStep = 1;

		this.dispatch()

		/*let i, n, flow = root.flow

		// for update object
		i = flow.tmp.length
		while( i-- ) this.change( flow.tmp[i] )


		root.flow = {
			key:[],
			add:[],
			remove:[],
			tmp:[]
		}*/
		//root.flow.key = [];

		if( outsideStep ) return;//engine.step()

		

		if( isTimeout ){

			// If the worker was faster delay the next timestep
            let delay = timestep * 1000 - ( Time.now() - startTime );
            if( delay < 0 ) delay = 0;
            timeout = setTimeout( engine.step, delay );

		}

	}

	step ( stamp ){
		
		if( isReset ){ engine.endReset(); return }
		if( isStop || tmpStep === 2 ) return;

		tmpStep = 2;

		startTime = stamp || Time.now();
		root.delta = ( startTime - lastTime ) * 0.001;
		lastTime = startTime;


		// get simulation stat
		if ( startTime - 1000 > t.tmp ){ t.tmp = startTime; root.reflow.stat.fps = t.n; t.n = 0; }; t.n++;
		root.reflow.stat.delta = root.delta

		if ( isBuffer ) engine.post( { m: 'step', reflow:root.reflow, Ar: Ar }, [ Ar.buffer ] );	
		else engine.post( { m:'step', reflow:root.reflow, Ar:Ar } );

	}

	stepItems () {

	}



	reset (){ isReset = true }

	endReset (){

	}

	stop (){

		isStop = true;

		if( timeout ) clearTimeout( timeout );
		if( interval ) clearInterval( interval );
		interval = null;
		timeout = null;

	}

	pause (){

		if( !isStop ) this.stop();
		else this.start();

	}


}