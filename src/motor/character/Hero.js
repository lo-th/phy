import { Group, Object3D, Matrix4, Vector3, Euler, Quaternion, Mesh } from 'three';

//import { Basic3D } from '../../core/Basic3D.js';
import { MathTool, torad } from '../../core/MathTool.js';
import { SkeletonBody } from './SkeletonBody.js';
import { Avatar } from '../../3TH/character/Avatar.js';
import { CapsuleHelper } from '../geometries/CapsuleHelper.js';

//
// not use native character function of physics engine 
// use some code from https://github.com/ErdongChen-Andrew/CharacterControl
// 

const tmpV0 = new Vector3();
const tmpV1 = new Vector3();
const tmpV2 = new Vector3();

export class Hero extends Object3D {

	constructor( o = {}, motor ) {

		super()

		this.motor = motor;
		this.utils = this.motor.utils;

		this.isCharacter = true;
		this.isPlayer = o.isPlayer || false;
		this.enable = false

		this.useImpulse = o.useImpulse || false;
		this.useFloating = o.floating || false;

		this.waitRotation = false;

		let floatHeight = 0.3;
		let radius = o.radius || 0.3;
		let height = o.height || 1.8;//0.7

		this.realHeight = height;

		if(this.useFloating){
			height -= floatHeight
		}

		this.option = {

			debug: false,
			capsuleHalfHeight: height*0.5,
			capsuleRadius: radius,
			floatHeight: floatHeight,
			characterInitDir: 0, // in rad
			//followLight: false,
			// Follow camera setups
			camInitDis: -5,
			camMaxDis: -7,
			camMinDis: -0.7,
			// Base control setups
			maxVelLimit: 5,//2.5,
			turnVelMultiplier: 0.2,
			turnSpeed: 15,
			sprintMult: 2,
			jumpVel: 4,
			jumpForceToGroundMult: 5,
			slopJumpMult: 0.25,
			sprintJumpMult: 1.2,
			airDragMultiplier: 0.2,
			slowDown: 0.9,//dragDampingC // 0.15,
			accDeltaTime: 8,
			rejectVelMult: 4,
			moveImpulsePointY: 0.5,
			camFollowMult: 11,
			fallingGravityScale: 2.5,
			fallingMaxVel: -20,
			wakeUpDelay: 200,
			// Floating Ray setups
			rayOriginOffest: { x: 0, y: -height*0.5, z: 0 },
			rayHitForgiveness: 0.1,
			rayLength: radius + 2,
			rayDir: { x: 0, y: -1, z: 0 },

			floatingDis: radius + floatHeight+0.02, //+ 0.08,
			springK: 2, //1.2,
			dampingC: 0.2,//0.08,
			forceMultiply: 5, 
			// Slope Ray setups
			showSlopeRayOrigin: false,
			slopeMaxAngle: 1, // in rad
			slopeRayOriginOffest: radius - 0.03,
			slopeRayLength: radius + 3,
			slopeRayDir: { x: 0, y: -1, z: 0 },
			slopeUpExtraForce: 0.1,
			slopeDownExtraForce: 0.2,
			// AutoBalance Force setups
			autoBalance: false,
			autoBalanceSpringK: 0.3,//1.2,//0.3,
			autoBalanceDampingC: 0.03,//0.04,
			autoBalanceSpringOnY: 0.5, //0.7,
			autoBalanceDampingOnY: 0.015,//0.05,
			// Animation temporary setups
			animated: false,
			mode:null,

			//...o

		}

		const cc = {
			speed:'#FF9900',
			jump:'#00FF99',
			ray:'#00FFFF',
			balance:'#0099FF'
		}

		this.optionGui = {
			// speed
			maxVelLimit:{ min:0, max:10, step:0.01, color:cc.speed },
			turnVelMultiplier:{ min:0, max:1, step:0.01, color:cc.speed },
			turnSpeed:{ min:5, max:30, step:0.1, color:cc.speed },
			sprintMult:{ min:1, max:5, step:0.01, color:cc.speed },
			// jump
			jumpVel:{ min:0, max:10, step:0.01, color:cc.jump },
			jumpForceToGroundMult:{ min:0, max:80, step:0.1, color:cc.jump },
			slopJumpMult:{ min:0, max:1, step:0.01, color:cc.jump },
			sprintJumpMult:{ min:1, max:3, step:0.01, color:cc.jump },
			airDragMultiplier:{ min:0, max:1, step:0.01, color:cc.jump },

			slowDown:{ min:0, max:1.0, step:0.01 },
			accDeltaTime:{ min:0, max:50, step:1 },
			rejectVelMult:{ min:0, max:10, step:0.1 },
			moveImpulsePointY:{ min:0, max:3, step:0.1 },
			camFollowMult:{ min:0, max:15, step:0.1 },
			//ray
			rayHitForgiveness:{ min:0, max:0.5, step:0.01, color:cc.ray },
			rayLength:{ min:0, max:radius+10, step:0.01, color:cc.ray },
			floatingDis:{ min:0, max:radius+2, step:0.01, color:cc.ray },
			springK:{ min:0, max:5, step:0.01, color:cc.ray },
			dampingC:{ min:0, max:3, step:0.01, color:cc.ray },
			forceMultiply:{ min:0, max:10, step:0.01, color:cc.ray },
			// balance
			autoBalance:{ rename:'Balance', type:'bool', color:cc.balance },
			autoBalanceSpringK:{ rename:'B spring K', min:0, max:5, step:0.01, color:cc.balance },
			autoBalanceDampingC:{ rename:'B damp C', min:0, max:0.1, step:0.001, color:cc.balance },
			autoBalanceSpringOnY:{ rename:'B spring Y', min:0, max:5, step:0.01, color:cc.balance },
			autoBalanceDampingOnY:{ rename:'B damp Y', min:0, max:0.1, step:0.001, color:cc.balance },

		}

		this.v = {

			movingObjectVelocityInCharacterDir: new Vector3(),
			movingObjectVelocity: new Vector3(),
			bodyContactForce: new Vector3(),

			standingForcePoint: new Vector3(),

			pivotPosition: new Vector3(),
			//modelEuler: new Euler(),
			modelQuat: new Quaternion(),
			moveImpulse: new Vector3(),
			impulseCenter: new Vector3(),
			movingDirection: new Vector3(),
			moveAccNeeded: new Vector3(),
			jumpVelocityVec: new Vector3(),
			jumpDirection: new Vector3(),
			currentVel: new Vector3(),
			currentPos: new Vector3(),
			dragForce: new Vector3(),
			dragAngForce: new Vector3(),
			wantToMoveVel: new Vector3(),
			rejectVel: new Vector3(),

			// Floating Ray setup
			floatingForce:null,
			springDirVec: new Vector3(),
			rayOrigin: new Vector3(),
			characterMassForce: new Vector3(),

			// slope
			slopeAngle:null,
			actualSlopeAngle:null,
			actualSlopeNormalVec: new Vector3(),
			floorNormal: new Vector3(0, 1, 0),
			slopeRayOriginRef: new Vector3(),
			slopeRayorigin: new Vector3(),

			// autoBalance
			modelFacingVec: new Vector3(),
			bodyFacingVec: new Vector3(),
			bodyBalanceVec: new Vector3(),
			bodyBalanceVecOnX: new Vector3(),
			bodyFacingVecOnY: new Vector3(),
			bodyBalanceVecOnZ: new Vector3(),
			vectorY: new Vector3(0, 1, 0),
			vectorZ: new Vector3(0, 0, 1),

			canJump:false,
			isFalling:false,
			//run:false,
			isOnMovingObject:false,

		}

		//this.angvel = new Vector3();

		this.fixWeight = o.fixWeight !== undefined ? o.fixWeight : true;

		this.type = 'character';
		this.name = o.name || 'hero';
		o.name = this.name;

		this.isRay = false;
		this.rayHit = false;
		this.withRay = false;

		this.rays = [];
		this.model = null;
		this.static = false;
		this.moving = false;
		this.running = false;
		this.wantJump = false;

		this.prevAngle = -1

		//this.lod = -1;

		this.radius = radius;
		this.height = height;
		this.mass = o.mass || 1//0.84;
		
		delete o.radius;

		this.fall = false
		this.floor = true

		this.distance = 0
		this.rayAngle = 0
		this.rayStart = -(this.height*0.5)+this.radius;
		//this.rayEnd = this.rayStart - (radius + 2);//this.height;
		this.rayEnd = this.rayStart - (4*floatHeight);//this.height;
		this.maxRayDistance = this.height;

		this.contact = false

		// on moving object state
		this.massRatio = 1
		//this.isOnMovingObject = false;
		//this.standingForcePoint = new Vector3();
		this.movingObjectDragForce =  new Vector3();
		//this.movingObjectVelocity = new Vector3();
		//this.movingObjectVelocityInCharacterDir = new Vector3();
		//this.distanceFromCharacterToObject = new Vector3();
		//this.objectAngvelToLinvel = new Vector3();
		//this.velocityDiff = new Vector3();

		this.extraMatrix = new Matrix4() 


		//this.characterMassForce = new Vector3();
		
		//this.bodyContactForce = new Vector3();
		
		


		this.velocity = new Vector3();
		this.angular = new Vector3();

		this.tmpV1 = new Vector3()
		this.tmpV2 = new Vector3()
		this.tmpV3 = new Vector3()
		this.ease = new Vector3()
		this.tmpAcc = 0
		this.rs = 0
		this.ts = 0
		this.diagonal = 1/Math.sqrt(2)

		this.jump = false
		this.crouch = false
		this.toggle = true
		this.oy = 0
		this.vy = 0;

		this.timeScale = 1.25;

		this.angle = ( o.angle || 0 ) * torad

		

		this.speed = {
		    idle:1,
		    fight:1,
		    walk:7.8,
		    crouch:7,
		    run:12,
		}

		this.valheimStyle = true;
		this.globalRay = o.ray || false;

		this.callback = o.callback || function (){}

		if( o.callback ) delete o.callback

		this.initPhysic( o );

	}

