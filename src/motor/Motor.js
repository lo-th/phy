
import {
    Group, Vector3, Vector2, Quaternion
} from 'three';

import { MathTool } from '../core/MathTool.js';
import { Max, Num, getArray, getType } from '../core/Config.js';

import { root, Utils } from './root.js';
import { Geo } from './base/Geo.js';
import { Mat } from './base/Mat.js';
import { Timer } from './base/Timer.js';
import { User } from './base/User.js'

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

import { Pool } from '../3TH/Pool.js';
import { sk } from '../3TH/character/SkeletonExtand.js'

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*
*    THREE JS ENGINE
*/

const Version = {
    Oimo: '1.2.2',
    Ammo: '3.0',
    Physx: '5.02.01',
    Rapier: '0.10.0',
    Havok: '1.1.4',
    Jolt: '0.0.4',
}

const items = {};

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

const user = new User();
const timer = new Timer(60);

let azimut = ()=>(0);
let endReset = ()=>{};
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

export class Motor {

	static getSetting () { return settings; }

	static setGravity(){

		root.post({ m:'setGravity', o:{ gravity:settings.gravity } });

	}

	static set ( o = {} ){

		settings.fixe = o.fixe !== undefined ? o.fixe : true;
		settings.full = o.full !== undefined ? o.full : false;
		settings.gravity = o.gravity ? o.gravity : [0,-9.81,0];
	    settings.substep = o.substep ? o.substep : 2;
	    settings.fps = o.fps ? o.fps : 60;

		if( o.key ) addControl();

		items.body.setFull( settings.full )
		Motor.initArray( settings.full )

		elapsedTime = 0

		isTimeout = isWorker
		outsideStep = !isTimeout

	    root.jointVisible = o.jointVisible || false

		if( outsideStep ) timer.setFramerate( settings.fps )

		const data = {
			...settings,
			ArPos:root.ArPos,
			isTimeout:isTimeout,
			outsideStep:outsideStep,
		}

		root.post({ m:'set', o:data });

	}

	static math = MathTool

	static activeMouse ( controler, mode ) { 
		if( !mouseTool ) mouseTool = new MouseTool( controler, mode ) 
	}

    static mouseMode ( mode, o ) { 
		if( mouseTool ) mouseTool.setMode( mode, o )
	}


	static getTimeTest () { return timetest }

	static setMaxFps ( v ) { maxFps = v }

	static getMouse () { return mouseTool ? mouseTool.mouse:null }

	static setMaxAnisotropy ( f ) { Pool.maxAnisotropy = f; }

	static setAddControl ( f ) { addControl = f; }

	static setPostUpdate ( f ) { postUpdate = f !== null ? f : ()=>{} }
	static setAzimut ( f ) { azimut = f }

	static setKey (i, v) { return user.setKey(i,v) }
	static getKey () { return user.key }
	static getKey2 () { return user.key2 }
	static getAzimut () { return azimut() }

	static setContent ( Scene ) {

		root.threeScene = Scene;
		Scene.add( root.scene );
		Scene.add( root.scenePlus );

	}

	static message ( m ){

		let e = m.data;
		if( e.Ar ) root.Ar = e.Ar;
		if( e.reflow ){
			root.reflow = e.reflow;
			if(root.reflow.stat.delta) elapsedTime += root.reflow.stat.delta;
		}
	
		Motor[ e.m ]( e.o );

	}

	// Typically, on a Flame, the transfer speed is 80 kB/ms for postMessage 
	// This means that if you want your message to fit in a single frame, 
	// you should keep it under 1,300 kB

	static post ( e, buffer = null, direct = false ){

		if( isWorker ){

		    if( e.o ){
		    	if( e.o.type === 'solver' ) direct = true;
		    	if( e.o.solver !== undefined ) direct = true;
		    }

		    if( direct ){
		    	worker.postMessage( e, buffer );
		    } else {
		    	if( e.m === 'add' ) root.flow.add.push( e.o );
		    	else if ( e.m === 'remove' ) root.flow.remove.push( e.o );
		    	else worker.postMessage( e, buffer );
		    }

		} else {
			directMessage( { data : e } );
		}

	}

