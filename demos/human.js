const debug = 1;

demo = () => {

	phy.view({
        phi:12, theta:0, distance:5, x:0, y:3, z:5, fov:60, 
        envmap:'lobe', envblur: 0.5, //background:0x101010,
        groundReflect:0.3, groundColor:0x808080,
        shadow:0.5,//0.5,
    });

    phy.set({ substep:1, gravity:[0,-9.81,0] });

    phy.add({ type:'plane', size:[300,1,300], visible:false });

    phy.load(['./assets/models/column.glb'], onComplete_1 );
    
}

onComplete_1 = () => {

	const model = phy.getMesh('column');

	let m = phy.texture({ url:'./assets/textures/column_ao.jpg', flip:false })
	phy.material({ name:'column', color:0xc8c4a9, roughness: 0.25, metalness: 0.2, aoMap:m })

    Colomn( 8, [ 4, 0, 0 ])
    Colomn( 5, [ -4, 0, 0 ])

    phy.preload( ['man', 'woman'], onComplete_2 )

}

onComplete_2 = () => {

    Character();

}

const Colomn = ( h = 5, pos = [0,0,0] ) => {

    const model = phy.getMesh('column');

    pos[1] += 0.5;
    let mass = 800;

    phy.add({
        type:'compound',
        shapes:[
            {type:'box', size:[2, 0.25, 2 ], pos:[0,-0.375, 0]},
            {type:'cylinder', size:[0.95, 0.15], pos:[0, -0.175, 0]},
            {type:'cylinder', size:[0.83, 0.3], pos:[0, 0.05, 0]},
            //{type:'cylinder', size:[0.7, 0.3], pos:[0, 0.35, 0]},
            {type:'box', size:[1.0, 0.3, 1.0], pos:[0, 0.35, 0]},
            {type:'box', size:[1.0, 0.3, 1.0], pos:[0, 0.35, 0], rot:[0,-30,0]},
            {type:'box', size:[1.0, 0.3, 1.0], pos:[0, 0.35, 0], rot:[0,30,0]}
        ],
        pos:pos, mass:mass,
        mesh:model.column_001,
        meshPos:[0,-0.5,0],
        material:'column',
        debug:debug,
    })

    let i = h, n = 0, s = 1;
    let scaler = 1.5/100;

    while(i--){

        pos[1] += 1.0;
        s = 1.0 - ( scaler * n );

        phy.add({
            //type:'cylinder', 
            //size:[0.7-(scaler*n), 1], 

            type:'compound',
            shapes:[
                {type:'box', size:[ s, 1, s ], pos:[0,0, 0]},
                {type:'box', size:[ s, 1, s ], pos:[0,0, 0], rot:[0,-30,0]},
                {type:'box', size:[ s, 1, s ], pos:[0,0, 0], rot:[0,30,0]}
            ],
            pos:pos, mass:mass,
            mesh:model.column_002,
            meshPos:[0,-0.5,0],
            meshScale:[1.0-(scaler*n),1.0,1.0-(scaler*n)],
            material:'column',
            debug:debug,
        })

        
        n++

    }

}

const Character = () => {

    let i = 1, n = 0,  g;
    let pos = [0,0,5], angle = 0;
    let hh = [];
    let gender =  [ 'man', 'woman'];

    while( i-- ){

        g = math.randInt( 0, 1 );

        hh[n] = phy.add({ 
            type: 'character',
            name: 'c_' + n,
            gender: gender[g],
            debug: true,
            radius: 0.35,
            height: 1.8,
            pos: pos,
            //ray: n===0,
            angle:angle,
            randomMorph:true,
            morph:true,
            //callback:count,
        });

        n++
        pos = [ math.rand( -10, 10 ), 0, math.rand( 5, 15 ) ];
        angle = math.randInt( 0, 360 )

    }

    hh[0].debugMode( debug );

    phy.follow('c_0', { direct:true, simple:true, distance:5, phi:12, theta:0, decal:[0.3, 0.5, -0.3], fov:60, zoom:1.0 })
    phy.control( 'c_0' );

}