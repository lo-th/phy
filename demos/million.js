
let py = 8
let a = 0;
let open1 = false;
let open2 = false;
let yellow = false;
//var timer = null
let game = 'start';
let result = [];
let final = [];
let balls = [];
let startPos = []
//let ballName = []
let model = null
let tmpTxt = []
let breakDeterminism = true;

let text = null

//let ballTest = true

let tmpCanvas = document.createElement('canvas')
tmpCanvas.width = tmpCanvas.height = 128

let bigCanvas = document.createElement('canvas')
bigCanvas.width = bigCanvas.height = 1024

demo = () => {

    phy.log( 'SPACE to restart' )

	phy.view({
		envmap:'beach', envblur:1.0, reflect:0.8,
        //ground:false,
        phi:20, theta:-20, distance:14, x:2, y:6, z:0, fov:70
	})

	// setting and start
	phy.set({ 
		substep:engine==='OIMO' || engine==='AMMO'?8:1,
		gravity:[0,-9.81,0],
        determinism:false,
        //averagePoint:false,
        ccd:true,
	})

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })



	phy.load(['./assets/models/million.glb'], onComplete )

}

onComplete = () => {

	model = phy.getMesh('million')

    model.L_roll.renderOrder = 1
    model.L_front.renderOrder = 2
    model.L_back.renderOrder = 3

    let m = phy.getMat('chrome')

    model.L_pale2_base.material = m
    model.M_pale2_base.material = m

    m = phy.getMat('plexi2')
    model.L_pale2.material = m
    model.M_pale2.material = m
    model.L_pale1.material = m
    model.M_pale1.material = m

    makeMachine()
    makeBall()

    text = phy.addText({text:'Win maybe millions ?', color:'#FFFFFF', pos:[4.5,0.3,3], rot:[-90,0,0]})

    phy.setTimeout( activeBall, 3000 )

}

activeBall = () => {

	let i = balls.length, r = [];
	while(i--){
		r.push({ name: balls[i].name, wake:true })
	}

	phy.change( r )

    phy.setTimeout( startSimulation, 3000 )

}

replay = () => {

    phy.setPostUpdate ( null )

    game = 'start'
    text.set( 'Win Millions' )

    a = 0
    yellow = false
    open1 = false
    open2 = false

    let r = [

        { name:'L_pale1', rot:[0,0,a+45], reset:true },
        { name:'L_pale2', rot:[0,0,-a],   reset:true },
        { name:'M_pale1', rot:[0,0,a+45], reset:true },
        { name:'M_pale2', rot:[0,0,-a],   reset:true },

        { name:'block1', pos:[ 0, -4.87+py, open1 ? -1 : 0 ] },
        { name:'block2', pos:[ 8.5, -4.87+py, open2 ? -1 : 0  ]}

    ]

    result = []
    final = []
    onReset ()
    
    let i = balls.length;
    while(i--){
        r.push({ name: balls[i].name, sleep:true, pos:startPos[i], rot:[0,0,0], reset:true })
    }

    phy.change( r )

    phy.setTimeout( activeBall, 3000 )

}

update = () => {

    let key = phy.getKey()
    if( key[4] === 1 ) replay()

	a+=1

	let r = [

        { name:'L_pale1', rot:[0,0,a+45], /*reset:true*/ },
        { name:'L_pale2', rot:[0,0,-a],   /*reset:true*/ },
        { name:'M_pale1', rot:[0,0,a+45], /*reset:true*/ },
        { name:'M_pale2', rot:[0,0,-a],   /*reset:true*/ },

        { name:'block1', pos:[ 0, -4.87+py, open1 ? -1 : 0 ] },
        { name:'block2', pos:[ 8.5, -4.87+py, open2 ? -1 : 0  ]}

    ]

    phy.change( r )

    if( game !== 'wantBall' ) return

    let i = balls.length, b
	while(i--){

		b = balls[i]
		if( result.indexOf( b.name ) === -1 ){
			if( b.position.y < (-5.4+py) ) haveBall( b.name );
		}

	}

}

