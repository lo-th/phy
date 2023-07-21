//import * as UIL from 'uil'
import * as UIL from '../libs/uil.module.js'
import CodeFlask from '../libs/codeflask.module.js'
import { CodeMirror } from '../libs/cm6.module.js'

/** __
*    _)_|_|_
*   __) |_| | 2023
* @author lo.th / https://github.com/lo-th
*/

export class Editor {

    constructor ( solo = false ) {

        this.esprimaReady = false

        this.loadEsprima()

        this.isSolo = solo
        this.isOpen = false
        this.source = null
        this.left = 0
        this.refresh = false
        this.old = ''

        this.extraCode = []

        this.useCodeMirror = true
        this.errorLines = [];
        this.widgets = [];


        if( this.isSolo ) this.open()

    }

    message ( e ) {

        let type = e.data.type

        switch( type ){
            case 'connect' :

            this.source = e.source
            this.send({ type:'connect', msg:'Editor connected !!'})

            break;
            case 'set' :

            this.set( e.data.code, e.data.name )

            break;
        }

    }

    send( data ){

        if( !this.source )  return 
        this.source.postMessage( data )

    }

    detach () {

        if(this.isSolo) this.send({ type:'close' })
        else Main.externEditor()

    }

    reset(){

        //let extra = document.getElementById("extra");
        //if(extra)document.head.removeChild(extra);//Remooves main.js from the DOM tree

        
        let i = this.extraCode.length
        while( i-- ){
            this.extraCode[i].remove() 
            //document.getElementsByTagName('head')[0].removeChild(this.extraCode[i]);
        }
        this.extraCode = []
        //console.log('extra is reset')

    }

    loadSrcipt ( url ) {

        const name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') )
        var xml = new XMLHttpRequest();
        xml.open('GET', url );
        xml.overrideMimeType( "text/javascript" );
        xml.onreadystatechange = function() {
            if ( xml.readyState === 4 ) {
                if ( xml.status === 200 || xml.status === 0 ) {
                    this.set( xml.responseText, name )
                }
                else console.error( "Couldn't load ["+ name + "] [" + xml.status + "]" );
            }
        }.bind(this)
        xml.send()

    }

    loadExtra ( url, callback ) {

        const name = url.substring( url.lastIndexOf('/')+1, url.lastIndexOf('.') )
        var xml = new XMLHttpRequest();
        xml.open('GET', url );
        xml.overrideMimeType( "text/javascript" );
        xml.onreadystatechange = function() {
            if ( xml.readyState === 4 ) {
                if ( xml.status === 200 || xml.status === 0 ) {
                    let n = document.createElement("script");
                    n.language = "javascript"
                    n.type = "text/javascript";
                    n.charset = "utf-8";
                    n.async = false;
                    n.innerHTML =  '{' + xml.responseText + '}'
                    this.extraCode.push(n)
                    document.getElementsByTagName('head')[0].appendChild(n);
                    //document.head.appendChild(n)
                    callback()
                }
                else console.error( "Couldn't load ["+ name + "] [" + xml.status + "]" );
            }
        }.bind(this)
        xml.send()

    }

