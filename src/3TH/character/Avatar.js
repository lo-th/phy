import { math } from '../math.js';
import { root } from '../root.js';
import { } from './modules/AnimationPack.js';
import { Animator } from './Animator.js';
import { ExoSkeleton } from './ExoSkeleton.js';
import { Weapon } from './Weapon.js';
import { Pool } from '../Pool.js';
import { BoneHelper } from './helpers/BoneHelper.js';

/**   _  _____ _   _
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*/

// left -Y
// right -Z

function Avatar( o ) {

	THREE.Object3D.call( this );

    this.type = 'Avatar';
    this.pathTexture = './assets/textures/avatar/';
    this.skeletonBase = 'skeleton';

    this.rotateAll = o.fullRotation || false;

    this.extraUpdate = null;

    this.isFpsOnly = o.fpsOnly || false;

    this.autoCenter = o.autoCenter !== undefined ? o.autoCenter : true;

    this.isPostUpdate = true;
    this.lockHip = false;

    this.handCorrect = false;

    this.isWithExoSkeleton = o.exoskeleton || false;

    this.callback = o.callback || function (){};
    this.gender = o.gender || '';
    this.mode = o.mode || 'standard';
    this.superTest = o.superTest || false;
    this.prefix = o.prefix || '';
    this.size = o.size || 1;

    this.extraParts = [];

    this.onToggle = false;



    this.startAnimation = 'idle';

    this.mesh = null;
    this.skin = null;
    this.helper = null;
    this.axis = null;
    this.template = null;

    this.armTween = null;

    this.armature = null;

    this.exoskel = null;

    this.angleV = 0;
    this.angleH = 0;

    this.offsets = {

        abdomen:[ 0,-3,0],
        chest:[ 0,-2.5,0],
        neck:[ 0,32,0],
        head:[ 0,-22,0],
        
        // arm
        //['lCollar', -3,-6,-3],
        lCollar:[ -6.5,-6,-2],
        lShldr:[ -11,-2, 45],
        lForeArm:[ -1,-11,0],
        lHand:[ -3,1,-1.5],
        // finger
        lThumb1:[ -70,35,-22],
        //lThumb1:[ -45,30,-12],
        lThumb2:[ 0,0,-16],
        lThumb3:[ 0,0,10],

        lIndex1:[ 0,-8, -5 ],
        lMid1:[ 0,-14,-5],
        lRing1:[ 0,-20,-5],
        lPinky1:[ 0,-25,-6],


        // leg
        lThigh:[ 0,0.5,8],
        lShin:[ 0,-6,0],
        lFoot:[ 16,5,-6],

    };

    this.oldOffests = {

        abdomen:[ 0,-6,0],
        chest:[ 0,-6,0],
        neck:[ 0,25,0],
        head:[ 0,-20,0],
        // leg
        lThigh:[ 0,0,8],
        lFoot:[ 15,-2,-10],
        // arm
        lShldr:[ 0,-3,47],
        lForeArm:[ 0,-7,0],
        //finger
        lThumb1:[ 0,15,5],
        lIndex1:[ 0,0,5],
        lMid1:[ 0,-5,3],
        lRing1:[ 0,-10,2],
        lPinky1:[ 0,-15,10],

    }


    this.items = {};
    this.nodes = null;
    this.animations = [];

    this.isPlay = false;
    this.isReady = false;

    

    this.materialReady = false;
    this.animationReady = false;
    this.modelReady = false;
    this.isDisplay = false;

    this.currentPlay = '';


    this.animInfo_one = { name:'', time:0, frame:0, frameMax:0, frameTime:0, timeScale:0 };
    this.animInfo_two = { name:'', time:0, frame:0, frameMax:0, frameTime:0, timeScale:0 };
 

    this.frameTime = 0;

    this.center = new THREE.Vector3(0,1.4,0);
    this.crouch = new THREE.Vector3(0,0,0);
    this.tmpV = new THREE.Vector3();

    this.isCrouch = false;


    this.mtx = new THREE.Matrix4();
    this.tmpQ = new THREE.Quaternion();
    this.tmpE = new THREE.Euler();

    this.armMask = [];
    this.extraHelper = [];

    this.rDecal = 0;

    this.running = false;


    this.isBestAlign = true;
    this.decalArm = false;
    this.fixeArm = false;
    this.fixeHip = false;
    

    this.decal = [ 0, 0, 0 ];


    this.decals_MM = [ [-17,-8,16], [ 0, 0, 0 ], [ -6,8,-25 ]];// mid shoulder


    this.action = 0;
    this.direction = [0,0];

    this.prevAction = -1;
    this.prevFront = 0
    this.prevSide = 0;




    // WEAPON
    this.isWithWeapon = o.weapon || false;
    this.startGun = o.startGun || 'none';
    this.isNewGun = true;
    this.weapons = null;


    // for shooter_1
    if( o.oldVersion ) this.oldVersion( true );


    //let self = this;

    //root.view.clearTmpPool();

    //root.load(['avatar/'+this.skeletonBase+'.glb', 'avatar/man.glb', 'avatar/woman.glb', 'avatar/zombi.glb', 'avatar/lee.glb', 'avatar/ryder.glb'], function(){ this.init() }.bind(this) );

    //root.load(['avatar/'+ self.skeletonBase +'.glb', 'avatar/man.glb', 'avatar/woman.glb', 'avatar/zombi.glb', 'avatar/lee.glb', 'avatar/ryder.glb'], function(){ self.init() } );

    Pool.load([
        './assets/models/avatar/'+ this.skeletonBase +'.glb', 
        './assets/models/avatar/man.glb', 
        './assets/models/avatar/woman.glb', 
        './assets/models/avatar/zombi.glb', 
        './assets/models/avatar/lee.glb', 
        './assets/models/avatar/ryder.glb'
        ], function(){ this.init() }.bind(this) );

}

