let bob, trigger
function demo() {

    phy.view({d:25})

    // config physics setting
    phy.set( { substep:1, gravity:[0,0,0] });

    // add static ground
    //phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false });
    phy.add({ type:'box', name:'floor', size:[300,1,300], pos:[0, -0.5, 0], visible:false, /*filter:[1,-1,[5,9], 0]*/ })



    trigger = phy.add({ type:'box', name:'trigger', size:[5, 1, 2], pos:[0,0.5,0], material:'debug', isTrigger:true  })

    bob = phy.add({ type:'sphere', name:'bob', size:[1], pos:[0, 10, 0], kinematic:true })

    bob2 = phy.add({ type:'sphere', name:'bob2', size:[1 ], pos:[0.5, 1, 0], mass:1 })

    phy.add({ type:'box', size:[0.3,10,0.3], pos:[-2, 5, 0]})
    
    phy.add({ type:'contact', b1:'bob', b2:'bob2', callback: showContact })
    phy.add({ type:'contact', b1:'bob', b2:'trigger', callback: triggerContact })

    phy.onStep = update;

}

const update = () => {

    let y = bob.position.y
    //console.log(y.toFixed(2))
    phy.change( { name:'bob', pos:[0,y-0.025,0] } )

    if(y<-1){ 
        bob = phy.add({ type:'sphere', name:'bob', size:[1], pos:[0, 10, 0],  kinematic:true })
        // only need on physx ?
        phy.add({ type:'contact', b1:'bob', b2:'bob2', callback: showContact })
    }

}

showContact = ( d ) => {

    if( d.hit ) { bob.material.color.setHex( 0xFF8800 );  }
    else bob.material.color.setHex( 0x00FF88 ) 


    //phy.log(JSON.stringify(d))

    //if( d.hit ) console.log('bob collision on floor', d)
}

triggerContact = ( d ) => {

    if( d.hit ) trigger.material.color.setHex( 0xFF0000 )
    else trigger.material.color.setHex( 0xFFFF00 )

    //if( d.hit ) console.log('bob collision on trigger', d )
}