import * as THREE from 'three'
import * as TWEEN from 'tween'
import * as UIL from 'uil'
import './libs/webgl-memory.js'
import { getGPUTier } from './libs/detect-gpu.esm.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { Composer } from './3TH/Composer.js'

import { Controller } from './3TH/Controller.js'
import { Shader } from './3TH/Shader.js'
import { Pool } from './3TH/Pool.js'
import { Hub } from './3TH/Hub.js'
import { Gui } from './3TH/Gui.js'
import { Env } from './3TH/Env.js'
import { Editor } from './3TH/Editor.js'
// OBJECT
import { Reflector } from './3TH/objects/Reflector.js'
import { Landscape } from './3TH/objects/Landscape.js'
import { Planet } from './3TH/objects/Planet.js'
import { Building } from './3TH/objects/Building.js'
import { Sparkle } from './3TH/objects/Sparkle.js'
// MATERIAL
import { Diamond } from './3TH/materials/Diamond.js'
import { Fluid } from './3TH/materials/Fluid.js'

import { DirectionalHelper } from './3TH/helpers/DirectionalHelper.js'
// TEXTURE
//import { CarbonTexture } from './3TH/textures/CarbonTexture.js'

// MOTOR MAIN
import { Motor } from './motor/Motor.js'

// DRAW CALL ???
//import DrawCallInspector from './jsm/utils/DrawCallInspector.js'

// PARTICLE
import { Smoke } from '../build/smoke.module.js'


//import { SpiderRobot } from './3TH/utils/SpiderRobot.js'

/** __
*    _)_|_|_
*   __) |_| | 2023
*  @author lo.th / https://github.com/lo-th
* 
*  MAIN THREE.JS / PHY
*/

let drawCall = false
let fullStat = false
let debugLight = false

let oldPause = false;

let engineName, version, introText
let oldLeft = 0

let video = null

let childEditor = null
let isExternEditor = false
let particles = null


let maxFps = 60

const cam = {
	phy:38,
	theta:0,
	distance:12,
	fov:50,
	x:0,
	y:2,
	z:1,
	time:0
}

const setting = {

	envmap:'clear',//'basic',
	groundSize:[ 200, 200 ],
	groundAlpha: true,
	groundOpacity:1,
	ground:true,
	water:false,
	fog:false,

}

const options = {

	key: false,

	mode:'HIGH',
	quality: 2,

	demo:'start',
	envmap:'null', //'basic',
	substep:1,
	fps:60,
	gravity:[0,-9.81,0],

	tone:'ACESFilmic',
	exposure: 1,
	envPower: 1,

	light_1: 3,
	light_2: 1.5,

	show_light: false,
	show_stat: false,

	shadow:0.5,//0.25,
	shadowType:'PCSS',
	shadowGamma:1,//0.25,//1,
	shadowLuma:0.5, //0.75,//0,
    shadowContrast:2,//2.5,//1,

    reflect:0.8,
    renderMode:0,

    lightSizeUV:1.3,
    nearPlane:9.5,
    rings:11,
    nSample:17,

    composer:false,

}


let g1, g2, g3
let dom, camera, controls, scene, renderer, loop = null, composer = null, content, dragPlane, hideMat, followGroup, helperGroup, stats, txt, light, light2 = null, light3=null, ground = null, envui, dci;
let ray, mouse, oldMouse, isActveMouse = false, mouseDown = false, mouseDown2 = false, mouseMove = false, firstSelect = false, selected = null, rayTest = false, controlFirst = true;

let code = ''
let editor = null
let script = null
let isLoadCode = true
let needResize = true

//const timer = new Timer(60)
const size = { w:0, h:0, r:0, left:0 }
const tm = { now:0, delta:0, then:0, inter: 1000/60, tmp:0, n:0, dt:0, fps:0 }

const toneMappingOptions = {
	None: THREE.NoToneMapping,
	Linear: THREE.LinearToneMapping,
	Reinhard: THREE.ReinhardToneMapping,
	Cineon: THREE.CineonToneMapping,
	ACESFilmic: THREE.ACESFilmicToneMapping,
	Uncharted2: THREE.CustomToneMapping
}

const shadowMapType = {
	PCSS: THREE.BasicShadowMap,
	PCF: THREE.PCFShadowMap,
	PCFSoft: THREE.PCFSoftShadowMap,
	VSM: THREE.VSMShadowMap
}

const Version = {
    Oimo: '1.2.2',
    Ammo: '3.0',
    Physx: '5.01.03',
    Rapier: '0.10.0',
}

