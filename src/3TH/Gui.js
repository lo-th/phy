import * as UIL from 'uil'
import { Main } from '../Main.js'

import { Video } from './Video.js'
import { Env } from './Env.js'
import { Hub } from './Hub.js'
import { Shader } from './Shader.js'
/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/

export const Gui = {

	ui:null,
	g1:null,
	g2:null,
	g3:null,
	gp:null,
	video:null,

	joy:null,
	p0: 'M 0.5 1.5 L 9.5 1.5 M 0.5 5.5 L 9.5 5.5 M 0.5 9.5 L 9.5 9.5',
	p1: 'M 1.5 0.5 L 1.5 9.5 M 5.5 0.5 L 5.5 9.5 M 9.5 0.5 L 9.5 9.5',

	colors:{

		sx: 4,
        sy: 2,
        radius:3,

		background:'none',
		backgroundOver:'none',//'rgba(255,255,255,0.02)',

		//font:"'Roboto Mono', 'Source Code Pro', Consolas, monospace", 
		font:"Mulish, sans-serif", 
		fontSize:14,
		weight:'500',

		text:'rgba(0,0,6,1)',
		title:'rgba(0,0,6,1)',
		titleoff: '#000',
		textOver: '#7fFF00',
		textSelect: '#7fFF00',

		button:'rgba(255,255,255,0.1)',
		overoff : 'rgba(0,0,6,0.3)',
		over:'rgba(0,0,6,0.2)',
		select:'rgba(0,0,6,0.75)',
		
		//fontShadow:'#000006',
		
		border:'rgba(255,255,255,0.2)',//
		borderSize:1,
		//overoff:'rgba(255,255,255,0.1)',
		
		groups:'rgba(255,255,255,0.1)',
		gborder:'rgba(255,255,255,0.2)',

		joyOut: 'rgba(255,255,255,0.1)',
		joyOver:'rgba(127,255,0,0.2)',
        joySelect: '#7fFF00',
		//fontFamily: 'Tahoma',

	},

	showHide: () => { 

		if( Gui.ui===null ) Gui.init()

		if( Gui.ui.isOpen ) Gui.ui.isOpen = false;
		else Gui.ui.isOpen = true;

		Hub.switchGuiButton( Gui.ui.isOpen )

		//UIL.Tools.setSvg( )


		//document.querySelector("#path").setAttributeNS(null, 'd', Gui.ui.isOpen ? Gui.p1 : Gui.p0)


		///Gui.button.childNodes[0].childNodes[ 0 ].setAttributeNS(null, 'd', Gui.ui.isOpen ? Gui.p1 : Gui.p0)

		Gui.ui.calc()
		Gui.ui.mode('def')

	},

	init:() => {

		UIL.Tools.setStyle(Gui.colors)

		const options = Main.getOption();

		const ui = new UIL.Gui( { w:250, h:24, open:false, close:false, css:'top:54px; right:5px;', colors:Gui.colors } )
		if( options.mode === 'HIGH' ) ui.content.style.backdropFilter = 'blur(4px)'
		//ui.add('button', { values:Main.engineList, selectable:true, value:Main.engineType  }).onChange( Gui.swapEngine )
		//if( Main.devMode ) ui.add('button', { values:['RAPIER','CANNON'], selectable:true, value:Main.engineType }).onChange( Gui.swapEngine )
		//ui.add( 'bool', { name:'WORKER OFF', onName:'WORKER ON', value:Main.isWorker, mode:1 }).onChange( Gui.swapWorker )

		//ui.add( 'empty', {h:3})

		//ui.add( 'bool', { name:'CAPTURE', onName:'STOP', value:false, mode:1 }).onChange( Gui.capture )
		//ui.add('button', { name:'CAMERA' }).onChange( function(){ console.log( controls.getInfo() )} )


		//ui.add( 'empty', {h:6})

		ui.add( 'button', { type:'button', values:['DRAG', 'SHOOT', 'BUILD'], value:'DRAG', selectable:true, p:0 }).onChange( (n)=>{ 
			phy.mouseMode( n.toLowerCase() );
		})
		

		//ui.add( 'empty', {h:3})

		ui.add( 'button', { type:'button', values:['REPLAY', 'PAUSE'], selectable:false, p:0 }).onChange( (n)=>{ 
			//if(n === 'EDIT'){ Main.showEditor(true); this.switchValues(0, 'CLOSE' ); }
			//if(n === 'CLOSE'){ Main.showEditor(false); this.switchValues(0, 'EDIT' ); }
			if(n === 'PAUSE'){ phy.pause( true ); this.switchValues(1, 'PLAY' ); }
			if(n === 'PLAY'){ phy.pause( false ); this.switchValues(1, 'PAUSE' ); }
			if(n === 'REPLAY') Main.injectCode( Main.getCode() )
		})
		

		Gui.ui = ui;

		Gui.display()

	},

	display:() => {

		const mode = 0

		const options = Main.getOption()
		const setting = Main.getSetting()
		const renderer = Main.getRenderer()
		const scene = Main.getScene()
		const toneMappingOptions = Main.getToneMappingOptions()

		//const g = Gui.ui.add('group', { name:'DISPLAY' })
		const ui = Gui.ui

		ui.add( options, 'mode', { type:'button', values:['LOW', 'HIGH'], selectable:true, p:0 }).onChange( Main.changeMode )


		ui.add( options, 'show_light', { type:'bool' }).onChange( Main.showDebugLight )
		ui.add( options, 'show_stat', { type:'bool' }).onChange( Main.showStatistic )
		ui.add( options, 'exposure', { min:0, max:4, mode:mode } ).onChange( function( v ){ 
			renderer.toneMappingExposure = v 
			Env.up()
		})

		ui.add( options, 'shadow', { min:0, max:1, mode:mode } ).onChange( Main.setShadow ).listen()


		ui.add( options, 'renderMode', { type:'selector', values:[0,1,2,3], selectable:true, p:0, h:24 }).onChange( function(n){ 

			if( n!== 0 ) scene.helper.visible = false
			if( n===1 ) { Env.setBackgroud(0x000000) /*camera.near = 1; camera.updateProjectionMatrix();*/}
			else if( n===2 ) Env.setBackgroud(0x7777ff)
			else if( n===3 ) Env.setBackgroud(0xffffff)
			else {
				Env.setBackgroud()
				scene.helper.visible = true
			}
			//Hub.setRenderMode( n )
			Shader.up( options ) 
		})

		Gui.camera(ui)
		Gui.postprocess(ui)
		
		return

		
		g.add( options, 'tone',  { type:'list', list:toneMappingOptions, full:true }).onChange( function(v){
			renderer.toneMapping  = toneMappingOptions[ options.tone ]
		})

		
		g.add( options, 'envPower', { min:0, max:2, mode:mode} ).onChange( setEnvmapIntensity )

		g.add( options, 'light_1', { min:0, max:10, mode:mode } ).onChange( function( v ){ light.intensity = v } )
		g.add( options, 'light_2', { min:0, max:10, mode:mode } ).onChange( function( v ){ light2.intensity = v } )

		g.add( 'empty', {h:6})

		

		g.add( 'empty', {h:6})

		g.add( 'bool', { name:'ground', value:setting.ground }).onChange( showGround )

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

		g.add( 'empty', {h:6})

		envui = g.add( 'list', { name:'envmap', list:Envs, value:options.envmap, path:'assets/textures/equirectangular/mini/', format:'.jpg', m:0, imageSize: [128,64], h:64}).onChange( setEnv )//.listen()

		g.add( 'empty', {h:6})

	},

	camera:(gg) => {
		const controls = Main.getControler()
		let g = gg.add('group', { name:'CAMERA' })
	},

	postprocess:(gg) => {

		if(Gui.gp) { Gui.gp.clear() }
		else Gui.gp = gg.add('group', { name:'POST PROCESS' })

		const options = Main.getOption()
		const mode = 0
		const scene = Main.getScene()

		//

		Gui.gp.add( options, 'composer', { type:'bool', rename:'POST PROCESS OFF', onName:'POST PROCESS ON', mode:1, h:30 }).onChange( Main.setComposer )

		const composer = Main.getComposer()
		if(!composer) return

		let g = Gui.gp

	    
		
		
		
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

	demo:(gg) => {

		return

		let data = Main.getDemos()

		/*let colors = [
		'rgba(180,255,180,0.1)',
		'rgba(255,255,180,0.1)',
		'rgba(255,180,180,0.1)'
		]*/

		let colors = [
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

	},

	resetDemoGroup: ( name ) => {

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

	},

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
		if( Gui.video ) Gui.video.update(  )
	},

    /*addJoystick:() => {
    	Gui.joy = UIL.add('Joystick', {  w:160, mode:1, text:false, pos:{left:'10px', bottom:'30px' }, simple:true })//.onChange( callbackSize )
    }*/

}