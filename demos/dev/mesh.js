function demo() {

	// setting and start oimophysics
	phy.set( { substep:2, gravity:[0,-10,0] });

	// add static ground
	//phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    phy.load(['./assets/models/simple.glb'], onComplete );

}

function onComplete(){

    const model = phy.getMesh('simple')

    let i = 60, pos

    while(i--){

        pos = [math.rand( -3, 3 ), 5+i*0.6, math.rand( -3, 3)]

        phy.add({ size:[0.2], pos:pos, density:1, restitution:0, friction:0.5, radius:0.03, iterations:[4,1] })
        pos[1]+=0.2
        phy.add({ type:'sphere', size:[0.1], pos:pos, density:1, restitution:0, friction:0.5, iterations:[4,1] })
        pos[1]+=0.2
        //phy.add({ type:'cylinder', size:[0.1, 0.2], pos:pos, density:1, restitution:0, friction:0.5, radius:0.03 })

    }

    phy.add( {
        type:'mesh',
        shape: model['base'].geometry,
        restitution:0, friction:0.5,
        //margin: 0.0001,
       density:10
    })

    /**/

   
	
}