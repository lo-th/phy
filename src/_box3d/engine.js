import { root, Utils } from './root.js';
import { Num, getType, getArray, initArray } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';

import { Ray } from './Ray.js';
import { Body } from './Body.js';
import { Joint } from './Joint.js';
/*import { Terrain } from './Terrain.js';
import { Contact, TriggerEvent, CollisionEvent } from './Contact.js';
//import { Character } from './Character.js';*/

import Box3dPhysics from '../libs_physics/X_Box3d.js';

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*
*    BOX3D ENGINE test
*/

// https://github.com/isaac-mason/box3d.js
// https://box2d.org/documentation3d/md_collision.html#autotoc_md51
// https://box2d.org/documentation3d/md_simulation.html

self.onmessage = function ( m ) { engine.message( m ) };

let isTimeout = false;

const items = {};
const Time = typeof performance === 'undefined' ? Date : performance;
const t = { tmp:0, n:0, dt:0, fps:0 };

let startTime = 0; 
let lastTime = 0;
let timestep = 1/60;
let interval = 16.67;
let substep = 4;
let fixe = true;

let isLoopRunning = false;
let accumulator = 0
let maxAccumulator = timestep * 10;

let outsideStep = false;
let isBuffer = false;
let isWorker = false;
let returnMessage = null;

let isStop = true;
let isReset = false;

let interut = null;
let timeout = null;

let gravity = null;

let maxLinearVelocity = 200;
let maxAngularVelocity = 200;

let flow = {};

let toRemove = []
let toAdd = []
let toChange = []

let current = '';


const contactPrecision = 5;
let collisionMap = new Map(); 
let toCollision = []

export class engine {

	static test (){}

	static activeContact(){
		root.needContact = true;
	}

	static message ( m ) {

		let e = m.data;
		if( e.Ar ) root.Ar = e.Ar;
		if( e.flow ) flow = e.flow;
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
		//if( o.substep !== undefined ) substep = o.substep;

		if( o.message ){ 
			returnMessage = o.message;
			isWorker = false;
			isBuffer = false;
		}

		Box3dPhysics().then( ( b3 ) => {

			self.b3 = b3;

			//console.log(b3)

			engine.initItems();

			engine.post({ m:'ready', o:{} });

		})

	}

	static set ( o = {} ){

		root.ArPos = o.ArPos || getArray('HAVOK', o.full)
		items.body.setFull(o.full)

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		interval = timestep*1000;

		maxAccumulator = timestep * 10;

		root.timestep = timestep;

		//substep = o.substep || 1;
		//root.substep = substep

		//console.log(outsideStep, isTimeout)

		if( o.maxVelocity ){
			maxLinearVelocity = o.maxVelocity[0];
			maxAngularVelocity = o.maxVelocity[1];
		}
		
		fixe = o.fixe !== undefined ? o.fixe : true;

		root.gravity =  o.gravity ? Utils.toVec(o.gravity) : { x: 0, y: -10, z: 0 };

		if( root.world === null ) engine.start();
		//else root.world.setGravity( gravity );

	}

	static setGravity( o ) {
		
		if( o.gravity ) root.gravity = Utils.toVec(o.gravity);
		if( root.world ) b3.b3World_SetGravity(root.world, root.gravity)

	}
	
	static start (){

		if( root.world  === null ){

			// define transfer array
		    root.Ar = initArray( root.ArPos.total );

		    // create new world
			engine.initWorld();

		} 

		isStop = false
		isReset = false
		//lastTime = 0
		root.tmpStep = 0
		//lastTime =;
		// fixe unpause bad timing
		lastTime = Time.now()-interval;

		//console.log('restart')

		if( outsideStep ) return;

		if( isLoopRunning ) return;
		lastTime = performance.now();
	    accumulator = 0;
	    isLoopRunning = true;
	    engine.update();


		/*if( isTimeout ){
		    if( timeout ) clearTimeout( timeout ); 
			timeout = setTimeout( engine.step, 0 );
		}
		else interut = setInterval( engine.step, interval );*/
		

	}

