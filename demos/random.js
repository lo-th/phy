let max = 50, n = 0, tt = 300, models
const dices = ['D20', 'D12', 'D10', 'D8', 'D6', 'D4']

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
    })

    // config physics setting
    phy.set({ substep:2, gravity:[0,-30,0]})

    // add static plane 
    phy.add({ type:'plane', size:[300,1,300], visible:false, friction:0.5, restitution:0.1 })

    phy.load( ['./assets/models/dices.glb', './assets/models/slide.glb'], onComplete )

    let g = phy.getGround()
    //g.material.map = phy.texture({ url:'./assets/textures/dices/carpet_n.jpg', repeat:[8,8] })
    g.material.normalMap = phy.texture({ url:'./assets/textures/dices/carpet_n.jpg', repeat:[20,20] })
    //g.material.normalScale.set(0.2,0.2)

}

onComplete = () => {

    models = phy.getMesh('dices');

    // make material
    phy.material({ 
        name:'dices', 
        roughness: 0.0, 
        metalness: 0.0, 
        map: phy.texture({ url:'./assets/textures/dices/dices_c.png' }), 
        normalMap: phy.texture({ url:'./assets/textures/dices/dices_n.png' }),
        normalScale:[5,-5],
    })

    phy.add( {
        type:'mesh',
        mesh: phy.getMesh('slide').slide_h,
        shape: phy.getMesh('slide').slide.geometry,
        restitution:0.1, friction:0,
        size:[0.36],
        meshScale:[0.36],
        material:'glassX'
    })

    let socle = phy.getMesh('slide').socle
    socle.material = phy.getMat('clay')
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

    phy.add({
        type:'convex',
        name: 'dice' + n,
        material:'dices',
        shape: models[ dices[math.randInt(0, 5)] ].geometry,
        size:[math.rand(25, 50)],
        //pos:[math.rand(-2, 2),math.rand(8, 10),math.rand(-2, 2)],
        pos:[4.8,10,2],
        rot:[math.rand(-180, 180),math.rand(-180, 180),math.rand(-180, 180)],
        density:0.2,
        friction:0.2,
        staticFriction:0,
        restitution:0.2,
    })

    n++
    if( n>max ) n = 0

    // phy intern timeout
    phy.setTimeout( add, tt )

}

addEffect = () => {

    phy.addParticle({
        "type":"octo",
        "position":[0,0,0],
        "colors":[ 0.33, 0.34, 0.39, 1,
        0.33, 0.34, 0.39, 0 ],
        "numParticles": 100,
        "lifeTime": 6,
        "timeRange": 6,
        "startSize": 0.07,
        "endSize": 0.07,
        "sizeRange": 0.025,
        
        "positionRange": [ 10, 0, 10 ],
        "velocity": [ 0.5, 1.0, 0.5 ],
        "velocityRange": [ 0.2, 0.5, 0.2 ],
        "blending":"normal",
        "spinSpeedRange": 1
    })

}