import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { MathTool, todeg } from '../core/MathTool.js';

import { Utils, root } from './root.js';
import { Geo } from './base/Geo.js';
import { Mat } from './base/Mat.js';
import { Basic3D } from '../core/Basic3D.js';


// THREE VEHICLE

export class Vehicle extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'vehicle';
		this.num = Num[this.type]

	}

	step () {

		const AR = root.Ar;
		const N = root.ArPos[this.type];

		let i = this.list.length, n, s, j, k=0, m;

		while( i-- ){

			s = this.list[i];
			n = N + ( i * this.num );
			s.step( AR, n );

		}

	}

	add ( o = {} ) {

		this.setName( o )
        const car = new Car( o )

        // add to world
		this.addToWorld( car, o.id )

        // add to physics
        root.post({ m:'add', o:car.o })

        return car

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

	}

}



// CAR

class Car extends Basic3D {//extends Object3D {

	constructor( o ) {

		super();

		// extra function // ex car selection
		if(o.extra){
			this.extra = o.extra
			delete o.extra;
		}

		this.type = 'vehicle';
		this.name = o.name || 'car';
		this.isRay = o.ray || false
		//this.withBody = false;
		this.actif = false;
		//this.position = new THREE.Vector3();
		this.steering = 0
		this.suspension = []
		this.rolling = []
		this.init( o );

	}

	drive () {

	}

	raycast(){
		return
	}

