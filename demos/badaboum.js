demo = () => {

    phy.view({ envmap:'photo', envblur:0.5, exposure:0.2, direct:25, envIntensity:4, bgIntensity:3, shadowIntensity:0.5, distance:5, y:0.6 })

    // config physics setting
    phy.set({ substep:2, gravity:[0,-9.81,0], stabiliz:false })

    // add static box 
    phy.add({ type:'box', size:[100,10,100], pos:[0, -5, 0], visible:false })

    // load model
    phy.load(['./assets/models/badaboum.glb', './assets/textures/compressed/badaboum.ktx2'], onComplete );

}

onComplete = () => {

    const pieces = phy.getMesh('badaboum');
    const texture = phy.getTexture('badaboum');

    pieces['board'].material.map = texture;

    let p = [
    { mesh:pieces['b_0'], type:'box', size:[2.5,2.5,2.5] },
    { mesh:pieces['b_1'], type:'box', size:[4.1,2.5,2.9] },
    { mesh:pieces['b_2'], type:'compound', shapes:[{type:'convex', shape:pieces['c_21'] }, {type:'convex', shape:pieces['c_22']}] },
    { mesh:pieces['b_3'], type:'compound', shapes:[{type:'box', pos:[-0.6,0,-0.7], size:[2.9,2.5,1.3]}, {type:'box', pos:[0.6,0,0.7], size:[2.9,2.5,1.3]}] },
    { mesh:pieces['b_4'], type:'cylinder', size:[0.75,2.5] },
    { mesh:pieces['b_5'], type:'cylinder', size:[0.75,2.5] },
    { mesh:pieces['b_6'], type:'cylinder', size:[1.2,2.5] },
    { mesh:pieces['b_7'], type:'convex', shape:pieces['c_7'] },
    { mesh:pieces['b_8'], type:'box', size:[2.5,2.5,2.5] },
    { mesh:pieces['b_9'], type:'compound', shapes:[{type:'convex', shape:pieces['c_91'] }, {type:'convex', shape:pieces['c_92']}] },
    { mesh:pieces['b_10'], type:'compound', shapes:[{type:'convex', shape:pieces['c_21'] }, {type:'convex', shape:pieces['c_22']}] },
    { mesh:pieces['b_11'], type:'compound', shapes:[{type:'box', pos:[-0.7,0,0], size:[1.3,2.5,4.1]}, {type:'box', pos:[0.65,0,1.3], size:[1.4,2.5,1.5]}] },
    { mesh:pieces['b_12'], type:'box', size:[8.5,2.5,1.0] },
    { mesh:pieces['b_13'], type:'compound', shapes:[{type:'convex', shape:pieces['c_91'] }, {type:'convex', shape:pieces['c_92']}] },
    { mesh:pieces['b_14'], type:'compound', shapes:[{type:'box', pos:[-0.6,0,-0.7], size:[2.9,2.5,1.3]}, {type:'box', pos:[0.6,0,0.7], size:[2.9,2.5,1.3]}] },
    { mesh:pieces['b_15'], type:'compound', shapes:[{type:'convex', shape:pieces['c_151'] }, {type:'convex', shape:pieces['c_152']}] },
    { mesh:pieces['b_16'], type:'compound', shapes:[{type:'convex', shape:pieces['c_161'] }, {type:'convex', shape:pieces['c_162']}] },
    { mesh:pieces['b_17'], type:'convex', shape:pieces['c_7'] },
    { mesh:pieces['b_18'], type:'convex', shape:pieces['c_18'] },
    { mesh:pieces['b_19'], type:'box', size:[8.5,2.5,1.0] },
    ]

    // board
    phy.add({ mesh:pieces['board'], type:'box', size:[15.2,0.4,4.6], pos:[0,0.2,0], density:1, worldScale:0.1 })

    // pieces
    let i = 20, ar = [];
    while(i--) ar[i] = i;
    i = 20;
    // randome order
    ar = math.shuffle(ar);

    while(i--){
        pos = [0, 5+ i*3, 0];
        phy.add({...p[ar[i]], pos:pos, worldScale:0.1, friction: 0.5, density:0.1, pv:2, mci:2, inertiaScale:2 })
    }


}