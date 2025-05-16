// Datacolor Spyder
// ColorChecker Classic - Calibrite

let unselectable = '-o-user-select:none; -ms-user-select:none; -khtml-user-select:none; -webkit-user-select:none; -moz-user-select: none; pointer-events:none; ';


export class ColorCheck {

    constructor ( motor, Parent ) {

    	this.paletteType = 0
    	
    	this.motor = motor || null;

    	let parent = Parent || document.body;

    	let content = document.createElement( 'div' );
        content.style.cssText = unselectable + 'position:absolute; margin:0; padding:0; top:0px; left:0px; width:10px; height:10px; display:block;'
        parent.appendChild( content );

        this.parent = parent;

        this.content = content;
        this.cc = 'position:absolute; margin:5px 5px; padding:0; width:10px; height:10px; display:block; '

        let panel = document.createElement( 'div' );
        panel.style.cssText = "position:absolute; top:0; left:0; width:120px; height:80px; display:block; ";
        panel.innerHTML = this.panelSvg()
        content.appendChild( panel );

        let trans = document.createElement( 'div' );
        trans.style.cssText = "position:absolute; top:0; left:0; width:120px; height:80px; display:block; ";
        trans.innerHTML = this.transSvg()
        content.appendChild( trans );

        this.point = { x:0, y:0, down:false, id:'' }

        this.trans = trans
        this.panel = panel

        const ee = this.trans.children[0].children;
        this.node = {
        	l0 : ee.l0, l1 : ee.l1, l2 : ee.l2, l3 : ee.l3,
        	c0 : ee.c0, c1 : ee.c1, c2 : ee.c2, c3 : ee.c3,
        	c4 : ee.c4,
        }

        const pp = this.panel.children[0].children;
        let str;
        this.baseString = '';
        this.pnode = {}
        for(let i = 0; i<24; i++){
        	this.pnode['p'+i] = pp['p'+i];
        	str = this.pnode['p'+i].getAttribute("d");
        	this.baseString += " " + str
        }

        // change palette
        this.setColor(colors[this.paletteType]);

        this.source = [ {x:0,y:0}, {x:120,y:0}, {x:120,y:80}, {x:0,y:80} ];

        
        this.addEvent()

        let target = this.startResize()

        if(this.motor){
            this.colorChecker = this.motor.getColorChecker();
        	//let detect =  this.motor.getColorChecker(this.paletteType);
        	if(this.colorChecker){
        		target = this.get3DPosition(this.paletteType);
        		const autoUpdate = this.auto.bind(this)
        		this.motor.getControl().onChange( autoUpdate );
        	}
        	
        } 

        this.fit(target)

    }

    dispose(){

    	if(this.motor){
    		this.motor.getControl().offChange();
    	}
    	
    	if(this.point.down){
    		document.removeEventListener('mousemove', this.onMove );
    		document.removeEventListener('mouseup', this.onUp );
    	}
    	this.point = { x:0, y:0, down:false, id:'' }
    	this.trans.innerHTML = ''
    	this.panel.innerHTML = ''
    	this.content.removeChild(this.panel);
    	this.content.removeChild(this.trans);
    	this.parent.removeChild(this.content);

    }

