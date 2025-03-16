demo = () => {

    // config environement
    phy.view({ envmap:'clear' })

    // config physics setting
    phy.set( {substep:1, gravity:[0,0,0]})


    // add static ground
    phy.add({ type:'box', size:[200,2,200], pos:[0,-1,0], visible:false })

    

    phy.load( ['models/blob.glb'], onComplete, './assets/' );

}

onComplete = () => {

    const models = phy.getMesh('blob');
    addBlob( models.blob );


}

addBlob = ( model ) => {

    const mesh = model.clone()
    const skeleton = mesh.skeleton;
    skeleton.scalled = true;

    let num = 10, s = 1,  bone, node;

    phy.add( mesh )

    for ( let i = 0; i < num; i++) {
        bone = skeleton.getBoneByName('Bone_' + i)
        console.log(bone, skeleton)
       // bone.isPhysics = false;
       // bone.phyMtx = new THREE.Matrix4();
       // bone.updateMatrixWorld( true )

    }

}