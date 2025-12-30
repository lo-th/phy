let gui;

let modelName1 = "man_low";
let modelName2 = "woman_low";

let list = [];
let model1, model2;
let deco = false
let skin, hair

//let startMode = 'simulation'
let startMode = 'debug'

const setting = { 
    mass:10,
    gravity:-10,//-9.81, 
    ragdoll:true,
    debug:false, 
};

function demo() {

    phy.view({
        envmap:'lobe',
        vignette:true,
        groundColor:0x202020,
        reflect:0, //!\\ High process
        jointVisible:false, //!\\ High process
        phi:12, theta:25, distance:14, y:3,
        envBlur:0.5,

        //direct:60,
        //exposure:0.1,
    })
    

    phy.set({ 
        substep:1,
        gravity:[0,setting.gravity,0],
    });

    phy.add({ name:'ground', type:'box', size:[30,1,30], pos:[0, -0.5, 0], visible:false })

    initMaterial()
    addGui()

    phy.load([modelName1+'.glb', modelName2+'.glb'], onComplete, './assets/models/avatar/' )
 
}

initMaterial = () => {

    const map = phy.texture({ url:'./assets/textures/avatar_1k/avatar_c.jpg', flip:true, encoding:true })

    skin = phy.material({ 
        name:'skin', 
        map:map,
        roughness:0.5, 
        metalness:0,
        transparent:true,
        opacity:0.6,
    })

    hair = phy.material({ 
        name:'hair', 
        color:0x904400,
        roughness:0.5, 
        metalness:0,
        transparent:true,
        opacity:0.6,
    })

}

demoMode = (name) => {

    clear()
    clearDeco()

    let db = name === 'debug'
    skin.transparent = db
    hair.transparent = db
    skin.needsUpdate = true
    hair.needsUpdate = true
    setting.gravity = db ? 0:-10

    switch(name){
        case 'debug':
        phy.setCamera({ phi:0, theta:0, distance:3, y:1 })
        addRagdoll(0, 0, 0, 0, 1)
        break;
        case 'simulation':
        phy.setCamera({ phi:12, theta:25, distance:14, y:3 })
        addDeco()
        populate(25)
        break;
    }

    phy.setGravity([0,setting.gravity,0])

    let i = list.length;
    while(i--){
        list[i].debug = db;
    }
}

/// GUI ///

addGui = () => {

    gui = phy.gui();
    gui.add( 'selector', {  values: ['simulation', 'debug'], value:startMode, h:30 } ).onChange( (n) => { demoMode(n) } )
    gui.add( setting, 'ragdoll' ).onChange( (v) => { 
        let i = list.length;
        while(i--){
            list[i].mode = v ? 'ragdoll':'follow';
        }
    })

    gui.add( setting, 'gravity', { min:-10, max:10, mode:2 } ).onChange( (v) => { phy.setGravity([0,v,0]); wake(); } ).listen()
    gui.add( setting, 'mass', { min:1, max:100, mode:2 } ).onChange( (v) => { mass(v) } )

    gui.add( 'button', {  value: ['clear', 'add'] } ).onChange( (n) => { switch(n){ case 'clear':clear(); break; case 'add':add(); break; } } )
    
}

/// DECO ///

addDeco = () => {

    if(deco) return
    

    let j = 20, n;
    while(j--){
        n = (j*3)*0.1;
        phy.add({ type:'box', size:[8,0.3,1], pos:[0,0.15+n,3-n*1.2], radius:0.02, instance:'stair', ray:false })
    }

    phy.add({ name:'wall1',type:'box', size:[0.5,3,5], pos:[4.25,1.5,1.6], radius:0.02, ray:false })
    phy.add({ name:'wall2',type:'box', size:[0.5,3,5], pos:[-4.25,1.5,1.6], radius:0.02, ray:false })
    phy.add({ name:'wall3',type:'box', size:[0.5,3,5], pos:[0,1.5,1.6], radius:0.02, ray:false })

    deco = true
}

clearDeco = () => {

    if(!deco) return
    phy.remove([ 'wall1', 'wall2', 'wall3', 'stair' ])
    deco = false

}

///

onComplete = () => {

    let remove = []
    model1 = phy.getGlb( modelName1, false, false );
    model2 = phy.getGlb( modelName2, false, false );

    model1.traverse( ( child ) => {
        if ( child.isSkinnedMesh ) child.material = skin;
        else child.material = hair;
    })

    model2.traverse( ( child ) => {
        if ( child.isSkinnedMesh ) child.material = skin;
        else child.material = hair;
    })

    demoMode(startMode)

}

populate = ( n = 1 ) => {

    let i = n, x, z, s
    while(i--) addRagdoll(i);
    
}

addRagdoll = ( i, x, y, z, s ) => {

    if(!i) i = list.length; 

    let t = math.randInt(0,1);
    x = x !== undefined ? x : math.rand(-3,3);
    y = y !== undefined ? y : 6.0 + i
    z = z !== undefined ? z : math.rand(-3,-2);
    s = s || math.rand(1.2,1.5);

    let doll = phy.autoRagdoll({ 
        name:'doll_'+i, 
        model:t===1? model1:model2, 
        size:s, 
        mode:setting.ragdoll?'ragdoll':'follow', 
        //debug:setting.debug, 
        pos:[x, y, z] , 
        mass:setting.mass,
        option:{ 
            damping:[0.0,0.25],
            neverSleep:false,
            wake:true,
            useAggregate:false,
        },
    })

    list.push(doll);
    
}

wake = (v) => {
    let i = list.length;
    while(i--){
        list[i].skeletonBody.wake()
    }
}

mass = (v) => {
    let i = list.length;
    while(i--){
        list[i].skeletonBody.setMass(v)
    }
}

clear  = () => {
    let i = list.length;
    while(i--){
        phy.remove(list[i].name)
    }
    list = []
}

add = () => {
    addRagdoll();
}

update = ( delta ) => {
}