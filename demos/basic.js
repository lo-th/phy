demo = () => {

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0] })

    // add static plane 
    //phy.add({ type:'plane', visible:false })
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    // add dynamic sphere
    phy.add({ type:'highSphere', name:'sphere', size:[0.4], pos:[0,6,0], density:5, restitution:0.2, friction:0.2, sleep:true, startSleep:true, })

    // creat building
    building({ block:0.3, height:10, length:5, deep:5 })

    // intern timeout
    phy.setTimeout( run, 2000 )

}

run = () => {
    // phy.up is use for direct outside update
    phy.change({ name:'sphere', wake:true, force:[0,-0.0001,0] })
}

building = ( o ) => {

    let i, j, k, pos;
    let s = o.block || 1;
    let space = o.space || 0//0.06;
    let d = s + space;
    let x = o.length || 6, y = o.height || 10, z = o.deep || 6;

    let dx = - ((x*0.5) * d) + (d*0.5);
    let dz = - ((z*0.5) * d) + (d*0.5);

    for(k = 0; k<y; k++){
    for(j = 0; j<z; j++){
    for(i = 0; i<x; i++){
        pos = [ i*d + dx, (k*d + d)-(s*0.5), j*d + dz ]
        phy.add({
            instance:'boxbase',
            type:'box',
            radius:0.025,// box chanfer
            size:[s,s,s],
            pos:pos,
            density:0.3,
            friction:0.4,
            restitution:0.6,
            sleep:true,
            startSleep:true,
        })
    }}}

}