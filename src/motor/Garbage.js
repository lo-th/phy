export class Garbage {

	constructor ( motor ) {

		this.motor = motor;

		this.tmp = new Map()

		let map = new Map().set('a', 1).set('b', 2),
        array = Array.from(map, ([name, value]) => ({ name, value }));
        console.log(array);

	}

	add( name ){

	}

	get(){
		return Array.from(this.tmp, ([name, value]) => ({ name, value }));
	}


}
