let v 

function demo() {

    phy.view({ })
    phy.set({ substep:1, gravity:[0,-9.81,0], fps:60 })

    let py = 0


    const terrain = phy.add({
        type:'terrain',
        name:'terra',
        friction: 0.1, 
        staticFriction:0.1,
        restitution: 0.1,
        maplevels:[0.5, 0.5, 0, 0.25],
        pos: [ 0, 0, 0 ],
        size: [ 100, 10, 100 ],
        sample:[ 128, 128 ],
        //frequency: [0.05,0.25,0.75],
        frequency: [0.016,0.05,0.2],
        expo: 1,
        zone:1.0, // physics simulated zone
        uv: 10,
        island:true,
        debug:true,
    })

    py = terrain.getHeight( 0, 0 )




    phy.add({ type:'box', size:[1000,1,1000], pos:[0,-0.5,0], density:0, visible:false });

    v = phy.vehicle({type:'taxi', pos:[0,py,0]})
    //v = phy.vehicle({type:'Kart'})

    phy.follow('baser', { direct:true, simple:true, decal:[0.3, 1, -0.3] })


    phy.setPostUpdate ( update )

}

update = (delta) => {

    v.update(delta)

}