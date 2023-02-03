/**   _  _____ _   _
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / https://github.com/lo-th
*/

import {
    Quaternion,
    Euler,
    Vector3,
    Matrix4,
    MathUtils,
    Bone,
    Skeleton,
    SkinnedMesh,
    AnimationMixer,
    AnimationUtils,
    AnimationClip,
    LoopRepeat,
    LoopOnce,
    QuaternionKeyframeTrack,
    VectorKeyframeTrack
} from "three";

import { BVHLoader } from '../../jsm/loaders/BVHLoader.js';


//-----------------------------------
//
//   SKINNEDMESH ADD
//
//-----------------------------------

SkinnedMesh.prototype = Object.assign( Object.create( SkinnedMesh.prototype ), {

    raycast: function ( raycaster, intersects ) {

        // NO RAYCAST ON SKINNING
        
    },

    clone: function ( material, offsets, premultiply ) {

        var mesh = new SkinnedMesh().copy( this ); 
        mesh.material = material !== undefined ? material : this.material;
        mesh.applySkeleton( this.skeleton, offsets, premultiply );
        return mesh;

    },

    applySkeleton: function ( skeleton, offsets, premultiply ) {

        var nodes = {};
        var baseBones = skeleton.bones;
        var lng = baseBones.length, i, o, name, order;
        var reference_position = [];
        var tmpOffsets = {};

        // decal strucvture for T_pose
        if( offsets !== undefined ){


            for( var k in offsets ){

                name = k
                o = offsets[k];

                order = premultiply ? 'XYZ':'YZX'

                tmpOffsets[ name ] = new Quaternion().setFromEuler( new Euler( MathUtils.degToRad( o[0] ), -MathUtils.degToRad( o[1] ), MathUtils.degToRad( o[2] ), order ) );
                if( name.substring(0,1) === 'l' ) tmpOffsets[ 'r' + name.substring(1) ] = new Quaternion().setFromEuler( new Euler( -MathUtils.degToRad( o[0] ), -MathUtils.degToRad( o[1] ), -MathUtils.degToRad( o[2] ), order ) ); 


            }

        }

        var bone, bones = [], kb, kbid = {}, parent;

        for( i = 0; i < lng; i++ ){

            kb = baseBones[ i ];
            kbid[ kb.name ] = i;

            bone = new Bone();
            bone.rotation.order ='YZX';
            bones.push( bone );

            bone.name = kb.name;

            bone.position.copy( kb.position );
            bone.quaternion.copy( kb.quaternion );

            if( offsets !== undefined ){

            	if( tmpOffsets[ bone.name ] ){

            		if( premultiply ) bone.quaternion.premultiply( tmpOffsets[ bone.name ] );
            		else bone.quaternion.multiply( tmpOffsets[ bone.name ] );

            	}

            	
                //if( tmpOffsets[ bone.name ] ) premultiply === true ? bone.quaternion.premultiply( tmpOffsets[ bone.name ] ) : bone.quaternion.multiply( tmpOffsets[ bone.name ] );

                


                 //bone.quaternion.identity();
                // bone.rotation.set(0,0,0);

            }

            bone.scale.set( 1,1,1 );
            bone.scalling = new Vector3( 1, 1, 1 );

            //bone.updateMatrix();

            //this.nodes[ bone.name ] = bone;
            nodes[ bone.name ] = bone;

        }



        for ( i = 0; i < lng; i ++ ) {

            kb = baseBones[ i ];

            parent = bones[ kbid[ kb.parent.name ] ];

            if( i === 0 ) this.add( bones[ i ] ); // add root bone to SkinnedMesh
            else parent.add( bones[ i ] );

            reference_position.push( bones[ i ].position.clone() );

        }

        this.updateMatrixWorld( true );

        this.bind( new Skeleton( bones ), this.matrixWorld );

        this.skeleton.reference_position = reference_position;

        this.skeleton.nodes = nodes;

        //console.log(this.skeleton.reference_position)

    },


    

    addMixer:function () {

        this.actions = [];

        this.timeScale = 1;
        //this.animation = {};
        //this.currentAnimation = null;
        //this.previousAnimation = null;
        //this.playing = false;

        this.animTracks = {

            one : { current:null, prev:null, playing:false },
            two : { current:null, prev:null, playing:false },
        
        };

        this.mixer = new AnimationMixer( this );

    },

    clearMixer: function () {

        this.mixer.uncacheRoot( this );
        this.mixer = null;

    },

    updateMixer:function ( delta ) {

        this.mixer.update( delta );

    },

    addAnimation: function ( clip ) {

        if( this.mixer === undefined ) this.addMixer();

        //option = option || {};


        if( clip.additive ){ 

            var ref = clip.ref !== '' ? this.getAction( clip.ref ).getClip() : undefined;
            var frame = clip.refFrame !== undefined ? clip.refFrame : 0; 
            AnimationUtils.makeClipAdditive( clip, frame, ref, clip.fps || 30 );

        }
        if( clip.start !== undefined && clip.end !== undefined ) clip = AnimationUtils.subclip( clip, clip.name, clip.start, clip.end, clip.fps || 30 );

        //this.animation[ clip.name ] = { clip:clip, timeScale:1 };
        //this.mixer.clipAction( clip ).setEffectiveWeight( 1.0 );//.play();

        var action = this.mixer.clipAction( clip );

        action.name = action._clip.name;
        action.duration = action._clip.duration;
        action.frameTime = action._clip.frameTime;
        action.repeat = action._clip.repeat;
        action.internTimeScale = clip.timeScale;//1;
        action.additive = clip.additive !== undefined ? clip.additive : false;

        if( action.additive ){
            this.activateAction( action, 0 );
            //console.log('active action ', clip.name)
        }

        //console.log(action)


        this.actions.push( action );

    },

    

    getAction: function ( name ){

        var anim = null;

        if ( typeof name === 'string' || name instanceof String ){

            this.actions.forEach( function ( action ) { if( action.name === name ) anim = action; });

        } else anim = name;

        if( !anim ) console.error( 'Animation "' + name + '" not found !' );

        return anim;
        
    }, 

    setWeight: function ( action, weight ) {

        action = this.getAction( action );
        if( !action ) return;
        
        action.enabled = true;
        action.paused = false;
        action.setEffectiveTimeScale( this.timeScale * action.internTimeScale );
        action.setEffectiveWeight( weight );

    },

    activateAction: function ( action, weight ) {

        if( weight !== undefined ) this.setWeight( action, weight );
        action.play();

    },

    activateAll: function () {

        this.actions.forEach( function ( action ) {

            action.play();

        });

    },

    stopAll: function () {

        this.actions.forEach( function ( action ) {

            action.stop();

        });

    },

    stopTrack: function ( track ) {

        let t = this.animTracks[ track || 'one' ];

        let c = t.current;
        let p = t.prev;
        if( c !== null ) c.stop();
        if( p !== null ) p.stop();


        t.current = null;
        t.prev = null;


    },

    

    setTimeScale: function ( value ) {

        this.timeScale = value;
        this.updateTimeScale();

        return this;

    },

    getTimeScale: function () {

        return this.timeScale;

    },

    updateTimeScale: function () {

        let c, p;
        for( var t in this.animTracks ){
            c = this.animTracks[t].current;
            p = this.animTracks[t].prev;
            if( c !== null ) c.setEffectiveTimeScale( this.timeScale * c.internTimeScale );
            if( p !== null ) p.setEffectiveTimeScale( this.timeScale * p.internTimeScale );
        }

        //this.currentAnimation.setEffectiveTimeScale( this.timeScale * this.currentAnimation.internTimeScale );
        return this;

    },

    //// TESTING ////

    /*synchronizeCrossFade: function ( startAction, endAction, duration ) {

        this.mixer.addEventListener( 'loop', onLoopFinished );

        var _this = this;

        function onLoopFinished( event ) {

            if ( event.action === startAction ) {
                _this.mixer.removeEventListener( 'loop', onLoopFinished );
                _this.executeCrossFade( startAction, endAction, duration );
            }

        }

    },

    executeCrossFade: function ( startAction, endAction, duration ) {

        // Not only the start action, but also the end action must get a weight of 1 before fading
        // (concerning the start action this is already guaranteed in this place

        if ( endAction ) {

            this.setWeight( endAction, 1 );
            endAction.time = 0;

            if ( startAction ) { // Crossfade with warping
                startAction.crossFadeTo( endAction, duration, true );
            } else { // Fade in
                endAction.fadeIn( duration );
            }

        } else { // Fade out
            startAction.fadeOut( duration );
        }

    },*/

    ////

    getAnimInfo: function ( name ){

        var action = this.getAction( name );

        var f = 1 / action.frameTime;

        return {
            name: action.name,
            time: action.time,
            frame: Math.round( action.time * f ),
            frameMax: Math.round( action.duration * f ),
            frameTime: action.frameTime,
            timeScale: action.timeScale,
        }

        //if( ui ) ui.updateTimeBarre( anim.frame, anim.frameTime, anim.frameMax );

    },

    playFrame: function ( name, frame, weight ) {

        var animation = this.getAction( name );
        if ( !animation ) return;

        animation.time = frame * animation.frameTime;
        animation.setEffectiveWeight( weight !== undefined ? weight : 1 );
        animation.play();
        animation.paused = true;

    },

    getAnim: function ( tracks ) {

        var action = this.animTracks[ tracks || 'one' ].current;

        if( !action ) { return { name:'', time:0, frame:0, frameMax:0, frameTime:0, timeScale:0 } }

        var f = 1 / action.frameTime;

        return {
            name: action.name,
            time: action.time,
            frame: Math.round( action.time * f ),
            frameMax: Math.round( action.duration * f ),
            frameTime: action.frameTime,
            timeScale: action.timeScale,
        }

    },


    play: function ( name, crossfade, offset, weight, tracks ) {

        if( offset === null ) offset = undefined;
        if( weight === null ) weight = undefined;

        let anim = this.getAction( name );
        if ( !anim ) return;

        let track = this.animTracks[ tracks || 'one' ];
        let current = track.current;

        if ( anim === current ) {

            if ( offset !== undefined || !anim.repeat ) current.time = offset !== undefined ? offset : ( current.timeScale >= 0 ? 0 : current.duration );
            current.setEffectiveWeight( weight !== undefined ? weight : 1 );
            current.paused = false;

        } else {

            track.prev = current;
            track.current = anim;
            current = track.current;
            
            current.setLoop( anim.repeat ? LoopRepeat : LoopOnce, Infinity ).reset();
            current.clampWhenFinished = !anim.repeat;
            current.paused = false;

            this.updateTimeScale();

            if ( offset !== undefined || !anim.repeat ) current.time = offset !== undefined ? offset : ( current.timeScale >= 0 ? 0 : current.duration );

            //console.log(current.time, current.duration)

            current.setEffectiveWeight( weight !== undefined ? weight : 1 );
            current.play();

            if ( !track.playing ) this.mixer.update( 0 );
            track.playing = true;

             // Crossfade with warping - you can also try without warping by setting the third parameter to false
            if ( track.prev ) track.prev.crossFadeTo( current, crossfade || 0, false );

        }

    },

    fadeAll: function ( crossfade ) {

        let c,p;

        for( var t in this.animTracks ){
            c = this.animTracks[t].current;
            p = this.animTracks[t].prev;
            if( c !== null ) c.fadeOut( crossfade );
            if( p !== null ) c.fadeOut( crossfade );
        }

    },

    pauseAll: function () {

        this.actions.forEach( function ( action ) {

            action.paused = true;

        });

    },

    unPauseAll: function () {

        this.actions.forEach( function ( action ) {

            action.paused = false;

        });

    },

});


