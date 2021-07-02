class CheckTexture {

	constructor( c1='rgb(127,127,255)', c2='rgb(100,100,255)') {

		const canvas = document.createElement( 'canvas' );
		canvas.width = canvas.height = 128;

		const context = canvas.getContext( '2d' );
		context.fillStyle = c1;
		context.fillRect( 0, 0, 128, 128 );

		context.beginPath();
	    context.rect(0, 0, 64, 64);
	    context.rect(64, 64, 64, 64);
	    context.fillStyle = c2
	    context.fill();

		return canvas;

	}

}

export { CheckTexture };
