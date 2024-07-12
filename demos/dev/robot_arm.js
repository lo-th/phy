let solver = null;
const debug = false;

let movementCount = 0

const a_min = [-170, -135, -156, -185, -120, -350 ];
const a_max = [ 170,  100, 120, 105, 120, 350 ];
const anglular = { A1:0, A2:0, A3:0, A4:0, A5:0, A6:0, G:0 };
const angles = [ 0, 0, 0, 0, 0, 0, 0, 0 ];
let isAuto = false;

const angle = [
    [ -45, 45, -180, 90, -30, -120, 0, 0 ],
    [ 0, -40, -60, 0, -60, 90, -0.3, 0.3 ],
    // reach for cube
    [ 0, -76, -55, 0, -45, 0, -0.3, 0.3 ],
    // close gripper
    [ 0, -76, -55, 0, -45, 0, 0, 0 ],
    [ 0, -40, -60, 0, -60, 0, 0, 0 ],
    [ 90, 60, 45, 60, -30, 90, 0, 0 ],
    // rest pose
    [ -45, 45, -180, 90, -30, -120, 0, 0 ],

    // now in reverse
    // [ 90, 60, 45, 60, -30, 90, 0, 0 ],
    [ 0, -40, -60, 0, -60, 0, 0, 0 ],
    // place object
    [ 0, -76, -55, 0, -45, 0, 0, 0 ],
    // open gripper
    [ 0, -76, -55, 0, -45, 0, -0.3, 0.3 ],
    [ 0, -40, -60, 0, -60, 90, -0.3, 0.3 ],
    [ 0, -40, -60, 0, -60, 90, 0, 0 ],
    // final rest pose
    [ -45, 45, -180, 90, -30, -120, 0, 0 ],
];

demo = () => {

    phy.view({ 
        envmap:'clear', ground:true,
        phi:20, theta:20, distance:14, x:4, y:6, z:0, fov:70 
    })

    phy.set({ substep:1, gravity:[0,-9.81,0] })

    phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ pos:[10,0.25,0], rot:[0,0,0], size:[3.0,0.5,0.5], mass:1, //penetrationVelocity:3,
        friction:0.5//, enableCCD:true, speculativeCCD:true//, enableCCD_FRICTION:true, ccdMaxContact:0.001, 
    })

    phy.load(['./assets/models/kuka_arm.glb'], onComplete )

}

