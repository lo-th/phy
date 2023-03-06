demo = () => {

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0], ccd:true })

    // add static plane 
    phy.add({ type:'plane', visible:false })

    phy.add({ type:'box', size:[10,1,16], pos:[0,1,0], rot:[0,0,0], mass:0});
    phy.add({ type:'box', size:[0.5,7,16], pos:[-5.25,4,0], rot:[0,0,0], mass:0});
    phy.add({ type:'box', size:[0.5,7,16], pos:[5.25,4,0], rot:[0,0,0], mass:0});

    phy.add({ type:'box', size:[11,0.5,16], pos:[0,7.75,0], rot:[0,0,0], mass:0});
    // box filter
    phy.add({ type:'box', size:[10,6,2], pos:[0,4.5,-7], rot:[0,0,0], mass:0 });

    phy.setTimeout( launchBullet, 4000 )

}


launchBullet = () => {

    var i = 50, r = 0.2, d = 0.4, x;
    while(i--){
        x = math.rand(-4,4);
        phy.add({ 
            type:'capsule', size:[r,r*2,r], pos:[x, 5 ,100+(i*3)], mass:1, linearVelocity:[0,0,-1000],
            ccdThreshold:0.0000001,
            ccdRadius:0.1,
            enableCCD:true,
            //minCCD:0.0000001,
            //ccdMaxContact:true
            //rollingFriction:0.9,
        });
    }

}