const max = 600;
let saving = []

let N = 0


let testCar = []

demo = () => {

    phy.view({ 
        envmap:'small', groundColor:0x505050, background:0x151414, 
        envblur:0.5, d:10, theta:0, phi:25, reflect:0.1 , fog:true, fogExp:0.05,
    })

    let g = phy.getGround()
    g.material.map = phy.texture({ url:'./assets/textures/grid2.png', repeat:[60,60], offset:[0.5,0.5], anisotropy:4 });
    g.material.normalMap = phy.texture({ url:'./assets/textures/grid_n.png', repeat:[60,60], offset:[0.5,0.5], anisotropy:4 });
    g.material.normalScale.set(0.1,-0.1)
    g.material.roughness = 0.8;
    g.material.metalness = 0;

    // config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0], key:true })

    // add static ground box
    phy.add({ type:'box', size:[100,4,100], pos:[0, -2, 0], restitution:0.2, visible:false })

    addGui()


    testCar.push(new Car())
    testCar.push(new Car([-4,1,0], [1,0.2,2]))
    testCar.push(new Car([4,1,0], [2,0.2,2]))


    // update after physic step
    phy.setPostUpdate ( update )

}

const addGui = () => {

    gui = phy.gui();
    /*gui.add('grid',{ values:['SAVE', 'RESTOR'], selectable:false, radius:6 }).onChange( (n)=>{
        if(n==='SAVE') save()
        if(n==='RESTOR') begin(saving)
    } );*/

}

update = () => {
    let key = phy.getKey()
    let delta = phy.getDelta()
    let r = phy.getAzimut()

    for(let i in testCar)testCar[i].update(key, delta)

}


class Car {

    constructor ( pos, size ) {

        this.name = 'car'+N;
        N++

        this.w = 0

        this.maxSpeed = 300;
        this.maxSteering = 25

        this.drive = ['rx', 10, 100, 1000000, true]
        this.driveSterring = ['ry', 10000, 10, 100000]

        this.suspension = ['y', -0.02, 0.02, 10000, 100]
        this.steering = ['ry', -this.maxSteering, this.maxSteering, 10000, 100]

        this.currentSpeed = 0;
        this.currentSteering = 0;

        this.mass = 100
        this.w_mass = 20

        this.pos = pos || [0,1,0];
        this.size = size || [2,0.2,4]

        
        this.w_friction = 20

        this.w_radius = 0.3
        this.w_width = 0.3
        this.w_x = (this.size[0]*0.5)+(this.w_width*0.5)//1
        this.w_z = (this.size[2]*0.5)-this.w_radius//1.8

        this.w_sphere = false

        this.group = 1 << 3 // 8
        this.noCollision = 1 << 5 // 32

        this.init()

    }

    init(){

        phy.add({ 
            name:this.name+'_chassie', type:'box',
            aggregate:this.name+'_group',
            size:this.size, pos:this.pos, 
            mass:this.mass, massCenter:[0,-this.w_radius*2, 0],
            restitution:0.2, friction:0.5, 
            group:this.group, 
            //mask:1|2 
        })

        let r = this.w_radius
        let d = this.w_width
        let wheelGeo = new THREE.CylinderGeometry( r, r, d, 60, 1 );
        wheelGeo.rotateZ( -Math.PI*0.5 );
        this.wheelMesh = new THREE.Mesh(wheelGeo)

        for(let i = 0; i<4; i++ ){
            this.addWheel(i)
        }

    }

    update( key, delta ){

        if(key[1]!==0){
            this.currentSpeed += -key[1]*40*delta
            this.currentSpeed = math.clamp(this.currentSpeed, -this.maxSpeed*0.5, this.maxSpeed)
        } else {
            this.currentSpeed *= 0.1
        }

        if(key[0]!==0){
            this.currentSteering += key[0]
            this.currentSteering = math.clamp(this.currentSteering, -this.maxSteering, this.maxSteering)
        } else {
            this.currentSteering *= 0.99
        }

        let name = this.name

        let c = []
        //c.push({ name:name+'_JW0', driveVelocity:{rot:[this.currentSpeed,0,0]} })
        //c.push({ name:name+'_JW1', driveVelocity:{rot:[this.currentSpeed,0,0]} })
        c.push({ name:name+'_JW2', driveVelocity:{rot:[this.currentSpeed,0,0]} })
        c.push({ name:name+'_JW3', driveVelocity:{rot:[this.currentSpeed,0,0]} })


        const [innerAngle, outerAngle] = this.wheelAngles(-this.currentSteering);

        c.push({ name:name+'_JA0', drivePosition:{rot:[0,innerAngle,0]} })
        c.push({ name:name+'_JA1', drivePosition:{rot:[0,outerAngle,0]} })

        if(c.length) phy.change( c )

    }

    wheelAngles( a ){

        // NOTE: This is needed because of https://en.wikipedia.org/wiki/Ackermann_steering_geometry

        const wheelbase = this.w_z*2;//wheel z space
        const trackWidth = this.w_x*2 //wheel x space

        const avgRadius = wheelbase / Math.tan(a*math.torad);
        const innerRadius = avgRadius - trackWidth / 2;
        const outerRadius = avgRadius + trackWidth / 2;
        const innerAngle = Math.atan(wheelbase / innerRadius);
        const outerAngle = Math.atan(wheelbase / outerRadius);

        return [innerAngle*math.todeg, outerAngle*math.todeg];

    }

    addWheel(i){

        let isSphere = this.w_sphere

        let isLeft = i===1 || i===3
        let isBack = i>1
        let name = this.name
        let mesh = this.wheelMesh


        let m = this.w_mass
        let f = this.w_friction

        let x = this.w_x
        let z = this.w_z
        let r = this.w_radius
        let d = this.w_width

        //console.log(1|2)

        let pos = [this.pos[0]+(isLeft?x:-x), this.pos[1], this.pos[2]+(isBack?z:-z)]

        phy.add({ 
            name:name+'_A'+i, type:'box', 
            aggregate:this.name+'_group',
            size:[d,r*1.3,r*1.3], pos:pos,
            //group:this.group, 
            mask:1|2,
            //collision:false,
            material:'debug2',
            mass:m*0.5, restitution:0, friction:0.5,

        })

        phy.add({ 
            name:name+'_W'+i, type:isSphere?'sphere':'cylinder', mesh:mesh,
            aggregate:this.name+'_group',
            //group:this.group, 
            mask:1|2,

            material:'debug', 
            size:[r,d], 
            localRot:[0,0,isSphere?0:-90], 
            //rot:[0,0,isSphere?0:90],  
            pos:pos, seg:48, real:true,
            mass:m*0.5, restitution:0.1, friction:f,
        })

        let lm = isBack ? [[...this.suspension]] : [[...this.suspension], [...this.steering]]

        phy.add({ 
            type:'generic', 
            name: name+'_JA'+i, 
            b1: name+'_chassie', b2:name+'_A'+i,
            worldPos:pos,
            worldAxis:[1,0,0],
            limit:lm,
            drive: isBack ? [] : [[...this.driveSterring]],
            friction:0, collision:false, visible:true 
        })

        phy.add({ 
            type:'generic', 
            name: name+'_JW'+i, 
            b1:name+'_A'+i, b2:name+'_W'+i, 
            worldPos:pos,
            worldAxis:[1,0,0],
            motion:[['rx','free']],
            drive:isBack? [[...this.drive]]:[],
            friction:0, collision:false, visible:true 
        });

    }

}