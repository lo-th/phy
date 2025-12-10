import { Object3D, Vector3, Euler, Quaternion, Mesh } from 'three';

//import { Basic3D } from '../../core/Basic3D.js';
import { MathTool, torad } from '../../core/MathTool.js';
import { SkeletonBody } from './SkeletonBody.js';
import { Avatar } from '../../3TH/character/Avatar.js';
import { CapsuleHelper } from '../geometries/CapsuleHelper.js';

//
// not use native character function of physics engine 
// use some code from https://github.com/ErdongChen-Andrew/CharacterControl
// 

export class Hero extends Object3D {

	constructor( o = {}, motor ) {

		super()

		this.motor = motor;
		this.utils = this.motor.utils;

		this.isCharacter = true;
		this.isPlayer = false;
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
			dragDampingC: 0.15,
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

			floatingDis: radius + floatHeight + 0.08,
			springK: 2, //1.2,
			dampingC: 0.2,//0.08,
			// Slope Ray setups
			showSlopeRayOrigin: false,
			slopeMaxAngle: 1, // in rad
			slopeRayOriginOffest: radius - 0.03,
			slopeRayLength: radius + 3,
			slopeRayDir: { x: 0, y: -1, z: 0 },
			slopeUpExtraForce: 0.1,
			slopeDownExtraForce: 0.2,
			// AutoBalance Force setups
			autoBalance: true,
			autoBalanceSpringK: 1.2,//0.3,
			autoBalanceDampingC: 0.04,
			autoBalanceSpringOnY: 0.7,
			autoBalanceDampingOnY: 0.05,
			// Animation temporary setups
			animated: false,
			mode:null,

			//...o

		}

		this.v = {

			movingObjectVelocityInCharacterDir: new Vector3(),
			movingObjectVelocity: new Vector3(),
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
			actualSlopeNormal: new Vector3(),
			actualSlopeAngle:null,
			actualSlopeNormalVec: new Vector3(),
			floorNormal: new Vector3(0, 1, 0),
			slopeRayOriginRef: new Vector3(),
			slopeRayorigin: new Vector3(),

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

		this.ray = null;
		this.model = null;
		this.static = false;
		this.moving = false;
		this.running = false;
		this.wantJump = false;

		//this.lod = -1;

		this.radius = radius;
		this.height = height;
		this.mass = o.mass || 0.84;
		
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
			density: 1,//o.density || 1,
			mass: this.mass, 
			friction: o.friction !== undefined ? o.friction : 0.5,
			angularFactor:[0,0,0],
			group: 16,
			regular:true,

			massInfo: o.massInfo,
		}

		if(this.motor.engine === 'HAVOK')this.phyData['inertia'] = [0,0,0]

		if( o.mask ) this.phyData['mask'] = o.mask;

		//o.volume = MathTool.getVolume( 'capsule', o.size );
	

		// add to world
		this.motor.getCharacterRef().addToWorld( this, o.id );

        // add capsule to physics
        //root.post({ m:'add', o:o });
        this.motor.post({ m:'add', o:this.phyData });

        // add bottom RAY
        if( this.useFloating ) this.ray = this.motor.add({ type:'ray', name:this.name + '_ray', begin:[0,this.rayStart,0], end:[0,this.rayEnd, 0], callback:this.selfRay.bind(this), visible:false, parent:this.name });


        // add skinning character model
        if( o.gender ) this.addModel( o );
        else this.showHelper( true );

        this.enable = true;
		
	}

	extraRemove(){
		// TODO bug with delete ray ?!
		if( this.ray ) this.motor.remove( this.name + '_ray' );
	}

	/*clear(){
		root.motor.remove([this.name, this.name + '_ray']);
	}*/

    selfRay( r ){

    	if( r.hit ){ 
    		this.distance = r.distance; //MathTool.toFixed(r.distance-this.radius)
    		this.rayAngle = r.angle;
    		//this.v.canJump = true;
    		//console.log('true')
    	} else { 
	        this.distance =this.option.rayLength//maxRayDistance;
	        this.rayAngle = 0;
	        //console.log('false')
	        //this.v.canJump = false;	    
	    }

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

    	if( this.ray ) this.ray.visible = b

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
		
		this.position.fromArray( AR, n + 1 );
		this.quaternion.fromArray( AR, n + 4 );
		this.velocity.fromArray( AR, n + 8 );
		this.angular.fromArray( AR, n + 11 );

		this.fall = this.position.y < this.oy
		this.floor = MathTool.nearEquals(this.position.y, this.oy, 0.1)
		this.oy = this.position.y;
		

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

		const v = this.v;
		const o = this.option;
		const r = this.rotation;

		v.dragAngForce.set(
		    -o.autoBalanceSpringK * r.x - this.angular.x * o.autoBalanceDampingC,
		    -o.autoBalanceSpringK * r.y - this.angular.y * o.autoBalanceDampingOnY,
		    -o.autoBalanceSpringK * r.z - this.angular.z * o.autoBalanceDampingC
		)

	}

	moveCharacter ( delta, angle = 0 ){

		const v = this.v;
		const o = this.option;
		const key = this.motor.getKey();
		const azimut = this.motor.getAzimut();

		
		

		v.currentPos.copy(this.position);

		

		//v.movingObjectVelocity = 
		v.slopeAngle = 0//azimut;



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

	    // Character current velocity
	    v.currentVel.copy(this.velocity);

	    // Jump impulse

	    if ( key[4] && v.canJump ) {
	    	v.jumpVelocityVec.set( v.currentVel.x, this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel, v.currentVel.z );
	    	v.moveImpulse.y = v.jumpVelocityVec.y
	    }

	   //v.jumpDirection.set(0, ( this.running ? o.sprintJumpMult * o.jumpVel : o.jumpVel ) * o.slopJumpMult, 0).projectOnVector(v.actualSlopeNormalVec).add(v.jumpVelocityVec)
	    //root.motor.change({ name:this.name, linearVelocity:v.jumpDirection.toArray() });

	}

	getFloating (){
		
		const v = this.v;
		const o = this.option;

		const floatingForce = o.springK * (o.floatingDis - this.distance) - this.velocity.y * o.dampingC;
		v.moveImpulse.y = floatingForce * (this.mass);

	}

	stopMoving (){
		
		const v = this.v;
		const o = this.option;

		this.v.moveImpulse.set(0,0,0)

		// slowdown

		this.tmpV1.copy(this.velocity)//.multiplyScalar( 0.9 )
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
		});

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

	        if( this.useFloating ) this.getFloating();

	    	this.motor.change({

			    name:this.name,
			    impulse: this.v.moveImpulse.toArray(), 
			    impulseCenter: this.v.impulseCenter.toArray(),

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

	    	//let m = this.model.getAction( anim )
	    	//if( m ) m.setEffectiveTimeScale( this.tmpAcc * (1*genSpeed) );
	    	//if( m ) m.setEffectiveTimeScale( 0 );
	    }

	    //if( this.helper ) this.helper.setDirection( this.model.rotation.y )

	}


}