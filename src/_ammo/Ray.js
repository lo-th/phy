import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';

import { Utils, root } from './root.js';

// AMMO RAY

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'ray'

		this.callback = new Ammo.ClosestRayResultCallback()
		this.t = new Ammo.btTransform()


	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		root.reflow.ray = [];

		let i = this.list.length, r, n, name, pp, ph;
		let cb = this.callback;

		while( i-- ){

			n = N + ( i * Num.ray );

			r = this.list[i];

			AR[n] = 0;
			
			cb.set_m_collisionObject( null );

			pp = r.getPoint( this.t )

			cb.get_m_rayFromWorld().fromArray( pp[0] )
			cb.get_m_rayToWorld().fromArray( pp[1] )
			cb.set_m_collisionFilterGroup( r.group );
			cb.set_m_collisionFilterMask( r.mask );
			cb.set_m_closestHitFraction( r.precision );

			root.world.rayTest( cb.get_m_rayFromWorld(), cb.get_m_rayToWorld(), cb );

			if ( cb.hasHit() ) {

				AR[n] = 1;

				ph = cb.get_m_hitPointWorld().toArray()
				AR[n+1] = MathTool.distanceArray( pp[0], ph )
				AR[n+2] = pp[0][0]
				AR[n+3] = pp[0][1]
				AR[n+4] = pp[0][2]

				AR[n+5] = ph[0]
				AR[n+6] = ph[1]
				AR[n+7] = ph[2]

				cb.get_m_hitNormalWorld().toArray( AR, n+8 )

				name = Ammo.castObject( cb.get_m_collisionObject(), Ammo.btRigidBody ).name;
				//if ( name === undefined ) name = Ammo.castObject( ray.get_m_collisionObject(), Ammo.btSoftBody ).name;
				root.reflow.ray[i] = name;

			}

		}

	}

	add ( o = {} ) {

		let name = this.setName( o )
		let r = new ExtraRay( o )
		// add to world
		this.addToWorld( r, o.id )

	}

	set ( o = {}, r = null ) {
		
		if( r === null ) r = this.byName( o.name );
		if( r === null ) return;

		if(o.begin) r.begin = o.begin
		if(o.end) r.end = o.end
		
	}

}



export class ExtraRay {

	constructor( o = {} ) {

	    this.type = 'ray';

	    this.name = o.name;
	    this.parent = o.parent || ''

	    this.begin = o.begin || [0,0,0]
	    this.end = o.end || [0,0,1]

	    this.precision = o.precision || 1;
	    this.group = o.group !== undefined || 1
	    this.mask = o.mask !== undefined || -1

	}

	getPoint( t ){
		if( this.parent ){
			const b = Utils.byName( this.parent )
			if(b){
				b.getMotionState().getWorldTransform( t )
				//const t = b.getGlobalPose()
				const p = t.getOrigin().toArray()
				const q = t.getRotation().toArray()
				return [
				    MathTool.applyTransformArray( this.begin, p, q ),
				    MathTool.applyTransformArray( this.end, p, q )
				]

			} 
		}
		return [ this.begin, this.end ]
	}

}