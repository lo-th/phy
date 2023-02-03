let bob, trigger, jump = false, oy = 0, vy = 0;
const tmpV1 = new THREE.Vector3()
const tmpV2 = new THREE.Vector3()
const ease = new THREE.Vector3()
let tmpAcc = 0
let rs = 0, ts = 0
const diagonal = 1/Math.sqrt(2)

const speed = {
    idle:0,
    walk:10,
    run:20,
}


demo = () => {

    phy.log('use key WSAD or ZSQD<br>SPACE for jump')

	// setting and start oimophysics
	phy.set({ substep:4, gravity:[0,-9.81,0] })


	// add static plane 
	//phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false });
	phy.add({ type:'box', name:'floor', size:[300,1,300], pos:[0, -0.5, 0], visible:false, /*filter:[1,-1,[5,9], 0]*/ })

    // create character
    let r = 0.3
    bob = phy.add({ 
        type:'capsule', 
        name:'bob', 
        material:'hero', 

        size:[ r,1.8-(2*r) ], pos:[0,3,0], angularFactor:[0,1,0], 
        density:2, damping:[0.01,0], friction:0.5, group:32,
        //material:'debug',
        //order:'YXZ',
        regular:true,
        //filter:[1,-1,[4,5, 11], 0]
        filter:[1,-1,[1, 3, 4,5,9], 0],
        ray:false,
        noGravity:true,
    })


    phy.follow('bob', { direct:true, simple:true, decal:[0.3, 1, -0.3] })

    
    //phy.add({ type:'box', name:'trigger', size:[2, 2, 2], pos:[0,-0.99,-3], material:'debug', mask:32 })
    trigger = phy.add({ type:'box', name:'trigger', size:[5, 1.8, 2], pos:[0,0.91,-3], material:'debug', isTrigger:true  })//

    phy.add({ type:'contact', b1:'bob', b2:'floor', callback: showContact })
    phy.add({ type:'contact', b1:'bob', b2:'trigger', callback: triggerContact })

    let i = 200, s,a,d;
    
    while(i--){

        s = math.rand( 0.2, 2 )
        a = math.rand(-math.Pi, math.Pi)
        d = 10 + math.rand(1, 5)
        
        phy.add({ type:'box', size:[s], pos:[ d * Math.sin(a), (s*0.5), d * Math.cos(a)], rot:[0,a*math.todeg,0], density:math.randInt(0,1)? 0: s })

    }

    // update after physic step
    phy.setPostUpdate ( update )

    hub.addCross()

}

showContact = ( d ) => {

    if( d.hit ) bob.material.color.setHex( 0x00FF00 )
    else bob.material.color.setHex( 0x00FF88 ) 

    //console.log('bob collision on floor')
}

triggerContact = ( d ) => {

    if( d.hit ) trigger.material.color.setHex( 0xFF0000 )
    else trigger.material.color.setHex( 0xFFFF00 )

    //console.log('bob collision on trigger')
}

update = () => {

    

    let delta = phy.getDelta()
    let r = phy.getAzimut()
    let key = phy.getKey()


    

    let anim = key[7] !== 0 ? 'run' : 'walk'

    if( key[0] === 0 && key[1] === 0 ) anim = 'idle'//*= 0.9

    //bob.rotateY( r )
    //bob.rotation.y = r

    //let acc = 10

    let m = key[0] !== 0 && key[1] !== 0 ? diagonal : 1
    

    if( key[0] !== 0 || key[1] !== 0 ){ 

        //s += 1= speed[anim] * tmpAcc

        tmpAcc += 0.2//math.lerp( tmpAcc, 1, delta/10 )
        tmpAcc = math.clamp( tmpAcc, 1, speed[anim] )

        rs += key[0] * tmpAcc//* delta
        ts += key[1] * tmpAcc//* delta

        //rs = key[0] * tmpAcc//* delta
        //ts = key[1] * tmpAcc//* delta

        //dir.set(key[0], 0, key[1])
        //
        //rs = key[0]*tmpAcc;
        //ts = key[1]*tmpAcc;
    } //else {
    //    tmpAcc -= 0.01
    //}
    if( key[0] === 0 && key[1] === 0 ) tmpAcc = 0//*= 0.9
    if( key[0] === 0 ) rs = 0
    if( key[1] === 0 ) ts = 0

    //dir.multiplyScalar(tmpAcc)

    rs = math.clamp( rs, -speed[anim], speed[anim] ) * m
    ts = math.clamp( ts, -speed[anim], speed[anim] ) * m

    

   // let  // Q-D or A-D or left-right
   // let  // Z-S or W-S or up-down

    

    //console.log(tmpAcc)

    if( !jump && key[4] ){ vy = 30; jump = true; } // SPACE KEY

    if( jump ){

        vy-=1;
        if(vy <= 0 ){ 
            vy = 0; 
            if( bob.position.y === oy ) jump = false;
        }

        //
         

        // if()bob.position.y === oy
     }



    // gravity
    let g = (-9.81) + vy;

    //rs *= -4;
    //rs *= math.torad;

   // var s = Math.abs( bob.rotation.z * math.todeg ) > 0 ? Math.PI : 0;
    //var r = bob.rotation.y - s;

    //tmpV1.copy( ease ).applyAxisAngle( { x:0, y:1, z:0 }, r );
    //tmpV1.y = g

    tmpV1.set( rs, g, ts ).applyAxisAngle( { x:0, y:1, z:0 }, r );
    //math.tmpV2.set( 0, rs, 0 );
    tmpV2.set( 0, 0, 0 );


    //phy.update( { name:'bob', linearVelocity: math.tmpV1.toArray(), angularVelocity: math.tmpV2.toArray(), inTime: true, forceWake:true } );

    phy.update({ name:'bob', linearVelocity: tmpV1.toArray(), angularVelocity: tmpV2.toArray(), /*rot:[0,r*math.todeg, 0],*/ wake:true });

    oy = bob.position.y;

}