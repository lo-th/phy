demo = () => {

    phy.view({ distance:12, y:4 });

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0] })

    // add static ground plane 
    phy.add({ type:'plane', visible:false })

    // add box container without up face 
    let h = 8
    phy.add({ type:'container', material:'debug', size:[4,h,4,0.2], pos:[0,h*0.5,0], friction:0, restitution:1, intern:true, remplace:true, face:{up:0} });

    // basic convex geometry
    const bc = new THREE.DodecahedronGeometry(0.25)

    // finally add body soup
    const density = 1
    const gap = 0.02
    let i = 200

    while(i--) {
        phy.add({ instance:'a1', type:'box', size:[0.5,0.5,0.5], rot:[0,0,0], pos:[-1-(gap*2), 5+i, 0], density:density })
        phy.add({ instance:'a2', type:'sphere', size:[0.25], pos:[-0.5-gap, 5+i, 0], density:density })
        phy.add({ instance:'a3', type:'cylinder', size:[0.25,0.5], pos:[0, 5+i, 0], density:density })
        phy.add({ instance:'a4', type:'capsule', size:[0.25,0.25], pos:[0.5+gap, 5+i, 0], density:density })
        phy.add({ instance:'a5', type:'convex', shape:bc, pos:[1+(gap*2), 5+i, 0], density:density })
    }

}