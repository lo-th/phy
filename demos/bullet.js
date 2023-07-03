demo = () => {

    // config physics setting
    phy.set({ substep:2, gravity:[0,0,0], ccd:true })

    // add static plane 
    phy.add({ type:'plane', visible:false })

    phy.add({ type:'container', material:'glassX', size:[4,4,4], pos:[0,2.5,0], friction:0, restitution:1 })// material:'glassX'


    phy.setTimeout( launchBullet, 100 )

}


launchBullet = () => {

    var i = 60, r = 0.2, d = 0.4, x;
    let v = 0.1
    while(i--){
        x = math.rand(-2+0.25,2-0.25);
        y = 2.5 + math.rand(-2+0.25,2-0.25);
        z = math.rand(-2+0.25,2-0.25);
        phy.add({ 


            type:'sphere', 
            size:[math.rand(0.1,0.25)], 
            pos:[x, y ,z], 
            //mass:1, 
            density:0.2,
            //linearVelocity:[0,0,-1000],
            ccdThreshold:0.0000001,
            ccdRadius:0.1,
            enableCCD:true,
            restitution:1,
            friction:0,

            impulse:[math.rand(-v,v),math.rand(-v,v),math.rand(-v,v)],
            material:'chrome'
            //minCCD:0.0000001,
            //ccdMaxContact:true
            //rollingFriction:0.9,
        });
    }

}