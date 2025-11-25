const debug = 0
let buggy, maxDistance = 50;

demo = () => {

    phy.log('use key WSAD or ZSQD<br>SPACE to handbrake')

    phy.view({ envmap:'basic', ground:debug, fog:true, fogDist:0.01 })

    phy.set( {substep:2, gravity:[0,-9.81,0], key:true })

    phy.add({ type:'plane', name:'floor', size:[300,1,300], visible:false });
    //phy.add({ pos:[0,20,0], rot:[0,0,0], size:[0.5,0.5,0.5], mass:30})
    //phy.add({ type:'box', size:[4,1,6], rot:[1,0,0], pos:[0,0.5,0],  radius:0.025 })

    // phy.add({ type:'box', size:[4,4,1],  pos:[0,2,10],  radius:0.025 })

    // preLoad
    const maps = [
        'textures/buggy/body_c.jpg', 'textures/buggy/extra_c.jpg',
        'textures/buggy/extra_n.jpg', 'textures/buggy/pilote_c.jpg',
        'textures/buggy/wheel_c.jpg', 'textures/buggy/wheel_n.jpg',
        'textures/buggy/suspension_c.jpg'
    ]

    phy.load(['models/buggy.glb', ...maps], onComplete, './assets/' )

}

onComplete = () => {

    phy.applyMorph('buggy', null, true);

    const model = phy.getMesh('buggy');
    applyMaterial( model )

    const body = model['h_chassis']
    const wheel = model['h_wheel']
    const suspension = model['h_susp_base']
    const brake = model['h_brake']

    

    buggy = phy.add( { 

        type:'vehicle', 
        name:'buggy', 
        ray:debug,
        debug:debug,
        radius:0.43,// wheels radius
        deep:0.3, // wheels deep only for three cylinder
        wPos:[ 0.838, 0.43, 1.37 ], // wheels position on chassis
        chassisPos:[0,0,0],
        massCenter:[0,0,0],

        chassisShape:model['h_shape'],
        meshScale:100,
        chassisMesh:body,
        wheelMesh: wheel,
        brakeMesh: brake,
        suspensionMesh: suspension,

        maxSteering:14,// the max steer angle in degree
        s_travel:0.4,// the total length of suspension

        //engine:6000,
        //acceleration:100,

    })

    // add top spare wheel
    let wtop = wheel.clone()
    wtop.position.set(0,0.0125,-0.0113)
    wtop.rotation.z = -90 * math.torad
    buggy.model.add( wtop )

    if( debug ) return

    terrainTest()

    // update after physic step
    phy.setPostUpdate ( update )

    phy.follow( 'buggy', { direct:true, simple:true, decal:[0, 1, 0] }),
    phy.control( 'buggy' );
    

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

    let py = terrain.getHeight( 0, 0 )+3
    if(py<1) py = 1

    phy.change({ name:'buggy', pos:[0,py,0] })
    phy.remove( 'floor' )

    // update after physic step
    phy.setPostUpdate( update )

}

update = () => {

    let p = buggy.position;
    //let d = math.distance({ x:p.x, z:p.z });
    let d = math.distanceArray([p.x, 0, p.z])

    if( d > 50 ){
        phy.change([
            { name:'terra', decal:[p.x,0,p.z] },
            { name:'buggy', pos:[0,p.y,0] },
        ])
    }

    //let key = phy.getKey()
    //phy.update( { name:'buggy', key:key } )

}

applyMaterial = ( model ) => {

    const mat = {}


    //let Mat = phy.getMat()
    //let clear = Mat.get('clear')

    const path = './assets/textures/buggy/'

    mat['carGlass'] = phy.getMat('carGlass');

    mat['body'] = phy.material({
        name:'body',
        roughness: 0.5,
        metalness: 1.0,
        envMapIntensity: 1.35,
        map: phy.texture({ url:path + 'body_c.jpg' }),
        clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5,
    });

    mat['extra'] = phy.material({
        name:'extra',
        roughness: 0.1,
        metalness: 0.6,
        map: phy.texture({ url:path + 'extra_c.jpg' }),
        normalMap: phy.texture({ url:path + 'extra_n.jpg' }),
        normalScale: [ 1, -1 ],
    });

    mat['pilote'] = phy.material({
        name:'pilote',
        roughness: 0.4,
        metalness: 0.6,
        map: phy.texture({ url:path + 'pilote_c.jpg' }),
    });

    let wheel_map = phy.texture({ url:path + 'wheel_c.jpg' })
    let wheel_normal = phy.texture({ url:path + 'wheel_n.jpg' })

    mat['wheel'] = phy.material({
        name:'wheel',
        roughness: 0.5,
        metalness: 1.0,
        map: wheel_map,
        normalMap: wheel_normal,
        normalScale: [ 1, -1 ],
        clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5,
    });

    mat['pneu'] = phy.material({
        name:'pneu',
        roughness: 0.7,
        metalness: 0.1,
        map: wheel_map,
        normalMap: wheel_normal,
        normalScale: [ 2, -2 ],
    });

    mat['susp'] = phy.material({
        name:'susp',
        roughness: 0.6,
        metalness: 0.4,
        map: phy.texture({ url:path + 'suspension_c.jpg' }),
    });

    mat['brake'] = phy.material({
        name:'brake',
        transparent:true, 
        opacity:0.2,
        color: 0xdd3f03,
    });

    let m
    for( let o in model ){
        m = model[o]
        m.castShadow = true
        m.receiveShadow = true
        switch(o){
            case 'h_glasses': 
            m.material = mat.carGlass; 
            m.castShadow = false
            break;
            case 'h_pilote': m.material = mat.pilote; break;
            case 'h_pneu': m.material = mat.pneu; break;
            case 'h_hot': m.material = mat.brake; break;
            case 'h_brake': case 'h_wheel': case 'h_brake_disk': case 'h_brake': m.material = mat.wheel; break;
            case 'h_susp_base': case 'h_suspension': m.material = mat.susp; break;
            case 'h_steering_wheel': case 'h_sit_R': case 'h_sit_L': 
            case 'h_extra': case 'h_pot': case 'h_license': m.material = mat.extra; break;
            default:
            m.material = mat.body;
            break;

        }

    }

}


