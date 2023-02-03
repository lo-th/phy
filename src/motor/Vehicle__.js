import { root, map } from './root.js';
import { math } from './math.js';
/**
 * @author lo.th / https://github.com/lo-th
 */

function Vehicle() {

	this.ID = 0;
	this.cars = [];

}

Object.assign( Vehicle.prototype, {

	step: function ( AR, N ) {

		let n, c, i = this.cars.length;

		while( i-- ){

			c = this.cars[i];
			n = N + ( i * 64 );
			c.step( AR, n );

		}

	},

	clear: function ( full ) {

		if( !full ){
			while ( this.cars.length > 0 ) this.destroy( this.cars.pop(), full );
		}

		this.cars = [];
		this.ID = 0;

	},

	destroy: function ( car, full ) {

		car.dispose();
		if( !full ) map.delete( car.name );

    },

	remove: function ( name ) {

		if ( ! map.has( name ) ) return;
		var car = map.get( name );

		var n = this.cars.indexOf( car );
		if ( n !== - 1 ) {

			this.cars.splice( n, 1 );
			this.destroy( car );

		}

	},

	/**
	 * @class Car
	 * @hideconstructor.
	 * @example
	 * view.add({"type": 'car',...})
	 * @param {Object} o - Array of options to configure the vehicle.
	 * @param {Boolean} debug='false' - true if debug mesh to be shown.
	 * @param {String} type='car' - Required to be 'car' in order to add a car.
	 * @param {String} name - Unique name of entity.
	 * @param {String} vehicleType - Type of vehicle to add. Options are "NoDrive", "Tank" and "DriveW4"
	 * @param {Object} body - Mesh of vehicle.
	 * @param {String} [chassisName] - Name of chassis parent in model.
	 * @param {String} [wheelNamePrefix] - Prefix for name of wheels in model e.g. "Wheel_" + 0
	 * @param {String} bodyDecalY - Shift vehicle mesh on Y axis. Smaller values will rise. Larger values will lower..
	 * @param {Array.<Float>} bodyScale - Scale of vehicle mesh.
	 * @param {String} mass - Mass of vehicle.
	 * @param {String} wheelMass - Mass of vehicle wheels.
	 * @param {Array.<Float>} pos - Spawn position of robot.
	 * @param {Array.<Float>} rot - Spawn rotation of robot.
	 * @param {String} centerOfMass - Mesh of vehicle.
	 * @param {String} size - [x,y,z] size of vehicle chassis
	 * @param {String} numWheel - Number of vehicle wheels.
	 * @param {String} radius - Radius of wheels.
	 * @param {String} [radiusBack] - set different radius of back wheels,
     * @param {String} deep - wheels deep only for three cylinder 0.3
     * @param {String} [deepBack] - set different depth for back wheels,
     * @param {Array.<Float>} wPos - shorthand position for each wheel.
	 * @param {Array.<Float[]>} wheelsPosition - [x,y,z] position for each wheel. Array of arrays the same size as numWheel. Overrides wPos
	 * @param {String} tires - suspension config.
	 * @param {String} maxCompression - suspension config.
	 * @param {String} maxDroop - suspension config.
	 * @param {String} springStrength - suspension config.
	 * @param {String} springDamperRate - suspension config.
	 * @param {String} suspForceAppPointOffset - suspension config.
	 * @param {String} camberAngleAtRest - suspension config.
	 * @param {String} camberAngleAtMaxDroop - suspension config.
	 * @param {String} amberAngleAtMaxCompression - suspension config.
	 * @param {Boolean} [rearWheelSteer=false] - Steer with rear wheels instead of front. Only applicable to type: "NoDrive"
	 * @param {Boolean} [codeControl=false] - Control vehicle with code if true, keyboard if false. Only applicable to type: "NoDrive"
	 * @param {String} engine - Engine force of vehicle.
	 * @param {String} acceleration - acceleration of vehicle
	 */
	add: function ( o ){

		//console.log('add car')

		var name = o.name !== undefined ? o.name : o.type + this.ID ++;

		// delete old if same name
		this.remove( name );

		o.name = name;

		var car = new Car( o );
		this.cars.push( car );
		map.set( name, car );


		//if ( o.wheelShape ) delete ( o.wheelShape );
	    if ( o.body ) delete ( o.body )


	    o.wheelsPosition = car.wheelsPosition;

	   //console.log( o.wheelsPosition.length )

		// send to physics
	    root.post({ m:'add', o:o });
		return car;
	},

});

export { Vehicle };

// CAR

function Car( o ) {

	this.type = 'vehicle';
	this.name = o.name;
	this.withBody = false;
	this.position = new THREE.Vector3();
	this.init( o );

}

