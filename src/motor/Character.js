import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { Basic3D } from '../core/Basic3D.js';
import { MathTool, torad } from '../core/MathTool.js';

import { Vector3, Euler, Quaternion, Mesh } from 'three';

import { Avatar } from '../3TH/character/Avatar.js';
import { CapsuleHelper } from '../3TH/helpers/CapsuleHelper.js';

import { Utils, root } from './root.js';
import { Mat, Colors } from './base/Mat.js';

import { SkeletonBody } from './extra/SkeletonBody.js';


// THREE CHARACTER

export class Character extends Item {

	constructor() {

		super()

		this.Utils = Utils
		this.type = 'character';
		this.num = Num[this.type];

	}

	/*prestep () {

		let i = this.list.length;

		while( i-- ){

			this.list[i].preStep( );

		}

	}*/

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
		const hero = new Hero( o );

		return hero

	}

	set ( o = {}, b = null ) {

		if( b === null ) b = this.byName( o.name )
		if( b === null ) return

		b.set(o)

	}
	
}

// HERO

class Hero extends Basic3D {

	constructor( o = {} ) {

		super()

		o.radius = o.radius !== undefined ? o.radius : 0.3;
		o.height = o.height !== undefined ? o.height : 1.8//0.7;

		let floatHeight = 0.3;

		this.option = {

			debug: false,
			capsuleHalfHeight: o.height*0.5,
			capsuleRadius: o.radius,
			floatHeight: floatHeight,
			characterInitDir: 0, // in rad
			//followLight: false,
			// Follow camera setups
			camInitDis: -5,
			camMaxDis: -7,
			camMinDis: -0.7,
			// Base control setups
			maxVelLimit: 2.5,
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
			rayOriginOffest: { x: 0, y: -o.height*0.5, z: 0 },
			rayHitForgiveness: 0.1,
			rayLength: o.radius + 2,
			rayDir: { x: 0, y: -1, z: 0 },
			floatingDis: o.radius + floatHeight,
			springK: 1.2,
			dampingC: 0.08,
			// Slope Ray setups
			showSlopeRayOrigin: false,
			slopeMaxAngle: 1, // in rad
			slopeRayOriginOffest: o.radius - 0.03,
			slopeRayLength: o.radius + 3,
			slopeRayDir: { x: 0, y: -1, z: 0 },
			slopeUpExtraForce: 0.1,
			slopeDownExtraForce: 0.2,
			// AutoBalance Force setups
			autoBalance: true,
			autoBalanceSpringK: 0.3,
			autoBalanceDampingC: 0.03,
			autoBalanceSpringOnY: 0.3,
			autoBalanceDampingOnY: 0.02,
			// Animation temporary setups
			animated: false,

		}

		this.v = {


			movingObjectVelocityInCharacterDir: new Vector3(),

			pivotPosition: new Vector3(),
			modelEuler: new Euler(),
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

			springDirVec: new Vector3(),
			characterMassForce: new Vector3(),

			// slope
			slopeAngle:null,
			actualSlopeAngle:null,
			actualSlopeNormal: new Vector3(),
			actualSlopeNormalVec: new Vector3(),
			floorNormal: new Vector3(0, 1, 0),
			slopeRayorigin: new Vector3(),

			canJump:false,
			run:false,
			isOnMovingObject:false,

		}

		this.useImpulse = false;
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

		//this.lod = -1;

		this.radius = o.radius || 0.3;
		this.height = o.height || 1.8;
		
		delete o.radius

		this.fall = false
		this.floor = true

		this.distance = 0
		this.rayAngle = 0
		this.rayStart = -(this.height*0.5)+this.radius;
		this.rayEnd = this.rayStart - this.height;
		this.maxRayDistance = this.height;

		this.contact = false

		this.tmpV1 = new Vector3()
		this.tmpV2 = new Vector3()
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

		this.valheimStyle = true
		this.globalRay = o.ray || false

		this.callback = o.callback || function (){}

		if( o.callback ) delete o.callback

		this.init( o );

	}

