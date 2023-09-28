export class Timer {

	constructor( framerate = -1 ) {

		this.perf = window.performance;
		this.time = { now:0, delta:0, then:0, interval: 0, tmp:0, n:0, dt:0 }
		this.fps = 0
		this.delta = 0
		this.elapsedTime = 0
		this.unlimited = false
		this.setFramerate( framerate )
		this.force = false

	} 

	up ( stamp ) {

		let t = this.time;

		if(this.unlimited) this.force = true

		t.now = stamp !== undefined ? stamp : this.now();
		t.delta = t.now - t.then;

		if( this.force ) {
			t.delta = t.interval
			this.force = false
		}
		
		if ( t.delta >= t.interval || this.unlimited ) {

		    t.then = this.unlimited ? t.now : t.now - ( t.delta % t.interval )
		    //if(t.delta>)
		    //this.delta = t.delta * 0.001 // bug on outside
		    this.delta = t.interval * 0.001
		    //if(this.delta>this.time.interval)this.delta=this.time.interval
		    this.elapsedTime += this.delta;
		    
		    //if ( t.now - 1000 > t.tmp ){ t.tmp = t.now; this.fps = t.n; t.n = 0; }; t.n++;
			return true

		}

		return false

	}

	setFramerate ( framerate ){
		
		this.elapsedTime = 0;
		this.framerate = framerate;
		this.unlimited = this.framerate < 0;
		this.time.interval = 1000 / framerate;
		if( framerate === 60 ) this.time.interval = 16.67

	}

    static now () {
    	return this.perf ? this.perf.now() : Date.now();
    }

    static format_time ( time ) {
	    if (time > 1000)  return (time / 1000) + " sec";
	    return time + " ms";
	}
	
}