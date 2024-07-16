function demo() {

    phy.view({
        envmap:0x606060,
        //ground:false,
        vignette:false,
        //shadow:0,
        groundReflect:0,
        jointVisible:true,
    })


    phy.set({})



    //phy.setTimeout( yo, 1000 )

    // config physics setting
    phy.add({ type:'plane', visible:false });
    
    phy.add({ type:'box', size:[1,3,2], pos:[-4,1.5,0], density:0 });

    phy.add({ 
        type:'box', size:[10,1,1], pos:[0,5,0], radius:0.1,
        mass:0.1, 
        //density:0.01, 
        massCenter:[ -4,0,0 ],
        material:'debug',
        massInfo:true,
    });
    phy.add({ type:'sphere', size:[1], pos:[0,8,0], rot:[45,45,0], mass:1 })


}

const yo = () => {

    console.log('is done !!')

    //eva.model.addHelper()
    //eva.model.addExo()
}