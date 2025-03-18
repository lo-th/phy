import {
    Mesh, PlaneGeometry, Raycaster, Vector2, Vector3, MeshBasicMaterial, Line, BufferGeometry, Float32BufferAttribute
} from 'three';

import { root } from '../root.js';
import { Mat } from '../base/Mat.js';


//----------------
//  MOUSE TOOL 
//----------------

export class MouseTool {

	constructor ( controler, mode = 'drag' ) {

		this.needRay = false;

		//this.tmpSelected = null

		//root.viewSize = { w:window.innerWidth, h:window.innerHeight, r:0}
		//root.viewSize.r = root.viewSize.w/root.viewSize.h

		this.moveDirect = false
		this.moveDeep = false

		this.mode = mode
		this.option = {}

		this.overObj = null

		this.controler = controler
		this.dom = this.controler.domElement

		//this.dom.style.cursor =  "url('./assets/icons/logo.png'), move";

		this.selected = null
		this.buttonRef = null
		this.release = false

		this.numBullet = 0
		this.maxBullet = 10

		this.sticky = false

		this.pz = 0

		this.isActive = false
		this.raycastTest = false
		this.firstSelect = false
		this.mouseDown = false
		this.mouseDown2 = false
		this.mouseMove = false
		//this.controlFirst = true;

		this.decal = new Vector3()
		this.tmpPos = new Vector3()
		this.tmpD = new Vector3()

		this.mouse = new Vector2()
		this.oldMouse = new Vector2()
		this.raycast = new Raycaster()
		this.raycast.far = 1000;

		this.button = 0

		this.pos = new Vector3()
		this.velocity = new Vector3()
		this.angle = 0

		this.helper = null
		this.dragPlane = null;
		this.overLock = false;

	    //if( this.mode === 'drag' ) 
	    this.activeDragMouse( true )

	}

	addDrag(){

		if( this.dragPlane ) return

		//this.overLock = true;

		this.helper = new MoveHelper()
		this.dragPlane = new Mesh( new PlaneGeometry( 1, 1 ), Mat.get('hide') )
	    this.dragPlane.castShadow = false
	    this.dragPlane.receiveShadow = false
	    this.dragPlane.scale.set( 1, 1, 1 ).multiplyScalar( 200 )

	    root.scenePlus.add( this.helper )
	    root.scenePlus.add( this.dragPlane )

	}

	clearDrag(){

		if( !this.dragPlane ) return

		//this.overLock = false;

		root.scenePlus.remove( this.dragPlane );
		root.scenePlus.remove( this.helper );

		this.dragPlane.geometry.dispose();
		this.helper.geometry.dispose();

		this.dragPlane = null;
		this.helper = null;

	}

    setMode ( mode, o = {} ) {

    	if( mode === this.mode ) return
    	this.mode = mode;
        this.option = o;

        if( this.mode === 'blast' && this.option.visible ) root.motor.initParticle()

    }

	activeDragMouse ( b ) {

		if( b ){
			if( !this.isActive ){
				this.dom.addEventListener( 'pointermove', this.mousemove.bind(this), false )
		        this.dom.addEventListener( 'pointerdown', this.mousedown.bind(this), false )
		        document.addEventListener( 'pointerup', this.mouseup.bind(this), false )
		        //document.addEventListener( 'contextmenu', this.contextmenu.bind(this), false )

		        this.controler.addEventListener( 'end', this.controleEnd.bind(this), false )
		        this.controler.addEventListener( 'start', this.controleStart.bind(this), false )
		        //this.controler.addEventListener( 'change', this.controleChange.bind(this), false )

		        this.isActive = true;
		        this.raycastTest = true;
		    }

		} else {
			if( this.isActive ){
				this.dom.removeEventListener( 'pointermove', this.mousemove.bind(this) )
			    this.dom.removeEventListener( 'pointerdown', this.mousedown.bind(this) )
			    document.removeEventListener( 'pointerup', this.mouseup.bind(this) )

			    this.controler.removeEventListener( 'end', this.controleEnd.bind(this) )
			    this.controler.removeEventListener( 'start', this.controleStart.bind(this), false )
		        //this.controler.removeEventListener( 'change', this.controleChange.bind(this) )

			    this.isActive = false;
			}
		}
	}

	controleEnd ( e ) {
		//this.controlFirst = true
		this.raycastTest = true
		if( this.controler.getInfo ) this.controler.getInfo();
	}

