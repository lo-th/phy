import {
    Mesh, PlaneGeometry, Raycaster, Vector2, MeshBasicMaterial
} from 'three';

import { root, math } from './root.js';

export class MouseTool {

	constructor ( controler, mode = 'drag' ) {

		this.mode = mode

		this.controler = controler
		this.dom = this.controler.domElement

		this.selected = null

		this.isActive = false
		this.rayTest = false
		this.firstSelect = false
		this.mouseDown = false
		this.mouseDown2 = false
		this.mouseMove = false
		this.controlFirst = true;

		this.mouse = new Vector2()
		this.oldMouse = new Vector2()
		this.ray = new Raycaster()
		this.ray.far = 1000;


		this.dragPlane = new Mesh( new PlaneGeometry( 1, 1 ), new MeshBasicMaterial({ visible:false, toneMapped: false }) )
	    this.dragPlane.castShadow = false
	    this.dragPlane.receiveShadow = false
	    this.dragPlane.scale.set( 1, 1, 1 ).multiplyScalar( 200 )

	    if( this.mode === 'drag' ) this.activeDragMouse( true )

	}

    setMode ( mode ) {

    	if( mode !== this.mode )
    	this.mode = mode

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
		        this.rayTest = true
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
		this.rayTest = true
	}

	controleChange ( e ) {
		let state = this.controler.getState();
		if( state !== -1 ){
			if( this.controlFirst ) this.controlFirst = false;
			else this.rayTest = false;
		}
	}

	mousedown ( e ) {

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

	}

	mouseup ( e ) {

		this.mouseMove = this.oldMouse.distanceTo( this.mouse ) < 0.01 ? false : true
		this.mouseDown = false
		this.mouseDown2 = false
		this.unSelect();

	}

	mousemove ( e ) {

		this.mouse.x =   ( e.offsetX / this.dom.clientWidth ) * 2 - 1
		this.mouse.y = - ( e.offsetY / this.dom.clientHeight ) * 2 + 1

		//console.log(this.mouse)
		this.castray();

	}

	castray () {

		let inters, m, g, h, id, cursor = 'auto';

		if( this.selected !== null ){

			this.ray.setFromCamera( this.mouse, this.controler.object )
			inters = this.ray.intersectObject( this.dragPlane )
			if ( inters.length ) root.motor.change({ name:'mouse', pos:inters[0].point.toArray() }, true )

		}

		if( !this.rayTest ) return;

		this.ray.setFromCamera( this.mouse, this.controler.object )
		inters = this.ray.intersectObjects( root.scene.children, true )

		if ( inters.length > 0 ) {

			g = inters[ 0 ].object;
			id = inters[ 0 ].instanceId;

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

		//Motor.add({ name:'mouse', type:'sphere', size:[0.01], pos:p, quat:quat, mask:0, density:0, noGravity:true, kinematic:true, flags:'noCollision' })
		root.motor.add({ name:'mouse', type:'null', pos:p, quat:quat })
		root.motor.add({ 
			name:'mouseJoint', type:'joint', mode:'fixe',//mode:'spherical',
			b1:this.selected.name, b2:'mouse', worldAnchor:p, //sd:[4,1]
			//tolerance:[1, 10],
			//noPreProcess:true,
			//improveSlerp:true,
			visible:false,
			noFix:true,
		})
		root.motor.change({ name:this.selected.name, neverSleep:true })

		this.rayTest = false
		this.controler.enabled = false

		return 'move'

	}

	unSelect () {

		if( this.selected === null ) return;

		this.dragPlane.geometry.dispose()
		root.scenePlus.remove( this.dragPlane )
		root.motor.remove('mouseJoint')
		root.motor.remove('mouse')
		root.motor.change({ name:this.selected.name, neverSleep:false, wake:true })
		
		this.rayTest = true
		this.selected = null
		this.firstSelect = true
		this.controler.enabled = true

	}


}