
import {
    Mesh,
    PlaneGeometry,
    BufferAttribute,
    Vector3,
    Vector2,
    Quaternion,
    DoubleSide,
    MeshStandardMaterial,
    MeshPhysicalMaterial,
    MeshBasicMaterial
} from 'three';

import { mergeVertices, mergeGeometries } from '../../jsm/utils/BufferGeometryUtils.js';
import { math } from '../math.js';
import { Pool } from '../Pool.js';
import { Shader } from '../Shader.js';


export class Landscape extends Mesh {

    constructor( o = {} ) {

        super();

        this.ready = false;
        this.needUpdate = false;

        this.type = 'terrain';
        this.name = o.name;

        this.folder = o.folder || './assets/textures/terrain/'

        this.mapN = 0;
        this.mapMax = 7;//7

        // terrain, water, road
        this.ttype = o.terrainType || 'terrain';

        this.callback = o.callback || function(){};
        
        this.physicsUpdate = () => {};

        this.uvx = [ o.uv || 18, o.uv || 18 ];

        this.sample = o.sample == undefined ? [128,128] : o.sample;
        this.size = o.size === undefined ? [100,30,100] : o.size;

        let sx = this.sample[0] - 1;
        let sz = this.sample[1] - 1;

        this.rx = sx / this.size[0];
        this.rz = sz / this.size[2];

        this.zone = o.zone || 1;

        // why ??
        /*let pp = 0
        if( this.zone === 0.5 ) pp=2
        if( this.zone === 0.25 ) pp=3
        if( this.zone === 0.125 ) pp=7*/
        let square = [this.size[0]/sx, this.size[2]/sz]
        //let dx = (this.size[0]/sx)//*pp
        //let dz = (this.size[2]/sz)//**pp


        this.sampleZ = [o.sample[0] * this.zone, o.sample[1] * this.zone];
        //this.sizeZ = [(o.size[0]-dx) * this.zone, o.size[1], (o.size[2]-dz) * this.zone];

        this.sizeZ = [(this.sampleZ[0]-1) * square[0], o.size[1], ((this.sampleZ[1]-1)) * square[1]];

        this.lng = this.sample[0] * this.sample[1];
        this.lngZ = this.sampleZ[0] * this.sampleZ[1];

        //console.log(  this.sample, this.sampleZ)

        this.getZid();


        this.data = {
            level: o.level || [1,0.2,0.05],
            frequency: o.frequency || [0.016,0.05,0.2],
            expo: o.expo || 1,
        }

        this.isWater = o.water || false;
        this.isIsland = o.island || false;
        this.isBorder = false;
        this.wantBorder = o.border || false;

        this.isBottom = false;
        this.wantBottom = o.bottom || false;
        this.wantBorder = o.border || false;

        this.colorBase = this.isWater ? { r:0, g:0.7, b:1 } : { r:0.25, g:0.25, b:0.25 };

        this.maxspeed = o.maxSpeed || 0.1;
        this.acc = o.acc == undefined ? 0.01 : o.acc;
        this.dec = o.dec == undefined ? 0.01 : o.dec;

        this.deep = o.deep == undefined ? 0 : o.deep;

        this.ease = new Vector2();

        // for perlin
        this.complexity = o.complexity == undefined ? 30 : o.complexity;
        this.complexity2 = o.complexity2 == undefined ? null : o.complexity2;

        this.local = new Vector3();
        if( o.local ) this.local.fromArray( o.local );

        this.pp = new Vector3();

        this.ratioZ = 1 / this.sampleZ[0];
        this.ratio = 1 / this.sample[0];
        this.ruvx =  1.0 / ( this.size[0] / this.uvx[0] );
        this.ruvy = - ( 1.0 / ( this.size[2] / this.uvx[1] ) );

        this.is64 = o.is64 || false;
        this.isTurn = o.turn || false;

        this.heightData = new Float32Array( this.lngZ )
        this.height = []

        // for physx 
        this.isAbsolute = o.isAbsolute || false;
        this.isTurned = o.isTurned || false;
        this.isReverse = o.isReverse || false;

        this.changeId = this.isReverse || this.isTurned;

        if( this.changeId ) this.getReverseID();

        this.colors = new Float32Array( this.lng * 3 );
        this.geometry = new PlaneGeometry( this.size[0], this.size[2], this.sample[0] - 1, this.sample[1] - 1 );
        this.geometry.rotateX( -math.PI90 );
        //if( this.isTurn ) 
        //this.geometry.rotateY( -math.PI90 );
        //if( this.isTurned ) this.geometry.rotateY( math.PI90 );


       // this.geometry.computeBoundingSphere();

        this.geometry.setAttribute( 'color', new BufferAttribute( this.colors, 3 ) );
        //this.geometry.setAttribute( 'uv2', this.geometry.attributes.uv );
        this.vertices = this.geometry.attributes.position.array;

        


        



        var isORM = false;
        var clevels = new Quaternion( 0.5, 0.5, 0.1, 0.2 )//0.95, 0.8, 0.1, 0.05 ); 
        if( o.maplevels ) clevels.fromArray( o.maplevels );
        var T = TerrainShader;
        var maps = o.maps || [ 'sand', 'grass3', 'rock' ], txt = {};
        var name;

        if(this.isWater) maps = ['water'];

        for( let i in maps ){

            name = maps[i]

            txt[name+'_c'] = Pool.texture({ url:this.folder + name +'_c.jpg', flip:false, repeat:this.uvx, encoding:o.encoding || true , callback: this.mapcallback.bind(this)  });
            txt[name+'_n'] = Pool.texture({ url:this.folder + name +'_n.jpg', flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });

            //txt[name+'_c'] = Pool.directTexture(this.folder + name +'_c.jpg', { flip:false, repeat:this.uvx, encoding:o.encoding || true , callback: this.mapcallback.bind(this)  });
            //txt[name+'_n'] = Pool.directTexture(this.folder + name +'_n.jpg', { flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });
           // if( isORM )txt[name+'_n'] = Pool.directTexture('./assets/textures/terrain/'+name+'_n.jpg', { flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });

        }

        //txt['noise'] = Pool.directTexture(this.folder + 'noise.png', { flip:false, repeat:[1,1], encoding:false , callback: this.mapcallback.bind(this)  });
        txt['noise'] = Pool.texture({ url:this.folder + 'noise.png', flip:false, repeat:[1,1], encoding:false , callback: this.mapcallback.bind(this)  });

        this.txt = txt

        this.material = new MeshPhysicalMaterial({ name:'terrain', vertexColors:true, color:0xFFFFFF, map:txt[maps[0]+'_c'], normalMap:txt[maps[0]+'_n'] });

        if( o.envmap !== undefined ) this.material.envMap = o.envmap

        if( this.isWater ){
            this.material.transparent = true;
            this.material.opacity = o.opacity || 0.4;
            this.material.side = DoubleSide;
            this.material.alphaMap = txt[maps[0]+'_c'];
            this.material.map = null;
            this.material.metalness  = 0.9;
            this.material.roughness = 0.1;
        } else {
            this.material.reflectivity = 0.0
            this.material.metalness = o.metalness || 0.0;
            this.material.roughness = o.roughness || 0.3;//0.7; 
        }

        if( isORM ){
            this.material.metalnes  = 1; 
            this.material.roughness = 1; 
        }

        var ns = o.nScale || 0.5;
        this.material.normalScale.set(ns,-ns);

        if( !this.isWater ){

            let self = this;

            this.material.onBeforeCompile = function ( shader ) {

                let uniforms = shader.uniforms;

                //uniforms['fogTime'] = { value: 0 };

                uniforms['clevels'] = { value: clevels };

                uniforms['map1'] = { value: txt[maps[1]+'_c'] };
                uniforms['map2'] = { value: txt[maps[2]+'_c'] };

                uniforms['randomUv'] = { value: 1 };

                uniforms['normalMap1'] = { value: txt[maps[1]+'_n'] };
                uniforms['normalMap2'] = { value: txt[maps[2]+'_n'] };

                //uniforms['noise'] = { value: txt['noise'] };
                uniforms['noiseMap'] = { value: txt['noise'] };
                uniforms['useNoiseMap'] = { value: 1 };

                shader.uniforms = uniforms;

                Shader.addParsFragment( shader, Shader.getRandomUv() + T.fragmentAdd );

                let fragment = shader.fragmentShader;

                fragment = fragment.replace( '#include <map_fragment>', T.map );
                fragment = fragment.replace( '#include <normal_fragment_maps>', T.normal );
                fragment = fragment.replace( '#include <color_fragment>', '' );

                if( isORM ){

                    fragment = fragment.replace( '#include <normalmap_pars_fragment>', T.normal_pars );
                        
                    fragment = fragment.replace( '#include <roughnessmap_pars_fragment>', T.rough_pars );
                    fragment = fragment.replace( '#include <metalnessmap_pars_fragment>', '' );
                    fragment = fragment.replace( '#include <aomap_pars_fragment>', '' );

                    
                    fragment = fragment.replace( '#include <roughnessmap_fragment>', T.rough );
                    fragment = fragment.replace( '#include <metalnessmap_fragment>', '' );
                    fragment = fragment.replace( '#include <aomap_fragment>', T.ao );

                }
                
                shader.fragmentShader = fragment;

                self.material.userData.shader = shader;

                //if( o.shader ) o.shader.modify( shader );

                Shader.modify( shader );

            }


            Object.defineProperty( this.material, 'randomUv', {
                  get() { return this.userData.shader.uniforms.randomUv.value ? true : false; },
                  set( value ) { this.userData.shader.uniforms.randomUv.value = value ? 1 : 0; }
            });

            Object.defineProperty( this.material, 'map1', {
                  get() { return this.userData.shader.uniforms.map1.value; },
                  set( value ) { this.userData.shader.uniforms.map1.value = value; }
            });

            Object.defineProperty( this.material, 'map2', {
                  get() { return this.userData.shader.uniforms.map2.value; },
                  set( value ) { this.userData.shader.uniforms.map2.value = value; }
            });

            Object.defineProperty( this.material, 'normalMap1', {
                  get() { return this.userData.shader.uniforms.normalMap1.value; },
                  set( value ) { this.userData.shader.uniforms.normalMap1.value = value; }
            });

            Object.defineProperty( this.material, 'normalMap2', {
                  get() { return this.userData.shader.uniforms.normalMap2.value; },
                  set( value ) { this.userData.shader.uniforms.normalMap2.value = value; }
            });

        } else {

            this.material.onBeforeCompile = function ( shader ) {

                var fragment = shader.fragmentShader;

                fragment = fragment.replace( '#include <alphamap_fragment>', T.alphamap );
           
                shader.fragmentShader = fragment;

            }

        }


        //THREE.Mesh.call( this, this.geometry, this.material );

       // super( this.geometry, this.material );

        if(o.debug){
            this.debugZone(o);
        }

        //root.garbage.push( this.geometry );
        

        if( this.wantBorder ) this.addBorder( o );
        if( this.wantBottom ) this.addBottom( o );

        if( o.pos ) this.position.fromArray( o.pos );


        // rotation is in degree or Quaternion
        o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
        if( o.rot !== undefined ){ o.quat = math.toQuatArray( o.rot ); delete o.rot; }
        //console.log(o.quat)
        this.quaternion.fromArray( o.quat )

        if( o.decal ) this.position.y += o.decal;

        this.castShadow = true
        this.receiveShadow = true

        Pool.set( 'terrain' + this.name, this.material, 'material', true );

        this.update()

    }

