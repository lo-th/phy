var model;

function demo() {

    // config physics setting
    phy.set( {substep:2, gravity:[0,-9.81,0]});

    // add static ground
    //phy.add({ type:'plane', size:[300,1,300], visible:false });
    phy.add({ type:'box', size:[300,1,300], pos:[0, -0.5, 0], visible:false })

    phy.load(['./assets/models/furniture.glb'], onComplete );

}

function onComplete(){

    model = phy.getGroup('furniture');

    let m = model.table_1;
    let j = m.children.length
    while( j-- ){
        m.children[j].castShadow = true;
        m.children[j].receiveShadow = true;
        phy.material( m.children[j].material );
    }

    m = model.chair_1;
    j = m.children.length
    while( j-- ){
         m.children[j].castShadow = true;
         m.children[j].receiveShadow = true;
         phy.material( m.children[j].material );
    }



    let px = math.rand( -6, 6 );

    phy.add({ size:[3, 0.4, 10], pos:[px,3.5,-16], rot:[45,0,0] });
    phy.add({ type:'sphere', size:[1], pos:[px,100,-18], density:10 });


    let i = 28, k=0, l=0;

    while (i--){

        barTable ( -9+3*l, 0, -9+3*k, 45 )
        l++;
        if( l>6 ) {k++; l=0 }

    }


}

function barTable ( x, y, z, r ){

    makeTable ( x, y, z, r );

    let v = new THREE.Vector3();
    let axis = new THREE.Vector3(0,1,0);
    let cr = 0;

    let i = 4;
    while( i-- ){

        if(i==0){ v.set( 0, 0, -0.8 ).applyAxisAngle( axis, r * math.torad ); cr = r; }
        if(i==1){ v.set( 0, 0, 0.8 ).applyAxisAngle( axis, r * math.torad ); cr = r+180; }
        if(i==2){ v.set( -0.7, 0, 0 ).applyAxisAngle( axis, r * math.torad ); cr = r+90; }
        if(i==3){ v.set( 0.7, 0, 0 ).applyAxisAngle( axis, r * math.torad ); cr = r-90; }
        makeChair( v.x+x, v.y+y, v.z+z, cr );

    }
    
}

function makeChair ( x, y, z, r ) {

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
    })

}

function makeTable ( x, y, z, r ) {

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
        //material:'debug',
        mesh:model.table_1,
        sleep: true,
    })

}