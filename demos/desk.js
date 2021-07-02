function demo() {

	phy.log('under construction')

	// config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]})

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })

    // add dynamic sphere
    phy.add({ name:'box1', size:[4,1,2], pos:[0,2,0], density:1, restitution:0.5, friction:0.9 })

}