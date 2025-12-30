import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const _m1 = /*@__PURE__*/ new THREE.Matrix4();

export class GlowPlane extends THREE.Mesh {
	
	constructor( camera, w = 1, h = 1, d = 1, color = [1, 1, 1, .95], circle=false ) {

        super();

        this.tmp = new THREE.Vector3();
        this.worlcam = new THREE.Vector3();
        this.localcam = new THREE.Vector3();
        this.quadNormal= new THREE.Vector3(0, 0, 1);

        this.pushDistance = d;

        this.quadColor = color;
        this.edgeColor = [...color];//[0, 0, 0, 0]
        this.edgeColor[3]=0

        this.eyeToVerticesWorldSpace = [];

        this.pushDirectionsWorldSpace = [
	        new THREE.Vector3(),
	        new THREE.Vector3(),
	        new THREE.Vector3(),
        ]

        this.circle = circle;

        this.geometry = this.circle ? new GlowCircleGeometry( w ) : new GlowPlaneGeometry( w, h );
        this.camera = camera;
        //this.geometry.rotateY(Math.PI*0.5)
        this.material = new THREE.MeshBasicMaterial({ 
        	//wireframe:true, 
        	vertexColors:true, 
        	//transparent:true, 
        	//dithering:true, 
        	//alphaToCoverage:true,
        	//premultipliedAlpha:true,
        	//side:THREE.DoubleSide, 
        	//alphaHash:true,
        	blending:THREE.AdditiveBlending,
        	//precision:"highp",//"highp", "mediump" or "lowp"
        	depthWrite:false,
        	toneMapped:true,
        	
        });

        this.vertices = [];

        // Create this.vertices from position attribute  
        const lng = this.geometry.attributes.position.count      
        const position = this.geometry.attributes.position.array
        let i = lng, n = 0;
        while (i --) {
        	n = i*3;
            this.vertices[i] = new THREE.Vector3(position[n], position[n + 1], position[n + 2])
        }


        //this.geometry.computeVertexNormals()
        

    }

    map ( value, in_min, in_max, out_min, out_max ) {
	    return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
	}

    updateMatrixWorld( force ){

    	super.updateMatrixWorld(force);

    	let i, n, m;
        const maxVertice = this.geometry.attributes.position.count;
        const shapeVertice = this.geometry.shapeVertrice;

    	_m1.copy( this.matrixWorld ).invert()

    	this.worlcam.copy(this.camera.position);
    	this.localcam.copy(this.camera.position).applyMatrix4( _m1 );

        const directionToCenter = this.tmp.copy(this.position).sub(this.worlcam).normalize();
        directionToCenter.transformDirection(_m1);

        const dot = directionToCenter.dot(this.quadNormal);
        const sign = Math.sign(dot);
        // Set colors from dot        
        const alpha = THREE.MathUtils.clamp(this.map(Math.abs(dot), 0.001, 0.1, 0.0, 1.0), 0, 1);
        const color = this.geometry.attributes.color.array;

        // apply color

        i = maxVertice;
        while (i--) {
            n = i*4;
            if(i<shapeVertice) {
                color[n]    = this.quadColor[0];
                color[n+1]  = this.quadColor[1];
                color[n+2]  = this.quadColor[2];
                color[n+3]  = this.quadColor[3] * alpha;
            } else {
                color[n]    = this.edgeColor[0];
                color[n+1]  = this.edgeColor[1];
                color[n+2]  = this.edgeColor[2];
                color[n+3]  = this.edgeColor[3];
            }
        }

        
        i = shapeVertice
        while (i--) {
            this.eyeToVerticesWorldSpace[i] = this.vertices[i].clone()
            this.eyeToVerticesWorldSpace[i].sub(this.localcam).normalize();
        }


        // Extrude quad vertices

        if(this.circle){

            i = shapeVertice
            n = 1
            while (i--) {
                n = i+1
                if(n>shapeVertice-1) n = 1;
                if(n<1) n = shapeVertice-1;

                m = i+2
                if(m>shapeVertice-1) m = 1;
                if(m<1) m = shapeVertice-1;
                
                this.pushDirectionsWorldSpace[0].copy(this.eyeToVerticesWorldSpace[0]).cross(this.eyeToVerticesWorldSpace[(n) ]).multiplyScalar(sign).normalize();
                this.pushDirectionsWorldSpace[1].copy(this.eyeToVerticesWorldSpace[m]).cross(this.eyeToVerticesWorldSpace[(n) ]).multiplyScalar(sign).normalize();
                this.pushDirectionsWorldSpace[2].copy(this.pushDirectionsWorldSpace[0]).add(this.pushDirectionsWorldSpace[1]).normalize();
                
                const offset = this.pushDirectionsWorldSpace[2].clone().multiplyScalar(this.pushDistance);
                this.vertices[ shapeVertice + i] = this.vertices[n].clone().add(offset);
                
            }
            
        } else {

            i = shapeVertice
            while (i--) {

                this.pushDirectionsWorldSpace[0].copy(this.eyeToVerticesWorldSpace[i]).cross(this.eyeToVerticesWorldSpace[(i + 3) % shapeVertice]).multiplyScalar(sign).normalize();
                this.pushDirectionsWorldSpace[1].copy(this.eyeToVerticesWorldSpace[(i + 1) % shapeVertice]).cross(this.eyeToVerticesWorldSpace[i]).multiplyScalar(sign).normalize();
                this.pushDirectionsWorldSpace[2].copy(this.pushDirectionsWorldSpace[0]).add(this.pushDirectionsWorldSpace[1]).normalize();
              
                for (let j = 0; j < 3; j++) {
                    const offset = this.pushDirectionsWorldSpace[j].clone().multiplyScalar(this.pushDistance);
                    this.vertices[ shapeVertice + j + 3 * i ] = this.vertices[i].clone().add(offset);
                }
            }

        }

        // apply edge scale

        const position = this.geometry.attributes.position.array;
        i = maxVertice;
    
        while (i--) {
        	n = i*3
        	position[n] = this.vertices[i].x;
        	position[n+1] = this.vertices[i].y;
        	position[n+2] = this.vertices[i].z;
        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;

    }

}

class GlowCircleGeometry extends THREE.BufferGeometry {
    constructor( radius = 1, segments = 12 ) {

        super();

        this.type = 'GlowCircleGeometry';
        let i, j, n, m;

        //let g1 = new THREE.CircleGeometry( radius, segments, 0, Math.PI * 2 );
        //let g2 =new THREE.RingGeometry( radius, radius+1, segments, 1, 0, Math.PI * 2 );

        let g2 =new THREE.RingGeometry( 0, radius*2, segments, 2, 0, Math.PI * 2 );

        this.shapeVertrice = segments+1;
        


        this.copy( mergeVertices(g2), 1e-4 );

        this.edgeCount = 1

        let lng = this.attributes.position.count;

        const color = [];
        
        i = lng
        while(i--){
            n = i*3;

            m = i*4;
            color[m] = 1;
            color[m+1] = 1;
            color[m+2] = 1;
            color[m+3] = 1;

        }

        this.setAttribute( 'color', new THREE.Float32BufferAttribute( color, 4 ) );

    }
}

class GlowPlaneGeometry extends THREE.BufferGeometry {