const LinkWasm = {
    Ammo:'build/ammo3.wasm.js',
    Physx:'build/physx-js-webidl.js',
}

let memo = null

//let isMobile = false

export const Main = {

	engineType:'',
	currentDemmo:'',
	isWorker:false,
	devMode:false,
	engineList: [ 'OIMO','AMMO', 'PHYSX'],
	demoList:[],
	isMobile:false,
	isEditor:false,

	start: async ( o = {} ) => {

		const gpuTier = await getGPUTier();
	    const perf = gpuTier
	    console.log(perf)

	    Main.isMobile = perf.isMobile

		if( Main.isMobile || perf.fps < 60 ){ 
			options.mode = 'LOW'
			options.quality = 1
		}

		switch(perf.tier){
			case 1: options.fps = 15; break
			case 2: options.fps = 30; break
			case 3: options.fps = 60; break
		}

		Main.engineType = o.type || 'PHYSX'

		Main.isWorker = false;//true;

		let urlParams = new URLSearchParams( window.location.search )
		if( urlParams.has('E') ){
			let eng = urlParams.get('E');
			Main.isWorker = eng.search('w_') !== -1;
			Main.devMode = eng.search('dev_') !== -1;
			Main.engineType = eng.substring( eng.lastIndexOf('_')+1 ).toUpperCase();
		}

		let n = Main.engineType.toLowerCase()
		engineName = n.charAt(0).toUpperCase() + n.slice(1)

		version = Version[ engineName ]

		o.link = LinkWasm[ engineName ]
		o.type = Main.engineType;
		o.callback = init

		introText = ( Main.isWorker ? 'WORKER ' : 'DIRECT ' ) + Main.engineType + ' ' + version;

		//options.show_stat = Main.devMode

		Motor.engine = Main.engineType
		window.engine = Motor.engine

		if( Main.isWorker ){
			Motor.init( o )
		} else {
			if( o.link ) Main.loadScript( o, engineName, preLoad );
			else preLoad( engineName, o )
		}
	
	},

	loadScript:( o, name, callback ) => {
	
	    let s = document.createElement("script")
	    s.src = o.link;
	    document.body.appendChild( s )
	    s.onload = () => { callback( name, o ) };

	},

	/*view: ( o = {} ) => {

		if( o.envmap ) setEnv( o.envmap, true )


		if( o.fog ) scene.fog = new THREE.FogExp2( Env.getFogColor().getHex(), 0.01 )
		else scene.fog = null

		// reflect floor
		if( o.ground ) addGround( o )
		else removeGround()

		if( isLoadCode ) controls.moveCam( {...cam, ...o })
		
	},*/

    setComposer:( b ) => { setComposer(b) },
    showDebugLight:( b ) => { showDebugLight(b) },
    showStatistic:( b ) => { showStatistic(b) },
    setShadow:( v ) => { setShadow(v) },
    upShader:() => { upShader() },

    getCode:() => ( code ),
	getScene:() => ( scene ),
	getRenderer:() => ( renderer ),
	getControler:() => ( controls ),
	getCodeName:() => ( options.demo ),
	getGround:() => ( ground ),
	//getWorker:() => ( 'Worker' + (Main.isWorker ? ' On' : ' Off') ),
	getDemos:() => { 
		let d = Pool.get('demos', 'json') 
		Main.demoList = [ ...d.Basic, ...d.Advanced, ...d[Main.engineType] ]
		//return Main.demoList
	},


	getOption:() => ( options ),
	getSetting:() => ( setting ),
	getComposer:() => ( composer ),
	getToneMappingOptions:() => ( toneMappingOptions ),

	setLeft:( x ) => { size.left = x; onResize() },
	setCode:( code ) => { code = code },
	getMouseDown:() => { return mouseDown },
	externEditor:() => { externEditor() },
	injectCode: ( cc ) => { inject(cc) },

	addParticle: ( o ) => { return addParticle( o ) },
	getParticle: ( name ) => { return getParticle( name ) },

	loadDemo: ( name ) => { loadDemo( name ) },
	extraCode: ( url, callback ) => { editor.loadExtra( url, callback ); },

	showEditor: ( b ) => { editor.show( b ) },
	changeMode: ( v ) => {
	    let low = options.mode === 'LOW'
	    setShadow( low ? 0 : 0.5 )
		setReflect( low ? 0 : 0.8 )
	},

}


// import from pool
Motor.load = Pool.load;
Motor.getMesh = Pool.getMesh;
Motor.getGroup = Pool.getGroup;
Motor.getMaterial = Pool.getMaterial;
Motor.getTexture = Pool.getTexture;
Motor.get = Pool.get;

