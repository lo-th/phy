
demo = () => {

    phy.log('use key WSAD or ZSQD<br>E to fight<br>C to crouch<br>SPACE to jump<br>SHIFT to run')

    
    //phy.view({ envmap:0x909090, ground:true })

	// setting and start oimophysics
	phy.set({ substep:2, gravity:[0,-9.81,0] })


	// add static plane 
	phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false, friction: 0.5,  });
	//phy.add({ type:'box', name:'floor', size:[300,1,300], pos:[0, -0.5, 0], visible:false, /*filter:[1,-1,[5,9], 0]*/ })

    // create character
    phy.add({ 
        type:'character',
        gender:'woman',
        name:'gina',
        callback:terrainTest,
        pos:[0.6,0,0],
        //noMat:true,
        //morph:true,
        //debug:true,
    })

    phy.follow('gina', { direct:true, simple:true, decal:[0.3, 1, -0.3] })
    phy.control( 'gina' )
    hub.addCross()

}

addMan = () => {

    phy.add({ 
        type:'character',
        gender:'man',
        name:'bob',
        callback:cloneTest,
        pos:[-0.6,0,0],
        //noMat:true,
        //morph:true,
        debug:true,
    })
    
}

cloneTest = () => {

    let i = 39

    while(i--){
        phy.add({ 
            type:'character',
            gender:math.randInt(0,1)? 'man': 'woman',
            name:'hero'+i,
            //callback:next,
            pos:[math.rand(-6, 6), 0, math.rand(-6, 6)],
            angle:math.rand(-180, 180),

            //noMat:true,
            //morph:true,
            //debug:true,
        })
    }
    
}

terrainTest = () => {

    let terrain = phy.add({
        type:'terrain',
        name:'terra',
        friction: 0.5, 
        //staticFriction:0.5,
        restitution: 0.0,
        pos: engine==='OIMO' ? [ 0, -2, 0 ] :[0,-5,0],
        size: engine==='OIMO' ? [ 20, 6, 20 ] : [256, 20, 256],
        sample: engine==='OIMO' ? [ 32, 32 ] : [256, 256],
        frequency: engine==='OIMO' ? [0.05,0.25,0.75] : [0.016,0.05,0.2],
        expo: 2,
        uv: engine==='OIMO' ? 10:60,
    })

    let py = terrain.getHeight( 0, 0 )+1
    if(py<1) py = 1

    phy.up( { name:'gina', pos:[0,py,0] } )
    //phy.remove( 'floor' )
    
}


