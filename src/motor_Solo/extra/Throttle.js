function  throttle( func, limit )  {

    let lastFunc;
    let lastRan;

    return  function()  {

        const context =  this;

        const args = arguments;

        if  (!lastRan)  {

            func.apply(context, args);

            lastRan = Date.now();

        }  else  {

        clearTimeout(lastFunc);

        lastFunc =  setTimeout(function()  {

            if  ((Date.now()  - lastRan)  >= limit)  {

            func.apply(context, args);

            lastRan = Date.now();

        }

    }, limit -  (Date.now()  - lastRan));

}

}

}


// exemple

/*

window.addEventListener('resize',  throttle( function()  {

    console.log('Resize event');

},  200));

*/