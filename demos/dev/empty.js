
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

    let Q = math.quatFromEuler([-180,0,-90])

    phy.add({name:'b1', type:'box', pos:[-0.5,2,0], size:[0.25,0.5,0.25], rot:[0,0,0]})
    phy.add({name:'b2', type:'box', pos:[0.5,2,0], size:[0.5,0.5,0.5], material:'glass_red', mass:1, neverSleep:true, radius:0.02})

    phy.add({ 
        type:'generic', b1:'b1', b2:'b2', 
        worldPos:[0,2,0], 
        
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


}