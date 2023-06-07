import {
    Mesh, PlaneGeometry, Raycaster, Vector2, Vector3, MeshBasicMaterial
} from 'three';

import { root } from './root.js';

export class MouseTool {

	constructor ( controler, mode = 'drag' ) {

		this.mode = mode
		this.option = {}

		this.controler = controler
		this.dom = this.controler.domElement

		this.selected = null
		this.buttonRef = null

		this.numBullet = 0
		this.maxBullet = 10

		this.sticky = false

		this.isActive = false
		this.raycastTest = false
		this.firstSelect = false
		this.mouseDown = false
		this.mouseDown2 = false
		this.mouseMove = false
		this.controlFirst = true;

		this.mouse = new Vector2()
		this.oldMouse = new Vector2()
		this.raycast = new Raycaster()
		this.raycast.far = 1000;

		this.pos = new Vector3()
		this.velocity = new Vector3()


		this.dragPlane = new Mesh( new PlaneGeometry( 1, 1 ), new MeshBasicMaterial({ visible:false, toneMapped: false }) )
	    this.dragPlane.castShadow = false
	    this.dragPlane.receiveShadow = false
	    this.dragPlane.scale.set( 1, 1, 1 ).multiplyScalar( 200 )

	    //if( this.mode === 'drag' ) 
	    this.activeDragMouse( true )

	}

    setMode ( mode, o={} ) {

    	if( mode === this.mode ) return
    	this.mode = mode;
        this.option = o

        if( this.mode === 'blast' && this.option.visible ) root.motor.initParticle()

    }

	activeDragMouse ( b ) {

		if( b ){
			if( !this.isActive ){
				this.dom.addEventListener( 'pointermove', this.mousemove.bind(this), false )
		        this.dom.addEventListener( 'pointerdown', this.mousedown.bind(this), false )
		        document.addEventListener( 'pointerup', this.mouseup.bind(this), false )
		        document.addEventListener( 'contextmenu', this.contextmenu.bind(this), false )

		        this.controler.addEventListener( 'end', this.controleEnd.bind(this), false )
		        this.controler.addEventListener( 'change', this.controleChange.bind(this), false )

		        this.isActive = true
		        this.raycastTest = true
		    }

		} else {
			if( this.isActive ){
				this.dom.removeEventListener( 'pointermove', this.mousemove.bind(this) )
			    this.dom.removeEventListener( 'pointerdown', this.mousedown.bind(this) )
			    document.removeEventListener( 'pointerup', this.mouseup.bind(this) )

			    this.controler.removeEventListener( 'end', this.controleEnd.bind(this) )
		        this.controler.removeEventListener( 'change', this.controleChange.bind(this) )

			    this.isActive = false
			}
		}
	}

	controleEnd ( e ) {
		this.controlFirst = true
		this.raycastTest = true
	}

	controleChange ( e ) {

		let state = this.controler.getState();
		if( state !== -1 ){
			if( this.controlFirst ) this.controlFirst = false;
			else this.raycastTest = false;
		}
	}

	getMouse ( e ) {

		this.mouse.x =   ( e.offsetX / this.dom.clientWidth ) * 2 - 1
		this.mouse.y = - ( e.offsetY / this.dom.clientHeight ) * 2 + 1

	}

	contextmenu ( e ) {
		e.preventDefault()
		if( this.mouseDown ){
			console.log('yo ')
		}
	}

	mousedown ( e ) {

		if( this.sticky ){ 
			this.unSelect()
			console.log('unstick')
		}

		this.getMouse( e )

		switch( this.mode ){

			case 'drag':

			let button = 0

			

			if( !this.mouseDown ){

				if( this.firstSelect ) this.firstSelect = false
				this.oldMouse.copy( this.mouse )
			}

			if ( e.pointerType !== 'touch' ) button = e.button

		    if( button === 0 ){
			    this.mouseDown = true
			    root.mouseDown = true
			    this.castray()
			}

			if( button === 2 ){
			    this.mouseDown2 = true
			    this.castray()
			}
			break

			case 'shoot':
			this.shoot()
			break

			case 'blast':
			this.blast()
			break
		}

		

	}

