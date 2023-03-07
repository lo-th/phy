const debug = 0;
const bots = []
let meshes

demo = () => {

    phy.view({ envmap:'factory', ground:true, fog:true, fogDist:0.04 })

    phy.set({ substep:1, gravity:[0,-9.81,0] })

    phy.add({ type:'plane', size:[300,1,300], visible:false });

    phy.load(['./assets/models/spider.glb'], onComplete )

}

onComplete = () => {

    meshes = phy.getMesh('spider', true );

    let i = 10
    let x = 0, z = 0, n = 0, l = 0

    while(i--){
        x = -8 + n*4
        z = -l*4
        n++
        if(n===5){  n = 0; l++; }

        bots[i] = new Bot({id:i, pos:[x,0.5,z]})
    }
    
    //-----------------------------------------
    //    UPDATE
    //-----------------------------------------

    phy.setPostUpdate( update )


}


update = ( dt ) => {

    let i = bots.length
    while(i--) bots[i].update( dt )

}

//-----------------------------------------
//    BOT CLASS
//-----------------------------------------

class Bot {
    constructor ( o = {} ) {

        this.id = o.id || 0
        this.speed = 1
        this.frame = 0
        this.name = o.name || 'bot' + this.id
        this.solver = null
        this.pos = o.pos || [0, 2, 0]

        //   2 ____ 3
        //   |      |
        //   |  \/  | 
        //   0 ____ 1 

        // angle order is from middle to out

        this.anims = {
            walk: [ 
                [ 45, 45, 45, 45,    50, 0, 0, 0,    -90, -90, -90, -90  ],
                [ 0, 45, 45, 45,     50, 0, 0, 0,    -90, -90, -90, -90  ]
                //[ 0, 0, 0, 0,   30, 0, 0, 0,   0, 0, 0, 0],
            ],
            jump: [ 
                [  35, 35, 35, 35,   -90, -90, -90, -90,    0, 0, 0, 0 ],
                [  45, 45, 45, 45,    30, 30, 30, 30,      -125, -125, -125, -125 ]
                //[ 0, 0, 0, 0,   30, 0, 0, 0,   0, 0, 0, 0],
            ]
        }
        

        this.init()

        //-----------------------------------------
        //    ANIMATION
        //-----------------------------------------

        this.current = 'jump'
        this.play()

    }

    init(){

        const pos = this.pos;
        const id = this.id

        let solver = phy.add({ type:'solver', name:this.name, iteration:4, fix:false, needData:true, neverSleep:true })

        //-----------------------------------------
        //    BONES
        //-----------------------------------------

        let def = {
            //filter:[2,-1,1,0], 
            //dmv:[0.2,0.2,100,20], 
            debug:debug, 
            meshSize:10, 
            solver:this.name,
            density:1,
        }

        phy.add({
            ...def,
            type:'box', name:id+'_base', linked:'null',
            pos:pos, size:[ 0.8, 0.12, 0.8 ], localPos:[0, 0.015, 0],
            mesh:meshes.base,
        })

        phy.add({
            ...def,
            type:'sphere', name:id+'_top', linked:id+'_base',
            pos:math.vecAdd( pos, [0,0.2,0] ), size:[ 0.33 ], 
            mesh:meshes.top,
        })

        // legs position
        const p = [[0.5, 0.055, -0.54], [-0.5, 0.055, -0.54], [0.5, 0.055, 0.54], [-0.5, 0.055, 0.54]]
        const d = [[0.25, 0, 0], [-0.25, 0, 0], [0.25, 0, 0], [-0.25, 0, 0]]
        const c = [[0.45, 0, 0], [-0.45, 0, 0], [0.45, 0, 0], [-0.45, 0, 0]]
        const e = [[1.916, -0.006, -0.54], [-1.916, -0.006, -0.54], [1.916, -0.006, 0.54], [-1.916, -0.006, 0.54]]


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
                size:[ 0.3, 0.4, 0.2 ], localPos:[0.152, 0, 0], 
                pos: math.vecAdd( pos, p[i] ), rot:rot,
                mesh:rev ? meshes.barm_002 : meshes.barm_001,  
            })

            phy.add({
                ...def,
                type:'box', 
                name:id+'_darm'+i, 
                linked:id+'_barm'+i,
                size:[ 0.04, 0.1, 0.4 ], localPos:[0.25, 0, 0], 
                pos: math.vecAdd( math.vecAdd( pos, p[i] ), d[i]), rot:rot,
                mesh: meshes.darm_001,
            })

            phy.add({
                ...def,
                type:'box', 
                name:id+'_farm'+i, 
                linked:id+'_darm'+i,
                size:[ 0.4, 0.22, 0.2 ], localPos:[0.095, 0, 0], 
                pos: math.vecAdd( math.vecAdd( pos, p[i] ), math.vecAdd(c[i], d[i])), rot:rot,
                mesh: rev ? meshes.farm_002 : meshes.farm_001,
            })

            phy.add({
                ...def,
                type:'sphere', 
                name:id+'_earm'+i, 
                linked:id+'_farm'+i,
                size:[ 0.04 ], 
                pos:math.vecAdd( pos, e[i] ), rot:rot,
                mesh:meshes.earm_001,
            })

        }

       // return
        //-----------------------------------------
        //    JOINT
        //-----------------------------------------

        const stiffness = 1000;
        const damping = 100; // 0
        const forceLimit = 1000;
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
                limits: [['swing1', -90, 90 ]],
                inverse : i==1 || i==2 ? true : false,
                position: [['swing1', 45 ]],
                drives: [['swing1', stiffness, damping, forceLimit, acceleration ]],
            });
        }

        i = 4
        while(i--){
            solver.addJoint({
                name:id+'_A'+(4+i), bone:id+'_darm'+i,
                pos1:[0.25, 0, 0], pos2:[ 0, 0, 0 ],
                type:'revolute',
                limits: [['swing2', -90, 90 ]],
                position: [['swing2', 30 ]],
                drives: [['swing2', stiffness, damping, forceLimit, acceleration ]],
            });
        }

        i = 4
        while(i--){
            solver.addJoint({
                name:id+'_A'+(8+i), bone:id+'_farm'+i,
                pos1:[0.45, 0, 0], pos2:[ 0, 0, 0 ],
                type:'revolute',
                limits: [['swing2', -125, 125 ]], //i>1? [['swing2', 90, 270 ]] : [['swing2', -90, 90 ]],
                position:[['swing2', -125 ]],
                drives: [['swing2', stiffness, damping, forceLimit, acceleration ]],
            })

        }

        i = 4
        while(i--){
            solver.addJoint({
                name:id+'_BB'+(i+12), bone:id+'_earm'+i,
                pos1:[0.716, -0.06, 0], pos2:[ 0, 0, 0 ],
                type:'fixe',
            })
        }

        solver.addJoint({
            name:id+'_AAA', bone:id+'_top',
            pos1:[0, 0.2, 0], pos2:[ 0, 0, 0 ],
            type:'fixe',
        })

        //-----------------------------------------
        //    START
        //-----------------------------------------

        solver.start();

        //solver.commonInit();

        this.solver = solver;

    }

    play(){

        const name = this.current
        if( this.frame >= this.anims[name].length ) this.frame = 0
        this.solver.setAngles( this.anims[name][this.frame], this.speed ).then( this.play.bind(this) );
        this.frame++

    }

    update( dt ){
        this.solver.driveJoints( dt );
    }

}
