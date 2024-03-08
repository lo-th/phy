let player, trigger, jump = false, oy = 0, vy = 0;
const tmpV1 = new THREE.Vector3()
const tmpV2 = new THREE.Vector3()
const ease = new THREE.Vector3()
let tmpAcc = 0
let rs = 0, ts = 0
const diagonal = 1/Math.sqrt(2)

const speed = {
    idle:0,
    walk:5,
    run:10,
}

function demo() {

    phy.log('use key WSAD or ZSQD')

    phy.view({ envmap:'room', envblur:0.5, ground:true, fog:true, fogDist:0.02, phi:0, theta:0, distance:2, y:0.58, groundReflect:0.25 })

    phy.set({ 
        full:true,
        substep:1, 
        fixe:true,
        gravity:[0,-9.8,0],
    })

    phy.mouseMode('null')

    phy.lightIntensity( 4, 0.0, 0.7 );
    phy.useRealLight( {aoColor:0x441c00, irradianceColor:0xffCB99, envPower:1.5} );

    phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], friction:0, visible:false });



    const maps = [
    './assets/textures/museum/wakeup_ao.jpg',
    './assets/textures/museum/wakeup_n.jpg',
    ]

    const models = [
    './assets/models/museum/wakeup.glb',
    './assets/models/museum/frost.glb',
    './assets/models/museum/bear.glb',
    './assets/models/museum/musee.glb',
    ]

    phy.load([...maps, ...models], onComplete );

}

onComplete = () => {

    let scene = phy.getGlb('musee');
    let mats = phy.getGlbMaterial('musee');
    let mm = phy.getMesh('musee');
    for( let m in mm ){
        mm[m].castShadow = true;
        mm[m].receiveShadow = true;
    }
    let collision = phy.getMesh('musee').collision;
    scene.remove(collision);
    phy.add( scene );

    phy.add({
        type:'mesh',
        shape: collision.geometry,
        restitution:0, friction:0.5,
        material:'debug', visible:false
    })


    addPLayer();

    //

    let m = phy.getMesh('wakeup').wakeup002;
    let mat = phy.getGlbMaterial('wakeup');

    m.castShadow = true;
    m.receiveShadow = true;

    m.position.set(-2.5,0,-9.2)
    m.scale.set(5,5,5)
    phy.add(m)

    //

    let m1 = phy.getMesh('frost').frost_0;
    let mat1 = phy.getGlbMaterial('frost');

    m1.castShadow = true;
    m1.receiveShadow = true;

    m1.position.set(2.5,0,-9.2)
    m1.scale.set(5,5,5)
    phy.add(m1)

    //

    let m2 = phy.getMesh('bear').bear_0;
    let mat2 = phy.getGlbMaterial('bear');

    m2.castShadow = true;
    m2.receiveShadow = true;

    m2.position.set(-0.25,1,-5)
    m2.scale.set(6,6,6)

    //m.material = mat
    phy.add(m2)
}

addPLayer = () => {

    let r = 0.3;
    let h = 1.8-(2*r);
    player = phy.add({ 
        type:'capsule',
        name:'player',
        material:'debug',
        size:[ r,h ], pos:[0,1.8*0.5,10], angularFactor:[0,0,0], 
        density:1, //damping:[0.01,0], friction:0.5, group:32,
        friction:0,
        inertia:[0,0,0],
        regular:true,
        filter:[1,-1,[1, 3, 4,5,9], 0],
        ray:false,
        noGravity:true,
        neverSleep:true,
        visible:false
    })

    phy.follow('player', { 
        direct:true, simple:true, decal:[0,h*0.5,0], phi:0, distance:0.01, 
        enableDamping:true, dampingFactor:0.05,
        //enableDamping:false,
    })


    // update after physic step
    phy.setPostUpdate ( update )
}


update = () => {

    let delta = phy.getDelta()
    let r = phy.getAzimut()
    let key = phy.getKey()

    let anim = key[7] !== 0 ? 'run' : 'walk';
    if( key[0] === 0 && key[1] === 0 ) anim = 'idle';

    let m = key[0] !== 0 && key[1] !== 0 ? diagonal : 1
    
    if( key[0] !== 0 || key[1] !== 0 ){ 

        //s += 1= speed[anim] * tmpAcc

        tmpAcc += math.lerp( tmpAcc, 1, delta/10 )//0.2
        tmpAcc = math.clamp( tmpAcc, 1, speed[anim] )

        rs += key[0] * tmpAcc;
        ts += key[1] * tmpAcc;// * delta

        //rs = key[0] * tmpAcc//* delta
        //ts = key[1] * tmpAcc//* delta

        //dir.set(key[0], 0, key[1])
        //
        //rs = key[0]*tmpAcc;
        //ts = key[1]*tmpAcc;
    } //else {
    //    tmpAcc -= 0.01
    //}
    if( key[0] === 0 && key[1] === 0 ) tmpAcc = 0;//*= 0.9
    if( key[0] === 0 ) rs = 0;
    if( key[1] === 0 ) ts = 0;

    rs = math.clamp( rs, -speed[anim], speed[anim] ) * m
    ts = math.clamp( ts, -speed[anim], speed[anim] ) * m

    if( !jump && key[4] ){ vy = 30; jump = true; } // SPACE KEY

    if( jump ){

        vy-=1;
        if(vy <= 0 ){ 
            vy = 0; 
            if( player.position.y === oy ) jump = false;
        }
     }



    // gravity
    let g = (-9.81) + vy;

    tmpV1.set( rs, g, ts ).applyAxisAngle( { x:0, y:1, z:0 }, r );
    //math.tmpV2.set( 0, rs, 0 );
    tmpV2.set( 0, 0, 0 );

    phy.change({ name:'player', linearVelocity: tmpV1.toArray(), angularVelocity: tmpV2.toArray() });

    oy = player.position.y;


}