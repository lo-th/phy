
import {
    Group, Vector3, Vector2, Quaternion, SkeletonHelper,
} from 'three';

import { MathTool } from '../core/MathTool.js';
import { Max, Num, getArray, getType } from '../core/Config.js';

import { Geo } from './base/Geo.js';
import { Mat } from './base/Mat.js';
import { Timer } from './base/Timer.js';
import { User } from './base/User.js'

// for item
import { Ray } from './Ray.js';
import { Body } from './Body.js';
import { Joint } from './Joint.js';
import { Contact } from './Contact.js';
import { Vehicle } from './Vehicle.js';
import { Character } from './Character.js';
import { Terrain } from './Terrain.js';
import { Solver } from './Solver.js';

import { Button } from './extra/Button.js';
import { Textfield } from './extra/Textfield.js';
import { Container } from './extra/Container.js';
import { MouseTool } from './extra/MouseTool.js';
import { Breaker } from './extra/Breaker.js';
import { Particle } from './extra/Particle.js';
import { RayCar } from './extra/RayCar.js';
import { Envmap } from './extra/Envmap.js';
import { AutoRagdoll } from './extra/AutoRagdoll.js';

import { Pool } from '../3TH/Pool.js';
import { sk } from '../3TH/character/SkeletonExtand.js';
import { preloadAvatar } from '../3TH/character/Avatar.js';


/** __
*    _)_|_|_
*   __) |_| | 2025
* @author lo.th / https://github.com/lo-th
*
*    THREE.JS BRIDGE ENGINE
*/

const Version = {
	
	PHY: '0.5.0',
	// best
    PHYSX: '5.06.10',
    HAVOK: '1.2.1',
    JOLT: '0.35.0',
    // old
    RAPIER: '0.14.0',
    OIMO: '1.2.4',
    AMMO: '3.2.6',

};


export class PhyEngine {

