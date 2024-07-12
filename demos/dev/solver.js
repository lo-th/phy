//https://github.com/NVIDIAGameWorks/PhysX/blob/4.1/physx/snippets/snippetarticulation/SnippetArticulation.cpp
// PHYSX LIB PREVIEW
//http://wasm.continuation-labs.com/tmp/robotify/physx-wasm-snippets/

let gClosing = true;
let driveValue = 0;

demo = () => {

	//phy.moveCam({ h:9, v:20, d:40, target:[0,15,0] });
	//phy.moveCam({ h:90, v:10, d:10, target:[0,3,0], time:0 });

    phy.set({

        //filter:'bullet',
        fps:60,
        substep:1,
        gravity:[0,-9.81,0],

    })

    phy.add({ type:'plane', friction: 0.5, restitution:0 });

    //phy.setBullet( { bulletSize:0.25, bulletdensity:1, bulletSpeed:100 } )


    createLongChain();
    //createScissorLift();

    //createSimpleChain();

    /*setTimeout( ()=>{
    	phy.remove('longChain')
    	phy.remove('scissor')
    	console.log('yo');
    }, 4000)*/

    // update after physic step
    phy.setPostUpdate( update )

}

update = () => {

	dt = 1 / 60;

	if ( gClosing && driveValue < -1.2 ) gClosing = false;
	else if( !gClosing && driveValue > 0 ) gClosing = true;

	if( gClosing ) driveValue -= dt*0.25; 
	else driveValue += dt*0.25;

	//phy.change( { name:'driveJoint', drivesTarget:[[ 'z', driveValue ]] } );

}


createSimpleChain = () => {

	let solver = phy.add({ 
		type:'solver', 
		name:'simpleChain',
		iteration:16,  
		fix:true,
	});

	phy.add({ 
			//type:'capsule',
			type:'box',  
			name:'one', 
			pos:[0,0.5,0], 
			//size:[ (halfHeight*2)+radius*2, radius , radius ], 
			size:[ 1,1,1 ],
			//size:[ radius, (halfHeight*2) ], 
			mass:1,
			solver:'simpleChain', linked: 'null', 
		});


}

//----- 