Motor.applyMorph = Pool.applyMorph;
Motor.uv2 = Pool.uv2;

Motor.log = Hub.log;

Motor.addParticle = Main.addParticle
Motor.getParticle = Main.getParticle

Motor.extraCode = Main.extraCode;


window.phy = Motor
window.math = Motor.math()
window.Main = Main

window.THREE = THREE
window.hub = Hub
window.Landscape = Landscape
window.Planet = Planet
window.Building = Building
window.Sparkle = Sparkle

window.Diamond = Diamond
window.Fluid = Fluid

//window.SpiderRobot = SpiderRobot

async function preLoad( name, o ) {
	
    let M = await import( Main.devMode ? './'+name+'.js' : '../build/'+name+'.module.js');
    o.direct = M.engine.message;
    Motor.init( o )

}

const init = () => {

	

	// https://threejs.org/docs/#api/en/renderers/WebGLRenderer

	let powerPreference ='default'
	//let powerPreference ='high-performance'
	//let powerPreference ='low-power'// for mobile

	let pixelRatio = window.devicePixelRatio
	let antialias = pixelRatio > 1 ? false : true
	if( pixelRatio > 2 ) pixelRatio = 2

	content = Motor.getScene()

	mouse = new THREE.Vector2()
	oldMouse = new THREE.Vector2()
	ray = new THREE.Raycaster()
	ray.far = 1000;

	size.w = window.innerWidth
	size.h = window.innerHeight
	size.r = size.w / size.h

	// RENDERER

	renderer = new THREE.WebGLRenderer( { 
		antialias:antialias, 
		powerPreference:powerPreference,
		premultipliedAlpha: false,
		stencil: false,
		alpha: false,
	})
	renderer.setPixelRatio( pixelRatio )
	renderer.setSize( size.w, size.h )

	renderer.outputEncoding = THREE.sRGBEncoding
	renderer.toneMapping = toneMappingOptions[options.tone]
	renderer.toneMappingExposure = options.exposure
	renderer.useLegacyLights = false
	//renderer.physicallyCorrectLights = true

	// DOM
    document.body.appendChild( renderer.domElement )
	dom = renderer.domElement;
	dom.style.position = 'absolute'

	// SHADER

	Shader.setGl2( renderer.capabilities.isWebGL2 )
	Shader.init( options )

	// SCENE

	scene = new THREE.Scene()
	renderer.setClearColor ( new THREE.Color( 0x272822 ) ) 
	//scene.background = new THREE.Color( 0x272822 )

	// GROUP

	followGroup = new THREE.Group()
	followGroup.name = 'followGroup'
	scene.add( followGroup )

	helperGroup = new THREE.Group()
	helperGroup.name = 'helperGroup'
	scene.add( helperGroup )

	scene.helper = helperGroup

	addLight()

	// CAMERA / CONTROLER

	camera = new THREE.PerspectiveCamera( 50, size.r, 0.1, 1000 )
	camera.position.set( 0, 8, 10 )
	camera.lookAt( 0, 2, 0 )
	scene.add( camera )

	controls = new Controller( camera, renderer.domElement, followGroup )
	controls.target.y = 2
	controls.minDistance = 1
    controls.maxDistance = 100
    controls.enableDamping = true // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.25//25//0.25;
    controls.screenSpacePanning = true
    //controls.enable = false
    //controls.maxPolarAngle = Math.PI / 2
	controls.update()

	controls.addEventListener( 'end', function ( e ){ controlFirst = true; rayTest = true; } );
	controls.addEventListener( 'change',  function ( e ){
		let state = controls.getState();
		if( state !== -1 ){
			if( controlFirst ) controlFirst = false;
			else rayTest = false;
		}
	})

	
	// avoid track run in background
	document.addEventListener( 'visibilitychange', onVisible )

	window.addEventListener( 'resize', onResize )
	document.body.addEventListener( 'dragover', function(e){ e.preventDefault() }, false );
    document.body.addEventListener( 'dragend', function(e){ e.preventDefault() }, false );
    document.body.addEventListener( 'dragleave', function(e){ e.preventDefault()}, false );
	document.body.addEventListener( 'drop', drop, false );

	activeDragMouse( true )

	Hub.init( camera, size, introText )

	editor = new Editor()

	Env.init( renderer, scene, light, light2, light3 )

	start()

	Pool.load( 'demos.json', next )

}