	setHeight( H ) {

		if( this.model ) this.model.setRealSize( H );

	}

	reSizePhysics( h ) {
		
		if( h === this.realHeight ) return;

		this.realHeight = h;
		this.height = this.realHeight - (this.useFloating ? this.option.floatHeight : 0);
		let pos = this.position.toArray();
		pos[1] += (this.height*0.5) + (this.useFloating ? this.option.floatHeight : 0);
		let size = [ this.radius, this.height-(2*this.radius) ];

		this.phyData.pos = pos;
		this.phyData.size = size;

		this.motor.post({ m:'add', o:this.phyData });

	}

	initPhysic( o ){

	    if(!o.size) o.size = [ this.radius, this.height-(2*this.radius) ];
		if(!o.pos) o.pos = [0,0,0];

		o.pos[1] += this.height*0.5;
		if( this.useFloating ) o.pos[1] += this.option.floatHeight;

		if( this.globalRay ) this.motor.getGeometryRef( { ...o, type:'capsule', ray:true }, this, this.motor.mat.get('hide') )

		this.phyData = {

			name: this.name,
			size: o.size,
			pos: o.pos,
			type: 'character',
			shapeType: o.shapeType || 'capsule',
			//density: 1,//o.density || 1,
			mass: this.mass, 
			friction: o.friction !== undefined ? o.friction : 0.5,
			angularFactor:[0,0,0],
			group: 16,
			regular:true,
			getVelocity:true,

			massInfo: o.massInfo,
		}

		// lock rotation
		if(this.motor.engine === 'HAVOK') this.phyData['inertia'] = [0,0,0]

		if( o.mask ) this.phyData['mask'] = o.mask;

		//o.volume = MathTool.getVolume( 'capsule', o.size );
	

		// add to world
		this.motor.getCharacterRef().addToWorld( this, o.id );

        // add capsule to physics
        this.motor.post({ m:'add', o:this.phyData });

        this.extraRay = this.isPlayer

        

        // add bottom RAY
        if( this.useFloating ){ 
        	this.withRay = true;
        	let def = { type:'ray', callback:null, visible:false, parent:this.name, noRotation:true }//this.selfRay.bind(this)
        	this.rays.push( this.motor.add({ ...def, name:this.name + '_ray', begin:[0,this.rayStart,0], end:[0,this.rayEnd, 0] }) );
        	if(this.extraRay){
        		let r = this.radius*0.5;
        		let r2 = this.radius*0.12;
        		this.rays.push( this.motor.add({ ...def, name:this.name + '_ray_f', begin:[0,this.rayStart,r], end:[0,this.rayEnd, r] }) );
        		//this.rays.push( this.motor.add({ ...def, name:this.name + '_ray_b', begin:[0,this.rayStart,-r], end:[0,this.rayEnd, -r] }) );
        		this.rays.push( this.motor.add({ ...def, name:this.name + '_ray_l', begin:[r,this.rayStart,-r2], end:[r,this.rayEnd, -r2] }) );
        		this.rays.push( this.motor.add({ ...def, name:this.name + '_ray_r', begin:[-r,this.rayStart,-r2], end:[-r,this.rayEnd, -r2] }) );
        	}
        }



        // add skinning character model
        if( o.gender ) this.addModel( o );
        else this.showHelper( true );

        this.enable = true;
		
	}