createLongChain = () => {

	let pz = 5;

    let overlappingLinks = false;	// Change this for another kind of rope
    let useReducer = true; // if false need desactivate solver tgs

	let scale = 0.25;
	let radius = 0.5*scale;
	let halfHeight = 1.0*scale;
	let nbCapsules = 50;
	let capsuleMass = 1//.0;

	let solver = phy.add({ 
		type:'solver', 
		name:'longChain', //reduced:useReducer,
		iteration:8, 
		fix:false,
		neverSleep:true,
		//velocityIteration:1,
		//tolerance:0.001, projectionIteration:16, stabilization:100, 
		//maxAngular:30,
		//maxLinear:100,
		 });

	let pos = [0, nbCapsules*radius*2, 0];

	//phy.add({ type:'capsule', name:'base', pos:[0, 0.25, 0], size:[ radius, halfHeight, halfHeight ], density:1, solver:'longChain', linked:'null' });

	let firstLink = null;
	let parent = null;

	//let pos1 = [0.0,-radius, 0.0];
	//let pos2 = [0.0,radius,  0.0];

	let pos1 = [0.0,0.0, 0.0];
	let pos2 = [0.0,radius*2,  0.0];

	const stiffness = 10;
    const damping = 10;
    const forceLimit = 100//Infinity;
    const acceleration = true;

	

	// Create rope
	for (let i=0; i<nbCapsules; i++){


		let link = phy.add({ 
			//type:'capsule',
			//type:'box',  
			type:'sphere', 
			name:'cc_' + i, 
			pos:pos, 
			penetrationVelocity:3,
			size:[ radius ],
			//group:16,
			//mask:1|2,
			//size:[ radius, (halfHeight*2) ], 
			mass:capsuleMass,
			//dmv:[0.1,0.1,100,30], 
			//linearDamping:0.1, angularDamping:0.1, 
			maxLinearVelocity:100, maxAngularVelocity:30,
			solver:'longChain', linked:!parent ? 'null' : parent.name, 
		});

		if (!firstLink) firstLink = link;

		if(i>0){

			solver.addJoint({ 
				type:'spherical', 
				bone:link.name, 
				pos1:pos1, 
				pos2:pos2,
				rot1:[-90,0,0], rot2:[-90,0,0], 
				//motions:[['swing1', 'limited'],['swing2', 'limited']],
				limits:[['swing1', -90, 90 ], ['swing2', -90, 90 ]],
				//motions:[['twist', 'locked'],['swing1', 'free'],['swing2', 'free']],
				drives: [['swing1', stiffness, damping, forceLimit, acceleration ], ['swing2', stiffness, damping, forceLimit, acceleration ]],
				frictionCoefficient:0.3,// def 0.05
				maxJointVelocity:10//def 100
			});

		}

		pos[1] += radius * 2.0;

		parent = link;

	}

	solver.start();
	phy.add({type:'box', name:'boxblock', size:[2, 1, 4], pos:[2, 0.5, 0],mass:10 })
return
	//Attach large & heavy box at the end of the rope

	let boxdensity = 1.0;
	let boxSize = 0.5;

	pos[0] -= (radius + halfHeight) * 2.0;
	pos[0] += (radius + halfHeight) + boxSize;

	let link = phy.add({ 
		type:'box', name:'cc_box', 
		pos:pos, size:[ boxSize*2 ], 
		density:boxdensity, 
		penetrationVelocity:3,
		dmv:[0.1,0.1,100,30],
		linearDamping:0.1, angularDamping:0.1, 
		maxLinearVelocity:100, maxAngularVelocity:30,
		solver:'longChain', linked:parent.name,
	});

	if( useReducer ){
		solver.addJoint({ 
			type:'spherical', bone:link.name, 
			pos1:[radius + halfHeight, 0.0, 0.0], pos2:[-boxSize, 0, 0],
			motions:[['swing1', 'limited'],['swing2', 'limited']],
			limits:[['swing1', -90, 90 ], ['swing2', -90, 90 ]],
			//motions:[['swing1', 'free'],['swing2', 'free'], ['twist', 'free']],
			//frictionCoefficient:1.0,
			//maxJointVelocity:1000//1000000,
		});
	} else {
		solver.addJoint({ 
			type:'spherical', bone:link.name, 
			pos1:pos1, pos2:pos2,
		});
	}


	/*if( !useReducer ){

		phy.add({type:'sphere', name:'ballfix', size:[0.05], pos:[0, 24, pz] });
	    phy.add({type:'joint', jointType:'spherical', b1:'ballfix', b2:'cc_0', collision:false });

	}*/
	

	// Create obstacle
	phy.add({type:'box', name:'boxblock', size:[2, 1, 4], pos:[10, 24-3, pz] })




	solver.start();




}

