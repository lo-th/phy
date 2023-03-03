const debug = false;

demo = () => {

    phy.view({ 
        envmap:'clear', ground:true
    })

    phy.set({ substep:1, gravity:[0,-9.81,0] })

    phy.add({ type:'plane', size:[300,1,300], visible:false });

    phy.load(['./assets/models/spider.glb'], onComplete )

}

onComplete = () => {

    let pos = [0, 2, 0]

    const meshes = phy.getMesh('spider');

    let solver = phy.add({ type:'solver', name:'spider', iteration:32, fix:false, needData:true, neverSleep:true })

    //-----------------------------------------
    //    BONES
    //-----------------------------------------

    let def = {
        filter:[2,-1,1,0], dmv:[0.2,0.2,100,20], 
        debug:debug, meshSize:10,
    }

    phy.add({
        type:'box', name:'base', linked:'null', solver:'spider',
        pos:pos, size:[ 0.6, 0.15, 1.3 ], density:1,//1.28
        mesh:meshes.base,
        ...def
    });

    phy.add({
        type:'sphere', name:'top', linked:'base', solver:'spider',
        pos:math.vecAdd( pos, [0,0.2,0] ), size:[ 0.33 ], density:1,//1.28
        mesh:meshes.top,
        ...def
    });

    let i = 4
    const p = [
        [0.57, 0.055, -0.54],
        [0.57, 0.055, 0.54],
        [-0.57, 0.055, -0.54],
        [-0.57, 0.055, 0.54],
    ]

    const d = [
        [0.55, 0, 0],
        [0.55, 0, 0],
        [-0.55, 0,0],
        [-0.55, 0, 0],
    ]

    const e = [
        [1.836, -0.006, -0.54],
        [1.836, -0.006, 0.54],
        [-1.836, -0.006, -0.54],
        [-1.836, -0.006, 0.54],
    ]

    while(i--){

        phy.add({
            type:'box', name:'barm'+i, linked:'base', solver:'spider',
            size:[ 0.3496, 0.4, 0.4 ], localPos:[0.1252, 0, 0], 
            pos: math.vecAdd( pos, p[i] ), rot:[0,i>1? 180: 0,0], density:1,
            mesh:meshes.barm_001,
            ...def
        });

        phy.add({
            type:'box', name:'farm'+i, linked:'barm'+i, solver:'spider',
            size:[ 0.4, 0.22, 0.2 ], localPos:[0.095, 0, 0], 
            pos: math.vecAdd( math.vecAdd( pos, p[i] ), d[i]), rot:[0,i>1? 180: 0,0], density:1,
            mesh: i == 1 ? meshes.farm_002 : meshes.farm_001,
            ...def
        });

        phy.add({
            type:'sphere', name:'earm'+i, linked:'farm'+i, solver:'spider',
            size:[ 0.03 ], 
            pos:math.vecAdd( pos, e[i] ), rot:[0,i>1? 180: 0,0], density:1,
            mesh:meshes.earm_001,
            ...def
        });

    }

    //return


    //-----------------------------------------
    //    JOINT
    //-----------------------------------------

    const stiffness = 100000000;
    const damping = 0;
    const forceLimit = Infinity;
    const acceleration = false;
    const forceLimit2 = 100;

    solver.addJoint({
            name:'A'+i, bone:'top',
            pos1:[0, 0.2, 0], pos2:[ 0, 0, 0 ],
            type:'fixe',
    });

    i = 4

    while(i--){

        solver.addJoint({
            name:'A'+i, bone:'barm'+i,
            pos1:p[i], pos2:[ 0, 0, 0 ],
            type:'revolute',
            rot1: [0,i>1? 180: 0,0],
            limits: [['swing1', -90, 90 ]],
            drivesTarget: [['swing1', i==0 || i==3? 30 : -30 ]],
            drives: [['swing1', stiffness, damping, forceLimit, acceleration ]],
        });

        solver.addJoint({
            name:'A'+i, bone:'farm'+i,
            pos1:[0.55, 0, 0], pos2:[ 0, 0, 0 ],
            type:'revolute',
            limits: [['swing2', -120, 120 ]], //i>1? [['swing2', 90, 270 ]] : [['swing2', -90, 90 ]],
            drivesTarget:[['swing2', -75 ]],
            drives: [['swing2', stiffness, damping, forceLimit, acceleration ]],
        });

        solver.addJoint({
            name:'A'+i, bone:'earm'+i,
            pos1:[0.716, -0.0544, 0], pos2:[ 0, 0, 0 ],
            type:'fixe',
        });

    }

    //-----------------------------------------
    //    START
    //-----------------------------------------

    solver.start();

    //-----------------------------------------
    //    IK
    //-----------------------------------------

    solver.commonInit();


}