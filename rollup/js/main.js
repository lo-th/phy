/**
 * @author lth / https://github.com/lo-th
 */

var compact, unpack, engine;

function init () {

    compact = new Menu( true );
    engine = new Engine()
    //unpack = new Menu( false );

    /*var icon = document.createElement('div');
    icon.style.cssText =" position: absolute; left:50%; margin-left:-64px;  top:0px; width:128px; height:128px; background: url(./assets/icon.svg); background-size: 128px 128px; pointer-events:none;";
    document.body.appendChild( icon );*/

}


////////////////////////////////////////////

class Engine {
	constructor (b) {

		const list = ['OimoPhysics', 'ammo.js', 'Rapier', 'JoltPhysics.js', 'Havok Physics', 'PhysX'];

		this.content = document.createElement('div');
		this.content.style.cssText = `position:absolute; top:0px; left:0px; width:100%; display:flex;`;

		for( let i in list ) this.button(list[i]);
		
		document.body.appendChild( this.content );

	}

	button ( name ) {

		const b = document.createElement('div');
		b.innerHTML = name;
		b.id = name;
		b.style.cssText = `
		font-size:20px; text-shadow: 1px 1px 3px #000000; font-weight:bold;
		color:#ffffff; text-align:center; opacity:0.5;
		width:210px; height:28px; margin:10px 10px;
		pointer-events:auto; cursor:pointer; border:2px solid #ffffff;
		`;
		this.content.appendChild(b);

		let self = this;

		b.addEventListener('mouseover', function(e){ this.style.opacity = 1; }, false);
		b.addEventListener('mouseout', function(e){ this.style.opacity = 0.5; }, false);
		b.addEventListener('mousedown', function(e){ self.process(this.id) }, false);

	}

	process (name){

		const url = '../build/'+name+'.min.js'
		console.log( name, url );

	}
}

class Menu {

