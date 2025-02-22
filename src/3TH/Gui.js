import * as UIL from '../libs/uil.module.js'
import { Video } from './Video.js'
import { Env } from './Env.js'
import { Hub } from './Hub.js'
import { Shader } from './Shader.js'
import { Pool } from './Pool.js'

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/

const menuList = ['ENV', 'PHY', 'CAM', 'POST', 'MAT', 'OBJ'];
const toneMappingOptions = {
	None: 0,
	Linear: 1,
	Reinhard: 2,
	Cineon: 3,
	ACESFilmic: 4,
	Uncharted2: 5
}

let Main = null;

export const Gui = {

	tool:UIL.Tools,

	open:false,
	isInit:false,
	graph:null,

	ui:null,
	uix:null,
	gp:null,
	video:null,
	envui:null,

	CameraOptions:[],

	//mat:null,
	startMode:'ENV',
	mode:'',
	currentMat:'',
	matList:null,

	imageMap: ['map', 'map1', 'map2', 'emissiveMap', 'sheenColorMap'],
	imageNormal: [ 'normalMap', 'normalMap1','normalMap2','aoMap', 'metalnessMap', 'thicknessMap', 'roughnessMap', 'alphaMap','anisotropyMap', 'specularIntensityMap', 'displacementMap', 'bumpMap' ],
	
	MaterialMesh:[ 'Basic', 'Physical', 'Standard', 'Toon', 'Lambert', 'Phong', 'Shader' ],

	joy: null,
	p0: 'M 0.5 1.5 L 9.5 1.5 M 0.5 5.5 L 9.5 5.5 M 0.5 9.5 L 9.5 9.5',
	p1: 'M 1.5 0.5 L 1.5 9.5 M 5.5 0.5 L 5.5 9.5 M 9.5 0.5 L 9.5 9.5',

	bg:'rgba(0,0,8,0.5)',

	colors:{
		over:'#025B18',
		overoff:'#025B18',
		select:'#023612',
		textSelect:'#1FC742',
		border:'none',
		//content:'rgba(0,0,8,0.5)',
		fontShadow:'#000',
		//sx: 4,
        //sy: 4,
        radius:0,

        showOver:0,

        content:'none',
		background:'none', //'none',
		backgroundOver:'none',//'rgba(255,255,255,0.02)',
		font:"'SegoeUI', 'Segoe UI', 'Helvetica Neue', -apple-system, BlinkMacSystemFont, Roboto, Oxygen-Sans, Ubuntu, Cantarell, sans-serif",
		//font:"'Roboto Mono', 'Source Code Pro', Consolas, monospace",
		//font:"'Roboto Mono', 'Source Code Pro', Consolas, monospace", 
		//font:"Mulish, sans-serif", 
		fontSize:13,
		//weight:'500',
		//weight:'bold',
		text:'#fff',
		title:'#eee',
		borderSize:2,
		joyOut:'rgba(255,255,255,0.1)',
		joyOver:'rgba(127,255,0,0.2)',
        joySelect:'#7fFF00',

	},

	setMain: ( r ) => { 
		Main = r;
	},

	extraUi: ( data = null ) => { 

		if( Gui.uix ){ 
			Gui.uix.dispose();
			console.log('uix dispose')
		}

		//console.log('uix add')

		Gui.uix = new UIL.Gui( { parent:Main.getCorner(), w:200, h:24, open:true, close:false, css:'left:40px;', bottom:40, colors:Gui.colors, transition:0 } )//

		if( data ){
			let d;
			let lng = data.length;

			for( let i = 0; i<lng; i++ ){
				d = data[i];
				Gui.uix.add( d.obj, d.name, d );
			}
		}

		return Gui.uix;

	},

	setTextureConstrutor: ( Texture ) => {
		UIL.Tools.texture = Texture;
	},

	showHide: () => { 

		if( !Gui.isInit ) Gui.init();

		if( Gui.open ) Gui.open = false;
		else Gui.open = true;

		Gui.ui.isOpen = Gui.open;

		Hub.switchGuiButton( Gui.open );

		Gui.menu.display( Gui.open );
		Gui.ui.display( Gui.open );

		Gui.ui.calc();
		Gui.ui.mode('def');

	},

	init:() => {

		UIL.Tools.setStyle(Gui.colors)

		Gui.menu = UIL.add( 'button', { type:'button', values:menuList, value:Gui.startMode, selectable:true, unselect:false, p:0, h:30, w:250, radius:0, pos:{right:'5px', top:'60px'} }).onChange( Gui.setMode )

		Gui.menu.icon( iconUI('env'), 0, 2 )
		Gui.menu.icon( iconUI('phy'), 0, 3 )
		Gui.menu.icon( iconUI('cam'), 0, 4 )
		Gui.menu.icon( iconUI('post'), 0, 5 )
		Gui.menu.icon( iconUI('mat'), 0, 6 )
		Gui.menu.icon( iconUI('asset'), 0, 7 )

		Gui.ui = new UIL.Gui( { w:250, h:25, open:false, close:false, css:'right:5px; top:97px;', colors:Gui.colors, transition:0 } )//


		//Gui.display()

		Gui.setMode(Gui.startMode)

		Gui.isInit = true;

	},

	setMode( name ){

		if(Gui.mode === name) return
		Gui.mode = name;
	    Gui.graph = null;
	    Gui.ui.clear()

	    switch(Gui.mode){
	    	case 'ENV': Gui.display(); break;
	    	case 'PHY': Gui.physics(); break;
	    	case 'CAM': Gui.camera(); break;
	    	case 'POST': Gui.postprocess(); break;
	    	case 'MAT': Gui.material(); break;
	    	case 'OBJ': Gui.objects(); break;
	    }

	    Gui.ui.add( 'empty', {h:6})

	},

	doReset: () => {

		if( !Gui.isInit ) return
		if( !Gui.open ) return
		setTimeout( Gui.reset, 0 ) 

	},

	reset: () => {

		if( !Gui.isInit ) return
		if( !Gui.open ) return

		let oldMode = Gui.mode;
	    Gui.mode = ''
	    Gui.currentMat = ''
	    if(oldMode) Gui.setMode(oldMode)

	},

	resetExtra: () => {
		if( Gui.uix ) { 
			Gui.uix.dispose(); 
			Gui.uix = null;
			//console.log('uix dispose')
		}
	},


	display:() => {

		if( Gui.mode !== 'ENV' ) return

		const ui = Gui.ui

		const mode = 2

		const options = Main.getOption()
		//const setting = Main.getSetting()
		const renderer = Main.getRenderer()
		const scene = Main.getScene()
		const toneMappingOptions = Main.getToneMappingOptions()

		ui.add( options, 'mode', { type:'button', values:['LOW', 'HIGH'], selectable:true, unselect:false, p:0 }).onChange( Main.changeMode )

		ui.add( options, 'debug', { type:'bool' }).onChange( Main.debugMode )
		//ui.add( options, 'day', { type:'bool' }).onChange( Hub.setColors )
		ui.add( options, 'harmony', { type:'bool' }).onChange( Hub.harmony )
		ui.add( options, 'show_light', { type:'bool' }).onChange( Main.showDebugLight )
		ui.add( options, 'show_stat', { type:'bool' }).onChange( Main.showStatistic )

		ui.add( options, 'fogMode', { type:'selector', values:[0,1], selectable:true, unselect:false, h:24 }).onChange( function(n){ Shader.up( options ) })

		

		ui.add( options, 'tone',  { type:'list', list:toneMappingOptions, full:true }).onChange( function(v){
			renderer.toneMapping  = toneMappingOptions[ options.tone ]
		})

		ui.add( options, 'exposure', { min:0, max:1, step:0.001, pecision:3, mode:mode } ).onChange( function( v ){ 
			renderer.toneMappingExposure = v; 
			//Env.up()
		})

		ui.add( options, 'direct', { rename:'Light Direct', min:0, max:100, mode:mode, color:'#ff0' } ).onChange( Main.lightIntensity )
		ui.add( options, 'spherical', { rename:'Light Hemi', min:0, max:10, mode:mode, color:'#ff0' } ).onChange( Main.lightIntensity )
		ui.add( options, 'shadowIntensity', { rename:'shadow', min:0, max:1, mode:mode, color:'#ff0' } ).onChange( Main.shadowIntensity )

		ui.add( options, 'envIntensity', { min:0, max:20, mode:mode, color:'#8ff' } ).onChange( Main.envmapIntensity )
		ui.add( options, 'bgIntensity', { min:0, max:20, mode:mode, color:'#8ff' } ).onChange( Main.bgIntensity )
		ui.add( options, 'envBlur', { min:0, max:1, mode:mode, color:'#8ff' } ).onChange( Main.setBlur )
		ui.add( options, 'reflect', { min:0, max:1, mode:mode, color:'#8ff' } ).onChange( Main.setReflect )

		Gui.envui = ui.add( 'list', { name:'Envmap', list:Main.envList, value:options.envmap, path:'assets/textures/equirectangular/mini/', format:'.jpg', m:0, imageSize: [128,64], h:40}).onChange( Main.setEnv )
		
		//ui.add( options, 'envPower', { min:0, max:10, mode:mode, color:'#8ff' } ).onChange( Main.envmapIntensity )
		//ui.add( options, 'legacy',  { type:'bool' }).onChange( function(v){ renderer.useLegacyLights  = v })
        //ui.add( options, 'shadow', { min:0, max:1, mode:mode, color:'#8ff' } ).onChange( Main.setShadow )//.listen()
		//.listen()

		const hub3d = Main.getHub3d();
		if(hub3d){
			let g0 = ui.add('group', { name:'VIGNETTE', open:false })
			g0.add( hub3d, 'grain', { min:0, max:0.5, mode:mode, color:'#8ff' } )
			g0.add( hub3d, 'offset', { min:0, max:2, mode:mode, color:'#8ff' } )
			g0.add( hub3d, 'darkness', { min:0, max:1, mode:mode, color:'#8ff' } )
			g0.add( hub3d, 'color', { type:'color' } ).listen()
		}

		

		

		//return

		
		

		
		

		/*g.add( 'bool', { name:'ground', value:setting.ground }).onChange( showGround )

		g.add( 'bool', { name:'floor', value:false }).onChange( Env.addFloor )
		g.add( 'slide', { name:'height', min:1, max:100, precision:0, value:10, mode:mode } ).onChange( Env.setFloorHeight )
		g.add( 'slide', { name:'radius', min:1, max:600, precision:0, value:100, mode:mode } ).onChange( Env.setFloorRadius )

		g.add( options, 'reflect', { min:0, max:1, mode:mode } ).onChange( setReflect ).listen()

		
		g.add( options, 'shadowType', { type:'list', rename:'type', list:shadowMapType, full:true }).onChange( function(v){
			renderer.shadowMap.type = shadowMapType[options.shadowType]
		})

		g.add( options, 'lightSizeUV', { min:1, max:10, precision:4, mode:mode } ).onChange( upShader )
		g.add( options, 'nearPlane', { min:1, max:20, precision:2, mode:mode } ).onChange( upShader )
		g.add( options, 'rings', { min:1, max:30, precision:0, mode:mode} ).onChange( upShader )
		//grV.add( options, 'nSample', {min:2, max:32, precision:0} ).onChange( function(){ Shader.up( options ) } )
		*/

		

	},

	objects:() => {
		if( Gui.mode !== 'OBJ' ) return


	},

	physics:() => {

		if( Gui.mode !== 'PHY' ) return

		const ui = Gui.ui

	    const setting = Main.motor.getSetting()

	    Gui.graph = ui.add('fps', { 
	        name:'stat', h:22, hplus:180, custom:true, alpha:0.5, res:50, 
	        names:['three','phy'], cc:['200,200,200','50,120,220'], 
	        range:[25,25], precision:2, radius:4, color:'#EEEEEE', adding:false  
	    })
	    Gui.graph.open()

	   //ui.add('button', { values:Main.engineList, selectable:true, value:Main.engineType, h:30  }).onChange( Gui.swapEngine )
		//if( Main.devMode ) ui.add('button', { values:['RAPIER','CANNON'], selectable:true, value:Main.engineType }).onChange( Gui.swapEngine )
		ui.add( 'bool', { name:'WORKER OFF', onName:'WORKER ON', value:Main.isWorker, mode:1 }).onChange( Gui.swapWorker )
		

	    let rrr = ui.add( 'button', { type:'button', values:['REPLAY', 'PAUSE'], p:0 }).onChange( (n)=>{ 
			//if(n === 'EDIT'){ Main.showEditor(true); this.switchValues(0, 'CLOSE' ); }
			//if(n === 'CLOSE'){ Main.showEditor(false); this.switchValues(0, 'EDIT' ); }
			if(n === 'PAUSE'){ phy.pause( true ); rrr.switchValues(1, 'PLAY' ); }
			if(n === 'PLAY'){ phy.pause( false ); rrr.switchValues(1, 'PAUSE' ); }
			if(n === 'REPLAY') Main.injectCode( Main.getCode() )
		})



		ui.add( 'empty', {h:6})

	    ui.add( 'button', { type:'button', values:['DRAG', 'SHOOT', 'BUILD'], value:'DRAG', selectable:true, unselect:false, p:0 }).onChange( (n)=>{ 
			phy.mouseMode( n.toLowerCase() );
		})

		//ui.add( 'number', { name:'Gravity', value:[0,-9.81,0] })


		ui.add( setting, 'gravity', { type:'number' }).onChange( Main.motor.setGravity );
		//ui.add( setting, 'substep', { type:'number' })
		//ui.add( setting, 'fps', { type:'number' })

	},

	camera:() => {

		if( Gui.mode !== 'CAM' ) return

		const ui = Gui.ui

	    const controler = Main.getControler();
	    const renderer = Main.getRenderer();
	    const options = Main.getOption()

	    //Gui.CameraOptions = 
	    const up = function(){ 
	    	Main.setCamera( {...controler.info } )
	    }
	    const mode = 2

	    //console.log(options)

	    let g0 = ui.add('group', { name:'CAMERA', open:true })

	    
	    //ui.add( 'empty', {h:6})
	    g0.add( controler.info, 'phi', {min:-90, max:90, precision:1, mode:mode, color:'#ff0' }).onChange( up ).listen()
	    g0.add( controler.info, 'theta', {min:-180, max:180, precision:1, mode:mode, color:'#ff0'  }).onChange( up ).listen()
	    g0.add( 'empty', {h:6})
	    g0.add( controler.info, 'fov', {min:1, max:180, precision:1, mode:mode, color:'#8ff' }).onChange( up ).listen()
	    g0.add( controler.info, 'zoom', {min:0.1, max:10, precision:1, mode:mode, color:'#8ff'  }).onChange( up ).listen()
	    g0.add( 'empty', {h:6})

	    //ui.add( controler.info, 'target', { type:'number' }).onChange( up ).listen()
	    g0.add( controler.info, 'distance', { type:'number', min:0, max:100, mode:mode} ).onChange( up ).listen()
	    g0.add( controler.info, 'x', { type:'number', min:-50, max:50, precision:2, mode:mode }).onChange( up ).listen()
	    g0.add( controler.info, 'y', { type:'number', min:-50, max:50, precision:2, mode:mode  }).onChange( up ).listen()
	    g0.add( controler.info, 'z', { type:'number', min:-50, max:50, precision:2, mode:mode }).onChange( up ).listen()

	   

	    //ui.add( 'bool', { name:'CAPTURE', onName:'STOP', value:false, mode:1 }).onChange( Gui.capture )
		//ui.add('button', { name:'CAMERA' }).onChange( function(){ console.log( controls.getInfo() )} )
		g0.add( options, 'renderMode', { type:'button', values:[ 'color', 'depth', 'normal' ], selectable:true, unselect:false, p:0 }).onChange( Main.changeRenderMode )

		g0.add('button', { name:'SCREENSHOT' }).onChange( function(){ Main.motor.screenshot() } )

		let setts = Shader.setting()

		let g1 = ui.add('group', { name:'SHADOW', open:false })
		g1.add( options, 'shadowType', { type:'button', values:['PCSS', 'PCF', 'PCFSoft', 'VSM'], value:'DRAG', selectable:true, unselect:false, p:0 } ).onChange( Main.setShadowType )//.listen()
		g1.add( options, 'shadow', { min:0, max:1, mode:mode, color:'#8ff' } ).onChange( Main.setShadow )//.listen()
		g1.add( setts.shadowGamma, 'value', { rename:'gamma', min:0, max:4, precision:3, mode:mode, color:'#8ff' } )
		g1.add( setts.shadowLuma, 'value', { rename:'lLuma', min:0, max:4, precision:3, mode:mode, color:'#8ff' } )
		g1.add( setts.shadowContrast, 'value', { rename:'contrast', min:0, max:4, precision:3, mode:mode, color:'#8ff' } )
		g1.add( 'empty', {h:6})
		g1.add( setts.lightSizeUV, 'value', { rename:'light size', min:1, max:10, precision:4, mode:mode } )
		g1.add( setts.nearPlane, 'value', { rename:'near plane', min:1, max:20, precision:2, mode:mode } )
		g1.add( setts.rings, 'value', { rename:'ring', min:1, max:30, precision:0, color:'#ff0', mode:mode} )
		g1.add( setts.nSample, 'value', { rename:'sample', min:2, max:32, precision:0, color:'#ff0', mode:mode }) 

		//g1.add( setts.noiseIntensity, 'value', { rename:'noise', min:0, max:10, precision:3, mode:mode } )
		g1.add( setts.softness, 'value', { rename:'softness', min:0, max:4, precision:3, mode:mode } )



	},

	postprocess:( direct ) => {

		if( Gui.mode !== 'POST' ) return



    	const ui = Gui.ui

        const options = Main.getOption();

        if(!direct){
        	ui.clear() 
        	/*ui.add( options, 'renderMode', { type:'selector', values:[0,1,2,3], selectable:true, unselect:false, p:0, h:24 }).onChange( function(n){ 

				if( n!== 0 ) scene.helper.visible = false
				if( n===1 ) { Env.setBackgroud(0x000000)}
				else if( n===2 ) Env.setBackgroud(0x7777ff)
				else if( n===3 ) Env.setBackgroud(0xffffff)
				else {
					Env.setBackgroud()
					scene.helper.visible = true
				}
				//Hub.setRenderMode( n )
				Shader.up( options ) 
			})*/
        	ui.add( options, 'composer', { type:'bool', rename:'POST PROCESS OFF', onName:'POST PROCESS ON', mode:1, h:40 }).onChange( Main.setComposer )
        	Gui.gp = ui.add('group', { name:'OPTION' })
        }

        let g = Gui.gp
        g.clear()

		const composer = Main.getComposer()
		const scene = Main.getScene()
		const mode = 0

		if(!composer) return

		let data = composer.getPass()
	    let i = data.length, n=0;
	    while(i--){
	    	data[n]
	    	g.add( data[n], 'enabled', { type:'bool', rename:data[n].name+' OFF', onName:data[n].name+' ON', mode:1, h:30 }).onChange( Main.setComposer )
	    	n++;
	    }

	    g.open()
		return
		if(!composer) return

		g.add( composer.pass.focus, 'enabled', { type:'bool', rename:'focus', onName:'focus' })
		g.add( composer.options, 'focus', {min:0, max:100} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'aperture', {min:0, max:5,  precision:2} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'maxblur', {min:0, max:0.01,  step:0.001, precision:3} ).onChange( function(){ composer.update() } )
	    g.add( 'empty', {h:6})
	    /**/

	    g.add( composer.pass.sao, 'enabled', { type:'bool', rename:'sao' })
		g.add( composer.options, 'saoBias', {min:-1, max:1, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'saoIntensity', {min:0, max:1, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'saoScale', {min:0, max:50, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'saoKernelRadius', {min:1, max:100, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'saoMinResolution', {min:0, max:1, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( 'empty', {h:6})

	    //grV.add( composer.pass.bloom, 'enabled', { type:'bool', rename:'bloom' })
	    g.add( composer.pass.bloom, 'enabled', { type:'bool', rename:'bloom' })
		g.add( composer.options, 'threshold', {min:0, max:1, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'strength', {min:0, max:10, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'bloomRadius', {min:0, max:1, step:0.01, mode:mode} ).onChange( function(){ composer.update() } )
	    g.add( 'empty', {h:6})

	    g.add( composer.pass.distortion, 'enabled', { type:'bool', rename:'distortion' })
	    g.add( composer.options, 'distortion', {min:0, max:1, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'horizontal', {min:0, max:360, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'cylindrical', {min:0, max:5, step:0.01, mode:mode} ).onChange( function(){ composer.update() } )
		g.add( 'empty', {h:6})

		g.add( composer.pass.lut, 'enabled', { type:'bool', rename:'lut' })
		//g.add('button', { name:'LOAD', p:10, drag:true }).onChange( function(a,b,c){ composer.changeLut(a,b,c) } )
		g.add('button', { name:'LOAD', p:10 }).onChange( function(a,b,c){ UIL.Files.load( { callback:function(a,b,c){ composer.changeLut(a,b,c) }, type:'lut' } ) } )
		g.add( 'empty', {h:6})

	    g.add( composer.pass.sharpen, 'enabled', { type:'bool', rename:'sharpen' })
	    g.add( composer.options, 'power', {min:0, max:1, mode:mode} ).onChange( function(){ composer.update() } )
	    g.add( 'empty', {h:6})

	    g.open()
	    
	    
	    /*
	    g.add( 'empty', {h:6})
		g.add( composer.options, 'kernelRadius', {min:0.01, max:1} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'minDistance', {min:0, max:0.001, precision:5} ).onChange( function(){ composer.update() } )
		g.add( composer.options, 'maxDistance', {min:0, max:20} ).onChange( function(){ composer.update() } )
	    */

	},

	/*demo:(gg) => {

		return

		let data = Main.getDemos()

		/*let colors = [
		'rgba(180,255,180,0.1)',
		'rgba(255,255,180,0.1)',
		'rgba(255,180,180,0.1)'
		]*/

	/*	let colors = [
		'rgba(255,255,255,0.1)',
		'rgba(200,200,200,0.1)',
		'rgba(150,150,150,0.1)'
		]

		let grB = gg.add('group', { name:'BASIC', open:true, bg:colors[0] })
		Gui.g1 = grB.add( 'grid', { values:data.Basic, selectable:true } ).onChange( Main.loadDemo )

		let grA = gg.add('group', { name:'ADVANCED', open:true, bg:colors[1] })
		Gui.g2 = grA.add( 'grid', { values:data.Advanced, selectable:true } ).onChange( Main.loadDemo )

		if( data[Main.engineType] ){
			let grC = gg.add('group', { name:'SPECIFIC', open:true, bg:colors[2] })
			Gui.g3 = grC.add( 'grid', { values:data[Main.engineType], selectable:true } ).onChange( Main.loadDemo )
		}

		gg.add( 'empty', {h:3})



		gg.reset()

	},*/

	

	/*resetDemoGroup: ( name ) => {

		return

		let cc1 = false, cc2 = false, cc3 = false;

		if(Gui.g1) { Gui.g1.setValue(name); cc1 = Gui.g1.reset() }
		if(Gui.g2) { Gui.g2.setValue(name); cc2 = Gui.g2.reset() }
		if(Gui.g3) { Gui.g3.setValue(name); cc3 = Gui.g3.reset() }

		// if demo not existe reset to default demo 
		if(!cc1 && !cc2 && !cc3){ 
			if(Gui.g1) { Gui.g1.setValue('start'); cc1 = Gui.g1.reset() }
			return false
		}
		else return true

	},*/

	gotoGithub: () => { window.open( 'https://github.com/lo-th/phy', '_blank' ) },

	

	swapWorker: ( b ) => {
		Main.isWorker = b
		Gui.swapEngine()
	},

	swapEngine: ( type ) => {
		if( !type ) type = Main.engineType
		let name = type.toLowerCase()
		let hash = location.hash
		let url = 'index';
		let param = 'E='
		if( Main.devMode ) param += 'dev_'
		if( Main.isWorker ) param += 'w_'
		param += name;
		let w = window.open( url+'.html?'+param+hash, '_self')
	},

	capture: ( B ) => {
		if(!Gui.video && B ) Gui.video = new Video();
		else {
			if( B ) Gui.video.start()
			else {
				Gui.video.stop()
				Gui.video = null;
			}
		}
		
	},

    update: () => {
		if( Gui.video ) Gui.video.update()
		if( Gui.graph ) Gui.graph.tick( [ Main.motor.getDelta()*1000, Main.motor.getDelta2()*1000 ] )
	},

    /*addJoystick:() => {
    	Gui.joy = UIL.add('Joystick', {  w:160, mode:1, text:false, pos:{left:'10px', bottom:'30px' }, simple:true })//.onChange( callbackSize )
    }*/

    material:() => {

    	if( Gui.mode !== 'MAT' ) return

    	const ui = Gui.ui

        const mode = 2

        ui.clear()

        const Mat = Main.motor.getMatRef();
        let mats = Mat.getList();

        if( Mat.isRealism ) {

        	let options = Mat.realismOption

        	const upShader = function(){ 
        		Mat.upShader( options );
		    	//Main.setCamera( {...controler.info } )
		    }

        	let gr = ui.add('group', { name:'REAL LIGHT', color:'#FFFF88', h:30 });
        	gr.add( options, 'enableESL', {}).onChange(upShader)
        	//gr.add( options, 'exposure', { min:0, max:2 }).onChange((v)=>{renderer.toneMappingExposure = v;}) 
			gr.add( options, 'envMapIntensity', { min:0.01, max:2 }).onChange(upShader)
			gr.add( 'empty', { h:10 }) 
			gr.add( options, 'aoColor', { }).onChange(upShader) 
			gr.add( options, 'hemisphereColor',  { }).onChange(upShader) 
			gr.add( options, 'irradianceColor',  { }).onChange(upShader)
			gr.add( options, 'radianceColor', { }).onChange(upShader)
			gr.add( 'empty', { h:10 }) 
			gr.add( options, 'aoPower', { min:0, max:12 }).onChange(upShader) 
			gr.add( options, 'aoSmoothing',  { min:0, max:1 }).onChange(upShader) 
			gr.add( options, 'aoMapGamma',  { min:0.5, max:1.5 }).onChange(upShader)
			gr.add( 'empty', { h:10 }) 
			gr.add( options, 'lightMapGamma', { min:0.5, max:1.5 }).onChange(upShader) 
			gr.add( options, 'lightMapSaturation',  { min:0, max:2.5 }).onChange(upShader) 
			gr.add( options, 'lightMapContrast', { min:0.5, max:1.5 }).onChange(upShader) 
			gr.add( 'empty', { h:10 }) 
			gr.add( options, 'envPower',  { min:0, max:16 }).onChange(upShader)
			gr.add( options, 'roughnessPower', { min:0, max:4 }).onChange(upShader) 
			gr.add( options, 'sunIntensity',  { min:0, max:15 }).onChange(upShader) 
			gr.add( options, 'mapContrast',  { min:0.5, max:1.5 }).onChange(upShader)
			
			gr.add( options, 'smoothingPower',  { min:0, max:1 }).onChange(upShader) 
			gr.add( options, 'irradianceIntensity',  { min:0, max:10 }).onChange(upShader)
			gr.add( options, 'radianceIntensity',  { min:0, max:10 }).onChange(upShader)

        }

		//let mats = Main.motor.getMaterialList();
		const matList = ui.add( 'list', { name:'', list:mats, p:0, value:Gui.currentMat, h:40 }).onChange( Gui.materialEdit )

		if( !Gui.currentMat ) {

			matList.text('Select Material')
			return

		}
		
		let m = mats[ Gui.currentMat ]

		//console.log(m)

		let type = m.type
		if( type.search( 'Mesh' )!==-1 ) type = type.substring( 4 ) 

		let mm = type.search( 'Material' )
		type = type.substring( 0, mm )

		ui.add( 'list', { name:'Type', list:Gui.MaterialMesh, value:type, h:30 }).onChange()

		if(m.side!==undefined) ui.add( m, 'side', { type:'list', list:{ front:0, back:1, double:2 } }).onChange( function( c ){ m.side = this.list.indexOf(c) })
		if(m.shadowSide!==undefined) ui.add( m, 'shadowSide', { type:'list', list:{ front:0, back:1, double:2 } }).onChange( function( c ){ m.shadowSide = this.list.indexOf(c) })

		//return

		let g0 = ui.add('group', { name:'COLORS', color:'#FFaaaa', h:30 });

	    if( m.color!==undefined ) g0.add( m, 'color', {} );
		if( m.specularColor!==undefined ) g0.add( m, 'specularColor', { rename:'specular' } );
		if( m.emissive!==undefined ) g0.add( m, 'emissive', {} );
		if( m.sheen!==undefined ) g0.add( m, 'sheenColor', { rename:'sheen' } );
	    

		let g1 = ui.add('group', { name:'IMAGES', color:'#FFFF88', h:30 })

	    let images = [...Gui.imageMap, ...Gui.imageNormal ], t, str

	    for( let i = 0; i<images.length; i++ ){
	    	t = images[i]
	    	name = 'null'
	    	/*if(m[t]){
	    		str = m[t].source.data.currentSrc || 'Direct';
	    	    name = str.substring( str.lastIndexOf('/')+1 )
	    	} */
	    	if(m[t]!==undefined){ 
	    		let short = t.substring( 0, t.lastIndexOf('M') );
	    		let colorSpace = ''
	    		if( short==='displacement') short='displace'
	    		if( t==='map' || short==='emissive' || short==='sheen' ) colorSpace = 'srgb'
	    		//g1.add( 'bitmap',  { name:t, rename:short, value:name, type:'bitmap' }).onChange( function( file, img, name ){ Gui.setTexture(file, img, name, m ) } )
	    	    g1.add( m, t,  { name:t, rename:short, colorSpace:colorSpace, type:'bitmap', h:30 })//.onChange( function( file, img, name ){ Gui.setTexture(file, img, name, m ) } )
	    	}

	    }

	    let g2 = ui.add('group', { name:'OPTIONS', color:'#88FFFF', h:30 })

	    if(m.randomUv!==undefined) g2.add( m, 'randomUv', {  })
		if(m.wireframe!==undefined) g2.add( m, 'wireframe', {  })
		if(m.vertexColors!==undefined) g2.add( m, 'vertexColors', {  })
		if(m.forceSinglePass!==undefined) g2.add( m, 'forceSinglePass', { rename:'singlePass' })
		if(m.visible!==undefined) g2.add( m, 'visible', {  })
		if(m.depthTest!==undefined) g2.add( m, 'depthTest', {  })
		if(m.depthWrite!==undefined) g2.add( m, 'depthWrite', {  })
		if(m.alphaToCoverage!==undefined) g2.add( m, 'alphaToCoverage', {  })
		if(m.premultipliedAlpha!==undefined) g2.add( m, 'premultipliedAlpha', {  })
		if(m.transparent!==undefined) g2.add( m, 'transparent', {  })

		let g3 = ui.add('group', { name:'VALUES', open:true, h:30 })

		if(m.normalScale!==undefined){
			g3.add( m, 'normalScale', { rename:'normal', min:-10, max:10, precision:2 })
			//g3.add( m.normalScale, 'x', { rename:'normal x', min:-10, max:10, precision:1 })
			//g3.add( m.normalScale, 'y', { rename:'normal y', min:-10, max:10, precision:1 })
		}
		if(m.clearcoatNormalScale!==undefined){
			g3.add( m, 'clearcoatNormalScale', { rename:'clearcoat n', min:-10, max:10, precision:2 })
		}

		let deff = { min:0, max:1, mode:mode }

		


	    if(m.metalness!==undefined) g3.add( m, 'metalness', { ...deff })
		if(m.roughness!==undefined) g3.add( m, 'roughness', { ...deff })

		if(m.envMapIntensity!==undefined) g3.add( m, 'envMapIntensity', { ...deff, rename:'envmap', max:3 })
		if(m.opacity!==undefined) g3.add( m, 'opacity', { ...deff })
		if(m.reflectivity!==undefined) g3.add( m, 'reflectivity', {...deff})

		if(m.specularIntensity!==undefined) g3.add( m, 'specularIntensity', { ...deff })
		if(m.aoMapIntensity!==undefined) g3.add( m, 'aoMapIntensity', { ...deff, rename:'ax' })
		if(m.emissiveIntensity!==undefined) g3.add( m, 'emissiveIntensity', { ...deff, rename:'emissive', max:3 })

		if(m.displacementScale!==undefined) g3.add( m, 'displacementScale', { ...deff, min:-0.1, max:0.1 })
		if(m.displacementBias!==undefined) g3.add( m, 'displacementBias', { ...deff, min:-0.1, max:0.1 })

		if(m.bumpScale!==undefined) g3.add( m, 'bumpScale', { ...deff, rename:'bump', max:3 })
		if(m.reflectif!==undefined) g3.add( m, 'reflectif', { ...deff })

	    
	    if(m.thickness!==undefined) g3.add( m, 'thickness', { ...deff, min:-4, max:4 })
	    if(m.clearcoat!==undefined) g3.add( m, 'clearcoat', { ...deff })
	    if(m.clearcoatRoughness!==undefined) g3.add( m, 'clearcoatRoughness', { ...deff })



	    if(m.sheen!==undefined){ 
	    	g3.add( m, 'sheen', {...deff,min:0, max:20})
	    	g3.add( m, 'sheenRoughness', {...deff})
	    	
	    }

	    if(m.iridescence!==undefined) g3.add( m, 'iridescence', {...deff})

	    if(m.anisotropy!==undefined) g3.add( m, 'anisotropy', {...deff})
	    if(m.anisotropyRotation!==undefined) g3.add( m, 'anisotropyRotation', {...deff})

	    if(m.ior!==undefined) g3.add( m, 'ior', { ...deff, min:0, max:4 })
	    if(m.transmission!==undefined) g3.add( m, 'transmission', { ...deff })


		//Gui.mat.open()

		//

	},

	setTexture:( file, img, name, mat, o = {} ) => {

		if( name==='displace') name = 'displacementMap'
		else if( name!=='map') name = name + 'Map'

		if( file === null ){ 
			mat[name] = null;
			//mat.needsUpdate = true;
			return;
		}

		let ref = mat[name]
		if(ref){
			o.repeat = ref.repeat.toArray()
		}

		o.encoding = Gui.imageMap.indexOf(name) !== -1
		o.flipY = false

		let fileName = file.substring( 0, file.lastIndexOf('.') );
		let fileType = file.substring( file.lastIndexOf('.')+1 );
		

		if( fileType==='exr' ){
			//console.log(img)
			//mat[name] = 
			Pool.load_EXR( file, fileName, function(t){mat[name] = t} )
		} else {

			let im = new Image()
			im.src = img
			im.onload = function (){

				Pool.data.set( 'I_' + fileName, im )
			    mat[name] = Pool.getTexture( fileName, o );
			    //mat.needsUpdate = true;

			}
		}


		

	},

	materialEdit:( name ) => {

		if( Gui.mode !== 'MAT' ) return
		if( name === Gui.currentMat ) return

		Gui.currentMat = name
	    setTimeout( Gui.material, 0 )

	},

	postprocessEdit:( name ) => {

		if( Gui.mode !== 'POST' ) return

		Gui.postprocess(true)

	    //setTimeout( Gui.postprocess, 100 )

	},

}







const iconUI =  function ( type, over = false ){

    var viewBox = '0 0 30 26';
    var d = '';

    var c = over ? ['#baabfb', '#9e87fb', '#7463b8', '#221d36'] : ['#E5E5E5', '#D1D1D1', '#999999', '#383838'];

    var t = ["<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none; margin-top:0px;' preserveAspectRatio='none' x='0px' y='0px' width='30px' height='26px' viewBox='"+viewBox+"'><g>"];
    switch(type){

        case 'phy':
        d = 'M 22.2 11.35 Q 21.95 10.15 21.25 9.1 L 22.45 7.85 Q 21.95 7.2 21.4 6.65 20.8 6 20.1 5.55 L 18.95 6.75 Q 17.9 6.05 16.65 5.8 L 16.65 4.15 Q 15.9 4 15.05 4 14.2 4 13.4 4.2 L 13.4 5.8 Q 12.15 6.05 11.15 6.75 L 9.95 5.55 Q 9.25 6 8.65 6.65 8.1 7.2 7.65 7.9 L 8.8 9.05 Q 8.1 10.1 7.85 11.35 L 6.2 11.35 Q 6.1 12.15 6.1 13 6.1 13.85 6.2 14.65 L 7.85 14.65 Q 8.1 15.85 8.8 16.9 L 7.6 18.05 Q 8.1 18.7 8.7 19.3 9.25 19.9 9.95 20.4 L 11.1 19.25 Q 12.15 19.9 13.4 20.2 L 13.4 21.85 Q 14.2 21.95 15.05 21.95 15.9 21.95 16.65 21.85 L 16.65 20.2 Q 17.9 19.9 19 19.25 L 20.15 20.4 Q 20.8 19.95 21.4 19.35 22 18.75 22.45 18.05 L 21.25 16.85 Q 21.95 15.85 22.2 14.65 L 23.95 14.65 Q 24.05 13.85 24.05 13 24.05 12.15 23.95 11.35 L 22.2 11.35 M 13.25 11.3 Q 14 10.55 15.05 10.55 16 10.55 16.75 11.3 17.5 12 17.5 13 17.5 14.05 16.75 14.7 16 15.45 15.05 15.45 14 15.45 13.25 14.7 12.6 14.05 12.6 13 12.6 12 13.25 11.3 Z';
        t[1]="<path stroke="+c[3]+" stroke-width='2' stroke-linejoin='round' stroke-linecap='round' fill='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[1]+" stroke='none' d='"+d+"'/>";
       break;

       case 'env':
        d = 'M 7.95 18.65 L 9.35 20.05 10.75 18.65 9.35 17.25 7.95 18.65 M 9.35 5.95 L 7.95 7.35 9.35 8.75 10.75 7.35 9.35 5.95 M 20.65 20.05 L 22.05 18.65 20.65 17.25 19.25 18.65 20.65 20.05 M 20.65 8.75 L 22.05 7.35 20.65 5.95 19.25 7.35 20.65 8.75 M 14 22 L 16 22 16 20 14 20 14 22 M 16 6 L 16 4 14 4 14 6 16 6 M 24 12 L 22 12 22 14 24 14 24 12 M 8 12 L 6 12 6 14 8 14 8 12 M 19.3 17.3 Q 21.05 15.55 21.05 13.05 21.05 10.5 19.3 8.75 17.55 7.05 15.05 7.05 12.55 7.05 10.8 8.75 9.05 10.5 9.05 13.05 9.05 15.55 10.8 17.3 12.55 19.05 15.05 19.05 17.55 19.05 19.3 17.3 Z';
        t[1]="<path stroke="+c[3]+" stroke-width='2' stroke-linejoin='round' stroke-linecap='round' fill='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[1]+" stroke='none' d='"+d+"'/>";
       break;

       case 'post':
        d = 'M 24 22 L 24 8 20 8 20 4 6 4 6 18 10 18 10 22 24 22 Z';
        t[1]="<path stroke="+c[3]+" stroke-width='2' stroke-linejoin='round' stroke-linecap='round' fill='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[1]+" stroke='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[2]+" stroke='none' d='M 20 8 L 20 4 6 4 6 18 10 18 10 8 20 8 Z'/>";
        break;

        case 'cam':
        d = 'M 23 20 L 24 20 24 6 23 6 19 10 18.05 10 18.05 6.05 6.05 6.05 6.05 20.3 18.05 20.3 18.05 16 19 16 23 20 Z';
        t[1]="<path stroke="+c[3]+" stroke-width='2' stroke-linejoin='round' stroke-linecap='round' fill='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[2]+" stroke='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[1]+" stroke='none' d='M 23 20 L 24 20 24 6 23 6 19 10 19 16 23 20 M 18 6.05 L 8 6.05 8 18.15 18 18.15 18 6.05 Z'/>";
        //t[1]+="<path fill="+c[0]+" stroke='none' d='M 10 4 L 6 8 19 8 24 4 10 4 Z'/>";
        break;

        /*case 'post':
        d = 'M 24 15 L 24 11 17 11 17 4 13 4 13 11 6 11 6 15 13 15 13 22 17 22 17 15 24 15 Z';
        t[1]="<path stroke="+c[3]+" stroke-width='2' stroke-linejoin='round' stroke-linecap='round' fill='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[1]+" stroke='none' d='"+d+"'/>";
        break;*/

        case 'mat':
        d = 'M 24 4 L 6 4 6 22 24 22 24 4 Z';
        t[1]="<path stroke="+c[3]+" stroke-width='2' stroke-linejoin='round' stroke-linecap='round' fill='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[2]+" stroke='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[1]+" stroke='none' d='M 15 4 L 6 4 6 13 15 13 15 4 M 24 13 L 15 13 15 22 24 22 24 13 Z'/>";
        break;

        /*case 'cam':
        d = 'M 24 18 L 24 4 10 4 6 8 6 22 19 22 24 18 Z';
        t[1]="<path stroke="+c[3]+" stroke-width='2' stroke-linejoin='round' stroke-linecap='round' fill='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[2]+" stroke='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[1]+" stroke='none' d='M 19 8 L 6 8 6 22 19 22 19 8 Z'/>";
        t[1]+="<path fill="+c[0]+" stroke='none' d='M 10 4 L 6 8 19 8 24 4 10 4 Z'/>";
        break;*/

        case 'asset':
        d = 'M 24 19.8 L 24 14.2 19.5 11.95 19.5 6.3 15 4.05 10.5 6.3 10.5 11.95 6 14.2 6 19.8 10.5 22.05 15 19.8 19.5 22.05 24 19.8 Z';
        t[1]="<path stroke="+c[3]+" stroke-width='2' stroke-linejoin='round' stroke-linecap='round' fill='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[2]+" stroke='none' d='"+d+"'/>";
        t[1]+="<path fill="+c[1]+" stroke='none' d='M 6 14.2 L 6 19.8 10.5 22.05 10.5 16.45 6 14.2 M 19.5 22.05 L 19.5 16.45 15 14.2 15 19.8 19.5 22.05 M 15 8.55 L 10.5 6.3 10.5 11.95 15 14.2 15 8.55 Z'/>";
        t[1]+="<path fill="+c[0]+" stroke='none' d='M 15 14.2 L 19.5 16.45 24 14.2 19.5 11.95 15 14.2 M 10.5 16.45 L 15 14.2 10.5 11.95 6 14.2 10.5 16.45 M 10.5 6.3 L 15 8.55 19.5 6.3 15 4.05 10.5 6.3 Z'/>";
        break;


    }
    t[2] = "</g></svg>";
    return t.join("\n");

}