function demo() {

    // config physics setting
    phy.set( { substep:4, gravity:[0,-9.81,0] });

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false });

    let h = 6, w = 0.2, l = 4, d = 4, y = 0.22 

    phy.add({type:'box', pos:[d*0.5,y+h*0.5,0], size:[w,h, l+w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[-d*0.5,y+h*0.5,0], size:[w,h, l+w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[0,y+h*0.5,l*0.5], size:[d-w,h, w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[0,y+h*0.5,-l*0.5], size:[d-w,h, w], restitution:0, friction:0.5, visible:false });

    phy.add({ type:'box', pos:[0,y-w*0.5,0], size:[d+w,w,l+w], material:'glass', radius:0.02, restitution:0, friction:0.5, mask:64, renderOrder:2 });

    y+=2
    phy.add({ type:'box', pos:[0,y-w*0.5,0], size:[d-w,w,l-w], material:'glass', radius:0.02, restitution:0, friction:0.5, mask:128, renderOrder:3 });

    y+=2
    phy.add({ type:'box', pos:[0,y-w*0.5,0], size:[d-w,w,l-w], material:'glass', radius:0.02, restitution:0, friction:0.5, mask:256, renderOrder:4 });

    let i = 60, pos

    while(i--){

    	pos = [math.rand( -1.5, 1.5 ), 5+i*0.6, math.rand( -1.5, 1.5 )]

    	phy.add({ size:[0.2], pos:pos, density:1, restitution:0, friction:0.5, radius:0.03, group:64, mask:2|64 })
        phy.add({ type:'sphere', size:[0.1], pos:pos, density:1, restitution:0, friction:0.5, group:128, mask:2|128 })
        phy.add({ type:'cylinder', size:[0.1, 0.2], pos:pos, density:1, restitution:0, friction:0.5, radius:0.03, group:256, mask:2|256 })

    }


}