let deltaTime = 0
const dt = [
	{name:'s0', impulse:[0,0,0] },
	{name:'s1', impulse:[0,0,0] },
	{name:'s2', impulse:[0,0,0] },
	{name:'s3', impulse:[0,0,0] },
]

const setting = {
	floatingDis: 0.5,
	spring:2,
	damping:0.2,
}

let s0,s1,s2, s3

demo = () => {

	phy.view({ distance:4, y:1, phi:20, theta:-30 })

	// config physics setting
    phy.set({ substep:1, gravity:[0,-9.81,0], fps:60, fixe:true })
    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })

    const def = {
    	type:'sphere',
    	angularFactor:[0,0,0],
    	material:'glass',
    	getVelocity:true
    }

    if(phy.engine === 'HAVOK') def['inertia'] = [0,0,0]

    s0 = phy.add({ ...def, name:'s0', size:[0.25], pos:[-1,5,0], mass:1 })
    s1 = phy.add({ ...def, name:'s1', size:[0.25], pos:[0,5,0], mass:20 })
    s2 = phy.add({ ...def, type:'capsule', name:'s2', size:[0.25, 0.5], pos:[1,5,0], mass:50 })
    s3 = phy.add({ ...def, type:'compound', name:'s3', shapes:[{ type:'sphere', pos:[0,-0.25,0], size:[ 0.25 ] }, { type:'sphere', pos:[0,0.25,0], size:[ 0.25 ] }], pos:[0,5,1], mass:50 })

    // ray
    phy.add({ name:'R0', type:'ray', parent:'s0', begin:[0,0,0], end:[0,-1, 0], callback:Y0, visible:true })
    phy.add({ name:'R1', type:'ray', parent:'s1', begin:[0,0,0], end:[0,-1, 0], callback:Y1, visible:true })
    phy.add({ name:'R2', type:'ray', parent:'s2', begin:[0,-0.25,0], end:[0,-1, 0], callback:Y2, visible:true })
    phy.add({ name:'R3', type:'ray', parent:'s3', begin:[0,-0.25,0], end:[0,-1, 0], callback:Y3, visible:true })

    phy.add({ type:'box', name:'A', size:[0.5,0.5,0.5], pos:[-1,3,-2], mass:1, gravityScale:0.04 });
    phy.add({ type:'box', name:'B', size:[0.5,0.5,0.5], pos:[0,3,-2], mass:10, gravityScale:0.1 });
    phy.add({ type:'box', name:'C', size:[0.5,0.5,0.5], pos:[1,3,-2], mass:100, gravityScale:3 });

    phy.onStep = update;
    addGui()


}
const addGui = () => {

    gui = phy.gui();
    gui.add( 'bool', { name:'size', value:false, radius:12 }).onChange( changeSize )
}

const changeSize = (b) => {

	const def = {
    	type:'capsule',
    	angularFactor:[0,0,0],
    	material:'glass',
    	getVelocity:true
    }

    if(phy.engine === 'HAVOK') def['inertia'] = [0,0,0]

    s2 = phy.add({ ...def, name:'s2', size:[0.25, b?0.2:0.5], pos:s2.position.toArray(), mass:50 })

    phy.change({name:'s3', editShape:[{pos:[0,-0.25,0]}, {pos:[0,b?0.0:0.25,0]}] })

}

update = ( delta ) => {
	deltaTime = delta
	phy.change(dt);
}

function Y0( r ){

	let d = 0

	if(r.hit){
		d = r.distance
		let dist = setting.floatingDis - d
		//let f = math.lerp(0.1, 0, pos.y)
		//let floatingForce = ( setting.spring * dist ) - ( s0.velocity.y * setting.damping );
		let vv = (-dist)
		if(vv<0) vv = 0
		
		let floatingForce = ( (2+vv) * dist ) - ( s0.velocity.y * (0.5-vv) );
		//phy.log(floatingForce + ' '+ s0.velocity.y)
		phy.log(dist)

		dt[0].impulse[1] = floatingForce * s0.mass

	} else {
		dt[0].impulse[1] = 0
	}

}

function Y1( r ){

    let d = 0

	if(r.hit){

		d = r.distance
		let dist = setting.floatingDis - d
		let floatingForce = ( setting.spring * dist ) - ( s1.velocity.y * setting.damping );

		dt[1].impulse[1] = floatingForce * s1.mass

	} else {
		dt[1].impulse[1] = 0
	}

}

function Y2( r ){

    let d = 0

	if(r.hit){

		d = r.distance
		let dist = setting.floatingDis - d
		//if(dist<=0) return

		//let t = 1.0 / 60.0;
		//floatingForce = dist/deltaTime
		let floatingForce = ( setting.spring * dist ) - ( s2.velocity.y * setting.damping );

		dt[2].impulse[1] = floatingForce * s2.mass

	} else {
		dt[2].impulse[1] = 0
	}

}

function Y3( r ){

    let d = 0

	if(r.hit){

		d = r.distance
		let dist = setting.floatingDis - d
		//if(dist<=0) return

		//let t = 1.0 / 60.0;
		//floatingForce = dist/deltaTime
		let floatingForce = ( setting.spring * dist ) - ( s3.velocity.y * setting.damping );

		dt[3].impulse[1] = floatingForce * s3.mass

	} else {
		dt[3].impulse[1] = 0
	}

}