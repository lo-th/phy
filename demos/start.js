let j = 10;

function demo() {

    // config physics setting
    phy.set({ substep:4, gravity:[0,-9.81,0] })

    // add static ground
    //phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    // add some dynamics
    let i = 20;

    while( i-- ){

        v = math.rand( -0.02, 0.02 )
        // phy.add can also be a array
        phy.add([
            { type:'box', size:[1,0.2,1], pos:[0,5+(i*0.5),0], density:1, restitution:0.5, friction:0.5, radius:0.03 },
            { type:'sphere', size:[0.2], pos:[3+v,5+(i*0.5),v], density:1, restitution:0.5, friction:0.9 },
            { type:'cylinder', size:[0.4, 0.2], pos:[-3,5+(i*0.5),0], density:1, restitution:0.5, friction:0.9, radius:0.03 },
            { type:'cone', size:[0.2, 0.4], pos:[-3,5+(i*0.5),2], density:1, restitution:0.5, friction:0.9, radius:0.03 },
            { type:'capsule', size:[0.1, 0.2], pos:[3-v,5+(i*0.5),2+v], density:1, restitution:0.5, friction:0.9, radius:0.03 }
        ])
        
    }

}