import {
	EventDispatcher, 
    AnimationUtils, AnimationClip, Quaternion,
    WrapAroundEnding, ZeroCurvatureEnding, ZeroSlopeEnding, 
    LoopPingPong, LoopOnce, LoopRepeat, QuaternionKeyframeTrack,
    NormalAnimationBlendMode, AdditiveAnimationBlendMode
} from 'three';

import { BlendSpace2D, Pad2d, PoseFromClip } from '../../libs/animlab.module.js';

const FrameTime = 24//30;
const TimeFrame = 1/FrameTime;

const q = new Quaternion();

const IdleClip = [ 'Idle_Talking', 'Idle_No', 'Idle_LookAround', 'Idle_FoldArms' ]

export class AvatarAnimation extends EventDispatcher {

	constructor( mixer ) {

		super();

		this.mixer = mixer;

        this.actionType = '';

        //console.log(this.mixer)
		this.actions = new Map();
        this.oldTime = 0

		this.current = null;
        this.old = null;
		this.isPause = true;
        this.fixWeight = true;
        this._timeScale = 1;

	}

    set timeScale( v ){

        this._timeScale = v;
        this.mixer.timeScale = this._timeScale;

        //this.actions.forEach( function ( action ) { action.setEffectiveTimeScale( v ) });

    }

    get timeScale(){
        return this._timeScale
    }

    get active (){
        return this.current ? true : false; 
    }

    randInt ( low, high ) {
        return low + Math.floor( Math.random() * ( high - low + 1 ) ); 
    }

	update( delta ){

        this.oldTime = this.mixer.time

		this.mixer.update( delta );
        if(this.actionType === 'Idle'){
            if(this.current._loopCount > 5){
                //console.log('yo')
                let n = this.randInt(0,3)
                this.play(IdleClip[n])
            }
        }
	
	}

	addAction( clip, play = false ){

        const action = this.mixer.clipAction( clip );
        action.frameMax = Math.round( clip.duration * FrameTime );
        
        let ts = 1
        if(clip.name.search('Idle')!==-1) ts = 0.5;
        //action.setEffectiveWeight( 0 );
        //if( clip.name === 'Jumping Up' ) action.loop = LoopPingPong;

        if(clip.userData.loop){
            action.loop = LoopRepeat;
        }else{
            action.loop = LoopOnce;
            action.clampWhenFinished = true
        }

        //

        action.setEffectiveTimeScale( ts );
        action.setEffectiveWeight( 0 );
        action.play();
        action.enabled = false;
        action.name = clip.name;

        this.actions.set( clip.name, action );

        //if( window.gui && window.gui.getAnimation ) window.gui.getAnimation();

        if( play ) this.play( clip.name );
   
    }

    getFrame(){

        if(!this.current) return [0,0]
        return [ Math.round( this.current.time * FrameTime ), this.current.frameMax ]

    }

    clamp( x, min = 0, max = 1 ){ return x < min ? min : x > max ? max : x }


    //---------------------
    //
    //  ANIMATION CONTROL
    //
    //---------------------


    prepareCrossFade( startAction, endAction, duration )  {
        //singleStepMode = false;

        this.isPause = false;
        this.unPause();
        // If the current action is 'idle' (duration 4 sec), execute the crossfade immediately;
        // else wait until the current action has finished its current loop
        if ( endAction._clip.name !== 'idle' ) {
            this.executeCrossFade( startAction, endAction, duration );
        } else {
            this.synchronizeCrossFade( startAction, endAction, duration );
        }

    }

    synchronizeCrossFade( startAction, endAction, duration ) {

        this.mixer.addEventListener( 'loop', onLoopFinished );
        const self = this;
        function onLoopFinished( event ) {
            if ( event.action === startAction ) {
                self.mixer.removeEventListener( 'loop', onLoopFinished );
                self.executeCrossFade( startAction, endAction, duration );
            }
        }

    }

    executeCrossFade( startAction, endAction, duration, warping = true ) {

        // Not only the start action, but also the end action must get a weight of 1 before fading
        // (concerning the start action this is already guaranteed in this place)
        this.setWeight( endAction, 1 );
        endAction.time = 0;
        // Crossfade with warping - you can also try without warping by setting the third parameter to false
        startAction.crossFadeTo( endAction, duration, true );

    }

