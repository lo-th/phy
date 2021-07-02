function demo() {

    // config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]})

    // add static plane
    //phy.add({ type:'plane', size:[300,1,300], visible:false })
    phy.add({ type:'box', size:[30,1,30], pos:[0, -0.5, 0], visible:false })

    // add stair
    let j = 20, n;
    while(j--){
        n = (j*3)*0.1;
        phy.add({ type:'box', size:[8,0.3,1], pos:[0,0.15+n,3-n*1.2], radius:0.02 , material:'sleep' })
    }

    // add ragdoll
    let i = 20
    while(i--) ragdoll({ pos:[math.rand(-3, 3), 10+i*2, -3] })

}

function ragdoll( o ){

    let headHeight = 0.3
    let upperBody = 0.35
    let lowerBody = 0.35
    let bodyRadius = 0.2
    let legRadius = 0.1
    let legInterval = 0.15
    let upperLeg = 0.5
    let lowerLeg = 0.5
    let armRadius = 0.075
    let upperArm = 0.35
    let lowerArm = 0.35

    const data = {
        head: { size:[ headHeight / 2 * 0.8, (headHeight / 2 * 0.2)*2], pos:[0, lowerBody + upperBody + bodyRadius + headHeight / 2, 0] },
        body1: { size:[bodyRadius, upperBody], pos:[0, lowerBody + upperBody / 2, 0] },
        body2: { size:[bodyRadius, lowerBody], pos:[0,  lowerBody / 2, 0] },
        legL1: { size:[legRadius, upperLeg], pos:[-legInterval, -upperLeg / 2 - legInterval, 0] },
        legL2: { size:[legRadius, lowerLeg], pos:[-legInterval, -upperLeg - lowerLeg / 2 - legInterval, 0] },
        legR1: { size:[legRadius, upperLeg], pos:[legInterval, -upperLeg / 2 - legInterval, 0] },
        legR2: { size:[legRadius, lowerLeg], pos:[legInterval, -upperLeg - lowerLeg / 2 - legInterval, 0] },
        armL1: { size:[armRadius, upperArm], pos:[-bodyRadius - upperArm / 2, lowerBody + upperBody, 0], rot:[0,0,90] },
        armL2: { size:[armRadius, lowerArm], pos:[-bodyRadius - upperArm - lowerArm / 2, lowerBody + upperBody, 0], rot:[0,0,90] },
        armR1: { size:[armRadius, upperArm], pos:[bodyRadius + upperArm / 2, lowerBody + upperBody, 0], rot:[0,0,90] },
        armR2: { size:[armRadius, lowerArm], pos:[bodyRadius + upperArm + lowerArm / 2, lowerBody + upperBody, 0], rot:[0,0,90] },
    }

    // ADD BODY

    const b = {}

    for( let n in data ){
        b[ n ] = phy.add({ 
            type:'capsule', 
            density:1, restitution:0.2, friction:0.5, 
            size:data[n].size, 
            pos:math.addArray( o.pos, data[n].pos ),
            rot:data[n].rot||[0,0,0], 
            material:'skin' 
         })
    }

    // BODY JOINT

    phy.add({ 
        type:'joint', mode:'ragdoll', 
        b1:b.body1, b2:b.head, 
        worldAnchor:math.addArray( o.pos, [0,  lowerBody + upperBody + bodyRadius, 0]), 
        worldTwistAxis:[0,1,0],
        worldSwingAxis:[1,0,0],
        maxSwing1:90, maxSwing2:70,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],
        visible:false,
    })

    phy.add({ 
        type:'joint', mode:'ragdoll', 
        b1:b.body1, b2:b.body2, 
        worldAnchor:math.addArray( o.pos, [0,  lowerBody, 0]), 
        worldTwistAxis:[0,1,0],
        worldSwingAxis:[1,0,0],
        maxSwing1:60, maxSwing2:45,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-45,45],
        visible:false,
    })

    // ARM JOINT

    phy.add({ 
        type:'joint', mode:'ragdoll', 
        b1:b.body1, b2:b.armL1, 
        worldAnchor:math.addArray( o.pos, [-bodyRadius, lowerBody + upperBody, 0]), 
        worldTwistAxis:[1,0,0],
        worldSwingAxis:[0,0,1],
        maxSwing1:90, maxSwing2:90,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],
        visible:false,
    })

    phy.add({ 
        type:'joint', mode:'ragdoll', 
        b1:b.body1, b2:b.armR1, 
        worldAnchor:math.addArray( o.pos, [bodyRadius, lowerBody + upperBody, 0]), 
        worldTwistAxis:[-1,0,0],
        worldSwingAxis:[0,0,1],
        maxSwing1:90, maxSwing2:90,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],
        visible:false,
    })

    phy.add({ 
        type:'joint', mode:'revolute', 
        b1:b.armL1, b2:b.armL2, 
        worldAnchor:math.addArray( o.pos, [-bodyRadius - upperArm, lowerBody + upperBody, 0]), 
        worldAxis:[0,1,0],
        lm:[0,160],
        sd:[10, 1],
        visible:false,
    })

    phy.add({ 
        type:'joint', mode:'revolute', 
        b1:b.armR1, b2:b.armR2, 
        worldAnchor:math.addArray( o.pos, [bodyRadius + upperArm, lowerBody + upperBody, 0]), 
        worldAxis:[0,-1,0],
        lm:[0,160],
        sd:[10, 1],
        visible:false,
    })


    // LEG JOINT

    phy.add({ 
        type:'joint', mode:'ragdoll', 
        b1:b.body2, b2:b.legL1, 
        worldAnchor:math.addArray( o.pos, [-legInterval, -legInterval, 0]), 
        worldTwistAxis:[0,1,0],
        worldSwingAxis:[1,0,0],
        axis1:[0,0,-1],
        maxSwing1:90, maxSwing2:70,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],
        visible:false,
    })


    phy.add({ 
        type:'joint', mode:'ragdoll', 
        b1:b.body2, b2:b.legR1, 
        worldAnchor:math.addArray( o.pos, [legInterval, -legInterval, 0]), 
        worldTwistAxis:[0,1,0],
        worldSwingAxis:[1,0,0],
        axis1:[0,0,-1],
        maxSwing1:90, maxSwing2:70,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],
        visible:false,
    })


    phy.add({ 
        type:'joint', mode:'revolute', 
        b1:b.legL1, b2:b.legL2, 
        worldAnchor:math.addArray( o.pos, [-legInterval, -legInterval - upperLeg, 0]), 
        worldAxis:[1,0,0],
        lm:[0,160],
        sd:[10, 1],
        visible:false,
    })

    phy.add({ 
        type:'joint', mode:'revolute', 
        b1:b.legR1, b2:b.legR2, 
        worldAnchor:math.addArray( o.pos, [legInterval, -legInterval - upperLeg, 0]), 
        worldAxis:[1,0,0],
        lm:[0,160],
        sd:[10, 1],
        visible:false,
    })

}