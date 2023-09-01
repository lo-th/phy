

export class Item {

	constructor () {

		this.id = 0;
		this.list = [];
		this.type = 'item';
		this.Utils = null;

	}

	reset () {

		let i = this.list.length;
		while( i-- ) this.dispose( this.list[i] );
		this.list = [];
	    this.id = 0;

	}

	///

	byName ( name ) {

		return this.Utils.byName( name );

	}

	setName ( o = {} ) {

		let name = o.name !== undefined ? o.name : this.type + this.id ++;

		// clear old item if existe keep id
		o.id = this.remove( name, true );
		o.name = name;
		return name;

	}

	addToWorld ( b, id = -1 ) {

		this.Utils.add( b );
		if( id !== -1 ) this.list[id] = b;
		else this.list.push( b );

	}

	remove ( name, remplace ) {

		let b = this.byName( name );
		if( !b ) return -1;
		return this.clear( b, remplace );

	}

	clear ( b, remplace ) {

		let n = this.list.indexOf( b );
		if ( n !== - 1 && !remplace ) this.list.splice( n, 1 );
		else this.list[n] = null;
		this.dispose( b );
		return n;

	}

	dispose ( b ) {

		if( b !== null ) this.Utils.remove( b );

	}

	add ( o = {} ) { }

	set ( o = {} ) { }

	step ( AR, N ) { }

	// ARRAY MATH TOOL

    /*
    vecZero ( ar, n, i ) { while ( i-- ) ar[n+i] = 0; }

    fillArray ( ar, ar2, n, i ) { 

    	n = n || 0;
    	i = i ?? ar.length;
    	while( i-- ) ar2[n+i] = ar[i];

    }

    arLength ( ar ) { 

    	let v = Math.sqrt( ar[0] * ar[0] + ar[1] * ar[1] + ar[2] * ar[2] );
    	if( v < 0.001 ) v = 0;
    	return v;

    }

    multiplyScalar ( ar, v, i ) { 

    	i = i ?? ar.length;
    	while(i--) ar[i] *= v;

    }

    divideScalar ( ar, v, i ) {

    	this.multiplyScalar( ar, 1/v, i );

    }*/

}