	init ( o ) {

		this.mass = o.mass || 2000

		this.model = null

		//this.decal = o.bodyDecalY || 0;
		//this.circum = (Math.PI * 2 * o.radius);// in metter

        // CHASSIS
		this.size = o.size || [0.85*2, 0.5*2, 2.5*2];
		this.massCenter = o.massCenter || [0, 0.55, 1.594]
		this.chassisPos = o.chassisPos || [0, 0.83, 0]

		this.maxSteering = o.maxSteering || 24
		this.incSteering = o.incSteering || 2

		this.s_travel = o.s_travel || 0.4
		this.s_ratio = 1 / ( this.s_travel * 0.5 )
		this.decaly = root.engine === 'PHYSX' ? this.s_travel * 0.5 : 0


		//this.diff = math.vecSub( this.chassisPos, this.massCenter )
		//this.diff[2] = 0

		// WHEELS
		this.numWheel = o.numWheel || 4;
		this.radius = o.radius || 0.35;
		this.radiusBack = o.radiusBack || this.radius;
		this.deep = o.deep || 0.3;
		this.deepBack = o.deepBack || this.deep;

		let byAxe = this.numWheel < 4 ? 1 : 2

		if(!o.wPos) o.wPos = [0.8, 0.1, 1.4]

		if( o.wPos ){

			this.wPos = o.wPos

			var p, wp = o.wPos, axe, pp = [], s=1, back=0, y, x, z, pzz;
			var limz = wp.length === 3 ? true : false;
			var limx = wp.length === 4 ? true : false;

			for( let i=0; i < this.numWheel; i++ ){

				s = i%2 === 0 ? -1 : 1;
				axe = Math.floor(i * 0.5)
				back = i >= byAxe ? true: false
				
				y = wp[ 1 ]
				if( y===0 ) y = back ? this.radiusBack : this.radius

				x = wp[ 0 ]
				//if( x === 0 ) x = (back ? this.deepBack : this.deep)*0.5
				if( x instanceof Array ) x = wp[0][axe]

				z = back ? -wp[2] : wp[2]
			    if( wp[2] instanceof Array ) z = wp[2][axe]

			    	


				p = [ x * s, y, z ]

				pp.push( p );

			}

			//console.log(this.name, pp)

			this.wheelsPosition = pp;
			delete o.wPos;

		}

		if( o.wheelsPosition ) this.wheelsPosition = o.wheelsPosition

		//console.log(this.wheelsPosition)

		const scale = o.meshScale || 1


		const chassisShapes = [];// { type:'convex', shape:bodyShape, pos:[0,0,0], flag:8|2|1 } ];//, isExclusive:true

		//if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, pos:[0,0,0], flag:8|2|1 } );
		//else chassisShapes.push( { type:'box', size:this.size, pos:[0,0,0], flag:8|2|1 } );

		if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, size:[scale], pos:this.chassisPos, filter:[1, -1, 0, 0], isExclusive:true, ray:this.isRay  } );
		else chassisShapes.push( { type:'box', size:this.size, pos:this.chassisPos } ); 

		for( let i=0; i < this.numWheel; i++ ){
	    	if( i < byAxe ) chassisShapes.push({ type:'cylinder', size:[ this.radius, this.deep ], isWheel:true, radius:o.rad || 0.05 , shadow:false, ray:false });
	    	else chassisShapes.push({ type:'cylinder', size:[ this.radiusBack, this.deepBack ], isWheel:true, radius:o.rad || 0.05 , shadow:false, ray:false  });
	    	
	    }

	    /*for( var i=0; i < o.numWheel; i++ ){

	    	if( this.radiusBack !== this.radius ){
	    		if(i<2) chassisShapes.push( { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    		else chassisShapes.push(  { type:'convex', shape:wheelShapeBack, pos:[0,0,0] } );
	    	} else {
	    		chassisShapes.push(  { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    	}

	    }*/

	    var material = Mat.get( o.debug ? 'debug' : (o.chassisMesh === undefined ? 'body' : 'hide'));
	    //if( o.body === undefined ) material = 'move';

	    let n

	    for ( let i = 0; i < chassisShapes.length; i ++ ) {
	    	n = chassisShapes[i]
	    	if( n.pos ) n.localPos = n.pos;
	    	n.size = MathTool.autoSize( n.size, n.type );
	    	root.items.body.geometry( n, this, material )
	    }

	    //if( o.chassisShape ) console.log(  )


		let m

		if(o.chassisMesh){
			m = o.noClone ? o.chassisMesh : o.chassisMesh.clone()
			m.position.set( 0, 0, 0 )
			Utils.noRay( m )
			m.scale.set( scale, scale, scale )
			this.children[0].add( m )
			this.model = m
			delete o.chassisMesh;

			//this.chassis.children[0].castShadow = false;
			//this.chassis.children[0].receiveShadow = false;
		}


		//let back = false, 

		// wheel model
		if( o.wheelMesh ){
			
			
			for( let i = 1; i<this.numWheel+1; i++ ) {
				back = i >= byAxe+1
				if( o.wheelMeshBack ) m = back ? o.wheelMeshBack.clone() : o.wheelMesh.clone()
				else m = o.wheelMesh.clone()
				Utils.noRay( m )
				m.position.set( 0, 0, 0 )
				if(i==2 || i ==4) m.scale.set( -scale, scale, scale )
				else m.scale.set( scale, scale, scale )
				this.children[i].add( m )

			    //this.chassis.children[i].castShadow = false;
			    //this.chassis.children[i].receiveShadow = false;
			}
			delete o.wheelMesh;
		}

		

		// suspension model
		if( o.suspensionMesh ){

			this.suspensionMesh = []

			for( let i = 1; i<this.numWheel+1; i++ ) {

				m = o.suspensionMesh.clone()
				Utils.noRay( m )
				m.position.set( 0, 0, 0 )
				m.position.fromArray(this.wheelsPosition[i-1])
				m.position.x = 0
				if(i==2 || i ==4) m.scale.set( scale, scale, scale )
				else m.scale.set( -scale, scale, scale )
				this.children[0].add( m )
			    this.suspensionMesh.push( m )

			}
			delete o.suspensionMesh;

		}

		// suspension model
		if( o.brakeMesh ){

			this.brake = []

			for( let i = 1; i<this.numWheel+1; i++ ) {
				back = i > 2
				if( o.brakeMeshBack ) m = back ? o.brakeMeshBack.clone() : o.brakeMesh.clone()
				else m = o.brakeMesh.clone()
				Utils.noRay( m )
				m.position.set( 0, 0, 0 )
				m.position.fromArray(this.wheelsPosition[i-1])
				if( o.brakeMeshBack ) pzz = scale
				else pzz = back ? scale : -scale
				if(i==2 || i ==4) m.scale.set( -scale, scale, pzz )
				else m.scale.set( scale, scale, pzz )
				this.children[0].add( m )
			    this.brake.push( m )

			}
			delete o.brakeMesh;

		}

		o.mass = this.mass

		o.size = o.chassisShape ? chassisShapes[0].boxSize : this.size
		o.numWheel = this.numWheel
		o.wheelsPosition = this.wheelsPosition
		o.radius = this.radius
		o.radiusBack = this.radiusBack
		o.deep = this.deep;
		o.deepBack = this.deepBack;

		o.chassisShape = chassisShapes[0]

		o.maxSteering = this.maxSteering;
		o.incSteering = this.incSteering;
		o.s_travel = this.s_travel;

		o.massCenter = this.massCenter
		o.chassisPos = this.chassisPos

		this.o = o

	}

	set ( o ) {
		o.name = this.name;
		root.motor.change( o );
	}

	respawn ( o ) {

		//{ pos:[0,0,0], rot:[0,0,0], keepVelocity:false }

		o = o || {};
		o.respawn = true;
		o.name = this.name;

		if( o.keepRotation ) o.quat = this.quaternion.toArray();


		//root.view.up( o );
		root.motor.change( o );

	}

	move(){

		/*phy.update({ 
		    name:this.name,
		    key: key
		});*/
	}

	dispose (){

		/*if(this.withBody){
			root.content.remove( this.body );
		}*/

		//root.remove( this.name + '_chassis' );
	}

	step ( AR, n ) {

		if( !this.actif ){
			let a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7];
			if( a===0 ) return;
			else this.actif = true;
		}

		

		this.position.fromArray( AR, n + 1 )
		this.quaternion.fromArray( AR, n + 4 )
		this.updateMatrix()

		let num = this.numWheel+1;
		let m = 0, mesh, acc, real;
		let s1 = 0, s2 = 0
		let sp = []
		let k = 0;

		for( let i = 0; i<num; i++ ){

			k = (i*8) + n

			if(i===0) acc = ( ( AR[ k ] ) / this.circum );
			if(i===1) s1 = AR[ k ]
			if(i===2) s2 = AR[ k ] 
			
			mesh = this.children[i];
			

			if( mesh && i>0 ){

				//sp[i-1] = this.wheelsPosition[i-1][1] - AR[k+2]
				sp[i-1] = (this.wheelsPosition[i-1][1] - this.decaly ) - AR[k+2]

				// local
				
				mesh.position.fromArray( AR, k + 1 );
				//mesh.position.y += this.massCenter[1]
				mesh.quaternion.fromArray( AR, k + 4 )

				this.rolling[i-1] = mesh.rotation.x

				if(this.brake){
					this.brake[i-1].position.copy( mesh.position )
					if(i==1 || i==2) this.brake[i-1].rotation.y = AR[k]
				}

			}

		}

		
		k = 4
		while(k--){

			this.suspension[k] = MathTool.clamp( sp[k]*this.s_ratio, -1, 1 )
			
			if(this.suspensionMesh ){
				if ( this.suspension[k] > 0 ) {
					Utils.morph( this.suspensionMesh[k].children[0], 'low', this.suspension[k] )
					Utils.morph( this.suspensionMesh[k].children[0], 'top', 0 )
				} else {
					Utils.morph( this.suspensionMesh[k].children[0], 'low', 0 )
					Utils.morph( this.suspensionMesh[k].children[0], 'top', -this.suspension[k] )
				}
			}

		} 

		this.steering = Math.round(((s1+s2)*0.5)*todeg) / this.maxSteering
		
		//console.log(this.steering)
		//console.log(acc)

	}
}