    get3DPosition = ( n = 0 ) => {

    	if(!this.colorChecker) return false;
    	if(!this.ccp){
	    	this.ccp = []
	    	this.colorChecker.traverse( ( child ) => {
	    		if ( child.isMesh ){
	    			if(child.name === 'marker_0_0') this.ccp[0] = child;
	    			if(child.name === 'marker_0_1') this.ccp[1] = child;
	    			if(child.name === 'marker_0_2') this.ccp[2] = child;
	    			if(child.name === 'marker_0_3') this.ccp[3] = child;

	    			if(child.name === 'marker_1_0') this.ccp[4] = child;
	    			if(child.name === 'marker_1_1') this.ccp[5] = child;
	    			if(child.name === 'marker_1_2') this.ccp[6] = child;
	    			if(child.name === 'marker_1_3') this.ccp[7] = child;

	    			//if(child.name === 'box') this.ccp[8] = child;

	    			//if(child.name === 'marker_1_3') this.ccp[8] = child
	    		}
	    	})
	    }

	    const colorChecker = this.colorChecker



        const todeg = 180 / Math.PI;

	    const view = this.motor.viewSize;
	    const camera = this.motor.getCamera();

	    let a = colorChecker.position.clone()
	    let b = camera.position.clone()

	    //let aa = this.motor.getControl().getAzimuthalAngle();

	    //this.ccp[8].rotation.y = aa
        /*colorChecker.getWorldPosition(a);
        camera.getWorldPosition(b);
	    

	    b.sub(a).normalize();


	    colorChecker.getWorldDirection(a)
	    a.applyMatrix4( colorChecker.matrixWorld )
	    a.sub(colorChecker.position).normalize()
	    */

	    
	    //console.log(a)


	    colorChecker.getWorldDirection(a)
	    camera.getWorldDirection(b)
	    //b.applyMatrix4( colorChecker.matrixWorld ).normalize()
	    /*b.sub(colorChecker.position).normalize()*/
	    let angle = b.dot(a)

	    if(this.paletteType===0 && angle>0){
	    	this.paletteType=1
	    	this.setColor( colors[this.paletteType] )
	    }

	    if(this.paletteType===1 && angle<0){
	    	this.paletteType=0
	    	this.setColor( colors[this.paletteType] )
	    }


	    let p = this.ccp[0].position.clone();
	    let pos = [ {x:0,y:0}, {x:0,y:0}, {x:0,y:0}, {x:0,y:0} ];
	    let px = view.px || window.devicePixelRatio
	    let nn

	    for(let i=0; i<4; i++){
	    	nn = this.paletteType===0 ? i : i+4
	    	this.ccp[nn].getWorldPosition(p);
	    	p.project(camera);
	    	pos[i].x = Math.round((0.5 + p.x / 2) * (view.w / px));
	    	pos[i].y = Math.round((0.5 - p.y / 2) * (view.h / px));
	    }

    	return pos;

    }

    auto(){

    	if(!this.motor) return
    	this.fit( this.get3DPosition(this.paletteType) );

    }

    fit( d ){

    	const n = this.node
		n.c0.setAttribute('cx', d[0].x )
		n.c0.setAttribute('cy', d[0].y )
		n.c1.setAttribute('cx', d[1].x )
		n.c1.setAttribute('cy', d[1].y )
		n.c2.setAttribute('cx', d[2].x )
		n.c2.setAttribute('cy', d[2].y )
		n.c3.setAttribute('cx', d[3].x )
		n.c3.setAttribute('cy', d[3].y )

		this.upCenter()
		this.updatelines();
		this.update();

    }

    startResize(){

    	let px = 30
		let py = 30
		let sy = 210
		let sx = sy*1.5

		let target = [
			{x:this.source[0].x+px,y:this.source[0].y+py}, 
			{x:this.source[1].x+sx+px,y:this.source[1].y+py}, 
			{x:this.source[2].x+sx+px,y:this.source[2].y+sy+py}, 
			{x:this.source[3].x+px,y:this.source[3].y+sy+py}
		]

		return target

    }

    lerp ( x, y, t ) { return ( 1 - t ) * x + t * y }

    angle(c, b, a){

		const ab = { x: b.x - a.x, y: b.y - a.y };
		const cb = { x: b.x - c.x, y: b.y - c.y };
		const dot = (ab.x * cb.x + ab.y * cb.y);
		const cross = (ab.x * cb.y - ab.y * cb.x);
		const alpha = Math.atan2(cross, dot);
		return alpha * 180 / Math.PI;

	}

	upCenter (){

		const n = this.node
		let p0 = {x:Number(n.c0.getAttribute('cx')), y:Number(n.c0.getAttribute('cy')) }
		let p1 = {x:Number(n.c1.getAttribute('cx')), y:Number(n.c1.getAttribute('cy')) }
		//c4.setAttribute('cx', this.lerp(p0.x, p1.x, 0.5) )
		//c4.setAttribute('cy', this.lerp(p0.y, p1.y, 0.5) )

		c4.setAttribute('cx', p0.x*0.5+ p1.x*0.5 )
		c4.setAttribute('cy', p0.y*0.5+ p1.y*0.5 )

	}

    update(){

	    // Make array of destination coordinates, every array member represent corner of text path (the new dragged destination)
	    //if(!destination){ 
    	const n = this.node;
    	const destination = [
		    {x:Number(n.c0.getAttribute("cx")),y:Number(n.c0.getAttribute("cy"))},
		    {x:Number(n.c1.getAttribute("cx")),y:Number(n.c1.getAttribute("cy"))},
		    {x:Number(n.c2.getAttribute("cx")),y:Number(n.c2.getAttribute("cy"))},
		    {x:Number(n.c3.getAttribute("cx")),y:Number(n.c3.getAttribute("cy"))}
	    ];
		//}

	    
	    // Actual calculation which transfers each coordinate
	    // of text path from source coordinates to destination
	    this.distort_path(this.baseString, this.source, destination );

	}

