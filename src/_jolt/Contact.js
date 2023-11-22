import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root } from './root.js'


// JOLT CONTACT


export class Contact extends Item {

	constructor () {

		super();
		this.Utils = Utils;
		this.type = 'contact';
		this.initContact = false;

	}

	reset () {
		
		super.reset()
		
		if( !this.initContact ) return;
		this.initContact = false;
		Jolt.destroy(this.contactListener);

	}

	init () {

		if( this.initContact ) return;

		this.initContact = true;

		this.contactListener = new Jolt.ContactListenerJS();

		this.contactListener.OnContactValidate = (inBody1, inBody2, inBaseOffset, inCollideShapeResult) => {
			inBody1 = Jolt.wrapPointer(inBody1, Jolt.Body);
			inBody2 = Jolt.wrapPointer(inBody2, Jolt.Body);
			const b1 = inBody1.name;
			const b2 = inBody2.name;
			

			if(b1 && b2){
				inCollideShapeResult = Jolt.wrapPointer(inCollideShapeResult, Jolt.CollideShapeResult);
				//Utils.addContact( b1 + '_' + b2 );
			}


			//collisionLog.value += 'OnContactValidate ' + inBody1.GetID().GetIndex() + ' ' + inBody2.GetID().GetIndex() + ' ' + inCollideShapeResult.mPenetrationAxis.toString() + '\n';
			return Jolt.ValidateResult_AcceptAllContactsForThisBodyPair;
		};
		this.contactListener.OnContactAdded = (inBody1, inBody2, inManifold, ioSettings) => {
			inBody1 = Jolt.wrapPointer(inBody1, Jolt.Body);
			inBody2 = Jolt.wrapPointer(inBody2, Jolt.Body);
			const b1 = inBody1.name;
			const b2 = inBody2.name;
			inManifold = Jolt.wrapPointer(inManifold, Jolt.ContactManifold);
			ioSettings = Jolt.wrapPointer(ioSettings, Jolt.ContactSettings);
			//collisionLog.value += 'OnContactAdded ' + inBody1.GetID().GetIndex() + ' ' + inBody2.GetID().GetIndex() + ' ' + inManifold.mWorldSpaceNormal.toString() + '\n';

			// Override the restitution to 0.5
			ioSettings.mCombinedRestitution = 0.5;
			if(b1 && b2) Utils.addContact( b1 + '_' + b2 );
		};
		this.contactListener.OnContactPersisted = (inBody1, inBody2, inManifold, ioSettings) => {
			inBody1 = Jolt.wrapPointer(inBody1, Jolt.Body);
			inBody2 = Jolt.wrapPointer(inBody2, Jolt.Body);
			const b1 = inBody1.name;
			const b2 = inBody2.name;
			inManifold = Jolt.wrapPointer(inManifold, Jolt.ContactManifold);
			ioSettings = Jolt.wrapPointer(ioSettings, Jolt.ContactSettings);
			//collisionLog.value += 'OnContactPersisted ' + inBody1.GetID().GetIndex() + ' ' + inBody2.GetID().GetIndex() + ' ' + inManifold.mWorldSpaceNormal.toString() + '\n';

			// Override the restitution to 0.5
			ioSettings.mCombinedRestitution = 0.5;
			if(b1 && b2) Utils.addContact( b1 + '_' + b2 );
		};
		this.contactListener.OnContactRemoved = (inSubShapePair) => {
			/*inSubShapePair = Jolt.wrapPointer(inSubShapePair, Jolt.SubShapeIDPair);
			//collisionLog.value += 'OnContactRemoved ' + inSubShapePair.GetBody1ID().GetIndex() + ' ' + inSubShapePair.GetBody2ID().GetIndex() + '\n';

			const b1 = inSubShapePair.GetBody1ID().name;
			const b2 = inSubShapePair.GetBody2ID().name;
			if(b1 && b2){ 
				Utils.removeContact( b1 + '_' + b2 );
				Utils.removeContact( b2 + '_' + b1 );
			 }*/
		};

		root.physicsSystem.SetContactListener(this.contactListener);

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, c, n, hit;
		
		while( i-- ){

			c = this.list[i];
			n = N + ( i * Num.contact );

			//console.log(collisionLog)

			hit = Utils.byContact( c.cc ) ? 1:0;
			if(!hit) hit = Utils.byContact( c.cr ) ? 1:0;

		    AR[n] = hit;

		}

		Utils.clearContact();

	}

