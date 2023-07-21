let eva, bb, ba, bc
let mode = 'follow'
let type = 'lee'
let debug = false

let modelList = ['hero', 'eva', 'lee']
let listN = modelList.indexOf( type )

demo = () => {

	phy.log( '> Use keyboad to move' )

	phy.view({
        envmap:'box', phi:0, theta:0, distance:5, x:0, y:1.0, z:0, fov:45, envblur:0.25
	})

	phy.set({
		substep:1,
		gravity:[0,-9.81,0]
	})

	// add static plane 
	phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false, friction: 0.5,  });
	
	

	//let k = 200
	//while(k--) phy.add({type:'sphere', pos:[math.rand(-5,5), 2, math.rand(-5,5)], size:[math.rand(0.1,0.3)], density:1, mask:2})

    

    

    phy.load( ['./assets/models/skeleton_deco.glb'], onComplete )

}

const onComplete = () => {

	let deco = phy.getMesh('skeleton_deco');

	phy.add({ type:'box', name:'wall', pos:[0,1.5,-1.5], size:[ 5,3,1.0 ], friction: 0.5, mesh:deco.wall, material:'concrete' });


	bb = phy.addButton({ type:'box', pos:[1.0, 1.2,-1.05], size:[0.4,0.2,0.1], radius:0.02, callback:switchMode, text:mode, axe:2, material:'black' })
    ba = phy.addButton({ type:'box', pos:[1.0, 1.5,-1.05], size:[0.4,0.2,0.1], radius:0.02, callback:switchModel, text:type, axe:2, material:'black' })
    bc = phy.addButton({ type:'box', pos:[1.0, 1.8,-1.05], size:[0.4,0.2,0.1], radius:0.02, callback:switchDebug, text:'debug',  axe:2, material:'black' })

	addModel( type )

}

const addModel = ( type ) => {

	if(eva){
		phy.control( '' )
		mode = 'follow'
		bb.txt.set( mode )
        phy.remove( 'eva' )
    }

	let n = type === 'eva' ? math.randInt(0,2) : math.randInt(0,1)

	let gender = type;
	switch(type){
		case 'eva': gender = 'eva0'+n; break
		case 'hero': gender = n === 1 ? 'woman' : 'man'; break
	}

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

	//let m = eva.model.getMaterial('skin')
	//console.log(m)
	//m.lightMapIntensity = 0.5

    //m.iridescenceIOR = 0

	//m.envMapIntensity = 0.5
	//m.envMapIntensity = 0.5

	//eva.model.setMaterial( {wireframe: true})
	//eva.model.visible = false
	//eva.model.addHelper()
	//eva.model.addExo()
	//eva.model.play('Standard Run')

	//eva.model.setMaterial( {wireframe: true})

	//eva.static = true
	eva.addSkeleton()
	phy.control( 'eva' )

	eva.debugMode( debug )

}


// button fonction

const switchModel = () => { 

	listN++
	if(listN>=modelList.length)listN=0

	type = modelList[listN]

	//if( type === 'eva' ) type = 'hero'
	//else if ( type === 'hero' ) type = 'eva'
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