    setColor( ar ){

    	const n = this.pnode;
    	for(let i = 0; i<24; i++){
			n['p'+i].setAttribute("fill", ar[i]);
		}

    }

    updatelines(){

    	const n = this.node;
		n.l0.setAttribute('d', "M"+n.c0.getAttribute("cx")+","+n.c0.getAttribute("cy")+"L"+n.c1.getAttribute("cx")+","+n.c1.getAttribute("cy") );
		n.l1.setAttribute('d', "M"+n.c1.getAttribute("cx")+","+n.c1.getAttribute("cy")+"L"+n.c2.getAttribute("cx")+","+n.c2.getAttribute("cy") );
		n.l2.setAttribute('d', "M"+n.c2.getAttribute("cx")+","+n.c2.getAttribute("cy")+"L"+n.c3.getAttribute("cx")+","+n.c3.getAttribute("cy") );
		n.l3.setAttribute('d', "M"+n.c3.getAttribute("cx")+","+n.c3.getAttribute("cy")+"L"+n.c0.getAttribute("cx")+","+n.c0.getAttribute("cy") );

    }

    transferPoint ( xI, yI, source, destination ){

	    const ADDING = 0.001; // to avoid dividing by zero

	    let xA = source[0].x;
	    let yA = source[0].y;

	    let xC = source[2].x;
	    let yC = source[2].y;
	    
	    let xAu = destination[0].x;
	    let yAu = destination[0].y;

	    let xBu = destination[1].x;
	    let yBu = destination[1].y;

	    let xCu = destination[2].x;
	    let yCu = destination[2].y;

	    let xDu = destination[3].x;
	    let yDu = destination[3].y;

	    // Calcultations
	    // if points are the same, have to add a ADDING to avoid dividing by zero
	    if (xBu==xCu) xCu+=ADDING;
	    if (xAu==xDu) xDu+=ADDING;
	    if (xAu==xBu) xBu+=ADDING;
	    if (xDu==xCu) xCu+=ADDING;
	    let kBC = (yBu-yCu)/(xBu-xCu);
	    let kAD = (yAu-yDu)/(xAu-xDu);
	    let kAB = (yAu-yBu)/(xAu-xBu);
	    let kDC = (yDu-yCu)/(xDu-xCu);

	    if (kBC==kAD) kAD+=ADDING;
	    let xE = (kBC*xBu - kAD*xAu + yAu - yBu) / (kBC-kAD);
	    let yE = kBC*(xE - xBu) + yBu;

	    if (kAB==kDC) kDC+=ADDING;
	    let xF = (kAB*xBu - kDC*xCu + yCu - yBu) / (kAB-kDC);
	    let yF = kAB*(xF - xBu) + yBu;

	    if (xE==xF) xF+=ADDING;
	    let kEF = (yE-yF) / (xE-xF);

	    if (kEF==kAB) kAB+=ADDING;
	    let xG = (kEF*xDu - kAB*xAu + yAu - yDu) / (kEF-kAB);
	    let yG = kEF*(xG - xDu) + yDu;

	    if (kEF==kBC) kBC+=ADDING;
	    let xH = (kEF*xDu - kBC*xBu + yBu - yDu) / (kEF-kBC);
	    let yH = kEF*(xH - xDu) + yDu;

	    let rG = (yC-yI)/(yC-yA);
	    let rH = (xI-xA)/(xC-xA);

	    let xJ = (xG-xDu)*rG + xDu;
	    let yJ = (yG-yDu)*rG + yDu;

	    let xK = (xH-xDu)*rH + xDu;
	    let yK = (yH-yDu)*rH + yDu;

	    if (xF==xJ) xJ+=ADDING;
	    if (xE==xK) xK+=ADDING;
	    let kJF = (yF-yJ) / (xF-xJ); //23
	    let kKE = (yE-yK) / (xE-xK); //12

	    let xKE;
	    if (kJF==kKE) kKE+=ADDING;
	    let xIu = (kJF*xF - kKE*xE + yE - yF) / (kJF-kKE);
	    let yIu = kJF * (xIu - xJ) + yJ;

	    let b={x:xIu,y:yIu}; 
	    b.x=Math.round(b.x);
	    b.y=Math.round(b.y);

	    return b;

	}

