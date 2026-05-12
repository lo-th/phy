const numRagdoll = 100
const debug = false

demo = () => {

    phy.view({ envmap:'bed', ground:true, distance:debug?4:12 })

    // config physics setting
    phy.set( {substep:1, gravity:[0,debug? 0: -9.81,0]})

    // add static ground plane
    //phy.add({ type:'plane', size:[300,1,300], visible:false })
    phy.add({ type:'box', size:[30,1,30], pos:[0, -0.5, 0], visible:false })

    

    if(debug){
        ragdoll({ pos:[0, 2, 0] })
    } else {
        // add stair
        let j = 20, n;
        while(j--){
            n = (j*3)*0.1;
            phy.add({  type:'box', size:[8,0.3,1], pos:[0,0.15+n,3-n*1.2], radius:0.02, instance:'stair', ray:false })
        }

        // add some wall
        phy.add({ type:'box', size:[0.5,3,5], pos:[4.25,1.5,1.6], radius:0.02, ray:false })
        phy.add({ type:'box', size:[0.5,3,5], pos:[-4.25,1.5,1.6], radius:0.02, ray:false })
        phy.add({ type:'box', size:[0.5,3,5], pos:[0,1.5,1.6], radius:0.02, ray:false })

        // add ragdoll
        let i = numRagdoll
        while(i--) ragdoll({ pos:[math.rand(-3, 3), 10+i, -3] })
    }
    
}

