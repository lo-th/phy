demo = () => {

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0] })

    // add static plane 
    phy.add({ type:'plane', visible:false })

    phy.add({ name:'ball1', type:'sphere', density:35, state:4, size:[0.5], pos:[0,60,0], friction:0.5, ccdThreshold:0.00001, material:'chrome' })




    phy.material({ name:'B', color:0xFFFFFF, roughness: 0.6, metalness: 0.3, 
        map:phy.texture({ url:'./assets/textures/wood_c.jpg', repeat:[2,2] }),
        normalMap:phy.texture({ url:'./assets/textures/wood_n.jpg', repeat:[2,2] }) 
    })

    phy.add({ name:'boom', type:'box', density:1, size:[2,4,2], pos:[0,2,0], friction:0.5, breakable:true, material:'B', autoUV:true });
    //phy.add({ name:'boom', type:'cylinder', density:1, size:[1,4,1], pos:[0,2,0], friction:0.5, breakable:true, material:'B', autoUV:true });

    /*phy.add({ name:'ball2', type:'sphere', mass:35, state:4, size:[1], pos:[0,300,0], friction:0.5, ccdThreshold:0.00001 });
    phy.add({ name:'ball3', type:'sphere', mass:35, state:4, size:[1], pos:[0,1000,0],  friction:0.5, ccdThreshold:0.00001 });


    let y = 1;

    for(let i = 0; i < 5; i++ ){

        phy.add({ name:'b1'+i, type:'box', radius:0.1, size:[2, 2, 2], pos:[5,y,5], rot:[0,0,0], mass:100, state:2, margin:0.05  });
        phy.add({ name:'b2'+i, type:'box', radius:0.1, size:[2, 2, 2], pos:[5,y,-5], rot:[0,0,0], mass:100, state:2, margin:0.05  });
        phy.add({ name:'b3'+i, type:'box', radius:0.1, size:[2, 2, 2], pos:[-5,y,5], rot:[0,0,0], mass:100, state:2, margin:0.05  });
        phy.add({ name:'b4'+i, type:'box', radius:0.1, size:[2, 2, 2], pos:[-5,y,-5], rot:[0,0,0], mass:100, state:2, margin:0.05 });
        y+=1.1;

        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
        phy.add({ 
            name:'glass'+i, type:'box', size:[12, 0.2, 12], pos:[0,y,0], rot:[0,0,0], mass:50, material:'glass', 
            breakable:true, breakOption:[ 200, 1, 3, 2 ],
            margin: 0.05,
            //
            //ccdRadius:0.1,
        });
        y+=1.1;
    }*/

}