	mouseup ( e ) {

		this.mouseMove = this.oldMouse.distanceTo( this.mouse ) < 0.01 ? false : true
		this.mouseDown = false
		this.mouseDown2 = false
		root.mouseDown = false

		if( this.sticky ) { this.controler.enabled = true; return; }
		this.unSelect()
		this.resetButton()

	}

	mousemove ( e ) {

		switch( this.mode ){

			case 'drag':
			this.getMouse( e )
		    this.castray()
			break

		}

	}

	castray () {

		let inters, m, g, h, id, cursor = 'auto'

		if( this.selected !== null ){

			this.raycast.setFromCamera( this.mouse, this.controler.object )
			inters = this.raycast.intersectObject( this.dragPlane )
			if ( inters.length && this.mouseDown ) root.motor.change({ name:'mouse', pos:inters[0].point.toArray() }, true )
			return

		}

		if( !this.raycastTest ) return;

		this.raycast.setFromCamera( this.mouse, this.controler.object )

		inters = this.raycast.intersectObjects( root.scene.children, true )

		if ( inters.length > 0 ) {

			g = inters[ 0 ].object
			id = inters[ 0 ].instanceId

			//console.log(inters[ 0 ])

			if( id !== undefined ){
				m = root.motor.byName( g.name+id )
			} else {
				if( g.parent !== root.scene ){
					h = g.parent;
					if( h.parent !== root.scene ) m = h.parent
					else m = h;
				} else m = g;
			}

			if( this.mouseDown2 ){
				if( m.extra ) m.extra( m.name )
				//console.log(m)
			}

			if( !m.isButton ) cursor = this.select( m, inters[ 0 ] )
			else cursor = this.actionButton( m, inters[ 0 ] )

		}

		document.body.style.cursor = cursor

	}

	blast () {

		let hit = null
		this.raycast.setFromCamera( this.mouse, this.controler.object )
		let inters = this.raycast.intersectObjects( root.scene.children, true )

		if ( inters.length > 0 ) {hit = inters[ 0 ]
		} else {
			inters = this.raycast.intersectObjects( root.scenePlus.children, true )
			if ( inters.length > 0 ) hit = inters[ 0 ]
		}

	    const o = this.option

		if(hit){ 

			root.motor.explosion( hit.point, o.radius || 3, o.power || 0.1 )

			if( o.visible ) root.motor.addParticle({
				name:'blast',
				type:"cube",
				position:hit.point.toArray(),
				numParticles: 60,
				radius:0.2,
				radiusRange:0.1,
				//accelerationRange:[0.3,0.3,0.3],
				acceleration:[5*10,5,5*10],
				lifeTime: 0.5,
		        endTime: 0.5,
		        startTime: 0,
		        gravity:[0,0.2,0],
		        startSize: 0.5,
		        endSize: 0.1,
		        //spinSpeedRange:2,
		        tween:"outQuad",
		        //velocityRange: [ 0.6, 0.6, 0.6 ]
		        //lifeTimeRange:1,
		        //startTime: 0,
		        //startSize: 0.1,

			})
		}
		

	}

	shoot () {

		this.raycast.setFromCamera( this.mouse, this.controler.object )
		this.pos.copy( this.raycast.ray.direction ).add(  this.raycast.ray.origin );
		this.velocity.copy( this.raycast.ray.direction ).multiplyScalar( 60 )

		root.motor.add({
			name: 'bullet_' + this.numBullet,
			type:'sphere',
			density:20,
			size:[0.2], 
			material:'chrome',
			pos:this.pos.toArray(),
			linearVelocity:this.velocity.toArray(),
			bullet:true,
			/*ccdThreshold:0.0000001,
            ccdRadius:0.1,*/
		})

		this.numBullet++
		if(this.numBullet > this.maxBullet) this.numBullet = 0

	}

    resetButton () {

		if( this.buttonRef ){
			if( this.buttonRef.userData.out ) this.buttonRef.userData.out()
			this.buttonRef = null
		}

		this.raycastTest = true
		this.selected = null
		this.firstSelect = true
		this.controler.enabled = true

	}

