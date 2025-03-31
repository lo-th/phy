import { Item } from '../core/Item.js';
import { MathTool } from '../core/MathTool.js';
import { Num } from '../core/Config.js';
//import { Mat } from './base/Mat.js';

import { Landscape } from '../3TH/objects/Landscape.js';

// THREE TERRAIN
let Mat = null;

export class Terrain extends Item {

	constructor( motor ) {

		super()

		this.motor = motor;
		this.engine = this.motor.engine;
		this.Utils = this.motor.utils;

		Mat = this.motor.mat

		this.type = 'terrain';
		this.num = Num[this.type]

	}

	step (AR, N) {

		let i = this.list.length, n, s, j, k=0, m;

		while( i-- ){

			s = this.list[i];
			//n = N + ( i * this.num );
			s.step()// AR[n] );

		}

	}

	add ( o = {} ) {

		this.setName( o )

		if( this.engine === 'JOLT' ){
			o.isAbsolute = true
			o.isTurned = false
		}

		if( this.engine === 'PHYSX' ){
			o.isAbsolute = true
			o.isTurned = true
		}

		if( this.engine === 'HAVOK'){
			o.isAbsolute = true
			o.isTurned = true
			o.isReverse = false
		}

		if( this.engine !== 'OIMO'){
			o.zone = o.zone || 0.25
			//o.debuger = true
		}

		const t = new Landscape( o );

		Mat.extendShader( t.material, t.material.onBeforeCompile );

		t.physicsUpdate = ( name, h ) =>{

			this.motor.flow.tmp.push( { name:name, heightData:h } );
			//root.post({m:'change', o:{ name:'terra', heightData:h }})
		}

		// add to world
		this.addToWorld( t, o.id )

        // add to physics
        this.motor.post({ m:'add', o:toPhysics(t, this.engine) })

		return t

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		b.set(o)

	}
	
}

const toPhysics = function( t, engine ) {

	const o = {
		name:t.name,
		type:t.type,
		pos:t.position.toArray(),
		quat:engine === 'PHYSX' ? [0,0,0,1]:t.quaternion.toArray(), // physx terrain can't turn !!
	}

	if( engine === 'PHYSX' || engine === 'AMMO' || engine === 'HAVOK' || engine === 'JOLT'){
		o.type = 'terrain';
		o.size = t.sizeZ;
		o.sample = t.sampleZ;
		o.zone = t.zone;
		o.heightData = t.heightData;
	} else {
		o.type = 'mesh';
		o.v = MathTool.getVertex( t.geometry, engine === 'OIMO' );
		o.index = engine === 'OIMO' ? null : MathTool.getIndex( t.geometry );
	}

	return o

}