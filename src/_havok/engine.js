import { root, Utils, math } from './root.js';
import { getType, getArray } from '../core/Config.js';

import { Body } from './Body.js';
import { Joint } from './Joint.js';
import { Ray } from './Ray.js';
import { Contact } from './Contact.js';
import { Character } from './Character.js';
import { Terrain } from './Terrain.js';

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*
*    HAVOK ENGINE
*/

self.onmessage = function ( m ) { engine.message( m ) }


let items;

let isTimeout = false;
let outsideStep = false;

let Ar, ArPos;
let isBuffer = false;
let returnMessage, isWorker;

//let body, solid, joint, ray, contact, character;

const Time = typeof performance === 'undefined' ? Date : performance;

const t = { tmp:0, n:0, dt:0, fps:0 };

let timestep = 1/60;
let interval = 16.67;
let substep = 1;
let broadphase = 2;
let fixe = true;

let startTime = 0, lastTime = 0, elapsed = 0;
let isStop = true, isReset, tmpStep;

let intertime = null;
let timeout = null;

let gravity = null;

let tmpadd = []
let tmpremove = []
let tmpchange = []

let flow = {}
let current = ''


//--------------
//
//  HAVOK SIDE 
//
//--------------

export class engine {

	static test (){}

	static message ( m ) {

		let e = m.data;
		if( e.Ar ) Ar = e.Ar;
		if( e.flow ) flow = e.flow;
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
		//if( o.substep !== undefined ) substep = o.substep;

		if( o.message ){ 
			returnMessage = o.message;
			isWorker = false;
			isBuffer = false;
		}

		if( o.blob ) importScripts( o.blob )

		HavokPhysics().then( ( havok ) => {

			self.havok = havok;

			//Utils.extends()
			engine.initItems()

			

			engine.post( { m:'ready', o:{} } )

		})

		//engine.initItems()

		//engine.post( { m:'ready', o:{} } );

	}

	static set ( o = {} ){

		ArPos = o.ArPos || getArray('HAVOK', o.full)
		items.body.setFull(o.full)

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		interval = math.toFixed(timestep*1000, 2)

		substep = 1//o.substep || 1;
		// broadphase 1:BRUTE_FORCE 2:BVH
		//broadphase = o.broadphase || 2;
		fixe = o.fixe !== undefined ? o.fixe : true;

		gravity =  o.gravity || [ 0, -9.80665, 0 ];

		if( root.world === null ) engine.start();
		//else root.world.setGravity( gravity );

	}
	
	static start (){

		if( root.world  === null ){

			// define transfer array
			//const buffer = new ArrayBuffer(ArMax)
			//Ar = new Float32Array( buffer )
		    Ar = new Float32Array( ArPos.total )

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
		else intertime = setInterval( engine.step, interval );
		

	}

	static initWorld () {

    	root.world = havok.HP_World_Create()[1];
    	root.queryCollector = havok.HP_QueryCollector_Create(1)[1];


    	havok.HP_World_SetGravity( root.world, gravity );

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

	static readToRef ( buffer, offset ) {
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
    }

	static notifyCollisions () {

        let eventAddress = havok.HP_World_GetCollisionEvents(root.world)[1], data;
        const worldAddr = Number(root.world);

        while ( eventAddress ) {

        	data = engine.readToRef( havok.HEAPU8.buffer, eventAddress )

        	//if( data ) console.log(data)

        	/*if( data.b1 && data.b2 ){

        		if(data.b1.name === 'bob') console.log(data)
        		if(data.b2.name === 'bob') console.log(data)


        	}
            //CollisionEvent.readToRef( havok.HEAPU8.buffer, eventAddress, event );
            //event.contactOnB.position.subtractToRef(event.contactOnA.position, this._tmpVec3[0]);
            /*const distance = Vector3.Dot(this._tmpVec3[0], event.contactOnA.normal);
            const bodyInfoA = this._bodies.get(event.contactOnA.bodyId)!;
            const bodyInfoB = this._bodies.get(event.contactOnB.bodyId)!;
            const collisionInfo = {
                collider: bodyInfoA.body,
                colliderIndex: bodyInfoA.index,
                collidedAgainst: bodyInfoB.body,
                collidedAgainstIndex: bodyInfoB.index,
                point: event.contactOnA.position,
                distance: distance,
                impulse: event.impulseApplied,
                normal: event.contactOnA.normal,
            };*/
            /*this.onCollisionObservable.notifyObservers(collisionInfo);

            if (this._bodyCollisionObservable.size) {
                const observableA = this._bodyCollisionObservable.get(event.contactOnA.bodyId);
                const observableB = this._bodyCollisionObservable.get(event.contactOnB.bodyId);

                if (observableA) {
                    observableA.notifyObservers(collisionInfo);
                } else if (observableB) {
                    //<todo This seems like it would give unexpected results when both bodies have observers?
                    // Flip collision info:
                    collisionInfo.collider = bodyInfoB.body;
                    collisionInfo.colliderIndex = bodyInfoB.index;
                    collisionInfo.collidedAgainst = bodyInfoA.body;
                    collisionInfo.collidedAgainstIndex = bodyInfoA.index;
                    collisionInfo.normal = event.contactOnB.normal;
                    observableB.notifyObservers(collisionInfo);
                }
            }*/

            eventAddress = havok.HP_World_GetNextCollisionEvent(worldAddr, eventAddress);
        }
    }

	static poststep (){

		if( isStop ) return;

		tmpStep = 1;

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
		if( isStop || tmpStep >= 2 ) return;

		tmpStep = 2;

		startTime = stamp || Time.now();
		root.delta = ( startTime - lastTime ) * 0.001;
		lastTime = startTime;

		root.deltaTime = fixe ? timestep / substep : root.delta / substep

		let n = substep;
		while( n-- ) havok.HP_World_Step( root.world, root.deltaTime )

		engine.stepItems()

	    engine.notifyCollisions()

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

		engine.stop()

		engine.resetItems()

		// clear raycast
		havok.HP_QueryCollector_Release(root.queryCollector)
		// clear world
		havok.HP_World_Release(root.world);
		
		root.world = null
		current = ''

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
			terrain : new Terrain(),
		}

		root.bodyRef = items.body

	}

	static resetItems() {

		for (const key in items) items[key].reset()

	}

	static stepItems () {

		for ( const key in items ) items[key].step( Ar, ArPos[key] )

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