	constructor( parameters = {} ) {

		this.geo = new Geo();
		this.mat = new Mat();

		this.math = MathTool;
		this.pool = Pool;
		//this.RayCar = RayCar;
		
		this.version = Version.PHY;
		this.Version = Version;

		this.engine = '';

		this.jointVisible = false;

		this.utils = new Utils(this);

		this.viewSize = null;
		this.debug = false;
		this.delta = 0;


		const _this = this;
        
        let scriptDir = undefined;

        let useLocal = false;
        let useModule = false;

		
		let addToFlow = true;

		let currentControle = null;
		let callbackReady = null;
		let maxFps = 60;
		let worker = null;
		let isWorker = false;
		let isBuffer = false;
		let isTimeout = false;
		let outsideStep = true;
		let realtime = true;
		let engineReady = false;
		let breaker = null;

		let isAdd = false;

		let timetest = { t1:0, t2:0, t3:0, t4:0 };

		let mouseTool = null;

		let directMessage = null;
		let controls = null;

		let isPause = false;
		let first = true;

		let timout = null;
		let timoutFunction = null;
		let timoutTime = 0;
		let elapsedTime = 0;

		let envmapUrl = '';
		let _envmap = null;

		// from three
		let renderer = null;
		let scene = null;


		const user = new User();
		const timer = new Timer(60);
		const tt = { start:0, end:0, startTime:'' };

		let azimut = ()=>(0);
		let endReset = ()=>{};
		let prevUpdate = ()=>{};
		let postUpdate = ()=>{};
		let addControl = ()=>{};

		let buttons = [];
		let textfields = [];
		let particles = [];

		const settings = {

			fps: 60,
			fixe: true,
			full: false,
			substep: 2,
			gravity: [0,-9.81,0],
			
		}


		// ------------------------------
		//     MAIN ARRAY POOL
		// ------------------------------

		let _Ar = null;
		let _ArPos = {};

		this.flow = {
			stamp:0,
			current:'',
			key:[],
			tmp:[],
			add:[],
			remove:[]
		};

		this.reflow = {
			ray:[],
			stat:{ fps:0, delta:0, ms:0 },
			point:{},
			velocity:{},
		};

		const items = {};
		//this.items = () => items;


		// ------------------------------
		//     MAIN SCENE FOR PHY
		// ------------------------------

		this.scene = null;
	    this.scenePlus = null;


		// ------------------------------
		//     GARBAGEE
		// ------------------------------

		this.garbage = [];
		this.tmpMesh = [];
		this.instanceMesh = {};
		this.tmpTex = [];

		this.disposeTmp = () => {
			// clear temporary mesh
			let i, j, m;
			for( i in this.tmpMesh ) {
				m = this.tmpMesh[i]
				if( m.children ){
					for( j in m.children ) this.disposeMesh( m.children[j] );
				}
				this.disposeMesh( m );
				if( m.parent ) m.parent.remove( m );
			}
			this.tmpMesh = [];

			// clear temporary textures
			for( i in this.tmpTex ) this.tmpTex[i].dispose();
			this.tmpTex = [];

		}

		this.disposeMesh = ( m ) => {

			if( m.geometry ) m.geometry.dispose();
			if( m.dispose ) m.dispose();
				
		}


		/*get onFrame() {
	        return this._name;
	    }*/
	    //this.version( f ) { return Version.PHY; }


	    this.setStep = ( f ) => { postUpdate = f; }

		this.debugMode = ( b ) => { this.setDebugMode(b); }
		this.setDebugMode = ( b ) => { this.debug = b; }

		this.useRealLight = (o) => { this.mat.useRealLight(o); }

		this.getSetting = () => { return settings; }

		this.setGravity = ( v ) => {

			if(v) settings.gravity = v;
			this.post({ m:'setGravity', o:{ gravity:settings.gravity } });

		}

		this.set = ( o = {} ) => {

			settings.fixe = o.fixe !== undefined ? o.fixe : true;
			settings.full = o.full !== undefined ? o.full : false;
			settings.gravity = o.gravity ? o.gravity : [0,-9.81,0];
		    settings.substep = o.substep ? o.substep : 2;
		    settings.fps = o.fps ? o.fps : 60;

			if( o.key ) addControl();

			items.body.setFull( settings.full );
			this.initArray( settings.full );

			elapsedTime = 0;
			isTimeout = isWorker;
			outsideStep = !isTimeout;

			//console.log( isTimeout, isWorker, outsideStep )

		    this.jointVisible = o.jointVisible || false;

			if( outsideStep ) timer.setFramerate( settings.fps );

			const data = {
				...settings,
				ArPos:_ArPos,
				isTimeout:isTimeout,
				outsideStep:outsideStep,
			}

			this.post({ m:'set', o:data });

		}

		this.activeMouse = ( controler, mode ) => { 
			if( !mouseTool ) mouseTool = new MouseTool( controler, mode, this );
		}

	    this.mouseMode = ( mode, o ) => { 
			if( mouseTool ) mouseTool.setMode( mode, o );
		}

	    this.getTime = () => { return Timer.now(); }
	    this.readTime =( t ) => { return Timer.format_time(t); }

	    this.startTime =() => { return tt.startTime; }

		this.getTimeTest =() => { return timetest; }

		this.setMaxFps = ( v ) => { maxFps = v; }

		this.getMouse = () => { return mouseTool ? mouseTool.mouse : null; }

		this.setMaxAnisotropy = ( f ) => { Pool.maxAnisotropy = f; }

		this.setAddControl =( f ) => { addControl = f; }

		this.setPrevUpdate = ( f ) => { prevUpdate = f !== null ? f : ()=>{} }
		this.setPostUpdate = ( f ) => { postUpdate = f !== null ? f : ()=>{} }

		this.setAzimut = ( f ) => { azimut = f }
		this.setRenderer = ( f ) => { 
			renderer = f;
			Pool.renderer = renderer;
		}

		this.setKey =(i, v) => { return user.setKey(i,v) }
		this.getKey =() => { return user.key }
		this.getKey2 =() => { return user.key2 }
		this.getAzimut =() => { return azimut() }

		this.setContent = ( Scene ) => {

			if( isAdd ) return;
			scene = Scene;
			scene.add( this.scene );
			scene.add( this.scenePlus );
			isAdd = true;

		}

		this.message = ( m ) => {

			let e = m.data;
			if( e.Ar ) _Ar = e.Ar;
			if( e.reflow ){
				this.reflow = e.reflow;
				if(this.reflow.stat.delta) elapsedTime += this.reflow.stat.delta;
			}
		
			_this[ e.m ]( e.o );

		}

		// Typically, on a Flame, the transfer speed is 80 kB/ms for postMessage 
		// This means that if you want your message to fit in a single frame, 
		// you should keep it under 1,300 kB

		this.post = ( e, buffer = null, direct = false ) => {

			if( !isWorker ){
				directMessage( { data : e } );
				return;
			}

			if(addToFlow){
				if( e.o ){
			    	if( e.o.type === 'solver' ) direct = true;
			    	if( e.o.solver !== undefined ) direct = true;
			    }
			    if( direct ){
			    	worker.postMessage( e, buffer );
			    } else {
			    	if( e.m === 'add' ) this.flow.add.push( e.o );
			    	else if ( e.m === 'remove' ) this.flow.remove.push( e.o );
			    	else worker.postMessage( e, buffer );
			    }
			} else {
				worker.postMessage( e, buffer );
			}

		}


		// return

		this.rayCar = ( o ) => {

			const arg = new RayCar( o, this );
			//this.scene.add( arg.model );
			return arg;

		}

		this.autoRagdoll = ( o ) => {

			const arg = new AutoRagdoll( o, this );
			this.scene.add( arg.model );
			return arg;

		}

		this.byName = ( name ) => ( this.utils.byName( name ) );
		this.getScene = () => ( this.scene );


		this.makeView = () => {}

		this.resize = ( size ) => { this.viewSize = size; }

		this.init = ( o = {} ) => {

			scriptDir = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : undefined;

			tt.start = Timer.now();

			const compact = o.compact || false;

			// TODO find better solution
			let url = document.location.href.replace(/\/[^/]*$/,"/");
			let arr = url.split("/");
			url = arr[0] + "//" + arr[2] + '/';

			if( url === 'https://lo-th.github.io/' ) url = 'https://lo-th.github.io/phy/';

			let path = o.path || '';
			path += compact ? 'compact/' : 'build/';

			let type = o.type || 'PHYSX';

			let name = type.toLowerCase();
			let mini = name.charAt(0).toUpperCase() + name.slice(1);

			this.engine = type.toUpperCase();

			this.initItems();

			// garbage material
			Pool.materialRoot = this.mat.set.bind(this.mat);

			// extand shader
			//this.mat.initExtandShader();

			if( o.callback ){ 
				callbackReady = o.callback;
				delete o.callback;
			}

			isWorker = o.worker || false;

			this.scene = new Group();
			this.scene.name = 'phy_scene';
			this.scenePlus = new Group();
			this.scenePlus.name = 'phy_scenePlus';

			if( o.scene ){  // need for envmap
				this.setContent( o.scene );
				delete ( o.scene );
			}

			if( o.renderer ){ // need for envmap and ktx2
				this.setRenderer( o.renderer );
				delete ( o.renderer );
			}

			envmapUrl = o.envmap || '';

			useModule = o.useModule ? this.supportModuleWorker() : false;
			useLocal = o.useLocal || false;


			if( compact ){

				if( useLocal ){
				
					if( useModule ) Pool.load( new URL( '../' + path + mini + '.module.hex', import.meta.url), function(){ _this.onCompactDone(o) } )
		    		else Pool.load( new URL( '../' + path + mini + '.hex', import.meta.url), function(){ _this.onCompactDone(o) } )
				
				} else {

					if( useModule ) Pool.load( url + path + mini + '.module.hex', function(){ _this.onCompactDone(o) } )
					else Pool.load( url + path + mini + '.hex', function(){ _this.onCompactDone(o) } )

				}

			} else {

				if( isWorker ){ // is worker version

					// TODO test
					// https://aditya003-ay.medium.com/different-ways-to-share-data-between-main-thread-and-worker-thread-75a5d86ab441
					//const sharedBuffer = new SharedArrayBuffer(Float32Array.BYTES_PER_ELEMENT * 5);
					//const sharedArray = new Float32Array(sharedBuffer);
					// Start the worker and pass the shared buffer
					//const worker = new Worker('./worker-shared-buffer.js', { workerData: sharedBuffer });


					// https://web.dev/articles/module-workers?hl=fr
					// https://developer.mozilla.org/en-US/docs/Web/API/Worker/Worker

					if( useLocal ){
						
						if( useModule ) worker = new Worker( new URL( './' + mini + '.module.js', import.meta.url), {type:'module'} )
						else worker = new Worker( new URL( './' + mini + '.min.js', import.meta.url), {type:'classic'} )
						
					} else {

						if( useModule ) worker = new Worker( url + path + mini + '.module.js', {type:'module'} )
						else worker = new Worker( url + path + mini + '.min.js' )

					}

					

				    //worker = new Worker( url + path + mini + '.min.js' );
				    //worker = new Worker( url + path + mini + '.module.js', {type:'module'});


					worker.postMessage = worker.webkitPostMessage || worker.postMessage;
					worker.onmessage = this.message;

					// test if worker Shared buffer is compatible
					let ab = new ArrayBuffer( 1 );
					worker.postMessage( { m: 'test', ab:ab }, [ ab ] );
					isBuffer = ab.byteLength ? false : true;

					o.isBuffer = isBuffer;

					this.initPhysics( o );


				} else { // is direct version

					if( o.devMode ) this.preLoad( mini, o, url );
				    else this.preLoadMin( mini, o, url );

				}

			}

		}

		this.supportModuleWorker = () => {

			 let supports = false;
			 const tester = {
			      get type() { supports = true; }
			};
			try {
			    const worker = new Worker('data:,', tester).terminate();
			} finally {
			    return supports;
			}

		}

		this.onCompactDone = ( o ) =>{

			let name = this.engine.toLowerCase();
			let mini = name.charAt(0).toUpperCase() + name.slice(1);
			let code = useModule ? Pool.get( mini+'.module', 'H' ) : Pool.get( mini, 'H' );

			if( isWorker ){

				let blob;

				try {
				    blob = new Blob([code], {type: 'application/javascript'});//text/html
				} catch (e) { // Backwards-compatibility
				    window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
				    blob = new BlobBuilder();
				    blob.append(code);
				    blob = blob.getBlob();
				}

				if( useModule ) worker = new Worker( URL.createObjectURL(blob), {type:'module'} );
				else worker = new Worker( URL.createObjectURL(blob) );
			    //else worker = new Worker( url + path + mini + '.module.js', {type:'module'});

			    //console.log('can run worker module:', useModule )

				worker.postMessage = worker.webkitPostMessage || worker.postMessage;
				worker.onmessage = this.message;

				let ab = new ArrayBuffer( 1 );
				worker.postMessage( { m: 'test', ab:ab }, [ ab ] );
				isBuffer = ab.byteLength ? false : true;

				o.isBuffer = isBuffer;
				//console.log( st + ' Worker '+ type + (o.isBuffer ? ' with Shared Buffer' : '') );

				this.initPhysics( o );

			} else {

				let type = name.toUpperCase();
				//if(type==='RAPIER') type = 'RAPIER3D';

				let n = document.createElement("script");
	            n.language = "javascript";
	            n.type = "text/javascript";
	            n.charset = "utf-8";
	            n.async = true;
	            n.innerHTML = code;
	            document.getElementsByTagName('head')[0].appendChild(n);

	            directMessage = window[type].engine.message;
				o.message = this.message;
				this.initPhysics( o );

			}

			//console.log( code, isWorker )

		}

		this.loadWasmDirect = ( link, o, name, url ) => {

		    let s = document.createElement("script");
		    s.src = url + link;
		    document.body.appendChild( s );
		    s.onload = () => { this.preLoad( name, o, url ); }

		}

		this.preLoadMin = ( name, o, url ) => {

			let link = url + 'build/'+name+'.min.js';
			let type = name.toUpperCase();
			//if(type==='RAPIER') type = 'RAPIER3D';

			var xml = new XMLHttpRequest();
	        xml.open('GET', link );
	        xml.overrideMimeType( "text/javascript" );
	        xml.onreadystatechange = function() {
	            if ( xml.readyState === 4 ) {
	                if ( xml.status === 200 || xml.status === 0 ) {
	                    let n = document.createElement("script");
	                    n.language = "javascript";
	                    n.type = "text/javascript";
	                    n.charset = "utf-8";
	                    n.async = true;
	                    n.innerHTML = xml.responseText;
	                    //this.extraCode.push(n)
	                    document.getElementsByTagName('head')[0].appendChild(n);

					    directMessage = window[type].engine.message;
						o.message = this.message;
						this.initPhysics( o );
	                }
	                else console.error( "Couldn't load ["+ name + "] [" + xml.status + "]" );
	            }
	        }.bind(this)
	        xml.send(null)

		}

		this.preLoad = async( name, o, url ) => {

			let link = url + 'build/'+name+'.module.js';
			if( o.devMode ) link = url + 'src/'+name+'.js';
		    let M = await import( link );
		    directMessage = M.engine.message;
			o.message = this.message;
			this.initPhysics( o );

		}

		////

		this.initPhysics = ( o ) => {

			if( envmapUrl !== '' ){
				this.preloadEnvmap( o );
				return
			}

			//tt.start = Timer.now();
		
		    this.post({ m:'init', o:o });
		    engineReady = true;

		}

		this.addEnvmap = ( o ) => {
			if(!_envmap) _envmap = new Envmap( { renderer:renderer, scene:scene, ...o } )
			return _envmap;
		}

		this.preloadEnvmap = ( o ) => {

			_envmap = new Envmap( {
				url:envmapUrl,
				renderer:renderer,
				scene:scene,
				usePmrem:o.usePmrem,
				useBackground: o.useBackground !== undefined ? o.useBackground : true,
				envBlur: o.envBlur !== undefined ? o.envBlur : 0,
				callback:()=>{
					envmapUrl = '';
					this.initPhysics(o);
				}
			});

		}
		
		this.getPause = () => { return isPause; }

		this.pause = ( v ) => {

			if( v === isPause ) return
			isPause = v
			if( isPause ) this.pausetimout();
			else this.playtimout();
			this.post({ m:'pause', o:{ value:isPause } });

		}

		this.flowReset = ( ) => {

			this.flow = { 
				stamp:0,
				current:'',
				key:[],
				tmp:[],
				add:[],
				remove:[],
				//point:[]
			}

		}

		this.reset = ( callback ) => {

			if( first ){
				first = false;
				callback();
				return;
			}

			buttons = [];

			currentControle = null;

			if( controls ) controls.resetAll();
			if( mouseTool ) mouseTool.unSelect();

			endReset = callback;

			postUpdate = function () {};

			this.clearText();
			//this.clearSkeleton()
			this.clearParticleSolver();

			this.cleartimout();

			this.flowReset();

			// clear instance
		    this.clearInstance();

		    // reset all items
		    this.resetItems();

			// clear temporary geometry
			this.geo.dispose();

		    // clear temporary material
		    this.mat.dispose();

		    // clear temporary mesh
			this.disposeTmp();

			this.garbage = [];

			if( breaker !== null ) breaker = null;
				
		    this.scenePlus.children = [];
		    this.scene.children = [];

			this.post({ m:'reset' });

		}

		this.clearGarbage = () => {

			this.remove(this.garbage);
			this.clearInstance();
			this.garbage = [];
			
		}

		this.clear = ( callback ) => {

			this.reset(callback);
			
		}

		this.resetCallback = () => {

			endReset();

		}

		this.dispose = () => {

			this.reset(()=>{

				if( worker ){ 
					worker.terminate();
					worker = null;
				}

				if( isAdd ){
					_this.scene.parent.remove( _this.scene );
					_this.scenePlus.parent.remove( _this.scenePlus );
					isAdd = false;
				}

			});

		}

		this.ready = () => {

			tt.end = Timer.now();
			tt.startTime = Timer.format_time( tt.end - tt.start );

			console.log( '%c'+this.engine + ' %c' + Version[this.engine] +'%c | '+ (useModule ? 'Module ' : '' ) + ( isWorker?'Worker': 'Direct') +' '+ tt.startTime, 
				"font-size:16px", 
				"font-size:12px", 
				"font-size:12px" 
			);
			if( callbackReady ) callbackReady();

		}

		this.start = ( o = {} ) => { this.post({ m:'start', o:o }) }

		this.morph = ( obj, name, value ) => { this.utils.morph( obj, name, value ) }

		this.getFps = () => { return this.reflow.stat.fps }
		this.getMs = () => { return this.reflow.stat.ms.toFixed(1) }
		
		this.getDelta2 = () => { return this.delta }
		this.getElapsedTime2 = () => { return elapsedTime }

		this.setDelta = (v) => { timer.delta = v }
		this.getDelta = () => { return timer.delta }
		this.getElapsedTime = () => { return timer.elapsedTime }

		this.doStep = ( stamp ) => {

			if( !engineReady ) return;
			if( !outsideStep ) return;
			if( timer.up( stamp ) ) {
				this.post( { m:'step', o:stamp } );
			}

		}

		this.step = () => {

			// time of physic engine step
			this.delta = this.reflow.stat.delta;
	        // user key interaction
			this.flow.key = user.update();
			this.flow.current = currentControle !== null ? currentControle.name : ''
	        //prevUpdate( timer.delta )

			this.stepItems();

			if( mouseTool ) mouseTool.step();

			if( breaker !== null ) breaker.step();

			if( currentControle !== null ) currentControle.move();

			

			// TODO fix dt 0 when no doStep ??

			let dd = outsideStep ? timer.delta : this.delta;

			postUpdate( dd );

			//items.character.prestep()

			// update this.object for this side !
			this.changes( this.flow.tmp );

			// finally post flow change to physx
			if( isBuffer ) this.post( { m:'poststep', flow:this.flow, Ar:_Ar }, [ _Ar.buffer ] );
			else this.post( { m:'poststep', flow:this.flow });

			//	this.stepItems()
			this.flowReset();

		}

	    

		this.initArray = ( full = false ) => {

		    // dynamics array
			_ArPos = {...getArray( this.engine, full )};

		}

	    this.takeControl = ( name = null ) => {

	    	this.control( name );

	    }

		this.control =( name = null ) => { // for character and vehicle

			if( currentControle !== null ){
				if( name === null ) {
					if( currentControle.isPlayer ) currentControle.isPlayer = false;
					currentControle = null;
				} else  {
					if( name !== currentControle.name ) {
						currentControle = this.byName( name );
						if( currentControle ) currentControle.isPlayer = true;
					}
				}
			} else if( name !== null ){
				currentControle = this.byName( name );
				if( currentControle ) currentControle.isPlayer = true;
			}

		}

		

		this.getAllBody = ( name ) => {

			return items.body.list;

		}


		//-----------------------
		//  ITEMS
		//-----------------------

		this.initItems = () => {

			items['body'] = new Body(_this);
			items['ray'] = new Ray(_this);
			items['joint'] = new Joint(_this);
			items['solid'] = new Solid(_this);
			items['contact'] = new Contact(_this);
			items['terrain'] = new Terrain(_this);
			items['character'] = new Character(_this);

			// vehicle only on physx and ammo
			if( this.engine === 'PHYSX' || this.engine === 'AMMO' ){ 
				items['vehicle'] = new Vehicle(_this);
			}

			// solver is only on physx
			if( this.engine === 'PHYSX' ) items['solver'] = new Solver(_this);

		}

		this.getBodyRef = () => items.body;
		this.getCharacterRef = () => items.character;

		// on Hero / vehicle
		this.getGeometryRef = ( o, b, m ) => { items.body.geometry( o, b, m ) }; 

		this.clearBody = () => { items.body.reset() }

		this.resetItems = () => {

			Object.values(items).forEach( v => v.reset() );

		}

		this.stepItems = () => {

		    Object.values( items ).forEach( v => v.step( _Ar, _ArPos[v.type] ) );
			this.upInstance();
			this.upButton();

		}


		//-----------------------
		//  INSTANCE
		//-----------------------

		this.upInstance = () =>{

	    	Object.values( this.instanceMesh ).forEach( value => value.update() );

	    }

		this.clearInstance = () => {

	    	Object.values( this.instanceMesh ).forEach( value => value.dispose() );
	    	this.instanceMesh = {}

		}


		//-----------------------
		//  ADD
		//-----------------------

		this.adds = ( r = [], direct = false ) => {

			let i = r.length, n = 0;
			while(i--) this.add( r[n++], direct );

		}

		this.add = ( o = {}, direct = false ) => {

			if( o.isObject3D ) return this.addDirect( o );
			if( o.constructor === Array ) return this.adds( o, direct );
			if( o.type === 'container' ) return new Container( o, this );
			
			if( o.bounce !== undefined ) o.restitution = o.bounce;
			if( o.type === undefined ) o.type = 'box';
			if( o.mode !== undefined ) o.type = 'joint';

			let type = getType( o );

			if( type === 'joint' && o.mode === undefined ){ 
				o.mode = o.type;
				o.type = 'joint';
			}

			let m = items[type].add( o );
			this.garbage.push( m.name );
			return m;

		}

		this.addDirect = ( b ) => {

			this.scenePlus.add( b );
			this.tmpMesh.push( b );
			return b;

		}


		//-----------------------
		//  REMOVE
		//-----------------------

		this.removes = ( r = [], direct ) => { 

			let i = r.length, n = 0;
			while(i--) this.remove( r[n++], direct );

		}
		
		this.remove = ( name, direct = false ) => {

			if ( name.constructor === Array ) return this.removes( name, direct );

			let b = this.byName( name );
			if( b === null ){ 
				if( this.instanceMesh[ name ] ) items.body.clearInstance( name );
				return;
			}

			if(b.type === 'autoRagdoll' ) {
				this.utils.remove(b);
				return 
			}
			if( b.extraRemove ) b.extraRemove();

			// remove on three side
			items[b.type].clear( b );
			// remove on physics side
			this.post( { m:'remove', o:{ name:name, type:b.type } }, null, direct );

		}


		//-----------------------
		//  CHANGE
		//-----------------------

		this.changes = ( r = [], direct = false ) => { 

			let i = r.length, n = 0;
			while( i-- ) this.changeOne( r[n++], direct );

		}

	    this.change = ( o, direct = false ) => {

	    	if( direct ){
	    		if( o instanceof Array ) this.changes( o, true )
	    		else this.changeOne( o, true )
	    	} else {
	    		if( o instanceof Array ) this.flow.tmp.push( ...o );
	    		else this.flow.tmp.push( o );
	    	}

		}

		this.changeOne = ( o = {}, direct = false ) => {

			if( o.heightData ) return

			let b = this.byName( o.name );
			if( b === null ) return null;
			let type = b.type;

			if( o.drivePosition ){
				if( o.drivePosition.rot !== undefined ){  
					o.drivePosition.quat = MathTool.quatFromEuler( o.drivePosition.rot ); 
					delete ( o.drivePosition.rot ); 
				}
			}
			if( o.rot !== undefined ){ o.quat = MathTool.quatFromEuler( o.rot ); delete ( o.rot ); }
			//if( o.rot1 !== undefined ){ o.quat1 = math.toQuatArray( o.rot1 ); delete ( o.rot1 ); }
			//if( o.rot2 !== undefined ){ o.quat2 = math.toQuatArray( o.rot2 ); delete ( o.rot2 ); }
			if( o.localRot !== undefined ){ o.quat = MathTool.toLocalQuatArray( o.localRot, b ); delete ( o.localRot ); }


			//if( o.type === 'solver' ) direct = true;
			//if( o.solver !== undefined ) direct = true;

			switch( type ){

				case 'terrain': b = items.terrain.set( o, b ); direct = false; break;
				case 'ray': b = items.ray.set( o, b ); direct = false; break;
				case 'character': b = items.character.set( o, b ); break;
				case 'solid': b = items.solid.set( o, b ); break;
				case 'joint': b = items.joint.set( o, b );  break;
				case 'body':
				if( b.isKinematic ) items.body.set( o, b );
	            if( !b.actif || b.sleep ) items.body.set( o, b );
	            if( o.sleep ) items.body.set( o, b );
				break;

			}
			
			if( direct ){
				this.post({ m:'change', o:o }, null, direct );
			}

		}


		//-----------------------
		//  CAMERA CONTROLS
		//-----------------------

		this.setControl = ( Controls ) => { 

			controls = Controls;
			azimut = controls.getAzimuthalAngle;

		}

		this.getCurrentCharacterPosition = () => {

			return controls.followGroup.position;

		}

		this.getCamera = ( o = {} ) => {

			return controls.object;

		}

		this.setCamera = ( o = {} ) => {

			controls.moveCam( o );

		}

		this.follow = ( m = '', o = {} ) => {

			let mesh = null;

			if ( typeof m === 'string' || m instanceof String ) mesh = m === '' ? null : this.byName( m );
			else if ( m.isObject3D ) mesh = m;

			if( mesh === null ) controls.resetFollow();
			else controls.startFollow( mesh, o );

		}


	    //-----------------------
		//  INTERN timout
		//-----------------------

		this.setTimeout = ( f, time = 0, single = false ) => {

			if(single) timout = setTimeout( f, time );
			else{
				timoutFunction = f; 
				timoutTime = time; 
				timout = setTimeout( timoutFunction, timoutTime );
			}

		}

		this.playtimout = () => {

			if( timoutFunction === null ) return
			timout = setTimeout( timoutFunction, timoutTime );

		}

		this.pausetimout = () => {

			if( timout === null ) return
			clearTimeout( timout );

		}

		this.cleartimout = ( f, time ) => {

			if( timout === null ) return
			timoutFunction = null;
			timoutTime = 0; 
			clearTimeout( timout );
			timout = null;

		}


		//-----------------------
		//  TEXTURE
		//-----------------------

		this.texture = ( o={} ) => ( Pool.texture( o ) );
		this.getTexture = ( name, o={} ) => ( Pool.getTexture( name, o ) );
		//this.texture( o = {} ) { return Pool.texture( o );}


		//-----------------------
		//  MATERIAL
		//-----------------------

		this.setExtendShader = ( f ) => { this.mat.extendShader = f }
		this.addMaterial = ( m, direct ) => { this.mat.set( m, direct ); }
		this.directIntensity = ( v ) => { /*this.mat.directIntensity(v);*/ }
		this.setEnvmapIntensity = ( v ) => { /*this.mat.setEnvmapIntensity(v);*/ }

		// return
		this.getMatRef = () => ( this.mat );
		this.getMat = ( name ) => ( this.mat.get( name ) );
		this.getMaterial = ( name ) => ( this.mat.get( name ) );
		this.getMaterialList = () => ( this.mat.getList() );
		this.material = ( o={} ) => ( this.mat.create( o ) );
		this.changeRenderMode = ( n ) => ( this.mat.changeRenderMode( n ) );


		//-----------------------
		//
		//  POOL
		//
		//-----------------------

		this.load = Pool.load; // ( Urls, Callback, Path = '', msg = '' )
		this.get = Pool.get; // ( name, type )
		//this.getGlb = Pool.getGLB;
		this.getGroup = Pool.getGroup;
		this.getScript = Pool.getScript;

		this.preload = ( Urls, Callback ) => {

			preloadAvatar.add( Urls, Callback );
			//Pool.load( Urls, Callback, Path, msg )
		}

		/*this.load ( Urls, Callback, Path = '', msg = '' ){
			Pool.load( Urls, Callback, Path, msg );
		}*/

		// TODO ?? 

		/*this.async loadAsync ( Urls, Path = '', msg = '' ){
			await Pool.loadAsync( Urls, Path, msg );
		}*/

		this.applyMorph = ( modelName, meshs = null, normal = true, relative = true )=>{
			Pool.applyMorph( modelName, meshs = null, normal = true, relative = true );
		}

		this.getMesh = ( obj, keepMaterial, multyMaterialGroup )=>{
			if( keepMaterial ){
				let mm = Pool.getMaterials(obj);
				for( let m in mm ){
					this.addMaterial( mm[m] );
				}
			}
			return Pool.getMesh( obj, multyMaterialGroup );
		}

		this.getGlb = ( obj, keepMaterial, multyMaterialGroup )=>{
			if( keepMaterial ){
				let mm = Pool.getMaterials(obj);
				for( let m in mm ){
					this.addMaterial( mm[m] );
				}
			}
			return Pool.getGLB( obj, multyMaterialGroup );
			
		}

		this.getGlbMaterial = ( obj )=>{
			let ms = Pool.getMaterials( obj );
			this.mat.addToMat( ms );
			return ms;
		}

		this.poolDispose = ()=>{
			return Pool.dispose();
		}

		this.setDracoPath = ( src ) => {
			return Pool.dracoPath = src;
		}


		//-----------------------
		//  PARTICLE
		//-----------------------

		this.initParticle = ()=>{}
		this.addParticle = ()=>{}
		this.getParticle = ()=>{}

		this.addParticleSolver = ( o )=>{
			let s = new Particle( o, this );
			particles.push(s);
			return s;
		}

		this.updateParticleSolver = () =>{ 

			let i = particles.length;
			while( i-- ) particles[i].update();
			
		}

		this.clearParticleSolver = () => { 

			let i = particles.length;
			//while( i-- ) particles[i].dispose()
	    	particles = [];
			
		}


		this.addRayCar = (o) => {

			let b = new RayCar( o, this );
			return b;

		}


		//-----------------------
		//  BUTTON
		//-----------------------

		this.addButton = (o) => {

			let b = new Button( o, this );
			buttons.push( b );
			return b;

		}

		this.upButton = (o) => {
			for ( const key in buttons ) buttons[key].update();
		}


		//-----------------------
		//  TEXT
		//-----------------------

		this.addText = ( o ) => {

			let t = new Textfield( o );
			if( o.parent ) o.parent.add( t );
			else this.scenePlus.add( t );
			textfields.push(t);
			return t;

		}

		this.clearText = () => {

			let i = textfields.length;
			while( i-- ) textfields[i].dispose();
	    	textfields = [];
			
		}

		//-----------------------
		// BREAK
		//-----------------------

		this.screenshot = () => {

			var w = window.open('', '');
		    w.document.title = "Screenshot";
		    w.document.body.style.cssText = 'margin:0; padding:0; overflow:hidden;';
		    //w.document.body.style.backgroundColor = "red";
		    var img = new Image();
		    // Without 'preserveDrawingBuffer' set to true, we must render now
		    renderer.render(scene, this.getCamera());
		    img.src = renderer.domElement.toDataURL();
		    w.document.body.appendChild(img); 

		}


		//-----------------------
		// BREAK
		//-----------------------

		this.addBreaker = () => {

			if( breaker !== null ) return;
			breaker = new Breaker(this);

		}


		//-----------------------
		//  EXPLOSION
		//-----------------------

		this.explosion = ( position = [0,0,0], radius = 10, force = 1 )=>{

			let r = [];
		    let pos = new Vector3();

		    if( position ){
		    	if( position.isVector3 ) pos.copy(position);
		    	else pos.fromArray( position );
		    }
		    
		    let dir = new Vector3();
		    let i = items.body.list.length, b, scaling;

		    while( i-- ){

		        b = items.body.list[i];
		        dir.copy( b.position ).sub( pos );
		        scaling = 1.0 - dir.length() / radius;

		        if( b.isKinematic ) continue;
		        if ( scaling < 0 ) continue;
		        	
		        dir.setLength( scaling );
		        dir.multiplyScalar( force );

		        r.push({ name:b.name, impulse:dir.toArray(), wake:true });
		        //r.push({ name:b.name, impulse:[0,0.01,0], impulseCenter:pos.toArray(), wake:true })
		    }
		    
			this.change( r );
		}
	}

