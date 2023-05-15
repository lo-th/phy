let eva, bb
let mode = 'follow'

demo = () => {

	phy.view({
        phi:20, theta:0, distance:3, x:0, y:0.8, z:0, fov:50
	})

	phy.set({
		substep:1,
		gravity:[0,-9.81,0]
	})

	// add static plane 
	phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false, friction: 0.5,  });

	let n = math.randInt(0,2)

	eva = phy.add({ 
        type:'character',
        //gender:'woman',
        gender:'eva0'+n,
        //anim:'none',
        name:'eva',
        callback:done,
        mask:2
       // debug:true
    })

    //phy.control( 'eva' )

}

const done = () => {


	//eva.model.setMaterial( {wireframe: true})
	//eva.model.visible = false
	//eva.model.addHelper()
	//eva.model.addExo()
	//eva.model.play('Standard Run')

	eva.addSkeleton()

	let k = 200
	//while(k--) phy.add({type:'sphere', pos:[math.rand(-5,5), 2, math.rand(-5,5)], size:[math.rand(0.1,0.3)], density:1, mask:2})

	phy.control( 'eva' )

    //phy.setTimeout( next, 10000 )

    bb = phy.addButton({ type:'box', pos:[0,0,0.5], size:[0.4,0.1,0.2], radius:0.02, callback:ab1, text:'follow' })

}


const next = () => {

	phy.control( 'eva' )

}

const ab1 = () => { 

	if( mode === 'follow' ) mode = 'ragdoll'
	else if ( mode === 'ragdoll' ) mode = 'follow'

	bb.txt.set( mode )

    eva.setMode( mode )

    phy.control( mode === 'follow' ? 'eva' : '' )
}