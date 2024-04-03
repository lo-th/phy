let n = 4;
let gui = null;
let tmp = [];
const setting = { gravity:-9.81, auto:true, name:'' };
const list = [ 'restitution', 'friction 1', 'friction 2', 'friction 3', 'stacking' ];
const data = {
    wood: { size:[1, 0.1, 1], type:'box', meshSize:0.5, instance:'wood_floor', mesh:null },
    wall: { size:[1, 1, 0.15], type:'box', meshSize:0.5, instance:'wood_wall', mesh:null },
    stone: { size:[1, 0.5, 0.5], type:'box', meshSize:0.5, instance:'stone', mesh:null }
}

demo = () => {

    phy.view({ theta:-25, distance:30, x:0, ground:true, envmap:'clear' });
    phy.set({ substep:1, gravity:[0,-9.81,0] });

    //phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false });
    phy.add({ type:'box', name:'floor', size:[ 100,1,100 ], pos:[0,-0.5,0], visible:false });

    // gui
    gui = phy.gui();
    
    gui.add( setting, 'name', { type:'grid', values:list, selectable:true, h:26 } ).listen().onChange( click )
    gui.add( setting, 'gravity', { min:-30, max:0, mode:2 } ).onChange( (v) => { phy.setGravity([0,v,0]) } )
    gui.add( setting, 'auto' ).listen().onChange( ( b ) => { if(b) next(); } )

    phy.load(['./assets/models/VV.glb'], onComplete );
 
}

onComplete = () => {

    let meshes = phy.getMesh('VV', true );
    meshes.wood_floor.material.roughness = 0.5;
    //meshes.wood_floor.material.shadowSide = THREE.DoubleSide;
    //console.log(meshes.wood_floor.material)
    data.wood.mesh = meshes.wood_floor;
    data.wall.mesh = meshes.wood_wall;
    data.stone.mesh = meshes.stone;

    run();

}

click = ( name ) => {

    let i = list.indexOf(name);
    if(i!==-1){
        setting.auto = false;
        phy.cleartimout();
        n = i;
        run();
    }

}

next = () => {

    n ++
    if( n === list.length ) n = 0 
    phy.setTimeout( run, 10000 )

}

run = () => {

    phy.remove( tmp );
    tmp = [];
    this['test_'+n]();
    if( setting.auto ) next();

}

test_0 = () => {
    setting.name = 'restitution';
    let i = 8;
    let r = 1/(i-1);
    while(i--){
        phy.add({ name:'b'+i, type:'box', size:[1.5, 0.2, 1.5], pos:[-7 + (i*2), 0.1, 0 ], restitution: i * r })
        phy.add({ name:'s'+i,  type:'sphere', size:[0.5], pos:[-7 + (i*2), 5, 0 ], restitution: i * r, density:1 })
        tmp.push( 'b'+i, 's'+i );
    }

}

test_1 = () => {
    setting.name = 'friction 1';
    let a = 45
    let i = 8
    let r = 1/(i-1)
    while(i--){
        phy.add({ name:'b'+i, type:'box', size:[1.5, 0.15, 5], rot:[a,0,0], pos:[-7 + (i*2), 2, 0 ], friction: 1 })
        phy.add({ ...data.wood, name:'s'+i, rot:[a,0,0], pos:[-7 + (i*2), 4, -1.5 ], friction: i * r, density:1 })
        tmp.push( 'b'+i, 's'+i );
    }
}

test_2 = () => {
    setting.name = 'friction 2';
    let a = 36
    let i = 8
    let r = 1/(i-1)
    while(i--){
        phy.add({ name:'b'+i, type:'box', size:[1.5, 0.2, 5], rot:[a,0,0], pos:[-7 + (i*2), 2, 0 ], friction: 1 })
        phy.add({ ...data.wood, name:'s'+i, rot:[a,0,0], pos:[-7 + (i*2), 4, -1.5 ], friction: i * r, density:1 })
        phy.add({ ...data.wood, name:'d'+i, rot:[a,0,0], pos:[-7 + (i*2), 4+0.22, -1.5 ], friction: i * r, density:1 })
        phy.add({ ...data.wood, name:'g'+i, rot:[a,0,0], pos:[-7 + (i*2), 4+0.44, -1.5 ], friction: i * r, density:1 })
        phy.add({ ...data.wood, name:'h'+i, rot:[a,0,0], pos:[-7 + (i*2), 4+0.66, -1.5 ], friction: i * r, density:1 })
        tmp.push( 'b'+i, 's'+i, 'd'+i, 'g'+i, 'h'+i );
    }
}

test_3 = () => {
    setting.name = 'friction 3';
    let a = 36
    let i = 8
    let r = 1/(i-1)
    while(i--){
        phy.add({ name:'b'+i, type:'box', size:[1.5, 0.2, 5], rot:[a,0,0], pos:[-7 + (i*2), 2, 0 ], friction: i * r })
        phy.add({ ...data.wood, name:'s'+i, rot:[a,0,0], pos:[-7 + (i*2), 5, -1.5 ], friction: i * r, density:1, angularVelocity:[0,10,0] })
        tmp.push( 'b'+i, 's'+i );
    }
}

test_4 = () => {
    setting.name = 'stacking';
    
    let i = 16
    let px = i*0.5
    while(i--){
        phy.add({ ...data.wall, name:'a'+i, pos:[-px + (i), 0.5, -1.5 ], friction: 0.5, density:1 })
        phy.add({ ...data.wall, name:'b'+i, pos:[-px + (i), 1.5, -1.5 ], friction: 0.5, density:1 })
        phy.add({ ...data.wall, name:'c'+i, pos:[-px + (i), 2.5, -1.5 ], friction: 0.5, density:1 })
        phy.add({ ...data.wall, name:'d'+i, pos:[-px + (i), 3.5, -1.5 ], friction: 0.5, density:1 })

        phy.add({ ...data.stone, name:'s'+i, pos:[0, 0.25+(i*0.5), -0.5 ], friction: 0.5, density:1 })
        tmp.push( 'a'+i, 'b'+i, 'c'+i, 'd'+i, 's'+i );
    }

    phy.remove(['a2','b6','c8'])
}