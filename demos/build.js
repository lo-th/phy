demo = () => {

    phy.view({ envmap:'basic' })

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0]  })

    // add static plane 
    phy.add({ type:'plane', visible:false })
    //phy.add({ type:'box', size:[300,10,300], pos:[0, -5, 0], visible:false })

}