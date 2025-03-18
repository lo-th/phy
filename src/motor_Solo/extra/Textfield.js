import { MathTool } from '../../core/MathTool.js';
import { root } from '../root.js';
import { Mesh, PlaneGeometry, Vector3, MeshBasicMaterial, CanvasTexture, Texture } from 'three';

let Nb = 0

export class Textfield extends Mesh {

	constructor( o={} ) {

		super( new PlaneGeometry(), new MeshBasicMaterial({polygonOffset: true, polygonOffsetFactor: -4}))

		this.name = o.nam || 'text'
		this.canvas = null

		this.w = o.w || 0
		this.h = o.h || 0

		this.weight = o.weight ?? 700;

		this.font = o.font ?? "'Mulish', sans-serif";
		this.fontSize = o.fontSize ?? 32;
		this.backgroundColor = o.backgroundColor ?? "#00000000";
		this.fontColor = o.fontColor ?? "#FFFFFF";
		this.material.alphaTest = 0.5
		this.set( o.text )
		
		if( o.pos ) this.position.fromArray(o.pos)
		if( o.rot ) this.quaternion.fromArray( MathTool.quatFromEuler( o.rot ) )
		
	}

	set( str ){

		if(!this.canvas) this.canvas = document.createElement("canvas");
		let ctx = this.canvas.getContext("2d"), w, h, r
		
		ctx.font = this.weight + " " + this.fontSize + "px " + this.font;
		

		let metrics = ctx.measureText( str );

		//resize to nearest power of 2
		w = 2 ** Math.ceil(Math.log2(metrics.width));
		h = 2 ** Math.ceil(Math.log2(ctx.measureText('M').width));



		
		this.canvas.width = w;
		this.canvas.height = h;

		ctx.fillStyle = this.backgroundColor;
		ctx.fillRect(0, 0, w, h);
		//var backgroundAlpha = ctx.getImageData(0, 0, 1, 1).data[3];

        ctx.fillStyle = this.fontColor;
		//ctx.font = this.fontSize + "px " + this.font;
		ctx.font = this.weight + " " + this.fontSize + "px " + this.font;
		ctx.textAlign = "center";
		ctx.textBaseline = 'middle';
		
		ctx.fillText( str, w*0.5, h*0.5 );

		this.material.map = new CanvasTexture(this.canvas);

		//if(this.w===0) this.w = w*0.02

		if( this.h !== 0 ){
			r = this.h / h
			this.scale.set(w*r,this.h,0)
		}

		else if( this.w !== 0 ){
			r = this.w / h
			this.scale.set(this.w,h*r,0)
		}

		else {
			this.scale.set(w*0.025,h*0.025,0)
		}


		//this.scale.set(this.w,h*r,0)

		/*let img = new Image(w, h);
        img.src = canvas.toDataURL( 'image/png' );

        let self = this

        img.onload = ()=>{

			//
			self.material.map = new Texture(img);
			self.material.map.needsUpdate = true
			//self.material.needsUpdate = true

			self.scale.set(w*0.05,h*0.05,0)
		}*/

	}

	dispose(){

		this.parent.remove(this)
		this.material.map.dispose();
		this.material.dispose();
		this.geometry.dispose();

	}

}
