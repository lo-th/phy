
export class Item {

	constructor () {

		this.id = 0;
		this.list = []
		this.type = 'item'
		this.Utils = null

	}

	reset () {

		let i = this.list.length
		while( i-- ) this.dispose( this.list[i] )

		this.id = 0
		this.list = []

	}

	

	///

	byName ( name ) {

		return this.Utils.byName( name )

	}

	setName ( o = {} ) {

		let name = o.name !== undefined ? o.name : this.type + this.id ++

		// clear old item if existe
		this.remove( name )

		return name

	}

	addToWorld ( b, c, d ) {

		this.Utils.add( b, c, d )
		this.list.push( b )

	}

	remove ( name ) {

		let b = this.byName( name );
		if( !b ) return
		this.clear( b )

	}

	clear ( b ) {

		let n = this.list.indexOf( b )
		if ( n !== - 1 ) this.list.splice( n, 1 )
		this.dispose( b )

	}

	dispose ( b ) {

		this.Utils.remove( b )

	}

	add ( o = {} ) { }

	set ( o = {} ) { }

	step ( AR, N ) { }

}