	add ( o = {} ) {

		let name = this.setName( o )

		let b1 = this.byName( o.b1 );
		let b2 = this.byName( o.b2 );

		if( b1 === null ) return

	    //root.bodyRef.addCollisionCallback( b1, true );
	    //if( b2 !== null ) root.bodyRef.addCollisionCallback( b2, true );

		let c = new Pair( o );

		// add to world
		this.addToWorld( c, o.id );

		//root.needContact = true;
		//root.needTrigger = true;

		this.init();

	}


	///


}

//--------------
//
//  COLLISION
//
//--------------
/*
const collisionEventType = ( n ) => {

	let t = 'COLLISION_STARTED'
	switch(n){
		case havok.EventType.COLLISION_STARTED.value : t = 'COLLISION_STARTED'; break;
		case havok.EventType.COLLISION_FINISHED.value : t = 'COLLISION_FINISHED'; break;
		case havok.EventType.COLLISION_CONTINUED.value : t = 'COLLISION_CONTINUED'; break;
	}
	return t;

}

const triggerEventType = ( n ) => {

	let t = 'TRIGGER_ENTERED';
	if( n === 16 ) t = 'TRIGGER_EXITED';
	return t;

}

export class ContactPoint {

	constructor () {
		this.body = null;
		this.position = [0,0,0];
		this.normal = [0,0,0];
	}
}


export class CollisionEvent {

	constructor () {
		this.contactOnA = new ContactPoint();
		this.contactOnB = new ContactPoint();
		this.impulseApplied = 0;
		this.type = 0;
	}

    static readToRef( buffer, offset, eventOut ) {
        const intBuf = new Int32Array(buffer, offset);
        const floatBuf = new Float32Array(buffer, offset);
        const offA = 2;
        eventOut.contactOnA.body = Utils.byId( BigInt(intBuf[offA]) ); //<todo Need to get the high+low words!
        eventOut.contactOnA.position = [ floatBuf[offA + 8], floatBuf[offA + 9], floatBuf[offA + 10] ];
        eventOut.contactOnA.normal = [ floatBuf[offA + 11], floatBuf[offA + 12], floatBuf[offA + 13] ];
        const offB = 18;
        eventOut.contactOnB.body = Utils.byId( BigInt(intBuf[offB]) );
        eventOut.contactOnB.position = [ floatBuf[offB + 8], floatBuf[offB + 9], floatBuf[offB + 10] ];
        eventOut.contactOnB.normal = [ floatBuf[offB + 11], floatBuf[offB + 12], floatBuf[offB + 13] ];
        eventOut.impulseApplied = floatBuf[offB + 13 + 3];
        
        eventOut.type = collisionEventType( intBuf[0] );
    }
}

export class TriggerEvent {

	constructor () {
		this.bodyA = BigInt(0);
		this.bodyB = BigInt(0);
		this.type = 0;
	}

    static readToRef(buffer, offset, eventOut) {
        const intBuf = new Int32Array(buffer, offset);
        eventOut.type = triggerEventType( intBuf[0] );
        eventOut.bodyA = Utils.byId(BigInt(intBuf[2]));
        eventOut.bodyB = Utils.byId(BigInt(intBuf[6]));
    }
}

*/

export class Pair {

	constructor ( o = {} ) {

		this.type = 'contact';

		this.name = o.name;

		this.cc = o.b1 + '_' + o.b2;
		this.cr = o.b2 + '_' + o.b1;

	}

}