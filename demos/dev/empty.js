const scale = 10

function demo() {

    phy.view({
        envmap:0x606060,
        //ground:false,
        vignette:false,
        //shadow:0,
        groundReflect:0,
        //jointVisible:true, 
    })


    phy.set({ 
        worldScale:0.1, 
        substep:1,
        //ccd:true,
        //forceSubstep:10,
        //pv:1e30,
        bounceThreshold:0.08,//0.2
        frictionOffset:0.01,//0.04
        frictionCorrelation:0.005 // 0.025

        //tolerance:100,
        //toleranceSpeed:5,//10
        //ccd:true,
    })

    //phy.add({ type:'box', size:[30,2,100], pos:[0, -1, 0], friction:0.5, restitution:0.5, visible:false });

    phy.add({ 
        type:'container', 
        name:'container',
        material:'debug',
        color:0x000000,
        size:[28,20,15,0.12], 
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


    //let tx = phy.texture({ url:'./assets/textures/box.png', encoding:true,  });


    //let ball = phy.add({ type:'highSphere', size:[0.0286*scale], pos:[-1,2,1], mass:0.17*scale, friction:0.5, restitution:0.3 });
    //let box = phy.add({ type:'box', size:[0.0286*scale*2], pos:[1,2,0], mass:0.17*scale, friction:0.5, restitution:0.3 });

    let py = 1 * scale

    let mesh = phy.add({ type:'highSphere', size:[0.124*scale], pos:[-0.6*scale,py,0], mass:0.650, friction:0.5, staticFriction:0.6, restitution:0.82, material:'basket' });
    phy.add({ type:'highSphere', size:[0.113*scale], pos:[-0.3*scale,py,0], mass:0.453, friction:0.4, staticFriction:0.5, restitution:0.75, material:'foot', bullet:true, pv:1e30 });
    phy.add({ type:'highSphere', size:[0.106*scale], pos:[0.0,py,0], mass:0.260, friction:0.4, staticFriction:0.5, restitution:0.85, material:'volley' });
    phy.add({ type:'highSphere', size:[0.095*scale], pos:[0.28*scale,py,0], mass:0.475, friction:0.6, staticFriction:0.7, restitution:0.6, material:'hand' });
    phy.add({ type:'highSphere', size:[0.035*scale], pos:[0.44*scale,py,0], mass:0.056, friction:0.6, staticFriction:0.7, restitution:0.6, material:'tennis' });
    phy.add({ type:'highSphere', size:[0.0286*scale], pos:[0.53*scale,py,0], mass:0.017, friction:0.3, staticFriction:0.4, restitution:0.3, material:'pool' });
    phy.add({ type:'highSphere', size:[0.021*scale], pos:[0.6*scale,py,0], mass:0.045, friction:0.3, staticFriction:0.4, restitution:0.3, material:'golf' });


    //phy.load(['./assets/models/sb.glb'], onComplete )



    /*let vnh = new VertexNormalsHelper( mesh.children[0], 0.01 );
    phy.add( vnh );

    let vth = new VertexTangentsHelper( mesh.children[0], 0.01 );
    phy.add( vth );
*/
    /*phy.add({ type:'box', size:[10,1,10], pos:[0,-0.5,0], visible:false });
    phy.add({ type:'plane', size:[300,1,300], visible:true })

    phy.add({ type:'box', size:[1,3,2], pos:[2,1.5,0], mass:1 });
    phy.add({ type:'box', size:[1,3,2], pos:[-2,1.5,0], density:1 });

    phy.add({ type:'box', size:[1,3,2], pos:[2,4.5,0], density:1 });
    phy.add({ type:'box', size:[1,3,2], pos:[-2,4.5,0],  });

    phy.add({ type:'box', size:[1,3,2], pos:[2,7.5,0], density:1 });
    phy.add({ type:'box', size:[1,3,2], pos:[-2,7.5,0], mass:1 });
    //phy.add({ name:'Ub', type:'sphere', size:[4], pos:[0,100,0], density:1 });*/

    //phy.add({ name:'jointTest', type:'generic', b1:'a', b2:'b', pos1:[1,0,0], pos2:[-1,0,0], limit:[['x', 0, 2], ['rx', -180, 180 ] ], collision:true, visible:true });

    //phy.add({ name:'jointTest', type:'fixe', b1:'a', b2:'b', pos1:[1,0,0], pos2:[-1,0,0], collision:false, visible:true });
    //phy.add({ name:'jointTest', type:'hinge', b1:'a', b2:'b', pos1:[1,0,0], pos2:[-1,0,0], collision:false, visible:true });

    //phy.remove('jointTest')
    //phy.remove('b')

}
/*
onComplete = () => {
    const model = phy.getMesh('sb');
    let sb = model.SB
    sb.position.set(0,1,0)
    sb.scale.set(4,4,4)

    phy.add(sb)
    console.log(sb.geometry)
}*/