    getZid(){ // zone id

        this.zid = {}

        let lx = (this.sample[0] - this.sampleZ[0])*0.5
        let lz = (this.sample[1] - this.sampleZ[1])*0.5
        let first = (this.sample[0] * lz) + lx
        let line = 0
        for (let j = 0; j<this.lngZ; j++ ){
            //line = j % this.sampleZ[0];
            line = Math.floor(j / this.sampleZ[0]);
            this.zid[ first + j + (line*((lx*2))) ] = j
        }
    }

    debugZone(o) {

        this.geometryZ = new PlaneGeometry( this.sizeZ[0], this.sizeZ[2], this.sampleZ[0] - 1, this.sampleZ[1] - 1 );
        this.geometryZ.rotateX( -math.PI90 );
        this.verticesZ = this.geometryZ.attributes.position.array;
        
        const debuger = new Mesh( this.geometryZ, new MeshBasicMaterial({ color:0x000000, wireframe:true, transparent:true, opacity:0.1 } ));
        //if( o.pos ) debuger.position.fromArray( o.pos );
        this.add( debuger );

    }

    mapcallback (){

        this.mapN++
        if( this.mapN == this.mapMax ){ 
           // this.material.needsUpdate = true;
            this.callback()
        }

    }

    addBottom ( o ){

    	var geometry = new PlaneGeometry( this.size[0], this.size[2], 1, 1 );
        geometry.rotateX( math.PI90 );
        

        this.bottomMesh = new Mesh( geometry, this.borderMaterial );

        this.add( this.bottomMesh );

        this.isBottom = true;
    }

