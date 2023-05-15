import { Skeleton, Matrix4, Vector3 } from 'three';

/** __
*    _)_|_|_
*   __) |_| | 2023
*  @author lo.th / https://github.com/lo-th
* 
*  SKELETON EXTAND
*  add bone scale and physics controle of bones
*/

export const sk = {}

const _offsetMatrix = new Matrix4();
const _identityMatrix = new Matrix4();
const _decal = new Vector3();

let K = Skeleton.prototype;

K.setScalling = function ( bone, x, y, z ) {

    if( !this.scalled ) this.scalled = true
    bone.scalling.set(x, y, z)

}

K.resetScalling = function () {

    this.scalled = false

    for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

        this.bones[i].scalling = new Vector3(1,1,1);

        this.bones[i].isPhysics = false;
        this.bones[i].phyMtx = new Matrix4();

    }

    this.applyScalling()

}

K.childScale = function ( bone, matrix ) {

    if( !this.scalled ) return

    if( bone.scalling ) matrix.scale( bone.scalling );
    let j = bone.children.length, k = 0, child, scaleMatrix;
    while(j--){
        child = bone.children[ k ]
        scaleMatrix = matrix.clone()
        scaleMatrix.multiply( child.matrix )
        child.matrixWorld.copy( scaleMatrix )
        //child.matrixWorld.setPosition( _decal.setFromMatrixPosition( scaleMatrix ) );
        //child.matrixWorld.setPosition( _decal.setFromMatrixPosition( scaleMatrix ) );
        k++
    }

}


K.applyScalling = function ( fingerPos ) {

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

    // flatten bone matrices to array

    let i = bones.length, bone, n=0

    while( i-- ){

        bone = bones[ n ]

        // compute the offset between the current and the original transform

        const matrix = bone ? ( bone.isPhysics ? bone.phyMtx : bone.matrixWorld ) : _identityMatrix;

        if( bone.isPhysics ){
            this.scalled = true
        }

        this.childScale( bone, matrix )

        _offsetMatrix.multiplyMatrices( matrix, boneInverses[ n ] );
        _offsetMatrix.toArray( boneMatrices, n * 16 );
        n++

    }

    if ( boneTexture !== null ) {

        boneTexture.needsUpdate = true;

    }

}
