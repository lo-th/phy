import * as THREE from '../build/three.module.js'

import * as UIL from './jsm/libs/uil.module.js'
import * as TWEEN from './jsm/libs/tween.esm.js'

import { OrbitControls } from './jsm/controls/OrbitControls.js'

import { Composer } from './jsm/lth/Composer.js'
import { Controller } from './jsm/lth/Controller.js'

import { Shader } from './jsm/lth/Shader.js'
import { Reflector } from './jsm/lth/Reflector.js'
import { Landscape } from './jsm/lth/Landscape.js'
import { Env } from './jsm/lth/Env.js'
import { Pool } from './jsm/lth/Pool.js'
import { math } from './jsm/lth/math.js'
import { hub } from './jsm/lth/hub.js'
import { Timer } from './jsm/lth/Timer.js'

import { Building } from './jsm/lth/Building.js'
import { Diamond } from './jsm/lth/Diamond.js'
import { Sparkle } from './jsm/lth/Sparkle.js'

import { Editor } from './editor/Editor.js'

import { Motor } from './motor/Motor.js'


let engineType, version, isWorker, introText
let engineList = [ 'OIMO','AMMO' ]

export class Main {

	static start ( option = {} ){

		let o = { ...option }

		engineType = o.type || 'OIMO'
		version = o.version || '1.2.2'

		isWorker = !o.direct

		introText = (isWorker ? 'WORKER ' : '') + engineType + ' ' + version 

		if( o.extra ) engineList.push('HIDE')

		o.callback = init
	    Motor.engine = engineType
		Motor.init( o )

	}

	static view ( o = {} ){

		if( o.envmap ){
			if( o.envmap !== options.envmap ){
				options.envmap = o.envmap
				envui.setValue( options.envmap )
				Env.load( './assets/textures/equirectangular/'+options.envmap+'.hdr' )
			}
		}

		ground.setSize( o.groundSize )
		ground.setAlphaMap( o.groundAlpha )
		ground.setOpacity( o.groundOpacity )

		ground.visible = o.ground

	}

	static injectCode ( cc ){
		//console.log('code is edit')
		inject(cc)
	}

	static getScene( ){ return scene }
	static getRenderer( ){ return renderer }
	static getControler( ){ return controls }

	static setLeft( x ){ size.left = x; onResize() }

	static getCode(){ return code }
	static getCodeName(){ return options.demo }
	
	static setCode( code ){ code = code }
	
	static getMouseDown(){ return mouseDown }

}


let dom, camera, controls, scene, renderer, composer, content, dragPlane, followGroup, hideMat, stats, txt, light, light2 = null, ground, envui;
let ray, mouse, oldMouse, isActveMouse = false, mouseDown = false, mouseMove = false, firstSelect = false, selected = null, rayTest = false, controlFirst = true;

let editor = null
let script = null
let code = ''
let isLoadCode = true


let needResize = true;
const Demos = [ 'start', 'basic', 'joint', 'capsule', 'compound', 'bridge', 'gears', 'raycast', 'terrain', 'character', 'car', 'collision', 'mesh', 'kinematic', 'add_remove' ]
const DemosA = [ 'diamond', 'ragdoll', 'chess', 'pinball', 'million', 'desk' ]

Demos.sort();
DemosA.sort();

const Envs = [ 'basic', 'factory', 'studio', 'beach', 'tomoco', 'tatami', 'box', 'park', 'color', 'room', 'tokyo', 'gallery', 'river', 'cave' ]

//const timer = new Timer(60)
const size = { w:0, h:0, r:0, left:0 }
const tm = { now:0, delta:0, then:0, inter: 1000/60, tmp:0, n:0, dt:0, fps:0 };

let g1, g2

//window.rand = Motor.rand


// import from pool
Motor.load = Pool.load;
Motor.getMesh = Pool.getMesh;
Motor.getGroup = Pool.getGroup;
Motor.getMap = Pool.getMap;
Motor.get = Pool.get;



Motor.log = hub.log;

Motor.view = Main.view;

window.phy = Motor
window.math = math
window.Main = Main

window.THREE = THREE

window.Building = Building
window.Diamond = Diamond
window.Sparkle = Sparkle
window.Landscape = Landscape

const setting = {

	envmap:'basic',
	groundSize:[ 200, 200 ],
	groundAlpha: true,
	groundOpacity:1,
	ground:true,

}

const options = {

	demo:'start',
	envmap:'basic',
	substep:1,
	fps:60,
	gravity:[0,-9.81,0],

	Exposure: 1.25,
	Shadow:0.5,//0.25,

	ShadowGamma:1,
	ShadowLuma: 0.75,//0,
    ShadowContrast: 2.5,//1,

}

