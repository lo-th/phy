import { Vector3, Object3D, LineSegments, LineBasicMaterial, Float32BufferAttribute, BufferGeometry } from 'three';



const _vector = /*@__PURE__*/ new Vector3();

class CapsuleHelper extends Object3D {

	constructor( r, h, useDir, material ) {

		super();

		//this.light = light;

		//this.matrix = light.matrixWorld;
		this.matrixAutoUpdate = false;

		//this.color = color;

		this.type = 'SpotLightHelper';

		const geometry = new BufferGeometry();

		let py = (h*0.5)-r
		let side = 32
		let dir = r*0.2

		const positions = [
		    r, py, 0 ,   r, -py, 0,
		    -r, py, 0 ,   -r, -py, 0,
		    0, py, r-dir ,   0, py, r+dir,
		];

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			positions.push(
				r*Math.cos( p1 ), py, r*Math.sin( p1 ),
				r*Math.cos( p2 ), py, r*Math.sin( p2 ),

				r*Math.cos( p1 ), -py, r*Math.sin( p1 ),
				r*Math.cos( p2 ), -py, r*Math.sin( p2 ),
			);

		}

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			let s = j <= side*0.5 ? 1 : -1 

			positions.push(
				r*Math.cos( p1 ), py*s + r*Math.sin( p1 ),0,
				r*Math.cos( p2 ), py*s + r*Math.sin( p2 ),0,
			);

		}

		let colors = []
		let cc = positions.length/3
		while(cc--){
			colors.push(0,1,0)
		}

		geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		//const material = new LineBasicMaterial( { color:0x00ff00, fog: false, toneMapped: false } );

		this.cone = new LineSegments( geometry, material );
		this.cone.raycast = function(){return}
		this.add( this.cone );

		if(!useDir) return

		const geometry2 = new BufferGeometry();

		const positions2 = [
		    dir*0.5, -py, r-dir ,   dir*0.5, -py, r+dir,
		    -dir*0.5, -py, r-dir ,   -dir*0.5, -py, r+dir,
		    dir*0.5, -py, r-dir,  -dir*0.5, -py, r-dir,

		    -dir*0.5, -py, r+dir , -dir, -py, r+dir ,
		    dir*0.5, -py, r+dir , dir, -py, r+dir ,

		    -dir, -py, r+dir , 0, -py, r+dir*2 ,
		    dir, -py, r+dir , 0, -py, r+dir*2 ,
		];

		colors = []
		cc = positions2.length/3
		while(cc--){
			colors.push(1,0,0)
		}

		geometry2.setAttribute( 'position', new Float32BufferAttribute( positions2, 3 ) );
		geometry2.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		//const material2 = new LineBasicMaterial( { color:0xFF0000, fog: false, toneMapped: false } );

		this.direction = new LineSegments( geometry2, material );
		this.direction.raycast = function(){return}
		this.add( this.direction );

	}

	setDirection(r) {

		if(!this.direction) return
		this.direction.rotation.y = r

	}

	dispose() {

		this.cone.geometry.dispose();
		//this.cone.material.dispose();

		if(this.direction){
			this.direction.geometry.dispose();
			//this.direction.material.dispose();
		}

	}

	raycast(){
		return 
	}

	update() {

		/*this.light.updateWorldMatrix( true, false );
		this.light.target.updateWorldMatrix( true, false );

		const coneLength = this.light.distance ? this.light.distance : 1000;
		const coneWidth = coneLength * Math.tan( this.light.angle );

		this.cone.scale.set( coneWidth, coneWidth, coneLength );

		_vector.setFromMatrixPosition( this.light.target.matrixWorld );

		this.cone.lookAt( _vector );*/

		/*if ( this.color !== undefined ) {

			this.cone.material.color.set( this.color );

		} else {

			this.cone.material.color.copy( this.light.color );

		}*/

	}

}


export { CapsuleHelper };
