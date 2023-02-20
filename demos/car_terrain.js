
// ! \\ go on view and use keyboard WSAD to controle car

var option = {

    restart:false,
    follow:true,

    name:'buggy',

    hour:9,
    gravity:-10,

    mass:1300,
    engine:1600,
    acceleration:50,
    // car body physics
    friction: 0.6, 
    restitution: 0,
    linear: 0, 
    angular: 0,
    // suspension
    s_stiffness: 15,//20,
    s_compression: 2.3,
    s_damping: 2.4,//2.4
    s_force: 16000,
    s_travel: 0.4,
    s_length: 0.2,
    // wheel
    w_friction: 10.5,//1000,
    w_roll: 0.1,

}


var hour = option.hour;
var startY = 0;
var buggyCar = null;
var engineSound = 'engine4';
var isStart = true;
var mat = {};

function demo() {

    view.hideGrid();
    
    view.addFog({exp:0.0025});

    view.addSky({ hour:9, hdr:true, cloud_covr:0.3, cloud_dens:40, groundColor:0x3b4c5a });

    view.addJoystick({ sameAxis:true });
    //view.debug()

    physic.set({
        fps:60,
        substep:2,
        gravity:[0,-10,0],
    })

    // physic terrain shape

    physic.add ({ 
        type:'terrain',
        name:'ground',
        uv:150,
        pos : [ 0, -10, 0 ], // terrain position
        size : [ 1200, 20, 1200 ], // terrain size in meter
        sample : [ 512, 512 ], // number of subdivision
        frequency : [0.016,0.05,0.2], // frequency of noise
        level : [ 1, 0.2, 0.05 ], // influence of octave
        expo: 2,
        //flipEdge : true, // inverse the triangle
        hdt : 'PHY_FLOAT', // height data type PHY_FLOAT, PHY_UCHAR, PHY_SHORT
        friction: 0.6, 
        restitution: 0.2,
    });



    var i = 10;
    while(i--){
        physic.add ({ type:'sphere', size:[1], pos:[Math.rand(-100,100),20,Math.rand(-100,100)], mass:10 });
       // physic.add ({ type:'box',  size:[1,1,1], pos:[Math.rand(-100,100),20,Math.rand(-100,100)], mass:10 });
    }

    i = 10;
    while(i--){
       // physic.add ({ type:'sphere', size:[1], pos:[Math.rand(-100,100),20,Math.rand(-100,100)], mass:10 });
        physic.add ({ type:'box', size:[2,2,2], pos:[Math.rand(-100,100),20,Math.rand(-100,100)], mass:10 });
    }

    // load buggy 3d model
    view.load ( ['buggy.sea', engineSound + '.mp3' ], afterLoad, true, true );


    // infini terrain test
    //physic.postUpdate = update;
    view.update = update;

};

function afterLoad () {

    startY = physic.byName('ground').getHeight(0,0) + 1;

    makeBuggy();

    //physic.post('setDrive', { name:'buggy' });
    physic.drive( option.name );

};

