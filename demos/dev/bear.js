let gui;
let modelName = "lee"
let list = [];
let model;
//modelName = "bear"
//modelName = "rabit"
const setting = { 
    mass:10,
    gravity:-9.81, 
    ragdoll:true,
    debug:false, 
};

function demo() {

    phy.view({
        //envmap:0x606060,
        vignette:false,
        groundReflect:0,
        jointVisible:true,
        phi:20, theta:25, distance:14, y:3
    })

    phy.set({ substep:1, gravity:[0,setting.gravity,0] });
    //phy.add({pos:[0,-0.1,0], size:[5.8, 0.21, 6.6]})
    phy.add({ type:'container', material:'hide', size:[5.8, 60, 6.6,1.0], pos:[0,30,0], friction:0, restitution:1, remplace:true });

    phy.load(['./assets/models/'+modelName+'.glb'], onComplete )

    phy.setPostUpdate ( update );

}

onComplete = () => {

    //const map = phy.texture({ url:'./assets/textures/ragdoll.jpg', flip:true, encoding:true })
    const map = phy.texture({ url:'./assets/textures/lee_c.jpg', flip:true, encoding:true })
    const normal = phy.texture({ url:'./assets/textures/fur.jpg', flip:true, encoding:false, repeat:[5,5] })

    const mat_01 = phy.material({ 
        name:'Bear', color:0xFFFFFF, 
        map:map,
        normalMap:normal,
        roughness:0.9, metalness:0.0, 
        sheen:5, sheenColor:0xFFFFFF, sheenRoughness:0.62,
        sheenColorMap : map, 
        //wireframe : true
    })

    const mat_02 = phy.material({ 
        name:'Bear2', color:0x101010,
        roughness:0.1, metalness:0.8,
    })

    model = phy.getGlb(modelName);
    model.traverse( ( child ) => {
        if ( child.isMesh ) child.material = mat_02;
        if ( child.isSkinnedMesh ) child.material = mat_01;
    })

    populate(50)

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
    //this.model.updateMatrix()

}

populate = ( n ) => {

    let i = n, x, z
    while(i--){
        x = math.rand(-1,1)
        z = math.rand(-1,1)
        list.push( phy.autoRagdoll({ 
            name:'b_'+i, 
            model:model, 
            size:math.rand(0.5,3), 
            mode:setting.ragdoll?'ragdoll':'follow', 
            debug:setting.debug, 
            pos:[x, 0.5 + (i*0.2), z] , 
            mass:setting.mass,
        }))
    }
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
    populate(math.randInt(1,60))
}

update = ( delta ) => {
}