let px = 5
let side = 0
let ready = false
let num = 0;
let maxCharacter = 66;
//const models = [ 'man', 'woman'];
//const models = [ 'man', 'woman']
const models = [ 'man_low', 'woman_low']
const useModel = true;
let heroes = [];

let cloneList = [];
let preload = maxCharacter>1;
let player = null;
let t1 = 0;

const setting = {
    debug:true,
};



demo = () => {

    phy.view({
        phi:12, theta:0, distance:5, x:0, y:3, z:15, fov:55, 
        envmap:'clear', groundReflect:0, groundColor:0x808080,
    })

    //phy.lightIntensity( 6, 0, 0.7 );
    //phy.changeShadow({ range:10, near:5, far:30, distance:20 })
    //phy.useRealLight( { /*aoPower:5*/ } );

    
    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0], full:true })

    let g = phy.getGround();
    g.material.map = phy.texture({ url:'./assets/textures/grid.png', repeat:[60,60] });
    g.material.roughness = 0.8;
    g.material.metalness = 0;

    // add static ground
    //phy.add({ type:'plane', size:[300,1,300], visible:false })
    phy.add({ type:'box', size:[300,1,300], pos:[0,-0.5,0], visible:false })
    
    addDecor();
    addCharacter();
    
}


const update = () => {

    updateDecor();

}


//-----------
//    GUI
//-----------

const addGui = () => {

    gui = phy.gui();

    let option = player.option;
    gui.add( option, 'floatingDis',{ min:0, max:2.5, mode:2});
    gui.add( option, 'springK',{ min:0, max:5.0, mode:2});
    gui.add( option, 'dampingC',{ min:0, max:3.0, mode:2});

    gui.add(setting, 'debug',{}).onChange( showDebug );
    gui.add( 'bool', { name:'add clone', onName:'remove clone', value:false, mode:1, radius:12 }).onChange( addClone )
    
}


//-----------------
//    CHARACTER
//-----------------

const addCharacter = () => {

    if( preload ){
        preload = false;
        t1 = phy.getTime();
        phy.preload( models, addCharacter );
        return;
    }

    player = addHero();

    phy.follow( player.name, { direct:true, simple:true, distance:5, phi:12, theta:0, decal:[0.3, 0.5, -0.3], fov:60, zoom:1.0 })
    phy.control( player.name );

    addGui();

}

const addClone = ( b ) => {

    if( b ){
        let i = maxCharacter;
        while(i--) addHero();
        
    } else {

        //for(let i = 1; i<maxCharacter-1; i++) heroes[i].clear()
        //
        //! TODO bug on remove 
        phy.remove( cloneList );
        heroes = [player]
        cloneList = [];
    }
}

const addHero = () => {

    let n = heroes.length;
    let isPlayer = n===0;
    let g = useModel ? models[ math.randInt( 0, models.length-1 ) ] : null;
    let pos = isPlayer ? [0,0,0]:[ math.rand( -10, 10 ), math.rand( 0, 10 ), math.rand( -10, 10 ) ];
    let angle = isPlayer ? 0: math.randInt( 0, 360 );

    const h = phy.add({

        type: 'character',
        name: 'c_' + n,
        
        radius: 0.3,
        pos: pos,
        //mass:75,
        //ray: n===0,
        angle:angle,

        gender: g,

        randomMorph:true,
        randomSize:!isPlayer,

        useImpulse:true,
        floating:true,
        
        //massInfo:true,
        //debug:true,

    });

   if( setting.debug ) h.debugMode( setting.debug );
   heroes.push( h );
   if( !isPlayer ) cloneList.push(h.name)//, h.name+'_ray' );
   return h;
        
}


const showDebug = ( debug ) => {
    if( player ) player.debugMode( debug );
}


//--------------
//    DECOR
//--------------

let isKinematic = false;
let isFloating = false;
let movingDir = 1;
const floatingDis = 0.8;
const springK = 2.5;
const dampingC = 0.15;

const updateDecor = () => {

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

}

const addDecor = () => {

    phy.add({ type:'box', size:[1], pos:[15,0.5,0], mass:1 })
    phy.add({ type:'box', size:[1.5], pos:[15,1.5*0.5,-2], mass:3.375 })
    phy.add({ type:'box', size:[2], pos:[15,1,-5], mass:8 })

    addSteps();
    addSlope();
    addRoughPlane();
    addDynamicPlatforms();
    addFloatingPlatform();

    phy.setPostUpdate( update );

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



const FloatingRay = ( r ) => {
    // need activate full option to get velocity
    if(r.hit){
        const floatingForce = springK * (floatingDis - r.distance) - r.parent.velocity.y * dampingC;
        phy.change({ name:r.parent.name, impulse:[0, floatingForce, 0] });
        //phy.change({ name:r.parent.name, linearVelocity:[0, 0, 0] });
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