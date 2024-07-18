import {
    Color, Float32BufferAttribute, ShapeGeometry, Mesh, MeshBasicMaterial, DoubleSide, BufferGeometry
} from 'three';
import { mergeGeometries } from '../jsm/utils/BufferGeometryUtils.js';
import { SVGLoader } from '../jsm/loaders/SVGLoader.js';

export class AutoSvg extends Mesh {

	constructor ( model, option = {}, material = null  ) {

		super();

		this.model = model;

		this.material = material;
		this.outMaterial = material ? true : false;

		this.XML = new XMLSerializer();
		this.color = new Color();
		this.opacity = 1;
		this.svgLoader = new SVGLoader();
		this.base = "http://www.w3.org/2000/svg";
		this.svg = document.createElementNS( this.base, 'svg' );
		this.layerUp = 0.0001
		this.fill = true;
		this.stroke = true;

		this.size = option.size || 1
		this.scaler = 1/this.size;

		//let w = 10
		//this.set( { viewBox:'0 0 '+w+' '+w, width:w, height:w, preserveAspectRatio:'none' })

		if( !this.model ) return;

		let o = {
			radius: 5, 
			min:90, 
			max:90, 
			strokeSize:0.25,
			...option
		}

		switch( this.model ){

			case 'angle':
			this.fill = o.fill !== undefined ? o.fill : true;
	        this.stroke = o.stroke !== undefined ? o.stroke : true;
	        let min = Math.abs(o.min);
			this.add( 'path', { d: this.circle(0,0, o.radius, 180,180+o.max, true ), stroke:'none', fill:'#FF0000', 'fill-opacity':0.1 } );
			this.add( 'path', { d: this.circle(0,0, o.radius, 180,180+o.max, false, false, 0.3), stroke:'#FF0000', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'round' } );
			this.add( 'path', { d: this.circle(0,0, o.radius, 180-min,180, true ), stroke:'none', fill:'#0050FF', 'fill-opacity':0.1 } );
	        this.add( 'path', { d: this.circle(0,0, o.radius, 180-min,180, false, false, 0.3, true), stroke:'#0050FF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'round' } );
			break;

			case 'liner':
			let r = o.radius*0.5;
			let y1 = o.max*this.scaler;
			let y2 = o.min*this.scaler;
			this.fill = o.fill !== undefined ? o.fill : true;
	        this.stroke = o.stroke !== undefined ? o.stroke : true;
	        this.add( 'path', { d: this.segment({x:-r, y:0}, {x:r, y:0} ), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        this.add( 'path', { d: this.segment({x:-r, y:y1}, {x:r, y:y1} ), stroke:'#FF0000', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        this.add( 'path', { d: this.segment({x:-r, y:y2}, {x:r, y:y2} ), stroke:'#0050FF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        //
	        this.add( 'path', { d: this.segment({x:0, y:0}, {x:0, y:y1} ), stroke:'#FF0000', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        this.add( 'path', { d: this.segment({x:0, y:0}, {x:0, y:y2} ), stroke:'#0050FF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
	        break;

			case 'needle':
			this.fill = o.fill !== undefined ? o.fill : true;
	        this.stroke = o.stroke !== undefined ? o.stroke : true;
			this.add( 'path', { d: this.circle(0,0, 0.7, 0, 360, false, true, 0), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
			this.add( 'path', { d: this.segment({x:0, y:0}, {x:0, y:4.4} ), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'round' } );
			break;

			case 'middle':
			let mm = o.radius*0.5;
			this.fill = o.fill !== undefined ? o.fill : true;
	        this.stroke = o.stroke !== undefined ? o.stroke : true;
			this.add( 'path', { d: this.circle(0,0, 0.7, 0, 360, false, true, 0), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
			this.add( 'path', { d: this.segment({x:0, y:-mm}, {x:0, y:mm} ), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
			this.add( 'path', { d: this.segment({x:-mm, y:0}, {x:mm, y:0} ), stroke:'#FFFFFF', 'stroke-opacity':1, 'stroke-width':o.strokeSize, fill:'none', 'stroke-linecap':'butt' } );
			break;


		}

		this.toMesh();

	}

	raycast(){
		return false;
	}

	update( option = {} ){

		let o = {}

		switch( this.model ){

			case 'angle':

			o = {
				radius: 5,
				min:-90,
				max:90,
				...option
			}

			let min = Math.abs(o.min)

			this.change( 'd', this.circle(0,0, o.radius, 180,180+o.max, true ), 0 );
			this.change( 'd', this.circle(0,0, o.radius, 180,180+o.max, false, false, 0.3), 1 );

			this.change( 'd', this.circle(0,0, o.radius, 180-min,180, true ), 2 );
	        this.change( 'd', this.circle(0,0, o.radius, 180-min,180, false, false, 0.3, true), 3 );



			break;

		}

		if( option.wireframe !== undefined ) this.material.wireframe = option.wireframe

		// redraw
	    this.fill = o.fill !== undefined ? o.fill : true
	    this.stroke = o.stroke !== undefined ? o.stroke : true
		this.toMesh()

	}

	// SVG SIDE

	set( o = {}, parent ){
		for( let t in o ){
            if( parent ) parent.setAttributeNS( null, t, o[ t ] );
            else this.svg.setAttributeNS( null, t, o[ t ] );
        }
	}

	add( type, o = {} ){

		let g = document.createElementNS( this.base, type );
		this.set( o, g );
		this.svg.appendChild( g );

	}

	change( type, value, id ){

		this.svg.childNodes[ id ].setAttributeNS( null, type, value );

	}

	getString(){
		return this.XML.serializeToString(this.svg);
	}

	polarToCartesian( x, y, radius, angleInDegrees ){
	    var rad = (angleInDegrees-90) * Math.PI / 180.0;
	    return { x: x + (radius * Math.cos(rad)), y: y + (radius * Math.sin(rad)) };
	}

	circle( x, y, radius, startAngle = 0, endAngle = 360, tri = false, close = false, endTag = 0, over=false ){

		if( startAngle === 0 && endAngle === 360 ){ startAngle = 0.0001; close = true; }
	    let start = this.polarToCartesian(x, y, radius, endAngle);
	    let end = this.polarToCartesian(x, y, radius, startAngle);
	    let arcSweep = endAngle - startAngle <= 180 ? "0" : "1";
	    let d = [
	        "M", start.x, start.y, 
	        "A", radius, radius, 0, arcSweep, 0, end.x, end.y,
	    ];
	    if( tri ) d.push(
	    	"L", x,y,
	    	"L", start.x, start.y
	    )
	    if( close ) d.push( 'Z');

		if( endTag!==0 ){
			let p1 = this.polarToCartesian(x, y, radius-endTag, over ? startAngle:endAngle);
			let p2 = this.polarToCartesian(x, y, radius+endTag, over ? startAngle:endAngle);
			d.push( 'M', p1.x, p1.y,"L", p2.x, p2.y);
		}

	    return d.join(" ");

	}

	segment( p1, p2 ){
		let d = [ 'M', p1.x, p1.y,"L", p2.x, p2.y ];
		return d.join(" ");
	}

	// THREE SIDE

	geomColor( g, color, opacity = 1 ){

		let i = g.attributes.position.count;
		let cc = []//, aa = []
		while(i--){ 
			cc.push( color.r, color.g, color.b, opacity )
			//aa.push( opacity )
		}

		//g.setAttribute( 'opacity', new Float32BufferAttribute( aa, 1 ) );
		g.setAttribute( 'color', new Float32BufferAttribute( cc, 4 ) );

	}

	toGeometry(){

		if ( !this.fill && !this.stroke ) return null;

		let geom = [];
		let layer = 0;
		let opacity = 1;
		let data = this.svgLoader.parse( this.getString() );
		
		for ( const path of data.paths ) {

			// FILL
			const fillColor = path.userData.style.fill;
			if ( this.fill && fillColor !== undefined && fillColor !== 'none' ) {

				this.color.setStyle( fillColor )
				opacity = path.userData.style.fillOpacity;
				if( opacity < this.opacity ) this.opacity = opacity;

				const shapes = SVGLoader.createShapes( path );

				for ( const shape of shapes ) {

					const geometry = new ShapeGeometry( shape );
					if ( geometry ) {

						this.geomColor( geometry, this.color, opacity );

						let gg = new BufferGeometry().copy(geometry).toNonIndexed()
						gg.translate( 0, 0, -layer*this.layerUp );
						geom.push( gg )

						layer++
					}

				}
			}

			// STROKE
			const strokeColor = path.userData.style.stroke;
			if ( this.stroke && strokeColor !== undefined && strokeColor !== 'none' ) {

				this.color.setStyle( strokeColor )
				opacity = path.userData.style.strokeOpacity;
				if( opacity < this.opacity ) this.opacity = opacity;

				for ( const subPath of path.subPaths ) {

					const geometry = SVGLoader.pointsToStroke( subPath.getPoints(), path.userData.style, 6 );
					if ( geometry ) {
						this.geomColor( geometry, this.color, opacity );

						geometry.translate( 0, 0, -layer*this.layerUp );

						//console.log(geometry)
						geom.push( geometry )

						layer++
					}
				}
			}

		}

		return geom;

	}

	toMesh(){

		let s = this.size;

		if( this.geometry ) this.geometry.dispose();
		
		let tmpG = this.toGeometry();
        
        if( tmpG ){
		    this.geometry = mergeGeometries( tmpG );
			this.geometry.scale( s, -s, s );
			this.geometry.rotateY( Math.PI );
			this.geometry.rotateZ( -Math.PI*0.5 );
			this.geometry.rotateY( Math.PI*0.5 );
			this.geometry.computeBoundingSphere();
		} else {
			this.geometry = new BufferGeometry();
		}

		if( this.material === null ){ 
			this.material = new MeshBasicMaterial({ vertexColors:true, transparent:this.opacity!==1, side:DoubleSide })
			this.material.defines = { 'USE_COLOR_ALPHA': '' }
		}

	}

	dispose(){
		
		if( this.material && !this.outMaterial ) this.material.dispose()
		if( this.geometry ) this.geometry.dispose()
	}

}

