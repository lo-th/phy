const max = 600;
let saving = []
let g1 = 1 << 6 // 64
let g2 = 1 << 7 // 128
let g3 = 1 << 8 // 256
let speed = 0

demo = () => {

    phy.view({ envmap:'room', envblur:0.5, d:10, theta:0, phi:25, reflect:0.25 })

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0], key:true })

    // add static ground box
    phy.add({ type:'box', size:[100,4,100], pos:[0, -2, 0], restitution:0.2, visible:false })

    addGui()

    initCar()

    // update after physic step
    phy.setPostUpdate ( update )

    //phy.load(['./assets/models/coin.glb'], begin );

}

const addGui = () => {

    gui = phy.gui();
    /*gui.add('grid',{ values:['SAVE', 'RESTOR'], selectable:false, radius:6 }).onChange( (n)=>{
        if(n==='SAVE') save()
        if(n==='RESTOR') begin(saving)
    } );*/

}

update = () => {
    let key = phy.getKey()
    let delta = phy.getDelta()
    let r = phy.getAzimut()

    let c = []

    if(key[1]!==0){
        speed += -key[1]*10
        
        /*c.push({ name:'car_JW0', motor:[['rx', speed, 'VELOCITY', 180000]] })
        c.push({ name:'car_JW1', motor:[['rx', speed, 'VELOCITY', 180000]] })
        c.push({ name:'car_JW2', motor:[['rx', speed, 'VELOCITY', 180000]] })
        c.push({ name:'car_JW3', motor:[['rx', speed, 'VELOCITY', 180000]] })
        */
    } else {
        speed = 0
    }

    c.push({ name:'car_JW0', driveVelocity:{rot:[speed,0,0]} })
    c.push({ name:'car_JW1', driveVelocity:{rot:[speed,0,0]} })
    c.push({ name:'car_JW2', driveVelocity:{rot:[speed,0,0]} })
    c.push({ name:'car_JW3', driveVelocity:{rot:[speed,0,0]} })

    c.push({ name:'car_JA0', drivePosition:{rot:[0,-key[0]*25,0]} })
    c.push({ name:'car_JA1', drivePosition:{rot:[0,-key[0]*25,0]} })

    if(c.length) phy.change( c )
}

initCar = () => {

    let name = 'car'

    let py = 3

    let chassie = phy.add({ name:name+'_chassie', type:'box', size:[2,0.1,4], pos:[0,py,0], mass:100, restitution:0, friction:0, group:g1, mask:1|2 })

    let r = 0.3
    let d = 0.3
    let wx = 1
    let wz = 1.8

    let wheelGeo = new THREE.CylinderGeometry( r, r, d, 60, 1 );
    wheelGeo.rotateZ( -Math.PI*0.5 );
    let wheelMesh = new THREE.Mesh(wheelGeo)

    CreateWheel(name, r, d, [wx, py, -wz], 0, 20, wheelMesh);
    CreateWheel(name, r, d, [-wx, py, -wz], 1, 20, wheelMesh);
    CreateWheel(name, r, d, [wx, py, wz], 2, 20, wheelMesh);
    CreateWheel(name, r, d, [-wx, py, wz], 3, 20, wheelMesh);

}


CreateWheel = ( name, r, d, pos, id, m, mesh ) => {



    phy.add({ name:name+'_A'+id, type:'box', size:[r,r*0.5,r*0.5], pos:pos, mass:m*0.5, restitution:0, friction:0, group:g1, mask:1|2, material:'debug' })
    //phy.add({ name:name+'_W'+id, type:'cylinder', size:[r,d], rot:[0,0,90], seg:60, pos:pos, mass:m*0.5, restitution:0.1, friction:50, group:g1, mask:1|2, material:'debug' })
    phy.add({ name:name+'_W'+id, type:'sphere', size:[r,d], rot:[0,0,0], seg:60, pos:pos, mass:m*0.5, restitution:0.1, friction:50, group:g1, mask:1|2, material:'debug', mesh:mesh })

    let lm = id>1 ? [['y', -0.05, 0.05, 100000, 5000]] : [['y', -0.05, 0.05, 100000, 5000], ['ry', -25, 25, 100000, 5000]]

    let Q = [0,0,0,1]

    phy.add({ 
        type:'generic', 
        name: name+'_JA'+id, 
        b1:name+'_chassie', b2:name+'_A'+id, 
        worldPos:pos,
        //worldAxis:[1,0,0], 
        worldQuat:Q,
        limit:lm,
        drive: id>1 ? [] : [['ry', 10000, 100, 1000]],
        friction:0, collision:false, visible:true 
    });

    phy.add({ 
        type:'generic', 
        name: name+'_JW'+id, 
        b1:name+'_A'+id, b2:name+'_W'+id, 
        worldPos:pos,
        //worldAxis:[1,0,0], 
        worldQuat:Q,
        motion:[['rx','free']],
        //limit:[['rx', -180, 180 ]],
        drive: [['rx', 10, 10, 1000000, true]],
        friction:0, collision:false, visible:true 
    });



}