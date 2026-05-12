const chess = ['king', 'queen', 'bishop', 'knight', 'rook', 'pawn'];
const h = [ 3.785, 3.4, 2.716, 2.648, 2.138, 1.973 ];
const chessSize = 0.25;

// real size is 0.53m * 0.53m

 demo = async() => {

    phy.view({ 
        theta:15,
        envmap:'photo', envblur: 0.5, ground:true, groundAlpha:false,
        groundSize:[ 8.9, 8.9 ], groundReflect:0.05,
        exposure:0.2,
        direct:20,
     })

    

    phy.set({ substep:1, worldScale:0.2 })

    //phy.lightIntensity( 6, 0, 0.7 );
    

    /*
    let grid = new THREE.GridHelper( 8, 8, 0x2f875d, 0x2f875d )
    grid.material.opacity = 0.1
    grid.position.y = 0.01
    grid.material.transparent = true
    phy.addDirect( grid )
    */

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], pos:[0, -0.02, 0], visible:false });
    phy.add({ type:'box', size:[8.9,1,8.9], pos:[0, -0.5, 0], visible:false, friction:0.5, restitution:0.25 })

    

    let g = phy.getGround()
    g.material.map = await phy.texture2({ url:'./assets/textures/chess/chessboard.jpg', repeat:[1,1], flip:true, encoding:true });
    g.material.roughness = 0.7;
    g.material.metalness = 0.0;

    phy.load(['./assets/models/chess.glb', './assets/models/chessclock.glb'], onComplete )

}

onComplete = () => {

    // CLOCK
    addClock()

    // PIECES

    const model = phy.getMesh('chess');

    let m = phy.texture({ url:'./assets/textures/chess/chess.jpg', flip:true, encoding:true })
    let defMat = {
        roughness: 0.25, metalness: 0.2, aoMap:m, aoMapIntensity:0.7, 
    }
    phy.material({ name:'Black', ...defMat, map:createChessTexture(false) })
    phy.material({ name:'White', ...defMat, map:createChessTexture(true) })

    let p = [

    { type:'rook', id:1 },
    { type:'knight', id:1, rot:[0,-90,0] },
    { type:'bishop', id:1 },
    { type:'queen', id:0 },
    { type:'king', id:0, rot:[0,90,0] },
    { type:'bishop', id:2},
    { type:'knight', id:2, rot:[0,90,0] },
    { type:'rook', id:2 },

    { type:'pawn', id:1 },
    { type:'pawn', id:2 },
    { type:'pawn', id:3 },
    { type:'pawn', id:4 },
    { type:'pawn', id:5 },
    { type:'pawn', id:6 },
    { type:'pawn', id:7 },
    { type:'pawn', id:8 },

    { type:'pawn', id:1, black:true, decal:[-4*4,0] },
    { type:'pawn', id:2, black:true },
    { type:'pawn', id:3, black:true },
    { type:'pawn', id:4, black:true },
    { type:'pawn', id:5, black:true },
    { type:'pawn', id:6, black:true },
    { type:'pawn', id:7, black:true },
    { type:'pawn', id:8, black:true },
    { type:'rook', id:1, black:true },

    { type:'knight', id:1, black:true, rot:[0,-90,0] },
    { type:'bishop', id:1, black:true, rot:[0,180,0] },
    { type:'queen', id:0, black:true },
    { type:'king', id:0, black:true, rot:[0,90,0] },
    { type:'bishop', id:2, black:true, rot:[0,180,0] },
    { type:'knight', id:2, black:true, rot:[0,90,0] },
    { type:'rook', id:2, black:true }

    ]

    calculatePosition( p )

    let i = p.length
    while(i--) phy.add( addPiece( p[i], i, model ))

}

calculatePosition = ( items ) => {

    let cell = [4,8]
    let space = [4,4]
    let center = [-8,0]

    let x = cell[0]
    let z = cell[1]
    let sx = space[0]
    let sz = space[1]
    let dx = ((x*sx)*0.5) - x*0.5
    let dz = ((z*sz)*0.5) - z*0.5
    dz+=2
    let n = 0, i, j, item;

    for( i = 0; i < x; i++){
    	for( j = 0; j < z; j++){

            item = items[n]
            if( item.decal !== undefined ){
                dx += item.decal[0]
                dz += item.decal[1]
            }
            item.pos = [ (i*sx)+center[0]-dx, 0, (j*sz)+center[1]-dz ]
            n++
    	}
    }
}

addPiece = ( o, i, model ) => {

    var n = chess.indexOf( o.type )

    let name = (o.black ? 'B_' : 'W_') + o.type + ( o.id ? '_' + o.id : '' )

    o.pos = math.scaleArray( o.pos, chessSize )

    return {

    	name: name, 
    	shape: model[ o.type + '_shape' ].geometry,
    	mesh: model[ o.type ],
        meshSize:chessSize,
    	material: o.black ? 'Black' : 'White', 
    	type: 'convex', 
    	size: [ chessSize ], 
    	pos: [ o.pos[0] || 0,( o.pos[1] || 0) + h[n]*chessSize, o.pos[2] || 0 ], 
    	rot: o.rot || [0,0,0],
    	density: 1,
    	friction:o.friction || 0.5,
    	restitution:0.25,
    	//rolling:0.9,
    	//damping:[0, 0.5],
    	margin:0.000001,
    }
}

createChessTexture = ( white ) => {
    
    let tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = tmpCanvas.height = 128;
    ctx = tmpCanvas.getContext("2d");

    ctx.beginPath();
    ctx.rect(0, 0, 128, 128);
    ctx.fillStyle = white ? "#cbad7b" : "#343434";
    ctx.fill();

    ctx.beginPath();
    ctx.rect(0, 128-13, 128, 13);
    ctx.fillStyle = "#0a552f";
    ctx.fill();

    let img = new Image(128, 128);
    img.src = tmpCanvas.toDataURL( 'image/png' );

    let t = new THREE.Texture( img );
    t.needsUpdate = true;
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;

    return t;
}

addClock = () => {

    const clockMesh = phy.getMesh('chessclock');

    phy.add({ type:'box', size:[3,1.6,1.1], pos:[0, 0.8-0.02, -5.2], mass:1, mesh:clockMesh.clock })

    let b = clockMesh.border.clone();
    b.material = phy.material({ name:'Border', roughness: 1, metalness: 0, color:0xe8dada })
    b.receiveShadow = true;
    phy.add(b);

    let z = clockMesh.zone.clone();
    z.material = phy.getMaterial('shadow');
    z.receiveShadow = true;
    phy.add(z);
    
}