let n = 0

demo = () => {

    phy.view({ 
        envmap:'clear', ground:true,  groundSize:[ 14, 14 ],groundAlpha:false,
        phi:10, theta:0, distance:30, x:0, y:6, z:0, fov:60 
    })

    // config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]})

    // add static plane
    //
    phy.add({ type:'box', size:[15,3,15], pos:[0, -1.5, 0], visible:false,  friction:0.5, restitution:0 })
phy.add({ type:'plane', size:[300,1,300], pos:[0, -3, 0], visible:false })
    // Keva tower.
    let halfExtents = {x:0.15, y:0.5, z:2.0};

    let blockHeight = 0.0;
    // These should only be set to odd values otherwise
    // the blocks won't align in the nicest way.
    let numyArr = [0, 3, 5, 5, 7, 9];
    let numBlocksBuilt = 0;
    let i;

    for (i = 5; i >= 1; --i) {//5
        let numx = i;
        let numy = numyArr[i];
        let numz = numx * 3 + 1;
        let blockWidth = numx * halfExtents.z * 2.0;
        buildBlock( halfExtents,
            {x:-blockWidth / 2.0, y:blockHeight, z:-blockWidth / 2.0},
            numx, numy, numz,
        )
        blockHeight += numy * halfExtents.y * 2.0 + halfExtents.x * 2.0;
        numBlocksBuilt += numx * numy * numz;
    }

    // add dynamic sphere
    phy.add({ type:'highSphere', name:'sphere', size:[2], pos:[0,50,0], density:40, restitution:0.2, friction:0.2, sleep:false })


}

buildBlock = ( halfExtents, shift, numx, numy, numz ) => {

    let option = {
        density:0.1, margin:0.001, friction:0.5, restitution:0, sleep:true, radius:0.04, 
        sizeByInstance:true,
        startSleep:true,
    }

    let half_extents_zyx = {x: halfExtents.z, y: halfExtents.y, z: halfExtents.x};
    let dimensions = [halfExtents, half_extents_zyx];
    let blockWidth = 2.0 * halfExtents.z * numx;
    let blockHeight = 2.0 * halfExtents.y * numy;
    let spacing = (halfExtents.z * numx - halfExtents.x) / (numz - 1.0);

    let i;
    let j;
    let k;

    for (i = 0; i < numy; ++i) {
        [numx, numz] = [numz, numx];
        let dim = dimensions[i % 2];
        let y = dim.y * i * 2.0;

        for (j = 0; j < numx; ++j) {
            let x = i % 2 == 0 ? spacing * j * 2.0 : dim.x * j * 2.0;

            for (k = 0; k < numz; ++k) {
                let z = (i % 2) == 0 ? dim.z * k * 2.0 : spacing * k * 2.0;
                // Build the rigid body.
                //phy.add({ type:'box', size:[dim.x, dim.y, dim.z], pos:[(x + dim.x + shift.x)*0.5, (y + dim.y + shift.y)*0.5, (z + dim.z + shift.z)*0.5], density:1, margin:0.001, radius:0.01  })
                phy.add({ instance:'keva', type:'box', size:[dim.x, dim.y, dim.z], pos:[(x + dim.x + shift.x)*0.5, (y + dim.y + shift.y)*0.5, (z + dim.z + shift.z)*0.5], ...option  })
                n++
            }
        }
    }

    // Close the top.
    let dim = {x: halfExtents.z, y: halfExtents.x, z: halfExtents.y};

    for (i = 0; i < blockWidth / (dim.x * 2.0); ++i) {
        for (j = 0; j < blockWidth / (dim.z * 2.0); ++j) {
            // Build the rigid body.
            //phy.add({ type:'box', size:[dim.x, dim.y, dim.z], pos:[(i * dim.x * 2.0 + dim.x + shift.x)*0.5, (dim.y + shift.y + blockHeight)*0.5, (j * dim.z * 2.0 + dim.z + shift.z)*0.5], density:1, margin:0.001, radius:0.01 })
           
            phy.add({ 
                instance:'keva', 
                type:'box', 
                size:[dim.x, dim.y, dim.z], 
                pos:[(i * dim.x * 2.0 + dim.x + shift.x)*0.5, (dim.y + shift.y + blockHeight)*0.5, (j * dim.z * 2.0 + dim.z + shift.z)*0.5],
                ...option 
            })
            n++
        }
    }

}


