


import { Vector3, Mesh } from 'three';

import { Avatar } from '../3TH/character/Avatar.js';


import { Item } from '../core/Item.js';
import { Num } from '../core/Config.js';
import { Basic3D } from '../core/Basic3D.js';
import { Utils, root, math, Mat } from './root.js';
import { SkeletonBody } from './SkeletonBody.js';

// THREE CHARACTER

export class Character extends Item {

	constructor() {

		super()

		this.Utils = Utils
		this.type = 'character'
		this.num = Num[this.type]

	}

	/*prestep () {

		let i = this.list.length;

		while( i-- ){

			this.list[i].preStep( );

		}

	}*/

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
		const hero = new Hero( o )

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

		this.type = 'character';
		this.name = o.name || 'hero';

		this.isRay = false

		this.model = null
		this.static = false


		this.radius = 0.3
		this.height = 1.8

		this.fall = false
		this.floor = true

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

		this.angle = ( o.angle || 0 ) * math.torad

		this.speed = {
		    idle:1,
		    fight:1,
		    walk:8,
		    crouch:6,
		    run:12,
		}

		this.valheimStyle = true
		
		this.callback = o.callback || function (){}

		if( o.callback ) delete o.callback



		//this.position = new THREE.Vector3();
		this.init( o );

	}

	init( o ){

		this.radius = o.radius || 0.3
		this.height = o.height || 1.8

		if( o.radius ) delete o.radius

	    if(!o.size) o.size = [ this.radius ,this.height-(2*this.radius) ]
		if(!o.pos) o.pos = [0,this.height*0.5,0]
		this.py = -this.height*0.5//(o.size[1]*0.5)-o.size[0]



		if( o.debug ) root.items.body.geometry( { ...o, type:'capsule', ray:false }, this, Mat.get('debug3') )

		o.density = o.density || 70 
        o.damping = [0.01,0] 
        o.friction = 0.5

		o.angularFactor = [0,0,0]
		//o.maxDamping = 1000
		o.group = 32
		o.mask = o.mask !== undefined ? o.mask : 1|2
		o.regular = true
		o.filter = [1,-1,[1, 3, 4,5,9], 0]
		o.inertia = [0,0,0] 
		//o.kinematic = true
		o.noGravity = true
		o.ray = false

		//if( o.callback ) delete o.callback

		// add to world
		root.items.character.addToWorld( this, o.id )

        // add to physics
        root.post({ m:'add', o:o })

        //root.add({ type:'contact', b1:this.name,  callback: this.hit.bind(this) })

        // add character model
        if( o.gender ) this.addModel( o )
		
	}

    hit( d ){
    	this.contact = d

    	//console.log(this.contact)
    }

    addSkeleton( o ){

    	this.skeletonBody = new SkeletonBody( this )
    	//this.model.add( this.skeletonBody )
    	//root.scene.add( this.skeletonBody )
    	this.add( this.skeletonBody )
    	this.skeletonBody.isVisible(false)

    }

    debugMode( v ){

    	if(this.skeletonBody) this.skeletonBody.isVisible(v)
    	if(this.model) this.model.setMaterial( {wireframe: v})
    	//this.model.visible = !v

    }

    setMode( name ){

    	if( this.skeletonBody ) this.skeletonBody.setMode( name )

    	//this.skeletonBody = new SkeletonBody( this )
    	//this.model.add( this.skeletonBody )

    }

	addModel( o ){

		this.model = new Avatar( { 
			type:o.gender, 
			anim: o.anim !== undefined ? o.anim : 'idle', 
			compact:true, 
			material:!o.noMat, 
			morph:o.morph || false, 
			callback:this.callback 
		});

		this.add( this.model );
		///this.model.rotation.order = 'YXZ'
		this.model.setPosition(0,this.py,0)
		this.model.rotation.y = this.angle
		this.model.updateMatrix()

	}

	raycast(){
		//return
	}

	/*preStep(){
		if(this.skeletonBody) this.skeletonBody.update()
	}*/

	step ( AR, n ) {

		

		this.position.fromArray( AR, n + 1 )
		this.quaternion.fromArray( AR, n + 4 )
		this.fall = this.position.y < this.oy
		this.floor = math.nearEquals(this.position.y, this.oy, 0.1)
		this.oy = this.position.y;
		this.updateMatrix()

		if(this.model) this.model.update( root.delta );
		//if(this.skeletonBody) this.skeletonBody.update()

	}

	set ( o ) {

		//console.log('set', o)
		if(o.morph){
			if(this.model) this.model.setMorph( o.morph, o.value )
		}

	}

	dispose () {

		this.callback = null
		if( this.model ) this.model.dispose()
		if( this.skeletonBody ) this.skeletonBody.dispose()

		//console.log('model remove')

		super.dispose()
	}

	move () {

		const key = root.motor.getKey()
		const azimut = root.motor.getAzimut()

		let anim = key[7] !== 0 ? 'run' : 'walk'
	    if( key[0] === 0 && key[1] === 0 ) anim = 'idle'//*= 0.9
	    let m = key[0] !== 0 && key[1] !== 0 ? this.diagonal : 1

	    if( key[5] && this.toggle ){ 
	    	this.crouch = !this.crouch
	    	this.toggle = false
	    }

	    if( key[5] === 0 ) this.toggle = true

	    if( (anim==='walk' || anim==='run') && this.crouch ) anim = 'crouch'

	    if( key[6] === 1 ) anim = 'fight'



	    if( !this.jump && key[4] ){ this.vy = 22; this.jump = true; } // SPACE KEY

	    if( this.jump ){
	        this.vy-=1;
	        if(this.vy <= 0 ){ 
	            this.vy = 0; 
	            if( this.floor ) this.jump = false;

	            //if( math.nearEquals(this.position.y, this.oy, 0.1)) this.jump = false;
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

	    
	    
	    

	    if( key[0] !== 0 || key[1] !== 0 ){ 

	        this.tmpAcc += 0.2//math.lerp( tmpAcc, 1, delta/10 )
	        this.tmpAcc = math.clamp( this.tmpAcc, 1, this.speed[anim] )

	        this.rs += key[0] * this.tmpAcc//* delta
	        this.ts += key[1] * this.tmpAcc//* delta
	    }

	    if( key[0] === 0 && key[1] === 0 ) this.tmpAcc = 0//*= 0.9
	    if( key[0] === 0 ) this.rs = 0
	    if( key[1] === 0 ) this.ts = 0

	    //dir.multiplyScalar(tmpAcc)

	    this.rs = math.clamp( this.rs, -this.speed[anim], this.speed[anim] ) * m
	    this.ts = math.clamp( this.ts, -this.speed[anim], this.speed[anim] ) * m

	    this.ease.set( this.ts/this.speed[anim], 0, this.rs/this.speed[anim] )

	    let angle = math.unwrapRad( (Math.atan2(this.ease.z, this.ease.x)) + azimut );

	    let acc = this.ease.length() //((Math.abs(this.ease.x) + Math.abs(this.ease.z)))

	    //console.log(jj, this.ease.length() )

	    //if(jj!== 0)

	    // help climb montagne
	    if( !this.jump ){ 
	    	if( !this.fall ) this.vy = acc*8
	    	else this.vy = 0
	    }

	    

	    
        //if(anim==='walk' || anim==='run')

        if(this.static) this.ts=this.rs=0


	    // gravity
	    let g = this.vy - 9.81;

	    this.tmpV1.set( this.rs, g, this.ts ).applyAxisAngle( { x:0, y:1, z:0 }, azimut );
	    //math.tmpV2.set( 0, rs, 0 );
	    this.tmpV2.set( 0, 0, 0 );

	    root.motor.change({ 
		    name:this.name, 
		    //force: this.tmpV1.toArray(), forceMode:'velocity', 
		    linearVelocity: this.tmpV1.toArray(), 
		    /*angularVelocity: this.tmpV2.toArray(),*/ 
		    wake:true/*, 
		    noGravity:true*/ 
		});


	   // if(anim!=='idle') this.model.setRotation( 0, azimut + Math.PI, 0, 0.25 )
        
        if( !this.model ) return

        //this.model.setWeight( 'idle', 1-jj )
	    /*this.model.setWeight( 'Jog Forward', -this.ease.x )
	    this.model.setWeight( 'Jog Backward', this.ease.x )
	    this.model.setWeight( 'Jog Strafe Left',-this.ease.z )
	    this.model.setWeight( 'Jog Strafe Right', this.ease.z )*/
	    
	   

	    //if(anim!=='idle') this.model.syncro('Jog Forward')

	    //console.log(tmpAcc)

        
	    if( this.jump ){
	    	this.model.play( 'Jump', 0 )
	    	this.model.timescale( 1 )
	    }else {
	    	this.model.play( mAnim, 0.25 )
	    	this.model.timescale( 1.25 )
	    }

	    if( anim !== 'idle' ){

	    	let pp = math.unwrapRad( this.model.rotation.y )
	    	//if( anim === 'fight' ) pp = math.unwrapRad( azimut + Math.PI )
	    	let aa = math.nearAngle( angle, pp )
	    	this.model.rotation.y = anim === 'fight' ? (azimut + Math.PI) : math.lerp( pp, aa, 0.25 )
	    	this.model.updateMatrix()
	    }




	    

	    

	}


}