import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';

import { Utils, root, math, mat } from './root.js';
import { Basic3D } from '../core/Basic3D.js';


// THREE VEHICLE

export class Vehicle extends Item {

	constructor () {

		super();

		this.Utils = Utils
		this.type = 'vehicle'
		this.num = Num[this.type]

	}

	step ( AR, N ) {

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

		this.type = 'vehicle';
		this.name = o.name || 'car';
		//this.withBody = false;
		this.actif = false;
		//this.position = new THREE.Vector3();
		this.init( o );

	}

	drive () {

	}

	init ( o ) {

		//this.decal = o.bodyDecalY || 0;
		//this.circum = (Math.PI * 2 * o.radius);// in metter

        // CHASSIS
		this.size = o.size || [0.85*2, 0.5*2, 2.5*2];
		this.massCenter = o.massCenter || [0, 0.55, 1.594]
		this.chassisPos = o.chassisPos || [0, 0.83, 0]


		//this.diff = math.vecSub( this.chassisPos, this.massCenter )
		//this.diff[2] = 0

		// WHEELS
		this.numWheel = o.numWheel || 4;
		this.radius = o.radius || 0.35;
		this.radiusBack = o.radiusBack || this.radius;
		this.deep = o.deep || 0.3;
		this.deepBack = o.deepBack || this.deep;

		if(!o.wPos) o.wPos = [0.8, 0.1, 1.4]

		if( o.wPos ){

			var p, wp = o.wPos, pp = [], s=1;
			var limz = wp.length === 3 ? true : false;
			var pz = 1;

			for( var i=0; i < this.numWheel; i++ ){

				s = i%2 === 0 ? -1 : 1;
				if(s === -1) pz++;

				if(limz){
					p = [ wp[ 0 ] * s, wp[ 1 ], i<2 ? wp[ 2 ] : -wp[ 2 ] ]
				} else {
					p = [ wp[ 0 ] * s, wp[ 1 ],  -wp[ pz ] ];
				}

				pp.push( p );

			}

			this.wheelsPosition = pp;
			//delete o.wPos;

		} else {

			this.wheelsPosition = o.wheelsPosition;

		}

		const scale = o.meshScale || 1

		//console.log(this.wheelsPosition)

		const chassisShapes = [];// { type:'convex', shape:bodyShape, pos:[0,0,0], flag:8|2|1 } ];//, isExclusive:true

		//if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, pos:[0,0,0], flag:8|2|1 } );
		//else chassisShapes.push( { type:'box', size:this.size, pos:[0,0,0], flag:8|2|1 } );

		if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, size:[scale], pos:this.chassisPos, filter:[1, -1, 0, 0], isExclusive:true  } );
		else chassisShapes.push( { type:'box', size:this.size, pos:this.chassisPos } );

		let wType = 'cylinder'//'wheel'

		for( let i=0; i < this.numWheel; i++ ){
	    	if( i < 2 ) chassisShapes.push({ type:wType, size:[ this.radius, this.deep ], isWheel:true, radius:0.05 , shadow:false});
	    	else chassisShapes.push({ type:wType, size:[ this.radiusBack, this.deepBack ], isWheel:true, radius:0.05 , shadow:false });
	    	
	    }

	    ///console.log( chassisShapes )


	    /*for( var i=0; i < o.numWheel; i++ ){

	    	if( this.radiusBack !== this.radius ){
	    		if(i<2) chassisShapes.push( { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    		else chassisShapes.push(  { type:'convex', shape:wheelShapeBack, pos:[0,0,0] } );
	    	} else {
	    		chassisShapes.push(  { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    	}

	    }*/

	    var material = 'debug3'//o.debug ? 'debug' : (o.body === undefined ? 'body' : 'hide');
	    //if( o.body === undefined ) material = 'move';

		this.kinematic = o.kinematic;
		this.chassis = root.add({ 
			onlyMakeMesh:true, 
		    name:this.name + '_chassis', 
		    type:'compound', 
		    shapes:chassisShapes, 
		    pos:o.pos, 
		    rot:o.rot, 
		    ray:false,
		    //mass:1,
		    /*mass:o.mass + o.wheelMass * o.numWheel, */
		    material:material,
		    //shadow:false,
		    //kinematic: o.kinematic,
			//noGravity:true
		});
		
		this.chassis.car = this;

		let m

		if(o.chassisMesh){
			m = o.chassisMesh.clone()
			m.scale.set( scale, scale, scale )
			this.chassis.children[0].add( m )
			delete o.chassisMesh;

			//this.chassis.children[0].castShadow = false;
			//this.chassis.children[0].receiveShadow = false;
		}

		// wheel model
		if( o.wheelMesh ){
			for( let i = 1; i<this.numWheel+1; i++ ) {
				m = o.wheelMesh.clone()
				if(i==2 || i ==4) m.scale.set( -scale, scale, scale )
				else m.scale.set( scale, scale, scale )
				this.chassis.children[i].add( m )

			    //this.chassis.children[i].castShadow = false;
			    //this.chassis.children[i].receiveShadow = false;
			}
			delete o.wheelMesh;
		}

		this.suspension = []

		// wheel model
		if( o.suspensionMesh ){

			for( let i = 1; i<this.numWheel+1; i++ ) {

				m = o.suspensionMesh.clone()
				m.position.fromArray(this.wheelsPosition[i-1])
				m.position.x = 0
				if(i==2 || i ==4) m.scale.set( scale, scale, scale )
				else m.scale.set( -scale, scale, scale )
				this.chassis.children[0].add( m )
			    this.suspension.push( m )

			}
			delete o.suspensionMesh;

		}

		/*if( o.body ){

			this.withBody = true;

			this.body = o.noClone ? o.body : o.body.clone();
			this.body.matrixAutoUpdate = false;

			this.chassisName = o.chassisName || "chassis";
			this.wheelNamePrefix = o.wheelNamePrefix || "wheel_";

			if( this.body.scale.x!==o.bodyScale ) this.body.scale.multiplyScalar(o.bodyScale);

			this.invScale = 1/o.bodyScale;

			root.content.add( this.body );

			var i = this.body.children.length;
			this.bodys = {};
			while (i--){
				var child = this.body.children[i];
				var name = child.name;
				this.bodys[ name ] = child;
				
				//if(child.name.startsWith(this.wheelNamePrefix))
				//	child.rotation.order = "YXZ";
			}
			
			var chassisMesh = this.bodys[this.chassisName];
			if(this.kinematic && chassisMesh) chassisMesh.position.y -= this.decal;

			//console.log( this.wheelsPosition, this.bodys )

			delete ( o.body )
		}*/

		o.size = this.size
		o.numWheel = this.numWheel
		o.wheelsPosition = this.wheelsPosition
		o.radius = this.radius
		o.radiusBack = this.radiusBack
		o.deep = this.deep;
		o.deepBack = this.deepBack;

		o.chassisShape = chassisShapes[0]

		o.massCenter = this.massCenter
		o.chassisPos = this.chassisPos

		this.o = o

	}

	respawn ( o ) {

		//{ pos:[0,0,0], rot:[0,0,0], keepVelocity:false }

		o = o || {};
		o.respawn = true;
		o.name = this.name;

		if( o.keepRotation ) o.quat = this.chassis.quaternion.toArray();


		root.view.up( o );

	}

	dispose (){

		/*if(this.withBody){
			root.content.remove( this.body );
		}*/

		root.remove( this.name + '_chassis' );
	}

	step ( AR, n ) {

		if( !this.actif ){
			let a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7];
			if( a===0 ) return;
			else this.actif = true;
		}

		this.chassis.position.fromArray( AR, n + 1 )
		this.chassis.quaternion.fromArray( AR, n + 4 )
		this.chassis.updateMatrix()

		//console.log(AR)

		/*if( this.withBody ){
			this.body.position.copy( this.chassis.position );
		    this.body.quaternion.copy( this.chassis.quaternion );
		    this.body.updateMatrix();
		}*/

		//this.position.copy( this.chassis.position );
		
		//if(this.kinematic) return;

		var num = this.numWheel+1;

		var m = 0, mesh, acc, sr, real;

		/*let isGlobal = false

		let mx = new Matrix4()
		let mx2 = new Matrix4().copy( this.chassis.matrixWorld ).invert()
		let mp = new Vector3()
		let mq = new Quaternion()*/

		var k = 0;
		for( var i = 0; i<num; i++ ){

			k = (i*8) + n //( i*5 ) + n;

			//m = i * 8;

			sr = 0;

			//if(i===0) acc = -( AR[ m+n ] * this.circum );
			if(i===0)  acc = ( ( AR[ k ] ) / this.circum  );
			//else wroll =
			//if(i===0) acc = -( AR[ m+n ] / (this.circum)  );
			if(i===1) sr = AR[ k ];
			if(i===2) sr = AR[ k ];




			mesh = this.chassis.children[i];

			if( mesh && i>0 ){

				/*if(isGlobal){
					mx.compose( {x:AR[k+1], y:AR[k+2], z:AR[k+3]}, {_x:AR[k+4], _y:AR[k+5], _z:AR[k+6], _w:AR[k+7]}, {x:1, y:1, z:1})
					mx.premultiply( mx2 )
					mx.decompose(mp, mq, {x:1, y:1, z:1})
					mp.toArray( AR, k + 1 )
					mq.toArray( AR, k + 4 )
				}*/

				
				

				//mesh.rotation.order = 'YXZ'
				/*mesh.position.copy(mp)//fromArray( AR, k + 1 );
				mesh.position.y += this.massCenter[1]
				mesh.quaternion.copy(mq)//fromArray( AR, k + 4 )*/

				// local
				
				mesh.position.fromArray( AR, k + 1 );
				//mesh.position.y += this.massCenter[1]
				mesh.quaternion.fromArray( AR, k + 4 )



				//mesh.quaternion.fromArray( AR, n + 4 )//.premultiply(this.q)
				//mesh.rotation.order = 'YXZ';
				/*mesh.rotation.order = 'YZX';
				mesh.rotation.y = AR[k+4];
				mesh.rotation.x = AR[k+5];
				mesh.rotation.z = AR[k+6];*/


			}

			
			//mesh.quaternion.fromArray( AR, k + 4 );

			/*if( this.withBody ){

				if( i > 0 ) real = this.bodys[ this.wheelNamePrefix + ( i-1 ) ];
			    else real = this.bodys[ this.chassisName ];

				if(real) {
					real.position.fromArray( AR, k + 1 ).multiplyScalar(this.invScale);
					//real.quaternion.fromArray( AR, k + 4 );
					if(real.name === this.chassisName) real.position.y-= this.decal;
				}
			}*/



			/*if(i>0){

				var roll = AR[ k+4 ]

				mesh.rotation.order = 'YXZ';
				mesh.rotation.y = sr;
				mesh.rotation.x += acc/Math.PI;
				mesh.rotation.x = roll;

				if( this.withBody && real ){
			        if(!this.disableSteerAnimation) real.rotation.y = sr;
				    //real.rotation.x += acc/Math.PI;
				    real.rotation.x = roll;
				}


			}*/



		}

		//console.log(acc)




	}
}