	constructor (b) {

		this.b = b;
		this.isScroll = false;
		this.isDown = false;
		this.isDisplay = false;

		this.color = {
			bg: b ? '#104b27' : '#581c40',
			tbg: b ? '#0c381d' : '#421530',
			text: b ? '#29bb61' : '#dc46a1',
			scroll: b ? 'rgba(41,187,97,0.25)' : 'rgba(220,70,161,0.25)',
		}

		this.mode = 2;

		this.pool = [];
	   // this.callback = callback || new function(){};
		this.reader = new FileReader();
		this.file = null;

		this.content = document.createElement('div');

		var pos = b ? 'left:0; top:0; width:50%;' : 'left:50%; top:0; width:50%;';
		this.content.style.cssText = pos + 'position:absolute; height:100%; padding: 10px 10px; box-sizing: border-box; background:'+this.color.bg+'; ';

		this.title = document.createElement('div');
		this.subtitle = document.createElement('div');
		this.top = document.createElement('div');
		this.drager = document.createElement('div');
		this.loader = document.createElement('div');
		this.hide = document.createElement('input');
		this.hide.type = "file";

		this.title.textContent = b ? 'COMPACT' : 'UNPACK';
		this.subtitle.textContent = b ? 'Compress any text file to LZMA' : 'test decompression';

		var def = 'text-align:center; font-weight: bold; font-size:14px; padding-top:10px; box-sizing: border-box; border-radius: 20px; color:'+this.color.text+';';
		var unselect = "-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select:none;"
		var txt = 'position:absolute; left:0px; text-align:center;  width:100%; color:'+this.color.text+';'

		this.unselect = unselect;

		this.title.style.cssText =txt + ' top:10px; font-size:20px; font-weight: bold;'
		this.subtitle.style.cssText = txt + 'top:30px; font-size:12px; color:'+this.color.text+';'
		this.top.style.cssText = 'position:absolute; left:50%; height:40px; top:60px; box-sizing: border-box; margin-left:-105px; pointer-events:none;';

		this.drager.style.cssText = unselect+def+'position:absolute; top:0px; left:110px; width:100px; height:40px; border:2px dashed '+this.color.text+'; pointer-events:auto; cursor:pointer;';
		this.loader.style.cssText = unselect+def+'position:absolute; top:0px; left:0px; width:100px; height:40px; pointer-events:none; border:2px solid '+this.color.text+';';
		this.hide.style.cssText = "position:absolute; top:0px; left:0px; width:100px; height:40px; opacity:0; overflow:hidden; pointer-events:auto; cursor:pointer;";

		this.drager.innerHTML = 'DRAG';
		this.loader.innerHTML = 'LOAD';

		this.txtContent = document.createElement('div');
		this.info = document.createElement('div');
		this.txt = document.createElement('div');
		this.scroll = document.createElement('div');
	    
		this.txtContent.style.cssText = unselect+ 'position:absolute; border-radius:10px; text-align:center; overflow:hidden;  top:'+(b? 170:120)+'px; left:50%; margin-left:calc(-50% + 40px); width:calc(100% - 80px); height:calc(100% - '+(b? 220:170)+'px); pointer-events:auto; border:2px solid '+this.color.text+'; background:'+this.color.tbg+'; cursor:ns-resize;';
		this.txt.style.cssText = unselect+ 'position:absolute; box-sizing: border-box; text-align:left; left:0px; top:0px; width:100%; height:auto; pointer-events:none; font-size:10px; color:'+this.color.text+'; padding:10px 10px;';
		this.info.style.cssText = unselect+ 'position:absolute; text-align:center; font-weight: bold; font-size:14px; left:0px; bottom:10px; height:20px; width:100%; color:'+this.color.text+';'
		this.scroll.style.cssText = unselect+ 'position:absolute;  border-radius:10px; left:0px; top:0px; height:20px; width:100%; display:none; background:'+this.color.scroll+';'
	   
	   
	    this.txtContent.appendChild( this.txt );
	    this.txtContent.appendChild( this.scroll );
	    this.txtContent.style.display = 'none';

	    this.content.appendChild(this.title);
	    this.content.appendChild(this.subtitle);
		this.content.appendChild(this.top);
		this.content.appendChild(this.txtContent);
		this.content.appendChild(this.info);

		this.top.appendChild(this.hide);
	    this.top.appendChild(this.loader);
	    this.top.appendChild(this.drager);

	    var _this = this;

	    this.reader.onload = function(e) { if( this.b ) this.compact( e.name.result ); else this.decompact( e.name.result ); }.bind(this);

	    this.drager.addEventListener('dragover', function(e){_this.dragOver(e);}, false);
	    this.drager.addEventListener('dragend', function(e){_this.dragEnd(e);}, false);
	    this.drager.addEventListener('dragleave', function(e){_this.dragEnd(e);}, false);
	    this.drager.addEventListener('drop', function(e){_this.drop(e);}, false);
	    
	    this.hide.addEventListener('mouseover', function(e){_this.fileOver(e);}, false);
	    this.hide.addEventListener('mouseout', function(e){_this.fileOut(e);}, false);
	    this.hide.addEventListener('change', function(e){_this.handleFileSelect(e);}, false);

	    this.txtContent.addEventListener('mouseover', function(e){_this.txtOver(e);}, false);
	    this.txtContent.addEventListener('mouseout', function(e){_this.txtOut(e);}, false);
	    this.txtContent.addEventListener('mouseup', function(e){_this.txtUp(e);}, false);
	    this.txtContent.addEventListener('mousedown', function(e){_this.txtDown(e);}, false);
	    this.txtContent.addEventListener('mousemove', function(e){_this.txtMove(e);}, false);

	    window.addEventListener( 'resize', function(e){_this.resize(e);} , false );

	    document.body.appendChild( this.content );

	    if(b){

	    	this.save = document.createElement('div');
	        this.save.innerHTML = 'SAVE';
	        this.save.style.cssText = def+'position:absolute; top:110px; left:50%; margin-left:-105px; width:210px; height:40px; pointer-events:none; opacity:0.5; cursor:pointer; border:2px solid '+this.color.text+';'
	        this.content.appendChild(this.save);

	        this.save.addEventListener('mouseover', function(e){_this.saveOver(e);}, false);
	        this.save.addEventListener('mouseout', function(e){_this.saveOut(e);}, false);
	        this.save.addEventListener('mousedown', function(e){ _this.saveFile() }, false);

	    } else {
	    	this.addGithubLink();
	    }

	}

	read () {

        var fname = this.file.name;
        var type = fname.substring(fname.lastIndexOf('.')+1, fname.length );

        if( type==='z' || type==='sea' || type==='7z' || type==='bin' || type==='hex' ) this.reader.readAsArrayBuffer( this.file );
        else this.reader.readAsText( this.file );
        
    }

