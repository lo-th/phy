import {
	Vector3, Float32BufferAttribute,Vector4, Matrix4
} from 'three';


export class Tension {

	constructor( origin, target ) {


		this.target = target || origin;

		this.baseGeometry = origin.geometry;
		this.geometry = this.target.geometry;

		this.V = [ new Vector3(), new Vector3(), new Vector3() ];
		this.X = [ new Vector4(), new Vector4(), new Matrix4() ];
		this.M = [ new Vector3(), new Vector3(), new Vector3() ];

		this.isMorph = this.target.morphTargetInfluences ? true : false;
		this.isSkin = this.target.isSkinnedMesh ? true : false;

		this.init();

	}

	init(){

		if( this.geometry.attributes.position.count !== this.baseGeometry.attributes.position.count ){
			console.log('object not have same number of vertices !!')
			return
		}

		this.length = this.baseGeometry.attributes.position.count;
		this.indexLength = this.baseGeometry.index.count / 3 ;

		//console.log( this.length, this.indexLength )
		

		this.originEdges = new Array(this.length).fill(0);
		this.targetEdges = new Array(this.length).fill(0);

		if( this.isSkin || this.isMorph) this.back = new Array( this.length * 3 ).fill(0);
		this.num = new Array( this.length ).fill(0);

		this.getEdge( this.baseGeometry, this.originEdges );
		this.addColor();

		setTimeout( this.start.bind(this), 100 );

	}

	start(){
		this.ready = true;
		this.update()
	}

	addColor(){

		const g = this.geometry
		//if( g.attributes.color ) return;
		let lng = g.attributes.position.array.length;
		g.setAttribute( 'color', new Float32BufferAttribute( new Array(lng).fill(0), 3 ) );

	}

	resetEdge( edges )
	{
		let j = edges.length
		while(j--) edges[j] = 0
	}

	getEdge( g, edges, isSkin = false, isMorph = false ) 
	{
		let positions = g.attributes.position.array;
		const indices = g.index.array;
		let vA = this.V[0], vB = this.V[1], vC = this.V[2];
		let j, i=0, a, b, c, ab, ac, bc, si, sy;

		if( isMorph ) positions = this.getMorph();
		if( isSkin ) positions = this.getSkinned( positions );
		if( isSkin || isMorph ) this.resetEdge( edges );
		
		j = this.indexLength;

		while( j-- )
		{
		    a = indices[i];
		    b = indices[i+1];
		    c = indices[i+2];
		    vA.fromArray( positions, a * 3 );
		    vB.fromArray( positions, b * 3 );
		    vC.fromArray( positions, c * 3 );

		    ab = vA.distanceTo(vB);
		    ac = vA.distanceTo(vC);
		    bc = vB.distanceTo(vC);
	    
		    
		    edges[a] += (ab + ac)*0.5;
			edges[b] += (ab + bc)*0.5;
			edges[c] += (ac + bc)*0.5;
			
			/*
			edges[a] += (ab + ac);
			edges[b] += (ab + bc);
			edges[c] += (ac + bc);

			num[a] += 2;
			num[b] += 2;
			num[c] += 2;
			*/

			i+=3;
		}

		//j = this.length;
		//while( j-- ){ edges[j] /= num[j]; }
	}

	isZero(v){

		if(v.x===0 && v.y===0 && v.z ===0 ) return true
		return false

	}

	getMorph()
	{
		const morphInfluences = this.target.morphTargetInfluences;
		const morphRef = this.geometry.morphAttributes.position
		const morphsMax = morphInfluences.length
		const position = this.geometry.attributes.position.array;
		let lng = this.geometry.attributes.position.count, id, i, j;
		let vertex = this.M[0];
		let base = this.M[1];
		let temp = this.M[2];
		let relative = this.geometry.morphTargetsRelative
		let data;

		 // the following code section is normally implemented in the vertex shader

		i = lng;
	    while(i--)
	    {
			id = i*3;
			base.fromArray( position, id )
			vertex.set( 0,0,0 )
			j = morphsMax;
			while(j--){

				if ( morphInfluences[ j ] != 0.0 ){
					data =  morphRef[j].data ? morphRef[j].data.array : morphRef[j].array
					if( relative ) vertex.addScaledVector( temp.fromArray( data, id ), morphInfluences[ j ] );
					else vertex.addScaledVector( temp.fromArray( data, id ).sub(base), morphInfluences[ j ] );
				}

			}
			base.add( vertex )
			base.toArray( this.back, id )
		}
		return this.back

	}

	getSkinned( position )
	{

		const skeleton = this.target.skeleton;
	    const boneMatrices = skeleton.boneMatrices;
	    const geometry = this.geometry;
	    //const position = geometry.attributes.position.array;
	    const skinIndex = geometry.attributes.skinIndex.array;
	    const skinWeigth = geometry.attributes.skinWeight.array;

	    const bindMatrix = this.target.bindMatrix;
	    const bindMatrixInverse = this.target.bindMatrixInverse;

	    let vertex = this.V[0];
	    let skin = this.V[1];
	    let temp = this.V[2];
	    let skinIndices = this.X[0];
	    let skinWeights = this.X[1];
	    let boneMatrix = this.X[2];

	    let lng = geometry.attributes.position.count
	    let i, j, boneIndex, weight, id;

	    // the following code section is normally implemented in the vertex shader
	    i = lng;
	    while(i--)
	    {
			id = i*3;
            skinIndices.fromArray( skinIndex, i*4 );
            skinWeights.fromArray( skinWeigth, i*4 );
            vertex.fromArray( position, id ).applyMatrix4( bindMatrix ); // transform to bind space
            skin.set( 0, 0, 0 );
            j = 4;
            while(j--)
            {
                weight = skinWeights.getComponent( j );
                if ( weight > 0 ) {
                	boneIndex = skinIndices.getComponent( j );
	                boneMatrix.multiplyMatrices( skeleton.bones[ boneIndex ].matrixWorld, skeleton.boneInverses[ boneIndex ] );
	                // weighted vertex transformation
	                skin.addScaledVector( temp.copy( vertex ).applyMatrix4( boneMatrix ), weight );
	            }

            }

            skin.applyMatrix4( bindMatrixInverse ) // back to local space
            skin.toArray( this.back, id )
        }
        return this.back
	}

	update() 
	{

		if(!this.ready) return

		this.getEdge( this.geometry, this.targetEdges, this.isSkin, this.isMorph );
		const color = this.geometry.attributes.color.array;
		let o, t, delta, n, i = this.length;

		while( i-- )
		{
			o = this.originEdges[i];
			delta = ( ( o - this.targetEdges[i] ) / o ) + 0.5;
			n = i*3;
			color[n] = delta > 0.5 ? (delta-0.5)*2 : 0;
			color[n+1] = 0;
			color[n+2] = delta < 0.5 ? (1-(delta*2)) : 0;
		}
		this.geometry.attributes.color.needsUpdate = true;
	}

}