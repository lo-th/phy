const mat = {}
const mod = 'shaderBall'

demo = () => {

    phy.log('Material test')

    phy.view({
        phi:30, theta:0, distance:4, x:0, y:0.4, z:0, fov:50, envmap:'bed',
        envBlur:0.15,
        //roundColor:0x909090,
        groundReflect:0.3,
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

    const ao = models.ball_1.material.aoMap;

    models.ball_2.material = phy.getMat('black');
    models.ball_2.material.aoMap = ao;
    models.ball_2.receiveShadow = true

    models.ball_3.material = phy.getMat('silver');
    models.ball_3.material.aoMap = ao;
    models.ball_3.receiveShadow = true

    //console.log( models )

    const matName = [
    'body', 'sleep', 'solid', 'base', 'carbon',
    'chrome', 'silver', 'titanium', 'gold', 'copper',
    'sand', 'concrete', 'brick', 'glassX', 'carGlass',
    'clayWhite', 'chrome', 'clay', 'glassX', 'carGlass',
    ]

    let n, m, mid, logo
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
                pos:[-2+(n), 0, -yn],
            })


            m.children[0].material.aoMap = ao;

            mid = models.ball_2.clone()
            m.add( mid )
            logo = models.ball_3.clone()
            m.add( logo )
        }
        c+=5
        yn++
    }

    phy.load(['./assets/models/palette.glb'], onComplete2 );

}

onComplete2 = () => {

    const models = phy.getMesh('palette')
    let m = models.palette;

    /*
    // test basic material
    const mat = phy.material({type:'basic', map:m.material.map })
    m.children[0].children[0].material = mat
    m.children[1].children[0].material = mat
    */

    console.log(m)

    m.castShadow = true
    m.receiveShadow = false;
    m.position.set(0,0.3125,1.2)
    phy.add(m)

    phy.setColorChecker( m );

}