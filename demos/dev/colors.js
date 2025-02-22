demo = () => {
    
    //phy.log('use key WSAD or ZSQD<br>SPACE to handbrake')

    phy.view({ envmap:'clear', ground:true, distance:3, phi:20, y:1 })

    phy.useRealLight( {} );

    phy.set( {substep:1, gravity:[0,-9.81,0], key:true })

    phy.add({ type:'plane', name:'floor', size:[20,1,20], visible:false, friction:1.0 });

    phy.load(['./assets/models/color_wheel.glb'], onComplete )

}

onComplete = () => {

    let scene = phy.getGlb('color_wheel', true)
    phy.add(scene)

}