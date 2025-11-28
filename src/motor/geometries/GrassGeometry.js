import {
    BufferGeometry, Vector3, PlaneGeometry,
} from 'three';

import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MathTool } from '../../core/MathTool.js';

export class GrassGeometry extends BufferGeometry {

    constructor( lod = 3 ){

        super();

        const rand = MathTool.rand
        const rad = MathTool.torad

        let g = new PlaneGeometry()
        g.translate( 0, 0.5, 0 );

        const pp = []

        let p, s 
        let r = 360/lod

        for(let i = 0; i<lod; i++){
            p = g.clone()
            p.translate( rand(-0.2,0.2), 0, rand(-0.2,0.2) );
            p.rotateX( rand(-22,22)*rad )
            p.rotateY( ((r*i) + rand(-10,10))*rad )
            s = rand(0.8, 1.2)
            p.scale(s,s,s)
            pp.push(p)
        }


        let gg = mergeVertices( mergeGeometries( pp ) );
        //console.log(gg)
        this.copy(gg);

    }

}