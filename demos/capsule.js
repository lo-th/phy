function demo() {

    // config physics setting
    phy.set( { substep:1, gravity:[0,-9.81,0] });

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false });

    // box container
    let h = 5, w = 0.2, l = 16, d = 16
    phy.add({type:'box', pos:[d*0.5,h*0.5,0], size:[w,h, l+w], visible:false})
    phy.add({type:'box', pos:[-d*0.5,h*0.5,0], size:[w,h, l+w], visible:false})
    phy.add({type:'box', pos:[0,h*0.5,l*0.5], size:[d-w,h, w], visible:false})
    phy.add({type:'box', pos:[0,h*0.5,-l*0.5], size:[d-w,h, w], visible:false})
    phy.add({ type:'box', pos:[0,-w*0.5,0], size:[d+w,w,l+w], visible:false })

    phy.load( ['./assets/textures/inside.jpg', './assets/textures/outside.png', './assets/textures/outside_n.jpg'], onComplete )

}

function onComplete(){

	const mats = []

	mats[0] = new Building({
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
	})


	// add dynamic capsule
    let i = 200;
    
    while(i--){
        
        phy.add({ 
        	type:'capsule', 
        	size:[ math.rand( 0.2, 0.5 ), 0.75], 
        	pos:[ math.rand( -3, 3 ),5+(i*0.5),  math.rand( -2, 2 )], 
        	material:mats[ math.randInt(0,2)],
        	friction:0.5,
        	density:1,
        	massCenter:[ 0,-0.75, 0 ],
        });

    }

}