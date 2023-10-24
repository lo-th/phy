function demo() {

    phy.view({
        ground:false,
        vignette:false,
    })


    phy.set({})


    // add static plane 
    //phy.add({ type:'plane', name:'floor', size:[ 2,1,2 ], visible:false, friction: 0.5,  });




    //phy.setTimeout( yo, 1000 )

    // config physics setting
    phy.add({ type:'plane', visible:false });
    

    phy.add({ type:'box', size:[10,1,1], pos:[0,5,0], density:1 });
    phy.add({ type:'sphere', size:[1], pos:[4,8,0], rot:[45,45,0], mass:1 })

   
    /*;
  phy.add({ type:'box', size:[1,1,1], pos:[0,5,0], rot:[45,45,0], density:1 });
  phy.add({ type:'box', size:[1,1,1], pos:[0,20,0], rot:[45,45,0], density:1 });*/

}

const yo = () => {

    console.log('is done !!')

    //eva.model.addHelper()
   //eva.model.addExo()
}