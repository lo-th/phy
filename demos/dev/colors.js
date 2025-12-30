demo = () => {
    
    //phy.log('use key WSAD or ZSQD<br>SPACE to handbrake')

    phy.view({ envmap:'point', ground:true, distance:1.5, phi:80, y:0 })

    phy.useRealLight( {} );

    phy.set({ substep:1, gravity:[0,-9.81,0], key:true })

    phy.add({ type:'plane', name:'floor', size:[20,1,20], visible:false, friction:1.0 });

    phy.load(['./assets/models/color_wheel.glb'], onComplete )

}

onComplete = () => {

    let scene = phy.getGlb('color_wheel', true)
    scene.traverse(( child ) => {
        if ( child.isMesh ) child.material.toneMapped = false
    })
    phy.add(scene)

}