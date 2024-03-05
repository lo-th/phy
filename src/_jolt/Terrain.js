import { Item } from '../core/Item.js';
import { Utils, root } from './root.js';

// HAVOK TERRAIN

export class Terrain extends Item {

	constructor() {

		super()

		this.type = 'terrain';
		this.Utils = Utils;

	}

	add ( o ) {

		let name = this.setName( o );
		let t = new LandScape( o );
		this.addToWorld( t, o.id );

	}

	set ( o = {}, t = null ) {

		if( t === null ) t = this.byName( o.name );
		if( t === null ) return;
		t.set( o );

	}

}


// PHYSX LANDSCAPE

export class LandScape {

	constructor( o ) {

		this.type = 'terrain'
		this.name = o.name

		this.needUpdate = false;
		this.heightField = null;
		this.heights = null;
		this.shape = null;

		this.init(o);

	}

	init( o ) {

		this.size = o.size;
		this.sample = o.sample;
		this.squarSize = [ this.size[0] / (this.sample[0]-1), this.size[2] / (this.sample[1]-1) ];
		this.scale = [this.squarSize[0], this.size[1], this.squarSize[1]]

		//this.fullSample = [o.sample[0], o.sample[1]]

		// height data
		this.setData( o )


		//this.body = havok.HP_Body_Create()[1];
		//havok.HP_Body_SetShape( this.body, this.geometry )

		let pos = o.pos || [0,0,0];

		//pos[0] = pos[0]+(this.squarSize[0]*0.5)-(this.size[0]*0.5)
		//pos[2] = pos[2]+(this.squarSize[1]*0.5)-(this.size[2]*0.5)

		pos[0] = pos[0]-(this.size[0]*0.5);
		pos[2] = pos[2]-(this.size[2]*0.5);

		const position = new Jolt.RVec3(0,0,0).fromArray(pos); // The image tends towards 'white', so offset it down closer to zero
		const rotation = new Jolt.Quat(0, 0, 0, 1);

		let creationSettings = new Jolt.BodyCreationSettings(this.shape, position, rotation, Jolt.EBodyType_Static, root.LAYER_NON_MOVING);
		this.body = root.bodyInterface.CreateBody(creationSettings);
		Jolt.destroy(creationSettings);
		//Jolt.destroy(this.shape);


		// add to world
		//this.addToWorld( body );
		root.bodyInterface.AddBody( this.body.GetID(), Jolt.EActivation_Activate );


	}

	setData ( o ) {

		let h = o.heightData;

		// Create the heightfield
		const shapeSettings = new Jolt.HeightFieldShapeSettings();
		shapeSettings.mOffset = new Jolt.RVec3(0, 0, 0);
		shapeSettings.mScale = new Jolt.RVec3(0, 0, 0).fromArray(this.scale);
		shapeSettings.mSampleCount = this.sample[0];
		shapeSettings.mBlockSize = 2;
		const totalSize = h.length;
		shapeSettings.mHeightSamples.resize(totalSize);
		this.heightSamples = new Float32Array(Jolt.HEAPF32.buffer, Jolt.getPointer(shapeSettings.mHeightSamples.data()), totalSize );
		for (let i = 0; i < totalSize; i++) {
			this.heightSamples[i] = h[i];
			//if (imgData.data[i * 4 + 3] == 0) height = Jolt.HeightFieldShapeConstantValues.prototype.cNoCollisionValue; // Invisible pixels make holes
		}
		this.shape = shapeSettings.Create().Get();

		//console.log( this.shape )

	}

	release () {

		root.bodyInterface.RemoveBody( this.body.GetID() ); 
		root.bodyInterface.DestroyBody( this.body.GetID() ); 

		Jolt.destroy(this.shape);

		//console.log('terrain release')

	}

	set (o) {

		if( o.heightData ){

			const totalSize = o.heightData.length;
			for (let i = 0; i < totalSize; i++) {
				this.heightSamples[i] = o.heightData[i];
			}

			/*if(this.geometry) havok.HP_Shape_Release(this.geometry)
			this.getVertices( o.heightData )
			this.geometry = havok.HP_Shape_CreateHeightField( this.divid[0], this.divid[1], this.scale, this.heights.byteOffset )[1]
			this.setMaterial( this.geometry, o )
			havok.HP_Body_SetShape( this.body, this.geometry )*/
		}

		

	}

}