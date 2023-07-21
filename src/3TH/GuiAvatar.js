//import * as UIL from 'uil';
import * as UIL from '../libs/uil.module.js'
import { Shader } from './Shader.js';



export class Gui {

	constructor( ref, ref2, fun, fun2, fun3, fun4 ) {

		this.ref = ref;
		this.ref2 = ref2;
		this.playAnim = fun3
		this.upMaterial = fun4

		let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; '
		this.debug = document.createElement('div');
	    this.debug.style.cssText = unselectable + "font-family: monospace; position:absolute; top:10px; left:10px; width:200px; height:200px; pointer-events:none; color:#CCC;";
	    document.body.appendChild(this.debug);

	    let colors = {

			sx: 4,
	        sy: 2,
	        radius:3,

			background:'none',
			backgroundOver:'none',//'rgba(255,255,255,0.02)',

			//font:"'Roboto Mono', 'Source Code Pro', Consolas, monospace", 
			font:"Mulish, sans-serif", 
			fontSize:14,
			weight:'500',

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
			//overoff:'rgba(255,255,255,0.1)',
			
			groups:'rgba(255,255,255,0.1)',
			gborder:'rgba(255,255,255,0.2)',

			joyOut: 'rgba(255,255,255,0.1)',
			joyOver:'rgba(127,255,0,0.2)',
	        joySelect: '#7fFF00',
			//fontFamily: 'Tahoma',*/

		}

		const ui = new UIL.Gui({ colors:colors })
		ui.add( 'title',  { name:'AVATAR 3.0', h:30, align:'center' })

		//ui.add('button', { name:'EXPORT ANIMATION', h:30 }).onChange( function (b){ ref.export(); } )
		//ui.add('button', { name:'EXPORT MODEL', h:30 }).onChange( function (b){ ref.exportGLB(); } )

		ui.add( 'bool', { name:'helper', value:false, h:20 }).onChange( function (b){ ref.addHelper(b); ref2.addHelper(b);}	 )
		ui.add( 'bool', { name:'exo', value:false, h:20 }).onChange( function (b){ ref.addExo(b); ref2.addExo(b);}	 )

		//ui.add( 'bool', { name:'CLONE TEST', value:false, h:20 }).onChange( function (b){ fun(b); } )
		ui.add( 'bool', { name:'REFLECT', value:false, h:20 }).onChange( function (b){ fun2(b); } )

		ui.add( 'slide', { name:'scale', value: 1, min:0, max:2 }).onChange( function (v){ ref.setBoneScale(v); ref2.setBoneScale(v);} )

		ui.add( 'bool', { name:'ADD CLONE', onName:'REMOVE CLONE', value:false, mode:1 }).onChange( function (b){ fun(b); } )
		

		this.groupMaterial = ui.add('group', { name:'MATERIAL', h:30 })

		let setting = Shader.setting()

		this.groupMaterial.add( setting.renderMode, 'value',{ rename:'mode', min:0, max:3, precision:0 })
		this.groupMaterial.add( setting.shadow, 'value', { rename:'shadow', min:0, max:1 })
		this.groupMaterial.add( setting.shadowLuma, 'value', { rename:'luma', min:0, max:1 })
		this.groupMaterial.add( setting.shadowContrast, 'value', { rename:'contrast', min:0, max:1 })
		this.groupMaterial.add( setting.shadowGamma, 'value', { rename:'gamma', min:0, max:3 })
		this.groupMaterial.add( setting.nearPlane, 'value', { rename:'nearplane', min:0, max:50 })


		this.groupMaterial.add('empty', { h:20 } )

		//setting = ref.setting

		//this.groupMaterial.add(ref.setting, 'mixRatio', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); } )
		//this.groupMaterial.add(ref.setting, 'threshold', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); } )
		this.groupMaterial.add(ref.setting, 'normal', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )
		

		this.groupMaterial.add(ref.setting, 'roughness', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )
		this.groupMaterial.add(ref.setting, 'metalness', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )
		this.groupMaterial.add(ref.setting, 'clearcoat', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )

		this.groupMaterial.add(ref.setting, 'sheen', { min:0, max:5 }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )
		this.groupMaterial.add(ref.setting, 'sheenRoughness', { min:0, max:1 }).onChange( function (b){ ref.setMaterial();this.upMaterial(ref.setting); }.bind(this) )

		this.groupMaterial.add(ref.setting, 'wireframe', { type:'bool' }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting); }.bind(this) )
		this.groupMaterial.add(ref.setting, 'vertexColors', { type:'bool' }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )


		this.groupMaterial.add('empty', { h:20 } )
		this.groupMaterial.add(ref.setting, 'hair', { type:'color' } ).onChange( function( c ){ ref.setMaterial(); this.upMaterial(ref.setting); }.bind(this) )
		/*let l2 = ['zero', 'one', 'srcColor', 'oneSrcColor', 'srcAlpha', 'oneSrcAlpha', 'dstAlpha', 'oneDstAlpha', 'dstColor', 'oneDstColor', 'saturate']
		let l3 = ['zero', 'one', 'srcColor', 'oneSrcColor', 'srcAlpha', 'oneSrcAlpha', 'dstAlpha', 'oneDstAlpha', 'dstColor', 'oneDstColor']
		this.groupMaterial.add(ref.setting, 'equation', { type:'list', list:['add', 'sub', 'rsub', 'min', 'max'] }).onChange( function (b){ ref.setBlending(); } )
		this.groupMaterial.add(ref.setting, 'blendSrc', { type:'list', list:l2, full:true }).onChange( function (b){ ref.setBlending(); } )
		this.groupMaterial.add(ref.setting, 'blendDst', { type:'list', list:l3, full:true }).onChange( function (b){ ref.setBlending(); } )
		this.groupMaterial.add(ref.setting, 'equationA', { type:'list', list:['add', 'sub', 'rsub', 'min', 'max'] }).onChange( function (b){ ref.setBlending(); } )
		this.groupMaterial.add(ref.setting, 'blendSrcA', { type:'list', list:l2, full:true }).onChange( function (b){ ref.setBlending(); } )
		this.groupMaterial.add(ref.setting, 'blendDstA', { type:'list', list:l3, full:true }).onChange( function (b){ ref.setBlending(); } )*/
		this.groupMaterial.add(ref.setting, 'alphaTest', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )
		this.groupMaterial.add(ref.setting, 'h_metal', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )
		this.groupMaterial.add(ref.setting, 'h_rough', { min:0, max:1 }).onChange( function (b){ ref.setMaterial(); this.upMaterial(ref.setting);}.bind(this) )



		
		this.groupAnim = ui.add('group', { name:'ANIMATION', h:30 })

		//g0.add( ref, 'animations', { type:'list', h:20 })//.listen()




		const g2 = ui.add('group', { name:'DISPLAY', h:30 })
	

		for( let m in ref.mesh ) g2.add( ref.mesh[m], 'visible', { rename:m, h:20 }).onChange( function (v){ if( ref2 ) ref2.mesh[m].visible = v; } )
		
        


        this.groupMorph = ui.add('group', { name:'MORPH', h:30 })

        const morphlist = ['MUSCLE', 'LOW', 'BIG', 'MONSTER', 'Surprised', 'SmileOpen', 'Smile', 'Shock', 'Frown', 'Flirting', 'Angry', 'Afraid']
        let i = morphlist.length, name
        while(i--){
        	this.groupMorph.add('slide', { min:0, max:1, name:morphlist[i] }).onChange( function (v){ ref.setMorph(this.name, v); if(ref2)ref2.setMorph(this.name, v); } )
        }

        /*const g4 = ui.add('group', { name:'SAVE', h:30 })
        g4.add('button', { name:'SAVE ANIMATION' }).onChange( function(){  ref.exportAnimationLzma( UIL.Files.save ) })
        g4.add('button', { name:'SAVE MODEL' }).onChange( function(){  ref.exportGLB( UIL.Files.save ) })*/

        //g4.add('button', { name:'LOAD ANIMATION' }).onChange( function(){  ref.loadCompactAnimation() })
		

		this.timebarre = new Timebarre( document.body, '#ff4545', ref, ref2 );
		this.timebarre.show()

		this.getAnimation()

	}


	getAnimation(){

		let list = [];
		let list2 = [];

		this.groupAnim.close();

		this.ref.actions.forEach( function ( action, key ) { 
			list.push( key );
			if( key === key.toUpperCase() ) list2.push( key );
			//list.push( key )
		});

		list.sort();

		if( this.an ) this.an.dispose()

		this.an = this.groupAnim.add( 'grid', { values:list, selectable:true, value:this.ref.current? this.ref.current.name:'IDLE', bsize:[110, 20] }).onChange( function(s){ 
			this.ref.play(s); this.ref2.play(s); 
			this.playAnim(s)
		}.bind(this) )
	    this.groupAnim.open()

	}

	log( s ){
		this.debug.innerHTML = s;
	}

	resize() {

        this.timebarre.resize();

    }

	updateTimeBarre ( frame, frameMax ) {

        if( !this.timebarre.isHide ) {

            this.timebarre.setTotalFrame( frameMax );
            this.timebarre.update( frame );

        }

    }
}



