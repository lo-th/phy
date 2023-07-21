//import * as UIL from 'uil'
import * as UIL from '../libs/uil.module.js'
//import * as TWEEN from 'tween'
import { Pool } from './Pool.js';
import { Motor } from '../motor/Motor.js'
//import { Main } from '../Main.js'

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/

let Main = null;

let svg = UIL.Tools.dom;
let setSvg = UIL.Tools.setSvg;
let grad = UIL.Tools.makeGradiant;

let parent;
let content, cross = null, border, counter, counter2, zone, path, txt, info, loader, textRight, textLeft, textLeft2;
let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';

let menu, pin, title, engine, demo, downMenu, innerMenu, zoning, guiButton

let top = null
let ratio = 1
let listHeight = 0
let listTop = 54
let maxHeight = 0
let sh=0 ,  range = 0
let maxListItem = 10
let full = true

let guiOpen = false

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
let statistics = null
let debug = null;

let isPanel3D = false;

let joy = null

let lock = false
let timeout = null

let color = '#001'
let colorVisite = '#335'

let setting = {
    cross:4,
    border:'#020206',
}

let p0 = 'M 0.5 1.5 L 9.5 1.5 M 0.5 5.5 L 9.5 5.5 M 0.5 9.5 L 9.5 9.5'
let p1 = 'M 1.5 0.5 L 1.5 9.5 M 5.5 0.5 L 5.5 9.5 M 9.5 0.5 L 9.5 9.5'

const old = { f:0, z:0, w:0, h:0, ratio:1 }
let size = {};

export class Hub {

    static setMain( r ) { Main = r }

    static colors( day ) {

        if(day){
            color = '#001'
            colorVisite = '#335'
        } else {
            color = '#FFE'
            colorVisite = '#DDC'
        }

        content.style.color = color
        document.querySelector("#svgLogo").setAttributeNS(null, 'stroke', color )
        document.querySelector("#guiPath").setAttributeNS(null, 'stroke', color )
        document.querySelector("#svgLoader").setAttributeNS(null, 'fill', color )

    }

    static reset() {

        Hub.log()
        if( cross ) content.removeChild( cross )
        cross = null
        //guiOpen = false

        if( joy ) this.removeJoystick()
        
    }

    static resize ( s ){

        content.style.left = s.left + "px"
        content.style.width = s.left !== 0 ? 'calc(100% - ' + s.left + 'px)' : '100%'
        if( joy !== null ) joy.rezone()

    }

