import { MathTool } from '../../core/MathTool.js';
import { BoxGeometry, Mesh, Vector3 } from 'three';

const tmp_Vector = new Vector3() 
//const SPHSystem_getNeighbors_dist = new Vector3()

// Temp vectors for calculation
const SPHSystem_update_dist = new Vector3() // Relative velocity

const SPHSystem_update_a_pressure = new Vector3()
const SPHSystem_update_a_visc = new Vector3()
const SPHSystem_update_gradW = new Vector3()
const SPHSystem_update_r_vec = new Vector3()
const SPHSystem_update_u = new Vector3()


export class SoftSolver {

	constructor ( o = {}, motor ) {

		this.first = true
		this.debug = o.debug || false;

		this.motor = motor;

		this.name = o.name  || 'ppp'

		this.pMass = o.pMass || 0.01;
		// visual size
		this.vSize = o.vSize || 0.16;//0.06;
		// physical size
		this.pSize = o.pSize || 0.02;

		this.particles = []
		/**
	     * Density of the system (kg/m3).
	     * default 1.0
	     */
	    this.density = o.density || 0.01
	    /**
	     * Distance below which two particles are considered to be neighbors.
	     * It should be adjusted so there are about 15-20 neighbor particles within this radius.
	     * default 1.0
	     */
	    this.smoothMulty = o.smoothMulty || 1
	    this.smoothing = o.smoothing || 0.2
	    this.smoothing*=this.smoothMulty
	    /**
	     * Speed Of Sound
	     * default 1
	     */
	    this.speed = o.speed || 0.1
	    
	    /**
	     * Viscosity of the system.
	     */
	    this.viscosity = o.viscosity || 0.03

	    this.eps = 0.000001

	    this.group = 1 << 8

	    // Stuff Computed per particle
	    this.pressures = []
	    this.densities = []
	    this.neighbors = []

	    this.maxDist = 0

	    this.tv = new Vector3()
	    this.tv2 = new Vector3()

	    if( o.mesh ) this.setMesh( o.mesh, o.crossEdge );

	}

	setMesh( mesh, crossLink = false ){

		const link = []
		const extralink = []

		this.mesh = mesh;
		this.geometry = mesh.geometry;

		const indices = this.geometry.getIndex();
        const positions = this.geometry.getAttribute( 'position' );
        const ar = positions.array

        const hash = MathTool.getHash(this.geometry);
        const faces = MathTool.getFaces(this.geometry);
        const connected = crossLink ? MathTool.getConnectedFaces(faces) : null

        //console.log(hash)
        //console.log(connected)

		//let g2 = MathTool.getHash(this.geometry);

		let p, j, k, n, f, a, b, c

		// add vertex position referency
		for(let m in hash){

			j = hash[m][0];
			//const k = indices ? indices.getX( j ) : j;
			n = j*3
			tmp_Vector.set( ar[n], ar[n+1], ar[n+2] )
			this.mesh.localToWorld(tmp_Vector)
			this.add(tmp_Vector.toArray());

		}

		for( let i=0; i<faces.length; i++ ){

			f = faces[i]
			a = this.getKey( hash, f[0] )
			b = this.getKey( hash, f[1] )
			c = this.getKey( hash, f[2] )
			

			if(!this.sameLink(link, a, b)) link.push([a,b])
			if(!this.sameLink(link, b, c)) link.push([b,c])
			if(!this.sameLink(link, c, a)) link.push([c,a])

		}

	    this.connect( link )

	    // extra link cross X

	    if(connected){
	    	for( let i=0; i<connected.length; i++ ){
	    	
		    	f = connected[i]
		    	a = this.getKey( hash, f[0] )
		    	b = this.getKey( hash, f[1] )
		    	if(!this.sameLink(link, a, b) && !this.sameLink(extralink, a, b)) extralink.push([a,b])

		    }

		    this.connect( extralink, true )
	    }

	    

	    this.hash = hash;

	    this.mesh.position.set(0,0,0)
		this.mesh.quaternion.set(0,0,0,1)
		this.mesh.receiveShadow = true;
		this.mesh.castShadow = true;
		phy.addDirect( this.mesh )

	}

	updateMesh(){

		if(!this.geometry) return;

		let h = this.hash
		let p = this.geometry.attributes.position.array;
		let i = this.particles.length, n, r, j
		while(i--){

			r = this.particles[i]
			j = h[i].length;

			while(j--){
				n = h[i][j]*3
				p[n] = r.position.x;
				p[n+1] = r.position.y;
				p[n+2] = r.position.z;
			}
		}

		this.geometry.attributes.position.needsUpdate = true;
        this.geometry.computeVertexNormals();
        this.geometry.computeBoundingSphere()

	}

