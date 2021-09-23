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
        if(i===0 || i===4 || i===8) p = 1.5
        else p = 1
        phy.material({ name:'c'+i, color:paintlColor[i], roughness:1, metalness:0, toneMapped:false })
        phy.add({ name:'box'+i, size:[p,4,p], pos:[ d * Math.sin(a), 2, d * Math.cos(a)],rot:[0,a*math.todeg,0], density:1, restitution:0.5, friction:0.9, material:'c'+i })
        a -= k
    }



}