//-----------------------------------
//
//   SKELETON ADD
//
//-----------------------------------

var _offsetMatrix = new Matrix4();
var _identityMatrix = new Matrix4();


Skeleton.prototype = Object.assign( Object.create( Skeleton.prototype ), {

    testAdd: function () {

        console.log('this function is add !!')

    },

    getDistance: function ( a, b ){

        if(a) this.v1.setFromMatrixPosition( a.matrixWorld  );
        else this.v1.set(0,0,0);
        this.v2.setFromMatrixPosition( b.matrixWorld  );
        return this.v1.distanceTo( this.v2 );

    },

    getFinger: function (){

        var n;
        //this.v2 = new Vector3()

        var finger = [
        'rThumb1', 'rIndex1', 'rMid1', 'rRing1', 'rPinky1',
        'lThumb1', 'lIndex1', 'lMid1', 'lRing1', 'lPinky1'
        ];

        var nodlle = [
        'LT0', 'LT1', 'LT2', 'LT3', 'LT4',
        'RT0', 'RT1', 'RT2', 'RT3', 'RT4'
        ];

        var fingerPos = {}

        for( var name in this.nodes ){

            n = finger.indexOf( name );
            if( n !== -1 ) fingerPos[ nodlle[n] ] = this.nodes[ name ].position.toArray();
            
        }

        return fingerPos;

    },

    getDimension: function () {

        var n = {}, b;

        this.v1 = new Vector3()
        this.v2 = new Vector3()

        if(!this.nodes){

            for( var i = 0, lng = this.bones.length; i<lng; i++ ){ 
                b = this.bones[i]
               // b.updateMatrix();
                n[ b.name ] = b;
            }

            this.nodes = n;

        } else {
            n = this.nodes;
        }

        this.footPos = 0;

        this.dims = {

            root: this.getDistance( null, n.hip ),

            hip : this.getDistance( n.hip, n.abdomen ),
            abdomen : this.getDistance( n.abdomen, n.chest ),
            chest : this.getDistance( n.chest, n.neck ),
            neck : this.getDistance( n.neck, n.head ),

            Collar : this.getDistance( n.rCollar, n.rShldr ),
            Shldr : this.getDistance( n.rShldr, n.rForeArm ),
            ForeArm : this.getDistance( n.rForeArm, n.rHand ),


            Thigh : this.getDistance( n.rThigh, n.rShin ),
            Shin : this.getDistance( n.rShin, n.rFoot ),

            Foot : this.getDistance( n.rFoot, n.rToes ),

            //Hand : this.getDistance( n.rHand, n.rMid1 ),

            Thumb1 : this.getDistance( n.rThumb1, n.rThumb2 ),
            Thumb2 : this.getDistance( n.rThumb2, n.rThumb3 ),

            Index1 : this.getDistance( n.rIndex1, n.rIndex2 ),
            Index2 : this.getDistance( n.rIndex2, n.rIndex3 ),

            Mid1 : this.getDistance( n.rMid1, n.rMid2 ),
            Mid2 : this.getDistance( n.rMid2, n.rMid3 ),

            Ring1 : this.getDistance( n.rRing1, n.rRing2 ),
            Ring2 : this.getDistance( n.rRing2, n.rRing3 ),

            Pinky1 : this.getDistance( n.rPinky1, n.rPinky2 ),
            Pinky2 : this.getDistance( n.rPinky2, n.rPinky3 ),

        }

    },

    compartSize: function ( hand ) {

        var ratio;
        var nosym = ['root', 'hip', 'abdomen', 'chest', 'neck']
        var ref = this.reference_skeleton;
        var nodes = ref.nodes;

        this.getDimension();

        for ( var b in this.dims ){

            ratio =  Number( (this.dims[b] / ref.dims[b]).toFixed(3) );

            if( nosym.indexOf(b) === -1 ){
                if(b==='Foot') {
                    nodes[ 'r'+ b ].scalling.set( 1,1,ratio);
                    nodes[ 'l'+ b ].scalling.set( 1,1,ratio);
                } else {
                    nodes[ 'r'+ b ].scalling.set( ratio,1,1);
                    nodes[ 'l'+ b ].scalling.set( ratio,1,1);
                }
                
            } else if( b !== 'root' ){
                nodes[ b ].scalling.set( ratio,1,1);
            }

        }

        ref.setScalling( this.getFinger() );

        nodes.root.position.y = this.dims['root'] - ref.dims['root'] -0.012;

    },

    resetScalling: function () {

        for ( var i = 0, il = this.bones.length; i < il; i ++ ) {

            this.bones[i].scalling.set(1,1,1);

        }

        this.setScalling();

    },

    setScalling: function ( fingerPos ) {

        var o, b, i, lng = this.bones.length;
        var parent;

        this.resetPosition();


        for ( i = 0; i < lng; i ++ ) {

            b = this.bones[ i ];
            parent = b.parent || null;

            /*if( b.name==='root'){

                b.position.y = this.footPos;
                b.updateMatrixWorld( true );

            }*/

            if( parent !== null && parent.scalling && b.name!=='root'){

                // finger position fix

                if( fingerPos && this.isFinger( b ) ){

                    b.position.fromArray( fingerPos[ b.name ] );
                    b.children[0].position.set(0,0,0);

                }

                b.position.multiply( parent.scalling );
                b.updateMatrixWorld( true );

            }

        }

        this.calculateInverses();

    },

    //-----------------------
    // skeleton referency
    //-----------------------

    setReference: function ( ref, linked, resize ) {

        this.reference_skeleton = ref;
        ref.resetScalling();
        
        if( linked ) this.linkMesh = linked;

        var bone, name;

        for ( var i = 0, il = this.bones.length; i < il; i ++ ) {

            bone = this.bones[i];
            name = bone.name;
            bone.userData.idr = -1;

            for ( var j = 0, jl = ref.bones.length; j < jl; j ++ ) {

                /*if( !ref.bones[j].userData.phyMtx ){
                    ref.bones[j].userData.isPhysics = false;
                    ref.bones[j].userData.phyMtx = new Matrix4();
                }*/

                if( name === ref.bones[j].name ){

                    bone.userData.idr = j;

                }

            }


        }

        if( resize ) this.compartSize();

    },



    resetPosition: function ( pp ) {

        var i = this.bones.length, name, pref;
        while ( i-- ){
            this.bones[ i ].position.copy( this.reference_position[i] );
        }

    },

    

    // object need same update than skeleton

    addLinkMesh: function ( linked ) {

        this.linkMesh = linked;

    },

    isFinger: function ( b ) {

        if( b.parent.name==='rHand' || b.parent.name==='lHand' ) return true;
        return false;

    },


    //-----------------------
    //
    // force local scalling
    //
    //-----------------------

    update: function () {

        const ref = this.reference_skeleton; 
        const bones = this.bones;
        const boneInverses = this.boneInverses;
        const boneMatrices = this.boneMatrices;
        const boneTexture = this.boneTexture;
        const linked = this.linkMesh || null;
        let bone, refBone;

        if( ref ){
            if( ref.postUpdate !== undefined ){ 
                ref.postUpdate();
                ref.bones[0].updateWorldMatrix( false, true );
            }
        }

        // flatten bone matrices to array

        for ( let i = 0, il = bones.length; i < il; i ++ ) {

            bone = bones[ i ];

            // compute the offset between the current and the original transform

            let matrix = bone ? bone.matrixWorld : _identityMatrix;

            if( linked !== null && i === 0 ){
                //linked.matrix.getInverse( matrix );
                linked.matrix.copy( matrix ).invert();
                linked.updateWorldMatrix( false, true );
                //linked.updateMatrix();
            }

            // reference skeleton update

            if( ref ){

                if( bone.userData.idr !== -1 ){
                   
                    refBone = ref.bones[ bone.userData.idr ];
                    matrix = refBone.userData.isPhysics ? refBone.userData.phyMtx : refBone.matrixWorld;

                } else if( bone.parent.userData.idr !== -1 ) { // extra bones

                    matrix.copy( ref.bones[ bone.parent.userData.idr ].matrixWorld );
                    matrix.multiply( bone.matrix );

                }

            } else {

                // never append ???

                // apply physics
                if( bone.userData.isPhysics ) matrix = bone.userData.phyMtx;

            }

            // bones scalling

            if( bone.scalling !== undefined  ){

                matrix.scale( bone.scalling );

            }

            // default

            _offsetMatrix.multiplyMatrices( matrix, boneInverses[ i ] );
            _offsetMatrix.toArray( boneMatrices, i * 16 );

        }

        if ( boneTexture !== null ) {

            boneTexture.needsUpdate = true;

        }

    }

});



