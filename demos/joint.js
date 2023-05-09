demo = () => {

    let b1, b2, pos, length

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0] })

    // add static ground
    phy.add({ type:'plane', name:'floor', size:[300,1,300], visible:false })

    createBallChain([-2, 5, -2], 0.4, 7);
    createHingeChain([2, 5, -2], 0.3, 7, [0, 0, 1]);


    createBoard(0, 4, 0, [-45,45], [2, 0.3] );
    createBoard(0, 6, 0, [-180,180], []);
    //createBoard(0, 6, 0, [360,360*4], []);

    // add dynamic sphere
    b1 = phy.add({ type:'sphere', size:[0.5], pos:[-2,1,0], density:1, restitution:0.5, friction:0.9, radius:0.05 })
    b2 = phy.add({ type:'box', size:[1,1,1], pos:[ 2,1,0], density:1, restitution:0.5, friction:0.9, radius:0.05 })

    // add simple joint
    //phy.add({ type:'joint', mode:'ragdoll', b1:'box1', b2:'box2', pos1:[1,0,0], pos2:[-1,0,0], sd:[10, 1] })
    phy.add({ 
        type:'joint', mode:'d6', b1:b1, b2:b2, pos1:[1,0,0], pos2:[-1,0,0], 

        axis1:[1,0,0], axis2:[1,0,0],
        
        // limite : down / up
        lm:[['x', 0, 2], ['rx', -180, 180 ] ],
        // sring: frequency / dampingRatio 
        //sd:[ ['x', 0.5, 0.1] ],
        // motor: speed / torque 
      // motor:[ ['rx', 6, 6] ],
       collision:true,
       noFix:true,
    })





    // prismatic 
    pos = [2,5,1]
    b1 = phy.add({ type:'sphere', size:[0.1], pos:pos, density:0, material:'debug' })
    b2 = phy.add({ type:'box', size:[0.6,1,1], pos:pos, density:1 })
    phy.add({ type:'joint', mode:'prismatic', b1:b1, b2:b2, lm:[-1,1], worldPos:pos, worldAxis:[1,1,0] })

    // Cylindrical // slider
    pos = [-2,5,1]
    b1 = phy.add({ type:'sphere', size:[0.1], pos:pos, density:0, material:'debug' })
    b2 = phy.add({ type:'box', size:[0.6,1,1], pos:[ pos[0] - 0.31,pos[1],pos[2] ], density:1 })
    phy.add({ type:'joint', mode:'cylindrical', b1:b1, b2:b2, lm:[-1,1], lmr:[-180,180], sd:[4,0.7], sdr:[0,0], worldPos:pos, worldAxis:[1,0,0] })


    // ragdoll
    pos = [-2,3,3]
    length = 1.0;
    b1 = phy.add({ type:'box', size:[0.4], pos:[ pos[0],pos[1]+length,pos[2] ], density:0, kinematic:true, angularVelocity:[0,1.5,0], material:'debug' })
    b2 = phy.add({ type:'box', size:[0.4,1,0.4], pos:[ pos[0],pos[1]-length,pos[2] ], density:1 })
    phy.add({ 
        type:'joint', mode:'ragdoll', b1:b1, b2:b2, 
        lmp:[-1,1], lmr:[-180,180], sdp:[4,0.7], sdr:[0,0], worldPos:pos, worldAxis:[0,0,1],

        lm:[  ['ry',-90*0.4, 90*0.4],  ['rz',-90*0.4, 90*0.4]], 
    })

    // Universal // two degrees of freedom
    pos = [2,3,3]
    length = 1.0;
    b1 = phy.add({ type:'box', size:[0.4], pos:[ pos[0],pos[1]+length,pos[2] ], density:0, kinematic:true, angularVelocity:[0,1.5,0], material:'debug' })
    b2 = phy.add({ type:'box', size:[0.4,1,0.4], pos:[ pos[0],pos[1]-length,pos[2] ], density:1 })
    phy.add({ 
        type:'joint', mode:'universal', b1:b1, b2:b2, 
        worldPos:pos, 
        worldAxis:[1,0,0], worldAxis2:[0,0,1],

        lm1:[-90*0.5, 90*0.5 ],
        lm2:[-90*0.8, 90*0.8 ],

        lm:[  ['ry',-90*0.4, 90*0.4],  ['rz',-90*0.4, 90*0.4]],

    })

    // Generic // six degrees of freedom
    /*pos = [0,3,3]
    length = 1.0;
    b1 = phy.add({ type:'box', size:[0.4], pos:[ pos[0],pos[1]+length,pos[2] ], density:0, kinematic:true, angularVelocity:[0,1.5,0], material:'debug' })
    b2 = phy.add({ type:'box', size:[0.4,1,0.4], pos:[ pos[0],pos[1]-length,pos[2] ], density:1 })
    phy.add({ type:'joint', mode:'generic', b1:b1, b2:b2, 
        lm:[['x',-0.2, 0.2], ['y',-0.3, 0], ['z',-0.2, 0.8], ['rx',-90*0.4, 90*0.4], ['ry',-90*0.2, 90*0.2], ['rz',-90+0.8, -90+0.8]], 
        //sd:[4,0.7], 
        worldPos:pos, worldAxis:[0,1,0] 
    })*/


}

createBoard = ( x, y, z, lm, sd ) => {

    let b1 = phy.add({ type:'box', size:[0.2, 0.2, 0.2], pos:[x, y, z],  density:0, material:'debug' })
    let b2 = phy.add({ type:'box', size:[1, 0.4, 0.8], pos:[x + 0.5, y, z], rot:[0,90,0], density:1, radius:0.01 }) 
    phy.add({ type:'joint', mode:'revolute', b1:b1, b2:b2, worldPos:[x, y, z], worldAxis:[0,0,1], lm:lm })

}

createBallChain = ( from, radius, num ) => {

    let b1 = phy.add({ type:'sphere', size:[radius  * 0.9], pos:from,  density:0, material:'debug' })
    let i = num, b2, y = from[1]

    while(i--){
        y += radius * 2
        if(i===0){
            from[0]+= math.rand(-0.001, 0.001)
            from[2]+= math.rand(-0.001, 0.001)
        }
        b2 = phy.add({ type:'sphere', size:[radius * 0.9], pos:[from[0], y, from[2]],  density:1 })
        if(i===num-1) phy.add({ type:'joint', mode:'spherical', b1:b1, b2:b2, pos1:[0,0,0], pos2:[0,-radius*2,0] })
        else phy.add({ type:'joint', mode:'spherical', b1:b1, b2:b2, pos1:[0,radius,0], pos2:[0,-radius,0] })
        b1 = b2
    }

}

createHingeChain = ( from, radius, num, axis  ) => {
    let b1 = phy.add({ type:'box', size:[radius*2], pos:from,  density:0, material:'debug' })
    let i = num, b2, y = from[1]

    while(i--){
        y += radius * 2
        if(i===0){
            from[0]+= math.rand(-0.001, 0.001)
            from[2]+= math.rand(-0.001, 0.001)
        }
        b2 = phy.add({ type:'box', size:[radius, radius * 0.9 *2, radius * 0.9*2], pos:[from[0], y, from[2]],  density:1 })
        if(i===num-1) phy.add({ type:'joint', mode:'revolute', b1:b1, b2:b2, pos1:[0,0,0], pos2:[0,-radius*2,0] })
        else phy.add({ type:'joint', mode:'revolute', b1:b1, b2:b2, pos1:[0,radius,0], pos2:[0,-radius,0] })
        b1 = b2
    }
}