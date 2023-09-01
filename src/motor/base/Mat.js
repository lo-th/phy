import {
    MeshPhongMaterial, MeshLambertMaterial, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, LineBasicMaterial, MeshToonMaterial,
    Matrix4, Euler, Quaternion, Vector3, Vector2, Matrix3, Color,
    Box3Helper, DoubleSide,
} from 'three';
import { CarbonTexture } from '../../3TH/textures/CarbonTexture.js';


//-------------------
//
//  MATERIAL
//
//-------------------

//const mat = new Map()
const mat = {}

let TmpMat = [];

const matExtra = {

	//clearcoat:1.0,
	//clearcoatRoughness:0.1,
	metalness: 0.0,
	roughness: 0.2,
	//normalScale: new Vector2(0.25,0.25),

}

export const Colors = {
    body:new Color( 0xefefd4 ),
    sleep:new Color( 0x9FBFBD ),//0xBFBFBD
    solid:new Color( 0x6C6A68 ),
    base:new Color( 0xFFFFFF ),
    black:new Color( 0x222222 ),
    gold:new Color( 0.944, 0.776, 0.373 ),
    gold2:new Color( 0.998, 0.981, 0.751 ),
    copper:new Color( 0.96467984, 0.37626296, 0.25818297 ),
    carPaint:new Color( 0.1037792, 0.59212029, 0.85064936 ),
    clay:new Color( 0.604,0.584,0.497 ),
    concrete:new Color( 0xa9a9a9 ),
}

