let supercar, model, meshes, maxDistance = 50, oldv = 0, w1, w2;
const TimeFrame = 1/30;

demo = () => {

    phy.log('use key WSAD or ZSQD<br>SPACE to handbrake')

    phy.view({ envmap:'puresky', ground:false, fog:true, fogDist:0.01 })

    phy.set( {substep:2, gravity:[0,-9.81,0], key:true })

    phy.add({ type:'plane', name:'floor', size:[300,1,300], visible:false });
    //phy.add({ pos:[0,20,0], rot:[0,0,0], size:[0.5,0.5,0.5], mass:30})
    //phy.add({ type:'box', size:[4,1,6], rot:[1,0,0], pos:[0,0.5,0],  radius:0.025 })

    phy.load(['./assets/models/bugatti.glb'], onComplete )

}

onComplete = () => {

    meshes = phy.getMesh('bugatti');
    //meshes.a_shape.visible = false
    applyMaterial( meshes )

    supercar = phy.add( {
        type:'vehicle', 
        name:'supercar',
        mass:500,
        rad:0.02,
        radius:0.32,// wheels radius
        radiusBack:0.35,
        deep:0.24, // wheels deep only for three cylinder
        deepBack:0.32,
        //wPos:[ 0.83, 0, 1.36, 1.36, 0.86 ], // wheels position on chassis
        wheelsPosition:[
            [-0.83, 0.32, 1.36],
            [0.83, 0.32, 1.36],
            [-0.86, 0.35, -1.36],
            [0.86, 0.35, -1.36],
        ],
        chassisPos:[0,0,0],
        massCenter:[0,0,0],

        chassisShape:meshes.g_shape,
        meshScale:1,
        //noClone:true,
        chassisMesh:meshes.g_chassis,
        wheelMesh: meshes.g_wheel_front,
        wheelMeshBack: meshes.g_wheel_back,
        brakeMesh: meshes.g_braks_front,
        brakeMeshBack: meshes.g_braks_back,
        //suspensionMesh: suspension,

        maxSteering:20,
        incSteering:0.25,

        s_travel:0.1,
        //w_attach:0.05,//0.215,

    })

    terrainTest()

    // update after physic step
    phy.setPostUpdate ( update )

    phy.follow( 'supercar', { direct:true, simple:true, decal:[0, 1, 0] })
    phy.control( 'supercar' )
    

}

terrainTest = () => {

    let terrain = phy.add({
        type:'terrain',
        name:'terra',
         
        maps:['road2', 'road3', 'asph'],
        ns:4,
        roughness:0.4,
        metalness:0.4,
        //staticFriction:0.5,
        friction: 0.5,
        restitution: 0.0,
        uv: 150,
        pos: [0,-5,0],
        size:[512, 2, 512],
        sample: [512, 512],
        frequency: [0.016,0.05,0.2],
        level:[ 1, 0.2, 0.05 ],
        expo: 2,
    })

    let py = terrain.getHeight( 0, 0 )+1
    if(py<1) py = 1

    phy.change( { name:'supercar', pos:[0,py,0] } )
    phy.remove( 'floor' )

    // update after physic step
    phy.setPostUpdate( update )

}


update = () => {


    let p = supercar.position;
    //let d = math.distance({ x:p.x, z:p.z });
    let d = math.distanceArray([p.x, 0, p.z])


    if( d > 50 ){
        phy.change([
            { name:'terra', decal:[p.x,0,p.z] },
            { name:'supercar', pos:[0,p.y,0] },
        ])
    }

}

applyMaterial = ( model ) => {

    const mat = {}
    //const path = './assets/textures/akira/'
    const ao = 1

    //let Mat = phy.getMat()
    mat['carGlass'] = phy.getMat('carGlass');
    mat['car'] = phy.getMat('car');

    let m
    for( let o in model ){
        m = model[o]
        //phy.uv2( m )
        m.castShadow = true
        m.receiveShadow = true
        switch(o){
            case 'g_glass':
            m.material = mat.car; 
            m.castShadow = false
            break;
            default:
            m.material = mat.car
            break;

        }

    }

}


