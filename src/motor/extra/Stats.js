import { MathUtils } from "three"

const average = arr => arr?.reduce((a, b) => a + b, 0) / arr.length

export class Stats {

	constructor() {

		this.chartLen = 60;
		this.frame = 0
		this.frameG = 0
		this.gpuAccums = []
		this.activeAccums = []
		this.queryCreated = false
		this.queryHasResult = false

		this.withGpu = true


		this.reset()
		
	}

	reset() {
		this.msChart = new Array(this.chartLen).fill(0)
		this.fpsChart = new Array(this.chartLen).fill(0)
		this.gpuChart = new Array(this.chartLen).fill(0)
	}

	up( data ){

		this.msChart[this.frame] = data.ms
		this.fpsChart[this.frame] = data.fps
		//this.startGpu()
		//this.gpuChart[this.frame] = this.gpuAccums[0]

		this.frame++
		if(this.frame === this.chartLen) this.frame = 0

	}

	

    setRenderer(renderer){

    	if(!this.withGpu) return 

    	this.gl = renderer.getContext()
    	this.extension = this.gl.getExtension("EXT_disjoint_timer_query_webgl2")


    	if (this.extension !== null) {
    		this.startGpu()
    		/*this.query = this.gl.createQuery();
			this.gl.beginQuery( this.extension.TIME_ELAPSED_EXT, this.query );
			console.log('ok')*/
    	}
    	
    }

    upGpu(){

    	let v = this.startGpu(this.frameG)

    	if(v){



	    	this.gpuChart[this.frameG] = v//this.gpuAccums[0]

			this.frameG++
			if(this.frameG === this.chartLen) this.frameG = 0

		
        }

        this.endGpu()

    	/*const gl = this.gl
		const ext = this.extension


		let available = false
		let disjoint, ns

		if (this.query){
			//let t = gl.getQuery(ext.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)
			//console.log(t)
			/*let query = this.query*/
		/*	available = gl.getQueryParameter(gl.CURRENT_QUERY, gl.QUERY_RESULT_AVAILABLE)
		    disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT)
		}

		//

		//const currentQuery = gl.getQuery(gl.ANY_SAMPLES_PASSED, gl.CURRENT_QUERY);
		

    	/*
		let disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT)

		if (available && !disjoint) {
		 	ns = this.gl.getQueryParameter( this.query, this.gl.QUERY_RESULT );

			//this.startGpu()
			
		}

	    if (available || disjoint) {
		    // Clean up the query object.
		    gl.deleteQuery(this.query)
		    // Don't re-enter this polling loop.
		    query = null
        }

        if (available && ns > 0) {
		    // update the display if it is valid
		    if (!disjoint) {
		        //this.activeAccums.forEach((_active, i) => { this.gpuAccums[i] = ms })
		        //this.gpuAccums[0] = ms

		        
		    }
	    }*/

	}

    startGpu() {

		const gl = this.gl
		const ext = this.extension

		if (!gl || !ext) return
		
		let available = false
		let disjoint, ns
		let v = null


		if (this.query) {
		    this.queryHasResult = false
		    let query = this.query

		    //
			// console.log(gl.getParameter(ext.TIMESTAMP_EXT))
			available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE)
			disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT)

		    if (available && !disjoint) {
		       ns = gl.getQueryParameter(this.query, gl.QUERY_RESULT)
		       const ms = ns * 1e-6
		       
		       this.gpuAccums[0] = ms

		        if (available || disjoint) {
				    // Clean up the query object.
				    gl.deleteQuery(this.query)
				    // Don't re-enter this polling loop.
				    query = null
		        }

		        if (available && ms > 0) {
				    // update the display if it is valid
				    if (!disjoint) {

				    	v = ms 
				        /*this.activeAccums.forEach((_active, i) => { 
				        	this.gpuAccums[i] = ms 
				        	//console.log(_active, i)
				        })*/
				        //this.gpuAccums[0] = ms*/
				    }
			    }
			}
		}

		if (available || !this.query) {
			this.queryCreated = true
			this.query = gl.createQuery()
			gl.beginQuery(ext.TIME_ELAPSED_EXT, this.query)
	    }

	    return v
		
	}

	endGpu() {
		// finish the query measurement
		const ext = this.extension
		const gl = this.gl

		if ( this.queryCreated && gl.getQuery(ext.TIME_ELAPSED_EXT, gl.CURRENT_QUERY) ) {
		    gl.endQuery(ext.TIME_ELAPSED_EXT)
		}
	}

    get ms (){ return average(this.msChart) }
    get fps (){ return average(this.fpsChart) }
    get gpu (){ return average(this.gpuChart) }
}