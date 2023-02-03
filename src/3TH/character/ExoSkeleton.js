import { math } from '../math.js';
import { root } from '../root.js';


function ExoSkeleton ( avatar ) {


    THREE.Object3D.call( this );

    this.isReady = false;

    this.avatar = avatar;
    //this.nodes = [];

    this.mtx = new THREE.Matrix4();
    this.mtx2 = new THREE.Matrix4();

    this.p = new THREE.Vector3();
    this.s = new THREE.Vector3();
    this.q = new THREE.Quaternion();
    this.e = new THREE.Euler();

    this.mat = root.mat.skinCollider;

    this.init( avatar.mesh );

}

ExoSkeleton.prototype = Object.assign( Object.create( THREE.Object3D.prototype ), {


    updateMatrixWorld: function ( force ) {

        if( !this.isReady ) return;

        THREE.Object3D.prototype.updateMatrixWorld.call( this, force );

        let nodes = this.children;
        let i = nodes.length, node, bone;

        while( i-- ){

            node = nodes[i];
            bone = node.userData.bone;

            this.mtx.multiplyMatrices( bone.matrixWorld, node.userData.decal ).decompose( this.p, this.q, this.s );

            node.position.copy( this.p );
            node.quaternion.copy( this.q );

        }

    },

    init: function ( object ) {

        // get character bones
        let bones = object.skeleton.bones;
        //let nodes = [];

        let p1 = new THREE.Vector3();
        let p2 = new THREE.Vector3();

        let i, lng = bones.length, name, n, bone, parent;
        let size, dist, type, mesh, r, kinematic, translate, rot, fx;

        for( i = 0; i < lng; i++ ){

            type = null;
            bone = bones[i];
            name = bone.name;
            parent = bone.parent;

            if( parent ) {

                n = parent.name;

                p1.setFromMatrixPosition( parent.matrixWorld );
                p2.setFromMatrixPosition( bone.matrixWorld );
                dist = p1.distanceTo( p2 );

                translate = [ dist * 0.5, 0, 0 ];
                size = [ dist, 1, 1 ];
                rot = [0,0,0];

                fx = '_C';

                if( n==='head' ){ type = 'box'; size = [ dist, 0.16, 0.2 ]; fx='_H'; }
                //if( n==='neck'  ){ type = 'box'; size = [ dist, 0.06, 0.06 ]; rot[2] = 0; }
                if( n==='chest' && name ==='MN'){ type = 'box'; size = [ dist, 0.30, 0.28 ]; rot[2] = 0; }
                if( n==='abdomen' ){ type = 'box'; size = [ dist+0.14, 0.28, 0.24 ]; rot[2] = 0; translate[0] -= 0.07;}

                 // legs
                if( n==='rThigh'  ){ type = 'box'; size = [ dist+ 0.1, 0.15, 0.15 ]; translate[0] -= 0.05; }
                if( n==='lThigh'  ){ type = 'box'; size = [ dist+ 0.1, 0.15, 0.15 ]; translate[0] -= 0.05; }
                if( n==='rShin' ){ type = 'box'; size = [ dist+ 0.1, 0.12, 0.12 ]; translate[0] += 0.05; }
                if( n==='lShin' ){ type = 'box'; size = [ dist+ 0.1, 0.12, 0.12 ]; translate[0] += 0.05; }

                // arm
                if( n==='rShldr'  ){ type = 'box'; size = [ dist+ 0.06, 0.12, 0.12 ]; translate[0] -= 0.03; }
                if( n==='lShldr'  ){ type = 'box'; size = [ dist+ 0.06, 0.12, 0.12 ]; translate[0] -= 0.03; }
                if( n==='rForeArm' ){ type = 'box'; size = [ dist + 0.1, 0.1, 0.1 ]; translate[0] += 0.05; }
                if( n==='lForeArm' ){ type = 'box'; size = [ dist + 0.1, 0.1, 0.1]; translate[0] += 0.05; }

                if( type !== null ) this.addMesh( parent, type, size, translate, rot, fx );

            }
        }

        //console.log( this.children.length );

        this.isReady = true;

    },

    addMesh: function ( parent, type, size, translate, rot, fx ) {

        // translation
        this.mtx.makeTranslation( translate[0], translate[1], translate[2] );
        // rotation
        //this.mtx2.makeRotationFromEuler( this.e.set( rot[0]*math.torad, rot[1]*math.torad, rot[2]*math.torad ) );
        //this.mtx.multiply( this.mtx2 );


        var mesh = new THREE.Mesh( root.geo[ type ], this.mat );
        mesh.scale.set( size[0], size[1], size[2] );

        mesh.name = fx;
        mesh.userData.decal = this.mtx.clone();
        mesh.userData.bone = parent;


        this.add( mesh );

        mesh.userData.avatar = this.avatar;

    },

    clear: function () {

        this.children = [];
        this.isReady = false;

    }

});


export { ExoSkeleton };