	isPosible(p){

		const n = this.node
		let p0 = {x:Number(n.c0.getAttribute("cx")),y:Number(n.c0.getAttribute("cy"))};
		let p1 = {x:Number(n.c1.getAttribute("cx")),y:Number(n.c1.getAttribute("cy"))};
		let p2 = {x:Number(n.c2.getAttribute("cx")),y:Number(n.c2.getAttribute("cy"))};
		let p3 = {x:Number(n.c3.getAttribute("cx")),y:Number(n.c3.getAttribute("cy"))};
		let a0 = this.angle(p3, p0, p1);
		let a1 = this.angle(p0, p1, p2);
		let a2 = this.angle(p1, p2, p3);
		let a3 = this.angle(p2, p3, p0);
		if (!(a0 > 0 && a0 < 180) || !(a1 > 0 && a1 < 180) || !(a2 > 0 && a2 < 180) || !(a3 > 0 && a3 < 180)) return false;
		else return true;

	}

	path_string_to_array(path_str){

	    let patt1=/[mzlhvcsqta]|-?[0-9.]+/gi;
	    let path_arr=path_str.match(patt1);
	    patt1=/[mzlhvcsqta]/i;
	    for(var i=0;i<path_arr.length;i++)
	    {
	        if (!path_arr[i].match(patt1)){
	            path_arr[i]=parseFloat(path_arr[i]);
	        }
	    }

	    return path_arr;
	}

	path_array_to_string(arr){

		const nod = this.pnode;
		let max = arr.length/24
		let n = 0
		let pe, str

		for(let i = 0; i<24; i++){
			pe = arr.slice(n, n+max);
			str = pe.toString();
			str=str.replace(/([0-9]),([-0-9])/g, "$1 $2");
			str=str.replace(/([0-9]),([-0-9])/g, "$1 $2");
			str=str.replace(/,/g, "");

			//console.log(str)
			nod["p"+i].setAttribute("d",str)
			n+=max

		}

	}

	distort_path( str, source, destination ){

		let path_arr=this.path_string_to_array(str);
		let patt1, curr;

		let subpath_type="";
		let is_num;
		let xy_counter;
		let xy;
		let path_arr2 = [];
		let subpath_type_upper;
		let point;

		for( let i=0; i<path_arr.length; i++ ){

		    patt1=/[mzlhvcsqta]/i;
		    curr=path_arr[i];
		    if (curr.toString().match(patt1)){
		        xy_counter=-1;
		        subpath_type=curr;
		        subpath_type_upper=subpath_type.toUpperCase();
		        is_num=false;
		        path_arr2.push(curr);
		    }else{
		        is_num=true;
		        curr=parseFloat(curr);
		    }
		    if (xy_counter%2 == 0) xy="x";
		    else xy="y";

		    if (is_num){            
		        if(xy=="y"){
		            point=this.transferPoint(parseFloat(path_arr[i-1]),curr,source,destination);
		            path_arr2.push(point.x);
		            path_arr2.push(point.y);
		        }
		    }
		    xy_counter++;
		}

		//console.log(path_arr2)
		this.path_array_to_string(path_arr2);

	}

    transSvg(c1='#606060', c2='#808080', c3='#404040'){
        return `
        <svg height="80" version="1.1" width="120" xmlns="http://www.w3.org/2000/svg" style="overflow: visible;">
    		<path id="l0" fill="none" stroke=${c1} d="M0,0L120,0" stroke-width="2" style="pointer-events: none;"></path>
    		<path id="l1" fill="none" stroke=${c1} d="M120,0L120,80" stroke-width="2" style="pointer-events: none;"></path>
    		<path id="l2" fill="none" stroke=${c1} d="M120,80L0,80" stroke-width="2" style="pointer-events: none;"></path>
    		<path id="l3" fill="none" stroke=${c1} d="M0,80L0,0" stroke-width="2" style="pointer-events: none;"></path>
    		<circle id="c0" cx="0" cy="0" r="4" fill="rgba(0,0,0,0)" stroke=${c2} stroke-width="2" style="pointer-events: auto; cursor: pointer;"></circle>
    		<circle id="c1" cx="120" cy="0" r="4" fill="rgba(0,0,0,0)" stroke=${c2} stroke-width="2" style="pointer-events: auto; cursor: pointer;"></circle>
    		<circle id="c2" cx="120" cy="80" r="4" fill="rgba(0,0,0,0)" stroke=${c2} stroke-width="2" style="pointer-events: auto; cursor: pointer;"></circle>
    		<circle id="c3" cx="0" cy="80" r="4" fill="rgba(0,0,0,0)" stroke=${c2} stroke-width="2" style="pointer-events: auto; cursor: pointer;"></circle>
    		<circle id="c4" cx="60" cy="0" r="4" fill="rgba(0,0,0,0)" stroke=${c3} stroke-width="2" style="pointer-events: auto; cursor: pointer;"></circle>
    	</svg>
        `
    }