	static initWorld () {

		const worldDef = b3.b3DefaultWorldDef();

    	root.world = b3.b3CreateWorld(worldDef);



    	/** Returns the address of the world's body buffer, for use with
	     * HP_Body_GetWorldTransformOffset. This result can be invalidated if a
	     * body is added to the world.
	     */
	    //havok.HP_World_GetBodyBuffer(root.world)//: [Result, number];

    	// Allocates a query collector with sufficient capacity to store the requested number of hits
    	//root.queryCollector = havok.HP_QueryCollector_Create(1000)[1];


    	//root.world.gravity = root.gravity;

    	b3.b3World_SetGravity(root.world, root.gravity)


    	console.log(root.world)

    	// 200 m/s (which is about two thirds the speed of sound, so pretty fast :))
    	//havok.HP_World_SetSpeedLimit( root.world, maxLinearVelocity, maxAngularVelocity );

		//const limits = havok.HP_World_GetSpeedLimit(root.world);
		//console.log(limits)


		//console.log(havok)

		//havok.HP_World_ShapeCastWithCollector(arg0, arg1, arg2)
		//havok.HP_World_ShapeProximityWithCollector(arg0, arg1, arg2)

    	// Configure the ideal delta time which you intend to call HP_World_Step(). Defaults to 1/60.
    	// If the delta time passed to the world step differs from this amount, the solver parameters
    	// will be automatically adjusted, to attempt to maintain a similar effective solver stiffness.
    	// To disable this behaviour, set this value to zero.
    	//if(fixe) havok.HP_World_SetIdealStepTime( root.world, timestep/substep )
    	//else havok.HP_World_SetIdealStepTime( root.world, 0 )

    }

    /*static getSpeedLimit () {

    	const limits = havok.HP_World_GetSpeedLimit(root.world)
    	return limits

    }*/

	static controle ( name ) {

		if( name === current ) return;
		engine.enable( current, false );
		current = name;
		engine.enable( current, true );

	}

	static enable ( name, value ) {

		if( name === '' ) return;
		let b = engine.byName( name );
		if( b === null ) current = '';
		else b.enable = value;

	}

	static dispatch () {

		root.key = flow.key;
		if( flow.remove ) engine.removes( flow.remove );
		if( flow.add ) engine.adds( flow.add );
		if( flow.tmp ) engine.changes( flow.tmp );


		// TODO find best methode
		if( toCollision.length ){

			let r = [...toCollision];
			toCollision = [];
			let i = r.length, n = 0; 
			while( i-- ) engine.addCollision(r[n++]);

		}

		/*engine.removes( toRemove );
		engine.adds( toAdd );
		engine.changes( toChange );*/

		engine.controle( flow.current );
		flow = {};
		
	}

	/*static readToRef ( buffer, offset ) {

        const intBuf = new Int32Array( buffer, offset );
        const floatBuf = new Float32Array (buffer, offset );
        const offA = 2;
        const offB = 18;

        let b1 = Utils.byId( BigInt(intBuf[offA]) )
        let b2 = Utils.byId( BigInt(intBuf[offB]) )

        if(!b1 || !b2) return null
        
        return {
        	b1:b1.name,
        	b2:b2.name,
        	pos1:[ floatBuf[offA + 8], floatBuf[offA + 9], floatBuf[offA + 10] ],
        	normal1:[ floatBuf[offA + 11], floatBuf[offA + 12], floatBuf[offA + 13] ],
        	pos2:[ floatBuf[offB + 8], floatBuf[offB + 9], floatBuf[offB + 10] ],
        	normal2:[ floatBuf[offB + 11], floatBuf[offB + 12], floatBuf[offB + 13] ],
        	impulse:floatBuf[offB + 13 + 2],
        }

    }*/


