import { Item } from '../core/Item.js';
import { Utils, root } from './root.js';

// BOX3D TERRAIN
const toQuat = Utils.toQuat
const toVec = Utils.toVec


export class Terrain extends Item {

	constructor() {

		super()

		this.type = 'terrain'
		this.Utils = Utils

	}

	add ( o ) {

		let name = this.setName( o )
		const size = o.size;
		const sample = o.sample;
		const squarSize = [ size[0] / (sample[0]-1), size[2] / (sample[1]-1) ];

		// 1--CREATE BODY

		const bodyDef = b3.b3DefaultBodyDef();
		bodyDef.type = b3.b3BodyType.b3_staticBody;

		let b = b3.b3CreateBody(root.world, bodyDef);


		let scale = 

		b.type = 'terrain';
		b.name = name;
		b.mass = 0;
		b.sample = sample;
		b.scale = toVec([squarSize[0], size[1], squarSize[1]]);

		// 2--CREATE SHAPE CONFIG
		const sd = b3.b3DefaultShapeDef()
		sd.baseMaterial.friction = o.friction !== undefined ? o.friction : 0.5;
	    sd.baseMaterial.restitution = o.restitution !== undefined ? o.restitution : 0.0; 

	    // todo add filter

	    b.sd = sd

	    // 3--CREATE HEIGHFIELD
	    this.setData(b, o)
	    



		// 4--POSITION
		let p = o.pos || [0,0,0]
		p[0]-=size[0]*0.5
		p[2]-=size[2]*0.5
		let q = o.quat || [0,0,0,1]
		b3.b3Body_SetTransform( b, toVec(p), toQuat(q) );

		//console.log('is terrain !!', scale, sample)

		// 5--ADD TO WORLD 
		this.addToWorld( b, o.id )

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return
		
	    if( o.heightData ){

			this.setData( b, o );

		}

	}

	setData ( b, o ) {

		if(b.shape){ 
			b3.b3DestroyShape(b.shape, false)
			//b.HeightFieldData.delete();
			b3.b3DestroyHeightField(b.HeightFieldData)
		}

		b.HeightFieldData = b3.b3CreateHeightField( o.heightData, b.sample[0], b.sample[1], b.scale ) 
		b.shape = b3.b3CreateHeightFieldShape( b, b.sd, b.HeightFieldData );

	}

	dispose(b){

		b3.b3DestroyShape(b.shape, false)
		b3.b3DestroyHeightField(b.HeightFieldData)
		
	}


}