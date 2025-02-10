import {
    ShaderMaterial,
    Vector4, Vector3, Color,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial,
    MathUtils,
    MultiplyBlending, AdditiveBlending, SubtractiveBlending 
} from 'three';

export class Hub3D extends Mesh {

    constructor( o = {} ) {

        super()

        this.color = new Color()

        this.geometry = new PlaneGeometry( 2,2, 1,1 );
        /*this.material = new MeshBasicMaterial({
            wireframe:true
        })*/
        this.material = new ShaderMaterial( {

            name: 'HuvShader',

            uniforms: {

                color: { value: new Color( 0.01, 0.01, 0.01 ) },
                darkness: { value: 1 },
                offset: { value: 1.05  },

                grain: { value: 0.1  },

                ratio: { value: 1 },
                radius: { value: 2 },
                step: { value: new Vector4(0.6, 0.7, 1.25, 1.5 ) },
                
            },

            vertexShader:`
            varying vec2 vUv;
            varying vec3 pos;

            void main() {
                vUv = uv;
                //gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

                pos = position;
                gl_Position = vec4(position, 1.);
            }
            `,
            fragmentShader:`

            #include <common>
            #include <dithering_pars_fragment>

            uniform vec3 color;
            uniform float offset;
            uniform float grain;
            uniform float darkness;

            uniform float ratio;
            uniform float radius;
            uniform vec4 step;
            varying vec2 vUv;
            varying vec3 pos;


            void main() {
                
                /*vec2 c = vec2(0.5, 0.5);
                vec2 pos = (vUv - 0.5) * vec2(ratio, 1) + 0.5;
      
                float dist = length( pos - c ) * radius;

                vec4 cOne = vec4(0.0, 0.0, 0.0, 0.0);
                vec4 cTwo = vec4(0.0, 0.0, 0.0, 0.0);
                vec4 cTree = vec4(0.0, 0.0, 0.0, 0.25);
                vec4 cFour = vec4(0.0, 0.0, 0.0, 0.95);

                vec4 cc = mix( cOne, cTwo, smoothstep( step.x, step.y, dist ));
                cc = mix( cc, cTree, smoothstep(step.y, step.z, dist ));
                cc = mix( cc, cFour, smoothstep(step.z, step.w, dist ));

                gl_FragColor = cc;
                */

                //vec4 texel = vec4(0.0);
                vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );
                //gl_FragColor = vec4( mix( texel.rgb, vec3( 1.0 - darkness ), dot( uv, uv ) ), texel.a );

                float alpha = smoothstep( 0.0, 1.0, dot( uv, uv ) )-(1.0 - darkness);

                
                

                //gl_FragColor = vec4( color, dot( uv, uv )-(1.0 - darkness) );
                gl_FragColor = vec4( color, alpha );

                // film grain noise
                if(grain!=0.0){
                    float noise = (fract(sin(dot(uv, vec2(12.9898,78.233)*2.0)) * 43758.5453));
                    gl_FragColor += vec4(0.0,0.0,0.0, noise * grain )*(0.5+alpha);
                }

                #include <dithering_fragment>
                
            }
            `, 
            transparent:true,
            depthWrite:false,
            depthTest:false,
            dithering:true,
            //toneMapped: false,
            //blending:MultiplyBlending,

        });


        Object.defineProperties(this, {

            color: {
                enumerable: true,
                get: () => ( this.material.uniforms.color.value.getHex() ),
                set: ( v ) => { this.material.uniforms.color.value.setHex( v ) },
            },
            offset: {
                enumerable: true,
                get: () => ( this.material.uniforms.offset.value ),
                set: ( v ) => { this.material.uniforms.offset.value = v },
            },
            darkness: {
                enumerable: true,
                get: () => ( this.material.uniforms.darkness.value ),
                set: ( v ) => { this.material.uniforms.darkness.value = v },
            },
            grain: {
                enumerable: true,
                get: () => ( this.material.uniforms.grain.value ),
                set: ( v ) => { this.material.uniforms.grain.value = v },
            },
        })

        this.frustumCulled = false;
        this.renderOrder = Infinity;
        this.matrixAutoUpdate = false;

    }

    /*updateMatrixWorld ( force ) {

        if( this.parent.isCamera ){
            const c = this.parent
            let r = (1 / ( 2 * Math.tan( (c.fov * MathUtils.DEG2RAD) * 0.5 ) ));
            this.scale.set( c.aspect, 1, 0 );
            this.position.z = -r*c.zoom;

            //this.material.uniforms.ratio.value = c.aspect
        }

        super.updateMatrixWorld(force);

    }*/

    raycast() {

        return

    }

    dispose () {

        this.parent.remove(this);
        this.geometry.dispose()
        this.material.dispose()
        
    }

    /*static setRenderMode ( v ){

        panelMat.uniforms.renderMode.value = v
        
    }

    static hide( b ){

        panel.visible = b

    }

    static update ( Size, type ) {

        if( Size ) size = Size;
        let s = size;

        type = type || '';

        //let s = root.view.getSizer();
        let fov = this.parent.fov;
        let z = this.parent.zoom;
        let d = 0, r = 1;


        if( s.w !== old.w || s.h !== old.h || fov !== old.f || z !== old.z ){ 

            this.resizeOld( s, fov, z );

            if(!isPanel3D) return

            if( isSnipper && type === 'fps' ){

                r = (z-1.2)/12.8;

                this.material.uniforms.ratio.value = math.lerp( 1, old.ratio, r ); 
                this.material.uniforms.radius.value = math.lerp( 2, 3, r );

            } else {
                d = type === 'tps' ? z - 0.6 : z-1.2;
                d*=0.25;
                this.material.uniforms.step.value.x = 0.6 - d;
                this.material.uniforms.step.value.y = 0.7 - d;
                this.material.uniforms.step.value.z = 1.25 - d*0.5;
            }

            
            //panelMat.uniforms.step.value.w = 1.5 - d 

        }

    }

    static resizeOld ( s, fov, z ){

        content.style.left = (s.left + 10) + "px"

        if(!isPanel3D) return

        //var d = 0.0001
        let d = 0.001
        let v = fov * math.torad; // convert to radians
        let r = (s.h / ( 2 * Math.tan( v * 0.5 ) ));
        let e = 1//3/5; // ???

        this.scale.set( s.w, s.h, 0 ).multiplyScalar(d);
        //panel.scale.set( 50, 50, 0 ).multiplyScalar(0.0001);
        //panel.scale.z = 1;
        this.position.z = -r*d*z;

        old.f = fov;
        old.z = z;
        old.w = s.w;
        old.h = s.h;
        old.ratio = s.w / s.h;

    }*/




}