	static makeView () {}

	static getScene () { return root.scene; }

	static resize ( size ) { root.viewSize = size; }

	static init ( o = {} ) {

		// TODO find better solution
		let url = document.location.href.replace(/\/[^/]*$/,"/");
		var arr = url.split("/");
		url = arr[0] + "//" + arr[2] + '/';

		if( url === 'https://lo-th.github.io/' ) url = 'https://lo-th.github.io/phy/';

		const path = o.path || 'build/';
		const wasmLink = {
		    Ammo: path + 'ammo.wasm.js',
		    Physx: path + 'physx-js-webidl.js',
		    Havok: path + 'HavokPhysics.js',
		}

		let type = o.type || 'PHYSX';
		let name = type.toLowerCase();
		let mini = name.charAt(0).toUpperCase() + name.slice(1);
		let st = '';

		//let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

		root.engine = type;

		Motor.initItems();

		// garbage material
		Pool.materialRoot = Mat.set;

		if( o.callback ){ 
			callbackReady = o.callback;
			delete o.callback;
		}

		isWorker = o.worker || false;

		root.scene = new Group();
		root.scene.name = 'phy_scene';
		root.scenePlus = new Group();
		root.scenePlus.name = 'phy_scenePlus';

		if( o.scene ){ 
			Motor.setContent( o.scene );
			delete ( o.scene );
		}

		root.post = Motor.post;
		root.motor = Motor;

		if( isWorker ){ // is worker version

		    // for wasm side
		    if( wasmLink[mini] ) o.blob = url + wasmLink[mini];

		    //worker = new Worker( path + mini + '.module.js', {type:'module'})
			worker = new Worker( url + path + mini + '.min.js' )

			worker.postMessage = worker.webkitPostMessage || worker.postMessage;
			worker.onmessage = Motor.message;

			let ab = new ArrayBuffer( 1 );
			worker.postMessage( { m: 'test', ab:ab }, [ ab ] );
			isBuffer = ab.byteLength ? false : true;


			o.isBuffer = isBuffer;
			console.log( st + ' Worker '+ type + (o.isBuffer ? ' with Shared Buffer' : '') );

			Motor.initPhysics( o );


		} else { // is direct version

			if( wasmLink[mini] ) Motor.loadWasmDirect( wasmLink[mini], o, mini, url )
			else Motor.preLoad( mini, o, url );

		}

	}

	static loadWasmDirect( link, o, name, url ) {

	    let s = document.createElement("script");
	    s.src = url + link;
	    document.body.appendChild( s );
	    s.onload = () => { Motor.preLoad( name, o, url ); }

	}

	static async preLoad( name, o, url ) {

		let link = url + 'build/'+name+'.module.js';
		if( o.devMode ) link = url + 'src/'+name+'.js';
	    let M = await import( link );
	    directMessage = M.engine.message;
		o.message = Motor.message;
		Motor.initPhysics( o );

	}

	////

	static initPhysics( o ) {
	
	    root.post({ m:'init', o:o });
	    engineReady = true

	}
	
	static getPause (){

		return isPause

	}

	static pause ( v ){

		if( v === isPause ) return
		isPause = v
		if( isPause ) Motor.pausetimout()
		else Motor.playtimout()
		root.post({ m:'pause', o:{ value:isPause } })

	}

	static flowReset ( ){

		root.flow = { 
			stamp:0,
			current:'',
			key:[],
			tmp:[],
			add:[],
			remove:[],
			//point:[]
		}

	}

