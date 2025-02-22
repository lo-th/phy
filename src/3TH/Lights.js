import {
	Group,
	DirectionalLight, HemisphereLight, SpotLight, PointLight, AmbientLight, RectAreaLight,
	CameraHelper, HemisphereLightHelper, Color, PointLightHelper, SpotLightHelper
} from 'three';

import { DirectionalHelper } from './helpers/DirectionalHelper.js'


let light = [];
let LL = {};
let helper = [];
let debug = false;


export class Lights {

	//get debug() { return debug; }
    //set debug( value ) { Lights.debug(value) }

    static define ( o = {}, parent, isWebGPU = false ) {

    	let biasSide = o.shadowType === 'PCSS' ? -1:1

    	Lights.add({ 
			type:'direct', name:'sun',
			intensity:o.direct,
			distance:30, parent:parent,
		    shadow:{ range:30, near:5, far:70, bias: - 0.0005 * biasSide, radius:4, quality: 2048 * o.quality, intensity:o.shadowIntensity }
		})

		Lights.add({ 
			type:'hemi', name:'hemi',
			intensity:o.hemiIntensity,
			skyColor:0xddeeff,
			groundColor:0x0f0e0d,
			pos:[0,1,0], 
			parent:parent
		})

    }

    static update ( o = {} ) {

    	let move = false;

    	if( o.sunIntensity!==undefined ){

    		/*if( LL.sun && LL.sun2 ){
    			LL.sun.intensity = o.sunIntensity*0.3;
    			if( LL.sun2 ) LL.sun2.intensity = o.sunIntensity*0.7;
    		} else {*/
    			if( LL.sun ) LL.sun.intensity = o.sunIntensity;
    		//}
    		
    	}

    	if( o.shadowIntensity!==undefined ){
    		if( LL.sun ) LL.sun.shadow.intensity = o.shadowIntensity;
    	}

    	if(o.sunPos){
    		if( LL.sun ){ 
    			LL.sun.position.fromArray( o.sunPos ).multiplyScalar( LL.sun.distance );
    			LL.sun.target.position.set( 0, 1, 0 )
    			move = true;
    			//LL.sun.updateMatrixWorld();
    		}
    		if( LL.sun2 ){ 
    			LL.sun2.position.fromArray( o.sunPos ).multiplyScalar( LL.sun2.distance );
    			LL.sun2.target.position.set( 0, 1, 0 )
    			move = true;
    			//LL.sun2.updateMatrixWorld();
    		}
    	}

    	if(o.sunColor){
    		if( LL.sun ) Lights.setColor(LL.sun.color, o.sunColor );
    		if( LL.sun2 ) Lights.setColor(LL.sun2.color, o.sunColor );
    		move = true;
    	}

    	if( LL.hemi ){
    		if(o.hemiIntensity!==undefined) LL.hemi.intensity = o.hemiIntensity//*0.7;
    		if(o.skyColor) Lights.setColor(LL.hemi.color, o.skyColor );
    		if(o.groundColor) Lights.setColor(LL.hemi.groundColor, o.groundColor );
    		move = true;
    	}

    	if( move ) Lights.updateHelper();
    
    }

    static setColor ( c, v ) {
    	if( v.isColor ) c.copy( v );
    	else c.setHex( v );
    }

    static adds ( ar ) {

    	let i = ar.length, n = 0
    	while(i--){
    		Lights.add( ar[n] );
    		n++;
    	}
    }

	static add ( o = {} ) {

		if ( o.constructor === Array ) return Lights.adds( o );

		let l = null;

		if(!o.color) o.color = 0xFFFFFF;

		switch(o.type){
			
			case 'direct':
			l = new DirectionalLight( o.color, o.intensity );
			l.distance = o.distance !== undefined ? o.distance : 2.0;
			break;
			case 'spot':
			l = new SpotLight( o.color, o.intensity, o.distance, o.angle, o.penumbra, o.decay );
			break;
			case 'point':
			l = new PointLight( o.color, o.intensity, o.distance, o.decay );
			break;
			case 'ambient':
			l = new AmbientLight( o.color, o.intensity );
			break;
			case 'rec':
			l = new RectAreaLight( o.color, o.intensity, o.width = 10, o.height );
			break;
			case 'hemi':
			l = new HemisphereLight( o.skyColor || 0x000000, o.groundColor || 0x000000, o.intensity );
			break;
		}

		if(!l) return

		l.name = o.name || 'light' + light.length;

		if( o.pos ) l.position.fromArray( o.pos );

		if( o.parent ){
			if( l.target ) o.parent.add( l.target );
			o.parent.add( l );
		}

		if( l.shadow && o.shadow ){
			Lights.setShadow( l, o.shadow );
		}

	    light.push(l);
	    LL[l.name] = l;

	    return l

	}

	static setShadow ( l, o ) {

		const s = l.shadow;
		if(!s) return;

		if(o.quality) s.mapSize.width = s.mapSize.height = o.quality;
		const cam = s.camera;

		if( cam.isOrthographicCamera ){
			if(o.range){
				cam.top = cam.right = o.range;
				cam.bottom = cam.left = -o.range;
			}
			if(o.near) cam.near = o.near;
			if(o.far) cam.far = o.far;
		}
		if( cam.isPerspectiveCamera ){
			if(o.near) cam.near = o.near;
			if(o.far) cam.far = o.far;
		}

		if(o.bias) s.bias = o.bias;
		if(o.radius) s.radius = o.radius;
		if(o.blurSamples) s.blurSamples = o.blurSamples; // only for VSM 
		if(o.intensity) s.intensity = o.intensity;

		s.needsUpdate = true;
		l.updateWorldMatrix( true, true );
		l.target.updateWorldMatrix( true, true );

		l.castShadow = true;

    }

	static byName ( name ) {
		return LL[name]
	}

	static dispose () {

		Lights.disposeHelper();

		let i = light.length, l;
		while(i--){
			l = light[i];
			if( l.parent ) l.parent.remove(l);
			if( l.target && l.target.parent ) l.target.parent.remove(l.target);
			l.dispose()
		}

		light = [];
		LL = {}

	}

	static castShadow ( v ) {

		let i = light.length, l;
		while(i--){
			l = light[i];
			if( l.shadow !== undefined ){ 
				l.castShadow = v;
				if(!v) l.shadow.dispose();
			}
		}

	}


	//--------------------
	//   HELPER
	//--------------------

	static addHelper ( b, pp ) {

		if( b && !debug ){

			let i = light.length, l, h;
			while(i--){
				l = light[i];
				switch(l.type){
					case 'DirectionalLight':
					h = new DirectionalHelper( l );
					break;
					case 'PointLight':
					h = new PointLightHelper( l, 0.25, l.color );
					break;
					case 'SpotLight':
					h = new SpotLightHelper( l, l.color );
					break;
					case 'HemisphereLight':
					h = new HemisphereLightHelper( l, 0.25 )
					h.material.wireframe = false
					break;
				}

				if(h){ 
					helper.push(h);
					pp.add( h )
					if( h.shadow ){ 
						helper.push( h.shadow );
						pp.add( h.shadow )
						//h.shadow.update()
					}
				}
			}

			debug = true;

		}

		if( !b ){
			Lights.disposeHelper();
		}

		return debug;

	}

	static updateHelper () {

		if( !debug ) return;

		let i = helper.length;
		while(i--){
			helper[i].update();
		}

	}

	static disposeHelper () {

		if( !debug ) return;

		let i = helper.length, h;
		while(i--){
			h = helper[i];
			h.parent.remove(h);
			h.dispose()
		}
		helper = [];
		debug = false;

	}

}