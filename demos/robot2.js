const debug = 0;
const bots = []
let meshes

demo = () => {

    phy.view({ envmap:'clear', ground:true, fog:true, fogDist:0.04 })

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
        if(n===5){ 
            n = 0
            l++
        }

        bots[i] = new Robot({id:i, pos:[x,0.5,z]})

    }

    //let m1 = 
    //let m2 = new Robot({id:2,pos:[0,0.5,0]})
    //let m3 = new Robot({id:3,pos:[4,0.5,0]})

    
    //-----------------------------------------
    //    UPDATE
    //-----------------------------------------

    phy.setPostUpdate( update )


}

class Robot {
    constructor ( o = {} ) {

        this.id = o.id || 0
        this.name = o.name || 'bot' + this.id
        this.solver = null
        this.pos = o.pos || [0, 2, 0]

        //   front right is reverse
        //   1 ____ 3
        //   |      |
        //   |      | 
        //   0 ____ 2 

        this.angles = [ 
            90, 30, -90, -30, 
            -90, -50, -90, -50,
            -90, -50, -90, -50
        ];
        this.init()

    }

    init(){

        const pos = this.pos;

        let solver = phy.add({ type:'solver', name:this.name, iteration:16, fix:false, needData:true, neverSleep:true })

        //-----------------------------------------
        //    BONES
        //-----------------------------------------

        let def = {
            filter:[2,-1,1,0], dmv:[0.2,0.2,100,20], debug:debug, meshSize:10, solver:this.name
        }

        phy.add({
            type:'box', name:'base'+ this.id, linked:'null',
            pos:pos, size:[ 0.7, 0.15, 1.3 ], density:1,//1.28
            mesh:meshes.base,
            ...def
        });

        phy.add({
            type:'sphere', name:'top'+ this.id, linked:'base'+ this.id,
            pos:math.vecAdd( pos, [0,0.2,0] ), size:[ 0.33 ], density:1,//1.28
            mesh:meshes.top,
            ...def
        });

        let i = 4
        const p = [
            [0.5, 0.055, -0.54],
            [0.5, 0.055, 0.54],
            [-0.5, 0.055, -0.54],
            [-0.5, 0.055, 0.54],
        ]

        const d = [
            [0.25, 0, 0],
            [0.25, 0, 0],
            [-0.25, 0, 0],
            [-0.25, 0, 0],
        ]

        const c = [
            [0.45, 0, 0],
            [0.45, 0, 0],
            [-0.45, 0, 0],
            [-0.45, 0, 0],
        ]

        const e = [
            [1.916, -0.006, -0.54],
            [1.916, -0.006, 0.54],
            [-1.916, -0.006, -0.54],
            [-1.916, -0.006, 0.54],
        ]

        while(i--){

            phy.add({
                type:'box', name:'barm'+i+ this.id, linked:'base'+ this.id,
                size:[ 0.3, 0.4, 0.2 ], localPos:[0.152, 0, 0], 
                pos: math.vecAdd( pos, p[i] ), rot:[0,i>1? 180: 0,0], density:1,
                mesh:i == 1 ? meshes.barm_002 : meshes.barm_001,
                ...def
            });

            phy.add({
                type:'box', name:'darm'+i+ this.id, linked:'barm'+i+ this.id,
                size:[ 0.04, 0.1, 0.4 ], localPos:[0.25, 0, 0], 
                pos: math.vecAdd( math.vecAdd( pos, p[i] ), d[i]), rot:[0,i>1? 180: 0,0], density:1,
                mesh: meshes.darm_001,
                ...def
            });

            phy.add({
                type:'box', name:'farm'+i+ this.id, linked:'darm'+i+ this.id,
                size:[ 0.4, 0.22, 0.2 ], localPos:[0.095, 0, 0], 
                pos: math.vecAdd( math.vecAdd( pos, p[i] ), math.vecAdd(c[i], d[i])), rot:[0,i>1? 180: 0,0], density:1,
                mesh: i == 1 ? meshes.farm_002 : meshes.farm_001,
                ...def
            });

            phy.add({
                type:'sphere', name:'earm'+i+ this.id, linked:'farm'+i+ this.id,
                size:[ 0.04 ], 
                pos:math.vecAdd( pos, e[i] ), rot:[0,i>1? 180: 0,0], density:1,
                mesh:meshes.earm_001,
                ...def
            });

        }

        //-----------------------------------------
        //    JOINT
        //-----------------------------------------

        const stiffness = 1000//100000000;
        const damping = 100; // 0
        const forceLimit = 1000//Infinity;
        const acceleration = false;

        solver.addJoint({
                name:'A'+i, bone:'top'+ this.id,
                pos1:[0, 0.2, 0], pos2:[ 0, 0, 0 ],
                type:'fixe',
        });

        i = 4
        while(i--){
            solver.addJoint({
                name:this.id+'A'+i, bone:'barm'+i + this.id,
                pos1:p[i], pos2:[ 0, 0, 0 ],
                type:'revolute',
                rot1: [0,i>1? 180: 0,0],
                limits: [['swing1', -90, 90 ]],
                drivesTarget: [['swing1', i==0 || i==3? 30 : -30 ]],
                drives: [['swing1', stiffness, damping, forceLimit, acceleration ]],
            });
        }

        i = 4
        while(i--){
            solver.addJoint({
                name:this.id+'A'+i, bone:'darm'+i + this.id,
                pos1:[0.25, 0, 0], pos2:[ 0, 0, 0 ],
                type:'revolute',
                limits: [['swing2', -90, 90 ]],
                drivesTarget: [['swing2', 30 ]],
                drives: [['swing2', stiffness, damping, forceLimit, acceleration ]],
            });
        }

        i = 4
        while(i--){
            solver.addJoint({
                name:this.id+'A'+(4+i), bone:'farm'+i + this.id,
                pos1:[0.45, 0, 0], pos2:[ 0, 0, 0 ],
                type:'revolute',
                limits: [['swing2', -125, 125 ]], //i>1? [['swing2', 90, 270 ]] : [['swing2', -90, 90 ]],
                drivesTarget:[['swing2', -125 ]],
                drives: [['swing2', stiffness, damping, forceLimit, acceleration ]],
            });

            solver.addJoint({
                name:'BB'+i, bone:'earm'+i+ this.id,
                pos1:[0.716, -0.06, 0], pos2:[ 0, 0, 0 ],
                type:'fixe',
            });

        }

        //-----------------------------------------
        //    START
        //-----------------------------------------

        solver.start();
        this.solver = solver;

       // this.solver.setAngles( this.angles, 2 )//.then()//() => autoCommand( movementCount++ ) );

    }
}

update = ( dt ) => {

    let i = bots.length
    while(i--) bots[i].solver.driveJoints( dt );

}