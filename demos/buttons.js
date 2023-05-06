let t 

function demo() {

    phy.view({
        //envmap:0x8aa4b8,
        //ground:false
    })


    phy.add({ type:'plane', visible:false });


    let b1 = phy.addButton({ type:'box', pos:[-3,0,0], size:[3,1,2], radius:0.2, callback:ab1 })

    phy.addText({ text:'PUSH', pos:[ 0,0.5,0 ], rot:[-90,0,0], parent:b1, h:0.8 })

    let b2 = phy.addButton({ type:'cylinder', pos:[1,0,0], size:[1,1], radius:0.2, seg:32, callback:ab2 })

    phy.addText({ text:'O', pos:[ 0,0.5,0 ], rot:[-90,0,0], parent:b2, h:0.8 })

    let b3 = phy.addButton({ type:'cylinder', pos:[4,0,0], size:[0.6,1], radius:0.2, seg:32, callback:ab3 })

    phy.addText({ text:'X', pos:[ 0,0.5,0 ], rot:[-90,0,0], parent:b3, h:0.8 })

    t = phy.addText({ text:'click on button', pos:[ 0,0,3 ], rot:[-90,0,0]})

    //phy.addButton({ type:'sphere', pos:[-5,0,0], size:[1,1], radius:0.2 })

    let i = 10
    while(i--) phy.add({ type:'box', pos:[-4.5+(i),3,0], size:[0.4,0.4,0.4], radius:0.05, density:1, material:'plexi' })

    // config physics setting
   /*
    

    //phy.add({ type:'box', size:[10,0.1,10], pos:[0,-3,0], density:0 });

   
    phy.add({ type:'sphere', size:[1], pos:[0,8,0], rot:[45,45,0], density:1 });
  phy.add({ type:'box', size:[1,1,1], pos:[0,5,0], rot:[45,45,0], density:1 });
  phy.add({ type:'box', size:[1,1,1], pos:[0,20,0], rot:[45,45,0], density:1 });*/

}


function ab1 (){
    t.set( 'button 1 !')
}

function ab2 (){
    t.set( 'button 2 !')
}

function ab3 (){
    t.set( 'button 3 !')
}