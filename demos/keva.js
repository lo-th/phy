let n = 0

demo = () => {

    phy.view({ 
        exposure:0.6,
        envmap:'photo', envFloor:true,
        ground:true, groundSize:[ 15, 15 ], groundAlpha:false,
        groundPos:[0,0.01,0], 
        groundReflect:0.8, groundColor:0xc9c8c7,
        phi:6, theta:0, distance:22, x:0, y:6, z:0, fov:60,
        envblur: 0.0, 
        //fogexp:0.03, 
        //fogColor:0x000000,
        envPower:0.25,
    })

    // config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]});

    // add static plane
    //
    phy.add({ type:'box', size:[15,1,15], pos:[0, -0.5, 0], visible:true,  friction:0.5, restitution:0, material:'base' })
    phy.add({ type:'plane', size:[200,1,200], pos:[0, -1, 0], visible:true, material:'shadow' })

    // add wood material
    phy.material({ 
        name:'wood', color:0xFFFFFF, roughness: 1, metalness: 0, //color:0x8cc0e5,
        map:phy.texture({ url:'./assets/textures/wood2_c.jpg', repeat:[1,1], srgb:true }),
        normalMap:phy.texture({ url:'./assets/textures/wood2_n.jpg', repeat:[1,1] }),
        roughness:0.9, normalScale:[0.4,-0.4],
    })
    // Keva tower.
    let halfExtents = {x:0.15, y:0.5, z:2.0};

    let blockHeight = 0.0, numBlocksBuilt = 0;
    let numyArr = [0, 3, 5, 5, 7, 9];
    let i;

    for ( i = numyArr.length-1; i >= 1; --i ) {
        let numx = i;
        let numy = numyArr[i];
        let numz = numx * 3 + 1;
        let blockWidth = numx * halfExtents.z * 2.0;
        buildBlock( halfExtents, {x:-blockWidth / 2.0, y:blockHeight, z:-blockWidth / 2.0}, numx, numy, numz );
        blockHeight += numy * halfExtents.y * 2.0 + halfExtents.x * 2.0;
        numBlocksBuilt += numx * numy * numz;
    }

    //console.log(numBlocksBuilt)

    // add dynamic sphere
    //phy.add({ type:'highSphere', name:'sphere', size:[2], pos:[0,50,0], density:40, restitution:0.2, friction:0.2, sleep:false })


}

buildBlock = ( halfExtents, shift, numx, numy, numz ) => {

    const list = []

    let option = {
        instance:'keva',
        type:'box',
        friction:0.5, restitution:0.0, sleep:true, radius:0.01,
        density:0.1,
        //mass:1,//0.02,
        // margin:0.001, friction:0.2, restitution:0.1, sleep:true, radius:0.02, 
        //sizeByInstance:true,
        startSleep:true,
        material:'wood',
    }

    let half_extents_zyx = {x: halfExtents.z, y: halfExtents.y, z: halfExtents.x};
    let dimensions = [halfExtents, half_extents_zyx];
    let blockWidth = 2.0 * halfExtents.z * numx;
    let blockHeight = 2.0 * halfExtents.y * numy;
    let spacing = (halfExtents.z * numx - halfExtents.x) / (numz - 1.0);

    let i,j,k, dim;

    for (i = 0; i < numy; ++i) {
        [numx, numz] = [numz, numx];
        dim = dimensions[i % 2];
        let y = dim.y * i * 2.0;

        for (j = 0; j < numx; ++j) {
            let x = i % 2 == 0 ? spacing * j * 2.0 : dim.x * j * 2.0;

            for (k = 0; k < numz; ++k) {
                let z = (i % 2) == 0 ? dim.z * k * 2.0 : spacing * k * 2.0;
                // Build the rigid body.
                //phy.add({ type:'box', size:[dim.x, dim.y, dim.z], pos:[(x + dim.x + shift.x)*0.5, (y + dim.y + shift.y)*0.5, (z + dim.z + shift.z)*0.5], density:1, margin:0.001, radius:0.01  })
                list.push({ 
                    size:[dim.x, dim.y, dim.z],
                    pos:[(x + dim.x + shift.x)*0.5, (y + dim.y + shift.y)*0.5, (z + dim.z + shift.z)*0.5],
                    ...option
                })
                n++
            }
        }
    }

    // Close the top.
    dim = {x: halfExtents.z, y: halfExtents.x, z: halfExtents.y};

    for (i = 0; i < blockWidth / (dim.x * 2.0); ++i) {
        for (j = 0; j < blockWidth / (dim.z * 2.0); ++j) {
            // Build the rigid body.
            //phy.add({ type:'box', size:[dim.x, dim.y, dim.z], pos:[(i * dim.x * 2.0 + dim.x + shift.x)*0.5, (dim.y + shift.y + blockHeight)*0.5, (j * dim.z * 2.0 + dim.z + shift.z)*0.5], density:1, margin:0.001, radius:0.01 })
           
            list.push({ 
                size:[dim.x, dim.y, dim.z], 
                pos:[(i * dim.x * 2.0 + dim.x + shift.x)*0.5, (dim.y + shift.y + blockHeight)*0.5, (j * dim.z * 2.0 + dim.z + shift.z)*0.5],
                ...option
            })
            n++
        }
    }

    // change size to rotation 
    i = list.length
    while(i--){
        if( list[i].size[0] === halfExtents.z ){
            if( list[i].size[1] === halfExtents.y ) list[i].rot = [0,90,0];
            else list[i].rot = [90,90,0];
            list[i].size = [halfExtents.x, halfExtents.y, halfExtents.z]
        }
        if( list[i].size[1] === halfExtents.z ){
            if( list[i].size[0] === halfExtents.x ) list[i].rot = [90,0,0];
            else list[i].rot = [90,0,90];
            list[i].size = [halfExtents.x, halfExtents.y, halfExtents.z]
        }
    }


    phy.add( list )
    

}


