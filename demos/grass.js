let g

function demo() {

    phy.view({
        envmap:"swiss",
        fogexp:0.03,
        //ground:false,
        vignette:false,
        //shadow:0,
        reflect:0,
        //jointVisible:true, 
    })


    phy.set({ 
        substep:1,
    })

    
    g = phy.addGrass()

    phy.setRenderUpdate( update )


}

function update(delta){

    const shader = g.mesh.material.userData.shader;
    if(shader){
        shader.uniforms.time.value += delta;
    }

}