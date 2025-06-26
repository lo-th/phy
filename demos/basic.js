demo = () => {

    phy.view({ envmap:'river', theta:-100, reflect:0.25 })

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0], fps:60, worldScale:0.5 })

    // add static ground box
    phy.add({ type:'box', size:[100,4,100], pos:[0, -2, 0], restitution:0.2, visible:false })

    begin()

}

begin = () => {

    let s = math.rand(0.1,0.3)
    let h = math.randInt(5,15)
    let l = math.randInt(5,10)
    let d = math.randInt(5,10)

    let top = (h*s)+(0.4*2)

    phy.add({ type:'highSphere', name:'sphere', size:[0.4], pos:[0,top,0], density:5, restitution:0.8, friction:0.2, sleep:true, material:'chrome' })

    
    createBuilding({ block:s, height:h, length:l, deep:d })
    phy.setTimeout( activeSphere, 2000 );

}

activeSphere = () => {

    phy.change({ name:'sphere', wake:true, force:[0,-0.0001,0] })
    phy.setTimeout( clear, 10000 )

}

createBuilding = ( o ) => {

    let tmp = [];
    let i, j, k, pos;
    let s = o.block || 1;
    let space = o.space || 0;
    let d = s + space;
    let x = o.length || 6, y = o.height || 10, z = o.deep || 6;

    let dx = - ((x*0.5) * d) + (d*0.5);
    let dz = - ((z*0.5) * d) + (d*0.5);

    for(k = 0; k<y; k++){
    for(j = 0; j<z; j++){
    for(i = 0; i<x; i++){
        pos = [ i*d + dx, (k*d + d)-(s*0.5), j*d + dz ]
        
        tmp.push({
            instance:'boxbase',
            type:'box',
            radius:0.02,
            size:[s,s,s],
            pos:pos,
            density:0.3,
            friction:0.4,
            restitution:0.1,
            sleep:true,
        })
        
    }}}
 
    phy.add(tmp)

}

clear = () => {

    phy.remove('boxbase')
    phy.remove('sphere')
    phy.setTimeout( begin, 1000 )

}

