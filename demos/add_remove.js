let max = 50, n = 0, tt = 300, models
const friction = 0.8
const bounce = 0.1
//const dices = ['d20', 'd12', 'd10', 'd8', 'd6', 'd4']
const dices = ['D20', 'D12', 'D10', 'D8', 'D6', 'D4']

demo = () => {

    //phy.view({ envmap:'bed', ground:true })

    // note one unit = one meter
    phy.log('look code')

    // config physics setting
    phy.set( {substep:2, gravity:[0,-9.81,0]})

    // add static plane 
    phy.add({ type:'plane', size:[300,1,300], visible:false, friction:friction, restitution:bounce })

    phy.load( './assets/models/dices.glb', onComplete )

    

}

onComplete = () => {

    models = phy.getMesh('dices');

    // make material
    let map = phy.texture({ url:'./assets/textures/dices/dices_c.png', flip:false, encoding:true })
    let normal = phy.texture({ url:'./assets/textures/dices/dices_n.png', flip:false, encoding:false })
    let material = phy.material({ name:'dices', roughness: 0.25, metalness: 0.5, map:map, normalMap:normal })
    material.normalScale.set(2,-2)

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