	extraRemove(){
		// TODO bug with delete ray ?!
		if( this.withRay ){ 
			let j = this.rays.length, list = []
    	    while(j--) list[j] = this.rays[j].name
			this.motor.remove( list );
		}
	}

	/*clear(){
		root.motor.remove([this.name, this.name + '_ray']);
	}*/

	// https://rapier.rs/docs/user_guides/javascript/scene_queries/
	// hit.timeOfImpact ?? 
	//

	rotateRay( angle ){

		if(!this.isPlayer) return;
		if( angle === this.prevAngle) return;

		this.prevAngle = angle;

		this.extraMatrix.makeRotationY(angle)

		let j = this.rays.length, r
		while(j--){
			this.rays[j].applyRotation(this.extraMatrix);
		}

	}

	goodRay(){

		let dist = 1000

		let j = this.rays.length, r, goodData = { hit:false }
		while(j--){
			r = this.rays[j].data
			if(r.hit && r.distance<dist){ 
				dist = r.distance
				goodData = r
			}
		}

		return goodData

	}

    selfRay( r ){

    	const o = this.option
    	const v = this.v

    	if( r.hit ){

    		v.standingForcePoint.set(
    			r.point[0],
    			r.point[1]-r.distance,
    			r.point[2]
    		)

    		this.rayHit = true;
    		this.distance = r.distance;
    		this.rayAngle = r.angle;
    		v.canJump = true;
    		this.hitPoint = r.point;
    		this.hitObject = this.motor.byName(r.body);
    		let hitMass = this.hitObject.mass;
    		let type = this.hitObject.type;
    		if(hitMass === 0 && type ==='body') type = 'kinematic'
    		if(hitMass !== 0 ) this.massRatio = this.mass / hitMass;
    		this.motor.log(r.body + ' ' + hitMass + ' ' + type)

    		if(type === 'body' || type==='kinematic'){
    			v.isOnMovingObject = true;
    			// Calculate distance between character and moving object
    			tmpV0.copy( this.position ).sub( this.hitObject.position );
    			const linvel = this.hitObject.velocity;
		        const angvel = this.hitObject.angular;
		        // Combine object linear velocity and angular velocity to movingObjectVelocity
		        tmpV1.crossVectors( angvel, tmpV0 )
		        //movingObjectVelocity
		        v.movingObjectVelocity.set(
		        	linvel.x + tmpV1.x, 
		        	linvel.y,
		        	linvel.z + tmpV1.z
		        ).multiplyScalar( Math.min(1, 1 / this.massRatio) );
		        // If the velocity diff is too high (> 30), ignore movingObjectVelocity000
		        tmpV2.subVectors( v.movingObjectVelocity, this.velocity );
		        let diff = tmpV2.length();		        
		        if ( diff > 30) v.movingObjectVelocity.multiplyScalar(1 / diff );

		        // Apply opposite drage force to the stading rigid body, body type 0
		        // Character moving and unmoving should provide different drag force to the platform
		        if (type === 'body') {
		        }
    		} else { // on fixed body
	            this.resetMovingObject()
	        }

    		this.v.actualSlopeNormalVec.fromArray(r.normal)
    		this.v.actualSlopeAngle = this.v.actualSlopeNormalVec.angleTo(this.v.floorNormal);

    		// slope = pente 
    		if(this.distance<o.floatingDis + 0.5){
    			// Round the slope angle to 2 decimal places
    			if (this.v.canJump) v.slopeAngle = Math.atan( ( o.slopeRayLength- this.distance) / o.slopeRayOriginOffest ).toFixed(2)
    				else v.slopeAngle = 0;
    		} else {
    			v.slopeAngle = 0;
    		}

    	} else {
    		this.resetMovingObject()
    		this.rayHit = false;
	        this.distance = this.option.rayLength//maxRayDistance;
	        this.rayAngle = 0;
	        v.canJump = false;	
	        this.hitObject = null;    

	    }

    }