//-----------------------------------
//
//   BVHLOADER ADD
//
//-----------------------------------

BVHLoader.prototype = Object.assign( Object.create( BVHLoader.prototype ), {

    /*
        recursively converts the internal bvh node structure to a Bone hierarchy

        source: the bvh root node
        list: pass an empty array, collects a flat list of all converted Bones

        returns the root Bone
    */

    toBone: function ( source, list ) {

        var first = list.length === 0 ? true : false;

        var bone = new Bone();

        list.push( bone );

        if( first ){

            bone.userData.offset = source.offset.clone();
            source.offset.set(0,0,0);

        }

        bone.position.add( source.offset );

        ///

        var name = this.transposeName( source.name );

        if( name === 'rShin' || name === 'rFoot' ) bone.userData.offset = source.offset;

        ///

        bone.name = name;

        if ( source.type !== 'ENDSITE' ) {

            for ( var i = 0; i < source.children.length; i ++ ) {

                bone.add( this.toBone( source.children[ i ], list ) );

            }

        }

        return bone;

    },

    /*
        compatibility for multipe BVH source
        transpose bvh name to standard TrueBones

    */


    transposeName: function( name ){

        // center

        if( name === 'Hips' || name==="SpineBase" ) name = 'hip';

        if( name === 'neckLower' || name === 'Neck' || name === 'Neck2') name = 'neck';
        if( name === 'Head' ) name = 'head';

        // arm
        //LeftArm

        /*if( this.isMixamoType ) {

            if( name === 'Spine' ) name = 'abdomen';
            if( name === 'Spine1' ) name = 'none';
            if( name === 'Spine2' ) name = 'chest';

            if( name === 'RightShoulder' ) name = 'rCollar';
            if( name === 'RightArm' ) name = 'rShldr';

            if( name === 'LeftShoulder' ) name = 'lCollar';
            if( name === 'LeftArm' ) name = 'lShldr';

        } else {*/

            if( name === 'abdomen2' || name === 'abdomenLower' || name === 'upperback' || name === 'Spine1' || name==='SpineBase2' ) name = 'abdomen';
            if( name === 'chestLower' || name === 'Spine2' || name === 'Chest' || name === 'SpineMid') name = 'chest';

            // collar

            if( name === 'RightCollar' || name === 'CollarRight' ) name = 'rCollar';
            if( name === 'LeftCollar' || name === 'CollarLeft' ) name = 'lCollar';

            // shoulder arm

            if( name === 'rShldrTwist' || name === 'rShldrBend' || name === 'RightShoulder' || name ==='ShoulderRight' ) name = 'rShldr';
            if( name === 'lShldrTwist' || name === 'lShldrBend' || name === 'LeftShoulder' || name ==='ShoulderLeft' ) name = 'lShldr';

        //}

        // fore arm

        if( name === 'rForearmTwist' || name === 'rForearmBend' || name === 'RightForeArm' || name === 'RightElbow' || name === 'ElbowRight' ) name = 'rForeArm';
        if( name === 'lForearmTwist' || name === 'lForearmBend' || name === 'LeftForeArm' || name === 'LeftElbow' || name === 'ElbowLeft' ) name = 'lForeArm';

        // hand

        if( name === 'RightHand' || name === 'HandRight' ) name = 'rHand';
        if( name === 'LeftHand' || name === 'HandLeft' ) name = 'lHand';

        // leg

        if( name === 'rThighBend' || name === 'RightUpLeg' || name === 'RightHip' || name === 'HipRight' ) name = 'rThigh';
        if( name === 'RightLeg' || name === 'RightKnee' || name === 'KneeRight' ) name = 'rShin';
        if( name === 'RightAnkle' || name === 'AnkleRight' || name === 'RightFoot' || name === 'FootRight') name = 'rFoot';
        if( name === 'rToe' || name === 'RightToeBase' || name === 'RightToe' || name === 'RightLeft' ) name = 'rToes';

        if( name === 'lThighBend' || name === 'LeftUpLeg' ||name === 'LeftHip' || name === 'HipLeft'  ) name = 'lThigh';
        if( name === 'LeftLeg' || name === 'LeftKnee' || name === 'KneeLeft'  ) name = 'lShin';
        if( name === 'LeftAnkle' || name === 'AnkleLeft' || name === 'LeftFoot' || name === 'LeftRight') name = 'lFoot';
        if( name === 'lToe' || name === 'LeftToeBase' || name === 'LeftToe' || name === 'ToeLeft' ) name = 'lToes';

        /*var noFinger = true;


        if( noFinger ){
            var figerList = [ 'Index', 'Mid', 'Ring', 'Pinky', 'Thumb' ];
            var figerNew = [ 'I', 'M', 'R', 'P', 'T' ];
            var side = name.substring( 0, 1);
            var end = name.substring( name.length-1 );
            var fname = name.substring( 1, name.length-1);
            var id = figerList.indexOf(fname);

            if(id!==-1){

                name = side + figerNew[id] + end;

            }

        }*/

        return name;


    },


    ///

    parseData: function( data ){

        if (typeof data === 'string' || data instanceof String) return this.parse( data );
        else return this.parse( new TextDecoder("utf-8").decode( new Uint8Array( data ) ) );

    },

    findTime: function( times, value ){

        var lng = times.length, i, t, n = 0;

        for( i=0; i<lng; i++ ){

            t = times[i];
            if( t > value ) break;
            n = i;

        }

        return n;

    },


    findSize: function( target, source ){

        var ratio = 0.5;

        var hip = source.getBoneByName('hip');
        var thigh = source.getBoneByName('rThigh');
        var shin = source.getBoneByName('rShin');
        var foot = source.getBoneByName('rFoot');

        if( hip !== undefined && thigh !== undefined  && shin !== undefined  && foot !== undefined ){

            var sourceLegDistance = 0;
            var p = [];

            if( shin.userData.offset ){

                p[1] = new Vector3();
                p[2] = shin.userData.offset.clone();
                p[3] = foot.userData.offset.clone();

                sourceLegDistance = p[1].distanceTo( p[2] ) + p[1].distanceTo( p[3] );

            } else {

                var i = source.bones.length, b, n;
                var v = new Vector3();

                // force skeleton update
                hip.updateMatrixWorld( true );

                p[1] = thigh.getWorldPosition( v.clone() );
                p[2] = shin.getWorldPosition( v.clone() );
                p[3] = foot.getWorldPosition( v.clone() );

                sourceLegDistance = p[1].distanceTo( p[2] ) + p[2].distanceTo( p[3] );

            }

            var targetLegDistance = this.sizes[ target.name ];

            ratio = (targetLegDistance / sourceLegDistance).toFixed(2) * 1.0;

        } else {

            console.log( 'Bad bvh name = unexpected result !!' );

        }

        return ratio;

    },

    addModel: function( model, offsets, options ){

       // if( this.tPose === undefined ) this.tPose = {};
        if( this.sizes === undefined ) this.sizes = {};



        var name = model.name;
        var bones = model.skeleton.bones;
        var lng = bones.length, i, b, n, o, m;
        var v = new Vector3(), p = [];
     //   var pose = [], p = [];
       // var tmpOffsets = {};

    /*    if( offsets !== undefined ){

            for( i = 0; i < offsets.length; i++ ){

                o = offsets[i];
                tmpOffsets[ o[0] ] = new Matrix4().makeRotationFromEuler( new Euler( MathUtils.degToRad( o[1] ), MathUtils.degToRad( o[2] ), MathUtils.degToRad( o[3] ) ) );

            }

        }*/


        for( i = 0; i < lng; i++ ){

            b = bones[ i ];

            // get id of parent bones
            if( b.parent ) b.userData['pid'] = bones.indexOf( b.parent );
            else  b.userData['pid'] = -1;

            //if( options !== undefined ) this.renameBone( b, options.names );

            n = -1;
            if( b.name === 'rThigh' ) n = 1;
            if( b.name === 'rShin' ) n = 2;
            if( b.name === 'rFoot' ) n = 3;
            if( n!==-1 ) p[n] = b.getWorldPosition( v.clone() );

           /*if( tmpOffsets[ b.name ] ){

                b.matrix.multiply( tmpOffsets[ b.name ] );
                b.matrix.decompose( b.position, b.quaternion, b.scale );
                b.updateMatrixWorld();

            }

            m = b.matrixWorld.clone();

            pose.push( m );*/

        }

       // this.tPose[name] = pose;
        this.sizes[name] = p[1].distanceTo( p[2] ) + p[2].distanceTo( p[3] );

    },

    renameBone: function( bone, names ){

        for( var n in names ){
            if( bone.name === n ) bone.name = names[n];
        }

    },

    convertToClip: function ( model, result, option ) {

        option = option || {};

        var prefix = option.prefix || '';

        var groups = {

            head: ['neck', 'head'],
            hip:['hip'],
           // chest: [ 'chest'],
            spine: [ 'abdomen', 'chest'],
            r_leg : ['rThigh', 'rShin', 'rFoot',  'rToes' ],
            l_leg : ['lThigh', 'lShin', 'lFoot',  'lToes' ],
            r_arm : ['rCollar', 'rShldr', 'rForeArm'],
            l_arm : ['lCollar', 'lShldr', 'lForeArm'],
            r_hand: ['rHand', 'rThumb1', 'rThumb2', 'rThumb3', 'rIndex1', 'rIndex2', 'rIndex3', 'rMid1', 'rMid2', 'rMid3', 'rRing1', 'rRing2', 'rRing3', 'rPinky1', 'rPinky2', 'rPinky3'],
            l_hand: ['lHand', 'lThumb1', 'lThumb2', 'lThumb3', 'lIndex1', 'lIndex2', 'lIndex3', 'lMid1', 'lMid2', 'lMid3', 'lRing1', 'lRing2', 'lRing3', 'lPinky1', 'lPinky2', 'lPinky3'],

        };

        // recover the bind-time world matrices
        var inverses = model.skeleton.boneInverses;
        var matrixWorld = new Matrix4();//model.matrixWorld.clone();
        var matrixWorldInv = new THREE.Matrix4().copy( matrixWorld ).invert();

        var bones = model.skeleton.bones;
        var ratio = this.findSize( model, result.skeleton );

        var decal = option.pos || new Vector3();

        var clip = result.clip;

        var lng, lngB, lngS, n, i, j, k, bone, name, tmptime, tracks;

        var utils = AnimationUtils;

        
        var baseTracks = clip.tracks;
        var nodeTracks = []; // 0:position, 1:quaternion

        var times, positions, resultPositions, rotations, resultRotations, pos, rot;

        

        var globalQuat = new Quaternion();
        var globalPos = new Vector3();
        var globalMtx = new Matrix4();
        var localMtx = new Matrix4();
        var parentMtx = new Matrix4();
        var bonesMtx = new Matrix4();

        var q = new Quaternion();
        var p = new Vector3();
        var s = new Vector3();

        // 2° find same name bones track

        lngB = bones.length

        for ( i = 0; i < lngB; ++ i ) {

            bone = bones[ i ];
            name = bone.name;
            if( name === 'hip' ) bone.matrixWorld.copy( inverses[i] ).invert();

            nodeTracks[ i ] = this.findBoneTrack( name, baseTracks );

        }

        // 3° divide track in sequency

        var fp = Math.floor(clip.frameTime * 1000);
        var frametime = 1/30;
        if( fp === 33 ) frametime = 1/30;
        if( fp === 16 ) frametime = 1/60;
        if( fp === 11 ) frametime = 1/90;
        if( fp === 8 ) frametime = 1/120;

        var clipName = '';
        var clipStart = 0;
        var clipEnd = 0;
        var timeStart = 0;
        var timeEnd = 0;
        var startId = 0;
        var endId = 0;
        var clipLoop = option.loop !== undefined ? option.loop : 1;
        var clipAdd = option.add || 0;
        var clipRef = option.ref || '';
        var timescale = option.timescale || 1;

        var hipId;

        var sequences = option.seq || [[ option.name, 0, clip.frames, clipLoop, clipAdd ]];
        var restrict = option.restrict || [];

        var limited = [];

        if( restrict.length ){
            var r = restrict.length;
            while(r--) limited = limited.concat( groups[ restrict[r] ] ) 
        }


        lngS = sequences.length;

        for( k = 0; k < lngS; k++ ){

            clipName = sequences[k][0];
            clipStart = sequences[k][1];
            clipEnd = sequences[k][2];//+1;
            clipLoop = sequences[k][3] !== undefined ? sequences[k][3] : 1;

            clipAdd = sequences[k][4] !== undefined ? sequences[k][4] : clipAdd;
            clipRef = sequences[k][5] !== undefined ? sequences[k][5] : clipRef;

            timeStart = clipStart * frametime;
            timeEnd = clipEnd * frametime;

            tracks = [];

            // 4° copy track to track with correct matrix

            lngB = bones.length;

            for ( i = 0; i < lngB; i ++ ) {

                bone = bones[ i ];
                name = bone.name;

                if( name === 'hip' ) hipId = i;

                if( nodeTracks[i].length >= 2 ){

                    // get parent matrix if existe
                    parentMtx = bone.userData.pid !== -1 ? inverses[ bone.userData.pid ] : matrixWorld;

                    // rotation

                    rot = nodeTracks[i][1];

                    startId = this.findTime( baseTracks[rot].times, timeStart );
                    endId = this.findTime( baseTracks[rot].times, timeEnd ) + 1;

                    tmptime = utils.arraySlice( baseTracks[rot].times, startId, endId );
                    rotations = utils.arraySlice( baseTracks[rot].values, startId * 4, endId * 4 );

                    resultRotations = [];
                    times = [];

                    lng  = tmptime.length;

                    for( j = 0; j < lng; j ++ ){

                        times[j] = tmptime[j] - timeStart;

                        n = j*4;

                        globalQuat.set( rotations[n], rotations[n+1], rotations[n+2], rotations[n+3] );

                        bonesMtx.copy( inverses[ i ] ).invert();

                        globalMtx.identity().makeRotationFromQuaternion( globalQuat ).multiply( bonesMtx );

                        localMtx.copy( parentMtx ).multiply( globalMtx );

                        localMtx.decompose( p, q, s );

                        //q.normalize();

                        resultRotations[n] = q.x;
                        resultRotations[n+1] = q.y;
                        resultRotations[n+2] = q.z;
                        resultRotations[n+3] = q.w;

                    }

                    if( times.length > 0 ){ 

                        if( limited.length && limited.indexOf( name ) === -1 ) continue;
                        tracks.push( new QuaternionKeyframeTrack( ".bones[" + name + "].quaternion", times, resultRotations ) );
                        
                    }

                }

            }

            // collopse track test

            if( option.collapse ){
                let noHip = false;

                lngB = option.collapse.length;
                for ( i = 0; i < lngB; i ++ ) {

                    tracks = this.collapseTrack( tracks, option.collapse[i][0], option.collapse[i][1] ); 
                    if( option.collapse[i][0]==='hip' ) noHip = true;

                }

               if( noHip ) limited.push('hip');

                //console.log(option.collapse)
            }

            // HIP position

            i = hipId;
            bone = bones[ i ];
            name = bone.name;

            if( nodeTracks[i].length === 2 ){

                parentMtx = bone.parent ? bone.parent.matrixWorld : matrixWorldInv;

                pos = nodeTracks[i][0];

                startId = this.findTime( baseTracks[pos].times, timeStart );
                endId = this.findTime( baseTracks[pos].times, timeEnd ) + 1;

                tmptime = utils.arraySlice( baseTracks[pos].times, startId, endId );
                positions = utils.arraySlice( baseTracks[pos].values, startId * 3, endId * 3 );

                times = [];
                resultPositions = [];

                lng = tmptime.length;

                for( j = 0; j < lng; j++ ){

                    times[j] = tmptime[j] - timeStart;

                    n = j*3;

                    globalPos.set( positions[n], positions[n+1], positions[n+2] ).multiplyScalar( ratio ).add( decal );

                    globalMtx.identity().setPosition( globalPos );

                    localMtx.copy( parentMtx ).invert().multiply( globalMtx );

                    localMtx.decompose( p, q, s );

                    resultPositions[n] = p.x;
                    resultPositions[n+1] = p.y;
                    resultPositions[n+2] = p.z;

                }

                if( times.length > 0 ){ 

                    if( limited.length ){ if( limited.indexOf( 'hip' ) !== -1 ) tracks.push( new VectorKeyframeTrack( ".bones[" + name + "].position", times, resultPositions ) ); }
                    else tracks.push( new VectorKeyframeTrack( ".bones[" + name + "].position", times, resultPositions ) );
   
                }

            }

            // 5° apply new clip to model

            clipName = prefix + clipName;

            var newClip = new AnimationClip( clipName, -1, tracks );
            newClip.frameTime = frametime;
            newClip.repeat = clipLoop === 1 ? true : false;
            newClip.timeScale = timescale;
            newClip.additive = clipAdd === 1 ? true : false;
            newClip.ref = clipRef;

            // 6° optimize
            newClip.optimize();

            // 7° send to animator mixer or direct to model
            if( option.clips !== undefined ) option.clips[ clipName ] = newClip;
            else model.addAnimation( newClip );

        }

    },

    collapseTrack: function ( track, b1, b2 ){

        let lng = track.length, id0, id1, i, t0, n0, t1, n1, time0, time1, tt=0;

        let q0 = new Quaternion();
        let q1 = new Quaternion();
        let q2 = new Quaternion();

        let full = true;

        // find track

         i = lng;
        while(i--){

            if( track[i].name ==='.bones['+b1+'].quaternion' ) id0 = i;
            if( track[i].name ==='.bones['+b2+'].quaternion' ) id1 = i;

        }

        // copy first quat
        if( b1 === 'hip' ){ 
            q0.setFromEuler({ _x:0, _y:Math.PI, _z:Math.PI*0.5, _order:'XYZ', isEuler:true });
            full = false;
        }

        /*q1.set( track[id0].values[0], track[id0].values[1], track[id0].values[2], track[id0].values[3] );
        q0.multiply( q1 );*/

        if( full ){

            t0 = track[id0].times.length;
        
            while( t0-- ){

                time0 = track[id0].times[t0];

                t1 = track[id1].times.length;

                while( t1-- ){

                    time1 = track[id1].times[t1];

                    if( time1 === time0 ){

                        tt++

                        n0 = t0*4;
                        q1.set( track[id0].values[n0], track[id0].values[n0+1], track[id0].values[n0+2], track[id0].values[n0+3] ).premultiply(q0);

                        n1 = t1*4;
                        q2.set( track[id1].values[n1], track[id1].values[n1+1], track[id1].values[n1+2], track[id1].values[n1+3] ).premultiply(q1);

                        track[id1].values[n1] = q2.x;
                        track[id1].values[n1+1] = q2.y;
                        track[id1].values[n1+2] = q2.z;
                        track[id1].values[n1+3] = q2.w;

                        break;

                    }
                    

                }

            }

        } else {

            n0 = 0;
            q1.set( track[id0].values[n0], track[id0].values[n0+1], track[id0].values[n0+2], track[id0].values[n0+3] ).premultiply(q0);

            t1 = track[id1].times.length;

            while( t1-- ){

                n1 = t1*4;
                q2.set( track[id1].values[n1], track[id1].values[n1+1], track[id1].values[n1+2], track[id1].values[n1+3] ).premultiply(q1);

                track[id1].values[n1] = q2.x;
                track[id1].values[n1+1] = q2.y;
                track[id1].values[n1+2] = q2.z;
                track[id1].values[n1+3] = q2.w;

            }

        }

        


        // remove first track
        track.splice( id0, 1 );

        //console.log( tt )

        return track;

    },

    findBoneTrack: function( name, tracks ){

        var n, nodeName, type, result = [];
        //var i = tracks.length;
        //while( i-- ){
        for ( var i = 0; i < tracks.length; ++ i ) {
            n = tracks[i].name;

            nodeName =  n.substring( n.indexOf('[')+1, n.indexOf(']') );
            type = n.substring( n.lastIndexOf('.')+1 );


            nodeName = this.transposeName( nodeName );

            if( name === nodeName ){
                if( type === 'position' ) result[0] = i;
                else {
                    if( result[1] ) { console.log('same bone ?', nodeName ); result[2] = i; }
                    result[1] = i;
                }
            }

        }

        return result;

    }

});
