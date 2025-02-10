import {
    ShaderMaterial,
    Vector4, Vector3, Color,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial,
    MathUtils,
    MultiplyBlending, AdditiveBlending, SubtractiveBlending 
} from 'three';

export class Vignette extends Mesh {

    constructor( o = {} ) {

        super();

        this.geometry = new PlaneGeometry( 2,2, 1,1 );
        this.material = new ShaderMaterial( {

            name: 'VignetteShader',

            uniforms: {

                color: { value: new Color( 0.01, 0.01, 0.01 ) },
                darkness: { value: 1 },
                offset: { value: 1.05  },
                grain: { value: 0.1  }
                
            },

            vertexShader:`
            

            varying vec2 vUv;
            varying vec3 pos;

            void main() {
                vUv = uv;
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

            varying vec2 vUv;
            varying vec3 pos;

            void main() {
                
                vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );
                float alpha = smoothstep( 0.0, 1.0, dot( uv, uv ) )-(1.0 - darkness);
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
            //toneMapped:false,

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

    raycast() {

        return

    }

    dispose () {

        this.parent.remove(this);
        this.geometry.dispose()
        this.material.dispose()
        
    }

}