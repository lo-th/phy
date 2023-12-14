function demo() {

    let g1 = 1 << 6 // 64
    let g2 = 1 << 7 // 128
    let g3 = 1 << 8 // 256

    //console.log(2|g3) // 258

    // config physics setting
    phy.set( { substep:4, gravity:[0,-9.81,0] });

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false });

    let h = 6, w = 0.2, l = 4, d = 4, y = 0.22;

    phy.add({type:'box', pos:[d*0.5,y+h*0.5,0], size:[w,h, l+w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[-d*0.5,y+h*0.5,0], size:[w,h, l+w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[0,y+h*0.5,l*0.5], size:[d-w,h, w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[0,y+h*0.5,-l*0.5], size:[d-w,h, w], restitution:0, friction:0.5, visible:false });

    phy.add({ type:'box', pos:[0,y-w*0.5,0], size:[d+w,w,l+w], material:'glass2', radius:0.02, restitution:0, friction:0.5, group:g1, mask:g1, renderOrder:2 });

    y+=2
    phy.add({ type:'box', pos:[0,y-w*0.5,0], size:[d-w,w,l-w], material:'glass2', radius:0.02, restitution:0, friction:0.5, group:g2, mask:g2, renderOrder:3 });

    y+=2
    phy.add({ type:'box', pos:[0,y-w*0.5,0], size:[d-w,w,l-w], material:'glass2', radius:0.02, restitution:0, friction:0.5, group:g3, mask:g3, renderOrder:4 });

    let i = 60, pos, ds

    while(i--){

        ds = 0.2

    	pos = [math.rand( -1.5, 1.5 ), 5+i*0.6, math.rand( -1.5, 1.5 )]

    	phy.add({ size:[0.2], pos:pos, density:ds, restitution:0, friction:0.5, radius:0.03, group:g1, mask:2|g1 })
        phy.add({ type:'sphere', size:[0.1], pos:pos, density:ds, restitution:0, friction:0.5, group:g2, mask:2|g2 })
        phy.add({ type:'cylinder', size:[0.1, 0.2], pos:pos, density:ds, restitution:0, friction:0.5, radius:0.03, group:g3, mask:2|g3 })

    }

}