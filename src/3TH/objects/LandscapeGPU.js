import {
    Mesh,
    PlaneGeometry,
    BufferAttribute,
    Vector3,
    Vector4,
    Quaternion,
    DoubleSide,
    MeshPhysicalMaterial,
    MeshStandardMaterial
} from 'three';

import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { math } from '../math.js';
import { Pool } from '../Pool.js';

// Imports TSL (Three.js Shading Language)
import {
    NodeMaterial,
    position,
    uv,
    color,
    texture,
    attribute,
    uniform,
    vec2,
    vec3,
    vec4,
    float,
    step,
    mix,
    smoothstep,
    dFdx,
    dFdy,
    textureSampleGrad,
    normalLocal,
    normalGeometry,
    transformDirection,
    normalView,
    normalMatrix,
    inverseTransformDirection,
    saturate,
    dot,
    normalize,
    fract,
    floor,
    sin,
    abs,
    PI,
    PI2
} from 'three/tsl';

export class Landscape extends Mesh {

    constructor( o = {} ) {

        super();

        this.ready = false;
        this.needUpdate = false;

        this.type = 'terrain';
        this.name = o.name;

        this.folder = o.folder || './assets/textures/terrain/'

        this.mapN = 0;
        this.mapMax = 7;

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

        let square = [this.size[0]/sx, this.size[2]/sz];
        this.sampleZ = [o.sample[0] * this.zone, o.sample[1] * this.zone];
        this.sizeZ = [(this.sampleZ[0]-1) * square[0], o.size[1], ((this.sampleZ[1]-1)) * square[1]];

        this.lng = this.sample[0] * this.sample[1];
        this.lngZ = this.sampleZ[0] * this.sampleZ[1];

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

        this.colorBase = this.isWater ? { r:0, g:0.7, b:1 } : { r:0.25, g:0.25, b:0.25 };

        this.maxspeed = o.maxSpeed || 0.1;
        this.acc = o.acc == undefined ? 0.01 : o.acc;
        this.dec = o.dec == undefined ? 0.01 : o.dec;

        this.deep = o.deep == undefined ? 0 : o.deep;

        this.ease = new Vector2();

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

        this.isAbsolute = o.isAbsolute || false;
        this.isTurned = o.isTurned || false;
        this.isReverse = o.isReverse || false;

        this.changeId = this.isReverse || this.isTurned;

        if( this.changeId ) this.getReverseID();

        this.colors = new Float32Array( this.lng * 3 );
        this.geometry = new PlaneGeometry( this.size[0], this.size[2], this.sample[0] - 1, this.sample[1] - 1 );
        this.geometry.rotateX( -math.PI90 );

        this.geometry.setAttribute( 'color', new BufferAttribute( this.colors, 3 ) );
        this.vertices = this.geometry.attributes.position.array;

        // --- Chargement des textures ---
        var isORM = false;
        var clevels = new Vector4( 0.5, 0.5, 0.1, 0.2 );
        if( o.maplevels ) clevels.fromArray( o.maplevels );
        
        var maps = o.maps || [ 'sand', 'grass3', 'rock' ], txt = {};
        var name;

        if(this.isWater) maps = ['water'];

        for( let i in maps ){
            name = maps[i]
            txt[name+'_c'] = Pool.texture({ url:this.folder + name +'_c.jpg', flip:false, repeat:this.uvx, encoding:o.encoding || true , callback: this.mapcallback.bind(this)  });
            txt[name+'_n'] = Pool.texture({ url:this.folder + name +'_n.jpg', flip:false, repeat:this.uvx, callback: this.mapcallback.bind(this) });
        }
        txt['noise'] = Pool.texture({ url:this.folder + 'noise.png', flip:false, repeat:[1,1], encoding:false , callback: this.mapcallback.bind(this)  });

        this.txt = txt;

        // --- Création du NodeMaterial (TSL) ---
        this.material = this._createTSLMaterial(clevels, maps, txt, o, isORM);

        if( o.debug){
            this.debugZone(o);
        }

        if( this.wantBorder ) this.addBorder( o );
        if( this.wantBottom ) this.addBottom( o );

        if( o.pos ) this.position.fromArray( o.pos );

        o.quat = o.quat === undefined ? [ 0, 0, 0, 1 ] : o.quat;
        if( o.rot !== undefined ){ o.quat = math.toQuatArray( o.rot ); delete o.rot; }
        this.quaternion.fromArray( o.quat )

        if( o.decal ) this.position.y += o.decal;

        this.castShadow = true
        this.receiveShadow = true

        Pool.set( 'terrain' + this.name, this.material, 'material', true );

        this.update()

    }

