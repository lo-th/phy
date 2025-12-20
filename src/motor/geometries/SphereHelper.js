import { Box3, LineSegments, LineBasicMaterial, Float32BufferAttribute, BufferGeometry } from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';


const _box = /*@__PURE__*/ new Box3();

/**
 * Helper object to graphically show the world-axis-aligned bounding box
 * around an object. The actual bounding box is handled with {@link Box3},
 * this is just a visual helper for debugging. It can be automatically
 * resized with {@link BoxHelper#update} when the object it's created from
 * is transformed. Note that the object must have a geometry for this to work,
 * so it won't work with sprites.
 *
 * ```js
 * const sphere = new THREE.SphereGeometry();
 * const object = new THREE.Mesh( sphere, new THREE.MeshBasicMaterial( 0xff0000 ) );
 * const box = new THREE.BoxHelper( object, 0xffff00 );
 * scene.add( box );
 * ```
 *
 * @augments LineSegments
 */
class SphereHelper extends LineSegments {

	/**
	 * Constructs a new box helper.
	 *
	 * @param {Object3D} [object] - The 3D object to show the world-axis-aligned bounding box.
	 * @param {number|Color|string} [color=0xffff00] - The box's color.
	 */
	constructor( material, c1 = [0,1,0] ) {

		//const indices = new Uint16Array( [ 0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ] );
		const positions = []//new Float32Array( 8 * 3 );
		const colors = []//new Float32Array( 8 * 3 );

		let side = 12
		let r = 1

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			positions.push(
				r*Math.cos( p1 ), 0, r*Math.sin( p1 ),
				r*Math.cos( p2 ), 0, r*Math.sin( p2 ),

				r*Math.cos( p1 ), 0, r*Math.sin( p1 ),
				r*Math.cos( p2 ), 0, r*Math.sin( p2 ),
			);

			colors.push(
				...c1,...c1,
				...c1,...c1,
			)

		}

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			positions.push(
				r*Math.cos( p1 ), r*Math.sin( p1 ), 0,
				r*Math.cos( p2 ), r*Math.sin( p2 ), 0,

				r*Math.cos( p1 ), r*Math.sin( p1 ), 0,
				r*Math.cos( p2 ), r*Math.sin( p2 ), 0,
			);

			colors.push(
				...c1,...c1,
				...c1,...c1,
			)

		}

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			positions.push(
				0,r*Math.cos( p1 ), r*Math.sin( p1 ),
				0,r*Math.cos( p2 ), r*Math.sin( p2 ),

				0,r*Math.cos( p1 ), r*Math.sin( p1 ),
				0,r*Math.cos( p2 ), r*Math.sin( p2 ),
			);

			colors.push(
				...c1,...c1,
				...c1,...c1,
			)

		}

		const geometry = new BufferGeometry();
		//geometry.setIndex( new BufferAttribute( indices, 1 ) );
		geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		//geometry = mergeVertices( geometry );

		super( geometry, material );

		/**
		 * The 3D object being visualized.
		 *
		 * @type {Object3D}
		 */
		//this.object = object;
		this.type = 'SphereHelper';
		this.isOver = false
		this.colorsbase = [...geometry.attributes.color.array]
		this.colors = geometry.attributes.color.array;

		this.matrixAutoUpdate = false;

	}

	over(b){

		if(b){
			if(!this.isOver){
				this.isOver = true;
				this.setColor(this.isOver)
			}
		}else{
			if(this.isOver){
				this.isOver = false;
				this.setColor(this.isOver)
		    }
		}

	}

	setColor(b) {

		let i = this.colors.length;
		while(i--) this.colors[i] = b ? 1 : this.colorsbase[i];
		if( this.geometry ) this.geometry.attributes.color.needsUpdate = true;

	}

	copy( source, recursive ) {

		super.copy( source, recursive );

		this.object = source.object;

		return this;

	}

	/**
	 * Frees the GPU-related resources allocated by this instance. Call this
	 * method whenever this instance is no longer used in your app.
	 */
	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

	raycast(){
		return false
	}

}


export { SphereHelper };
