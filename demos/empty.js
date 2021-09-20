function demo() {

    phy.view({
        //envmap:'room',
        ground:false
    })

    // config physics setting
    //
    phy.set( {substep:2, gravity:[0,-9.81,0]});

    // add static plane 
    //phy.add({ type:'plane', visible:false });

}
