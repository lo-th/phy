demo = () => {

    phy.view({
        distance:20
    })

    phy.set({ substep:1, gravity:[0,-9.81,0] })

    phy.add({ type:'plane', size:[300,1,300], visible:false });

    phy.add({ 
        type:'highSphere', size:[2], pos:[0,2,-10], 
        mass:5,
        //density:0.1,
        impulse:[0,0,80] 
    });

    let i = 100, d = 0, l=0;
    let pos = [0, 0, 0];
    let line = 10;
    let maxLine = Math.round( i / line );
    let decalX = -((maxLine*0.5)*2)+1

    while(i--){ 
        pos = [decalX + d*2, 0.5 + l*1, 0]
        if(l%2 == 0) pos[0] += 0.5
        else pos[0] -= 0.5
        phy.add({ 
            type:'box', size:[2,1,0.5], pos:pos, radius:0.1,
            mass:2,
            //density:1, 
            massInfo:i===0,
            //damping:[0.05, 0.05],
            //maxVelocity:[100,100], 
            //penetrationVelocity:1,

        });
        d++
        if(d===maxLine){ 
            d = 0
            l++
        }
    }

}