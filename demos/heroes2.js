
demo = () => {

    phy.log('use key WSAD or ZSQD<br>E to fight<br>C to crouch<br>SPACE to jump<br>SHIFT to run')

	// setting and start oimophysics
	phy.set({ substep:2, gravity:[0,-9.81,0] })


	// add static plane 
	phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false });
	//phy.add({ type:'box', name:'floor', size:[300,1,300], pos:[0, -0.5, 0], visible:false, /*filter:[1,-1,[5,9], 0]*/ })

    // create character
    phy.add({ 
        type:'character',
        gender:'woman',
        name:'gina',
        callback:next,
        debug:true,
    })

    phy.follow('gina', { direct:true, simple:true, decal:[0.3, 1, -0.3] })
    phy.control( 'gina' )
    hub.addCross()

}

next = () => {

    

    
    

    
}


