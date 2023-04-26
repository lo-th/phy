import { Item } from '../core/Item.js';
import { Utils, root, math } from './root.js';

// HAVOK TERRAIN

export class Terrain extends Item {

	constructor() {

		super()

		this.type = 'terrain'
		this.Utils = Utils

	}

	add ( o ) {

		let name = this.setName( o )
		let t = new LandScape( o )
		this.addToWorld( t, o.id )

	}

	set ( o = {}, t = null ) {

		if( t === null ) t = this.byName( o.name )
		if( t === null ) return
		t.set( o )

	}

}


// PHYSX LANDSCAPE

export class LandScape {

	constructor( o ) {

		this.type = 'terrain'
		this.name = o.name

		this.needUpdate = false
		this.heightField = null

		this.init(o)

	}

	init( o ) {

		this.size = o.size;
		this.sample = o.sample;
		this.squarSize = [ this.size[0] / (this.sample[0]-1), this.size[2] / (this.sample[1]-1) ];

		

		//this.fullSample = [o.sample[0], o.sample[1]]

		// height data
		this.setData( o )

		
		

		this.body = havok.HP_Body_Create()[1];
		havok.HP_Body_SetShape( this.body, this.geometry )

		let pos = o.pos || [0,0,0]

		pos[0] = pos[0]+(this.squarSize[0]*0.5)
		pos[2] = pos[2]+(this.squarSize[1]*0.5)

		console.log(pos)

		havok.HP_Body_SetPosition( this.body, pos )
		if( o.quat ) havok.HP_Body_SetOrientation( this.body, o.quat )

		//havok.HP_Body_SetOrientation(this.body, [0, 1, 0, 0])//180
		//havok.HP_Body_SetOrientation(this.body, [0, 0.7071067811865475, 0, 0.7071067811865476])//90

		havok.HP_World_AddBody( root.world, this.body, false );


	}

	getVertices ( ar ) {
        const nFloats = ar.length //* 3;
        const bytesPerFloat = 4;
        const nBytes = nFloats * bytesPerFloat;
        const bufferBegin = havok._malloc(nBytes);

        const ret = new Float32Array(havok.HEAPU8.buffer, bufferBegin, nFloats);
        /*for (let i = 0; i < ar.length; i++) {
        	ret[i] = ar[i];
        }*/
        let lng = ar.length
        let i = ar.length
        while(i--){
        	ret[lng-i] = ar[i];
        }
        return ret;
    }

    setMaterial ( shape, o ) {

		if(!o.friction && !o.restitution) return
		if(o.friction === 0.5 && !o.restitution === 0 ) return
        const dynamicFriction = o.friction ?? 0.5;
        const staticFriction = o.staticFriction ?? dynamicFriction;
        const restitution = o.restitution ?? 0.0;
        const frictionCombine = o.frictionCombine ?? 'MINIMUM';
        const restitutionCombine = o.restitutionCombine ?? 'MAXIMUM';

        const hpMaterial = [staticFriction, dynamicFriction, restitution, this.materialCombine(frictionCombine), this.materialCombine(restitutionCombine)];
        havok.HP_Shape_SetMaterial(shape, hpMaterial);

    }

	setData ( o ) {

		let sample, samples
		const heightData = this.getVertices( o.heightData );
		const divid = o.sample ? o.sample : this.sample
		//let scale = [this.squarSize[0], this.size[1], this.squarSize[1]]
		let scale = [this.squarSize[0], 1, this.squarSize[1]]
		//let scale = [1, 1, 1]

		///console.log(this.size, divid, this.squarSize)
		/*const decal = o.decal ? o.decal : [0,0]
		const reverseEdge = o.reverse || false
		const shrinkBounds = o.shrink || false

		sample = new PhysX.PxHeightFieldSample()
		samples = new PhysX.Vector_PxHeightFieldSample()
		
		let i = heightData.length

		while(i--){
			sample.height = heightData[i]*10000
			if( reverseEdge ) sample.setTessFlag()
			samples.push_back( sample )	
		}

		const desc = new PhysX.PxHeightFieldDesc();
		desc.format = PhysX._emscripten_enum_PxHeightFieldFormatEnum_eS16_TM()
		desc.nbColumns = divid[0]
	    desc.nbRows = divid[1]
		desc.samples.stride = 4
        desc.samples.data = samples.data()
		
	    if( this.heightField ) this.heightField.modifySamples( decal[0], decal[1], desc, shrinkBounds );
	    else this.heightField = root.cooking.createHeightField( desc, root.world.getPhysicsInsertionCallback() );
	    //console.log(desc)
	    PhysX.destroy(desc)
    	PhysX.destroy(samples)
		PhysX.destroy(sample)*/

		//console.log(havok.HP_Shape_CreateHeightField)

		// int, int, Vector3, unsigned long
		this.geometry = havok.HP_Shape_CreateHeightField( divid[0], divid[1], scale, heightData.byteOffset )[1]
		this.setMaterial( this.geometry, o )

	}

	setDataTest ( o ) {

		/*let tmpIndex, index64
		let heightData = o.heightData
		const divid = o.sample ? o.sample : this.sample
		const decal = o.decal ? o.decal : [0,0]
		const shrinkBounds = o.shrink || false

		index64 = new Uint32Array( heightData.length ) 
		
		let i = heightData.length, n=0, p

		while(i--){
			index64[i] = heightData[n]*10000
			n++
		}

		const desc = new PhysX.PxHeightFieldDesc()
		desc.format = PhysX._emscripten_enum_PxHeightFieldFormatEnum_eS16_TM()
		desc.nbColumns = divid[0]
	    desc.nbRows = divid[1]
		
		tmpIndex = Utils.malloc( index64 )
		desc.samples.stride = index64.BYTES_PER_ELEMENT
		desc.samples.data = tmpIndex

	    if( this.heightField ) this.heightField.modifySamples( decal[0], decal[1], desc, shrinkBounds );
	    else this.heightField = root.cooking.createHeightField( desc, root.world.getPhysicsInsertionCallback() )
	
	    //console.log(desc.samples.data)

	    PhysX.destroy(desc);
		Utils.free( tmpIndex )*/

	}

	release () {

		havok.HP_World_RemoveBody(root.world, this.body); 
		havok.HP_Body_Release(this.body)

		console.log('terrain release')

		//console.log('release Terrain !!')
		//removeActor (PxActor &actor, bool wakeOnLostTouch=true)=0
		//root.scene.removeActor( this.body, true );
		//if( this.heightField ) this.heightField.release()

	}

	set (o) {

		if( o.heightData ){

			//this.setData(o)
			//this.setDataTest( o )

			/*let i = o.heightData.length, p

			while(i--){
				p = this.samples.at(i).height = Math.floor( o.heightData[i]*10000 );
				if(i=== 1) console.log(p)
				//p.height = Math.floor( o.heightData[i]*10000 );
			}

			this.desc.samples.data = this.samples.data()

			this.heightField.modifySamples( 0,0, this.desc, false );*/

			///console.log(this.desc)

		}

		

	}

}