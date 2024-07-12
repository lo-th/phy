const setting = {
body5:10
}

demo = () => {



    phy.view({
        distance:30
    })

    phy.set( {
        substep:1, 
        gravity:[0,-9.81,0]
    })

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false, friction:0, restitution:0 })
    // add static box
    phy.add({ type:'box', size:[4,4,12], pos:[-12,2,0], friction:0, restitution:1 })
    phy.add({ type:'box', size:[4,4,12], pos:[12,2,0], friction:0, restitution:1 })

    const dt = {
        type:'box',
        massInfo : true,
        angularFactor:[0,0,0], 
        //inertia:[0,0,0],
        friction:0, 
        restitution:1,
    }

    phy.add({ ...dt, size:[1,1,1], pos:[-0.5,0.5,-3.5], mass:1  })
    phy.add({ ...dt, size:[2,2,2], pos:[8,1,-3.5]     , mass:1, impulse:[-10,0,0]  })

    phy.add({ ...dt, size:[1,1,1], pos:[-0.5,0.5,-0.5], density:1  })
    phy.add({ ...dt, size:[2,2,2], pos:[8,1,-0.5]     , density:1/8, impulse:[-10,0,0] })

    phy.add({ ...dt, size:[1,1,1], pos:[-0.5,0.5,2.5], mass:10  })
    phy.add({ ...dt, size:[2,2,2], pos:[8,1,2.5]     , mass:10, impulse:[-100,0,0] })

    addGui()

}

const addGui = () => {
    const gui = phy.gui();
    gui.add( setting, 'body5', { min:0, max:100 } ).onChange( (v)=>{ phy.change({ name:'body5', mass:v }) } )
}