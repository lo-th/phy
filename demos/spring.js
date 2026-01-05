let pp, mesh 
let N = 0
let list = []
const setting = { 
    stiffness:100,
    damping:1,
    distance:0.01,
};

function demo() {


    let g1 = 1 << 6
    let g2 = 1 << 7
    let g3 = 1 << 8

    phy.view({ distance:10 })

    // config physics setting
    phy.set( { substep:1, gravity:[0,-10,0], full:true, jointVisible:false });

    phy.add({ type:'container', material:'debug', color:0x000000, remplace:true, intern:true, size:[6,20,6], pos:[0,10,0], face:{up:0}, wall:0.4 });


    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false });

    let rand = math.rand

    addSpringFloor( 10, 10, 0.025 )
    addBalls( 10, 10, 0.2 )
    addGui()

}

/// GUI ///

addGui = () => {

    gui = phy.gui()
    gui.add( 'button', {  value: [ 'add ball'] } ).onChange( (n) => { switch(n){ case 'clear':clear(); break; case 'add ball':addBalls( 10, 10, 0.2 ); break; } } )
    gui.add( setting, 'distance', { min:0, max:1, mode:2 } ).onChange( () => { setSpring() } )
    gui.add( setting, 'stiffness', { min:0, max:100, mode:2 } ).onChange( () => { setSpring() } )
    gui.add( setting, 'damping', { min:0, max:100, mode:2 } ).onChange( () => { setSpring() } )

}

setSpring = () => {

    let i = list.length;
    let dt = []
    while(i--){
        dt.push({ name:list[i], lm:[-setting.distance, setting.distance, setting.stiffness, setting.damping] })
    }
    phy.change(dt)

}

addSpringFloor = ( nx, ny, space=0.1, h=2, sx=6, sy=6  ) => {

    N = 0
    list = []

    let px = sx/nx
    let py = sy/ny
    let mx = px*0.5
    let my = py*0.5
    let dx = (px*(nx-1))*0.5
    let dy = (py*(ny-1))*0.5

    for(j = 0; j<nx; j++){
    for(i = 0; i<ny; i++){
        addSpringyFloor([ (j*px) - dx, 0, (i*py) - dy ], [px-space, 0.2, py-space], h );
    }}

}

addBalls = ( nx, ny, sb=0.1, h=16, sx=6, sy=6  ) => {

    phy.remove('balls')

    let px = sx/nx
    let py = sy/ny
    let mx = px*0.5
    let my = py*0.5
    let dx = (px*(nx-1))*0.5
    let dy = (py*(ny-1))*0.5

    for(j = 0; j<nx; j++){
    for(i = 0; i<ny; i++){
        phy.add({ type:'sphere', pos:[(j*px) - dx, h-math.rand(0,3), (i*py) - dy], size:[sb], mass:0.5, instance:'balls' });
    }}

}

addSpringyFloor = ( pos, size, h = 2 ) => {

    let div = math.scaleArray(size, 0.5);
    let floor = phy.add({ type:'box', pos:[pos[0],h,pos[2]], size:size, mass:1, friction:0.5, radius:0.05 });
    let base = phy.add({ type:'box', pos:[pos[0],div[1]*0.5,pos[2]], size:div });
    
    let j = phy.add({
        name:'spring_'+N,
        type:'prismatic', b1:base, b2:floor,
        worldPos:[pos[0],h,pos[2]],
        worldAxis:[0,1,0],
        limit:[-setting.distance, setting.distance, setting.stiffness, setting.damping ],
    });
    list.push('spring_'+N);
    N++;

}

update = () => {
}