    addBorder ( o ){

    	this.borderMaterial = new MeshStandardMaterial({ 

    		vertexColors: true, 
    		metalness: this.isWater ? 0.8 : 0.4, 
       		roughness: this.isWater ? 0.2 : 0.6, 
       
            //envMap: view.getEnvMap(),
            //normalMap:this.wn,
            normalScale:this.isWater ?  [0.25,0.25]:[2,2],
            transparent:this.isWater ? true : false,
            opacity: this.isWater ? (o.opacity || 0.8) : 1,
            envMap: o.envmap || null, 

    		//shadowSide : false

    	});

    	//view.getMat()[this.name+'border'] = this.borderMaterial;

        var front = new PlaneGeometry( this.size[0], 2, this.sample[0] - 1, 1 );
        var back = new PlaneGeometry( this.size[0], 2, this.sample[0] - 1, 1 );
        var left = new PlaneGeometry( this.size[2], 2, this.sample[1] - 1, 1 );
        var right = new PlaneGeometry( this.size[2], 2, this.sample[1] - 1, 1 );

        front.translate( 0,1, this.size[2]*0.5);
        back.rotateY( -math.Pi );
        back.translate( 0,1, -this.size[2]*0.5);
        left.rotateY( -math.PI90 );
        left.translate( -this.size[0]*0.5,1, 0);
        right.rotateY( math.PI90 );
        right.translate( this.size[0]*0.5,1, 0);

        this.borderGeometry = mergeVertices( mergeGeometries( [ front, back, left, right ] ) );
        this.borderVertices = this.borderGeometry.attributes.position.array;
        this.lng2 = this.borderVertices.length / 3;
        this.list = new Array( this.lng2 )
        this.borderColors = new Float32Array( this.lng * 3 );
        this.borderGeometry.setAttribute( 'color', new BufferAttribute( this.borderColors, 3 ) );
        this.borderMesh = new Mesh( this.borderGeometry, this.borderMaterial );

        var j = this.lng2, n, i;
        while(j--){
            n = j*3;
            i = this.borderVertices[n+1] > 0 ? this.findPoint( this.borderVertices[n], this.borderVertices[n+2] ) : -1;
            this.list[j] = i;

        }

        this.add( this.borderMesh );

        this.borderMesh.castShadow = true;
        this.borderMesh.receiveShadow = true;

        this.isBorder = true;

    }

