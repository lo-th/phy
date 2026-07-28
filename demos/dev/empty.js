
function demo() {

    phy.view({
        envmap:0x181818,
        theta:45,
        phi:20,
        distance:4,
        //ground:false,
        groundColor:0x101010,
        vignette:false,
        //shadow:0,
        reflect:0, 
    })

    let axis = new THREE.AxesHelper()
    phy.add(axis)


    phy.set({ 
        substep:1,
    })

    //let Q = math.quatFromEuler([-180,0,-90])
    //let Q = math.quatFromEuler([45,45,0])

    //let r1 = math.Mat3FromQuatArrayThree(Q)
    //let r2 = math.Mat3FromQuatArray(Q)

    //console.log(r1)
    //console.log(r2)
    phy.add({name:'ground', type:'box', pos:[0,0.5,0], size:[4,1,4], rot:[0,0,0]})
    phy.add({name:'box', type:'box', pos:[-2,4,0], size:[0.5,0.5,0.5], material:'glass_red', mass:1, radius:0.02})
    phy.add({name:'cylinder', type:'cylinder', pos:[1,4,0], size:[0.25,0.5], material:'glass_red', mass:1, radius:0.02})
    phy.add({name:'cone', type:'cone', pos:[1,6,0], size:[0.25,0.5], material:'glass_red', mass:1, radius:0.02})
    phy.add({name:'sphere', type:'sphere', pos:[-2,10,0], size:[0.25], rot:[0,8,0], material:'glass_red', mass:1})
    
    phy.add({ name:'RX', type:'ray', begin:[0,3,0], end:[0,0,0], callback:Yoch, visible:true, mask:1 })

    TestLogo()
    //phy.add({name:'b1', type:'box', pos:[-0.5,2,0], size:[0.25,0.5,0.25], rot:[0,0,0]})
    //phy.add({name:'b2', type:'box', pos:[0.5,2,0], size:[0.5,0.5,0.5], material:'glass_red', mass:1, neverSleep:true, radius:0.02})

   /* phy.add({ 
        type:'generic', b1:'b1', b2:'b2', 
        worldPos:[0,2,0], 
        step:[10,10],
        
        worldQuat:Q,
        
        //worldAxis:[0,0,1], 
        limit:[
        //['y', 0, 0.5, 100000, 10],  
        //['rz', -5, 50, 10000, 1 ], 
        ['rx', -25, 50, 10000, 1 ],  
        //['ry', -25, 50, 10000, 1 ],  
        //['ry', -5, 50, 10000, 1 ] 
        ], //['y', -1, 0 ],
        friction:0, collision:false, visible:true 
    });


    phy.load(['models/z_item.glb'], onComplete, './assets/' )*/


}

const TestLogo = ()=>{

    let sc = 0.01
    const shapes = []
    let p = [0,0,0,31.685,16,0,-31.685,16,0,28.547,25.779,0,28.547,6.221,0,-28.547,25.779,0,-28.547,6.221,0,19.755,-1.621,
    0,7.051,-5.973,0,19.755,33.621,0,7.051,37.973,0,-19.755,-1.621,0,-7.051,-5.973,0,-21.92,32.371,0]
    let s = [8,86,8,8,13,8,8,13,8,8,13,8,8,13,8,8,13,8,8,13,8,8,14.5,8,8,15.5,8,8,14.5,8,8,15.5,8,8,14.5,8,8,15.5,8,8,9,8]
    let r = [0,0,0,0,0,0,0,0,0,0,0,35,0,0,-35,0,0,-35,0,0,35,0,0,-60,0,0,-80,0,0,60,0,0,80,0,0,60,0,0,80,0,0,-60]
    p = math.scaleArray(p,sc);
    s = math.scaleArray(s,sc);
    let i=14, j=0, n=0;
    while(i--){ n = j*3; shapes.push({ type:'box', pos:[p[n],p[n+1],p[n+2]], size:[s[n],s[n+1],s[n+2]], rot:[r[n],r[n+1],r[n+2]] }); j++; }

    //https://forums.unrealengine.com/t/physics-by-balloon/52975/6
    /*phy.add({
        type:'compound',
        name:'logo',
        shapes:shapes,
        pos:[ 0, 1.8,0 ],
        //mesh:model.logo,
        //damping:[1.5,0.7],
        //meshSize:1,
        //mass:1,
        density:0,
        getVelocity:true,

        massCenter:[0,0,0],

    })*/


    let tmp = []

    for(let k=0; k<shapes.length; k++){

        let dt = shapes[k]
        dt.pos[1]+=1.8
        dt.name = 'bb_'+ k
        dt.density = 0.1
        dt.group = 64
        dt.mask = 1|2

        tmp.push(dt)

        if(k>0){
           tmp.push({type:'fixe', b1:'bb_'+(k-1), b2:dt.name, worldPos:dt.pos, worldQuat:[0,0,0,1], spring:[0,1,0,1] }) 
        }



    }

    phy.add(tmp)

    console.log(tmp)
}

Yoch=( o )=>{

    //console.log( o.name )

}

onComplete = () => {

    let m = phy.getGlb('z_item', true)
    m.position.y = 0.2
    phy.add(m)

}