	add( pos ){


		let p = this.motor.add({ 

            instance:this.name,
            type:'particle', 
            //type:'sphere',
            //flags:'noQuery',
            size:[this.vSize],
            pSize:this.pSize,
            pos:pos, 

            inertia:[0,0,0], 
            //inertia:[0.00001,0.00001,0.00001], 
            //iterations:[10,1],
            
            mass:this.pMass,
            //density:0.0000001,
            restitution:0.0, 
            friction:0.5, 
            //maxVelocity:[2,100],
            damping:[0.2,0.1],

            //group:this.group, 
            //mask:1|2,
            material:this.debug ? 'particle':'hide',
            //maxVelocity:[1,100],
           // iterations:[40, 10],

            shadow:false,
            getVelocity:true,

            //massInfo:this.first,

        })

        this.first = false

        p.force = new Vector3()

        this.particles.push( p )
        if (this.neighbors.length < this.particles.length) {
	        this.neighbors.push([])
	    }

	}

	connect( link, extra ){

		let i = link.length;
		//console.log(i)
		let tmp = [], l, b1, b2, p1, p2, n=0, d = 0

		while(i--){

			//if(!this.particles[l[0]] || !this.particles[l[1]]) continue

			l = link[i];
			b1 = this.name+l[0];
			b2 = this.name+l[1];

			p1 = this.particles[l[0]].position;
			p2 = this.particles[l[1]].position;

			//p1.y = 0
			//p2.y = 0

			//console.log(p1,p2)

			d = this.tv.copy( p1 ).distanceTo(p2)

			if(extra){
				if(d>this.maxDist) continue
			} else {
				if(d>this.maxDist)  this.maxDist = d
			}

			

			//this.tv.copy( p2 ).sub( p1 ).multiplyScalar(0.5)
			this.tv.copy( p2 ).sub( p1 )//.multiplyScalar(0.5)

			

			tmp.push({ 
				type:'distance', 
			    helperSize:0.03, 
			    b1:this.name+l[0], 
			    b2:this.name+l[1], 
			    //limit:[d - 0.01, d + 0.01], 
			    //limit:[d*0.5, d],
			    limit:[d*0.5, d],
			    spring:[20, 1.0],

			    collision:true,
			    //spring:[2000, 100],

			    //noPreProcess:true,
			    noPreProcess:true,
			    alway:true,
			    //spring:[0.0, 0.0],
			    //friction:0,
			    //visible:true 
		    })
		    /*tmp.push({ 
		    	helperSize:0.01,
			    type:'spherical', 
			    b1:b1, b2:b2, 
			    worldAxis: n===0 ? [1,0,0] : [0,0,1],
			    //pos1: this.tv2.set(0,0,0).add(this.tv).toArray(),
			    pos2: this.tv2.set(0,0,0).sub(this.tv).toArray(),
		        limit:[-180, 180, 0.01, 10 ], //spring:[100, 0.01], 
		    })
		    n++
		    if(n===2)n=0*/
		}

		this.motor.add(tmp)

	}

	getPosition(){

		let ar = []
		let i = this.particles.length, p, n
		while(i--){

			n = i*3
	    	p = this.particles[i]
	    	ar[n] = p.position.x
	    	ar[n+1] = p.position.y
	    	ar[n+2] = p.position.z
	    }

	    return ar

	}

	
    // Get neighbors within smoothing volume, save in the array neighbors
    getNeighbors( particle, neighbors ) {

	    const N = this.particles.length
	    const id = particle.idx
	    const R2 = this.smoothing * this.smoothing
	    let distance = 0//SPHSystem_getNeighbors_dist
	    for (let i = 0; i !== N; i++) {
	        const p = this.particles[i]
	        //const dx = p.position.x - particle.position.x, dy = p.position.y - particle.position.y, dz = p.position.z - particle.position.z;
	        distance = this.distanceSq( p, particle )//dx * dx + dy * dy + dz * dz
	        if (id !== p.idx && distance < R2) {
	            neighbors.push(p)
	        }
	    }	
    }

    distance(p, v) {
	    const dx = p.position.x - v.position.x, dy = p.position.y - v.position.y, dz = p.position.z - v.position.z;
	    return Math.sqrt(dx * dx + dy * dy + dz * dz)
	}

    distanceSq(p, v) {
	    const dx = p.position.x - v.position.x, dy = p.position.y - v.position.y, dz = p.position.z - v.position.z;
	    return dx * dx + dy * dy + dz * dz
	}

    // Calculate the weight using the W(r) weightfunction
	w(r) {
	    // 315
	    const h = this.smoothing
	    return 315.0/(64.0*Math.PI*Math.pow(h,9)) * Math.pow(h*h-r*r,3);
	    //return (315.0 / (64.0 * Math.PI * h ** 9)) * (h * h - r * r) ** 3;

	}

	// calculate gradient of the weight function
	gradw(rVec, resultVec) {

	    const r = rVec.length();
	    const h = this.smoothing;
	    const vv = 945.0/(32.0*Math.PI*Math.pow(h,9)) * Math.pow((h*h-r*r),2)
	    //resultVec.copy(rVec).multiplyScalar( (945.0 / (32.0 * Math.PI * h ** 9)) * (h * h - r * r) ** 2 );
	    resultVec.copy(rVec).multiplyScalar( vv );

	}

