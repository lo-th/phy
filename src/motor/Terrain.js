import { Item } from '../core/Item.js';
import { Utils, root, math } from './root.js';

import { Landscape } from '../3TH/objects/Landscape.js';

// THREE TERRAIN

export class Terrain extends Item {

	constructor() {

		super()

		this.Utils = Utils
		this.type = 'terrain'

	}

	add ( o = {} ) {

		this.setName( o )

		if( root.engine === 'PHYSX'){
			o.isAbsolute = true
			o.isTurned = true
		}

		const t = new Landscape( o )

		// add to world
		this.addToWorld( t, o.id )

        // add to physics
        root.post({ m:'add', o:toPhysics(t) })

		return t

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

	}
	
}

const toPhysics = function( t ) {

	const o = {
		name:t.name,
		type:t.type,
		pos:t.position.toArray(),
		quat:root.engine === 'PHYSX' ? [0,0,0,1]:t.quaternion.toArray(), // physx terrain can't turn !!
	}

	if( root.engine === 'PHYSX' || root.engine === 'AMMO' ){
		o.type = 'terrain'
		o.size = t.size
		o.sample = t.sample
		o.heightData = t.heightData
	} else {
		o.type = 'mesh'
		o.v = math.getVertex( t.geometry, root.engine === 'OIMO' )
		o.index = root.engine === 'OIMO' ? null : math.getIndex( t.geometry )
	}

	return o

}