import * as UIL from '../libs/uil.module.js'
import { Pool } from './Pool.js';
import { Motor } from '../motor/Motor.js'

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/


const Styles = {
    menuName:'font-size:14px; font-weight:400; letter-spacing: -0.022em; text-shadow: 1px 1px 2px black;',
    demoName:'font-size:14px; width:fit-content; font-weight:400; letter-spacing: -0.022em; text-shadow: 1px 1px 2px black;',
}
//text-shadow: 1px 1px 3px #000000;
//letter-spacing: -0.022em;

let Main = null;

// menu look option
let isLiner = false;
let isBackLight = false;
let isFromTop = true;
let isTopDown = true;


//

const marge = [40,40];

let svg = UIL.Tools.dom;
let setSvg = UIL.Tools.setSvg;
let grad = UIL.Tools.makeGradiant;

let parent;
let content, cross = null, border, counter, counter2, zone, path, txt, info, loader, textRight, textLeft, textLeft2;
let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';

let menu, pin, title, engine, demo, downMenu, innerMenu, zoning, guiButton, overpad, prevOver, tmpLeft = 0;
let corner

let top = null;
let ratio = 1;
let listHeight = 0;
let listTop = 60//54;
let maxHeight = 0;
let sh = 0, range = 0;
let maxListItem = 10;
let full = true;

let guiOpen = false;

let currentMenu = ''

let h1,h2

const listdata = {
    home : ['Code', 'Worker', 'Github', 'Docs'],
    engine : [],
    demo:[],
    visited:[],
}

let isDisplay = false;

let a_base = [ 1, 0, 0, 1,   0, 1, -1, 0,  -1, 0, 0, -1,   0, -1, 1, 0 ];

let crossTween = null;

let camera, panel, panelMat;

let isSnipper = false;

let isReady = false;
let fps = null;
let statistics = null;
let debug = null;

let isPanel3D = false;

let joy = null;

let lock = false;
let timeout = null;

let isDay = false;
let color = '';
let colorVisite = '';
let colorDemo = 'rgba(255,235,205,0.7)';
let panelBackground = '';
let topDown = null

let bgBlur = 'blur(4px)';
let dayColor = ['#000', '#444', '#feb', 'rgba(213,211,212,0.32)'];
let nightColor = ['#fff', '#bee', '#bfb', 'rgba(0,0,0,0.4)'];

let engineLogo = null;



let setting = {
    cross:4,
    border:'#020206',
}

let p0 = 'M 0.5 1.5 L 9.5 1.5 M 0.5 5.5 L 9.5 5.5 M 0.5 9.5 L 9.5 9.5';
let p1 = 'M 1.5 0.5 L 1.5 9.5 M 5.5 0.5 L 5.5 9.5 M 9.5 0.5 L 9.5 9.5';

const old = { f:0, z:0, w:0, h:0, ratio:1 }
let size = {};

export class Hub {

    static setMain( r ) { Main = r }

    static setColors( day ) {

        color = day ? dayColor[0] : nightColor[0];
        colorVisite = day ? dayColor[1] : nightColor[1];
        colorDemo = day ? dayColor[2] : nightColor[2];
        panelBackground = day ? dayColor[3] : nightColor[3];
        isDay = day;

        if(!content) return;

        content.style.color = color;
        document.querySelector("#svgLogo").setAttributeNS(null, 'stroke', color );
        document.querySelector("#guiPath").setAttributeNS(null, 'stroke', color );
        document.querySelector("#svgLoader").setAttributeNS(null, 'fill', color );
        if( isBackLight ) overpad.style.background = isDay ? nightColor[0] : dayColor[0];
       //top.style.background = panelBackground;

    }

    static reset() {

        Hub.log();
        if( cross ) content.removeChild( cross );
        cross = null
        //guiOpen = false

        if( joy ) this.removeJoystick()
        
    }

    static resize ( s ){

        tmpLeft = s.left;
        content.style.left = tmpLeft + "px";
        content.style.width = tmpLeft !== 0 ? 'calc(100% - ' + tmpLeft + 'px)' : '100%';
        
        if( joy !== null ) joy.rezone();

    }

