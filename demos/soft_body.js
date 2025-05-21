let pp3, pp2, pp

let option = {
    density:1,
    smoothing:1,
    speed:1,
    viscosity:0.03,
}

let softSolver = []  

function demo() {

    phy.view({ envmap:'photo', exposure:0.8, envblur: 0.5, distance:5, y:1 })

    // config physics setting
    phy.set( { substep:1, gravity:[0,-10,0], jointVisible:false  });

    // add some static
    phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ type:'sphere', pos:[0,2,0], size:[0.4], radius:0.02, restitution:0, friction:0.5, renderOrder:3, visible:true });

    let mesh, geometry, solver
    let material = phy.getMat('glassX')
    material.color.setHex(0xfc35cf)
    material.thickness = 0.1;

    // box
    geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2 )
    mesh = new THREE.Mesh( geometry, material )
    mesh.position.set(2, 3, 0 )

    solver = phy.addSoftSolver({
        name:'soft_Cube',
        density:1,
        smoothing:1,
        speed:1,
        viscosity:0.03,
        mesh:mesh,
        crossEdge: true,
    })
    softSolver.push(solver)

    // cylinder
    geometry = new THREE.CylinderGeometry(1,1, 1, 6, 2);
    //let sphgeometry = new THREE.SphereGeometry(1,6,4);
    mesh = new THREE.Mesh( geometry, material )
    mesh.position.set(-2, 3, 0 )

    solver = phy.addSoftSolver({
        name:'soft_Cylinder',
        density:1,
        smoothing:1,
        speed:1,
        viscosity:0.03,
        mesh:mesh,
        crossEdge:true,
    })
    softSolver.push(solver)

    // cloth
    geometry = new THREE.PlaneGeometry(2, 2, 12, 12);
    geometry.rotateX(-Math.PI*0.5);
    mesh = new THREE.Mesh( geometry, material )
    mesh.position.y = 4

    solver = phy.addSoftSolver({
        name:'soft_Cloth',
        density:1,
        smoothing:1,
        smoothMulty:30,
        speed:1,
        viscosity:0.03,
        pSize:0.05,
        mesh:mesh,
        //crossEdge:true,
    })
    softSolver.push(solver)

    // will be remove in next update
    phy.setPostUpdate ( update )


    let gui = phy.gui();
    gui.add( option, 'density', { min:0.01, max:2, mode:2 } ).onChange(upOption)
    gui.add( option, 'viscosity', { min:0.01, max:0.1, mode:2 } ).onChange(upOption)
    gui.add( option, 'smoothing', { min:0, max:2, mode:2 } ).onChange(upOption)
    gui.add( option, 'speed', { min:0, max:2, mode:2 } ).onChange(upOption)

}

upOption = () => {

    let i = softSolver.length
    while(i--){ 
        for(let o in option){
            softSolver[i][o] = option[o]
        }
    }

}

update = () => {

    let i = softSolver.length
    while(i--) softSolver[i].update()

}