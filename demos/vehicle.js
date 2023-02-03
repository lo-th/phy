demo = () => {

    phy.view({ envmap:'basic', ground:true })

    phy.set( {substep:2, gravity:[0,-9.81,0]})

    phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ pos:[0,20,0], rot:[0,0,0], size:[0.5,0.5,0.5], mass:1})
    //phy.add({ type:'box', size:[4,1,6], rot:[1,0,0], pos:[0,0.5,0],  radius:0.025 })

   // phy.add({ type:'box', size:[4,4,1],  pos:[0,2,10],  radius:0.025 })

    phy.add( { type:'vehicle', name:'corvet' } )

    // update after physic step
    phy.setPostUpdate ( update )

}


update = () => {

    let key = phy.getKey()
    phy.update( { name:'corvet', key:key } )

}