var r =0

function demo() {

	phy.set({ 
		substep:4,
        gravity:[0,-9.8, 0 ]
	})

    phy.load(['./assets/models/fan.glb'], onComplete )

}

function onComplete(){

    const model = phy.getMesh('fan')

    const shapes = []

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
        restitution:0, friction:0.1,
        kinematic:true
    })

    // add wall limiter

    let j = 14, a = 0, d = 8, s
    let ar = (2*math.Pi)/j;
    while(j--){
        a += ar
        phy.add({
            type:'box', size:[4,6,2.5], pos:[ d * Math.sin(a), 4, d * Math.cos(a) ], rot:[ 0, a*math.todeg, 0 ], 
            friction:0.1,
            visible:false
        })
    } 

    phy.add({ 
        type:'box', size:[17,4,17], pos:[0,-1,1], 
        friction:0.1,
        visible:false
    })

    // add some ball

    j = 200
    while(j--){

        s = math.rand( 0.2, 0.4 )
        a = math.rand(-math.Pi, math.Pi)
        d = 2 + math.rand(0, 4)
        phy.add({ 
            type:'sphere', size:[s], 
            pos:[ d * Math.sin(a), 5+j*0.6, d * Math.cos(a) ], 
            density:1, friction:0.1, 
            material:'chrome' 
        })

    }

    phy.setPostUpdate ( update )


}

function update () {

    let dt = phy.getDelta()
    let key = phy.getKey()

    let lr = key[0]

    r+=2

    phy.update( { name:'fan', rot:[0,r,0] } )


}