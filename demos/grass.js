
function demo() {

    phy.view({
        envmap:"swiss",
        fogexp:0.03,
        //ground:false,
        vignette:false,
        //shadow:0,
        reflect:0,
        //jointVisible:true, 
    })


    phy.set({ 
        substep:1,
    })

    phy.lightIntensity( 13, 0.5, 0.5 );


    phy.addGrass()


}