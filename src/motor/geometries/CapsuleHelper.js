import { Vector3, Object3D, LineSegments, LineBasicMaterial, Float32BufferAttribute, BufferGeometry } from 'three';



const _vector = /*@__PURE__*/ new Vector3();

class CapsuleHelper extends Object3D {

	

	constructor( r, h, useDir, material, c1 = [0,1,0], c2 = [0,0.5,0], full = false ) {

		

		super();
		// TODO bug with hero skeleton !! create new CapsuleHelper on over ??
		if(!r) return
		if(!h) return

		

		const geometry = new BufferGeometry();

		let py = (h*0.5)-r
		let side = 12//32;
		let dir = r*0.2


		let colors = [];

		const positions = [
		    r, py, 0 ,   r, -py, 0,
		    -r, py, 0 ,   -r, -py, 0,
		    0, py, r-dir ,   0, py, r+dir,
		];



		//console.log( r )

		colors.push(
			...c1,...c2,
			...c1,...c2,
			...c2,...c2
		)

		if(full){ 
			positions.push(
				0, py, r, 0, -py, r,
				0, py, -r, 0, -py, -r 
			);
			colors.push(
				...c1,...c2,
				...c1,...c2,
			)
		}


		// circle top / bottom

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			positions.push(
				r*Math.cos( p1 ), py, r*Math.sin( p1 ),
				r*Math.cos( p2 ), py, r*Math.sin( p2 ),

				r*Math.cos( p1 ), -py, r*Math.sin( p1 ),
				r*Math.cos( p2 ), -py, r*Math.sin( p2 ),
			);

			colors.push(
				...c1,...c1,
				...c2,...c2,
			)

		}

		// circle start / end

		for ( let i = 0, j = 1; i < side; i ++, j ++ ) {

			const p1 = ( i / side ) * Math.PI * 2;
			const p2 = ( j / side ) * Math.PI * 2;

			let s = j <= side*0.5 ? 1 : -1 

			positions.push(
				r*Math.cos( p1 ), py*s + r*Math.sin( p1 ),0,
				r*Math.cos( p2 ), py*s + r*Math.sin( p2 ),0,
			);

			if(s===1) colors.push( ...c1,...c1 )
			else colors.push( ...c2,...c2 )

			if(full){
				positions.push(
					0, py*s + r*Math.sin( p1 ),r*Math.cos( p1 ),
					0, py*s + r*Math.sin( p2 ),r*Math.cos( p2 ),
				);
				if(s===1) colors.push( ...c1,...c1 )
			    else colors.push( ...c2,...c2 )
			}

		}

		//console.log( positions )

		geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );

		geometry.computeBoundingSphere()

		this.colors = geometry.attributes.color.array;
		this.colorsbase = [...this.colors]
		this.geometry = geometry;

		//const material = new LineBasicMaterial( { color:0x00ff00, fog: false, toneMapped: false } );


		
		this.cone = new LineSegments( geometry, material );
		this.cone.raycast = function(){return false }
		this.cone.updateMorphTargets = ()=>{}
		this.cone.name = 'cone'
		this.add( this.cone );

		this.isOver = false;
		this.matrixAutoUpdate = false;
		this.type = 'CapsuleHelper';

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
		let cc = positions2.length/3
		while(cc--){
			colors.push(1,0,0)
		}

		geometry2.setAttribute( 'position', new Float32BufferAttribute( positions2, 3 ) );
		geometry2.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );



		//const material2 = new LineBasicMaterial( { color:0xFF0000, fog: false, toneMapped: false } );

		this.direction = new LineSegments( geometry2, material );
		this.direction.raycast = function(){return false}
		this.add( this.direction );

	}

	over(b){

		if(b){
			if(!this.isOver){
				this.isOver = true;
				this.changeColor(this.isOver)
			}
		}else{
			if(this.isOver){
				this.isOver = false;
				this.changeColor(this.isOver)
		    }
		}
		

		//console.log('yo')

	}

	changeColor(b) {

		let i = this.colors.length;
		while(i--) this.colors[i] = b ? 1 : this.colorsbase[i];
		if( this.geometry ) this.geometry.attributes.color.needsUpdate = true;

	}

	setDirection(r) {

		if(!this.direction) return
		//this.rotation.y = r
		this.direction.rotation.y = r

	}

	dispose() {

		this.geometry.dispose();

		this.cone.geometry.dispose();
		//this.cone.material.dispose();

		if(this.direction){
			this.direction.geometry.dispose();
			//this.direction.material.dispose();
		}

	}

	raycast(){
		return false
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
