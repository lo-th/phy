let n = 1;
let gui = null;
let tmp = [];
const setting = { gravity:-9.81, auto:true, name:'exterieur' };
const list = [ 'Exterieur', 'Niveau 1', 'Niveau 2' ];
let mesh;

demo = () => {

    phy.view({ 
        theta:-25, distance:30, x:0, ground:false, envmap:'clear', 
        fog:true, fogRange:[10,100], fogMode:0, 
    });
    phy.set({ substep:1, gravity:[0,-9.81,0] });

    //phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false });
    //phy.add({ type:'box', name:'floor', size:[ 100,1,100 ], pos:[0,-0.5,0], visible:false });
    phy.lightIntensity( 6, 0, 0.7 );
    phy.useRealLight( {} );


    // gui
    gui = phy.gui();
    
    gui.add( setting, 'name', { type:'button', values:list, selectable:true, h:26, p:0 } ).listen().onChange( click )
    /*gui.add( setting, 'gravity', { min:-30, max:0, mode:2 } ).onChange( (v) => { phy.setGravity([0,v,0]) } )
    gui.add( setting, 'auto' ).listen().onChange( ( b ) => { if(b) next(); } )
    */

    phy.load(['./assets/models/house.glb'], onComplete );
 
}

onComplete = () => {

    let scene = phy.getGlb('house');
    
    let mat = phy.getGlbMaterial('house');
    mesh = phy.getMesh('house' );
    //let group = phy.getGroup('house' );

    
    mat.facade.color.setHex(0xFFFFFF);
    mat.toiture.color.setHex(0xf0b59c);
    mat.floor.color.setHex(0xFFFFFF);
    mat.jardin.color.setHex(0xFFFFFF);
    mat.glass.alphaToCoverage = true;

    mat.facade.map = phy.texture({ url:'./assets/textures/house/facade.jpg', flip:true, encoding:true });
    mat.facade.aoMap = phy.texture({ url:'./assets/textures/house/facade_ao.jpg', flip:true, encoding:true });
    mat.toiture.map = phy.texture({ url:'./assets/textures/house/roof.jpg', flip:true, encoding:true, repeat:[3,2] });
    mat.floor.map = phy.texture({ url:'./assets/textures/house/floor.jpg', flip:true, encoding:true });
    mat.jardin.map = phy.texture({ url:'./assets/textures/terrain/grass_c.jpg', flip:true, encoding:true, repeat:[16,16] });
    


    phy.add( scene )

    for(let m in mat){
        //mat.facade.vertexColors = false
        //mat[m].shadowSide = THREE.DoubleSide;
    }

    
    for(let m in mesh){
        mesh[m].receiveShadow = true;
        mesh[m].castShadow = true;
    }

    mesh.zone.castShadow = false;
    mesh.jardin.castShadow = false;
    mesh.glass.castShadow = false;
   
}

click = ( name ) => {

    switch(name){
        case 'Exterieur':
        mesh.level1.visible = true;
        mesh.level2.visible = true;
        mesh.Extern.visible = true;
        mesh.Facade.visible = true;
        break;
        case 'Niveau 1':
        mesh.level1.visible = true;
        mesh.level2.visible = false;
        mesh.Extern.visible = false;
        mesh.Facade.visible = false;
        break;
        case 'Niveau 2':
        mesh.level2.visible = true;
        mesh.level1.visible = false;
        mesh.Extern.visible = false;
        mesh.Facade.visible = false;
        break;
    }

}
