import {
    Matrix4,
    SphereGeometry,
    BufferGeometry,
    Vector3,
    Float32BufferAttribute,
    PlaneGeometry,
    CylinderGeometry,
    CircleGeometry,
    BoxGeometry,
    Box3,
    Vector2,
} from 'three';
import { mergeVertices, mergeGeometries } from '../jsm/utils/BufferGeometryUtils.js';
import { Tubular } from './geometries/Tubular.js';


export const Tube = Tubular;

/** __
*    _)_|_|_
*   __) |_| | 2022
* @author lo.th / https://github.com/lo-th
*/

export function geometryInfo( g, type, Size ) {

   /* var i, j, n, p, n2;

    var size = Size || [1,1,1];


    var tmpGeo = g.isBufferGeometry ? new THREE.Geometry().fromBufferGeometry( g ) : g;
    tmpGeo.mergeVertices();


    var numVertices = tmpGeo.vertices.length;
    var numFaces = tmpGeo.faces.length;

    g.realVertices = new Float32Array( numVertices * 3 );
    g.realIndices = new ( numFaces * 3 > 65535 ? Uint32Array : Uint16Array )( numFaces * 3 );


    i = numVertices;
    while ( i -- ) {

        p = tmpGeo.vertices[ i ];
        n = i * 3;
        g.realVertices[ n ] = p.x * size[0];
        g.realVertices[ n + 1 ] = p.y * size[1];
        g.realVertices[ n + 2 ] = p.z * size[2];

    }

    if ( type === 'convex' ) {

        tmpGeo.dispose();
        return g.realVertices;

    }

    i = numFaces;
    while ( i -- ) {

        p = tmpGeo.faces[ i ];
        n = i * 3;
        g.realIndices[ n ] = p.a;
        g.realIndices[ n + 1 ] = p.b;
        g.realIndices[ n + 2 ] = p.c;

    }

    // with faces for trimesh
    tmpGeo.dispose();
    return {v:g.realVertices, f:g.realIndices };*/

}


export class Stair extends BufferGeometry {

    constructor( size, d=0.3 ) {

        super();

        this.type = 'Stair';
        this.name = 'Stair_' + size[0] +'_'+size[1]+'_'+size[2];

        //let g = new BoxGeometry( size[0],size[1],size[2], 2, 1, 1 )

        let g = new PlaneGeometry( size[0], size[2], 1, 1 )
        g.rotateX( -Math.PI * 0.5 )

        let ar = g.attributes.position.array, n;

        let dz = size[2]*d
        let dy = size[1]*d
       

        /*for ( let i = 0, l = g.attributes.position.count; i < l; i ++ ) {

            n = i*3;

            if(ar[n+1] === size[1]*0.5 && ar[n+2] === size[2]*0.5) ar[n+1]=(-size[1]*0.5) //+ (size[1]*0.01)
            else if( ar[n+1] === -size[1]*0.5 ) {
                //if( ar[n+2] === size[2]*0.5 ) ar[n+1]-=(size[1]*d)
                if( ar[n+2] === size[2]*0.5 ) ar[n+2]-=dz
                else ar[n+1] = (size[1]*0.5) - dy
            }
           

              

        }*/

        for ( let i = 0, l = g.attributes.position.count; i < l; i ++ ) {

            n = i*3;

            if(ar[n+2] === size[2]*0.5) ar[n+1]=(-size[1]*0.5) //+ (size[1]*0.01)
            else ar[n+1]=(size[1]*0.5) //+ (size[1]*0.01)
          
           


        }


        //let g2 = mergeVertices( g );



        //console.log(g.attributes.position.count, g2.attributes.position.count)



        //radius = radius || 1;

        // segments

        /*widthSegs = Math.floor( widthSegs );
        heightSegs = Math.floor( heightSegs );
        depthSegs = Math.floor( depthSegs );;
        
        let g = new BoxGeometry( 1,1,1, widthSegs, heightSegs, depthSegs ), v = new Vector3(), r = new Vector3(), n;

        let ar = g.attributes.position.array;
        let nm = g.attributes.normal.array;

        for ( let i = 0, l = g.attributes.position.count; i < l; i ++ ) {

            n = i*3;
            v.set( ar[n], ar[n+1], ar[n+2] )
            r.copy( v ).normalize()

            v.lerp( r, roundness ).multiplyScalar( radius )

            ar[n] = v.x
            ar[n+1] = v.y
            ar[n+2] = v.z

            v.normalize()

            nm[n] = v.x
            nm[n+1] = v.y
            nm[n+2] = v.z
            
        }*/

        this.copy(g)

    }
}
/**
* SPHERE BOX GEOMETRY
*/
export class SphereBox extends BufferGeometry {

