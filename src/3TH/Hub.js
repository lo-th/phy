import {
    ShaderMaterial,
    Vector4,
    Mesh,
    PlaneGeometry
} from 'three';
import * as TWEEN from 'tween'
import { Tools } from 'uil';
import { math } from './math.js';

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/

let svg = Tools.dom;
let setSvg = Tools.setSvg;
let grad = Tools.makeGradiant;

let parent;
let content, cross = null, border, counter, counter2, zone, path, txt, info, loader, textRight, textLeft, textLeft2, title, menu;
let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';

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


let setting = {
    cross:4,
    border:'#020206',
}

const old = { f:0, z:0, w:0, h:0, ratio:1 }
let size = {};

export class Hub {

    static reset() {

        Hub.log()
        if( cross ) content.removeChild( cross )
        cross = null
        
    }

    static resize ( s ){

        content.style.left = s.left + "px"
        content.style.width = s.left !== 0 ? 'calc(100% - ' + s.left + 'px)' : '100%'

    }

    static init ( Camera, Size, text, Parent ) {

        if( isDisplay ) return;

        camera = Camera;
        size = Size;

        parent = Parent || document.body;

        content = document.createElement( 'div' );
        content.style.cssText = unselectable + "position:absolute; margin:0; padding:0; top:0px; left:0px; width:100%; height:100%; display:block; font-family: 'Roboto Mono', 'Source Code Pro', Consolas, monospace; color:rgba(0,0,6,1); "; //color:#DDD; text-shadow: 1px 1px 1px #000010;
        parent.appendChild( content );
        
        txt = document.createElement( 'div' );
        txt.style.cssText = " color: #fff; font-size:16px; text-align:center; position:absolute; margin:0; padding:0; top:50%; left:50%; width:512px; height:20px; margin-left:-256px; margin-top:-38px; display:block; pointer-events:none; text-shadow: 1px 1px #000000;";
        txt.textContent = text || 'load...';
        content.appendChild( txt );

        loader = document.createElement( 'div' );
        loader.style.cssText = "position:absolute; top:50%; left:50%; width:50px; height:50px; margin-left:-25px; margin-top:-25px; display:block; ";
        content.appendChild( loader );
        this.loadSvg( './assets/textures/loader.svg', loader );
        

        //loader.textContent = 'load...';

        //this.addBorder()
        //this.init3dHub()

        isDisplay = true
        isReady = true

    }

    static snipperMode ( b ) {

        isSnipper = b;

    }

    static loadSvg ( url, div ) {

        var xhr = new XMLHttpRequest();
        xhr.open("GET",url,true);
        xhr.overrideMimeType("image/svg+xml");
        xhr.onload = function(e) {
            if( this.status == 200 ) div.appendChild( xhr.responseXML.documentElement );
        }
        xhr.send("");

    }

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

    static setStats ( t = '' ) {

        if( statistics === null ) return;

        let txt = t

        if( t!=='' ){

            for( let j in t.memory ){
                //t.memory[j] = Math.round( t.memory[j]*0.000976563 )

                //if( j === 'drawingbuffer' || j === 'total' ) t.memory[j] = Math.round( t.memory[j]*0.000001 ) + ' MB'
                //else t.memory[j] = Math.round( t.memory[j]*0.001 ) + ' KB'

                if( j === 'drawingbuffer' || j === 'total' ) t.memory[j] = Math.round( (t.memory[j]*0.000001 )/8) + ' Mo'
                else t.memory[j] = Math.round( (t.memory[j]*0.001)/8 ) + ' Ko'

                //t.memory[j] = Math.round( t.memory[j] / 1024/ 1024 )
            }

            txt = JSON.stringify(t, null, 2)
            txt = txt.replace(/[",.*+?^${}()|[\]\\]/g, '')

        }

        statistics.textContent = txt

    }

    static endLoading () {

        content.removeChild( loader )
        content.removeChild( txt )

        /*let logo0 = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' 
        preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='60px' height='30px' viewBox='0 0 100 50'>
        <g><path id='3TH' stroke='#000006' stroke-width='10' style='stroke-opacity: .3;' fill='none' d='M 70 8 L 70 23 79.75 23 80 23 Q 84.15 23 87.05 25.9 90 28.85 90 33 L 90 48 M 12 
        5 Q 12 11.73 14.35 9.4 16.7 7.05 20 7.05 23.35 7.05 25.7 9.4 27.1 11.73 28 15 28 18.35 25.7 20.7 23.7 22.7 21 23 L 44 23 44 8 M 61 43 L 52 43 Q 48.7 43.05 46.35 40.7 44 38.35 
        44 35 L 44 23 70 23 70 32.75 Q 70.1 28.75 72.95 25.9 75.75 23.1 79.75 23 M 70 48 L 70 32.75 M 21 23 Q 24.4 23.25 27.05 25.9 30 28.85 30 33 30 37.1 27.05 40.05 24.15 43 20 43 
        15.85 43 12.95 40.05 10 37.1 10 33 M 16 23 L 21 23'/></g></svg>`*/

        /*menu = document.createElement( 'div' );
        menu.style.cssText = 'position:absolute; top:0px; right:0px; width:270px; height:100%; background:rgba(0,0,6,0.1);; '
        content.appendChild( menu )*/

        /*let logo = `<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' 
        preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='80px' height='40px' viewBox='0 0 100 50'>
        <g><path id='PHY' stroke='#000006' stroke-width='10' style='stroke-opacity: .3;' fill='none' d='M 19 7 L 24 7 Q 31.05 7 36 10.5 41 14.05 41 19 41 23.95 36 27.45 31.05 
        31 24 31 L 24 48 M 24 31 Q 16.95 31 11.95 27.45 7 23.95 7 19 7 14.05 11.95 10.5 12.3 10.25 12.675 10.025 M 24 31 L 24 7'/></g></svg>`

        title = document.createElement( 'div' );
        title.style.cssText = 'position:absolute; top:7px; left:-4px;'
        content.appendChild( title )
        title.innerHTML = logo;*/

        fps = document.createElement( 'div' );
        //fps.style.cssText = 'position: absolute; bottom:3px; left:10px; font-size:12px; font-family:Tahoma; color:#dcdcdc; text-shadow: 1px 1px 1px #000;'
        fps.style.cssText = 'position:absolute; bottom:3px; left:10px; font-size:12px; font-weight:bold; '
        content.appendChild( fps )

        debug = document.createElement( 'div' );
        //debug.style.cssText = 'position: absolute; bottom:20px; left:10px; font-size:14px; font-family:Tahoma; color:#dcdcdc; text-shadow: 1px 1px 1px #000;  width:400px; vertical-align:bottom;'
        debug.style.cssText = 'position:absolute; bottom:20px; left:10px; font-size:13px;  width:400px; vertical-align:bottom;'
        content.appendChild( debug )


        statistics = document.createElement( 'div' );
        //statistics.style.cssText = 'position: absolute; top:3px; left:10px; font-size:14px; font-family:Tahoma; color:#00ff33; text-shadow: 1px 1px 1px #000; width:200px; white-space: pre;'
        statistics.style.cssText = 'position:absolute; top:0px; left:-10px; font-size:14px; font-weight:bold; width:200px; white-space: pre; line-height:18px;'
        
        content.appendChild( statistics )

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

        if( crossTween !== null ) TWEEN.remove( crossTween );

        crossTween = new TWEEN.Tween( setting ).to( { cross:n }, time || 300 )
        .easing( TWEEN.Easing.Quartic.Out )
        .onUpdate( function( o ) { this.setCrossSize( o.cross ); }.bind(this) )
        .start();

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