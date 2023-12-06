let decal = 0

demo = () => {

    phy.view({ distance:20, y:5, x:decal })

    phy.set({ substep:1, gravity:[0,-9.81,0] })

    //phy.add({ type:'plane' })
    phy.add({ type:'box', size:[50, 1, 50], pos:[decal,-0.5,0], visible:false })

    addStack({num:20, size:[1.0, 0.5, 1.0], mass:1000, margin:0 })

    //addTower({ radius:1.2, height:50, size:[0.5, 0.5, 0.8], detail:6 });

    phy.add({ type:'highSphere', name:'sphere', size:[0.2], pos:[decal,20,0], mass:0.1, restitution:0, friction:0.2, sleep:true })
    phy.setTimeout( run, 1000 )

};

run = () => {
    phy.change({ name:'sphere', wake:true })
}

addStack = ( o ) => {

    let data = [];

    let i = o.num || 10;
    let py = o.size[1]*0.5;
    let r = o.rotation || 0;
    let a = 180 / i;
    let m = o.margin || 0

    while(i--){

        data.push({
            radius:0.02,
           // instance:'boxbase',
            type:"box",
            size: o.size,
            pos:[decal,py,0],
            rot:[0,r,0],
            //rot  :[0,angle*(180 / Math.PI),0],
            //density:density,
            mass:o.mass || 1,
            restitution:0.0,
            friction:0.5,
            sleep:true,
        })

        py += o.size[1] + m;
        //r += a; 

    }

    phy.add(data)

}

addTower = ( o ) => {

    let data = [];

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
    let sx = o.size[0] || 1, sy = o.size[1] || 1, sz =  o.size[2] || radius * 6 / detail

    for(let j = 0; j < height; j++){
        for(let i = 0; i < detail; i++){

            rad = radius;
            angle = (Math.PI * 2 / detail * (i + (j & 1) * 0.5))
            px = tx + Math.cos(angle) * rad;
            py = (ty + sy + j * sy) - (sy*0.5)
            pz = tz - Math.sin(angle) * rad;

            data.push({
                instance:'boxbase',
                type:"box",
                //radius:0.02,
                size:[sx,sy,sz],
                pos:[px,py,pz],
                rot  :[0,angle*(180 / Math.PI),0],
                //density:density,
                mass:1,
                restitution:0.0,
                friction:0.5,
                sleep:true,
            })

            /*phy.add({
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
            });*/
        }
    }

    phy.add(data)
}