import {
	Quaternion,
	Vector3,
	Matrix4,
	Euler,
	Matrix3,
	Layers,
	EventDispatcher,
	MathUtils,
	Mesh,
} from 'three';


let _object3DId = 0;

const _v1 = new Vector3();
const _q1 = new Quaternion();
const _m1 = new Matrix4();
const _target = new Vector3();

const _position = new Vector3();
const _scale = new Vector3();
const _quaternion = new Quaternion();

const _xAxis = new Vector3( 1, 0, 0 );
const _yAxis = new Vector3( 0, 1, 0 );
const _zAxis = new Vector3( 0, 0, 1 );

const _addedEvent = { type: 'added' };
const _removedEvent = { type: 'removed' };

class Basic3D extends EventDispatcher {

	constructor() {

		super();

		this.isObject3D = true;

		Object.defineProperty( this, 'id', { value: _object3DId ++ } );
		this.uuid = MathUtils.generateUUID();
		
	    this.isRay = true;
	    this.matrix = new Matrix4();
	    this.matrixWorld = new Matrix4();
		
		this.name = '';
		this.type = 'Object3D';

		this.children = []
		this.parent = null;
		
		
		this.position = new Vector3();
		this.quaternion = new Quaternion();
		this.tmpRotation = new Euler();
		this.scale = new Vector3( 1, 1, 1 );

		this.isKinematic = false;
		
		this.matrixAutoUpdate = false;
		this.matrixWorldNeedsUpdate = false;

		this.layers = new Layers();
		this.visible = true;
		this.isVisible = true;

		//this.castShadow = false;
		//this.receiveShadow = false;

		this.frustumCulled = true;
		this.renderOrder = 0;

		//this.animations = [];

		this.userData = {};

		this.mass = 0;
		this.density = 0;
		// TODO 
		this.inertia = new Vector3(1, 1, 1);

		
		this.shapetype = 'box'
		this.size = [1,1,1]
		//this.data = {}
		//this._size = new Vector3(1,1,1)
		this.velocity = new Vector3();
		this.angular = new Vector3();
		
		this.defMat = false;
		this.actif = false;
		this.auto = false;
		this.sleep = false;

		// only for high mesh
		this.mesh = null;
		this.meshSize = 1;

		// if object is link by joint
		this.linked = [];

		this.isOver = false;
		this.overMaterial = null;

	}

	// ADD

	clearOutLine() {

		if( !this.overMaterial ) return;
		if( !this.outline ) return;
		this.remove(this.outline);
		this.outline = null;

	}

	addOutLine() {

		if( !this.overMaterial ) return;
		if( !this.children[0].isMesh ) return;

		//console.log(this.children[0])
		//
		let s = 0.01
		/*if(this.children[0].geometry.boundingBox){
			let tt = new Vector3()
			this.children[0].geometry.boundingBox.getSize(tt);
			s = tt.length() * 0.01
		}*/
		//this.children[0].geometry.boundingBox.getSize(tt);
		//let gSize = tt.length() * 0.5
		//let mScale = this.children[0].scale.length() * 0.5
		//console.log( mScale)

		this.outline = new Mesh().copy( this.children[0] );
		//this.outline.geometry.computeVertexNormals()
		//this.outline.geometry.normalizeNormals()
		this.outline.name = "outline";
		this.outline.material = this.overMaterial;
		//if( this.shapetype==='sphere' ) this.meshSize = 0.5
		if(this.overMaterial.uniforms.power)this.overMaterial.uniforms.power.value = s / this.meshSize;
		this.outline.matrixAutoUpdate = false;
		this.outline.receiveShadow = false;
		this.outline.castShadow = false;
		this.outline.raycast = () => ( false );
		this.add( this.outline );

	}

	over ( b ) {

		if( b && !this.isOver ){ 

            this.isOver = true;
            this.addOutLine();

        }

        if( !b && this.isOver ){ 

            this.isOver = false;
            this.clearOutLine();

        }

		//if(b) this.addOutLine();
		//else this.clearOutLine();

    }