export const Mat = {

	extendShader:() =>{},

	addToTmp:( m ) => {

		TmpMat.push( m )
	},

	create:( o ) => {

		let m, beforeCompile = null;

		if( o.isMaterial ){
			m = o
		} else {

			let type = o.type !== undefined ? o.type : 'Standard'
			if( o.type ) delete o.type

			beforeCompile = o.beforeCompile || null
		    if( o.beforeCompile ) delete o.beforeCompile


			if( o.thickness || o.sheen || o.clearcoat || o.transmission || o.specularColor ) type = 'Physical'

			if(o.normalScale){
				if( !o.normalScale.isVector2 ) o.normalScale = new Vector2().fromArray(o.normalScale)
			}

		    type = type.toLowerCase();

		    switch( type ){

				case 'physical': 
					m = new MeshPhysicalMaterial( o ); 
					m.defines = {
						'STANDARD': '',
						'PHYSICAL': '',
						'USE_UV':'',
						'USE_SPECULAR':''
					}
				break;
				case 'phong': m = new MeshPhongMaterial( o ); break;
				case 'lambert': m = new MeshLambertMaterial( o ); break;
				case 'basic': m = new MeshBasicMaterial( o ); break;
				case 'line': m = new LineBasicMaterial( o ); break;
				case 'toon': m = new MeshToonMaterial( o ); break;
				default: m = new MeshStandardMaterial( o ); break;
			}

		} 

		if( mat[ m.name ] ) return null;
	    Mat.set( m, false, beforeCompile );
		return m;

	},

	set:( m, direct, beforeCompile ) => {

		if(!direct) Mat.extendShader( m, beforeCompile )
		mat[m.name] = m;

	},

	changeType:() => {



	},

	setEnvmapIntensity: (v) => { 
		let m
		for(let name in mat){
			m = mat[name]
			if( !m.userData.envp ) m.userData.envp = m.envMapIntensity
			m.envMapIntensity = m.userData.envp * v
		}
		
	},
	
	getList: () => {

		let l = {...mat}
		const ignor = ['line', 'debug', 'hide', 'svg']
		let i = ignor.length
		while(i--) delete l[ignor[i]];

		return l

	},

	get:( name ) => {

		if( !mat[name] ){
			//console.log(name)
			let m;
			switch( name ){

				case 'body': m = Mat.create({name:'body', color:Colors.body, ...matExtra }); break

			    //case 'body':   m = new MeshStandardMaterial({ color:Colors.body, ...matExtra }); break//0xFFF1D2
			    case 'sleep':  m = Mat.create({ name:'sleep', color:Colors.sleep, ...matExtra }); break//0x46B1C9
			    case 'solid':  m = Mat.create({ name:'solid', color:Colors.solid, metalness: 0.1, roughness: 0.8, }); break
			    case 'clay':  m = Mat.create({ name:'clay', color:Colors.clay, metalness: 0.0, roughness: 0.9, }); break
			    case 'base':   m = Mat.create({ name:'base', color:Colors.base, ...matExtra }); break

			    case 'concrete':  m = Mat.create({ name:'concrete', color:Colors.concrete, metalness: 0.0, roughness: 0.9, }); break

			    case 'black':   m = Mat.create({ name:'black', color:Colors.black, metalness: 0, roughness: 0.25 }); break

			    // metal
			    case 'chrome': m = Mat.create({ name:'chrome', color:0xCCCCCC, metalness: 1, roughness:0.075 }); break
			    case 'gold': m = Mat.create({ name:'gold', color:Colors.gold, specularColor:Colors.gold2, metalness: 1, roughness:0.02 }); break
			    case 'copper': m = Mat.create({ name:'copper', color:Colors.copper, metalness: 1, roughness:0.25, clearcoat: 1.0, clearcoatRoughness: 0.2 }); break

			    case 'carPaint': m = Mat.create({ name:'carPaint', color:Colors.carPaint, metalness: 0, anisotropy:new Vector2(0.5,0.5), roughness:0.4, clearcoat: 1.0, clearcoatRoughness: 0, }); break

				//case 'simple': m = Mat.create({ name:'simple', color:0x808080, metalness: 0, roughness: 1 }); break

				case 'carbon': m = Mat.create({ name:'carbon', map:new CarbonTexture(), normalMap:new CarbonTexture(true), clearcoat: 1.0, clearcoatRoughness: 0.1, roughness: 0.5 }); break
				case 'cloth': m = Mat.create({ name:'cloth', color:0x8009cf, roughness: 0.5, sheenColor:0xcb7cff, sheen:1, sheenRoughness:0.2 }); break


				//case 'clear':  m = new MeshStandardMaterial({ color:0xFFFFFF, metalness: 0.5, roughness: 0 }); break
				
				//case 'hero':   m = new MeshStandardMaterial({ color:0x00FF88, ...matExtra }); break
				case 'skinny':   m = Mat.create({ name:'skinny', color:0xe0ac69, ...matExtra }); break
				
				case 'glass':  m = Mat.create({ name:'glass', color:0xFFFFff, transparent:true, opacity:0.8, depthTest:true, depthWrite:true, roughness:0.02, metalness:0.0, /*side:DoubleSide,*/ alphaToCoverage:true, premultipliedAlpha:true, transmission:1, clearcoat:1, thickness:0.02  }); break
				case 'glassX':  m = Mat.create({ name:'glassX', color:0xeeeeee, transparent:false, opacity:1.0, roughness:0.03, metalness:0, side:DoubleSide, transmission:1.0, clearcoat:1, clearcoatRoughness:0.0, thickness:0.6, ior:1.52, envMapIntensity:1.0, shadowSide:1, reflectivity:0.5, iridescence:0 }); break
				case 'plexi':  m = Mat.create({ name:'plexi', color:0xFFFFff, transparent:true, opacity:0.4, metalness:1, roughness:0, clearcoat:1, side:DoubleSide }); break
				case 'glass2': m = Mat.create({ name:'glass2', color:0xCCCCff, transparent:true, opacity:0.3  }); break
				
				case 'car':   m = Mat.create({ name:'car', color:0x303030, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5 }); break
				case 'carGlass':   m = Mat.create({ name:'carGlass', color: 0xffffff, metalness: 0, roughness: 0, transmission: 1.0, ior:1.52 }); break


				case 'debug': m = Mat.create({ name:'debug', type:'Basic', color:0xF37042, wireframe:true, toneMapped: false, transparent:true, opacity:0.25 }); break
				
				//case 'debug2': m = Mat.create({ name:'debug2', type:'Basic', color:0x00FFFF, wireframe:true, toneMapped: false }); break
				//case 'debug3':  m = Mat.create({ name:'debug3', type:'Basic', color:0x000000, wireframe:true, transparent:true, opacity:0.1, toneMapped: false }); break
				//case 'shadows': m = Mat.create({ name:'shadows', type:'Basic', transparent:true, opacity:0.01 }); break

				//case 'simple': m = Mat.create({ name:'simple', type:'basic'  }); break


				case 'bones':  m = Mat.create({ name:'bones', color:0xCCAA33,  wireframe:true }); break
				case 'bones2':  m = Mat.create({ name:'bones2', type:'basic', color:0xFF8800, transparent:true, opacity:0.5, depthTest:true, depthWrite:false, alphaToCoverage:true }); break

				
				case 'button':  m = Mat.create({ name:'button', color:0xFF404B, ...matExtra }); break
				//case 'hide': m = new MeshBasicMaterial({ visible:false }); break

				case 'line':
				    m = Mat.create({ name:'line', type:'line', vertexColors: true, toneMapped: false })
			    break
				case 'hide':
				    m = Mat.create({ name:'hide', type:'basic', visible:false });
			    break
			    case 'particle':
				    m = Mat.create({ name:'particle', type:'basic', toneMapped: false, color:0x00ff00 });
			    break
			    case 'svg':
				    m = Mat.create({ name:'svg', type:'basic', toneMapped:false, vertexColors:true, transparent:false, side:DoubleSide });
			    break


				

			}
			
		}

		return mat[name]



	},

	dispose:() => {

		for(let m in mat){
			mat[m].dispose()
			delete mat[m]
		}

		let i = TmpMat.length
		while( i-- ) { TmpMat[i].dispose(); }
		TmpMat = []

	}

}