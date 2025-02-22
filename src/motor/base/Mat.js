import {
    MeshPhongMaterial, MeshLambertMaterial, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, 
    LineBasicMaterial, MeshToonMaterial, ShadowMaterial, ShaderMaterial,
    Matrix4, Euler, Quaternion, Vector3, Vector2, Matrix3, Color, NoColorSpace,
    AdditiveBlending, CustomBlending, NoBlending, NormalBlending, SubtractiveBlending, MultiplyBlending,
    AddEquation, SubtractEquation, ReverseSubtractEquation, MinEquation, MaxEquation,
    ZeroFactor, OneFactor, SrcColorFactor, OneMinusSrcColorFactor, SrcAlphaFactor, OneMinusSrcAlphaFactor, 
    DstAlphaFactor, OneMinusDstAlphaFactor, DstColorFactor, OneMinusDstColorFactor, SrcAlphaSaturateFactor,
    FrontSide, BackSide, DoubleSide, ShaderChunk
} from 'three';
import { CarbonTexture } from '../../3TH/textures/CarbonTexture.js';
import { MeshSssMaterial } from '../../3TH/materials/MeshSssMaterial.js';
//import { EnhanceShaderLighting } from '../../3TH/shaders/EnhanceShaderLighting.js';
import { EnhanceLighting } from '../../3TH/shaders/EnhanceLighting.js';
import { FakeGlowMaterial } from '../../3TH/materials/FakeGlowMaterial.js';
//-------------------
//
//  MATERIAL
//
//-------------------

//const mat = new Map()
let mat = {}

let TmpMat = [];

const matExtra = {

	//clearcoat:1.0,
	//clearcoatRoughness:0.1,
	metalness: 0.1,
	roughness: 0.9,
	//normalScale: new Vector2(0.25,0.25),

}

export const RealismLightOption = {
	enableESL:true,
	exposure:1,
	envMapIntensity:1,

	aoColor: new Color(0x000000),
	hemisphereColor: new Color(0xffffff),
    irradianceColor: new Color(0xffffff),
    radianceColor: new Color(0xffffff),

    aoPower: 9.7,//6,
    aoSmoothing: 0.26,
    aoMapGamma: 0.89,
    lightMapGamma: 0.9,//1,
    lightMapSaturation: 1,
    envPower: 1,//2
    roughnessPower: 1,//1.45,
    sunIntensity: 0,
    mapContrast: 1,//0.93,
    lightMapContrast: 1.03,
    smoothingPower: 0.76,
    irradianceIntensity: 6.59,
    radianceIntensity: 4.62,
    hardcodeValues: false

}

export const Colors = {
    body:new Color( "hsl(45, 15%, 90%)" ),//0xefefd4
    sleep:new Color( "hsl(33, 15%, 54%)" ),//0x9FBFBD
    solid:new Color( 0x6C6A68 ),//
    base:new Color( 0xc9c8c7 ),
    black:new Color( "hsl(220, 8%, 15%)" ),
    gold:new Color( 0.944, 0.776, 0.373 ),
    gold2:new Color( 0.998, 0.981, 0.751 ),
    copper:new Color( 0.96467984, 0.37626296, 0.25818297 ),
    carPaint:new Color( 0.1037792, 0.59212029, 0.85064936 ),
    clay:new Color( "hsl(12, 30%, 40%)" ),
    concrete:new Color( 0xa9a9a9 ),

    Raw_Fire:new Color( "hsl(40, 18%, 54%)" ),
    Raw_Buff:new Color( "hsl(33, 15%, 54%)" ),
    Raw_Terracotta:new Color( "hsl(12, 30%, 40%)" ),
    Raw_Porcelain:new Color( "hsl(45, 15%, 90%)" ),

}



