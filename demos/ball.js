const scale = 10

function demo() {

    phy.view({
        envmap:'gym', envblur:0.5,
    })

    phy.set({ 
        worldScale:0.1, 
        substep:1,
        bounceThreshold:0.08,//0.2
        frictionOffset:0.01,//0.04
        frictionCorrelation:0.005 // 0.025
    })

    phy.add({ 
        type:'container', 
        name:'b',
        material:'debug',
        color:0x606060,
        size:[28,20,28,0.12], 
        pos:[0,10,0], 
        friction:0.5, 
        restitution:0.5, 
        intern:true, 
        remplace:true
    });

    phy.material({ 
        name:'basket', 
        roughness: 0.45, 
        metalness: 0, 
        map: phy.texture({ url:'./assets/textures/ball/basket.ktx2', encoding:true }),
        normalMap: phy.texture({ url:'./assets/textures/ball/basket_n.ktx2' }),
        aoMap: phy.texture({ url:'./assets/textures/ball/basket_ao.ktx2' }),
        normalScale:[1,-1],
    })

    phy.material({ 
        name:'foot', 
        roughness: 0.45, 
        metalness: 0, 
        map: phy.texture({ url:'./assets/textures/ball/foot.jpg', encoding:true }),
        normalMap: phy.texture({ url:'./assets/textures/ball/foot_n.jpg' }),
        aoMap: phy.texture({ url:'./assets/textures/ball/foot_ao.jpg' }),
        normalScale:[1,-1],
    })

    phy.material({ 
        name:'volley', 
        roughness: 0.45, 
        metalness: 0, 
        map: phy.texture({ url:'./assets/textures/ball/volley.jpg', encoding:true }),
        normalMap: phy.texture({ url:'./assets/textures/ball/volley_n.jpg' }),
        aoMap: phy.texture({ url:'./assets/textures/ball/volley_ao.jpg' }),
        normalScale:[1,-1],
    })

    phy.material({ 
        name:'hand',
        color:0xdcdcdc,
        roughness: 0.45, 
        metalness: 0, 
        normalMap: phy.texture({ url:'./assets/textures/ball/foot_n.jpg' }),
        aoMap: phy.texture({ url:'./assets/textures/ball/foot_ao.jpg' }),
        normalScale:[1,-1],
    })

    phy.material({ 
        name:'tennis',
        roughness: 0.8, 
        metalness: 0, 
        map: phy.texture({ url:'./assets/textures/ball/tennis.jpg', encoding:true }),
        normalMap: phy.texture({ url:'./assets/textures/ball/tennis_n.jpg' }),
        aoMap: phy.texture({ url:'./assets/textures/ball/tennis_ao.jpg' }),
        normalScale:[1,-1],
    })

    phy.material({ 
        name:'pool',
        roughness: 0.2, 
        metalness: 0, 
        map: phy.texture({ url:'./assets/textures/ball/pool10.jpg', encoding:true }),//
        normalMap: phy.texture({ url:'./assets/textures/ball/pool_n.jpg' }),
        normalScale:[1,-1],
    })

    phy.material({ 
        name:'golf',
        color:0xdcdcdc,
        roughness: 0.2, 
        metalness: 0, 
        normalMap: phy.texture({ url:'./assets/textures/ball/golf_n.jpg' }),
        normalScale:[1,-1],
    })


    let py = 1 * scale

    let mesh = phy.add({ type:'highSphere', size:[0.124*scale], pos:[-0.6*scale,py,0], mass:0.650, friction:0.5, staticFriction:0.6, restitution:0.82, material:'basket' });
    phy.add({ type:'highSphere', size:[0.113*scale], pos:[-0.3*scale,py,0], mass:0.453, friction:0.4, staticFriction:0.5, restitution:0.75, material:'foot', bullet:true, pv:1e30 });
    phy.add({ type:'highSphere', size:[0.106*scale], pos:[0.0,py,0], mass:0.260, friction:0.4, staticFriction:0.5, restitution:0.85, material:'volley' });
    phy.add({ type:'highSphere', size:[0.095*scale], pos:[0.28*scale,py,0], mass:0.475, friction:0.6, staticFriction:0.7, restitution:0.6, material:'hand' });
    phy.add({ type:'highSphere', size:[0.035*scale], pos:[0.44*scale,py,0], mass:0.056, friction:0.6, staticFriction:0.7, restitution:0.6, material:'tennis' });
    phy.add({ type:'highSphere', size:[0.0286*scale], pos:[0.53*scale,py,0], mass:0.017, friction:0.3, staticFriction:0.4, restitution:0.3, material:'pool' });
    phy.add({ type:'highSphere', size:[0.021*scale], pos:[0.6*scale,py,0], mass:0.045, friction:0.3, staticFriction:0.4, restitution:0.3, material:'golf' });



}