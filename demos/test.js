let n = 0
let max = 3
let tmp = []

demo = () => {

    phy.view({ theta:-25, distance:30, x:0, ground:true, envmap:'clear' })

    phy.set({ substep:1, gravity:[0,-9.81,0] })
    phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false });
    run()

}

run = () => {

    phy.remove( tmp )
    tmp = []

    //test_3(); return

    this['test_'+n]()

    phy.setTimeout( run, 12000 )

    n ++
    if(n===max+1) n = 0

}

test_0 = () => {
    phy.log('restitution test')
    let i = 8
    let r = 1/(i-1)
    while(i--){
        phy.add({ name:'b'+i, type:'box', size:[1.5, 0.2, 1.5], pos:[-7 + (i*2), 0.1, 0 ], restitution: 1 })
        phy.add({ name:'s'+i,  type:'sphere', size:[0.5], pos:[-7 + (i*2), 5, 0 ], restitution: i * r, density:1 })
        tmp.push( 'b'+i, 's'+i )
    }

}

test_1 = () => {
    phy.log('friction test 1')
    let a = 45
    let i = 8
    let r = 1/(i-1)
    while(i--){
        phy.add({ name:'b'+i, type:'box', size:[1.5, 0.2, 5], rot:[a,0,0], pos:[-7 + (i*2), 2, 0 ], friction: 1 })
        phy.add({ name:'s'+i,  type:'box', size:[1, 0.2, 1], rot:[a,0,0], pos:[-7 + (i*2), 4, -1.5 ], friction: i * r, density:1 })
        tmp.push( 'b'+i, 's'+i )
    }
}

test_2 = () => {
    phy.log('friction test 2')
    let a = 36
    let i = 8
    let r = 1/(i-1)
    while(i--){
        phy.add({ name:'b'+i, type:'box', size:[1.5, 0.2, 5], rot:[a,0,0], pos:[-7 + (i*2), 2, 0 ], friction: 1 })
        phy.add({ name:'s'+i,  type:'box', size:[1, 0.2, 1], rot:[a,0,0], pos:[-7 + (i*2), 4, -1.5 ], friction: i * r, density:1 })
        phy.add({ name:'d'+i,  type:'box', size:[1, 0.2, 1], rot:[a,0,0], pos:[-7 + (i*2), 4+0.22, -1.5 ], friction: i * r, density:1 })
        phy.add({ name:'g'+i,  type:'box', size:[1, 0.2, 1], rot:[a,0,0], pos:[-7 + (i*2), 4+0.44, -1.5 ], friction: i * r, density:1 })
        phy.add({ name:'h'+i,  type:'box', size:[1, 0.2, 1], rot:[a,0,0], pos:[-7 + (i*2), 4+0.66, -1.5 ], friction: i * r, density:1 })
        tmp.push( 'b'+i, 's'+i, 'd'+i, 'g'+i, 'h'+i )
    }
}

test_3 = () => {
    phy.log('friction test 3')
    let a = 36
    let i = 8
    let r = 1/(i-1)
    while(i--){
        phy.add({ name:'b'+i, type:'box', size:[1.5, 0.2, 5], rot:[a,0,0], pos:[-7 + (i*2), 2, 0 ], friction: i * r })
        phy.add({ name:'s'+i,  type:'box', size:[1, 0.2, 1], rot:[a,0,0], pos:[-7 + (i*2), 5, -1.5 ], friction: i * r, density:1, angularVelocity:[0,10,0] })
        tmp.push( 'b'+i, 's'+i )
    }
}