    resetMovingObject(){
    	this.massRatio = 1;
		this.v.isOnMovingObject = false;
		this.v.bodyContactForce.set(0, 0, 0);
		this.v.movingObjectVelocity.set(0, 0, 0)
    }

    hit( d ){

    	this.contact = d;

    }

    showHelper( b ){

    	if(b){
    		if(!this.helper){
    			this.helper = new CapsuleHelper(this.radius, this.height, true, this.motor.mat.get('line'), [1,0.6,0], [0.6,0.2,0] );
    			this.helper.setDirection( this.angle ) 
		        this.add( this.helper );
    		}
    	} else {
    		if(this.helper){
    			this.remove(this.helper);
    			this.helper.dispose();
    			this.helper = null;
    		}
    	}

    	let j = this.rays.length
    	while(j--) this.rays[j].visible = b

    }

    addSkeleton(){

    	if( this.skeletonBody ) return
    	if( !this.model ) return
    	//this.skeletonBody = new SkeletonBody( this )
        this.skeletonBody = new SkeletonBody( this.motor, this.name, this.model.root, this.model.skeleton.bones )
    	this.motor.scene.add( this.skeletonBody )
    	this.skeletonBody.isVisible( false )

    }

    debugMode( v = false ){

    	if( this.skeletonBody ) this.skeletonBody.isVisible(v)
    	//if( this.model ) this.model.setMaterial( { wireframe: v, visible:!v })
    	if( this.model && this.skeletonBody ) this.model.setMaterial( { transparent:v, opacity:v?0.8:1.0 }, !v )
    	
    	this.showHelper( v );
        

    }

    setMode( name ){

    	if( this.skeletonBody ) this.skeletonBody.setMode( name )

    	//this.skeletonBody = new SkeletonBody( this )
    	//this.model.add( this.skeletonBody )

    }

	addModel( o ){

		this.model = new Avatar({ 
			type:o.gender, 
			anim: o.anim !== undefined ? o.anim : 'idle', 
			compact:true, 
			material:!o.noMat, 
			morph:o.morph || false, 
			randomMorph:o.randomMorph || false,
			randomSize:o.randomSize || false,
			callback:this.callback,
			fixWeight: this.fixWeight,
			noLOD : o.noLOD || false,
		});

		this.add( this.model );
		///this.model.rotation.order = 'YXZ'
		let ypos = -(this.height*0.5)
		if( this.useFloating ) ypos -= this.option.floatHeight
		this.model.setPosition(0, this.model.decalY + ypos, 0);
		this.model.rotation.y = this.angle;
		this.model.updateMatrix();

	}

	raycast(){
		return;// false;
	}

	/*preStep(){
		if(this.skeletonBody) this.skeletonBody.update()
	}*/

	step ( AR, n ) {

		if( this.withRay ) this.selfRay(this.goodRay())
		
		this.position.fromArray( AR, n + 1 );
		this.quaternion.fromArray( AR, n + 4 );
		this.velocity.fromArray( AR, n + 8 );
		this.angular.fromArray( AR, n + 11 );

		//this.rotation.y = this.angle;

		this.fall = this.position.y < this.oy
		this.floor = MathTool.nearEquals(this.position.y, this.oy, 0.1)
		this.oy = this.position.y;

		this.v.currentPos.copy(this.position);
	    this.v.currentVel.copy(this.velocity);
		

		if( this.model ) {
			this.model.update( this.motor.delta );
			this.getDistanceToCamera()
		}


		if( this.useFloating && !this.isPlayer ){ 

			this.stopMoving();

			this.getFloating();

	    	this.motor.change({

			    name:this.name,
			    impulse: this.v.moveImpulse.toArray(), 
			    impulseCenter: this.v.impulseCenter.toArray(),

			});

	    }

		//if(this.skeletonBody) this.skeletonBody.update()
		this.updateMatrix();

	}