    saveFile () {

	    var name = this.file.name;
	    name = name.substring( name.lastIndexOf('/')+1, name.lastIndexOf('.') );
        name = name.replace(/.min/i, '');

	    var blob = new Blob( [new Uint8Array(this.result)], {type: "application/octet-stream"} );
	    saveAs( blob, name + '.hex' );

	}

	decompact ( buffer ) {

		this.isDisplay = false;

		this.txtContent.style.display = 'none';
		this.txt.style.width = '100%';
		this.txt.style.wordWrap = 'break-word';
        //this.txt.style.whiteSpace = 'nowrap';
		this.time = new Date().getTime();
        this.txt.style.top = '0px';
        this.scroll.style.top = '0px';

        //var ar = new Uint8Array( buffer.length );
        //for (var i = 0, len = buffer.length; i < len; ++i){ ar[i] = buffer.charCodeAt(i) & 0xff; };

		lzma.decompress(
            //ar,
	        new Uint8Array( buffer ), 
	        function on_complete ( result ) { 

	        	this.txtContent.style.display = 'block';
	        	this.info.innerHTML = this.file.name +' '+ this.format_time( new Date().getTime() - this.time );

                this.txt.innerHTML = result.replace(/\n|\r/g,'<br>')//result//.replace(/ /g, '_'); ;////.replace(/\n/g,'<br>');//.replace(/\n|\r/g,'<br>');

                //this.txt.innerHTML = this.formatedToHex( result );

	        	//this.txt.textContent = result.replace(/\n|\r/g,'\n')//.replace(/\n/g,'<br>');//.replace(/\n|\r/g,'<br>');
	        	this.isDisplay = true;
	        	this.calcScroll();

	        }.bind(this),
	        function on_progress( percent ) { 
	        	this.info.innerHTML = this.file.name +' '+ (percent*100).toFixed(0) + '% '; 
	        }.bind(this)
	    ); 

	}

	compact ( buffer ) {

		this.isDisplay = false;

        this.save.style.opacity = '0.5';
        this.save.style.pointerEvents = 'none';
        
		this.txtContent.style.display = 'none';
		this.txtContent.style.width = 'calc(100% - 80px)';
		this.txtContent.style.marginLeft = 'calc(-50% + 40px)';
        this.txt.style.width = 'auto'
        this.txt.style.top = '0px';
        this.scroll.style.top = '0px';

	    this.time = (new Date).getTime();

	    LZMA.compress(
	        buffer, this.mode,
	        function on_complete( result ) { 
	        	this.info.innerHTML = this.file.name +' '+ this.format_time( new Date().getTime() - this.time );
	        	this.result = result;

                this.save.style.opacity = '1';
                this.save.style.pointerEvents = 'auto';

	        	this.txtContent.style.display = 'block';

	        	this.txt.innerHTML = this.formatedToHex( result );

	        	var box = this.getZone( this.txt );
	        	var w = Math.round(box.width)+1;
	        	this.txtContent.style.width = w+'px';
	        	this.txtContent.style.marginLeft = (-w*0.5)+'px';

	        	this.isDisplay = true;

	        	this.calcScroll();

	        }.bind(this),  
	        function on_progress( percent ) { 
	        	this.info.innerHTML = this.file.name +' '+ (percent*100).toFixed(0) + '% '; 
	       }.bind(this)
	    );

	}

    ///

    format_time ( time ) {

	    if (time > 1000)  return (time / 1000) + " sec";
	    return time + " ms";

	}

	formatedToHex ( byte_arr ) {

	    var hex_str = "", i, len, tmp_hex;
	    len = byte_arr.length;
	    var n = 0;
	    for (i = 0; i < len; ++i) {

	        if (byte_arr[i] < 0) byte_arr[i] = byte_arr[i] + 256;
	        tmp_hex = byte_arr[i].toString(16);
	        
	        /// Add leading zero.
	        if (tmp_hex.length === 1) tmp_hex = "0" + tmp_hex;
	        
	        if ((i + 1) % 16 === 0){ 
	            tmp_hex += "<BR>";//"\n";
	            n=0;
	        } else{
	            n = n===0? 1:0;
	            if(n===0) tmp_hex += " ";
	        }
	        
	        hex_str += tmp_hex;
	    }

	    return hex_str;

	}

	dragOver (e) {

        e = e || window.event;
        if(e.preventDefault) e.preventDefault();
        this.drager.style.border = '2px dashed #fff';
        this.drager.style.color = '#Fff';
        return false;

    }