	select ( b ) {

		//console.log(b)

    }

    dispose () {

    	this.clearOutLine();
    	this.traverse( function ( node ) {
			if( node.isMesh && node.unic ) node.geometry.dispose();
		})

		this.children = [];

    }

	/*set size( value ){
		this._size.fromArray( value )
	}

	get size(){
		return this._size.toArray()
	}*/

	set receiveShadow( value ){
		this.traverse( function ( node ) {
			if( node.isMesh ) node.receiveShadow = value;
		})
	}

	get receiveShadow(){
		if( this.children[0] ) return this.children[0].receiveShadow;
		else return false
	}

	set castShadow( value ){
		this.traverse( function ( node ) {
			if( node.isMesh ) node.castShadow = value;
		})
	}

	get castShadow(){
		if( this.children[0] ) return this.children[0].castShadow;
		else return false
	}

	set material( value ){
		this.traverse( function ( node ) {
			if( node.isMesh ){ 
				if( node.name !== 'outline' ) node.material = value;
			}
		})
	}

	get material(){
		const children = this.children;
		if( this.children[0] ) return this.children[0].material;
		else return null;
	}

    set rotation( v ){
    	this.tmpRotation = v;
		quaternion.setFromEuler( this.tmpRotation, false );
	}

	get rotation(){
		return this.tmpRotation.setFromQuaternion( this.quaternion, undefined, false );
	}

    //////


	onBeforeRender( /* renderer, scene, camera, geometry, material, group */ ) {}

	onAfterRender( /* renderer, scene, camera, geometry, material, group */ ) {}

	applyMatrix4( matrix ) {

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		this.matrix.premultiply( matrix );

		this.matrix.decompose( this.position, this.quaternion, this.scale );

	}

	applyQuaternion( q ) {

		this.quaternion.premultiply( q );

		return this;

	}

	setRotationFromAxisAngle( axis, angle ) {

		// assumes axis is normalized

		this.quaternion.setFromAxisAngle( axis, angle );

	}

	setRotationFromEuler( euler ) {

		this.quaternion.setFromEuler( euler, true );

	}

	setRotationFromMatrix( m ) {

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		this.quaternion.setFromRotationMatrix( m );

	}

	setRotationFromQuaternion( q ) {

		// assumes q is normalized

		this.quaternion.copy( q );

	}

	rotateOnAxis( axis, angle ) {

		// rotate object on axis in object space
		// axis is assumed to be normalized

		_q1.setFromAxisAngle( axis, angle );

		this.quaternion.multiply( _q1 );

		return this;

	}

	rotateOnWorldAxis( axis, angle ) {

		// rotate object on axis in world space
		// axis is assumed to be normalized
		// method assumes no rotated parent

		_q1.setFromAxisAngle( axis, angle );

		this.quaternion.premultiply( _q1 );

		return this;

	}

	rotateX( angle ) {

		return this.rotateOnAxis( _xAxis, angle );

	}

	rotateY( angle ) {

		return this.rotateOnAxis( _yAxis, angle );

	}

	rotateZ( angle ) {

		return this.rotateOnAxis( _zAxis, angle );

	}

	translateOnAxis( axis, distance ) {

		// translate object by distance along axis in object space
		// axis is assumed to be normalized

		_v1.copy( axis ).applyQuaternion( this.quaternion );

		this.position.add( _v1.multiplyScalar( distance ) );

		return this;

	}

	translateX( distance ) {

		return this.translateOnAxis( _xAxis, distance );

	}

	translateY( distance ) {

		return this.translateOnAxis( _yAxis, distance );

	}

	translateZ( distance ) {

		return this.translateOnAxis( _zAxis, distance );

	}

	localToWorld( vector ) {

		return vector.applyMatrix4( this.matrixWorld );

	}

	worldToLocal( vector ) {

		return vector.applyMatrix4( _m1.copy( this.matrixWorld ).invert() );

	}