	getDistanceToCamera () {

		if( !this.model ) return
		if( !this.model.haveLOD ) return

		const camera = this.motor.getCamera();
		this.tmpV1.setFromMatrixPosition( camera.matrixWorld );
		//this.tmpV1.copy( this.motor.getCurrentCharacterPosition() );
		this.tmpV2.copy( this.position );//setFromMatrixPosition( this.matrixWorld );
		//this.tmpV3.copy( this.motor.getCurrentCharacterPosition() );

		let distance = this.tmpV1.distanceTo( this.tmpV2 ) / camera.zoom;

		//console.log(distance)

		let level = distance > 5 ? 0 : 1;
		//if( level !== this.lod ){
		//	this.lod = level;
		this.model.setLevel( level );
		
	}

	set ( o ) {

		//console.log('set', o)
		if(o.morph){
			if(this.model) this.model.setMorph( o.morph, o.value );
		}

	}

	dispose () {

		//console.log('dispose')

		this.callback = null
		if( this.skeletonBody ) this.skeletonBody.dispose()
		if( this.model ) this.model.dispose()
		if( this.helper ) this.showHelper()

		//if( this.ray ) root.motor.remove( this.name + '_ray' );
	    //this.ray = null;

		//this.ray.dispose()

		//console.log('model remove')

		//super.dispose()
	}

	onFrame ( state, delta ){

		const v = this.v;
		const o = this.option;

	}

	autoBalance (){

		const v = this.v
		const o = this.option;
		const r = this.rotation;

		v.bodyFacingVec.set(0, 0, 1).applyQuaternion(this.quaternion)
	    v.bodyBalanceVec.set(0, 1, 0).applyQuaternion(this.quaternion)

	    v.bodyBalanceVecOnX.set(0, v.bodyBalanceVec.y, v.bodyBalanceVec.z)
	    v.bodyFacingVecOnY.set(v.bodyFacingVec.x, 0, v.bodyFacingVec.z)
	    v.bodyBalanceVecOnZ.set(v.bodyBalanceVec.x, v.bodyBalanceVec.y, 0)

	    /*if (isModeCameraBased && slopeRayOriginRef.current) {
	        modelEuler.y = pivot.rotation.y
	        pivot.getWorldDirection(modelFacingVec)
	        // Update slopeRayOrigin to new positon
	        slopeRayOriginUpdatePosition.set(movingDirection.x, 0, movingDirection.z)
	        camBasedMoveCrossVecOnY.copy(slopeRayOriginUpdatePosition).cross(modelFacingVec)
	        slopeRayOriginRef.current.position.x = slopeRayOriginOffest * Math.sin(slopeRayOriginUpdatePosition.angleTo(modelFacingVec) * (camBasedMoveCrossVecOnY.y < 0 ? 1 : -1))
	        slopeRayOriginRef.current.position.z = slopeRayOriginOffest * Math.cos(slopeRayOriginUpdatePosition.angleTo(modelFacingVec) * (camBasedMoveCrossVecOnY.y < 0 ? 1 : -1))
	    } else {
	        characterModelIndicator.getWorldDirection(modelFacingVec)
	    }*/

	    v.crossVecOnX.copy(v.vectorY).cross(v.bodyBalanceVecOnX);
	    v.crossVecOnY.copy(v.modelFacingVec).cross(v.bodyFacingVecOnY);
	    v.crossVecOnZ.copy(v.vectorY).cross(v.bodyBalanceVecOnZ);

		v.dragAngForce.set(
		    (v.crossVecOnX.x < 0 ? 1 : -1) * o.autoBalanceSpringK * (v.bodyBalanceVecOnX.angleTo(v.vectorY)) - this.angular.x * o.autoBalanceDampingC,
		    (v.crossVecOnY.y < 0 ? 1 : -1) * o.autoBalanceSpringOnY * (v.modelFacingVec.angleTo(v.bodyFacingVecOnY)) - this.angular.y * o.autoBalanceDampingOnY,
		    (v.crossVecOnZ.z < 0 ? 1 : -1) * o.autoBalanceSpringK * (v.bodyBalanceVecOnZ.angleTo(v.vectorY)) - this.angular.z * o.autoBalanceDampingC,
		)

		/*v.dragAngForce.set(
		    -o.autoBalanceSpringK * r.x - this.angular.x * o.autoBalanceDampingC,
		    -o.autoBalanceSpringK * r.y - this.angular.y * o.autoBalanceDampingOnY,
		    -o.autoBalanceSpringK * r.z - this.angular.z * o.autoBalanceDampingC
		)*/

		// Apply balance torque impulse
        //characterRef.current.applyTorqueImpulse(dragAngForce, true)
        this.motor.change({
			name:this.name,
			angularImpulse: this.v.dragAngForce.toArray(),
		});

	}

	

