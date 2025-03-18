import {
	LineSegments, LineBasicMaterial, BufferAttribute, Float32BufferAttribute, BufferGeometry
} from 'three';

class Helper extends LineSegments {

	constructor( data = {}, material ) {
		const geometry = new BufferGeometry();
		super( geometry, material );

		this.position = []
		this.color = []



		geometry.setAttribute( 'position', new Float32BufferAttribute( this.position, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( this.color, 3 ) );
	}

	draw(){

		this.geometry.computeBoundingSphere();

	}

	makeSvg() {

		this.svg = document.createElementNS( "http://www.w3.org/2000/svg", 'svg' );

	}

	setSvg ( type, value, id, id2 ){

        if( id === -1 ) this.svg.setAttributeNS( null, type, value );
        else if( id2 !== undefined ) this.svg.childNodes[ id || 0 ].childNodes[ id2 || 0 ].setAttributeNS( null, type, value );
        else this.svg.childNodes[ id || 0 ].setAttributeNS( null, type, value );

    },

	dispose() {
		this.geometry.dispose();
	}

}