createScissorLift = () => {

	const solver = phy.add({ type:'solver', name:'scissor', iteration:8, fix:false, needData:true, neverSleep:true });//32



	let runnerLength = 2.0;
	let placementDistance = 1.8;

	let cosAng = placementDistance / runnerLength;

	let angle = Math.acos( cosAng );
	let sinAng = Math.sin( angle );

	let angleDeg = angle * (180 / Math.PI)

	let leftRot = math.quatFromAxis( [ 1, 0, 0], -angle );//math.axisToQuatArray( [ -angle, 1, 0, 0] );
	let rightRot = math.quatFromAxis( [ 1, 0, 0], angle );//math.axisToQuatArray( [ angle, 1, 0, 0] );

	//(1) Create base...
	phy.add({ type:'box', name:'base', pos:[0, 0.25, 0], size:[ 0.5*2, 0.2*2, 1.5*2 ], density:3, solver:'scissor', linked:'null', filter:[1,-1,1,0], dmv:[0.2,0.2,100,20] });

	let leftRoot = phy.add({ type:'box', name:'leftRoot', pos:[0, 0.55, -0.9], size:[ 0.5*2, 0.05*2, 0.05*2 ], density:1, solver:'scissor', linked:'base', filter:[0,0,1,0], dmv:[0.2,0.2,100,20] });
	let rightRoot = phy.add({ type:'box', name:'rightRoot', pos:[0, 0.55, 0.9], size:[ 0.5*2, 0.05*2, 0.05*2 ], density:1, solver:'scissor', linked:'base', filter:[0,0,1,0], dmv:[0.2,0.2,100,20] });


	solver.addJoint( { type:'fix', bone:'leftRoot', pos1:[0, 0.25, -0.9], pos2:[ 0, -0.05, 0 ] } );
	solver.addJoint( { name:'driveJoint', type:'prismatic', bone:'rightRoot', pos1:[0, 0.25, 0.9], pos2:[ 0, -0.05, 0 ], motions:[['z', 'limited']], limits:[['z', -1.4, 0.2 ]], drives:[['z', 100000, 0, Infinity, true ]] } );


	let linkHeight = 3;
	let pp = [];

	let ppL = [];
	let ppR = [];
	let pl = []

	let sph = new THREE.Mesh( new THREE.SphereGeometry(0.05) );
	//let sph = new THREE.Mesh( new THREE.BoxBufferGeometry(0.1,0.1,0.1) );
	

	let currLeft, currRight, leftLink, rightLink, leftParentRot, rightParentRot;
	let currPosL, currQL;
	let currPosR, currQR;

    for (let j=0; j < 2; ++j){

    	currLeft = leftRoot;
    	currRight = rightRoot;

    	currPosL=[0, 0.55, -0.9];
    	currQL=[0,0,0,1];
    	currPosR=[0, 0.55, 0.9];
    	currQR=[0,0,0,1];

    	leftParentRot = [0,0,0,1];  
    	rightParentRot = [0,0,0,1];

		for ( let i=0; i < linkHeight; ++i ){

			let pos = [ j===0 ? 0.5 : -0.5, 0.55 + 0.1*(1+i), 0];

			ppL = [ pos[0], pos[1] + sinAng*(2 * i + 1) , pos[2] ];

			leftLink = phy.add({ type:'box', name:'leftLink'+i+'_'+j, pos:ppL, quat:leftRot, size:[ 0.05*2, 0.05*2, 1*2 ], mass:1, solver:'scissor', linked: currLeft.name, filter:[0,0,1,0], dmv:[0.2,0.2,100,20] });

			let leftAnchorLocation = math.fromTransform( currPosL, currQL, [ pos[0], pos[1]+sinAng*(2 * i), pos[2]-0.9 ], [0,0,0,1], true );

			let sppp = sph.clone();
			sppp.position.fromArray(leftAnchorLocation)
			leftLink.add(sppp)

			solver.addJoint( { 
				type:'revolute', bone:leftLink.name, 
				pos1:leftAnchorLocation, quat1:leftParentRot, 
				pos2:[ 0, 0, -1 ], quat2:rightRot,  
				motions:[['twist', 'limited']], limits:[['twist', -180, angleDeg ]],
				noFix:true 
			});

			leftParentRot = leftRot;

			ppR = [ pos[0], pos[1] + sinAng*(2 * i + 1) , pos[2] ];

			rightLink = phy.add({ type:'box', name:'rightLink'+i+'_'+j, pos:ppR, quat:rightRot, size:[ 0.05*2, 0.05*2, 1*2 ], mass:1, solver:'scissor', linked: currRight.name, filter:[0,0,1,0], dmv:[0.2,0.2,100,20] });

			let rightAnchorLocation = math.fromTransform( currPosR, currQR, [ pos[0], pos[1]+sinAng*(2 * i), pos[2]+0.9 ], [0,0,0,1], true );

			sppp = sph.clone();
			sppp.position.fromArray( rightAnchorLocation )
			rightLink.add(sppp)

			solver.addJoint( { 
				type:'revolute', bone:rightLink.name, 
				pos1:rightAnchorLocation, quat1:rightParentRot,
				pos2:[ 0, 0, 1 ],  quat2:leftRot, 
				motions:[['twist', 'limited']], limits:[['twist', -angleDeg, 180 ]],
				noFix:true
			});

			rightParentRot = rightRot;

			phy.add({ 
		        type:'joint', mode:'d6', 
		        b1:leftLink.name, b2:rightLink.name, 
		        motions:[ ['swing1', 'free'], ['swing2', 'free'], ['twist', 'free'] ],
		        noFix:true
		    });

			currLeft = rightLink;
			currRight = leftLink;

			currPosL=ppR;
			currQL=rightRot;
			currPosR=ppL;
			currQR=leftRot;

		}

		if( j === 0 ){

			pl = math.fromTransform( ppR, rightRot, [ -0.5, 0 ,-1 ] );
			let pr = math.fromTransform( ppL, leftRot, [ -0.5, 0 , 1 ] );

			let ql = math.fromTransformToQ( ppR, rightRot, true );
			let qr = math.fromTransformToQ( ppL, leftRot, true );

			let ql2 = math.fromTransformToQ( pl, leftParentRot, true );
			let qr2 = math.fromTransformToQ( pr, rightParentRot, true );

			phy.add({ type:'box', name:'leftTop', pos:pl, quat:leftParentRot, size:[ 0.5*2, 0.05*2, 0.05*2 ], mass:1, solver:'scissor', linked: currLeft.name, filter:[0,0,1,0],dmv:[0.2,0.2,100,20] });
			//phy.add({ type:'box', name:'rightTop', pos:pr, quat:rightParentRot, size:[ 0.8*2, 0.05*2, 0.05*2 ], density:1, solver:'scissor', linked: currRight.name, filter:[1,-1,1,0],dmv:[0.2,0.2,100,20] });
			phy.add({ type:'capsule', name:'rightTop', pos:pr, quat:rightParentRot, size:[ 0.05, 0.8*2 ], mass:1, solver:'scissor', linked: currRight.name, filter:[1,-1,1,0],dmv:[0.2,0.2,100,20] });

			solver.addJoint( { type:'revolute', bone:'leftTop', pos1:[ 0, 0, -1 ], pos2:[ 0.5, 0, 0 ], quat1:ql, quat2:ql2, motions:[['twist', 'free']], noFix:true } );
			solver.addJoint( { type:'revolute', bone:'rightTop', pos1:[ 0, 0, 1 ], pos2:[ 0.5, 0, 0 ], quat1:qr, quat2:qr2, motions:[['twist', 'free']], noFix:true } );

		}

	}

	phy.add({ 
        type:'joint', mode:'d6', 
        b1:currLeft.name, b2:'leftTop', 
        pos1:[ 0, 0, -1 ], pos2:[ -0.5, 0, 0 ],
        motions:[ ['swing1', 'free'], ['swing2', 'free'], ['twist', 'free'] ],
        noFix:true
    });

    phy.add({ 
        type:'joint', mode:'d6', 
        b1:currRight.name, b2:'rightTop', 
        pos1:[ 0, 0, 1 ], pos2:[ -0.5, 0, 0 ],
        motions:[ ['swing1', 'free'], ['swing2', 'free'], ['twist', 'free'] ],
        noFix:true
    });

    phy.add({ type:'box', name:'top', pos:[0, pl[1]+0.15, 0 ], size:[ 0.5*2, 0.1*2, 1.5*2 ], mass:1, solver:'scissor', linked:'leftTop', filter:[1,-1,1,0],dmv:[0.2,0.2,100,20] });
    solver.addJoint( { type:'fix', bone:'top', pos1:[ 0, 0, 0 ], pos2:[ 0, -0.15, -0.9 ] } );

    //

    // add box

    pp = [
		[-0.25, 4.5, 0.5],
		[0.25, 4.5, 0.5],
		[-0.25, 5, 0.5],
		[0.25, 5, 0.5],
		[-0.25, 4.5, 0],
		[0.25, 4.5, 0],
		[-0.25, 5, 0],
		[0.25, 5, 0],
    ]

    i = 8;
    while(i--){
    	phy.add({ 
	        type:'box', name:'box'+i, 
	        pos:pp[i], size:[ 0.49 ],
	        mass:0.5,
	    });
    }

	solver.start();

	//console.log(solver)

}