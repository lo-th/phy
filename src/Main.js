import * as THREE from 'three'
import * as TWEEN from 'tween'
import * as UIL from './libs/uil.module.js'

//import './libs/webgl-memory.js'
import { Stats } from './Stats.js';
import { getGPUTier } from './libs/detect-gpu.esm.js';

//import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Controller } from './3TH/Controller.js'

import { Hub } from './3TH/Hub.js'
import { Gui } from './3TH/Gui.js'
import { Lights } from './3TH/Lights.js'
import { Shader } from './3TH/Shader.js'
import { Editor } from './3TH/Editor.js'

import { Env } from './3TH/Env.js'

//import { Composer } from './3TH/Composer.js'
import { Composer } from './3TH/Composer_test.js'

// OBJECT
import { Vignette } from './3TH/objects/Vignette.js'
import { Reflector } from './3TH/objects/Reflector.js'
import { Building } from './3TH/objects/Building.js'
import { Sparkle } from './3TH/objects/Sparkle.js'
import { Planet } from './3TH/objects/Planet.js'

// MATERIAL
import { Diamond } from './3TH/materials/Diamond.js'
import { Fluid } from './3TH/materials/Fluid.js'

import { DirectionalHelper } from './3TH/helpers/DirectionalHelper.js'

// MOTOR MAIN
import { Motor } from './motor/Motor.js'

// PARTICLE
//import { Smoke } from '../build/smoke.module.js'
import { Smoke } from './libs/smoke.module.js'

// WEBGPU test
//import WebGPU from './jsm/capabilities/WebGPU.js';
//import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';


/** __
*    _)_|_|_
*   __) |_| | 2024
*  @author lo.th / https://github.com/lo-th
* 
*  MAIN THREE.JS / PHY
*/


let highShadow = false;

let activeWebGPU = false;
let isWebGPU = false;
let lockPixelRatio = true;

//let drawCall = false
//let debugLight = false

let oldPause = false

let engineName, version, introText
let oldLeft = 0

let video = null

let childEditor = null
let isExternEditor = false
let particles = null

let stats = null;
let maxFps = 60;

let groundColor = 0x808080
let groundAutoColor = true;

const CameraBase = {
	
	theta:0,
	phi:12,
	distance:12,
	fov:50,
	x:0,
	y:2,
	z:0,
	time:0
}




// default config
const setting = {

	//exposure: 1,
	envmap:'clear',//'basic',
	
	groundSize:[ 60, 60 ],
	groundPos:[ 0, 0, 0 ],
	groundAlpha: true,
	groundOpacity:1,
	groundReflect:0.1,
	ground:true,
	water:false,
	fog:false,
	vignette:true,
	shadow:0.75,

	exposure: 0.68,//1,
	direct:3.14,
	spherical: 1,
	envIntensity:1.3,
	bgIntensity:1,
	shadowIntensity:1,

}


const options = {

	renderMode: 'color',

	debug: false,
	day: true,
	key: false,

	mode:'HIGH',
	quality: 2,

	demo:'start',
	envmap:'null', //'basic',
	substep:1,
	fps:60,
	gravity:[0,-9.81,0],

	tone:'ACESFilmic',

	exposure: 0.68,//1,,
	direct:3.14,
	spherical: 1,
	envIntensity:1.3,
	bgIntensity:1,

	//envPower:1,//1
	envBlur:0,
	legacy:false,

	//light_1: 3.14,
	//light_2: 1,

	show_light: false,
	show_stat: false,

	shadow:0.5,//0.25,
	shadowType: highShadow ? 'PCSS':'PCFSoft',
	shadowGamma:1,//0.25,//1,
	shadowLuma:0.5, //0.75,//0,
    shadowContrast:2,//2.5,//1,

    reflect:0.1,
    
    fogMode:1,

    lightSizeUV:0.1,//1.3,
    nearPlane:3,//9.5,
    rings:4,//11,
    nSample:16,//17,

    composer:false,

}