const ThreeVariable = {

	No: NoBlending,
	Normal: NormalBlending,
	Additive: AdditiveBlending,
	Subtractive: SubtractiveBlending,
	Multiply: MultiplyBlending,

	Eadd: AddEquation,
	Esub: SubtractEquation,
	Erev: ReverseSubtractEquation,
	Emin: MinEquation,
	Emaw: MaxEquation,

	Fzero: ZeroFactor,
	Fone:  OneFactor,
	Fcolor: SrcColorFactor,
	Fcolorm: OneMinusSrcColorFactor,
	Falpha: SrcAlphaFactor,
	Falpham: OneMinusSrcAlphaFactor,
	Fdstalpha: DstAlphaFactor,
	Fdstalpham: OneMinusDstAlphaFactor,
	Fdstcolor: DstColorFactor,
	Fdstcolorm: OneMinusDstColorFactor,
	Falphasaturate: SrcAlphaSaturateFactor, // ! not for destination

	Front: FrontSide,
	Back: BackSide,
	Double: DoubleSide,

};

const addRenderMode = ()=>{

	let s = ShaderChunk.common;
	s = s.replace( '#define EPSILON 1e-6', `
		#define EPSILON 1e-6
		uniform int renderMode;
		uniform int depthPacking;
		varying vec2 vZW;
    `);
    ShaderChunk.common = s;

    ShaderChunk.clipping_planes_vertex = `
        #if NUM_CLIPPING_PLANES > 0
            vClipPosition = - mvPosition.xyz;
        #endif
        vZW = gl_Position.zw;
    `;

    s = ShaderChunk.dithering_fragment;
	s = s.replace( '#endif', `
		#endif

        #ifdef STANDARD

        if( renderMode == 1 ){ // depth render
            float fz = 0.5 * vZW[0] / vZW[1] + 0.5;
            fz=pow(fz, 10.0);
            gl_FragColor = depthPacking == 1 ? packDepthToRGBA( fz ) : vec4( vec3( 1.0 - fz ), opacity );
        }
        if( renderMode == 2 ) gl_FragColor = vec4(  packNormalToRGB( normal ), opacity );// normal render
        //if( renderMode == 3 ) gl_FragColor = vec4(  shadowColor, opacity );// normal render

        #else

        if( renderMode != 0 ) discard;

        #endif
    `);
    ShaderChunk.dithering_fragment = s;


}

