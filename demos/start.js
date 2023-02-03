demo = () => {

    // config physics setting
    phy.set({ substep:4, gravity:[0,-9.81,0], fps:-1/*, fixe:false*/ })

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false });
    //phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    // add some dynamics
    let i = 20;
    let option = {
        density:1, restitution:0.5, friction:0.5, radius:0.03
    }

    while( i-- ){

        let vx = math.rand( -0.02, 0.02 )
        let vz = math.rand( -0.02, 0.02 )
        // phy.add can be a array
        phy.add([
            { instance:'A', type:'box', size:[1,0.2,1], pos:[-0.5,5+(i*0.5),-0.5], ...option },
            { instance:'B', type:'sphere', size:[0.2], pos:[3.5+vx,5+(i*0.5),vz-0.5], ...option },
            { instance:'C', type:'cylinder', size:[0.4, 0.2], pos:[-2.5,5+(i*0.5),-0.5], ...option },
            { instance:'D', type:'capsule', size:[0.1, 0.2], pos:[3-vx,5+(i*0.5),2+vz], ...option },
            { instance:'E', type:'cone', size:[0.2, 0.4], pos:[-3,5+(i*0.5),2], ...option }
        ])
        
    }

}