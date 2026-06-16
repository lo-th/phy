import {
	Group,
	DirectionalLight, HemisphereLight, SpotLight, PointLight, AmbientLight, RectAreaLight,
	CameraHelper, HemisphereLightHelper, Color, PointLightHelper, SpotLightHelper
} from 'three';

import { DirectionalHelper } from './helpers/DirectionalHelper.js'
import { LightProbeGrid } from '../3TH/lighting/LightProbeGrid.js';
import { LightProbeGridHelper } from 'three/addons/helpers/LightProbeGridHelper.js';

import { LightProbeGridGPU } from '../3TH/lighting/LightProbeGridGPU.js';
import { LightProbeGridHelperGPU } from '../3TH/helpers/LightProbeGridHelperGPU.js';

//let light = [];
let LL = {};
let helper = [];
let debug = false;
let renderer = null
let scene = null
let N = 0
let isWebGPU = false

export class Lights {

	//get debug() { return debug; }
    //set debug( value ) { Lights.debug(value) }

    static getLights(){ return LL }

    static define ( o = {}, parent, webGPU = false, Renderer, Scene ) {

    	isWebGPU = webGPU;

    	let biasSide = 1//o.shadowType === 'PCSS' ? -1:1

    	renderer = Renderer;
    	scene = Scene;

    	//console.log(renderer)

    	Lights.add({ 
			type:'direct', name:'sun',
			intensity:o.direct,
			distance:30, 
			parent:parent,
		    shadow:{ range:30, near:5, far:70, bias:  0.0001 * biasSide, radius:4, quality: 2048, intensity:o.shadowIntensity }
		})

		Lights.add({ 
			type:'hemi', name:'hemi',
			intensity:o.spherical,
			skyColor:0xddeeff,
			groundColor:0x0f0e0d,
			pos:[0,1.0,0], 
			parent:parent
		})

    }

    static update ( o = {} ) {

    	let move = false;

    	if( o.sunIntensity!==undefined ){
    		if( LL.sun ) LL.sun.intensity = o.sunIntensity;
    	}

    	if( o.shadowIntensity!==undefined ){
    		if( LL.sun ) LL.sun.shadow.intensity = o.shadowIntensity;
    	}

    	if(o.sunPos){
    		if( LL.sun ){ 
    			LL.sun.position.fromArray( o.sunPos ).multiplyScalar( LL.sun.distance );
    			LL.sun.target.position.set( 0, 1, 0 )
    			move = true;
    		}
    	}

    	if(o.sunColor){
    		if( LL.sun ) Lights.setColor(LL.sun.color, o.sunColor );
    		//if( LL.sun2 ) Lights.setColor(LL.sun2.color, o.sunColor );
    		move = true;
    	}

    	if( LL.hemi ){
    		if(o.hemiIntensity!==undefined) LL.hemi.intensity = o.hemiIntensity;
    		if(o.skyColor) Lights.setColor(LL.hemi.color, o.skyColor );
    		if(o.groundColor) Lights.setColor(LL.hemi.groundColor, o.groundColor );
    		move = true;
    	}

    	if( move ) Lights.updateHelper();
    
    }

    static reset () {

    	this.dispose(true);

    	const dt = {
			sunPos: [0.27, 1, 0.5],
			sunColor: 0xFFFFFF,
			skyColor: 0xFFFFFF,
			groundColor: 0x808080, 
		}

		Lights.update( dt );

    }

    static dispose ( keepBasic ) {

		Lights.disposeHelper();

		let l;
		for( let n in LL ){
			if( keepBasic ){
				if(n==='sun' || n==='hemi') continue
			}

			l = LL[n];
			if( l.parent ) l.parent.remove(l);
			if( l.target && l.target.parent ) l.target.parent.remove(l.target);
			l.dispose()
			delete LL[n];
		}

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
			case 'probe':
			l = isWebGPU ? new LightProbeGridGPU( o.size[0], o.size[1], o.size[2], o.sample[0], o.sample[1], o.sample[2] ) 
			: new LightProbeGrid( o.size[0], o.size[1], o.size[2], o.sample[0], o.sample[1], o.sample[2] );
			l.type = 'probesLight'
			l.bake( renderer, scene, { cubemapSize: o.mapSize || 32, near: o.near || 0.05, far: o.far || 20, bounces:o.bounces || 0 } );
			l.visible = true;
			break;
		}

		if(!l) return

		l.name = o.name || 'light' + N;
	    N++

		if( o.pos ) l.position.fromArray( o.pos );

		if( o.parent ){
			if( l.target ) o.parent.add( l.target );
			o.parent.add( l );
		} else {
			scene.add(l)
		}

		if( o.shadow !== undefined && o.type!=='hemi'){
			Lights.setShadow( l, o.shadow );
		}

	    //light.push(l);

	    LL[l.name] = l;

	    return l

	}

	static setShadow ( l, o ) {

		const s = l.shadow;
		//console.log( o)
		if(!s) return;

		if(o.quality) s.mapSize.width = s.mapSize.height = o.quality;
		//console.log(s.mapSize.width )
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

		/*s.needsUpdate = true;
		l.updateWorldMatrix( true, true );
		l.target.updateWorldMatrix( true, true );*/

		l.castShadow = true;

    }

	static byName ( name ) {
		return LL[name]
	}

	

	static castShadow ( v ) {

		let l;
		for(let n in LL){
			l = LL[n];
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


		// TODO bug that change shadow range ??
		//return 

		if(b){

			if(debug) return

			let l, h
			for(let n in LL){
				l = LL[n];
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
					//console.log(h)
					//h.material.wireframe = false
					break;
					case 'probesLight':


					h = isWebGPU ? new LightProbeGridHelperGPU( l, 0.05 ) : new LightProbeGridHelper( l, 0.05 );
					
					//scene.add( h );
					//console.log(h)
					//h.material.wireframe = false
					break;
				}

				if(h){ 
					helper.push(h);
					pp.add(h)
					//h.updateMatrix()
					if( h.shadow ){ 
						//console.log(h.shadow)
						helper.push( h.shadow );
						pp.add( h.shadow )
						h.shadow.update()
					}
				}
			}

			debug = true;

		}else{
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