function init() {

	content = Motor.getScene();

	mouse = new THREE.Vector2();
	oldMouse = new THREE.Vector2();
	ray = new THREE.Raycaster();

	size.w = window.innerWidth
	size.h = window.innerHeight
	size.r = size.w / size.h

	Shader.init( options )

	scene = new THREE.Scene()
	scene.background = new THREE.Color( 0x000000 );

	renderer = new THREE.WebGLRenderer( { antialias: true } )
	renderer.setPixelRatio( 1 )//window.devicePixelRatio
	renderer.setSize( size.w, size.h )
	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.toneMapping = THREE.ACESFilmicToneMapping
	renderer.physicallyCorrectLights = true
	renderer.toneMappingExposure = 0

	Shader.setGl2( renderer.capabilities.isWebGL2 );

	document.body.appendChild( renderer.domElement )
	dom = renderer.domElement;
	dom.style.position = 'absolute'

	followGroup = new THREE.Group()
	scene.add( followGroup )

	// LIGHT

	light = new THREE.DirectionalLight( 0xFFFFFF, 4 )
	light.position.set( 1, 8, 0 )
	light.distance = 20

	let s = light.shadow
	
	s.mapSize.setScalar( 2048 );
	s.camera.top = s.camera.right = 30
	s.camera.bottom = s.camera.left = - 30
	s.camera.near = 5
	s.camera.far = 40

	s.bias = -0.0001
	s.normalBias = 0.05;
	s.radius = 4

	//console.log(s.bias, s.radius)
	

	light.castShadow = true
	renderer.shadowMap.enabled = true
	//renderer.shadowMap.type = THREE.PCFSoftShadowMap
	//renderer.shadowMap.type = THREE.VSMShadowMap

	followGroup.add( light )
	followGroup.add( light.target )

	// debug light
	//scene.add( new THREE.CameraHelper( s.camera ) )


	// rectangle light
	/*RectAreaLightUniformsLib.init();
	light2 = new THREE.RectAreaLight( 0xff0000, 4, 30, 30 )
	light2.distance = 10
	light2.position.set( - 5, 5, 5 );
	scene.add( light2 );
	light2.lookAt( 0, 0, 0 )

	scene.add( new RectAreaLightHelper( light2 ) );*/

	// CAMERA / CONTROLER

	camera = new THREE.PerspectiveCamera( 50, size.r, 0.02, 1000 )
	camera.position.set( 0, 8, 10 )
	camera.lookAt( 0, 2, 0 )

	controls = new Controller( camera, renderer.domElement, followGroup )
	controls.target.y = 2
	controls.update()

	controls.addEventListener( 'end', function ( e ){ controlFirst = true; rayTest = true; } );
	controls.addEventListener( 'change',  function ( e ){
		let state = controls.getState();
		if( state !== -1 ){
			if( controlFirst ) controlFirst = false;
			else rayTest = false;
		}
	});

	scene.add( camera )


	// POST PROCESS

	composer = new Composer( renderer, scene, camera, controls, size );


	hideMat = new THREE.ShaderMaterial({ fragmentShader:'void main() {gl_FragColor = vec4( 0.0 );}', transparent:true, depthTest:false, depthWrite:false });

	window.addEventListener( 'resize', onResize )

	activeDragMouse( true )

	hub.init( camera, size, introText )

	editor = new Editor()

	Env.load( './assets/textures/equirectangular/'+options.envmap+'.hdr', next, renderer, scene, light, light2 )

}


function next () {
	
	let mat = Motor.getMat()

	// custom shadow for default motor material
	for( let m in mat ){ 
		//mat[m].metalness = 0.75
		//mat[m].roughness = 0.25
		Shader.add( mat[m] )
	}

	//let info = Env.getData()

	// add reflect ground
	ground = new Reflector({

    	textureSize: 2048,
        clipBias:0.003,
        encoding:true,
        reflect:0.8,
        //color:info.fog,
        round:true

    })
    
    scene.add( ground )
    //reflector.renderDepth = 1

    Motor.setContent( scene );
    Motor.setControl( controls );

    Motor.setExtraTexture( function(o){ return Pool.directTexture( o.url, o ) } );
    Motor.setExtraMaterial( function(m){ if( m ) Shader.add( m ) } );

    //Motor.setAzimut( controls.getAzimuthalAngle );

	//scene.add( Motor.getScene() )

	render()

	var hash = location.hash.substr( 1 )
    if( hash !== '' ) options.demo = hash

    initGUI()

    hub.endLoading()

	new TWEEN.Tween( { a:0 } ).to( { a:options.Exposure }, 3000 ).onUpdate(function(o){ renderer.toneMappingExposure = math.toFixed(o.a,3) }).easing( TWEEN.Easing.Quadratic.In ).start()

	//loadDemo( options.demo )

	Pool.load(['./assets/libs/esprima.hex'], testingScript )

}