    constructor( radius=1, widthSegs=10, heightSegs=10, depthSegs=10, roundness=1 ) {

        super();

        this.type = 'SphereBox';
        this.name = 'SphereBox_' + radius +'_'+widthSegs+'_'+heightSegs+'_'+depthSegs+'_'+roundness;

        radius = radius || 1;

        // segments

        widthSegs = Math.floor( widthSegs );
        heightSegs = Math.floor( heightSegs );
        depthSegs = Math.floor( depthSegs );;
        
        let g = new BoxGeometry( 1,1,1, widthSegs, heightSegs, depthSegs ), v = new Vector3(), r = new Vector3(), n;

        let ar = g.attributes.position.array;
        let nm = g.attributes.normal.array;

        for ( let i = 0, l = g.attributes.position.count; i < l; i ++ ) {

            n = i*3;
            v.set( ar[n], ar[n+1], ar[n+2] )
            r.copy( v ).normalize()

            v.lerp( r, roundness ).multiplyScalar( radius )

            ar[n] = v.x
            ar[n+1] = v.y
            ar[n+2] = v.z

            v.normalize()

            nm[n] = v.x
            nm[n+1] = v.y
            nm[n+2] = v.z
            
        }

        this.copy(g)

    }
}

/**
* CAPSULE GEOMETRY
*/
export class Capsule extends BufferGeometry {

    constructor( radius = 1, height = 1, radialSegs = 12, heightSegs = 1 ) {

        super();

    	this.type = 'CapsuleGeometry';
        //this.name = 'Capsule_' + radius +'_'+height+'_'+radialSegs+'_'+heightSegs;

        let pi = Math.PI;

        let th = (radius*2) + height
        let sy = radius / th
        let hy = 1 - (2*sy)

        radialSegs = Math.floor( radialSegs );
        heightSegs = Math.floor( heightSegs );

        let sHeight = Math.floor( radialSegs * 0.5 );
        let o0 = Math.PI * 2;
        let o1 = Math.PI * 0.5;
        let m0 = new CylinderGeometry( radius, radius, height, radialSegs, heightSegs, true );
        //let m0 = new CylinderGeometryFix2( radius, radius, height, radialSegs, heightSegs, true );
        //let m0 = new CylinderGeometry( radius, radius, height, radialSegs, heightSegs, true );
        scaleUV( m0, 0, sy, 1, hy )
        let m1 = new SphereGeometry( radius, radialSegs, sHeight, 0, o0, 0, o1);
        scaleUV( m1, 0, 1-sy, 1, sy )
        let m2 = new SphereGeometry( radius, radialSegs, sHeight, 0, o0, o1, o1);
        scaleUV( m2, 0, 0, 1, sy )
        let mtx0 = new Matrix4().makeRotationY( -pi*0.5 )
        let mtx1 = new Matrix4().makeTranslation(0, height*0.5,0);
        let mtx2 = new Matrix4().makeTranslation(0, -height*0.5,0);
        m0.applyMatrix4( mtx0 )
        m1.applyMatrix4( mtx1 )
        m2.applyMatrix4( mtx2 )


        let g = mergeVertices( mergeGeometries( [ m0, m1, m2] ) );
        this.copy( g );

        /*m0.dispose()
        m1.dispose()
        m2.dispose()
        g.dispose()*/

    }
}


/**
* TORUS EXTRA GEOMETRY
*/
export class TorusGeometryFix extends BufferGeometry {