    static init ( Camera, Size, text, Parent ) {

        if( isDisplay ) return;

        camera = Camera;
        size = Size;
        parent = Parent || document.body;

        content = document.createElement( 'div' );
        content.style.cssText = unselectable + 'position:absolute; margin:0; padding:0; top:0px; left:0px; width:100%; height:100%; display:block; color:'+color+'; font-family: Mulish,sans-serif;'
        parent.appendChild( content );
        
        txt = document.createElement( 'div' );
        txt.style.cssText = " color: #fff; font-size:16px; text-align:center; position:absolute; margin:0; padding:0; top:50%; left:50%; width:512px; height:20px; margin-left:-256px; margin-top:-38px; display:block; pointer-events:none; text-shadow: 1px 1px #000000;";
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

    static removeJoystick() {
        if(joy === null ) return
        joy.dispose()
        joy = null
    }

    static addJoystick () {
        let colors = {
            joyOut: 'rgba(255,255,255,0.25)',
            joyOver:'rgba(127,255,0,0.5)',
            joySelect: '#7fFF00',
        }
        joy = UIL.add('Joystick', {  w:120, mode:1, text:false, precision:1, pos:{left:'10px', bottom:'10px' }, target:content, simple:true, ...colors }).onChange( function(v){ Motor.setKey(0, v[0]); Motor.setKey(1, v[1]) } )
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

        loader.style.top = '38px'
        loader.style.left = '90px'
        //content.removeChild( loader )
        
        content.removeChild( txt )
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
        let bg2 = 'none'//'rgba(255,255,255,0.01)'
        let bg3 = 'rgba(127,0,0,0.2)'

        zoning = document.createElement( 'div' );
        zoning.style.cssText = 'position:absolute; top:0px; background:'+bg2+'; left:60px; pointer-events:auto; '
        zoning.id = 'zone'
        content.appendChild( zoning )

        menu = document.createElement( 'div' );
        menu.style.cssText = 'position:absolute; top:25px; background:'+bg+'; left:80px; display:flex; align-self: stretch; justify-content: flex-start; gap: 10px 20px; align-items:baseline; '
        content.appendChild( menu )

        downMenu = document.createElement( 'div' );
        downMenu.style.cssText = 'position:absolute; top:54px; left:80px; overflow:hidden; background:'+bg+'; height:0px; width:0px;'//' width:0px;' //transition: all .1s ease-in-out;
        content.appendChild( downMenu )

        innerMenu = document.createElement( 'div' );
        innerMenu.style.cssText = 'position:absolute; top:0px; left:0px; top:0px; overflow:hidden; background:'+bg+'; display:flex; flex-wrap:warp;'//flex-direction: column; '
        downMenu.appendChild( innerMenu )

        zoning.addEventListener("pointerleave", (e) => {
            lock = false
           // Hub.hideMenu()
            timeout = setTimeout( function(){if(!lock) Hub.hideMenu() }, 100 )
        });
        //zoning.addEventListener("pointerdown", (e) => { lock = true });

        zoning.addEventListener("pointermove", Hub.moving );

        title = document.createElement( 'div' );
        menu.appendChild( title )
        title.id = 'home'
        title.innerHTML = Hub.miniIcon('logo', color );

        engine = document.createElement( 'div' );
        engine.style.cssText = 'font-size:16px; font-weight:700; '
        engine.id = 'engine'
        menu.appendChild( engine )
        
        demo = document.createElement( 'div' );
        demo.style.cssText = 'font-size:16px; font-weight:500;'
        demo.id = 'demo'
        menu.appendChild( demo )
        
        this.effect(title)
        this.effect(engine)
        this.effect(demo)

        

        debug = document.createElement( 'div' );
        debug.style.cssText = 'position:absolute; width:300px; bottom:25px; left:80px; font-size:14px; font-weight:500; vertical-align:bottom; text-align:left;'
        //debug.style.cssText = 'position:absolute; background:'+bg+'; width:300px; margin-left:-150px; bottom:25px; left:50%; font-size:14px; font-weight:500; vertical-align:bottom; text-align:center;'
        content.appendChild( debug )

        statistics = document.createElement( 'div' );
        statistics.style.cssText = 'position:absolute; bottom:25px; left:10px; font-size:14px; font-weight:500; width:400px; white-space: pre; line-height:20px;'
        content.appendChild( statistics )


        top = document.createElement( 'div' )
        top.style.cssText = unselectable + "position:absolute; top:0px; right:0px; width:260px; height:100%; background:rgba(0,0,0,0.4); display:none;"
        //top.style.cssText = unselectable + "position:absolute; top:0px; right:5px; width:250px; height:100%; background:#000008; display:none; opacity: 0.7;"
        top.style.backdropFilter = 'blur(4px)'
        content.appendChild( top )



        fps = document.createElement( 'div' );
        fps.style.cssText = 'position:absolute; top:33px; right:100px; text-align:right; font-size:14px; font-weight:500; '
        content.appendChild( fps )




        guiButton = document.createElement( 'div' );
        guiButton.style.cssText = 'position:absolute; right:80px;  top:31px; pointer-events:auto; cursor: pointer;'
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


        //Hub.colors(false)

    }

    static setTopColor ( c = '#000000' ) {
        if(top) top.style.background = c
    }

    static harmony ( v ) {

        let lineColor = 'rgba(0,0,0,0.5)'

        if(v ){
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
        <path id='svgLogo' stroke='${color}' stroke-width='4' transform='translate(0, 4)' stroke-linejoin='round' stroke-linecap='round' 
        fill='none' d='${p}''></svg>`

    }

    static switchGuiButton(b){

        document.querySelector("#guiPath").setAttributeNS(null, 'd', b ? p1 : p0)

        guiOpen = b

        top.style.display = b ? 'block':'none'

        let color = b ? '#FFE' : '#001'
        document.querySelector("#guiPath").setAttributeNS(null, 'stroke', color )
        fps.style.color = color

        

    }

    static hideMenu () {
        downMenu.style.height = '0px'
        innerMenu.innerHTML = '';
        zoning.style.width = '0px'
        zoning.style.height = '0px'
        currentMenu = ''
    }

    static showMenu ( target ) {

        let type = target.id

        if( currentMenu === type ) return

        Hub.hideMenu()

        currentMenu = type

        downMenu.style.left = (type==='engine' ? 120:80) + 'px'

        //if(type==='home') list.


        let list = listdata[ type ]
        /*type === 'demo' ?  demolist : engineList
        if( type === 'logo') list = ['Github', 'About']*/
        let i = list.length, m, n=0, itemH = 0, name

        innerMenu.style.top = '0px'
        innerMenu.style.width = 'auto'
        innerMenu.style.display = 'flex';
        innerMenu.style.flexDirection = 'column';

        const bb = []
        
        while(i--){

            name = list[n]
            m = document.createElement( 'div' );
            innerMenu.appendChild( m )
            m.classList.add("down");
            
            m.style.cssText = type === 'demo' ? 'font-size:16px; font-weight:500;' : 'font-size:16px; font-weight:700;'
            m.id = name
            m.textContent = name;

            if( listdata.visited.indexOf(name) !== -1 ) m.style.color = colorVisite
            if( name === 'Worker' ) m.style.color = Main.isWorker ? color : colorVisite
            if( name === 'Code' ) m.style.color = Main.isEditor ? color : colorVisite

            if( n===0 ) itemH = m.offsetHeight
            //bb[n] = m
            
            this.effect( m, true )
            n++
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

        zoning.style.left = (rect.left-20) + 'px'
        zoning.style.width = (rect.width + 40) + 'px'
        zoning.style.height = (rect.height + 70) + 'px'

    }

    static upMenu () {

        engine.textContent = this.reformat( Main.engineType )
        demo.textContent = this.reformat( Main.currentDemo )

        listdata.visited.push( demo.textContent )

        let list = [...Main.demoList]
        list.splice(list.indexOf(Main.currentDemo), 1);
        list.sort();
        list = list.map( x => Hub.reformat(x) );

        listdata.demo = list

        list = [...Main.engineList]
        list.sort();
        list.splice(list.indexOf(Main.engineType), 1);
        list = list.map( x => Hub.reformat(x) );

        listdata.engine = list

    }

    static reformat ( n ) {

        return n.toUpperCase().substring(0,1) + n.substring(1).toLowerCase();

    }

    static effect ( dom, item ) {

        dom.classList.add("menu");

        if(!Main.isMobile) dom.addEventListener("pointermove", Hub.moving );

        dom.addEventListener( 'pointerleave', (e) => {
            e.target.style.textDecoration = 'none';
            //lock = false
            //timeout = setTimeout( function(){ if(!lock) Hub.hideMenu() }, 1000 )
        })

        dom.addEventListener("pointerdown", (e) => {
            e.target.style.textDecoration = 'underline ' + color;
            if( e.target.id === 'home' || e.target.id === 'engine' || e.target.id === 'demo' ) Hub.showMenu(e.target)
            else Hub.onClick( e.target.id )
        });

    }

    static onClick ( name ) {

        lock = false
        Hub.hideMenu()
        
        timeout = setTimeout( function(){ 
            if( listdata.engine.indexOf(name) !== -1 ) Hub.swapEngine( name )
            else if( listdata.home.indexOf(name) !== -1 ) Hub.homeLink( name )
            else Main.loadDemo( name.toLowerCase() ) 
        }, 100 ) 

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

    static moving ( e ) {

        lock = true
        if( e.target.id === 'zone') return

        e.target.style.textDecoration = 'underline '+color;

        if( e.target.id === 'home' || e.target.id === 'engine' || e.target.id === 'demo' ){ 
            Hub.showMenu( e.target )
            return 
        }

        if(full) return 

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

    //-------------------------
    //
    //  3D HUB
    //
    //-------------------------

    /*static init3dHub() {

        console.log('HUB 3D!!')

        //camera = root.view.getCamera();

        //var s = root.view.getSizer()

        panelMat = new ShaderMaterial( {

            uniforms: {

                renderMode:{ value: 0 },
                ratio: { value: 1 },//s.w/s.h
                radius: { value: 2 },
                step: { value: new Vector4(0.6, 0.7, 1.25, 1.5 ) },

            },

            vertexShader:`
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
            `,
            fragmentShader:`

            uniform int renderMode;

            uniform float ratio;
            uniform float radius;
            uniform vec4 step;
            varying vec2 vUv;
            void main() {
                vec2 c = vec2(0.5, 0.5);
                vec2 pos = (vUv - 0.5) * vec2(ratio, 1) + 0.5;
      
                float dist = length( pos - c ) * radius;

                vec4 cOne = vec4(0.0, 0.0, 0.0, 0.0);
                vec4 cTwo = vec4(0.0, 0.0, 0.0, 0.0);
                vec4 cTree = vec4(0.0, 0.0, 0.0, 0.25);
                vec4 cFour = vec4(0.0, 0.0, 0.0, 0.95);

                vec4 color = mix( cOne, cTwo, smoothstep( step.x, step.y, dist ));
                color = mix( color, cTree, smoothstep(step.y, step.z, dist ));
                color = mix( color, cFour, smoothstep(step.z, step.w, dist ));

                if( renderMode == 0 ) gl_FragColor = color;
                else discard;

            }
            `, 
            transparent:true,
            depthWrite:false,
            depthTest:false,
            toneMapped: false,

        } );

        panel = new Mesh( new PlaneGeometry(1,1, 2,2), panelMat  );
        panel.frustumCulled = false;
        //panel = new THREE.Mesh( new THREE.SphereBufferGeometry(1) );
        //panel.position.z = -0.1
        camera.add( panel )

        panel.renderOrder = 1000000;

        

        isPanel3D = true

        this.update()

    }

    static setRenderMode ( v ){

        if(!isPanel3D) return
        panelMat.uniforms.renderMode.value = v
        
    }

    static hide( b ){

        panel.visible = b

    }

    static setFocus ( v ){

        

    }

    static update ( Size, type ) {

        console.log('HUB UP!!')

        if( Size ) size = Size;
        let s = size;

        type = type || '';

        //let s = root.view.getSizer();
        let fov = camera.fov;
        let z = camera.zoom;
        let d = 0, r = 1;


        if( s.w !== old.w || s.h !== old.h || fov !== old.f || z !== old.z ){ 

            this.resizeOld( s, fov, z );

            if(!isPanel3D) return

            if( isSnipper && type === 'fps' ){

                r = (z-1.2)/12.8;

                panelMat.uniforms.ratio.value = math.lerp( 1, old.ratio, r ); 
                panelMat.uniforms.radius.value = math.lerp( 2, 3, r );

            } else {
                d = type === 'tps' ? z - 0.6 : z-1.2;
                d*=0.25;
                panelMat.uniforms.step.value.x = 0.6 - d;
                panelMat.uniforms.step.value.y = 0.7 - d;
                panelMat.uniforms.step.value.z = 1.25 - d*0.5;
            }

            
            //panelMat.uniforms.step.value.w = 1.5 - d 

        }

    }

    static resizeOld ( s, fov, z ){

        content.style.left = (s.left + 10) + "px"



        if(!isPanel3D) return


        //var d = 0.0001
        let d = 0.001
        let v = fov * math.torad; // convert to radians
        let r = (s.h / ( 2 * Math.tan( v * 0.5 ) ));
        let e = 1//3/5; // ???

        panel.scale.set( s.w, s.h, 0 ).multiplyScalar(d);
        //panel.scale.set( 50, 50, 0 ).multiplyScalar(0.0001);
        //panel.scale.z = 1;
        panel.position.z = -r*d*z;

        old.f = fov;
        old.z = z;
        old.w = s.w;
        old.h = s.h;
        old.ratio = s.w / s.h;

    }*/

}