	init( o ){

	    if(!o.size) o.size = [ this.radius ,this.height-(2*this.radius) ]
		if(!o.pos) o.pos = [0,this.height*0.5,0]

		this.py = -this.height*0.5//(o.size[1]*0.5)-o.size[0]

		if( this.globalRay ) root.items.body.geometry( { ...o, type:'capsule', ray:true }, this, Mat.get('hide') )

		o.type = 'character';
	    o.shapeType = o.shapeType || 'capsule';

		o.density = o.density || 1;
        //o.damping = [0.01,0] 
        o.friction = 0.5

		o.angularFactor = [0,0,0];
		//o.maxDamping = 1000
		o.group = 16
		//o.mask = o.mask !== undefined ? o.mask : 1|2
		o.regular = true
		o.filter = [1,-1,[1, 3, 4,5,9], 0]
		//o.inertia = [0,0,0] 
		//o.kinematic = true
		o.noGravity = true
		//o.move = false

		//o.kinematic = true;

		o.volume = MathTool.getVolume( 'capsule', o.size );
	

		// add to world
		root.items.character.addToWorld( this, o.id );

        // add capsule to physics
        root.post({ m:'add', o:o });

        // add bottom RAY
        this.ray = root.motor.add({ type:'ray', name:this.name + '_ray', begin:[0,this.rayStart,0], end:[0,this.rayEnd, 0], callback:this.selfRay.bind(this), visible:false, parent:this.name })

        // add skinning character model
        if( o.gender ) this.addModel( o );
        else this.showHelper( true );
		
	}

    selfRay( r ){

    	if( r.hit ){ 
    		this.distance = MathTool.toFixed(r.distance-this.radius)
    		this.rayAngle = r.angle
    	} else { 
	        this.distance = this.maxRayDistance
	        this.rayAngle = 0
	    }

    }

    hit( d ){
    	this.contact = d
    }

    showHelper( b ){

    	if(b){
    		if(!this.helper){
    			this.helper = new CapsuleHelper(this.radius, this.height, true, Mat.get('line'), [1,0.6,0], [0.6,0.2,0] );
		        this.add( this.helper );
    		}
    	} else {
    		if(this.helper){
    			this.remove(this.helper);
    			this.helper.dispose();
    			this.helper = null;
    		}
    	}

    	if(this.ray) this.ray.visible = b

    }

    addSkeleton(){

    	if( this.skeletonBody ) return

    	this.skeletonBody = new SkeletonBody( this )
    	root.scene.add( this.skeletonBody )
    	this.skeletonBody.isVisible( false )

    }

