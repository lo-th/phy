export const Version = {
    
    PHY: '0.13.1',
    // best
    PHYSX: '5.06.10',
    HAVOK: '1.3.11',
    // young
    JOLT: '0.39.0',
    RAPIER: '0.20.0',
    // old
    OIMO: '1.2.4',
    AMMO: '3.2.6',

}

export const EnginSkill = {
    PHYSX: {c:'rgba(125,201,0,0.5)',   speed:0.9, option:1.0, precision:0.9, collision:0.9, constraint:1.0, vehicle:1.0 },
    HAVOK: {c:'rgba(255,187,0,0.5)',   speed:1.0, option:0.9, precision:1.0, collision:1.0, constraint:1.0, vehicle:0.5 },
    JOLT:  {c:'rgba(22,147,197,0.5)',  speed:0.6, option:0.9, precision:0.8, collision:0.2, constraint:0.6, vehicle:0.7 },
    RAPIER:{c:'rgba(168,251,194,0.5)', speed:0.6, option:0.8, precision:0.9, collision:0.8, constraint:0.7, vehicle:0.2 },
    AMMO : {c:'rgba(255,154,0,0.5)',   speed:0.4, option:0.7, precision:0.6, collision:0.1, constraint:0.8, vehicle:0.8 },
    OIMO:  {c:'rgba(246,82,22,0.5)',   speed:0.3, option:0.5, precision:0.6, collision:0.2, constraint:0.8, vehicle:0.2 },
}