let vehicle;

function demo() {

    phy.view({ envmap:'lobe', envblur:0.5, ground:true,  phi:14, theta:60, distance:5, y:0.58, groundReflect:0.05 })

    phy.set({ 
        full:true,
        substep:1, 
        fixe:true,
        gravity:[0,-9.8,0],
    })

    phy.mouseMode('null')

    //phy.lightIntensity( 6, 0, 0.7 );
    //phy.useRealLight( {} );

    let g = phy.getGround();
    g.material.map = phy.texture({ url:'./assets/textures/terrain/road_c.jpg', repeat:[30,30] });
    g.material.normalMap = phy.texture({ url:'./assets/textures/terrain/road_n.jpg', repeat:[30,30] });
    g.material.roughness = 0.8;
    g.material.metalness = 0;


    let gg = phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], ray:true, friction:0.2, restitution:0.0, visible:false });

    phy.add({ type:'box', name:'p0', size:[ 1,2,1 ], pos:[-5,1,0], friction:0.2, restitution:0.0 });
    phy.add({ type:'box', name:'p1', size:[ 1,2,1 ], pos:[-5,1,5], friction:0.2, restitution:0.0 });
    phy.add({ type:'box', name:'p2', size:[ 1,2,1 ], pos:[-5,1,-5], friction:0.2, restitution:0.0 });

    const maps = [
    './assets/textures/alpine/tire_c.jpg',
    './assets/textures/alpine/tire_n.jpg',
    './assets/textures/alpine/tire_m.jpg',
    ]

    phy.load([...maps, './assets/models/alpine.glb'], onComplete );

}

onComplete = () => {

    let meshes = phy.getMesh('alpine');
    let groups = phy.getGroup('alpine');
    let mat = phy.getGlbMaterial('alpine');

    for(let m in meshes){
        if(meshes[m].material){ 
            meshes[m].material.vertexColors = false;
            meshes[m].material.color = meshes[m].material.color.convertSRGBToLinear();
        }
    }

    const carPaint = phy.material({ 
        name:'car_paint', color:0x2673e2, metalness: 1.0, roughness: 0.22, clearcoat: 1.0, clearcoatRoughness: 0.03
    })

    meshes.body.material = carPaint;
    meshes.body2.material = carPaint;

    meshes.glass.material = phy.getMaterial('glass3');
    meshes.glass2.material = phy.getMaterial('glass2');
    meshes.glass_red.material = phy.getMaterial('glass_red');

    let refMat = meshes.pneu.material;
    refMat.color.setHex(0xffffff)
    refMat.metalness = 1;
    refMat.map = phy.texture({ url:'./assets/textures/alpine/tire_c.jpg' });
    refMat.normalMap = phy.texture({ url:'./assets/textures/alpine/tire_n.jpg' });
    refMat.metalnessMap = phy.texture({ url:'./assets/textures/alpine/tire_m.jpg' });
    refMat.normalScale.set(2,-2);

    groups.wheel_l.castShadow = true;

    let py = -0.8

    vehicle = phy.vehicle({ 

        type:'raycar',
        name:'alpine', 
        wheelPosition:[0.77, 0, 1.215],
        wheelRadius:0.31,
        wheelDepth:0.24,
        pos:[0,1.2,0],
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

    vehicle.body.receiveShadow = false;

    // add brake
    let brakeList = [meshes.brake_br, meshes.brake_bl, meshes.brake_fr, meshes.brake_fl];
    for(let i = 0; i<4; i++) vehicle.body.add(brakeList[i]);
    vehicle.vehicle.brakeMeshs = brakeList;

    /*phy.gui([
        { obj:vehicle, name:"maxSuspensionTravel", min:0, max:1, rename:'travel' },
        { obj:vehicle, name:"suspensionRestLength", min:0, max:1, rename:'res length' },
        { obj:vehicle, name:"suspensionMaxLength", min:0, max:1, rename:'max length' },
        { obj:vehicle, name:"frictionSlip", min:0, max:30 }
    ]);*/

    // add drivewheel
    meshes.drivewheel.position.y = py+0.74;
    vehicle.body.add(meshes.drivewheel);
    vehicle.driveWheel = meshes.drivewheel;

    phy.follow('alpine', { direct:true, simple:true, decal:[0,-0.5,0] })

    // update after physic step
    phy.setPostUpdate ( update );

}


function update () {

    vehicle.step();

}