import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool } from '../core/MathTool.js';

import { root, Utils, Vec3, Quat } from './root.js';

// RAPIER RAY

export class Ray extends Item {

	constructor () {

		super();

		this.Utils = Utils

		this.type = 'ray';

		this.ray = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 });

		this.v1 = new Vec3( 0,0,0 )
		this.v2 = new Vec3( 0,0,0 )

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		root.reflow.ray = [];

		let i = this.list.length, r, n, pp, ph
		let distance = 0

		while( i-- ){

			n = N + ( i * Num.ray )

			r = this.list[i];

			pp = r.getPoint()

			AR[n] = 0

			this.v1.fromArray( pp[0] )
			this.v2.fromArray( pp[1] )

			// distance
			distance = MathTool.distanceArray( pp[0], pp[1] );//this.v1.distanceTo( this.v2 )
			AR[n+1] = distance;

			// convert v2 to direction
			this.v2.fromArray( MathTool.normalArray( pp[0], pp[1] ) );
			//this.v2.sub( this.v1 ).normalize()
			this.ray.origin = this.v1
			this.ray.dir = this.v2

			let first = true

			root.world.intersectionsWithRay( this.ray, distance, r.solid,  (hit) => {

				let name = hit.collider._parent.name
				if( !r.selfHit && r.parent && name === r.parent ) return true; // ignore parent body

				if(!first) return true;
				first = false;

				AR[n] = 1
				let hitPoint = this.ray.pointAt(hit.toi)

				ph = [ hitPoint.x, hitPoint.y, hitPoint.z ]

				AR[n+1] = MathTool.distanceArray( pp[0], ph )
				AR[n+2] = pp[0][0]
				AR[n+3] = pp[0][1]
				AR[n+4] = pp[0][2]

				AR[n+5] = hitPoint.x
				AR[n+6] = hitPoint.y
				AR[n+7] = hitPoint.z

				AR[n+8] = hit.normal.x
				AR[n+9] = hit.normal.y
				AR[n+10] = hit.normal.z

				root.reflow.ray[i] = hit.collider._parent.name
			})

		}

	}

	///

	add ( o = {} ) {

		let name = this.setName( o );
		let r = new ExtraRay( o ); 


		// add to world
		this.addToWorld( r, o.id );

	}

	set ( o = {}, r = null ) {

	}

}



export class ExtraRay {

	constructor( o = {} ) {

	    this.type = 'ray'
	    this.name = o.name

	    this.group = o.group !== undefined || 0xfffffffff
	    this.parent = o.parent || ''

	    this.selfHit = o.selfHit || false;

	    this.begin = o.begin || [0,0,0]
	    this.end = o.end || [0,0,1]

	    // use intern shape
	    this.solid = false

	}

	getPoint(){
		if( this.parent ){
			const b = Utils.byName( this.parent )
			if(b){
				let p = b.translation()
				let q = b.rotation()
				const pp = [p.x, p.y, p.z]
				const qq = [q.x, q.y, q.z, q.w]
				return [
				    MathTool.applyTransformArray( this.begin, pp, qq ),
				    MathTool.applyTransformArray( this.end, pp, qq )
				]

			} 
		}
		return [ this.begin, this.end ]
	}

}