let n = 1;
let gui = null;
let tmp = [];
const setting = { gravity:-9.81, auto:true, name:'exterieur' };
const list = [ 'exterieur', 'niveau 1', 'niveau 2' ];
let mesh;

demo = () => {

    phy.view({ theta:-25, distance:30, x:0, ground:false, envmap:'clear' });
    phy.set({ substep:1, gravity:[0,-9.81,0] });

    //phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false });
    phy.add({ type:'box', name:'floor', size:[ 100,1,100 ], pos:[0,-0.5,0], visible:false });

    // gui
    gui = phy.gui();
    
    gui.add( setting, 'name', { type:'grid', values:list, selectable:true, h:26 } ).listen().onChange( click )
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

    
    //mat.facade.vertexColors = false
    mat.facade.map = phy.texture({ url:'./assets/textures/facade.jpg', flip:true, encoding:true });
    mat.toiture.map = phy.texture({ url:'./assets/textures/roof.jpg', flip:true, encoding:true, repeat:[3,2] });
    mat.floor.map = phy.texture({ url:'./assets/textures/floor.jpg', flip:true, encoding:true });

    //mesh.Extern.visible = false



    phy.add( scene )

    //meshes.mur.material.map = phy.texture({ url:'./assets/textures/facade.jpg', flip:true, encoding:true });
    /*meshes.wood_floor.material.roughness = 0.5;
    //meshes.wood_floor.material.shadowSide = THREE.DoubleSide;
    //console.log(meshes.wood_floor.material)
    data.wood.mesh = meshes.wood_floor;
    data.wall.mesh = meshes.wood_wall;
    data.stone.mesh = meshes.stone;

    

    run();*/

    
   /* for(let m in mesh){
        mesh[m].receiveShadow = true;
        mesh[m].castShadow = true;
    }

    mesh.zone.castShadow = false;
    mesh.jardin.castShadow = false;
    mesh.glass.castShadow = false;
   */
}

click = ( name ) => {

    switch(name){
        case 'exterieur':
        mesh.level1.visible = true;
        mesh.level2.visible = true;
        mesh.Extern.visible = true;
        mesh.Facade.visible = true;
        break;
        case 'niveau 1':
        mesh.level1.visible = true;
        mesh.level2.visible = false;
        mesh.Extern.visible = false;
        mesh.Facade.visible = false;
        break;
        case 'niveau 2':
        mesh.level2.visible = true;
        mesh.level1.visible = false;
        mesh.Extern.visible = false;
        mesh.Facade.visible = false;
        break;
    }



    

}