startSimulation = () => {

	phy.setPostUpdate ( update )
    phy.setTimeout( wantBall, 12000 )
    //timer = setTimeout( wantBall, 12000 );

}

wantBall = () => {

	game = 'wantBall';

    if( yellow ) open2 = true
    else open1 = true

}

haveBall = ( name ) => {

	game = 'haveBall'

	open1 = false
	open2 = false
	
	result.push( name )
    

	if( result.length<5 ){

        final.push( Number(name.substring(4))+1 )
        phy.setTimeout( wantBall, 6000 )

	} else if(result.length<7){

        if(!yellow) final.push(  Number(name.substring(4))+1, '  ' )
        else final.push( (Number(name.substring(4))-50)+1 )
        yellow = true
        phy.setTimeout( wantBall, 6000 )

    } else {

        final.push( (Number(name.substring(4))-50)+1 )
		//phy.log( result )
	}

    text.set( final.join(' ') )

}

makeMachine = () => {

    let friction = 0.4;
    let bounce = 0.0;

    /*let meshs = [ 
	    'L_roll', 'L_back', 'L_front', 'L_rampe', 'L_pale1', 'L_pale2',
	    'M_roll', 'M_back', 'M_front', 'M_rampe', 'M_pale1', 'M_pale2'
    ]*/

    let meshs = [ 
        'L_roll', 'L_rampe', 'L_pale1', 'L_pale2',
        'M_roll', 'M_rampe', 'M_pale1', 'M_pale2'
    ]
    let i = meshs.length, name, p, d, m, br, k, shape



    phy.add({ 
        name:'block1', type:'box', density:0, //material:'glass',
        size:[1,0.2,1], pos:[0,-4.87+py,0],
        friction: 0, restitution: 0,
        //renderOrder:2,
        shadow: false,
        //visible:false,
        kinematic:true,
    })

    phy.add({ 
        name:'block2', type:'box', density:0, //material:'glass',
        size:[1,0.2,1], pos:[8.5,-4.87+py,0],
        friction: 0, restitution: 0,
        //renderOrder:3,
        shadow: false,
        //visible:false,
        kinematic:true,
    });


    while(i--){

    	name = meshs[i]
        br = name==='L_pale1' || name==='M_pale1' || name==='L_pale2' || name==='M_pale2'
        p = name==='L_pale1' || name==='M_pale1'
        d = name==='M_rampe' ? 0 : -1.8
        k = br ? true : false;

        shape = model[name].geometry;
        if(name==='L_roll') shape = model['L_shape'].geometry;
        if(name==='M_roll') shape = model['M_shape'].geometry;

        //if(!br){

    	phy.add({ 
	        name:name,
            type:'mesh', 
	        size:[10],
	        meshScale:[10],
	        mesh:model[name],
	        shape:shape,
            noClone:true,
	        //material:br?'silver':'glass',
            material:br?undefined:'glassX',
	        friction: friction, restitution: bounce,
	        //pos: i>5 ? [8.5,d+py,0] : [0,py,0],
            pos: i>3 ? [8.5,d+py,0] : [0,py,0],
	        rot: p ? [0,0,45]:[0,0,0],
	        //renderOrder:br?4:8,
            kinematic:k,
            ray:false,
            //debug:true,

	        //shadow: false,
	    })

       //}
    }

}


