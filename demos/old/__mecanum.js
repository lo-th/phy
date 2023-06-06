

var size = 0.05;
var debug = false;

var isMeca = true;

var mat = {};

// ! \\ set car speed and direction
var acc = 10;
var speed = 0;
var translation = false;
var rotation = true;

var springs = [];
var springsTop = [];
var springsDown = [];
var springDecal = ( 26 + 15.5 ) * size;//66*size//( 26 + 15.5 ) * size;
//var springRatio =  1/(34 * size);

var springRatio =  1/(40 * size);
// spring min = 66 / max = 100
//
//34

var density = 1;

var friction = 1
var sfriction = 1
var bounciness = 0.1

//38.487n // 58.487
var nodes = [];


//var useSteering = false;

//var steeringAxis = [1,1,1,1];
//var steeringAxis = [0,0,0,0];

// center of mass position y
var decalY = (62.5 * size); 
var posY = 0;

var buggyGroup = 1;
var buggyMask = -1;//1|2;
var noCollision = 32;
var ground;

function demo() {

	view.moveCam({ h:45, v:30, d:60, target:[0,0,0] });

	view.setEnvironement({

        fog:true,
        fogDensity:0.0025,
        ambientColor:0xAAAAAA,
        //ground:false,

         // shadow
        shadowDebug:false,
        range:150,
        far:200,
        near:5,
        distance:1500,
        lightPos:[0.005,0.1,0.005],

    })

    view.set({

        filter:'bullet',
        solver:'tgs',
        fps:60,
        substep:10,
        gravity:[0,-9.81,0],
        fixed: true,
        divide:true,

    })

    view.displayJoint( debug );



    view.add({type:'plane', friction:friction, staticFriction:sfriction });// infinie plane

    //view.add({type:'box', size:[30, 10, 30], pos:[0,-25,0], friction:1 });

    // view terrain shape

    ground = view.add ({ 

        type:'terrain',
        name:'ground', 
        pos : [0,-5,0], // terrain position
        size : [ 1200, 30, 1200], // terrain size in meter
        sample : [512, 512], // number of subdivision
        uv:50,

        frequency : [0.016,0.05,0.2], // frequency of noise
        level : [1,0.2,0.05], // influence of octave
        expo: 2,

        friction:friction, 
        staticFriction:sfriction,
        restitution:bounciness,

        border:false,
        bottom:false,

        maxSpeed: 0.02,

        filter:[1 << 0,  0xffffffff, 0, 4294901760 ],

        flip: true,

    });



    view.load ( ['mecanum.glb'], afterLoad );

};

function afterLoad () {

	

    //view.addJoystick();
    
    

    // make meca material
    initMaterials();

    // mecanum buggy
    buildMecanum();

    //view.add({type:'box', name:'boyA', mass:100, pos:[0,15,0], size:[5] });

    view.follow( 'chassis', { distance:80, theta:90 } );

    view.postUpdate = update;

}

function initMaterials () {

    // note: material is not recreated on code edit

    mat['meca1'] = view.addMaterial({
        name:'meca1',
        roughness: 0.4,
        metalness: 0.6,
        map: view.loadTextures('./assets/textures/meca/meca_chassis.jpg', { flip:false, encoding:true }),
    });

    mat['meca2'] = view.addMaterial({
        name:'meca2',
        roughness: 0.7,
        metalness: 0.3,
        map: view.loadTextures('./assets/textures/meca/meca_wheel.jpg', { flip:false, encoding:true }),
        normalMap: view.loadTextures('./assets/textures/meca/meca_wheel_n.jpg', { flip:false }),
    });

    mat['meca3'] = view.addMaterial({
        name:'meca3',
        roughness: 0.2,
        metalness: 0.8,
        map: view.loadTextures('./assets/textures/meca/meca_tool.jpg', { flip:false, encoding:true }),
    });

    mat['meca4'] = view.addMaterial({
        name:'meca4',
        roughness: 0.2,
        metalness: 0.8,
        map: view.loadTextures('./assets/textures/meca/meca_tire.jpg', { flip:false, encoding:true }),
    });

    mat['spring'] = view.addMaterial({
        name:'spring',
        color: 0x333333,
        roughness: 0.2,
        metalness: 0.8,
        morphTargets: true,
    });

    
}

