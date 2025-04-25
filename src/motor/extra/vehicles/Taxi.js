import { Vector3, Mesh, BoxGeometry, CylinderGeometry, AxesHelper, MeshBasicMaterial, Quaternion } from 'three';

// https://www.youtube.com/watch?v=WzNDI7g6jA4

export class Taxi {

	constructor ( o = {}, motor ) {

		this.startPosition = o.pos || [0,0,0]

		// taxi test
		//https://www.youtube.com/watch?v=BSybcKPQCnc

		// https://www.models-resource.com/wii/mariokartwii/
		//https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=10&sort_by=count&sort_order=DESC

		this.debug = true;

		this.angle = 0

		this.moveSpeed = 50;
	    this.maxSpeed = 15;
	    this.drag = 0.98;
	    this.SteerAngle = 5//20;
	    this.traction = 1;//1_10 drift 
	    this.moveForce = new Vector3(0,0,0);

	    this.tt = new Vector3(0,0,0);
	    this.v1 = new Vector3(0,0,0);
	    this.v2 = new Vector3(0,0,0);

	    this.floorNormal = new Vector3(0,0,0);
	    this.up = new Vector3(0,1,0);
	    this.decal = new Vector3(0,-0.5,0);

	    this.tmpQ1 = new Quaternion();
	    this.tmpQ2 = new Quaternion();
	    this.tmpQ3 = new Quaternion();

		this.motor = motor;
		this.angleS = 0;

		this.debuger = this.motor.addDebuger()

		this.phyMove = true

		
		this.init(o);
		//this.setDebug();

	}

	setDebug(b){

		if(b)this.debug = b
		this.sphere.visible = this.debug;
	    this.ray.visible = this.debug;

	}

	init(){

		const math = this.motor.math;

		this.sphere = this.motor.add({ 
			type:'sphere', 
			name:'baser', 
			mass:1, size:[1], 
			pos:math.addArray(this.startPosition, [0,1,0],3), 
			friction:0.5,  
			material:'debug',
			getVelocity:true,
			visible:this.debug,
			shadow:false,
		});//angularFactor:[1,0,0],

		let selfHit = this.rayHit.bind(this)

		this.ray = this.motor.add({ name:'raySphere', type:'ray', begin:[0,0,0], end:[0,-1.5,0], visible:this.debug, parent:this.sphere, noRotation:true, callback:selfHit })

		this.car = new Mesh(new BoxGeometry(1,0.4,2), new MeshBasicMaterial({wireframe:true}))
		this.motor.add(this.car);

		/*this.chassis = this.motor.add({
			type:'box',
			name:'chassis',
			kinematic:true,
			isTrigger:true,
			size:[1,0.4,2],

		})*/ 

		this.addWheels()

		//let axis = new AxesHelper();
		//this.car.add(axis);

	}

	addWheels(){
		let g = new CylinderGeometry(0.3,0.3, 0.3, 16);
		g.rotateZ(Math.PI/2)
		let m = new MeshBasicMaterial({wireframe:true})
		let i = 4;
		let p = [0.7, -0.2, 0.7]
		let pos, pos1 
		let w = []
		let r = []
		while(i--){
			w[i] = new Mesh( g, m );
			pos = [i===0||i===3? p[0]:-p[0], p[1], i<2? p[2]:-p[2]]
			pos1 = [i===0||i===3? p[0]:-p[0], p[1]-1, i<2? p[2]:-p[2]]
			w[i].position.fromArray( pos )

			//r[i] = this.motor.add({ name:'rayW'+i, type:'ray', begin:pos, end:pos1, visible:true, parent:this.sphere, noRotation:true })

			this.car.add(w[i]);
		}

		this.w = w;
	}

	updateWheels(){
		const math = this.motor.math;
		let i = 4, w;
		this.tmpQ3.setFromAxisAngle( {x:0,y:1,z:0}, this.angleS );
		let s = -this.sphere.velocity.length()*2;
		let axis = {x:1,y:0,z:0}
		while(i--){
			w = this.w[i];
			if(i<2) w.quaternion.setFromAxisAngle(axis,s).premultiply(this.tmpQ3)
			else w.quaternion.setFromAxisAngle(axis,s)
		}

	}

	rayHit(r){

		//console.log(o)
		if(r.hit) this.floorNormal.fromArray(r.normal).normalize();
		else this.floorNormal.set(0,0,0);
		
	}

	update( delta ){

		const key = this.motor.getKey();
		const math = this.motor.math;

		if(this.phyMove) this.car.position.copy(this.sphere.position).add(this.decal)

		const transform = this.motor.getTransform(this.car);

		// moving


		this.tt.copy(transform.forward).multiplyScalar(this.moveSpeed*-key[1]*delta);

        this.moveForce.add(this.tt);

        if(!this.phyMove) this.car.position.add(this.moveForce.clone().multiplyScalar(delta))

        //this.car.position.copy(this.sphere.position).add(this.decal);

        this.tmpQ1.setFromUnitVectors( this.up, this.floorNormal );
        this.tmpQ2.slerp(this.tmpQ1, delta*4);

        let ar = this.moveForce.toArray();

        this.motor.change({ name:this.sphere.name, linear:ar, velocityOperation:'xz' })
        





		// Steering

        let steerInput = -key[0];
        let magnitude = this.moveForce.length();
        // console.log(transform.up)
        // transform.up.multiplyScalar(steerInput*magnitude*this.SteerAngle*delta)

        this.angleS = (steerInput*this.SteerAngle)*math.torad

        //this.angle += (steerInput*magnitude*this.SteerAngle*delta)*math.torad;

        this.angle += this.angleS*magnitude*delta

        //this.angleS = math.clamp(Math.PI/2 + this.angle, -this.SteerAngle, this.SteerAngle)

        //this.car.rotation.y += transform.up.y*math.torad

        this.car.quaternion.setFromAxisAngle(this.up, this.angle).premultiply(this.tmpQ2);

        //this.motor.change({ name:this.chassis.name, pos:this.car.position.toArray(), quat:this.car.quaternion.toArray() });


        this.moveForce.multiplyScalar(this.drag);
        this.moveForce.clampLength(0, this.maxSpeed);

        magnitude = this.moveForce.length();


        this.v1.copy(this.moveForce).normalize().multiplyScalar(1);
        this.v2.copy(transform.forward).multiplyScalar(1);


        // Traction
        this.debuger.DrawRay(transform.position, this.v1, 'white');
        this.debuger.DrawRay(transform.position, this.v2, 'blue');
        //this.debug.DrawRay(transform.position, transform.right, 'red');

        this.v1.copy(this.moveForce).normalize().lerp(transform.forward, this.traction*delta );

        this.moveForce.copy(this.v1).multiplyScalar(magnitude);

        this.updateWheels()
    
    }

}