	set onStep ( f ) {

		this.setStep( f )

	}
	
}



//--------------
//
//  SOLID ONLY 
//
//--------------

class Solid extends Body {
	constructor ( motor ) {
		super( motor );
		this.type = 'solid';
	}
	step (){}
}




//-------------------
//
//  UTILS
//
//-------------------

export class Utils {


	constructor ( motor ) {

		this.map = new Map();
		this.motor = motor;

	}

	byName ( name ) {

		if ( !this.map.has( name ) ) return null;
		return this.map.get( name );

	}

	add ( b, parent ) {

		if( b.type !== 'contact' && !b.isInstance && b.isObject3D ){

			//console.log('add', b.name, b.type )

			if(!parent){
				if(b.isButton){ this.motor.scene.add( b ); }
				else {
					switch( b.type ){
						case 'terrain': case 'solid': case 'joint': case 'ray': case 'articulation': this.motor.scenePlus.add( b ); break;
						default: this.motor.scene.add( b ); break;
					}
				}
				
			} else {
				parent.add( b );
			}

		}

		if( b.isInstance && b.refName !== b.name ) this.map.set( b.refName, b );

		this.map.set( b.name, b );

	}

	remove( b ) {

		if( b.dispose ) b.dispose();
		if( b.parent ) b.parent.remove( b );
		if( b.isInstance ) { 
			if( b.refName !== b.name ) this.map.delete( b.refName );
			b.instance.remove( b.id );
		}
		this.map.delete( b.name );

	}