function update() {

    var key = view.getKey()

    var d;
    var ts = key[1] * acc;
    var rs = key[0] * acc;
    var rx = key[2] * acc;

    if(ts===0) var ts = key[3] * acc;

   // console.log(rx)

   // speed = user.key[0] * 5 + user.key[1] * 5;

    var i = 4, r=[], s=0;
    while(i--){
        
        if(Math.abs(ts)>Math.abs(rs)){
            s = ts;// translation
            //if(i==0 || i==3) s*=-1; 
        } else { 
            s = rs;// rotation
            if(i==1 || i==3) s*=-1; 
        }

        if(Math.abs(rx)>0){
            if(i==0 || i==3) s=rx;
            else s=-rx;
        }

        //r.push( [ 'jh'+i, 'motor', [ s, 100] ] );
        //r.push( { name:'jh'+i, type:'motor', targetVelocity:s, maxMotor:100 } );
        s//*=1000
        r.push( { name:'jh'+i, driveVelocity:[[0,0,0],[0,0,s]] } );

        

        //r.push( { name:'axe'+i, torque:[0,0,s]  })
        
    }

    // apply forces to bodys
    view.updates( r );

    springsDistance();

};

// springs morph update

function springsDistance () {
    
    var i = 4, d = [];
    while(i--){

        d[i] = (springsTop[i].position.distanceTo( springsDown[i].position )) - springDecal;
        springs[i].morphTargetInfluences[ 0 ] = ( 'max', d[i] * springRatio  ); 

    }

   //console.log(d, springRatio)

}

// -----------------------
//    MECANUM BUGGY 
//  
//      3 ----- 1  :R
//      |  >>>  )
//      2 ----- 0  :L
//
// -----------------------

function buildMecanum () {

    posY = ground.getHeight(0,0)+5;

    // chassis

    view.add({ 

    	debug: debug,

        name:'chassis',
        type:'convex',
        shape:view.getGeometry( 'mecanum', 'meca_chassis_shape' ),

        density:density,
        size:[size],
        pos:[0, posY+decalY, 0],

        mesh: view.getMesh( 'mecanum', 'meca_chassis' ),
        meshScale:size,
        meshMaterial: mat.meca1,
        material: 'hide',
        
        
       // state:4,
       // group:buggyGroup, 
       // mask:buggyMask, 

        friction: 0.5, 
        restitution: 0,
        filter:[2,1,0,0],
        //linear:0.5,
        //angular:1,

    });

  //  return;

    // wheelAxis

    var i = 4;
    while(i--){

        wheelAxis( i );
        // add suspensions
        spring ( i );
        // add wheels
        wheel( i );

    }
    

};



