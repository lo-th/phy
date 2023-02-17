
import {
    Group, MeshPhysicalMaterial, MeshBasicMaterial, Vector3
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

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*
*    THREE JS ENGINE
*/

let items
let currentContole = null
let callback = null
let Ar, ArPos = {}
let maxFps = 60
let worker = null
let isWorker = false
let isBuffer = false
let isTimeout = false
let outsideStep = true

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

let azimut = function(){ return 0 }
let endReset = function(){}
let postUpdate = function(){}
let extraTexture = function(){}
//let extraMaterial = function(){}

export class Motor {

	static setMaxFps ( v ) { maxFps = v }

	static setExtraTexture ( f ) { extraTexture = f }
	//static setExtraMaterial ( f ) { extraMaterial = f }

	static setExtraMaterial ( f ) { root.extraMaterial = f }

	static setPostUpdate ( f ) { postUpdate = f !== null ? f : function(){} }
	static setAzimut ( f ) { azimut = f }

	static getKey () { return user.key }
	static getKey2 () { return user.key2 }
	static getAzimut () { return azimut() }
	static math () { return math }

	static setContent ( Scene ) {

		Scene.add( root.scene )
		Scene.add( root.scenePlus )

	}

	static setControl ( Controls ) { 

		controls = Controls
		azimut = controls.getAzimuthalAngle

	}

	static message ( m ){

		let e = m.data;
		if( e.Ar ) Ar = e.Ar;
		if( e.reflow ){
			root.reflow = e.reflow
			if(root.reflow.stat.delta) elapsedTime += root.reflow.stat.delta
		}
		Motor[ e.m ]( e.o )

	}

	static post ( e, buffer ){

		if( isWorker ){ 

			if ( e.m === 'add' ){ 
				if( e.o.type === 'solver' ) worker.postMessage( e )// direct
				else if( e.o.solver !== undefined ) worker.postMessage( e )// direct
				else root.flow.add.push( e.o )// in temp 
			}
			else if ( e.m === 'remove' ) root.flow.remove.push( e.o )
			else worker.postMessage( e, buffer )

		} else {

			directMessage( { data : e } )

		}

	}

	static makeView () {

	}

	static getScene () { return root.scene; }

	//static getMat ( mode ) { return mat; }

	static getHideMat() { return Mat.get('hide'); }

	//static getMat ( mode ) { return mode === 'HIGH' ? mat : matLow; }

	static init ( o = {} ){

		let type = o.type || 'PHYSX';
		let name = type.toLowerCase()
		let mini = name.charAt(0).toUpperCase() + name.slice(1)
		let st = ''

		let isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

		root.engine = type

		Motor.initItems()

		items.body.extraConvex = mini === 'Physx'
		items.solid.extraConvex = mini === 'Physx'

		if( o.callback ){ 
			callback = o.callback
			delete ( o.callback )
		}

		/*Motor.initArray()
		o.ArPos = ArPos
		o.ArMax = ArMax*/

		root.scene = new Group()
		root.scene.name = 'phy_scene'
		root.scenePlus = new Group()
		root.scenePlus.name = 'phy_scenePlus'

		root.post = Motor.post
		root.up = Motor.up
		root.update = Motor.update

		root.add = Motor.add
		root.remove = Motor.remove

		if( !o.direct ){ // is worker version

			switch( type ){

				case 'OIMO':

				    if( isFirefox ) worker = new Worker( './build/'+mini+'.min.js' )
				    else {
				    	try {
					        worker = new Worker('./build/'+mini+'.module.js', {type:'module'})
						    st = 'ES6'
						} catch (error) {
						    worker = new Worker( './build/'+mini+'.js' )
						}
				    }

				break
				
				default :
				    if( type === 'RAPIER' ) { name = 'rapier3d'; mini = 'rapier3d'; }

				    // for wasm side
				    if( o.link ) o.blob = document.location.href.replace(/\/[^/]*$/,"/") + o.link;

					worker = new Worker( './build/'+mini+'.min.js' )

				break

			}

			worker.postMessage = worker.webkitPostMessage || worker.postMessage;
			worker.onmessage = Motor.message;

			let ab = new ArrayBuffer( 1 );
			worker.postMessage( { m: 'test', ab: ab }, [ ab ] );
			isBuffer = ab.byteLength ? false : true;

			o.isBuffer = isBuffer;
			console.log( st  + ' Worker '+ type + (o.isBuffer ? ' with Shared Buffer' : '') );

			isWorker = true;

		} else { // is direct version

			directMessage = o.direct;
			o.message = Motor.message;
			console.log( type + ' is direct' );

		}

		
		root.post({ m:'init', o:o });

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

		root.flow = { tmp:[], key:[], add:[], remove:[] }

	}

	static reset ( callback ){

		if( first ){
			first = false
			callback()
			return
		}

		Motor.cleartimout()

		currentContole = null

		if( controls ) controls.resetAll()

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
			
		root.tmpTex = []
	    root.scenePlus.children = []
	    root.scene.children = []

		root.post({ m:'reset' });

	}

	static resetCallback (){

		endReset()

	}

	static ready (){

		console.log( 'Motor is ready !!' )
		if( callback ) callback()

	}

	static start ( o = {} ){

		root.post({ m:'start', o:o })

	}

	static setTimeout ( b ){ isTimeout = b; }
	static getTimeout ( b ){ return isTimeout }

	static set ( o = {} ){

		if( o.full === undefined ) o.full = false

		items.body.setFull( o.full )

		Motor.initArray( o.full )
		o.ArPos = ArPos

		elapsedTime = 0

		o.outsideStep = outsideStep;
		o.isTimeout = isTimeout;
		if(!o.gravity) o.gravity = [0,-9.81,0]
		if(!o.substep) o.substep = 2

		if(o.fps){
			if( o.fps < 0 ) o.fps = maxFps;
		} else {
			o.fps = 60;
		}

		//console.log( o.fps );

		timer.setFramerate( o.fps )

		
		
		root.post({ m:'set', o:o });

	}

	static getFps (){ return root.reflow.stat.fps }
	
	static getDelta2(){ return root.reflow.stat.delta }
	static getElapsedTime2(){ return elapsedTime }
	
	static getDelta(){ return timer.delta }
	static getElapsedTime(){ return timer.elapsedTime }

	static doStep ( stamp ){

		if(!outsideStep) return

		if( timer.up( stamp ) ) {
			root.post( { m:'step', o:stamp } )
		}

		/*if( isBuffer ) root.post( { m:'poststep', flow:root.flow, Ar:Ar }, [ Ar.buffer ] )
		else root.post( { m:'poststep', flow:root.flow, Ar:Ar })
		Motor.flowReset()*/

	}

	static step ( o ){

		//console.time('step')

		root.delta = timer.delta;

		Motor.stepItems()

		// user key interaction 
		root.flow.key = user.update()
		//root.flow.tmp = []

		if( currentContole !== null ) currentContole.move( user.key, azimut() )

		postUpdate( root.reflow.stat.delta )
		//postUpdate( timer.delta )

		// for update static object !!! 
		//let i = root.flow.tmp.length;
		//while( i-- ) this.change( root.flow.tmp[i], true )
		Motor.changes( root.flow.tmp )

		//if( outsideStep ) return

		// finally post flow change to physx
		if( isBuffer ) root.post( { m:'poststep', flow:root.flow, Ar:Ar }, [ Ar.buffer ] )
		else root.post( { m:'poststep', flow:root.flow, Ar:Ar })

		Motor.flowReset()

	    //console.timeEnd('step')

	}

	

    static up ( list ) {

		if( list instanceof Array ) Motor.changes( list, true )
		else Motor.change( list, true )

	}

	static update ( list ) {

		if( list instanceof Array ) root.flow.tmp.push( ...list )
		else root.flow.tmp.push( list )

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

		let t = extraTexture( o )
		//root.tmpTex.push( t )
		return t
	}

	static material ( o = {} ){

		let m
		if( o.isMaterial ) m = o
		else m = new MeshPhysicalMaterial( o )


		if( mat[ m.name ] ) return null;

	    Mat.set( m );

		//mat[ m.name ] = m;
		//root.extraMaterial( m )

		return m;

	}

	static control ( name ){ // for character and vehicle

		if(currentContole!== null){
			if( name !== currentContole.name ) currentContole = Motor.byName( name )
		} else {
			currentContole = Motor.byName( name )
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
	    let pos = new Vector3().fromArray( position )
	    let dir = new Vector3()
	    let i = items.body.list.length, b, scaling

	    while( i-- ){

	        b = items.body.list[i]
	        dir.copy( b.position ).sub( pos )
	        scaling = 1.0 - dir.length() / radius
	        if ( scaling < 0 ) continue;
	        dir.setLength( scaling )
	        dir.multiplyScalar( force )

	        //r.push({ name:b.name, impulse: [ ...pos.toArray(), ...dir.toArray()] })
	        r.push({ name:b.name, linearImpulse: dir.toArray() })

	    }

		Motor.update( r )

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

		root.bodyRef = items.body
		root.characterRef = items.character

	}

	static resetItems() {

		for (const key in items) items[key].reset()

	}

	static stepItems () {

		for (const key in items) items[key].step( Ar, ArPos[key] )

		Motor.upInstance()

		// update follow camera
		/*if( controls ){ 
			if( controls.enableDamping && controls.enable ) controls.update()
			if( controls.follow ) controls.follow( Motor.getDelta() )
		}*/
	}

	static adds ( r = [] ){ for( let o in r ) Motor.add( r[o] ) }

	static add ( o = {} ){

		if ( o.constructor === Array ) return Motor.adds( o )

		if( o.mass !== undefined ) o.density = o.mass
		if( o.bounce !== undefined ) o.restitution = o.bounce
		if( o.type === undefined ) o.type = 'box'

		let type = getType( o );

		return items[type].add( o );

	}


	static removes ( r = [] ){ for( let o in r ) Motor.remove( r[o] ) }
	
	static remove ( name ){

		if ( name.constructor === Array ) return Motor.removes( name )

		let b = Motor.byName( name )
		if( b === null ) return;

		// remove on three side
		items[b.type].clear( b );
		// remove on physics side
		root.post( { m:'remove', o:{ name:name, type:b.type } })

	}


	static changes ( r = [], direct = false ){ for( let o in r ) Motor.change( r[o], direct ) }

	static change ( o = {}, direct = false ){

		if( o.heightData ) return

		//if ( o.constructor === Array ) return this.changes( o )

		let b = Motor.byName( o.name );
		if( b === null ) return null;
		let type = b.type;

		if( o.drivePosition ){
			if( o.drivePosition.rot !== undefined ){  o.drivePosition.quat = math.toQuatArray( o.drivePosition.rot ); delete ( o.drivePosition.rot ); }
		}
		if( o.rot !== undefined ){ o.quat = math.toQuatArray( o.rot ); delete ( o.rot ); }
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