    /**
     * Crée le NodeMaterial avec la logique TSL équivalente aux shaders GLSL originaux.
     */
    _createTSLMaterial(clevels, maps, txt, o, isORM) {
        const material = new NodeMaterial();
        
        // Configuration de base
        material.name = 'terrain';
        material.vertexColors = true;
        material.metalness = this.isWater ? 0.9 : (o.metalness || 0.1);
        material.roughness = this.isWater ? 0.1 : (o.roughness || 0.8);
        
        if (this.isWater) {
            material.transparent = true;
            material.opacity = o.opacity || 0.4;
            material.side = DoubleSide;
            // Alpha map logic handled in fragment node if needed, or via material.alphaMap
        }

        // --- Uniformes ---
        const clevelsUniform = uniform( clevels );
        const mapUniform = uniform( txt[maps[0]+'_c'] );
        const map1Uniform = uniform( txt[maps[1] ? maps[1]+'_c' : maps[0]+'_c'] ); // Fallback
        const map2Uniform = uniform( txt[maps[2] ? maps[2]+'_c' : maps[0]+'_c'] ); // Fallback
        
        const normalMapUniform = uniform( txt[maps[0]+'_n'] );
        const normalMap1Uniform = uniform( txt[maps[1] ? maps[1]+'_n' : maps[0]+'_n'] );
        const normalMap2Uniform = uniform( txt[maps[2] ? maps[2]+'_n' : maps[0]+'_n'] );
        
        const noiseMapUniform = uniform( txt['noise'] );
        const useNoiseMapUniform = uniform( 1.0 ); // Equivalent to uniforms['useNoiseMap']
        const randomUvUniform = uniform( 1.0 );    // Equivalent to uniforms['randomUv']

        // --- Nœuds TSL ---
        
        // 1. Accès aux données vertex
        const vColor = attribute('color');
        const slope = vColor.r; // La hauteur/niveau est stockée dans le canal R de la couleur vertex

        // 2. Fonction textureNoTile (Traduction TSL)
        const textureNoTile = (sampler, uvCoord) => {
            // k = noise
            const kNode = useNoiseMapUniform.equals(1.0) 
                ? textureSample(noiseMapUniform, uvCoord.mul(0.005)).r 
                : directNoiseTSL(uvCoord); // Fonction helper définie plus bas

            // index
            const index = kNode.mul(8.0);
            const f = fract(index);
            const ia = floor(index);
            const ib = ia.add(1.0);

            // Offsets
            const offa = sin(vec2(3.0, 7.0).mul(ia));
            const offb = sin(vec2(3.0, 7.0).mul(ib));

            // Dérivées
            const dx = dFdx(uvCoord);
            const dy = dFdy(uvCoord);

            // Échantillonnage
            const cola = textureSampleGrad(sampler, uvCoord.add(offa), dx, dy);
            const colb = textureSampleGrad(sampler, uvCoord.add(offb), dx, dy);

            // Mix
            const diff = cola.sub(colb);
            const sumDiff = diff.r.add(diff.g).add(diff.b); // Approximation de sum()
            const mixVal = smoothstep(0.2, 0.8, f.sub(0.1).mul(sumDiff));

            return mix(cola, colb, mixVal);
        };

        // 3. Fonction d'échantillonnage conditionnelle
        const getTextureSample = (sampler, uvCoord) => {
            return randomUvUniform.equals(1.0) ? textureNoTile(sampler, uvCoord) : textureSample(sampler, uvCoord);
        };

        // 4. Logique MappingMix (Mélange des textures selon la pente/hauteur)
        // Logique originale:
        // cc = rock (map2)
        // if slope < level.x -> grass (map1)
        // if slope < level.z -> sand (map0)
        // + lissages

        const levelX = clevelsUniform.x;
        const levelZ = clevelsUniform.z;
        const levelY = clevelsUniform.y; // Utilisé pour le lissage dans l'original

        // Échantillonnage de base
        const sandTex = getTextureSample(mapUniform, uv());
        const grassTex = getTextureSample(map1Uniform, uv());
        const rockTex = getTextureSample(map2Uniform, uv());

        // Logique de sélection
        // On utilise step pour créer des masques
        // isGrass = 1 si slope < levelX
        const isGrass = step(slope, levelX);
        // isSand = 1 si slope < levelZ
        
        // Mélange Rock <-> Grass
        // Transition autour de levelX
        const rockGrassMix = mix(grassTex, rockTex, smoothstep(levelX - levelY, levelX + levelY, slope));
        
        // Mélange Sand <-> (Resultat precedent)
        // Transition autour de levelZ
        const finalDiffuse = mix(sandTex, rockGrassMix, smoothstep(levelZ - levelY, levelZ + levelY, slope));

        // Application de la couleur finale
        material.fragmentNode = finalDiffuse;

        // --- Normales (TSL) ---
        // Logique similaire pour les normales
        const sandNorm = getTextureSample(normalMapUniform, uv());
        const grassNorm = getTextureSample(normalMap1Uniform, uv());
        const rockNorm = getTextureSample(normalMap2Uniform, uv());

        // Mélange des normales
        const rockGrassNormMix = mix(grassNorm, rockNorm, smoothstep(levelX - levelY, levelX + levelY, slope));
        const finalNormalTex = mix(sandNorm, rockGrassNormMix, smoothstep(levelZ - levelY, levelZ + levelY, slope));

        // Conversion Tangent Space -> Object Space (simplifié pour l'exemple, 
        // idéalement on utilise normalMapNode de Three.js si on veut utiliser les fonctionnalités built-in)
        // Ici on injecte directement dans le flux de normales si on veut un contrôle total,
        // mais pour MeshPhysicalMaterial/NodeMaterial, il est souvent préférable d'utiliser les slots.
        
        // Pour cette conversion, nous allons assigner le material.fragmentNode comme fait ci-dessus.
        // Pour les normales, on peut utiliser material.normalMapNode si on veut rester dans le pipeline standard.
        // Cependant, la logique originale modifiait <normal_fragment_maps>.
        
        // Approche hybride : On laisse le NodeMaterial gérer les normales standard, 
        // mais on pourrait assigner material.normalMapNode = finalNormalTex si on ajustait l'espace.
        // Pour simplifier et coller au code original qui faisait du tangent space, 
        // on va supposer que les textures de normales sont standards.
        
        material.normalMap = txt[maps[0]+'_n']; // Fallback standard
        // Si vous voulez appliquer le mélange TSL aux normales, il faut construire un NormalMaterialNode complexe.
        // Pour l'instant, on garde la couleur diffusée dynamique.

        return material;
    }

