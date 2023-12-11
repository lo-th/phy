demo = () => {

    let b1, b2, pos, length;

    // view setting
    phy.view({ envmap:'box', envblur: 0.5 });

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0], jointVisible:true });

    // add static ground
    phy.add({ type:'plane', name:'floor', size:[50,1,50], visible:false });

    let g = phy.getGround()
    g.material.map = phy.texture({ url:'./assets/textures/grid.png', repeat:[60,60] });


    // size test
    //phy.add({ type:'box', size:[0.2,0.2,0.2], pos:[0,0.1,3], mass:1, restitution:0.5, friction:0.9 })
    //phy.add({ type:'box', size:[0.1,0.1,0.1], pos:[0.3,0.05,3], mass:1, restitution:0.5, friction:0.9 })
    //phy.add({ type:'box', size:[0.01,0.01,0.01], pos:[0.4,0.05,3], mass:1, restitution:0.5, friction:0.9 })

    createBallChain([-2, 5, -2], 0.3, 7);
    createHingeChain([2, 5, -2], 0.3, 7, [0, 0, 1]);

    createBoard( 0, 4, 0, [-45,70], [20, 1] );
    createBoard( 0, 6, 0, [-180,180], []);

    //return

    // Generic joint 6 dof
    b1 = phy.add({ type:'sphere', size:[0.5], pos:[-2,0.5,0], density:1, restitution:0.5, friction:0.9, radius:0.05 });
    b2 = phy.add({ type:'box', size:[1,1,1], pos:[ 2,0.5,0], density:1, restitution:0.5, friction:0.9, radius:0.05 });
    phy.add({ type:'generic', b1:b1, b2:b2, pos1:[1,0,0], pos2:[-1,0,0], limit:[['x', 0, 2], ['rx', -180, 180 ] ], collision:true });

    // Distance joint OIMO / AMMO don't have good suport
    b1 = phy.add({ type:'sphere', size:[0.25], pos:[-2,0.25,2], mass:1, restitution:0.5, friction:0.9 });
    b2 = phy.add({ type:'sphere', size:[0.25], pos:[ 2,0.25,2], mass:1, restitution:0.5, friction:0.9 });
    phy.add({ type:'distance', b1:b1, b2:b2, limit:[1, 4], spring:[10,1], collision:true, });

    // Prismatic joint
    pos = [2,5,1];
    b1 = phy.add({ type:'sphere', size:[0.03], pos:pos, density:0 });
    b2 = phy.add({ type:'box', size:[0.6,1,1], pos:pos, density:1, radius:0.02 });
    phy.add({ type:'prismatic', b1:b1, b2:b2, lm:[-1,1], worldPos:pos, worldAxis:[0,1,0] });

    // Cylindrical joint
    pos = [-2,5,1];
    b1 = phy.add({ type:'sphere', size:[0.03], pos:pos, density:0 });
    b2 = phy.add({ type:'box', size:[0.6,1,1], pos:[ pos[0] - 0.31, pos[1], pos[2] ], density:1, radius:0.02 });
    phy.add({ type:'cylindrical', b1:b1, b2:b2, lm:[-1,1], lmr:[-145,145], sd:[4,0.7], sdr:[0,0], worldPos:pos, worldAxis:[1,0,0] });


    // ragdoll joint
    pos = [-2,3,3]
    length = 1.0;
    b1 = phy.add({ type:'box', size:[0.4], pos:[ pos[0],pos[1]+length,pos[2] ], density:0, kinematic:true, angularVelocity:[0,1.5,0], material:'debug' })
    b2 = phy.add({ type:'box', size:[0.4,1,0.4], pos:[ pos[0],pos[1]-length,pos[2] ], density:1 })
    phy.add({ 
        type:'joint', mode:'ragdoll', b1:b1, b2:b2, worldPos:pos, worldAxis:[0,0,1],
        lmp:[-1,1], lmr:[-180,180], sdp:[4,0.7], sdr:[0,0], 
        lm:[  ['ry',-90, 90],  ['rz',-60, 60],  ['rx',-40, 40]], 
    })

    // Universal // two degrees of freedom
    pos = [2,3,3]
    length = 1.0;
    b1 = phy.add({ type:'box', size:[0.4], pos:[ pos[0],pos[1]+length,pos[2] ], density:0, kinematic:true, angularVelocity:[0,1.5,0], material:'debug' })
    b2 = phy.add({ type:'box', size:[0.4,1,0.4], pos:[ pos[0],pos[1]-length,pos[2] ], density:1 })
    phy.add({ 
        type:'generic', b1:b1, b2:b2, 
        worldPos:pos,  worldAxis:[1,0,0], worldAxis2:[0,0,1],

        lm1:[-90*0.5, 90*0.5 ],
        lm2:[-90*0.8, 90*0.8 ],

        lm:[  ['ry',-90*0.4, 90*0.4],  ['rz',-90*0.4, 90*0.4]],

    })

}

createBoard = ( x, y, z, lm, sd ) => {
    let b1 = phy.add({ type:'sphere', size:[0.03], pos:[x, y, z],  density:0 })
    let b2 = phy.add({ type:'box', size:[1, 0.4, 0.8], pos:[x + 0.5, y, z], rot:[0,90,0], density:1, radius:0.02 }) 
    phy.add({ type:'hinge', b1:b1, b2:b2, worldPos:[x, y, z], worldAxis:[0,0,1], lm:[...lm, ...sd] })

}

createBallChain = ( from, radius, num ) => {

    let b1 = phy.add({ type:'sphere', size:[0.03], pos:from,  density:0 })
    let i = num, b2, y = from[1]

    while(i--){
        y += radius * 2
        if(i===0){
            from[0]+= math.rand(-0.001, 0.001)
            from[2]+= math.rand(-0.001, 0.001)
        }
        b2 = phy.add({ type:'sphere', size:[radius * 0.9], pos:[from[0], y, from[2]],  density:1 })
        if(i===num-1) phy.add({ type:'spherical', b1:b1, b2:b2, pos1:[0,0,0], pos2:[0,-radius*2,0] })
        else phy.add({ type:'spherical', b1:b1, b2:b2, pos1:[0,radius,0], pos2:[0,-radius,0] })
        b1 = b2
    }

}

createHingeChain = ( from, radius, num, axis  ) => {
    let b1 = phy.add({ type:'sphere', size:[0.03], pos:from, density:0 })
    let i = num, b2, y = from[1]

    while(i--){
        y += radius * 2
        if(i===0){
            from[0]+= math.rand(-0.001, 0.001)
            from[2]+= math.rand(-0.001, 0.001)
        }
        b2 = phy.add({ type:'box', size:[radius, radius * 0.9 *2, radius * 0.9*2], pos:[from[0], y, from[2]], density:1, radius:0.02 })
        if(i===num-1) phy.add({ type:'joint', mode:'hinge', b1:b1, b2:b2, pos1:[0,0,0], pos2:[0,-radius*2,0], worldAxis:axis })
        else phy.add({ type:'hinge', b1:b1, b2:b2, pos1:[0,radius,0], pos2:[0,-radius,0], worldAxis:axis, lm:[-120,120] })
        b1 = b2
    }
}