    loadEsprima () {

        var xml = new XMLHttpRequest();
        xml.open('GET', './src/libs/esprima.js')
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
                    this.esprimaReady = true
                }
                else console.error( "Couldn't load [esprima] [" + xml.status + "]" );
            }
            
        }.bind(this)
        xml.send()

    }

    show ( b ) {

        if( this.isOpen && !b ) this.close()
        else this.open()
        if( Main ) Main.setLeft( this.left )

    }
 
    open () {

        this.left = this.isSolo ? window.innerWidth : (window.innerWidth*0.5)-200
        this.isOpen = true

        let text = 'font-smooth: antialiased; -webkit-font-smoothing : antialiased; -moz-osx-font-smoothing: grayscale;'//text-rendering: optimizeSpeed; text-shadow: 1px 1px 1px #000;

        let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; '

        this.content = document.createElement( 'div' )

        if( this.isSolo ) this.content.style.cssText = 'position:absolute; margin:0; padding:0; top:0px; left:0px; width:100%;  height:100%; '
        else this.content.style.cssText = 'position:absolute; margin:0; padding:0; top:0px; left:0px; width:'+this.left+'px;  height:100%; '
        this.content.style.cssText += "font-size:18px; font-family:'Roboto Mono', 'Source Code Pro', Consolas, monospace; color:#f8f8f2; background:#181915;"//background: #282923;#20211c
        document.body.appendChild( this.content )


        this.codeContent = document.createElement( 'div' )
        this.codeContent.style.cssText = text + 'position:absolute; margin:0; padding:0; top:30px; left:3px; width:calc( 100% - 6px); height:calc( 100% - 60px); border-top: 1px solid #3e4036; border-bottom: 1px solid #3e4036;'
        
        if(this.useCodeMirror){
            this.code = new CodeMirror( this.codeContent, this.onUpdate.bind(this) )
            //this.code = CodeMirror( this.codeContent, { theme:'monokai', lineNumbers: true, matchBrackets: true, indentWithTabs: false, styleActiveLine: false, tabSize: 4, indentUnit: 4/*, highlightSelectionMatches: {showToken: /\w/}*/});
            //this.code.on('change', function () { this.onUpdate(this.code.getValue()) }.bind(this) );
        } else {
            this.code = new CodeFlask( this.codeContent, { language: 'js', handleTabs: true, lineNumbers: true })
            this.code.onUpdate( this.onUpdate.bind(this) )
        }

        this.content.appendChild( this.codeContent )

        this.title = document.createElement( 'div' )
        this.title.style.cssText = unselectable + "position:absolute; top:3px; left:10px; width:calc( 100% - 20px); color:#7c806c; text-shadow: 1px 1px 1px #000;"
        this.content.appendChild( this.title )

        //  mini menu
        
        this.solo = document.createElement( 'div' )
        this.solo.style.cssText = unselectable + "position:absolute; top:0px; right:0px; width:30px; height:30px; pointer-events:auto; cursor: pointer;"
        this.solo.appendChild( UIL.Tools.dom( 'path', 'position:absolute; width:14px; height:14px; left:8px; top:8px; pointer-events:none;', { d:UIL.Tools.svgs[ 'extern' ], fill:'#DDD', stroke:'none'} ))
        this.content.appendChild( this.solo )
        this.solo.name = 'detach'

        this.saver = document.createElement( 'div' )
        this.saver.style.cssText = unselectable + "position:absolute; top:0px; right:30px; width:30px; height:30px; pointer-events:auto; cursor: pointer;"
        this.saver.appendChild( UIL.Tools.dom( 'path', 'position:absolute; width:14px; height:14px; left:8px; top:8px; pointer-events:none;', { d:UIL.Tools.svgs[ 'save' ], fill:'#DDD', stroke:'none'} ))
        this.content.appendChild( this.saver )
        this.saver.name = 'save'

        this.loader = document.createElement( 'div' )
        this.loader.style.cssText = unselectable + "position:absolute; top:0px; right:60px; width:30px; height:30px; pointer-events:auto; cursor: pointer;"
        this.loader.appendChild( UIL.Tools.dom( 'path', 'position:absolute; width:14px; height:14px; left:8px; top:8px; pointer-events:none;', { d:UIL.Tools.svgs[ 'load' ], fill:'#DDD', stroke:'none'} ))
        this.content.appendChild( this.loader )
        this.loader.name = 'load'

        this.help = document.createElement( 'div' )
        this.help.style.cssText = unselectable + "position:absolute; top:3px; right:100px; width:60px; height:30px; pointer-events:none; color:#7c806c; text-shadow: 1px 1px 1px #000; text-align:right"
        this.content.appendChild( this.help )

        //

        this.info = document.createElement( 'div' )
        this.info.style.cssText = unselectable + "position:absolute; bottom:2px; left:10px; width:calc( 100% - 20px); text-shadow: 1px 1px 1px #000;"
        this.content.appendChild( this.info )

        this.separator = document.createElement( 'div' )
        this.separator.style.cssText = unselectable + 'background:none; position:absolute; top:0px; right:0px; width:3px; height:100%; cursor: e-resize; pointer-events:auto; z-index: 5; display:block; '
        this.content.appendChild( this.separator )

        this.midDown = function (e) { this.isDown = true;  }.bind(this)

        this.midUp = function (e) { 
            this.isDown = false; 
            document.body.style.cursor = 'auto'
            this.codeContent.style.pointerEvents = 'auto'
        }.bind(this)

        this.midMove = function (e) { 

            if( e.target.name ){
                this.help.innerHTML = e.target.name
            }  else this.help.innerHTML = ''

            if(!this.isDown) return

            this.codeContent.style.pointerEvents = 'none'
            document.body.style.cursor = 'e-resize'

            this.left = e.clientX+2
            this.content.style.width = this.left+'px'
            if(Main) Main.setLeft( this.left )

        }.bind(this)

        this.helpers = function (e) { console.log(e.target.name) }.bind(this)

        if( !this.isSolo ){
            this.separator.addEventListener( 'pointerdown', this.midDown, false )
            document.addEventListener('pointermove', this.midMove, false )
            document.addEventListener('pointerup', this.midUp, false )
        }
        
        this.saver.addEventListener( 'pointerdown', this.save.bind(this), false )
        this.loader.addEventListener( 'pointerdown', this.load.bind(this), false )
        this.solo.addEventListener( 'pointerdown', this.detach.bind(this), false )

        if( Main ) {
            this.setInternCode( Main.getCode() )
            this.setTitle( Main.getCodeName() )
        }

        if( this.isSolo ){
            var hash = location.hash.substr( 1 )
            if( hash !== '' ) this.loadSrcipt('./demos/'+ hash + '.js')
        } else {
           if(!this.useCodeMirror) this.content.addEventListener( 'wheel', function(e){ this.code.wheel(e) }.bind(this) )
        }

        this.content.addEventListener( 'dragover', function(e){ e.preventDefault() }, false );
        this.content.addEventListener( 'dragend', function(e){ e.preventDefault() }, false );
        this.content.addEventListener( 'dragleave', function(e){ e.preventDefault()}, false );
        this.content.addEventListener( 'drop', this.drop.bind(this), false );

    }

    setTitle ( name ) {

        this.codeName = name
        this.title.innerHTML = '&#x2022;&#160;' + this.codeName

    }

    close () {

        this.left = 0
        this.isOpen = false

        document.removeEventListener('pointerdown', this.midDown );
        document.removeEventListener('pointerup', this.midUp );
        document.removeEventListener('pointermove', this.midMove );

        this.code.clear()

        this.content.innerHTML = ''

        document.body.removeChild( this.content )
        
    }

    onUpdate ( code ){

        let b = this.validate( code )//this.useCodeMirror ? this.validateMirror( code ) : this.validate( code )
        
        if( !this.refresh ) this.refresh = this.code.isEdit

        if( b && this.refresh ){ 
            if( Main ) Main.injectCode( code )
            if( this.source ) this.send({ type:'inject', code:code })
            this.refresh = false
        }

    }

    set ( code, name, refresh ){

        //console.log('editor set')

        if( !this.isOpen ) return

        this.setTitle( name )

        if( this.isSolo ) location.hash = name

        if( refresh ) this.refresh = refresh

        this.setInternCode( code )

    }

    setInternCode( code ) {

        if( this.useCodeMirror ) this.code.setValue( code );
        else this.code.updateCode( code )
        this.code.isEdit = false;

    }

    get () {

        return this.useCodeMirror ? this.code.getValue() : this.code.getCode()

    }

    save ( e ) {

        UIL.Files.save( { name:this.codeName, data:this.get(), type:'js' } )
    
    }

    load ( e ) {

        UIL.Files.load( { callback:this.onLoad.bind(this), type:'js' } )
    
    }

    onLoad ( src, Name ) {

        const name = Name.substring( 0, Name.lastIndexOf('.') )
        this.set( src, name )

    }

    setInfo ( message, e=0 ) {

        this.info.style.color = e ? '#ff0000':'#7c806c'
        this.info.innerHTML = message

    }

    /*validate ( code ) {

        if( !code ) return
        if( !this.esprimaReady ) return true

        try {
            const syntax = esprima.parseModule(code, { tolerant: true, loc: true, range: true, jsx: true });
            if (syntax.errors.length > 0) {
                for (let i = 0; i < syntax.errors.length; ++i) {
                    let e = syntax.errors[i]
                    console.log( e.description, e.lineNumber, e.column )
                    this.code.addError(e.description, e.lineNumber, e.column)
                }
                this.setInfo('Invalid code. Total issues: ' + syntax.errors.length, 1)
                return false
            } else {
                if (syntax.body.length === 0) this.setInfo('info', 'Empty code. Nothing to validate.')
                this.setInfo('&#2039;')
                this.code.noError()
                return true
            }
        } catch (e) {
            this.code.addError(e.toString(), e.lineNumber, e.column);
            this.setInfo(e.toString(), 1)
            return false
        }

    }*/

    validate ( code ) {

        if( !code ) return
        if( !this.esprimaReady ) return true

        let errorLines = []
        let ee

        try {
            errorLines = esprima.parseModule( code, { tolerant: true, loc: true, range: true, jsx: true }).errors;
        } catch ( e ) {
            errorLines.push( e )
        }

        let j = errorLines.length;
        if( j === 0) this.setInfo('&#2039;')
        else this.setInfo('Invalid code. Total issues: ' + j , 1)

        this.code.addError( errorLines );

        return j === 0

    }

    /*validateMirror ( value ) {

        if( !value ) return
        if( !this.esprimaReady ) return true

        const code = this.code
        const errorLines = this.errorLines
        const widgets = this.widgets
        let _selt = this

        return code.operation( function () {
            while ( errorLines.length > 0 ) code.removeLineClass( errorLines.shift(), 'background', 'errorLine' );
            var i = widgets.length;
            while(i--) code.removeLineWidget( widgets[ i ] );
            widgets.length = 0;
            var string = value//currentCode;
            try {
                var result = esprima.parse( string, { tolerant: true } ).errors;
                i = result.length;
                while(i--){
                    var error = result[ i ];
                    var m = document.createElement( 'div' );
                    m.className = 'esprima-error';
                    m.textContent = error.message.replace(/Line [0-9]+: /, '');
                    var l = error.lineNumber - 1;
                    errorLines.push( l );
                    code.addLineClass( l, 'background', 'errorLine' );
                    var widget = code.addLineWidget( l, m );
                    widgets.push( widget );
                }
            } catch ( error ) {
                var m = document.createElement( 'div' );
                m.className = 'esprima-error';
                m.textContent = error.message.replace(/Line [0-9]+: /, '');
                var l = error.lineNumber - 1;
                errorLines.push( l );
                code.addLineClass( l, 'background', 'errorLine' );
                var widget = code.addLineWidget( l, m );
                widgets.push( widget );
            }
            let rs = errorLines.length ;
            if( rs === 0) _selt.setInfo('&#2039;')
            else _selt.setInfo('Invalid code. Total issues: ' + rs , 1)
            return rs === 0
        });

    }*/

    drop ( e ) {

        e.preventDefault();
        if ( !e.dataTransfer.items) return

        const file = e.dataTransfer.files[0]
        const reader = new FileReader();
        const name = file.name;
        const type = name.substring(name.lastIndexOf('.')+1, name.length )
        const finalName = name.substring( name.lastIndexOf('/')+1, name.lastIndexOf('.') )

        if ( type === 'js' ) reader.readAsText( file )
        else return

        reader.onload = function ( e ) {
            this.set( e.target.result, finalName, true )
        }.bind(this);

    }

}