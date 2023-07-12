let t 

demo = () => {

    phy.view({})

    // config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]} )

    phy.add({ type:'plane', visible:false });

    phy.addButton({ type:'box', pos:[-2.5,0,0], size:[3,1,2], radius:0.2, callback:ab1, text:'PUSH' })
    phy.addButton({ type:'cylinder', pos:[1,0,0], size:[1,0.8], radius:0.2, seg:32, callback:ab2, text:'O' })
    phy.addButton({ type:'cylinder', pos:[4,0,0], size:[1,0.4], radius:0.05, seg:6, callback:ab3, text:'X' })

    t = phy.addText({ text:'click on button', pos:[ 0,0,3 ], rot:[-90,0,0]})

    let i = 10
    while( i-- ) phy.add({ type:'box', pos:[-4.5+(i),3,0], size:[0.4,0.4,0.4], radius:0.02, density:1, material:'glassX' })

}

const ab1 = () => { t.set( 'button 1 !') }
const ab2 = () => { t.set( 'button 2 !') }
const ab3 = () => { t.set( 'button 3 !') }