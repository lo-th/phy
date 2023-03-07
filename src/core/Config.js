export const Max = {
	body:2000,
    joint:100,
    contact:50,
    ray:50,
    character:50,
    vehicle:50,
    solver:20,
    //terrain:10,
}

export const Num = {
	bodyFull:14,
    body:8,
    joint:16,
    contact:8,
    ray:8,
    character:16,
    vehicle:72,//max 8 wheels
    solver:128,//256,
    //terrain:1,
}

export const getArray = function ( engine, full = false ){

    let ArPos = {}

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

    let prev = 0;

    for( let m in counts ){ 

        ArPos[m] = prev
        prev += counts[m]

    }

    ArPos['total'] = prev

    return ArPos

}

export const getType = function (o){
    switch(o.type){
        case 'plane': case 'box': case 'sphere': case 'highSphere': case 'cylinder': 
        case 'cone': case 'capsule': case 'mesh': case 'convex': case 'compound': case 'null':
        if ( !o.density && !o.kinematic ) return 'solid'
        else return 'body'
        break;
        default: 
            return o.type 
        break;
    }
}