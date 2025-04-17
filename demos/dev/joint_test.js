demo = () => {

    let b1, b2, pos, length;

    // view setting
    phy.view({ envmap:'blocky_photo_studio_1k', envblur: 0.5 });

    // config physics setting
    phy.set({ substep:4, gravity:[0,-9.81,0], jointVisible:true });

    // add static ground
    phy.add({ type:'plane', name:'floor', size:[50,1,50], visible:false });

    let g = phy.getGround()
    g.material.map = phy.texture({ url:'./assets/textures/grid.png', repeat:[60,60] });



    phy.material({ 
        name:'wall',  
        color:0x505050,
        map:phy.texture({ url:'./assets/textures/grid.png', repeat:[4,4], offset:[0.5,0.5] }) 
    })


    phy.add({ type:'box', pos:[0,2,-0.12], size:[4,4,0.2], restitution:0, friction:0, material:'wall'})

    // Distance joint OIMO / AMMO don't have good suport
    /*b1 = phy.add({ type:'sphere', size:[0.25], pos:[-2,0.25,2], mass:1, restitution:0.5, friction:0.9 });
    b2 = phy.add({ type:'sphere', size:[0.25], pos:[ 2,0.25,2], mass:1, restitution:0.5, friction:0.9 });
    phy.add({ type:'distance', b1:b1, b2:b2, limit:[1, 4], spring:[10,1], collision:true, pos1: [0.25,0,0], pos2:[-0.25,0,0] });*/

    let maxVelocity = [0.5,0.5]



    b1 = phy.add({ type:'box', size:[0.4], pos:[-1,3.8,0.2], mass:0, restitution:0.5, friction:0.9, maxVelocity:maxVelocity });
    b2 = phy.add({ type:'box', size:[0.4], pos:[-1,0.2,0.2], mass:1, restitution:0.5, friction:0.9, maxVelocity:maxVelocity });
    phy.add({ type:'distance', b1:b1, b2:b2, limit:[0.1, 0.2], spring:[30,10], collision:true, pos1: [0,-0.2,0], pos2:[0,0.2,0] });


    b1 = phy.add({ type:'box', size:[0.4], pos:[0,3.8,0.2], mass:0, restitution:0.5, friction:0.9, maxVelocity:maxVelocity });
    b2 = phy.add({ type:'box', size:[0.4], pos:[0,0.2,0.2], mass:1, restitution:0.5, friction:0.9, maxVelocity:maxVelocity });
    phy.add({ type:'distance', b1:b1, b2:b2, limit:[0.5, 1], spring:[10,1], collision:true, pos1: [0,-0.2,0], pos2:[0,0.2,0] });


    b1 = phy.add({ type:'box', size:[0.4], pos:[1,3.8,0.2], mass:0, restitution:0.5, friction:0.9, maxVelocity:maxVelocity });
    b2 = phy.add({ type:'box', size:[0.4], pos:[1,0.2,0.2], mass:1, restitution:0.5, friction:0.9, maxVelocity:maxVelocity });
    phy.add({ type:'distance', b1:b1, b2:b2, limit:[0.05, 0.3],  collision:true, pos1: [0,-0.2,0], pos2:[0,0.2,0] });

    

}