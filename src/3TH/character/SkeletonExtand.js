import { Skeleton, Matrix4, Vector3 } from 'three';

//-----------------------------
//
//  SKELETON EXTAND
//
//-----------------------------
export const sk = {}

const _offsetMatrix = new Matrix4();
const _identityMatrix = new Matrix4();
const _decal = new Vector3();

let K = Skeleton.prototype;

K.resetScalling = function () {

    for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

        this.bones[i].idx = i;
        this.bones[i].scalling = new Vector3(1,1,1);
        //console.log(this.bones[i].id, i)

    }

    //this.setScalling();

}

K.setScalling = function ( fingerPos ) {

    let o, b, i, lng = this.bones.length;
    let parent;

    for ( i = 0; i < lng; i ++ ) {

        b = this.bones[ i ];
        parent = b.parent || null;

        if( parent !== null && parent.scalling && b.name!=='root'){

            b.position.multiply( parent.scalling );
            b.updateMatrixWorld( true );

        }

    }

    this.calculateInverses();

}

K.update = function () {

    const bones = this.bones;
    const boneInverses = this.boneInverses;
    const boneMatrices = this.boneMatrices;
    const boneTexture = this.boneTexture;

    let scaleMatrix;
    
    // flatten bone matrices to array

    let i = bones.length, n=0, j, k

    //for ( let i = 0, il = bones.length; i < il; i ++ ) {
    while(i--){

        // compute the offset between the current and the original transform

        const matrix = bones[ n ] ? bones[ n ].matrixWorld : _identityMatrix;

        if( bones[ n ].scalling !== undefined  ){ 
            matrix.scale( bones[ n ].scalling );
            j = bones[ n ].children.length;
            k = 0 
            while(j--){
                scaleMatrix = matrix.clone();
                scaleMatrix.multiply( bones[ n ].children[ k ].matrix );
                bones[ n ].children[ k ].matrixWorld.setPosition( _decal.setFromMatrixPosition( scaleMatrix ) );
                k++
            }
        }

        _offsetMatrix.multiplyMatrices( matrix, boneInverses[ n ] );
        _offsetMatrix.toArray( boneMatrices, n * 16 );
        n++

    }

    if ( boneTexture !== null ) {

        boneTexture.needsUpdate = true;

    }

}