    constructor( radius = 1, tube = 0.4, radialSegments = 8, tubularSegments = 6, arc= Math.PI * 2, thetaStart=0, thetaLength=Math.PI ) {

        super();

        this.type = 'TorusGeometryFix';

        this.parameters = {
            radius: radius,
            tube: tube,
            radialSegments: radialSegments,
            tubularSegments: tubularSegments,
            arc: arc
        };

        radialSegments = Math.floor( radialSegments );
        tubularSegments = Math.floor( tubularSegments );

        // buffers

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // helper variables

        const center = new Vector3();
        const vertex = new Vector3();
        const normal = new Vector3();

        let j, i;

        // generate vertices, normals and uvs

        for ( j = 0; j <= radialSegments; j ++ ) {

            for ( i = 0; i <= tubularSegments; i ++ ) {

                const u = i / tubularSegments * arc;
                //const v = j / radialSegments * Math.PI * 2;

                const v = (j / radialSegments) * thetaLength + thetaStart;

                // vertex

                vertex.x = ( radius + tube * Math.cos( v ) ) * Math.cos( u );
                vertex.y = ( radius + tube * Math.cos( v ) ) * Math.sin( u );
                vertex.z = tube * Math.sin( v );

                vertices.push( vertex.x, vertex.y, vertex.z );

                // normal

                center.x = radius * Math.cos( u );
                center.y = radius * Math.sin( u );
                normal.subVectors( vertex, center ).normalize();

                normals.push( normal.x, normal.y, normal.z );

                // uv

                uvs.push( i / tubularSegments );
                uvs.push( j / radialSegments );

            }

        }

        // generate indices

        for ( j = 1; j <= radialSegments; j ++ ) {

            for ( i = 1; i <= tubularSegments; i ++ ) {

                // indices

                const a = ( tubularSegments + 1 ) * j + i - 1;
                const b = ( tubularSegments + 1 ) * ( j - 1 ) + i - 1;
                const c = ( tubularSegments + 1 ) * ( j - 1 ) + i;
                const d = ( tubularSegments + 1 ) * j + i;

                // faces

                indices.push( a, b, d );
                indices.push( b, c, d );

            }

        }

        // build geometry

        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

    }
}


/**
* CHAMFER CYLINDRE GEOMETRY
*/
export class ChamferCyl extends BufferGeometry {

    constructor( radiusTop = 1, radiusBottom = 1, height = 1, filet =0.01, radialSegs = 12, heightSegs = 1, filetSegs = 2 ) {

        super();

        this.type = 'ChamferCyl';
        //this.name = 'ChamferCyl_' + radiusTop +'_'+radiusBottom+'_'+height+'_'+filet+'_'+radialSegs+'_'+heightSegs+'_'+filetSegs;

        radialSegs = Math.floor( radialSegs );
        heightSegs = Math.floor( heightSegs );
        filetSegs = Math.floor( filetSegs );

        let mr = new Matrix4();
        let mt = new Matrix4();

        let pi = Math.PI;
        let p90 = pi * 0.5;
        let twoPi = pi * 2;

        let start = 0//(twoPi / radialSegs)*(3/radialSegs)//;

        let th = height
        let sy = filet / th
        let hy = 1 - (2*sy)
        //console.log(start)

        //let mid = new CylinderGeometryFix( radiusBottom, radiusTop, height-(filet*2), radialSegs, heightSegs, true, start );
        let mid = new CylinderGeometry( radiusTop, radiusBottom, height-(filet*2), radialSegs, heightSegs, true, start );
        mr.makeRotationY( p90 );
        mid.applyMatrix4( mr );

        scaleUV( mid, 0, sy, 1, hy )

        // top
        let c1 = new TorusGeometryFix( radiusTop-filet, filet, filetSegs, radialSegs, twoPi, 0, p90 );
        let c2 = new CircleGeometry( radiusTop-filet, radialSegs );

        mt.makeTranslation( 0,0, filet );
        c2.applyMatrix4( mt );

        scaleUV( c1, 0, 1-sy, 1, sy )

        let top = mergeGeometries( [ c1, c2 ] );

        mr.makeTranslation( 0,0,( (height*0.5) - filet) );
        mt.makeRotationX( -p90 );

        top.applyMatrix4( mt.multiply(mr) );

        /*c1.dispose();
        c2.dispose();*/

        // bottom
        c1 = new TorusGeometryFix( radiusBottom-filet, filet, filetSegs, radialSegs, twoPi, 0, p90 );
        c2 = new CircleGeometry( radiusBottom-filet, radialSegs );

        mt.makeTranslation( 0,0, filet );
        c2.applyMatrix4( mt );

        scaleUV( c1, 0, 1-sy, 1, sy, true )

        let low = mergeGeometries( [ c1, c2 ] );

        mr.makeTranslation( 0,0,( (height*0.5) - filet) );
        mt.makeRotationX( p90 );
        low.applyMatrix4( mt.multiply(mr) );

        /*c1.dispose();
        c2.dispose();*/

        let g = mergeVertices( mergeGeometries( [ top, mid, low ] ) );

        /*mid.dispose();
        top.dispose();
        low.dispose();*/

        this.copy(g);
        //g.dispose();

    }
}