    pause(){

        this.actions.forEach( function ( action ) { action.paused = true; });
        this.isPause = true;

    }

    unPause(){

        this.actions.forEach( function ( action ) { action.paused = false; });
        this.isPause = false;

    }

    playAll(){

        this.actions.forEach( function ( action ) { action.play(); });

    }

    setTimescale( timescale ) {

        //this.actions.forEach( function ( action ) { action.setEffectiveTimeScale( timescale ); });

    }

    syncro( name ) {

        let action = this.getAction( name );
        if ( !action ) return;
        let time = action.time;
        this.actions.forEach( function ( action ) { action.time = time; });

    }

    /*setTimescale( action, timescale ) {

        action.enabled = true;
        action.setEffectiveTimeScale( timescale );

    }*/

    setWeight( action, weight ) {

        action.enabled = true;
        action.setEffectiveWeight( this.clamp(weight) );

    }

    getAnimInfo( name ){

        let action = this.getAction( name );
        if ( !action ) return;
        return {
            name: name,
            time: action.time,
            frame: Math.round( action.time * FrameTime ),
            frameMax: action.frameMax,
            timeScale: action.timeScale,
        }

        //if( ui ) ui.updateTimeBarre( anim.frame, anim.frameTime, anim.frameMax );

    }

    getAction( name ) {
        //if ( !this.actions.has( name ) ) return;
        return this.actions.get( name );
    }



    /////////////////////

    addEvent( type, endActionName, callback ){
        this.clearEvent()
        this.tmpCallback = callback
        this.tmpfun = this.onLoopFinished.bind(this)
        this.tmpType = type;
        this.tmpEndName = endActionName;
        this.mixer.addEventListener( this.tmpType, this.tmpfun );
    }

    clearEvent(){
        if(!this.tmpType) return
        this.mixer.removeEventListener( this.tmpType, this.tmpfun );
        this.tmpType = null;
        this.tmpfun = null;
        this.tmpCallback = null;
        //this.tmpEndName = null
    }

    onLoopFinished( e ){

        if(this.tmpType==='loop'){
            this.play(this.tmpEndName, 0.5)
        }else{
            //self.current = null
            this.play(this.tmpEndName, 0.0)
        }
        
        if(this.tmpCallback) this.tmpCallback()
        this.clearEvent()

    }

    playNext( action, endActionName, callback ) {

        const type = action.loop === LoopRepeat ? 'loop' : 'finished';
        action.reset();

        this.addEvent(type, endActionName, callback )

        //this.mixer.addEventListener( 'finished', onLoopFinished );
        /*this.mixer.addEventListener( type, onLoopFinished );
        const self = this;
        function onLoopFinished( event ) {
            //if ( event.action === action ) {

                self.mixer.removeEventListener( type, onLoopFinished );

                if(type==='loop'){
                    self.play(endActionName, 0.5)
                }else{
                    //self.current = null
                    self.play(endActionName, 0.1)
                }
                //
                
                if(callback) callback()
                //self.executeCrossFade( startAction, endAction, duration );
            //}
        }*/

    }