makeBall = () => {

    let ballGeo = model.ball.geometry.clone()
    ballGeo.scale(100,100,100) 

    let uvs = []
    let i, x, y, l, b, tmpMat, j = 0;

    // red ball

    for( i = 0; i < 50; i++){

        l = Math.floor(i/10)
        x = -27 + (j*6)
        y = 75 - (l*5.)
        uvs.push( createBallTexture( i+1 ) )
        startPos.push( [x*0.1, (y*0.1)+py, -1.16] )
        j++;
        if(j===10) j = 0;

    }

    // add yellow balls
    
    j = 0;
    for( i = 0; i < 12; i++){

        l = Math.floor(i/6)
        x = 70 + (j*6)
        y = 25 - (l*5)
        uvs.push( createBallTexture(  i+1, true ) )
        startPos.push( [x*0.1, (y*0.1)+py, -0.975] )
        j++;
        if(j===6) j = 0;

    }

    var t = new THREE.CanvasTexture( bigCanvas );
    t.needsUpdate = true;
    t.flipY = false;
    t.repeat.set(1/8,1/8)
    t.colorSpace = THREE.SRGBColorSpace;

    tmpMat = phy.material({
        name:'lotoball',
        roughness: 0.4,
        metalness: 0.6,
        map: t,
    })

    tmpMat.onBeforeCompile = function ( shader ) {
        // use color as uv move
        let fragment = shader.fragmentShader;
        fragment = fragment.replace( '#include <color_fragment>', '' );
        fragment = fragment.replace( '#include <map_fragment>', `
        #ifdef USE_MAP
            diffuseColor *= texture2D( map, vMapUv+vColor.rg );
        #endif
        ` );
        shader.fragmentShader = fragment;
    }

    

    let tmp = []

    for( i = 0; i < 62; i++){
        b = phy.add({
            instance:'ball',
            material: tmpMat,
            geometry: ballGeo,
            type:'sphere',
            size: [0.25],
            //pos:startPos[i],
            pos:math.addArray(startPos[i], [math.rand(-0.03,0.03), math.rand(-0.03,0.03), math.rand(-0.03,0.03)]),
            color:uvs[i],
            density:0.3,
            friction:0.4,
            restitution:0.1,
            sleep:true,
            useCCD:true,
            //startSleep:true,
        })

        balls.push( b )
        //ballName.push( 'ball'+(i) )
    }

    //phy.add(tmp)

}

onReset = () => {

    for(let m in tmpTxt) tmpTxt[m].dispose()
        
}

let tmpN = 0

createBallTexture = ( n, y) => {

    //var old = view.getTexture('ball_' + n + (y ? 'R':'Y'));
    //if( old !== null ) return old;

	ctx = tmpCanvas.getContext("2d");
    ctx2 = bigCanvas.getContext("2d");

    ctx.clearRect(0, 0, 128, 128);

	ctx.beginPath();
	ctx.rect(0, 0, 128, 128);
	ctx.fillStyle = y ? "#e1c75f" : "#c35839";
	ctx.fill();
    
    ctx.beginPath();
	ctx.arc(55, 64, 40, 0, 2 * Math.PI);
	ctx.fillStyle = "#FFFFFF";
	ctx.fill();

	ctx.beginPath();
	ctx.arc(73, 64, 40, 0, 2 * Math.PI);
	ctx.fill();

	ctx.beginPath();
	ctx.rect(55, 24, 18, 80);
	ctx.fill();

	ctx.beginPath();
	ctx.fillStyle = "#000000";
	ctx.textAlign = "center";
	ctx.font = 'bold 48px Arial';
	ctx.fillText( n, 64, 80 );

    let ny = Math.floor(tmpN / 8)
    nx = tmpN - (ny*8)
    ctx2.drawImage(tmpCanvas, nx*128, ny*128)
    tmpN ++

    return [nx/8,ny/8,0]

    /*let img = new Image(128, 128);
    img.src = tmpCanvas.toDataURL( 'image/png' );

	let t = new THREE.Texture( img );
	t.needsUpdate = true;
	t.flipY = false;
    t.name = 'ball_' + n + (y ? 'R':'Y');
    t.colorSpace = THREE.SRGBColorSpace;

    tmpTxt.push( t )
	return t;*/

}

