export class User {

	// key map
    // 0 : axe L | left:right  -1>1
    // 1 : axe L | top:down    -1>1
    // 2 : axe R | left:right  -1>1
    // 3 : axe R | top:down    -1>1
    // 4 : bouton A             0-1  jump / space
    // 5 : bouton B             0-1  roulade / shift ctrl
    // 6 : bouton X             0-1  arme principale / E
    // 7 : bouton Y             0-1  arme secondaire
    // 8 : gachette L up        0-1  
    // 9 : gachette R up        0-1
    // 10 : gachette L down     0>1
    // 11 : gachette R down     0>1
    // 12 : bouton setup        0-1
    // 13 : bouton menu         0-1
    // 14 : axe button left     0-1
    // 15 : axe button right    0-1
    // 16 : Xcross axe top      0-1
    // 17 : Xcross axe down     0-1
    // 18 : Xcross axe left     0-1
    // 19 : Xcross axe right    0-1

    // 20 : Keyboard or Gamepad    0-1

	constructor () {

		this.key = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        this.key2 = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]

		this.gamepad = new Gamepad( this.key ); 

		this.useGamepad = false
		this.sameAxis = true

		document.addEventListener( 'keydown', function(e){this.keyDown(e)}.bind(this), false );
        document.addEventListener( 'keyup', function(e){this.keyUp(e)}.bind(this), false );

	}

    setKey( i, v ){
        this.key[i] = v
    }

	update () {

		this.gamepad.update();

        if( this.gamepad.ready ){ 
            if( !this.useGamepad ) this.useGamepad = true;
            this.gamepad.getValue(0);
        }

        if( this.sameAxis ){
            this.key[ 2 ] = this.key[ 0 ];
            this.key[ 3 ] = this.key[ 1 ];
        }

        //this.axeL[ 0 ] = this.key[ 0 ];
        //this.axeL[ 1 ] = this.key[ 1 ];

        return this.key

	}

	keyDown (e) {

		var key = this.key;
        var key2 = this.key2;
        e = e || window.event;

        if( this.sameAxis ){

            switch ( e.which ) {
                // axe L
                case 65: case 81: case 37: key[0] = -1; key2[0] = 1; break;//key[0]<=-1 ? -1:key[0]-= 0.1; break; // left, A, Q
                case 68:  case 39:         key[0] = 1;  key2[1] = 1; break; // right, D
                case 87: case 90:  case 38: key[1] = -1; break; // up, W, Z
                case 83: case 40:          key[1] = 1;  break; // down, S

                case 32:          key[4] = 1; break; // space
                case 17: case 67: key[5] = 1; break; // ctrl, C
                case 69:          key[6] = 1; break; // E
                
                case 16:          key[7] = 1; break; // shift
                //case 71:          view.hideGrid(); break; // G
                //case 121:         noui(); break; // f10
                //case 122:         fscreen(); break; // f11
            }

        } else {

            switch ( e.which ) {
                // axe L
                case 65: case 81: key[0] = -1; key2[0] = 1; break;//key[0]<=-1 ? -1:key[0]-= 0.1; break; // left, A, Q
                case 68:          key[0] = 1; key2[1] = 1; break; // right, D
                case 87: case 90: key[1] = -1; break; // up, W, Z
                case 83:          key[1] = 1;  break; // down, S
                // axe R
                case 37:          key[2] = -1;  key2[0] = 1;break; // left
                case 39:          key[2] = 1;  key2[1] = 1;break; // right
                case 38:          key[3] = -1; break; // up
                case 40:          key[3] = 1;  break; // down
                

                case 32:          key[4] = 1; break; // space
                case 17: case 67: key[5] = 1; break; // ctrl, C
                case 69:          key[6] = 1; break; // E
                
                case 16:          key[7] = 1; break; // shift
                //case 121:         noui(); break; // f10
                //case 122:         fscreen(); break; // f11
                
                //case 71:          view.hideGrid(); break; // G
            }
        }

        this.gamepad.reset();
        //e.preventDefault();

	}

	keyUp (e) {

		var key = this.key;
        var key2 = this.key2;
        e = e || window.event;

        if( this.sameAxis ){

            switch ( e.which ) {
                 // axe L
                case 65: case 81: case 37: key[0] = key[0]<0 ? 0:key[0]; key2[0] = 0; break; // left, A, Q
                case 68: case 39:         key[0] = key[0]>0 ? 0:key[0]; key2[1] = 0; break; // right, D
                case 87: case 90: case 38:key[1] = key[1]<0 ? 0:key[1]; break; // up, W, Z
                case 83: case 40:         key[1] = key[1]>0 ? 0:key[1]; break; // down, S

                case 32:          key[4] = 0; break; // space
                case 17: case 67: key[5] = 0; break; // ctrl, C
                case 69:          key[6] = 0; break; // E
                
                case 16:          key[7] = 0; break; // shift
            }

        } else {

            switch( e.which ) {
                
                // axe L
                case 65: case 81: key[0] = key[0]<0 ? 0:key[0]; key2[0] = 0; break; // left, A, Q
                case 68:          key[0] = key[0]>0 ? 0:key[0]; key2[1] = 0; break; // right, D
                case 87: case 90: key[1] = key[1]<0 ? 0:key[1]; break; // up, W, Z
                case 83:          key[1] = key[1]>0 ? 0:key[1]; break; // down, S
                // axe R
                case 37:          key[2] = key[2]<0 ? 0:key[2]; key2[0] = 0;break; // left
                case 39:          key[2] = key[2]>0 ? 0:key[2]; key2[1] = 0;break; // right
                case 38:          key[3] = key[3]<0 ? 0:key[3]; break; // up
                case 40:          key[3] = key[3]>0 ? 0:key[3]; break; // down

                case 32:          key[4] = 0; break; // space
                case 17: case 67: key[5] = 0; break; // ctrl, C
                case 69:          key[6] = 0; break; // E
                
                case 16:          key[7] = 0; break; // shift

                
            }
        }

        //e.preventDefault();
		
	}


}