let vignette = null
let renderStart = false
let g1, g2, g3
let dom, camera, controls, scene, renderer, loop = null, composer = null, content, followGroup, helperGroup, txt, ground = null, envui, dci;

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
	Agx: THREE.AgXToneMapping,
	ACESFilmic: THREE.ACESFilmicToneMapping,
	Uncharted2: THREE.CustomToneMapping
}

const shadowMapType = {
	PCSS: THREE.BasicShadowMap, // remplace by super soft
	PCF: THREE.PCFShadowMap,
	PCFSoft: THREE.PCFSoftShadowMap,
	VSM: THREE.VSMShadowMap
}


/*const LinkWasm = {
    Ammo:'./build/ammo3.wasm.js',
    Physx:'./build/physx-js-webidl.js',
}*/

let statistic = null

//let isMobile = false

export const Main = {

	Hub:Hub,

	engineType:'',
	currentDemmo:'',
	isWorker:true,
	devMode:false,
	engineList: [ 'OIMO', 'AMMO', 'PHYSX', 'HAVOK', 'RAPIER', 'JOLT' ],
	demoList:[],
	demoLink:[],
	devLink:[],
	devDemo:{},
	envList:[],
	isMobile:false,
	isEditor:false,

	motor:Motor,

	start: async ( o = {} ) => {

		// todo don't get the good model scale 
		//DualQuat();

		Hub.setMain( Main );
		Gui.setMain( Main, Hub.getCorner() );
		Gui.setTextureConstrutor( THREE.Texture );

		activeWebGPU = o.webGPU || false;

		const gpuTier = await getGPUTier();
	    const perf = gpuTier;
	    //console.log(perf)

	    Main.isMobile = perf.isMobile;

		if( Main.isMobile || perf.fps < 60 ){ 
			options.mode = 'LOW';
			options.quality = 1;
		}

		switch(perf.tier){
			case 1: options.fps = 15; break
			case 2: options.fps = 30; break
			case 3: options.fps = 60; break
		}

		Main.engineType = o.type || 'PHYSX';

		Main.isWorker = Main.isMobile ? false : true;

		let urlParams = new URLSearchParams( window.location.search );
		if( urlParams.has('E') ){
			let eng = urlParams.get('E');
			Main.isWorker = eng.search('w_') !== -1;
			Main.devMode = eng.search('dev_') !== -1;
			Main.engineType = eng.substring( eng.lastIndexOf('_')+1 ).toUpperCase();
		}

		let n = Main.engineType.toLowerCase();
		engineName = n.charAt(0).toUpperCase() + n.slice(1);

		version = Motor.Version[ Main.engineType ];

		// test cannon physics
		//if( Main.devMode ) Main.engineList.push('CANNON');

		//o.link = LinkWasm[ engineName ]
		o.type = Main.engineType;
		o.devMode = Main.devMode;
		o.worker = Main.isWorker;
		o.callback = init;

		introText = ( Main.isWorker ? 'WORKER ' : 'DIRECT ' ) + Main.engineType + ' ' + version;

		//options.show_stat = Main.devMode;

		//Motor.engine = Main.engineType
		window.engine = Main.engineType;//Motor.engine

		//o.renderer = renderer
		//console.log('yo', renderer)

		Motor.init( o );
	
	},

	getCorner:() => { return Hub.getCorner(); },


    setComposer:( b ) => { setComposer(b) },
    showDebugLight:( b ) => { showDebugLight(b) },
    showStatistic:( b ) => { showStatistic(b) },

    setShadow:( v ) => { setShadow(v) },
    setShadowType:() => { setShadowType() },
    upShader:() => { upShader() },

    getCamera:() => ( controls.info ),
    setCamera:(o) => { setCamera(o) },

    getCode:() => ( code ),
	getScene:() => ( scene ),
	getRenderer:() => ( renderer ),
	getControler:() => ( controls ),
	getCodeName:() => ( options.demo ),
	getGround:() => ( ground ),

	getHub3d:() => ( vignette ),
	//getWorker:() => ( 'Worker' + (Main.isWorker ? ' On' : ' Off') ),
	getDemos:() => {

		let d = Motor.get('demos', 'json')
		Main.demoLink = [ ...d.Basic, ...d.Advanced, ...d[Main.engineType] ]
		Main.devLink = [ ...d.Dev ];
		if( Main.devMode ){ 
			Main.demoLink = [ ...Main.demoLink, ...d.Dev ];
			let j = d.Dev.length;
			while(j--){
				let name = d.Dev[j];
				name = name.substring( name.lastIndexOf('/')+1 );
				name = name.toUpperCase().substring(0,1) + name.substring(1).toLowerCase();
				Main.devDemo[name] = true;
			}
		}

		let i = Main.demoLink.length, l
	    while(i--){
	    	l =  Main.demoLink[i];
	    	Main.demoList[i] = l.substring( l.lastIndexOf('/')+1 );
	    }

		Main.envList = [...d.Envmap];
		//return Main.demoList
	},

	lightIntensity:() => { lightIntensity() },
	changeShadow:(o) => { changeShadow(o) },
	envmapIntensity:() => { setEnvmapIntensity() },
	bgIntensity:() => { setbgIntensity() },
	shadowIntensity:() => { setshadowIntensity() },
	setReflect:(v) => { setReflect(v) },

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
	initParticle: () => { return initParticle() },

	loadDemo: ( name ) => { loadDemo( name ) },
	extraCode: ( url, callback ) => { editor.loadExtra( url, callback ); },

	showEditor: ( b ) => { editor.show( b ) },
	changeMode: ( v ) => {
	    let low = options.mode === 'LOW'
	    setShadow( low ? 0 : 0.5 )
		setReflect( low ? 0 : 0.8 )
	},

	showGui: () => { Gui.showHide() },
	resetGui: () => { Gui.reset() },
	setEnv: (name, chageUI) => { setEnv(name, chageUI) },
	setBlur: (v) => {
        Env.setBlur( options.envBlur );
	},

	setColors: ( palette ) => {

		//console.log( palette )

		if( vignette ) vignette.color = Gui.tool.htmlToHex( palette.darkVibrant ) 

		groundColor = Gui.tool.htmlToHex( palette.ground )

		if( ground && groundAutoColor ) ground.setColor( groundColor )

		let m = Motor.getMatRef()
	    //console.log(m)
	    if( m.isRealism ) m.setColor( palette );

		//let c = Gui.tool.htmlRgba( palette.darkMuted, 0.4 );
		//Hub.setTopColor( Gui.tool.htmlRgba(palette.darkMuted, 0.4) );

	},

	debugMode: ( b ) => {

		options.debug = b;
		Motor.setDebugMode( options.debug );

	},

	changeRenderMode: ( v ) => {

		let n = 0;
		if(v==='depth') n = 1;
		if(v==='normal') n = 2;
		Motor.changeRenderMode( n );

	}

}

