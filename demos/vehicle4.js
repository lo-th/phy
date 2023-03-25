let currentCar = null;

let meshes, maxDistance = 50, oldv = 0, trail = null;
let tmpPose = new THREE.Vector3()
let tmpPose2 = new THREE.Vector3()
let tmpPose3 = new THREE.Vector3()
let oldPose = new THREE.Vector3()
const TimeFrame = 1/30;


const CARS = [
    { n:'000', name:'moto'   , radius:0.36, numWheel:2, w:'1', mass:800,  wPos:[0, 0, 0.8] },
    { n:'001', name:'fordM'  , radius:0.36, numWheel:4, w:'1', mass:1109,  wPos:[0.76, 0, 1.46] },
    { n:'002', name:'vaz'    , radius:0.36, numWheel:4, w:'1', mass:1003,  wPos:[0.72, 0, 1.31] },
    { n:'003', name:'coupe'  , radius:0.36, numWheel:4, w:'1', mass:900,   wPos:[0.96, 0, 1.49] },
    { n:'004', name:'c4'     , radius:0.40, numWheel:4, w:'2', mass:1181,  wPos:[0.93, 0, 1.65] },
    { n:'005', name:'ben'    , radius:0.40, numWheel:4, w:'2', mass:1256,  wPos:[0.88, 0, 1.58] },
    { n:'006', name:'taxi'   , radius:0.40, numWheel:4, w:'2', mass:1156,  wPos:[0.90, 0, 1.49] },
    { n:'007', name:'207'    , radius:0.40, numWheel:4, w:'2', mass:1156,  wPos:[0.94, 0, 1.60] },
    { n:'008', name:'police' , radius:0.40, numWheel:4, w:'2', mass:1400,  wPos:[0.96, 0, 1.67] },
    { n:'009', name:'van1'   , radius:0.46, numWheel:4, w:'3', mass:2000,  wPos:[1.14, 0, 1.95] },
    { n:'010', name:'van2'   , radius:0.40, numWheel:4, w:'2', mass:2400,  wPos:[0.89, 0, 2.10] },
    { n:'011', name:'van3'   , radius:0.46, numWheel:4, w:'3', mass:2400,  wPos:[[0.90, 1.2], 0, 1.83] },
    { n:'012', name:'truck1' , radius:0.57, numWheel:6, w:'4', mass:10000, wPos:[[1.0, 1.18, 1.18], 0, [2.58, -2.58, -1.23]] },
    { n:'013', name:'truck2' , radius:0.57, numWheel:6, w:'4', mass:14000, wPos:[1.17, 0, [3.64, -3.64, -2.37]] },
    { n:'014', name:'bus'    , radius:0.64, numWheel:4, w:'5', mass:11450, wPos:[1.25, 0, 2.49] },
    { n:'015', name:'vbci'   , radius:0.57, numWheel:8, w:'4', mass:9000, wPos:[1.2, 0, [2.2, 0.9, -0.7, -2.2]] },
];

demo = () => {

    phy.log('use key WSAD or ZSQD<br>SPACE to handbrake<br>Right click to select drive car')

    phy.view({ envmap:'puresky', ground:true, fog:true, fogDist:0.01 })

    phy.set( {substep:2, gravity:[0,-9.81,0], key:true })

    phy.add({ type:'plane', name:'floor', size:[300,1,300], visible:false, friction:1 });
    //phy.add({ pos:[0,20,0], rot:[0,0,0], size:[0.5,0.5,0.5], mass:30})
    //phy.add({ type:'box', size:[4,1,6], rot:[1,0,0], pos:[0,0.5,0],  radius:0.025 })


    

    phy.load(['./assets/models/cars.glb'], onComplete )

}

onComplete = () => {

    meshes = phy.getMesh('cars');

    applyMaterial( meshes )

    var g = [];
    for (let i = 0; i < CARS.length; i++){ 
        g.push( vehicle( i, [-25+(i*4), 0,0]) );
    }

    phy.add( g );

    select('fordM')

    phy.addParticle({
        name:'yoo', 
        //model:'smoke',
        colors:[
            0.5, 0.5, 0.5, 0,
            0.5, 0.5, 0.5, 1,
            0.5, 0.5, 0.5, 0
        ],
        position:[-20,-0.2,-5],
        numParticles: 120,
        lifeTime: 2,
        timeRange: 2,
        startSize: 2,
        endSize: 5,
        velocity: [ 0, 2, 0 ], 
        velocityRange: [ 0.6, 1, 0.6 ],
        //accelerationRange:[0.25,0,0.25],
        tween:"inOutQuad",
        blending:"normal",
    })

    phy.setPostUpdate( updateTest )
    
}


