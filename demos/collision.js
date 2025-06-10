let ax= 0, ay= 0, az = 0

function demo() {

    phy.view({y:5})

    // config physics setting
    phy.set( { substep:1, gravity:[0,-9.81,0] });

    // add static ground
    //phy.add({ type:'plane', size:[300,1,300], visible:false });


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

    // with event
    phy.addCollision({ name:'bob1', vs:'container' })
    bob.addEventListener( 'collision', (event) => { showContact(event.data) })

    // with callback
    phy.addCollision({ name:'bob2', vs:'container', callback: showContact })
    phy.addCollision({ name:'bob3', vs:'container', callback: showContact })



    phy.add({ type:'cylinder', name:'trig', size:[1, 6], pos:[0, 5, 0], rot:[0, 0, 90], isTrigger:true,  material:'plexi' })
    phy.addCollision({ name:'trig', ignore:'container', callback: onTrigger })

    //phy.removeCollision('bob3')

    phy.onStep = update;

}


const update = () => {

    ax+=0.5
    //ay+=0.5
    //az+=0.5
    phy.change( { name:'container', rot:[ax,ay,az] } )

}

const onTrigger = ( d ) => {

    const b = phy.byName(d.from);
    const b2 = phy.byName(d.to);
    if(d.hit){ 
        b.material.color.setHex( 0x008000 )
        b2.material.color.setHex( 0x60ff60 ) 
    } else {
        b.material.color.setHex( 0x000000 ) 
        b2.material.color.setHex( 0x606060 )
    }

    //console.log(d)
}

const showContact = ( d ) => {

    const b = phy.byName(d.from);

    if( d.hit !== 0 ) { 
       
        b.material.color.setHex( d.hit === 1 ? 0xFF0000 : 0xFFFFFF );
        //if(d.hit === 1){
            phy.addParticle({
                //name:'yoo', 
                type:'pixel',
                colors:d.hit===1?[
                    1, 0, 0, 1,
                    4, 0, 0, 0
                ]:[
                    0.8, 0.8, 0.8, 1,
                    0.8, 0.8, 0.8, 0
                ]
                ,
                position:d.point,
                positionRange:[0.2,0.2,0.2],
                numParticles: d.hit===1?200:20,
                startTime:0,
                lifeTime: 0.5,
                endTime: 0.5,
                startSize: 0.03,
                endSize: 0.03,
               // sizeRange:0.2,
                velocity: d.normal,//math.mulArray(b.velocity.toArray(), -1), //d.normal,
                velocityRange: [ 1, 1, 1 ], //math.mulArray([ 1, 1, 1 ], d.normal),
                //velocityRange: math.subArray([ 1, 1, 1 ], d.normal),
                //accelerationRange:[0.25,0,0.25],
                //tween:"outQuad",
                blending:"normal",
            }) 
        //}
         
    }
    else b.material.color.setHex( 0x606060 ) 


}