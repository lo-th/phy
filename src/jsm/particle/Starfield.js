import { math } from '../math.js';
import { root } from '../root.js';

function Starfield( o ) {

    o = o || {};

    this.numParticle = o.numParticle || 10000;

    this.distance = o.distance || 2000;
    this.maxSize = o.maxSize || 10;
    this.mid = o.mid || 400;
    this.fog = o.fog || false;
    this.full = o.full || false;

    this.geometry = new THREE.BufferGeometry();

    var position = [];
    var color = [];
    var sizes = []

    var cc = new THREE.Color();

    var p = new THREE.Vector3();
    this.velocities = [];

    var i = this.numParticle, phi, theta;

    while( i-- ){

        p.set( math.rand( -1, 1 ),  math.rand( this.full ? -1 : 0, 1 ),  math.rand( -1, 1 ) ).normalize().multiplyScalar( this.distance );
        position.push( p.x, p.y, p.z );

        
        cc.setHSL( math.rand(0, 1), math.rand(0.75, 1), math.rand(0.6, 1));
        color.push( cc.r, cc.g, cc.b );

        sizes.push( math.rand(1, this.maxSize) );

    }

    this.positions = new Float32Array(position);

    this.geometry.setAttribute('position', new THREE.BufferAttribute( this.positions, 3 ) );
    this.geometry.setAttribute('color', new THREE.BufferAttribute( new Float32Array(color), 3 ) );
    this.geometry.setAttribute( 'sizer', new THREE.BufferAttribute( new Float32Array(sizes), 1 ) );


    this.material = new THREE.PointsMaterial({

        size: 1,
        color: 0xffffff,
        vertexColors: true,
        fog: this.fog,
        depthWrite: false

    });

    this.material.onBeforeCompile = function ( shader ) {

        var vertex = shader.vertexShader;

        vertex = vertex.replace( 'uniform float size;', ['uniform float size;', 'attribute float sizer;' ].join("\n") );
        vertex = vertex.replace( 'gl_PointSize = size;', ['gl_PointSize = sizer;' ].join("\n") );
        shader.vertexShader = vertex;

    };



    THREE.Points.call( this, this.geometry, this.material );

    root.garbage.push( this.geometry );
    //root.view.addMaterial( this.material );

    //this.geometry.velocities = velocities;

    this.name = o.name || 'stars';

    this.castShadow = false;
    this.receiveShadow = false;

};

Starfield.prototype = Object.assign( Object.create( THREE.Points.prototype ), {

    constructor: Starfield,

    clear:function () {

        this.parent.remove(this);
        this.dispose();

    },

    dispose: function () {

        this.geometry.dispose();
        this.material.dispose();
        
    },

   
});

export { Starfield };
