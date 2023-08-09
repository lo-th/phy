let pp, mesh 

function demo() {


    let g1 = 1 << 6
    let g2 = 1 << 7
    let g3 = 1 << 8

    phy.view({ distance:10 })

    // config physics setting
    phy.set( { substep:1, gravity:[0,-10,0], full:true, jointVisible:true });


    phy.add({ type:'container', material:'debug', size:[6,8,6], pos:[0,4,0], face:{up:0}, wall:0.4 });

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false });

    let rand = math.rand

    let i = 5, j
    while(i--) {
        phy.add({ type:'sphere', pos:[rand(-2,2),8+(i*2),rand(-2,2)], size:[0.4], mass:1 });
    }

    /*addSpringyBoard([-3, 3, 0], 1, 8);
    addSpringyBoard([3, 3, 0], -1, 8);
    addSpringyBoard([-3, 4, 0], 1, 8);
    addSpringyBoard([3, 4, 0,] -1, 8);*/

    i = 5
    
    while (i--) {
        //addSpringyFloor([i - 2, 0, 0]);
        j = 5
        while (j--) {
            addSpringyFloor([ j - 2, 0, i - 2 ]);
        }
    }

}

addSpringyBoard = ( at, dir, num) => {

    phy.add({ type:'box', pos:[i*2,8,0], size:[0.2, 0.1, 0.4], mass:1 });


}

addSpringyFloor = ( pos ) => {

    let base = phy.add({ type:'box', pos:[pos[0],0.05,pos[2]], size:[0.5, 0.1, 0.5] });
    let floor = phy.add({ type:'box', pos:[pos[0],2,pos[2]], size:[0.95, 0.2, 0.95], mass:1, friction:0.5 });
    phy.add({ 
        type:'prismatic', b1:base, b2:floor,
        worldPos:[pos[0],2,pos[2]], worldAxis:[0,1,0],
        limit:[-0.001,0.001], 
        //spring:[3,0.2], // oimo
        //spring:[300,0.2], // physx
        spring:[300,0.2], // havok
        friction:1,// havok
    });

}


update = () => {
 

}