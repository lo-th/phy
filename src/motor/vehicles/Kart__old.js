import { Vector3, Mesh, BoxGeometry, AxesHelper, MeshBasicMaterial } from 'three';

// https://www.youtube.com/watch?v=WzNDI7g6jA4

export class Kart {

	constructor ( o = {}, motor ) {

		this.motor = motor;

		this.speed=0
		this.currentSpeed=0;
	    this.rotate=0 
	    this.currentRotate=0;
	    this.driftDirection=0;
	    this.driftPower=0;
	    this.driftMode =0;

	    this.first = false; 
	    this.second = false; 
	    this.third = false;


		// kart test
		//https://www.youtube.com/watch?v=Ki-tWT50cEQc

		this.acceleration = 30;
		this.steering = 80;
		this.gravity = 10;

		this.drifting = false;

		this.py = new Vector3(0, 0.4, 0)



this.v1 = new Vector3(0,0,0);


		/*this.moveSpeed = 50;
	    this.maxSpeed = 15;
	    this.drag = 0.98;
	    this.SteerAngle = 20;
	    this.traction = 2;//1_10 drift 
	    this.moveForce = new Vector3(0,0,0);

	    this.tt = new Vector3(0,0,0);
	    
	    this.v2 = new Vector3(0,0,0);*/

		

		this.debug = this.motor.addDebuger()

		
		this.init(o);

	}

	init(){

		this.sphere = this.motor.add({ type:'sphere', name:'baser', mass:1, size:[0.6], pos:[0,0.6,0], material:'debug' });

		this.car = new Mesh(new BoxGeometry(1,0.5,1.2), new MeshBasicMaterial({wireframe:true}))
		this.car.position.y = 0.5
		this.motor.add(this.car)

		let axis = new AxesHelper();
		this.car.add(axis);

	}

	boost( direction, amount ){

		this.drifting = false;
		this.driftPower = 0;
        this.driftMode = 0;

	}

	steer( direction, amount ){

		this.rotate = (this.steering * direction) * amount;

	}

	update( delta ){



		const key = this.motor.getKey()
		const math = this.motor.math

		//let test =  math.remap(-key[1], -1, 1, 0, 2);
		//console.log(test)

		this.car.position.copy(this.sphere.position).sub(this.py);

		//Accelerate
		//if (key[6]) this.speed = this.acceleration;
		if (key[1]) this.speed = key[1]*this.acceleration;

		//Steer
		if (key[0]!==0) this.steer(key[0]>0?1:-1, Math.abs(key[0]));

		//Drift
		if( key[4] && !this.drifting && key[0]!==0){
			this.drifting = true;
            this.driftDirection = key[0]>0?1:-1;
		}

		if (this.drifting){
			let control = this.driftDirection === 1 ? math.remap(key[0], -1, 1, 0, 2) : math.remap(key[0], -1, 1, 2, 0);
			let powerControl = this.driftDirection === 1 ? math.remap(key[0], -1, 1, .2, 1) : math.remap(key[0], -1, 1, 1, .2);

			this.steer(this.driftDirection, control);
            this.driftPower += powerControl;
		}

		if( key[4] && this.drifting) this.boost()

		this.currentSpeed = math.smoothstep(this.currentSpeed, this.speed, delta * 12); this.speed = 0;
        this.currentRotate = math.lerp(this.currentRotate, this.rotate, delta * 4); this.rotate = 0;

        //console.log(this.currentSpeed)
		if (!this.drifting){
			/*let r = new Vector3(this.car.rotation.x*math.todeg, this.car.rotation.y*math.todeg, this.car.rotation.z*math.todeg)
			let v = new Vector3(0, 90 + (key[0] * 15), this.car.rotation.z*math.todeg)
			r.lerp(v, 0.2)
			this.car.rotation.set(r.x*math.torad, r.y*math.torad, r.z*math.torad)*/
		}else{

		}


		/*const transform = this.motor.getTransform(this.car);

		// moving

		this.tt.copy(transform.forward).multiplyScalar(this.moveSpeed*-key[1]*delta)

        this.moveForce.add(this.tt)

        this.car.position.add(this.moveForce.clone().multiplyScalar(delta))// += MoveForce * Time.deltaTime;

		// Steering

        let steerInput = -key[0];
        let magnitude = this.moveForce.length()
        transform.up.multiplyScalar(steerInput*magnitude*this.SteerAngle*delta)

        this.car.rotation.y += transform.up.y*this.motor.math.torad


        this.moveForce.multiplyScalar(this.drag)
        this.moveForce.clampLength(0, this.maxSpeed)

        magnitude = this.moveForce.length()


        this.v1.copy(this.moveForce).normalize().multiplyScalar(3)
        this.v2.copy(transform.forward).multiplyScalar(3)


        // Traction
        this.debug.DrawRay(transform.position, this.v1, 'white');
        this.debug.DrawRay(transform.position, this.v2, 'blue');
        this.debug.DrawRay(transform.position, transform.right, 'red');


        this.v1.copy(this.moveForce).normalize().lerp(transform.forward, this.traction*delta )

        this.moveForce.copy(this.v1).multiplyScalar(magnitude)*/

        this.updatePhy( delta )
    
    }

    updatePhy( delta ){
    	const transform = this.motor.getTransform(this.sphere)
    	const transformCar = this.motor.getTransform(this.car)
    	
    	//Forward Acceleration

    	if(!this.drifting){
    		this.v1.copy(transformCar.right).multiplyScalar(-this.currentSpeed)
    		this.motor.change({ name:this.sphere.name, force:this.v1.toArray(), forceMode:'force' })
    	} else {
    		this.v1.copy(transform.forward).multiplyScalar(this.currentSpeed)
    		this.motor.change({ name:this.sphere.name, force:this.v1.toArray(), forceMode:'force' })
    	}

    	//Steering
    	let r = new Vector3(this.car.rotation.x*math.todeg, this.car.rotation.y*math.todeg, this.car.rotation.z*math.todeg)
		let v = new Vector3(0, (this.car.rotation.y*math.todeg)+this.currentRotate, 0)
		r.lerp(v, delta * 5)
		
		this.car.rotation.set(r.x*math.torad, r.y*math.torad, r.z*math.torad)
    }

}