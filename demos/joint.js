function demo() {

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0] })

    // add static ground
    phy.add({ type:'plane', name:'floor', size:[300,1,300], visible:false })

    // add dynamic sphere
    phy.add({ type:'sphere', name:'sphere', size:[0.5], pos:[-5,2,0], density:1, restitution:0.5, friction:0.9, radius:0.05 })
    phy.add({ name:'box', size:[1,1,1], pos:[ 5,2,0], density:1, restitution:0.5, friction:0.9, radius:0.05 })

    // add simple joint
    //phy.add({ type:'joint', mode:'ragdoll', b1:'box1', b2:'box2', pos1:[1,0,0], pos2:[-1,0,0], sd:[10, 1] })
    phy.add({ 
        type:'joint', mode:'d6', b1:'sphere', b2:'box', pos1:[1,0,0], pos2:[-1,0,0], 
        
        // limite : down / up
        lm:[['x', 0, 2], ['rx', -180, 180 ] ],
        // sring: frequency / dampingRatio 
        //sd:[ ['x', 0.5, 0.1] ],
        // motor: speed / torque 
       //motor:[ ['rx', 6, 6] ],
       collision:true
    })

  /*  phy.add({ type:'ray' })
    phy.add({ type:'ray', begin:[1,4,0], end:[1,0.1,0] })*/
    phy.add({ type:'ray', begin:[-1,4,0], end:[-1,0.1,0] })

    phy.add({ type:'ray', begin:[-0.6,0,0.3], end:[-3,0,0.3], parent:'box' })
    

}