const Botsetting = {
    speed: 0.1,
    stiffness: 1000,
    damping: 100,
    forceLimit: 1000,
    legMass:1,
    bodyMass:8,
}
const debug = 0;
const single = 0;
const bots = []
let meshes

demo = () => {

    phy.log('use key WSAD or ZSQD to move')

    phy.view({ envmap:'factory', ground:true, fog:true, fogDist:0.02 })

    phy.set({ substep:1, gravity:[0,-9.81,0], key:true })

    phy.add({ type:'plane', size:[300,1,300], visible:false, friction:1 });

    phy.load(['./assets/models/spider.glb'], onComplete )

}

onComplete = () => {
    // load extra script
    phy.extraCode( './demos/extra/SpiderAi.js', initRobot );
}

initRobot = () => {

    meshes = phy.getMesh('spider', true );

    let i = 10
    let x = 0, z = 0, n = 0, l = 0
    if(single) i = 1

    while(i--){

        x = -8 + n*4
        z = -l*4
        n++
        if(n===5){  n = 0; l++; }
        if(single){ x = 0; z = 0; }

        bots[i] = new Bot({id:i, pos:[x,0.5,z]})

    }
    
    //-----------------------------------------
    //    UPDATE
    //-----------------------------------------

    phy.setPostUpdate( update )

}


update = ( dt ) => {

    let key = phy.getKey()
    
    let action = -1

    if( key[1] === -1 ) action = 1
    if( key[1] === 1 ) action = 2
    if( key[0] === 1 ) action = 3
    if( key[0] === -1 ) action = 4

    let i = bots.length
    while(i--){ 
        bots[i].update( dt, action )
    }

}

//-----------------------------------------
//    BOT CLASS
//-----------------------------------------

class Bot {

    constructor ( o = {} ) {

        this.setting = { ...Botsetting }

        this.id = o.id || 0
        this.name = o.name || 'bot' + this.id
        this.solver = null
        this.pos = o.pos || [0, 2, 0]

        // angle array order is from middle to out

        //   2 ____ 3   //  10--6--2 ____ 3--7--11
        //   |      |   //         |      |
        //   |  \/  |   //         |  \/  |  
        //   0 ____ 1   //   8--4--0 ____ 1--5--9  

        this.init()

        // add arduino move programme
        this.ai = window.SpiderAi( this.solver )

        //-----------------------------------------
        //    DIRECT ANIMATION
        //-----------------------------------------
        //this.frame = 0
        /*this.anims = {
            jump: [ 
                [  35, 35, 35, 35,   -90, -90, -90, -90,    0, 0, 0, 0 ],
                [  45, 45, 45, 45,    30, 30, 30, 30,      -125, -125, -125, -125 ]
            ]
        }*/

        //this.current = 'walk'
        //this.play()

    }

