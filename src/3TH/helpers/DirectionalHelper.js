import {
	DirectionalLightHelper, PlaneGeometry, Mesh, MeshBasicMaterial, CameraHelper, Color
} from 'three';


class DirectionalHelper extends DirectionalLightHelper {

	constructor( light, size, color ) {

		size = size || 1

		super( light, size, color );

		let g = new PlaneGeometry( size*2, size*2 )
		let m = new MeshBasicMaterial( { color: this.light.color, fog: false, toneMapped: false } );

		this.m2 = new Mesh( g, m )

		this.shadow = new CameraHelper( light.shadow.camera )
		this.shadow.setColors( light.color, new Color( 0x222222 ), new Color( 0x222222 ), light.color, new Color( 0x666666) )

		this.children[ 0 ].add( this.m2 );

	}

	dispose() {
		super.dispose()
		if(this.m2){
			this.m2.geometry.dispose();
			this.m2.material.dispose();
		}
	}

	update() {

		super.update()
		if(this.m2) this.m2.material.color.copy( this.light.color )

	}

}

export { DirectionalHelper };