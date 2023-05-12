let eva, exo

demo = () => {

	phy.view({
        phi:0, theta:0, distance:3, x:0, y:1, z:0, fov:50
	})

	phy.set({substep:1})

	// add static plane 
	phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false, friction: 0.5,  });

	let n = math.randInt(0,2)

	eva = phy.add({ 
        type:'character',
        //gender:'man',
        gender:'eva0'+n,
        anim:'none',
        name:'eva',
        callback:done,
        mask:2
       // debug:true
    })

    //phy.control( 'eva' )

}

const done = () => {

	//eva.model.addHelper()
	exo = eva.model.addExo()
	eva.model.play('Standard Run')

	eva.addSkeleton()

	let k = 200
	while(k--) phy.add({type:'sphere', pos:[math.rand(-5,5), 2, math.rand(-5,5)], size:[math.rand(0.1,0.3)], density:1, mask:2})

    phy.setTimeout( next, 10000 )

}


const next = () => {

	phy.control( 'eva' )

}