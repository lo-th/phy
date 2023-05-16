let eva, bb, ba, bc
let mode = 'follow'
let type = 'eva'
let debug = false

demo = () => {

	phy.view({
        phi:20, theta:0, distance:3, x:0, y:0.7, z:0, fov:53
	})

	phy.set({
		substep:1,
		gravity:[0,-9.81,0]
	})

	// add static plane 
	phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false, friction: 0.5,  });

	//let k = 200
	//while(k--) phy.add({type:'sphere', pos:[math.rand(-5,5), 2, math.rand(-5,5)], size:[math.rand(0.1,0.3)], density:1, mask:2})

    bb = phy.addButton({ type:'box', pos:[0,0,0.9], size:[0.4,0.1,0.2], radius:0.02, callback:switchMode, text:mode })
    ba = phy.addButton({ type:'box', pos:[0.4,0,0.85], size:[0.3,0.1,0.2], rot:[0,16,0], radius:0.02, callback:switchModel, text:type })
    bc = phy.addButton({ type:'box', pos:[-0.4,0,0.85], size:[0.3,0.1,0.2], rot:[0,-16,0], radius:0.02, callback:switchDebug, text:'debug' })

    addModel( type )

}

const addModel = ( type ) => {

	if(eva){
		phy.control( '' )
		mode = 'follow'
		bb.txt.set( mode )
        //phy.remove( 'eva' )
    }

	let n = type === 'eva' ? math.randInt(0,2) : math.randInt(0,1)
	let gender = type === 'eva' ? 'eva0'+n : (n === 1 ? 'woman' : 'man')

    eva = phy.add({ 
        type:'character',
        gender:gender,
        name:'eva',
        callback:done,
        mask:2
        //debug:true
        //anim:'none',
    })

}

const done = () => {

	//eva.model.setMaterial( {wireframe: true})
	//eva.model.visible = false
	//eva.model.addHelper()
	//eva.model.addExo()
	//eva.model.play('Standard Run')

	eva.addSkeleton()
	phy.control( 'eva' )

	eva.debugMode( debug )

}


// button fonction

const switchModel = () => { 

	if( type === 'eva' ) type = 'hero'
	else if ( type === 'hero' ) type = 'eva'
	ba.txt.set( type )
    debug = false

	addModel( type )
    
}

const switchMode = () => { 

	if( mode === 'follow' ) mode = 'ragdoll'
	else if ( mode === 'ragdoll' ) mode = 'follow'

	bb.txt.set( mode )

    eva.setMode( mode )

    phy.control( mode === 'follow' ? 'eva' : '' )

}

const switchDebug = () => { 

	if( debug ) debug = false
	else debug = true

	
    eva.debugMode( debug )

}