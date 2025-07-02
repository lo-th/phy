import {
    ShaderMaterial,
    Vector4, Vector3, Color,
    Mesh,
    PlaneGeometry,
    MeshBasicMaterial,
    MathUtils,
    MultiplyBlending, AdditiveBlending, SubtractiveBlending 
} from 'three';

import { NodeMaterial, MeshBasicNodeMaterial } from 'three/webgpu';
import { screenUV, color, uniform, varying, vec2, vec3, uv, dot, smoothstep, sub, float, vec4, sin, fract, add, If, Fn } from 'three/tsl';

export class VignetteGpu extends Mesh {

    constructor( o = {} ) {

        const geometry = new PlaneGeometry( 2, 2, 1, 1 );
        const material = new MeshBasicNodeMaterial();
        //const material = new NodeMaterial();

        super(geometry, material);

        this._color = uniform( color( '#010101' ) );
        this._offset = uniform( 1 );
        this._darkness = uniform( 1.05 );
        this._grain = uniform( 0.1 ); 

        //screenUV//

        const uv0 = uv();
        const self = this

        this.material.colorNode = /*#__PURE__*/ Fn( () => {

            const uv = vec2( uv0.sub( vec2( 0.5 ) ).mul( vec2( this._offset ) ) );
            const alpha = float( smoothstep( 0.0, 1.0, dot( uv, uv ) ).sub( sub( 1.0, this._darkness ) ) );
            //return vec4( this._color, alpha ) ;
            return vec4( this._color.rgb, 1.0 ) ;

           /* If( grain.notEqual( 0.0 ), () => {

                const noise = float( fract( sin( dot( uv, vec2( 12.9898, 78.233 ).mul( 2.0 ) ) ).mul( 43758.5453 ) ) );
                return vec4( 0.0, 0.0, 0.0, noise.mul( this._grain ) ).mul( add( 0.5, alpha ) );

            } );*/

        } )();

        this.material.transparent = true
        this.material.depthWrite = false
        this.material.depthTest = false
       // this.material.dithering = true

        /*this.geometry = new PlaneGeometry( 2,2, 1,1 );
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

        });*/


        Object.defineProperties(this, {

            color: {
                enumerable: true,
                get: () => ( this._color.value.getHex() ),
                set: ( v ) => { this._color.value.setHex( v ) },
            },
            offset: {
                enumerable: true,
                get: () => ( this._offset.value ),
                set: ( v ) => { this._offset.value = v },
            },
            darkness: {
                enumerable: true,
                get: () => ( this._darkness.value ),
                set: ( v ) => { this._darkness.value = v },
            },
            grain: {
                enumerable: true,
                get: () => ( this._grain.value ),
                set: ( v ) => { this._grain.value = v },
            },
        })

        this.frustumCulled = false;
        this.renderOrder = 10000;
        //this.matrixAutoUpdate = false;

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