    dragEnd (e) {

        e = e || window.event;
        if(e.preventDefault) e.preventDefault();
        this.drager.style.border = '2px dashed '+ this.color.text;
        this.drager.style.color = this.color.text;
        return false;

    }

    drop (e) {

        e.preventDefault();

        this.dragEnd(e);

        this.file = e.dataTransfer.files[0];
        this.read();
        return false;

    }

    handleFileSelect ( e ) {

        this.file = e.name.files[0];
        this.read();

    }

    saveOver ( e ) {

    	e.preventDefault();
        this.save.style.border = '2px solid #fff';
        this.save.style.color = '#fff';

    }

    saveOut ( e ) {

    	e.preventDefault();
        this.save.style.border = '2px solid ' + this.color.text;;
        this.save.style.color = this.color.text;

    }

    fileOver ( e ) {

    	e.preventDefault();
        this.loader.style.border = '2px solid #fff';
        this.loader.style.color = '#fff';

    }

    fileOut ( e ) {

    	e.preventDefault();
        this.loader.style.border = '2px solid ' + this.color.text;
        this.loader.style.color = this.color.text;

    }

    // SCOLL

    calcScroll () {

		var h = this.getZone( this.txt ).height;
		var box = this.getZone( this.txtContent );

		var max = box.height-4;
		this.ty = box.top+2;

		this.isScroll = h > max ? true : false;
		this.scroll.style.display = this.isScroll ? 'block' : 'none';

		if(!this.isScroll) return;

		var r = max / h;
		var realsh = ( max * r );
        
        this.sh = realsh < 20 ? 20 : realsh;

		this.range = max - this.sh;
       //this.diff = realsh/this.sh;
		this.ratio = 1/ ((max-(this.sh - realsh+0.1))/(h))//((max-(this.sh))/h)//(1/((max-this.diff )/ (h) ));
		this.scroll.style.height = this.sh + 'px';


        //console.log(max)//(h/this.sh)*r )

	}

	txtOver ( e ) {
		 e.preventDefault();
	}

	txtOut ( e ) {
		 e.preventDefault();
		this.isDown = false;
	}

	txtUp ( e ) {
		 e.preventDefault();
		this.isDown = false;
	}

	txtDown ( e ) {
		 e.preventDefault();
		this.isDown = true;
		this.txtMove(e);
	}

	txtMove ( e ) {

		e.preventDefault();

		if(!this.isDown) return

		var y = e.clientY - this.ty - this.sh*0.5;
		y = y<0 ? 0 : y;
		y = y>this.range ? this.range : y;

        //var py = y - this.sh*0.5;
        //py = y<this.sh*0.5 ? : py;
        //py = py>(this.range - this.sh*0.5) ? (this.range - this.sh*0.5) : py;


		this.decal = Math.floor( y * this.ratio );
		this.txt.style.top = - this.decal + 'px';
        this.scroll.style.top = Math.floor(y) + 'px'

	}

	resize () {

		if(!this.isDisplay) return;
		this.calcScroll();

	}

	getZone ( dom ) {

        return dom.getBoundingClientRect();

    }

    addGithubLink () {

    	this.offColor = '#dc46a1';
    	this.bg = '#581c40';
    	this.selectColor = '#29bb61';

        var icon_Github = [
            "<svg width='100' height='100' viewBox='0 0 250 250' style='fill:"+this.offColor+"; color:"+this.bg+"; position: absolute; top: 0; border: 0; right: 0;'>",
            "<path d='M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z' id='octo' onmouseover='unpack.Gover();' onmouseout='unpack.Gout();' onmousedown='unpack.Gdown();' style='cursor:pointer; pointer-events:auto;'></path>",
            "<path d='M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2' fill='currentColor' style='transform-origin: 130px 106px; pointer-events:none;' id='octo-arm'></path>",
            "<path d='M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z' fill='currentColor' id='octo-body' style='pointer-events:none;'></path></svg>",
        ].join("\n");

        // github logo

        var github = document.createElement( 'div' );
        github.style.cssText = this.unselect + "position:absolute; right:0; top:0; width:1px; height:1px; pointer-events:none;";
        github.innerHTML = icon_Github; 
        document.body.appendChild( github );

        this.octo = document.getElementById('octo');
        this.octoArm = document.getElementById('octo-arm');

    }

