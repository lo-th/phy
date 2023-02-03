import { Body } from './Body.js';

export class Character extends Body {
	constructor () {
		super()
		this.type = 'character'
	}
}