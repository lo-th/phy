let px = 5
let side = 0
//let onFloor = 0
let ready = false
//let bob = null
//let distance = 0
//let maxY = 0
//let t1 = 0;

let num = 0;

let maxCharacter = 1;

const models = [ 'man', 'woman']
const useModel = false;

let isKinematic = false;
let isFloating = false;

demo = () => {

    phy.view({
        phi:12, theta:0, distance:5, x:0, y:3, z:15, fov:60, 
        envmap:'lobe', envblur: 0.5, //background:0x101010,
        groundReflect:0.1, groundColor:0x808080,
        shadow:0.5,//0.5,
    })
    
    // config physics setting
    phy.set( {
        substep:1, 
        gravity:[0,-9.81,0],
        jointVisible:false,
        full:true,
    })

    let g = phy.getGround()
    g.material.map = phy.texture({ url:'./assets/textures/grid.png', repeat:[60,60] });

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })
    

    //addDynamic();
    addDeco()

    if( useModel ){
        t1 = phy.getTime();
        phy.preload( models, onComplete );
    } else {
        Character();
    }

}

onComplete = () => {

    console.log( 'loading in: ' + phy.readTime( phy.getTime() - t1 ) );
    Character();

}

let movingDir = 1;

const update = () => {

    let time = phy.getElapsedTime();

    if( isKinematic ){
        phy.change({name:'verticalMovePlatformRef', pos:[ -25, 2 * Math.sin(time / 2) + 2, 0 ], rot:[0,(time * 0.5)*math.todeg,0] });
        phy.change({name:'sideMovePlatformRef', pos:[ 5 * Math.sin(time / 2) - 12, 0.5, -10 ] });
        phy.change({name:'rotatePlatformRef', rot:[ 0,(time * 0.5)*math.todeg,0 ] });
        phy.change({name:'rotationDrumRef', rot:[ (time * 0.5)*math.todeg,0,90 ] });
    }

    if( isFloating ){
        // Apply moving velocity to the platform
        let p = phy.byName('floatingMovingPlateRef');
        if (p.position.x > 10) movingDir = -1;
        else if (p.position.x < -5) movingDir = 1;
        phy.change({name:'floatingMovingPlateRef', linearVelocity:[ movingDir > 0? 2:-2,p.velocity.y,0 ] });
      
    }

    /*

    if(!ready) return;

    px += 0.03 * side;
    if(px<=-5) side = 1;
    if(px>=5) side = -1;
    
    phy.change({name:'kine', pos:[ px, 1.8, 4 ], rot:[ 0, (px-5)*18, 0 ] });
    */

}


const addDeco = () => {

    phy.add({ type:'box', size:[1], pos:[15,0.5,0], mass:1 })
    phy.add({ type:'box', size:[1.5], pos:[15,1.5*0.5,-2], mass:3.375 })
    phy.add({ type:'box', size:[2], pos:[15,1,-5], mass:8 })

    addSteps()
    addSlope()
    addRoughPlane()
    addDynamicPlatforms()
    addFloatingPlatform()

    phy.setPostUpdate ( update )

    // add static box
    /*phy.add({ type:'box', size:[4,4,4], pos:[9,2,0] })
    phy.add({ type:'box', size:[4,4,4], pos:[-9,2,0] })
    phy.add({ type:'box', size:[4,2,4], pos:[9,1,4] })
    phy.add({ type:'box', size:[4,2,4], pos:[-9,1,4] })

    phy.add({ type:'stair', size:[2,2,3], pos:[-9,1,7.5], friction:0 })
    phy.add({ type:'stair', size:[2,2,3], pos:[9,1,7.5], friction:0 })

    phy.add({ type:'stair', size:[2,2,3], pos:[-9,3,3.5], friction:0 })
    phy.add({ type:'stair', size:[2,2,3], pos:[9,3,3.5], friction:0 })
    */

}

const addDynamicPlatforms = () => {

    phy.add({ name:'verticalMovePlatformRef', type:'box', size:[5,0.2,5], pos:[-25,2,0], kinematic:true })
    phy.add({ name:'sideMovePlatformRef', type:'box', size:[5,0.2,5], pos:[-25,0.5,-10], kinematic:true })
    phy.add({ name:'rotatePlatformRef', type:'box', size:[5,0.2,5], pos:[-25,0.5,-10], kinematic:true })
    phy.add({ name:'rotationDrumRef', type:'cylinder', size:[1,10], pos:[-15,0,-15], rot:[0,0,90], kinematic:true })
    isKinematic = true;
   
}

const addFloatingPlatform = () => {

    phy.add({ name:'floatingPlateRef', type:'box', size:[5,0.2,5], pos:[0,5,-10], mass:1, angularFactor:[0,0,0] })
    phy.add({ name:'floatingPlateRef2', type:'box', size:[5,0.2,5], pos:[7,5,-10], mass:1, linearFactor:[0,1,0], angularFactor:[0,1,0] })
    phy.add({ name:'floatingMovingPlateRef', type:'box', size:[2.5,0.2,2.5], pos:[0,5,-17], mass:1, linearFactor:[1,1,0], angularFactor:[0,1,0]  })

    phy.add({ type:'ray', parent:'floatingPlateRef', begin:[0,0,0], end:[0,-0.8, 0], callback:FloatingRay, visible:true })
    phy.add({ type:'ray', parent:'floatingPlateRef2', begin:[0,0,0], end:[0,-0.8, 0], callback:FloatingRay, visible:true })
    phy.add({ type:'ray', parent:'floatingMovingPlateRef', begin:[0,0,0], end:[0,-0.8, 0], callback:FloatingRay, visible:true })
    isFloating = true;

}