Motor.log = Hub.log;


Motor.changeShadow = Main.changeShadow;

Motor.initParticle = Main.initParticle
Motor.addParticle = Main.addParticle
Motor.getParticle = Main.getParticle
Motor.getGround = Main.getGround;

Motor.extraCode = Main.extraCode;
Motor.debugMode = Main.debugMode;
Motor.gui = Gui.extraUi;


window.phy = Motor
window.math = Motor.math
window.Main = Main

window.THREE = THREE
window.hub = Hub
window.Planet = Planet
window.Building = Building
window.Sparkle = Sparkle

window.Diamond = Diamond
window.Fluid = Fluid;
window.TWEEN = TWEEN;


const init = () => {

	isWebGPU = activeWebGPU ? WebGPU.isAvailable() : false
 
	if( isWebGPU ) console.log('use webgpu !!')

	// https://threejs.org/docs/#api/en/renderers/WebGLRenderer

	let powerPreference ='default'
	//let powerPreference ='high-performance'
	//let powerPreference ='low-power'// for mobile

	let pixelRatio = lockPixelRatio ? 1 : window.devicePixelRatio;
	let antialias = true;

	if( pixelRatio > 2 ){ 
		pixelRatio = 2;
		antialias = false;
	}

	if(options.mode === 'LOW') antialias = false;

	content = Motor.getScene()

	size.w = window.innerWidth;
	size.h = window.innerHeight;
	size.r = size.w / size.h;

	// RENDERER

	if( isWebGPU ) renderer = new WebGPURenderer({ antialias:antialias/*, alpha:false, premultipliedAlpha: false*/ })
	else renderer = new THREE.WebGLRenderer({ 
		antialias:antialias, 
		powerPreference:powerPreference,
		alpha: false,
	    depth: true,
	    stencil: true,
	    premultipliedAlpha: true,
	    preserveDrawingBuffer: false,
	    failIfMajorPerformanceCaveat: false,
	})
	
	renderer.setPixelRatio( pixelRatio );
	renderer.setSize( size.w, size.h );
	renderer.setClearColor( 0x000000, 1 );
	renderer.toneMapping = toneMappingOptions[options.tone];
	renderer.toneMappingExposure = options.exposure;

	///THREE.ColorManagement.legacyMode = false;

	if( options.mode !== 'LOW' && !isWebGPU ) Motor.setMaxAnisotropy( renderer.capabilities.getMaxAnisotropy() );

	Motor.setRenderer(renderer);

	// DOM
    document.body.appendChild( renderer.domElement );
	dom = renderer.domElement;
	dom.style.position = 'absolute';

	// SHADER

	Shader.renderer = renderer;

	if( !isWebGPU && options.mode !== 'LOW' && highShadow ){
		Shader.setGl2( isWebGPU ? false : renderer.capabilities.isWebGL2 );
		Shader.init( options );
		Motor.setExtendShader( Shader.add );
	}

	// SCENE

	scene = new THREE.Scene();
	renderer.setClearColor ( new THREE.Color( 0x000000 ) );
	//scene.background = new THREE.Color( 0x272822 )

	// GROUP

	followGroup = new THREE.Group();
	followGroup.name = 'followGroup';
	scene.add( followGroup );

	helperGroup = new THREE.Group();
	helperGroup.name = 'helperGroup';
	scene.add( helperGroup );

	scene.helper = helperGroup;


	addLight();

	// CAMERA / CONTROLER

	camera = new THREE.PerspectiveCamera( 50, size.r, 0.1, 1000 );
	scene.add( camera );

	controls = new Controller( camera, renderer.domElement, followGroup );
	controls.resetAll();
	//controls.target.y = 2
	/*controls.minDistance = 0.1
    controls.maxDistance = 100
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true
    controls.zoomToCursor = true*/
    //controls.enable = false
    //controls.maxPolarAngle = Math.PI / 2

    //setCamera()

	//controls.update()

	
	// avoid track run in background
	document.addEventListener( 'visibilitychange', onVisible );

	window.addEventListener( 'resize', onResize );
	document.body.addEventListener( 'dragover', function(e){ e.preventDefault() }, false );
    document.body.addEventListener( 'dragend', function(e){ e.preventDefault() }, false );
    document.body.addEventListener( 'dragleave', function(e){ e.preventDefault()}, false );
	document.body.addEventListener( 'drop', drop, false );

	Hub.init( camera, size, introText );

	editor = new Editor();

	Env.init( renderer, scene );
	Env.setMain( Main );

	start();

	Motor.load( 'demos.json', next );

}