//ChamferCyl.prototype = Object.create( THREE.BufferGeometry.prototype );

/**
* CHAMFER BOX GEOMETRY
*/
export class ChamferBox extends BufferGeometry {

    constructor( width  = 1, height = 1, depth = 1, filet = 0.01, widthSegs = 1, heightSegs = 1, depthSegs = 1, filetSegs = 2 ) {

        super();

        this.type = 'ChamferBox';
        //this.name = 'ChamferBox_' + width +'_'+height+'_'+depth+'_'+filet+'_'+widthSegs+'_'+heightSegs+'_'+depthSegs+'_'+filetSegs;

        widthSegs = Math.floor( widthSegs );
        heightSegs = Math.floor( heightSegs );
        depthSegs = Math.floor( depthSegs );
        filetSegs = Math.floor( filetSegs );

        let pi = Math.PI;
        let p90 = pi * 0.5;
        let twoFilet = filet * 2;

        let midWidth = width * 0.5;
        let midHeight = height * 0.5;
        let midDepth = depth * 0.5;

        let mr = new Matrix4();
        let mt = new Matrix4();
        let mp = new Matrix4();

        // uv calc

        let tw = width
        let sw = filet / tw
        let vw = 1 - (2*sw)

        let th = height
        let sh = filet / th
        let vh = 1 - (2*sw)

        let td = depth
        let sd = filet / td
        let vd = 1 - (2*sd)

        let f = new PlaneGeometry( width-twoFilet, height-twoFilet, widthSegs, heightSegs );
        let c1 = new CylinderGeometry( filet, filet, width-twoFilet, filetSegs, widthSegs, true, 0, p90 );
        let c2 = new CylinderGeometry( filet, filet, height-twoFilet, filetSegs, heightSegs, true, 0, p90 );
        let s1 = new SphereGeometryFix( filet, filetSegs, filetSegs, 0, p90, 0, -p90 );
        let s2 = new SphereGeometryFix( filet, filetSegs, filetSegs, 0, p90, 0, -p90 );

        scaleUV( f, -sw, sh, vw, vh )
        scaleUV( c1, 0, sw, sh, vw )
       //scaleUV( c2, 0, -sw, vw, sw )

        mt.makeTranslation( 0, midHeight - filet, 0 );
        mr.makeRotationX( p90 )
        s1.applyMatrix4( mt.multiply(mr) );

        mt.makeTranslation( 0, -midHeight + filet, 0 );
        mr.makeRotationX( p90 );
        mp.makeRotationY( -p90 );
        s2.applyMatrix4( mt.multiply(mr).multiply(mp) );

        let tra = mergeGeometries( [ c2, s1, s2 ] );
        let trc = tra.clone();

        /*c2.dispose();
        s1.dispose();
        s2.dispose();*/
        
        mt.makeTranslation( midWidth - filet, 0, -filet );

        tra.applyMatrix4( mt );

        mt.makeTranslation( -midWidth + filet, 0, -filet );
        mr.makeRotationZ( pi );

        trc.applyMatrix4( mt.multiply(mr) );

        // cylinder

        let c3 = c1.clone();

        mr.makeRotationZ( p90 );
        mt.makeTranslation( 0, midHeight - filet, -filet );
        c1.applyMatrix4( mt.multiply(mr) );
        mt.makeTranslation( 0, -midHeight + filet, -filet );
        mr.makeRotationZ( -p90 );
        c3.applyMatrix4( mt.multiply(mr) );

        let rf = mergeGeometries( [ c1, c3, f, tra, trc ] );
        let rg = rf.clone();

        mt.makeTranslation( 0, 0, midDepth );
        rf.applyMatrix4( mt );

        mt.makeTranslation( 0, 0, -midDepth );
        mr.makeRotationY( pi );
        rg.applyMatrix4( mt.multiply(mr) );

        // side left

        /*f.dispose();
        c1.dispose();
        c3.dispose();*/

        f = new PlaneGeometry( depth-twoFilet, height-twoFilet, depthSegs, heightSegs );
        c1 = new CylinderGeometry( filet, filet, depth-twoFilet, filetSegs, depthSegs, true, 0, p90 );
        c3 = c1.clone();

        scaleUV( f, -sd, sh, vd, vh )

        mt.makeTranslation( 0, -(midHeight - filet), -filet, 0 );
        mr.makeRotationZ( -p90 );

        c1.applyMatrix4( mt.multiply(mr) );

        mt.makeTranslation( 0, midHeight - filet, -filet, 0 );
        mr.makeRotationZ( p90 );

        c3.applyMatrix4( mt.multiply(mr) );


        let rr = mergeGeometries( [ c1, c3, f ] );
        let rb = rr.clone();

        /*f.dispose();
        c1.dispose();
        c3.dispose()*/

        mt.makeTranslation( -midWidth, 0, 0 );
        mr.makeRotationY( -p90 );

        rr.applyMatrix4( mt.multiply(mr) );

        // side right

        mt.makeTranslation( midWidth, 0, 0 );
        mr.makeRotationY( p90 );

        rb.applyMatrix4( mt.multiply(mr) );

        // top
        f = new PlaneGeometry( width-twoFilet, depth-twoFilet, widthSegs, depthSegs );
        scaleUV( f, -sw, sd, vw, vd )
        let f2 = f.clone();



        mt.makeTranslation( 0, midHeight, 0);
        mr.makeRotationX( -p90 );
        f.applyMatrix4( mt.multiply(mr) );

        // bottom
        mt.makeTranslation( 0, -midHeight, 0);
        mr.makeRotationX( p90 );
        f2.applyMatrix4( mt.multiply(mr) );

        let g = mergeVertices( mergeGeometries( [ rf, rg, rr, rb, f, f2 ] ) );

        /*rf.dispose();
        rg.dispose();
        rr.dispose();
        rb.dispose();
        f2.dispose();
        f.dispose();*/
        //g.computeVertexNormals()
        //g = g.toNonIndexed()
        //

        createUV(g, 'box');

        this.copy(g);
        /*g.dispose();*/

    }
}

