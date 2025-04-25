import { Vector3, Float32BufferAttribute, LineSegments, BufferGeometry, LineBasicMaterial, Color } from 'three';

export class Debuger extends LineSegments {

	constructor( motor ) {

		super()

        this.rayCount = 0

        this.ray = [];

        this.motor = motor;

		this.maxVertices = 10000;
		this.currentVertex = 0;

		this.geometry = new BufferGeometry();
		this.geometry.setAttribute( 'position', new Float32BufferAttribute( this.maxVertices * 3 , 3) );
		this.geometry.setAttribute( 'color', new Float32BufferAttribute(  this.maxVertices * 3 , 3) );

		this.positions = this.geometry.attributes.position.array;
		this.colors = this.geometry.attributes.color.array;

		this.material = new LineBasicMaterial({ vertexColors:true, toneMapped:false, depthTest:false, depthWrite:false });
        this.material.transparent = true; this.renderOrder = 30000;
		this.frustumCulled = false;

	}

    DrawRay( a, b, c ){

        c = new Color(c);

        let i = this.currentVertex;
        let n = i * 3;
        this.positions[n] = a.x;
        this.positions[n + 1] = a.y;
        this.positions[n + 2] = a.z;
        this.colors[n] = c.r;
        this.colors[n + 1] = c.g;
        this.colors[n + 2] = c.b;

        i++;
        n = i * 3;
        this.positions[n] = a.x + b.x;
        this.positions[n + 1] = a.y + b.y;
        this.positions[n + 2] = a.z + b.z;
        this.colors[n] = c.r;
        this.colors[n + 1] = c.g;
        this.colors[n + 2] = c.b;
        this.currentVertex += 2;

    }

	collapseBuffer () {

        let i = this.maxVertices;
        let min = this.currentVertex;
        let n = 0;
        while(i>=min){
            n = i * 3;
            this.positions[n] = 0;
            this.positions[n+1] = 0;
            this.positions[n+2] = 0;
            this.colors[n] = 0;
            this.colors[n+1] = 0;
            this.colors[n+2] = 0;
            i--;
        }
    }

    insertLine (a, b, c) {
        
        let i = this.currentVertex;
        let n = i * 3;
        this.positions[n] = a.x;
        this.positions[n + 1] = a.y;
        this.positions[n + 2] = a.z;
        this.colors[n] = c.r;
        this.colors[n + 1] = c.g;
        this.colors[n + 2] = c.b;

        i++;
        n = i * 3;
        this.positions[n] = b.x;
        this.positions[n + 1] = b.y;
        this.positions[n + 2] = b.z;
        this.colors[n] = c.r;
        this.colors[n + 1] = c.g;
        this.colors[n + 2] = c.b;
        this.currentVertex += 2;

    }

    draw() {

        /*let i = this.ray.length, r;
        while(i--){
            r = this.ray[i]
            this.insertLine(r.a, r.b, r.c)
        }*/


    	this.collapseBuffer();
        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;

        this.currentVertex = 0

    }

    dispose() {

        this.parent.remove(this);
        this.material.dispose();
        this.geometry.dispose();

    }

}