Object.assign( Car.prototype, {

	isCar: true,

	drive: function () {

	},

	init: function ( o ) {

		this.actif = false;

		this.decal = o.bodyDecalY || 0;

		this.numWheel = o.numWheel;

		this.circum = (Math.PI * 2 * o.radius);// in metter

		this.radius = o.radius;
		this.radiusBack = o.radiusBack || this.radius;

		this.deep = o.deep;
		this.deepBack = o.deepBack || this.deep;

		this.size = o.size || [1,1,1];
		
		this.disableSteerAnimation = o.disableSteerAnimation
		
		//this.angularSpeedRatio = -2/(o.radius*2)

		//var bodyShape = new THREE.BoxGeometry( o.size[0], o.size[1], o.size[2] );
	    /*var wheelShape = new THREE.CylinderGeometry( this.radius, this.radius, this.deep, 18 );
	    wheelShape.rotateZ( -Math.PI*0.5 );

	    if( this.radiusBack !== this.radius ){

	    	var wheelShapeBack = new THREE.CylinderGeometry( this.radiusBack, this.radiusBack, this.deepBack, 18 );
	    	wheelShapeBack.rotateZ( -Math.PI*0.5 );

	    }*/

		if( o.wPos ){

			var p, wp = o.wPos, pp = [], s=1;
			var limz = wp.length === 3 ? true : false;
			var pz = 1;

			for( var i=0; i < o.numWheel; i++ ){

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
			delete o.wPos;

		} else {

			this.wheelsPosition = o.wheelsPosition;

		}

		var chassisShapes = [];// { type:'convex', shape:bodyShape, pos:[0,0,0], flag:8|2|1 } ];//, isExclusive:true

		//if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, pos:[0,0,0], flag:8|2|1 } );
		//else chassisShapes.push( { type:'box', size:this.size, pos:[0,0,0], flag:8|2|1 } );

		if( o.chassisShape ) chassisShapes.push( { type:'convex', shape:o.chassisShape, filter:[1, -1, 0, 0], isExclusive:true  } );
		else chassisShapes.push( { type:'box', size:this.size, filter:[1, -1, 0, 0], isExclusive:true   } );

		for( var i=0; i < o.numWheel; i++ ){

	    	if( i < 2 ) chassisShapes.push({ type:'wheel', size:[this.radius, this.deep ], pos:this.wheelsPosition[i], filter:[2, 4, 0, 0], isExclusive:true  });
	    	else chassisShapes.push({ type:'wheel', size:[this.radiusBack, this.deepBack ], pos:this.wheelsPosition[i], filter:[2, 4, 0, 0], isExclusive:true  });
	    	
	    }


	    /*for( var i=0; i < o.numWheel; i++ ){

	    	if( this.radiusBack !== this.radius ){
	    		if(i<2) chassisShapes.push( { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    		else chassisShapes.push(  { type:'convex', shape:wheelShapeBack, pos:[0,0,0] } );
	    	} else {
	    		chassisShapes.push(  { type:'convex', shape:wheelShape, pos:[0,0,0] } );
	    	}

	    }*/

	    var material = o.debug ? 'debug' : (o.body === undefined ? 'move' : 'hide');
	    //if( o.body === undefined ) material = 'move';

		this.kinematic = o.kinematic;
		this.chassis = root.add({ name:this.name + '_chassis', type:'compound', shapes:chassisShapes, pos:o.pos, rot:o.rot, mass:o.mass + o.wheelMass * o.numWheel, isVehicle:true, material:material, kinematic: o.kinematic, isIntern:true });
		this.chassis.car = this;

		if( o.body ){

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
				
				if(child.name.startsWith(this.wheelNamePrefix))
					child.rotation.order = "YXZ";
			}
			
			var chassisMesh = this.bodys[this.chassisName];
			if(this.kinematic && chassisMesh)
				chassisMesh.position.y -= this.decal;

			//console.log( this.wheelsPosition, this.bodys )
		}


	},

	respawn: function ( o ) {

		//{ pos:[0,0,0], rot:[0,0,0], keepVelocity:false }

		o = o || {};
		o.respawn = true;
		o.name = this.name;

		if( o.keepRotation ) o.quat = this.chassis.quaternion.toArray();


		root.view.up( o );

	},

	dispose: function (){

		if(this.withBody){
			root.content.remove( this.body );
		}

		root.remove( this.name + '_chassis' );
	},

	step: function ( AR, n ) {

		if( !this.actif ){
			let a = AR[n+0]+AR[n+1]+AR[n+2]+AR[n+3]+ AR[n+4]+AR[n+5]+AR[n+6]+AR[n+7];
			if( a===0 ) return;
			else this.actif = true;
		}

		//console.log(AR)

		if( this.withBody ){
			this.body.position.copy( this.chassis.position );
		    this.body.quaternion.copy( this.chassis.quaternion );
		    this.body.updateMatrix();
		}

		this.position.copy( this.chassis.position );
		
		if(this.kinematic) return;

		var num = this.numWheel+1;

		var m = 0, mesh, acc, sr, real;

		var k = 0;
		for( var i = 0; i<num; i++ ){

			k = ( i*5 ) + n;

			//m = i * 8;

			sr = 0;

			//if(i===0) acc = -( AR[ m+n ] * this.circum );
			if(i===0)  acc = ( ( AR[ k ] ) / this.circum  );
			//else wroll =
			//if(i===0) acc = -( AR[ m+n ] / (this.circum)  );
			if(i===1) sr = AR[ k ];
			if(i===2) sr = AR[ k ];




			mesh = this.chassis.children[i];


			mesh.position.fromArray( AR, k + 1 );

			
			//mesh.quaternion.fromArray( AR, k + 4 );

			if( this.withBody ){

				if( i > 0 ) real = this.bodys[ this.wheelNamePrefix + ( i-1 ) ];
			    else real = this.bodys[ this.chassisName ];

				if(real) {
					real.position.fromArray( AR, k + 1 ).multiplyScalar(this.invScale);
					//real.quaternion.fromArray( AR, k + 4 );
					if(real.name === this.chassisName) real.position.y-= this.decal;
				}
			}



			if(i>0){

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


			}



		}

		//console.log(acc)




	},
})
