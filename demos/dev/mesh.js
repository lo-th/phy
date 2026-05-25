function demo() {

	// setting and start oimophysics
	phy.set( { substep:1, gravity:[0,-2,0], ccd:true });

	// add static ground
	//phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    //phy.load(['./assets/models/simple.glb'], onComplete );

    phy.load(['./assets/models/simple2.glb'], onComplete2 );

}

const balls = []

function onComplete2(){

    const model = phy.getMesh('simple2')

    let i = 60, pos

    while(i--){

        pos = [math.rand( -0.5, 0.5 ), 5+i*0.6, math.rand( -0.5, 0.5)]
        pos[0] += math.randInt( 0, 1 ) === 1 ? -2.5 : 2.5

        
        balls[i] = phy.add({ type:'sphere', size:[0.1], pos:pos, density:1, restitution:0.25, friction:0.5, bullet:true })

    }

    phy.add( {
        type:'box',
        name:'bb',
        size:[1,0.2,1],
        restitution:0.25, friction:0.5,
        pos:[0,3,3],
        kinematic:true
    })

    phy.add({ name:'ray', type:'ray', begin:[0,-0.2,0], end:[0,-10, 0], parent:'bb', callback:Yoch, visible:true })

    phy.add( {
        type:'mesh',
        shape: model['base'].geometry,
        restitution:0.25, friction:0.5,
        pos:[-2.5,1,0]
        //size:[2],
        //meshScale:[2],
        //margin: 0.0001,
        //density:10
    })

    phy.add( {
        type:'convex',
        shape: model['base'].geometry,
        restitution:0.25, friction:0.5,
        pos:[2.5,1,0],
        material:'clay'
        //size:[2],
        //meshScale:[2],
        //margin: 0.0001,
        //density:10
    })

    let z = 0.75

    let terrain = phy.add({
        type:'terrain',
        name:'terra',

        uv: 18,
        pos:[ 0, 1, 4 ] ,
        size:[ 4, 2, 4 ],
        sample:[ 32, 32 ],
        frequency:[0.02*z,0.05*z,0.1*z],
        level:[ 1.0, 0.5, 0.2 ],
        expo:2.5,
        zone:1,

        friction: 0.5,
        restitution: 0.0,

    })


    phy.setPostUpdate ( onUp )

    /**/

   
    
}

function Yoch( o ){

    if(o.hit) phy.log(o.body)//console.log( o )

}

function onUp(){

    let i = balls.length, b
    while(i--){
        b = balls[i]
        if(b.position.y < 0.3){
            let pos = [math.rand( -0.5, 0.5 ), 5+i*0.6, math.rand( -0.5, 0.5)]
            pos[0] += math.randInt( 0, 1 ) === 1 ? -2.5 : 2.5
            phy.change({name:b.name, pos:pos, reset:true})
        }
    }

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
        //size:[2],
        //meshScale:[2],
        //margin: 0.0001,
        //density:10
    })

    /**/

   
	
}