updateTest = () => {

    if(!currentCar) return

     ///   tmpPose.copy( currentCar.position ).add({x:0.5, y:0.1, z:-2}).applyQuaternion( currentCar.quaternion )
    tmpPose.set( 0.5, 0.1,-2).applyQuaternion( currentCar.quaternion ).add( currentCar.position )
    tmpPose2.set( currentCar.wPos[0], 0,-currentCar.wPos[2]).applyQuaternion( currentCar.quaternion ).add( currentCar.position )
    tmpPose3.set( -currentCar.wPos[0], 0,-currentCar.wPos[2]).applyQuaternion( currentCar.quaternion ).add( currentCar.position )

    let p = currentCar.position;
    let d = math.distance( p, oldPose );
    oldPose.copy( p )

    if( d > 0 ){
        let t
        t = phy.getParticle('carSmoke')
        if( t ) t.birthParticles( tmpPose.toArray() );
        else t = phy.addParticle({ name:'carSmoke', model:'vehicleMove' })

        t = phy.getParticle('carTrack1')
        if( t ) t.birthParticles( tmpPose2.toArray() );
        else t = phy.addParticle({ name:'carTrack1', model:'vehicleTrack' })

        t = phy.getParticle('carTrack2')
        if( t ) t.birthParticles( tmpPose3.toArray() );
        else t = phy.addParticle({ name:'carTrack2', model:'vehicleTrack' })
        
    }

}

select = ( name ) => {
    phy.follow( name, { direct:true, simple:true, decal:[0, 1, 0] })
    phy.control( name )
    currentCar = phy.byName( name )
    oldPose.copy( currentCar.position )
}

vehicle = ( id, pos ) => {

    let n = CARS[id].n
    let w = CARS[id].w
    let mass = CARS[id].mass

    return {
        ...CARS[id],
        type:'vehicle', 
        chassisShape:meshes['shape'+n],
        chassisMesh:meshes['mcar'+n],
        wheelMesh:meshes['w00'+w],
        pos:pos,
        chassisPos:[0,0,0],
        massCenter:[0,0,0],
        meshScale:100,
        ray:true,
        s_force: mass*10,
        //s_compression : 0.84,
        //s_damping : 0.88,
        s_stiffness : 50,
        s_damping : 1,//8,
        s_travel: 0.2,
        //w_attach:0.1,
        //s_length:0.1,
        extra:select,

    }

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
    let d = math.distance({ x:p.x, z:p.z });


    if( d > 50 ){
        phy.change([
            { name:'terra', decal:[p.x,0,p.z] },
            { name:'supercar', pos:[0,p.y,0] },
        ])
    }

}

applyMaterial = ( model ) => {

    const mat = {}
    const path = './assets/textures/'
    const ao = 1

    mat['cars'] = phy.material({
        name:'cars',
        roughness: 0.5,
        metalness: 1.0,
        transparent:true,
        envMapIntensity: 1.35,
        alphaMap:phy.texture({ url:path + 'cars_a.jpg' }),
        map: phy.texture({ url:path + 'cars_c.jpg' }),
        clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5,
        side:THREE.DoubleSide,
        premultipliedAlpha: true,
    });

    mat['cars2'] = phy.material({
        name:'cars2',
        roughness: 0.5,
        metalness: 1.0,
        envMapIntensity: 1.35,
        alphaMap:phy.texture({ url:path + 'cars_a.jpg' }),
        map: phy.texture({ url:path + 'cars_c.jpg' }),
        clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5,
    });

    let m
    for( let o in model ){
        m = model[o]
        //phy.uv2( m )
        m.castShadow = true
        m.receiveShadow = true

        if( o.search('mcar') !== -1 ) m.material = mat.cars
        else m.material = mat.cars2

    }

}