    panelSvg(){
        return `
        <svg style="position: absolute; left: 0px; top: 0px; pointer-events: none; overflow:visible;" xmlns="http://www.w3.org/2000/svg" version="1.1" width="120" height="2000 " >
        	<path id="p0" fill="#2B292B" stroke="none" d="M 15 5 L 5 5 5 15 15 15 15 5 Z"/>
			<path id="p1" fill="#50504E" stroke="none" d="M 25 5 L 25 15 35 15 35 5 25 5 Z"/>
			<path id="p2" fill="#797674" stroke="none" d="M 55 5 L 45 5 45 15 55 15 55 5 Z"/>
			<path id="p3" fill="#A09D9A" stroke="none" d="M 65 15 L 75 15 75 5 65 5 65 15 Z"/>
			<path id="p4" fill="#C9C6C3" stroke="none" d="M 95 15 L 95 5 85 5 85 15 95 15 Z"/>
			<path id="p5" fill="#F8F2EE" stroke="none" d="M 105 15 L 115 15 115 5 105 5 105 15 Z"/>

			<path id="p6" fill="#233684" stroke="none" d="M 15 25 L 5 25 5 35 15 35 15 25 Z"/>
			<path id="p7" fill="#539048" stroke="none" d="M 35 25 L 25 25 25 35 35 35 35 25 Z"/>
			<path id="p8" fill="#A93036" stroke="none" d="M 45 35 L 55 35 55 25 45 25 45 35 Z"/>
			<path id="p9" fill="#EDCF3A" stroke="none" d="M 75 35 L 75 25 65 25 65 35 75 35 Z"/>
			<path id="p10" fill="#B1548F" stroke="none" d="M 95 25 L 85 25 85 35 95 35 95 25 Z"/>
			<path id="p11" fill="#3A7C9D" stroke="none" d="M 115 35 L 115 25 105 25 105 35 115 35 Z"/>

			<path id="p12" fill="#E1A235" stroke="none" d="M 15 45 L 5 45 5 55 15 55 15 45 Z"/>
			<path id="p13" fill="#A3BB48" stroke="none" d="M 35 45 L 25 45 25 55 35 55 35 45 Z"/>
			<path id="p14" fill="#4F3B68" stroke="none" d="M 55 45 L 45 45 45 55 55 55 55 45 Z"/>
			<path id="p15" fill="#B45860" stroke="none" d="M 75 45 L 65 45 65 55 75 55 75 45 Z"/>
			<path id="p16" fill="#6256BF" stroke="none" d="M 95 45 L 85 45 85 55 95 55 95 45 Z"/>
			<path id="p17" fill="#CF7D31" stroke="none" d="M 115 45 L 105 45 105 55 115 55 115 45 Z"/>

			<path id="p18" fill="#6A4E3E" stroke="none" d="M 15 65 L 5 65 5 75 15 75 15 65 Z"/>
			<path id="p19" fill="#BC947F" stroke="none" d="M 35 65 L 25 65 25 75 35 75 35 65 Z"/>
			<path id="p20" fill="#5F7799" stroke="none" d="M 55 65 L 45 65 45 75 55 75 55 65 Z"/>
			<path id="p21" fill="#576940" stroke="none" d="M 75 65 L 65 65 65 75 75 75 75 65 Z"/>
			<path id="p22" fill="#7E7DAB" stroke="none" d="M 95 65 L 85 65 85 75 95 75 95 65 Z"/>
			<path id="p23" fill="#7AB8A7" stroke="none" d="M 115 65 L 105 65 105 75 115 75 115 65 Z"/>
        </svg>
        `
    }

