let terrain

demo = () => {

	phy.view({ envmap:'basic', ground:false, fog:true, fogDist:0.01 })
	
    // config physics setting
    // substep > 1 for increase fidelity
    phy.set({ substep:2, gravity:[0,-9.81,0] })

    // create terrain mesh
    terrain = phy.add({
        type:'terrain',
        name:'terra',
        friction: 0.1, 
        staticFriction:0.1,
        restitution: 0.1,
        maplevels:[0.5, 0.5, 0, 0.25],
        pos: engine==='OIMO' ? [ 0, -2, 0 ] :[0,-10,0],
    	size: engine==='OIMO' ? [ 20, 6, 20 ] : [256, 20, 256],
    	sample: engine==='OIMO' ? [ 32, 32 ] : [256, 256],
    	frequency: engine==='OIMO' ? [0.05,0.25,0.75] : [0.016,0.05,0.2],
    	expo: 2,
    	zone:0.25,
    	uv: engine==='OIMO' ? 10:60,
    })

    //let G = new THREE.Quaternion().setFromAxisAngle( {x:0,y:1,z:0}, 90 * math.torad )
    //console.log( G.toArray() )

    /*terrain = phy.add({
        type:'terrain',
        name:'terra',
        friction: 0.5, 
        staticFriction:0.5,
        restitution: 0.1,
        pos: [ 0, 0, 0 ],
    	size: [ 40, 6, 40 ],
    	sample: [ 64, 64 ] ,
    	frequency:  [0.05,0.25,0.75],
    	expo: 2,
    	zone:1,
    	uv: 10,
    	debug:true,
    })*/

    //terrain.material.wireframe = true

    /*terrain.physicsUpdate = ( h ) => {
    	phy.update({ name:'terra', heightData:h })
    }*/

    if(engine!=='OIMO') addRandomTree()
    addRandomObject()

	// update after physic step
    phy.setPostUpdate( update )

}

addRandomTree = () => {

	let i = 10, x, y, z
	let d = 50
	while(i--){
		x = math.rand(-d,d)
		z = math.rand(-d,d)
		y = terrain.getHeight( x, z )
		phy.add({ size:[1,6,1], pos:[x, y+2, z] })

	}

}

addRandomObject = () => {

	let setting = { density:1, friction:0.1, staticFriction:0.1, restitution: 0.1, neverSleep:true }
	let j = 100, s, p;
	let d = engine==='OIMO' ?10:20
	let h = 30
	while(j--){
		s = math.rand(0.3,0.8)
		p = [math.rand(-d,d),h,math.rand(-d,d)]
		phy.add({ size:[s], pos:p, ...setting })
		p = [math.rand(-d,d),h,math.rand(-d,d)]
		phy.add({ type:'sphere', size:[s*0.5], pos:p,  ...setting })
	}

}

update = () => {

	phy.change({name:'terra', ease:true, key:phy.getKey(), azimut:phy.getAzimut() }, true )

	/*let key = phy.getKey()
	let r = phy.getAzimut()
	terrain.easing( key, r )*/

}