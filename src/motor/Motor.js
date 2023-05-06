
import {
    Group, MeshPhysicalMaterial, MeshStandardMaterial, MeshBasicMaterial, Vector3, Vector2
} from 'three';


import { root, math, Utils, Geo, Mat, mat } from './root.js';
import { Max, Num, getArray, getType } from '../core/Config.js';

import { Ray } from './Ray.js';
import { Body } from './Body.js';
import { Joint } from './Joint.js';
import { Contact } from './Contact.js';
import { Vehicle } from './Vehicle.js';
import { Character } from './Character.js';
import { Terrain } from './Terrain.js';
import { Solver } from './Solver.js';
import { Timer } from './Timer.js';
import { User } from './User.js';

import { Button } from './Button.js';
import { Textfield } from './Textfield.js';

import { Breaker } from './Breaker.js';
import { MouseTool } from './MouseTool.js';

import { Pool } from '../3TH/Pool.js';
import { sk } from '../3TH/character/SkeletonExtand.js'

// PARTICLE
//import { Smoke } from '../../build/smoke.module.js'

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
    Physx: '5.01.03',
    Rapier: '0.10.0',
    Havok: '0.10.0',
}

let items
let currentControle = null
let callback = null
let Ar = null, ArPos = {}
let maxFps = 60
let worker = null
let isWorker = false
let isBuffer = false
let isTimeout = false
let outsideStep = true

let realtime = true

let engineReady = false


let breaker = null;

let timetest = {
	t1:0,
	t2:0,
	t3:0,
	t4:0,
}

let mouseTool = null;


let isPause = false

let directMessage = null
let controls = null
let first = true

let timout = null
let timoutFunction = null
let timoutTime = 0
let elapsedTime = 0

const user = new User()
const timer = new Timer(60)


//let particles = null

//const threeScene = null

let azimut = function(){ return 0 }
let endReset = function(){}
let postUpdate = function(){}
let addControl = function(){}




let buttons = []
let textfields = []


export class Motor {

	static math = math

	static activeMouse ( controler, mode ) { 
		if( !mouseTool ) mouseTool = new MouseTool( controler, mode ) 
	}

    static mouseMode ( mode, o ) { 
		if( mouseTool ) mouseTool.setMode( mode, o )
	}


	static getTimeTest () { return timetest }

	static setMaxFps ( v ) { maxFps = v }

	//static setExtraTexture ( f ) { extraTexture = f }

	static setExtraMaterial ( f ) { root.extraMaterial = f }
	//static setExtraMaterial ( f ) { extraMaterial = f }

	static setAddControl ( f ) { addControl = f }

	static setPostUpdate ( f ) { postUpdate = f !== null ? f : function(){} }
	static setAzimut ( f ) { azimut = f }

	static setKey (i, v) { return user.setKey(i,v) }
	static getKey () { return user.key }
	static getKey2 () { return user.key2 }
	static getAzimut () { return azimut() }
	//static math () { return math }

	static setContent ( Scene ) {
		root.threeScene = Scene;
		Scene.add( root.scene )
		Scene.add( root.scenePlus )
	}

	static setControl ( Controls ) { 

		controls = Controls
		azimut = controls.getAzimuthalAngle

	}

	static message ( m ){

		let e = m.data
		if( e.Ar ) Ar = e.Ar;//new Float32Array( e.Ar )//;
		if( e.reflow ){
			root.reflow = e.reflow
			if(root.reflow.stat.delta) elapsedTime += root.reflow.stat.delta
		}
	
		Motor[ e.m ]( e.o )

	}