	lookAt( x, y, z ) {

		// This method does not support objects having non-uniformly-scaled parent(s)

		if ( x.isVector3 ) {

			_target.copy( x );

		} else {

			_target.set( x, y, z );

		}

		const parent = this.parent;

		this.updateWorldMatrix( true, false );

		_position.setFromMatrixPosition( this.matrixWorld );

		if ( this.isCamera || this.isLight ) {

			_m1.lookAt( _position, _target, this.up );

		} else {

			_m1.lookAt( _target, _position, this.up );

		}

		this.quaternion.setFromRotationMatrix( _m1 );

		if ( parent ) {

			_m1.extractRotation( parent.matrixWorld );
			_q1.setFromRotationMatrix( _m1 );
			this.quaternion.premultiply( _q1.invert() );

		}

	}

	add( object ) {

		if ( arguments.length > 1 ) {

			for ( let i = 0; i < arguments.length; i ++ ) {

				this.add( arguments[ i ] );

			}

			return this;

		}

		if ( object === this ) {

			console.error( 'THREE.Object3D.add: object can\'t be added as a child of itself.', object );
			return this;

		}

		if ( object && object.isObject3D ) {

			if ( object.parent !== null ) {

				object.parent.remove( object );

			}

			object.parent = this;
			this.children.push( object );

			object.dispatchEvent( _addedEvent );

		} else {

			console.error( 'THREE.Object3D.add: object not an instance of THREE.Object3D.', object );

		}

		return this;

	}

	remove( object ) {

		if ( arguments.length > 1 ) {

			for ( let i = 0; i < arguments.length; i ++ ) {

				this.remove( arguments[ i ] );

			}

			return this;

		}

		const index = this.children.indexOf( object );

		if ( index !== - 1 ) {

			object.parent = null;
			this.children.splice( index, 1 );

			object.dispatchEvent( _removedEvent );

		}

		return this;

	}

	removeFromParent() {

		const parent = this.parent;

		if ( parent !== null ) {

			parent.remove( this );

		}

		return this;

	}

	clear() {

		const children = this.children;
		let i = children.length

		while( i-- ){
		//for ( let i = 0; i < this.children.length; i ++ ) {

			const object = children[ i ];
			object.parent = null;
			object.dispatchEvent( _removedEvent );

		}

		this.children.length = 0;

		return this;


	}

	attach( object ) {

		// adds object as a child of this, while maintaining the object's world transform
		// Note: This method does not support scene graphs having non-uniformly-scaled nodes(s)

		this.updateWorldMatrix( true, false );

		_m1.copy( this.matrixWorld ).invert();

		if ( object.parent !== null ) {

			object.parent.updateWorldMatrix( true, false );

			_m1.multiply( object.parent.matrixWorld );

		}

		object.applyMatrix4( _m1 );

		this.add( object );

		object.updateWorldMatrix( false, true );

		return this;

	}

	getObjectById( id ) {

		return this.getObjectByProperty( 'id', id );

	}

	getObjectByName( name ) {

		return this.getObjectByProperty( 'name', name );

	}

	getObjectByProperty( name, value ) {

		if ( this[ name ] === value ) return this;

		const children = this.children;
		let i = children.length

		while( i-- ){
		//for ( let i = 0, l = this.children.length; i < l; i ++ ) {

			const child = children[ i ];
			const object = child.getObjectByProperty( name, value );

			if ( object !== undefined ) {

				return object;

			}

		}

		return undefined;

	}

	getWorldPosition( target ) {

		this.updateWorldMatrix( true, false );

		return target.setFromMatrixPosition( this.matrixWorld );

	}

	getWorldQuaternion( target ) {

		this.updateWorldMatrix( true, false );

		this.matrixWorld.decompose( _position, target, _scale );

		return target;

	}

	getWorldScale( target ) {

		this.updateWorldMatrix( true, false );

		this.matrixWorld.decompose( _position, _quaternion, target );

		return target;

	}

