demo = () => {
    // config physics setting
    phy.set({ substep:4, gravity:[0,-9.81,0], fps:60 })
    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })
    // load logo model
    phy.load(['./assets/models/phy.glb'], onComplete )

}

function onComplete(){

    model = phy.getMesh('phy', true);
    let option = {
        density:1, restitution:0.5, friction:0.5, radius:0.03
    }

    

    // add phy logo
    const logoShape = []
    let p = [0,0,0,31.685,16,0,-31.685,16,0,28.547,25.779,0,28.547,6.221,0,-28.547,25.779,0,-28.547,6.221,0,19.755,-1.621,
    0,7.051,-5.973,0,19.755,33.621,0,7.051,37.973,0,-19.755,-1.621,0,-7.051,-5.973,0,-21.92,32.371,0]
    let s = [8,86,8,8,13,8,8,13,8,8,13,8,8,13,8,8,13,8,8,13,8,8,14.5,8,8,15.5,8,8,14.5,8,8,15.5,8,8,14.5,8,8,15.5,8,8,9,8]
    let r = [0,0,0,0,0,0,0,0,0,0,0,35,0,0,-35,0,0,-35,0,0,35,0,0,-60,0,0,-80,0,0,60,0,0,80,0,0,60,0,0,80,0,0,-60]
    p = math.vecMul(p,0.05)
    s = math.vecMul(s,0.05)
    let i=14, j=0, n=0;
    while(i--){ n = j*3; logoShape.push({ type:'box', pos:[p[n],p[n+1],p[n+2]], size:[s[n],s[n+1],s[n+2]], rot:[r[n],r[n+1],r[n+2]] }); j++; }

    phy.add({
        type:'compound',
        shapes:logoShape,
        pos:[ 0,43*0.05,0 ],
        mesh:model.logo,
        meshSize:5,
        ...option
    })

    // add some dynamics object

    i = 20;

    while( i-- ){
        let vx = math.rand( -0.02, 0.02 )
        let vz = math.rand( -0.02, 0.02 )
        // phy.add can be a array
        phy.add([
            { instance:'A', type:'box', size:[1,0.2,1], pos:[0,5+(i*0.5),-2], ...option },
            { instance:'B', type:'sphere', size:[0.2], pos:[3.5+vx,5+(i*0.5),vz-0.5], ...option },
            { instance:'C', type:'cylinder', size:[0.4, 0.2], pos:[-2.5,5+(i*0.5),0], ...option },
            { instance:'D', type:'capsule', size:[0.1, 0.2], pos:[3-vx,5+(i*0.5),2+vz], ...option },
            { instance:'E', type:'cone', size:[0.2, 0.4], pos:[-3,5+(i*0.5),2], ...option }
        ])   
    }

}