const floatingDis = 0.8;
const springK = 2.5;
const dampingC = 0.15;

const FloatingRay = ( r ) => {
    if(r.hit){
        const floatingForce = springK * (floatingDis - r.distance) - r.parent.velocity.y * dampingC;
        phy.change({ name:r.parent.name, impulse:[0, floatingForce, 0] });
    }
}

const addSteps = () => {
    phy.add({ type:'box', size:[4,0.2,0.2], pos:[0,0.1,5] })
    phy.add({ type:'box', size:[4,0.2,0.2], pos:[0,0.1,6] })
    phy.add({ type:'box', size:[4,0.2,0.2], pos:[0,0.1,7] })
    phy.add({ type:'box', size:[4,0.2,0.2], pos:[0,0.1,8] })
    phy.add({ type:'box', size:[4,0.2,4], pos:[0,0.1,11] })
}

const addSlope = () => {
    const onDone = () => {
        const model = phy.getMesh('slopes');
        for(let m in model){
            phy.add( {
                type:'mesh',
                shape: model[m].geometry,
                pos:[-10.5, 0, 10.5 ],
                rot:[0,180,0],
            })
        }
    }
    phy.load(['./assets/models/tmp/slopes.glb'], onDone );
}

const addRoughPlane = () => {
    const onDone = () => {
        const model = phy.getMesh('roughPlane');
        for(let m in model){
            phy.add( {
                type:'mesh',
                shape: model[m].geometry,
                pos:[10.5, -0.2, 10.5 ],
            })
        }
    }
    phy.load(['./assets/models/tmp/roughPlane.glb'], onDone );
}




///



const addDynamic = () => {

    Bridge();

    let rand = math.rand;

    // add random object
    let i=5;
    while(i--){
        phy.add({ type:'box', size:[ rand( 0.3,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
        phy.add({ type:'sphere', size:[ rand( 0.3,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
        phy.add({ type:'cone', size:[ rand( 0.4,  0.6 ), rand( 0.4,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
    }

    // platform test
    phy.add({ type:'box', name:'kine', size:[4,0.4,4], pos:[ px, 1.8, 4 ], radius:0.04,  density:1, kinematic:true, density: 0, friction:1 });
    phy.add({ type:'box', name:'truc', size:[1,1,1], pos:[ px, 2.9, 4 ], radius:0.02, density:1, friction:1 });

    phy.setPostUpdate ( update )
    phy.setTimeout( go, 0 )

}

const Bridge = ( width = 4, height = 0.2, length = 0.7 ) => {

    let isLocal = true
    let num = 20;
    let gap = 0.05
    let size = [ length, height, width ]
    let i = num
    let data = []
    
    while( i-- ){
        x = (i - (num - 1) * 0.5) * (length + gap);
        data.push({ type:'box', name:'b'+i, size:size, pos:[ x, 4-(height*0.5), 0 ], radius:0.02, density: i == 0 || i == num - 1? 0 : 10 });
    }

    i = num-1
    while( i-- ){
        
        if( isLocal ){ // local joint
            x = (length + gap) * 0.5
            data.push({ type:'hinge', name:'j'+i, b1:'b'+i, b2:'b'+(i+1), pos1:[x,0,0], pos2:[-x,0,0], worldAxis:[0,0,1], lm:[-10,10] })
        } else { // world joint
            x = (i - (num - 1) * 0.5) * (length + gap)
            data.push({ type:'hinge', name:'j'+i, b1:'b'+i, b2:'b'+(i+1), worldAnchor:[x+(length*0.5),4,0], worldAxis:[0,0,1], lm:[-10,10 ], sd:[20,1, 0, 0.5, -1] })
        }
        
    }

    phy.add(data);

}

const Character = () => {

    let i = maxCharacter, n = 0,  g;
    let pos = [0,0,0], angle = 0;
    let hh = [];

    while( i-- ){

        g = useModel ? models[ math.randInt( 0, models.length-1 ) ] : null;
        //g = math.randInt( 0, 1 );

        hh[n] = phy.add({ 
            type: 'character',
            name: 'c_' + n,
            
            debug: true,
            radius: 0.3,
            height: 1.8,
            pos: pos,
            //ray: n===0,
            angle:angle,

            gender: models[g],
            randomMorph:true,
            morph:true,
            //callback:count,

        });

        n++
        pos = [ math.rand( -10, 10 ), 0, math.rand( 5, 15 ) ];
        angle = math.randInt( 0, 360 )

    }

    hh[0].debugMode( true );

    //phy.follow('c_0', { direct:true, simple:true, distance:5, phi:12, theta:180, decal:[0.3, 0.5, -0.3], fov:60, zoom:1.0 })
    phy.control( 'c_0' );

}


const count = () => {

    num++;
    if( num === maxCharacter ) console.log( 'ready in: ' + phy.readTime( phy.getTime() - t1 ) )
    
}

const go = () => {

    side = -1;
    ready = true;

}