    //-----------------------
	//
	//      COLLISION
	//
	//-----------------------

    static needCollision( name, name2 ) {

    	if ( !collisionMap.has( name ) ) return false;
		let b = collisionMap.get( name );


		if(b.ignore && b.ignore.indexOf(name2) !== -1) return false; 

		if(b.vs){
		    if( b.vs.indexOf(name2) !== -1 ) return true; 
		    else return false
		}

    	return true;

    }

    static addCollision( o ) {

    	let name = o.name;
		let b = engine.byName(name);
		if( b === null ){ 
			// need wait untile add
			toCollision.push(o);
			return
		}

		collisionMap.set( name, b );

	    if(o.vs) b.vs = o.vs;
		if(o.ignore) b.ignore = o.ignore;

	    root.needContact = true;
		root.needTrigger = true;

		items.body.addCollisionCallback( b, true );

	}

	static removeCollision( o ) {

		let name = o.name;
		let b = engine.byName(name);
		if( b === null ) return

		if( collisionMap.has( name ) ) collisionMap.delete( name );

		items.body.addCollisionCallback( b, false );

	}

	//////////////////

	/*static onContact () {

		if( !root.needContact ) return;

        let eventAddress = havok.HP_World_GetCollisionEvents(root.world)[1];
        const event = new CollisionEvent();
        const worldAddr = Number( root.world );

        const reflow = root.reflow.contact

        let body1, body2, b1, b2, c1, c2, v1, v2;
        let distance, impulse, point, normal, pointB, normalB, hit;

        while ( eventAddress ) {

        	CollisionEvent.readToRef( havok.HEAPU8.buffer, eventAddress, event );

        	body1 = event.contactOnA.body;
        	body2 = event.contactOnB.body;

        	if(body1 && body2) {

        		b1 = body1.name
        		b2 = body2.name

        		c1 = engine.needCollision(b1, b2);
        		c2 = engine.needCollision(b2, b1);

        		if(c1 || c2) {

	        		if(c1 && !reflow[b1]) reflow[b1] = [];
	        		if(c2 && !reflow[b2]) reflow[b2] = [];

	        		let type = event.type;
	        		let name = b1 + '_' + b2;

	        		switch( type ){
	        			case 'COLLISION_STARTED': case 'COLLISION_CONTINUED':

	        			// get linear velocity
			        	v1 = engine.getVelocity(body1, contactPrecision);
			        	v2 = engine.getVelocity(body2, contactPrecision);
	        			
	        			distance = MathTool.dotArray(MathTool.subArray(event.contactOnB.position, event.contactOnA.position, 3), event.contactOnA.normal, 3);
	        			distance = MathTool.toFixed( distance, contactPrecision )
	        			impulse = MathTool.toFixed( event.impulseApplied, contactPrecision )

	        			point = MathTool.fixedArray(event.contactOnA.position, contactPrecision )
	        			normal = MathTool.fixedArray(event.contactOnA.normal, contactPrecision )

	        			pointB = MathTool.fixedArray(event.contactOnB.position, contactPrecision )
	        			normalB = MathTool.fixedArray(event.contactOnB.normal, contactPrecision )

						//let ctype = type === 'COLLISION_STARTED' ? 'start':'continued'
						hit = type === 'COLLISION_STARTED' ? 1:2

						if(c1) reflow[b1].push({ hit:hit, from:b1, to:b2, point:point, normal:normal, impulse:impulse, distance:distance, v1:v1, v2:v2 })
						if(c2) reflow[b2].push({ hit:hit, from:b2, to:b1, point:pointB, normal:normal, impulse:impulse, distance:distance, v1:v1, v2:v2 })

						// old methode
	        			Utils.addContact( name );

	        			break;
	        			case 'COLLISION_FINISHED': 
	        			if(c1) reflow[b1].push({ hit:0, from:b1, to:b2 })
	        			if(c2) reflow[b2].push({ hit:0, from:b2, to:b1 })

	        			// old methode
	        			Utils.removeContact( name ); 
	        			break;
	        		}

        		}


        	}

            eventAddress = havok.HP_World_GetNextCollisionEvent( worldAddr, eventAddress );
               
        }

    }

    static onTrigger() {

    	if( !root.needTrigger ) return;

    	let body1, body2, b1, b2, c1;
    	const reflow = root.reflow.contact

        let eventAddress = havok.HP_World_GetTriggerEvents(root.world)[1];
        const event = new TriggerEvent();
        while ( eventAddress ) {

            TriggerEvent.readToRef(havok.HEAPU8.buffer, eventAddress, event);

            body1 = event.bodyA;
        	body2 = event.bodyB;

        	if(body1.trigger){ b1 = body1.name; b2 = body2.name}
        	if(body2.trigger){ b1 = body2.name; b2 = body1.name}

        	c1 = engine.needCollision(b1, b2);

        	if(c1 && !reflow[b1]) reflow[b1] = [];

        	if(body1 && body2) {

        		let type = event.type;
        		let name = b1 + '_' + b2;
        		switch( type ){
        			case 'TRIGGER_ENTERED': 
        			if(c1) reflow[b1].push({ hit:1, from:b1, to:b2, trigger:true })
        			Utils.addContact( name ); 
        			break;
        			case 
        			'TRIGGER_EXITED': 
        			if(c1) reflow[b1].push({ hit:0, from:b1, to:b2, trigger:true })
        			Utils.removeContact( name ); 
        			break;
        		}
        	}

            eventAddress = havok.HP_World_GetNextTriggerEvent(root.world, eventAddress);

        }

    }*/

