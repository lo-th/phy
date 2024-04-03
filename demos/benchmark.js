const demoList = ['gravity', 'joint', 'geometry', 'stacking' ];
let demoStart = 'geometry'

function demo() {

    phy.view({
        envmap:0x303030,
        //ground:false,
        vignette:false,
        groundReflect:0,
        groundColor:0x404040,
        jointVisible:true, 
    })


    //phy.set()

    setDemo( demoStart );

    addGui();

}

const addGui = () => {

    gui = phy.gui();
    gui.add('grid',{ values:demoList, selectable:true, value:demoStart, radius:6 }).onChange( switchDemo );

}

const switchDemo = ( name ) => {

    phy.clear( ()=>{ setDemo(name) } )

}

const setDemo = ( name ) => {

    //phy.clear()
    phy.set()

    this[name+'Test']();

}


jointTest = () => {

    phy.add({ type:'plane', name:'floor', size:[ 20,1,20 ], visible:false, friction: 0.5,  });

    phy.add({ type:'box', name:'A', size:[1,1,1], pos:[-3,0.5,0], mass:1 });
    phy.add({ type:'box', name:'B', size:[1,1,1], pos:[3,0.5,0], mass:1 });
    phy.add({ type:'distance', b1:'A', b2:'B', pos1:[0,0,0], pos2:[0,0,0], visible:true, lm:[5,6] });
}

gravityTest = () => {

    phy.add({ type:'plane', name:'floor', size:[ 20,1,20 ], visible:false, friction: 0.5 });

    phy.add({ type:'box', name:'A', size:[1,1,1], pos:[-1.5,5,0], mass:1, gravityScale:0.04 });
    phy.add({ type:'box', name:'B', size:[1,1,1], pos:[0,5,0], mass:1, gravityScale:0.1 });
    phy.add({ type:'box', name:'C', size:[1,1,1], pos:[1.5,5,0], mass:1 });

}

geometryTest = () => {

    phy.add({ type:'plane', name:'floor', size:[ 20,1,20 ], visible:false, friction: 0.5 });

    let h = 2, r = 1
    phy.add({ type:'box', size:[r*2,r*2,r*2], pos:[-6,r,0], mass:1 });
    phy.add({ type:'sphere', size:[r], pos:[-3,r,0], mass:1 });
    phy.add({ type:'capsule', size:[r,h,r], pos:[0,(h*0.5)+r,0], mass:1 });
    phy.add({ type:'cylinder', size:[1,4,1], pos:[3,2,0], mass:1 });
    phy.add({ type:'convex', shape:new THREE.DodecahedronGeometry(r), pos:[6, r, 0], mass:1 })

}

stackingTest = () => {

    phy.add({ type:'plane', name:'floor', size:[ 20,1,20 ], visible:false, friction: 0.5  });

    let data = [];
    let size = [1.0, 0.5, 1.0]

    let i = 20, py = size[1]*0.5, r = 0, a = 180 / i, margin = 0;

    while(i--){

        data.push({
            radius:0.03,
            instance:'boxbase',
            type:"box",
            size: size,
            pos:[0,py,0],
            rot:[0,r,0],
            mass: 1,
            restitution:0.0,
            friction:0.5,
            sleep:true,
        })

        py += size[1] + margin;
        //r += a; 

    }

    phy.add(data);

}