const drop = (e) => {

	e.preventDefault();
	const file = e.dataTransfer.files[0]
    const reader = new FileReader();
    const name = file.name;
    const type = name.substring(name.lastIndexOf('.')+1, name.length )
    const finalName = name.substring( name.lastIndexOf('/')+1, name.lastIndexOf('.') )

    //console.log(type, name)

    switch(type){
    	case 'js': reader.readAsText( file ); break;
    	case 'fbx': case 'glb':  reader.readAsArrayBuffer( file ); break;
    	case 'hdr' : 
    	options.envmap = finalName
    	Env.load( ( window.URL || window.webkitURL ).createObjectURL( file )); 
    	break;
    }

    reader.onload = function ( e ) {

    	switch(type){
	    	case 'js': directDemo( finalName, e.target.result ); break;
	    	
	    }
    }

}

const next = () => {

	Main.getDemos()

	// add carbon texture
	
	/*const flakeTexture = new THREE.CanvasTexture( new CarbonTexture('rgb(69,69,69)', 'rgb(39,39,39)', true) )
	flakeTexture.wrapS = flakeTexture.wrapT = THREE.RepeatWrapping
	flakeTexture.repeat.x = flakeTexture.repeat.y = 2

	const carbonTexture = new THREE.CanvasTexture( new CarbonTexture('#ffffff', '#CCCCCC') )
	carbonTexture.wrapS = carbonTexture.wrapT = THREE.RepeatWrapping
	carbonTexture.repeat.x = carbonTexture.repeat.y = 2
	
	

	let carbonList = ['body', 'sleep', 'solid', 'hero', 'skin' ]

	// custom shadow for default motor material
	let mat = Motor.getMat()
	for( let m in mat ){ 
		if( carbonList.indexOf(m) !== -1 ){
			mat[m].normalMap = flakeTexture
			mat[m].map = carbonTexture
		}
		Shader.add( mat[m] )
	}*/

	hideMat = Motor.getHideMat()

    Motor.setContent( scene )
    Motor.setControl( controls )
    Motor.setExtraTexture( Pool.texture )
    Motor.setExtraMaterial( Shader.add )
    Motor.setAddControl( addControl )




	let hash = location.hash.substr( 1 )
    if( hash !== '' ) options.demo = hash

    Hub.endLoading()

    Gui.init()

    //initGUI()
	/*new TWEEN.Tween( { a:0 } )
	.to( { a:options.exposure }, 3000 )
	.onUpdate(function(o){ renderer.toneMappingExposure = math.toFixed(o.a,3) })
	.easing( TWEEN.Easing.Quadratic.In )
	.start()*/


	loadDemo( options.demo )

	//if( options.show_stat ) showStatistic( true )

}

const start = () => {
	if( loop === null ) render(0)
}

const upExpose = () => {
	if( renderer.toneMappingExposure < options.exposure ) renderer.toneMappingExposure+=0.001
}

const addControl = () => {
	if(Main.isMobile) Hub.addJoystick()
}

//--------------------
//   LIGHT
//--------------------

const addLight = () => {

	let s 

	light3 = new THREE.DirectionalLight( 0xFFFFFF,  options.light_1*0.7  )
	//light.position.set( 5, 18, 5 )
	light3.distance = 5

	s = light3.shadow
	s.mapSize.setScalar( 1024 * options.quality )

	s.camera.top = s.camera.right = 4//20
	s.camera.bottom = s.camera.left = -4
	s.camera.near = 1//5
	s.camera.far = 9//33

	s.bias = -0.0005
	s.radius = 4//2
	s.blurSamples = 8 // only for VSM !


	light3.castShadow = options.shadow !== 0 

	followGroup.add( light3 )
	followGroup.add( light3.target )

	/////

	light = new THREE.DirectionalLight( 0xFFFFFF, options.light_1*0.3 )
	//light.position.set( 5, 18, 5 )
	light.distance = 20//20

	s = light.shadow
	s.mapSize.setScalar( 1024 * options.quality )

	s.camera.top = s.camera.right = 20//20
	s.camera.bottom = s.camera.left = -20
	s.camera.near = 5//5
	s.camera.far = 33//33

	s.bias = -0.005
	//s.normalBias = 0.0075//0.05
	s.radius = 2
	//s.blurSamples = 8 // only for VSM !


	if( options.mode === 'LOW' ){
		options.shadow = 0
		options.reflect = 0
	}

	light.castShadow = options.shadow !== 0 
	renderer.shadowMap.enabled = options.shadow !== 0 
	renderer.shadowMap.type = shadowMapType[options.shadowType]

	followGroup.add( light )
	followGroup.add( light.target )

	// light 2

	light2 = new THREE.HemisphereLight( 0xFFFFFF, 0x808080, options.light_2 );
	light2.position.set( 0, 5, 0 );
	followGroup.add( light2 );


	////

}