	noRay( b ) {
		if( b.isObject3D ){
			b.raycast = () => {return}
			b.traverse( ( child ) => {
				if ( child.isObject3D ) child.raycast = () => {return}
			})
		}
	}

    morph ( obj, name, value ) {
        
        if(!obj.morphTargetInfluences) return
        if(obj.morphTargetDictionary[name] === undefined ) return
        obj.morphTargetInfluences[ obj.morphTargetDictionary[name] ] = value;
    
    }


    toLocal ( v, obj, isAxe = false ) {

    	//if( obj.isObject3D ) obj.updateWorldMatrix( true, false )
    	// apply position
    	if(!isAxe) v.sub( obj.position );
    	//v.multiply(obj.scale)
    	// apply invers rotation
    	let q = obj.quaternion//.normalize();
    	//v.applyQuaternion(q.clone().invert())
    	//v.applyQuaternion({x:-q.x, y:-q.y, z:-q.z, w:q.w})
    	v.applyQuaternion({x:-q._x, y:-q._y, z:-q._z, w:q._w})
    	//if(isAxe) v.normalize()
    	return v

    }

    quatLocal ( q, obj ) {

    	if( obj.isObject3D ) obj.updateWorldMatrix( true, false )
    	// apply position
    	//if(!isAxe) v.sub( obj.position )
    	// apply invers rotation
    	let q1 = new Quaternion().fromArray(q)
    	let q2 = obj.quaternion.clone().invert()
    	q1.premultiply(q2)
    	//v.applyQuaternion({x:-q.x, y:-q.y, z:-q.z, w:q.w})
    	return q1.normalize().toArray();

    }

