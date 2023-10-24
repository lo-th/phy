import { root, Utils } from './root.js';
import { Num, Max, getType, getArray } from '../core/Config.js';

import { Body } from './Body.js';
import { Joint } from './Joint.js';
import { Ray } from './Ray.js';
import { Contact } from './Contact.js';
//import { Character } from './Character.js';

import initJolt from '../libs_physics/X_Jolt.js';

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*
*    JOLT ENGINE
*/

self.onmessage = function ( m ) { engine.message( m ) };

const items = {};
const Time = typeof performance === 'undefined' ? Date : performance;
const t = { tmp:0, n:0, dt:0, fps:0 };

let startTime = 0; 
let lastTime = 0;
let timestep = 1/60;
let interval = 16.67;
let substep = 1;
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

export class engine {

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

		initJolt().then( ( Jolt ) => {

			self.Jolt = Jolt;

			Utils.extends();
			engine.initItems();

			engine.post( { m:'ready', o:{} } );

			//console.log(Jolt)

		})

	}

	static set ( o = {} ){

		root.ArPos = o.ArPos || getArray('JOLT', o.full);
		items.body.setFull(o.full);

		outsideStep = o.outsideStep || false;
		isTimeout = o.isTimeout || false;

		timestep = 1 / (o.fps || 60 );
		interval = timestep*1000;

		substep = 1//o.substep || 1;
		// broadphase 1:BRUTE_FORCE 2:BVH
		broadphase = o.broadphase || 2;
		fixe = o.fixe !== undefined ? o.fixe : true;

		root.gravity = new Jolt.Vec3(0, -9.8, 0).fromArray( o.gravity || [ 0, -9.80665, 0 ] );

		if( root.world === null ) engine.start();
		//else root.world.setGravity( gravity );

	}

	static setGravity ( o ) {

		root.gravity.fromArray( o.gravity );
		if( root.physicsSystem ) root.physicsSystem.SetGravity( root.gravity );

	}
	
	static start () {

		if( root.world  === null ){

			// define transfer array
			//const buffer = new ArrayBuffer(ArMax)
			//Ar = new Float32Array( buffer )
		    root.Ar = new Float32Array( root.ArPos.total );

		    // create new world
			engine.initWorld();

		} 

		isStop = false;
		isReset = false;
		lastTime = 0;
		root.tmpStep = 0;

		if( outsideStep ) return

		if( isTimeout ){
		    if( timeout ) clearTimeout( timeout ); 
			timeout = setTimeout( engine.step, 0 );
		}
		else interut = setInterval( engine.step, interval );
		

	}

	static initWorld () {

		// Initialize Jolt
		root.settings = new Jolt.JoltSettings();
		root.settings.mMaxBodies = Max.body;//10240
		root.settings.mMaxBodyPairs = Math.round( Max.body*6.4 ); //65536
		root.settings.mMaxContactConstraints = Max.body;//10240


		root.world = new Jolt.JoltInterface( root.settings );
		root.physicsSystem = root.world.GetPhysicsSystem();
		root.bodyInterface = root.physicsSystem.GetBodyInterface();
		//root.broadPhase = root.physicsSystem.GetBroadPhaseQuery();
		//root.narrowPhase = root.physicsSystem.GetNarrowPhaseQuery()

		root.physicsSystem.SetGravity( root.gravity )
		// missing
		//root.physicsSystem.SetCombineRestitution() // Default method is max(restitution1, restitution1)
		// should be min

		root.physicsSystem.OptimizeBroadPhase() // ?


		//console.log(root.settings)
		//console.log(root.world)
		//console.log(root.bodyInterface)
		//console.log(root.physicsSystem)
		//console.log(root.physicsSystem.GetBroadPhaseQuery())

    }

    static clearWorld () {

		Jolt.destroy(root.bodyInterface);
		Jolt.destroy(root.settings);
		Jolt.destroy(root.world);
		Jolt.destroy(root.gravity);

		root.world = null;
		current = '';

    }

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
		engine.controle( flow.current );
		flow = {};
		
	}

	static poststep () {

		if( isStop ) return;

		root.tmpStep = 1;

		engine.dispatch()

		if( outsideStep ) return;//engine.step()

		if( isTimeout ){

			if( timeout ) clearTimeout( timeout );

			// If the worker was faster delay the next timestep
            let delay = interval - ( Time.now() - lastTime );
            if( delay < 0 ) delay = 0;
            timeout = setTimeout( engine.step, delay );

		}

	}

	static step ( stamp ) {
		
		if( isReset ) engine.endReset();
		if( isStop || root.tmpStep >= 2 ) return;

		root.tmpStep = 2;

		startTime = stamp || Time.now();
		root.delta = ( startTime - lastTime ) * 0.001;
		lastTime = startTime;

		root.deltaTime = fixe ? timestep / substep : root.delta / substep

		root.invDelta = 1 / (fixe ? timestep : root.delta);

		root.world.Step( root.deltaTime, substep );

		engine.stepItems();

		// get simulation stat
		if ( startTime - 1000 > t.tmp ){ t.tmp = startTime; root.reflow.stat.fps = t.n; t.n = 0; }; t.n++;
		root.reflow.stat.delta = root.delta

		if ( isBuffer ) engine.post( { m: 'step', reflow:root.reflow, Ar: root.Ar }, [ root.Ar.buffer ] );	
		else engine.post( { m:'step', reflow:root.reflow, Ar:root.Ar } );

	}

	static byName ( name ) {

		return Utils.byName( name );

	}

	static byId ( n ) {

		let i = items.body.list.length, b, id;

		while( i-- ){
			b = items.body.list[i];
			id = b.GetID();
			if( id === n ) return b;
		}

		i = items.solid.list.length
		while( i-- ){
			b = items.solid.list[i];
			id = b.GetID();
			if( id === n ) return b;
		}
		
		return null;

	}


	static reset () { isReset = true }

	static endReset () {

		engine.stop()

		engine.resetItems()

		engine.clearWorld();
		
		Utils.clear()

		engine.post( { m:'resetCallback', o:{} } );

	}

	static stop () {

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
		if( pause ) engine.stop();
		else engine.start();

	}


	//-----------------------
	//
	//  ITEMS
	//
	//-----------------------

	static initItems () {

		items['body'] = new Body();
		items['solid'] = new Solid();
		items['joint'] = new Joint();
		items['ray'] = new Ray();
		items['contact'] = new Contact();
		items['character'] = new Character();

		Utils.byId = engine.byId;

	}

	static resetItems() { Object.values(items).forEach( value => value.reset() ); }
	static stepItems() { Object.values(items).forEach( value => value.step() ); }

	static adds( r ) { let i = r.length, n = 0; while( i-- ) engine.add(r[n++]); }
	static removes( r ) { let i = r.length, n = 0; while( i-- ) engine.remove(r[n++]); }
	static changes( r ) { let i = r.length, n = 0; while( i-- ) engine.change(r[n++]); }

	static add ( o = {} ) {

		let type = getType( o );
		items[type].add( o );

	}

	static remove ( o = {} ) {

		let b = engine.byName( o.name );
		if( b ) items[b.type].clear( b );

	}

	static change ( o = {} ) {

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



/*
interface BodyInterface {
	Body CreateBody([Const, Ref] BodyCreationSettings inSettings);
	Body CreateSoftBody([Const, Ref] SoftBodyCreationSettings inSettings);
	void DestroyBody([Const, Ref] BodyID inBodyID);
	void AddBody([Const, Ref] BodyID inBodyID, EActivation inActivationMode);
	void RemoveBody([Const, Ref] BodyID inBodyID);
	boolean IsAdded([Const, Ref] BodyID inBodyID);
	[Value] BodyID CreateAndAddBody([Const, Ref] BodyCreationSettings inSettings, EActivation inActivationMode);
	[Value] BodyID CreateAndAddSoftBody([Const, Ref] SoftBodyCreationSettings inSettings, EActivation inActivationMode);
	[Const] Shape GetShape([Const, Ref] BodyID inBodyID);
	void SetShape([Const, Ref] BodyID inBodyID, [Const] Shape inShape, boolean inUpdateMassProperties, EActivation inActivationMode);
	void SetObjectLayer([Const, Ref] BodyID inBodyID, unsigned long inLayer);
	unsigned long GetObjectLayer([Const, Ref] BodyID inBodyID);
	void SetPositionAndRotation([Const, Ref] BodyID inBodyID, [Const, Ref] Vec3 inPosition, [Const, Ref] Quat inRotation, EActivation inActivationMode);
	void SetPositionAndRotationWhenChanged([Const, Ref] BodyID inBodyID, [Const, Ref] Vec3 inPosition, [Const, Ref] Quat inRotation, EActivation inActivationMode);
	void GetPositionAndRotation([Const, Ref] BodyID inBodyID, [Ref] Vec3 outPosition, [Ref] Quat outRotation);
	void SetPosition([Const, Ref] BodyID inBodyID, [Const, Ref] Vec3 inPosition, EActivation inActivationMode);
	[Value] Vec3 GetPosition([Const, Ref] BodyID inBodyID);
	void SetRotation([Const, Ref] BodyID inBodyID, [Const, Ref] Quat inRotation, EActivation inActivationMode);
	[Value] Quat GetRotation([Const, Ref] BodyID inBodyID);
	void MoveKinematic([Const, Ref] BodyID inBodyID, [Const, Ref] Vec3 inPosition, [Const, Ref] Quat inRotation, float inDeltaTime);
	void ActivateBody([Const, Ref] BodyID inBodyID);
	void DeactivateBody([Const, Ref] BodyID inBodyID);
	boolean IsActive([Const, Ref] BodyID inBodyID);
	void SetMotionType([Const, Ref] BodyID inBodyID, EMotionType inMotionType, EActivation inActivationMode);
	void SetMotionQuality([Const, Ref] BodyID inBodyID, EMotionQuality inMotionQuality);
};

*/