    static getVelocity ( b, precision = 6 ) {

		if( b.type==='body'){
			let lin = MathTool.fixedArray( havok.HP_Body_GetLinearVelocity(b)[1], precision );
			//let ang = b.getAngularVelocity().toArray();
			return lin; //[ ...lin, ...ang ]
		} else return [ 0,0,0 ];

	}

	static poststep (){

		if( isStop ) return;

		root.tmpStep = 1;

		//engine.dispatch()
		//engine.postItems();

		/*if( outsideStep ) return;//engine.step()

		if( isTimeout ){

			if( timeout ) clearTimeout( timeout );

			// If the worker was faster delay the next timestep
            let delay = interval - ( Time.now() - lastTime );
            if( delay < 0 ) delay = 0;
            timeout = setTimeout( engine.step, delay );

		}*/

	}

	static update() {

		if (outsideStep) return;
	    if (!isLoopRunning || isStop) return;

	    const now = performance.now();
	    const frameTime = (now - lastTime) / 1000;
	    lastTime = now;

	    //

	    accumulator += frameTime;

	    // Prévenir le "spiral of death" en cas de lag prolongé
	    if (accumulator > maxAccumulator) accumulator = maxAccumulator;

	    while (accumulator >= timestep) {
	    	engine.getFps(now)
	        engine.step(timestep);
	        accumulator -= timestep;
	    }

	    // Scheduling universel (marche en Worker & Main Thread)
	    setTimeout(engine.update, 0);
	}

	static getFps ( now ){
		if ( now - 1000 > t.tmp ){ t.tmp = now; root.reflow.stat.fps = t.n; t.n = 0; }; t.n++;
	}

