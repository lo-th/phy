var terrain

function demo() {

    // get current physics engine name
	let engine = phy.engine

	phy.view({
		envmap:'park',
		groundSize:engine==='OIMO' ? [ 20, 20 ] : [80, 80],
		//groundAlpha:false,
		groundOpacity:0.8,
	})

    // config physics setting
    // substep > 1 for increase fidelity
    phy.set({ 
    	substep:2, 
    	gravity:[0,-9.81,0] 
    })

    // create terrain mesh
    terrain = new Landscape({ 

    	size: engine==='OIMO' ? [ 20, 6, 20 ] : [80, 10, 80],
    	sample: engine==='OIMO' ? [ 32, 32 ] : [128,128],
    	frequency: [0.05,0.25,0.75],
    	expo: 2,
    	uv: 10,
    	//debuger: true,
    	callback: addLand

    })

}

function addLand (){

	console.log('is add')

    phy.add({
        type:'mesh',
        isTerrain:true,
        pos:[0,-2,0],
        rot:[0,0,0],
        mesh:terrain,
        material:terrain.material
    })

    // add some dynamic body

	let j = 20, s, p;
	while(j--){
		s = math.rand(0.3,0.8)
		p = [math.rand(-4,4),6,math.rand(-4,4)]
		phy.add({ size:[s], pos:p, density:1 })
		p = [math.rand(-4,4),6,math.rand(-4,4)]
		phy.add({ type:'sphere', size:[s*0.5], pos:p, density:1 })
	}
	 
}