function wheelAxis ( n ) {

    // mass 
    var massPaddel = 1//20;
    var massPadtop = 1//20;//2;
    var massAxis = 1//20;//2;

    var rot = [10, 0, 0];
    var ext2;
    var front = 1;
    
    var gr = undefined;
    var gr2 = undefined;

    var side = 1; 
    if(n==1 || n==3) side = -1;

    var front = 1; 
    if(n==2 || n==3) front = -1;

    var ext = n==0 || n==3 ? 'L' : 'R';

    switch(n){
        case 0 : ext2 = '_av'; gr = [0,0,180]; break;
        case 1 : ext2 = '_av'; gr = [180,0,180]; gr2 = [0,180,0]; break;
        case 2 : ext2 = '_ar'; break;
        case 3 : ext2 = '_ar'; gr = [180,0,0]; gr2 = [0,180,0]; break;
    }

    var pos0 = [120*front, 50, 60*side ].map(function(x) { return x * size; });
    var pos1 = [120*front, 84, 54.5*side ].map(function(x) { return x * size; });
    var pos2 = [120*front, 50, 91*side ].map(function(x) { return x * size; });
    var pos3 = [120*front, 50, 91*side ].map(function(x) { return x * size; });

    var decal0 = [-40*side, -40*side].map(function(x) { return x * size; });
    var decal1 = [-31.5*side, -31.5*side].map(function(x) { return x * size; });
    var decal2 = [8*side, -5.957*side].map(function(x) { return x * size; });

    /*pos0[1] += posY;
    pos1[1] += posY;
    pos2[1] += posY;
    pos3[1] += posY;*/


    view.add({ 

    	debug:debug,

        name:'armlow'+n,
        type:'box', 

        mass:density,
        size:[28*size, 10*size, 80*size],
        material: 'hide',

        mesh: view.getMesh( 'mecanum', 'meca_paddel' ),
        meshScale:size,
        meshRot:gr,
        meshMaterial: mat.meca3,

        //pos:pos0,
        pos:[pos0[0], pos0[1]+posY, pos0[2]],
        //state:4,
        //group:buggyGroup, 
        //mask:noCollision,
        filter:[2,1,0,0],
        //linear:0.5,
        angular:1,
    });

    view.add({ 

    	debug:debug,

        name:'armtop'+n,
        type:'box',

        mass:density,
        size:[28*size, 10*size, 80*size],
        material: 'hide',

        mesh:view.getMesh( 'mecanum', 'meca_padtop' ),
        meshScale:size,
        meshMaterial: mat.meca3,
     
        //pos:pos1,
        pos:[pos1[0], pos1[1]+posY, pos1[2]],
        //rot:rot,
        state:4,
        group:buggyGroup, 
        mask:noCollision,  
        //linear:0.5,
        angular:1,
    });

    if( isMeca || front === -1 ){

        view.add({ 

        	debug:debug,

            name:'axis'+n,
            type:'box',

            mass:density,
            friction:0.1,
            size:[23*size, 23*size, 23*size],
            material: 'hide',

            mesh: view.getMesh( 'mecanum', 'meca_axis_ar' ),
            meshRot:gr2,
            meshScale:size,
            meshMaterial: mat.meca3,
            
            
            pos:[pos2[0], pos2[1]+posY, pos2[2]],
            //state:4,
            //group:buggyGroup, 
            //mask:buggyMask,
            filter:[2,1,0,0],
        });

    } else {

        view.add({ 

        	debug:debug,

            name:'axis'+ n,
            type:'box',

            mass:density,
            size:[23*size, 23*size, 23*size],
            material: 'hide',

            mesh: view.getMesh( 'mecanum', 'meca_axis_av' ),
            meshRot:gr2,
            meshScale:size,
            meshMaterial: mat.meca3,
            
            pos:pos2,
            state:4,
            group:buggyGroup, 
            mask:noCollision,
            angular:1,
        });

        view.add({ 

        	debug:debug,

            name:'axis_s_'+ n,
            type:'box', 

            mass:density,
            friction:0.1,
            size:[23*size, 23*size, 23*size],
            material: 'hide',

            mesh:view.getMesh( 'mecanum', 'meca_axis_av2_'  + ext),
            meshRot:gr2,
            meshScale:size,
            meshMaterial: mat.meca3,
            
            //pos:pos3,
            pos:[pos3[0], pos3[1]+posY, pos3[2]],
            state:4,
            group:buggyGroup, 
            mask:buggyMask, 
            angular:1,
        });

        view.add({
            name:'j_steering_'+n,
            type:'joint', jointType:'d6',
            b1:'axis'+n,
            b2:'axis_s_'+n,
            pos1:[0,0,0],
            pos2:[0,0,0],
            motions:[ ['twist', 'free'] ],
            //axe1:[0,1,0],
            //axe2:[0,1,0],
            //limit:[0, 0],
            //motor:[true, 3, 10],
        });


    }

    // joint

    //var limit = [ side>0 ? 0 : -15, side>0 ? 15 : 0, -1 ,0.9,0.3,1 ];

    var mo = [ ['twist', 'limited'] ]

    var limit = [ side>0 ? -60 : -5, side>0 ? 5 : 60, 0.1 ,100, 20 ];
   // var limit0 = [ side>0 ? -15 : -5, side>0 ? 5 : 15, 0.1 ,100,20 ];

    var limit0 = side>0 ? [ -5, 20 ] : [ -20, 5  ];
    var drive =  [['swing',0.5,1000,Infinity,false]];

    view.add({
        name:'ax_1_'+n,
        type:'joint', jointType:'d6',
        b1:'chassis',
        b2:'armlow'+n,
        pos1:[pos0[0], pos0[1]-decalY, pos0[2]+decal0[0] ],
        pos2:[ 0, 0, decal0[1]],

        motions: mo,
        twistLimit:limit0,
        drive:drive,
    });

    view.add({
        name:'ax_2_'+n,
        type:'joint', jointType:'d6',
        b1:'chassis',
        b2:'armtop'+n,
        pos1:[pos1[0], pos1[1]-decalY, pos1[2]+decal1[0] ],
        pos2:[ 0, 0, decal1[1]],

        motions: mo,
        twistLimit:limit0,
        drive:drive,
    });

    view.add({
        name:'ax_1e_'+n,
        type:'joint', jointType:'d6',
        b1:'axis'+n,
        b2:'armlow'+n,
        pos1:[0, -14*size, decal2[0] ],
        pos2:[ 0, 0, -decal0[1]],

        motions:mo,
        twistLimit:limit0,
        drive:drive,
    });

    view.add({
        name:'ax_2e_'+n,
        type:'joint', jointType:'d6',
        b1:'axis'+n,
        b2:'armtop'+n,
        pos1:[0, 23*size, decal2[1] ],
        pos2:[ 0, 0, -decal1[1]],

        motions: mo,
        twistLimit:limit0,
        drive:drive,
    });

};

