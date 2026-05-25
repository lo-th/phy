demo = () => {

    phy.view({
        phi:12, theta:0, distance:5, x:0, y:1, z:0, fov:55, 
        envmap:'swiss', exposure:0.5, fog:true, fogExp:0.05, envIntensity:2.5,
        reflect:0, groundColor:0x505050, 
    })

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0] })

    let g = phy.getGround();
    g.material.map = phy.texture({ url:'./assets/textures/grid2.png', repeat:[60,60], offset:[0.5,0.5], anisotropy:4 });
    g.material.normalMap = phy.texture({ url:'./assets/textures/grid_n.png', repeat:[60,60], offset:[0.5,0.5], anisotropy:4 });
    g.material.normalScale.set(0.1,-0.1)
    g.material.roughness = 0.8;
    g.material.metalness = 0;

    // add static ground
    //phy.add({ type:'plane', size:[300,1,300], visible:false })
    phy.add({ type:'box', size:[300,1,300], pos:[0,-0.5,0], visible:false })

    phy.add({ type:'sphere', size:[0.2], pos:[1,0.2,0], mass:1 })
    phy.add({ type:'box', size:[0.2, 0.2, 0.2], pos:[-1,0.2,0], mass:1 })

    const h = phy.add({

        type: 'character',
        name: 'hero',
        
        radius: 0.3,
        pos: [0,3,0],
        mass:1,
        angle:0,
        useImpulse:true,
        floating:true,
        isPlayer:true,

    });

}