import './libs/webgl-memory.js'

export class Stats {

    constructor ( renderer ) {

    	this.renderer = renderer
    	this.memo = this.renderer.getContext().getExtension('GMAN_webgl_memory')
		
    }

    get(){

    	const info = this.memo.getMemoryInfo()
	    const eng = this.renderer.info

	    info['engine'] = {

	    	geometries : eng.memory.geometries,
			textures : eng.memory.textures,

		    calls : eng.render.calls,
			triangles : eng.render.triangles,
			points : eng.render.points,
			lines : eng.render.lines,
			//frame : eng.render.frame,

	    }

	    // can't remove background geometry !!
	    if( info.engine.geometries === 1 ) info.engine.geometries = 0

	    return this.format( info )

    }

    format( t ){

    	let txt = t

        if( t!=='' ){

            for( let j in t.memory ){
                //t.memory[j] = Math.round( t.memory[j]*0.000976563 )

                if( j === 'drawingbuffer' || j === 'total' ) t.memory[j] = Math.round( t.memory[j]*0.000001 ) + ' Mb'
                else t.memory[j] = Math.round( t.memory[j]*0.001 ) + ' Kb'

                //if( j === 'drawingbuffer' || j === 'total' ) t.memory[j] = Math.round( (t.memory[j]*0.000001 )/8) + ' Mo'
                //else t.memory[j] = Math.round( (t.memory[j]*0.001)/8 ) + ' Ko'

                //t.memory[j] = Math.round( t.memory[j] / 1024/ 1024 )
            }

            txt = JSON.stringify(t, null, 2)
            txt = txt.replace(/[",.*+?^${}()|[\]\\]/g, '')

        }

        return txt

    }

}