	static reset ( callback ){

		if( first ){
			first = false;
			callback();
			return;
		}

		buttons = [];

		Motor.clearText();
		//Motor.clearSkeleton()
		Motor.clearParticleSolver();

		Motor.cleartimout();

		currentControle = null;

		if( controls ) controls.resetAll();
		if( mouseTool ) mouseTool.unSelect();

		endReset = callback;

		postUpdate = function () {};

		Motor.flowReset();

		// clear instance
	    Motor.clearInstance();

	    // reset all items
	    Motor.resetItems();

		// clear temporary geometry
		Geo.dispose();

	    // clear temporary material
	    Mat.dispose();

	    // clear temporary mesh
		root.disposeTmp();

		if( breaker !== null ) breaker = null;
			
		root.tmpTex = [];
	    root.scenePlus.children = [];
	    root.scene.children = [];

		root.post({ m:'reset' });

	}

	static resetCallback (){

		endReset();

	}

	static ready (){

		console.log( (isWorker? 'Worker ': 'Direct ') + root.engine + ' is ready !' );
		if( callbackReady ) callbackReady();

	}

	static start ( o = {} ){ root.post({ m:'start', o:o }) }

	static morph ( obj, name, value ){ Utils.morph( obj, name, value ) }

	static getFps (){ return root.reflow.stat.fps }
	
	static getDelta2(){ return root.reflow.stat.delta }
	static getElapsedTime2(){ return elapsedTime }
	
	static getDelta(){ return timer.delta }
	static getElapsedTime(){ return timer.elapsedTime }

	static doStep ( stamp ){

		if( !engineReady ) return;
		if( !outsideStep ) return;

        //if( isWorker && realtime ) return

		if( timer.up( stamp ) ) {
			root.post( { m:'step', o:stamp } );
		}

		/*if( isBuffer ) root.post( { m:'poststep', flow:root.flow, Ar:Ar }, [ Ar.buffer ] )
		else root.post( { m:'poststep', flow:root.flow, Ar:Ar })
		Motor.flowReset()*/

	}

	static step (){

		root.delta = root.reflow.stat.delta;//outsideStep ? timer.delta : root.reflow.stat.delta;

		Motor.stepItems();
    
		// user key interaction 
		
		root.flow.key = user.update();
		root.flow.current = currentControle !== null ? currentControle.name : ''
		//root.flow.tmp = []

		if( breaker !== null ) breaker.step();

		if( currentControle !== null ) currentControle.move();

		if( mouseTool ) mouseTool.step();

		//postUpdate( root.reflow.stat.delta )
		postUpdate( timer.delta );

		//items.character.prestep()

		// update static object for this side !
		Motor.changes( root.flow.tmp );


		// finally post flow change to physx
		if( isBuffer ) root.post( { m:'poststep', flow:root.flow, Ar:root.Ar }, [ root.Ar.buffer ] );
		else root.post( { m:'poststep', flow:root.flow });

		//	Motor.stepItems()
		Motor.flowReset();

	}

    

	static initArray ( full = false ) {

	    // dynamics array
		root.ArPos = getArray( root.engine, full );

	}

    

	static control ( name ){ // for character and vehicle

		if( currentControle !== null ){
			if( name !== currentControle.name ){ 
				currentControle = Motor.byName( name )
			}
		} else {
			currentControle = Motor.byName( name )
		}

	}

	static byName ( name ){

		return Utils.byName( name )

	}

	static getAllBody ( name ){

		return items.body.list;

	}


	//-----------------------
	//  ITEMS
	//-----------------------

	static initItems () {

		items['ray'] = new Ray();
		items['body'] = new Body();
		items['joint'] = new Joint();
		items['solid'] = new Solid();
		items['contact'] = new Contact();
		items['terrain'] = new Terrain();
		items['character'] = new Character();

		if( root.engine === 'PHYSX' || root.engine === 'AMMO' ){ 
			items['vehicle'] = new Vehicle()
		}

		if( root.engine === 'PHYSX' ){ 
			items['solver'] = new Solver()
		}

		root.items = items;

	}

