var ball, raytest;

function demo() {

    phy.set({ substep:1, gravity:[0,-9.81,0] })

    phy.add({ type:'box', size:[2,0.2,6], rot:[10,0,0], pos:[0,0.85,0], friction:0.8, group:1, mask:2, radius:0.025 })

    ball = phy.add({ type:'highSphere', name:'ball', size:[0.4], pos:[0,2,-2.5], density:2, friction:0.8, restitution:0.8, group:2, mask:1|2 })

    // ray can be add to scene
    var i = 20, x;
    while(i--){
        x = (i*0.5)-4.5;
        phy.add({ type:'ray', begin:[x*0.1,3,0], end:[x*0.1,1, 0], callback:Yoch, visible:true })
    }


    // or ray can be attach to any mesh

    var spherical = new THREE.Spherical();
    var p1 = new THREE.Vector3();
    var p2 = new THREE.Vector3();

    var i = 60;

    while( i-- ){

        var theta = math.rand( -180, 180 ) * math.torad;
        var phi = math.rand( -180, 180 )  * math.torad;
        spherical.set(0.5, phi, theta);
        p1.setFromSpherical(spherical);
        spherical.set(1, phi, theta);
        p2.setFromSpherical(spherical);

        phy.add({ type:'ray', name:'rr'+ i, begin:p1.toArray(), end:p2.toArray(), callback:Yoch, visible:true, parent:ball });

    } 

    // update after physic step
    phy.setPostUpdate ( up )

};


function Yoch( o ){

    //console.log( o.name )

}

function up () {

    // if ball position y is under 10, ball is replaved and velocity reset
    if( ball.position.y<-1 ) phy.update( { name:'ball', pos: [ math.rand(-0.4,0.4),2,-2.5 ], rot:[math.randInt(-180,180),0,math.randInt(-180,180)], reset:true } )



}