	static step ( stamp ){
		
		if( isReset ) engine.endReset();
		if( isStop ) return;
		if( root.tmpStep >= 2 ) return;

		engine.dispatch()

		//console.log('stamp', stamp)



		root.tmpStep = 2;

		if (outsideStep){
			const now = stamp || performance.now();
			root.ms = now - lastTime;
			root.delta = root.ms / 1000;
			lastTime = now;
			engine.getFps(now)
		}else{
			root.ms = stamp * 1000;
	        root.delta = stamp; // Maintenant toujours fixe
		}

		


		//root.deltaTime = fixe ? timestep / substep : root.delta / substep
		root.deltaTime = fixe ? timestep : root.delta

		engine.postItems();

		
		b3.b3World_Step(root.world, root.deltaTime, substep);


		/*let n = substep;
		while( n-- ) {
			// Simulate the world and advance time by `timestep` seconds.
			havok.HP_World_Step( root.world, root.deltaTime );
			engine.onContact();
	        engine.onTrigger();
			root.tmpStep++;
		}*/

		//engine.onContact();
	    //engine.onTrigger();
	    engine.stepItems();

	    //engine.dispatch()
	    

		// get simulation stat
		
		root.reflow.stat.ms = root.ms;
		root.reflow.stat.delta = root.delta;

		//console.log(root.reflow.contact)

		if ( isBuffer ) engine.post( { m: 'step', reflow:root.reflow, Ar: root.Ar }, [ root.Ar.buffer ] );	
		else engine.post( { m:'step', reflow:root.reflow, Ar:root.Ar } );

		root.reflow.point = {};
		root.reflow.contact = {};
		root.reflow.velocity = {};

	}

	static byName ( name ){

		return Utils.byName( name );

	}


	static reset (){ isReset = true }

	static endReset (){

		engine.stop()
		engine.resetItems()
		engine.clearReFlow();

		// clear raycast
		//havok.HP_QueryCollector_Release(root.queryCollector)
		// clear world
		//havok.HP_World_Release(root.world);

		b3.b3DestroyWorld(root.world);
		
		root.world = null;

		collisionMap = new Map()
		root.needContact = false;
		root.needTrigger = false;
		current = '';

		Utils.clear();

		engine.post( { m:'resetCallback', o:{} } );

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

	static stop (){

		isStop = true;
		isLoopRunning = false;
		if( outsideStep ) return;
		if( timeout ) clearTimeout( timeout );
		if( interut ) clearInterval( interut );
		interut = null;
		timeout = null;

	}

	static pause( o ) {

		let pause = o.value;
		if( pause === isStop ) return
		if( pause ) engine.stop()
		else engine.start()

	}

	//-----------------------
	//
	//  ITEMS
	//
	//-----------------------

	static initItems () {

		items['ray'] = new Ray();
		items['body'] = new Body();
		items['solid'] = new Solid();
		items['joint'] = new Joint();
		//
		//items['contact'] = new Contact();
		//items['terrain'] = new Terrain();
		items['character'] = new Character();

		root.bodyRef = items.body;

	}

	static resetItems() { Object.values(items).forEach( value => value.reset() ); }
	static stepItems() { Object.values(items).forEach( value => value.step() ); }

	static postItems() { items.body.postStep() }

	/*
	static adds( r ){ while( r.length ) engine.add(r.shift()); }
	static removes( r ){ while( r.length ) engine.remove(r.shift()); }
	static changes( r ){ while( r.length ) engine.change(r.shift()); }
	*/

	static adds( r ){ let i = r.length, n = 0; while( i-- ) engine.add(r[n++]); }
	static removes( r ){ let i = r.length, n = 0; while( i-- ) engine.remove(r[n++]); }
	static changes( r ){ let i = r.length, n = 0; while( i-- ) engine.change(r[n++]); }

	static add ( o = {} ){

		let type = getType( o );
		items[type].add( o );
		
	}

	static remove ( o = {} ){

		let b = engine.byName( o.name );
		// TODO verifie if is alway work !!
		if( b ) items[o.type ? o.type : b.type].clear( b );
		//if( b ) items[b.type].clear( b );

	}

	static change ( o = {} ){

		let b = engine.byName( o.name );
		if( b ) items[b.type].set( o, b );

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


// character bof
// https://github.com/armomu/ergoudan?tab=readme-ov-file
// drag and drop 
// https://github.com/Namide/havok-test?tab=readme-ov-file