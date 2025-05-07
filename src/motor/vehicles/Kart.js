import { Vector3, Mesh, BoxGeometry, CylinderGeometry, AxesHelper, MeshBasicMaterial, Quaternion } from 'three';

// https://www.youtube.com/watch?v=WzNDI7g6jA4

export class Kart {

	constructor ( o = {}, motor ) {

		this.startPosition = o.pos || [0,0,0]
		this.model = o.model || null;
		this.debug = o.debug || false;

		// taxi test
		//https://www.youtube.com/watch?v=BSybcKPQCnc

		// https://www.models-resource.com/wii/mariokartwii/
		//https://opengameart.org/art-search-advanced?keys=&field_art_type_tid%5B%5D=10&sort_by=count&sort_order=DESC

		

		this.angle = 0

		this.speed = 50;
	    this.maxSpeed = 20;
	    this.drag = 0.98;
	    this.steerAngle = 5//20;
	    this.traction = 3;//1_10 drift 


	    this.moveForce = new Vector3(0,0,0);
	    this.side = 0
	    this.onAir = false;

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

		if(this.debug) this.debuger = this.motor.addDebuger()

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

		this.radius = 1;
		this.decal.y = -0.5

		this.radius = 1.7;
		this.decal.y = -1.2

		const math = this.motor.math;

		this.sphere = this.motor.add({ 
			type:'sphere', 
			name:'baser', 
			mass:1, size:[this.radius], 
			pos:math.addArray(this.startPosition, [0,this.radius,0]), 
			friction:0.5,  
			material:'debug',
			getVelocity:true,
			visible:this.debug,
			shadow:false,
			ray:false,
		});//angularFactor:[1,0,0],

		let selfHit = this.rayHit.bind(this)

		this.ray = this.motor.add({ name:'raySphere', type:'ray', begin:[0,0,0], end:[0,-(this.radius+1),0], visible:this.debug, parent:this.sphere, noRotation:true, callback:selfHit })

		
		if(this.model ){ 

			for(let m in this.model){
				this.model[m].receiveShadow = true;
				this.model[m].castShadow = true;
			}

			this.car = this.model.body;
			
			this.w = [
				this.model.wheel_0,
				this.model.wheel_1,
				this.model.wheel_2,
				this.model.wheel_3,
				this.model.d_wheel,
			]
			//this.car.geometry.scale(10,10,10)
		} else {
			this.car = new Mesh(new BoxGeometry(1,0.4,2), new MeshBasicMaterial({wireframe:true}))
			this.addWheels()
		}

		this.motor.add(this.car);

		/*this.chassis = this.motor.add({
			type:'compound',
			name:'chassis',
			//kinematic:true,
			mass:1,
			shapes:[
			{type:'box', size:[0.5,0.5,0.5], pos:[0,0,1.6]}
			],

		})*/

		

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
		
		this.tmpQ3.setFromAxisAngle( {x:0,y:1,z:0}, this.angleS*3 );
		let s = this.sphere.velocity.length()*this.side//*2;
		//s = math.clamp(s, -0.8, 0.8)
		let axis = {x:1,y:0,z:0}
		while(i--){
			w = this.w[i];
			if(i<2) w.quaternion.setFromAxisAngle(axis,s).premultiply(this.tmpQ3)
			else w.quaternion.setFromAxisAngle(axis,s)
		}

	    if(this.w[4]) this.w[4].rotation.y = this.angleS*10

	}

	rayHit(r){

		//console.log(o)
		if(r.hit) this.floorNormal.fromArray(r.normal).normalize();
		else this.floorNormal.set(0,0,0);

		this.onAir = !r.hit;
		
	}

	update( delta ){

		const key = this.motor.getKey();
		const math = this.motor.math;

		if(this.phyMove) this.car.position.copy(this.sphere.position).add(this.decal)

		const transform = this.motor.getTransform(this.car);

		// moving

		let acceleration = -key[1]*this.speed*delta

		if( this.onAir ) acceleration = 0;



		this.tt.copy(transform.forward).multiplyScalar(acceleration);

        this.moveForce.add(this.tt);

        if(!this.phyMove) this.car.position.add(this.moveForce.clone().multiplyScalar(delta))

        //this.car.position.copy(this.sphere.position).add(this.decal);

        this.tmpQ1.setFromUnitVectors( this.up, this.floorNormal );
        this.tmpQ2.slerp(this.tmpQ1, delta*4);

        

        let ar = this.moveForce.toArray();

        this.motor.change({ name:this.sphere.name, linear:ar, velocityOperation:'xz' })

        if(this.chassis)this.motor.change({ name:this.chassis.name, /*linear:ar, velocityOperation:'xz',*/quat:this.car.quaternion.toArray() ,pos:this.car.position.toArray() });
        





		// Steering

        let steerInput = -key[0];
        let magnitude = this.moveForce.length();
        // console.log(transform.up)
        // transform.up.multiplyScalar(steerInput*magnitude*this.SteerAngle*delta)

        this.angleS = steerInput*this.steerAngle*math.torad

        //this.angle += (steerInput*magnitude*this.SteerAngle*delta)*math.torad;

        this.angle += this.angleS*magnitude*delta

        //this.angleS = math.clamp(Math.PI/2 + this.angle, -this.SteerAngle, this.SteerAngle)

        //this.car.rotation.y += transform.up.y*math.torad

        this.car.quaternion.setFromAxisAngle(this.up, this.angle).premultiply(this.tmpQ2);

        


        this.moveForce.multiplyScalar(this.drag);
        this.moveForce.clampLength(0, this.maxSpeed);

        magnitude = this.moveForce.length();


        this.v1.copy(this.moveForce).normalize().multiplyScalar(1);
        this.v2.copy(transform.forward).multiplyScalar(1);


        // Traction
        if(this.debug){
        	this.debuger.DrawRay(transform.position, this.v1, 'white');
            this.debuger.DrawRay(transform.position, this.v2, 'blue');
        }
        
        //this.debug.DrawRay(transform.position, transform.right, 'red');

        this.v1.copy(this.moveForce).normalize().lerp(transform.forward, this.traction*delta );

        this.moveForce.copy(this.v1).multiplyScalar(magnitude);

        this.side = this.moveForce.dot(transform.forward)>0?-1:1;

        this.updateWheels()
    
    }

}