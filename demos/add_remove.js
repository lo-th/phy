let max = 50, n = 0, tt = 300, models
const friction = 0.4
const bounce = 0.1
const dices = ['D20', 'D12', 'D10', 'D8', 'D6', 'D4']

demo = () => {

    phy.view({ 
        envmap:'park',
        envblur:0.5,
        groundAlpha:true,
        groundColor:0x0e7547,
        groundReflect:0.0, 
    })

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0]})

    // add static plane 
    phy.add({ type:'plane', size:[300,1,300], visible:false, friction:friction, restitution:bounce })

    phy.load( './assets/models/dices.glb', onComplete )

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
        pos:[math.rand(-2, 2),math.rand(8, 10),math.rand(-2, 2)],
        rot:[math.rand(-180, 180),math.rand(-180, 180),math.rand(-180, 180)],
        density:1,
        friction:friction,
        restitution:bounce,
    })

    n++
    if( n>max ) n = 0

    // phy intern timeout
    phy.setTimeout( add, tt )

}