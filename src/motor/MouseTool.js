import {
    Mesh, PlaneGeometry, Raycaster, Vector2, Vector3, MeshBasicMaterial
} from 'three';

import { root, math } from './root.js';

export class MouseTool {

	constructor ( controler, mode = 'drag' ) {

		this.mode = mode

		this.controler = controler
		this.dom = this.controler.domElement

		this.selected = null

		this.numBullet = 0
		this.maxBullet = 10

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

    setMode ( mode ) {

    	if( mode === this.mode ) return
    	this.mode = mode;

    }

	activeDragMouse ( b ) {

		if( b ){
			if( !this.isActive ){
				this.dom.addEventListener( 'pointermove', this.mousemove.bind(this), false )
		        this.dom.addEventListener( 'pointerdown', this.mousedown.bind(this), false )
		        document.addEventListener( 'pointerup', this.mouseup.bind(this), false )

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

	mousedown ( e ) {

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
		}

		

	}

	mouseup ( e ) {

		this.mouseMove = this.oldMouse.distanceTo( this.mouse ) < 0.01 ? false : true
		this.mouseDown = false
		this.mouseDown2 = false
		this.unSelect()

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
			if ( inters.length ) root.motor.change({ name:'mouse', pos:inters[0].point.toArray() }, true )

		}

		if( !this.raycastTest ) return;

		this.raycast.setFromCamera( this.mouse, this.controler.object )

		inters = this.raycast.intersectObjects( root.scene.children, true )

		if ( inters.length > 0 ) {

			g = inters[ 0 ].object
			id = inters[ 0 ].instanceId

			///console.log(inters[ 0 ])

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

			cursor = this.select( m, inters[ 0 ] )

		}

		document.body.style.cursor = cursor

	}

	shoot (){

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

	select ( obj, inters ) {

		if( !this.mouseDown || this.selected === obj ) return 'pointer'

		let pos = inters.point
	    let quat = [0,0,0,1]
		
		this.selected = obj
		if( this.selected.isInstance ) quat = this.selected.instance.getInfo(this.selected.id).quat;
		else if( this.selected.isObject3D ){
			this.selected.updateMatrix()
			quat = this.selected.quaternion.toArray()
		}

		
	    root.scenePlus.add( this.dragPlane )
	    this.dragPlane.rotation.set( 0, this.controler.getAzimuthalAngle(), 0 )
	    this.dragPlane.position.copy( pos )

	    let p = pos.toArray()

	    root.motor.change({ name:this.selected.name, neverSleep:true, wake:true })
		//Motor.add({ name:'mouse', type:'sphere', size:[0.01], pos:p, quat:quat, mask:0, density:0, noGravity:true, kinematic:true, flags:'noCollision' })
		//root.motor.add({ name:'mouse', type:'null', pos:p, quat:quat })
		root.motor.add([
			{ name:'mouse', type:'null', pos:p, quat:quat },
			{ 
				name:'mouseJoint', type:'joint', mode:'fixe',//mode:'spherical',
				b1:this.selected.name, b2:'mouse', worldAnchor:p, //sd:[4,1]
				//tolerance:[1, 10],
				//noPreProcess:true,
				//improveSlerp:true,
				visible:false,
				noFix:true,
			}
		])
		

		this.raycastTest = false
		this.controler.enabled = false

		return 'move'

	}

	unSelect () {

		if( this.selected === null ) return

		this.dragPlane.geometry.dispose()
		root.scenePlus.remove( this.dragPlane )
		root.motor.remove(['mouseJoint','mouse'])
		root.motor.change({ name:this.selected.name, neverSleep:false, wake:true })
		
		this.raycastTest = true
		this.selected = null
		this.firstSelect = true
		this.controler.enabled = true

	}


}