const max = 600;
let saving = []
let g1 = 1 << 6 // 64
    let g2 = 1 << 7 // 128
    let g3 = 1 << 8 // 256

demo = () => {

    phy.view({ envmap:'room', envblur:0.5, d:20, theta:45, phi:25, reflect:0.25 })

    // config physics setting
    phy.set({ substep:4, gravity:[0,-9.81,0] })

    // add static ground box
    phy.add({ type:'box', size:[100,4,100], pos:[0, -2, 0], restitution:0.2, visible:false })

    addGui()

    initCar()

    //phy.load(['./assets/models/coin.glb'], begin );

}

const addGui = () => {

    gui = phy.gui();
    /*gui.add('grid',{ values:['SAVE', 'RESTOR'], selectable:false, radius:6 }).onChange( (n)=>{
        if(n==='SAVE') save()
        if(n==='RESTOR') begin(saving)
    } );*/

}

initCar = () => {



    let chassie = phy.add({ name:'frame', type:'box', size:[12,1,24], pos:[0,0.3,0], mass:1000, restitution:0, friction:0, group:g1, mask:2|g1 })

    const flWheel = CreateWheel([5, 0, 8], 0);
    const flAxle = CreateAxle([5, 0, 8], 0);
    const frWheel = CreateWheel([-5, 0, 8], 1);
    const frAxle = CreateAxle([-5, 0, 8], 1);
    const rlWheel = CreateWheel([5, 0, -8], 2);
    const rlAxle = CreateAxle([5, 0, -8], 2);
    const rrWheel = CreateWheel([-5, 0, -8], 3);
    const rrAxle = CreateAxle([-5, 0, -8], 3);

}


CreateWheel = ( pos, id ) => {

    return phy.add({ name:'W'+id, type:'cylinder', size:[2,1.6], rot:[0,0,90], pos:pos, mass:100, restitution:0.1, friction:50, group:g1, mask:2, material:'debug' })

}

CreateAxle = ( pos, id ) => {

    return phy.add({ name:'A'+id, type:'box', size:[1,2.5,1], pos:pos, mass:100, restitution:0, friction:0, group:g1, mask:2 })

}