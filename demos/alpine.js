let vehicle;

function demo() {

    phy.log('under construction')

    phy.view({ envmap:'lobe', envblur:0.3, ground:true, fog:true, fogDist:0.02, phi:14, theta:60, distance:6, y:0.58 })

    phy.set({ 
        full:true,
        substep:1, 
        fixe:true,
        gravity:[0,-9.8,0],
    })

    let g = phy.getGround();
    g.material.map = phy.texture({ url:'./assets/textures/grid.png', repeat:[60,60] });


    let gg = phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], ray:true, friction:0.2, restitution:0.3, visible:false });


    const maps = [
    /*'./assets/textures/2cv/2cv_c.jpg', 
    './assets/textures/2cv/2cv_n.jpg',
    './assets/textures/2cv/2cv_r.jpg',
    './assets/textures/2cv/2cv_m.jpg', 
    './assets/textures/2cv/2cv_a.jpg',*/
    ]

    phy.load([...maps, './assets/models/alpine.glb'], onComplete );
}


onComplete = () => {

    let meshes = phy.getMesh('alpine');
    let groups = phy.getGroup('alpine');

    
    meshes.glass.material = phy.getMaterial('glass2');

    /*const mat = phy.material({ 
        name:'2cv', color:0xFFFFFF, roughness: 1,  metalness: 1, normalScale:[1,-1],
        map:phy.texture({ url:'./assets/textures/2cv/2cv_c.jpg' }),
        normalMap:phy.texture({ url:'./assets/textures/2cv/2cv_n.jpg' }),
        roughnessMap:phy.texture({ url:'./assets/textures/2cv/2cv_r.jpg' }),
        metalnessMap:phy.texture({ url:'./assets/textures/2cv/2cv_m.jpg' }),
        alphaMap:phy.texture({ url:'./assets/textures/2cv/2cv_a.jpg' }),
    })



    const mat2 = mat.clone();
    mat2.transparent = true;
    mat2.side = THREE.DoubleSide;

    //meshes.body.material = mat
    meshes.inside.material = mat;
    meshes.plus.material = mat;
    meshes.driveWheel.material = mat;
    meshes.extra.material = mat2;*/

    //testCar( 0, [ 0,4,0 ] );

    groups.wheel_l.castShadow = true;

    let py = -0.8

    vehicle = new phy.RayCar({ 

        name:'chassis0', 
        wheelPosition:[0.77, 0, 1.215],
        wheelRadius:0.31,
        wheelDepth:0.24,
        //wheelMesh: meshes.WL, 
        wheelMesh: groups.wheel_l, 
        wheelMesh2: groups.wheel_r,
        //driveWheel: meshes.driveWheel,
        bodyMesh: meshes.body,
        //shadow:false,
        meshPos:[0,py,0],
        shapeMesh: meshes.shape,
        shapePos:[0,py,0],
        //material: mat,
        
    });

    //console.log(vehicle)
    vehicle.body.receiveShadow = false;

    phy.gui([
        { obj:vehicle, name:"maxSuspensionTravel", min:0, max:1, rename:'travel' },
        { obj:vehicle, name:"suspensionRestLength", min:0, max:1, rename:'res length' },
        { obj:vehicle, name:"suspensionMaxLength", min:0, max:1, rename:'max length' },
        { obj:vehicle, name:"frictionSlip", min:0, max:30 }
    ]);

    //phy.follow('chassis0', { direct:true, simple:true })

    // update after physic step
    phy.setPostUpdate ( update );

}


function update () {

    vehicle.step();

}