    Gover () {

        this.octo.setAttribute('fill', this.selectColor); 
        this.octoArm.style.webkitAnimationName = 'octocat-wave'; 
        this.octoArm.style.webkitAnimationDuration = '560ms';

    }

    Gout () {

        this.octo.setAttribute('fill', this.offColor);  
        this.octoArm.style.webkitAnimationName = 'none';

    }

    Gdown () {

        window.location.assign('https://github.com/lo-th/hex' );

    }

    // PNG

    //https://stackoverflow.com/questions/246801/how-can-you-encode-a-string-to-base64-in-javascript

    toBase64 ( value ) {

    	const encodedStringBtoA = btoa( value );

    }

    fromBase64 ( value ) {

    	const decodedStringAtoB = atob( value );
    	
    }


}


////////////////////////////////////////////


/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */
var saveAs = saveAs || function(e) {
    "use strict";
    if (typeof e === "undefined" || typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
        return
    }
    var t = e.document,
        n = function() {
            return e.URL || e.webkitURL || e
        },
        r = t.createElementNS("http://www.w3.org/1999/xhtml", "a"),
        o = "download" in r,
        a = function(e) {
            var t = new MouseEvent("click");
            e.dispatchEvent(t)
        },
        i = /constructor/i.test(e.HTMLElement) || e.safari,
        f = /CriOS\/[\d]+/.test(navigator.userAgent),
        u = function(t) {
            (e.setImmediate || e.setTimeout)(function() {
                throw t
            }, 0)
        },
        s = "application/octet-stream",
        d = 1e3 * 40,
        c = function(e) {
            var t = function() {
                if (typeof e === "string") {
                    n().revokeObjectURL(e)
                } else {
                    e.remove()
                }
            };
            setTimeout(t, d)
        },
        l = function(e, t, n) {
            t = [].concat(t);
            var r = t.length;
            while (r--) {
                var o = e["on" + t[r]];
                if (typeof o === "function") {
                    try {
                        o.call(e, n || e)
                    } catch (a) {
                        u(a)
                    }
                }
            }
        },
        p = function(e) {
            if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(e.type)) {
                return new Blob([String.fromCharCode(65279), e], {
                    type: e.type
                })
            }
            return e
        },
        v = function(t, u, d) {
            if (!d) {
                t = p(t)
            }
            var v = this,
                w = t.type,
                m = w === s,
                y, h = function() {
                    l(v, "writestart progress write writeend".split(" "))
                },
                S = function() {
                    if ((f || m && i) && e.FileReader) {
                        var r = new FileReader;
                        r.onloadend = function() {
                            var t = f ? r.result : r.result.replace(/^data:[^;]*;/, "data:attachment/file;");
                            var n = e.open(t, "_blank");
                            if (!n) e.location.href = t;
                            t = undefined;
                            v.readyState = v.DONE;
                            h()
                        };
                        r.readAsDataURL(t);
                        v.readyState = v.INIT;
                        return
                    }
                    if (!y) {
                        y = n().createObjectURL(t)
                    }
                    if (m) {
                        e.location.href = y
                    } else {
                        var o = e.open(y, "_blank");
                        if (!o) {
                            e.location.href = y
                        }
                    }
                    v.readyState = v.DONE;
                    h();
                    c(y)
                };
            v.readyState = v.INIT;
            if (o) {
                y = n().createObjectURL(t);
                setTimeout(function() {
                    r.href = y;
                    r.download = u;
                    a(r);
                    h();
                    c(y);
                    v.readyState = v.DONE
                });
                return
            }
            S()
        },
        w = v.prototype,
        m = function(e, t, n) {
            return new v(e, t || e.name || "download", n)
        };
    if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
        return function(e, t, n) {
            t = t || e.name || "download";
            if (!n) {
                e = p(e)
            }
            return navigator.msSaveOrOpenBlob(e, t)
        }
    }
    w.abort = function() {};
    w.readyState = w.INIT = 0;
    w.WRITING = 1;
    w.DONE = 2;
    w.error = w.onwritestart = w.onprogress = w.onwrite = w.onabort = w.onerror = w.onwriteend = null;
    return m
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content);
if (typeof module !== "undefined" && module.exports) {
    module.exports.saveAs = saveAs
} else if (typeof define !== "undefined" && define !== null && define.amd !== null) {
    define("FileSaver.js", function() {
        return saveAs
    })
}




init()
