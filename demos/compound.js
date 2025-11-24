let model;
let items;

function demo() {

    phy.view({ 
        exposure:0.6,
        envmap:'photo', //envFloor:true,
        ground:true, groundSize:[ 22, 16.5 ], groundAlpha:false,
        groundPos:[0,0,0], 
        groundReflect:0.1,// groundColor:0xc9c8c7,
        phi:20, theta:-20, distance:10, x:0, y:0, z:0, fov:60,
        envblur: 0.5, 
        //fogexp:0.03, 
        //fogColor:0x000000,
        envPower:0.25,
    })

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0] });

    // add static ground
    //phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ type:'box', size:[22,1,16.5], pos:[0, -0.5, 0], visible:false })

    phy.load(['./assets/models/furniture.glb'], onComplete );

}

function onComplete(){

    model = phy.getMesh('furniture', true, true );


    items = [
        {mesh:model.can, meshPos:[0, -0.058, 0], type:'cylinder', size:[0.033, 0.116], density:0.5, py:0.058 }, 
        {mesh:model.sauce_1, meshPos:[0, -0.125, 0], type:'cylinder', size:[0.036, 0.25], density:0.5, py:0.125},
        {mesh:model.sauce_2, meshPos:[0, -0.125, 0], type:'cylinder', size:[0.036, 0.25], density:0.5, py:0.125},
        {mesh:model.sauce_3, meshPos:[0, -0.125, 0], type:'cylinder', size:[0.036, 0.25], density:0.5, py:0.125},
        //{mesh:model.board, meshPos:[0, -0.00125, 0], type:'box', size:[0.33, 0.0025, 0.24], density:0.5, py:0.00125, debug:true},

        {mesh:model.board, meshPos:[0, -0.00125, 0], type:'compound', density:0.5, py:0.00125, shapes:[
            {type:'box', size:[0.318, 0.0025, 0.228]},//{type:'box', size:[0.33, 0.0025, 0.24]},
            {type:'box', size:[0.3, 0.0212, 0.004], pos:[0,0.00955, 0.12899], rot:[40,0,0]},
            {type:'box', size:[0.3, 0.0212, 0.004], pos:[0,0.00955, -0.12899], rot:[-40,0,0]},
            {type:'box', size:[0.004, 0.0212, 0.21], pos:[-0.17385,0.00955, 0], rot:[0,0,40]},
            {type:'box', size:[0.004, 0.0212, 0.21], pos:[0.17385,0.00955, 0], rot:[0,0,-40]},
            // corner
            {type:'box', size:[0.004, 0.0212, 0.035], pos:[0.16246,0.00955, 0.11746], rot:[0,-45,-40]},
            {type:'box', size:[0.004, 0.0212, 0.035], pos:[-0.16246,0.00955, 0.11746], rot:[0,-125,-40]},
            {type:'box', size:[0.004, 0.0212, 0.035], pos:[0.16246,0.00955, -0.11746], rot:[0,45,-40]},
            {type:'box', size:[0.004, 0.0212, 0.035], pos:[-0.16246,0.00955, -0.11746], rot:[0,125,-40]},
        ]},
    ];

    //console.log(model)



    //let px = math.rand( -6, 6 );
    //phy.add({ size:[3, 0.4, 10], pos:[px,3.5,-16], rot:[45,0,0] });
    //phy.add({ type:'sphere', size:[1], pos:[px,100,-18], density:10 });


    let i = 28, k = 0, l = 0;
    let x = 0, y = 0, z = 0;

    // debug help see geometry placement on first
    let debug = false;

    while (i--){

        x = -9+3*l
        y = 0;
        z = 5+(-9+3*k)

        barTable ( x, y, z, 0, debug )
        debug = false;
        l++;
        if( l>6 ) {k++; l=0 }

    }


}

function addRandomObject(x, y, z){

    let n, k, i
    let ar = math.shuffle([0,1,2,3,4])
    i = math.randInt(0, 3);

    while(i--){
        n = ar[i];
        k = items[n];
        phy.add({...k, pos:[x+math.rand(-0.60,0.60),y+0.76+k.py,z+math.rand(-0.60,0.60)], rot:[0,math.randInt(-180, 180),0]})
    }

}

function barTable ( x, y, z, r, debug = false ){

    makeTable ( x, y, z, r, debug );

    let v = new THREE.Vector3();
    let axis = new THREE.Vector3(0,1,0);
    let cr = 0;
    let i = math.randInt(2, 4);

    while( i-- ){

        if(i==0){ v.set( 0, 0, -0.8 ).applyAxisAngle( axis, r * math.torad ); cr = r; }
        if(i==1){ v.set( 0, 0, 0.8 ).applyAxisAngle( axis, r * math.torad ); cr = r+180; }
        if(i==2){ v.set( -0.7, 0, 0 ).applyAxisAngle( axis, r * math.torad ); cr = r+90; }
        if(i==3){ v.set( 0.7, 0, 0 ).applyAxisAngle( axis, r * math.torad ); cr = r-90; }
        makeChair( v.x+x, v.y+y, v.z+z, cr, debug );

    }

     addRandomObject(x, y, z)
    
}

function makeChair ( x, y, z, r, debug = false ) {

    var chairShape = [
        { type:'box', pos:[0,0,0], size:[ 0.56,0.06,0.56 ] },
        { type:'box', pos:[0.24,-0.22,0.24], size:[ 0.08,0.38,0.08 ] },
        { type:'box', pos:[-0.24,-0.22,0.24], size:[ 0.08,0.38,0.08 ] },
        { type:'box', pos:[0.24,-0.22,-0.24], size:[ 0.08,0.38,0.08 ] },
        { type:'box', pos:[-0.24,-0.22,-0.24], size:[ 0.08,0.38,0.08 ] },
        { type:'box', pos:[-0.23,0.11,0], size:[ 0.06,0.16,0.5 ] },
        { type:'box', pos:[0.23,0.11,0], size:[ 0.06,0.16,0.5 ] },
        { type:'box', pos:[0,0.315,-0.21], size:[ 0.45,0.25,0.1 ] },
    ]

    phy.add({
        type:'compound',
        density:0.5,
        pos:[ x||0,(y||0)+0.41,z||0 ],
        rot:[ 0,r||0,0],
        shapes: chairShape,
        mesh:model.chair_1,
        sleep: true,
        debug:debug,

    })

}

function makeTable ( x, y, z, r, debug = false ) {

    var tableShape = [
        { type:'box', pos:[0,0.37,0], size:[ 1.44,0.02,1.60 ] },
        { type:'box', pos:[0.6,-0.01,0.68], size:[ 0.09,0.74,0.09 ] },
        { type:'box', pos:[-0.6,-0.01,0.68], size:[ 0.09,0.74,0.09 ] },
        { type:'box', pos:[0.6,-0.01,-0.68], size:[ 0.09,0.74,0.09 ] },
        { type:'box', pos:[-0.6,-0.01,-0.68], size:[ 0.09,0.74,0.09 ] },
    ]

    phy.add({
        type:'compound',
        density:0.5,
        pos:[ x||0,(y||0)+0.38,z||0 ],
        rot:[ 0,r||0,0],
        shapes: tableShape,
        mesh:model.table_1,
        sleep: true,
        debug:debug,
    })

}

