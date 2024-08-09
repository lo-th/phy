let r = 0;
let inc = 0;
let sph = [];
let model 

let time = 1000;
let tween = null;
let graph = null;

const setting = { name:'', speed:0.2, r };

demo = () => {

    phy.view({ phi:30, theta:0, distance:12, x:0, y:1, z:0, fov:70, envmap:'small', envblur: 0.5, reflect:0.5 })
	phy.set({ full:true, substep:1, gravity:[0,-9.81, 0 ], fps:60, ccd:true, fixe:true })
    phy.material({ name:'noctua', roughness: 0.5, metalness: 0, color:0x551705 })
    phy.load(['./assets/models/fan.glb'], onComplete )

}

const onComplete = () => {

    model = phy.getMesh('fan')

    demo_position()

    // update on each physic step
    phy.onStep = update;

    // gui
    let gui = phy.gui();
    gui.add( setting, 'speed', { min:0, max:1, mode:0, h:30 } )
    gui.add( setting, 'name', { type:'grid', values:['position', 'rotation'], selectable:true } ).onChange( click )
  
}

const click = (name) => {

    r = 0;
    phy.clearGarbage();
    if(tween) TWEEN.remove(tween);

    switch(name){
        case 'position': demo_position(); break;
        case 'rotation': demo_rotation(); break;
    }

}

const update = () => {

    //let dt = phy.getDelta();


    if( setting.name === 'rotation' ){
        r -= (setting.speed*5)
        phy.change( { name:'fan', rot:[0,r,0] } )
    }


}

const demo_position = () => {

    setting.name = 'position'

    let demoData = [];
    demoData.push({ type:'container', material:'debug', size:[10,3,10], pos:[0,1.5,0], friction:0.5, restitution:0, remplace:true, wall:10, radius:0, intern:true, color:0x000000 });
    demoData.push({ name:'mobile', type:'box', radius:0.05, size:[1,3,1],  pos:[0,1.5,0], material:'noctua', kinematic:true })
    let i = 1000;
    while(i--){
        demoData.push({ instance:'ball', type:'sphere', size:[math.rand(0.1,0.25)], pos:[math.rand(-4.5,4.5), 0.4, math.rand(-4.5,4.5) ], mass:1, material:'body', speedMat:true, bullet:true })
    }

    phy.add( demoData );
    demoData = null;

    pause()

}

const goto = () => {

    let time =  1100 - (setting.speed*1000);
    let p, x, z

    if(setting.name === 'position'){
        let x = math.rand(-4.5,4.5);
        let z = math.rand(-4.5,4.5);
        let p = phy.byName('mobile').position.clone();
        let d = math.distanceArray([p.x,0,p.z],[x,0,z])

        tween = new TWEEN.Tween( p )
        .to({ x:x, z:z }, time*d )
        .easing( TWEEN.Easing.Sinusoidal.In)//Quadratic.Out )
        .onUpdate( ()=>{ phy.change({ name:'mobile', pos:p.toArray() }) } )
        .onComplete( ()=>{ pause() })
        .start()
    }

}

const pause = () => {

    let time = 1000 + 1100 - (setting.speed*1000);
    tween = new TWEEN.Tween( {v:0} ).to({v:1}, time ).onComplete( ()=>{ goto() }).start()

}

const demo_rotation = () => {

    setting.name = 'rotation'

    const model = phy.getMesh('fan')
    const shapes = [];

    //let mat = phy.material({ name:'noctua', roughness: 0.5, metalness: 0, color:0x551705 })
    //model.fan.children[0].material = mat;

    let i = 7
    let r = 360/7

    shapes.push( { type:'convex', shape:model.fan_center.geometry, rot:[0,r*i, 0] })

    while( i-- ){
        shapes.push( { type:'convex', shape:model.pal_shape_1.geometry, rot:[0,r*i, 0] })
        shapes.push( { type:'convex', shape:model.pal_shape_2.geometry, rot:[0,r*i, 0] })
    } 

    phy.add({

        name:'fan',
        type:'compound',
        pos:[0,0,0],
        shapes:shapes,
        mesh:model.fan,
        material:'noctua',
        restitution:0, 
        friction:0.5,
        kinematic:true,
        ray:false,
        //debug:true,
    })

    // add wall limiter

    let j = 14, a = 0, d = 8, s, m, y;
    let h = 12;

    let angle = (2*Math.PI)/j;
    while(j--){
        a += angle
        phy.add({ type:'box', size:[4,h,2.5], pos:[ d * Math.sin(a), h*0.5, d * Math.cos(a) ], rot:[ 0, a*math.todeg, 0 ], friction:0.0, visible:false })
    }

    phy.add({ name:'sol', type:'box', size:[17,4,17], pos:[0,-2,0], friction:0.0, visible:false })

    // add some ball

    sph = []
    j = 1000;
    while(j--){

        s = math.rand( 0.1,0.2 )
        a = math.rand(-Math.PI, Math.PI)
        d = math.rand(2, 5)
        y = math.rand(s, s*100)
        phy.add({ 
            instance:'ball', type:'sphere',  material:'body',
            size:[s], 
            pos:[ d * Math.sin(a), y, d * Math.cos(a) ],
            mass:s, 
            friction:0.5,
            speedMat:true
        })
    }

}