	actionButton ( obj, inters ) {

		if( this.buttonRef ){
			if( this.buttonRef.name !== obj.name ){ 
				if( this.buttonRef.userData.out ) this.buttonRef.userData.out()
				this.buttonRef = obj
			}
		} else {
			if( this.mouseDown ) this.buttonRef = obj
		}
		if( this.mouseDown && this.buttonRef.userData.action ){ 
			let pos = inters.point
			this.buttonRef.userData.action( pos )
		}

		if( this.mouseDown ) this.controler.enabled = false
		   
		//return 'grab'
	    return 'pointer'

	}

	select ( obj, inters ) {

		if( !this.mouseDown || this.selected === obj ) return 'pointer'

		let pos = inters.point
	    let quat = [0,0,0,1]
		
		this.selected = obj
		/*if( this.selected.isInstance ) quat = this.selected.instance.getInfo( this.selected.id ).quat;
		else if( this.selected.isObject3D ){
			this.selected.updateMatrix()
			quat = this.selected.quaternion.toArray()
		}*/

		let q = this.selected.quaternion
		quat = [ q._x, q._y, q._z, q._w ]


		/*if( this.selected.isInstance ){
			console.log(this.selected)
			return
		}*/

		/*if( this.selected.isButton ){
			if( this.buttonRef ){
				if(this.buttonRef.name !== this.selected.name ) this.buttonRef = obj
			} else {
				this.buttonRef = obj
			}
			if( this.buttonRef.userData.action ) this.buttonRef.userData.action()
			    this.unSelect ()
			return 'grab'
		}*/

		
	    root.scenePlus.add( this.dragPlane )
	    this.dragPlane.rotation.set( 0, this.controler.getAzimuthalAngle(), 0 )
	    this.dragPlane.position.copy( pos )

	    let p = pos.toArray()

	    root.motor.change({ name: this.selected.name, neverSleep:true, wake:true })
		//Motor.add({ name:'mouse', type:'sphere', size:[0.01], pos:p, quat:quat, mask:0, density:0, noGravity:true, kinematic:true, flags:'noCollision' })
		//root.motor.add({ name:'mouse', type:'null', pos:p, quat:quat })

		//let def = [-0.03, 0.03, 60, 5]
		//let defr = [-3, 3, 60, 5]

		//let def = [-0.03, 0.03, 60, 2]
		//let defr = [-3, 3, 60, 2]

		let def = [-0.1, 0.1, 60, 1]
		let defr = [-3, 3, 60, 1]

		let notUseKinematic = root.engine ==='OIMO' || root.engine ==='RAPIER'

		root.motor.add([
			{ name:'mouse', type:'null', pos:p, quat:quat, kinematic:notUseKinematic ? false : true },
			{ 
				name:'mouseJoint', type:'joint',mode:'d6',//mode:'spherical', //lm:[-0.2, 0.2],
				lm:[['x',...def], ['y',...def], ['z',...def], 
				['rx',...defr], ['ry',...defr], ['rz',...defr]],
				autoDrive: true,
				b2:this.selected.name, b1:'mouse', 
				worldAnchor: p, 
				worldAxis:[1,0,0],
				//friction:0.5,
				//tolerance:[1, 10],
				//noPreProcess:true,
				//improveSlerp:true,
				visible:true,
				//noFix:true,
			}
		])
		

		this.raycastTest = false
		this.controler.enabled = false

		return 'move'

	}

	unSelect () {

		

		if( this.selected === null ) return

		/*if( this.selected.isButton ){
			if( this.selected.userData.out ) this.selected.userData.out()
		} else {*/
			this.dragPlane.geometry.dispose()
			root.scenePlus.remove( this.dragPlane )
			root.motor.remove(['mouseJoint','mouse'])
			root.motor.change({ name:this.selected.name, neverSleep:false, wake:true })
		//}

		
		this.raycastTest = true
		this.selected = null
		this.firstSelect = true
		this.controler.enabled = true
		

	}


}