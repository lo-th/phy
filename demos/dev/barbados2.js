let perso

demo = () => {

    //phy.log('use key WSAD or ZSQD<br>E to fight / C to crouch<br>SPACE to jump / SHIFT to run')

    phy.view({ envmap:'clear', envblur: 0.05, ground:false, fog:true, fogDist:0.01 })

	// setting physics
	phy.set({ substep:2, gravity:[0,-9.81,0], key:true })

    phy.lightIntensity( 7, 0.5, 1.0 );
    phy.useRealLight( {aoColor:0x441c00, irradianceColor:0xffFFFF, envPower:1.5} );


	// add static plane 
	//phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false, friction: 0.5,  });
	//phy.add({ type:'box', name:'j', size:[0.1,0.01,0.1], pos:[0, 0.005, 0], material:'body' /*filter:[1,-1,[5,9], 0]*/ })


    makeTerrain()

    

}


makeTerrain = () => {

    let z = 0.75
    let low = engine === 'OIMO';

    let terrain = phy.add({
        type:'terrain',
        name:'terra',
         
        maps:['road3', 'dirt', 'rock'],

        uv:low ? 18 : 400,
        pos:low ? [ 0, -2, 0 ] :[0,-5,0],
        size:low ? [ 20, 6, 20 ] : [512, 10, 512],
        sample:low ? [ 32, 32 ] : [512, 512],
        frequency:[0.02*z,0.05*z,0.1*z],
        level:[ 1.0, 0.5, 0.2 ],
        expo:2.5,

        friction: 0.5,
        restitution: 0.0,

    })

    let py = terrain.getHeight( 0, 0 )+1
    //if(py<1) py = 1


    addCharacter( py )



    //phy.change( { name:'eva', pos:[0,py,0] } )
    //phy.remove( 'floor' )

    // update after physic step
    

}

addCharacter = ( py ) => {

    // create character

    perso = phy.add({ 
        type:'character',
        gender:'barbados',
        name:'hero',
        callback:end,
        pos:[0,py,0],
        debug:true
    })

    phy.follow('hero', { direct:true, simple:true, distance:3, phi:-10, theta:5, decal:[0.3, 0.5, -0.3], fov:75, zoom:1.0 })
    phy.control('hero')
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
            { name:'hero', pos:[0,p.y,0] },
        ])
    }


}