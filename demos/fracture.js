
const list = [ 'test_0', 'test_1', 'test_2' ];
const setting = { name:'' };
let model



demo = () => {

    phy.view({ envmap:'histo', envblur:0.5, exposure:0.1, direct:25, envIntensity:5, bgIntensity:1.0, shadowIntensity:1.0, distance:16, y:3.5 })

    // config physics setting
    phy.set({ substep:phy.engine==='HAVOK'? 1:2, gravity:[0,-9.81,0], ccd:true });

    // add static plane 
    phy.add({ type:'plane', name:'floor', visible:false })

    phy.material({ name:'B', color:0xFFFFFF, roughness: 0.6, metalness: 0.3, 
        map:phy.texture({ url:'./assets/textures/wood_c.jpg', repeat:[2,2] }),
        normalMap:phy.texture({ url:'./assets/textures/wood_n.jpg', repeat:[2,2] }) 
    })

    let gui = phy.gui(null,100);
    gui.add( 'button', { name:'Reset' } ).listen().onChange( ()=>{run('test_0')} )
    //gui.add( setting, 'name', { type:'grid', values:list, selectable:true, h:26 } ).listen().onChange( run )
  

    phy.load(['./assets/models/museum/wakeup.glb'], onComplete )


}

onComplete = (name) => {

    model = phy.getMesh('wakeup', true);
    let mat;

    for(let m in model){
        model[m].geometry.scale(20,20,20);
        mat = model[m].material

        mat.side =  THREE.DoubleSide

        const newmap = /* glsl */`
        #ifdef USE_MAP
            vec4 sampledDiffuseColor = texture2D( map, vMapUv );
            if(gl_FrontFacing) diffuseColor *= sampledDiffuseColor;
        #endif
        `;
        mat.onBeforeCompile = (shader)=>{

            let fragment = shader.fragmentShader;
            fragment = fragment.replace( 
                `vec4 diffuseColor = vec4( diffuse, opacity );`,
                `vec3 col = gl_FrontFacing ? diffuse : vec3(0.6);
                vec4 diffuseColor = vec4( col, opacity );`
            ); 
            fragment = fragment.replace( '#include <map_fragment>', newmap );
            
            shader.fragmentShader = fragment;
            
        }
    }

    //console.log(model)

    
    test_0()

}

run = (name) => {

    phy.clearGarbage();

    phy.add({ type:'plane', name:'floor', visible:false })

    this[name]();

}

test_0 = ( d ) => {



    phy.add({
        name:'wall',
        size:[20,40,1],
        pos:[0,20,-10],
        visible:false
        //material:'glass',
    })

    phy.add({ 
        name:'frost', 
        type:'mesh',
        //type:'convex',

        mesh:model['wakeup002'],
        //mass:1000,
        friction:0.5,
        density:500, 
        pos:[0,0,0],
        breakable:true, 
        ignore:['floor', 'wall'],
       //bullet:true,
        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision, with intern mesh ]
        breakOption:[ 50, 3, 4, 2, false ],
        //material:'B', 
        //autoUV:true 
        massInfo:true
    });



    phy.mouseMode('shoot', { size:0.2, mass:100, velocity:60 })

}


test_1 = ( d ) => {

    phy.add({ 
        name:'boom1', 
        type:'box', 
        density:10, 
        size:[2,4,2], 
        pos:[0,2,0], 
        //breakable:true, 
        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
        breakOption:[ 50, 1, 2, 2 ], 
        material:'B', 
        autoUV:true 
    });

    phy.add({ name:'boom2', type:'box', density:10, size:[10,1,10], pos:[0,40,0], 
        breakable:true, 
        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
        breakOption:[ 50, 1, 2, 2 ], 
        material:'B', 
        autoUV:true 
    });

    //phy.add({ type:'contact', b1:'boom1', callback: onContact })

}

test_2 = ( d ) => {

    phy.add({ name:'ball2', type:'sphere', mass:35, state:4, size:[1], pos:[0,300,0], friction:0.5, ccdThreshold:0.00001 });
    phy.add({ name:'ball3', type:'sphere', mass:35, state:4, size:[1], pos:[0,1000,0],  friction:0.5, ccdThreshold:0.00001 });


    let y = 1;

    for(let i = 0; i < 5; i++ ){

        phy.add({ name:'b1'+i, type:'box', radius:0.1, size:[2, 2, 2], pos:[5,y,5], rot:[0,0,0], mass:10, state:2, margin:0.05  });
        phy.add({ name:'b2'+i, type:'box', radius:0.1, size:[2, 2, 2], pos:[5,y,-5], rot:[0,0,0], mass:10, state:2, margin:0.05  });
        phy.add({ name:'b3'+i, type:'box', radius:0.1, size:[2, 2, 2], pos:[-5,y,5], rot:[0,0,0], mass:10, state:2, margin:0.05  });
        phy.add({ name:'b4'+i, type:'box', radius:0.1, size:[2, 2, 2], pos:[-5,y,-5], rot:[0,0,0], mass:10, state:2, margin:0.05 });
        y+=1.2;

        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision ]
        phy.add({ 
            name:'glass'+i, type:'box', size:[12, 0.4, 12], pos:[0,y,0], rot:[0,0,0], mass:20, material:'glass', 
            breakable:true, breakOption:[ 200, 1, 3, 2 ],
            //margin: 0.05,
            //
            //ccdRadius:0.1,
        });
        y+=1.2;


    }

}