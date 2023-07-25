import { Float32BufferAttribute, BufferGeometry } from 'three';


export class CapsuleHelperGeometry extends BufferGeometry {

	constructor( r, h ) {

		super();

		//this.light = light;

		//this.matrix = light.matrixWorld;
		

		//this.color = color;

		this.type = 'CapsuleHelperGeometry';

		//const geometry = new BufferGeometry();

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

		this.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		this.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		//const material = new LineBasicMaterial( { color:0x00ff00, fog: false, toneMapped: false } );

		/*this.cone = new LineSegments( geometry, material );
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
		this.add( this.direction );*/

	}

}

