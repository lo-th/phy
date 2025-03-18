import { MathTool } from '../../core/MathTool.js';
import { root } from '../root.js';
import { Textfield } from './Textfield.js';

let Nb = 0

export class Button {

	constructor ( o={} ) {

		this.down = false


		this.time = o.time || 250

		this.p = o.pos || [0,0,0]

		this.type = o.type || 'box'
		this.name = o.name || 'button' + Nb++
		this.pos = o.pos || [0,0,0]
		this.size = o.size || [1,1,1];
		this.radius = o.radius || 0;
		this.axe = o.axe !== undefined ? o.axe : 1

		this.fontSize = o.fontSize || 0.8 
		this.fontScale = o.fontScale || 1.0;

		this.extraForce = true 


		this.decal = this.type === 'sphere'? this.size[1]*0.5 : (this.size[1]*0.5) - this.radius

		if( this.type !== 'sphere' ) this.pos[ this.axe ] += this.decal


		this.origin = this.pos[this.axe]
	    let height = this.size[this.axe]-(this.radius*2)

		//this.range = [ this.origin - this.decal - (this.radius*2), this.origin ]
		this.range = [ this.origin - height, this.origin ]

		this.value = this.origin
		this.target = this.origin

		this.speed = (this.size[this.axe]/3) / (this.size[this.axe])

	

		this.callback = function(){ 
			console.log("action down") 
		}

		if( o.callback ){ 
			this.callback = o.callback 
			delete o.callback
		}

		o.button = true
		o.pos = this.pos 
		if(!o.material) o.material = 'button'
		o.kinematic = true
		o.mask = 1

		

		this.timeout = null

		// add model & physics
		this.b = root.motor.add( o )

		this.b.userData['action'] = this.action.bind(this)
		this.b.userData['out'] = this.out.bind(this)

		// is bad ?
		this.b.userData['direct'] = this.callback.bind(this)

		// extra text on top 
		if( o.text ) this.addText( o.text )

	}

	addText( txt, size ){

		this.fontSize = this.type==='box' ? this.size[this.axe] * 0.8 : this.size[0] * 0.8
		this.fontSize *= this.fontScale
		let dt = { text:txt, pos:[ 0,this.size[1]*0.5,0 ], rot:[-90,0,0], h:this.fontSize };
		if( this.axe === 2 ) dt = { text:txt, pos:[ 0,0, this.size[2]*0.5 ], rot:[0,0,0], h:this.fontSize };
		this.txt = new Textfield( dt )
		this.b.add( this.txt )

	}

	action( p ){

		if( this.down ) return

		this.down = true
	    this.target = this.range[0]
	    if(this.extraForce) root.motor.explosion( p || this.p, this.size[0]*2, 0.01 )
		this.callback()

	}

	out(){

		if(!this.down) return

		this.down = false
	    this.target = this.range[1]
	    if(this.extraForce) root.motor.explosion( this.p, this.size[0]*2, 0.01 )

	}

	update(){

		if( this.value !== this.target ){

			//let side = this.target > this.value ? 1 : -1

			this.value = MathTool.lerp( this.value, this.target, this.speed )

			//this.value += 0.1 * side

			let t = MathTool.nearEquals( this.value, this.target, 0.0001)

			if(!t){
			    this.pos[this.axe] = this.value
			    root.motor.change( {name:this.b.name, pos:this.pos} );
			} else {
				this.value = this.target
			}


		}

	}

	dispose(){

		if(this.txt) this.txt.dispose()
	}

}