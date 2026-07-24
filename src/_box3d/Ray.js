import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';


import { Utils, root, map } from './root.js';

// HAVOK RAY
const vToAr = Utils.vToAr
const qToAr = Utils.qToAr
const toQuat = Utils.toQuat
const toVec = Utils.toVec
const transToAr = Utils.transToAr
const toTrans = Utils.toTrans

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'ray'

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		root.reflow.ray = [];

		let i = this.list.length, r, n, b, query, pp, ph;
		let queryMembership, queryCollideWith, shouldHitTriggers, bodyToIgnore;
		let numHit, normal, hitData, triangle, origin, target, translation;

		while( i-- ){

			n = N + ( i * Num.ray );

			r = this.list[i];

			pp = r.getPoint();

			//queryMembership = r.group//~0;
			//queryCollideWith = r.mask//~0;

			//shouldHitTriggers = r.hitTrigger;
            //bodyToIgnore = r.ignore;

			//query = [pp[0], pp[1], [queryMembership, queryCollideWith]];
			//query = [ pp[0], pp[1], [queryMembership, queryCollideWith], shouldHitTriggers, bodyToIgnore];

			AR[n] = 0;

			target = [
				pp[1][0]-pp[0][0], 
				pp[1][1]-pp[0][1], 
				pp[1][2]-pp[0][2]
			]

			origin = toVec(pp[0])
			translation = toVec(target)

			//havok.HP_World_CastRayWithCollector( root.world, root.queryCollector, query );

			//numHit = havok.HP_QueryCollector_GetNumHits(root.queryCollector)[1]
			const filter = b3.b3DefaultQueryFilter();

			if(r.mask) filter.maskBits = r.mask 
			if(r.group) filter.categoryBits = r.group


            let rayResult = b3.b3World_CastRayClosest(root.world, origin, translation, filter);


			if ( rayResult.hit ) {

				const fraction = rayResult.fraction;    // [0..1] how far along translation
			    normal = vToAr(rayResult.normal);        // surface normal at hit point
			    const hitX = origin.x + translation.x * fraction;
			    const hitY = origin.y + translation.y * fraction;
			    const hitZ = origin.z + translation.z * fraction;
    
				//hitData = this.nearest( numHit, pp[0] )

				//hitData = havok.HP_QueryCollector_GetCastRayResult(root.queryCollector, 0)[1];
				ph = [hitX, hitY, hitZ];

				AR[n] = 1;
				AR[n+1] = MathTool.distanceArray( pp[0], ph );
				AR[n+2] = pp[0][0];
				AR[n+3] = pp[0][1];
				AR[n+4] = pp[0][2];

				AR[n+5] = ph[0];
				AR[n+6] = ph[1];
				AR[n+7] = ph[2];

				AR[n+8] = normal[0];
				AR[n+9] = normal[1];
				AR[n+10] = normal[2];

				b = Utils.byId( rayResult.shapeId.index1 );

				if( b ){ 
					// get name of hit rigidbody
					root.reflow.ray[i] = b.name;
				}

			}

		}

	}

	nearest( numHit, origin ){

		if(numHit === 1){
			return havok.HP_QueryCollector_GetCastRayResult(root.queryCollector, 0)[1];
		}

		let near = 0
		let distance = Infinity;
		let n = numHit, h, point, d;
		while(n--){
			h = havok.HP_QueryCollector_GetCastRayResult(root.queryCollector, n)[1];
			point = h[1][3];
			d = MathTool.distanceArray( origin, point );
			if(d<distance){ 
				distance = d 
				near = h
			}
		}

		return near

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );
		let r = new ExtraRay( o ); 

		// apply option
		//this.set( o, r );

		// add to world
		this.addToWorld( r, o.id );

	}

	set ( o = {}, r = null ) {

		if( r === null ) r = this.byName( o.name );
		if( r === null ) return;

		if(o.begin) r.begin = o.begin;
		if(o.end) r.end = o.end;

	}

}



export class ExtraRay {

	constructor( o = {} ) {

	    this.type = 'ray';
	    this.name = o.name;
	    this.parent = o.parent || '';

	    this.selfHit = o.selfHit || false;

	    this.noRotation = o.noRotation || false;

	    this.begin = o.begin || [0,0,0];
	    this.end = o.end || [0,0,1];

	    this.group = o.group || ~0; // queryMembership
		this.mask =	o.mask || ~0; //queryCollideWith
		this.hitTrigger = o.hitTrigger || false // Should hit triggers
		this.ignore = o.ignore || [BigInt(0)] // Optional BodyID to ignore

	}

	getPoint(){

		if( this.parent ){
			const b = Utils.byName( this.parent )
			if(b){
				const ar = transToAr(b3.b3Body_GetTransform (b))
				const p = ar[0]
				const q = this.noRotation ? [0,0,0,1] : ar[1]
				return [
				    MathTool.applyTransformArray( this.begin, p, q ),
				    MathTool.applyTransformArray( this.end, p, q )
				]

			} 
		}
		return [ this.begin, this.end ]
		
	}

}