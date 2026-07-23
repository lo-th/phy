
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
    phy.add({name:'box', type:'box', pos:[0,4,0], size:[0.5,0.5,0.5], material:'glass_red', mass:1, radius:0.02})
    phy.add({name:'cylinder', type:'cylinder', pos:[1,4,0], size:[0.25,0.5], material:'glass_red', mass:1, radius:0.02})
    phy.add({name:'cone', type:'cone', pos:[1,6,0], size:[0.25,0.5], material:'glass_red', mass:1, radius:0.02})
    phy.add({name:'sphere', type:'sphere', pos:[0,10,0], size:[0.25], rot:[0,8,0], material:'glass_red', mass:1})
    
    phy.add({ name:'RX', type:'ray', begin:[0,3,0], end:[0,0,0], callback:Yoch, visible:true, mask:1 })
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

Yoch=( o )=>{

    //console.log( o.name )

}

onComplete = () => {

    let m = phy.getGlb('z_item', true)
    m.position.y = 0.2
    phy.add(m)

}