    static init ( Camera, Size, text, Parent ) {

        if( isDisplay ) return;

        Hub.setColors( isDay );

        camera = Camera;
        size = Size;
        parent = Parent || document.body;

        //const fragment = document.createDocumentFragment();

        content = document.createElement( 'div' );
        content.style.cssText = unselectable + 'position:absolute; margin:0; padding:0; top:0px; left:0px; width:100%; height:100%; display:block; color:'+color+';'// font-family: Mulish,sans-serif;
        parent.appendChild( content );

        content.addEventListener( 'contextmenu', (e)=>{e.preventDefault()}, false )

        // for extra gui
        corner = document.createElement( 'div' );
        corner.style.cssText = unselectable + 'position:absolute; margin:0; padding:0; top:0px; left:0px; width:1px; height:1px; display:block; background:none;'// font-family: Mulish,sans-serif;
        content.appendChild( corner );

        
        txt = document.createElement( 'div' );
        txt.style.cssText = " color: #fff; font-size:16px; text-align:center; position:absolute; margin:0; padding:0; top:50%; left:50%; width:512px; height:20px; margin-left:-256px; margin-top:-38px; display:block; pointer-events:none; text-shadow: 2px 2px #000000;";
        txt.textContent = text || 'load...';
        content.appendChild( txt );

        loader = document.createElement( 'div' );
        loader.style.cssText = "position:absolute; top:50%; left:50%; width:60px; height:60px; margin-left:-30px; margin-top:-30px; display:block; ";
        loader.innerHTML = this.miniLoader( '#000' )
        content.appendChild( loader );
        

        //loader.textContent = 'load...';
        //this.addJoystick()

        //this.addBorder()
        //this.init3dHub()

        isDisplay = true
        isReady = true

    }

    static getCorner() {
        return corner;
    }

    static removeJoystick() {
        if(joy === null ) return
        joy.dispose()
        joy = null
    }

    static addJoystick () {
        let ccs = {
            joyOut: 'rgba(255,255,255,0.25)',
            joyOver:'rgba(127,255,0,0.5)',
            joySelect: '#7fFF00',
        }
        joy = UIL.add('Joystick', {  w:120, mode:1, text:false, precision:1, pos:{left:'10px', bottom:'10px' }, target:content, simple:true, ...ccs }).onChange( function(v){ Motor.setKey(0, v[0]); Motor.setKey(1, v[1]) } )
        //joy.neverlock = true
    }

    static snipperMode ( b ) {

        isSnipper = b;

    }

    /*static loadSvg ( url, div ) {

        var xhr = new XMLHttpRequest();
        xhr.open("GET",url,true);
        xhr.overrideMimeType("image/svg+xml");
        xhr.onload = function(e) {
            if( this.status == 200 ) div.appendChild( xhr.responseXML.documentElement );
        }
        xhr.send("");

    }*/

    /*clear: function () {

        if( !isDisplay ) return;

        if( tween !== null ){ TWEEN.remove( tween ); alpha = { n:1 } }

        tween = new TWEEN.Tween( alpha ).to( { n:0 }, 2000 )
            .easing( TWEEN.Easing.Quadratic.Out )
            .onUpdate( function() { intro.opacity ( alpha.n ); } )
            .onComplete( function () { intro.dispose(); } )
            .start();

    },*/

    static log ( t = '' ) {

        if( debug === null ) return;
        debug.innerHTML = t;

    }

    static setFps ( t ) {

        if( fps === null ) return;
        fps.innerHTML = t;

    }

