
import CodeFlask from './codeflask.module.js';
//import { esprima } from './esprima.js';


export class Editor {

    constructor () {

        this.isOpen = false
        this.left = 0

    }

    show () {

        if( this.isOpen ) this.close()
        else this.open()
        Main.setLeft( this.left )

    }
 
    open () {

        this.left = (window.innerWidth*0.5)-200
        this.isOpen = true

        let text = 'font-smooth: antialiased; -webkit-font-smoothing : antialiased; -moz-osx-font-smoothing: grayscale;'//text-rendering: optimizeSpeed; text-shadow: 1px 1px 1px #000;

        let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; '

        this.content = document.createElement( 'div' );
        this.content.style.cssText = 'position:absolute; margin:0; padding:0; top:0px; left:0px; width:'+this.left+'px;  height:100%; '
        this.content.style.cssText += 'font-size:18px; font-family:Tahoma; color:#f8f8f2; background: #20211c;'//background: #282923;
        document.body.appendChild( this.content )


        this.codeContent = document.createElement( 'div' );
        this.codeContent.style.cssText = text + 'position:absolute; margin:0; padding:0; top:30px; left:3px; width:calc( 100% - 6px); height:calc( 100% - 60px); border-top: 1px solid #3e4036; border-bottom: 1px solid #3e4036;'
        this.code = new CodeFlask( this.codeContent, { language: 'js', lineNumbers: true, handleTabs: true, lineNumbers: false, })
        this.code.onUpdate( function ( code ){ this.onUpdate(code)}.bind(this) )

        this.content.appendChild( this.codeContent )

        this.title = document.createElement( 'div' )
        this.title.style.cssText = unselectable + "position:absolute; top:3px; left:10px; width:calc( 100% - 20px); color:#7c806c; text-shadow: 1px 1px 1px #000;"
        this.content.appendChild( this.title )

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

            if(!this.isDown) return

            this.codeContent.style.pointerEvents = 'none'
            document.body.style.cursor = 'e-resize'

            this.left = e.clientX+2
            //this.separator.style.left = (this.left-3)+'px'
            this.content.style.width = this.left+'px'
            Main.setLeft( this.left )

         }.bind(this)

        this.separator.addEventListener( 'pointerdown', this.midDown, false );
        document.addEventListener('pointermove', this.midMove, false );
        document.addEventListener('pointerup', this.midUp, false );

        this.code.updateCode( Main.getCode() )
        this.setTitle( Main.getCodeName() )

    }

    setTitle ( name ) {
        this.codeName = name
        this.title.innerHTML = '&#x2022;&#160;&#160;' + this.codeName
    }

    close () {

        this.left = 0
        this.isOpen = false

        document.removeEventListener('pointerdown', this.midDown );
        document.removeEventListener('pointerup', this.midUp );
        document.removeEventListener('pointermove', this.midMove );

        this.code.clear()
        /*this.content.removeChild( this.separator )
        this.content.removeChild( this.content )
        this.content.removeChild( this.info )
        */

        this.content.innerHTML = ''

        document.body.removeChild( this.content )
        
    }

    onUpdate ( code ){

        let b = this.validate( code )
        if( b && this.code.isEdit ) Main.injectCode( code )

    }

    set ( code, name ){

        if(!this.isOpen) return
        this.setTitle( name )
        //this.title.innerHTML = name
        this.code.updateCode( code )

    }

    get () {
        return this.code.getCode();
    }

    save ( e ) {

        //window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

        e.preventDefault();
        var blob = new Blob( [this.get()], {type: "text/plain"} );
        saveAs( blob, fileName + '.js' );
    
    }

    setInfo ( message, e=0 ) {
        //console.log( message )
        this.info.style.color = e ? '#ff0000':'#7c806c'
        this.info.innerHTML = message
    }

    validate ( code ) {

        if( !code ) return

        try {
            var syntax = esprima.parse(code, { tolerant: true, loc: true, range: true });
            if (syntax.errors.length > 0) {
                for (var i = 0; i < syntax.errors.length; ++i) {
                    var e = syntax.errors[i];
                    //codeEditor.addErrorMarker(e.description, e.lineNumber, e.column);
                }
                this.setInfo('Invalid code. Total issues: ' + syntax.errors.length, 1);
                return false
            } else {
                if (syntax.body.length === 0) this.setInfo('info', 'Empty code. Nothing to validate.');
                this.setInfo('&#2039;');
                return true
            }
        } catch (e) {
            //codeEditor.addErrorMarker(e.toString(), e.lineNumber, e.column);
            this.setInfo(e.toString(), 1);
            return false
        }

    }

}