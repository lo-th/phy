demo = () => {

    phy.set({ substep:1, gravity:[0,-9.81,0] })

    phy.add({ type:'plane' })

    phy.add({ type:'highSphere', name:'sphere', size:[0.50], pos:[2,6,0], density:5, restitution:0.2, friction:0.2, sleep:true })

    addTower({ radius:1, height:25, size:[0.1, 0.2], detail:18, pos:[2,0,0] });
    addTower({ radius:1, height:25, size:[0.1, 0.2], detail:18, pos:[-2,0,0] });

    phy.setTimeout( run, 1000 )

};

run = () => {
    // phy.up is use for direct outside update
    phy.change({ name:'sphere', wake:true })
}

addTower = ( o ) => {

    let tx, ty, tz;
    let detail =  o.detail === "undefined" ? 10 : o.detail;
    let density =  o.density === "undefined" ? 1 : o.density;

    if(o.pos){
        tx = o.pos[0]; ty = o.pos[1]; tz = o.pos[2]
    } else {
        tx = ty = tz = 0;
    }

    let px, py, pz, angle, rad
    let radius = o.radius || 1
    let height = o.height || 1
    let sx = o.size[0] || 1, sy = o.size[1] || 1, sz = radius * 6 / detail

    for(let j = 0; j < height; j++){
        for(let i = 0; i < detail; i++){

            rad = radius;
            angle = (Math.PI * 2 / detail * (i + (j & 1) * 0.5))
            px = tx + Math.cos(angle) * rad;
            py = (ty + sy + j * sy) - (sy*0.5)
            pz = tz - Math.sin(angle) * rad

            phy.add({
                instance:'boxbase',
                type:"box",
                radius:0.02,
                size:[sx,sy,sz],
                pos:[px,py,pz],
                rot  :[0,angle*(180 / Math.PI),0],
                //density:density,
                mass:0.1,
                restitution:0.6,
                friction:0.4,
                sleep:true,
                startSleep:true,
            });
        }
    }
}