	constructor( width = 1, height = 1 ) {

		super();

		this.type = 'GlowPlaneGeometry';

		this.parameters = {
			width: width,
			height: height,
			//widthSegments: widthSegments,
			//heightSegments: heightSegments
		};

        this.shapeVertrice = 4;
        this.edgeCount = 3;

		const width_half = width / 2;
		const height_half = height / 2;

		const indices = [
		//0,1,2, 0,2,3,  
        0,1,2, 2,3,0,                                                 // Quad
        0,5,7, 0,7,1, 1,8,10, 1,10,2, 2,11,13, 2,13,3, 3,14,4, 3,4,0,   // Flaps
        0,4,6, 0,6,5, 1,7,9, 1,9,8, 2,10,12, 2,12,11, 3,13,15, 3,15,14  // Connections
		];
		const vertices = [
		-width_half, -height_half, 0.0,
        width_half, -height_half, 0.0,
        width_half, height_half, 0.0,
        -width_half, height_half, 0.0,

        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,

        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,

        -1.0, -1.0, 0.0,
        1.0, -1.0, 0.0,
        1.0, 1.0, 0.0,
        -1.0, 1.0, 0.0,
		];

        const normals = [];
        const color = [];

        let i = vertices.length/3, n, m;
        while(i--){
            n = i*3;
            m = i*4;
            normals[n] = 0;
            normals[n+1] = 0;
            normals[n+2] = 0;

            color[m] = 0;
            color[m+1] = 0;
            color[m+2] = 0;
            color[m+3] = 0;

        }

		const uvs = [
		0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        1.0, 0.0,
        1.0, 0.0,
        1.0, 0.0,
        1.0, 0.0,

        1.0, 0.0,
        1.0, 0.0,
        1.0, 0.0,
        1.0, 0.0,

        1.0, 0.0,
        1.0, 0.0,
        1.0, 0.0,
        1.0, 0.0,
		];

		this.setIndex( indices );
		this.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
		this.setAttribute( 'color', new THREE.Float32BufferAttribute( color, 4 ) );
		this.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		this.setAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

	}

	copy( source ) {

		super.copy( source );

		this.parameters = Object.assign( {}, source.parameters );

		return this;

	}

	static fromJSON( data ) {

		return new PlaneGeometry( data.width, data.height, data.widthSegments, data.heightSegments );

	}

}
