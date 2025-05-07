let v, py 

function demo() {

    phy.view({ envmap:'puresky', ground:false, fogexp:0.01, direct:50, exposure:0.1, envIntensity:5, bgIntensity:5, envblur:0.1})
    phy.set({ substep:1, gravity:[0,-9.81,0], fps:60 })

    const terrain = phy.add({
        type:'terrain',
        name:'terra',
        friction: 0.1, 
        staticFriction:0.1,
        restitution: 0.1,
        maplevels:[0.5, 0.5, 0, 0.25],
        pos: [ 0, 0, 0 ],
        size: [ 300, 20, 300 ],
        sample:[ 128, 128 ],
        //frequency: [0.05,0.25,0.75],
        frequency: [0.016,0.05,0.2],
        expo: 1,
        zone:1.0, // physics simulated zone
        uv: 60,
        island:true,
        debug:false,
    })

    py = terrain.getHeight( 0, 0 )

    phy.add({ type:'box', size:[1000,1,1000], pos:[0,-0.5,0], density:0, visible:false });

    phy.add({ type:'box', size:[10,100,10], pos:[-10,-0.5,0], density:0, visible:true });

    phy.load(['./assets/models/kart.glb'], onComplete )

}

onComplete = (delta) => {

    const model = phy.getMesh('kart');

    v = phy.vehicle({type:'kart', pos:[0,py,0], model:model, debug:true })
    phy.follow('baser', { direct:true, simple:true, decal:[0.3, 0.5, -0.3] })
    phy.setPostUpdate ( update )
    addGui()

}

addGui = () => {
    
    const gui = phy.gui();
    gui.add( v, 'speed', {min:10, max:200, step:1})
    gui.add( v, 'maxSpeed', {min:10, max:200, step:1})
    gui.add( v, 'traction', {min:0, max:10, step:0.1})
    gui.add( v, 'steerAngle', {min:0, max:25, step:1})
    gui.add( v, 'drag', {min:0.95, max:0.99, step:0.01})
}

update = (delta) => {

    v.update(delta)

}