function spring ( n ) {

    var side = 1; 
    if(n==1 || n==3) side = -1;

    var front = n==2 || n==3 ? -1 : 1; 

    var p1 = [136.5*front, 102, 24*side].map(function(x) { return x * size; });
    var p2 = [16.5*front, 0, 15*side].map(function(x) { return x * size; });

   // p1[1] += posY;
    //p2[1] += posY;

    var gr = [0,0,0];
    if(side==-1) gr = [0,180,0];

    var gr2 = [0,0,0];
    if(side==-1) gr2 = [0,180,0];

    // mass 
    var massTop = 2;
    var massLow = 2;

    // object

    springsTop[n] = view.add({ 

    	debug: debug,

        name:'bA'+n,
        type:'box',

        mass:density,
        size:[17*size, 17*size, 22*size],
        material: 'hide',

        mesh:view.getMesh( 'mecanum', 'meca_stop' ),
        meshMaterial: mat.meca3,
        meshScale:size,
        meshRot:gr,

        state:4,
        //pos:p1,
        pos:[p1[0], p1[1]+posY, p1[2]],
        //group:buggyGroup, 
       // mask:noCollision,
        filter:[2,1,0,0],
    });

    springsDown[n] = view.add({ 

    	debug: debug,

        name:'bB'+n,
        type:'box',

        mass:density,
        size:[17*size, 17*size, 22*size],
        //size:[10*size, 10*size, 10*size],
        material:'hide',

        mesh:view.getMesh( 'mecanum', 'meca_slow' ),
        meshMaterial: mat.meca3,
        meshScale:size,
        meshRot:gr2,

        state:4,
        pos:[p1[0]+p2[0], posY + 50*size,  p1[2]+p2[2]],
        //pos:p2,
        //group:buggyGroup, 
       // mask:noCollision,

        filter:[2,1,0,0],
    });

    springs[n] = new THREE.Mesh( view.getGeometry( 'mecanum', 'meca_spring' ), mat.spring );
    springs[n].scale.set(1,1,1).multiplyScalar( size );
    springsTop[n].add( springs[n] );
    if( side===-1 ) springs[n].rotation.x = 180*THREE.Math.DEG2RAD;

    //return

    // joint

    view.add({
        name:'jj_1e_'+n,
        type:'joint', jointType:'d6',
        //type:'joint_hinge',
        b1:'chassis',
        b2:'bA'+n,
        pos1:[p1[0], p1[1]-decalY,  p1[2]],
        pos2:[0,0,0],
        motions:[ ['twist', 'free'] ],

    });

    view.add({
        name:'jj_2e_'+n,
        type:'joint', jointType:'d6',
        //type:'joint_hinge',
        b1:'armlow'+n,
        b2:'bB'+n,
        pos1:p2,
        pos2:[0,0,0],
        motions:[ ['twist', 'free'] ],
    });

    // spring joint

    var springRange = 10*size;//10
    var springRestLen = -85*size;  

   //return

    view.add({

        //type:'joint_spring_dof',
        name:'jj'+n,
        type:'joint', jointType:'d6',
        b1:'bA'+n,
        b2:'bB'+n,
        pos1:[0, 0, 0],
        pos2:[0, 0, (springRestLen-springRange)*side],


        motions:[ ['z', 'limited'] ],
        linearLimits:[['z', -springRange, springRange, 1000 ,500,0.5]],
        //linearLimits:[['z', -springRange, springRange, 0.5 ,0.6,0.2]],
        drives:[['z', 0, 1000, Infinity, true ]],
        //linearLimits:[['x', -springRange, springRange, 0.01 ,0.9,0.3,1 ]]

        // [ x, y, z, rx, ry, rz ]
        //spring:[0,0,200,0,0,0],//stiffness // rigidité
        //damping:[0,0,1000,0,0,0],// period 1 sec for !kG body // amortissement

        //feedback:true,
    });

    

}