const clearLight = ( o ) => {
	//if(!light) return
 
	followGroup.remove( light )
	followGroup.remove( light.target )
	

	followGroup.remove( light2 );

	light.shadow.dispose()
	light.shadow.map.texture.dispose()
	light.shadow.map.texture = null;
	light.shadow.map.dispose()
	light.shadow.map = null;

	light = null

	if(light3){
		light3.shadow.dispose()
		light3.shadow.map.texture.dispose()
		light3.shadow.map.texture = null;
		light3.shadow.map.dispose()
		light3.shadow.map = null;

		light3 = null
	}

	

	//light.shadow = new THREE.DirectionalLightShadow();
	//light.shadow.mapSize.setScalar( 1024 * options.quality )


}

const resetLight = ( o ) => {

	//renderer.shadowMap.autoUpdate = false;
	//console.log(renderer.shadowMap)

	/*clearLight()
	addLight()

	renderer.shadowMap.autoUpdate = true;*/

	/*if(options.shadow) */
	

	light.position.set( 0.27, 1, 0.5 ).multiplyScalar(18)
	light.target.position.set( 0, 0, 0 )
	light.color.setHex( 0xFFFFFF );

	if(light3){
		light3.position.set( 0.27, 1, 0.5 ).multiplyScalar(5)
		light3.target.position.set( 0, 0, 0 )
		light3.color.setHex( 0xFFFFFF );
	}


	light2.color.setHex( 0xFFFFFF );
	light2.groundColor.setHex( 0x808080 );

}



// 

	
//--------------------
//   GROUND
//--------------------

const addGround = ( o ) => {

	

	if( ground === null ){

		// add reflect ground
		ground = new Reflector({

	    	textureSize: 1024 * options.quality,
	        clipBias:0.003,
	        encoding:true,
	        reflect: options.reflect,
	        water:o.water,
	        //color:0x6a8397,
	        round:true,
	        normal:true

	    })
	}

    ground.setSize( o.groundSize )
	ground.setAlphaMap( o.groundAlpha )
	ground.setOpacity( o.groundOpacity )
	ground.setWater( o.water )
    scene.add( ground )

}

const removeGround = () => {

	if( ground === null ) return

	//scene.remove( ground )
	ground.dispose()
	//ground.geometry.dispose()
    //ground.material.dispose()
    ground = null

}

const dispose = () => {
	if(loop === null) return
	//Env.dispose()
    renderer.dispose()
	renderer.renderLists.dispose()
	cancelAnimationFrame( loop )
	loop = null
	
}


//--------------------
//
//   CODE SIDE
//
//--------------------

const directDemo = ( name, result ) => {

	let findDemo = Gui.resetDemoGroup( name )

	unSelect()

	Main.currentDemo = name;
	options.demo = name
	location.hash = name

	Hub.upMenu()

	inject( result, true )

}

const loadDemo = ( name ) => {

	if( Main.demoList.indexOf(name) === -1 ) name = 'start'

	//let findDemo = Gui.resetDemoGroup( name )
	//if(!findDemo) name = 'start'

	unSelect()
    
    Main.currentDemo = name;
	options.demo = name
	location.hash = name

	Hub.upMenu()

	Pool.load( './demos/' + options.demo + '.js', inject )

}

const inject = ( newCode, force = false ) => {

	isLoadCode = !newCode
	code = isLoadCode ? Pool.getScript( options.demo ) : newCode

	if( force ) isLoadCode = true

	if(window['onReset']){ 
		window['onReset']()
		window['onReset'] = null
	}

	//Hub.log()
	Hub.reset()
	Shader.reset()
	editor.reset()
	//resetLight()

	if( particles ) particles.dispose()
	
	
	if( isLoadCode ){
		//console.log('is full reset !!!')
		//Shader.reset()
	    resetLight() 
		Pool.dispose();
	}

	phy.reset( refreshCode )

}

const refreshCode = () => {

	if( script !== null){ 
		script.remove()
		script = null;
	}
		
	script = document.createElement("script")
    script.language = "javascript"
    script.type = "text/javascript"
    script.id = "demo"
    script.async = false;//true;
    script.innerHTML = '{' + code + '}'
    document.body.appendChild( script )

    if( isLoadCode ) changeEditorCode()

    let ev = code.search( 'phy.view' )
    let evh = code.search( '//phy.view' )
	
    if( ev === -1 || evh !== -1 ) view( setting )
    /*else {

    	let t = code.substring(ev+10, code.indexOf('})'))
    	//let f = JSON.parse('{'+t+'}');
    	console.log( t )
    }*/
    if( code.search( 'phy.set' ) === -1 ) Motor.set()

    window['demo']()

}

