import { root, Utils, World, Vec3, Quat } from './root.js';
import { Num, getType, getArray } from '../core/Config.js';

import { Ray } from './Ray.js';
import { Body } from './Body.js';
import { Joint } from './Joint.js';
import { Contact } from './Contact.js';
//import { Character } from './Character.js';

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*
*    OIMO ENGINE
*/

self.onmessage = function ( m ) { engine.message( m ) };

const items = {};
const Time = typeof performance === 'undefined' ? Date : performance;
const t = { tmp:0, n:0, dt:0, fps:0 };

let startTime = 0; 
let lastTime = 0;
let timestep = 1/60;
let interval = 16.67;
let substep = 10;
let broadphase = 2;
let fixe = true;

let isTimeout = false;
let outsideStep = false;
let isBuffer = false;
let isWorker = false;
let returnMessage = null;

let isStop = true;
let isReset = false;

let interut = null;
let timeout = null;

let tmpadd = [];
let tmpremove = [];
let tmpchange = [];

let flow = {};
let current = '';

let collisionMap = new Map(); 

export class engine {

	static activeContact(){
		root.needContact = true;
	}

	static test (){}

	static message ( m ) {

		let e = m.data;
		if( e.Ar ) root.Ar = e.Ar;
		if( e.flow ) flow = e.flow;
		//if(!engine[ e.m ])console.log(e.m)
		if( e.m ) engine[ e.m ]( e.o );

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

	static set ( o = {} ){

		root.ArPos = o.ArPos || getArray('OIMO', o.full)
		items.body.setFull(o.full)

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		interval = timestep*1000;

		substep = o.substep || 1;
		// broadphase 1:BRUTE_FORCE 2:BVH
		broadphase = o.broadphase || 2;
		fixe = o.fixe !== undefined ? o.fixe : true;

		root.gravity = new Vec3().fromArray( o.gravity || [ 0, -9.81, 0 ] );

		if( root.world === null ) engine.start();
		//else root.world.setGravity( gravity );

	}

	static setGravity( o ) {
		
		root.gravity.fromArray( o.gravity );
		if( root.world ) root.world._gravity.fromArray( o.gravity )

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
		root.tmpStep = 0

		if( outsideStep ) return

		if( isTimeout ){
		    if( timeout ) clearTimeout( timeout ); 
			timeout = setTimeout( engine.step, 0 );
		}
		else interut = setInterval( engine.step, interval );
		

	}

	static initWorld () {

    	root.world = new World( broadphase, root.gravity )
		root.world.setNumVelocityIterations( 10 )
		root.world.setNumPositionIterations( 5 )

		//console.log( root.world )

    }

	static controle ( name ) {

		if( name === current ) return;
		this.enable( current, false );
		current = name;
		this.enable( current, true );

	}

	static enable ( name, value ) {

		if( name === '' ) return;
		let b = this.byName( name );
		if( b === null ) current = '';
		else b.enable = value;

	}

	static dispatch () {

		root.key = flow.key;
		if( flow.remove ) this.removes( flow.remove );
		if( flow.add ) this.adds( flow.add );
		if( flow.tmp ) this.changes( flow.tmp );
		this.controle( flow.current );
		flow = {};
		
	}

	static poststep (){

		if( isStop ) return;

		root.tmpStep = 1;

		this.dispatch()

		if( outsideStep ) return;//engine.step()

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
		if( isStop || root.tmpStep >= 2 ) return;

		root.tmpStep = 2;

		startTime = stamp || Time.now();
		root.ms = startTime - lastTime;
		root.delta = root.ms / 1000;
		lastTime = startTime;

		root.deltaTime = fixe ? timestep / substep : root.delta / substep

		root.invDelta = 1 / (fixe ? timestep : root.delta);

		//engine.stepItems()

		let n = substep;
		while( n-- ) root.world.step( root.deltaTime );

		engine.stepItems()
		engine.onContact()


		// get simulation stat
		if ( startTime - 1000 > t.tmp ){ t.tmp = startTime; root.reflow.stat.fps = t.n; t.n = 0; }; t.n++;
		root.reflow.stat.ms = root.ms;
		root.reflow.stat.delta = root.delta

		if ( isBuffer ) engine.post( { m: 'step', reflow:root.reflow, Ar: root.Ar }, [ root.Ar.buffer ] );	
		else engine.post( { m:'step', reflow:root.reflow, Ar:root.Ar } );

		root.reflow.contact = {};
		root.reflow.velocity = {}

	}

	static clearReFlow() {

		root.reflow = { 
			ray:[],
			point:{},
			contact:{},
			velocity:{},
			stat:{ fps:0, delta:0, ms:0 },
		};

	}

	static byName ( name ){

		return Utils.byName( name );

	}


	static reset (){ isReset = true }

	static endReset (){

		engine.stop()

		engine.resetItems()

		collisionMap = new Map();
		engine.clearReFlow();

		// clear world
		root.world = null
		current = ''

		Utils.clear()

		engine.post( { m:'resetCallback', o:{} } );

	}

	static stop (){

		isStop = true;

		if( outsideStep ) return;
		if( timeout ) clearTimeout( timeout );
		if( interut ) clearInterval( interut );
		interut = null;
		timeout = null;

	}

	static pause( o ) {

		let pause = o.value;
		if( pause === isStop ) return;
		if( pause ) this.stop();
		else this.start();

	}


	//-----------------------
	//
	//  ITEMS
	//
	//-----------------------

	static initItems () {

		items['ray'] = new Ray();
		items['body'] = new Body();
		items['joint'] = new Joint();
		items['solid'] = new Solid();
		items['contact'] = new Contact();
		items['character'] = new Character();

	}

	static resetItems() { Object.values(items).forEach( value => value.reset() ); }
	static stepItems() { Object.values(items).forEach( value => value.step() ); }

	static adds( r ){ let i = r.length, n = 0; while( i-- ) this.add(r[n++]); }
	static removes( r ){ let i = r.length, n = 0; while( i-- ) this.remove(r[n++]); }
	static changes( r ){ let i = r.length, n = 0; while( i-- ) this.change(r[n++]); }

	static add ( o = {} ){

		let type = getType( o );
		items[type].add( o );

		//console.log(type, o.name)

	}

	static remove ( o = {} ){

		let b = this.byName( o.name );
		// TODO verifie if is alway work !!
		if( b ) items[o.type ? o.type : b.type].clear( b );
		//if( b ) items[b.type].clear( b );

	}

	static change ( o = {} ){

		let b = this.byName( o.name );
		if( b ) items[b.type].set( o, b );

	}

	//-----------------------
	//
	//  COLLISION
	//
	//-----------------------

	static needCollision( name, name2 ) {

		if ( !collisionMap.has( name ) ) return false;
		let b = collisionMap.get( name );

		if(b.vs && b.vs.indexOf(name2) !== -1) return true; 
		if(b.ignore && b.ignore.indexOf(name2) !== -1) return false; 

    	return true;

    }

	static addCollision( o ) {

		let name = o.name;
		let b = engine.byName(name);
		if( b === null ) return

		collisionMap.set( name, b );

	    if(o.vs) b.vs = o.vs;
		if(o.ignore) b.ignore = o.ignore;

		b.getVelocity = true;

	    root.needContact = true;
		//root.needTrigger = true;

	}

	static removeCollision( o ) {

		let name = o.name;
		let b = engine.byName(name);
		if( b === null ) return

		if( collisionMap.has( name ) ) collisionMap.delete( name );
		b.getVelocity = false;

	}

	static onContact() {

		if( !root.needContact ) return;

		collisionMap.forEach( engine.testContact );

	}

	static testContact(b, key) {

		const flow = root.reflow.contact;

		let c1, c2

		let b1 = key
		let list = b.getContactLinkList()
		if(!list) return
		let ct = list.getContact()
	    while( ct !== null ){

	    	let b2 = ct._b2.name

	    	c1 = engine.needCollision(b1, b2)
		    c2 = engine.needCollision(b2, b1)

		    if(!c1 && !c2) continue

		    if(c1 && !flow[b1]) flow[b1] = [];
        	if(c2 && !flow[b2]) flow[b2] = [];


	    	if(ct._touching){

	    		

	    		let data = ct._manifold

	    		let impulse = 0
	    		let distance = 0

		    	let result = ct._detectorResult

		    	let hit = 2//result.incremental ? 2:1
		    	let normal = result.normal.toArray()
		    	let point = result.points[0].position1.toArray()


		    	if(c1) flow[b1].push({ hit:hit, from:b1, to:b2, point:point, normal:normal, impulse:impulse, distance:distance })
				if(c2) flow[b2].push({ hit:hit, from:b2, to:b1, point:point, normal:normal, impulse:impulse, distance:distance })

		    	//console.log(ct)
	    	}else{

	    		if(c1) flow[b1].push({ hit:0, from:b1, to:b2 })
				if(c2) flow[b2].push({ hit:0, from:b2, to:b1 })

	    	}

	    	

			ct = ct.getNext()

		}


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
		//this.type = 'character';
		this.itype = 'character';
		this.num = Num['character'];
		this.full = true;
	}

}