	static post ( e, buffer=null, direct = false ){

		if( isWorker ){

		    if(e.o)if( e.o.type === 'solver' || e.o.solver !== undefined) direct = true
		    if(!direct){
		    	if ( e.m === 'add' ) root.flow.add.push( e.o )
		    	else if ( e.m === 'remove' ) root.flow.remove.push( e.o )
		    	else worker.postMessage( e, buffer )
		    } else {
		    	worker.postMessage( e, buffer )
		    }

			/*if ( e.m === 'add' ){ 
				if( e.o.type === 'solver' ) worker.postMessage( e )// direct
				else if( e.o.solver !== undefined ) worker.postMessage( e )// direct
				else{ 
					if( direct ) worker.postMessage( e ) 
				    else root.flow.add.push( e.o )// in temp 
			    }
			}
			else if ( e.m === 'remove' ){ 
				if( direct ) worker.postMessage( e ) 
				else root.flow.remove.push( e.o )
			}
			else worker.postMessage( e, buffer )*/

		} else {

			/*if(e.o)if( e.o.type === 'solver' || e.o.solver !== undefined) direct = true
		    if(!direct){
		    	if ( e.m === 'add' ) root.flow.add.push( e.o )
		    	else if ( e.m === 'remove' ) root.flow.remove.push( e.o )
		    	else directMessage( { data : e } )
		    } else {
		    	directMessage( { data : e } )
		    }*/

			directMessage( { data : e } )

		}

	}

	/*static post ( e, buffer, direct = false ){

		if( isWorker ){ 

			if ( e.m === 'add' ){ 
				if( e.o.type === 'solver' ) worker.postMessage( e )// direct
				else if( e.o.solver !== undefined ) worker.postMessage( e )// direct
				else{ 
					if( direct ) worker.postMessage( e ) 
				    else root.flow.add.push( e.o )// in temp 
			    }
			}
			else if ( e.m === 'remove' ){ 
				if( direct ) worker.postMessage( e ) 
				else root.flow.remove.push( e.o )
			}
			else worker.postMessage( e, buffer )

		} else {

			directMessage( { data : e } )

		}

	}*/

	static makeView () {

	}

	static getScene () { return root.scene; }

	static getMat () { return Mat; }

	static getHideMat() { return Mat.get('hide'); }

	//static getMat ( mode ) { return mode === 'HIGH' ? mat : matLow; }

	static init ( o = {} ) {

		const rootURL = document.location.href.replace(/\/[^/]*$/,"/")

		const path = o.path || 'build/';

		const wasmLink = {
		    Ammo: path + 'ammo3.wasm.js',
		    Physx: path + 'physx-js-webidl.js',
		    Havok: path + 'HavokPhysics.js',
		}

		let type = o.type || 'PHYSX';
		let name = type.toLowerCase()
		let mini = name.charAt(0).toUpperCase() + name.slice(1)
		let st = ''

		let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

		root.engine = type

		Motor.initItems()

		//items.body.extraConvex = mini === 'Physx'
		//items.solid.extraConvex = mini === 'Physx'

		if( o.callback ){ 
			callback = o.callback
			delete ( o.callback )
		}

		isWorker = o.worker || false;

		root.scene = new Group()
		root.scene.name = 'phy_scene'
		root.scenePlus = new Group()
		root.scenePlus.name = 'phy_scenePlus'

		if(o.scene){ 
			Motor.setContent( o.scene )
			delete ( o.scene )
		}

		//root.update = Motor.update
		//root.change = Motor.change
		//root.remove = Motor.remove
		root.post = Motor.post
		//root.add = Motor.add

		root.motor = Motor

		if( isWorker ){ // is worker version

			/*switch( type ){

				case 'OIMO':

				    worker = new Worker( path + mini + '.min.js' )

				    if( isFirefox ) worker = new Worker( path + mini + '.min.js' )
				    else {
				    	try {
					        worker = new Worker( path + mini + '.module.js', {type:'module'})
						    st = 'ES6'
						} catch (error) {
						    worker = new Worker( path + mini + '.js' )
						}
				    }

				break
				
				default :

				    if( type === 'RAPIER' ) { name = 'rapier3d'; mini = 'rapier3d'; }

					//let coep = '?coep=require-corp&coop=same-origin&corp=same-origin&'
					// https://cross-origin-isolation.glitch.me/?coep=require-corp&coop=same-origin&corp=same-origin&
				    // for wasm side
				    if( wasmLink[mini] ) o.blob = rootURL + wasmLink[mini];

				    console.log(rootURL +path + mini + '.min.js')

				    //worker = new Worker( path + mini + '.module.js', {type:'module'})
					worker = new Worker( rootURL + path + mini + '.min.js' )
					//worker = new Worker( 'http://localhost:8612/build/'+mini+'.min.js'+coep )

				break

			}*/


			 if( type === 'RAPIER' ) { name = 'rapier3d'; mini = 'rapier3d'; }

		    // for wasm side
		    if( wasmLink[mini] ) o.blob = rootURL + wasmLink[mini];

		    //worker = new Worker( path + mini + '.module.js', {type:'module'})
			worker = new Worker( rootURL + path + mini + '.min.js' )



			worker.postMessage = worker.webkitPostMessage || worker.postMessage;
			worker.onmessage = Motor.message;

			let ab = new ArrayBuffer( 1 );
			worker.postMessage( { m: 'test', ab:ab }, [ ab ] );
			isBuffer = ab.byteLength ? false : true;


			o.isBuffer = isBuffer;
			console.log( st  + ' Worker '+ type + (o.isBuffer ? ' with Shared Buffer' : '') );


			Motor.initPhysics( o )


			/// ???
			//Cross-Origin-Embedder-Policy: require-corp
			//Cross-Origin-Opener-Policy: same-origin
			//const buffer = new SharedArrayBuffer( 1024  );

			//console.log(crossOriginIsolated)

			//isWorker = true;


		} else { // is direct version

			if( wasmLink[mini] ) Motor.loadWasmDirect( wasmLink[mini], o, mini, rootURL )
			else Motor.preLoad( mini, o, rootURL )

			/*directMessage = o.direct;
			o.message = Motor.message;
			console.log( type + ' is direct' );*/

		}

		//Motor.initPhysics( o )

	}

