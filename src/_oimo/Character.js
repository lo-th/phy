import { Body } from './Body.js';
import { Num } from '../core/Config.js';


export class Character extends Body {
	constructor () {
		super()
		//this.type = 'character'
		this.num = Num[ 'character' ]
	}

	add ( o = {} ) {

		o.type = 'capsule'
		super.add( o )

	}
	remove( o = {} ) {}
	dispose ( b ) {}
}