class Timebarre {

	constructor( p, sel, ref, ref2 ) {

		this.ref = ref;
		this.ref2 = ref2;
	    this.select = sel;

	    let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; '


	    this.playIcon = "<svg width='18px' height='17px'><path fill='#CCC' d='M 14 8 L 5 3 4 4 4 13 5 14 14 9 14 8 Z'/></svg>";
	    this.pauseIcon = "<svg width='18px' height='17px'><path fill='#CCC' d='M 14 4 L 13 3 11 3 10 4 10 13 11 14 13 14 14 13 14 4 M 8 4 L 7 3 5 3 4 4 4 13 5 14 7 14 8 13 8 4 Z'/></svg>";

	    this.playing = true;

	    this.parent = p;

	    this.down = false;
	    this.isHide = true;

	    this.width = window.innerWidth - 80;
	    this.totalFrame = 0;
	    this.frame = 0;
	    this.ratio = 0;

	    this.content = document.createElement('div');
	    this.content.style.cssText = "position:absolute; bottom:0; left:0px; width:100%; height:50px; pointer-events:none; display:none;";
	    this.parent.appendChild( this.content );

	    this.timeInfo = document.createElement('div');
	    this.timeInfo.style.cssText = unselectable + "font-family: Mulish, sans-serif; position:absolute; bottom:36px; left:60px; width:200px; height:10px; pointer-events:none; color:#CCC;";
	    this.content.appendChild(this.timeInfo);

	    this.timeline = document.createElement('div');
	    this.timeline.style.cssText = "position:absolute; bottom:20px; left:60px; width:"+this.width+"px; height:5px; border:3px solid rgba(255,255,255,0.2); pointer-events:auto; cursor:pointer;";
	    this.content.appendChild(this.timeline);

	    this.framer = document.createElement('div');
	    this.framer.style.cssText = unselectable + " position:absolute; top:0px; left:0px; width:1px; height:5px; background:#CCC; pointer-events:none;";
	    this.timeline.appendChild(this.framer);

	    this.playButton = document.createElement('div');
	    this.playButton.style.cssText = "position:absolute; top:5px; left:10px; width:18px; height:18px; pointer-events:auto; cursor:pointer; border:3px solid rgba(255,255,255,0.2); padding: 5px 5px;box-sizing: content-box;";
	    this.content.appendChild( this.playButton );

	    this.playButton.innerHTML = this.playing ? this.playIcon : this.pauseIcon;
	    this.playButton.childNodes[0].childNodes[0].setAttribute('fill', '#CCC');

	    var _this = this;
	    //window.addEventListener( 'resize', function(e){ _this.resize(e); }, false );
	    this.timeline.addEventListener( 'mouseover', function ( e ) { _this.tOver(e); }, false );
	    this.timeline.addEventListener( 'mouseout', function ( e ) { _this.tOut(e); }, false );

	    this.timeline.addEventListener( 'mousedown', function ( e ) {  _this.tDown(e); }, false );
	    document.addEventListener( 'mouseup', function ( e ) {  _this.tUp(e); }, false );
	    document.addEventListener( 'mousemove', function ( e ) {  _this.tMove(e); }, false );//e.stopPropagation();

	    this.playButton.addEventListener('mousedown',  function ( e ) { _this.play_down(e); }, false );
	    this.playButton.addEventListener('mouseover',  function ( e ) { _this.play_over(e); }, false );
	    this.playButton.addEventListener('mouseout',  function ( e ) { _this.play_out(e); }, false );
	}