	controleStart ( e ) {
		this.raycastTest = false
	}

	controleChange ( e ) {

		

		

		//let state = this.controler.getState();

		//if( state !== -1 ) this.raycastTest = false;

		/*let state = this.controler.getState();
		console.log(state)
		if( state !== -1 ){
			if( this.controlFirst ) this.controlFirst = false;
			else this.raycastTest = false;
		}*/

		//this.controler.getInfo();
	}

	getMouse ( e ) {

		if(root.viewSize){
			this.mouse.x =   ( e.offsetX / root.viewSize.w ) * 2 - 1;
		    this.mouse.y = - ( e.offsetY / root.viewSize.h ) * 2 + 1;
		} else {
			this.mouse.x =   ( e.offsetX / this.dom.clientWidth ) * 2 - 1;
			this.mouse.y = - ( e.offsetY / this.dom.clientHeight ) * 2 + 1;
		}

		//console.log(e.button)
		
		this.button = e.pointerType !== 'touch' ? e.button : 0;
		//if(this.button===2)this.moveDeep = !this.moveDeep

	}

	contextmenu ( e ) {
		//e.preventDefault();
		//this.mouseDown2 = true
		//this.controler.enabled = false;
		/*if( this.mouseDown ){

			//this.moveDeep = true
			console.log('yo ')
		}*/
	}

	mousedown ( e ) {

		if( this.sticky ){ 
			this.unSelect()
			console.log('unstick')
		}

		this.getMouse( e )
		//this.overLock = true;

		switch( this.mode ){

			case 'drag': this.drag(); break;
			case 'shoot': this.shoot(); break;
			case 'blast': this.blast(); break;
			case 'build': this.build(); break;

		}

	}

	mouseup ( e ) {

		//console.log('up')

		this.release = true;
		//this.overLock = false;

		document.body.style.cursor = 'auto'

		this.mouseMove = this.oldMouse.distanceTo( this.mouse ) < 0.01 ? false : true
		this.mouseDown = false
		this.mouseDown2 = false
		root.mouseDown = false



		if( this.sticky ) { this.controler.enabled = true; return; }

		this.unSelect()
		this.resetButton()

	}

	mousemove ( e ) {

		//if( this.release ) this.release = false;

		switch( this.mode ){

			case 'drag':
			this.getMouse( e )
			this.needRay = true;
		    //this.castray()
			break

		}

	}

	castray () {

		let inters, m, g, h, id, cursor = 'auto'

		if( this.selected !== null ){

			this.raycast.setFromCamera( this.mouse, this.controler.object )
			inters = this.raycast.intersectObject( this.dragPlane )
			if ( inters.length && this.mouseDown ){ 
				this.moveSelect( inters[0].point )
				//if( this.moveDirect ) root.motor.change({ name:this.selected.name, pos:inters[0].point.toArray() }, true )
				//else root.motor.change({ name:'mouse', pos:inters[0].point.toArray() }, true )
			}
			//return
		} else {

			if( !this.raycastTest ) return;

			//this.controler.enabled = false

			this.controler.enableRotate = false
			this.controler.enablePan = false

			this.raycast.setFromCamera( this.mouse, this.controler.object )

			inters = this.raycast.intersectObjects( root.scene.children, true )

			this.tmpSelected = null

			if ( inters.length > 0 ) {

				g = inters[ 0 ].object;
				id = inters[ 0 ].instanceId;

				//console.log(inters[ 0 ])

				if( id !== undefined ){
					// is instance mesh
					m = root.motor.byName( g.getByName( id ) );
					//m = root.motor.byName( g.name+id );
				} else {
					if( g.parent !== root.scene ){
						h = g.parent;
						if( h.parent !== root.scene ) m = h.parent;
						else m = h;
					} else m = g;
				}

				if( this.mouseDown2 ){
					if( m.extra ) m.extra( m.name );
					//console.log(m)
				}

				if( m && !m.isButton ){
					cursor = this.select( m, inters[ 0 ].point );
					//this.tmpSelected = m
					//this.tmpPoint = inters[ 0 ].point
				}
				else cursor = this.actionButton( m, inters[ 0 ] );
				//document.body.style.cursor = cursor

			} else {

				this.resetOver()
				this.controler.enableRotate = true
				this.controler.enablePan = true
				
				//this.controler.enabled = true
			}

			//console.log(this.release, cursor)
			if( this.release ){
				this.release = false
				this.controler.enableRotate = true
				this.controler.enablePan = true
				cursor = 'auto'
				this.resetOver()
				
			}

			document.body.style.cursor = cursor
		}

	}

