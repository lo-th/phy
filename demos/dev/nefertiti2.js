let model

demo = () => {

    phy.view({ envmap:'histo', envblur:0.5, exposure:0.5, direct:25, envIntensity:5, bgIntensity:1.0, shadowIntensity:1.0, distance:16, y:5 })

    // config physics setting
    phy.set({ substep:phy.engine==='HAVOK'? 1:2, gravity:[0,-9.81,0], ccd:true });

    // add static plane 
    phy.add({ type:'plane', name:'floor', visible:false })

    phy.material({ name:'nefer', color:0xFFFFFF, roughness: 0.6, metalness: 0.3, normalScale:[0.25,-0.25], 
        map:phy.texture({ url:'./assets/textures/museum/ComfyUI_00893_.png', srgb:true }),
        aoMap:phy.texture({ url:'./assets/textures/museum/nefertiti_ao.png' }),
        normalMap:phy.texture({ url:'./assets/textures/museum/ComfyUI_00894_.png' }) 
    })

    let gui = phy.gui(null,100);
    gui.add( 'button', { name:'Reset' } ).listen().onChange( ()=>{run('test_0')} )
    gui.add( 'button', { name:'Shoot' } ).listen().onChange( ()=>{ phy.mouseMode('shoot', { size:0.2, mass:100, velocity:60 }) } )
    //gui.add( setting, 'name', { type:'grid', values:list, selectable:true, h:26 } ).listen().onChange( run )
  

    phy.load(['./assets/models/museum/nefertiti2.glb'], onComplete )


}

onComplete = (name) => {

    model = phy.getGlb('nefertiti2', true, true);

    model.scale.set(20,20,20);


    model.traverse( ( child ) => {

        

        if ( child.isMesh ){ 
            console.log(child.name)
            if(child.name==='nefertiti'){
                let mat = child.material
                child.material = phy.getMaterial('nefer');
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
        }

    })

    let g = phy.getMat('glass_eye')
    g.color.setHex(0x000000)// = 0.2
    g.opacity = 0.5
    g.blending = THREE.AdditiveBlending
    g.transparent = true
    g.reflection = 0.2
   //g.alphaToCoverage = true
    //g.premultipliedAlpha = true

    g = phy.getMat('tear')
    g.opacity = 0.75
    g.transparent = true
    g.blending = THREE.AdditiveBlending
    g.reflection = 0.2
    g.alphaToCoverage = true
    g.premultipliedAlpha = true

    console.log(g)

    phy.add(model)


    return
    let mat;

    for(let m in model){

        if(m === 'nefertiti'){
            model[m].geometry.scale(20,20,20);
            model[m].material = phy.getMaterial('nefer');
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
    }

    //console.log(model)

    
    test_0()

}

run = (name) => {

    phy.clearGarbage();

     phy.mouseMode('drag')

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
        type:'convex',
        mesh:model['nefertiti'],
        mass:1000,
        friction:0.5,
        //density:5, 
        pos:[0,0,0],
        breakable:true, 
        ignore:['floor', 'wall'],
       //bullet:true,
        // breakOption: [ maxImpulse, maxRadial, maxRandom, levelOfSubdivision, with intern mesh ]
        breakOption:[ 50, 3, 4, 2, false ],
        //material:'B', 
        //autoUV:true 
        //massInfo:true
    });



    //phy.mouseMode('shoot', { size:0.2, mass:100, velocity:60 })

}