demo = () => {

    let bb = new THREE.DodecahedronGeometry(0.25)

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0] })

    // add static plane 
    phy.add({ type:'plane', visible:false })
    //phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    //phy.add({ type:'box', size:[1,1,1], pos:[0, 2, 0],  })
    let i = 200
    while(i--) {
        phy.add({ instance:'a1', type:'box', size:[0.5,0.5,0.5], rot:[0,45,0], pos:[-1, 5+i, 0], density:1 })
        phy.add({ instance:'a2', type:'sphere', size:[0.25], pos:[-0.5, 5+i, 0], density:1 })
        phy.add({ instance:'a3', type:'cylinder', size:[0.25,0.5], pos:[0, 5+i, 0], density:1 })
        phy.add({ instance:'a4', type:'capsule', size:[0.25,0.25], pos:[0.5, 5+i, 0], density:1 })
        phy.add({ instance:'a5', type:'convex', shape:bb, pos:[1, 5+i, 0], density:1 })
    }

}