    // EVENT

    addEvent(){

    	const n = this.node;
    	const down =  this.down.bind(this)
    	this.onMove =  this.move.bind(this)
    	this.onUp =  this.up.bind(this)

    	for(let i = 0; i<5; i++){
    		n['c'+i].addEventListener('mousedown', down );
    		//n['c'+i].addEventListener('mouseup', up );
    	}

    }

    down(e) {

		this.point.x = e.clientX;
		this.point.y = e.clientY;
		this.point.down = true;
		this.point.id = e.target.id;

		document.addEventListener('mousemove', this.onMove );
    	document.addEventListener('mouseup', this.onUp );

	}

	up(e) {

		this.point.x = 0;
		this.point.y = 0;
		this.point.down = false;
		this.point.id = '';

		document.removeEventListener('mousemove', this.onMove );
    	document.removeEventListener('mouseup', this.onUp );

	}

	move(e) {

		const p = this.point

		if(!p.down) return;

		let node = this.node[p.id];

		let ox = p.x-Number(node.getAttribute('cx'))
		let oy = p.y-Number(node.getAttribute('cy'))
		let dx = e.clientX-p.x;
		let dy = e.clientY-p.y;
	    p.x = e.clientX;
		p.y = e.clientY;

		if(p.id==='c4'){

			this.moveAll(dx, dy)

		}else{
			node.setAttribute('cx', p.x-ox )
			node.setAttribute('cy', p.y-oy )
		}

		this.upCenter()
	    this.updatelines();
	    if (this.isPosible()) this.update();

	}

	moveAll (x,y){

		let n = this.node

		n.c0.setAttribute('cx', Number(n.c0.getAttribute('cx'))+x )
		n.c0.setAttribute('cy', Number(n.c0.getAttribute('cy'))+y )
		n.c1.setAttribute('cx', Number(n.c1.getAttribute('cx'))+x )
		n.c1.setAttribute('cy', Number(n.c1.getAttribute('cy'))+y )
		n.c2.setAttribute('cx', Number(n.c2.getAttribute('cx'))+x )
		n.c2.setAttribute('cy', Number(n.c2.getAttribute('cy'))+y )
		n.c3.setAttribute('cx', Number(n.c3.getAttribute('cx'))+x )
		n.c3.setAttribute('cy', Number(n.c3.getAttribute('cy'))+y )

	}



}

export const colors = [
[
'rgb(43,41,43)', 'rgb(80,80,78)', 'rgb(122,118,116)', 'rgb(161,157,154)', 'rgb(202,198,195)', 'rgb(249,242,238)',
'rgb(25,55,135)', 'rgb(57,146,64)', 'rgb(186,26,51)', 'rgb(245,205,0)', 'rgb(192,75,145)', 'rgb(0,127,159)',
'rgb(238,158,25)', 'rgb(157,188,54)', 'rgb(83,58,106)', 'rgb(195,79,95)', 'rgb(99,86,196)', 'rgb(222,118,32)',
'rgb(112,76,60)', 'rgb(197,145,125)', 'rgb(87,120,155)', 'rgb(82,106,60)', 'rgb(126,125,174)', 'rgb(98,187,166)'
],
[
'rgb(241,233,229)', 'rgb(229,222,220)', 'rgb(182,178,176)', 'rgb(139,136,135)', 'rgb(99,97,99)', 'rgb(63,61,62)',
'rgb(237,206,186)', 'rgb(211,175,133)', 'rgb(193,149,91)', 'rgb(139,93,61)', 'rgb(74,55,46)', 'rgb(57,54,56)',
'rgb(218,203,201)', 'rgb(203,205,196)', 'rgb(206,203,208)', 'rgb(66,57,58)', 'rgb(54,61,56)', 'rgb(63,60,69)',
'rgb(210,121,117)', 'rgb(216,179,90)', 'rgb(127,175,120)', 'rgb(66,157,179)', 'rgb(116,147,194)', 'rgb(190,121,154)'
]
]