    play( name, fade = 0.5, callback ) {

        this.clearEvent()

        let action = this.getAction( name );
        let fix = this.fixWeight;

        if ( !action ){ 
            console.log('not find', name)
            return false;
        }

        this.actionType = name;
        let currentIdle = name.search('Idle')!==-1 ? true : false;

        if( !this.current ){

            this.stop()
            this.current = action;
            this.current.reset();
            //action.enabled = true

            if(currentIdle) action.setEffectiveTimeScale( 0.5 );



            //action.play();
            action.setEffectiveWeight( 1 );
            //console.log(this.current)
        } else {

            if( this.current !== action ){

                this.old = this.current;
                this.current = action;

                if(name === 'Jump_Start'){
                    this.playNext(this.current, 'Jump', callback )
                    fix = false
                }

                if(name === 'Jump_Land'){
                    this.playNext(this.current, 'Idle', callback )
                    fix = false
                }

                if(IdleClip.indexOf(name)!==-1) {
                    this.playNext(this.current, 'Idle' )
                }

                
                let oldIdle = this.old.getClip().name.search('Idle')!==-1 ? true : false;

                //if(clip.name.search('Idle')!==-1) isIdle = 0.5;
                //isIdle = this.old.getClip().name === 'idle'

                /*if(name.search('Idle')!==-1){ 
                    isIdle = true
                    this.current.setEffectiveTimeScale( 0.5 );
                }*/
                //if(this.old.getClip().name.search('Idle')!==-1) isIdle = true

                //if( this.clipsToesFix.indexOf(name) !== -1 ) this.fixToe = true;
                //else this.resetToes();

                let oldEff = this.old.getEffectiveWeight();
                let currentEff = this.current.getEffectiveWeight();
                
                // keep current time to avoid reloop
                let time = this.current.time;

                // sycro if not idle on walk run leg position
                if( !currentIdle && !oldIdle ){ 
                    let ratio = this.current.getClip().duration / this.old.getClip().duration;
                    time = this.old.time * ratio;
                }

                // reset current
                this.current.reset();
                //currentEff = 0

                if(currentIdle) this.current.setEffectiveTimeScale( 0.5 );
                

                this.current.time = time;


                if( fix ){

                    this.current.weight = 1.0;
                    this.current.stopFading()
                    this.old.stopFading()//.stopWarping();
                    this.old._scheduleFading( fade, oldEff, 0 );
                    this.current._scheduleFading( fade, currentEff, 1 );

                } else { 

                    this.executeCrossFade( this.old, this.current, fade );

                    //this.current.crossFadeFrom( this.old, fade, true );

                }

            }
        } 

        this.isPause = false;
        return true;

    }

    playFrame ( name, frame, weight = 1 ) {

        let action = this.getAction( name );
        if ( !action ) return;

        action.time = frame * TimeFrame;
        action.setEffectiveWeight( weight );
        action.play();
        action.paused = true;
        this.isPause = true;

    }

    playOne ( frame, weight = 1 ) {

        if ( !this.current ) return;
        this.current.time = frame * TimeFrame;
        this.current.setEffectiveWeight( weight );
        this.current.play();
        this.current.paused = true;
        this.isPause = true;

    }

    stop(){

        this.actions.forEach( function ( action ) { action.setEffectiveWeight( 0 ) });
        this.current = null;

    }


    // extra adjustement ( no more use )

    makePoseTrack( data, name = 'adjustment', isAdd = true ){

        if(this.actionPose){ 
            this.actionPose.stop();
            this.mixer.uncacheClip( this.actionClip );
        }

        const torad = Math.PI / 180;
        //let q = new Quaternion();
        const baseTracks = data
        const tracks = [];
        let i = baseTracks.length, j, n, n2, t, b, k = 0;
        let numFrame = 1//3

        while(i--){
            t = baseTracks[i]
            b = t.name
            let rq = []
            let tt = []
            k = 0
            j = numFrame 
            while(j--){
                n = 0//j * 3
                n2 = k * 4
                tt.push( k * 0.03333333507180214 )
                if(t.values) q.setFromEuler( {_x:t.values[n]*torad, _y:t.values[n+1]*torad, _z:t.values[n+2]*torad, _order:'XYZ'});
                if(t.qq){ q.fromArray( t.qq );}
                q.toArray( rq, n2 );
                k++;
            }
            tracks.push( new QuaternionKeyframeTrack( t.name+'.quaternion', tt, rq ) );
        }

        // additive not work
        let blendMode = isAdd ? AdditiveAnimationBlendMode : NormalAnimationBlendMode;
        let clip = new AnimationClip( name, -1, tracks, blendMode );
        clip.duration = numFrame * 0.03333333507180214//anim.duration;

        const action = this.mixer.clipAction( clip );
        action.enabled = true;
        action.setEffectiveTimeScale( 1 );
        action.setEffectiveWeight( 1 );
        action.play();
        this.actionPose = action;
        this.actionClip = clip;

    }

}