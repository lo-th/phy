var motorJoint, jointTest;

function demo() {

    //phy.moveCam({ h:0, v:30, d:40, target:[10,10,0] });

    phy.set({

        filter:'default',
        fps:60,
        substep:2,
        gravity:[0,-10,0],
        fixed: true,

    })

    phy.add({ type:'plane', friction: 0.5, restitution:0.0 });

    createChaine( 'fixed', 5, 20, 4, 4 );
    createChaine( 'distance', 5, 20, 2, 4 );
    createChaine( 'spherical', 5, 20, 0, 4 );
    createChaine( 'hinge', 5, 20, -2, 4 );
    createChaine( 'slider', 5, 20, -4, 4 );
    createChaine( 'd6', 5, 20, -6, 4 );

    testMotor()



    //phy.displayJoint( true );

    //phy.postUpdate = update;

};

function testMotor (){

    phy.add({ type:'box', name:'r1', pos:[0,2,6], size:[2,4,2],  mass:1 });
    phy.add({ type:'box', name:'r2', pos:[0,6,6], size:[2,4,2],  mass:1 });

    motorJoint = phy.add({
        name: "hingey",
        type:'joint',
        mode:'hinge',
        b1:'r1', b2:'r2',
        pos1:[0,2,0],  pos2:[0,-2,0],
        rot1:[0,0,90], rot2:[0,0,90],
        driveVelocity:1,
        gearRatio:-0.2,

    });

    //phy.postUpdate = update;

}

function update () {
    jointTest = phy.byName('joint_d6_0');
    phy.log( 'Angle :' + jointTest.data.angleZ );
}

function createChaine( type, length, py, pz, separation ){

    var l = separation;

    var name = 'node' + type+'_';
    var jname = 'joint_' + type+'_';
    var base = [ 0, py, pz ];
    var pos = [ separation/2, py, pz ];
    var prev = null;
    var size = 0.75;

    for( var i=0; i<length; i++ ){

        //if( type === 'd6' ) size = 2;

        current = createDynamic( name+i, pos, [4,size,size] );

        p = i===0 ? base : [2,0,0];

        switch ( type ){
            case 'spherical' : createLimitedSpherical( jname+i, prev, name+i, p, [-2,0,0] ); break;
            case 'hinge' : createHinge( jname+i, prev, name+i, p, [-2,0,0] ); break;
            case 'fixed' : createBreakableFixed( jname+i, prev, name+i, p, [-2,0,0] ); break;
            case 'd6' : createDampedD6( jname+i, prev, name+i, p, [-2,0,0] ); break;
            case 'distance' : createDistance( jname+i, prev, name+i, p, [-2,0,0] ); break;
            case 'slider' : createSlider( jname+i, prev, name+i, p, [-2,0,0] ); break;
        }


        prev = name+i;

        //console.log(prev)
        pos[0] += separation;
    }

}

function createDynamic( name, pos, size, velocity ){

    return phy.add({

        type:'box', name:name,
        pos:pos, size:size,
        mass:1,
        //velocity:[0,0,0],
        //angularDamping:0.5,
        //restitution:0.6,
        //material:'jointTest',

    });

}

function createDistance( name, b1, b2, pos1, pos2 ){

    phy.add({
        name:name,
        type:'joint', mode:'distance',
        b1:b1, b2:b2,
        pos1:pos1,  pos2:pos2,
        //rot1:[0,90,0], rot2:[0,90,0],
        collision:true,
        // min, max, stiffness, damping, tolerance
        limit:[ 0.1, 0.2, 1000, 0.1, 0.1 ],
    });
}

function createSlider( name, b1, b2, pos1, pos2 ){

    phy.add({
        name:name,
        type:'joint', mode:'slider',
        b1:b1, b2:b2,
        pos1:pos1,  pos2:pos2,
        //rot1:[0,90,0], rot2:[0,90,0],
        // Linear, Angular
        projectionTolerance: [0.01, 0.01],
        // min, max, stiffness, damping, restitution, bounceThreshold, contactDistance
        limit:[ 0.1, 2, 1000, 0.1, 0.5 ],
    });
}

function createHinge( name, b1, b2, pos1, pos2 ){

    phy.add({
        name:name,
        type:'joint', mode:'hinge',
        b1:b1, b2:b2,
        pos1:pos1,  pos2:pos2,
        rot1:[0,90,0], rot2:[0,90,0],

        // min, max, stiffness, damping, restitution, bounceThreshold, contactDistance
        limit:[ -45, 45, 1000, 0.1, 0.5 ],
        //limit:[ -45, 45 ], // without spring
    });
}

function createLimitedSpherical( name, b1, b2, pos1, pos2 ){

    phy.add({
        name:name,
        type:'joint', mode:'spherical',
        b1:b1, b2:b2,
        pos1:pos1,  pos2:pos2,
        // rot1:[0,90,0], rot2:[0,90,0],
        // yLimitAngle, zLimitAngle, stiffness, damping, restitution, bounceThreshold, contactDistance
        limit:[ 45, 25, 1000, 0.1, 0.5 ]
    });
}

function createBreakableFixed( name, b1, b2, pos1, pos2 ){

    phy.add({
        name:name,
        type:'joint', mode:'fixe',
        b1:b1, b2:b2,
        pos1:pos1, pos2:pos2,
        break:[ 1000, 100000 ],
        limitAreForce:true,
        noPreProcess:true,
    });

}

function createDampedD6( name, b1, b2, pos1, pos2 ){

    phy.add({
        name:name,
        type:'joint', mode:'d6',
        b1:b1, b2:b2,
        pos1:pos1,  pos2:pos2,
        motions:[ ['swing1', 'free'], ['swing2', 'free'], ['twist', 'free'] ],
        drives:[ ['slerp', 0.01, 1000, Infinity, true ] ], // [ [ dirve, Stiffness, damping, forceLimit, isAcceleration ] ]
        driveVelocity:[[0,0,0], [0,0,0]], // [ linear v3 ,  angular v3 ]
    });

}