const changeEditorCode = () => {

	if( isExternEditor ) send({ type:'set', code:code, name:options.demo })
    else editor.set( code, options.demo )

}

//--------------------
//   STOP ENGINE
//--------------------

const onVisible = () => {

	if( document.hidden ) {
		oldPause = Motor.getPause()
		Motor.pause( true )
	}
	else Motor.pause( oldPause )

}


//--------------------
//   RESIZE
//--------------------

const onResize = () => {

	size.w = window.innerWidth - size.left
	size.h = window.innerHeight
	size.r = size.w / size.h

	needResize = true

}

const doResize = () => {

	//if( !needResize ) return
	dom.style.left = size.left + 'px'
	camera.aspect = size.r
	camera.updateProjectionMatrix()
	renderer.setSize( size.w, size.h )
	if(composer) composer.resize( size )
	if(particles) particles.onresize( size.h )
	Hub.resize( size )
	needResize = false

}



//--------------------
//   RENDER
//--------------------

const render = ( stamp = 0 ) => {

	loop = requestAnimationFrame( render )

	// TIME
	tm.now = stamp
	tm.delta = tm.now - tm.then
	tm.dt = tm.delta * 0.001

	if( needResize ) doResize()

    // UPDATE PARTICLE
    if( particles ) particles.update( stamp )

	// UPDATE PHY
	Motor.doStep( stamp )

	// UPDATE CAMERA
	if( controls ){ 
		if( controls.enableDamping && controls.enable ) controls.update()
		if( controls.follow ) controls.follow( tm.dt )
	}

    // UPDATE TWEEN
	TWEEN.update( stamp );

	// RENDER
	if( composer && composer.enabled ) composer.render( tm.dt )
	else renderer.render( scene, camera )

	Gui.update()

	upStat()

}

const upStat = () => {

	// three fps
	if ( tm.now - 1000 > tm.tmp ){ 
		tm.tmp = tm.now; 
		tm.fps = tm.n; 
		tm.n = 0; 
	}

	tm.n++
	tm.then = tm.now

	if( tm.fps > maxFps ) {
		maxFps = tm.fps
		Motor.setMaxFps( maxFps )
	}

	//Hub.setFps( 'T:' + tm.fps + ' | P:' + Motor.getFps() )
	Hub.setFps(  tm.fps + ' | ' + Motor.getFps() )
	getFullStats()

}

//--------------------
//   GUI FUCTION
//--------------------

//const gotoGithub = () => { window.open( 'https://github.com/lo-th/phy', '_blank' ) }
const upShader = () => { Shader.up( options ) }

const showGround = ( v ) => {

	setting.ground = v

	if(!ground) return
	ground.visible = setting.ground;

}

const setReflect = ( v ) => {

	options.reflect = v

	if(!ground) return
	ground.setReflect( options.reflect )

}

const setShadow = ( v ) => {

	options.shadow = v

	if( options.shadow === 0 ){
		light.castShadow = false
		renderer.shadowMap.enabled = false
	} else {
		if( !renderer.shadowMap.enabled ){
			light.castShadow = true
			renderer.shadowMap.enabled = true
		}
	}

	if( light.shadowHelper ) light.shadowHelper.visible = options.shadow !== 0

	Main.upShader()

}


function firstFunction() {
      return new Promise((resolve, reject) => {
          let y = 0
          setTimeout(() => {
            for (let i=0; i<10; i++) {
               y++
            }
             console.log('Loop completed.')  
             resolve(y)
          }, 2000)
      })
    }
//async 
const view = ( o = {} ) => {

	//console.log(o)

	o = { ...setting, ...o }

	//console.log('view', o)

	//const result = await firstFunction()

	if( o.envmap ) setEnv( o.envmap, true )


	if( o.fog ) scene.fog = new THREE.FogExp2( Env.getFogColor().getHex(), o.fogDist || 0.01 )
	else scene.fog = null

	// reflect floor
	if( o.ground  ) addGround( o )
	else removeGround()

	if( isLoadCode ) controls.moveCam( {...cam, ...o })
	
}

Motor.view = view;

//async function setEnv( name, chageUI ) {
const setEnv = ( name, chageUI ) => {

	if( name !== options.envmap ){

		if ( !isNaN(name) ) options.envmap = 'null'
		else options.envmap = name

		Env.set( name )

		if( envui && chageUI ) envui.setValue( options.envmap )
		
	} else {
		//console.log( 'is same')
	}


	//options.envmap = name
	//Env.load( './assets/textures/equirectangular/'+options.envmap+'.hdr' )

}

