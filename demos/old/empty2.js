demo = () => {

    phy.view({
        envmap:0x8aa4b8,
        ground:true
    })

    /*const g = phy.getBodyRef().geometry({type:'capsule',size:[ 0.5, 0.75]})
    const material = new THREE.MeshStandardMaterial( { } );

    material.onBeforeCompile = function (shader){
        console.log('onBeforeCompile')
    }
    material.onBuild = function (){
        console.log('build')
    }

    const mesh = new THREE.Mesh(g, material)
    mesh.position.y = 0.5
    phy.getScene().add(mesh)*/



      //1. Create a new function that returns a promise
    /*function firstFunction() {
      return new Promise((resolve, reject) => {
          let y = 0
          setTimeout(() => {
            for (i=0; i<10; i++) {
               y++
            }
             console.log('Loop completed.')  
             resolve(y)
          }, 2000)
      })
    }
    
    //2. Create an async function
    async function secondFunction() {
        console.log('Before promise call.')
        //3. Await for the first function to complete
        const result = await firstFunction()
        console.log('Promise resolved: ' + result)
        console.log('Next step.')
    }; 

    secondFunction()*/


    // config physics setting
    //phy.add({ type:'plane', visible:false });


    //phy.add({ type:'box', size:[10,0.1,10], pos:[0,-3,0], density:0 });
    /*// add static plane 
    

    

   
    phy.add({ type:'sphere', size:[1], pos:[0,8,0], rot:[45,45,0], density:1 });*/
// phy.add({ type:'box', size:[1,1,1], pos:[0,5,0], rot:[45,45,0], density:1 });
 // phy.add({ type:'box', size:[1,1,1], pos:[0,20,0], rot:[45,45,0], density:1 });

}
