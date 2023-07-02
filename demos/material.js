const mat = {}

demo = () => {

    //phy.log('click to blast')

    phy.view({
        phi:30, theta:0, distance:4, x:0, y:0.4, z:0, fov:50, envmap:'lobe',
        groundColor:0x909090,
        groundReflect:0.1,
    })

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0] })

    // add static plane 
    //phy.add({ type:'plane', visible:false })
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    //makeMaterial()

    phy.load(['./assets/models/shaderBall.glb'], onComplete )

}

onComplete = () => {

    const models = phy.getMesh('shaderBall')

    models.ball_2.material = phy.getOneMaterial('black')//mat['black']

    console.log( models )

    const matName = [
    'body', 'sleep', 'solid', 'base', 'carGlass',
    'sleep', 'chrome', 'solid', 'glassX', 'carGlass',
    'simple', 'chrome', 'solid', 'glassX', 'carGlass',
    'simple', 'chrome', 'solid', 'glassX', 'carGlass',
    'simple', 'chrome', 'solid', 'glassX', 'carGlass',
    ]

    let n, m, mid
    let y = 3, yn=0, c = 0

    while(y--){
        n = 5
        while(n--){
            m = phy.add({
                type: 'convex', 
                mesh: models.ball_1,
                shape: models.ball_s,
                mass:1,
                material:matName[c+n],
                rot:[0,22.5,0],
                pos:[-2+(n), 0, -yn]
            })

            mid = models.ball_2.clone()
            m.add( mid )
        }
        c+=5
        yn++
    }

    

}

makeMaterial = () => {
    mat['black'] = phy.material({ type:'Physical', name:'black', color:0x222222, roughness: 0.5, metalness: 0.0 })
}