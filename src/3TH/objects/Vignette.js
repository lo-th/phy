import {
    ShaderMaterial,
    RawShaderMaterial,
    Vector4, Vector3, Color,
    Mesh,
    PlaneGeometry,
    SRGBColorSpace,
    LinearSRGBColorSpace
} from 'three';

export class Vignette extends Mesh {

    constructor( o = {} ) {

        const geometry = new PlaneGeometry( 2,2, 1,1 );

        super(geometry);

        this.material = new ShaderMaterial( {

            name: 'VignetteShader',

            uniforms: {

                color: { value: new Color( 0x010101 ) },
                darkness: { value: 1 },
                offset: { value: 1.05  },
                grain: { value: 0.1  }
                
            },

            vertexShader:`
            varying vec2 vUv;

            void main() {
                vUv = uv;
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

            void main() {
                
                vec2 uv = ( vUv - vec2( 0.5 ) ) * vec2( offset );
                float alpha = smoothstep( 0.0, 1.0, dot( uv, uv ) )-(1.0 - darkness);
                vec4 ret = vec4( color, alpha ); 

                // film grain noise
                if(grain!=0.0){
                    float noise = (fract(sin(dot(uv, vec2(12.9898,78.233)*2.0)) * 43758.5453));
                    float alphaAdd = (noise*grain)*(0.5+alpha);
                    alphaAdd = clamp(alphaAdd, 0.0, 1.0);
                    ret += vec4( 0.0,0.0,0.0, alphaAdd );
                }

                
                gl_FragColor = ret;

                #include <tonemapping_fragment>
                #include <colorspace_fragment>
                #include <dithering_fragment>
                
            }
            `, 
            transparent:true,
            depthWrite:false,
            depthTest:false,
            dithering:true,
            toneMapped:true,

        });

        this.material.defines = {
            'TONE_MAPPING' : '',
            'DITHERING':''
        }


        Object.defineProperties(this, {

            color: {
                enumerable: true,
                //get: ( v ) => { console.log(this.material.uniforms.color); return this.material.uniforms.color.value.getHex(); },
                get: () => ( this.material.uniforms.color.value.getHex() ),
                set: ( v ) => {  this.material.uniforms.color.value.setHex( v ) },
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
        this.renderOrder = 10000;
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