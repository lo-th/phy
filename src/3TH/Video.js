//import { Main } from '../Main.js'
import { Shader } from './Shader.js'

export class Video {

    constructor () {

        //this.renderer = renderer;
        this.isCapture = false
        this.ready = false;

    }

    update(){
        if( this.isCapture ) this.capturer.capture( Shader.renderer.domElement );
    }
    
    stop(){

        if( !this.isCapture ) return;

        this.capturer.stop();
        this.capturer.save();
        
        this.isCapture = false;

    }

    start () {

        if( this.isCapture ) return;
        if( !this.ready ){ 
            this.loadCCapture()
            return
        }

        this.capturer = new CCapture( {

            verbose: false,
            display: false,
            framerate: 60,
            //motionBlurFrames: 1,//( 960 / framerate ) * 0 ,
            quality: 50,//80
            format:"webm-mediarecorder",
            //format:"webm",
            currentTime:0,
            timeLimit: 60,
            frameLimit: 0,
            autoSaveTime: 0,
            //autoSaveTime:10,
            //workersPath:'./js/',
            //timeLimit: 60,//second
            //frameLimit: 0,
            //autoSaveTime: 0,
            //onProgress: function( p ) { progress.style.width = ( p * 100 ) + '%' }
        });

        //console.log('CCapture is ready', this.capturer )
        this.isCapture = true;
        this.capturer.start();
        
    }

    

    loadCCapture () {

        var xml = new XMLHttpRequest();
        xml.open('GET', './src/libs/CCapture.all.min.js')
        xml.overrideMimeType( "text/javascript" )
        xml.onreadystatechange = function() {
            if ( xml.readyState === 4 ) {
                if ( xml.status === 200 || xml.status === 0 ) {
                    let n = document.createElement("script");
                    n.type = "text/javascript";
                    n.async = true;
                    n.charset = "utf-8";
                    n.text = xml.responseText;
                    document.getElementsByTagName('head')[0].appendChild(n);
                    this.ready = true;
                    this.start()
                }
                else console.error( "Couldn't load [ccapture] [" + xml.status + "]" );
            }
            
        }.bind(this)
        xml.send()

    }

   /* mode(){

        this.isCaptureMode = b;

        if( this.isCaptureMode ){

            window.removeEventListener( 'resize', view.resize );

            renderer.domElement.style.position = "absolute";
            renderer.domElement.style.left = "50%";
            renderer.domElement.style.top = "50%";
            renderer.domElement.style.border = '1px solid #F00';

            view.setVideoSize();
            view.initCapture();

        } else {

            renderer.domElement.style.position = "absolute";
            renderer.domElement.style.left = "0px";
            renderer.domElement.style.top = "0px";
            renderer.domElement.style.margin = '0px 0px';
            renderer.domElement.style.border = 'none';

            window.addEventListener( 'resize', view.resize );
            view.resize();

        }

    }*/

    /*size(){

        if( !isCaptureMode ) return;

        if( v !== undefined ) view.videoSize = v;

        var w = view.videoSize[0];
        var h = view.videoSize[1];
        renderer.domElement.style.margin = (-h*0.5)+'px '+ (-w*0.5)+'px';
        view.resize( null, w, h );

    }*/


}