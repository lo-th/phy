
export class Collision {

	constructor ( motor ) {

		this.map = new Map();
		this.motor = motor;

		this.enginReady = ['PHYSX', 'HAVOK', 'OIMO']

		this.rc = this.refresh.bind(this)

	}

	reset () {

		this.map = new Map();

	}

	step () {

		this.map.forEach( this.rc );

	}

	refresh ( b, key ) {

		let cc = this.motor.reflow.contact[key];
		if( cc !== undefined ){
			
			for(let i = 0, lng = cc.length; i<lng; i++){

				if( b.userData.collisionCallback ) b.userData.collisionCallback(cc[i]);
				else b.dispatchEvent( { type: 'collision', data:cc[i] } );

			}
		}
		
	}

	isReady() {
		return this.enginReady.indexOf( this.motor.engine ) !== -1
	}

	

	remove ( name ) {

		if(!this.isReady()) return
		if( !this.map.has( name ) ) return;

		this.map.delete( name );
		this.motor.post( { m:'removeCollision', o:{name:name} } );

	}

	add ( o ) {

		if(!this.isReady()) return

		let name = o.name
		let b = this.motor.byName( name );
		if( b === null ) return;
		//if( !b.trigger ) b.getVelocity = true;

		if( o.vs && o.vs.constructor !== Array) o.vs = [o.vs];
		if( o.ignore && o.ignore.constructor !== Array) o.ignore = [o.ignore];

		if( o.callback ){ 
			b.userData.collisionCallback = o.callback;
			delete ( o.callback );
		}

		this.map.set( name, b );
	    this.motor.post( { m:'addCollision', o:o } );

	}

}