	// Calculate nabla(W)
	nablaw(r) {

	    const h = this.smoothing;
	    const nabla = 945.0/(32.0*Math.PI*Math.pow(h,9)) * (h*h-r*r)*(7*r*r - 3*h*h);
	    //const nabla = (945.0 / (32.0 * Math.PI * h ** 9)) * (h * h - r * r) * (7 * r * r - 3 * h * h);
	    return nabla;

	}

	// For mesh contruction

	getKey( hash, f){

		let k
		for(let i in hash){
			k = hash[i]
			if(k.indexOf(f) !== -1) return i
		}
	
	}

	sameLink(link, a,b){

		let i = link.length, l
		let same = false;
		while(i--){
			l = link[i]
			if( a === b ) same = true
			if( a === l[0] && b === l[1] ) same = true
			if( a === l[1] && b === l[0] ) same = true
		}
	    return same;

	}

	update() {

		const TMP = []

		const N = this.particles.length
	    const dist = SPHSystem_update_dist
	    const cs = this.speed
	    const eps = this.eps

	    let i = N, j

	    for (let i = 0; i !== N; i++) {
	    //while(i--){

	    	const p = this.particles[i] // Current particle
	    	p.force.set(0,0,0)
            const neighbors = this.neighbors[i]

            // Get neighbors
		    neighbors.length = 0
		    this.getNeighbors(p, neighbors)
		    neighbors.push(this.particles[i]) // Add current too
		    const numNeighbors = neighbors.length

		    // Accumulate density for the particle
		    let sum = 0.0
		    j = numNeighbors
		    while(j--){
		    //for (let j = 0; j !== numNeighbors; j++) {
		        //printf("Current particle has position %f %f %f\n",objects[id].pos.x(),objects[id].pos.y(),objects[id].pos.z());
		        const weight = this.w( this.distance( p, neighbors[j] ) )
		        sum += neighbors[j].mass * weight
		    }

		    // Save
		    this.densities[i] = sum
		    this.pressures[i] = cs * cs * (this.densities[i] - this.density)

	    }

	    // Add forces

	    // Sum to these accelerations
	    const a_pressure = SPHSystem_update_a_pressure
	    const a_visc = SPHSystem_update_a_visc
	    const gradW = SPHSystem_update_gradW
	    const r_vec = SPHSystem_update_r_vec
	    const u = SPHSystem_update_u

	    i = N

	    let neighbor, r

	    for (let i = 0; i !== N; i++) {

	    	const particle = this.particles[i]

		    a_pressure.set(0, 0, 0)
		    a_visc.set(0, 0, 0)

		    // Init vars
		    let Pij
		    let nabla
		    let Vij

		    // Sum up for all other neighbors
		    const neighbors = this.neighbors[i]
		    const numNeighbors = neighbors.length

		    

		    //j = numNeighbors
		    //while(j--){
		    for (let j = 0; j !== numNeighbors; j++) {
		    	
		    	neighbor = neighbors[j]

		    	// Get r once for all..
		    	r_vec.copy(particle.position).sub(neighbor.position)
		        r = r_vec.length()


		        // Pressure contribution
		        Pij =
		          -neighbor.mass *
		          (this.pressures[i] / (this.densities[i] * this.densities[i] + eps) +
		            this.pressures[j] / (this.densities[j] * this.densities[j] + eps))

		        this.gradw(r_vec, gradW)
		        // Add to pressure acceleration
		        gradW.multiplyScalar(Pij) //scale(Pij, gradW)
		        a_pressure.add(gradW)//.vadd(gradW, a_pressure)


		        // Viscosity contribution
		        u.copy(neighbor.velocity).sub(particle.velocity)

		        /*TMP.push({
			    	name:neighbor.name,
			    	velocity : u.toArray()
			    })*/
		        //neighbor.velocity.vsub(particle.velocity, u)
		        u.multiplyScalar((1.0 / (0.0001 + this.densities[i] * this.densities[j])) * this.viscosity * neighbor.mass)
		        nabla = this.nablaw(r)
		        u.multiplyScalar(nabla)
		        // Add to viscosity acceleration
		        a_visc.add(u)


		    }

		    // Calculate force
		    a_visc.multiplyScalar(particle.mass)
		    a_pressure.multiplyScalar(particle.mass)

		    // Add force to particles

		    particle.force.add(a_visc)
            particle.force.add(a_pressure)

		    TMP.push({
		    	name: particle.name,
		    	force: particle.force.toArray(),
		    	//pos:particle.position.toArray()
		    	//velocityOperation:'step',
		    	//linear:0.01
		    })
            
	    }

	    this.motor.change(TMP)
	    this.updateMesh()

	}

}