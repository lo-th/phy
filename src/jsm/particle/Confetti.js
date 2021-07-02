import { math } from '../math.js';
import { root } from '../root.js';

function Confetti( o ) {

    o = o || {};

    var numParticle = o.numParticle || 5000;
    var start = o.start || [0,0,0]
    var dispersion = o.dispersion || [100,600,500];
    var heights = o.heights || [200,600,1000];
    var randomiz = o.randomiz || 100;
    var delay = o.delay || 4;
    var duration = o.duration || 8;

    this.endTime = o.endTime || (delay + duration + 2);

    this.loop = o.loop !== undefined ? o.loop : false;

    this.delayEnd = o.delayEnd || 5;
    this.autoClear = o.autoClear !== undefined ? o.autoClear : true; 
    //this.first = true;

    this.up = true;

    var g = new THREE.SphereBufferGeometry( o.size || 12, 2, 2, 0, 1, 1, 0.5);

    this.geometry = new THREE.InstancedBufferGeometry();
    this.geometry.index = g.index;
    this.geometry.attributes = g.attributes;

    g.dispose();

    var delayDuration = [];
    var startPosition = [];
    var controlPoint1 = [];
    var controlPoint2 = [];
    var endPosition = [];
    var axisAngle = [];
    var color = [];
    

    var j, angle, angle1, angle2, angle3;

    var axis = new THREE.Vector3();
    var cc = new THREE.Color();

    var i = numParticle;

    while( i-- ){

        angle = Math.PI * THREE.Math.randInt(8, 16) + Math.PI * 0.5;
        angle1 = math.rand(0, 2*Math.PI);
        angle2 = math.rand(0, 2*Math.PI);
        angle3 = math.rand(0, 2*Math.PI);

        axis.set( math.rand(-1, 1), math.rand(-1, 1), math.rand(-1, 1) ).normalize();
        cc.setHSL(math.rand(0, 1), math.rand(0.75, 1), math.rand(0.5, 0.6));

        delayDuration.push( math.rand(0, delay), math.rand( delay, duration ) );
        startPosition.push( start[0], start[1], start[2] );
        controlPoint1.push( math.rand(-randomiz*0.3, randomiz*0.3)+Math.cos(angle1)*math.rand(0, dispersion[0]), math.rand(heights[1], heights[2]), math.rand(-randomiz*0.3, randomiz*0.3)+Math.sin(angle1)*math.rand(0, dispersion[0]) );
        controlPoint2.push( math.rand(-randomiz, randomiz)+Math.cos(angle2)*math.rand(0, dispersion[1]), math.rand(heights[0], heights[2]), math.rand(-randomiz, randomiz) + Math.sin(angle2)*math.rand(0, dispersion[1]) );
        endPosition.push( math.rand(-randomiz, randomiz)+Math.cos(angle3)*math.rand(0, dispersion[2]), 0, math.rand(-randomiz, randomiz) + Math.sin(angle3)*math.rand(0, dispersion[2]) );
        axisAngle.push( axis.x, axis.y, axis.z, angle );
        color.push( cc.r, cc.g, cc.b );

        
        
    }

    this.geometry.setAttribute('aDelayDuration', new THREE.InstancedBufferAttribute( new Float32Array(delayDuration), 2 ) );
    this.geometry.setAttribute('aStartPosition', new THREE.InstancedBufferAttribute( new Float32Array(startPosition), 3 ) );
    this.geometry.setAttribute('aControlPoint1', new THREE.InstancedBufferAttribute( new Float32Array(controlPoint1), 3 ) );
    this.geometry.setAttribute('aControlPoint2', new THREE.InstancedBufferAttribute( new Float32Array(controlPoint2), 3 ) );
    this.geometry.setAttribute('aEndPosition', new THREE.InstancedBufferAttribute( new Float32Array(endPosition), 3 ) );
    this.geometry.setAttribute('aAxisAngle', new THREE.InstancedBufferAttribute( new Float32Array(axisAngle), 4 ) );
    this.geometry.setAttribute('color', new THREE.InstancedBufferAttribute( new Float32Array(color), 3 ) );
    

    this.material = new ToonAnimationMaterial({
      
        vertexColors: THREE.VertexColors,
        side: THREE.DoubleSide,
        uniforms: {
           uTime: {value: 0}
        },
        shaderFunctions: [
            "vec3 cubicBezier(vec3 p0, vec3 c0, vec3 c1, vec3 p1, float t)\n{\n    vec3 tp;\n    float tn = 1.0 - t;\n\n    tp.xyz = tn * tn * tn * p0.xyz + 3.0 * tn * tn * t * c0.xyz + 3.0 * tn * t * t * c1.xyz + t * t * t * p1.xyz;\n\n    return tp;\n}\n",
            "float ease(float t, float b, float c, float d) {\n  return c*((t=t/d - 1.0)*t*t + 1.0) + b;\n}\n",
            "vec3 rotateVector(vec4 q, vec3 v)\n{\n    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);\n}\n\nvec4 quatFromAxisAngle(vec3 axis, float angle)\n{\n    float halfAngle = angle * 0.5;\n    return vec4(axis.xyz * sin(halfAngle), cos(halfAngle));\n}\n"
        ],
        shaderParameters: [
            'uniform float uTime;',
            'attribute vec2 aDelayDuration;',
            'attribute vec3 aStartPosition;',
            'attribute vec3 aControlPoint1;',
            'attribute vec3 aControlPoint2;',
            'attribute vec3 aEndPosition;',
            'attribute vec4 aAxisAngle;'
            
        ],
        shaderVertexInit: [
            'float tDelay = aDelayDuration.x;',
            'float tDuration = aDelayDuration.y;',
            'float tTime = clamp(uTime - tDelay, 0.0, tDuration);',
            'float tProgress = ease(tTime, 0.0, 1.0, tDuration);',

            'float angle = aAxisAngle.w * tProgress;',
            'vec4 tQuat = quatFromAxisAngle(aAxisAngle.xyz, angle);'
        ],
        shaderTransformNormal: [
            'objectNormal = rotateVector(tQuat, objectNormal);'
        ],
        shaderTransformPosition: [
            'transformed = rotateVector(tQuat, transformed);',
            'transformed += cubicBezier(aStartPosition, aControlPoint1, aControlPoint2, aEndPosition, tProgress);'
        ]
        }
    );

    
    root.garbage.push( this.geometry );

    THREE.Mesh.call( this, this.geometry, this.material );

    this.name = o.name || 'Confetti';
    this.mTime = 0.0;

    this.castShadow = false;
    this.receiveShadow = false;

};

