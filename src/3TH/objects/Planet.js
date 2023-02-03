import { math } from '../math.js';
import { root } from '../root.js';

function Planet( o ) {

    o = o == undefined ? {} : o;

    this.radius = o.radius !== undefined ? o.radius : 100;
    this.resolution = o.resolution !== undefined ? o.resolution : 10;

    this.data = {
        level: o.level || [1,0.25],
        frequency: o.frequency || [0.1,0.5],
        expo: o.expo || 2,
        height: o.height || 4,
    }

    this.uvx = o.uv || [4,4];

    this.m1 = root.loadTextures('./assets/textures/terrain/crater.jpg', { flip:false, repeat:this.uvx, encoding:true }), 
    this.m2 = root.loadTextures('./assets/textures/terrain/crater_n.jpg', { flip:false, repeat:this.uvx }),


    this.material = root.view.addMaterial({ 
        name:'planet', 
        vertexColors:THREE.VertexColors, 
        color:0x63605c, 
        map:this.m1, 
        normalMap:this.m2,
        normalScale:new THREE.Vector2(1,1), 
        roughness:0.25, 
        metalness:0.3,
        //envMap:root.view.getEnvmap()
     });

    

    this.makeGeometry();

    root.garbage.push( this.geometry );


    THREE.Mesh.call( this, this.geometry, this.material );

    this.name = o.name || 'planet';

    this.castShadow = true;
    this.receiveShadow = true;

};

Planet.prototype = Object.assign( Object.create( THREE.Mesh.prototype ), {

    constructor: Planet,

    makeGeometry: function () {

        this.geometry = new THREE.BoxBufferGeometry( 1, 1, 1, this.resolution, this.resolution, this.resolution );

        this.lng = this.geometry.attributes.position.count;

        this.colors = new Float32Array( this.lng * 3 );
        this.geometry.setAttribute( 'color', new THREE.BufferAttribute( this.colors, 3 ) );


        var i = this.lng, n, w = new THREE.Vector3();
        this.vertices = this.geometry.attributes.position.array;
        this.s = [];

        while( i-- ) {

            n = i*3;

            w.set( this.vertices[n], this.vertices[n+1], this.vertices[n+2] ).normalize().multiplyScalar( this.radius );

            this.s.push( w.x, w.y, w.z );

        }

        this.update();

    },

    update: function(){

        var i = this.lng, v, c, f, hh, n, w = new THREE.Vector3()

        while(i--){

            n = i*3;

            w.set( this.s[n], this.s[n+1], this.s[n+2] );

            c = math.noise( w, this.data );

            c = Math.pow( c, this.data.expo );

            c = c>1 ? 1:c;
            c = c<0 ? 0:c;

            w.normalize().multiplyScalar( c * this.data.height );

            this.vertices[n] = this.s[n] + w.x;
            this.vertices[n+1] = this.s[n+1] + w.y;
            this.vertices[n+2] = this.s[n+2] +  w.z;

            hh = (c*0.75)+0.25;

            this.colors[n] = hh;
            this.colors[n+1] = hh;
            this.colors[n+2] = hh;

        }

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.computeVertexNormals();

    },

    dispose: function () {

        this.geometry.dispose();
        this.material.dispose();
        
    },

   
});

export { Planet };