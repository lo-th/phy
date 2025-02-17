import {
	InstancedMesh, InstancedBufferAttribute,
	Object3D, MeshBasicMaterial, Mesh, Matrix4, Quaternion
} from 'three';

export class Instance extends InstancedMesh {

	constructor( geometry, material, count = 0 ) {

        super( geometry, material, count );

        //this.instanceMatrix = null;
        this.matrixAutoUpdate = false; 
        this.tmpMatrix = new Matrix4();
        this.tmpQuat = new Quaternion();

        this.instanceUv = null;
        this.instanceColor = null;
        this.needSphereUp = false;
        this.isRay = true;

        this.overMaterial = null;
        this.currentOver = -1;
        this.isOver = false;

        this.tmpElement = [];
        
    }

    clearOutLine() {

        if( !this.overMaterial ) return;
        if( !this.outline ) return;
        //let i = this.outline.length
        this.parent.remove( this.outline );
        this.outline = null;
        this.currentOver = -1;

    }

    addOutLine( obj ) {

        if( !this.overMaterial ) return;

        this.outline = new Mesh( this.geometry, this.overMaterial );
        if(this.overMaterial.uniforms.power)this.overMaterial.uniforms.power.value = 0.01;
        this.outline.matrixAutoUpdate = false;
        this.tmpMatrix.fromArray( this.instanceMatrix.array, obj.id*16 );
        this.outline.matrix.copy( this.tmpMatrix );
        this.outline.matrixWorldNeedsUpdate = true;
        this.parent.add( this.outline );
        this.currentOver = obj.id;

    }

    over ( b ) {

        if( b && !this.instance.isOver ){ 

            this.instance.isOver = true;
            this.instance.addOutLine( this );

        }

        if( !b && this.instance.isOver ){ 

            this.instance.isOver = false;
            this.instance.clearOutLine();

        }

    }

    getInfo( index ) {

        this.tmpMatrix.fromArray( this.instanceMatrix.array, index * 16 );
        let pos = {x:0, y:0, z:0 };
        let scale = { x:0, y:0, z:0 };
        this.tmpMatrix.decompose( pos, this.tmpQuat, scale );
        return{
            pos:[pos.x, pos.y, pos.z],
            quat:this.tmpQuat.toArray(),
            scale:[scale.x, scale.y, scale.z],
            //worldMatrix:this.tmpMatrix.toArray(),
        }
    }

    