    debugMode( v ){

    	if( this.skeletonBody ) this.skeletonBody.isVisible(v)
    	//if( this.model ) this.model.setMaterial( { wireframe: v, visible:!v })
    	if( this.model ) this.model.setMaterial( { wireframe: v, transparent:v, opacity:v?0.3:1.0 }, !v )
    	
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
			callback:this.callback,
			fixWeight: this.fixWeight,
			noLOD : o.noLOD || false,
		});

		this.add( this.model );
		///this.model.rotation.order = 'YXZ'
		this.model.setPosition(0, this.py+this.model.decalY, 0)
		this.model.rotation.y = this.angle
		this.model.updateMatrix()

	}

	raycast(){
		return
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
		this.updateMatrix();

		if( this.model ) {
			this.model.update( root.delta );
			this.getDistanceToCamera()
		}
		//if(this.skeletonBody) this.skeletonBody.update()

	}

	getDistanceToCamera () {

		if( !this.model ) return
		if( !this.model.haveLOD ) return

		const camera = root.motor.getCamera();
		//this.tmpV1.setFromMatrixPosition( camera.matrixWorld );
		this.tmpV1.copy( root.motor.getCurrentCharacterPosition() );
		this.tmpV2.copy( this.position );//setFromMatrixPosition( this.matrixWorld );
		const distance = this.tmpV1.distanceTo( this.tmpV2 ) / camera.zoom;

		//console.log(distance)

		let level = distance > 3 ? 0 : 1;
		//if( level !== this.lod ){
		//	this.lod = level;
			this.model.setLevel( level );
		
	}

	set ( o ) {

		//console.log('set', o)
		if(o.morph){
			if(this.model) this.model.setMorph( o.morph, o.value )
		}

	}

	dispose () {

		this.callback = null
		if( this.skeletonBody ) this.skeletonBody.dispose()
		if( this.model ) this.model.dispose()
		if( this.helper ) this.showHelper()

		//console.log('model remove')

		super.dispose()
	}

	onFrame( state, delta ){

		const v = this.v;
		const o = this.option;

	}

	autoBalance(){

		const v = this.v;
		const o = this.option;
		const r = this.rotation;

		v.dragAngForce.set(
		    -o.autoBalanceSpringK * r.x - this.angular.x * o.autoBalanceDampingC,
		    -o.autoBalanceSpringK * r.y - this.angular.y * o.autoBalanceDampingOnY,
		    -o.autoBalanceSpringK * r.z - this.angular.z * o.autoBalanceDampingC
		)

	}

	moveImpulse () {

		const v = this.v;
		const o = this.option;
		const key = root.motor.getKey();
		const azimut = root.motor.getAzimut();
		const delta = root.delta;

		v.run = key[7] !== 0;

	    // Setup moving direction

	    // Only apply slope extra force when slope angle is between 0.2-1, actualSlopeAngle < 1

	    if ( v.actualSlopeAngle < 1 &&  Math.abs(v.slopeAngle) > 0.2 && Math.abs(v.slopeAngle) < 1 ) {
	    	v.movingDirection.set(0, Math.sin(v.slopeAngle), Math.cos(v.slopeAngle));
	    } else if (v.actualSlopeAngle >= 1) {
	    	v.movingDirection.set( 0, Math.sin(v.slopeAngle) > 0 ? 0 : Math.sin(v.slopeAngle), Math.sin(v.slopeAngle) > 0 ? 0.1 : 1 );
	    } else {
	    	v.movingDirection.set(0, 0, 1);
	    }

	    // Apply character quaternion to moving direction
	    if( this.model ) v.movingDirection.applyQuaternion( this.model.quaternion );
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
	        (v.movingDirection.x * (o.maxVelLimit * (v.run ? o.sprintMult : 1) + v.movingObjectVelocityInCharacterDir.x) - (v.currentVel.x - v.movingObjectVelocity.x * Math.sin(angleBetweenCharacterDirAndObjectDir) + v.rejectVel.x * (v.isOnMovingObject ? 0 : o.rejectVelMult))) / o.accDeltaTime,
	        0,
	        (v.movingDirection.z * (o.maxVelLimit * (v.run ? o.sprintMult : 1) + v.movingObjectVelocityInCharacterDir.z) - (v.currentVel.z - v.movingObjectVelocity.z * Math.sin(angleBetweenCharacterDirAndObjectDir) + v.rejectVel.z * (v.isOnMovingObject ? 0 : o.rejectVelMult))) / o.accDeltaTime
	    );

	    // Wanted to move force function: F = ma
	    const moveForceNeeded = v.moveAccNeeded.multiplyScalar( this.mass );

	   
	    // Check if character complete turned to the wanted direction
	    
	    const characterRotated = Math.sin(this.rotation.y).toFixed(3) == Math.sin(v.modelEuler.y).toFixed(3);

	    // If character hasn't complete turning, change the impulse quaternion follow characterModelRef quaternion
	    if (!characterRotated) {
	    	v.moveImpulse.set(
	    		moveForceNeeded.x * o.turnVelMultiplier * (v.canJump ? 1 : o.airDragMultiplier), // if it's in the air, give it less control
	    		v.slopeAngle === null || v.slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
	            ? 0 : v.movingDirection.y * o.turnVelMultiplier *
	            (v.movingDirection.y > 0 // check it is on slope up or slope down
	            ? o.slopeUpExtraForce : o.slopeDownExtraForce) * (v.run ? o.sprintMult : 1),
	            moveForceNeeded.z * o.turnVelMultiplier * (v.canJump ? 1 : o.airDragMultiplier) // if it's in the air, give it less control
	        );
	    }
	    // If character complete turning, change the impulse quaternion default
	    else {
	        v.moveImpulse.set(
	        	moveForceNeeded.x * (v.canJump ? 1 : o.airDragMultiplier),
	        	v.slopeAngle === null || v.slopeAngle == 0 // if it's on a slope, apply extra up/down force to the body
	        	? 0 : v.movingDirection.y * (v.movingDirection.y > 0 // check it is on slope up or slope down
	            ? o.slopeUpExtraForce : o.slopeDownExtraForce) * (v.run ? o.sprintMult : 1),
	            moveForceNeeded.z * (v.canJump ? 1 : o.airDragMultiplier)
	        );
	    }


	    v.impulseCenter.set( v.currentPos.x, v.currentPos.y + o.moveImpulsePointY, v.currentPos.z );


	    v.currentVel.copy(this.velocity);

	}

	

	move ( ) {

		const v = this.v;

		const key = root.motor.getKey();
		const azimut = root.motor.getAzimut();
		const delta = root.delta;
		
		let anim = key[7] !== 0 ? 'run' : 'walk'
	    if( key[0] === 0 && key[1] === 0 ) anim = 'idle'//*= 0.9
	    let m = key[0] !== 0 && key[1] !== 0 ? this.diagonal : 1

	    if( key[5] && this.toggle ){ 
	    	this.crouch = !this.crouch
	    	this.toggle = false
	    }

	    if( key[5] === 0 ) this.toggle = true

	    if( ( anim==='walk' || anim==='run') && this.crouch ) anim = 'crouch'

	    if( key[6] === 1 ) anim = 'fight'



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

	    //this.oy = this.position.y;

	    /*if(this.crouch){
	    	if( anim==='run' || anim==='walk' ) anim = 'crouch'
	    	if( anim==='idle' ) anim = 'crouchIdle'
	    }*/


	    let mAnim = 'idle'
	    switch( anim ){
	    	case 'idle':
	    	   mAnim = this.crouch ? 'Crouch Idle' : 'idle';
	    	   //if( key[6] === 1 ) mAnim = 'Attack';
	    	break;
	    	case 'walk':
	    	    mAnim = 'Jog Forward';
	    	break;
	    	case 'run': mAnim = 'Standard Run'; break;
	    	case 'crouch': mAnim = 'Crouch Walk'; break;
	    	case 'fight': mAnim = 'Attack'; break;
	    	//case 'crouchIdle': mAnim = 'Crouch Idle'; break;
	    }

	    //if(this.jump) 
	    //this.model.setWeight(, this.jump ? 1:0 )

	    const genSpeed = 1.0;

	    let speed = this.speed[anim] * genSpeed;

	    
	    //this.tmpAcc *= 0.9
	    

	    if( key[0] !== 0 || key[1] !== 0 ){ 

	    	this.moving = true;

	        this.tmpAcc += delta*4//MathTool.lerp( tmpAcc, 1, delta/10 )
	        //this.tmpAcc += MathTool.lerp( this.tmpAcc, 1, delta/10 )
	        //this.tmpAcc = MathTool.clamp( this.tmpAcc, 1, speed )

	        //this.rs += key[0] //* this.tmpAcc 
	        //this.ts += key[1] //* this.tmpAcc

	        this.rs = key[0] * speed//* this.tmpAcc 
	        this.ts = key[1] * speed//* this.tmpAcc
	    } else {
	    	this.moving = false;
	    }

	    if( key[0] === 0 && key[1] === 0 ) this.tmpAcc = 0//*= 0.9
	    //if( key[0] === 0 ) this.rs = 0
	    //if( key[1] === 0 ) this.ts = 0

	    //if( key[0] === 0 ) this.rs *= 0.9
	    //if( key[1] === 0 ) this.ts *= 0.9

	    if(this.tmpAcc>1) this.tmpAcc = 1

	    //dir.multiplyScalar(tmpAcc)

	    //this.rs = MathTool.clamp( this.rs, -speed, speed ) 
	    //this.ts = MathTool.clamp( this.ts, -speed, speed ) 

	    //this.ease.set( this.ts/speed, 0, this.rs/speed )
	    //this.ease.set( this.rs/speed, 0, this.ts/speed )
	    this.ease.set( this.rs, 0, this.ts ).multiplyScalar( this.tmpAcc * m )

	    //let angle = math.unwrapRad( (Math.atan2(this.ease.z, this.ease.x)) + azimut );
	    let angle = MathTool.unwrapRad( ( Math.atan2(this.ease.x, this.ease.z)) + azimut );

	    let acc = this.ease.length() //((Math.abs(this.ease.x) + Math.abs(this.ease.z)))

	    //console.log(jj, this.ease.length() )

	    //if(jj!== 0)

	    // help climb montagne
	   /* if( !this.jump ){ 
	    	if( !this.fall ) this.vy = acc*8
	    	else this.vy = 0
	    }*/

	    

	    
        //if(anim==='walk' || anim==='run')

        //if(this.static) this.ts = this.rs = 0
        if( this.static ) this.ease.x = this.ease.z = 0


	    // gravity
	    //let g = this.vy - (this.distance>0.1 ? 9.81 : 0);
	    let g = this.vy - 9.81;

	   // console.log(this.distance)

	    this.ease.y = g

	    //this.tmpV1.set( this.rs, g, this.ts ).applyAxisAngle( { x:0, y:1, z:0 }, azimut );

	    this.tmpV1.copy( this.ease ).applyAxisAngle( { x:0, y:1, z:0 }, azimut );
	    //math.tmpV2.set( 0, rs, 0 );
	    this.tmpV2.set( 0, 0, 0 );


	    // physic control

	    if( this.useImpulse ) {

	    	root.motor.change({

			    name:this.name,
			    impulse: this.v.moveImpulse.toArray(), 
			    impulseCenter: this.v.impulseCenter.toArray(),

			});

	    } else {

	    	root.motor.change({

			    name:this.name,
			    //force: this.tmpV1.toArray(), forceMode:'velocity', 
			    linearVelocity: this.tmpV1.toArray(), 
			    //angularVelocity: this.tmpV2.toArray(),
			    //wake:true, 
			    //noGravity:true 
			});
	    }

	    

		


		if( this.helper ){ 

			//this.helper.updateMatrix()
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
	    	this.model.play( 'Jump', 0 )
	    	//this.model.setTimescale( 1 )
	    }else {
	    	this.model.play( mAnim, 0.5 )
	    	//this.model.setTimescale( this.timeScale )
	    	//this.model.setTimescale( 1 )
	    }

	    if( anim !== 'idle' ){

	    	//this.model.setTimescale( 0.5 )

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