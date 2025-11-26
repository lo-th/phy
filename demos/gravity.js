let box = []

demo = () => {

    phy.view({ 
        ground:false, envmap:'alien', fogexp:0.05,
        phi:0, theta:0, distance:7, x:0, y:0, z:0, fov:90,  
        bgIntensity:4, envIntensity:6, exposure:0.2, direct:30

    })

    // config physics setting with null gravity
    phy.set({ substep:1, gravity:[0,0,0], fps:60 })

    // add static planete
    const planet = new Planet({
        radius:2,
        height:3,
        resolution:engine==='OIMO' ? 10 : 20,
        frequency : [2,0.3], // frequency of noise
        level : [0.02,0.2], // influence of octave
        expo: 2,
    });

    phy.add({ 
        type:'mesh',
        name: 'planet',
        shape: planet.geometry,
        material: planet.material,
        friction:0.2, 
        restitution:0.5,
    });

    //phy.add({ type:'highSphere', size:[2] });

    // add some dynamics
    let i = 200;

    let p = new THREE.Vector3(), s

    while( i-- ){

        p.setFromSphericalCoords(
            math.rand(20, 100), 
            math.rand(-Math.PI, Math.PI), 
            math.rand(-Math.PI, Math.PI)
        )

        s = math.rand(0.25, 0.5);

        box[i] = phy.add({ 
            //instance:'boxy',
            name:'box'+i, 
            type:'box', 
            radius:0.03,
            //size:[math.rand(0.1, 0.9),math.rand(0.1, 0.9),math.rand(0.1, 0.9)],
            rot:[math.rand(0, 360),math.rand(0, 360),math.rand(0, 360)],  
            pos:p.toArray(), 
            size:[s*2,s*2,s*2],
            //density:s, 
            mass:s*0.01, 
            friction:0.2, 
            restitution:0.5,
            damping:[0.25,0.5],
            material:'silver'
        })

        /*box[i] = phy.add({ 
            name:'box'+i, 
            type:'compound', 
            radius:0.03,
            //size:[math.rand(0.1, 0.9),math.rand(0.1, 0.9),math.rand(0.1, 0.9)],
            rot:[math.rand(0, 360),math.rand(0, 360),math.rand(0, 360)],  
            pos:p.toArray(), 
            shapes:[
            { type:'capsule', pos:[0,0,0], size:[ s*0.25,s,s*0.25 ] },
            { type:'box', pos:[0,0,0], size:[ s*3,s*0.05,s*0.5 ] }
            ],
            density:s, 
            friction:0.2, 
            restitution:0.5,
            damping:[0.25,0.5],
            material:'silver'
        })*/
    }

    // update on each physic step
    phy.onStep = update;

}

update = ( dt ) => {

    var p, m, r = [];
    box.forEach( function( b, id ) {
        //p = b.position.clone().negate().normalize().multiplyScalar(0.001);
        p = b.position.clone().negate().normalize().multiplyScalar(dt);
        r.push( { name:b.name, force:p.toArray() } );
    });

    phy.change( r );

}