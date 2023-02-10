let box = []

demo = () => {

    phy.view({ 
        ground:false, envmap:'alien', fog:true, fogDist:0.07,
        phi:0, theta:0, distance:10, x:0, y:0, z:0, fov:70 
    })

    // config physics setting with null gravity
    phy.set({ substep:2, gravity:[0,0,0], fps:60 })

    // add static planete
    const planet = new Planet({
        radius:2,
        height:3,
        resolution:engine==='OIMO' ? 10 : 30,
        frequency : [2,0.3], // frequency of noise
        level : [0.02,0.1], // influence of octave
        expo: 1,
    });

    phy.add({ 
        type:'mesh',
        name: 'planet',
        shape: planet.geometry,
        material: planet.material
    });

    //phy.add({ type:'highSphere', size:[2] });

    // add some dynamics
    let i = 200;

    let p = new THREE.Vector3()

    while( i-- ){

        p.setFromSphericalCoords(
            math.rand(4, 100), 
            math.rand(-math.Pi, math.Pi), 
            math.rand(-math.Pi, math.Pi)
        )

        box[i] = phy.add({ 
            name:'box'+i, 
            type:'box', 
            radius:0.03,
            size:[math.rand(0.1, 0.9),math.rand(0.1, 0.9),math.rand(0.1, 0.9)],
            rot:[math.rand(0, 360),math.rand(0, 360),math.rand(0, 360)],  
            pos:p.toArray(), 
            density:1, 
            friction:0.5, 
            restitution:0.26,
            material:'chrome'
        })
    }

    // update after physic step
    phy.setPostUpdate ( update )

}

update = () => {

    var p, m, r = [];
    box.forEach( function( b, id ) {
        p = b.position.clone().negate().normalize().multiplyScalar(0.1);
        r.push( { name:b.name, force:p.toArray() } );
    });

    phy.update( r )

}