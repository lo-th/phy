function demo() {

	phy.log('under construction')

	// config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]})

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })

    let paintlColor = [
    0xf2e501, 0xfdc50c, 
    0xf28e1e, 0xe96220,
    0xe12323, 0xc6047e,
    0x6b3a8b, 0x474f9a,
    0x2b72b0, 0x0896bc,
    0x018e5a, 0x8eba27
    ]

    let a = 0; d=5, k = (math.Pi*2)/12, p = 1;
    for(let i =0; i<12; i++){
        if(i===0 || i===4 || i===8) p = 2
        else p = 2
        phy.material({ name:'c'+i, color:paintlColor[i], roughness:1, metalness:0, toneMapped:false })
        phy.add({ name:'box'+i, size:[p,0.2,p], pos:[ d * Math.sin(a), 1, d * Math.cos(a)],rot:[0,a*math.todeg,0], radius:0.02, density:1, restitution:0.5, friction:0.9, material:'c'+i })
        a -= k
    }

    phy.material({ name:'white', color:0xFFFFFF, roughness:1, metalness:0, toneMapped:false })
    phy.add({ type:'highSphere', size:[2], pos:[ 0, 2, 0], density:1, restitution:0.5, friction:0.9, material:'white' })

}