//--------------------
//   EXTERN EDITOR
//--------------------

const externEditor = () => {

	if( !childEditor ){
		let hash = location.hash
		oldLeft = size.left || 500
		isExternEditor = true
		childEditor = window.open('editor.html'+hash, 'Editor', 'height='+size.h+', width='+oldLeft);
	    window.addEventListener( 'message', message, false )

	    //window.open('/pageaddress.html','winname','directories=no,titlebar=no,status=no,menubar=no,scrollbars=no,resizable=no,width=400,height=350');

	    childEditor.onload = () => {
	    	send( { type : 'connect' } ) 
	    	editor.close()
	    	size.left = 0
	    	onResize()
	    }

	} 

	/*if( isExternEditor ){
		isExternEditor = false; 
		size.left = oldLeft
		send( { type : 'close' } )
	}*/

	

}

const message = ( e ) => {

	switch( e.data.type ){

		case 'connect' :

            console.log('connect') 

        break;

        case 'inject' :

           inject( e.data.code )

        break;

        case 'close' :
           //console.log('close') 
           send( { type : 'close' } )
           window.removeEventListener( 'message', message, false )
           childEditor = null
           isExternEditor = false; 
           editor.open()
		   size.left = oldLeft
        break;

	}

}

const send = ( data ) => {

	if( childEditor ) childEditor.postMessage( data,'*' )

}


//--------------------
//   MOUSE / RAY
//--------------------

const activeDragMouse = ( b ) => {

	let dd = dom

	if( b ){
		if( !isActveMouse ){
			dd.addEventListener( 'pointermove', mousemove, false )
	        dd.addEventListener( 'pointerdown', mousedown, false )
	        document.addEventListener( 'pointerup', mouseup, false )
	        isActveMouse = true
	        rayTest = true
	    }

	} else {
		if( isActveMouse ){
			dd.removeEventListener( 'pointermove', mousemove )
		    dd.removeEventListener( 'pointerdown', mousedown )
		    document.removeEventListener( 'pointerup', mouseup )
		    isActveMouse = false
		}
	}
}

const mousedown = ( e ) => {

	
	let button = 0

	if( !mouseDown ){
		if( firstSelect ) firstSelect = false
		oldMouse.copy( mouse )
	}

	if ( e.pointerType !== 'touch' ) button = e.button

    if( button === 0 ){
	    mouseDown = true
	    castray()
	}

	if( button === 2 ){
	    mouseDown2 = true
	    castray()
	}

}

const mouseup = ( e ) => {

	mouseMove = oldMouse.distanceTo( mouse ) < 0.01 ? false : true
	mouseDown = false
	mouseDown2 = false
	unSelect();

}

const mousemove = ( e ) => {

	mouse.x =   ( ( e.clientX - size.left ) / size.w ) * 2 - 1
	mouse.y = - ( e.clientY / size.h ) * 2 + 1
	castray();

}

const castray = () => {

	let inters, m, g, h, id, cursor = 'auto';

	if( selected !== null ){

		ray.setFromCamera( mouse, camera )
		inters = ray.intersectObject( dragPlane )
		if ( inters.length ) Motor.change({ name:'mouse', pos:inters[0].point.toArray() }, true )

	}

	if( !rayTest ) return;

	ray.setFromCamera( mouse, camera )
	inters = ray.intersectObjects( content.children, true)

	if ( inters.length > 0 ) {

		g = inters[ 0 ].object;
		id = inters[ 0 ].instanceId;

		///console.log(inters[ 0 ])

		if( id !== undefined ){
			m = Motor.byName( g.name+id )
		} else {
			if( g.parent !== content ){
				h = g.parent;
				if( h.parent !== content ) m = h.parent
				else m = h;
			} else m = g;
		}

		if(mouseDown2){
			if(m.extra) m.extra( m.name )
			//console.log(m)
		}

		cursor = select( m, inters[ 0 ] )

	}

	document.body.style.cursor = cursor

}

