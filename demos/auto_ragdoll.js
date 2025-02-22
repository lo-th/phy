let gui;
//let modelName = "motorica"
let modelName = "lee";
//let modelName = "barbados";
let list = [];
let model;

const setting = { 
    mass:10,
    gravity:-9.81, 
    ragdoll:true,
    debug:false, 
};

function demo() {

    phy.view({
        envmap:'clear',
        //envmap:0x606060,
        vignette:true,
        groundColor:0x202020,
        groundReflect:0, //!\\ High process
        jointVisible:false, //!\\ High process
        phi:12, theta:0, distance:14, y:4,

        //direct:60,
        //exposure:0.1,
    })


    /*const env = phy.addEnvmap({ cube:true, color:0x303030 })
    env.intensity = 10;
    env.render();*/
    //phy.lightIntensity( 60, 0, 0.1 );
    //phy.useRealLight( {} );
    

    phy.set({ 
        substep:1, 
        gravity:[0,setting.gravity,0],
        stabiliz:false,
    });
    //phy.add({pos:[0,-0.1,0], size:[5.8, 0.21, 6.6]})
    phy.add({ type:'container', material:'debug', size:[5.8, 14, 6.6,10.0], pos:[0,7,0], friction:0.5, restitution:0, intern:true, remplace:true, color:0x000000 });
    phy.add({ type:'box', size:[5.8, 5, 2],  pos:[0,2.5,-2.25], friction:0.5, restitution:0, intern:true, remplace:true, color:0x000000 });

    phy.load(['./assets/models/'+modelName+'.glb'], onComplete )
 
}

onComplete = () => {

    const map = phy.texture({ url:'./assets/textures/lee_c.jpg', flip:true, encoding:true })


    const mat_01 = phy.material({ 
        name:'lee', 
        map:map,
        roughness:0.5, 
        metalness:0,
    })

    let remove = []
    model = phy.getGlb(modelName );
    model.traverse( ( child ) => {
        if ( child.isSkinnedMesh ) child.material = mat_01;
    })
    
    populate(20)

    gui = phy.gui();
    gui.add( setting, 'ragdoll' ).onChange( (v) => { 
        let i = list.length;
        while(i--){
            list[i].mode = v ? 'ragdoll':'follow';
        }
    })
    gui.add( setting, 'debug' ).onChange( (v) => {
        let i = list.length;
        while(i--){
            list[i].debug = v;
        }
    })
    gui.add( setting, 'gravity', { min:-10, max:10, mode:2 } ).onChange( (v) => { phy.setGravity([0,v,0]) } )
    gui.add( setting, 'mass', { min:1, max:100, mode:2 } ).onChange( (v) => { mass(v) } )
    gui.add( 'button', { name:"clear" } ).onChange( () => { clear() } )
    gui.add( 'button', { name:"add" } ).onChange( () => { add() } )
    

}

populate = ( n ) => {

    let i = n, x, z, s
    while(i--){
        addRagdoll(i);
    }
}

addRagdoll = ( i ) => {

    if(!i) i = list.length; 

    let x = math.rand(-1,1);
    let z = math.rand(-1,1);
    let s = math.rand(2,3); 
    let doll = phy.autoRagdoll({ 
        name:'doll_'+i, 
        model:model, 
        size:s, 
        mode:setting.ragdoll?'ragdoll':'follow', 
        debug:setting.debug, 
        pos:[x, 2.0 + (i*0.2), z] , 
        mass:setting.mass,
        option:{ 
            damping:[0.0,0.25],
            neverSleep:false,
            wake:true,
            //sizer:[2,1,5,2,1.6,0.5,0.5], 
            useAggregate:true 
        },
    })

    list.push(doll);
    
}

mass  = (v) => {
    let i = list.length;
    while(i--){
        list[i].skeletonBody.setMass(v)
    }

}

clear  = () => {
    let i = list.length;
    while(i--){
        phy.remove(list[i].name)
        //)
    }
    list = []

}

add  = () => {
    addRagdoll();
}

update = ( delta ) => {
}