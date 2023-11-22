let vehicle;

function demo() {

    phy.log('under construction')

    phy.view({ envmap:'photo', envblur:0.3, ground:true, fog:true, fogDist:0.02, theta:180 })

    phy.set({ 
        full:true,
        substep:10, 
        gravity:[0,-9.8,0],
    })


    let gg = phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], ray:true, friction:0.2, restitution:0.3, visible:false });
    //gg.inertia.set( 22539,37885, 15389 )
    
    //phy.add({ type:'box', name:'ground', size:[ 100,1,100 ], pos:[0,-0.25,0], friction:0.2, restitution:0.3 });

   // phy.add({ type:'box', name:'f1', size:[ 5,0.2,2 ], pos:[5,0.1,3], friction:0.9, restitution:0 })
   // phy.add({ type:'box', name:'f2', size:[ 5,0.2,2 ], pos:[5,0.1,-3], friction:0.9, restitution:0 })

    /*var gw = new THREE.CylinderGeometry( 0.3, 0.3, 0.3, 16, 1 );
    gw.rotateZ( -Math.PI * 0.5 );
    mw = new THREE.Mesh( gw )*/

    let g = phy.getGround();
    g.material.map = phy.texture({ url:'./assets/textures/grid.png', repeat:[60,60] });

    //testCar( 0, [ 0,4,0 ] );

    vehicle = new phy.RayCar({ name:'chassis0'});

    //phy.follow('chassis0', { direct:true, simple:true })

    // update after physic step
    //phy.setPostUpdate ( update )

    phy.setPostUpdate ( update )


}


function update () {

    vehicle.step();
}