	moveCharacter ( delta, angle = 0 ){

		const v = this.v;
		const o = this.option;
		const key = this.motor.getKey();
		const azimut = this.motor.getAzimut();

		
		

		//v.currentPos.copy(this.position);
	    //v.currentVel.copy(this.velocity);

		

		//v.movingObjectVelocity = 
		//v.slopeAngle = 0//azimut;



	    // Setup moving direction

	    // Only apply slope extra force when slope angle is between 0.2-slopeMaxAngle, actualSlopeAngle < slopeMaxAngle
	    if ( v.actualSlopeAngle < o.slopeMaxAngle &&  Math.abs(v.slopeAngle) > 0.2 && Math.abs(v.slopeAngle) < o.slopeMaxAngle ) {
	    	v.movingDirection.set(0, Math.sin(v.slopeAngle), Math.cos(v.slopeAngle));
	    } else if ( v.actualSlopeAngle >= o.slopeMaxAngle ) {
	    	v.movingDirection.set( 0, Math.sin(v.slopeAngle) > 0 ? 0 : Math.sin(v.slopeAngle), Math.sin(v.slopeAngle) > 0 ? 0.1 : 1 );
	    } else {
	    	v.movingDirection.set(0, 0, 1);
	    }



	    // Apply character quaternion to moving direction
	    //if( this.model ) v.movingDirection.applyQuaternion( this.model.quaternion );
	    v.movingDirection.applyAxisAngle( {x:0, y:1, z:0}, angle );

	    /**
        * Moving object conditions
        */

	    // Calculate moving object velocity direction according to character moving direction
	    v.movingObjectVelocityInCharacterDir.copy(v.movingObjectVelocity).projectOnVector(v.movingDirection).multiply(v.movingDirection);
	    // Calculate angle between moving object velocity direction and character moving direction
	    const angleBetweenCharacterDirAndObjectDir = v.movingObjectVelocity.angleTo(v.movingDirection);

	    //Setup rejection velocity, (currently only work on ground)

	    const wantToMoveMeg = v.currentVel.dot(v.movingDirection);
	    v.wantToMoveVel.set( v.movingDirection.x * wantToMoveMeg, 0, v.movingDirection.z * wantToMoveMeg );
	    v.rejectVel.copy(v.currentVel).sub(v.wantToMoveVel);

	    // Calculate required accelaration and force: a = Δv/Δt
	    // If it's on a moving/rotating platform, apply platform velocity to Δv accordingly
	    // Also, apply reject velocity when character is moving opposite of it's moving direction
	    
	    v.moveAccNeeded.set(
	        (v.movingDirection.x * (o.maxVelLimit * (this.running ? o.sprintMult : 1) + v.movingObjectVelocityInCharacterDir.x) - (v.currentVel.x - v.movingObjectVelocity.x * Math.sin(angleBetweenCharacterDirAndObjectDir) + v.rejectVel.x * (v.isOnMovingObject ? 0 : o.rejectVelMult))) / o.accDeltaTime,
	        0,
	        (v.movingDirection.z * (o.maxVelLimit * (this.running ? o.sprintMult : 1) + v.movingObjectVelocityInCharacterDir.z) - (v.currentVel.z - v.movingObjectVelocity.z * Math.sin(angleBetweenCharacterDirAndObjectDir) + v.rejectVel.z * (v.isOnMovingObject ? 0 : o.rejectVelMult))) / o.accDeltaTime
	    );

	    // Wanted to move force function: F = ma
	    const moveForceNeeded = v.moveAccNeeded.multiplyScalar( this.mass );

	    //console.log(this.mass)

  
	    // Check if character complete turned to the wanted direction
	    //let characterRotated = Math.sin(this.rotation.y).toFixed(3) == Math.sin(v.modelEuler.y).toFixed(3);
	    let characterRotated = true;
	    if( this.waitRotation ) characterRotated = Math.sin( angle ).toFixed(3) == Math.sin(this.rotation.y).toFixed(3);

	    // If character hasn't complete turning, change the impulse quaternion follow characterModelRef quaternion
	    if ( !characterRotated ) {
	    	v.moveImpulse.set(
	    		moveForceNeeded.x * o.turnVelMultiplier * (v.canJump ? 1 : o.airDragMultiplier), // if it's in the air, give it less control
	    		v.slopeAngle === null || v.slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
	            ? 0 : v.movingDirection.y * o.turnVelMultiplier *
	            (v.movingDirection.y > 0 // check it is on slope up or slope down
	            ? o.slopeUpExtraForce : o.slopeDownExtraForce) * (this.running ? o.sprintMult : 1),
	            moveForceNeeded.z * o.turnVelMultiplier * (v.canJump ? 1 : o.airDragMultiplier) // if it's in the air, give it less control
	        );
	    }
	    // If character complete turning, change the impulse quaternion default
	    else {
	        v.moveImpulse.set(
	        	moveForceNeeded.x * (v.canJump ? 1 : o.airDragMultiplier),
	        	v.slopeAngle === null || v.slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
	        	? 0 : v.movingDirection.y * (v.movingDirection.y > 0 // check it is on slope up or slope down
	            ? o.slopeUpExtraForce : o.slopeDownExtraForce) * (this.running ? o.sprintMult : 1),
	            moveForceNeeded.z * (v.canJump ? 1 : o.airDragMultiplier)
	        );
	    }


	    v.impulseCenter.set( v.currentPos.x, v.currentPos.y + o.moveImpulsePointY, v.currentPos.z );

	    /*this.motor.change({

		    name:this.name,
		    impulse: this.v.moveImpulse.toArray(), 
		    impulseCenter: this.v.impulseCenter.toArray(),
		    //linearVelocity:this.v.jumpDirection.toArray()

		});*/

	    // Character current velocity
	    //v.currentVel.copy(this.velocity);

	    // Jump impulse

	    /*if ( key[4] && v.canJump ) {
	    	v.jumpVelocityVec.set( v.currentVel.x, this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel, v.currentVel.z );
	    	v.moveImpulse.y = v.jumpVelocityVec.y
	    }*/

	   //v.jumpDirection.set(0, ( this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel ) * o.slopJumpMult, 0).projectOnVector(v.actualSlopeNormalVec).add(v.jumpVelocityVec)
	    //root.motor.change({ name:this.name, linearVelocity:v.jumpDirection.toArray() });

	}

