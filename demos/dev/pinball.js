
let startPosition
const pad = []
const ball = []

demo = () => {

    phy.log('use key A-D or Q-D')

	phy.view({
		envmap:'room',
        ground:true,
		groundSize:[ 5, 11.3],
		groundAlpha:false,

	})

	// setting and start oimophysics
	phy.set({ 
		substep:2,//16,
		gravity:[0,-9.81,0],
        jointVisible:true
	})

	phy.load(['./assets/models/pinball.glb'], onComplete )

}

onComplete = () => {

    const scene = phy.get('pinball', 'O').clone()

    groups = {}

    scene.traverse( function ( node ) {
    	if( node.name ) groups[node.name] = node
    })

    groups.paddle.parent.remove( groups.paddle )
    groups.paddle_shape.parent.remove( groups.paddle_shape )
    groups.sw_base.parent.remove( groups.sw_base )
    groups.ramps2_c.parent.remove( groups.ramps2_c )
    groups.ramps1_c.parent.remove( groups.ramps1_c )

    groups.ramps1.material.transparent = true
    groups.ramps1.material.opacity = 0.8

    phy.addDirect( scene )

    addPhysics( groups )

}

addPhysics = ( groups ) => {

	// playfield
    phy.add({ type:"box", name:'playfield', size: [5.093, 1, 11.315], pos: [0, -0.5, 0], group:1, mask:4, friction: 0.075, staticFriction: 0.075, restitution:0.25, visible:false });

    let i, ppos;

    startPosition = [
	    [ 2.2899, 0.135, 4.3286 ],
	    [ 1.4, 0.927, -5.254 ],
	    [ -1.83, 0.956, -5.47 ],
    ];

    i = startPosition.length;
	while(i--){
		ball[i] = phy.add({ type:"sphere", name:'ball_'+i, material:'chrome', size: [0.135], 
            pos: startPosition[i], density:0.8, 
            friction: 0.15, restitution:0, //0.2, 
            group:4, mask:-1,
            rollingFriction: 0.15,
            //dmv:[ 0.05, 0.5, 0, 2] // to test ?
            ccdThreshold:0.0000001,
            ccdRadius:0.035,
            enableCCD:true,
            neverSleep:true,

            //iterations:[1,1]
        })
	}

    // pinball paddle

    i = 3;
    ppos = [ [ -1.0758, 0.135, 3.9162 ], [ 0.6195, 0.135, 3.9162 ], [ 1.8109, 0.135, -0.4827 ] ]

    let prot = [ [ 0, -120, 0 ], [ 0, 120, 0 ], [ 0, 160, 0 ] ]

    //let limit = [ [ -120, -60, 100, 100, 0.5 ], [ 60, 120, 100, 100, 0.5 ], [ 100, 160, 100, 100, 0.5 ] ]
    let limit = [ [ -120, -60 ], [ 60, 120 ], [ 100, 160 ] ]


    angles = [ -120, 120, 160 ]
    
    while( i-- ){

        pad[i] = phy.add({
            shape:groups.paddle_shape.geometry,
            mesh:groups.paddle, meshScale:[10],// debug:true,
            type:'convex', name:'paddle_'+i, 
            pos:ppos[i], rot: prot[i], size:[10],
            staticFriction:0.2,
            friction: 0.2, //restitution:0.55, 
            group:2, mask:4,
            density:1,
            //optimize:true,
            //kinematic:true,  
            //ccdThreshold:0.0000001,
            //ccdRadius:0.035,
            //enableCCD:true,
            //speculativeCCD:true,
            //enablePose:true,
            neverSleep:true,
            dmv:[1,1,1,0.01],
            noGravity:true,
            ray:false,
        })

        //pad[i].rotation._order = 'YZX'

        phy.add({
            name:'A'+i, type:'joint', mode:'revolute',
            b1:'playfield', b2:'paddle_'+i, 
            //pos1:ppos[i], pos2:[0,0,0],
            worldPos:ppos[i], 
            worldAxis:[0,1,0],
            //projection:0.1,//??
            //driveFree:true,
            //driveVelocity:0.1,
            //driveForceLimit:1,
            lm:limit[i], // sd:[10, 1]
            //acc:true
            //pos1:ppos[i], pos2:[ 0, 0, 0 ],
            //motions:[['swing1', 'limited']], limits:[ limit[i] ],
            //drives: [['swing1', 10000, 0.2, Infinity, false ]],
        })
        
    }

    // pinball launcher

    phy.add({
        mesh:groups.launcher, meshScale:[10], //debug:true, 
        noClone:true,
        type:'box', name:'launcher', 
        pos:[2.2481, 0.135, 5.0575],  size:[0.3367, 0.27, 1.2],
        group:2, mask:4,
        mass:2,
        //filter:[2,-1,1,0], 
        //dmv:[0.2,0.2,100,20],
    })

    phy.add({
        name:'L', type:'joint', mode:'prismatic',
        b1:'playfield', b2:'launcher', //noFix:true,
        worldAnchor:[2.2481, 0.135, 5.0575], worldAxis:[0,0,1],
        lm:[ -0.01, 0.7, 2000, 100, 0.1 ],  sd:[10, 1]
     
        //motions:[['z', 'limited']], limits:[ ['z', 0, 0.7 ] ],
        //drives: [['z', 1000, 0.99, Infinity, false ]],
    })



    //____________________________________________

    let friction = 0.15
    let restitution = 0.35

    // pinball wall collision
    phy.add({
    	name:'wall_1',
        type:'mesh',
        mass:0,
        shape:groups['wall'].geometry,
        restitution:restitution,
        friction:friction,
        size:[10],
        group:1, mask:4,
        visible:false
    })

    phy.add({
    	name:'wall_2',
        type:'mesh',
        mass:0,
        shape:groups['wall_2'].geometry,
        restitution:restitution,
        friction:friction,
        size:[10],
        group:1, mask:4,
        visible:false
    })

    phy.add({
    	name:'wall_3',
        type:'mesh',
        mass:0,
        shape:groups['wall_3'].geometry,
        restitution:restitution,
        friction:friction,
        size:[10],
        group:1, mask:4,
        visible:false
    })

    // pinball ramps collision
    phy.add({
    	name:'ramps1',
        type:'mesh',
        mass:0,
        shape:groups['ramps1_c'].geometry,
        restitution:restitution,
        friction:friction,
        size:[10],
        group:1, mask:4,
        visible:false
    })

   // console.log(groups['ramps_2_c'].geometry)

    

    // pinball ramps 2 collision
    phy.add({
    	name:'ramps2',
        type:'mesh',
        mass:0,
        shape:groups['ramps2_c'].geometry,
        restitution:restitution,
        friction:friction,
        size:[10],
        group:1, mask:4,
        visible:false
    })

    // pinball save collision
    phy.add({
    	name:'save',
        type:'mesh',
        mass:0,
        shape:groups['save'].geometry,
        restitution:restitution,
        friction:friction,
        size:[10],
        group:1, mask:4,
        visible:false
    })

    //_________________________________

    addSw()

    

    // top bottom
    phy.add({ type:"box", size: [7.093, 2.6, 1], pos: [0, 0.3, -6.1575], group:1, mask:4, visible:false, restitution:restitution, friction:friction })
    phy.add({ type:"box", size: [7.093, 2.6, 1], pos: [0, 0.3, 6.1575], group:1, mask:4, visible:false, restitution:restitution, friction:friction })

    // left right
    phy.add({ type:"box", size: [1, 2.6, 11.315], pos: [-3.0465, 0.3, 0], group:1, mask:4, visible:false, restitution:restitution, friction:friction })
    phy.add({ type:"box", size: [1, 2.6, 11.315], pos: [3.0465, 0.3, 0], group:1, mask:4, visible:false, restitution:restitution, friction:friction })

    // intern frame
    phy.add({ type:"box", size: [0.13, 0.27, 11.315], pos: [-2.4815, 0.135, 0], group:1, mask:4, visible:false, restitution:restitution, friction:friction/*, friction: 1, staticFriction: 1, filter: [128]*/ })
    phy.add({ type:"box", size: [0.13, 0.27, 11.315], pos: [2.4815, 0.135, 0], group:1, mask:4, visible:false, restitution:restitution, friction:friction/*, friction: 1, staticFriction: 1, filter: [128]*/ })
    //view.add({ type:"box", size: [5.5925, 0.27, 0.13], pos: [0, 0.135, -5.5925], material: 'debug', filter:[1, 4, 0, 0 ]/*, friction: 1, staticFriction: 1, filter: [128]*/ });


    // pinball physics glass 

    //phy.addMaterial({ name:'glass', color:0x9999ff, roughness: 0.1, metalness: 1.0, transparent:true, opacity:0.1 });
    var g = phy.add({ type:"box", size: [5, 0.05, 11.7], rot: [5, 0, 0], pos: [0, 1.0916, 0.122 ], material: 'glass', shadow:false, visible:false })
    g.castShadow = false;
    g.receiveShadow = false;

    


    phy.setPostUpdate( update )

}

