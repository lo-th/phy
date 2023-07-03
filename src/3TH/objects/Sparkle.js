import {
	Points, Color, PointsMaterial, BufferAttribute, FloatType, Texture, Matrix4, Vector3, AdditiveBlending, Mesh, BoxGeometry, SRGBColorSpace
} from 'three';
import { math } from '../math.js';
import { MeshSurfaceSampler } from '../../jsm/math/MeshSurfaceSampler.js';

export class Sparkle extends Points {

	constructor( o = {} ) {

        super();

        this.num = o.num || 12;

        this.controler = o.controler || null;

        this.sampler = new MeshSurfaceSampler( new Mesh( new BoxGeometry().toNonIndexed() ) );
        this.v = new Vector3();

        this.objectList = o.objectList;
        this.lng = this.objectList.length;

        this.numParticle = this.lng * this.num;

	    this.range = o.range || [2, 2, 2]
	    this.speed = o.speed || [0.002, 0.001]

	    this.disp = o.disp || [0.5, 0.5, 0.5];

        let cc = new Color();
        this.velocities = [];
        this.pos = [];

        let alphas = [];
        let sizes = [];
        let angles = [];
        let position = [];
        let color = [];

        this.tt = [];
        //this.ba = [];

        let mul = 1.02;
        let model;

        let i = this.numParticle, j, g, n, glng, m, c

        while( i-- ){

        	position.push( 0,0,0 );
            color.push( 1,1,1 );
	        sizes.push( math.rand(0.2, 1.5) );
	        alphas.push( math.rand(0, 1) );
	        angles.push( 0 )
	        //this.ba.push( math.rand( 0, Math.PI * 2 ) )
	        this.tt.push( math.randInt(-300,1) )
	        
	    }

	    // point on geometry
	    i = this.lng;

	    while( i-- ){

            this.setSamplerGeometry( this.objectList[i].children[0].geometry );

	    	c = this.objectList[i].children[0].material.color;
	    	
	    	//g = this.objectList[i].children[0].geometry.attributes.position;
	    	//glng = g.count;
	    	j = this.num;

	    	while( j-- ){

	    		n = ((i*this.num) + j) * 3;
	    		//m = math.randInt(1, glng-1) * 3;

	    		this.v.set(math.rand(-5,5), math.rand(-5,5), math.rand(-5,5))
	    		this.sampler.sample( this.v );

                this.v.toArray( this.pos, n);

	    		cc.copy(c);

	    		color[n] = c.r;
	    		color[n+1] = c.g;
	    		color[n+2] = c.b;

	    	}
	    }



	    this.positions = new Float32Array(position);
	    this.angles = new Float32Array(angles);
	    this.alphas = new Float32Array(alphas);
        this.sizes = new Float32Array(sizes);

	    this.geometry.setAttribute('position', new BufferAttribute( this.positions, 3 ) );
        this.geometry.setAttribute('color', new BufferAttribute( new Float32Array(color), 3 ) );
        this.geometry.setAttribute('sizer', new BufferAttribute( this.sizes, 1 ) );
        this.geometry.setAttribute('alphas', new BufferAttribute( this.alphas, 1 ) );
        this.geometry.setAttribute('angles', new BufferAttribute( this.angles, 1 ) );

        this.texture = this.makeTexture();

        this.material = new PointsMaterial({

	        name:'snow',
	        size: 1,
	        color: 0xffffff,
	        vertexColors: true,
	        map: this.texture,
	        blending: AdditiveBlending,
	        transparent: true,
	        // opacity: 0.8,
	        fog: false,
	        //depthWrite: false,
	        //depthTest: false,
	        depthWrite: false,

            premultipliedAlpha : true,
            alphaToCoverage : true,
	        /*polygonOffset: true,
	        polygonOffsetFactor: -1,
            polygonOffsetUnits: -4*/
	    });

	    this.material.onBeforeCompile = function ( shader ) {

	    	var vertex = shader.vertexShader;
			vertex = vertex.replace( '#include <clipping_planes_pars_vertex>', vertAdd );
			vertex = vertex.replace( '#include <fog_vertex>', vertMainAdd );
			shader.vertexShader = vertex;

			var fragment = shader.fragmentShader;
			fragment = fragment.replace( '#include <clipping_planes_pars_fragment>', fragAdd );

            fragment = fragment.replace( '#include <output_fragment>', '#include <output_fragment>' + fragMainAdd );
			//fragment = fragment.replace( 'gl_FragColor = vec4( outgoingLight, diffuseColor.a );', fragMainAdd );

			fragment = fragment.replace( '#include <map_particle_fragment>', fragMap );

			shader.fragmentShader = fragment;


        }

	    this.mTime = 0.0;
	    this.castShadow = false;
	    this.receiveShadow = false;
	    //this.renderDepth = -1;

    }

    setSamplerGeometry( g ) {

        this.sampler.geometry.dispose();

        this.sampler.geometry = g.clone().toNonIndexed();
        this.sampler.positionAttribute = this.sampler.geometry.getAttribute( 'position' );
        //this.sampler.colorAttribute = this.sampler.geometry.getAttribute( 'color' );

        this.sampler.build();

    }

