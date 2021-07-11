let timer = null, max = 30, n = 0, tt = 300

function demo() {

    // note one unit = one meter
    phy.log('look code')

    // config physics setting
    phy.set( {substep:2, gravity:[0,-9.81,0]});

    // add static plane 
    phy.add({ type:'plane', size:[300,1,300], visible:false });

    // add some block
    add()

}

function onReset () {

    // clear timeout on demo change
    if( timer !== null ) clearTimeout( timer )
    timer = null

}

function add(){

    // by default engine remove object with the same name
    // you can also use phy.remove(name)

    phy.add({
        type:'box',
        name: 'box' + n,
        radius:0.05,// box chanfer
        size:[math.rand(0.2, 2),math.rand(0.2, 2),math.rand(0.2, 2)],
        pos:[math.rand(-2, 2),math.rand(8, 10),math.rand(-2, 2)],
        density:1,
        friction:0.5,
        restitution:0.2,
    })

    n++
    if( n>max ) n = 0

    timer = setTimeout( add, tt )

}