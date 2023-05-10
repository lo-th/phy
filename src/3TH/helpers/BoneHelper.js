
import {
	LineSegments, BufferGeometry, Float32BufferAttribute, LineBasicMaterial
} from 'three';

class BoneHelper extends LineSegments {

	constructor( size = 1 ) {

		//const indices = new Uint16Array( [ 0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ] );
		////const indices = new Uint16Array( [ 0, 0, 0,	0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,	0, 0, 0, 
		//	0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7 ] );

		const vertices = [
			0, 0, 0,	size, 0, 0,
			0, 0, 0,	0, size, 0,
			0, 0, 0,	0, 0, size
		];

		const colors = [
			1, 0, 0,	1, 0, 0,
			0, 1, 0,	0, 1, 0,
			0, 0, 1,	0, 0, 1
		];

		var s = size*0.2;

		var min = {x:-s, y:-s, z:-s}
		var max = {x:s, y:s, z:s}

		for( var i = 0; i<8; i++ ){

			if( i===0 ) vertices.push( max.x, max.y, max.z )
			if( i===1 ) vertices.push( min.x, max.y, max.z )
			if( i===2 ) vertices.push( min.x, min.y, max.z )
			if( i===3 ) vertices.push( max.x, min.y, max.z )
			if( i===4 ) vertices.push( max.x, max.y, min.z )
			if( i===5 ) vertices.push( min.x, max.y, min.z )
			if( i===6 ) vertices.push( min.x, min.y, min.z )
			if( i===7 ) vertices.push( max.x, min.y, min.z )

			colors.push( 1,1,0 );

		}

		for( i = 0; i<8; i++ ){

			if( i===0 ) vertices.push( max.x, max.y, max.z )
			if( i===1 ) vertices.push( max.x, max.y, min.z )
			if( i===2 ) vertices.push( min.x, max.y, max.z )
			if( i===3 ) vertices.push( min.x, max.y, min.z )

			if( i===4 ) vertices.push( min.x, min.y, max.z )
			if( i===5 ) vertices.push( min.x, min.y, min.z )
			if( i===6 ) vertices.push( max.x, min.y, max.z )
			if( i===7 ) vertices.push( max.x, min.y, min.z )

			colors.push( 1,1,0 );

		}

		for( i = 0; i<8; i++ ){

			if( i===0 ) vertices.push( max.x, max.y, max.z )
			if( i===2 ) vertices.push( max.x, max.y, min.z )
			if( i===1 ) vertices.push( max.x, min.y, max.z )
			if( i===3 ) vertices.push( max.x, min.y, min.z )

			if( i===5 ) vertices.push( min.x, max.y, max.z )
			if( i===7 ) vertices.push( min.x, max.y, min.z )
			if( i===4 ) vertices.push( min.x, min.y, max.z )
			if( i===6 ) vertices.push( min.x, min.y, min.z )

			

			colors.push( 1,1,0 );

		}


		const geometry = new BufferGeometry();
		//geometry.setIndex( new THREE.BufferAttribute( indices, 1 ) );
		geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		const material = new LineBasicMaterial( { vertexColors: true, depthTest: false, depthWrite: false, toneMapped: false, transparent: true } );

		super( geometry, material );

		this.type = 'BoneHelper';

	}

}


export { BoneHelper };