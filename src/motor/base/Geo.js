import {
    SphereGeometry, PlaneGeometry, CylinderGeometry, BoxGeometry
} from 'three';
import { CircleHelper } from '../../3TH/helpers/CircleHelper.js';


//-------------------
//
//  GEOMETRY
//
//-------------------


let geoN = 0;
let geo = {}

export const Geo = {

	unic: ( g ) => {

		geo[ 'geo' + geoN++ ] = g

	},

	set: ( g ) => {

		geo[g.name] = g

	},

	get: ( name, o = {} ) => {

		if( !geo[name] ){
			let g;
			switch( name ){
				case 'plane':    g = new PlaneGeometry(1,1); g.rotateX( -Math.PI * 0.5 ); break
				case 'box':      g = new BoxGeometry(1,1,1); break
				case 'sphere':   g = new SphereGeometry( 1, 16, 12 ); break
				case 'cylinder': g = new CylinderGeometry( 1, 1, 1 , 16 ); break
				//case 'wheel':    g = new CylinderGeometry( 1, 1, 1 , 16 ); g.rotateX( -Math.PI * 0.5 ); break
				case 'cone':     g = new CylinderGeometry( 0.001, 1, 1 , 16 ); break
				//case 'joint':    g = new Box3Helper().geometry; g.scale( 0.05,0.05,0.05 ); break
				case 'particle': g = new SphereGeometry( 1.0, 8, 6 ); break
				case 'joint':    g = new CircleHelper().geometry; break
				default: return null;
			}
			geo[name] = g;
		}

		return geo[name]
		
	},

	dispose: () => {
		//console.log( geo )
		for( let n in geo ) geo[n].dispose()
		geo = {}
		geoN = 0

	}

}