let trigger



demo = () => {

    phy.log('use key WSAD or ZSQD<br>E to fight<br>C to crouch<br>SPACE to jump<br>SHIFT to run')

	// setting and start oimophysics
	phy.set({ substep:2, gravity:[0,-9.81,0] })


	// add static plane 
	//phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false });
	phy.add({ type:'box', name:'floor', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    // create character
    phy.add({ 
        type:'character',
        gender:'man',
        name:'bob',
        // when asset loaded
        callback:next
    })

    // camera follow character
    phy.follow('bob', { direct:true, simple:true, decal:[0.3, 1, -0.3] })

    // character is control by key
    phy.control( 'bob' )

    // add cross in viewport
    hub.addCross()

}

next = () => {
    
    //phy.add({ type:'box', name:'trigger', size:[2, 2, 2], pos:[0,-0.99,-3], material:'debug', mask:32 })
    trigger = phy.add({ type:'box', name:'trigger', size:[5, 1.8, 2], pos:[0,0.91,-3], material:'debug', isTrigger:true, unicMat:true  })//

    phy.add({ type:'contact', b1:'bob', b2:'floor', callback: showContact })
    phy.add({ type:'contact', b1:'bob', b2:'trigger', callback: triggerContact })

    let i = 200, s,a,d;
    
    while(i--){

        s = math.rand( 0.2, 2 )
        a = math.rand(-math.Pi, math.Pi)
        d = 10 + math.rand(1, 5)
        
        phy.add({ type:'box', size:[s], pos:[ d * Math.sin(a), (s*0.5), d * Math.cos(a)], rot:[0,a*math.todeg,0], density:math.randInt(0,1)? 0: s })

    }

}




showContact = ( d ) => {

    //if( d.hit ) bob.material.color.setHex( 0x00FF00 )
    //else bob.material.color.setHex( 0x00FF88 ) 

    //console.log('bob collision on floor')
}

triggerContact = ( d ) => {

    if( d.hit ) trigger.material.color.setHex( 0xFF0000 )
    else trigger.material.color.setHex( 0xFFFF00 )

    //console.log('bob collision on trigger')
}