    dispose () {

        if(this.isBottom){
            this.remove( this.bottomMesh );
            this.bottomMesh.geometry.dispose();
        }

        if(this.isBorder){
            this.remove( this.borderMesh );
            this.borderMesh.geometry.dispose();
            this.borderMesh.material.dispose();
        }

        this.geometry.dispose();
        this.material.dispose();
        for(let t in this.txt) this.txt[t].dispose()
        
    }

    easing ( key, azimuthal, wait ) {

        //var key = user.key;
        if( key[0]===0 && key[1]===0 ) return;

        //if( !key[0] || !key[1] ) return;

        var r = azimuthal || 0;//view.getAzimuthal();

        if( key[7] ) this.maxspeed = 1.5;
        else this.maxspeed = 0.25;

        //acceleration
        this.ease.y += key[1] * this.acc; // up down
        this.ease.x += key[0] * this.acc; // left right
        //speed limite
        this.ease.x = this.ease.x > this.maxspeed ? this.maxspeed : this.ease.x;
        this.ease.x = this.ease.x < -this.maxspeed ? -this.maxspeed : this.ease.x;
        this.ease.y = this.ease.y > this.maxspeed ? this.maxspeed : this.ease.y;
        this.ease.y = this.ease.y < -this.maxspeed ? -this.maxspeed : this.ease.y;

        //break
        if (!key[1]) {
            if (this.ease.y > this.dec) this.ease.y -= this.dec;
            else if (this.ease.y < -this.dec) this.ease.y += this.dec;
            else this.ease.y = 0;
        }
        if (!key[0]) {
            if (this.ease.x > this.dec) this.ease.x -= this.dec;
            else if (this.ease.x < -this.dec) this.ease.x += this.dec;
            else this.ease.x = 0;
        }

        if ( !this.ease.x && !this.ease.y ) return;

        this.local.z += Math.sin(r) * this.ease.x + Math.cos(r) * this.ease.y;
        this.local.x += Math.cos(r) * this.ease.x - Math.sin(r) * this.ease.y;

        this.update( wait );

    }

    

