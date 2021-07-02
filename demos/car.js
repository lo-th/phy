var current, mw, s1, s2;

function demo() {

    phy.log('under construction')

    phy.set({ 
        substep:4, 
        gravity:[0,-10,0] 
    })


    phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], friction:1, restitution:0, visible:false });

    var gw = new THREE.CylinderBufferGeometry( 0.3, 0.3, 0.3, 16, 1 );
    gw.rotateZ( -Math.PI * 0.5 );
    mw = new THREE.Mesh( gw )

    testCar( 0, [ 0,2,0 ] );

    // update after physic step
    phy.setPostUpdate ( update )


};


function testCar ( n, pos ){

    current = n

    var body = phy.add({ type:'box', name:'chassis'+n, pos:pos, size:[1.4, 1, 2.4],  density:5, friction:0.5 });
    body.rotation._order = 'YXZ';

    var ws = [ 1.1, -0.5, 1 ];
    var radius = 0.3;

    var w, j, b, front, side, wpos;

    for (var i = 0; i < 4; i++) {

        front = i>=2 ? true : false;
        side = i === 0 || i === 2 ? 1 : -1;

        wpos = [ side * ws[0], ws[1], front ? -ws[2] :  ws[2] ];

    	b = phy.add({ type:'box', name:'axis'+i+'_'+n, pos:[wpos[0]+pos[0], wpos[1]+pos[1], wpos[2]+pos[2] ], size:[0.25],  density:5, material:'debug2' });
    	
        w = phy.add({ type:'sphere', name:'wheel'+i+'_'+n, pos:[wpos[0]+pos[0], wpos[1]+pos[1], wpos[2]+pos[2] ], size:[radius],  density:6, friction:1, staticFriction:1.2, material:'debug', mesh:mw });
       //w = phy.add({ type:'wheel', name:'wheel'+i+'_'+n, pos:[wpos[0]+pos[0], wpos[1]+pos[1], wpos[2]+pos[2] ], size:[radius, 0.35],  density:6, staticFriction:1.2, friction:1, material:'debug' });


        /*j = phy.add({ 

            type:'joint', mode:'d6', 
            name:'axe'+i+'_'+n, 
            b1:'chassis'+n, b2:'axis'+i+'_'+n, 
            pos1:wpos, helperSize:0.1,
            rot1:[0,0,90],
            rot2:[0,0,90],
            motions:front ? [ [ 'twist', 'limited'], ['swing1', 'locked' ], ['swing2', 'locked'] ] : [ [ 'twist', 'locked'], ['swing1', 'locked' ], ['swing2', 'locked'] ], 
            drives:[  [ 'twist', 1, 0.1, Infinity, true ]  ],
            //drives:[  [ 'twist', 10000000, 0.1, Infinity, false ]  ],
            twistLimit:[-45, 45],
            //driveVelocity:[[0,0,0], [0,0,0]],
            neverSleep:true,
            collision:false,
        })*/

        j = phy.add({ 

            type:'joint', mode:'d6', 
            name:'axe'+i+'_'+n, 
            b1:'chassis'+n, b2:'axis'+i+'_'+n, 
            pos1:wpos, helperSize:0.1,
            //rot1:[0,0,90],
            //rot2:[0,0,90],
            motions:front ? [ [ 'twist', 'locked'], ['swing1', 'limited' ], ['swing2', 'locked'] ] : [ [ 'twist', 'locked'], ['swing1', 'locked' ], ['swing2', 'locked'] ], 
            //drives:[  [ 'swing', 1, 0.1, Infinity, true ]  ],
            drives:[  [ 'swing', 1, 0.1, Infinity, false ]  ],
            //drives:[  [ 'twist', 10000000, 0.1, Infinity, false ]  ],
           // twistLimit:[-45, 45],
            swingLimit:[45, 45],
            //driveVelocity:[[0,0,0], [0,0,0]],
            neverSleep:true,
            collision:false,
        })

        j = phy.add({ 

            type:'joint', mode:'d6', 
            name:'joint'+i+'_'+n, 

            b1:'axis'+i+'_'+n, 
            b2:'wheel'+i+'_'+n, 
           //pos1:front ? [0,0,0] : wpos, 
            helperSize:0.1,
            //rot1:[0,side===1? 0: 180 ,0],
            //rot2:[0,side===1? 0: 180 ,0],

            motions:[ [ 'twist', 'free'], ['swing1', 'locked' ], ['swing2', 'locked'] ], 
            drives:[  [ 'twist', 1, 0.1, Infinity, true ]  ],

            /*
            motions:[ ['twist', 'free'], ['swing1', front===-1? 'limited' : 'locked' ], ['swing2', 'locked'] ],
            drives:[ ['twist', 1, 0.5, Infinity, true ], ['swing', 1, 1, 100000, true ] ],
            swingLimit:[ 35, 0 ],//, 0, 0, 0, 0.001, 0.00001 ],
            */
            driveVelocity:[[0,0,0], [0,0,0]],
            neverSleep:true,
            collision:false,
        })

    }


}



function update () {

    let r = []

    let dt = phy.getDelta()
    let key = phy.getKey()

    var rs = key[0]*30; // Q-D or A-D or left-right
    var ts = key[1]*10000; // Z-S or W-S or up-down


    var i = 4, f, s, v;
    while(i--){

        f = i>=2
        s = i === 0 || i === 2 ? -1 : 1;

        v = f ? rs*10000 : 0
        r.push( { name:'joint'+i+'_'+current, driveVelocity:[[0,0,0], [ -ts*10,0,0]] } )
        //r.push( { name:'axe'+i+'_'+current, driveVelocity:[[0,0,0], [ f ? rs*10000 :0 ,0,0]] } )
        //r.push( { name:'axe'+i+'_'+current, driveVelocity:[[0,0,0], [ 0, v ,0]] } )

        r.push( { name:'axe'+i+'_'+current, drivePosition:{rot:[40, 0 ,0]} } )

    }

    phy.update( r )



}