    getZid(){ // zone id
        this.zid = {}
        let lx = (this.sample[0] - this.sampleZ[0])*0.5
        let lz = (this.sample[1] - this.sampleZ[1])*0.5
        let first = (this.sample[0] * lz) + lx
        let line = 0
        for (let j = 0; j<this.lngZ; j++ ){
            line = Math.floor(j / this.sampleZ[0]);
            this.zid[ first + j + (line*((lx*2))) ] = j
        }
    }

    debugZone(o) {
        this.geometryZ = new PlaneGeometry( this.sizeZ[0], this.sizeZ[2], this.sampleZ[0] - 1, this.sampleZ[1] - 1 );
        this.geometryZ.rotateX( -math.PI90 );
        this.verticesZ = this.geometryZ.attributes.position.array;
        
        const debuger = new Mesh( this.geometryZ, new MeshStandardMaterial({ color:0xff9900, wireframe:true } ));
        this.add( debuger );
    }

    mapcallback (){
        this.mapN++
        if( this.mapN == this.mapMax ){ 
            this.callback()
        }
    }

    addBottom ( o ){
        var geometry = new PlaneGeometry( this.size[0], this.size[2], 1, 1 );
        geometry.rotateX( math.PI90 );
        this.bottomMesh = new Mesh( geometry, this.borderMaterial || new MeshStandardMaterial() );
        this.add( this.bottomMesh );
        this.isBottom = true;
    }

