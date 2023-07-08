let perso

demo = () => {

    //phy.log('use key WSAD or ZSQD<br>E to fight / C to crouch<br>SPACE to jump / SHIFT to run')

    phy.view({ envmap:'basic', envblur: 0.05, ground:false, fog:true, fogDist:0.01 })

	// setting physics
	phy.set({ substep:2, gravity:[0,-9.81,0], key:true })


	// add static plane 
	//phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false, friction: 0.5,  });
	//phy.add({ type:'box', name:'j', size:[0.1,0.01,0.1], pos:[0, 0.005, 0], material:'body' /*filter:[1,-1,[5,9], 0]*/ })


    makeTerrain()

    

}


makeTerrain = () => {

    let z = 0.75

    let terrain = phy.add({
        type:'terrain',
        name:'terra',
        friction: 0.5, 
        maps:['crater', 'dirt', 'rock2'],
        //staticFriction:0.5,
        restitution: 0.0,
        uv:engine==='OIMO' ? 18 : 96,
        pos: engine==='OIMO' ? [ 0, -2, 0 ] :[0,-5,0],
        size: engine==='OIMO' ? [ 20, 6, 20 ] : [512, 30, 512],
        sample: engine==='OIMO' ? [ 32, 32 ] : [512, 512],
       // frequency: engine==='OIMO' ? [0.05,0.25,0.75] : [0.016,0.05,0.2],
       // level:[ 1, 0.2, 0.1 ],

        frequency:[0.02*z,0.05*z,0.1*z],
        level:[ 1.0, 0.2, 0.05 ],
        expo: 1,
    })

    let py = terrain.getHeight( 0, 0 )+1
    //if(py<1) py = 1


    addCharacter( py )

    //phy.change( { name:'eva', pos:[0,py,0] } )
    //phy.remove( 'floor' )

    // update after physic step
    

}

addCharacter = ( py ) => {

    let n = math.randInt(0,2)
    // create character
    perso = phy.add({ 
        type:'character',
        gender:'eva0'+n,
        name:'eva',
        callback:end,
        pos:[0,py,0],
    })

    phy.follow('eva', { direct:true, simple:true, distance:2.5, phi:-5, theta:0, decal:[0.3, 0.5, -0.3], fov:75, zoom:1.0 })
    phy.control('eva')
    phy.setPostUpdate( update )

}

end = ( py ) => {

    
    //hub.addCross()

}


update = () => {

    let p = perso.position;
    let d = math.distanceArray([p.x, 0, p.z])
    if( d > 50 ){
        phy.change([
            { name:'terra', decal:[p.x,0,p.z] },
            { name:'eva', pos:[0,p.y,0] },
        ])
    }


}