Confetti.prototype = Object.assign( Object.create( THREE.Mesh.prototype ), {

    constructor: Confetti,

    updateMatrixWorld: function ( force ) {

        this.mTime += (1 / 60);

        if( this.up ){

            if( this.mTime > this.endTime && !this.loop ){ this.up = false;  this.mTime = 0 }
            else {
                this.mTime %= this.endTime; // 12;
                this.material.uniforms['uTime'].value = this.mTime;
            }

        } else {

            if( this.mTime > this.delayEnd && this.autoClear ) this.clear();

        }

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

export { Confetti };



var ToonAnimationMaterial = function( parameters ) {

    THREE.ShaderMaterial.call(this);

    this.shaderFunctions = [];
    this.shaderParameters = [];
    this.shaderVertexInit = [];
    this.shaderTransformNormal = [];
    this.shaderTransformPosition = [];

    this.setValues( parameters );


    var toonShader = THREE.ShaderLib['toon'];

    this.uniforms = THREE.UniformsUtils.merge([toonShader.uniforms, this.uniforms]);
    this.lights = true;
    this.vertexShader = this._concatVertexShader();
    this.fragmentShader = toonShader.fragmentShader;

};

ToonAnimationMaterial.prototype = Object.assign( Object.create( THREE.ShaderMaterial.prototype ), {

    constructor: ToonAnimationMaterial,

    _concatFunctions: function() {
        return this.shaderFunctions.join('\n');
    },
    _concatParameters: function() {
        return this.shaderParameters.join('\n');
    },
    _concatVertexInit: function() {
        return this.shaderVertexInit.join('\n');
    },
    _concatTransformNormal: function() {
        return this.shaderTransformNormal.join('\n');
    },
    _concatTransformPosition: function() {
        return this.shaderTransformPosition.join('\n');
    },

    _concatVertexShader: function() {
        // based on THREE.ShaderLib.phong
        return [
            "#define TOON",

            "varying vec3 vViewPosition;",

            "#ifndef FLAT_SHADED",

            " varying vec3 vNormal;",

            "#endif",

            THREE.ShaderChunk[ "common" ],
            THREE.ShaderChunk[ "uv_pars_vertex" ],
            //THREE.ShaderChunk[ "uv2_pars_vertex" ],
            //THREE.ShaderChunk[ "displacementmap_pars_vertex" ],
            THREE.ShaderChunk[ "color_pars_vertex" ],
            //THREE.ShaderChunk[ "fog_pars_vertex" ],
            //THREE.ShaderChunk[ "morphtarget_pars_vertex" ],
            //THREE.ShaderChunk[ "skinning_pars_vertex" ],
            THREE.ShaderChunk[ "shadowmap_pars_vertex" ],
            THREE.ShaderChunk[ "logdepthbuf_pars_vertex" ],
            //THREE.ShaderChunk[ "clipping_planes_pars_vertex" ],

            this._concatFunctions(),

            this._concatParameters(),

            "void main() {",

            this._concatVertexInit(),

            THREE.ShaderChunk[ "uv_vertex" ],
            //THREE.ShaderChunk[ "uv2_vertex" ],
            THREE.ShaderChunk[ "color_vertex" ],
            THREE.ShaderChunk[ "beginnormal_vertex" ],

            this._concatTransformNormal(),

            //THREE.ShaderChunk[ "morphnormal_vertex" ],
            //THREE.ShaderChunk[ "skinbase_vertex" ],
            //THREE.ShaderChunk[ "skinnormal_vertex" ],
            THREE.ShaderChunk[ "defaultnormal_vertex" ],

            "#ifndef FLAT_SHADED", // Normal computed with derivatives when FLAT_SHADED

            " vNormal = normalize( transformedNormal );",

            "#endif",

            THREE.ShaderChunk[ "begin_vertex" ],

            this._concatTransformPosition(),

            //THREE.ShaderChunk[ "morphtarget_vertex" ],
            //THREE.ShaderChunk[ "skinning_vertex" ],
            //THREE.ShaderChunk[ "displacementmap_vertex" ],
            THREE.ShaderChunk[ "project_vertex" ],
            THREE.ShaderChunk[ "logdepthbuf_vertex" ],

            " vViewPosition = - mvPosition.xyz;",

            THREE.ShaderChunk[ "worldpos_vertex" ],


            THREE.ShaderChunk[ "shadowmap_vertex" ],
            //THREE.ShaderChunk[ "fog_vertex" ],

            "}"

        ].join( "\n" );
    }
})