addSw = () => {

	var pos = [
	    [-1.1876, 0, -1.2411],

	    [-0.2812, 0, -2.1121],
	    [0.0084, 0, -2.0969],
	    [0.298, 0, -2.0817],

	    [-0.4371, 0, -3.2378],
	    [0.2973, 0, -3.2378],

	    [1.5055, 0, 0.4571],
	    [1.4802, 0, 0.746],
	    [1.4549, 0, 1.0348],

	    [-1.8286, 0, -0.2199],
	    [-1.8388, 0, 0.07],
	    [-1.8489, 0, 0.3598],
	    [-1.859, 0, 0.6496],
	    [-1.8691, 0, 0.9394],
	]

	var rot = [40, -3, -3, -3, 60, -60, -95, -95, -95, 88, 88, 88, 88, 88 ]

	var i = pos.length
	while(i--){

		pos[i][1] = 0.135;
	    phy.add({ name:"sw"+i, mesh:groups['sw_base'], size: [0.27, 0.27, 0.1], meshScale:[10], pos: pos[i], rot: [0, rot[i] ,0], group:1, mask:4 })

	}

}

update = () => {

    let r = []

    let dt = phy.getDelta()
    let key = phy.getKey2()

    let vl = key[0]
    let vr = key[1]
    let torque = 300
    let mod = 'force'
    
    //let A1 = Math.round( pad[0].rotation.y * math.todeg )
    //let A2 = Math.round( pad[1].rotation.y * math.todeg )

    if( vl!==0 ) r.push( { name:'paddle_0', torque:[ 0, torque, 0 ], torqueMode:mod  } )
    else r.push( { name:'paddle_0', torque:[ 0, -torque, 0 ], torqueMode:mod  } )
    
    if( vr!==0 ){
        r.push( { name:'paddle_1', torque:[ 0, -torque, 0 ], torqueMode:mod } )
        r.push( { name:'paddle_2', torque:[ 0, -torque, 0 ], torqueMode:mod } )
    } else {
        r.push( { name:'paddle_1', torque:[ 0, torque, 0 ], torqueMode:mod } )
        r.push( { name:'paddle_2', torque:[ 0, torque, 0 ], torqueMode:mod } )
    }

    // simulate pinball angle
    let i = ball.length
    while(i--) r.push( { name:ball[i].name, force:[0,0,0.3] } )
    

    phy.change( r )

}