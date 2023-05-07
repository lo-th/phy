demo = () => {

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0] })

    // add static ground
    phy.add({ type:'plane', name:'floor', size:[300,1,300], visible:false })


    createBoard(0, 4, 0, [-45,45], [2, 0.3] );
    createBoard(0, 6, 0, [0,360], []);
    //createBoard(0, 6, 0, [360,360*4], []);

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
       collision:true,
       noFix:true,
    })

  /*  phy.add({ type:'ray' })
    phy.add({ type:'ray', begin:[1,4,0], end:[1,0.1,0] })*/
    //phy.add({ type:'ray', begin:[-1,4,0], end:[-1,0.1,0] })
    //phy.add({ type:'ray', begin:[-0.6,0,0.3], end:[-3,0,0.3], parent:'box' })
    

}

createBoard = (x, y, z, lm, sd) => {

    let b1 = phy.add({ type:'box', size:[0.2, 0.2, 0.2], pos:[x, y, z],  density:0, material:'debug' })
    let b2 = phy.add({ type:'box', size:[1, 0.4, 0.8], pos:[x + 0.5, y, z], rot:[0,90,0], density:1, radius:0.01 }) //OimoUtil.addBox(world, new Vec3(x + 0.5, y, z), new Vec3(0.5, 0.2, 0.4), false);

    phy.add({ 
        type:'joint', mode:'revolute', b1:b1, b2:b2, worldAnchor:[x, y, z], worldAxis:[0,0,1], lm:lm, //sd:sd, 
    })
    //OimoUtil.addRevoluteJoint(world, b1, b2, new Vec3(x, y, z), new Vec3(0, 0, 1), sd, lm);
}