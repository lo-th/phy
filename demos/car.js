var current, mw, s1, s2, rr = 0, w1, w2;

function demo() {

    phy.log('under construction')

    phy.set({ 
        substep:16, 
        gravity:[0,-10,0] 
    })


    phy.add({ type:'plane', name:'floor', size:[ 300,1,300 ], friction:0.9, restitution:0, visible:false });

    phy.add({ type:'box', name:'f1', size:[ 5,0.2,2 ], pos:[5,0.1,3], friction:0.9, restitution:0 })
    phy.add({ type:'box', name:'f2', size:[ 5,0.2,2 ], pos:[5,0.1,-3], friction:0.9, restitution:0 })

    var gw = new THREE.CylinderGeometry( 0.3, 0.3, 0.3, 16, 1 );
    gw.rotateZ( -Math.PI * 0.5 );
    mw = new THREE.Mesh( gw )

    testCar( 0, [ 0,2,0 ] );

    //phy.follow('chassis0', { direct:true, simple:true })

    // update after physic step
    phy.setPostUpdate ( update )


}


function testCar ( n, pos ){

    current = n

    var body = phy.add({ type:'box', name:'chassis'+n, pos:pos, size:[1.4, 1, 2.4],  density:10, friction:0.5, restitution:0, neverSleep:true, massCenter:[0,0.5,0], order:'YXZ' });

    var ws = [ 1.1, -0.5, 1 ];
    var radius = 0.3;

    var w, j, b, front, side, wpos;

    w1 = [ ws[0], ws[1], ws[2] ];
    w2 = [ -ws[0], ws[1], ws[2] ];



    for (var i = 0; i < 4; i++) {

        front = i>=2 ? true : false;
        side = i === 0 || i === 2 ? 1 : -1;

        wpos = [ side * ws[0], ws[1], front ? -ws[2] :  ws[2] ];

        if(engine!=='PHYSX'){ 
            wpos[1] += 0.5
        }


        b = phy.add({ type:'box', name:'axis'+i+'_'+n, pos:[wpos[0]+pos[0], wpos[1]+pos[1], wpos[2]+pos[2] ], size:[0.25],  density:4, material:'debug', neverSleep:true,  order:'YXZ'/*, angularFactor:[0,1,0]*/ });
        w = phy.add({ type:'sphere', name:'wheel'+i+'_'+n, pos:[wpos[0]+pos[0], wpos[1]+pos[1], wpos[2]+pos[2] ], size:[radius],  density:4, friction:0.9, restitution:0.2, material:'debug', mesh:mw, neverSleep:true });

       /*j = phy.add({ 
s
            type:'joint', mode:'d6', 
            name:'joint'+i+'_'+n, 

            b1:'chassis'+n, 
            b2:'wheel'+i+'_'+n, 

            pos1:wpos,
            pos2:[0,0,0],

            iterations:10,

            lm: [['rx', -180, 180], ['y',-0.05,0.05] ],
            sd: [['y',20,0.3]],

        })*/


        

        j = phy.add({ 

            type:'joint', mode:'d6', 
            name:'axe'+i+'_'+n, 
            b1:'chassis'+n, b2:'axis'+i+'_'+n, 
            pos1:wpos, 
            helperSize:0.2,
            helperColor:'blue',
            //iteration:10,
            lm: front ? [ ['ry',-25,25, 1, 10000, Infinity, 10], ['y',-0.1,0.1, 1, 10000, 0.1] ] : [['y',-0.1,0.1, 1, 10000, 0.1]],

            //lm: front ? [ ['rx',-25,25, 1, 10000, Infinity, 10], ['z',-0.1,0.1, 1, 10000, 0.1] ] : [['z',-0.1,0.1, 1, 10000, 0.1]],

            drive:front ?[ ['ry', 1,1000, Infinity, false]]:[],

           // friction:[ ['rx', 1], ['ry', 1], ['rz', 1], ['y', 0.2]],


            //rot1:[0,0,90],
            //rot2:[0,0,90],


            //motions:front ? [['ry', 'free'], ['y', 'limited']] : [ ['y', 'limited']],
            //drive:front ? [['ry', 1,0.1,Infinity],['y', 0,0.1,Infinity]] : [['y', 0,0.1,Infinity]],
            //twistLimit:[-25, 25],
            //lm: front ? [ ['ry',-25,25] ] : [],
            sd:[[ 'y',20,0.01, true]],
           // sd : front ? [['ry',1,1, true]]: [],
            acc:true,
            //noFix:true,

            //lm: front ? [ ['ry',-45,45],['y',-0.05,0.05]] : [['y',-0.05,0.05]],
            //lm: front ? [ ['y', -0.1, 0.1], ['ry', -30, 30]] : [ss['y', -0.1, 0.1]],
            //sd : front ?  [['ry',20,0.8],['y', 20,0.3]]: [['y', 20,0.3]],
            //sd : front ? [['ry',10,0.3],['y', 10,0.3]]: [['y', 10,0.3]],
        })

        j = phy.add({ 

            type:'joint', mode:'d6', 
            name:'joint'+i+'_'+n, 

            b1:'axis'+i+'_'+n, 
            b2:'wheel'+i+'_'+n,

            helperSize:0.1,
            //iteration:10,q
            lm:[ ['rx', -180, 180]  ],


            motions: [['rx', 'free']] ,
            drive:[ ['rx', 1,1000]],
            //friction:[ ['rx', 0], ['ry', 1], ['rz', 1]],
            acc:true,
            //noFix:true,
        })

    }


}



function update () {

    let r = []

    let dt = phy.getDelta()
    let key = phy.getKey()

    let rs = key[0]//*40; // Q-D or A-D or left-right
    let ts = key[1] // Z-S or W-S or up-down

   


    var i = 4, f, s, v;
    while(i--){

        f = i>=2
        s = i === 0 || i === 2 ? -1 : 1;

        //v = f ? rs*10000 : 0
       // r.push( { name:'joint'+i+'_'+current, motor:[ ['rx', -ts*100,-ts*100] ] } )
        //if( f )r.push( { name:'axe'+i+'_'+current, motor:[ ['ry', v ,0]] } )

        //if( f ) 
        //r.push( { name:'axis'+i+'_'+ current, localRot:[0,-rs * 25 ,0]/*, reset:true*/ } )
        r.push({ name:'axe'+i+'_'+ current,
              motor:[['ry',f ? -rs*360 : 0, 200, 10 ]],
              //drivePosition:{pos:w1, rot:[0,f ? -rs*25 : 0, 0]},
              driveVelocity:[[0,0,0], [ 0 , f ? rs*360 :0,0]],
        })

        //r.push( { name:'wheel'+i+'_'+ current, torque:[ts*300, 0 ,0 ] } )

        r.push({ name:'joint'+i+'_'+ current, 
            motor:[['rx',ts*360*2, 360 ]], // ammo // oimo
            driveVelocity:[[0,0,0], [ -ts*30,0,0]] // physx
        })
       //r.push( { name:'joint'+i+'_'+ current, motor:[['rx',-ts*200,-ts*2000 ]] } )

        //r.push( { name:'axe'+i+'_'+current, driveVelocity:[[0,0,0], [ 0, v ,0]] } )

        //r.push( { name:'axe'+i+'_'+current, drivePosition:{rot:[40, 0 ,0]} } )

    }

    phy.change( r )

}