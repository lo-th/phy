import {
    Object3D,
    Mesh,
    Matrix4,
    Vector3,
    Quaternion,
    Euler,
    MeshStandardMaterial,
    MeshBasicMaterial,
    BoxGeometry
} from 'three';

export class ExoSkeleton extends Object3D {

    constructor( object, skeleton ) {

        super();

        this.isReady = false;

        this.skeleton = skeleton;

        this.bones = this.skeleton.bones;//getBoneList( object );
        this.root = object;

        this.box = new BoxGeometry()

        //console.log(this.bones)

        //this.avatar = avatar;
        //this.nodes = [];
        this.mtxr = new Matrix4();
        this.mtx0 = new Matrix4();
        this.mtx1 = new Matrix4();

        this.mtx = new Matrix4();
        this.mtx2 = new Matrix4();

        this.p = new Vector3();
        this.s = new Vector3();
        this.q = new Quaternion();
        this.e = new Euler();

        this.mat = new MeshBasicMaterial({ color:0xCCCC80, wireframe:true, toneMapped:false });//root.mat.skinCollider;

        this.init();

        this.matrix = object.matrixWorld;
        this.matrixAutoUpdate = false;

    }

    updateMatrixWorld ( force ) {

        if( !this.isReady ) return;

        //THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

        let nodes = this.children;
        let i = nodes.length, node, bone;

        this.mtxr.copy( this.root.matrixWorld ).invert();

        //console.log('up', i)

        while( i-- ){

            node = nodes[i];
            bone = node.userData.bone;

            //this.mtx1.fromArray( this.skeleton.boneMatrices, bone.idx )

            this.mtx0.multiplyMatrices(this.mtxr, bone.matrixWorld );
            //this.mtx0.scale( bone.scalling );

            this.mtx.multiplyMatrices( this.mtx0, node.userData.decal );
            //this.mtx.multiplyMatrices( this.mtx1, this.mtx );


            this.mtx.decompose( this.p, this.q, this.s );


            node.position.copy( this.p );
            node.quaternion.copy( this.q );

            node.updateMatrix()

        }

        super.updateMatrixWorld( force );

    }

    init () {

        this.mtxr.copy( this.root.matrixWorld ).invert();

        // get character bones
        const bones = this.bones; //object.skeleton.bones;
        //let nodes = [];

        let p1 = new Vector3();
        let p2 = new Vector3();

        let i, lng = bones.length, name, n, bone, parent;
        let size, dist, type, mesh, r, kinematic, translate, rot, fx;

        for( i = 0; i < lng; i++ ){

            type = null;
            bone = bones[i];
            name = bone.name;
            parent = bone.parent;

            //bone.updateMatrix()


            if( parent ) {

                //parent.updateMatrix()

                n = parent.name;

                p1.setFromMatrixPosition( parent.matrixWorld );
                p2.setFromMatrixPosition( bone.matrixWorld );

                //p1.setFromMatrixPosition( this.mtx.multiplyMatrices(this.mtxr, parent.matrixWorld ) ) //parent.matrixWorld );
                //p2.setFromMatrixPosition( this.mtx.multiplyMatrices(this.mtxr, bone.matrixWorld ) ) //bone.matrixWorld );
                dist = p1.distanceTo( p2 );

                //console.log(n, dist)

                translate = [ 0, 0, dist * 0.5 ];
                size = [ dist, 1, 1 ];
                rot = [0,0,0];

                fx = '_C';

                if( n==='head' && name === 'End_head' ){ type = 'box'; size = [ 0.16, 0.2, dist ]; translate = [ 0, 0.025, -dist * 0.5 ]; }
                if( n==='chest' && name==='neck' ){ type = 'box'; size = [  0.30, 0.28, dist ]; translate = [ 0, 0, -dist * 0.5 ]; }
                if( n==='abdomen' ){ type = 'box'; size = [ 0.28, 0.24,  dist+0.14 ]; rot[2] = 0; translate = [ 0, 0, -dist * 0.5 ];translate[2] += 0.07;}

                 // legs
                if( n==='rThigh' ){ type = 'box'; size = [  0.15, 0.15, dist ];  }
                if( n==='lThigh' ){ type = 'box'; size = [  0.15, 0.15 , dist];  }
                if( n==='rShin' ){ type = 'box'; size = [  0.12, 0.12, dist+ 0.1, ]; translate[2] += 0.05; }
                if( n==='lShin' ){ type = 'box'; size = [  0.12, 0.12, dist+ 0.1, ]; translate[2] += 0.05; }

                // arm
                if( n==='rShldr'  ){ type = 'box'; size = [   dist+ 0.06, 0.12, 0.12  ]; translate[0] = -translate[2]+0.03; translate[2]=0; }
                if( n==='lShldr'  ){ type = 'box'; size = [  dist+ 0.06,0.12,   0.12, ];  translate[0] = translate[2]-0.03; translate[2]=0; }
                if( n==='rForeArm' ){ type = 'box'; size = [  dist + 0.1,0.1,  0.1 ];  translate[0] = -translate[2]-0.05; translate[2]=0; }
                if( n==='lForeArm' ){ type = 'box'; size = [  dist + 0.1,0.1,  0.1]; translate[0] = translate[2]+0.05; translate[2]=0; }

                if( type !== null ) this.addMesh( parent, type, size, translate, rot, fx );

            }
        }

        this.isReady = true;

    }

    addMesh ( parent, type, size, translate, rot, fx ) {

        // translation
        //this.mtx.makeTranslation( translate[0], translate[1], translate[2] );
        this.mtx.makeTranslation( translate[0], translate[1], translate[2] );
        // rotation
        //this.mtx2.makeRotationFromEuler( this.e.set( rot[0]*math.torad, rot[1]*math.torad, rot[2]*math.torad ) );
        //this.mtx.multiply( this.mtx2 );

       //let box = new BoxGeometry( size[0], size[1], size[2])


        var mesh = new Mesh( this.box, this.mat );
        mesh.scale.fromArray(size);

        //mesh.name = fx;
        mesh.userData.decal = this.mtx.clone();
        mesh.userData.bone = parent;
        mesh.userData.size = size;


        this.add( mesh );

        //mesh.userData.avatar = this.avatar;

    }

    dispose () {
        this.children = [];
        this.box.dispose();
        this.mat.dispose();
        this.isReady = false;
    }

}

/*
function getBoneList( object ) {

    const boneList = [];

    if ( object.isBone === true ) {

        boneList.push( object );

    }

    for ( let i = 0; i < object.children.length; i ++ ) {

        boneList.push.apply( boneList, getBoneList( object.children[ i ] ) );

    }

    return boneList;

}*/