    static showTimeTest ( t ) {

        if( statistics === null ) return;
        let txt = JSON.stringify(t, null, 2)
        txt = txt.replace(/[",*+?^${}()|[\]\\]/g, '')
        statistics.textContent = txt

    }

    static setStats ( txt = '' ) {

        statistics.textContent = txt

    }

    static endLoading () {

        loader.style.top = (marge[1]-1)+'px'
        loader.style.left = (marge[0]+20)+'px'
        //content.removeChild( loader )
        
        content.removeChild( txt );
        //txt.style.top = '50px'
        //txt.textContent ='';
        //txt.style.display = 'none'

        Pool.setLoadEvent(
            function(){ loader.style.display = 'block'; },
            function(){ loader.style.display = 'none'; }
        )

        


        /*let logo = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' 
        preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='20px' height='20px' viewBox='0 0 256 256'>
        <path id='svgLogo' stroke='${color}' stroke-width='30' style='stroke-opacity: 1;' stroke-linejoin='round' stroke-linecap='round' 
        fill='none' d='M 72.85 52.85 Q 70.9 53.8 69.15 55 45 72.35 45 96.5 45 120.65 69.15 137.7 93.55 155 127.95 155 L 127.95 37.95 Q 
        162.35 37.95 186.5 55 210.9 72.35 210.9 96.5 210.9 120.65 186.5 137.7 162.35 155 127.95 155 L 127.95 237.95'/></svg>`*/

        /*let logo = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' 
        preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='20px' height='20px' viewBox='0 0 40 40'>
        <path id='svgLogo' stroke='${color}' stroke-width='4' transform='translate(0, 4)' stroke-linejoin='round' stroke-linecap='round' 
        fill='none' d='${iLogo}''></svg>`*/



        let bg = 'none'//'rgba(255,255,255,0.1)'
        let bg2 = 'none'//'rgba(255,0,0,0.5)'
        let bg3 = 'rgba(127,0,0,0.2)';

        zoning = document.createElement( 'div' );
        zoning.style.cssText = 'position:absolute; top:20px; background:'+bg2+'; left:60px; pointer-events:auto;';
        zoning.id = 'zone';
        //zoning.style.background = 'rgba(10,0,0,0.2)'
        content.appendChild( zoning );

        if(isBackLight){

            overpad = document.createElement( 'div' );
           // let anim = "transition: width 0.2s ease-out; transition: left 0.1s ease-out; transition: top 0.1s ease-out; ";
            let sp = 0.03;
            let anim = 'transition: transform '+sp+'s allow-discrete ease-out;';
            overpad.style.cssText = anim + 'position:absolute; top:0px; left:0px; height:0px; width:0px; opacity:0; pointer-events:none; border-radius:10px;';

            overpad.style.transitionDuration = '0.03s';
            overpad.style.background = isDay ? nightColor[0] : dayColor[0];
            //overpad.style.boxShadow = '0px 0px 3px 1px #FFFFFF';
            //overpad.id = 'overpad';
            content.appendChild( overpad );

        }

        if(isTopDown){
            topDown = document.createElement( 'div' );
            topDown.style.cssText = 'position:absolute; top:0px; left:0px; height:0px; width:100%; pointer-events:none; transition:all 0.12s allow-discrete ease-out; transition-property: height, opacity; ';
            //topDown.style.cssText += 'border-bottom: 1px solid black;';
            topDown.style.opacity = 0;
            topDown.style.background = panelBackground;
            topDown.style.backdropFilter = bgBlur;
            content.appendChild( topDown );
        }

        menu = document.createElement( 'div' );
        menu.style.cssText = 'position:absolute; top:24px; background:'+bg+'; left:'+marge[0]+'px; display:flex; align-self: stretch; justify-content: flex-start; gap: 0px 6px; align-items:baseline; '
        content.appendChild( menu );

        downMenu = document.createElement( 'div' );
        downMenu.style.cssText = 'position:absolute; top:60px; left:'+marge[0]+'px; overflow:hidden; background:'+bg+'; height:0px; width:0px;'//'top:54px; width:0px;' //transition: all .1s ease-in-out;
        //downMenu.style.background = 'rgba(10,10, 10,0.2)'
        content.appendChild( downMenu );

        innerMenu = document.createElement( 'div' );
        innerMenu.style.cssText = 'box-sizing: border-box; position:absolute; overflow:hidden; background:'+bg+'; display:flex; flex-wrap:warp; opacity:0; transition-delay: 0.12s; transition:opacity 0.5s allow-discrete ease-out;';
        if(!isTopDown){
            innerMenu.style.opacity = '0';
            //innerMenu.style.transition = 'opacity 0.5s allow-discrete ease-out;';
            innerMenu.style.background = panelBackground;
            //innerMenu.style.border = '1px solid rgba(20,20,20,0.1)'
            //innerMenu.style.borderRadius = '6px';
            innerMenu.style.backdropFilter = bgBlur;
        }
        downMenu.appendChild( innerMenu );
        

        zoning.addEventListener("pointerleave", (e) => {
            lock = false;
            //Hub.hideMenu()
            timeout = setTimeout( function(){
                if(!lock) Hub.hideMenu() 
            }, 100 )
        });
        //zoning.addEventListener("pointerdown", (e) => { lock = true });

        zoning.addEventListener("pointermove", Hub.moving );

        title = document.createElement( 'div' );
        menu.appendChild( title )
        title.id = 'home'
        title.innerHTML = Hub.miniIcon('logo', color );

        engine = document.createElement( 'div' );
        engine.style.cssText = Styles.menuName;//'font-size:16px; ';//font-weight:700;
        engine.id = 'engine'
        menu.appendChild( engine )
        
        demo = document.createElement( 'div' );
        demo.style.cssText = Styles.menuName;//'font-size:16px; '//'font-size:16px; font-weight:500;'font-weight:700; 
        demo.id = 'demo'
        menu.appendChild( demo )
        
        this.effect(title)
        this.effect(engine)
        this.effect(demo)


        debug = document.createElement( 'div' );
        debug.style.cssText = 'position:absolute; width:300px; bottom:15px; left:'+(marge[0]+8)+'px; font-size:12px; vertical-align:bottom; text-align:left;'
        //debug.style.cssText = 'position:absolute; background:'+bg+'; width:300px; margin-left:-150px; bottom:25px; left:50%; font-size:14px; font-weight:500; vertical-align:bottom; text-align:center;'
        content.appendChild( debug )

        statistics = document.createElement( 'div' );
        statistics.style.cssText = 'position:absolute; bottom:25px; left:10px; font-size:14px; width:400px; white-space: pre; line-height:20px; margin-left:10px;'
        content.appendChild( statistics )

        // gui bg
        top = document.createElement( 'div' )
        top.style.cssText = unselectable + "position:absolute; top:0px; right:0px; width:260px; height:100%; background:"+panelBackground+"; display:none;"
        top.style.backdropFilter = bgBlur;
        content.appendChild( top )

        fps = document.createElement( 'div' );
        fps.style.cssText = Styles.menuName + 'position:absolute; top:33px; right:'+(marge[0]+20)+'px; text-align:right; '
        content.appendChild( fps )

        guiButton = document.createElement( 'div' );
        guiButton.style.cssText = 'position:absolute; right:'+marge[0]+'px;  top:31px; pointer-events:auto; cursor: pointer;'
        content.appendChild( guiButton )
        guiButton.innerHTML = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' 
        preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='10px' height='10px' viewBox='0 0 10 10'>
        <path stroke='${color}' id='guiPath' stroke-width='1' fill='none' d='${p0}'/></svg>`;
        guiButton.addEventListener("pointerdown", Main.showGui )

        /*let mouse = document.createElement( 'div' );
        mouse.style.cssText = 'position:absolute; right:80px;  top:27px; pointer-events:auto; cursor: pointer;'
        content.appendChild( mouse )
        mouse.id = 'mouse'
        mouse.innerHTML = Hub.miniIcon('drag', color );*/


        //Hub.colors(true)

    }

    static setTopColor ( c = '#000000' ) {
        //if(top) top.style.background = c
    }

    static harmony ( v ) {

        let lineColor = 'rgba(0,0,0,0.5)'

        if(v){
            if(!h1 && !h2){
                h1 = document.createElement( 'div' );
                h1.style.cssText = 'position:absolute; top:33.33%; width:100%; height:33.33%; border-top:1px dashed '+lineColor+'; border-bottom:1px dashed '+lineColor+';'
                content.appendChild( h1 )

                h2 = document.createElement( 'div' );
                h2.style.cssText = 'position:absolute; left:33.33%; height:100%; width:33.33%; border-left:1px dashed '+lineColor+'; border-right:1px dashed '+lineColor+';'
                content.appendChild( h2 )
            }
        } else {
            if(h1 && h2){
                content.removeChild( h1 )
                content.removeChild( h2 )
                h1 = null
                h2 = null
            }
        }
        
    }

    static miniLoader( color ){
        return `
        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
        viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
        <path id="svgLoader" fill="${color}" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
        <animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 50 50" to="360 50 50" repeatCount="indefinite" />
        </path></svg>
        `
    }

    static miniIcon( name, color ){

        let p

        switch(name){
            case 'logo' : p = 'M 11.2 7.3 Q 10.9 7.45 10.6 7.7 6.75 10.45 6.75 14.35 6.75 18.15 10.6 20.9 14.5 23.65 20 23.65 L 20 4.95 Q 25.5 4.95 29.4 7.7 33.25 10.45 33.25 14.35 33.25 18.15 29.4 20.9 25.5 23.65 20 23.65 L 20 35'; break
            case 'drag' : p = 'M 23.975 7.025 Q 21.93 5 19 5 L 5 5 M 12 19 L 5 19 M 19 12 L 19 35 35.15 28.9 19 12 Z'; break
            case 'build' : p = 'M 20 20 L 20 5 35 5 35 20 35 35 20 35 5 35 5 20 20 20 35 20 M 20 20 L 20 35'; break
            case 'cible' : p = 'M 27.05 12.95 Q 30 15.8 30 20 30 24.1 27.05 27.05 24.1 30 20 30 15.8 30 12.95 27.05 10 24.1 10 20 10 15.8 12.95 12.95 15.8 10 20 10 24.1 10 27.05 12.95 Z M 35 20 L 32 20 M 20 5 L 20 8 M 8 20 L 5 20 M 20 32 L 20 35'; break
        }

        return `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' 
        preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='20px' height='20px' viewBox='0 0 40 40'>
        <path id='svgLogo' stroke='${color}' stroke-width='3' transform='translate(0, 4)' stroke-linejoin='round' stroke-linecap='round' 
        fill='none' d='${p}''></svg>`

    }

    static switchGuiButton( b ){

        if(isTopDown) topDown.style.width = b ? 'calc(100% - 260px)': '100%'

        document.querySelector("#guiPath").setAttributeNS(null, 'd', b ? p1 : p0)
        guiOpen = b;
        top.style.display = b ? 'block':'none'

        let cc = b ? nightColor[0] : color
        document.querySelector("#guiPath").setAttributeNS(null, 'stroke', cc );
        fps.style.color = cc;

    }

    static hideMenu () {

        Hub.clearLogoImage();

        downMenu.style.height = '0px'
        innerMenu.innerHTML = '';
        //innerMenu.style.background = 'none';
        
        zoning.style.width = '0px';
        zoning.style.height = '0px';
        currentMenu = '';
        if(isTopDown){ 
            topDown.style.height = '0px'
            topDown.style.opacity = 0;
        }
        
        innerMenu.style.opacity = 0;
        
        Hub.updatePad(null);

    }

    static showMenu ( target ) {

        let type = target.id;

        if( currentMenu === type ) return;

        Hub.hideMenu();

        currentMenu = type;

        //downMenu.style.left = ( type === 'engine' ? 125:80 ) + 'px'
        //if(type === 'home') downMenu.style.left = '70px'
        downMenu.style.left = marge[0] + 'px'
        if(type === 'home') downMenu.style.left = (marge[0]-10) + 'px'
        if(type === 'engine'){ 
            downMenu.style.left = (marge[0]+36) + 'px';
            Hub.addLogoImage();
        } else {
            Hub.clearLogoImage();
        }

        let list = listdata[ type ];
        /*type === 'demo' ?  demolist : engineList
        if( type === 'logo') list = ['Github', 'About']*/
        let i = list.length, m, n=0, itemH = 0, name

        //innerMenu.style.cssText = " top:0px; width:auto; display:flex; flex-direction:column; "
        innerMenu.style.padding = '10px 0px';
        innerMenu.style.top = '0px';
        innerMenu.style.width = 'auto';
        innerMenu.style.display = 'flex';
        innerMenu.style.flexDirection = 'column';
        //innerMenu.style.background = panelBackground;
        //innerMenu.style.border = '4px solid rgba(20,20,20,0.1)'
        innerMenu.style.opacity = 1



        const bb = [];
        
        while( i-- ){

            name = list[n];
            m = document.createElement( 'div' );
            innerMenu.appendChild( m );
            m.classList.add("down");
            
            m.style.cssText = Styles.demoName;//'font-size:14px; width:fit-content; padding:4px 10px; text-shadow: 1px 1px #000000;';//type === 'demo' ? 'font-size:16px; font-weight:500;' : 'font-size:16px; font-weight:700;'font-weight:700; 
            m.id = name
            m.textContent = name;
            //m.style.background = '#ff00ff'

            if( listdata.visited.indexOf(name) !== -1 ) m.style.color = colorVisite;
            if( Main.devDemo[name] ) m.style.color = colorDemo;
            if( name === 'Worker' ) m.style.color = Main.isWorker ? color : colorVisite;
            if( name === 'Code' ) m.style.color = Main.isEditor ? color : colorVisite;

            if( n===0 ) itemH = m.offsetHeight;
            //bb[n] = m
            
            this.effect( m, true );
            n++;

        }

        
        let rect = innerMenu.getBoundingClientRect();
        let max = maxListItem * itemH
        let maxH = n * itemH 
        maxHeight = maxH > max ? max : rect.height
        ratio = maxHeight / maxH 
        sh = maxHeight * ratio
        range = maxHeight - sh

        //if( ratio !== 1 && full ){
        if( type === 'demo' ){
            innerMenu.style.display = 'grid';
            innerMenu.style.gridTemplateColumns = 'repeat(auto-fill, 120px)'
            innerMenu.style.justifyContent = 'space-between';
            let dw = guiOpen ? (255+80) : 160 

            downMenu.style.left = 80 + 'px'
            downMenu.style.width = 'calc(100% - '+dw+'px)'
            innerMenu.style.width = '100%'
            rect = innerMenu.getBoundingClientRect();
            
            downMenu.style.height = rect.height+'px'//maxHeight + 'px'

        } else {
            downMenu.style.width = rect.width + 'px'
            downMenu.style.height = maxHeight + 'px'
            
        }

        zoning.style.left = (rect.left-20) + 'px';
        zoning.style.width = (rect.width + 40) + 'px';
        zoning.style.height = (rect.height + 50) + 'px';
        //zoning.style.height = (rect.height + 70) + 'px';

        //const rect = elem.getBoundingClientRect();

        if(isTopDown){ 
            topDown.style.height = 60 + rect.height+'px'
            topDown.style.opacity = 1;
        }

    }

    static upMenu () {

        engine.textContent = this.reformat( Main.engineType )
        demo.textContent = this.reformat( Main.currentDemo )

        listdata.visited.push( demo.textContent )

        let list = [...Main.demoList]
        list.splice(list.indexOf(Main.currentDemo), 1);
        list.sort();
        list = list.map( x => Hub.reformat(x) );

        listdata.demo = list;

        list = [...Main.engineList]
        list.sort();
        list.splice(list.indexOf(Main.engineType), 1);
        list = list.map( x => Hub.reformat(x) );

        listdata.engine = list;

    }

    static reformat ( n ) {

        return n.toUpperCase().substring(0,1) + n.substring(1).toLowerCase();

    }

    static effect ( dom, item ) {

        dom.classList.add("menu");

        if(!Main.isMobile) dom.addEventListener("pointermove", Hub.moving );

        dom.style.padding = '4px 10px';

        dom.addEventListener( 'pointerleave', (e) => {
            if(isLiner) e.target.style.textDecoration = 'none';
            else e.target.style.fontWeight = 400;
        })
       
        dom.addEventListener("pointerdown", (e) => {
            //e.target.style.textDecoration = 'underline ' + color;
            if( e.target.id === 'home' || e.target.id === 'engine' || e.target.id === 'demo' ) Hub.showMenu( e.target )
            else Hub.onClick( e.target.id );
        });

    }

    static onClick ( name ) {

        lock = false;
        Hub.hideMenu();
        
        timeout = setTimeout( function(){ 
            if( listdata.engine.indexOf(name) !== -1 ) Hub.swapEngine( name )
            else if( listdata.home.indexOf(name) !== -1 ) Hub.homeLink( name )
            else Main.loadDemo( name.toLowerCase() ) 
        }, 100 );

    }

    static homeLink ( type ) {

        switch(type){
            case 'Github': window.open( 'https://github.com/lo-th/phy', '_blank'); break;
            case 'Docs': window.open( './docs/index.html#manual/Welcome', '_blank'); break;
            case 'Worker': Hub.swapWorker(); break;
            case 'Code': Hub.swapCode(); break;
        }

    }

    static swapWorker () {

        Main.isWorker = !Main.isWorker
        Hub.swapEngine()

    }

    static swapCode () {

        Main.isEditor = !Main.isEditor
        Main.showEditor(Main.isEditor);

    }

    static swapEngine ( type ) {

        if( !type ) type = Main.engineType
        let name = type.toLowerCase()
        let hash = location.hash
        let url = 'index';
        let param = 'E='
        if( Main.devMode ) param += 'dev_'
        if( Main.isWorker ) param += 'w_'
        param += name;
        let w = window.open( url+'.html?'+param+hash, '_self')

    }

    static updatePad ( t ) {

        let isMenu = false;
        if( t && t.id ){
            isMenu = t.id === 'home' || t.id === 'engine' || t.id === 'demo'; 
            if( t.id === prevOver ) return false;

            prevOver = t.id;
        } else {
            prevOver = null;
        }

        if(isBackLight){
            let rect = { top:-10, left:-10, width:0, height:0 };
            let d = 1;

            if( t ){ 
                rect = t.getBoundingClientRect();
                if( isMenu && isFromTop){
                    d = - rect.top - 15;
                    rect.height = -d+rect.height; 
                }
            }

            let left = rect.left - tmpLeft;

            overpad.style.transitionDuration = isMenu ? '0s':'0.03s';
            overpad.style.transform = 'translate3d('+left+'px, '+(rect.top+d)+'px, 0)';
            // overpad.style.top = ((rect.top-h)+d) + 'px';
            // overpad.style.left = (rect.left-w) - tmpLeft + 'px';
            overpad.style.width = (rect.width) + 'px';
            overpad.style.height = (rect.height)-1 + 'px';
            overpad.style.opacity = !t? 0: 0.1;
            //overpad.style.opacity = !t? 0: (isMenu?0.6:0.6);
        }

        return true;

    }

    static moving ( e ) {

        lock = true
        if( e.target.id === 'zone'){ 
            if(isBackLight) overpad.style.opacity = 0.1
            return
        }

        if(isLiner) e.target.style.textDecoration = 'underline '+ color;
        else e.target.style.fontWeight = 500;

        if( listdata.engine.indexOf(e.target.id) !== -1) Hub.setLogoImage( e.target.id );
        if( e.target.id === 'engine' ) Hub.setLogoImage();

        if(isBackLight) overpad.style.opacity = 0.3

        let isNewTarget = Hub.updatePad( e.target );
        if( !isNewTarget ) return;


        if( e.target.id === 'home' || e.target.id === 'engine' || e.target.id === 'demo' ){ 
            Hub.showMenu( e.target )
           // innerMenu.style.opacity = 1;
            return 
        }

        if( full ) return 

        if( ratio!==1 ){

            let my = e.clientY - listTop
            my = my < 0 ? 0 : my;
            my = my > maxHeight ? maxHeight : my;
            let y = my - (sh*0.5)

            y = y < 0 ? 0 : y;
            y = y > range ? range : y;

            //let step = Math.floor( y / ratio )/28
            //if( step === Math.floor( step )) innerMenu.style.top = -( step * 28 ) + 'px'

            innerMenu.style.top = -Math.floor( y / ratio ) + 'px'

        }

    }

    static count ( data, fire ) {

        if( fire ){
            data.n--;
            data.t--;
        }

        textRight.textContent = data.n + ' / '+ data.t;

        if( data.n === 0 ) return 'reload';
        if( data.t === 0 ) return 'empty';
        return 'fire';

    }

    static dispose () {

        if( !isDisplay ) return;

        while (content.firstChild) content.removeChild(content.lastChild);
        parent.removeChild( content );
        isDisplay = false;

    }


    //-------------------------
    //
    //  ENGINE LOGO
    //
    //-------------------------


    static clearLogoImage() {

        if(!engineLogo) return;
        menu.removeChild(engineLogo);
        engineLogo = null;

    }

    static addLogoImage() {

        if(engineLogo) return;
        let curr = Main.engineType.toLowerCase()
        engineLogo = new Image(256, 128);
        engineLogo.style.cssText = 'position:absolute; top:40px; left:200px; width:256px; height: 128px;';
        menu.appendChild(engineLogo);
        Hub.setLogoImage();

    }

    static setLogoImage( name ) {

        if(!engineLogo) return;
        name = name ? name.toLowerCase() : Main.engineType.toLowerCase();
        engineLogo.src = './assets/logo/'+name+'.png';

    }


    //-------------------------
    //
    //  BORDER
    //
    //-------------------------


    static addBorder() {

        let ccc = [ 
            [68, setting.border, 0], 
            [75, setting.border, 0.08], 
            [93, setting.border, 0.4],
            [100, setting.border, 0.6],
        ];

        var css =  "position:absolute; margin:0; padding:0; top:0; left:0; width:100%; height:100%; display:block; pointer-events:none;";

        border = svg( 'svg', css , { viewBox:'0 0 512 512', width:512, height:512, preserveAspectRatio:'none' } );
        svg( 'defs', '', {}, border );
        grad( 'radialGradient', { id:'grad', cx:0, cy:0, r:338, fx:0, fy:0, gradientTransform:'matrix( 0, 1, -1, 0, 256, 256 )', gradientUnits:"userSpaceOnUse" }, border, ccc );
        svg( 'rect', '', {  x:0, y:0, width:512, height:512, fill:'url(#grad)' }, border );

        content.appendChild( border );

    }


    //-------------------------
    //
    //  CROSS
    //
    //-------------------------

    static hideCross( b ) {

        cross.style.visibility = !b ? 'visible' : 'hidden';

    }

    static addCross() {

        var css =  "position:absolute; margin:0; padding:0; top:50%; left:50%; width:128px; height:128px; margin-left:-64px; margin-top:-64px; display:block;";
        cross = svg( 'svg', css , { viewBox:'0 0 64 64', width:64, height:64, preserveAspectRatio:'none' } );

        svg( 'defs', '', {}, cross );
        svg( 'path', '', { id:'cc', d:'M 0 1.5 L 0 -1.5', stroke:'#FFFFFF', 'stroke-width':2, fill:'none', 'stroke-linecap':'butt', 'vector-effect':'non-scaling-stroke' }, cross, 0 );
        svg( 'g', '', {}, cross );

        var g = cross.childNodes[1];

        for( var i = 0; i<4; i++ ){
            svg( 'g', '', {}, g );
            svg( 'use', '', { link:'#cc' }, g, i );
        }

        this.setCrossSize( setting.cross );

        content.appendChild( cross );

    }

    static setCross ( n, time ) {

        /*if( crossTween !== null ) TWEEN.remove( crossTween );

        crossTween = new TWEEN.Tween( setting ).to( { cross:n }, time || 300 )
        .easing( TWEEN.Easing.Quartic.Out )
        .onUpdate( function( o ) { this.setCrossSize( o.cross ); }.bind(this) )
        .start();*/

    }

    static setCrossSize ( d ) {

        let i,n, m, t = a_base;
        let p = [ 32, 32-d,   32+d, 32,   32, 32+d,   32-d, 32 ];

        for( i = 0; i<4; i++){
            m=i*4
            n = i*2;
            setSvg( cross, 'transform', 'matrix( '+ t[m]+' '+t[m+1]+' '+t[m+2]+' '+t[m+3]+' '+p[n]+' '+p[n+1] +' )', 1, i );
        }

    }

   

}