    getTri (){

        return this.geometry


    }

    getHeight ( x, z ) {



        x *= this.rx;
        z *= this.rz; 
        x += this.sample[0]*0.5;
        z += this.sample[1]*0.5;

        //this.pv.set( x, 0, z ).applyAxisAngle( {x:0, y:1, z:0}, -math.PI90 )

        /*if( this.isTurn ){
            x = Math.floor(-z);
            z = Math.floor(x);
        }else {*/
            x = Math.floor(x);
            z = Math.floor(z);
        //}

        
        
        var h = this.isTurn ? this.height[ this.findId2( x, z ) ] : this.height[ this.findId( x, z ) ];
        return ( h * this.size[ 1 ] ) + this.position.y;

    }

    findIdZ( x, z ){

        return x+(z*this.sampleZ[1]) //|| 1;

    }

    findId( x, z ){

        return x+(z*this.sample[1]) //|| 1;

    }

    findId2( x, z ){

        return z+(-x*this.sample[0]) || 1;

    }

    /*findId3( x, z ){

        return z+(x*this.sample[0]) //|| 1;

    }*/

    findPoint( x, z ){

        var i = this.lng, n;
        while( i-- ){
            n = i * 3;
            if( this.vertices[ n ] === x && this.vertices[ n + 2 ] === z ) return i;
        }

        return -1;

    }

