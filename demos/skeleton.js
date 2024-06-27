let avatar, eva, bb, ba, bc
let mode = 'follow'
//let type = 'hero'
let debug = false

const setting = { 
	ragdoll:false,
	debug:false,
	name:'hero',
	height:1.8,
};

let modelList = ['hero', 'eva', 'lee', 'simple'];
let listN = modelList.indexOf( setting.name );

demo = () => {

	phy.log( '> Use keyboad to move' );

	phy.view({ envmap:'box', phi:0, theta:0, distance:4, x:0, y:1.0, z:0, fov:45, envblur:0.25 });

	phy.set({ substep:1, gravity:[0,-9.81,0] });

	phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], visible:false, friction: 0.5 });
	
	phy.load( ['./assets/models/skeleton_deco.glb'], onComplete );

}

const onComplete = () => {

	let deco = phy.getMesh('skeleton_deco');

	phy.add({ type:'box', name:'wall', pos:[0,1.5,-1.5], size:[ 5,3,1.0 ], friction: 0.5, mesh:deco.wall, material:'concrete' });

	// buttons
	bb = phy.addButton({ type:'box', pos:[1.0, 1.2,-1.05], size:[0.4,0.2,0.1], radius:0.02, callback:switchMode, text:mode, axe:2, material:'black' });
    ba = phy.addButton({ type:'box', pos:[1.0, 1.5,-1.05], size:[0.4,0.2,0.1], radius:0.02, callback:switchModel, text:setting.name, axe:2, material:'black' });
    bc = phy.addButton({ type:'box', pos:[1.0, 1.8,-1.05], size:[0.4,0.2,0.1], radius:0.02, callback:switchDebug, text:'debug',  axe:2, material:'black' });

    //let k = 200
	//while(k--) phy.add({type:'sphere', pos:[math.rand(-5,5), 2, math.rand(-5,5)], size:[math.rand(0.1,0.3)], density:1, mask:2})

	addModel( setting.name );
	addGui()

}

const addModel = ( type ) => {

	if( avatar ){
		phy.control( '' );
		mode = 'follow';
		bb.txt.set( mode );
        phy.remove( 'avatar' );
    }

	let n = type === 'eva' ? math.randInt(0,2) : math.randInt(0,1);

	let gender = type;
	switch(type){
		case 'eva': gender = 'eva0'+n; break
		case 'hero': gender = n === 1 ? 'woman' : 'man'; break
		case 'simple': gender = n === 1 ? 'woman_low' : 'man_low'; break
	}

    avatar = phy.add({ 
        type:'character',
        name:'avatar',
        gender:gender,
        callback:done,
        mask:2,
        noLOD:true,
 //height: 3,
        //useImpulse:true,
        //floating:true,
    })



}

const addGui = () => {
	gui = phy.gui();
	gui.add( setting, 'ragdoll', { } ).onChange( (b)=>{
		avatar.setMode( b ? 'ragdoll':'follow' );
		phy.control( b ? '' : 'avatar' );
	} );
	gui.add( setting, 'debug', { } ).onChange( (b)=>{avatar.debugMode(b)} );
	gui.add( setting, 'height', { min:0.1, max:4.0} ).onChange( (v)=>{avatar.model.setRealSize(v)} );
	gui.add( setting, 'name', { type:'button', values:modelList, selectable:true, h:26, p:0 } ).onChange( addModel );
    /*gui.add( setting, 'auto' ).onChange( (v) => { 
        b1.skeletonBody.setMode(v ? 'ragdoll':'follow' );
        b2.skeletonBody.setMode(v ? 'ragdoll':'follow' );
        b3.skeletonBody.setMode(v ? 'ragdoll':'follow' );
    })
    gui.add( setting, 'gravity', { min:-10, max:10, mode:2 } ).onChange( (v) => { phy.setGravity([0,v,0]) } )*/
}

const done = () => {

	avatar.addSkeleton();
	//avatar.model.setRealSize(3)
	//avatar.debugMode( debug )

	phy.control( 'avatar' );

}


// button fonction

const switchModel = () => { 

	listN++
	if( listN>=modelList.length ) listN=0

	let type = modelList[listN];

	ba.txt.set( type );
	setting.name = type;
    debug = false;

	addModel( type );
    
}

const switchMode = () => { 

	if( mode === 'follow' ) mode = 'ragdoll'
	else if ( mode === 'ragdoll' ) mode = 'follow'

	bb.txt.set( mode );
    avatar.setMode( mode );
    phy.control( mode === 'follow' ? 'avatar' : '' );

}

const switchDebug = () => { 

	if( debug ) debug = false;
	else debug = true;
    avatar.debugMode( debug );

}