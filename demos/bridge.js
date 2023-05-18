let px = 5
let side = 0
let ready = false
let bob = null


demo = () => {

    phy.view({
        distance:20
    })
    
    // config physics setting
    phy.set( {substep:1, gravity:[0,-9.81,0]} )

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })
    // add static box
    phy.add({ type:'box', size:[4,4,4], pos:[9,2,0] })
    phy.add({ type:'box', size:[4,4,4], pos:[-9,2,0] })
    phy.add({ type:'box', size:[4,2,4], pos:[9,1,4] })
    phy.add({ type:'box', size:[4,2,4], pos:[-9,1,4] })

    addBridge()

    let rand = math.rand

    // add random object
    i=5;
    while(i--){
        phy.add({ type:'box', size:[ rand( 0.3,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
        phy.add({ type:'sphere', size:[ rand( 0.3,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
        phy.add({ type:'cone', size:[ rand( 0.4,  0.6 ), rand( 0.4,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
    }

    // platform test
    phy.add({ type:'box', name:'kine', size:[4,0.4,4], pos:[ px, 1.8, 4 ], radius:0.02, kinematic:true, density: 0, friction:1, neverSleep:true });
    phy.add({ type:'box', name:'truc', size:[1,1,1], pos:[ px, 2.9, 4 ], radius:0.02, density: 0.1, friction:1 });

    phy.setPostUpdate ( update )
    phy.setTimeout( go, 4000 )

    addCharacter()

}

const addBridge = ( width = 4, height = 0.3, length = 0.7 ) => {

    let isLocal = true
    let num = 20;
    let gap = 0.05
    let size = [ length, height, width ]
    let i = num
    let data = []
    
    while( i-- ){
        x = (i - (num - 1) * 0.5) * (length + gap);
        data.push({ type:'box', name:'b'+i, size:size, pos:[ x, 4-(height*0.5), 0 ], radius:0.02, density: i == 0 || i == num - 1? 0 : 1 });
    }

    i = num-1
    while( i-- ){
        
        if( isLocal ){ // local joint
            x = (length + gap) * 0.5
            data.push({ type:'joint', name:'j'+i, b1:'b'+i, b2:'b'+(i+1), pos1:[x,0,0], pos2:[-x,0,0], worldAxis:[0,0,1], lm:[-10,10] })
        } else { // world joint
            x = (i - (num - 1) * 0.5) * (length + gap)
            data.push({ type:'joint', name:'j'+i, b1:'b'+i, b2:'b'+(i+1), worldAnchor:[x+(length*0.5),4,0], worldAxis:[0,0,1], lm:[-10,10 ], sd:[20,1, 0, 0.5, -1] })
        }
        
    }

    phy.add(data)

}

const go = () => {

    side = -1
    ready = true

    

}

const update = () => {

    if(!ready) return

    px += 0.03 * side
    if(px<=-5) side = 1
    if(px>=5) side = -1
    

    phy.change({name:'kine', pos:[ px, 1.8, 4 ], acc:true})

   if(bob) updateCharacter()

}


const tmpV1 = new THREE.Vector3()
const tmpV2 = new THREE.Vector3()
const ease = new THREE.Vector3()
let tmpAcc = 0
let rs = 0, ts = 0
const diagonal = 1/Math.sqrt(2)
let jump = false, oy = 0, vy = 0;
const speed = {
    idle:0,
    walk:10,
    run:20,
}


const addCharacter = () => {

    let r = 0.35
    let h = 1.8-(2*r)

    bob = phy.add({ 
        type:'capsule', 
        name:'bob', 
        material:'hero', 

        size:[ r, h ], pos:[-9,h*0.5,7], angularFactor:[0,0,0], 
        density:1,  friction:0.5, group:32,
        //damping:[0.01,0],
        //material:'debug',
        inertia:[0,0,0],
        //order:'YXZ',
        regular:true,
        //filter:[1,-1,[4,5, 11], 0]
        filter:[1,-1,[1, 3, 4,5,9], 0],
        //ray:false,
        noGravity:true,
    })

    //phy.follow('bob', { direct:true, simple:true, decal:[0.3, 1, -0.3] })

}

const updateCharacter = () => {

    let delta = phy.getDelta()
    let r = phy.getAzimut()
    let key = phy.getKey()

    let anim = key[7] !== 0 ? 'run' : 'walk'
    if( key[0] === 0 && key[1] === 0 ) anim = 'idle'

    let m = key[0] !== 0 && key[1] !== 0 ? diagonal : 1
    
    if( key[0] !== 0 || key[1] !== 0 ){ 

        tmpAcc += 0.2//math.lerp( tmpAcc, 1, delta/10 )
        tmpAcc = math.clamp( tmpAcc, 1, speed[anim] )

        rs += key[0] * tmpAcc//* delta
        ts += key[1] * tmpAcc//* delta
    } //else {
    //    tmpAcc -= 0.01
    //}
    if( key[0] === 0 && key[1] === 0 ) tmpAcc = 0//*= 0.9
    if( key[0] === 0 ) rs = 0
    if( key[1] === 0 ) ts = 0

    rs = math.clamp( rs, -speed[anim], speed[anim] ) * m
    ts = math.clamp( ts, -speed[anim], speed[anim] ) * m

    if( !jump && key[4] ){ vy = 28; jump = true; } // SPACE KEY

    if( jump ){

        vy-=1;
        if(vy <= 0 ){ 
            vy = 0; 
            if( bob.position.y === oy ) jump = false;
        }
    }

    // gravity
    let g = (-9.81) + vy;


    tmpV1.set( rs, g, ts ).applyAxisAngle( { x:0, y:1, z:0 }, r );
    //math.tmpV2.set( 0, rs, 0 );
    tmpV2.set( 0, 0, 0 );


    //phy.update( { name:'bob', linearVelocity: math.tmpV1.toArray(), angularVelocity: math.tmpV2.toArray(), inTime: true, forceWake:true } );

    phy.change({ name:'bob', linearVelocity: tmpV1.toArray(), angularVelocity: tmpV2.toArray(), /*rot:[0,r*math.todeg, 0],*/ wake:true });

    oy = bob.position.y;

}