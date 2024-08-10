const debug = 0
let bike, model, meshes, maxDistance = 50, oldv = 0, w1, w2;
const TimeFrame = 1/30;
let modelName = 'akira2'

const setting = {

    s_travel:0.15,
    s_stiffness:10,//32
    s_damping:4,
    s_force:5000,
    dampingRate: 0.25,//0.25

}

demo = () => {
    
    //phy.log('use key WSAD or ZSQD<br>SPACE to handbrake')

    phy.view({ envmap:'clear', ground:true, fog:true, fogDist:0.01, distance:3, phi:0, theta:-90, target:[0,1,0], y:1 })

    phy.useRealLight( {} );

    phy.set( {substep:1, gravity:[0,-9.81,0], key:true })

    phy.add({ type:'plane', name:'floor', size:[20,1,20], visible:false, friction:1.0 });
    //phy.add({ pos:[0,20,0], rot:[0,0,0], size:[0.5,0.5,0.5], mass:30})
    //phy.add({ type:'box', size:[4,1,6], rot:[1,0,0], pos:[0,0.5,0],  radius:0.025 })

    phy.load(['./assets/models/'+modelName+'.glb'], onComplete )

}

onComplete = () => {

    meshes = phy.getMesh(modelName);
    meshes.a_shape.visible = false
    meshes.ak_front_shell.visible = !debug
    meshes.ak_chassis_shell.visible = !debug
    applyMaterial( meshes )

    // reapply morph
    phy.applyMorph(modelName, null, true);

    model = phy.get(modelName, 'O')
    model.rotation.y = -90 * math.torad;
   // model.position.y = -0.05

    //model.scale.set(0.1,0.1,0.1)

    //phy.getScene().add(model)

    w1 = meshes.ak_tire_av
    w2 = meshes.ak_tire_ar



    //openShell(1)

    frontSusp(0)
    backSusp(0)

    //return

    let mass = 300;

    bike = phy.add( {

        type:'vehicle', 
        name:'bike',
        rad:0.02,
        radius:0.36,// wheels radius
        radiusBack:0.39,
        deep:0.2, // wheels deep only for three cylinder
        deepBack:0.274,
        wPos:[ 0, 0, 1.1 ], // wheels position on chassis
        chassisPos:[0,0,0],
        massCenter:[0,0,0],

        pos:[0,0,0],

        ray:debug,

        mass:mass,//1600,

        damping: [0,10],//0.25
        maxVelocity:[10000,10],
        //stabilization:10000,//0.0025


        chassisShape:meshes.a_shape,
        meshScale:0.1,
        noClone:true,

        chassisMesh:model,
        debug:debug,
        //wheelMesh: wheel,
        //brakeMesh: brake,
        //suspensionMesh: suspension,



        numWheel:2,

        suspensionTravelDir:[
            [0,-0.3,0.7],
            [0,-0.9,-0.1],
        ],

        maxSteering:12,

        /*
        s_travel:0.2,
        s_stiffness:16,//32,
        s_damping:4,//8,
        s_force:10000,
        */

        ...setting,

        /*
        longStiff: 10,
        latStiffX: 0.00001,
        latStiffY: 6,
        camberStiff : 0,*/
        restLoad : 5.5,

        wMass: 25,
        

    })

    phy.control( 'bike' )
    phy.setPostUpdate ( update )

    addGui()

    if(debug) return

    //

    // update after physic step
    

    phy.follow( 'bike', { direct:true, simple:true, distance:3, phi:0, theta:-90, decal:[0, 1, 0] })
    //phy.control( 'bike' )


    terrainTest()

}

const addGui = () => {
    gui = phy.gui();
    let min = 0.01
    let max = 100
    for(let n in setting){
        min = 0.01
        max = 100
        if( n==='s_travel' )max =1
        if( n==='dampingRate' )max =2
            if( n==='s_force' )max =10000
        gui.add( setting, n, { min:min, max:max} ).onChange( (v)=>{ 
            bike.set( setting )
            //phy.change({name:'bike', ...setting }) 
        });
    }
}

terrainTest = () => {

    let terrain = phy.add({
        type:'terrain',
        name:'terra',
         
        maps:['road2', 'road3', 'asph'],
        ns:4,
        roughness:0.4,
        metalness:0.4,
        //staticFriction:0.5,
        friction: 0.5,
        restitution: 0,
        uv: 150,
        pos: [0,0,0],
        size:[512, 10, 512],
        sample: [512, 512],
        frequency: [0.016,0.05,0.2],
        level:[ 1, 0.2, 0.05 ],
        expo: 1,
    })

    let py = terrain.getHeight( 0, 0 )

    //phy.up( { name:'bike', pos:[0,py,0] } )
    bike.set({pos:[0,py,0]})
    phy.remove( 'floor' )

    // update after physic step
    phy.setPostUpdate( update )

}

playFrame = ( name, frame ) => {

    let action = model.actions[name];
    action.time = frame * TimeFrame;
    action.setEffectiveWeight( 1 );
    action.play();
    action.paused = true;
    model.mixer.update( 0 );

}

openShell = ( n ) => {


    n = 1-n
    meshes.ak_front_shell.rotation.x = - (75 + ( n * 15 )) * math.torad;
    phy.morph( meshes.ak_link,'up', 1-n )

}

frontSusp = ( n ) => {

    n = math.clamp(n, 0, 1);
    meshes.ak_rim_av.position.y = -6.389 - n*1.566;
    phy.morph( meshes.ak_extra_susp,'low', n )

}