	static getBodyRef () { return items.body; }

	static clearBody() {

		items.body.reset()

	}

	static resetItems() {

		Object.values(items).forEach( value => value.reset() );
		//for (const key in items) items[key].reset()

	}

	static stepItems () {

		//if( root.Ar === null ) return

	    Object.values(items).forEach( value => value.step() );
		//for ( const key in items ) items[key].step( root.Ar, root.ArPos[key] )

		Motor.upInstance();
		Motor.upButton();

	}


	//-----------------------
	//  INSTANCE
	//-----------------------

	static upInstance() {

    	Object.values( root.instanceMesh ).forEach( value => value.update() );

    }

	static clearInstance() {

    	Object.values( root.instanceMesh ).forEach( value => value.dispose() );
    	root.instanceMesh = {}

	}


	//-----------------------
	//  ADD
	//-----------------------

	static addDirect( b ) {

		root.scenePlus.add( b );
		root.tmpMesh.push( b );
		return b;

	}

	static adds ( r = [], direct ){

		let i = r.length, n = 0;
		while(i--) Motor.add( r[n++], direct );

	}

	static add ( o = {}, direct = false ) {

		if( o.isObject3D ) return Motor.addDirect( o );
		if( o.constructor === Array ) return Motor.adds( o, direct );
		if( o.type === 'container' ) return new Container( o );
		
		if( o.bounce !== undefined ) o.restitution = o.bounce;
		if( o.type === undefined ) o.type = 'box';
		if( o.mode !== undefined ) o.type = 'joint';

		let type = getType( o );

		if( type === 'joint' && o.mode === undefined ){ 
			o.mode = o.type;
			o.type = 'joint';
		}

		return items[type].add( o );

	}


	//-----------------------
	//  REMOVE
	//-----------------------

	static removes ( r = [], direct ){ 

		let i = r.length, n = 0;
		while(i--) Motor.remove( r[n++], direct );

	}
	
	static remove ( name, direct = false ){

		if ( name.constructor === Array ) return Motor.removes( name, direct )

		let b = Motor.byName( name )
		if( b === null ) return;

		// remove on three side
		items[b.type].clear( b );
		// remove on physics side
		root.post( { m:'remove', o:{ name:name, type:b.type } }, null, direct )

	}


	//-----------------------
	//  CHANGE
	//-----------------------

	static changes ( r = [], direct = false ){ 

		let i = r.length, n = 0;
		while( i-- ) Motor.changeOne( r[n++], direct );

	}

    static change ( o, direct = false ) {

    	if( direct ){
    		if( o instanceof Array ) Motor.changes( o, true )
    		else Motor.changeOne( o, true )
    	} else {
    		if( o instanceof Array ) root.flow.tmp.push( ...o );
    		else root.flow.tmp.push( o );
    	}

	}

	static changeOne ( o = {}, direct = false ){

		if( o.heightData ) return

		let b = Motor.byName( o.name );
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

			//b = body.set( o, b ); 
			break;

		}
		
