import { MathTool } from '../../core/MathTool.js';
import { root } from '../root.js';
import { BoxGeometry, Mesh, Vector3 } from 'three';


//const SPHSystem_getNeighbors_dist = new Vector3()

// Temp vectors for calculation
const SPHSystem_update_dist = new Vector3() // Relative velocity

const SPHSystem_update_a_pressure = new Vector3()
const SPHSystem_update_a_visc = new Vector3()
const SPHSystem_update_gradW = new Vector3()
const SPHSystem_update_r_vec = new Vector3()
const SPHSystem_update_u = new Vector3()


export class Particle {

	constructor ( o = {} ) {

		this.name = o.name  || 'ppp'

		this.particles = []
	    this.density = 0.01
	    this.smoothingRadius = 0.2
	    this.speedOfSound = 0.1
	    this.viscosity = 0.03
	    this.eps = 0.000001

	    this.group = 1 << 8

	    // Stuff Computed per particle
	    this.pressures = []
	    this.densities = []
	    this.neighbors = []

	    this.tv = new Vector3()
	    this.tv2 = new Vector3()

	}

	add( pos ){

		let p = root.motor.add({ 

            instance:this.name,
            type:'particle', 
            //type:'sphere',
            flags:'noQuery',
            size:[0.1],
            pSize:0.03,
            pos:pos, 

            inertia:[0,0,0], 
            //iterations:[10,1],
            
            mass:0.001, 
            //density:0.0001,
            restitution:0.0, 
            friction:0.5, 
            //maxVelocity:[2,100],
            damping:[0.1,0.1],

            //group:this.group, 
            //mask:1|2,
            material:'hide',

        })

        p.force = new Vector3()

        this.particles.push( p )
        if (this.neighbors.length < this.particles.length) {
	        this.neighbors.push([])
	    }

	}

	connect( link ){

		let i = link.length;
		console.log(i)
		let tmp = [], l, b1, b2, p1, p2, n=0, d = 0

		while(i--){

			l = link[i];
			b1 = this.name+l[0];
			b2 = this.name+l[1];

			p1 = this.particles[l[0]].position;
			p2 = this.particles[l[1]].position;

			//p1.y = 0
			//p2.y = 0

			//console.log(p1,p2)

			d = this.tv.copy( p1 ).distanceTo(p2)

			

			//this.tv.copy( p2 ).sub( p1 ).multiplyScalar(0.5)
			this.tv.copy( p2 ).sub( p1 )//.multiplyScalar(0.5)

			

			tmp.push({ 
				type:'distance', 
			    helperSize:0.03, 
			    b1:this.name+l[0], 
			    b2:this.name+l[1], 
			    //limit:[d - 0.01, d + 0.01], 
			    limit:[d*0.5, d],
			    spring:[20, 1.0],
			    //spring:[0.0, 0.0],
			    friction:0,
			    /*visible:true, helperSize:0.02*/ 
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

		root.motor.add(tmp)

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
	    const id = particle.id
	    const R2 = this.smoothingRadius * this.smoothingRadius
	    let distance = 0//SPHSystem_getNeighbors_dist
	    for (let i = 0; i !== N; i++) {
	        const p = this.particles[i]
	        //const dx = p.position.x - particle.position.x, dy = p.position.y - particle.position.y, dz = p.position.z - particle.position.z;
	        distance = this.distance(p, particle )//dx * dx + dy * dy + dz * dz
	        if (id !== p.id && distance < R2) {
	            neighbors.push(p)
	        }
	    }	
    }

    distance(p, v) {
	    const dx = p.position.x - v.position.x, dy = p.position.y - v.position.y, dz = p.position.z - v.position.z;
	    return dx * dx + dy * dy + dz * dz
	}

    // Calculate the weight using the W(r) weightfunction
	w(r) {
	    // 315
	    const h = this.smoothingRadius
	    return (315.0 / (64.0 * Math.PI * h ** 9)) * (h * h - r * r) ** 3
	}

	// calculate gradient of the weight function
	gradw(rVec, resultVec) {

	    const r = rVec.length()
	    const h = this.smoothingRadius
	    resultVec.copy(rVec).multiplyScalar( (945.0 / (32.0 * Math.PI * h ** 9)) * (h * h - r * r) ** 2 )
	    //rVec.scale((945.0 / (32.0 * Math.PI * h ** 9)) * (h * h - r * r) ** 2, resultVec)
	}

	// Calculate nabla(W)
	nablaw(r) {
	    const h = this.smoothingRadius
	    const nabla = (945.0 / (32.0 * Math.PI * h ** 9)) * (h * h - r * r) * (7 * r * r - 3 * h * h)
	    return nabla
	}

	update() {

		const TMP = []

		const N = this.particles.length
	    const dist = SPHSystem_update_dist
	    const cs = this.speedOfSound
	    const eps = this.eps

	    let i = N, j

	   //for (let i = 0; i !== N; i++) {
	    while(i--){

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

	   //for (let i = 0; i !== N; i++) {
	    while(i--){

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

		    j = numNeighbors
		    while(j--){
		    //for (let j = 0; j !== numNeighbors; j++) {
		    	const neighbor = neighbors[j]

		    	// Get r once for all..
		    	r_vec.copy(particle.position).sub(neighbor.position)
		        //particle.position.vsub(neighbor.position, r_vec)
		        const r = r_vec.length()

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
		    	force: particle.force.toArray()
		    })
            
	    }

	    root.motor.change(TMP)



	}

}