    getReverseID () {

        this.invId = [];

        let i = this.lngZ, n, x, z
        const sz = this.sampleZ[1] - 1;
        const sx = this.sampleZ[0] - 1;

        while(i--){

            x = i % this.sampleZ[0];
            z = Math.floor( i * this.ratioZ );
            if( this.isReverse ) z = sz - z;
            //xr = sx - x;
            //this.invId[i] = this.findId( x, sz - z )//
            this.invId[i] = this.isTurned ?  (this.lngZ-1)-this.findIdZ( z, x ) : this.findIdZ( x, z );

            //console.log(i, this.findId( x, sz - z ), (this.lng-1)-this.findId( z, x ))
        }

    }

    set( o ) {

        if( o.ease ) this.easing( o.key, o.azimut )
        if( o.decal ) this.decal( o.decal, true )

    }

    decal( v, wait ){

        this.local.x += v[0]
        this.local.y += v[1]
        this.local.z += v[2]
        this.update( wait );

    }

    updateUv () {

        if( this.isWater ){ 
            this.material.normalMap.offset.x+=0.002;
            this.material.normalMap.offset.y+=0.001;
        } else {
            let v = { x: this.local.x * this.ruvx, y: this.local.z * this.ruvy };
            if(this.material.map) this.material.map.offset.copy(v)
            if(this.material.normalMap) this.material.normalMap.offset.copy(v)
            
        }

    }

    distance ( a, b ) {

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt( dx * dx + dy * dy );

    }

    clamp ( v, min = 0, max = 1 ) {
        v = v < min ? min : v;
        v = v > max ? max : v;
        return v;
    }

    update ( wait ) {

        let v = this.pp;
        let cc = [1,1,1];
        let i = this.lng, n, nz, x, z,  c, l=0, id, result, idz;
        let oldz, oldh, ccY, ccc, ee;
        let mm = 0, mi=0

        while( i-- ){


            n = i * 3;
            x = i % this.sample[0];
            z = Math.floor( i * this.ratio );

            v.set( x + ( this.local.x*this.rx ), this.local.y, z + ( this.local.z*this.rz ) );

            c = math.noise( v, this.data );

            if( this.isIsland ){

                let d = 1-(this.distance({x:x, y:z},{x:(this.sample[0]-1)*0.5, y:(this.sample[1]-1)*0.5} )/((this.sample[0]-1)*0.5) )
                d *= 4;
                d = this.clamp(d);
                //console.log(d)
                c *= d;

            }



            //c = Math.quinticSCurve(c);
            //c = Math.cubicSCurve(c)
            //c = Math.linear(c,0.2, 1);
            //c = Math.clamp(c,0.2,1)

            c = Math.pow( c, this.data.expo );
            c = this.clamp(c);

            
            
            
            if( this.ttype === 'road' ) {

                if(oldz === z){
                    if(x===1 || x===2 || x===29 || x===30) c = oldh + 0.1;
                    else c = oldh;
                } else { 
                    oldz = z;
                    oldh = c;
                }

                //console.log(x)
            }

            this.height[ i ] = c;

            ccY = (c * this.size[ 1 ]) + this.deep;
            this.vertices[ n + 1 ] = ccY;

            //id = this.changeId ? this.invId[i] : i;
            result = this.isAbsolute ? c : c * this.size[1];

            if( this.zid[ i ] !== undefined ){
                idz = this.zid[ i ]
                id = this.changeId ? this.invId[idz] : idz;

                 // for physics
                this.heightData[ id ] = result;

                // for debug
                if(this.verticesZ) this.verticesZ[ ( idz * 3 ) + 1 ] = ccY

            }

            // for physics
            //this.heightData[ id ] = result;

            

            

            if( this.isWater ){

                cc = [ c * this.colorBase.r, c * this.colorBase.g, c * this.colorBase.b ];

            } else {

                cc = [ c, 0, 0];

            }

            //ccc = math.clamp(cc[0]+0.25, 0.25, 1)
            ccc = cc[0]

            //if(ccc>mm) mm = ccc
            //if(ccc<mi) mi = ccc

            

            this.colors[ n ] = ccc;
            this.colors[ n + 1 ] = ccc;
            this.colors[ n + 2 ] = ccc;
            //oldx = x;
            

        }

        //console.log(mm, mi)


        if( this.isBorder ){

            let j = this.lng2, h;
            while(j--){
                n = j*3;
                if(this.list[j]!==-1){
                    h = this.height[ this.list[j] ];
                    this.borderVertices[n+1] = (h * this.size[1]) + this.deep;
                    ccc = math.clamp(h+0.25, 0.25, 1)
                    ee = (0.5 + h+0.5);
                    ee = ee > 1 ? 1 : ee;
                    ee = ee < 0.5 ? 0.5 : ee;
                    this.borderColors[n] = ccc //* this.colorBase.r;//h * this.colorBase.r//ee;
                    this.borderColors[n+1] = ccc //* this.colorBase.g;// h * this.colorBase.g//ee*0.5;
                    this.borderColors[n+2] = ccc //* this.colorBase.b;// h * this.colorBase.b//ee*0.3;

                } else{
                    this.borderColors[n] = this.colorBase.r//0.5;
                    this.borderColors[n+1] = this.colorBase.g//0.25;
                    this.borderColors[n+2] = this.colorBase.b//0.15;
                }
            }

        }

        if( wait ) this.needUpdate = true
        else this.updateGeometry();

        

        if( this.ready ) this.physicsUpdate( this.name, this.heightData )

        this.ready = true;

        //if( phy ) root.view.update( { name:'terra', heightData:this.heightData, sample:this.sample } );

    }

