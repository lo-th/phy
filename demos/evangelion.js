let perso

demo = () => {

    phy.log('move WSAD or ZSQD / run SHIFT / jump SPACE / crouch C')
    phy.view({ envmap:'clear', envblur: 0.05, ground:false, fog:true, fogDist:0.01 })

	// setting physics
	phy.set({ substep:1, gravity:[0,-9.81,0], key:true })

    makeTerrain()

}

//-----------
//  TERRAIN
//-----------

makeTerrain = () => {

    let z = 0.75
    let low = engine === 'OIMO';

    let terrain = phy.add({
        type:'terrain',
        name:'terra',
         
        maps:['road3', 'dirt', 'rock'],

        uv:low ? 18 : 400,
        pos:low ? [ 0, -2, 0 ] :[0,-5,0],
        size:low ? [ 20, 6, 20 ] : [512, 10, 512],
        sample:low ? [ 32, 32 ] : [512, 512],
        frequency:[0.02*z,0.05*z,0.1*z],
        level:[ 1.0, 0.5, 0.2 ],
        expo:2.5,
        zone:0.25,

        friction: 0.5,
        restitution: 0.0,

    })

    let py = terrain.getHeight( 0, 0 ) + 2
    addCharacter( py )

}

//-----------
//   HERO
//-----------

addCharacter = ( py ) => {

    perso = phy.add({ 
        type:'character',
        gender:'eva0' + math.randInt(0,2),
        name:'eva',
        callback:end,
        pos:[0,py,0],
        useImpulse:true,
        floating:true,
        isPlayer:true,
    })

    phy.follow('eva', { direct:true, simple:true, distance:3, phi:-10, theta:5, decal:[0.3, 0.5, -0.3], fov:75, zoom:1.0 })
    phy.setPostUpdate( update )

}

end = ( py ) => {

    hub.addCross()
    addGui()

}

//-----------
//    UP
//-----------

update = () => {

    let p = perso.position;
    let d = math.distanceArray([p.x, 0, p.z])
    if( d > 50 ){
        phy.change([
            { name:'terra', decal:[p.x,0,p.z] },
            { name:'eva', pos:[0,p.y,0] },
        ])
    }

}

//-----------
//    GUI
//-----------

const addGui = () => {

    gui = phy.gui(null, 120)
    gui.add('bool',{name:'Show Helper', onName:'Hide Helper', mode:1}).onChange( (b)=>{ perso.debugMode( b ) } )
      
}