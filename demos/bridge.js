let px = 5
let side = 0
let ready = false


demo = () => {
    
    // config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]} )

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })

    let isLocal = true
    let num = 20;
    let width = 3.0
    let length = 0.7
    let gap = 0.05
    let height = 0.3
    let size = [ length, height, width ]
    let i = num
    
    while( i-- ){
        x = (i - (num - 1) * 0.5) * (length + gap);
        phy.add({ type:'box', name:'b'+i, size:size, pos:[ x, 4, 0 ], radius:0.02, density: i == 0 || i == num - 1? 0 : 0.4 });
    }

    i = num-1
    while( i-- ){
        
        if( isLocal ){ // local joint
            x = (length + gap) * 0.5
            phy.add({ type:'joint', name:'j'+i, b1:'b'+i, b2:'b'+(i+1), pos1:[x,0,0], pos2:[-x,0,0], worldAxis:[0,0,1], lm:[-10,10] })
        } else { // world joint
            x = (i - (num - 1) * 0.5) * (length + gap)
            phy.add({ type:'joint', name:'j'+i, b1:'b'+i, b2:'b'+(i+1), worldAnchor:[x+(length*0.5),4,0], worldAxis:[0,0,1], lm:[-10,10 ], sd:[20,1, 0, 0.5, -1] })
        }
        
    }

    let rand = math.rand

    // add random object
    i=5;
    while(i--){
        phy.add({ type:'box', size:[ rand( 0.3,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
        phy.add({ type:'sphere', size:[ rand( 0.3,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
        phy.add({ type:'cone', size:[ rand( 0.4,  0.6 ), rand( 0.4,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
    }

    // platform test
    phy.add({ type:'box', name:'kine', size:[3,0.2,3], pos:[ px, 1, 3 ], radius:0.02, kinematic:true, density: 1, friction:1 });
    phy.add({ type:'box', name:'truc', size:[1,1,1], pos:[ px, 1.7, 3 ], radius:0.02, density: 0.1, friction:1 });

    phy.setPostUpdate ( update )
    phy.setTimeout( go, 4000 )

}

go = () => {

    side = -1
    ready = true

}


update = () => {

    if(!ready) return

    px += 0.03 * side
    if(px<=-5) side = 1
    if(px>=5) side = -1
    

    phy.change({name:'kine', pos:[ px, 1, 3 ]})
    //phy.change({name:'kine', linearVelocity:[ 0.3 * side, 0,0 ]})

}