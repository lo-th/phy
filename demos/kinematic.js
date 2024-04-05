let r = 0;
let inc = 0;
let sph = [];
let option = {
    speed:0.2,
}

demo = () => {

    //phy.log('Q or A to stop<br>D to speed uo ')

    phy.view({
        phi:30, theta:0, distance:15, x:0, y:3, z:0, fov:70, envmap:'bed', envblur: 0.5,
    })

	phy.set({ 
        full:true,
		substep:1,
        gravity:[0,-9.8, 0 ]
	})

    phy.load(['./assets/models/fan.glb'], onComplete )

}

onComplete = () => {

    let mat = phy.material({ name:'noctua', roughness: 0.5, metalness: 0, color:0x551705 })

    const model = phy.getMesh('fan')
    const shapes = [];

    model.fan.children[0].material = mat;

    let i = 7
    let r = 360/7

    shapes.push( { type:'convex', shape:model.fan_center.geometry, rot:[0,r*i, 0] })

    while( i-- ){

        shapes.push( { type:'convex', shape:model.pal_shape_1.geometry, rot:[0,r*i, 0] })
        shapes.push( { type:'convex', shape:model.pal_shape_2.geometry, rot:[0,r*i, 0] })

    } 

    phy.add({

        name:'fan',
        type:'compound',
        pos:[0,1,0],
        shapes:shapes,
        mesh:model.fan,
        material:'noctua',
        restitution:0, 
        friction:0.5,
        kinematic:true,
        ray:false,
        //debug:true,
    })

    // add wall limiter

    let j = 14, a = 0, d = 8, s, m, y
    let ar = (2*Math.PI)/j;
    while(j--){
        a += ar
        phy.add({
            type:'box', size:[4,6,2.5], pos:[ d * Math.sin(a), 4, d * Math.cos(a) ], rot:[ 0, a*math.todeg, 0 ], 
            friction:0.0,
            visible:false
        })
    } 

    phy.add({ 
        type:'box', size:[17,4,17], pos:[0,-1,1], 
        friction:0.0,
        visible:false
    })

    // add some ball

    j = 500;
    while(j--){

        s = math.rand( 0.15, 0.25 )
        a = math.rand(-Math.PI, Math.PI)
        d = math.rand(2, 6)
        y = math.rand(s, s*100)
        m = phy.add({ 
            instance:'sph',
            material:'body',
            type:'sphere', size:[s], 
            //pos:[ d * Math.sin(a), 5+j*0.6, d * Math.cos(a) ], 
            pos:[ d * Math.sin(a), y, d * Math.cos(a) ],
            mass:s, 
            friction:0.5,
            color:[ s+0.5, s, 0 ] 
        })
        
        m.origin = [d * Math.sin(a), y, d * Math.cos(a)];//[ d * Math.sin(a), 5+j*0.6, d * Math.cos(a) ]
        m.speedMat = true
        sph.push(m)

    }

    // update on each physic step
    phy.onStep = update;

    phy.gui([
        { obj:option, name:"speed", min:0, max:1,  }
    ]);


}

update = () => {

    let dt = phy.getDelta()
    let key = phy.getKey()

    //let lr = key[0]

    /*inc += dt;
    if(inc>1) inc = 1;

    r += inc

    if(key[0]) r += key[0]*inc;*/

    r -= (option.speed*300) * dt

    let up = [ { name:'fan', rot:[0,r,0] } ]
    //let up = [ { name:'fan', angularVelocity:[0,lr*2,0] } ] 

    let i = sph.length, m
    while(i--){
        m = sph[i]
        if( m.position.y<0 ) up.push( { name:m.name, pos:m.origin, reset:true } )
    }

    phy.change( up )


}