function makeBuggy () {

    // car material / texture

    buggyMaterials();

    // car mesh

    var mesh = view.getMesh( 'buggy', 'h_chassis' );
    var wheel = view.getMesh( 'buggy', 'h_wheel' );
    var susp = view.getMesh( 'buggy', 'h_susp_base' );
    var brake = view.getMesh( 'buggy', 'h_brake' );
    var steeringWheel;

    brake.material = mat.wheel;
    brake.receiveShadow = false;
    brake.castShadow = false;

    brake.children[0].material = mat.brake;
    brake.children[0].receiveShadow = false;
    brake.children[0].castShadow = false;

    //

    susp.material = mat.susp;
    susp.receiveShadow = false;
    susp.castShadow = false;

    susp.children[0].material = mat.suspM;
    susp.children[0].receiveShadow = false;
    susp.children[0].castShadow = false;

    var k = mesh.children.length, m;

    while(k--){

        m = mesh.children[k];
        if( m.name === 'h_glasses' ) m.material = mat.glass;
        else if( m.name === 'h_pilote' ) m.material = mat.pilote;
        else if( m.name === 'h_steering_wheel' || m.name === 'h_sit_R' || m.name === 'h_sit_L' || m.name === 'h_extra' || m.name === 'h_pot' || m.name === 'h_license') m.material = mat.extra;
        else m.material = mat.body;

        if( m.name === 'h_steering_wheel' ) steeringWheel = m;

        m.castShadow = false;
        m.receiveShadow = false;

        if( m.name === 'h_shadow' ){  m.material = mat.cshadow; m.castShadow = true; m.receiveShadow = false; }

    }

    k = wheel.children.length;

    while(k--){
        m = wheel.children[k];
        if( m.name === 'h_pneu' ) m.material = mat.pneu;
        else m.material = mat.wheel;

        m.castShadow = false;
        m.receiveShadow = false;

    }

    mesh.material = mat.body;
    mesh.receiveShadow = false;
    mesh.castShadow = false;

    wheel.material = mat.wheel;
    wheel.receiveShadow = false;
    wheel.castShadow = false;

    // car physics

    var o = option;

    physic.add ({ 

        debug: false,
        helper: false,

        type:'car',
        name: option.name,
        shapeType:'convex',

        shape: view.getGeometry( 'buggy', 'h_shape' ),
        mesh: mesh,
        meshWheel: wheel,
        meshSusp: susp,
        meshBrake: brake,
        meshSteeringWheel: steeringWheel,
        extraWeels:true,

        wheelMaterial:  mat.wheel,


        
        
        pos:[0,startY,0], // start position of car 
        rot:[0,90,0], // start rotation of car
        size:[ 1.3, 0.4, 3.5 ], // chassis size
        //size:[ 1.2, 0.6, 3.8 ], // chassis size
        masscenter:[ 0, 0, 0 ], // local center of mass (best is on chassis bottom)

        friction: o.friction,
        restitution: o.restitution,
        linear: o.linear, 
        angular: o.angular,

        radius:0.43,// wheels radius
        deep:0.3, // wheels deep only for three cylinder
        wPos:[ 0.838, 0.43, 1.37 ], // wheels position on chassis

        // car setting

        mass: o.mass,// mass of vehicle in kg
        engine: o.engine, // Maximum driving force of the vehicle
        acceleration: o.acceleration, // engine increment 

        // suspension setting

        // Damping relaxation should be slightly larger than compression
        s_compression: o.s_compression,// 0.1 to 0.3 are real values default 0.84 // 4.4
        s_damping: o.s_damping,//2.4, // The damping coefficient for when the suspension is expanding. default : 0.88 // 2.3

        s_stiffness: o.s_stiffness,// 10 = Offroad buggy, 50 = Sports car, 200 = F1 Car 
        s_force: o.s_force, // Maximum suspension force
        
        s_travel: o.s_travel, // The maximum distance the suspension can be compressed in meter
        s_length: o.s_length,//0.1, // The maximum length of the suspension in meter

        // wheel setting

        // friction: The constant friction of the wheels on the surface.
        // For realistic TS It should be around 0.8. 
        // But may be greatly increased to improve controllability (1000 and more)
        // Set large (10000.0) for kart racers
        w_friction: o.w_friction,
        // roll: reduces torque from the wheels
        // reducing vehicle barrel chance
        // 0 - no torque, 1 - the actual physical behavior
        w_roll: o.w_roll,

    });

    //follow camera
    if( option.follow ) view.getControls().initFollow( physic.byName( option.name ), {distance:5} );
    else view.getControls().resetFollow();

    // add option setting
    ui ({

        base: option,
        function: applyOption,

        //restart: { type:'button', p:0 },
        follow: { type:'bool' },

        hour: { min:0, max:24, precision:2, color:0xFFFF44 },

        gravity : { min:-20, max:20, color:0x8888FF },

        mass : { min:100, max:10000, precision:0, color:0xFF8844 },
        engine : { min:100, max:10000, precision:0, color:0xFF8844 },
        acceleration : { min:1, max:1000, precision:0, color:0xFF8844 },

        friction: { min:0, max:1, precision:2, color:0x88FF88 }, 
        restitution: { min:0, max:1, precision:2, color:0x88FF88 }, 
        linear: { min:0, max:1, precision:2, color:0x88FF88 },  
        angular: { min:0, max:1, precision:2, color:0x88FF88 },

        s_stiffness: { min:1, max:200, precision:0, color:0xCC88FF }, 
        s_compression: { min:0.01, max:5, precision:2, color:0xCC88FF },
        s_damping: { min:0.01, max:5, precision:2, color:0xCC88FF },
        s_force: { min:1, max:50000, precision:0, color:0xCC88FF },
        s_travel: { min:0.01, max:5, precision:2, color:0xCC88FF },
        s_length: { min:0.01, max:1, precision:2, color:0xCC88FF },

        w_friction: { min:0, max:1000, precision:2, color:0xCCCC44 },
        w_roll: { min:0, max:1, precision:2, color:0xCCCC44 },

    });

    buggyCar = physic.byName(option.name)//view.byName['buggy'];

    // sound test
    var enginAudio = view.addSound( engineSound )
    enginAudio.setLoop( true );
    buggyCar.add( enginAudio );
    buggyCar.userData.sound = enginAudio;

};

