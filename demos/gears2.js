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
        
            phy.change([
                {name:'j1', motor:[r, 200]},
                {name:'j2', motor:[r, 200]},
                {name:'j3', motor:[r, 200]}
            ]);
        
        
    //}
    


}
onComplete = () => {

    const model = phy.getMesh('gears');

    let center, c, g, b

    let def = {
        type:'convex',
        shape: model['s_20_in'].geometry,
        mesh: model['g_20_in'],
        restitution:0, friction:0.5,
        density:10,
        material:'base'
        //size:[100],
    }

    let def0 = {
        type:'cylinder',
        size:[0.23, 0.6],
        restitution:0, friction:0.5,
        density:0,
        material:'base'
        //size:[100],
    }

    center = [0,2,0]

    b = phy.add( {
        ...def0,
        name:'b1',
        pos:center,
        rot:[90,0,0],
    })

    g = phy.add( {
        ...def,
        //density:1,
        name:'g1',
        rot:[0,0,0],
        meshRot:[0,0,8],
        pos:center,
    })

    phy.add({ type:'joint', name:'j1', mode:'revolute', b1:b.name, b2:g.name, worldAnchor:center, worldAxis:[0,0,1], gearRatio:1, driveFree:true })  //, motor:[ 200 ], noFix:0 

    center = [0.8,2,0.8]

    b = phy.add( {
        ...def0,
        name:'b2',
        pos:center,
        rot:[0,0,90],
    })

    g = phy.add( {
        ...def,
        name:'g2',
        rot:[0,-90,0],
        pos:center,
    })

    phy.add({ type:'joint', name:'j2', mode:'revolute', b1:b.name, b2:g.name, worldAnchor:center, worldAxis:[1,0,0], gearRatio:1, driveFree:true }) //, noFix:1

    center = [-0.8,2,0.8]

    b = phy.add( {
        ...def0,
        name:'b3',
        pos:center,
        rot:[0,0,90],
    })

    g = phy.add( {
        ...def,
        name:'g3',
        rot:[0,90,0],
        pos:center,
    })

    phy.add({ type:'joint', name:'j3', mode:'revolute', b1:b.name, b2:g.name, worldAnchor:center, worldAxis:[1,0,0], gearRatio:-1, driveFree:true }) //, , noFix:1

    //phy.setPostUpdate ( onUpdate )

}
