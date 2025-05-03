let terrain

demo = () => {

	phy.view({
		envmap:'clear', water:true, groundSize:[512,512], 
		fog:true, fogRange:[50,100], fogMode:1,
		reflect:0.5, envblur:0.1 
	})
	
    // config physics setting
    // substep > 1 for increase fidelity
    phy.set({ substep:1, gravity:[0,-9.81,0] });

    addTerrain();

    if(engine!=='OIMO') addRandomTree();
    addRandomObject();

	// update after physic step
    phy.setPostUpdate( update );

}

addTerrain = () => {

	let data = {
        type:'terrain',
        name:'terra',
        friction: 0.1, 
        staticFriction:0.1,
        restitution: 0.1,
        maplevels:[0.5, 0.5, 0, 0.25],
        pos: [0,-2,0],
    	size: [256, 20, 256],
    	sample: [256, 256],
    	frequency: [0.016,0.05,0.2],
    	expo: 2,
    	zone:0.5, // physics simulated zone
    	uv: 60,
    	island:true,
    	//debug:true,
    };

    if( engine === 'OIMO' ){
    	// oimo is too slow for large terrain
    	data = {
    		...data,
    		pos: [ 0, -2, 0 ],
	    	size: [ 20, 6, 20 ],
	    	sample:[ 32, 32 ],
	    	frequency: [0.05,0.25,0.75],
	    	uv:10,
	    	zone:1,
    	}
    }

    terrain = phy.add( data );

    let py = terrain.getHeight( 0, 0 )
    phy.setCamera({y:py})

}

addSimpleTerrain = () => {

	terrain = phy.add({
        type:'terrain',
        name:'terra',
        friction: 0.1, 
        staticFriction:0.1,
        restitution: 0.1,
        maplevels:[0.5, 0.5, 0, 0.25],
        pos: [ 0, -2, 0 ],
    	size: [ 20, 6, 20 ],
    	sample:[ 32, 32 ],
    	frequency: [0.05,0.25,0.75],
    	expo: 2,
    	zone:0.5, // physics simulated zone
    	uv: 10,
    	island:true,
    	debug:true,
    })

}

addRandomTree = () => {

	let i = 200, x, y, z
	let d = 50
	while(i--){
		x = math.rand(-d,d)
		z = math.rand(-d,d)
		y = terrain.getHeight( x, z )
		if(y<3) continue
		phy.add({ size:[0.5,3,0.5], pos:[x, y+1.5, z] })
	}

}

addRandomObject = () => {

	let setting = { density:1, friction:0.1, staticFriction:0.1, restitution: 0.1, neverSleep:true, material:'copper' }
	let j = 100, s, p;
	let d = engine === 'OIMO' ?10:20;
	let h = 30;
	while(j--){
		s = math.rand(0.2,2.0);
		p = [math.rand(-d,d),h,math.rand(-d,d)];
		phy.add({ type:'box', size:[s], pos:p, ...setting });
		p = [math.rand(-d,d),h,math.rand(-d,d)];
		phy.add({ type:'sphere', size:[s*0.5], pos:p,  ...setting });
	}
}

update = () => {

	phy.change({ name:'terra', ease:true, key:phy.getKey(), azimut:phy.getAzimut() }, true )

	/*let key = phy.getKey()
	let r = phy.getAzimut()
	terrain.easing( key, r )*/

}