	jumping () {

		const v = this.v;
		const o = this.option;

		//if(v.canJump) return

		

		//this.v.canJump = false

	    v.jumpVelocityVec.set( v.currentVel.x, this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel, v.currentVel.z );
    	v.jumpDirection.set(0, ( this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel ) * o.slopJumpMult, 0).projectOnVector(v.actualSlopeNormalVec).add(v.jumpVelocityVec)
        
        this.motor.change({

		    name:this.name,
		    linearVelocity:this.v.jumpDirection.toArray()

		});
	}

	getFloating (){
		
		const v = this.v;
		const o = this.option;

		if(this.rayHit){
			const dist = o.floatingDis - this.distance
		    const floatingForce = ( o.springK * dist ) - ( this.velocity.y * o.dampingC );
		    v.moveImpulse.y = floatingForce * this.mass;

		    // Apply opposite force to standing object
		    this.v.characterMassForce.set(0, floatingForce > 0 ? -floatingForce : 0, 0);
		    if(this.hitObject.mass !== 0 ){
			    this.motor.change({
				    name:this.hitObject.name,
				    impulse: this.v.characterMassForce.toArray(), 
				    impulseCenter: this.v.standingForcePoint.toArray(),
				});
			}
		    
		}

		//this.motor.log('D:'+ this.distance + ' F:'+floatingForce)
		
	}

	applyDragForce() {

		const v = this.v;
		const o = this.option;

		let autowake = false
		/**
	    * Apply drag force if it's not moving
	    */
	    if (this.moving) return 
        
        if (!v.isOnMovingObject) {// not on moving object just slow down velocity
            v.dragForce.set(
            	-v.currentVel.x * o.slowDown,
            	0,
            	-v.currentVel.z * o.slowDown
            );
	    
	    } else {// on a moving object
	    	
	        v.dragForce.set(
	            (v.movingObjectVelocity.x - v.currentVel.x), //* o.slowDown,
	            0,
	            (v.movingObjectVelocity.z - v.currentVel.z) //* o.slowDown
	        );

	        autowake = true;
	    }

	    v.dragForce.multiplyScalar( this.mass );

	    v.moveImpulse.add(v.dragForce)

	    
	    /*this.motor.change({
			name:this.name,
			impulse: v.dragForce.toArray(),
		});*/
    
	}

	stopMoving (){
		
		const v = this.v;    
		const o = this.option;

		this.v.moveImpulse.set(0,0,0);

		this.applyDragForce();

		// slowdown

		/*this.tmpV1.copy(this.velocity)//.multiplyScalar( 0.9 )
		this.tmpV1.x *= 0.9;
		this.tmpV1.z *= 0.9;

		if(this.tmpV1.x + this.tmpV1.z === 0 ) return;

		this.motor.change({

		    name:this.name,
		    //force: this.tmpV1.toArray(), forceMode:'velocity', 
		    linearVelocity: this.tmpV1.toArray(),
		    //angularVelocity: this.tmpV2.toArray(),
		    wake:false,
		    //noGravity:true 
		});*/

	}