export class SphereGeometryFix extends BufferGeometry {

    constructor( radius = 1, widthSegments = 8, heightSegments = 6, phiStart = 0, phiLength = Math.PI * 2, thetaStart = 0, thetaLength = Math.PI ) {

        super();

        this.type = 'SphereGeometryFix';

        this.parameters = {
            radius: radius,
            widthSegments: widthSegments,
            heightSegments: heightSegments,
            phiStart: phiStart,
            phiLength: phiLength,
            thetaStart: thetaStart,
            thetaLength: thetaLength
        };

        widthSegments =  Math.floor( widthSegments );
        heightSegments =  Math.floor( heightSegments );

        const thetaEnd = Math.min( thetaStart + thetaLength, Math.PI );

        let index = 0;
        const grid = [];

        const vertex = new Vector3();
        const normal = new Vector3();

        // buffers

        const indices = [];
        const vertices = [];
        const normals = [];
        const uvs = [];

        // generate vertices, normals and uvs

        for ( let iy = 0; iy <= heightSegments; iy ++ ) {

            const verticesRow = [];

            const v = iy / heightSegments;

            // special case for the poles

            let uOffset = 0;

            if ( iy == 0 && thetaStart == 0 ) {

                uOffset = 0.5 / widthSegments;

            } else if ( iy == heightSegments && thetaEnd == Math.PI ) {

                uOffset = - 0.5 / widthSegments;

            }

            for ( let ix = 0; ix <= widthSegments; ix ++ ) {

                const u = ix / widthSegments;

                // vertex

                vertex.x = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
                vertex.y = radius * Math.cos( thetaStart + v * thetaLength );
                vertex.z = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

                vertices.push( vertex.x, vertex.y, vertex.z );

                // normal

                normal.copy( vertex ).normalize();
                normals.push( normal.x, normal.y, normal.z );

                // uv

                uvs.push( u + uOffset, 1 - v );

                verticesRow.push( index ++ );

            }

            grid.push( verticesRow );

        }

        // indices

        for ( let iy = 0; iy < heightSegments; iy ++ ) {

            for ( let ix = 0; ix < widthSegments; ix ++ ) {

                const a = grid[ iy ][ ix + 1 ];
                const b = grid[ iy ][ ix ];
                const c = grid[ iy + 1 ][ ix ];
                const d = grid[ iy + 1 ][ ix + 1 ];

                if ( iy !== 0 || thetaStart > 0 ) indices.push( a, b, d );
                if ( iy !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );

            }

        }

        // build geometry

        this.setIndex( indices );
        this.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );
        this.setAttribute( 'normal', new Float32BufferAttribute( normals, 3 ) );
        this.setAttribute( 'uv', new Float32BufferAttribute( uvs, 2 ) );

    }

}

