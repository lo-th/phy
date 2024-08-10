import { Skeleton, Matrix4, Vector3, MathUtils, Quaternion } from 'three';

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

K.byName = function ( name ) {

    let i = this.bones.length
    while(i--) if( this.bones[i].name === name ) return this.bones[i]
    return null

}

K.getId = function ( name ) {

    let i = this.bones.length
    while(i--) if( this.bones[i].name === name ) return i
    return null

}

K.setExtraRotation = function ( b, x, y, z ) {

    //this.pose()

    /*let name = b.isBone ? b.name : b
    let degtorad = MathUtils.DEG2RAD

    let bone = this.byName( name )
    if( !bone ) return

    let id = this.getId( name )
    let tt = new Matrix4().makeRotationFromEuler( {x:x*degtorad, y:y*degtorad, z:z*degtorad, order:'XYZ'});

    //bone.matrixWorld.multiply( tt );
    bone.matrix.multiply( tt );
    bone.matrixWorld.multiplyMatrices( bone.parent.matrixWorld, bone.matrix );
    bone.matrix.decompose( bone.position, bone.quaternion, bone.scale );
    //bone.updateMatrixWorld( true )

    //bone.updateWorldMatrix( true, true )

    let j = bone.children.length, child;
    while(j--){
        child = bone.children[ j ]
        child.matrixWorld.multiplyMatrices( bone.matrixWorld, child.matrix )
    }



    this.calculateInverses()*/
//this.pose()


    let bone = b.isBone ? b : this.byName( b )
    if( !bone ) return
    let degtorad = MathUtils.DEG2RAD
    
    //bone.extraRotation = new Matrix4().makeRotationFromEuler( {x:x*degtorad, y:y*degtorad, z:z*degtorad, order:'XYZ'});
    //bone.extraRotation = new Quaternion().setFromEuler( {_x:x*degtorad, _y:y*degtorad, _z:z*degtorad, _order:'XYZ'}).invert();

    //this.applyScalling()

}

K.setScalling = function ( b, x, y, z ) {

    let bone = b.isBone ? b : this.byName( b )
    if( !bone ) return
    bone.scalling = new Vector3(x, y, z);

}

K.resetScalling = function (b) {

    this.pose()

    this.scalled = true

    for ( let i = 0, il = this.bones.length; i < il; i ++ ) {

        //this.bones[i].scalling = new Vector3(1,1,1);
        this.bones[i].isPhysics = false;
        this.bones[i].phyMtx = new Matrix4();

    }

    if(!b) this.applyScalling()

}

K.childScale = function ( bone, matrix ) {

    if( !this.scalled ) return

    //

    if( bone.scalling ) matrix.scale( bone.scalling );
    //if( bone.extraRotation ) matrix.multiply( bone.extraRotation );
    //if( !bone.isBone ) return

    //if(bone.name === 'head') console.log(bone.children.length)


    let j = bone.children.length, child, k=0;

    while(j--){

        child = bone.children[ k ]
        k++

        if( child.isBone ) {
            child.matrixWorld.multiplyMatrices( matrix, child.matrix );
            
        } else {

            //child.matrixAutoUpdate = false;
            //child.applyMatrix4(matrix)
            //child.matrixWorldNeedsUpdate = false;
            child.matrixWorld.multiplyMatrices( matrix, child.matrix );
            //child.matrixWorldNeedsUpdate = true;

            //child.updateWorldMatrix(false,true)
            //child.updateWorldMatrix(true, true);
            //child.updateMatrixWorld(true);
            //child.updateMatrix()
            //child.updateWorldMatrix( false, true );

            // BUG WITH HAIR !!!
         //   child.matrixWorld.multiplyMatrices( matrix, child.matrix )
           // child.matrixWorld.multiplyMatrices( matrix, child.matrix )

            //child.updateWorldMatrix(false, true)
            //child.matrix = matrix.clone();
            //child.matrixWorld.premultiply( matrix.clone() )
           
        }

        
        //child.matrixAutoUpdate = true
        //if( child.matrixAutoUpdate ) child.matrixAutoUpdate = false
        //if( child.matrixWorldAutoUpdate ) child.matrixWorldAutoUpdate = false
        //child.matrixWorldNeedsUpdate = false;
        //child.matrixWorld.copy( child.matrix ).premultiply( matrix )

        //child.matrixWorld.copy( matrix ).multiply( child.matrix )
        


        //scaleMatrix = matrix.clone()
        //scaleMatrix.multiply( child.matrix )
        //child.matrixWorld.copy( scaleMatrix )

       // if( child.isBone ) 
            //child.matrix.premultiply(matrix)
            //child.matrixWorld.copy( child.matrix );
            
            ///child.matrixWorldNeedsUpdate = true;
        //child.matrix.premultiply(matrix)
        //child.matrixWorld.setPosition( _decal.setFromMatrixPosition( scaleMatrix ) );
        //child.matrixWorld.setPosition( _decal.setFromMatrixPosition( scaleMatrix ) );
        
    }

}

K.applyScalling = function ( fingerPos ) {

    let o, b, i, lng = this.bones.length;
    let parent;

    for ( i = 0; i < lng; i ++ ) {

        b = this.bones[ i ];
        parent = b.parent || null;

        if( parent !== null && parent.scalling && b.name!=='root' ){//

          //  if( parent.scalling ) 
            b.position.multiply( parent.scalling );
            //if(parent.extraRotation) b.quaternion.premultiply( parent.extraRotation );
            //b.updateWorldMatrix( false, true )
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

        bone = bones[ n ];

        // compute the offset between the current and the original transform
        //if(bone && bone.isPhysics) bone.matrixWorld.copy(bone.phyMtx)
        //const matrix = bone ? bone.matrixWorld : _identityMatrix;

        const matrix = bone ? ( bone.isPhysics ? bone.phyMtx : bone.matrixWorld ) : _identityMatrix;

        // no need but break dragon demo ??
        //if( bone.isPhysics ) this.scalled = true
        
        this.childScale( bone, matrix );

        _offsetMatrix.multiplyMatrices( matrix, boneInverses[ n ] );
        _offsetMatrix.toArray( boneMatrices, n * 16 );

        n++;

    }

    if ( boneTexture !== null ) {

        boneTexture.needsUpdate = true;

    }

}