    step (n) {

        if( !this.needUpdate ) return
        this.updateGeometry()
        this.needUpdate = false
        
    }

    updateGeometry () {

        this.geometry.attributes.position.needsUpdate = true;
        this.geometry.attributes.color.needsUpdate = true;
        this.geometry.computeVertexNormals();

        this.updateUv()

        if(this.geometryZ) this.geometryZ.attributes.position.needsUpdate = true;

        if( this.isBorder ){
        	this.borderGeometry.attributes.position.needsUpdate = true;
            this.borderGeometry.attributes.color.needsUpdate = true;
        }

    }

}

// SHADERS

// about no tiles
// https://iquilezles.org/articles/texturerepetition/

const TerrainShader = {

    fragmentAdd : /* glsl */`
        uniform vec4 clevels;
        uniform float randomUv;

        uniform sampler2D noise;

        uniform sampler2D normalMap1;
        uniform sampler2D normalMap2;

        uniform sampler2D roughnessMap1;
        uniform sampler2D roughnessMap2;

        uniform float aoMapIntensity;
        uniform sampler2D map1;
        uniform sampler2D map2;

        vec4 textureMAP( sampler2D mapper, in vec2 uv ){
            if( randomUv == 1.0 ) return textureNoTile( mapper, uv );
            else return texture2D( mapper, uv );
        }

        vec4 MappingMix( float slope, vec4 level, vec4 rocks, vec4 grasss, vec4 sands ){
            vec4 cc = rocks;
            if (slope < level.x) cc = grasss;
            if (slope < level.z) cc = sands;
            if (slope == 0.0 ) cc = sands;
            //if (( slope < level.x ) && (slope >= level.y)) cc = mix( grasss , rocks, (slope - level.y) * (1. / (level.x - level.y)));
            //if (( slope < level.y ) && (slope >= level.z)) cc = mix( sands , grasss, (slope - level.z) * (1. / (level.y - level.z)));

            float d = level.y;
            float rx = 1.0/level.y;

            if (( slope < level.x + d ) && (slope > level.x)) cc = mix( grasss , rocks, ( slope - (level.x) ) * rx );

            d = level.w;
            rx = 1.0/level.w;
            if (( slope < level.z + d ) && (slope > level.z )) cc = mix( sands , grasss, ( slope - (level.z) ) * rx );

            //cc = mix( grasss, cc, smoothstep(0.0,1.0, slope)*20.0 );
            return cc;
        }
    `,

    // roughnessmap_fragment

    rough : /* glsl */`
        float roughnessFactor = roughness;
        float metalnessFactor = metalness;
        #ifdef USE_ROUGHNESSMAP

            vec4 sandR = textureMAP( roughnessMap, vRoughnessMapUv );
            vec4 grassR = textureMAP( roughnessMap1, vRoughnessMapUv );
            vec4 rockR = textureMAP( roughnessMap2, vRoughnessMapUv );

            vec4 baseColorR = MappingMix( vColor.r, clevels, rockR, grassR, sandR );
            // reads channel G, compatible with a combined OcclusionRoughnessMetallic (RGB) texture
            float ambientOcclusion =( baseColorR.r - 1.0 ) * aoMapIntensity + 1.0;
            roughnessFactor *= baseColorR.g;
            metalnessFactor *= baseColorR.b;
        #endif
    `,

    // aomap_fragment

    ao : /* glsl */`
        reflectedLight.indirectDiffuse *= ambientOcclusion;
        #if defined( USE_ENVMAP ) && defined( STANDARD )
            float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
            reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.specularRoughness );
        #endif
    `,

    // map_fragment.glsl

    map : /* glsl */`
        #ifdef USE_MAP

            vec4 sand = textureMAP( map, vMapUv );
            vec4 grass = textureMAP( map1, vMapUv );
            vec4 rock = textureMAP( map2, vMapUv ); 

            vec4 sampledDiffuseColor = MappingMix(vColor.r, clevels, rock, grass, sand);

            diffuseColor *= sampledDiffuseColor;

        #endif
    `,

    // normal_fragment_maps

    normal : /* glsl */`

        #ifdef USE_NORMALMAP_OBJECTSPACE

            normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

            #ifdef FLIP_SIDED

                normal = - normal;

            #endif

            #ifdef DOUBLE_SIDED

                normal = normal * faceDirection;

            #endif

            normal = normalize( normalMatrix * normal );

        #elif defined( USE_NORMALMAP_TANGENTSPACE )

            vec4 sandN = textureMAP( normalMap, vNormalMapUv );
            vec4 grassN = textureMAP( normalMap1, vNormalMapUv );
            vec4 rockN = textureMAP( normalMap2, vNormalMapUv );
            vec3 mapN = MappingMix(vColor.r, clevels, rockN, grassN, sandN).xyz * 2.0 - 1.0;

            ///vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;

            mapN.xy *= normalScale;
            normal = normalize( tbn * mapN );

        #elif defined( USE_BUMPMAP )

            normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

        #endif
    `,

    normal2 : /* glsl */`

        #ifdef OBJECTSPACE_NORMALMAP

            normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0; // overrides both flatShading and attribute normals

            #ifdef FLIP_SIDED

                normal = - normal;

            #endif

            #ifdef DOUBLE_SIDED

                normal = normal * faceDirection;

            #endif

            normal = normalize( normalMatrix * normal );

        #elif defined( TANGENTSPACE_NORMALMAP )

            vec4 sandN = textureMAP( normalMap, vNormalMapUv );
            vec4 grassN = textureMAP( normalMap1, vNormalMapUv );
            vec4 rockN = textureMAP( normalMap2, vNormalMapUv );

            vec3 mapN = MappingMix(vColor.r, clevels, rockN, grassN, sandN).xyz * 2.0 - 1.0;

            //vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
            mapN.xy *= normalScale;

            normal = normalize( tbn * mapN );

        #elif defined( USE_BUMPMAP )

            normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );

        #endif
    `,

    alphamap : /* glsl */`
        #ifdef USE_ALPHAMAP
            diffuseColor.a = opacity +( texture2D( alphaMap, vAlphaMapUv ).g * opacity) * (1.0-opacity);
        #endif
    `,
    
}