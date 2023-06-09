import * as UIL from 'uil'
import { Main } from '../Main.js'
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

export const Gui = {

	ui:null,
	ui2:null,
	g1:null,
	g2:null,
	g3:null,
	gp:null,
	video:null,

	envui:null,

	//mat:null,
	currentMat:'',


	imageMap: ['map', 'map1', 'map2', 'emissiveMap', 'sheenColorMap'],
	imageNormal: [ 'normalMap', 'normalMap1','normalMap2','aoMap', 'metalnessMap', 'roughnessMap', 'alphaMap', ],
	
	MaterialMesh:[ 'Basic', 'Physical', 'Standard', 'Toon', 'Lambert', 'Phong', 'Shader' ],

	joy:null,
	p0: 'M 0.5 1.5 L 9.5 1.5 M 0.5 5.5 L 9.5 5.5 M 0.5 9.5 L 9.5 9.5',
	p1: 'M 1.5 0.5 L 1.5 9.5 M 5.5 0.5 L 5.5 9.5 M 9.5 0.5 L 9.5 9.5',

	bg:'rgba(33,33,33,0.5)',


	startMode:'ENV',
	mode:'',

	

	colors:{

		//sx: 4,
        //sy: 4,
        radius:0,

        showOver:0,

		background:'none', //'none',
		backgroundOver:'none',//'rgba(255,255,255,0.02)',

		//font:"'Roboto Mono', 'Source Code Pro', Consolas, monospace", 
		font:"Mulish, sans-serif", 
		fontSize:12,
		weight:'500',

		text:'#fff',
		title:'#eee',

		/*text:'rgba(0,0,6,1)',
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
		//overoff:'rgba(255,255,255,0.1)',*/

		
		borderSize:0,
		
		//groups:'rgba(255,255,255,0.1)',
		//gborder:'rgba(255,255,255,0.2)',

		joyOut: 'rgba(255,255,255,0.1)',
		joyOver:'rgba(127,255,0,0.2)',
        joySelect: '#7fFF00',

	},

	


	showHide: () => { 

		if( Gui.ui === null ) Gui.init()

		if( Gui.ui.isOpen ) Gui.ui.isOpen = false;
		else Gui.ui.isOpen = true;

		Gui.ui2.isOpen = Gui.ui.isOpen

		Hub.switchGuiButton( Gui.ui.isOpen )
		//Hub.switchColor( Gui.ui.isOpen )

		//UIL.Tools.setSvg( )


		//document.querySelector("#path").setAttributeNS(null, 'd', Gui.ui.isOpen ? Gui.p1 : Gui.p0)


		///Gui.button.childNodes[0].childNodes[ 0 ].setAttributeNS(null, 'd', Gui.ui.isOpen ? Gui.p1 : Gui.p0)

		Gui.ui.calc()
		Gui.ui.mode('def')

		Gui.ui2.calc()
		Gui.ui2.mode('def')

	},

	init:() => {

		Gui.colors.content = Gui.bg

		//Gui.colors.background = Gui.bg
		//Gui.colors.backgroundOver = Gui.bg
		//Gui.colors.groups = Gui.bg
		//Gui.colors.gborder = Gui.bg

		UIL.Tools.setStyle(Gui.colors)

		//const options = Main.getOption();

		

		const ui = new UIL.Gui( { w:250, h:25, open:false, close:false, css:'top:54px; right:5px;', colors:Gui.colors, transition:0 } )

		ui.add( 'empty', {h:6})

		ui.add( 'button', { type:'button', values:['ENV', 'PHY', 'CAM', 'POST', 'MAT'], value:Gui.startMode, selectable:true, unselect:false, p:0, h:40, radius:4 }).onChange( Gui.setMode )

		ui.add( 'empty', {h:6})

		Gui.ui = ui;

		Gui.ui2 = new UIL.Gui( { w:250, h:25, open:false, close:false, css:'top:112px; right:5px;', colors:Gui.colors, transition:0 } )


		//Gui.display()

		Gui.setMode(Gui.startMode)


		return

		/*let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; '


		*/

		//console.log(ui)
		//if( options.mode === 'HIGH' ) ui.content.style.backdropFilter = 'blur(4px)'




		

		//ui.add( 'empty', {h:3})

		//ui.add( 'bool', { name:'CAPTURE', onName:'STOP', value:false, mode:1 }).onChange( Gui.capture )
		//ui.add('button', { name:'CAMERA' }).onChange( function(){ console.log( controls.getInfo() )} )


		//ui.add( 'empty', {h:6})

		
		

		//ui.add( 'empty', {h:3})

		
		

		

		//Gui.display()

	},

	setMode( name ){

		if(Gui.mode === name) return
		Gui.mode = name;
	    Gui.ui2.clear()

	    switch(Gui.mode){
	    	case 'ENV': Gui.display(); break;
	    	case 'PHY': Gui.physics(); break;
	    	case 'CAM': Gui.camera(); break;
	    	case 'POST': Gui.postprocess(); break;
	    	case 'MAT': Gui.material(); break;
	    }

	    Gui.ui2.add( 'empty', {h:6})

	},

	display:() => {

		const ui = Gui.ui2

		const mode = 2

		

		const options = Main.getOption()
		const setting = Main.getSetting()
		const renderer = Main.getRenderer()
		const scene = Main.getScene()
		const toneMappingOptions = Main.getToneMappingOptions()

		ui.add( options, 'mode', { type:'button', values:['LOW', 'HIGH'], selectable:true, unselect:false, p:0 }).onChange( Main.changeMode )

		ui.add( options, 'harmony', { type:'bool' }).onChange( Hub.harmony )
		ui.add( options, 'show_light', { type:'bool' }).onChange( Main.showDebugLight )
		ui.add( options, 'show_stat', { type:'bool' }).onChange( Main.showStatistic )
		ui.add( options, 'exposure', { min:0, max:4, mode:mode } ).onChange( function( v ){ 
			renderer.toneMappingExposure = v 
			Env.up()
		})

		ui.add( options, 'shadow', { min:0, max:1, mode:mode } ).onChange( Main.setShadow ).listen()


		ui.add( options, 'light_1', { rename:'Light Direct', min:0, max:10, mode:mode, color:'#ff0' } ).onChange( Main.lightIntensity )
		ui.add( options, 'light_2', { rename:'Light Sphere', min:0, max:10, mode:mode, color:'#ff0' } ).onChange( Main.lightIntensity )
		ui.add( options, 'envPower', { min:0, max:3, mode:mode, color:'#ff0' } ).onChange( Main.envmapIntensity )

		Gui.envui = ui.add( 'list', { name:'Envmap', list:Main.envList, value:options.envmap, path:'assets/textures/equirectangular/mini/', format:'.jpg', m:0, imageSize: [128,64], h:40}).onChange( Main.setEnv )

		

		//return

		
		

		
		/*g.add( options, 'tone',  { type:'list', list:toneMappingOptions, full:true }).onChange( function(v){
			renderer.toneMapping  = toneMappingOptions[ options.tone ]
		})

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
		*/

		

	},

	physics:() => {

		if( Gui.mode !== 'PHY' ) return
		const ui = Gui.ui2

	    //ui.add('title', { name:Main.engineType, align:'center', h:30})

	    ui.add('button', { values:Main.engineList, selectable:true, value:Main.engineType, h:30  }).onChange( Gui.swapEngine )
		//if( Main.devMode ) ui.add('button', { values:['RAPIER','CANNON'], selectable:true, value:Main.engineType }).onChange( Gui.swapEngine )
		ui.add( 'bool', { name:'WORKER OFF', onName:'WORKER ON', value:Main.isWorker, mode:1 }).onChange( Gui.swapWorker )
		ui.add( 'empty', {h:6})

	    ui.add( 'button', { type:'button', values:['DRAG', 'SHOOT', 'BUILD'], value:'DRAG', selectable:true, unselect:false, p:0 }).onChange( (n)=>{ 
			phy.mouseMode( n.toLowerCase() );
		})

	    let rrr = ui.add( 'button', { type:'button', values:['REPLAY', 'PAUSE'], p:0 }).onChange( (n)=>{ 
			//if(n === 'EDIT'){ Main.showEditor(true); this.switchValues(0, 'CLOSE' ); }
			//if(n === 'CLOSE'){ Main.showEditor(false); this.switchValues(0, 'EDIT' ); }
			if(n === 'PAUSE'){ phy.pause( true ); rrr.switchValues(1, 'PLAY' ); }
			if(n === 'PLAY'){ phy.pause( false ); rrr.switchValues(1, 'PAUSE' ); }
			if(n === 'REPLAY') Main.injectCode( Main.getCode() )
		})

	},

	camera:() => {

		if( Gui.mode !== 'CAM' ) return
		const ui = Gui.ui2

	},

	postprocess:( direct ) => {

		if( Gui.mode !== 'POST' ) return
    	const ui = Gui.ui2
        const options = Main.getOption()
         

        if(!direct){
        	ui.clear() 
        	ui.add( options, 'renderMode', { type:'selector', values:[0,1,2,3], selectable:true, unselect:false, p:0, h:24 }).onChange( function(n){ 

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
        	ui.add( options, 'composer', { type:'bool', rename:'POST PROCESS OFF', onName:'POST PROCESS ON', mode:1, h:40 }).onChange( Main.setComposer )
        	Gui.gp = ui.add('group', { name:'OPTION' })
        }

        let g = Gui.gp
        g.clear()

		const composer = Main.getComposer()
		const scene = Main.getScene()
		const mode = 0
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

	reset: ( name ) => {

		if( Gui.ui===null ) return
		if( !Gui.ui.isOpen ) return

		Gui.materialEdit( '' )
	},

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
		if( Gui.video ) Gui.video.update(  )
	},

    /*addJoystick:() => {
    	Gui.joy = UIL.add('Joystick', {  w:160, mode:1, text:false, pos:{left:'10px', bottom:'30px' }, simple:true })//.onChange( callbackSize )
    }*/

    material:() => {

    	if( Gui.mode !== 'MAT' ) return
    	const ui = Gui.ui2
        ui.clear()


		let mats = Main.motor.getMaterialList()
		let matList = ui.add( 'list', { name:'', list:mats, p:0, value:Gui.currentMat, h:40 }).onChange( Gui.materialEdit )

		if(! Gui.currentMat ) { 
			matList.text('Select Material') 
			return
		}
		
		let m = mats[ Gui.currentMat ]

		let type = m.type
		if( type.search( 'Mesh' )!==-1 ) type = type.substring( 4 ) 

		let mm = type.search( 'Material' )
		type = type.substring( 0, mm )

		ui.add( 'list', { name:'', list:Gui.MaterialMesh, p:0, value:type, h:30 }).onChange()

		//return

	    if(m.color!==undefined){
		    m.cc = m.color.getHex()
		    ui.add( m, 'cc', { type:'color', rename:'color' } ).onChange( function( c ){ m.color.setHex( c ); } )
		}

		if(m.emissive!==undefined){
		    m.em = m.emissive.getHex()
		    ui.add( m, 'em', { type:'color', rename:'emissive' } ).onChange( function( c ){ m.emissive.setHex( c ); } )
		}


	    let images = [...Gui.imageMap, ...Gui.imageNormal ], t, str

	    for( let i = 0; i<images.length; i++ ){
	    	t = images[i]
	    	name = 'null'
	    	if(m[t]){
	    		str = m[t].source.data.currentSrc;
	    	    name = str.substring( str.lastIndexOf('/')+1 )
	    	} 
	    	if(m[t]!==undefined) ui.add( 'bitmap',  { name:t, value:name, type:'bitmap' }).onChange( function( file, img, name ){ Gui.setTexure(file, img, name, m ) } )

	    }

	    if(m.randomUv!==undefined) ui.add( m, 'randomUv', {  })
		if(m.wireframe!==undefined) ui.add( m, 'wireframe', {  })
		if(m.vertexColors!==undefined) ui.add( m, 'vertexColors', {  })
		if(m.forceSinglePass!==undefined) ui.add( m, 'forceSinglePass', { rename:'singlePass' })
		if(m.visible!==undefined) ui.add( m, 'visible', {  })
		if(m.depthTest!==undefined) ui.add( m, 'depthTest', {  })
		if(m.depthWrite!==undefined) ui.add( m, 'depthWrite', {  })
		if(m.alphaToCoverage!==undefined) ui.add( m, 'alphaToCoverage', {  })
		if(m.premultipliedAlpha!==undefined) ui.add( m, 'premultipliedAlpha', {  })
		if(m.transparent!==undefined) ui.add( m, 'transparent', {  })

		if(m.side!==undefined) ui.add( m, 'side', { type:'list', list:{ front:0, back:1, double:2 } }).onChange( function( c ){ m.side = this.list.indexOf(c) })
		if(m.shadowSide!==undefined) ui.add( m, 'shadowSide', { type:'list', list:{ front:0, back:1, double:2 } }).onChange( function( c ){ m.shadowSide = this.list.indexOf(c) })


	    if(m.metalness!==undefined) ui.add( m, 'metalness', { min:0, max:1 })
		if(m.roughness!==undefined) ui.add( m, 'roughness', { min:0, max:1 })

		if(m.specularIntensity!==undefined) ui.add( m, 'specularIntensity', { min:0, max:1 })
		if(m.aoMapIntensity!==undefined) ui.add( m, 'aoMapIntensity', { min:0, max:1 })
		if(m.emissiveIntensity!==undefined) ui.add( m, 'emissiveIntensity', { min:0, max:1 })

		if(m.opacity!==undefined) ui.add( m, 'opacity', { min:0, max:1 })
		if(m.reflectivity!==undefined) ui.add( m, 'reflectivity', {min:0, max:1})

		if(m.reflectif!==undefined) ui.add( m, 'reflectif', { min:0, max:1 })

	    if(m.envMapIntensity!==undefined) ui.add( m, 'envMapIntensity', { rename:'env', min:0, max:4 })
	    if(m.thickness!==undefined) ui.add( m, 'thickness', { min:-4, max:4 })
	    if(m.clearcoat!==undefined) ui.add( m, 'clearcoat', { min:0, max:4 })
	    if(m.clearcoatRoughness!==undefined) ui.add( m, 'clearcoatRoughness', { min:0, max:4 })

	    if(m.sheen!==undefined){ 
	    	ui.add( m, 'sheen', {min:0, max:4})
	    	ui.add( m, 'sheenRoughness', {min:0, max:1})
	    	m.ss = m.sheenColor.getHex()
	    	ui.add( m, 'ss', { type:'color', rename:'sheen' } ).onChange( function( c ){ m.sheenColor.setHex( c ); } )
	    }

	    if(m.iridescence!==undefined) ui.add( m, 'iridescence', {min:0, max:1})

	    if(m.anisotropy!==undefined) ui.add( m, 'anisotropy', {min:0, max:1})
	    if(m.anisotropyRotation!==undefined) ui.add( m, 'anisotropyRotation', {min:0, max:1})

	    if(m.ior!==undefined) ui.add( m, 'ior', { min:0, max:4 })
	    if(m.transmission!==undefined) ui.add( m, 'transmission', { min:0, max:1 })


		//Gui.mat.open()

		//

	},

	setTexure:( file, img, name, mat, o = {} ) => {

		let ref = mat[name]
		if(ref){
			o.repeat = ref.repeat.toArray()
		}

		o.encoding = Gui.imageMap.indexOf(name) !== -1
		
		let fileName = file.substring( 0, file.lastIndexOf('.') );
		let im = new Image()
		 
		im.src = img
		im.onload = function (){

			Pool.data.set( 'I_' + fileName, im )
		    mat[name] = Pool.getTexture( fileName, o )

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