import { Vector3, Mesh, BoxGeometry, AxesHelper, MeshBasicMaterial } from 'three';

// https://www.youtube.com/watch?v=WzNDI7g6jA4

export class Helicopter {

	constructor ( o = {}, motor ) {

		// car test
		//https://www.youtube.com/watch?v=BSybcKPQCnc

		this.MoveSpeed = 50;
	    this.MaxSpeed = 15;
	    this.Drag = 0.98;
	    this.SteerAngle = 20;
	    this.Traction = 10;
	    this.MoveForce = new Vector3(0,0,0);

	    this.tt = new Vector3(0,0,0);
	    this.v1 = new Vector3(0,0,0);
	    this.v2 = new Vector3(0,0,0);
	    //

		this.motor = motor;

		this.debug = this.motor.addDebuger()

		/*this.up = new Vector3(0,1,0);
		this.right = new Vector3(1,0,0);
		this.forward = new Vector3(0,0,1);

		this.transform = {
			position:new Vector3(),
			up:new Vector3(),
			right:new Vector3(),
			forward: new Vector3(),
			thottle:new Vector3(),
		}*/

		this._reponsivness = 500
		this._throttleAmt = 25

		this._thottle = 0

		this._roll = 0
		this._pitch = 0
		this._yaw = 0

		
		this.init(o);

	}

	init(){

		this.car = new Mesh(new BoxGeometry(2,1,3), new MeshBasicMaterial({wireframe:true}))
		this.car.position.y = 0.5
		this.motor.add(this.car)

		let axis = new AxesHelper()
		this.car.add(axis)
		
		/*this.body = this.motor.add({
			type:'box',
			name:'copter',
			size:[1.87, 2, 5],
			pos:[0,1,0],
			mass:360,
		})*/

	}

	update( delta ){

		this.updateCar(delta)

		//this.handleInputs(delta)

		//this.fixedUpdate()

	}

	updateCar(delta) {


		const key = this.motor.getKey()
		const transform = this.motor.getTransform(this.car);

		/*transform.position.copy(this.car.position);

		// Moving
		transform.forward.copy(this.forward).applyQuaternion( this.car.quaternion );
		transform.up.copy(this.up).applyQuaternion( this.car.quaternion );*/

		//

		this.tt.copy(transform.forward).multiplyScalar(this.MoveSpeed*-key[1]*delta)

        this.MoveForce.add(this.tt)

        this.car.position.add(this.MoveForce.clone().multiplyScalar(delta))// += MoveForce * Time.deltaTime;



		// Steering
        let steerInput = -key[0];
        let magnitude = this.MoveForce.length()
        transform.up.multiplyScalar(steerInput*magnitude*this.SteerAngle*delta)

        this.car.rotation.y += transform.up.y*this.motor.math.torad


        this.MoveForce.multiplyScalar(this.Drag)
        this.MoveForce.clampLength(0, this.MaxSpeed)

        magnitude = this.MoveForce.length()


        this.v1.copy(this.MoveForce).normalize().multiplyScalar(3)
        this.v2.copy(transform.forward).multiplyScalar(3)


        // Traction
        this.debug.DrawRay(transform.position, this.v1, 'white');
        this.debug.DrawRay(transform.position, this.v2, 'blue');

        this.debug.DrawRay(transform.position, transform.right, 'red');

        this.v1.copy(this.MoveForce).normalize().lerp(transform.forward, this.Traction*delta )

        this.MoveForce.copy(this.v1).multiplyScalar(magnitude)

        // Steering
        
        /*transform.Rotate(Vector3.up * steerInput * MoveForce.magnitude * SteerAngle * Time.deltaTime);

        // Drag and max speed limit
        MoveForce *= Drag;
        MoveForce = Vector3.ClampMagnitude(MoveForce, MaxSpeed);

        // Traction
        this.debug.DrawRay(transform.position, MoveForce.normalized * 3);
        this.debug.DrawRay(transform.position, transform.forward * 3, Color.blue);
        MoveForce = Vector3.Lerp(MoveForce.normalized, transform.forward, Traction * Time.deltaTime) * MoveForce.magnitude;*/
    
    }

	fixedUpdate( delta ){

		const transform = this.motor.getTransform(this.body)//this.transform;

		transform.position.copy(this.body.position);

		transform.forward.copy(this.forward).applyQuaternion( this.body.quaternion );
		transform.right.copy(this.right).applyQuaternion( this.body.quaternion );
		transform.up.copy(this.up).applyQuaternion( this.body.quaternion );
		transform.thottle.copy(transform.up)
		
		this.motor.change({ name:this.body.name, impulse:transform.thottle.multiplyScalar(this._thottle).toArray() })

		//this.motor.change({ name:this.body.name, torque:transform.right.multiplyScalar(this._pitch * this._reponsivness).toArray() })
		//this.motor.change({ name:this.body.name, torque:transform.forward.multiplyScalar(this._roll * this._reponsivness).toArray() })
		//this.motor.change({ name:this.body.name, torque:transform.up.multiplyScalar(this._yaw * this._reponsivness).toArray() })


		this.debug.DrawRay(transform.position, transform.thottle, 'red');
		this.debug.DrawRay(transform.position, transform.forward, 'yellow');
		this.debug.DrawRay(transform.position, transform.right, 'cyan');
		this.debug.DrawRay(transform.position, transform.up, 'green');



		/*this.body.addForces( transform.up * this._thottle, 'impulse' )

		this.body.addTorque( transform.right * this._pitch * this._reponsivness )
		this.body.addTorque( transform.forward * this._roll * this._reponsivness )
		this.body.addTorque( transform.up * this._yaw * this._reponsivness )*/

	}

	handleInputs(delta){

		const key = this.motor.getKey()


		this._roll = key[0]
		this._pitch = key[1]

		if(key[4]) this._thottle += delta * this._throttleAmt
		else if(key[5]) this._thottle -= delta * this._throttleAmt

		

		this._thottle = this.motor.math.clamp(this._thottle, 0, 100);

	}

}