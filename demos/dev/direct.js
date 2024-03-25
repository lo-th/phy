demo = () => {

    phy.view({
        phi:12, theta:0, distance:5, x:0, y:3, z:15, fov:60, 
        envmap:'clear', envblur: 0.5, //background:0x101010,
        groundReflect:0.05, groundColor:0x808080,
    })
    
    // config physics setting
    phy.set( {
        substep:1, 
        gravity:[0,-9.81,0],
        jointVisible:false,
        full:true,
    })

    phy.load(['./assets/models/box_test.glb'], onComplete )


}

onComplete = () => {

    const scene = phy.getGlb('box_test');

    console.log(scene)

}