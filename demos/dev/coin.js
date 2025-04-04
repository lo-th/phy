const max = 600;
let saving = []


demo = () => {

    phy.view({ envmap:'room', envblur:0.5, d:20, theta:45, phi:25, reflect:0.25 })

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0] })

    // add static ground box
    phy.add({ type:'box', size:[100,4,100], pos:[0, -2, 0], restitution:0.2, visible:false })

    addGui()

    phy.load(['./assets/models/coin.glb'], begin );

}

const addGui = () => {

    gui = phy.gui();
    gui.add('grid',{ values:['SAVE', 'RESTOR'], selectable:false, radius:6 }).onChange( (n)=>{
        if(n==='SAVE') save()
        if(n==='RESTOR') begin(saving)
    } );

}

begin = ( savePos = null ) => {

    const m = phy.getMesh('coin', true);
    m.coin.material.normalScale.set(-1, -1)


    let h = 0.05
    let r = 0.36
    //let deff = { instance:'COIN', type:'cylinder', size:[r, h], density:1,seg:8 }
    let deff = { instance:'COIN', type:'cylinder', size:[r, h], density:1, seg:8, mesh:m.coin }


    

    let i = max, x, y, z, n=0
    while(i--){
        
        y = i*h
        if(savePos){

            phy.add({ ...deff, name:'ccc'+n, pos:savePos[n][0], quat:savePos[n][1] })

        } else {
            x = math.rand(-5,5)
            z = math.rand(-5,5)
            phy.add({ ...deff, name:'ccc'+n, pos:[x,y,z] })
        }
        n++
    }

}

save = () => {

    saving = []

    let i = max, item, p, q,  n = 0;
    while(i--){
        item = phy.byName('ccc'+n)
        saving.push([ item.position.toArray(), item.quaternion.toArray() ])
        n++;
    }


    phy.remove('COIN')

}