import { math } from '../math.js';
import { root } from '../root.js';


/**   _  _____ _   _
*    | ||_   _| |_| |
*    | |_ | | |  _  |
*    |___||_| |_| |_|
*    @author lo.th / http://lo-th.github.io/labs/
*/

function Weapon( o ) {

	//THREE.Group.call( this );
	this.pathTexture = './assets/textures/avatar/';

	this.isReady = false;

	this.parent = o.parent;
	this.group = null;

	this.callback = o.callback || function (){};

	this.isNewGun = o.newGun !== undefined ? o.newGun : true;
	this.fixeArm = o.fixeArm !== undefined ? o.fixeArm : false;

	this.tmpE = new THREE.Euler();

	this.nmap = 0;

	this.startGun = o.startGun || 'none';
	this.startAction = 1;

	this.guns = [ 'talon', 'rifle', 'smg', 'snipper' ];
    this.cartridges = [];
    this.current = 'none';
    this.weapon = '';

    this.gunAnimtor = null;
    this.gunFire = null;
    this.gunReload = null;

    //this.bulletRef = {};

   
    this.vy = 2;
    this.vz = 0.3;

    this.weaponSetting = {

        'talon': { pos:[ 0.0875,-0.0325,-0.0148 ], rot:[ 8,-7.9+this.vy,-73+this.vz ] },
        'rifle': { pos:[ 0.0908,-0.0343,-0.0258 ], rot:[ 5.7,-5+this.vy,-72.7+this.vz ] },//rot:[ 5,-8,-71 ]
        'smg': { pos:[ 0.0999,-0.0298,-0.0137 ], rot:[ 6,-6.6+this.vy,-71+this.vz ] },
        //'snipper': { pos:[ 0.077,-0.0379,-0.0222 ], rot:[ 5,-6,-71 ] },
        'snipper': { pos:[ 0.077,-0.0379,-0.0222 ], rot:[ 3,-5.8+this.vy,-71 ] },

    };

    this.weaponSettingOld = {

        'talon': { pos:[ 0.095,-0.03,-0.025 ], rot:[ 7,-7,-80 ] },
        'rifle': { pos:[ 0.1,-0.04,-0.04 ], rot:[ 8,-5,-71 ] },
        'smg': { pos:[ 0.12,-0.035,-0.02 ], rot:[ 8,-5,-71 ] },
        'snipper': { pos:[ 0.1,-0.037,-0.03 ], rot:[ 6,-5,-71 ] },

    };

    this.armHandFix = {

        // LT0 y , RT0 y, LF x, RF x, LH x, LH z 
        w1: [ -60, -60, -5, 5, 0, 0 ],
        w2: [ -60, -10, 0, 0, 30, -20 ],
        none: [ 0, 0, 0, 0, 0, 0 ],
       
    }

    var urls = ['avatar/guns.glb'];// gun model 

    this.animations = [
        'smg_shoot', 'smg_reload', 
    ];

    this.anims = {};

    var i = this.animations.length;

    while( i-- ) urls.push( 'avatar/gun/a_'+this.animations[i]+'.glb' );

    var self = this;
    //root.view.clearTmpPool();
    //root.load( urls, function(){ self.initGun() } );
    root.view.load( urls, function(){ this.initGun() }.bind(this) );

}


