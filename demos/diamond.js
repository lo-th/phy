let diams = 100
let mat = {}

demo = () => {

    phy.view({
        envmap:'lobe', envblur: 0.5
    })

    // config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]})

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })

    // add box containe
    let w = 6, h = 10, d = 10, g = 1
    const def = { type:'box', visible:false, material:'debug' }
    phy.add({ size:[w,h,g], pos:[0,h*0.5,d*0.5], ...def })
    phy.add({ size:[w,h,g], pos:[0,h*0.5,-d*0.5], ...def })
    phy.add({ size:[g,h,d-g], pos:[(w*0.5)-(g*0.5),h*0.5,0], ...def })
    phy.add({ size:[g,h,d-g], pos:[(g*0.5)-(w*0.5),h*0.5,0], ...def })
    phy.add({ size:[w,g*2,d], pos:[0,-g,0], ...def })

    phy.load( './assets/models/diamond.glb', onComplete )

}

onComplete = () => {

    const bodys = []
    const list = phy.getMesh('diamond')
    let n = 0, m,  b, rand = math.rand, d = []

    // create material
    for( let m in list ){

        mat[m] = new Diamond({
            color: n===0 ? 0xffffff : rand( 0x606060, 0xffffff ),
            name: 'diams_' + m,
        },{
            geometry:list[m].geometry
        })

        d.push( m )

        //phy.material( mat[m] )

        phy.addMaterial( mat[m], true )

        n++

    }

    // add convex
    n = diams;
    while( n-- ){

        m = d[math.randInt(0, d.length-1)]
        b = phy.add({
            type:'convex',
            shape: list[m].geometry,
            material: mat[m],
            pos:[rand(-1,1), (n*2) + rand(3,20), rand(-1,1)],
            rot:[rand(0,360), rand(0,360), rand(0,360)],
            size:[rand(10,30)],
            density:1,
        })

        bodys.push( b )

    }

    var sparkle = new Sparkle({ objectList:bodys, controler:Main.getControler(), num:2 })
    phy.addDirect( sparkle )

}

onReset = () => {

    for(let m in mat) mat[m].dispose()
        
}