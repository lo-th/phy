var terrain

function demo() {

	phy.view({
		envmap:'park',
		groundSize:[ 20, 20 ],
		//groundAlpha:false,
		groundOpacity:0.8,
	})

    // config physics setting
    // substep > 1 for increase fidelity
    phy.set( {substep:2, gravity:[0,-9.81,0]})

    // add static ground
    //phy.add({ type:'plane', size:[300,1,300], visible:false })

    // create terrain mesh
    terrain = new Landscape({ 

    	size: [ 20, 6, 20 ],
    	sample: [ 32, 32 ],
    	frequency: [0.05,0.25,0.75],
    	expo: 2,
    	uv: 10,
    	debuger: true,
    	callback: addLand

    })

}

function addLand (){

	let g = terrain.geometry.clone().toNonIndexed()
	let v = g.attributes.position.array;

	var shapes = []

	let n, vv, lng = v.length/18

	for( let i=0; i<lng; i++ ){

		n = i*18;

		vv = [
		v[ n ], v[ n+1 ], v[ n+2 ],
		v[ n+3 ], v[ n+4 ], v[ n+5 ],
		v[ n+6 ], v[ n+7 ], v[ n+8 ],

		v[ n+9 ], v[ n+10 ], v[ n+11 ],
		v[ n+12 ], v[ n+13 ], v[ n+14 ],
		v[ n+15 ], v[ n+16 ], v[ n+17 ]
		]

		shapes.push( { type:'convex', v:vv, nogeo:true })

	}

	// add static terrain

	phy.add({
        type:'compound',
        pos:[0,-2,0],
        rot:[0,0,0],
        shapes:shapes,
        mesh:terrain,
        material:terrain.material
    })

    // add some dynamic body

	let j = 20, s;
	while(j--){
		s = math.rand(0.3,0.8)
		phy.add({ size:[s], pos:[math.rand(-4,4),6,math.rand(-4,4)], density:1 })
		phy.add({ type:'sphere', size:[s*0.5], pos:[math.rand(-4,4),6,math.rand(-4,4)], density:1 })
	}
	 
}