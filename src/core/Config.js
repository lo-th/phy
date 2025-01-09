
export const Max = {
	body:4000,
    joint:1000,
    contact:4000,
    ray:100,
    character:100,
    vehicle:50,
    solver:20,
}

export const Num = {
	bodyFull:14,
    body:8,
    joint:16,
    contact:1,
    ray:11,
    character:16,
    vehicle:72,//max 8 wheels
    solver:128,
}


// Define how many body phy can manage

export const getArray = function ( engine, full = false ){

    const ArPos = {}

    let counts = {
        body: Max.body * ( full ? Num.bodyFull : Num.body ),
        joint: Max.joint * Num.joint,
        ray: Max.ray * Num.ray,
        contact: Max.contact * Num.contact,
        character: Max.character * Num.character
    }

    if( engine === 'PHYSX' || engine === 'AMMO' ){ 
        counts['vehicle'] = Max.vehicle * Num.vehicle;
    }

    if( engine === 'PHYSX' ){ 
        counts['solver'] = Max.solver * Num.solver;
    }

    if( engine === 'HAVOK' || engine === 'RAPIER' || engine === 'JOLT' ){ 
        Num.joint = 0;
    }

    let prev = 0;

    for( let m in counts ){ 

        ArPos[m] = prev;
        prev += counts[m];

    }

    ArPos['total'] = prev;

    return ArPos;

}


// Convert type for all engine

export const getType = function ( o ) {
    switch( o.type ){
        case 'plane': case 'box': case 'sphere': case 'highSphere': case 'customSphere': case 'cylinder': case 'stair':case 'particle':
        case 'cone': case 'capsule': case 'mesh': case 'convex': case 'compound': case 'null':
            //if ( ( !o.mass || !o.density ) && !o.kinematic ) return 'solid'
            if ( !o.mass && !o.density && !o.kinematic ) return 'solid'
            else return 'body'
        break;
        case 'fixe':
        case 'generic': case 'universal': case "dof": case "d6": 
        case 'hinge': case 'revolute': 
        case "prismatic": 
        case 'cylindrical': case 'slider':
        case 'spherical':
        case 'ragdoll': 
        case "distance":
            return 'joint'
        break;
        default: 
            return o.type;
        break;
    }
}