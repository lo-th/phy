export class Logo { 

    constructor( Color = '#ff4545', link )
    {
        let color = Color;
        const bottomLogo = document.createElement( 'a' );
        bottomLogo.href = link || 'https://github.com/lo-th';
        bottomLogo.target = '_blank';
        bottomLogo.style.cssText = 'position:absolute; width:60px; height:30px; left:10px; top:13px; pointer-events:auto; cursor:pointer;'
        bottomLogo.innerHTML = this.icon( '3TH', '#CCCCCC' );
        document.body.appendChild( bottomLogo );

        let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; '
        
        this.info = document.createElement('div');
        this.info.style.cssText = unselectable + "font-family: Mulish, sans-serif; position:absolute; top:25px; left:80px; width:200px; height:200px; pointer-events:none; color:#CCC;";
        document.body.appendChild(this.info);

        this.info.innerHTML = 'yoo'

        const logoSvg = document.getElementById( '3TH' );
        bottomLogo.addEventListener('mouseover', function(){ logoSvg.setAttributeNS(null,"fill", color ) }, false );
        bottomLogo.addEventListener('mouseout', function(){ logoSvg.setAttributeNS(null,"fill",'#CCCCCC') }, false );
    }

    log( s ){
        this.info.innerHTML = s;
    }

    icon( type, color, w, ww )
    {
        w = w || 40;
        var h = w;
        ww = ww || 40;
        color = color || '#DEDEDE';
        var viewBox = '0 0 '+ww+' '+ww;
        var extra = "<filter id='f2' x='0' y='0' width='100%' height='100%'><feOffset result='offOut' in='SourceAlpha' dx='1' dy='1' /><feGaussianBlur result='blurOut' in='offOut' stdDeviation='1' /><feBlend in='SourceGraphic' in2='blurOut' mode='normal' /></filter>";

        if(type === '3TH'){ 
            viewBox = '0 0 100 50'; 
            w = 60;//60;
            h = 30;//30;
            extra = "<filter id='f1' x='0' y='0' width='200%' height='200%'><feOffset result='offOut' in='SourceAlpha' dx='1' dy='1' /><feGaussianBlur result='blurOut' in='offOut' stdDeviation='1' /><feBlend in='SourceGraphic' in2='blurOut' mode='normal' /></filter>"
        }

        var t = ["<svg xmlns='http://www.w3.org/2000/svg' version='1.1' xmlns:xlink='http://www.w3.org/1999/xlink' style='pointer-events:none;' preserveAspectRatio='xMinYMax meet' x='0px' y='0px' width='"+w+"px' height='"+h+"px' viewBox='"+viewBox+"'>"+extra+"<g>"];
        switch(type){

            case '3TH':
            t[1]="<path id='3TH' filter='url(#f1)' fill='"+color+"' stroke='none' stroke-width='0' d='M 83.7 48.3 L 94 48.3 94 32.95 Q 94 26.65 89.5 22.1 85.05 17.7 78.65 17.7 L 78.55 17.7 Q 78.35 17.7 78.15 17.7 L 73.6 17.7 73.6 8 63.4 8 63.4 17.7 49.7 17.7 49.7 8 39.5 8 39.5 17.7 34.05 17.7";
            t[1]+="Q 34.35 16.35 34.35 14.8 L 34.35 14.7 Q 34.35 12.45 33.65 10.45 32.7 7.7 30.55 5.55 30.15 5.1 29.6 4.7 26.1 1.7 21.25 1.7 18.3 1.7 15.8 2.85 13.75 3.75 12 5.55 8.3 9.35 8.2 14.6 8.2 14.7 8.2 14.8 L 18.4 14.8 18.4 14.7";
            t[1]+="Q 18.4 13.55 19.2 12.75 20.05 11.9 21.15 11.9 L 21.35 11.9 Q 22.5 11.9 23.35 12.75 24.05 13.55 24.15 14.7 L 24.15 14.8 Q 24.15 15.95 23.35 16.85 22.5 17.6 21.35 17.7";
            t[1]+="L 18.4 17.7 18.4 27.9 21.6 27.9 Q 23.45 28 24.9 29.35 25.5 30.05 25.9 30.85 26.3 31.8 26.3 32.95 26.3 35.1 24.9 36.55 23.45 38 21.35 38.1 L 21.25 38.1 Q 19.1 38.1 17.65 36.55 16.1 35.1 16.1 32.95 16.1 32.85 16.1 32.75 L 6 32.75";
            t[1]+="Q 6 32.85 6 32.95 6 39.3 10.45 43.75 12.8 46.15 15.8 47.25 18.3 48.3 21.25 48.3 L 21.35 48.3 Q 26 48.2 29.6 45.8 30.95 44.9 32.1 43.75 36.5 39.3 36.5 32.95 36.5 31.9 36.4 30.85 36.2 29.35 35.8 27.9 L 39.5 27.9 39.5 32.75 Q 39.5 32.85 39.5 32.95 39.5 39.3 44.05 43.75 48.45 48.3 54.85 48.3 L 60.45 48.3 60.45 38.1 54.75 38.1";
            t[1]+="Q 52.7 38.1 51.15 36.55 49.7 35.1 49.7 32.95 L 49.7 27.9 54.75 27.9 Q 54.85 27.9 54.95 27.9 L 63.4 27.9 63.4 48.3 73.6 48.3 73.6 32.95 Q 73.6 30.85 75.05 29.35 76.3 28.2 77.85 27.9 78.15 27.9 78.55 27.9 L 78.65 27.9 Q 80.85 27.9 82.25 29.35 83.7 30.85 83.7 32.95 L 83.7 48.3 Z'/>"
            break;

            case 'NEXT':
            //t[1]="<path id='NEXT1' stroke='"+color+"' stroke-width='22' stroke-linejoin='miter' stroke-linecap='butt' stroke-miterlimit='3' fill='none' d='M 231.95 127.95 Q 231.95 171.05 201.45 201.45 171.05 231.95 127.95 231.95 84.85 231.95 54.4 201.45 23.95 171.05 23.95 127.95 23.95 84.85 54.4 54.4 84.85 23.95 127.95 23.95 171.05 23.95 201.45 54.4 231.95 84.85 231.95 127.95 Z'/>";
            t[1]="<path id='NEXT' stroke='"+color+"' stroke-width='28' stroke-linejoin='miter' stroke-linecap='butt' stroke-miterlimit='3' fill='none' d='M 102.55 73.8 L 156.8 128.05 102.55 182.25'/>";
            break;
            case 'PREV':
            //t[1]="<path id='PREV1' stroke='"+color+"' stroke-width='22' stroke-linejoin='miter' stroke-linecap='butt' stroke-miterlimit='3' fill='none' d='M 231.95 127.95 Q 231.95 171.05 201.45 201.45 171.05 231.95 127.95 231.95 84.85 231.95 54.4 201.45 23.95 171.05 23.95 127.95 23.95 84.85 54.4 54.4 84.85 23.95 127.95 23.95 171.05 23.95 201.45 54.4 231.95 84.85 231.95 127.95 Z'/>";
            t[1]="<path id='PREV' stroke='"+color+"' stroke-width='28' stroke-linejoin='miter' stroke-linecap='butt' stroke-miterlimit='3' fill='none' d='M 156.75 73.8 L 102.5 128.05 156.75 182.25'/>";
            break;

        }
        t[2] = "</g></svg>";
        return t.join("\n");
    }

}