    addBorder ( o ){
        this.borderMaterial = new MeshStandardMaterial({ 
            vertexColors: true, 
            metalness: this.isWater ? 0.8 : 0.1, 
            roughness: this.isWater ? 0.2 : 0.8, 
            normalScale: this.isWater ? [0.25,0.25]:[2,2],
            transparent: this.isWater ? true : false,
            opacity: this.isWater ? (o.opacity || 0.8) : 1,
            envMap: o.envmap || null, 
        });

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
        if( key[0]===0 && key[1]===0 ) return;
        var r = azimuthal || 0;
        if( key[7] ) this.maxspeed = 1.5;
        else this.maxspeed = 0.25;

        this.ease.y += key[1] * this.acc;
        this.ease.x += key[0] * this.acc;

        this.ease.x = this.ease.x > this.maxspeed ? this.maxspeed : this.ease.x;
        this.ease.x = this.ease.x < -this.maxspeed ? -this.maxspeed : this.ease.x;
        this.ease.y = this.ease.y > this.maxspeed ? this.maxspeed : this.ease.y;
        this.ease.y = this.ease.y < -this.maxspeed ? -this.maxspeed : this.ease.y;

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

    getTri (){ return this.geometry }

    getHeight ( x, z ) {
        x *= this.rx;
        z *= this.rz; 
        x += this.sample[0]*0.5;
        z += this.sample[1]*0.5;
        x = Math.floor(x);
        z = Math.floor(z);
        var h = this.isTurn ? this.height[ this.findId2( x, z ) ] : this.height[ this.findId( x, z ) ];
        return ( h * this.size[ 1 ] ) + this.position.y;
    }

    findIdZ( x, z ){ return x+(z*this.sampleZ[1]) || 1; }
    findId( x, z ){ return x+(z*this.sample[1]) || 1; }
    findId2( x, z ){ return z+(-x*this.sample[0]) || 1; }

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
            this.invId[i] = this.isTurned ?  (this.lngZ-1)-this.findIdZ( z, x ) : this.findIdZ( x, z );
        }
    }

    set( o ) {
        if( o.ease ) this.easing( o.key, o.azimut )
        if( o.decal ) this.decal( o.decal, true )
        if( o.height ){ 
            this.size[ 1 ] = o.height;
            this.update( true )
        }
    }

    decal( v, wait ){
        this.local.x += v[0]
        this.local.y += v[1]
        this.local.z += v[2]
        this.update( wait );
    }

    updateUv () {
        if( this.isWater ){ 
            if(this.material.normalMap) {
                this.material.normalMap.offset.x+=0.002;
                this.material.normalMap.offset.y+=0.001;
            }
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
                c *= d;
            }

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
            }

            this.height[ i ] = c;
            ccY = (c * this.size[ 1 ]) + this.deep;
            this.vertices[ n + 1 ] = ccY;

            result = this.isAbsolute ? c : c * this.size[1];

            if( this.zid[ i ] !== undefined ){
                idz = this.zid[ i ]
                id = this.changeId ? this.invId[idz] : idz;
                this.heightData[ id ] = result;
                if(this.verticesZ) this.verticesZ[ ( idz * 3 ) + 1 ] = ccY
            }

            if( this.isWater ){
                cc = [ c * this.colorBase.r, c * this.colorBase.g, c * this.colorBase.b ];
            } else {
                cc = [ c, 0, 0];
            }

            ccc = cc[0]
            this.colors[ n ] = ccc;
            this.colors[ n + 1 ] = ccc;
            this.colors[ n + 2 ] = ccc;
        }

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
                    this.borderColors[n] = ccc;
                    this.borderColors[n+1] = ccc;
                    this.borderColors[n+2] = ccc;
                } else{
                    this.borderColors[n] = this.colorBase.r;
                    this.borderColors[n+1] = this.colorBase.g;
                    this.borderColors[n+2] = this.colorBase.b;
                }
            }
        }

        if( wait ) this.needUpdate = true
        else this.updateGeometry();

        if( this.ready ) this.physicsUpdate( this.name, this.heightData )
        this.ready = true;
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

// Helper TSL pour le bruit direct utilisé dans textureNoTile
function directNoiseTSL(p) {
    const ip = floor(p);
    const u = fract(p);
    const uSmooth = u.mul(u).mul(vec2(3.0).sub(u.mul(2.0)));
    
    // Fonction rand simulée (hash simple)
    const rand = (v) => fract(sin(dot(v, vec2(12.9898, 78.233))).mul(43758.5453));
    
    const res = mix(
        mix(rand(ip), rand(ip.add(vec2(1.0, 0.0))), uSmooth.x),
        mix(rand(ip.add(vec2(0.0, 1.0))), rand(ip.add(vec2(1.0, 1.0))), uSmooth.x),
        uSmooth.y
    );
    return res.mul(res);
}
