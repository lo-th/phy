function demo() {

    phy.view({
        envmap:0x606060,
        //ground:false,
        vignette:false,
        //shadow:0,
        groundReflect:0,
        //jointVisible:true, 
    })


    phy.set()

    phy.add({ type:'box', size:[10,1,10], pos:[0,-0.5,0], density:0, visible:false });

    phy.add({ name:'a', type:'box', size:[1,3,2], pos:[2,1.5,0], density:1 });
    phy.add({ name:'b', type:'box', size:[1,3,2], pos:[-2,1.5,0], density:1 });

    phy.add({ name:'jointTest', type:'generic', b1:'a', b2:'b', pos1:[1,0,0], pos2:[-1,0,0], limit:[['x', 0, 2], ['rx', -180, 180 ] ], collision:true, visible:true });

    //phy.remove('jointTest')
    //phy.remove('b')

}