    init(){

        const pos = this.pos;
        const id = this.id

        const solver = phy.add({ type:'solver', name:this.name, iteration:4, fix:false, needData:true, neverSleep:true })

        solver.speed = this.setting.speed

        //-----------------------------------------
        //    BONES
        //-----------------------------------------

        let def = {
            //filter:[2,-1,1,0], 
            //dmv:[0.2,0.2,100,20], 
            debug:debug, 
            meshSize:10, 
            solver:this.name,
            density:this.setting.legMass,
        }

        phy.add({
            ...def,
            type:'box', name:id+'_base', linked:'null',
            pos:pos, size:[ 0.6, 0.25, 0.8 ], localPos:[0, 0.125, 0],
            mesh:meshes.base,
            density:this.setting.bodyMass*0.5,
        })

        phy.add({
            ...def,
            type:'sphere', name:id+'_top', linked:id+'_base',
            pos:math.addArray( pos, [0,0.245,0] ), size:[ 0.33 ], 
            mesh:meshes.top,
            density:this.setting.bodyMass*0.5,
        })

        // legs position
        const p = [[0.365, 0.28, -0.355], [-0.365, 0.28, -0.355], [0.365, 0.28, 0.355], [-0.365, 0.28, 0.355]]
        const d = [[0.275, 0, 0], [-0.275, 0, 0], [0.275, 0, 0], [-0.275, 0, 0]]
        const c = [[0.55, 0, 0], [-0.55, 0, 0], [0.55, 0, 0], [-0.55, 0, 0]]
        const e = [[1.9654, 0.28, -0.355], [-1.9654, 0.28, -0.355], [1.9654, 0.28, 0.355], [-1.9654, 0.28, 0.355]]


        let i = 4, rot, left, rev

        while(i--){

            ///left = i==0 || i==1
            //rev = i==1 || i==2

            left = i==0 || i==2
            rev = i==1 || i==2

            rot = [0, left ? 0: 180,0]
            //rot = [0,  0,0]

            phy.add({
                ...def,
                type:'box', 
                name:id+'_barm'+i, 
                linked:id+'_base',
                size:[ 0.275, 0.4, 0.15 ], localPos:[0.1375, -0.055, 0], 
                pos: math.addArray( pos, p[i] ), rot:rot,
                mesh:rev ? meshes.barm_002 : meshes.barm_001,  
            })

            phy.add({
                ...def,
                type:'box', 
                name:id+'_darm'+i, 
                linked:id+'_barm'+i,
                size:[ 0.04, 0.1, 0.4 ], localPos:[0.25, 0, 0], 
                pos: math.addArray( math.addArray( pos, p[i] ), d[i]), rot:rot,
                mesh: meshes.darm_001,
            })

            phy.add({
                ...def,
                type:'box', 
                name:id+'_farm'+i, 
                linked:id+'_darm'+i,
                size:[ 0.4, 0.22, 0.15 ], localPos:[0.095, 0, 0], 
                pos: math.addArray( math.addArray( pos, p[i] ), math.addArray(c[i], d[i])), rot:rot,
                mesh: rev ? meshes.farm_002 : meshes.farm_001,
            })

            phy.add({
                ...def,
                //type:'sphere',
                type:'cylinder', 
                name:id+'_earm'+i, 
                linked:id+'_farm'+i,
                //size:[ 0.04 ], 
                //size:[ 0.08, 0.08, 0.12 ],
                size:[ 0.04, 0.12 ],
                localRot:[90,0,0],
                pos:math.addArray( pos, e[i] ), rot:rot,
                mesh:meshes.earm_001,
                friction:1,
            })

        }

        //-----------------------------------------
        //    JOINT
        //-----------------------------------------

        const stiffness = this.setting.stiffness;
        const damping = this.setting.damping; // 0
        const forceLimit = this.setting.forceLimit;
        const acceleration = false;

        i = 4
        while(i--){
            //left = i==0 || i==1
            left = i==0 || i==2

            solver.addJoint({
                name:id+'_A'+i, bone:id+'_barm'+i,
                pos1:p[i], pos2:[ 0, 0, 0 ],
                type:'revolute',
                rot1: [0,left? 0: 180,0],
                limits: [['ry', -180, 180 ]],
                inverse : i==1 || i==2 ? true : false,
                position: [['ry', 45 ]],
                drives: [['ry', stiffness, damping, forceLimit, acceleration ]],
            });
        }

        i = 4
        while(i--){
            solver.addJoint({
                name:id+'_A'+(4+i), bone:id+'_darm'+i,
                pos1:[d[0][0], 0, 0], pos2:[ 0, 0, 0 ],
                type:'revolute',
                limits: [['rz', -180, 180 ]],
                position: [['rz', 30 ]],
                drives: [['rz', stiffness, damping, forceLimit, acceleration ]],
            });
        }

        i = 4
        while(i--){
            solver.addJoint({
                name:id+'_A'+(8+i), bone:id+'_farm'+i,
                pos1:[c[0][0], 0, 0], pos2:[ 0, 0, 0 ],
                type:'revolute',
                limits: [['rz', -180, 180 ]], //i>1? [['swing2', 90, 270 ]] : [['swing2', -90, 90 ]],
                position:[['rz', -125 ]],
                drives: [['rz', stiffness, damping, forceLimit, acceleration ]],
            })

        }

        i = 4
        while(i--){
            solver.addJoint({
                name:id+'_BB'+(i+12), bone:id+'_earm'+i,
                pos1:[0.7754, 0, 0], pos2:[ 0, 0, 0 ],
                type:'fixe',
            })
        }

        solver.addJoint({
            name:id+'_AAA', bone:id+'_top',
            pos1:[0, 0.245, 0], pos2:[ 0, 0, 0 ],
            type:'fixe',
        })

        //-----------------------------------------
        //    START
        //-----------------------------------------
        
        solver.start();

        //solver.commonInit();

        this.solver = solver;

    }

    update( dt, action = -1 ){
        
        this.ai.action = action
        this.ai.update()
        this.solver.driveJoints( dt );

    }

    /*play(){

        const name = this.current
        if( this.frame >= this.anims[name].length ) this.frame = 0
        this.solver.setAngles( this.anims[name][this.frame], this.speed ).then( this.play.bind(this) );
        this.frame++

    }*/

    

}