ragdoll = ( o ) => {

    let s = 0.6

    let headHeight = 0.3*s
    let upperBody = 0.35*s
    let lowerBody = 0.35*s
    let bodyRadius = 0.2*s
    let legRadius = 0.1*s
    let legInterval = 0.15*s
    let upperLeg = 0.5*s
    let lowerLeg = 0.5*s
    let armRadius = 0.075*s
    let upperArm = 0.35*s
    let lowerArm = 0.35*s
    //let dc = 0.

    const instanced = {
        head:'head',
        body1: 'body1',
        body2: 'body2',
        legL1: 'leg1',
        legL2: 'leg1',
        legR1: 'leg1',
        legR2: 'leg1',
        armL1: 'arm1',
        armL2: 'arm1',
        armR1: 'arm1',
        armR2: 'arm1',
    }

    const data = {
        head: { size:[ headHeight / 2 * 0.8, (headHeight / 2 * 0.2)*2], pos:[0, lowerBody + upperBody + bodyRadius + headHeight / 2, 0] },
        //body1: { size:[bodyRadius, upperBody], pos:[0, lowerBody + upperBody / 2, 0] },
        //body2: { size:[bodyRadius, lowerBody], pos:[0, lowerBody / 2, 0] },
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

    /*upperLeg*=0.9
    lowerLeg*=0.9
    lowerArm*=0.9
    upperArm*=0.9*/

    const dataP = {
        head: { size:[ headHeight / 2 * 0.8, (headHeight / 2 * 0.2)*2], pos:[0, lowerBody + upperBody + bodyRadius + headHeight / 2, 0] },
        body1: { size:[bodyRadius, upperBody-bodyRadius], pos:[0,  lowerBody + upperBody / 2, 0] },
        body2: { size:[bodyRadius, lowerBody-bodyRadius], pos:[0,  lowerBody / 2, 0] },
        legL1: { size:[legRadius, upperLeg-legRadius*2], pos:[-legInterval, -upperLeg / 2 - legInterval, 0] },
        legL2: { size:[legRadius, lowerLeg-legRadius*2], pos:[-legInterval, -upperLeg - lowerLeg / 2 - legInterval, 0] },
        legR1: { size:[legRadius, upperLeg-legRadius*2], pos:[legInterval, -upperLeg / 2 - legInterval, 0] },
        legR2: { size:[legRadius, lowerLeg-legRadius*2], pos:[legInterval, -upperLeg - lowerLeg / 2 - legInterval, 0] },
        armL1: { size:[armRadius, upperArm-armRadius*2], pos:[-bodyRadius - upperArm / 2, lowerBody + upperBody, 0], rot:[0,0,90] },
        armL2: { size:[armRadius, lowerArm-armRadius*2], pos:[-bodyRadius - upperArm - lowerArm / 2, lowerBody + upperBody, 0], rot:[0,0,90] },
        armR1: { size:[armRadius, upperArm-armRadius*2], pos:[bodyRadius + upperArm / 2, lowerBody + upperBody, 0], rot:[0,0,90] },
        armR2: { size:[armRadius, lowerArm-armRadius*2], pos:[bodyRadius + upperArm + lowerArm / 2, lowerBody + upperBody, 0], rot:[0,0,90] },
    }

    // ADD BODY

    const b = {}

    for( let n in data ){
        b[ n ] = phy.add({ 
            instance:instanced[n],
            type:'capsule', 
            mass:1,
            //density:0.1, 
            restitution:0.1, friction:0.4, 
            phySize:dataP[n].size, 
            phyPos:math.addArray( o.pos, dataP[n].pos ),
            size: debug ? dataP[n].size : data[n].size, 
            pos:math.addArray( o.pos, data[n].pos ),
            rot:data[n].rot||[0,0,0],
            material:debug? 'debug':'skinny' 
         })

    }


    const defJoint = {
        type:'joint', 
        visible:debug, 
        collision:true
    }

    // BODY JOINT

    phy.add({ 
        ...defJoint,
        mode:'ragdoll', 
        b1:b.body1, b2:b.head, 
        worldAnchor:math.addArray( o.pos, [0,  lowerBody + upperBody + bodyRadius, 0]), 
        worldTwistAxis:[0,1,0],
        worldSwingAxis:[1,0,0],
        /*maxSwing1:90, maxSwing2:70,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],
        swingLimit:[90,90, 10,1],*/
        lm:[ ['twist', -90, 90], ['swing1', -90, 90], ['swing2', -70, 70] ],

        
    })

    phy.add({ 
        ...defJoint,
        mode:'ragdoll', 
        b1:b.body1, b2:b.body2, 
        worldAnchor:math.addArray( o.pos, [0, lowerBody, 0]), 
        worldTwistAxis:[0,1,0],
        worldSwingAxis:[1,0,0],
        /*maxSwing1:60, maxSwing2:45,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-45,45],
        swingLimit:[90,90, 10,1],*/
        lm:[ ['twist', -45, 45], ['swing1', -60, 60], ['swing2', -45, 45] ],
        collision:false
    })

    // ARM JOINT

    phy.add({ 
        ...defJoint,
        mode:'ragdoll', 
        b1:b.body1, b2:b.armL1, 
        worldAnchor:math.addArray( o.pos, [-bodyRadius, lowerBody + upperBody, 0]), 

        worldTwistAxis:[1,0,0],
        worldSwingAxis:[0,0,1],
        maxSwing1:90, maxSwing2:90,
        /*swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],
        swingLm: [ 90, 90 ],*/
        lm:[ ['twist', -90, 90], ['swing1', -90, 90], ['swing2', -90, 90] ],
    })

    phy.add({ 
        ...defJoint,
        mode:'ragdoll', 
        b1:b.body1, b2:b.armR1, 
        worldAnchor:math.addArray( o.pos, [bodyRadius, lowerBody + upperBody, 0]), 
        worldTwistAxis:[-1,0,0],
        worldSwingAxis:[0,0,1],
        /*maxSwing1:90, maxSwing2:90,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],*/
        lm:[ ['twist', -90, 90], ['swing1', -90, 90], ['swing2', -90, 90] ],
    })

    // FOR ARM JOINT

    phy.add({ 
        ...defJoint,
        mode:'revolute', 
        b1:b.armL1, b2:b.armL2, 
        worldAnchor:math.addArray( o.pos, [-bodyRadius - upperArm, lowerBody + upperBody, 0]), 
        worldAxis:[0,1,0],
        lm:[0,90],
        sd:[10, 1],
    })

    phy.add({ 
        ...defJoint, 
        mode:'revolute', 
        b1:b.armR1, b2:b.armR2, 
        worldAnchor:math.addArray( o.pos, [bodyRadius + upperArm, lowerBody + upperBody, 0]), 
        worldAxis:[0,-1,0],
        lm:[0,90],
        sd:[10, 1],
    })



    // LEG JOINT

    phy.add({ 
        ...defJoint,
        mode:'ragdoll', 
        b1:b.body2, b2:b.legL1, 
        worldAnchor:math.addArray( o.pos, [-legInterval, -legInterval, 0]), 
        worldTwistAxis:[0,1,0],
        worldSwingAxis:[1,0,0],
        //axis1:[0,0,-1],
        /*maxSwing1:90, maxSwing2:70,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],*/

        lm:[ ['twist', -90, 90], ['swing1', -90, 90], ['swing2', -70, 70] ],
    })


    phy.add({ 
        ...defJoint,
        mode:'ragdoll', 
        b1:b.body2, b2:b.legR1, 
        worldAnchor:math.addArray( o.pos, [legInterval, -legInterval, 0]), 
        worldTwistAxis:[0,1,0],
        worldSwingAxis:[1,0,0],
        //axis1:[0,0,-1],
        /*maxSwing1:90, maxSwing2:70,
        swingSd:[10, 1],
        twistSd:[10, 1],
        twistLm:[-90,90],*/
        lm:[ ['twist', -90, 90], ['swing1', -20, 20], ['swing2', -20, 20] ],
    })


    phy.add({ 
        ...defJoint,
        mode:'revolute', 
        b1:b.legL1, b2:b.legL2, 
        worldAnchor:math.addArray( o.pos, [-legInterval, -legInterval - upperLeg, 0]), 
        worldAxis:[1,0,0],
        lm:[1,100],
    })

    phy.add({ 
        ...defJoint,
        mode:'revolute', 
        b1:b.legR1, b2:b.legR2, 
        worldAnchor:math.addArray( o.pos, [legInterval, -legInterval - upperLeg, 0]), 
        worldA1xis:[1,0,0],
        lm:[1,100],
    })

}