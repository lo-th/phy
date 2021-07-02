import {
    ShaderMaterial,
    Vector4,
    Mesh,
    PlaneGeometry
} from '../../../build/three.module.js';

import { Tools } from '../libs/uil.module.js';
import { math } from './math.js';
//import { root } from '../root.js';


export var hub = ( function () {

    var svg = Tools.dom;
    var setSvg = Tools.setSvg;
    var grad = Tools.makeGradiant;

    var parent;
    var content, cross, border, counter, counter2, zone, path, txt, info, loader, textRight, textLeft, textLeft2;
    var unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';

    var isDisplay = false;

    var a_base = [ 1, 0, 0, 1,   0, 1, -1, 0,   -1, 0, 0, -1,   0, -1, 1, 0 ];

    var crossTween = null;

    var camera, panel, panelMat;

    var isSnipper = false;

    var isReady = false;
    var fps = null;
    var debug = null;


    var setting = {
        cross:8,
        border:'#020206',
    }

    var old = { f:0, z:0, w:0, h:0, ratio:1 };
    var size = {};


   // var tween = null;

    hub = {

        init: function ( Camera, Size, text, Parent ) {

            if( isDisplay ) return;

            camera = Camera;
            size = Size;

            parent = Parent || document.body;

            content = document.createElement( 'div' );
            content.style.cssText = unselectable + "position:absolute; margin:0; padding:0; top:0; left:0; width:100%; height:100%; display:block; ";
            parent.appendChild( content );


            //this.addBorder();
            
            
            txt = document.createElement( 'div' );
            txt.style.cssText = "font-family: Tahoma; color: #fff; font-size:16px; text-align:center; position:absolute; margin:0; padding:0; top:50%; left:50%; width:512px; height:20px; margin-left:-256px; margin-top:-38px; display:block; pointer-events:none; text-shadow: 1px 1px #000000;";
            txt.textContent = text || 'load...';
            content.appendChild( txt );

            loader = document.createElement( 'div' );
            loader.style.cssText = "position:absolute; top:50%; left:50%; width:50px; height:50px; margin-left:-25px; margin-top:-25px; display:block; ";
            content.appendChild( loader );
            this.loadSvg( './assets/textures/loader.svg', loader );
            

            //loader.textContent = 'load...';

            this.init3dHub()

            isDisplay = true;

        },

        snipperMode: function ( b ) {

            isSnipper = b;

        },

        

        loadSvg: function ( url, div ) {

            var xhr = new XMLHttpRequest();
            xhr.open("GET",url,true);
            xhr.overrideMimeType("image/svg+xml");
            xhr.onload = function(e) {
                if( this.status == 200 ) div.appendChild( xhr.responseXML.documentElement );
            }
            xhr.send("");

        },

        /*clear: function () {

            if( !isDisplay ) return;

            if( tween !== null ){ TWEEN.remove( tween ); alpha = { n:1 } }

            tween = new TWEEN.Tween( alpha ).to( { n:0 }, 2000 )
                .easing( TWEEN.Easing.Quadratic.Out )
                .onUpdate( function() { intro.opacity ( alpha.n ); } )
                .onComplete( function () { intro.dispose(); } )
                .start();

        },*/

        log : function ( t = '' ) {

            if( debug === null ) return;
            debug.innerHTML = t;

        },

        setFps : function ( t ) {

            if( fps === null ) return;
            fps.innerHTML = t;

        },

        endLoading : function () {

            //loader.removeChild(loader.lastChild);
            content.removeChild( loader );
            content.removeChild( txt );

            fps = document.createElement( 'div' );
            fps.style.cssText = 'position: absolute; bottom:3px; left:10px; font-size:12px; font-family:Tahoma; color:#dcdcdc; text-shadow: 1px 1px 1px #000;'
            content.appendChild( fps );

            debug = document.createElement( 'div' );
            debug.style.cssText = 'position: absolute; bottom:20px; left:10px; font-size:14px; font-family:Tahoma; color:#dcdcdc; text-shadow: 1px 1px 1px #000;  width:400px; vertical-align:bottom;'
            content.appendChild( debug );

            /*this.addCross();

            counter = document.createElement( 'img' );
            counter.style.cssText = "position:absolute; margin:0; padding:0; bottom:0; left:0; width:363px; height:153px; display:block; pointer-events:none; ";
            counter.src = './assets/textures/fps/counter.svg';
            content.appendChild( counter );

            counter2 = document.createElement( 'img' );
            counter2.style.cssText = "position:absolute; margin:0; padding:0; bottom:0; right:0; width:363px; height:153px; display:block; pointer-events:none; ";
            counter2.src = './assets/textures/fps/counter2.svg';
            content.appendChild( counter2 );

            textRight = document.createElement( 'div' );
            textRight.style.cssText = "font-family: Verdana; color: #F6F88A; font-size:18px; text-align:right; position:absolute;  bottom:53px; right:98px; width:200px; height:20px; display:block; pointer-events:none; ";
            textRight.textContent ='8 / 64';
            content.appendChild( textRight );

            textLeft = document.createElement( 'div' );
            textLeft.style.cssText = "font-family: Verdana; color: #A0F1FE; font-size:18px; text-align:left; position:absolute; bottom:53px; left:98px; width:200px; height:20px; display:block; pointer-events:none; ";
            textLeft.textContent ='100';
            content.appendChild( textLeft );

            textLeft2 = document.createElement( 'div' );
            textLeft2.style.cssText = "font-family: Verdana; color: #C2FE43; font-size:18px; text-align:left; position:absolute; bottom:82px; left:98px; width:200px; height:20px; display:block; pointer-events:none; ";
            textLeft2.textContent ='50';
            content.appendChild( textLeft2 );

            info = document.createElement( 'div' );
            info.style.cssText = "font-family: Consolas,monaco,monospace; color: #888; font-size:12px; text-align:right; position:absolute; margin:0px; padding:0; top:50px; right:26px; width:300px; height:60px; display:block; pointer-events:none; text-shadow: 1px 1px #000000;";
            info.innerHTML = 'set level [ L ]<br>set view [ P ]<br>reload [ R ]';
            content.appendChild( info );*/

            //this.init3dHub()

        },

        count: function ( data, fire ) {

            if( fire ){
                data.n--;
                data.t--;
            }

            textRight.textContent = data.n + ' / '+ data.t;

            if( data.n === 0 ) return 'reload';
            if( data.t === 0 ) return 'empty';
            return 'fire';

        },


        dispose: function () {

            if( !isDisplay ) return;

            while (content.firstChild) content.removeChild(content.lastChild);
            parent.removeChild( content );
            
            isDisplay = false;

        },


        //-------------------------
        //
        //  BORDER
        //
        //-------------------------


        addBorder : function () {

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

        },



        //-------------------------
        //
        //  CROSS
        //
        //-------------------------

        hideCross:function( b ){

            cross.style.visibility = !b ? 'visible' : 'hidden';

        },

        addCross : function () {

            var css =  "position:absolute; margin:0; padding:0; top:50%; left:50%; width:128px; height:128px; margin-left:-64px; margin-top:-64px; display:block; ";
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

        },

        setCross : function ( n, time ) {

            if( crossTween !== null ) TWEEN.remove( crossTween );

            crossTween = new TWEEN.Tween( setting ).to( { cross:n }, time || 300 )
            .easing( TWEEN.Easing.Quartic.Out )
            .onUpdate( function( o ) { this.setCrossSize( o.cross ); }.bind(this) )
            .start();

        },

        setCrossSize: function ( d ) {

            let i,n, m, t = a_base;
            let p = [ 32, 32-d,   32+d, 32,   32, 32+d,   32-d, 32 ];

            for( i = 0; i<4; i++){
                m=i*4
                n = i*2;
                setSvg( cross, 'transform', 'matrix( '+ t[m]+' '+t[m+1]+' '+t[m+2]+' '+t[m+3]+' '+p[n]+' '+p[n+1] +' )', 1, i );
            }

        },

        //-------------------------
        //
        //  3D HUB
        //
        //-------------------------

        init3dHub : function ( ) {

            //camera = root.view.getCamera();

            //var s = root.view.getSizer()

            panelMat = new ShaderMaterial( {

                uniforms: {

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
                    vec4 cFour = vec4(0.0, 0.0, 0.0, 0.5);

                    vec4 color = mix( cOne, cTwo, smoothstep( step.x, step.y, dist ));
                    color = mix( color, cTree, smoothstep(step.y, step.z, dist ));
                    color = mix( color, cFour, smoothstep(step.z, step.w, dist ));

                    gl_FragColor = color;

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
            panel.position.z = -0.1;
            camera.add( panel )

            panel.renderOrder = 1000000;

            isReady = true;

            this.update();

            

            //root.view.setExtraResize( function( s ){ this.resize( s ) }.bind(this) )

            //root.view.setExtraResize( this.resize.bind(this) );
            //this.resize( root.view.getSizer() );



        },

        setFocus: function ( v ){

            

        },

        update:function ( Size, type ) {

            if( Size ) size = Size;
            let s = size;



            type = type || '';

            //let s = root.view.getSizer();
            let fov = camera.fov;
            let z = camera.zoom;
            let d = 0, r = 1;

            //console.log( s, fov, z )

            

            if( s.w !== old.w || s.h !== old.h || fov !== old.f || z !== old.z ){ 

                this.resize( s, fov, z );

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

        },

        resize: function ( s, fov, z ){

            var v = fov * math.torad; // convert to radians
            var r = (s.h / ( 2 * Math.tan( v * 0.5 ) ));
            var e = 1//3/5; // ???

            panel.scale.set( s.w, s.h, 0 ).multiplyScalar(0.0001);
            //panel.scale.set( 50, 50, 0 ).multiplyScalar(0.0001);
            //panel.scale.z = 1;
            panel.position.z = -r*0.0001*z;

            //

            old.f = fov;
            old.z = z;
            old.w = s.w;
            old.h = s.h;
            old.ratio = s.w / s.h;


            if(fps) fps.style.left = (s.left + 10) + "px"
            

        },

        
    }

    return hub;

})();