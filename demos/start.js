demo = () => {

    phy.view({
        phi:0, theta:0, distance:3, x:0, y:1, z:0, fov:50,//envmap:'render',
        groundSize:[ 5, 7],
        groundAlpha:false,
        groundColor:0xc7a87b,
        groundReflect:0.05,

    })
    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0], fps:60, fixe:true, reflect:0.1 })
    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })

    phy.getGround().material.visible = false

    
    // preLoad
    const maps = [
    'textures/floor_c.jpg', 'textures/floor_n.jpg',
    'textures/stucco_c.jpg',
    'textures/model/sofa_c.jpg', 'textures/model/sofa_n.jpg', 'textures/model/sofa_r.jpg',
    'textures/model/baseball_c.jpg', 'textures/model/baseball_n.jpg', 'textures/model/baseball_r.jpg',
    'textures/model/cardboard_c.jpg', 'textures/model/cardboard_n.jpg', 'textures/model/cardboard_r.jpg',
    ]

    const models = ['models/phy.glb','models/sofa.glb'];
    phy.load([...maps, ...models], onComplete, './assets/' )

}

onComplete = () => {

    makeMaterial()

    phy.add({ type:'box', size:[5,2.6,0.2], pos:[0,1.3,-3.6], material:'wall' })
    phy.add({ type:'box', size:[5,2.6,0.2], pos:[0,1.3,3.6], visible:false })

    phy.add({ type:'box', size:[0.2,2.6,7], pos:[-2.6,1.3,0], visible:false })
    phy.add({ type:'box', size:[0.2,2.6,7], pos:[2.6,1.3,0], visible:false })

    let g = phy.getGround()
   // g.color.setHex(0xffffff)
    g.material.map = phy.texture({ url:'./assets/textures/floor_c.jpg', repeat:[7,8] })
    g.material.normalMap = phy.texture({ url:'./assets/textures/floor_n.jpg', repeat:[7,8] })
    //g.material.roughnessMap = phy.texture({ url:'./assets/textures/floor_r.jpg', repeat:[7,8] })
    g.material.normalScale.set(-0.6,-0.6)
    g.material.visible = true

    g.material.needsUpdate = true


    ////

    let sofaModel = phy.getMesh('sofa');

    var sofaShape = []

    let k = 28
    while(k--){
        sofaShape.push( {type:'convex', shape: sofaModel['sofa_shape_'+k] } )
    }


    phy.add({
        type:'compound',
        shapes:sofaShape,
        //size:[1.654, 0.4,0.817 ],
        pos:[0,0,-2],
        mesh:sofaModel.sofa,
        material:'sofa',
        //meshPos:[0,0,0],
        //density:4,
        mass:80,
    })

    model = phy.getMesh('phy');
    let option = {
        density:0.1, restitution:0.5, friction:0.5, radius:0.03,
        gravityFactor:1
    }

    // add phy logo
    let sc = 0.01
    const logoShape = []
    let p = [0,0,0,31.685,16,0,-31.685,16,0,28.547,25.779,0,28.547,6.221,0,-28.547,25.779,0,-28.547,6.221,0,19.755,-1.621,
    0,7.051,-5.973,0,19.755,33.621,0,7.051,37.973,0,-19.755,-1.621,0,-7.051,-5.973,0,-21.92,32.371,0]
    let s = [8,86,8,8,13,8,8,13,8,8,13,8,8,13,8,8,13,8,8,13,8,8,14.5,8,8,15.5,8,8,14.5,8,8,15.5,8,8,14.5,8,8,15.5,8,8,9,8]
    let r = [0,0,0,0,0,0,0,0,0,0,0,35,0,0,-35,0,0,-35,0,0,35,0,0,-60,0,0,-80,0,0,60,0,0,80,0,0,60,0,0,80,0,0,-60]
    p = math.scaleArray(p,sc)
    s = math.scaleArray(s,sc)
    let i=14, j=0, n=0;
    while(i--){ n = j*3; logoShape.push({ type:'box', pos:[p[n],p[n+1],p[n+2]], size:[s[n],s[n+1],s[n+2]], rot:[r[n],r[n+1],r[n+2]] }); j++; }

    phy.add({
        type:'compound',
        shapes:logoShape,
        pos:[ 0, 0.8,0 ],
        mesh:model.logo,
        meshSize:1,
        mass:20,
        material:'glassX',
        ...option
    })

    // add some dynamics object

    //i = 20;
    let ar = []
    /*while( i-- ){
        
        let vx = math.rand( -0.02, 0.02 )
        let vz = math.rand( -0.02, 0.02 )

        let nb = math.randInt( 0, 5 )
        let nc = math.randInt( 0, 6 )
        // phy.add can be a array
        //ar.push({ instance:'A', type:'box', size:[1,0.2,1], pos:[0,5+(i*0.5),-2], ...option })
        if(nb) ar.push({ instance:'A', type:'box', size:[1,0.2,1], pos:[2,5+(i*0.5),-2], ...option })
        if(nc) ar.push({ instance:'A', type:'box', size:[1,0.2,1], pos:[-2,5+(i*0.5),-2], ...option })

    }

    phy.add(ar)*/

    i = 100;
    ar = []
    while( i-- ){
        ar.push({ 
            instance:'B', 
            mesh:sofaModel.baseball, 
            material:'baseball',
            type:'sphere', 
            size:[0.038], 
            mass:0.01,
            restitution:0.8,
            pos:[math.rand( -0.5, 0.5 ), math.rand( 5, 10 ), -2 + math.rand( -0.2, 0.2 )], 
            ...option 
        })
    }

    phy.add(ar)

    i = 10;
    ar = []
    while( i-- ){
        ar.push({ 
            instance:'C', 
            mesh:sofaModel.cardboard, 
            material:'cardboard',
            type:'box', 
            size:[0.38, 0.33,0.5], 
            pos:[math.rand( -0.5, 0.5 ), 2+ i*0.35, -3 + math.rand( -0.2, 0.2 )], 
            ...option 
        })
    }

    phy.add(ar)

}



