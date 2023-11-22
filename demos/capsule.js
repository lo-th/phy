const num = 100
const capsules = []
const temp = []
const setting = {
  recovery:10,//10,
  wobbleSpeed: 0.1,//0.1,
  maxWobble: 0.03,//0.03
}

demo = () => {

	phy.view({
        envmap:'basic',
        ground:true
    })

    // config physics setting
    phy.set( { full:true, substep:1, gravity:[0,-9.81,0] });

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false });

    onComplete()

    //phy.setTimeout( onComplete, 10000 )

    // box container
    /*let h = 5, w = 0.2, l = 16, d = 16
    phy.add({type:'box', pos:[d*0.5,h*0.5,0], size:[w,h, l+w], visible:false})
    phy.add({type:'box', pos:[-d*0.5,h*0.5,0], size:[w,h, l+w], visible:false})
    phy.add({type:'box', pos:[0,h*0.5,l*0.5], size:[d-w,h, w], visible:false})
    phy.add({type:'box', pos:[0,h*0.5,-l*0.5], size:[d-w,h, w], visible:false})
    phy.add({ type:'box', pos:[0,-w*0.5,0], size:[d+w,w,l+w], visible:false })

    phy.load( ['./assets/textures/inside.jpg', './assets/textures/outside.png', './assets/textures/outside_n.jpg'], onComplete )
*/
}

onComplete = () => {


	//mats[0] = Liquid



	let g = phy.getBodyRef().geometry({type:'capsule',size:[ 0.5, 0.75]})

	/*const material = new THREE.MeshStandardMaterial( { } );

				material.onBeforeCompile = function (shader){
					console.log('onBeforeCompile')
				}
				material.onBuild = function (){
					console.log('build')
				}*/

	const mats = new Fluid({
            color: 0xffffff,
            name: 'fluid33',
            fillAmount : -0.5 //+ 0.75
        },{
		geometry:g
	})



	/*let t = new THREE.Mesh(g, material)
	phy.getScene().add(t)
return*/
	//mats.modif()

	/*mats[0] = new Building({
		name:'build1',
		map: phy.getMap( 'outside', {encoding:true, flip:true} ),
		normalMap: phy.getMap( 'outside_n', {encoding:true, flip:true})
	},{
		insideMap:phy.getMap( 'inside', {encoding:true, flip:true} ),
		freq:[4,6,4],
	})

	mats[1] = new Building({
		name:'build2',
		map: phy.getMap( 'outside', {encoding:true, flip:true} ),
		normalMap: phy.getMap( 'outside_n', {encoding:true, flip:true})
	},{
		insideMap:phy.getMap( 'inside', {encoding:true, flip:true} ),
		freq:[2,4,2],
	})

	mats[2] = new Building({
		name:'build3',
		map: phy.getMap( 'outside', {encoding:true, flip:true} ),
		normalMap: phy.getMap( 'outside_n', {encoding:true, flip:true})
	},{
		insideMap:phy.getMap( 'inside', {encoding:true, flip:true} ),
		freq:[1,6,2],
		time:100
	})*/


	// add dynamic capsule
    let i = num;
    
    while(i--){

    	let m = math.randInt( 0, 1 )
        
        capsules[i] = phy.add({ 
        	//auto:true,
        	instance:'capsuleBase',
        	type:'capsule', 
        	size:[ 0.5, 0.75], //math.rand( 0.2, 0.5 )
        	//size:[ 2, 0.75],
        	pos:[ math.rand( -3, 3 ),5+(i*0.5),  math.rand( -2, 2 )], 
        	material:mats,
        	//material: m===1 ? 'debug' : 'body',
        	friction:0.5,
        	density:1,
        	//angularFactor:[0,1,0],
        	massCenter:[ 0,-0.75, 0 ],
        	//localPos:[ 0,0.75, 0 ],
        });

        temp[i] = [0,0]

    }

    //console.log( capsules )

    // update after physic step
    phy.setPostUpdate ( update )

}


update = () => {

	const delta = phy.getDelta()
	const time = phy.getElapsedTime()

	const s = setting

	let i = num, c, instance = capsules[0].instance;
	let wx, wz, py

	let pulse = 2 * Math.PI * s.wobbleSpeed;

    while(i--){
    	c = capsules[i]
    	temp[i][0] = math.lerp( temp[i][0], 0, delta * s.recovery )
    	temp[i][1] = math.lerp( temp[i][1], 0, delta * s.recovery )
    	wx = temp[i][0] * Math.sin(pulse * time)
    	wz = temp[i][1] * Math.cos(pulse * time)

    	py = c.position.y
    	if(engine!=='PHYSX') py += 0.75

    	instance.setColorAt( c.id, [wx, py, wz])

    	temp[i][0] = math.clamp( (c.velocity.x + c.angular.z * 0.2) * s.maxWobble , -s.maxWobble, s.maxWobble )
    	temp[i][1] = math.clamp( (c.velocity.z + c.angular.x * 0.2) * s.maxWobble , -s.maxWobble, s.maxWobble )

    	//if(i===0)console.log(c.velocity.x , c.angular.z)
    }

    const shader = instance.material.userData.shader;
    if ( shader ) {
    	//shader.uniforms.time.value = phy.getDelta();
    }

}