    axisLocal ( v, obj ) {

    	if( obj.isObject3D ) obj.updateWorldMatrix( true, false )
    	// apply position

        let m3 = new Matrix3().setFromMatrix4( obj.matrixWorld )//.invert()
        //m3.invert()
        let vv = new Vector3().fromArray(v).applyMatrix3( m3 )

        //let vv = new Vector3().fromArray(v).applyMatrix4( obj.matrixWorld.clone().invert() );

    	return vv.toArray()

    }


    quatToAngular ( qb, qa ) {

    	// invert
    	qa[0] *= -1
    	qa[1] *= -1
    	qa[2] *= -1

    	let x = qa[0] * qb[3] + qa[3] * qb[0] + qa[1] * qb[2] - qa[2] * qb[1];
		let y = qa[1] * qb[3] + qa[3] * qb[1] + qa[2] * qb[0] - qa[0] * qb[2];
		let z = qa[2] * qb[3] + qa[3] * qb[2] + qa[0] * qb[1] - qa[1] * qb[0];
		let w = qa[3] * qb[3] - qa[0] * qb[0] - qa[1] * qb[1] - qa[2] * qb[2];

    	let angle = 2 * Math.acos(w), ax;
	    let s = Math.sqrt(1-w*w); // assuming quaternion normalised then w is less than 1, so term always positive.
	    if (s < 0.001) { // test to avoid divide by zero, s is always positive due to sqrt
	        // if s close to zero then direction of axis not important
	        // if it is important that axis is normalised then replace with x=1; y=z=0;
	        ax = [0,0,0]
	    } else {
	        //x = q[0] / s; // normalise axis
	        ax =  [x / s,y / s,z / s]
        }
    	
        const v = new Vector3().fromArray(ax)
    	const timeDiff = 1//time2 - time1;
    	const angularVelocity = v.multiplyScalar( angle / timeDiff );

    	//console.log('result',v)

    }

    refAxis( m, axe ) {

    	let zAxis = new Vector3().fromArray(axe)
	    let xAxis = new Vector3(1, 0, 0);
	    let yAxis = new Vector3(0, 1, 0);
	    if ( Math.abs( axe[1] ) > 0.9999 ){
			yAxis.copy( xAxis ).cross( zAxis ).normalize();
		} else {
			xAxis.copy( zAxis ).cross( yAxis ).normalize();
			yAxis.copy( xAxis ).cross( zAxis ).normalize();
		}

		m.makeBasis( xAxis, yAxis, zAxis );

    }

}