function applyOption () {

    if( hour !== option.hour ){ hour = option.hour; view.updateSky({hour:hour}); }

    //option.reset = option.restart ? true : false;
    physic.post( 'setGravity', { gravity:[ 0, option.gravity, 0 ] });
    //physic.post( 'setVehicle', option );
    physic.setVehicle( option );

    follow( option.follow ? 'buggy' : 'none', {distance:5} );

}

function update ( delta ) {

    // infini terrain test

    //view.getControls().follow();

    var d = view.getDistanceToCenter();
    
    if( d>300 && !view.getControler().isDecal ) decale();

    // sound

    if( buggyCar===null ) return;
    
    var speed = buggyCar.userData.speed;
    var sound = buggyCar.userData.sound;

    var v = speed/10;
    v = v<0?-v:v;
    v = v<0.1?0:v

    v = isStart ? 0 : v;

    if( v === 0 ){ 
        if( sound.source ) sound.stop();
    } else {    
        sound.setPlaybackRate( v/10 );
        if( !sound.isPlaying ) sound.play();
    }

    if(!isStart) return;
    if( user.key[1]!==0 ) isStart = false;

}

function decale() {

    var p = view.getCenterPosition();

    physic.matrix( { name:option.name, pos:[0,0,0], keepY:true, keepRot:true } );

    var terrain = physic.byName('ground');
    terrain.local.x += p.x;
    terrain.local.z += p.z;
    terrain.update( true );
    terrain.needsUpdate = true;

    //view.moveTerrainTo( 'ground', p.x, p.z );
    view.getControler().isDecal = true;

}


function buggyMaterials () {

    // note: material is not recreated on code edit

    mat['glass'] = view.material({
        name:'glass',
        roughness: 0.0,
        metalness: 1.0,
        color: 0xeeefff,
        transparent:true,
        opacity:0.3,
        premultipliedAlpha: true,
    });

    mat['body'] = view.material({
        name:'body',
        roughness: 0.2,
        metalness: 0.9,
        envMapIntensity: 1.35,
        map: { url:'buggy/body.jpg' },
    });

    mat['extra'] = view.material({
        name:'extra',
        roughness: 0.4,
        metalness: 0.6,
        map: { url:'buggy/extra.jpg' },
        normalMap: { url:'buggy/extra_n.jpg' },
    });

    mat['pilote'] = view.material({
        name:'pilote',
        roughness: 0.4,
        metalness: 0.6,
        map: { url:'buggy/pilote.jpg' },
    });

    mat['wheel'] = view.material({
        name:'wheel',
        roughness: 0.4,
        metalness: 0.6,
        map: { url:'buggy/wheel_c.jpg' },
        normalMap: { url:'buggy/wheel_n.jpg' },
    });

    mat['pneu'] = view.material({
        name:'pneu',
        roughness: 0.7,
        metalness: 0.5,
        map: { url:'buggy/wheel_c.jpg' },
        normalMap: { url:'buggy/wheel_n.jpg' },
        normalScale: [ 2, 2 ],
        envMapIntensity: 0.6,
    });

    mat['susp'] = view.material({
        name:'susp',
        roughness: 0.6,
        metalness: 0.4,
        map: { url:'buggy/suspension.jpg' },
    });

    mat['suspM'] = view.material({
        name:'suspM',
        roughness: 0.6,
        metalness: 0.4,
        map: { url:'buggy/suspension.jpg' },
        morphTargets:true
    });

    mat['brake'] = view.material({
        name:'brake',
        transparent:true, 
        opacity:0.2,
        color: 0xdd3f03,
    });

    mat['cshadow'] = view.material({
        name:'cshadow',
        transparent:true, 
        opacity:0.0,
        color: 0xdd3f03,
        depthTest:false, 
        depthWrite:false, 
    });
    
}