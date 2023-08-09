let pp, mesh 

function demo() {


    let g1 = 1 << 6
    let g2 = 1 << 7
    let g3 = 1 << 8

    phy.view({ distance:5 })


    // config physics setting
    phy.set( { substep:1, gravity:[0,-10,0], full:true, jointVisible:false });

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false });

    let h = 6, w = 0.2, l = 4, d = 4, y = 0.22 

   /* phy.add({type:'box', pos:[d*0.5,y+h*0.5,0], size:[w,h, l+w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[-d*0.5,y+h*0.5,0], size:[w,h, l+w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[0,y+h*0.5,l*0.5], size:[d-w,h, w], restitution:0, friction:0.5, visible:false });
    phy.add({type:'box', pos:[0,y+h*0.5,-l*0.5], size:[d-w,h, w], restitution:0, friction:0.5, visible:false });

    phy.add({ type:'box', pos:[0,y-w*0.5,0], size:[d+w,w,l+w], material:'glass2', radius:0.02, restitution:0, friction:0.5, renderOrder:2 });

  */  y+=1
    //phy.add({ type:'box', pos:[0,2,0], size:[5,w,0.2], material:'glass2', radius:0.02, restitution:0, friction:0.5, renderOrder:3 });

    phy.add({ type:'sphere', pos:[0,2,0], size:[0.4], radius:0.02, restitution:0, friction:0.5, renderOrder:3, visible:true });


    //phy.add({ type:'box', pos:[0,y-w*0.5,0], size:[d-w,w,l-w], material:'glass2', radius:0.02, restitution:0, friction:0.5, group:g3, mask:g3, renderOrder:4 });


    pp = phy.addParticleSolver({

    })


    let lng = 16, link = []
    let i = lng*lng, pos, x, n=0, col, row, p1, p2

    let geometry = new THREE.PlaneGeometry(1, 1, lng-1, lng-1);
    let material = phy.getMat('cloth')
    material.side = THREE.DoubleSide;
    mesh = new THREE.Mesh( geometry, material )
    mesh.frustumCulled = false

    phy.addDirect( mesh )
    

    while(i--){

        col = n % lng;
        row = Math.floor( n / lng );
        x = (col-(lng*0.5))*0.1;
        y = (row-(lng*0.5))*0.1;
        pos = [x, 3, y]

        // x y
        if (col < lng-1) link.push([n, n + 1 ]);
        if (row < lng-1) link.push([n, n + lng ]);
        // cross
        if (col < lng-1 && row < lng-1){ 
            link.push([ n + 1, n + lng ]);
            //link.push([ n, n + lng + 1 ]);
        }


        pp.add( pos );

    	n++

    }

    

    pp.connect( link )

    phy.setPostUpdate ( update )

    //console.log(link)

}


update = () => {

    //pp.update()

    let ar = pp.getPosition()

    let p = mesh.geometry.attributes.position.array

    let i = p.length /// 3, n

    while(i--) p[i] = ar[i]
    


    //mesh.geometry.attributes.position.array = ar

    mesh.geometry.attributes.position.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    

}