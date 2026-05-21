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

		this._timeScale = 1
		this.matrixAutoUpdate = false;

		this.motor = motor;
		this.utils = this.motor.utils;

		this.isCharacter = true;
		this.isPlayer = o.isPlayer || false;
		this.enable = false

		this.useImpulse = o.useImpulse || false;
		this.useFloating = o.floating || false;

		this.waitRotation = false;

		this.Oanim = ''
		this.Canim = ''

		let floatHeight = 0.3;
		let radius = o.radius || 0.3;
		let height = o.height || 1.81;//0.7

		this.realHeight = height;

		if(this.useFloating){
			height -= floatHeight
		}

		this.option = {

			debug: false,
			
			floatHeight: floatHeight,

			// Follow camera setups
			camInitDis: -5,
			camMaxDis: -7,
			camMinDis: -0.7,
			// Base control setups
			maxVelLimit: 1,//2.235,//5,//2.5,
			turnVelMultiplier: 0.2,
			turnSpeed: 15,
			sprintMult: 2.94,//2
			crouchMult: 0.442,//2
			crawlMult: 0.506,//2
			jumpVel: 5,//4,
			jumpForceToGroundMult: 5,
			slopJumpMult: 0.25,
			sprintJumpMult: 1.2,
			airDragMultiplier: 0.2,
			slowDown: 0.9,//dragDamping // 0.15,
			accDeltaTime: 8,
			rejectVelMult: 4,
			moveImpulsePointY: 0.5,
			camFollowMult: 11,
			initialGravityScale:1,
			fallingGravityScale: 2.5,
			fallingMaxVel: -20,
			wakeUpDelay: 200,
			// Floating Ray setups
			rayOriginOffest: { x: 0, y: -height*0.5, z: 0 },
			rayHitForgiveness: 0.1,
			rayDir: { x: 0, y: -1, z: 0 },

			//floatingDis: radius + floatHeight, //+ 0.08,
			Spring: 4,//2,,
			Damping: 0.5,//0.2,,
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
			autoBalanceSpring: 0.3,//1.2,//0.3,
			autoBalanceDamping: 0.03,//0.04,
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
			maxVelLimit:{ rename:'Max Vel', min:0, max:2, step:0.01, color:cc.speed },
			turnVelMultiplier:{ rename:'Turn Vel', min:0, max:1, step:0.01, color:cc.speed },
			turnSpeed:{ min:5, max:30, step:0.1, color:cc.speed },
			//sprintMult:{ min:1, max:5, step:0.01, color:cc.speed },
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

			floatHeight:{ min:0, max:radius*3, step:0.01, color:cc.ray },

			rayHitForgiveness:{ rename:'Forgiveness', min:0, max:0.5, step:0.01, color:cc.ray },
			//rayLength:{ min:0, max:radius+10, step:0.01, color:cc.ray },
			Spring:{ min:0, max:5, step:0.01, color:cc.ray },
			Damping:{ min:0, max:3, step:0.01, color:cc.ray },
			forceMultiply:{ min:0, max:10, step:0.01, color:cc.ray },
			// balance
			/*autoBalance:{ rename:'Balance', type:'bool', color:cc.balance },
			autoBalanceSpring:{ rename:'B spring K', min:0, max:5, step:0.01, color:cc.balance },
			autoBalanceDamping:{ rename:'B damp C', min:0, max:0.1, step:0.001, color:cc.balance },
			autoBalanceSpringOnY:{ rename:'B spring Y', min:0, max:5, step:0.01, color:cc.balance },
			autoBalanceDampingOnY:{ rename:'B damp Y', min:0, max:0.1, step:0.001, color:cc.balance },**/

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
			slopeAngle:0,
			actualSlopeAngle:0,
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
			inJump:false,
			endJump:false,
			startJump:false,
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

		this.gravityScale = 1;

		//this.lod = -1;

		this.radius = radius;
		this.height = height;
		this.mass = o.mass || 1//0.84;
		
		delete o.radius;

		this.fall = false
		this.floor = true

		this.distance = 0
		this.rayAngle = 0
		this.maxRayDistance = 4*this.radius;
		this.rayStart = -(this.height*0.5)+this.radius;
		this.rayEnd = this.rayStart - this.maxRayDistance;
		


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

		//this.timeScale = 1.25;

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

	set timeScale( v ){

		this._timeScale = v;
		this.option.maxVelLimit = 1 * this._timeScale
		if(this.model) this.model.animator.timeScale = this._timeScale 

	}

	get timeScale(){
		return this._timeScale
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

		if( this.globalRay ) this.motor.getGeometryRef( {  ...o, type:'capsule', ray:true,  }, this, this.motor.mat.get('hide') )

		let h = this.height-(2*this.radius)
	    this.startHeight = h*0.5;
		this.shapes = [{ type:'sphere', pos:[0,-this.startHeight,0], size:[ this.radius ] }, { type:'sphere', pos:[0,this.startHeight,0], size:[ this.radius ] }]

		this.phyData = {

			name: this.name,
			size: o.size,
			pos: o.pos,
			type: 'character',

			shapeType:'compound',
			shapes:this.shapes,
			//shapeType: o.shapeType || 'capsule',
			//density: 1,//o.density || 1,
			mass: this.mass,
			friction: o.friction !== undefined ? o.friction : 0.0,//0.5
			angularFactor:[0,0,0],
			group: 16,
			mask: 1|2|16,
			regular:true,
			getVelocity:true,

			massInfo: o.massInfo,
		}

		// lock rotation
		if( this.motor.engine === 'HAVOK' ) this.phyData['inertia'] = [0,0,0]

		if( o.mask ) this.phyData['mask'] = o.mask;

		//o.volume = MathTool.getVolume( 'capsule', o.size );
	

		// add to world
		this.motor.getCharacterRef().addToWorld( this, o.id );

        // add capsule to physics
        this.motor.post({ m:'add', o:this.phyData });

        this.extraRay = this.isPlayer;


        // add bottom RAY
        if( this.useFloating ){ 
        	this.withRay = true;
        	let def = { type:'ray', callback:null, visible:false, parent:this.name, noRotation:true, mask:1|2 }//this.selfRay.bind(this)
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

	setPhysicsHeight( h ) {

		if(this.useFloating){
			h -= this.option.floatHeight
		}

		let d = (h*0.5)-this.radius;
		let dif = this.startHeight - d;
		phy.change({ name:this.name, editShape:[{ pos:[0,-this.startHeight,0] }, { pos:[0,d-(dif),0] }] })

		if( this.helper ){
		    
			this.helper.resize(h);
			this.helper.position.y = -dif;
		}

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

	upRay(){

		this.basedist = this.maxRayDistance
		this.rayData = { hit:false }

		let j = this.rays.length, r
		while(j--){
			r = this.rays[j].data
			if( r.hit ){ 
				if(r.distance < this.basedist){
					this.basedist = r.distance
				    this.rayData = {...r}
				}
			}
		}

		//this.rays[0].data = {...r}

		//return goodData

	}

	rotateRay( angle ){

		if(!this.isPlayer) return;
		if( angle === this.prevAngle) return;

		this.prevAngle = angle;

		this.extraMatrix.makeRotationY(angle)

		let j = this.rays.length, r
		while(j--){
			if(j!==0) this.rays[j].applyRotation(this.extraMatrix);
		}

	}

	/*goodRay(){

		this.basedist = this.option.rayLength

		let j = this.rays.length, r, goodData = { hit:false }
		while(j--){
			r = this.rays[j].data
			if( r.hit ){ 
				if(r.distance < this.basedist){
					this.basedist = r.distance
				    goodData = r
				}
			}
		}

		//this.rays[0].data = {...r}

		return goodData

	}*/

    selfRay(){

    	const o = this.option
    	const v = this.v
    	const r = this.rayData

    	if(!r) return

    	const floatingDis = this.radius + o.floatHeight;

    	// jump condition only on central ray
    	const rc = r//this.rays[0].data
		if(rc.hit && rc.distance < floatingDis + o.rayHitForgiveness){
			if(v.actualSlopeAngle < o.slopeMaxAngle) {
				v.canJump = true;
				v.startJump = false;
			}
		}else{
			v.canJump = false;
		}
 
    	if( r.hit && !v.startJump ){ //&& v.canJump

    		v.standingForcePoint.set(
    			r.point[0],
    			r.point[1]-r.distance,
    			r.point[2]
    		)

    		this.rayHit = true;
    		this.distance = r.distance;
    		this.rayAngle = r.angle;

    		//this.hitPoint = r.point;
    		this.hitObject = this.motor.byName(r.body);
    		let hitMass = this.hitObject.mass;
    		let type = this.hitObject.type;
    		if(hitMass === 0 && type ==='body') type = 'kinematic'
    		if(hitMass !== 0 ) this.massRatio = this.mass / hitMass;

    		//this.motor.log(r.body + ' ' + hitMass + ' ' + type)

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

    		v.actualSlopeNormalVec.fromArray(r.normal)
    		v.actualSlopeAngle = v.actualSlopeNormalVec.angleTo(v.floorNormal);

    		

    		// slope = pente 
    		if(this.distance<floatingDis + 0.5){
    			// Round the slope angle to 2 decimal places
    			if (v.canJump) v.slopeAngle = Math.atan( ( o.slopeRayLength- this.distance) / o.slopeRayOriginOffest ).toFixed(2)
    			else v.slopeAngle = 0;
    		} else {
    			v.slopeAngle = 0;
    		}

    	} else {
    		this.resetMovingObject()
    		this.rayHit = false;
	        this.distance = this.maxRayDistance;
	        this.rayAngle = 0;
	        v.canJump = false;	
	        this.hitObject = null;  
	        //this.motor.log('no hit')

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
    	//console.log(d)

    }

    showHelper( b ){

    	if(b){
    		if(!this.helper){
    			this.helper = new CapsuleHelper( this.radius, this.height, true, this.motor.mat.get('line'), [1,0.6,0], [0.6,0.2,0] );
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

    addSkeleton( visible = false ){

    	if( !this.model ) return
    	if( this.skeletonBody ) return
    	//this.skeletonBody = new SkeletonBody( this )
        this.skeletonBody = new SkeletonBody( this.motor, this.name, this.model.root, this.model.skeleton.bones )
    	//this.motor.scene.add( this.skeletonBody )
    	this.add( this.skeletonBody )
    	this.skeletonBody.isVisible( visible )

    }

    removeSkeleton(){
    	if( !this.skeletonBody ) return
    	this.skeletonBody.dispose()
        this.skeletonBody = null;
    }

    debugMode( v = false ){

    	if( this.skeletonBody ) this.skeletonBody.isVisible(v)
    	//if( this.model ) this.model.setMaterial( { wireframe: v, visible:!v })
    	if( this.model && this.skeletonBody ) this.model.setMaterial( { transparent:v, opacity:v?0.8:1.0, alphaTest:0.02 }, !v )
    	
    	this.showHelper( v );
        

    }

    setMode( name ){

    	if( this.skeletonBody ) this.skeletonBody.setMode( name )

    	//this.skeletonBody = new SkeletonBody( this )
    	//this.model.add( this.skeletonBody )

    }

	addModel( o ) {

		this.model = new Avatar({ 
			type:o.gender, 
			anim: o.anim !== undefined ? o.anim : 'Idle', 
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
		let ypos = -(this.height*0.5)+0.05
		if( this.useFloating ) ypos -= this.option.floatHeight
		this.model.setPosition(0, this.model.decalY + ypos, 0);
		this.model.rotation.y = this.angle;
		this.model.updateMatrix();

		this.timeScale = 2

		if(this.isPlayer) this.addSkeleton();

	}

	raycast(raycaster, intersects){
		if(this.model) return this.model.raycast(raycaster, intersects)
		return;// false;
	}

	preStep(){

		if( this.withRay ) this.upRay()

		//if(this.isPlayer) this.move()

		//if(this.skeletonBody) this.skeletonBody.updateMatrix()

		//if(this.isPlayer) this.move()
		//if(this.skeletonBody) this.skeletonBody.update()
	}

	step ( AR, n ) {



		if( this.withRay ){ 
			this.selfRay()//this.goodRay())
		}

		
		
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

	    if(this.isPlayer) this.move()
		

		


		if( this.useFloating && !this.isPlayer ){ 

			this.stopMoving();

			this.getFloating();

	    	this.motor.change({

			    name:this.name,
			    impulse: this.v.moveImpulse.toArray(), 
			    impulseCenter: this.v.impulseCenter.toArray(),

			});

	    }

	    

	    this.updateMatrix();

	    if( this.model ) {
	    	this.model.updateMatrix()
	    	if(this.skeletonBody) this.skeletonBody.updateMatrixWorld()
		    this.model.update( this.motor.delta );
			//this.model.update( this.motor.getDelta() );
			this.getDistanceToCamera()
			
		}


		//if(this.isPlayer) this.move()

		
	    

		//
		
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
		if( this.skeletonBody ) this.removeSkeleton()
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
		    (v.crossVecOnX.x < 0 ? 1 : -1) * o.autoBalanceSpring * (v.bodyBalanceVecOnX.angleTo(v.vectorY)) - this.angular.x * o.autoBalanceDamping,
		    (v.crossVecOnY.y < 0 ? 1 : -1) * o.autoBalanceSpringOnY * (v.modelFacingVec.angleTo(v.bodyFacingVecOnY)) - this.angular.y * o.autoBalanceDampingOnY,
		    (v.crossVecOnZ.z < 0 ? 1 : -1) * o.autoBalanceSpring * (v.bodyBalanceVecOnZ.angleTo(v.vectorY)) - this.angular.z * o.autoBalanceDamping,
		)

		/*v.dragAngForce.set(
		    -o.autoBalanceSpring * r.x - this.angular.x * o.autoBalanceDamping,
		    -o.autoBalanceSpring * r.y - this.angular.y * o.autoBalanceDampingOnY,
		    -o.autoBalanceSpring * r.z - this.angular.z * o.autoBalanceDamping
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


	    let moveMultyplier = this.running ? o.sprintMult : 1
	    moveMultyplier = this.crouch ? o.crouchMult : moveMultyplier

	    // Calculate required accelaration and force: a = Δv/Δt
	    // If it's on a moving/rotating platform, apply platform velocity to Δv accordingly
	    // Also, apply reject velocity when character is moving opposite of it's moving direction


	    
	    v.moveAccNeeded.set(
	        (v.movingDirection.x * (o.maxVelLimit * moveMultyplier + v.movingObjectVelocityInCharacterDir.x) - (v.currentVel.x - v.movingObjectVelocity.x * Math.sin(angleBetweenCharacterDirAndObjectDir) + v.rejectVel.x * (v.isOnMovingObject ? 0 : o.rejectVelMult))) / o.accDeltaTime,
	        0,
	        (v.movingDirection.z * (o.maxVelLimit * moveMultyplier + v.movingObjectVelocityInCharacterDir.z) - (v.currentVel.z - v.movingObjectVelocity.z * Math.sin(angleBetweenCharacterDirAndObjectDir) + v.rejectVel.z * (v.isOnMovingObject ? 0 : o.rejectVelMult))) / o.accDeltaTime
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
	            ? o.slopeUpExtraForce : o.slopeDownExtraForce) * moveMultyplier,
	            moveForceNeeded.z * o.turnVelMultiplier * (v.canJump ? 1 : o.airDragMultiplier) // if it's in the air, give it less control
	        );
	    }
	    // If character complete turning, change the impulse quaternion default
	    else {
	        v.moveImpulse.set(
	        	moveForceNeeded.x * (v.canJump ? 1 : o.airDragMultiplier),
	        	v.slopeAngle === null || v.slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
	        	? 0 : v.movingDirection.y * (v.movingDirection.y > 0 // check it is on slope up or slope down
	            ? o.slopeUpExtraForce : o.slopeDownExtraForce) * moveMultyplier,
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

		if(!v.canJump) return

		v.startJump = true;
	    v.inJump = true;
	    this.jump = true;

		//this.v.canJump = false

	    v.jumpVelocityVec.set( v.currentVel.x, this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel, v.currentVel.z );
    	v.jumpDirection.set(0, ( this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel ) * o.slopJumpMult, 0).projectOnVector(v.actualSlopeNormalVec).add(v.jumpVelocityVec)
        
        this.motor.change({

		    name:this.name,
		    linearVelocity:this.v.jumpDirection.toArray()

		});

		v.characterMassForce.y *= o.jumpForceToGroundMult//.set(0, floatingForce > 0 ? -floatingForce : 0, 0);
	    /*if(this.hitObject.mass !== 0 ){
		    this.motor.change({
			    name:this.hitObject.name,
			    impulse: v.characterMassForce.toArray(), 
			    impulseCenter: this.v.standingForcePoint.toArray(),
			});
		}*/
	}

	getFloating (){
		
		const v = this.v;
		const o = this.option;

		const floatingDis = this.radius + o.floatHeight;

		if( this.rayHit ){
			const dist = floatingDis - this.distance;
			let amotiseur = MathTool.clamp(-dist, 0, 2);
		    const floatingForce = ( (o.Spring-amotiseur) * dist ) - ( v.currentVel.y * (o.Damping+amotiseur) );
		    v.moveImpulse.y = floatingForce * this.mass;

		    //this.motor.log(v.moveImpulse.y)

		    // Apply opposite force to standing object
		    v.characterMassForce.set(0, floatingForce > 0 ? -floatingForce : 0, 0);
		    if(this.hitObject.mass !== 0 ){
			    this.motor.change({
				    name:this.hitObject.name,
				    impulse: v.characterMassForce.toArray(), 
				    impulseCenter: this.v.standingForcePoint.toArray(),
				});
			}
		    
		}
 
		//this.motor.log('D:'+ this.distance + ' F:'+floatingForce)
		
	}

	applyDragForce() {

		const v = this.v;
		const o = this.option;

		let autowake = false;

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

	    /**
	    * Detect character falling state
	    */
	    v.isFalling = (v.currentVel.y < 0 && !v.canJump) ? true : false;
	    /**
	     * Setup max falling speed && extra falling gravity
	     * Remove gravity if falling speed higher than fallingMaxVel (negetive number so use "<")
	     */
		if (v.currentVel.y < o.fallingMaxVel) {
			if (this.gravityScale !== 0) {
				this.gravityScale = 0//characterRef.current.setGravityScale(0, true)
			}
		} else {
			if (!v.isFalling && this.gravityScale !== o.initialGravityScale) {
				// Apply initial gravity after landed
				this.gravityScale = o.initialGravityScale;
			} else if (v.isFalling && this.gravityScale !== o.fallingGravityScale) {
				// Apply larger gravity when falling (if initialGravityScale === fallingGravityScale, won't trigger this)
				this.gravityScale = o.fallingGravityScale;
			}


		}

	    
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
		//const delta = this.motor.getDelta()//delta;
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

	    

	    let mAnim = 'idle'
	    switch( anim ){
	    	case 'idle': mAnim = this.crouch ? 'Crouch_Idle' : 'Idle'; break;
	    	case 'walk': mAnim = 'Walk_F'; break;//'Jog Forward'
	    	case 'run': mAnim = 'Jog_F'; break;//'Standard Run'
	    	case 'crouch': mAnim = 'Crouch_F'; break;//'Crouch Walk'
	    	case 'fight': mAnim = 'Attack'; break;
	    }

	    if(mAnim === 'Idle'){ 
	    	if(v.endJump ) mAnim = 'Jump_Land';
	    } else {
	    	v.endJump = false
	    }


	     

	    const isNewAnim = this.Oanim !== mAnim;
	    this.Oanim = mAnim;

	    this.moving = key[0] !== 0 || key[1] !== 0;
	    this.running = key[7] !== 0;
	    this.wantJump = key[4] !== 0;

	    let angle = MathTool.unwrapRad( ( Math.atan2(key[0], key[1])) + azimut );

	    // 2°/ physic control

	    if( this.useImpulse ) {

	    	if( this.moving ) this.moveCharacter( delta, angle );
	    	else this.stopMoving();

	    	if( this.wantJump ) this.jumping()
	        if( this.useFloating ) this.getFloating();

	        //this.applyDragForce()

	    	this.motor.change({

			    name:this.name,
			    impulse: this.v.moveImpulse.toArray(), 
			    impulseCenter: this.v.impulseCenter.toArray(),
			    //linearVelocity:this.v.jumpDirection.toArray()

			    gravityScale:this.gravityScale,

			});

			

	    } else { // old method

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

		    if( key[0] === 0 && key[1] === 0 ) this.tmpAcc = 0;//*= 0.9
		    if( this.tmpAcc>1 ) this.tmpAcc = 1;

		    this.ease.set( this.rs, 0, this.ts ).multiplyScalar( this.tmpAcc * m );

		    //let angle = math.unwrapRad( (Math.atan2(this.ease.z, this.ease.x)) + azimut );
		    //let angle = MathTool.unwrapRad( ( Math.atan2(key[0], key[1])) + azimut );
	    

		    let acc = this.ease.length(); //((Math.abs(this.ease.x) + Math.abs(this.ease.z)))

	        if( this.static ) this.ease.x = this.ease.z = 0;

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


        
	    if( this.jump ){
	    	this.model.play( 'Jump_Start', 0.5 )
	    	this.jump = false
	    	//this.model.setTimescale( 1 )
	    } else {
	    	if(!v.inJump){ 
	    		if( isNewAnim ){ 
	    			this.model.play( mAnim, 0.5 )
	    		}
	    	} else {
	    		if(this.rayHit){
	    			this.v.inJump = false;
	    			this.v.endJump = true;
	    			this.Oanim = 'Jump_Land';
	    			this.model.play( 'Jump_Land', 0.2, this.endJump.bind(this) )
	    		} 
	    	}
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
	    	
	    	//this.model.setTimescale( this.tmpAcc * (1*genSpeed) )

	    	


	    	
	    	//this.rotateRay( this.model.rotation.y )

	    	//let m = this.model.getAction( anim )
	    	//if( m ) m.setEffectiveTimeScale( this.tmpAcc * (1*genSpeed) );
	    	//if( m ) m.setEffectiveTimeScale( 0 );
	    }

	    //if( this.helper ) this.helper.setDirection( this.model.rotation.y )

	}

	endJump() {
		
		this.v.endJump = false;

	}


}