	getWorldDirection( target ) {

		this.updateWorldMatrix( true, false );

		const e = this.matrixWorld.elements;

		return target.set( e[ 8 ], e[ 9 ], e[ 10 ] ).normalize();

	}

	setRaycast(v){
		if( v !== undefined ) this.isRay = v
		if(!this.isRay){
			let i =  this.children.length
			while( i-- ) {
				let j =  this.children[i].children.length;
				while( j-- ) this.children[i].children[j].raycast = () => {} 
				this.children[i].raycast = () => {}
			}
		}
	}

	// direct raycast avoid recursive !!
	raycast( raycaster, intersects ) {

		if( !this.isRay ) return

		const children = this.children;
		let i = children.length

		while( i-- ){

			if ( children[i].layers.test( raycaster.layers ) ) {

				children[i].raycast( raycaster, intersects );

			}

		}
	}

	traverse( callback ) {

		callback( this );

		const children = this.children;
		let i = children.length

		//for ( let i = 0, l = children.length; i < l; i ++ ) {
		while( i-- ){

			children[ i ].traverse( callback );

		}

	}

	traverseVisible( callback ) {

		if ( this.visible === false ) return;

		callback( this );

		const children = this.children;
		let i = children.length

		//for ( let i = 0, l = children.length; i < l; i ++ ) {
		while( i-- ){

			children[ i ].traverseVisible( callback );

		}

	}

	traverseAncestors( callback ) {

		const parent = this.parent;

		if ( parent !== null ) {

			callback( parent );

			parent.traverseAncestors( callback );

		}

	}

	/*setTransform( p, q, s ) {

		this.position.fromArray( p )
		this.quaternion.fromArray( q )

		this.matrix.copy( m );
		this.matrix.decompose( this.position, this.quaternion, this.scale );
		this.matrixWorldNeedsUpdate = true;

	}

	setColor( color ) {

		if( this.isInstance ){
		    this.instance.setColorAt( this.instanceId, color );
		}
		
	}

	updateMatrix() {

		this.matrix.compose( this.position, this.quaternion, this.scale );
	    this.matrixWorldNeedsUpdate = true;

		if( this.isInstance ) {
			this.instance.setTransformAt( this.instanceId, this.position.toArray(), this.quaternion.toArray(), this.size )
			return;
		} else {
			
		}

		

		//if( this.isInstance ) this.instance.setMatrixAt( this.instanceId, this.matrix );
		//else this.matrixWorldNeedsUpdate = true;

	}*/

	updateMatrix() {

		this.matrix.compose( this.position, this.quaternion, this.scale );
		this.matrixWorldNeedsUpdate = true;

	}

	updateMatrixWorld( force ) {

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.matrixWorldNeedsUpdate || force ) {

			if ( this.parent === null ) {

				this.matrixWorld.copy( this.matrix );

			} else {

				this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

			}

			this.matrixWorldNeedsUpdate = false;

			force = true;

		}

		// update children

		const children = this.children;
		let i = children.length

		while( i-- ){
		//for ( let i = 0, l = children.length; i < l; i ++ ) {
			children[ i ].updateMatrixWorld( force );

		}

	}

	updateWorldMatrix( updateParents, updateChildren ) {

		const parent = this.parent;

		if ( updateParents === true && parent !== null ) {

			parent.updateWorldMatrix( true, false );

		}

		if ( this.matrixAutoUpdate ) this.updateMatrix();

		if ( this.parent === null ) {

			this.matrixWorld.copy( this.matrix );

		} else {

			this.matrixWorld.multiplyMatrices( this.parent.matrixWorld, this.matrix );

		}

		// update children

		if ( updateChildren === true ) {

			const children = this.children;
			let i = children.length

			while( i-- ){
			//for ( let i = 0, l = children.length; i < l; i ++ ) {
				children[ i ].updateWorldMatrix( false, true );

			}

		}

	}

}

//Object3D.DefaultUp = new Vector3( 0, 1, 0 );
//Object3D.DefaultMatrixAutoUpdate = true;

export { Basic3D };
