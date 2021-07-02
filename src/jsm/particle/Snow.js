import { math } from '../math.js';
import { root } from '../root.js';

function Snow( o ) {

    o = o || {};

    this.numParticle = o.numParticle || 10000;

    this.range = o.range || [500, 250, 500]
    this.speed = o.speed || [0.02, 0.01]
    this.size = o.size ||3;



    this.geometry = new THREE.BufferGeometry();

    var position = [];
    var color = [];

    var cc = new THREE.Color();
    this.velocities = [];

    var i = this.numParticle;

    while( i-- ){

        position.push( math.rand(-this.range[0], this.range[0]), math.rand(0, this.range[1]), math.rand(-this.range[2], this.range[2]) )
        cc.setHSL(math.rand(0, 1), math.rand(0.75, 1), math.rand(0.9, 1));
        color.push( cc.r, cc.g, cc.b );

        this.velocities.push(
            math.rand(-3, 3) * this.speed[0],
            math.rand(1, 10) * -this.speed[1],
            math.rand(-3, 3) * this.speed[0],
        )
        
    }

    this.positions = new Float32Array(position);

    this.geometry.setAttribute('position', new THREE.BufferAttribute( this.positions, 3 ) );
    this.geometry.setAttribute('color', new THREE.BufferAttribute( new Float32Array(color), 3 ) );

    this.texture = this.makeTexture();

    this.material = new THREE.PointsMaterial({

        name:'snow',
        size: this.size,
        color: 0xffffff,
        vertexColors: true,
        map: this.texture,
        // blending: THREE.AdditiveBlending,
        transparent: true,
        // opacity: 0.8,
        fog: true,
        depthWrite: false

    });



    THREE.Points.call( this, this.geometry, this.material );

    root.garbage.push( this.geometry );
    root.garbage.push( this.texture );
    //root.view.addMaterial( this.material );

    //this.geometry.velocities = velocities;

    this.name = o.name || 'snow';
    this.mTime = 0.0;

    this.castShadow = false;
    this.receiveShadow = false;

};

Snow.prototype = Object.assign( Object.create( THREE.Points.prototype ), {

    constructor: Snow,

    makeTexture: function () {

        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        var diameter = 64;
        canvas.width = diameter;
        canvas.height = diameter;
        var canvasRadius = diameter / 2;

        ctx.save();
        var gradient = ctx.createRadialGradient(canvasRadius,canvasRadius,0,canvasRadius,canvasRadius,canvasRadius);
        gradient.addColorStop(0, 'rgba(255,255,255,1.0)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0,0,diameter,diameter);
        ctx.restore();

        var texture = new THREE.Texture(canvas);
        texture.type = THREE.FloatType;
        texture.needsUpdate = true;
        return texture;

    },

    updateMatrixWorld: function ( force ) {

        this.mTime += 0.01666



        var i = this.numParticle, n, vX, vZ;
        while(i--){
            n = i*3;

            //vX = Math.sin( this.mTime * 0.001 * this.velocities[n]) //* 0.1;
            //vZ = Math.cos( this.mTime * 0.0015 * this.velocities[n+2]) //* 0.1;

            vX = Math.sin( this.mTime * this.velocities[n]) * 0.01;
            vZ = Math.cos( this.mTime * this.velocities[n+2]) * 0.01;


            this.positions[n] += vX;
            this.positions[n+1] += this.velocities[n+1];
            this.positions[n+2] += vZ;

           if( this.positions[n+1]<0 ) this.positions[n+1] = this.range[1]
        }

        this.geometry.attributes.position.needsUpdate = true


        THREE.Mesh.prototype.updateMatrixWorld.call( this, force );

    },

    clear:function () {

        this.parent.remove(this);
        this.dispose();

    },

    dispose: function () {

        this.geometry.dispose();
        this.material.dispose();
        
    },

   
});

export { Snow };

