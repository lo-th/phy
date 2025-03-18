import * as SkeletonUtils from '../../jsm/utils/SkeletonUtils.js';
import { SkeletonBody } from './SkeletonBody.js';
import { root, Utils } from '../root.js';

export class AutoRagdoll {
	
	constructor( o = {} ){

		this.id = 0;
		this.type = 'autoRagdoll';
		this.name = o.name || this.type+this.id++;

		let b = Utils.byName( this.name );
		if( b ) Utils.remove( b )

		//this.isAutoRagdoll = true;

		this._mode = o.mode || 'follow';
		this._size = o.size || 1;
		this._debug = o.debug || false;

		const model = SkeletonUtils.clone( o.model );
		model.scale.set(1,1,1).multiplyScalar( this._size );
		if(o.pos) model.position.fromArray(o.pos);

		model.raycast = function (){ return }
		model.name = this.name;
		//model.frustumCulled = false;

		let bones;

		model.traverse( ( child ) => {
			if ( child.isMesh ){
				child.frustumCulled = false;
			}
			if ( child.isSkinnedMesh ){
				child.raycast = function (){ return }
				child.frustumCulled = false;
				child.matrixAutoUpdate = false;
				child.receiveShadow = true;
				child.castShadow = true;
				if( o.material ) child.material = o.material;
				child.skeleton.resetScalling();
				bones = child.skeleton.bones;
			}
		})

		let mass = o.mass || null
		
		this.skeletonBody = new SkeletonBody( model.name, model, bones, mass, o.option );

		this.debug = this._debug;
		this.mode = this._mode;

		/*this.skeletonBody.addEventListener ( 'start', function ( event ) {
			console.log( event.message );
		});*/



		/* 
		// basic three helper
		let helper = new SkeletonHelper( m );
		helper.raycast = function (){ return }
        helper.matrix = m.matrix;
        root.scene.add( helper );
        */

		model.add( this.skeletonBody );
		root.scene.add( model );

		this.model = model;

		//map.set( this.name, this );
		Utils.add( this )

		return this;

	}

	getRealPosition() {
		let node = Utils.byName( this.skeletonBody.nodes[0].name );
		return node.position;
	}

	dispose () {

		if( this.skeletonBody ) this.skeletonBody.dispose()
		if( this.model ) this.model.parent.remove( this.model )

	}

	//

	get position () { return model.position; }

	get size () { return this._size; }
	set size (value) {
		this._size = value;
		this.model.scale.set(1,1,1).multiplyScalar( this._size );
	}

	//

	get debug () { return this._debug; }
	set debug (value) {
		this._debug = value;
		this.skeletonBody.isVisible( this._debug );
	}

	get mode () { return this._mode; }
	set mode (value) {
		this._mode = value;
		this.skeletonBody.setMode( this._mode );
	}



}