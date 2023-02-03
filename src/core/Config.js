export const Max = {
	body:2000,
    joint:100,
    contact:50,
    ray:50,
    character:20,
    vehicle:20,
    solver:20,
}

export const Num = {
	bodyFull:14,
    body:8,
    joint:16,
    contact:8,
    ray:8,
    character:16,
    vehicle:64,
    solver:256,
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