	drag () {

		if( !this.mouseDown ){
			if( this.firstSelect ) this.firstSelect = false
			this.oldMouse.copy( this.mouse )
		}

		if( this.button === 2 ){
		    this.mouseDown2 = true
		    //this.castray()
		}

	    //if( this.button === 0 ){
		    this.mouseDown = true
		    root.mouseDown = true
		    this.needRay = true;

		    //if(this.tmpSelected!== null) this.select(this.tmpSelected, this.tmpPoint )
		    //this.castray()
		//}

		

	}

	blast () {

		let hit = null
		this.raycast.setFromCamera( this.mouse, this.controler.object )
		let inters = this.raycast.intersectObjects( root.scene.children, true )

		if ( inters.length > 0 ) {

			if( !inters[ 0 ].object.isButton ) hit = inters[ 0 ]
			else inters[ 0 ].object.parent.userData.direct()
				
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
		//this.controler.enabled = true
		this.controler.enableRotate = true
		this.controler.enablePan = true

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

		//if( this.mouseDown ) this.controler.enabled = false
		   
		//return 'grab'
	    return 'pointer'

	}

	setOver( obj ){

		//if( this.overLock ) return;
		if( !obj ) return;

		if( this.overObj ){
			if( obj.name !== this.overObj.name ) this.resetOver();
		}

		this.overObj = obj;
		if( this.overObj.over ) this.overObj.over(true);

	}

	resetOver(){

		//if( this.overLock ) return;
		if( !this.overObj ) return;
		if( this.overObj.over ) this.overObj.over( false );
		this.overObj = null;

	}

	select ( obj, point ) {

		//this.controler.enabled = false

		//if( this.selected !== null ) return 'pointer'
		//if( !this.mouseDown ) return 'auto'
		//if( this.selected === obj ) return 'grab'//'pointer'

		if( !this.mouseDown ) this.setOver( obj );

		

		if( !this.mouseDown || this.selected === obj ){
			return 'grab'
		}

		//this.overLock = true;


		this.pz = 0

		let pos = point
	    let quat = [0,0,0,1]

		this.selected = obj;
		//this.setOver( obj );
		/*if( this.selected.isInstance ) quat = this.selected.instance.getInfo( this.selected.id ).quat;
		else if( this.selected.isObject3D ){
			this.selected.updateMatrix()
			quat = this.selected.quaternion.toArray()
		}*/

		this.decal.copy( pos ).sub( this.selected.position )
		this.tmpPos.copy( pos ).sub( this.decal )
		this.angle = this.controler.getAzimuthalAngle()


		

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

		this.addDrag()

		//8root.scenePlus.add( this.helper )
	    //root.scenePlus.add( this.dragPlane )

	    this.dragPlane.rotation.set( 0, this.angle, 0 )
	    this.dragPlane.position.copy( pos )
	    this.dragPlane.position.y = 0

	    this.helper.position.copy( pos )


	    let p = pos.toArray()

	    let revert = false

	    root.motor.change({ name: this.selected.name, neverSleep:true, wake:true })
		//Motor.add({ name:'mouse', type:'sphere', size:[0.01], pos:p, quat:quat, mask:0, density:0, noGravity:true, kinematic:true, flags:'noCollision' })
		//root.motor.add({ name:'mouse', type:'null', pos:p, quat:quat })

		//let def = [-0.03, 0.03, 60, 5]
		//let defr = [-3, 3, 60, 5]

		//let def = [-0.03, 0.03, 60, 2]
		//let defr = [-3, 3, 60, 2]

		if( this.moveDirect ){
			root.motor.change({ name:this.selected.name, kinematic:false, gravity:false, damping:[0.9,0.9]  })
		} else {
			let def = [-0.1, 0.1, 600, 1]
			let defr = [-0.1, 0.1, 600, 1]
			//let defr = [0, 0]
			let notUseKinematic = root.engine === 'OIMO' || root.engine ==='RAPIER' || root.engine ==='JOLT'//|| root.engine ==='HAVOK'
			let jtype = this.selected.link === 0 ? 'fixe' : 'd6';//root.engine === 'HAVOK' ? 'fixe' : 'd6';

			if( root.engine === 'JOLT' ) jtype = 'fixe';

			let limite = [['x',...def], ['y',...def], ['z',...def], ['rx',...defr], ['ry',...defr], ['rz',...defr]]

			if( root.engine === 'HAVOK' ) limite = [ ['x',...def], ['y',...def], ['z',...def] ]

			if( root.engine === 'OIMO' ){
				revert = true;
				jtype = this.selected.link === 0 ? 'fixe' : 'spherical';
				limite = [ ['x',...def], ['y',...def], ['z',...def] ]
				//if(this.selected.link !== 0)
				//limite = [ 4.0, 1.0 ]
			}

			if( root.engine === 'HAVOK' ){
				revert = true;
				jtype = this.selected.link === 0 ? 'fixe' : 'spherical';
				limite = [ -180, 180, 0.1, 0.1 ]
			}

			//console.log(jtype)

			root.motor.add([
				{ 
					name:'mouse', 
					type:'null', 
					pos:p, 
					quat:quat, 
					kinematic:notUseKinematic ? false : true,
					//mass:10,///10000000,
					//gravityFactor:0, 
				},
				{ 
					name:'mouseJoint', type:'joint',
					mode:jtype,
					lm:limite,
					sd:[4.0, 1.0],
					autoDrive: true,
					b1:revert ? this.selected.name : 'mouse',
					b2:revert ? 'mouse' : this.selected.name,  
					worldAnchor: p, 
					//worldQuat: quat,

					/*pos1: p, 
					quat1: quat,
					pos2: [0,0,0], 
					quat2: [0,0,0,1],*/
					//worldAxis:[1,0,0],
					visible:false,
				}
			])

		}
		

		//this.raycastTest = false
		//this.controler.enabled = false

		//document.body.style.cursor = 'move'

		return "grabbing"//"url('./assets/icons/point.png') 8 8, move" //'move'

	}

	moveSelect ( point ) {

		if( this.selected === null ) return

		//this.setTmpOver( this.selected )

		if( point ){ 
			this.tmpPos.copy( point ).sub( this.decal ) 
		}

		if( this.moveDeep ){ // Z deep move

			let y = this.selected.position.y
			let diff  = y-this.tmpPos.y
			this.tmpPos.y = y
			this.tmpD.set(0,0,diff).applyAxisAngle({x:0, y:1, z:0}, this.angle)
			this.tmpPos.add( this.tmpD )

		}

		this.helper.position.copy( this.tmpPos )

		let pos = this.tmpPos.toArray()

		if( this.moveDirect ){ 
			root.motor.change({ name:this.selected.name, pos:pos, reset:true })
		} else {
			root.motor.change({ name:'mouse', pos:point.toArray(), lockPos:true }, true )
		}
	}

	unSelect () {

		if( this.selected === null ) return

		this.resetOver()
		this.clearDrag()

		if( this.moveDirect ){
			root.motor.change({ name:this.selected.name, kinematic:false, wake:true, gravity:true, damping:[0,0.1] })
		} else {
			root.motor.remove(['mouseJoint','mouse'])
			root.motor.change({ name:this.selected.name, neverSleep:false, wake:true })
		}
		
		this.raycastTest = true;
		this.selected = null;
		this.firstSelect = true;
		
		//this.controler.enabled = true

	}

	step(){

		if( this.needRay ) this.castray()
	    this.needRay = false;

		if( this.selected === null ) return

		let key = root.flow.key


		if( key[1] !== 0 ){
			let pz = key[1] * 0.1
			this.dragPlane.translateZ(pz)
			this.needRay = true;
		}



		//this.castray()
		if( this.moveDirect ) this.moveSelect()

		

	}


}






class MoveHelper extends Line {

	constructor( o = {} ) {

		super( new BufferGeometry(), Mat.get('line') );

		let c = 0.75

		const positions = [0,0,0, 0,-100,0]
	    const colors = [c,c,c, 0,0,0]

	    //this.geometry = new BufferGeometry();
	    this.geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
	    this.geometry.setAttribute( 'color', new Float32BufferAttribute( colors, 3 ) );
	    //this.geometry.computeBoundingSphere();

	    this.vertices = this.geometry.attributes.position;
	    this.colors = this.geometry.attributes.color;
	    this.local = [ 0, 0, 0, 0, 0, 0, 0, 0, 0 ];

	    //this.matrixAutoUpdate = false;
	    this.frustumCulled = false;

	}
}