// { SphereGeometryFix };


// UV 

export function scaleUV( geometry, x=0, y=0, dx=1, dy=1, reverse ) {

    let uv = geometry.attributes.uv
    let ar = uv.array
    let i = uv.count, n =0

    while( i-- ){
        n=i*2
        ar[n] = (ar[n]*dx)-x
        ar[n+1] = (ar[n+1]*dy)+y

        if(reverse){
            ar[n] = 1 - ar[n]
            ar[n+1] = 1 - ar[n+1]
        }
    }


}

export function createUV( geometry, type = 'sphere', boxSize, pos = [0,0,0], quat = [0,0,0,1], transformMatrix ) {

    //type = type || 'sphere';

    if ( transformMatrix === undefined ) transformMatrix = new Matrix4();
    transformMatrix.compose( {x:pos[0], y:pos[1], z:pos[2] }, { _x:quat[0], _y:quat[1], _z:quat[2], _w:quat[3] }, {x:1, y:1, z:1 })



    if ( boxSize === undefined ) {
        if( !geometry.boundingBox ) geometry.computeBoundingBox();
        let bbox = geometry.boundingBox;
        boxSize = Math.max( bbox.max.x - bbox.min.x, bbox.max.y - bbox.min.y, bbox.max.z - bbox.min.z );
    }

    //.expandByScalar(0.9);//new THREE.Box3( new THREE.Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new THREE.Vector3(boxSize / 2, boxSize / 2, boxSize / 2));
    //_applyBoxUV( bufferGeometry, transformMatrix, uvBbox, boxSize );

    let uvBbox = new Box3(new Vector3(-boxSize / 2, -boxSize / 2, -boxSize / 2), new Vector3(boxSize / 2, boxSize / 2, boxSize / 2));
    //let uvBbox = new Box3(new Vector3(-(boxSize / 2)/3, -(boxSize / 2)/3, -(boxSize / 2)/3), new Vector3((boxSize / 2)/3, (boxSize / 2)/3, (boxSize / 2)/3));
    //let uvBbox = bbox
    


    let coords = [];
    //coords.length = 2 * geometry.attributes.position.array.length / 3;
    coords.length = 2 * geometry.attributes.position.count;

    //if ( geometry.attributes.uv === undefined ) geometry.addAttribute('uv', new Float32BufferAttribute(coords, 2));
    if ( geometry.attributes.uv === undefined ) geometry.setAttribute('uv', new Float32BufferAttribute(coords, 2));
    
    let makeSphereUVs = function( v0, v1, v2 ) {

        //pre-rotate the model so that cube sides match world axis
        v0.applyMatrix4(transformMatrix);
        v1.applyMatrix4(transformMatrix);
        v2.applyMatrix4(transformMatrix);

        let invTwoPi = 1 / (2.0 * Math.PI);
        let invPi = 1 / Math.PI;

        v0.normalize();
        v1.normalize();
        v2.normalize();

        return {
            uv0: new Vector2( .5 - Math.atan( v0.z, - v0.x ) * invTwoPi, .5 - Math.asin( v0.y ) * invPi ),
            uv1: new Vector2( .5 - Math.atan( v1.z, - v1.x ) * invTwoPi, .5 - Math.asin( v1.y ) * invPi ),
            uv2: new Vector2( .5 - Math.atan( v2.z, - v2.x ) * invTwoPi, .5 - Math.asin( v2.y ) * invPi ),
        };

    };


  
    //maps 3 verts of 1 face on the better side of the cube
    //side of the cube can be XY, XZ or YZ
    let makeCubeUVs = function( v0, v1, v2 ) {

        //pre-rotate the model so that cube sides match world axis
        v0.applyMatrix4(transformMatrix);
        v1.applyMatrix4(transformMatrix);
        v2.applyMatrix4(transformMatrix);

        //get normal of the face, to know into which cube side it maps better
        let n = new Vector3();
        n.crossVectors( v1.clone().sub(v0), v1.clone().sub(v2) ).normalize();
        //n.crossVectors(  v0.clone().sub(v1), v2.clone().sub(v1) ).normalize();

        //if(n0) n.copy(n0)
        let reverse = false
        if(n.x<0 || n.y<0 || n.z<0) reverse = true

        n.x = Math.abs(n.x);
        n.y = Math.abs(n.y);
        n.z = Math.abs(n.z);

        let uv0 = new Vector2();
        let uv1 = new Vector2();
        let uv2 = new Vector2();
        let max = 1/boxSize;

        
        // xz mapping
        if ( n.y > n.x && n.y > n.z ) {

            uv0.set( v0.x - uvBbox.min.x, uvBbox.max.z - v0.z ).multiplyScalar( max );
            uv1.set( v1.x - uvBbox.min.x, uvBbox.max.z - v1.z ).multiplyScalar( max );
            uv2.set( v2.x - uvBbox.min.x, uvBbox.max.z - v2.z ).multiplyScalar( max );

        } else if ( n.x > n.y && n.x > n.z ) {

            uv0.set( v0.z - uvBbox.min.z, v0.y - uvBbox.min.y ).multiplyScalar( max );
            uv1.set( v1.z - uvBbox.min.z, v1.y - uvBbox.min.y ).multiplyScalar( max );
            uv2.set( v2.z - uvBbox.min.z, v2.y - uvBbox.min.y ).multiplyScalar( max );

        } else if ( n.z > n.y && n.z > n.x ) {

            uv0.set( v0.x - uvBbox.min.x, v0.y - uvBbox.min.y ).multiplyScalar( max );
            uv1.set( v1.x - uvBbox.min.x, v1.y - uvBbox.min.y ).multiplyScalar( max );
            uv2.set( v2.x - uvBbox.min.x, v2.y - uvBbox.min.y ).multiplyScalar( max );

        }

        return { uv0: uv0, uv1: uv1, uv2: uv2 } 
    };



    let n, i, id0, id1, id2, uvs;
    let v0 = new Vector3();
    let v1 = new Vector3();
    let v2 = new Vector3();

    let nn0 = new Vector3();
    let nn1 = new Vector3();
    let nn2 = new Vector3();

    const positionAttribute = geometry.getAttribute( 'position' );
    const normalAttribute = geometry.getAttribute( 'normal' );

    if ( geometry.index ) { // is it indexed buffer geometry

        for (i = 0; i < geometry.index.count; i+=3 ) {

            //console.log('is index')

            //n = i*3;
            id0 = geometry.index.getX( i + 0 );
            id1 = geometry.index.getX( i + 1 );
            id2 = geometry.index.getX( i + 2 );

            v0.fromBufferAttribute( positionAttribute, id0 );
            v1.fromBufferAttribute( positionAttribute, id1 );
            v2.fromBufferAttribute( positionAttribute, id2 );

            /*nn0.fromBufferAttribute( normalAttribute, id0 );
            nn1.fromBufferAttribute( normalAttribute, id1 );
            nn2.fromBufferAttribute( normalAttribute, id2 )*/



            if( type === 'sphere' ) uvs = makeSphereUVs( v0, v1, v2 );
            else uvs = makeCubeUVs( v0, v1, v2, nn0, nn1, nn2 );

            coords[2 * id0] = uvs.uv0.x;
            coords[2 * id0 + 1] = uvs.uv0.y;

            coords[2 * id1] = uvs.uv1.x;
            coords[2 * id1 + 1] = uvs.uv1.y;

            coords[2 * id2] = uvs.uv2.x;
            coords[2 * id2 + 1] = uvs.uv2.y;
        }
    } else {

        for ( i = 0; i < positionAttribute.count; i += 3) {

            v0.fromBufferAttribute( positionAttribute, i + 0 );
            v1.fromBufferAttribute( positionAttribute, i + 1 );
            v2.fromBufferAttribute( positionAttribute, i + 2 );

            if( type === 'sphere' ) uvs = makeSphereUVs( v0, v1, v2 );
            else uvs = makeCubeUVs( v0, v1, v2 );

            let idx0 = i//vi / 3;
            let idx1 = i+1//idx0 + 1;
            let idx2 = i+2//idx0 + 2;

            coords[2 * idx0] = uvs.uv0.x;
            coords[2 * idx0 + 1] = uvs.uv0.y;

            coords[2 * idx1] = uvs.uv1.x;
            coords[2 * idx1 + 1] = uvs.uv1.y;

            coords[2 * idx2] = uvs.uv2.x;
            coords[2 * idx2 + 1] = uvs.uv2.y;
        }

    }

    geometry.attributes.uv.array = new Float32Array( coords );
    geometry.attributes.uv.needsUpdate = true;

}


