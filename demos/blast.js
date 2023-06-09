const Values = {
    density:0.3,
    friction:0.5,
    restitution:0,
    //sleep:true,
    //startSleep:true,
}

demo = () => {

    //phy.log('click to blast')

    phy.view({
        phi:-12.5, theta:0, distance:9, x:0, y:3, z:0, fov:70,//envmap:'render',
    })

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0] })

    // add static plane 
    //phy.add({ type:'plane', visible:false })
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

   
    
    //building({ block:0.4, height:8, length:4, deep:4, pos:[-4,0,0] })
    //building({ block:0.4, height:8, length:4, deep:4, pos:[4,0,0] })

    phy.mouseMode('blast', { visible:true, radius:4, power:0.2 })

    phy.load(['./assets/models/arch.glb'], onComplete )

}

onComplete = () => {

    const models = phy.getMesh('arch')
    buildArch({ block:0.4, height:16, length:4, deep:4, pos:[0,3.2,0] }, models )
    // creat building
    building({ block:0.4, height:8, length:4, deep:4, pos:[-2.037,0,0] }, models)
    building({ block:0.4, height:8, length:4, deep:4, pos:[2.037,0,0] }, models)

    phy.add({ type:'box', size:[0.05,4,1.2], pos:[2.862, 2, 0], visible:false })
    phy.add({ type:'box', size:[0.05,4,1.2], pos:[-2.862, 2, 0], visible:false })

    //phy.add({ type:'highSphere', name:'sphere', size:[1], pos:[0.8,1,-2], density:1, restitution:0.2, friction:0.2, sleep:true, startSleep:true, material:'chrome' })

}

building = ( o, models ) => {

    let scale = 1

    const tmp = []
    let i, j, k, pos;
    let s = o.block || 1;
    let space = o.space || 0//0.06;
    let d = s + space;
    let x = o.length || 6, y = o.height || 10, z = o.deep || 6;

    let dx = - ((x*0.5) * d) + (d*0.5);
    let dz = - ((z*0.5) * d) + (d*0.5);

    for(k = 0; k<y; k++){
    for(j = 0; j<z; j++){
    for(i = 0; i<x; i++){
        pos = math.addArray (o.pos, [ i*d + dx, (k*d + d)-(s*0.5), j*d + dz ])
        tmp.push({
            ...Values,
            instance:'boxbase',
            type:'box',
            //radius:0.1,// box chanfer
            size:[s,s,s],
            pos:pos,
            mesh: models ? models.box_0:null,
            meshScale:[scale,scale,scale]
        })
    }}}

    phy.add(tmp)

}

buildArch = ( o, models ) => {

    const tmp = []

    let scale = 1

    let i, j, k, g, g2, pos, rot, name;

    const model = []
    let names = ['arc_0', 'arc_1', 'arc_2', 'arc_3']
    let mesh = ['m_0', 'm_1', 'm_2', 'm_3']
    let dist = [ 1.434, 1.832, 2.23, 2.628 ]

    for(i=0; i<names.length; i++){
        name = names[i]
        
        model.push({  
            instance:name,
            type:'convex', 
            shape:models[name].geometry, 
            mesh:models[mesh[i]].geometry,
            meshScale:[scale,scale,scale],
            shapeScale:[scale,scale,scale],
        })
    }

    let angleInc = 5.625
    let angle = angleInc
    
    let s = o.block || 1;
    let space = o.space || 0//0.06;
    let d = s + space;
    let x = o.length || 6, y = o.height || 10, z = o.deep || 6;

    let dx = - ((x*0.5) * d) + (d*0.5);
    let dz = - ((z*0.5) * d) + (d*0.5);
    let px,py

    let modelId = 2

    for(k = 0; k<y; k++){
    for(j = 0; j<z; j++){
    for(i = 0; i<x; i++){

        angle = (k*angleInc*2) - (90-angleInc)
        px = dist[i] * Math.sin(angle*math.torad)
        py = dist[i] * Math.cos(angle*math.torad)
        pos = math.addArray (o.pos, [ px, py, j*d + dz ])
        rot = [ 0,0, 90-angle ]
        tmp.push({
            ...Values,
            ...model[i],
            pos:pos,
            rot:rot,
        })
    }}}

    phy.add(tmp)

}