Weapon.prototype = {

	update: function ( delta ) {

		if( !this.isReady ) return;
		this.gunAnimtor.update( delta )

	},

	initGun: function () {

		if( !this.materialGunReady ){
			this.makeGunMaterial();
			return;
		}

		this.addGun();
		this.callback();
	
	},

	setAction: function ( action, force ) {

        if( !this.isReady ) return;

        let anim = '', a;

        if( this.parent.mode === "fps" ){

            if( ( action !== this.wAction ) || force ){

                this.wAction = action;

                if( this.current === 'none' ) return;

                if( this.isNewGun ) {

                	switch( this.wAction ){
                		case 0 : anim = this.current + '_idle_relax'; break;
                		case 1 : anim = this.current + '_idle_combat'; break;
                        case 2 : anim = this.current + '_reload'; break;
                		case 3 : anim = this.current + '_shoot'; break;
                		case 4 : anim = this.current + '_aim'; break;
                	}

                } else {

                	switch( this.wAction ){

	                    case 0 : anim = 'relax_idle'; break;
	                    case 1 : anim = 'aim_idle'; break;
	                    case 2 : anim = 'reload'; break;
	                    case 3 : anim = 'fire_single'; break;
	                    case 4 : anim = 'fire_power'; break;
	                    case 5 : anim = 'fire_loop'; break;

	                }

	                if( anim==='fire_single' && this.weapon === 'w1_' ) anim = 'fire_power';

	                anim = this.weapon + anim;

                }

                // avatar play
                this.parent.play( anim, 0.25, anim>2 ? 0 : null, null, 'two' );

                // gun play

                if( this.anims[ anim ] ){

                    a = this.anims[ anim ];

                    a.setLoop( THREE.LoopOnce, Infinity ).reset();
                    a.clampWhenFinished = false;
                    a.paused = false;
                    a.play();

                }


                /*if( anim === 'fire_single' || anim === 'fire_power' ){
                    this.gunFire.setLoop( THREE.LoopOnce, Infinity ).reset();
                    this.gunFire.clampWhenFinished = true;
                    this.gunFire.paused = false;
                    this.gunFire.play();
                }

                if( anim === 'reload' ){ 
                    this.gunReload.setLoop( THREE.LoopOnce, Infinity ).reset();
                    this.gunReload.clampWhenFinished = false;
                    this.gunReload.paused = false;
                    this.gunReload.play();
                }*/

            }

        }


    },

    loadAnimation : function () {



    },

	makeGunMaterial : function () {

        //if( this.materialGunReady )  this.addGun(); return;

        var mapcallback = function () { this.nmap ++; if( this.nmap === 8 ){ this.materialGunReady = true; this.initGun(); } }.bind( this );

        var i = this.guns.length;
        while( i-- ){

            root.addMaterial( new THREE.MeshStandardMaterial({
                name: 'guns_' + this.guns[i],
                map: root.loadTextures( this.pathTexture + 'guns/'+this.guns[i]+'_c.jpg', { flip:false, callback:mapcallback }),
                normalMap: root.loadTextures( this.pathTexture + 'guns/'+this.guns[i]+'_n.jpg', { flip:false, callback:mapcallback }),
                metalnessMap: root.loadTextures( this.pathTexture + 'guns/'+this.guns[i]+'_m.jpg', { flip:false, callback:mapcallback }),
                roughnessMap: root.loadTextures( this.pathTexture + 'guns/'+this.guns[i]+'_r.jpg', { flip:false, callback:mapcallback }),
                roughness:1,
                metalness:1,
            }));

        }

        root.addMaterial( new THREE.MeshStandardMaterial({
            name: 'guns_snipper_lens',
            map: root.loadTextures( this.pathTexture + 'guns/lens_s.png', { flip:false, callback:mapcallback }),
            transparent:true
        }));

        root.addMaterial( new THREE.MeshStandardMaterial({
            name: 'guns_smg_lens',
            map: root.loadTextures( this.pathTexture + 'guns/lens.png', { flip:false, callback:mapcallback }),
            transparent:true
        }));

        root.addMaterial( new THREE.MeshBasicMaterial({
            name: 'guns_muzzle',
            map: root.loadTextures( this.pathTexture + 'guns/muzzle_c.jpg', { flip:false, callback:mapcallback }),
            alphaMap: root.loadTextures( this.pathTexture + 'guns/muzzle_a.jpg', { flip:false, callback:mapcallback }),
            side: THREE.DoubleSide,
            transparent:true
        }));

    },

	ejectBullet: function ( time ) {

		if( !this.isReady ) return;

        var id = this.guns.indexOf( this.current );
        var bullet = this.cartridges[id].clone();
        bullet.visible = true;
        this.cartridges[id].parent.add( bullet );

        var g = 0;

        var start = {

            x: bullet.position.x,
            y: bullet.position.y,
            z: bullet.position.z,

            rx: bullet.rotation.x,
            ry: bullet.rotation.y,
            rz: bullet.rotation.z,

        };

        // x / left / right
        // y / front / back
        // z / down / up

        var end = {

            x: bullet.position.x + - math.rand(0.05, 0.15),
            y: bullet.position.y +  math.rand(-0.05, 0.05),
            z: bullet.position.z + - 0.2,//math.rand(0.1, 0.2),

            rx: bullet.rotation.x + math.rand(-0.6, 0.6),
            ry: bullet.rotation.y,
            rz: bullet.rotation.z + math.rand(-0.6, 0.6),

        };

        var t = new TWEEN.Tween( start ).to( end, time || 500 )
            .easing( TWEEN.Easing.Cubic.Out )
            .onUpdate( function( o ) { 
                g += 0.01;
                bullet.position.set( o.x, o.y, o.z + g  );
                bullet.rotation.set( o.rx, o.ry, o.rz );
            }.bind(this) )
            .onComplete( function( o ) { bullet.parent.remove( bullet ); }.bind(this) )
            .start();

    },

    toggleWeapon: function ( d ) {

    	if( !this.isReady ) return;
        if( this.onToggle ) return this.current;

        let n = this.guns.indexOf( this.current );

        n += d;
        if( n < 0 ) n = this.guns.length -1;
        if( n === this.guns.length ) n = 0;

        var name = this.guns[n];
        var anim = name === 'talon' ? 'w2_to_w1' : 'w1_to_w2';

        //this.nextGun = name;
        this.onToggle = true;

        if(!this.isNewGun){ 
        	this.parent.play( anim, 0.25, null, null, 'two' ); 
        	setTimeout( function(){  this.displayGun( name ); }.bind( this ), 1000 );
        } else {

        	this.setAction( 0 ); 
        	setTimeout( function(){  this.displayGun( name ); this.setAction( 1 ); }.bind( this ), 500 );

        }

        return name;

    },

    displayGun: function ( name ){

        if( !this.isReady ) return;

        this.onToggle = false;

        this.current = name;

        let m = this.group//.children[0];
        this.group.parent.visible = true;

        let i = m.children.length;

        while( i-- ){
            if( name === m.children[i].name ) m.children[i].visible = true;
            else m.children[i].visible = false;
        }

        if(name === 'none') return;

       let n = name === 'talon' ? 'w1_' : 'w2_';

       let start = [], end;

       if( n !== this.weapon ){

            if( this.fixeArm ){

           	    if( this.weapon === '' ) math.arCopy( start, this.armHandFix.none );
           	    if( this.weapon === 'w1_' ) math.arCopy( start, this.armHandFix.w1 );
           	    if( this.weapon === 'w2_' ) math.arCopy( start, this.armHandFix.w2 );

           	    if( n === 'w1_' ) end = this.armHandFix.w1;
           	    if( n === 'w2_' ) end = this.armHandFix.w2;
                if( n === '' ) end = this.armHandFix.none;

           	    //var a = [ -60, -60, -5, 5, 0, 0 ];
                //var b = [ -60, -30, 0, 0, 30, -20 ];

                this.armTween = new TWEEN.Tween( start ).to( end, 500 ).onUpdate( function( o ) {
    	        	
    			    this.parent.setRotation( 'LT0', 0, o[0], 0 );
    			    this.parent.setRotation( 'RT0', 0, o[1], 0 );
    			    this.parent.setRotation( 'LF',o[2], 0, 0 );
    			    this.parent.setRotation( 'RF', o[3], 0, 0 );
    			    this.parent.setRotation( 'LH', o[4], 0, o[5] );

    	        }.bind( this )).start();

            } /*else {

                this.parent.setRotation( 'LT0', 0, 0, 0 );
                this.parent.setRotation( 'RT0', 0,0, 0 );
                this.parent.setRotation( 'LF', 0, 0, 0 );
                this.parent.setRotation( 'RF', 0, 0, 0 );
                this.parent.setRotation( 'LH', 0, 0, 0 );

            }*/

	        this.weapon = n;

       }

    },

    hideScope: function ( b ) {

    	if( !this.isReady ) return;
        this.hiddenScope.visible = !b;
        this.hiddenScope2.visible = !b;

    },

    addGun: function ( b ) {

        if( this.isReady ) return;

        let model = [], i, j, k, n, a, mat, t, name, sub;

        this.group = root.getPool( 'guns_scene' ).clone();
        this.group.name = 'GUNS';

        this.group.traverse( function ( node ) {
            if( node.name === 'talon') model[0] = node;
            if( node.name === 'rifle') model[1] = node;
            if( node.name === 'smg') model[2] = node;
            if( node.name === 'snipper') model[3] = node;

            
        });

        // apply material

        i = this.guns.length;

        while(i--){

            mat = root.view.getMaterialByName( 'guns_' + this.guns[i] );
            j = model[i].children.length;

            //model[i].visible = false;

            while(j--){

                n = model[i].children[j];
                k = n.children.length;
                while(k--) {
                	n.children[k].material = mat;
                	n.children[k].frustumCulled = false;
               }


                if( n.name ==='snipper_scope_base' ) this.hiddenScope = n;
                if( n.name ==='snipper_base' ) this.hiddenScope2 = n;

                if( n.name === this.guns[i] + '_cartridge' ){ 
                    this.cartridges[i] = n; n.visible = false; 
                    //this.bulletRef[ this.guns[i] ] = { pos:n.position.toArray(), rot: n.rotation.toArray() }
                }

                if( n.name ==='smg_lens' ) n.material = root.view.getMaterialByName('guns_smg_lens');
                else if( n.name ==='snipper_lens' ) n.material = root.view.getMaterialByName('guns_snipper_lens');
                else if( n.name.substring(0,3) === 'muz' ) n.material = root.view.getMaterialByName('guns_muzzle');
                else n.material = mat;

                n.frustumCulled = false;
            }

        }


        // animation

        this.gunAnimtor = new THREE.AnimationMixer( this.group );

        i = this.animations.length;

        while(i--){

            name =  this.animations[i];
            sub = name.substring(0, 3);

            n = view.getPool( 'a_' + name + '_animation' )[0];
            n.name = name;

            let remove = [];

            k = n.tracks.length;
            while( k-- ){
                if( n.tracks[k].name.substring(0, 3) !== sub ) remove.push(k)
            }

            k = remove.length;
            while( k-- ){
                n.tracks.splice( remove[k], 1 );
            }

            a = this.gunAnimtor.clipAction( n );
            a.repeat = false;
            a.enabled = true;
            a.paused = false;
            a.setEffectiveTimeScale( 1 );
            a.setEffectiveWeight( 1 );


            this.anims[ name ] = a;

        }


        var anim = view.getPool( 'guns_animation' )[0];

       // var fire = THREE.AnimationUtils.subclip( anim, 'fire', 0, 15, 30 );
       // var reload = THREE.AnimationUtils.subclip( anim, 'reload', 16, 85, 30 );//69 / 50

        

        /*a = this.gunAnimtor.clipAction( fire );
        //a.setLoop( THREE.LoopOnce, Infinity )//.reset();
        //a.clampWhenFinished = false;
        //a.name = 'fire';
        //a.repeat = false;
        a.enabled = true;
        a.paused = false;
        a.setEffectiveTimeScale( 0.5 );
        a.setEffectiveWeight( 1 );
        this.gunFire = a;

        a = this.gunAnimtor.clipAction( reload );
        a.name = 'reload';
        a.repeat = false;
        a.enabled = true;
        a.paused = false;
        a.setEffectiveTimeScale( 69/50 );
        a.setEffectiveWeight( 1 );
        this.gunReload = a;*/



        //var action = view.mixer.clipAction( anim[ 0 ] );
        //action.play();
        //console.log( anim );

        // reposition guns

        i = this.guns.length;

        while( i-- ){

            name = this.guns[i];
            if( this.isNewGun ) this.setItem( name, this.weaponSetting[name].pos, this.weaponSetting[name].rot, 0.7 );
            else this.setItem( name, this.weaponSettingOld[name].pos, this.weaponSettingOld[name].rot, 0.7 );

        }


        // attach items to avatar bone
        this.parent.attachToBone( this.group, 'rHand', [0,0,0], [0,0,0], 1, true );

       
        this.isReady = true;

        this.displayGun( this.startGun );
        this.setAction( this.startAction );

    },

    setItem: function ( childName, pos, rot, size ){

        let m;
        let i = this.group.children.length;
        while(i--){
            if( this.group.children[i].name === childName ) { m = this.group.children[i]; break; }
        }

        var order = this.isNewGun ? 'ZYX' : 'XYZ';

        m.rotation._order = order;

        if( pos ) m.position.set( pos[0], pos[1], pos[2] );
        if( rot ) m.quaternion.setFromEuler( this.tmpE.set( rot[0]*math.torad, rot[1]*math.torad, rot[2]*math.torad, order ) );
        if( size ) m.scale.set( 1,1,1 ).multiplyScalar( size );

    },

    removeGun: function ( b ) {

        this.parent.clearItem( 'GUNS' );

        //let i = this.guns.length;
        //while(i--) this.clearItem( this.guns[i] );

    },




}//)

export { Weapon };