/*
export function calcNormal( normals, normal, angle ){

    let allowed = normals.filter( n => n.angleTo( normal ) < angle * Math.PI / 180 );
    return allowed.reduce( (a, b) => a.clone().add( b ) ).normalize();

}

export function computeVertexNormals(geometry, angle){

    geometry.computeFaceNormals();
    
    var vertices = geometry.vertices.map( () => [] ); // vertices with normals array

    geometry.faces.map( face => {
        vertices[ face.a ].push( face.normal );
        vertices[ face.b ].push( face.normal );
        vertices[ face.c ].push( face.normal );
    });

    geometry.faces.map( face => {
        face.vertexNormals[ 0 ] = calcNormal( vertices[ face.a ], face.normal, angle );
        face.vertexNormals[ 1 ] = calcNormal( vertices[ face.b ], face.normal, angle );
        face.vertexNormals[ 2 ] = calcNormal( vertices[ face.c ], face.normal, angle );
    });

    if ( geometry.faces.length > 0 ) geometry.normalsNeedUpdate = true;

}*/

/*

BufferGeometry.prototype.computeMorphFaceNormals = function () {

        var i, il, f, fl, face;

        // save original normals
        // - create temp variables on first access
        //   otherwise just copy (for faster repeated calls)

        for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

            face = this.faces[ f ];

            if ( ! face.__originalFaceNormal ) {

                face.__originalFaceNormal = face.normal.clone();

            } else {

                face.__originalFaceNormal.copy( face.normal );

            }

        }

        // use temp geometry to compute face normals for each morph

        var tmpGeo = new THREE.Geometry();
        tmpGeo.faces = this.faces;

        for ( i = 0, il = this.morphTargets.length; i < il; i ++ ) {

            // create on first access

            if ( ! this.morphNormals[ i ] ) {

                this.morphNormals[ i ] = {};
                this.morphNormals[ i ].faceNormals = [];

                var dstNormalsFace = this.morphNormals[ i ].faceNormals;

                var faceNormal;

                for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

                    faceNormal = new Vector3();

                    dstNormalsFace.push( faceNormal );

                }

            }

            var morphNormals = this.morphNormals[ i ];

            // set vertices to morph target

            tmpGeo.vertices = this.morphTargets[ i ].vertices;

            // compute morph normals

            tmpGeo.computeFaceNormals();

            // store morph normals

            var faceNormal;

            for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

                face = this.faces[ f ];

                faceNormal = morphNormals.faceNormals[ f ];

                faceNormal.copy( face.normal );
            }

        }

        // restore original normals

        for ( f = 0, fl = this.faces.length; f < fl; f ++ ) {

            face = this.faces[ f ];

            face.normal = face.__originalFaceNormal;

        }

    }
    */