    makeTexture (){

    	let canvas = document.createElement('canvas');
        let ctx = canvas.getContext('2d');

        let d = 64;
        canvas.width = d;
        canvas.height = d;
        let mid = d * 0.5;

        //ctx.save();
        let g1 = ctx.createRadialGradient(mid,mid,0,mid,mid,mid);
        g1.addColorStop(0, 'rgba(255,255,255,0.4)');
        g1.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        g1.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g1;
        ctx.fillRect(0,0,d,d);
        //ctx.restore();

        g1 = ctx.createRadialGradient(mid,mid,0,mid,mid,mid);
        g1.addColorStop(0, 'rgba(255,255,255,1.0)');
        g1.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        g1.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.strokeStyle = g1;
        ctx.beginPath();
        ctx.moveTo(0, mid);
        ctx.lineTo(d, mid)
        ctx.lineWidth = 2;
        ctx.stroke()

        ctx.beginPath();
        ctx.moveTo(mid, 0);
        ctx.lineTo(mid, d )
        ctx.lineWidth = 2;
        ctx.stroke()

        g1 = ctx.createRadialGradient(mid,mid,0,mid,mid,mid);
        g1.addColorStop(0, 'rgba(255,255,255,0.4)');
        g1.addColorStop(0.5, 'rgba(255,255,255,0.2)');
        g1.addColorStop(1, 'rgba(255,255,255,0)');

        ctx.strokeStyle = g1;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(d, d )
        ctx.lineWidth = 1;
        ctx.stroke()

        ctx.beginPath();
        ctx.moveTo(d, 0);
        ctx.lineTo(0, d )
        ctx.lineWidth = 1;
        ctx.stroke()

        var texture = new Texture(canvas);
        //texture.type = FloatType;
        texture.colorSpace = SRGBColorSpace;
        texture.needsUpdate = true;
        return texture;

    }

    updateMatrixWorld ( force ) {

    	let dt = 0.01666;
        let v = this.v;

        this.mTime += dt;

        let angular = 0;
        if(this.controler) angular = this.controler.getAzimuthalAngle();

        let i = this.lng, j, p, n, q, a, t;
        while(i--){

        	//this.m.copy( this.objectList[i].matrix )//.invert();

        	p = this.objectList[i].position;
        	q = this.objectList[i].quaternion;
        	//v.copy(p).applyQuaternion( q )//.add( p );
        	//
        	//p.applyNormalMatrix(this.m);
        	j = this.num;

        	while( j-- ){

        		n = ((i*this.num) + j);

        		a = this.alphas[ n ];
        		t = this.tt[n];

        		if(t===0){
        			a += dt*0.1;
        			if( a>0.5 ) t = 1;
        		} else if(t===1){
        			a -= dt*0.1;
        			if( a<0 ){ 
        				t = math.randInt(-300,0);
        				//this.ba[n] = math.rand( 0, Math.PI * 2 );
                        this.sizes[n] = math.rand(0.2, 1.5);
        			}
        		} else {
        			t++;
        		}

        		this.alphas[ n ] = math.clamp(a,0,1);
        		this.tt[n] = t;

        		//this.angles[ n ] = this.ba[n] - angular;

                this.angles[ n ] = - angular;

        		
        		if(this.alphas[ n ]>1) this.alphas[ n ] = math.rand(-5, 0);

        		n *= 3;
                v.fromArray( this.pos, n ).applyQuaternion( q ).add( p );
                v.toArray( this.positions, n);

        	}

        }


        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.alphas.needsUpdate = true;
        this.geometry.attributes.angles.needsUpdate = true;
        this.geometry.attributes.sizer.needsUpdate = true;

    }

    dispose () {

    	this.parent.remove(this)
        this.geometry.dispose()
        this.material.map.dispose()
        this.material.dispose()
        
    }

    raycast( raycaster, intersects ) {
        return
    }

}


const vertAdd =/* glsl */`
#include <clipping_planes_pars_vertex>

attribute float sizer;
attribute float alphas;
attribute float angles;

varying float aaa;
varying float ang;
`;

const vertMainAdd =/* glsl */`
#include <fog_vertex>

aaa = alphas;
ang = angles;

gl_PointSize *= sizer;

`;


const fragAdd =/* glsl */`
#include <clipping_planes_pars_fragment>

varying float aaa;
varying float ang;

vec2 rotUV(vec2 uv, float angle){
    float s = sin(angle);
    float c = cos(angle);
    mat2 r = mat2( c, -s, s, c);
    r *= 0.5; r += 0.5; r = r * 2.0 - 1.0;
    uv -= 0.5; uv = uv * r; uv += 0.5;
    return uv;
}
`;

const fragMainAdd =/* glsl */`

gl_FragColor.a *= aaa;

//gl_FragColor = vec4( outgoingLight, diffuseColor.a * aaa  );
//gl_FragColor = vec4( outgoingLight, aaa );

`;


const fragMap =/* glsl */`
#if defined( USE_MAP ) || defined( USE_ALPHAMAP )

	vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;

#endif

#ifdef USE_MAP

	vec4 mapTexel = texture2D( map, rotUV( uv, ang ) );
	diffuseColor *= mapTexel;

#endif

#ifdef USE_ALPHAMAP

	diffuseColor.a *= texture2D( alphaMap, uv ).g;

#endif
`;