/*export const CheckColors = {

	'1A':{name:'Low Sat. Red', rgb:[210,121,117], adode:[189,121,117] },
	'2A':{name:'Low Sat. Yellow', rgb:[216,179,90], adode:[205,178,96] },
	'3A':{name:'Low Sat. Green', rgb:[127,175,120], adode:[141,174,122] },
	'4A':{name:'Low Sat. Cyan', rgb:[66,157,179], adode:[103,156,177] },
	'5A':{name:'Low Sat. Blue', rgb:[116,147,194], adode:[125,146,191] },
	'6A':{name:'Low Sat. Magenta', rgb:[190,121,154], adode:[172,120,151] },

	'1B':{name:'10% Red Tint', rgb:[218,203,201], adode:[213,202,200] },
	'2B':{name:'10% Green Tint', rgb:[203,205,196], adode:[202,204,195] },
	'3B':{name:'10% Blue Tint', rgb:[206,203,208], adode:[204,201,206] },
	'4B':{name:'90% Red Tone', rgb:[66,57,58], adode:[66,60,60] },
	'5B':{name:'90% Green Tone', rgb:[54,61,56], adode:[59,63,59] },
	'6B':{name:'90% Blue Tone', rgb:[63,60,69], adode:[35,63,71] },

	'1C':{name:'Lightest Skin', rgb:[237,206,186], adode:[225,202,183] },
	'2C':{name:'Lighter Skin', rgb:[211,175,133], adode:[200,174,134] },
	'3C':{name:'Moderate Skin', rgb:[193,149,91], adode:[180,148,96] },
	'4C':{name:'Medium Skin', rgb:[139,93,61], adode:[127,93,65] },
	'5C':{name:'Deep Skin', rgb:[74,55,46], adode:[71,58,50] },
	'6C':{name:'95% Gray', rgb:[57,54,56], adode:[59,57,59] },

	'1D':{name:'5% Gray', rgb:[241,233,229], adode:[238,233,229] },
	'2D':{name:'10% gray', rgb:[229,222,220], adode:[226,221,219] },
	'3D':{name:'30% Gray', rgb:[182,178,176], adode:[180,177,174] },
	'4D':{name:'50% Gray', rgb:[139,136,135], adode:[137, 135, 134] },
	'5D':{name:'70% Gray', rgb:[99,97,99], adode:[99,99,98] },
	'6D':{name:'90% Gray', rgb:[63,61,62], adode:[65,63,64] },

    ///

	'1E':{name:'Card White', rgb:[249,242,238], adode:[247,242,237] },
	'2E':{name:'20% Gray', rgb:[202,198,195], adode:[199,196,193] },
	'3E':{name:'40% Gray', rgb:[161,157,154], adode:[158,156,153] },
	'4E':{name:'60% Gray', rgb:[122,118,116], adode:[120,118,115] },
	'5E':{name:'80% Gray', rgb:[80,80,78], adode:[81,81,79] },
	'6E':{name:'Card Black', rgb:[43,41,43], adode:[46,46,47] },

	'1F':{name:'Primary Cyan', rgb:[0,127,159], adode:[39,126,157] },
	'2F':{name:'Primary Magenta', rgb:[192,75,145], adode:[167,76,141] },
	'3F':{name:'Primary Yellow', rgb:[245,205,0], adode:[234,204,37] },
	'4F':{name:'Primary Red', rgb:[186,26,51], adode:[159,32,53] },
	'5F':{name:'Primary Green', rgb:[57,146,64], adode:[94,145,71] },
	'6F':{name:'Primary Blue', rgb:[25,55,135], adode:[41,58,132] },

	'1G':{name:'Primary Orange', rgb:[222,118,32], adode:[198,117,44] },
	'2G':{name:'Blueprint', rgb:[99,86,196], adode:[70,89,156] },
	'3G':{name:'Pink', rgb:[195,79,95], adode:[170,80,94] },
	'4G':{name:'Violet', rgb:[83,58,106], adode:[78,61,104] },
	'5G':{name:'Apple Green', rgb:[157,188,54], adode:[165,186,69] },
	'6G':{name:'Sunflower', rgb:[238,158,25], adode:[218,157,46] },

	'1H':{name:'Aqua', rgb:[98,187,166], adode:[130,186,166] },
	'2H':{name:'Lavender', rgb:[126,125,174], adode:[125,124,171] },
	'3H':{name:'Evergreen', rgb:[82,106,60], adode:[90,106,65] },
	'4H':{name:'Steel Blue', rgb:[87,120,155], adode:[98,119,152] },
	'5H':{name:'Classic Light Skin', rgb:[197,145,125], adode:[183,144,125] },
	'6H':{name:'Classic Dark Skin', rgb:[112,76,60], adode:[103,77,63] },

}*/