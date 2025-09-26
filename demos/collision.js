let ax= 0, ay= 0, az = 0

function demo() {

    phy.view({ envmap:'river', envblur:0.5, exposure:0.2, direct:25, envIntensity:4, bgIntensity:3, y:5, theta:25 })
    phy.set( { substep:1, gravity:[0,-9.81,0] });

    // simple wall bax
    phy.add({ 
        type:'container', 
        name:'container',
        material:'debug',
        color:0x000000,
        size:[6,5,5,0.12], 
        pos:[0,5,0], 
        friction:0.5, 
        restitution:1, 
        intern:true, 
        remplace:true,
        kinematic:true,
    });

    
    let bob = phy.add({ type:'sphere', name:'bob1', size:[0.5], pos:[-1.5, 5, 0], mass:1, restitution:1, unicMat:true })
    phy.add({ type:'sphere', name:'bob2', size:[0.5], pos:[0, 5, 0], mass:1, restitution:0.6, unicMat:true })
    phy.add({ type:'sphere', name:'bob3', size:[0.5], pos:[1.5, 5, 0], mass:1, restitution:0.25, unicMat:true })

    // with event (if no callback defined you can use event)
    phy.addCollision({ name:'bob1', vs:'container' })
    bob.addEventListener( 'collision', (event) => { showContact(event.data) })

    // with callback
    phy.addCollision({ name:'bob2', callback: showContact })
    phy.addCollision({ name:'bob3', vs:'container', callback: showContact })

    // trigger
    phy.add({ type:'cylinder', name:'trig', size:[1, 6], pos:[0, 5, 0], rot:[0, 0, 90], isTrigger:true,  material:'glass' })
    phy.addCollision({ name:'trig', ignore:'container', callback: onTrigger })

    phy.onStep = update;

}


const update = () => {

    ax+=0.5
    //ay+=0.5
    //az+=0.5
    phy.change( { name:'container', rot:[ax,ay,az] } )

}

const onTrigger = ( d ) => {

    // d =  hit, from, to
    // hit  0:exited, 1:entered

    const b = phy.byName(d.from);
    const b2 = phy.byName(d.to);

    if(d.hit){ 
        b.material.color.setHex( 0x00ff00 )
        b2.material.color.setHex( 0x60ff60 ) 
    } else {
        b.material.color.setHex( 0xffffff ) 
        b2.material.color.setHex( 0x606060 )
    }

}

const showContact = ( d ) => {

    // d =  hit, from, to, point, normal, impulse, distance, v1, v2
    // hit  0:finished, 1:started, 2:continued  
    // v1 and v2 is linear velocity

    const b = phy.byName(d.from);

    if( d.hit === 0 ){
        b.material.color.setHex( 0x606060 )
        return
    }
   
    b.material.color.setHex( d.hit === 1 ? 0xFF0000 : 0xFFFFFF );

    phy.addParticle({
        type:'pixel',
        name:d.from+d.hit,
        colors:d.hit===1?[
            1, 0, 0, 1,
            1, 0.6, 0, 0.2,
        ]:[
            0.8, 0.8, 0.8, 1,
            0.8, 0.8, 0.8, 0.2
        ]
        ,
        position:d.point,
        positionRange:[0.25,0.25,0.25],
        numParticles: d.hit===1?40:10,
        startTime: 0,
        lifeTime: 0.5,
        endTime: 0.5,
        startSize: 0.05,
        endSize: 0.05,
       // sizeRange:0.2,
        velocity: math.mulArray(d.normal, d.impulse*0.5),
        velocityRange: [ 1, 1, 1 ], 
        blending:"normal",
    }) 
    //}
    //else b.material.color.setHex( 0x606060 ) 


}