    setColorAt( index, color ) {

        if ( this.instanceColor === null ) {

            this.instanceColor = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 3 ), 3 );

        }

        if( color.isColor ) color = color.toArray();
        
        let id = index * 3;
        this.instanceColor.array[id] = color[0];
        this.instanceColor.array[id +1] = color[1];
        this.instanceColor.array[id +2] = color[2];
        //color.toArray( this.instanceColor.array, index * 3 );

    }

    /*setUvAt( index, uv ) {

        if ( this.instanceUv === null ) this.instanceUv = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 2 ), 2 );
        
        if( uv.isVector2 ) uv = uv.toArray()
        let id = index * 2
        this.instanceUv.array[id] = uv[0]
        this.instanceUv.array[id +1] = uv[1]

    }*/

    add( bref, position = [0,0,0], rotation = [0,0,0,1], scale = [1,1,1], color = null, uv = null ) {

        if( rotation.length === 3 ) rotation = this.tmpQuat.setFromEuler( {_x:rotation[0], _y:rotation[1], _z:rotation[2], _order:'XYZ'}, false ).toArray();
        if(color){ 
            if( color.isColor ) color = color.toArray();
            if ( this.instanceColor === null ) this.instanceColor = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 3 ), 3 );
        }
        /*if(uv){ 
            if( uv.isVector2 ) uv = uv.toArray()
            if ( this.instanceUv === null ) this.instanceUv = new InstancedBufferAttribute( new Float32Array( this.instanceMatrix.count * 2 ), 2 );
        }*/
        this.expand( position, rotation, scale, color, uv );

        //console.log(bref.id)
        this.tmpElement.push( bref );
    }

    slice( ar, begin, end ) {

        let target = new Float32Array(end - begin);
        for (let i = 0; i < begin + end; ++i) {
            target[i] = ar[begin + i];
        }
        return target

    }

    remove( id ) {

        if(!this.count) return;
        
        this.tmpElement.splice( id, 1 );

        let old = [...this.instanceMatrix.array];
        old.splice( id*16, 16 );
        this.instanceMatrix = new InstancedBufferAttribute( new Float32Array(old), 16 );
        //this.instanceMatrix.array = new Float32Array(old);

        //this.instanceMatrix.array = this.slice( this.instanceMatrix.array, id*16, 16 );
        //this.instanceMatrix.needsUpdate = true;

        if ( this.instanceColor !== null ) {
            old = [...this.instanceColor.array];
            old.splice( id*3, 3 );
            this.instanceColor = new InstancedBufferAttribute( new Float32Array(old), 3 );
            //this.instanceColor.array = new Float32Array(old);
        }

        if ( this.instanceUv !== null ) {
            old = [...this.instanceUv.array];
            old.splice( id*2, 2 );
            this.instanceUv = new InstancedBufferAttribute( new Float32Array(old), 2 );
            //this.instanceUv.array = new Float32Array(old);
        }
        this.count--;

        this.reDistribute();

    }

    reDistribute() {

        let i = this.count;
        while(i--) this.tmpElement[i].id = i;
        
    }

    getByName( index ) {

        return this.tmpElement[index].name;

    }

    getBodyList(){

        let bodyNames = [];
        let i = this.count;
        while(i--) bodyNames.push( this.tmpElement[i].name );
        return bodyNames;

    }

    expand( p, q, s, c = [1,1,1], uv ) {

        let old = this.instanceMatrix !== null ? this.instanceMatrix.array : [];
        this.tmpMatrix.compose({x:p[0], y:p[1], z:p[2]}, {_x:q[0], _y:q[1], _z:q[2], _w:q[3]}, {x:s[0], y:s[1], z:s[2]})
        this.instanceMatrix = new InstancedBufferAttribute( new Float32Array([...old, ...this.tmpMatrix.toArray()]), 16 );
        //this.instanceMatrix.setUsage( DynamicDrawUsage );
        if ( this.instanceColor !== null ) {
            old = this.instanceColor.array;
            this.instanceColor = new InstancedBufferAttribute( new Float32Array([...old, ...c ]), 3 );
        }
       /* if ( this.instanceUv !== null ) {
            old = this.instanceUv.array;
            this.instanceUv = new InstancedBufferAttribute( new Float32Array([...old, ...uv ]), 2 );
        }*/
        this.count ++;

    }

    setTransformAt( index, p, q, s ) {

        this.tmpMatrix.compose({ x:p[0], y:p[1], z:p[2] }, {_x:q[0], _y:q[1], _z:q[2], _w:q[3]}, {x:s[0], y:s[1], z:s[2]});
        this.tmpMatrix.toArray( this.instanceMatrix.array, index * 16 );
        this.needSphereUp = true;

        if( !this.outline ) return;
        if(this.currentOver === index ){
            this.outline.matrix.copy(this.tmpMatrix);
            this.outline.matrixWorldNeedsUpdate = true;
        }

    }

    dispose() {

        this.clearOutLine();
        this.parent.remove(this);
        this.geometry.dispose();
        //this.instanceMatrix = null;
        this.instanceColor = null;
        this.count = 0;
        this.tmpElement = [];
        //console.log(this.name+" is dispose")
        this.dispatchEvent( { type: 'dispose' } );

    }

    setRaycast(v) {

        if( v !== undefined ) this.isRay = v;

    }

    raycast( raycaster, intersects ) {

        if(!this.isRay) return
        super.raycast( raycaster, intersects );

    }

    update(){

        if( this.needSphereUp ) this.computeBoundingSphere();
        if( this.instanceMatrix ) this.instanceMatrix.needsUpdate = true;
        if( this.instanceColor ) this.instanceColor.needsUpdate = true;
        //if( this.instanceUv ) this.instanceUv.needsUpdate = true;
        this.needSphereUp = false;

    }

}