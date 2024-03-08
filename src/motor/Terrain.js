import { Item } from '../core/Item.js';
import { MathTool } from '../core/MathTool.js';
import { Utils, root } from './root.js';
import { Num } from '../core/Config.js';
import { Mat } from './base/Mat.js';

import { Landscape } from '../3TH/objects/Landscape.js';

// THREE TERRAIN

export class Terrain extends Item {

	constructor() {

		super()

		this.Utils = Utils
		this.type = 'terrain';
		this.num = Num[this.type]

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, n, s, j, k=0, m;

		while( i-- ){

			s = this.list[i];
			//n = N + ( i * this.num );
			s.step()// AR[n] );

		}

	}

	add ( o = {} ) {

		this.setName( o )

		if( root.engine === 'JOLT' ){
			o.isAbsolute = true
			o.isTurned = false
		}

		if( root.engine === 'PHYSX' ){
			o.isAbsolute = true
			o.isTurned = true
		}

		if( root.engine === 'HAVOK'){
			o.isAbsolute = true
			o.isTurned = true
			o.isReverse = false
		}

		if( root.engine !== 'OIMO'){
			o.zone = o.zone || 0.25
			//o.debuger = true
		}

		const t = new Landscape( o );

		Mat.extendShader( t.material, t.material.onBeforeCompile );

		t.physicsUpdate = ( name, h ) =>{

			root.flow.tmp.push( { name:name, heightData:h } );
			//root.post({m:'change', o:{ name:'terra', heightData:h }})
		}

		// add to world
		this.addToWorld( t, o.id )

        // add to physics
        root.post({ m:'add', o:toPhysics(t) })

		return t

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		b.set(o)

	}
	
}

const toPhysics = function( t ) {

	const o = {
		name:t.name,
		type:t.type,
		pos:t.position.toArray(),
		quat:root.engine === 'PHYSX' ? [0,0,0,1]:t.quaternion.toArray(), // physx terrain can't turn !!
	}

	if( root.engine === 'PHYSX' || root.engine === 'AMMO' || root.engine === 'HAVOK' || root.engine === 'JOLT'){
		o.type = 'terrain';
		o.size = t.sizeZ;
		o.sample = t.sampleZ;
		o.zone = t.zone;
		o.heightData = t.heightData;
	} else {
		o.type = 'mesh';
		o.v = MathTool.getVertex( t.geometry, root.engine === 'OIMO' );
		o.index = root.engine === 'OIMO' ? null : MathTool.getIndex( t.geometry );
	}

	return o

}