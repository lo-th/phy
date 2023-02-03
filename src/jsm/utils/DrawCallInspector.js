import * as THREE from 'three';

// © Fyrestar - https://github.com/Fyrestar/THREE.DrawCallInspector

/*let k = new THREE.Scene(), b = new THREE.Scene();
b.children.push(null);
let u = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
    r = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.MeshBasicMaterial());
k.add(r);*/

export const DCI = {
    init:( renderer, scene, camera ) => {
        DCI.EE = new DrawCallInspector( renderer, scene, camera, { enableMaterials: false, skipFrames:4 });//, wait:1
        DCI.EE.mount();
    },
    begin:(renderer, scene, camera) => {
        DCI.EE.update();
        DCI.EE.begin();
    },
    end:(renderer, scene, camera) => {
        let ground = Main.getGround()
        if( ground !== null ) ground.visible = false
        DCI.EE.end();
        if( ground !== null ) ground.visible = true
    },

}

let b = new THREE.Scene()
b.children.push(null);

let q = {
    index: 0,
    length: 0,
    list: [],
    push: function (a) {
        this.index + 1 > this.length && (this.list.push(a), this.index++, this.length++);
        this.list[this.index] = a;
        this.index++;
    },
};


class DrawCallInspector {

    constructor( renderer, scene, camera, b = {} ) {

        this.sceneK = new THREE.Scene();
        //this.sceneB = new THREE.Scene();


        this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), new THREE.MeshBasicMaterial({ transparent:true }));
        this.sceneK.add( this.mesh );
        this.sceneK.background = new THREE.Color( 0x000000 )


        this.size = new THREE.Vector2()
        this.tmpV = new THREE.Vector4()
        //this.tmpC = new THREE.Vector4()

        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.maxDeltaLabel = "";
        this.fade = b.fade || 0.01;
        this.bias = b.bias || 0.25;
        this.scale = b.scale || 0.25;
        this.overlayStrength = b.overlayStrength || 0.5;
        this.enableGLHooks = void 0 !== b.enableGLHooks ? b.enableGLHooks : !0;
        this.enableMaterials = void 0 !== b.enableMaterials ? b.enableMaterials : !1;
        this.skipFrames = void 0 !== b.skipFrames ? b.skipFrames : 4;
        this.resolution = new THREE.Vector2(256, 256);
        this.painted = this.mounted = !1;
        this.recordMode = void 0 !== b.record ? b.record : 0;
        this.timer = null;
        this.enabled = void 0 !== b.enabled ? b.enabled : !0;
        this.wait = void 0 !== b.wait ? b.wait : !1;
        this.updateFrameIndex = this.pending = this.maxDelta = this.calls = this.stage = this.recordCount = 0;
        this.updatePreview = !1;
        this.autoUpdatePreview = void 0 !== b.autoUpdatePreview ? b.autoUpdatePreview : !0;

        this.frameIndex= 0,
        this.needsUpdate= !1,
        this.needsRecord= !1,
        this.RecordDraw = 0;
        this.RecordRender = 1;
    }
    
    destroy () {
        q.length = 0;
        q.list = [];
    }

    mount (c) {

        function d( a ) {

            a.uniforms._uAge = { value: null };
            a.uniforms._uDelta = { value: null };
            a.uniforms.overlayStrength = { value: h.overlayStrength };

            /*a.fragmentShader = "uniform float _uDelta;\n" + a.fragmentShader;
            a.fragmentShader = a.fragmentShader.replace(
                /\}(?=[^.]*$)/g,
                "\n    float level = _uDelta * 3.14159265/2.;\n    vec3 heat;\n    heat.r = sin(level);\n    heat.g = sin(level * 2.5);\n    heat.b = cos(level * 2.0);\n\t\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, heat, " +
                    h.overlayStrength.toFixed(1) +
                    " );\n\t}\n"
            );*/

            a.fragmentShader = /* glsl */`
                uniform float _uDelta;
                uniform float overlayStrength;
                void main() {
                    float level = _uDelta * 3.14159265/2.;
                    vec3 heat = vec3( sin(level), sin(level * 2.5), cos(level * 2.0) );
                    //gl_FragColor = vec4( 1.0, 1.0, 1.0, 0.5 );
                    gl_FragColor.rgb = mix( gl_FragColor.rgb, heat, overlayStrength );
                    gl_FragColor.a = 1.0;
                }`;
        }

        function k( a, c, e, p ) {
            y.material = e;
            y.geometry = c;
            y.group = p;
            c = n.properties.get(e);
            if (126 < I) {
                p = c.currentProgram;
                if (!p) return;
                C = c.uniforms;
                f.useProgram(p.program);
                e = p.getUniforms().map;
            } else {
                c.program || ((p = a.material), (a.material = e), (b.children[0] = a), n.compile(b, u, a), (a.material = p));
                void 0 === c.shader ? ((e = c), (p = c.program)) : c.program ? ((e = c.shader), (p = c.program)) : ((e = c.shader), (p = e.program));
                if (!p) return;
                C = e.uniforms;
                if (!e.program) return;
                f.useProgram(p.program);
                e = e.program.getUniforms().map;
            }
            y.set(e._uDelta, a.userData.delta);
            y.set(e._uAge, a.userData.age);
            C = null;
        }

        c = void 0 === c ? document.body : c;
        if (!1 !== this.enabled) {
            var F = this.enableMaterials,
                n = this.renderer,
                h = this,
                f = n.getContext(),
                m = performance || Date,
                l = (this.timer = n.capabilities.isWebGL2 ? f.getExtension("EXT_disjoint_timer_query_webgl2") : null),
                r = !!l;
            l || (this.skipFrames = -1);
            this.target = new THREE.WebGLRenderTarget( this.resolution.x, this.resolution.y, { format: THREE.RGBAFormat });
            var D = new THREE.MeshBasicMaterial({ color: 16777215 });
            D.onBeforeCompile = d;
            var G = (function () {
                    var a = {},
                        c = new WeakMap();
                    return {
                        map: c,
                        push: function (b, f, g) {
                            var e = c.get(b);
                            e && e.userData.material !== g && e.userData.geometry !== f && (e = null);
                            e ||
                                ((e = f.uuid + "_" + g.uuid),
                                void 0 === a[e] ? ((b = g.clone()), g.uniforms && (b.uniforms = g.uniforms), (b.onBeforeCompile = d), (b.userData.material = g), (b.userData.geometry = f), (a[e] = b)) : c.set(b, a[e]));
                        },
                    };
                })(),
                C,
                I = parseInt(THREE.REVISION),
                y = {
                    material: null,
                    geometry: null,
                    group: null,
                    set: function (a, c) {
                        a && (a.setValue(f, c, n.textures), (C[a.id].value = c));
                    },
                },
                v,
                w = 0,
                z = 0;
            if (this.enableGLHooks) {
                var E = f.drawElements, H = f.drawElementsInstanced;
                f.drawElements = function (a, c, b, d) {
                    if (w && v && 0 === h.recordMode) {
                        if (l) {
                            var e = f.createQuery();
                            e && (h.wait && h.pending++, (v.userData.query = e), f.beginQuery(l.TIME_ELAPSED_EXT, e), E.call(this, a, c, b, d), f.endQuery(l.TIME_ELAPSED_EXT));
                        } else
                            f.finish(),
                                f.readPixels(0, 0, 1, 1, f.RGBA, f.UNSIGNED_BYTE, A),
                                (z = m.now()),
                                E.call(this, a, c, b, d),
                                f.finish(),
                                f.readPixels(0, 0, 1, 1, f.RGBA, f.UNSIGNED_BYTE, A),
                                (v.userData.deltaTime = (m.now() - z) / 1e6),
                                (h.needsUpdate = !0);
                        w = 0;
                    } else E.call(this, a, c, b, d);
                };
                f.drawElementsInstanced = function (a, c, b, d, g) {
                    if (w && v && 0 === h.recordMode) {
                        if (r) {
                            var e = f.createQuery();
                            e && (h.wait && h.pending++, (v.userData.query = e), f.beginQuery(l.TIME_ELAPSED_EXT, e), H.call(this, a, c, b, d, g), f.endQuery(l.TIME_ELAPSED_EXT));
                        } else f.finish(), f.readPixels(0, 0, 1, 1, f.RGBA, f.UNSIGNED_BYTE, A), (z = m.now());
                        w = 0;
                    } else H.call(this, a, c, b, d, g);
                };
            }
            var A = new Uint8Array(4);
            n.renderBufferDirect2 = n.renderBufferDirect;
            n.renderBufferDirect = function (a, c, b, d, g, t) {
                if (1 === h.stage) {
                    q.push(g);
                    var e = g.userData;
                    v = g;
                    if (e.query) {
                        var x = f.getQueryParameter(e.query, f.QUERY_RESULT_AVAILABLE),
                            p = f.getParameter(l.GPU_DISJOINT_EXT);
                        x && !p && (e.deltaTime = f.getQueryParameter(e.query, f.QUERY_RESULT));
                        if (x || p) f.deleteQuery(e.query), (e.query = null), (h.needsUpdate = !0), h.wait && h.pending--;
                        n.renderBufferDirect2(a, c, b, d, g, t);
                    } else if (e.recordCount === h.recordCount) n.renderBufferDirect2(a, c, b, d, g, t);
                    else {
                        void 0 === e.delta && (e.delta = 0);
                        e.deltaTime = 0;
                        e.measured = !1;
                        e.query = null;
                        e.recordCount = h.recordCount;
                        if (1 === h.recordMode)
                            if (r) {
                                if ((x = f.createQuery())) h.wait && h.pending++, (w = 0), f.beginQuery(l.TIME_ELAPSED_EXT, x), n.renderBufferDirect2(a, c, b, d, g, t), f.endQuery(l.TIME_ELAPSED_EXT), (e.query = x);
                            } else
                                f.finish(),
                                    f.readPixels(0, 0, 1, 1, f.RGBA, f.UNSIGNED_BYTE, A),
                                    (z = m.now()),
                                    n.renderBufferDirect2(a, c, b, d, g, t),
                                    f.finish(),
                                    f.readPixels(0, 0, 1, 1, f.RGBA, f.UNSIGNED_BYTE, A),
                                    (v.userData.deltaTime = (m.now() - z) / 1e6),
                                    (h.needsUpdate = !0);
                        else (w = 1), n.renderBufferDirect2(a, c, b, d, g, t), (w = 0);
                        F && G.push(g, b, d);
                    }
                } else if (2 === h.stage)
                    if ((h.maxDelta && void 0 !== g.userData.delta && ((d = Math.min(g.userData.deltaTime / h.maxDelta, 1) - g.userData.delta), (g.userData.delta += (d + Math.max(-d * h.bias, 0)) * h.fade)), F)) {
                        if ((d = G.map.get(g))) k(g, b, d, t), n.renderBufferDirect2(a, c, b, d, g, t);
                    } else k(g, b, D, t), n.renderBufferDirect2(a, c, b, D, g, t);
                else n.renderBufferDirect2(a, c, b, d, g, t);
            };

            this.container = document.createElement("div");
            this.container.style.cssText = 'position:absolute; bottom:40px; left:10px; pointer-events:none;'

            this.domElement = document.createElement( 'canvas' )
            this.domElement.style.cssText = 'border:1px solid #000; margin:0; padding:0; box-sizing:border-box;'
            this.ctx = this.domElement.getContext("2d");

            this.container.appendChild(this.domElement);

            this.txt = document.createElement( 'div' )
            this.txt.style.cssText = 'position:absolute; top:3px; left:0; width:100%; text-align:center; font-size:14px; font-family:monospace;  color:#FF0000;'
            this.container.appendChild(this.txt);

            c.appendChild( this.container );

            this.mounted = !0;
        }
    }

    resize (x,y){

        this.domElement.width = x
        this.domElement.height = y
        //this.container.style.height = y+'px'
        return true

    }

    begin () {
        this.mounted &&
            ((q.index = 0),
            (this.stage = 1),
            !(this.wait && 0 < this.pending) && ((this.renderFrame = this.renderer.info.render.frame), -1 < this.skipFrames && this.frameIndex++, this.needsRecord || (this.frameIndex > this.skipFrames && -1 < this.skipFrames))) &&
            (this.renderer.getSize(this.size),
            0 < this.size.x && 0 < this.size.y && ((this.needsRecord = !1), (this.frameIndex = 0), this.recordCount++, this.size.set(this.size.x * this.scale, this.size.y * this.scale).floor(), this.size.x !== this.resolution.x || this.size.y !== this.resolution.y)) &&
            (this.resolution.copy(this.size), this.target.setSize(this.size.x, this.size.y), ( this.resize(this.size.x, this.size.y) ));
            //(this.resolution.copy(c), this.target.setSize(c.x, c.y), (this.domElement.width = c.x), (this.domElement.height = c.y));

    }

    end () {

        if (!1 !== this.enabled && this.needsUpdate) {
            var a = this.renderer,
                c = a.getRenderTarget();
            this.calls = q.index;
            this.stage = 2;
            a.setRenderTarget( this.target );
            a.clear();
            a.render(this.scene, this.camera);
            if (q.index) {
                for (var b = 0, d = 0, k = q.index, h = q.list; d < k; d++) b = Math.max(b, h[d].userData.deltaTime || 0);
                b -= this.maxDelta;
                this.maxDelta += 0.05 * (b + Math.max(-b * this.bias, 0));
            }
            a.setRenderTarget(c);
            this.stage = 0;
        }
    }

    update () {

        if (!1 !== this.enabled && (this.updatePreview || this.autoUpdatePreview)) {
            this.updatePreview = !1;
            var a = this.renderer,
                b = this.resolution,
                d = this.ctx;
            this.updateFrameIndex++;
            60 < this.updateFrameIndex && ((this.maxDeltaLabel = "max:" + (this.maxDelta / 1e6).toFixed(4) + 'ms'), (this.updateFrameIndex = 0));
            let q = a.getRenderTarget();
            a.getViewport(this.tmpV);
            //a.getScissor(this.tmpC);
            a.getSize(this.size);

            //this.tmpV.set(0,0,this.size.x, this.size.y)
            //this.tmpC.set(0,0,this.size.x, this.size.y)
            /*m.x = m.x || 0;
            m.y = m.y || 0;
            m.z = m.z || this.size.x;
            m.w = m.w || this.size.y;
            l.x = l.x || 0;
            l.y = l.y || 0;
            l.z = l.z || this.size.x;
            l.w = l.w || this.size.y;*/
            a.setRenderTarget(null);
            a.clear();
            a.setViewport(0, 0, b.x, b.y);
            //a.setScissor(0, 0, b.x, b.y);
            //r.material.map = this.target.texture;
            //a.render(k, u);

            this.mesh.material.map = this.target.texture;
            a.render( this.sceneK, this.cam );

            d.clearRect(0, 0, b.x, b.y);
            d.drawImage(a.domElement, 0, this.size.y - b.y, b.x, b.y, 0, 0, b.x, b.y);
            a.setViewport(this.tmpV);
            //a.setScissor(this.tmpC);
            a.setRenderTarget(q);
            this.txt.innerHTML = 'draw:' + this.calls + ' | ' + this.maxDeltaLabel

        }
    }
}

export default DrawCallInspector;