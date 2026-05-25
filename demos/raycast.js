let ball, box, raytest, raylist = [];
let side = 1

const setting = {
    selfRay: true,
    speed: 2,
}

function demo() {

    phy.set({ substep:1, gravity:[0,-10,0] })

    phy.add({ type:'plane' })

    phy.add({ type:'box', name:'planche', size:[2,0.2,6], rot:[10,0,0], pos:[0,0.85,0], friction:0.5, restitution:0.5, radius:0.025 })

    ball = phy.add({ type:'highSphere', name:'ball', size:[0.3], pos:[0,5,-2.5], density:1, friction:0.5, restitution:0.5, group:1, mask:1|2, material:'base' })

    //phy.add({ type:'contact', b1:'ball', b2:'planche', callback: ballContact });
    phy.addCollision({ name:'ball', vs:'planche', callback: ballContact })


    //phy.add({ type:'box', name:'bb1', size:[2,3,2], pos:[2,1.5,0], density:2, friction:0.8, restitution:0.8, group:2, mask:1|2 })
    //phy.add({ type:'box', name:'bb2', size:[2,3,2], pos:[-2,1.5,0], density:2, friction:0.8, restitution:0.8, group:2, mask:1|2 })

    // ray can be add to scene
    var i = 20, x;
    while(i--){
        x = (i*0.5)-4.5;
        phy.add({ name:'R_'+i, type:'ray', begin:[x*0.1,3,0], end:[x*0.1,1, 0], callback:Yoch, visible:true, mask:1 })
    }


    // or ray can be attach to any mesh
    attachRay( setting.selfRay );
    rayFilter()

    // update after physic step
    phy.setPostUpdate ( up );

    // little gui
    addGui()


    /*let a = 1 << 0 // 1
    let b = 1 << 1 // 2
    let c = 1 << 2 // 4
    let d = 1 << 3 // 8
    let e = 1 << 4 // 16
    let f = 1 << 5 // 32

    let z = a|e|f

    console.log( a,b,c,d,e,f  )

    let h = z ^ 4
    console.log( h , z )*/
    /*//Inverts the bits of its operand.
    console.log(1 << 0)
    console.log(~2)
    console.log(~16)*/

};

ballContact = ( d ) => {

    if( d.hit < 1 ) ball.material.color.setHex( 0xffffff )
    else ball.material.color.setHex( d.hit ===1 ? 0xFF0000:0xFFFF00  )

}


function Yoch( o ){

    //console.log( o.name )

}

const rayFilter = () => {

    box = phy.add({ type:'box', name:'kineBox', size:[0.3,0.01,0.3], pos:[0,3,5], material:'debug', kinematic:true  })
    phy.add({ name:'ray', type:'ray', begin:[0,0,0], end:[0,-2.9, 0], parent:'kineBox', callback:Yoch, visible:true, mask:1|4 })

    let s = 0.3

    phy.add({ type:'cylinder', size:[s,s], pos:[0,s,5], rot:[90,0,0], mass:1, group:8, material:'concrete'  })
    phy.add({ type:'sphere', size:[s], pos:[1,s,5], mass:1, group:1, material:'sand'   })
    phy.add({ type:'sphere', size:[s], pos:[2,s,5], mass:1, group:16, material:'copper'  })

    phy.add({ type:'sphere', size:[s], pos:[-1,s,5], mass:1, group:1, material:'sand'  })
    phy.add({ type:'sphere', size:[s], pos:[-2,s,5], mass:1, group:16, material:'copper'  })
}

const attachRay = ( b ) => {

    if(b){

        let spherical = new THREE.Spherical();
        let p1 = new THREE.Vector3();
        let p2 = new THREE.Vector3();
        let i = 200, theta, phi;

        while( i-- ){
            theta = math.rand( -180, 180 ) * math.torad;
            phi = math.rand( -180, 180 )  * math.torad;
            spherical.set(0.2, phi, theta);
            p1.setFromSpherical(spherical);
            spherical.set(0.5, phi, theta);
            p2.setFromSpherical(spherical);
            phy.add({ type:'ray', name:'B_'+ i, begin:p1.toArray(), end:p2.toArray(), callback:Yoch, visible:true, parent:ball });
            raylist.push( 'B_'+ i );
        }

    } else {

        let i = raylist.length;
        if(i){

            phy.remove(raylist);
            raylist = [];

        }

    }

}

function up () {

    // if ball position y is under 10, ball is replaved and velocity reset
    if( ball.position.y<0.34 ) phy.change( { name:'ball', pos: [ math.rand(-0.4,0.4),5,-2.5 ], rot:[math.randInt(-180,180),0,math.randInt(-180,180)], reset:true } )

    let p = box.position.x;
    if(side > 0){
        p += setting.speed * 0.01
        if( p > 3) side = -1
    } else if(side < 0){
        p -= setting.speed * 0.01
        if( p < -3) side = 1
    }

    phy.change( { name:'kineBox', pos: [p,3,5] } )

}


const addGui = () => {

    gui = phy.gui();
    gui.add( setting, 'selfRay',{}).onChange( attachRay );
    gui.add( setting, 'speed', {min:0.1, max:10});
    
}