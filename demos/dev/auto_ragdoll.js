let gui;
//let modelName = "lee"
let modelName = "rabit"
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
        //envmap:0x606060,
        vignette:false,
        groundReflect:0,
        jointVisible:true,
        phi:20, theta:25, distance:14, y:3
    })

    phy.set({ 
        substep:1, 
        gravity:[0,setting.gravity,0],
        stabiliz:false,
    });
    //phy.add({pos:[0,-0.1,0], size:[5.8, 0.21, 6.6]})
    phy.add({ type:'container', material:'debug', size:[5.8, 30, 6.6,10.0], pos:[0,15,0], friction:0.5, restitution:0, intern:true, remplace:true });

    //phy.load(['./assets/models/'+modelName+'.glb'], onComplete )
    phy.load(['./private/models/'+modelName+'.glb'], onComplete )

    phy.setPostUpdate ( update );

}

onComplete = () => {

    //const map = phy.texture({ url:'./assets/textures/lee_c.jpg', flip:true, encoding:true })
    const normal = phy.texture({ url:'./assets/textures/fur.jpg', flip:true, encoding:false, repeat:[5,5] })

    //const map = phy.texture({ url:'./assets/textures/minion.jpg', flip:true, encoding:true })
    //const orm = phy.texture({ url:'./assets/textures/minion_orm.jpg', flip:true, encoding:false })
    //const rough = phy.texture({ url:'./assets/textures/minion_r.jpg', flip:true, encoding:false })

    /*const mat_01 = phy.material({ 
        name:'Bear', color:0xFFFFFF, 
        map:map,
        normalMap:normal,
        roughness:0.9, metalness:0.0, 
        sheen:5, sheenColor:0xFFFFFF, sheenRoughness:0.62,
        sheenColorMap : map, 
        wireframe : true
    })*/

    const mat_01 = phy.material({ 
        name:'minion', color:0x808080, 
        //map:map,
        normalMap:normal,
        //roughness:1, metalness:1,
        //metalnessMap: orm,
        //roughnessMap: orm,
        //aoMap:orm,
        //sheen:0.2, sheenColor:0xFFFFFF, sheenRoughness:0.62,
        //sheenColorMap : map, 
        //wireframe : true
    })

    /*const mat_02 = phy.material({ 
        name:'Bear2', color:0x101010,
        roughness:0.1, metalness:0.8,
    })*/

    model = phy.getGlb(modelName);
    model.traverse( ( child ) => {
        if ( child.isMesh ) child.material = mat_01;
        if ( child.isSkinnedMesh ) child.material = mat_01;
    })

    populate(30)

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

    let i = n, x, z, s
    while(i--){
        x = math.rand(-1,1)
        z = math.rand(-1,1)
        s = 3//math.rand(0.5,3) 
        list.push( phy.autoRagdoll({ 
            name:'b_'+i, 
            model:model, 
            size:s, 
            mode:setting.ragdoll?'ragdoll':'follow', 
            debug:setting.debug, 
            pos:[x, 2.0 + (i*0.2), z] , 
            mass:setting.mass,
            option:{ 
                //sizer:[2,1,5,2,1.6,0.5,0.5], 
                useAggregate:true 
            },
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
    populate(1)//math.randInt(1,60))
}

update = ( delta ) => {
}