export const Mat = {

	renderMode:{ value: 0 },
	depthPacking:{ value: 0 },

	isRealism:false,
	realismOption:{},
	envMapIntensity:1.0,

	changeRenderMode: (n) => {

		Mat.renderMode.value = n;

	},

	initExtandShader: () => {
		addRenderMode();
	},
	

	useRealLight: (o) => {

		Mat.isRealism = true;

		// apply color setting number
		for(let c in o){
			if(c.search('Color')!==-1){
				if(!o[c].isColor){
					RealismLightOption[c].set( o[c] );
					delete o[c];
				}
			} 
		}

		Mat.realismOption = { ...RealismLightOption, ...o };

	},

	setColor:( o ) => {

		if(!Mat.isRealism) return;

		//console.log(o)

		RealismLightOption.aoColor.set(o.minLuma).convertLinearToSRGB()
		RealismLightOption.hemisphereColor.set(o.maxLuma).convertLinearToSRGB()
		RealismLightOption.irradianceColor.set(o.sun).convertLinearToSRGB()
		RealismLightOption.radianceColor.set(o.vibrant).convertLinearToSRGB()

	},

	set:( m, direct, beforeCompile = null ) => {

		if(!beforeCompile) beforeCompile = m.onBeforeCompile;
		if(!direct) Mat.extendShader( m, beforeCompile );
		mat[m.name] = m;
		//Mat.setEnvmapIntensity(m)

	},

	extendShader:( m, beforeCompile = null ) => { 

		//let oldCompile = null;
		//if( m.onBeforeCompile ) oldCompile = m.onBeforeCompile;

		if( Mat.isRealism ){
			m.onBeforeCompile = function ( shader ) {
				shader.uniforms.renderMode = Mat.renderMode;
				shader.uniforms.depthPacking = Mat.depthPacking;

				EnhanceLighting( shader, Mat.realismOption );
		        m.userData.isRealism = true;
		        m.userData.shader = shader;
	            if( beforeCompile ) beforeCompile( shader );
	        }

		} else {
			m.onBeforeCompile = function ( shader ) {

				shader.uniforms.renderMode = Mat.renderMode;
				shader.uniforms.depthPacking = Mat.depthPacking;

	            if( beforeCompile ) beforeCompile( shader );
	            m.userData.shader = shader;
	        }
		}
		
	},

	addToTmp:( m ) => {

		TmpMat.push( m );

	},

	create:( o ) => {

		let m, beforeCompile = null;

		if( o.isMaterial ){
			m = o;
		} else {

			let type = o.type !== undefined ? o.type : 'Standard'
			if( o.type ) delete o.type

			//if( !o.shadowSide ) o.shadowSide = 'double'

			beforeCompile = o.beforeCompile || null
		    if( o.beforeCompile ) delete o.beforeCompile;

			if( o.thickness || o.sheen || o.clearcoat || o.transmission || o.specularColor ) type = 'Physical';

			if(o.normalScale){
				if( !o.normalScale.isVector2 ) o.normalScale = new Vector2().fromArray(o.normalScale)
			}

		    if( o.side ) o.side = Mat.findValue( o.side );
		    if( o.shadowSide ) o.shadowSide = Mat.findValue( o.shadowSide );
		    if( o.blending ) o.blending = Mat.findValue( o.blending );
		    if( o.blendEquation ) o.blendEquation = Mat.findValue( o.blendEquation );
		    if( o.blendEquationAlpha ) o.blendEquationAlpha = Mat.findValue( o.blendEquationAlpha );
		    if( o.blendSrc ) o.blendSrc = Mat.findValue( o.blendSrc );
		    if( o.blendDst ) o.blendDst = Mat.findValue( o.blendDst );
		    if( o.blendDstAlpha ) o.blendDstAlpha = Mat.findValue( o.blendDstAlpha );
		    if( o.blendSrcAlpha ) o.blendSrcAlpha = Mat.findValue( o.blendSrcAlpha );

		    if(o.clearcoatNormalScale){
				if( !o.clearcoatNormalScale.isVector2 ) o.clearcoatNormalScale = new Vector2().fromArray( o.clearcoatNormalScale )
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
				case 'shadow': m = new ShadowMaterial( o ); break;
				case 'sss': m = new MeshSssMaterial( o ); break;
				default: m = new MeshStandardMaterial( o ); break;

			}

			Mat.upEnvmapIntensity( m );

		} 

		if( mat[ m.name ] ) return null;
	    Mat.set( m, false, beforeCompile );
		return m;

	},

	findValue:(v) => ( v === 'string' ? ThreeVariable[ v.charAt(0).toUpperCase() + v.slice(1) ] : v ),



	addToMat:( o ) => {

		if( Mat.isRealism ){
			for(let m in o){
				o[m].shadowSide = DoubleSide;
				o[m].onBeforeCompile = function ( shader ) {
		            EnhanceLighting( shader, Mat.realismOption );
		            o[m].userData.isRealism = true;
		            o[m].userData.shader = shader;
		        }
			}


		}

		mat = { ...mat, ...o }

	},

	changeType:() => {



	},

	directIntensity: ( v ) => {

		for( let name in mat ) {
		//	if( mat[name].envMapIntensity ) mat[name].envMapIntensity = v;
		}
		
	},

	setEnvmapIntensity: ( v ) => {

		//console.log('set', v)

		//if( v === Mat.envMapIntensity ) return;
		//Mat.envMapIntensity = v;

		//for( let name in mat ) Mat.upEnvmapIntensity( mat[name] );
		
	},

	upEnvmapIntensity: ( m ) => {

		

		//if( !m.userData.envp ) m.userData.envp = m.envMapIntensity;
		//m.envMapIntensity = m.userData.envp * Mat.envMapIntensity;

		//console.log('HH', m.name, m.envMapIntensity)
		
	},
	
	getList: () => {

		let l = {...mat}
		const ignor = ['line', 'debug', 'hide', 'svg']
		let i = ignor.length;
		while(i--) delete l[ignor[i]];

		return l

	},

	get:( name ) => {

		if( !mat[name] ){
			//console.log(name)
			let m;
			switch( name ){

				case 'body': m = Mat.create({name:'body', color:Colors.body, ...matExtra }); break
			    case 'sleep':  m = Mat.create({ name:'sleep', color:Colors.sleep, ...matExtra }); break//0x46B1C9
			    case 'solid':  m = Mat.create({ name:'solid', color:Colors.solid, ...matExtra }); break
			    case 'base':   m = Mat.create({ name:'base', color:Colors.base, ...matExtra }); break

			    case 'clay':  m = Mat.create({ name:'clay', color:Colors.clay, ...matExtra }); break

			    case 'concrete':  m = Mat.create({ name:'concrete', color:Colors.concrete, metalness: 0.0, roughness: 0.9, }); break

			    case 'black':   m = Mat.create({ name:'black', color:Colors.black, metalness: 0, roughness: 0.25 }); break

			    

			    // metal
			    case 'chrome': m = Mat.create({ name:'chrome', color:0xCCCCCC, metalness: 1, roughness:0.075 }); break
			    case 'silver': m = Mat.create({ name:'silver', color:0xAAAAAA, metalness: 0.8, roughness:0.22 }); break
			    case 'gold': m = Mat.create({ name:'gold', color:Colors.gold, specularColor:Colors.gold2, metalness: 1, roughness:0.02 }); break
			    case 'copper': m = Mat.create({ name:'copper', color:Colors.copper, metalness: 1, roughness:0.25, clearcoat: 1.0, clearcoatRoughness: 0.2 }); break

			    case 'carPaint': m = Mat.create({ name:'carPaint', color:Colors.carPaint, metalness: 0, anisotropy:new Vector2(0.5,0.5), roughness:0.4, clearcoat: 1.0, clearcoatRoughness: 0, }); break

				//case 'simple': m = Mat.create({ name:'simple', color:0x808080, metalness: 0, roughness: 1 }); break

				case 'carbon': m = Mat.create({ name:'carbon', map:new CarbonTexture(), normalMap:new CarbonTexture(true), clearcoat: 1.0, clearcoatRoughness: 0.1, roughness: 0.5 }); break
				case 'cloth': m = Mat.create({ name:'cloth', color:0x8009cf, roughness: 0.5, sheenColor:0xcb7cff, sheen:1, sheenRoughness:0.2 }); break


				//case 'clear':  m = new MeshStandardMaterial({ color:0xFFFFFF, metalness: 0.5, roughness: 0 }); break
				//case 'wood':   m = Mat.create({ name:'wood', color:0xe8c2a1, metalness: 0, roughness: 1 }); break
				
				//case 'hero':   m = new MeshStandardMaterial({ color:0x00FF88, ...matExtra }); break
				case 'skinny':   m = Mat.create({ name:'skinny', color:0xe0ac69, ...matExtra }); break
				
				case 'glass':  m = Mat.create({ name:'glass', color:0xFFFFff, transparent:true, roughness:0.02, metalness:0.0, side:DoubleSide, alphaToCoverage:true, premultipliedAlpha:true, transmission:1, clearcoat:1, thickness:0.01  }); break
				case 'glassX':  m = Mat.create({ name:'glassX', color:0xeeeeee, transparent:false, opacity:1.0, roughness:0.03, metalness:0,  side:DoubleSide, transmission:1.0, clearcoat:1, clearcoatRoughness:0.0, thickness:0.02, ior:1.52, shadowSide:1, reflectivity:0.5, iridescence:0 }); break
				case 'plexi':  m = Mat.create({ name:'plexi', blending:AdditiveBlending, color:0x010101, transparent:true, opacity:0.7, reflectivity:0.3, metalness:0.6, roughness:0.1, clearcoat:0.2, clearcoatRoughness: 0.02, side:DoubleSide, alphaToCoverage:true, premultipliedAlpha:true }); break
				case 'plexi2':  m = Mat.create({ name:'plexi2', blending:AdditiveBlending, color:0x010101, transparent:false, opacity:0.7, reflectivity:0.3, metalness:0.6, roughness:0.1, clearcoat:0.2, clearcoatRoughness: 0.02, side:DoubleSide, alphaToCoverage:false, premultipliedAlpha:true }); break
				case 'glass2': m = Mat.create({ name:'glass2', color:0xEEEEEE, transparent:true, roughness:0, alphaToCoverage:true, opacity:0.3  }); break
				case 'glass3': m = Mat.create({ name:'glass3', color:0x000000, transparent:true, roughness:0, alphaToCoverage:true, opacity:0.4  }); break
				case 'glass_red': m = Mat.create({ name:'glass_red', color:0xFF0000, transparent:true, roughness:0, alphaToCoverage:true, opacity:0.8  }); break
				
				
				case 'car':   m = Mat.create({ name:'car', color:0x303030, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03, sheen: 0.5 }); break
				case 'carGlass':   m = Mat.create({ name:'carGlass', color: 0xffffff, metalness: 0, roughness: 0, transmission: 1.0, ior:1.52 }); break

				case 'outline': 
				if( !mat[ 'outline' ] ) mat[ 'outline' ] = outliner;
				m = mat[ 'outline' ]
				//m = Mat.create({ name:'outline', color:0xFFFFFF, type:'Basic', side:BackSide, toneMapped:false, wireframe:false }); 
				break
				case 'debug': m = Mat.create({ name:'debug', type:'Basic', color:0xF37042, wireframe:true, toneMapped: false, transparent:true, opacity:0.5 }); break
				//case 'debug': m = Mat.create({ name:'debug', color:0xF37042, wireframe:true, toneMapped: false, transparent:true, opacity:0.5 }); break
				
				//case 'debug2': m = Mat.create({ name:'debug2', type:'Basic', color:0x00FFFF, wireframe:true, toneMapped: false }); break
				//case 'debug3':  m = Mat.create({ name:'debug3', type:'Basic', color:0x000000, wireframe:true, transparent:true, opacity:0.1, toneMapped: false }); break
				//case 'shadows': m = Mat.create({ name:'shadows', type:'Basic', transparent:true, opacity:0.01 }); break

				//case 'simple': m = Mat.create({ name:'simple', type:'basic'  }); break

				case 'shadow': m = Mat.create({ name:'shadow', type:'shadow', color:0x000000, opacity:0.5 }); break


				case 'bones':  m = Mat.create({ name:'bones', color:0xfde7d6,  wireframe:true }); break
				case 'bones2':  m = Mat.create({ name:'bones2', type:'basic', color:0xdfc4a8, transparent:true, opacity:0.5, depthTest:true, depthWrite:false, alphaToCoverage:true }); break

				
				case 'button':  m = Mat.create({ name:'button', color:0xFF404B, ...matExtra }); break
				//case 'hide': m = new MeshBasicMaterial({ visible:false }); break

				case 'line':
				    m = Mat.create({ name:'line', type:'line', vertexColors: true, toneMapped: false })
			    break
			    case 'liner':
				    m = Mat.create({ name:'liner', type:'line', vertexColors: true, toneMapped: false, depthTest:true, depthWrite:true, alphaToCoverage:true })
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

		Mat.isRealism = false;

		for(let m in mat){
			mat[m].dispose();
			delete mat[m];
		}

		let i = TmpMat.length;
		while( i-- ) { TmpMat[i].dispose(); }
		TmpMat = [];

	},

	upShader:() => {

		let option = Mat.realismOption;
		//if(!option.enable) option = 

		for( let name in mat ){

			const m = mat[name];
			const shader = m.userData.shader;

			for( let o in option ){

				
				// undate shader uniforme
				if(shader){ 
					/*if(o==='enable'){ 
						shader.defines.ENHANCE_SHADER_LIGHTING = option[o] ? "" : undefined;
						//console.log(shader.defines.ENHANCE_SHADER_LIGHTING)
					}*/
					if(shader.uniforms[o]!==undefined) shader.uniforms[o].value = option[o]; 
				}
				// update material option
				if( m[o] ) m[o] = option[o];
			}


		}

	},

}
const outliner = new FakeGlowMaterial();

/*const outliner = new ShaderMaterial({
    uniforms: {
        color: {type: 'c', value: new Color(0xFFFFFF) },
        power: {type: 'f', value: 0.01 },
    },
    vertexShader:`
        uniform float power;
        void main(){
            //vec3 pos = position + normal * power;
            vec3 pos = position + normalize( normal ) * power;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( pos, 1.0 );
        }
    `,
    fragmentShader:`
        uniform vec3 color;
        void main(){
           gl_FragColor = vec4( color, 0.1 );
        }
    `,
    side:BackSide,
    toneMapped: false,
    //wireframe:true,
    //transparent:true,
    //opacity:0.1,

});*/