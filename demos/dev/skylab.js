let setting = {

}
let env = null;

function demo() {
    phy.view({
        envmap:0x606060,
        //ground:false,
        vignette:false,
    })






    phy.set({})


    env = phy.addEnvmap({cube:true})
    env.addSky()
    setting = env.getSkyOtion()

    addGui()


    //phy.setTimeout( yo, 1000 )

    // config physics setting
    phy.add({ type:'plane', visible:false });

    phy.add({ type:'sphere', size:[2], pos:[0,2,0], density:1, material:'silver' });
    
    /*phy.add({ type:'box', size:[1,3,2], pos:[-4,1.5,0], density:0 });

    phy.add({ 
        type:'box', size:[10,1,1], pos:[0,5,0], radius:0.1,
        mass:0.1, 
        //density:1, 
        massCenter:[ -4,0,0 ],
        material:'chrome',
        //massInfo:true,
    });*/
    //phy.add({ type:'sphere', size:[1], pos:[4,8,0], rot:[45,45,0], mass:1 })


}


const addGui = () => {
    gui = phy.gui();
    let d, min = 0, max = 1, p = 2
    for(let n in setting){
        if(setting[n] === null) continue
        min = 0
        max = 1
        p = 2
        d = { min:min, max:max, precision:p }
        //if( n==='s_travel' )max =1
        if( n==='saturation' ) d = { ...d, max:2 }
        if( n==='SAMPLE' || n==='STEP' ) d = {type:'number', min:2, max:256, precision:0 }
        //    if( n==='s_force' )max =10000
        gui.add( setting, n, d ).onChange( (v)=>{
            env.setSkyOtion(setting);
        });
    }
}


const yo = () => {

    console.log('is done !!')

    //eva.model.addHelper()
    //eva.model.addExo()
}