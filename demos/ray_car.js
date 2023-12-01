let vehicle;

function demo() {

    phy.log('under construction')

    phy.view({ envmap:'lobe', envblur:0.3, ground:true, fog:true, fogDist:0.02, phi:14, theta:60, distance:6, y:0.58 })

    phy.set({ 
        full:true,
        substep:1, 
        fixe:false,
        gravity:[0,-9.8,0],
    })


    let gg = phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], ray:true, friction:0.2, restitution:0.3, visible:false });
    //gg.inertia.set( 22539,37885, 15389 )

    const maps = [
    './assets/textures/2cv/2cv_c.jpg', 
    './assets/textures/2cv/2cv_n.jpg',
    './assets/textures/2cv/2cv_r.jpg',
    './assets/textures/2cv/2cv_m.jpg', 
    './assets/textures/2cv/2cv_a.jpg',
    ]

    phy.load([...maps, './assets/models/2cv.glb'], onComplete )
}


onComplete = () => {

    let meshes = phy.getMesh('2cv');
    
    //phy.add({ type:'box', name:'ground', size:[ 100,1,100 ], pos:[0,-0.25,0], friction:0.2, restitution:0.3 });

   // phy.add({ type:'box', name:'f1', size:[ 5,0.2,2 ], pos:[5,0.1,3], friction:0.9, restitution:0 })
   // phy.add({ type:'box', name:'f2', size:[ 5,0.2,2 ], pos:[5,0.1,-3], friction:0.9, restitution:0 })

    /*var gw = new THREE.CylinderGeometry( 0.3, 0.3, 0.3, 16, 1 );
    gw.rotateZ( -Math.PI * 0.5 );
    mw = new THREE.Mesh( gw )*/

    let g = phy.getGround();
    g.material.map = phy.texture({ url:'./assets/textures/grid.png', repeat:[60,60] });

    const mat = phy.material({ name:'2cv', color:0xFFFFFF, roughness: 1,  metalness: 1,
        map:phy.texture({ url:'./assets/textures/2cv/2cv_c.jpg' }),
        normalMap:phy.texture({ url:'./assets/textures/2cv/2cv_n.jpg' }),
        roughnessMap:phy.texture({ url:'./assets/textures/2cv/2cv_r.jpg' }),
        metalnessMap:phy.texture({ url:'./assets/textures/2cv/2cv_m.jpg' }),
        alphaMap:phy.texture({ url:'./assets/textures/2cv/2cv_a.jpg' }),
        normalScale:[1,-1],
    })

    const mat2 = mat.clone();
    mat2.transparent = true;
    mat2.side = THREE.DoubleSide;

    //meshes.body.material = mat
    meshes.inside.material = mat;
    meshes.plus.material = mat;
    meshes.driveWheel.material = mat;
    meshes.extra.material = mat2;

    //testCar( 0, [ 0,4,0 ] );

    vehicle = new phy.RayCar({ 

        name:'chassis0', 
        wheelMesh:meshes.wheel_l, 
        wheelMesh2:meshes.wheel_r, 
        bodyMesh: meshes.body,
        meshPos:[0,-0.8,0],
        shapeMesh: meshes.shape,
        shapePos:[0,-0.8,0],
        material:mat,
        
       // material:'debug'
    });

    phy.gui([
        { obj:vehicle, name:"maxSuspensionTravel", min:0, max:1, rename:'travel' },
        { obj:vehicle, name:"suspensionRestLength", min:0, max:1, rename:'res length' },
        { obj:vehicle, name:"suspensionMaxLength", min:0, max:1, rename:'max length' },
        { obj:vehicle, name:"frictionSlip", min:0, max:30 }
    ]);

    //phy.follow('chassis0', { direct:true, simple:true })

    // update after physic step
    //phy.setPostUpdate ( update )

    phy.setPostUpdate ( update );

}


function update () {

    vehicle.step();
}