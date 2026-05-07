
const dt = [
	{name:'s0', impulse:[0,0,0] },
	{name:'s1', impulse:[0,0,0] },
	{name:'s2', impulse:[0,0,0] },
]

const setting = {
	floatingDis: 0.5,
	spring:2,
	damping:0.2,
}

let s0,s1,s2

demo = () => {

	phy.view({ distance:6, y:1 })

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
    s2 = phy.add({ ...def, name:'s2', size:[0.25], pos:[1,5,0], mass:50 })

    // ray
    phy.add({ name:'R0', type:'ray', parent:'s0', begin:[0,0,0], end:[0,-1, 0], callback:Y0, visible:true })
    phy.add({ name:'R1', type:'ray', parent:'s1', begin:[0,0,0], end:[0,-1, 0], callback:Y1, visible:true })
    phy.add({ name:'R2', type:'ray', parent:'s2', begin:[0,0,0], end:[0,-1, 0], callback:Y2, visible:true })

    phy.onStep = update;


}

update = ( delta ) => {

	phy.change(dt);
}

function Y0( r ){

	let d = 0

	if(r.hit){
		d = r.distance
		let dist = setting.floatingDis - d
		let floatingForce = ( setting.spring * dist ) - ( s0.velocity.y * setting.damping );

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
		let floatingForce = ( setting.spring * dist ) - ( s2.velocity.y * setting.damping );

		dt[2].impulse[1] = floatingForce * s2.mass

	} else {
		dt[2].impulse[1] = 0
	}

}