class Gamepad {

	constructor ( key ) {

		this.values = []; 
        this.ready = 0;
        this.key = key;

	}

	update () {

		var i,j,k,l, v, pad;
        var fix = this.fix;
        var gamepads = navigator.getGamepads();

        for (i = 0; i < gamepads.length; i++) {

            pad = gamepads[i];
            if(pad){
                k = pad.axes.length;
                l = pad.buttons.length;
                if(l){
                    if(!this.values[i]) this.values[i] = [];
                    // axe
                    for (j = 0; j < k; j++) {
                        v = fix(pad.axes[j], 0.08 );
                        if(this.ready == 0 && v !== 0 ) this.ready = 1;
                        this.values[i][j] = v;
                        //if(i==0) this.key[j] = fix( pad.axes[j], 0.08 );
                    }
                    // button
                    for (j = 0; j < l; j++) {
                        v = fix(pad.buttons[j].value); 
                        if(this.ready == 0 && v !== 0 ) this.ready = 1;
                        this.values[i][k+j] = v;
                        //if(i==0) this.key[k+j] = fix( pad.buttons[j].value );
                    }
                    //info += 'gamepad '+i+'| ' + this.values[i]+ '<br>';
                } else {
                    if(this.values[i]) this.values[i] = null;
                }
            }
        }

	}

	getValue (n) {

		var i = 19, v;
        while(i--){
            v = this.values[n][i];
            if(this.ready == 0 && v !== 0 ) this.ready = 1;
            this.key[i] = v;
        }

	}

	reset () {

		this.ready = 0;
		
	}

	fix (v, dead) {

		let n = Number((v.toString()).substring(0, 5));
        if(dead && n<dead && n>-dead) n = 0;
        return n;
		
	}


}