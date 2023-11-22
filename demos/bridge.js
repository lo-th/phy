let px = 5
let side = 0
let onFloor = 0
let ready = false
let bob = null
let distance = 0
let maxY = 0
let t1 = 0;
let num = 0;

let maxCharacter = 1;

const models = [ 'man', 'woman']
//const models = [ 'man_low', 'woman_low', 'man', 'woman' ]

demo = () => {

    phy.view({
        phi:12, theta:0, distance:5, x:0, y:3, z:15, fov:60, 
        envmap:'lobe', envblur: 0.5, //background:0x101010,
        groundReflect:0.1, groundColor:0x808080,
        shadow:0.5,//0.5,
    })
    
    // config physics setting
    phy.set( {
        substep:1, 
        gravity:[0,-9.81,0],
        jointVisible:false
    })

    // add static ground
    phy.add({ type:'plane', size:[300,1,300], visible:false })
    // add static box
    phy.add({ type:'box', size:[4,4,4], pos:[9,2,0] })
    phy.add({ type:'box', size:[4,4,4], pos:[-9,2,0] })
    phy.add({ type:'box', size:[4,2,4], pos:[9,1,4] })
    phy.add({ type:'box', size:[4,2,4], pos:[-9,1,4] })

    phy.add({ type:'stair', size:[2,2,3], pos:[-9,1,7.5], friction:0 })
    phy.add({ type:'stair', size:[2,2,3], pos:[9,1,7.5], friction:0 })

    phy.add({ type:'stair', size:[2,2,3], pos:[-9,3,3.5], friction:0 })
    phy.add({ type:'stair', size:[2,2,3], pos:[9,3,3.5], friction:0 })

    addDynamic();

    t1 = phy.getTime();
    phy.preload( models, onComplete );

}

onComplete = () => {

    console.log( 'loading in: ' + phy.readTime( phy.getTime() - t1 ) )
    Character();

}

const addDynamic = () => {

    Bridge();

    let rand = math.rand;

    // add random object
    let i=5;
    while(i--){
        phy.add({ type:'box', size:[ rand( 0.3,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
        phy.add({ type:'sphere', size:[ rand( 0.3,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
        phy.add({ type:'cone', size:[ rand( 0.4,  0.6 ), rand( 0.4,  0.8 ) ], pos:[ rand( -8, 8 ), rand( 8, 10 ), rand( -1, 1 ) ], density: 0.3 })
    }

    // platform test
    phy.add({ type:'box', name:'kine', size:[4,0.4,4], pos:[ px, 1.8, 4 ], radius:0.04,  density:1, kinematic:true, density: 0, friction:1 });
    phy.add({ type:'box', name:'truc', size:[1,1,1], pos:[ px, 2.9, 4 ], radius:0.02, density:1, friction:1 });

    phy.setPostUpdate ( update )
    phy.setTimeout( go, 0 )

}

const Bridge = ( width = 4, height = 0.2, length = 0.7 ) => {

    let isLocal = true
    let num = 20;
    let gap = 0.05
    let size = [ length, height, width ]
    let i = num
    let data = []
    
    while( i-- ){
        x = (i - (num - 1) * 0.5) * (length + gap);
        data.push({ type:'box', name:'b'+i, size:size, pos:[ x, 4-(height*0.5), 0 ], radius:0.02, density: i == 0 || i == num - 1? 0 : 10 });
    }

    i = num-1
    while( i-- ){
        
        if( isLocal ){ // local joint
            x = (length + gap) * 0.5
            data.push({ type:'hinge', name:'j'+i, b1:'b'+i, b2:'b'+(i+1), pos1:[x,0,0], pos2:[-x,0,0], worldAxis:[0,0,1], lm:[-10,10] })
        } else { // world joint
            x = (i - (num - 1) * 0.5) * (length + gap)
            data.push({ type:'hinge', name:'j'+i, b1:'b'+i, b2:'b'+(i+1), worldAnchor:[x+(length*0.5),4,0], worldAxis:[0,0,1], lm:[-10,10 ], sd:[20,1, 0, 0.5, -1] })
        }
        
    }

    phy.add(data);

}

const Character = () => {

    let i = maxCharacter, n = 0,  g;
    let pos = [0,0,15], angle = 180;
    let hh = [];

    while( i-- ){

        g = math.randInt( 0, models.length-1 );
        //g = math.randInt( 0, 1 );

        hh[n] = phy.add({ 
            type: 'character',
            name: 'c_' + n,
            gender: models[g],
            debug: true,
            radius: 0.35,
            height: 1.8,
            pos: pos,
            //ray: n===0,
            angle:angle,
            randomMorph:true,
            morph:true,
            callback:count,
        });

        n++
        pos = [ math.rand( -10, 10 ), 0, math.rand( 5, 15 ) ];
        angle = math.randInt( 0, 360 )

    }

   // hh[0].debugMode( true );

    phy.follow('c_0', { direct:true, simple:true, distance:5, phi:12, theta:0, decal:[0.3, 0.5, -0.3], fov:60, zoom:1.0 })
    phy.control( 'c_0' );

}


const count = () => {

    num++;
    if( num === maxCharacter ) console.log( 'ready in: ' + phy.readTime( phy.getTime() - t1 ) )
    

}

const go = () => {

    side = -1;
    ready = true;

}

const update = () => {

    if(!ready) return;

    px += 0.03 * side;
    if(px<=-5) side = 1;
    if(px>=5) side = -1;
    
    phy.change({name:'kine', pos:[ px, 1.8, 4 ], rot:[ 0, (px-5)*18, 0 ] });

}