	move () {

		const v = this.v;

		const key = this.motor.getKey();
		const azimut = this.motor.getAzimut();
		const delta = this.motor.delta;
		
		// 1°/ find the good animation

		let anim = key[7] !== 0 ? 'run' : 'walk';
	    if( key[0] === 0 && key[1] === 0 ) anim = 'idle';//*= 0.9
	    let m = key[0] !== 0 && key[1] !== 0 ? this.diagonal : 1;

	    if( key[5] && this.toggle ){ 
	    	this.crouch = !this.crouch;
	    	this.toggle = false;
	    }
	    if( key[5] === 0 ) this.toggle = true;
	    if( ( anim==='walk' || anim==='run') && this.crouch ) anim = 'crouch';
	    if( key[6] === 1 ) anim = 'fight';

	    if( !this.jump && key[4] ){ this.vy = 22; this.jump = true; } // SPACE KEY

	    if( this.jump ){
	        this.vy-=1;
	        if(this.vy <= 0 ){ 
	            this.vy = 0; 
	            if( this.floor ) this.jump = false;

	            //if( MathTool.nearEquals(this.position.y, this.oy, 0.1)) this.jump = false;
	            //this.position.y === this.oy 
	        }
	    }

	    let mAnim = 'idle'
	    switch( anim ){
	    	case 'idle': mAnim = this.crouch ? 'Crouch Idle' : 'idle'; break;
	    	case 'walk': mAnim = 'Jog Forward'; break;
	    	case 'run': mAnim = 'Standard Run'; break;
	    	case 'crouch': mAnim = 'Crouch Walk'; break;
	    	case 'fight': mAnim = 'Attack'; break;
	    }

	    this.moving = key[0] !== 0 || key[1] !== 0;
	    this.running = key[7] !== 0;
	    this.wantJump = key[4] !== 0;

	    let angle = MathTool.unwrapRad( ( Math.atan2(key[0], key[1])) + azimut );


	    // 2°/ physic control

	    if( this.useImpulse ) {

	    	if( this.moving ) this.moveCharacter( delta, angle );
	    	else this.stopMoving();

	    	if( this.wantJump ) this.jumping()
	    	//else this.v.jumpDirection.copy(this.v.currentVel)

	        if( this.useFloating ) this.getFloating();

	        //this.applyDragForce()

	    	this.motor.change({

			    name:this.name,
			    impulse: this.v.moveImpulse.toArray(), 
			    impulseCenter: this.v.impulseCenter.toArray(),
			    //linearVelocity:this.v.jumpDirection.toArray()

			});

			

	    } else { // old method

	    	this.tmpAcc += delta*4//MathTool.lerp( tmpAcc, 1, delta/10 )
	        //this.tmpAcc += MathTool.lerp( this.tmpAcc, 1, delta/10 )
	        //this.tmpAcc = MathTool.clamp( this.tmpAcc, 1, speed )

	        const genSpeed = 1.0;

	   		let speed = this.speed[anim] * genSpeed;

	        //this.rs += key[0] //* this.tmpAcc 
	        //this.ts += key[1] //* this.tmpAcc
			if( this.moving ){
		        this.rs = key[0] * speed; 
		        this.ts = key[1] * speed;
		    }

		    if( key[0] === 0 && key[1] === 0 ) this.tmpAcc = 0//*= 0.9
		    if( this.tmpAcc>1 ) this.tmpAcc = 1;

		    this.ease.set( this.rs, 0, this.ts ).multiplyScalar( this.tmpAcc * m )

		    //let angle = math.unwrapRad( (Math.atan2(this.ease.z, this.ease.x)) + azimut );
		    //let angle = MathTool.unwrapRad( ( Math.atan2(key[0], key[1])) + azimut );
	    

		    let acc = this.ease.length(); //((Math.abs(this.ease.x) + Math.abs(this.ease.z)))

	        if( this.static ) this.ease.x = this.ease.z = 0

		    let g = this.vy - 9.81;
		    this.ease.y = g;
		    this.tmpV1.copy( this.ease ).applyAxisAngle( { x:0, y:1, z:0 }, azimut );
		    //math.tmpV2.set( 0, rs, 0 );
		    this.tmpV2.set( 0, 0, 0 );

	    	this.motor.change({

			    name:this.name,
			    //force: this.tmpV1.toArray(), forceMode:'velocity', 
			    linearVelocity: this.tmpV1.toArray(), 
			    //angularVelocity: this.tmpV2.toArray(),
			    //wake:true, 
			    //noGravity:true 
			});
	    }



		if( this.helper ){ 

			this.helper.updateMatrix()
			this.helper.cone.rotation.y = azimut//angle
			if( anim !== 'idle' ) this.helper.setDirection( angle ) 

		}

	   if( anim !== 'idle' ) this.rotateRay( angle )


	   // if(anim!=='idle') this.model.setRotation( 0, azimut + Math.PI, 0, 0.25 )
        
        if( !this.model ) return


        //const distanceToCamera = this.getDistanceToCamera();

        //if()

        //this.model.setTimescale(this.tmpAcc)

        //this.model.setWeight( 'idle', 1-jj )
	    /*this.model.setWeight( 'Jog Forward', -this.ease.x )
	    this.model.setWeight( 'Jog Backward', this.ease.x )
	    this.model.setWeight( 'Jog Strafe Left',-this.ease.z )
	    this.model.setWeight( 'Jog Strafe Right', this.ease.z )*/
	    
	   

	    //if(anim!=='idle') this.model.syncro('Jog Forward')

	    //console.log(tmpAcc)

        
	    if( this.jump ){
	    	this.model.play( 'Jump', 0.5 )
	    	//this.model.setTimescale( 1 )
	    }else {

	    	this.model.play( mAnim, 0.75 )
	    	//this.model.setTimescale( this.timeScale )
	    	//this.model.setTimescale( 1 )
	    }

	    if( anim !== 'idle' ){

	    	//this.model.setTimescale( 2.0 )

	    	let pp = MathTool.unwrapRad( this.model.rotation.y )
	    	//if( anim === 'fight' ) pp = math.unwrapRad( azimut + Math.PI )
	    	let aa = MathTool.nearAngle( angle, pp )
	    	let diff = Math.abs(Math.floor((pp - aa)*math.todeg)/180)
	    	//console.log(diff)
	    	//this.model.rotation.y = anim === 'fight' ? (azimut + Math.PI) : math.lerp( pp, aa, 0.25 )
	    	this.model.rotation.y = anim === 'fight' ? (azimut + Math.PI) : MathTool.lerp( pp, aa, 0.2 - (diff*0.1) )
	    	this.model.updateMatrix()
	    	//this.model.setTimescale( this.tmpAcc * (1*genSpeed) )

	    	


	    	
	    	//this.rotateRay( this.model.rotation.y )

	    	//let m = this.model.getAction( anim )
	    	//if( m ) m.setEffectiveTimeScale( this.tmpAcc * (1*genSpeed) );
	    	//if( m ) m.setEffectiveTimeScale( 0 );
	    }

	    //if( this.helper ) this.helper.setDirection( this.model.rotation.y )

	}


}