    inPlay ( e ) {
        this.playing = true;
        this.playButton.innerHTML = this.playIcon;
    }

    play_down ( e ) {

        if( this.playing ){ 
            this.playing = false;
            this.ref.pause();
            this.ref2.pause();
            //main.model.pause();
        } else {
            this.playing = true;
            this.ref.unPause();
            this.ref2.unPause();
            //main.model.unPause();
        }

        this.playButton.innerHTML = this.playing ? this.playIcon : this.pauseIcon;

    }

    play_over ( e ) { 

        //this.playButton.style.border = "1px solid " + selectColor;
        //this.playButton.style.background = selectColor;
        this.playButton.childNodes[0].childNodes[0].setAttribute('fill', this.select );

    }

    play_out ( e ) { 

        //this.playButton.style.border = "1px solid #3f3f3f";
        //this.playButton.style.background = 'none';
        this.playButton.childNodes[0].childNodes[0].setAttribute('fill', '#CCC');

    }

    show () {

        if(!this.isHide) return;
        this.content.style.display = 'block';
        this.isHide = false;
    }

    hide () {

        if(this.isHide) return;
        this.content.style.display = 'none';
        this.isHide = true;

    }
    
    setTotalFrame( t ){

        this.totalFrame = t;
        this.ratio = this.totalFrame / this.width;
        this.timeInfo.innerHTML = this.totalFrame + ' frames';

    }

    resize(e){

        this.width = window.innerWidth - 80;
        this.timeline.style.width = this.width+'px';
        this.ratio = this.totalFrame / this.width;

    }

    update ( f ) {

        //if( this.isHide ) return;

        this.frame = f;
        this.timeInfo.innerHTML = this.frame + ' / ' + this.totalFrame;
        this.framer.style.width = this.frame / this.ratio + 'px';

    }

    tOut(e){

        if(!this.down) this.framer.style.background = "#CCC";

    }

    tOver(e){

        this.framer.style.background = this.select;

    }

    tUp(e){

        this.down = false;
        this.framer.style.background = "#CCC";

    }

    tDown(e){

        this.down = true;
        this.tMove(e);
        this.playing = false;
        this.playButton.innerHTML = this.playing ? this.playIcon : this.pauseIcon;
        this.framer.style.background = this.select;

    }

    tMove(e){

        if(this.down){
            var f = Math.floor((e.clientX-63)*this.ratio);
            if(f<0) f = 0;
            if(f>this.totalFrame) f = this.totalFrame; 
            this.frame = f;
            this.ref.playOne( this.frame );
            this.ref2.playOne( this.frame );
        }
    }

}