function testingScript( name ){

	Pool.getCompactScript('esprima')
	loadDemo( options.demo )

}

function loadDemo( name ){

	if( DemosA.indexOf(name) !== -1 ) { g1.setValue(name); g1.reset() }
	else { g2.setValue(name); g2.reset() }

	unSelect()

	options.demo = name
	location.hash = name

	Pool.load( './demos/' + options.demo + '.js', inject )

}


function inject ( newCode ) {

	isLoadCode = !newCode;
	code = isLoadCode ? Pool.getScript( options.demo ) : newCode

	if(window['onReset']) window['onReset']()
	hub.log();

	phy.reset( refreshCode )

}

function refreshCode () {

	if( script !== null){ 
		document.body.removeChild( script )
		script = null;
	}
		
	script = document.createElement("script")
    script.language = "javascript"
    script.type = "text/javascript"
    script.id = "demo"
    script.innerHTML = '{' + code + '}'
    document.body.appendChild( script )

    if( isLoadCode ) editor.set( code, options.demo )
	
    if( code.search( 'phy.view' ) === -1 ) Main.view( setting )
    window['demo']()

}


////

function onResize() {

	size.w = window.innerWidth - size.left;
	size.h = window.innerHeight
	size.r = size.w / size.h
	needResize = true; 

}


function render ( stamp ) {

	requestAnimationFrame( render )

	tm.now = stamp;
	tm.delta = tm.now - tm.then;
	tm.dt = tm.delta * 0.001;


	if( needResize ){

		needResize = false
		dom.style.left = size.left + 'px'
		camera.aspect = size.r
		camera.updateProjectionMatrix()
		renderer.setSize( size.w, size.h )
		composer.resize( size )
		hub.update( size, '' )

	}

	//if( timer.up( stamp ) ){

		// update follow camera
		//controller.follow( root.delta );

		TWEEN.update()

		if( composer.enabled ) composer.render();
		else renderer.render( scene, camera )


		// three fps
		if ( tm.now - 1000 > tm.tmp ){ tm.tmp = tm.now; tm.fps = tm.n; tm.n = 0; }; tm.n++;

		hub.setFps( 'T: '+ tm.fps + ' | P: '+ Motor.getFps() )



		//hub.setFps( timer.fps )
	//}

}

function initGUI () {

	UIL.Tools.setStyle({

		background:'none',
		backgroundOver:'none',
		fontShadow:'#000000',

	})

	var ui = new UIL.Gui( { w:200, h:20, close:false, bottomText:['OPTIONS', 'CLOSE'] } )

	ui.add( 'empty', {h:6})

	ui.add('button', { name:'GITHUB / ABOUT', p:0, h:24 }).onChange( gotoGithub )

	ui.add( 'empty', {h:6})

	ui.add('selector', { values:engineList, selectable:true, p:0, h:24, value:engineType }).onChange( swapEngine )

	ui.add('bool', { name:'WORKER', h:20, value:isWorker }).onChange( function(b){ isWorker = b } )
	//ui.add('bool', { name:'TIMEOUT', h:20, value:Motor.getTimeout() }).onChange( function(b){ Motor.setTimeout( b ) } )

	//ui.add( 'empty', {h:6})
	ui.add( 'bool', { name:'SHOW CODE', onName:'HIDE CODE', h:24, mode:1 }).onChange( function(){ editor.show()} )
	ui.add( 'bool', { name:'PAUSE', onName:'RUN', h:24, mode:1 }).onChange( Motor.pause )
	ui.add( 'empty', {h:6})

	// DISPLAY

	let grV = ui.add('group', { name:'DISPLAY', h:30 })

	grV.add( options, 'Exposure', {min:0, max:4} ).onChange( function( v ){ renderer.toneMappingExposure = v } )

	grV.add( options, 'Shadow', {min:0, max:1} ).onChange( function(){ Shader.up( options ) } )

	envui = grV.add( 'list', { list:Envs, value:options.envmap, path:'assets/textures/equirectangular/mini/', format:'.jpg', imageSize: [128,64], h:64,  p:0}).onChange( setEnv )//.listen()

	grV.add( 'empty', {h:6})

	grV.add( composer, 'enabled', { type:'bool', rename:'POST PROCESS ON', onName:'POST PROCESS OFF', mode:1, h:30 })

	grV.add( composer.options, 'focus', {min:0, max:100} ).onChange( function(){ composer.update() } )
	grV.add( composer.options, 'aperture', {min:0, max:10} ).onChange( function(){ composer.update() } )
	grV.add( composer.options, 'maxblur', {min:0, max:10} ).onChange( function(){ composer.update() } )

	grV.add( composer.options, 'threshold', {min:0, max:1} ).onChange( function(){ composer.update() } )
	grV.add( composer.options, 'strength', {min:0, max:3} ).onChange( function(){ composer.update() } )
	grV.add( composer.options, 'bloomRadius', {min:0, max:1} ).onChange( function(){ composer.update() } )


	// DEMOS

	let grB = ui.add('group', { name:'BASIC', h:30 })
	g1 = grB.add( options, 'demo', { type:'grid', values:Demos, selectable:true, h:20 } ).onChange( loadDemo )
	grB.open()

	let grA = ui.add('group', { name:'ADVANCED', h:30 })
	g2 = grA.add( options, 'demo', { type:'grid', values:DemosA, selectable:true, h:20 } ).onChange( loadDemo )
	grA.open()

}

