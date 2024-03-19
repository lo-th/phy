function demo() {

    phy.view({
        envmap:0x8aa4b8,
        //ground:false,
        vignette:false,
        //shadow:0,
        jointVisible:true, 
    })


    phy.set({})

    // add static plane 
    //phy.add({ type:'plane', name:'floor', size:[ 2,1,2 ], visible:false, friction: 0.5,  });

    /*phy.ui([
        { obj:{yo:0}, name:"yo", min:0, max:1 },
        { obj:{yo:1}, name:"yo", min:0, max:1 }
    ]);*/




    phy.setTimeout( yo, 1000 )

    // config physics setting
   /*phy.add({ type:'plane', visible:false });
    

    //phy.add({ type:'box', size:[10,0.1,10], pos:[0,-3,0], density:0 });

   
    phy.add({ type:'sphere', size:[1], pos:[0,8,0], rot:[45,45,0], density:1 });
  phy.add({ type:'box', size:[1,1,1], pos:[0,5,0], rot:[45,45,0], density:1 });
  phy.add({ type:'box', size:[1,1,1], pos:[0,20,0], rot:[45,45,0], density:1 });*/

}

const yo = () => {

    console.log('is done !!')

    gravityTest()

    //eva.model.addHelper()
   //eva.model.addExo()
}

const jointTest = () => {

    phy.add({ type:'plane', name:'floor', size:[ 20,1,20 ], visible:false, friction: 0.5,  });

    phy.add({ type:'box', name:'A', size:[1,1,1], pos:[-3,0.5,0], mass:1 });
    phy.add({ type:'box', name:'B', size:[1,1,1], pos:[3,0.5,0], mass:1 });

    phy.add({ type:'distance', b1:'A', b2:'B', pos1:[0,0,0], pos2:[0,0,0], visible:true });
}

const gravityTest = () => {

    phy.add({ type:'plane', name:'floor', size:[ 20,1,20 ], visible:false, friction: 0.5,  });

    phy.add({ type:'box', name:'A', size:[1,1,1], pos:[0,5,0], mass:1, gravityScale:0.1 });
}