backSusp = ( n ) => {

    meshes.ak_rim_ar.position.y = (n*0.6)-0.3//0.3//n;
    //phy.morph( meshes.ak_axis_back,'low', ((-n+0.3)*1.66666) )
    phy.morph( meshes.ak_axis_back,'low', n)

}

updateAnimation = () => {
    let v = bike.steering;
    if(v!==oldv){
        model.actions.right_on.stop()
        model.actions.left_on.stop()
        oldv = v
        if(v>=0) playFrame('left_on', Math.floor(v*12) )
        else playFrame('right_on', Math.floor(-v*12) )
    }

    //console.log( (-(bike.suspension[0])+1.0)*0.5 )

    //frontSusp( (-(bike.suspension[0])+0.5)*0.4 )
    //frontSusp( (-(bike.suspension[0])+1.0)*0.5 )
    frontSusp( (bike.suspension[0]*0.5)+0.5 )
    backSusp( (bike.suspension[1]*0.5)+0.5 )
    //backSusp( (-(bike.suspension[1])*0.5)*0.4 )
}

update = () => {

    //let delta = phy.getDelta()
    //if( model.mixer ) model.mixer.update( delta );
    updateAnimation()


    let p = bike.position;
    //let d = math.distance({ x:p.x, z:p.z });
    let d = math.distanceArray([p.x, 0, p.z])

    w1.rotation.x = bike.rolling[0]
    w2.rotation.z = -bike.rolling[1]

    if(debug) return

    if( d > 50 ){
        phy.change([
            { name:'terra', decal:[p.x,0,p.z] },
            { name:'bike', pos:[0,p.y,0] },
        ])
    }

}

applyMaterial = ( model ) => {

    const mat = {}
    const path = './assets/textures/akira/'
    const ao = 1

    //let Mat = phy.getMat()
    mat['carGlass'] = phy.getMat('carGlass');

    mat['kaneda'] = phy.material({
        name:'kaneda',
        roughness: 1,
        metalness: 1,
        map: phy.texture({ url:path + 'kaneda_c.jpg' }),
        normalMap: phy.texture({ url:path + 'kaneda_n.jpg' }),
        metalnessMap: phy.texture({ url:path + 'kaneda_m.jpg' }),
        roughnessMap: phy.texture({ url:path + 'kaneda_r.jpg' }),
        aoMap: phy.texture({ url:path + 'kaneda_a.jpg' }),
        normalScale: [ 1, -1 ],
        aoMapIntensity:ao,

    });

    mat['bike1'] = phy.material({
        name:'bike1',
        roughness: 1,
        metalness: 1,
        map: phy.texture({ url:path + 'bike_1_c.jpg' }),
        normalMap: phy.texture({ url:path + 'bike_1_n.jpg' }),
        metalnessMap: phy.texture({ url:path + 'bike_1_m.jpg' }),
        roughnessMap: phy.texture({ url:path + 'bike_1_r.jpg' }),
        aoMap: phy.texture({ url:path + 'bike_1_a.jpg' }),
        normalScale: [ 1, -1 ],
        aoMapIntensity:ao,
        clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5,
    });

    mat['bike2'] = phy.material({
        name:'bike2',
        roughness: 1,
        metalness: 1,
        map: phy.texture({ url:path + 'bike_2_c.jpg' }),
        metalnessMap: phy.texture({ url:path + 'bike_2_m.jpg' }),
        roughnessMap: phy.texture({ url:path + 'bike_2_r.jpg' }),
        aoMap: phy.texture({ url:path + 'bike_2_a.jpg' }),
        aoMapIntensity:ao,
        clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5,
    });

    mat['bike3'] = phy.material({
        name:'bike3',
        roughness: 1,
        metalness: 1,
        emissive:0xffffff,
        map: phy.texture({ url:path + 'bike_3_c.jpg' }),
        emissiveMap: phy.texture({ url:path + 'bike_3_l.jpg' }),
        metalnessMap: phy.texture({ url:path + 'bike_3_m.jpg' }),
        roughnessMap: phy.texture({ url:path + 'bike_3_r.jpg' }),
        aoMap: phy.texture({ url:path + 'bike_3_a.jpg' }),
        normalMap: phy.texture({ url:path + 'bike_3_n.jpg' }),
        normalScale: [ 1, -1 ],
        aoMapIntensity:ao,
        clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5
    });

    mat['tire'] = phy.material({
        name:'tire',
        roughness: 0.7,
        metalness: 0.1,
        map: phy.texture({ url:path + 'tires_c.jpg' }),
        normalMap: phy.texture({ url:path + 'tires_n.jpg' }),
        normalScale: [ 2, 2 ],
    });

    let m
    for( let o in model ){
        m = model[o]
        //phy.uv2( m )
        m.castShadow = true
        m.receiveShadow = true
        switch(o){
            case 'ak_glass': case 'ak_glass_white':case 'ak_pane_g': case 'ka_glass':
            m.material = mat.carGlass; 
            m.castShadow = false
            break;
            case 'ak_tire_av': case 'ak_tire_ar': m.material = mat.tire; break;
            case 'ka_body': case 'ka_eye_l': case 'ka_eye_r': case 'ka_eyes': case 'ka_hair':
            case 'ka_lunette': m.material = mat.kaneda; break;
            case 'ak_axis_front': case 'ak_front_shell': 
            case 'ak_rim_ar': case 'ak_rim_av': m.material = mat.bike2; break;
            case 'ak_light_ar': case 'ak_light_av': case 'ak_pane_g': 
            case 'ak_panel': case 'ak_screen': m.material = mat.bike3; break;
            default:
            m.material = mat.bike1
            break;

        }

    }

}


