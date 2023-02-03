class CheckTexture {

	constructor( c1='rgb(127,127,255)', c2='rgb(100,100,255)') {

		let s = 16
		let sm = s*0.5

		const canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = s;

		const context = canvas.getContext( '2d' );
		context.fillStyle = c1;
		context.fillRect( 0, 0, s, s );

		context.beginPath();
	    context.rect(0, 0, sm, sm);
	    context.rect(sm, sm, sm, sm);
	    context.fillStyle = c2
	    context.fill();

		return canvas;

	}

}

export { CheckTexture };