	static loadWasmDirect( link, o, name, rootURL ) {

		console.log(rootURL + link)
	
	    let s = document.createElement("script")
	    s.src = rootURL + link;
	    document.body.appendChild( s )
	    s.onload = () => { 
	    	Motor.preLoad( name, o, rootURL )
	    }

	}

	static async preLoad( name, o, rootURL ) {
	
	    let M = await import( o.devMode ? rootURL + 'src/'+name+'.js' : rootURL + 'build/'+name+'.module.js');
	    directMessage = M.engine.message
		o.message = Motor.message
		Motor.initPhysics( o )

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
			first = false
			callback()
			return
		}

		buttons = []

		Motor.clearText()

		Motor.cleartimout()

		currentControle = null

		if( controls ) controls.resetAll()
		if( mouseTool ) mouseTool.unSelect()

		endReset = callback

		postUpdate = function () {}

		Motor.flowReset()

		// clear instance
	    Motor.clearInstance()

	    // reset all items
	    Motor.resetItems()

		// clear temporary geometry
		Geo.dispose()

	    // clear temporary material
	    Mat.dispose()

	    // clear temporary mesh
		root.disposeTmp();

		if( breaker !== null ) breaker = null
			
		root.tmpTex = []
	    root.scenePlus.children = []
	    root.scene.children = []