Avatar.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {

    constructor: Avatar,

    isGroup: true,

    oldVersion: function ( b ) {

        this.decals_MM = [ [-8.7,13,5], [ -8, 14, 0 ], [ -10.8,15,-5 ]]; // mid shoulder

        this.decalArm = b;
        this.fixeArm = b;
        this.fixeHip = b;
        this.isNewGun = !b;
        this.isBestAlign = !b;

    },

    setAction: function ( action, direction ) {

        if( !this.isReady ) return;

        var crouching = false;

        this.action = action;
        this.direction = direction || [0,0];

        let front = this.direction[0], side = this.direction[1], offset = 0, anim = '', p, pn, nn, final;

        if( ( this.prevAction !== this.action ) || ( this.prevFront !== front ) || ( this.prevSide !== side ) ){

            // get prev anim info
            p = this.mesh.getAnim();
            pn = p.name.substring(3, 6);

            this.prevAction = this.action;
            this.prevFront = front;
            this.prevSide = side;

           

            if( this.mode === "standard" ){

                switch( this.action ){

                    case 0 : anim = 'idle'; break;
                    case 1 : anim = 'walk'; break;
                    case 2 : anim = 'run'; break;
                    case 3 : anim = 'walk'; break;

                    case 4 : anim = 'jump'; break;
                    case 5 : anim = 'crouch_idle'; this.isCrouch = true; break;

                    case 16 : anim = 'left_turn'; break;
                    case 17 : anim = 'right_turn'; break;


                    case 20 : anim = 'hit'; break;
                    case 21 : anim = 'die'; break;

                }

                anim = this.prefix + anim;

                if(anim==='z_left_turn') anim = 'z_walk';
                if(anim==='z_right_turn') anim = 'z_walk';
              

            } else if( this.mode === "fps" ){

                switch( this.action ){

                    case 0 : anim = 'idle'; break;
                    case 1 : anim = 'walk'; break;
                    case 2 : anim = 'jog'; break;
                    case 3 : anim = 'crouch'; crouching = true; break;
                    case 4 : anim = 'jump'; break;
                    case 5 : anim = 'crouch_idle'; crouching = true; break;
                    case 6 : anim = 'run'; break;

                    case 16 : anim = 'walk'; break;
                    case 17 : anim = 'walk'; break;

                }

                if( this.isCrouch !== crouching ) this.isCrouch = crouching; 

                //this.running = anim ==='run' || anim ==='jog' ? true : false;

                if( anim === 'walk' || anim ==='run' || anim ==='jog' || anim === 'crouch' ){

                    if( front === 1 && side === 0 ) anim += '_F';
                    if( front === -1 && side === 0 ) anim += '_B';
                    if( front === 0 && side === 1 ) anim += '_L';
                    if( front === 0 && side === -1 ) anim += '_R';

                    if( front === 1 && side === 1 ) anim += '_FL';
                    if( front === 1 && side === -1 ) anim += '_FR';
                    if( front === -1 && side === 1 ) anim += '_BL';
                    if( front === -1 && side === -1 ) anim += '_BR';

                }

                if( anim === 'jump' ) anim += '_up';


                nn = anim.substring(0, 3);

                if( nn === 'cro' ) nn = "wal";
                if( pn === nn ) offset = p.time;
                if( pn === 'wal' && nn === 'jog' ) offset = p.time*0.5;
                if( pn === 'jog' && nn === 'wal' ) offset = p.time*2;

                anim = this.prefix + anim;

            }

            if( anim !== '' ){

	            

                //if( final === 'm0_idle' ) final = 'idle';

                //console.log( offset )

	            //this.play( final, 0.333, offset );

                if( !this.isFpsOnly ) this.play( anim, 0.25, offset );

	        }

        }

    },

    setPrefix: function ( n ){

        this.prefix = 'm'+n+'_';

    },

    strictFPS: function ( b ) {

        // reset root:
        this.rotateAll = b;
        this.isFpsOnly = b;
        this.autoCenter = !b;
        this.fixeHip = !b;
        this.decalArm = !b;

        

        if(!b){

            this.crouch.y = 0;

            this.nodes.root.position.set(0,0,0);
            this.nodes.root.quaternion.identity();
            
            this.prevAction = -1;
            this.setAction( 0, this.direction );

        } else {

            this.mesh.stopTrack();

            
            //this.setRotation( 'hip', -180, 0 , -90 )
            this.setRotation( 'MA', 0, 0, 0 )
            this.setRotation( 'MC', 0, 0, 0 )
            this.setRotation( 'MM', 0, 0, 0 )
            this.setRotation( 'MN', 0, 0, 0 )
            this.setRotation( 'MH', 0, 0, 0 )

            // reset hip
            this.nodes.hip.position.set(0,0.92,0);
            this.nodes.hip.quaternion.set(-0.706989,-0.707224, 0.0006767364, -0.000608732342 );

            this.center.set( -0.1,1.38, 0 );

            //console.log( this.nodes.hip.quaternion )
        }

    },

    update: function ( delta ){

        if( !this.isReady ) return;



        // update animation
    	this.mesh.updateMixer( delta );


        this.animInfo_one = this.mesh.getAnim('one');
        this.animInfo_two = this.mesh.getAnim('two');

        if( this.weapons !== null ) this.weapons.update( delta );

        if( this.rotateAll ){
            if( this.isCrouch ){
                if (this.crouch.y > -0.6 ) this.crouch.y -= 0.03;
                else if (this.crouch.y <= -0.6 ) this.crouch.y = -0.6; 
            } else {
                if (this.crouch.y < 0 ) this.crouch.y += 0.03;
                else if (this.crouch.y >= 0 ) this.crouch.y = 0;
            }
        }

        this.updateMatrix();



        if( !this.isPostUpdate ) this.postUpdate();

        if( this.extraUpdate !== null ) this.extraUpdate();





        

    },

    postUpdate: function () {

        if( this.lockHip ){

            this.nodes.hip.position.x = 0;
            this.nodes.hip.position.z = 0;

        }

        if( this.rotateAll ){

            //this.nodes.root.position.set(0,0,0);
            this.nodes.root.quaternion.identity();

        }

        // get head position
        if( this.autoCenter ) this.getPos( this.nodes.MM, this.center, true );

        //console.log(this.center)

        if( this.prefix === 'm0_' ) return;

        if( !this.rotateAll ){


            if( this.mode === "fps" || this.superTest ){

                var v =  Math.abs( this.angleV / 90 );
                var side = this.angleV < 0 ? 1:-1;


                //var erx = 0;//Math.abs( this.angleV * 0.5 );

                var bend = this.angleV / 3;

                //var dx = this.isNewGun ? 45 : 0;

                //var d = [0,0,0];
                if( this.decalArm ){

                    if( side === 1 ) {
                        math.lerpAr( this.decal, this.decals_MM[1], this.decals_MM[2], v );
                    } else {
                        math.lerpAr( this.decal, this.decals_MM[1], this.decals_MM[0], v );
                    }

                }

                // reset hip rotation
                if( this.fixeHip ){
                    //this.m.copy( this.nodes.hip.matrix );
                    //this.m.decompose( {x:0,y:0, z:0}, this.q, {x:0,y:0, z:0} );
                    this.tmpQ.copy( this.nodes.hip.quaternion );
                    this.setRotation( 'MA', bend, 180 , 90 ).premultiply(  this.tmpQ.invert() );
                } else {
                    this.setRotation( 'MA', 0, bend, 0 );
                }

                this.setRotation( 'MM', this.decal[0], bend + this.decal[1] , this.decal[2] );
                
                //this.setRotation( 'MC', this.decal2[0], bend + this.decal2[1] , this.decal2[2] );


                //this.setRotation( 'MM', this.decal[0]+ this.decal2[0], this.angleV*0.5 + this.decal[1] + this.decal2[1], this.decal[2]+this.decal2[2] );
                //this.setRotation( 'MC', this.decal[0], this.angleV*0.5 + this.decal[1] + erx, this.decal[2] );


                //this.q.setFromAxisAngle( {x:0, y:1, z:0}, bend*math.torad );
               // this.nodes.MC.quaternion.multiply( this.q );

                //this.q.copy(this.nodes.abdomen.quaternion)
                //this.nodes.MC.quaternion.setFromAxisAngle( {x:0, y:1, z:0}, this.angleV*math.torad ).premultiply( this.q.invert() );

                this.setRotation( 'MC', 0, bend, 0 );
                this.setRotation( 'MN', 0, bend*0.5, 0 );
                this.setRotation( 'MH', 0, bend*0.5, 0 );

                //*math.torad, 180*math.torad, 90*math.torad
                //this.nodes.MA.quaternion.setFromEuler( this.e ).premultiply( this.q.inverse() );

                // add rotation decal for tps view
                this.nodes.MA.rotation.x += ( this.rDecal * math.torad );
                

            }

        } else {

            

            /*this.tmpQ.copy( this.nodes.hip.quaternion );
            this.setRotation( 'MA', 0, 180 , 90 ).premultiply(  this.tmpQ.invert() );
            this.nodes.MA.rotation.x += ( this.rDecal * math.torad );*/

            var axis = {x:1, y:0, z:0};
            var theta = this.angleV * math.torad;

            this.tmpV.copy( this.center ).add( this.crouch );

            this.nodes.root.position.copy( this.crouch ).sub( this.tmpV ).applyAxisAngle( axis, theta ).add( this.tmpV ); 

            //this.nodes.root.position.set( 0,0,0 ).sub( this.center ).applyAxisAngle( axis, theta ).add( this.center );
            this.nodes.root.quaternion.setFromAxisAngle( axis, theta );


            


        }



        if( this.axis !== null ) {

            this.axis.position.copy( this.center );
            this.axis.rotation.x = this.angleV * math.torad;
            this.axis.rotation.y = this.rotation.y;

        }
    },




    init: function () {

        //console.log('Avatar init !!')

        if(  this.mesh !== null ){
            this.remove( this.mesh );
            this.remove( this.revers );
        }

        if( !this.isBestAlign ) this.offsets = this.oldOffests;

    	// first load armature skeleton
  
        Pool.get( this.skeletonBase ).traverse( function ( node ) {

            if( node.type === 'SkinnedMesh' ) this.armature = node;

        }.bind(this));

        this.mesh = this.armature.clone( root.mat.skin, this.offsets, this.isBestAlign );
        this.mesh.skeleton.getDimension();

        this.mesh.castShadow = false
        this.mesh.receiveShadow = false
        this.mesh.visible = false

        // you can change scale of model
        this.mesh.scale.set(1,1,1).multiplyScalar( this.size );

        // add animation mixer to mesh
        this.mesh.addMixer();

        this.add( this.mesh );

        // extra object for easyer control

        this.revers = new THREE.Group();
        this.revers.matrixAutoUpdate = false;
        this.add( this.revers );

        // nodes is the list of bones by name
        this.nodes = this.mesh.skeleton.nodes;

        if( this.isPostUpdate ) this.mesh.skeleton.postUpdate = this.postUpdate.bind( this );

        if( this.superTest  ) this.addAxis();


        //this.makeMaterial();


        /// load Animation

        this.matrixAutoUpdate  = false;
        this.modelReady = true;

        // share animation between avatar

        if( root.animator === null ){

            let self = this;
            //root.animator = new Animator( this.armature, this.offsets, this.isBestAlign, function() { self.animLoaded() } );

            root.animator = new Animator( this.armature, this.offsets, this.isBestAlign, function() { this.animLoaded() }.bind(this) );

        } else {

            this.animLoaded();

        }

    },


    animLoaded: function () {

        // add all clip from Animator

        for( var c in root.animator.clips ){

            this.mesh.addAnimation( root.animator.clips[c] );
            this.animations.push( c );

        }

        
        this.animationReady = true;

        this.makeMaterial();

    },

    makeSkin: function () {

       //console.log('make skin !!')

        this.isReady = true;

        if( this.gender !== '' ){

            if( this.startAnimationv && !this.isFpsOnly ) this.play( this.startAnimation );

            this.setGender();
            // hide skin at start
            this.skin.visible = false;

            this.display();

        }

        if( this.isWithWeapon ) this.weapons = new Weapon( { parent:this, newGun:this.isNewGun, callback:this.callback, startGun:this.startGun, fixeArm:this.fixeArm } );
        else this.callback();

    },

    setGender: function ( gender ) {

        this.clearSkin();

        if( gender ) this.gender = gender;

        var mm;

        var h, l;

        if( this.gender === 'z_man' || this.gender === 'z_woman' ){

        	root.getPool( 'zombi_scene' ).traverse( function ( node ) { if( node.name === this.gender ) mm = node; }.bind(this) );

        } else {

        	root.getPool( this.gender + '_scene' ).traverse( function ( node ) {

	            if( node.type === 'SkinnedMesh') mm = node;
	            if( node.name === 'hair') h = node.clone();
	            if( node.name === 'logo') l = node.clone();

	        });

        }

        
        this.skin = mm.clone();
        //this.skin = new THREE.SkinnedMesh().copy( mm );


        if( this.gender === 'man' || this.gender === 'woman') this.skin.material = this.material;

        if( this.gender === 'z_man' || this.gender === 'z_woman'){ 
            this.skin.material = this.zombiMaterial;
            this.prefix = 'z_';
        }


        var autoResize = this.gender === 'man' ? false : true;

        this.skin.skeleton.setReference( this.mesh.skeleton, this.revers, autoResize );

        // for AO map
        if( !this.skin.geometry.attributes.uv2 )
        this.skin.geometry.setAttribute( 'uv2', this.skin.geometry.attributes.uv );


        this.skin.castShadow = true;
        this.skin.receiveShadow = true;


        //this.add( this.skin );

        // position adjustement
        //this.mesh.skeleton.nodes.root.position.y = this.skin.skeleton.footPos;


        if( this.gender === 'ryder' ){

            this.extraParts.push('hair', 'logo');
        	this.attachToBone( h, 'head', [0,0,0], [0,0,0], 1, true );
        	this.attachToBone( l, 'chest', [0,0,0], [0,0,0], 1, true );

        }


        this.add( this.skin );

        if( this.isWithExoSkeleton ) this.exoskeleton( true );


        if( this.gender === 'man' || this.gender === 'woman') this.makeEye( 0.01 );

    },

    /*setRotationDecal: function ( a ) {

        this.rDecal = a * math.torad;

    },*/


    setAngle: function ( h, v, force ) {

        this.angleV = v;
        this.angleH = h;

    },

    showOnlyArm: function ( b ) {

        if( !this.isReady ) return;

        if( this.gender === 'z_man' || this.gender === 'z_woman' ) return;

        if( b ){

            if( this.gender === 'lee' ){
                var mat = this.skin.material;
                mat.alphaMap = this.armMask[1];
                mat.transparent = true;
                mat.alphaTest = 0.9;
                this.skin.material.needsUpdate = true;
            } else {
               this.skin.material = this.material_hide;
            }

            if( this.items.eyes ) this.items.eyes.visible = false;

        } else {

            if( this.gender === 'lee' ){
                var mat = this.skin.material;
                mat.alphaMap = null;
                mat.transparent = false;
                this.skin.material.needsUpdate = true;
            } else {

                 this.skin.material = this.material;

            }

            //this.eyes.visible = true;
            if( this.items.eyes ) this.items.eyes.visible = true;

        }

    },


    clearSkin: function () {

        if( this.skin !== null ){

            this.remove( this.skin );
            this.skin.geometry.dispose();

            var i = this.extraParts.length;
            while( i-- ) this.clearItem( this.extraParts[i] );
            this.extraParts = [];

        }

    },

    clear: function () {

        if( this.modelReady ){

            this.mesh.stopAll();
            this.mesh.clearMixer();

            this.remove( this.mesh );
            this.remove( this.revers );
            this.clearSkin();

        }
    },

    display: function () {

        if( this.isDisplay ) return;

        if( this.materialReady && this.animationReady && this.modelReady ){

            this.material.needsUpdate = true;
            this.zombiMaterial.needsUpdate = true;
            this.skin.visible = true;
            this.isDisplay = true;

            if( this.items.eyes ){ 
                this.items.eyes.visible = true;
                this.eyeMaterial.needsUpdate = true;
            }

        }

    },

    // --------------------------
    //
    //  EXOSKELETON 
    //  extra cdollision box
    //
    // --------------------------

    exoskeleton: function ( b ) {

        if(b){
            if(this.exoskel === null ){
                this.exoskel = new ExoSkeleton( this );
                this.revers.add( this.exoskel );
            }
            
        } else {

            if( this.exoskel !== null ){
                this.exoskel.clear();
                this.revers.remove( this.exoskel );
                this.exoskel = null;
            }

        }

    },


    // --------------------------
    //
    //  EYE
    //
    // --------------------------

    makeEye: function ( s ) {

        s = s || 1;

    	var eyeDecal = this.gender === 'man' ?  [3.357*s, 10*s, 7.3*s ] : [3.391*s, 9.5*s, 7.3*s];

        s *= 1.77;

        if( !this.items.eyes ){

            var eyeGeo = root.geo.sphere;

            var eyes = new THREE.Group();
            eyes.name = 'eyes';
            var eyeR = new THREE.Mesh( eyeGeo, this.eyeMaterial );
            var eyeL = new THREE.Mesh( eyeGeo, this.eyeMaterial );

            eyeL.scale.set( s, s, s );
            eyeR.scale.set( s, s, s );

            eyeL.rotation.x = -10*math.torad;
            eyeR.rotation.x = -10*math.torad;

            eyeR.castShadow = false;
            eyeL.castShadow = false;
            eyeL.receiveShadow = true;
            eyeR.receiveShadow = true;

            eyeR.position.fromArray( eyeDecal );
            eyeL.position.fromArray( eyeDecal );
            eyeL.position.x *= -1;

            eyes.add( eyeR );
            eyes.add( eyeL );

            //this.attachToBone( eyes, 'head', [180,0,90], [0,0,0], 1, this.isDisplay  );
            this.attachToBone( eyes, 'head', [0,180,90], [0,0,0], 1, this.isDisplay  );
            this.extraParts.push('eyes');

        }

    },



    // --------------------------
    //
    //  WEAPON
    //
    // --------------------------

    setWeaponAction: function ( action, force ) { if( this.weapons !== null ) this.weapons.setAction( action, force ); },

    ejectBullet: function ( time ) { if( this.weapons !== null ) this.weapons.ejectBullet( time ); },

    toggleWeapon: function ( d ) { if( this.weapons !== null ) return this.weapons.toggleWeapon( d ); },
    ontoggleWeapon: function ( d ) { return this.weapons.onToggle; },

    displayGun: function ( name ){ if( this.weapons !== null ) this.weapons.displayGun( name ); },

    hideScope: function ( b ) { if( this.weapons !== null )  this.weapons.hideScope( b ); },

    removeGun: function ( b ) { if( this.weapons !== null ) this.clearItem( 'GUNS' ); },



    // --------------------------
    //
    //  ITEMS
    //
    // --------------------------

    clearItem : function ( name ){

        if( this.items[ name ] ){

            var g = this.items[ name ];
            g.remove( g.children[0] );
            this.revers.remove( g );

            delete this.items[ name ];
            //this.items[ name ] = undefined;

        }

    },

    getItem: function ( name, childName ){

        var m = this.items[ name ].children[0];
        if( childName ) {

            let i = m.children.length;
            while(i--){
                if( m.children[i].name === childName ) { m = m.children[i]; break; }
            }

        }

        m.userData.pos = m.position.toArray();
        m.userData.rot = [ math.toFixed( m.rotation.x*math.todeg, 2),  math.toFixed(m.rotation.y*math.todeg, 2),  math.toFixed(m.rotation.z*math.todeg, 2) ];

        return m;

    },

    setItem: function ( name, childName, pos, rot, size ){

        if(name === 'GUNS') this.weapons.setItem( childName, pos, rot, size );

    },

    attachToBone: function ( mesh, bone, rot, pos, size, visible ){

        var name = mesh.name;
        var g = new THREE.Group();

        

        //var order = 'XYZ' 

        var order = 'XYZ';

        //console.log(mesh.name, order)

        //g.userData.pos = pos;
        //g.userData.rot = rot;

        if( pos ) mesh.position.set( pos[0], pos[1], pos[2] );
        if( rot ) mesh.quaternion.setFromEuler( new THREE.Euler( rot[0]*math.torad, rot[1]*math.torad, rot[2]*math.torad, order ) );//'YZX'//'ZYX'
        if( size ) mesh.scale.set( 1,1,1 ).multiplyScalar( size || 1 );

        //g.matrix = this.mesh.nodes[ bone ].matrixWorld;
        g.matrix = this.mesh.skeleton.nodes[ bone ].matrixWorld;
        g.matrixAutoUpdate = false;

        //g.frustumCulled = false;

        g.visible = visible || false;

        g.add( mesh );
        this.revers.add( g );

        //this.skin.add( g );
        this.items[ name ] = g;

    },


    // --------------------------
    //
    //  MATERIAL
    //
    // --------------------------

    makeMaterial: function () {

        this.testMat = new THREE.MeshBasicMaterial({ color:0x666666, wireframe:true, toneMapped:false, skinning:true });

        this.material = root.prevMaterial('Avatar');
        this.eyeMaterial = root.prevMaterial('Eyes');
        this.zombiMaterial = root.prevMaterial('Zombi');

        if( this.material !== null && this.eyeMaterial !== null && this.zombiMaterial !== null ){

            this.materialReady = true;
            this.makeSkin();
            return;

        }

        this.nmap = 0;
        //var mapcallback = function () { this.nmap ++; if( this.nmap === 7 ){ this.materialReady = true; this.display(); } }.bind(this)
        var mapcallback = function () { this.nmap ++; if( this.nmap === 11 ){ this.materialReady = true; this.makeSkin(); } }.bind(this)

        var encode = true;

        this.armMask[0] = root.loadTextures( this.pathTexture + 'avatar_alpha.jpg', { flip:false });
        this.armMask[1] = root.loadTextures( this.pathTexture + 'avatar_alpha_lee.jpg', { flip:false });

    	var map = root.loadTextures( this.pathTexture + 'avatar_d.jpg', { flip:false, encoding:encode, callback:mapcallback });
    	var normal = root.loadTextures( this.pathTexture + 'avatar_n.jpg', { flip:false, callback:mapcallback });
    	var ao = root.loadTextures( this.pathTexture + 'avatar_ao.jpg', { flip:false, callback:mapcallback });
    	var metal = root.loadTextures( this.pathTexture + 'avatar_m.jpg', { flip:false,  callback:mapcallback });
    	var subdermal = root.loadTextures( this.pathTexture + 'avatar_u.jpg', { flip:false, encoding:encode, callback:mapcallback });

    	var eyeMap = root.loadTextures( this.pathTexture + 'eye_d.jpg', { flip:false, repeat:[2,1], encoding:encode, callback:mapcallback });
    	var eyeNormal = root.loadTextures( this.pathTexture + 'eye_n.jpg', { flip:false, repeat:[2,1], callback:mapcallback });

    	this.material = new THREE.MeshStandardMaterial({name:'Avatar', skinning:true, map:map, normalMap: normal, aoMap: ao, metalnessMap:metal, roughness:1, metalness:1 });
        //this.material_hide = new THREE.MeshStandardMaterial({name:'Avatar_hide', skinning:true, map:map, normalMap: normal, aoMap: ao, metalnessMap:metal, roughness:1, metalness:1, alphaMap:armMask, transparent:true, alphaTest:0.9 });
    	this.eyeMaterial = new THREE.MeshStandardMaterial({ name:"Eyes", map:eyeMap, normalMap:eyeNormal, roughness:0.2, metalness:0.75 });


    	var mapSkinFrag = [
	        '#ifdef USE_MAP',
	        'vec4 underColor = texture2D( subdermal, vUv );',
	        'vec4 texelColor = texture2D( map, vUv );',
	        'float mx = ((underColor.r + underColor.g)-underColor.b)*0.5;',
	        'texelColor.xyz = mix( texelColor.xyz,vec3(0.0,underColor.g,underColor.b),  underColor.b*0.2 );',
	        'texelColor = mapTexelToLinear( texelColor );',
	        'diffuseColor *= texelColor;',
	        '#endif',
	    ].join("\n");

    	this.material.onBeforeCompile = function ( shader ) {

    		shader.uniforms['subdermal'] = { value: subdermal };

    		var fragment = shader.fragmentShader;

    		fragment = fragment.replace( 'varying vec3 vViewPosition;', ['varying vec3 vViewPosition;', 'uniform sampler2D subdermal;' ].join("\n") );

    		fragment = fragment.replace( '#include <roughnessmap_fragment>', ['float roughnessFactor = roughness;', '#ifdef USE_METALNESSMAP', 'vec4 texelRoughness = vec4(1.0) - texture2D( metalnessMap, vUv );', 'roughnessFactor *= texelRoughness.g;', '#endif' ,''].join("\n") );
            fragment = fragment.replace( '#include <metalnessmap_fragment>', ['float metalnessFactor = metalness;', '#ifdef USE_METALNESSMAP', 'vec4 texelMetalness = texture2D( metalnessMap, vUv );', 'metalnessFactor *= texelMetalness.b;', '#endif' ,''].join("\n") );

            fragment = fragment.replace( '#include <map_fragment>', mapSkinFrag );

    		shader.fragmentShader = fragment;

    	};


    	root.addMaterial( this.material );
    	root.addMaterial( this.eyeMaterial );


        this.material_hide = this.material.clone();
        this.material_hide.name = 'avatar_mask';
        this.material_hide.alphaMap = this.armMask[0];
        this.material_hide.transparent = true;
        this.material_hide.alphaTest = 0.9;
        root.addMaterial( this.material_hide );


        // zombi material

        var zmap =  root.loadTextures( this.pathTexture + 'zombi/zombi_c.jpg', { flip:false, encoding:encode, callback:mapcallback });
        var znormalMap = root.loadTextures( this.pathTexture + 'zombi/zombi_n.jpg', { flip:false, callback:mapcallback });
        var zmetalnessMap = root.loadTextures( this.pathTexture + 'zombi/zombi_m.jpg', { flip:false, callback:mapcallback });
        var zroughnessMap = root.loadTextures( this.pathTexture + 'zombi/zombi_r.jpg', { flip:false, callback:mapcallback });


        this.zombiMaterial = new THREE.MeshStandardMaterial({
            name: 'Zombi',
            map: zmap,
            normalMap: znormalMap,
            metalnessMap: zmetalnessMap,
            roughnessMap: zroughnessMap,
            roughness:1,
            metalness:1,
            skinning:true,
        });


        root.addMaterial( this.zombiMaterial );


    },



    // --------------------------
    //
    //  ANIMATION
    //
    // --------------------------

    resetAnimator: function ( callback ) {

        if( root.animator !== null ){

            root.animator = new Animator( this.armature, this.offsets, this.isBestAlign, function() { 

                callback()

             }.bind(this), true )

        }

    },

    addAnimation: function ( o ) {

        var name = o.name;

        root.animator.addAnimation( o, function(){

             this.mesh.addAnimation( root.animator.clips[name] );

        }.bind(this) )

    },

    setTimeScale: function ( t ) {

        this.mesh.setTimeScale( t );

    },


    setWeight: function ( name, weight ) {

        this.mesh.setWeight( name, weight );

    },

    play: function ( name, crossfade, offset, weight, tracks ){

        /*if( this.isFpsOnly ){
            if(tracks !== 'two') return;
        }*/


        if( name === 'idle' ) offset = !offset ? math.rand( 0, 20 ) : offset;

        //

        var pr = name.substring( 0,3 );

        //if( pr === 'w1_' || pr === 'w2_' ) this.handCorrection();

        if( pr === 'm1_' || pr === 'm2_'|| pr === 'm0_' ){
            if( pr !== this.prefix ){
            	if(pr === 'm0_') this.setPrefix('0');
                if(pr === 'm1_') this.setPrefix('1');
                if(pr === 'm2_') this.setPrefix('2');

            }

        }

        this.autoCorrect( pr );

        this.currentPlay = name;

        //this.unPause();
        this.mesh.play( name, crossfade, offset, weight, tracks );

    },

    fadeAll: function ( crossFade ) {

        this.mesh.fadeAll( crossFade );

    },

    playOne: function ( f ) {

        this.mesh.playFrame( this.currentPlay, f, 1 )

        /*var offset = f * this.frameTime;
         this.mesh.play( this.currentPlay, 0, offset, 1 );
         this.pause();*/

    },

    getAnimInfo: function (){

        var anim = this.mesh.getAnim();

        this.currentPlay = anim.name;
        this.frameTime = anim.frameTime;

        //if( ui ) ui.updateTimeBarre( anim.frame, anim.frameTime, anim.frameMax );

    },

    pause: function () {

        this.mesh.pauseAll();
        this.isPlay = false;

    },

    unPause: function () {

        this.mesh.unPauseAll();
        this.isPlay = true;

    },

    
    autoCorrect : function ( pr ){

        switch( pr ){

            case 'm2_' :
                this.setRotation( 'LFO', 0, -12, 0 );
                this.setRotation( 'RFO', 0, -12, 0 );
            break;
             case 'm1_' :
                this.setRotation( 'LFO', 0, 0, 0 );
                this.setRotation( 'RFO', 0, 0, 0 );
            break;
            case 'm0_' :
                this.setRotation( 'LT0', 0, 30, 0 );
                this.setRotation( 'RT0', 0, 30, 0 );
                this.setRotation( 'LFO', 0, -12, 0 );
                this.setRotation( 'RFO', 0, -12, 0 );
                this.setRotation( 'MA', 0, -5, 0 );
                //this.setRotation( 'LF', 0, 30, 0 );
                //this.setRotation( 'RF', 0, 30, 0 );

            break;

            default:
                /*if(!this.handCorrect){
                    this.setRotation( 'LT0', 0, 0, 0 );
                    this.setRotation( 'RT0', 0, 0, 0 );
                    this.setRotation( 'LF', 0, 0, 0 );
                    this.setRotation( 'RF', 0, 0, 0 );
                }*/
                this.setRotation( 'LFO', 0, 0, 0 );
                this.setRotation( 'RFO', 0, 0, 0 );
            break;

        }


    },


    // --------------------------
    //
    //  BONES CONTROLE
    //
    // --------------------------

    setRotation: function ( name, x, y, z ){

    	var nodes = this.nodes;

        nodes[name].rotation.set( x*math.torad, y*math.torad, z*math.torad, 'XYZ' );//'YZX'

        nodes[name].updateMatrix();

        return nodes[name].quaternion;

    },

    getRotation: function ( name, world ){

        var r = this.nodes[name].rotation.toArray();

        if( world ){
            this.nodes[name].getWorldQuaternion(  this.tmpQ );
            r = this.tmpE.setFromQuaternion( this.tmpQ ).toArray();
        }

        return [ Math.round(r[0]*math.todeg), Math.round(r[1]*math.todeg), Math.round(r[2]*math.todeg) ];

    },

    getPos: function ( m, v, local ){

        m.getWorldPosition( v );
        if( local ) v.applyMatrix4( this.mtx.copy(this.parent.matrixWorld).invert() )
        //else 

    },




    // --------------------------
    //
    //  OPTION
    //
    // --------------------------

    debug: function ( b ) {

        if( b ){
            if( this.helper === null ){
                this.helper = new THREE.SkeletonHelper( this.mesh );
                this.revers.add( this.helper );
                this.extraDebug( b );
            }
        } else {
            if( this.helper !== null ){
                this.revers.remove( this.helper );
                this.helper.material.dispose();
                this.helper.geometry.dispose();
                this.helper = null;
                this.extraDebug( b );
            }

        }

    },

    extraDebug: function ( b ) {

        var list = [
        'MA', 'MC', 'MM', 'MN', 'MH',
        'LTH', 'RTH', 'LSH', 'RSH',
        'RFO', 'LFO', 'LS', 'RS', 'LF', 'RF', 'LH', 'RH', 
        //'LT0', 'RT0'
        ]
        var i, bone, ex;

        if( b ){
            i = this.mesh.skeleton.bones.length
            while(i--){
                bone = this.mesh.skeleton.bones[i];
                if( list.indexOf( bone.name ) !== -1 ){ 

                        ex = new BoneHelper(0.05);     
                        ex.matrix = bone.matrixWorld;
                        ex.matrixAutoUpdate = false;
                        this.extraHelper.push( ex )
                        this.revers.add( ex );
                    
                }
            }
        } else {
            i = this.extraHelper.length;
            while(i--){
                ex = this.extraHelper[i];
                this.revers.remove( ex );
            }
        }

    },



    addTemplate: function ( b ) {

        if( b ){

            if( this.template === null ){
                this.template = new THREE.Group();
                var m = new THREE.MeshBasicMaterial({ color:0x000000, depthTest: false, depthWrite: false, toneMapped: false, transparent: true  })

                var gg = new THREE.BoxBufferGeometry(0.002,2,0.002);
                var gg2 = new THREE.BoxBufferGeometry(0.002,1,0.002);

                var c = new THREE.Mesh( gg2, m );
                c.position.y = 1.5;

                var b = new THREE.Mesh( gg, m );
                b.position.y = 1.466;
                b.position.z = -0.015;
                b.rotation.z = math.PI90;

                this.template.add( c );
                this.template.add( b );

                var d = new THREE.Mesh( gg2, m );
                d.position.y = 0.5;
                d.position.x = 0.08738;
                this.template.add( d );

                var e = new THREE.Mesh( gg2, m );
                e.position.y = 0.5;
                e.position.x = -0.08738;
                this.template.add( e );

                this.add( this.template )

            } else {
                this.template.visible = true;
            }
        } else {
            if( this.template !== null ) this.template.visible = false;
        }

    },

    addAxis: function () {

            var gg = new THREE.BoxBufferGeometry(0.002,0.002,1);
            gg.translate( 0,0,0.5);

            //var gg2 = new THREE.BoxBufferGeometry(0.006,0.006,1);
            //gg2.translate( 0,0,0.5);

            var gg3 = new THREE.BoxBufferGeometry(0.03,0.03,0.8);
            gg3.translate( 0,0,0.4);


            this.axis = new THREE.Mesh( gg );
            var ball = new THREE.Mesh( new THREE.SphereBufferGeometry(0.01) );
            /*var axx = new THREE.Mesh( gg2 );
            axx.position.x = -0.055;
            axx.position.y = 0.05;*/

            var axx3 = new THREE.Mesh( gg3, new THREE.MeshBasicMaterial({ color: 0xFF0000 }) );
            axx3.position.x = -0.139;
            axx3.position.y = -0.06;

            //var bb0 = new THREE.BoxHelper( axx, 0xFF8810 );
            var bb = new THREE.BoxHelper( axx3, 0xFF0000 );
            
            ball.position.set(0,0,1.2);
            this.axis.add( ball );
            //this.axis.add( bb0 );
            this.axis.add( bb );
            this.revers.add( this.axis );

            this.axis.visible = false;

    },




})

export { Avatar };