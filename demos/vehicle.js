let buggy, maxDistance = 50;

demo = () => {

    phy.view({ envmap:'basic', ground:false, fog:true, fogDist:0.01 })

    phy.set( {substep:2, gravity:[0,-9.81,0]})

    phy.add({ type:'plane', name:'floor', size:[300,1,300], visible:false });
    //phy.add({ pos:[0,20,0], rot:[0,0,0], size:[0.5,0.5,0.5], mass:30})
    //phy.add({ type:'box', size:[4,1,6], rot:[1,0,0], pos:[0,0.5,0],  radius:0.025 })

   // phy.add({ type:'box', size:[4,4,1],  pos:[0,2,10],  radius:0.025 })

   phy.load(['./assets/models/buggy.glb'], onComplete )

}

onComplete = () => {

    phy.applyMorph('buggy', null, true);

    const model = phy.getMesh('buggy');

    const wheel = model['h_wheel']

    const suspension = model['h_susp_base']


    let Mat = phy.getMat()
    let clear = Mat.get('clear')

    for( let o in model ){

        model[o].castShadow = true;
        model[o].receiveShadow = true;
        model[o].material = clear;

    }

    const body = model['h_chassis']
    let k = body.children.length, m;


    while(k--){

        m = body.children[k];
        if( m.name === 'h_glasses' ){ 
            m.material = Mat.get('plexi');
            m.castShadow = false
            m.receiveShadow = false
        }
        
    }

    k = wheel.children.length;
    
    while(k--){

        m = wheel.children[k];
        
    }




    buggy = phy.add( { 
        type:'vehicle', 
        name:'buggy',  
        //size:[ 1.3, 0.4, 3.5 ], // chassis size

        radius:0.43,// wheels radius
        deep:0.3, // wheels deep only for three cylinder
        wPos:[ 0.838, 0.43, 1.37 ], // wheels position on chassis
        chassisPos:[0,0,0],
        massCenter:[0,0,0],

        chassisShape:model['h_shape'],
        meshScale:100,
        chassisMesh:body,
        wheelMesh: wheel,
        suspensionMesh: suspension,

        s_travel:0.4,
        w_attach:0.215,

    })

    terrainTest()

    // update after physic step
    phy.setPostUpdate ( update )

    phy.follow( 'buggy', { direct:true, simple:true, decal:[0, 1, 0] })
    phy.control( 'buggy' )
    

}

terrainTest = () => {

    let terrain = phy.add({
        type:'terrain',
        name:'terra',
        friction: 0.5, 
        //staticFriction:0.5,
        restitution: 0.0,
        uv: 128,
        pos: [0,-5,0],
        size:[512, 20, 512],
        sample: [512, 512],
        frequency: [0.016,0.05,0.2],
        level:[ 1, 0.2, 0.05 ],
        expo: 2,
    })

    let py = terrain.getHeight( 0, 0 )+1
    if(py<1) py = 1

    phy.up( { name:'buggy', pos:[0,py,0] } )
    phy.remove( 'floor' )

    // update after physic step
    phy.setPostUpdate( update )

}

update = () => {

    let p = buggy.position;
    let d = math.distance({ x:p.x, z:p.z });

    if( d > 50 ){
        phy.up([
            { name:'terra', decal:[p.x,0,p.z] },
            { name:'buggy', pos:[0,p.y,0] },
        ])
    }

    //let key = phy.getKey()
    //phy.update( { name:'buggy', key:key } )

}