const select = ( obj, inters ) => {

	if( !mouseDown || selected === obj ) return 'pointer'

	let pos = inters.point
    let quat = [0,0,0,1]
	
	selected = obj
	if( selected.isInstance ) quat = selected.instance.getInfo(selected.id).quat;
	else if( selected.isObject3D ){
		selected.updateMatrix()
		quat = selected.quaternion.toArray()
	}

	dragPlane = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), hideMat )
    dragPlane.castShadow = false
    dragPlane.receiveShadow = false
    dragPlane.scale.set( 1, 1, 1 ).multiplyScalar( 200 )
    scene.add( dragPlane )

    dragPlane.rotation.set( 0, controls.getAzimuthalAngle(), 0 )
    dragPlane.position.copy( pos )

    let p = pos.toArray()

	//Motor.add({ name:'mouse', type:'sphere', size:[0.01], pos:p, quat:quat, mask:0, density:0, noGravity:true, kinematic:true, flags:'noCollision' })
	Motor.add({ name:'mouse', type:'null', pos:p, quat:quat })
	Motor.add({ 
		name:'mouseJoint', type:'joint', mode:'fixe',//mode:'spherical',
		b1:selected.name, b2:'mouse', worldAnchor:p, //sd:[4,1]
		//tolerance:[1, 10],
		//noPreProcess:true,
		//improveSlerp:true,
		noFix:true,
	})
	Motor.up({ name:selected.name, neverSleep:true })

	rayTest = false
	controls.enabled = false

	return 'move'

}

const unSelect = () => {

	if( selected === null ) return;

	dragPlane.geometry.dispose()
	//dragPlane.material.dispose()
	scene.remove( dragPlane )
	Motor.remove('mouseJoint')
	Motor.remove('mouse')
	Motor.up({ name:selected.name, neverSleep:false, wake:true })
	
	rayTest = true
	selected = null
	firstSelect = true
	controls.enabled = true

}


//--------------------
//   OPTION
//--------------------

const setEnvmapIntensity = ( v ) => {

	let g = Motor.getScene()
	g.traverse( function ( node ) {
		if( node.isMesh ) node.material.envMapIntensity = v
	})
	ground.material.envMapIntensity = v

}

const showStatistic = ( b ) => {

	if( b && !fullStat ){

		memo = renderer.getContext().getExtension('GMAN_webgl_memory')
		fullStat = true

	}

	if( !b && fullStat ){

		fullStat = false
		memo = null
		Hub.setStats()
		
	}

}

const showDebugLight = ( b ) => {

	if( b && !debugLight ){

		light.helper = new DirectionalHelper( light )
		light.shadowHelper = new THREE.CameraHelper( light.shadow.camera )
		light.shadowHelper.setColors( light.color, new THREE.Color( 0x222222 ), new THREE.Color( 0x222222 ), light.color, new THREE.Color( 0x666666) )
		light2.helper = new THREE.HemisphereLightHelper( light2, 0.5 )
		light2.helper.material.wireframe = false
		helperGroup.add( light.helper )
		helperGroup.add( light2.helper )

		if(light3){
			light3.helper = new DirectionalHelper( light3 )
		    light3.shadowHelper = new THREE.CameraHelper( light3.shadow.camera )
		    light3.shadowHelper.setColors( light3.color, new THREE.Color( 0x222222 ), new THREE.Color( 0x222222 ), light3.color, new THREE.Color( 0x666666) )
		    light3.shadowHelper.visible = options.shadow !== 0
		    helperGroup.add( light3.helper )
		}

		helperGroup.add( light.shadowHelper )
		light.shadowHelper.visible = options.shadow !== 0

		debugLight = true;
	}

	if( !b && debugLight ){
		helperGroup.remove( light.helper )
		helperGroup.remove( light2.helper )
		if(light3)helperGroup.remove( light3.helper )
		helperGroup.remove( light.shadowHelper )
		debugLight = false
	}

	Env.preview( debugLight )

}

const getFullStats = () => {

    if ( !fullStat ) return

    const info = memo.getMemoryInfo()
    
    
    const eng = renderer.info

    info['engine'] = {

    	geometries : eng.memory.geometries,
		textures : eng.memory.textures,

	    calls : eng.render.calls,
		triangles : eng.render.triangles,
		points : eng.render.points,
		lines : eng.render.lines,
		//frame : eng.render.frame,

    }

    Hub.setStats( info )
    
}


//--------------------
//   POST PROCESS
//--------------------

const setComposer = ( b ) => {

	if(options.composer){
		if( composer === null ) composer = new Composer( renderer, scene, camera, controls, size )
		composer.enabled = true

	} else {
		if( composer ){
			composer.dispose()
			composer = null
		} 
	}

	//Gui.postprocess()

}


//--------------------
//  PARTICLE
//--------------------

const addParticle = ( o ) => {

   if( !particles ) particles = new Smoke( scene, renderer );
   return particles.add( o )

}

const getParticle = ( name ) => {
	
	if( !particles ) particles = new Smoke( scene, renderer );
   return particles.get( name )

}
