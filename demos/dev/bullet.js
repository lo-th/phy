demo = () => {

    // config physics setting
    phy.set({ substep:1, gravity:[0,0,0], ccd:true })

    // add static plane 
    phy.add({ type:'plane', visible:false })

    phy.add({ type:'container', material:'debug', size:[4,4,4,0.2], pos:[0,2.5,0], friction:0, restitution:1, remplace:false });

    phy.setTimeout( launchBullet, 100, true );

}


launchBullet = () => {

    var i = 400, r = 1, d = 0.4, x;
    let v = 0.1, tmp = []
    while(i--){
        x = math.rand(-2+0.25,2-0.25);
        y = 2.5 + math.rand(-2+0.25,2-0.25);
        z = math.rand(-2+0.25,2-0.25);
        tmp.push({ 
            type:'sphere', 
            instance:'sphereBase',
            size:[math.rand(0.05,0.2)], 
            //pos:[x, y ,z], 
            pos:[math.rand(-r,r), 2+math.rand(-r,r) ,math.rand(-r,r)], 
            mass:0.1, 
            //density:1,
            //linearVelocity:[0,0,-1000],
            //ccdThreshold:0.0000001,
            //ccdRadius:0.1,
            enableCCD:true,
            restitution:1,
            friction:0,

            //impulse:[math.rand(-v,v),math.rand(-v,v),math.rand(-v,v)],
            material:'carbon',
            maxVelocity:[10,100],
            penetrationVelocity:3,
            //linearFactor:[0.9,0.9,0.9],
            //minCCD:0.0000001,
            //ccdMaxContact:true
            //rollingFriction:0.9,
        });

        
    }
    phy.add(tmp)

}