onComplete = () => {

    //const mats = phy.getMaterial('kuka_arm', true);
    const groups = phy.getGroup('kuka_arm', true, true );

    solver = phy.add({ type:'solver', name:'ARM', iteration:32, fix:true, needData:true });

    //-----------------------------------------
    //    BONES
    //-----------------------------------------

    phy.add({
        type:'box', name:'base', linked:'null', solver:'ARM',
        mesh:groups.base, meshSize:10, debug:debug,// material:mats,
        pos:[0, 0, 0], size:[ 2.1, 2.24, 2.1 ], localPos:[0, 1.12, 0], mass:15,
        filter:[2,-1,1,0], dmv:[0.2,0.2,100,20],
        ray:false
    });

    phy.add({
        type:'box', name:'axis_1', linked:'base', solver:'ARM',
        mesh:groups.axis_1, meshSize:10, debug:debug,// material:mats,
        pos:[0, 2.24, 0], size:[ 2.1, 2.62, 2.8 ], localPos:[0, 1.31, 0], mass:15,
        filter:[2,1,1,0], dmv:[0.2,0.2,100,20],
    });

    phy.add({
        type:'box', name:'axis_2',  linked:'axis_1', solver:'ARM',
        mesh:groups.axis_2, meshSize:10, debug:debug,// material:mats,
        pos:[0.25, 4, 0], size:[ 1.2, 5.6, 1.2 ], localPos:[0, 2.8, 0], mass:10,
        filter:[2,1,1,0], dmv:[0.2,0.2,100,20],
    });

    phy.add({
        type:'box', name:'axis_3', linked:'axis_2', solver:'ARM',
        mesh:groups.axis_3, meshSize:10, meshRot:[0,0,0], debug:debug,// material:mats,
        pos:[0.25, 9.6, 0], size:[ 1.2, 1.17, 1.9 ], localPos:[0, 0.585, 0], mass:4,
        filter:[2,1,1,0], dmv:[0.2,0.2,100,20],
    });

    phy.add({
        type:'box', name:'axis_4', linked:'axis_3', solver:'ARM',
        mesh:groups.axis_4, meshSize:10, debug:debug,// material:mats,
        pos:[-0.1, 10.77, 0], size:[ 1.2, 3.978, 1.2 ], localPos:[0, 1.989, 0], mass:6,
        filter:[2,1,1,0], dmv:[0.2,0.2,100,20],
    });

    phy.add({
        type:'box', name:'axis_5', linked:'axis_4', solver:'ARM',
        mesh:groups.axis_5, meshSize:10, debug:debug,// material:mats,
        pos:[-0.1, 14.75, 0], size:[ 0.6, 0.665, 0.6 ], localPos:[0, 0.3325, 0], mass:3,
        filter:[2,1,1,0], dmv:[0.2,0.2,100,20],
    });

    phy.add({
        type:'box', name:'axis_6', linked:'axis_5', solver:'ARM',
        mesh:groups.axis_6, meshSize:10, debug:debug,// material:mats,
        pos:[-0.1, 15.415, 0], size:[ 0.6, 1.135, 0.6 ], localPos:[0, 0.5675, 0], mass:2,
        filter:[2,1,1,0], dmv:[0.2,0.2,100,20],
    });

    // gripper

    phy.add({
        type:'box', name:'finger_2', linked:'axis_6', solver:'ARM',
        mesh:groups.finger_2, meshSize:10, meshRot:[0,0,0], debug:debug,// material:mats,
        pos:[-0.1, 16.55, 0], size:[ 0.2, 0.46, 0.1 ], localPos:[0, 0.23, 0.05], mass:1,
        filter:[2,1,1,0], dmv:[0.2,0.2,100,20],
        friction:0.5, 
        //enableCCD:true, speculativeCCD:true//, enableCCD_FRICTION:true, ccdMaxContact:0.001, 
        //penetrationVelocity:3,

    });

    phy.add({
        type:'box', name:'finger_1', linked:'axis_6', solver:'ARM',
        mesh:groups.finger_1, meshSize:10, meshRot:[0,0,0], debug:debug,// material:mats,
        pos:[-0.1, 16.55, 0], size:[ 0.2, 0.46, 0.1 ], localPos:[0, 0.23, -0.05], mass:1,
        filter:[2,1,1,0], dmv:[0.2,0.2,100,20],
        friction:0.5, 
        //enableCCD:true, speculativeCCD:true//, enableCCD_FRICTION:true, ccdMaxContact:0.001, 
        //penetrationVelocity:3,
    });


    //-----------------------------------------
    //    JOINT
    //-----------------------------------------

    const stiffness = 100000000;
    const damping = 0;
    const forceLimit = Infinity;
    const acceleration = false;
    const forceLimit2 = 100;

    solver.addJoint({
        name:'A1', bone:'axis_1',
        pos1:[0, 2.24, 0], pos2:[ 0, 0, 0 ],
        type:'revolute',
        limits:[['ry', -170, 170 ]],
        drives: [['ry', stiffness, damping, forceLimit, acceleration ]],
    });

    solver.addJoint({
        name:'A2', bone:'axis_2',
        pos1:[0.25, 1.76, 0], pos2:[ 0, 0, 0 ],// rot1:[0,90,0],
        type:'revolute',
        limits:[['rz', -135, 100 ]],
        drives: [['rz', stiffness, damping, forceLimit, acceleration ]],
    });

    solver.addJoint({
        name:'A3', bone:'axis_3',
        pos1:[0, 5.6, 0], pos2:[ 0, 0, 0 ],
        type:'revolute',
        limits:[['rz', -156, 120 ]],
        drives: [['rz', stiffness, damping, forceLimit, acceleration ]],
    });

    solver.addJoint({
        name:'A4', bone:'axis_4',
        pos1:[-0.35, 1.17, 0], pos2:[ 0, 0, 0 ],
        type:'revolute',
        limits:[['ry', -185, 185 ]],
        drives: [['ry', stiffness, damping, forceLimit, acceleration ]],
    });

    solver.addJoint({
        name:'A5', bone:'axis_5',
        pos1:[0, 3.978, 0], pos2:[ 0, 0, 0 ],
        type:'revolute',
        limits:[['rz', -120, 120 ]],
        drives: [['rz', stiffness, damping, forceLimit, acceleration ]],
    });

    solver.addJoint({
        name:'A6', bone:'axis_6',
        pos1:[0, 0.665, 0], pos2:[ 0, 0, 0 ],
        type:'revolute',
        limits:[['ry', -350, 350 ]],
        drives: [['ry', stiffness, damping, forceLimit, acceleration ]],
    });

    // gripper

    solver.addJoint({
        name:'A7',  bone:'finger_1',
        pos1:[0, 1.135, 0], pos2:[ 0, 0, 0 ],
        type:'prismatic',
        limits:[['z', -0.3, 0 ]],
        drives: [['z', stiffness, damping, forceLimit2, acceleration ]],
        //maxJointVelocity:1,
        frictionCoefficient:1,
    });

    solver.addJoint({
        name:'A8', bone:'finger_2',
        pos1:[0, 1.135, 0], pos2:[ 0, 0, 0 ],
        type:'prismatic',
        limits:[['z', 0, 0.3 ]],
        drives: [['z', stiffness, damping, forceLimit2, acceleration ]],
        //maxJointVelocity:1,
        frictionCoefficient:1,
    });

    //-----------------------------------------
    //    START
    //-----------------------------------------

    solver.start();

    //-----------------------------------------
    //    ID Inverse Dynamics Computations
    //-----------------------------------------

    //solver.commonInit();


    //-----------------------------------------
    //    DRIVE ANGLE
    //-----------------------------------------

    //solver.setAngles([ 0, -40, -60, 0, -60, 90, 0, 0 ], 1 ).then(() => console.log("done"));

    //setTimeout( () => solver.setAngles([ 90, 60, 45, 0, -30, 90, -0.3, 0.3 ], 1 ), 1000 );
    //solver.setAngles([ 0, -40, -60, 0, -60, 90, -0.3, 0.3 ], 2 ).then(() => console.log("done"))

    //-----------------------------------------
    //    UPDATE
    //-----------------------------------------

    phy.setPostUpdate( update )

    // phy intern timeout
    phy.setTimeout( function(){ autoCommand() }, 1000 )

}

update = ( dt ) => {

    /*if( isAuto ){

        anglular.A1 = solver.joints[0].data.target.swing1;
        anglular.A2 = solver.joints[1].data.target.swing2;
        anglular.A3 = solver.joints[2].data.target.swing2;
        anglular.A4 = solver.joints[3].data.target.swing1;
        anglular.A5 = solver.joints[4].data.target.swing2;
        anglular.A6 = solver.joints[5].data.target.swing1;

        anglular.G = (solver.joints[7].data.target.z*10)/3;

    }*/

    solver.driveJoints( dt );

    //solver.driveJoints( 0.016 );
}

autoCommand = ( n = 0, time = 1.0 ) => {

    if( n === angle.length ){
        console.log('complete')
        isAuto = false;
        movementCount = 0
        phy.setTimeout( function(){ autoCommand() }, 1000 )
        return;
    }

    isAuto = true;

    solver.setAngles( angle[n], time ).then(() => autoCommand( movementCount++ ) );

}