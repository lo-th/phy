const mat = {}
const mod = 'shaderBall'

demo = () => {

    phy.log('Material test')

    phy.view({
        phi:30, theta:0, distance:4, x:0, y:0.4, z:0, fov:50, envmap:'lobe',
        //roundColor:0x909090,
        groundReflect:0.1,
    })

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0] });

    // add static plane 
    //phy.add({ type:'plane', visible:false })
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false });

    phy.load(['./assets/models/'+mod+'.glb'], onComplete );

}

onComplete = () => {

    const models = phy.getMesh(mod)

    models.ball_2.material = phy.getMat('black');
    models.ball_2.receiveShadow = true

    //console.log( models )

    const matName = [
    'body', 'sleep', 'solid', 'base', 'carbon',
    'chrome', 'gold', 'copper', 'glassX', 'carGlass',
    'simple', 'chrome', 'solid', 'glassX', 'carGlass',
    'simple', 'chrome', 'solid', 'glassX', 'carGlass',
    'simple', 'chrome', 'solid', 'glassX', 'carGlass',
    ]

    let n, m, mid
    let y = 2, yn=0, c = 0

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

    phy.load(['./assets/models/palette.glb'], onComplete2 );

}

onComplete2 = () => {

    const models = phy.getMesh('palette')
    let m = models.palette;

    m.position.set(0,0.3125,1.2)
    phy.add(m)

    phy.setColorChecker( m );

}