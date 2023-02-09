let j1, j2, j3

demo = () => {

    phy.set({ gravity:[0,-9.81,0], substep:2 })

    // add static ground
    //phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    phy.load(['./assets/models/gears.glb'], onComplete )

}

onUpdate = () => {

    let key = phy.getKey()
    let r = key[0] * 300

    /*if(r===0){
        phy.update([
            {name:'j1', driveFree:true},
            {name:'j2', driveFree:true},
            {name:'j3', driveFree:true}
        ]);
    }else{*/
        phy.update([
            {name:'j1', motor:[r]},
            {name:'j2', motor:[r]},
            {name:'j3', motor:[r]}
        ]);
    //}
    


}
onComplete = () => {

    const model = phy.getMesh('gears');

    let center, c, g

    let def = {
        type:'convex',
        shape: model['s_20_in'].geometry,
        mesh: model['g_20_in'],
        restitution:0, friction:0.5,
        density:10,
        material:'simple'
        //size:[100],
    }

    center = [0,2,0]

    g = phy.add( {
        ...def,
        //density:1,
        name:'g1',
        rot:[0,0,0],
        meshRot:[0,0,8],
        pos:center,
    })

    phy.add({ type:'joint', name:'j1', mode:'revolute', b1:null, b2:g.name, worldAnchor:center, motor:[ 200 ], gearRatio:1, noFix:0 })

    center = [0.8,2,0.8]

    g = phy.add( {
        ...def,
        name:'g2',
        rot:[0,-90,0],
        pos:center,
    })

    phy.add({ type:'joint', name:'j2', mode:'revolute', b1:null, b2:g.name, worldAnchor:center, worldAxis:[0,0,1], motor:[ 0 ], gearRatio:1, noFix:1 })

    center = [-0.8,2,0.8]

    g = phy.add( {
        ...def,
        name:'g3',
        rot:[0,90,0],
        pos:center,
    })

    phy.add({ type:'joint', name:'j3', mode:'revolute', b1:null, b2:g.name, worldAnchor:center, worldAxis:[0,0,1], motor:[ 0 ], gearRatio:-1, noFix:1 })

    phy.setPostUpdate ( onUpdate )

}
