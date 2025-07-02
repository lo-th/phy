import {
	LineSegments, LineBasicMaterial, BufferAttribute, Float32BufferAttribute, BufferGeometry
} from 'three';

class CircleHelper extends LineSegments {

	constructor( box, color = 0xffff00 ) {

		let size=0.6

		const indices = new Uint16Array( [ 
			0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 0,   
			6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 6,
			12, 13, 13, 14, 14, 15, 15, 16, 16, 17, 17, 12,
			18,19, 20,21, 22, 23,
			] );
		//const indices = new Uint16Array( [ 0, 0, 1, 1, 2, 2, 3, 3, 4, 4 ,5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11 ] );
		{
		   
		}
		const positions = [

		

		 0.5, 0.0, 0.0,
		0.25, 0.433, 0.0,
		-0.25, 0.433, 0.0,
		-0.5, 0.0, 0.0,
		-0.25, -0.433, 0.0,
		0.25, -0.433, 0.0, 

		 0.5, 0.0,0.0, 
		0.25,  0.0,0.433,
		-0.25,  0.0,0.433,
		-0.5, 0.0, 0.0,
		-0.25,0.0, -0.433, 
		0.25, 0.0, -0.433, 

		0.0,0.5, 0.0,
		0.0,0.25, 0.433, 
		0.0,-0.25, 0.433, 
		0.0,-0.5, 0.0, 
		0.0,-0.25, -0.433, 
		0.0,0.25, -0.433, 

		0, 0, 0,	size, 0, 0,
		0, 0, 0,	0, size, 0,
		0, 0, 0,	0, 0, size,

		
		];

		const colors = [

		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		0, 0, 1,
		
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,
		0, 1, 0,

        1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,
		1, 0, 0,

		1, 0, 0,	1, 0, 0,
		0, 1, 0,	0, 1, 0,
		0, 0, 1,	0, 0, 1,

		];

		const geometry = new BufferGeometry();

		geometry.setIndex( new BufferAttribute( indices, 1 ) );

		geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		super( geometry, new LineBasicMaterial( { color: color, depthTest: false, depthWrite: false, toneMapped: false, transparent: true } ) );

		this.box = box;

		this.type = 'CircleHelper';

		this.geometry.computeBoundingSphere();

	}

	updateMatrixWorld( force ) {

		const box = this.box;

		if ( box.isEmpty() ) return;

		box.getCenter( this.position );

		box.getSize( this.scale );

		this.scale.multiplyScalar( 0.5 );

		super.updateMatrixWorld( force );

	}

	dispose() {

		this.geometry.dispose();
		this.material.dispose();

	}

}

export { CircleHelper };