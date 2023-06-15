/*! 
 * quantize.js Copyright 2008 Nick Rabinowitz.
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

 
/**
 * Basic Javascript port of the MMCQ (modified median cut quantization)
 * algorithm from the Leptonica library (http://www.leptonica.com/).
 * Returns a color map you can use to map original pixels to the reduced
 * palette. Still a work in progress.
 * 
 * @author Nick Rabinowitz
 * @example
// array of pixels as [R,G,B] arrays
var myPixels = [[190,197,190], [202,204,200], [207,214,210], [211,214,211], [205,207,207]
                // etc
                ];
var maxColors = 4;
var cmap = MMCQ.quantize(myPixels, maxColors);
var newPalette = cmap.palette();
var newPixels = myPixels.map(function(p) { 
    return cmap.map(p); 
});
 
 */
//var MMCQ = (function() {

    // fill out a couple protovis dependencies
    /*!
    * Block below copied from Protovis: http://mbostock.github.com/protovis/
    * Copyright 2010 Stanford Visualization Group
    * Licensed under the BSD License: http://www.opensource.org/licenses/bsd-license.php
    */
    const pv = {
        map: function(array, f) {
          var o = {};
          return f
              ? array.map(function(d, i) { o.index = i; return f.call(o, d); })
              : array.slice();
        },
        naturalOrder: function(a, b) {
            return (a < b) ? -1 : ((a > b) ? 1 : 0);
        },
        sum: function(array, f) {
          var o = {};
          return array.reduce(f
              ? function(p, d, i) { o.index = i; return p + f.call(o, d); }
              : function(p, d) { return p + d; }, 0);
        },
        max: function(array, f) {
          return Math.max.apply(null, f ? pv.map(array, f) : array);
        }
    }

    // private constants
    var sigbits = 5,
        rshift = 8 - sigbits,
        maxIterations = 1000,
        fractByPopulations = 0.75;
    
    // get reduced-space color index for a pixel
    function getColorIndex(r, g, b) {
        return (r << (2 * sigbits)) + (g << sigbits) + b;
    }
    
    // Simple priority queue
    function PQueue( comparator ) {
        var contents = [],
            sorted = false;
        
        function sort() {
            contents.sort(comparator);
            sorted = true;
        }
        
        return {
            push: function(o) {
                contents.push(o);
                sorted = false;
            },
            peek: function(index) {
                if (!sorted) sort();
                if (index===undefined) index = contents.length - 1;
                return contents[index];
            },
            pop: function() {
                if (!sorted) sort();
                return contents.pop();
            },
            size: function() {
                return contents.length;
            },
            map: function(f) {
                return contents.map(f);
            },
            debug: function() {
                if (!sorted) sort();
                return contents;
            }
        };
    }

    





    
    // histo (1-d array, giving the number of pixels in
    // each quantized region of color space), or null on error

    function getHisto( pixels ) {

        var histosize = 1 << (3 * sigbits), histo = new Array(histosize), index, rval, gval, bval;

        pixels.forEach(function(pixel) {
            rval = pixel[0] >> rshift;
            gval = pixel[1] >> rshift;
            bval = pixel[2] >> rshift;
            index = getColorIndex(rval, gval, bval);
            histo[index] = (histo[index] || 0) + 1;
        });
        return histo;

    }
    
    function vboxFromPixels( pixels, histo ) {

        var rmin=1000000, rmax=0, gmin=1000000, gmax=0, bmin=1000000, bmax=0, rval, gval, bval;
        // find min/max
        pixels.forEach(function(pixel) {
            rval = pixel[0] >> rshift;
            gval = pixel[1] >> rshift;
            bval = pixel[2] >> rshift;
            if (rval < rmin) rmin = rval;
            else if (rval > rmax) rmax = rval;
            if (gval < gmin) gmin = gval;
            else if (gval > gmax) gmax = gval;
            if (bval < bmin) bmin = bval;
            else if (bval > bmax)  bmax = bval;
        });
        return new VBox(rmin, rmax, gmin, gmax, bmin, bmax, histo);

    }
    
    function medianCutApply( histo, vbox ) {

        if (!vbox.count()) return;
        
        var rw = vbox.r2 - vbox.r1 + 1, gw = vbox.g2 - vbox.g1 + 1, bw = vbox.b2 - vbox.b1 + 1, maxw = pv.max([rw, gw, bw]);
        // only one pixel, no split
        if (vbox.count() == 1) {
            return [vbox.copy()]
        }
        /* Find the partial sum arrays along the selected axis. */
        var total = 0,
            partialsum = [],
            lookaheadsum = [],
            i, j, k, sum, index;
        if (maxw == rw) {
            for (i = vbox.r1; i <= vbox.r2; i++) {
                sum = 0;
                for (j = vbox.g1; j <= vbox.g2; j++) {
                    for (k = vbox.b1; k <= vbox.b2; k++) {
                        index = getColorIndex(i,j,k);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        else if (maxw == gw) {
            for (i = vbox.g1; i <= vbox.g2; i++) {
                sum = 0;
                for (j = vbox.r1; j <= vbox.r2; j++) {
                    for (k = vbox.b1; k <= vbox.b2; k++) {
                        index = getColorIndex(j,i,k);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        else {  /* maxw == bw */
            for (i = vbox.b1; i <= vbox.b2; i++) {
                sum = 0;
                for (j = vbox.r1; j <= vbox.r2; j++) {
                    for (k = vbox.g1; k <= vbox.g2; k++) {
                        index = getColorIndex(j,k,i);
                        sum += (histo[index] || 0);
                    }
                }
                total += sum;
                partialsum[i] = total;
            }
        }
        partialsum.forEach(function(d,i) { 
            lookaheadsum[i] = total-d 
        });

        function doCut(color) {
            var dim1 = color + '1',
                dim2 = color + '2', 
                left, right, vbox1, vbox2, d2, count2=0;
            for (i = vbox[dim1]; i <= vbox[dim2]; i++) {
                if (partialsum[i] > total / 2) {
                    vbox1 = vbox.copy();
                    vbox2 = vbox.copy();
                    left = i - vbox[dim1];
                    right = vbox[dim2] - i;
                    if (left <= right)
                        d2 = Math.min(vbox[dim2] - 1, ~~(i + right / 2));
                    else d2 = Math.max(vbox[dim1], ~~(i - 1 - left / 2));
                    // avoid 0-count boxes
                    while (!partialsum[d2]) d2++;
                    count2 = lookaheadsum[d2];
                    while (!count2 && partialsum[d2-1]) count2 = lookaheadsum[--d2];
                    // set dimensions
                    vbox1[dim2] = d2;
                    vbox2[dim1] = vbox1[dim2] + 1;
                    //console.log('vbox counts:', vbox.count(), vbox1.count(), vbox2.count());
                    return [vbox1, vbox2];
                }
            }
        
        }
        // determine the cut planes
        return maxw == rw ? doCut('r') : maxw == gw ? doCut('g') : doCut('b');

    }

    function quantize( pixels, maxcolors ) {

        // short-circuit
        if ( !pixels.length || maxcolors < 2 || maxcolors > 256 ) {
            console.log('wrong number of maxcolors');
            return false;
        }
        
        // XXX: check color content and convert to grayscale if insufficient
        
        var histo = getHisto(pixels), histosize = 1 << (3 * sigbits);
        
        // check that we aren't below maxcolors already
        var nColors = 0;
        histo.forEach(function() { nColors++ });
        //if (nColors <= maxcolors) {
            // XXX: generate the new colors from the histo and return
        //}
        
        // get the beginning vbox from the colors
        var vbox = vboxFromPixels(pixels, histo),
            pq = new PQueue(function(a,b) { return pv.naturalOrder(a.count(), b.count()) });
        pq.push(vbox);
        
        // inner function to do the iteration
        function iter( lh, target ) {
            var ncolors = 1,
                niters = 0,
                vbox;
            while (niters < maxIterations) {
                vbox = lh.pop();
                if (!vbox.count())  { /* just put it back */
                    lh.push(vbox);
                    niters++;
                    continue;
                }
                // do the cut
                var vboxes = medianCutApply(histo, vbox),
                    vbox1 = vboxes[0],
                    vbox2 = vboxes[1];
                    
                if (!vbox1) {
                    console.log("vbox1 not defined; shouldn't happen!");
                    return;
                }
                lh.push(vbox1);
                if (vbox2) {  /* vbox2 can be null */
                    lh.push(vbox2);
                    ncolors++;
                }
                if (ncolors >= target) return;
                if (niters++ > maxIterations) {
                    console.log("infinite loop; perhaps too few pixels!");
                    return;
                }
            }
        }
        
        // first set of colors, sorted by population
        iter( pq, fractByPopulations * maxcolors );
        // console.log(pq.size(), pq.debug().length, pq.debug().slice());
        
        // Re-sort by the product of pixel occupancy times the size in color space.
        var pq2 = new PQueue(function(a,b) { 
            return pv.naturalOrder(a.count()*a.volume(), b.count()*b.volume()) 
        });

        while ( pq.size() ) { pq2.push(pq.pop()); }
        
        // next set - generate the median cuts using the (npix * vol) sorting.
        iter( pq2, maxcolors - pq2.size() );
        
        // calculate the actual colors
        var cmap = new CMap();
        while (pq2.size()) { cmap.push(pq2.pop()); }
        
        return cmap;

    }
    
/*    return { 
        quantize: quantize
    }

})();*/



var URL = (window.URL || window.webkitURL);

var adaptive = true;

var canvas = null, context, w, h;

var colors = [];
var maxCount = 0;
var highestColor = '';
var ambientColor = '';
var luminousColor = '';
var darkerColor = '';

var range = {

    lumTargetDark: 0.26,
    lumMaxDark: 0.45,

    lumMinLight : 0.55,
    lumTargetLight : 0.74,

    lumMinNormal : 0.3,
    lumTargetNormal : 0.5,
    lumMaxNormal : 0.7,

    satTargetMuted : 0.3,
    satMaxMuted : 0.4,

    satTargetVibrant : 1.0,
    satMinVibrant : 0.35,

    satWeight : 3,
    lumWeight : 6.5,
    nWeight : 0.5,

};

var vibrants = {};



var adaptiveRange = {};

var slice = [].slice;


export const ImgTool = {

    format:'html',
    //format:'hex',

    makeCanvasFromImage: function ( image ) {

        if( canvas === null ) canvas = document.createElement('canvas');
        context = canvas.getContext('2d',{ willReadFrequently: true });
        w = canvas.width  = image.width;
        h = canvas.height = image.height;
        context.drawImage( image, 0, 0, w, h );

    },

    makeCanvasFromData: function ( data ) {

        if( canvas === null ) canvas = document.createElement('canvas');
        context = canvas.getContext('2d',{ willReadFrequently: true });
        w = canvas.width  = data.w;
        h = canvas.height = data.h;
        let dt = context.createImageData( w, h )
        let k = dt.data.length
        while(k--) dt.data[k] = data.data[k]
        context.putImageData( dt, 0, 0 )

    },

    clear: function() {

        context.clearRect(0, 0, w, h);

    },

    getImageData: function() {

        return context.getImageData(0, 0, w, h);

    },
    
    getPalette: function( sourceImage, colorCount, Quality ) {

        //this.makeCanvasFromImage( sourceImage );
        this.makeCanvasFromData( sourceImage )

        colorCount = colorCount || 64; // between 2 and 256
        var quality = Math.round( w / 256 ); // pixel space less = more quality & calculation

        if( Quality !== undefined ) quality = Quality;


        // Create custom CanvasImage object
        
        var imageData  = this.getImageData();
        var pixelCount = w * h;

        var pixelArray = this.createPixelArray( imageData.data, pixelCount, quality );

        // Send array to quantize function which clusters values
        // using median cut algorithm
        var cmap = quantize( pixelArray, colorCount );

        // color palette of full color
        //var palette = cmap ? cmap.palette() : null;

        colors = cmap.colors();

        //console.log(colors)

        this.getRange();

        var r = adaptive ? adaptiveRange : range;

        vibrants = {
            
            vibrant : this.findColorVariation( r.lumTargetNormal, r.lumMinNormal, r.lumMaxNormal, r.satTargetVibrant, r.satMinVibrant, 1),
            lightVibrant: this.findColorVariation(r.lumTargetLight, r.lumMinLight, 1, r.satTargetVibrant, r.satMinVibrant, 1),
            darkVibrant : this.findColorVariation(r.lumTargetDark, 0, r.lumMaxDark, r.satTargetVibrant, r.satMinVibrant, 1),
            muted : this.findColorVariation( r.lumTargetNormal, r.lumMinNormal, r.lumMaxNormal, r.satTargetMuted, 0, r.satMaxMuted),
            lightMuted : this.findColorVariation(r.lumTargetLight, r.lumMinLight, 1, r.satTargetMuted, 0, r.satMaxMuted),
            darkMuted : this.findColorVariation(r.lumTargetDark, 0, r.lumMaxDark, r.satTargetMuted, 0, r.satMaxMuted, true),
            highest : highestColor,
            ambient : ambientColor,
            maxLuma: luminousColor,
            minLuma: darkerColor,
        }



        this.clear();

        //if( this.format === 'hex' ) ImgTool.getHex();

        return vibrants;

    },

    getHex: function () {

        let vibrantsHex = {}

        for( var c in vibrants ){
            
            if( vibrants[c]!==undefined ) vibrantsHex[c] = Tools.htmlToHex( vibrants[c] );
        }

        return vibrantsHex

    },

    getRange: function () {

        var count = 0;
        var minLuma = 1;
        var maxLuma = 0;

        var minSat = 1;
        var maxSat = 0;
        var i = colors.length;

        var g = [0,0,0];
        var gn = 0;
        var n = 0;
        
        while( i-- ){ 

            n = colors[i].count;

            count = Math.max( count, n );

            minLuma = Math.min( minLuma, colors[i].hsl[2] );
            maxLuma = Math.max( maxLuma, colors[i].hsl[2] );

            minSat = Math.min( minSat, colors[i].hsl[1] );
            maxSat = Math.max( maxSat, colors[i].hsl[1] );

            g[0] += colors[i].rgb[0] * n;
            g[1] += colors[i].rgb[1] * n;
            g[2] += colors[i].rgb[2] * n;
            gn += n;

        }

        g[0] /= gn;
        g[1] /= gn;
        g[2] /= gn;

        ambientColor = Tools.getHtml( g );

       
        var lumaRange = (maxLuma - minLuma);
        var satRange = (maxSat - minSat);

        var min = 0;

        if(adaptive) {


            // luminosity
            //min = minLuma;
            adaptiveRange.lumTargetDark = min + range.lumTargetDark * lumaRange;
            adaptiveRange.lumMaxDark = min + range.lumMaxDark * lumaRange;
            adaptiveRange.lumMinLight = min + range.lumMinLight * lumaRange;
            adaptiveRange.lumTargetLight = min + range.lumTargetLight * lumaRange;
            adaptiveRange.lumMinNormal = min + range.lumMinNormal * lumaRange;
            adaptiveRange.lumTargetNormal = min + range.lumTargetNormal * lumaRange;
            adaptiveRange.lumMaxNormal = min + range.lumMaxNormal * lumaRange;

            adaptiveRange.lumWeight = min + range.lumWeight * lumaRange;

            

            // saturation
            //min = minSat;
            adaptiveRange.satTargetMuted = min + range.satTargetMuted * satRange;
            adaptiveRange.satMaxMuted = min + range.satMaxMuted * satRange;
            //adaptiveRange.satTargetVibrant = min + range.satTargetVibrant * satRange;
            //adaptiveRange.satMinVibrant = min + range.satMinVibrant * satRange;

            adaptiveRange.satTargetVibrant = maxSat;
            adaptiveRange.satMinVibrant = minSat;

            adaptiveRange.satWeight = min + range.satWeight * satRange;

        } else {

            adaptiveRange = range;

        }

        

        //console.log( lumaRange, satRange, colors.length )

        maxCount = count;

        var i = colors.length;
        while( i-- ){
            if( colors[i].count === maxCount ) highestColor = colors[i].hex;
            if( colors[i].hsl[2] === maxLuma ) luminousColor = colors[i].hex;
            if( colors[i].hsl[2] === minLuma ) darkerColor = colors[i].hex;
        }

    },

    findColorVariation: function( targetLuma, minLuma, maxLuma, targetSaturation, minSaturation, maxSaturation, tt ) {

        let j, len, luma, maxValue, sat, c, value;
        let color = null;
       
        maxValue = 0;
        for (j = 0, len = colors.length; j < len; j++) {
            c = colors[j];
            sat = c.hsl[1];
            luma = c.hsl[2];

            //if( tt ) console.log( sat <= maxSaturation , luma <= maxLuma )

            //if( tt ) console.log(sat >= minSaturation && sat <= maxSaturation && luma >= minLuma && luma <= maxLuma && !c.select)
            
            if ( sat >= minSaturation && sat <= maxSaturation && luma >= minLuma && luma <= maxLuma && !c.select ) {
                value = this.createComparisonValue( sat, targetSaturation, luma, targetLuma, c.count );

                if ( color === null || value > maxValue ) {

                   color = c;
                   maxValue = value;
                }
            }
        }

        if( color !== null ){ 
            color.select = true;
            return color.hex;
        } else {
            
            return '#000'
        }
        
    },

    createComparisonValue: function( saturation, targetSaturation, luma, targetLuma, count ) {
        return this.weightedMean( this.invertDiff( saturation, targetSaturation ), adaptiveRange.satWeight, this.invertDiff( luma, targetLuma ), adaptiveRange.lumWeight, count / maxCount, range.nWeight );
    },

    invertDiff: function( value, targetValue ) {

        return 1 - Math.abs( value - targetValue );

    },

    weightedMean: function() {

        var i, sum, sumWeight, value, values, weight;
        values = 1 <= arguments.length ? slice.call(arguments, 0) : [];
        sum = 0;
        sumWeight = 0;
        i = 0;
        while ( i < values.length ) {
            value = values[i];
            weight = values[i + 1];
            sum += value * weight;
            sumWeight += weight;
            i += 2;
        }
        return sum / sumWeight;

    },


    createPixelArray : function ( imgData, pixelCount, quality ) {

        var pixels = imgData;
        var pixelArray = [];

        for ( var i = 0, offset, r, g, b, a; i < pixelCount; i = i + quality ) {

            offset = i * 4;
            r = pixels[offset + 0];
            g = pixels[offset + 1];
            b = pixels[offset + 2];
            a = pixels[offset + 3];

            // If pixel is mostly opaque and not white
            if (typeof a === 'undefined' || a >= 125) {
                if (!(r > 250 && g > 250 && b > 250)) {
                    pixelArray.push([r, g, b]);
                }
            }
        }

        return pixelArray;

    },


    getColorFromUrl: function( url, callback ) {

        var _this = this;

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'blob';
        xhr.onload = function() {
            if ( xhr.readyState === 2 ) { 
            } else if ( xhr.readyState === 3 ) { 
            } else if ( xhr.readyState === 4 ) {
                if ( xhr.status === 200 || xhr.status === 0 ) {
                    
                    var img = new Image();

                    img.onload = function(e) {
                        URL.revokeObjectURL( img.src );
                        callback( _this.getPalette( img ), img );
                    };

                    img.src = URL.createObjectURL( xhr.response );

                }
                else console.error( "Couldn't load [image] [" + xhr.status + "]" );
            }
        }

        xhr.send();

    },

}





// color conversion

const Tools = {

    getHtml: function(rgb) {

        return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1, 7);

    },

    getHsl: function( rgb ) {

        var d, h, l, max, min, s;
        var r = rgb[0]/255;
        var g = rgb[1]/255;
        var b = rgb[2]/255;
        max = Math.max(r, g, b);
        min = Math.min(r, g, b);
        h = 0;
        s = 0;
        l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];

    },

    htmlToHex: function ( v ) { 
        return  v.toUpperCase().replace( "#", "0x" );
    },

    hexToHtml: function ( v ) {
        v = v === undefined ? 0x000000 : v;
        return "#" + ("000000" + v.toString(16)).substr(-6);
    },

}



    
// 3d color space box

class VBox {

    constructor ( r1, r2, g1, g2, b1, b2, histo ) {

        var vbox = this;
        vbox.r1 = r1;
        vbox.r2 = r2;
        vbox.g1 = g1;
        vbox.g2 = g2;
        vbox.b1 = b1;
        vbox.b2 = b2;
        vbox.histo = histo;

    }

    volume ( force ) {

        var vbox = this;
        if (!vbox._volume || force) {
            vbox._volume = ((vbox.r2 - vbox.r1 + 1) * (vbox.g2 - vbox.g1 + 1) * (vbox.b2 - vbox.b1 + 1));
        }
        return vbox._volume;

    }

    count ( force ) {

        var vbox = this, histo = vbox.histo;

        if (!vbox._count_set || force) {
            var npix = 0, i, j, k, index;
            for (i = vbox.r1; i <= vbox.r2; i++) {
                for (j = vbox.g1; j <= vbox.g2; j++) {
                    for (k = vbox.b1; k <= vbox.b2; k++) {
                        index = getColorIndex(i,j,k);
                        npix += (histo[index] || 0);
                    }
                }
            }
            vbox._count = npix;
            vbox._count_set = true;
        }
        return vbox._count;

    }

    copy () {

        var vbox = this;
        return new VBox(vbox.r1, vbox.r2, vbox.g1, vbox.g2, vbox.b1, vbox.b2, vbox.histo);

    }

    avg ( force ) {
        var vbox = this,
            histo = vbox.histo;
        if (!vbox._avg || force) {
            var ntot = 0, mult = 1 << (8 - sigbits), rsum = 0, gsum = 0, bsum = 0, hval, i, j, k, histoindex;
            for (i = vbox.r1; i <= vbox.r2; i++) {
                for (j = vbox.g1; j <= vbox.g2; j++) {
                    for (k = vbox.b1; k <= vbox.b2; k++) {
                        histoindex = getColorIndex(i,j,k);
                        hval = histo[histoindex] || 0;
                        ntot += hval;
                        rsum += (hval * (i + 0.5) * mult);
                        gsum += (hval * (j + 0.5) * mult);
                        bsum += (hval * (k + 0.5) * mult);
                    }
                }
            }
            if (ntot) {
                vbox._avg = [~~(rsum/ntot), ~~(gsum/ntot), ~~(bsum/ntot)];
            } else {
                //console.log('empty box');
                vbox._avg = [
                    ~~(mult * (vbox.r1 + vbox.r2 + 1) / 2),
                    ~~(mult * (vbox.g1 + vbox.g2 + 1) / 2),
                    ~~(mult * (vbox.b1 + vbox.b2 + 1) / 2)
                ];
            }
        }
        return vbox._avg;
    }

    contains ( pixel ) {

        var vbox = this, rval = pixel[0] >> rshift; 
        var gval = pixel[1] >> rshift;
        var bval = pixel[2] >> rshift;
        return (rval >= vbox.r1 && rval <= vbox.r2 && gval >= vbox.g1 && rval <= vbox.g2 && bval >= vbox.b1 && rval <= vbox.b2);

    }

}
    
    
 // Color map

class CMap {

    constructor() {

        this.vboxes = new PQueue(function(a,b) { 
            return pv.naturalOrder(
                a.vbox.count()*a.vbox.volume(), 
                b.vbox.count()*b.vbox.volume()
            )
        });

    }

    push ( vbox ) {
        this.vboxes.push({ vbox: vbox, color: vbox.avg() });
    }

    palette () {
        return this.vboxes.map( function(vb) { return vb.color } );
    }

    colors () {

        var c = [];

        this.vboxes.map( function(vb) {
            
            var count = vb.vbox.count() || 0;
            var color = vb.color;
            if( count ) c.push({ rgb:color, hsl:Tools.getHsl( color ), hex:Tools.getHtml( color ), count:count, select:false });

        });

        return c;

    }

    size () {
        return this.vboxes.size();
    }

    map (color) {
        var vboxes = this.vboxes;
        for (var i=0; i<vboxes.size(); i++) {
            if (vboxes.peek(i).vbox.contains(color)) {
                return vboxes.peek(i).color;
            }
        }
        return this.nearest(color);
    }

    nearest (color) {
        var vboxes = this.vboxes,
            d1, d2, pColor;
        for (var i=0; i<vboxes.size(); i++) {
            d2 = Math.sqrt(
                Math.pow(color[0] - vboxes.peek(i).color[0], 2) +
                Math.pow(color[1] - vboxes.peek(i).color[1], 2) +
                Math.pow(color[1] - vboxes.peek(i).color[1], 2)
            );
            if (d2 < d1 || d1 === undefined) {
                d1 = d2;
                pColor = vboxes.peek(i).color;
            }
        }
        return pColor;
    }

    forcebw () {
        // XXX: won't  work yet
        var vboxes = this.vboxes;
        vboxes.sort(function(a,b) { return pv.naturalOrder(pv.sum(a.color), pv.sum(b.color) )});
        
        // force darkest color to black if everything < 5
        var lowest = vboxes[0].color;
        if (lowest[0] < 5 && lowest[1] < 5 && lowest[2] < 5)
            vboxes[0].color = [0,0,0];
        
        // force lightest color to white if everything > 251
        var idx = vboxes.length-1,
            highest = vboxes[idx].color;
        if (highest[0] > 251 && highest[1] > 251 && highest[2] > 251)
            vboxes[idx].color = [255,255,255];
    }

}