		root.post({ m:'reset' });

	}

	static resetCallback (){

		endReset()

	}

	static ready (){

		console.log( (isWorker? 'Worker ': 'Direct ') + root.engine + ' is ready !' )
		if( callback ) callback()

	}

	static start ( o = {} ){

		root.post({ m:'start', o:o })

	}

	static setTimeout ( b ){ isTimeout = b; }
	static getTimeout ( b ){ return isTimeout }

	static set ( o = {} ){

		if( o.full === undefined ) o.full = false

		if( o.key ) addControl()

		items.body.setFull( o.full )

		Motor.initArray( o.full )
		o.ArPos = ArPos

		elapsedTime = 0

		isTimeout = isWorker
		outsideStep = !isTimeout
		///o.realtime = realtime;
		o.isTimeout = isTimeout;
		o.outsideStep = outsideStep;
		
		if(!o.gravity) o.gravity = [0,-9.81,0]
		if(!o.substep) o.substep = 2

		if(o.fps){
			if( o.fps < 0 ) o.fps = maxFps;
		} else {
			o.fps = 60;
		}

		//console.log( o.fps );

		if(outsideStep) timer.setFramerate( o.fps )

		root.post({ m:'set', o:o });

	}

	static morph ( obj, name, value ){ Utils.morph( obj, name, value ) }

	static getFps (){ return root.reflow.stat.fps }
	
	static getDelta2(){ return root.reflow.stat.delta }
	static getElapsedTime2(){ return elapsedTime }
	
	static getDelta(){ return timer.delta }
	static getElapsedTime(){ return timer.elapsedTime }

	static doStep ( stamp ){

		if( !engineReady ) return
		if( !outsideStep ) return

        //if( isWorker && realtime ) return

		if( timer.up( stamp ) ) {
			root.post( { m:'step', o:stamp } )
		}

		/*if( isBuffer ) root.post( { m:'poststep', flow:root.flow, Ar:Ar }, [ Ar.buffer ] )
		else root.post( { m:'poststep', flow:root.flow, Ar:Ar })
		Motor.flowReset()*/

	}

	static step (){

		//let stamp = root.reflow.stat.stamp 
		//timetest.t1 = root.reflow.stat.time 
		//timetest.t2 = root.reflow.stat.endTime 

		/*if( root.reflow.stat.time > timer.time.interval ){ 
			//timer.force = true
			timetest.t2++
		}*/

		//console.time('step')

		root.delta = outsideStep ? timer.delta : root.reflow.stat.delta;



		Motor.stepItems()
    
		// user key interaction 
		
		root.flow.key = user.update()
		root.flow.current = currentControle !== null ? currentControle.name : ''
		//root.flow.tmp = []

		if( breaker !== null ) breaker.step();

		if( currentControle !== null ) currentControle.move()

		postUpdate( root.reflow.stat.delta )
		//postUpdate( timer.delta )

		//  update static object for this side !
		Motor.changes( root.flow.tmp )


		// finally post flow change to physx
		if( isBuffer ) root.post( { m:'poststep', flow:root.flow, Ar:Ar }, [ Ar.buffer ] )
		else root.post( { m:'poststep', flow:root.flow })

		Motor.flowReset()

	}

    

	static initArray ( full = false ) {

	    // dynamics array
		ArPos = getArray( root.engine, full )

	}

    static upInstance() {

    	for( let n in root.instanceMesh ) root.instanceMesh[n].update()

    }

	static clearInstance() {

    	for( let n in root.instanceMesh ) root.instanceMesh[n].dispose()
    	root.instanceMesh = {}

	}

	static addDirect( b ) {

		root.scene.add( b )
		root.tmpMesh.push( b )

	}

	static texture( o = {} ) {
		return Pool.texture( o )//extraTexture( o )
	}

	static material ( o = {} ){

		let m
		let isphy = false 
		if( o.thickness || o.sheen || o.clearcoat || o.transmission ) isphy = true
		if(o.normalScale){
			if( !o.normalScale.isVector2 ) o.normalScale = new Vector2().fromArray(o.normalScale)
		}
		if( o.isMaterial ) m = o
		else m = isphy ? new MeshPhysicalMaterial( o ) : new MeshStandardMaterial( o )
		if( mat[ m.name ] ) return null;

	    Mat.set( m );
		return m;

	}

	static control ( name ){ // for character and vehicle

		if(currentControle !== null){
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

		return items.body.list

	}

	static explosion ( position = [0,0,0], radius = 10, force = 100 ){

		let r = []
	    let pos = new Vector3()

	    //console.log( position)

	    if(position){
	    	if( position.isVector3 ) pos.copy(position)
	    	else pos.fromArray( position )
	    }
	    
	    let dir = new Vector3()
	    let i = items.body.list.length, b, scaling

//
	    while( i-- ){

	        b = items.body.list[i]
	        dir.copy( b.position ).sub( pos )
	        scaling = 1.0 - dir.length() / radius

	        if( b.isKinematic ) continue;
	        if ( scaling < 0 ) continue;
	        


	       // if ( scaling < 0 ){
	        	dir.setLength( scaling )
	            dir.multiplyScalar( force )
	       // }
	        

	        //r.push({ name:b.name, impulse: [ ...pos.toArray(), ...dir.toArray()] })
	        r.push({ name:b.name, linearImpulse: dir.toArray(), wake:true })
	        //r.push({ name:b.name, force: dir.toArray(), forceMode:'impulse' })


	    }

	    //console.log( r.length)

		Motor.change( r )

	}

	//-----------------------
	//  BUTTON
	//-----------------------

	static addButton (o) {

		let b = new Button( o )
		buttons.push( b )
		return b.b

	}

	static upButton (o) {

		for ( const key in buttons ) buttons[key].update()

	}


	//-----------------------
	//  ITEMS
	//-----------------------

	static getBodyRef () {
		return items.body
	}

	static initItems () {

		items = {
			ray : new Ray(), 
			body : new Body(), 
			solid : new Solid(), 
			joint : new Joint(), 
			contact : new Contact(), 
			terrain : new Terrain(), 
			character : new Character()
		}

		if( root.engine === 'PHYSX' || root.engine === 'AMMO' ){ 
			items['vehicle'] = new Vehicle()
		}

		if( root.engine === 'PHYSX' ){ 
			items['solver'] = new Solver()
		}

		root.items = items

		//root.bodyRef = items.body
		

	}

	static resetItems() {

		for (const key in items) items[key].reset()

	}

	static stepItems () {

		if(Ar===null) return

		Motor.upButton()

		for ( const key in items ) items[key].step( Ar, ArPos[key] )

		Motor.upInstance()

		// update follow camera
		/*if( controls ){ 
			if( controls.enableDamping && controls.enable ) controls.update()
			if( controls.follow ) controls.follow( Motor.getDelta() )
		}*/
	}

	static adds ( r = [], direct ){ for( let o in r ) Motor.add( r[o], direct ) }

	static add ( o = {}, direct = false ){

		if ( o.constructor === Array ) return Motor.adds( o, direct )

		if( o.mass !== undefined ) o.density = o.mass
		if( o.bounce !== undefined ) o.restitution = o.bounce
		if( o.type === undefined ) o.type = 'box'

		let type = getType( o );

		return items[type].add( o );

	}


	static removes ( r = [], direct ){ for( let o in r ) Motor.remove( r[o], direct ) }
	
	static remove ( name, direct = false ){

		if ( name.constructor === Array ) return Motor.removes( name, direct )

		let b = Motor.byName( name )
		if( b === null ) return;

		// remove on three side
		items[b.type].clear( b );
		// remove on physics side
		root.post( { m:'remove', o:{ name:name, type:b.type } }, null, direct )

	}



	static up ( list ) {

		console.log('up is old')
		Motor.change( list, true )

		//if( list instanceof Array ) Motor.changes( list, true )
		//else Motor.changeOne( list, true )

	}

	static update ( list ) {

		console.log('update is old')
		Motor.change( list )

		//if( list instanceof Array ) root.flow.tmp.push( ...list )
		//else root.flow.tmp.push( list )

	}

    static change ( o, direct = false ) {

    	if( direct ){
    		if( o instanceof Array ) Motor.changes( o, true )
    		else Motor.changeOne( o, true )
    	} else {
    		if( o instanceof Array ) root.flow.tmp.push( ...o )
    		else root.flow.tmp.push( o )
    	}

	}


	static changes ( r = [], direct = false ){ for( let o in r ) Motor.changeOne( r[o], direct ) }

	static changeOne ( o = {}, direct = false ){

		if( o.heightData ) return

		let b = Motor.byName( o.name );
		if( b === null ) return null;
		let type = b.type;

		if( o.drivePosition ){
			if( o.drivePosition.rot !== undefined ){  o.drivePosition.quat = math.toQuatArray( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }
		}
		if( o.rot !== undefined ){ o.quat = math.toQuatArray( o.rot ); delete ( o.rot ); }
		//if( o.rot1 !== undefined ){ o.quat1 = math.toQuatArray( o.rot1 ); delete ( o.rot1 ); }
		//if( o.rot2 !== undefined ){ o.quat2 = math.toQuatArray( o.rot2 ); delete ( o.rot2 ); }
		if( o.localRot !== undefined ){ o.quat = math.toLocalQuatArray( o.localRot, b ); delete ( o.localRot ); }

		switch( type ){

			case 'terrain': b = items.terrain.set( o, b ); direct = false; break;
			//case 'joint': b = items.joint.set( o, b ); break;
			case 'character': b = items.character.set( o, b ); break;
			case 'solid': b = items.solid.set( o, b ); break;
			case 'ray': b = items.ray.set( o, b ); direct = false; break;
			//case 'body': b = body.set( o, b ); break;

		}
		
		if( direct ){
			root.post( { m:'change', o:o })
		}

	}


	//-----------------------
	//  CAMERA CONTROLS
	//-----------------------

	static setCamera ( o = {} ){

		controls.moveCam( o )

	}

	static follow ( m = '', o = {} ){

		let mesh = null;

		if ( typeof m === 'string' || m instanceof String ) mesh = m === '' ? null : Motor.byName( m )
		else if ( m.isObject3D ) mesh = m

		//	console.log(m, mesh)

		if( mesh === null ) controls.resetFollow()
		else controls.startFollow( mesh, o )

	}


    //-----------------------
	// INTERN timout
	//-----------------------

	static setTimeout ( f, time ){

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
	// BREAK
	//-----------------------

	static addBreaker() {

		if( breaker !== null ) return;
		breaker = new Breaker();

	}

	//-----------------------
	// FROM POOL
	//-----------------------

	static load ( Urls, Callback, Path = '', msg = '' ){
		Pool.load( Urls, Callback, Path = '', msg = '' )
	}
	static applyMorph ( modelName, meshs = null, normal = true, relative = true ){
		Pool.applyMorph( modelName, meshs = null, normal = true, relative = true )
	}
	static uv2 ( model ){
		Pool.uv2( model )
	}

	static getMesh ( obj, keepMaterial ){
		return Pool.getMesh( obj, keepMaterial )
	}

	static getGroup ( obj, autoMesh, autoMaterial ){
		return Pool.getGroup( obj, autoMesh, autoMaterial )
	}

	static getMaterial ( name ){
		return Pool.getMaterial( name )
	}

	static getTexture ( name, o ){
		return Pool.getTexture( obj, autoMesh, autoMaterial )
	}

	static getScript ( name ){
		return Pool.getScript( name )
	}

	static get ( name, type ){
		return Pool.get( name, type )
	}

	static poolDispose (){
		return Pool.dispose()
	}

	static setDracoPath ( src ){
		return Pool.dracoPath = src
	}


	//-----------------------
	// PARTICLE
	//-----------------------

	static initParticle (){}
	static addParticle (){}
	static getParticle (){}

	//-----------------------
	// TEXT
	//-----------------------

	static addText ( o ){ 
		let t = new Textfield(o)

		if( o.parent ) o.parent.add( t )
		else root.scenePlus.add( t )
		textfields.push(t)
		return t
	}

	static clearText () { 

		let i = textfields.length
		while( i-- ) textfields[i].dispose()

		//for( let n in textfields ) textfields[n].dispose()
    	textfields = []
		
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
		this.type = 'solid'
	}
	step ( AR, N ) {}
}