function gotoGithub ( ) {
	window.open( 'https://github.com/lo-th/phy', '_self' )
}

function swapEngine ( type ){

	let name = type.toLowerCase()
	let hash = location.hash
	let url = 'index'

	if( name!=='oimo' ) url=name
	if( !isWorker ) url+='_d'
	if(engineList.length>2) url+='ev'


	let w = window.open( url+'.html'+hash, '_self')
    
    //w.focus()

}

function setEnv ( name ){

	options.envmap = name
	Env.load( './assets/textures/equirectangular/'+options.envmap+'.hdr' )

}

// MOUSE RAY

function activeDragMouse ( b ) {

	if( b ){

		if( !isActveMouse ){
			dom.addEventListener( 'pointermove', mousemove, false )
	        dom.addEventListener( 'pointerdown', mousedown, false )
	        document.addEventListener( 'pointerup', mouseup, false )
	        isActveMouse = true
	        rayTest = true
	    }

	} else {

		if( isActveMouse ){
			dom.removeEventListener( 'pointermove', mousemove )
		    dom.removeEventListener( 'pointerdown', mousedown )
		    document.removeEventListener( 'pointerup', mouseup )
		    isActveMouse = false
		}

	}

}

function mousedown ( e ) {

	if( !mouseDown ){
		if( firstSelect ) firstSelect = false
		oldMouse.copy( mouse )
	}

    mouseDown = true
    castray()

}

function mouseup ( e ) {

	mouseMove = oldMouse.distanceTo( mouse ) < 0.01 ? false : true;
	mouseDown = false;
	unSelect();

}

function mousemove( e ) {

	mouse.x =   ( (e.clientX-size.left) / size.w ) * 2 - 1
	mouse.y = - ( e.clientY / size.h ) * 2 + 1
	castray();

}

function castray () {

	let inters, m, g, h, cursor = 'auto';

	if( selected !== null ){

		ray.setFromCamera( mouse, camera )
		inters = ray.intersectObject( dragPlane )
		if ( inters.length ) Motor.change({ name:'mouse', pos:inters[0].point.toArray() }, true );

	}

	if( !rayTest ) return;

	ray.setFromCamera( mouse, camera )
	inters = ray.intersectObjects( content.children, true )

	if ( inters.length > 0 ) {

		g = inters[ 0 ].object;

		if( g.parent !== content ){
			h = g.parent;
			if( h.parent !== content ) m = h.parent
			else m = h;
		} else m = g;

		if( m.type === 'body' ) cursor = select( m, inters[ 0 ].point )

	}

	document.body.style.cursor = cursor;

}

function select ( obj, pos ) {

	if( !mouseDown || selected === obj ) return 'pointer'
	
	selected = obj

	dragPlane = new THREE.Mesh( new THREE.PlaneBufferGeometry( 1, 1 ), hideMat )
    dragPlane.castShadow = false
    dragPlane.receiveShadow = false
    dragPlane.scale.set( 1, 1, 1 ).multiplyScalar( 200 )
    scene.add( dragPlane )

    dragPlane.rotation.set( 0, controls.getAzimuthalAngle(), 0 )
    dragPlane.position.copy( pos )

    let p = pos.toArray()

	//Motor.add({ name:'mouse', type:'sphere', size:[0.1], pos:p, mask:0 })
	Motor.add({ name:'mouse', type:'null', size:[0.1], pos:p })
	Motor.add({ 
		name:'mouseJoint', type:'joint', mode:'spherical',
		b1:selected.name, b2:'mouse', worldAnchor:p, sd:[4,1]
	})

	rayTest = false
	controls.enabled = false

	return 'move'

}

function unSelect () {

	if( selected === null ) return;

	scene.remove( dragPlane )
	Motor.remove('mouseJoint')
	Motor.remove('mouse')
	
	rayTest = true
	selected = null
	firstSelect = true
	controls.enabled = true

}