let max = 50, n = 0, tt = 300, models
const dices = ['D20', 'D12', 'D10', 'D8', 'D6', 'D4']
const dices_high = ['H20', 'H12', 'H10', 'H8', 'H6', 'H4']

demo = () => {

    phy.view({ 
        envmap:'bed',
        envblur:0.5,
        groundAlpha:true,
        groundColor:0x404040,///0e7547,
        groundReflect:0.4, 
        distance:15,
        y:10*0.36,
        fov:60,
        phi:0,
        theta:45,
    })

    // config physics setting
    phy.set({ substep:2, gravity:[0,-10,0], worldScale:0.2 })

    // add static plane 
    phy.add({ type:'plane', size:[300,1,300], visible:false, friction:1, restitution:0.1, frictionMode:'num' })

    phy.load( ['./assets/models/dices.glb', './assets/models/slide.glb'], onComplete )

    

}

onComplete = () => {



    let g = phy.getGround()
    //g.material.map = phy.texture({ url:'./assets/textures/dices/carpet_n.jpg', repeat:[8,8] })
    g.material.normalMap = phy.texture({ url:'./assets/textures/dices/carpet_n.jpg', repeat:[20,20] })
    //g.material.normalScale.set(0.2,0.2)

    models = phy.getMesh('dices');


    // make dices material
    phy.material({ 
        name:'dices', 
        roughness: 0.0, 
        metalness: 0.0, 
        map: phy.texture({ url:'./assets/textures/dices/dices_c.png' }), 
        normalMap: phy.texture({ url:'./assets/textures/dices/dices_n.png' }),
        normalScale:[5,-5],
    })


    let slideMesh = phy.getMesh('slide');

    phy.add( {
        type:'mesh',
        mesh: slideMesh.slide_h,
        shape: slideMesh.slide.geometry,
        restitution:0.2, friction:0.02,
        size:[0.36],
        meshScale:[0.36],
       // material:'plexi'
        material:'glassX'
    })


    let socle = slideMesh.socle.clone()
    socle.material = phy.getMat('clayWhite')
    socle.receiveShadow = true
    socle.castShadow = true
    socle.scale.multiplyScalar(0.36)
    socle.position.multiplyScalar(0.36)
    phy.add(socle)

    // add some dust
    addEffect()

    // add some dices
    add()

}

add = () => {

    // by default engine remove object with the same name
    // you can also use phy.remove(name)

    let num = math.randInt(0, 5)
    let s = math.rand(20, 60)

    phy.add({
        type:'convex',
        name: 'dice' + n,
        material:'dices',
        shape: models[ dices[num] ].geometry,
        mesh: models[ dices_high[num] ],
        meshSize:[s],
        size:[s],
        pos:[4.8,10,2],
        rot:[math.rand(-180, 180),math.rand(-180, 180),math.rand(-180, 180)],
        density:1000,
        friction:0.02,
        restitution:0.2,
    })

    n++
    if( n>max ) n = 0

    // phy intern timeout
    phy.setTimeout( add, tt )

}

addEffect = () => {

    phy.addParticle({
        type:"octo",
        position:[0,0,0],
        colors:[ 
            0.33, 0.34, 0.39, 1,
            0.33, 0.34, 0.39, 0 
        ],
        numParticles: 100,
        lifeTime: 6,
        timeRange: 6,
        startSize: 0.07,
        endSize: 0.07,
        sizeRange: 0.025,
        positionRange: [ 10, 0, 10 ],
        velocity: [ 0.5, 1.0, 0.5 ],
        velocityRange: [ 0.2, 0.5, 0.2 ],
        blending:"normal",
        spinSpeedRange: 1
    })

}