makeMaterial = () => {

    phy.material({ name:'wall', color:0xFFFFFF, roughness: 1, metalness: 0, //color:0x8cc0e5,
        map:phy.texture({ url:'./assets/textures/stucco_c.jpg', repeat:[3,1.5], srgb:true }),
        //normalMap:phy.texture({ url:'./assets/textures/model/sofa_n.jpg' }),
        //roughnessMap:phy.texture({ url:'./assets/textures/model/sofa_r.jpg' }),
        roughness:0.88,
        normalScale:[0.3,-0.3],
    })

    phy.material({ name:'sofa', color:0xFFFFFF, roughness: 1, metalness: 0, 
        map:phy.texture({ url:'./assets/textures/model/sofa_c.jpg', srgb:true }),
        normalMap:phy.texture({ url:'./assets/textures/model/sofa_n.jpg' }),
        roughnessMap:phy.texture({ url:'./assets/textures/model/sofa_r.jpg' }),
        roughness:0.88,
        normalScale:[0.3,-0.3], 
    })

    phy.material({ name:'baseball', color:0xFFFFFF, roughness: 1, metalness: 0, 
        map:phy.texture({ url:'./assets/textures/model/baseball_c.jpg' }),
        normalMap:phy.texture({ url:'./assets/textures/model/baseball_n.jpg' }),
        roughnessMap:phy.texture({ url:'./assets/textures/model/baseball_r.jpg' }),
        //roughness:0.88,
        normalScale:[0.3,-0.3], 
    })

    phy.material({ name:'cardboard', color:0xFFFFFF, roughness: 1, metalness: 0, 
        map:phy.texture({ url:'./assets/textures/model/cardboard_c.jpg' }),
        normalMap:phy.texture({ url:'./assets/textures/model/cardboard_n.jpg' }),
        roughnessMap:phy.texture({ url:'./assets/textures/model/cardboard_r.jpg' }),
        //roughness:0.88,
        normalScale:[0.3,-0.3], 
    })

}