function wheel ( n ) {

    var ext = n==0 || n==3 ? 'L' : 'R';
    var front = n==2 || n==3 ? -1 : 1; 
    var wSpeed = speed;
    var pz;

    

    if(n==1 || n==3) pz=-19*size;
    else pz = 19*size;

    var wpos = [120*size, posY+ 50*size, 109.5*size];
    var position = [n<2? wpos[0] : -wpos[0], wpos[1], (n==1 || n==3) ? -wpos[2] : wpos[2] ];

    var positionTT = [n<2? wpos[0]*2 : -wpos[0]*2, wpos[1], (n==1 || n==3) ? -wpos[2]*2 : wpos[2]*2];

    if(translation){ if(n==0 || n==3) wSpeed*=-1; }
    if(rotation){ if(n==1 || n==3) wSpeed*=-1; }

    var shape = view.getGeometry( 'mecanum', isMeca ? 'meca_wheel_shape' : 'meca_wheel_shape_jante' );
    var mesh = view.getMesh( 'mecanum', isMeca ? 'meca_wheel_' + ext : 'meca_jante_' + ext )
    var material = isMeca ? mat.meca2 : mat.meca4;

    //console.log(shape)

    view.add({ 

    	debug: debug,

        name:'axe'+n,
        
        //type:'box',
        //size:[56*size, 56*size, 14*size],

        type:'convex',
        shape:shape,
        material:'hide',

        mesh:mesh,
        meshScale:size,
        meshMaterial:material,
        
        size:[size],

        mass:density,
        friction:0.1,

        pos:position,
        state:4,
        //group:buggyGroup, 
       // mask:buggyMask, 

        filter:[2,1,0,0],

        //linear:1,
        //angular:1,
        
    });

    // roller X8

    // joint wheels

    var link = isMeca || front === -1 ? 'axis'+n : 'axis_s_'+n;


    view.add({
        name:'jh'+n,
        type:'joint', jointType:'d6',
        //type:'joint_hinge',
        b1:link,
        b2:'axe'+n,

        pos1:[ 0, 0, pz],
        pos2:[ 0, 0, 0],

        motions:[
        ['x', 'locked'], ['y', 'locked'], ['z', 'locked'],
        ['twist', 'locked'], ['swing1', 'locked'], ['swing2', 'free'] ],

        drives:[['swing', 0, 1000, Infinity, true ]],
        //drives:[ ['slerp', 100, 1000, Infinity ,true ] ],
        //axe1:[0,0,1],
        //axe2:[0,0,1],
       // motor:[true, wSpeed, 100],&
        //collision:true,
        
    })

    if( !isMeca ){ 

        /*view.add({ 

            name:'pneu'+n,
            type:'convex',
            shape:view.getGeometry( 'mecanum', 'meca_pneu' ),
            material:debug ? undefined : material,
            size:[size],
            mass:settings.massPneu,
            pos:position,
            state:4,
            group:buggyGroup, 
            mask:2, 
            
        });*/

        view.add({ 

            name:'pneuX'+n,
            type:'softMesh',
            shape:view.getGeometry( 'mecanum', 'meca_pneu' ),
            material: material,
            size:[size],
            mass:density,
            pos:position,
            state:4,
            group:buggyGroup, 
            mask:2, 

            viterations: 10,
            piterations: 40,
            //citerations: 20,
            //diterations: 20,
            friction: 1,
            //damping: 0.1,// amortissement
            pressure: 200,
            matching:1,
            //timescale:2,
            //maxvolume:0.1,
            //stiffness:0.99,//rigidité
            //hardness:1,
            //volume:1,
            //margin:0.05,
            //drag:0.5,
            //lift:0.5,
            //fromfaces:true,
            //bendingConstraint:2,
            //cluster: 64,
            //restitution: 0.2,
            //bodyAnchor:'axe'+n,
            
        });

        // get final vertrices
        if(n===3){
            var v = view.byName('pneuX'+n).geometry.realVertices;
            var lng = v.length/3;
            for( var i = 0; i<lng; i++ ){
                x = Math.abs( Math.round( v[i * 3] ));
                if( x === 20 * size ) nodes.push( i );
            }

            //console.log(nodes.length)
        }


        // attach to circle
        view.anchor({ nodes:nodes, soft:'pneuX'+n, body:'axe'+n });

        /*view.add({

            name:'jhp'+n,
            type:'joint_fixe',
            b1:'axe'+n,
            b2:'pneu'+n,
            collision:false,
            
        })*/


        return;
    }

    var radius = 39*size;
    var i = 8, angle, y, x, z;
    var axis = [];
    var axe = [];

    var wgeom = view.getGeometry( 'mecanum', 'meca_roller_shape' )
    var wmesh = view.getMesh( 'mecanum', 'meca_roller' )

    while(i--){

        angle = -(45*i)*math.torad;
        x = (radius * Math.cos(angle));
        y = (radius * Math.sin(angle));
        z = position[2];

        if(ext=='R'){
            if(i==0) { axe = [-45, 0, 0 ];             axis = [0,1,1]; }
            if(i==1) { axe = [-35.264, 30, -35.264 ];  axis = [0.783,0.783,1]; }
            if(i==2) { axe = [0, 45, -90 ];            axis = [1,0,1]; }
            if(i==3) { axe = [35.264, 30, 215.264 ];   axis = [0.783,-0.783,1]; }
            if(i==4) { axe = [45, 0, -180 ];           axis = [0,-1,1]; }
            if(i==5) { axe = [35.264, -30, -215.264 ]; axis = [-0.783,-0.783,1]; }
            if(i==6) { axe = [0, -45, -270 ];          axis = [-1,0,1]; }
            if(i==7) { axe = [-35.264, -30, 35.264 ];  axis = [-0.783,0.783,1]; }
        } else {
            if(i==0) { axe = [45, 0, 0 ];             axis = [0,-1,1]; }
            if(i==1) { axe = [35.264, -30, 35.264 ];  axis = [-0.783,-0.783,1]; }
            if(i==2) { axe = [0, -45, -90 ];            axis = [-1,0,1]; }
            if(i==3) { axe = [-35.264, -30, -215.264 ];   axis = [-0.783,0.783,1]; }
            if(i==4) { axe = [-45, 0, -180 ];           axis = [0,1,1]; }
            if(i==5) { axe = [-35.264, 30, 215.264 ]; axis = [0.783,0.783,1]; }
            if(i==6) { axe = [0, 45, -270 ];          axis = [1,0,1]; }
            if(i==7) { axe = [35.264, 30, -35.264 ];  axis = [0.783,-0.783,1]; }
        }

      /*  var e = new THREE.Euler(axe[0]*math.torad, axe[1]*math.torad, axe[2]*math.torad);
        var q0 = new THREE.Quaternion().setFromAxisAngle( {x:0,y:1,z:0}, -90*math.torad );
        var q = new THREE.Quaternion().setFromEuler( e )

        //q.multiply(q0);
        q.premultiply(q0);
       //var q0 = new THREE.Quaternion().setFromAxisAngle( {x:axis[0],y:axis[1],z:axis[2]}, 0*math.torad );
        e.setFromQuaternion(q)
 
        axis = [e.x*math.todeg, e.y*math.todeg, e.z*math.todeg]
        //var axistest = new THREE.Vector3(0,0,1).applyEuler( e ).normalize().toArray();
*/
        //console.log( axis, axistest )

        //axis = axistest


        view.add({ 

        	debug: debug,

            name:n+'_rr_'+i,
            type:'convex',
            shape: wgeom,// view.getGeometry( 'mecanum', 'meca_roller_shape' ),

            mass:density,

            friction:friction, 
            staticFriction:sfriction,
            restitution:bounciness,

            size:[size],
            rot:axe,
            pos:[x+ position[0], y+ position[1], z],
            //material:'hide',

            mesh:wmesh,
            meshScale:size,
            meshMaterial: mat.meca2,

            filter:[4,1,0,0],
            
        })

        view.add({

            name:'jr'+i+n,
            type:'joint', jointType:'d6',
            //type:'joint_hinge',
            b1:'axe'+n,
            b2:n+'_rr_'+i,
            pos1:[ x, y, 0],
            pos2:[ 0, 0, 0],

            rot1:axe,
            //rot2:axis,
          
            motions:[ ['swing2', 'free'] ],
            //drives:[['slerp', 0, 0, Infinity, false ]],

        })

    }

    


}