const dispose = () => {

	renderStart = false
	if(loop === null) return
	//Env.dispose()
    renderer.dispose()
	renderer.renderLists.dispose()
	cancelAnimationFrame( loop )
	loop = null
	
}

const drop = (e) => {

	e.preventDefault();
	const file = e.dataTransfer.files[0]
    const reader = new FileReader();
    const name = file.name;
    const type = name.substring(name.lastIndexOf('.')+1, name.length )
    const finalName = name.substring( name.lastIndexOf('/')+1, name.lastIndexOf('.') )

    //console.log(type, name)

    switch( type ){
    	case 'js': reader.readAsText( file ); break;
    	case 'fbx': case 'glb':  reader.readAsArrayBuffer( file ); break;
    	case 'hdr' : case 'exr' :
    	options.envmap = finalName
    	Env.load( ( window.URL || window.webkitURL ).createObjectURL( file ), null, type ); 
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


	//hideMat = Motor.getHideMat()

    Motor.setContent( scene )
    Motor.setControl( controls )
    //Motor.setExtendShader( Shader.add )
    Motor.setAddControl( addControl )

    // activate mouse drag
    Motor.activeMouse( controls )


	let hash = location.hash.substr( 1 )
    if( hash !== '' ) options.demo = hash

    Hub.endLoading()

	loadDemo( options.demo )


	//if(isWebGPU) options.show_stat = false
	//if( options.show_stat ) showStatistic( true )

}

const start = () => {

	if( renderStart ) return;
	//if( isWebGPU ) renderer.setAnimationLoop( render );
	//else { if( loop === null) render(0) }
	if( loop === null) render(0);
	renderStart = true;
}

/*const upExpose = () => {
	if( renderer.toneMappingExposure < options.exposure ) renderer.toneMappingExposure+=0.001
}*/

const addControl = () => {

	if( Main.isMobile ) Hub.addJoystick();

}


//--------------------
//   LIGHT
//--------------------

const changeShadow = (o) => {

	if(o.distance);
	Lights.setShadow( Lights.byName('sun'), o );

}

const lightIntensity = (a,b,c) => {

	if( a !== undefined ) options.direct = a;
	if( b !== undefined ) options.spherical = b;
	if( c !== undefined ) options.exposure = c;

	Lights.update({ sunIntensity:options.direct, hemiIntensity:options.spherical });
	renderer.toneMappingExposure = options.exposure;

}

Motor.lightIntensity = lightIntensity;

const addLight = () => {

	Lights.define( options, followGroup, isWebGPU );

	/*let s 

	Lights.add({ 
		type:'direct', name:'sun',
		//intensity:options.mode !== 'LOW' ? options.light_1*0.3 : options.light_1, 
		intensity:options.light_1,
		distance:10, parent:followGroup,
	    shadow:{ range:20, near:5, far:50, bias:!isWebGPU ? -0.0005 : 0.005, radius:4, quality: 2048 * options.quality }
	})


	/////
	if( options.mode !== 'LOW' ){
		/*Lights.add({ 
		    type:'direct', name:'sun2',
		    intensity:options.light_1*0.7, distance:6, parent:followGroup,
	        shadow:{ range:4, near:1, far:20, bias:-0.0005, radius:4, quality: 1024 * options.quality },
		})*/
	//}

	/////

	/*Lights.add({ 
	    type:'direct', name:'moon',
	    intensity:options.light_2, distance:10, parent:followGroup,
	   // shadow:{ range:20, near:1, far:20, bias:-0.0005, radius:1, quality: 2048 * options.quality }
	})*/

	//if( !isWebGPU ){	
		/*Lights.add({ 
			type:'hemi', name:'hemi',
			intensity:options.light_2, 
			pos:[0,1,0], 
			parent:followGroup 
		})*/
	//}

	////


	if( options.mode === 'LOW' ){
		options.shadow = 0
		options.reflect = 0
	}

	if( !isWebGPU ){

		Lights.castShadow( options.shadow !== 0 )
		renderer.shadowMap.enabled = options.shadow !== 0 
		renderer.shadowMap.type = shadowMapType[options.shadowType]
		//renderer.shadowMap.autoUpdate = false;
		//renderer.shadowMap.needsUpdate= true;

	}

	////

}

const clearLight = ( o ) => {

	Lights.dispose()

}

/*const clearShadow = ( o ) => {

	if(light) light.shadow.dispose()
	if(light3) light3.shadow.dispose()
	
}*/

const resetLight = ( o ) => {

	const dt = {
		sunPos: [0.27, 1, 0.5],
		sunColor: 0xFFFFFF,
		skyColor: 0xFFFFFF,
		groundColor: 0x808080, 
	}

	Lights.update( dt );

}

const showDebugLight = ( b ) => {

	let v = Lights.addHelper( b, helperGroup );
	Env.preview( v );

}

const setShadowType = () => {

	renderer.shadowMap.type = shadowMapType[options.shadowType];
	Main.upShader();

}

const setShadow = ( v ) => {

	if( isWebGPU ) return;

	options.shadow = v;

	if( options.shadow === 0 ){
		Lights.castShadow( false );
		if( !isWebGPU ) renderer.shadowMap.enabled = false;
		//clearShadow()
	} else {
		if( !renderer.shadowMap.enabled ){
			Lights.castShadow( true );
			if( !isWebGPU ) renderer.shadowMap.enabled = true;
		}
	}

	//if( light.shadowHelper ) light.shadowHelper.visible = options.shadow !== 0

	Main.upShader();

}



// 

//--------------------
//   GROUND
//--------------------

const addVignette = ( o ) => {

	if( vignette === null && !isWebGPU ){

		vignette = new Vignette();
		camera.add( vignette );

	}

}

const removeVignette = () => {

	if( vignette === null ) return

    //camera.remove( vignette );
	vignette.dispose()
    vignette = null

}

	
//--------------------
//   GROUND
//--------------------

const addGround = ( o ) => {

	//groundAutoColor = !o.groundColor//false
    if( o.groundReflect !== undefined ) options.reflect = o.groundReflect;
    if( o.reflect !== undefined ) options.reflect = o.reflect;

	//if( isWebGPU ) return

	if( ground === null ){

		// add reflect ground
		ground = new Reflector({

	    	textureSize: 1024 * options.quality,
	        clipBias:0.003,
	        encoding:true,
	        reflect: options.mode === 'LOW' ? 0 : options.reflect,
	        water:o.water,
	        //color:groundColor,
	        round:true,
	        normal:true

	    })
	    scene.add( ground );

	} else {
		ground.reset();
	}

    ground.setSize( o.groundSize );
    ground.position.fromArray( o.groundPos );

    if( o.groundColor !== undefined ){ 
    	ground.setColor( o.groundColor );
    	groundAutoColor = false;
    } else {
    	ground.setColor( groundColor );
    }

	ground.setAlphaMap( o.groundAlpha );
	ground.setOpacity( o.groundOpacity );
	if( o.groundReflect !== undefined ) ground.setReflect( o.groundReflect );
	ground.setWater( o.water );
    //scene.add( ground )
    Motor.addMaterial( ground.material,  true );

    //Gui.reset()

}

const removeGround = () => {

	if( ground === null ) return

	//scene.remove( ground )
	ground.dispose()
    ground = null

}




//--------------------
//
//   CODE SIDE
//
//--------------------

const directDemo = ( name, result ) => {

	//let findDemo = Gui.resetDemoGroup( name )

	//unSelect()

	Main.currentDemo = name;
	options.demo = name
	location.hash = name

	Hub.upMenu()

	inject( result, true )

}

const loadDemo = ( name ) => {

	let idd = Main.demoList.indexOf(name)
	let expath = '';
	if( Main.devLink.indexOf(name)!==-1 ) expath = 'dev/' 

	if( idd === -1 && expath === '' ){ 
		name = 'start'
		idd = 0
	}

	//let findDemo = Gui.resetDemoGroup( name )
	//if(!findDemo) name = 'start'

	//unSelect()
    
    Main.currentDemo = name;
	options.demo = name
	location.hash = name

	//console.log(options.demo)

	Hub.upMenu()

	//Motor.load( './demos/' + expath + Main.demoLink[idd] + '.js', inject )
	Motor.load( './demos/' + expath + name + '.js', inject )

}

const inject = ( newCode, force = false ) => {

	isLoadCode = !newCode
	code = isLoadCode ? Motor.getScript( options.demo ) : newCode

	if( force ) isLoadCode = true

	if( window['onReset'] ){ 
		window['onReset']()
		window['onReset'] = null
	}

	//Hub.log()
	TWEEN.removeAll();
	Hub.reset()
	Shader.reset()
	editor.reset()
	Gui.resetExtra()

	//resetLight()

	if( particles ) particles.dispose()
	
	
	if( isLoadCode ){
		//console.log('is full reset !!!')
		//Shader.reset()
	    resetLight() 
		Motor.poolDispose();
	}

	phy.mouseMode('drag')
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
	
    if( ev === -1 || evh !== -1 ) view( setting );
    /*else {

    	let t = code.substring(ev+10, code.indexOf('})'))
    	//let f = JSON.parse('{'+t+'}');
    	console.log( t )
    }*/
    if( code.search( 'phy.set' ) === -1 ) Motor.set();

    window['demo']();

    Gui.doReset();

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
    Motor.resize( size )
	needResize = false

	//console.log(dom.clientLeft)

}



//--------------------
//   RENDER
//--------------------

const render = ( stamp = 0 ) => {

    //console.time('step')
	// TIME
	tm.now = stamp
	tm.delta = tm.now - tm.then
	tm.dt = tm.delta * 0.001

	if( needResize ) doResize()

    

	// UPDATE PHY
	if( !Main.isWorker ) Motor.doStep( stamp )
	else Motor.setDelta(tm.dt)

	// UPDATE PARTICLE
    if( particles ) particles.update( stamp )

	// UPDATE CAMERA CONTROLER
    if( controls ) controls.up( tm.dt )
	/*if( controls ){ 
		if( controls.enableDamping && controls.enable ) controls.update();
		if( controls.follow ) controls.follow( tm.dt );
	}*/

    // UPDATE TWEEN
	TWEEN.update( stamp );



	// RENDER
	if( composer && composer.enabled ) composer.render( tm.dt )
	else renderer.render( scene, camera )

	Gui.update()

	upStat()

	//console.timeEnd('step')


	//if( !isWebGPU ) 
	loop = requestAnimationFrame( render )

	//if( renderer.shadowMap.enabled ) renderer.shadowMap.needsUpdate = true;

	

}

const upStat = () => {

	//Hub.showTimeTest( Motor.getTimeTest() )

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
	Hub.setFps(  tm.fps + ' ~ ' + Motor.getFps() )
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

	if(v!==undefined) options.reflect = v

	if(!ground) return
	ground.setReflect( options.reflect )

}




/*function firstFunction() {
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
    }*/
//async 
const view = ( o = {} ) => {

	o = { ...setting, ...o }

	groundAutoColor = !o.groundColor//false

	if( options.mode === 'LOW' ){
		o.shadow = 0;
		o.groundReflect = 0;
		options.reflect = 0;
		options.quality = 1;
	}

	options.direct = o.direct;
	options.spherical = o.spherical;
	options.exposure = o.exposure;
	options.envIntensity = o.envIntensity;
	options.bgIntensity = o.bgIntensity;
	options.shadowIntensity = o.shadowIntensity;

	phy.lightIntensity();

	Env.reset()

	//console.log('view', o)

	//const result = await firstFunction()

	if( o.envmap ){ 
		setEnv( o.envmap, true )
		options.envBlur = o.envblur || 0
		Env.setBlur( options.envBlur )
		if( o.background ) Env.setBackgroud( o.background );
		if( o.envFloor ) Env.project( o.background );
	}

	setShadow( o.shadow )

	// FOG
	let fogMode = o.fogMode || 0; 
	if( o.fog ){ 
		let range = o.fogRange || [1,50];
		scene.fog = new THREE.Fog( Env.getFogColor().getHex(), range[0], range[1] );
		options.fogMode = fogMode;
	}
	else if( o.fogexp ){ 
		scene.fog = new THREE.FogExp2( Env.getFogColor().getHex(), o.fogexp || 0.01 )
		options.fogMode = fogMode;
	}
	else scene.fog = null

	// reflect floor
	if( o.ground ) addGround( o );
	else removeGround()

	if( o.vignette ) addVignette( o );
	else removeVignette();

	//if( isLoadCode ) controls.moveCam( {...cam, ...o })

	if( isLoadCode ) setCamera( o )

	Shader.up( options )

    //if( o.envPower ) options.envPower = o.envPower;
    //else options.envPower = 1.0;

    setEnvmapIntensity();
    setbgIntensity();
    setshadowIntensity();
	
}

Motor.view = view;

const setCamera = ( o ) => {

	//if(o) for( let i in o ){ if( cam[i] !== undefined ) cam[i] = o[i] }

    controls.moveCam( {...CameraBase, ...o } )
    controls.update()

}



//async function setEnv( name, chageUI ) {
const setEnv = ( name, chageUI ) => {

	//if(isWebGPU) return

	if( name !== options.envmap ){

		if ( !isNaN(name) ) options.envmap = 'null';
		else options.envmap = name;

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
//   OPTION
//--------------------

const setshadowIntensity = () => {

	Lights.setShadow( Lights.byName('sun'), { intensity:options.shadowIntensity } );

}

const setbgIntensity = () => {

	scene.backgroundIntensity = options.bgIntensity;

}

const setEnvmapIntensity = () => {

	scene.environmentIntensity = options.envIntensity;

	//Motor.setEnvmapIntensity( options.envPower )

	/*let g = Motor.getScene()
	g.traverse( function ( node ) {
		if( node.isMesh ){ 
			if( !node.material.userData.envp ) node.material.userData.envp = node.material.envMapIntensity
			node.material.envMapIntensity = node.material.userData.envp * options.envPower
		}
	})*/

	//if(!ground.material.userData.envp) ground.material.userData.envp = ground.material.envMapIntensity
	//ground.material.envMapIntensity = ground.material.userData.envp * options.envPower

}

const showStatistic = ( b ) => {

	if( isWebGPU ) return

	if( b && !stats ){
		stats = new Stats( renderer );
	}

	if( !b && stats ){

		stats = null;
		Hub.setStats();
		
	}

}



const getFullStats = () => {

    if ( !stats ) return
    Hub.setStats( stats.get() )
    
}


//--------------------
//   POST PROCESS
//--------------------

const setComposer = ( b ) => {

	if( options.composer ){
		if( composer === null ) composer = new Composer( renderer, scene, camera, controls, size );
		composer.enabled = true;
		if( vignette ) vignette.visible = false;

	} else {
		if( composer ){
			composer.dispose();
			composer = null;
			if(vignette) vignette.visible = true;
		}
	}

	Gui.postprocessEdit()

}


//--------------------
//  PARTICLE
//--------------------

const initParticle = ( ) => {

   if( !particles ) particles = new Smoke( scene, renderer );

}

const addParticle = ( o = {} ) => {

   if( !particles ) particles = new Smoke( scene, renderer );
   return particles.add( o )

}

const getParticle = ( name ) => {
	
	if( !particles ) particles = new Smoke( scene, renderer );
   return particles.get( name )

}