		if( direct ){
			root.post({ m:'change', o:o }, null, direct );
		}

	}


	//-----------------------
	//  CAMERA CONTROLS
	//-----------------------

	static setControl ( Controls ) { 

		controls = Controls;
		azimut = controls.getAzimuthalAngle;

	}

	static setCamera ( o = {} ){

		controls.moveCam( o );

	}

	static follow ( m = '', o = {} ){

		let mesh = null;

		if ( typeof m === 'string' || m instanceof String ) mesh = m === '' ? null : Motor.byName( m );
		else if ( m.isObject3D ) mesh = m;

		if( mesh === null ) controls.resetFollow();
		else controls.startFollow( mesh, o );

	}


    //-----------------------
	//  INTERN timout
	//-----------------------

	static setTimeout ( f, time = 0 ){

		timoutFunction = f; 
		timoutTime = time; 
		timout = setTimeout( timoutFunction, timoutTime ) 

	}

	static playtimout (){

		if( timoutFunction === null ) return
		timout = setTimeout( timoutFunction, timoutTime ) 

	}

	static pausetimout (){

		if( timout === null ) return
		clearTimeout( timout ) 

	}

	static cleartimout ( f, time ){

		if( timout === null ) return
		timoutFunction = null
		timoutTime = 0; 
		clearTimeout( timout )
		timout = null

	}


	//-----------------------
	//  TEXTURE
	//-----------------------

	static texture( o = {} ) {
		return Pool.texture( o )
	}


	//-----------------------
	//  MATERIAL
	//-----------------------

	static material ( o = {} ){ return Mat.create( o ) }

	static setExtendShader ( f ) { Mat.extendShader = f }

	static getMaterialList(){ return Mat.getList(); }

	static addMaterial( m, direct ){ Mat.set( m, direct ); }

	static setEnvmapIntensity ( v ) { Mat.setEnvmapIntensity(v); }

	static getMat( name ){ return Mat.get( name ) }


	//-----------------------
	//
	//  POOL
	//
	//-----------------------

	static load ( Urls, Callback, Path = '', msg = '' ){
		Pool.load( Urls, Callback, Path, msg )
	}

	static applyMorph ( modelName, meshs = null, normal = true, relative = true ){
		Pool.applyMorph( modelName, meshs = null, normal = true, relative = true );
	}

	static getMesh ( obj, keepMaterial ){
		if( keepMaterial ){
			let mm = Pool.getMaterials(obj);
			for( let m in mm ){
				Motor.addMaterial( mm[m] );
			}
		}
		return Pool.getMesh( obj, keepMaterial );
	}

	static getGroup ( obj, autoMesh, autoMaterial ){
		return Pool.getGroup( obj, autoMesh, autoMaterial );
	}

	static getScript ( name ){
		return Pool.getScript( name );
	}

	static get ( name, type ){
		return Pool.get( name, type );
	}

	static poolDispose (){
		return Pool.dispose();
	}

	static setDracoPath ( src ){
		return Pool.dracoPath = src;
	}


	//-----------------------
	//  PARTICLE
	//-----------------------

	static initParticle (){}
	static addParticle (){}
	static getParticle (){}

	static addParticleSolver ( o ){
		let s = new Particle( o )
		particles.push(s)
		return s
	}

	static updateParticleSolver () { 

		let i = particles.length
		while( i-- ) particles[i].update()
		
	}

	static clearParticleSolver () { 

		let i = particles.length
		//while( i-- ) particles[i].dispose()
    	particles = []
		
	}


	//-----------------------
	//  BUTTON
	//-----------------------

	static addButton (o) {

		let b = new Button( o )
		buttons.push( b )
		return b//.b

	}

	static upButton (o) {

		for ( const key in buttons ) buttons[key].update()

	}


	//-----------------------
	//  TEXT
	//-----------------------

	static addText ( o ){

		let t = new Textfield( o );
		if( o.parent ) o.parent.add( t );
		else root.scenePlus.add( t );
		textfields.push(t);
		return t;

	}

	static clearText () {

		let i = textfields.length;
		while( i-- ) textfields[i].dispose();
    	textfields = [];
		
	}


	//-----------------------
	// BREAK
	//-----------------------

	static addBreaker() {

		if( breaker !== null ) return;
		breaker = new Breaker();

	}


	//-----------------------
	//  EXPLOSION
	//-----------------------

	static explosion ( position = [0,0,0], radius = 10, force = 1 ){

		let r = []
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
	    
		Motor.change( r );
	}
}



//--------------
//
//  SOLID ONLY 
//
//--------------

class Solid extends Body {
	constructor () {
		super()
		this.type = 'solid';
	}
	step (){}
}